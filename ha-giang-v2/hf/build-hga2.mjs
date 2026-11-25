#!/usr/bin/env node
/**
 * node hf/build-hga2.mjs --slug ha-giang-am-thuc-v2
 *
 * Turns data/videos/<slug>/video.json + voiceover.json into a HyperFrames project at build/<slug>/.
 * The look ("Hà Giang ăn gì", làm lại 21/11/2026), new for this channel (checked against D:/Thang_space_archive/STYLE-LOG.md):
 *   - no cold open (user removed it from the last food video, 20/11/2026): the voice starts at once while a wooden
 *     market signboard "HÀ GIANG ĂN GÌ?" swings in on two ropes;
 *   - pictures change through a diamond that opens from the centre, or a push from below;
 *   - two strips of brocade pattern (thổ cẩm) run along the top and bottom edges;
 *   - each dish gets a wall clock whose hands spin to the hour people eat it, with "MÓN n/6";
 *   - two short facts pop up as tags; the restaurants are rows burnt into a wooden plank, with the Google Maps proof;
 *   - between two dishes, the dish just eaten comes back as a row of round bowls, stamped "ĐÃ NẾM ✓" (user request 20/11/2026);
 *   - outro: a food map of Hà Giang with the six dishes pinned where to eat them, a gift tag, then "Lưu lại nhé!";
 *   - shader seams: domain-warp, ridged-burn, gravitational-lens, flash-through-white, chromatic-split.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fail, parseArgs, requireSlug } from "../scripts/lib/args.mjs";
import { probeDurationSec } from "../scripts/lib/media.mjs";
import { PROJECT_ROOT, PUBLIC_ROOT } from "../scripts/lib/paths.mjs";

const { flags } = parseArgs(process.argv.slice(2));
const slug = requireSlug(flags, "build-hga2");
const dataDir = path.join(PROJECT_ROOT, "data", "videos", slug);
const video = JSON.parse(readFileSync(path.join(dataDir, "video.json"), "utf8"));
const credits = JSON.parse(readFileSync(path.join(dataDir, "credits.json"), "utf8"));
const voicePath = path.join(dataDir, "voiceover.json");
if (!existsSync(voicePath)) fail(`No voiceover.json for ${slug}; make the voice first.`);
const voice = JSON.parse(readFileSync(voicePath, "utf8")).clips;
const NO_CAPS = Boolean(flags.cover);

const W = 1080;
const H = 1920;
const LEAD = video.transitionFrames / video.format.fps;
const SEAM = 0.75;
const CLEAR = 2.6; // seconds a dish shows uncovered before the first card
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

/** Footage stack. Odd changes: a diamond opens from the centre. Even changes: the new clip pushes up from below. */
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
      tw(`tl.set("#${id}", {"--s":"0%"}, 0);`);
      tw(`tl.fromTo("#${id}", {"--s":"0%"}, {"--s":"105%", duration:0.6, ease:"power3.in", immediateRender:false}, ${r2(a - 0.3)});`);
      tw(`tl.set("#${idPrefix}-p${k - 1}", {opacity:0}, ${r2(a + 0.35)});`);
      sound("whoosh-short", r2(a - 0.3), 0.05);
      return parts.push(`<div id="${id}" class="ph dia">${inner}</div>`);
    }
    tw(`tl.set("#${id}", {opacity:0}, 0);`);
    tw(`tl.fromTo("#${id}", {opacity:1, yPercent:100}, {opacity:1, yPercent:0, duration:0.5, ease:"power3.out", immediateRender:false}, ${r2(a - 0.25)});`);
    tw(`tl.to("#${idPrefix}-p${k - 1}", {yPercent:-25, duration:0.5, ease:"power3.out"}, ${r2(a - 0.25)});`);
    tw(`tl.set("#${idPrefix}-p${k - 1}", {opacity:0}, ${r2(a + 0.3)});`);
    sound("whoosh-cinematic", r2(a - 0.25), 0.05);
    parts.push(`<div id="${id}" class="ph">${inner}</div>`);
  });
  return parts.join("");
};

