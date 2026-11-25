#!/usr/bin/env node
/**
 * node hf/build-cbw.mjs --slug cao-bang-3n2d [--cover]
 *
 * Turns data/videos/<slug>/video.json + voiceover.json into a HyperFrames project at
 * build/<slug>/. The look ("Cao Bằng · mùa đông", remake of 14/11/2026), new for this channel:
 *   - intro: a tear-off wall calendar; "THÁNG 11" then the three trip days are torn off one by one,
 *     the last tear opens onto real drone footage and the title;
 *   - real footage (Pexels, Pixabay clips of Cao Bằng) mixed with the photos;
 *   - photos change with a dew-drop ripple: a soft circle grows from a point with a ring of light;
 *   - each stop gets a little calendar leaf badge that flips down ("NGÀY 1 · SÁNG", distance);
 *   - golden leaves drift down over every scene;
 *   - the stop rail is a dotted trail with a red pin that hops to the current stop;
 *   - "Hết bao nhiêu tiền?" is a thermometer: each line raises the mercury, the total sits at the top;
 *   - outro: polaroids of the five stops drop onto a clothesline, then the title and the CTA;
 *   - shader seams: light leak, gravitational lens, ripple waves, chromatic split, domain-warp dissolve.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fail, parseArgs, requireSlug } from "../scripts/lib/args.mjs";
import { probeDurationSec } from "../scripts/lib/media.mjs";
import { PROJECT_ROOT, PUBLIC_ROOT } from "../scripts/lib/paths.mjs";

const { flags } = parseArgs(process.argv.slice(2));
const slug = requireSlug(flags, "build-cbw");
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
// Where each dew-drop ripple starts (x%, y%), cycling.
const DROPS = [[30, 38], [72, 30], [50, 62], [24, 70], [78, 58]];

let videoTrack = 40;
/** Photo (or footage) stack; each new item opens from a dew-drop: a soft circle grows from a point with a ring of light. */
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
      if (k > 1 || s.i % 2 === 0) {
        // Other photos bloom in (fade + settle): the radial masks are heavy layers for the capture, so only
        // the first change in every other scene gets the dew-drop.
        tw(`tl.fromTo("#${id}", {opacity:0, scale:1.08}, {opacity:1, scale:1, duration:0.7, ease:"power2.out", immediateRender:false}, ${a});`);
        tw(`tl.set("#${id}", {opacity:0}, 0);`);
        tw(`tl.to("#${idPrefix}-p${k - 1}", {opacity:0, duration:0.01}, ${r2(a + 0.72)});`);
        return `<div id="${id}" class="ph">${inner}</div>`;
      }
      const [cx, cy] = DROPS[(s.i + k) % DROPS.length];
      tw(`tl.set("#${id}", {"--r":"0px"}, 0);`);
      tw(`tl.fromTo("#${id}", {"--r":"0px"}, {"--r":"2300px", duration:0.95, ease:"power2.in", immediateRender:false}, ${a});`);
      tw(`tl.fromTo("#${idPrefix}-rg${k}", {scale:0.1, opacity:0.95}, {scale:9, opacity:0, duration:0.95, ease:"power2.in", immediateRender:false}, ${a});`);
      tw(`tl.to("#${idPrefix}-p${k - 1}", {opacity:0, duration:0.01}, ${r2(a + 0.97)});`);
      sound("sparkle", r2(a + 0.02), 0.06);
      const ring = `<i id="${idPrefix}-rg${k}" class="ring" style="left:${r2((W * cx) / 100 - 120)}px;top:${r2((H * cy) / 100 - 120)}px;opacity:0"></i>`;
      return `<div id="${id}" class="ph drop" style="--cx:${cx}%;--cy:${cy}%">${inner}</div>${ring}`;
    })
    .join("");
};

const titleIn = (sel, at) =>
  tw(`tl.fromTo("${sel} .w", {opacity:0, y:30}, {opacity:1, y:0, duration:0.5, stagger:0.08, ease:"power3.out"}, ${r2(at)});`);
const fadeUp = (sel, at, dur = 0.35) =>
  tw(`tl.fromTo("${sel}", {opacity:0, y:26}, {opacity:1, y:0, duration:${dur}, ease:"expo.out"}, ${r2(at)});`);

/** Calendar leaf badge: a small wall-calendar page flips down from its binding, "NGÀY 1 · SÁNG" and the distance. */
const leaf = (sid, big, small, note, accent, at) => {
  tw(`tl.fromTo("#${sid}-lf", {opacity:0, rotationX:-100, transformPerspective:900}, {opacity:1, rotationX:0, transformPerspective:900, duration:0.7, ease:"back.out(1.7)"}, ${r2(at)});`);
  tw(`tl.fromTo("#${sid}-lf .lf-t", {opacity:0, y:14}, {opacity:1, y:0, duration:0.3, stagger:0.1, ease:"power3.out"}, ${r2(at + 0.45)});`);
  sound("pop", r2(at + 0.5), 0.1);
  return `<div id="${sid}-lf" class="leafcal" style="opacity:0"><i class="hole l"></i><i class="hole r"></i><div class="lf-band">${esc(big)}</div><b class="lf-t">${esc(small)}</b>${note ? `<small class="lf-t" style="color:${accent}">${esc(note)}</small>` : ""}</div>`;
};

