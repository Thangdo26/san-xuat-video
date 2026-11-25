#!/usr/bin/env node
/**
 * node scripts/sfx-pastoral.mjs
 *
 * Synthesises the highland-meadow sound effects for the Đồi Bò video (24/11/2026) into public/shared/sfx/:
 *   cowbell      a hollow cowbell clank (two bells answering), for the title, badges and recap cards
 *   wood-knock   a mallet on a wooden post, for the trail-sign planks of the cost scene
 *   guitar-strum a soft nylon-string strum down a C chord, for the outro and the total
 *   grass-swish  a brush of tall grass, for the map-fold and contour picture changes
 *   whistle-call a short shepherd's whistle (rise, then a fall), for the "ĐÃ LEO ✓" stamp and the CTA
 *   stone-tap    a stone set down on another, for the cairn of the outro
 *   alti-tick    a soft digital tick, for the altimeter counting up
 * All self-made, so there is nothing to clear for copyright.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PUBLIC_ROOT } from "./lib/paths.mjs";

const SR = 44100;
const midiToHz = (n) => 440 * Math.pow(2, (n - 69) / 12);
let seed = 17;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648) * 2 - 1;

const cowbell = (buf, at, base, gain) => {
  const start = Math.floor(at * SR);
  for (let j = 0; j < 0.9 * SR && start + j < buf.length; j++) {
    const t = j / SR;
    const s = Math.sin(2 * Math.PI * base * t) + 0.8 * Math.sin(2 * Math.PI * base * 1.48 * t) + 0.5 * Math.sin(2 * Math.PI * base * 2.37 * t)
      + 0.25 * Math.sin(2 * Math.PI * base * 3.9 * t);
    buf[start + j] += s * Math.exp(-t * 6.5) * gain * Math.min(1, t / 0.002);
  }
};
const knock = (buf, at, hz, gain) => {
  const start = Math.floor(at * SR);
  let phase = 0, lp = 0;
  for (let j = 0; j < 0.25 * SR && start + j < buf.length; j++) {
    const t = j / SR;
    phase += (2 * Math.PI * hz * (1 + 0.3 * Math.exp(-t * 60))) / SR;
    lp += 0.2 * (rnd() - lp);
    buf[start + j] += (Math.sin(phase) * Math.exp(-t * 30) + lp * Math.exp(-t * 80) * 0.8) * gain;
  }
};
const pluck = (buf, at, hz, gain) => {
  const start = Math.floor(at * SR);
  const period = Math.max(2, Math.round(SR / hz));
  const ring = new Float32Array(period).map(() => rnd());
  for (let pass = 0; pass < 2; pass++) for (let i = 0; i < period; i++) ring[i] = (ring[(i + period - 1) % period] + ring[i] + ring[(i + 1) % period]) / 3;
  let idx = 0;
  for (let j = 0; start + j < buf.length; j++) {
    const next = (idx + 1) % period;
    const v = ring[idx];
    ring[idx] = 0.997 * 0.5 * (v + ring[next]);
    idx = next;
    buf[start + j] += v * gain;
  }
};
const swish = (buf) => {
  let lp = 0, hp = 0, prev = 0;
  for (let j = 0; j < buf.length; j++) {
    const t = j / SR;
    const n = rnd();
    hp = 0.9 * (hp + n - prev); prev = n;
    lp += 0.35 * (hp - lp);
    const env = Math.sin(Math.PI * Math.min(1, t / (buf.length / SR))) ** 2;
    buf[j] += lp * env * (0.7 + 0.3 * Math.sin(2 * Math.PI * 23 * t));
  }
};
const whistle = (buf, notes) => {
  let at = 0, phase = 0;
  for (const [from, to, d] of notes) {
    const start = Math.floor(at * SR);
    for (let j = 0; j < d * SR && start + j < buf.length; j++) {
      const t = j / SR;
      const n = from + (to - from) * Math.min(1, t / (d * 0.6));
      const env = Math.min(1, t / 0.03) * Math.min(1, (d - t) / 0.08);
      phase += (midiToHz(n) * (1 + 0.006 * Math.sin(2 * Math.PI * 6 * t))) / SR;
      buf[start + j] += (Math.sin(2 * Math.PI * phase) + rnd() * 0.04) * env;
    }
    at += d;
  }
};

const SOUNDS = {
  cowbell: [1.1, (b) => { cowbell(b, 0, 540, 0.9); cowbell(b, 0.16, 720, 0.55); }],
  "wood-knock": [0.4, (b) => { knock(b, 0, 210, 1); knock(b, 0.07, 260, 0.45); }],
  "guitar-strum": [2.2, (b) => [48, 52, 55, 60, 64, 67].forEach((n, k) => pluck(b, k * 0.028, midiToHz(n), 0.5))],
  "grass-swish": [0.7, (b) => swish(b)],
  "whistle-call": [1.0, (b) => whistle(b, [[79, 86, 0.35], [86, 81, 0.55]])],
  "stone-tap": [0.35, (b) => { knock(b, 0, 640, 0.9); knock(b, 0.05, 900, 0.35); }],
  "alti-tick": [0.08, (b) => { for (let j = 0; j < b.length; j++) b[j] += Math.sin(2 * Math.PI * 2400 * j / SR) * Math.exp(-j / SR * 90); }],
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
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", wav, "-af", `afade=t=out:st=${Math.max(0, secs - Math.min(0.3, secs / 3))}:d=${Math.min(0.3, secs / 3)}`, "-b:a", "160k", path.join(dir, `${name}.mp3`)]);
  rmSync(wav);
  console.log("✓", `shared/sfx/${name}.mp3`);
}
