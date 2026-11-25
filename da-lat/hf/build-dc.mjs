#!/usr/bin/env node
/**
 * node hf/build-dc.mjs --slug dong-cao-san-may
 *
 * Turns data/videos/<slug>/video.json + voiceover.json into a HyperFrames project at build/<slug>/.
 * The look ("Săn mây Đồng Cao", 16/11/2026), new for this channel (checked against
 * D:/Thang_space_archive/STYLE-LOG.md):
 *   - cold open: no voice, ~6 s of the best footage cut on the beat of the music's drop; the title condenses
 *     out of mist (blurred, wide letter-spacing → sharp); the voice starts after it (user request 16/11/2026);
 *   - all real footage (TikTok clips of Đồng Cao, credited on screen with the creator's handle);
 *   - pictures change through venetian-blind slats, or a band of mist sweeping across the frame;
 *   - each stop gets a split-flap clock (time of day) with the area under it;
 *   - fireflies drift and blink over everything;
 *   - cards are frosted glass (dark, blurred backdrop, white text, rose edge);
 *   - the stop rail is a time line (14:00 → 18:00 → 04:30) with a glowing dot sliding to this stop;
 *   - "Hết bao nhiêu tiền?" is a wallet: it opens and a banknote flies out for every line;
 *   - outro: three ticked tips, the title over the footage, a 3-2-1 countdown ring, then "Lưu lại nhé!";
 *   - shader seams: chromatic radial split, gravitational lens, thermal distortion, domain-warp dissolve, whip pan.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fail, parseArgs, requireSlug } from "../scripts/lib/args.mjs";
import { probeDurationSec } from "../scripts/lib/media.mjs";
import { PROJECT_ROOT, PUBLIC_ROOT } from "../scripts/lib/paths.mjs";

const { flags } = parseArgs(process.argv.slice(2));
const slug = requireSlug(flags, "build-dc");
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
const brand = video.theme.brand;
const r2 = (n) => Math.round(n * 1000) / 1000;

// Music: the drop of travel-upbeat (bar 4 at 118 BPM = 8.136 s) lands 2 s into the video.
const BEAT = 60 / 118;
const DROP = 2.0;
const MUSIC_OFFSET = r2(8.136 - DROP);

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
const stops = scenes.filter((s) => s.layout === "point");

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

/**
 * Footage stack. Odd changes open venetian-blind slats: the new clip shows through horizontal strips that
 * widen until they meet. Even changes sweep a band of mist across the frame with the new clip behind it.
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
      tw(`tl.set("#${id}", {"--o":"0px"}, 0);`);
      tw(`tl.fromTo("#${id}", {"--o":"0px"}, {"--o":"121px", duration:0.7, ease:"power2.inOut", immediateRender:false}, ${r2(a - 0.35)});`);
      tw(`tl.set("#${idPrefix}-p${k - 1}", {opacity:0}, ${r2(a + 0.4)});`);
      sound("whoosh-short", r2(a - 0.4), 0.06);
      return parts.push(`<div id="${id}" class="ph slats">${inner}</div>`);
    }
    const mist = `${idPrefix}-m${k}`;
    tw(`tl.set("#${id}", {"--m":"-40%"}, 0);`);
    tw(`tl.fromTo("#${id}", {"--m":"-40%"}, {"--m":"110%", duration:1.0, ease:"power1.inOut", immediateRender:false}, ${r2(a - 0.5)});`);
    tw(`tl.set("#${mist}", {xPercent:-120}, 0);`);
    tw(`tl.fromTo("#${mist}", {xPercent:-120}, {xPercent:160, duration:1.0, ease:"power1.inOut", immediateRender:false}, ${r2(a - 0.5)});`);
    tw(`tl.set("#${idPrefix}-p${k - 1}", {opacity:0}, ${r2(a + 0.55)});`);
    sound("whoosh-cinematic", r2(a - 0.5), 0.05);
    parts.push(`<div id="${id}" class="ph mistwipe">${inner}</div>`);
    parts.push(`<div id="${mist}" class="mist"></div>`);
  });
  return parts.join("");
};

const titleIn = (sel, at) =>
  tw(`tl.fromTo("${sel} .w", {opacity:0, y:30, filter:"blur(10px)"}, {opacity:1, y:0, filter:"blur(0px)", duration:0.6, stagger:0.08, ease:"power3.out"}, ${r2(at)});`);
const fadeUp = (sel, at, dur = 0.35) =>
  tw(`tl.fromTo("${sel}", {opacity:0, y:26}, {opacity:1, y:0, duration:${dur}, ease:"expo.out"}, ${r2(at)});`);
const hideOut = (sel, at) => tw(`tl.to("${sel}", {opacity:0, y:30, duration:0.4, ease:"power2.in"}, ${r2(at)});`);

// ---- split-flap clock badge ----------------------------------------------
/** Four flap cards (HH:MM) that riffle through a few digits before landing on the time; the area under them. */
const flapClock = (sid, clock, area, at) => {
  const digits = clock.replace(":", "").split("");
  const cells = digits.map((dg, k) => {
    const seq = [String((+dg + 3 + k) % 10), String((+dg + 7 + k) % 10), String((+dg + 1) % 10), dg];
    const spans = seq.map((x, j) => `<b id="${sid}-f${k}-${j}" style="opacity:${j === 0 ? 1 : 0}">${x}</b>`).join("");
    seq.forEach((_, j) => {
      if (!j) return;
      const tt = at + 0.25 + k * 0.12 + j * 0.13;
      tw(`tl.set("#${sid}-f${k}-${j - 1}", {opacity:0}, ${r2(tt)});`);
      tw(`tl.set("#${sid}-f${k}-${j}", {opacity:1}, ${r2(tt)});`);
      tw(`tl.fromTo("#${sid}-fl${k}", {rotationX:0}, {rotationX:-180, duration:0.12, ease:"none", immediateRender:false}, ${r2(tt - 0.06)});`);
    });
    return `<div class="fc">${spans}<i id="${sid}-fl${k}" class="flap"></i></div>${k === 1 ? '<div class="colon">:</div>' : ""}`;
  }).join("");
  tw(`tl.fromTo("#${sid}-clk", {opacity:0, y:-40}, {opacity:1, y:0, duration:0.4, ease:"back.out(1.6)"}, ${r2(at)});`);
  for (let k = 0; k < 4; k++) sound("pop", r2(at + 0.3 + k * 0.17), 0.04);
  return `<div id="${sid}-clk" class="clk" style="opacity:0"><div class="fcs">${cells}</div><div class="clk-a">${esc(area)}</div></div>`;
};

