/**
 * Normalizes a title so that small differences in spacing, case and
 * punctuation ("Hey,Mr.Choo choo" vs "Hey Mr.choo choo") map to the same key.
 */
export function titleKey(title: string): string {
	return title
		.normalize('NFKC')
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, '');
}
