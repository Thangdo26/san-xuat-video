#!/usr/bin/env node
/**
 * node hf/build-hg.mjs --slug ha-giang-3n2d [--cover]
 *
 * Turns data/videos/<slug>/video.json + voiceover.json into a HyperFrames project at
 * build/<slug>/. The look ("Hà Giang · cực Bắc"), new for this destination:
 *   - travel intro: a perforated postage stamp drops onto kraft paper, a round postmark
 *     ("HÀ GIANG · CỰC BẮC") thumps down, then the camera pushes through the stamp into the photo;
 *   - thin wind streaks sweep across every scene (mountain-pass wind);
 *   - each stop gets a green QL4C road sign ("NGÀY 1 / SÁNG ➜") that rises on its pole and flips down;
 *   - photos change with a whip pan (slide in from the right with a skew, old photo pushed left);
 *   - cream cards with a buckwheat-pink edge; a Google Maps panel above every restaurant card;
 *   - "Hết bao nhiêu tiền?" as a ruled notebook page: lines get ticked one by one, the total circled;
 *   - travel outro: a passport page collects one stamp per stop, then "Lưu lại nhé!";
 *   - food intro: a chalkboard menu at the market, the first dish gets circled in chalk;
 *     food outro: the five dishes drop onto a woven tray (mẹt);
 *   - shader seams: thermal distortion, light leak, ripple waves, domain warp, chromatic split
 *     into the outro; quiet whooshes (about 0.15); subtitles at top 1500, rail below.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fail, parseArgs, requireSlug } from "../scripts/lib/args.mjs";
import { probeDurationSec } from "../scripts/lib/media.mjs";
import { PROJECT_ROOT, PUBLIC_ROOT } from "../scripts/lib/paths.mjs";

const { flags } = parseArgs(process.argv.slice(2));
const slug = requireSlug(flags, "build-hg");
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

/** Photo stack; each new photo whips in from the right with a skew while the old one is pushed left. */
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
        tw(`tl.set("#${id}", {xPercent:100}, 0);`);
        tw(`tl.fromTo("#${id}", {xPercent:100, skewX:-7}, {xPercent:0, skewX:0, duration:0.6, ease:"power3.inOut", immediateRender:false}, ${a});`);
        tw(`tl.fromTo("#${idPrefix}-p${k - 1}", {xPercent:0}, {xPercent:-38, duration:0.6, ease:"power3.inOut", immediateRender:false}, ${a});`);
        tw(`tl.to("#${idPrefix}-p${k - 1}", {opacity:0, duration:0.01}, ${r2(a + 0.61)});`);
      }
      return `<div id="${id}" class="ph"><img src="${asset(src)}" alt="" /></div>`;
    })
    .join("");
};

const titleIn = (sel, at) =>
  tw(`tl.fromTo("${sel} .w", {opacity:0, y:30, filter:"blur(8px)"}, {opacity:1, y:0, filter:"blur(0px)", duration:0.5, stagger:0.08, ease:"power3.out"}, ${r2(at)});`);
const fadeUp = (sel, at, dur = 0.35) =>
  tw(`tl.fromTo("${sel}", {opacity:0, y:26}, {opacity:1, y:0, duration:${dur}, ease:"expo.out"}, ${r2(at)});`);

/** Green QL4C road sign ("NGÀY 1 / SÁNG ➜"): the pole rises, the plate flips down and wobbles to rest. */
const cabin = (sid, big, small, at) => {
  tw(`tl.fromTo("#${sid}-cab", {opacity:0}, {opacity:1, duration:0.15}, ${r2(at)});`);
  tw(`tl.fromTo("#${sid}-cab .pole", {scaleY:0}, {scaleY:1, duration:0.4, ease:"power3.out"}, ${r2(at)});`);
  tw(`tl.fromTo("#${sid}-cab .plate", {rotationX:-100, transformPerspective:900}, {rotationX:0, duration:0.75, ease:"back.out(1.8)"}, ${r2(at + 0.3)});`);
  tw(`tl.fromTo("#${sid}-cab .plate", {rotation:-4}, {rotation:0, duration:1.2, ease:"elastic.out(1, 0.4)"}, ${r2(at + 0.9)});`);
  sound("pop", r2(at + 0.75), 0.12);
  return `<div id="${sid}-cab" class="cab" style="opacity:0"><i class="pole"></i><div class="plate"><small>QL4C · ${esc(brand)}</small><b>${esc(big)}</b><em>${esc(small)} ➜</em></div></div>`;
};

