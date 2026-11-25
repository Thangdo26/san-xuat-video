#!/usr/bin/env node
/**
 * node hf/build-cine.mjs --slug hue-am-thuc
 *
 * A second, cinematic cut of a food video, built from the same video.json and
 * voice-over into build/<slug>-cine/. The look ("Huế ẩm thực · phim tài liệu"):
 *   - hook: cold-open montage with white-flash cuts behind a chromatic-split title slam;
 *   - each dish is a chapter: it opens as a 2.39:1 widescreen shot with the chapter
 *     number above and the dish name below, then the black bars slide open to full frame;
 *   - photos swap by whip pans (motion blur + whoosh) under slow camera moves, warm grade;
 *   - steam rises over the hot dishes; film grain and thin letterbox bars throughout;
 *   - story beats are documentary lower thirds (a gold rule draws, the text wipes in);
 *   - places are map-pin tags whose ★ rating rolls like an odometer;
 *   - a film strip of the five dishes under the subtitles shows where we are;
 *   - outro: the "menu" of all five dishes ticked off in red ink, then the bars close.
 * Seams are WebGL shaders: cinematic zoom, whip pan, heat haze, chromatic split, iris.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fail, parseArgs, requireSlug } from "../scripts/lib/args.mjs";
import { probeDurationSec } from "../scripts/lib/media.mjs";
import { PROJECT_ROOT, PUBLIC_ROOT } from "../scripts/lib/paths.mjs";

const { flags } = parseArgs(process.argv.slice(2));
const slug = requireSlug(flags, "build-cine");
const dataDir = path.join(PROJECT_ROOT, "data", "videos", slug);
const video = JSON.parse(readFileSync(path.join(dataDir, "video.json"), "utf8"));
const voicePath = path.join(dataDir, "voiceover.json");
if (!existsSync(voicePath)) fail(`No voiceover.json for ${slug}; make the voice first.`);
const voice = JSON.parse(readFileSync(voicePath, "utf8")).clips;

const W = 1080;
const H = 1920;
const LEAD = video.transitionFrames / video.format.fps;
const SEAM = 0.8;
const OPEN = 2.1; // seconds into a dish scene when the widescreen bars slide open
const CLEAR = 4.2; // seconds into a dish scene before the first lower third
const STRIP = 452; // 2.39:1 strip height at 1080 wide
const vi = video.language === "vi";
const T = vi
  ? { chapter: "CHƯƠNG", menu: "THỰC ĐƠN XỨ HUẾ", slate: "HUẾ · ẨM THỰC", dishes: "MÓN", where: "QUÁN NGON" }
  : { chapter: "CHAPTER", menu: "THE HUE MENU", slate: "HUE · FOOD", dishes: "DISHES", where: "WHERE TO EAT" };
const HOT = new Set(["bunbo", "comhen", "banhbeo"]);

const out = path.join(PROJECT_ROOT, "build", `${slug}-cine`);
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
const r2 = (n) => Math.round(n * 1000) / 1000;
const norm = (s) => s.toLowerCase().normalize("NFC").replace(/[.,!?;:…"“”()]/g, "").trim();
const pad = (n) => String(n).padStart(2, "0");

// ---- timing -------------------------------------------------------------
let t = 0;
const scenes = video.scenes.map((s, i) => {
  const start = t;
  t += s.durationSec;
  return { ...s, i, start, end: t, clip: voice[s.id] };
});
const total = r2(t);
const dishes = scenes.filter((s) => s.story);

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
/** Places a one-shot sound effect from public/shared/sfx. */
const sound = (name, at, volume = 0.5) => {
  const file = path.join(PUBLIC_ROOT, "shared", "sfx", `${name}.mp3`);
  const dur = r2(Math.min(probeDurationSec(file), total - at));
  if (at < 0 || dur <= 0.05) return;
  // First track (from 4) that is free at `at`, so no two effects share a track.
  let track = sfxTracks.findIndex((end) => end <= at);
  if (track < 0) track = sfxTracks.push(0) - 1;
  sfxTracks[track] = at + dur;
  sfx.push(`<audio id="sfx-${sfx.length}" src="${asset(`shared/sfx/${name}.mp3`)}" data-start="${r2(at)}" data-duration="${dur}" data-volume="${volume}" data-track-index="${4 + track}"></audio>`);
};

