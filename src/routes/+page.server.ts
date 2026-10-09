import { allTitles } from '#lib/server/library.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({ titles: allTitles() });
