import { redirect } from '@sveltejs/kit';
import { generateCodeVerifier, generateState } from 'arctic';
import { google, googleConfigured } from '#lib/server/google.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url, cookies }) => {
	if (!googleConfigured()) redirect(303, '/login?error=config');
	const state = generateState();
	const codeVerifier = generateCodeVerifier();
	const authUrl = google(url.origin).createAuthorizationURL(state, codeVerifier, [
		'openid',
		'email',
		'profile'
	]);
	authUrl.searchParams.set('prompt', 'select_account');

	const opts = { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 600 } as const;
	cookies.set('google_oauth_state', state, opts);
	cookies.set('google_code_verifier', codeVerifier, opts);

	redirect(302, authUrl.toString(), { external: ['https://accounts.google.com'] });
};
