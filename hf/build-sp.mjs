#!/usr/bin/env node
/**
 * node hf/build-sp.mjs --slug sa-pa-3n2d [--cover]
 *
 * Turns data/videos/<slug>/video.json + voiceover.json into a HyperFrames project at
 * build/<slug>/. The look ("Sa Pa · nóc nhà Đông Dương"), new for this destination:
 *   - travel intro: two banks of cloud part to reveal the valley while an altimeter rolls
 *     up to 3.143 m (Fansipan), then the title settles;
 *   - fine snow drifting down over every scene; white cards with a brocade stripe
 *     (red, gold, green, indigo) on top;
 *   - each stop gets a cable-car cabin ("NGÀY 1 / SÁNG") that glides in along a cable and swings;
 *   - photos change by rising up from the bottom edge (clip reveal with a parallax lift);
 *   - a Google Maps panel above every restaurant card (name, stars, reviews);
 *   - a "Hết bao nhiêu tiền?" receipt after the stay scene: lines print one by one, a total stamp;
 *   - travel outro: the title over the best photo while a sea of cloud rises from below;
 *   - food intro: an app-style menu, a cursor taps the first dish; food outro: a dish wheel spins;
 *   - shader seams: gravitational lens, cinematic zoom, cross-warp morph, flash through white,
 *     sdf-iris into the outro; quiet whooshes (about 0.15); subtitles at top 1500, rail below.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fail, parseArgs, requireSlug } from "../scripts/lib/args.mjs";
import { probeDurationSec } from "../scripts/lib/media.mjs";
import { PROJECT_ROOT, PUBLIC_ROOT } from "../scripts/lib/paths.mjs";

const { flags } = parseArgs(process.argv.slice(2));
const slug = requireSlug(flags, "build-sp");
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
const brand = video.theme.brand ?? "SA PA";

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

/** Photo stack; each new photo rises in from the bottom edge (clip reveal) with a small parallax lift. */
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
        tw(`tl.set("#${id}", {yPercent:100}, 0);`);
        tw(`tl.fromTo("#${id}", {yPercent:100}, {yPercent:0, duration:0.8, ease:"power3.inOut", immediateRender:false}, ${a});`);
        tw(`tl.fromTo("#${id} .lift", {yPercent:-35}, {yPercent:0, duration:0.8, ease:"power3.inOut", immediateRender:false}, ${a});`);
        tw(`tl.to("#${idPrefix}-p${k - 1}", {opacity:0, duration:0.01}, ${r2(a + 0.81)});`);
      }
      return `<div id="${id}" class="ph"><div class="lift"><img src="${asset(src)}" alt="" /></div></div>`;
    })
    .join("");
};

const titleIn = (sel, at) =>
  tw(`tl.fromTo("${sel} .w", {opacity:0, y:30, filter:"blur(8px)"}, {opacity:1, y:0, filter:"blur(0px)", duration:0.5, stagger:0.08, ease:"power3.out"}, ${r2(at)});`);
const fadeUp = (sel, at, dur = 0.35) =>
  tw(`tl.fromTo("${sel}", {opacity:0, y:26}, {opacity:1, y:0, duration:${dur}, ease:"expo.out"}, ${r2(at)});`);

/** Cable-car cabin ("SA PA / NGÀY 1 / SÁNG") gliding in along a cable, then swinging to rest. */
const cabin = (sid, big, small, at) => {
  tw(`tl.fromTo("#${sid}-cab", {opacity:0}, {opacity:1, duration:0.2}, ${r2(at)});`);
  tw(`tl.fromTo("#${sid}-cab .car", {x:360, y:-52}, {x:0, y:0, duration:0.95, ease:"power3.out"}, ${r2(at)});`);
  tw(`tl.fromTo("#${sid}-cab .car", {rotation:7}, {rotation:0, duration:1.4, ease:"elastic.out(1, 0.35)"}, ${r2(at + 0.75)});`);
  sound("pop", r2(at + 0.8), 0.12);
  return `<div id="${sid}-cab" class="cab" style="opacity:0"><i class="cable"></i><div class="car"><i class="hanger"></i><div class="box"><div class="win">${esc(brand)}</div><b>${esc(big)}</b><small>${esc(small)}</small></div></div></div>`;
};

const row = (p, accent) => `<div class="row"><b>${esc(p.place)}</b><span>${esc(p.address)}</span><em style="background:${p.rating == null ? "rgba(27,36,64,0.12)" : accent}">${star(p.rating)}</em></div>`;

