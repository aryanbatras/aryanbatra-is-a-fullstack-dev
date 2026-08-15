/**
 * A tiny procedural music engine for the desktop's "Music" app. Tracks are
 * synthesised live with the Web Audio API (no audio files): a soft pad chord,
 * a plucky arpeggio and a bass line, each track in its own key and tempo.
 * Built on the same AudioContext as `sounds` so autoplay priming works the
 * same way. A tiny subscriber store drives the menu-bar Now Playing UI.
 */

import { getAudioContext } from "./sounds";

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  /** Root note in MIDI semitones. */
  root: number;
  bpm: number;
  /** Semitone offsets for the arpeggio pool (relative to the root). */
  arp: number[];
  /** Chord progression as semitone offsets from the root. */
  chords: number[];
  major?: boolean;
  /** Artwork gradient hue range. */
  hue: [number, number];
}

export const TRACKS: Track[] = [
  {
    id: "midnight-city",
    title: "Midnight City",
    artist: "M83",
    album: "Hurry Up, We're Dreaming",
    root: 57,
    bpm: 120,
    arp: [0, 3, 7, 12],
    chords: [0, -4, -9, -2],
    hue: [348, 26],
  },
  {
    id: "neon-drive",
    title: "Neon Drive",
    artist: "FM-84",
    album: "Atlas",
    root: 62,
    bpm: 100,
    arp: [0, 3, 7, 12],
    chords: [0, -4, -9, -2],
    hue: [212, 18],
  },
  {
    id: "glass-waves",
    title: "Glass Waves",
    artist: "Tycho",
    album: "Awake",
    root: 60,
    bpm: 92,
    arp: [0, 4, 7, 12],
    chords: [0, -5, -3, -7],
    major: true,
    hue: [168, 34],
  },
  {
    id: "paper-planes",
    title: "Paper Planes",
    artist: "Porter Robinson",
    album: "Worlds",
    root: 66,
    bpm: 110,
    arp: [0, 3, 7, 12],
    chords: [0, -4, -9, -2],
    hue: [262, 22],
  },
];

/** Nominal track length — the loop advances to the next track when reached. */
export const TRACK_DURATION = 178;

/* ---------------- engine state ---------------- */

let trackIndex = 0;
let playing = false;
let pausedAt = 0;
let startCtxTime = 0;
let musicVolume = 0.8;

let master: GainNode | null = null;
let schedulerId: number | null = null;
let emitId: number | null = null;
let nextNoteTime = 0;
let step = 0;
let chordIndex = 0;
const STEPS_PER_CHORD = 8; // 2 bars of 4/4 in 8th notes

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((fn) => fn());
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function midi(f: number): number {
  return 440 * Math.pow(2, (f - 69) / 12);
}

function chordTones(root: number, major: boolean): number[] {
  return major
    ? [root, root + 4, root + 7, root + 12]
    : [root, root + 3, root + 7, root + 12];
}

