import { ArrowRight, ChartColumn, Repeat, Trophy } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { LineChart } from '../../components/LineChart';
import { formatSeconds, int } from '../../lib/format';
import type { DetailedResult } from '../../types';
import { summarizeResult } from './summary';

interface Props {
  result: DetailedResult;
  onNext: () => void;
  onRepeat: () => void;
  onStats: () => void;
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-surface px-4 py-3" title={hint}>
      <dt className="text-xs text-sub">{label}</dt>
      <dd className="mt-1 font-mono text-xl text-text tabular-nums">{value}</dd>
    </div>
  );
}

export function ResultsView({ result, onNext, onRepeat, onStats }: Props) {
  const nextRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    nextRef.current?.focus({ preventScroll: true });
  }, [result.id]);

  const summary = useMemo(() => summarizeResult(result), [result]);
  const t = result.timeline;
  const x = useMemo(() => t.map((p) => p.t), [t]);
  const series = useMemo(
    () => [
      { key: 'wpm', label: 'wpm', values: t.map((p) => p.wpm), color: 'var(--tf-accent)', width: 2.5 },
      { key: 'raw', label: 'raw', values: t.map((p) => p.raw), color: 'var(--tf-sub)', dashed: true },
    ],
    [t],
  );
  const markers = useMemo(
    () => ({ label: 'errors', values: t.map((p) => p.errors), color: 'var(--tf-error)' }),
    [t],
  );

  return (
    <section aria-labelledby="results-title" className="tf-fade-in mx-auto w-full max-w-5xl">
      <h1 id="results-title" className="sr-only">
        Test results
      </h1>
      <p className="sr-only" role="status" aria-live="polite">
        {`Finished. ${int(result.wpm)} words per minute, ${int(result.accuracy)} percent accuracy. ${summary.text}`}
      </p>

      <div className="grid gap-8 md:grid-cols-[minmax(150px,auto)_1fr] md:items-start">
        <div className="flex gap-10 md:flex-col md:gap-5">
          <div>
            <div className="text-sm text-sub">wpm</div>
            <div className="font-mono text-6xl leading-none font-semibold text-accent tabular-nums sm:text-7xl">
              {int(result.wpm)}
            </div>
          </div>
          <div>
            <div className="text-sm text-sub">accuracy</div>
            <div className="font-mono text-5xl leading-none font-semibold text-accent tabular-nums sm:text-6xl">
              {int(result.accuracy)}%
            </div>
          </div>
          {result.personalBest && result.previousBest !== null && (
            <div className="inline-flex items-center gap-2 self-start rounded-lg bg-surface px-3 py-1.5 text-sm text-good">
              <Trophy size={16} aria-hidden="true" /> New personal best
            </div>
          )}
        </div>
        <div className="min-w-0 rounded-2xl bg-surface p-4 sm:p-5">
          <LineChart
            title="Words per minute over the test"
            x={x}
            series={series}
            markers={markers}
            yLabel="wpm"
            formatX={(s) => `${Math.round(s)}s`}
            formatTooltipX={(s) => `${s % 1 === 0 ? s : s.toFixed(1)} s`}
          />
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="test" value={result.label.split(' · ')[0]} hint={result.label} />
        <Stat label="raw wpm" value={int(result.rawWpm)} hint="All character inputs ÷ 5 ÷ minutes" />
        <Stat
          label="characters"
          value={`${result.correctChars}/${result.incorrectChars}/${result.extraChars}/${result.missedChars}`}
          hint="correct / incorrect / extra / missed in the final text"
        />
        <Stat label="consistency" value={`${int(result.consistency)}%`} hint="How steady your speed was second by second" />
        <Stat label="time" value={formatSeconds(result.durationMs)} />
        <Stat
          label="inputs"
          value={`${result.correctInputs + result.incorrectInputs}`}
          hint={`${result.correctInputs} correct, ${result.incorrectInputs} incorrect keystrokes; ${result.backspaces} backspaces`}
        />
      </dl>

      <div className="mt-6 rounded-xl border border-line px-4 py-3 text-sm text-sub">
        <p>
          <span className="text-text">{summary.headline}</span> {summary.text}
        </p>
        <p className="mt-1 text-xs">
          {result.correctInputs} correct and {result.incorrectInputs} incorrect keystrokes · {result.backspaces}{' '}
          backspaces{result.source ? ` · ${result.source}` : ''}
          {!result.saved && ' · too short to save to history'}
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
        <button
          ref={nextRef}
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg transition-[filter] hover:brightness-110"
        >
          Next test <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onRepeat}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm text-sub transition-colors hover:bg-surface hover:text-text"
        >
          <Repeat size={16} aria-hidden="true" /> Repeat passage
        </button>
        <button
          type="button"
          onClick={onStats}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm text-sub transition-colors hover:bg-surface hover:text-text"
        >
          <ChartColumn size={16} aria-hidden="true" /> Statistics
        </button>
      </div>
    </section>
  );
}
