#!/usr/bin/env node
/**
 * node hf/build-td.mjs --slug tam-dao-2n1d [--cover]
 *
 * Turns data/videos/<slug>/video.json + voiceover.json into a HyperFrames project at
 * build/<slug>/. The look ("Tam Đảo · phố núi trong sương"), new for this destination:
 *   - travel intro: a topographic paper map that draws the road Hà Nội → Vĩnh Yên →
 *     the 13 km pass → Tam Đảo, a marker driving along it (replaces Huế's satellite dive);
 *   - mist drifting over every scene; pine-green glass cards instead of paper;
 *   - each stop gets a wooden trail sign (day or dish number) that swings in on its nail;
 *   - a "Nên ở đâu?" scene with one card per area at the narration cues;
 *   - travel outro: a postcard "Gửi từ Tam Đảo" with a stamp and a postmark;
 *   - food intro: a top-down table, the dishes sliding in as plates;
 *   - food outro: polaroids of the dishes dropping into a pile;
 *   - shader seams: cross-warp, white mist flash, gravitational lens, cinematic zoom;
 *   - quiet whooshes on the seams (≈0.15), karaoke subtitles at top 1500, rail below them.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fail, parseArgs, requireSlug } from "../scripts/lib/args.mjs";
import { probeDurationSec } from "../scripts/lib/media.mjs";
import { PROJECT_ROOT, PUBLIC_ROOT } from "../scripts/lib/paths.mjs";

const { flags } = parseArgs(process.argv.slice(2));
const slug = requireSlug(flags, "build-td");
const dataDir = path.join(PROJECT_ROOT, "data", "videos", slug);
const video = JSON.parse(readFileSync(path.join(dataDir, "video.json"), "utf8"));
const voicePath = path.join(dataDir, "voiceover.json");
if (!existsSync(voicePath)) fail(`No voiceover.json for ${slug}; make the voice first.`);
const voice = JSON.parse(readFileSync(voicePath, "utf8")).clips;

const W = 1080;
const H = 1920;
const LEAD = video.transitionFrames / video.format.fps;
const SEAM = 0.75;
const CLEAR = 3; // seconds a photo shows uncovered before the first card
const vi = video.language === "vi";
const isFood = video.template === "food";

const cover = Boolean(flags.cover);
const out = path.join(PROJECT_ROOT, "build", cover ? `${slug}-cover` : slug);
rmSync(path.join(out, "assets"), { recursive: true, force: true });
mkdirSync(path.join(out, "assets"), { recursive: true });

const assets = new Map();
const asset = (rel) => {
  if (!assets.has(rel)) {
    const name = rel.replace(/^videos\//, "").replace(/[\\/]/g, "_");
    copyFileSync(path.join(PUBLIC_ROOT, rel), path.join(out, "assets", name));
    assets.set(rel, `assets/${name}`);
  }
  return assets.get(rel);
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const words = (s) => esc(s).split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");
const r2 = (n) => Math.round(n * 1000) / 1000;
const norm = (s) => s.toLowerCase().normalize("NFC").replace(/[.,!?;:…"“”()]/g, "").trim();
const star = (r) => (r == null ? (vi ? "gợi ý" : "tip") : `★${r.toFixed(1)}`);

// ---- timing -------------------------------------------------------------
let t = 0;
const scenes = video.scenes.map((s, i) => {
  const start = t;
  t += s.durationSec;
  return { ...s, i, start, end: t, clip: voice[s.id] };
});
const total = r2(t);
const stops = scenes.filter((s) => s.layout === "point");

const cueTime = (s, phrase) => {
  if (!phrase || !s.clip?.words?.length) return null;
  const target = norm(phrase).split(/\s+/);
  const ws = s.clip.words.map((w) => norm(w.text));
  for (let i = 0; i <= ws.length - target.length; i++) {
    if (target.every((tw, k) => ws[i + k] === tw || ws[i + k]?.startsWith(tw))) return s.start + LEAD + s.clip.words[i].startMs / 1000;
  }
  return null;
};

const html = [];
const js = [];
const tw = (code) => js.push(code);
const sfx = [];
const sfxTracks = [];
const sound = (name, at, volume) => {
  const file = path.join(PUBLIC_ROOT, "shared", "sfx", `${name}.mp3`);
  const dur = r2(probeDurationSec(file));
  if (at < 0 || at + 0.05 > total) return;
  let track = sfxTracks.findIndex((end) => end <= at);
  if (track < 0) track = sfxTracks.push(0) - 1;
  sfxTracks[track] = at + dur;
  sfx.push(`<audio id="sfx-${sfx.length}" src="${asset(`shared/sfx/${name}.mp3`)}" data-start="${r2(at)}" data-duration="${r2(Math.min(dur, total - at))}" data-volume="${volume}" data-track-index="${4 + track}"></audio>`);
};

const MOVES = [
  { from: "scale:1.16,x:0,y:0", to: "scale:1.03,x:0,y:0" },
  { from: "scale:1.1,x:-60,y:0", to: "scale:1.1,x:60,y:0" },
  { from: "scale:1.03,x:0,y:40", to: "scale:1.16,x:0,y:-40" },
  { from: "scale:1.1,x:60,y:0", to: "scale:1.1,x:-60,y:0" },
];

/** Photo stack; photos swap through a short mist dissolve (blur + white bloom). */
const photos = (s, from, to, idPrefix) => {
  const g = s.gallery ?? [];
  const seg = (to - from) / g.length;
  return g
    .map((src, k) => {
      const id = `${idPrefix}-p${k}`;
      const a = r2(from + seg * k);
      const mv = MOVES[(s.i + k) % MOVES.length];
      tw(`tl.fromTo("#${id} img", {${mv.from}}, {${mv.to}, duration:${r2(seg + 0.8)}, ease:"none"}, ${a});`);
      if (k > 0) {
        tw(`tl.fromTo("#${id}", {opacity:0, filter:"blur(14px) brightness(1.5)"}, {opacity:1, filter:"blur(0px) brightness(1)", duration:0.45, ease:"power2.out"}, ${a});`);
        tw(`tl.to("#${idPrefix}-p${k - 1}", {opacity:0, duration:0.01}, ${r2(a + 0.45)});`);
      }
      return `<div id="${id}" class="ph"${k > 0 ? ' style="opacity:0"' : ""}><img src="${asset(src)}" alt="" /></div>`;
    })
    .join("");
};

