import { describe, expect, it } from 'vitest';
import { CODE_SNIPPETS } from '../data/code';
import { QUOTES } from '../data/quotes';
import { TypingEngine } from '../lib/engine';
import { createPassage } from '../lib/passage';
import { createRng } from '../lib/random';
import { createRotation } from '../lib/rotation';
import { DEFAULT_TEST_CONFIG } from '../lib/settings';

describe('rotation (shuffle bag)', () => {
  it('shows every item once before any repeat', () => {
    const r = createRotation('test:rot');
    const rng = createRng(1);
    const seen = new Set<number>();
    for (let i = 0; i < 50; i++) seen.add(r.next('x', 50, rng));
    expect(seen.size).toBe(50);
  });

  it('never shows the same item twice in a row, across rounds', () => {
    const r = createRotation('test:rot');
    const rng = createRng(2);
    let prev = -1;
    for (let i = 0; i < 500; i++) {
      const n = r.next('y', 4, rng);
      expect(n).not.toBe(prev);
      prev = n;
    }
  });

  it('continues the same round after a reload', () => {
    const rng = createRng(3);
    const first = createRotation('test:rot');
    const shown = [first.next('z', 10, rng), first.next('z', 10, rng)];
    const reloaded = createRotation('test:rot');
    const rest = Array.from({ length: 8 }, () => reloaded.next('z', 10, rng));
    expect(new Set([...shown, ...rest]).size).toBe(10);
    expect(reloaded.position('z')).toEqual({ shown: 10, total: 10 });
  });

  it('starts a fresh round when the collection size changes or storage is corrupt', () => {
    localStorage.setItem('test:rot', '{"z":{"size":3,"queue":[9,9],"last":0}}');
    const r = createRotation('test:rot');
    const n = r.next('z', 5, createRng(4));
    expect(n).toBeGreaterThanOrEqual(0);
    expect(n).toBeLessThan(5);
  });
});

describe('code snippet library', () => {
  for (const [lang, list] of Object.entries(CODE_SNIPPETS)) {
    it(`${lang} has a large, clean set of snippets`, () => {
      expect(list.length).toBeGreaterThanOrEqual(40);
      expect(new Set(list.map((s) => s.title)).size).toBe(list.length);
      for (const s of list) {
        expect(s.code.trim().length).toBeGreaterThan(20);
        for (const line of s.code.split('\n')) {
          expect(line).toBe(line.trimEnd());
          expect(line).not.toMatch(/\t/);
        }
      }
    });
  }

  it('every snippet can be typed perfectly, with or without typing indentation', () => {
    for (const list of Object.values(CODE_SNIPPETS)) {
      for (const s of list) {
        const withIndent = new TypingEngine(s.code, { wordSkip: false, autoIndent: true });
        for (const ch of s.code) withIndent.type(ch);
        expect(withIndent.status, s.title).toBe('finished');
        expect(withIndent.inputs.incorrect, s.title).toBe(0);

        const withoutIndent = new TypingEngine(s.code, { wordSkip: false, autoIndent: true });
        for (const ch of s.code.replace(/\n +/g, '\n')) withoutIndent.type(ch);
        expect(withoutIndent.status, s.title).toBe('finished');
        expect(withoutIndent.inputs.incorrect, s.title).toBe(0);
      }
    }
  });

  it('code mode never repeats a snippet until all have been typed', () => {
    const config = { ...DEFAULT_TEST_CONFIG, mode: 'code' as const, codeLanguage: 'python' as const };
    const total = CODE_SNIPPETS.python.length;
    const texts = new Set(Array.from({ length: total }, (_, i) => createPassage(config, i).text));
    expect(texts.size).toBe(total);
  });

  it('quote mode cycles through every quote', () => {
    const config = { ...DEFAULT_TEST_CONFIG, mode: 'quote' as const, quoteLength: 'short' as const };
    const total = QUOTES.short.length;
    const texts = new Set(Array.from({ length: total }, (_, i) => createPassage(config, i).text));
    expect(texts.size).toBe(total);
  });
});
