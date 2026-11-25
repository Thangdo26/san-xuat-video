#!/usr/bin/env node
/**
 * node hf/build-nb.mjs --slug ninh-binh-2n1d [--cover]
 *
 * Turns data/videos/<slug>/video.json + voiceover.json into a HyperFrames project at
 * build/<slug>/. The look ("Ninh Bình · non nước"), new for this destination:
 *   - travel intro: a folded paper map opens panel by panel, a dotted route draws from Hà Nội
 *     down to Ninh Bình, the pin drops, then the camera dives into the pin and the photo;
 *   - small warm lantern lights (đèn hoa đăng) drift up through every scene;
 *   - each stop gets a nón lá badge that spins down with a jade ribbon ("NGÀY 1 · SÁNG");
 *   - photos change like turning an album page (the new photo swings in on its left hinge);
 *   - white cards with a jade-to-gold edge; a Google Maps panel above every restaurant card;
 *   - "Hết bao nhiêu tiền?" as a long boat ticket with a punched stub, the total gets a round seal;
 *   - travel outro: film ending, letterbox bars, the itinerary rolls up as end credits,
 *     then the bars close and "Lưu lại nhé!" stays on black;
 *   - food intro: a sampan glides across the water carrying the five dishes;
 *     food outro: the dishes float up like lanterns on the river;
 *   - shader seams: whip pan, ripple waves, swirl vortex, light leak, film burn (ridged-burn)
 *     into the outro; quiet whooshes (about 0.15); subtitles at top 1500, rail below.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fail, parseArgs, requireSlug } from "../scripts/lib/args.mjs";
import { probeDurationSec } from "../scripts/lib/media.mjs";
import { PROJECT_ROOT, PUBLIC_ROOT } from "../scripts/lib/paths.mjs";

const { flags } = parseArgs(process.argv.slice(2));
const slug = requireSlug(flags, "build-nb");
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
const brand = video.theme.brand ?? "NINH BÌNH";

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

/** Photo stack; each new photo swings in on its left hinge like an album page, the old one sinks back. */
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
        tw(`tl.set("#${id}", {rotationY:-92, transformPerspective:1800, transformOrigin:"0% 50%"}, 0);`);
        tw(`tl.fromTo("#${id}", {rotationY:-92}, {rotationY:0, duration:0.75, ease:"power3.out", immediateRender:false}, ${a});`);
        tw(`tl.fromTo("#${idPrefix}-p${k - 1}", {scale:1}, {scale:0.9, duration:0.75, ease:"power2.out", immediateRender:false}, ${a});`);
        tw(`tl.to("#${idPrefix}-p${k - 1}", {opacity:0, duration:0.01}, ${r2(a + 0.76)});`);
      }
      return `<div id="${id}" class="ph"><img src="${asset(src)}" alt="" /></div>`;
    })
    .join("");
};

const titleIn = (sel, at) =>
  tw(`tl.fromTo("${sel} .w", {opacity:0, y:30, filter:"blur(8px)"}, {opacity:1, y:0, filter:"blur(0px)", duration:0.5, stagger:0.08, ease:"power3.out"}, ${r2(at)});`);
const fadeUp = (sel, at, dur = 0.35) =>
  tw(`tl.fromTo("${sel}", {opacity:0, y:26}, {opacity:1, y:0, duration:${dur}, ease:"expo.out"}, ${r2(at)});`);

/** Nón lá badge ("NGÀY 1" / "SÁNG"): the hat spins down from above, then its jade ribbon unrolls. */
const cabin = (sid, big, small, at) => {
  tw(`tl.fromTo("#${sid}-cab", {opacity:0}, {opacity:1, duration:0.15}, ${r2(at)});`);
  tw(`tl.fromTo("#${sid}-cab .hat", {y:-340, rotation:-300, scale:0.6}, {y:0, rotation:0, scale:1, duration:0.85, ease:"back.out(1.4)"}, ${r2(at)});`);
  tw(`tl.fromTo("#${sid}-cab .ribbon", {scaleX:0}, {scaleX:1, duration:0.45, ease:"power3.out"}, ${r2(at + 0.7)});`);
  tw(`tl.fromTo("#${sid}-cab .ribbon b, #${sid}-cab .ribbon em", {opacity:0}, {opacity:1, duration:0.25}, ${r2(at + 0.95)});`);
  sound("pop", r2(at + 0.8), 0.12);
  return `<div id="${sid}-cab" class="cab" style="opacity:0"><i class="hat"></i><div class="ribbon"><b>${esc(big)}</b><em>${esc(small)}</em></div></div>`;
};

const row = (p, accent) => `<div class="row"><b>${esc(p.place)}</b><span>${esc(p.address)}</span><em style="background:${p.rating == null ? "rgba(27,36,64,0.12)" : accent}">${star(p.rating)}</em></div>`;

// Google Maps screenshots (name + stars + review count), captured 09/11/2026 into public/videos/ninh-binh/maps.
const MAPS = video.maps ?? {};
const MAPS_DATE = vi ? "chụp 09/11/2026" : "captured 9 Nov 2026";

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
    tw(`tl.fromTo(document.querySelectorAll("${rowsSel}")[${k}], {backgroundColor:"rgba(94,168,255,0)"}, {backgroundColor:"rgba(94,168,255,0.28)", duration:0.25, yoyo:true, repeat:1, repeatDelay:${r2(Math.max(slot - 0.5, 0.2))}}, ${r2(t0)});`);
  });
  return `<div id="${id}" class="gmaps" style="opacity:0"><div class="gmaps-h"><i>📍</i>Google Maps<span>${MAPS_DATE}</span></div>${list.map(([m, k]) => `<img id="${id}-${k}" src="${asset(`videos/ninh-binh/maps/${m}.png`)}" alt="" />`).join("")}</div>`;
};

