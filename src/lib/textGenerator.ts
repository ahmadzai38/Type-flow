import { WORD_LISTS } from '../data/words';
import type { Difficulty } from '../types';
import { pick, randInt, type Rng } from './random';

export interface WordOptions {
  difficulty: Difficulty;
  punctuation: boolean;
  numbers: boolean;
}

const END_MARKS = ['.', '.', '.', '?', '!'] as const;
const MID_MARKS = [',', ',', ',', ';', ':'] as const;

/**
 * Stateful word generator: keeps sentence state across calls so that time
 * mode can keep appending words that read naturally.
 */
export function createWordGenerator(rng: Rng, options: WordOptions) {
  const list = WORD_LISTS[options.difficulty];
  let previous = '';
  let capitalizeNext = true;
  let sinceSentenceStart = 0;

  const nextWord = (isLast: boolean): string => {
    let word: string;
    if (options.numbers && rng() < 0.1) {
      word = String(randInt(rng, 0, rng() < 0.5 ? 99 : 9999));
    } else {
      do {
        word = pick(rng, list);
      } while (word === previous && list.length > 1);
    }
    previous = word;

    if (!options.punctuation) return word;

    if (capitalizeNext) {
      word = word.charAt(0).toUpperCase() + word.slice(1);
      capitalizeNext = false;
    }
    sinceSentenceStart++;

    const roll = rng();
    if (isLast || (sinceSentenceStart >= 4 && roll < 0.18)) {
      word += pick(rng, END_MARKS);
      capitalizeNext = true;
      sinceSentenceStart = 0;
    } else if (sinceSentenceStart >= 2 && roll < 0.28) {
      word += pick(rng, MID_MARKS);
    } else if (roll > 0.985) {
      word = `"${word}"`;
    } else if (roll > 0.975) {
      word = `(${word})`;
    }
    return word;
  };

  return {
    /** Generate `count` words. `final` ends the last word with a sentence mark. */
    words(count: number, final = false): string {
      const out: string[] = [];
      for (let i = 0; i < count; i++) out.push(nextWord(final && i === count - 1));
      return out.join(' ');
    },
  };
}

export function generateWords(rng: Rng, count: number, options: WordOptions): string {
  return createWordGenerator(rng, options).words(count, true);
}
