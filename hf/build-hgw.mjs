#!/usr/bin/env node
/**
 * node hf/build-hgw.mjs --slug ha-giang-3n2d [--cover]
 *
 * Turns data/videos/<slug>/video.json + voiceover.json into a HyperFrames project at
 * build/<slug>/. The look ("Hà Giang · mùa tam giác mạch", remake of 15/11/2026), new for this channel
 * (checked against D:/Thang_space_archive/STYLE-LOG.md):
 *   - intro: a film-camera viewfinder; focus pulls, the shutter clicks three frames of real footage
 *     (frame counter 01 → 03), then the viewfinder flies off the hero drone shot and the title lands;
 *   - real footage (Pexels clips of Hà Giang) mixed with the photos;
 *   - photos change through wooden shutters (two louvred panels close and swing open), or a diagonal sweep;
 *   - each stop gets a compass whose needle swings to the real bearing from the previous stop;
 *   - pink buckwheat petals drift across on the wind;
 *   - the stop rail is a strip of film; the lit frame steps to the current stop;
 *   - "Hết bao nhiêu tiền?" is a pocket calculator printing a paper tape, the display adding up;
 *   - outro: a strip of negatives scrolls past and each frame develops into colour, then three tips and the title;
 *   - shader seams: whip pan, ridged burn, thermal distortion, SDF iris, cinematic zoom.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fail, parseArgs, requireSlug } from "../scripts/lib/args.mjs";
import { probeDurationSec } from "../scripts/lib/media.mjs";
import { PROJECT_ROOT, PUBLIC_ROOT } from "../scripts/lib/paths.mjs";

const { flags } = parseArgs(process.argv.slice(2));
const slug = requireSlug(flags, "build-hgw");
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
const brand = video.theme.brand ?? "HÀ GIANG";

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
const media = (src, id, from, dur) =>
  src.endsWith(".mp4")
    ? `<video id="${id}-v" class="clip" src="${asset(src)}" muted playsinline data-start="${r2(Math.max(0, from))}" data-duration="${r2(Math.min(dur, total - Math.max(0, from)))}" data-track-index="${videoTrack++}"></video>`
    : `<img src="${asset(src)}" alt="" />`;

/**
 * Photo (or footage) stack. The first change in a scene goes through wooden shutters: two louvred panels
 * close over the old picture and swing open on the new one. The second sweeps in along a diagonal; later
 * ones dissolve.
 */
const photos = (s, from, to, idPrefix) => {
  const g = s.gallery ?? [];
  const seg = (to - from) / g.length;
  const parts = [];
  g.forEach((src, k) => {
    const id = `${idPrefix}-p${k}`;
    const a = r2(from + seg * k);
    const mv = MOVES[(s.i + k) % MOVES.length];
    const isVideo = src.endsWith(".mp4");
    const inner = media(src, id, a - 0.9, seg + 1.8);
    tw(`tl.fromTo("#${id} ${isVideo ? "video" : "img"}", {${isVideo ? "scale:1.02" : mv.from}}, {${isVideo ? "scale:1.1" : mv.to}, duration:${r2(seg + 0.8)}, ease:"none"}, ${a});`);
    if (k === 0) return parts.push(`<div id="${id}" class="ph">${inner}</div>`);
    tw(`tl.set("#${id}", {opacity:0}, 0);`);
    if (k === 1) {
      const sh = `${idPrefix}-sh`;
      tw(`tl.fromTo("#${sh}-l", {xPercent:-100, rotationY:0}, {xPercent:0, duration:0.32, ease:"power2.in", immediateRender:false}, ${r2(a - 0.34)});`);
      tw(`tl.fromTo("#${sh}-r", {xPercent:100, rotationY:0}, {xPercent:0, duration:0.32, ease:"power2.in", immediateRender:false}, ${r2(a - 0.34)});`);
      tw(`tl.set("#${sh}", {opacity:1}, ${r2(a - 0.34)});`);
      tw(`tl.set("#${id}", {opacity:1}, ${a});`);
      tw(`tl.set("#${idPrefix}-p${k - 1}", {opacity:0}, ${r2(a + 0.02)});`);
      tw(`tl.to("#${sh}-l", {rotationY:-112, duration:0.7, ease:"power2.out"}, ${r2(a + 0.05)});`);
      tw(`tl.to("#${sh}-r", {rotationY:112, duration:0.7, ease:"power2.out"}, ${r2(a + 0.05)});`);
      tw(`tl.set("#${sh}", {opacity:0}, ${r2(a + 0.78)});`);
      sound("whoosh-short", r2(a - 0.36), 0.08);
      sound("pop", r2(a - 0.03), 0.06);
      parts.push(`<div id="${id}" class="ph">${inner}</div>`);
      parts.push(`<div id="${sh}" class="shutter" style="opacity:0"><div id="${sh}-l" class="leaf l"><i class="knob"></i></div><div id="${sh}-r" class="leaf r"><i class="knob"></i></div></div>`);
      return;
    }
    if (k === 2) {
      tw(`tl.fromTo("#${id}", {opacity:1, "--w":"0%"}, {"--w":"150%", duration:0.85, ease:"power2.inOut", immediateRender:false}, ${a});`);
      tw(`tl.set("#${idPrefix}-p${k - 1}", {opacity:0}, ${r2(a + 0.87)});`);
      // Diagonal sweep: clipped to a slanted edge that runs left to right (inline, so only these 6 layers count as heavy).
      return parts.push(`<div id="${id}" class="ph" style="--w:0%;clip-path:polygon(0 0, var(--w) 0, calc(var(--w) - 40%) 100%, 0 100%)">${inner}</div>`);
    }
    // Later pictures dissolve in while settling, so the capture carries few clip-path layers.
    tw(`tl.fromTo("#${id}", {opacity:0, scale:1.06}, {opacity:1, scale:1, duration:0.7, ease:"power2.out", immediateRender:false}, ${a});`);
    tw(`tl.set("#${idPrefix}-p${k - 1}", {opacity:0}, ${r2(a + 0.72)});`);
    parts.push(`<div id="${id}" class="ph">${inner}</div>`);
  });
  return parts.join("");
};

