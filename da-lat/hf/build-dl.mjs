#!/usr/bin/env node
/**
 * node hf/build-dl.mjs --slug da-lat-4n3d
 *
 * Turns data/videos/<slug>/video.json + voiceover.json into a HyperFrames project at build/<slug>/.
 * The look ("Đà Lạt 4N3Đ mùa cỏ hồng", 20/11/2026), new for this channel (checked against
 * D:/Thang_space_archive/STYLE-LOG.md):
 *   - cold open: two viral Đà Lạt clips with their own original sound, no music or SFX on top (user request
 *     20/11/2026); then a vintage train ticket "ĐÀ LẠT" slides in, gets punched, and the voice starts;
 *   - pictures change through an ink blot that spreads from a point, or a film-camera flash;
 *   - pine needles drift down over everything;
 *   - each stop gets a torn entry-ticket stub (day + area) that tears off its perforation;
 *   - cards are cream ticket paper with a perforated top edge and pine-green ink;
 *   - the stop rail is a row of day chips N1 N2 N3 N4 +1;
 *   - "Hết bao nhiêu tiền?" is a hand-written market price board on cardboard; lines are written in, the total
 *     circled with a marker;
 *   - "Có thêm ngày 5?" lists three luggage tags;
 *   - outro: three tips, then a suitcase whose lid closes over tags of every stop, then "Lưu lại nhé!";
 *   - shader seams: domain-warp, flash-through-white, gravitational-lens, light-leak, ridged-burn.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fail, parseArgs, requireSlug } from "../scripts/lib/args.mjs";
import { probeDurationSec } from "../scripts/lib/media.mjs";
import { PROJECT_ROOT, PUBLIC_ROOT } from "../scripts/lib/paths.mjs";

const { flags } = parseArgs(process.argv.slice(2));
const slug = requireSlug(flags, "build-dl");
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
 * Footage stack. Odd changes: an ink blot spreads from a point (three overlapping radial masks that grow
 * together, so the edge is uneven). Even changes: a film-camera flash, the new clip cuts in overexposed and settles.
 */
const photos = (s, from, to, idPrefix) => {
  const g = s.gallery ?? [];
  const seg = (to - from) / g.length;
  const parts = [];
  g.forEach((src, k) => {
    const id = `${idPrefix}-p${k}`;
    const a = r2(from + seg * k);
    tw(`tl.fromTo("#${id} video", {scale:1.12}, {scale:1.02, duration:${r2(seg + 0.8)}, ease:"none"}, ${a});`);
    const inner = media(src, id, a - 0.9, seg + 1.8) + creditTag(src);
    if (k === 0) return parts.push(`<div id="${id}" class="ph">${inner}</div>`);
    if (k % 2 === 1) {
      const cx = 25 + ((k * 37) % 50), cy = 30 + ((k * 23) % 40);
      tw(`tl.set("#${id}", {"--r":"0%"}, 0);`);
      tw(`tl.fromTo("#${id}", {"--r":"0%"}, {"--r":"150%", duration:0.9, ease:"power2.in", immediateRender:false}, ${r2(a - 0.45)});`);
      tw(`tl.set("#${idPrefix}-p${k - 1}", {opacity:0}, ${r2(a + 0.5)});`);
      sound("whoosh-cinematic", r2(a - 0.45), 0.05);
      return parts.push(`<div id="${id}" class="ph ink" style="--cx:${cx}%;--cy:${cy}%">${inner}</div>`);
    }
    const flash = `${idPrefix}-f${k}`;
    tw(`tl.set("#${id}", {opacity:0}, 0);`);
    tw(`tl.set("#${id}", {opacity:1}, ${r2(a)});`);
    tw(`tl.fromTo("#${id} video", {filter:"brightness(1.9) saturate(0.6)"}, {filter:"brightness(1) saturate(1)", duration:0.6, ease:"power2.out", immediateRender:false}, ${r2(a)});`);
    tw(`tl.fromTo("#${flash}", {opacity:0}, {opacity:0.85, duration:0.06, ease:"none", immediateRender:false}, ${r2(a - 0.06)});`);
    tw(`tl.to("#${flash}", {opacity:0, duration:0.45, ease:"power2.out"}, ${r2(a)});`);
    tw(`tl.set("#${idPrefix}-p${k - 1}", {opacity:0}, ${r2(a + 0.02)});`);
    sound("pop", r2(a - 0.05), 0.05);
    parts.push(`<div id="${id}" class="ph">${inner}</div>`);
    parts.push(`<div id="${flash}" class="flash warm" style="opacity:0"></div>`);
  });
  return parts.join("");
};

const titleIn = (sel, at) =>
  tw(`tl.fromTo("${sel} .w", {opacity:0, y:30, filter:"blur(10px)"}, {opacity:1, y:0, filter:"blur(0px)", duration:0.6, stagger:0.08, ease:"power3.out"}, ${r2(at)});`);
const fadeUp = (sel, at, dur = 0.35) =>
  tw(`tl.fromTo("${sel}", {opacity:0, y:26}, {opacity:1, y:0, duration:${dur}, ease:"expo.out"}, ${r2(at)});`);
