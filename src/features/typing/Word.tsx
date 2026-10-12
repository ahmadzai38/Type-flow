import { memo, type ReactNode } from 'react';
import type { TypingEngine } from '../../lib/engine';

interface Props {
  engine: TypingEngine;
  index: number;
  /** Changes only when something inside this word changed. */
  version: number;
}

/**
 * Renders one word. Memoized on (engine, index, version) so a keystroke only
 * re-renders the one or two words it touched, even in very long passages.
 */
export const Word = memo(function Word({ engine, index }: Props) {
  const start = engine.wordStarts[index];
  const end = engine.wordEnd(index);
  const nodes: ReactNode[] = [];
  for (let i = start; i < end; i++) {
    const ch = engine.target[i];
    const state = engine.states[i];
    const extra = ch === ' ' ? engine.extras.get(i) : undefined;
    if (extra) {
      nodes.push(
        <span key="x" className="tf-extra" data-x={i}>
          {extra}
        </span>,
      );
    }
    if (ch === '\n') {
      nodes.push(
        <span key={i} data-i={i} className={`tf-c${state} tf-nl`}>
          ↵
        </span>,
        '\n',
      );
    } else {
      nodes.push(
        <span key={i} data-i={i} className={`tf-c${state}`}>
          {ch}
        </span>,
      );
    }
  }
  return <span className="tf-word">{nodes}</span>;
});
