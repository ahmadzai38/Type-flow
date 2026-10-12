import { Repeat, RotateCcw } from 'lucide-react';
import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { useSettings } from '../../hooks/settingsContext';
import { useEngineStatus } from '../../hooks/useEngine';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useSound } from '../../hooks/useSound';
import { TypingEngine } from '../../lib/engine';
import type { Passage, TestConfig } from '../../types';
import { ConfigBar } from './ConfigBar';
import { createInputController } from './controller';
import { TestClock } from './TestClock';
import { TypingArea } from './TypingArea';

interface Props {
  passage: Passage;
  onConfigChange: (patch: Partial<TestConfig>) => void;
  onEditCustom: () => void;
  onFinish: (engine: TypingEngine, passage: Passage) => void;
  onNewTest: () => void;
  onRepeat: () => void;
}

const isEditable = (el: Element | null) =>
  !!el?.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="menu"], dialog');

export function TestView({ passage, onConfigChange, onEditCustom, onFinish, onNewTest, onRepeat }: Props) {
  const { settings, reducedMotion } = useSettings();
  const engine = useMemo(
    () => new TypingEngine(passage.text, { wordSkip: passage.wordSkip, autoIndent: passage.autoIndent }),
    [passage],
  );
  const playSound = useSound(settings.sound);
  const controller = useMemo(() => createInputController(engine, passage, playSound), [engine, passage, playSound]);
  const status = useEngineStatus(engine);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const small = useMediaQuery('(max-width: 640px)');
  const fontSize = small ? Math.min(settings.fontSize, 20) : settings.fontSize;

  const handleFinish = useEffectEvent(() => onFinish(engine, passage));
  useEffect(() => {
    if (status === 'finished') handleFinish();
  }, [status]);

  // Focus the input whenever a new test is ready (unless a dialog is open).
  useEffect(() => {
    if (!document.querySelector('dialog[open]')) inputRef.current?.focus({ preventScroll: true });
  }, [engine]);

  // Fade out surrounding UI while typing; any mouse movement brings it back.
  useEffect(() => {
    if (status !== 'running') return;
    const root = document.documentElement;
    root.dataset.typing = 'true';
    const show = () => delete root.dataset.typing;
    window.addEventListener('mousemove', show, { once: true, passive: true });
    return () => {
      window.removeEventListener('mousemove', show);
      delete root.dataset.typing;
    };
  }, [status]);

  // Start typing from anywhere: printable keys outside form fields focus the test.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const input = inputRef.current;
      if (!input || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
      if (e.key.length !== 1 || e.key === ' ' || e.target === input) return;
      if (isEditable(e.target as Element) || document.querySelector('dialog[open]')) return;
      if (engine.status === 'finished') return;
      e.preventDefault();
      input.focus({ preventScroll: true });
      controller.type(e.key);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [engine, controller]);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 2200);
    return () => window.clearTimeout(t);
  }, [notice]);

  const isCode = passage.config.mode === 'code';
  const description = useMemo(
    () => (isCode ? passage.text.replace(/\n/g, ' (new line) ') : passage.text),
    [passage.text, isCode],
  );

  return (
    <section aria-label="Typing test" className="flex w-full flex-col gap-10">
      <ConfigBar config={passage.config} onChange={onConfigChange} onEditCustom={onEditCustom} />

      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-3 flex items-end justify-between gap-4">
          <TestClock
            key={passage.key}
            engine={engine}
            mode={passage.config.mode}
            timeLimit={passage.config.mode === 'time' ? passage.config.time : null}
            showLiveStats={settings.showLiveStats}
          />
          <span role="status" aria-live="polite" className="text-xs text-error">
            {notice}
          </span>
        </div>

        <TypingArea
          engine={engine}
          controller={controller}
          inputRef={inputRef}
          fontSize={fontSize}
          lineHeight={settings.lineHeight}
          caretStyle={settings.caretStyle}
          smoothCaret={settings.smoothCaret}
          reducedMotion={reducedMotion}
          visibleLines={isCode ? 8 : 3}
          description={description}
          onPasteBlocked={() => setNotice('Pasting is disabled during a test.')}
        />

        {passage.source && passage.config.mode !== 'custom' && (
          <p className="tf-chrome mt-3 text-right text-xs text-sub">— {passage.source}</p>
        )}

        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={onNewTest}
            className="group inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm text-sub transition-colors hover:bg-surface hover:text-text focus-visible:bg-surface focus-visible:text-text"
            aria-label="Restart with a new passage"
            title="Restart with a new passage (Tab, then Enter)"
          >
            <RotateCcw size={18} aria-hidden="true" className="transition-transform group-hover:-rotate-45" />
            <span>restart</span>
          </button>
          <button
            type="button"
            onClick={onRepeat}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm text-sub transition-colors hover:bg-surface hover:text-text focus-visible:bg-surface focus-visible:text-text"
            aria-label="Restart with the same passage"
            title="Restart with the same passage"
          >
            <Repeat size={18} aria-hidden="true" />
            <span>same passage</span>
          </button>
        </div>
      </div>
    </section>
  );
}