// Google Maps screenshots (name + stars + review count), captured 07/11/2026 into public/videos/sa-pa/maps.
const MAPS = video.maps ?? {};
const MAPS_DATE = vi ? "chụp 07/11/2026" : "captured 7 Nov 2026";

/** A Google Maps panel above the card: one screenshot per listed place, sliding in while its row lights up. */
const proofs = (sid, rowsSel, places, from, to) => {
  const list = places.map((p, k) => [MAPS[p.place], k]).filter(([m]) => m);
  if (!list.length) return "";
  const id = `${sid}-gm`, slot = Math.min(0.9, (to - from - 1) / list.length);
  tw(`tl.fromTo("#${id}", {opacity:0, y:40, scale:0.92}, {opacity:1, y:0, scale:1, duration:0.4, ease:"back.out(1.5)"}, ${r2(from + 0.25)});`);
  list.forEach(([, k], i) => {
    const t0 = from + 0.45 + i * slot;
    tw(`tl.fromTo("#${id}-${k}", {opacity:0, x:60}, {opacity:1, x:0, duration:0.35, ease:"power3.out"}, ${r2(t0)});`);
    tw(`tl.fromTo(document.querySelectorAll("${rowsSel}")[${k}], {backgroundColor:"rgba(94,168,255,0)"}, {backgroundColor:"rgba(94,168,255,0.28)", duration:0.25, yoyo:true, repeat:1, repeatDelay:${r2(Math.max(slot - 0.5, 0.2))}}, ${r2(t0)});`);
  });
  return `<div id="${id}" class="gmaps" style="opacity:0"><div class="gmaps-h"><i>📍</i>Google Maps<span>${MAPS_DATE}</span></div>${list.map(([m, k]) => `<img id="${id}-${k}" src="${asset(`videos/sa-pa/maps/${m}.png`)}" alt="" />`).join("")}</div>`;
};

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
    parts.push(`<div id="${id}" class="card" style="opacity:0"><div class="card-h">${esc(c.title.toUpperCase())}<span class="dots">${cards.map((_, j) => `<i class="${j === k ? "on" : ""}"></i>`).join("")}</span></div>${c.body}</div>`);
    tw(`tl.fromTo("#${id}", {opacity:0, y:50, filter:"blur(10px)"}, {opacity:1, y:0, filter:"blur(0px)", duration:0.45, ease:"expo.out"}, ${r2(times[k] - 0.05)});`);
    if (k < cards.length - 1) tw(`tl.to("#${id}", {opacity:0, y:-30, filter:"blur(8px)", duration:0.2, ease:"power3.in"}, ${r2(times[k + 1] - 0.22)});`);
    if (c.rows) tw(`tl.fromTo("#${id} .row", {opacity:0, x:-40}, {opacity:1, x:0, duration:0.3, stagger:0.09, ease:"power3.out"}, ${r2(times[k] + 0.15)});`);
    if (c.places) parts.push(proofs(id, `#${id} .row`, c.places, times[k], k < cards.length - 1 ? times[k + 1] - 0.22 : s.end));
  });
  return parts.join("");
};

// Soft cloud bank: overlapping white blobs (pure CSS, no image).
const cloudBank = (id, side) => `<div id="${id}" class="cloud ${side}"><i></i><i></i><i></i><i></i><i></i><i></i></div>`;

// ---- cloud parting + altimeter (travel intro) -----------------------------
const ALT = "3.143";
const cloudIntro = (s, sid) => {
  const a = s.start;
  const parts = [photos(s, a, s.end, sid)];
  parts.push(`<div class="shade"></div>`);
  parts.push(cloudBank(`${sid}-cl`, "left") + cloudBank(`${sid}-cr`, "right"));
  tw(`tl.fromTo("#${sid}-cl", {x:0, opacity:1}, {x:-820, opacity:0.25, duration:2.4, ease:"power2.inOut"}, ${r2(a + 0.35)});`);
  tw(`tl.fromTo("#${sid}-cr", {x:0, opacity:1}, {x:820, opacity:0.25, duration:2.4, ease:"power2.inOut"}, ${r2(a + 0.35)});`);
  sound("whoosh-cinematic", r2(a + 0.3), 0.14);
  // Altimeter: each digit column rolls up to its value.
  const cols = [...ALT].map((ch, k) => {
    if (!/\d/.test(ch)) return `<span class="dg dot">${ch}</span>`;
    tw(`tl.fromTo("#${sid}-d${k}", {y:0}, {y:-${Number(ch) * 92 + 920}, duration:${r2(2 + k * 0.15)}, ease:"power3.out"}, ${r2(a + 0.4)});`);
    const strip = Array.from({ length: 20 }, (_, n) => n % 10).join("<br>");
    return `<span class="dg"><span id="${sid}-d${k}" class="col">${strip}</span></span>`;
  });
  parts.push(`<div id="${sid}-alt" class="alt"><small>${vi ? "ĐỘ CAO" : "ALTITUDE"} · FANSIPAN</small><div class="digits">${cols.join("")}<span class="unit">m</span></div></div>`);
  fadeUp(`#${sid}-alt`, a + 0.2);
  const settle = r2(a + 2.7);
  return { html: parts.join(""), settle };
};

