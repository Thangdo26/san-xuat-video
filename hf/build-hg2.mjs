#!/usr/bin/env node
/**
 * node hf/build-hg2.mjs --slug ha-giang-3n2d-v2
 *
 * Turns data/videos/<slug>/video.json + voiceover.json into a HyperFrames project at build/<slug>/.
 * The look ("Hà Giang 3N2Đ mùa tam giác mạch", làm lại 21/11/2026), new for this channel (checked against
 * D:/Thang_space_archive/STYLE-LOG.md):
 *   - cold open: five beat-cut clips seen through binoculars, music only, no voice (rule 16/11/2026); the binocular
 *     mask opens up to the full frame and the title is stencilled letter by letter, then the voice starts;
 *   - pictures change through mist rising from the bottom of the frame, or a tilted push that settles;
 *   - a light drizzle falls over everything (the cold, wet week of 18–22/11);
 *   - each day gets a yellow warning road sign (triangle, "N1") that swings down from the top;
 *   - cards are slate glass with a red-and-gold edge;
 *   - between two days, the day just done comes back as a fan of 3–4 photos dealt like cards (user request 20/11/2026);
 *   - "Thêm ngày 4?" plants red-and-white km posts;
 *   - "Hết bao nhiêu?" is a motorbike fuel gauge: lines tick in, the needle sweeps to the total;
 *   - outro: three tips, then the whole loop is drawn as a route with pins, then "Lưu lại nhé!";
 *   - shader seams: ripple-waves, swirl-vortex, cross-warp-morph, light-leak, whip-pan.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fail, parseArgs, requireSlug } from "../scripts/lib/args.mjs";
import { probeDurationSec } from "../scripts/lib/media.mjs";
import { PROJECT_ROOT, PUBLIC_ROOT } from "../scripts/lib/paths.mjs";

const { flags } = parseArgs(process.argv.slice(2));
const slug = requireSlug(flags, "build-hg2");
const dataDir = path.join(PROJECT_ROOT, "data", "videos", slug);
const video = JSON.parse(readFileSync(path.join(dataDir, "video.json"), "utf8"));
const credits = JSON.parse(readFileSync(path.join(dataDir, "credits.json"), "utf8"));
const voicePath = path.join(dataDir, "voiceover.json");
if (!existsSync(voicePath)) fail(`No voiceover.json for ${slug}; make the voice first.`);
const voice = JSON.parse(readFileSync(voicePath, "utf8")).clips;
const NO_CAPS = Boolean(flags.cover); // --cover: same page without subtitles, for the cover still

const W = 1080;
const H = 1920;
const LEAD = video.transitionFrames / video.format.fps;
const SEAM = 0.75;
const CLEAR = 3; // seconds a clip shows uncovered before the first card
const r2 = (n) => Math.round(n * 1000) / 1000;

const out = path.join(PROJECT_ROOT, "build", slug + (NO_CAPS ? "-cover" : ""));
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
const norm = (s) => s.toLowerCase().normalize("NFC").replace(/[.,!?;:…"“”()]/g, "").trim();
const star = (r) => (r == null ? "gợi ý" : `★${r.toFixed(1)}`);
const handle = (src) => credits.find((c) => c.file === src)?.author ?? "";

// ---- timing -------------------------------------------------------------
let t = 0;
const scenes = video.scenes.map((s, i) => {
  const start = t;
  t += s.durationSec;
  return { ...s, i, start, end: t, clip: voice[s.id], vo: start + LEAD + (s.voiceDelay ?? 0) };
});
const total = r2(t);
const days = scenes.filter((s) => s.day);

const cueTime = (s, phrase) => {
  if (!phrase || !s.clip?.words?.length) return null;
  const target = norm(phrase).split(/\s+/);
  const ws = s.clip.words.map((w) => norm(w.text));
  for (let i = 0; i <= ws.length - target.length; i++) {
    if (target.every((tw, k) => ws[i + k] === tw || ws[i + k]?.startsWith(tw))) return s.vo + s.clip.words[i].startMs / 1000;
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

let videoTrack = 40;
const media = (src, id, from, dur) =>
  `<video id="${id}-v" class="clip" src="${asset(src)}" muted playsinline data-start="${r2(Math.max(0, from))}" data-duration="${r2(Math.min(dur, total - Math.max(0, from)))}" data-track-index="${videoTrack++}"></video>`;
const creditTag = (src) => (handle(src) ? `<div class="cr">🎥 ${esc(handle(src))}</div>` : "");

/**
 * Footage stack. Odd changes: mist rises from the bottom edge (a soft linear mask climbs the frame). Even changes:
 * the new clip pushes in tilted and settles level.
 */
const photos = (s, from, to, idPrefix) => {
  const g = s.gallery ?? [];
  const seg = (to - from) / g.length;
  const parts = [];
  g.forEach((src, k) => {
    const id = `${idPrefix}-p${k}`;
    const a = r2(from + seg * k);
    tw(`tl.fromTo("#${id} video", {scale:1.03}, {scale:1.13, duration:${r2(seg + 0.8)}, ease:"none"}, ${a});`);
    const inner = media(src, id, a - 0.9, seg + 1.8) + creditTag(src);
    if (k === 0) return parts.push(`<div id="${id}" class="ph">${inner}</div>`);
    if (k % 2 === 1) {
      tw(`tl.set("#${id}", {"--p":"-25%"}, 0);`);
      tw(`tl.fromTo("#${id}", {"--p":"-25%"}, {"--p":"110%", duration:0.85, ease:"power2.inOut", immediateRender:false}, ${r2(a - 0.4)});`);
      tw(`tl.set("#${idPrefix}-p${k - 1}", {opacity:0}, ${r2(a + 0.5)});`);
      sound("whoosh-cinematic", r2(a - 0.4), 0.05);
      return parts.push(`<div id="${id}" class="ph rise">${inner}</div>`);
    }
    tw(`tl.set("#${id}", {opacity:0}, 0);`);
    tw(`tl.fromTo("#${id}", {opacity:0, scale:1.22, rotation:-5}, {opacity:1, scale:1, rotation:0, duration:0.55, ease:"power3.out", immediateRender:false}, ${r2(a - 0.1)});`);
    tw(`tl.set("#${idPrefix}-p${k - 1}", {opacity:0}, ${r2(a + 0.5)});`);
    sound("whoosh-short", r2(a - 0.12), 0.05);
    parts.push(`<div id="${id}" class="ph">${inner}</div>`);
  });
  return parts.join("");
};

const titleIn = (sel, at) =>
  tw(`tl.fromTo("${sel} .w", {opacity:0, y:30, filter:"blur(10px)"}, {opacity:1, y:0, filter:"blur(0px)", duration:0.5, stagger:0.07, ease:"power3.out"}, ${r2(at)});`);
