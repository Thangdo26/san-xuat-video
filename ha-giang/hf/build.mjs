#!/usr/bin/env node
/**
 * npm run video:build -- --slug saigon-3n2d
 *
 * Turns data/videos/<slug>/video.json + voiceover.json into a HyperFrames
 * project at build/<slug>/ (index.html + assets/), ready for
 * `npx hyperframes render`. The look ("Huế · ấn son & giấy dó"):
 *   - travel hook: a baked satellite dive from the globe into the Citadel (video.dive);
 *   - every seam a WebGL shader transition (ripple, paper burn, ink dissolve, light leak);
 *   - a thin gold frame over the whole video, like a palace screen;
 *   - each stop: photos with slow camera moves swapped by a blur cut, a serif
 *     title revealed word by word, and a red seal (ấn son) stamped beside it
 *     with the day or dish number;
 *   - the photo stays clear for CLEAR seconds before any card appears, and
 *     cards and subtitles sit in the lower third so the photo shows;
 *   - cream "giấy dó" cards; karaoke subtitles from the voice-over's word timings.
 * Food videos reuse the frame and show one story card per beat
 * (origin → how it's made → how to eat → where) at the narration cues.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fail, parseArgs, requireSlug } from "../scripts/lib/args.mjs";
import { probeDurationSec } from "../scripts/lib/media.mjs";
import { PROJECT_ROOT, PUBLIC_ROOT } from "../scripts/lib/paths.mjs";

const { flags } = parseArgs(process.argv.slice(2));
const slug = requireSlug(flags, "video:build");
const dataDir = path.join(PROJECT_ROOT, "data", "videos", slug);
const video = JSON.parse(readFileSync(path.join(dataDir, "video.json"), "utf8"));
const voicePath = path.join(dataDir, "voiceover.json");
if (!existsSync(voicePath)) fail(`No voiceover.json for ${slug}; make the voice first.`);
const voice = JSON.parse(readFileSync(voicePath, "utf8")).clips;

const W = 1080;
const H = 1920;
const LEAD = video.transitionFrames / video.format.fps;
const SEAM = 0.7; // shader transition length
const CLEAR = 3; // seconds a stop's photo shows uncovered before the first card
const DIVE = video.dive ?? "videos/shared/map/dive-hue";
const vi = video.language === "vi";
const isFood = video.template === "food";

// --cover builds a caption-free copy in build/<slug>-cover for the TikTok cover still.
const cover = Boolean(flags.cover);
const out = path.join(PROJECT_ROOT, "build", cover ? `${slug}-cover` : slug);
// Only assets/ is rebuilt; .hyperframes/ (history, snapshots) stays.
rmSync(path.join(out, "assets"), { recursive: true, force: true });
mkdirSync(path.join(out, "assets"), { recursive: true });

/** Copies a public/ file into assets/ once and returns its asset path. */
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

// ---- timing -------------------------------------------------------------
let t = 0;
const scenes = video.scenes.map((s, i) => {
  const start = t;
  t += s.durationSec;
  return { ...s, i, start, end: t, clip: voice[s.id] };
});
const total = r2(t);
const stops = scenes.filter((s) => s.layout === "point");

/** Absolute time the voice says `phrase` in scene `s`, or null. */
const cueTime = (s, phrase) => {
  if (!phrase || !s.clip?.words?.length) return null;
  const target = norm(phrase).split(/\s+/);
  const ws = s.clip.words.map((w) => norm(w.text));
  for (let i = 0; i <= ws.length - target.length; i++) {
    if (target.every((tw, k) => ws[i + k] === tw || ws[i + k]?.startsWith(tw))) {
      return s.start + LEAD + s.clip.words[i].startMs / 1000;
    }
  }
  return null;
};

const html = [];
const js = [];
const tw = (code) => js.push(code);

// ---- scenes -------------------------------------------------------------
const MOVES = [
  { from: "scale:1.18,x:0,y:0", to: "scale:1.04,x:0,y:0" }, // pull out
  { from: "scale:1.12,x:70,y:0", to: "scale:1.12,x:-70,y:0" }, // pan left
  { from: "scale:1.04,x:0,y:30", to: "scale:1.18,x:0,y:-30" }, // push in
  { from: "scale:1.12,x:-70,y:0", to: "scale:1.12,x:70,y:0" }, // pan right
];

