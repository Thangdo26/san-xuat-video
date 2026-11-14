#!/usr/bin/env node
/**
 * node hf/build-catba.mjs --slug cat-ba-2n1d [--cover]
 *
 * Turns data/videos/<slug>/video.json + voiceover.json into a HyperFrames project at
 * build/<slug>/. The look ("Cát Bà · cung đường mùa lạnh"), new for this destination:
 *   - intro: a phone navigation screen; the route draws over the bridge, the cable car and road 356
 *     while turn-by-turn banners change, the pin drops, then the camera dives into real drone footage;
 *   - real footage (Pexels drone clips, graded cool) mixed with the photos;
 *   - photos change with a windscreen wiper: a blade sweeps across and wipes the new photo in;
 *   - each stop gets a speedometer badge: the needle swings up, "NGÀY 1 · TRƯA" and the trip km;
 *   - cold sea mist drifts across every scene;
 *   - the stop rail is a little road with a car that drives to the current stop;
 *   - "Hết bao nhiêu tiền?" is a green highway sign; the rows light up, the total gets a yellow box;
 *   - outro: a trip-computer summary (bridge, cable car, coastal road, reeds), then the title on footage;
 *   - shader seams: cinematic zoom, cross warp, domain warp, flash through white, iris into the outro.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fail, parseArgs, requireSlug } from "../scripts/lib/args.mjs";
import { probeDurationSec } from "../scripts/lib/media.mjs";
import { PROJECT_ROOT, PUBLIC_ROOT } from "../scripts/lib/paths.mjs";

const { flags } = parseArgs(process.argv.slice(2));
const slug = requireSlug(flags, "build-catba");
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
const brand = video.theme.brand ?? "CÁT BÀ";

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
const star = (r) => (r == null ? "gợi ý" : `★${r.toFixed(1)}`);

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

let videoTrack = 40;
/** Photo (or footage) stack; each new item is wiped in by a windscreen-wiper blade sweeping left to right. */
const photos = (s, from, to, idPrefix) => {
  const g = s.gallery ?? [];
  const seg = (to - from) / g.length;
  return g
    .map((src, k) => {
      const id = `${idPrefix}-p${k}`;
      const a = r2(from + seg * k);
      const mv = MOVES[(s.i + k) % MOVES.length];
      const isVideo = src.endsWith(".mp4");
      const pano = s.pano && !isVideo;
      const inner = isVideo
        ? `<video id="${id}-v" class="clip" src="${asset(src)}" muted playsinline data-start="${r2(Math.max(0, a - 0.9))}" data-duration="${r2(seg + 1.8)}" data-track-index="${videoTrack++}"></video>`
        : `<img src="${asset(src)}" alt="" />`;
      if (pano) tw(`tl.fromTo("#${id} img", {xPercent:${k % 2 ? -62 : -38}, scale:1.04}, {xPercent:${k % 2 ? -38 : -62}, scale:1.04, duration:${r2(seg + 0.8)}, ease:"none"}, ${a});`);
      else tw(`tl.fromTo("#${id} ${isVideo ? "video" : "img"}", {${isVideo ? "scale:1.02" : mv.from}}, {${isVideo ? "scale:1.1" : mv.to}, duration:${r2(seg + 0.8)}, ease:"none"}, ${a});`);
      if (k > 0) {
        tw(`tl.set("#${id}", {"--a":"0deg"}, 0);`);
        tw(`tl.fromTo("#${id}", {"--a":"0deg"}, {"--a":"181deg", duration:0.7, ease:"power2.inOut", immediateRender:false}, ${a});`);
        tw(`tl.fromTo("#${idPrefix}-wb${k}", {rotation:-92, opacity:1}, {rotation:92, opacity:1, duration:0.7, ease:"power2.inOut", immediateRender:false}, ${a});`);
        tw(`tl.to("#${idPrefix}-wb${k}", {opacity:0, duration:0.12}, ${r2(a + 0.7)});`);
        tw(`tl.to("#${idPrefix}-p${k - 1}", {opacity:0, duration:0.01}, ${r2(a + 0.72)});`);
        sound("whoosh-short", r2(a + 0.05), 0.08);
      }
      const blade = k > 0 ? `<i id="${idPrefix}-wb${k}" class="wiper" style="opacity:0"></i>` : "";
      return `<div id="${id}" class="ph${pano ? " pano" : ""}${k > 0 ? " wipe" : ""}">${inner}</div>${blade}`;
    })
    .join("");
};

const titleIn = (sel, at) =>
  tw(`tl.fromTo("${sel} .w", {opacity:0, y:30, filter:"blur(8px)"}, {opacity:1, y:0, filter:"blur(0px)", duration:0.5, stagger:0.08, ease:"power3.out"}, ${r2(at)});`);
const fadeUp = (sel, at, dur = 0.35) =>
  tw(`tl.fromTo("${sel}", {opacity:0, y:26}, {opacity:1, y:0, duration:${dur}, ease:"expo.out"}, ${r2(at)});`);