const titleIn = (sel, at) =>
  tw(`tl.fromTo("${sel} .w", {opacity:0, y:30, filter:"blur(10px)"}, {opacity:1, y:0, filter:"blur(0px)", duration:0.5, stagger:0.07, ease:"power3.out"}, ${r2(at)});`);
const fadeUp = (sel, at, dur = 0.35) =>
  tw(`tl.fromTo("${sel}", {opacity:0, y:26}, {opacity:1, y:0, duration:${dur}, ease:"expo.out"}, ${r2(at)});`);
const hideOut = (sel, at) => tw(`tl.to("${sel}", {opacity:0, y:30, duration:0.35, ease:"power2.in"}, ${r2(at)});`);

const row = (p) => `<div class="row"><b>${esc(p.place)}</b><span>${esc(p.address)}</span><em class="${p.rating == null ? "sugg" : ""}">${star(p.rating)}</em></div>`;

const MAPS = video.maps ?? {};
const MAPS_DATE = "chụp 21/11/2026";
const proofs = (id, rowsSel, places, from, to, hide) => {
  const list = places.map((p, k) => [MAPS[p.place], k]).filter(([m]) => m);
  if (!list.length) return "";
  tw(`tl.to("#${id}", {opacity:0, y:30, duration:0.35, ease:"power2.in"}, ${r2(hide - 0.1)});`);
  const slot = Math.min(0.9, Math.max(0.5, (to - from - 1) / list.length));
  tw(`tl.fromTo("#${id}", {opacity:0, y:40, scale:0.92}, {opacity:1, y:0, scale:1, duration:0.4, ease:"back.out(1.5)"}, ${r2(from + 0.25)});`);
  list.forEach(([, k], i) => {
    const t0 = from + 0.45 + i * slot;
    tw(`tl.fromTo("#${id}-${k}", {opacity:0, x:60}, {opacity:1, x:0, duration:0.35, ease:"power3.out"}, ${r2(t0)});`);
    tw(`tl.fromTo(document.querySelectorAll("${rowsSel}")[${k}], {backgroundColor:"rgba(242,177,52,0)"}, {backgroundColor:"rgba(242,177,52,0.35)", duration:0.25, yoyo:true, repeat:1, repeatDelay:${r2(Math.max(slot - 0.5, 0.2))}}, ${r2(t0)});`);
  });
  return `<div id="${id}" class="gmaps" style="opacity:0"><div class="gmaps-h"><i>📍</i>Google Maps<span>${MAPS_DATE}</span></div>${list.map(([m, k]) => `<img id="${id}-${k}" src="${asset(`videos/ha-giang/maps/${m}.png`)}" alt="" />`).join("")}</div>`;
};

// ---- wall clock badge ------------------------------------------------------------
const clock = (sid, s, at) => {
  const [h, m] = s.time ?? [12, 0];
  const hourDeg = (h % 12) * 30 + m * 0.5 + 360;
  const minDeg = m * 6 + 720;
  tw(`tl.fromTo("#${sid}-clock", {opacity:0, scale:0.4, rotation:-30}, {opacity:1, scale:1, rotation:0, duration:0.45, ease:"back.out(2)"}, ${r2(at)});`);
  tw(`tl.fromTo("#${sid}-hh", {rotation:0}, {rotation:${hourDeg}, duration:1.1, ease:"power3.out"}, ${r2(at + 0.2)});`);
  tw(`tl.fromTo("#${sid}-mh", {rotation:0}, {rotation:${minDeg}, duration:1.1, ease:"power3.out"}, ${r2(at + 0.2)});`);
  sound("pop", r2(at + 0.1), 0.05);
  const ticks = Array.from({ length: 12 }, (_, k) => `<i style="transform:rotate(${k * 30}deg)"></i>`).join("");
  const hhmm = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  return `<div id="${sid}-clock" class="clock" style="opacity:0"><div class="face">${ticks}<b id="${sid}-hh" class="hh"></b><b id="${sid}-mh" class="mh"></b><u></u></div><div class="clock-l"><small>MÓN</small><strong>${s.n}<em>/${dishScenes.length}</em></strong><span>${hhmm}</span></div></div>`;
};

