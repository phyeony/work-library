import { describe, expect, it } from 'vitest';
import { normalizeIsbn } from './isbn';

describe('normalizeIsbn', () => {
	it('accepts valid ISBN-13', () => {
		expect(normalizeIsbn('978-0-399-22690-8')).toBe('9780399226908');
		expect(normalizeIsbn('9791160940381')).toBe('9791160940381');
	});

	it('converts ISBN-10 to ISBN-13', () => {
		expect(normalizeIsbn('0-399-22690-7')).toBe('9780399226908');
		expect(normalizeIsbn('080442957X')).toBe('9780804429573');
	});

	it('rejects bad checksums and non-book barcodes', () => {
		expect(normalizeIsbn('9780399226909')).toBeNull();
		expect(normalizeIsbn('8801234567890')).toBeNull();
		expect(normalizeIsbn('12345')).toBeNull();
	});
});