const titleIn = (sel, at) =>
  tw(`tl.fromTo("${sel} .w", {opacity:0, y:30, filter:"blur(8px)"}, {opacity:1, y:0, filter:"blur(0px)", duration:0.5, stagger:0.08, ease:"power3.out"}, ${r2(at)});`);
const fadeUp = (sel, at, dur = 0.35) =>
  tw(`tl.fromTo("${sel}", {opacity:0, y:26}, {opacity:1, y:0, duration:${dur}, ease:"expo.out"}, ${r2(at)});`);

/** Wooden trail sign hanging from a nail; swings in and settles. */
const sign = (sid, big, small, at) => {
  tw(`tl.fromTo("#${sid}-sign", {opacity:0, rotation:-38, y:-80}, {opacity:1, rotation:0, y:0, duration:1.3, ease:"elastic.out(1, 0.45)"}, ${r2(at)});`);
  return `<div id="${sid}-sign" class="sign" style="opacity:0"><i class="nail"></i><div class="board"><b>${esc(big)}</b><small>${esc(small)}</small></div></div>`;
};

const row = (p, accent) => `<div class="row"><b>${esc(p.place)}</b><span>${esc(p.address)}</span><em style="background:${p.rating == null ? "rgba(255,255,255,0.18)" : accent}">${star(p.rating)}</em></div>`;

/** Cards shown one at a time at given times (each up at least 1.8 s). */
const cardSeq = (sid, s, cards, enter, accent) => {
  const times = [];
  cards.forEach((c, k) => {
    const cue = cueTime(s, c.cue) ?? enter + 1.5 + k * ((s.end - enter - 2) / cards.length);
    times.push(Math.max(cue, k ? times[k - 1] + 1.8 : enter + CLEAR));
  });
  const parts = [];
  cards.forEach((c, k) => {
    const id = `${sid}-c${k}`;
    parts.push(`<div id="${id}" class="card" style="opacity:0"><div class="card-h" style="color:${accent}">${esc(c.title.toUpperCase())}<span class="dots">${cards.map((_, j) => `<i class="${j === k ? "on" : ""}"></i>`).join("")}</span></div>${c.body}</div>`);
    tw(`tl.fromTo("#${id}", {opacity:0, y:50, filter:"blur(10px)"}, {opacity:1, y:0, filter:"blur(0px)", duration:0.45, ease:"expo.out"}, ${r2(times[k] - 0.05)});`);
    if (k < cards.length - 1) tw(`tl.to("#${id}", {opacity:0, y:-30, filter:"blur(8px)", duration:0.2, ease:"power3.in"}, ${r2(times[k + 1] - 0.22)});`);
    if (c.rows) tw(`tl.fromTo("#${id} .row", {opacity:0, x:-40}, {opacity:1, x:0, duration:0.3, stagger:0.09, ease:"power3.out"}, ${r2(times[k] + 0.15)});`);
  });
  return parts.join("");
};

