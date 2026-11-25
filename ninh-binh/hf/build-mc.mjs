#!/usr/bin/env node
/**
 * node hf/build-mc.mjs --slug moc-chau-3n2d [--cover]
 *
 * Turns data/videos/<slug>/video.json + voiceover.json into a HyperFrames project at
 * build/<slug>/. The look ("Mộc Châu · cao nguyên chè và sữa"), new for this destination:
 *   - travel intro: a sleeper-bus ticket Hà Nội → Mộc Châu slides up, gets punched, the stub
 *     tears off along the perforation and the photo opens with a scale reveal (close-up → wide);
 *   - plum petals drifting down over every scene; milk-cream paper cards with a tea-green rule;
 *   - each stop gets a ticket stub (day or dish number) that drops in and is hole-punched;
 *   - photos change with a soft-edged wipe instead of a dissolve;
 *   - a "Nên ở đâu?" scene with one card per area at the narration cues;
 *   - travel outro: a checklist of the stops ticked one by one, then black bars close in;
 *   - food intro: five face-down cards flip over in 3D to show the dishes;
 *   - food outro: a mosaic of the dishes with numbered names and "Bạn chọn món nào?";
 *   - shader seams: light leak, ripple waves, domain warp, chromatic split, thermal distortion;
 *   - quiet whooshes on the seams (≈0.15), karaoke subtitles at top 1500, rail below them.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fail, parseArgs, requireSlug } from "../scripts/lib/args.mjs";
import { probeDurationSec } from "../scripts/lib/media.mjs";
import { PROJECT_ROOT, PUBLIC_ROOT } from "../scripts/lib/paths.mjs";

const { flags } = parseArgs(process.argv.slice(2));
const slug = requireSlug(flags, "build-mc");
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
const brand = video.theme.brand ?? "MỘC CHÂU";

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

/** Photo stack; each new photo wipes in from alternating sides behind a soft feathered edge. */
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
        const left = k % 2 === 1;
        // The mask is a wide gradient; sliding it across reveals the photo with a soft edge.
        tw(`tl.fromTo("#${id}", {opacity:1, "--wipe":"${left ? "-40%" : "140%"}"}, {opacity:1, "--wipe":"${left ? "140%" : "-40%"}", duration:0.7, ease:"power2.inOut", immediateRender:false}, ${a});`);
        tw(`tl.set("#${id}", {"--wipe":"${left ? "140%" : "-40%"}", "-webkit-mask-image":"none", "mask-image":"none"}, ${r2(a + 0.72)});`);
        tw(`tl.to("#${idPrefix}-p${k - 1}", {opacity:0, duration:0.01}, ${r2(a + 0.72)});`);
      }
      const mask = k > 0 ? ` style="opacity:0;--wipe:${k % 2 === 1 ? "-40%" : "140%"}" data-dir="${k % 2 === 1 ? "l" : "r"}"` : "";
      return `<div id="${id}" class="ph${k > 0 ? " wipe" : ""}"${mask}><img src="${asset(src)}" alt="" /></div>`;
    })
    .join("");
};

const titleIn = (sel, at) =>
  tw(`tl.fromTo("${sel} .w", {opacity:0, y:30, filter:"blur(8px)"}, {opacity:1, y:0, filter:"blur(0px)", duration:0.5, stagger:0.08, ease:"power3.out"}, ${r2(at)});`);
const fadeUp = (sel, at, dur = 0.35) =>
  tw(`tl.fromTo("${sel}", {opacity:0, y:26}, {opacity:1, y:0, duration:${dur}, ease:"expo.out"}, ${r2(at)});`);

/** Ticket stub that drops in, tilts, then gets a hole punched through it (with a paper chad). */
const sign = (sid, big, small, at) => {
  tw(`tl.fromTo("#${sid}-sign", {opacity:0, y:-160, rotation:-14}, {opacity:1, y:0, rotation:6, duration:0.6, ease:"back.out(1.6)"}, ${r2(at)});`);
  tw(`tl.fromTo("#${sid}-hole", {scale:0}, {scale:1, duration:0.12, ease:"power4.out"}, ${r2(at + 0.75)});`);
  tw(`tl.fromTo("#${sid}-chad", {opacity:1, x:0, y:0, rotation:0}, {opacity:0, x:40, y:220, rotation:200, duration:0.8, ease:"power2.in"}, ${r2(at + 0.78)});`);
  tw(`tl.to("#${sid}-sign", {rotation:4, duration:0.2, yoyo:true, repeat:1, ease:"sine.inOut"}, ${r2(at + 0.75)});`);
  sound("pop", r2(at + 0.75), 0.12);
  return `<div id="${sid}-sign" class="sign" style="opacity:0"><div class="stub"><small class="stub-top">${esc(brand)}</small><b>${esc(big)}</b><small>${esc(small)}</small><i id="${sid}-hole" class="hole"></i></div><i id="${sid}-chad" class="chad"></i></div>`;
};

