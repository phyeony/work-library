import { shelvesWithRows } from '#lib/server/library.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({ shelves: shelvesWithRows() });