/** Speedometer badge: the dial fades in, the needle swings up to the stop's reading, the arc fills, labels show. */
const gauge = (sid, big, small, km, level, accent, at) => {
  const ang = -90 + 180 * level; // -90 = empty, +90 = full
  tw(`tl.fromTo("#${sid}-gg", {opacity:0, scale:0.7, y:-30}, {opacity:1, scale:1, y:0, duration:0.45, ease:"back.out(1.6)"}, ${r2(at)});`);
  tw(`tl.fromTo("#${sid}-gg .needle", {rotation:-90, svgOrigin:"150 160"}, {rotation:${r2(ang)}, svgOrigin:"150 160", duration:0.9, ease:"back.out(2.2)"}, ${r2(at + 0.25)});`);
  tw(`tl.fromTo("#${sid}-gg .arc", {strokeDashoffset:346}, {strokeDashoffset:${r2(346 * (1 - level))}, duration:0.9, ease:"power3.out"}, ${r2(at + 0.25)});`);
  tw(`tl.fromTo("#${sid}-gg .gl", {opacity:0, y:12}, {opacity:1, y:0, duration:0.3, stagger:0.08, ease:"power3.out"}, ${r2(at + 0.7)});`);
  sound("pop", r2(at + 0.75), 0.1);
  const ticks = Array.from({ length: 9 }, (_, k) => {
    const a = (Math.PI * k) / 8;
    const x1 = 150 - Math.cos(a) * 118, y1 = 160 - Math.sin(a) * 118, x2 = 150 - Math.cos(a) * (k % 2 ? 102 : 96), y2 = 160 - Math.sin(a) * (k % 2 ? 102 : 96);
    return `<line x1="${r2(x1)}" y1="${r2(y1)}" x2="${r2(x2)}" y2="${r2(y2)}" stroke="rgba(255,255,255,0.6)" stroke-width="${k % 2 ? 3 : 5}" stroke-linecap="round"/>`;
  }).join("");
  return `<div id="${sid}-gg" class="gauge" style="opacity:0"><svg viewBox="0 0 300 180" width="270" height="162"><path d="M40 160 A110 110 0 0 1 260 160" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="14" stroke-linecap="round"/><path class="arc" d="M40 160 A110 110 0 0 1 260 160" fill="none" stroke="${accent}" stroke-width="14" stroke-linecap="round" stroke-dasharray="346" stroke-dashoffset="346"/>${ticks}<g class="needle"><path d="M146 160 L150 66 L154 160 Z" fill="#ff5a4e"/><circle cx="150" cy="160" r="13" fill="#fff"/></g></svg><b class="gl">${esc(big)}</b><em class="gl" style="color:${accent}">${esc(small)}</em>${km ? `<small class="gl">${esc(km)}</small>` : ""}</div>`;
};

const row = (p, accent) => `<div class="row"><b>${esc(p.place)}</b><span>${esc(p.address)}</span><em style="background:${p.rating == null ? "rgba(27,36,64,0.12)" : accent}">${star(p.rating)}</em></div>`;

// Google Maps screenshots (name + stars + review count), captured 14/11/2026 into public/videos/cat-ba/maps.
const MAPS = video.maps ?? {};
const MAPS_DATE = "chụp 14/11/2026";

/**
 * When a restaurant card (and its Maps panel) clears away so the photo shows again: ~1.6 s after the
 * last screenshot slides in, pulled earlier so at least 1.2 s of clean photo remains, but never before
 * every screenshot has been up 0.8 s. Null when the scene ends too soon for that.
 */
const clearAt = (from, n, end) => {
  const shown = from + 0.45 + n * 0.9;
  const t = Math.max(Math.min(shown + 1.6, end - 1.2), shown + 0.8);
  return t < end - 0.5 ? t : null;
};
const hideOut = (sel, at) => tw(`tl.to("${sel}", {opacity:0, y:30, filter:"blur(8px)", duration:0.4, ease:"power2.in"}, ${r2(at)});`);

/** A Google Maps panel above the card: one screenshot per listed place, sliding in while its row lights up. */
const proofs = (sid, rowsSel, places, from, to, hide = null) => {
  const list = places.map((p, k) => [MAPS[p.place], k]).filter(([m]) => m);
  if (!list.length) return "";
  if (hide != null) hideOut(`#${sid}-gm`, hide - 0.1);
  const id = `${sid}-gm`, slot = Math.min(0.9, (to - from - 1) / list.length);
  tw(`tl.fromTo("#${id}", {opacity:0, y:40, scale:0.92}, {opacity:1, y:0, scale:1, duration:0.4, ease:"back.out(1.5)"}, ${r2(from + 0.25)});`);
  list.forEach(([, k], i) => {
    const t0 = from + 0.45 + i * slot;
    tw(`tl.fromTo("#${id}-${k}", {opacity:0, x:60}, {opacity:1, x:0, duration:0.35, ease:"power3.out"}, ${r2(t0)});`);
    tw(`tl.fromTo(document.querySelectorAll("${rowsSel}")[${k}], {backgroundColor:"rgba(79,209,197,0)"}, {backgroundColor:"rgba(79,209,197,0.3)", duration:0.25, yoyo:true, repeat:1, repeatDelay:${r2(Math.max(slot - 0.5, 0.2))}}, ${r2(t0)});`);
  });
  return `<div id="${id}" class="gmaps" style="opacity:0"><div class="gmaps-h"><i>📍</i>Google Maps<span>${MAPS_DATE}</span></div>${list.map(([m, k]) => `<img id="${id}-${k}" src="${asset(`videos/cat-ba/maps/${m}.png`)}" alt="" />`).join("")}</div>`;
};

/** Cards shown one at a time at given times (each up at least 1.8 s). */
const cardSeq = (sid, s, cards, enter) => {
  const times = [];
  cards.forEach((c, k) => {
    const cue = cueTime(s, c.cue) ?? enter + 1.5 + k * ((s.end - enter - 2) / cards.length);
    times.push(Math.max(cue, k ? times[k - 1] + 1.8 : enter + CLEAR));
  });
  const parts = [];
  cards.forEach((c, k) => {
    const id = `${sid}-c${k}`;
    parts.push(`<div id="${id}" class="card" style="opacity:0"><div class="card-h">${esc(c.title.toUpperCase())}<span class="dots">${cards.map((_, j) => `<i class="${j === k ? "on" : ""}"></i>`).join("")}</span></div>${c.body}</div>`);
    tw(`tl.fromTo("#${id}", {opacity:0, y:50, filter:"blur(10px)"}, {opacity:1, y:0, filter:"blur(0px)", duration:0.45, ease:"expo.out"}, ${r2(times[k] - 0.05)});`);
    if (k < cards.length - 1) tw(`tl.to("#${id}", {opacity:0, y:-30, filter:"blur(8px)", duration:0.2, ease:"power3.in"}, ${r2(times[k + 1] - 0.22)});`);
    else if (s.end - times[k] > 3.2) hideOut(`#${id}`, s.end - 1.1);
    if (c.rows) tw(`tl.fromTo("#${id} .row", {opacity:0, x:-40}, {opacity:1, x:0, duration:0.3, stagger:0.09, ease:"power3.out"}, ${r2(times[k] + 0.15)});`);
  });
  return parts.join("");
};