const row = (p, accent) => `<div class="row"><b>${esc(p.place)}</b><span>${esc(p.address)}</span><em style="background:${p.rating == null ? "rgba(255,255,255,0.18)" : accent}">${star(p.rating)}</em></div>`;

// Google Maps screenshots (name + stars + review count), captured 04/11/2026 into public/videos/moc-chau/maps.
const MAPS = {
  "Phương Nhi": "phuong-nhi", "Bếp Nhớ": "bep-nho", "Nguyệt Anh Quán": "nguyet-anh", "A Páo": "a-pao",
  "Bún Cá Minh Chi": "minh-chi", "Bún riêu bề bề": "be-be", "Lẩu Nấm Thiên Nhiên": "lau-nam", "Cơm Thái Sơn La": "com-thai",
  "TuSa Đây!": "tusa", "Lẩu Ngựa 911": "lau-ngua", "Bản Mộc Quán": "ban-moc", "Ka Tờ Rang Café": "ka-to",
  "Nhà hàng Việt": "viet-vh", "Vigolando Vân Hồ": "vigolando", "Hiếu Thoa Tây Bắc": "hieu-thoa", "Xuân Bắc CS1": "xuan-bac",
  "Cá Hồi 26": "ca-hoi-26", "Trịnh Hậu Quán": "trinh-hau", "LÈO XÈO": "leo-xeo",
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
    tw(`tl.fromTo(document.querySelectorAll("${rowsSel}")[${k}], {backgroundColor:"rgba(143,209,107,0)"}, {backgroundColor:"rgba(143,209,107,0.3)", duration:0.25, yoyo:true, repeat:1, repeatDelay:${r2(Math.max(slot - 0.5, 0.2))}}, ${r2(t0)});`);
  });
  return `<div id="${id}" class="gmaps" style="opacity:0"><div class="gmaps-h"><i>📍</i>Google Maps<span>${vi ? "chụp 04/11/2026" : "captured 4 Nov 2026"}</span></div>${list.map(([m, k]) => `<img id="${id}-${k}" src="${asset(`videos/moc-chau/maps/${m}.png`)}" alt="" />`).join("")}</div>`;
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