// ---- the road map (travel intro) ----------------------------------------
// Hand-placed on a 1080 × 900 map card (top 210): Hà Nội bottom right, Tam Đảo top left.
const ROUTE = [[860, 760], [760, 690], [640, 610], [540, 545], [470, 500], [430, 440], [470, 405], [415, 372], [455, 335], [395, 300], [360, 250]];
const segLen = ROUTE.slice(1).map((p, k) => Math.hypot(p[0] - ROUTE[k][0], p[1] - ROUTE[k][1]));
const routeLen = segLen.reduce((a, b) => a + b, 0);
const roadMap = (s, sid) => {
  const a = s.start;
  const r = s.road;
  const DRAW0 = a + 0.6;
  const DRAW = 3.6;
  const d = "M" + ROUTE.map((p) => p.join(",")).join(" L");
  tw(`tl.fromTo("#${sid}-route", {strokeDashoffset:1}, {strokeDashoffset:0, duration:${DRAW}, ease:"none"}, ${r2(DRAW0)});`);
  const kf = [];
  ROUTE.slice(1).forEach((p, k) => kf.push(`{x:${p[0] - ROUTE[0][0]}, y:${p[1] - ROUTE[0][1]}, duration:${r2((segLen[k] / routeLen) * DRAW)}, ease:"none"}`));
  tw(`tl.to("#${sid}-car", {keyframes:[${kf.join(",")}]}, ${r2(DRAW0)});`);
  // Labels appear as the marker passes them.
  const at = (k) => DRAW0 + (segLen.slice(0, k).reduce((x, y) => x + y, 0) / routeLen) * DRAW;
  fadeUp(`#${sid}-l0`, a + 0.3);
  fadeUp(`#${sid}-l1`, at(3));
  fadeUp(`#${sid}-l2`, at(5));
  tw(`tl.fromTo("#${sid}-pin", {opacity:0, y:-120, scale:0.6}, {opacity:1, y:0, scale:1, duration:0.6, ease:"bounce.out"}, ${r2(DRAW0 + DRAW - 0.1)});`);
  tw(`tl.fromTo("#${sid}-ring", {opacity:0.8, scale:0.4}, {opacity:0, scale:2.4, duration:1.1, ease:"power2.out"}, ${r2(DRAW0 + DRAW + 0.4)});`);
  fadeUp(`#${sid}-chip0`, DRAW0 + DRAW + 0.5);
  fadeUp(`#${sid}-chip1`, DRAW0 + DRAW + 0.8);
  tw(`tl.fromTo("#${sid}-topo", {scale:1.08}, {scale:1, duration:${r2(s.durationSec)}, ease:"none"}, ${a});`);
  const [hx, hy] = ROUTE[0];
  const [tx, ty] = ROUTE.at(-1);
  return `<div id="${sid}-topo" class="topo">
<svg class="map" viewBox="0 0 1080 900" width="1080" height="900">
  <defs><radialGradient id="peakglow" cx="0.33" cy="0.26" r="0.5"><stop offset="0" stop-color="#9ad1b0" stop-opacity="0.35"/><stop offset="1" stop-color="#9ad1b0" stop-opacity="0"/></radialGradient></defs>
  <rect width="1080" height="900" fill="url(#peakglow)"/>
  ${[60, 110, 165, 225, 290, 360].map((rr, k) => `<ellipse cx="${tx + 10}" cy="${ty + 20}" rx="${rr * 1.35}" ry="${rr}" fill="none" stroke="rgba(154,209,176,${0.34 - k * 0.045})" stroke-width="2"/>`).join("")}
  <path d="M${tx - 95},${ty + 25} L${tx - 50},${ty - 55} L${tx - 18},${ty + 5} L${tx + 15},${ty - 75} L${tx + 50},${ty + 2} L${tx + 80},${ty - 45} L${tx + 125},${ty + 25} Z" fill="rgba(154,209,176,0.22)" stroke="#9ad1b0" stroke-width="3"/>
  <path d="${d}" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
  <path id="${sid}-route" d="${d}" pathLength="1" fill="none" stroke="#ffd28a" stroke-width="9" stroke-dasharray="1" stroke-dashoffset="1" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="${hx}" cy="${hy}" r="14" fill="#ffd28a"/>
</svg>
<div id="${sid}-car" class="car" style="left:${hx - 22}px;top:${210 + hy - 22}px"></div>
<div id="${sid}-ring" class="ring" style="left:${tx - 60}px;top:${210 + ty - 60}px;opacity:0"></div>
<div id="${sid}-pin" class="pin" style="left:${tx - 26}px;top:${210 + ty - 70}px;opacity:0"></div>
<div id="${sid}-l0" class="mlabel" style="left:${hx - 120}px;top:${210 + hy + 26}px;opacity:0">${esc(r.from)}</div>
<div id="${sid}-l1" class="mlabel small" style="left:${ROUTE[3][0] + 30}px;top:${210 + ROUTE[3][1] + 10}px;opacity:0">${esc(r.via)}</div>
<div id="${sid}-l2" class="mlabel small amber" style="left:${ROUTE[6][0] + 50}px;top:${210 + ROUTE[6][1] - 10}px;opacity:0">${esc(r.pass)}</div>
<div id="${sid}-chip0" class="chip" style="left:600px;top:${210 + 250}px;opacity:0">${esc(r.km)}</div>
<div id="${sid}-chip1" class="chip cool" style="left:600px;top:${210 + 330}px;opacity:0">❄ ${esc(r.cool)}</div>
</div>`;
};

