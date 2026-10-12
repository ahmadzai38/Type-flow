import { CUSTOM_TEXT_MAX } from './customText';
import { STORAGE_KEYS, isRecord, readJson } from './storage';
import {
  TIME_OPTIONS,
  WORD_OPTIONS,
  type CaretStyle,
  type CodeLanguage,
  type Difficulty,
  type MotionPreference,
  type QuoteLength,
  type Settings,
  type TestConfig,
  type TestMode,
  type ThemeId,
} from '../types';

export const THEMES: ReadonlyArray<{ id: ThemeId; name: string; swatch: [string, string, string] }> = [
  { id: 'midnight', name: 'Midnight Dark', swatch: ['#0f1117', '#7c9cff', '#e8e9ee'] },
  { id: 'light', name: 'Minimal Light', swatch: ['#f7f7f5', '#3b5bdb', '#1f2328'] },
  { id: 'ocean', name: 'Ocean Blue', swatch: ['#0b1a2b', '#4fd1c5', '#d8e9f5'] },
  { id: 'forest', name: 'Forest Green', swatch: ['#111a14', '#8fd18a', '#dfe9df'] },
  { id: 'sepia', name: 'Warm Sepia', swatch: ['#f3ead8', '#b5652b', '#3b2f22'] },
  { id: 'contrast', name: 'High Contrast', swatch: ['#000000', '#ffd400', '#ffffff'] },
];

export const FONT_SIZE = { min: 16, max: 40, step: 2 } as const;
export const LINE_HEIGHT = { min: 1.3, max: 2.2, step: 0.1 } as const;

export const DEFAULT_TEST_CONFIG: TestConfig = {
  mode: 'time',
  time: 30,
  words: 25,
  quoteLength: 'medium',
  codeLanguage: 'javascript',
  punctuation: false,
  numbers: false,
  difficulty: 'medium',
  customText: '',
};

export const DEFAULT_SETTINGS: Settings = {
  theme: 'midnight',
  fontSize: 26,
  lineHeight: 1.6,
  caretStyle: 'line',
  smoothCaret: true,
  showLiveStats: true,
  sound: false,
  motion: 'system',
  test: DEFAULT_TEST_CONFIG,
};

function oneOf<T extends string | number>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function num(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

const bool = (value: unknown, fallback: boolean) => (typeof value === 'boolean' ? value : fallback);

export function sanitizeTestConfig(input: unknown): TestConfig {
  const d = DEFAULT_TEST_CONFIG;
  const v = isRecord(input) ? input : {};
  return {
    mode: oneOf<TestMode>(v.mode, ['time', 'words', 'quote', 'custom', 'code'], d.mode),
    time: oneOf<number>(v.time, TIME_OPTIONS, d.time),
    words: oneOf<number>(v.words, WORD_OPTIONS, d.words),
    quoteLength: oneOf<QuoteLength>(v.quoteLength, ['short', 'medium', 'long'], d.quoteLength),
    codeLanguage: oneOf<CodeLanguage>(v.codeLanguage, ['python', 'javascript', 'typescript'], d.codeLanguage),
    punctuation: bool(v.punctuation, d.punctuation),
    numbers: bool(v.numbers, d.numbers),
    difficulty: oneOf<Difficulty>(v.difficulty, ['easy', 'medium', 'hard'], d.difficulty),
    customText: typeof v.customText === 'string' ? v.customText.slice(0, CUSTOM_TEXT_MAX) : d.customText,
  };
}

/** Accepts anything (e.g. corrupted storage) and returns valid settings. */
export function sanitizeSettings(input: unknown): Settings {
  const d = DEFAULT_SETTINGS;
  const v = isRecord(input) ? input : {};
  return {
    theme: oneOf<ThemeId>(v.theme, THEMES.map((t) => t.id), d.theme),
    fontSize: num(v.fontSize, FONT_SIZE.min, FONT_SIZE.max, d.fontSize),
    lineHeight: num(v.lineHeight, LINE_HEIGHT.min, LINE_HEIGHT.max, d.lineHeight),
    caretStyle: oneOf<CaretStyle>(v.caretStyle, ['line', 'block', 'underline'], d.caretStyle),
    smoothCaret: bool(v.smoothCaret, d.smoothCaret),
    showLiveStats: bool(v.showLiveStats, d.showLiveStats),
    sound: bool(v.sound, d.sound),
    motion: oneOf<MotionPreference>(v.motion, ['system', 'reduce', 'full'], d.motion),
    test: sanitizeTestConfig(v.test),
  };
}

export function loadSettings(): Settings {
  return sanitizeSettings(readJson(STORAGE_KEYS.settings));
}
