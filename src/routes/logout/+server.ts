import { redirect } from '@sveltejs/kit';
import { SESSION_COOKIE } from '#lib/server/session.ts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ cookies }) => {
	cookies.delete(SESSION_COOKIE, { path: '/' });
	redirect(303, '/login?signedout=1');
};
