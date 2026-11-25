#!/usr/bin/env node
/**
 * node hf/build-dla.mjs --slug da-lat-am-thuc
 *
 * Turns data/videos/<slug>/video.json + voiceover.json into a HyperFrames project at build/<slug>/.
 * The look ("Đà Lạt ăn gì", 20/11/2026), new for this channel (checked against D:/Thang_space_archive/STYLE-LOG.md):
 *   - cold open: two viral Đà Lạt clips with their own original sound, no music or SFX on top (user request
 *     20/11/2026); then a diary page writes "Đà Lạt ăn gì" by hand, and the voice starts;
 *   - pictures change through a halftone of dots that grow until they join, or a punch-in zoom from blur;
 *   - wisps of steam rise over everything;
 *   - each dish gets a table-number stand (Món 1/6 + time of day);
 *   - the facts are a sticky note, the restaurants an order pad ("PHIẾU GỌI MÓN") with the Google Maps proof;
 *   - between dishes: the dish just covered comes back as 3–4 polaroids dealt onto the table, stamped "ĐÃ ĂN"
 *     (user request 20/11/2026: a short photo list of the place before the next one);
 *   - outro: three tips, then a lazy-susan tray turns with the six dishes, then "Lưu lại nhé!";
 *   - shader seams: chromatic-radial-split, chromatic-split, cinematic-zoom, cross-warp-morph, domain-warp-dissolve.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fail, parseArgs, requireSlug } from "../scripts/lib/args.mjs";
import { probeDurationSec } from "../scripts/lib/media.mjs";
import { PROJECT_ROOT, PUBLIC_ROOT } from "../scripts/lib/paths.mjs";

const { flags } = parseArgs(process.argv.slice(2));
const slug = requireSlug(flags, "build-dla");
const dataDir = path.join(PROJECT_ROOT, "data", "videos", slug);
const video = JSON.parse(readFileSync(path.join(dataDir, "video.json"), "utf8"));
const credits = JSON.parse(readFileSync(path.join(dataDir, "credits.json"), "utf8"));
const voicePath = path.join(dataDir, "voiceover.json");
if (!existsSync(voicePath)) fail(`No voiceover.json for ${slug}; make the voice first.`);
const voice = JSON.parse(readFileSync(voicePath, "utf8")).clips;

const W = 1080;
const H = 1920;
const LEAD = video.transitionFrames / video.format.fps;
const SEAM = 0.75;
const CLEAR = 3; // seconds a clip shows uncovered before the first card
const r2 = (n) => Math.round(n * 1000) / 1000;

const out = path.join(PROJECT_ROOT, "build", slug);
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
const dishScenes = scenes.filter((s) => s.layout === "dish");

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
const COLD_END = scenes[0].start + (scenes[0].cold?.length ? 9.2 : 0);
const sound = (name, at, volume) => {
  const file = path.join(PUBLIC_ROOT, "shared", "sfx", `${name}.mp3`);
  const dur = r2(probeDurationSec(file));
  if (at < COLD_END || at + 0.05 > total) return; // nothing on top of the cold open's original sound
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
 * Footage stack. Odd changes: a halftone of dots grows over the frame until the dots join. Even changes: the new
 * clip punches in from a blurred close-up.
 */
const photos = (s, from, to, idPrefix) => {
  const g = s.gallery ?? [];
  const seg = (to - from) / g.length;
  const parts = [];
  g.forEach((src, k) => {
    const id = `${idPrefix}-p${k}`;
    const a = r2(from + seg * k);
    tw(`tl.fromTo("#${id} video", {scale:1.02}, {scale:1.12, duration:${r2(seg + 0.8)}, ease:"none"}, ${a});`);
    const inner = media(src, id, a - 0.9, seg + 1.8) + creditTag(src);
    if (k === 0) return parts.push(`<div id="${id}" class="ph">${inner}</div>`);
    if (k % 2 === 1) {
      tw(`tl.set("#${id}", {"--d":"0px"}, 0);`);
      tw(`tl.fromTo("#${id}", {"--d":"0px"}, {"--d":"72px", duration:0.75, ease:"power2.in", immediateRender:false}, ${r2(a - 0.4)});`);
      tw(`tl.set("#${idPrefix}-p${k - 1}", {opacity:0}, ${r2(a + 0.4)});`);
      sound("whoosh-short", r2(a - 0.4), 0.05);
      return parts.push(`<div id="${id}" class="ph dots-in">${inner}</div>`);
    }
    tw(`tl.set("#${id}", {opacity:0}, 0);`);
    tw(`tl.set("#${id}", {opacity:1}, ${r2(a)});`);
    tw(`tl.fromTo("#${id}", {scale:1.5, filter:"blur(18px)"}, {scale:1, filter:"blur(0px)", duration:0.45, ease:"expo.out", immediateRender:false}, ${r2(a)});`);
    tw(`tl.set("#${idPrefix}-p${k - 1}", {opacity:0}, ${r2(a + 0.3)});`);
    sound("whoosh-cinematic", r2(a - 0.15), 0.05);
    parts.push(`<div id="${id}" class="ph">${inner}</div>`);
  });
  return parts.join("");
};

