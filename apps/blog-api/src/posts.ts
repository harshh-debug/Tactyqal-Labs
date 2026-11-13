import type { Pool, PoolClient } from 'pg';
import type { AdminPost, Post, PostSummary } from '@tactyqal/contracts';
export const projection = `p.id,p.title,p.slug,p.excerpt,p.cover_path AS "coverPath",p.cover_alt AS "coverAlt",
  p.published_at AS "publishedAt",json_build_object('id',c.id,'slug',c.slug,'name',c.name) AS category,
  json_build_object('displayName',e.display_name) AS author`;
export const joins = 'FROM posts p JOIN categories c ON c.id=p.category_id JOIN editors e ON e.id=p.author_id';
export const publicWhere = "p.status='published' AND p.published_at IS NOT NULL";
export function serialize<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
export async function readAdmin(pool: Pool | PoolClient, id: string): Promise<AdminPost | null> {
    const r = await pool.query(`SELECT ${projection},p.body,p.status,p.first_published_at AS "firstPublishedAt",p.created_at AS "createdAt",p.updated_at AS "updatedAt" ${joins} WHERE p.id=$1`, [id]);
    return r.rows[0] ? serialize(r.rows[0]) : null;
}
export async function readPublic(pool: Pool, slug: string): Promise<Post | null> {
    const r = await pool.query(`SELECT ${projection},p.body ${joins} WHERE ${publicWhere} AND p.slug=$1`, [slug]);
    return r.rows[0] ? serialize(r.rows[0]) : null;
}
export async function listPublic(pool: Pool, { q, category, page }: {
    q: string;
    category: string;
    page: number;
}) {
    const search = '%' + q.replace(/[\\%_]/g, '\\$&') + '%';
    const values = [q, search, category];
    const where = `${publicWhere} AND ($1='' OR p.title ILIKE $2 ESCAPE '\\' OR p.excerpt ILIKE $2 ESCAPE '\\') AND ($3='' OR c.slug=$3)`;
    const client = await pool.connect();
    try {
        await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
        const count = await client.query(`SELECT count(*)::int AS total ${joins} WHERE ${where}`, values);
        const result = await client.query(`SELECT ${projection} ${joins} WHERE ${where} ORDER BY p.published_at DESC,p.id DESC LIMIT 9 OFFSET $4`, [...values, (page - 1) * 9]);
        await client.query('COMMIT');
        const total = count.rows[0].total as number;
        return { items: serialize(result.rows) as PostSummary[], pagination: { page, pageSize: 9, total, totalPages: Math.ceil(total / 9) } };
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
}
