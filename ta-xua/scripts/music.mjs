#!/usr/bin/env node
/**
 * npm run video:music -- --out shared/music/travel-upbeat --seconds 120
 *                        [--style upbeat|ambient|winter|taynguyen|hmong] [--seed 1]
 *
 * Synthesises a travel background track from scratch, so the video has music
 * with no licence to clear. Output is deterministic for a given seed:
 * re-running produces the same file.
 *
 *   upbeat   (default) C - G - Am - F at 118 BPM. Hats and filtered chords
 *            for four bars, a snare build, then four-on-the-floor kick, claps,
 *            pumping off-beat bass and side-chained chord stabs; a plucked
 *            pentatonic hook joins at bar 13.
 *   ambient  The calm original: Fmaj7 - G - Em7 - Am7 at 92 BPM, pad and
 *            bass, then a plucked arpeggio, then soft kick and shaker.
 *
 * Writes <out>.wav, then encodes <out>.mp3 with Remotion's bundled ffmpeg
 * (it ships libmp3lame but not the ipod muxer that .m4a needs).
 * The length does not need to match the video: the composition loops it and
 * fades it out at the end.
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fail, parseArgs } from "./lib/args.mjs";
import { runMedia } from "./lib/media.mjs";
import { PUBLIC_ROOT, resolveInside } from "./lib/paths.mjs";

const SAMPLE_RATE = 44100;
const BPM = 92;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;

// MIDI note numbers. Two bars per chord, eight bars per loop.
const PROGRESSION = [
  { root: 41, tones: [53, 57, 60, 64] }, // Fmaj7
  { root: 43, tones: [55, 59, 62, 67] }, // G
  { root: 40, tones: [52, 55, 59, 62] }, // Em7
  { root: 45, tones: [57, 60, 64, 67] }, // Am7
];
const BARS_PER_CHORD = 2;

const midiToHz = (note) => 440 * Math.pow(2, (note - 69) / 12);

/** Small deterministic PRNG so the shaker noise is identical every run. */
const makeRandom = (seed) => {
  let state = seed >>> 0 || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) / 4294967296) * 2 - 1;
  };
};

const chordAt = (time) => {
  const chordIndex =
    Math.floor(time / (BAR * BARS_PER_CHORD)) % PROGRESSION.length;
  return PROGRESSION[chordIndex];
};

/** Linear ramp from 0 to 1 between start and end, clamped. */
const ramp = (time, start, end) =>
  Math.min(1, Math.max(0, (time - start) / (end - start)));

const synthesiseAmbient = (seconds, seed) => {
  const length = Math.floor(seconds * SAMPLE_RATE);
  const left = new Float32Array(length);
  const right = new Float32Array(length);
  const random = makeRandom(seed);

  // --- Pad: two detuned voices per chord tone, slow swells between chords.
  const chordSpan = BAR * BARS_PER_CHORD;
  const padLowpass = 1 - Math.exp((-2 * Math.PI * 1400) / SAMPLE_RATE);
  let padStateL = 0;
  let padStateR = 0;
  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE;
    const chord = chordAt(t);
    const inChord = t % chordSpan;
    // Swell in over 0.9s, ease out over the last 1.1s of each chord.
    const envelope =
      Math.min(1, inChord / 0.9) * Math.min(1, (chordSpan - inChord) / 1.1);

    let l = 0;
    let r = 0;
    for (const note of chord.tones) {
      const hz = midiToHz(note);
      const detune = Math.pow(2, 6 / 1200);
      const a = Math.sin(2 * Math.PI * hz * detune * t);
      const b = Math.sin(2 * Math.PI * (hz / detune) * t);
      // A touch of third harmonic warms the sine without turning it buzzy.
      const warmA = a + 0.18 * Math.sin(2 * Math.PI * hz * detune * 3 * t);
      const warmB = b + 0.18 * Math.sin(2 * Math.PI * (hz / detune) * 3 * t);
      l += warmA * 0.75 + warmB * 0.25;
      r += warmA * 0.25 + warmB * 0.75;
    }
    padStateL += padLowpass * (l - padStateL);
    padStateR += padLowpass * (r - padStateR);
    left[i] += padStateL * envelope * 0.055;
    right[i] += padStateR * envelope * 0.055;
  }

  // --- Bass: chord root on beats 1 and 3.
  for (let beatStart = 0; beatStart < seconds; beatStart += BEAT * 2) {
    const chord = chordAt(beatStart + 0.001);
    const hz = midiToHz(chord.root);
    const start = Math.floor(beatStart * SAMPLE_RATE);
    const noteLength = Math.floor(BEAT * 1.7 * SAMPLE_RATE);
    for (let j = 0; j < noteLength && start + j < length; j++) {
      const t = j / SAMPLE_RATE;
      const envelope = Math.min(1, t / 0.02) * Math.exp(-t * 1.6);
      const sample =
        (Math.sin(2 * Math.PI * hz * t) +
          0.3 * Math.sin(2 * Math.PI * hz * 2 * t)) *
        envelope *
        0.16;
      left[start + j] += sample;
      right[start + j] += sample;
    }
  }

  // --- Pluck arpeggio on eighth notes, from bar 3, with a ping-pong delay.
  const pluckL = new Float32Array(length);
  const pluckR = new Float32Array(length);
  const arpStart = BAR * 2;
  let step = 0;
  for (let noteStart = arpStart; noteStart < seconds; noteStart += BEAT / 2) {
    const chord = chordAt(noteStart + 0.001);
    const pattern = [0, 2, 1, 3, 2, 1, 3, 2];
    const note = chord.tones[pattern[step % pattern.length]] + 12;
    const hz = midiToHz(note);
    const start = Math.floor(noteStart * SAMPLE_RATE);
    const noteLength = Math.floor(0.9 * SAMPLE_RATE);
    const pan = step % 2 === 0 ? 0.62 : 0.38;
    // Accent the downbeat of each bar a little.
    const velocity = step % 8 === 0 ? 1 : 0.72;
    for (let j = 0; j < noteLength && start + j < length; j++) {
      const t = j / SAMPLE_RATE;
      const envelope = Math.min(1, t / 0.004) * Math.exp(-t * 5.5);
      const sample =
        (Math.sin(2 * Math.PI * hz * t) +
          0.25 * Math.sin(2 * Math.PI * hz * 2 * t) * Math.exp(-t * 9)) *
        envelope *
        velocity *
        0.075;
      pluckL[start + j] += sample * (1 - pan);
      pluckR[start + j] += sample * pan;
    }
    step++;
  }
  const delaySamples = Math.floor(BEAT * 0.75 * SAMPLE_RATE);
  for (let i = 0; i < length; i++) {
    const fade = ramp(i / SAMPLE_RATE, arpStart, arpStart + BAR);
    if (i >= delaySamples) {
      // Cross-feed so echoes alternate sides.
      pluckL[i] += pluckR[i - delaySamples] * 0.34;
      pluckR[i] += pluckL[i - delaySamples] * 0.34;
    }
    left[i] += pluckL[i] * fade;
    right[i] += pluckR[i] * fade;
  }

  // --- Drums from bar 5: soft kick on 1 and 3, shaker on off-beat eighths.
  const drumStart = BAR * 4;
  for (let beatStart = drumStart; beatStart < seconds; beatStart += BEAT * 2) {
    const start = Math.floor(beatStart * SAMPLE_RATE);
    const kickLength = Math.floor(0.32 * SAMPLE_RATE);
    let phase = 0;
    for (let j = 0; j < kickLength && start + j < length; j++) {
      const t = j / SAMPLE_RATE;
      const hz = 46 + 70 * Math.exp(-t * 28);
      phase += (2 * Math.PI * hz) / SAMPLE_RATE;
      const sample = Math.sin(phase) * Math.exp(-t * 9) * 0.26;
      left[start + j] += sample;
      right[start + j] += sample;
    }
  }
  const shakerHighpass = Math.exp((-2 * Math.PI * 5000) / SAMPLE_RATE);
  for (
    let noteStart = drumStart + BEAT / 2;
    noteStart < seconds;
    noteStart += BEAT
  ) {
    const start = Math.floor(noteStart * SAMPLE_RATE);
    const shakeLength = Math.floor(0.07 * SAMPLE_RATE);
    let previousIn = 0;
    let previousOut = 0;
    for (let j = 0; j < shakeLength && start + j < length; j++) {
      const t = j / SAMPLE_RATE;
      const input = random();
      // One-pole high-pass keeps only the hiss.
      const output = shakerHighpass * (previousOut + input - previousIn);
      previousIn = input;
      previousOut = output;
      const sample = output * Math.exp(-t * 60) * 0.05;
      left[start + j] += sample * 0.8;
      right[start + j] += sample * 1.0;
    }
  }

  // --- Master: gentle saturation, fades, then normalise to -3 dBFS.
  return master(left, right, seconds, { drive: 1.4, fadeIn: 2.5, peak: 0.708 });
};