const row = (p, accent) => `<div class="row"><b>${esc(p.place)}</b><span>${esc(p.address)}</span><em style="background:${p.rating == null ? "rgba(27,36,64,0.12)" : accent}">${star(p.rating)}</em></div>`;

// Google Maps screenshots (name + stars + review count), captured 06/11/2026 into public/videos/cao-bang/maps.
const MAPS = video.maps ?? {};
const MAPS_DATE = "chụp 06/11/2026";

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
const hideOut = (sel, at) => tw(`tl.to("${sel}", {opacity:0, y:30, duration:0.4, ease:"power2.in"}, ${r2(at)});`);

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
    tw(`tl.fromTo(document.querySelectorAll("${rowsSel}")[${k}], {backgroundColor:"rgba(255,207,90,0)"}, {backgroundColor:"rgba(255,207,90,0.35)", duration:0.25, yoyo:true, repeat:1, repeatDelay:${r2(Math.max(slot - 0.5, 0.2))}}, ${r2(t0)});`);
  });
  return `<div id="${id}" class="gmaps" style="opacity:0"><div class="gmaps-h"><i>📍</i>Google Maps<span>${MAPS_DATE}</span></div>${list.map(([m, k]) => `<img id="${id}-${k}" src="${asset(`videos/cao-bang/maps/${m}.png`)}" alt="" />`).join("")}</div>`;
};

/** Cards shown one at a time at given times (each up at least 1.8 s). */
const cardSeq = (sid, s, cards, enter) => {
  const times = [];
  cards.forEach((c, k) => {
    const cue = cueTime(s, c.cue) ?? enter + 1.5 + k * ((s.end - enter - 2) / cards.length);
    times.push(Math.max(cue, k ? times[k - 1] + 1.8 : enter + CLEAR));
  });
  const parts = [];
  cards.forEach((c, k) => {
    const id = `${sid}-c${k}`;
    parts.push(`<div id="${id}" class="card" style="opacity:0"><div class="card-h">${esc(c.title.toUpperCase())}<span class="dots">${cards.map((_, j) => `<i class="${j === k ? "on" : ""}"></i>`).join("")}</span></div>${c.body}</div>`);
    tw(`tl.fromTo("#${id}", {opacity:0, y:50}, {opacity:1, y:0, duration:0.45, ease:"expo.out"}, ${r2(times[k] - 0.05)});`);
    if (k < cards.length - 1) tw(`tl.to("#${id}", {opacity:0, y:-30, duration:0.2, ease:"power3.in"}, ${r2(times[k + 1] - 0.22)});`);
    else if (s.end - times[k] > 3.2) hideOut(`#${id}`, s.end - 1.1);
    if (c.rows) tw(`tl.fromTo("#${id} .row", {opacity:0, x:-40}, {opacity:1, x:0, duration:0.3, stagger:0.09, ease:"power3.out"}, ${r2(times[k] + 0.15)});`);
  });
  return parts.join("");
};

// ---- tear-off calendar intro ---------------------------------------------
const calIntro = (s, sid) => {
  const a = s.start;
  const parts = [photos(s, a, s.end, sid), `<div class="shade"></div>`];
  const pages = [["THÁNG", "11", "mùa nước xanh · sáng se lạnh", "2026 · CAO BẰNG"], ...(s.pages ?? []).map(([day, place], k) => [day, String(k + 1), place, "THÁNG 11"])];
  const leaves = pages
    .map(([kick, num, line, band], k) => `<div id="${sid}-pg${k}" class="pg" style="z-index:${20 - k}"><div class="pg-band">${esc(band)}</div><em>${esc(kick)}</em><b>${esc(num)}</b><p>${esc(line)}</p></div>`)
    .join("");
  parts.push(`<div id="${sid}-wall" class="wall"><div id="${sid}-cal" class="cal" style="opacity:0"><div class="cal-bind">${Array.from({ length: 6 }, () => "<i></i>").join("")}</div><div class="cal-stack">${leaves}</div></div></div>`);
  tw(`tl.fromTo("#${sid}-cal", {opacity:0, y:-80, rotation:-3}, {opacity:1, y:0, rotation:0, duration:0.6, ease:"back.out(1.6)"}, ${r2(a + 0.1)});`);
  const tearAt = pages.map((_, k) => a + 1.15 + k * 0.72);
  pages.forEach((_, k) => {
    const at = tearAt[k];
    // The page rips from the binding: it swings up and away, curling as it goes.
    tw(`tl.to("#${sid}-pg${k}", {keyframes:[{rotation:${k % 2 ? 6 : -6}, y:-14, duration:0.12, ease:"power1.out"}, {rotation:${k % 2 ? 34 : -34}, x:${k % 2 ? 520 : -520}, y:-620, opacity:0, duration:0.48, ease:"power2.in"}]}, ${r2(at)});`);
    sound("whoosh-short", r2(at + 0.05), 0.12);
  });
  const open = tearAt.at(-1) + 0.1;
  tw(`tl.to("#${sid}-wall", {opacity:0, scale:1.35, duration:0.7, ease:"power2.in"}, ${r2(open)});`);
  sound("whoosh-cinematic", r2(open), 0.12);
  return { html: parts.join(""), settle: r2(open + 0.6) };
};

