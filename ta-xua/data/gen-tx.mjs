// "Tà Xùa: săn thác mây" (23/11/2026): cẩm nang 2N1Đ từ Hà Nội, 4 chặng (đường lên, săn mây, thảo nguyên – mỏm cá heo
// – cây cô đơn, sống lưng khủng long), rồi ăn & ở, chi phí, nói thật. Nghiên cứu: research/tiktok.md (36 video),
// itinerary.md, cost.md, food-stay.md. Giọng chuẩn OmniVoice vi-nu-tre-03. Ba đoạn ngắm cảnh (breathe) giữ nguyên âm
// thanh gốc của clip TikTok, có câu dẫn "Sau đây là vài thước phim…" (người dùng yêu cầu 22/11/2026); sau chặng 2 và 4
// là một dải 4 ảnh (recap, quy tắc 20/11/2026). Quán, homestay ≥4.5★ có ảnh Google Maps; quán viral dưới chuẩn nêu ở "Nói thật".
// Run: node data/gen-tx.mjs
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { LINES } from "./script.mjs";

const slug = "ta-xua-san-may";
const dir = `data/videos/${slug}`;
mkdirSync(dir, { recursive: true });
const voice = existsSync(`${dir}/voiceover.json`) ? JSON.parse(readFileSync(`${dir}/voiceover.json`, "utf8")).clips : {};

const SRC = {};
for (const file of ["research/cuts.txt", "research/cuts-audio.txt"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line.trim() || line.startsWith("#")) continue;
    const [name, src] = line.split("|").map((x) => x.trim());
    const tk = src.match(/raw-tiktok\/tx__(.+)__(\d+)\.mp4$/);
    if (tk) SRC[name] = { who: tk[1], id: tk[2] };
  }
}
const F = (f) => `videos/ta-xua/footage/${f}.mp4`;
const g = (list) => list.map(F);
// Footage may not be cut yet when the voice is synthesised; rerun after cut.sh so the breaks get their real length.
const dur = (name) => existsSync(`public/${F(name)}`) ? Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", `public/${F(name)}`]).toString().trim()) : 0;

const COLD = 5.6;
const RECAP = 3.0;
const scenes = [
  {
    id: "hook", layout: "hook", caption: "TÀ XÙA", label: "Thác mây · Bắc Yên, Sơn La", kicker: "THÁC MÂY 11/11/2026", voiceDelay: COLD,
    cold: g(["c-loi", "c-fly", "c-tank", "c-sea"]),
    narration: LINES.hook,
    gallery: g(["h-khen", "h-hilary", "h-annuoc"]),
  },
  {
    id: "d1", layout: "point", day: "1", label: "Chặng 1 · Đường lên", caption: "Hà Nội → Tà Xùa", badge: "~240 km · xe đêm 21h30",
    points: ["Cabin, giường nằm khứ hồi 550–700k", "Xe máy 150–200k/ngày"],
    narration: LINES.d1,
    gallery: g(["r-dawn", "r-traffic", "r-flower", "r-window"]),
  },
  {
    id: "d2", layout: "point", day: "2", label: "Chặng 2 · Săn mây", caption: "Đỉnh Gió · Khe Cải", badge: "5h30–7h30 sáng",
    points: ["21h: độ ẩm >85%, gió <5 km/h", "Đêm mưa, sáng nắng: dễ có mây"],
    narration: LINES.d2,
    gallery: g(["m-mami", "m-chung", "m-diep", "m-loi"]),
    breathe: ["b1-cloud", "b1-boat"], breatheTitle: "Săn mây · Tà Xùa",
    recap: ["h-khen", "m-chung", "m-diep", "c-sea"], recapLabel: "Chặng 2",
  },
  {
    id: "d3", layout: "point", day: "3", label: "Chặng 3 · Cung thảo nguyên", caption: "Cây cô đơn", badge: "hoàng hôn ~17h30",
    points: ["Thảo nguyên 35k · mỏm cá heo 5k", "Cây cô đơn 25k, hoa đang nở"],
    narration: LINES.d3,
    gallery: g(["t-grass", "t-lan", "t-dolphin", "t-lone", "t-sunset"]),
    breathe: ["b2-grass", "b2-dolphin"], breatheTitle: "Thảo nguyên · mỏm cá heo",
  },
  {
    id: "d4", layout: "point", day: "4", label: "Chặng 4 · Sống lưng khủng long", caption: "Bình minh trên mây", badge: "~15 km · xe ôm ~100k",
    points: ["Đường đá, một bên vực", "Gửi xe, đi xe ôm bản địa"],
    narration: LINES.d4,
    gallery: g(["s-flycam", "s-ridge", "s-moto", "s-dawn"]),
    breathe: ["b3-xeom", "b3-dawn"], breatheTitle: "Đường ra sống lưng",
    recap: ["t-lone", "t-dolphin", "s-flycam", "t-sunset"], recapLabel: "Chặng 3 & 4",
  },
  {
    id: "stay", layout: "extra", style: "stay", caption: "Ăn gì, ở đâu?", kicker: "≥4.5★ GOOGLE MAPS · CHECK 23/11",
    items: [
      { t: "Phở gà đen ~35k", s: "trung tâm · đùi thêm 25k/lạng", cue: "phở gà đen" },
      { t: "Lẩu gà lá é É ee ★4.9", s: "cổng chào · hoặc Xuân Thì ★4.8", cue: "lẩu gà", maps: ["lau-ga-la-e", "xuan-thi"] },
      { t: "ManDo ★4.8 · Pơ Mu ★4.6", s: "homestay trung tâm, kính, đệm sưởi", cue: "mando", maps: ["mando", "pomu"] },
      { t: "Cuối tuần: đặt trước", s: "mùa mây cháy phòng", cue: "cuối tuần" },
    ],
    narration: LINES.stay,
    gallery: g(["f-food", "f-window", "f-cloud"]),
  },
  {
    id: "cost", layout: "cost", caption: "Hết bao nhiêu?", kicker: "TỰ TÚC TỪ HÀ NỘI · 2N1Đ · 1 NGƯỜI",
    total: "1,5–2,2 triệu", totalCue: "một phẩy năm", stamp: "THAM KHẢO 11/2026",
    note: "tour 2N1Đ từ Hà Nội ~2,48tr (PYS Travel)",
    items: [
      { k: "Xe khứ hồi (cabin, giường nằm)", v: "550–700k" },
      { k: "Phòng 1 đêm (ở 2)", v: "250–500k" },
      { k: "Xe máy + xăng (chia 2)", v: "100–150k" },
      { k: "Vé điểm + xe ôm sống lưng", v: "150–200k" },
      { k: "Ăn uống, cà phê", v: "400–600k" },
    ],
    narration: LINES.cost,
    gallery: g(["k-sea", "k-hilary"]),
  },
  {
    id: "truth", layout: "extra", caption: "Nói thật nè", kicker: "NGƯỜI ĐI TRƯỚC DẶN",
    items: [
      { t: "Quán viral ≠ quán ngon", s: "Vị Nhà ★3.8 trên Google Maps", cue: "vị nhà", maps: "vi-nha" },
      { t: "Cuối tuần tắc đường", s: "có lúc mất điện, mất nước", cue: "tắc đường" },
      { t: "Đêm dưới 10°C", s: "mây là trời cho, không hứa trước", cue: "mười độ" },
    ],
    narration: LINES.truth,
    gallery: g(["x-traffic", "x-mist", "x-fog"]),
  },
  {
    id: "outro", layout: "outro", caption: "Hẹn ở Tà Xùa", cta: "Lưu lại nhé!",
    narration: LINES.outro,
    gallery: g(["o-sunset", "o-sea", "o-fly"]),
  },
];

