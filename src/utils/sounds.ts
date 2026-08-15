/**
 * Lightweight macOS-inspired UI sounds, synthesised with the Web Audio API
 * (no audio files needed). The boot chime is a G-major chord with a bright
 * shimmer, echoing the classic Mac startup sound; the rest are short,
 * tasteful UI blips. A mute toggle is persisted to localStorage.
 *
 * Autoplay-safe: browsers suspend the AudioContext until a user gesture.
 * `primeAudio()` (installed at module load) resumes it on the first
 * pointer/key/touch event, and any tone requested before the context can run
 * is queued and flushed the moment it starts — so the boot chime that fires
 * during the scroll-driven hand-off into the desktop is never lost.
 */

let ctx: AudioContext | null = null;
let enabled = true;
let volume = 0.6;
let pending: Array<() => void> = [];

if (typeof window !== "undefined") {
  try {
    enabled = window.localStorage.getItem("aryan-os-sound") !== "off";
  } catch {
    /* storage unavailable */
  }
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    ctx = new AC();
    // Once the context can actually run (e.g. after the first user gesture),
    // flush anything that was requested while it was suspended.
    ctx.addEventListener("statechange", () => {
      if (ctx?.state === "running" && pending.length) {
        const p = pending;
        pending = [];
        p.forEach((fn) => fn());
      }
    });
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Run `fn` now, or queue it until the AudioContext is running — covers
    autoplay policies when a sound is requested before any user gesture. */
function whenRunning(fn: () => void) {
  if (!enabled) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === "running") fn();
  else pending.push(fn);
}

/** Resume the context inside a user-gesture handler (once, per event type),
    so sounds queued earlier finally get a chance to play. */
function primeAudio() {
  if (typeof window === "undefined") return;
  const unlock = () => {
    getCtx(); // resume() called synchronously within the gesture handler
  };
  ["pointerdown", "mousedown", "touchstart", "keydown"].forEach((ev) =>
    window.addEventListener(ev, unlock, { once: true, passive: true }),
  );
}
primeAudio();

interface ToneOpts {
  type?: OscillatorType;
  gain?: number;
  attack?: number;
  /** Total duration in seconds. */
  decay?: number;
  /** Glide the frequency to this value over the decay. */
  glideTo?: number;
  /** Delay in seconds before the tone starts. */
  when?: number;
}

function playTone(
  freq: number,
  {
    type = "sine",
    gain = 0.1,
    attack = 0.004,
    decay = 0.3,
    glideTo,
    when = 0,
  }: ToneOpts = {},
) {
  whenRunning(() => {
    const ac = ctx;
    if (!ac) return;
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (glideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, glideTo), t0 + decay);
    }
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain * volume), t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + decay);
    osc.connect(g);
    g.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + decay + 0.05);
  });
}

function playNoiseSweep(from: number, to: number, dur = 0.35, gain = 0.12) {
  whenRunning(() => {
    const ac = ctx;
    if (!ac) return;
    const t0 = ac.currentTime;
    const len = Math.max(1, Math.floor(ac.sampleRate * dur));
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buf;
    const filter = ac.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 1.1;
    filter.frequency.setValueAtTime(from, t0);
    filter.frequency.exponentialRampToValueAtTime(Math.max(60, to), t0 + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(Math.max(0.0002, gain * volume), t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(ac.destination);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  });
}

/** Shared Web Audio context — the procedural music engine builds on this so
    autoplay priming, volume and the destination are all consistent. Creates
    (and resumes) the context if it doesn't exist yet, like the internal one. */
export function getAudioContext(): AudioContext | null {
  return getCtx();
}

export const sounds = {
  /** The classic startup chord: G-major with a high shimmer, long decay. */
  bootChime() {
    const chord: Array<[number, number]> = [
      [196, 0.1],
      [246.94, 0.09],
      [293.66, 0.09],
      [392, 0.07],
      [784, 0.02],
    ];
    chord.forEach(([f, g], i) =>
      playTone(f, { gain: g, decay: 2.6, attack: 0.012, when: i * 0.02 }),
    );
  },
  /** Short bright blip — opening an app, selecting something. */
  pop() {
    playTone(880, { gain: 0.09, decay: 0.12 });
  },
  /** Quick downward whoosh — minimising a window into the dock. */
  swoosh() {
    playNoiseSweep(720, 120, 0.32, 0.1);
  },
  /** Deeper whoosh — emptying the Trash. */
  whoosh() {
    playNoiseSweep(1000, 130, 0.45, 0.12);
  },
  /** Two-note descending "error" (Basso-ish), for a wrong password. */
  error() {
    playTone(440, { type: "sawtooth", gain: 0.05, decay: 0.16 });
    playTone(349.23, { type: "sawtooth", gain: 0.05, decay: 0.24, when: 0.13 });
  },
  /** Soft rising two-note chime — unlocking the screen. */
  unlock() {
    playTone(523.25, { gain: 0.08, decay: 0.25 });
    playTone(659.25, { gain: 0.08, decay: 0.4, when: 0.09 });
  },
  /** Tiny high blip — scrubbing the volume slider. */
  tick() {
    playTone(1568, { gain: 0.03, decay: 0.05 });
  },
  setVolume(v: number) {
    volume = Math.max(0, Math.min(1, v));
  },
};

export function soundEnabled() {
  return enabled;
}

export function setSoundEnabled(v: boolean) {
  enabled = v;
  try {
    window.localStorage.setItem("aryan-os-sound", v ? "on" : "off");
  } catch {
    /* storage unavailable */
  }
}
