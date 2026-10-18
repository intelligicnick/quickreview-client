export type CounterSaleScanSound = 'ready' | 'assigned' | 'not_found';

const PATTERNS: Record<CounterSaleScanSound, { f: number; t: number }[]> = {
  ready: [{ f: 880, t: 0 }, { f: 1175, t: 0.12 }],
  assigned: [{ f: 587, t: 0 }, { f: 494, t: 0.1 }, { f: 440, t: 0.2 }],
  not_found: [{ f: 220, t: 0 }, { f: 180, t: 0.1 }],
};

/** Short beeps for counter-sale QR scan feedback (no asset files). */
export function playCounterSaleScanSound(kind: CounterSaleScanSound) {
  try {
    const ctx = new AudioContext();
    const tones = PATTERNS[kind];
    for (const { f, t } of tones) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.12, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.15);
    }
    const last = tones[tones.length - 1]!;
    window.setTimeout(() => void ctx.close(), (last.t + 0.2) * 1000);
  } catch {
    /* silent fallback */
  }
}
