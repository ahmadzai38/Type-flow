import { CODE_SNIPPETS } from '../data/code';
import { QUOTES } from '../data/quotes';
import type { Passage, TestConfig } from '../types';
import { validateCustomText } from './customText';
import { createRng, randomSeed } from './random';
import { rotation } from './rotation';
import { createWordGenerator } from './textGenerator';

/** Words generated up front in time mode; more are appended while typing. */
export const TIME_MODE_INITIAL_WORDS = 80;
export const TIME_MODE_CHUNK_WORDS = 40;

let keyCounter = 0;
const nextKey = () => ++keyCounter;

const DEFAULT_CUSTOM = 'Type anything you like here. Paste an essay, interview answers, or technical notes to practice them.';

export function createPassage(config: TestConfig, seed: number = randomSeed()): Passage {
  const rng = createRng(seed);
  const base = { key: nextKey(), config, autoIndent: false, wordSkip: true } as const;

  switch (config.mode) {
    case 'time': {
      const gen = createWordGenerator(rng, config);
      return {
        ...base,
        text: gen.words(TIME_MODE_INITIAL_WORDS),
        more: () => gen.words(TIME_MODE_CHUNK_WORDS),
      };
    }
    case 'words': {
      const gen = createWordGenerator(rng, config);
      return { ...base, text: gen.words(config.words, true) };
    }
    case 'quote': {
      const list = QUOTES[config.quoteLength];
      const quote = list[rotation.next(`quote:${config.quoteLength}`, list.length, rng)];
      return { ...base, text: quote.text, source: quote.source };
    }
    case 'custom': {
      const v = validateCustomText(config.customText);
      return { ...base, text: v.ok ? v.text : DEFAULT_CUSTOM, source: 'Custom text' };
    }
    case 'code': {
      const list = CODE_SNIPPETS[config.codeLanguage];
      const id = `code:${config.codeLanguage}`;
      const snippet = list[rotation.next(id, list.length, rng)];
      const pos = rotation.position(id);
      return {
        ...base,
        text: snippet.code,
        source: pos ? `${snippet.title} · ${pos.shown} of ${pos.total}` : snippet.title,
        wordSkip: false,
        autoIndent: true,
      };
    }
  }
}

/** Same text, fresh engine. */
export function repeatPassage(passage: Passage, text: string = passage.text): Passage {
  return { ...passage, key: nextKey(), text, more: passage.more };
}

const LANG_LABEL = { python: 'python', javascript: 'javascript', typescript: 'typescript' } as const;

function modifiers(config: TestConfig): string {
  const parts: string[] = [];
  if (config.difficulty !== 'medium') parts.push(config.difficulty);
  if (config.punctuation) parts.push('punctuation');
  if (config.numbers) parts.push('numbers');
  return parts.length ? ` · ${parts.join(' · ')}` : '';
}

export function describeConfig(config: TestConfig): string {
  switch (config.mode) {
    case 'time':
      return `time ${config.time}${modifiers(config)}`;
    case 'words':
      return `words ${config.words}${modifiers(config)}`;
    case 'quote':
      return `quote ${config.quoteLength}`;
    case 'custom':
      return 'custom';
    case 'code':
      return `code ${LANG_LABEL[config.codeLanguage]}`;
  }
}