const titleIn = (sel, at) =>
  tw(`tl.fromTo("${sel} .w", {opacity:0, y:30, filter:"blur(10px)"}, {opacity:1, y:0, filter:"blur(0px)", duration:0.6, stagger:0.08, ease:"power3.out"}, ${r2(at)});`);
const fadeUp = (sel, at, dur = 0.35) =>
  tw(`tl.fromTo("${sel}", {opacity:0, y:26}, {opacity:1, y:0, duration:${dur}, ease:"expo.out"}, ${r2(at)});`);
const hideOut = (sel, at) => tw(`tl.to("${sel}", {opacity:0, y:30, duration:0.4, ease:"power2.in"}, ${r2(at)});`);

const row = (p) => `<div class="row"><b>${esc(p.place)}</b><span>${esc(p.address)}</span><em>${star(p.rating)}</em></div>`;

// Google Maps screenshots (name + stars + review count), captured 20/11/2026 into public/videos/da-lat/maps.
const MAPS = video.maps ?? {};
const MAPS_DATE = "chụp 20/11/2026";

/** A Google Maps panel above the order pad: one screenshot per listed place, sliding in while its row lights up. */
const proofs = (id, rowsSel, places, from, to, hide) => {
  const list = places.map((p, k) => [MAPS[p.place], k]).filter(([m]) => m);
  if (!list.length) return "";
  tw(`tl.to("#${id}", {opacity:0, y:30, duration:0.4, ease:"power2.in"}, ${r2(hide - 0.1)});`);
  const slot = Math.min(0.9, Math.max(0.5, (to - from - 1) / list.length));
  tw(`tl.fromTo("#${id}", {opacity:0, y:40, scale:0.92}, {opacity:1, y:0, scale:1, duration:0.4, ease:"back.out(1.5)"}, ${r2(from + 0.25)});`);
  list.forEach(([, k], i) => {
    const t0 = from + 0.45 + i * slot;
    tw(`tl.fromTo("#${id}-${k}", {opacity:0, x:60}, {opacity:1, x:0, duration:0.35, ease:"power3.out"}, ${r2(t0)});`);
    tw(`tl.fromTo(document.querySelectorAll("${rowsSel}")[${k}], {backgroundColor:"rgba(255,138,61,0)"}, {backgroundColor:"rgba(255,138,61,0.3)", duration:0.25, yoyo:true, repeat:1, repeatDelay:${r2(Math.max(slot - 0.5, 0.2))}}, ${r2(t0)});`);
  });
  return `<div id="${id}" class="gmaps" style="opacity:0"><div class="gmaps-h"><i>📍</i>Google Maps<span>${MAPS_DATE}</span></div>${list.map(([m, k]) => `<img id="${id}-${k}" src="${asset(`videos/da-lat/maps/${m}.png`)}" alt="" />`).join("")}</div>`;
};

