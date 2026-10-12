import { MousePointerClick } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type CompositionEvent,
  type FormEvent,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import { useEngineVersion } from '../../hooks/useEngine';
import type { TypingEngine } from '../../lib/engine';
import type { CaretStyle } from '../../types';
import type { InputController } from './controller';
import { Word } from './Word';

interface Props {
  engine: TypingEngine;
  controller: InputController;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  fontSize: number;
  lineHeight: number;
  caretStyle: CaretStyle;
  smoothCaret: boolean;
  reducedMotion: boolean;
  /** Number of visible lines (prose: 3, code: more). */
  visibleLines: number;
  /** Full passage for screen readers. */
  description: string;
  onPasteBlocked: () => void;
}

const CARET_IDLE_MS = 650;

export function TypingArea({
  engine,
  controller,
  inputRef,
  fontSize,
  lineHeight,
  caretStyle,
  smoothCaret,
  reducedMotion,
  visibleLines,
  description,
  onPasteBlocked,
}: Props) {
  const version = useEngineVersion(engine);
  const [focused, setFocused] = useState(false);
  const linesRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLDivElement>(null);
  const composingRef = useRef(false);
  const idleTimer = useRef<number | undefined>(undefined);
  const descId = useId();
  const lineHeightPx = Math.round(fontSize * lineHeight);
  const keepLinesAbove = visibleLines > 3 ? Math.floor(visibleLines / 2) : 1;

  /** Positions caret and scrolls lines. Reads layout once per change; writes only transforms. */
  const positionCaret = useCallback(() => {
    const lines = linesRef.current;
    const caret = caretRef.current;
    if (!lines || !caret || engine.length === 0) return;
    const cursor = engine.cursor;
    let x: number;
    let y: number;
    let h = fontSize * 1.2;
    const extraEl = engine.extras.has(cursor) ? lines.querySelector<HTMLElement>(`[data-x="${cursor}"]`) : null;
    if (extraEl) {
      x = extraEl.offsetLeft + extraEl.offsetWidth;
      y = extraEl.offsetTop;
      h = extraEl.offsetHeight;
    } else {
      const atEnd = cursor >= engine.length;
      const el = lines.querySelector<HTMLElement>(`[data-i="${atEnd ? engine.length - 1 : cursor}"]`);
      if (!el) return;
      x = atEnd ? el.offsetLeft + el.offsetWidth : el.offsetLeft;
      y = el.offsetTop;
      h = el.offsetHeight || h;
    }
    const caretY = caretStyle === 'underline' ? y + h - 3 : y;
    caret.style.height = `${h}px`;
    caret.style.transform = `translate3d(${x}px, ${caretY}px, 0)`;

    const line = Math.floor((y + h / 2) / lineHeightPx);
    const first = Math.max(0, line - keepLinesAbove);
    lines.style.transform = `translate3d(0, ${-first * lineHeightPx}px, 0)`;
  }, [engine, fontSize, lineHeightPx, caretStyle, keepLinesAbove]);

  useLayoutEffect(() => {
    positionCaret();
  }, [positionCaret, version]);

  // Re-measure when the container width changes (window resize, font load).
  useEffect(() => {
    const lines = linesRef.current;
    if (!lines || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => positionCaret());
    ro.observe(lines);
    return () => ro.disconnect();
  }, [positionCaret]);

  // Caret blinks only while idle; stops blinking while you type.
  const markActive = useCallback(() => {
    const caret = caretRef.current;
    if (!caret) return;
    caret.dataset.blink = 'false';
    window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => {
      if (caretRef.current) caretRef.current.dataset.blink = 'true';
    }, CARET_IDLE_MS);
  }, []);
  useEffect(() => () => window.clearTimeout(idleTimer.current), []);

  const typeText = useCallback(
    (text: string) => {
      controller.type(text);
      markActive();
    },
    [controller, markActive],
  );

  // Mobile keyboards often report Backspace only through `beforeinput`.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const onBeforeInput = (e: InputEvent) => {
      if (e.inputType === 'deleteContentBackward' || e.inputType === 'deleteWordBackward') {
        e.preventDefault();
        controller.backspace(e.inputType === 'deleteWordBackward');
        markActive();
      } else if (e.inputType === 'insertFromPaste' || e.inputType === 'insertFromDrop') {
        e.preventDefault();
      }
    };
    el.addEventListener('beforeinput', onBeforeInput);
    return () => el.removeEventListener('beforeinput', onBeforeInput);
  }, [inputRef, controller, markActive]);

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const native = e.nativeEvent;
    if (native.isComposing || composingRef.current || native.keyCode === 229) return;
    const { key } = e;
    if (key === 'Escape') {
      e.preventDefault();
      e.currentTarget.blur();
      return;
    }
    if (key === 'Tab') return; // let focus move to the restart button (Tab + Enter)
    const ctrlLike = e.metaKey || (e.ctrlKey && !e.altKey); // ctrl+alt = AltGr on Windows
    if (key === 'Backspace') {
      e.preventDefault();
      controller.backspace(ctrlLike || e.altKey);
      markActive();
      return;
    }
    if (ctrlLike) return; // never hijack browser shortcuts (copy, reload, zoom…)
    if (key === 'Enter') {
      e.preventDefault();
      if (!engine.options.wordSkip) typeText('\n');
      return;
    }
    if (key.length === 1) {
      e.preventDefault();
      typeText(key);
    }
  };

  // Fallback path for virtual keyboards that do not send usable keydown events.
  const onInput = (e: FormEvent<HTMLTextAreaElement>) => {
    if (composingRef.current) return;
    const el = e.currentTarget;
    const value = el.value;
    el.value = '';
    if (value) typeText(engine.options.wordSkip ? value.replace(/\n/g, '') : value);
  };

  const onCompositionStart = () => {
    composingRef.current = true;
  };
  const onCompositionEnd = (e: CompositionEvent<HTMLTextAreaElement>) => {
    composingRef.current = false;
    const data = e.data;
    e.currentTarget.value = '';
    if (data) typeText(data);
  };

  const onPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    onPasteBlocked();
  };

  const finished = engine.status === 'finished';
  const showOverlay = !focused && !finished;
  const words = engine.wordVersions;

  return (
    <div
      className="relative"
      onMouseDown={(e) => {
        // Keep focus in the hidden input when clicking the text.
        if (e.target !== inputRef.current) {
          e.preventDefault();
          inputRef.current?.focus();
        }
      }}
    >
      <textarea
        ref={inputRef}
        aria-label="Typing input. Type the passage shown on screen."
        aria-describedby={descId}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        data-gramm="false"
        rows={1}
        onKeyDown={onKeyDown}
        onInput={onInput}
        onCompositionStart={onCompositionStart}
        onCompositionEnd={onCompositionEnd}
        onPaste={onPaste}
        onDrop={(e) => e.preventDefault()}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        readOnly={finished}
        className="absolute inset-0 z-10 h-full w-full resize-none cursor-default text-[16px] opacity-0"
      />
      <p id={descId} className="sr-only">
        {description}
      </p>

      <div
        aria-hidden="true"
        className={`relative overflow-hidden transition-[opacity,filter] duration-200 ${showOverlay ? 'opacity-30 blur-[3px]' : ''}`}
        style={{ height: lineHeightPx * visibleLines, fontSize, lineHeight: `${lineHeightPx}px` }}
      >
        <div ref={linesRef} className={`tf-text relative ${reducedMotion ? '' : 'tf-lines'}`}>
          {words.map((v, i) => (
            <Word key={i} engine={engine} index={i} version={v} />
          ))}
          <div
            ref={caretRef}
            className="tf-caret"
            data-style={caretStyle}
            data-smooth={smoothCaret && !reducedMotion ? 'true' : 'false'}
            data-blink={reducedMotion ? 'false' : 'true'}
            hidden={finished}
          />
        </div>
      </div>

      {showOverlay && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <span className="tf-fade-in inline-flex items-center gap-2 rounded-lg bg-surface/80 px-4 py-2 text-sm text-text shadow-sm">
            <MousePointerClick size={16} aria-hidden="true" />
            Click here or start typing to focus
          </span>
        </div>
      )}
    </div>
  );
}
