/** Returns a normalized ISBN-13, or null when the code is not a valid ISBN. */
export function normalizeIsbn(raw: string): string | null {
	const code = raw.replace(/[^0-9Xx]/g, '').toUpperCase();
	if (code.length === 13) {
		if (!/^97[89]\d{10}$/.test(code)) return null;
		return isbn13CheckDigit(code.slice(0, 12)) === code[12] ? code : null;
	}
	if (code.length === 10) {
		if (!/^\d{9}[\dX]$/.test(code)) return null;
		if (isbn10CheckDigit(code.slice(0, 9)) !== code[9]) return null;
		const body = '978' + code.slice(0, 9);
		return body + isbn13CheckDigit(body);
	}
	return null;
}

function isbn13CheckDigit(first12: string): string {
	let sum = 0;
	for (let i = 0; i < 12; i++) sum += Number(first12[i]) * (i % 2 === 0 ? 1 : 3);
	return String((10 - (sum % 10)) % 10);
}

function isbn10CheckDigit(first9: string): string {
	let sum = 0;
	for (let i = 0; i < 9; i++) sum += Number(first9[i]) * (10 - i);
	const check = (11 - (sum % 11)) % 11;
	return check === 10 ? 'X' : String(check);
}
