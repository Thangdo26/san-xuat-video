#!/usr/bin/env node
/**
 * node hf/build-cb.mjs --slug cao-bang-3n2d [--cover]
 *
 * Turns data/videos/<slug>/video.json + voiceover.json into a HyperFrames project at
 * build/<slug>/. The look ("Cao Bằng · non nước Việt Bắc"), new for this destination:
 *   - travel intro: a flash montage, the best photos cut one after another through white
 *     flashes with a punch-in, then the title settles over the last photo;
 *   - golden sun motes drifting up over every scene; mint-white cards with a jade rule;
 *   - each stop gets a roadside kilometre post (red cap, white body: "NGÀY 1 / SÁNG") that
 *     rises out of the ground;
 *   - photos change with a zoom-through dissolve (scale + blur), not a wipe;
 *   - a Google Maps panel above every restaurant card (name, stars, reviews);
 *   - travel outro: a route summary map, pins dropping in day order along a dashed trail;
 *   - food intro: a chalkboard menu writing out the five dishes; food outro: a film strip;
 *   - shader seams: whip pan, swirl vortex, ridged burn, domain-warp dissolve,
 *     chromatic radial split; quiet whooshes (about 0.15); subtitles at top 1500, rail below.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fail, parseArgs, requireSlug } from "../scripts/lib/args.mjs";
import { probeDurationSec } from "../scripts/lib/media.mjs";
import { PROJECT_ROOT, PUBLIC_ROOT } from "../scripts/lib/paths.mjs";

const { flags } = parseArgs(process.argv.slice(2));
const slug = requireSlug(flags, "build-cb");
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
const vi = video.language === "vi";
const isFood = video.template === "food";
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
const star = (r) => (r == null ? (vi ? "gợi ý" : "tip") : `★${r.toFixed(1)}`);

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

/** Photo stack; each new photo dissolves in through a zoom (scale down from 1.14 with a blur). */
const photos = (s, from, to, idPrefix) => {
  const g = s.gallery ?? [];
  const seg = (to - from) / g.length;
  return g
    .map((src, k) => {
      const id = `${idPrefix}-p${k}`;
      const a = r2(from + seg * k);
      const mv = MOVES[(s.i + k) % MOVES.length];
      tw(`tl.fromTo("#${id} img", {${mv.from}}, {${mv.to}, duration:${r2(seg + 0.8)}, ease:"none"}, ${a});`);
      if (k > 0) {
        tw(`tl.fromTo("#${id}", {opacity:0, scale:1.14, filter:"blur(14px)"}, {opacity:1, scale:1, filter:"blur(0px)", duration:0.75, ease:"power2.out", immediateRender:false}, ${a});`);
        tw(`tl.to("#${idPrefix}-p${k - 1}", {opacity:0, duration:0.01}, ${r2(a + 0.76)});`);
      }
      return `<div id="${id}" class="ph"${k > 0 ? ' style="opacity:0"' : ""}><img src="${asset(src)}" alt="" /></div>`;
    })
    .join("");
};

const titleIn = (sel, at) =>
  tw(`tl.fromTo("${sel} .w", {opacity:0, y:30, filter:"blur(8px)"}, {opacity:1, y:0, filter:"blur(0px)", duration:0.5, stagger:0.08, ease:"power3.out"}, ${r2(at)});`);
const fadeUp = (sel, at, dur = 0.35) =>
  tw(`tl.fromTo("${sel}", {opacity:0, y:26}, {opacity:1, y:0, duration:${dur}, ease:"expo.out"}, ${r2(at)});`);

/** Roadside kilometre post (red cap, white body) that rises out of the ground with a small bounce. */
const sign = (sid, big, small, at) => {
  tw(`tl.fromTo("#${sid}-sign .mile", {y:330}, {y:0, duration:0.55, ease:"back.out(1.5)"}, ${r2(at)});`);
  tw(`tl.fromTo("#${sid}-sign", {opacity:0}, {opacity:1, duration:0.15}, ${r2(at)});`);
  tw(`tl.fromTo("#${sid}-sign .mile", {rotation:0}, {rotation:-3, duration:0.18, yoyo:true, repeat:1, ease:"sine.inOut"}, ${r2(at + 0.55)});`);
  sound("pop", r2(at + 0.5), 0.12);
  return `<div id="${sid}-sign" class="sign" style="opacity:0"><div class="mile"><div class="mile-cap">${esc(brand)}</div><b>${esc(big)}</b><small>${esc(small)}</small></div><i class="ground"></i></div>`;
};

const row = (p, accent) => `<div class="row"><b>${esc(p.place)}</b><span>${esc(p.address)}</span><em style="background:${p.rating == null ? "rgba(255,255,255,0.18)" : accent}">${star(p.rating)}</em></div>`;

