export interface BookRef {
	id: number;
	title: string;
	periodLabel: string;
	week: number | null;
	/** Any barcode linked to this title, used for the cover image. */
	isbn: string | null;
}

export interface Location {
	book: BookRef & { theme: string | null; notes: string | null };
	shelf: { id: number; name: string };
	row: { id: number; label: string; rowFromBottom: number };
	index: number;
	total: number;
	prev: BookRef | null;
	next: BookRef | null;
}

export interface TitleEntry {
	titleKey: string;
	title: string;
	/** Number of places this title appears. */
	count: number;
	linked: boolean;
}

export function periodText(b: { periodLabel: string; week: number | null }) {
	return b.week ? `${b.periodLabel} ${b.week}주` : b.periodLabel;
}

export function coverUrl(isbn: string | null) {
	return isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false` : null;
}
