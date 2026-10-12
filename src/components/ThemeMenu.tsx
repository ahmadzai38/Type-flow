import { Check, Palette } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { useSettings } from '../hooks/settingsContext';
import { THEMES } from '../lib/settings';

export function ThemeMenu() {
  const { settings, update } = useSettings();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    const current = rootRef.current?.querySelector<HTMLElement>('[aria-checked="true"]');
    current?.focus();
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const items = [...(rootRef.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = (i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items[next]?.focus();
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      items[e.key === 'Home' ? 0 : items.length - 1]?.focus();
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      if (e.key === 'Escape') e.preventDefault();
      setOpen(false);
      if (e.key === 'Escape') buttonRef.current?.focus();
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label="Theme"
        title="Theme"
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg p-2 text-sub transition-colors hover:bg-surface-2 hover:text-text"
      >
        <Palette size={19} aria-hidden="true" />
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Choose theme"
          onKeyDown={onMenuKey}
          className="tf-fade-in absolute right-0 z-30 mt-2 w-56 rounded-xl border border-line bg-surface p-1.5 shadow-2xl"
        >
          {THEMES.map((t) => {
            const active = t.id === settings.theme;
            return (
              <button
                key={t.id}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  update({ theme: t.id });
                  setOpen(false);
                  buttonRef.current?.focus();
                }}
                className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-surface-2 focus-visible:bg-surface-2"
              >
                <span
                  aria-hidden="true"
                  className="flex h-6 w-9 shrink-0 items-center justify-center gap-0.5 rounded-md border border-line"
                  style={{ background: t.swatch[0] }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: t.swatch[1] }} />
                  <span className="h-2 w-2 rounded-full" style={{ background: t.swatch[2] }} />
                </span>
                <span className="flex-1">{t.name}</span>
                {active && <Check size={16} className="text-accent" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