// Google Maps screenshots (name + stars + review count), captured 06/11/2026 into public/videos/cao-bang/maps.
const MAPS = {
  "Quán Ngon": "quan-ngon", "Nhà hàng Sơn Huệ": "son-hue", "Nhà hàng Nùng": "nha-hang-nung",
  "Phở Vịt Dung Thịnh": "dung-thinh", "Áp chao cô Hạc": "co-hac", "Yên - Ngon như mẹ nấu": "yen",
  "Bánh cuốn Phố Cũ": "pho-cu", "Bánh mỳ Thu Thắng": "thu-thang", "Áp Chao Cô Ngân": "co-ngan", "Hương Việt Palace": "huong-viet",
  "Hoàng Dương": "hoang-duong", "Phở Linh Ngoan": "linh-ngoan", "Bánh Cuốn Sáng": "banh-cuon-sang",
  "Quán Cơm Vinh": "com-vinh", "Phở Chinh Lành": "chinh-lanh", "Nhà hàng Cây Khế": "cay-khe",
  "Nhà Mộc Homestay": "nha-moc", "Nhà hàng Khương Thuỷ": "khuong-thuy",
  "Cơm-Phở Huyền Trang": "huyen-trang", "Nặm Pé Homestay": "nam-pe", "Sơn Lâm Homestay": "son-lam",
};

/** A Google Maps panel above the card: one screenshot per listed place, sliding in while its row lights up. */
const proofs = (sid, rowsSel, places, from, to) => {
  const list = places.map((p, k) => [MAPS[p.place], k]).filter(([m]) => m);
  if (!list.length) return "";
  const id = `${sid}-gm`, slot = Math.min(0.9, (to - from - 1) / list.length);
  tw(`tl.fromTo("#${id}", {opacity:0, y:40, scale:0.92}, {opacity:1, y:0, scale:1, duration:0.4, ease:"back.out(1.5)"}, ${r2(from + 0.25)});`);
  list.forEach(([, k], i) => {
    const t0 = from + 0.45 + i * slot;
    tw(`tl.fromTo("#${id}-${k}", {opacity:0, x:60}, {opacity:1, x:0, duration:0.35, ease:"power3.out"}, ${r2(t0)});`);
    tw(`tl.fromTo(document.querySelectorAll("${rowsSel}")[${k}], {backgroundColor:"rgba(79,209,197,0)"}, {backgroundColor:"rgba(79,209,197,0.3)", duration:0.25, yoyo:true, repeat:1, repeatDelay:${r2(Math.max(slot - 0.5, 0.2))}}, ${r2(t0)});`);
  });
  return `<div id="${id}" class="gmaps" style="opacity:0"><div class="gmaps-h"><i>📍</i>Google Maps<span>${vi ? "chụp 06/11/2026" : "captured 6 Nov 2026"}</span></div>${list.map(([m, k]) => `<img id="${id}-${k}" src="${asset(`videos/cao-bang/maps/${m}.png`)}" alt="" />`).join("")}</div>`;
};

/** Cards shown one at a time at given times (each up at least 1.8 s). */
const cardSeq = (sid, s, cards, enter, accent) => {
  const times = [];
  cards.forEach((c, k) => {
    const cue = cueTime(s, c.cue) ?? enter + 1.5 + k * ((s.end - enter - 2) / cards.length);
    times.push(Math.max(cue, k ? times[k - 1] + 1.8 : enter + CLEAR));
  });
  const parts = [];
  cards.forEach((c, k) => {
    const id = `${sid}-c${k}`;
    parts.push(`<div id="${id}" class="card" style="opacity:0"><div class="card-h" style="color:${accent}">${esc(c.title.toUpperCase())}<span class="dots">${cards.map((_, j) => `<i class="${j === k ? "on" : ""}"></i>`).join("")}</span></div>${c.body}</div>`);
    tw(`tl.fromTo("#${id}", {opacity:0, y:50, filter:"blur(10px)"}, {opacity:1, y:0, filter:"blur(0px)", duration:0.45, ease:"expo.out"}, ${r2(times[k] - 0.05)});`);
    if (k < cards.length - 1) tw(`tl.to("#${id}", {opacity:0, y:-30, filter:"blur(8px)", duration:0.2, ease:"power3.in"}, ${r2(times[k + 1] - 0.22)});`);
    if (c.rows) tw(`tl.fromTo("#${id} .row", {opacity:0, x:-40}, {opacity:1, x:0, duration:0.3, stagger:0.09, ease:"power3.out"}, ${r2(times[k] + 0.15)});`);
    if (c.places) parts.push(proofs(id, `#${id} .row`, c.places, times[k], k < cards.length - 1 ? times[k + 1] - 0.22 : s.end));
  });
  return parts.join("");
};

