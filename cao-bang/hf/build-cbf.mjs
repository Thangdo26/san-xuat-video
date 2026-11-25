#!/usr/bin/env node
/**
 * node hf/build-cbf.mjs --slug cao-bang-am-thuc [--cover]
 *
 * Food video for the Cao Bằng winter remake (14/11/2026). New look for the food series:
 *   - intro: a wooden table seen from above; five plates (the dishes) slide in from the edges, the title
 *     lands in the middle, then the table lifts away onto real footage of Cao Bằng at sunset;
 *   - dish photos mixed with footage (chestnuts roasting and being peeled), changing with a soft bloom;
 *   - each dish gets a steaming-bowl badge with its number; warm embers rise over every scene;
 *   - origin / how it's made / how to eat / where cards in the lower third, Google Maps proofs for the shops;
 *   - outro: a winter menu card; each dish gets a red tick drawn next to it, then the question and the CTA.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fail, parseArgs, requireSlug } from "../scripts/lib/args.mjs";
import { probeDurationSec } from "../scripts/lib/media.mjs";
import { PROJECT_ROOT, PUBLIC_ROOT } from "../scripts/lib/paths.mjs";

const { flags } = parseArgs(process.argv.slice(2));
const slug = requireSlug(flags, "build-cbf");
const dataDir = path.join(PROJECT_ROOT, "data", "videos", slug);
const video = JSON.parse(readFileSync(path.join(dataDir, "video.json"), "utf8"));
const voicePath = path.join(dataDir, "voiceover.json");
if (!existsSync(voicePath)) fail(`No voiceover.json for ${slug}; make the voice first.`);
const voice = JSON.parse(readFileSync(voicePath, "utf8")).clips;

const W = 1080;
const H = 1920;
const LEAD = video.transitionFrames / video.format.fps;
const SEAM = 0.75;
const CLEAR = 3;
const brand = video.theme.brand ?? "CAO BẰNG";

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
const star = (r) => (r == null ? "gợi ý" : `★${r.toFixed(1)}`);

let t = 0;
const scenes = video.scenes.map((s, i) => {
  const start = t;
  t += s.durationSec;
  return { ...s, i, start, end: t, clip: voice[s.id] };
});
const total = r2(t);
const dishes = scenes.filter((s) => s.layout === "point");

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
  { from: "scale:1.1,x:-50,y:0", to: "scale:1.1,x:50,y:0" },
  { from: "scale:1.03,x:0,y:40", to: "scale:1.16,x:0,y:-40" },
  { from: "scale:1.1,x:50,y:0", to: "scale:1.1,x:-50,y:0" },
];

let videoTrack = 40;
/** Photo / footage stack; each new item blooms in (fade from a slight zoom with a warm flash). */
const photos = (s, from, to, idPrefix) => {
  const g = s.gallery ?? [];
  const seg = (to - from) / g.length;
  return g
    .map((src, k) => {
      const id = `${idPrefix}-p${k}`;
      const a = r2(from + seg * k);
      const mv = MOVES[(s.i + k) % MOVES.length];
      const isVideo = src.endsWith(".mp4");
      const inner = isVideo
        ? `<video id="${id}-v" class="clip" src="${asset(src)}" muted playsinline data-start="${r2(Math.max(0, a - 0.9))}" data-duration="${r2(Math.min(seg + 1.8, total - Math.max(0, a - 0.9)))}" data-track-index="${videoTrack++}"></video>`
        : `<img src="${asset(src)}" alt="" />`;
      tw(`tl.fromTo("#${id} ${isVideo ? "video" : "img"}", {${isVideo ? "scale:1.02" : mv.from}}, {${isVideo ? "scale:1.1" : mv.to}, duration:${r2(seg + 0.8)}, ease:"none"}, ${a});`);
      if (k === 0) return `<div id="${id}" class="ph">${inner}</div>`;
      tw(`tl.set("#${id}", {opacity:0}, 0);`);
      tw(`tl.fromTo("#${id}", {opacity:0, scale:1.1}, {opacity:1, scale:1, duration:0.7, ease:"power2.out", immediateRender:false}, ${a});`);
      tw(`tl.fromTo("#${idPrefix}-fl${k}", {opacity:0}, {keyframes:[{opacity:0.55, duration:0.18}, {opacity:0, duration:0.5}]}, ${a});`);
      tw(`tl.to("#${idPrefix}-p${k - 1}", {opacity:0, duration:0.01}, ${r2(a + 0.72)});`);
      sound("whoosh-short", r2(a), 0.07);
      return `<div id="${id}" class="ph">${inner}</div><i id="${idPrefix}-fl${k}" class="warmflash" style="opacity:0"></i>`;
    })
    .join("");
};

