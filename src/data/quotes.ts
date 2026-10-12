import type { QuoteLength } from '../types';

export interface Quote {
  text: string;
  source: string;
}

/**
 * Quotes are either original to TypeFlow or taken from works in the public
 * domain (published before 1929 or produced by the U.S. federal government).
 * Typographic dashes and curly quotes are normalized to keyboard characters.
 */
export const QUOTES: Record<QuoteLength, readonly Quote[]> = {
  short: [
    { text: 'Well done is better than well said.', source: "Benjamin Franklin, Poor Richard's Almanack" },
    { text: 'Trust thyself: every heart vibrates to that iron string.', source: 'Ralph Waldo Emerson, Self-Reliance' },
    { text: 'Small steps, taken daily, outrun big plans left waiting.', source: 'TypeFlow original' },
    { text: 'Our life is frittered away by detail. Simplify, simplify.', source: 'Henry David Thoreau, Walden' },
    { text: 'Slow is smooth, and smooth becomes fast with practice.', source: 'TypeFlow original' },
    { text: 'Early to bed and early to rise, makes a man healthy, wealthy, and wise.', source: "Benjamin Franklin, Poor Richard's Almanack" },
    { text: 'The keys do not care how fast you are; they care how clearly you think.', source: 'TypeFlow original' },
    { text: 'Call me Ishmael.', source: 'Herman Melville, Moby-Dick' },
  ],
  medium: [
    {
      text: 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.',
      source: 'Jane Austen, Pride and Prejudice',
    },
    {
      text: 'A foolish consistency is the hobgoblin of little minds, adored by little statesmen and philosophers and divines.',
      source: 'Ralph Waldo Emerson, Self-Reliance',
    },
    {
      text: 'Accuracy is a habit you build one careful word at a time. Speed is simply what that habit looks like after a few thousand repetitions.',
      source: 'TypeFlow original',
    },
    {
      text: 'Begin the morning by saying to thyself, I shall meet with the busy-body, the ungrateful, arrogant, deceitful, envious, unsocial.',
      source: 'Marcus Aurelius, Meditations (trans. George Long)',
    },
    {
      text: 'Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal.',
      source: 'Abraham Lincoln, Gettysburg Address',
    },
    {
      text: 'Good writing is mostly rewriting. The first draft gets the idea out of your head; every draft after that gets it into someone else\'s.',
      source: 'TypeFlow original',
    },
  ],
  long: [
    {
      text: 'I went to the woods because I wished to live deliberately, to front only the essential facts of life, and see if I could not learn what it had to teach, and not, when I came to die, discover that I had not lived.',
      source: 'Henry David Thoreau, Walden',
    },
    {
      text: 'It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness, it was the spring of hope, it was the winter of despair.',
      source: 'Charles Dickens, A Tale of Two Cities',
    },
    {
      text: "Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, 'and what is the use of a book,' thought Alice, 'without pictures or conversations?'",
      source: "Lewis Carroll, Alice's Adventures in Wonderland",
    },
    {
      text: 'Practice does not reward the hours you spend so much as the attention you bring to them. Ten focused minutes, where you notice every stumble and gently correct it, will teach your hands more than an hour of distracted repetition. Keep your eyes on the text, breathe, and let the rhythm come to you.',
      source: 'TypeFlow original',
    },
  ],
};
