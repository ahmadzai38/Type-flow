import { useEffect, useMemo } from 'react';
import { createSoundPlayer, type SoundKind } from '../lib/sound';

/** Returns a play function when sounds are enabled, otherwise undefined (zero cost). */
export function useSound(enabled: boolean): ((kind: SoundKind) => void) | undefined {
  const player = useMemo(() => (enabled ? createSoundPlayer() : null), [enabled]);
  useEffect(() => () => player?.dispose(), [player]);
  return player ? player.play : undefined;
}