// ---- flash montage (travel intro) ----------------------------------------
// The best photos cut one after another through white flashes with a punch-in and a
// name tag; the last photo then holds and the title settles over it.
const CUT = 0.55;
const flashIntro = (s, sid) => {
  const a = s.start;
  const g = s.gallery ?? [];
  const parts = [];
  g.forEach((src, k) => {
    const at = r2(a + 0.15 + k * CUT);
    const last = k === g.length - 1;
    parts.push(`<div id="${sid}-m${k}" class="ph"${k ? ' style="opacity:0"' : ""}><img src="${asset(src)}" alt="" /></div>`);
    if (k) tw(`tl.set("#${sid}-m${k}", {opacity:1}, ${at});`);
    if (k) tw(`tl.set("#${sid}-m${k - 1}", {opacity:0}, ${r2(at + 0.02)});`);
    tw(`tl.fromTo("#${sid}-m${k} img", {scale:1.28}, {scale:${last ? 1.04 : 1.12}, duration:${last ? r2(s.end - at) : CUT + 0.1}, ease:"${last ? "expo.out" : "power2.out"}"}, ${at});`);
    tw(`tl.fromTo("#${sid}-flash", {opacity:${k ? 0.85 : 0.6}}, {opacity:0, duration:0.28, ease:"power2.out"}, ${at});`);
    if (k % 2 === 0) sound("pop", at, 0.08);
    const name = s.names?.[k];
    if (name && !last) {
      parts.push(`<div id="${sid}-tag${k}" class="m-tag" style="opacity:0">▲ ${esc(name)}</div>`);
      tw(`tl.fromTo("#${sid}-tag${k}", {opacity:0, x:-30}, {opacity:1, x:0, duration:0.18}, ${r2(at + 0.06)});`);
      tw(`tl.to("#${sid}-tag${k}", {opacity:0, duration:0.08}, ${r2(at + CUT - 0.05)});`);
    }
  });
  parts.push(`<div id="${sid}-flash" class="flash"></div>`);
  return { html: parts.join(""), settle: r2(a + 0.15 + (g.length - 1) * CUT) };
};

// ---- chalkboard menu (food intro) -----------------------------------------
const chalkIntro = (s, sid) => {
  const a = s.start;
  const items = (s.names ?? []).map((n, k) => `<li id="${sid}-li${k}"><img src="${asset(s.gallery[k])}" alt="" /><span>${k + 1}. ${esc(n)}</span></li>`).join("");
  (s.names ?? []).forEach((_, k) => {
    tw(`tl.fromTo("#${sid}-li${k} span", {clipPath:"inset(0 100% 0 0)"}, {clipPath:"inset(0 0% 0 0)", duration:0.45, ease:"power1.inOut"}, ${r2(a + 1.3 + k * 0.42)});`);
    tw(`tl.fromTo("#${sid}-li${k} img", {opacity:0, scale:0.5}, {opacity:1, scale:1, duration:0.3, ease:"back.out(2)"}, ${r2(a + 1.25 + k * 0.42)});`);
  });
  return `<div class="board"><div class="board-in"><div id="${sid}-kicker" class="chalk-k">${esc(s.kicker)}</div><h1 id="${sid}-title" class="chalk-t">${words(s.caption)}</h1><ul class="menu-list">${items}</ul><div id="${sid}-pill" class="pill chalk-pill">${esc(s.label ?? "")}</div></div></div>`;
};

