import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { sql } from 'drizzle-orm';
import { mappings } from '../../../../seed/mapping';
import { parseSheet } from '../import';
import * as schema from './schema';

type DB = BetterSQLite3Database<typeof schema>;

export function runMigrations(db: DB, migrationsFolder = 'drizzle') {
	migrate(db, { migrationsFolder });
}

export function isEmpty(db: DB): boolean {
	return db.select({ n: sql<number>`count(*)` }).from(schema.shelves).get()!.n === 0;
}

/**
 * Loads the seed CSVs into an empty database. With `force`, existing shelves,
 * rows and books are replaced; barcode links and the allowlist are kept.
 */
export function importSeed(db: DB, readCsv: (file: string) => string, { force = false } = {}) {
	if (!isEmpty(db) && !force) {
		throw new Error('Database already has shelves; pass force to replace them.');
	}
	const parsed = mappings.map((m) => parseSheet(readCsv(m.file), m));

	db.transaction((tx) => {
		tx.delete(schema.shelves).run();
		parsed.forEach((shelf, s) => {
			const { id: shelfId } = tx
				.insert(schema.shelves)
				.values({ name: shelf.name, sortOrder: s + 1 })
				.returning({ id: schema.shelves.id })
				.get();
			for (const row of shelf.rows) {
				const { id: rowId } = tx
					.insert(schema.shelfRows)
					.values({ shelfId, label: row.label, rowFromBottom: row.rowFromBottom })
					.returning({ id: schema.shelfRows.id })
					.get();
				if (row.books.length) {
					tx.insert(schema.books)
						.values(row.books.map((b) => ({ ...b, rowId })))
						.run();
				}
			}
		});
	});

	return parsed.reduce((n, s) => n + s.rows.reduce((m, r) => m + r.books.length, 0), 0);
}

export function ensureAdmins(db: DB, emails: string[]) {
	for (const email of emails) {
		db.insert(schema.allowedEmails)
			.values({ email, addedBy: 'ADMIN_EMAILS' })
			.onConflictDoNothing()
			.run();
	}
}
