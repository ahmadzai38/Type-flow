import { describe, expect, it } from 'vitest';
import { CUSTOM_TEXT_MAX, normalizeTypography, validateCustomText } from '../lib/customText';
import { createPassage, describeConfig, repeatPassage } from '../lib/passage';
import { createRng } from '../lib/random';
import { DEFAULT_TEST_CONFIG } from '../lib/settings';
import { generateWords } from '../lib/textGenerator';

describe('word generation', () => {
  const opts = { difficulty: 'medium', punctuation: false, numbers: false } as const;

  it('is deterministic for a seed and produces the requested count', () => {
    const a = generateWords(createRng(42), 25, opts);
    const b = generateWords(createRng(42), 25, opts);
    expect(a).toBe(b);
    expect(a.split(' ')).toHaveLength(25);
    expect(a).toMatch(/^[a-z ]+$/);
  });

  it('adds punctuation and capitals when enabled', () => {
    const text = generateWords(createRng(7), 60, { ...opts, punctuation: true });
    expect(text[0]).toMatch(/[A-Z"(]/);
    expect(text).toMatch(/[.?!]$/);
    expect(text).toMatch(/[,.;:?!]/);
  });

  it('adds numbers when enabled', () => {
    const text = generateWords(createRng(3), 120, { ...opts, numbers: true });
    expect(text).toMatch(/\d/);
  });

  it('never repeats the same word twice in a row', () => {
    const words = generateWords(createRng(9), 300, { ...opts, difficulty: 'easy' }).split(' ');
    for (let i = 1; i < words.length; i++) expect(words[i]).not.toBe(words[i - 1]);
  });
});

describe('passages', () => {
  it('builds the right passage for every mode', () => {
    const words = createPassage({ ...DEFAULT_TEST_CONFIG, mode: 'words', words: 10 }, 1);
    expect(words.text.split(' ')).toHaveLength(10);
    const time = createPassage({ ...DEFAULT_TEST_CONFIG, mode: 'time' }, 1);
    expect(time.more).toBeTypeOf('function');
    const code = createPassage({ ...DEFAULT_TEST_CONFIG, mode: 'code', codeLanguage: 'python' }, 1);
    expect(code.wordSkip).toBe(false);
    expect(code.autoIndent).toBe(true);
    expect(code.text).toContain('\n');
    const quote = createPassage({ ...DEFAULT_TEST_CONFIG, mode: 'quote' }, 1);
    expect(quote.source).toBeTruthy();
    const custom = createPassage({ ...DEFAULT_TEST_CONFIG, mode: 'custom', customText: 'my  own\ntext' }, 1);
    expect(custom.text).toBe('my own text');
  });

  it('repeat keeps the text but gets a new key', () => {
    const p = createPassage(DEFAULT_TEST_CONFIG, 5);
    const r = repeatPassage(p);
    expect(r.text).toBe(p.text);
    expect(r.key).not.toBe(p.key);
  });

  it('describes configurations', () => {
    expect(describeConfig({ ...DEFAULT_TEST_CONFIG, mode: 'time', time: 60 })).toBe('time 60');
    expect(describeConfig({ ...DEFAULT_TEST_CONFIG, mode: 'words', words: 50, punctuation: true })).toBe(
      'words 50 · punctuation',
    );
    expect(describeConfig({ ...DEFAULT_TEST_CONFIG, mode: 'code', codeLanguage: 'typescript' })).toBe('code typescript');
  });
});

describe('custom text validation', () => {
  it('normalizes whitespace and typography', () => {
    const v = validateCustomText('  “Hello” — it’s\n\nme…  ');
    expect(v).toEqual({ ok: true, text: '"Hello" - it\'s me...', words: 4 });
  });
  it('rejects empty or too-short text', () => {
    expect(validateCustomText('   ').ok).toBe(false);
    expect(validateCustomText('a').ok).toBe(false);
  });
  it('rejects text over the limit', () => {
    const v = validateCustomText('a'.repeat(CUSTOM_TEXT_MAX + 1));
    expect(v.ok).toBe(false);
  });
  it('removes zero-width characters', () => {
    expect(normalizeTypography('a​b')).toBe('ab');
  });
});