// ---- app-style menu (food intro) ------------------------------------------
const menuIntro = (s, sid) => {
  const a = s.start;
  const items = (s.names ?? []).map((n, k) => {
    tw(`tl.fromTo("#${sid}-li${k}", {opacity:0, x:260}, {opacity:1, x:0, duration:0.45, ease:"expo.out"}, ${r2(a + 1.0 + k * 0.32)});`);
    return `<li id="${sid}-li${k}"><img src="${asset(s.gallery[k])}" alt="" /><span><b>${esc(n)}</b><small>${esc(s.tags?.[k] ?? "")}</small></span><i>›</i></li>`;
  }).join("");
  // The cursor glides up from the corner and taps the first dish.
  const tap = a + 1.0 + (s.names?.length ?? 5) * 0.32 + 0.9;
  tw(`tl.fromTo("#${sid}-cur", {opacity:0, x:380, y:700}, {opacity:1, x:0, y:0, duration:1.1, ease:"power2.inOut"}, ${r2(tap - 1.1)});`);
  tw(`tl.fromTo("#${sid}-cur", {scale:1}, {scale:0.82, duration:0.1, yoyo:true, repeat:1}, ${r2(tap)});`);
  tw(`tl.fromTo("#${sid}-li0", {backgroundColor:"rgba(255,255,255,0.08)"}, {backgroundColor:"rgba(255,209,102,0.42)", duration:0.2}, ${r2(tap + 0.05)});`);
  tw(`tl.fromTo("#${sid}-ring", {opacity:0.9, scale:0.3}, {opacity:0, scale:1.6, duration:0.5, ease:"power2.out"}, ${r2(tap)});`);
  sound("pop", r2(tap), 0.14);
  return `<div class="menu-bg"></div><div class="menu-in"><div id="${sid}-kicker" class="menu-k">${esc(s.kicker)}</div><h1 id="${sid}-title" class="menu-t">${words(s.caption)}</h1><ul class="menu-list">${items}</ul></div><div id="${sid}-cur" class="cursor" style="opacity:0"><i id="${sid}-ring" class="ring"></i><svg viewBox="0 0 40 52" width="70" height="91"><path d="M3 3 L3 42 L13 33 L20 49 L27 46 L20 30 L34 30 Z" fill="#fff" stroke="#1b2440" stroke-width="3" stroke-linejoin="round"/></svg></div><div id="${sid}-pill" class="pill menu-pill">${esc(s.label ?? "")}</div>`;
};

