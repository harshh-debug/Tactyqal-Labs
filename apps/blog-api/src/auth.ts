import { createHash, randomBytes } from 'node:crypto';
import type { Pool } from 'pg';
import type { Request } from 'express';
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
export const sessionHours = 8;
export async function sessionEditor(pool: Pool, req: Request) {
    const token = req.headers.authorization?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];
    if (!token)
        return null;
    const r = await pool.query('SELECT editor_id FROM editor_sessions WHERE token_hash=$1 AND expires_at>now()', [hashToken(token)]);
    return r.rows[0]?.editor_id as string | undefined;
}
export async function createSession(pool: Pool, editorId: string) {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + sessionHours * 60 * 60 * 1000);
    await pool.query('DELETE FROM editor_sessions WHERE expires_at<=now()');
    await pool.query('INSERT INTO editor_sessions(editor_id,token_hash,expires_at) VALUES($1,$2,$3)', [editorId, hashToken(token), expiresAt]);
    return { token, expiresAt: expiresAt.toISOString() };
}
