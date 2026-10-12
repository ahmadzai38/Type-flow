export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true" className="shrink-0">
        <rect width="32" height="32" rx="8" className="fill-surface-2" />
        <path d="M8 11h11M13.5 11v11" className="stroke-text" strokeWidth="2.6" strokeLinecap="round" fill="none" />
        <rect x="20" y="18" width="5" height="3" rx="1.5" className="fill-accent" />
      </svg>
      <span className="text-[1.15rem] font-semibold tracking-tight">
        type<span className="text-accent">flow</span>
      </span>
    </span>
  );
}
