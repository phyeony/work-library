import { error, fail } from '@sveltejs/kit';
import { renameRow, renameShelf, shelfDetail } from '#lib/server/library.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const detail = shelfDetail(Number(params.id));
	if (!detail) error(404, 'Shelf not found');
	return detail;
};

export const actions: Actions = {
	renameShelf: async ({ request, params }) => {
		const name = String((await request.formData()).get('name') ?? '').trim();
		if (!name) return fail(400, { message: 'Name is required' });
		renameShelf(Number(params.id), name);
	},
	renameRow: async ({ request }) => {
		const form = await request.formData();
		const label = String(form.get('label') ?? '').trim();
		if (!label) return fail(400, { message: 'Label is required' });
		renameRow(Number(form.get('rowId')), label);
	}
};
