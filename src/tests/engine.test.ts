import { describe, expect, it } from 'vitest';
import { CharState, TypingEngine } from '../lib/engine';

function clock(start = 1000) {
  let t = start;
  return {
    now: () => t,
    advance: (ms: number) => {
      t += ms;
    },
  };
}

function typeAll(engine: TypingEngine, text: string) {
  for (const ch of text) engine.type(ch);
}

describe('TypingEngine basics', () => {
  it('starts idle and begins on the first valid input', () => {
    const c = clock();
    const e = new TypingEngine('hello world', { now: c.now });
    expect(e.status).toBe('idle');
    expect(e.startTime).toBeNull();
    c.advance(500);
    e.type('h');
    expect(e.status).toBe('running');
    expect(e.startTime).toBe(1500);
  });

  it('marks correct and incorrect characters and counts inputs', () => {
    const e = new TypingEngine('abc');
    e.type('a');
    e.type('x');
    expect(e.states[0]).toBe(CharState.Correct);
    expect(e.states[1]).toBe(CharState.Incorrect);
    expect(e.cursor).toBe(2);
    expect(e.inputs).toMatchObject({ correct: 1, incorrect: 1 });
    expect(e.counts).toMatchObject({ correct: 1, incorrect: 1 });
  });

  it('finishes when the last character is typed', () => {
    const c = clock();
    const e = new TypingEngine('hi', { now: c.now });
    e.type('h');
    c.advance(1000);
    e.type('i');
    expect(e.status).toBe('finished');
    expect(e.elapsedMs()).toBe(1000);
    expect(e.type('x')).toBe(false);
  });

  it('segments words including their trailing space', () => {
    const e = new TypingEngine('one two three');
    expect(e.wordStarts).toEqual([0, 4, 8]);
    expect(e.wordCount).toBe(3);
    expect(e.wordEnd(0)).toBe(4);
    expect(e.wordEnd(2)).toBe(13);
  });

  it('handles punctuation and spaces literally', () => {
    const e = new TypingEngine('Hi, you!');
    typeAll(e, 'Hi, you!');
    expect(e.status).toBe('finished');
    expect(e.counts.correct).toBe(8);
    expect(e.inputs.incorrect).toBe(0);
  });

  it('ignores a space at the start of a word (no accidental skips)', () => {
    const e = new TypingEngine('ab cd');
    expect(e.type(' ')).toBe(false);
    expect(e.status).toBe('idle');
    typeAll(e, 'ab ');
    expect(e.type(' ')).toBe(false);
    expect(e.cursor).toBe(3);
  });
});

describe('Backspace and correction', () => {
  it('reverts the last character but keeps the historical mistake', () => {
    const e = new TypingEngine('cat');
    e.type('c');
    e.type('x');
    e.backspace();
    expect(e.cursor).toBe(1);
    expect(e.states[1]).toBe(CharState.Untyped);
    expect(e.counts.incorrect).toBe(0);
    e.type('a');
    e.type('t');
    expect(e.counts).toMatchObject({ correct: 3, incorrect: 0 });
    // the original typo is still part of accuracy
    expect(e.inputs).toMatchObject({ correct: 3, incorrect: 1, backspaces: 1 });
  });

  it('does nothing at the very start', () => {
    const e = new TypingEngine('abc');
    expect(e.backspace()).toBe(false);
    e.type('a');
    e.backspace();
    expect(e.backspace()).toBe(false);
    expect(e.inputs.backspaces).toBe(1);
  });

  it('can backspace into the previous word', () => {
    const e = new TypingEngine('ab cd');
    typeAll(e, 'ab c');
    e.backspace();
    e.backspace();
    expect(e.cursor).toBe(2);
    expect(e.states[2]).toBe(CharState.Untyped);
  });

  it('deletes a whole word with ctrl+backspace', () => {
    const e = new TypingEngine('hello there');
    typeAll(e, 'hello th');
    e.backspace(true);
    expect(e.cursor).toBe(6);
    e.backspace(true); // at a word start: removes the space and the previous word
    expect(e.cursor).toBe(0);
    expect(e.counts.correct).toBe(0);
  });
});