// ---- scenes -------------------------------------------------------------
for (const s of scenes) {
  const sid = `s-${s.id}`;
  const a = s.start;
  const enter = a + LEAD;
  const accent = s.accent ?? video.theme.accent;
  const parts = [];

  if (s.layout === "hook" && !isFood) {
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="hook-dim"></div>`);
    parts.push(roadMap(s, sid));
    parts.push(`<div id="${sid}-kicker" class="hook-kicker">${esc(s.kicker)}</div>`);
    parts.push(`<h1 id="${sid}-title" class="hook-title">${words(s.caption)}</h1>`);
    parts.push(`<div id="${sid}-pill" class="pill" style="background:${accent};top:1370px">${esc(s.label ?? "")}</div>`);
    // Frame 0 is the thumbnail: the title is already there, then settles.
    tw(`tl.fromTo("#${sid}-title", {scale:1.1}, {scale:1, duration:1.8, ease:"expo.out"}, ${a});`);
    fadeUp(`#${sid}-kicker`, a + 0.2);
    fadeUp(`#${sid}-pill`, a + 0.6);
  } else if (s.layout === "hook") {
    // Food intro: a table seen from above, the dishes sliding in as plates.
    parts.push(`<div id="${sid}-table" class="table"></div>`);
    const SPOTS = [[190, 330, -8], [540, 300, 4], [890, 340, 7], [300, 1200, 5], [780, 1210, -6]];
    (s.gallery ?? []).slice(0, 5).forEach((src, k) => {
      const [x, y, rot] = SPOTS[k];
      const fromX = x < 540 ? -700 : 700;
      parts.push(`<div id="${sid}-plate${k}" class="plate" style="left:${x - 160}px;top:${y - 160}px"><img src="${asset(src)}" alt="" /></div>`);
      tw(`tl.fromTo("#${sid}-plate${k}", {x:${fromX}, rotation:${rot * 6}}, {x:0, rotation:${rot}, duration:0.9, ease:"power3.out"}, ${r2(a + 0.05 + k * 0.12)});`);
    });
    parts.push(`<div id="${sid}-kicker" class="hook-kicker" style="top:700px">${esc(s.kicker)}</div>`);
    const size = Math.min(150, Math.floor(1500 / s.caption.length));
    parts.push(`<h1 id="${sid}-title" class="hook-title food" style="font-size:${size}px">${words(s.caption)}</h1>`);
    parts.push(`<div id="${sid}-pill" class="pill" style="background:${accent};top:960px">${esc(s.label ?? "")}</div>`);
    tw(`tl.fromTo("#${sid}-title", {scale:1.12}, {scale:1, duration:1.4, ease:"expo.out"}, ${a});`);
    fadeUp(`#${sid}-kicker`, a + 0.2);
    fadeUp(`#${sid}-pill`, a + 0.5);
  } else if (s.layout === "point") {
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div class="floor"></div>`);
    const num = isFood ? `${s.story.number}/${s.story.total}` : `${vi ? "NGÀY" : "DAY"} ${(s.label.match(/\d+/) ?? ["1"])[0]}`;
    const small = isFood ? (vi ? "MÓN" : "DISH") : s.label.split("·")[1]?.trim().toUpperCase() ?? "";
    parts.push(sign(sid, num, small, enter + 0.7));
    parts.push(`<div class="head">`);
    parts.push(`<div id="${sid}-kicker" class="kicker" style="color:${accent}">${esc(isFood ? `${vi ? "MÓN" : "DISH"} ${s.label}` : s.label.toUpperCase())}</div>`);
    parts.push(`<h1 id="${sid}-title" class="title"${s.caption.length > 15 ? ' style="font-size:84px"' : ""}>${words(s.caption)}</h1>`);
    fadeUp(`#${sid}-kicker`, enter, 0.25);
    titleIn(`#${sid}-title`, enter + 0.2);
    if (!isFood) {
      (s.points ?? []).forEach((p, k) => {
        parts.push(`<div id="${sid}-pt${k}" class="point"><i style="background:${accent}"></i>${esc(p)}</div>`);
        fadeUp(`#${sid}-pt${k}`, enter + 1.0 + k * 0.45);
      });
      parts.push(`</div>`);
      const cue = Math.max(cueTime(s, s.dishes?.[0]?.spokenAs) ?? a + (s.end - a) * 0.55, enter + CLEAR);
      parts.push(`<div id="${sid}-food" class="card"><div class="card-h" style="color:${accent}">${esc(vi ? "ĂN GẦN ĐÂY" : "EAT NEARBY")} · ${esc(s.dishes?.[0]?.name ?? "")}</div>${(s.dishes ?? []).map((d) => row(d, accent)).join("")}</div>`);
      tw(`tl.fromTo("#${sid}-food", {opacity:0, y:60, filter:"blur(10px)"}, {opacity:1, y:0, filter:"blur(0px)", duration:0.5, ease:"expo.out"}, ${r2(cue - 0.1)});`);
      tw(`tl.fromTo("#${sid}-food .row", {opacity:0, x:-40}, {opacity:1, x:0, duration:0.3, stagger:0.09, ease:"power3.out"}, ${r2(cue + 0.15)});`);
    } else {
      parts.push(`<p id="${sid}-tag" class="point">${esc(s.story.tagline)}</p>`);
      parts.push(`</div>`);
      fadeUp(`#${sid}-tag`, enter + 0.9);
      parts.push(cardSeq(sid, s, s.story.sections.map((sec) => ({
        title: sec.title, cue: sec.cue, rows: Boolean(sec.places),
        body: sec.places ? sec.places.map((p) => row(p, accent)).join("") : `<p class="card-t">${esc(sec.text)}</p>`,
      })), enter, accent));
    }
    // Stop rail under the subtitle band.
    const idx = stops.findIndex((x) => x.id === s.id);
    const dots = stops.map((x, k) => `<i class="${k < idx ? "done" : ""}"${k === idx ? ` style="background:${accent};box-shadow:0 0 18px ${accent}"` : ""}></i>`).join("");
    parts.push(`<div id="${sid}-rail" class="rail">${dots}</div>`);
    fadeUp(`#${sid}-rail`, enter + 0.4);
  } else if (s.layout === "stay") {
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div class="floor"></div>`);
    parts.push(sign(sid, vi ? "Ở ĐÂU" : "STAY", vi ? "LƯU TRÚ" : "SLEEP", enter + 0.6));
    parts.push(`<div class="head"><div id="${sid}-kicker" class="kicker" style="color:${accent}">${esc(vi ? "TRƯỚC KHI ĐẶT PHÒNG" : "BEFORE YOU BOOK")}</div><h1 id="${sid}-title" class="title">${words(s.caption)}</h1></div>`);
    fadeUp(`#${sid}-kicker`, enter, 0.25);
    titleIn(`#${sid}-title`, enter + 0.2);
    const cards = s.zones.map((z, k) => ({
      title: `${k + 1} · ${z.title}`, cue: s.cues[k], rows: true,
      body: `<p class="card-n">${esc(z.note)}</p>` + z.picks.map(([n, r, ad]) => row({ place: n, address: ad, rating: r }, accent)).join(""),
    }));
    cards.push({ title: vi ? "Mẹo" : "Tip", cue: s.cues.at(-1), body: `<p class="card-t">${esc(s.tip)}</p>` });
    parts.push(cardSeq(sid, s, cards, enter, accent));
  } else if (!isFood) {
    // Travel outro: a postcard with a stamp and a postmark.
    parts.push(photos({ ...s, gallery: s.gallery.slice(1) }, a, s.end, sid));
    parts.push(`<div class="hook-dim"></div>`);
    parts.push(`<div id="${sid}-card" class="postcard"><div class="pc-photo"><img src="${asset(s.gallery[0])}" alt="" /></div><div class="pc-text"><small>${esc(vi ? "GỬI TỪ" : "GREETINGS FROM")}</small><b>${esc(vi ? "Tam Đảo" : "Tam Dao")}</b><i></i><i></i><i></i></div><div class="stamp"><span>▲▲▲</span><em>${esc(vi ? "PHỐ NÚI" : "HILL TOWN")}</em></div><div id="${sid}-mark" class="postmark" style="opacity:0">TAM ĐẢO<br/>2026</div></div>`);
    tw(`tl.fromTo("#${sid}-card", {opacity:0, y:420, rotation:14}, {opacity:1, y:0, rotation:-4, duration:1.1, ease:"back.out(1.4)"}, ${r2(enter + 0.1)});`);
    tw(`tl.fromTo("#${sid}-mark", {opacity:0, scale:2.2, rotation:-30}, {opacity:0.85, scale:1, rotation:-12, duration:0.35, ease:"power4.in"}, ${r2(enter + 1.5)});`);
    parts.push(`<div id="${sid}-cta" class="pill" style="background:${video.theme.accent};top:1250px">${esc(s.cta ?? "")}</div>`);
    fadeUp(`#${sid}-cta`, enter + 2.0);
  } else {
    // Food outro: polaroids of the dishes dropping into a pile.
    parts.push(`<div class="table"></div>`);
    parts.push(`<h1 id="${sid}-title" class="hook-title outro">${words(s.caption)}</h1>`);
    titleIn(`#${sid}-title`, enter + 0.1);
    const PILE = [[-150, -40, -9], [150, -60, 7], [-60, 60, 4], [110, 90, -6], [0, 10, 2]];
    s.gallery.slice(0, 5).forEach((src, k) => {
      const [x, y, rot] = PILE[k];
      parts.push(`<div id="${sid}-pol${k}" class="polaroid" style="left:${540 - 210 + x}px;top:${640 + y}px;opacity:0"><img src="${asset(src)}" alt="" /></div>`);
      tw(`tl.fromTo("#${sid}-pol${k}", {opacity:0, y:-700, rotation:${rot * 4}}, {opacity:1, y:0, rotation:${rot}, duration:0.6, ease:"power3.in"}, ${r2(enter + 0.5 + k * 0.32)});`);
    });
    parts.push(`<div id="${sid}-cta" class="pill" style="background:${video.theme.accent};top:1330px">${esc(s.cta ?? "")}</div>`);
    fadeUp(`#${sid}-cta`, enter + 2.4);
  }

  html.push(`<section id="${sid}" class="scene clip" data-start="0" data-duration="${total}"${s.i === 0 ? "" : ' style="opacity:0"'}>${parts.join("")}</section>`);
}