/**
 * Saturates, fades both ends and normalises to `peak` (linear). Shared by
 * every style so their loudness is set in one place.
 */
const master = (left, right, seconds, { drive, fadeIn, peak: target }) => {
  let peak = 0;
  for (let i = 0; i < left.length; i++) {
    const t = i / SAMPLE_RATE;
    const fade = ramp(t, 0, fadeIn) * ramp(seconds - t, 0, 4);
    left[i] = Math.tanh(left[i] * drive) * fade;
    right[i] = Math.tanh(right[i] * drive) * fade;
    peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
  }
  const gain = peak > 0 ? target / peak : 1;
  for (let i = 0; i < left.length; i++) {
    left[i] *= gain;
    right[i] *= gain;
  }
  return { left, right };
};

// ---------------------------------------------------------------------------
// Upbeat: C - G - Am - F, one bar each, 118 BPM.

const UP_BPM = 118;
const UP_BEAT = 60 / UP_BPM;
const UP_BAR = UP_BEAT * 4;

const UP_PROGRESSION = [
  { root: 36, tones: [60, 64, 67] }, // C
  { root: 43, tones: [59, 62, 67] }, // G
  { root: 45, tones: [57, 60, 64] }, // Am
  { root: 41, tones: [57, 60, 65] }, // F
];

/** One bar of eighth notes per chord; null is a rest. C major pentatonic. */
const UP_HOOK = [
  [79, null, 76, 79, 81, null, 79, 76],
  [74, null, 79, 74, 76, null, 74, 71],
  [76, null, 72, 76, 81, null, 79, 76],
  [77, null, 72, 77, 76, null, 74, 72],
];

/** Bars of hats and filtered chords before the beat comes in. */
const INTRO_BARS = 4;
/** The plucked hook joins after this many bars. */
const HOOK_BAR = 12;

const upChordIndex = (time) =>
  Math.floor(time / UP_BAR) % UP_PROGRESSION.length;

/** Naive sawtooth; the one-pole low-pass after it tames the aliasing. */
const saw = (phase) => 2 * (phase - Math.floor(phase + 0.5));

/** Adds a burst of high-passed noise: a hat, a snare or a clap layer. */
const addNoise = (
  left,
  right,
  random,
  start,
  seconds,
  { decay, gain, cutoff, pan = 0.5 },
) => {
  const coefficient = Math.exp((-2 * Math.PI * cutoff) / SAMPLE_RATE);
  const from = Math.floor(start * SAMPLE_RATE);
  const count = Math.floor(seconds * SAMPLE_RATE);
  let previousIn = 0;
  let previousOut = 0;
  for (let j = 0; j < count && from + j < left.length; j++) {
    const t = j / SAMPLE_RATE;
    const input = random();
    const output = coefficient * (previousOut + input - previousIn);
    previousIn = input;
    previousOut = output;
    const sample = output * Math.exp(-t * decay) * gain;
    left[from + j] += sample * (1 - pan) * 2;
    right[from + j] += sample * pan * 2;
  }
};

