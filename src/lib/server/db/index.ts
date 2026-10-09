import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { building } from '$app/env';
import { ADMIN_EMAILS, DATABASE_URL } from '$app/env/private';
import * as schema from './schema';
import { ensureAdmins, importSeed, isEmpty, runMigrations } from './setup';

const seedFiles = import.meta.glob<string>('/seed/*.csv', {
	query: '?raw',
	import: 'default',
	eager: true
});

const client = new Database(building ? ':memory:' : DATABASE_URL);
client.pragma('journal_mode = WAL');
client.pragma('foreign_keys = ON');

export const db = drizzle(client, { schema });

if (!building) {
	runMigrations(db);
	if (isEmpty(db)) {
		const count = importSeed(db, (file) => seedFiles[`/seed/${file}`]);
		console.log(`Imported ${count} books from seed data`);
	}
	ensureAdmins(db, ADMIN_EMAILS);
}
