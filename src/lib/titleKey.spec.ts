import { describe, expect, it } from 'vitest';
import { titleKey } from './titleKey';

describe('titleKey', () => {
	it('ignores case, spaces and punctuation', () => {
		expect(titleKey('Hey,Mr.Choo choo, where are you going?')).toBe(
			titleKey('Hey Mr.choo choo, where are you going?')
		);
		expect(titleKey('Dear.Zoo')).toBe(titleKey('Dear.zoo'));
	});

	it('keeps Korean letters', () => {
		expect(titleKey('진구야, 안녕?')).toBe('진구야안녕');
	});
});
