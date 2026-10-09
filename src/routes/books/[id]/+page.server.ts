import { error, redirect } from '@sveltejs/kit';
import { parseBookForm } from '#lib/server/bookForm.ts';
import {
	allRows,
	deleteBook,
	getBook,
	periodLabels,
	rowBooks,
	saveBook,
	shelfIdForRow
} from '#lib/server/library.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const book = getBook(Number(params.id));
	if (!book) error(404, 'Book not found');
	const place = rowBooks(book.rowId).findIndex((b) => b.id === book.id) + 1;
	return { book, place, rows: allRows(), periods: periodLabels() };
};

export const actions: Actions = {
	save: async ({ request, params }) => {
		const parsed = parseBookForm(await request.formData());
		if (parsed.error) return parsed.error;
		saveBook(Number(params.id), parsed.fields, parsed.rowId, parsed.place);
		redirect(303, `/shelves/${shelfIdForRow(parsed.rowId)}`);
	},
	delete: async ({ params }) => {
		const book = getBook(Number(params.id));
		if (!book) error(404, 'Book not found');
		deleteBook(book.id);
		redirect(303, `/shelves/${shelfIdForRow(book.rowId)}`);
	}
};