const row = (p, accent) => `<div class="row"><b>${esc(p.place)}</b><span>${esc(p.address)}</span><em style="background:${p.rating == null ? "rgba(27,36,64,0.12)" : accent}">${star(p.rating)}</em></div>`;

// Google Maps screenshots (name + stars + review count), captured 08/11/2026 into public/videos/ha-giang/maps.
const MAPS = video.maps ?? {};
const MAPS_DATE = vi ? "chụp 08/11/2026" : "captured 8 Nov 2026";

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
  return `<div id="${id}" class="gmaps" style="opacity:0"><div class="gmaps-h"><i>📍</i>Google Maps<span>${MAPS_DATE}</span></div>${list.map(([m, k]) => `<img id="${id}-${k}" src="${asset(`videos/ha-giang/maps/${m}.png`)}" alt="" />`).join("")}</div>`;
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

// ---- postage stamp + postmark, then push through the stamp (travel intro) --------
const stampIntro = (s, sid) => {
  const a = s.start;
  const parts = [photos(s, a, s.end, sid)];
  parts.push(`<div class="shade"></div>`);
  // Kraft paper desk with the stamp on it; both clear away when the camera pushes in.
  parts.push(`<div id="${sid}-desk" class="desk"></div>`);
  parts.push(`<div id="${sid}-stamp" class="pstamp"><div class="perf"><div class="pwin"><img src="${asset(s.gallery[0])}" alt="" /></div><div class="pfoot"><b>${esc(brand)}</b><span>${vi ? "VIỆT NAM" : "VIET NAM"} · 2026</span></div></div></div>`);
  parts.push(`<div id="${sid}-mark" class="pmark"><svg viewBox="0 0 300 300" width="300" height="300"><circle cx="150" cy="150" r="128" fill="none" stroke="#b8336a" stroke-width="8"/><circle cx="150" cy="150" r="96" fill="none" stroke="#b8336a" stroke-width="4"/><text x="150" y="130" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="34" fill="#b8336a">${esc(brand)}</text><text x="150" y="172" text-anchor="middle" font-family="Montserrat" font-weight="800" font-size="24" fill="#b8336a">${vi ? "CỰC BẮC" : "FAR NORTH"}</text><text x="150" y="204" text-anchor="middle" font-family="Montserrat" font-weight="700" font-size="20" fill="#b8336a">1.470 m</text></svg><i class="wave"></i><i class="wave w2"></i><i class="wave w3"></i></div>`);
  tw(`tl.fromTo("#${sid}-stamp", {y:-1100, rotation:-14}, {y:0, rotation:-4, duration:0.8, ease:"power3.out"}, ${r2(a + 0.15)});`);
  tw(`tl.fromTo("#${sid}-mark", {opacity:0, scale:2.3, rotation:-30}, {opacity:0.92, scale:1, rotation:-12, duration:0.32, ease:"power4.in"}, ${r2(a + 1.05)});`);
  sound("impact-bass-1", r2(a + 1.35), 0.13);
  // Push through the stamp window into the full-frame photo.
  const push = a + 2.0;
  tw(`tl.to("#${sid}-mark", {opacity:0, duration:0.25}, ${r2(push)});`);
  tw(`tl.to("#${sid}-stamp", {scale:3.6, rotation:0, y:160, duration:0.9, ease:"power3.in"}, ${r2(push)});`);
  tw(`tl.to("#${sid}-stamp", {opacity:0, duration:0.3}, ${r2(push + 0.65)});`);
  tw(`tl.to("#${sid}-desk", {opacity:0, duration:0.6}, ${r2(push + 0.3)});`);
  sound("whoosh-cinematic", r2(push), 0.14);
  return { html: parts.join(""), settle: r2(push + 0.9) };
};

