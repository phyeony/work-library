import { error, redirect } from '@sveltejs/kit';
import { parseBookForm } from '#lib/server/bookForm.ts';
import { addBook, allRows, periodLabels, rowBooks, shelfIdForRow } from '#lib/server/library.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	const rows = allRows();
	const rowId = Number(url.searchParams.get('row')) || rows[0]?.id;
	if (!rowId) error(400, 'Create a shelf row first');
	const inRow = rowBooks(rowId);
	const last = inRow.at(-1);
	return {
		rowId,
		place: inRow.length + 1,
		defaults: { periodLabel: last?.periodLabel ?? '', week: last?.week ?? null },
		rows,
		periods: periodLabels()
	};
};

export const actions: Actions = {
	save: async ({ request }) => {
		const parsed = parseBookForm(await request.formData());
		if (parsed.error) return parsed.error;
		addBook(parsed.rowId, parsed.fields, parsed.place);
		redirect(303, `/shelves/${shelfIdForRow(parsed.rowId)}`);
	}
};