const hideOut = (sel, at) => tw(`tl.to("${sel}", {opacity:0, y:30, duration:0.4, ease:"power2.in"}, ${r2(at)});`);

// ---- torn ticket stub badge -----------------------------------------------
/** A small entry ticket (day + area). It drops in, then the right stub tears off along the perforation. */
const stub = (sid, day, area, at) => {
  tw(`tl.fromTo("#${sid}-stub", {opacity:0, y:-60, rotation:-8}, {opacity:1, y:0, rotation:-3, duration:0.45, ease:"back.out(1.7)"}, ${r2(at)});`);
  tw(`tl.to("#${sid}-tear", {x:46, y:30, rotation:24, opacity:0, duration:0.55, ease:"power2.in"}, ${r2(at + 1.1)});`);
  sound("pop", r2(at + 0.1), 0.05);
  sound("whoosh-short", r2(at + 1.1), 0.04);
  return `<div id="${sid}-stub" class="stub" style="opacity:0"><div class="stub-main"><small>VÉ VÀO CỬA</small><b>${esc(day)}</b><span>${esc(area)}</span></div><div id="${sid}-tear" class="stub-tear"><i>№</i><b>${esc(day)}</b></div></div>`;
};

const row = (p) => `<div class="row"><b>${esc(p.place)}</b><span>${esc(p.address)}</span><em class="${p.rating == null ? "sugg" : ""}">${star(p.rating)}</em></div>`;

// Google Maps screenshots (name + stars + review count), captured 20/11/2026 into public/videos/da-lat/maps.
const MAPS = video.maps ?? {};
const MAPS_DATE = "chụp 20/11/2026";

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
    tw(`tl.fromTo(document.querySelectorAll("${rowsSel}")[${k}], {backgroundColor:"rgba(242,143,174,0)"}, {backgroundColor:"rgba(242,143,174,0.35)", duration:0.25, yoyo:true, repeat:1, repeatDelay:${r2(Math.max(slot - 0.5, 0.2))}}, ${r2(t0)});`);
  });
  return `<div id="${id}" class="gmaps" style="opacity:0"><div class="gmaps-h"><i>📍</i>Google Maps<span>${MAPS_DATE}</span></div>${list.map(([m, k]) => `<img id="${id}-${k}" src="${asset(`videos/da-lat/maps/${m}.png`)}" alt="" />`).join("")}</div>`;
};

/** Cards shown one at a time (each up at least 1.8 s); returns their html and start times. */
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
    tw(`tl.fromTo("#${id}", {opacity:0, y:50, rotation:-1.5}, {opacity:1, y:0, rotation:0, duration:0.45, ease:"expo.out"}, ${r2(times[k] - 0.05)});`);
    if (k < cards.length - 1) tw(`tl.to("#${id}", {opacity:0, y:-30, duration:0.2, ease:"power3.in"}, ${r2(times[k + 1] - 0.22)});`);
    else if (s.end - times[k] > 3.2) hideOut(`#${id}`, s.end - 1.1);
    if (c.rows) tw(`tl.fromTo("#${id} .row", {opacity:0, x:-40}, {opacity:1, x:0, duration:0.3, stagger:0.09, ease:"power3.out"}, ${r2(times[k] + 0.15)});`);
  });
  return { html: parts.join(""), times };
};

// ---- cold open ---------------------------------------------------------------
/**
 * Two viral clips play with their own sound (no music, no SFX): a hard cut between them at 4.6 s. Then the hook's
 * clips take over, a train ticket slides in, is punched, and lifts away once the voice is under way.
 */
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
    tw(`tl.fromTo("#${id} video", {scale:1.04}, {scale:1.12, duration:${len}, ease:"none"}, ${from});`);
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