// ---- the bus ticket (travel intro) ---------------------------------------
// A sleeper-bus ticket slides up over a dimmed close-up, is punched, and its stub tears
// away along the perforation; the photo behind then pulls back from 1.7x (scale reveal).
const ticketIntro = (s, sid) => {
  const a = s.start;
  const k = s.ticket;
  tw(`tl.fromTo("#${sid}-ticket", {y:900, rotation:8, opacity:0}, {y:0, rotation:-3, opacity:1, duration:0.9, ease:"back.out(1.3)"}, ${r2(a + 0.15)});`);
  fadeUp(`#${sid}-route`, a + 0.7, 0.3);
  tw(`tl.fromTo("#${sid}-bus", {x:-30}, {x:390, duration:1.6, ease:"power2.inOut"}, ${r2(a + 0.9)});`);
  tw(`tl.fromTo("#${sid}-punch", {scale:0}, {scale:1, duration:0.12, ease:"power4.out"}, ${r2(a + 2.4)});`);
  sound("pop", r2(a + 2.4), 0.14);
  tw(`tl.fromTo("#${sid}-okstamp", {opacity:0, scale:2.4, rotation:-28}, {opacity:0.9, scale:1, rotation:-12, duration:0.3, ease:"power4.in"}, ${r2(a + 2.7)});`);
  // Tear: the stub swings down on its corner and falls; the main ticket flies off upward.
  tw(`tl.to("#${sid}-stub", {rotation:-24, y:60, duration:0.35, ease:"power2.in"}, ${r2(a + 3.5)});`);
  tw(`tl.to("#${sid}-stub", {y:2200, rotation:-60, duration:0.8, ease:"power2.in"}, ${r2(a + 3.85)});`);
  tw(`tl.to("#${sid}-ticket", {opacity:0, duration:0.01}, ${r2(a + 4.7)});`);
  tw(`tl.to("#${sid}-main", {y:-1500, rotation:-10, duration:0.9, ease:"power3.in"}, ${r2(a + 3.75)});`);
  sound("whoosh-short", r2(a + 3.6), 0.15);
  tw(`tl.to("#${sid}-dim", {opacity:0.35, duration:0.8, ease:"power2.out"}, ${r2(a + 3.9)});`);
  tw(`tl.fromTo("#${sid}-reveal", {scale:1.7}, {scale:1, duration:2.6, ease:"expo.out"}, ${r2(a + 3.8)});`);
  return `<div id="${sid}-ticket" class="ticket" style="opacity:0">
<div id="${sid}-main" class="t-main">
  <div class="t-head"><span>${esc(k.cls)}</span><span>${esc(k.seat)}</span></div>
  <div class="t-cities"><b>${esc(k.from)}</b><i>→</i><b>${esc(k.to)}</b></div>
  <div id="${sid}-route" class="t-route"><div class="t-line"></div><div id="${sid}-bus" class="t-bus">🚌</div></div>
  <div class="t-meta"><span>${esc(k.km)}</span><span>${esc(k.time)}</span><span>${esc(k.via)}</span></div>
  <i id="${sid}-punch" class="t-punch"></i>
  <div id="${sid}-okstamp" class="t-stamp" style="opacity:0">${esc(vi ? "ĐÃ SOÁT VÉ" : "CHECKED")}</div>
</div>
<div id="${sid}-stub" class="t-stub"><small>${esc(vi ? "CUỐNG VÉ" : "STUB")}</small><b>${esc(s.label ?? "")}</b><small>${esc(k.to)}</small></div>
</div>`;
};