// ---- phone navigation intro: route over the bridge, the cable car and road 356, then dive into footage ----
const NAV_MAP = `<svg class="navsvg" viewBox="0 0 1080 1920" width="1080" height="1920">
<rect width="1080" height="1920" fill="#0d2a35"/>
${Array.from({ length: 12 }, (_, k) => `<path d="M0 ${k * 170 + 40} H1080" stroke="rgba(120,200,210,0.05)" stroke-width="2"/>`).join("")}
<path d="M0 0 H700 C 640 160, 560 260, 470 340 C 380 420, 300 520, 230 640 C 170 740, 90 800, 0 840 Z" fill="#1d3b3a"/>
<path d="M520 900 C 570 880, 640 890, 690 930 C 720 960, 700 1000, 650 1010 C 600 1015, 540 990, 515 950 Z" fill="#1d3b3a"/>
<path d="M700 1120 C 800 1060, 960 1080, 1080 1110 V1920 H560 C 520 1820, 560 1700, 640 1620 C 700 1560, 640 1480, 650 1380 C 660 1260, 640 1180, 700 1120 Z" fill="#1d3b3a"/>
${[[420, 1180, 26], [480, 1290, 18], [380, 1400, 30], [520, 1470, 16], [450, 1560, 22], [900, 960, 20], [980, 880, 14], [830, 840, 16], [300, 1150, 14]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.8}" fill="#24474a"/>`).join("")}
<path d="M120 200 L330 640 M260 120 L470 330 M60 520 L230 640" stroke="rgba(255,255,255,0.12)" stroke-width="10" stroke-linecap="round"/>
<text x="110" y="300" font-family="Montserrat" font-weight="800" font-size="36" fill="rgba(255,255,255,0.55)">HẢI PHÒNG</text>
<text x="560" y="1060" font-family="Montserrat" font-weight="800" font-size="30" fill="rgba(255,255,255,0.5)">CÁT HẢI</text>
<text x="880" y="1300" font-family="Montserrat" font-weight="900" font-size="44" fill="rgba(255,255,255,0.7)">CÁT BÀ</text>
<text x="380" y="1660" font-family="Montserrat" font-weight="700" font-size="28" fill="rgba(120,220,220,0.55)">VỊNH LAN HẠ</text>
</svg>`;
const NAV_ROUTE = [
  "M330 640 L530 905", // bridge Tân Vũ – Lạch Huyện
  "M650 960 L760 1150", // cable car Cát Hải – Phù Long
  "M760 1150 C 700 1260, 690 1360, 680 1440 C 670 1520, 720 1580, 800 1630", // road 356 to town
];
const NAV_ICON = { up: "M0 30 L22 -2 L44 30 L28 30 L28 58 L16 58 L16 30 Z", left: "M44 58 L44 26 C44 14 34 8 24 8 L18 8 L18 -6 L-6 18 L18 42 L18 28 L24 28 C26 28 28 30 28 32 L28 58 Z", right: "M0 58 L0 26 C0 14 10 8 20 8 L26 8 L26 -6 L50 18 L26 42 L26 28 L20 28 C18 28 16 30 16 32 L16 58 Z" };
const navIntro = (s, sid) => {
  const a = s.start;
  const parts = [photos(s, a, s.end, sid), `<div class="shade"></div>`];
  const steps = s.nav ?? [];
  const legs = NAV_ROUTE.map((d, k) => `<path id="${sid}-leg${k}" d="${d}" fill="none" stroke="${k === 1 ? "#ffd36e" : "#4fd1c5"}" stroke-width="16" stroke-linecap="round" pathLength="1000" style="stroke-dasharray:1000 1200;stroke-dashoffset:1100"/>`).join("");
  parts.push(`<div id="${sid}-nav" class="nav">${NAV_MAP}<svg class="navsvg" viewBox="0 0 1080 1920" width="1080" height="1920">${NAV_ROUTE.map((d) => `<path d="${d}" fill="none" stroke="rgba(79,209,197,0.18)" stroke-width="26" stroke-linecap="round"/>`).join("")}${legs}<circle cx="330" cy="640" r="16" fill="#fff"/></svg><div id="${sid}-pin" class="navpin" style="opacity:0"><i></i></div><div id="${sid}-car" class="navcar"></div></div>`);
  // Turn-by-turn banners, one per leg.
  parts.push(`<div id="${sid}-ban" class="navban" style="opacity:0">${steps.map(([icon, name, dist], k) => `<div id="${sid}-st${k}" class="navstep" style="opacity:0"><svg viewBox="-10 -10 66 72" width="86" height="94"><path d="${NAV_ICON[icon] ?? NAV_ICON.up}" fill="#fff"/></svg><span><b>${esc(dist)}</b><em>${esc(name)}</em></span></div>`).join("")}</div>`);
  parts.push(`<div id="${sid}-eta" class="naveta" style="opacity:0"><i></i>${esc(s.trip ?? "")}</div>`);
  tw(`tl.fromTo("#${sid}-ban", {opacity:0, y:-80}, {opacity:1, y:0, duration:0.45, ease:"back.out(1.5)"}, ${r2(a + 0.2)});`);
  fadeUp(`#${sid}-eta`, a + 0.4);
  const legAt = [a + 0.55, a + 1.55, a + 2.45];
  const legDur = [0.85, 0.75, 0.9];
  const carPts = [[330, 640], [530, 905], [650, 960], [760, 1150], [680, 1440], [800, 1630]];
  tw(`tl.set("#${sid}-car", {x:${carPts[0][0] - 22}, y:${carPts[0][1] - 22}}, 0);`);
  legAt.forEach((at, k) => {
    tw(`tl.fromTo("#${sid}-leg${k}", {strokeDashoffset:1100}, {strokeDashoffset:0, duration:${legDur[k]}, ease:"power1.inOut"}, ${r2(at)});`);
    if (k) tw(`tl.to("#${sid}-st${k - 1}", {opacity:0, y:-20, duration:0.2}, ${r2(at - 0.05)});`);
    tw(`tl.fromTo("#${sid}-st${k}", {opacity:0, y:24}, {opacity:1, y:0, duration:0.3, ease:"power3.out"}, ${r2(at)});`);
    sound("pop", r2(at), 0.07);
  });
  // The car dot follows the legs (straight hops between the waypoints).
  const hops = [[0, 1, legAt[0], legDur[0]], [1, 2, legAt[1] - 0.14, 0.12], [2, 3, legAt[1], legDur[1]], [3, 4, legAt[2], legDur[2] * 0.55], [4, 5, legAt[2] + legDur[2] * 0.55, legDur[2] * 0.45]];
  for (const [, j, at, d] of hops) tw(`tl.to("#${sid}-car", {x:${carPts[j][0] - 22}, y:${carPts[j][1] - 22}, duration:${r2(d)}, ease:"none"}, ${r2(at)});`);
  const pinAt = a + 3.4;
  tw(`tl.fromTo("#${sid}-pin", {opacity:0, y:-160}, {opacity:1, y:0, duration:0.5, ease:"bounce.out"}, ${r2(pinAt)});`);
  sound("pop", r2(pinAt + 0.25), 0.12);
  // Dive into the pin and out through the screen into the drone footage.
  const push = a + 4.0;
  tw(`tl.to("#${sid}-nav", {scale:5, duration:0.9, ease:"power3.in"}, ${r2(push)});`);
  tw(`tl.to("#${sid}-nav", {opacity:0, duration:0.35}, ${r2(push + 0.55)});`);
  tw(`tl.to("#${sid}-ban, #${sid}-eta", {opacity:0, duration:0.3}, ${r2(push)});`);
  sound("whoosh-cinematic", r2(push), 0.14);
  return { html: parts.join(""), settle: r2(push + 0.9) };
};

