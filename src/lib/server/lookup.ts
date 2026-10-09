/** Best-effort title for an ISBN from Open Library, then Google Books. */
export async function lookupTitle(isbn: string, fetchFn: typeof fetch = fetch): Promise<string | null> {
	const get = async (url: string) => {
		const res = await fetchFn(url, { signal: AbortSignal.timeout(4000) });
		return res.ok ? res.json() : null;
	};
	try {
		const ol = await get(`https://openlibrary.org/isbn/${isbn}.json`);
		if (ol?.title) return ol.title;
	} catch {
		// fall through to Google Books
	}
	try {
		const gb = await get(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
		const title = gb?.items?.[0]?.volumeInfo?.title;
		if (title) return title;
	} catch {
		// no title hint
	}
	return null;
}
