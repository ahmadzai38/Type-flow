import { useSyncExternalStore } from 'react';
import type { EngineStatus, TypingEngine } from '../lib/engine';

/** Re-renders on every engine change (use only in the typing surface). */
export function useEngineVersion(engine: TypingEngine): number {
  return useSyncExternalStore(engine.subscribe, engine.getVersion, engine.getVersion);
}

/** Re-renders only when the engine status changes. */
export function useEngineStatus(engine: TypingEngine): EngineStatus {
  return useSyncExternalStore(engine.subscribe, engine.getStatus, engine.getStatus);
}

/** Re-renders only when the selected primitive value changes. */
export function useEngineValue<T extends string | number | boolean>(engine: TypingEngine, select: (e: TypingEngine) => T): T {
  const get = () => select(engine);
  return useSyncExternalStore(engine.subscribe, get, get);
}
