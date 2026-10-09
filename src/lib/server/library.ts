import { asc, eq, inArray, sql } from 'drizzle-orm';
import { db } from './db';
import { books, isbnLinks, shelfRows, shelves } from './db/schema';
import { neighbors, reposition } from '../order';
import { titleKey } from '../titleKey';
import type { BookRef, Location, TitleEntry } from '../types';

type Book = typeof books.$inferSelect;

/** Maps title keys to one linked ISBN each. */
function isbnsByKey(keys: string[]): Map<string, string> {
	if (!keys.length) return new Map();
	const rows = db
		.select({ titleKey: isbnLinks.titleKey, isbn: isbnLinks.isbn })
		.from(isbnLinks)
		.where(inArray(isbnLinks.titleKey, keys))
		.all();
	return new Map(rows.map((r) => [r.titleKey, r.isbn]));
}

function ref(b: Book, isbns: Map<string, string>): BookRef {
	return {
		id: b.id,
		title: b.title,
		periodLabel: b.periodLabel,
		week: b.week,
		isbn: isbns.get(b.titleKey) ?? null
	};
}

export function rowBooks(rowId: number): Book[] {
	return db.select().from(books).where(eq(books.rowId, rowId)).orderBy(asc(books.position)).all();
}

/** Every place on every shelf where a title belongs. */
export function locate(key: string): Location[] {
	const matches = db
		.select({ book: books, row: shelfRows, shelf: shelves })
		.from(books)
		.innerJoin(shelfRows, eq(books.rowId, shelfRows.id))
		.innerJoin(shelves, eq(shelfRows.shelfId, shelves.id))
		.where(eq(books.titleKey, key))
		.orderBy(asc(shelves.sortOrder), asc(shelfRows.rowFromBottom), asc(books.position))
		.all();

	return matches.map(({ book, row, shelf }) => {
		const inRow = rowBooks(row.id);
		const n = neighbors(inRow, book.id)!;
		const isbns = isbnsByKey([book.titleKey, n.prev?.titleKey, n.next?.titleKey].filter((k) => k !== undefined));
		return {
			book: { ...ref(book, isbns), theme: book.theme, notes: book.notes },
			shelf: { id: shelf.id, name: shelf.name },
			row: { id: row.id, label: row.label, rowFromBottom: row.rowFromBottom },
			index: n.index,
			total: n.total,
			prev: n.prev && ref(n.prev, isbns),
			next: n.next && ref(n.next, isbns)
		};
	});
}

/** Distinct titles for search, in shelf order. */
export function allTitles(): TitleEntry[] {
	const rows = db
		.select({
			titleKey: books.titleKey,
			title: sql<string>`min(${books.title})`,
			count: sql<number>`count(*)`,
			linked: sql<number>`exists(select 1 from ${isbnLinks} where ${isbnLinks.titleKey} = ${books.titleKey})`
		})
		.from(books)
		.groupBy(books.titleKey)
		.orderBy(asc(books.title))
		.all();
	return rows.map((r) => ({ ...r, linked: Boolean(r.linked) }));
}

export function keyForIsbn(isbn: string): string | null {
	return db.select().from(isbnLinks).where(eq(isbnLinks.isbn, isbn)).get()?.titleKey ?? null;
}

export function linkIsbn(isbn: string, key: string, email: string) {
	db.insert(isbnLinks)
		.values({ isbn, titleKey: key, createdBy: email })
		.onConflictDoUpdate({ target: isbnLinks.isbn, set: { titleKey: key, createdBy: email, createdAt: new Date() } })
		.run();
}

export function unlinkIsbn(isbn: string) {
	db.delete(isbnLinks).where(eq(isbnLinks.isbn, isbn)).run();
}

export function shelvesWithRows() {
	const all = db.select().from(shelves).orderBy(asc(shelves.sortOrder)).all();
	const rows = db
		.select({
			row: shelfRows,
			count: sql<number>`(select count(*) from ${books} where ${books.rowId} = ${shelfRows.id})`,
			linked: sql<number>`(select count(*) from ${books} where ${books.rowId} = ${shelfRows.id}
				and exists(select 1 from ${isbnLinks} where ${isbnLinks.titleKey} = ${books.titleKey}))`
		})
		.from(shelfRows)
		.orderBy(asc(shelfRows.rowFromBottom))
		.all();
	return all.map((s) => ({
		...s,
		rows: rows.filter((r) => r.row.shelfId === s.id).map((r) => ({ ...r.row, count: r.count, linked: r.linked }))
	}));
}

