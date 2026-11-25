#!/usr/bin/env node
/**
 * node scripts/sfx-hmong.mjs
 *
 * Synthesises the Tây Bắc / H'Mông sound effects for the Tà Xùa video (23/11/2026) into public/shared/sfx/:
 *   khen-swell   a khèn (reed mouth organ) chord breathing in and out, for the title and the outro
 *   jaw-twang    one đàn môi (jaw harp) twang with its vowel-like formant sweep
 *   horse-bell   a small horse bell, for photo cards and cost lines
 *   wind-gust    a gust of mountain wind, for the cloud wipes
 *   alarm-ring   a little alarm-clock trill (the 5 a.m. cloud-hunting alarm)
 *   flute-call   a short sáo mèo call with a grace note
 * All self-made, so there is nothing to clear for copyright.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PUBLIC_ROOT } from "./lib/paths.mjs";

const SR = 44100;
const midiToHz = (n) => 440 * Math.pow(2, (n - 69) / 12);
let seed = 11;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648) * 2 - 1;
const saw = (p) => 2 * (p - Math.floor(p + 0.5));

const khen = (buf, notes, secs) => {
  const ph = notes.map(() => 0);
  let lp = 0;
  const a = 1 - Math.exp((-2 * Math.PI * 1800) / SR);
  for (let j = 0; j < secs * SR && j < buf.length; j++) {
    const t = j / SR;
    const env = Math.sin(Math.PI * Math.min(1, t / secs)) ** 0.8;
    let s = 0;
    notes.forEach((n, k) => {
      ph[k] += (midiToHz(n) * (1 + 0.003 * Math.sin(2 * Math.PI * 0.9 * t + k))) / SR;
      const p = 2 * Math.PI * ph[k];
      s += Math.sin(p) + 0.45 * Math.sin(3 * p) + 0.25 * Math.sin(5 * p);
    });
    lp += a * (s - lp);
    buf[j] += lp * env;
  }
};
const twang = (buf, at, hz) => {
  const start = Math.floor(at * SR);
  let bp = 0, bpv = 0, phase = 0;
  for (let j = 0; j < 0.6 * SR && start + j < buf.length; j++) {
    const t = j / SR;
    phase += hz / SR;
    const buzz = saw(phase) + 0.5 * saw(phase * 2.01);
    const fc = 500 + 1400 * Math.exp(-t * 4) + 300 * Math.sin(2 * Math.PI * 3 * t);
    const f = 2 * Math.sin((Math.PI * fc) / SR);
    bpv += f * (buzz - bp - 0.22 * bpv); bp += f * bpv;
    buf[start + j] += bpv * Math.exp(-t * 5) * Math.min(1, t / 0.002);
  }
};
const bell = (buf, at, base, gain) => {
  const start = Math.floor(at * SR);
  for (let j = 0; j < 0.8 * SR && start + j < buf.length; j++) {
    const t = j / SR;
    const s = Math.sin(2 * Math.PI * base * t) + 0.6 * Math.sin(2 * Math.PI * base * 1.49 * t) + 0.4 * Math.sin(2 * Math.PI * base * 1.77 * t);
    buf[start + j] += s * Math.exp(-t * 7) * gain * Math.min(1, t / 0.001);
  }
};
const gust = (buf) => {
  let lp = 0;
  for (let j = 0; j < buf.length; j++) {
    const t = j / SR;
    const fc = 300 + 1500 * Math.sin(Math.PI * (t / 1.6));
    const a = 1 - Math.exp((-2 * Math.PI * fc) / SR);
    lp += a * (rnd() - lp);
    buf[j] += lp * Math.sin(Math.PI * Math.min(1, t / 1.6)) ** 1.5;
  }
};
const flute = (buf, notes) => {
  let at = 0;
  let br = 0;
  for (const [n, d, grace] of notes) {
    const start = Math.floor(at * SR);
    let phase = 0;
    for (let j = 0; j < (d + 0.15) * SR && start + j < buf.length; j++) {
      const t = j / SR;
      const note = grace && t < 0.06 ? n + 2 : n;
      const env = Math.min(1, t / 0.04) * Math.min(1, Math.max(0, (d + 0.15 - t) / 0.2));
      phase += (midiToHz(note) * (1 + 0.008 * Math.sin(2 * Math.PI * 5.8 * t))) / SR;
      br += 0.3 * (rnd() - br);
      buf[start + j] += (Math.sin(2 * Math.PI * phase) + 0.12 * Math.sin(4 * Math.PI * phase) + br * 0.35) * env;
    }
    at += d;
  }
};

const SOUNDS = {
  "khen-swell": [2.4, (b) => khen(b, [55, 62, 67, 69, 74], 2.4)],
  "jaw-twang": [0.7, (b) => twang(b, 0, midiToHz(43))],
  "horse-bell": [0.9, (b) => { bell(b, 0, 2960, 0.8); bell(b, 0.09, 3320, 0.5); }],
  "wind-gust": [1.7, (b) => gust(b)],
  "alarm-ring": [1.3, (b) => { for (let k = 0; k < 14; k++) bell(b, k * 0.075, k % 2 ? 2600 : 2350, 0.5); }],
  "flute-call": [1.6, (b) => flute(b, [[74, 0.45, true], [76, 0.2, false], [79, 0.8, true]])],
};

const dir = path.join(PUBLIC_ROOT, "shared", "sfx");
mkdirSync(dir, { recursive: true });
for (const [name, [secs, make]] of Object.entries(SOUNDS)) {
  const buf = new Float32Array(Math.floor(secs * SR));
  make(buf);
  let peak = 0;
  for (const v of buf) peak = Math.max(peak, Math.abs(v));
  const pcm = Buffer.alloc(44 + buf.length * 2);
  pcm.write("RIFF", 0); pcm.writeUInt32LE(36 + buf.length * 2, 4); pcm.write("WAVE", 8); pcm.write("fmt ", 12);
  pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(1, 22); pcm.writeUInt32LE(SR, 24); pcm.writeUInt32LE(SR * 2, 28);
  pcm.writeUInt16LE(2, 32); pcm.writeUInt16LE(16, 34); pcm.write("data", 36); pcm.writeUInt32LE(buf.length * 2, 40);
  buf.forEach((v, i) => pcm.writeInt16LE(Math.round((v / peak) * 0.89 * 32767), 44 + i * 2));
  const wav = path.join(dir, `${name}.wav`);
  writeFileSync(wav, pcm);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", wav, "-af", `afade=t=out:st=${Math.max(0, secs - 0.3)}:d=0.3`, "-b:a", "160k", path.join(dir, `${name}.mp3`)]);
  rmSync(wav);
  console.log("✓", `shared/sfx/${name}.mp3`);
}
