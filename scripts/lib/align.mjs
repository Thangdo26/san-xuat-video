import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { runMedia } from "./media.mjs";

/**
 * Word timings for a clip whose provider returns none (e.g. Vbee), so
 * subtitles still highlight word by word and food photos still switch on cue.
 *
 * Vietnamese is syllable-timed and every written word is one syllable, so
 * within a phrase the words come at a near-even pace. The phrases are found
 * from the audio: the pause the voice takes at each comma or full stop is the
 * longest silence near where that punctuation should fall. Words inside a
 * phrase are then spread over it by length. Good to a word or two - enough for
 * a highlight and a photo cut, not for karaoke.
 */

const SAMPLE_RATE = 16000;
const FRAME_MS = 10;
/** Shortest silence counted as a pause at punctuation. */
const MIN_PAUSE_MS = 120;
/** How far from its expected time a punctuation pause may be found. */
const SEARCH_WINDOW = 0.15;

const ENDS_CLAUSE = /[,.?!;:…]$/;

const lettersOnly = (text) =>
  text.normalize("NFC").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

/** A longer syllable ("nghiêng") takes a little longer to say than "à". */
const weight = (token) => 1 + 0.08 * lettersOnly(token).length;

/** Mono 16 kHz PCM samples of any file ffmpeg can read. */
const decode = (file) => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "align-"));
  const wav = path.join(dir, "clip.wav");
  try {
    const result = runMedia(
      ["ffmpeg", "-y", "-i", file, "-ac", "1", "-ar", String(SAMPLE_RATE), "-c:a", "pcm_s16le", wav],
      { stdio: ["ignore", "ignore", "pipe"] },
    );
    if (result.status !== 0) {
      throw new Error(`ffmpeg could not decode ${file}:\n${(result.stderr ?? "").slice(-400)}`);
    }
    const buffer = readFileSync(wav);
    // Walk the RIFF chunks to the "data" one; ffmpeg may add a LIST chunk first.
    let offset = 12;
    while (offset + 8 <= buffer.length) {
      const id = buffer.toString("ascii", offset, offset + 4);
      const size = buffer.readUInt32LE(offset + 4);
      if (id === "data") {
        const end = Math.min(buffer.length, offset + 8 + size);
        const samples = new Float32Array(Math.floor((end - offset - 8) / 2));
        for (let i = 0; i < samples.length; i++) {
          samples[i] = buffer.readInt16LE(offset + 8 + i * 2) / 32768;
        }
        return samples;
      }
      offset += 8 + size + (size % 2);
    }
    throw new Error(`no audio data in ${file}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

/** Speech span and the pauses inside it, in milliseconds. */
const findSpeech = (samples) => {
  const frame = (SAMPLE_RATE * FRAME_MS) / 1000;
  const energy = [];
  for (let start = 0; start + frame <= samples.length; start += frame) {
    let sum = 0;
    for (let i = start; i < start + frame; i++) sum += samples[i] * samples[i];
    energy.push(Math.sqrt(sum / frame));
  }
  const sorted = [...energy].sort((a, b) => a - b);
  const loud = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
  const threshold = Math.max(loud * 0.08, 1e-4);
  const voiced = energy.map((value) => value > threshold);

  const first = voiced.indexOf(true);
  const last = voiced.lastIndexOf(true);
  if (first === -1) {
    return { startMs: 0, endMs: energy.length * FRAME_MS, pauses: [] };
  }

  const pauses = [];
  let run = null;
  for (let i = first; i <= last; i++) {
    if (!voiced[i]) {
      run ??= i;
    } else if (run !== null) {
      if ((i - run) * FRAME_MS >= MIN_PAUSE_MS) {
        pauses.push({ fromMs: run * FRAME_MS, toMs: i * FRAME_MS });
      }
      run = null;
    }
  }
  return { startMs: first * FRAME_MS, endMs: (last + 1) * FRAME_MS, pauses };
};

/** Captions in the shape scripts/voice.mjs writes for Edge. */
export const estimateWordTimings = (file, narration) => {
  const tokens = narration.trim().split(/\s+/);
  const { startMs, endMs, pauses } = findSpeech(decode(file));
  const span = endMs - startMs;

  const weights = tokens.map(weight);
  const total = weights.reduce((sum, w) => sum + w, 0);

  // Snap each clause end to the nearest unused pause around its expected time.
  const cuts = [];
  let cumulative = 0;
  let after = startMs;
  tokens.forEach((token, index) => {
    cumulative += weights[index];
    if (index === tokens.length - 1 || !ENDS_CLAUSE.test(token)) return;
    const expected = startMs + (cumulative / total) * span;
    const window = Math.max(400, SEARCH_WINDOW * span);
    let best = null;
    for (const pause of pauses) {
      const mid = (pause.fromMs + pause.toMs) / 2;
      if (pause.fromMs < after || Math.abs(mid - expected) > window) continue;
      if (!best || Math.abs(mid - expected) < Math.abs((best.fromMs + best.toMs) / 2 - expected)) {
        best = pause;
      }
    }
    if (best) {
      cuts.push({ index, pause: best });
      after = best.toMs;
    }
  });

  // Spread the words of each stretch between cuts over that stretch.
  const words = [];
  let segmentStart = startMs;
  let firstToken = 0;
  for (const segment of [...cuts, { index: tokens.length - 1, pause: { fromMs: endMs, toMs: endMs } }]) {
    const segmentEnd = segment.pause.fromMs;
    const lastToken = segment.index;
    const segmentWeight = weights.slice(firstToken, lastToken + 1).reduce((sum, w) => sum + w, 0);
    let elapsed = 0;
    for (let i = firstToken; i <= lastToken; i++) {
      const wordStart = segmentStart + (elapsed / segmentWeight) * (segmentEnd - segmentStart);
      elapsed += weights[i];
      const wordEnd = segmentStart + (elapsed / segmentWeight) * (segmentEnd - segmentStart);
      const start = Math.round(wordStart);
      const end = Math.round(wordEnd);
      words.push({
        text: (i === 0 ? "" : " ") + tokens[i],
        startMs: start,
        endMs: end,
        timestampMs: Math.round((start + end) / 2),
        confidence: null,
      });
    }
    segmentStart = segment.pause.toMs;
    firstToken = lastToken + 1;
  }
  return { words, phrases: cuts.length + 1, clauses: tokens.filter((t, i) => i < tokens.length - 1 && ENDS_CLAUSE.test(t)).length + 1 };
};
