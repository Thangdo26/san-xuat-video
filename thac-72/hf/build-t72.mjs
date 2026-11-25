#!/usr/bin/env node
/**
 * node hf/build-t72.mjs --slug thac-72-dak-glung [--cover]
 *
 * Turns data/videos/<slug>/video.json + voiceover.json into a HyperFrames project at build/<slug>/.
 * The look ("Thác 72 · Đắk Glung: Tây Nguyên hoang sơ", 22/11/2026), new for this channel (checked against
 * D:/Thang_space_archive/STYLE-LOG.md), built around the sound of the Central Highlands:
 *   - cold open: a bronze gong on black is struck (the ring spreads as ripples), then four clips cut on drum hits over
 *     the self-made cồng chiêng track (no voice); the title is engraved on the face of a gong;
 *   - pictures change by "falling water" (a soft mask edge pours down from the top) or by a "gong shake" (the new clip
 *     lands with a jolt and a faint gong);
 *   - water spray drifts upward over everything, with two slanting shafts of sun;
 *   - each stage gets a hanging bronze gong that swings in, is struck, and rings out a ripple, with "CHẶNG n";
 *   - viewing breaks (user request 22/11/2026): after the narrator says "Sau đây là vài thước phim…", TikTok clips of
 *     the place play with their ORIGINAL sound, the music dropped almost to silence, no text but a small credit;
 *   - between stages, four tall pictures in carved wooden columns with brocade bands (user request 20/11/2026);
 *   - "Ăn gì, ở đâu?" and "Nói thật nè" are wooden planks with brocade edges, with Google Maps proof where rated;
 *   - "Hết bao nhiêu?" is a t'rưng: each cost is a bamboo tube that rings as it slides in, the total on a gong plate;
 *   - outro: a campfire glow with sparks rising, the title and "Lưu lại nhé!";
 *   - shader seams: ripple-waves, ridged-burn, cinematic-zoom, gravitational-lens, cross-warp-morph.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fail, parseArgs, requireSlug } from "../scripts/lib/args.mjs";
import { probeDurationSec } from "../scripts/lib/media.mjs";
import { PROJECT_ROOT, PUBLIC_ROOT } from "../scripts/lib/paths.mjs";

const { flags } = parseArgs(process.argv.slice(2));
const slug = requireSlug(flags, "build-t72");
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
 * Footage stack. Odd changes: "falling water", a soft mask edge pours down from the top over the old clip. Even
 * changes: a "gong shake", the new clip lands slightly too big and bright and settles with a jolt and a faint gong.
 */
const photos = (s, from, to, idPrefix) => {
  const g = s.gallery ?? [];
  const seg = (to - from) / g.length;
  const parts = [];
  g.forEach((src, k) => {
    const id = `${idPrefix}-p${k}`;
    const a = r2(from + seg * k);
    tw(`tl.fromTo("#${id} video", {scale:1.03}, {scale:1.12, duration:${r2(seg + 0.8)}, ease:"none"}, ${a});`);
    const inner = media(src, id, a - 0.9, seg + 1.8) + creditTag(src);
    if (k === 0) return parts.push(`<div id="${id}" class="ph">${inner}</div>`);
    if (k % 2 === 1) {
      tw(`tl.set("#${id}", {"--p":"-25%"}, 0);`);
      tw(`tl.fromTo("#${id}", {"--p":"-25%"}, {"--p":"125%", duration:0.75, ease:"power2.in", immediateRender:false}, ${r2(a - 0.4)});`);
      tw(`tl.set("#${idPrefix}-p${k - 1}", {opacity:0}, ${r2(a + 0.4)});`);
      sound("whoosh-cinematic", r2(a - 0.4), 0.05);
      return parts.push(`<div id="${id}" class="ph pour">${inner}</div>`);
    }
    tw(`tl.set("#${id}", {opacity:0}, 0);`);
    tw(`tl.set("#${id}", {opacity:1}, ${r2(a - 0.05)});`);
    tw(`tl.fromTo("#${id}", {scale:1.1, x:-16}, {scale:1, x:0, duration:0.55, ease:"elastic.out(1.1,0.35)", immediateRender:false}, ${r2(a - 0.05)});`);
    tw(`tl.fromTo("#${id} video", {filter:"brightness(1.5) contrast(1.1)"}, {filter:"brightness(1) contrast(1)", duration:0.5, ease:"power2.out", immediateRender:false}, ${r2(a - 0.05)});`);
    tw(`tl.set("#${idPrefix}-p${k - 1}", {opacity:0}, ${r2(a + 0.05)});`);
    sound("gong-hit", r2(a - 0.05), 0.03);
    parts.push(`<div id="${id}" class="ph">${inner}</div>`);
  });
  return parts.join("");
};

