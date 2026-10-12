/**
 * Typing statistics — pure, deterministic functions.
 *
 * Definitions (a "word" is always 5 characters, spaces included):
 *
 *   Raw WPM      = (all character inputs / 5) / minutes
 *   WPM          = (correct characters in the final text / 5) / minutes
 *   Accuracy     = correct inputs / (correct + incorrect inputs) × 100
 *   Consistency  = 100 × (1 − σ / μ) of the per-second raw WPM, clamped to 0–100
 *
 * "Inputs" are historical: a typo that is later fixed still counts as one
 * incorrect input, so accuracy reflects how cleanly you typed. "Correct
 * characters" describe the final text, so fixing a typo raises WPM.
 * Backspaces are not character inputs. Auto-filled indentation is excluded
 * from every count.
 */
import type { Sample } from './engine';
import type { TimelinePoint } from '../types';

const CHARS_PER_WORD = 5;

export function wordsPerMinute(chars: number, elapsedMs: number): number {
  if (!(elapsedMs > 0) || !(chars > 0)) return 0;
  return chars / CHARS_PER_WORD / (elapsedMs / 60000);
}

export function accuracy(correctInputs: number, incorrectInputs: number): number {
  const total = correctInputs + incorrectInputs;
  if (total <= 0) return 0;
  return (correctInputs / total) * 100;
}

export function consistency(values: readonly number[]): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0] > 0 ? 100 : 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean <= 0) return 0;
  const variance = values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length;
  const cv = Math.sqrt(variance) / mean;
  return Math.min(100, Math.max(0, 100 * (1 - cv)));
}

/** Converts cumulative samples into per-interval chart points. */
export function buildTimeline(samples: readonly Sample[]): TimelinePoint[] {
  const points: TimelinePoint[] = [];
  let prevT = 0;
  let prevInputs = 0;
  let prevErrors = 0;
  for (const s of samples) {
    const dt = s.t - prevT;
    if (dt <= 0) continue;
    points.push({
      t: s.t,
      wpm: wordsPerMinute(s.correctChars, s.t * 1000),
      raw: wordsPerMinute(s.inputs - prevInputs, dt * 1000),
      errors: s.errors - prevErrors,
    });
    prevT = s.t;
    prevInputs = s.inputs;
    prevErrors = s.errors;
  }
  return points;
}

/** Per-interval raw WPM used for consistency; very short trailing slices are ignored. */
export function consistencySeries(samples: readonly Sample[]): number[] {
  const out: number[] = [];
  let prevT = 0;
  let prevInputs = 0;
  for (const s of samples) {
    const dt = s.t - prevT;
    if (dt >= 0.5) out.push(wordsPerMinute(s.inputs - prevInputs, dt * 1000));
    if (dt > 0) {
      prevT = s.t;
      prevInputs = s.inputs;
    }
  }
  return out;
}

export interface MetricsInput {
  elapsedMs: number;
  correctInputs: number;
  incorrectInputs: number;
  correctChars: number;
  samples: readonly Sample[];
}

export interface Metrics {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  timeline: TimelinePoint[];
}

export function computeMetrics(input: MetricsInput): Metrics {
  const totalInputs = input.correctInputs + input.incorrectInputs;
  return {
    wpm: wordsPerMinute(input.correctChars, input.elapsedMs),
    rawWpm: wordsPerMinute(totalInputs, input.elapsedMs),
    accuracy: accuracy(input.correctInputs, input.incorrectInputs),
    consistency: consistency(consistencySeries(input.samples)),
    timeline: buildTimeline(input.samples),
  };
}

export function round(value: number, digits = 2): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}