const titleIn = (sel, at) =>
  tw(`tl.fromTo("${sel} .w", {opacity:0, y:30}, {opacity:1, y:0, duration:0.5, stagger:0.08, ease:"power3.out"}, ${r2(at)});`);
const fadeUp = (sel, at, dur = 0.35) =>
  tw(`tl.fromTo("${sel}", {opacity:0, y:26}, {opacity:1, y:0, duration:${dur}, ease:"expo.out"}, ${r2(at)});`);

// ---- compass badge ------------------------------------------------------
const START = { lat: 22.8233, lng: 104.9836 }; // Km0, TP Hà Giang
/** Initial bearing in degrees (0 = north, clockwise) from a to b. */
const bearing = (a, b) => {
  const toR = (x) => (x * Math.PI) / 180;
  const y = Math.sin(toR(b.lng - a.lng)) * Math.cos(toR(b.lat));
  const x = Math.cos(toR(a.lat)) * Math.sin(toR(b.lat)) - Math.sin(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.cos(toR(b.lng - a.lng));
  return Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360);
};
const DIRS = ["BẮC", "ĐÔNG BẮC", "ĐÔNG", "ĐÔNG NAM", "NAM", "TÂY NAM", "TÂY", "TÂY BẮC"];
/** Compass: the rose spins in, the needle swings past and settles on the bearing; under it the day and a note. */
const compass = (sid, deg, top, bottom, at) => {
  tw(`tl.fromTo("#${sid}-cp", {opacity:0, scale:0.4, rotation:-40}, {opacity:1, scale:1, rotation:0, duration:0.6, ease:"back.out(1.6)"}, ${r2(at)});`);
  tw(`tl.fromTo("#${sid}-nd", {rotation:${deg + 210}}, {rotation:${deg}, duration:1.4, ease:"elastic.out(1, 0.35)"}, ${r2(at + 0.25)});`);
  tw(`tl.fromTo("#${sid}-cp .cp-t", {opacity:0, y:12}, {opacity:1, y:0, duration:0.3, stagger:0.1, ease:"power3.out"}, ${r2(at + 0.55)});`);
  sound("pop", r2(at + 0.3), 0.08);
  const ticks = Array.from({ length: 24 }, (_, k) => `<i style="transform:rotate(${k * 15}deg)" class="${k % 6 ? "" : "big"}"></i>`).join("");
  return `<div id="${sid}-cp" class="compass" style="opacity:0"><div class="rose">${ticks}<b class="n">B</b><b class="e">Đ</b><b class="s">N</b><b class="w">T</b><svg id="${sid}-nd" class="needle" viewBox="-20 -100 40 200" width="40" height="200"><path d="M0 -92 L13 0 L-13 0 Z" fill="#e2465f"/><path d="M0 92 L13 0 L-13 0 Z" fill="#e9e4da"/><circle r="8" fill="#2b2f35"/></svg></div><div class="cp-t cp-top">${esc(top)}</div>${bottom ? `<div class="cp-t cp-bot">${esc(bottom)}</div>` : ""}</div>`;
};

const row = (p, accent) => `<div class="row"><b>${esc(p.place)}</b><span>${esc(p.address)}</span><em style="background:${p.rating == null ? "rgba(27,36,64,0.12)" : accent}">${star(p.rating)}</em></div>`;

// Google Maps screenshots (name + stars + review count), captured 15/11/2026 into public/videos/ha-giang/maps-1511.
const MAPS = video.maps ?? {};
const MAPS_DATE = "chụp 15/11/2026";

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
const hideOut = (sel, at) => tw(`tl.to("${sel}", {opacity:0, y:30, duration:0.4, ease:"power2.in"}, ${r2(at)});`);

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
    tw(`tl.fromTo(document.querySelectorAll("${rowsSel}")[${k}], {backgroundColor:"rgba(242,141,187,0)"}, {backgroundColor:"rgba(242,141,187,0.35)", duration:0.25, yoyo:true, repeat:1, repeatDelay:${r2(Math.max(slot - 0.5, 0.2))}}, ${r2(t0)});`);
  });
  return `<div id="${id}" class="gmaps" style="opacity:0"><div class="gmaps-h"><i>📍</i>Google Maps<span>${MAPS_DATE}</span></div>${list.map(([m, k]) => `<img id="${id}-${k}" src="${asset(`videos/ha-giang/maps-1511/${m}.png`)}" alt="" />`).join("")}</div>`;
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
    tw(`tl.fromTo("#${id}", {opacity:0, y:50}, {opacity:1, y:0, duration:0.45, ease:"expo.out"}, ${r2(times[k] - 0.05)});`);
    if (k < cards.length - 1) tw(`tl.to("#${id}", {opacity:0, y:-30, duration:0.2, ease:"power3.in"}, ${r2(times[k + 1] - 0.22)});`);
    else if (s.end - times[k] > 3.2) hideOut(`#${id}`, s.end - 1.1);
    if (c.rows) tw(`tl.fromTo("#${id} .row", {opacity:0, x:-40}, {opacity:1, x:0, duration:0.3, stagger:0.09, ease:"power3.out"}, ${r2(times[k] + 0.15)});`);
  });
  return parts.join("");
};

// ---- film-camera viewfinder intro ------------------------------------------
/**
 * The hook's first clips are seen through a viewfinder. Each "shot": the image is soft, the focus pulls
 * sharp, the shutter blades snap shut and open on the next clip, and the frame counter advances. After the
 * last shot the viewfinder flies off and the hero clip (then a still) carries the title.
 */
