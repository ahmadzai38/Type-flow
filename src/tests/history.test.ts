import { describe, expect, it } from 'vitest';
import { activityGrid, dayKey, movingAverage, practiceByDay, streaks, summarize } from '../lib/aggregate';
import {
  HISTORY_LIMIT,
  createHistoryStore,
  importHistory,
  normalizeHistory,
  parseStoredHistory,
  serializeHistory,
  validateResult,
} from '../lib/history';
import type { TestResult } from '../types';

const DAY = 86_400_000;
const BASE = new Date(2026, 9, 12, 12).getTime();

function result(i: number, patch: Partial<TestResult> = {}): TestResult {
  return {
    id: `r${i}`,
    timestamp: BASE + i * 1000,
    mode: 'time',
    label: 'time 30',
    wpm: 60 + i,
    rawWpm: 65 + i,
    accuracy: 96,
    consistency: 80,
    durationMs: 30_000,
    correctChars: 300,
    incorrectChars: 3,
    extraChars: 0,
    missedChars: 0,
    correctInputs: 310,
    incorrectInputs: 12,
    ...patch,
  };
}

describe('result validation', () => {
  it('accepts a valid record and strips unknown fields', () => {
    const r = validateResult({ ...result(1), evil: '<script>' });
    expect(r).toEqual(result(1));
  });
  it('rejects malformed records', () => {
    expect(validateResult(null)).toBeNull();
    expect(validateResult({ ...result(1), wpm: 'fast' })).toBeNull();
    expect(validateResult({ ...result(1), accuracy: 140 })).toBeNull();
    expect(validateResult({ ...result(1), mode: 'zen' })).toBeNull();
    expect(validateResult({ ...result(1), correctChars: 1.5 })).toBeNull();
    expect(validateResult({ ...result(1), timestamp: 5 })).toBeNull();
  });
});

describe('history limits and storage', () => {
  it('sorts, de-duplicates and caps history', () => {
    const many = Array.from({ length: HISTORY_LIMIT + 20 }, (_, i) => result(i));
    const normalized = normalizeHistory([...many].reverse());
    expect(normalized).toHaveLength(HISTORY_LIMIT);
    expect(normalized[0].id).toBe('r20');
    expect(normalizeHistory([result(1), result(1)])).toHaveLength(1);
  });

  it('ignores corrupted storage', () => {
    expect(parseStoredHistory('nope')).toEqual([]);
    expect(parseStoredHistory([result(1), { bad: true }])).toEqual([result(1)]);
  });

  it('store persists only on add/clear and enforces the limit', () => {
    const store = createHistoryStore('test:history');
    expect(store.getSnapshot()).toEqual([]);
    store.add(result(1));
    expect(JSON.parse(localStorage.getItem('test:history')!)).toHaveLength(1);
    let notified = 0;
    store.subscribe(() => notified++);
    store.add(result(2));
    expect(notified).toBe(1);
    store.clear();
    expect(localStorage.getItem('test:history')).toBeNull();
    // reload from storage
    localStorage.setItem('test:history', JSON.stringify([result(3)]));
    expect(createHistoryStore('test:history').getSnapshot()).toEqual([result(3)]);
  });
});

describe('export / import', () => {
  it('round-trips through JSON', () => {
    const json = serializeHistory([result(1), result(2)]);
    const out = importHistory(json, []);
    expect(out).toMatchObject({ ok: true, added: 2, skipped: 0 });
  });

  it('merges without duplicates and reports skipped entries', () => {
    const json = JSON.stringify({ format: 'typeflow-history', version: 1, results: [result(1), result(2), { x: 1 }] });
    const out = importHistory(json, [result(1)]);
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.results.map((r) => r.id)).toEqual(['r1', 'r2']);
      expect(out.added).toBe(1);
      expect(out.skipped).toBe(1);
    }
  });

  it('rejects invalid files with a helpful error', () => {
    expect(importHistory('{not json', [])).toMatchObject({ ok: false });
    expect(importHistory('{"hello":1}', [])).toMatchObject({ ok: false });
    expect(importHistory('[{"id":1}]', [])).toMatchObject({ ok: false });
    expect(importHistory(JSON.stringify({ format: 'typeflow-history', version: 99, results: [] }), [])).toMatchObject({
      ok: false,
    });
  });
});

describe('aggregates', () => {
  it('summarizes totals, averages and bests', () => {
    const s = summarize([result(0), result(10)], BASE);
    expect(s.tests).toBe(2);
    expect(s.totalTimeMs).toBe(60_000);
    expect(s.averageWpm).toBe(65);
    expect(s.bestWpm).toBe(70);
    expect(s.averageAccuracy).toBe(96);
    expect(s.recentTrend).toBeNull();
  });

  it('returns safe values for empty history', () => {
    const s = summarize([], BASE);
    expect(s).toMatchObject({ tests: 0, averageWpm: 0, bestWpm: 0, currentStreak: 0, longestStreak: 0 });
  });

  it('computes current and longest daily streaks', () => {
    const days = new Set([dayKey(BASE - 6 * DAY), dayKey(BASE - 5 * DAY), dayKey(BASE - 4 * DAY), dayKey(BASE - DAY), dayKey(BASE)]);
    expect(streaks(days, BASE)).toEqual({ current: 2, longest: 3 });
    // practicing yesterday keeps today's streak alive
    expect(streaks(new Set([dayKey(BASE - DAY)]), BASE)).toEqual({ current: 1, longest: 1 });
    expect(streaks(new Set([dayKey(BASE - 3 * DAY)]), BASE).current).toBe(0);
  });

  it('builds a daily activity grid', () => {
    const byDay = practiceByDay([result(1), result(2)]);
    expect(byDay.get(dayKey(BASE))?.tests).toBe(2);
    const grid = activityGrid(byDay, 4, BASE);
    expect(grid).toHaveLength(4);
    expect(grid.flat().find((c) => c.key === dayKey(BASE))?.tests).toBe(2);
  });

  it('moving average', () => {
    expect(movingAverage([2, 4, 6, 8], 2)).toEqual([2, 3, 5, 7]);
  });
});
