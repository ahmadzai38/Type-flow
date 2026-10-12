import type { Rng } from './random';
import { isRecord, readJson, writeJson } from './storage';

/**
 * "Shuffle bag" rotation: every item in a collection is shown once, in random
 * order, before any item repeats. The remaining order is saved on the device
 * so the rotation continues across page reloads and visits. The same item is
 * never shown twice in a row, even when a new round starts.
 */
export const ROTATION_KEY = 'typeflow:rotation:v1';

interface Bag {
  size: number;
  queue: number[];
  last: number;
}

function isBag(v: unknown): v is Bag {
  if (!isRecord(v)) return false;
  const { size, queue, last } = v;
  if (typeof size !== 'number' || !Number.isInteger(size) || size < 0) return false;
  if (typeof last !== 'number' || !Number.isInteger(last)) return false;
  if (!Array.isArray(queue) || queue.length > size) return false;
  const seen = new Set<number>();
  for (const i of queue) {
    if (typeof i !== 'number' || !Number.isInteger(i) || i < 0 || i >= size || seen.has(i)) return false;
    seen.add(i);
  }
  return true;
}

function shuffled(size: number, rng: Rng): number[] {
  const out = Array.from({ length: size }, (_, i) => i);
  for (let i = size - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function createRotation(storageKey: string = ROTATION_KEY) {
  let bags: Record<string, Bag> | null = null;

  const load = (): Record<string, Bag> => {
    if (bags) return bags;
    bags = {};
    const stored = readJson(storageKey);
    if (isRecord(stored)) {
      for (const [id, bag] of Object.entries(stored)) if (isBag(bag)) bags[id] = bag;
    }
    return bags;
  };

  return {
    /** Returns the index of the next item for collection `id` of length `size`. */
    next(id: string, size: number, rng: Rng): number {
      if (size <= 1) return 0;
      const all = load();
      let bag = all[id];
      if (!bag || bag.size !== size || bag.queue.length === 0) {
        const last = bag && bag.size === size ? bag.last : -1;
        const queue = shuffled(size, rng);
        // Items are taken from the end; never start a new round with the previous item.
        if (queue[queue.length - 1] === last) [queue[0], queue[queue.length - 1]] = [queue[queue.length - 1], queue[0]];
        bag = { size, queue, last };
      }
      const index = bag.queue.pop()!;
      bag.last = index;
      all[id] = bag;
      writeJson(storageKey, all);
      return index;
    },
    /** How many items of the current round have been shown (1-based position). */
    position(id: string): { shown: number; total: number } | null {
      const bag = load()[id];
      return bag ? { shown: bag.size - bag.queue.length, total: bag.size } : null;
    },
  };
}

export const rotation = createRotation();
