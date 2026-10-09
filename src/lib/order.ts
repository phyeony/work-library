export interface Ordered {
	id: number;
	position: number;
}

export interface Neighbors<T> {
	index: number;
	total: number;
	prev: T | null;
	next: T | null;
}

/** Finds a book's 1-based place in its row and the books on either side. */
export function neighbors<T extends Ordered>(rowBooks: T[], id: number): Neighbors<T> | null {
	const sorted = [...rowBooks].sort((a, b) => a.position - b.position);
	const i = sorted.findIndex((b) => b.id === id);
	if (i === -1) return null;
	return {
		index: i + 1,
		total: sorted.length,
		prev: sorted[i - 1] ?? null,
		next: sorted[i + 1] ?? null
	};
}

/**
 * Returns new positions for a row after placing `id` at 1-based `place`.
 * `id` may come from another row (a move between rows); it is inserted.
 */
export function reposition<T extends Ordered>(
	rowBooks: T[],
	id: number,
	place: number
): { id: number; position: number }[] {
	const ids = [...rowBooks]
		.sort((a, b) => a.position - b.position)
		.map((b) => b.id)
		.filter((x) => x !== id);
	const at = Math.min(Math.max(place - 1, 0), ids.length);
	ids.splice(at, 0, id);
	return ids.map((x, i) => ({ id: x, position: (i + 1) * 10 }));
}
