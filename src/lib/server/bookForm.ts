import { fail } from '@sveltejs/kit';
import type { BookFields } from './library';

const text = (form: FormData, name: string) => String(form.get(name) ?? '').trim();

/** Parses the shared book form, returning either the fields or a `fail` result. */
export function parseBookForm(form: FormData) {
	const title = text(form, 'title');
	const periodLabel = text(form, 'periodLabel');
	const rowId = Number(text(form, 'rowId'));
	const place = Number(text(form, 'place'));
	const week = text(form, 'week');

	if (!title) return { error: fail(400, { message: 'Title is required' }) };
	if (!periodLabel) return { error: fail(400, { message: 'Month/section is required' }) };
	if (!Number.isInteger(rowId)) return { error: fail(400, { message: 'Pick a row' }) };
	if (!Number.isInteger(place) || place < 1) return { error: fail(400, { message: 'Position must be 1 or more' }) };

	const fields: BookFields = {
		title,
		periodLabel,
		week: week ? Number(week) || null : null,
		theme: text(form, 'theme') || null,
		notes: text(form, 'notes') || null
	};
	return { fields, rowId, place };
}
