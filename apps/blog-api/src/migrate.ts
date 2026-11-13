import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import type { Pool } from 'pg';
import { createPool } from './database.ts';
export async function migrate(pool: Pool) {
    const directory = new URL('../db/migrations/', import.meta.url);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('SELECT pg_advisory_xact_lock(864820241)');
        await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, hash text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
        for (const name of (await readdir(directory)).filter(n => n.endsWith('.sql')).sort()) {
            const sql = await readFile(new URL(name, directory), 'utf8');
            const hash = createHash('sha256').update(sql).digest('hex');
            const existing = await client.query('SELECT hash FROM schema_migrations WHERE name=$1', [name]);
            if (existing.rowCount) {
                if (existing.rows[0].hash !== hash)
                    throw new Error(`Applied migration changed: ${name}`);
                continue;
            }
            await client.query(sql);
            await client.query('INSERT INTO schema_migrations(name,hash) VALUES($1,$2)', [name, hash]);
        }
        await client.query('COMMIT');
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const pool = createPool(process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL);
    try {
        await migrate(pool);
        console.log('Migrations applied.');
    }
    finally {
        await pool.end();
    }
}