const fadeUp = (sel, at, dur = 0.35) =>
  tw(`tl.fromTo("${sel}", {opacity:0, y:26}, {opacity:1, y:0, duration:${dur}, ease:"expo.out"}, ${r2(at)});`);
const hideOut = (sel, at) => tw(`tl.to("${sel}", {opacity:0, y:30, duration:0.4, ease:"power2.in"}, ${r2(at)});`);

// ---- warning road sign badge -------------------------------------------------
/** A yellow triangle sign on a short pole swings down from the top edge and wobbles to rest. */
const sign = (sid, day, note, at) => {
  tw(`tl.fromTo("#${sid}-sign", {opacity:0, rotation:-70}, {opacity:1, rotation:0, duration:0.9, ease:"elastic.out(1, 0.45)"}, ${r2(at)});`);
  sound("pop", r2(at + 0.15), 0.05);
  return `<div id="${sid}-sign" class="sign" style="opacity:0"><i class="sign-pole"></i><div class="sign-tri"><b>${esc(day)}</b></div><span>${esc(note)}</span></div>`;
};

const row = (p) => `<div class="row"><b>${esc(p.place)}</b><span>${esc(p.address)}</span><em class="${p.rating == null ? "sugg" : ""}">${star(p.rating)}</em></div>`;

// Google Maps screenshots (name + stars + review count), captured 21/11/2026 into public/videos/ha-giang/maps.
const MAPS = video.maps ?? {};
const MAPS_DATE = "chụp 21/11/2026";

const clearAt = (from, n, end) => {
  const shown = from + 0.45 + n * 0.9;
  const tt = Math.max(Math.min(shown + 1.6, end - 1.2), shown + 0.8);
  return tt < end - 0.5 ? tt : null;
};

/** A Google Maps panel above a card: one screenshot per listed place, sliding in while its row lights up. */
const proofs = (id, rowsSel, places, from, to, hide = null) => {
  const list = places.map((p, k) => [MAPS[p.place], k]).filter(([m]) => m);
  if (!list.length) return "";
  if (hide != null) hideOut(`#${id}`, hide - 0.1);
  const slot = Math.min(0.9, Math.max(0.5, (to - from - 1) / list.length));
  tw(`tl.fromTo("#${id}", {opacity:0, y:40, scale:0.92}, {opacity:1, y:0, scale:1, duration:0.4, ease:"back.out(1.5)"}, ${r2(from + 0.25)});`);
  list.forEach(([, k], i) => {
    const t0 = from + 0.45 + i * slot;
    tw(`tl.fromTo("#${id}-${k}", {opacity:0, x:60}, {opacity:1, x:0, duration:0.35, ease:"power3.out"}, ${r2(t0)});`);
    tw(`tl.fromTo(document.querySelectorAll("${rowsSel}")[${k}], {backgroundColor:"rgba(245,200,76,0)"}, {backgroundColor:"rgba(245,200,76,0.28)", duration:0.25, yoyo:true, repeat:1, repeatDelay:${r2(Math.max(slot - 0.5, 0.2))}}, ${r2(t0)});`);
  });
  return `<div id="${id}" class="gmaps" style="opacity:0"><div class="gmaps-h"><i>📍</i>Google Maps<span>${MAPS_DATE}</span></div>${list.map(([m, k]) => `<img id="${id}-${k}" src="${asset(`videos/ha-giang/maps/${m}.png`)}" alt="" />`).join("")}</div>`;
};

/** Cards shown one at a time (each up at least 1.6 s); returns their html and start times. */
const cardSeq = (sid, s, cards, enter, end) => {
  const times = [];
  cards.forEach((c, k) => {
    const cue = cueTime(s, c.cue) ?? enter + 1.5 + k * ((end - enter - 2) / cards.length);
    times.push(Math.max(cue, k ? times[k - 1] + 1.6 : enter + Math.min(CLEAR, 1.8)));
  });
  const parts = [];
  cards.forEach((c, k) => {
    const id = `${sid}-c${k}`;
    parts.push(`<div id="${id}" class="card" style="opacity:0"><div class="card-h">${esc(c.title.toUpperCase())}<span class="dots">${cards.map((_, j) => `<i class="${j === k ? "on" : ""}"></i>`).join("")}</span></div>${c.body}</div>`);
    tw(`tl.fromTo("#${id}", {opacity:0, y:50}, {opacity:1, y:0, duration:0.4, ease:"expo.out"}, ${r2(times[k] - 0.05)});`);
    if (k < cards.length - 1) tw(`tl.to("#${id}", {opacity:0, y:-30, duration:0.2, ease:"power3.in"}, ${r2(times[k + 1] - 0.22)});`);
    else if (end - times[k] > 3.0) hideOut(`#${id}`, end - 0.9);
    if (c.rows) tw(`tl.fromTo("#${id} .row", {opacity:0, x:-40}, {opacity:1, x:0, duration:0.3, stagger:0.09, ease:"power3.out"}, ${r2(times[k] + 0.15)});`);
  });
  return { html: parts.join(""), times };
};

// ---- between two days: the day just done, dealt as a fan of cards ---------------------------
const recap = (s, sid, from) => {
  const list = s.recap;
  const n = list.length;
  tw(`tl.fromTo("#${sid}-rc", {opacity:0}, {opacity:1, duration:0.3, ease:"power1.out"}, ${r2(from)});`);
  fadeUp(`#${sid}-rc-h`, from + 0.1);
  const cards = list.map((name, k) => {
    const ang = (k - (n - 1) / 2) * 13;
    const dx = (k - (n - 1) / 2) * 120;
    const t0 = from + 0.3 + k * 0.32;
    tw(`tl.fromTo("#${sid}-rc${k}", {opacity:0, x:0, y:700, rotation:0}, {opacity:1, x:${dx}, y:${Math.abs(ang) * 3}, rotation:${ang}, duration:0.5, ease:"back.out(1.2)"}, ${r2(t0)});`);
    sound("whoosh-short", r2(t0), 0.04);
    const who = handle(`videos/ha-giang/footage/${name}.mp4`);
    return `<div id="${sid}-rc${k}" class="fan" style="opacity:0"><img src="${asset(`videos/ha-giang/recap/${name}.jpg`)}" alt="" /><span>${esc(who)}</span></div>`;
  }).join("");
  const doneAt = from + 0.3 + n * 0.32 + 0.25;
  tw(`tl.fromTo("#${sid}-done", {opacity:0, scale:1.8}, {opacity:1, scale:1, duration:0.25, ease:"power4.in"}, ${r2(doneAt)});`);
  sound("impact-bass-1", r2(doneAt + 0.2), 0.06);
  return `<div id="${sid}-rc" class="recap" style="opacity:0"><div id="${sid}-rc-h" class="recap-h"><small>${esc(s.recapLabel ?? "")}</small><b>${esc(s.caption)}</b></div><div class="fan-hub">${cards}</div><div id="${sid}-done" class="done" style="opacity:0">ĐÃ ĐI QUA ✓</div></div>`;
};

