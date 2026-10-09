import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.user) redirect(303, '/');
	const error = url.searchParams.get('error');
	const signedOut = url.searchParams.has('signedout');
	// This page only shows sign-in problems and the signed-out message; otherwise go to Google.
	if (!error && !signedOut) redirect(303, '/login/google');
	return { error, email: url.searchParams.get('email'), signedOut };
};