// ---- golden leaves drifting down over everything ---------------------------
const LEAF_PATH = "M0 -26 C 16 -18, 20 4, 0 26 C -20 4, -16 -18, 0 -26 Z M0 -22 L0 30";
const LEAF_COLORS = ["#f2b134", "#e07a2e", "#c94f2c", "#f5cf63", "#d9902f"];
const leavesFx = [];
for (let k = 0; k < 11; k++) {
  const x0 = 60 + ((k * 397) % 960);
  const size = 0.8 + ((k * 37) % 7) / 10;
  const dur = 9 + ((k * 13) % 6);
  const color = LEAF_COLORS[k % LEAF_COLORS.length];
  leavesFx.push(`<svg id="lf${k}" class="fall" viewBox="-30 -30 60 64" width="${r2(46 * size)}" height="${r2(50 * size)}" style="left:${x0}px" data-layout-ignore><path d="${LEAF_PATH}" fill="${color}" stroke="rgba(90,40,10,0.5)" stroke-width="2"/></svg>`);
  for (let at = (k * 0.9) % 5, n = 0; at < total; at += dur, n++) {
    const drift = (k % 2 ? 1 : -1) * (120 + ((k * 29) % 140));
    tw(`tl.fromTo("#lf${k}", {x:0, y:-90, rotation:${(k * 47) % 360}}, {x:${drift}, y:${H + 80}, rotation:${((k * 47) % 360) + (k % 2 ? 420 : -420)}, duration:${dur}, ease:"none", immediateRender:${n === 0}}, ${r2(at)});`);
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
    const m = calIntro(s, sid);
    parts.push(m.html);
    parts.push(`<div id="${sid}-dim" class="hook-dim" style="opacity:0"></div>`);
    parts.push(`<div id="${sid}-kicker" class="hook-kicker" style="opacity:0">${esc(s.kicker)}</div>`);
    parts.push(`<h1 id="${sid}-title" class="hook-title" style="opacity:0">${words(s.caption)}</h1>`);
    parts.push(`<div id="${sid}-pill" class="pill" style="background:${accent};top:1370px;opacity:0">${esc(s.label ?? "")}</div>`);
    tw(`tl.to("#${sid}-dim", {opacity:1, duration:0.6}, ${m.settle});`);
    tw(`tl.fromTo("#${sid}-title", {scale:1.25, opacity:0}, {scale:1, opacity:1, duration:1, ease:"expo.out", immediateRender:false}, ${m.settle});`);
    fadeUp(`#${sid}-kicker`, m.settle + 0.3);
    fadeUp(`#${sid}-pill`, m.settle + 0.6);
  } else if (s.layout === "point") {
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div class="floor"></div>`);
    const idx = stops.findIndex((x) => x.id === s.id);
    const [day, part] = s.label.split("·").map((x) => x.trim().toUpperCase());
    parts.push(leaf(sid, day, part, s.badge, accent, enter + 0.6));
    parts.push(`<div class="head">`);
    parts.push(`<div id="${sid}-kicker" class="kicker" style="color:${accent}">${esc(s.label.toUpperCase())}</div>`);
    parts.push(`<h1 id="${sid}-title" class="title"${s.caption.length > 13 ? ' style="font-size:88px"' : ""}>${words(s.caption)}</h1>`);
    fadeUp(`#${sid}-kicker`, enter, 0.25);
    titleIn(`#${sid}-title`, enter + 0.2);
    (s.points ?? []).forEach((p, k) => {
      parts.push(`<div id="${sid}-pt${k}" class="point"><i style="background:${accent}"></i>${esc(p)}</div>`);
      fadeUp(`#${sid}-pt${k}`, enter + 1.0 + k * 0.45);
    });
    parts.push(`</div>`);
    // Up when the place is named, or early enough to be read and cleared before the scene ends.
    const named = cueTime(s, s.dishes?.[0]?.spokenAs ?? s.dishes?.[0]?.place) ?? a + (s.end - a) * 0.55;
    const cue = Math.max(Math.min(named, s.end - 1.4 - (s.dishes ?? []).length * 0.9 - 0.45), enter + CLEAR);
    parts.push(`<div id="${sid}-food" class="card"><div class="card-h">ĂN GẦN ĐÂY · ${esc(s.dishes?.[0]?.name ?? "")}</div>${(s.dishes ?? []).map((d) => row(d, accent)).join("")}</div>`);
    tw(`tl.fromTo("#${sid}-food", {opacity:0, y:60}, {opacity:1, y:0, duration:0.5, ease:"expo.out"}, ${r2(cue - 0.1)});`);
    tw(`tl.fromTo("#${sid}-food .row", {opacity:0, x:-40}, {opacity:1, x:0, duration:0.3, stagger:0.09, ease:"power3.out"}, ${r2(cue + 0.15)});`);
    // The eat-nearby card and its Maps panel clear away once read, so the place's photos show again.
    const hide = clearAt(cue, (s.dishes ?? []).length, s.end);
    if (hide != null) hideOut(`#${sid}-food`, hide);
    parts.push(proofs(sid, `#${sid}-food .row`, s.dishes ?? [], cue, s.end, hide));
    // Dotted trail under the subtitle band: the red pin hops from the last stop to this one.
    const xs = stops.map((_, k) => 250 + (580 * k) / Math.max(1, stops.length - 1));
    const dots = stops.map((x, k) => `<i class="${k < idx ? "done" : ""}" style="left:${r2(xs[k] - 9)}px${k === idx ? `;background:${accent};box-shadow:0 0 18px ${accent}` : ""}"></i>`).join("");
    parts.push(`<div id="${sid}-rail" class="rail"><span class="trail"></span>${dots}<b id="${sid}-pin" class="rpin" style="left:${r2(xs[Math.max(0, idx - 1)] - 15)}px"></b></div>`);
    fadeUp(`#${sid}-rail`, enter + 0.4);
    if (idx > 0) {
      const dx = r2(xs[idx] - xs[idx - 1]);
      tw(`tl.fromTo("#${sid}-pin", {x:0}, {x:${dx}, duration:0.9, ease:"power2.inOut"}, ${r2(enter + 0.6)});`);
      tw(`tl.fromTo("#${sid}-pin", {y:0}, {keyframes:[{y:-34, duration:0.45, ease:"power2.out"}, {y:0, duration:0.45, ease:"bounce.out"}]}, ${r2(enter + 0.6)});`);
    }
  } else if (s.layout === "stay") {
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div class="floor"></div>`);
    parts.push(leaf(sid, "Ở ĐÂU", "LƯU TRÚ", "2 đêm", accent, enter + 0.6));
    parts.push(`<div class="head"><div id="${sid}-kicker" class="kicker" style="color:${accent}">TRƯỚC KHI ĐẶT PHÒNG</div><h1 id="${sid}-title" class="title">${words(s.caption)}</h1></div>`);
    fadeUp(`#${sid}-kicker`, enter, 0.25);
    titleIn(`#${sid}-title`, enter + 0.2);
    const cards = s.zones.map((z, k) => ({
      title: `${k + 1} · ${z.title}`, cue: s.cues[k], rows: true,
      body: `<p class="card-n">${esc(z.note)}</p>` + z.picks.map(([n, r, ad]) => row({ place: n, address: ad, rating: r }, accent)).join(""),
    }));
    cards.push({ title: "Mẹo", cue: s.cues.at(-1), body: `<p class="card-t">${esc(s.tip)}</p>` });
    parts.push(cardSeq(sid, s, cards, enter));
  } else if (s.layout === "cost") {
    // "Hết bao nhiêu tiền?": a thermometer; every line raises the mercury, the total glows at the top.
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div class="floor"></div><div id="${sid}-veil" class="veil" style="opacity:0"></div>`);
    parts.push(`<div class="head"><div id="${sid}-kicker" class="kicker" style="color:${accent}">${esc(s.kicker ?? "")}</div><h1 id="${sid}-title" class="title" style="font-size:88px">${words(s.caption)}</h1></div>`);
    fadeUp(`#${sid}-kicker`, enter, 0.25);
    titleIn(`#${sid}-title`, enter + 0.2);
    const t0 = enter + 1.4;
    tw(`tl.fromTo("#${sid}-veil", {opacity:0}, {opacity:1, duration:0.5}, ${r2(t0 - 0.2)});`);
    const items = s.items ?? [];
    const totalAt = Math.max(cueTime(s, s.totalCue) ?? s.end - 3.2, t0 + items.length * 0.45 + 0.6);
    const step = Math.min(0.75, (totalAt - t0 - 0.5) / Math.max(1, items.length));
    const lines = items.map((it, k) => {
      const at = t0 + 0.6 + k * step;
      tw(`tl.fromTo("#${sid}-ln${k}", {opacity:0, x:-50}, {opacity:1, x:0, duration:0.35, ease:"power3.out"}, ${r2(at)});`);
      tw(`tl.to("#${sid}-hg", {scaleY:${r2(0.12 + (0.7 * (k + 1)) / items.length)}, duration:0.45, ease:"power2.out"}, ${r2(at + 0.05)});`);
      if (k % 2 === 0) sound("pop", r2(at + 0.05), 0.07);
      return `<div id="${sid}-ln${k}" class="ln" style="opacity:0"><span>${esc(it.k)}${it.note ? `<small>${esc(it.note)}</small>` : ""}</span><b>${esc(it.v)}</b></div>`;
    }).join("");
    parts.push(`<div id="${sid}-list" class="clist" style="opacity:0"><div class="cl-h">${esc(s.receiptTitle ?? "")}</div>${lines}<div class="cl-f">${esc(s.note ?? "")}</div></div>`);
    fadeUp(`#${sid}-list`, t0);
    const ticks = ["3 tr", "2 tr", "1 tr", "0"].map((l, k) => `<span style="top:${40 + k * 260}px">${l}</span>`).join("");
    parts.push(`<div id="${sid}-th" class="thermo" style="opacity:0"><div class="tube"><i id="${sid}-hg" class="hg"></i></div><div class="bulb"></div><div class="tk">${ticks}</div></div><div id="${sid}-tot" class="th-tot" style="opacity:0"><small>TỔNG / NGƯỜI</small>${esc(s.total)}</div>`);
    tw(`tl.set("#${sid}-hg", {scaleY:0.05, transformOrigin:"50% 100%"}, 0);`);
    fadeUp(`#${sid}-th`, t0 + 0.1);
    tw(`tl.to("#${sid}-hg", {scaleY:0.9, duration:0.5, ease:"power2.out"}, ${r2(totalAt - 0.1)});`);
    tw(`tl.fromTo("#${sid}-tot", {opacity:0, scale:0.6}, {opacity:1, scale:1, duration:0.4, ease:"back.out(2)"}, ${r2(totalAt)});`);
    sound("impact-bass-1", r2(totalAt + 0.2), 0.1);
    parts.push(`<div id="${sid}-stamp" class="stamp" style="opacity:0">${esc(s.stamp ?? "")}</div>`);
    tw(`tl.fromTo("#${sid}-stamp", {opacity:0, scale:2.2, rotation:-24}, {opacity:1, scale:1, rotation:-8, duration:0.35, ease:"power4.in"}, ${r2(totalAt + 0.8)});`);
  } else {
    // Outro: polaroids of the stops drop onto a clothesline, then the title and the CTA.
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div id="${sid}-dim" class="hook-dim" style="opacity:0"></div>`);
    tw(`tl.to("#${sid}-dim", {opacity:1, duration:0.6}, ${r2(enter)});`);
    const pol = s.polaroids ?? [];
    const xs = pol.map((_, k) => 25 + k * 210);
    // The rope sags in the middle (quadratic from y=290 at the edges to ~365 at the centre).
    const sag = (x) => { const u = (x + 100) / W; return 290 + 300 * u * (1 - u); };
    parts.push(`<svg id="${sid}-rope" class="rope" viewBox="0 0 1080 420" width="1080" height="420" style="opacity:0"><path d="M-20 290 Q 540 440 1100 290" fill="none" stroke="#e9dcc3" stroke-width="5"/></svg>`);
    fadeUp(`#${sid}-rope`, enter + 0.1);
    pol.forEach((p, k) => {
      const at = enter + 0.4 + k * 0.32;
      const rot = k % 2 ? 3 : -3;
      parts.push(`<div id="${sid}-po${k}" class="polar${k % 2 ? " low" : ""}" style="left:${xs[k]}px;top:${r2(sag(xs[k]) + (k % 2 ? 70 : 0))}px;z-index:${7 + (k % 2)};opacity:0"><i class="peg"></i><img src="${asset(p.src)}" alt="" /><span>${esc(p.label)}</span></div>`);
      tw(`tl.fromTo("#${sid}-po${k}", {opacity:0, y:-420, rotation:${rot * 5}}, {opacity:1, y:0, rotation:${rot}, duration:0.9, ease:"elastic.out(1, 0.5)"}, ${r2(at)});`);
      sound("pop", r2(at + 0.35), 0.08);
    });
    const done = enter + 0.4 + pol.length * 0.32 + 1.1;
    parts.push(`<div id="${sid}-kicker" class="hook-kicker out" style="opacity:0">${esc(s.kicker ?? "")}</div>`);
    parts.push(`<h1 id="${sid}-title" class="hook-title out" style="opacity:0">${words(s.caption)}</h1>`);
    fadeUp(`#${sid}-kicker`, done);
    tw(`tl.fromTo("#${sid}-title", {scale:1.2, opacity:0}, {scale:1, opacity:1, duration:0.9, ease:"expo.out", immediateRender:false}, ${r2(done + 0.2)});`);
    parts.push(`<div id="${sid}-cta" class="pill" style="background:${video.theme.accent};top:1330px;opacity:0">${esc(s.cta ?? "")}</div>`);
    fadeUp(`#${sid}-cta`, done + 0.8);
    sound("impact-bass-1", r2(done + 0.3), 0.09);
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

// ---- shader seams + quiet whooshes -----------------------------------
const SHADERS = ["light-leak", "gravitational-lens", "ripple-waves", "chromatic-split"];
const transitions = scenes.slice(1).map((s, k) => ({
  time: r2(s.start - SEAM / 2),
  shader: k === scenes.length - 2 ? "domain-warp-dissolve" : SHADERS[k % SHADERS.length],
  duration: SEAM,
}));
for (const tr of transitions) sound("whoosh-short", r2(tr.time - 0.1), 0.15);

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
:root { --ground:#12161b; --ink:#f7f4ee; --aqua:#4fd1c5; --aquad:#1e8c86; --gold:#ffcf5a; --red:#d6453d; --slate:#1f2a33; --paper:#fbf7ef; }
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:${W}px; height:${H}px; overflow:hidden; background:var(--ground); }
#root { position:relative; width:${W}px; height:${H}px; overflow:hidden; font-family:"Montserrat"; }
.scene { position:absolute; inset:0; overflow:hidden; background:var(--ground); z-index:1; }
.ph { position:absolute; inset:0; overflow:hidden; }
.ph img, .ph video { width:100%; height:100%; object-fit:cover; display:block; }
/* Dew-drop reveal: a soft-edged circle that grows from a point. */
.ph.drop { --r:0px; -webkit-mask-image:radial-gradient(circle at var(--cx) var(--cy), #000 var(--r), transparent calc(var(--r) + 90px)); mask-image:radial-gradient(circle at var(--cx) var(--cy), #000 var(--r), transparent calc(var(--r) + 90px)); }
.ring { position:absolute; width:240px; height:240px; border-radius:50%; z-index:3; border:5px solid rgba(255,250,235,0.85); box-shadow:0 0 40px rgba(255,240,200,0.7), inset 0 0 30px rgba(255,240,200,0.5); }
.shade { position:absolute; inset:0; background:linear-gradient(180deg, rgba(10,12,16,0.2) 0%, rgba(10,12,16,0) 35%, rgba(10,12,16,0) 65%, rgba(10,12,16,0.35) 100%); }
.top { position:absolute; left:0; right:0; top:0; height:760px; background:linear-gradient(180deg, rgba(14,16,20,0.9) 0%, rgba(14,16,20,0.6) 55%, rgba(14,16,20,0) 100%); }
.floor { position:absolute; left:0; right:0; bottom:0; height:900px; background:linear-gradient(180deg, rgba(14,16,20,0) 0%, rgba(14,16,20,0.6) 45%, rgba(14,16,20,0.93) 100%); }
.veil { position:absolute; inset:0; background:rgba(12,14,18,0.55); }
.hook-dim { position:absolute; inset:0; z-index:4; background:linear-gradient(180deg, rgba(14,16,20,0.45) 0%, rgba(14,16,20,0.2) 50%, rgba(14,16,20,0.85) 100%); }
/* Falling golden leaves. */
.fall { position:absolute; top:0; z-index:16; pointer-events:none; opacity:0.85; }
/* Intro: tear-off wall calendar. */
.wall { position:absolute; inset:0; z-index:5; background:radial-gradient(ellipse at 50% 40%, #3a2c22 0%, #241a14 60%, #17110d 100%); }
.cal { position:absolute; left:170px; top:330px; width:740px; height:1000px; }
.cal-bind { position:absolute; left:-10px; right:-10px; top:0; height:70px; border-radius:16px 16px 6px 6px; background:linear-gradient(180deg, #a52d27, #7d1f1b); box-shadow:0 10px 24px rgba(0,0,0,0.5); z-index:30; display:flex; justify-content:space-around; align-items:center; padding:0 50px; }
.cal-bind i { width:22px; height:22px; border-radius:50%; background:#1b130e; box-shadow:inset 0 3px 4px rgba(0,0,0,0.8); }
.cal-stack { position:absolute; left:0; right:0; top:58px; bottom:0; }
.pg { position:absolute; inset:0; border-radius:0 0 18px 18px; background:var(--paper); box-shadow:0 26px 50px rgba(0,0,0,0.55); text-align:center; transform-origin:50% 0%; overflow:hidden; }
.pg::after { content:""; position:absolute; left:0; right:0; top:0; height:10px; background:repeating-linear-gradient(90deg, rgba(0,0,0,0.12) 0 6px, transparent 6px 12px); }
.pg-band { margin:44px 60px 0; padding:14px 0; border-top:4px solid var(--red); border-bottom:4px solid var(--red); font:800 34px "Montserrat"; letter-spacing:0.3em; color:var(--red); }
.pg em { display:block; margin-top:60px; font:800 52px "Montserrat"; font-style:normal; letter-spacing:0.28em; color:#3b3128; }
.pg b { display:block; margin-top:-10px; font:900 420px/1 "Playfair Display"; color:var(--red); }
.pg p { margin:20px 60px 0; font:700 42px/1.3 "Montserrat"; color:#3b3128; }
.hook-kicker { position:absolute; left:0; right:0; top:1090px; text-align:center; font:700 32px "Montserrat"; letter-spacing:0.3em; color:var(--gold); z-index:7; }
.hook-kicker.out { top:860px; }
.hook-title { position:absolute; left:0; right:0; top:1150px; text-align:center; font:900 170px/1 "Playfair Display"; color:var(--ink); text-shadow:0 10px 60px rgba(0,0,0,0.6); z-index:7; }
.hook-title.out { top:930px; font-size:96px; padding:0 40px; }
.hook-title .w, .title .w { display:inline-block; }
.pill { position:absolute; left:50%; transform:translateX(-50%); font:900 46px "Montserrat"; color:var(--slate); padding:12px 40px; border-radius:999px; white-space:nowrap; z-index:8; }
/* Calendar leaf badge (stop marker). */
.leafcal { position:absolute; right:40px; top:80px; width:270px; height:300px; z-index:6; border-radius:8px 8px 18px 18px; background:var(--paper); box-shadow:0 18px 36px rgba(0,0,0,0.5); text-align:center; transform-origin:50% 0%; overflow:hidden; }
.leafcal .hole { position:absolute; top:14px; width:18px; height:18px; border-radius:50%; background:#2a2119; z-index:2; }
.leafcal .hole.l { left:62px; } .leafcal .hole.r { right:62px; }
.lf-band { height:96px; padding-top:42px; background:var(--red); font:900 40px "Montserrat"; letter-spacing:0.08em; color:#fff; }
.leafcal b { display:block; margin-top:34px; font:900 50px/1 "Playfair Display"; color:#2a2119; letter-spacing:0.04em; }
.leafcal small { display:block; margin-top:26px; font:800 30px "Montserrat"; letter-spacing:0.06em; }
.head { position:absolute; left:80px; top:215px; width:620px; display:flex; flex-direction:column; gap:10px; z-index:5; }
.kicker { font:700 32px "Montserrat"; letter-spacing:0.28em; }
.title { margin-bottom:10px; font:800 104px/1.04 "Playfair Display"; color:var(--ink); text-shadow:0 6px 30px rgba(0,0,0,0.55); }
.point { font:600 37px/1.3 "Montserrat"; color:rgba(247,244,238,0.93); text-shadow:0 2px 14px rgba(0,0,0,0.7); }
.point i { display:inline-block; width:16px; height:16px; border-radius:50%; margin-right:18px; vertical-align:middle; }
/* Paper cards with a gold-to-red edge, in the lower third. */
.card { position:absolute; left:60px; width:960px; top:1110px; padding:30px 34px 16px 50px; border-radius:18px; background:rgba(251,247,239,0.98); box-shadow:0 18px 40px rgba(0,0,0,0.45); z-index:7; overflow:hidden; }
.card::before { content:""; position:absolute; left:0; top:0; bottom:0; width:16px; background:linear-gradient(180deg, var(--gold), var(--red)); }
.card-h { font:800 28px "Montserrat"; letter-spacing:0.2em; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; color:var(--red); }
.card-t { font:600 40px/1.3 "Montserrat"; color:var(--slate); }
.card-n { font:600 32px/1.3 "Montserrat"; color:rgba(31,42,51,0.72); margin-bottom:6px; }
.dots i { display:inline-block; width:12px; height:12px; border-radius:50%; margin-left:10px; background:rgba(31,42,51,0.2); }
.dots i.on { background:var(--red); }
.row { display:flex; align-items:baseline; gap:16px; padding:8px 0; border-top:1px solid rgba(31,42,51,0.14); border-radius:10px; }
.row b { font:800 36px "Montserrat"; color:var(--slate); white-space:nowrap; }
.row span { font:500 28px "Montserrat"; color:rgba(31,42,51,0.6); flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.row em { font:800 27px "Montserrat"; font-style:normal; color:var(--slate); padding:4px 14px; border-radius:999px; white-space:nowrap; box-shadow:inset 0 0 0 2px rgba(31,42,51,0.25); }
/* Google Maps screenshot chip above the restaurant card. */
.gmaps { position:absolute; left:400px; width:620px; bottom:830px; border-radius:22px; overflow:hidden; background:#fff; box-shadow:0 16px 40px rgba(0,0,0,0.5); z-index:8; }
.gmaps-h { display:flex; align-items:center; gap:10px; padding:12px 22px; background:#f1f3f4; font:700 24px "Montserrat"; color:#3c4043; }
.gmaps-h i { font-style:normal; }
.gmaps-h span { margin-left:auto; font:500 20px "Montserrat"; color:#70757a; }
.gmaps img { display:block; width:100%; border-top:1px solid #e8eaed; }
/* Dotted trail with a hopping red pin, under the subtitles. */
.rail { position:absolute; left:0; right:0; top:1676px; height:46px; z-index:20; }
.rail .trail { position:absolute; left:240px; right:240px; top:21px; height:4px; background:repeating-linear-gradient(90deg, rgba(255,255,255,0.7) 0 10px, rgba(255,255,255,0) 10px 20px); }
.rail i { position:absolute; top:11px; width:24px; height:24px; margin-left:-3px; border-radius:50%; background:#3a3f45; border:3px solid rgba(255,255,255,0.6); }
.rail i.done { background:#fff; }
.rpin { position:absolute; top:-40px; width:30px; height:30px; border-radius:50% 50% 50% 0; transform:rotate(-45deg); background:var(--red); box-shadow:0 6px 12px rgba(0,0,0,0.45); }
.rpin::after { content:""; position:absolute; left:9px; top:9px; width:12px; height:12px; border-radius:50%; background:#fff; }
/* Cost: list + thermometer. */
.clist { position:absolute; left:50px; width:700px; top:560px; z-index:7; padding:28px 32px 20px; border-radius:24px; background:rgba(251,247,239,0.97); box-shadow:0 22px 44px rgba(0,0,0,0.5); }
.cl-h { font:900 30px "Montserrat"; letter-spacing:0.12em; color:var(--red); padding-bottom:10px; border-bottom:3px solid rgba(214,69,61,0.6); }
.ln { display:flex; justify-content:space-between; align-items:center; gap:16px; padding:12px 0; border-bottom:2px dashed rgba(31,42,51,0.15); }
.ln span { font:800 31px/1.15 "Montserrat"; color:var(--slate); }
.ln span small { display:block; font:600 21px "Montserrat"; color:rgba(31,42,51,0.6); margin-top:3px; }
.ln b { font:900 32px "Montserrat"; color:var(--slate); white-space:nowrap; }
.cl-f { margin-top:12px; font:600 20px "Montserrat"; color:rgba(31,42,51,0.6); }
.thermo { position:absolute; left:800px; top:620px; width:230px; height:900px; z-index:7; }
.tube { position:absolute; left:70px; top:40px; width:64px; height:780px; border-radius:32px; background:rgba(255,255,255,0.9); box-shadow:0 0 0 6px rgba(255,255,255,0.35), 0 16px 30px rgba(0,0,0,0.45); overflow:hidden; }
.hg { position:absolute; left:14px; right:14px; bottom:0; height:100%; border-radius:18px 18px 0 0; background:linear-gradient(90deg, #b8322b, #ff6b5e, #b8322b); }
.bulb { position:absolute; left:42px; top:780px; width:120px; height:120px; border-radius:50%; background:radial-gradient(circle at 40% 35%, #ff8a7e, #c9372f 60%, #8f1f1a); box-shadow:0 0 0 6px rgba(255,255,255,0.6), 0 16px 30px rgba(0,0,0,0.45); }
.tk span { position:absolute; left:150px; font:800 26px "Montserrat"; color:#fff; text-shadow:0 2px 8px rgba(0,0,0,0.7); white-space:nowrap; }
.th-tot { position:absolute; left:50px; top:1170px; z-index:8; width:700px; padding:14px 22px; border-radius:18px; background:var(--gold); text-align:center; font:900 56px "Montserrat"; color:var(--slate); box-shadow:0 16px 30px rgba(0,0,0,0.45); }
.th-tot small { display:block; font:900 24px "Montserrat"; letter-spacing:0.14em; }
.stamp { position:absolute; left:80px; top:470px; z-index:9; padding:8px 18px; border:5px solid var(--red); border-radius:12px; color:var(--red); font:900 28px "Montserrat"; letter-spacing:0.06em; background:rgba(255,255,255,0.9); }
/* Outro: polaroids on a clothesline. */
.rope { position:absolute; left:0; top:0; z-index:6; }
.polar { position:absolute; width:200px; padding:12px 12px 0; background:#fbfaf6; box-shadow:0 14px 26px rgba(0,0,0,0.5); z-index:7; transform-origin:50% 0%; text-align:center; }
.polar img { display:block; width:176px; height:176px; object-fit:cover; }
.polar span { display:block; padding:10px 0 14px; font:800 23px "Montserrat"; color:#2a2119; white-space:nowrap; }
.polar.low::before { content:""; position:absolute; left:98px; top:-96px; width:4px; height:74px; background:#e9dcc3; }
.peg { position:absolute; left:86px; top:-26px; width:28px; height:52px; border-radius:6px; background:linear-gradient(90deg, #a77b4f, #d9b083, #a77b4f); box-shadow:0 4px 6px rgba(0,0,0,0.4); }
.brand { position:absolute; left:60px; top:60px; z-index:21; font:800 26px "Montserrat"; letter-spacing:0.3em; color:rgba(247,244,238,0.85); text-shadow:0 2px 10px rgba(0,0,0,0.5); }
.brand b { color:var(--gold); letter-spacing:0; margin-right:12px; }
.cap { position:absolute; left:60px; right:60px; top:1500px; text-align:center; font:800 50px/1.25 "Montserrat"; color:#ffffff; text-shadow:0 3px 0 rgba(0,0,0,0.55), 0 0 22px rgba(0,0,0,0.85); z-index:20;${cover ? " display:none;" : ""} }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="${W}" data-height="${H}">
${media.join("\n")}
${sfx.join("\n")}
${html.join("\n")}
${leavesFx.join("\n")}
<div class="brand" data-layout-ignore><b>◆</b>${esc(brand)}</div>
${caps.join("\n")}
</div>
<script>
const tl = gsap.timeline({ paused: true });
${js.join("\n")}
HyperShader.init({
  bgColor: "#12161b",
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