const titleIn = (sel, at) =>
  tw(`tl.fromTo("${sel} .w", {opacity:0, y:30}, {opacity:1, y:0, duration:0.5, stagger:0.08, ease:"power3.out"}, ${r2(at)});`);
const fadeUp = (sel, at, dur = 0.35) =>
  tw(`tl.fromTo("${sel}", {opacity:0, y:26}, {opacity:1, y:0, duration:${dur}, ease:"expo.out"}, ${r2(at)});`);
const hideOut = (sel, at) => tw(`tl.to("${sel}", {opacity:0, y:30, duration:0.4, ease:"power2.in"}, ${r2(at)});`);

/** Steaming-bowl badge: the bowl pops in with the dish number, three wisps of steam keep rising. */
const bowl = (sid, num, accent, at, end) => {
  tw(`tl.fromTo("#${sid}-bw", {opacity:0, scale:0.5, y:-20}, {opacity:1, scale:1, y:0, duration:0.5, ease:"back.out(2)"}, ${r2(at)});`);
  sound("pop", r2(at + 0.2), 0.1);
  for (let k = 0; k < 3; k++) {
    for (let st = at + 0.3 + k * 0.5, n = 0; st < end - 0.2; st += 1.6, n++) {
      tw(`tl.fromTo("#${sid}-st${k}", {y:10, opacity:0, scaleY:0.7}, {keyframes:[{y:-30, opacity:0.85, scaleY:1, duration:0.6}, {y:-70, opacity:0, scaleY:1.2, duration:0.9}], immediateRender:${n === 0}}, ${r2(st)});`);
    }
  }
  const steam = [0, 1, 2].map((k) => `<path id="${sid}-st${k}" d="M${88 + k * 42} 92 C ${78 + k * 42} 76, ${100 + k * 42} 64, ${88 + k * 42} 46 C ${78 + k * 42} 34, ${96 + k * 42} 24, ${90 + k * 42} 10" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="7" stroke-linecap="round" style="opacity:0"/>`).join("");
  return `<div id="${sid}-bw" class="bowl" style="opacity:0"><svg viewBox="0 0 260 230" width="260" height="230">${steam}<path d="M20 110 H240 C 236 180, 190 220, 130 220 C 70 220, 24 180, 20 110 Z" fill="${accent}"/><path d="M20 110 H240" stroke="#fff" stroke-width="8" stroke-linecap="round"/><rect x="92" y="216" width="76" height="12" rx="6" fill="${accent}"/><text x="130" y="185" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="54" fill="#2a1d14">${esc(num)}</text></svg></div>`;
};

const row = (p, accent) => `<div class="row"><b>${esc(p.place)}</b><span>${esc(p.address)}</span><em style="background:${p.rating == null ? "rgba(27,36,64,0.12)" : accent}">${star(p.rating)}</em></div>`;

