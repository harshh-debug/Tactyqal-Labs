import { z } from 'zod';
import { createApp } from './app.ts';
import { createPool } from './database.ts';
const port = z.coerce.number().int().min(1).max(65535).default(4000).parse(process.env.PORT);
const pool = createPool();
const server = createApp(pool).listen(port, '0.0.0.0', () => console.log(`Blog API listening on ${port}`));
for (const signal of ['SIGINT', 'SIGTERM'])
    process.once(signal, () => { server.close(() => { void pool.end().then(() => process.exit(0)); }); setTimeout(() => process.exit(1), 10000).unref(); });
