#!/usr/bin/env node
/**
 * npm run video:music -- --out shared/music/travel-ambient --seconds 96
 *
 * Synthesises a calm travel background track from scratch, so the video has
 * music with no licence to clear. Output is deterministic for a given seed:
 * re-running produces the same file.
 *
 * The arrangement is a four-chord loop (Fmaj7 - G - Em7 - Am7, 92 BPM) that
 * layers in over the first bars: pad and bass, then a plucked arpeggio, then
 * soft kick and shaker. It is mixed quietly on purpose; it sits under voice.
 *
 * Writes <out>.wav, then encodes <out>.mp3 with Remotion's bundled ffmpeg
 * (it ships libmp3lame but not the ipod muxer that .m4a needs).
 * The length does not need to match the video: the composition loops it and
 * fades it out at the end.
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fail, parseArgs } from "./lib/args.mjs";
import { runRemotion } from "./lib/media.mjs";
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

const synthesise = (seconds, seed) => {
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
  let peak = 0;
  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE;
    const fade = ramp(t, 0, 2.5) * ramp(seconds - t, 0, 4);
    left[i] = Math.tanh(left[i] * 1.4) * fade;
    right[i] = Math.tanh(right[i] * 1.4) * fade;
    peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
  }
  const gain = peak > 0 ? 0.708 / peak : 1;
  for (let i = 0; i < length; i++) {
    left[i] *= gain;
    right[i] *= gain;
  }

  return { left, right };
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
  runRemotion(["ffmpeg", ...args], { stdio: ["ignore", "ignore", "pipe"] });

const { flags } = parseArgs(process.argv.slice(2));

try {
  const outRelative =
    typeof flags.out === "string" ? flags.out : "shared/music/travel-ambient";
  const seconds = flags.seconds === undefined ? 96 : Number(flags.seconds);
  const seed = flags.seed === undefined ? 20251026 : Number(flags.seed);
  if (!Number.isFinite(seconds) || seconds < 10 || seconds > 600) {
    fail("--seconds must be between 10 and 600");
  }

  const outBase = resolveInside(PUBLIC_ROOT, outRelative, "--out");
  mkdirSync(path.dirname(outBase), { recursive: true });

  console.log(`Synthesising ${seconds}s at ${BPM} BPM (seed ${seed})...`);
  const audio = synthesise(seconds, seed);
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