const titleIn = (sel, at) =>
  tw(`tl.fromTo("${sel} .w", {opacity:0, y:30, filter:"blur(10px)"}, {opacity:1, y:0, filter:"blur(0px)", duration:0.5, stagger:0.07, ease:"power3.out"}, ${r2(at)});`);
const fadeUp = (sel, at, dur = 0.35) =>
  tw(`tl.fromTo("${sel}", {opacity:0, y:26}, {opacity:1, y:0, duration:${dur}, ease:"expo.out"}, ${r2(at)});`);
const hideOut = (sel, at) => tw(`tl.to("${sel}", {opacity:0, y:30, duration:0.4, ease:"power2.in"}, ${r2(at)});`);

// ---- hanging gong badge -------------------------------------------------------------
/** A bronze gong drops in on its cord, swings, is struck (a ripple rings out), and a tag with the stage slides out. */
const gongBadge = (sid, day, note, at) => {
  tw(`tl.fromTo("#${sid}-sign", {opacity:0, y:-120}, {opacity:1, y:0, duration:0.45, ease:"back.out(1.6)"}, ${r2(at)});`);
  tw(`tl.fromTo("#${sid}-gong", {rotation:-18}, {rotation:0, duration:1.1, ease:"elastic.out(1,0.3)"}, ${r2(at)});`);
  tw(`tl.fromTo("#${sid}-gong", {scale:1}, {scale:0.9, duration:0.07, yoyo:true, repeat:1, ease:"power2.out"}, ${r2(at + 0.7)});`);
  tw(`tl.fromTo("#${sid}-ring", {opacity:0.9, scale:0.7}, {opacity:0, scale:2.1, duration:0.9, ease:"power2.out"}, ${r2(at + 0.72)});`);
  tw(`tl.fromTo("#${sid}-sign span", {opacity:0, x:-20}, {opacity:1, x:0, duration:0.3, ease:"power3.out"}, ${r2(at + 0.85)});`);
  sound("gong-hit", r2(at + 0.7), 0.07);
  return `<div id="${sid}-sign" class="sign" style="opacity:0"><i class="cord"></i><div class="gong-wrap"><i id="${sid}-ring" class="ring"></i><i id="${sid}-gong" class="gong"><b>${esc(day)}</b></i></div>` +
    `<span><strong>CHẶNG ${esc(day)}</strong>${esc(note)}</span></div>`;
};

// Google Maps screenshots (name + stars + review count), captured 22/11/2026 into public/videos/thac-72/maps.
const MAPS_DATE = "chụp 22/11/2026";

