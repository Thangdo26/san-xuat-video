#!/usr/bin/env node
/**
 * node hf/build-tq.mjs --slug tq-tuyet-kieu-tu
 *
 * Turns data/videos/<slug>/video.json + voiceover.json into a HyperFrames project at build/<slug>/.
 * The look ("Tour ngắm tuyết Trung Quốc 6 triệu", 21/11/2026), new for this channel (checked against
 * D:/Thang_space_archive/STYLE-LOG.md):
 *   - cold open: a black screen with snow falling, a question typed letter by letter, then four beat-cut clips over the
 *     music (no voice); the title arrives on a frosted-glass card whose letters freeze in from a blur;
 *   - pictures change through a diagonal sweep of snow, or by "defrosting" (the new clip starts white and icy);
 *   - snowflakes drift down over everything;
 *   - each day gets an hourglass that flips over, with the day and a short note;
 *   - wordless breathers (user request 21/11/2026): after a stop's narration, a few seconds of its best clip with no
 *     voice and no text, the music brought up;
 *   - between two places, a 2x2 frosted window shows four pictures of the place just covered (user request 20/11/2026);
 *   - "Nói thật nè" and "Hay đi đâu?" are lists of frosted tags; "Giá bao nhiêu?" is a passport page stamped line by line;
 *   - outro: a snow globe with the question, shaken once, then "Lưu lại nhé!";
 *   - shader seams: light-leak, sdf-iris, chromatic-radial-split, thermal-distortion, domain-warp.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fail, parseArgs, requireSlug } from "../scripts/lib/args.mjs";
import { probeDurationSec } from "../scripts/lib/media.mjs";
import { PROJECT_ROOT, PUBLIC_ROOT } from "../scripts/lib/paths.mjs";

const { flags } = parseArgs(process.argv.slice(2));
const slug = requireSlug(flags, "build-tq");
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
// Sound effects sit a little louder than in earlier videos (user request 21/11/2026).
const SFX_GAIN = 1.6;
const sound = (name, at, vol) => {
  const volume = r2(Math.min(0.5, vol * SFX_GAIN));
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
 * Footage stack. Odd changes: a diagonal sweep of snow (a soft mask edge crosses the frame corner to corner). Even
 * changes: the new clip "defrosts", starting white and blurred and clearing.
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
      tw(`tl.set("#${id}", {"--p":"-30%"}, 0);`);
      tw(`tl.fromTo("#${id}", {"--p":"-30%"}, {"--p":"130%", duration:0.8, ease:"power2.inOut", immediateRender:false}, ${r2(a - 0.4)});`);
      tw(`tl.set("#${idPrefix}-p${k - 1}", {opacity:0}, ${r2(a + 0.45)});`);
      sound("whoosh-cinematic", r2(a - 0.4), 0.05);
      return parts.push(`<div id="${id}" class="ph sweep">${inner}</div>`);
    }
    tw(`tl.set("#${id}", {opacity:0}, 0);`);
    tw(`tl.set("#${id}", {opacity:1}, ${r2(a - 0.05)});`);
    tw(`tl.fromTo("#${id} video", {filter:"brightness(2.2) saturate(0.2) blur(14px)"}, {filter:"brightness(1) saturate(1) blur(0px)", duration:0.7, ease:"power2.out", immediateRender:false}, ${r2(a - 0.05)});`);
    tw(`tl.set("#${idPrefix}-p${k - 1}", {opacity:0}, ${r2(a + 0.05)});`);
    sound("sparkle", r2(a - 0.05), 0.04);
    parts.push(`<div id="${id}" class="ph">${inner}</div>`);
  });
  return parts.join("");
};

const titleIn = (sel, at) =>
  tw(`tl.fromTo("${sel} .w", {opacity:0, y:30, filter:"blur(10px)"}, {opacity:1, y:0, filter:"blur(0px)", duration:0.5, stagger:0.07, ease:"power3.out"}, ${r2(at)});`);
const fadeUp = (sel, at, dur = 0.35) =>
  tw(`tl.fromTo("${sel}", {opacity:0, y:26}, {opacity:1, y:0, duration:${dur}, ease:"expo.out"}, ${r2(at)});`);
const hideOut = (sel, at) => tw(`tl.to("${sel}", {opacity:0, y:30, duration:0.4, ease:"power2.in"}, ${r2(at)});`);

// ---- hourglass badge -------------------------------------------------------------
/** An hourglass drops in, flips over once, and a tag with the day and a short note slides out beside it. */
const sign = (sid, day, note, at) => {
  tw(`tl.fromTo("#${sid}-sign", {opacity:0, y:-80}, {opacity:1, y:0, duration:0.4, ease:"back.out(2)"}, ${r2(at)});`);
  tw(`tl.fromTo("#${sid}-glass", {rotation:0}, {rotation:180, duration:0.6, ease:"power3.inOut"}, ${r2(at + 0.45)});`);
  tw(`tl.fromTo("#${sid}-sign span", {opacity:0, x:-20}, {opacity:1, x:0, duration:0.3, ease:"power3.out"}, ${r2(at + 0.9)});`);
  sound("pop", r2(at + 0.1), 0.05);
  return `<div id="${sid}-sign" class="sign" style="opacity:0"><i id="${sid}-glass" class="glass"><b></b><u></u></i><span><strong>${esc(day)}</strong>${esc(note)}</span></div>`;
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

// ---- between two places: a frosted window with four panes ---------------------------
const recap = (s, sid, from) => {
  const list = s.recap;
  tw(`tl.fromTo("#${sid}-rc", {opacity:0}, {opacity:1, duration:0.3, ease:"power1.out"}, ${r2(from)});`);
  fadeUp(`#${sid}-rc-h`, from + 0.1);
  const panes = list.map((name, k) => {
    const t0 = from + 0.3 + k * 0.3;
    tw(`tl.fromTo("#${sid}-rp${k}", {opacity:0, filter:"blur(16px) brightness(2)"}, {opacity:1, filter:"blur(0px) brightness(1)", duration:0.5, ease:"power2.out"}, ${r2(t0)});`);
    sound("sparkle", r2(t0), 0.035);
    const who = handle(`videos/tq-tuyet/footage/${name}.mp4`);
    return `<div id="${sid}-rp${k}" class="pane" style="opacity:0"><img src="${asset(`videos/tq-tuyet/recap/${name}.jpg`)}" alt="" /><span>${esc(who)}</span></div>`;
  }).join("");
  const doneAt = from + 0.3 + list.length * 0.3 + 0.3;
  tw(`tl.fromTo("#${sid}-done", {opacity:0, y:30}, {opacity:1, y:0, duration:0.3, ease:"back.out(2)"}, ${r2(doneAt)});`);
  sound("impact-bass-1", r2(doneAt), 0.05);
  return `<div id="${sid}-rc" class="recap" style="opacity:0"><div id="${sid}-rc-h" class="recap-h"><small>${esc(s.recapLabel ?? "")}</small><b>${esc(s.caption)}</b></div><div class="window">${panes}<i class="frame-x"></i><i class="frame-y"></i></div><div id="${sid}-done" class="done" style="opacity:0">ĐÃ GHÉ ✓</div></div>`;
};

/** A wordless breather: the stop's best clip, full screen, no text (the music comes up meanwhile). */
const BREATHS = [];
const breathe = (s, sid, from) => {
  const id = `${sid}-br`;
  BREATHS.push([from, s.breatheSec]);
  tw(`tl.fromTo("#${id}", {opacity:0}, {opacity:1, duration:0.5, ease:"power1.inOut"}, ${r2(from)});`);
  tw(`tl.fromTo("#${id} video", {scale:1.1}, {scale:1.0, duration:${r2(s.breatheSec + 0.5)}, ease:"none"}, ${r2(from)});`);
  return `<div id="${id}" class="ph breathe" style="opacity:0">${media(s.breathe, id, from - 0.2, s.breatheSec + 0.6)}${creditTag(s.breathe)}</div>`;
};

// ---- cold open ---------------------------------------------------------------
/**
 * A black screen with snow falling and a question typed in, then beat-cut clips over the music (no voice). The hook's
 * clips take over and the title freezes in on a frosted-glass card, then the voice starts.
 */
const coldOpen = (s, sid) => {
  const cold = s.cold ?? [];
  const COLD = s.voiceDelay ?? 0;
  const black = 1.5;
  const len = r2((COLD - black) / Math.max(1, cold.length));
  const parts = [];
  cold.forEach((src, k) => {
    const id = `${sid}-k${k}`;
    const from = r2(black + k * len);
    parts.push(`<div id="${id}" class="ph" style="opacity:0">${media(src, id, from - 0.1, len + 0.4)}${creditTag(src)}</div>`);
    tw(`tl.set("#${id}", {opacity:1}, ${from});`);
    tw(`tl.set("#${id}", {opacity:0}, ${r2(from + len + 0.02)});`);
    tw(`tl.fromTo("#${id} video", {scale:1.16}, {scale:1.03, duration:${len}, ease:"power1.out"}, ${from});`);
    sound("whoosh-short", r2(from - 0.06), 0.08);
  });
  const q = "Ngắm tuyết Trung Quốc chỉ 6 triệu?";
  const letters = [...q].map((c, k) => `<span id="${sid}-q${k}" style="opacity:0">${c === " " ? "&nbsp;" : esc(c)}</span>`).join("");
  parts.push(`<div id="${sid}-black" class="black"><p>${letters}</p></div>`);
  [...q].forEach((_, k) => tw(`tl.set("#${sid}-q${k}", {opacity:1}, ${r2(0.15 + k * 0.03)});`));
  tw(`tl.to("#${sid}-black", {opacity:0, duration:0.25, ease:"power1.in"}, ${r2(black - 0.2)});`);
  const after = r2(black + cold.length * len);
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

// ---- snowflakes ----------------------------------------------------------------
const flakes = [];
for (let k = 0; k < 26; k++) {
  const x0 = 10 + ((k * 211) % 1060);
  const size = 6 + (k % 4) * 4;
  flakes.push(`<i id="sf${k}" class="sf" style="left:${x0}px;top:-30px;width:${size}px;height:${size}px" data-layout-ignore></i>`);
  const fall = 6 + (k % 5) * 1.6;
  for (let at = (k * 0.53) % 6, n = 0; at < total; at += fall, n++) {
    const sway = r2(Math.sin(k + n) * 120);
    tw(`tl.fromTo("#sf${k}", {x:0, y:0, opacity:0.85}, {x:${sway}, y:1990, opacity:0.85, duration:${r2(fall)}, ease:"none", immediateRender:${n === 0}}, ${r2(at)});`);
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
  // Where the narrated part ends: a breather and a recap may follow.
  const bodyEnd = s.end - (s.recapSec ?? 0) - (s.breatheSec ?? 0);
  const tail = () => {
    if (s.breathe) parts.push(breathe(s, sid, bodyEnd));
    if (s.recap?.length) parts.push(recap(s, sid, bodyEnd + (s.breatheSec ?? 0)));
  };

  if (s.layout === "hook") {
    const m = coldOpen(s, sid);
    parts.push(m.html);
    parts.push(`<div id="${sid}-dim" class="hook-dim" style="opacity:0"></div>`);
    tw(`tl.fromTo("#${sid}-dim", {opacity:0}, {opacity:1, duration:0.4}, ${r2(m.after)});`);
    // Frosted-glass title card: the big number freezes in from a blur, the label and kicker follow.
    parts.push(`<div id="${sid}-tt" class="frost-card" style="opacity:0"><small>${esc(s.kicker)}</small><h1>${words(s.caption)}</h1><b>${esc(s.label)}</b></div>`);
    tw(`tl.fromTo("#${sid}-tt", {opacity:0, scale:0.9}, {opacity:1, scale:1, duration:0.5, ease:"back.out(1.6)"}, ${r2(m.after + 0.05)});`);
    tw(`tl.fromTo("#${sid}-tt h1 .w", {opacity:0, filter:"blur(18px)", scale:1.4}, {opacity:1, filter:"blur(0px)", scale:1, duration:0.6, stagger:0.12, ease:"power3.out"}, ${r2(m.after + 0.25)});`);
    fadeUp(`#${sid}-tt b`, m.after + 0.8);
    sound("impact-bass-1", r2(m.after + 0.3), 0.1);
    const lift = s.vo + 3.2;
    tw(`tl.to("#${sid}-tt", {opacity:0, y:-80, duration:0.5, ease:"power2.in"}, ${r2(lift)});`);
    tw(`tl.to("#${sid}-dim", {opacity:0.3, duration:0.6}, ${r2(lift)});`);
  } else if (s.layout === "point") {
    parts.push(photos(s, a, bodyEnd, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div class="floor"></div>`);
    const idx = days.findIndex((x) => x.id === s.id);
    parts.push(sign(sid, s.day, s.badge ?? "", enter + 0.3));
    parts.push(`<div class="head">`);
    parts.push(`<div id="${sid}-kicker" class="kicker">${esc(s.label.toUpperCase())}</div>`);
    parts.push(`<h1 id="${sid}-title" class="title">${words(s.caption)}</h1>`);
    fadeUp(`#${sid}-kicker`, enter, 0.25);
    titleIn(`#${sid}-title`, enter + 0.15);
    (s.points ?? []).forEach((pt, k) => {
      parts.push(`<div id="${sid}-pt${k}" class="point"><i>❄</i>${esc(pt)}</div>`);
      fadeUp(`#${sid}-pt${k}`, enter + 0.8 + k * 0.4);
    });
    parts.push(`</div>`);
    parts.push(dayChips(sid, idx));
    fadeUp(`#${sid}-days`, enter + 0.4);
    if (s.breathe) tw(`tl.to("#${sid}-days", {opacity:0, duration:0.3}, ${r2(bodyEnd)});`);
    tail();
  } else if (s.layout === "extra") {
    // Frosted tags, one per idea, on their cue words. The "compare" style shows three destinations as bigger cards.
    parts.push(photos(s, a, bodyEnd, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div class="floor"></div>`);
    parts.push(`<div class="head"><div id="${sid}-kicker" class="kicker">${esc(s.kicker)}</div><h1 id="${sid}-title" class="title">${words(s.caption)}</h1></div>`);
    fadeUp(`#${sid}-kicker`, enter, 0.25);
    titleIn(`#${sid}-title`, enter + 0.15);
    const cmp = s.style === "compare";
    let prev = enter + 0.8;
    (s.items ?? []).forEach((it, k) => {
      const at = Math.max(cueTime(s, it.cue) ?? prev + 1.5, prev + 0.9);
      prev = at;
      const top = cmp ? 960 + k * 170 : 1000 + k * 140;
      parts.push(`<div id="${sid}-tg${k}" class="${cmp ? "opt" : "ftag"}" style="opacity:0;top:${top}px"><i>${cmp ? k + 1 : "❄"}</i><div><b>${esc(it.t)}</b><span>${esc(it.s)}</span></div></div>`);
      tw(`tl.fromTo("#${sid}-tg${k}", {opacity:0, x:-90, filter:"blur(8px)"}, {opacity:1, x:0, filter:"blur(0px)", duration:0.45, ease:"power3.out"}, ${r2(at)});`);
      sound("pop", r2(at + 0.1), 0.05);
    });
    const ids = (s.items ?? []).map((_, k) => `#${sid}-tg${k}`).join(", ");
    if (bodyEnd - prev > 2.6) hideOut(ids, bodyEnd - 0.8);
    else tw(`tl.to("${ids}", {opacity:0, duration:0.3}, ${r2(bodyEnd - 0.3)});`);
    tail();
  } else if (s.layout === "cost") {
    // "Giá bao nhiêu?": a passport page; each line gets an entry stamp, the total is stamped last.
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div id="${sid}-veil" class="veil" style="opacity:0"></div>`);
    parts.push(`<div class="head"><div id="${sid}-kicker" class="kicker">${esc(s.kicker ?? "")}</div><h1 id="${sid}-title" class="title" style="font-size:86px">${words(s.caption)}</h1></div>`);
    fadeUp(`#${sid}-kicker`, enter, 0.25);
    titleIn(`#${sid}-title`, enter + 0.15);
    const t0 = enter + 0.7;
    tw(`tl.fromTo("#${sid}-veil", {opacity:0}, {opacity:1, duration:0.4}, ${r2(t0 - 0.2)});`);
    const items = s.items ?? [];
    const totalAt = Math.max(cueTime(s, s.totalCue) ?? s.end - 2.6, t0 + 0.5 + items.length * 0.5 + 0.3);
    const step = Math.min(0.8, (s.end - t0 - 2.2) / Math.max(1, items.length));
    const lines = items.map((it, k) => {
      const at = t0 + 0.5 + k * step;
      tw(`tl.fromTo("#${sid}-ln${k}", {opacity:0}, {opacity:1, duration:0.2}, ${r2(at)});`);
      tw(`tl.fromTo("#${sid}-ln${k} em", {opacity:0, scale:2, rotation:-25}, {opacity:1, scale:1, rotation:${k % 2 ? 6 : -8}, duration:0.22, ease:"power4.in"}, ${r2(at + 0.15)});`);
      sound("pop", r2(at + 0.3), 0.05);
      return `<div id="${sid}-ln${k}" class="pl" style="opacity:0"><span>${esc(it.k)}</span><em class="${/✓/.test(it.v) ? "" : "warn"}">${esc(it.v)}</em></div>`;
    }).join("");
    parts.push(`<div id="${sid}-pp" class="passport" style="opacity:0"><div class="pp-h"><b>${esc(s.receiptTitle ?? "")}</b><span>VISA · VISA · VISA</span></div>${lines}` +
      `<div id="${sid}-tot" class="pp-tot" style="opacity:0"><span>KHOẢNG</span><b>${esc(s.total)}</b></div><div class="pp-f">${esc(s.note ?? "")}</div></div>`);
    tw(`tl.fromTo("#${sid}-pp", {opacity:0, rotationY:-70}, {opacity:1, rotationY:0, duration:0.55, ease:"power3.out"}, ${r2(t0)});`);
    tw(`tl.fromTo("#${sid}-tot", {opacity:0, scale:2.4, rotation:-14}, {opacity:1, scale:1, rotation:-5, duration:0.28, ease:"power4.in"}, ${r2(totalAt)});`);
    sound("impact-bass-1", r2(totalAt + 0.25), 0.09);
    parts.push(`<div id="${sid}-stamp" class="stamp" style="opacity:0">${esc(s.stamp ?? "")}</div>`);
    tw(`tl.fromTo("#${sid}-stamp", {opacity:0, scale:2.2, rotation:-24}, {opacity:1, scale:1, rotation:-8, duration:0.3, ease:"power4.in"}, ${r2(totalAt + 0.7)});`);
  } else {
    // Outro: a snow globe with the question, shaken once so the snow swirls, then the call to action.
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div id="${sid}-dim" class="hook-dim" style="opacity:0"></div>`);
    tw(`tl.to("#${sid}-dim", {opacity:1, duration:0.5}, ${r2(enter)});`);
    const specks = Array.from({ length: 18 }, (_, k) => `<i id="${sid}-gs${k}" class="gs" style="left:${60 + ((k * 37) % 420)}px;top:${80 + ((k * 53) % 340)}px"></i>`).join("");
    parts.push(`<div id="${sid}-globe" class="globe" style="opacity:0"><div class="glass-ball">${specks}<h1>${words(s.caption)}</h1></div><i class="base"></i></div>`);
    tw(`tl.fromTo("#${sid}-globe", {opacity:0, y:200, scale:0.7}, {opacity:1, y:0, scale:1, duration:0.6, ease:"back.out(1.5)"}, ${r2(enter + 0.3)});`);
    tw(`tl.fromTo("#${sid}-globe", {rotation:0}, {rotation:8, duration:0.12, yoyo:true, repeat:5, ease:"sine.inOut", immediateRender:false}, ${r2(enter + 1.0)});`);
    for (let k = 0; k < 18; k++) tw(`tl.fromTo("#${sid}-gs${k}", {x:0, y:0}, {x:${((k * 29) % 80) - 40}, y:${60 + (k % 5) * 30}, duration:2.4, ease:"power1.out", immediateRender:false}, ${r2(enter + 1.0)});`);
    titleIn(`#${sid}-globe h1`, enter + 0.6);
    sound("sparkle", r2(enter + 1.0), 0.06);
    const ctaAt = Math.min(enter + 2.8, s.end - 1.6);
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
    const en = Math.min(s.end - (s.recapSec ?? 0) - (s.breatheSec ?? 0), s.vo + (nextStartMs ?? line.at(-1).endMs + 400) / 1000);
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
  mediaTags.push(`<audio id="music-${k}" src="${musicSrc}" data-start="${r2(at)}" data-duration="${dur}" data-volume="0.45" data-fade-in="${k ? 1 : 0.3}" data-fade-out="${last ? 1.5 : 1}" data-track-index="${k % 2 ? 31 : 30}"></audio>`);
  if (last) break;
  at = r2(at + dur - 1);
}
// A louder copy of the opening bars under the cold open, then the same lift under every wordless breather.
mediaTags.push(`<audio id="music-cold" src="${musicSrc}" data-start="0" data-duration="${r2(COLD + 0.4)}" data-volume="0.8" data-fade-in="0.2" data-fade-out="0.9" data-track-index="32"></audio>`);
BREATHS.forEach(([at, dur], k) => mediaTags.push(`<audio id="music-br${k}" src="${musicSrc}" data-start="${r2(at)}" data-media-start="${r2((at % (musicLen - dur - 1)) + 0.5)}" data-duration="${r2(dur)}" data-volume="0.8" data-fade-in="0.8" data-fade-out="1" data-track-index="${33 + k}"></audio>`));

// ---- shader seams + quiet whooshes -----------------------------------
const SHADERS = ["light-leak", "sdf-iris", "chromatic-radial-split", "thermal-distortion", "domain-warp"];
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
:root { --ground:#0d1a2b; --ink:#f4f9ff; --ice:#9fdcff; --iced:#5fc3ff; --navy:#12263f; --gold:#ffd76a; --rose:#ff7d9a; }
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:${W}px; height:${H}px; overflow:hidden; background:var(--ground); }
#root { position:relative; width:${W}px; height:${H}px; overflow:hidden; font-family:"Be Vietnam Pro"; }
.scene { position:absolute; inset:0; overflow:hidden; background:var(--ground); z-index:1; }
.ph { position:absolute; inset:0; overflow:hidden; }
.ph video { width:100%; height:100%; object-fit:cover; display:block; filter:saturate(1.02) contrast(1.04) hue-rotate(-4deg); }
/* Diagonal snow sweep. */
.sweep { --p:-30%; -webkit-mask-image:linear-gradient(135deg, #000 var(--p), transparent calc(var(--p) + 25%)); mask-image:linear-gradient(135deg, #000 var(--p), transparent calc(var(--p) + 25%)); }
.breathe { z-index:8; }
.cr { position:absolute; left:60px; top:112px; z-index:4; font:600 22px "Be Vietnam Pro"; color:rgba(244,249,255,0.85); text-shadow:0 2px 8px rgba(0,0,0,0.7); }
.shade { position:absolute; inset:0; background:linear-gradient(180deg, rgba(8,16,28,0.2) 0%, rgba(8,16,28,0) 35%, rgba(8,16,28,0) 65%, rgba(8,16,28,0.35) 100%); }
.top { position:absolute; left:0; right:0; top:0; height:760px; background:linear-gradient(180deg, rgba(9,20,36,0.85) 0%, rgba(9,20,36,0.5) 55%, rgba(9,20,36,0) 100%); }
.floor { position:absolute; left:0; right:0; bottom:0; height:900px; background:linear-gradient(180deg, rgba(9,20,36,0) 0%, rgba(9,20,36,0.6) 45%, rgba(9,20,36,0.93) 100%); }
.veil { position:absolute; inset:0; background:rgba(9,20,36,0.55); }
.hook-dim { position:absolute; inset:0; z-index:4; background:linear-gradient(180deg, rgba(9,20,36,0.35) 0%, rgba(9,20,36,0.05) 45%, rgba(9,20,36,0.8) 100%); }
.black { position:absolute; inset:0; z-index:9; background:#05080d; display:flex; align-items:center; justify-content:center; }
.black p { width:880px; text-align:center; font:800 64px/1.25 "Be Vietnam Pro"; color:var(--ink); }
.black p span { display:inline-block; }
.sf { position:absolute; z-index:16; border-radius:50%; background:rgba(255,255,255,0.85); box-shadow:0 0 8px rgba(255,255,255,0.6); opacity:0; pointer-events:none; }
/* Frosted-glass title card. */
.frost-card { position:absolute; left:80px; right:80px; top:900px; z-index:8; padding:40px 40px 46px; border-radius:36px; text-align:center; background:rgba(220,240,255,0.18); border:3px solid rgba(255,255,255,0.55); box-shadow:0 30px 60px rgba(0,0,0,0.45), inset 0 0 40px rgba(255,255,255,0.25); backdrop-filter:blur(10px); }
.frost-card small { display:block; font:800 28px "Be Vietnam Pro"; color:var(--gold); letter-spacing:0.12em; }
.frost-card h1 { margin-top:6px; font:900 190px/1 "Be Vietnam Pro"; color:#fff; text-shadow:0 0 30px rgba(159,220,255,0.9), 0 8px 30px rgba(0,0,0,0.5); }
.frost-card b { display:block; margin-top:10px; font:900 54px "Be Vietnam Pro"; color:var(--ink); }
.title .w, .frost-card .w, .glass-ball .w { display:inline-block; }
.pill { position:absolute; left:50%; top:1370px; transform:translateX(-50%); font:900 44px "Be Vietnam Pro"; color:var(--navy); background:var(--gold); padding:12px 40px; border-radius:999px; white-space:nowrap; z-index:8; }
/* Hourglass badge. */
.sign { position:absolute; right:60px; top:130px; z-index:6; display:flex; align-items:center; gap:16px; padding:14px 22px 14px 18px; border-radius:30px; background:rgba(18,38,63,0.85); border:2px solid rgba(159,220,255,0.5); box-shadow:0 12px 24px rgba(0,0,0,0.45); }
.glass { position:relative; display:block; width:56px; height:84px; }
.glass b, .glass u { position:absolute; left:0; width:56px; height:42px; background:var(--ice); }
.glass b { top:0; clip-path:polygon(0 0, 100% 0, 50% 100%); }
.glass u { bottom:0; clip-path:polygon(50% 0, 100% 100%, 0 100%); background:var(--gold); }
.sign span { font:700 24px "Be Vietnam Pro"; color:rgba(244,249,255,0.85); }
.sign span strong { display:block; font:900 50px/1 "Be Vietnam Pro"; color:var(--ink); }
.head { position:absolute; left:80px; top:330px; width:620px; display:flex; flex-direction:column; gap:10px; z-index:5; }
.kicker { font:800 30px "Be Vietnam Pro"; color:var(--ice); }
.title { margin-bottom:10px; font:900 94px/1.04 "Be Vietnam Pro"; color:var(--ink); text-shadow:0 6px 30px rgba(0,0,0,0.55); }
.point { font:600 34px/1.3 "Be Vietnam Pro"; color:rgba(244,249,255,0.95); text-shadow:0 2px 14px rgba(0,0,0,0.75); }
.point i { font-style:normal; color:var(--ice); margin-right:14px; }
/* Day chips under the subtitles. */
.days { position:absolute; left:0; right:0; top:1680px; z-index:20; display:flex; justify-content:center; gap:14px; }
.days i { font:800 26px "Be Vietnam Pro"; font-style:normal; color:rgba(244,249,255,0.75); padding:6px 22px; border-radius:999px; border:2px solid rgba(159,220,255,0.4); background:rgba(9,20,36,0.6); }
.days i.done { background:rgba(159,220,255,0.3); color:var(--ink); }
.days i.now { background:var(--ice); border-color:var(--ice); color:var(--navy); }
/* Frosted window between two places. */
.recap { position:absolute; inset:0; z-index:9; background:radial-gradient(ellipse at 50% 55%, #1d3b5c 0%, #10233a 60%, #070f1a 100%); }
.recap-h { position:absolute; left:80px; right:80px; top:240px; text-align:center; }
.recap-h small { display:block; font:900 30px "Be Vietnam Pro"; color:var(--ice); letter-spacing:0.18em; text-transform:uppercase; }
.recap-h b { display:block; margin-top:8px; font:900 88px/1.05 "Be Vietnam Pro"; color:var(--ink); }
.window { position:absolute; left:110px; top:480px; width:860px; height:1040px; display:grid; grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr; gap:24px; padding:24px; border-radius:30px; background:#e9f4ff; box-shadow:0 30px 60px rgba(0,0,0,0.55), inset 0 0 50px rgba(159,220,255,0.6); }
.pane { position:relative; overflow:hidden; border-radius:14px; box-shadow:inset 0 0 40px rgba(255,255,255,0.8); }
.pane img { width:100%; height:100%; object-fit:cover; display:block; }
.pane span { position:absolute; left:10px; bottom:8px; font:700 20px "Be Vietnam Pro"; color:#fff; text-shadow:0 2px 6px rgba(0,0,0,0.8); }
.frame-x, .frame-y { display:none; }
.done { position:absolute; left:50%; top:1580px; transform:translateX(-50%); padding:12px 34px; border-radius:999px; background:var(--gold); color:var(--navy); font:900 44px "Be Vietnam Pro"; white-space:nowrap; box-shadow:0 10px 24px rgba(0,0,0,0.45); }
/* Frosted tags and compare cards. */
.ftag, .opt { position:absolute; left:80px; width:920px; z-index:7; display:flex; align-items:center; gap:26px; padding:18px 28px; border-radius:24px; background:rgba(220,240,255,0.16); border:2px solid rgba(255,255,255,0.45); box-shadow:0 14px 30px rgba(0,0,0,0.4); backdrop-filter:blur(8px); }
.ftag i, .opt i { flex:none; width:70px; height:70px; border-radius:50%; background:var(--ice); color:var(--navy); font:900 40px/70px "Be Vietnam Pro"; font-style:normal; text-align:center; }
.opt i { background:var(--gold); }
.ftag b, .opt b { display:block; font:900 42px "Be Vietnam Pro"; color:var(--ink); }
.ftag span, .opt span { display:block; font:600 28px "Be Vietnam Pro"; color:rgba(244,249,255,0.85); }
.opt { padding:22px 28px; }
/* Cost: passport page with entry stamps. */
.passport { position:absolute; left:70px; width:940px; top:560px; z-index:7; padding:36px 44px 26px; border-radius:20px; background:linear-gradient(180deg, #f7f2e6, #ece3cf); box-shadow:0 24px 50px rgba(0,0,0,0.55); color:#2a2a3a; transform-origin:0% 50%; }
.pp-h { display:flex; justify-content:space-between; align-items:baseline; padding-bottom:12px; border-bottom:3px double rgba(42,42,58,0.35); margin-bottom:8px; }
.pp-h b { font:900 34px "Be Vietnam Pro"; color:#1d3b5c; }
.pp-h span { font:700 18px "Be Vietnam Pro"; color:rgba(42,42,58,0.45); letter-spacing:0.3em; }
.pl { display:flex; justify-content:space-between; align-items:center; gap:20px; padding:10px 4px; border-bottom:1px dashed rgba(42,42,58,0.25); }
.pl span { font:600 34px/1.2 "Be Vietnam Pro"; }
.pl em { font:900 28px "Be Vietnam Pro"; font-style:normal; color:#1f7a4a; padding:6px 14px; border:4px solid #1f7a4a; border-radius:12px; white-space:nowrap; }
.pl em.warn { color:#c0392b; border-color:#c0392b; }
.pp-tot { display:flex; justify-content:center; align-items:baseline; gap:20px; margin:20px auto 0; width:620px; padding:12px 0; border:7px solid #1d3b5c; border-radius:20px; color:#1d3b5c; }
.pp-tot span { font:900 30px "Be Vietnam Pro"; letter-spacing:0.1em; }
.pp-tot b { font:900 70px "Be Vietnam Pro"; }
.pp-f { margin-top:12px; font:600 24px "Be Vietnam Pro"; color:rgba(42,42,58,0.6); text-align:center; }
.stamp { position:absolute; left:640px; top:470px; z-index:9; padding:8px 18px; border:5px solid var(--rose); border-radius:12px; color:var(--rose); font:900 24px "Be Vietnam Pro"; background:rgba(244,249,255,0.95); }
/* Outro: snow globe. */
.globe { position:absolute; left:250px; top:560px; width:580px; height:720px; z-index:8; transform-origin:50% 100%; }
.glass-ball { position:absolute; left:0; top:0; width:580px; height:580px; border-radius:50%; overflow:hidden; background:radial-gradient(circle at 35% 30%, rgba(255,255,255,0.55), rgba(159,220,255,0.25) 45%, rgba(18,38,63,0.55) 100%); border:6px solid rgba(255,255,255,0.7); box-shadow:0 30px 60px rgba(0,0,0,0.5), inset 0 -30px 60px rgba(255,255,255,0.35); display:flex; align-items:center; justify-content:center; text-align:center; }
.glass-ball h1 { position:relative; z-index:2; padding:0 40px; font:900 92px/1.05 "Be Vietnam Pro"; color:#fff; text-shadow:0 4px 24px rgba(0,0,0,0.55); }
.gs { position:absolute; width:12px; height:12px; border-radius:50%; background:#fff; opacity:0.9; }
.base { position:absolute; left:110px; top:560px; width:360px; height:130px; border-radius:20px 20px 60px 60px; background:linear-gradient(180deg, #b77b4c, #7a4a28); box-shadow:0 20px 30px rgba(0,0,0,0.5); }
.pill.cta { top:1360px; font-size:64px; padding:18px 56px; }
.brand { position:absolute; left:60px; top:60px; z-index:21; font:800 26px "Be Vietnam Pro"; letter-spacing:0.22em; color:rgba(244,249,255,0.9); text-shadow:0 2px 10px rgba(0,0,0,0.5); }
.brand b { color:var(--ice); letter-spacing:0; margin-right:12px; }
.cap { position:absolute; left:60px; right:60px; top:1500px; text-align:center; font:800 50px/1.25 "Be Vietnam Pro"; color:#ffffff; text-shadow:0 3px 0 rgba(0,0,0,0.55), 0 0 22px rgba(0,0,0,0.85); z-index:20; }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="${W}" data-height="${H}">
${mediaTags.join("\n")}
${sfx.join("\n")}
${html.join("\n")}
${flakes.join("\n")}
<div class="brand" data-layout-ignore><b>❄</b>${esc(video.theme.brand)}</div>
${caps.join("\n")}
</div>
<script>
const tl = gsap.timeline({ paused: true });
${js.join("\n")}
HyperShader.init({
  bgColor: "#0d1a2b",
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
