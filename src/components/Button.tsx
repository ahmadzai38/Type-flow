import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'ghost' | 'subtle' | 'danger';

const styles: Record<Variant, string> = {
  primary: 'bg-accent text-accent-fg hover:brightness-110',
  subtle: 'bg-surface-2 text-text hover:bg-line',
  ghost: 'text-sub hover:text-text hover:bg-surface-2',
  danger: 'bg-surface-2 text-error hover:bg-error hover:text-bg',
};

export function Button({
  variant = 'subtle',
  icon,
  children,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; icon?: ReactNode }) {
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-[background-color,color,filter] disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}
