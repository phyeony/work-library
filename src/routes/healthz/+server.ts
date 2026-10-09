import { sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	db.get(sql`select 1`);
	return new Response('ok');
};
