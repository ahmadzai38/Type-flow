import { Check } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { Button } from '../../components/Button';
import { Dialog } from '../../components/Dialog';
import { Segmented } from '../../components/Segmented';
import { Switch } from '../../components/Switch';
import { useSettings } from '../../hooks/settingsContext';
import { FONT_SIZE, LINE_HEIGHT, THEMES } from '../../lib/settings';
import type { CaretStyle, MotionPreference } from '../../types';

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="border-b border-line py-4 first:pt-0 last:border-b-0">
      <legend className="mb-2 text-xs font-semibold tracking-wide text-sub uppercase">{title}</legend>
      {children}
    </fieldset>
  );
}

function Slider(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const id = useId();
  return (
    <div className="py-2">
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <label htmlFor={id} className="font-medium">
          {props.label}
        </label>
        <span className="font-mono text-sub tabular-nums">{props.format(props.value)}</span>
      </div>
      <input
        id={id}
        type="range"
        className="tf-range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        aria-valuetext={props.format(props.value)}
        onChange={(e) => props.onChange(Number(e.target.value))}
      />
    </div>
  );
}

const CARETS: { value: CaretStyle; label: string }[] = [
  { value: 'line', label: 'line' },
  { value: 'block', label: 'block' },
  { value: 'underline', label: 'underline' },
];
const MOTION: { value: MotionPreference; label: string }[] = [
  { value: 'system', label: 'follow system' },
  { value: 'reduce', label: 'reduce' },
  { value: 'full', label: 'full' },
];

export default function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings, update, reset, reducedMotion } = useSettings();

  return (
    <Dialog
      open={open}
      title="Settings"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={reset}>
            Restore defaults
          </Button>
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </>
      }
    >
      <Group title="Theme">
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Theme">
          {THEMES.map((t) => {
            const active = settings.theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => update({ theme: t.id })}
                className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-sm transition-colors ${
                  active ? 'border-accent' : 'border-line hover:border-sub'
                }`}
              >
                <span
                  aria-hidden="true"
                  className="flex h-5 w-8 shrink-0 items-center justify-center gap-0.5 rounded border border-line"
                  style={{ background: t.swatch[0] }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: t.swatch[1] }} />
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: t.swatch[2] }} />
                </span>
                <span className="flex-1 truncate">{t.name}</span>
                {active && <Check size={14} className="text-accent" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </Group>

      <Group title="Typing text">
        <Slider
          label="Font size"
          value={settings.fontSize}
          min={FONT_SIZE.min}
          max={FONT_SIZE.max}
          step={FONT_SIZE.step}
          format={(v) => `${v}px`}
          onChange={(fontSize) => update({ fontSize })}
        />
        <Slider
          label="Line height"
          value={settings.lineHeight}
          min={LINE_HEIGHT.min}
          max={LINE_HEIGHT.max}
          step={LINE_HEIGHT.step}
          format={(v) => v.toFixed(1)}
          onChange={(lineHeight) => update({ lineHeight: Math.round(lineHeight * 10) / 10 })}
        />
        <div className="flex items-center justify-between gap-4 py-2">
          <span className="text-sm font-medium" id="caret-label">
            Caret style
          </span>
          <Segmented label="Caret style" value={settings.caretStyle} options={CARETS} onChange={(caretStyle) => update({ caretStyle })} size="md" />
        </div>
        <Switch
          label="Smooth caret"
          description={reducedMotion ? 'Disabled while reduced motion is on.' : 'Glide the caret between characters.'}
          checked={settings.smoothCaret}
          onChange={(smoothCaret) => update({ smoothCaret })}
        />
      </Group>

      <Group title="Interface">
        <Switch
          label="Live statistics"
          description="Show the timer or progress, WPM and accuracy while typing."
          checked={settings.showLiveStats}
          onChange={(showLiveStats) => update({ showLiveStats })}
        />
        <Switch
          label="Keystroke sounds"
          description="Soft clicks generated in the browser. Off by default."
          checked={settings.sound}
          onChange={(sound) => update({ sound })}
        />
        <div className="flex flex-wrap items-center justify-between gap-2 py-2">
          <div>
            <span className="block text-sm font-medium">Motion</span>
            <span className="text-xs text-sub">Reduce animations and transitions.</span>
          </div>
          <Segmented label="Motion" value={settings.motion} options={MOTION} onChange={(motion) => update({ motion })} size="md" />
        </div>
      </Group>

      <Group title="Keyboard shortcuts">
        <ul className="space-y-1.5 text-sm text-sub">
          <li>
            <kbd className="font-mono text-text">Tab</kbd> then <kbd className="font-mono text-text">Enter</kbd> — restart with a
            new passage
          </li>
          <li>
            <kbd className="font-mono text-text">Esc</kbd> — leave the typing field (closes dialogs)
          </li>
          <li>
            <kbd className="font-mono text-text">Ctrl/⌥ + Backspace</kbd> — delete the previous word
          </li>
          <li>Any letter key — focus the test and start typing</li>
        </ul>
      </Group>
    </Dialog>
  );
}