const LEAD = 0.5;
const MIN = { hook: 0, point: 7, extra: 9, cost: 10, outro: 8.5 };
for (const s of scenes) {
  const v = voice[s.id]?.durationSec;
  const base = v ?? s.narration.length / 14;
  const breathe = (s.breathe ?? []).reduce((n, b) => n + dur(b), 0);
  s.durationSec = Math.ceil(Math.max(base + LEAD + (s.voiceDelay ?? 0) + 0.6, MIN[s.layout] ?? 0) * 2) / 2 + breathe + (s.recap ? RECAP : 0);
  if (s.breathe) { s.breatheSec = Math.round(breathe * 1000) / 1000; s.breathe = s.breathe.map((b) => ({ src: F(b), audio: `videos/ta-xua/footage/${b}.m4a`, dur: dur(b) })); }
  if (s.recap) s.recapSec = RECAP;
}

const used = new Set(scenes.flatMap((s) => [...(s.gallery ?? []), ...(s.cold ?? []), ...(s.breathe ?? []).map((b) => b.src), ...(s.recap ?? []).map(F)]));
const credits = [...used].map((file) => {
  const name = file.split("/").pop().replace(".mp4", "");
  const src = SRC[name];
  if (!src) return null;
  return { file, author: `@${src.who}`, source: `https://www.tiktok.com/@${src.who}/video/${src.id}`, license: "TikTok, dùng có ghi nguồn (người dùng đồng ý 16/11/2026)" };
}).filter(Boolean);
if (Object.keys(SRC).length && credits.length < used.size) throw new Error(`no source for ${[...used].filter((f) => !credits.some((c) => c.file === f)).join(", ")}`);

const video = {
  id: slug, title: "Tà Xùa: săn thác mây", language: "vi", region: "Tà Xùa, Bắc Yên, Sơn La", template: "travel-itinerary",
  format: { width: 1080, height: 1920, fps: 30 }, transitionFrames: 15,
  theme: { accent: "#7fb6d9", highlight: "#e8f4ff", brand: "TÀ XÙA · SĂN MÂY" },
  narrator: { provider: "omnivoice", voice: "vi-nu-tre-03" }, subtitles: true,
  music: { src: "shared/music/travel-hmong.mp3", volume: 0.8 },
  maps: {},
  scenes,
};
writeFileSync(`${dir}/video.json`, JSON.stringify(video, null, 2) + "\n");
writeFileSync(`${dir}/credits.json`, JSON.stringify(credits, null, 2) + "\n");
console.log(slug, scenes.length, "scenes,", used.size, "clips,", scenes.reduce((n, s) => n + s.narration.length, 0), "chars,", scenes.reduce((n, s) => n + s.durationSec, 0).toFixed(1), "s");
