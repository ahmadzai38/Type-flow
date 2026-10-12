import type { TypingEngine } from '../../lib/engine';
import type { SoundKind } from '../../lib/sound';
import type { Passage } from '../../types';

/** Generate more words in time mode when fewer than this many characters remain. */
const EXTEND_THRESHOLD = 160;

export interface InputController {
  type: (text: string) => void;
  backspace: (word: boolean) => void;
}

/**
 * Thin layer between DOM input events and the engine: splits text into
 * characters, keeps time mode supplied with words and triggers sounds.
 */
export function createInputController(
  engine: TypingEngine,
  passage: Passage,
  playSound?: (kind: SoundKind) => void,
): InputController {
  const finished = () => engine.status === 'finished';
  return {
    type(text) {
      for (const ch of text) {
        if (finished()) return;
        const errorsBefore = engine.inputs.incorrect;
        const handled = engine.type(ch === '\r' ? '\n' : ch);
        if (handled && playSound) playSound(engine.inputs.incorrect > errorsBefore ? 'error' : 'key');
        if (passage.more && !finished() && engine.length - engine.cursor < EXTEND_THRESHOLD) {
          engine.append(passage.more());
        }
      }
    },
    backspace(word) {
      engine.backspace(word);
    },
  };
}