// ---- chalkboard market menu (food intro) ---------------------------------------
const menuIntro = (s, sid) => {
  const a = s.start;
  const items = (s.names ?? []).map((n, k) => {
    const at = a + 1.0 + k * 0.34;
    tw(`tl.fromTo("#${sid}-li${k}", {opacity:0, x:-120}, {opacity:1, x:0, duration:0.4, ease:"expo.out"}, ${r2(at)});`);
    tw(`tl.fromTo("#${sid}-li${k} .chalk", {scaleX:0}, {scaleX:1, duration:0.45, ease:"power2.out"}, ${r2(at + 0.2)});`);
    return `<li id="${sid}-li${k}"><img src="${asset(s.gallery[k])}" alt="" /><span><b>${esc(n)}</b><small>${esc(s.tags?.[k] ?? "")}</small><i class="chalk"></i></span></li>`;
  }).join("");
  // A chalk circle is drawn around the first dish.
  const ring = a + 1.0 + (s.names?.length ?? 5) * 0.34 + 0.5;
  tw(`tl.fromTo("#${sid}-ring", {strokeDashoffset:2400}, {strokeDashoffset:0, duration:0.8, ease:"power2.inOut"}, ${r2(ring)});`);
  sound("pop", r2(ring + 0.6), 0.12);
  return `<div class="board"></div><div class="menu-in"><div id="${sid}-kicker" class="menu-k">${esc(s.kicker)}</div><h1 id="${sid}-title" class="menu-t">${words(s.caption)}</h1><ul class="menu-list">${items}</ul></div><svg class="ring" viewBox="0 0 960 200" width="960" height="200"><path id="${sid}-ring" d="M60 110 C 60 30, 900 20, 920 100 C 935 175, 120 190, 70 130 C 50 100, 120 60, 200 55" fill="none" stroke="#f2c14e" stroke-width="8" stroke-linecap="round" stroke-dasharray="2400" stroke-dashoffset="2400"/></svg><div id="${sid}-pill" class="pill menu-pill">${esc(s.label ?? "")}</div>`;
};