// ---- building blocks ----------------------------------------------------
const MOVES = [
  ["scale:1.22,x:0,y:40", "scale:1.06,x:0,y:0"], // slow pull out
  ["scale:1.08,x:0,y:0", "scale:1.24,x:-30,y:-50"], // push in on the bowl
  ["scale:1.16,x:60,y:0", "scale:1.16,x:-60,y:0"], // track left
  ["scale:1.1,x:-20,y:-40", "scale:1.22,x:20,y:30"], // drift down
];

/** Photo stack swapped by whip pans; the first photo is already on screen at `from`. */
const photos = (s, from, to, idPrefix, { whips = true } = {}) => {
  const g = s.gallery ?? [];
  const seg = (to - from) / g.length;
  return g
    .map((src, k) => {
      const id = `${idPrefix}-p${k}`;
      const a = r2(from + seg * k);
      const [f, e] = MOVES[(s.i + k) % MOVES.length];
      tw(`tl.fromTo("#${id} img", {${f}}, {${e}, duration:${r2(seg + 0.5)}, ease:"none"}, ${a});`);
      if (k > 0) {
        const dir = k % 2 ? 1 : -1;
        if (whips) {
          tw(`tl.fromTo("#${id}", {xPercent:${100 * dir}, opacity:1, filter:"blur(18px)"}, {xPercent:0, opacity:1, filter:"blur(0px)", duration:0.34, ease:"power3.inOut"}, ${r2(a - 0.17)});`);
          tw(`tl.to("#${idPrefix}-p${k - 1}", {xPercent:${-60 * dir}, filter:"blur(18px)", duration:0.34, ease:"power3.inOut"}, ${r2(a - 0.17)});`);
          sound("whoosh-short", a - 0.2, 0.14);
        } else {
          tw(`tl.set("#${id}", {opacity:1}, ${a});`);
        }
      }
      return `<div id="${id}" class="ph"${k > 0 ? ' style="opacity:0"' : ""}><img src="${asset(src)}" alt="" /></div>`;
    })
    .join("");
};

/** Three soft plumes of steam rising from the middle of the frame, looping for `dur` seconds. */
const steam = (sid, at, dur) => {
  const plumes = [0, 1, 2].map((k) => `<i id="${sid}-st${k}" style="left:${330 + k * 150}px"></i>`).join("");
  const cycle = 3.2;
  const reps = Math.max(0, Math.floor(dur / cycle) - 1);
  [0, 1, 2].forEach((k) => {
    tw(`tl.fromTo("#${sid}-st${k}", {y:0, opacity:0, scaleX:0.7}, {keyframes:[{opacity:0.5, duration:${cycle * 0.35}}, {opacity:0, duration:${cycle * 0.65}}], y:-520, scaleX:1.5, duration:${cycle}, ease:"sine.out", repeat:${reps}}, ${r2(at + k * 1.05)});`);
  });
  return `<div class="steam">${plumes}</div>`;
};

/** Odometer: a column of digits that rolls to `digit`; `spins` extra turns. */
const reel = (id, digit, at, spins) => {
  const n = 10 * (spins + 1);
  const col = Array.from({ length: n }, (_, k) => k % 10).join("<br>");
  tw(`tl.fromTo("#${id}", {yPercent:0}, {yPercent:${r2((-100 * (10 * spins + digit)) / n)}, duration:${0.9 + spins * 0.25}, ease:"power3.out"}, ${r2(at)});`);
  return `<span class="odo"><span id="${id}" class="reel">${col}</span></span>`;
};

const PIN = `<svg viewBox="0 0 24 32" width="30" height="40"><path d="M12 0C5.4 0 0 5.2 0 11.7 0 20.4 12 32 12 32s12-11.6 12-20.3C24 5.2 18.6 0 12 0z" fill="currentColor"/><circle cx="12" cy="11.5" r="4.6" fill="#120b10"/></svg>`;

