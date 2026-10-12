import type { ReactNode } from 'react';

export interface SegmentOption<T extends string | number> {
  value: T;
  label: ReactNode;
  title?: string;
}

interface Props<T extends string | number> {
  label: string;
  value: T;
  options: readonly SegmentOption<T>[];
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
}

/** A group of mutually exclusive toggle buttons (aria-pressed). */
export function Segmented<T extends string | number>({ label, value, options, onChange, size = 'sm' }: Props<T>) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-0.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={active}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 ${size === 'sm' ? 'py-1 text-[0.82rem]' : 'py-1.5 text-sm'} transition-colors ${
              active ? 'text-accent' : 'text-sub hover:text-text'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function ToggleChip({ label, pressed, onChange, icon }: { label: string; pressed: boolean; onChange: (v: boolean) => void; icon?: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onChange(!pressed)}
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[0.82rem] transition-colors ${
        pressed ? 'text-accent' : 'text-sub hover:text-text'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
