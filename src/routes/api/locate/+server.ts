import { error, json } from '@sveltejs/kit';
import { locate } from '#lib/server/library.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) => {
	const key = url.searchParams.get('key');
	if (!key) error(400, 'key is required');
	return json({ locations: locate(key) });
};
