/**
 * TypingEngine — the framework-agnostic heart of TypeFlow.
 *
 * It owns all frequently-changing typing state in plain mutable structures
 * (typed arrays and maps) and notifies subscribers after each change. React
 * reads it through `useSyncExternalStore`, so a keystroke only re-renders the
 * typing area, never the whole app.
 *
 * Two kinds of counters are tracked and must not be confused:
 *
 * - **Live text state** (`counts`): how the passage looks *right now*. Fixing a
 *   typo turns an incorrect character back into a correct one.
 * - **Historical inputs** (`inputs`): every character the user ever typed.
 *   Fixing a typo does *not* erase the original mistake. Accuracy uses these.
 */

export const CharState = {
  Untyped: 0,
  Correct: 1,
  Incorrect: 2,
  /** Skipped by pressing space early (prose modes only). */
  Missed: 3,
  /** Filled in automatically (code indentation). Rendered as correct, never counted. */
  Auto: 4,
} as const;
export type CharStateValue = (typeof CharState)[keyof typeof CharState];

export type EngineStatus = 'idle' | 'running' | 'finished';

export interface EngineOptions {
  /** Space inside a word skips the rest of it; letters typed at a space become "extra". */
  wordSkip?: boolean;
  /** After a correct newline, leading spaces/tabs on the next line are auto-filled. */
  autoIndent?: boolean;
  /** Maximum extra characters kept per word. */
  maxExtrasPerWord?: number;
  /** Clock used for timing (injectable for tests). */
  now?: () => number;
}

export interface InputCounts {
  /** Character inputs that matched the expected character. */
  correct: number;
  /** Character inputs that did not match (includes extra characters). */
  incorrect: number;
  /** Subset of `incorrect`: characters typed past the end of a word. */
  extra: number;
  backspaces: number;
}

export interface TextCounts {
  correct: number;
  incorrect: number;
  missed: number;
  extra: number;
}

export interface Sample {
  /** Seconds since start (may be fractional for the final sample). */
  t: number;
  /** Correct characters in the live text at time t. */
  correctChars: number;
  /** Cumulative character inputs at time t. */
  inputs: number;
  /** Cumulative incorrect inputs at time t. */
  errors: number;
}

type Listener = () => void;

const isWhitespace = (ch: string | undefined) => ch === ' ' || ch === '\n';

export class TypingEngine {
  target = '';
  states: Uint8Array = new Uint8Array(0);
  /** Extra characters, keyed by the index of the space they precede. */
  readonly extras = new Map<number, string>();
  /** Where the cursor was before a word skip, keyed by the cursor after it. */
  private readonly skipOrigins = new Map<number, number>();

  cursor = 0;
  status: EngineStatus = 'idle';
  startTime: number | null = null;
  endTime: number | null = null;

  /** Index of the first character of every word. */
  wordStarts: number[] = [];
  /** Word index for every character position. */
  private wordIndexAt: Uint32Array = new Uint32Array(0);
  /** Bumped whenever something inside a word changes (cheap memo key). */
  wordVersions: number[] = [];
  /** Bumped on every change. */
  version = 0;

  readonly inputs: InputCounts = { correct: 0, incorrect: 0, extra: 0, backspaces: 0 };
  readonly counts: TextCounts = { correct: 0, incorrect: 0, missed: 0, extra: 0 };
  readonly samples: Sample[] = [];

  readonly options: Required<Omit<EngineOptions, 'now'>>;
  private readonly now: () => number;
  private readonly listeners = new Set<Listener>();

  constructor(text: string, options: EngineOptions = {}) {
    this.options = {
      wordSkip: options.wordSkip ?? true,
      autoIndent: options.autoIndent ?? false,
      maxExtrasPerWord: options.maxExtrasPerWord ?? 12,
    };
    this.now = options.now ?? (() => performance.now());
    this.append(text);
  }

  // ---------------------------------------------------------------- queries

  get length(): number {
    return this.target.length;
  }

  get wordCount(): number {
    return this.wordStarts.length;
  }

