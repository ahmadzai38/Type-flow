import type { TestResult } from '../types';

export interface Summary {
  tests: number;
  totalTimeMs: number;
  averageWpm: number;
  bestWpm: number;
  averageAccuracy: number;
  currentStreak: number;
  longestStreak: number;
  /** Average WPM of the last 10 tests minus the 10 before them (null if not enough data). */
  recentTrend: number | null;
}

/** Local calendar day key, e.g. "2026-10-12". */
export function dayKey(timestamp: number): string {
  const d = new Date(timestamp);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function addDays(key: string, delta: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d + delta, 12);
  return dayKey(date.getTime());
}

export function practiceByDay(results: readonly TestResult[]): Map<string, { tests: number; timeMs: number }> {
  const map = new Map<string, { tests: number; timeMs: number }>();
  for (const r of results) {
    const k = dayKey(r.timestamp);
    const e = map.get(k) ?? { tests: 0, timeMs: 0 };
    e.tests++;
    e.timeMs += r.durationMs;
    map.set(k, e);
  }
  return map;
}

/**
 * Streaks count consecutive local calendar days with at least one test.
 * The current streak stays alive until the end of today, so practicing
 * yesterday but not yet today still counts.
 */
export function streaks(days: ReadonlySet<string>, now: number = Date.now()): { current: number; longest: number } {
  if (days.size === 0) return { current: 0, longest: 0 };
  const sorted = [...days].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    run = addDays(sorted[i - 1], 1) === sorted[i] ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  const today = dayKey(now);
  let cursor = days.has(today) ? today : addDays(today, -1);
  let current = 0;
  while (days.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }
  return { current, longest };
}

const mean = (xs: readonly number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function summarize(results: readonly TestResult[], now: number = Date.now()): Summary {
  const days = new Set(results.map((r) => dayKey(r.timestamp)));
  const { current, longest } = streaks(days, now);
  const wpms = results.map((r) => r.wpm);
  let recentTrend: number | null = null;
  if (results.length >= 20) {
    recentTrend = mean(wpms.slice(-10)) - mean(wpms.slice(-20, -10));
  }
  return {
    tests: results.length,
    totalTimeMs: results.reduce((a, r) => a + r.durationMs, 0),
    averageWpm: mean(wpms),
    bestWpm: wpms.length ? Math.max(...wpms) : 0,
    averageAccuracy: mean(results.map((r) => r.accuracy)),
    currentStreak: current,
    longestStreak: longest,
    recentTrend,
  };
}

/** Simple trailing moving average used to smooth the progress chart. */
export function movingAverage(values: readonly number[], window: number): number[] {
  const out: number[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= window) sum -= values[i - window];
    out.push(sum / Math.min(i + 1, window));
  }
  return out;
}

export function bestForLabel(results: readonly TestResult[], label: string): number | null {
  let best: number | null = null;
  for (const r of results) if (r.label === label && (best === null || r.wpm > best)) best = r.wpm;
  return best;
}

/** Builds the calendar grid for the activity heatmap: `weeks` columns, Sunday-first. */
export function activityGrid(
  byDay: ReadonlyMap<string, { tests: number }>,
  weeks: number,
  now: number = Date.now(),
): Array<Array<{ key: string; tests: number; future: boolean }>> {
  const today = new Date(now);
  const todayKey = dayKey(now);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() - (weeks - 1) * 7, 12);
  const columns: Array<Array<{ key: string; tests: number; future: boolean }>> = [];
  for (let w = 0; w < weeks; w++) {
    const col: Array<{ key: string; tests: number; future: boolean }> = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + d, 12);
      const key = dayKey(date.getTime());
      col.push({ key, tests: byDay.get(key)?.tests ?? 0, future: key > todayKey });
    }
    columns.push(col);
  }
  return columns;
}
