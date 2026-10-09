import { error } from '@sveltejs/kit';
import { rowDetail } from '#lib/server/library.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const detail = rowDetail(Number(params.id));
	if (!detail) error(404, 'Row not found');
	return detail;
};