describe('Extra and missed characters (prose)', () => {
  it('collects extra characters typed where a space is expected', () => {
    const e = new TypingEngine('ab cd');
    typeAll(e, 'abxy');
    expect(e.cursor).toBe(2);
    expect(e.extras.get(2)).toBe('xy');
    expect(e.counts.extra).toBe(2);
    expect(e.inputs).toMatchObject({ incorrect: 2, extra: 2 });
    e.backspace();
    expect(e.extras.get(2)).toBe('x');
    e.backspace();
    expect(e.extras.has(2)).toBe(false);
    expect(e.cursor).toBe(2);
  });

  it('caps extra characters per word', () => {
    const e = new TypingEngine('a b', { maxExtrasPerWord: 3 });
    typeAll(e, 'azzzzzz');
    expect(e.extras.get(1)).toBe('zzz');
    expect(e.inputs.extra).toBe(6);
  });

  it('skips the rest of a word on space and marks it missed', () => {
    const e = new TypingEngine('hello world');
    typeAll(e, 'he ');
    expect(e.cursor).toBe(6);
    expect(e.counts.missed).toBe(3);
    expect([2, 3, 4].map((i) => e.states[i])).toEqual([CharState.Missed, CharState.Missed, CharState.Missed]);
    expect(e.states[5]).toBe(CharState.Correct);
    // backspace undoes the whole skip
    e.backspace();
    expect(e.cursor).toBe(2);
    expect(e.counts.missed).toBe(0);
  });

  it('finishes when the last word is skipped', () => {
    const e = new TypingEngine('ab cd');
    typeAll(e, 'ab c ');
    expect(e.status).toBe('finished');
    expect(e.counts.missed).toBe(1);
  });

  it('treats space as a normal character when wordSkip is off', () => {
    const e = new TypingEngine('ab cd', { wordSkip: false });
    typeAll(e, 'a ');
    expect(e.states[1]).toBe(CharState.Incorrect);
    expect(e.cursor).toBe(2);
  });
});

describe('Code mode', () => {
  it('auto-fills indentation after a correct newline and undoes it together', () => {
    const e = new TypingEngine('if x:\n    y', { wordSkip: false, autoIndent: true });
    typeAll(e, 'if x:\n');
    expect(e.cursor).toBe(10);
    expect(e.states[6]).toBe(CharState.Auto);
    expect(e.counts.correct).toBe(6); // auto-filled spaces are not counted
    e.backspace();
    expect(e.cursor).toBe(5);
    expect(e.states[6]).toBe(CharState.Untyped);
  });

  it('ignores indentation typed by habit after auto-indent', () => {
    const e = new TypingEngine('if x:\n    y', { wordSkip: false, autoIndent: true });
    typeAll(e, 'if x:\n    y');
    expect(e.status).toBe('finished');
    expect(e.inputs.incorrect).toBe(0);
  });

  it('does not auto-indent after a wrong character', () => {
    const e = new TypingEngine('a\n  b', { wordSkip: false, autoIndent: true });
    typeAll(e, 'ax');
    expect(e.cursor).toBe(2);
    expect(e.states[2]).toBe(CharState.Untyped);
  });
});

describe('Time mode support', () => {
  it('appends text with a separating space and keeps word indexes', () => {
    const e = new TypingEngine('one two', { now: clock().now });
    e.append('three');
    expect(e.target).toBe('one two three');
    expect(e.wordCount).toBe(3);
    expect(e.states.length).toBe(13);
  });

  it('records per-second samples and a final sample on finish', () => {
    const c = clock(0);
    const e = new TypingEngine('aaaa aaaa aaaa', { now: c.now });
    e.type('a');
    c.advance(1000);
    e.type('a');
    e.recordSample(1);
    c.advance(500);
    e.type('b');
    e.finish(e.startTime! + 2000);
    expect(e.samples).toEqual([
      { t: 1, correctChars: 2, inputs: 2, errors: 0 },
      { t: 2, correctChars: 2, inputs: 3, errors: 1 },
    ]);
    expect(e.elapsedMs()).toBe(2000);
  });

  it('finishing an idle test yields zero elapsed time', () => {
    const e = new TypingEngine('abc', { now: clock().now });
    e.finish();
    expect(e.status).toBe('finished');
    expect(e.elapsedMs()).toBe(0);
  });
});

describe('Rendering hints', () => {
  it('bumps only the versions of touched words', () => {
    const e = new TypingEngine('aa bb cc');
    e.type('a');
    expect(e.wordVersions).toEqual([1, 0, 0]);
    typeAll(e, 'a ');
    expect(e.wordVersions[1]).toBeGreaterThan(0);
    expect(e.wordVersions[2]).toBe(0);
  });

  it('notifies subscribers and supports unsubscribe', () => {
    const e = new TypingEngine('ab');
    let calls = 0;
    const off = e.subscribe(() => calls++);
    e.type('a');
    off();
    e.type('b');
    expect(calls).toBe(1);
  });
});
