#!/usr/bin/env node
/**
 * node hf/build-tx.mjs --slug ta-xua-san-may [--cover]
 *
 * Turns data/videos/<slug>/video.json + voiceover.json into a HyperFrames project at build/<slug>/.
 * The look ("Tà Xùa: săn thác mây", 23/11/2026), new for this channel (checked against
 * D:/Thang_space_archive/STYLE-LOG.md), built around clouds and the sound of the H'Mông highlands:
 *   - cold open: a night-indigo screen with the cloud-hunting tip as a weather card ("21:00 · độ ẩm > 85% · gió
 *     < 5 km/h"), a 05:00 alarm rings, a bank of cloud bursts over the screen and parts on four clips cut on drum hits
 *     over the self-made H'Mông track (khèn, đàn môi, sáo); the title "TÀ XÙA" is uncovered as a cloud drifts off it;
 *   - pictures change by a "cloud wipe" (a soft white band blows across with a gust) or by "khèn pipes" (the new clip
 *     grows in through vertical reed-pipe slats with a jaw-harp twang);
 *   - wisps of cloud drift slowly across the top and bottom of the frame the whole way through;
 *   - each stage gets a weather-app pill ("☁ CHẶNG n", a humidity bar filling past 85%) that slides down out of a blur;
 *   - viewing breaks (user request 22/11/2026): after the narrator says "Sau đây là vài thước phim…", TikTok clips of
 *     the place play with their ORIGINAL sound, the music dropped almost to silence, no text but a small credit;
 *   - between stages, an elevation profile draws itself and four photos pop up on its peaks (user request 20/11/2026);
 *   - "Ăn gì, ở đâu?" and "Nói thật nè" are indigo cloth patches with stitched edges, with Google Maps proof;
 *   - "Hết bao nhiêu?" is a backpack: each cost is a patch stitched onto it, the total on a swinging luggage tag;
 *   - outro: a sea of cloud rises from the bottom, the title floats on it with "Lưu lại nhé!";
 *   - shader seams: swirl-vortex, sdf-iris, light-leak, flash-through-white, domain-warp-dissolve.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fail, parseArgs, requireSlug } from "../scripts/lib/args.mjs";
import { probeDurationSec } from "../scripts/lib/media.mjs";
import { PROJECT_ROOT, PUBLIC_ROOT } from "../scripts/lib/paths.mjs";

const { flags } = parseArgs(process.argv.slice(2));
const slug = requireSlug(flags, "build-tx");
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
 * Footage stack. Odd changes: a "cloud wipe", a soft white band blows across from the left and the new clip is
 * uncovered behind it. Even changes: "khèn pipes", the new clip grows in through vertical reed-pipe slats.
 */
const photos = (s, from, to, idPrefix) => {
  const g = s.gallery ?? [];
  const seg = (to - from) / g.length;
  const parts = [];
  g.forEach((src, k) => {
    const id = `${idPrefix}-p${k}`;
    const a = r2(from + seg * k);
    tw(`tl.fromTo("#${id} video", {scale:1.12, x:-20}, {scale:1.03, x:20, duration:${r2(seg + 0.8)}, ease:"none"}, ${a});`);
    const inner = media(src, id, a - 0.9, seg + 1.8) + creditTag(src);
    if (k === 0) return parts.push(`<div id="${id}" class="ph">${inner}</div>`);
    if (k % 2 === 1) {
      tw(`tl.set("#${id}", {"--c":"-30%"}, 0);`);
      tw(`tl.fromTo("#${id}", {"--c":"-30%"}, {"--c":"130%", duration:0.9, ease:"power1.inOut", immediateRender:false}, ${r2(a - 0.45)});`);
      tw(`tl.fromTo("#${id}-band", {xPercent:-160, opacity:0.95}, {xPercent:160, opacity:0.95, duration:0.9, ease:"power1.inOut", immediateRender:false}, ${r2(a - 0.45)});`);
      tw(`tl.set("#${id}-band", {opacity:0}, ${r2(a + 0.47)});`);
      tw(`tl.set("#${idPrefix}-p${k - 1}", {opacity:0}, ${r2(a + 0.47)});`);
      sound("wind-gust", r2(a - 0.55), 0.06);
      return parts.push(`<div id="${id}" class="ph wipe">${inner}</div><i id="${id}-band" class="cloudband" style="opacity:0"></i>`);
    }
    tw(`tl.set("#${id}", {"--s":"0px"}, 0);`);
    tw(`tl.fromTo("#${id}", {"--s":"0px"}, {"--s":"180px", duration:0.6, ease:"power2.inOut", immediateRender:false}, ${r2(a - 0.3)});`);
    tw(`tl.fromTo("#${id}", {yPercent:4}, {yPercent:0, duration:0.6, ease:"power2.out", immediateRender:false}, ${r2(a - 0.3)});`);
    tw(`tl.set("#${idPrefix}-p${k - 1}", {opacity:0}, ${r2(a + 0.32)});`);
    sound("jaw-twang", r2(a - 0.3), 0.04);
    parts.push(`<div id="${id}" class="ph pipes">${inner}</div>`);
  });
  return parts.join("");
};