// ---- scenes -------------------------------------------------------------
for (const s of scenes) {
  const sid = `s-${s.id}`;
  const a = s.start;
  const enter = a + LEAD;
  const accent = s.accent ?? video.theme.accent;
  const parts = [];

  if (s.layout === "hook") {
    const m = navIntro(s, sid);
    parts.push(m.html);
    parts.push(`<div id="${sid}-dim" class="hook-dim" style="opacity:0"></div>`);
    parts.push(`<div id="${sid}-kicker" class="hook-kicker" style="opacity:0">${esc(s.kicker)}</div>`);
    parts.push(`<h1 id="${sid}-title" class="hook-title" style="opacity:0">${words(s.caption)}</h1>`);
    parts.push(`<div id="${sid}-pill" class="pill" style="background:${accent};top:1370px;opacity:0">${esc(s.label ?? "")}</div>`);
    tw(`tl.to("#${sid}-dim", {opacity:1, duration:0.6}, ${m.settle});`);
    tw(`tl.fromTo("#${sid}-title", {scale:1.25, opacity:0}, {scale:1, opacity:1, duration:1, ease:"expo.out", immediateRender:false}, ${m.settle});`);
    fadeUp(`#${sid}-kicker`, m.settle + 0.3);
    fadeUp(`#${sid}-pill`, m.settle + 0.6);
  } else if (s.layout === "point") {
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div class="floor"></div>`);
    const idx = stops.findIndex((x) => x.id === s.id);
    const [day, part] = s.label.split("·").map((x) => x.trim().toUpperCase());
    parts.push(gauge(sid, day, part, s.gauge, (idx + 1) / (stops.length + 0.4), accent, enter + 0.6));
    parts.push(`<div class="head">`);
    parts.push(`<div id="${sid}-kicker" class="kicker" style="color:${accent}">${esc(s.label.toUpperCase())}</div>`);
    parts.push(`<h1 id="${sid}-title" class="title"${s.caption.length > 13 ? ' style="font-size:88px"' : ""}>${words(s.caption)}</h1>`);
    fadeUp(`#${sid}-kicker`, enter, 0.25);
    titleIn(`#${sid}-title`, enter + 0.2);
    (s.points ?? []).forEach((p, k) => {
      parts.push(`<div id="${sid}-pt${k}" class="point"><i style="background:${accent}"></i>${esc(p)}</div>`);
      fadeUp(`#${sid}-pt${k}`, enter + 1.0 + k * 0.45);
    });
    parts.push(`</div>`);
    // Up when the place is named, or early enough to be read and cleared before the scene ends.
    const named = cueTime(s, s.dishes?.[0]?.spokenAs) ?? a + (s.end - a) * 0.55;
    const cue = Math.max(Math.min(named, s.end - 1.4 - (s.dishes ?? []).length * 0.9 - 0.45), enter + CLEAR);
    parts.push(`<div id="${sid}-food" class="card"><div class="card-h">ĂN GẦN ĐÂY · ${esc(s.dishes?.[0]?.name ?? "")}</div>${(s.dishes ?? []).map((d) => row(d, accent)).join("")}</div>`);
    tw(`tl.fromTo("#${sid}-food", {opacity:0, y:60, filter:"blur(10px)"}, {opacity:1, y:0, filter:"blur(0px)", duration:0.5, ease:"expo.out"}, ${r2(cue - 0.1)});`);
    tw(`tl.fromTo("#${sid}-food .row", {opacity:0, x:-40}, {opacity:1, x:0, duration:0.3, stagger:0.09, ease:"power3.out"}, ${r2(cue + 0.15)});`);
    // The eat-nearby card and its Maps panel clear away once read, so the place's photos show again.
    const hide = clearAt(cue, (s.dishes ?? []).length, s.end);
    if (hide != null) hideOut(`#${sid}-food`, hide);
    parts.push(proofs(sid, `#${sid}-food .row`, s.dishes ?? [], cue, s.end, hide));
    // Road rail under the subtitle band: the car drives from the last stop to this one.
    const xs = stops.map((_, k) => 250 + (580 * k) / Math.max(1, stops.length - 1));
    const dots = stops.map((x, k) => `<i class="${k < idx ? "done" : ""}" style="left:${r2(xs[k] - 9)}px${k === idx ? `;background:${accent};box-shadow:0 0 18px ${accent}` : ""}"></i>`).join("");
    parts.push(`<div id="${sid}-rail" class="rail"><span class="road"></span>${dots}<b id="${sid}-car" class="car" style="left:${r2(xs[Math.max(0, idx - 1)] - 26)}px"></b></div>`);
    fadeUp(`#${sid}-rail`, enter + 0.4);
    if (idx > 0) tw(`tl.fromTo("#${sid}-car", {x:0}, {x:${r2(xs[idx] - xs[idx - 1])}, duration:1.1, ease:"power2.inOut"}, ${r2(enter + 0.6)});`);
  } else if (s.layout === "stay") {
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div class="floor"></div>`);
    parts.push(gauge(sid, "Ở ĐÂU", "LƯU TRÚ", "", 0.5, accent, enter + 0.6));
    parts.push(`<div class="head"><div id="${sid}-kicker" class="kicker" style="color:${accent}">TRƯỚC KHI ĐẶT PHÒNG</div><h1 id="${sid}-title" class="title">${words(s.caption)}</h1></div>`);
    fadeUp(`#${sid}-kicker`, enter, 0.25);
    titleIn(`#${sid}-title`, enter + 0.2);
    const cards = s.zones.map((z, k) => ({
      title: `${k + 1} · ${z.title}`, cue: s.cues[k], rows: true,
      body: `<p class="card-n">${esc(z.note)}</p>` + z.picks.map(([n, r, ad]) => row({ place: n, address: ad, rating: r }, accent)).join(""),
    }));
    cards.push({ title: "Mẹo", cue: s.cues.at(-1), body: `<p class="card-t">${esc(s.tip)}</p>` });
    parts.push(cardSeq(sid, s, cards, enter));
  } else if (s.layout === "cost") {
    // "Hết bao nhiêu tiền?": a green highway sign swings down; rows light up one by one, the total gets a yellow box.
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div class="floor"></div>`);
    parts.push(`<div class="head"><div id="${sid}-kicker" class="kicker" style="color:${accent}">${esc(s.kicker ?? "")}</div><h1 id="${sid}-title" class="title" style="font-size:88px">${words(s.caption)}</h1></div>`);
    fadeUp(`#${sid}-kicker`, enter, 0.25);
    titleIn(`#${sid}-title`, enter + 0.2);
    const t0 = enter + 1.4;
    const items = s.items ?? [];
    const totalAt = Math.max(cueTime(s, s.totalCue) ?? s.end - 3.2, t0 + items.length * 0.45 + 0.6);
    const step = Math.min(0.75, (totalAt - t0 - 0.5) / Math.max(1, items.length));
    const lines = items.map((it, k) => {
      const at = t0 + 0.6 + k * step;
      tw(`tl.fromTo("#${sid}-ln${k}", {opacity:0}, {keyframes:[{opacity:0.9, duration:0.06}, {opacity:0.15, duration:0.06}, {opacity:1, duration:0.12}]}, ${r2(at)});`);
      if (k % 2 === 0) sound("pop", r2(at + 0.05), 0.07);
      return `<div id="${sid}-ln${k}" class="ln" style="opacity:0"><span>${esc(it.k)}${it.note ? `<small>${esc(it.note)}</small>` : ""}</span><b>${esc(it.v)}</b></div>`;
    }).join("");
    parts.push(`<div id="${sid}-sg" class="sign" style="opacity:0"><i class="post l"></i><i class="post r"></i><div class="sign-in"><div class="sg-h"><svg viewBox="0 0 40 40" width="44" height="44"><path d="M20 2 L36 20 L26 20 L26 38 L14 38 L14 20 L4 20 Z" fill="#fff"/></svg>${esc(s.receiptTitle ?? "")}</div>${lines}<div id="${sid}-tot" class="ln tot" style="opacity:0"><span>TỔNG / NGƯỜI</span><b>${esc(s.total)}</b></div><div class="sg-f">${esc(s.note ?? "")}</div></div></div>`);
    tw(`tl.fromTo("#${sid}-sg", {opacity:0, y:-260, rotation:-5}, {opacity:1, y:0, rotation:0, duration:0.9, ease:"elastic.out(1, 0.6)"}, ${r2(t0)});`);
    tw(`tl.fromTo("#${sid}-tot", {opacity:0, scale:0.6}, {opacity:1, scale:1, duration:0.4, ease:"back.out(2)"}, ${r2(totalAt)});`);
    sound("impact-bass-1", r2(totalAt + 0.2), 0.1);
    parts.push(`<div id="${sid}-stamp" class="stamp" style="opacity:0">${esc(s.stamp ?? "")}</div>`);
    tw(`tl.fromTo("#${sid}-stamp", {opacity:0, scale:2.2, rotation:-24}, {opacity:1, scale:1, rotation:-8, duration:0.35, ease:"power4.in"}, ${r2(totalAt + 0.8)});`);
  } else {
    // Outro: a trip computer adds up the trip, then the big title settles on the drone footage.
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div id="${sid}-dim" class="hook-dim" style="opacity:0"></div>`);
    const stats = s.stats ?? [];
    const ICON = ["🌉", "🚡", "🛣️", "🌾"];
    const rows = stats.map(([k, v], i) => `<div id="${sid}-tr${i}" class="tr" style="opacity:0"><i>${ICON[i] ?? "•"}</i><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join("");
    parts.push(`<div id="${sid}-trip" class="trip" style="opacity:0"><div class="trip-h"><i></i>${esc(s.kicker ?? "")} · 2N1Đ</div>${rows}</div>`);
    tw(`tl.fromTo("#${sid}-trip", {opacity:0, y:60, scale:0.94}, {opacity:1, y:0, scale:1, duration:0.5, ease:"expo.out"}, ${r2(enter + 0.2)});`);
    stats.forEach((_, i) => {
      tw(`tl.fromTo("#${sid}-tr${i}", {opacity:0, x:-40}, {opacity:1, x:0, duration:0.3, ease:"power3.out"}, ${r2(enter + 0.7 + i * 0.5)});`);
      sound("pop", r2(enter + 0.75 + i * 0.5), 0.07);
    });
    const done = enter + 0.7 + stats.length * 0.5 + 1.6;
    tw(`tl.to("#${sid}-trip", {opacity:0, y:-80, scale:0.9, duration:0.5, ease:"power3.in"}, ${r2(done)});`);
    tw(`tl.to("#${sid}-dim", {opacity:1, duration:0.6}, ${r2(done + 0.2)});`);
    parts.push(`<h1 id="${sid}-title" class="hook-title out" style="opacity:0">${words(s.caption)}</h1>`);
    tw(`tl.fromTo("#${sid}-title", {scale:1.2, opacity:0}, {scale:1, opacity:1, duration:0.9, ease:"expo.out", immediateRender:false}, ${r2(done + 0.35)});`);
    parts.push(`<div id="${sid}-cta" class="pill" style="background:${video.theme.accent};top:1250px;opacity:0">${esc(s.cta ?? "")}</div>`);
    fadeUp(`#${sid}-cta`, done + 0.9);
    sound("impact-bass-1", r2(done + 0.4), 0.09);
  }

  html.push(`<section id="${sid}" class="scene"${s.i === 0 ? "" : ' style="opacity:0"'}>${parts.join("")}</section>`);
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
    if (line.length && (len > 30 || /[.,!?]$/.test(line.at(-1).text.trim()))) flush(w.startMs);
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
const SHADERS = ["cinematic-zoom", "cross-warp-morph", "domain-warp", "flash-through-white"];
const transitions = scenes.slice(1).map((s, k) => ({
  time: r2(s.start - SEAM / 2),
  shader: k === scenes.length - 2 ? "sdf-iris" : SHADERS[k % SHADERS.length],
  duration: SEAM,
}));
for (const tr of transitions) sound("whoosh-short", r2(tr.time - 0.1), 0.15);

// ---- cold sea mist drifting across everything ----------------------------
// [top, width, height, opacity, drift]: wide soft bands that slide sideways over the whole video.
const MIST = [[180, 1500, 420, 0.13, 260], [760, 1700, 520, 0.1, -320], [1260, 1600, 460, 0.12, 300], [1600, 1400, 380, 0.09, -240]];
const mist = MIST.map(([top, w, h, op, dx], k) => {
  tw(`tl.fromTo("#mist${k}", {x:${dx > 0 ? -dx : -dx}, opacity:${op}}, {x:${dx}, opacity:${op}, duration:${total}, ease:"none"}, 0);`);
  return `<i id="mist${k}" class="mist" style="top:${top}px;left:${r2((W - w) / 2)}px;width:${w}px;height:${h}px" data-layout-ignore></i>`;
});

// ---- page ---------------------------------------------------------------
const page = `<!doctype html>
<html lang="vi">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=${W}, height=${H}" />
<title>${esc(video.title)}</title>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@hyperframes/shader-transitions@0.8.223/dist/index.global.js"></script>
<style>
:root { --ground:#0b1d26; --ink:#f6f8f8; --aqua:#4fd1c5; --aquad:#1e8c86; --sun:#ffd36e; --coral:#ff7a8a; --slate:#1f2a33; --sign:#0b6e3f; }
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:${W}px; height:${H}px; overflow:hidden; background:var(--ground); }
#root { position:relative; width:${W}px; height:${H}px; overflow:hidden; font-family:"Montserrat"; }
.scene { position:absolute; inset:0; overflow:hidden; background:var(--ground); z-index:1; }
.ph { position:absolute; inset:0; overflow:hidden; }
.ph img, .ph video { width:100%; height:100%; object-fit:cover; display:block; }
.ph.pano img { position:absolute; left:50%; top:0; width:auto; height:100%; max-width:none; }
/* Windscreen wiper reveal: a conic mask pivoting at the bottom centre opens with the blade. */
.ph.wipe { --a:0deg; -webkit-mask-image:conic-gradient(from -90deg at 50% 100%, #000 0deg, #000 var(--a), transparent calc(var(--a) + 0.6deg)); mask-image:conic-gradient(from -90deg at 50% 100%, #000 0deg, #000 var(--a), transparent calc(var(--a) + 0.6deg)); }
.wiper { position:absolute; left:${W / 2 - 9}px; bottom:-40px; width:18px; height:2300px; z-index:3; transform-origin:50% 100%; border-radius:9px; background:linear-gradient(90deg, #0c1216 0%, #2b3640 45%, #0c1216 100%); box-shadow:0 0 30px rgba(0,0,0,0.55); }
.shade { position:absolute; inset:0; background:linear-gradient(180deg, rgba(6,18,24,0.18) 0%, rgba(6,18,24,0) 35%, rgba(6,18,24,0) 65%, rgba(6,18,24,0.35) 100%); }
.top { position:absolute; left:0; right:0; top:0; height:760px; background:linear-gradient(180deg, rgba(6,20,28,0.9) 0%, rgba(6,20,28,0.6) 55%, rgba(6,20,28,0) 100%); }
.floor { position:absolute; left:0; right:0; bottom:0; height:900px; background:linear-gradient(180deg, rgba(6,20,28,0) 0%, rgba(6,20,28,0.6) 45%, rgba(6,20,28,0.93) 100%); }
.hook-dim { position:absolute; inset:0; z-index:4; background:linear-gradient(180deg, rgba(6,20,28,0.45) 0%, rgba(6,20,28,0.2) 50%, rgba(6,20,28,0.85) 100%); }
/* Cold mist drifting sideways. */
.mist { position:absolute; z-index:16; border-radius:50%; background:radial-gradient(ellipse at center, rgba(235,245,250,0.9) 0%, rgba(235,245,250,0.35) 40%, rgba(235,245,250,0) 70%); filter:blur(30px); pointer-events:none; }
/* Intro: phone navigation. */
.nav { position:absolute; inset:0; z-index:5; transform-origin:800px 1630px; }
.navsvg { position:absolute; left:0; top:0; }
.navpin { position:absolute; left:770px; top:1540px; width:60px; height:90px; }
.navpin i { position:absolute; left:0; top:0; width:60px; height:60px; border-radius:50% 50% 50% 0; transform:rotate(-45deg); background:var(--coral); box-shadow:0 8px 16px rgba(0,0,0,0.45); }
.navpin i::after { content:""; position:absolute; left:19px; top:19px; width:22px; height:22px; border-radius:50%; background:#fff; }
.navcar { position:absolute; left:0; top:0; width:44px; height:44px; border-radius:50%; background:#fff; border:9px solid #2f80ff; box-shadow:0 0 0 12px rgba(47,128,255,0.25), 0 6px 14px rgba(0,0,0,0.4); }
.navban { position:absolute; left:50px; right:50px; top:150px; height:200px; z-index:7; border-radius:30px; background:#0f8a5f; box-shadow:0 20px 40px rgba(0,0,0,0.45); }
.navstep { position:absolute; inset:0; display:flex; align-items:center; gap:30px; padding:0 40px; }
.navstep b { display:block; font:900 72px/1 "Montserrat"; color:#fff; }
.navstep em { display:block; margin-top:8px; font:700 36px "Montserrat"; font-style:normal; color:rgba(255,255,255,0.92); white-space:nowrap; }
.naveta { position:absolute; left:50px; right:50px; bottom:120px; z-index:7; padding:30px 40px; border-radius:30px; background:rgba(8,20,26,0.92); font:800 40px "Montserrat"; color:#fff; box-shadow:0 18px 40px rgba(0,0,0,0.45); display:flex; align-items:center; gap:24px; }
.naveta i { width:26px; height:26px; border-radius:50%; background:var(--aqua); box-shadow:0 0 18px var(--aqua); }
.hook-kicker { position:absolute; left:0; right:0; top:1090px; text-align:center; font:700 32px "Montserrat"; letter-spacing:0.3em; color:var(--sun); z-index:7; }
.hook-title { position:absolute; left:0; right:0; top:1150px; text-align:center; font:900 190px/1 "Playfair Display"; color:var(--ink); text-shadow:0 10px 60px rgba(0,0,0,0.6); z-index:7; }
.hook-title.out { top:980px; font-size:112px; padding:0 60px; }
.hook-title .w, .title .w { display:inline-block; }
.pill { position:absolute; left:50%; transform:translateX(-50%); font:900 48px "Montserrat"; color:var(--slate); padding:12px 40px; border-radius:999px; white-space:nowrap; z-index:8; }
/* Speedometer badge (stop marker). */
.gauge { position:absolute; right:36px; top:70px; width:320px; height:356px; z-index:6; padding:14px 10px 0; border-radius:34px; background:rgba(6,20,28,0.72); border:3px solid rgba(255,255,255,0.18); box-shadow:0 18px 36px rgba(0,0,0,0.45); text-align:center; }
.gauge svg { display:block; margin:0 auto; }
.gauge b { display:block; margin-top:2px; font:900 46px/1 "Montserrat"; color:#fff; white-space:nowrap; }
.gauge em { display:block; margin-top:8px; font:800 28px "Montserrat"; font-style:normal; letter-spacing:0.16em; white-space:nowrap; }
.gauge small { display:block; margin-top:8px; font:700 24px "Montserrat"; color:rgba(255,255,255,0.65); letter-spacing:0.08em; }
.head { position:absolute; left:80px; top:215px; width:600px; display:flex; flex-direction:column; gap:10px; z-index:5; }
.kicker { font:700 32px "Montserrat"; letter-spacing:0.28em; }
.title { margin-bottom:10px; font:800 104px/1.04 "Playfair Display"; color:var(--ink); text-shadow:0 6px 30px rgba(0,0,0,0.55); }
.point { font:600 37px/1.3 "Montserrat"; color:rgba(246,248,248,0.93); text-shadow:0 2px 14px rgba(0,0,0,0.7); }
.point i { display:inline-block; width:16px; height:16px; border-radius:50%; margin-right:18px; vertical-align:middle; }
/* White cards with an aqua-to-sun edge, in the lower third. */
.card { position:absolute; left:60px; width:960px; top:1110px; padding:30px 34px 16px 50px; border-radius:18px; background:rgba(255,255,255,0.97); box-shadow:0 18px 40px rgba(0,0,0,0.45); z-index:7; overflow:hidden; }
.card::before { content:""; position:absolute; left:0; top:0; bottom:0; width:16px; background:linear-gradient(180deg, var(--aqua), var(--sun)); }
.card-h { font:800 28px "Montserrat"; letter-spacing:0.2em; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; color:var(--aquad); }
.card-t { font:600 40px/1.3 "Montserrat"; color:var(--slate); }
.card-n { font:600 32px/1.3 "Montserrat"; color:rgba(31,42,51,0.72); margin-bottom:6px; }
.dots i { display:inline-block; width:12px; height:12px; border-radius:50%; margin-left:10px; background:rgba(31,42,51,0.2); }
.dots i.on { background:var(--aquad); }
.row { display:flex; align-items:baseline; gap:16px; padding:8px 0; border-top:1px solid rgba(31,42,51,0.14); border-radius:10px; }
.row b { font:800 36px "Montserrat"; color:var(--slate); white-space:nowrap; }
.row span { font:500 28px "Montserrat"; color:rgba(31,42,51,0.6); flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.row em { font:800 27px "Montserrat"; font-style:normal; color:var(--slate); padding:4px 14px; border-radius:999px; white-space:nowrap; box-shadow:inset 0 0 0 2px rgba(31,42,51,0.25); }
/* Google Maps screenshot chip above the restaurant card. */
.gmaps { position:absolute; left:400px; width:620px; bottom:830px; border-radius:22px; overflow:hidden; background:#fff; box-shadow:0 16px 40px rgba(0,0,0,0.5); z-index:8; }
.gmaps-h { display:flex; align-items:center; gap:10px; padding:12px 22px; background:#f1f3f4; font:700 24px "Montserrat"; color:#3c4043; }
.gmaps-h i { font-style:normal; }
.gmaps-h span { margin-left:auto; font:500 20px "Montserrat"; color:#70757a; }
.gmaps img { display:block; width:100%; border-top:1px solid #e8eaed; }
/* Road rail with a little car, under the subtitles. */
.rail { position:absolute; left:0; right:0; top:1676px; height:46px; z-index:20; }
.rail .road { position:absolute; left:220px; right:220px; top:13px; height:20px; border-radius:10px; background:rgba(20,30,36,0.75); box-shadow:inset 0 0 0 2px rgba(255,255,255,0.25); }
.rail .road::after { content:""; position:absolute; left:14px; right:14px; top:9px; height:2px; background:repeating-linear-gradient(90deg, rgba(255,255,255,0.6) 0 14px, rgba(255,255,255,0) 14px 26px); }
.rail i { position:absolute; top:11px; width:24px; height:24px; margin-left:-3px; border-radius:50%; background:#3a4a54; border:3px solid rgba(255,255,255,0.55); }
.rail i.done { background:#fff; }
.car { position:absolute; top:-22px; width:52px; height:30px; border-radius:12px 16px 6px 6px; background:var(--coral); box-shadow:0 6px 12px rgba(0,0,0,0.4); }
.car::before, .car::after { content:""; position:absolute; bottom:-8px; width:16px; height:16px; border-radius:50%; background:#11181d; border:3px solid #cfd8dc; }
.car::before { left:6px; } .car::after { right:6px; }
/* Cost: a green highway sign on two posts. */
.sign { position:absolute; left:60px; width:960px; top:560px; z-index:7; transform-origin:50% 0%; }
.post { position:absolute; top:200px; width:30px; height:1300px; background:linear-gradient(90deg, #6d7a82, #c4ccd1 50%, #6d7a82); z-index:-1; }
.post.l { left:150px; } .post.r { right:150px; }
.sign-in { padding:30px 44px 24px; border-radius:22px; background:var(--sign); border:8px solid #fff; outline:6px solid var(--sign); box-shadow:0 26px 50px rgba(0,0,0,0.55); font-family:"Montserrat"; }
.sg-h { display:flex; align-items:center; gap:18px; font:900 34px "Montserrat"; letter-spacing:0.06em; color:#fff; padding-bottom:12px; margin-bottom:6px; border-bottom:4px solid rgba(255,255,255,0.85); }
.ln { display:flex; justify-content:space-between; align-items:center; gap:20px; padding:11px 0; border-bottom:2px solid rgba(255,255,255,0.18); }
.ln span { font:800 32px/1.15 "Montserrat"; color:#fff; }
.ln span small { display:block; font:600 22px "Montserrat"; color:rgba(255,255,255,0.7); margin-top:3px; }
.ln b { font:900 34px "Montserrat"; color:var(--sign); background:var(--sun); padding:4px 16px; border-radius:10px; white-space:nowrap; }
.ln.tot { margin-top:14px; padding:16px 22px; border:none; border-radius:16px; background:var(--sun); }
.ln.tot span { font:900 30px "Montserrat"; letter-spacing:0.12em; color:var(--sign); }
.ln.tot b { font:900 54px "Montserrat"; background:none; padding:0; }
.sg-f { margin-top:12px; font:600 21px "Montserrat"; color:rgba(255,255,255,0.7); }
.stamp { position:absolute; right:40px; top:470px; z-index:9; padding:8px 18px; border:5px solid var(--coral); border-radius:12px; color:var(--coral); font:900 28px "Montserrat"; letter-spacing:0.06em; background:rgba(255,255,255,0.9); }
/* Outro: trip computer. */
.trip { position:absolute; left:90px; right:90px; top:520px; z-index:8; padding:34px 40px 20px; border-radius:30px; background:rgba(6,20,28,0.82); border:3px solid rgba(79,209,197,0.6); box-shadow:0 24px 50px rgba(0,0,0,0.5); }
.trip-h { display:flex; align-items:center; gap:16px; font:800 30px "Montserrat"; letter-spacing:0.18em; color:var(--aqua); margin-bottom:12px; }
.trip-h i { width:20px; height:20px; border-radius:50%; background:var(--aqua); box-shadow:0 0 16px var(--aqua); }
.tr { display:flex; align-items:center; gap:22px; padding:18px 0; border-top:2px solid rgba(255,255,255,0.12); }
.tr i { font-style:normal; font-size:48px; width:64px; text-align:center; }
.tr span { flex:1; font:700 38px "Montserrat"; color:#fff; }
.tr b { font:900 46px "Montserrat"; color:var(--sun); white-space:nowrap; }
.brand { position:absolute; left:60px; top:60px; z-index:21; font:800 26px "Montserrat"; letter-spacing:0.3em; color:rgba(246,248,248,0.85); text-shadow:0 2px 10px rgba(0,0,0,0.5); }
.brand b { color:var(--aqua); letter-spacing:0; margin-right:12px; }
.cap { position:absolute; left:60px; right:60px; top:1500px; text-align:center; font:800 50px/1.25 "Montserrat"; color:#ffffff; text-shadow:0 3px 0 rgba(0,0,0,0.55), 0 0 22px rgba(0,0,0,0.85); z-index:20;${cover ? " display:none;" : ""} }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="${W}" data-height="${H}">
${media.join("\n")}
${sfx.join("\n")}
${html.join("\n")}
${mist.join("\n")}
<div class="brand" data-layout-ignore><b>◆</b>${esc(brand)}</div>
${caps.join("\n")}
</div>
<script>
const tl = gsap.timeline({ paused: true });
${js.join("\n")}
HyperShader.init({
  bgColor: "#0b1d26",
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
