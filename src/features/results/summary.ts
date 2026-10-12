import type { DetailedResult } from '../../types';

export interface ResultSummary {
  headline: string;
  text: string;
}

/** Short, honest, human-readable feedback for a finished test. */
export function summarizeResult(r: DetailedResult): ResultSummary {
  const parts: string[] = [];
  let headline: string;

  if (r.personalBest && r.previousBest !== null) {
    headline = 'New personal best!';
    parts.push(`You beat your previous ${r.label} best of ${Math.round(r.previousBest)} WPM.`);
  } else if (r.personalBest) {
    headline = 'First result recorded.';
    parts.push(`This is your baseline for ${r.label}.`);
  } else if (r.previousBest !== null) {
    const gap = r.previousBest - r.wpm;
    headline = gap <= 3 ? 'Right at your best.' : 'Good practice run.';
    parts.push(`Your ${r.label} best is ${Math.round(r.previousBest)} WPM.`);
  } else {
    headline = 'Test complete.';
  }

  if (r.accuracy >= 98) parts.push('Excellent accuracy — you can afford to push speed a little.');
  else if (r.accuracy >= 94) parts.push('Solid accuracy.');
  else if (r.accuracy > 0) parts.push('Accuracy is below 94% — slowing down slightly usually raises WPM overall.');

  if (r.timeline.length >= 3) {
    if (r.consistency >= 80) parts.push('Your pace was very steady.');
    else if (r.consistency < 60) parts.push('Your pace varied a lot; aim for an even rhythm.');
  }
  if (r.rawWpm - r.wpm > 10) parts.push('Errors cost you a noticeable gap between raw and net speed.');

  return { headline, text: parts.join(' ') };
}