/** Cards shown one at a time at given times (each up at least 1.8 s). */
const cardSeq = (sid, s, cards, enter, accent) => {
  const times = [];
  cards.forEach((c, k) => {
    const cue = cueTime(s, c.cue) ?? enter + 1.5 + k * ((s.end - enter - 2) / cards.length);
    times.push(Math.max(cue, k ? times[k - 1] + 1.8 : enter + CLEAR));
  });
  // A closing restaurant card comes up early enough to be read and then cleared before the scene ends.
  const lastK = cards.length - 1;
  if (cards[lastK]?.places) times[lastK] = Math.max(Math.min(times[lastK], s.end - 1.4 - cards[lastK].places.length * 0.9 - 0.45), lastK ? times[lastK - 1] + 1.8 : enter + CLEAR);
  const parts = [];
  cards.forEach((c, k) => {
    const id = `${sid}-c${k}`;
    parts.push(`<div id="${id}" class="card" style="opacity:0"><div class="card-h">${esc(c.title.toUpperCase())}<span class="dots">${cards.map((_, j) => `<i class="${j === k ? "on" : ""}"></i>`).join("")}</span></div>${c.body}</div>`);
    tw(`tl.fromTo("#${id}", {opacity:0, y:50, filter:"blur(10px)"}, {opacity:1, y:0, filter:"blur(0px)", duration:0.45, ease:"expo.out"}, ${r2(times[k] - 0.05)});`);
    if (k < cards.length - 1) tw(`tl.to("#${id}", {opacity:0, y:-30, filter:"blur(8px)", duration:0.2, ease:"power3.in"}, ${r2(times[k + 1] - 0.22)});`);
    if (c.rows) tw(`tl.fromTo("#${id} .row", {opacity:0, x:-40}, {opacity:1, x:0, duration:0.3, stagger:0.09, ease:"power3.out"}, ${r2(times[k] + 0.15)});`);
    // The last card, if it lists restaurants, clears away once read so the dish photo shows again.
    const last = k === cards.length - 1;
    const hide = last && c.places ? clearAt(times[k], c.places.length, s.end) : null;
    if (hide != null) hideOut(`#${id}`, hide);
    if (c.places) parts.push(proofs(id, `#${id} .row`, c.places, times[k], last ? s.end : times[k + 1] - 0.22, hide));
  });
  return parts.join("");
};

// ---- folded paper map: opens panel by panel, route Hà Nội → Ninh Bình, dive into the pin (travel intro) ----
const MAP_ART = `<svg viewBox="0 0 900 1000" width="900" height="1000"><rect width="900" height="1000" fill="#efe5cc"/>${[1, 2, 3, 4, 5, 6, 7, 8].map((k) => `<path d="M${k * 100} 0 V1000" stroke="rgba(60,50,30,0.07)" stroke-width="2"/>`).join("")}${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => `<path d="M0 ${k * 100} H900" stroke="rgba(60,50,30,0.07)" stroke-width="2"/>`).join("")}<path d="M90 0 C 250 210, 170 430, 360 560 S 640 830, 860 1000" fill="none" stroke="#8fc3d6" stroke-width="22" stroke-linecap="round" opacity="0.75"/><path d="M380 820 l40 -70 l40 70 M450 840 l34 -60 l34 60 M540 830 l44 -80 l44 80 M600 870 l30 -52 l30 52 M330 880 l30 -50 l30 50" fill="none" stroke="#2f7d64" stroke-width="6" stroke-linejoin="round"/><circle cx="450" cy="170" r="16" fill="#23262d"/><text x="478" y="182" font-family="Montserrat" font-weight="900" font-size="40" fill="#23262d">HÀ NỘI</text><text x="250" y="960" font-family="Montserrat" font-weight="900" font-size="54" fill="#1f6b55">${esc(brand)}</text><text x="820" y="80" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="34" fill="rgba(35,38,45,0.55)">N ↑</text></svg>`;
const mapIntro = (s, sid) => {
  const a = s.start;
  const parts = [photos(s, a, s.end, sid)];
  parts.push(`<div class="shade"></div>`);
  parts.push(`<div id="${sid}-desk" class="desk"></div>`);
  const panels = [0, 1, 2].map((k) => `<div id="${sid}-pan${k}" class="pan" style="left:${k * 300}px"><div class="pan-in" style="left:${-k * 300}px">${MAP_ART}</div></div>`).join("");
  parts.push(`<div id="${sid}-map" class="mapwrap">${panels}<svg class="proute" viewBox="0 0 900 1000" width="900" height="1000"><path id="${sid}-route" d="M450 170 C 520 330, 380 450, 470 600 S 470 760, 500 790" fill="none" stroke="#2bb39a" stroke-width="12" stroke-linecap="round" stroke-dasharray="900" stroke-dashoffset="900"/></svg><div id="${sid}-km" class="mapkm" style="opacity:0">~90 km · ${vi ? "khoảng 2 giờ" : "about 2 hours"}</div><div id="${sid}-pin" class="mappin" style="opacity:0"><i></i></div></div>`);
  tw(`tl.fromTo("#${sid}-pan1", {scale:0.55, opacity:0}, {scale:1, opacity:1, duration:0.45, ease:"back.out(1.6)"}, ${r2(a + 0.15)});`);
  tw(`tl.fromTo("#${sid}-pan0", {rotationY:95, transformPerspective:1600, transformOrigin:"100% 50%"}, {rotationY:0, duration:0.55, ease:"power3.out"}, ${r2(a + 0.55)});`);
  tw(`tl.fromTo("#${sid}-pan2", {rotationY:-95, transformPerspective:1600, transformOrigin:"0% 50%"}, {rotationY:0, duration:0.55, ease:"power3.out"}, ${r2(a + 0.85)});`);
  sound("pop", r2(a + 0.95), 0.08);
  tw(`tl.fromTo("#${sid}-route", {strokeDashoffset:900}, {strokeDashoffset:0, duration:1.0, ease:"power1.inOut"}, ${r2(a + 1.4)});`);
  fadeUp(`#${sid}-km`, a + 1.9);
  tw(`tl.fromTo("#${sid}-pin", {opacity:0, y:-160}, {opacity:1, y:0, duration:0.5, ease:"bounce.out"}, ${r2(a + 2.35)});`);
  sound("pop", r2(a + 2.6), 0.12);
  // Dive into the pin, through the paper, into the full-frame photo.
  const push = a + 3.0;
  tw(`tl.to("#${sid}-map", {scale:4.2, duration:0.9, ease:"power3.in"}, ${r2(push)});`);
  tw(`tl.to("#${sid}-map", {opacity:0, duration:0.3}, ${r2(push + 0.6)});`);
  tw(`tl.to("#${sid}-desk", {opacity:0, duration:0.6}, ${r2(push + 0.3)});`);
  sound("whoosh-cinematic", r2(push), 0.14);
  return { html: parts.join(""), settle: r2(push + 0.9) };
};

