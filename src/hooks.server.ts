import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { SESSION_SECRET } from '$app/env/private';
import { allowedUser } from '#lib/server/auth.ts';
import { SESSION_COOKIE, decodeSession } from '#lib/server/session.ts';

const PUBLIC_PATHS = ['/login', '/healthz'];

export const handle: Handle = async ({ event, resolve }) => {
	const session = decodeSession(event.cookies.get(SESSION_COOKIE), SESSION_SECRET);
	event.locals.user = session ? allowedUser(session.email, session.name) : null;

	const path = event.url.pathname;
	const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + '/'));
	if (!event.locals.user && !isPublic) {
		if (path.startsWith('/api/')) {
			return new Response('Unauthorized', { status: 401 });
		}
		// Go straight to Google sign-in.
		redirect(303, '/login/google');
	}
	if (path.startsWith('/admin') && !event.locals.user?.isAdmin) {
		redirect(303, '/');
	}

	return resolve(event);
};
