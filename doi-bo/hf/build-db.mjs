#!/usr/bin/env node
/**
 * node hf/build-db.mjs --slug doi-bo-san-may [--cover]
 *
 * Turns data/videos/<slug>/video.json + voiceover.json into a HyperFrames project at build/<slug>/.
 * The look ("Đồi Bò Sa Pa: săn biển mây", 24/11/2026), new for this channel (checked against
 * D:/Thang_space_archive/STYLE-LOG.md), built around a hiking map and a highland meadow with grazing cows:
 *   - cold open: a cream topographic map; contour rings breathe, a dashed trail draws itself from the "SA PA" pin to
 *     the "ĐỒI BÒ" summit while the height counts up to 2.400 m, then the map folds shut and four clips cut on
 *     cowbell hits over the self-made pastoral track (fingerpicked guitar, cowbells, whistle); the title "ĐỒI BÒ"
 *     rises letter by letter like hills from a line of grass;
 *   - pictures change by a "map fold" (the new clip opens from a centre crease like a map being unfolded) or by
 *     "contour rings" (the new clip appears through widening topographic rings), each with a brush of grass;
 *   - tall grass sways along the bottom edge the whole way through;
 *   - each stage gets a hiking-watch badge: a ring fills to n/3 round "CHẶNG n/3", the note beside it;
 *   - viewing breaks (user request 22/11/2026): after the narrator says "Sau đây là vài thước phim…", TikTok clips of
 *     the place play with their ORIGINAL sound, the music dropped almost to silence, no text but a small credit;
 *   - between stages, four photos are pegged onto a wooden fence rail and swing, "ĐÃ LEO ✓" (user request 20/11/2026);
 *   - "Ăn gì, ở đâu?" and "Nói thật nè" are cards of contour-map paper with a green edge, with Google Maps proof;
 *   - "Hết bao nhiêu?" is a wooden trail signpost: each cost is an arrow plank knocked onto the post, the total on the
 *     top board;
 *   - outro: a summit cairn, stones set one on another, the title above it with "Lưu lại nhé!";
 *   - shader seams: cross-warp-morph, whip-pan, chromatic-radial-split, light-leak, ridged-burn.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fail, parseArgs, requireSlug } from "../scripts/lib/args.mjs";
import { probeDurationSec } from "../scripts/lib/media.mjs";
import { PROJECT_ROOT, PUBLIC_ROOT } from "../scripts/lib/paths.mjs";

const { flags } = parseArgs(process.argv.slice(2));
const slug = requireSlug(flags, "build-db");
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
const SFX_GAIN = 1.6; // louder effects than the early videos (user request 21/11/2026)
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
 * Footage stack. Odd changes: a "map fold", the new clip opens from a vertical centre crease like a map being
 * unfolded, the crease shadow fading as it flattens. Even changes: "contour rings", the new clip appears through
 * widening topographic rings centred low in the frame.
 */
const photos = (s, from, to, idPrefix) => {
  const g = s.gallery ?? [];
  const seg = (to - from) / g.length;
  const parts = [];
  g.forEach((src, k) => {
    const id = `${idPrefix}-p${k}`;
    const a = r2(from + seg * k);
    tw(`tl.fromTo("#${id} video", {scale:1.12, y:16}, {scale:1.03, y:-16, duration:${r2(seg + 0.8)}, ease:"none"}, ${a});`);
    const inner = media(src, id, a - 0.9, seg + 1.8) + creditTag(src);
    if (k === 0) return parts.push(`<div id="${id}" class="ph">${inner}</div>`);
    if (k % 2 === 1) {
      tw(`tl.set("#${id}", {clipPath:"inset(0% 50% 0% 50%)"}, 0);`);
      tw(`tl.fromTo("#${id}", {clipPath:"inset(0% 50% 0% 50%)"}, {clipPath:"inset(0% 0% 0% 0%)", duration:0.7, ease:"power3.inOut", immediateRender:false}, ${r2(a - 0.35)});`);
      tw(`tl.fromTo("#${id}-crease", {opacity:0.9, scaleX:0.2}, {opacity:0, scaleX:3, duration:0.8, ease:"power2.out", immediateRender:false}, ${r2(a - 0.35)});`);
      tw(`tl.set("#${idPrefix}-p${k - 1}", {opacity:0}, ${r2(a + 0.37)});`);
      sound("grass-swish", r2(a - 0.4), 0.06);
      return parts.push(`<div id="${id}" class="ph">${inner}</div><i id="${id}-crease" class="crease" style="opacity:0"></i>`);
    }
    tw(`tl.set("#${id}", {"--r":"0px"}, 0);`);
    tw(`tl.fromTo("#${id}", {"--r":"0px"}, {"--r":"96px", duration:0.75, ease:"power2.inOut", immediateRender:false}, ${r2(a - 0.4)});`);
    tw(`tl.set("#${idPrefix}-p${k - 1}", {opacity:0}, ${r2(a + 0.37)});`);
    sound("grass-swish", r2(a - 0.4), 0.05);
    parts.push(`<div id="${id}" class="ph rings">${inner}</div>`);
  });
  return parts.join("");
};

const titleIn = (sel, at) =>
  tw(`tl.fromTo("${sel} .w", {opacity:0, y:30, filter:"blur(10px)"}, {opacity:1, y:0, filter:"blur(0px)", duration:0.5, stagger:0.07, ease:"power3.out"}, ${r2(at)});`);
const fadeUp = (sel, at, dur = 0.35) =>
  tw(`tl.fromTo("${sel}", {opacity:0, y:26}, {opacity:1, y:0, duration:${dur}, ease:"expo.out"}, ${r2(at)});`);
const hideOut = (sel, at) => tw(`tl.to("${sel}", {opacity:0, y:30, duration:0.4, ease:"power2.in"}, ${r2(at)});`);

