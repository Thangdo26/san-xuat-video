#!/usr/bin/env node
/**
 * node hf/build-mcw.mjs --slug moc-chau-3n2d [--cover]
 *
 * Turns data/videos/<slug>/video.json + voiceover.json into a HyperFrames project at
 * build/<slug>/. The look ("Mộc Châu · mùa hoa cải", remake of 15/11/2026), new for this channel
 * (checked against D:/Thang_space_archive/STYLE-LOG.md):
 *   - intro: a scale reveal; the first clip starts as a soft close-up of falling water and pulls back
 *     to the whole falls, two quick clips follow, and the title types itself over the drone shot;
 *   - mostly real footage (Pexels / Pixabay clips labelled Mộc Châu), stills only where no clip exists;
 *   - pictures change behind a linen curtain drawn across the frame, or by zooming through a window frame;
 *   - each stop gets a luggage tag that swings in on its string (day, part of day, area);
 *   - warm motes of sunlight float up through the frame;
 *   - the stop rail is a trail of dots with a leaf walking along it;
 *   - "Hết bao nhiêu tiền?" is a piggy bank: a coin drops in for every line, the counter adds up;
 *   - outro: four postcards fan out, the front one flips to its back with three handwritten tips;
 *   - shader seams: domain warp, ridged burn, swirl vortex, chromatic split, cinematic zoom.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fail, parseArgs, requireSlug } from "../scripts/lib/args.mjs";
import { probeDurationSec } from "../scripts/lib/media.mjs";
import { PROJECT_ROOT, PUBLIC_ROOT } from "../scripts/lib/paths.mjs";

const { flags } = parseArgs(process.argv.slice(2));
const slug = requireSlug(flags, "build-mcw");
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
const brand = video.theme.brand ?? "MỘC CHÂU";

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
 * Picture (or footage) stack. Odd changes draw a linen curtain across the frame from the right; the new
 * picture is waiting behind it when it slides off to the left. Even changes zoom through a window: the new
 * picture opens inside a wooden window frame in the middle and the frame grows past the edges.
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
    if (k % 2 === 1) {
      const cu = `${idPrefix}-cu${k}`;
      // Two plain tweens: fromTo with keyframes sticks at the middle step when the renderer seeks.
      tw(`tl.fromTo("#${cu}", {xPercent:105}, {xPercent:0, duration:0.38, ease:"power2.in", immediateRender:false}, ${r2(a - 0.4)});`);
      tw(`tl.fromTo("#${cu}", {xPercent:0}, {xPercent:-105, duration:0.55, ease:"power2.out", immediateRender:false}, ${r2(a + 0.04)});`);
      tw(`tl.set("#${id}", {opacity:1}, ${a});`);
      tw(`tl.set("#${idPrefix}-p${k - 1}", {opacity:0}, ${r2(a + 0.02)});`);
      sound("whoosh-short", r2(a - 0.42), 0.07);
      parts.push(`<div id="${id}" class="ph">${inner}</div>`);
      // No inline translate: GSAP would read it as x (px) and add xPercent on top, parking the curtain mid-frame.
      tw(`tl.set("#${cu}", {xPercent:105}, 0);`);
      parts.push(`<div id="${cu}" class="curtain"><i class="hem"></i></div>`);
      return;
    }
    // Window zoom: the picture is clipped to the window's opening while the frame grows.
    const wf = `${idPrefix}-wf${k}`;
    tw(`tl.fromTo("#${id}", {opacity:1, clipPath:"inset(34% 26% 34% 26% round 28px)"}, {opacity:1, clipPath:"inset(-2% -2% -2% -2% round 0px)", duration:0.95, ease:"power3.inOut", immediateRender:false}, ${a});`);
    // The frame sits on the window's opening and scales past the edges with it (transforms only).
    tw(`tl.fromTo("#${wf}", {opacity:1, scaleX:1, scaleY:1}, {opacity:1, scaleX:2.3, scaleY:3.4, duration:0.95, ease:"power3.inOut", immediateRender:false}, ${a});`);
    tw(`tl.set("#${wf}", {opacity:0}, ${r2(a + 0.97)});`);
    tw(`tl.set("#${idPrefix}-p${k - 1}", {opacity:0}, ${r2(a + 0.97)});`);
    sound("pop", r2(a), 0.06);
    parts.push(`<div id="${id}" class="ph">${inner}</div>`);
    parts.push(`<div id="${wf}" class="winframe" style="opacity:0"></div>`);
  });
  return parts.join("");
};

const titleIn = (sel, at) =>
  tw(`tl.fromTo("${sel} .w", {opacity:0, y:30}, {opacity:1, y:0, duration:0.5, stagger:0.08, ease:"power3.out"}, ${r2(at)});`);
const fadeUp = (sel, at, dur = 0.35) =>
  tw(`tl.fromTo("${sel}", {opacity:0, y:26}, {opacity:1, y:0, duration:${dur}, ease:"expo.out"}, ${r2(at)});`);

// ---- luggage tag badge ----------------------------------------------------
/** A kraft-paper luggage tag hanging from a string at the top right: it drops in and swings to rest. */
const luggageTag = (sid, day, part, area, at) => {
  tw(`tl.fromTo("#${sid}-tag", {opacity:0, y:-260, rotation:-26}, {opacity:1, y:0, rotation:0, duration:1.5, ease:"elastic.out(1, 0.32)"}, ${r2(at)});`);
  tw(`tl.fromTo("#${sid}-tag .tg-t", {opacity:0}, {opacity:1, duration:0.3, stagger:0.12}, ${r2(at + 0.45)});`);
  sound("pop", r2(at + 0.35), 0.08);
  return `<div id="${sid}-tag" class="ltag" style="opacity:0"><i class="string"></i><div class="tg"><i class="eyelet"></i><div class="tg-t tg-day">${esc(day)}</div><div class="tg-t tg-part">${esc(part)}</div><div class="tg-t tg-area">${esc(area)}</div></div></div>`;
};