const synthesiseUpbeat = (seconds, seed) => {
  const length = Math.floor(seconds * SAMPLE_RATE);
  const left = new Float32Array(length);
  const right = new Float32Array(length);
  const random = makeRandom(seed);
  const noise = (start, span, options) =>
    addNoise(left, right, random, start, span, options);
  const dropAt = UP_BAR * INTRO_BARS;

  /** Side-chain: ducks chords and bass under every kick once the beat is in. */
  const pump = (t) => {
    if (t < dropAt) return 1;
    return 1 - 0.6 * Math.exp(-(t % UP_BEAT) * 11);
  };

  // --- Chords: three detuned saws per tone, a soft sustained layer plus
  // off-beat stabs. The filter opens across the intro.
  const detuneUp = Math.pow(2, 9 / 1200);
  const detuneDown = Math.pow(2, -9 / 1200);
  let lowL = 0;
  let lowR = 0;
  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE;
    const chord = UP_PROGRESSION[upChordIndex(t)];
    let l = 0;
    let r = 0;
    for (const note of chord.tones) {
      const hz = midiToHz(note);
      const centre = saw(hz * t);
      l += centre * 0.5 + saw(hz * detuneUp * t) * 0.5;
      r += centre * 0.5 + saw(hz * detuneDown * t) * 0.5;
    }
    const cutoff = 600 + 2600 * ramp(t, 0, dropAt);
    const coefficient = 1 - Math.exp((-2 * Math.PI * cutoff) / SAMPLE_RATE);
    lowL += coefficient * (l - lowL);
    lowR += coefficient * (r - lowR);

    // Stab envelope on every off-beat eighth.
    const sinceOffBeat = (t + UP_BEAT / 2) % UP_BEAT;
    const stab = sinceOffBeat < UP_BEAT / 2 ? Math.exp(-sinceOffBeat * 9) : 0;
    const level = (0.018 + 0.05 * stab) * pump(t);
    left[i] += lowL * level;
    right[i] += lowR * level;
  }

  // --- Bass: root on every eighth from the drop, up an octave off the beat.
  for (let step = 0; dropAt + (step * UP_BEAT) / 2 < seconds; step++) {
    const noteStart = dropAt + (step * UP_BEAT) / 2;
    const chord = UP_PROGRESSION[upChordIndex(noteStart + 0.001)];
    const hz = midiToHz(chord.root + (step % 2 === 1 ? 12 : 0));
    const start = Math.floor(noteStart * SAMPLE_RATE);
    const count = Math.floor((UP_BEAT / 2) * 0.9 * SAMPLE_RATE);
    for (let j = 0; j < count && start + j < length; j++) {
      const t = j / SAMPLE_RATE;
      const envelope = Math.min(1, t / 0.004) * Math.exp(-t * 6);
      const tone =
        Math.sin(2 * Math.PI * hz * t) +
        0.35 * Math.sin(2 * Math.PI * hz * 2 * t) +
        0.12 * Math.sin(2 * Math.PI * hz * 3 * t);
      const sample = tone * envelope * 0.2 * pump(noteStart + t);
      left[start + j] += sample;
      right[start + j] += sample;
    }
  }

  // --- Kick on every beat from the drop.
  for (let beatStart = dropAt; beatStart < seconds; beatStart += UP_BEAT) {
    const start = Math.floor(beatStart * SAMPLE_RATE);
    const count = Math.floor(0.3 * SAMPLE_RATE);
    let phase = 0;
    for (let j = 0; j < count && start + j < length; j++) {
      const t = j / SAMPLE_RATE;
      const hz = 48 + 110 * Math.exp(-t * 32);
      phase += (2 * Math.PI * hz) / SAMPLE_RATE;
      const click = j < 90 ? (1 - j / 90) * 0.25 : 0;
      const sample = (Math.sin(phase) * Math.exp(-t * 10) + click) * 0.42;
      left[start + j] += sample;
      right[start + j] += sample;
    }
  }

  // --- Clap on 2 and 4 from the drop: two flams, then the body.
  for (
    let beatStart = dropAt + UP_BEAT;
    beatStart < seconds;
    beatStart += UP_BEAT * 2
  ) {
    noise(beatStart, 0.02, { decay: 120, gain: 0.12, cutoff: 1200 });
    noise(beatStart + 0.011, 0.02, { decay: 120, gain: 0.12, cutoff: 1200 });
    noise(beatStart + 0.022, 0.22, { decay: 22, gain: 0.12, cutoff: 1200 });
  }

  // --- Snare build over the last intro bar: eighths, then sixteenths.
  for (let k = 0; k < 12; k++) {
    const at =
      dropAt -
      UP_BAR +
      (k < 4 ? (k * UP_BEAT) / 2 : UP_BEAT * 2 + ((k - 4) * UP_BEAT) / 4);
    noise(at, 0.12, { decay: 30, gain: 0.03 + 0.06 * (k / 11), cutoff: 900 });
  }

  // --- Hats: closed sixteenths throughout, open hat off the beat after the drop.
  for (let step = 0; (step * UP_BEAT) / 4 < seconds; step++) {
    const at = (step * UP_BEAT) / 4;
    const accent = step % 2 === 1 ? 1 : 0.55;
    noise(at, 0.04, {
      decay: 90,
      gain: 0.028 * accent * (at < dropAt ? 0.7 : 1),
      cutoff: 7000,
      pan: step % 4 === 2 ? 0.62 : 0.42,
    });
  }
  for (let at = dropAt + UP_BEAT / 2; at < seconds; at += UP_BEAT) {
    noise(at, 0.2, { decay: 16, gain: 0.03, cutoff: 6500, pan: 0.58 });
  }

  // --- Hook: plucked pentatonic melody with a ping-pong delay.
  const hookL = new Float32Array(length);
  const hookR = new Float32Array(length);
  const hookStart = UP_BAR * HOOK_BAR;
  for (let step = 0; hookStart + (step * UP_BEAT) / 2 < seconds; step++) {
    const at = hookStart + (step * UP_BEAT) / 2;
    const note = UP_HOOK[upChordIndex(at + 0.001)][step % 8];
    if (note === null) continue;
    const hz = midiToHz(note);
    const start = Math.floor(at * SAMPLE_RATE);
    const count = Math.floor(0.5 * SAMPLE_RATE);
    const pan = step % 2 === 0 ? 0.56 : 0.44;
    for (let j = 0; j < count && start + j < length; j++) {
      const t = j / SAMPLE_RATE;
      const envelope = Math.min(1, t / 0.003) * Math.exp(-t * 7);
      const sample =
        (Math.sin(2 * Math.PI * hz * t) +
          0.4 * Math.sin(2 * Math.PI * hz * 2 * t) * Math.exp(-t * 12) +
          0.15 * Math.sin(2 * Math.PI * hz * 3 * t) * Math.exp(-t * 18)) *
        envelope *
        0.07;
      hookL[start + j] += sample * (1 - pan) * 2;
      hookR[start + j] += sample * pan * 2;
    }
  }
  const delaySamples = Math.floor(UP_BEAT * 0.75 * SAMPLE_RATE);
  for (let i = 0; i < length; i++) {
    if (i >= delaySamples) {
      hookL[i] += hookR[i - delaySamples] * 0.3;
      hookR[i] += hookL[i - delaySamples] * 0.3;
    }
    const fade = ramp(i / SAMPLE_RATE, hookStart, hookStart + UP_BAR);
    left[i] += hookL[i] * fade;
    right[i] += hookR[i] * fade;
  }

  // Hotter than ambient: it has to carry energy under the voice. Peaks stay
  // at -1.5 dBFS so the MP3 encoder's overshoot does not clip.
  return master(left, right, seconds, { drive: 1.6, fadeIn: 0.8, peak: 0.84 });
};