// ---- scenes -------------------------------------------------------------
for (const s of scenes) {
  const sid = `s-${s.id}`;
  const a = s.start;
  const enter = a + LEAD;
  const accent = s.accent ?? video.theme.accent;
  const parts = [];

  if (s.layout === "hook" && !isFood) {
    // Cloud banks part over the valley; the altimeter rolls up; the title settles.
    const m = cloudIntro(s, sid);
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
    // Food intro: an app-style menu; a cursor taps the first dish.
    parts.push(menuIntro(s, sid));
    titleIn(`#${sid}-title`, a + 0.2);
    fadeUp(`#${sid}-kicker`, a + 0.1);
    fadeUp(`#${sid}-pill`, a + 3.8);
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
      const cue = Math.max(cueTime(s, s.dishes?.[0]?.spokenAs) ?? a + (s.end - a) * 0.55, enter + CLEAR);
      parts.push(`<div id="${sid}-food" class="card"><div class="card-h">${esc(vi ? "ĂN GẦN ĐÂY" : "EAT NEARBY")} · ${esc(s.dishes?.[0]?.name ?? "")}</div>${(s.dishes ?? []).map((d) => row(d, accent)).join("")}</div>`);
      tw(`tl.fromTo("#${sid}-food", {opacity:0, y:60, filter:"blur(10px)"}, {opacity:1, y:0, filter:"blur(0px)", duration:0.5, ease:"expo.out"}, ${r2(cue - 0.1)});`);
      tw(`tl.fromTo("#${sid}-food .row", {opacity:0, x:-40}, {opacity:1, x:0, duration:0.3, stagger:0.09, ease:"power3.out"}, ${r2(cue + 0.15)});`);
      parts.push(proofs(sid, `#${sid}-food .row`, s.dishes ?? [], cue, s.end));
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
    // "Hết bao nhiêu tiền?": a receipt prints line by line, the total gets stamped.
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
      tw(`tl.fromTo("#${sid}-ln${k}", {opacity:0, x:-30}, {opacity:1, x:0, duration:0.3, ease:"power3.out"}, ${r2(t0 + 0.5 + k * step)});`);
      if (k % 2 === 0) sound("pop", r2(t0 + 0.5 + k * step), 0.07);
      return `<div id="${sid}-ln${k}" class="ln" style="opacity:0"><span>${esc(it.k)}${it.note ? `<small>${esc(it.note)}</small>` : ""}</span><b>${esc(it.v)}</b></div>`;
    }).join("");
    parts.push(`<div id="${sid}-rc" class="rcpt" style="clip-path:inset(0% 0% 100% 0%)"><div class="rc-h">${esc(s.receiptTitle ?? "")}</div>${lines}<div id="${sid}-tot" class="ln tot" style="opacity:0"><span>${vi ? "TỔNG / NGƯỜI" : "TOTAL / PERSON"}</span><b>${esc(s.total)}</b></div><div class="rc-f">${esc(s.note ?? "")}</div></div>`);
    tw(`tl.fromTo("#${sid}-rc", {clipPath:"inset(0% 0% 100% 0%)"}, {clipPath:"inset(0% 0% 0% 0%)", duration:${r2(Math.min(1.6, totalAt - t0))}, ease:"power1.inOut"}, ${r2(t0)});`);
    tw(`tl.fromTo("#${sid}-tot", {opacity:0, scale:1.4}, {opacity:1, scale:1, duration:0.4, ease:"back.out(2)"}, ${r2(totalAt)});`);
    parts.push(`<div id="${sid}-stamp" class="stamp" style="opacity:0">${esc(s.stamp ?? "")}</div>`);
    tw(`tl.fromTo("#${sid}-stamp", {opacity:0, scale:2.2, rotation:-24}, {opacity:1, scale:1, rotation:-12, duration:0.35, ease:"power4.in"}, ${r2(totalAt + 0.35)});`);
    sound("impact-bass-1", r2(totalAt + 0.68), 0.12);
  } else if (!isFood) {
    // Travel outro: the title over the best photo while a sea of cloud rises from below.
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div class="top"></div>`);
    parts.push(`<div id="${sid}-sea" class="sea">${cloudBank(`${sid}-sl`, "left low")}${cloudBank(`${sid}-sr`, "right low")}</div>`);
    tw(`tl.fromTo("#${sid}-sea", {y:900}, {y:0, duration:${r2(s.end - enter)}, ease:"power1.out"}, ${r2(enter)});`);
    tw(`tl.fromTo("#${sid}-sl", {x:-120}, {x:60, duration:${r2(s.end - a)}, ease:"none"}, ${r2(a)});`);
    tw(`tl.fromTo("#${sid}-sr", {x:120}, {x:-60, duration:${r2(s.end - a)}, ease:"none"}, ${r2(a)});`);
    parts.push(`<div id="${sid}-kicker" class="hook-kicker" style="top:250px;opacity:0">${esc(s.kicker ?? "")}</div>`);
    parts.push(`<h1 id="${sid}-title" class="hook-title outro">${words(s.caption)}</h1>`);
    fadeUp(`#${sid}-kicker`, enter + 0.1);
    titleIn(`#${sid}-title`, enter + 0.3);
    parts.push(`<div id="${sid}-cta" class="pill" style="background:${video.theme.accent};top:760px;opacity:0">${esc(s.cta ?? "")}</div>`);
    fadeUp(`#${sid}-cta`, enter + 1.6);
  } else {
    // Food outro: a wheel of the five dishes spins and slows under the question.
    parts.push(`<div class="menu-bg"></div>`);
    const n = s.gallery.length, R = 300;
    const slots = s.gallery.map((src, k) => {
      const ang = (k / n) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(ang) * R, y = Math.sin(ang) * R;
      return `<div class="wd" style="left:${r2(x - 120)}px;top:${r2(y - 120)}px"><img src="${asset(src)}" alt="" /><span>${esc(s.names?.[k] ?? "")}</span></div>`;
    }).join("");
    parts.push(`<div class="wheel-wrap"><div id="${sid}-wheel" class="wheel">${slots}</div><i class="hub"></i><i class="pointer"></i></div>`);
    tw(`tl.fromTo("#${sid}-wheel", {rotation:0}, {rotation:${360 * 2 + 360 / n}, duration:${r2(Math.min(5.5, s.end - a - 1))}, ease:"power3.out"}, ${r2(a + 0.3)});`);
    tw(`tl.fromTo("#${sid}-wheel .wd span", {rotation:0}, {rotation:-${360 * 2 + 360 / n}, duration:${r2(Math.min(5.5, s.end - a - 1))}, ease:"power3.out"}, ${r2(a + 0.3)});`);
    parts.push(`<h1 id="${sid}-title" class="menu-t outro">${words(s.caption)}</h1>`);
    titleIn(`#${sid}-title`, enter + 0.2);
    parts.push(`<div id="${sid}-cta" class="pill" style="background:${video.theme.accent};top:1360px;opacity:0">${esc(s.cta ?? "")}</div>`);
    fadeUp(`#${sid}-cta`, enter + 1.6);
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
const SHADERS = ["gravitational-lens", "cinematic-zoom", "cross-warp-morph", "flash-through-white"];
const transitions = scenes.slice(1).map((s, k) => ({
  time: r2(s.start - SEAM / 2),
  shader: k === scenes.length - 2 ? "sdf-iris" : SHADERS[k % SHADERS.length],
  duration: SEAM,
}));
for (const tr of transitions) sound("whoosh-short", r2(tr.time - 0.1), 0.15);

// ---- fine snow drifting down over everything -----------------------------
const FLAKES = [[80, 12, 0.0, 8], [230, 15, 2.1, 5], [390, 11, 4.4, 7], [560, 14, 1.2, 4], [720, 12.5, 3.3, 8], [900, 10.5, 5.6, 6], [150, 16, 7.0, 4], [650, 13.5, 8.4, 6], [830, 11.5, 9.1, 5], [320, 14.5, 10.2, 7], [470, 13, 6.1, 5], [1000, 15, 3.9, 6]];
const flakes = FLAKES.map(([x, dur, delay, size], k) => {
  const reps = Math.ceil((total - delay) / dur);
  tw(`tl.fromTo("#flake${k}", {y:-60, x:0}, {y:${H + 60}, x:${k % 2 ? 70 : -70}, duration:${dur}, ease:"none", repeat:${Math.max(0, reps - 1)}}, ${delay});`);
  return `<i id="flake${k}" class="flake" style="left:${x}px;width:${size}px;height:${size}px" data-layout-ignore></i>`;
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
:root { --ground:#0d1522; --ink:#f7f9fc; --sky:#8ecbff; --indigo:#2f3d7a; --gold:#ffd166; --red:#e63946; --green:#2a9d8f; --soil:#1b2440; }
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:${W}px; height:${H}px; overflow:hidden; background:var(--ground); }
#root { position:relative; width:${W}px; height:${H}px; overflow:hidden; font-family:"Montserrat"; }
.scene { position:absolute; inset:0; overflow:hidden; background:var(--ground); z-index:1; }
.ph { position:absolute; inset:0; overflow:hidden; }
.ph .lift { position:absolute; inset:0; }
.ph img { width:100%; height:100%; object-fit:cover; }
.shade { position:absolute; inset:0; background:radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(6,10,20,0.5) 100%); }
.top { position:absolute; left:0; right:0; top:0; height:760px; background:linear-gradient(180deg, rgba(9,14,28,0.9) 0%, rgba(9,14,28,0.6) 55%, rgba(9,14,28,0) 100%); }
.floor { position:absolute; left:0; right:0; bottom:0; height:900px; background:linear-gradient(180deg, rgba(9,14,28,0) 0%, rgba(9,14,28,0.6) 45%, rgba(9,14,28,0.92) 100%); }
.hook-dim { position:absolute; inset:0; z-index:4; background:linear-gradient(180deg, rgba(9,14,28,0.55) 0%, rgba(9,14,28,0.35) 50%, rgba(9,14,28,0.85) 100%); }
.flake { position:absolute; top:0; z-index:16; border-radius:50%; background:#fff; opacity:0.6; box-shadow:0 0 8px 2px rgba(255,255,255,0.6); pointer-events:none; }
/* Cloud banks (intro and outro). */
.cloud { position:absolute; top:-80px; width:1250px; height:2080px; z-index:6; pointer-events:none; filter:blur(40px); }
.cloud.left { left:-420px; } .cloud.right { right:-420px; }
.cloud i { position:absolute; border-radius:50%; background:#f4f7fc; transform:scale(0.72); }
.cloud i:nth-child(1) { width:900px; height:900px; left:120px; top:-60px; }
.cloud i:nth-child(2) { width:1000px; height:1000px; left:220px; top:520px; }
.cloud i:nth-child(3) { width:880px; height:880px; left:60px; top:1120px; }
.cloud i:nth-child(4) { width:760px; height:760px; left:380px; top:260px; }
.cloud i:nth-child(5) { width:820px; height:820px; left:320px; top:900px; }
.cloud i:nth-child(6) { width:700px; height:700px; left:200px; top:1500px; }
.sea { position:absolute; left:0; right:0; bottom:-600px; height:1500px; z-index:5; }
.cloud.low { top:200px; height:1300px; }
.alt { position:absolute; left:0; right:0; top:330px; z-index:9; text-align:center; color:#fff; text-shadow:0 4px 24px rgba(0,0,0,0.55); }
.alt small { display:block; font:800 28px "Montserrat"; letter-spacing:0.32em; color:var(--soil); text-shadow:none; background:rgba(255,255,255,0.85); display:inline-block; padding:8px 22px; border-radius:999px; }
.digits { margin-top:18px; display:flex; justify-content:center; align-items:flex-end; gap:4px; font:900 92px/92px "Montserrat"; color:var(--soil); text-shadow:none; }
.dg { display:inline-block; height:92px; overflow:hidden; background:rgba(255,255,255,0.92); border-radius:14px; padding:0 10px; box-shadow:0 10px 30px rgba(0,0,0,0.25); }
.dg.dot { background:none; box-shadow:none; padding:0 2px; color:#fff; }
.dg .col { display:block; }
.unit { margin-left:12px; font:900 60px "Montserrat"; color:#fff; text-shadow:0 3px 14px rgba(0,0,0,0.5); }
.hook-kicker { position:absolute; left:0; right:0; top:1090px; text-align:center; font:700 32px "Montserrat"; letter-spacing:0.3em; color:var(--sky); z-index:7; }
.hook-title { position:absolute; left:0; right:0; top:1150px; text-align:center; font:900 190px/1 "Playfair Display"; color:var(--ink); text-shadow:0 10px 60px rgba(0,0,0,0.6); z-index:7; }
.hook-title .w, .title .w { display:inline-block; }
.hook-title.outro { top:330px; font-size:118px; line-height:1.08; padding:0 70px; }
.pill { position:absolute; left:50%; transform:translateX(-50%); font:900 48px "Montserrat"; color:var(--soil); padding:12px 40px; border-radius:999px; white-space:nowrap; z-index:8; }
/* Cable-car cabin (stop marker). */
.cab { position:absolute; right:30px; top:70px; width:330px; height:380px; z-index:6; overflow:hidden; }
.cable { position:absolute; left:-20px; right:-20px; top:52px; height:4px; background:rgba(255,255,255,0.85); transform:rotate(-8.5deg); transform-origin:50% 50%; box-shadow:0 2px 6px rgba(0,0,0,0.4); }
.car { position:absolute; left:55px; top:30px; width:220px; transform-origin:50% 0%; }
.hanger { display:block; margin:0 auto; width:10px; height:70px; background:#cfd6e3; border-radius:5px; position:relative; }
.hanger::before { content:""; position:absolute; left:-22px; top:-8px; width:54px; height:22px; border-radius:11px; background:#9aa6bd; }
.box { margin-top:-4px; height:250px; border-radius:34px 34px 26px 26px; background:linear-gradient(180deg, #e63946 0%, #c62f3b 100%); box-shadow:0 16px 34px rgba(0,0,0,0.5); text-align:center; padding-top:22px; }
.win { margin:0 22px; height:58px; border-radius:16px; background:linear-gradient(180deg, #cfe9ff, #8ecbff); font:800 22px/58px "Montserrat"; letter-spacing:0.16em; color:var(--soil); }
.box b { display:block; margin-top:22px; font:900 42px/1 "Montserrat"; color:#fff; white-space:nowrap; }
.box small { display:block; margin-top:12px; font:800 24px "Montserrat"; letter-spacing:0.14em; color:var(--gold); white-space:nowrap; }
.head { position:absolute; left:80px; top:215px; width:640px; display:flex; flex-direction:column; gap:10px; z-index:5; }
.kicker { font:700 32px "Montserrat"; letter-spacing:0.28em; }
.title { margin-bottom:10px; font:800 104px/1.04 "Playfair Display"; color:var(--ink); text-shadow:0 6px 30px rgba(0,0,0,0.55); }
.point { font:600 37px/1.3 "Montserrat"; color:rgba(247,249,252,0.93); text-shadow:0 2px 14px rgba(0,0,0,0.7); }
.point i { display:inline-block; width:14px; height:14px; border-radius:50%; margin-right:18px; vertical-align:middle; }
/* White cards with a brocade stripe, in the lower third. */
.card { position:absolute; left:60px; width:960px; top:1110px; padding:34px 34px 16px; border-radius:20px; background:rgba(247,248,252,0.97); box-shadow:0 18px 40px rgba(0,0,0,0.45); z-index:7; overflow:hidden; }
.card::before, .rcpt::before { content:""; position:absolute; left:0; right:0; top:0; height:12px; background:repeating-linear-gradient(90deg, var(--red) 0 40px, var(--gold) 40px 56px, var(--green) 56px 96px, var(--indigo) 96px 112px); }
.card-h { font:800 28px "Montserrat"; letter-spacing:0.2em; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; color:var(--indigo); }
.card-t { font:600 40px/1.3 "Montserrat"; color:var(--soil); }
.card-n { font:600 32px/1.3 "Montserrat"; color:rgba(27,36,64,0.72); margin-bottom:6px; }
.dots i { display:inline-block; width:12px; height:12px; border-radius:50%; margin-left:10px; background:rgba(27,36,64,0.2); }
.dots i.on { background:var(--indigo); }
.row { display:flex; align-items:baseline; gap:16px; padding:8px 0; border-top:1px solid rgba(27,36,64,0.14); border-radius:10px; }
.row b { font:800 36px "Montserrat"; color:var(--soil); white-space:nowrap; }
.row span { font:500 28px "Montserrat"; color:rgba(27,36,64,0.6); flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.row em { font:800 27px "Montserrat"; font-style:normal; color:var(--soil); padding:4px 14px; border-radius:999px; white-space:nowrap; box-shadow:inset 0 0 0 2px rgba(27,36,64,0.25); }
/* Google Maps screenshot chip above the restaurant card. */
.gmaps { position:absolute; left:400px; width:620px; bottom:830px; border-radius:22px; overflow:hidden; background:#fff; box-shadow:0 16px 40px rgba(0,0,0,0.5); z-index:8; }
.gmaps-h { display:flex; align-items:center; gap:10px; padding:12px 22px; background:#f1f3f4; font:700 24px "Montserrat"; color:#3c4043; }
.gmaps-h i { font-style:normal; }
.gmaps-h span { margin-left:auto; font:500 20px "Montserrat"; color:#70757a; }
.gmaps img { display:block; width:100%; border-top:1px solid #e8eaed; }
.rail { position:absolute; left:0; right:0; top:1690px; z-index:20; display:flex; justify-content:center; gap:26px; }
.rail i { width:18px; height:18px; border-radius:50%; background:rgba(255,255,255,0.22); }
.rail i.done { background:rgba(255,255,255,0.6); }
/* Cost receipt. */
.rcpt { position:absolute; left:110px; width:860px; top:560px; padding:44px 46px 30px; background:#fbfbf8; border-radius:8px 8px 0 0; box-shadow:0 24px 50px rgba(0,0,0,0.5); z-index:7; font-family:"Montserrat"; overflow:hidden; }
.rcpt::after { content:""; position:absolute; left:0; right:0; bottom:-1px; height:16px; background:linear-gradient(-45deg, transparent 10px, var(--ground) 10px) 0 0/22px 16px repeat-x, linear-gradient(45deg, transparent 10px, var(--ground) 10px) 0 0/22px 16px repeat-x; opacity:0; }
.rc-h { font:800 26px "Montserrat"; letter-spacing:0.22em; color:var(--indigo); text-align:center; padding-bottom:14px; border-bottom:3px dashed rgba(27,36,64,0.25); margin-bottom:6px; }
.ln { display:flex; justify-content:space-between; align-items:baseline; gap:20px; padding:12px 0; border-bottom:2px dotted rgba(27,36,64,0.18); }
.ln span { font:700 32px/1.2 "Montserrat"; color:var(--soil); }
.ln span small { display:block; font:500 22px "Montserrat"; color:rgba(27,36,64,0.55); margin-top:2px; }
.ln b { font:900 34px "Montserrat"; color:var(--soil); white-space:nowrap; }
.ln.tot { border-bottom:none; border-top:4px solid var(--soil); margin-top:8px; padding-top:16px; }
.ln.tot span { font:900 30px "Montserrat"; letter-spacing:0.12em; }
.ln.tot b { font:900 46px "Montserrat"; color:var(--red); }
.rc-f { margin-top:12px; font:500 22px "Montserrat"; color:rgba(27,36,64,0.55); text-align:center; }
.stamp { position:absolute; right:40px; top:445px; z-index:9; padding:8px 18px; border:5px solid var(--red); border-radius:12px; color:var(--red); font:900 28px "Montserrat"; letter-spacing:0.06em; background:rgba(255,255,255,0.88); }
/* Food intro: app-style menu; food outro: dish wheel. */
.menu-bg { position:absolute; inset:0; background:radial-gradient(ellipse at 50% 30%, #24345e 0%, #16213d 60%, #0d1522 100%); }
.menu-bg::after { content:""; position:absolute; left:0; right:0; top:0; height:22px; background:repeating-linear-gradient(90deg, var(--red) 0 60px, var(--gold) 60px 84px, var(--green) 84px 144px, var(--indigo) 144px 168px); }
.menu-in { position:absolute; inset:150px 70px; z-index:2; }
.menu-k { text-align:center; font:700 30px "Montserrat"; letter-spacing:0.3em; color:var(--sky); }
.menu-t { margin-top:20px; text-align:center; font:900 112px/1.05 "Playfair Display"; color:#fff; }
.menu-t .w { display:inline-block; }
.menu-t.outro { position:absolute; left:0; right:0; top:150px; z-index:3; padding:0 80px; }
.menu-list { list-style:none; margin-top:60px; display:flex; flex-direction:column; gap:22px; }
.menu-list li { display:flex; align-items:center; gap:28px; padding:16px 24px; border-radius:26px; background:rgba(255,255,255,0.08); border:2px solid rgba(255,255,255,0.12); }
.menu-list img { width:130px; height:130px; border-radius:22px; object-fit:cover; }
.menu-list span { flex:1; }
.menu-list b { display:block; font:800 48px "Montserrat"; color:#fff; white-space:nowrap; }
.menu-list small { display:block; margin-top:6px; font:600 26px "Montserrat"; color:rgba(255,255,255,0.65); }
.menu-list li > i { font:300 70px "Montserrat"; color:rgba(255,255,255,0.5); font-style:normal; }
.menu-pill { top:1370px; background:var(--gold); }
.cursor { position:absolute; left:820px; top:445px; z-index:9; }
.ring { position:absolute; left:-40px; top:-40px; width:80px; height:80px; border-radius:50%; border:6px solid var(--gold); opacity:0; }
.wheel-wrap { position:absolute; left:540px; top:900px; width:0; height:0; z-index:2; }
.wheel { position:absolute; left:0; top:0; width:0; height:0; }
.wd { position:absolute; width:240px; height:240px; }
.wd img { width:240px; height:240px; border-radius:50%; object-fit:cover; border:8px solid #fff; box-shadow:0 14px 34px rgba(0,0,0,0.5); }
.wd span { position:absolute; left:50%; bottom:-30px; transform:translateX(-50%); padding:6px 16px; border-radius:999px; background:#fff; color:var(--soil); font:800 26px "Montserrat"; white-space:nowrap; }
.hub { position:absolute; left:-50px; top:-50px; width:100px; height:100px; border-radius:50%; background:repeating-conic-gradient(var(--red) 0 25%, var(--gold) 0 50%); border:8px solid #fff; }
.pointer { position:absolute; left:-30px; top:-470px; width:0; height:0; border-left:30px solid transparent; border-right:30px solid transparent; border-top:52px solid var(--gold); filter:drop-shadow(0 6px 10px rgba(0,0,0,0.5)); }
.brand { position:absolute; left:60px; top:60px; z-index:21; font:800 26px "Montserrat"; letter-spacing:0.3em; color:rgba(247,249,252,0.85); text-shadow:0 2px 10px rgba(0,0,0,0.5); }
.brand b { color:var(--gold); letter-spacing:0; margin-right:12px; }
.cap { position:absolute; left:60px; right:60px; top:1500px; text-align:center; font:800 50px/1.25 "Montserrat"; color:#ffffff; text-shadow:0 3px 0 rgba(0,0,0,0.55), 0 0 22px rgba(0,0,0,0.85); z-index:20;${cover ? " display:none;" : ""} }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="${W}" data-height="${H}">
${media.join("\n")}
${sfx.join("\n")}
${html.join("\n")}
${flakes.join("\n")}
<div class="brand" data-layout-ignore><b>▲</b>${esc(brand)}</div>
${caps.join("\n")}
</div>
<script>
const tl = gsap.timeline({ paused: true });
${js.join("\n")}
HyperShader.init({
  bgColor: "#0d1522",
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