  wordIndexOf(pos: number): number {
    if (this.length === 0) return 0;
    return this.wordIndexAt[Math.min(Math.max(pos, 0), this.length - 1)];
  }

  wordEnd(wordIndex: number): number {
    return wordIndex + 1 < this.wordStarts.length ? this.wordStarts[wordIndex + 1] : this.length;
  }

  /** Number of words whose characters have all been passed by the cursor. */
  get completedWords(): number {
    if (this.cursor >= this.length) return this.wordCount;
    return this.wordIndexOf(this.cursor);
  }

  /** Elapsed milliseconds (live while running, frozen when finished). */
  elapsedMs(at: number = this.now()): number {
    if (this.startTime === null) return 0;
    const end = this.endTime ?? at;
    return Math.max(0, end - this.startTime);
  }

  // ---------------------------------------------------------- subscription

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getVersion = (): number => this.version;
  getStatus = (): EngineStatus => this.status;

  private emit(): void {
    this.version++;
    for (const l of this.listeners) l();
  }

  // ------------------------------------------------------------- mutations

  /** Append more text (time mode keeps generating words). */
  append(text: string): void {
    if (!text) return;
    let addition = text;
    if (this.target.length > 0 && !isWhitespace(this.target[this.target.length - 1])) {
      addition = ' ' + addition;
    }
    const offset = this.target.length;
    this.target += addition;

    const states = new Uint8Array(this.target.length);
    states.set(this.states);
    this.states = states;

    const wordIndexAt = new Uint32Array(this.target.length);
    wordIndexAt.set(this.wordIndexAt);
    let word = this.wordStarts.length - 1;
    let atWordStart = offset === 0 || isWhitespace(this.target[offset - 1]);
    for (let i = offset; i < this.target.length; i++) {
      if (atWordStart) {
        word++;
        this.wordStarts.push(i);
        this.wordVersions.push(0);
      }
      wordIndexAt[i] = word;
      atWordStart = isWhitespace(this.target[i]);
    }
    this.wordIndexAt = wordIndexAt;
    if (offset > 0) this.emit();
  }

  /** Process one typed character (a single UTF-16 unit or grapheme). */
  type(ch: string): boolean {
    if (this.status === 'finished' || this.cursor >= this.length || ch.length === 0) return false;
    const from = this.cursor;
    const expected = this.target[this.cursor];
    // Indentation was auto-filled; typing it by habit is harmless and ignored.
    if (
      this.options.autoIndent &&
      (ch === ' ' || ch === '\t') &&
      expected !== ' ' &&
      this.cursor > 0 &&
      this.states[this.cursor - 1] === CharState.Auto
    ) {
      return false;
    }
    const skipping = this.options.wordSkip && ch === ' ' && !isWhitespace(expected);
    // Space at the start of a word is ignored so a double space never skips a whole word.
    if (skipping && (this.cursor === 0 || isWhitespace(this.target[this.cursor - 1]))) return false;

    const now = this.now();
    if (this.status === 'idle') {
      this.status = 'running';
      this.startTime = now;
    }

    if (skipping) {
      let end = this.cursor;
      while (end < this.length && !isWhitespace(this.target[end])) end++;
      for (let i = this.cursor; i < end; i++) this.setState(i, CharState.Missed);
      this.inputs.correct++;
      let next = end;
      if (end < this.length) {
        this.setState(end, CharState.Correct);
        next = end + 1;
      }
      this.skipOrigins.set(next, this.cursor);
      this.cursor = next;
      this.touch(from, this.cursor);
      return this.afterInput(now);
    }

    if (this.options.wordSkip && expected === ' ' && ch !== ' ') {
      const current = this.extras.get(this.cursor) ?? '';
      this.inputs.incorrect++;
      this.inputs.extra++;
      if (current.length < this.options.maxExtrasPerWord && ch !== '\n') {
        this.extras.set(this.cursor, current + ch);
        this.counts.extra++;
      }
      this.touch(from, from);
      this.emit();
      return true;
    }

    const ok = ch === expected;
    this.setState(this.cursor, ok ? CharState.Correct : CharState.Incorrect);
    if (ok) this.inputs.correct++;
    else this.inputs.incorrect++;
    this.cursor++;

    if (this.options.autoIndent && ok && expected === '\n') {
      while (this.cursor < this.length && (this.target[this.cursor] === ' ' || this.target[this.cursor] === '\t')) {
        this.setState(this.cursor, CharState.Auto);
        this.cursor++;
      }
    }
    this.touch(from, this.cursor);
    return this.afterInput(now);
  }

