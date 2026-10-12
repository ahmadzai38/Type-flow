/**
 * Minimal keystroke sounds synthesized with the Web Audio API — no audio
 * files, no libraries. The AudioContext is created lazily on the first sound
 * and closed when sounds are turned off, so it costs nothing when disabled.
 */
export type SoundKind = 'key' | 'error';

export function createSoundPlayer() {
  let ctx: AudioContext | null = null;

  const ensure = (): AudioContext | null => {
    if (ctx) return ctx;
    const Ctor = window.AudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor({ latencyHint: 'interactive' });
    } catch {
      ctx = null;
    }
    return ctx;
  };

  return {
    play(kind: SoundKind) {
      const c = ensure();
      if (!c) return;
      if (c.state === 'suspended') void c.resume();
      const t = c.currentTime;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = kind === 'error' ? 'square' : 'triangle';
      osc.frequency.setValueAtTime(kind === 'error' ? 180 : 620 + Math.random() * 80, t);
      gain.gain.setValueAtTime(kind === 'error' ? 0.04 : 0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + (kind === 'error' ? 0.08 : 0.035));
      osc.connect(gain).connect(c.destination);
      osc.start(t);
      osc.stop(t + 0.09);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    },
    dispose() {
      if (ctx) void ctx.close().catch(() => undefined);
      ctx = null;
    },
  };
}
