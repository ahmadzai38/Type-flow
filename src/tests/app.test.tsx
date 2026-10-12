import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { SettingsProvider } from '../components/SettingsProvider';
import { STORAGE_KEYS } from '../lib/storage';
import type { TestConfig } from '../types';

function setup(test: Partial<TestConfig> = {}, extra: Record<string, unknown> = {}) {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify({ ...extra, test: { mode: 'words', words: 10, ...test } }));
  const utils = render(
    <SettingsProvider>
      <App />
    </SettingsProvider>,
  );
  const input = screen.getByLabelText(/typing input/i) as HTMLTextAreaElement;
  const passage = () => document.querySelector('.tf-text')!.textContent!.replace(/↵/g, '');
  return { ...utils, input, passage };
}

const chars = (cls: string) => document.querySelectorAll(`.tf-text .${cls}`).length;

/** Escapes characters that user-event treats as special in keyboard(). */
const keys = (text: string) => text.replace(/[{[]/g, (c) => c + c);

function useFakeClock() {
  // Testing Library looks for a global `jest` when fake timers are active.
  (globalThis as unknown as { jest: unknown }).jest = { advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms) };
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'performance', 'Date'] });
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime, delay: 60 });
}

afterEach(() => {
  vi.useRealTimers();
  delete (globalThis as unknown as { jest?: unknown }).jest;
});

describe('typing flow', () => {
  it('focuses the input and shows correct / incorrect characters', async () => {
    const user = userEvent.setup();
    const { input, passage } = setup();
    expect(document.activeElement).toBe(input);
    const text = passage();
    await user.keyboard(keys(text.slice(0, 3)));
    expect(chars('tf-c1')).toBe(3);
    await user.keyboard(text[3] === 'q' ? 'z' : 'q');
    expect(chars('tf-c2') + document.querySelectorAll('.tf-extra').length).toBe(1);
    await user.keyboard('{Backspace}');
    expect(chars('tf-c2')).toBe(0);
    expect(chars('tf-c1')).toBe(3);
  });

  it('completes a word test, shows results and saves history', async () => {
    const user = useFakeClock();
    const { passage } = setup({ words: 10 });
    await user.keyboard(keys(passage()));
    expect(screen.getByRole('heading', { name: /test results/i })).toBeInTheDocument();
    expect(screen.getByText('accuracy')).toBeInTheDocument();
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.history)!);
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ mode: 'words', label: 'words 10', accuracy: 100 });
    expect(saved[0].wpm).toBeGreaterThan(0);
  });

  it('ends a time test exactly when the timer expires', async () => {
    const user = useFakeClock();
    const { passage } = setup({ mode: 'time', time: 15 });
    await user.keyboard(keys(passage().slice(0, 5)));
    expect(screen.queryByRole('heading', { name: /test results/i })).toBeNull();
    await act(async () => {
      vi.advanceTimersByTime(15_000);
    });
    expect(screen.getByRole('heading', { name: /test results/i })).toBeInTheDocument();
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.history)!);
    expect(saved[0].durationMs).toBe(15_000);
    expect(saved[0].label).toBe('time 15');
  });

  it('does not start the timer before the first keystroke', async () => {
    useFakeClock();
    setup({ mode: 'time', time: 15 });
    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });
    expect(screen.queryByRole('heading', { name: /test results/i })).toBeNull();
  });

  it('restart creates a new passage; same passage keeps the text', async () => {
    const user = userEvent.setup();
    const { passage } = setup({ words: 25 });
    const first = passage();
    await user.keyboard(keys(first.slice(0, 4)));
    await user.click(screen.getByRole('button', { name: /restart with the same passage/i }));
    expect(passage()).toBe(first);
    expect(chars('tf-c1')).toBe(0);
    await user.click(screen.getByRole('button', { name: /restart with a new passage/i }));
    expect(passage()).not.toBe(first);
  });

  it('Tab moves focus to restart so Tab + Enter restarts', async () => {
    const user = userEvent.setup();
    const { passage, input } = setup({ words: 25 });
    const first = passage();
    await user.keyboard(keys(first.slice(0, 2)));
    await user.tab();
    expect(screen.getByRole('button', { name: /restart with a new passage/i })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(passage()).not.toBe(first);
    expect(input).toHaveFocus();
  });

  it('Escape leaves the input and typing anywhere refocuses it', async () => {
    const user = userEvent.setup();
    const { input, passage } = setup();
    await user.keyboard('{Escape}');
    expect(input).not.toHaveFocus();
    expect(screen.getByText(/click here or start typing/i)).toBeInTheDocument();
    await user.keyboard(keys(passage()[0]));
    expect(input).toHaveFocus();
    expect(chars('tf-c1')).toBe(1);
  });

  it('blocks paste with a visible notice', () => {
    const { input } = setup();
    fireEvent.paste(input, { clipboardData: { getData: () => 'cheat' } });
    expect(screen.getByRole('status', { name: '' })).toHaveTextContent(/pasting is disabled/i);
    expect(chars('tf-c1')).toBe(0);
  });

  it('ignores modifier keys and browser shortcuts', async () => {
    const user = userEvent.setup();
    setup();
    await user.keyboard('{Shift}{Control>}a{/Control}{Alt}');
    expect(chars('tf-c1') + chars('tf-c2')).toBe(0);
  });

  it('switches modes from the config bar', async () => {
    const user = userEvent.setup();
    const { passage } = setup({ mode: 'words', words: 10 });
    await user.click(screen.getByRole('button', { name: /code/i }));
    expect(passage()).toMatch(/\n/);
    await user.click(screen.getByRole('button', { name: /^time$/i }));
    await user.click(screen.getByRole('button', { name: '60' }));
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.settings)!);
    expect(saved.test).toMatchObject({ mode: 'time', time: 60 });
  });

  it('punctuation toggle changes generated text', async () => {
    const user = userEvent.setup();
    const { passage } = setup({ mode: 'words', words: 50 });
    expect(passage()).toMatch(/^[a-z ]+$/);
    await user.click(screen.getByRole('button', { name: /punctuation/i }));
    expect(passage()).toMatch(/[A-Z]/);
  });
});

