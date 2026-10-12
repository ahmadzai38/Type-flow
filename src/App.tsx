import { lazy, Suspense, useCallback, useRef, useState } from 'react';
import { Footer } from './components/Footer';
import { Header, type View } from './components/Header';
import { ResultsView } from './features/results/ResultsView';
import { TestView } from './features/typing/TestView';
import { useSettings } from './hooks/settingsContext';
import { bestForLabel } from './lib/aggregate';
import type { TypingEngine } from './lib/engine';
import { historyStore } from './lib/history';
import { createPassage, repeatPassage } from './lib/passage';
import { buildResult, isSavable, toStored } from './lib/result';
import { sanitizeTestConfig } from './lib/settings';
import type { DetailedResult, Passage, TestConfig } from './types';

// Non-essential views are code-split so the first load stays tiny.
const StatsView = lazy(() => import('./features/statistics/StatsView'));
const SettingsDialog = lazy(() => import('./features/settings/SettingsDialog'));
const CustomTextDialog = lazy(() => import('./features/typing/CustomTextDialog'));

export function App() {
  const { settings, updateTest } = useSettings();
  const [view, setView] = useState<View>('test');
  const [passage, setPassage] = useState<Passage>(() => createPassage(settings.test));
  const [result, setResult] = useState<DetailedResult | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  /** Full text of the last finished test (time mode may have grown it). */
  const lastText = useRef(passage.text);

  const config = settings.test;

  const newTest = useCallback(() => {
    setPassage(createPassage(config));
    setView('test');
  }, [config]);

  /** Same passage again: mid-test uses the original text, after a test the full typed text. */
  const repeatCurrent = useCallback(() => setPassage((p) => repeatPassage(p)), []);
  const repeatFinished = useCallback(() => {
    setPassage((p) => repeatPassage(p, lastText.current));
    setView('test');
  }, []);

  const changeConfig = useCallback(
    (patch: Partial<TestConfig>) => {
      const next = sanitizeTestConfig({ ...config, ...patch });
      updateTest(patch);
      setPassage(createPassage(next));
      setView('test');
      if (patch.mode === 'custom' && !next.customText) setCustomOpen(true);
    },
    [config, updateTest],
  );

  const finish = useCallback((engine: TypingEngine, finished: Passage) => {
    lastText.current = engine.target;
    const r = buildResult(engine, finished);
    const history = historyStore.getSnapshot();
    const previousBest = bestForLabel(history, r.label);
    r.saved = isSavable(r);
    r.previousBest = previousBest;
    r.personalBest = r.saved && (previousBest === null || r.wpm > previousBest);
    if (r.saved) historyStore.add(toStored(r));
    setResult(r);
    setView('results');
  }, []);

  const navigate = useCallback(
    (target: 'test' | 'stats') => {
      if (target === 'test') newTest();
      else setView('stats');
    },
    [newTest],
  );

  const openCustom = useCallback(() => setCustomOpen(true), []);

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <Header view={view} onNavigate={navigate} onOpenSettings={() => setSettingsOpen(true)} />

      <main id="main" className="flex flex-1 flex-col justify-center px-4 py-10 sm:px-8">
        {view === 'test' && (
          <TestView
            passage={passage}
            onConfigChange={changeConfig}
            onEditCustom={openCustom}
            onFinish={finish}
            onNewTest={newTest}
            onRepeat={repeatCurrent}
          />
        )}
        {view === 'results' && result && (
          <ResultsView result={result} onNext={newTest} onRepeat={repeatFinished} onStats={() => setView('stats')} />
        )}
        {view === 'stats' && (
          <Suspense fallback={<p className="text-center text-sm text-sub">Loading statistics…</p>}>
            <StatsView />
          </Suspense>
        )}
      </main>

      <Footer />

      <Suspense fallback={null}>
        {settingsOpen && <SettingsDialog open onClose={() => setSettingsOpen(false)} />}
        {customOpen && (
          <CustomTextDialog
            open
            initialText={settings.test.customText}
            onClose={() => setCustomOpen(false)}
            onSave={(customText) => {
              setCustomOpen(false);
              changeConfig({ mode: 'custom', customText });
            }}
          />
        )}
      </Suspense>
    </div>
  );
}
