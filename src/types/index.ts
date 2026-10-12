export type TestMode = 'time' | 'words' | 'quote' | 'custom' | 'code';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type QuoteLength = 'short' | 'medium' | 'long';
export type CodeLanguage = 'python' | 'javascript' | 'typescript';

export const TIME_OPTIONS = [15, 30, 60, 120] as const;
export const WORD_OPTIONS = [10, 25, 50, 100] as const;

export interface TestConfig {
  mode: TestMode;
  time: number;
  words: number;
  quoteLength: QuoteLength;
  codeLanguage: CodeLanguage;
  punctuation: boolean;
  numbers: boolean;
  difficulty: Difficulty;
  customText: string;
}

export type ThemeId = 'midnight' | 'light' | 'ocean' | 'forest' | 'sepia' | 'contrast';
export type CaretStyle = 'line' | 'block' | 'underline';
export type MotionPreference = 'system' | 'reduce' | 'full';

export interface Settings {
  theme: ThemeId;
  fontSize: number;
  lineHeight: number;
  caretStyle: CaretStyle;
  smoothCaret: boolean;
  showLiveStats: boolean;
  sound: boolean;
  motion: MotionPreference;
  test: TestConfig;
}

/** A generated passage plus the engine options it needs. */
export interface Passage {
  /** Changes every time a test is (re)started so the engine is rebuilt. */
  key: number;
  text: string;
  config: TestConfig;
  /** Human-readable source (quote author, snippet title…). */
  source?: string;
  /** Allow skipping a word with space and typing extra characters (prose modes). */
  wordSkip: boolean;
  /** Skip leading indentation after a correctly typed newline (code mode). */
  autoIndent: boolean;
  /** For time mode: produces more words on demand. */
  more?: () => string;
}

export interface TimelinePoint {
  /** Seconds since the first keystroke. */
  t: number;
  /** Cumulative adjusted WPM at time t. */
  wpm: number;
  /** Raw WPM during this interval only. */
  raw: number;
  /** Incorrect inputs during this interval. */
  errors: number;
}

/** A finished test as stored in history (kept compact on purpose). */
export interface TestResult {
  id: string;
  /** Unix epoch milliseconds when the test finished. */
  timestamp: number;
  mode: TestMode;
  /** Short label such as "time 30", "words 50", "quote medium". */
  label: string;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  durationMs: number;
  correctChars: number;
  incorrectChars: number;
  extraChars: number;
  missedChars: number;
  correctInputs: number;
  incorrectInputs: number;
}

/** A finished test with the extra in-memory data shown on the results screen. */
export interface DetailedResult extends TestResult {
  timeline: TimelinePoint[];
  backspaces: number;
  source?: string;
  saved: boolean;
  personalBest: boolean;
  previousBest: number | null;
}
