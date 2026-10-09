import Fuse from 'fuse.js';
import { titleKey } from '../titleKey';
import type { TitleEntry } from '../types';

/**
 * Picks the list title that a book-database title clearly refers to, or null when unsure.
 * Exact matches after normalization win; otherwise the best fuzzy match must be close
 * and clearly better than the runner-up, so a wrong book is never linked silently.
 */
export function matchTitle(found: string, titles: TitleEntry[]): TitleEntry | null {
	const key = titleKey(found);
	if (!key) return null;
	const exact = titles.find((t) => t.titleKey === key);
	if (exact) return exact;

	// Database titles often add a subtitle ("Swimmy: A Story…"); try the part before it too.
	const main = titleKey(found.split(/[:(]/)[0]);
	const mainExact = main && titles.find((t) => t.titleKey === main);
	if (mainExact) return mainExact;

	const results = new Fuse(titles, { keys: ['titleKey'], includeScore: true, threshold: 0.3, ignoreLocation: true })
		.search(main || key, { limit: 2 });
	const [best, second] = results;
	if (!best || best.score! > 0.2) return null;
	if (second && second.score! - best.score! < 0.1) return null;
	return best.item;
}