// ---- cold open ---------------------------------------------------------------
/**
 * Five beat-cut clips seen through binoculars over the music (no voice). At the end the two lenses widen until
 * the frame is clear, the hook's clips take over and the title is stencilled in, then the voice starts.
 */
const coldOpen = (s, sid) => {
  const cold = s.cold ?? [];
  const COLD = s.voiceDelay ?? 0;
  const len = r2((COLD - 0.6) / Math.max(1, cold.length));
  const parts = [];
  cold.forEach((src, k) => {
    const id = `${sid}-k${k}`;
    const from = r2(k * len);
    parts.push(`<div id="${id}" class="ph"${k ? ' style="opacity:0"' : ""}>${media(src, id, from, len + 0.4)}${creditTag(src)}</div>`);
    if (k) tw(`tl.set("#${id}", {opacity:1}, ${from});`);
    tw(`tl.set("#${id}", {opacity:0}, ${r2(from + len + 0.02)});`);
    tw(`tl.fromTo("#${id} video", {scale:1.18}, {scale:1.04, duration:${len}, ease:"power1.out"}, ${from});`);
    if (k) sound("whoosh-short", r2(from - 0.08), 0.08);
  });
  const after = r2(cold.length * len);
  // Binoculars: a black frame with two round holes (SVG mask) that widen at the end.
  parts.push(`<svg id="${sid}-bino" class="bino" viewBox="0 0 1080 1920" preserveAspectRatio="none"><defs><mask id="${sid}-bm"><rect width="1080" height="1920" fill="#fff"/><circle id="${sid}-l1" cx="360" cy="860" r="330" fill="#000"/><circle id="${sid}-l2" cx="720" cy="860" r="330" fill="#000"/></mask></defs><rect width="1080" height="1920" fill="#05080a" mask="url(#${sid}-bm)"/></svg>`);
  tw(`tl.fromTo("#${sid}-l1", {attr:{r:330, cx:360}}, {attr:{r:1500, cx:540}, duration:0.7, ease:"power2.in"}, ${r2(after - 0.55)});`);
  tw(`tl.fromTo("#${sid}-l2", {attr:{r:330, cx:720}}, {attr:{r:1500, cx:540}, duration:0.7, ease:"power2.in"}, ${r2(after - 0.55)});`);
  tw(`tl.set("#${sid}-bino", {opacity:0}, ${r2(after + 0.2)});`);
  tw(`tl.fromTo("#${sid}-bino", {x:-14}, {x:14, duration:0.9, yoyo:true, repeat:${Math.max(1, Math.floor(after / 0.9) - 1)}, ease:"sine.inOut"}, 0);`);
  sound("riser", r2(Math.max(0, after - 1.6)), 0.08);
  const g = s.gallery ?? [];
  const seg = (s.end - after) / Math.max(1, g.length);
  g.forEach((src, k) => {
    const id = `${sid}-p${k}`;
    const from = r2(after + seg * k);
    parts.push(`<div id="${id}" class="ph" style="opacity:0">${media(src, id, from - 0.3, seg + 0.8)}${creditTag(src)}</div>`);
    tw(`tl.set("#${id}", {opacity:1}, ${from});`);
    tw(`tl.fromTo("#${id} video", {scale:1.14}, {scale:1.02, duration:${r2(seg + 0.6)}, ease:"none"}, ${from});`);
    if (k) tw(`tl.set("#${sid}-p${k - 1}", {opacity:0}, ${r2(from + 0.02)});`);
  });
  return { html: parts.join(""), after };
};

// ---- drizzle ----------------------------------------------------------------
const drops = [];
for (let k = 0; k < 22; k++) {
  const x0 = 20 + ((k * 197) % 1040);
  const len = 60 + (k % 4) * 26;
  drops.push(`<i id="dz${k}" class="dz" style="left:${x0}px;top:-160px;height:${len}px" data-layout-ignore></i>`);
  const fall = 1.1 + (k % 5) * 0.18;
  for (let at = (k * 0.37) % 3, n = 0; at < total; at += fall + 1.7 + (k % 3) * 0.6, n++) {
    tw(`tl.fromTo("#dz${k}", {x:0, y:0, opacity:0.45}, {x:-260, y:2200, opacity:0.45, duration:${r2(fall)}, ease:"none", immediateRender:${n === 0}}, ${r2(at)});`);
    tw(`tl.set("#dz${k}", {opacity:0}, ${r2(at + fall)});`);
  }
}

// ---- day chips -------------------------------------------------------------
const dayChips = (sid, idx) => {
  const chips = days.map((x, k) => `<i class="${k < idx ? "done" : k === idx ? "now" : ""}">${esc(x.day)}</i>`).join("");
  return `<div id="${sid}-days" class="days">${chips}</div>`;
};