const row = (p) => `<div class="row"><b>${esc(p.place)}</b><span>${esc(p.address)}</span><em class="${p.rating == null ? "sugg" : ""}">${star(p.rating)}</em></div>`;

// Google Maps screenshots (name + stars + review count), captured 16/11/2026 into public/videos/dong-cao/maps.
const MAPS = video.maps ?? {};
const MAPS_DATE = "chụp 16/11/2026";

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
    tw(`tl.fromTo(document.querySelectorAll("${rowsSel}")[${k}], {backgroundColor:"rgba(255,158,122,0)"}, {backgroundColor:"rgba(255,158,122,0.35)", duration:0.25, yoyo:true, repeat:1, repeatDelay:${r2(Math.max(slot - 0.5, 0.2))}}, ${r2(t0)});`);
  });
  return `<div id="${id}" class="gmaps" style="opacity:0"><div class="gmaps-h"><i>📍</i>Google Maps<span>${MAPS_DATE}</span></div>${list.map(([m, k]) => `<img id="${id}-${k}" src="${asset(`videos/dong-cao/maps/${m}.png`)}" alt="" />`).join("")}</div>`;
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
    tw(`tl.fromTo("#${id}", {opacity:0, y:50}, {opacity:1, y:0, duration:0.45, ease:"expo.out"}, ${r2(times[k] - 0.05)});`);
    if (k < cards.length - 1) tw(`tl.to("#${id}", {opacity:0, y:-30, duration:0.2, ease:"power3.in"}, ${r2(times[k + 1] - 0.22)});`);
    else if (s.end - times[k] > 3.2) hideOut(`#${id}`, s.end - 1.1);
    if (c.rows) tw(`tl.fromTo("#${id} .row", {opacity:0, x:-40}, {opacity:1, x:0, duration:0.3, stagger:0.09, ease:"power3.out"}, ${r2(times[k] + 0.15)});`);
  });
  return { html: parts.join(""), times };
};

// ---- cold open ---------------------------------------------------------------
/**
 * No voice for the first seconds: one slow clip builds under the music's snare roll, then hard cuts on every
 * second beat from the drop, with a white flash on the drop itself. The title condenses out of mist on the drop.
 * When the voice starts the hook's own clips take over and the title lifts away.
 */
const coldOpen = (s, sid) => {
  const cold = s.cold ?? [];
  const cuts = cold.map((_, k) => (k === 0 ? 0.25 : r2(DROP + (k - 1) * 2 * BEAT)));
  const voiceAt = s.vo;
  const parts = [`<div class="blackout" id="${sid}-black"></div>`];
  tw(`tl.fromTo("#${sid}-black", {opacity:1}, {opacity:0, duration:0.3, ease:"none"}, 0);`);
  cold.forEach((src, k) => {
    const id = `${sid}-k${k}`;
    const from = cuts[k];
    const until = k < cold.length - 1 ? cuts[k + 1] : voiceAt + 0.6;
    parts.push(`<div id="${id}" class="ph"${k ? ' style="opacity:0"' : ""}>${media(src, id, from, until - from + 0.4)}${creditTag(src)}</div>`);
    if (k) tw(`tl.set("#${id}", {opacity:1}, ${r2(from)});`);
    if (k < cold.length - 1) tw(`tl.set("#${id}", {opacity:0}, ${r2(until + 0.02)});`);
    tw(`tl.fromTo("#${id} video", {scale:${k ? 1.18 : 1.3}}, {scale:1.02, duration:${r2(until - from + 0.3)}, ease:"${k ? "power2.out" : "none"}"}, ${r2(from)});`);
  });
  parts.push(`<div id="${sid}-flash" class="flash" style="opacity:0"></div>`);
  tw(`tl.fromTo("#${sid}-flash", {opacity:0.9}, {opacity:0, duration:0.45, ease:"power2.out", immediateRender:false}, ${r2(DROP)});`);
  sound("impact-bass-1", r2(DROP), 0.12);
  // The hook's own clips, after the voice starts.
  const g = s.gallery ?? [];
  const seg = (s.end - voiceAt) / Math.max(1, g.length);
  g.forEach((src, k) => {
    const id = `${sid}-p${k}`;
    const from = r2(voiceAt + seg * k);
    parts.push(`<div id="${id}" class="ph" style="opacity:0">${media(src, id, from - 0.3, seg + 0.8)}${creditTag(src)}</div>`);
    tw(`tl.set("#${id}", {opacity:1}, ${from});`);
    tw(`tl.fromTo("#${id} video", {scale:1.12}, {scale:1.02, duration:${r2(seg + 0.6)}, ease:"none"}, ${from});`);
    if (k) tw(`tl.set("#${sid}-p${k - 1}", {opacity:0}, ${r2(from + 0.02)});`);
  });
  if (g.length) tw(`tl.set("#${sid}-k${cold.length - 1}", {opacity:0}, ${r2(voiceAt + 0.02)});`);
  return { html: parts.join(""), voiceAt };
};

