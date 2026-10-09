/**
 * Re-imports the seed CSVs: `npm run import -- --force`.
 * Without --force it only imports into an empty database.
 */
import { readFileSync } from 'node:fs';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../src/lib/server/db/schema';
import { importSeed, runMigrations } from '../src/lib/server/db/setup';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const client = new Database(url);
client.pragma('foreign_keys = ON');
const db = drizzle(client, { schema });

runMigrations(db);
const count = importSeed(db, (file) => readFileSync(`seed/${file}`, 'utf8'), {
	force: process.argv.includes('--force')
});
console.log(`Imported ${count} books into ${url}`);