// ---- between stages: four pictures in carved wooden columns ---------------------------
const recap = (s, sid, from) => {
  const list = s.recap;
  tw(`tl.fromTo("#${sid}-rc", {opacity:0}, {opacity:1, duration:0.3, ease:"power1.out"}, ${r2(from)});`);
  fadeUp(`#${sid}-rc-h`, from + 0.1);
  const cols = list.map((name, k) => {
    const t0 = from + 0.25 + k * 0.28;
    tw(`tl.fromTo("#${sid}-rp${k}", {opacity:0, yPercent:${k % 2 ? 40 : -40}}, {opacity:1, yPercent:0, duration:0.5, ease:"power3.out"}, ${r2(t0)});`);
    sound("trung-pluck", r2(t0 + 0.1), 0.05);
    const who = handle(`videos/thac-72/footage/${name}.mp4`);
    return `<div id="${sid}-rp${k}" class="col" style="opacity:0"><img src="${asset(`videos/thac-72/recap/${name}.jpg`)}" alt="" /><span>${esc(who)}</span></div>`;
  }).join("");
  const doneAt = from + 0.25 + list.length * 0.28 + 0.35;
  tw(`tl.fromTo("#${sid}-done", {opacity:0, scale:1.8}, {opacity:1, scale:1, duration:0.3, ease:"power4.in"}, ${r2(doneAt)});`);
  sound("gong-hit", r2(doneAt + 0.2), 0.06);
  return `<div id="${sid}-rc" class="recap" style="opacity:0"><i class="brocade top-b"></i><i class="brocade bot-b"></i><div id="${sid}-rc-h" class="recap-h"><small>${esc(s.recapLabel ?? "")}</small><b>${esc(s.caption)}</b></div>` +
    `<div class="cols">${cols}</div><div id="${sid}-done" class="done" style="opacity:0">ĐÃ QUA ✓</div></div>`;
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
/** A gong on black is struck; four clips cut on drum hits over the music; the hook's clips follow under the title. */
const coldOpen = (s, sid) => {
  const cold = s.cold ?? [];
  const COLD = s.voiceDelay ?? 0;
  const black = 1.5;
  const len = r2((COLD - black) / Math.max(1, cold.length));
  const parts = [];
  parts.push(`<div id="${sid}-black" class="black"><div class="big-gong-wrap"><i id="${sid}-bring0" class="ring big"></i><i id="${sid}-bring1" class="ring big"></i><i id="${sid}-bgong" class="gong big"><b>72</b></i></div></div>`);
  tw(`tl.fromTo("#${sid}-bgong", {opacity:0, scale:0.85}, {opacity:1, scale:1, duration:0.3, ease:"power2.out"}, 0.05);`);
  tw(`tl.fromTo("#${sid}-bgong", {x:0}, {x:10, duration:0.05, yoyo:true, repeat:5, ease:"sine.inOut", immediateRender:false}, 0.45);`);
  tw(`tl.fromTo("#${sid}-bring0", {opacity:0.9, scale:0.8}, {opacity:0, scale:2.6, duration:1.0, ease:"power2.out"}, 0.45);`);
  tw(`tl.fromTo("#${sid}-bring1", {opacity:0.7, scale:0.8}, {opacity:0, scale:2.2, duration:1.0, ease:"power2.out"}, 0.7);`);
  sound("gong-low", 0.42, 0.22);
  tw(`tl.to("#${sid}-black", {opacity:0, duration:0.25, ease:"power1.in"}, ${r2(black - 0.2)});`);
  cold.forEach((src, k) => {
    const id = `${sid}-k${k}`;
    const from = r2(black + k * len);
    parts.push(`<div id="${id}" class="ph" style="opacity:0">${media(src, id, from - 0.1, len + 0.4)}${creditTag(src)}</div>`);
    tw(`tl.set("#${id}", {opacity:1}, ${from});`);
    tw(`tl.set("#${id}", {opacity:0}, ${r2(from + len + 0.02)});`);
    tw(`tl.fromTo("#${id} video", {scale:1.18}, {scale:1.03, duration:${len}, ease:"power2.out"}, ${from});`);
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

// ---- spray rising + sun shafts ----------------------------------------------------
const spray = [];
for (let k = 0; k < 22; k++) {
  const x0 = 20 + ((k * 197) % 1040);
  const size = 5 + (k % 4) * 3;
  spray.push(`<i id="sp${k}" class="sp" style="left:${x0}px;top:1940px;width:${size}px;height:${size}px" data-layout-ignore></i>`);
  const rise = 7 + (k % 5) * 1.5;
  for (let at = (k * 0.61) % 7, n = 0; at < total; at += rise, n++) {
    const sway = r2(Math.sin(k * 1.7 + n) * 90);
    tw(`tl.fromTo("#sp${k}", {x:0, y:0, opacity:0.75}, {x:${sway}, y:-2000, opacity:0.75, duration:${r2(rise)}, ease:"none", immediateRender:${n === 0}}, ${r2(at)});`);
  }
}
tw(`tl.fromTo("#shafts", {opacity:0.35}, {opacity:0.7, duration:3.2, yoyo:true, repeat:${Math.ceil(total / 3.2)}, ease:"sine.inOut"}, 0);`);

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
    // The title is engraved on a gong face: the disc drops in, is struck, the words rise out of the bronze.
    parts.push(`<div id="${sid}-tt" class="title-gong" style="opacity:0"><div class="disc"><i id="${sid}-tring" class="ring big"></i><small>${esc(s.kicker)}</small><h1>${words(s.caption)}</h1></div><b>${esc(s.label)}</b></div>`);
    tw(`tl.fromTo("#${sid}-tt", {opacity:0, y:-160, rotation:-6}, {opacity:1, y:0, rotation:0, duration:0.7, ease:"back.out(1.4)"}, ${r2(m.after + 0.05)});`);
    tw(`tl.fromTo("#${sid}-tt .disc", {scale:1}, {scale:0.94, duration:0.08, yoyo:true, repeat:1, ease:"power2.out"}, ${r2(m.after + 0.55)});`);
    tw(`tl.fromTo("#${sid}-tring", {opacity:0.9, scale:0.85}, {opacity:0, scale:1.9, duration:1.0, ease:"power2.out"}, ${r2(m.after + 0.57)});`);
    tw(`tl.fromTo("#${sid}-tt h1 .w", {opacity:0, scale:1.5, filter:"blur(12px)"}, {opacity:1, scale:1, filter:"blur(0px)", duration:0.5, stagger:0.12, ease:"power3.out"}, ${r2(m.after + 0.6)});`);
    fadeUp(`#${sid}-tt b`, m.after + 1.0);
    sound("gong-low", r2(m.after + 0.55), 0.16);
    const lift = s.vo + 3.4;
    tw(`tl.to("#${sid}-tt", {opacity:0, y:-80, duration:0.5, ease:"power2.in"}, ${r2(lift)});`);
    tw(`tl.to("#${sid}-dim", {opacity:0.3, duration:0.6}, ${r2(lift)});`);
  } else if (s.layout === "point") {
    parts.push(photos(s, a, bodyEnd, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div class="floor"></div>`);
    const idx = days.findIndex((x) => x.id === s.id);
    parts.push(gongBadge(sid, s.day, s.badge ?? "", enter + 0.3));
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
    // Wooden planks, one per idea, on their cue words. The "stay" style adds Google Maps proof above them.
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
      parts.push(`<div id="${sid}-tg${k}" class="plank" style="opacity:0;top:${top}px"><i>${icon}</i><div><b>${esc(it.t)}</b><span>${esc(it.s)}</span></div></div>`);
      tw(`tl.fromTo("#${sid}-tg${k}", {opacity:0, x:-120, rotation:-3}, {opacity:1, x:0, rotation:0, duration:0.45, ease:"back.out(1.6)"}, ${r2(at)});`);
      sound("drum-hit", r2(at + 0.05), 0.06);
      for (const m of [].concat(it.maps ?? [])) shots.push([m, at]);
    });
    if (shots.length) {
      // One Google Maps panel; each screenshot slides in on its plank's cue.
      parts.push(`<div id="${sid}-gm" class="gmaps" style="opacity:0"><div class="gmaps-h"><i>📍</i>Google Maps<span>${MAPS_DATE}</span></div><div class="gm-stack">${shots.map(([m], k) => `<img id="${sid}-gm${k}" src="${asset(`videos/thac-72/maps/${m}.png`)}" alt="" style="opacity:0" />`).join("")}</div></div>`);
      tw(`tl.fromTo("#${sid}-gm", {opacity:0, y:40}, {opacity:1, y:0, duration:0.4, ease:"back.out(1.5)"}, ${r2(shots[0][1])});`);
      // One screenshot at a time: each replaces the previous (two for one plank follow 1.3 s apart).
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
    // "Hết bao nhiêu?": a t'rưng. Each cost is a bamboo tube that slides in and rings; the total sits on a gong plate.
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
    const tubes = items.map((it, k) => {
      const at = t0 + 0.5 + k * step;
      tw(`tl.fromTo("#${sid}-ln${k}", {opacity:0, x:-260}, {opacity:1, x:0, duration:0.35, ease:"power3.out"}, ${r2(at)});`);
      tw(`tl.fromTo("#${sid}-ln${k} .tube", {scaleY:1}, {scaleY:1.18, duration:0.06, yoyo:true, repeat:3, ease:"sine.inOut", immediateRender:false}, ${r2(at + 0.35)});`);
      sound("trung-pluck", r2(at + 0.35), 0.08);
      return `<div id="${sid}-ln${k}" class="tl-row" style="opacity:0"><div class="tube" style="width:${940 - k * 40}px"><span>${esc(it.k)}</span><em>${esc(it.v)}</em></div></div>`;
    }).join("");
    parts.push(`<div id="${sid}-tr" class="trung" style="opacity:0"><i class="rail r1"></i><i class="rail r2"></i>${tubes}` +
      `<div id="${sid}-tot" class="plate" style="opacity:0"><span>KHOẢNG</span><b>${esc(s.total)}</b></div><div class="t-note">${esc(s.note ?? "")}</div></div>`);
    tw(`tl.fromTo("#${sid}-tr", {opacity:0}, {opacity:1, duration:0.3}, ${r2(t0)});`);
    tw(`tl.fromTo("#${sid}-tot", {opacity:0, scale:1.6}, {opacity:1, scale:1, duration:0.3, ease:"power4.in"}, ${r2(totalAt)});`);
    tw(`tl.fromTo("#${sid}-tot", {x:0}, {x:8, duration:0.05, yoyo:true, repeat:5, ease:"sine.inOut", immediateRender:false}, ${r2(totalAt + 0.3)});`);
    sound("gong-hit", r2(totalAt + 0.28), 0.1);
    parts.push(`<div id="${sid}-stamp" class="stamp" style="opacity:0">${esc(s.stamp ?? "")}</div>`);
    tw(`tl.fromTo("#${sid}-stamp", {opacity:0, scale:2.2, rotation:-24}, {opacity:1, scale:1, rotation:-8, duration:0.3, ease:"power4.in"}, ${r2(totalAt + 0.8)});`);
    sound("drum-hit", r2(totalAt + 1.05), 0.08);
  } else {
    // Outro: a campfire glow with sparks rising, the title, then the call to action.
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div id="${sid}-fire" class="fire" style="opacity:0"></div>`);
    tw(`tl.to("#${sid}-fire", {opacity:1, duration:0.8}, ${r2(enter)});`);
    tw(`tl.fromTo("#${sid}-fire", {scaleY:1}, {scaleY:1.08, duration:0.4, yoyo:true, repeat:${Math.ceil((s.end - enter) / 0.4)}, ease:"sine.inOut", immediateRender:false}, ${r2(enter + 0.8)});`);
    for (let k = 0; k < 16; k++) {
      const x0 = 260 + ((k * 73) % 560);
      parts.push(`<i id="${sid}-em${k}" class="ember" style="left:${x0}px;opacity:0"></i>`);
      const life = 1.8 + (k % 4) * 0.4;
      for (let at = enter + 0.5 + (k % 6) * 0.3, n = 0; at < s.end - 0.2; at += life, n++) {
        tw(`tl.fromTo("#${sid}-em${k}", {x:0, y:0, opacity:1}, {x:${((k * 31 + n * 17) % 120) - 60}, y:-${520 + (k % 5) * 60}, opacity:0, duration:${r2(life)}, ease:"power1.out", immediateRender:false}, ${r2(at)});`);
      }
    }
    parts.push(`<div id="${sid}-tt" class="outro-t" style="opacity:0"><small>ĐẮK GLUNG · TÂY NGUYÊN</small><h1>${words(s.caption)}</h1></div>`);
    tw(`tl.fromTo("#${sid}-tt", {opacity:0}, {opacity:1, duration:0.3}, ${r2(enter + 0.4)});`);
    titleIn(`#${sid}-tt h1`, enter + 0.5);
    sound("gong-low", r2(enter + 0.45), 0.14);
    const ctaAt = Math.min(enter + 2.6, s.end - 1.6);
    parts.push(`<div id="${sid}-cta" class="pill cta" style="opacity:0">${esc(s.cta ?? "")}</div>`);
    tw(`tl.fromTo("#${sid}-cta", {opacity:0, scale:0.5}, {opacity:1, scale:1, duration:0.4, ease:"back.out(2.4)"}, ${r2(ctaAt)});`);
    sound("trung-run", r2(ctaAt), 0.1);
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
 * The cồng chiêng bed plays as consecutive pieces so its level can change: loud under the cold open, under the voice
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
const SHADERS = ["ripple-waves", "ridged-burn", "cinematic-zoom", "gravitational-lens", "cross-warp-morph"];
const transitions = scenes.slice(1).map((s, k) => ({ time: r2(s.start - SEAM / 2), shader: SHADERS[k % SHADERS.length], duration: SEAM }));
for (const tr of transitions) sound("whoosh-short", r2(tr.time - 0.1), 0.14);

const FONTS = JSON.parse(readFileSync(path.join(PUBLIC_ROOT, "shared", "fonts", "fonts.json"), "utf8"));
const fontFaces = FONTS.map((f) => `@font-face { font-family:"${f.family}"; font-weight:${f.weight}; src:url("${asset(`shared/fonts/${f.file}`)}") format("woff2"); unicode-range:${f.range}; }`).join(" ");

// ---- page ---------------------------------------------------------------
const BROCADE = "repeating-linear-gradient(90deg, #b8322a 0 22px, #111 22px 30px, #f2e6c8 30px 36px, #111 36px 44px, #d9a441 44px 52px, #111 52px 60px)";
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
:root { --ground:#1a120c; --ink:#fff8ee; --bronze:#d9a441; --bronze-d:#8a5a1c; --soil:#b8322a; --leaf:#8ccf63; --wood:#3b2414; --mist:#e8f3ef; }
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:${W}px; height:${H}px; overflow:hidden; background:var(--ground); }
#root { position:relative; width:${W}px; height:${H}px; overflow:hidden; font-family:"Be Vietnam Pro"; }
.scene { position:absolute; inset:0; overflow:hidden; background:var(--ground); z-index:1; }
.ph { position:absolute; inset:0; overflow:hidden; }
.ph video { width:100%; height:100%; object-fit:cover; display:block; filter:saturate(1.08) contrast(1.05) sepia(0.06); }
/* Falling water: the new clip pours down from the top. */
.pour { --p:-25%; -webkit-mask-image:linear-gradient(180deg, #000 var(--p), transparent calc(var(--p) + 22%)); mask-image:linear-gradient(180deg, #000 var(--p), transparent calc(var(--p) + 22%)); }
.breathe { z-index:8; }
.cr { position:absolute; left:60px; top:112px; z-index:4; font:600 22px "Be Vietnam Pro"; color:rgba(255,248,238,0.85); text-shadow:0 2px 8px rgba(0,0,0,0.7); }
.cr.orig { top:auto; bottom:250px; left:50%; transform:translateX(-50%); padding:8px 20px; border-radius:999px; background:rgba(26,18,12,0.55); white-space:nowrap; }
.shade { position:absolute; inset:0; background:linear-gradient(180deg, rgba(20,12,6,0.2) 0%, rgba(20,12,6,0) 35%, rgba(20,12,6,0) 65%, rgba(20,12,6,0.35) 100%); }
.top { position:absolute; left:0; right:0; top:0; height:760px; background:linear-gradient(180deg, rgba(26,16,8,0.85) 0%, rgba(26,16,8,0.45) 55%, rgba(26,16,8,0) 100%); }
.floor { position:absolute; left:0; right:0; bottom:0; height:900px; background:linear-gradient(180deg, rgba(26,16,8,0) 0%, rgba(26,16,8,0.6) 45%, rgba(26,16,8,0.93) 100%); }
.veil { position:absolute; inset:0; background:rgba(26,16,8,0.6); }
.hook-dim { position:absolute; inset:0; z-index:4; background:linear-gradient(180deg, rgba(26,16,8,0.35) 0%, rgba(26,16,8,0.05) 45%, rgba(26,16,8,0.8) 100%); }
.black { position:absolute; inset:0; z-index:9; background:#0b0704; display:flex; align-items:center; justify-content:center; }
/* Bronze gongs. */
.gong { position:relative; display:block; border-radius:50%; background:radial-gradient(circle at 50% 50%, #f3c86a 0 9%, #a66b22 10% 13%, #e2ad4c 14% 34%, #b57a2c 35% 37%, #d9a441 38% 62%, #9b6420 63% 66%, #c98f38 67% 100%); box-shadow:0 10px 30px rgba(0,0,0,0.6), inset 0 -8px 18px rgba(60,30,5,0.6), inset 0 6px 14px rgba(255,230,160,0.5); }
.gong b { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font:900 34px "Be Vietnam Pro"; color:#4a2a08; text-shadow:0 1px 0 rgba(255,230,160,0.7); }
.ring { position:absolute; left:50%; top:50%; width:100%; height:100%; margin:-50% 0 0 -50%; border-radius:50%; border:4px solid rgba(243,200,106,0.9); opacity:0; }
.big-gong-wrap { position:relative; width:520px; height:520px; }
.gong.big { width:520px; height:520px; }
.gong.big b { font-size:170px; }
.ring.big { border-width:6px; }
/* Title engraved on a gong. */
.title-gong { position:absolute; left:0; right:0; top:700px; z-index:8; display:flex; flex-direction:column; align-items:center; transform-origin:50% 0%; }
.title-gong .disc { position:relative; width:640px; height:640px; border-radius:50%; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; background:radial-gradient(circle at 50% 50%, rgba(243,200,106,0.96) 0 30%, rgba(182,122,44,0.96) 31% 33%, rgba(217,164,65,0.96) 34% 70%, rgba(150,96,30,0.96) 71% 74%, rgba(201,143,56,0.96) 75% 100%); box-shadow:0 30px 70px rgba(0,0,0,0.6), inset 0 -14px 30px rgba(60,30,5,0.55), inset 0 10px 24px rgba(255,236,180,0.6); }
.title-gong small { font:800 24px "Be Vietnam Pro"; color:#4a2a08; letter-spacing:0.1em; }
.title-gong h1 { margin-top:4px; font:900 150px/1 "Be Vietnam Pro"; color:#3a1f05; text-shadow:0 2px 0 rgba(255,236,180,0.8), 0 -2px 0 rgba(80,40,5,0.5); }
.title-gong b { margin-top:26px; padding:10px 34px; border-radius:999px; background:var(--soil); color:var(--ink); font:900 46px "Be Vietnam Pro"; box-shadow:0 10px 24px rgba(0,0,0,0.5); }
.title .w, .title-gong .w, .outro-t .w { display:inline-block; }
.pill { position:absolute; left:50%; top:1370px; transform:translateX(-50%); font:900 44px "Be Vietnam Pro"; color:#2a1606; background:var(--bronze); padding:12px 40px; border-radius:999px; white-space:nowrap; z-index:8; }
/* Spray rising and sun shafts. */
.sp { position:absolute; z-index:16; border-radius:50%; background:rgba(232,243,239,0.75); box-shadow:0 0 6px rgba(232,243,239,0.6); opacity:0; pointer-events:none; }
#shafts { position:absolute; inset:0; z-index:15; pointer-events:none; background:linear-gradient(115deg, rgba(255,226,150,0) 30%, rgba(255,226,150,0.16) 36%, rgba(255,226,150,0) 44%, rgba(255,226,150,0) 52%, rgba(255,226,150,0.12) 57%, rgba(255,226,150,0) 64%); }
/* Hanging gong badge. */
.sign { position:absolute; right:60px; top:96px; z-index:6; display:flex; align-items:center; gap:18px; }
.sign .cord { position:absolute; right:63px; top:-100px; width:3px; height:110px; background:linear-gradient(180deg, rgba(120,80,40,0), #7a4a1c); }
.gong-wrap { position:relative; width:128px; height:128px; order:2; }
.gong-wrap .gong { width:128px; height:128px; transform-origin:50% -60%; }
.gong-wrap .gong b { font-size:46px; }
.sign span { order:1; padding:12px 20px; border-radius:18px; background:rgba(26,16,8,0.82); border:2px solid rgba(217,164,65,0.6); font:700 24px "Be Vietnam Pro"; color:rgba(255,248,238,0.88); text-align:right; }
.sign span strong { display:block; font:900 40px/1.05 "Be Vietnam Pro"; color:var(--bronze); }
.head { position:absolute; left:80px; top:330px; width:640px; display:flex; flex-direction:column; gap:10px; z-index:5; }
.kicker { font:800 30px "Be Vietnam Pro"; color:var(--bronze); }
.title { margin-bottom:10px; font:900 94px/1.04 "Be Vietnam Pro"; color:var(--ink); text-shadow:0 6px 30px rgba(0,0,0,0.55); }
.point { font:600 34px/1.3 "Be Vietnam Pro"; color:rgba(255,248,238,0.95); text-shadow:0 2px 14px rgba(0,0,0,0.75); }
.point i { font-style:normal; color:var(--soil); margin-right:14px; }
/* Stage chips under the subtitles. */
.days { position:absolute; left:0; right:0; top:1680px; z-index:20; display:flex; justify-content:center; align-items:center; gap:14px; }
.days small { font:800 22px "Be Vietnam Pro"; color:rgba(255,248,238,0.7); letter-spacing:0.2em; margin-right:6px; }
.days i { width:54px; height:54px; border-radius:50%; font:900 26px/50px "Be Vietnam Pro"; font-style:normal; text-align:center; color:rgba(255,248,238,0.75); border:2px solid rgba(217,164,65,0.45); background:rgba(26,16,8,0.6); }
.days i.done { background:rgba(217,164,65,0.35); color:var(--ink); }
.days i.now { background:var(--bronze); border-color:var(--bronze); color:#2a1606; }
/* Carved wooden columns between stages. */
.recap { position:absolute; inset:0; z-index:9; background:radial-gradient(ellipse at 50% 55%, #4a2c16 0%, #2a170b 60%, #120904 100%); }
.brocade { position:absolute; left:0; right:0; height:34px; background:${BROCADE}; opacity:0.9; }
.top-b { top:150px; } .bot-b { top:1740px; }
.recap-h { position:absolute; left:80px; right:80px; top:240px; text-align:center; }
.recap-h small { display:block; font:900 30px "Be Vietnam Pro"; color:var(--bronze); letter-spacing:0.18em; text-transform:uppercase; }
.recap-h b { display:block; margin-top:8px; font:900 88px/1.05 "Be Vietnam Pro"; color:var(--ink); }
.cols { position:absolute; left:70px; right:70px; top:470px; height:1060px; display:flex; gap:20px; }
.col { position:relative; flex:1; overflow:hidden; border-radius:12px; border:10px solid #5a3519; box-shadow:0 20px 40px rgba(0,0,0,0.55), inset 0 0 0 3px #a8742f; }
.col img { width:100%; height:100%; object-fit:cover; display:block; }
.col span { position:absolute; left:8px; bottom:8px; font:700 18px "Be Vietnam Pro"; color:#fff; text-shadow:0 2px 6px rgba(0,0,0,0.85); }
.done { position:absolute; left:50%; top:1580px; transform:translateX(-50%); padding:12px 36px; border-radius:999px; background:var(--bronze); color:#2a1606; font:900 44px "Be Vietnam Pro"; white-space:nowrap; box-shadow:0 10px 24px rgba(0,0,0,0.45); }
/* Wooden planks with a brocade edge. */
.plank { position:absolute; left:70px; width:940px; z-index:7; display:flex; align-items:center; gap:24px; padding:16px 26px 16px 22px; border-radius:16px; background:linear-gradient(180deg, #6b4022, #4a2a14); border-left:14px solid transparent; border-image:${BROCADE.replace("90deg", "180deg")} 14; box-shadow:0 14px 30px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,220,160,0.25); }
.plank i { flex:none; width:64px; height:64px; border-radius:50%; background:var(--bronze); color:#2a1606; font:900 36px/64px "Be Vietnam Pro"; font-style:normal; text-align:center; }
.plank b { display:block; font:900 40px "Be Vietnam Pro"; color:var(--ink); }
.plank span { display:block; font:600 26px "Be Vietnam Pro"; color:rgba(255,248,238,0.85); }
/* Google Maps proof. */
.gmaps { position:absolute; left:220px; width:640px; top:590px; z-index:8; padding:14px 16px 16px; border-radius:22px; background:#ffffff; box-shadow:0 20px 44px rgba(0,0,0,0.55); display:flex; flex-direction:column; gap:10px; }
.gmaps-h { display:flex; align-items:center; gap:10px; font:800 26px "Be Vietnam Pro"; color:#1a73e8; }
.gmaps-h i { font-style:normal; }
.gmaps-h span { margin-left:auto; font:600 20px "Be Vietnam Pro"; color:#5f6368; }
.gm-stack { position:relative; height:204px; }
.gmaps img { position:absolute; left:0; top:0; width:100%; display:block; border-radius:10px; border:1px solid #e3e3e3; }
/* Cost: a t'rưng of bamboo tubes. */
.trung { position:absolute; left:40px; right:40px; top:560px; z-index:7; padding:34px 30px 26px; }
.rail { position:absolute; top:20px; bottom:150px; width:16px; border-radius:8px; background:linear-gradient(90deg, #5a3519, #8a5a2a); }
.rail.r1 { left:60px; } .rail.r2 { right:60px; }
.tl-row { position:relative; display:flex; justify-content:center; margin:0 0 18px; }
.tube { position:relative; height:104px; border-radius:52px; display:flex; align-items:center; justify-content:space-between; padding:0 40px; background:linear-gradient(180deg, #e6d48a 0%, #c9b45e 30%, #a48a3c 70%, #7d6a2a 100%); box-shadow:0 12px 24px rgba(0,0,0,0.5), inset 0 3px 0 rgba(255,250,210,0.6); }
.tube::before, .tube::after { content:""; position:absolute; top:6px; bottom:6px; width:6px; border-radius:3px; background:rgba(90,70,20,0.55); }
.tube::before { left:22%; } .tube::after { right:22%; }
.tube span { position:relative; z-index:1; font:700 32px "Be Vietnam Pro"; color:#2a1a06; }
.tube em { position:relative; z-index:1; font:900 36px "Be Vietnam Pro"; font-style:normal; color:#7a1e12; }
.plate { display:flex; justify-content:center; align-items:baseline; gap:18px; margin:18px auto 0; width:760px; padding:16px 0; border-radius:999px; background:radial-gradient(ellipse at 50% 40%, #f3c86a, #b57a2c); box-shadow:0 16px 36px rgba(0,0,0,0.55), inset 0 -6px 14px rgba(70,35,5,0.5); color:#3a1f05; }
.plate span { font:900 28px "Be Vietnam Pro"; letter-spacing:0.1em; }
.plate b { font:900 72px "Be Vietnam Pro"; }
.t-note { margin-top:14px; font:600 24px/1.35 "Be Vietnam Pro"; color:rgba(255,248,238,0.8); text-align:center; }
.stamp { position:absolute; left:660px; top:470px; z-index:9; padding:8px 18px; border:5px solid #e0533f; border-radius:12px; color:#e0533f; font:900 24px "Be Vietnam Pro"; background:rgba(255,248,238,0.95); }
/* Outro: campfire. */
.fire { position:absolute; left:-100px; right:-100px; bottom:-200px; height:900px; z-index:6; transform-origin:50% 100%; background:radial-gradient(ellipse at 50% 100%, rgba(255,150,40,0.75) 0%, rgba(230,90,20,0.45) 30%, rgba(120,40,10,0.2) 55%, rgba(0,0,0,0) 75%); }
.ember { position:absolute; bottom:300px; z-index:7; width:9px; height:9px; border-radius:50%; background:#ffb347; box-shadow:0 0 10px #ff8a1e; }
.outro-t { position:absolute; left:60px; right:60px; top:700px; z-index:8; text-align:center; }
.outro-t small { display:block; font:900 30px "Be Vietnam Pro"; color:var(--bronze); letter-spacing:0.16em; }
.outro-t h1 { margin-top:10px; font:900 128px/1.02 "Be Vietnam Pro"; color:var(--ink); text-shadow:0 0 40px rgba(255,140,40,0.6), 0 8px 30px rgba(0,0,0,0.6); }
.pill.cta { top:1290px; font-size:64px; padding:18px 56px; }
.brand { position:absolute; left:60px; top:60px; z-index:21; font:800 26px "Be Vietnam Pro"; letter-spacing:0.2em; color:rgba(255,248,238,0.9); text-shadow:0 2px 10px rgba(0,0,0,0.5); }
.brand b { color:var(--bronze); letter-spacing:0; margin-right:12px; }
.cap { position:absolute; left:60px; right:60px; top:1500px; text-align:center; font:800 50px/1.25 "Be Vietnam Pro"; color:#ffffff; text-shadow:0 3px 0 rgba(0,0,0,0.55), 0 0 22px rgba(0,0,0,0.85); z-index:20; }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="${W}" data-height="${H}">
${mediaTags.join("\n")}
${sfx.join("\n")}
${html.join("\n")}
<div id="shafts" data-layout-ignore></div>
${spray.join("\n")}
<div class="brand" data-layout-ignore><b>◉</b>${esc(video.theme.brand)}</div>
${caps.join("\n")}
</div>
<script>
const tl = gsap.timeline({ paused: true });
${js.join("\n")}
HyperShader.init({
  bgColor: "#1a120c",
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
