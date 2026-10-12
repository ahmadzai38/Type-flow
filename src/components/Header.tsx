import { ChartColumn, Keyboard, Settings as SettingsIcon } from 'lucide-react';
import { Logo } from './Logo';
import { ThemeMenu } from './ThemeMenu';

export type View = 'test' | 'results' | 'stats';

interface Props {
  view: View;
  onNavigate: (view: 'test' | 'stats') => void;
  onOpenSettings: () => void;
}

const navBtn = 'inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-surface-2';

export function Header({ view, onNavigate, onOpenSettings }: Props) {
  const onTest = view === 'test' || view === 'results';
  return (
    <header className="tf-chrome mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 pt-5 sm:px-8 sm:pt-7">
      <button
        type="button"
        onClick={() => onNavigate('test')}
        className="rounded-lg"
        aria-label="TypeFlow — new typing test"
      >
        <Logo />
      </button>
      <nav aria-label="Main" className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => onNavigate('test')}
          aria-current={onTest ? 'page' : undefined}
          className={`${navBtn} ${onTest ? 'text-text' : 'text-sub'}`}
          title="Typing test"
        >
          <Keyboard size={19} aria-hidden="true" />
          <span className="hidden sm:inline">Practice</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('stats')}
          aria-current={view === 'stats' ? 'page' : undefined}
          className={`${navBtn} ${view === 'stats' ? 'text-text' : 'text-sub'}`}
          title="Statistics"
        >
          <ChartColumn size={19} aria-hidden="true" />
          <span className="hidden sm:inline">Stats</span>
        </button>
        <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" />
        <ThemeMenu />
        <button
          type="button"
          onClick={onOpenSettings}
          className="rounded-lg p-2 text-sub transition-colors hover:bg-surface-2 hover:text-text"
          aria-label="Settings"
          title="Settings"
        >
          <SettingsIcon size={19} aria-hidden="true" />
        </button>
      </nav>
    </header>
  );
}
