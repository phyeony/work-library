import { describe, expect, it } from 'vitest';
import { titleKey } from '../titleKey';
import { matchTitle } from './match';

const entry = (title: string) => ({ titleKey: titleKey(title), title, count: 1, linked: false });
const titles = [
	'The very hungry caterpillar',
	'Swimmy',
	'Brown bear, brown bear, what do you see?/Bottoms up!',
	'Brown bear, brown bear, what do you see?',
	'Polar bear, polar bear, what do you hear?',
	'Bear in a square',
	'Bear at home',
	'Bear at work',
	'We\'re going on a bear hunt'
].map(entry);

describe('matchTitle', () => {
	it('matches exact titles regardless of case and punctuation', () => {
		expect(matchTitle('The Very Hungry Caterpillar', titles)?.title).toBe('The very hungry caterpillar');
		expect(matchTitle('Brown Bear, Brown Bear, What Do You See?', titles)?.title).toBe(
			'Brown bear, brown bear, what do you see?'
		);
	});

	it('ignores a subtitle from the book database', () => {
		expect(matchTitle('Swimmy: A Fish Story', titles)?.title).toBe('Swimmy');
	});

	it('tolerates small differences', () => {
		expect(matchTitle("We're Going on a Bear-Hunt!", titles)?.title).toBe("We're going on a bear hunt");
		expect(matchTitle('The Very Hungry Catterpillar', titles)?.title).toBe('The very hungry caterpillar');
	});

	it('refuses when unsure', () => {
		expect(matchTitle('Bear at', titles)).toBeNull(); // "Bear at home" vs "Bear at work"
		expect(matchTitle('Goodnight Moon', titles)).toBeNull();
		expect(matchTitle('', titles)).toBeNull();
	});
});