/** Photo stack with blur-swap cuts; returns markup. */
const photos = (s, from, to, idPrefix) => {
  const g = s.gallery ?? [];
  const seg = (to - from) / g.length;
  return g
    .map((src, k) => {
      const id = `${idPrefix}-p${k}`;
      const a = r2(from + seg * k);
      const mv = MOVES[(s.i + k) % MOVES.length];
      const obj = (str) => `{${str.replace(/(\w+):/g, "$1:")}}`;
      tw(`tl.fromTo("#${id} img", ${obj(mv.from)}, {${mv.to}, duration:${r2(seg + 0.6)}, ease:"none"}, ${a});`);
      if (k > 0) {
        tw(`tl.fromTo("#${id}", {opacity:0, filter:"blur(10px)"}, {opacity:1, filter:"blur(0px)", duration:0.16, ease:"power2.out"}, ${a});`);
        tw(`tl.to("#${idPrefix}-p${k - 1}", {opacity:0, duration:0.01}, ${r2(a + 0.16)});`);
      }
      return `<div id="${id}" class="ph"${k > 0 ? ' style="opacity:0"' : ""}><img src="${asset(src)}" alt="" /></div>`;
    })
    .join("");
};

/** Per-word blur-in of a title (per motion.md). */
const titleIn = (sel, at) =>
  tw(`tl.fromTo("${sel} .w", {opacity:0, filter:"blur(6px)"}, {opacity:1, filter:"blur(0px)", duration:0.14, stagger:0.07, ease:"power4.out"}, ${r2(at)});`);
const fadeUp = (sel, at, dur = 0.3) =>
  tw(`tl.fromTo("${sel}", {opacity:0, y:24}, {opacity:1, y:0, duration:${dur}, ease:"expo.out"}, ${r2(at)});`);

// "Ngày cuối" / "Last day" carries no digit, so it is the day after the previous stop.
let lastDay = 0;
const dayNumber = (label) => {
  const d = Number(label.match(/\d+/)?.[0] ?? lastDay + 1);
  lastDay = d;
  return String(d).padStart(2, "0");
};

/** Red seal stamped down with an ink ring; even and odd stops tilt opposite ways. */
const seal = (sid, top, num, at, tilt) => {
  tw(`tl.fromTo("#${sid}-seal", {opacity:0, scale:2.3, rotation:${tilt * 3}}, {opacity:1, scale:1, rotation:${tilt}, duration:0.42, ease:"back.out(2.2)"}, ${r2(at)});`);
  tw(`tl.fromTo("#${sid}-ink", {opacity:0.7, scale:0.7}, {opacity:0, scale:1.7, duration:0.7, ease:"power2.out"}, ${r2(at + 0.3)});`);
  return `<div id="${sid}-ink" class="ink" style="opacity:0"></div><div id="${sid}-seal" class="seal" style="opacity:0"><small>${esc(top)}</small><b>${esc(num)}</b></div>`;
};