// ---- subtitles ----------------------------------------------------------
const caps = [];
for (const s of scenes) {
  const ws = s.clip?.words ?? [];
  let line = [];
  const flush = (nextStartMs) => {
    if (!line.length) return;
    const st = s.start + LEAD + line[0].startMs / 1000;
    const en = Math.min(s.end, s.start + LEAD + (nextStartMs ?? line.at(-1).endMs + 400) / 1000);
    const id = `cap-${s.id}-${caps.length}`;
    const spans = line.map((w, k) => `<span id="${id}-${k}">${esc(w.text.trim())}</span>`).join(" ");
    caps.push(`<div id="${id}" class="cap clip" data-start="${r2(st)}" data-duration="${r2(Math.max(0.3, en - st))}" data-track-index="9">${spans}</div>`);
    if (!cover) line.forEach((w, k) => tw(`tl.set("#${id}-${k}", {color:"${video.theme.highlight}"}, ${r2(s.start + LEAD + w.startMs / 1000)});`));
    line = [];
  };
  ws.forEach((w, k) => {
    const len = line.map((x) => x.text.trim()).join(" ").length + w.text.trim().length;
    if (line.length && (len > (vi ? 30 : 32) || /[.,!?]$/.test(line.at(-1).text.trim()))) flush(w.startMs);
    line.push(w);
    if (k === ws.length - 1) flush(null);
  });
}