const row = (p, accent) => `<div class="row"><b>${esc(p.place)}</b><span>${esc(p.address)}</span><em style="background:${p.rating == null ? "rgba(27,36,64,0.12)" : accent}">${star(p.rating)}</em></div>`;

// Google Maps screenshots (name + stars + review count), captured 15/11/2026 into public/videos/moc-chau/maps-1511.
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
    tw(`tl.fromTo(document.querySelectorAll("${rowsSel}")[${k}], {backgroundColor:"rgba(155,209,106,0)"}, {backgroundColor:"rgba(155,209,106,0.4)", duration:0.25, yoyo:true, repeat:1, repeatDelay:${r2(Math.max(slot - 0.5, 0.2))}}, ${r2(t0)});`);
  });
  return `<div id="${id}" class="gmaps" style="opacity:0"><div class="gmaps-h"><i>📍</i>Google Maps<span>${MAPS_DATE}</span></div>${list.map(([m, k]) => `<img id="${id}-${k}" src="${asset(`videos/moc-chau/maps-1511/${m}.png`)}" alt="" />`).join("")}</div>`;
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

// ---- scale-reveal intro ------------------------------------------------------
/**
 * The hook opens on a soft close-up of the first clip (falling water) that pulls back to the whole scene;
 * two quick clips follow, cut on a flash of warm light, and the last clip (a drone shot) carries the title,
 * which types itself letter by letter.
 */
const scaleReveal = (s, sid) => {
  const a = s.start;
  const g = s.gallery ?? [];
  const cuts = [a + 2.9, a + 4.3, a + 5.7].slice(0, g.length - 1); // when each next clip takes over
  const parts = [];
  g.forEach((src, k) => {
    const id = `${sid}-p${k}`;
    const from = k === 0 ? a : cuts[k - 1];
    const until = k < g.length - 1 ? cuts[k] : s.end;
    const isVideo = src.endsWith(".mp4");
    parts.push(`<div id="${id}" class="ph"${k ? ' style="opacity:0"' : ""}>${media(src, id, from, until - from + 0.6)}</div>`);
    if (k) tw(`tl.set("#${id}", {opacity:1}, ${r2(from)});`);
    if (k < g.length - 1) tw(`tl.set("#${id}", {opacity:0}, ${r2(until + 0.02)});`);
    const sel = `#${id} ${isVideo ? "video" : "img"}`;
    if (k === 0) {
      tw(`tl.fromTo("${sel}", {scale:3.4}, {scale:1.04, duration:2.6, ease:"power3.inOut"}, ${r2(a)});`);
      tw(`tl.fromTo("#${id}", {filter:"blur(8px)"}, {filter:"blur(0px)", duration:1.6, ease:"power2.out"}, ${r2(a + 0.2)});`);
    } else {
      tw(`tl.fromTo("${sel}", {scale:${k === g.length - 1 ? 1.14 : 1.06}}, {scale:${k === g.length - 1 ? 1.02 : 1.14}, duration:${r2(until - from + 0.6)}, ease:"none"}, ${r2(from)});`);
    }
  });
  parts.push(`<div id="${sid}-glow" class="glow" style="opacity:0"></div>`);
  cuts.forEach((at) => {
    tw(`tl.to("#${sid}-glow", {keyframes:[{opacity:0.75, duration:0.08}, {opacity:0, duration:0.35}]}, ${r2(at - 0.06)});`);
    sound("whoosh-short", r2(at - 0.15), 0.1);
  });
  sound("whoosh-cinematic", r2(a + 0.1), 0.1);
  return { html: parts.join(""), settle: r2((cuts.at(-1) ?? a + 2.6) + 0.5) };
};

// ---- warm motes of sunlight floating up ---------------------------------------
const motes = [];
for (let k = 0; k < 16; k++) {
  const x0 = 40 + ((k * 263) % 1000);
  const size = 6 + ((k * 7) % 9);
  const dur = 9 + ((k * 11) % 7);
  motes.push(`<i id="mt${k}" class="mote" style="left:${x0}px;width:${size}px;height:${size}px" data-layout-ignore></i>`);
  for (let at = (k * 0.7) % 6, n = 0; at < total; at += dur, n++) {
    const drift = ((k % 2 ? 1 : -1) * (40 + ((k * 17) % 80)));
    // Three chained fromTo legs rather than keyframes (keyframes stick when the renderer seeks).
    const legs = [
      [{ y: H + 20, x: 0, opacity: 0 }, { y: H * 0.62, x: r2(drift * 0.5), opacity: 0.85 }, dur * 0.35, "sine.out"],
      [{ y: H * 0.62, x: r2(drift * 0.5), opacity: 0.85 }, { y: H * 0.25, x: drift, opacity: 0.55 }, dur * 0.4, "sine.inOut"],
      [{ y: H * 0.25, x: drift, opacity: 0.55 }, { y: -30, x: r2(drift * 0.6), opacity: 0 }, dur * 0.25, "sine.in"],
    ];
    let t0 = at;
    legs.forEach(([f, t, d, ease], j) => {
      const o = (v) => `y:${r2(v.y)}, x:${v.x}, opacity:${v.opacity}`;
      tw(`tl.fromTo("#mt${k}", {${o(f)}}, {${o(t)}, duration:${r2(d)}, ease:"${ease}", immediateRender:${n === 0 && j === 0}}, ${r2(t0)});`);
      t0 += d;
    });
  }
}

