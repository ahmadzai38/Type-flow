import { describe, expect, it } from 'vitest';
import { accuracy, buildTimeline, computeMetrics, consistency, consistencySeries, round, wordsPerMinute } from '../lib/stats';
import { TypingEngine } from '../lib/engine';

describe('wordsPerMinute', () => {
  it('uses 5 characters per word', () => {
    expect(wordsPerMinute(50, 60_000)).toBe(10);
    expect(wordsPerMinute(250, 30_000)).toBe(100);
  });
  it('returns 0 for zero, negative or invalid time', () => {
    expect(wordsPerMinute(50, 0)).toBe(0);
    expect(wordsPerMinute(50, -5)).toBe(0);
    expect(wordsPerMinute(50, Number.NaN)).toBe(0);
    expect(wordsPerMinute(0, 1000)).toBe(0);
  });
});

describe('accuracy', () => {
  it('is correct inputs over all evaluated inputs', () => {
    expect(accuracy(95, 5)).toBe(95);
    expect(accuracy(1, 0)).toBe(100);
  });
  it('returns 0 with no inputs', () => {
    expect(accuracy(0, 0)).toBe(0);
  });
});

describe('consistency', () => {
  it('is 100 for a perfectly steady pace', () => {
    expect(consistency([60, 60, 60])).toBe(100);
  });
  it('decreases with variation and never goes below 0', () => {
    expect(consistency([50, 70])).toBeCloseTo(100 * (1 - 10 / 60));
    expect(consistency([0, 0, 300])).toBe(0);
  });
  it('handles empty and single-value series', () => {
    expect(consistency([])).toBe(0);
    expect(consistency([40])).toBe(100);
    expect(consistency([0, 0])).toBe(0);
  });
  it('ignores tiny trailing intervals', () => {
    const series = consistencySeries([
      { t: 1, correctChars: 5, inputs: 5, errors: 0 },
      { t: 1.2, correctChars: 6, inputs: 6, errors: 0 },
    ]);
    expect(series).toEqual([60]);
  });
});

describe('timeline', () => {
  it('computes cumulative wpm and per-interval raw wpm', () => {
    const points = buildTimeline([
      { t: 1, correctChars: 5, inputs: 6, errors: 1 },
      { t: 2, correctChars: 15, inputs: 16, errors: 1 },
    ]);
    expect(points[0]).toEqual({ t: 1, wpm: 60, raw: 72, errors: 1 });
    expect(points[1]).toEqual({ t: 2, wpm: 90, raw: 120, errors: 0 });
  });
});

describe('computeMetrics with a real engine', () => {
  it('distinguishes corrected errors: WPM rises, accuracy remembers', () => {
    let t = 0;
    const e = new TypingEngine('abcde abcde', { now: () => t });
    for (const ch of 'abx') e.type(ch);
    e.backspace();
    for (const ch of 'cde abcde') {
      t += 100;
      e.type(ch);
    }
    expect(e.status).toBe('finished');
    const m = computeMetrics({
      elapsedMs: e.elapsedMs(),
      correctInputs: e.inputs.correct,
      incorrectInputs: e.inputs.incorrect,
      correctChars: e.counts.correct,
      samples: e.samples,
    });
    // 11 correct chars in 0.9 s
    expect(round(m.wpm, 4)).toBe(round(wordsPerMinute(11, 900), 4));
    // 12 inputs (11 correct + 1 wrong)
    expect(round(m.rawWpm, 4)).toBe(round(wordsPerMinute(12, 900), 4));
    expect(m.accuracy).toBeCloseTo((11 / 12) * 100);
  });

  it('returns zeros for an empty test', () => {
    const m = computeMetrics({ elapsedMs: 0, correctInputs: 0, incorrectInputs: 0, correctChars: 0, samples: [] });
    expect(m).toEqual({ wpm: 0, rawWpm: 0, accuracy: 0, consistency: 0, timeline: [] });
  });
});
