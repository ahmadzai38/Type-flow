import { useId, useState } from 'react';
import { Button } from '../../components/Button';
import { Dialog } from '../../components/Dialog';
import { CUSTOM_TEXT_MAX, validateCustomText } from '../../lib/customText';

interface Props {
  open: boolean;
  initialText: string;
  onClose: () => void;
  onSave: (text: string) => void;
}

const SAMPLES = [
  {
    label: 'Interview answer',
    text: 'In my last project I built a small retrieval pipeline that indexed our documentation and answered questions with sources. The hardest part was not the model; it was cleaning the data and measuring whether answers were actually correct.',
  },
  {
    label: 'Technical terms',
    text: 'asynchronous idempotent middleware latency throughput serialization dependency injection memoization debounce throttle recursion polymorphism encapsulation concurrency',
  },
];

export default function CustomTextDialog({ open, initialText, onClose, onSave }: Props) {
  const [text, setText] = useState(initialText);
  const [error, setError] = useState<string | null>(null);
  const id = useId();

  const save = () => {
    const v = validateCustomText(text);
    if (!v.ok) {
      setError(v.error);
      return;
    }
    onSave(v.text);
  };

  return (
    <Dialog
      open={open}
      title="Custom practice text"
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save}>
            Save &amp; start
          </Button>
        </>
      }
    >
      <label htmlFor={id} className="mb-2 block text-sm text-sub">
        Paste or write anything: an essay, interview answers, technical vocabulary, your own writing. Line breaks
        become spaces and typographic quotes and dashes are converted to keyboard characters.
      </label>
      <textarea
        id={id}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setError(null);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            save();
          }
        }}
        rows={9}
        maxLength={CUSTOM_TEXT_MAX * 2}
        aria-invalid={error !== null}
        aria-describedby={`${id}-help`}
        className="w-full resize-y rounded-lg border border-line bg-bg p-3 font-mono text-sm leading-relaxed text-text outline-none focus:border-accent"
        placeholder="Type or paste your practice text here…"
      />
      <div id={`${id}-help`} className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className={error ? 'text-error' : 'text-sub'} role={error ? 'alert' : undefined}>
          {error ?? 'Tip: Ctrl/⌘ + Enter saves.'}
        </span>
        <span className={text.length > CUSTOM_TEXT_MAX ? 'text-error' : 'text-sub'}>
          {text.length.toLocaleString()} / {CUSTOM_TEXT_MAX.toLocaleString()}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {SAMPLES.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => {
              setText(s.text);
              setError(null);
            }}
            className="rounded-md border border-line px-2.5 py-1 text-xs text-sub transition-colors hover:text-text"
          >
            Use sample: {s.label}
          </button>
        ))}
      </div>
    </Dialog>
  );
}
