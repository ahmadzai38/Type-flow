import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, loadSettings, sanitizeSettings } from '../lib/settings';
import { STORAGE_KEYS } from '../lib/storage';

describe('settings', () => {
  it('falls back to defaults for missing or corrupted data', () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    localStorage.setItem(STORAGE_KEYS.settings, '{broken');
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps valid values and clamps or rejects invalid ones', () => {
    const s = sanitizeSettings({
      theme: 'ocean',
      fontSize: 400,
      lineHeight: 'tall',
      caretStyle: 'block',
      sound: true,
      test: { mode: 'words', words: 50, time: 7, difficulty: 'hard' },
    });
    expect(s.theme).toBe('ocean');
    expect(s.fontSize).toBe(40);
    expect(s.lineHeight).toBe(DEFAULT_SETTINGS.lineHeight);
    expect(s.caretStyle).toBe('block');
    expect(s.sound).toBe(true);
    expect(s.test).toMatchObject({ mode: 'words', words: 50, time: 30, difficulty: 'hard' });
  });

  it('sound is off by default and dark theme is the default', () => {
    expect(DEFAULT_SETTINGS.sound).toBe(false);
    expect(DEFAULT_SETTINGS.theme).toBe('midnight');
  });
});