// ---- scenes -------------------------------------------------------------
for (const s of scenes) {
  const sid = `s-${s.id}`;
  const a = s.start;
  const enter = a + LEAD;
  const accent = s.accent ?? video.theme.accent;
  const parts = [];

  if (s.layout === "hook" && !isFood) {
    // The montage cuts through the photos; the title settles over the last one.
    const m = flashIntro(s, sid);
    parts.push(m.html);
    parts.push(`<div id="${sid}-dim" class="hook-dim" style="opacity:0"></div>`);
    parts.push(`<div id="${sid}-kicker" class="hook-kicker">${esc(s.kicker)}</div>`);
    parts.push(`<h1 id="${sid}-title" class="hook-title" style="opacity:0">${words(s.caption)}</h1>`);
    parts.push(`<div id="${sid}-pill" class="pill" style="background:${accent};top:1370px">${esc(s.label ?? "")}</div>`);
    tw(`tl.to("#${sid}-dim", {opacity:1, duration:0.6}, ${m.settle});`);
    tw(`tl.fromTo("#${sid}-title", {scale:1.25, opacity:0}, {scale:1, opacity:1, duration:0.9, ease:"expo.out", immediateRender:false}, ${m.settle});`);
    fadeUp(`#${sid}-kicker`, m.settle + 0.3);
    fadeUp(`#${sid}-pill`, m.settle + 0.6);
  } else if (s.layout === "hook") {
    // Food intro: a chalkboard menu writes out the five dishes.
    parts.push(chalkIntro(s, sid));
    tw(`tl.fromTo("#${sid}-title", {scale:1.12}, {scale:1, duration:1.2, ease:"expo.out"}, ${a});`);
    fadeUp(`#${sid}-kicker`, a + 0.2);
    fadeUp(`#${sid}-pill`, a + 3.6);
  } else if (s.layout === "point") {
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div class="floor"></div>`);
    const num = isFood ? `${s.story.number}/${s.story.total}` : `${vi ? "NGÀY" : "DAY"} ${(s.label.match(/\d+/) ?? ["1"])[0]}`;
    const small = isFood ? (vi ? "MÓN" : "DISH") : s.label.split("·")[1]?.trim().toUpperCase() ?? "";
    parts.push(sign(sid, num, small, enter + 0.7));
    parts.push(`<div class="head">`);
    parts.push(`<div id="${sid}-kicker" class="kicker" style="color:${accent}">${esc(isFood ? `${vi ? "MÓN" : "DISH"} ${s.label}` : s.label.toUpperCase())}</div>`);
    parts.push(`<h1 id="${sid}-title" class="title"${s.caption.length > 15 ? ' style="font-size:84px"' : ""}>${words(s.caption)}</h1>`);
    fadeUp(`#${sid}-kicker`, enter, 0.25);
    titleIn(`#${sid}-title`, enter + 0.2);
    if (!isFood) {
      (s.points ?? []).forEach((p, k) => {
        parts.push(`<div id="${sid}-pt${k}" class="point"><i style="background:${accent}"></i>${esc(p)}</div>`);
        fadeUp(`#${sid}-pt${k}`, enter + 1.0 + k * 0.45);
      });
      parts.push(`</div>`);
      const cue = Math.max(cueTime(s, s.dishes?.[0]?.spokenAs) ?? a + (s.end - a) * 0.55, enter + CLEAR);
      parts.push(`<div id="${sid}-food" class="card"><div class="card-h" style="color:${accent}">${esc(vi ? "ĂN GẦN ĐÂY" : "EAT NEARBY")} · ${esc(s.dishes?.[0]?.name ?? "")}</div>${(s.dishes ?? []).map((d) => row(d, accent)).join("")}</div>`);
      tw(`tl.fromTo("#${sid}-food", {opacity:0, y:60, filter:"blur(10px)"}, {opacity:1, y:0, filter:"blur(0px)", duration:0.5, ease:"expo.out"}, ${r2(cue - 0.1)});`);
      tw(`tl.fromTo("#${sid}-food .row", {opacity:0, x:-40}, {opacity:1, x:0, duration:0.3, stagger:0.09, ease:"power3.out"}, ${r2(cue + 0.15)});`);
      parts.push(proofs(sid, `#${sid}-food .row`, s.dishes ?? [], cue, s.end));
    } else {
      parts.push(`<p id="${sid}-tag" class="point">${esc(s.story.tagline)}</p>`);
      parts.push(`</div>`);
      fadeUp(`#${sid}-tag`, enter + 0.9);
      parts.push(cardSeq(sid, s, s.story.sections.map((sec) => ({
        title: sec.title, cue: sec.cue, rows: Boolean(sec.places), places: sec.places,
        body: sec.places ? sec.places.map((p) => row(p, accent)).join("") : `<p class="card-t">${esc(sec.text)}</p>`,
      })), enter, accent));
    }
    // Stop rail under the subtitle band.
    const idx = stops.findIndex((x) => x.id === s.id);
    const dots = stops.map((x, k) => `<i class="${k < idx ? "done" : ""}"${k === idx ? ` style="background:${accent};box-shadow:0 0 18px ${accent}"` : ""}></i>`).join("");
    parts.push(`<div id="${sid}-rail" class="rail">${dots}</div>`);
    fadeUp(`#${sid}-rail`, enter + 0.4);
  } else if (s.layout === "stay") {
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div><div class="top"></div><div class="floor"></div>`);
    parts.push(sign(sid, vi ? "Ở ĐÂU" : "STAY", vi ? "LƯU TRÚ" : "SLEEP", enter + 0.6));
    parts.push(`<div class="head"><div id="${sid}-kicker" class="kicker" style="color:${accent}">${esc(vi ? "TRƯỚC KHI ĐẶT PHÒNG" : "BEFORE YOU BOOK")}</div><h1 id="${sid}-title" class="title">${words(s.caption)}</h1></div>`);
    fadeUp(`#${sid}-kicker`, enter, 0.25);
    titleIn(`#${sid}-title`, enter + 0.2);
    const cards = s.zones.map((z, k) => ({
      title: `${k + 1} · ${z.title}`, cue: s.cues[k], rows: true,
      body: `<p class="card-n">${esc(z.note)}</p>` + z.picks.map(([n, r, ad]) => row({ place: n, address: ad, rating: r }, accent)).join(""),
    }));
    cards.push({ title: vi ? "Mẹo" : "Tip", cue: s.cues.at(-1), body: `<p class="card-t">${esc(s.tip)}</p>` });
    parts.push(cardSeq(sid, s, cards, enter, accent));
  } else if (!isFood) {
    // Travel outro: a route summary map; pins drop in day order along a dashed trail.
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="hook-dim"></div>`);
    const tr = s.trail ?? [];
    // A winding road: pins evenly spaced in day order, swinging left and right; labels sit on
    // the outer side of each bend so they never collide.
    const n = tr.length;
    const xy = tr.map((_, k) => [k % 2 ? 570 : 430, 150 + (k * 600) / Math.max(1, n - 1)]);
    let d = `M${xy[0][0]} ${xy[0][1]}`;
    for (let k = 1; k < n; k++) {
      const [x0, y0] = xy[k - 1], [x1, y1] = xy[k], my = (y0 + y1) / 2;
      d += ` C${x0} ${my} ${x1} ${my} ${x1} ${y1}`;
    }
    const pins = xy.map(([x, y], k) => {
      const right = k % 2 === 1;
      return `<g id="${sid}-pin${k}" style="opacity:0"><circle cx="${x}" cy="${y.toFixed(0)}" r="24" fill="${video.theme.accent}" stroke="#fff" stroke-width="6"/><text x="${x}" y="${(y + 9).toFixed(0)}" text-anchor="middle" class="pin-n">${k + 1}</text><text x="${x + (right ? 44 : -44)}" y="${(y - 2).toFixed(0)}" text-anchor="${right ? "start" : "end"}" class="pin-t">${esc(tr[k].name)}</text><text x="${x + (right ? 44 : -44)}" y="${(y + 30).toFixed(0)}" text-anchor="${right ? "start" : "end"}" class="pin-s">${esc(tr[k].label)}</text></g>`;
    }).join("");
    parts.push(`<div id="${sid}-map" class="trail" style="opacity:0"><h2>${esc(s.caption)}</h2><svg viewBox="0 0 1000 860" width="900" height="774"><path id="${sid}-path" d="${d}" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="6" stroke-dasharray="14 12" stroke-linecap="round"/>${pins}</svg></div>`);
    tw(`tl.fromTo("#${sid}-map", {opacity:0, y:80}, {opacity:1, y:0, duration:0.6, ease:"expo.out"}, ${r2(enter)});`);
    const step = Math.min(0.55, (s.end - enter - 3.2) / Math.max(1, tr.length));
    tw(`tl.fromTo("#${sid}-path", {opacity:0}, {opacity:1, duration:${r2(step * tr.length)}, ease:"none"}, ${r2(enter + 0.6)});`);
    tr.forEach((_, k) => {
      tw(`tl.fromTo("#${sid}-pin${k}", {opacity:0, y:-40}, {opacity:1, y:0, duration:0.35, ease:"back.out(2)"}, ${r2(enter + 0.6 + k * step)});`);
      if (k % 2 === 0) sound("pop", r2(enter + 0.65 + k * step), 0.08);
    });
    parts.push(`<div id="${sid}-cta" class="pill" style="background:${video.theme.accent};top:1330px;opacity:0">${esc(s.cta ?? "")}</div>`);
    fadeUp(`#${sid}-cta`, enter + 0.9 + tr.length * step);
  } else {
    // Food outro: a film strip of the five dishes slides across under the question.
    parts.push(`<div class="board"></div>`);
    const frames = s.gallery.map((src, k) => `<div class="fr"><img src="${asset(src)}" alt="" /><span>${k + 1}. ${esc(s.names?.[k] ?? "")}</span></div>`).join("");
    parts.push(`<div id="${sid}-strip" class="strip"><div class="holes"></div>${frames}${frames}<div class="holes b"></div></div>`);
    tw(`tl.fromTo("#${sid}-strip", {x:0}, {x:-${s.gallery.length * 470}, duration:${r2(s.end - a)}, ease:"none"}, ${r2(a)});`);
    parts.push(`<h1 id="${sid}-title" class="chalk-t outro">${words(s.caption)}</h1>`);
    titleIn(`#${sid}-title`, enter + 0.2);
    parts.push(`<div id="${sid}-cta" class="pill" style="background:${video.theme.accent};top:1360px">${esc(s.cta ?? "")}</div>`);
    fadeUp(`#${sid}-cta`, enter + 1.6);
  }

  html.push(`<section id="${sid}" class="scene clip" data-start="0" data-duration="${total}"${s.i === 0 ? "" : ' style="opacity:0"'}>${parts.join("")}</section>`);
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
    if (line.length && (len > (vi ? 30 : 32) || /[.,!?]$/.test(line.at(-1).text.trim()))) flush(w.startMs);
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
const SHADERS = isFood
  ? ["ridged-burn", "chromatic-radial-split", "swirl-vortex", "whip-pan", "domain-warp-dissolve", "ridged-burn"]
  : ["whip-pan", "swirl-vortex", "ridged-burn", "domain-warp-dissolve", "chromatic-radial-split", "whip-pan", "swirl-vortex", "ridged-burn", "domain-warp-dissolve", "chromatic-radial-split"];
const transitions = scenes.slice(1).map((s, k) => ({ time: r2(s.start - SEAM / 2), shader: SHADERS[k % SHADERS.length], duration: SEAM }));
for (const tr of transitions) sound("whoosh-short", r2(tr.time - 0.1), 0.15);

// ---- golden sun motes drifting up over everything ---------------------------
const MOTES = [[90, 11, 0.0, 14], [250, 14, 2.4, 9], [420, 12, 4.1, 12], [600, 15, 1.3, 8], [780, 12.5, 3.6, 13], [950, 10.5, 5.2, 10], [170, 16, 6.9, 7], [700, 13.5, 8.1, 11], [870, 11.5, 9.3, 9], [340, 14.5, 10.6, 12]];
const petals = MOTES.map(([x, dur, delay, size], k) => {
  const reps = Math.ceil((total - delay) / dur);
  tw(`tl.fromTo("#mote${k}", {y:${H + 60}, x:0}, {y:-80, x:${k % 2 ? 90 : -90}, duration:${dur}, ease:"none", repeat:${Math.max(0, reps - 1)}}, ${delay});`);
  return `<i id="mote${k}" class="mote" style="left:${x}px;width:${size}px;height:${size}px" data-layout-ignore></i>`;
});

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
:root { --ground:#0c1717; --ink:#f7fbfa; --cream:#eef7f5; --tea:#4fd1c5; --teadark:#17635c; --plum:#ffd27a; --amber:#ffd27a; --soil:#0f2b29; }
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:${W}px; height:${H}px; overflow:hidden; background:var(--ground); }
#root { position:relative; width:${W}px; height:${H}px; overflow:hidden; font-family:"Montserrat"; }
.scene { position:absolute; inset:0; overflow:hidden; background:var(--ground); z-index:1; }
.ph { position:absolute; inset:0; overflow:hidden; }
.ph img { width:100%; height:100%; object-fit:cover; }
.reveal { position:absolute; inset:0; }
.shade { position:absolute; inset:0; background:radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(8,12,6,0.5) 100%); }
.top { position:absolute; left:0; right:0; top:0; height:760px; background:linear-gradient(180deg, rgba(8,18,18,0.9) 0%, rgba(8,18,18,0.6) 55%, rgba(8,18,18,0) 100%); }
.floor { position:absolute; left:0; right:0; bottom:0; height:900px; background:linear-gradient(180deg, rgba(8,18,18,0) 0%, rgba(8,18,18,0.6) 45%, rgba(8,18,18,0.92) 100%); }
.hook-dim { position:absolute; inset:0; z-index:4; background:linear-gradient(180deg, rgba(8,18,18,0.8) 0%, rgba(8,18,18,0.62) 55%, rgba(8,18,18,0.9) 100%); }
.mote { position:absolute; top:0; z-index:16; border-radius:50%; background:radial-gradient(circle, rgba(255,236,170,0.95) 0%, rgba(255,210,122,0.5) 45%, rgba(255,210,122,0) 72%); opacity:0.8; pointer-events:none; }
.flash { position:absolute; inset:0; background:#fff; opacity:0; z-index:8; pointer-events:none; }
.m-tag { position:absolute; left:60px; top:1480px; z-index:9; font:800 40px "Montserrat"; color:#fff; letter-spacing:0.04em; text-shadow:0 3px 18px rgba(0,0,0,0.8); }
.hook-kicker { position:absolute; left:0; right:0; top:1090px; text-align:center; font:700 32px "Montserrat"; letter-spacing:0.3em; color:var(--tea); z-index:5; }
.hook-title { position:absolute; left:0; right:0; top:1150px; text-align:center; font:900 180px/1 "Playfair Display"; color:var(--ink); text-shadow:0 10px 60px rgba(0,0,0,0.6); z-index:5; }
.hook-title .w, .title .w { display:inline-block; }
.hook-title.food { top:720px; line-height:1.05; color:var(--soil); text-shadow:none; }
.hook-title.outro { top:330px; font-size:110px; line-height:1.08; padding:0 70px; }
.hook-title.outro.mosaic { top:110px; font-size:92px; color:var(--soil); text-shadow:none; }
.pill { position:absolute; left:50%; transform:translateX(-50%); font:900 48px "Montserrat"; color:var(--soil); padding:12px 40px; border-radius:999px; white-space:nowrap; z-index:6; }
/* Roadside kilometre post (stop marker). */
.sign { position:absolute; right:56px; top:120px; width:250px; height:300px; z-index:6; overflow:hidden; }
.mile { position:absolute; left:20px; right:20px; bottom:14px; height:270px; background:#fbfbf7; border-radius:86px 86px 10px 10px; box-shadow:0 14px 30px rgba(0,0,0,0.5); text-align:center; overflow:hidden; }
.mile-cap { height:96px; background:#d93a2b; color:#fff; font:800 19px/1.2 "Montserrat"; letter-spacing:0.14em; padding-top:40px; }
.mile b { display:block; margin-top:22px; font:900 40px/1 "Montserrat"; color:#1d2b2a; white-space:nowrap; }
.mile small { display:block; margin-top:10px; font:800 22px "Montserrat"; letter-spacing:0.14em; color:#d93a2b; white-space:nowrap; }
.ground { position:absolute; left:0; right:0; bottom:0; height:16px; border-radius:8px; background:rgba(0,0,0,0.45); }
.head { position:absolute; left:80px; top:215px; width:640px; display:flex; flex-direction:column; gap:10px; z-index:5; }
.kicker { font:700 32px "Montserrat"; letter-spacing:0.28em; }
.title { margin-bottom:10px; font:800 104px/1.04 "Playfair Display"; color:var(--ink); text-shadow:0 6px 30px rgba(0,0,0,0.55); }
.point { font:600 37px/1.3 "Montserrat"; color:rgba(251,248,239,0.93); text-shadow:0 2px 14px rgba(0,0,0,0.7); }
.point i { display:inline-block; width:14px; height:14px; border-radius:50%; margin-right:18px; vertical-align:middle; }
/* Milk-cream paper cards with a tea-green rule, in the lower third. */
.card { position:absolute; left:60px; width:960px; top:1110px; padding:24px 34px 16px; border-radius:20px; background:rgba(238,247,245,0.96); border-top:10px solid var(--tea); box-shadow:0 18px 40px rgba(0,0,0,0.45); z-index:7; }
.card-h { font:800 28px "Montserrat"; letter-spacing:0.2em; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; color:var(--teadark) !important; }
.card-t { font:600 40px/1.3 "Montserrat"; color:var(--soil); }
.card-n { font:600 32px/1.3 "Montserrat"; color:rgba(36,51,31,0.72); margin-bottom:6px; }
.dots i { display:inline-block; width:12px; height:12px; border-radius:50%; margin-left:10px; background:rgba(36,51,31,0.2); }
.dots i.on { background:var(--teadark); }
.row { display:flex; align-items:baseline; gap:16px; padding:8px 0; border-top:1px solid rgba(36,51,31,0.14); }
.row b { font:800 36px "Montserrat"; color:var(--soil); white-space:nowrap; }
.row span { font:500 28px "Montserrat"; color:rgba(36,51,31,0.6); flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.row em { font:800 27px "Montserrat"; font-style:normal; color:var(--soil); padding:4px 14px; border-radius:999px; white-space:nowrap; box-shadow:inset 0 0 0 2px rgba(36,51,31,0.25); }
/* Google Maps screenshot chip above the restaurant card. */
.gmaps { position:absolute; left:400px; width:620px; bottom:830px; border-radius:22px; overflow:hidden; background:#fff; box-shadow:0 16px 40px rgba(0,0,0,0.5); z-index:8; }
.gmaps-h { display:flex; align-items:center; gap:10px; padding:12px 22px; background:#f1f3f4; font:700 24px "Montserrat"; color:#3c4043; }
.gmaps-h i { font-style:normal; }
.gmaps-h span { margin-left:auto; font:500 20px "Montserrat"; color:#70757a; }
.gmaps img { display:block; width:100%; border-top:1px solid #e8eaed; }
.row { border-radius:10px; }
.rail { position:absolute; left:0; right:0; top:1690px; z-index:20; display:flex; justify-content:center; gap:26px; }
.rail i { width:18px; height:18px; border-radius:50%; background:rgba(255,255,255,0.22); }
.rail i.done { background:rgba(255,255,255,0.6); }
/* Route summary map (travel outro). */
.trail { position:absolute; left:40px; right:40px; top:150px; padding:36px 50px 20px; border-radius:28px; background:rgba(12,23,23,0.78); border:2px solid rgba(79,209,197,0.5); box-shadow:0 30px 60px rgba(0,0,0,0.5); z-index:5; }
.trail h2 { font:900 72px/1.1 "Playfair Display"; color:var(--ink); }
.pin-n { font:900 24px "Montserrat"; fill:#0c1717; }
.pin-t { font:800 34px "Montserrat"; fill:#fff; paint-order:stroke; stroke:rgba(0,0,0,0.6); stroke-width:6px; }
.pin-s { font:700 22px "Montserrat"; fill:#ffd27a; letter-spacing:0.08em; paint-order:stroke; stroke:rgba(0,0,0,0.6); stroke-width:5px; }
/* Food intro: chalkboard menu; food outro: film strip on the board. */
.board { position:absolute; inset:0; background:radial-gradient(ellipse at 50% 40%, #2c4a3e 0%, #1c3229 70%, #13241d 100%); }
.board::after { content:""; position:absolute; inset:24px; border:22px solid #7a5530; border-radius:12px; box-shadow:inset 0 0 40px rgba(0,0,0,0.6), 0 0 0 4px #5a3d21; }
.board-in { position:absolute; inset:90px 90px; z-index:2; }
.chalk-k { margin-top:150px; text-align:center; font:700 30px "Montserrat"; letter-spacing:0.3em; color:rgba(255,255,255,0.7); }
.chalk-t { margin-top:20px; text-align:center; font:900 112px/1.05 "Playfair Display"; color:#f4f1e6; text-shadow:0 0 2px rgba(255,255,255,0.6); }
.chalk-t .w { display:inline-block; }
.chalk-t.outro { position:absolute; left:0; right:0; top:180px; z-index:3; padding:0 80px; }
.menu-list { list-style:none; margin-top:70px; display:flex; flex-direction:column; gap:30px; }
.menu-list li { display:flex; align-items:center; gap:30px; }
.menu-list img { width:120px; height:120px; border-radius:50%; object-fit:cover; border:5px solid rgba(244,241,230,0.85); }
.menu-list span { font:700 52px "Montserrat"; color:#f4f1e6; white-space:nowrap; border-bottom:3px dashed rgba(244,241,230,0.35); padding-bottom:6px; }
.chalk-pill { top:1500px; background:var(--plum); }
.strip { position:absolute; left:0; top:640px; height:600px; display:flex; gap:30px; padding:70px 40px; background:#111; z-index:2; box-shadow:0 30px 60px rgba(0,0,0,0.6); }
.holes { position:absolute; left:0; right:0; top:18px; height:34px; background:repeating-linear-gradient(90deg, transparent 0 22px, #e8e2d0 22px 52px, transparent 52px 74px); opacity:0.85; }
.holes.b { top:auto; bottom:18px; }
.fr { position:relative; width:440px; height:460px; flex:none; border-radius:10px; overflow:hidden; }
.fr img { width:100%; height:100%; object-fit:cover; }
.fr span { position:absolute; left:14px; bottom:14px; padding:8px 16px; border-radius:999px; background:rgba(238,247,245,0.95); color:var(--soil); font:800 30px "Montserrat"; white-space:nowrap; }
.brand { position:absolute; left:60px; top:60px; z-index:21; font:800 26px "Montserrat"; letter-spacing:0.3em; color:rgba(251,248,239,0.8); text-shadow:0 2px 10px rgba(0,0,0,0.5); }
.brand b { color:var(--plum); letter-spacing:0; margin-right:12px; }
.cap { position:absolute; left:60px; right:60px; top:1500px; text-align:center; font:800 50px/1.25 "Montserrat"; color:#ffffff; text-shadow:0 3px 0 rgba(0,0,0,0.55), 0 0 22px rgba(0,0,0,0.85); z-index:20;${cover ? " display:none;" : ""} }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="${W}" data-height="${H}">
${media.join("\n")}
${sfx.join("\n")}
${html.join("\n")}
${petals.join("\n")}
<div class="brand" data-layout-ignore><b>▲</b>${esc(brand)}</div>
${caps.join("\n")}
</div>
<script>
const tl = gsap.timeline({ paused: true });
${js.join("\n")}
HyperShader.init({
  bgColor: "#0c1717",
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