// ---- hiking-watch badge -------------------------------------------------------------
/** A round hiking-watch face drops in: its ring fills to n/3 round "CHẶNG n/3", the stage note beside it. */
const watchBadge = (sid, day, note, at) => {
  const n = days.length;
  const deg = Math.round((360 * Number(day)) / n);
  tw(`tl.fromTo("#${sid}-sign", {opacity:0, y:-50, scale:0.8}, {opacity:1, y:0, scale:1, duration:0.5, ease:"back.out(1.8)"}, ${r2(at)});`);
  tw(`tl.fromTo("#${sid}-ring", {"--a":"0deg"}, {"--a":"${deg}deg", duration:1.1, ease:"power2.out"}, ${r2(at + 0.35)});`);
  sound("cowbell", r2(at + 0.1), 0.05);
  return `<div id="${sid}-sign" class="sign" style="opacity:0"><div id="${sid}-ring" class="watch"><span><small>CHẶNG</small>${esc(day)}/${n}</span></div><em>${esc(note)}</em></div>`;
};

// Google Maps screenshots (name + stars + review count), captured 24/11/2026 into public/videos/doi-bo/maps.
const MAPS_DATE = "chụp 24/11/2026";

// ---- between stages: four photos pegged on a wooden fence rail -------------------------------------
const recap = (s, sid, from) => {
  const list = s.recap;
  tw(`tl.fromTo("#${sid}-rc", {opacity:0}, {opacity:1, duration:0.3, ease:"power1.out"}, ${r2(from)});`);
  fadeUp(`#${sid}-rc-h`, from + 0.1);
  tw(`tl.fromTo("#${sid}-rail", {scaleX:0}, {scaleX:1, duration:0.5, ease:"power2.out"}, ${r2(from + 0.1)});`);
  const cards = list.map((name, k) => {
    const t0 = from + 0.35 + k * 0.32;
    const tilt = [-6, 4, -3, 7][k];
    // Pegged on, then a little swing that settles.
    tw(`tl.fromTo("#${sid}-rp${k}", {opacity:0, y:-260, rotation:0}, {opacity:1, y:0, rotation:${tilt}, duration:0.5, ease:"back.out(1.6)"}, ${r2(t0)});`);
    tw(`tl.to("#${sid}-rp${k}", {rotation:${-tilt / 2}, duration:0.6, yoyo:true, repeat:1, ease:"sine.inOut"}, ${r2(t0 + 0.5)});`);
    sound(k % 2 ? "wood-knock" : "cowbell", r2(t0 + 0.08), 0.04);
    const who = handle(`videos/doi-bo/footage/${name}.mp4`);
    return `<div id="${sid}-rp${k}" class="peg" style="opacity:0;left:${40 + k * 255}px"><i class="clip-peg"></i><img src="${asset(`videos/doi-bo/recap/${name}.jpg`)}" alt="" /><span>${esc(who)}</span></div>`;
  }).join("");
  const doneAt = from + 0.35 + list.length * 0.32 + 0.4;
  tw(`tl.fromTo("#${sid}-done", {opacity:0, scale:1.8, rotation:-14}, {opacity:1, scale:1, rotation:-6, duration:0.3, ease:"power4.in"}, ${r2(doneAt)});`);
  sound("whistle-call", r2(doneAt + 0.05), 0.06);
  return `<div id="${sid}-rc" class="recap" style="opacity:0"><div id="${sid}-rc-h" class="recap-h"><small>${esc(s.recapLabel ?? "")}</small><b>${esc(s.caption)}</b></div>` +
    `<i class="post p1"></i><i class="post p2"></i><i class="post p3"></i><i id="${sid}-rail" class="rail-wood"></i><i class="rail-wood low"></i>` +
    `${cards}<div id="${sid}-done" class="done" style="opacity:0">ĐÃ LEO ✓</div></div>`;
};

/** A viewing break: TikTok clips of the place with their original sound (user rule 22/11/2026), no text but credit. */
const BREATHS = [];
const breatheAudio = [];
const breathe = (s, sid, from) => {
  BREATHS.push([from, s.breatheSec]);
  const parts = [];
  let at = from;
  s.breathe.forEach((b, k) => {
    const id = `${sid}-br${k}`;
    tw(`tl.set("#${id}", {opacity:1}, ${r2(at)});`);
    if (k === 0) tw(`tl.fromTo("#${id}", {opacity:0}, {opacity:1, duration:0.35, ease:"power1.inOut"}, ${r2(at)});`);
    tw(`tl.set("#${id}", {opacity:0}, ${r2(at + b.dur)});`);
    tw(`tl.fromTo("#${id} video", {scale:1.06}, {scale:1.0, duration:${r2(b.dur)}, ease:"none"}, ${r2(at)});`);
    parts.push(`<div id="${id}" class="ph breathe" style="opacity:0">${media(b.src, id, at - 0.05, b.dur + 0.1)}<div class="cr orig">🔊 âm thanh gốc · ${esc(handle(b.src))}</div></div>`);
    breatheAudio.push(`<audio id="orig-${sid}-${k}" src="${asset(b.audio)}" data-start="${r2(at)}" data-duration="${r2(b.dur)}" data-volume="1" data-track-index="3"></audio>`);
    at += b.dur;
  });
  return parts.join("");
};

// ---- cold open ---------------------------------------------------------------
/**
 * A cream topographic map: contour rings breathe, a dashed trail draws from the "SA PA" pin up to the "ĐỒI BÒ"
 * summit while the height counts up to 2.400 m, then the map folds shut along its crease and four clips cut on
 * cowbell hits; the hook's clips follow under the title.
 */