// ---- a sampan glides across the river with the five dishes on board (food intro) ----
const boatIntro = (s, sid) => {
  const a = s.start;
  const dishes = (s.gallery ?? []).map((src) => `<img src="${asset(src)}" alt="" />`).join("");
  const items = (s.names ?? []).map((n, k) => {
    fadeUp(`#${sid}-li${k}`, a + 1.7 + k * 0.28, 0.4);
    return `<li id="${sid}-li${k}" style="opacity:0"><i>${k + 1}</i><span><b>${esc(n)}</b><small>${esc(s.tags?.[k] ?? "")}</small></span></li>`;
  }).join("");
  tw(`tl.fromTo("#${sid}-boat", {x:-1300}, {x:0, duration:1.4, ease:"power2.out"}, ${r2(a + 0.4)});`);
  tw(`tl.fromTo("#${sid}-boat", {y:0}, {y:12, duration:1.1, ease:"sine.inOut", yoyo:true, repeat:${Math.max(1, Math.floor((s.end - a) / 1.1) - 1)}}, ${r2(a + 0.4)});`);
  sound("whoosh-short", r2(a + 0.4), 0.12);
  return `<div class="river"></div><div class="menu-in"><div id="${sid}-kicker" class="menu-k">${esc(s.kicker)}</div><h1 id="${sid}-title" class="menu-t">${words(s.caption)}</h1></div><div id="${sid}-pill" class="pill menu-pill">${esc(s.label ?? "")}</div><div id="${sid}-boat" class="boat"><div class="deck">${dishes}</div><i class="hull"></i><i class="oar"></i></div><ul class="menu-list">${items}</ul>`;
};