for (const s of scenes) {
  const sid = `s-${s.id}`;
  const a = s.start;
  const accent = s.accent ?? video.theme.accent;
  const parts = [];

  if (s.layout === "hook" && !isFood) {
    // The satellite dive plays from the root (see media below); this layer is its text
    // and, once the camera has landed, a still of the last frame for the shader capture.
    parts.push(`<div id="${sid}-still" class="ph" style="opacity:0"><img src="${asset(`${DIVE}-end.jpg`)}" alt="" /></div>`);
    parts.push(`<div class="shade-hook"></div>`);
    parts.push(`<div id="${sid}-kicker" class="hook-kicker">${esc(s.kicker ?? (vi ? "LỊCH TRÌNH TỪ TIKTOK" : "BUILT FROM TIKTOK"))}</div>`);
    const size = Math.min(200, Math.floor(1700 / s.caption.length));
    parts.push(`<h1 id="${sid}-title" class="hook-title" style="font-size:${size}px">${words(s.caption)}</h1>`);
    parts.push(`<div id="${sid}-pill" class="pill" style="background:${accent}">${esc(s.label ?? "")}</div>`);
    parts.push(`<p id="${sid}-sub" class="hook-sub">${esc(s.sub ?? "")}</p>`);
    tw(`tl.set("#${sid}-still", {opacity:1}, ${r2(a + 5.9)});`);
    // Frame 0 is the thumbnail: the title is already there, then settles.
    tw(`tl.fromTo("#${sid}-title", {scale:1.14}, {scale:1, duration:1.6, ease:"expo.out"}, ${a});`);
    fadeUp(`#${sid}-pill`, a + 0.5);
    fadeUp(`#${sid}-kicker`, a + 0.2);
    fadeUp(`#${sid}-sub`, a + 1.4);
  } else if (s.layout === "hook") {
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div class="floor"></div>`);
    parts.push(`<div id="${sid}-kicker" class="hook-kicker">${esc(s.kicker ?? (vi ? "ẨM THỰC · TIKTOK KHEN" : "FOOD · TIKTOK FAVOURITES"))}</div>`);
    // 150px fits ~11 characters on one line; shrink longer titles so the pill below stays clear.
    const size = Math.min(150, Math.floor(1560 / s.caption.length));
    parts.push(`<h1 id="${sid}-title" class="hook-title food" style="font-size:${size}px">${words(s.caption)}</h1>`);
    parts.push(`<div id="${sid}-pill" class="pill" style="background:${accent}">${esc(s.label ?? "")}</div>`);
    tw(`tl.fromTo("#${sid}-title", {scale:1.12}, {scale:1, duration:1.4, ease:"expo.out"}, ${a});`);
    fadeUp(`#${sid}-pill`, a + 0.4);
    fadeUp(`#${sid}-kicker`, a + 0.2);
  } else if (s.layout === "point") {
    const enter = a + LEAD;
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div class="floor"></div>`);
    const tilt = s.i % 2 ? -7 : 6;
    parts.push(isFood
      ? seal(sid, vi ? "MÓN" : "DISH", String(s.story.number), enter + 0.9, tilt)
      : seal(sid, vi ? "NGÀY" : "DAY", dayNumber(s.label ?? ""), enter + 0.9, tilt));
    parts.push(`<div class="head">`);
    parts.push(`<div id="${sid}-kicker" class="kicker" style="color:${accent}">${esc(isFood ? `${vi ? "MÓN" : "DISH"} ${s.label}` : (s.label ?? "").toUpperCase())}</div>`);
    // Long names ("Cầu Trường Tiền về đêm") would take three lines beside the seal.
    parts.push(`<h1 id="${sid}-title" class="title"${s.caption.length > 16 ? ' style="font-size:88px"' : ""}>${words(s.caption)}</h1>`);
    fadeUp(`#${sid}-kicker`, enter, 0.25);
    titleIn(`#${sid}-title`, enter + 0.2);

    if (!isFood) {
      (s.points ?? []).forEach((p, k) => {
        parts.push(`<div id="${sid}-pt${k}" class="point"><i style="background:${accent}"></i>${esc(p)}</div>`);
        fadeUp(`#${sid}-pt${k}`, enter + 1.0 + k * 0.45);
      });
      parts.push(`</div>`);
      // Food card when the voice names the first dish (else past the middle), but never
      // before the photo has had CLEAR seconds on its own.
      const cue = Math.max(cueTime(s, s.dishes?.[0]?.spokenAs) ?? a + (s.end - a) * 0.55, enter + CLEAR);
      const rows = (s.dishes ?? [])
        .map((d, k) => `<div id="${sid}-d${k}" class="row"><b>${esc(d.place)}</b><span>${esc(d.address)}</span><em style="background:${accent}">★${d.rating.toFixed(1)}</em></div>`)
        .join("");
      parts.push(`<div id="${sid}-food" class="card"><div class="card-h" style="color:${accent}">${esc(vi ? "ĂN GẦN ĐÂY" : "EAT NEARBY")} · ${esc(s.dishes?.[0]?.name ?? "")}</div>${rows}</div>`);
      tw(`tl.fromTo("#${sid}-food", {opacity:0, y:60, filter:"blur(8px)"}, {opacity:1, y:0, filter:"blur(0px)", duration:0.45, ease:"expo.out"}, ${r2(cue - 0.1)});`);
      tw(`tl.fromTo("#${sid}-food .row", {opacity:0, x:-40}, {opacity:1, x:0, duration:0.3, stagger:0.09, ease:"power3.out"}, ${r2(cue + 0.15)});`);
      // Itinerary rail (decoration under the caption band).
      const idx = stops.findIndex((x) => x.id === s.id);
      const dots = stops.map((x, k) => `<i class="${k < idx ? "done" : k === idx ? "now" : ""}"${k === idx ? ` style="background:${accent};box-shadow:0 0 18px ${accent}"` : ""}></i>`).join("");
      parts.push(`<div id="${sid}-rail" class="rail">${dots}</div>`);
      fadeUp(`#${sid}-rail`, enter + 0.4);
    } else {
      parts.push(`<p id="${sid}-tag" class="point">${esc(s.story.tagline)}</p>`);
      parts.push(`</div>`);
      fadeUp(`#${sid}-tag`, enter + 0.9);
      const secs = s.story.sections;
      // Cards follow the narration cues, held back so the dish photo shows clear for CLEAR
      // seconds and each card stays up at least 1.8 s.
      const times = [];
      secs.forEach((sec, k) => {
        const cue = cueTime(s, sec.cue) ?? enter + 1.5 + k * ((s.end - enter - 2) / secs.length);
        times.push(Math.max(cue, k ? times[k - 1] + 1.8 : enter + CLEAR));
      });
      secs.forEach((sec, k) => {
        const id = `${sid}-c${k}`;
        const body = sec.places
          ? sec.places.map((p) => `<div class="row"><b>${esc(p.place)}</b><span>${esc(p.address)}</span><em style="background:${accent}">★${p.rating.toFixed(1)}</em></div>`).join("")
          : `<p class="card-t">${esc(sec.text)}</p>`;
        parts.push(`<div id="${id}" class="card" style="opacity:0"><div class="card-h" style="color:${accent}">${esc(sec.title.toUpperCase())}<span class="dots">${secs.map((_, j) => `<i class="${j === k ? "on" : ""}"></i>`).join("")}</span></div>${body}</div>`);
        const at = Math.max(times[k], enter + 0.8);
        tw(`tl.fromTo("#${id}", {opacity:0, y:50, filter:"blur(8px)"}, {opacity:1, y:0, filter:"blur(0px)", duration:0.4, ease:"expo.out"}, ${r2(at - 0.05)});`);
        if (k < secs.length - 1) {
          const next = Math.max(times[k + 1], enter + 0.8);
          tw(`tl.to("#${id}", {opacity:0, y:-30, filter:"blur(6px)", duration:0.18, ease:"power3.in"}, ${r2(next - 0.2)});`);
        }
        if (sec.places) tw(`tl.fromTo("#${id} .row", {opacity:0, x:-40}, {opacity:1, x:0, duration:0.3, stagger:0.09, ease:"power3.out"}, ${r2(at + 0.15)});`);
      });
    }
  } else {
    // outro
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div class="floor"></div>`);
    parts.push(`<h1 id="${sid}-title" class="hook-title outro">${words(s.caption)}</h1>`);
    parts.push(`<div id="${sid}-cta" class="pill" style="background:${video.theme.accent};top:1060px">${esc(s.cta ?? "")}</div>`);
    titleIn(`#${sid}-title`, a + LEAD + 0.1);
    fadeUp(`#${sid}-cta`, a + LEAD + 1.0);
  }

  html.push(
    `<section id="${sid}" class="scene clip" data-start="0" data-duration="${total}"${s.i === 0 ? "" : ' style="opacity:0"'}${s.layout === "hook" && !isFood ? ' data-transparent="1"' : ""}>${parts.join("")}</section>`,
  );
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
    if (!cover) line.forEach((w, k) => tw(`tl.set("#${id}-${k}", {color:"${video.theme.highlight ?? s.accent ?? video.theme.accent}"}, ${r2(s.start + LEAD + w.startMs / 1000)});`));
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
const hook = scenes[0];
if (!isFood) {
  media.push(`<video id="dive" class="clip media-full" src="${asset(`${DIVE}.mp4`)}" muted playsinline data-start="0" data-duration="6" data-track-index="0"></video>`);
}
for (const s of scenes) {
  if (!s.clip) continue;
  media.push(`<audio id="vo-${s.id}" src="${asset(s.clip.file)}" data-start="${r2(s.start + LEAD)}" data-duration="${r2(s.clip.durationSec)}" data-volume="1" data-track-index="2"></audio>`);
}
const musicSrc = asset(`shared/music/${path.basename(video.music.src)}`);
const musicLen = probeDurationSec(path.join(PUBLIC_ROOT, video.music.src));
for (let at = 0, k = 0; at < total; at += musicLen - 1, k++) {
  const dur = r2(Math.min(musicLen, total - at));
  media.push(`<audio id="music-${k}" src="${musicSrc}" data-start="${r2(at)}" data-duration="${dur}" data-volume="0.22" data-fade-in="${k ? 1 : 0.4}" data-fade-out="${at + dur >= total - 0.01 ? 1.5 : 1}" data-track-index="3"></audio>`);
}

// ---- shader seams -------------------------------------------------------
// Huế: river ripples, old paper burning away, ink dissolving in mist.
const SHADERS = isFood
  ? ["ripple-waves", "ridged-burn", "domain-warp-dissolve", "light-leak", "ripple-waves"]
  : ["domain-warp-dissolve", "ripple-waves", "ridged-burn", "light-leak", "ripple-waves", "domain-warp-dissolve", "ridged-burn", "light-leak", "ripple-waves"];
const transitions = scenes.slice(1).map((s, k) => ({
  time: r2(s.start - SEAM / 2),
  shader: k === scenes.length - 2 ? "light-leak" : SHADERS[k % SHADERS.length],
  duration: k === 0 && !isFood ? 0.9 : SEAM,
}));

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
:root { --ground:#140c1c; --ink:#fff7ec; --gold:#e8c170; --paper:#f4ead3; --paper-ink:#2b1a14; --seal:#b3261e; }
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:${W}px; height:${H}px; overflow:hidden; background:var(--ground); }
#root { position:relative; width:${W}px; height:${H}px; overflow:hidden; font-family:"Montserrat"; }
.media-full { position:absolute; left:0; top:0; width:${W}px; height:${H}px; object-fit:cover; z-index:0; }
.scene { position:absolute; inset:0; overflow:hidden; background:var(--ground); z-index:1; }
.scene[data-transparent] { background:transparent; }
.ph { position:absolute; inset:0; overflow:hidden; }
.ph img { width:100%; height:100%; object-fit:cover; }
.shade { position:absolute; inset:0; background:radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(5,8,12,0.5) 100%); }
.shade-hook { position:absolute; inset:0; background:radial-gradient(ellipse at 50% 40%, rgba(5,8,12,0.1) 20%, rgba(5,8,12,0.7) 100%); }
.top { position:absolute; left:0; right:0; top:0; height:640px; background:linear-gradient(180deg, rgba(20,12,28,0.85) 0%, rgba(20,12,28,0.45) 60%, rgba(20,12,28,0) 100%); }
/* Lighter than Saigon's: the middle of the frame is for the photo; only the caption band darkens. */
.floor { position:absolute; left:0; right:0; bottom:0; height:880px; background:linear-gradient(180deg, rgba(20,12,28,0) 0%, rgba(20,12,28,0.6) 45%, rgba(20,12,28,0.9) 100%); }
.seal { position:absolute; right:78px; top:190px; width:176px; height:176px; border-radius:18px; background:var(--seal); border:5px double rgba(255,236,214,0.85); box-shadow:0 10px 30px rgba(60,0,0,0.45), inset 0 0 22px rgba(60,0,0,0.5); display:flex; flex-direction:column; align-items:center; justify-content:center; color:#fff1e2; z-index:6; }
.seal small { font:800 28px "Montserrat"; letter-spacing:0.18em; margin-left:0.18em; }
.seal b { font:900 84px/0.95 "Playfair Display"; }
.ink { position:absolute; right:58px; top:170px; width:216px; height:216px; border-radius:30px; border:6px solid var(--seal); z-index:5; }
.frame { position:absolute; inset:26px; border:2px solid rgba(232,193,112,0.55); border-radius:10px; z-index:18; pointer-events:none; }
.frame i { position:absolute; width:26px; height:26px; border:3px solid var(--gold); }
.frame i:nth-child(1) { left:-8px; top:-8px; border-right:none; border-bottom:none; }
.frame i:nth-child(2) { right:-8px; top:-8px; border-left:none; border-bottom:none; }
.frame i:nth-child(3) { left:-8px; bottom:-8px; border-right:none; border-top:none; }
.frame i:nth-child(4) { right:-8px; bottom:-8px; border-left:none; border-top:none; }
.head { position:absolute; left:80px; top:215px; width:740px; display:flex; flex-direction:column; gap:10px; }
.kicker { font:700 34px "Montserrat"; letter-spacing:0.3em; }
.title { margin-bottom:10px; font:800 112px/1.04 "Playfair Display"; color:var(--ink); text-shadow:0 6px 30px rgba(0,0,0,0.55); }
.title .w, .hook-title .w { display:inline-block; }
.point { font:600 38px/1.3 "Montserrat"; color:rgba(255,247,236,0.92); text-shadow:0 2px 14px rgba(0,0,0,0.7); }
.point i { display:inline-block; width:14px; height:14px; border-radius:50%; margin-right:18px; vertical-align:middle; }
/* Cards are cream "giấy dó" paper in the lower third (top 1110), so the photo above stays clear. */
.card { position:absolute; left:60px; width:960px; top:1110px; padding:26px 34px 18px; border-radius:16px; background:var(--paper); border:2px solid var(--gold); box-shadow:0 16px 40px rgba(10,4,14,0.5), inset 0 0 0 6px rgba(232,193,112,0.18); z-index:7; }
.card-h { font:800 28px "Montserrat"; letter-spacing:0.22em; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; filter:brightness(0.62) saturate(1.3); }
.card-t { font:600 40px/1.3 "Montserrat"; color:var(--paper-ink); }
.dots i { display:inline-block; width:12px; height:12px; border-radius:50%; margin-left:10px; background:rgba(43,26,20,0.2); }
.dots i.on { background:currentColor; }
.row { display:flex; align-items:baseline; gap:16px; padding:8px 0; border-top:1px solid rgba(43,26,20,0.12); }
.row b { font:800 36px "Montserrat"; color:var(--paper-ink); white-space:nowrap; }
.row span { font:500 28px "Montserrat"; color:rgba(43,26,20,0.6); flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.row em { font:800 27px "Montserrat"; font-style:normal; color:#fff7ec; padding:4px 14px; border-radius:999px; }
/* Below the subtitle band (cap: top 1500, at most 2 lines), never mid-screen. */
.rail { position:absolute; left:0; right:0; top:1690px; z-index:20; display:flex; justify-content:center; gap:26px; }
.rail i { width:18px; height:18px; border-radius:50%; background:rgba(255,255,255,0.22); }
.rail i.done { background:rgba(255,255,255,0.6); }
.hook-kicker { position:absolute; left:0; right:0; top:515px; text-align:center; font:700 34px "Montserrat"; letter-spacing:0.34em; color:#ffd8a0; }
.hook-title { position:absolute; left:0; right:0; top:610px; text-align:center; font:900 200px/1 "Playfair Display"; color:var(--ink); text-shadow:0 10px 60px rgba(0,0,0,0.6); }
.hook-title.food { font-size:150px; line-height:1.05; top:640px; }
.hook-title.outro { font-size:120px; line-height:1.08; top:640px; padding:0 70px; }
.pill { position:absolute; left:50%; top:860px; transform:translateX(-50%); font:900 50px "Montserrat"; color:#10131a; padding:12px 40px; border-radius:999px; white-space:nowrap; }
.hook-sub { position:absolute; left:80px; right:80px; top:980px; text-align:center; font:600 38px/1.35 "Montserrat"; color:rgba(255,247,236,0.9); text-shadow:0 2px 14px rgba(0,0,0,0.8); }
.cap { position:absolute; left:60px; right:60px; top:1500px; text-align:center; font:800 50px/1.25 "Montserrat"; color:#ffffff; text-shadow:0 3px 0 rgba(0,0,0,0.55), 0 0 22px rgba(0,0,0,0.85); z-index:20;${cover ? " display:none;" : ""} }
.vignette { position:absolute; inset:0; background:radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.35) 100%); z-index:19; pointer-events:none; }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="${W}" data-height="${H}">
${media.join("\n")}
${html.join("\n")}
<div class="vignette" data-layout-ignore></div>
<div class="frame" data-layout-ignore><i></i><i></i><i></i><i></i></div>
${caps.join("\n")}
</div>
<script>
const tl = gsap.timeline({ paused: true });
${js.join("\n")}
HyperShader.init({
  bgColor: "#140c1c",
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
console.log(`build/${slug}: ${scenes.length} scenes, ${total}s, ${caps.length} caption lines, ${assets.size} assets`);
