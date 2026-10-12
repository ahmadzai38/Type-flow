import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { SettingsContext, type SettingsContextValue } from '../hooks/settingsContext';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { DEFAULT_SETTINGS, loadSettings, sanitizeSettings } from '../lib/settings';
import { STORAGE_KEYS, writeJson } from '../lib/storage';
import type { Settings } from '../types';

export function SettingsProvider({ children, initial }: { children: ReactNode; initial?: Settings }) {
  const [settings, setSettings] = useState<Settings>(() => initial ?? loadSettings());
  const prefersReduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const reducedMotion = settings.motion === 'reduce' || (settings.motion === 'system' && prefersReduced);

  // Settings change rarely (never per keystroke), so writing on change is cheap.
  useEffect(() => {
    writeJson(STORAGE_KEYS.settings, settings);
  }, [settings]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = settings.theme;
    root.dataset.motion = reducedMotion ? 'reduce' : 'full';
    const bg = getComputedStyle(root).getPropertyValue('--tf-bg').trim();
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && bg) meta.setAttribute('content', bg);
  }, [settings.theme, reducedMotion]);

  const update = useCallback<SettingsContextValue['update']>((patch) => {
    setSettings((s) => sanitizeSettings({ ...s, ...patch }));
  }, []);
  const updateTest = useCallback<SettingsContextValue['updateTest']>((patch) => {
    setSettings((s) => sanitizeSettings({ ...s, test: { ...s.test, ...patch } }));
  }, []);
  const reset = useCallback(() => setSettings(DEFAULT_SETTINGS), []);

  const value = useMemo(
    () => ({ settings, reducedMotion, update, updateTest, reset }),
    [settings, reducedMotion, update, updateTest, reset],
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
