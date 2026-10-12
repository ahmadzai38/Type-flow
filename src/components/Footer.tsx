import { Code, ShieldCheck } from 'lucide-react';

const Kbd = ({ children }: { children: string }) => (
  <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-[0.7rem] text-text">{children}</kbd>
);

export function Footer() {
  return (
    <footer className="tf-chrome mx-auto flex w-full max-w-6xl flex-col items-center gap-3 px-4 pb-6 pt-8 text-xs text-sub sm:px-8">
      <p className="hidden items-center gap-1.5 sm:flex">
        <Kbd>tab</Kbd> + <Kbd>enter</Kbd> <span className="mr-3">restart</span>
        <Kbd>esc</Kbd> <span className="mr-3">unfocus</span>
        <Kbd>ctrl</Kbd> + <Kbd>⌫</Kbd> <span>delete word</span>
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck size={14} aria-hidden="true" /> No ads, no trackers — your data stays on this device
        </span>
        <a
          href="https://github.com/your-username/typeflow"
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1.5 rounded transition-colors hover:text-text"
        >
          <Code size={14} aria-hidden="true" /> Source on GitHub
        </a>
      </div>
    </footer>
  );
}