const MAPS = video.maps ?? {};
const MAPS_DATE = "chụp 06/11/2026";
const clearAt = (from, n, end) => {
  const shown = from + 0.45 + n * 0.9;
  const t = Math.max(Math.min(shown + 1.6, end - 1.2), shown + 0.8);
  return t < end - 0.5 ? t : null;
};
const proofs = (sid, rowsSel, places, from, to, hide = null) => {
  const list = places.map((p, k) => [MAPS[p.place], k]).filter(([m]) => m);
  if (!list.length) return "";
  if (hide != null) hideOut(`#${sid}-gm`, hide - 0.1);
  const id = `${sid}-gm`, slot = Math.min(0.9, (to - from - 1) / list.length);
  tw(`tl.fromTo("#${id}", {opacity:0, y:40, scale:0.92}, {opacity:1, y:0, scale:1, duration:0.4, ease:"back.out(1.5)"}, ${r2(from + 0.25)});`);
  list.forEach(([, k], i) => {
    const t0 = from + 0.45 + i * slot;
    tw(`tl.fromTo("#${id}-${k}", {opacity:0, x:60}, {opacity:1, x:0, duration:0.35, ease:"power3.out"}, ${r2(t0)});`);
    tw(`tl.fromTo(document.querySelectorAll("${rowsSel}")[${k}], {backgroundColor:"rgba(255,207,90,0)"}, {backgroundColor:"rgba(255,207,90,0.35)", duration:0.25, yoyo:true, repeat:1, repeatDelay:${r2(Math.max(slot - 0.5, 0.2))}}, ${r2(t0)});`);
  });
  return `<div id="${id}" class="gmaps" style="opacity:0"><div class="gmaps-h"><i>📍</i>Google Maps<span>${MAPS_DATE}</span></div>${list.map(([m, k]) => `<img id="${id}-${k}" src="${asset(`videos/cao-bang/maps/${m}.png`)}" alt="" />`).join("")}</div>`;
};

/** Origin / made / eat / where cards, one at a time on their cues; the last card (and Maps) clears once read. */
const storyCards = (sid, s, enter, accent) => {
  const secs = s.story?.sections ?? [];
  const times = [];
  secs.forEach((c, k) => {
    const cue = cueTime(s, c.cue) ?? enter + 1.5 + k * ((s.end - enter - 2) / secs.length);
    times.push(Math.max(cue, k ? times[k - 1] + 1.8 : enter + CLEAR));
  });
  const ICON = { origin: "🌿", made: "🔥", eat: "🥢", where: "📍" };
  const parts = [];
  secs.forEach((c, k) => {
    const id = `${sid}-c${k}`;
    const places = c.places ?? [];
    const body = places.length ? places.map((p) => row(p, accent)).join("") : `<p class="card-t">${esc(c.text)}</p>`;
    parts.push(`<div id="${id}" class="card" style="opacity:0"><div class="card-h"><span>${ICON[c.part] ?? "•"} ${esc(c.title.toUpperCase())}</span><span class="dots">${secs.map((_, j) => `<i class="${j === k ? "on" : ""}"></i>`).join("")}</span></div>${body}</div>`);
    tw(`tl.fromTo("#${id}", {opacity:0, y:50}, {opacity:1, y:0, duration:0.45, ease:"expo.out"}, ${r2(times[k] - 0.05)});`);
    if (places.length) tw(`tl.fromTo("#${id} .row", {opacity:0, x:-40}, {opacity:1, x:0, duration:0.3, stagger:0.09, ease:"power3.out"}, ${r2(times[k] + 0.15)});`);
    if (k < secs.length - 1) tw(`tl.to("#${id}", {opacity:0, y:-30, duration:0.2, ease:"power3.in"}, ${r2(times[k + 1] - 0.22)});`);
    else {
      const hide = clearAt(times[k], places.length, s.end);
      if (hide != null) hideOut(`#${id}`, hide);
      parts.push(proofs(sid, `#${id} .row`, places, times[k], s.end, hide));
    }
  });
  return parts.join("");
};

// ---- top-down table intro ---------------------------------------------------
const PLATE_POS = [[20, 150], [370, 110], [720, 150], [110, 1060], [630, 1060]];
const PLATE_FROM = [[-700, -300], [0, -700], [700, -300], [-700, 500], [700, 500]];
const tableIntro = (s, sid) => {
  const a = s.start;
  const parts = [photos(s, a, s.end, sid), `<div class="shade"></div>`];
  const plates = dishes.map((d, k) => {
    const [x, y] = PLATE_POS[k % PLATE_POS.length];
    const [fx, fy] = PLATE_FROM[k % PLATE_FROM.length];
    const at = a + 0.25 + k * 0.3;
    tw(`tl.fromTo("#${sid}-pl${k}", {opacity:0, x:${fx}, y:${fy}, rotation:${k % 2 ? 40 : -40}}, {opacity:1, x:0, y:0, rotation:${k % 2 ? 6 : -6}, duration:0.7, ease:"power3.out"}, ${r2(at)});`);
    sound("pop", r2(at + 0.55), 0.07);
    return `<div id="${sid}-pl${k}" class="plate" style="left:${x}px;top:${y}px;opacity:0"><img src="${asset(d.gallery[0])}" alt="" /><span>${esc(d.caption)}</span></div>`;
  }).join("");
  parts.push(`<div id="${sid}-table" class="table">${plates}<i class="chop"></i></div>`);
  const lift = a + 4.4;
  tw(`tl.to("#${sid}-table", {opacity:0, scale:1.25, y:-120, duration:0.8, ease:"power2.in"}, ${r2(lift)});`);
  sound("whoosh-cinematic", r2(lift), 0.12);
  return { html: parts.join(""), titleAt: a + 2.0 };
};

