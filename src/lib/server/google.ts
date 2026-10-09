import { Google } from 'arctic';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '$app/env/private';

export function googleConfigured() {
	return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
}

export function google(origin: string) {
	if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
		throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set');
	}
	return new Google(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, `${origin}/login/google/callback`);
}