// ---- cold open + diary title -------------------------------------------------
const COLD_AUDIO = [];
const coldOpen = (s, sid) => {
  const cold = s.cold ?? [];
  const len = 4.6;
  const parts = [];
  cold.forEach((src, k) => {
    const id = `${sid}-k${k}`;
    const from = r2(k * len);
    parts.push(`<div id="${id}" class="ph"${k ? ' style="opacity:0"' : ""}>${media(src, id, from, len + 0.3)}${creditTag(src)}</div>`);
    if (k) tw(`tl.set("#${id}", {opacity:1}, ${from});`);
    tw(`tl.set("#${id}", {opacity:0}, ${r2(from + len + 0.02)});`);
    tw(`tl.fromTo("#${id} video", {scale:1.12}, {scale:1.02, duration:${len}, ease:"none"}, ${from});`);
    const a = s.coldAudio?.[k];
    if (a) COLD_AUDIO.push(`<audio id="cold-a${k}" src="${asset(a)}" data-start="${from}" data-duration="${len}" data-volume="1" data-fade-in="${k ? 0.05 : 0.3}" data-fade-out="${k ? 0.6 : 0.08}" data-track-index="3"></audio>`);
  });
  const g = s.gallery ?? [];
  const after = r2(cold.length * len);
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

// ---- between dishes: polaroids of the dish just eaten -------------------------
const CARD_AT = [[96, 470, -5], [572, 500, 4], [110, 1080, 3], [586, 1050, -4]];
const recap = (s, sid, from) => {
  const list = s.recap;
  const at = list.length === 3 ? [CARD_AT[0], CARD_AT[1], [340, 1070, -2]] : CARD_AT;
  tw(`tl.fromTo("#${sid}-rc", {opacity:0}, {opacity:1, duration:0.3, ease:"power1.out"}, ${r2(from)});`);
  fadeUp(`#${sid}-rc-h`, from + 0.1);
  const cards = list.map((name, k) => {
    const [x, y, rot] = at[k];
    const t0 = from + 0.3 + k * 0.45;
    tw(`tl.fromTo("#${sid}-rc${k}", {opacity:0, y:-260, rotation:${rot * 4}, scale:1.25}, {opacity:1, y:0, rotation:${rot}, scale:1, duration:0.42, ease:"back.out(1.3)"}, ${r2(t0)});`);
    sound("pop", r2(t0 + 0.3), 0.05);
    const who = handle(`videos/da-lat/footage/${name}.mp4`);
    return `<div id="${sid}-rc${k}" class="pola" style="left:${x}px;top:${y}px;opacity:0"><img src="${asset(`videos/da-lat/recap/${name}.jpg`)}" alt="" /><span>${esc(who)}</span></div>`;
  }).join("");
  const stampAt = from + 0.3 + list.length * 0.45 + 0.15;
  tw(`tl.fromTo("#${sid}-stamp", {opacity:0, scale:2.2}, {opacity:1, scale:1, duration:0.25, ease:"power4.in"}, ${r2(stampAt)});`);
  sound("impact-bass-1", r2(stampAt + 0.2), 0.06);
  return `<div id="${sid}-rc" class="recap" style="opacity:0"><div id="${sid}-rc-h" class="recap-h"><small>MÓN ${s.n}/${dishScenes.length} · ${esc(s.time)}</small><b>${esc(s.caption)}</b></div>${cards}<div id="${sid}-stamp" class="stamp" style="opacity:0">ĐÃ ĂN ✓</div></div>`;
};

// ---- steam ------------------------------------------------------------------------
const steam = [];
for (let k = 0; k < 8; k++) {
  const x0 = 60 + ((k * 211) % 900);
  steam.push(`<i id="st${k}" class="steam" style="left:${x0}px;top:1500px" data-layout-ignore></i>`);
  const rise = 5 + (k % 3) * 1.4;
  for (let at = (k * 1.1) % 5, n = 0; at < total; at += rise, n++) {
    const sway = r2(Math.sin(k + n * 1.7) * 80);
    tw(`tl.fromTo("#st${k}", {x:0, y:0, scale:0.6}, {x:${sway}, y:-900, scale:1.6, duration:${r2(rise)}, ease:"sine.out", immediateRender:${n === 0}}, ${r2(at)});`);
    tw(`tl.fromTo("#st${k}", {opacity:0}, {opacity:0.3, duration:${r2(rise * 0.35)}, ease:"none", immediateRender:${n === 0}}, ${r2(at)});`);
    tw(`tl.to("#st${k}", {opacity:0, duration:${r2(rise * 0.65)}, ease:"none"}, ${r2(at + rise * 0.35)});`);
  }
}

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
    // Diary page: the title is written in by hand, letter by letter, then underlined.
    const letters = [...s.caption].map((c, k) => `<span id="${sid}-l${k}" style="opacity:0">${c === " " ? "&nbsp;" : esc(c)}</span>`).join("");
    parts.push(`<div id="${sid}-diary" class="diary" style="opacity:0"><small>${esc(s.kicker)}</small><h1>${letters}</h1><svg viewBox="0 0 700 40"><path id="${sid}-ul" d="M10 26 C 180 6, 420 40, 690 14" /></svg><span class="diary-date">20 · 11 · 2026</span></div>`);
    tw(`tl.fromTo("#${sid}-diary", {opacity:0, y:120, rotation:6}, {opacity:1, y:0, rotation:-3, duration:0.6, ease:"back.out(1.4)"}, ${r2(m.after)});`);
    [...s.caption].forEach((_, k) => tw(`tl.fromTo("#${sid}-l${k}", {opacity:0, y:12}, {opacity:1, y:0, duration:0.12, ease:"power1.out", immediateRender:false}, ${r2(m.after + 0.5 + k * 0.07)});`));
    tw(`tl.fromTo("#${sid}-ul", {strokeDashoffset:760}, {strokeDashoffset:0, duration:0.5, ease:"power2.inOut"}, ${r2(m.after + 0.6 + s.caption.length * 0.07)});`);
    sound("sparkle", r2(m.after + 0.5), 0.08);
    const lift = s.vo + 3.0;
    tw(`tl.to("#${sid}-diary", {opacity:0, y:-80, rotation:4, duration:0.6, ease:"power2.in"}, ${r2(lift)});`);
    tw(`tl.to("#${sid}-dim", {opacity:0.35, duration:0.6}, ${r2(lift)});`);
  } else if (s.layout === "dish") {
    const bodyEnd = s.end - (s.recapSec ?? 0);
    parts.push(photos(s, a, bodyEnd, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div class="floor"></div>`);
    // Table-number stand: "MÓN n/6" and the time of day.
    parts.push(`<div id="${sid}-stand" class="stand" style="opacity:0"><small>MÓN</small><b>${s.n}<i>/${dishScenes.length}</i></b><span>${esc(s.time)}</span></div>`);
    tw(`tl.fromTo("#${sid}-stand", {opacity:0, y:-80, rotation:12}, {opacity:1, y:0, rotation:3, duration:0.5, ease:"back.out(2)"}, ${r2(enter + 0.4)});`);
    sound("pop", r2(enter + 0.5), 0.05);
    parts.push(`<div class="head"><div id="${sid}-kicker" class="kicker">${esc(s.tag.toUpperCase())}</div><h1 id="${sid}-title" class="title">${words(s.caption)}</h1></div>`);
    fadeUp(`#${sid}-kicker`, enter, 0.25);
    titleIn(`#${sid}-title`, enter + 0.2);
    // Sticky note with the facts.
    parts.push(`<div id="${sid}-note" class="sticky" style="opacity:0">${(s.facts ?? []).map((f, k) => `<p id="${sid}-fx${k}">• ${esc(f)}</p>`).join("")}</div>`);
    tw(`tl.fromTo("#${sid}-note", {opacity:0, rotation:-14, scale:0.7}, {opacity:1, rotation:-4, scale:1, duration:0.45, ease:"back.out(1.8)"}, ${r2(enter + 1.2)});`);
    tw(`tl.fromTo("#${sid}-note p", {opacity:0, x:-20}, {opacity:1, x:0, duration:0.3, stagger:0.5, ease:"power2.out"}, ${r2(enter + 1.5)});`);
    // Order pad with the restaurants, on the cue word; the note and the pad clear away before the scene ends.
    const places = s.places ?? [];
    const named = cueTime(s, s.cue) ?? a + (s.end - a) * 0.55;
    const cue = Math.max(Math.min(named, bodyEnd - 3.0 - places.length * 0.9 - 0.45), enter + CLEAR);
    tw(`tl.to("#${sid}-note", {opacity:0, y:-30, duration:0.3}, ${r2(cue - 0.4)});`);
    parts.push(`<div id="${sid}-pad" class="pad" style="opacity:0"><div class="pad-h">PHIẾU GỌI MÓN<span>quán ≥4.5★</span></div>${places.map((p) => row(p)).join("")}</div>`);
    tw(`tl.fromTo("#${sid}-pad", {opacity:0, y:80}, {opacity:1, y:0, duration:0.5, ease:"expo.out"}, ${r2(cue - 0.1)});`);
    tw(`tl.fromTo("#${sid}-pad .row", {opacity:0, x:-40}, {opacity:1, x:0, duration:0.3, stagger:0.09, ease:"power3.out"}, ${r2(cue + 0.15)});`);
    const shown = cue + 0.45 + places.length * 0.9;
    const hide = Math.max(Math.min(shown + 1.6, bodyEnd - 1.2), shown + 0.8);
    tw(`tl.to("#${sid}-pad", {opacity:0, y:30, duration:0.4, ease:"power2.in"}, ${r2(hide)});`);
    parts.push(proofs(`${sid}-gm`, `#${sid}-pad .row`, places, cue, bodyEnd, hide));
    if (s.recap?.length) parts.push(recap(s, sid, bodyEnd));
  } else {
    // Outro: three tips, then a lazy-susan tray carrying the six dishes turns once, then the call to action.
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div id="${sid}-dim" class="hook-dim" style="opacity:0"></div>`);
    tw(`tl.to("#${sid}-dim", {opacity:1, duration:0.6}, ${r2(enter)});`);
    parts.push(`<div id="${sid}-kicker" class="tips-h" style="opacity:0">${esc(s.kicker ?? "")}</div>`);
    fadeUp(`#${sid}-kicker`, enter + 0.4);
    const tipAt = (k) => cueTime(s, s.tipCues?.[k]) ?? enter + 1.2 + k * 2.2;
    (s.tips ?? []).forEach((tip, k) => {
      parts.push(`<div id="${sid}-tip${k}" class="tip" style="opacity:0;top:${600 + k * 120}px"><i id="${sid}-tick${k}">✓</i>${esc(tip)}</div>`);
      tw(`tl.fromTo("#${sid}-tip${k}", {opacity:0, x:-40}, {opacity:1, x:0, duration:0.4, ease:"power3.out"}, ${r2(tipAt(k))});`);
      tw(`tl.fromTo("#${sid}-tick${k}", {scale:0}, {scale:1, duration:0.3, ease:"back.out(3)"}, ${r2(tipAt(k) + 0.25)});`);
      sound("pop", r2(tipAt(k) + 0.25), 0.06);
    });
    const trayAt = s.end - 5.2;
    tw(`tl.to(["#${sid}-kicker", ${(s.tips ?? []).map((_, k) => `"#${sid}-tip${k}"`).join(", ")}], {opacity:0, y:-30, duration:0.35}, ${r2(trayAt - 0.4)});`);
    parts.push(`<h1 id="${sid}-title" class="out-title">${words(s.caption)}</h1>`);
    titleIn(`#${sid}-title`, trayAt - 0.2);
    const items = dishScenes.map((x, k) => {
      const ang = (k / dishScenes.length) * Math.PI * 2;
      const x0 = r2(300 + Math.cos(ang) * 210 - 95), y0 = r2(300 + Math.sin(ang) * 210 - 40);
      return `<i class="tray-it" style="left:${x0}px;top:${y0}px"><b>${x.n}</b>${esc(x.caption)}</i>`;
    }).join("");
    parts.push(`<div id="${sid}-tray" class="tray" style="opacity:0"><div id="${sid}-spin" class="tray-spin">${items}<i class="tray-mid">ĐÀ LẠT</i></div></div>`);
    tw(`tl.fromTo("#${sid}-tray", {opacity:0, scale:0.6}, {opacity:1, scale:1, duration:0.5, ease:"back.out(1.6)"}, ${r2(trayAt + 0.3)});`);
    tw(`tl.fromTo("#${sid}-spin", {rotation:-120}, {rotation:0, duration:2.4, ease:"power3.out"}, ${r2(trayAt + 0.3)});`);
    tw(`tl.fromTo("#${sid}-spin .tray-it", {rotation:120}, {rotation:0, duration:2.4, ease:"power3.out"}, ${r2(trayAt + 0.3)});`);
    sound("whoosh-cinematic", r2(trayAt + 0.3), 0.06);
    const ctaAt = trayAt + 2.9;
    parts.push(`<div id="${sid}-cta" class="pill cta" style="opacity:0">Lưu lại nhé!</div>`);
    tw(`tl.fromTo("#${sid}-cta", {opacity:0, scale:0.5}, {opacity:1, scale:1, duration:0.4, ease:"back.out(2.4)"}, ${r2(ctaAt)});`);
    sound("impact-bass-1", r2(ctaAt), 0.09);
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
    const st = s.vo + line[0].startMs / 1000;
    const en = Math.min(s.end, s.vo + (nextStartMs ?? line.at(-1).endMs + 400) / 1000);
    const id = `cap-${s.id}-${caps.length}`;
    const spans = line.map((w, k) => `<span id="${id}-${k}">${esc(w.text.trim())}</span>`).join(" ");
    caps.push(`<div id="${id}" class="cap clip" data-start="${r2(st)}" data-duration="${r2(Math.max(0.3, en - st))}" data-track-index="9">${spans}</div>`);
    line.forEach((w, k) => tw(`tl.set("#${id}-${k}", {color:"${video.theme.highlight}"}, ${r2(s.vo + w.startMs / 1000)});`));
    line = [];
  };
  ws.forEach((w, k) => {
    const len = line.map((x) => x.text.trim()).join(" ").length + w.text.trim().length;
    if (line.length && (len > 30 || /[.,!?]$/.test(line.at(-1).text.trim()))) flush(w.startMs);
    line.push(w);
    if (k === ws.length - 1) flush(null);
  });
}

// ---- audio --------------------------------------------------------------
const mediaTags = [...COLD_AUDIO];
for (const s of scenes) {
  if (!s.clip) continue;
  mediaTags.push(`<audio id="vo-${s.id}" src="${asset(s.clip.file)}" data-start="${r2(s.vo)}" data-duration="${r2(s.clip.durationSec)}" data-volume="1" data-track-index="2"></audio>`);
}
// The music bed starts when the cold open's own sound ends (with the diary page), then loops to the end.
const musicSrc = asset(video.music.src);
const musicLen = probeDurationSec(path.join(PUBLIC_ROOT, video.music.src));
for (let at = r2(COLD_END), off = 0, k = 0; at < total - 0.05; k++) {
  const dur = r2(Math.min(musicLen - off, total - at));
  const last = at + dur >= total - 0.01;
  mediaTags.push(`<audio id="music-${k}" src="${musicSrc}" data-start="${r2(at)}" data-media-start="${r2(off)}" data-duration="${dur}" data-volume="0.2" data-fade-in="${k ? 1 : 0.6}" data-fade-out="${last ? 1.5 : 1}" data-track-index="${k % 2 ? 31 : 30}"></audio>`);
  if (last) break;
  at = r2(at + dur - 1);
  off = 0;
}

// ---- shader seams + quiet whooshes -----------------------------------
const SHADERS = ["cross-warp-morph", "chromatic-split", "cinematic-zoom", "domain-warp-dissolve", "chromatic-radial-split"];
const transitions = scenes.slice(1).map((s, k) => ({ time: r2(s.start - SEAM / 2), shader: SHADERS[k % SHADERS.length], duration: SEAM }));
for (const tr of transitions) sound("whoosh-short", r2(tr.time - 0.1), 0.14);

// Be Vietnam Pro + Patrick Hand (Vietnamese subsets) are not auto-resolved by the renderer: ship the woff2 files.
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
:root { --ground:#2a1a12; --ink:#fff4e3; --orange:#ff8a3d; --butter:#ffe08a; --coffee:#4a2c1c; --paper:#fffaf0; --note:#ffe86b; --red:#d8432f; }
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:${W}px; height:${H}px; overflow:hidden; background:var(--ground); }
#root { position:relative; width:${W}px; height:${H}px; overflow:hidden; font-family:"Be Vietnam Pro"; }
.scene { position:absolute; inset:0; overflow:hidden; background:var(--ground); z-index:1; }
.ph { position:absolute; inset:0; overflow:hidden; }
.ph video { width:100%; height:100%; object-fit:cover; display:block; }
/* Halftone reveal: a grid of dots that grow until they join. */
.dots-in { --d:0px; -webkit-mask-image:radial-gradient(circle, #000 var(--d), transparent calc(var(--d) + 1px)); mask-image:radial-gradient(circle, #000 var(--d), transparent calc(var(--d) + 1px)); -webkit-mask-size:100px 100px; mask-size:100px 100px; }
.cr { position:absolute; left:60px; top:112px; z-index:4; font:600 22px "Be Vietnam Pro"; color:rgba(255,244,227,0.85); text-shadow:0 2px 8px rgba(0,0,0,0.7); }
.shade { position:absolute; inset:0; background:linear-gradient(180deg, rgba(30,16,8,0.2) 0%, rgba(30,16,8,0) 35%, rgba(30,16,8,0) 65%, rgba(30,16,8,0.35) 100%); }
.top { position:absolute; left:0; right:0; top:0; height:720px; background:linear-gradient(180deg, rgba(36,20,10,0.85) 0%, rgba(36,20,10,0.5) 55%, rgba(36,20,10,0) 100%); }
.floor { position:absolute; left:0; right:0; bottom:0; height:900px; background:linear-gradient(180deg, rgba(36,20,10,0) 0%, rgba(36,20,10,0.6) 45%, rgba(36,20,10,0.93) 100%); }
.hook-dim { position:absolute; inset:0; z-index:4; background:linear-gradient(180deg, rgba(36,20,10,0.35) 0%, rgba(36,20,10,0.05) 45%, rgba(36,20,10,0.8) 100%); }
.steam { position:absolute; z-index:16; width:160px; height:220px; border-radius:50%; background:radial-gradient(ellipse at 50% 60%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.25) 45%, rgba(255,255,255,0) 70%); filter:blur(14px); opacity:0; pointer-events:none; }
/* Diary page title. */
.diary { position:absolute; left:90px; top:980px; width:900px; z-index:8; padding:46px 56px 40px 90px; border-radius:10px; background:repeating-linear-gradient(180deg, var(--paper) 0 62px, #c9dcef 62px 64px); box-shadow:0 26px 60px rgba(0,0,0,0.55); }
.diary::before { content:""; position:absolute; left:58px; top:0; bottom:0; width:3px; background:#e58a8a; }
.diary small { font:800 26px "Be Vietnam Pro"; color:var(--red); letter-spacing:0.14em; }
.diary h1 { font:400 132px/1.05 "Patrick Hand"; color:#1f2a55; margin-top:6px; white-space:nowrap; }
.diary h1 span { display:inline-block; }
.diary svg { width:700px; height:40px; margin-top:-8px; overflow:visible; }
.diary path { fill:none; stroke:var(--orange); stroke-width:8; stroke-linecap:round; stroke-dasharray:760; stroke-dashoffset:760; }
.diary-date { position:absolute; right:40px; top:40px; font:400 34px "Patrick Hand"; color:#1f2a55; }
.title .w, .out-title .w { display:inline-block; }
.pill { position:absolute; left:50%; top:1370px; transform:translateX(-50%); font:900 44px "Be Vietnam Pro"; color:var(--coffee); background:var(--butter); padding:12px 40px; border-radius:999px; white-space:nowrap; z-index:8; }
/* Table-number stand. */
.stand { position:absolute; right:64px; top:150px; z-index:6; width:190px; padding:16px 0 18px; border-radius:18px 18px 8px 8px; background:linear-gradient(180deg, #fff4e3, #f2dfc2); text-align:center; box-shadow:0 14px 26px rgba(0,0,0,0.5); border-bottom:14px solid var(--coffee); }
.stand small { display:block; font:900 22px "Be Vietnam Pro"; color:var(--red); letter-spacing:0.2em; }
.stand b { display:block; font:900 86px/1 "Playfair Display"; color:var(--coffee); }
.stand b i { font:800 30px "Be Vietnam Pro"; font-style:normal; color:rgba(74,44,28,0.6); }
.stand span { display:block; font:800 26px "Be Vietnam Pro"; color:var(--orange); }
.head { position:absolute; left:80px; top:330px; width:680px; display:flex; flex-direction:column; gap:10px; z-index:5; }
.kicker { font:900 30px "Be Vietnam Pro"; color:var(--butter); letter-spacing:0.12em; }
.title { margin-bottom:10px; font:800 100px/1.04 "Playfair Display"; color:var(--ink); text-shadow:0 6px 30px rgba(0,0,0,0.55); }
/* Sticky note with the facts. */
.sticky { position:absolute; left:80px; top:1060px; width:640px; z-index:7; padding:30px 34px 26px; background:var(--note); box-shadow:0 18px 30px rgba(0,0,0,0.45); border-radius:4px 4px 30px 4px; }
.sticky::before { content:""; position:absolute; left:250px; top:-18px; width:140px; height:38px; background:rgba(255,255,255,0.55); transform:rotate(-3deg); }
.sticky p { font:400 42px/1.3 "Patrick Hand"; color:#3a2a10; }
/* Order pad with the restaurants. */
.pad { position:absolute; left:60px; width:960px; top:1110px; z-index:7; padding:0 34px 16px; border-radius:14px; background:var(--paper); box-shadow:0 18px 40px rgba(0,0,0,0.45); overflow:hidden; }
.pad-h { margin:0 -34px 10px; padding:16px 34px; background:var(--red); color:#fff; font:900 28px "Be Vietnam Pro"; letter-spacing:0.12em; display:flex; justify-content:space-between; }
.pad-h span { font:700 22px "Be Vietnam Pro"; letter-spacing:0; opacity:0.9; }
.row { display:flex; align-items:baseline; gap:16px; padding:10px 6px; border-bottom:2px solid #c9dcef; border-radius:8px; }
.row b { font:800 32px "Be Vietnam Pro"; color:var(--coffee); white-space:nowrap; }
.row span { font:500 25px "Be Vietnam Pro"; color:rgba(74,44,28,0.6); flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.row em { font:800 26px "Be Vietnam Pro"; font-style:normal; color:var(--coffee); background:var(--butter); padding:4px 14px; border-radius:999px; white-space:nowrap; }
.gmaps { position:absolute; left:400px; width:620px; bottom:830px; border-radius:22px; overflow:hidden; background:#fff; box-shadow:0 16px 40px rgba(0,0,0,0.5); z-index:8; }
.gmaps-h { display:flex; align-items:center; gap:10px; padding:12px 22px; background:#f1f3f4; font:700 24px "Be Vietnam Pro"; color:#3c4043; }
.gmaps-h i { font-style:normal; }
.gmaps-h span { margin-left:auto; font:500 20px "Be Vietnam Pro"; color:#70757a; }
.gmaps img { display:block; width:100%; border-top:1px solid #e8eaed; }
/* Between dishes: polaroids on the table. */
.recap { position:absolute; inset:0; z-index:9; background:radial-gradient(ellipse at 50% 45%, #5a3826 0%, #3a2416 55%, #24150c 100%); }
.recap-h { position:absolute; left:90px; right:90px; top:200px; text-align:center; }
.recap-h small { display:block; font:900 28px "Be Vietnam Pro"; color:var(--butter); letter-spacing:0.16em; }
.recap-h b { display:block; margin-top:6px; font:400 104px/1.05 "Patrick Hand"; color:var(--ink); }
.pola { position:absolute; width:412px; padding:16px 16px 0; background:var(--paper); border-radius:6px; box-shadow:0 18px 34px rgba(0,0,0,0.55); }
.pola img { display:block; width:380px; height:500px; object-fit:cover; }
.pola span { display:block; height:62px; font:400 32px/62px "Patrick Hand"; color:#3a2a10; text-align:center; white-space:nowrap; overflow:hidden; }
.stamp { position:absolute; left:50%; top:930px; margin-left:-230px; width:460px; transform-origin:50% 50%; text-align:center; font:900 76px/1 "Be Vietnam Pro"; color:var(--red); border:9px solid var(--red); border-radius:18px; padding:16px 0; transform:rotate(-12deg); background:rgba(255,250,240,0.82); z-index:2; }
/* Outro. */
.tips-h { position:absolute; left:90px; top:520px; z-index:7; font:900 32px "Be Vietnam Pro"; color:var(--butter); letter-spacing:0.12em; }
.tip { position:absolute; left:90px; z-index:7; font:800 48px/1.2 "Be Vietnam Pro"; color:var(--ink); text-shadow:0 4px 20px rgba(0,0,0,0.7); white-space:nowrap; }
.tip i { display:inline-block; width:62px; height:62px; margin-right:22px; border-radius:50%; background:var(--orange); color:#fff; font:900 40px/62px "Be Vietnam Pro"; font-style:normal; text-align:center; vertical-align:middle; }
.out-title { position:absolute; left:40px; right:40px; top:420px; text-align:center; z-index:7; font:900 116px/1.05 "Playfair Display"; color:var(--ink); text-shadow:0 10px 50px rgba(0,0,0,0.6); }
.tray { position:absolute; left:240px; top:700px; width:600px; height:600px; z-index:8; }
.tray-spin { position:absolute; inset:0; border-radius:50%; background:radial-gradient(circle, #8a5a3a 0 36%, #6b4128 37% 100%); box-shadow:0 26px 60px rgba(0,0,0,0.6), inset 0 0 0 14px #5a3420; }
.tray-it { position:absolute; width:190px; height:80px; border-radius:40px; background:var(--paper); color:var(--coffee); font:800 22px/1.1 "Be Vietnam Pro"; font-style:normal; display:flex; align-items:center; gap:8px; padding:0 14px; box-shadow:0 6px 12px rgba(0,0,0,0.4); }
.tray-it b { flex:none; width:38px; height:38px; border-radius:50%; background:var(--orange); color:#fff; font:900 22px/38px "Be Vietnam Pro"; text-align:center; }
.tray-mid { position:absolute; left:200px; top:250px; width:200px; height:100px; font:900 40px/100px "Playfair Display"; font-style:normal; color:var(--butter); text-align:center; }
.pill.cta { top:1360px; font-size:64px; padding:18px 56px; }
.brand { position:absolute; left:60px; top:60px; z-index:21; font:800 26px "Be Vietnam Pro"; letter-spacing:0.3em; color:rgba(255,244,227,0.9); text-shadow:0 2px 10px rgba(0,0,0,0.5); }
.brand b { color:var(--orange); letter-spacing:0; margin-right:12px; }
.cap { position:absolute; left:60px; right:60px; top:1500px; text-align:center; font:800 50px/1.25 "Be Vietnam Pro"; color:#ffffff; text-shadow:0 3px 0 rgba(0,0,0,0.55), 0 0 22px rgba(0,0,0,0.85); z-index:20; }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="${W}" data-height="${H}">
${mediaTags.join("\n")}
${sfx.join("\n")}
${html.join("\n")}
${steam.join("\n")}
<div class="brand" data-layout-ignore><b>✿</b>${esc(video.theme.brand)}</div>
${caps.join("\n")}
</div>
<script>
const tl = gsap.timeline({ paused: true });
${js.join("\n")}
HyperShader.init({
  bgColor: "#2a1a12",
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
console.log(`build/${slug}: ${scenes.length} scenes, ${total}s, ${caps.length} caption lines, ${sfx.length} sfx, ${assets.size} assets`);