// ---- scenes -------------------------------------------------------------
for (const s of scenes) {
  const sid = `s-${s.id}`;
  const a = s.start;
  const enter = a + LEAD;
  const parts = [];

  if (s.layout === "hook") {
    const m = coldOpen(s, sid);
    parts.push(m.html);
    parts.push(`<div id="${sid}-dim" class="hook-dim" style="opacity:0"></div>`);
    tw(`tl.fromTo("#${sid}-dim", {opacity:0}, {opacity:1, duration:0.4}, ${r2(m.after)});`);
    // Stencilled title: each letter is sprayed on (drops in from 1.6x, sharp), then a red-gold stripe runs under it.
    const letters = [...s.caption].map((c, k) => `<span id="${sid}-l${k}" style="opacity:0">${c === " " ? "&nbsp;" : esc(c)}</span>`).join("");
    parts.push(`<div id="${sid}-tt" class="sten" style="opacity:0"><small>${esc(s.kicker)}</small><h1>${letters}</h1><i id="${sid}-stripe" class="sten-stripe"></i><div class="sten-sub"><b>${esc(s.label)}</b><span>${esc(s.sub ?? "")}</span></div></div>`);
    tw(`tl.set("#${sid}-tt", {opacity:1}, ${r2(m.after + 0.1)});`);
    [...s.caption].forEach((_, k) => tw(`tl.fromTo("#${sid}-l${k}", {opacity:0, scale:1.6}, {opacity:1, scale:1, duration:0.16, ease:"power4.in", immediateRender:false}, ${r2(m.after + 0.15 + k * 0.08)});`));
    const stripeAt = m.after + 0.2 + s.caption.length * 0.08;
    tw(`tl.fromTo("#${sid}-stripe", {scaleX:0}, {scaleX:1, duration:0.45, ease:"power2.out"}, ${r2(stripeAt)});`);
    fadeUp(`#${sid}-tt .sten-sub`, stripeAt + 0.2);
    sound("impact-bass-1", r2(m.after + 0.15), 0.1);
    const lift = s.vo + 3.0;
    tw(`tl.to("#${sid}-tt", {opacity:0, y:-80, duration:0.5, ease:"power2.in"}, ${r2(lift)});`);
    tw(`tl.to("#${sid}-dim", {opacity:0.3, duration:0.6}, ${r2(lift)});`);
  } else if (s.layout === "point") {
    const bodyEnd = s.end - (s.recapSec ?? 0);
    parts.push(photos(s, a, bodyEnd, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div class="floor"></div>`);
    const idx = days.findIndex((x) => x.id === s.id);
    parts.push(sign(sid, s.day, s.badge ?? "", enter + 0.4));
    parts.push(`<div class="head">`);
    parts.push(`<div id="${sid}-kicker" class="kicker">${esc(s.label.toUpperCase())}</div>`);
    parts.push(`<h1 id="${sid}-title" class="title">${words(s.caption)}</h1>`);
    fadeUp(`#${sid}-kicker`, enter, 0.25);
    titleIn(`#${sid}-title`, enter + 0.15);
    (s.points ?? []).forEach((p, k) => {
      parts.push(`<div id="${sid}-pt${k}" class="point"><i></i>${esc(p)}</div>`);
      fadeUp(`#${sid}-pt${k}`, enter + 0.8 + k * 0.4);
    });
    parts.push(`</div>`);
    const dishes = s.dishes ?? [];
    const named = cueTime(s, dishes[0]?.spokenAs ?? dishes[0]?.place) ?? a + (bodyEnd - a) * 0.5;
    const cue = Math.max(Math.min(named, bodyEnd - 2.6 - dishes.length * 0.9 - 0.45), enter + CLEAR);
    parts.push(`<div id="${sid}-food" class="card" style="opacity:0"><div class="card-h">${esc(s.cardTitle ?? "ĂN GẦN ĐÂY")}</div>${dishes.map((dd) => row(dd)).join("")}</div>`);
    tw(`tl.fromTo("#${sid}-food", {opacity:0, y:60}, {opacity:1, y:0, duration:0.45, ease:"expo.out"}, ${r2(cue - 0.1)});`);
    tw(`tl.fromTo("#${sid}-food .row", {opacity:0, x:-40}, {opacity:1, x:0, duration:0.3, stagger:0.09, ease:"power3.out"}, ${r2(cue + 0.15)});`);
    const hide = clearAt(cue, dishes.length, bodyEnd);
    hideOut(`#${sid}-food`, hide ?? bodyEnd - 0.45);
    parts.push(proofs(`${sid}-gm`, `#${sid}-food .row`, dishes, cue, bodyEnd, hide ?? bodyEnd - 0.35));
    parts.push(dayChips(sid, idx));
    fadeUp(`#${sid}-days`, enter + 0.4);
    if (s.recap?.length) parts.push(recap(s, sid, bodyEnd));
  } else if (s.layout === "extra") {
    // "Thêm ngày 4?": red-and-white km posts rise out of the ground, one per idea, on their cue words.
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div class="floor"></div>`);
    parts.push(`<div class="head"><div id="${sid}-kicker" class="kicker">${esc(s.kicker)}</div><h1 id="${sid}-title" class="title">${words(s.caption)}</h1></div>`);
    fadeUp(`#${sid}-kicker`, enter, 0.25);
    titleIn(`#${sid}-title`, enter + 0.15);
    let prev = enter + 0.9;
    (s.items ?? []).forEach((it, k) => {
      const at = Math.max(cueTime(s, it.cue) ?? prev + 1.5, prev + 1.0);
      prev = at;
      parts.push(`<div id="${sid}-km${k}" class="km" style="opacity:0;top:${990 + k * 140}px"><i class="km-post"><b>${k + 1}</b></i><div><b>${esc(it.t)}</b><span>${esc(it.s)}</span></div></div>`);
      tw(`tl.fromTo("#${sid}-km${k}", {opacity:0, y:90}, {opacity:1, y:0, duration:0.45, ease:"back.out(2)"}, ${r2(at)});`);
      sound("pop", r2(at + 0.1), 0.06);
    });
    if (s.end - prev > 3.2) hideOut(`#${sid}-km0, #${sid}-km1, #${sid}-km2`, s.end - 0.9);
    parts.push(dayChips(sid, days.findIndex((x) => x.id === s.id)));
    fadeUp(`#${sid}-days`, enter + 0.4);
  } else if (s.layout === "stay") {
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div class="floor"></div>`);
    parts.push(`<div class="head"><div id="${sid}-kicker" class="kicker">ĐÊM Ở HÀ GIANG</div><h1 id="${sid}-title" class="title">${words(s.caption)}</h1></div>`);
    fadeUp(`#${sid}-kicker`, enter, 0.25);
    titleIn(`#${sid}-title`, enter + 0.15);
    const cards = s.zones.map((z, k) => ({
      title: `${k + 1} · ${z.title}`, cue: s.cues[k], rows: true,
      body: `<p class="card-n">${esc(z.note)}</p>` + z.picks.map(([n, rt, ad]) => row({ place: n, address: ad, rating: rt })).join(""),
    }));
    cards.push({ title: "Nhớ nha", cue: s.cues.at(-1), body: `<p class="card-t">${esc(s.tip)}</p>` });
    const cs = cardSeq(sid, s, cards, enter, s.end);
    parts.push(cs.html);
    s.zones.forEach((z, k) => {
      const places = z.picks.map(([n]) => ({ place: n }));
      const until = cs.times[k + 1] ?? s.end;
      parts.push(proofs(`${sid}-gm${k}`, `#${sid}-c${k} .row`, places, cs.times[k], until, until - 0.1));
    });
  } else if (s.layout === "cost") {
    // "Hết bao nhiêu?": a motorbike dashboard. The fuel gauge needle climbs from E as each line ticks in and lands on F
    // when the total shows.
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div id="${sid}-veil" class="veil" style="opacity:0"></div>`);
    parts.push(`<div class="head"><div id="${sid}-kicker" class="kicker">${esc(s.kicker ?? "")}</div><h1 id="${sid}-title" class="title" style="font-size:86px">${words(s.caption)}</h1></div>`);
    fadeUp(`#${sid}-kicker`, enter, 0.25);
    titleIn(`#${sid}-title`, enter + 0.15);
    const t0 = enter + 0.7;
    tw(`tl.fromTo("#${sid}-veil", {opacity:0}, {opacity:1, duration:0.4}, ${r2(t0 - 0.2)});`);
    const items = s.items ?? [];
    const totalAt = Math.max(cueTime(s, s.totalCue) ?? s.end - 2.6, t0 + 0.5 + items.length * 0.45 + 0.3);
    const step = Math.min(0.75, (totalAt - t0 - 0.5) / Math.max(1, items.length));
    const lines = items.map((it, k) => {
      const at = t0 + 0.5 + k * step;
      tw(`tl.fromTo("#${sid}-ln${k}", {opacity:0, x:-50}, {opacity:1, x:0, duration:0.3, ease:"power3.out"}, ${r2(at)});`);
      tw(`tl.to("#${sid}-needle", {rotation:${r2(-80 + ((k + 1) / (items.length + 1)) * 150)}, duration:0.35, ease:"back.out(2)"}, ${r2(at)});`);
      sound("pop", r2(at + 0.1), 0.04);
      return `<div id="${sid}-ln${k}" class="dl" style="opacity:0"><span>${esc(it.k)}</span><b>${esc(it.v)}</b></div>`;
    }).join("");
    const ticks = Array.from({ length: 9 }, (_, k) => `<i style="transform:rotate(${-80 + k * 20}deg)"></i>`).join("");
    parts.push(`<div id="${sid}-dash" class="dash" style="opacity:0"><div class="gauge"><div class="g-arc">${ticks}</div><span class="g-e">E</span><span class="g-f">F</span><i id="${sid}-needle" class="needle"></i><i class="g-hub"></i><small>⛽ ${esc(s.receiptTitle ?? "")}</small></div><div class="dlines">${lines}</div>` +
      `<div id="${sid}-tot" class="dtot" style="opacity:0"><span>TỔNG / NGƯỜI</span><b>${esc(s.total)}</b></div><div class="dnote">${esc(s.note ?? "")}</div></div>`);
    tw(`tl.set("#${sid}-needle", {rotation:-80}, 0);`);
    tw(`tl.fromTo("#${sid}-dash", {opacity:0, y:80}, {opacity:1, y:0, duration:0.45, ease:"expo.out"}, ${r2(t0)});`);
    tw(`tl.to("#${sid}-needle", {rotation:72, duration:0.5, ease:"elastic.out(1, 0.5)"}, ${r2(totalAt)});`);
    tw(`tl.fromTo("#${sid}-tot", {opacity:0, scale:0.7}, {opacity:1, scale:1, duration:0.35, ease:"back.out(2.2)"}, ${r2(totalAt)});`);
    sound("impact-bass-1", r2(totalAt + 0.1), 0.09);
    parts.push(`<div id="${sid}-stamp" class="stamp" style="opacity:0">${esc(s.stamp ?? "")}</div>`);
    tw(`tl.fromTo("#${sid}-stamp", {opacity:0, scale:2.2, rotation:-24}, {opacity:1, scale:1, rotation:-8, duration:0.3, ease:"power4.in"}, ${r2(totalAt + 0.7)});`);
  } else {
    // Outro: three tips, then the whole loop drawn as a route with numbered pins, then the call to action.
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div id="${sid}-dim" class="hook-dim" style="opacity:0"></div>`);
    tw(`tl.to("#${sid}-dim", {opacity:1, duration:0.5}, ${r2(enter)});`);
    parts.push(`<div id="${sid}-kicker" class="tips-h" style="opacity:0">${esc(s.kicker ?? "")}</div>`);
    fadeUp(`#${sid}-kicker`, enter + 0.3);
    const tipAt = (k) => cueTime(s, s.tipCues?.[k]) ?? enter + 0.8 + k * 1.2;
    (s.tips ?? []).forEach((tip, k) => {
      parts.push(`<div id="${sid}-tip${k}" class="tip" style="opacity:0;top:${600 + k * 120}px"><i id="${sid}-tick${k}">✓</i>${esc(tip)}</div>`);
      tw(`tl.fromTo("#${sid}-tip${k}", {opacity:0, x:-40}, {opacity:1, x:0, duration:0.35, ease:"power3.out"}, ${r2(tipAt(k))});`);
      tw(`tl.fromTo("#${sid}-tick${k}", {scale:0}, {scale:1, duration:0.25, ease:"back.out(3)"}, ${r2(tipAt(k) + 0.2)});`);
      sound("pop", r2(tipAt(k) + 0.2), 0.06);
    });
    const mapAt = s.end - 5.6;
    tw(`tl.to(["#${sid}-kicker", ${(s.tips ?? []).map((_, k) => `"#${sid}-tip${k}"`).join(", ")}], {opacity:0, y:-30, duration:0.3}, ${r2(mapAt - 0.35)});`);
    parts.push(`<h1 id="${sid}-title" class="out-title">${words(s.caption)}</h1>`);
    titleIn(`#${sid}-title`, mapAt - 0.2);
    // A loose loop: TP → north-east to Lô Lô / Lũng Cú → east to Đồng Văn → south-east to Mã Pì Lèng, Nho Quế.
    const stops = s.routeStops ?? [];
    const P = [[150, 1300], [210, 1060], [330, 900], [420, 690], [560, 640], [650, 820], [800, 940], [880, 1120]].slice(0, stops.length);
    const d = P.map(([x, y], k) => (k ? `L${x} ${y}` : `M${x} ${y}`)).join(" ");
    const pins = P.map(([x, y], k) => `<div id="${sid}-pin${k}" class="pin" style="left:${x}px;top:${y}px;opacity:0"><i>${k + 1}</i><span class="${[3, 6, 7].includes(k) ? "l" : ""}">${esc(stops[k])}</span></div>`).join("");
    parts.push(`<div id="${sid}-map" class="rmap" style="opacity:0"><svg viewBox="0 0 1080 1920"><path id="${sid}-path" d="${d}" /></svg>${pins}</div>`);
    tw(`tl.fromTo("#${sid}-map", {opacity:0}, {opacity:1, duration:0.3}, ${r2(mapAt)});`);
    tw(`tl.fromTo("#${sid}-path", {strokeDashoffset:2400}, {strokeDashoffset:0, duration:2.2, ease:"power1.inOut"}, ${r2(mapAt + 0.1)});`);
    P.forEach((_, k) => {
      const at = mapAt + 0.1 + (k / Math.max(1, P.length - 1)) * 2.2;
      tw(`tl.fromTo("#${sid}-pin${k}", {opacity:0, y:-40}, {opacity:1, y:0, duration:0.3, ease:"bounce.out"}, ${r2(at)});`);
    });
    sound("riser", r2(mapAt + 0.1), 0.05);
    const ctaAt = mapAt + 2.6;
    parts.push(`<div id="${sid}-cta" class="pill cta" style="opacity:0">${esc(s.cta ?? "")}</div>`);
    tw(`tl.fromTo("#${sid}-cta", {opacity:0, scale:0.5}, {opacity:1, scale:1, duration:0.4, ease:"back.out(2.4)"}, ${r2(ctaAt)});`);
    sound("impact-bass-1", r2(ctaAt), 0.09);
  }

  html.push(`<section id="${sid}" class="scene"${s.i === 0 ? "" : ' style="opacity:0"'}>${parts.join("")}</section>`);
}

// ---- subtitles ----------------------------------------------------------
const caps = [];
for (const s of NO_CAPS ? [] : scenes) {
  const ws = s.clip?.words ?? [];
  let line = [];
  const flush = (nextStartMs) => {
    if (!line.length) return;
    const st = s.vo + line[0].startMs / 1000;
    const en = Math.min(s.end - (s.recapSec ?? 0), s.vo + (nextStartMs ?? line.at(-1).endMs + 400) / 1000);
    const id = `cap-${s.id}-${caps.length}`;
    const spans = line.map((w, k) => `<span id="${id}-${k}">${esc(w.text.trim())}</span>`).join(" ");
    caps.push(`<div id="${id}" class="cap clip" data-start="${r2(st)}" data-duration="${r2(Math.max(0.3, en - st))}" data-track-index="9">${spans}</div>`);
    line.forEach((w, k) => tw(`tl.set("#${id}-${k}", {color:"${video.theme.highlight}"}, ${r2(s.vo + w.startMs / 1000)});`));
    line = [];
  };
  ws.forEach((w, k) => {
    const len = line.map((x) => x.text.trim()).join(" ").length + w.text.trim().length;
    if (line.length && (len > 28 || /[.,!?:]$/.test(line.at(-1).text.trim()))) flush(w.startMs);
    line.push(w);
    if (k === ws.length - 1) flush(null);
  });
}

// ---- audio --------------------------------------------------------------
const mediaTags = [];
for (const s of scenes) {
  if (!s.clip) continue;
  mediaTags.push(`<audio id="vo-${s.id}" src="${asset(s.clip.file)}" data-start="${r2(s.vo)}" data-duration="${r2(s.clip.durationSec)}" data-volume="1" data-track-index="2"></audio>`);
}
// The music bed carries the cold open on its own (louder), then sits under the voice and loops to the end.
const musicSrc = asset(video.music.src);
const musicLen = probeDurationSec(path.join(PUBLIC_ROOT, video.music.src));
const COLD = scenes[0].voiceDelay ?? 0;
for (let at = 0, k = 0; at < total - 0.05; k++) {
  const dur = r2(Math.min(musicLen, total - at));
  const last = at + dur >= total - 0.01;
  mediaTags.push(`<audio id="music-${k}" src="${musicSrc}" data-start="${r2(at)}" data-duration="${dur}" data-volume="0.24" data-fade-in="${k ? 1 : 0.3}" data-fade-out="${last ? 1.5 : 1}" data-track-index="${k % 2 ? 31 : 30}"></audio>`);
  if (last) break;
  at = r2(at + dur - 1);
}
// A louder copy of the opening bars under the cold open, faded out as the voice comes in.
mediaTags.push(`<audio id="music-cold" src="${musicSrc}" data-start="0" data-duration="${r2(COLD + 0.4)}" data-volume="0.5" data-fade-in="0.2" data-fade-out="0.9" data-track-index="32"></audio>`);

// ---- shader seams + quiet whooshes -----------------------------------
const SHADERS = ["ripple-waves", "swirl-vortex", "cross-warp-morph", "light-leak", "whip-pan"];
const transitions = scenes.slice(1).map((s, k) => ({ time: r2(s.start - SEAM / 2), shader: SHADERS[k % SHADERS.length], duration: SEAM }));
for (const tr of transitions) sound("whoosh-short", r2(tr.time - 0.1), 0.14);

const FONTS = JSON.parse(readFileSync(path.join(PUBLIC_ROOT, "shared", "fonts", "fonts.json"), "utf8"));
const fontFaces = FONTS.map((f) => `@font-face { font-family:"${f.family}"; font-weight:${f.weight}; src:url("${asset(`shared/fonts/${f.file}`)}") format("woff2"); unicode-range:${f.range}; }`).join(" ");

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
${fontFaces}
:root { --ground:#131b21; --ink:#f6f1e7; --slate:#22303a; --slated:#18232b; --red:#e2384a; --gold:#f5c84c; --flower:#eaa6c8; }
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:${W}px; height:${H}px; overflow:hidden; background:var(--ground); }
#root { position:relative; width:${W}px; height:${H}px; overflow:hidden; font-family:"Be Vietnam Pro"; }
.scene { position:absolute; inset:0; overflow:hidden; background:var(--ground); z-index:1; }
.ph { position:absolute; inset:0; overflow:hidden; }
.ph video { width:100%; height:100%; object-fit:cover; display:block; filter:saturate(1.05) contrast(1.04); }
/* Mist rise: a soft mask edge climbs from the bottom. */
.rise { --p:-25%; -webkit-mask-image:linear-gradient(0deg, #000 var(--p), transparent calc(var(--p) + 22%)); mask-image:linear-gradient(0deg, #000 var(--p), transparent calc(var(--p) + 22%)); }
.cr { position:absolute; left:60px; top:112px; z-index:4; font:600 22px "Be Vietnam Pro"; color:rgba(246,241,231,0.85); text-shadow:0 2px 8px rgba(0,0,0,0.7); }
.shade { position:absolute; inset:0; background:linear-gradient(180deg, rgba(10,16,20,0.2) 0%, rgba(10,16,20,0) 35%, rgba(10,16,20,0) 65%, rgba(10,16,20,0.35) 100%); }
.top { position:absolute; left:0; right:0; top:0; height:760px; background:linear-gradient(180deg, rgba(12,18,22,0.85) 0%, rgba(12,18,22,0.5) 55%, rgba(12,18,22,0) 100%); }
.floor { position:absolute; left:0; right:0; bottom:0; height:900px; background:linear-gradient(180deg, rgba(12,18,22,0) 0%, rgba(12,18,22,0.6) 45%, rgba(12,18,22,0.93) 100%); }
.veil { position:absolute; inset:0; background:rgba(12,18,22,0.55); }
.hook-dim { position:absolute; inset:0; z-index:4; background:linear-gradient(180deg, rgba(12,18,22,0.35) 0%, rgba(12,18,22,0.05) 45%, rgba(12,18,22,0.8) 100%); }
.bino { position:absolute; left:-40px; top:0; width:1160px; height:1920px; z-index:5; }
.dz { position:absolute; z-index:16; width:2px; border-radius:1px; background:linear-gradient(180deg, rgba(220,232,240,0), rgba(220,232,240,0.7)); transform:rotate(7deg); opacity:0; pointer-events:none; }
/* Stencilled title. */
.sten { position:absolute; left:60px; right:60px; top:930px; z-index:8; text-align:center; }
.sten small { display:block; font:800 28px "Be Vietnam Pro"; color:var(--gold); letter-spacing:0.16em; text-shadow:0 2px 10px rgba(0,0,0,0.6); }
.sten h1 { font:900 170px/1 "Be Vietnam Pro"; color:var(--ink); letter-spacing:0.02em; text-shadow:0 10px 40px rgba(0,0,0,0.65); margin-top:10px; }
.sten h1 span { display:inline-block; }
.sten-stripe { display:block; width:640px; height:16px; margin:16px auto 0; background:linear-gradient(90deg, var(--red) 0 50%, var(--gold) 50% 100%); transform-origin:0% 50%; border-radius:8px; }
.sten-sub { margin-top:18px; }
.sten-sub b { display:block; font:900 58px "Be Vietnam Pro"; color:var(--ink); text-shadow:0 4px 20px rgba(0,0,0,0.6); }
.sten-sub span { display:inline-block; margin-top:10px; padding:6px 22px; border-radius:999px; background:var(--gold); color:var(--slated); font:800 30px "Be Vietnam Pro"; }
.title .w, .out-title .w { display:inline-block; }
.pill { position:absolute; left:50%; top:1370px; transform:translateX(-50%); font:900 44px "Be Vietnam Pro"; color:var(--slated); background:var(--gold); padding:12px 40px; border-radius:999px; white-space:nowrap; z-index:8; }
/* Warning road sign badge. */
.sign { position:absolute; right:70px; top:120px; z-index:6; width:220px; text-align:center; transform-origin:50% 0%; filter:drop-shadow(0 12px 16px rgba(0,0,0,0.5)); }
.sign-pole { display:block; width:14px; height:60px; margin:0 auto; background:linear-gradient(90deg, #8b98a3, #cfd8de, #8b98a3); }
.sign-tri { position:relative; width:220px; height:192px; margin-top:-4px; background:var(--red); clip-path:polygon(50% 0, 100% 100%, 0 100%); }
.sign-tri::before { content:""; position:absolute; left:20px; top:28px; right:20px; bottom:12px; background:var(--gold); clip-path:polygon(50% 0, 100% 100%, 0 100%); }
.sign-tri b { position:absolute; left:0; right:0; top:84px; font:900 64px/1 "Be Vietnam Pro"; color:#141414; }
.sign span { display:inline-block; margin-top:10px; padding:4px 14px; border-radius:8px; background:rgba(12,18,22,0.75); font:800 24px "Be Vietnam Pro"; color:var(--ink); white-space:nowrap; }
.head { position:absolute; left:80px; top:330px; width:640px; display:flex; flex-direction:column; gap:10px; z-index:5; }
.kicker { font:800 30px "Be Vietnam Pro"; color:var(--gold); }
.title { margin-bottom:10px; font:900 92px/1.04 "Be Vietnam Pro"; color:var(--ink); text-shadow:0 6px 30px rgba(0,0,0,0.55); }
.point { font:600 34px/1.3 "Be Vietnam Pro"; color:rgba(246,241,231,0.95); text-shadow:0 2px 14px rgba(0,0,0,0.75); }
.point i { display:inline-block; width:14px; height:30px; margin-right:18px; vertical-align:middle; background:linear-gradient(180deg, var(--red) 50%, var(--gold) 50%); border-radius:3px; }
/* Slate cards with a red-gold left edge. */
.card { position:absolute; left:60px; width:960px; top:1110px; padding:28px 34px 16px 46px; border-radius:18px; background:rgba(24,35,43,0.92); border-left:12px solid var(--red); box-shadow:0 18px 40px rgba(0,0,0,0.5), inset 0 0 0 2px rgba(245,200,76,0.25); z-index:7; overflow:hidden; color:var(--ink); }
.card-h { font:900 26px "Be Vietnam Pro"; letter-spacing:0.14em; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; color:var(--gold); }
.card-t { font:700 40px/1.3 "Be Vietnam Pro"; color:var(--ink); }
.card-n { font:600 30px/1.3 "Be Vietnam Pro"; color:rgba(246,241,231,0.7); margin-bottom:6px; }
.dots i { display:inline-block; width:12px; height:12px; border-radius:50%; margin-left:10px; background:rgba(246,241,231,0.25); }
.dots i.on { background:var(--gold); }
.row { display:flex; align-items:baseline; gap:16px; padding:8px 6px; border-top:2px solid rgba(246,241,231,0.12); border-radius:10px; }
.row b { font:800 33px "Be Vietnam Pro"; color:var(--ink); white-space:nowrap; }
.row span { font:500 26px "Be Vietnam Pro"; color:rgba(246,241,231,0.6); flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.row em { font:800 26px "Be Vietnam Pro"; font-style:normal; color:var(--slated); background:var(--gold); padding:4px 14px; border-radius:999px; white-space:nowrap; }
.row em.sugg { background:rgba(246,241,231,0.2); color:var(--ink); }
.gmaps { position:absolute; left:400px; width:620px; bottom:830px; border-radius:22px; overflow:hidden; background:#fff; box-shadow:0 16px 40px rgba(0,0,0,0.5); z-index:8; }
.gmaps-h { display:flex; align-items:center; gap:10px; padding:12px 22px; background:#f1f3f4; font:700 24px "Be Vietnam Pro"; color:#3c4043; }
.gmaps-h i { font-style:normal; }
.gmaps-h span { margin-left:auto; font:500 20px "Be Vietnam Pro"; color:#70757a; }
.gmaps img { display:block; width:100%; border-top:1px solid #e8eaed; }
/* Day chips under the subtitles: little road markers. */
.days { position:absolute; left:0; right:0; top:1680px; z-index:20; display:flex; justify-content:center; gap:14px; }
.days i { font:800 26px "Be Vietnam Pro"; font-style:normal; color:rgba(246,241,231,0.75); padding:6px 20px; border-radius:8px 8px 4px 4px; border-top:8px solid rgba(246,241,231,0.35); background:rgba(12,18,22,0.6); }
.days i.done { border-top-color:var(--gold); color:var(--ink); }
.days i.now { border-top-color:var(--red); background:var(--ink); color:var(--slated); }
/* Fan of cards between two days. */
.recap { position:absolute; inset:0; z-index:9; background:radial-gradient(ellipse at 50% 60%, #2b3b47 0%, #18232b 60%, #0e151a 100%); }
.recap-h { position:absolute; left:80px; right:80px; top:250px; text-align:center; }
.recap-h small { display:block; font:900 30px "Be Vietnam Pro"; color:var(--gold); letter-spacing:0.18em; text-transform:uppercase; }
.recap-h b { display:block; margin-top:8px; font:900 92px/1.05 "Be Vietnam Pro"; color:var(--ink); }
.fan-hub { position:absolute; left:540px; top:1460px; width:0; height:0; }
.fan { position:absolute; left:-190px; top:-860px; width:380px; padding:12px; background:#f6f1e7; border-radius:16px; box-shadow:0 20px 40px rgba(0,0,0,0.55); transform-origin:50% 120%; }
.fan img { display:block; width:356px; height:540px; object-fit:cover; border-radius:10px; }
.fan span { display:block; height:40px; font:700 22px/40px "Be Vietnam Pro"; color:#2a3540; text-align:center; white-space:nowrap; overflow:hidden; }
.done { position:absolute; left:50%; top:1570px; transform:translateX(-50%); padding:12px 34px; border-radius:999px; background:var(--red); color:#fff; font:900 44px "Be Vietnam Pro"; white-space:nowrap; box-shadow:0 10px 24px rgba(0,0,0,0.45); }
/* Km posts (day 4). */
.km { position:absolute; left:100px; width:880px; z-index:7; display:flex; align-items:center; gap:30px; padding:18px 30px 18px 22px; border-radius:18px; background:rgba(24,35,43,0.9); box-shadow:0 14px 30px rgba(0,0,0,0.45); }
.km-post { display:block; flex:none; width:96px; height:120px; border-radius:48px 48px 8px 8px; background:linear-gradient(180deg, var(--red) 0 46%, #fff 46% 100%); position:relative; }
.km-post b { position:absolute; left:0; right:0; top:62px; font:900 44px "Be Vietnam Pro"; color:#141414; text-align:center; }
.km b { display:block; font:900 44px "Be Vietnam Pro"; color:var(--ink); }
.km span { display:block; font:600 28px "Be Vietnam Pro"; color:rgba(246,241,231,0.75); }
/* Cost: motorbike dashboard with a fuel gauge. */
.dash { position:absolute; left:60px; width:960px; top:560px; z-index:7; padding:34px 40px 26px; border-radius:30px; background:linear-gradient(180deg, #1d2a33, #0f171c); box-shadow:0 24px 50px rgba(0,0,0,0.6), inset 0 0 0 3px rgba(245,200,76,0.3); color:var(--ink); }
.gauge { position:relative; width:420px; height:250px; margin:0 auto 10px; }
.g-arc { position:absolute; left:60px; top:30px; width:300px; height:300px; border-radius:50%; border:10px solid rgba(246,241,231,0.15); border-bottom-color:transparent; border-left-color:rgba(226,56,74,0.7); }
.g-arc i { position:absolute; left:50%; top:-6px; width:6px; height:28px; margin-left:-3px; background:var(--ink); transform-origin:50% 156px; }
.g-e, .g-f { position:absolute; top:150px; font:900 40px "Be Vietnam Pro"; }
.g-e { left:20px; color:var(--red); } .g-f { right:20px; color:var(--gold); }
.needle { position:absolute; left:206px; top:40px; width:8px; height:150px; border-radius:4px; background:var(--gold); transform-origin:50% 140px; box-shadow:0 0 12px rgba(245,200,76,0.6); }
.g-hub { position:absolute; left:190px; top:160px; width:40px; height:40px; border-radius:50%; background:var(--red); }
.gauge small { position:absolute; left:0; right:0; top:212px; text-align:center; font:800 28px "Be Vietnam Pro"; color:var(--gold); letter-spacing:0.08em; }
.dl { display:flex; justify-content:space-between; align-items:baseline; gap:20px; padding:9px 4px; border-bottom:2px solid rgba(246,241,231,0.1); }
.dl span { font:600 34px/1.2 "Be Vietnam Pro"; color:rgba(246,241,231,0.85); }
.dl b { font:900 38px "Be Vietnam Pro"; color:var(--ink); white-space:nowrap; }
.dtot { display:flex; justify-content:space-between; align-items:baseline; margin-top:18px; padding:16px 26px; border-radius:18px; background:var(--gold); color:var(--slated); }
.dtot span { font:900 30px "Be Vietnam Pro"; letter-spacing:0.08em; }
.dtot b { font:900 64px "Be Vietnam Pro"; }
.dnote { margin-top:12px; font:600 24px "Be Vietnam Pro"; color:rgba(246,241,231,0.6); text-align:center; }
.stamp { position:absolute; left:620px; top:470px; z-index:9; padding:8px 18px; border:5px solid var(--red); border-radius:12px; color:var(--red); font:900 24px "Be Vietnam Pro"; background:rgba(246,241,231,0.95); }
/* Outro. */
.tips-h { position:absolute; left:90px; top:520px; z-index:7; font:800 32px "Be Vietnam Pro"; color:var(--gold); }
.tip { position:absolute; left:90px; z-index:7; font:800 54px/1.2 "Be Vietnam Pro"; color:var(--ink); text-shadow:0 4px 20px rgba(0,0,0,0.7); white-space:nowrap; }
.tip i { display:inline-block; width:64px; height:64px; margin-right:22px; border-radius:50%; background:var(--red); color:#fff; font:900 40px/64px "Be Vietnam Pro"; font-style:normal; text-align:center; vertical-align:middle; }
.out-title { position:absolute; left:40px; right:40px; top:330px; text-align:center; z-index:7; font:900 104px/1.05 "Be Vietnam Pro"; color:var(--ink); text-shadow:0 10px 50px rgba(0,0,0,0.6); }
.rmap { position:absolute; inset:0; z-index:8; }
.rmap svg { position:absolute; inset:0; width:1080px; height:1920px; overflow:visible; }
.rmap path { fill:none; stroke:var(--gold); stroke-width:10; stroke-linecap:round; stroke-linejoin:round; stroke-dasharray:2400; stroke-dashoffset:2400; filter:drop-shadow(0 4px 10px rgba(0,0,0,0.6)); }
.pin { position:absolute; width:0; height:0; }
.pin i { position:absolute; left:-30px; top:-30px; width:60px; height:60px; border-radius:50%; background:var(--red); border:5px solid var(--ink); color:#fff; font:900 30px/50px "Be Vietnam Pro"; font-style:normal; text-align:center; box-shadow:0 6px 14px rgba(0,0,0,0.5); }
.pin span { position:absolute; left:40px; top:-24px; padding:4px 14px; border-radius:10px; background:rgba(12,18,22,0.85); color:var(--ink); font:800 30px "Be Vietnam Pro"; white-space:nowrap; }
.pin span.l { left:auto; right:40px; }
.pill.cta { top:1340px; font-size:64px; padding:18px 56px; }
.brand { position:absolute; left:60px; top:60px; z-index:21; font:800 26px "Be Vietnam Pro"; letter-spacing:0.3em; color:rgba(246,241,231,0.9); text-shadow:0 2px 10px rgba(0,0,0,0.5); }
.brand b { color:var(--red); letter-spacing:0; margin-right:12px; }
.cap { position:absolute; left:60px; right:60px; top:1500px; text-align:center; font:800 50px/1.25 "Be Vietnam Pro"; color:#ffffff; text-shadow:0 3px 0 rgba(0,0,0,0.55), 0 0 22px rgba(0,0,0,0.85); z-index:20; }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="${W}" data-height="${H}">
${mediaTags.join("\n")}
${sfx.join("\n")}
${html.join("\n")}
${drops.join("\n")}
<div class="brand" data-layout-ignore><b>▲</b>${esc(video.theme.brand)}</div>
${caps.join("\n")}
</div>
<script>
const tl = gsap.timeline({ paused: true });
${js.join("\n")}
HyperShader.init({
  bgColor: "#131b21",
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