// ---- media --------------------------------------------------------------
const media = [];
for (const s of scenes) {
  if (!s.clip) continue;
  media.push(`<audio id="vo-${s.id}" src="${asset(s.clip.file)}" data-start="${r2(s.start + LEAD)}" data-duration="${r2(s.clip.durationSec)}" data-volume="1" data-track-index="2"></audio>`);
}
const musicSrc = asset(`shared/music/${path.basename(video.music.src)}`);
const musicLen = probeDurationSec(path.join(PUBLIC_ROOT, video.music.src));
for (let at = 0, k = 0; at < total; at += musicLen - 1, k++) {
  const dur = r2(Math.min(musicLen, total - at));
  media.push(`<audio id="music-${k}" src="${musicSrc}" data-start="${r2(at)}" data-duration="${dur}" data-volume="0.2" data-fade-in="${k ? 1 : 0.4}" data-fade-out="${at + dur >= total - 0.01 ? 1.5 : 1}" data-track-index="${k % 2 ? 30 : 3}"></audio>`);
}

// ---- shader seams + quiet whooshes -----------------------------------
const SHADERS = isFood
  ? ["whip-pan", "gravitational-lens", "cross-warp-morph", "flash-through-white", "cinematic-zoom", "swirl-vortex"]
  : ["flash-through-white", "cross-warp-morph", "gravitational-lens", "cinematic-zoom", "cross-warp-morph", "flash-through-white"];
const transitions = scenes.slice(1).map((s, k) => ({ time: r2(s.start - SEAM / 2), shader: SHADERS[k % SHADERS.length], duration: SEAM }));
for (const tr of transitions) sound("whoosh-short", r2(tr.time - 0.1), 0.15);