const titleIn = (sel, at) =>
  tw(`tl.fromTo("${sel} .w", {opacity:0, y:30, filter:"blur(10px)"}, {opacity:1, y:0, filter:"blur(0px)", duration:0.5, stagger:0.07, ease:"power3.out"}, ${r2(at)});`);
const fadeUp = (sel, at, dur = 0.35) =>
  tw(`tl.fromTo("${sel}", {opacity:0, y:26}, {opacity:1, y:0, duration:${dur}, ease:"expo.out"}, ${r2(at)});`);
const hideOut = (sel, at) => tw(`tl.to("${sel}", {opacity:0, y:30, duration:0.4, ease:"power2.in"}, ${r2(at)});`);

// ---- weather-app badge -------------------------------------------------------------
/** A frosted weather pill slides down out of a blur: a bobbing cloud, "CHẶNG n", the note, a humidity bar filling. */
const weatherBadge = (sid, day, note, at) => {
  tw(`tl.fromTo("#${sid}-sign", {opacity:0, y:-60, filter:"blur(14px)"}, {opacity:1, y:0, filter:"blur(0px)", duration:0.55, ease:"power3.out"}, ${r2(at)});`);
  tw(`tl.fromTo("#${sid}-sign .wx-ico", {y:0}, {y:-8, duration:0.9, yoyo:true, repeat:5, ease:"sine.inOut", immediateRender:false}, ${r2(at + 0.4)});`);
  tw(`tl.fromTo("#${sid}-hum", {scaleX:0}, {scaleX:0.88, duration:1.1, ease:"power2.out"}, ${r2(at + 0.45)});`);
  sound("jaw-twang", r2(at + 0.1), 0.06);
  return `<div id="${sid}-sign" class="sign" style="opacity:0"><i class="wx-ico">☁</i><span><strong>CHẶNG ${esc(day)}</strong>${esc(note)}<em class="hum"><i id="${sid}-hum"></i></em></span></div>`;
};

// Google Maps screenshots (name + stars + review count), captured 23/11/2026 into public/videos/ta-xua/maps.
const MAPS_DATE = "chụp 23/11/2026";

