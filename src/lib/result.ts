import type { DetailedResult, Passage, TestResult } from '../types';
import type { TypingEngine } from './engine';
import { createId } from './history';
import { describeConfig } from './passage';
import { computeMetrics, round } from './stats';

/** Tests shorter than this are shown but not saved to history. */
export const MIN_SAVED_DURATION_MS = 1000;

export function buildResult(engine: TypingEngine, passage: Passage, timestamp: number = Date.now()): DetailedResult {
  const elapsedMs = engine.elapsedMs();
  const m = computeMetrics({
    elapsedMs,
    correctInputs: engine.inputs.correct,
    incorrectInputs: engine.inputs.incorrect,
    correctChars: engine.counts.correct,
    samples: engine.samples,
  });
  return {
    id: createId(),
    timestamp,
    mode: passage.config.mode,
    label: describeConfig(passage.config),
    wpm: round(m.wpm),
    rawWpm: round(m.rawWpm),
    accuracy: round(m.accuracy),
    consistency: round(m.consistency),
    durationMs: Math.round(elapsedMs),
    correctChars: engine.counts.correct,
    incorrectChars: engine.counts.incorrect,
    extraChars: engine.counts.extra,
    missedChars: engine.counts.missed,
    correctInputs: engine.inputs.correct,
    incorrectInputs: engine.inputs.incorrect,
    timeline: m.timeline,
    backspaces: engine.inputs.backspaces,
    source: passage.source,
    saved: false,
    personalBest: false,
    previousBest: null,
  };
}

export function isSavable(result: TestResult): boolean {
  return result.durationMs >= MIN_SAVED_DURATION_MS && result.correctInputs + result.incorrectInputs > 0;
}

/** Strips in-memory-only fields before storing. */
export function toStored(r: DetailedResult): TestResult {
  return {
    id: r.id,
    timestamp: r.timestamp,
    mode: r.mode,
    label: r.label,
    wpm: r.wpm,
    rawWpm: r.rawWpm,
    accuracy: r.accuracy,
    consistency: r.consistency,
    durationMs: r.durationMs,
    correctChars: r.correctChars,
    incorrectChars: r.incorrectChars,
    extraChars: r.extraChars,
    missedChars: r.missedChars,
    correctInputs: r.correctInputs,
    incorrectInputs: r.incorrectInputs,
  };
}