const TRAIL = "M250,1380 C330,1280 300,1180 420,1120 S560,1020 520,900 S640,720 760,640";
const coldOpen = (s, sid) => {
  const cold = s.cold ?? [];
  const COLD = s.voiceDelay ?? 0;
  const black = 1.8;
  const len = r2((COLD - black) / Math.max(1, cold.length));
  const parts = [];
  const rings = Array.from({ length: 9 }, (_, k) => `<ellipse cx="${760 + k * 6}" cy="${640 + k * 9}" rx="${70 + k * 70}" ry="${50 + k * 52}" fill="none" stroke="#b9a77a" stroke-width="${k % 3 ? 2 : 4}" opacity="${0.75 - k * 0.05}"/>`).join("");
  const rings2 = Array.from({ length: 5 }, (_, k) => `<ellipse cx="230" cy="1430" rx="${60 + k * 60}" ry="${40 + k * 44}" fill="none" stroke="#b9a77a" stroke-width="2" opacity="0.5"/>`).join("");
  parts.push(`<div id="${sid}-black" class="black topo"><svg class="topo-svg" viewBox="0 0 1080 1920" width="1080" height="1920"><g id="${sid}-rings">${rings}${rings2}</g>` +
    `<path id="${sid}-trail" d="${TRAIL}" fill="none" stroke="#c0392b" stroke-width="10" stroke-linecap="round" stroke-dasharray="1400" stroke-dashoffset="1400"/>` +
    `<path d="${TRAIL}" fill="none" stroke="#f4ecd6" stroke-width="4" stroke-dasharray="14 18"/></svg>` +
    `<div class="pin-a">📍 SA PA</div><div id="${sid}-sum" class="summit" style="opacity:0">▲ ĐỒI BÒ</div>` +
    `<div class="alt"><small>ĐỘ CAO</small><b id="${sid}-alt">1.600</b><em>m</em></div><i id="${sid}-crease" class="map-crease"></i></div>`);
  tw(`tl.fromTo("#${sid}-rings", {scale:0.96, transformOrigin:"70% 33%"}, {scale:1.02, duration:${black}, ease:"sine.inOut"}, 0);`);
  tw(`tl.fromTo("#${sid}-trail", {strokeDashoffset:1400}, {strokeDashoffset:0, duration:1.1, ease:"power1.inOut"}, 0.1);`);
  tw(`tl.fromTo("#${sid}-alt", {innerText:1600}, {innerText:2400, duration:1.1, ease:"power1.inOut", snap:{innerText:50}, onUpdate:function(){const e=this.targets()[0]; e.innerText=Number(e.innerText).toLocaleString("vi-VN");}}, 0.1);`);
  for (let k = 0; k < 8; k++) sound("alti-tick", r2(0.12 + k * 0.13), 0.05);
  tw(`tl.fromTo("#${sid}-sum", {opacity:0, scale:0.4}, {opacity:1, scale:1, duration:0.3, ease:"back.out(3)"}, 1.15);`);
  sound("cowbell", 1.15, 0.12);
  // The map folds shut along its middle crease, uncovering the first clip.
  tw(`tl.to("#${sid}-black", {clipPath:"inset(0% 50% 0% 50%)", duration:0.45, ease:"power3.in"}, ${r2(black - 0.45)});`);
  tw(`tl.fromTo("#${sid}-crease", {opacity:0}, {opacity:1, duration:0.4}, ${r2(black - 0.45)});`);
  sound("grass-swish", r2(black - 0.5), 0.12);
  cold.forEach((src, k) => {
    const id = `${sid}-k${k}`;
    const from = r2(black + k * len);
    parts.push(`<div id="${id}" class="ph" style="opacity:0">${media(src, id, from - 0.1, len + 0.4)}${creditTag(src)}</div>`);
    tw(`tl.set("#${id}", {opacity:1}, ${from});`);
    tw(`tl.set("#${id}", {opacity:0}, ${r2(from + len + 0.02)});`);
    tw(`tl.fromTo("#${id} video", {scale:1.2, filter:"brightness(1.3)"}, {scale:1.03, filter:"brightness(1)", duration:${len}, ease:"power2.out"}, ${from});`);
    sound(k % 2 ? "cowbell" : "drum-hit", r2(from - 0.02), 0.1);
  });
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

// ---- tall grass swaying along the bottom edge ------------------------------------------------
// Three clumps of blades, each swaying on its own slow period so the edge never moves in lockstep.
const grass = [];
[0, 1, 2].forEach((c) => {
  const blades = Array.from({ length: 16 }, (_, k) => {
    const x = (k * 67 + c * 23) % 1080;
    const h = 70 + ((k * 37 + c * 19) % 90);
    return `<i class="blade" style="left:${x}px;height:${h}px;transform:rotate(${((k * 13) % 17) - 8}deg)"></i>`;
  }).join("");
  grass.push(`<div id="gr${c}" class="grass g${c}" data-layout-ignore>${blades}</div>`);
  const period = [3.2, 4.1, 5.3][c];
  tw(`tl.fromTo("#gr${c}", {skewX:${c % 2 ? 6 : -6}}, {skewX:${c % 2 ? -6 : 6}, duration:${period}, yoyo:true, repeat:${Math.ceil(total / period)}, ease:"sine.inOut"}, 0);`);
});

// ---- stage chips -------------------------------------------------------------
const dayChips = (sid, idx) => {
  const chips = days.map((x, k) => `<i class="${k < idx ? "done" : k === idx ? "now" : ""}">${esc(x.day)}</i>`).join("");
  return `<div id="${sid}-days" class="days"><small>CHẶNG</small>${chips}</div>`;
};

// ---- scenes -------------------------------------------------------------
for (const s of scenes) {
  const sid = `s-${s.id}`;
  const a = s.start;
  const enter = a + LEAD;
  const parts = [];
  // Where the narrated part ends: a viewing break and a recap may follow.
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
    // The title rises letter by letter like a row of hills out of a line of grass.
    const letters = [...s.caption].map((ch) => (ch === " " ? `<span class="gap"></span>` : `<span class="hill">${esc(ch)}</span>`)).join("");
    parts.push(`<div id="${sid}-tt" class="title-hills" style="opacity:0"><small>${esc(s.kicker)}</small><h1 id="${sid}-h1">${letters}</h1><i id="${sid}-gl" class="grassline"></i><b>${esc(s.label)}</b></div>`);
    tw(`tl.fromTo("#${sid}-tt", {opacity:0}, {opacity:1, duration:0.25}, ${r2(m.after + 0.05)});`);
    tw(`tl.fromTo("#${sid}-gl", {scaleX:0}, {scaleX:1, duration:0.6, ease:"power2.out"}, ${r2(m.after + 0.05)});`);
    tw(`tl.fromTo("#${sid}-h1 .hill", {scaleY:0, opacity:0}, {scaleY:1, opacity:1, duration:0.55, stagger:0.09, ease:"back.out(2.2)"}, ${r2(m.after + 0.2)});`);
    fadeUp(`#${sid}-tt small`, m.after + 0.2);
    fadeUp(`#${sid}-tt b`, m.after + 1.0);
    sound("guitar-strum", r2(m.after), 0.16);
    sound("cowbell", r2(m.after + 0.7), 0.08);
    const lift = s.vo + 3.4;
    tw(`tl.to("#${sid}-tt", {opacity:0, y:-80, duration:0.5, ease:"power2.in"}, ${r2(lift)});`);
    tw(`tl.to("#${sid}-dim", {opacity:0.3, duration:0.6}, ${r2(lift)});`);
  } else if (s.layout === "point") {
    parts.push(photos(s, a, bodyEnd, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div class="floor"></div>`);
    const idx = days.findIndex((x) => x.id === s.id);
    parts.push(watchBadge(sid, s.day, s.badge ?? "", enter + 0.3));
    parts.push(`<div class="head">`);
    parts.push(`<div id="${sid}-kicker" class="kicker">${esc(s.label.toUpperCase())}</div>`);
    parts.push(`<h1 id="${sid}-title" class="title">${words(s.caption)}</h1>`);
    fadeUp(`#${sid}-kicker`, enter, 0.25);
    titleIn(`#${sid}-title`, enter + 0.15);
    (s.points ?? []).forEach((pt, k) => {
      parts.push(`<div id="${sid}-pt${k}" class="point"><i>◆</i>${esc(pt)}</div>`);
      fadeUp(`#${sid}-pt${k}`, enter + 0.8 + k * 0.4);
    });
    parts.push(`</div>`);
    parts.push(dayChips(sid, idx));
    fadeUp(`#${sid}-days`, enter + 0.4);
    if (s.breathe || s.recap) tw(`tl.to("#${sid}-days", {opacity:0, duration:0.3}, ${r2(bodyEnd)});`);
    // The headline block makes way for the footage before the viewing break.
    hideOut(`#${sid} .head`, Math.max(enter + 4, bodyEnd - 0.8));
    tail();
  } else if (s.layout === "extra") {
    // Cards of contour-map paper with a green edge, one per idea, on their cue words; Google Maps proof above them.
    parts.push(photos(s, a, bodyEnd, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div class="floor"></div>`);
    parts.push(`<div class="head"><div id="${sid}-kicker" class="kicker">${esc(s.kicker)}</div><h1 id="${sid}-title" class="title">${words(s.caption)}</h1></div>`);
    fadeUp(`#${sid}-kicker`, enter, 0.25);
    titleIn(`#${sid}-title`, enter + 0.15);
    const stay = s.style === "stay";
    const items = s.items ?? [];
    let prev = enter + Math.min(CLEAR, 1.8);
    const shots = [];
    items.forEach((it, k) => {
      const at = Math.max(cueTime(s, it.cue) ?? prev + 1.5, prev + 0.9);
      prev = at;
      const top = (stay ? 860 : 960) + k * (stay ? 132 : 150);
      const icon = stay ? (it.maps ? "★" : "✦") : "!";
      parts.push(`<div id="${sid}-tg${k}" class="topo-card" style="opacity:0;top:${top}px"><i>${icon}</i><div><b>${esc(it.t)}</b><span>${esc(it.s)}</span></div></div>`);
      // The card unfolds downward from its top edge like a map panel.
      tw(`tl.fromTo("#${sid}-tg${k}", {opacity:0, rotationX:-80, transformOrigin:"50% 0%"}, {opacity:1, rotationX:0, duration:0.5, ease:"back.out(1.4)"}, ${r2(at)});`);
      sound("cowbell", r2(at + 0.05), 0.04);
      for (const m of [].concat(it.maps ?? [])) shots.push([m, at]);
    });
    if (shots.length) {
      // One Google Maps panel; each screenshot slides in on its patch's cue.
      parts.push(`<div id="${sid}-gm" class="gmaps" style="opacity:0"><div class="gmaps-h"><i>📍</i>Google Maps<span>${MAPS_DATE}</span></div><div class="gm-stack">${shots.map(([m], k) => `<img id="${sid}-gm${k}" src="${asset(`videos/doi-bo/maps/${m}.png`)}" alt="" style="opacity:0" />`).join("")}</div></div>`);
      tw(`tl.fromTo("#${sid}-gm", {opacity:0, y:40}, {opacity:1, y:0, duration:0.4, ease:"back.out(1.5)"}, ${r2(shots[0][1])});`);
      // One screenshot at a time: each replaces the previous (two for one patch follow 1.3 s apart).
      const when = [];
      shots.forEach(([, at], k) => when.push(Math.max(at + 0.15, k ? when[k - 1] + 1.3 : 0)));
      shots.forEach((_, k) => {
        tw(`tl.fromTo("#${sid}-gm${k}", {opacity:0, x:60}, {opacity:1, x:0, duration:0.35, ease:"power3.out"}, ${r2(when[k])});`);
        if (k) tw(`tl.to("#${sid}-gm${k - 1}", {opacity:0, duration:0.25}, ${r2(when[k])});`);
      });
      prev = Math.max(prev, when.at(-1));
    }
    const ids = [...items.map((_, k) => `#${sid}-tg${k}`), ...(shots.length ? [`#${sid}-gm`] : [])].join(", ");
    // Cards clear once read, so the footage gets its screen back (user rule 08/11/2026).
    const clear = Math.min(prev + 2.4, bodyEnd - 0.4);
    if (bodyEnd - clear > 1.0) hideOut(ids, clear);
    else tw(`tl.to("${ids}", {opacity:0, duration:0.3}, ${r2(bodyEnd - 0.35)});`);
    hideOut(`#${sid} .head`, Math.max(enter + 4, bodyEnd - 0.8));
    tail();
  } else if (s.layout === "cost") {
    // "Hết bao nhiêu?": a wooden trail signpost. Each cost is an arrow plank knocked onto the post, pointing left and
    // right in turn; the total is the top board.
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div id="${sid}-veil" class="veil" style="opacity:0"></div>`);
    parts.push(`<div class="head"><div id="${sid}-kicker" class="kicker">${esc(s.kicker ?? "")}</div><h1 id="${sid}-title" class="title" style="font-size:86px">${words(s.caption)}</h1></div>`);
    fadeUp(`#${sid}-kicker`, enter, 0.25);
    titleIn(`#${sid}-title`, enter + 0.15);
    const t0 = enter + 0.7;
    tw(`tl.fromTo("#${sid}-veil", {opacity:0}, {opacity:1, duration:0.4}, ${r2(t0 - 0.2)});`);
    const items = s.items ?? [];
    const totalAt = Math.max(cueTime(s, s.totalCue) ?? s.end - 2.6, t0 + 0.6 + items.length * 0.55 + 0.3);
    const step = Math.min(0.75, (totalAt - t0 - 0.9) / Math.max(1, items.length));
    const rows = items.map((it, k) => {
      const at = t0 + 0.5 + k * step;
      const right = k % 2 === 0;
      tw(`tl.fromTo("#${sid}-ln${k}", {opacity:0, x:${right ? 260 : -260}, rotation:${right ? 8 : -8}}, {opacity:1, x:0, rotation:${right ? -2 : 2}, duration:0.4, ease:"back.out(2)"}, ${r2(at)});`);
      sound("wood-knock", r2(at + 0.3), 0.1);
      return `<div id="${sid}-ln${k}" class="plank ${right ? "r" : "l"}" style="opacity:0;top:${170 + k * 128}px"><span>${esc(it.k)}</span><em>${esc(it.v)}</em></div>`;
    }).join("");
    parts.push(`<div id="${sid}-tr" class="signpost" style="opacity:0"><i class="pole"></i><div class="board">⛰ 2N1Đ · 1 NGƯỜI</div>${rows}</div>` +
      `<div id="${sid}-tot" class="tag" style="opacity:0"><span>KHOẢNG</span><b>${esc(s.total)}</b><small>${esc(s.note ?? "")}</small></div>`);
    tw(`tl.fromTo("#${sid}-tr", {opacity:0, y:120}, {opacity:1, y:0, duration:0.45, ease:"power3.out"}, ${r2(t0)});`);
    tw(`tl.fromTo("#${sid}-tot", {opacity:0, scale:0.6, y:40}, {opacity:1, scale:1, y:0, duration:0.5, ease:"back.out(2.2)"}, ${r2(totalAt)});`);
    sound("guitar-strum", r2(totalAt + 0.05), 0.12);
    parts.push(`<div id="${sid}-stamp" class="stamp" style="opacity:0">${esc(s.stamp ?? "")}</div>`);
    tw(`tl.fromTo("#${sid}-stamp", {opacity:0, scale:2.2, rotation:-24}, {opacity:1, scale:1, rotation:-8, duration:0.3, ease:"power4.in"}, ${r2(totalAt + 0.8)});`);
    sound("wood-knock", r2(totalAt + 1.05), 0.1);
  } else {
    // Outro: a summit cairn. Stones are set one on another, the title appears above the stack, then the call to action.
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div class="floor"></div>`);
    const STONES = [[300, 1250, 480, 120], [350, 1150, 380, 104], [400, 1064, 290, 90], [445, 992, 200, 76], [480, 934, 130, 62]];
    STONES.forEach(([x, y, w, h], k) => {
      parts.push(`<i id="${sid}-st${k}" class="stone" style="opacity:0;left:${x}px;top:${y}px;width:${w}px;height:${h}px"></i>`);
      const at = enter + 0.3 + k * 0.32;
      tw(`tl.fromTo("#${sid}-st${k}", {opacity:0, y:-140, rotation:${k % 2 ? 9 : -9}}, {opacity:1, y:0, rotation:${k % 2 ? 2 : -2}, duration:0.35, ease:"bounce.out"}, ${r2(at)});`);
      sound("stone-tap", r2(at + 0.25), 0.08);
    });
    parts.push(`<div id="${sid}-tt" class="outro-t" style="opacity:0"><small>ĐỒI BÒ · TẢ PHÌN · SA PA</small><h1>${words(s.caption)}</h1></div>`);
    tw(`tl.fromTo("#${sid}-tt", {opacity:0, y:60}, {opacity:1, y:0, duration:0.9, ease:"power2.out"}, ${r2(enter + 2.0)});`);
    titleIn(`#${sid}-tt h1`, enter + 2.1);
    sound("guitar-strum", r2(enter + 2.0), 0.14);
    const ctaAt = Math.min(enter + 3.2, s.end - 1.6);
    parts.push(`<div id="${sid}-cta" class="pill cta" style="opacity:0">${esc(s.cta ?? "")}</div>`);
    tw(`tl.fromTo("#${sid}-cta", {opacity:0, scale:0.5}, {opacity:1, scale:1, duration:0.4, ease:"back.out(2.4)"}, ${r2(ctaAt)});`);
    sound("whistle-call", r2(ctaAt), 0.1);
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
mediaTags.push(...breatheAudio);
/**
 * The pastoral bed plays as consecutive pieces so its level can change: loud under the cold open, under the voice
 * otherwise, and almost silent during the viewing breaks so the clips' own sound carries them. Each piece starts where
 * the music would be at that moment, so the track runs on without jumping. The track is ~5.6 dB hotter than the
 * H'Mông one (mean −12.1 vs −17.7 dB), so these levels are about half the Tà Xùa ones.
 */
const musicSrc = asset(video.music.src);
const musicLen = probeDurationSec(path.join(PUBLIC_ROOT, video.music.src));
const COLD = scenes[0].voiceDelay ?? 0;
const levels = [[0, COLD + 0.3, 0.42]];
let cursor = COLD + 0.3;
for (const [at, dur] of BREATHS) {
  levels.push([cursor, at, 0.22], [at, at + dur, 0.03]);
  cursor = at + dur;
}
levels.push([cursor, total, 0.22]);
let piece = 0;
for (const [from, to, vol] of levels) {
  for (let at = from; at < to - 0.05;) {
    const mediaStart = at % (musicLen - 0.5);
    const dur = Math.min(to - at, musicLen - 0.5 - mediaStart);
    const fadeIn = piece ? 0.35 : 0.2;
    mediaTags.push(`<audio id="music-${piece}" src="${musicSrc}" data-start="${r2(at)}" data-media-start="${r2(mediaStart)}" data-duration="${r2(dur + (to < total - 0.1 ? 0.3 : 0))}" data-volume="${vol}" data-fade-in="${fadeIn}" data-fade-out="${to >= total - 0.1 ? 1.5 : 0.35}" data-track-index="${30 + (piece % 2)}"></audio>`);
    piece++;
    at += dur;
  }
}

// ---- shader seams + quiet whooshes -----------------------------------
const SHADERS = ["cross-warp-morph", "whip-pan", "chromatic-radial-split", "light-leak", "ridged-burn"];
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
:root { --ground:#10231a; --ink:#fbf8ef; --grass:#7fb04a; --grass-d:#3f6b2a; --cream:#f4ecd6; --amber:#e0a43c; --sky:#9fd0f0; --wood:#8a5a32; --wood-d:#5c3a1e; --red:#c0392b; }
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:${W}px; height:${H}px; overflow:hidden; background:var(--ground); }
#root { position:relative; width:${W}px; height:${H}px; overflow:hidden; font-family:"Be Vietnam Pro"; }
.scene { position:absolute; inset:0; overflow:hidden; background:var(--ground); z-index:1; perspective:1400px; }
.ph { position:absolute; inset:0; overflow:hidden; }
.ph video { width:100%; height:100%; object-fit:cover; display:block; filter:saturate(1.08) contrast(1.04) brightness(1.02); }
/* Map fold: a soft shadow along the centre crease while the new clip opens out from it. */
.crease { position:absolute; top:0; bottom:0; left:50%; width:90px; margin-left:-45px; z-index:3; pointer-events:none; background:linear-gradient(90deg, rgba(16,35,26,0) 0%, rgba(16,35,26,0.55) 50%, rgba(16,35,26,0) 100%); }
/* Contour rings: the new clip shows through widening topographic rings. */
.rings { --r:0px; -webkit-mask-image:repeating-radial-gradient(circle at 50% 62%, #000 0 var(--r), transparent var(--r) 96px); mask-image:repeating-radial-gradient(circle at 50% 62%, #000 0 var(--r), transparent var(--r) 96px); }
.breathe { z-index:8; }
.cr { position:absolute; left:60px; top:112px; z-index:4; font:600 22px "Be Vietnam Pro"; color:rgba(251,248,239,0.9); text-shadow:0 2px 8px rgba(0,0,0,0.7); }
.cr.orig { top:auto; bottom:250px; left:50%; transform:translateX(-50%); padding:8px 20px; border-radius:999px; background:rgba(16,35,26,0.6); white-space:nowrap; }
.shade { position:absolute; inset:0; background:linear-gradient(180deg, rgba(10,24,16,0.2) 0%, rgba(10,24,16,0) 35%, rgba(10,24,16,0) 65%, rgba(10,24,16,0.35) 100%); }
.top { position:absolute; left:0; right:0; top:0; height:760px; background:linear-gradient(180deg, rgba(16,35,26,0.85) 0%, rgba(16,35,26,0.45) 55%, rgba(16,35,26,0) 100%); }
.floor { position:absolute; left:0; right:0; bottom:0; height:900px; background:linear-gradient(180deg, rgba(16,35,26,0) 0%, rgba(16,35,26,0.6) 45%, rgba(16,35,26,0.93) 100%); }
.veil { position:absolute; inset:0; background:rgba(16,35,26,0.55); }
.hook-dim { position:absolute; inset:0; z-index:4; background:linear-gradient(180deg, rgba(16,35,26,0.35) 0%, rgba(16,35,26,0.05) 45%, rgba(16,35,26,0.8) 100%); }
/* Cold open: the topographic map. */
.black { position:absolute; inset:0; z-index:9; }
.black.topo { background:radial-gradient(ellipse at 60% 40%, #fbf5e2 0%, #f1e6c8 60%, #e2d3a8 100%); }
.topo-svg { position:absolute; left:0; top:0; }
.pin-a { position:absolute; left:120px; top:1400px; padding:10px 22px; border-radius:999px; background:#ffffff; color:var(--wood-d); font:900 40px "Be Vietnam Pro"; box-shadow:0 8px 20px rgba(92,58,30,0.3); }
.summit { position:absolute; left:640px; top:540px; padding:10px 24px; border-radius:16px; background:var(--grass-d); color:#fff; font:900 48px "Be Vietnam Pro"; box-shadow:0 10px 24px rgba(63,107,42,0.45); }
.alt { position:absolute; left:110px; top:220px; color:var(--wood-d); }
.alt small { display:block; font:800 30px "Be Vietnam Pro"; letter-spacing:0.18em; color:var(--red); }
.alt b { font:900 170px/1 "Be Vietnam Pro"; }
.alt em { font:800 60px "Be Vietnam Pro"; font-style:normal; margin-left:10px; }
.map-crease { position:absolute; top:0; bottom:0; left:50%; width:120px; margin-left:-60px; opacity:0; background:linear-gradient(90deg, rgba(92,58,30,0) 0%, rgba(92,58,30,0.45) 50%, rgba(92,58,30,0) 100%); }
/* Title rising like hills from a line of grass. */
.title-hills { position:absolute; left:0; right:0; top:720px; z-index:8; display:flex; flex-direction:column; align-items:center; text-align:center; }
.title-hills small { margin-bottom:64px; padding:6px 18px; border-radius:999px; background:rgba(16,35,26,0.6); font:800 30px "Be Vietnam Pro"; color:var(--amber); letter-spacing:0.16em; }
.title-hills h1 { display:flex; align-items:flex-end; font:900 220px/1 "Be Vietnam Pro"; color:#ffffff; text-shadow:0 10px 40px rgba(16,35,26,0.7); white-space:nowrap; }
.title-hills .hill { display:inline-block; transform-origin:50% 100%; }
.title-hills .gap { display:inline-block; width:60px; }
.grassline { display:block; width:820px; height:16px; margin-top:4px; border-radius:8px; transform-origin:50% 50%; background:repeating-linear-gradient(100deg, var(--grass) 0 10px, var(--grass-d) 10px 16px); box-shadow:0 6px 14px rgba(0,0,0,0.35); }
.title-hills b { margin-top:26px; padding:10px 34px; border-radius:999px; background:var(--grass-d); border:2px solid rgba(251,248,239,0.45); color:var(--ink); font:900 44px "Be Vietnam Pro"; box-shadow:0 10px 24px rgba(0,0,0,0.45); }
.title .w, .outro-t .w { display:inline-block; }
.pill { position:absolute; left:50%; top:1370px; transform:translateX(-50%); font:900 44px "Be Vietnam Pro"; color:var(--wood-d); background:var(--cream); padding:12px 40px; border-radius:999px; white-space:nowrap; z-index:8; }
/* Tall grass along the bottom edge. */
.grass { position:absolute; left:0; right:0; bottom:-10px; height:180px; z-index:15; pointer-events:none; transform-origin:50% 100%; }
.grass.g1 { opacity:0.8; } .grass.g2 { opacity:0.6; }
.blade { position:absolute; bottom:0; width:9px; border-radius:9px 9px 0 0; transform-origin:50% 100%; background:linear-gradient(180deg, rgba(150,190,90,0.9), rgba(40,70,30,0.95)); }
/* Hiking-watch badge. */
.sign { position:absolute; right:60px; top:100px; z-index:6; display:flex; align-items:center; gap:18px; padding:12px 24px 12px 12px; border-radius:80px; background:rgba(16,35,26,0.6); border:2px solid rgba(251,248,239,0.4); box-shadow:0 14px 30px rgba(0,0,0,0.35); }
.watch { --a:0deg; width:128px; height:128px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:conic-gradient(var(--amber) 0 var(--a), rgba(251,248,239,0.18) var(--a) 360deg); }
.watch span { width:104px; height:104px; border-radius:50%; background:#13281d; display:flex; flex-direction:column; align-items:center; justify-content:center; font:900 40px/1 "Be Vietnam Pro"; color:#fff; }
.watch small { font:800 16px "Be Vietnam Pro"; color:var(--grass); letter-spacing:0.12em; margin-bottom:4px; }
.sign em { max-width:300px; font:800 30px/1.2 "Be Vietnam Pro"; font-style:normal; color:var(--ink); }
.head { position:absolute; left:80px; top:330px; width:640px; display:flex; flex-direction:column; gap:10px; z-index:5; }
.kicker { align-self:flex-start; margin-top:6px; padding:4px 14px; border-radius:10px; background:rgba(16,35,26,0.55); font:800 30px "Be Vietnam Pro"; color:var(--amber); }
.title { margin-bottom:10px; font:900 94px/1.04 "Be Vietnam Pro"; color:var(--ink); text-shadow:0 6px 30px rgba(0,0,0,0.55); }
.point { font:600 34px/1.3 "Be Vietnam Pro"; color:rgba(251,248,239,0.95); text-shadow:0 2px 14px rgba(0,0,0,0.75); }
.point i { font-style:normal; color:var(--grass); margin-right:14px; }
/* Stage chips under the subtitles. */
.days { position:absolute; left:0; right:0; top:1680px; z-index:20; display:flex; justify-content:center; align-items:center; gap:14px; }
.days small { font:800 22px "Be Vietnam Pro"; color:rgba(251,248,239,0.75); letter-spacing:0.2em; margin-right:6px; }
.days i { width:54px; height:54px; border-radius:50%; font:900 26px/50px "Be Vietnam Pro"; font-style:normal; text-align:center; color:rgba(251,248,239,0.75); border:2px solid rgba(127,176,74,0.6); background:rgba(16,35,26,0.6); }
.days i.done { background:rgba(127,176,74,0.45); color:var(--ink); }
.days i.now { background:var(--amber); border-color:var(--amber); color:#2a1c08; }
/* Between stages: photos pegged on a wooden fence rail over a meadow sky. */
.recap { position:absolute; inset:0; z-index:9; background:linear-gradient(180deg, #9fd0f0 0%, #cfe8f5 38%, #b8d88a 62%, #7fb04a 80%, #3f6b2a 100%); }
.recap-h { position:absolute; left:80px; right:80px; top:220px; text-align:center; }
.recap-h small { display:block; font:900 30px "Be Vietnam Pro"; color:var(--wood-d); letter-spacing:0.18em; text-transform:uppercase; }
.recap-h b { display:block; margin-top:8px; font:900 88px/1.05 "Be Vietnam Pro"; color:#ffffff; text-shadow:0 6px 24px rgba(40,70,30,0.5); }
.post { position:absolute; top:560px; width:46px; height:1100px; border-radius:10px; background:linear-gradient(90deg, var(--wood-d), var(--wood) 50%, var(--wood-d)); box-shadow:0 10px 20px rgba(0,0,0,0.3); }
.post.p1 { left:30px; } .post.p2 { left:517px; } .post.p3 { right:30px; }
.rail-wood { position:absolute; left:0; right:0; top:620px; height:40px; transform-origin:0 50%; background:linear-gradient(180deg, #a87445, var(--wood) 60%, var(--wood-d)); box-shadow:0 8px 16px rgba(0,0,0,0.3); }
.rail-wood.low { top:1320px; }
.peg { position:absolute; top:640px; width:230px; transform-origin:50% 0%; }
.peg img { width:230px; height:380px; object-fit:cover; display:block; border:8px solid #ffffff; border-bottom-width:40px; box-shadow:0 18px 36px rgba(40,70,30,0.45); }
.peg span { position:absolute; left:12px; bottom:10px; font:700 17px "Be Vietnam Pro"; color:var(--wood-d); }
.clip-peg { position:absolute; left:100px; top:-26px; width:30px; height:70px; border-radius:6px; background:linear-gradient(90deg, #d9b47a, #b88a4e); z-index:2; box-shadow:0 4px 8px rgba(0,0,0,0.3); }
.done { position:absolute; left:50%; top:1560px; transform:translateX(-50%); padding:12px 36px; border-radius:999px; background:#ffffff; color:var(--grass-d); font:900 44px "Be Vietnam Pro"; white-space:nowrap; box-shadow:0 10px 24px rgba(0,0,0,0.4); }
/* Cards of contour-map paper with a green edge. */
.topo-card { position:absolute; left:70px; width:940px; z-index:7; display:flex; align-items:center; gap:24px; padding:18px 28px 18px 22px; border-radius:20px; border-left:16px solid var(--grass-d); background:repeating-radial-gradient(ellipse at 85% 30%, rgba(185,167,122,0) 0 26px, rgba(185,167,122,0.35) 26px 28px), var(--cream); box-shadow:0 14px 30px rgba(0,0,0,0.5); }
.topo-card i { flex:none; width:64px; height:64px; border-radius:50%; background:var(--grass-d); color:#fff; font:900 36px/64px "Be Vietnam Pro"; font-style:normal; text-align:center; }
.topo-card b { display:block; font:900 40px "Be Vietnam Pro"; color:#2a1c08; }
.topo-card span { display:block; font:600 26px "Be Vietnam Pro"; color:#5c4a2a; }
/* Google Maps proof. */
.gmaps { position:absolute; left:220px; width:640px; top:590px; z-index:8; padding:14px 16px 16px; border-radius:22px; background:#ffffff; box-shadow:0 20px 44px rgba(0,0,0,0.55); display:flex; flex-direction:column; gap:10px; }
.gmaps-h { display:flex; align-items:center; gap:10px; font:800 26px "Be Vietnam Pro"; color:#1a73e8; }
.gmaps-h i { font-style:normal; }
.gmaps-h span { margin-left:auto; font:600 20px "Be Vietnam Pro"; color:#5f6368; }
.gm-stack { position:relative; height:204px; }
.gmaps img { position:absolute; left:0; top:0; width:100%; display:block; border-radius:10px; border:1px solid #e3e3e3; }
/* Cost: a wooden trail signpost. */
.signpost { position:absolute; left:60px; right:60px; top:560px; height:820px; z-index:7; }
.pole { position:absolute; left:50%; top:20px; bottom:-60px; width:50px; margin-left:-25px; border-radius:10px; background:linear-gradient(90deg, var(--wood-d), var(--wood) 50%, var(--wood-d)); box-shadow:0 14px 30px rgba(0,0,0,0.5); }
.board { position:absolute; left:110px; right:110px; top:40px; padding:18px; border-radius:14px; text-align:center; background:linear-gradient(180deg, #a87445, var(--wood)); border:4px solid var(--wood-d); color:#fff6e0; font:900 38px "Be Vietnam Pro"; letter-spacing:0.06em; box-shadow:0 10px 24px rgba(0,0,0,0.45); }
.plank { position:absolute; width:700px; height:104px; display:flex; align-items:center; justify-content:space-between; gap:20px; padding:0 70px 0 40px; background:linear-gradient(180deg, #f0d9a8, #dcb878); color:#2a1c08; box-shadow:0 10px 20px rgba(0,0,0,0.45); }
.plank.r { left:220px; clip-path:polygon(0 0, 90% 0, 100% 50%, 90% 100%, 0 100%); }
.plank.l { left:40px; padding:0 40px 0 80px; clip-path:polygon(10% 0, 100% 0, 100% 100%, 10% 100%, 0 50%); }
.plank span { font:700 30px "Be Vietnam Pro"; }
.plank em { flex:none; font:900 34px "Be Vietnam Pro"; font-style:normal; color:var(--red); }
.tag { position:absolute; left:150px; right:150px; top:1260px; z-index:8; padding:22px 30px 20px; border-radius:20px; background:var(--grass-d); color:#fff; text-align:center; border:4px solid var(--cream); box-shadow:0 18px 36px rgba(0,0,0,0.5); }
.tag span { display:block; font:900 24px "Be Vietnam Pro"; letter-spacing:0.14em; color:var(--amber); }
.tag b { display:block; font:900 72px/1.05 "Be Vietnam Pro"; }
.tag small { display:block; margin-top:6px; font:600 21px/1.3 "Be Vietnam Pro"; color:rgba(251,248,239,0.85); }
.stamp { position:absolute; left:680px; top:400px; z-index:9; padding:8px 18px; border:5px solid var(--red); border-radius:12px; color:var(--red); font:900 24px "Be Vietnam Pro"; background:rgba(251,245,226,0.95); }
/* Outro: the summit cairn. */
.stone { position:absolute; z-index:6; border-radius:48% 52% 44% 56% / 60% 58% 42% 40%; background:radial-gradient(ellipse at 35% 30%, #c9c4b8 0%, #8f8a7e 55%, #5e5a52 100%); box-shadow:0 10px 18px rgba(0,0,0,0.45); }
.outro-t { position:absolute; left:60px; right:60px; top:500px; z-index:8; text-align:center; }
.outro-t small { display:block; font:900 30px "Be Vietnam Pro"; color:var(--amber); letter-spacing:0.16em; text-shadow:0 2px 10px rgba(16,35,26,0.7); }
.outro-t h1 { margin-top:10px; font:900 128px/1.02 "Be Vietnam Pro"; color:var(--ink); text-shadow:0 8px 30px rgba(16,35,26,0.8); }
.pill.cta { top:1400px; font-size:64px; padding:18px 56px; background:var(--grass-d); color:#fff; border:3px solid rgba(251,248,239,0.6); }
.brand { position:absolute; left:60px; top:60px; z-index:21; font:800 26px "Be Vietnam Pro"; letter-spacing:0.2em; color:rgba(251,248,239,0.92); text-shadow:0 2px 10px rgba(0,0,0,0.5); }
.brand b { color:var(--grass); letter-spacing:0; margin-right:12px; }
.cap { position:absolute; left:60px; right:60px; top:1500px; text-align:center; font:800 50px/1.25 "Be Vietnam Pro"; color:#ffffff; text-shadow:0 3px 0 rgba(0,0,0,0.55), 0 0 22px rgba(0,0,0,0.85); z-index:20; }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="${W}" data-height="${H}">
${mediaTags.join("\n")}
${sfx.join("\n")}
${html.join("\n")}
${grass.join("\n")}
<div class="brand" data-layout-ignore><b>⛰</b>${esc(video.theme.brand)}</div>
${caps.join("\n")}
</div>
<script>
const tl = gsap.timeline({ paused: true });
${js.join("\n")}
HyperShader.init({
  bgColor: "#10231a",
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