/** Film strip of every dish; the current one is lit. */
const filmstrip = (sid, idx, at) => {
  const frames = dishes
    .map((d, k) => `<i class="${k === idx ? "now" : k < idx ? "done" : ""}" style="background-image:url(${asset(d.gallery[0])})${k === idx ? `;border-color:${d.accent}` : ""}"></i>`)
    .join("");
  tw(`tl.fromTo("#${sid}-strip", {opacity:0, y:20}, {opacity:1, y:0, duration:0.4, ease:"expo.out"}, ${r2(at)});`);
  return `<div id="${sid}-strip" class="strip" style="opacity:0">${frames}</div>`;
};

// ---- scenes -------------------------------------------------------------
for (const s of scenes) {
  const sid = `s-${s.id}`;
  const a = s.start;
  const accent = s.accent ?? video.theme.accent;
  const parts = [];

  if (s.layout === "hook") {
    // Cold open: every dish's best photo cut on a white flash, behind a title that slams in.
    const montage = dishes.flatMap((d) => d.gallery.slice(0, 2));
    const slam = cueTime(s, vi ? "ăn gì" : "eat") ?? a + 1.2;
    const cutEvery = Math.min(0.62, (s.end - a - 0.4) / montage.length);
    montage.forEach((src, k) => {
      const at = r2(a + k * cutEvery);
      const [f, e] = MOVES[k % MOVES.length];
      parts.push(`<div id="${sid}-m${k}" class="ph grade"${k ? ' style="opacity:0"' : ""}><img src="${asset(src)}" alt="" /></div>`);
      tw(`tl.fromTo("#${sid}-m${k} img", {${f}}, {${e}, duration:${r2(cutEvery + 0.8)}, ease:"none"}, ${at});`);
      if (k) {
        tw(`tl.set("#${sid}-m${k}", {opacity:1}, ${at});`);
        tw(`tl.set("#${sid}-m${k - 1}", {opacity:0}, ${r2(at + 0.04)});`);
        tw(`tl.fromTo("#${sid}-flash", {opacity:0.75}, {opacity:0, duration:0.16, ease:"power2.out", immediateRender:false}, ${at});`);
        // A small chromatic re-glitch of the title on each cut (not during the slam itself).
        if (Math.abs(at - slam) > 0.6) tw(`tl.fromTo("#${sid}-title .r", {x:-7}, {x:0, duration:0.12, immediateRender:false}, ${at});`);
        if (Math.abs(at - slam) > 0.6) tw(`tl.fromTo("#${sid}-title .c", {x:7}, {x:0, duration:0.12, immediateRender:false}, ${at});`);
      }
    });
    // The last montage frame stays up until the seam.
    parts.push(`<div class="hook-shade"></div><div id="${sid}-flash" class="flash" style="opacity:0"></div>`);
    const [l1, ...rest] = s.caption.split(" ");
    const titleHtml = `${esc(l1)}<br>${esc(rest.join(" "))}${vi ? "?" : ""}`;
    parts.push(`<div id="${sid}-kick" class="hook-kick">${esc(s.kicker ?? (vi ? "ẨM THỰC · TIKTOK KHEN" : "FOOD · TIKTOK FAVOURITES"))}</div>`);
    parts.push(`<h1 id="${sid}-title" class="slam"><span class="r">${titleHtml}</span><span class="c">${titleHtml}</span><span class="w">${titleHtml}</span></h1>`);
    parts.push(`<div id="${sid}-count" class="count" style="opacity:0"><b>${esc(String(dishes.length))}</b><span>${esc(T.dishes)}</span></div>`);
    // Frame 0 already shows the title (thumbnail); it settles, then slams again on "ăn gì".
    tw(`tl.fromTo("#${sid}-title", {scale:1.25}, {scale:1, duration:0.5, ease:"expo.out"}, ${r2(slam - 0.1)});`);
    tw(`tl.fromTo("#${sid}-title .r", {x:-26, y:6}, {x:0, y:0, duration:0.5, ease:"expo.out", immediateRender:false}, ${r2(slam - 0.1)});`);
    tw(`tl.fromTo("#${sid}-title .c", {x:26, y:-6}, {x:0, y:0, duration:0.5, ease:"expo.out", immediateRender:false}, ${r2(slam - 0.1)});`);
    tw(`tl.fromTo("#${sid}", {x:-16}, {x:0, duration:0.45, ease:"elastic.out(1.2,0.3)"}, ${r2(slam)});`);
    sound("impact-bass-1", slam - 0.08, 0.6);
    tw(`tl.fromTo("#${sid}-kick", {opacity:0, scaleX:1.6}, {opacity:1, scaleX:1, duration:0.9, ease:"expo.out"}, ${r2(a + 0.2)});`);
    const five = cueTime(s, vi ? "năm món" : "five") ?? a + 2.6;
    tw(`tl.fromTo("#${sid}-count", {opacity:0, scale:2.2, rotation:-12}, {opacity:1, scale:1, rotation:-6, duration:0.45, ease:"back.out(2)"}, ${r2(five)});`);
    sound("impact-bass-2", five - 0.35, 0.45);
  } else if (s.story) {
    const enter = a + LEAD;
    const idx = dishes.indexOf(s);
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="shade"></div>`);
    if (HOT.has(s.id)) parts.push(steam(sid, a + 0.6, s.end - a - 0.6));
    // Chapter opening: widescreen strip with black bars carrying the chapter number and name.
    const bar = (H - STRIP) / 2;
    parts.push(`<div id="${sid}-bt" class="wbar top" style="height:${bar}px"><div class="chap"><span>${T.chapter}</span><b style="color:${accent}">${pad(s.story.number)}</b><span>/ ${pad(s.story.total)}</span></div></div>`);
    parts.push(`<div id="${sid}-bb" class="wbar bot" style="height:${bar}px"><h2 class="dname" style="font-size:${Math.min(104, Math.floor(1750 / s.caption.length))}px">${esc(s.caption)}</h2><p class="dtag">${esc(s.story.tagline)}</p></div>`);
    tw(`tl.fromTo("#${sid}-bt .chap", {opacity:0, y:30}, {opacity:1, y:0, duration:0.6, ease:"expo.out"}, ${r2(a + 0.25)});`);
    tw(`tl.fromTo("#${sid}-bb .dname", {opacity:0, y:-24, filter:"blur(10px)"}, {opacity:1, y:0, filter:"blur(0px)", duration:0.7, ease:"expo.out"}, ${r2(a + 0.45)});`);
    tw(`tl.fromTo("#${sid}-bb .dtag", {opacity:0}, {opacity:1, duration:0.5}, ${r2(a + 0.9)});`);
    sound("impact-bass-2", a + 0.05, 0.18);
    tw(`tl.to("#${sid}-bt", {height:0, duration:0.8, ease:"expo.inOut"}, ${r2(a + OPEN)});`);
    tw(`tl.to("#${sid}-bb", {height:0, duration:0.8, ease:"expo.inOut"}, ${r2(a + OPEN)});`);
    sound("whoosh-short", a + OPEN, 0.18);
    // Once open, a small header holds the chapter in the corner.
    parts.push(`<div id="${sid}-head" class="head" style="opacity:0"><b style="color:${accent}">${pad(s.story.number)}</b><span>${esc(s.caption)}</span></div>`);
    tw(`tl.fromTo("#${sid}-head", {opacity:0, x:-30}, {opacity:1, x:0, duration:0.5, ease:"expo.out"}, ${r2(a + OPEN + 0.6)});`);

    // Lower thirds at the narration cues, never before CLEAR, each up at least 1.8 s.
    const secs = s.story.sections;
    const times = [];
    secs.forEach((sec, k) => {
      const cue = cueTime(s, sec.cue) ?? enter + 1.5 + k * ((s.end - enter - 2) / secs.length);
      times.push(Math.max(cue, k ? times[k - 1] + 1.8 : a + CLEAR));
    });
    secs.forEach((sec, k) => {
      const id = `${sid}-c${k}`;
      const at = times[k];
      if (sec.places) {
        const rows = sec.places
          .map((p, j) => {
            const [i1, d1] = p.rating.toFixed(1).split(".").map(Number);
            const rt = at + 0.35 + j * 0.28;
            sound("pop", rt, 0.35);
            return `<div class="tag"><span class="pin" style="color:${accent}">${PIN}</span><div class="tag-t"><b>${esc(p.place)}</b><span>${esc(p.address)}</span></div><em style="color:${accent}">★ ${reel(`${id}-i${j}`, i1, rt, 0)}.${reel(`${id}-d${j}`, d1, rt, 1)}</em></div>`;
          })
          .join("");
        parts.push(`<div id="${id}" class="lt" style="opacity:0"><i class="rule" style="background:${accent}"></i><div class="lt-h" style="color:${accent}">${esc(sec.title.toUpperCase())}</div>${rows}</div>`);
        tw(`tl.set("#${id}", {opacity:1}, ${r2(at)});`);
        tw(`tl.fromTo("#${id} .rule", {scaleX:0}, {scaleX:1, duration:0.5, ease:"expo.out"}, ${r2(at)});`);
        tw(`tl.fromTo("#${id} .lt-h", {opacity:0, y:14}, {opacity:1, y:0, duration:0.35, ease:"expo.out"}, ${r2(at + 0.1)});`);
        tw(`tl.fromTo("#${id} .tag", {opacity:0, x:-50}, {opacity:1, x:0, duration:0.4, stagger:0.28, ease:"expo.out"}, ${r2(at + 0.3)});`);
      } else {
        parts.push(`<div id="${id}" class="lt" style="opacity:0"><i class="rule" style="background:${accent}"></i><div class="lt-h" style="color:${accent}">${esc(sec.title.toUpperCase())}</div><p class="lt-t">${esc(sec.text)}</p></div>`);
        tw(`tl.set("#${id}", {opacity:1}, ${r2(at)});`);
        tw(`tl.fromTo("#${id} .rule", {scaleX:0}, {scaleX:1, duration:0.5, ease:"expo.out"}, ${r2(at)});`);
        tw(`tl.fromTo("#${id} .lt-h", {opacity:0, y:14}, {opacity:1, y:0, duration:0.35, ease:"expo.out"}, ${r2(at + 0.1)});`);
        tw(`tl.fromTo("#${id} .lt-t", {clipPath:"inset(0 100% 0 0)"}, {clipPath:"inset(0 0% 0 0)", duration:0.7, ease:"power2.inOut"}, ${r2(at + 0.2)});`);
      }
      if (k < secs.length - 1) tw(`tl.to("#${id}", {opacity:0, y:-24, filter:"blur(8px)", duration:0.22, ease:"power3.in"}, ${r2(times[k + 1] - 0.24)});`);
    });
    parts.push(filmstrip(sid, idx, a + OPEN + 0.9));
  } else {
    // Outro: the menu of all five dishes, each ticked off in red ink.
    parts.push(photos(s, a, s.end, sid, { whips: false }));
    parts.push(`<div class="menu-shade"></div>`);
    const lines = dishes
      .map((d, k) => `<li id="${sid}-l${k}"><span class="n">${pad(k + 1)}</span><span class="m">${esc(d.caption)}</span><svg class="tick" viewBox="0 0 60 50"><path d="M6 28 L22 42 L54 8" /></svg></li>`)
      .join("");
    parts.push(`<div id="${sid}-menu" class="menu" style="opacity:0"><div class="menu-k">${esc(T.menu)}</div><h2 class="menu-t" style="font-size:${Math.min(112, Math.floor(1900 / s.caption.length))}px">${esc(s.caption)}</h2><ul>${lines}</ul><div class="menu-cta">${esc(s.cta ?? "")}</div></div>`);
    const m0 = a + LEAD + 0.1;
    tw(`tl.fromTo("#${sid}-menu", {opacity:0, y:60, rotationX:25}, {opacity:1, y:0, rotationX:0, duration:0.8, ease:"expo.out"}, ${r2(m0)});`);
    dishes.forEach((_, k) => {
      const at = m0 + 0.6 + k * 0.42;
      tw(`tl.fromTo("#${sid}-l${k}", {opacity:0, x:-30}, {opacity:1, x:0, duration:0.35, ease:"expo.out"}, ${r2(at)});`);
      tw(`tl.fromTo("#${sid}-l${k} .tick path", {strokeDashoffset:80}, {strokeDashoffset:0, duration:0.3, ease:"power2.out"}, ${r2(at + 0.25)});`);
    });
    sound("sparkle", m0 + 0.6 + dishes.length * 0.42, 0.4);
    tw(`tl.fromTo("#${sid}-menu .menu-cta", {opacity:0, scale:0.8}, {opacity:1, scale:1, duration:0.5, ease:"back.out(2)"}, ${r2(m0 + 1.2 + dishes.length * 0.42)});`);
    // The bars close to black at the very end, like the last shot of a film.
    tw(`tl.fromTo("#${sid}-et", {height:0}, {height:${H / 2}, duration:0.9, ease:"expo.inOut"}, ${r2(s.end - 1.0)});`);
    tw(`tl.fromTo("#${sid}-eb", {height:0}, {height:${H / 2}, duration:0.9, ease:"expo.inOut"}, ${r2(s.end - 1.0)});`);
    parts.push(`<div id="${sid}-et" class="wbar top" style="height:0"></div><div id="${sid}-eb" class="wbar bot" style="height:0"></div>`);
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
    line.forEach((w, k) => tw(`tl.set("#${id}-${k}", {color:"${video.theme.highlight ?? video.theme.accent}"}, ${r2(s.start + LEAD + w.startMs / 1000)});`));
    line = [];
  };
  ws.forEach((w, k) => {
    const len = line.map((x) => x.text.trim()).join(" ").length + w.text.trim().length;
    if (line.length && (len > (vi ? 30 : 32) || /[.,!?]$/.test(line.at(-1).text.trim()))) flush(w.startMs);
    line.push(w);
    if (k === ws.length - 1) flush(null);
  });
}

// ---- film grain: jumps to a new random offset 12 times a second ----------
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
for (let at = 0; at < total; at += 1 / 12) tw(`tl.set("#grain", {backgroundPosition:"${Math.floor(rnd() * 512)}px ${Math.floor(rnd() * 512)}px"}, ${r2(at)});`);

// ---- audio --------------------------------------------------------------
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
// A whoosh under every shader seam.
scenes.slice(1).forEach((s) => sound("whoosh-short", s.start - 0.3, 0.2));

// ---- shader seams -------------------------------------------------------
const SHADERS = ["cinematic-zoom", "whip-pan", "thermal-distortion", "chromatic-split", "flash-through-white", "sdf-iris"];
const transitions = scenes.slice(1).map((s, k) => ({
  time: r2(s.start - SEAM / 2),
  shader: k === scenes.length - 2 ? "sdf-iris" : SHADERS[k % (SHADERS.length - 1)],
  duration: SEAM,
}));

// ---- page ---------------------------------------------------------------
const page = `<!doctype html>
<html lang="${video.language}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=${W}, height=${H}" />
<title>${esc(video.title)} · cine</title>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@hyperframes/shader-transitions@0.8.223/dist/index.global.js"></script>
<style>
:root { --ground:#0d0809; --ink:#fff6ea; --gold:#e8c170; --seal:#c0281f; }
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:${W}px; height:${H}px; overflow:hidden; background:var(--ground); }
#root { position:relative; width:${W}px; height:${H}px; overflow:hidden; font-family:"Montserrat"; }
.scene { position:absolute; inset:0; overflow:hidden; background:var(--ground); z-index:1; }
.ph { position:absolute; inset:0; overflow:hidden; }
/* Warm documentary grade on every photo. */
.ph img { width:100%; height:100%; object-fit:cover; filter:contrast(1.1) saturate(1.15) sepia(0.12) brightness(0.96); }
.shade { position:absolute; inset:0; background:linear-gradient(180deg, rgba(13,8,9,0.7) 0%, rgba(13,8,9,0) 22%, rgba(13,8,9,0) 52%, rgba(13,8,9,0.82) 74%, rgba(13,8,9,0.95) 100%); }
.hook-shade { position:absolute; inset:0; background:radial-gradient(ellipse at 50% 42%, rgba(13,8,9,0.15) 10%, rgba(13,8,9,0.8) 100%); }
.flash { position:absolute; inset:0; background:#fff8ee; z-index:4; }
.hook-kick { position:absolute; left:0; right:0; top:380px; text-align:center; font:700 34px "Montserrat"; letter-spacing:0.34em; color:var(--gold); z-index:5; }
.slam { position:absolute; left:0; right:0; top:560px; height:400px; z-index:5; }
.slam span { position:absolute; left:0; right:0; top:0; text-align:center; font:italic 900 190px/1 "Playfair Display"; }
.slam .r { color:#ff2e4c; mix-blend-mode:screen; opacity:0.85; }
.slam .c { color:#21e6ff; mix-blend-mode:screen; opacity:0.85; }
.slam .w { color:var(--ink); text-shadow:0 12px 60px rgba(0,0,0,0.6); }
.count { position:absolute; left:50%; top:1010px; margin-left:-150px; width:300px; height:150px; border-radius:16px; background:var(--seal); border:5px double rgba(255,236,214,0.85); display:flex; align-items:center; justify-content:center; gap:18px; color:#fff1e2; z-index:6; box-shadow:0 14px 40px rgba(0,0,0,0.5); }
.count b { font:900 110px/1 "Playfair Display"; }
.count span { font:800 44px "Montserrat"; letter-spacing:0.16em; }
.wbar { position:absolute; left:0; right:0; background:#050304; z-index:8; overflow:hidden; }
.wbar.top { top:0; } .wbar.bot { bottom:0; }
.chap { position:absolute; left:0; right:0; bottom:46px; display:flex; justify-content:center; align-items:baseline; gap:22px; color:rgba(255,246,234,0.7); font:700 34px "Montserrat"; letter-spacing:0.32em; }
.chap b { font:italic 900 150px/0.9 "Playfair Display"; letter-spacing:0; }
.dname { position:absolute; left:40px; right:40px; top:50px; text-align:center; font:italic 800 104px/1.05 "Playfair Display"; color:var(--ink); }
.dtag { position:absolute; left:60px; right:60px; top:${50 + 130}px; text-align:center; font:600 38px "Montserrat"; color:rgba(255,246,234,0.7); letter-spacing:0.04em; }
.head { position:absolute; left:70px; top:150px; display:flex; align-items:center; gap:22px; z-index:6; }
.head b { font:italic 900 104px/1 "Playfair Display"; text-shadow:0 4px 24px rgba(0,0,0,0.7); }
.head span { font:italic 800 66px/1.05 "Playfair Display"; color:var(--ink); text-shadow:0 4px 24px rgba(0,0,0,0.7); max-width:720px; }
.steam { position:absolute; left:0; right:0; top:1000px; height:10px; z-index:2; pointer-events:none; }
.steam i { position:absolute; top:0; width:200px; height:340px; border-radius:50%; background:radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 70%); filter:blur(28px); mix-blend-mode:screen; }
/* Lower thirds sit between y 1120 and 1450, above the subtitles (top 1500). */
.lt { position:absolute; left:70px; right:70px; top:1120px; z-index:7; }
.rule { display:block; width:120px; height:5px; border-radius:3px; transform-origin:left center; margin-bottom:16px; }
.lt-h { font:800 30px "Montserrat"; letter-spacing:0.3em; margin-bottom:12px; }
.lt-t { font:italic 600 52px/1.25 "Playfair Display"; color:var(--ink); text-shadow:0 3px 18px rgba(0,0,0,0.8); }
.tag { display:flex; align-items:center; gap:18px; padding:9px 0; }
.pin { flex:none; filter:drop-shadow(0 3px 8px rgba(0,0,0,0.6)); }
.tag-t { flex:1; min-width:0; display:flex; flex-direction:column; }
.tag-t b { font:800 40px/1.1 "Montserrat"; color:var(--ink); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; text-shadow:0 2px 12px rgba(0,0,0,0.8); }
.tag-t span { font:500 28px "Montserrat"; color:rgba(255,246,234,0.7); }
.tag em { flex:none; font:900 46px/1 "Montserrat"; font-style:normal; display:flex; align-items:flex-start; height:1em; line-height:1em; text-shadow:0 2px 12px rgba(0,0,0,0.8); }
.odo { display:block; height:1em; overflow:hidden; line-height:1em; }
.reel { display:block; line-height:1em; }
/* Film strip of the five dishes, below the subtitles. */
.strip { position:absolute; left:0; right:0; top:1690px; display:flex; justify-content:center; gap:12px; z-index:20; padding:10px 0; }
.strip i { width:104px; height:72px; border-radius:6px; background-size:cover; background-position:center; border:3px solid rgba(255,246,234,0.25); filter:grayscale(1) brightness(0.45); }
.strip i.done { filter:grayscale(0.6) brightness(0.7); }
.strip i.now { filter:none; transform:scale(1.18); box-shadow:0 0 22px rgba(232,193,112,0.6); }
.menu-shade { position:absolute; inset:0; background:rgba(10,6,7,0.62); backdrop-filter:blur(6px); }
.menu { position:absolute; left:110px; right:110px; top:300px; padding:46px 56px 50px; border:2px solid var(--gold); border-radius:8px; background:rgba(20,12,12,0.78); box-shadow:inset 0 0 0 10px rgba(232,193,112,0.12), 0 30px 80px rgba(0,0,0,0.6); z-index:5; transform-origin:50% 0; }
.menu-k { text-align:center; font:800 30px "Montserrat"; letter-spacing:0.4em; color:var(--gold); }
.menu-t { text-align:center; font:italic 900 112px/1.1 "Playfair Display"; color:var(--ink); margin:16px 0 26px; }
.menu ul { list-style:none; border-top:1px solid rgba(232,193,112,0.4); }
.menu li { display:flex; align-items:center; gap:26px; padding:20px 0; border-bottom:1px solid rgba(232,193,112,0.2); }
.menu .n { font:italic 800 40px "Playfair Display"; color:var(--gold); width:54px; }
.menu .m { flex:1; font:700 46px "Montserrat"; color:var(--ink); }
.tick { width:60px; height:50px; }
.tick path { fill:none; stroke:var(--seal); stroke-width:9; stroke-linecap:round; stroke-linejoin:round; stroke-dasharray:80; stroke-dashoffset:80; }
.menu-cta { margin:34px auto 0; width:max-content; font:900 44px "Montserrat"; color:#140c0c; background:var(--gold); padding:14px 40px; border-radius:999px; }
.lbx { position:absolute; left:0; right:0; height:64px; background:#050304; z-index:21; pointer-events:none; }
.lbx.top { top:0; } .lbx.bot { bottom:0; }
.slate { position:absolute; left:0; right:0; top:0; height:64px; display:flex; justify-content:space-between; align-items:center; padding:0 46px; font:700 22px "Montserrat"; letter-spacing:0.36em; color:rgba(232,193,112,0.75); z-index:22; }
#grain { position:absolute; inset:-10px; background:url(${asset("shared/grain.png")}); opacity:0.09; mix-blend-mode:overlay; z-index:19; pointer-events:none; }
.vignette { position:absolute; inset:0; background:radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.45) 100%); z-index:18; pointer-events:none; }
.cap { position:absolute; left:60px; right:60px; top:1500px; text-align:center; font:800 50px/1.25 "Montserrat"; color:#ffffff; text-shadow:0 3px 0 rgba(0,0,0,0.55), 0 0 22px rgba(0,0,0,0.85); z-index:20; }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="${W}" data-height="${H}">
${media.join("\n")}
${sfx.join("\n")}
${html.join("\n")}
<div class="vignette" data-layout-ignore></div>
<div id="grain" data-layout-ignore></div>
<div class="lbx top" data-layout-ignore></div><div class="lbx bot" data-layout-ignore></div>
<div class="slate" data-layout-ignore><span>${esc(T.slate)}</span><span>● ${dishes.length} ${esc(T.dishes)}</span></div>
${caps.join("\n")}
</div>
<script>
const tl = gsap.timeline({ paused: true });
${js.join("\n")}
HyperShader.init({
  bgColor: "#0d0809",
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
console.log(`build/${slug}-cine: ${scenes.length} scenes, ${total}s, ${caps.length} caption lines, ${sfx.length} sfx, ${assets.size} assets`);