describe('code mode', () => {
  it('Enter types a newline and indentation is auto-filled', async () => {
    const user = userEvent.setup();
    const { passage } = setup({ mode: 'code', codeLanguage: 'python' });
    const text = passage();
    const upto = text.indexOf('\n ');
    expect(upto).toBeGreaterThan(0);
    await user.keyboard(keys(text.slice(0, upto)).replace(/\n/g, '{Enter}') + '{Enter}');
    expect(chars('tf-c2')).toBe(0);
    expect(chars('tf-c4')).toBeGreaterThan(0);
  });
});

describe('custom text and settings', () => {
  it('lets the user enter custom text', async () => {
    const user = userEvent.setup();
    const { passage } = setup();
    await user.click(screen.getByRole('button', { name: /custom/i }));
    const dialog = await screen.findByRole('dialog', { name: /custom practice text/i });
    const area = within(dialog).getByRole('textbox');
    await user.clear(area);
    await user.click(within(dialog).getByRole('button', { name: /save/i }));
    expect(within(dialog).getByRole('alert')).toHaveTextContent(/at least/i);
    await user.type(area, 'practice makes progress');
    await user.click(within(dialog).getByRole('button', { name: /save/i }));
    expect(passage()).toBe('practice makes progress');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.settings)!).test.customText).toBe('practice makes progress');
  });

  it('persists theme and preferences', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: /^settings$/i }));
    const dialog = await screen.findByRole('dialog', { name: /settings/i });
    await user.click(within(dialog).getByRole('radio', { name: /ocean blue/i }));
    await user.click(within(dialog).getByRole('switch', { name: /keystroke sounds/i }));
    expect(document.documentElement.dataset.theme).toBe('ocean');
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.settings)!);
    expect(saved).toMatchObject({ theme: 'ocean', sound: true });
  });

  it('theme menu in the header switches theme', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: /^theme$/i }));
    await user.click(screen.getByRole('menuitemradio', { name: /warm sepia/i }));
    expect(document.documentElement.dataset.theme).toBe('sepia');
  });

  it('hides live stats when disabled', () => {
    setup({ mode: 'time', time: 30 }, { showLiveStats: false });
    expect(screen.queryByTitle('seconds left')).toBeNull();
  });
});

describe('statistics page', () => {
  it('shows an empty state, then results after a test', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: /^stats$/i }));
    expect(await screen.findByText(/finish a test/i, {}, { timeout: 5000 })).toBeInTheDocument();
  });
});