// ---------------------------------------------------------------------------
// Winter (21/11/2026, China snow video): Am - F - C - G at 100 BPM. A soft
// pad, a music-box melody, sleigh bells on the off-beats and a gentle kick
// from bar 5: cold but bright, different from the upbeat and ambient beds.

const WI_BPM = 100;
const WI_BEAT = 60 / WI_BPM;
const WI_BAR = WI_BEAT * 4;
const WI_PROGRESSION = [
  { root: 45, tones: [57, 60, 64, 69] }, // Am
  { root: 41, tones: [57, 60, 65, 69] }, // F
  { root: 48, tones: [55, 60, 64, 67] }, // C
  { root: 43, tones: [55, 59, 62, 67] }, // G
];
/** Music-box line, eighth notes, one bar per chord (A minor pentatonic + chord tones); null rests. */
const WI_MELODY = [
  [81, null, 84, 88, 86, null, 84, 81],
  [81, null, 77, 81, 84, null, 81, 77],
  [79, null, 84, 88, 91, null, 88, 84],
  [83, null, 79, 83, 86, null, 83, 79],
];
const wiChordIndex = (time) => Math.floor(time / WI_BAR) % WI_PROGRESSION.length;

const synthesiseWinter = (seconds, seed) => {
  const length = Math.floor(seconds * SAMPLE_RATE);
  const left = new Float32Array(length);
  const right = new Float32Array(length);
  const random = makeRandom(seed);

  // --- Pad: detuned sines, low-passed, swelling into each chord.
  const lp = 1 - Math.exp((-2 * Math.PI * 1800) / SAMPLE_RATE);
  let pl = 0, pr = 0;
  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE;
    const chord = WI_PROGRESSION[wiChordIndex(t)];
    const inBar = t % WI_BAR;
    const env = Math.min(1, inBar / 0.6) * Math.min(1, (WI_BAR - inBar) / 0.5);
    let l = 0, r = 0;
    for (const note of chord.tones) {
      const hz = midiToHz(note);
      l += Math.sin(2 * Math.PI * hz * 1.003 * t) + 0.2 * Math.sin(2 * Math.PI * hz * 2.006 * t);
      r += Math.sin(2 * Math.PI * hz * 0.997 * t) + 0.2 * Math.sin(2 * Math.PI * hz * 1.994 * t);
    }
    pl += lp * (l - pl); pr += lp * (r - pr);
    left[i] += pl * env * 0.05; right[i] += pr * env * 0.05;
  }

  // --- Bass: root on beats 1 and 3.
  for (let at = 0; at < seconds; at += WI_BEAT * 2) {
    const hz = midiToHz(WI_PROGRESSION[wiChordIndex(at + 0.001)].root - 12);
    const start = Math.floor(at * SAMPLE_RATE);
    const count = Math.floor(WI_BEAT * 1.8 * SAMPLE_RATE);
    for (let j = 0; j < count && start + j < length; j++) {
      const t = j / SAMPLE_RATE;
      const env = Math.min(1, t / 0.015) * Math.exp(-t * 1.8);
      const smp = (Math.sin(2 * Math.PI * hz * t) + 0.35 * Math.sin(2 * Math.PI * hz * 2 * t)) * env * 0.2;
      left[start + j] += smp; right[start + j] += smp;
    }
  }

  // --- Music box from bar 3: bell partials (1, 2.76, 5.4) with a long ring and a ping-pong echo.
  const boxL = new Float32Array(length);
  const boxR = new Float32Array(length);
  const boxStart = WI_BAR * 2;
  for (let step = 0; boxStart + (step * WI_BEAT) / 2 < seconds; step++) {
    const at = boxStart + (step * WI_BEAT) / 2;
    const note = WI_MELODY[wiChordIndex(at + 0.001)][step % 8];
    if (note === null) continue;
    const hz = midiToHz(note);
    const start = Math.floor(at * SAMPLE_RATE);
    const count = Math.floor(1.4 * SAMPLE_RATE);
    const pan = step % 2 === 0 ? 0.6 : 0.4;
    const vel = step % 8 === 0 ? 1 : 0.75;
    for (let j = 0; j < count && start + j < length; j++) {
      const t = j / SAMPLE_RATE;
      const env = Math.min(1, t / 0.002);
      const smp = (Math.sin(2 * Math.PI * hz * t) * Math.exp(-t * 3.2) +
        0.35 * Math.sin(2 * Math.PI * hz * 2.76 * t) * Math.exp(-t * 7) +
        0.15 * Math.sin(2 * Math.PI * hz * 5.4 * t) * Math.exp(-t * 14)) * env * vel * 0.07;
      boxL[start + j] += smp * (1 - pan) * 2; boxR[start + j] += smp * pan * 2;
    }
  }
  const delay = Math.floor(WI_BEAT * 0.75 * SAMPLE_RATE);
  for (let i = 0; i < length; i++) {
    if (i >= delay) { boxL[i] += boxR[i - delay] * 0.32; boxR[i] += boxL[i - delay] * 0.32; }
    const fade = ramp(i / SAMPLE_RATE, boxStart, boxStart + WI_BAR);
    left[i] += boxL[i] * fade; right[i] += boxR[i] * fade;
  }

  // --- Sleigh bells on off-beat eighths from bar 3, plus a soft kick on 1 and 3 from bar 5.
  for (let at = boxStart + WI_BEAT / 2; at < seconds; at += WI_BEAT) {
    addNoise(left, right, random, at, 0.18, { decay: 26, gain: 0.03, cutoff: 7500, pan: 0.6 });
    const start = Math.floor(at * SAMPLE_RATE);
    for (let j = 0; j < 0.15 * SAMPLE_RATE && start + j < length; j++) {
      const t = j / SAMPLE_RATE;
      const ring = (Math.sin(2 * Math.PI * 5200 * t) + Math.sin(2 * Math.PI * 6900 * t)) * Math.exp(-t * 30) * 0.012;
      left[start + j] += ring * 0.8; right[start + j] += ring;
    }
  }
  const kickFrom = WI_BAR * 4;
  for (let at = kickFrom; at < seconds; at += WI_BEAT * 2) {
    const start = Math.floor(at * SAMPLE_RATE);
    let phase = 0;
    for (let j = 0; j < 0.3 * SAMPLE_RATE && start + j < length; j++) {
      const t = j / SAMPLE_RATE;
      phase += (2 * Math.PI * (46 + 80 * Math.exp(-t * 30))) / SAMPLE_RATE;
      const smp = Math.sin(phase) * Math.exp(-t * 9) * 0.3;
      left[start + j] += smp; right[start + j] += smp;
    }
  }

  return master(left, right, seconds, { drive: 1.5, fadeIn: 1.5, peak: 0.8 });
};