// ---- pine needles --------------------------------------------------------------
const needles = [];
for (let k = 0; k < 16; k++) {
  const x0 = 30 + ((k * 263) % 1000);
  const len = 26 + (k % 4) * 8;
  needles.push(`<i id="nd${k}" class="nd" style="left:${x0}px;top:-60px;height:${len}px" data-layout-ignore></i>`);
  const fall = 7 + (k % 5) * 1.3;
  for (let at = (k * 0.9) % 6, n = 0; at < total; at += fall, n++) {
    const drift = r2(Math.sin(k * 1.3 + n) * 160);
    tw(`tl.fromTo("#nd${k}", {x:0, y:0, rotation:${(k * 37) % 180}, opacity:0.0}, {x:${drift}, y:2050, rotation:${(k * 37) % 180 + (k % 2 ? 540 : -540)}, opacity:0.75, duration:${r2(fall)}, ease:"none", immediateRender:${n === 0}}, ${r2(at)});`);
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

  if (s.layout === "hook") {
    const m = coldOpen(s, sid);
    parts.push(m.html);
    parts.push(`<div id="${sid}-dim" class="hook-dim" style="opacity:0"></div>`);
    tw(`tl.fromTo("#${sid}-dim", {opacity:0}, {opacity:1, duration:0.4}, ${r2(m.after)});`);
    // Train ticket title.
    parts.push(`<div id="${sid}-ticket" class="ticket" style="opacity:0"><div class="tk-l"><small>${esc(s.kicker)}</small><h1>${esc(s.caption)}</h1><div class="tk-route"><b>GA ĐÀ LẠT</b><i></i><b>${esc(s.label)}</b></div></div><div class="tk-r"><small>SỐ</small><b>1938</b><span>khứ hồi</span></div><i id="${sid}-hole" class="tk-hole" style="opacity:0"></i></div>`);
    tw(`tl.fromTo("#${sid}-ticket", {opacity:0, x:-900, rotation:-12}, {opacity:1, x:0, rotation:-4, duration:0.7, ease:"back.out(1.3)"}, ${r2(m.after + 0.05)});`);
    tw(`tl.fromTo("#${sid}-hole", {opacity:0, scale:2.4}, {opacity:1, scale:1, duration:0.18, ease:"power4.in"}, ${r2(m.after + 0.85)});`);
    tw(`tl.fromTo("#${sid}-ticket", {y:0}, {y:14, duration:0.08, yoyo:true, repeat:1, ease:"power2.out", immediateRender:false}, ${r2(m.after + 1.03)});`);
    sound("impact-bass-1", r2(m.after + 1.0), 0.1);
    sound("whoosh-cinematic", r2(m.after), 0.06);
    const lift = s.vo + 3.0;
    tw(`tl.to("#${sid}-ticket", {opacity:0, x:900, rotation:10, duration:0.6, ease:"power2.in"}, ${r2(lift)});`);
    tw(`tl.to("#${sid}-dim", {opacity:0.35, duration:0.6}, ${r2(lift)});`);
  } else if (s.layout === "point") {
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div class="floor"></div>`);
    const idx = days.findIndex((x) => x.id === s.id);
    parts.push(stub(sid, s.day, s.badge ?? "", enter + 0.5));
    parts.push(`<div class="head">`);
    parts.push(`<div id="${sid}-kicker" class="kicker">${esc(s.label.toUpperCase())}</div>`);
    parts.push(`<h1 id="${sid}-title" class="title">${words(s.caption)}</h1>`);
    fadeUp(`#${sid}-kicker`, enter, 0.25);
    titleIn(`#${sid}-title`, enter + 0.2);
    (s.points ?? []).forEach((p, k) => {
      parts.push(`<div id="${sid}-pt${k}" class="point"><i></i>${esc(p)}</div>`);
      fadeUp(`#${sid}-pt${k}`, enter + 1.0 + k * 0.45);
    });
    parts.push(`</div>`);
    const dishes = s.dishes ?? [];
    const named = cueTime(s, dishes[0]?.spokenAs ?? dishes[0]?.place) ?? a + (s.end - a) * 0.55;
    const cue = Math.max(Math.min(named, s.end - 3.0 - dishes.length * 0.9 - 0.45), enter + CLEAR);
    parts.push(`<div id="${sid}-food" class="card" style="opacity:0"><div class="card-h">${esc(s.cardTitle ?? "ĂN GẦN ĐÂY")}</div>${dishes.map((d) => row(d)).join("")}</div>`);
    tw(`tl.fromTo("#${sid}-food", {opacity:0, y:60, rotation:-1.5}, {opacity:1, y:0, rotation:0, duration:0.5, ease:"expo.out"}, ${r2(cue - 0.1)});`);
    tw(`tl.fromTo("#${sid}-food .row", {opacity:0, x:-40}, {opacity:1, x:0, duration:0.3, stagger:0.09, ease:"power3.out"}, ${r2(cue + 0.15)});`);
    const hide = clearAt(cue, dishes.length, s.end);
    if (hide != null) hideOut(`#${sid}-food`, hide);
    parts.push(proofs(`${sid}-gm`, `#${sid}-food .row`, dishes, cue, s.end, hide));
    parts.push(dayChips(sid, idx));
    fadeUp(`#${sid}-days`, enter + 0.4);
  } else if (s.layout === "extra") {
    // "Có thêm ngày 5?": three luggage tags swing in on their strings, each on its cue word.
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div class="floor"></div>`);
    parts.push(`<div class="head"><div id="${sid}-kicker" class="kicker">${esc(s.kicker)}</div><h1 id="${sid}-title" class="title">${words(s.caption)}</h1></div>`);
    fadeUp(`#${sid}-kicker`, enter, 0.25);
    titleIn(`#${sid}-title`, enter + 0.2);
    let prev = enter + 1.2;
    (s.items ?? []).forEach((it, k) => {
      const at = Math.max(cueTime(s, it.cue) ?? prev + 2, prev + 1.2);
      prev = at;
      parts.push(`<div id="${sid}-tag${k}" class="ltag" style="opacity:0;top:${1080 + k * 150}px"><i class="ltag-hole"></i><b>${esc(it.t)}</b><span>${esc(it.s)}</span></div>`);
      tw(`tl.fromTo("#${sid}-tag${k}", {opacity:0, rotation:-28, x:-120}, {opacity:1, rotation:-2, x:0, duration:0.6, ease:"elastic.out(1, 0.55)"}, ${r2(at)});`);
      sound("pop", r2(at + 0.1), 0.06);
    });
    if (s.end - prev > 3.4) hideOut(`#${sid}-tag0, #${sid}-tag1, #${sid}-tag2`, s.end - 1.0);
    parts.push(dayChips(sid, days.findIndex((x) => x.id === s.id)));
    fadeUp(`#${sid}-days`, enter + 0.4);
  } else if (s.layout === "stay") {
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div class="floor"></div>`);
    parts.push(`<div class="head"><div id="${sid}-kicker" class="kicker">ĐÊM Ở ĐÀ LẠT</div><h1 id="${sid}-title" class="title">${words(s.caption)}</h1></div>`);
    fadeUp(`#${sid}-kicker`, enter, 0.25);
    titleIn(`#${sid}-title`, enter + 0.2);
    const cards = s.zones.map((z, k) => ({
      title: `${k + 1} · ${z.title}`, cue: s.cues[k], rows: true,
      body: `<p class="card-n">${esc(z.note)}</p>` + z.picks.map(([n, rt, ad]) => row({ place: n, address: ad, rating: rt })).join(""),
    }));
    cards.push({ title: "Nhớ nha", cue: s.cues.at(-1), body: `<p class="card-t">${esc(s.tip)}</p>` });
    const cs = cardSeq(sid, s, cards, enter);
    parts.push(cs.html);
    s.zones.forEach((z, k) => {
      const places = z.picks.map(([n]) => ({ place: n }));
      const until = cs.times[k + 1] ?? s.end;
      parts.push(proofs(`${sid}-gm${k}`, `#${sid}-c${k} .row`, places, cs.times[k], until, until - 0.1));
    });
  } else if (s.layout === "cost") {
    // "Hết bao nhiêu tiền?": a cardboard price board, each line written in left to right with a marker; the total
    // is written last and circled.
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div class="floor"></div><div id="${sid}-veil" class="veil" style="opacity:0"></div>`);
    parts.push(`<div class="head"><div id="${sid}-kicker" class="kicker">${esc(s.kicker ?? "")}</div><h1 id="${sid}-title" class="title" style="font-size:88px">${words(s.caption)}</h1></div>`);
    fadeUp(`#${sid}-kicker`, enter, 0.25);
    titleIn(`#${sid}-title`, enter + 0.2);
    const t0 = enter + 1.4;
    tw(`tl.fromTo("#${sid}-veil", {opacity:0}, {opacity:1, duration:0.5}, ${r2(t0 - 0.2)});`);
    const items = s.items ?? [];
    const totalAt = Math.max(cueTime(s, s.totalCue) ?? s.end - 3.2, t0 + items.length * 0.7 + 0.8);
    const step = Math.min(1.3, (totalAt - t0 - 0.6) / Math.max(1, items.length));
    const lines = items.map((it, k) => {
      const at = t0 + 0.6 + k * step;
      tw(`tl.fromTo("#${sid}-ln${k}", {clipPath:"inset(0 100% 0 0)"}, {clipPath:"inset(0 0% 0 0)", duration:0.55, ease:"power1.inOut"}, ${r2(at)});`);
      sound("pop", r2(at + 0.45), 0.05);
      return `<div id="${sid}-ln${k}" class="bl" style="clip-path:inset(0 100% 0 0)"><span>${esc(it.k)}${it.note ? ` <small>(${esc(it.note)})</small>` : ""}</span><b>${esc(it.v)}</b></div>`;
    }).join("");
    parts.push(`<div id="${sid}-board" class="board" style="opacity:0"><i class="board-pin"></i><div class="bd-h">${esc(s.receiptTitle ?? "")}</div>${lines}` +
      `<div id="${sid}-tot" class="bd-tot" style="clip-path:inset(0 100% 0 0)"><span>TỔNG</span><b>${esc(s.total)}</b><svg viewBox="0 0 360 120"><ellipse id="${sid}-ring" cx="180" cy="60" rx="170" ry="52" /></svg></div>` +
      `<div class="bd-f">${esc(s.note ?? "")}</div></div>`);
    tw(`tl.fromTo("#${sid}-board", {opacity:0, y:80, rotation:4}, {opacity:1, y:0, rotation:-1.5, duration:0.55, ease:"back.out(1.4)"}, ${r2(t0)});`);
    tw(`tl.fromTo("#${sid}-tot", {clipPath:"inset(0 100% 0 0)"}, {clipPath:"inset(0 0% 0 0)", duration:0.5, ease:"power1.inOut"}, ${r2(totalAt)});`);
    tw(`tl.fromTo("#${sid}-ring", {strokeDashoffset:760}, {strokeDashoffset:0, duration:0.7, ease:"power2.inOut"}, ${r2(totalAt + 0.5)});`);
    sound("impact-bass-1", r2(totalAt + 0.3), 0.09);
    parts.push(`<div id="${sid}-stamp" class="stamp" style="opacity:0">${esc(s.stamp ?? "")}</div>`);
    tw(`tl.fromTo("#${sid}-stamp", {opacity:0, scale:2.2, rotation:-24}, {opacity:1, scale:1, rotation:-8, duration:0.35, ease:"power4.in"}, ${r2(totalAt + 1.3)});`);
  } else {
    // Outro: three tips, then a suitcase: tags of every stop drop on, the lid closes, the call to action.
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
    const caseAt = s.end - 5.0;
    tw(`tl.to(["#${sid}-kicker", ${(s.tips ?? []).map((_, k) => `"#${sid}-tip${k}"`).join(", ")}], {opacity:0, y:-30, duration:0.35}, ${r2(caseAt - 0.4)});`);
    parts.push(`<h1 id="${sid}-title" class="out-title">${words(s.caption)}</h1>`);
    titleIn(`#${sid}-title`, caseAt - 0.2);
    const caseTags = s.caseTags ?? days.map((x) => x.caption);
    const tagHtml = caseTags.map((c, k) => `<i id="${sid}-ct${k}" class="ctag" style="left:${10 + (k % 3) * 190}px;top:${240 + Math.floor(k / 3) * 84}px;opacity:0;transform:rotate(${(k % 2 ? 1 : -1) * (4 + k * 2)}deg)">${esc(c)}</i>`).join("");
    parts.push(`<div id="${sid}-case" class="case" style="opacity:0"><i class="case-handle"></i><i class="case-body"><b></b></i><i id="${sid}-lid" class="case-lid"></i>${tagHtml}</div>`);
    tw(`tl.fromTo("#${sid}-case", {opacity:0, y:120}, {opacity:1, y:0, duration:0.5, ease:"back.out(1.5)"}, ${r2(caseAt + 0.3)});`);
    caseTags.forEach((_, k) => {
      tw(`tl.fromTo("#${sid}-ct${k}", {opacity:0, y:-260}, {opacity:1, y:0, duration:0.4, ease:"bounce.out", immediateRender:false}, ${r2(caseAt + 0.7 + k * 0.22)});`);
      sound("pop", r2(caseAt + 0.9 + k * 0.22), 0.05);
    });
    const shut = caseAt + 0.9 + caseTags.length * 0.22 + 0.3;
    tw(`tl.fromTo("#${sid}-lid", {rotationX:-110}, {rotationX:0, duration:0.45, ease:"power3.in"}, ${r2(shut)});`);
    sound("impact-bass-1", r2(shut + 0.45), 0.09);
    const ctaAt = shut + 0.8;
    parts.push(`<div id="${sid}-cta" class="pill cta" style="opacity:0">${esc(s.cta ?? "")}</div>`);
    tw(`tl.fromTo("#${sid}-cta", {opacity:0, scale:0.5}, {opacity:1, scale:1, duration:0.4, ease:"back.out(2.4)"}, ${r2(ctaAt)});`);
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
// The music bed starts when the cold open's own sound ends (with the ticket), then loops to the end.
const musicSrc = asset(video.music.src);
const musicLen = probeDurationSec(path.join(PUBLIC_ROOT, video.music.src));
for (let at = r2(COLD_END), off = 0, k = 0; at < total - 0.05; k++) {
  const dur = r2(Math.min(musicLen - off, total - at));
  const last = at + dur >= total - 0.01;
  mediaTags.push(`<audio id="music-${k}" src="${musicSrc}" data-start="${r2(at)}" data-media-start="${r2(off)}" data-duration="${dur}" data-volume="${k ? 0.24 : 0.26}" data-fade-in="${k ? 1 : 0.6}" data-fade-out="${last ? 1.5 : 1}" data-track-index="${k % 2 ? 31 : 30}"></audio>`);
  if (last) break;
  at = r2(at + dur - 1);
  off = 0;
}

// ---- shader seams + quiet whooshes -----------------------------------
const SHADERS = ["light-leak", "domain-warp", "gravitational-lens", "ridged-burn", "flash-through-white"];
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
:root { --ground:#10241b; --ink:#fff6e6; --pine:#1f4a35; --pined:#143326; --pink:#f28fae; --sun:#ffd25e; --cream:#fff6e6; --kraft:#c9a46a; }
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:${W}px; height:${H}px; overflow:hidden; background:var(--ground); }
#root { position:relative; width:${W}px; height:${H}px; overflow:hidden; font-family:"Be Vietnam Pro"; }
.scene { position:absolute; inset:0; overflow:hidden; background:var(--ground); z-index:1; }
.ph { position:absolute; inset:0; overflow:hidden; }
.ph video { width:100%; height:100%; object-fit:cover; display:block; }
/* Ink blot: three overlapping discs grow from nearby centres, so the edge spreads unevenly. */
.ink { --r:0%; -webkit-mask-image:radial-gradient(circle at var(--cx) var(--cy), #000 var(--r), transparent calc(var(--r) + 6%)), radial-gradient(circle at calc(var(--cx) + 18%) calc(var(--cy) + 12%), #000 calc(var(--r) * 0.8), transparent calc(var(--r) * 0.8 + 7%)), radial-gradient(circle at calc(var(--cx) - 14%) calc(var(--cy) + 20%), #000 calc(var(--r) * 0.7), transparent calc(var(--r) * 0.7 + 8%)); mask-image:radial-gradient(circle at var(--cx) var(--cy), #000 var(--r), transparent calc(var(--r) + 6%)), radial-gradient(circle at calc(var(--cx) + 18%) calc(var(--cy) + 12%), #000 calc(var(--r) * 0.8), transparent calc(var(--r) * 0.8 + 7%)), radial-gradient(circle at calc(var(--cx) - 14%) calc(var(--cy) + 20%), #000 calc(var(--r) * 0.7), transparent calc(var(--r) * 0.7 + 8%)); }
.cr { position:absolute; left:60px; top:112px; z-index:4; font:600 22px "Be Vietnam Pro"; color:rgba(255,246,230,0.85); text-shadow:0 2px 8px rgba(0,0,0,0.7); }
.flash { position:absolute; inset:0; z-index:3; background:#fff; }
.flash.warm { background:#fff1d6; }
.shade { position:absolute; inset:0; background:linear-gradient(180deg, rgba(8,20,14,0.2) 0%, rgba(8,20,14,0) 35%, rgba(8,20,14,0) 65%, rgba(8,20,14,0.35) 100%); }
.top { position:absolute; left:0; right:0; top:0; height:760px; background:linear-gradient(180deg, rgba(10,26,18,0.85) 0%, rgba(10,26,18,0.5) 55%, rgba(10,26,18,0) 100%); }
.floor { position:absolute; left:0; right:0; bottom:0; height:900px; background:linear-gradient(180deg, rgba(10,26,18,0) 0%, rgba(10,26,18,0.6) 45%, rgba(10,26,18,0.93) 100%); }
.veil { position:absolute; inset:0; background:rgba(10,26,18,0.55); }
.hook-dim { position:absolute; inset:0; z-index:4; background:linear-gradient(180deg, rgba(10,26,18,0.35) 0%, rgba(10,26,18,0.05) 45%, rgba(10,26,18,0.8) 100%); }
.nd { position:absolute; z-index:16; width:4px; border-radius:2px; background:linear-gradient(180deg, #5d7d3a, #8a6a34); opacity:0; pointer-events:none; }
/* Train ticket title. */
.ticket { position:absolute; left:70px; top:1020px; width:940px; height:330px; z-index:8; display:flex; border-radius:22px; background:var(--cream); box-shadow:0 26px 60px rgba(0,0,0,0.55); overflow:hidden; }
.ticket::before { content:""; position:absolute; left:0; right:0; top:0; height:14px; background:repeating-linear-gradient(90deg, var(--pink) 0 40px, var(--sun) 40px 80px); }
.tk-l { flex:1; padding:40px 40px 20px 50px; border-right:4px dashed rgba(31,74,53,0.4); }
.tk-l small { font:800 26px "Be Vietnam Pro"; color:var(--pine); letter-spacing:0.18em; }
.tk-l h1 { font:900 150px/1 "Playfair Display"; color:var(--pined); margin-top:6px; }
.tk-route { display:flex; align-items:center; gap:16px; margin-top:12px; font:800 28px "Be Vietnam Pro"; color:#7a4a2a; }
.tk-route i { flex:1; height:4px; background:repeating-linear-gradient(90deg, #7a4a2a 0 14px, transparent 14px 24px); }
.tk-r { width:210px; padding:46px 0; text-align:center; background:var(--sun); }
.tk-r small { display:block; font:800 22px "Be Vietnam Pro"; color:var(--pined); letter-spacing:0.2em; }
.tk-r b { display:block; font:900 76px "Be Vietnam Pro"; color:var(--pined); margin:10px 0; }
.tk-r span { font:700 24px "Be Vietnam Pro"; color:var(--pined); }
.tk-hole { position:absolute; right:150px; top:44px; width:58px; height:58px; border-radius:50%; background:#10241b; box-shadow:inset 0 4px 8px rgba(0,0,0,0.6); }
.title .w, .out-title .w { display:inline-block; }
.pill { position:absolute; left:50%; top:1370px; transform:translateX(-50%); font:900 44px "Be Vietnam Pro"; color:var(--pined); background:var(--sun); padding:12px 40px; border-radius:999px; white-space:nowrap; z-index:8; }
/* Torn ticket stub. */
.stub { position:absolute; right:56px; top:150px; z-index:6; display:flex; filter:drop-shadow(0 12px 18px rgba(0,0,0,0.5)); }
.stub-main { width:220px; padding:16px 18px; background:var(--cream); border-radius:14px 0 0 14px; text-align:center; }
.stub-main small { display:block; font:800 16px "Be Vietnam Pro"; color:var(--pine); letter-spacing:0.16em; }
.stub-main b { display:block; font:900 62px/1.05 "Playfair Display"; color:var(--pined); }
.stub-main span { display:block; font:700 20px "Be Vietnam Pro"; color:#7a4a2a; }
.stub-tear { width:84px; padding:16px 0; background:var(--pink); border-left:4px dotted var(--cream); border-radius:0 14px 14px 0; text-align:center; transform-origin:0% 100%; }
.stub-tear i { display:block; font:800 22px "Be Vietnam Pro"; color:var(--pined); font-style:normal; }
.stub-tear b { display:block; font:900 34px "Be Vietnam Pro"; color:var(--pined); margin-top:18px; writing-mode:vertical-rl; margin-left:auto; margin-right:auto; }
.head { position:absolute; left:80px; top:330px; width:660px; display:flex; flex-direction:column; gap:10px; z-index:5; }
.kicker { font:800 30px "Be Vietnam Pro"; color:var(--sun); }
.title { margin-bottom:10px; font:800 96px/1.04 "Playfair Display"; color:var(--ink); text-shadow:0 6px 30px rgba(0,0,0,0.55); }
.point { font:600 34px/1.3 "Be Vietnam Pro"; color:rgba(255,246,230,0.95); text-shadow:0 2px 14px rgba(0,0,0,0.75); }
.point i { display:inline-block; width:16px; height:16px; margin-right:18px; vertical-align:middle; background:var(--pink); transform:rotate(45deg); }
/* Cream ticket-paper cards in the lower third. */
.card { position:absolute; left:60px; width:960px; top:1110px; padding:34px 34px 16px 40px; border-radius:20px; background:var(--cream); box-shadow:0 18px 40px rgba(0,0,0,0.45); z-index:7; overflow:hidden; color:var(--pined); }
.card::before { content:""; position:absolute; left:0; right:0; top:0; height:14px; background:radial-gradient(circle at 12px -2px, transparent 9px, var(--pine) 10px) 0 0/24px 14px repeat-x; }
.card-h { font:900 26px "Be Vietnam Pro"; letter-spacing:0.14em; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; color:#b24a72; }
.card-t { font:700 40px/1.3 "Be Vietnam Pro"; color:var(--pined); }
.card-n { font:600 30px/1.3 "Be Vietnam Pro"; color:rgba(20,51,38,0.7); margin-bottom:6px; }
.dots i { display:inline-block; width:12px; height:12px; border-radius:50%; margin-left:10px; background:rgba(20,51,38,0.2); }
.dots i.on { background:var(--pink); }
.row { display:flex; align-items:baseline; gap:16px; padding:8px 6px; border-top:2px dashed rgba(20,51,38,0.18); border-radius:10px; }
.row b { font:800 33px "Be Vietnam Pro"; color:var(--pined); white-space:nowrap; }
.row span { font:500 26px "Be Vietnam Pro"; color:rgba(20,51,38,0.6); flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.row em { font:800 26px "Be Vietnam Pro"; font-style:normal; color:var(--pined); background:var(--sun); padding:4px 14px; border-radius:999px; white-space:nowrap; }
.row em.sugg { background:rgba(20,51,38,0.12); }
.gmaps { position:absolute; left:400px; width:620px; bottom:830px; border-radius:22px; overflow:hidden; background:#fff; box-shadow:0 16px 40px rgba(0,0,0,0.5); z-index:8; }
.gmaps-h { display:flex; align-items:center; gap:10px; padding:12px 22px; background:#f1f3f4; font:700 24px "Be Vietnam Pro"; color:#3c4043; }
.gmaps-h i { font-style:normal; }
.gmaps-h span { margin-left:auto; font:500 20px "Be Vietnam Pro"; color:#70757a; }
.gmaps img { display:block; width:100%; border-top:1px solid #e8eaed; }
/* Day chips under the subtitles. */
.days { position:absolute; left:0; right:0; top:1680px; z-index:20; display:flex; justify-content:center; gap:16px; }
.days i { font:800 26px "Be Vietnam Pro"; font-style:normal; color:rgba(255,246,230,0.75); padding:6px 20px; border-radius:999px; border:3px solid rgba(255,246,230,0.4); background:rgba(10,26,18,0.55); }
.days i.done { background:var(--pine); border-color:var(--pine); color:var(--cream); }
.days i.now { background:var(--pink); border-color:var(--pink); color:var(--pined); }
/* Luggage tags (day 5). */
.ltag { position:absolute; left:110px; width:840px; z-index:7; padding:22px 30px 22px 110px; border-radius:16px 60px 60px 16px; background:var(--kraft); box-shadow:0 14px 30px rgba(0,0,0,0.45); transform-origin:0% 50%; }
.ltag-hole { position:absolute; left:34px; top:50%; width:40px; height:40px; margin-top:-20px; border-radius:50%; background:var(--ground); box-shadow:0 0 0 7px var(--cream); }
.ltag b { display:block; font:900 44px "Be Vietnam Pro"; color:var(--pined); }
.ltag span { display:block; font:600 28px "Be Vietnam Pro"; color:rgba(20,51,38,0.75); }
/* Cost: cardboard price board, hand-written. */
.board { position:absolute; left:70px; width:940px; top:560px; z-index:7; padding:46px 46px 30px; border-radius:10px; background:linear-gradient(135deg, #c9a46a, #b48b52); box-shadow:0 24px 50px rgba(0,0,0,0.55), inset 0 0 0 6px rgba(120,80,40,0.35); font-family:"Patrick Hand"; color:#2a1c10; }
.board-pin { position:absolute; left:50%; top:14px; width:26px; height:26px; margin-left:-13px; border-radius:50%; background:#d23c3c; box-shadow:0 4px 6px rgba(0,0,0,0.4); }
.bd-h { font:400 52px "Patrick Hand"; text-align:center; color:#7a1e1e; margin-bottom:10px; }
.bl { display:flex; justify-content:space-between; align-items:baseline; gap:20px; padding:8px 0; border-bottom:2px solid rgba(42,28,16,0.2); }
.bl span { font:400 42px/1.15 "Patrick Hand"; }
.bl span small { font:400 30px "Patrick Hand"; color:rgba(42,28,16,0.7); }
.bl b { font:400 50px "Patrick Hand"; color:#1f4a35; white-space:nowrap; }
.bd-tot { position:relative; display:flex; justify-content:center; align-items:baseline; gap:24px; margin-top:22px; padding:14px 0; }
.bd-tot span { font:400 46px "Patrick Hand"; }
.bd-tot b { font:400 84px "Patrick Hand"; color:#b3123c; }
.bd-tot svg { position:absolute; left:50%; top:50%; width:560px; height:170px; margin:-85px 0 0 -280px; overflow:visible; }
.bd-tot ellipse { fill:none; stroke:#b3123c; stroke-width:7; stroke-linecap:round; stroke-dasharray:760; stroke-dashoffset:760; }
.bd-f { margin-top:12px; font:400 28px "Patrick Hand"; color:rgba(42,28,16,0.75); text-align:center; }
.stamp { position:absolute; left:640px; top:470px; z-index:9; padding:8px 18px; border:5px solid #b3123c; border-radius:12px; color:#b3123c; font:900 24px "Be Vietnam Pro"; background:rgba(255,246,230,0.92); }
/* Outro. */
.tips-h { position:absolute; left:90px; top:520px; z-index:7; font:800 32px "Be Vietnam Pro"; color:var(--sun); }
.tip { position:absolute; left:90px; z-index:7; font:800 50px/1.2 "Be Vietnam Pro"; color:var(--ink); text-shadow:0 4px 20px rgba(0,0,0,0.7); white-space:nowrap; }
.tip i { display:inline-block; width:62px; height:62px; margin-right:22px; border-radius:50%; background:var(--pink); color:var(--pined); font:900 40px/62px "Be Vietnam Pro"; font-style:normal; text-align:center; vertical-align:middle; }
.out-title { position:absolute; left:40px; right:40px; top:470px; text-align:center; z-index:7; font:900 116px/1.05 "Playfair Display"; color:var(--ink); text-shadow:0 10px 50px rgba(0,0,0,0.6); }
.case { position:absolute; left:250px; top:820px; width:580px; height:420px; z-index:8; perspective:900px; }
.case i { position:absolute; display:block; font-style:normal; }
.case-handle { left:210px; top:0; width:160px; height:70px; border:16px solid #5a3a22; border-bottom:none; border-radius:40px 40px 0 0; }
.case-body { left:0; top:60px; width:580px; height:360px; border-radius:36px; background:linear-gradient(180deg, #e46f95, #c9557c); box-shadow:0 26px 50px rgba(0,0,0,0.5); }
.case-body b { position:absolute; left:40px; right:40px; top:150px; height:18px; border-radius:9px; background:rgba(255,246,230,0.6); }
.case-lid { left:0; top:60px; width:580px; height:130px; border-radius:36px 36px 10px 10px; background:linear-gradient(180deg, #f28fae, #e46f95); transform-origin:50% 100%; box-shadow:0 -4px 0 rgba(0,0,0,0.15); z-index:2; }
.ctag { padding:12px 18px; border-radius:10px; background:var(--cream); color:var(--pined); font:800 30px "Be Vietnam Pro"; white-space:nowrap; box-shadow:0 6px 12px rgba(0,0,0,0.35); z-index:3; }
.pill.cta { top:1300px; font-size:64px; padding:18px 56px; }
.brand { position:absolute; left:60px; top:60px; z-index:21; font:800 26px "Be Vietnam Pro"; letter-spacing:0.3em; color:rgba(255,246,230,0.9); text-shadow:0 2px 10px rgba(0,0,0,0.5); }
.brand b { color:var(--pink); letter-spacing:0; margin-right:12px; }
.cap { position:absolute; left:60px; right:60px; top:1500px; text-align:center; font:800 50px/1.25 "Be Vietnam Pro"; color:#ffffff; text-shadow:0 3px 0 rgba(0,0,0,0.55), 0 0 22px rgba(0,0,0,0.85); z-index:20; }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="${W}" data-height="${H}">
${mediaTags.join("\n")}
${sfx.join("\n")}
${html.join("\n")}
${needles.join("\n")}
<div class="brand" data-layout-ignore><b>✦</b>${esc(video.theme.brand)}</div>
${caps.join("\n")}
</div>
<script>
const tl = gsap.timeline({ paused: true });
${js.join("\n")}
HyperShader.init({
  bgColor: "#10241b",
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
