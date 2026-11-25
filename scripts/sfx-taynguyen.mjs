#!/usr/bin/env node
/**
 * node scripts/sfx-taynguyen.mjs
 *
 * Synthesises the Tây Nguyên sound effects for the thác 72 video (22/11/2026) into public/shared/sfx/:
 *   gong-hit     a bossed gong struck once (inharmonic partials, beating, long ring)
 *   gong-low     the big "mother gong", lower and longer, for the title and the outro
 *   trung-pluck  one t'rưng (bamboo xylophone) note, woody and short
 *   trung-run    a quick run of five t'rưng notes up the pentatonic scale
 *   drum-hit     a skin drum thump with a slap on top
 * All self-made, so there is nothing to clear for copyright.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PUBLIC_ROOT } from "./lib/paths.mjs";

const SR = 44100;
const midiToHz = (n) => 440 * Math.pow(2, (n - 69) / 12);
let seed = 7;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648) * 2 - 1;

const gong = (buf, at, hz, gain, decay) => {
  const partials = [[1, 1, 1], [1.004, 0.55, 1.1], [2.02, 0.35, 1.8], [2.74, 0.24, 2.6], [3.42, 0.14, 3.4], [4.9, 0.07, 5]];
  const start = Math.floor(at * SR);
  const ph = partials.map(() => 0);
  for (let j = 0; start + j < buf.length; j++) {
    const t = j / SR;
    const sag = 1 + 0.012 * Math.exp(-t * 6);
    let s = 0;
    partials.forEach(([r, a, d], k) => { ph[k] += (2 * Math.PI * hz * r * sag) / SR; s += Math.sin(ph[k]) * a * Math.exp(-t * decay * d); });
    buf[start + j] += s * Math.min(1, t / 0.003) * gain + (j < 300 ? rnd() * 0.15 * gain * (1 - j / 300) : 0);
  }
};
const trung = (buf, at, hz, gain) => {
  const start = Math.floor(at * SR);
  for (let j = 0; j < 0.5 * SR && start + j < buf.length; j++) {
    const t = j / SR;
    buf[start + j] += (Math.sin(2 * Math.PI * hz * t) * Math.exp(-t * 9) + 0.32 * Math.sin(2 * Math.PI * hz * 3.93 * t) * Math.exp(-t * 30)) * Math.min(1, t / 0.0015) * gain
      + (j < 200 ? rnd() * 0.25 * gain * (1 - j / 200) : 0);
  }
};
const drum = (buf, at, gain) => {
  const start = Math.floor(at * SR);
  let ph = 0;
  for (let j = 0; j < 0.5 * SR && start + j < buf.length; j++) {
    const t = j / SR;
    ph += (2 * Math.PI * (68 + 70 * Math.exp(-t * 26))) / SR;
    buf[start + j] += Math.sin(ph) * Math.exp(-t * 9) * gain + (j < 900 ? rnd() * 0.35 * gain * Math.exp(-j / 250) : 0);
  }
};

const SOUNDS = {
  "gong-hit": [2.6, (b) => gong(b, 0, midiToHz(57), 0.8, 1.4)],
  "gong-low": [4.5, (b) => gong(b, 0, midiToHz(38), 0.9, 0.7)],
  "trung-pluck": [0.6, (b) => trung(b, 0, midiToHz(77), 0.8)],
  "trung-run": [1.0, (b) => [69, 72, 74, 77, 81].forEach((n, k) => trung(b, k * 0.075, midiToHz(n), 0.6 + k * 0.05))],
  "drum-hit": [0.6, (b) => drum(b, 0, 0.9)],
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
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", wav, "-af", `afade=t=out:st=${Math.max(0, secs - 0.4)}:d=0.4`, "-b:a", "160k", path.join(dir, `${name}.mp3`)]);
  rmSync(wav);
  console.log("✓", `shared/sfx/${name}.mp3`);
}