// ---------------------------------------------------------------------------
// Tây Nguyên (22/11/2026, thác Đắk G'Lung video): D minor pentatonic at 96 BPM.
// An open-fifth drone, a low "mother gong" on every bar, three pitched gongs
// playing an interlocking (hocket) ostinato like a cồng chiêng ensemble, a
// skin drum and bamboo rattle, a t'rưng (bamboo xylophone) line and a breathy
// bamboo flute. Bars 25–28 drop to gongs + flute as a breakdown.

const TN_BPM = 96;
const TN_BEAT = 60 / TN_BPM;
const TN_BAR = TN_BEAT * 4;
const TN_SIXTEENTH = TN_BEAT / 4;
/** T'rưng line, 16 sixteenths per bar, 4 bars; D minor pentatonic (D F G A C); null rests. */
const TN_TRUNG = [
  [74, null, 77, 74, 79, null, 77, null, 81, 79, 77, null, 74, null, 72, null],
  [74, null, 77, 79, 81, null, 84, 81, 79, null, 77, null, 79, 77, 74, null],
  [72, null, 74, 77, 79, null, 77, null, 74, 72, 69, null, 72, null, 74, null],
  [77, 79, 81, null, 84, null, 81, 79, 77, null, 74, null, 72, 74, null, null],
];
/** Flute phrases: [bar offset in a 4-bar cycle, beat, midi, beats long]. */
const TN_FLUTE = [
  [0, 0, 81, 3], [0, 3, 79, 1], [1, 0, 77, 2], [1, 2, 74, 2],
  [2, 0, 72, 1.5], [2, 1.5, 74, 1.5], [2, 3, 77, 1], [3, 0, 74, 4],
];
/** Gong hocket: [midi, sixteenth positions in the bar]. */
const TN_GONGS = [
  [50, [0, 6, 10]],
  [57, [2, 8, 14]],
  [60, [4, 12]],
];

/** A struck gong: inharmonic partials with beating pairs, a small downward pitch sag and a long ring. */
const addGong = (left, right, at, hz, { gain, decay, pan, length }) => {
  const partials = [[1, 1, 1], [1.004, 0.5, 1.1], [2.02, 0.32, 1.8], [2.74, 0.22, 2.6], [3.42, 0.12, 3.4], [4.9, 0.06, 5]];
  const start = Math.floor(at * SAMPLE_RATE);
  const count = Math.floor(length * SAMPLE_RATE);
  const phases = partials.map(() => 0);
  for (let j = 0; j < count && start + j < left.length; j++) {
    const t = j / SAMPLE_RATE;
    const sag = 1 + 0.012 * Math.exp(-t * 6);
    let smp = 0;
    partials.forEach(([ratio, amp, dk], k) => {
      phases[k] += (2 * Math.PI * hz * ratio * sag) / SAMPLE_RATE;
      smp += Math.sin(phases[k]) * amp * Math.exp(-t * decay * dk);
    });
    smp *= Math.min(1, t / 0.004) * gain;
    left[start + j] += smp * (1 - pan) * 2;
    right[start + j] += smp * pan * 2;
  }
};

