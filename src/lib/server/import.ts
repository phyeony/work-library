import { parse } from 'csv-parse/sync';
import { titleKey } from '../titleKey';

export interface RowColumn {
	/** CSV header of the column holding this shelf row's books. */
	column: string;
	/** Display label; defaults to the header. */
	label?: string;
}

export interface SheetMapping {
	file: string;
	shelf: string;
	periodColumn: string;
	/** When absent, the week is the row's index within its period. */
	weekColumn?: string;
	themeColumn?: string;
	/** In bookcase order: the first entry is the bottom row. */
	rows: RowColumn[];
}

export interface ParsedBook {
	position: number;
	periodLabel: string;
	week: number | null;
	theme: string | null;
	title: string;
	titleKey: string;
}

export interface ParsedRow {
	label: string;
	rowFromBottom: number;
	books: ParsedBook[];
}

export interface ParsedShelf {
	name: string;
	rows: ParsedRow[];
}

const EMPTY = new Set(['', '-']);

/** Splits a cell like "My mom / My dad" into titles. Commas are part of titles. */
export function splitTitles(cell: string | undefined): string[] {
	return (cell ?? '')
		.split('/')
		.map((t) => t.trim())
		.filter((t) => !EMPTY.has(t));
}

function parseWeek(value: string | undefined): number | null {
	const match = value?.match(/\d+/);
	return match ? Number(match[0]) : null;
}

export function parseSheet(csv: string, mapping: SheetMapping): ParsedShelf {
	const records: Record<string, string>[] = parse(csv, {
		columns: true,
		skip_empty_lines: true,
		bom: true,
		trim: true
	});

	const rows: ParsedRow[] = mapping.rows.map((r, i) => ({
		label: r.label ?? r.column,
		rowFromBottom: i + 1,
		books: []
	}));

	const weekInPeriod = new Map<string, number>();

	for (const record of records) {
		const periodLabel = record[mapping.periodColumn];
		if (EMPTY.has(periodLabel ?? '')) continue;

		let week: number | null;
		if (mapping.weekColumn) {
			week = parseWeek(record[mapping.weekColumn]);
		} else {
			week = (weekInPeriod.get(periodLabel) ?? 0) + 1;
			weekInPeriod.set(periodLabel, week);
		}
		const themeValue = mapping.themeColumn ? record[mapping.themeColumn] : undefined;
		const theme = themeValue && !EMPTY.has(themeValue) ? themeValue : null;

		mapping.rows.forEach((r, i) => {
			for (const title of splitTitles(record[r.column])) {
				const books = rows[i].books;
				books.push({
					position: (books.length + 1) * 10,
					periodLabel,
					week,
					theme,
					title,
					titleKey: titleKey(title)
				});
			}
		});
	}

	return { name: mapping.shelf, rows };
}