// ---- scenes -------------------------------------------------------------
for (const s of scenes) {
  const sid = `s-${s.id}`;
  const a = s.start;
  const enter = a + LEAD;
  const accent = s.accent ?? video.theme.accent;
  const parts = [];

  if (s.layout === "hook") {
    const m = scaleReveal(s, sid);
    parts.push(m.html);
    parts.push(`<div id="${sid}-dim" class="hook-dim" style="opacity:0"></div>`);
    parts.push(`<div id="${sid}-kicker" class="hook-kicker" style="opacity:0">${esc(s.kicker)}</div>`);
    const letters = [...s.caption].map((ch, k) => (ch === " " ? " " : `<span class="ch" id="${sid}-ch${k}" style="opacity:0">${esc(ch)}</span>`)).join("");
    parts.push(`<h1 id="${sid}-title" class="hook-title">${letters}<i id="${sid}-caret" class="caret" style="opacity:0"></i></h1>`);
    parts.push(`<div id="${sid}-pill" class="pill" style="background:${accent};top:1370px;opacity:0">${esc(s.label ?? "")}</div>`);
    tw(`tl.to("#${sid}-dim", {opacity:1, duration:0.6}, ${m.settle});`);
    // Typewriter: one letter every 0.11 s, a caret blinking after the last one.
    const typeAt = m.settle + 0.2;
    let n = 0;
    [...s.caption].forEach((ch, k) => { if (ch !== " ") { tw(`tl.set("#${sid}-ch${k}", {opacity:1}, ${r2(typeAt + n * 0.11)});`); if (n % 2 === 0) sound("pop", r2(typeAt + n * 0.11), 0.05); n++; } });
    tw(`tl.set("#${sid}-caret", {opacity:1}, ${r2(typeAt)});`);
    for (let b = 0; b < 7; b++) tw(`tl.set("#${sid}-caret", {opacity:${b % 2 ? 1 : 0}}, ${r2(typeAt + n * 0.11 + 0.3 + b * 0.35)});`);
    fadeUp(`#${sid}-kicker`, typeAt + n * 0.11 + 0.1);
    fadeUp(`#${sid}-pill`, typeAt + n * 0.11 + 0.4);
  } else if (s.layout === "point") {
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div class="floor"></div>`);
    const idx = stops.findIndex((x) => x.id === s.id);
    const [day, part] = s.label.split("·").map((x) => x.trim().toUpperCase());
    parts.push(luggageTag(sid, day, part, s.badge ?? "", enter + 0.6));
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
    // Plan B: another route for the same half-day, on a card once the restaurant card has cleared.
    if (s.alt) {
      const at = Math.max(cueTime(s, s.alt.cue) ?? s.end - 7, (hide ?? cue + 3) + 0.5);
      const rows = s.alt.rows.map(([k, sub, v]) => `<div class="row"><b>${esc(k)}</b><span>${esc(sub)}</span><em style="background:${video.theme.highlight}">${esc(v)}</em></div>`).join("");
      parts.push(`<div id="${sid}-alt" class="card alt" style="opacity:0"><div class="card-h">${esc(s.alt.title.toUpperCase())}</div>${rows}<p class="alt-note">${esc(s.alt.note)}</p><i class="alt-b">B</i></div>`);
      tw(`tl.fromTo("#${sid}-alt", {opacity:0, y:60, rotation:-3}, {opacity:1, y:0, rotation:0, duration:0.55, ease:"back.out(1.6)"}, ${r2(at - 0.1)});`);
      tw(`tl.fromTo("#${sid}-alt .row", {opacity:0, x:-40}, {opacity:1, x:0, duration:0.3, stagger:0.5, ease:"power3.out"}, ${r2(at + 0.3)});`);
      tw(`tl.fromTo("#${sid}-alt .alt-b", {opacity:0, scale:2.4, rotation:-30}, {opacity:1, scale:1, rotation:-12, duration:0.4, ease:"back.out(2)"}, ${r2(at + 0.35)});`);
      sound("pop", r2(at), 0.08);
      hideOut(`#${sid}-alt`, s.end - 0.9);
    }
    // Trail rail under the subtitles: a dotted path through one dot per stop; a leaf walks to this one.
    const xs = stops.map((_, k) => 300 + (480 * k) / Math.max(1, stops.length - 1));
    const dots = stops.map((x, k) => `<i class="${k < idx ? "done" : ""}${k === idx ? " here" : ""}" style="left:${r2(xs[k] - 13)}px"></i>`).join("");
    parts.push(`<div id="${sid}-rail" class="rail"><span class="trail" style="left:${xs[0]}px;width:${r2(xs.at(-1) - xs[0])}px"></span>${dots}<b id="${sid}-leaf" class="leaf" style="left:${r2(xs[Math.max(0, idx - 1)] - 22)}px">🍃</b></div>`);
    fadeUp(`#${sid}-rail`, enter + 0.4);
    if (idx > 0) tw(`tl.fromTo("#${sid}-leaf", {x:0, rotation:0}, {x:${r2(xs[idx] - xs[idx - 1])}, rotation:360, duration:0.9, ease:"power2.inOut"}, ${r2(enter + 0.7)});`);
  } else if (s.layout === "stay") {
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div class="floor"></div>`);
    parts.push(luggageTag(sid, "2 ĐÊM", "LƯU TRÚ", "Mộc Châu", enter + 0.6));
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
    // "Hết bao nhiêu tiền?": a paper price list beside a piggy bank. For every line a coin drops into the
    // slot (the pig bobs) and the counter tag shows the running total, low–high; the total lands last.
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div class="floor"></div><div id="${sid}-veil" class="veil" style="opacity:0"></div>`);
    parts.push(`<div class="head"><div id="${sid}-kicker" class="kicker" style="color:${accent}">${esc(s.kicker ?? "")}</div><h1 id="${sid}-title" class="title" style="font-size:88px">${words(s.caption)}</h1></div>`);
    fadeUp(`#${sid}-kicker`, enter, 0.25);
    titleIn(`#${sid}-title`, enter + 0.2);
    const t0 = enter + 1.4;
    tw(`tl.fromTo("#${sid}-veil", {opacity:0}, {opacity:1, duration:0.5}, ${r2(t0 - 0.2)});`);
    const items = s.items ?? [];
    const totalAt = Math.max(cueTime(s, s.totalCue) ?? s.end - 3.2, t0 + items.length * 0.6 + 0.8);
    const step = Math.min(0.9, (totalAt - t0 - 0.6) / Math.max(1, items.length));
    const money = (n) => (n < 1000 ? `${n}k` : `${(n / 1000).toFixed(1).replace(".", ",")}tr`);
    let lo = 0, hi = 0;
    const shows = [`<b id="${sid}-d0" class="cnt-v">0đ</b>`];
    const coins = [];
    const lines = items.map((it, k) => {
      const at = t0 + 0.6 + k * step;
      lo += it.n?.[0] ?? 0; hi += it.n?.[1] ?? 0;
      shows.push(`<b id="${sid}-d${k + 1}" class="cnt-v" style="opacity:0">${money(lo)}–${money(hi)}</b>`);
      tw(`tl.fromTo("#${sid}-ln${k}", {opacity:0, x:-30}, {opacity:1, x:0, duration:0.3, ease:"power3.out"}, ${r2(at)});`);
      coins.push(`<i id="${sid}-coin${k}" class="coin" style="opacity:0">₫</i>`);
      tw(`tl.fromTo("#${sid}-coin${k}", {opacity:1, y:-230, rotationY:0}, {opacity:1, y:0, rotationY:540, duration:0.45, ease:"power2.in", immediateRender:false}, ${r2(at + 0.05)});`);
      tw(`tl.set("#${sid}-coin${k}", {opacity:0}, ${r2(at + 0.5)});`);
      tw(`tl.to("#${sid}-pig", {keyframes:[{y:10, scaleY:0.94, duration:0.08}, {y:0, scaleY:1, duration:0.3, ease:"back.out(3)"}]}, ${r2(at + 0.5)});`);
      tw(`tl.set("#${sid}-d${k}", {opacity:0}, ${r2(at + 0.52)});`);
      tw(`tl.set("#${sid}-d${k + 1}", {opacity:1}, ${r2(at + 0.52)});`);
      sound("pop", r2(at + 0.48), 0.07);
      return `<div id="${sid}-ln${k}" class="ln" style="opacity:0"><span>${esc(it.k)}${it.note ? `<small>${esc(it.note)}</small>` : ""}</span><b>${esc(it.v)}</b></div>`;
    }).join("");
    parts.push(`<div id="${sid}-list" class="plist" style="opacity:0"><div class="tp-h">${esc(s.receiptTitle ?? "")}</div>${lines}<div class="tp-f">${esc(s.note ?? "")}</div></div>`);
    fadeUp(`#${sid}-list`, t0);
    parts.push(`<div id="${sid}-bank" class="bank" style="opacity:0"><div class="cnt"><small>ĐÃ BỎ HEO</small>${shows.join("")}</div>${coins.join("")}` +
      `<div id="${sid}-pig" class="pig"><i class="ear"></i><i class="body"></i><i class="slot"></i><i class="eye"></i><i class="snout"><b></b><b></b></i><i class="leg l1"></i><i class="leg l2"></i><i class="tail"></i></div></div>`);
    fadeUp(`#${sid}-bank`, t0 + 0.1);
    parts.push(`<div id="${sid}-tot" class="c-tot" style="opacity:0"><small>TỔNG / NGƯỜI</small>${esc(s.total)}</div>`);
    tw(`tl.fromTo("#${sid}-tot", {opacity:0, scale:0.6}, {opacity:1, scale:1, duration:0.4, ease:"back.out(2)"}, ${r2(totalAt)});`);
    sound("impact-bass-1", r2(totalAt + 0.2), 0.1);
    parts.push(`<div id="${sid}-stamp" class="stamp" style="opacity:0">${esc(s.stamp ?? "")}</div>`);
    tw(`tl.fromTo("#${sid}-stamp", {opacity:0, scale:2.2, rotation:-24}, {opacity:1, scale:1, rotation:-8, duration:0.35, ease:"power4.in"}, ${r2(totalAt + 0.8)});`);
  } else {
    // Outro: four postcards fan out at the top; a big postcard lands, flips to its back and three tips are
    // written on it beside the stamp and postmark; then the title and the call to action.
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div id="${sid}-dim" class="hook-dim" style="opacity:0"></div>`);
    tw(`tl.to("#${sid}-dim", {opacity:1, duration:0.6}, ${r2(enter)});`);
    const pcs = s.postcards ?? [];
    const ROT = [-13, -4, 5, 14];
    pcs.forEach((p, k) => {
      const x = 70 + k * 236;
      parts.push(`<div id="${sid}-pc${k}" class="pc" style="left:${x}px;opacity:0"><img src="${asset(p.src)}" alt="" /><span>${esc(p.label)}</span></div>`);
      tw(`tl.fromTo("#${sid}-pc${k}", {opacity:0, y:420, rotation:0}, {opacity:1, y:0, rotation:${ROT[k % 4]}, duration:0.7, ease:"back.out(1.4)"}, ${r2(enter + 0.2 + k * 0.15)});`);
    });
    const big = `${sid}-big`;
    const front = pcs[0]?.src ?? s.gallery?.[0];
    const tips = (s.tips ?? []).map((tip, k) => `<p id="${sid}-tip${k}" class="hw" style="opacity:0">${k + 1}. ${esc(tip)}</p>`).join("");
    parts.push(`<div id="${big}" class="bigpc" style="opacity:0"><div id="${big}-in" class="bigpc-in">` +
      `<div class="face front"><img src="${asset(front)}" alt="" /><span>Gửi từ ${esc(brand)}</span></div>` +
      `<div class="face back"><div class="pc-l"><div class="pc-h">${esc(s.kicker ?? "")}</div>${tips}</div><div class="pc-r"><i class="pstamp">MC<br/>2026</i><i class="pmark">MỘC CHÂU<br/>15·11·26</i><b></b><b></b><b></b></div></div>` +
      `</div></div>`);
    const flipAt = enter + 1.9;
    tw(`tl.fromTo("#${big}", {opacity:0, y:300, rotation:-6}, {opacity:1, y:0, rotation:-2, duration:0.7, ease:"expo.out"}, ${r2(enter + 1.0)});`);
    tw(`tl.fromTo("#${big}-in", {rotationY:0}, {rotationY:180, duration:0.9, ease:"power2.inOut"}, ${r2(flipAt)});`);
    sound("whoosh-short", r2(flipAt), 0.09);
    (s.tips ?? []).forEach((_, k) => tw(`tl.fromTo("#${sid}-tip${k}", {opacity:0, x:-24}, {opacity:1, x:0, duration:0.35, ease:"power2.out"}, ${r2(flipAt + 0.9 + k * 0.6)});`));
    const done = flipAt + 0.9 + (s.tips ?? []).length * 0.6;
    parts.push(`<h1 id="${sid}-title" class="hook-title out" style="opacity:0">${words(s.caption)}</h1>`);
    tw(`tl.fromTo("#${sid}-title", {scale:1.2, opacity:0}, {scale:1, opacity:1, duration:0.9, ease:"expo.out", immediateRender:false}, ${r2(done + 0.2)});`);
    parts.push(`<div id="${sid}-cta" class="pill" style="background:${video.theme.accent};top:1395px;opacity:0">${esc(s.cta ?? "")}</div>`);
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
const SHADERS = ["domain-warp", "ridged-burn", "swirl-vortex", "chromatic-split"];
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
:root { --ground:#101a14; --ink:#f7f4ea; --tea:#9bd16a; --tead:#4f8a2e; --sun:#ffd76a; --forest:#1f3324; --paper:#fbf7ec; --kraft:#c8a46e; --pinkpig:#f4a6b6; }
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:${W}px; height:${H}px; overflow:hidden; background:var(--ground); }
#root { position:relative; width:${W}px; height:${H}px; overflow:hidden; font-family:"Montserrat"; }
.scene { position:absolute; inset:0; overflow:hidden; background:var(--ground); z-index:1; }
.ph { position:absolute; inset:0; overflow:hidden; }
.ph img, .ph video { width:100%; height:100%; object-fit:cover; display:block; }
/* Linen curtain drawn across the frame (folds + a hem on its leading edge). */
.curtain { position:absolute; top:-2%; bottom:-2%; left:-6%; width:112%; z-index:3; background:repeating-linear-gradient(90deg, #e9e0cc 0 46px, #d8ccb2 46px 70px, #f1eadb 70px 104px, #cfc2a6 104px 120px); box-shadow:-30px 0 60px rgba(0,0,0,0.45); }
.hem { position:absolute; left:0; top:0; bottom:0; width:26px; background:linear-gradient(90deg, #b8a684, #e9e0cc); }
/* Window frame for the zoom-through change. */
.winframe { position:absolute; z-index:3; border:26px solid #6b4a2b; border-radius:30px; box-shadow:0 0 0 6px #3e2a17, 0 30px 80px rgba(0,0,0,0.6), inset 0 0 0 6px #8a6440; }
.shade { position:absolute; inset:0; background:linear-gradient(180deg, rgba(8,16,10,0.2) 0%, rgba(8,16,10,0) 35%, rgba(8,16,10,0) 65%, rgba(8,16,10,0.35) 100%); }
.top { position:absolute; left:0; right:0; top:0; height:760px; background:linear-gradient(180deg, rgba(10,20,13,0.88) 0%, rgba(10,20,13,0.55) 55%, rgba(10,20,13,0) 100%); }
.floor { position:absolute; left:0; right:0; bottom:0; height:900px; background:linear-gradient(180deg, rgba(10,20,13,0) 0%, rgba(10,20,13,0.6) 45%, rgba(10,20,13,0.93) 100%); }
.veil { position:absolute; inset:0; background:rgba(9,16,11,0.55); }
.hook-dim { position:absolute; inset:0; z-index:4; background:linear-gradient(180deg, rgba(10,20,13,0.45) 0%, rgba(10,20,13,0.12) 50%, rgba(10,20,13,0.85) 100%); }
.glow { position:absolute; inset:0; z-index:5; background:linear-gradient(120deg, rgba(255,215,106,0.95), rgba(255,240,200,0.9) 50%, rgba(255,190,90,0.85)); }
/* Sun motes. */
.mote { position:absolute; top:0; z-index:16; border-radius:50%; background:#ffe7a3; box-shadow:0 0 12px 4px rgba(255,215,106,0.55); pointer-events:none; }
.hook-kicker { position:absolute; left:0; right:0; top:1090px; text-align:center; font:700 32px "Montserrat"; letter-spacing:0.3em; color:var(--sun); z-index:7; }
.hook-title { position:absolute; left:0; right:0; top:1150px; text-align:center; font:900 160px/1 "Playfair Display"; color:var(--ink); text-shadow:0 10px 60px rgba(0,0,0,0.6); z-index:7; white-space:nowrap; }
.hook-title.out { top:1240px; font-size:92px; padding:0 40px; white-space:normal; }
.hook-title .w, .title .w { display:inline-block; }
.ch { display:inline-block; }
.caret { display:inline-block; width:10px; height:130px; margin-left:10px; vertical-align:-8px; background:var(--sun); }
.pill { position:absolute; left:50%; transform:translateX(-50%); font:900 44px "Montserrat"; color:var(--forest); padding:12px 40px; border-radius:999px; white-space:nowrap; z-index:8; }
/* Luggage tag on a string. */
.ltag { position:absolute; right:70px; top:0; width:250px; z-index:6; transform-origin:125px 0; }
.string { position:absolute; left:123px; top:0; width:4px; height:120px; background:#e9dcc0; }
.tg { position:absolute; left:10px; top:110px; width:230px; padding:58px 18px 22px; border-radius:20px 20px 26px 26px; background:var(--kraft); box-shadow:0 18px 34px rgba(0,0,0,0.5), inset 0 0 0 4px rgba(120,86,40,0.35); text-align:center; }
.eyelet { position:absolute; left:97px; top:14px; width:36px; height:36px; border-radius:50%; background:var(--forest); box-shadow:0 0 0 7px #e9dcc0; }
.tg-day { font:900 40px "Montserrat"; letter-spacing:0.06em; color:var(--forest); }
.tg-part { margin-top:2px; font:800 28px "Montserrat"; letter-spacing:0.16em; color:#6b4a2b; }
.tg-area { margin-top:12px; padding-top:10px; border-top:3px dashed rgba(60,40,15,0.4); font:700 24px "Montserrat"; color:#3b2a14; white-space:nowrap; }
.head { position:absolute; left:80px; top:215px; width:640px; display:flex; flex-direction:column; gap:10px; z-index:5; }
.kicker { font:700 32px "Montserrat"; letter-spacing:0.28em; }
.title { margin-bottom:10px; font:800 100px/1.04 "Playfair Display"; color:var(--ink); text-shadow:0 6px 30px rgba(0,0,0,0.55); }
.point { font:600 37px/1.3 "Montserrat"; color:rgba(247,244,234,0.94); text-shadow:0 2px 14px rgba(0,0,0,0.7); }
.point i { display:inline-block; width:18px; height:18px; border-radius:50% 0; margin-right:18px; vertical-align:middle; }
/* Cards: cream paper with a tea-green spine, in the lower third. */
.card { position:absolute; left:60px; width:960px; top:1110px; padding:30px 34px 16px 50px; border-radius:18px; background:rgba(251,247,236,0.98); box-shadow:0 18px 40px rgba(0,0,0,0.45); z-index:7; overflow:hidden; }
.card::before { content:""; position:absolute; left:0; top:0; bottom:0; width:16px; background:linear-gradient(180deg, var(--tea), var(--tead)); }
.card-h { font:800 28px "Montserrat"; letter-spacing:0.2em; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; color:var(--tead); }
.card-t { font:600 40px/1.3 "Montserrat"; color:var(--forest); }
.card-n { font:600 32px/1.3 "Montserrat"; color:rgba(31,51,36,0.72); margin-bottom:6px; }
.dots i { display:inline-block; width:12px; height:12px; border-radius:50%; margin-left:10px; background:rgba(31,51,36,0.2); }
.dots i.on { background:var(--tead); }
.row { display:flex; align-items:baseline; gap:16px; padding:8px 0; border-top:1px solid rgba(31,51,36,0.14); border-radius:10px; }
.row b { font:800 36px "Montserrat"; color:var(--forest); white-space:nowrap; }
.row span { font:500 28px "Montserrat"; color:rgba(31,51,36,0.6); flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.row em { font:800 27px "Montserrat"; font-style:normal; color:var(--forest); padding:4px 14px; border-radius:999px; white-space:nowrap; box-shadow:inset 0 0 0 2px rgba(31,51,36,0.25); }
/* Google Maps screenshot chip above the restaurant card. */
.gmaps { position:absolute; left:400px; width:620px; bottom:830px; border-radius:22px; overflow:hidden; background:#fff; box-shadow:0 16px 40px rgba(0,0,0,0.5); z-index:8; }
.gmaps-h { display:flex; align-items:center; gap:10px; padding:12px 22px; background:#f1f3f4; font:700 24px "Montserrat"; color:#3c4043; }
.gmaps-h i { font-style:normal; }
.gmaps-h span { margin-left:auto; font:500 20px "Montserrat"; color:#70757a; }
.gmaps img { display:block; width:100%; border-top:1px solid #e8eaed; }
/* Trail rail under the subtitles. */
.rail { position:absolute; left:0; right:0; top:1672px; height:60px; z-index:20; }
.rail .trail { position:absolute; top:28px; height:4px; background:repeating-linear-gradient(90deg, rgba(255,255,255,0.7) 0 12px, transparent 12px 22px); }
.rail i { position:absolute; top:17px; width:26px; height:26px; border-radius:50%; background:rgba(16,26,20,0.85); box-shadow:inset 0 0 0 4px rgba(255,255,255,0.55); }
.rail i.done { background:var(--tea); box-shadow:inset 0 0 0 4px rgba(255,255,255,0.8); }
.rail i.here { background:var(--sun); }
.rail .leaf { position:absolute; top:-6px; font-size:40px; line-height:1; }
/* Cost: price list + piggy bank. */
.plist { position:absolute; left:50px; width:610px; top:560px; z-index:7; padding:26px 30px 24px; border-radius:10px; background:var(--paper); box-shadow:0 22px 44px rgba(0,0,0,0.5); }
.tp-h { font:900 28px "Montserrat"; letter-spacing:0.1em; color:var(--tead); padding-bottom:10px; border-bottom:3px solid rgba(79,138,46,0.6); }
.ln { display:flex; justify-content:space-between; align-items:center; gap:14px; padding:11px 0; border-bottom:2px solid rgba(79,138,46,0.18); }
.ln span { font:800 29px/1.15 "Montserrat"; color:var(--forest); }
.ln span small { display:block; font:600 20px "Montserrat"; color:rgba(31,51,36,0.6); margin-top:3px; }
.ln b { font:900 30px "Montserrat"; color:var(--forest); white-space:nowrap; }
.tp-f { margin-top:12px; font:600 19px "Montserrat"; color:rgba(31,51,36,0.6); }
.bank { position:absolute; left:680px; top:600px; width:360px; height:560px; z-index:8; }
.cnt { position:absolute; left:20px; right:20px; top:0; height:118px; border-radius:18px; background:var(--forest); box-shadow:0 14px 28px rgba(0,0,0,0.5), inset 0 0 0 4px var(--tea); }
.cnt small { position:absolute; left:0; right:0; top:12px; text-align:center; font:800 18px "Montserrat"; letter-spacing:0.2em; color:var(--tea); }
.cnt-v { position:absolute; left:0; right:0; bottom:14px; text-align:center; font:900 40px "Montserrat"; color:var(--sun); white-space:nowrap; }
.coin { position:absolute; left:156px; top:300px; width:52px; height:52px; border-radius:50%; background:#f2c14e; box-shadow:inset 0 0 0 6px #d79a1e, 0 6px 12px rgba(0,0,0,0.4); font:900 28px/52px "Montserrat"; font-style:normal; text-align:center; color:#8a5a00; z-index:2; }
.pig { position:absolute; left:20px; top:330px; width:320px; height:220px; transform-origin:50% 100%; }
.pig i { position:absolute; display:block; }
.pig .body { left:20px; top:20px; width:270px; height:170px; border-radius:50%; background:var(--pinkpig); box-shadow:inset -18px -14px 0 rgba(200,90,120,0.25), 0 14px 26px rgba(0,0,0,0.45); }
.pig .ear { left:70px; top:4px; width:56px; height:56px; border-radius:6px 50% 6px 50%; background:#e98aa0; transform:rotate(-20deg); }
.pig .slot { left:130px; top:30px; width:70px; height:12px; border-radius:6px; background:#7a2c40; }
.pig .eye { left:80px; top:78px; width:16px; height:16px; border-radius:50%; background:#2b1a1f; }
.pig .snout { left:-4px; top:86px; width:64px; height:50px; border-radius:50%; background:#f08aa2; }
.pig .snout b { position:absolute; top:18px; width:10px; height:14px; border-radius:50%; background:#7a2c40; }
.pig .snout b:first-child { left:16px; } .pig .snout b:last-child { left:38px; }
.pig .leg { top:170px; width:40px; height:46px; border-radius:0 0 12px 12px; background:#e98aa0; }
.pig .l1 { left:70px; } .pig .l2 { left:210px; }
.pig .tail { left:282px; top:80px; width:30px; height:30px; border-radius:50%; border:6px solid #e98aa0; border-left-color:transparent; }
.c-tot { position:absolute; left:680px; top:1180px; z-index:8; width:360px; padding:12px 18px; border-radius:18px; background:var(--sun); text-align:center; font:900 46px "Montserrat"; color:var(--forest); box-shadow:0 16px 30px rgba(0,0,0,0.45); }
.c-tot small { display:block; font:900 22px "Montserrat"; letter-spacing:0.14em; }
.stamp { position:absolute; left:110px; top:1250px; z-index:9; padding:8px 18px; border:5px solid var(--tead); border-radius:12px; color:var(--tead); font:900 26px "Montserrat"; letter-spacing:0.06em; background:rgba(255,255,255,0.9); }
/* Outro: postcards. */
.pc { position:absolute; top:190px; width:230px; padding:12px 12px 10px; background:#fff; border-radius:6px; box-shadow:0 14px 30px rgba(0,0,0,0.5); z-index:6; }
.pc img { display:block; width:206px; height:150px; object-fit:cover; }
.pc span { display:block; margin-top:8px; text-align:center; font:italic 700 26px "Playfair Display"; color:#3b2a14; white-space:nowrap; }
.bigpc { position:absolute; left:90px; top:520px; width:900px; height:600px; z-index:7; perspective:2200px; }
.bigpc-in { position:relative; width:100%; height:100%; transform-style:preserve-3d; }
.face { position:absolute; inset:0; border-radius:12px; backface-visibility:hidden; box-shadow:0 26px 50px rgba(0,0,0,0.55); overflow:hidden; }
.face.front { background:#fff; padding:18px; }
.face.front img { display:block; width:100%; height:100%; object-fit:cover; border-radius:4px; }
.face.front span { position:absolute; left:40px; bottom:36px; font:italic 900 64px "Playfair Display"; color:#fff; text-shadow:0 4px 18px rgba(0,0,0,0.7); }
.face.back { transform:rotateY(180deg); background:#fbf6ea; display:flex; padding:40px 36px; }
.pc-l { flex:1.35; padding-right:28px; border-right:3px solid rgba(59,42,20,0.25); }
.pc-h { font:800 26px "Montserrat"; letter-spacing:0.22em; color:var(--tead); margin-bottom:22px; }
.hw { font:italic 700 40px/1.35 "Playfair Display"; color:#2a3a63; margin-bottom:16px; }
.pc-r { position:relative; flex:1; padding-left:28px; }
.pstamp { position:absolute; right:0; top:0; width:120px; height:140px; border:5px dashed #9bd16a; background:var(--forest); font:900 30px/1.2 "Montserrat"; font-style:normal; color:var(--sun); text-align:center; padding-top:30px; }
.pmark { position:absolute; right:70px; top:80px; width:170px; height:170px; border-radius:50%; border:4px solid rgba(42,58,99,0.55); font:800 22px/1.4 "Montserrat"; font-style:normal; color:rgba(42,58,99,0.65); text-align:center; padding-top:52px; transform:rotate(-12deg); }
.pc-r b { display:block; height:3px; margin-top:58px; background:rgba(59,42,20,0.3); }
.pc-r b:first-of-type { margin-top:280px; }
.brand { position:absolute; left:60px; top:60px; z-index:21; font:800 26px "Montserrat"; letter-spacing:0.3em; color:rgba(247,244,234,0.88); text-shadow:0 2px 10px rgba(0,0,0,0.5); }
.brand b { color:var(--tea); letter-spacing:0; margin-right:12px; }
.cap { position:absolute; left:60px; right:60px; top:1500px; text-align:center; font:800 50px/1.25 "Montserrat"; color:#ffffff; text-shadow:0 3px 0 rgba(0,0,0,0.55), 0 0 22px rgba(0,0,0,0.85); z-index:20;${cover ? " display:none;" : ""} }
/* Plan B card: same paper as the restaurant card, sun-yellow edge, a stamped "B" in the corner. */
.card.alt { top:1050px; }
.card.alt::before { background:linear-gradient(180deg, #ffd76a, #e0a93a); }
.alt-note { margin:10px 0 6px; font:600 26px "Montserrat"; color:rgba(31,51,36,0.7); }
.alt-b { position:absolute; right:26px; top:14px; width:62px; height:62px; border-radius:50%; border:4px solid #c0392b; color:#c0392b; font:900 38px/54px "Montserrat"; font-style:normal; text-align:center; opacity:0; }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="${W}" data-height="${H}">
${mediaTags.join("\n")}
${sfx.join("\n")}
${html.join("\n")}
${motes.join("\n")}
<div class="brand" data-layout-ignore><b>❦</b>${esc(brand)}</div>
${caps.join("\n")}
</div>
<script>
const tl = gsap.timeline({ paused: true });
${js.join("\n")}
HyperShader.init({
  bgColor: "#101a14",
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