const synthesiseTayNguyen = (seconds, seed) => {
  const length = Math.floor(seconds * SAMPLE_RATE);
  const left = new Float32Array(length);
  const right = new Float32Array(length);
  const random = makeRandom(seed);
  const bars = Math.ceil(seconds / TN_BAR);
  const breakdown = (bar) => bar % 32 >= 24 && bar % 32 < 28;

  // --- Drone: D2 + A2 open fifth with slow breathing, low-passed.
  const lp = 1 - Math.exp((-2 * Math.PI * 900) / SAMPLE_RATE);
  let dl = 0;
  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE;
    const breath = 0.75 + 0.25 * Math.sin(2 * Math.PI * t / (TN_BAR * 2));
    const raw = Math.sin(2 * Math.PI * midiToHz(38) * t) + 0.7 * Math.sin(2 * Math.PI * midiToHz(45) * 1.002 * t) +
      0.25 * Math.sin(2 * Math.PI * midiToHz(50) * 0.998 * t);
    dl += lp * (raw - dl);
    left[i] += dl * breath * 0.045; right[i] += dl * breath * 0.045;
  }

  for (let bar = 0; bar < bars; bar++) {
    const b0 = bar * TN_BAR;
    // --- Mother gong (D2) on every bar, from the very start.
    addGong(left, right, b0, midiToHz(38), { gain: 0.11, decay: 0.9, pan: 0.5, length: TN_BAR * 1.6 });
    // --- Pitched gong hocket from bar 3.
    if (bar >= 2) {
      TN_GONGS.forEach(([note, steps], g) => {
        for (const s of steps) addGong(left, right, b0 + s * TN_SIXTEENTH, midiToHz(note), { gain: 0.055, decay: 2.2, pan: [0.35, 0.65, 0.5][g], length: 1.8 });
      });
    }
    if (breakdown(bar)) continue;
    // --- Skin drum from bar 5: low thump on 1, 2-and, 3; slap on 4. Bamboo rattle on off-beat sixteenths.
    if (bar >= 4) {
      for (const [beat, hz0, gain] of [[0, 70, 0.32], [1.5, 82, 0.2], [2, 70, 0.28], [3, 120, 0.16], [3.5, 110, 0.12]]) {
        const start = Math.floor((b0 + beat * TN_BEAT) * SAMPLE_RATE);
        let phase = 0;
        for (let j = 0; j < 0.35 * SAMPLE_RATE && start + j < length; j++) {
          const t = j / SAMPLE_RATE;
          phase += (2 * Math.PI * (hz0 + 55 * Math.exp(-t * 28))) / SAMPLE_RATE;
          const smp = Math.sin(phase) * Math.exp(-t * 11) * gain;
          left[start + j] += smp; right[start + j] += smp;
        }
        addNoise(left, right, random, b0 + beat * TN_BEAT, 0.05, { decay: 60, gain: gain * 0.25, cutoff: 1800 });
      }
      for (let s = 1; s < 16; s += 2) {
        addNoise(left, right, random, b0 + s * TN_SIXTEENTH, 0.09, { decay: 38, gain: s % 4 === 3 ? 0.035 : 0.02, cutoff: 5200, pan: 0.62 });
      }
    }
    // --- T'rưng from bar 5: woody bars (partials 1 and 3.93), quick decay, a little click.
    if (bar >= 4) {
      const line = TN_TRUNG[bar % 4];
      line.forEach((note, s) => {
        if (note === null) return;
        const hz = midiToHz(note);
        const start = Math.floor((b0 + s * TN_SIXTEENTH) * SAMPLE_RATE);
        const vel = s % 4 === 0 ? 1 : 0.7;
        const pan = 0.3 + 0.4 * ((note - 69) / 15);
        for (let j = 0; j < 0.45 * SAMPLE_RATE && start + j < length; j++) {
          const t = j / SAMPLE_RATE;
          const smp = (Math.sin(2 * Math.PI * hz * t) * Math.exp(-t * 9) +
            0.3 * Math.sin(2 * Math.PI * hz * 3.93 * t) * Math.exp(-t * 30)) * Math.min(1, t / 0.0015) * vel * 0.085;
          left[start + j] += smp * (1 - pan) * 2; right[start + j] += smp * pan * 2;
        }
        addNoise(left, right, random, b0 + s * TN_SIXTEENTH, 0.012, { decay: 300, gain: 0.02 * vel, cutoff: 3000, pan });
      });
    }
  }

  // --- Bamboo flute from bar 9 (and through the breakdown): breathy sine, delayed vibrato, a hint of noise.
  const fluteStart = TN_BAR * 8;
  const breathLp = 1 - Math.exp((-2 * Math.PI * 2500) / SAMPLE_RATE);
  for (let cycle = fluteStart; cycle < seconds; cycle += TN_BAR * 4) {
    for (const [barOff, beat, note, beats] of TN_FLUTE) {
      const at = cycle + barOff * TN_BAR + beat * TN_BEAT;
      const dur = beats * TN_BEAT;
      const hz = midiToHz(note);
      const start = Math.floor(at * SAMPLE_RATE);
      let phase = 0, br = 0;
      for (let j = 0; j < (dur + 0.25) * SAMPLE_RATE && start + j < length; j++) {
        const t = j / SAMPLE_RATE;
        const env = Math.min(1, t / 0.08) * Math.min(1, Math.max(0, (dur + 0.25 - t) / 0.3));
        const vib = 1 + 0.006 * Math.sin(2 * Math.PI * 5.2 * t) * Math.min(1, t / 0.5);
        phase += (2 * Math.PI * hz * vib) / SAMPLE_RATE;
        br += breathLp * (random() - br);
        const smp = (Math.sin(phase) + 0.18 * Math.sin(2 * phase) + br * 0.35) * env * 0.05;
        left[start + j] += smp * 0.9; right[start + j] += smp * 1.1;
      }
    }
  }

  // --- A short room echo so the gongs feel like they are ringing in a valley.
  const echo = Math.floor(0.23 * SAMPLE_RATE);
  for (let i = echo; i < length; i++) { left[i] += right[i - echo] * 0.22; right[i] += left[i - echo] * 0.22; }

  return master(left, right, seconds, { drive: 1.5, fadeIn: 1.2, peak: 0.8 });
};