// ---- scenes -------------------------------------------------------------
for (const s of scenes) {
  const sid = `s-${s.id}`;
  const a = s.start;
  const enter = a + LEAD;
  const accent = s.accent ?? video.theme.accent;
  const parts = [];

  if (s.layout === "hook" && !isFood) {
    // A folded map opens, the route draws to Ninh Bình, and the camera dives into the pin; the title settles.
    const m = mapIntro(s, sid);
    parts.push(m.html);
    parts.push(`<div id="${sid}-dim" class="hook-dim" style="opacity:0"></div>`);
    parts.push(`<div id="${sid}-kicker" class="hook-kicker" style="opacity:0">${esc(s.kicker)}</div>`);
    parts.push(`<h1 id="${sid}-title" class="hook-title" style="opacity:0">${words(s.caption)}</h1>`);
    parts.push(`<div id="${sid}-pill" class="pill" style="background:${accent};top:1370px;opacity:0">${esc(s.label ?? "")}</div>`);
    tw(`tl.to("#${sid}-dim", {opacity:1, duration:0.6}, ${m.settle});`);
    tw(`tl.fromTo("#${sid}-title", {scale:1.25, opacity:0}, {scale:1, opacity:1, duration:1, ease:"expo.out", immediateRender:false}, ${m.settle});`);
    fadeUp(`#${sid}-kicker`, m.settle + 0.3);
    fadeUp(`#${sid}-pill`, m.settle + 0.6);
  } else if (s.layout === "hook") {
    // Food intro: a sampan carries the five dishes across the river.
    parts.push(boatIntro(s, sid));
    titleIn(`#${sid}-title`, a + 0.2);
    fadeUp(`#${sid}-kicker`, a + 0.1);
    fadeUp(`#${sid}-pill`, a + 3.4);
  } else if (s.layout === "point") {
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div class="floor"></div>`);
    const num = isFood ? `${s.story.number}/${s.story.total}` : `${vi ? "NGÀY" : "DAY"} ${(s.label.match(/\d+/) ?? ["1"])[0]}`;
    const small = isFood ? (vi ? "MÓN" : "DISH") : s.label.split("·")[1]?.trim().toUpperCase() ?? "";
    parts.push(cabin(sid, num, small, enter + 0.6));
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
      // Up when the place is named, or early enough to be read and cleared before the scene ends.
      const named = cueTime(s, s.dishes?.[0]?.spokenAs) ?? a + (s.end - a) * 0.55;
      const cue = Math.max(Math.min(named, s.end - 1.4 - (s.dishes ?? []).length * 0.9 - 0.45), enter + CLEAR);
      parts.push(`<div id="${sid}-food" class="card"><div class="card-h">${esc(vi ? "ĂN GẦN ĐÂY" : "EAT NEARBY")} · ${esc(s.dishes?.[0]?.name ?? "")}</div>${(s.dishes ?? []).map((d) => row(d, accent)).join("")}</div>`);
      tw(`tl.fromTo("#${sid}-food", {opacity:0, y:60, filter:"blur(10px)"}, {opacity:1, y:0, filter:"blur(0px)", duration:0.5, ease:"expo.out"}, ${r2(cue - 0.1)});`);
      tw(`tl.fromTo("#${sid}-food .row", {opacity:0, x:-40}, {opacity:1, x:0, duration:0.3, stagger:0.09, ease:"power3.out"}, ${r2(cue + 0.15)});`);
      // The eat-nearby card and its Maps panel clear away once read, so the place's photos show again.
      const hide = clearAt(cue, (s.dishes ?? []).length, s.end);
      if (hide != null) hideOut(`#${sid}-food`, hide);
      parts.push(proofs(sid, `#${sid}-food .row`, s.dishes ?? [], cue, s.end, hide));
    } else {
      parts.push(`<p id="${sid}-tag" class="point">${esc(s.story.tagline)}</p>`);
      parts.push(`</div>`);
      fadeUp(`#${sid}-tag`, enter + 0.9);
      parts.push(cardSeq(sid, s, s.story.sections.map((sec) => ({
        title: sec.title, cue: sec.cue, rows: Boolean(sec.places), places: sec.places,
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
    parts.push(cabin(sid, vi ? "Ở ĐÂU" : "STAY", vi ? "LƯU TRÚ" : "SLEEP", enter + 0.6));
    parts.push(`<div class="head"><div id="${sid}-kicker" class="kicker" style="color:${accent}">${esc(vi ? "TRƯỚC KHI ĐẶT PHÒNG" : "BEFORE YOU BOOK")}</div><h1 id="${sid}-title" class="title">${words(s.caption)}</h1></div>`);
    fadeUp(`#${sid}-kicker`, enter, 0.25);
    titleIn(`#${sid}-title`, enter + 0.2);
    const cards = s.zones.map((z, k) => ({
      title: `${k + 1} · ${z.title}`, cue: s.cues[k], rows: true,
      body: `<p class="card-n">${esc(z.note)}</p>` + z.picks.map(([n, r, ad]) => row({ place: n, address: ad, rating: r }, accent)).join(""),
    }));
    cards.push({ title: vi ? "Mẹo" : "Tip", cue: s.cues.at(-1), body: `<p class="card-t">${esc(s.tip)}</p>` });
    parts.push(cardSeq(sid, s, cards, enter, accent));
  } else if (s.layout === "cost") {
    // "Hết bao nhiêu tiền?": a long boat ticket with a punched stub; lines come in, the total gets a round seal.
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div class="floor"></div>`);
    parts.push(cabin(sid, vi ? "CHI PHÍ" : "COST", vi ? "1 NGƯỜI" : "PER PERSON", enter + 0.6));
    parts.push(`<div class="head"><div id="${sid}-kicker" class="kicker" style="color:${accent}">${esc(s.kicker ?? "")}</div><h1 id="${sid}-title" class="title" style="font-size:88px">${words(s.caption)}</h1></div>`);
    fadeUp(`#${sid}-kicker`, enter, 0.25);
    titleIn(`#${sid}-title`, enter + 0.2);
    const t0 = enter + 1.6;
    const items = s.items ?? [];
    const totalAt = Math.max(cueTime(s, s.totalCue) ?? s.end - 3.2, t0 + items.length * 0.45 + 0.6);
    const step = Math.min(0.75, (totalAt - t0 - 0.5) / Math.max(1, items.length));
    const lines = items.map((it, k) => {
      const at = t0 + 0.5 + k * step;
      tw(`tl.fromTo("#${sid}-ln${k}", {opacity:0, x:-30}, {opacity:1, x:0, duration:0.3, ease:"power3.out"}, ${r2(at)});`);
      if (k % 2 === 0) sound("pop", r2(at + 0.1), 0.07);
      return `<div id="${sid}-ln${k}" class="ln" style="opacity:0"><i class="tick">${String(k + 1).padStart(2, "0")}</i><span>${esc(it.k)}${it.note ? `<small>${esc(it.note)}</small>` : ""}</span><b>${esc(it.v)}</b></div>`;
    }).join("");
    parts.push(`<div id="${sid}-rc" class="rcpt" style="opacity:0"><div class="stub"><span>${vi ? "VÉ ĐÒ" : "BOAT PASS"}</span><b>${esc(brand)}</b></div><div class="rc-h">${esc(s.receiptTitle ?? "")}</div>${lines}<div id="${sid}-tot" class="ln tot" style="opacity:0"><span>${vi ? "TỔNG / NGƯỜI" : "TOTAL / PERSON"}</span><b>${esc(s.total)}</b></div><div class="rc-f">${esc(s.note ?? "")}</div><div id="${sid}-seal" class="seal" style="opacity:0"><b>${vi ? "ĐÃ<br>TÍNH" : "ALL<br>IN"}</b></div></div>`);
    tw(`tl.fromTo("#${sid}-rc", {opacity:0, y:80, rotation:2}, {opacity:1, y:0, rotation:-1, duration:0.6, ease:"expo.out"}, ${r2(t0)});`);
    tw(`tl.fromTo("#${sid}-tot", {opacity:0, y:20}, {opacity:1, y:0, duration:0.35, ease:"power3.out"}, ${r2(totalAt)});`);
    tw(`tl.fromTo("#${sid}-seal", {opacity:0, scale:2.4, rotation:-40}, {opacity:0.9, scale:1, rotation:-14, duration:0.32, ease:"power4.in"}, ${r2(totalAt + 0.35)});`);
    sound("impact-bass-1", r2(totalAt + 0.67), 0.1);
    parts.push(`<div id="${sid}-stamp" class="stamp" style="opacity:0">${esc(s.stamp ?? "")}</div>`);
    tw(`tl.fromTo("#${sid}-stamp", {opacity:0, scale:2.2, rotation:-24}, {opacity:1, scale:1, rotation:-10, duration:0.35, ease:"power4.in"}, ${r2(totalAt + 1.0)});`);
  } else if (!isFood) {
    // Travel outro: film ending; letterbox bars come in, the itinerary rolls up as end credits,
    // then the bars close to black and "Lưu lại nhé!" stays.
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div>`);
    const credits = s.credits ?? [];
    const rows = credits.map(([label, place]) => `<div class="cr"><small>${esc(label)}</small><b>${esc(place)}</b></div>`).join("");
    const contentH = 330 + credits.length * 132 + 120;
    const rollFrom = 620, rollTo = Math.min(160, 1060 - contentH + 80);
    parts.push(`<div id="${sid}-roll" class="roll"><div id="${sid}-rin" class="roll-in"><div class="cr-k">${vi ? "LỊCH TRÌNH" : "ITINERARY"} · ${esc(brand)}</div><h1 class="cr-t">${esc(s.caption)}</h1>${rows}<div class="cr-f">${vi ? "Quán ăn & chi phí · xem phần mô tả" : "Food & costs · see the caption"}</div></div></div>`);
    parts.push(`<i id="${sid}-bt" class="bar top-bar"></i><i id="${sid}-bb" class="bar bot-bar"></i>`);
    const close = s.end - 2.3;
    tw(`tl.fromTo("#${sid}-bt, #${sid}-bb", {scaleY:0}, {scaleY:0.45, duration:0.7, ease:"power3.out"}, ${r2(enter)});`);
    tw(`tl.fromTo("#${sid}-rin", {y:${rollFrom}}, {y:${rollTo}, duration:${r2(close - enter - 0.4)}, ease:"none"}, ${r2(enter + 0.4)});`);
    tw(`tl.to("#${sid}-bt, #${sid}-bb", {scaleY:1, duration:0.8, ease:"power3.inOut"}, ${r2(close)});`);
    sound("impact-bass-1", r2(close + 0.75), 0.1);
    parts.push(`<div id="${sid}-cta" class="pill" style="background:${video.theme.accent};top:880px;opacity:0;color:#fff;z-index:12">${esc(s.cta ?? "")}</div>`);
    fadeUp(`#${sid}-cta`, close + 0.8);
  } else {
    // Food outro: the five dishes float up from the river like lanterns, then bob on the water.
    parts.push(`<div class="river night"></div>`);
    const SLOTS = [[200, 760], [540, 660], [880, 760], [370, 1080], [710, 1080]];
    const lanterns = s.gallery.map((src, k) => {
      const [x, y] = SLOTS[k % SLOTS.length];
      const at = a + 0.4 + k * 0.35;
      tw(`tl.fromTo("#${sid}-ln${k}", {y:900, opacity:0}, {y:0, opacity:1, duration:1.3, ease:"power2.out"}, ${r2(at)});`);
      tw(`tl.fromTo("#${sid}-ln${k} .lan-in", {y:0}, {y:-12, duration:1.3, ease:"sine.inOut", yoyo:true, repeat:${Math.max(1, Math.floor((s.end - at - 1.3) / 1.3))}}, ${r2(at + 1.3)});`);
      if (k % 2 === 0) sound("pop", r2(at + 0.9), 0.08);
      return `<div id="${sid}-ln${k}" class="lan" style="left:${x - 120}px;top:${y - 120}px;opacity:0"><div class="lan-in"><img src="${asset(src)}" alt="" /><span>${esc(s.names?.[k] ?? "")}</span></div></div>`;
    }).join("");
    parts.push(lanterns);
    parts.push(`<h1 id="${sid}-title" class="menu-t outro">${words(s.caption)}</h1>`);
    titleIn(`#${sid}-title`, enter + 0.2);
    parts.push(`<div id="${sid}-cta" class="pill" style="background:${video.theme.accent};top:1370px;opacity:0;color:#fff">${esc(s.cta ?? "")}</div>`);
    fadeUp(`#${sid}-cta`, a + 0.8 + s.gallery.length * 0.35 + 1.0);
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
const SHADERS = ["whip-pan", "ripple-waves", "swirl-vortex", "light-leak"];
const transitions = scenes.slice(1).map((s, k) => ({
  time: r2(s.start - SEAM / 2),
  shader: k === scenes.length - 2 ? "ridged-burn" : SHADERS[k % SHADERS.length],
  duration: SEAM,
}));
for (const tr of transitions) sound("whoosh-short", r2(tr.time - 0.1), 0.15);

// ---- warm lantern lights (đèn hoa đăng) drifting up through everything ----------------
// [left, size, duration, delay]: each light rises from the bottom edge, sways a little, fades out, repeats.
const LIGHTS = [[120, 14, 7.5, 0.3], [300, 10, 9.0, 2.1], [470, 16, 8.2, 4.4], [640, 11, 9.6, 1.2], [820, 15, 7.8, 3.3], [960, 10, 8.8, 5.6], [210, 12, 9.2, 6.4], [560, 9, 8.4, 7.1], [760, 13, 7.2, 0.9], [1010, 12, 9.4, 2.8]];
const flakes = LIGHTS.map(([left, size, dur, delay], k) => {
  const reps = Math.max(0, Math.ceil((total - delay) / (dur + 1.5)) - 1);
  tw(`tl.fromTo("#flake${k}", {y:0, x:0, opacity:0}, {keyframes:[{y:${-H * 0.3}, x:${k % 2 ? 18 : -18}, opacity:0.75, duration:${r2(dur * 0.3)}}, {y:${-H * 0.75}, x:${k % 2 ? -12 : 14}, opacity:0.45, duration:${r2(dur * 0.45)}}, {y:${-H - 60}, x:0, opacity:0, duration:${r2(dur * 0.25)}}], ease:"none", repeat:${reps}, repeatDelay:1.5}, ${delay});`);
  return `<i id="flake${k}" class="flake" style="left:${left}px;width:${size}px;height:${size}px" data-layout-ignore></i>`;
});

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
:root { --ground:#0f1a1a; --ink:#f8f6f2; --jade:#2bb39a; --jaded:#14806b; --gold:#f5c26b; --lotus:#f08aa8; --slate:#23262d; --paper:#efe5cc; }
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:${W}px; height:${H}px; overflow:hidden; background:var(--ground); }
#root { position:relative; width:${W}px; height:${H}px; overflow:hidden; font-family:"Montserrat"; }
.scene { position:absolute; inset:0; overflow:hidden; background:var(--ground); z-index:1; }
.ph { position:absolute; inset:0; overflow:hidden; backface-visibility:hidden; }
.ph img { width:100%; height:100%; object-fit:cover; }
.shade { position:absolute; inset:0; background:linear-gradient(180deg, rgba(8,16,16,0.18) 0%, rgba(8,16,16,0) 35%, rgba(8,16,16,0) 65%, rgba(8,16,16,0.35) 100%); }
.top { position:absolute; left:0; right:0; top:0; height:760px; background:linear-gradient(180deg, rgba(8,18,18,0.9) 0%, rgba(8,18,18,0.6) 55%, rgba(8,18,18,0) 100%); }
.floor { position:absolute; left:0; right:0; bottom:0; height:900px; background:linear-gradient(180deg, rgba(8,18,18,0) 0%, rgba(8,18,18,0.6) 45%, rgba(8,18,18,0.93) 100%); }
.hook-dim { position:absolute; inset:0; z-index:4; background:linear-gradient(180deg, rgba(8,18,18,0.5) 0%, rgba(8,18,18,0.3) 50%, rgba(8,18,18,0.85) 100%); }
/* Lantern lights drifting up. */
.flake { position:absolute; top:${H + 20}px; z-index:16; border-radius:50%; background:radial-gradient(circle, #fff3c4 0%, #ffb547 45%, rgba(255,140,40,0) 72%); box-shadow:0 0 18px 6px rgba(255,170,60,0.45); opacity:0; pointer-events:none; }
/* Travel intro: folded paper map on a teal desk. */
.desk { position:absolute; inset:0; z-index:5; background:radial-gradient(ellipse at 50% 40%, #1f4a44 0%, #12302c 60%, #0b1f1d 100%); }
.mapwrap { position:absolute; left:90px; top:380px; width:900px; height:1000px; z-index:6; transform-origin:500px 790px; }
.pan { position:absolute; top:0; width:300px; height:1000px; overflow:hidden; box-shadow:0 30px 60px rgba(0,0,0,0.45); }
.pan-in { position:absolute; top:0; width:900px; height:1000px; }
.pan::after { content:""; position:absolute; inset:0; background:linear-gradient(90deg, rgba(0,0,0,0.08), rgba(255,255,255,0.06) 50%, rgba(0,0,0,0.1)); }
.proute { position:absolute; left:0; top:0; }
.mapkm { position:absolute; left:560px; top:470px; padding:10px 22px; border-radius:999px; background:#fff; font:800 30px "Montserrat"; color:var(--jaded); box-shadow:0 8px 20px rgba(0,0,0,0.25); white-space:nowrap; }
.mappin { position:absolute; left:470px; top:700px; width:60px; height:90px; }
.mappin i { position:absolute; left:0; top:0; width:60px; height:60px; border-radius:50% 50% 50% 0; transform:rotate(-45deg); background:var(--lotus); box-shadow:0 8px 16px rgba(0,0,0,0.35); }
.mappin i::after { content:""; position:absolute; left:19px; top:19px; width:22px; height:22px; border-radius:50%; background:#fff; }
.hook-kicker { position:absolute; left:0; right:0; top:1090px; text-align:center; font:700 32px "Montserrat"; letter-spacing:0.3em; color:var(--gold); z-index:7; }
.hook-title { position:absolute; left:0; right:0; top:1150px; text-align:center; font:900 170px/1 "Playfair Display"; color:var(--ink); text-shadow:0 10px 60px rgba(0,0,0,0.6); z-index:7; }
.hook-title .w, .title .w { display:inline-block; }
.pill { position:absolute; left:50%; transform:translateX(-50%); font:900 48px "Montserrat"; color:var(--slate); padding:12px 40px; border-radius:999px; white-space:nowrap; z-index:8; }
/* Nón lá badge (stop marker). */
.cab { position:absolute; right:40px; top:70px; width:320px; height:330px; z-index:6; }
.hat { position:absolute; left:60px; top:0; width:200px; height:200px; border-radius:50%; background:repeating-conic-gradient(from 0deg, #e9d29a 0deg 7deg, #d8bb76 7deg 9deg); box-shadow:0 18px 30px rgba(0,0,0,0.45), inset 0 0 0 6px rgba(120,90,40,0.25); }
.hat::after { content:""; position:absolute; left:84px; top:84px; width:32px; height:32px; border-radius:50%; background:radial-gradient(circle, #fff6dc 0%, #e2c784 100%); box-shadow:0 0 0 3px rgba(120,90,40,0.3); }
.ribbon { position:absolute; left:10px; top:160px; width:300px; padding:14px 0 12px; border-radius:16px; background:var(--jade); text-align:center; transform-origin:50% 50%; box-shadow:0 14px 26px rgba(0,0,0,0.45); border:4px solid #fff; }
.ribbon b { display:block; font:900 50px/1 "Montserrat"; color:#fff; white-space:nowrap; }
.ribbon em { display:block; margin-top:8px; font:800 28px "Montserrat"; font-style:normal; letter-spacing:0.16em; color:var(--gold); white-space:nowrap; }
.head { position:absolute; left:80px; top:215px; width:620px; display:flex; flex-direction:column; gap:10px; z-index:5; }
.kicker { font:700 32px "Montserrat"; letter-spacing:0.28em; }
.title { margin-bottom:10px; font:800 104px/1.04 "Playfair Display"; color:var(--ink); text-shadow:0 6px 30px rgba(0,0,0,0.55); }
.point { font:600 37px/1.3 "Montserrat"; color:rgba(248,246,242,0.93); text-shadow:0 2px 14px rgba(0,0,0,0.7); }
.point i { display:inline-block; width:16px; height:16px; border-radius:50%; margin-right:18px; vertical-align:middle; }
/* White cards with a jade-to-gold edge, in the lower third. */
.card { position:absolute; left:60px; width:960px; top:1110px; padding:30px 34px 16px 50px; border-radius:18px; background:rgba(255,255,255,0.97); box-shadow:0 18px 40px rgba(0,0,0,0.45); z-index:7; overflow:hidden; }
.card::before { content:""; position:absolute; left:0; top:0; bottom:0; width:16px; background:linear-gradient(180deg, var(--jade), var(--gold)); }
.card-h { font:800 28px "Montserrat"; letter-spacing:0.2em; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; color:var(--jaded); }
.card-t { font:600 40px/1.3 "Montserrat"; color:var(--slate); }
.card-n { font:600 32px/1.3 "Montserrat"; color:rgba(35,38,45,0.72); margin-bottom:6px; }
.dots i { display:inline-block; width:12px; height:12px; border-radius:50%; margin-left:10px; background:rgba(35,38,45,0.2); }
.dots i.on { background:var(--jaded); }
.row { display:flex; align-items:baseline; gap:16px; padding:8px 0; border-top:1px solid rgba(35,38,45,0.14); border-radius:10px; }
.row b { font:800 36px "Montserrat"; color:var(--slate); white-space:nowrap; }
.row span { font:500 28px "Montserrat"; color:rgba(35,38,45,0.6); flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.row em { font:800 27px "Montserrat"; font-style:normal; color:var(--slate); padding:4px 14px; border-radius:999px; white-space:nowrap; box-shadow:inset 0 0 0 2px rgba(35,38,45,0.25); }
/* Google Maps screenshot chip above the restaurant card. */
.gmaps { position:absolute; left:400px; width:620px; bottom:830px; border-radius:22px; overflow:hidden; background:#fff; box-shadow:0 16px 40px rgba(0,0,0,0.5); z-index:8; }
.gmaps-h { display:flex; align-items:center; gap:10px; padding:12px 22px; background:#f1f3f4; font:700 24px "Montserrat"; color:#3c4043; }
.gmaps-h i { font-style:normal; }
.gmaps-h span { margin-left:auto; font:500 20px "Montserrat"; color:#70757a; }
.gmaps img { display:block; width:100%; border-top:1px solid #e8eaed; }
.rail { position:absolute; left:0; right:0; top:1690px; z-index:20; display:flex; justify-content:center; gap:26px; }
.rail i { width:18px; height:18px; border-radius:50%; background:rgba(255,255,255,0.22); }
.rail i.done { background:rgba(255,255,255,0.6); }
/* Cost: a long boat ticket with a punched stub. */
.rcpt { position:absolute; left:70px; width:940px; top:560px; padding:36px 44px 26px 210px; border-radius:20px; z-index:7; font-family:"Montserrat"; overflow:hidden; box-shadow:0 24px 50px rgba(0,0,0,0.5); background:linear-gradient(180deg, #fffaf0 0%, #f6edd8 100%); }
.stub { position:absolute; left:0; top:0; bottom:0; width:160px; background:var(--jade); display:flex; flex-direction:column; justify-content:center; align-items:center; gap:18px; border-right:6px dashed #fffaf0; }
.stub span { font:900 30px "Montserrat"; color:#fff; letter-spacing:0.12em; transform:rotate(-90deg); white-space:nowrap; }
.stub b { position:absolute; bottom:40px; font:800 18px "Montserrat"; color:rgba(255,255,255,0.8); letter-spacing:0.1em; }
.rc-h { font:800 30px "Montserrat"; letter-spacing:0.08em; color:var(--jaded); padding-bottom:10px; margin-bottom:4px; border-bottom:3px solid rgba(20,128,107,0.25); }
.ln { position:relative; display:flex; justify-content:space-between; align-items:baseline; gap:20px; padding:12px 0; border-bottom:1px dashed rgba(35,38,45,0.18); }
.ln .tick { position:absolute; left:-46px; top:16px; font:800 22px "Montserrat"; font-style:normal; color:var(--jaded); }
.ln span { font:700 32px/1.2 "Montserrat"; color:var(--slate); }
.ln span small { display:block; font:500 22px "Montserrat"; color:rgba(35,38,45,0.55); margin-top:2px; }
.ln b { position:relative; font:900 34px "Montserrat"; color:var(--slate); white-space:nowrap; }
.ln.tot { margin-top:10px; padding-top:18px; border-bottom:none; }
.ln.tot span { font:900 30px "Montserrat"; letter-spacing:0.12em; }
.ln.tot b { font:900 48px "Montserrat"; color:var(--jaded); }
.rc-f { margin-top:12px; font:500 22px "Montserrat"; color:rgba(35,38,45,0.55); }
.seal { position:absolute; left:24px; bottom:110px; background:rgba(255,255,255,0.92); width:112px; height:112px; border-radius:50%; border:7px double #c8382f; display:flex; align-items:center; justify-content:center; text-align:center; }
.seal b { font:900 22px/1.1 "Montserrat"; color:#c8382f; letter-spacing:0.06em; }
.stamp { position:absolute; right:40px; top:470px; z-index:9; padding:8px 18px; border:5px solid var(--jaded); border-radius:12px; color:var(--jaded); font:900 28px "Montserrat"; letter-spacing:0.06em; background:rgba(255,255,255,0.88); }
/* Travel outro: film ending, letterbox bars and rolling credits. */
.bar { position:absolute; left:0; right:0; height:960px; background:#000; z-index:11; }
.top-bar { top:0; transform-origin:50% 0%; transform:scaleY(0); }
.bot-bar { bottom:0; transform-origin:50% 100%; transform:scaleY(0); }
.roll { position:absolute; left:0; right:0; top:430px; height:1060px; overflow:hidden; z-index:9; background:rgba(0,0,0,0.38); }
.roll-in { position:absolute; left:0; right:0; top:0; text-align:center; }
.cr-k { font:700 28px "Montserrat"; letter-spacing:0.3em; color:var(--gold); }
.cr-t { margin:18px 0 60px; font:900 92px/1.05 "Playfair Display"; color:#fff; text-shadow:0 6px 30px rgba(0,0,0,0.6); }
.cr { margin-bottom:40px; }
.cr small { display:block; font:700 26px "Montserrat"; letter-spacing:0.22em; color:var(--gold); text-transform:uppercase; }
.cr b { display:block; margin-top:8px; font:800 54px "Montserrat"; color:#fff; text-shadow:0 3px 18px rgba(0,0,0,0.7); }
.cr-f { margin-top:30px; font:600 30px "Montserrat"; color:rgba(255,255,255,0.75); }
/* Food intro: river and sampan; food outro: lantern dishes. */
.river { position:absolute; inset:0; background:linear-gradient(180deg, #123b3a 0%, #0f2f30 45%, #0b2324 100%); }
.river::after { content:""; position:absolute; left:0; right:0; top:820px; bottom:0; background:repeating-linear-gradient(180deg, rgba(255,255,255,0) 0 26px, rgba(160,220,210,0.08) 26px 29px); }
.river.night { background:linear-gradient(180deg, #0b1424 0%, #102033 50%, #0b1a24 100%); }
.river.night::after { top:1220px; background:repeating-linear-gradient(180deg, rgba(255,255,255,0) 0 22px, rgba(255,190,90,0.1) 22px 25px); }
.menu-in { position:absolute; left:80px; right:80px; top:140px; z-index:2; }
.menu-k { text-align:center; font:700 30px "Montserrat"; letter-spacing:0.3em; color:var(--gold); }
.menu-t { margin-top:20px; text-align:center; font:900 108px/1.05 "Playfair Display"; color:#fff; }
.menu-t .w { display:inline-block; }
.menu-t.outro { position:absolute; left:0; right:0; top:140px; z-index:3; padding:0 80px; }
.menu-pill { top:470px; background:var(--gold); }
.boat { position:absolute; left:70px; top:600px; width:940px; height:300px; z-index:3; }
.deck { position:absolute; left:40px; right:40px; top:0; display:flex; justify-content:space-between; }
.deck img { width:160px; height:160px; border-radius:50%; object-fit:cover; border:6px solid #fffaf0; box-shadow:0 10px 24px rgba(0,0,0,0.45); }
.hull { position:absolute; left:0; right:0; top:140px; height:110px; background:linear-gradient(180deg, #8a5a32 0%, #5e3a1e 100%); clip-path:polygon(0 0, 100% 0, 88% 100%, 12% 100%); }
.oar { position:absolute; right:30px; top:60px; width:16px; height:260px; border-radius:8px; background:#c99a5b; transform:rotate(28deg); transform-origin:50% 0%; }
.menu-list { position:absolute; left:120px; right:120px; top:960px; list-style:none; display:flex; flex-direction:column; gap:18px; z-index:3; }
.menu-list li { display:flex; align-items:center; gap:24px; }
.menu-list li i { width:58px; height:58px; border-radius:50%; background:var(--jade); color:#fff; font:900 30px/58px "Montserrat"; text-align:center; font-style:normal; flex:none; }
.menu-list b { display:block; font:800 44px "Montserrat"; color:#fff; white-space:nowrap; }
.menu-list small { display:block; margin-top:2px; font:600 24px "Montserrat"; color:rgba(255,255,255,0.65); }
.lan { position:absolute; width:240px; height:240px; z-index:2; }
.lan img { width:240px; height:240px; border-radius:50%; object-fit:cover; border:8px solid #ffd27a; box-shadow:0 0 0 6px rgba(255,190,90,0.25), 0 0 60px 14px rgba(255,170,60,0.45); }
.lan span { position:absolute; left:50%; bottom:-34px; transform:translateX(-50%); padding:6px 16px; border-radius:999px; background:#fff6e0; color:var(--slate); font:800 26px "Montserrat"; white-space:nowrap; }
.brand { position:absolute; left:60px; top:60px; z-index:21; font:800 26px "Montserrat"; letter-spacing:0.3em; color:rgba(248,246,242,0.85); text-shadow:0 2px 10px rgba(0,0,0,0.5); }
.brand b { color:var(--jade); letter-spacing:0; margin-right:12px; }
.cap { position:absolute; left:60px; right:60px; top:1500px; text-align:center; font:800 50px/1.25 "Montserrat"; color:#ffffff; text-shadow:0 3px 0 rgba(0,0,0,0.55), 0 0 22px rgba(0,0,0,0.85); z-index:20;${cover ? " display:none;" : ""} }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="${W}" data-height="${H}">
${media.join("\n")}
${sfx.join("\n")}
${html.join("\n")}
${flakes.join("\n")}
<div class="brand" data-layout-ignore><b>◆</b>${esc(brand)}</div>
${caps.join("\n")}
</div>
<script>
const tl = gsap.timeline({ paused: true });
${js.join("\n")}
HyperShader.init({
  bgColor: "#0f1a1a",
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