// ---- scenes -------------------------------------------------------------
for (const s of scenes) {
  const sid = `s-${s.id}`;
  const a = s.start;
  const enter = a + LEAD;
  const accent = s.accent ?? video.theme.accent;
  const parts = [];

  if (s.layout === "hook" && !isFood) {
    // Frame 0 (the thumbnail) shows the title over the photo; the ticket then takes over.
    parts.push(`<div id="${sid}-reveal" class="reveal">${photos(s, a, s.end, sid)}</div>`);
    parts.push(`<div id="${sid}-dim" class="hook-dim"></div>`);
    parts.push(ticketIntro(s, sid));
    parts.push(`<div id="${sid}-kicker" class="hook-kicker">${esc(s.kicker)}</div>`);
    parts.push(`<h1 id="${sid}-title" class="hook-title">${words(s.caption)}</h1>`);
    parts.push(`<div id="${sid}-pill" class="pill" style="background:${accent};top:1370px">${esc(s.label ?? "")}</div>`);
    tw(`tl.fromTo("#${sid}-title", {scale:1.1}, {scale:1, duration:1.8, ease:"expo.out"}, ${a});`);
    fadeUp(`#${sid}-kicker`, a + 0.2);
    fadeUp(`#${sid}-pill`, a + 0.6);
  } else if (s.layout === "hook") {
    // Food intro: five face-down cards flip over in 3D, one by one, to show the dishes.
    parts.push(`<div class="table cream"></div>`);
    const SPOTS = [[200, 330, -6], [540, 300, 3], [880, 330, 7], [360, 1260, 4], [720, 1260, -5]];
    (s.gallery ?? []).slice(0, 5).forEach((src, k) => {
      const [x, y, rot] = SPOTS[k];
      parts.push(`<div class="flip" style="left:${x - 150}px;top:${y - 200}px;transform:rotate(${rot}deg)"><div id="${sid}-card${k}" class="flip-in"><div class="flip-back"><b>${k + 1}</b><small>${esc(brand)}</small></div><div class="flip-front"><img src="${asset(src)}" alt="" /><span>${esc(s.names?.[k] ?? "")}</span></div></div></div>`);
      tw(`tl.fromTo("#${sid}-card${k}", {rotationY:0}, {rotationY:180, duration:0.7, ease:"power3.inOut"}, ${r2(a + 0.5 + k * 0.32)});`);
      if (k % 2 === 0) sound("pop", r2(a + 0.75 + k * 0.32), 0.1);
    });
    parts.push(`<div id="${sid}-kicker" class="hook-kicker" style="top:640px;color:#3f6b2a">${esc(s.kicker)}</div>`);
    const size = Math.min(150, Math.floor(1500 / s.caption.length));
    parts.push(`<h1 id="${sid}-title" class="hook-title food" style="font-size:${size}px">${words(s.caption)}</h1>`);
    parts.push(`<div id="${sid}-pill" class="pill" style="background:${accent};top:930px">${esc(s.label ?? "")}</div>`);
    tw(`tl.fromTo("#${sid}-title", {scale:1.12}, {scale:1, duration:1.4, ease:"expo.out"}, ${a});`);
    fadeUp(`#${sid}-kicker`, a + 0.2);
    fadeUp(`#${sid}-pill`, a + 0.5);
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
    // Travel outro: the stops ticked off one by one on a cream note, then black bars close in.
    parts.push(photos(s, a, s.end, sid));
    parts.push(`<div class="hook-dim"></div>`);
    const items = s.checklist ?? [];
    parts.push(`<div id="${sid}-note" class="note" style="opacity:0"><h2>${esc(s.caption)}</h2>${items.map((c, k) => `<div class="chk"><svg viewBox="0 0 40 40" width="40" height="40"><rect x="2" y="2" width="36" height="36" rx="8" fill="none" stroke="#3f6b2a" stroke-width="3"/><path id="${sid}-tick${k}" d="M9 21 L17 29 L32 11" pathLength="1" fill="none" stroke="#2f8f3a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1" stroke-dashoffset="1"/></svg><span>${esc(c)}</span></div>`).join("")}</div>`);
    tw(`tl.fromTo("#${sid}-note", {opacity:0, y:120, rotation:3}, {opacity:1, y:0, rotation:-1.5, duration:0.6, ease:"expo.out"}, ${r2(enter)});`);
    const step = Math.min(0.45, (s.end - enter - 3.2) / Math.max(1, items.length));
    items.forEach((_, k) => tw(`tl.fromTo("#${sid}-tick${k}", {strokeDashoffset:1}, {strokeDashoffset:0, duration:0.25, ease:"power2.out"}, ${r2(enter + 0.7 + k * step)});`));
    parts.push(`<div id="${sid}-cta" class="pill" style="background:${video.theme.accent};top:1330px;opacity:0">${esc(s.cta ?? "")}</div>`);
    fadeUp(`#${sid}-cta`, enter + 0.9 + items.length * step);
    parts.push(`<div id="${sid}-barT" class="bar top-bar"></div><div id="${sid}-barB" class="bar bottom-bar"></div>`);
    tw(`tl.fromTo("#${sid}-barT", {height:0}, {height:260, duration:0.9, ease:"power3.inOut"}, ${r2(s.end - 1.6)});`);
    tw(`tl.fromTo("#${sid}-barB", {height:0}, {height:520, duration:0.9, ease:"power3.inOut"}, ${r2(s.end - 1.6)});`);
  } else {
    // Food outro: a mosaic of the five dishes with numbered names and the question.
    parts.push(`<div class="table"></div>`);
    const TILES = [[40, 300, 500, 470], [560, 300, 480, 300], [560, 620, 480, 450], [40, 790, 500, 280], [40, 1090, 1000, 0]];
    s.gallery.slice(0, 4).forEach((src, k) => {
      const [x, y, w, h] = TILES[k];
      parts.push(`<div id="${sid}-tile${k}" class="tile" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;opacity:0"><img src="${asset(src)}" alt="" /><span>${k + 1} · ${esc(s.names?.[k] ?? "")}</span></div>`);
      tw(`tl.fromTo("#${sid}-tile${k}", {opacity:0, scale:0.86}, {opacity:1, scale:1, duration:0.45, ease:"back.out(1.6)"}, ${r2(enter + 0.15 + k * 0.18)});`);
    });
    if (s.gallery[4]) {
      parts.push(`<div id="${sid}-tile4" class="tile wide" style="left:40px;top:1090px;width:1000px;height:250px;opacity:0"><img src="${asset(s.gallery[4])}" alt="" /><span>5 · ${esc(s.names?.[4] ?? "")}</span></div>`);
      tw(`tl.fromTo("#${sid}-tile4", {opacity:0, scale:0.86}, {opacity:1, scale:1, duration:0.45, ease:"back.out(1.6)"}, ${r2(enter + 0.9)});`);
    }
    parts.push(`<h1 id="${sid}-title" class="hook-title outro mosaic">${words(s.caption)}</h1>`);
    titleIn(`#${sid}-title`, enter + 0.2);
    parts.push(`<div id="${sid}-cta" class="pill" style="background:${video.theme.accent};top:1360px">${esc(s.cta ?? "")}</div>`);
    fadeUp(`#${sid}-cta`, enter + 2.2);
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
  ? ["chromatic-split", "ripple-waves", "light-leak", "thermal-distortion", "domain-warp", "light-leak"]
  : ["light-leak", "ripple-waves", "domain-warp", "chromatic-split", "light-leak", "ripple-waves", "domain-warp", "light-leak", "chromatic-split", "ripple-waves"];
const transitions = scenes.slice(1).map((s, k) => ({ time: r2(s.start - SEAM / 2), shader: SHADERS[k % SHADERS.length], duration: SEAM }));
for (const tr of transitions) sound("whoosh-short", r2(tr.time - 0.1), 0.15);

// ---- plum petals drifting down over everything ---------------------------
const PETALS = [[80, 9, 0.0, 26], [260, 12, 2.1, 18], [430, 10, 4.3, 22], [610, 13, 1.2, 16], [790, 11, 3.4, 24], [960, 9.5, 5.6, 20], [170, 14, 6.8, 14], [700, 12.5, 7.9, 18], [880, 10.5, 9.1, 22], [350, 13.5, 10.4, 16]];
const petals = PETALS.map(([x, dur, delay, size], k) => {
  const reps = Math.ceil((total - delay) / dur);
  tw(`tl.fromTo("#petal${k}", {y:-120, x:0, rotation:0}, {y:${H + 160}, x:${k % 2 ? 140 : -140}, rotation:${k % 2 ? 320 : -280}, duration:${dur}, ease:"none", repeat:${Math.max(0, reps - 1)}}, ${delay});`);
  return `<i id="petal${k}" class="petal" style="left:${x}px;width:${size}px;height:${Math.round(size * 0.78)}px" data-layout-ignore></i>`;
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
:root { --ground:#131a10; --ink:#fbf8ef; --cream:#f7f1e3; --tea:#8fd16b; --teadark:#3f6b2a; --plum:#ffd1e3; --amber:#ffe08a; --soil:#24331f; }
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:${W}px; height:${H}px; overflow:hidden; background:var(--ground); }
#root { position:relative; width:${W}px; height:${H}px; overflow:hidden; font-family:"Montserrat"; }
.scene { position:absolute; inset:0; overflow:hidden; background:var(--ground); z-index:1; }
.ph { position:absolute; inset:0; overflow:hidden; }
.ph img { width:100%; height:100%; object-fit:cover; }
/* Soft-edged wipe: a gradient mask slides across as --wipe moves. */
.ph.wipe[data-dir="l"] { -webkit-mask-image:linear-gradient(90deg, #000 calc(var(--wipe) - 28%), transparent var(--wipe)); mask-image:linear-gradient(90deg, #000 calc(var(--wipe) - 28%), transparent var(--wipe)); }
.ph.wipe[data-dir="r"] { -webkit-mask-image:linear-gradient(90deg, transparent var(--wipe), #000 calc(var(--wipe) + 28%)); mask-image:linear-gradient(90deg, transparent var(--wipe), #000 calc(var(--wipe) + 28%)); }
.reveal { position:absolute; inset:0; }
.shade { position:absolute; inset:0; background:radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(8,12,6,0.5) 100%); }
.top { position:absolute; left:0; right:0; top:0; height:760px; background:linear-gradient(180deg, rgba(14,20,10,0.9) 0%, rgba(14,20,10,0.6) 55%, rgba(14,20,10,0) 100%); }
.floor { position:absolute; left:0; right:0; bottom:0; height:900px; background:linear-gradient(180deg, rgba(14,20,10,0) 0%, rgba(14,20,10,0.6) 45%, rgba(14,20,10,0.92) 100%); }
.hook-dim { position:absolute; inset:0; background:linear-gradient(180deg, rgba(14,20,10,0.8) 0%, rgba(14,20,10,0.62) 55%, rgba(14,20,10,0.9) 100%); }
.petal { position:absolute; top:0; z-index:16; border-radius:80% 0 80% 0; background:radial-gradient(circle at 30% 30%, #fff 0%, var(--plum) 70%); opacity:0.75; box-shadow:0 2px 6px rgba(0,0,0,0.25); pointer-events:none; }
/* Sleeper-bus ticket. */
.ticket { position:absolute; left:90px; top:330px; width:900px; height:560px; z-index:6; display:flex; filter:drop-shadow(0 30px 50px rgba(0,0,0,0.55)); }
.t-main { position:relative; width:650px; height:560px; background:var(--cream); border-radius:28px 0 0 28px; padding:40px 44px; color:var(--soil); }
.t-main::after { content:""; position:absolute; right:-2px; top:20px; bottom:20px; border-right:6px dotted rgba(36,51,31,0.35); }
.t-head { display:flex; justify-content:space-between; font:800 26px "Montserrat"; letter-spacing:0.16em; color:var(--teadark); }
.t-cities { margin-top:46px; display:flex; align-items:center; gap:16px; }
.t-cities b { font:900 44px/1 "Montserrat"; letter-spacing:-0.02em; white-space:nowrap; }
.t-cities i { font:900 40px "Montserrat"; font-style:normal; color:var(--teadark); }
.t-route { position:relative; margin:52px 0 0; height:70px; }
.t-line { position:absolute; left:0; right:0; top:34px; border-top:6px dashed rgba(36,51,31,0.35); }
.t-bus { position:absolute; left:0; top:0; font-size:58px; line-height:70px; }
.t-meta { margin-top:46px; display:flex; flex-wrap:wrap; gap:14px; }
.t-meta span { font:800 28px "Montserrat"; background:#e9e1cd; padding:10px 18px; border-radius:12px; white-space:nowrap; }
.t-punch { position:absolute; right:40px; top:40px; width:58px; height:58px; border-radius:50%; background:var(--ground); box-shadow:inset 0 4px 10px rgba(0,0,0,0.7); }
.t-stamp { position:absolute; right:60px; bottom:120px; padding:10px 22px; border:6px solid rgba(178,40,40,0.85); border-radius:14px; color:rgba(178,40,40,0.9); font:900 38px "Montserrat"; letter-spacing:0.08em; }
.t-stub { width:250px; height:560px; background:var(--tea); border-radius:0 28px 28px 0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; color:var(--soil); transform-origin:0 0; }
.t-stub small { font:800 24px "Montserrat"; letter-spacing:0.18em; }
.t-stub b { font:900 64px/1 "Montserrat"; }
.hook-kicker { position:absolute; left:0; right:0; top:1090px; text-align:center; font:700 32px "Montserrat"; letter-spacing:0.3em; color:var(--tea); z-index:5; }
.hook-title { position:absolute; left:0; right:0; top:1150px; text-align:center; font:900 180px/1 "Playfair Display"; color:var(--ink); text-shadow:0 10px 60px rgba(0,0,0,0.6); z-index:5; }
.hook-title .w, .title .w { display:inline-block; }
.hook-title.food { top:720px; line-height:1.05; color:var(--soil); text-shadow:none; }
.hook-title.outro { top:330px; font-size:110px; line-height:1.08; padding:0 70px; }
.hook-title.outro.mosaic { top:110px; font-size:92px; color:var(--soil); text-shadow:none; }
.pill { position:absolute; left:50%; transform:translateX(-50%); font:900 48px "Montserrat"; color:var(--soil); padding:12px 40px; border-radius:999px; white-space:nowrap; z-index:6; }
/* Ticket stub that gets punched (stop marker). */
.sign { position:absolute; right:56px; top:150px; width:250px; z-index:6; }
.stub { position:relative; padding:16px 12px 18px; border-radius:16px; text-align:center; background:var(--cream); color:var(--soil); box-shadow:0 14px 30px rgba(0,0,0,0.5); border-left:8px dotted rgba(36,51,31,0.3); }
.stub-top { display:block; font:800 16px "Montserrat"; letter-spacing:0.26em; color:var(--teadark); margin-bottom:6px; }
.stub b { display:block; font:900 46px/1 "Montserrat"; white-space:nowrap; }
.stub small { display:block; margin-top:6px; font:800 21px "Montserrat"; letter-spacing:0.14em; white-space:nowrap; }
.hole { position:absolute; right:16px; top:14px; width:30px; height:30px; border-radius:50%; background:rgba(14,20,10,0.92); box-shadow:inset 0 3px 6px rgba(0,0,0,0.6); }
.chad { position:absolute; right:22px; top:20px; width:26px; height:26px; border-radius:50%; background:var(--cream); }
.head { position:absolute; left:80px; top:215px; width:640px; display:flex; flex-direction:column; gap:10px; z-index:5; }
.kicker { font:700 32px "Montserrat"; letter-spacing:0.28em; }
.title { margin-bottom:10px; font:800 104px/1.04 "Playfair Display"; color:var(--ink); text-shadow:0 6px 30px rgba(0,0,0,0.55); }
.point { font:600 37px/1.3 "Montserrat"; color:rgba(251,248,239,0.93); text-shadow:0 2px 14px rgba(0,0,0,0.7); }
.point i { display:inline-block; width:14px; height:14px; border-radius:50%; margin-right:18px; vertical-align:middle; }
/* Milk-cream paper cards with a tea-green rule, in the lower third. */
.card { position:absolute; left:60px; width:960px; top:1110px; padding:24px 34px 16px; border-radius:20px; background:rgba(247,241,227,0.96); border-top:10px solid var(--tea); box-shadow:0 18px 40px rgba(0,0,0,0.45); z-index:7; }
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
/* Checklist outro. */
.note { position:absolute; left:110px; top:250px; width:860px; padding:44px 54px 36px; background:var(--cream); border-radius:22px; box-shadow:0 30px 60px rgba(0,0,0,0.55); color:var(--soil); z-index:5; }
.note::before { content:""; position:absolute; left:0; right:0; top:0; height:16px; border-radius:22px 22px 0 0; background:var(--tea); }
.note h2 { font:900 64px/1.1 "Playfair Display"; margin-bottom:24px; }
.chk { display:flex; align-items:center; gap:22px; padding:10px 0; border-top:1px solid rgba(36,51,31,0.12); }
.chk span { font:800 40px "Montserrat"; white-space:nowrap; }
.bar { position:absolute; left:0; right:0; height:0; background:#000; z-index:19; }
.top-bar { top:0; }
.bottom-bar { bottom:0; }
/* Food intro: flip cards on a cream tablecloth. */
.table { position:absolute; inset:0; background:repeating-linear-gradient(0deg, rgba(143,209,107,0.18) 0 40px, transparent 40px 80px), repeating-linear-gradient(90deg, rgba(143,209,107,0.18) 0 40px, transparent 40px 80px), var(--cream); }
.flip { position:absolute; width:300px; height:400px; perspective:1400px; z-index:2; }
.flip-in { position:relative; width:100%; height:100%; transform-style:preserve-3d; }
.flip-back, .flip-front { position:absolute; inset:0; border-radius:22px; backface-visibility:hidden; -webkit-backface-visibility:hidden; overflow:hidden; box-shadow:0 18px 36px rgba(36,51,31,0.35); }
.flip-back { background:repeating-linear-gradient(45deg, var(--teadark) 0 18px, #4d7f35 18px 36px); border:10px solid var(--cream); display:flex; flex-direction:column; align-items:center; justify-content:center; color:var(--cream); }
.flip-back b { font:900 120px/1 "Playfair Display"; }
.flip-back small { font:800 20px "Montserrat"; letter-spacing:0.24em; margin-top:10px; }
.flip-front { transform:rotateY(180deg); border:10px solid #fff; background:#fff; }
.flip-front img { width:100%; height:100%; object-fit:cover; }
.flip-front span { position:absolute; left:0; right:0; bottom:0; padding:12px 10px; background:rgba(36,51,31,0.82); color:var(--cream); font:800 21px "Montserrat"; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
/* Food outro mosaic. */
.tile { position:absolute; overflow:hidden; border-radius:22px; border:8px solid #fff; box-shadow:0 18px 36px rgba(36,51,31,0.35); z-index:3; }
.tile img { width:100%; height:100%; object-fit:cover; }
.tile span { position:absolute; left:14px; bottom:14px; padding:8px 16px; border-radius:999px; background:rgba(247,241,227,0.95); color:var(--soil); font:800 30px "Montserrat"; white-space:nowrap; }
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
<div class="brand" data-layout-ignore><b>✿</b>${esc(brand)}</div>
${caps.join("\n")}
</div>
<script>
const tl = gsap.timeline({ paused: true });
${js.join("\n")}
HyperShader.init({
  bgColor: "#131a10",
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
