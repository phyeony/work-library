import { createHmac, timingSafeEqual } from 'node:crypto';

export interface Session {
	email: string;
	name: string | null;
	/** Expiry, in ms since epoch. */
	exp: number;
}

export const SESSION_COOKIE = 'session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // seconds

function sign(payload: string, secret: string) {
	return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function encodeSession(session: Session, secret: string): string {
	const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
	return `${payload}.${sign(payload, secret)}`;
}

export function decodeSession(token: string | undefined, secret: string, now = Date.now()): Session | null {
	if (!token) return null;
	const [payload, mac] = token.split('.');
	if (!payload || !mac) return null;
	const expected = Buffer.from(sign(payload, secret));
	const actual = Buffer.from(mac);
	if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
	try {
		const session = JSON.parse(Buffer.from(payload, 'base64url').toString()) as Session;
		return session.exp > now ? session : null;
	} catch {
		return null;
	}
}
