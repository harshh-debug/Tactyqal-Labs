import { Pool } from 'pg';
import { z } from 'zod';
export function createPool(connectionString = process.env.DATABASE_URL) {
    const url = z.string().url().parse(connectionString);
    if (!['postgres:', 'postgresql:'].includes(new URL(url).protocol))
        throw new Error('A PostgreSQL connection is required.');
    const pool = new Pool({ connectionString: url, max: 5, connectionTimeoutMillis: 5000, idleTimeoutMillis: 30000, statement_timeout: 10000 });
    pool.on('error', () => console.error('An idle PostgreSQL connection was lost. The pool will reconnect.'));
    return pool;
}