export function shelfDetail(shelfId: number) {
	const shelf = db.select().from(shelves).where(eq(shelves.id, shelfId)).get();
	if (!shelf) return null;
	const rows = db
		.select()
		.from(shelfRows)
		.where(eq(shelfRows.shelfId, shelfId))
		.orderBy(asc(shelfRows.rowFromBottom))
		.all();
	const linkedKeys = new Set(db.select({ k: isbnLinks.titleKey }).from(isbnLinks).all().map((r) => r.k));
	return {
		shelf,
		rows: rows.map((row) => ({
			...row,
			books: rowBooks(row.id).map((b) => ({ ...b, linked: linkedKeys.has(b.titleKey) }))
		}))
	};
}

export function rowDetail(rowId: number) {
	const result = db
		.select({ row: shelfRows, shelf: shelves })
		.from(shelfRows)
		.innerJoin(shelves, eq(shelfRows.shelfId, shelves.id))
		.where(eq(shelfRows.id, rowId))
		.get();
	if (!result) return null;
	const inRow = rowBooks(rowId);
	const links = db
		.select()
		.from(isbnLinks)
		.where(inArray(isbnLinks.titleKey, inRow.map((b) => b.titleKey)))
		.all();
	return {
		...result,
		books: inRow.map((b) => ({
			...b,
			isbns: links.filter((l) => l.titleKey === b.titleKey).map((l) => l.isbn)
		}))
	};
}

export function getBook(id: number) {
	return db.select().from(books).where(eq(books.id, id)).get() ?? null;
}

export function allRows() {
	return db
		.select({ id: shelfRows.id, label: shelfRows.label, rowFromBottom: shelfRows.rowFromBottom, shelf: shelves.name })
		.from(shelfRows)
		.innerJoin(shelves, eq(shelfRows.shelfId, shelves.id))
		.orderBy(asc(shelves.sortOrder), asc(shelfRows.rowFromBottom))
		.all();
}

function applyPositions(updates: { id: number; position: number }[], rowId: number) {
	for (const u of updates) {
		db.update(books).set({ position: u.position, rowId }).where(eq(books.id, u.id)).run();
	}
}

function renumber(rowId: number) {
	applyPositions(rowBooks(rowId).map((b, i) => ({ id: b.id, position: (i + 1) * 10 })), rowId);
}

export interface BookFields {
	title: string;
	periodLabel: string;
	week: number | null;
	theme: string | null;
	notes: string | null;
}

/** Saves a book's fields and puts it at 1-based `place` in `rowId` (which may be a different row). */
export function saveBook(id: number, fields: BookFields, rowId: number, place: number) {
	const book = getBook(id);
	if (!book) throw new Error('Book not found');
	const oldKey = book.titleKey;
	const newKey = titleKey(fields.title);

	db.transaction(() => {
		db.update(books).set({ ...fields, titleKey: newKey }).where(eq(books.id, id)).run();
		applyPositions(reposition(rowBooks(rowId), id, place), rowId);
		if (book.rowId !== rowId) {
			renumber(book.rowId);
		}
		// Keep barcode links with the renamed title, unless other copies still use the old title.
		if (oldKey !== newKey) {
			const stillUsed = db.select().from(books).where(eq(books.titleKey, oldKey)).get();
			if (!stillUsed) {
				db.update(isbnLinks).set({ titleKey: newKey }).where(eq(isbnLinks.titleKey, oldKey)).run();
			}
		}
	});
}

export function addBook(rowId: number, fields: BookFields, place: number): number {
	return db.transaction(() => {
		const { id } = db
			.insert(books)
			.values({ ...fields, rowId, titleKey: titleKey(fields.title), position: 0 })
			.returning({ id: books.id })
			.get();
		applyPositions(reposition(rowBooks(rowId), id, place), rowId);
		return id;
	});
}

export function deleteBook(id: number) {
	const book = getBook(id);
	if (!book) return;
	db.transaction(() => {
		db.delete(books).where(eq(books.id, id)).run();
		renumber(book.rowId);
	});
}

export function renameRow(rowId: number, label: string) {
	db.update(shelfRows).set({ label }).where(eq(shelfRows.id, rowId)).run();
}

export function renameShelf(shelfId: number, name: string) {
	db.update(shelves).set({ name }).where(eq(shelves.id, shelfId)).run();
}

export function shelfIdForRow(rowId: number): number | null {
	return db.select().from(shelfRows).where(eq(shelfRows.id, rowId)).get()?.shelfId ?? null;
}

/** Distinct month/section labels in the order they first appear on the shelves. */
export function periodLabels(): string[] {
	return db
		.select({ label: books.periodLabel })
		.from(books)
		.groupBy(books.periodLabel)
		.orderBy(sql`min(${books.rowId} * 100000 + ${books.position})`)
		.all()
		.map((r) => r.label);
}