const viewfinder = (s, sid) => {
  const a = s.start;
  const g = s.gallery ?? [];
  const nShots = Math.min(3, g.length - 1);
  const shotAt = Array.from({ length: nShots }, (_, k) => a + 0.95 + k * 1.05); // shutter clicks
  const heroAt = shotAt.at(-1) + 0.08;
  const ends = [...shotAt, heroAt + 7.3, s.end]; // when each gallery item stops being shown
  const starts = [a, ...shotAt.map((x) => x + 0.08)];
  starts.push(heroAt + 7.1);
  const parts = [];
  g.forEach((src, k) => {
    const id = `${sid}-p${k}`;
    const from = k === 0 ? a : starts[k];
    const until = k < g.length - 1 ? ends[k] : s.end;
    const isVideo = src.endsWith(".mp4");
    parts.push(`<div id="${id}" class="ph"${k ? ' style="opacity:0"' : ""}>${media(src, id, from, until - from + 0.6)}</div>`);
    if (k) tw(`tl.set("#${id}", {opacity:1}, ${r2(from)});`);
    if (k < g.length - 1) tw(`tl.set("#${id}", {opacity:0}, ${r2(until + (k >= nShots ? 0.6 : 0.02))});`);
    if (k > nShots && k === g.length - 1) tw(`tl.fromTo("#${id}", {opacity:0}, {opacity:1, duration:0.6, immediateRender:false}, ${r2(from)});`);
    tw(`tl.fromTo("#${id} ${isVideo ? "video" : "img"}", {scale:${k >= nShots ? 1.12 : 1.04}}, {scale:${k >= nShots ? 1.02 : 1.1}, duration:${r2(until - from + 0.6)}, ease:"none"}, ${r2(from)});`);
    if (k < nShots) tw(`tl.fromTo("#${id}", {filter:"blur(9px)"}, {filter:"blur(0px)", duration:0.45, ease:"power2.out"}, ${r2(from + 0.15)});`);
  });
  const vf = `${sid}-vf`;
  const labels = s.shots ?? [];
  parts.push(`<div id="${vf}" class="vf"><i class="br tl"></i><i class="br tr"></i><i class="br bl"></i><i class="br brr"></i><div class="af"><i></i></div>` +
    `<div class="vf-top"><span>● ${esc(brand)}</span><span class="fc">${Array.from({ length: nShots }, (_, k) => `<b id="${vf}-n${k}" style="opacity:${k ? 0 : 1}">${String(k + 1).padStart(2, "0")}</b>`).join("")}<em>/36</em></span></div>` +
    `<div class="vf-bot"><span>ISO 400</span><span>f/8</span><span>1/250</span><span class="lb">${labels.map((l, k) => `<b id="${vf}-l${k}" style="opacity:${k ? 0 : 1}">${esc(l)}</b>`).join("")}</span></div>` +
    `<div id="${vf}-bt" class="blade top"></div><div id="${vf}-bb" class="blade bot"></div><div id="${vf}-fl" class="flash"></div></div>`);
  tw(`tl.fromTo("#${vf}", {opacity:0, scale:1.06}, {opacity:1, scale:1, duration:0.45, ease:"power2.out"}, ${r2(a + 0.05)});`);
  tw(`tl.fromTo("#${vf} .af", {scale:1.5, opacity:0}, {scale:1, opacity:1, duration:0.4, ease:"back.out(2)"}, ${r2(a + 0.35)});`);
  shotAt.forEach((at, k) => {
    tw(`tl.to("#${vf}-bt", {keyframes:[{height:"50.5%", duration:0.07, ease:"power3.in"}, {height:"0%", duration:0.16, ease:"power2.out"}]}, ${r2(at)});`);
    tw(`tl.to("#${vf}-bb", {keyframes:[{height:"50.5%", duration:0.07, ease:"power3.in"}, {height:"0%", duration:0.16, ease:"power2.out"}]}, ${r2(at)});`);
    tw(`tl.to("#${vf}-fl", {keyframes:[{opacity:0.55, duration:0.05}, {opacity:0, duration:0.25}]}, ${r2(at + 0.06)});`);
    tw(`tl.fromTo("#${vf} .af", {scale:1.25}, {scale:1, duration:0.35, ease:"back.out(2.5)", immediateRender:false}, ${r2(at + 0.1)});`);
    if (k + 1 < nShots) {
      tw(`tl.set("#${vf}-n${k}", {opacity:0}, ${r2(at + 0.08)});`);
      tw(`tl.set("#${vf}-n${k + 1}", {opacity:1}, ${r2(at + 0.08)});`);
      tw(`tl.set("#${vf}-l${k}", {opacity:0}, ${r2(at + 0.08)});`);
      tw(`tl.set("#${vf}-l${k + 1}", {opacity:1}, ${r2(at + 0.08)});`);
    }
    sound("pop", r2(at), 0.12);
  });
  tw(`tl.to("#${vf}", {opacity:0, scale:1.7, duration:0.6, ease:"power2.in"}, ${r2(heroAt + 0.1)});`);
  sound("whoosh-cinematic", r2(heroAt), 0.12);
  return { html: parts.join(""), settle: r2(heroAt + 0.55) };
};

// ---- buckwheat petals drifting on the wind ----------------------------------
const PETAL = "M0 -16 C 9 -14, 12 -4, 0 14 C -12 -4, -9 -14, 0 -16 Z";
const PETAL_COLORS = ["#f6b8d3", "#f28dbb", "#fbe3ee", "#e874a8", "#ffffff"];
const petals = [];
for (let k = 0; k < 13; k++) {
  const y0 = 120 + ((k * 331) % 1500);
  const size = 0.7 + ((k * 37) % 7) / 10;
  const dur = 8 + ((k * 13) % 6);
  const color = PETAL_COLORS[k % PETAL_COLORS.length];
  petals.push(`<svg id="pt${k}" class="petal" viewBox="-16 -18 32 34" width="${r2(30 * size)}" height="${r2(32 * size)}" style="top:${y0}px" data-layout-ignore><path d="${PETAL}" fill="${color}" opacity="0.92"/></svg>`);
  for (let at = (k * 0.85) % 5, n = 0; at < total; at += dur, n++) {
    const lift = -(140 + ((k * 29) % 220));
    tw(`tl.fromTo("#pt${k}", {x:-60, y:0, rotation:${(k * 47) % 360}}, {keyframes:[{x:${W * 0.35}, y:${r2(lift * 0.3 + 40)}, duration:${r2(dur * 0.35)}, ease:"sine.inOut"}, {x:${W * 0.7}, y:${r2(lift * 0.65)}, duration:${r2(dur * 0.35)}, ease:"sine.inOut"}, {x:${W + 60}, y:${lift}, duration:${r2(dur * 0.3)}, ease:"sine.in"}], rotation:${((k * 47) % 360) + (k % 2 ? 540 : -540)}, immediateRender:${n === 0}}, ${r2(at)});`);
  }
}

