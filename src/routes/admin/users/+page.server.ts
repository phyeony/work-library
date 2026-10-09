import { fail } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { ADMIN_EMAILS } from '$app/env/private';
import { db } from '#lib/server/db/index.ts';
import { allowedEmails } from '#lib/server/db/schema.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	users: db.select().from(allowedEmails).orderBy(asc(allowedEmails.email)).all(),
	superUsers: ADMIN_EMAILS
});

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const actions: Actions = {
	add: async ({ request, locals }) => {
		const email = String((await request.formData()).get('email') ?? '').trim().toLowerCase();
		if (!EMAIL.test(email)) return fail(400, { message: 'Enter a valid email address' });
		db.insert(allowedEmails).values({ email, addedBy: locals.user!.email }).onConflictDoNothing().run();
	},
	remove: async ({ request }) => {
		const email = String((await request.formData()).get('email'));
		if (ADMIN_EMAILS.includes(email)) return fail(400, { message: `${email} is a super user` });
		db.delete(allowedEmails).where(eq(allowedEmails.email, email)).run();
	}
};
