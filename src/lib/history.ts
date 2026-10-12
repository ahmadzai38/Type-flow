import type { TestMode, TestResult } from '../types';
import { STORAGE_KEYS, isRecord, readJson, removeKey, writeJson } from './storage';

/** Maximum results kept on the device. Oldest results are dropped first. */
export const HISTORY_LIMIT = 500;
export const EXPORT_FORMAT = 'typeflow-history';
export const EXPORT_VERSION = 1;

const MODES: readonly TestMode[] = ['time', 'words', 'quote', 'custom', 'code'];

const finiteIn = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;

const count = (v: unknown): v is number => finiteIn(v, 0, 1e7) && Number.isInteger(v);

/** Returns a clean TestResult or null when the value is not a valid record. */
export function validateResult(value: unknown): TestResult | null {
  if (!isRecord(value)) return null;
  const v = value;
  if (typeof v.id !== 'string' || v.id.length === 0 || v.id.length > 64) return null;
  if (!finiteIn(v.timestamp, 946684800000, 4102444800000)) return null; // 2000 – 2100
  if (!MODES.includes(v.mode as TestMode)) return null;
  if (typeof v.label !== 'string' || v.label.length > 80) return null;
  if (!finiteIn(v.wpm, 0, 1000) || !finiteIn(v.rawWpm, 0, 1000)) return null;
  if (!finiteIn(v.accuracy, 0, 100) || !finiteIn(v.consistency, 0, 100)) return null;
  if (!finiteIn(v.durationMs, 0, 24 * 3600 * 1000)) return null;
  const counts = ['correctChars', 'incorrectChars', 'extraChars', 'missedChars', 'correctInputs', 'incorrectInputs'] as const;
  if (!counts.every((k) => count(v[k]))) return null;
  return {
    id: v.id,
    timestamp: v.timestamp,
    mode: v.mode as TestMode,
    label: v.label,
    wpm: v.wpm,
    rawWpm: v.rawWpm,
    accuracy: v.accuracy,
    consistency: v.consistency,
    durationMs: v.durationMs,
    correctChars: v.correctChars as number,
    incorrectChars: v.incorrectChars as number,
    extraChars: v.extraChars as number,
    missedChars: v.missedChars as number,
    correctInputs: v.correctInputs as number,
    incorrectInputs: v.incorrectInputs as number,
  };
}

/** Sorts oldest → newest, removes duplicate ids, and enforces the limit. */
export function normalizeHistory(results: readonly TestResult[], limit = HISTORY_LIMIT): TestResult[] {
  const byId = new Map<string, TestResult>();
  for (const r of results) byId.set(r.id, r);
  const sorted = [...byId.values()].sort((a, b) => a.timestamp - b.timestamp);
  return sorted.length > limit ? sorted.slice(sorted.length - limit) : sorted;
}

export function parseStoredHistory(value: unknown): TestResult[] {
  if (!Array.isArray(value)) return [];
  const valid: TestResult[] = [];
  for (const item of value) {
    const r = validateResult(item);
    if (r) valid.push(r);
  }
  return normalizeHistory(valid);
}

export function serializeHistory(results: readonly TestResult[]): string {
  return JSON.stringify(
    { format: EXPORT_FORMAT, version: EXPORT_VERSION, exportedAt: new Date().toISOString(), results },
    null,
    2,
  );
}

export type ImportOutcome =
  | { ok: true; results: TestResult[]; added: number; skipped: number }
  | { ok: false; error: string };

/** Parses an exported file and merges it into `existing`. Never throws. */
export function importHistory(json: string, existing: readonly TestResult[]): ImportOutcome {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' };
  }
  let items: unknown;
  if (Array.isArray(data)) items = data;
  else if (isRecord(data) && data.format === EXPORT_FORMAT && Array.isArray(data.results)) {
    if (typeof data.version === 'number' && data.version > EXPORT_VERSION) {
      return { ok: false, error: 'This export was made by a newer version of TypeFlow.' };
    }
    items = data.results;
  } else {
    return { ok: false, error: 'This does not look like a TypeFlow history export.' };
  }
  const list = items as unknown[];
  const valid: TestResult[] = [];
  for (const item of list) {
    const r = validateResult(item);
    if (r) valid.push(r);
  }
  if (list.length > 0 && valid.length === 0) {
    return { ok: false, error: 'No valid test results were found in that file.' };
  }
  const known = new Set(existing.map((r) => r.id));
  const added = valid.filter((r) => !known.has(r.id)).length;
  return {
    ok: true,
    results: normalizeHistory([...existing, ...valid]),
    added,
    skipped: list.length - valid.length,
  };
}

// ---------------------------------------------------------------- store

type Listener = () => void;

/** Tiny external store: loaded lazily once, written only when a test completes. */
export function createHistoryStore(key: string = STORAGE_KEYS.history) {
  let results: TestResult[] | null = null;
  const listeners = new Set<Listener>();

  const load = (): TestResult[] => {
    if (results === null) results = parseStoredHistory(readJson(key));
    return results;
  };
  const commit = (next: TestResult[]) => {
    results = next;
    if (next.length === 0) removeKey(key);
    else writeJson(key, next);
    for (const l of listeners) l();
  };

  return {
    getSnapshot: (): readonly TestResult[] => load(),
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    add(result: TestResult) {
      commit(normalizeHistory([...load(), result]));
    },
    replace(next: readonly TestResult[]) {
      commit(normalizeHistory(next));
    },
    clear() {
      commit([]);
    },
  };
}

export const historyStore = createHistoryStore();

export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