// ---- scenes -------------------------------------------------------------
const PART = { "SÁNG": "SÁNG", "TRƯA": "TRƯA", "CHIỀU": "CHIỀU", "CHIỀU MUỘN": "CHIỀU MUỘN", "TỐI": "TỐI" };
for (const s of scenes) {
  const sid = `s-${s.id}`;
  const a = s.start;
  const enter = a + LEAD;
  const accent = s.accent ?? video.theme.accent;
  const parts = [];

  if (s.layout === "hook") {
    const m = viewfinder(s, sid);
    parts.push(m.html);
    parts.push(`<div id="${sid}-dim" class="hook-dim" style="opacity:0"></div>`);
    parts.push(`<div id="${sid}-kicker" class="hook-kicker" style="opacity:0">${esc(s.kicker)}</div>`);
    parts.push(`<h1 id="${sid}-title" class="hook-title" style="opacity:0">${words(s.caption)}</h1>`);
    parts.push(`<div id="${sid}-pill" class="pill" style="background:${accent};top:1370px;opacity:0">${esc(s.label ?? "")}</div>`);
    tw(`tl.to("#${sid}-dim", {opacity:1, duration:0.6}, ${m.settle});`);
    tw(`tl.fromTo("#${sid}-title", {scale:0.82, y:40, opacity:0}, {scale:1, y:0, opacity:1, duration:1.1, ease:"expo.out", immediateRender:false}, ${m.settle});`);
    fadeUp(`#${sid}-kicker`, m.settle + 0.3);
    fadeUp(`#${sid}-pill`, m.settle + 0.6);
  } else if (s.layout === "point") {
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div class="floor"></div>`);
    const idx = stops.findIndex((x) => x.id === s.id);
    const prev = idx > 0 ? stops[idx - 1].geo : START;
    const deg = s.geo ? bearing(prev, s.geo) : 0;
    const [day, part] = s.label.split("·").map((x) => x.trim().toUpperCase());
    parts.push(compass(sid, deg, `${day} · ${PART[part] ?? part}`, `${s.badge ?? ""} · ${DIRS[Math.round(deg / 45) % 8]}`, enter + 0.6));
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
    const named = cueTime(s, s.dishes?.[0]?.spokenAs ?? s.dishes?.[0]?.place) ?? a + (s.end - a) * 0.55;
    const cue = Math.max(Math.min(named, s.end - 3.0 - (s.dishes ?? []).length * 0.9 - 0.45), enter + CLEAR);
    parts.push(`<div id="${sid}-food" class="card"><div class="card-h">ĂN GẦN ĐÂY · ${esc(s.dishes?.[0]?.name ?? "")}</div>${(s.dishes ?? []).map((d) => row(d, accent)).join("")}</div>`);
    tw(`tl.fromTo("#${sid}-food", {opacity:0, y:60}, {opacity:1, y:0, duration:0.5, ease:"expo.out"}, ${r2(cue - 0.1)});`);
    tw(`tl.fromTo("#${sid}-food .row", {opacity:0, x:-40}, {opacity:1, x:0, duration:0.3, stagger:0.09, ease:"power3.out"}, ${r2(cue + 0.15)});`);
    const hide = clearAt(cue, (s.dishes ?? []).length, s.end);
    if (hide != null) hideOut(`#${sid}-food`, hide);
    parts.push(proofs(sid, `#${sid}-food .row`, s.dishes ?? [], cue, s.end, hide));
    // Film-strip rail under the subtitles: one frame per stop, the lit frame steps to this one.
    const xs = stops.map((_, k) => 290 + (500 * k) / Math.max(1, stops.length - 1));
    const frames = stops.map((x, k) => `<i class="${k < idx ? "done" : ""}" style="left:${r2(xs[k] - 34)}px">${k + 1}</i>`).join("");
    parts.push(`<div id="${sid}-rail" class="rail"><span class="film"></span>${frames}<b id="${sid}-cur" class="fcur" style="left:${r2(xs[Math.max(0, idx - 1)] - 40)}px"></b></div>`);
    fadeUp(`#${sid}-rail`, enter + 0.4);
    if (idx > 0) tw(`tl.fromTo("#${sid}-cur", {x:0}, {x:${r2(xs[idx] - xs[idx - 1])}, duration:0.7, ease:"steps(4)"}, ${r2(enter + 0.7)});`);
  } else if (s.layout === "stay") {
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div class="floor"></div>`);
    parts.push(compass(sid, 0, "Ở ĐÂU", "2 ĐÊM · LƯU TRÚ", enter + 0.6));
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
    // "Hết bao nhiêu tiền?": a pocket calculator. Each line: a key is pressed, the tape prints the item,
    // the display shows the running total (low–high); the total glows at the end.
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div class="floor"></div><div id="${sid}-veil" class="veil" style="opacity:0"></div>`);
    parts.push(`<div class="head"><div id="${sid}-kicker" class="kicker" style="color:${accent}">${esc(s.kicker ?? "")}</div><h1 id="${sid}-title" class="title" style="font-size:88px">${words(s.caption)}</h1></div>`);
    fadeUp(`#${sid}-kicker`, enter, 0.25);
    titleIn(`#${sid}-title`, enter + 0.2);
    const t0 = enter + 1.4;
    tw(`tl.fromTo("#${sid}-veil", {opacity:0}, {opacity:1, duration:0.5}, ${r2(t0 - 0.2)});`);
    const items = s.items ?? [];
    const totalAt = Math.max(cueTime(s, s.totalCue) ?? s.end - 3.2, t0 + items.length * 0.45 + 0.6);
    const step = Math.min(0.75, (totalAt - t0 - 0.5) / Math.max(1, items.length));
    const money = (n) => (n < 1000 ? `${n}k` : `${(n / 1000).toFixed(1).replace(".", ",")}tr`);
    let lo = 0, hi = 0;
    const shows = [`<b id="${sid}-d0" class="lcd-v">0</b>`];
    const KEYS = ["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "−", "0", ",", "=", "+"];
    const lines = items.map((it, k) => {
      const at = t0 + 0.6 + k * step;
      lo += it.n?.[0] ?? 0; hi += it.n?.[1] ?? 0;
      shows.push(`<b id="${sid}-d${k + 1}" class="lcd-v" style="opacity:0">${money(lo)}–${money(hi)}</b>`);
      tw(`tl.fromTo("#${sid}-ln${k}", {opacity:0, y:-20}, {opacity:1, y:0, duration:0.3, ease:"power3.out"}, ${r2(at)});`);
      tw(`tl.fromTo("#${sid}-tape", {y:0}, {y:${-(k + 1) * 6}, duration:0.3, ease:"power2.out", immediateRender:false}, ${r2(at)});`);
      tw(`tl.to("#${sid}-k15", {keyframes:[{scale:0.86, backgroundColor:"#ffd27a", duration:0.08}, {scale:1, backgroundColor:"#f28dbb", duration:0.2}]}, ${r2(at - 0.05)});`);
      tw(`tl.set("#${sid}-d${k}", {opacity:0}, ${r2(at + 0.05)});`);
      tw(`tl.set("#${sid}-d${k + 1}", {opacity:1}, ${r2(at + 0.05)});`);
      sound("pop", r2(at - 0.03), 0.06);
      return `<div id="${sid}-ln${k}" class="ln" style="opacity:0"><span>${esc(it.k)}${it.note ? `<small>${esc(it.note)}</small>` : ""}</span><b>${esc(it.v)}</b></div>`;
    }).join("");
    parts.push(`<div id="${sid}-tape" class="tape" style="opacity:0"><div class="tp-h">${esc(s.receiptTitle ?? "")}</div>${lines}<div class="tp-f">${esc(s.note ?? "")}</div></div>`);
    fadeUp(`#${sid}-tape`, t0);
    const keys = KEYS.map((k, i) => `<i id="${sid}-k${i}" class="${/[÷×−+=]/.test(k) ? "op" : ""}">${k}</i>`).join("");
    parts.push(`<div id="${sid}-calc" class="calc" style="opacity:0"><div class="slot"></div><div class="lcd"><small>VND</small>${shows.join("")}</div><div class="keys">${keys}</div><div class="calc-brand">HÀ GIANG · 3N2Đ</div></div>`);
    fadeUp(`#${sid}-calc`, t0 + 0.1);
    tw(`tl.to("#${sid}-k14", {keyframes:[{scale:0.86, backgroundColor:"#ffd27a", duration:0.08}, {scale:1, duration:0.2}]}, ${r2(totalAt - 0.1)});`);
    parts.push(`<div id="${sid}-tot" class="c-tot" style="opacity:0"><small>TỔNG / NGƯỜI</small>${esc(s.total)}</div>`);
    tw(`tl.fromTo("#${sid}-tot", {opacity:0, scale:0.6}, {opacity:1, scale:1, duration:0.4, ease:"back.out(2)"}, ${r2(totalAt)});`);
    sound("impact-bass-1", r2(totalAt + 0.2), 0.1);
    parts.push(`<div id="${sid}-stamp" class="stamp" style="opacity:0">${esc(s.stamp ?? "")}</div>`);
    tw(`tl.fromTo("#${sid}-stamp", {opacity:0, scale:2.2, rotation:-24}, {opacity:1, scale:1, rotation:-8, duration:0.35, ease:"power4.in"}, ${r2(totalAt + 0.8)});`);
  } else {
    // Outro: a strip of negatives scrolls past; each frame develops from negative to colour.
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div id="${sid}-dim" class="hook-dim" style="opacity:0"></div>`);
    tw(`tl.to("#${sid}-dim", {opacity:1, duration:0.6}, ${r2(enter)});`);
    const neg = s.negatives ?? [];
    const FW = 300, GAP = 40, stripW = neg.length * (FW + GAP) + 200;
    const frames = neg.map((p, k) => `<div class="nf" style="left:${100 + k * (FW + GAP)}px"><img id="${sid}-ng${k}" src="${asset(p.src)}" alt="" /><span>${String(k + 1).padStart(2, "0")} · ${esc(p.label)}</span></div>`).join("");
    parts.push(`<div id="${sid}-strip" class="negs" style="width:${stripW}px;opacity:0">${frames}</div>`);
    const scrollDur = 3.4;
    tw(`tl.fromTo("#${sid}-strip", {opacity:0, x:${W - 120}}, {opacity:1, x:${W - stripW + 40}, duration:${scrollDur}, ease:"power1.inOut"}, ${r2(enter + 0.1)});`);
    neg.forEach((_, k) => {
      const at = enter + 0.5 + k * ((scrollDur - 0.6) / neg.length);
      tw(`tl.fromTo("#${sid}-ng${k}", {filter:"invert(1) sepia(0.6) saturate(1.4)"}, {filter:"invert(0) sepia(0) saturate(1)", duration:0.5, ease:"power2.out"}, ${r2(at + 0.4)});`);
      sound("pop", r2(at + 0.4), 0.06);
    });
    const done = enter + scrollDur + 0.4;
    (s.tips ?? []).forEach((tip, k) => {
      parts.push(`<div id="${sid}-tip${k}" class="tip" style="top:${760 + k * 92}px;opacity:0"><b>${k + 1}</b>${esc(tip)}</div>`);
      tw(`tl.fromTo("#${sid}-tip${k}", {opacity:0, x:-60}, {opacity:1, x:0, duration:0.4, ease:"power3.out"}, ${r2(enter + 0.8 + k * 0.5)});`);
    });
    parts.push(`<div id="${sid}-kicker" class="hook-kicker out" style="opacity:0">${esc(s.kicker ?? "")}</div>`);
    parts.push(`<h1 id="${sid}-title" class="hook-title out" style="opacity:0">${words(s.caption)}</h1>`);
    fadeUp(`#${sid}-kicker`, enter + 0.5);
    tw(`tl.fromTo("#${sid}-title", {scale:1.2, opacity:0}, {scale:1, opacity:1, duration:0.9, ease:"expo.out", immediateRender:false}, ${r2(done + 0.2)});`);
    parts.push(`<div id="${sid}-cta" class="pill" style="background:${video.theme.accent};top:1330px;opacity:0">${esc(s.cta ?? "")}</div>`);
    fadeUp(`#${sid}-cta`, done + 0.8);
    sound("impact-bass-1", r2(done + 0.3), 0.09);
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
const mediaTags = [];
for (const s of scenes) {
  if (!s.clip) continue;
  mediaTags.push(`<audio id="vo-${s.id}" src="${asset(s.clip.file)}" data-start="${r2(s.start + LEAD)}" data-duration="${r2(s.clip.durationSec)}" data-volume="1" data-track-index="2"></audio>`);
}
const musicSrc = asset(`shared/music/${path.basename(video.music.src)}`);
const musicLen = probeDurationSec(path.join(PUBLIC_ROOT, video.music.src));
for (let at = 0, k = 0; at < total; at += musicLen - 1, k++) {
  const dur = r2(Math.min(musicLen, total - at));
  mediaTags.push(`<audio id="music-${k}" src="${musicSrc}" data-start="${r2(at)}" data-duration="${dur}" data-volume="0.24" data-fade-in="${k ? 1 : 0.4}" data-fade-out="${at + dur >= total - 0.01 ? 1.5 : 1}" data-track-index="${k % 2 ? 30 : 3}"></audio>`);
}

// ---- shader seams + quiet whooshes -----------------------------------
const SHADERS = ["whip-pan", "ridged-burn", "thermal-distortion", "sdf-iris"];
const transitions = scenes.slice(1).map((s, k) => ({
  time: r2(s.start - SEAM / 2),
  shader: k === scenes.length - 2 ? "cinematic-zoom" : SHADERS[k % SHADERS.length],
  duration: SEAM,
}));
for (const tr of transitions) sound("whoosh-short", r2(tr.time - 0.1), 0.14);

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
:root { --ground:#15171b; --ink:#f6f3ef; --pink:#f28dbb; --pinkd:#c9558a; --gold:#ffd27a; --stone:#2b2f35; --paper:#f7f3ec; --teal:#3fb8a8; }
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:${W}px; height:${H}px; overflow:hidden; background:var(--ground); }
#root { position:relative; width:${W}px; height:${H}px; overflow:hidden; font-family:"Montserrat"; }
.scene { position:absolute; inset:0; overflow:hidden; background:var(--ground); z-index:1; }
.ph { position:absolute; inset:0; overflow:hidden; }
.ph img, .ph video { width:100%; height:100%; object-fit:cover; display:block; }
/* Wooden shutters (two louvred leaves, hinged on the outer edges). */
.shutter { position:absolute; inset:0; z-index:3; perspective:1600px; }
.leaf { position:absolute; top:0; bottom:0; width:50%; background:repeating-linear-gradient(180deg, #7a4d2a 0 34px, #5a361c 34px 40px, #8a5a33 40px 44px), #6b4423; box-shadow:inset 0 0 0 14px #4a2c16, inset 0 0 50px rgba(0,0,0,0.5); }
.leaf.l { left:0; transform-origin:0% 50%; }
.leaf.r { right:0; transform-origin:100% 50%; }
.knob { position:absolute; top:50%; width:22px; height:22px; margin-top:-11px; border-radius:50%; background:#c9a35a; box-shadow:0 3px 6px rgba(0,0,0,0.6); }
.leaf.l .knob { right:28px; } .leaf.r .knob { left:28px; }
.shade { position:absolute; inset:0; background:linear-gradient(180deg, rgba(10,12,16,0.2) 0%, rgba(10,12,16,0) 35%, rgba(10,12,16,0) 65%, rgba(10,12,16,0.35) 100%); }
.top { position:absolute; left:0; right:0; top:0; height:760px; background:linear-gradient(180deg, rgba(14,15,19,0.9) 0%, rgba(14,15,19,0.6) 55%, rgba(14,15,19,0) 100%); }
.floor { position:absolute; left:0; right:0; bottom:0; height:900px; background:linear-gradient(180deg, rgba(14,15,19,0) 0%, rgba(14,15,19,0.6) 45%, rgba(14,15,19,0.93) 100%); }
.veil { position:absolute; inset:0; background:rgba(12,13,17,0.55); }
.hook-dim { position:absolute; inset:0; z-index:4; background:linear-gradient(180deg, rgba(14,15,19,0.45) 0%, rgba(14,15,19,0.15) 50%, rgba(14,15,19,0.85) 100%); }
/* Buckwheat petals. */
.petal { position:absolute; left:0; z-index:16; pointer-events:none; }
/* Intro: film-camera viewfinder. */
.vf { position:absolute; inset:0; z-index:5; box-shadow:inset 0 0 0 60px rgba(8,9,11,0.92), inset 0 0 220px rgba(0,0,0,0.65); }
.br { position:absolute; width:110px; height:110px; border:6px solid rgba(255,255,255,0.88); }
.br.tl { left:110px; top:250px; border-right:none; border-bottom:none; }
.br.tr { right:110px; top:250px; border-left:none; border-bottom:none; }
.br.bl { left:110px; bottom:300px; border-right:none; border-top:none; }
.br.brr { right:110px; bottom:300px; border-left:none; border-top:none; }
.af { position:absolute; left:50%; top:46%; width:150px; height:150px; margin:-75px 0 0 -75px; border-radius:50%; border:4px solid rgba(255,255,255,0.85); }
.af i { position:absolute; left:50%; top:50%; width:16px; height:16px; margin:-8px 0 0 -8px; border-radius:50%; background:var(--pink); }
.vf-top, .vf-bot { position:absolute; left:110px; right:110px; display:flex; justify-content:space-between; align-items:center; font:800 34px "Montserrat"; letter-spacing:0.12em; color:rgba(255,255,255,0.92); text-shadow:0 2px 10px rgba(0,0,0,0.7); }
.vf-top { top:150px; } .vf-bot { bottom:200px; font-size:30px; }
.vf-top span:first-child { color:var(--pink); }
.fc { position:relative; display:inline-block; width:140px; text-align:right; }
.fc b { position:absolute; right:58px; } .fc em { font-style:normal; color:rgba(255,255,255,0.6); }
.lb { position:relative; display:inline-block; width:330px; height:40px; }
.lb b { position:absolute; right:0; white-space:nowrap; color:var(--gold); }
.blade { position:absolute; left:0; right:0; height:0%; background:#050506; z-index:2; }
.blade.top { top:0; } .blade.bot { bottom:0; }
.flash { position:absolute; inset:0; background:#fff; opacity:0; z-index:3; }
.hook-kicker { position:absolute; left:0; right:0; top:1090px; text-align:center; font:700 32px "Montserrat"; letter-spacing:0.3em; color:var(--gold); z-index:7; }
.hook-kicker.out { top:520px; }
.hook-title { position:absolute; left:0; right:0; top:1150px; text-align:center; font:900 168px/1 "Playfair Display"; color:var(--ink); text-shadow:0 10px 60px rgba(0,0,0,0.6); z-index:7; white-space:nowrap; }
.hook-title.out { top:1100px; font-size:96px; padding:0 40px; white-space:normal; }
.hook-title .w, .title .w { display:inline-block; }
.pill { position:absolute; left:50%; transform:translateX(-50%); font:900 44px "Montserrat"; color:var(--stone); padding:12px 40px; border-radius:999px; white-space:nowrap; z-index:8; }
/* Compass badge. */
.compass { position:absolute; right:44px; top:76px; width:270px; z-index:6; text-align:center; }
.rose { position:relative; width:230px; height:230px; margin:0 auto; border-radius:50%; background:#f3ece0; box-shadow:0 0 0 8px #2b2f35, 0 0 0 11px #b99a5b, 0 18px 36px rgba(0,0,0,0.55); }
.rose i { position:absolute; left:50%; top:6px; width:2px; height:12px; margin-left:-1px; background:#6a6258; transform-origin:1px 109px; }
.rose i.big { width:4px; margin-left:-2px; height:20px; background:#2b2f35; transform-origin:2px 109px; }
.rose b { position:absolute; font:900 30px "Montserrat"; color:#2b2f35; }
.rose b.n { left:50%; top:26px; transform:translateX(-50%); color:#e2465f; }
.rose b.s { left:50%; bottom:24px; transform:translateX(-50%); }
.rose b.e { right:26px; top:50%; transform:translateY(-50%); }
.rose b.w { left:28px; top:50%; transform:translateY(-50%); }
.needle { position:absolute; left:95px; top:15px; }
.cp-top { margin-top:20px; display:inline-block; padding:8px 18px; border-radius:10px; background:var(--pink); font:900 30px "Montserrat"; letter-spacing:0.06em; color:#2b1420; white-space:nowrap; }
.cp-bot { margin-top:10px; font:800 26px "Montserrat"; letter-spacing:0.08em; color:#fff; text-shadow:0 2px 10px rgba(0,0,0,0.8); white-space:nowrap; }
.head { position:absolute; left:80px; top:215px; width:610px; display:flex; flex-direction:column; gap:10px; z-index:5; }
.kicker { font:700 32px "Montserrat"; letter-spacing:0.28em; }
.title { margin-bottom:10px; font:800 104px/1.04 "Playfair Display"; color:var(--ink); text-shadow:0 6px 30px rgba(0,0,0,0.55); }
.point { font:600 37px/1.3 "Montserrat"; color:rgba(246,243,239,0.93); text-shadow:0 2px 14px rgba(0,0,0,0.7); }
.point i { display:inline-block; width:16px; height:16px; border-radius:4px; transform:rotate(45deg); margin-right:18px; vertical-align:middle; }
/* Paper cards with a pink-to-stone edge, in the lower third. */
.card { position:absolute; left:60px; width:960px; top:1110px; padding:30px 34px 16px 50px; border-radius:18px; background:rgba(247,243,236,0.98); box-shadow:0 18px 40px rgba(0,0,0,0.45); z-index:7; overflow:hidden; }
.card::before { content:""; position:absolute; left:0; top:0; bottom:0; width:16px; background:linear-gradient(180deg, var(--pink), var(--stone)); }
.card-h { font:800 28px "Montserrat"; letter-spacing:0.2em; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; color:var(--pinkd); }
.card-t { font:600 40px/1.3 "Montserrat"; color:var(--stone); }
.card-n { font:600 32px/1.3 "Montserrat"; color:rgba(43,47,53,0.72); margin-bottom:6px; }
.dots i { display:inline-block; width:12px; height:12px; border-radius:50%; margin-left:10px; background:rgba(43,47,53,0.2); }
.dots i.on { background:var(--pinkd); }
.row { display:flex; align-items:baseline; gap:16px; padding:8px 0; border-top:1px solid rgba(43,47,53,0.14); border-radius:10px; }
.row b { font:800 36px "Montserrat"; color:var(--stone); white-space:nowrap; }
.row span { font:500 28px "Montserrat"; color:rgba(43,47,53,0.6); flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.row em { font:800 27px "Montserrat"; font-style:normal; color:var(--stone); padding:4px 14px; border-radius:999px; white-space:nowrap; box-shadow:inset 0 0 0 2px rgba(43,47,53,0.25); }
/* Google Maps screenshot chip above the restaurant card. */
.gmaps { position:absolute; left:400px; width:620px; bottom:830px; border-radius:22px; overflow:hidden; background:#fff; box-shadow:0 16px 40px rgba(0,0,0,0.5); z-index:8; }
.gmaps-h { display:flex; align-items:center; gap:10px; padding:12px 22px; background:#f1f3f4; font:700 24px "Montserrat"; color:#3c4043; }
.gmaps-h i { font-style:normal; }
.gmaps-h span { margin-left:auto; font:500 20px "Montserrat"; color:#70757a; }
.gmaps img { display:block; width:100%; border-top:1px solid #e8eaed; }
/* Film-strip rail under the subtitles. */
.rail { position:absolute; left:0; right:0; top:1668px; height:64px; z-index:20; }
.rail .film { position:absolute; left:230px; right:230px; top:0; height:64px; border-radius:6px; background:repeating-linear-gradient(90deg, transparent 0 10px, rgba(255,255,255,0.75) 10px 20px) 0 5px / 100% 7px no-repeat, repeating-linear-gradient(90deg, transparent 0 10px, rgba(255,255,255,0.75) 10px 20px) 0 52px / 100% 7px no-repeat, rgba(28,22,18,0.88); }
.rail i { position:absolute; top:15px; width:68px; height:34px; border-radius:3px; background:rgba(255,255,255,0.12); font:800 22px/34px "Montserrat"; font-style:normal; text-align:center; color:rgba(255,255,255,0.55); }
.rail i.done { background:rgba(242,141,187,0.35); color:#fff; }
.fcur { position:absolute; top:9px; width:80px; height:46px; border:4px solid var(--pink); border-radius:6px; box-shadow:0 0 18px rgba(242,141,187,0.8); }
/* Cost: paper tape + pocket calculator. */
.tape { position:absolute; left:50px; width:600px; top:560px; z-index:7; padding:26px 30px 30px; background:#fdfbf6; box-shadow:0 22px 44px rgba(0,0,0,0.5); -webkit-mask:linear-gradient(#000, #000) top / 100% calc(100% - 14px) no-repeat, conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) bottom / 28px 14px repeat-x; mask:linear-gradient(#000, #000) top / 100% calc(100% - 14px) no-repeat, conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) bottom / 28px 14px repeat-x; }
.tp-h { font:900 28px "Montserrat"; letter-spacing:0.1em; color:var(--pinkd); padding-bottom:10px; border-bottom:3px dashed rgba(201,85,138,0.6); }
.ln { display:flex; justify-content:space-between; align-items:center; gap:14px; padding:11px 0; border-bottom:2px dashed rgba(43,47,53,0.15); }
.ln span { font:800 29px/1.15 "Montserrat"; color:var(--stone); }
.ln span small { display:block; font:600 20px "Montserrat"; color:rgba(43,47,53,0.6); margin-top:3px; }
.ln b { font:900 30px "Montserrat"; color:var(--stone); white-space:nowrap; }
.tp-f { margin-top:12px; font:600 19px "Montserrat"; color:rgba(43,47,53,0.6); }
.calc { position:absolute; left:680px; top:600px; width:350px; height:560px; z-index:8; border-radius:34px; padding:26px 24px; background:linear-gradient(160deg, #3a3f47, #22252a); box-shadow:0 26px 50px rgba(0,0,0,0.6), inset 0 2px 0 rgba(255,255,255,0.15); }
.slot { position:absolute; left:40px; right:40px; top:-10px; height:16px; border-radius:8px; background:#111; }
.lcd { position:relative; height:120px; border-radius:14px; background:linear-gradient(180deg, #b9caa5, #9fb38a); box-shadow:inset 0 4px 10px rgba(0,0,0,0.35); }
.lcd small { position:absolute; left:14px; top:8px; font:800 18px "Montserrat"; color:rgba(30,40,25,0.6); }
.lcd-v { position:absolute; right:14px; bottom:12px; font:700 42px "Courier New", monospace; color:#1f2a18; white-space:nowrap; letter-spacing:-0.02em; }
.keys { display:grid; grid-template-columns:repeat(4, 1fr); gap:12px; margin-top:22px; }
.keys i { height:64px; border-radius:14px; background:#4a505a; font:800 30px/64px "Montserrat"; font-style:normal; text-align:center; color:#f2f2f2; box-shadow:0 4px 0 #1b1d21; }
.keys i.op { background:#6b5562; }
.keys i#s-cost-k15 { background:var(--pink); color:#2b1420; }
.calc-brand { margin-top:20px; text-align:center; font:800 18px "Montserrat"; letter-spacing:0.24em; color:rgba(255,255,255,0.45); }
.c-tot { position:absolute; left:680px; top:1180px; z-index:8; width:350px; padding:12px 18px; border-radius:18px; background:var(--gold); text-align:center; font:900 46px "Montserrat"; color:var(--stone); box-shadow:0 16px 30px rgba(0,0,0,0.45); }
.c-tot small { display:block; font:900 22px "Montserrat"; letter-spacing:0.14em; }
.stamp { position:absolute; left:640px; top:470px; z-index:9; padding:8px 18px; border:5px solid var(--pinkd); border-radius:12px; color:var(--pinkd); font:900 26px "Montserrat"; letter-spacing:0.06em; background:rgba(255,255,255,0.9); }
/* Outro: strip of negatives + three tips. */
.negs { position:absolute; left:0; top:150px; height:330px; z-index:6; background:rgba(150,78,22,0.88); box-shadow:0 16px 36px rgba(0,0,0,0.55); }
.negs::before, .negs::after { content:""; position:absolute; left:0; right:0; height:16px; background:repeating-linear-gradient(90deg, transparent 0 18px, rgba(250,236,214,0.9) 18px 34px); }
.negs::before { top:12px; } .negs::after { bottom:12px; }
.nf { position:absolute; top:42px; width:300px; height:246px; }
.nf img { display:block; width:300px; height:210px; object-fit:cover; border-radius:4px; }
.nf span { display:block; margin-top:6px; font:800 22px "Montserrat"; letter-spacing:0.08em; color:#ffe8c8; white-space:nowrap; }
.tip { position:absolute; left:110px; right:110px; z-index:7; display:flex; align-items:center; gap:22px; padding:14px 26px; border-radius:16px; background:rgba(247,243,236,0.95); font:800 36px "Montserrat"; color:var(--stone); box-shadow:0 12px 26px rgba(0,0,0,0.45); }
.tip b { flex:none; width:52px; height:52px; border-radius:50%; background:var(--pink); font:900 30px/52px "Montserrat"; text-align:center; color:#2b1420; }
.brand { position:absolute; left:60px; top:60px; z-index:21; font:800 26px "Montserrat"; letter-spacing:0.3em; color:rgba(246,243,239,0.85); text-shadow:0 2px 10px rgba(0,0,0,0.5); }
.brand b { color:var(--pink); letter-spacing:0; margin-right:12px; }
.cap { position:absolute; left:60px; right:60px; top:1500px; text-align:center; font:800 50px/1.25 "Montserrat"; color:#ffffff; text-shadow:0 3px 0 rgba(0,0,0,0.55), 0 0 22px rgba(0,0,0,0.85); z-index:20;${cover ? " display:none;" : ""} }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="${W}" data-height="${H}">
${mediaTags.join("\n")}
${sfx.join("\n")}
${html.join("\n")}
${petals.join("\n")}
<div class="brand" data-layout-ignore><b>✿</b>${esc(brand)}</div>
${caps.join("\n")}
</div>
<script>
const tl = gsap.timeline({ paused: true });
${js.join("\n")}
HyperShader.init({
  bgColor: "#15171b",
  accentColor: "${video.theme.accent}",
  scenes: ${JSON.stringify((cover ? scenes.slice(0, 1) : scenes).map((s) => `s-${s.id}`))},
  transitions: ${JSON.stringify(cover ? [] : transitions)},
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
