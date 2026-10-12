/**
 * Defensive localStorage helpers. Storage can be unavailable (private mode,
 * disabled cookies, quota errors); the app must keep working without it.
 */
export const STORAGE_KEYS = {
  settings: 'typeflow:settings:v1',
  history: 'typeflow:history:v1',
} as const;

export function readJson(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* storage unavailable — nothing to remove */
  }
}

export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