// ---- between two dishes: a row of round bowls -----------------------------------------
const bowls = (s, sid, from) => {
  const list = s.recap;
  const n = list.length;
  const size = n > 3 ? 230 : 280;
  const gap = 20;
  const x0 = (W - (n * size + (n - 1) * gap)) / 2;
  tw(`tl.fromTo("#${sid}-rc", {opacity:0}, {opacity:1, duration:0.3, ease:"power1.out"}, ${r2(from)});`);
  fadeUp(`#${sid}-rc-h`, from + 0.1);
  const items = list.map((name, k) => {
    const t0 = from + 0.3 + k * 0.3;
    tw(`tl.fromTo("#${sid}-bw${k}", {opacity:0, y:-500, rotation:${k % 2 ? 40 : -40}}, {opacity:1, y:0, rotation:0, duration:0.55, ease:"bounce.out"}, ${r2(t0)});`);
    sound("pop", r2(t0 + 0.35), 0.05);
    return `<div id="${sid}-bw${k}" class="bowl" style="left:${r2(x0 + k * (size + gap))}px;width:${size}px;height:${size}px;opacity:0"><img src="${asset(`videos/ha-giang/recap/${name}.jpg`)}" alt="" /></div>`;
  }).join("");
  const stampAt = from + 0.3 + n * 0.3 + 0.3;
  tw(`tl.fromTo("#${sid}-taste", {opacity:0, scale:2.2, rotation:-20}, {opacity:1, scale:1, rotation:-8, duration:0.25, ease:"power4.in"}, ${r2(stampAt)});`);
  sound("impact-bass-1", r2(stampAt + 0.2), 0.06);
  return `<div id="${sid}-rc" class="recap" style="opacity:0"><div id="${sid}-rc-h" class="recap-h"><small>MÓN ${s.n}/${dishScenes.length}</small><b>${esc(s.caption)}</b></div><i class="tray"></i>${items}<div id="${sid}-taste" class="taste" style="opacity:0">ĐÃ NẾM ✓</div></div>`;
};

