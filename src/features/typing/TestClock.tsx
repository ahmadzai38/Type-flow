import { useEffect, useState } from 'react';
import { useEngineStatus, useEngineValue } from '../../hooks/useEngine';
import type { TypingEngine } from '../../lib/engine';
import { accuracy, wordsPerMinute } from '../../lib/stats';
import type { TestMode } from '../../types';

interface Props {
  engine: TypingEngine;
  mode: TestMode;
  /** Seconds for time mode, otherwise null. */
  timeLimit: number | null;
  showLiveStats: boolean;
}

/**
 * Drives the test clock with a single self-scheduling timeout aligned to whole
 * seconds since the first keystroke. It only exists while a test is running,
 * records one sample per second, and ends time-mode tests exactly on time.
 * Live numbers therefore update once per second, not on every keystroke.
 */
export function TestClock({ engine, mode, timeLimit, showLiveStats }: Props) {
  const status = useEngineStatus(engine);
  const [second, setSecond] = useState(0);

  useEffect(() => {
    if (status !== 'running' || engine.startTime === null) return;
    const start = engine.startTime;
    let timer: number | undefined;
    const schedule = () => {
      const elapsed = performance.now() - start;
      const next = Math.floor(elapsed / 1000) + 1;
      const target = timeLimit !== null ? Math.min(next, timeLimit) : next;
      timer = window.setTimeout(tick, Math.max(0, start + target * 1000 - performance.now()));
    };
    const tick = () => {
      const elapsed = performance.now() - start;
      if (timeLimit !== null && elapsed >= timeLimit * 1000 - 1) {
        engine.finish(start + timeLimit * 1000);
        return;
      }
      const s = Math.floor(elapsed / 1000);
      engine.recordSample(s);
      setSecond(s);
      schedule();
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, [engine, status, timeLimit]);

  const completed = useEngineValue(engine, (e) => e.completedWords);

  if (!showLiveStats) return <div className="h-8" aria-hidden="true" />;

  const running = status === 'running';
  const elapsedMs = running ? second * 1000 : 0;
  const wpm = running && second > 0 ? wordsPerMinute(engine.counts.correct, elapsedMs) : 0;
  const acc = accuracy(engine.inputs.correct, engine.inputs.incorrect);
  const hasInput = engine.inputs.correct + engine.inputs.incorrect > 0;

  let primary: string;
  let primaryLabel: string;
  if (timeLimit !== null) {
    primary = String(Math.max(0, timeLimit - (running ? second : 0)));
    primaryLabel = 'seconds left';
  } else if (mode === 'words') {
    primary = `${completed}/${engine.wordCount}`;
    primaryLabel = 'words';
  } else {
    primary = `${Math.round((engine.cursor / Math.max(1, engine.length)) * 100)}%`;
    primaryLabel = 'complete';
  }

  return (
    <div className="flex h-8 items-end gap-6 font-mono text-accent" aria-hidden="true">
      <span className="text-2xl leading-none font-semibold tabular-nums" title={primaryLabel}>
        {primary}
      </span>
      <span className={`flex items-baseline gap-4 text-base tabular-nums transition-opacity ${running ? 'opacity-80' : 'opacity-0'}`}>
        <span title="words per minute">
          {Math.round(wpm)} <span className="text-xs text-sub">wpm</span>
        </span>
        <span title="accuracy">
          {hasInput ? Math.round(acc) : 100}% <span className="text-xs text-sub">acc</span>
        </span>
      </span>
    </div>
  );
}