// ---- fireflies ---------------------------------------------------------------
const flies = [];
for (let k = 0; k < 14; k++) {
  const x0 = 60 + ((k * 331) % 960);
  const y0 = 500 + ((k * 197) % 900);
  const size = 7 + (k % 4) * 2;
  flies.push(`<i id="ff${k}" class="ff" style="left:${x0}px;top:${y0}px;width:${size}px;height:${size}px" data-layout-ignore></i>`);
  const hop = 2.6 + (k % 5) * 0.5;
  let px = 0, py = 0, po = 0;
  // Chained fromTo legs (keyframes stick when the renderer seeks); the glow dims every third leg.
  for (let at = (k * 0.53) % 3, n = 0; at < total; at += hop, n++) {
    const nx = r2(Math.sin(k * 1.7 + n * 1.3) * 90), ny = r2(Math.cos(k * 2.3 + n * 0.9) * 70);
    const no = n % 3 === 1 ? 0.15 : 0.75;
    tw(`tl.fromTo("#ff${k}", {x:${px}, y:${py}, opacity:${po}}, {x:${nx}, y:${ny}, opacity:${no}, duration:${r2(hop)}, ease:"sine.inOut", immediateRender:${n === 0}}, ${r2(at)});`);
    px = nx; py = ny; po = no;
  }
}

