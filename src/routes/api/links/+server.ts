import { error, json } from '@sveltejs/kit';
import { normalizeIsbn } from '#lib/isbn.ts';
import { keyForIsbn, linkIsbn, unlinkIsbn } from '#lib/server/library.ts';
import type { RequestHandler } from './$types';

async function body(request: Request) {
	const data = await request.json().catch(() => null);
	const isbn = normalizeIsbn(String(data?.isbn ?? ''));
	if (!isbn) error(400, 'Invalid ISBN');
	return { isbn, titleKey: typeof data?.titleKey === 'string' ? data.titleKey : null };
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const { isbn, titleKey } = await body(request);
	if (!titleKey) error(400, 'titleKey is required');
	const previous = keyForIsbn(isbn);
	linkIsbn(isbn, titleKey, locals.user!.email);
	return json({ isbn, titleKey, previous });
};

export const DELETE: RequestHandler = async ({ request }) => {
	const { isbn } = await body(request);
	unlinkIsbn(isbn);
	return json({ isbn });
};
