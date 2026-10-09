import { describe, expect, it } from 'vitest';
import { decodeSession, encodeSession } from './session';

const secret = 'x'.repeat(32);
const session = { email: 'a@gmail.com', name: 'A', exp: Date.now() + 60_000 };

describe('session cookie', () => {
	it('round-trips', () => {
		expect(decodeSession(encodeSession(session, secret), secret)).toEqual(session);
	});

	it('rejects tampering, wrong secrets and expiry', () => {
		const token = encodeSession(session, secret);
		const forged = Buffer.from(JSON.stringify({ ...session, email: 'b@gmail.com' })).toString('base64url');
		expect(decodeSession(`${forged}.${token.split('.')[1]}`, secret)).toBeNull();
		expect(decodeSession(token, 'y'.repeat(32))).toBeNull();
		expect(decodeSession(token, secret, session.exp + 1)).toBeNull();
		expect(decodeSession('garbage', secret)).toBeNull();
	});
});