// ---- time rail -------------------------------------------------------------
const timeRail = (sid, idx) => {
  const xs = stops.map((_, k) => 210 + (660 * k) / Math.max(1, stops.length - 1));
  const marks = stops.map((x, k) => `<i class="${k < idx ? "done" : ""}" style="left:${r2(xs[k] - 9)}px"></i><span style="left:${r2(xs[k] - 60)}px">${esc(x.clock ?? "")}</span>`).join("");
  const from = xs[Math.max(0, idx - 1)];
  return {
    html: `<div id="${sid}-rail" class="rail"><b class="line" style="left:${xs[0]}px;width:${r2(xs.at(-1) - xs[0])}px"></b>${marks}<em id="${sid}-orb" class="orb" style="left:${r2(from - 17)}px"></em></div>`,
    dx: r2(xs[idx] - from),
  };
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
    tw(`tl.fromTo("#${sid}-dim", {opacity:0}, {opacity:1, duration:0.4}, ${r2(DROP - 0.1)});`);
    parts.push(`<div id="${sid}-kicker" class="hook-kicker" style="opacity:0">${esc(s.kicker)}</div>`);
    parts.push(`<h1 id="${sid}-title" class="hook-title">${esc(s.caption)}</h1>`);
    parts.push(`<div id="${sid}-pill" class="pill" style="opacity:0">${esc(s.label ?? "")}</div>`);
    // Title condenses out of mist on the drop; kicker and pill on the next beats; all lift away after the voice starts.
    tw(`tl.fromTo("#${sid}-title", {opacity:0, scaleX:1.7, scaleY:1.2, filter:"blur(26px)"}, {opacity:1, scaleX:1, scaleY:1, filter:"blur(0px)", duration:1.1, ease:"expo.out"}, ${r2(DROP)});`);
    fadeUp(`#${sid}-kicker`, DROP + 2 * BEAT);
    tw(`tl.fromTo("#${sid}-pill", {opacity:0, scale:0.6}, {opacity:1, scale:1, duration:0.35, ease:"back.out(2)"}, ${r2(DROP + 4 * BEAT)});`);
    sound("pop", r2(DROP + 4 * BEAT), 0.08);
    const lift = m.voiceAt + 2.6;
    tw(`tl.to(["#${sid}-title", "#${sid}-kicker", "#${sid}-pill"], {opacity:0, y:-60, filter:"blur(12px)", duration:0.6, ease:"power2.in"}, ${r2(lift)});`);
    tw(`tl.to("#${sid}-dim", {opacity:0.35, duration:0.6}, ${r2(lift)});`);
  } else if (s.layout === "point") {
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div class="floor"></div>`);
    const idx = stops.findIndex((x) => x.id === s.id);
    parts.push(flapClock(sid, s.clock ?? "00:00", s.badge ?? "", enter + 0.5));
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
    tw(`tl.fromTo("#${sid}-food", {opacity:0, y:60}, {opacity:1, y:0, duration:0.5, ease:"expo.out"}, ${r2(cue - 0.1)});`);
    tw(`tl.fromTo("#${sid}-food .row", {opacity:0, x:-40}, {opacity:1, x:0, duration:0.3, stagger:0.09, ease:"power3.out"}, ${r2(cue + 0.15)});`);
    const hide = clearAt(cue, dishes.length, s.end);
    if (hide != null) hideOut(`#${sid}-food`, hide);
    parts.push(proofs(`${sid}-gm`, `#${sid}-food .row`, dishes, cue, s.end, hide));
    const rail = timeRail(sid, idx);
    parts.push(rail.html);
    fadeUp(`#${sid}-rail`, enter + 0.4);
    if (idx > 0) tw(`tl.fromTo("#${sid}-orb", {x:0}, {x:${rail.dx}, duration:1.0, ease:"power2.inOut"}, ${r2(enter + 0.8)});`);
  } else if (s.layout === "stay") {
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div class="floor"></div>`);
    parts.push(flapClock(sid, "21:00", "Ngủ đâu?", enter + 0.5));
    parts.push(`<div class="head"><div id="${sid}-kicker" class="kicker">ĐÊM Ở ĐỒNG CAO</div><h1 id="${sid}-title" class="title">${words(s.caption)}</h1></div>`);
    fadeUp(`#${sid}-kicker`, enter, 0.25);
    titleIn(`#${sid}-title`, enter + 0.2);
    const cards = s.zones.map((z, k) => ({
      title: `${k + 1} · ${z.title}`, cue: s.cues[k], rows: true,
      body: `<p class="card-n">${esc(z.note)}</p>` + z.picks.map(([n, rt, ad]) => row({ place: n, address: ad, rating: rt })).join(""),
    }));
    cards.push({ title: "Hoặc", cue: s.cues.at(-1), body: `<p class="card-t">${esc(s.tip)}</p>` });
    const cs = cardSeq(sid, s, cards, enter);
    parts.push(cs.html);
    s.zones.forEach((z, k) => {
      const places = z.picks.map(([n]) => ({ place: n }));
      const until = cs.times[k + 1] ?? s.end;
      parts.push(proofs(`${sid}-gm${k}`, `#${sid}-c${k} .row`, places, cs.times[k], until, until - 0.1));
    });
  } else if (s.layout === "cost") {
    // "Hết bao nhiêu tiền?": a price list beside a wallet. The wallet opens; for every line a banknote slides
    // out onto the stack while the counter shows the running total, low–high; the total lands last.
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div class="floor"></div><div id="${sid}-veil" class="veil" style="opacity:0"></div>`);
    parts.push(`<div class="head"><div id="${sid}-kicker" class="kicker">${esc(s.kicker ?? "")}</div><h1 id="${sid}-title" class="title" style="font-size:88px">${words(s.caption)}</h1></div>`);
    fadeUp(`#${sid}-kicker`, enter, 0.25);
    titleIn(`#${sid}-title`, enter + 0.2);
    const t0 = enter + 1.4;
    tw(`tl.fromTo("#${sid}-veil", {opacity:0}, {opacity:1, duration:0.5}, ${r2(t0 - 0.2)});`);
    const items = s.items ?? [];
    const totalAt = Math.max(cueTime(s, s.totalCue) ?? s.end - 3.2, t0 + items.length * 0.6 + 0.8);
    const step = Math.min(1.1, (totalAt - t0 - 0.6) / Math.max(1, items.length));
    const money = (n) => (n < 1000 ? `${n}k` : `${(n / 1000).toFixed(1).replace(".", ",")}tr`);
    let lo = 0, hi = 0;
    const shows = [`<b id="${sid}-d0" class="cnt-v">0đ</b>`];
    const notes = [];
    tw(`tl.fromTo("#${sid}-flap", {rotationX:0}, {rotationX:-150, duration:0.5, ease:"back.out(1.4)"}, ${r2(t0 + 0.3)});`);
    const lines = items.map((it, k) => {
      const at = t0 + 0.7 + k * step;
      lo += it.n?.[0] ?? 0; hi += it.n?.[1] ?? 0;
      shows.push(`<b id="${sid}-d${k + 1}" class="cnt-v" style="opacity:0">${hi ? `${money(lo)}–${money(hi)}` : "0đ"}</b>`);
      tw(`tl.fromTo("#${sid}-ln${k}", {opacity:0, x:-30}, {opacity:1, x:0, duration:0.3, ease:"power3.out"}, ${r2(at)});`);
      notes.push(`<i id="${sid}-note${k}" class="note" style="opacity:0;z-index:${k + 2}"><b>${esc(it.v)}</b></i>`);
      tw(`tl.fromTo("#${sid}-note${k}", {opacity:1, y:150, rotation:0, scale:0.7}, {opacity:1, y:${-40 - k * 26}, rotation:${(k % 2 ? 1 : -1) * (4 + k * 2)}, scale:1, duration:0.5, ease:"back.out(1.6)", immediateRender:false}, ${r2(at + 0.05)});`);
      tw(`tl.set("#${sid}-d${k}", {opacity:0}, ${r2(at + 0.4)});`);
      tw(`tl.set("#${sid}-d${k + 1}", {opacity:1}, ${r2(at + 0.4)});`);
      sound("pop", r2(at + 0.3), 0.07);
      return `<div id="${sid}-ln${k}" class="ln" style="opacity:0"><span>${esc(it.k)}${it.note ? `<small>${esc(it.note)}</small>` : ""}</span><b>${esc(it.v)}</b></div>`;
    }).join("");
    parts.push(`<div id="${sid}-list" class="plist" style="opacity:0"><div class="tp-h">${esc(s.receiptTitle ?? "")}</div>${lines}<div class="tp-f">${esc(s.note ?? "")}</div></div>`);
    fadeUp(`#${sid}-list`, t0);
    parts.push(`<div id="${sid}-bank" class="bank" style="opacity:0"><div class="cnt"><small>ĐÃ CHI</small>${shows.join("")}</div>` +
      `<div class="wallet"><i class="w-back"></i>${notes.join("")}<i class="w-front"><b></b></i><i id="${sid}-flap" class="w-flap"><b></b></i></div></div>`);
    fadeUp(`#${sid}-bank`, t0 + 0.1);
    parts.push(`<div id="${sid}-tot" class="c-tot" style="opacity:0"><small>TỔNG / NGƯỜI</small>${esc(s.total)}</div>`);
    tw(`tl.fromTo("#${sid}-tot", {opacity:0, scale:0.6}, {opacity:1, scale:1, duration:0.4, ease:"back.out(2)"}, ${r2(totalAt)});`);
    sound("impact-bass-1", r2(totalAt + 0.2), 0.1);
    parts.push(`<div id="${sid}-stamp" class="stamp" style="opacity:0">${esc(s.stamp ?? "")}</div>`);
    tw(`tl.fromTo("#${sid}-stamp", {opacity:0, scale:2.2, rotation:-24}, {opacity:1, scale:1, rotation:-8, duration:0.35, ease:"power4.in"}, ${r2(totalAt + 0.8)});`);
  } else {
    // Outro: three ticked tips, then the title over the footage, a 3-2-1 countdown ring and the call to action.
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div id="${sid}-dim" class="hook-dim" style="opacity:0"></div>`);
    tw(`tl.to("#${sid}-dim", {opacity:1, duration:0.6}, ${r2(enter)});`);
    parts.push(`<div id="${sid}-kicker" class="tips-h" style="opacity:0">${esc(s.kicker ?? "")}</div>`);
    fadeUp(`#${sid}-kicker`, enter + 0.4);
    const tipAt = (k) => cueTime(s, ["mang áo ấm", "mặc đồ", "mang rác"][k]) ?? enter + 1.2 + k * 2.2;
    (s.tips ?? []).forEach((tip, k) => {
      parts.push(`<div id="${sid}-tip${k}" class="tip" style="opacity:0;top:${600 + k * 120}px"><i id="${sid}-tick${k}">✓</i>${esc(tip)}</div>`);
      tw(`tl.fromTo("#${sid}-tip${k}", {opacity:0, x:-40}, {opacity:1, x:0, duration:0.4, ease:"power3.out"}, ${r2(tipAt(k))});`);
      tw(`tl.fromTo("#${sid}-tick${k}", {scale:0}, {scale:1, duration:0.3, ease:"back.out(3)"}, ${r2(tipAt(k) + 0.25)});`);
      sound("pop", r2(tipAt(k) + 0.25), 0.06);
    });
    const countAt = s.end - 4.4;
    parts.push(`<h1 id="${sid}-title" class="out-title">${words(s.caption)}</h1>`);
    tw(`tl.to(["#${sid}-kicker", ${(s.tips ?? []).map((_, k) => `"#${sid}-tip${k}"`).join(", ")}], {opacity:0, y:-30, duration:0.35}, ${r2(countAt - 0.4)});`);
    titleIn(`#${sid}-title`, countAt - 0.2);
    parts.push(`<div id="${sid}-ring" class="ring" style="opacity:0"><svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="88" class="ring-bg"/><circle id="${sid}-arc" cx="100" cy="100" r="88" class="ring-fg"/></svg>${[3, 2, 1].map((n, k) => `<b id="${sid}-n${k}" style="opacity:0">${n}</b>`).join("")}</div>`);
    tw(`tl.fromTo("#${sid}-ring", {opacity:0, scale:0.7}, {opacity:1, scale:1, duration:0.35, ease:"back.out(2)"}, ${r2(countAt + 0.5)});`);
    tw(`tl.fromTo("#${sid}-arc", {strokeDashoffset:553}, {strokeDashoffset:0, duration:2.4, ease:"none"}, ${r2(countAt + 0.6)});`);
    [0, 1, 2].forEach((k) => {
      const tt = countAt + 0.6 + k * 0.8;
      tw(`tl.fromTo("#${sid}-n${k}", {opacity:0, scale:1.6}, {opacity:1, scale:1, duration:0.25, ease:"power3.out", immediateRender:false}, ${r2(tt)});`);
      if (k < 2) tw(`tl.set("#${sid}-n${k}", {opacity:0}, ${r2(tt + 0.8)});`);
      sound("pop", r2(tt), 0.07);
    });
    const ctaAt = countAt + 3.1;
    tw(`tl.to("#${sid}-ring", {opacity:0, scale:0.6, duration:0.25}, ${r2(ctaAt - 0.1)});`);
    parts.push(`<div id="${sid}-cta" class="pill cta" style="opacity:0">${esc(s.cta ?? "")}</div>`);
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
const mediaTags = [];
for (const s of scenes) {
  if (!s.clip) continue;
  mediaTags.push(`<audio id="vo-${s.id}" src="${asset(s.clip.file)}" data-start="${r2(s.vo)}" data-duration="${r2(s.clip.durationSec)}" data-volume="1" data-track-index="2"></audio>`);
}
// Loud music for the cold open (from just before the drop), ducked to a bed once the voice comes in; the bed
// carries on from the same point in the track, then loops from the start.
const musicSrc = asset(video.music.src);
const musicLen = probeDurationSec(path.join(PUBLIC_ROOT, video.music.src));
const voiceIn = scenes[0].vo;
mediaTags.push(`<audio id="music-cold" src="${musicSrc}" data-start="0" data-media-start="${MUSIC_OFFSET}" data-duration="${r2(voiceIn + 0.8)}" data-volume="0.85" data-fade-in="0.2" data-fade-out="0.9" data-track-index="3"></audio>`);
for (let at = r2(voiceIn - 0.1), off = r2(MUSIC_OFFSET + voiceIn - 0.1), k = 0; at < total - 0.05; k++) {
  const dur = r2(Math.min(musicLen - off, total - at));
  const last = at + dur >= total - 0.01;
  mediaTags.push(`<audio id="music-${k}" src="${musicSrc}" data-start="${r2(at)}" data-media-start="${r2(off)}" data-duration="${dur}" data-volume="0.22" data-fade-in="${k ? 1 : 0.8}" data-fade-out="${last ? 1.5 : 1}" data-track-index="${k % 2 ? 31 : 30}"></audio>`);
  if (last) break;
  at = r2(at + dur - 1);
  off = 0;
}

// ---- shader seams + quiet whooshes -----------------------------------
const SHADERS = ["chromatic-radial-split", "gravitational-lens", "thermal-distortion", "domain-warp-dissolve"];
const transitions = scenes.slice(1).map((s, k) => ({
  time: r2(s.start - SEAM / 2),
  shader: k === scenes.length - 2 ? "whip-pan" : SHADERS[k % SHADERS.length],
  duration: SEAM,
}));
for (const tr of transitions) sound("whoosh-short", r2(tr.time - 0.1), 0.14);

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
:root { --ground:#0f1426; --ink:#fff7ee; --rose:#ff9e7a; --rosed:#d9684a; --peach:#ffd9a0; --night:#1c2240; --glass:rgba(16,20,40,0.62); }
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:${W}px; height:${H}px; overflow:hidden; background:var(--ground); }
#root { position:relative; width:${W}px; height:${H}px; overflow:hidden; font-family:"Montserrat"; }
.scene { position:absolute; inset:0; overflow:hidden; background:var(--ground); z-index:1; }
.ph { position:absolute; inset:0; overflow:hidden; }
.ph video { width:100%; height:100%; object-fit:cover; display:block; }
/* Venetian blinds: the clip shows through 120 px strips that widen from 0 until they meet. */
.slats { --o:0px; -webkit-mask-image:repeating-linear-gradient(180deg, #000 0 var(--o), transparent var(--o) 120px); mask-image:repeating-linear-gradient(180deg, #000 0 var(--o), transparent var(--o) 120px); }
/* Mist wipe: the clip is revealed left to right behind a soft edge, under a moving fog band. */
.mistwipe { --m:-40%; -webkit-mask-image:linear-gradient(90deg, #000 var(--m), transparent calc(var(--m) + 30%)); mask-image:linear-gradient(90deg, #000 var(--m), transparent calc(var(--m) + 30%)); }
.mist { position:absolute; top:-5%; bottom:-5%; left:-10%; width:70%; z-index:3; background:radial-gradient(ellipse at 50% 50%, rgba(255,250,244,0.92) 0%, rgba(255,250,244,0.55) 40%, rgba(255,250,244,0) 70%); filter:blur(30px); }
.cr { position:absolute; left:60px; top:112px; z-index:4; font:600 22px "Montserrat"; color:rgba(255,247,238,0.82); text-shadow:0 2px 8px rgba(0,0,0,0.7); }
.blackout { position:absolute; inset:0; z-index:9; background:#000; }
.flash { position:absolute; inset:0; z-index:6; background:#fff; }
.shade { position:absolute; inset:0; background:linear-gradient(180deg, rgba(10,12,28,0.2) 0%, rgba(10,12,28,0) 35%, rgba(10,12,28,0) 65%, rgba(10,12,28,0.35) 100%); }
.top { position:absolute; left:0; right:0; top:0; height:760px; background:linear-gradient(180deg, rgba(12,14,32,0.85) 0%, rgba(12,14,32,0.5) 55%, rgba(12,14,32,0) 100%); }
.floor { position:absolute; left:0; right:0; bottom:0; height:900px; background:linear-gradient(180deg, rgba(12,14,32,0) 0%, rgba(12,14,32,0.6) 45%, rgba(12,14,32,0.93) 100%); }
.veil { position:absolute; inset:0; background:rgba(12,14,32,0.55); }
.hook-dim { position:absolute; inset:0; z-index:4; background:linear-gradient(180deg, rgba(12,14,32,0.35) 0%, rgba(12,14,32,0.05) 45%, rgba(12,14,32,0.8) 100%); }
.ff { position:absolute; z-index:16; border-radius:50%; background:#fff3b0; box-shadow:0 0 14px 6px rgba(255,214,120,0.6), 0 0 34px 10px rgba(255,170,90,0.25); pointer-events:none; opacity:0; }
.hook-kicker { position:absolute; left:0; right:0; top:1090px; text-align:center; font:700 32px "Montserrat"; letter-spacing:0.3em; color:var(--peach); z-index:7; text-shadow:0 2px 14px rgba(0,0,0,0.6); }
.hook-title { position:absolute; left:0; right:0; top:1150px; text-align:center; font:900 170px/1 "Playfair Display"; color:var(--ink); text-shadow:0 10px 60px rgba(0,0,0,0.6); z-index:7; white-space:nowrap; opacity:0; }
.title .w, .out-title .w { display:inline-block; }
.pill { position:absolute; left:50%; top:1370px; transform:translateX(-50%); font:900 44px "Montserrat"; color:#2a1520; background:var(--rose); padding:12px 40px; border-radius:999px; white-space:nowrap; z-index:8; }
/* Split-flap clock. */
.clk { position:absolute; right:60px; top:150px; z-index:6; text-align:center; }
.fcs { display:flex; gap:8px; align-items:center; }
.fc { position:relative; width:70px; height:96px; border-radius:10px; background:linear-gradient(180deg, #232846 0 49%, #11152b 51% 100%); box-shadow:0 10px 24px rgba(0,0,0,0.55), inset 0 0 0 2px rgba(255,255,255,0.08); perspective:300px; }
.fc b { position:absolute; inset:0; font:800 70px/96px "Montserrat"; color:var(--peach); }
.fc::after { content:""; position:absolute; left:0; right:0; top:47px; height:2px; background:rgba(0,0,0,0.6); }
.flap { position:absolute; left:0; right:0; top:0; height:48px; border-radius:10px 10px 0 0; background:rgba(40,46,80,0.9); transform-origin:50% 100%; backface-visibility:hidden; }
.colon { font:800 60px "Montserrat"; color:var(--peach); margin:0 2px; }
.clk-a { margin-top:12px; font:700 26px "Montserrat"; letter-spacing:0.12em; color:var(--ink); text-shadow:0 2px 10px rgba(0,0,0,0.7); text-transform:uppercase; }
.head { position:absolute; left:80px; top:330px; width:680px; display:flex; flex-direction:column; gap:10px; z-index:5; }
.kicker { font:700 32px "Montserrat"; letter-spacing:0.28em; color:var(--rose); }
.title { margin-bottom:10px; font:800 96px/1.04 "Playfair Display"; color:var(--ink); text-shadow:0 6px 30px rgba(0,0,0,0.55); }
.point { font:600 36px/1.3 "Montserrat"; color:rgba(255,247,238,0.95); text-shadow:0 2px 14px rgba(0,0,0,0.75); }
.point i { display:inline-block; width:16px; height:16px; border-radius:50%; margin-right:18px; vertical-align:middle; background:var(--rose); box-shadow:0 0 12px var(--rose); }
/* Frosted-glass cards in the lower third. */
.card { position:absolute; left:60px; width:960px; top:1110px; padding:28px 34px 16px 40px; border-radius:26px; background:var(--glass); backdrop-filter:blur(18px) saturate(1.3); -webkit-backdrop-filter:blur(18px) saturate(1.3); border:2px solid rgba(255,255,255,0.18); box-shadow:0 18px 40px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,158,122,0.25); z-index:7; overflow:hidden; }
.card::before { content:""; position:absolute; left:0; right:0; top:0; height:6px; background:linear-gradient(90deg, var(--rose), var(--peach)); }
.card-h { font:800 26px "Montserrat"; letter-spacing:0.2em; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; color:var(--peach); }
.card-t { font:600 40px/1.3 "Montserrat"; color:var(--ink); }
.card-n { font:600 30px/1.3 "Montserrat"; color:rgba(255,247,238,0.75); margin-bottom:6px; }
.dots i { display:inline-block; width:12px; height:12px; border-radius:50%; margin-left:10px; background:rgba(255,255,255,0.25); }
.dots i.on { background:var(--rose); }
.row { display:flex; align-items:baseline; gap:16px; padding:8px 6px; border-top:1px solid rgba(255,255,255,0.14); border-radius:10px; }
.row b { font:800 34px "Montserrat"; color:var(--ink); white-space:nowrap; }
.row span { font:500 27px "Montserrat"; color:rgba(255,247,238,0.65); flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.row em { font:800 26px "Montserrat"; font-style:normal; color:#2a1520; background:var(--peach); padding:4px 14px; border-radius:999px; white-space:nowrap; }
.row em.sugg { background:rgba(255,255,255,0.18); color:var(--ink); }
.gmaps { position:absolute; left:400px; width:620px; bottom:830px; border-radius:22px; overflow:hidden; background:#fff; box-shadow:0 16px 40px rgba(0,0,0,0.5); z-index:8; }
.gmaps-h { display:flex; align-items:center; gap:10px; padding:12px 22px; background:#f1f3f4; font:700 24px "Montserrat"; color:#3c4043; }
.gmaps-h i { font-style:normal; }
.gmaps-h span { margin-left:auto; font:500 20px "Montserrat"; color:#70757a; }
.gmaps img { display:block; width:100%; border-top:1px solid #e8eaed; }
/* Time rail under the subtitles. */
.rail { position:absolute; left:0; right:0; top:1660px; height:90px; z-index:20; }
.rail .line { position:absolute; top:24px; height:3px; background:linear-gradient(90deg, rgba(255,217,160,0.2), rgba(255,217,160,0.8), rgba(255,217,160,0.2)); }
.rail i { position:absolute; top:16px; width:18px; height:18px; border-radius:50%; background:rgba(15,20,38,0.9); box-shadow:inset 0 0 0 3px rgba(255,247,238,0.6); }
.rail i.done { background:var(--rose); }
.rail span { position:absolute; top:44px; width:120px; text-align:center; font:700 24px "Montserrat"; color:rgba(255,247,238,0.85); text-shadow:0 2px 8px rgba(0,0,0,0.7); }
.rail .orb { position:absolute; top:8px; width:34px; height:34px; border-radius:50%; background:radial-gradient(circle, #fff6d8 0%, var(--peach) 45%, rgba(255,158,122,0) 72%); box-shadow:0 0 22px 8px rgba(255,190,120,0.55); }
/* Cost: price list + wallet. */
.plist { position:absolute; left:50px; width:620px; top:560px; z-index:7; padding:26px 30px 24px; border-radius:22px; background:var(--glass); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); border:2px solid rgba(255,255,255,0.16); box-shadow:0 22px 44px rgba(0,0,0,0.5); }
.tp-h { font:900 27px "Montserrat"; letter-spacing:0.1em; color:var(--peach); padding-bottom:10px; border-bottom:3px solid rgba(255,158,122,0.6); }
.ln { display:flex; justify-content:space-between; align-items:center; gap:14px; padding:12px 0; border-bottom:2px solid rgba(255,255,255,0.1); }
.ln span { font:800 29px/1.15 "Montserrat"; color:var(--ink); }
.ln span small { display:block; font:600 20px "Montserrat"; color:rgba(255,247,238,0.6); margin-top:3px; }
.ln b { font:900 30px "Montserrat"; color:var(--peach); white-space:nowrap; }
.tp-f { margin-top:12px; font:600 19px "Montserrat"; color:rgba(255,247,238,0.6); }
.bank { position:absolute; left:690px; top:600px; width:350px; height:560px; z-index:8; }
.cnt { position:absolute; left:10px; right:10px; top:0; height:118px; border-radius:18px; background:var(--night); box-shadow:0 14px 28px rgba(0,0,0,0.5), inset 0 0 0 3px var(--rose); }
.cnt small { position:absolute; left:0; right:0; top:12px; text-align:center; font:800 18px "Montserrat"; letter-spacing:0.2em; color:var(--rose); }
.cnt-v { position:absolute; left:0; right:0; bottom:14px; text-align:center; font:900 40px "Montserrat"; color:var(--peach); white-space:nowrap; }
.wallet { position:absolute; left:25px; top:330px; width:300px; height:190px; perspective:800px; }
.wallet i { position:absolute; display:block; font-style:normal; }
.w-back { left:0; top:0; width:300px; height:190px; border-radius:22px; background:#6b3b2a; box-shadow:0 16px 30px rgba(0,0,0,0.5); }
.w-front { left:0; top:60px; width:300px; height:130px; border-radius:0 0 22px 22px; background:linear-gradient(180deg, #8d5038, #6f3c29); z-index:20; box-shadow:0 -4px 0 rgba(0,0,0,0.2); }
.w-front b { position:absolute; left:20px; right:20px; top:16px; bottom:16px; border:3px dashed rgba(255,217,160,0.45); border-radius:14px; }
.w-flap { left:0; top:0; width:300px; height:80px; border-radius:22px 22px 6px 6px; background:#9c5a3f; transform-origin:50% 100%; z-index:21; }
.w-flap b { position:absolute; right:30px; top:28px; width:34px; height:24px; border-radius:6px; background:#e3b46b; }
.note { left:30px; top:10px; width:240px; height:120px; border-radius:10px; background:linear-gradient(135deg, #3fa58f, #2a7c6b); box-shadow:0 8px 16px rgba(0,0,0,0.4), inset 0 0 0 4px rgba(255,255,255,0.25); }
.note b { position:absolute; inset:0; text-align:center; font:900 34px/120px "Montserrat"; color:#fff; }
.c-tot { position:absolute; left:690px; top:1180px; z-index:8; width:350px; padding:12px 18px; border-radius:18px; background:var(--peach); text-align:center; font:900 48px "Montserrat"; color:#2a1520; box-shadow:0 16px 30px rgba(0,0,0,0.45); }
.c-tot small { display:block; font:900 22px "Montserrat"; letter-spacing:0.14em; }
.stamp { position:absolute; left:110px; top:1250px; z-index:9; padding:8px 18px; border:5px solid var(--rosed); border-radius:12px; color:var(--rosed); font:900 26px "Montserrat"; letter-spacing:0.06em; background:rgba(255,255,255,0.92); }
/* Outro. */
.tips-h { position:absolute; left:90px; top:520px; z-index:7; font:800 32px "Montserrat"; letter-spacing:0.3em; color:var(--peach); }
.tip { position:absolute; left:90px; z-index:7; font:800 52px/1.2 "Montserrat"; color:var(--ink); text-shadow:0 4px 20px rgba(0,0,0,0.7); white-space:nowrap; }
.tip i { display:inline-block; width:62px; height:62px; margin-right:22px; border-radius:50%; background:var(--rose); color:#2a1520; font:900 40px/62px "Montserrat"; font-style:normal; text-align:center; vertical-align:middle; }
.out-title { position:absolute; left:40px; right:40px; top:560px; text-align:center; z-index:7; font:900 120px/1.05 "Playfair Display"; color:var(--ink); text-shadow:0 10px 50px rgba(0,0,0,0.6); }
.ring { position:absolute; left:440px; top:900px; width:200px; height:200px; z-index:8; }
.ring svg { width:200px; height:200px; transform:rotate(-90deg); }
.ring-bg { fill:rgba(15,20,38,0.55); stroke:rgba(255,255,255,0.2); stroke-width:10; }
.ring-fg { fill:none; stroke:var(--rose); stroke-width:10; stroke-linecap:round; stroke-dasharray:553; stroke-dashoffset:553; }
.ring b { position:absolute; inset:0; text-align:center; font:900 110px/200px "Montserrat"; color:var(--ink); }
.pill.cta { top:960px; font-size:64px; padding:18px 56px; }
.brand { position:absolute; left:60px; top:60px; z-index:21; font:800 26px "Montserrat"; letter-spacing:0.3em; color:rgba(255,247,238,0.9); text-shadow:0 2px 10px rgba(0,0,0,0.5); }
.brand b { color:var(--rose); letter-spacing:0; margin-right:12px; }
.cap { position:absolute; left:60px; right:60px; top:1500px; text-align:center; font:800 50px/1.25 "Montserrat"; color:#ffffff; text-shadow:0 3px 0 rgba(0,0,0,0.55), 0 0 22px rgba(0,0,0,0.85); z-index:20; }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="${W}" data-height="${H}">
${mediaTags.join("\n")}
${sfx.join("\n")}
${html.join("\n")}
${flies.join("\n")}
<div class="brand" data-layout-ignore><b>☁</b>${esc(brand)}</div>
${caps.join("\n")}
</div>
<script>
const tl = gsap.timeline({ paused: true });
${js.join("\n")}
HyperShader.init({
  bgColor: "#0f1426",
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