// ---- scenes -------------------------------------------------------------
for (const s of scenes) {
  const sid = `s-${s.id}`;
  const a = s.start;
  const enter = a + LEAD;
  const parts = [];

  if (s.layout === "hook") {
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div id="${sid}-dim" class="hook-dim"></div>`);
    // Wooden market signboard on two ropes.
    parts.push(`<div id="${sid}-sb" class="signboard" style="opacity:0"><i class="rope l"></i><i class="rope r"></i><div class="plank"><small>${esc(s.kicker)}</small><h1>${words(s.caption)}</h1></div></div>`);
    tw(`tl.fromTo("#${sid}-sb", {opacity:0, y:-900, rotation:-10}, {opacity:1, y:0, rotation:0, duration:1.1, ease:"elastic.out(1, 0.5)"}, ${r2(a + 0.2)});`);
    titleIn(`#${sid}-sb h1`, a + 0.7);
    sound("whoosh-cinematic", r2(a + 0.2), 0.07);
    sound("impact-bass-1", r2(a + 0.75), 0.08);
    const lift = s.vo + Math.min(4.2, (s.clip?.durationSec ?? 6) * 0.5);
    tw(`tl.to("#${sid}-sb", {y:-900, rotation:6, duration:0.6, ease:"power2.in"}, ${r2(lift)});`);
    tw(`tl.to("#${sid}-dim", {opacity:0.3, duration:0.6}, ${r2(lift)});`);
  } else if (s.layout === "dish") {
    const bodyEnd = s.end - (s.recapSec ?? 0);
    parts.push(photos(s, a, bodyEnd, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div class="floor"></div>`);
    parts.push(clock(sid, s, enter + 0.3));
    parts.push(`<div class="head"><div id="${sid}-kicker" class="kicker">${esc(s.tag.toUpperCase())}</div><h1 id="${sid}-title" class="title">${words(s.caption)}</h1></div>`);
    fadeUp(`#${sid}-kicker`, enter, 0.25);
    titleIn(`#${sid}-title`, enter + 0.15);
    const places = s.places ?? [];
    const named = cueTime(s, s.cue) ?? a + (bodyEnd - a) * 0.5;
    const cue = Math.max(Math.min(named, bodyEnd - 2.4 - places.length * 0.9 - 0.4), enter + CLEAR);
    // Two facts as tags, up before the plank.
    (s.facts ?? []).forEach((f, k) => {
      parts.push(`<div id="${sid}-fx${k}" class="ftag" style="opacity:0;top:${1150 + k * 110}px"><i>${k ? "🌶️" : "🥢"}</i>${esc(f)}</div>`);
      tw(`tl.fromTo("#${sid}-fx${k}", {opacity:0, x:-80, rotation:-4}, {opacity:1, x:0, rotation:${k ? 2 : -2}, duration:0.4, ease:"back.out(1.8)"}, ${r2(enter + 0.9 + k * 0.45)});`);
      sound("pop", r2(enter + 1.0 + k * 0.45), 0.04);
    });
    tw(`tl.to("#${sid}-fx0, #${sid}-fx1", {opacity:0, x:60, duration:0.25, ease:"power2.in"}, ${r2(cue - 0.35)});`);
    parts.push(`<div id="${sid}-plank" class="plank2" style="opacity:0"><div class="plank-h">ĂN Ở ĐÂU</div>${places.map((p) => row(p)).join("")}</div>`);
    tw(`tl.fromTo("#${sid}-plank", {opacity:0, y:80, rotation:2}, {opacity:1, y:0, rotation:-1, duration:0.45, ease:"back.out(1.4)"}, ${r2(cue - 0.1)});`);
    tw(`tl.fromTo("#${sid}-plank .row", {opacity:0, x:-40}, {opacity:1, x:0, duration:0.3, stagger:0.09, ease:"power3.out"}, ${r2(cue + 0.15)});`);
    const shown = cue + 0.45 + places.length * 0.9;
    const hide = Math.max(Math.min(shown + 1.4, bodyEnd - 0.9), shown + 0.6);
    tw(`tl.to("#${sid}-plank", {opacity:0, y:30, duration:0.35, ease:"power2.in"}, ${r2(Math.min(hide, bodyEnd - 0.4))});`);
    parts.push(proofs(`${sid}-gm`, `#${sid}-plank .row`, places, cue, bodyEnd, Math.min(hide, bodyEnd - 0.4)));
    if (s.recap?.length) parts.push(bowls(s, sid, bodyEnd));
  } else {
    // Outro: a food map with every dish pinned, a gift tag, then the call to action.
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div id="${sid}-dim" class="hook-dim" style="opacity:0"></div>`);
    tw(`tl.to("#${sid}-dim", {opacity:1, duration:0.5}, ${r2(enter)});`);
    parts.push(`<h1 id="${sid}-title" class="out-title">${words(s.caption)}</h1>`);
    titleIn(`#${sid}-title`, enter + 0.2);
    const AREAS = [["TP Hà Giang", 230, 1270], ["Lô Lô Chải", 380, 720], ["Đồng Văn", 760, 860]];
    const where = { TP: 0, "Lô Lô": 1, "Đồng Văn": 2, khuya: 2 };
    const used = [0, 0, 0];
    const pins = (s.pins ?? []).map(([dish, area], k) => {
      const ai = where[area] ?? 0;
      const [, ax, ay] = AREAS[ai];
      const j = used[ai]++;
      const x = ax - 80, y = ay + 90 + j * 92;
      tw(`tl.fromTo("#${sid}-pin${k}", {opacity:0, y:-60, scale:0.6}, {opacity:1, y:0, scale:1, duration:0.35, ease:"back.out(2.4)"}, ${r2(enter + 1.0 + k * 0.28)});`);
      sound("pop", r2(enter + 1.1 + k * 0.28), 0.04);
      return `<div id="${sid}-pin${k}" class="fpin" style="left:${x}px;top:${y}px;opacity:0"><i>${k + 1}</i><span>${esc(dish)}</span></div>`;
    }).join("");
    const areas = AREAS.map(([n, x, y]) => `<div class="area" style="left:${x}px;top:${y}px"><b>${esc(n)}</b></div>`).join("");
    parts.push(`<div id="${sid}-fmap" class="fmap" style="opacity:0"><svg viewBox="0 0 1080 1920"><path d="M230 1270 C 300 1000, 330 860, 380 720 S 640 760, 760 860" /></svg>${areas}${pins}</div>`);
    tw(`tl.fromTo("#${sid}-fmap", {opacity:0}, {opacity:1, duration:0.4}, ${r2(enter + 0.7)});`);
    const giftAt = enter + 1.0 + (s.pins ?? []).length * 0.28 + 0.3;
    parts.push(`<div id="${sid}-gift" class="gift" style="opacity:0"><small>${esc(s.kicker ?? "")}</small><b>${esc(s.gift ?? "")}</b></div>`);
    tw(`tl.fromTo("#${sid}-gift", {opacity:0, rotation:-25, y:-120}, {opacity:1, rotation:-6, y:0, duration:0.6, ease:"elastic.out(1, 0.55)"}, ${r2(giftAt)});`);
    const ctaAt = Math.min(giftAt + 1.2, s.end - 1.6);
    parts.push(`<div id="${sid}-cta" class="pill cta" style="opacity:0">Lưu lại nhé!</div>`);
    tw(`tl.fromTo("#${sid}-cta", {opacity:0, scale:0.5}, {opacity:1, scale:1, duration:0.4, ease:"back.out(2.4)"}, ${r2(ctaAt)});`);
    sound("impact-bass-1", r2(ctaAt), 0.09);
  }

  html.push(`<section id="${sid}" class="scene"${s.i === 0 ? "" : ' style="opacity:0"'}>${parts.join("")}</section>`);
}

// ---- brocade strips along the edges --------------------------------------------------------
tw(`tl.fromTo(".brocade.t", {backgroundPositionX:"0px"}, {backgroundPositionX:"-${Math.round(total * 30)}px", duration:${total}, ease:"none"}, 0);`);
tw(`tl.fromTo(".brocade.b", {backgroundPositionX:"0px"}, {backgroundPositionX:"${Math.round(total * 30)}px", duration:${total}, ease:"none"}, 0);`);

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
const musicSrc = asset(video.music.src);
const musicLen = probeDurationSec(path.join(PUBLIC_ROOT, video.music.src));
for (let at = 0, k = 0; at < total - 0.05; k++) {
  const dur = r2(Math.min(musicLen, total - at));
  const last = at + dur >= total - 0.01;
  mediaTags.push(`<audio id="music-${k}" src="${musicSrc}" data-start="${r2(at)}" data-duration="${dur}" data-volume="0.2" data-fade-in="${k ? 1 : 0.4}" data-fade-out="${last ? 1.5 : 1}" data-track-index="${k % 2 ? 31 : 30}"></audio>`);
  if (last) break;
  at = r2(at + dur - 1);
}

// ---- shader seams + quiet whooshes -----------------------------------
const SHADERS = ["domain-warp", "ridged-burn", "gravitational-lens", "flash-through-white", "chromatic-split"];
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
:root { --ground:#21160f; --ink:#fbf3e6; --wood:#8a5a36; --woodd:#5e3a20; --chili:#c8321e; --leaf:#7fb069; --corn:#f2b134; --smoke:#3a2a1f; }
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:${W}px; height:${H}px; overflow:hidden; background:var(--ground); }
#root { position:relative; width:${W}px; height:${H}px; overflow:hidden; font-family:"Be Vietnam Pro"; }
.scene { position:absolute; inset:0; overflow:hidden; background:var(--ground); z-index:1; }
.ph { position:absolute; inset:0; overflow:hidden; }
.ph video { width:100%; height:100%; object-fit:cover; display:block; filter:saturate(1.08) sepia(0.06); }
/* Diamond that opens from the centre. */
.dia { --s:0%; clip-path:polygon(50% calc(50% - var(--s)), calc(50% + var(--s)) 50%, 50% calc(50% + var(--s)), calc(50% - var(--s)) 50%); }
.cr { position:absolute; left:60px; top:118px; z-index:4; font:600 22px "Be Vietnam Pro"; color:rgba(251,243,230,0.85); text-shadow:0 2px 8px rgba(0,0,0,0.7); }
.shade { position:absolute; inset:0; background:linear-gradient(180deg, rgba(20,12,8,0.2) 0%, rgba(20,12,8,0) 35%, rgba(20,12,8,0) 65%, rgba(20,12,8,0.35) 100%); }
.top { position:absolute; left:0; right:0; top:0; height:720px; background:linear-gradient(180deg, rgba(26,16,10,0.85) 0%, rgba(26,16,10,0.5) 55%, rgba(26,16,10,0) 100%); }
.floor { position:absolute; left:0; right:0; bottom:0; height:900px; background:linear-gradient(180deg, rgba(26,16,10,0) 0%, rgba(26,16,10,0.6) 45%, rgba(26,16,10,0.93) 100%); }
.hook-dim { position:absolute; inset:0; z-index:4; background:linear-gradient(180deg, rgba(26,16,10,0.45) 0%, rgba(26,16,10,0.1) 45%, rgba(26,16,10,0.8) 100%); }
.brocade { position:absolute; left:0; right:0; height:24px; z-index:19; opacity:0.9; background:
  linear-gradient(135deg, transparent 0 25%, var(--corn) 25% 30%, transparent 30% 70%, var(--corn) 70% 75%, transparent 75%) 0 0/48px 24px,
  repeating-linear-gradient(90deg, var(--chili) 0 24px, #1a1a1a 24px 30px, var(--leaf) 30px 42px, #1a1a1a 42px 48px); }
.brocade.t { top:0; } .brocade.b { bottom:0; }
/* Hook: wooden signboard on two ropes. */
.signboard { position:absolute; left:90px; right:90px; top:0; height:1120px; z-index:8; transform-origin:50% 0%; }
.rope { position:absolute; top:0; width:8px; height:820px; background:repeating-linear-gradient(180deg, #c8a77a 0 14px, #9b7a4e 14px 22px); }
.rope.l { left:140px; } .rope.r { right:140px; }
.plank { position:absolute; left:0; right:0; top:800px; padding:36px 40px 40px; border-radius:24px; text-align:center; background:linear-gradient(180deg, #9c6a40, #7a4e2c); box-shadow:0 30px 60px rgba(0,0,0,0.6), inset 0 0 0 8px rgba(60,36,18,0.6), inset 0 -10px 0 rgba(0,0,0,0.15); }
.plank small { font:800 28px "Be Vietnam Pro"; color:var(--corn); letter-spacing:0.14em; }
.plank h1 { margin-top:10px; font:400 120px/1.05 "Patrick Hand"; color:var(--ink); text-shadow:0 4px 0 rgba(60,36,18,0.8); }
.title .w, .out-title .w, .plank h1 .w { display:inline-block; }
/* Wall clock + dish number. */
.clock { position:absolute; right:60px; top:140px; z-index:6; display:flex; align-items:center; gap:14px; padding:14px 20px 14px 14px; border-radius:90px 30px 30px 90px; background:rgba(33,22,15,0.85); box-shadow:0 12px 24px rgba(0,0,0,0.45); }
.face { position:relative; width:130px; height:130px; border-radius:50%; background:var(--ink); border:8px solid var(--wood); }
.face i { position:absolute; left:50%; top:4px; width:4px; height:12px; margin-left:-2px; background:var(--woodd); transform-origin:50% 53px; }
.face b { position:absolute; left:50%; bottom:50%; border-radius:4px; transform-origin:50% 100%; }
.face .hh { width:8px; height:34px; margin-left:-4px; background:#2b1d16; }
.face .mh { width:5px; height:48px; margin-left:-2.5px; background:var(--chili); }
.face u { position:absolute; left:50%; top:50%; width:14px; height:14px; margin:-7px 0 0 -7px; border-radius:50%; background:#2b1d16; }
.clock-l { text-align:left; }
.clock-l small { display:block; font:900 20px "Be Vietnam Pro"; color:var(--corn); letter-spacing:0.2em; }
.clock-l strong { display:block; font:900 64px/1 "Be Vietnam Pro"; color:var(--ink); }
.clock-l strong em { font:800 28px "Be Vietnam Pro"; font-style:normal; color:rgba(251,243,230,0.6); }
.clock-l span { display:block; font:800 26px "Be Vietnam Pro"; color:var(--leaf); }
.head { position:absolute; left:80px; top:340px; width:640px; display:flex; flex-direction:column; gap:10px; z-index:5; }
.kicker { font:800 28px "Be Vietnam Pro"; color:var(--corn); letter-spacing:0.06em; }
.title { margin-bottom:10px; font:900 100px/1.04 "Be Vietnam Pro"; color:var(--ink); text-shadow:0 6px 30px rgba(0,0,0,0.55); }
.ftag { position:absolute; left:70px; z-index:7; padding:14px 30px 14px 22px; border-radius:16px; background:var(--ink); color:#2b1d16; font:800 40px "Be Vietnam Pro"; box-shadow:0 12px 24px rgba(0,0,0,0.45); white-space:nowrap; }
.ftag i { font-style:normal; margin-right:14px; }
/* Wooden plank with the restaurants. */
.plank2 { position:absolute; left:60px; width:960px; top:1110px; padding:22px 34px 16px; border-radius:18px; z-index:7; background:linear-gradient(180deg, #8f5f38, #6d4426); box-shadow:0 18px 40px rgba(0,0,0,0.5), inset 0 0 0 5px rgba(60,36,18,0.55); }
.plank-h { font:900 26px "Be Vietnam Pro"; color:var(--corn); letter-spacing:0.16em; margin-bottom:8px; }
.row { display:flex; align-items:baseline; gap:16px; padding:10px 6px; border-top:2px solid rgba(251,243,230,0.15); border-radius:8px; }
.row b { font:800 33px "Be Vietnam Pro"; color:var(--ink); white-space:nowrap; }
.row span { font:500 25px "Be Vietnam Pro"; color:rgba(251,243,230,0.7); flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.row em { font:800 26px "Be Vietnam Pro"; font-style:normal; color:#2b1d16; background:var(--corn); padding:4px 14px; border-radius:999px; white-space:nowrap; }
.row em.sugg { background:var(--leaf); }
.gmaps { position:absolute; left:400px; width:620px; bottom:830px; border-radius:22px; overflow:hidden; background:#fff; box-shadow:0 16px 40px rgba(0,0,0,0.5); z-index:8; }
.gmaps-h { display:flex; align-items:center; gap:10px; padding:12px 22px; background:#f1f3f4; font:700 24px "Be Vietnam Pro"; color:#3c4043; }
.gmaps-h i { font-style:normal; }
.gmaps-h span { margin-left:auto; font:500 20px "Be Vietnam Pro"; color:#70757a; }
.gmaps img { display:block; width:100%; border-top:1px solid #e8eaed; }
/* Row of bowls between dishes. */
.recap { position:absolute; inset:0; z-index:9; background:radial-gradient(ellipse at 50% 55%, #4a3222 0%, #2b1d14 60%, #170f0a 100%); }
.recap-h { position:absolute; left:80px; right:80px; top:430px; text-align:center; }
.recap-h small { display:block; font:900 30px "Be Vietnam Pro"; color:var(--corn); letter-spacing:0.18em; }
.recap-h b { display:block; margin-top:8px; font:400 116px/1.05 "Patrick Hand"; color:var(--ink); }
.tray { position:absolute; left:40px; right:40px; top:1060px; height:40px; border-radius:20px; background:repeating-linear-gradient(90deg, #b58a55 0 18px, #9c7442 18px 22px); box-shadow:0 14px 26px rgba(0,0,0,0.5); }
.bowl { position:absolute; top:800px; border-radius:50%; overflow:hidden; border:14px solid #f3ead8; box-shadow:0 18px 30px rgba(0,0,0,0.55), inset 0 0 0 4px rgba(0,0,0,0.1); }
.bowl img { width:100%; height:100%; object-fit:cover; display:block; }
.taste { position:absolute; left:50%; top:1200px; margin-left:-210px; width:420px; text-align:center; padding:14px 0; border:9px solid var(--chili); border-radius:18px; color:var(--chili); font:900 64px/1 "Be Vietnam Pro"; background:rgba(251,243,230,0.9); }
/* Outro: food map. */
.out-title { position:absolute; left:40px; right:40px; top:300px; text-align:center; z-index:7; font:400 124px/1.05 "Patrick Hand"; color:var(--ink); text-shadow:0 8px 40px rgba(0,0,0,0.6); }
.fmap { position:absolute; inset:0; z-index:8; }
.fmap svg { position:absolute; inset:0; width:1080px; height:1920px; }
.fmap path { fill:none; stroke:rgba(242,177,52,0.75); stroke-width:8; stroke-dasharray:18 16; stroke-linecap:round; }
.area { position:absolute; width:0; height:0; }
.area b { position:absolute; left:-140px; top:-34px; width:280px; text-align:center; padding:6px 0; border-radius:12px; background:var(--chili); color:#fff; font:900 32px "Be Vietnam Pro"; box-shadow:0 8px 16px rgba(0,0,0,0.45); }
.fpin { position:absolute; width:0; height:0; }
.fpin i { position:absolute; left:-24px; top:-24px; width:48px; height:48px; border-radius:50%; background:var(--corn); color:#2b1d16; font:900 26px/48px "Be Vietnam Pro"; font-style:normal; text-align:center; box-shadow:0 4px 10px rgba(0,0,0,0.5); }
.fpin span { position:absolute; left:32px; top:-22px; padding:3px 12px; border-radius:10px; background:rgba(33,22,15,0.88); color:var(--ink); font:800 28px "Be Vietnam Pro"; white-space:nowrap; }
.gift { position:absolute; left:120px; top:520px; z-index:9; padding:18px 34px 18px 70px; border-radius:16px 70px 70px 16px; background:var(--ink); box-shadow:0 14px 30px rgba(0,0,0,0.5); }
.gift::before { content:""; position:absolute; left:24px; top:50%; width:24px; height:24px; margin-top:-12px; border-radius:50%; background:var(--ground); }
.gift small { display:block; font:900 22px "Be Vietnam Pro"; color:var(--chili); letter-spacing:0.14em; }
.gift b { display:block; font:900 46px "Be Vietnam Pro"; color:#2b1d16; }
.pill { position:absolute; left:50%; top:1520px; transform:translateX(-50%); font:900 64px "Be Vietnam Pro"; color:#2b1d16; background:var(--corn); padding:16px 56px; border-radius:999px; white-space:nowrap; z-index:9; }
.brand { position:absolute; left:60px; top:62px; z-index:21; font:800 26px "Be Vietnam Pro"; letter-spacing:0.3em; color:rgba(251,243,230,0.9); text-shadow:0 2px 10px rgba(0,0,0,0.5); }
.brand b { color:var(--corn); letter-spacing:0; margin-right:12px; }
.cap { position:absolute; left:60px; right:60px; top:1500px; text-align:center; font:800 50px/1.25 "Be Vietnam Pro"; color:#ffffff; text-shadow:0 3px 0 rgba(0,0,0,0.55), 0 0 22px rgba(0,0,0,0.85); z-index:20; }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="${W}" data-height="${H}">
${mediaTags.join("\n")}
${sfx.join("\n")}
${html.join("\n")}
<i class="brocade t" data-layout-ignore></i><i class="brocade b" data-layout-ignore></i>
<div class="brand" data-layout-ignore><b>✿</b>${esc(video.theme.brand)}</div>
${caps.join("\n")}
</div>
<script>
const tl = gsap.timeline({ paused: true });
${js.join("\n")}
HyperShader.init({
  bgColor: "#21160f",
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