/** Schedule one tone at time t (seconds) with an attack/release envelope. */
function tone(
  freq: number,
  t: number,
  dur: number,
  gain: number,
  type: OscillatorType = "sine",
  attack = 0.02,
) {
  const ac = getAudioContext();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + attack);
  g.gain.setValueAtTime(Math.max(0.0002, gain), t + dur - 0.35);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  g.connect(master ?? ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function scheduleStep(t: number) {
  const track = TRACKS[trackIndex];
  const spb = 60 / track.bpm / 2; // seconds per 8th note
  const chordDur = spb * STEPS_PER_CHORD;
  const root = track.root + track.chords[chordIndex];
  const major = track.major ?? false;
  const tones = chordTones(root, major);

  // Pad: soft sustained chord at the start of each 2-bar group.
  if (step % STEPS_PER_CHORD === 0) {
    tones.forEach((f) => tone(midi(f), t, chordDur, 0.016, "sine", 1.4));
  }

  // Bass: root on every beat.
  if (step % 2 === 0) {
    tone(midi(root - 12), t, spb * 1.7, 0.05, "sine", 0.03);
  }

  // Arpeggio: plucked pattern across the chord tones, octave variations.
  const arpNote = tones[step % tones.length] + (step % 8 >= 4 ? 12 : 0);
  tone(midi(arpNote), t, 0.28, 0.035, "triangle", 0.008);
  if (step % 4 === 2) {
    tone(midi(tones[(step + 2) % tones.length] + 12), t, 0.24, 0.022, "sine", 0.008);
  }
}

function tick() {
  const ac = getAudioContext();
  if (!ac) return;
  while (nextNoteTime < ac.currentTime + 0.4) {
    scheduleStep(nextNoteTime);
    const spb = 60 / TRACKS[trackIndex].bpm / 2;
    nextNoteTime += spb;
    step += 1;
    if (step >= STEPS_PER_CHORD) {
      step = 0;
      chordIndex = (chordIndex + 1) % TRACKS[trackIndex].chords.length;
    }
  }
}

function startScheduler() {
  if (schedulerId !== null) return;
  const ac = getAudioContext();
  if (!ac) return;
  nextNoteTime = ac.currentTime + 0.05;
  schedulerId = window.setInterval(tick, 110);
}

function stopScheduler() {
  if (schedulerId !== null) {
    window.clearInterval(schedulerId);
    schedulerId = null;
  }
}

function startEmitter() {
  if (emitId !== null) return;
  emitId = window.setInterval(() => {
    // Auto-advance when the (nominal) track ends.
    if (getState().elapsed >= TRACK_DURATION) next();
    else emit();
  }, 500);
}

function stopEmitter() {
  if (emitId !== null) {
    window.clearInterval(emitId);
    emitId = null;
  }
}

function nowPlaying(): { elapsed: number } {
  const ac = getAudioContext();
  if (playing && ac) return { elapsed: pausedAt + (ac.currentTime - startCtxTime) };
  return { elapsed: pausedAt };
}

/* ---------------- public API ---------------- */

export function getState() {
  const track = TRACKS[trackIndex];
  return {
    track,
    playing,
    elapsed: Math.min(nowPlaying().elapsed, TRACK_DURATION),
    duration: TRACK_DURATION,
    volume: musicVolume,
  };
}

export function play() {
  const ac = getAudioContext();
  if (!ac || playing) return;
  playing = true;
  startCtxTime = ac.currentTime;
  if (!master) {
    master = ac.createGain();
    master.gain.value = 0.0001;
    master.connect(ac.destination);
  }
  master.gain.cancelScheduledValues(ac.currentTime);
  master.gain.setValueAtTime(Math.max(0.0002, master.gain.value), ac.currentTime);
  master.gain.exponentialRampToValueAtTime(Math.max(0.0002, musicVolume * 0.5), ac.currentTime + 0.4);
  startScheduler();
  startEmitter();
  emit();
}

export function pause() {
  const ac = getAudioContext();
  if (!playing) return;
  pausedAt += ac ? ac.currentTime - startCtxTime : 0;
  playing = false;
  stopScheduler();
  stopEmitter();
  if (ac && master) {
    master.gain.cancelScheduledValues(ac.currentTime);
    master.gain.setValueAtTime(Math.max(0.0002, master.gain.value), ac.currentTime);
    master.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.25);
  }
  emit();
}

export function toggle() {
  if (playing) pause();
  else play();
}

export function next() {
  stopScheduler();
  stopEmitter();
  pausedAt = 0;
  step = 0;
  chordIndex = 0;
  trackIndex = (trackIndex + 1) % TRACKS.length;
  if (playing) {
    const ac = getAudioContext();
    if (ac) startCtxTime = ac.currentTime;
    startScheduler();
    startEmitter();
  }
  emit();
}

export function prev() {
  stopScheduler();
  stopEmitter();
  pausedAt = 0;
  step = 0;
  chordIndex = 0;
  trackIndex = (trackIndex - 1 + TRACKS.length) % TRACKS.length;
  if (playing) {
    const ac = getAudioContext();
    if (ac) startCtxTime = ac.currentTime;
    startScheduler();
    startEmitter();
  }
  emit();
}

export function seekTo(seconds: number) {
  const t = Math.max(0, Math.min(TRACK_DURATION, seconds));
  const ac = getAudioContext();
  if (playing && ac) startCtxTime = ac.currentTime - t;
  pausedAt = t;
  emit();
}

export function setMusicVolume(v: number) {
  musicVolume = Math.max(0, Math.min(1, v));
  emit();
}
