import { Activity, Clock, Download, Flame, Gauge, Target, Trash, Trophy, Upload } from 'lucide-react';
import { useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { Button } from '../../components/Button';
import { LineChart } from '../../components/LineChart';
import { useSettings } from '../../hooks/settingsContext';
import { useHistory } from '../../hooks/useHistory';
import { movingAverage, summarize } from '../../lib/aggregate';
import { formatDate, formatDuration, formatSeconds, int } from '../../lib/format';
import { HISTORY_LIMIT, historyStore, importHistory, serializeHistory } from '../../lib/history';
import { ActivityHeatmap } from './ActivityHeatmap';

const CHART_TESTS = 100;

function Tile({ icon, label, value, sub }: { icon: ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-surface px-4 py-4">
      <dt className="flex items-center gap-2 text-xs text-sub">
        {icon}
        {label}
      </dt>
      <dd className="mt-2 font-mono text-2xl font-semibold text-text tabular-nums">{value}</dd>
      {sub && <dd className="mt-0.5 text-xs text-sub">{sub}</dd>}
    </div>
  );
}

function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-2xl bg-surface p-4 sm:p-5" aria-label={title}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

type Confirm = 'clear' | 'reset' | null;

export default function StatsView() {
  const results = useHistory();
  const { reset: resetSettings } = useSettings();
  const [now] = useState(() => Date.now());
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const summary = useMemo(() => summarize(results, now), [results, now]);
  const chart = useMemo(() => {
    const recent = results.slice(-CHART_TESTS);
    const offset = results.length - recent.length;
    const wpm = recent.map((r) => r.wpm);
    return {
      x: recent.map((_, i) => offset + i + 1),
      series: [
        { key: 'wpm', label: 'wpm per test', values: wpm, color: 'var(--tf-sub)', width: 1.5 },
        { key: 'avg', label: '10-test average', values: movingAverage(wpm, 10), color: 'var(--tf-accent)', width: 2.5 },
      ],
    };
  }, [results]);
  const recent = useMemo(() => results.slice(-15).reverse(), [results]);

  const exportHistory = () => {
    const blob = new Blob([serializeHistory(results)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `typeflow-history-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    setMessage({ kind: 'ok', text: `Exported ${results.length} results.` });
  };

  const onImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ kind: 'error', text: 'That file is larger than 5 MB.' });
      return;
    }
    const outcome = importHistory(await file.text(), historyStore.getSnapshot());
    if (!outcome.ok) {
      setMessage({ kind: 'error', text: outcome.error });
      return;
    }
    historyStore.replace(outcome.results);
    const skipped = outcome.skipped ? `, ${outcome.skipped} invalid entries skipped` : '';
    setMessage({ kind: 'ok', text: `Imported ${outcome.added} new results${skipped}.` });
  };

  const runConfirm = () => {
    if (confirm === 'clear') {
      historyStore.clear();
      setMessage({ kind: 'ok', text: 'History cleared.' });
    } else if (confirm === 'reset') {
      historyStore.clear();
      resetSettings();
      setMessage({ kind: 'ok', text: 'All statistics and settings were reset.' });
    }
    setConfirm(null);
  };

  const empty = results.length === 0;

  return (
    <div className="tf-fade-in mx-auto w-full max-w-5xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your statistics</h1>
          <p className="mt-1 text-sm text-sub">
            Stored only in this browser. The most recent {HISTORY_LIMIT} tests are kept.
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile icon={<Activity size={14} aria-hidden="true" />} label="tests completed" value={String(summary.tests)} />
        <Tile icon={<Clock size={14} aria-hidden="true" />} label="practice time" value={formatDuration(summary.totalTimeMs)} />
        <Tile
          icon={<Gauge size={14} aria-hidden="true" />}
          label="average wpm"
          value={empty ? '—' : int(summary.averageWpm)}
          sub={
            summary.recentTrend === null
              ? undefined
              : `${summary.recentTrend >= 0 ? '+' : ''}${summary.recentTrend.toFixed(1)} over last 10 tests`
          }
        />
        <Tile icon={<Trophy size={14} aria-hidden="true" />} label="best wpm" value={empty ? '—' : int(summary.bestWpm)} />
        <Tile
          icon={<Target size={14} aria-hidden="true" />}
          label="average accuracy"
          value={empty ? '—' : `${summary.averageAccuracy.toFixed(1)}%`}
        />
        <Tile icon={<Flame size={14} aria-hidden="true" />} label="current streak" value={`${summary.currentStreak} ${summary.currentStreak === 1 ? 'day' : 'days'}`} />
        <Tile icon={<Flame size={14} aria-hidden="true" />} label="longest streak" value={`${summary.longestStreak} ${summary.longestStreak === 1 ? 'day' : 'days'}`} />
        <Tile
          icon={<Clock size={14} aria-hidden="true" />}
          label="last test"
          value={empty ? '—' : `${int(results[results.length - 1].wpm)} wpm`}
          sub={empty ? undefined : formatDate(results[results.length - 1].timestamp)}
        />
      </dl>

      {empty ? (
        <div className="rounded-2xl border border-dashed border-line px-6 py-12 text-center text-sm text-sub">
          Finish a test and your progress will appear here.
        </div>
      ) : (
        <>
          <Section title="WPM over time">
            <LineChart
              title="Words per minute for each test, with a 10-test moving average"
              x={chart.x}
              series={chart.series}
              yLabel="wpm"
              height={220}
              formatX={(n) => `#${n}`}
              formatTooltipX={(n) => `Test #${n}`}
            />
          </Section>

          <div className="grid gap-5 lg:grid-cols-[auto_1fr]">
            <Section title="Daily activity">
              <ActivityHeatmap results={results} now={now} />
            </Section>
            <Section title="Recent tests">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-sm">
                  <thead className="text-xs text-sub">
                    <tr>
                      <th scope="col" className="pb-2 font-normal">wpm</th>
                      <th scope="col" className="pb-2 font-normal">acc</th>
                      <th scope="col" className="pb-2 font-normal">test</th>
                      <th scope="col" className="pb-2 font-normal">time</th>
                      <th scope="col" className="pb-2 text-right font-normal">date</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono tabular-nums">
                    {recent.map((r) => (
                      <tr key={r.id} className="border-t border-line">
                        <td className="py-1.5 text-accent">{int(r.wpm)}</td>
                        <td className="py-1.5">{int(r.accuracy)}%</td>
                        <td className="py-1.5 font-sans text-sub">{r.label}</td>
                        <td className="py-1.5">{formatSeconds(r.durationMs)}</td>
                        <td className="py-1.5 text-right font-sans text-xs text-sub">{formatDate(r.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>
        </>
      )}

      <Section title="Your data">
        <p className="mb-4 text-sm text-sub">
          Nothing is ever uploaded. Export a JSON backup to move your history to another browser or device.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button icon={<Download size={16} aria-hidden="true" />} onClick={exportHistory} disabled={empty}>
            Export JSON
          </Button>
          <Button icon={<Upload size={16} aria-hidden="true" />} onClick={() => fileRef.current?.click()}>
            Import JSON
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={onImportFile}
            aria-label="Import history file"
          />
          {confirm === null ? (
            <>
              <Button variant="danger" icon={<Trash size={16} aria-hidden="true" />} onClick={() => setConfirm('clear')} disabled={empty}>
                Clear history
              </Button>
              <Button variant="danger" onClick={() => setConfirm('reset')}>
                Reset everything
              </Button>
            </>
          ) : (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-error/50 px-3 py-1.5" role="alert">
              <span className="text-sm">
                {confirm === 'clear'
                  ? `Delete all ${results.length} saved results?`
                  : 'Delete all results and restore default settings?'}
              </span>
              <Button variant="danger" onClick={runConfirm}>
                Yes, delete
              </Button>
              <Button variant="ghost" onClick={() => setConfirm(null)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
        {message && (
          <p role="status" className={`mt-3 text-sm ${message.kind === 'error' ? 'text-error' : 'text-good'}`}>
            {message.text}
          </p>
        )}
      </Section>
    </div>
  );
}
