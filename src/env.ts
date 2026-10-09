import { defineEnvVars } from '@sveltejs/kit/env';

const optional = (value: string | undefined) => value || undefined;

export const variables = defineEnvVars({
	DATABASE_URL: {
		description: 'Path to the SQLite database file, e.g. /data/library.db.'
	},
	GOOGLE_CLIENT_ID: {
		description: 'Google OAuth client ID.',
		schema: optional
	},
	GOOGLE_CLIENT_SECRET: {
		description: 'Google OAuth client secret.',
		schema: optional
	},
	SESSION_SECRET: {
		description: 'Random string (32+ chars) used to sign session cookies.',
		schema: (value) => {
			if (!value || value.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters');
			return value;
		}
	},
	ADMIN_EMAILS: {
		description:
			'Comma-separated super users: always allowed, and the only ones who can manage the allowlist.',
		schema: (value) =>
			(value || 'phyeony@gmail.com')
				.split(',')
				.map((e) => e.trim().toLowerCase())
				.filter(Boolean)
	}
});
