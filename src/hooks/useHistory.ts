import { useSyncExternalStore } from 'react';
import { historyStore } from '../lib/history';
import type { TestResult } from '../types';

export function useHistory(): readonly TestResult[] {
  return useSyncExternalStore(historyStore.subscribe, historyStore.getSnapshot, historyStore.getSnapshot);
}
