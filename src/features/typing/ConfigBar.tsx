import { AtSign, Clock, Code, Hash, Pencil, Quote, WholeWord } from 'lucide-react';
import { memo } from 'react';
import { Segmented, ToggleChip, type SegmentOption } from '../../components/Segmented';
import {
  TIME_OPTIONS,
  WORD_OPTIONS,
  type CodeLanguage,
  type Difficulty,
  type QuoteLength,
  type TestConfig,
  type TestMode,
} from '../../types';

interface Props {
  config: TestConfig;
  onChange: (patch: Partial<TestConfig>) => void;
  onEditCustom: () => void;
}

const MODES: SegmentOption<TestMode>[] = [
  { value: 'time', label: <><Clock size={14} aria-hidden="true" />time</> },
  { value: 'words', label: <><WholeWord size={14} aria-hidden="true" />words</> },
  { value: 'quote', label: <><Quote size={14} aria-hidden="true" />quote</> },
  { value: 'code', label: <><Code size={14} aria-hidden="true" />code</> },
  { value: 'custom', label: <><Pencil size={14} aria-hidden="true" />custom</> },
];

const TIMES: SegmentOption<number>[] = TIME_OPTIONS.map((t) => ({ value: t, label: String(t), title: `${t} seconds` }));
const WORDS: SegmentOption<number>[] = WORD_OPTIONS.map((w) => ({ value: w, label: String(w), title: `${w} words` }));
const QUOTE_LENGTHS: SegmentOption<QuoteLength>[] = [
  { value: 'short', label: 'short' },
  { value: 'medium', label: 'medium' },
  { value: 'long', label: 'long' },
];
const LANGUAGES: SegmentOption<CodeLanguage>[] = [
  { value: 'python', label: 'python' },
  { value: 'javascript', label: 'javascript' },
  { value: 'typescript', label: 'typescript' },
];
const DIFFICULTIES: SegmentOption<Difficulty>[] = [
  { value: 'easy', label: 'easy', title: 'Short, very common words' },
  { value: 'medium', label: 'medium', title: 'Everyday vocabulary' },
  { value: 'hard', label: 'hard', title: 'Long and tricky words' },
];

const Divider = () => <span className="mx-1 hidden h-4 w-px bg-line sm:inline-block" aria-hidden="true" />;

export const ConfigBar = memo(function ConfigBar({ config, onChange, onEditCustom }: Props) {
  const generated = config.mode === 'time' || config.mode === 'words';
  return (
    <div className="tf-chrome mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-x-1 gap-y-1 rounded-xl bg-surface px-2 py-1.5">
      {generated && (
        <>
          <div role="group" aria-label="Word options" className="flex items-center">
            <ToggleChip
              label="punctuation"
              icon={<AtSign size={14} aria-hidden="true" />}
              pressed={config.punctuation}
              onChange={(punctuation) => onChange({ punctuation })}
            />
            <ToggleChip
              label="numbers"
              icon={<Hash size={14} aria-hidden="true" />}
              pressed={config.numbers}
              onChange={(numbers) => onChange({ numbers })}
            />
          </div>
          <Divider />
        </>
      )}

      <Segmented label="Test mode" value={config.mode} options={MODES} onChange={(mode) => onChange({ mode })} />
      <Divider />

      {config.mode === 'time' && (
        <Segmented label="Duration" value={config.time} options={TIMES} onChange={(time) => onChange({ time })} />
      )}
      {config.mode === 'words' && (
        <Segmented label="Word count" value={config.words} options={WORDS} onChange={(words) => onChange({ words })} />
      )}
      {config.mode === 'quote' && (
        <Segmented
          label="Quote length"
          value={config.quoteLength}
          options={QUOTE_LENGTHS}
          onChange={(quoteLength) => onChange({ quoteLength })}
        />
      )}
      {config.mode === 'code' && (
        <Segmented
          label="Language"
          value={config.codeLanguage}
          options={LANGUAGES}
          onChange={(codeLanguage) => onChange({ codeLanguage })}
        />
      )}
      {config.mode === 'custom' && (
        <button
          type="button"
          onClick={onEditCustom}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[0.82rem] text-sub transition-colors hover:text-text"
        >
          <Pencil size={14} aria-hidden="true" /> edit text
        </button>
      )}

      {generated && (
        <>
          <Divider />
          <Segmented
            label="Difficulty"
            value={config.difficulty}
            options={DIFFICULTIES}
            onChange={(difficulty) => onChange({ difficulty })}
          />
        </>
      )}
    </div>
  );
});
