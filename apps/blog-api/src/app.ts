import express, { type ErrorRequestHandler, type RequestHandler } from 'express';
import type { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { listQuerySchema, loginSchema, pageSchema, postInputSchema, slugSchema } from '@tactyqal/contracts';
import { createSession, hashToken, sessionEditor } from './auth.ts';
import { joins, listPublic, projection, readAdmin, readPublic, serialize } from './posts.ts';
class HttpError extends Error {
    constructor(public status: number, public code: string, message: string, public fieldErrors?: Record<string, string[]>) { super(message); }
}
function validate<T>(schema: z.ZodType<T>, input: unknown): T {
    const parsed = schema.safeParse(input);
    if (!parsed.success)
        throw new HttpError(422, 'VALIDATION', 'Check the highlighted fields.', z.flattenError(parsed.error).fieldErrors as Record<string, string[]>);
    return parsed.data;
}
const idSchema = z.uuid();
export function createApp(pool: Pool) {
    const app = express();
    app.disable('x-powered-by');
    app.set('trust proxy', false);
    app.use((_req, res, next) => { res.set({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Cache-Control': 'no-store' }); next(); });
    app.use('/api/v1/auth/login', express.json({ limit: '8kb' }));
    app.use(express.json({ limit: '256kb' }));
    app.get('/health/live', (_req, res) => { res.json({ status: 'ok' }); });
    app.get('/health/ready', async (_req, res) => { try {
        await pool.query('SELECT 1');
        res.json({ status: 'ready' });
    }
    catch {
        res.status(503).json({ status: 'unavailable' });
    } });
    const attempts = new Map<string, {
        count: number;
        reset: number;
    }>();
    app.post('/api/v1/auth/login', async (req, res) => {
        const key = req.socket.remoteAddress || 'unknown';
        const now = Date.now();
        for (const [k, v] of attempts)
            if (v.reset <= now)
                attempts.delete(k);
        const entry = attempts.get(key) || { count: 0, reset: now + 15 * 60 * 1000 };
        entry.count++;
        attempts.set(key, entry);
        if (entry.count > 20) {
            res.set('Retry-After', String(Math.ceil((entry.reset - now) / 1000)));
            throw new HttpError(429, 'RATE_LIMIT', 'Too many sign-in attempts. Try again in 15 minutes.');
        }
        const credentials = validate(loginSchema, req.body);
        const editor = await pool.query('SELECT id,password_hash FROM editors WHERE email=$1', [credentials.email]);
        // Always perform a password comparison, including unknown accounts.
        const dummy = '$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
        const valid = await bcrypt.compare(credentials.password, editor.rows[0]?.password_hash || dummy);
        if (!editor.rowCount || !valid)
            throw new HttpError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
        res.json(await createSession(pool, editor.rows[0].id));
    });
    const authenticated: RequestHandler = async (req, res, next) => {
        const editorId = await sessionEditor(pool, req);
        if (!editorId)
            throw new HttpError(401, 'SESSION_EXPIRED', 'Please sign in again.');
        res.locals.editorId = editorId;
        next();
    };
    app.post('/api/v1/auth/logout', authenticated, async (req, res) => { await pool.query('DELETE FROM editor_sessions WHERE token_hash=$1', [hashToken(req.headers.authorization!.slice(7))]); res.sendStatus(204); });
    app.get('/api/v1/categories', async (_req, res) => { res.json((await pool.query('SELECT id,name,slug FROM categories ORDER BY name')).rows); });
    app.get('/api/v1/posts', async (req, res) => { res.json(await listPublic(pool, validate(listQuerySchema, req.query))); });
    app.get('/api/v1/posts/:slug', async (req, res) => {
        const valid = slugSchema.safeParse(req.params.slug);
        if (!valid.success)
            throw new HttpError(404, 'NOT_FOUND', 'Article not found.');
        const post = await readPublic(pool, valid.data);
        if (!post)
            throw new HttpError(404, 'NOT_FOUND', 'Article not found.');
        res.json(post);
    });
    app.use('/api/v1/admin', authenticated);
    app.get('/api/v1/admin/posts', async (req, res) => {
        const { page, status } = validate(z.object({ page: pageSchema, status: z.enum(['', 'draft', 'published']).default('') }), req.query);
        const count = await pool.query("SELECT count(*)::int AS total FROM posts WHERE ($1='' OR status=$1)", [status]);
        const r = await pool.query(`SELECT ${projection},p.status,p.updated_at AS "updatedAt" ${joins} WHERE ($1='' OR p.status=$1) ORDER BY p.updated_at DESC,p.id DESC LIMIT 9 OFFSET $2`, [status, (page - 1) * 9]);
        const total = count.rows[0].total as number;
        res.json({ items: serialize(r.rows), pagination: { page, pageSize: 9, total, totalPages: Math.ceil(total / 9) } });
    });
    app.get('/api/v1/admin/posts/:id', async (req, res) => { const post = await readAdmin(pool, validate(idSchema, req.params.id)); if (!post)
        throw new HttpError(404, 'NOT_FOUND', 'Post not found.'); res.json(post); });
    app.post('/api/v1/admin/posts', async (req, res) => {
        const input = validate(postInputSchema, req.body);
        if (input.status !== 'draft')
            throw new HttpError(422, 'VALIDATION', 'Create a draft before publishing.');
        const r = await pool.query('INSERT INTO posts(title,slug,excerpt,body,category_id,cover_path,cover_alt,author_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id', [input.title, input.slug, input.excerpt, input.body, input.categoryId, input.coverPath, input.coverAlt, res.locals.editorId]);
        res.status(201).json(await readAdmin(pool, r.rows[0].id));
    });
    app.patch('/api/v1/admin/posts/:id', async (req, res) => {
        const id = validate(idSchema, req.params.id), input = validate(postInputSchema, req.body);
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const old = await client.query('SELECT slug,status,first_published_at FROM posts WHERE id=$1 FOR UPDATE', [id]);
            if (!old.rowCount)
                throw new HttpError(404, 'NOT_FOUND', 'Post not found.');
            if (old.rows[0].first_published_at && old.rows[0].slug !== input.slug)
                throw new HttpError(422, 'SLUG_LOCKED', 'A previously published URL cannot change.', { slug: ['This article has been public. Its URL is locked.'] });
            await client.query(`UPDATE posts SET title=$2,slug=$3,excerpt=$4,body=$5,category_id=$6,cover_path=$7,cover_alt=$8,status=$9,
        first_published_at=CASE WHEN $9='published' THEN coalesce(first_published_at,clock_timestamp()) ELSE first_published_at END,
        published_at=CASE WHEN $9='draft' THEN NULL WHEN status='published' THEN published_at ELSE clock_timestamp() END,
        updated_at=clock_timestamp() WHERE id=$1`, [id, input.title, input.slug, input.excerpt, input.body, input.categoryId, input.coverPath, input.coverAlt, input.status]);
            const saved = await readAdmin(client, id);
            await client.query('COMMIT');
            res.json(saved);
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    });
    app.delete('/api/v1/admin/posts/:id', async (req, res) => { const r = await pool.query('DELETE FROM posts WHERE id=$1', [validate(idSchema, req.params.id)]); if (!r.rowCount)
        throw new HttpError(404, 'NOT_FOUND', 'Post not found.'); res.sendStatus(204); });
    app.use((_req, _res) => { throw new HttpError(404, 'NOT_FOUND', 'Endpoint not found.'); });
    const errors: ErrorRequestHandler = (error, _req, res, _next) => {
        if (error instanceof HttpError) {
            res.status(error.status).json({ error: { code: error.code, message: error.message, ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}) } });
            return;
        }
        if (error.code === '23505') {
            res.status(409).json({ error: { code: 'SLUG_CONFLICT', message: 'That URL is already used, including by a draft.', fieldErrors: { slug: ['Choose a different URL.'] } } });
            return;
        }
        if (error.code === '23503') {
            res.status(422).json({ error: { code: 'VALIDATION', message: 'Choose an existing category.', fieldErrors: { categoryId: ['Choose an existing category.'] } } });
            return;
        }
        if (error.type === 'entity.too.large') {
            res.status(413).json({ error: { code: 'BODY_TOO_LARGE', message: 'This request is too large.' } });
            return;
        }
        if (error instanceof SyntaxError) {
            res.status(400).json({ error: { code: 'MALFORMED_JSON', message: 'Send valid JSON.' } });
            return;
        }
        console.error('API request failed', { code: typeof error.code === 'string' ? error.code : 'UNKNOWN' });
        res.status(503).json({ error: { code: 'UNAVAILABLE', message: 'The publication is temporarily unavailable. Try again.' } });
    };
    app.use(errors);
    return app;
}
