import { redirect } from '@sveltejs/kit';
import { decodeIdToken } from 'arctic';
import { SESSION_SECRET } from '$app/env/private';
import { allowedUser } from '#lib/server/auth.ts';
import { SESSION_COOKIE, SESSION_MAX_AGE, encodeSession } from '#lib/server/session.ts';
import { google } from '#lib/server/google.ts';
import type { RequestHandler } from './$types';

interface GoogleClaims {
	email?: string;
	email_verified?: boolean;
	name?: string;
}

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('google_oauth_state');
	const codeVerifier = cookies.get('google_code_verifier');
	cookies.delete('google_oauth_state', { path: '/' });
	cookies.delete('google_code_verifier', { path: '/' });

	if (!code || !state || !codeVerifier || state !== storedState) {
		redirect(303, '/login?error=invalid');
	}

	let claims: GoogleClaims;
	try {
		const tokens = await google(url.origin).validateAuthorizationCode(code, codeVerifier);
		claims = decodeIdToken(tokens.idToken()) as GoogleClaims;
	} catch {
		redirect(303, '/login?error=invalid');
	}

	if (!claims.email || !claims.email_verified) redirect(303, '/login?error=unverified');
	const user = allowedUser(claims.email, claims.name ?? null);
	if (!user) redirect(303, `/login?error=denied&email=${encodeURIComponent(claims.email)}`);

	const token = encodeSession(
		{ email: user.email, name: user.name, exp: Date.now() + SESSION_MAX_AGE * 1000 },
		SESSION_SECRET
	);
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: SESSION_MAX_AGE
	});
	redirect(303, '/');
};