// ---- warm embers rising over everything --------------------------------------
const embers = [];
for (let k = 0; k < 14; k++) {
  const x0 = 40 + ((k * 331) % 1000);
  const size = 6 + ((k * 7) % 9);
  const dur = 7 + ((k * 11) % 5);
  embers.push(`<i id="em${k}" class="ember" style="left:${x0}px;width:${size}px;height:${size}px" data-layout-ignore></i>`);
  for (let at = (k * 0.7) % 4, n = 0; at < total; at += dur, n++) {
    const drift = (k % 2 ? 1 : -1) * (40 + ((k * 17) % 80));
    tw(`tl.fromTo("#em${k}", {x:0, y:${H + 40}, opacity:0}, {keyframes:[{x:${drift / 2}, y:${H * 0.6}, opacity:0.8, duration:${r2(dur * 0.3)}}, {x:${drift}, y:${H * 0.1}, opacity:0, duration:${r2(dur * 0.7)}}], ease:"none", immediateRender:${n === 0}}, ${r2(at)});`);
  }
}

// ---- scenes -------------------------------------------------------------
for (const s of scenes) {
  const sid = `s-${s.id}`;
  const a = s.start;
  const enter = a + LEAD;
  const accent = s.accent ?? video.theme.accent;
  const parts = [];

  if (s.layout === "hook") {
    const m = tableIntro(s, sid);
    parts.push(m.html);
    parts.push(`<div id="${sid}-dim" class="hook-dim" style="opacity:0"></div>`);
    parts.push(`<div id="${sid}-tc" class="tcard" style="opacity:0"><div id="${sid}-kicker" class="hook-kicker">${esc(s.kicker)}</div><h1 id="${sid}-title" class="hook-title">${words(s.caption)}</h1><div id="${sid}-pill" class="pill">${esc(s.label ?? "")}</div></div>`);
    tw(`tl.fromTo("#${sid}-tc", {opacity:0, scale:0.7, rotation:-4}, {opacity:1, scale:1, rotation:0, duration:0.6, ease:"back.out(1.8)"}, ${r2(m.titleAt)});`);
    sound("impact-bass-1", r2(m.titleAt + 0.2), 0.08);
    tw(`tl.to("#${sid}-dim", {opacity:1, duration:0.6}, ${r2(a + 4.6)});`);
  } else if (s.layout === "point") {
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div class="floor"></div>`);
    parts.push(bowl(sid, `${s.story.number}/${s.story.total}`, accent, enter + 0.5, s.end));
    parts.push(`<div class="head"><div id="${sid}-kicker" class="kicker" style="color:${accent}">MÓN ${s.story.number} · ${esc(s.story.tagline.toUpperCase())}</div><h1 id="${sid}-title" class="title"${s.caption.length > 12 ? ' style="font-size:90px"' : ""}>${words(s.caption)}</h1></div>`);
    fadeUp(`#${sid}-kicker`, enter, 0.25);
    titleIn(`#${sid}-title`, enter + 0.2);
    parts.push(storyCards(sid, s, enter, accent));
    const xs = dishes.map((_, k) => 250 + (580 * k) / Math.max(1, dishes.length - 1));
    const idx = dishes.findIndex((x) => x.id === s.id);
    const dots = dishes.map((x, k) => `<i class="${k < idx ? "done" : ""}" style="left:${r2(xs[k] - 9)}px${k === idx ? `;background:${accent};box-shadow:0 0 18px ${accent}` : ""}"></i>`).join("");
    parts.push(`<div id="${sid}-rail" class="rail"><span class="trail"></span>${dots}</div>`);
    fadeUp(`#${sid}-rail`, enter + 0.4);
  } else {
    // Outro: a winter menu; each dish gets a red tick drawn beside it, then the question and the CTA.
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div id="${sid}-dim" class="hook-dim" style="opacity:0"></div>`);
    tw(`tl.to("#${sid}-dim", {opacity:1, duration:0.5}, ${r2(enter)});`);
    const names = s.names ?? [];
    const items = names.map((n, k) => `<div class="mi"><span>${esc(n)}</span><svg viewBox="0 0 60 50" width="60" height="50"><path id="${sid}-tk${k}" d="M6 26 L22 42 L54 8" fill="none" stroke="#d6453d" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" pathLength="1000" style="stroke-dasharray:1000 1200;stroke-dashoffset:1100"/></svg></div>`).join("");
    parts.push(`<div id="${sid}-menu" class="menu" style="opacity:0"><div class="menu-h">THỰC ĐƠN MÙA LẠNH</div><div class="menu-s">CAO BẰNG</div>${items}</div>`);
    tw(`tl.fromTo("#${sid}-menu", {opacity:0, y:80, rotation:3}, {opacity:1, y:0, rotation:-1.5, duration:0.6, ease:"back.out(1.5)"}, ${r2(enter + 0.1)});`);
    names.forEach((_, k) => {
      const at = enter + 0.8 + k * 0.38;
      tw(`tl.fromTo("#${sid}-tk${k}", {strokeDashoffset:1100}, {strokeDashoffset:0, duration:0.3, ease:"power2.out"}, ${r2(at)});`);
      sound("pop", r2(at + 0.1), 0.06);
    });
    const q = enter + 0.8 + names.length * 0.38 + 0.4;
    parts.push(`<h1 id="${sid}-title" class="outq" style="opacity:0">${words(s.caption)}</h1>`);
    tw(`tl.fromTo("#${sid}-title", {opacity:0, scale:1.15}, {opacity:1, scale:1, duration:0.7, ease:"expo.out", immediateRender:false}, ${r2(q)});`);
    parts.push(`<div id="${sid}-cta" class="pill cta" style="opacity:0">${esc(s.cta ?? "")}</div>`);
    fadeUp(`#${sid}-cta`, q + 0.6);
    sound("impact-bass-1", r2(q + 0.2), 0.08);
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
    if (line.length && (len > 30 || /[.,!?]$/.test(line.at(-1).text.trim()))) flush(w.startMs);
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

const SHADERS = ["swirl-vortex", "light-leak", "cross-warp-morph", "ripple-waves"];
const transitions = scenes.slice(1).map((s, k) => ({
  time: r2(s.start - SEAM / 2),
  shader: k === scenes.length - 2 ? "flash-through-white" : SHADERS[k % SHADERS.length],
  duration: SEAM,
}));
for (const tr of transitions) sound("whoosh-short", r2(tr.time - 0.1), 0.15);

const page = `<!doctype html>
<html lang="vi">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=${W}, height=${H}" />
<title>${esc(video.title)}</title>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@hyperframes/shader-transitions@0.8.223/dist/index.global.js"></script>
<style>
:root { --ground:#1a120d; --ink:#fbf6ee; --gold:#ffcf5a; --red:#d6453d; --slate:#2a1d14; --paper:#fbf3e4; --wood:#5a3a24; }
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:${W}px; height:${H}px; overflow:hidden; background:var(--ground); }
#root { position:relative; width:${W}px; height:${H}px; overflow:hidden; font-family:"Montserrat"; }
.scene { position:absolute; inset:0; overflow:hidden; background:var(--ground); z-index:1; }
.ph { position:absolute; inset:0; overflow:hidden; }
.ph img, .ph video { width:100%; height:100%; object-fit:cover; display:block; }
.warmflash { position:absolute; inset:0; z-index:3; background:linear-gradient(180deg, rgba(255,214,150,0.7), rgba(255,170,90,0.5)); }
.shade { position:absolute; inset:0; background:linear-gradient(180deg, rgba(20,12,8,0.2) 0%, rgba(20,12,8,0) 35%, rgba(20,12,8,0) 65%, rgba(20,12,8,0.35) 100%); }
.top { position:absolute; left:0; right:0; top:0; height:700px; background:linear-gradient(180deg, rgba(26,16,10,0.9) 0%, rgba(26,16,10,0.55) 55%, rgba(26,16,10,0) 100%); }
.floor { position:absolute; left:0; right:0; bottom:0; height:900px; background:linear-gradient(180deg, rgba(26,16,10,0) 0%, rgba(26,16,10,0.6) 45%, rgba(26,16,10,0.94) 100%); }
.hook-dim { position:absolute; inset:0; z-index:4; background:linear-gradient(180deg, rgba(26,16,10,0.4) 0%, rgba(26,16,10,0.25) 50%, rgba(26,16,10,0.85) 100%); }
.ember { position:absolute; top:0; z-index:16; border-radius:50%; background:#ffb45a; box-shadow:0 0 12px 4px rgba(255,150,60,0.6); pointer-events:none; opacity:0; }
/* Intro: wooden table from above with five plates. */
.table { position:absolute; inset:0; z-index:5; background:repeating-linear-gradient(90deg, #6b4529 0 150px, #5d3b23 150px 154px, #714a2c 154px 300px, #5d3b23 300px 304px); }
.plate { position:absolute; width:340px; height:340px; border-radius:50%; background:#f6f1e8; box-shadow:0 22px 40px rgba(0,0,0,0.55), inset 0 0 0 14px #fff, inset 0 0 0 18px #e2d8c6; padding:30px; }
.plate img { width:280px; height:280px; border-radius:50%; object-fit:cover; display:block; }
.plate span { position:absolute; left:50%; bottom:-28px; transform:translateX(-50%); padding:8px 22px; border-radius:999px; background:var(--red); font:800 28px "Montserrat"; color:#fff; white-space:nowrap; box-shadow:0 8px 16px rgba(0,0,0,0.4); }
.chop { position:absolute; left:1020px; top:560px; width:16px; height:520px; border-radius:8px; background:linear-gradient(90deg, #c99a5b, #e9c58e, #c99a5b); transform:rotate(18deg); box-shadow:28px 6px 0 #d8ad6f, 0 10px 20px rgba(0,0,0,0.4); }
.tcard { position:absolute; left:120px; right:120px; top:560px; z-index:7; padding:40px 30px 50px; border-radius:34px; background:rgba(251,243,228,0.97); box-shadow:0 30px 60px rgba(0,0,0,0.55); text-align:center; }
.hook-kicker { font:800 28px "Montserrat"; letter-spacing:0.22em; color:var(--red); }
.hook-title { margin-top:16px; font:900 104px/1.02 "Playfair Display"; color:var(--slate); }
.hook-title .w, .title .w, .outq .w { display:inline-block; }
.tcard .pill { position:relative; left:auto; transform:none; display:inline-block; margin-top:24px; background:var(--gold); }
.pill { position:absolute; left:50%; transform:translateX(-50%); font:900 44px "Montserrat"; color:var(--slate); padding:12px 40px; border-radius:999px; white-space:nowrap; z-index:8; }
.pill.cta { top:1330px; background:var(--gold); }
/* Steaming bowl badge. */
.bowl { position:absolute; right:40px; top:70px; z-index:6; filter:drop-shadow(0 12px 18px rgba(0,0,0,0.5)); }
.head { position:absolute; left:80px; top:215px; width:640px; display:flex; flex-direction:column; gap:12px; z-index:5; }
.kicker { font:800 30px "Montserrat"; letter-spacing:0.2em; }
.title { font:800 112px/1.02 "Playfair Display"; color:var(--ink); text-shadow:0 6px 30px rgba(0,0,0,0.55); }
.card { position:absolute; left:60px; width:960px; top:1120px; padding:28px 34px 18px 50px; border-radius:18px; background:rgba(251,243,228,0.98); box-shadow:0 18px 40px rgba(0,0,0,0.45); z-index:7; overflow:hidden; }
.card::before { content:""; position:absolute; left:0; top:0; bottom:0; width:16px; background:linear-gradient(180deg, var(--gold), var(--red)); }
.card-h { font:800 28px "Montserrat"; letter-spacing:0.16em; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; color:var(--red); }
.card-t { font:600 40px/1.3 "Montserrat"; color:var(--slate); }
.dots i { display:inline-block; width:12px; height:12px; border-radius:50%; margin-left:10px; background:rgba(42,29,20,0.2); }
.dots i.on { background:var(--red); }
.row { display:flex; align-items:baseline; gap:16px; padding:8px 0; border-top:1px solid rgba(42,29,20,0.14); border-radius:10px; }
.row b { font:800 36px "Montserrat"; color:var(--slate); white-space:nowrap; }
.row span { font:500 28px "Montserrat"; color:rgba(42,29,20,0.6); flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.row em { font:800 27px "Montserrat"; font-style:normal; color:var(--slate); padding:4px 14px; border-radius:999px; white-space:nowrap; box-shadow:inset 0 0 0 2px rgba(42,29,20,0.25); }
.gmaps { position:absolute; left:400px; width:620px; bottom:820px; border-radius:22px; overflow:hidden; background:#fff; box-shadow:0 16px 40px rgba(0,0,0,0.5); z-index:8; }
.gmaps-h { display:flex; align-items:center; gap:10px; padding:12px 22px; background:#f1f3f4; font:700 24px "Montserrat"; color:#3c4043; }
.gmaps-h i { font-style:normal; }
.gmaps-h span { margin-left:auto; font:500 20px "Montserrat"; color:#70757a; }
.gmaps img { display:block; width:100%; border-top:1px solid #e8eaed; }
.rail { position:absolute; left:0; right:0; top:1676px; height:46px; z-index:20; }
.rail .trail { position:absolute; left:240px; right:240px; top:21px; height:4px; background:repeating-linear-gradient(90deg, rgba(255,255,255,0.7) 0 10px, rgba(255,255,255,0) 10px 20px); }
.rail i { position:absolute; top:11px; width:24px; height:24px; margin-left:-3px; border-radius:50%; background:#4a3a30; border:3px solid rgba(255,255,255,0.6); }
.rail i.done { background:#fff; }
/* Outro: winter menu card. */
.menu { position:absolute; left:150px; right:150px; top:260px; z-index:7; padding:40px 56px 30px; border-radius:16px; background:var(--paper); box-shadow:0 30px 60px rgba(0,0,0,0.55); border:3px double rgba(214,69,61,0.5); }
.menu-h { text-align:center; font:900 40px "Playfair Display"; letter-spacing:0.06em; color:var(--red); }
.menu-s { text-align:center; margin:6px 0 14px; font:700 24px "Montserrat"; letter-spacing:0.4em; color:rgba(42,29,20,0.6); }
.mi { display:flex; justify-content:space-between; align-items:center; padding:14px 0; border-top:2px dotted rgba(42,29,20,0.25); }
.mi span { font:800 40px "Montserrat"; color:var(--slate); }
.outq { position:absolute; left:40px; right:40px; top:1060px; z-index:8; text-align:center; font:900 100px/1.05 "Playfair Display"; color:var(--ink); text-shadow:0 8px 40px rgba(0,0,0,0.6); }
.brand { position:absolute; left:60px; top:60px; z-index:21; font:800 26px "Montserrat"; letter-spacing:0.3em; color:rgba(251,246,238,0.85); text-shadow:0 2px 10px rgba(0,0,0,0.5); }
.brand b { color:var(--gold); letter-spacing:0; margin-right:12px; }
.cap { position:absolute; left:60px; right:60px; top:1500px; text-align:center; font:800 50px/1.25 "Montserrat"; color:#ffffff; text-shadow:0 3px 0 rgba(0,0,0,0.55), 0 0 22px rgba(0,0,0,0.85); z-index:20;${cover ? " display:none;" : ""} }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="${W}" data-height="${H}">
${media.join("\n")}
${sfx.join("\n")}
${html.join("\n")}
${embers.join("\n")}
<div class="brand" data-layout-ignore><b>◆</b>${esc(brand)}</div>
${caps.join("\n")}
</div>
<script>
const tl = gsap.timeline({ paused: true });
${js.join("\n")}
HyperShader.init({
  bgColor: "#1a120d",
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
