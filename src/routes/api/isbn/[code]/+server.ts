import { error, json } from '@sveltejs/kit';
import { normalizeIsbn } from '#lib/isbn.ts';
import { allTitles, keyForIsbn, linkIsbn, locate } from '#lib/server/library.ts';
import { lookupTitle } from '#lib/server/lookup.ts';
import { matchTitle } from '#lib/server/match.ts';
import type { RequestHandler } from './$types';

/**
 * Resolves a scanned barcode to its locations. An unknown barcode is looked up in
 * book databases; if that title clearly matches one on the shelves, it is linked
 * automatically. `?nolink` disables that (Link mode decides for itself).
 */
export const GET: RequestHandler = async ({ params, url, fetch, locals }) => {
	const isbn = normalizeIsbn(params.code);
	if (!isbn) error(400, 'Not a book barcode (ISBN)');

	const key = keyForIsbn(isbn);
	if (key) return json({ isbn, titleKey: key, locations: locate(key), hint: null, autoLinked: false });

	const hint = await lookupTitle(isbn, fetch);
	const match = hint && !url.searchParams.has('nolink') ? matchTitle(hint, allTitles()) : null;
	if (match) {
		linkIsbn(isbn, match.titleKey, locals.user!.email);
		return json({ isbn, titleKey: match.titleKey, locations: locate(match.titleKey), hint, autoLinked: true });
	}
	return json({ isbn, titleKey: null, locations: [], hint, autoLinked: false });
};
