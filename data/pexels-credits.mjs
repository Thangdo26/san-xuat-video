// Writes data/videos/ha-giang/credits-pexels.json from the downloaded Pexels file names (pexels-<user>-<id>.jpg).
// Run once after downloading: node data/pexels-credits.mjs
import { readFileSync, readdirSync, writeFileSync } from "node:fs";

const NAMES = {
  qhung999: "Q. Hưng Phạm", duongngth: "Duong Nguyen", dutumong: "Du Tử Mộng", "maxed-raw": "maxed. RAW",
  vietnamhiddenlight: "Vietnam Hidden Light", macnalodao: "Đức Trung Đào", henry: "Henry", fox: "FOX",
  didsss: "Diana", qjpioneer: "Kai-Chieh Chan", anhleephoto: "Anh Lee", dauphotographer: "Đậu Photograph", andromeda99: "Jeffry Surianto",
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
for (const dir of ["pexels", "food"]) {
  for (const f of readdirSync(`public/videos/ha-giang/${dir}`)) {
    const id = f.replace(/\.jpg$/, "");
    out.push({ file: `videos/ha-giang/${dir}/${f}`, source: `https://www.pexels.com/photo/${id}/`, author: byId[id] ?? "Pexels", license: "Pexels License" });
  }
}
writeFileSync("data/videos/ha-giang/credits-pexels.json", JSON.stringify(out, null, 2) + "\n");
console.log(out.length, "pexels credits;", out.filter((c) => c.author === "Pexels").length, "unknown");