// --- H'Mông (Tà Xùa, 23/11/2026): a mountain bed for a Tây Bắc cloud-hunting
// video. A khèn (reed mouth organ) holds breathing chord clusters that swell on
// each in/out breath, a đàn môi (jaw harp) twangs a drone with a moving formant,
// a sáo mèo (H'Mông flute) sings an ornamented pentatonic line, soft frame drum
// and horse bells keep a walking pace, and filtered wind sits underneath.
// G pentatonic (G A B D E). Bars 25–28 of every 32 drop to khèn, wind and flute.

const HM_BPM = 84;
const HM_BEAT = 60 / HM_BPM;
const HM_BAR = HM_BEAT * 4;
/** Khèn chord per bar (4-bar cycle), midi notes held for the whole bar. */
const HM_KHEN = [
  [43, 50, 55, 57, 62],
  [45, 52, 57, 59, 64],
  [40, 47, 55, 59, 62],
  [43, 50, 55, 57, 62],
];
/** Flute phrases: [bar offset in a 4-bar cycle, beat, midi, beats long, grace note above?]. */
const HM_FLUTE = [
  [0, 0, 74, 1.5, true], [0, 1.5, 76, 0.5, false], [0, 2, 74, 2, false],
  [1, 0, 71, 1, true], [1, 1, 69, 1, false], [1, 2, 67, 2, false],
  [2, 0, 69, 1, false], [2, 1, 71, 1, true], [2, 2, 74, 1, false], [2, 3, 76, 1, false],
  [3, 0, 79, 1.5, true], [3, 1.5, 76, 0.5, false], [3, 2, 74, 2, false],
];

const synthesiseHmong = (seconds, seed) => {
  const length = Math.floor(seconds * SAMPLE_RATE);
  const left = new Float32Array(length);
  const right = new Float32Array(length);
  const random = makeRandom(seed);
  const bars = Math.ceil(seconds / HM_BAR);
  const breakdown = (bar) => bar % 32 >= 24 && bar % 32 < 28;

  // --- Wind: low-passed noise with a slow swell, the whole way through.
  const wlp = 1 - Math.exp((-2 * Math.PI * 500) / SAMPLE_RATE);
  let wl = 0, wr = 0;
  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE;
    const swell = 0.55 + 0.45 * Math.sin(2 * Math.PI * t / 11 + 1.3);
    wl += wlp * (random() * 2 - 1 - wl); wr += wlp * (random() * 2 - 1 - wr);
    left[i] += wl * swell * 0.05; right[i] += wr * swell * 0.05;
  }

  // --- Khèn: reedy clusters (odd-heavy harmonics), each beat-pair a breath that swells and eases, slight wobble.
  const klp = 1 - Math.exp((-2 * Math.PI * 1600) / SAMPLE_RATE);
  for (let bar = 0; bar < bars; bar++) {
    const chord = HM_KHEN[bar % 4];
    const start = Math.floor(bar * HM_BAR * SAMPLE_RATE);
    const count = Math.floor(HM_BAR * SAMPLE_RATE);
    const ph = chord.map(() => random());
    let fl = 0;
    for (let j = 0; j < count && start + j < length; j++) {
      const t = j / SAMPLE_RATE;
      const breath = Math.sin(Math.PI * ((t / (HM_BEAT * 2)) % 1));
      const env = 0.35 + 0.65 * breath;
      let smp = 0;
      chord.forEach((note, k) => {
        const hz = midiToHz(note) * (1 + 0.0025 * Math.sin(2 * Math.PI * (0.7 + k * 0.13) * t));
        ph[k] += hz / SAMPLE_RATE;
        const p = 2 * Math.PI * ph[k];
        smp += (Math.sin(p) + 0.45 * Math.sin(3 * p) + 0.25 * Math.sin(5 * p) + 0.12 * Math.sin(2 * p)) * (k === 0 ? 1 : 0.6);
      });
      fl += klp * (smp - fl);
      const out = fl * env * 0.022;
      left[start + j] += out * 1.05; right[start + j] += out * 0.95;
    }
  }

  for (let bar = 0; bar < bars; bar++) {
    const b0 = bar * HM_BAR;
    if (breakdown(bar)) continue;
    // --- Đàn môi from bar 3: buzzy G2 pluck on each eighth-ish pattern, formant sweeping like the player's mouth.
    if (bar >= 2) {
      for (const [beat, vel] of [[0, 1], [0.75, 0.6], [1.5, 0.8], [2, 1], [2.75, 0.6], [3.5, 0.8]]) {
        const start = Math.floor((b0 + beat * HM_BEAT) * SAMPLE_RATE);
        const hz = midiToHz(43);
        let bp = 0, bpv = 0, phase = 0;
        for (let j = 0; j < 0.42 * SAMPLE_RATE && start + j < length; j++) {
          const t = j / SAMPLE_RATE;
          phase += hz / SAMPLE_RATE;
          const buzz = saw(phase) + 0.5 * saw(phase * 2.01);
          const fc = 600 + 900 * (0.5 + 0.5 * Math.sin(2 * Math.PI * (2.5 + beat) * t + beat));
          const f = 2 * Math.sin(Math.PI * fc / SAMPLE_RATE);
          bpv += f * (buzz - bp - 0.25 * bpv); bp += f * bpv;
          const smp = bpv * Math.exp(-t * 7) * Math.min(1, t / 0.002) * vel * 0.05;
          left[start + j] += smp * 0.8; right[start + j] += smp * 1.2;
        }
      }
    }
    // --- Frame drum + horse bells from bar 5.
    if (bar >= 4) {
      for (const [beat, gain] of [[0, 0.28], [2, 0.22], [2.5, 0.1]]) {
        const start = Math.floor((b0 + beat * HM_BEAT) * SAMPLE_RATE);
        let phase = 0;
        for (let j = 0; j < 0.3 * SAMPLE_RATE && start + j < length; j++) {
          const t = j / SAMPLE_RATE;
          phase += (2 * Math.PI * (75 + 40 * Math.exp(-t * 30))) / SAMPLE_RATE;
          const smp = Math.sin(phase) * Math.exp(-t * 13) * gain;
          left[start + j] += smp; right[start + j] += smp;
        }
      }
      for (const beat of [1, 3, 3.5]) {
        const start = Math.floor((b0 + beat * HM_BEAT) * SAMPLE_RATE);
        for (let j = 0; j < 0.35 * SAMPLE_RATE && start + j < length; j++) {
          const t = j / SAMPLE_RATE;
          const smp = (Math.sin(2 * Math.PI * 2960 * t) + 0.6 * Math.sin(2 * Math.PI * 4410 * t) + 0.4 * Math.sin(2 * Math.PI * 5230 * t)) * Math.exp(-t * 14) * 0.012;
          left[start + j] += smp * 0.6; right[start + j] += smp * 1.4;
        }
      }
    }
  }

  // --- Sáo mèo from bar 9: breathy, vibrato, a quick grace note above on accented notes.
  const fluteStart = HM_BAR * 8;
  const breathLp = 1 - Math.exp((-2 * Math.PI * 2800) / SAMPLE_RATE);
  for (let cycle = fluteStart; cycle < seconds; cycle += HM_BAR * 4) {
    for (const [barOff, beat, note, beats, grace] of HM_FLUTE) {
      const at = cycle + barOff * HM_BAR + beat * HM_BEAT;
      const dur = beats * HM_BEAT;
      const start = Math.floor(at * SAMPLE_RATE);
      let phase = 0, br = 0;
      for (let j = 0; j < (dur + 0.2) * SAMPLE_RATE && start + j < length; j++) {
        const t = j / SAMPLE_RATE;
        const n = grace && t < 0.07 ? note + 2 : note;
        const env = Math.min(1, t / 0.05) * Math.min(1, Math.max(0, (dur + 0.2 - t) / 0.25));
        const vib = 1 + 0.008 * Math.sin(2 * Math.PI * 5.8 * t) * Math.min(1, t / 0.35);
        phase += (2 * Math.PI * midiToHz(n) * vib) / SAMPLE_RATE;
        br += breathLp * (random() - br);
        const smp = (Math.sin(phase) + 0.12 * Math.sin(2 * phase) + 0.06 * Math.sin(3 * phase) + br * 0.4) * env * 0.045;
        left[start + j] += smp * 1.1; right[start + j] += smp * 0.9;
      }
    }
  }

  // --- A long valley echo.
  const echo = Math.floor(0.31 * SAMPLE_RATE);
  for (let i = echo; i < length; i++) { left[i] += right[i - echo] * 0.25; right[i] += left[i - echo] * 0.25; }

  return master(left, right, seconds, { drive: 1.4, fadeIn: 1.5, peak: 0.8 });
};

