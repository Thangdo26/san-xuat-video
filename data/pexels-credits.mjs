// Writes data/videos/cat-ba/credits-extra.json: Pexels photos (from the downloaded file names, pexels-<user>-<id>.jpg),
// Pexels footage and Flickr photos. Run once after downloading: node data/pexels-credits.mjs
import { readFileSync, readdirSync, writeFileSync } from "node:fs";

const NAMES = {
  "quang-nguyen-vinh": "Quang Nguyen Vinh", "binh-ho-image": "Binh Ho", vietnamhiddenlight: "Vietnam Hidden Light", "ama-journey": "Ama Journey",
  "hussain-badshah": "Hussain Badshah", "d-t-nguy-n": "Đạt Nguyễn", "shourav-chowdhury": "Shourav Chowdhury", alwaysontheroad: "Always on the road",
};
const title = (s) => s.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
const byId = {};
for (const line of readFileSync("research/raw/pexels-files.txt", "utf8").replace(/^﻿/, "").split(/\r?\n/)) {
  const m = line.trim().match(/^pexels-(.+?)-(\d+)\.jpg$/);
  if (!m) continue;
  const user = m[1].replace(/-\d+$/, "");
  byId[m[2]] = NAMES[user] ?? title(user);
}
const out = [];
for (const f of readdirSync("public/videos/cat-ba/pexels")) {
  const id = f.replace(/\.jpg$/, "");
  out.push({ file: `videos/cat-ba/pexels/${f}`, source: `https://www.pexels.com/photo/${id}/`, author: byId[id] ?? "Pexels", license: "Pexels License" });
}
const FOOTAGE = { karst: 37887206, "bay-boats": 37887206, boat: 37887198, "karst-boat": 37887197 };
for (const [f, id] of Object.entries(FOOTAGE)) {
  out.push({ file: `videos/cat-ba/footage/${f}.mp4`, source: `https://www.pexels.com/video/${id}/`, author: "Spanish AV Company.", license: "Pexels License" });
}
for (const line of readFileSync("research/raw/flickr-credits.txt", "utf8").split(/\r?\n/)) {
  const [slot, source, author, license] = line.split("|");
  if (slot) out.push({ file: `videos/cat-ba/flickr/${slot}.jpg`, source, author, license });
}
writeFileSync("data/videos/cat-ba/credits-extra.json", JSON.stringify(out, null, 2) + "\n");
console.log(out.length, "extra credits;", out.filter((c) => c.author === "Pexels").length, "unknown");