  /** Delete one step back. With `word`, delete back to the start of the word. */
  backspace(word = false): boolean {
    if (this.status !== 'running') return false;
    const from = this.cursor;
    const changed = this.step();
    if (word && changed) {
      while (
        this.cursor > 0 &&
        (this.extras.has(this.cursor) || !isWhitespace(this.target[this.cursor - 1])) &&
        this.states[this.cursor - 1] !== CharState.Auto &&
        !this.skipOrigins.has(this.cursor)
      ) {
        if (!this.step()) break;
      }
    }
    if (!changed) return false;
    this.inputs.backspaces++;
    this.touch(this.cursor, from);
    this.emit();
    return true;
  }

  /** Force the test to end now (time mode expiry). */
  finish(at: number = this.now()): void {
    if (this.status === 'finished') return;
    if (this.status === 'idle') {
      this.status = 'finished';
      this.startTime = at;
      this.endTime = at;
      this.emit();
      return;
    }
    this.endTime = at;
    this.status = 'finished';
    const elapsed = this.elapsedMs() / 1000;
    const last = this.samples[this.samples.length - 1];
    if (elapsed > 0 && (!last || elapsed - last.t > 0.001)) this.pushSample(elapsed);
    this.emit();
  }

  /** Record a per-second sample (called by the test clock). */
  recordSample(t: number): void {
    if (this.status !== 'running') return;
    const last = this.samples[this.samples.length - 1];
    if (last && last.t >= t) return;
    this.pushSample(t);
  }

  // --------------------------------------------------------------- helpers

  private pushSample(t: number): void {
    this.samples.push({
      t,
      correctChars: this.counts.correct,
      inputs: this.inputs.correct + this.inputs.incorrect,
      errors: this.inputs.incorrect,
    });
  }

  private afterInput(now: number): boolean {
    if (this.cursor >= this.length) {
      this.finish(now);
    } else {
      this.emit();
    }
    return true;
  }

  private step(): boolean {
    const extra = this.extras.get(this.cursor);
    if (extra) {
      if (extra.length === 1) this.extras.delete(this.cursor);
      else this.extras.set(this.cursor, extra.slice(0, -1));
      this.counts.extra--;
      this.version++;
      return true;
    }
    if (this.cursor === 0) return false;

    const origin = this.skipOrigins.get(this.cursor);
    if (origin !== undefined) {
      for (let i = origin; i < this.cursor; i++) this.setState(i, CharState.Untyped);
      this.skipOrigins.delete(this.cursor);
      this.cursor = origin;
      return true;
    }

    let p = this.cursor - 1;
    while (p > 0 && this.states[p] === CharState.Auto) {
      this.setState(p, CharState.Untyped);
      p--;
    }
    this.setState(p, CharState.Untyped);
    this.cursor = p;
    return true;
  }

  private setState(i: number, next: CharStateValue): void {
    const prev = this.states[i] as CharStateValue;
    if (prev === next) return;
    this.adjust(prev, -1);
    this.adjust(next, 1);
    this.states[i] = next;
  }

  private adjust(state: CharStateValue, delta: number): void {
    if (state === CharState.Correct) this.counts.correct += delta;
    else if (state === CharState.Incorrect) this.counts.incorrect += delta;
    else if (state === CharState.Missed) this.counts.missed += delta;
  }

  /** Bump the versions of every word between two positions (inclusive). */
  private touch(a: number, b: number): void {
    if (this.length === 0) return;
    const start = this.wordIndexOf(Math.min(a, b));
    const end = this.wordIndexOf(Math.max(a, b));
    for (let w = start; w <= end; w++) this.wordVersions[w]++;
  }
}
