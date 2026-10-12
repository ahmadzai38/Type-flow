import { createContext, useContext } from 'react';
import type { Settings, TestConfig } from '../types';

export interface SettingsContextValue {
  settings: Settings;
  /** True when animations should be minimized (OS preference or user override). */
  reducedMotion: boolean;
  update: (patch: Partial<Omit<Settings, 'test'>>) => void;
  updateTest: (patch: Partial<TestConfig>) => void;
  reset: () => void;
}

export const SettingsContext = createContext<SettingsContextValue | null>(null);

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
}