const STYLES = {
  upbeat: { synthesise: synthesiseUpbeat, bpm: UP_BPM },
  ambient: { synthesise: synthesiseAmbient, bpm: BPM },
  winter: { synthesise: synthesiseWinter, bpm: WI_BPM },
  taynguyen: { synthesise: synthesiseTayNguyen, bpm: TN_BPM },
  hmong: { synthesise: synthesiseHmong, bpm: HM_BPM },
};

const encodeWav = ({ left, right }) => {
  const frames = left.length;
  const buffer = Buffer.alloc(44 + frames * 4);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + frames * 4, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(2, 22); // stereo
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 4, 28);
  buffer.writeUInt16LE(4, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(frames * 4, 40);
  for (let i = 0; i < frames; i++) {
    const l = Math.max(-1, Math.min(1, left[i]));
    const r = Math.max(-1, Math.min(1, right[i]));
    buffer.writeInt16LE(Math.round(l * 32767), 44 + i * 4);
    buffer.writeInt16LE(Math.round(r * 32767), 46 + i * 4);
  }
  return buffer;
};

const runFfmpeg = (args) =>
  runMedia(["ffmpeg", ...args], { stdio: ["ignore", "ignore", "pipe"] });

const { flags } = parseArgs(process.argv.slice(2));

try {
  const outRelative =
    typeof flags.out === "string" ? flags.out : "shared/music/travel-upbeat";
  const seconds = flags.seconds === undefined ? 120 : Number(flags.seconds);
  const seed = flags.seed === undefined ? 20251026 : Number(flags.seed);
  if (!Number.isFinite(seconds) || seconds < 10 || seconds > 600) {
    fail("--seconds must be between 10 and 600");
  }

  const styleName = typeof flags.style === "string" ? flags.style : "upbeat";
  const style = STYLES[styleName];
  if (!style) {
    fail(
      `--style must be one of ${Object.keys(STYLES).join(", ")}, got "${styleName}"`,
    );
  }

  const outBase = resolveInside(PUBLIC_ROOT, outRelative, "--out");
  mkdirSync(path.dirname(outBase), { recursive: true });

  console.log(
    `Synthesising ${seconds}s ${styleName} at ${style.bpm} BPM (seed ${seed})...`,
  );
  const audio = style.synthesise(seconds, seed);
  const wavPath = `${outBase}.wav`;
  writeFileSync(wavPath, encodeWav(audio));

  const mp3Path = `${outBase}.mp3`;
  const result = runFfmpeg([
    "-y",
    "-i",
    wavPath,
    "-c:a",
    "libmp3lame",
    "-b:a",
    "160k",
    mp3Path,
  ]);
  if (result.status !== 0) {
    fail(
      `ffmpeg could not encode ${mp3Path}; the WAV is at ${wavPath}.\n` +
        (result.stderr ?? "").split("\n").slice(-6).join("\n"),
    );
  }
  rmSync(wavPath);

  console.log(`✓ public/${outRelative}.mp3`);
} catch (error) {
  fail(error.message);
}
