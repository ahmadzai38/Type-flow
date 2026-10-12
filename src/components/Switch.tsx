import { useId } from 'react';

interface Props {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Switch({ label, description, checked, onChange }: Props) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <label htmlFor={id} className="block text-sm font-medium text-text">
          {label}
        </label>
        {description && (
          <p id={`${id}-d`} className="mt-0.5 text-xs text-sub">
            {description}
          </p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? `${id}-d` : undefined}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors ${
          checked ? 'border-accent bg-accent' : 'border-line bg-surface-2'
        }`}
      >
        <span
          aria-hidden="true"
          className={`inline-block h-4.5 w-4.5 rounded-full shadow-sm transition-transform ${
            checked ? 'translate-x-5.5 bg-accent-fg' : 'translate-x-0.5 bg-sub'
          }`}
        />
      </button>
    </div>
  );
}
