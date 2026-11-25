// Placeholder voiceover.json (even word timing, ~4.2 words/s) so the build can be previewed before the real voice exists.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
for (const slug of process.argv.slice(2)) {
  const dir = `data/videos/${slug}`;
  
  const v = JSON.parse(readFileSync(`${dir}/video.json`, "utf8"));
  const clips = {};
  for (const s of v.scenes) {
    const ws = s.narration.split(/\s+/);
    const step = 240;
    clips[s.id] = { file: "shared/sfx/pop.mp3", durationSec: ws.length * step / 1000, words: ws.map((t, k) => ({ text: t, startMs: k * step, endMs: k * step + 200 })) };
    s.durationSec = Math.max(s.durationSec, Math.ceil(ws.length * step / 1000 + 1.5));
  }
  writeFileSync(`${dir}/voiceover.json`, JSON.stringify({ placeholder: true, clips }, null, 2));
  writeFileSync(`${dir}/video.json`, JSON.stringify(v, null, 2) + "\n");
  console.log(slug, "placeholder voice");
}
