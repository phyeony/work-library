import { eq } from 'drizzle-orm';
import { ADMIN_EMAILS } from '$app/env/private';
import { db } from './db';
import { allowedEmails } from './db/schema';

export interface User {
	email: string;
	name: string | null;
	/** Super users come only from ADMIN_EMAILS; they alone can manage the allowlist. */
	isAdmin: boolean;
}

/** Looks up an email on the allowlist. Checked on every request so removals apply at once. */
export function allowedUser(email: string, name: string | null): User | null {
	const normalized = email.toLowerCase();
	const isAdmin = ADMIN_EMAILS.includes(normalized);
	const listed = db.select().from(allowedEmails).where(eq(allowedEmails.email, normalized)).get();
	return listed || isAdmin ? { email: normalized, name, isAdmin } : null;
}