// ---- between stages: an elevation profile with four photos on its peaks ---------------------------
// Peak x positions on the 1080-wide profile and their heights (y of the summit), left to right.
const PEAKS = [[175, 1270], [420, 1150], [665, 1235], [905, 1110]];
const PROFILE = "M0,1420 L60,1380 L120,1320 L175,1270 L240,1340 L300,1300 L360,1210 L420,1150 L490,1250 L560,1290 L620,1260 L665,1235 L730,1300 L790,1240 L850,1170 L905,1110 L970,1220 L1030,1300 L1080,1340";
const recap = (s, sid, from) => {
  const list = s.recap;
  tw(`tl.fromTo("#${sid}-rc", {opacity:0}, {opacity:1, duration:0.3, ease:"power1.out"}, ${r2(from)});`);
  fadeUp(`#${sid}-rc-h`, from + 0.1);
  tw(`tl.fromTo("#${sid}-line", {strokeDashoffset:2200}, {strokeDashoffset:0, duration:1.3, ease:"power1.inOut"}, ${r2(from + 0.15)});`);
  tw(`tl.fromTo("#${sid}-fill", {opacity:0}, {opacity:1, duration:0.8}, ${r2(from + 0.6)});`);
  const cards = list.map((name, k) => {
    const [x, y] = PEAKS[k];
    const t0 = from + 0.35 + k * 0.3;
    tw(`tl.fromTo("#${sid}-rp${k}", {opacity:0, y:60, scale:0.6}, {opacity:1, y:0, scale:1, duration:0.45, ease:"back.out(1.8)"}, ${r2(t0)});`);
    sound("horse-bell", r2(t0 + 0.05), 0.05);
    const who = handle(`videos/ta-xua/footage/${name}.mp4`);
    return `<div id="${sid}-rp${k}" class="peak" style="opacity:0;left:${x - 110}px;top:${y - 500}px"><img src="${asset(`videos/ta-xua/recap/${name}.jpg`)}" alt="" /><span>${esc(who)}</span><i class="pin"></i></div>`;
  }).join("");
  const doneAt = from + 0.35 + list.length * 0.3 + 0.35;
  tw(`tl.fromTo("#${sid}-done", {opacity:0, scale:1.8, rotation:-14}, {opacity:1, scale:1, rotation:-6, duration:0.3, ease:"power4.in"}, ${r2(doneAt)});`);
  sound("flute-call", r2(doneAt + 0.1), 0.06);
  return `<div id="${sid}-rc" class="recap" style="opacity:0"><div id="${sid}-rc-h" class="recap-h"><small>${esc(s.recapLabel ?? "")}</small><b>${esc(s.caption)}</b></div>` +
    `<svg class="profile" viewBox="0 0 1080 1920" width="1080" height="1920"><path id="${sid}-fill" d="${PROFILE} L1080,1920 L0,1920 Z" fill="url(#mtn-${sid})" opacity="0"/>` +
    `<path id="${sid}-line" d="${PROFILE}" fill="none" stroke="#e8f4ff" stroke-width="6" stroke-linejoin="round" stroke-dasharray="2200" stroke-dashoffset="2200"/>` +
    `<defs><linearGradient id="mtn-${sid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d5a9e"/><stop offset="1" stop-color="#0e1530"/></linearGradient></defs></svg>` +
    `${cards}<div id="${sid}-done" class="done" style="opacity:0">ĐÃ SĂN ✓</div></div>`;
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
 * Night indigo: the cloud-hunting tip types out as a weather card, a 05:00 alarm rings, a bank of cloud bursts over
 * the screen and parts on four clips cut on drum hits; the hook's clips follow under the title.
 */
const coldOpen = (s, sid) => {
  const cold = s.cold ?? [];
  const COLD = s.voiceDelay ?? 0;
  const black = 1.7;
  const len = r2((COLD - black) / Math.max(1, cold.length));
  const parts = [];
  const stars = Array.from({ length: 26 }, (_, k) => `<i class="star" style="left:${(k * 211) % 1040 + 20}px;top:${(k * 337) % 1500 + 80}px"></i>`).join("");
  parts.push(`<div id="${sid}-black" class="black">${stars}<div id="${sid}-wx" class="wx-card"><small>MẸO SĂN MÂY</small><b>21:00</b>` +
    `<p id="${sid}-wx1">💧 độ ẩm &gt; 85%</p><p id="${sid}-wx2">🍃 gió &lt; 5 km/h</p><div id="${sid}-alarm" class="alarm">⏰ 05:00</div></div>` +
    `<i id="${sid}-burst" class="burst"></i></div>`);
  tw(`tl.fromTo("#${sid}-wx", {opacity:0, y:40, filter:"blur(10px)"}, {opacity:1, y:0, filter:"blur(0px)", duration:0.35, ease:"power3.out"}, 0.05);`);
  fadeUp(`#${sid}-wx1`, 0.3, 0.25);
  fadeUp(`#${sid}-wx2`, 0.5, 0.25);
  tw(`tl.fromTo("#${sid}-alarm", {opacity:0, scale:0.5}, {opacity:1, scale:1, duration:0.2, ease:"back.out(3)"}, 0.8);`);
  tw(`tl.fromTo("#${sid}-alarm", {rotation:-6}, {rotation:6, duration:0.05, yoyo:true, repeat:7, ease:"none", immediateRender:false}, 0.95);`);
  sound("alarm-ring", 0.85, 0.12);
  // The cloud bank bursts out from the card, whites out the screen, then parts on the first clip.
  tw(`tl.fromTo("#${sid}-burst", {scale:0.1, opacity:0}, {scale:3.2, opacity:1, duration:0.45, ease:"power2.in"}, ${r2(black - 0.5)});`);
  sound("wind-gust", r2(black - 0.6), 0.12);
  tw(`tl.to("#${sid}-black", {opacity:0, duration:0.35, ease:"power1.out"}, ${r2(black - 0.05)});`);
  cold.forEach((src, k) => {
    const id = `${sid}-k${k}`;
    const from = r2(black + k * len);
    parts.push(`<div id="${id}" class="ph" style="opacity:0">${media(src, id, from - 0.1, len + 0.4)}${creditTag(src)}</div>`);
    tw(`tl.set("#${id}", {opacity:1}, ${from});`);
    tw(`tl.set("#${id}", {opacity:0}, ${r2(from + len + 0.02)});`);
    tw(`tl.fromTo("#${id} video", {scale:1.2, filter:"brightness(1.35)"}, {scale:1.03, filter:"brightness(1)", duration:${len}, ease:"power2.out"}, ${from});`);
    sound("drum-hit", r2(from - 0.02), 0.12);
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

// ---- cloud wisps drifting across the top and bottom ------------------------------------------------
const wisps = [];
const WISP = [[120, 520, 150, 0.22, 38], [330, 380, 110, 0.16, 52], [1580, 640, 170, 0.2, 44], [1760, 460, 130, 0.24, 34], [900, 300, 90, 0.1, 60]];
WISP.forEach(([y, w, h, op, cross], k) => {
  wisps.push(`<i id="ws${k}" class="wisp" style="top:${y}px;width:${w}px;height:${h}px;opacity:${op}" data-layout-ignore></i>`);
  for (let at = (k * 5) % 12, n = 0; at < total; at += cross, n++) {
    tw(`tl.fromTo("#ws${k}", {x:${k % 2 ? 1180 : -w - 100}}, {x:${k % 2 ? -w - 100 : 1180}, duration:${cross}, ease:"none", immediateRender:${n === 0}}, ${r2(at)});`);
  }
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
    // The title sits under a drifting cloud: the cloud slides off to the right and uncovers the letters behind it.
    parts.push(`<div id="${sid}-tt" class="title-cloud" style="opacity:0"><small>${esc(s.kicker)}</small><h1 id="${sid}-h1">${words(s.caption)}</h1><i id="${sid}-tcl" class="tcloud"></i><b>${esc(s.label)}</b></div>`);
    tw(`tl.fromTo("#${sid}-tt", {opacity:0}, {opacity:1, duration:0.3}, ${r2(m.after + 0.05)});`);
    tw(`tl.fromTo("#${sid}-h1", {"--m":"-20%"}, {"--m":"120%", duration:1.1, ease:"power2.inOut"}, ${r2(m.after + 0.1)});`);
    tw(`tl.fromTo("#${sid}-tcl", {x:-420, opacity:1}, {x:900, opacity:0.2, duration:1.5, ease:"power2.inOut"}, ${r2(m.after + 0.05)});`);
    tw(`tl.fromTo("#${sid}-h1", {scale:1.18}, {scale:1, duration:1.4, ease:"power3.out"}, ${r2(m.after + 0.1)});`);
    fadeUp(`#${sid}-tt small`, m.after + 0.2);
    fadeUp(`#${sid}-tt b`, m.after + 1.0);
    sound("khen-swell", r2(m.after), 0.16);
    const lift = s.vo + 3.4;
    tw(`tl.to("#${sid}-tt", {opacity:0, y:-80, duration:0.5, ease:"power2.in"}, ${r2(lift)});`);
    tw(`tl.to("#${sid}-dim", {opacity:0.3, duration:0.6}, ${r2(lift)});`);
  } else if (s.layout === "point") {
    parts.push(photos(s, a, bodyEnd, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div class="floor"></div>`);
    const idx = days.findIndex((x) => x.id === s.id);
    parts.push(weatherBadge(sid, s.day, s.badge ?? "", enter + 0.3));
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
    // Indigo cloth patches with stitched edges, one per idea, on their cue words; Google Maps proof above them.
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
      parts.push(`<div id="${sid}-tg${k}" class="patch" style="opacity:0;top:${top}px"><i>${icon}</i><div><b>${esc(it.t)}</b><span>${esc(it.s)}</span></div></div>`);
      // The patch is "stitched" on: it unrolls from the left edge while the stitch line runs round it.
      tw(`tl.fromTo("#${sid}-tg${k}", {opacity:0, clipPath:"inset(0 100% 0 0 round 22px)"}, {opacity:1, clipPath:"inset(0 0% 0 0 round 22px)", duration:0.5, ease:"power2.out"}, ${r2(at)});`);
      sound("horse-bell", r2(at + 0.05), 0.05);
      for (const m of [].concat(it.maps ?? [])) shots.push([m, at]);
    });
    if (shots.length) {
      // One Google Maps panel; each screenshot slides in on its patch's cue.
      parts.push(`<div id="${sid}-gm" class="gmaps" style="opacity:0"><div class="gmaps-h"><i>📍</i>Google Maps<span>${MAPS_DATE}</span></div><div class="gm-stack">${shots.map(([m], k) => `<img id="${sid}-gm${k}" src="${asset(`videos/ta-xua/maps/${m}.png`)}" alt="" style="opacity:0" />`).join("")}</div></div>`);
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
    // "Hết bao nhiêu?": a backpack. Each cost is a patch stitched onto its front; the total hangs on a luggage tag.
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
      tw(`tl.fromTo("#${sid}-ln${k}", {opacity:0, clipPath:"inset(0 100% 0 0 round 18px)"}, {opacity:1, clipPath:"inset(0 0% 0 0 round 18px)", duration:0.4, ease:"power2.out"}, ${r2(at)});`);
      sound("horse-bell", r2(at + 0.1), 0.07);
      return `<div id="${sid}-ln${k}" class="bp-row" style="opacity:0"><span>${esc(it.k)}</span><em>${esc(it.v)}</em></div>`;
    }).join("");
    parts.push(`<div id="${sid}-tr" class="pack" style="opacity:0"><i class="strap s1"></i><i class="strap s2"></i><div class="flap">🎒 BA LÔ 2N1Đ</div>${rows}</div>` +
      `<div id="${sid}-tot" class="tag" style="opacity:0"><i class="hole"></i><span>KHOẢNG</span><b>${esc(s.total)}</b><small>${esc(s.note ?? "")}</small></div>`);
    tw(`tl.fromTo("#${sid}-tr", {opacity:0, y:80}, {opacity:1, y:0, duration:0.45, ease:"back.out(1.4)"}, ${r2(t0)});`);
    tw(`tl.fromTo("#${sid}-tot", {opacity:0, rotation:-28, y:-60}, {opacity:1, rotation:0, y:0, duration:0.9, ease:"elastic.out(1,0.4)"}, ${r2(totalAt)});`);
    sound("flute-call", r2(totalAt + 0.05), 0.09);
    parts.push(`<div id="${sid}-stamp" class="stamp" style="opacity:0">${esc(s.stamp ?? "")}</div>`);
    tw(`tl.fromTo("#${sid}-stamp", {opacity:0, scale:2.2, rotation:-24}, {opacity:1, scale:1, rotation:-8, duration:0.3, ease:"power4.in"}, ${r2(totalAt + 0.8)});`);
    sound("drum-hit", r2(totalAt + 1.05), 0.08);
  } else {
    // Outro: a sea of cloud rises from the bottom in three layers; the title floats on it, then the call to action.
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div>`);
    [0, 1, 2].forEach((k) => {
      parts.push(`<i id="${sid}-sea${k}" class="sea l${k}" style="opacity:0"></i>`);
      tw(`tl.fromTo("#${sid}-sea${k}", {opacity:0, yPercent:60}, {opacity:1, yPercent:0, duration:${1.6 + k * 0.4}, ease:"power2.out"}, ${r2(enter + k * 0.25)});`);
      tw(`tl.fromTo("#${sid}-sea${k}", {x:0}, {x:${k % 2 ? -90 : 90}, duration:${r2(s.end - enter)}, ease:"sine.inOut", immediateRender:false}, ${r2(enter)});`);
    });
    parts.push(`<div id="${sid}-tt" class="outro-t" style="opacity:0"><small>TÀ XÙA · BẮC YÊN · SƠN LA</small><h1>${words(s.caption)}</h1></div>`);
    tw(`tl.fromTo("#${sid}-tt", {opacity:0, y:60}, {opacity:1, y:0, duration:0.9, ease:"power2.out"}, ${r2(enter + 0.6)});`);
    tw(`tl.fromTo("#${sid}-tt", {y:0}, {y:-14, duration:1.6, yoyo:true, repeat:${Math.ceil((s.end - enter) / 1.6)}, ease:"sine.inOut", immediateRender:false}, ${r2(enter + 1.5)});`);
    titleIn(`#${sid}-tt h1`, enter + 0.7);
    sound("khen-swell", r2(enter + 0.5), 0.14);
    const ctaAt = Math.min(enter + 2.6, s.end - 1.6);
    parts.push(`<div id="${sid}-cta" class="pill cta" style="opacity:0">${esc(s.cta ?? "")}</div>`);
    tw(`tl.fromTo("#${sid}-cta", {opacity:0, scale:0.5}, {opacity:1, scale:1, duration:0.4, ease:"back.out(2.4)"}, ${r2(ctaAt)});`);
    sound("flute-call", r2(ctaAt), 0.1);
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
 * The H'Mông bed plays as consecutive pieces so its level can change: loud under the cold open, under the voice
 * otherwise, and almost silent during the viewing breaks so the clips' own sound carries them. Each piece starts where
 * the music would be at that moment, so the track runs on without jumping.
 */
const musicSrc = asset(video.music.src);
const musicLen = probeDurationSec(path.join(PUBLIC_ROOT, video.music.src));
const COLD = scenes[0].voiceDelay ?? 0;
const levels = [[0, COLD + 0.3, 0.8]];
let cursor = COLD + 0.3;
for (const [at, dur] of BREATHS) {
  levels.push([cursor, at, 0.42], [at, at + dur, 0.05]);
  cursor = at + dur;
}
levels.push([cursor, total, 0.42]);
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
const SHADERS = ["swirl-vortex", "sdf-iris", "light-leak", "flash-through-white", "domain-warp-dissolve"];
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
:root { --ground:#0e1530; --ink:#f7fbff; --sky:#7fb6d9; --sky-l:#e8f4ff; --sun:#ffc98a; --indigo:#22306b; --indigo-d:#141c45; --rose:#e0457b; }
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:${W}px; height:${H}px; overflow:hidden; background:var(--ground); }
#root { position:relative; width:${W}px; height:${H}px; overflow:hidden; font-family:"Be Vietnam Pro"; }
.scene { position:absolute; inset:0; overflow:hidden; background:var(--ground); z-index:1; }
.ph { position:absolute; inset:0; overflow:hidden; }
.ph video { width:100%; height:100%; object-fit:cover; display:block; filter:saturate(1.06) contrast(1.04) brightness(1.02); }
/* Cloud wipe: the new clip is uncovered left to right behind a soft white band. */
.wipe { --c:-30%; -webkit-mask-image:linear-gradient(90deg, #000 var(--c), transparent calc(var(--c) + 18%)); mask-image:linear-gradient(90deg, #000 var(--c), transparent calc(var(--c) + 18%)); }
.cloudband { position:absolute; top:-200px; bottom:-200px; left:20%; width:620px; z-index:3; pointer-events:none; background:radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.95) 0%, rgba(240,247,255,0.8) 35%, rgba(240,247,255,0) 70%); filter:blur(18px); }
/* Khèn pipes: the new clip grows in through vertical reed-pipe slats. */
.pipes { --s:0px; -webkit-mask-image:repeating-linear-gradient(90deg, #000 0 var(--s), transparent var(--s) 180px); mask-image:repeating-linear-gradient(90deg, #000 0 var(--s), transparent var(--s) 180px); }
.breathe { z-index:8; }
.cr { position:absolute; left:60px; top:112px; z-index:4; font:600 22px "Be Vietnam Pro"; color:rgba(247,251,255,0.88); text-shadow:0 2px 8px rgba(0,0,0,0.7); }
.cr.orig { top:auto; bottom:250px; left:50%; transform:translateX(-50%); padding:8px 20px; border-radius:999px; background:rgba(14,21,48,0.55); white-space:nowrap; }
.shade { position:absolute; inset:0; background:linear-gradient(180deg, rgba(10,16,40,0.2) 0%, rgba(10,16,40,0) 35%, rgba(10,16,40,0) 65%, rgba(10,16,40,0.35) 100%); }
.top { position:absolute; left:0; right:0; top:0; height:760px; background:linear-gradient(180deg, rgba(14,21,48,0.85) 0%, rgba(14,21,48,0.45) 55%, rgba(14,21,48,0) 100%); }
.floor { position:absolute; left:0; right:0; bottom:0; height:900px; background:linear-gradient(180deg, rgba(14,21,48,0) 0%, rgba(14,21,48,0.6) 45%, rgba(14,21,48,0.93) 100%); }
.veil { position:absolute; inset:0; background:rgba(14,21,48,0.55); }
.hook-dim { position:absolute; inset:0; z-index:4; background:linear-gradient(180deg, rgba(14,21,48,0.35) 0%, rgba(14,21,48,0.05) 45%, rgba(14,21,48,0.8) 100%); }
/* Cold open: night sky, the weather card, the cloud burst. */
.black { position:absolute; inset:0; z-index:9; background:radial-gradient(ellipse at 50% 40%, #1c2a63 0%, #0e1530 60%, #070b1c 100%); display:flex; align-items:center; justify-content:center; }
.star { position:absolute; width:4px; height:4px; border-radius:50%; background:#fff; opacity:0.6; box-shadow:0 0 6px #cfe3ff; }
.wx-card { position:relative; width:700px; padding:40px 50px 44px; border-radius:44px; background:rgba(232,244,255,0.14); border:2px solid rgba(232,244,255,0.35); text-align:left; box-shadow:0 30px 70px rgba(0,0,0,0.45); }
.wx-card small { font:800 30px "Be Vietnam Pro"; color:var(--sky); letter-spacing:0.14em; }
.wx-card b { display:block; font:900 170px/1 "Be Vietnam Pro"; color:var(--ink); }
.wx-card p { margin-top:10px; font:700 48px "Be Vietnam Pro"; color:var(--sky-l); }
.alarm { position:absolute; right:40px; top:40px; padding:12px 26px; border-radius:999px; background:var(--sun); color:#3a2208; font:900 46px "Be Vietnam Pro"; }
.burst { position:absolute; left:50%; top:50%; width:900px; height:900px; margin:-450px 0 0 -450px; border-radius:50%; opacity:0; background:radial-gradient(circle, #ffffff 0%, #f4f9ff 40%, rgba(244,249,255,0.85) 60%, rgba(244,249,255,0) 72%); filter:blur(10px); }
/* Title uncovered by a drifting cloud. */
.title-cloud { position:absolute; left:0; right:0; top:720px; z-index:8; display:flex; flex-direction:column; align-items:center; text-align:center; }
.title-cloud small { position:relative; z-index:2; margin-bottom:28px; padding:6px 18px; border-radius:999px; background:rgba(14,21,48,0.55); font:800 30px "Be Vietnam Pro"; color:var(--sun); letter-spacing:0.16em; }
.title-cloud h1 { --m:-20%; margin-top:6px; font:900 220px/1 "Be Vietnam Pro"; color:#ffffff; text-shadow:0 0 50px rgba(127,182,217,0.8), 0 10px 40px rgba(10,16,40,0.6); -webkit-mask-image:linear-gradient(90deg, #000 var(--m), transparent calc(var(--m) + 25%)); mask-image:linear-gradient(90deg, #000 var(--m), transparent calc(var(--m) + 25%)); white-space:nowrap; }
.tcloud { position:absolute; left:0; top:-60px; width:760px; height:380px; border-radius:50%; background:radial-gradient(ellipse, rgba(255,255,255,0.95) 0%, rgba(240,247,255,0.7) 45%, rgba(240,247,255,0) 70%); filter:blur(14px); }
.title-cloud b { margin-top:26px; padding:10px 34px; border-radius:999px; background:var(--indigo); border:2px solid rgba(232,244,255,0.4); color:var(--ink); font:900 44px "Be Vietnam Pro"; box-shadow:0 10px 24px rgba(0,0,0,0.45); }
.title .w, .title-cloud .w, .outro-t .w { display:inline-block; }
.pill { position:absolute; left:50%; top:1370px; transform:translateX(-50%); font:900 44px "Be Vietnam Pro"; color:var(--indigo-d); background:var(--sky-l); padding:12px 40px; border-radius:999px; white-space:nowrap; z-index:8; }
/* Cloud wisps drifting over everything. */
.wisp { position:absolute; left:0; z-index:15; pointer-events:none; border-radius:50%; background:radial-gradient(ellipse, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.4) 45%, rgba(255,255,255,0) 70%); filter:blur(16px); }
/* Weather-app badge. */
.sign { position:absolute; right:60px; top:100px; z-index:6; display:flex; align-items:center; gap:16px; padding:14px 24px 14px 18px; border-radius:30px; background:rgba(20,28,69,0.55); border:2px solid rgba(232,244,255,0.45); box-shadow:0 14px 30px rgba(0,0,0,0.35); }
.wx-ico { font-style:normal; font-size:74px; line-height:1; color:#fff; text-shadow:0 0 20px rgba(127,182,217,0.9); }
.sign span { font:700 24px "Be Vietnam Pro"; color:rgba(247,251,255,0.9); }
.sign span strong { display:block; font:900 42px/1.05 "Be Vietnam Pro"; color:#fff; }
.hum { display:block; margin-top:8px; width:220px; height:10px; border-radius:5px; background:rgba(255,255,255,0.2); overflow:hidden; }
.hum i { display:block; height:100%; background:linear-gradient(90deg, var(--sky), #ffffff); transform-origin:0 50%; }
.head { position:absolute; left:80px; top:330px; width:640px; display:flex; flex-direction:column; gap:10px; z-index:5; }
.kicker { font:800 30px "Be Vietnam Pro"; color:var(--sun); }
.title { margin-bottom:10px; font:900 94px/1.04 "Be Vietnam Pro"; color:var(--ink); text-shadow:0 6px 30px rgba(0,0,0,0.55); }
.point { font:600 34px/1.3 "Be Vietnam Pro"; color:rgba(247,251,255,0.95); text-shadow:0 2px 14px rgba(0,0,0,0.75); }
.point i { font-style:normal; color:var(--sky); margin-right:14px; }
/* Stage chips under the subtitles. */
.days { position:absolute; left:0; right:0; top:1680px; z-index:20; display:flex; justify-content:center; align-items:center; gap:14px; }
.days small { font:800 22px "Be Vietnam Pro"; color:rgba(247,251,255,0.7); letter-spacing:0.2em; margin-right:6px; }
.days i { width:54px; height:54px; border-radius:50%; font:900 26px/50px "Be Vietnam Pro"; font-style:normal; text-align:center; color:rgba(247,251,255,0.75); border:2px solid rgba(127,182,217,0.5); background:rgba(14,21,48,0.6); }
.days i.done { background:rgba(127,182,217,0.35); color:var(--ink); }
.days i.now { background:var(--sky-l); border-color:var(--sky-l); color:var(--indigo-d); }
/* Between stages: an elevation profile with photos on its peaks. */
.recap { position:absolute; inset:0; z-index:9; background:linear-gradient(180deg, #ffc98a 0%, #e8a6a0 22%, #6d7fb8 52%, #1c2a63 80%, #0e1530 100%); }
.profile { position:absolute; left:0; top:0; }
.recap-h { position:absolute; left:80px; right:80px; top:220px; text-align:center; }
.recap-h small { display:block; font:900 30px "Be Vietnam Pro"; color:var(--indigo-d); letter-spacing:0.18em; text-transform:uppercase; }
.recap-h b { display:block; margin-top:8px; font:900 88px/1.05 "Be Vietnam Pro"; color:#ffffff; text-shadow:0 6px 24px rgba(20,28,69,0.45); }
.peak { position:absolute; width:220px; height:380px; }
.peak img { width:220px; height:380px; object-fit:cover; display:block; border-radius:22px; border:6px solid #ffffff; box-shadow:0 18px 36px rgba(14,21,48,0.5); }
.peak span { position:absolute; left:10px; bottom:12px; font:700 17px "Be Vietnam Pro"; color:#fff; text-shadow:0 2px 6px rgba(0,0,0,0.85); }
.peak .pin { position:absolute; left:107px; top:386px; width:6px; height:112px; background:linear-gradient(180deg, #ffffff, rgba(255,255,255,0.2)); }
.done { position:absolute; left:50%; top:1560px; transform:translateX(-50%); padding:12px 36px; border-radius:999px; background:#ffffff; color:var(--indigo-d); font:900 44px "Be Vietnam Pro"; white-space:nowrap; box-shadow:0 10px 24px rgba(0,0,0,0.4); }
/* Indigo cloth patches with a stitched edge. */
.patch { position:absolute; left:70px; width:940px; z-index:7; display:flex; align-items:center; gap:24px; padding:18px 28px 18px 22px; border-radius:22px; background:linear-gradient(135deg, #2a3a80, #1a2457); box-shadow:0 14px 30px rgba(0,0,0,0.5); outline:3px dashed rgba(232,244,255,0.75); outline-offset:-10px; }
.patch::before { content:""; position:absolute; left:0; top:0; bottom:0; width:16px; border-radius:22px 0 0 22px; background:repeating-linear-gradient(45deg, var(--rose) 0 8px, #ffffff 8px 12px, #f5b62e 12px 20px, #ffffff 20px 24px); }
.patch i { flex:none; margin-left:10px; width:64px; height:64px; border-radius:50%; background:var(--sky-l); color:var(--indigo-d); font:900 36px/64px "Be Vietnam Pro"; font-style:normal; text-align:center; }
.patch b { display:block; font:900 40px "Be Vietnam Pro"; color:var(--ink); }
.patch span { display:block; font:600 26px "Be Vietnam Pro"; color:rgba(232,244,255,0.85); }
/* Google Maps proof. */
.gmaps { position:absolute; left:220px; width:640px; top:590px; z-index:8; padding:14px 16px 16px; border-radius:22px; background:#ffffff; box-shadow:0 20px 44px rgba(0,0,0,0.55); display:flex; flex-direction:column; gap:10px; }
.gmaps-h { display:flex; align-items:center; gap:10px; font:800 26px "Be Vietnam Pro"; color:#1a73e8; }
.gmaps-h i { font-style:normal; }
.gmaps-h span { margin-left:auto; font:600 20px "Be Vietnam Pro"; color:#5f6368; }
.gm-stack { position:relative; height:204px; }
.gmaps img { position:absolute; left:0; top:0; width:100%; display:block; border-radius:10px; border:1px solid #e3e3e3; }
/* Cost: a backpack with stitched patches, the total on a luggage tag. */
.pack { position:absolute; left:90px; right:90px; top:560px; z-index:7; padding:120px 40px 30px; border-radius:70px 70px 50px 50px; background:linear-gradient(180deg, #2f4290 0%, #22306b 60%, #1a2457 100%); box-shadow:0 26px 50px rgba(0,0,0,0.55), inset 0 4px 0 rgba(232,244,255,0.25); }
.strap { position:absolute; top:-60px; width:40px; height:120px; border-radius:20px; background:#1a2457; border:3px solid #2f4290; }
.strap.s1 { left:200px; } .strap.s2 { right:200px; }
.flap { position:absolute; left:30px; right:30px; top:24px; height:76px; border-radius:40px 40px 24px 24px; background:var(--rose); color:#fff; font:900 34px/76px "Be Vietnam Pro"; text-align:center; letter-spacing:0.06em; }
.bp-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; padding:14px 26px; border-radius:18px; background:rgba(232,244,255,0.1); outline:3px dashed rgba(232,244,255,0.6); outline-offset:-8px; }
.bp-row span { font:700 30px "Be Vietnam Pro"; color:var(--ink); }
.bp-row em { font:900 33px "Be Vietnam Pro"; font-style:normal; color:var(--sun); }
.tag { position:absolute; left:150px; right:150px; top:1185px; z-index:8; padding:22px 30px 20px; border-radius:20px; background:#fff6e6; color:var(--indigo-d); text-align:center; transform-origin:50% -40px; box-shadow:0 18px 36px rgba(0,0,0,0.5); }
.tag .hole { position:absolute; left:50%; top:-34px; width:6px; height:40px; margin-left:-3px; background:#8b6b3a; }
.tag span { display:block; font:900 24px "Be Vietnam Pro"; letter-spacing:0.14em; color:var(--rose); }
.tag b { display:block; font:900 72px/1.05 "Be Vietnam Pro"; }
.tag small { display:block; margin-top:6px; font:600 21px/1.3 "Be Vietnam Pro"; color:#4a5687; }
.stamp { position:absolute; left:680px; top:470px; z-index:9; padding:8px 18px; border:5px solid var(--rose); border-radius:12px; color:var(--rose); font:900 24px "Be Vietnam Pro"; background:rgba(255,248,238,0.95); }
/* Outro: the sea of cloud. */
.sea { position:absolute; left:-200px; right:-200px; z-index:6; border-radius:50% 50% 0 0; filter:blur(16px); }
.sea.l0 { bottom:-200px; height:900px; background:radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.85) 0%, rgba(232,244,255,0.7) 45%, rgba(232,244,255,0) 72%); }
.sea.l1 { bottom:-320px; height:900px; background:radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.9) 0%, rgba(240,247,255,0.75) 40%, rgba(240,247,255,0) 70%); }
.sea.l2 { bottom:-420px; height:860px; background:radial-gradient(ellipse at 70% 30%, rgba(255,255,255,0.95) 0%, rgba(245,250,255,0.85) 40%, rgba(245,250,255,0) 70%); }
.outro-t { position:absolute; left:60px; right:60px; top:720px; z-index:8; text-align:center; }
.outro-t small { display:block; font:900 30px "Be Vietnam Pro"; color:var(--sun); letter-spacing:0.16em; text-shadow:0 2px 10px rgba(14,21,48,0.6); }
.outro-t h1 { margin-top:10px; font:900 128px/1.02 "Be Vietnam Pro"; color:var(--ink); text-shadow:0 0 40px rgba(127,182,217,0.7), 0 8px 30px rgba(14,21,48,0.7); }
.pill.cta { top:1290px; font-size:64px; padding:18px 56px; background:var(--indigo); color:#fff; border:3px solid rgba(232,244,255,0.6); }
.brand { position:absolute; left:60px; top:60px; z-index:21; font:800 26px "Be Vietnam Pro"; letter-spacing:0.2em; color:rgba(247,251,255,0.92); text-shadow:0 2px 10px rgba(0,0,0,0.5); }
.brand b { color:var(--sky); letter-spacing:0; margin-right:12px; }
.cap { position:absolute; left:60px; right:60px; top:1500px; text-align:center; font:800 50px/1.25 "Be Vietnam Pro"; color:#ffffff; text-shadow:0 3px 0 rgba(0,0,0,0.55), 0 0 22px rgba(0,0,0,0.85); z-index:20; }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="${W}" data-height="${H}">
${mediaTags.join("\n")}
${sfx.join("\n")}
${html.join("\n")}
${wisps.join("\n")}
<div class="brand" data-layout-ignore><b>☁</b>${esc(video.theme.brand)}</div>
${caps.join("\n")}
</div>
<script>
const tl = gsap.timeline({ paused: true });
${js.join("\n")}
HyperShader.init({
  bgColor: "#0e1530",
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
