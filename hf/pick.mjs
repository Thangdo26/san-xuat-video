// node hf/pick.mjs picks.txt: copies chosen candidates into images/ under their final slot
// ("target|candidate" per line) and records each one's credit under the new file path.
import { copyFileSync, readFileSync, writeFileSync } from "node:fs";

const credPath = "data/videos/hue/credits.json";
const credits = JSON.parse(readFileSync(credPath, "utf8"));
for (const line of readFileSync(process.argv[2], "utf8").split("\n").filter((l) => l.includes("|"))) {
  const [target, cand] = line.trim().split("|");
  const src = credits.find((c) => c.file === `videos/hue/candidates/${cand}.jpg`);
  if (!src) throw new Error(`no credit for candidate ${cand}`);
  copyFileSync(`public/videos/hue/candidates/${cand}.jpg`, `public/videos/hue/images/${target}.jpg`);
  const file = `videos/hue/images/${target}.jpg`;
  const i = credits.findIndex((c) => c.file === file);
  const entry = { ...src, slot: target, file };
  if (i >= 0) credits[i] = entry; else credits.push(entry);
  console.log(target, "<-", cand, "|", src.author, src.license);
}
writeFileSync(credPath, JSON.stringify(credits, null, 2) + "\n");
