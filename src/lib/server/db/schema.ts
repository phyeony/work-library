import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const shelves = sqliteTable('shelves', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	sortOrder: integer('sort_order').notNull()
});

export const shelfRows = sqliteTable(
	'shelf_rows',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		shelfId: integer('shelf_id')
			.notNull()
			.references(() => shelves.id, { onDelete: 'cascade' }),
		label: text('label').notNull(),
		/** 1 = bottom row of the bookcase. */
		rowFromBottom: integer('row_from_bottom').notNull()
	},
	(t) => [index('shelf_rows_shelf_idx').on(t.shelfId)]
);

export const books = sqliteTable(
	'books',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		rowId: integer('row_id')
			.notNull()
			.references(() => shelfRows.id, { onDelete: 'cascade' }),
		/** Left-to-right order within the row. Renumbered in steps of 10 on every move. */
		position: integer('position').notNull(),
		/** "3월" … "2월", or an extra section like "비상용" / "부참". */
		periodLabel: text('period_label').notNull(),
		week: integer('week'),
		theme: text('theme'),
		title: text('title').notNull(),
		titleKey: text('title_key').notNull(),
		notes: text('notes')
	},
	(t) => [index('books_row_idx').on(t.rowId, t.position), index('books_title_key_idx').on(t.titleKey)]
);

/** A scanned barcode maps to a title; every book with that title is a location. */
export const isbnLinks = sqliteTable('isbn_links', {
	isbn: text('isbn').primaryKey(),
	titleKey: text('title_key').notNull(),
	createdBy: text('created_by'),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

export const allowedEmails = sqliteTable('allowed_emails', {
	email: text('email').primaryKey(),
	addedBy: text('added_by'),
	addedAt: integer('added_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});