// ---- scenes -------------------------------------------------------------
for (const s of scenes) {
  const sid = `s-${s.id}`;
  const a = s.start;
  const enter = a + LEAD;
  const accent = s.accent ?? video.theme.accent;
  const parts = [];

  if (s.layout === "hook" && !isFood) {
    // A postage stamp drops in, gets postmarked, and the camera pushes through it; the title settles.
    const m = stampIntro(s, sid);
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
    // Food intro: a chalkboard menu at the market; the first dish gets circled.
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
    // "Hết bao nhiêu tiền?": a ruled notebook page; each line gets a tick, the total is circled.
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
      tw(`tl.fromTo("#${sid}-ln${k} .tick", {scale:0, rotation:-30}, {scale:1, rotation:0, duration:0.3, ease:"back.out(3)"}, ${r2(at + 0.2)});`);
      if (k % 2 === 0) sound("pop", r2(at + 0.2), 0.07);
      return `<div id="${sid}-ln${k}" class="ln" style="opacity:0"><i class="tick">✓</i><span>${esc(it.k)}${it.note ? `<small>${esc(it.note)}</small>` : ""}</span><b>${esc(it.v)}</b></div>`;
    }).join("");
    parts.push(`<div id="${sid}-rc" class="rcpt" style="opacity:0"><div class="rc-h">${esc(s.receiptTitle ?? "")}</div>${lines}<div id="${sid}-tot" class="ln tot" style="opacity:0"><span>${vi ? "TỔNG / NGƯỜI" : "TOTAL / PERSON"}</span><b>${esc(s.total)}<svg class="circ" viewBox="0 0 360 110" width="360" height="110"><path id="${sid}-circ" d="M30 60 C 30 15, 330 8, 340 52 C 350 98, 60 106, 34 70 C 24 55, 60 30, 110 26" fill="none" stroke="#e86a92" stroke-width="6" stroke-linecap="round" stroke-dasharray="1200" stroke-dashoffset="1200"/></svg></b></div><div class="rc-f">${esc(s.note ?? "")}</div></div>`);
    tw(`tl.fromTo("#${sid}-rc", {opacity:0, y:80, rotation:2}, {opacity:1, y:0, rotation:-1, duration:0.6, ease:"expo.out"}, ${r2(t0)});`);
    tw(`tl.fromTo("#${sid}-tot", {opacity:0, y:20}, {opacity:1, y:0, duration:0.35, ease:"power3.out"}, ${r2(totalAt)});`);
    tw(`tl.fromTo("#${sid}-circ", {strokeDashoffset:1200}, {strokeDashoffset:0, duration:0.7, ease:"power2.inOut"}, ${r2(totalAt + 0.3)});`);
    parts.push(`<div id="${sid}-stamp" class="stamp" style="opacity:0">${esc(s.stamp ?? "")}</div>`);
    tw(`tl.fromTo("#${sid}-stamp", {opacity:0, scale:2.2, rotation:-24}, {opacity:1, scale:1, rotation:-10, duration:0.35, ease:"power4.in"}, ${r2(totalAt + 0.9)});`);
    sound("impact-bass-1", r2(totalAt + 1.23), 0.12);
  } else if (!isFood) {
    // Travel outro: a passport page collects one stamp per stop, then "Lưu lại nhé!".
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div class="top"></div>`);
    const names = s.stamps ?? [];
    const COLORS = ["#b8336a", "#0b7a3e", "#2f5fa7", "#c0712a", "#6b3fa0", "#b8336a", "#0b7a3e", "#2f5fa7"];
    const span = Math.min(0.55, (s.end - enter - 3) / Math.max(1, names.length));
    const stamps = names.map((n, k) => {
      const rot = [-8, 6, -4, 9, -10, 5, -6, 7][k % 8];
      const at = enter + 0.9 + k * span;
      tw(`tl.fromTo("#${sid}-ps${k}", {opacity:0, scale:2.2, rotation:${rot - 20}}, {opacity:1, scale:1, rotation:${rot}, duration:0.28, ease:"power4.in"}, ${r2(at)});`);
      if (k % 2 === 0) sound("pop", r2(at + 0.25), 0.09);
      return `<div id="${sid}-ps${k}" class="vst${k % 3 === 1 ? " round" : ""}" style="color:${COLORS[k % COLORS.length]};border-color:${COLORS[k % COLORS.length]};opacity:0"><small>${vi ? "ĐÃ ĐẾN" : "VISITED"} · ${k + 1}</small><b>${esc(n)}</b></div>`;
    }).join("");
    parts.push(`<div id="${sid}-pass" class="pass"><div class="pass-h"><span>${vi ? "HỘ CHIẾU DU LỊCH" : "TRAVEL PASSPORT"}</span><span>${esc(brand)}</span></div><h1 id="${sid}-title" class="pass-t">${words(s.caption)}</h1><div class="pass-grid">${stamps}</div></div>`);
    tw(`tl.fromTo("#${sid}-pass", {opacity:0, y:120, rotation:-3}, {opacity:1, y:0, rotation:0, duration:0.6, ease:"expo.out"}, ${r2(enter)});`);
    titleIn(`#${sid}-title`, enter + 0.3);
    parts.push(`<div id="${sid}-cta" class="pill" style="background:${video.theme.accent};top:1380px;opacity:0;color:#fff">${esc(s.cta ?? "")}</div>`);
    fadeUp(`#${sid}-cta`, Math.min(s.end - 1.2, enter + 1.2 + names.length * span));
  } else {
    // Food outro: the five dishes drop onto a woven tray (mẹt) one by one.
    parts.push(`<div class="board warm"></div>`);
    const n = s.gallery.length, R = 255;
    const slots = s.gallery.map((src, k) => {
      const ang = (k / n) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(ang) * R, y = Math.sin(ang) * R;
      tw(`tl.fromTo("#${sid}-wd${k}", {y:-1300, rotation:${k % 2 ? 25 : -25}}, {y:0, rotation:0, duration:0.7, ease:"bounce.out"}, ${r2(a + 0.4 + k * 0.45)});`);
      sound("pop", r2(a + 0.75 + k * 0.45), 0.08);
      return `<div id="${sid}-wd${k}" class="wd" style="left:${r2(x - 120)}px;top:${r2(y - 120)}px"><img src="${asset(src)}" alt="" /><span>${esc(s.names?.[k] ?? "")}</span></div>`;
    }).join("");
    parts.push(`<div class="tray-wrap"><i id="${sid}-tray" class="tray"></i>${slots}</div>`);
    tw(`tl.fromTo("#${sid}-tray", {rotation:-8}, {rotation:6, duration:${r2(s.end - a)}, ease:"none"}, ${r2(a)});`);
    parts.push(`<h1 id="${sid}-title" class="menu-t outro">${words(s.caption)}</h1>`);
    titleIn(`#${sid}-title`, enter + 0.2);
    parts.push(`<div id="${sid}-cta" class="pill" style="background:${video.theme.accent};top:1370px;opacity:0;color:#fff">${esc(s.cta ?? "")}</div>`);
    fadeUp(`#${sid}-cta`, a + 0.6 + n * 0.45);
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
const SHADERS = ["thermal-distortion", "light-leak", "ripple-waves", "domain-warp"];
const transitions = scenes.slice(1).map((s, k) => ({
  time: r2(s.start - SEAM / 2),
  shader: k === scenes.length - 2 ? "chromatic-split" : SHADERS[k % SHADERS.length],
  duration: SEAM,
}));
for (const tr of transitions) sound("whoosh-short", r2(tr.time - 0.1), 0.15);

// ---- thin wind streaks sweeping across everything --------------------------
// [top, width, duration, delay]: each streak crosses the frame left to right, then repeats.
const GUSTS = [[180, 260, 2.6, 0.4], [420, 180, 3.1, 1.7], [690, 320, 2.4, 3.0], [940, 220, 3.4, 0.9], [1210, 280, 2.8, 2.2], [360, 200, 3.0, 4.1], [860, 240, 2.7, 5.3], [1380, 300, 3.3, 1.2], [560, 160, 2.5, 6.0], [1060, 210, 3.2, 3.6]];
const flakes = GUSTS.map(([top, w, dur, delay], k) => {
  const cycle = dur + 2.6;
  const reps = Math.max(0, Math.ceil((total - delay) / cycle) - 1);
  tw(`tl.fromTo("#flake${k}", {x:-${w + 40}, opacity:0}, {keyframes:[{x:${r2(W * 0.3)}, opacity:0.38, duration:${r2(dur * 0.3)}}, {x:${W + 40}, opacity:0, duration:${r2(dur * 0.7)}}], ease:"none", repeat:${reps}, repeatDelay:2.6}, ${delay});`);
  return `<i id="flake${k}" class="flake" style="top:${top}px;width:${w}px" data-layout-ignore></i>`;
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
:root { --ground:#14161b; --ink:#f8f6f2; --pink:#e86a92; --pinkd:#b8336a; --mustard:#f2c14e; --green:#0b7a3e; --slate:#23262d; --sky:#9fd3ff; --kraft:#c9a878; }
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:${W}px; height:${H}px; overflow:hidden; background:var(--ground); }
#root { position:relative; width:${W}px; height:${H}px; overflow:hidden; font-family:"Montserrat"; }
.scene { position:absolute; inset:0; overflow:hidden; background:var(--ground); z-index:1; }
.ph { position:absolute; inset:0; overflow:hidden; }
.ph img { width:100%; height:100%; object-fit:cover; }
.shade { position:absolute; inset:0; background:linear-gradient(180deg, rgba(10,12,16,0.18) 0%, rgba(10,12,16,0) 35%, rgba(10,12,16,0) 65%, rgba(10,12,16,0.35) 100%); }
.top { position:absolute; left:0; right:0; top:0; height:760px; background:linear-gradient(180deg, rgba(14,16,22,0.9) 0%, rgba(14,16,22,0.6) 55%, rgba(14,16,22,0) 100%); }
.floor { position:absolute; left:0; right:0; bottom:0; height:900px; background:linear-gradient(180deg, rgba(14,16,22,0) 0%, rgba(14,16,22,0.6) 45%, rgba(14,16,22,0.93) 100%); }
.hook-dim { position:absolute; inset:0; z-index:4; background:linear-gradient(180deg, rgba(14,16,22,0.5) 0%, rgba(14,16,22,0.3) 50%, rgba(14,16,22,0.85) 100%); }
/* Wind streaks. */
.flake { position:absolute; left:0; height:3px; z-index:16; border-radius:3px; background:linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.9) 60%, rgba(255,255,255,0) 100%); opacity:0; pointer-events:none; }
/* Travel intro: kraft desk, perforated postage stamp, round postmark. */
.desk { position:absolute; inset:0; z-index:5; background:linear-gradient(160deg, #d8bb8c 0%, #c9a878 55%, #b8955f 100%); }
.desk::after { content:""; position:absolute; inset:0; background:repeating-linear-gradient(115deg, rgba(255,255,255,0.05) 0 3px, rgba(0,0,0,0) 3px 11px); }
.pstamp { position:absolute; left:250px; top:470px; width:580px; height:760px; z-index:6; transform-origin:50% 45%; }
.perf { position:absolute; inset:0; background:#fbf7ef; border:18px dotted var(--kraft); outline:6px solid #fbf7ef; outline-offset:-24px; padding:30px; box-shadow:0 30px 60px rgba(0,0,0,0.35); }
.pwin { width:100%; height:560px; overflow:hidden; }
.pwin img { width:100%; height:100%; object-fit:cover; }
.pfoot { display:flex; justify-content:space-between; align-items:baseline; margin-top:16px; color:var(--slate); }
.pfoot b { font:900 44px "Playfair Display"; }
.pfoot span { font:800 22px "Montserrat"; letter-spacing:0.14em; color:var(--pinkd); }
.pmark { position:absolute; left:610px; top:330px; width:300px; height:300px; z-index:7; }
.pmark .wave { position:absolute; left:-260px; top:140px; width:280px; height:8px; border-radius:4px; background:var(--pinkd); }
.pmark .w2 { top:170px; } .pmark .w3 { top:200px; }
.hook-kicker { position:absolute; left:0; right:0; top:1090px; text-align:center; font:700 32px "Montserrat"; letter-spacing:0.3em; color:var(--mustard); z-index:7; }
.hook-title { position:absolute; left:0; right:0; top:1150px; text-align:center; font:900 170px/1 "Playfair Display"; color:var(--ink); text-shadow:0 10px 60px rgba(0,0,0,0.6); z-index:7; }
.hook-title .w, .title .w, .pass-t .w { display:inline-block; }
.pill { position:absolute; left:50%; transform:translateX(-50%); font:900 48px "Montserrat"; color:var(--slate); padding:12px 40px; border-radius:999px; white-space:nowrap; z-index:8; }
/* QL4C road sign (stop marker). */
.cab { position:absolute; right:40px; top:70px; width:320px; height:400px; z-index:6; }
.pole { position:absolute; left:150px; top:150px; width:20px; height:250px; border-radius:6px; background:linear-gradient(90deg, #8d939c, #d7dbe0 50%, #8d939c); transform-origin:50% 100%; }
.plate { position:absolute; left:10px; top:20px; width:300px; height:230px; border-radius:20px; background:var(--green); border:6px solid #fff; box-shadow:0 0 0 4px var(--green), 0 18px 34px rgba(0,0,0,0.5); text-align:center; padding-top:20px; transform-origin:50% 0%; }
.plate small { display:block; font:800 22px "Montserrat"; letter-spacing:0.14em; color:#dff5e6; white-space:nowrap; }
.plate b { display:block; margin-top:14px; font:900 54px/1 "Montserrat"; color:#fff; white-space:nowrap; }
.plate em { display:block; margin-top:14px; font:800 30px "Montserrat"; font-style:normal; letter-spacing:0.12em; color:var(--mustard); white-space:nowrap; }
.head { position:absolute; left:80px; top:215px; width:620px; display:flex; flex-direction:column; gap:10px; z-index:5; }
.kicker { font:700 32px "Montserrat"; letter-spacing:0.28em; }
.title { margin-bottom:10px; font:800 104px/1.04 "Playfair Display"; color:var(--ink); text-shadow:0 6px 30px rgba(0,0,0,0.55); }
.point { font:600 37px/1.3 "Montserrat"; color:rgba(248,246,242,0.93); text-shadow:0 2px 14px rgba(0,0,0,0.7); }
.point i { display:inline-block; width:14px; height:14px; border-radius:3px; transform:rotate(45deg); margin-right:18px; vertical-align:middle; }
/* Cream cards with a buckwheat-pink edge, in the lower third. */
.card { position:absolute; left:60px; width:960px; top:1110px; padding:30px 34px 16px 50px; border-radius:18px; background:rgba(255,250,243,0.97); box-shadow:0 18px 40px rgba(0,0,0,0.45); z-index:7; overflow:hidden; }
.card::before { content:""; position:absolute; left:0; top:0; bottom:0; width:16px; background:linear-gradient(180deg, var(--pink), var(--mustard)); }
.card-h { font:800 28px "Montserrat"; letter-spacing:0.2em; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; color:var(--pinkd); }
.card-t { font:600 40px/1.3 "Montserrat"; color:var(--slate); }
.card-n { font:600 32px/1.3 "Montserrat"; color:rgba(35,38,45,0.72); margin-bottom:6px; }
.dots i { display:inline-block; width:12px; height:12px; border-radius:50%; margin-left:10px; background:rgba(35,38,45,0.2); }
.dots i.on { background:var(--pinkd); }
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
.rail i { width:18px; height:18px; border-radius:4px; transform:rotate(45deg); background:rgba(255,255,255,0.22); }
.rail i.done { background:rgba(255,255,255,0.6); }
/* Cost: ruled notebook page. */
.rcpt { position:absolute; left:100px; width:880px; top:560px; padding:40px 44px 26px 120px; border-radius:10px; z-index:7; font-family:"Montserrat"; overflow:hidden; box-shadow:0 24px 50px rgba(0,0,0,0.5); background:repeating-linear-gradient(180deg, #fffdf6 0 63px, #cfe0f0 63px 65px); }
.rcpt::before { content:""; position:absolute; left:92px; top:0; bottom:0; width:3px; background:#f2a0ae; }
.rc-h { font:800 italic 30px "Montserrat"; letter-spacing:0.08em; color:var(--pinkd); padding-bottom:10px; margin-bottom:4px; }
.ln { position:relative; display:flex; justify-content:space-between; align-items:baseline; gap:20px; padding:12px 0; }
.ln .tick { position:absolute; left:-70px; top:10px; font:900 38px "Montserrat"; font-style:normal; color:var(--green); }
.ln span { font:700 32px/1.2 "Montserrat"; color:var(--slate); }
.ln span small { display:block; font:500 22px "Montserrat"; color:rgba(35,38,45,0.55); margin-top:2px; }
.ln b { position:relative; font:900 34px "Montserrat"; color:var(--slate); white-space:nowrap; }
.ln.tot { margin-top:10px; padding-top:18px; }
.ln.tot span { font:900 30px "Montserrat"; letter-spacing:0.12em; }
.ln.tot b { font:900 48px "Montserrat"; color:var(--pinkd); }
.circ { position:absolute; right:-50px; top:-30px; }
.rc-f { margin-top:12px; font:500 22px "Montserrat"; color:rgba(35,38,45,0.55); }
.stamp { position:absolute; right:40px; top:470px; z-index:9; padding:8px 18px; border:5px solid var(--pinkd); border-radius:12px; color:var(--pinkd); font:900 28px "Montserrat"; letter-spacing:0.06em; background:rgba(255,255,255,0.88); }
/* Travel outro: passport page with visit stamps. */
.pass { position:absolute; left:80px; top:230px; width:920px; height:1110px; z-index:7; border-radius:28px; padding:40px 48px; background:linear-gradient(180deg, #f8f1e2 0%, #efe4cc 100%); box-shadow:0 30px 70px rgba(0,0,0,0.55); overflow:hidden; }
.pass::before { content:""; position:absolute; inset:0; background:repeating-linear-gradient(45deg, rgba(184,51,106,0.04) 0 2px, rgba(0,0,0,0) 2px 14px); }
.pass-h { position:relative; display:flex; justify-content:space-between; font:800 24px "Montserrat"; letter-spacing:0.22em; color:rgba(35,38,45,0.55); padding-bottom:14px; border-bottom:3px solid rgba(35,38,45,0.15); }
.pass-t { position:relative; margin-top:26px; font:900 96px/1.05 "Playfair Display"; color:var(--slate); }
.pass-grid { position:relative; margin-top:34px; display:grid; grid-template-columns:1fr 1fr; gap:26px 30px; }
.vst { height:150px; border:6px solid; border-radius:16px; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; padding:0 10px; background:rgba(255,255,255,0.35); }
.vst.round { border-radius:999px; }
.vst small { font:800 20px "Montserrat"; letter-spacing:0.18em; opacity:0.8; }
.vst b { margin-top:6px; font:900 34px/1.1 "Montserrat"; }
/* Food intro: chalkboard; food outro: woven tray. */
.board { position:absolute; inset:0; background:linear-gradient(180deg, #24443a 0%, #1a332b 60%, #122520 100%); border:26px solid #6e4a2a; }
.board.warm { background:linear-gradient(180deg, #3a2a20 0%, #2a1e17 100%); border:none; }
.menu-in { position:absolute; inset:140px 80px; z-index:2; }
.menu-k { text-align:center; font:700 30px "Montserrat"; letter-spacing:0.3em; color:var(--mustard); }
.menu-t { margin-top:20px; text-align:center; font:900 108px/1.05 "Playfair Display"; color:#fff; }
.menu-t .w { display:inline-block; }
.menu-t.outro { position:absolute; left:0; right:0; top:140px; z-index:3; padding:0 80px; }
.menu-list { list-style:none; margin-top:60px; display:flex; flex-direction:column; gap:30px; }
.menu-list li { display:flex; align-items:center; gap:30px; padding:10px 18px; }
.menu-list img { width:130px; height:130px; border-radius:50%; object-fit:cover; border:5px solid rgba(255,255,255,0.85); }
.menu-list span { position:relative; flex:1; }
.menu-list b { display:block; font:800 50px "Montserrat"; color:#fff; white-space:nowrap; }
.menu-list small { display:block; margin-top:6px; font:600 26px "Montserrat"; color:rgba(255,255,255,0.7); }
.chalk { position:absolute; left:0; bottom:-12px; width:72%; height:5px; border-radius:3px; background:rgba(255,255,255,0.75); transform-origin:0 50%; }
.ring { position:absolute; left:60px; top:455px; z-index:3; }
.menu-pill { top:1370px; background:var(--mustard); }
.tray-wrap { position:absolute; left:540px; top:910px; width:0; height:0; z-index:2; }
.tray { position:absolute; left:-400px; top:-400px; width:800px; height:800px; border-radius:50%; background:repeating-linear-gradient(45deg, #b8874c 0 14px, #a87a42 14px 28px); border:22px solid #7d5530; box-shadow:0 30px 60px rgba(0,0,0,0.5), inset 0 0 0 10px rgba(255,255,255,0.08); }
.wd { position:absolute; width:240px; height:240px; }
.wd img { width:240px; height:240px; border-radius:50%; object-fit:cover; border:8px solid #fffaf3; box-shadow:0 14px 34px rgba(0,0,0,0.5); }
.wd span { position:absolute; left:50%; bottom:-30px; transform:translateX(-50%); padding:6px 16px; border-radius:999px; background:#fffaf3; color:var(--slate); font:800 26px "Montserrat"; white-space:nowrap; }
.brand { position:absolute; left:60px; top:60px; z-index:21; font:800 26px "Montserrat"; letter-spacing:0.3em; color:rgba(248,246,242,0.85); text-shadow:0 2px 10px rgba(0,0,0,0.5); }
.brand b { color:var(--pink); letter-spacing:0; margin-right:12px; }
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
  bgColor: "#14161b",
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
