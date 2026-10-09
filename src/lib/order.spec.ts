import { describe, expect, it } from 'vitest';
import { neighbors, reposition } from './order';

const row = [
	{ id: 3, position: 30 },
	{ id: 1, position: 10 },
	{ id: 2, position: 20 }
];

describe('neighbors', () => {
	it('finds the middle book', () => {
		expect(neighbors(row, 2)).toEqual({
			index: 2,
			total: 3,
			prev: { id: 1, position: 10 },
			next: { id: 3, position: 30 }
		});
	});

	it('has no prev at the start or next at the end', () => {
		expect(neighbors(row, 1)?.prev).toBeNull();
		expect(neighbors(row, 3)?.next).toBeNull();
	});

	it('returns null for a book not in the row', () => {
		expect(neighbors(row, 99)).toBeNull();
	});
});

describe('reposition', () => {
	it('moves a book within the row', () => {
		expect(reposition(row, 3, 1)).toEqual([
			{ id: 3, position: 10 },
			{ id: 1, position: 20 },
			{ id: 2, position: 30 }
		]);
	});

	it('inserts a book from another row and clamps the place', () => {
		expect(reposition(row, 9, 99).map((b) => b.id)).toEqual([1, 2, 3, 9]);
		expect(reposition(row, 9, 0).map((b) => b.id)).toEqual([9, 1, 2, 3]);
	});
});
