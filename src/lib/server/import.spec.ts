import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { mappings } from '../../../seed/mapping';
import { parseSheet, splitTitles } from './import';

const shelves = mappings.map((m) => parseSheet(readFileSync(`seed/${m.file}`, 'utf8'), m));
const [curriculum, age2, age3to5] = shelves;
const titles = (books: { title: string }[]) => books.map((b) => b.title);

describe('splitTitles', () => {
	it('splits on slashes but never on commas', () => {
		expect(splitTitles('My mom / My dad')).toEqual(['My mom', 'My dad']);
		expect(splitTitles('Hey Mr.choo choo, where are you going?')).toEqual([
			'Hey Mr.choo choo, where are you going?'
		]);
	});

	it('skips blanks and dashes', () => {
		expect(splitTitles('-')).toEqual([]);
		expect(splitTitles('')).toEqual([]);
	});
});

describe('seed import', () => {
	it('creates the expected shelves and rows', () => {
		expect(shelves.map((s) => s.rows.map((r) => r.label))).toEqual([
			['만3세', '만4세', '만5세'],
			['만2세 인성동화'],
			['만3세 인성동화', '만3세 음악동화', '만4세 음악동화', '만5세 음악동화']
		]);
		expect(curriculum.rows.map((r) => r.rowFromBottom)).toEqual([1, 2, 3]);
	});

	it('keeps sheet order, with extra sections after February', () => {
		const age5 = curriculum.rows[2].books;
		expect(age5[0]).toMatchObject({
			periodLabel: '3월',
			week: 1,
			theme: '기차',
			title: 'Hey Mr.choo choo, where are you going?'
		});
		expect(age5.map((b) => b.periodLabel).slice(-4)).toEqual(['2월', '비상용', '비상용', '부참']);
		expect(age5.at(-1)).toMatchObject({ title: 'Silly Suzy goose', week: null, theme: null });
	});

	it('splits multi-book cells into consecutive books in the same week', () => {
		const age5 = titles(curriculum.rows[2].books);
		const i = age5.indexOf('My mom');
		expect(age5[i + 1]).toBe('My dad');
		const positions = curriculum.rows[2].books.map((b) => b.position);
		expect(positions).toEqual(positions.map((_, j) => (j + 1) * 10));
	});

	it('numbers weeks within each month when the tab has no week column', () => {
		const music3 = age3to5.rows[1].books;
		expect(music3.filter((b) => b.periodLabel === '3월').map((b) => b.week)).toEqual([1, 2, 3, 4]);
		expect(music3.find((b) => b.periodLabel === '1월')?.week).toBe(1);
	});

	it('skips dash cells', () => {
		expect(age3to5.rows[0].books.some((b) => b.periodLabel === '2월')).toBe(false);
		expect(titles(age3to5.rows[3].books)).not.toContain('-');
	});

	it('imports every age-2 title', () => {
		expect(age2.rows[0].books).toHaveLength(48);
		expect(age2.rows[0].books[0].title).toBe('놀이터에 가요');
	});
});