// ---- page ---------------------------------------------------------------
const page = `<!doctype html>
<html lang="${video.language}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=${W}, height=${H}" />
<title>${esc(video.title)}</title>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@hyperframes/shader-transitions@0.8.223/dist/index.global.js"></script>
<style>
:root { --ground:#0d1a17; --ink:#f4fbf7; --pine:#14302a; --mint:#9ad1b0; --amber:#ffd28a; --wood:#7a4f2c; }
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:${W}px; height:${H}px; overflow:hidden; background:var(--ground); }
#root { position:relative; width:${W}px; height:${H}px; overflow:hidden; font-family:"Montserrat"; }
.scene { position:absolute; inset:0; overflow:hidden; background:var(--ground); z-index:1; }
.ph { position:absolute; inset:0; overflow:hidden; }
.ph img { width:100%; height:100%; object-fit:cover; }
.shade { position:absolute; inset:0; background:radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(4,12,10,0.5) 100%); }
.top { position:absolute; left:0; right:0; top:0; height:760px; background:linear-gradient(180deg, rgba(10,24,20,0.9) 0%, rgba(10,24,20,0.62) 55%, rgba(10,24,20,0) 100%); }
.floor { position:absolute; left:0; right:0; bottom:0; height:900px; background:linear-gradient(180deg, rgba(10,24,20,0) 0%, rgba(10,24,20,0.6) 45%, rgba(10,24,20,0.92) 100%); }
.hook-dim { position:absolute; inset:0; background:linear-gradient(180deg, rgba(10,24,20,0.82) 0%, rgba(10,24,20,0.7) 55%, rgba(10,24,20,0.9) 100%); }
/* Mist that drifts over everything. */
.fog { position:absolute; left:-700px; width:2500px; pointer-events:none; z-index:15; }
.fog.f1 { top:900px; height:700px; background:radial-gradient(ellipse at 30% 50%, rgba(235,245,240,0.16) 0%, rgba(235,245,240,0) 60%), radial-gradient(ellipse at 75% 55%, rgba(235,245,240,0.12) 0%, rgba(235,245,240,0) 55%); }
.fog.f2 { top:-80px; height:600px; background:radial-gradient(ellipse at 60% 45%, rgba(235,245,240,0.12) 0%, rgba(235,245,240,0) 60%); }
.topo { position:absolute; inset:0; }
.map { position:absolute; left:0; top:210px; }
.car { position:absolute; width:44px; height:44px; border-radius:50%; background:#fff; border:8px solid var(--amber); box-shadow:0 0 30px rgba(255,210,138,0.9); z-index:3; }
.pin { position:absolute; width:52px; height:70px; z-index:4; background:radial-gradient(circle at 50% 36%, #fff 0 9px, var(--amber) 10px 26px, transparent 27px); }
.pin::after { content:""; position:absolute; left:16px; top:42px; border-left:10px solid transparent; border-right:10px solid transparent; border-top:24px solid var(--amber); }
.ring { position:absolute; width:120px; height:120px; border-radius:50%; border:5px solid var(--amber); }
.mlabel { position:absolute; font:800 46px "Montserrat"; color:var(--ink); text-shadow:0 3px 14px rgba(0,0,0,0.8); white-space:nowrap; }
.mlabel.small { font-size:34px; color:rgba(244,251,247,0.85); }
.mlabel.amber { color:var(--amber); }
.chip { position:absolute; font:800 38px "Montserrat"; color:var(--ground); background:var(--amber); padding:10px 26px; border-radius:999px; white-space:nowrap; }
.chip.cool { background:var(--mint); }
.hook-kicker { position:absolute; left:0; right:0; top:1090px; text-align:center; font:700 32px "Montserrat"; letter-spacing:0.3em; color:var(--mint); z-index:5; }
.hook-title { position:absolute; left:0; right:0; top:1150px; text-align:center; font:900 190px/1 "Playfair Display"; color:var(--ink); text-shadow:0 10px 60px rgba(0,0,0,0.6); z-index:5; }
.hook-title .w, .title .w { display:inline-block; }
.hook-title.food { top:780px; line-height:1.05; }
.hook-title.outro { top:330px; font-size:110px; line-height:1.08; padding:0 70px; }
.pill { position:absolute; left:50%; transform:translateX(-50%); font:900 48px "Montserrat"; color:#0d1a17; padding:12px 40px; border-radius:999px; white-space:nowrap; z-index:6; }
.sign { position:absolute; right:60px; top:150px; width:270px; transform-origin:50% 0; z-index:6; }
.sign .nail { position:absolute; left:123px; top:0; width:24px; height:24px; border-radius:50%; background:#3b2a1d; box-shadow:0 2px 0 rgba(255,255,255,0.3); }
.sign::before, .sign::after { content:""; position:absolute; top:12px; width:3px; height:72px; background:#c9b28a; }
.sign::before { left:60px; transform:rotate(28deg); transform-origin:50% 0; }
.sign::after { right:60px; transform:rotate(-28deg); transform-origin:50% 0; }
.board { margin-top:70px; padding:18px 10px 14px; border-radius:14px; text-align:center; background:linear-gradient(180deg, #8a5a33, #6b4325); border:4px solid #4a2e18; box-shadow:0 14px 30px rgba(0,0,0,0.5), inset 0 0 0 3px rgba(255,220,170,0.18); color:#fff3dc; }
.board b { display:block; font:900 46px/1 "Montserrat"; white-space:nowrap; }
.board small { display:block; margin-top:8px; font:800 21px "Montserrat"; letter-spacing:0.14em; white-space:nowrap; color:var(--amber); }
.head { position:absolute; left:80px; top:215px; width:620px; display:flex; flex-direction:column; gap:10px; z-index:5; }
.kicker { font:700 32px "Montserrat"; letter-spacing:0.28em; }
.title { margin-bottom:10px; font:800 104px/1.04 "Playfair Display"; color:var(--ink); text-shadow:0 6px 30px rgba(0,0,0,0.55); }
.point { font:600 37px/1.3 "Montserrat"; color:rgba(244,251,247,0.92); text-shadow:0 2px 14px rgba(0,0,0,0.7); }
.point i { display:inline-block; width:14px; height:14px; border-radius:3px; margin-right:18px; vertical-align:middle; transform:rotate(45deg); }
/* Pine-green glass cards in the lower third, so the photo above stays clear. */
.card { position:absolute; left:60px; width:960px; top:1110px; padding:26px 34px 18px; border-radius:22px; background:rgba(12,30,26,0.82); border:2px solid rgba(154,209,176,0.55); box-shadow:0 18px 40px rgba(0,0,0,0.45); z-index:7; }
.card-h { font:800 28px "Montserrat"; letter-spacing:0.2em; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; }
.card-t { font:600 40px/1.3 "Montserrat"; color:var(--ink); }
.card-n { font:600 32px/1.3 "Montserrat"; color:rgba(244,251,247,0.8); margin-bottom:6px; }
.dots i { display:inline-block; width:12px; height:12px; border-radius:50%; margin-left:10px; background:rgba(255,255,255,0.22); }
.dots i.on { background:currentColor; }
.row { display:flex; align-items:baseline; gap:16px; padding:8px 0; border-top:1px solid rgba(154,209,176,0.2); }
.row b { font:800 36px "Montserrat"; color:var(--ink); white-space:nowrap; }
.row span { font:500 28px "Montserrat"; color:rgba(244,251,247,0.6); flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.row em { font:800 27px "Montserrat"; font-style:normal; color:#0d1a17; padding:4px 14px; border-radius:999px; white-space:nowrap; }
.rail { position:absolute; left:0; right:0; top:1690px; z-index:20; display:flex; justify-content:center; gap:26px; }
.rail i { width:18px; height:18px; border-radius:50%; background:rgba(255,255,255,0.22); }
.rail i.done { background:rgba(255,255,255,0.6); }
.postcard { position:absolute; left:70px; top:420px; width:940px; height:620px; background:#f6efe0; border-radius:10px; box-shadow:0 30px 60px rgba(0,0,0,0.55); display:flex; padding:24px; gap:26px; z-index:5; }
.pc-photo { width:470px; height:572px; overflow:hidden; border-radius:6px; }
.pc-photo img { width:100%; height:100%; object-fit:cover; }
.pc-text { flex:1; padding-top:150px; color:#24332d; }
.pc-text small { display:block; font:800 28px "Montserrat"; letter-spacing:0.24em; color:#5e7a6d; }
.pc-text b { display:block; margin:10px 0 30px; font:italic 900 86px/1 "Playfair Display"; }
.pc-text i { display:block; height:2px; margin:26px 0; background:rgba(36,51,45,0.25); }
.stamp { position:absolute; right:30px; top:30px; width:120px; height:144px; background:var(--mint); border:6px dashed #f6efe0; outline:2px solid rgba(36,51,45,0.3); display:flex; flex-direction:column; align-items:center; justify-content:center; color:#14302a; }
.stamp span { font:900 34px "Montserrat"; letter-spacing:-0.05em; }
.stamp em { font:800 16px "Montserrat"; font-style:normal; letter-spacing:0.12em; margin-top:6px; }
.postmark { position:absolute; right:60px; top:400px; width:170px; height:170px; border-radius:50%; border:5px solid rgba(160,40,40,0.85); color:rgba(160,40,40,0.9); display:flex; align-items:center; justify-content:center; text-align:center; font:900 26px/1.2 "Montserrat"; letter-spacing:0.1em; }
.table { position:absolute; inset:0; background:repeating-linear-gradient(90deg, #4a2f1c 0 120px, #533522 120px 240px), #4a2f1c; }
.table::after { content:""; position:absolute; inset:0; background:radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.55) 100%); }
.plate { position:absolute; width:320px; height:320px; border-radius:50%; overflow:hidden; border:18px solid #f4efe6; box-shadow:0 18px 40px rgba(0,0,0,0.55); z-index:2; }
.plate img { width:100%; height:100%; object-fit:cover; }
.polaroid { position:absolute; width:420px; height:500px; background:#fbf8f2; padding:22px 22px 90px; box-shadow:0 20px 40px rgba(0,0,0,0.5); z-index:3; }
.polaroid img { width:100%; height:100%; object-fit:cover; }
.brand { position:absolute; left:60px; top:60px; z-index:21; font:800 26px "Montserrat"; letter-spacing:0.3em; color:rgba(244,251,247,0.75); }
.brand b { color:var(--mint); letter-spacing:-0.05em; margin-right:12px; }
.cap { position:absolute; left:60px; right:60px; top:1500px; text-align:center; font:800 50px/1.25 "Montserrat"; color:#ffffff; text-shadow:0 3px 0 rgba(0,0,0,0.55), 0 0 22px rgba(0,0,0,0.85); z-index:20;${cover ? " display:none;" : ""} }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="${W}" data-height="${H}">
${media.join("\n")}
${sfx.join("\n")}
${html.join("\n")}
<div id="fog1" class="fog f1" data-layout-ignore></div>
<div id="fog2" class="fog f2" data-layout-ignore></div>
<div class="brand" data-layout-ignore><b>▲▲▲</b>TAM ĐẢO</div>
${caps.join("\n")}
</div>
<script>
const tl = gsap.timeline({ paused: true });
tl.fromTo("#fog1", {x:0}, {x:700, duration:${total}, ease:"none"}, 0);
tl.fromTo("#fog2", {x:500}, {x:-200, duration:${total}, ease:"none"}, 0);
${js.join("\n")}
HyperShader.init({
  bgColor: "#0d1a17",
  accentColor: "${video.theme.accent}",
  scenes: ${JSON.stringify(scenes.map((s) => `s-${s.id}`))},
  transitions: ${JSON.stringify(transitions)},
  timeline: tl,
  compositionId: "main",
});
window.__timelines = window.__timelines || {};
window.__timelines["main"] = tl;
</script>
</body>
</html>
`;
writeFileSync(path.join(out, "index.html"), page);
writeFileSync(path.join(out, "hyperframes.json"), JSON.stringify({ $schema: "https://hyperframes.heygen.com/schema/hyperframes.json", paths: { assets: "assets" } }, null, 2));
console.log(`build/${path.basename(out)}: ${scenes.length} scenes, ${total}s, ${caps.length} caption lines, ${sfx.length} sfx, ${assets.size} assets`);
