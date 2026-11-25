// "Đồi Bò Sa Pa: săn biển mây" (24/11/2026): cẩm nang 2N1Đ từ Hà Nội, 3 chặng (đường xuyên vườn su su, leo đồi gặp đàn
// bò, biển mây sáng/chiều + cắm trại), rồi ăn & ở, chi phí, nói thật. Nghiên cứu: research/tiktok.md (35 video),
// itinerary.md, cost.md, food-stay.md. Giọng chuẩn OmniVoice vi-nu-tre-03. Ba đoạn ngắm cảnh (breathe) giữ nguyên âm
// thanh gốc của clip TikTok, có câu dẫn "Sau đây là vài thước phim…" (người dùng yêu cầu 22/11/2026); sau chặng 2 và 3
// là một dải 4 ảnh (recap, quy tắc 20/11/2026). Quán, chỗ ở ≥4.5★ có ảnh Google Maps.
// Run: node data/gen-db.mjs
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { LINES } from "./script.mjs";

const slug = "doi-bo-san-may";
const dir = `data/videos/${slug}`;
mkdirSync(dir, { recursive: true });
const voice = existsSync(`${dir}/voiceover.json`) ? JSON.parse(readFileSync(`${dir}/voiceover.json`, "utf8")).clips : {};

const SRC = {};
for (const file of ["research/cuts.txt", "research/cuts-audio.txt"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line.trim() || line.startsWith("#")) continue;
    const [name, src] = line.split("|").map((x) => x.trim());
    const tk = src.match(/raw-tiktok\/[a-z0-9]+__(.+)__(\d+)\.mp4$/);
    if (tk) SRC[name] = { who: tk[1], id: tk[2] };
  }
}
const F = (f) => `videos/doi-bo/footage/${f}.mp4`;
const g = (list) => list.map(F);
// Footage may not be cut yet when the voice is synthesised; rerun after cut.sh so the breaks get their real length.
const dur = (name) => existsSync(`public/${F(name)}`) ? Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", `public/${F(name)}`]).toString().trim()) : 0;

const COLD = 5.6;
const RECAP = 3.0;
const scenes = [
  {
    id: "hook", layout: "hook", caption: "ĐỒI BÒ", label: "Tả Phìn · Sa Pa · ~2.400 m", kicker: "BIỂN MÂY 23/11/2026", voiceDelay: COLD,
    cold: g(["c-sea", "c-cows", "c-run", "c-sunset"]),
    narration: LINES.hook,
    gallery: g(["h-sea", "h-cloud", "h-ridge"]),
  },
  {
    id: "d1", layout: "point", day: "1", label: "Chặng 1 · Đường lên", caption: "Xuyên vườn su su", badge: "~7 km · Ô Quy Hồ cũ",
    points: ["Maps: tìm “Thảo Nguyên Nhỏ”", "Xe máy chỉ lên ~2/3 · nên đi xe ôm"],
    narration: LINES.d1,
    gallery: g(["r-road", "r-lane", "r-susu", "r-xeom"]),
    breathe: ["b1-susu"], breatheTitle: "Đường xuyên vườn su su",
  },
  {
    id: "d2", layout: "point", day: "2", label: "Chặng 2 · Leo đồi", caption: "Đàn bò trên đồi", badge: "đi bộ 1–2 tiếng",
    points: ["Ngã rẽ: theo mũi tên vẽ dưới đất", "Lán nghỉ có mì tôm, nước"],
    narration: LINES.d2,
    gallery: g(["t-trail", "t-meadow", "t-lan", "t-cows", "t-valley"]),
    breathe: ["b2-walk", "b2-cows"], breatheTitle: "Trên Đồi Bò",
    recap: ["r-susu", "t-trail", "t-cows", "t-valley"], recapLabel: "Chặng 1 & 2",
  },
  {
    id: "d3", layout: "point", day: "3", label: "Chặng 3 · Săn mây", caption: "Biển mây ~2.400 m", badge: "5h–8h sáng · hoặc chiều",
    points: ["Hôm trước mưa, hôm sau nắng: dễ có mây", "Cắm trại: đêm ngắm sao"],
    narration: LINES.d3,
    gallery: g(["s-sea", "s-redhill", "s-sunset", "s-camp", "s-walk"]),
    breathe: ["b3-sea", "b3-dawn"], breatheTitle: "Biển mây Đồi Bò",
    recap: ["s-sea", "s-redhill", "s-sunset", "s-camp"], recapLabel: "Chặng 3",
  },
  {
    id: "stay", layout: "extra", style: "stay", caption: "Ăn gì, ở đâu?", kicker: "≥4.5★ GOOGLE MAPS · CHECK 24/11",
    items: [
      { t: "Lẩu cá tầm A Phủ ★4.7", s: "15 Fansipan · 3.987 đánh giá", cue: "a phủ", maps: ["a-phu"] },
      { t: "Thắng cố A Quỳnh ★4.6", s: "15 Thạch Sơn · gà: Tuk Tuk ★4.9", cue: "thắng cố", maps: ["a-quynh", "tuk-tuk"] },
      { t: "Sapa Centre ★4.8 · Mega View ★4.8", s: "trung tâm, đi bộ ra nhà thờ Đá", cue: "sapa centre", maps: ["sapa-centre", "mega-view"] },
      { t: "The Link Farmstay ★4.8", s: "yên tĩnh, nhìn ra núi", cue: "the link", maps: ["link-farmstay"] },
    ],
    narration: LINES.stay,
    gallery: g(["f-tent", "f-lamp", "f-hill"]),
  },
  {
    id: "cost", layout: "cost", caption: "Hết bao nhiêu?", kicker: "TỰ TÚC TỪ HÀ NỘI · 2N1Đ · 1 NGƯỜI",
    total: "1,5–2,2 triệu", totalCue: "một phẩy năm", stamp: "THAM KHẢO 11/2026",
    note: "chưa tính xe ôm qua vườn su su (hỏi giá trước) · dẫn đường + flycam ~600k/người",
    items: [
      { k: "Xe khách khứ hồi (giường, cabin)", v: "480–780k" },
      { k: "Phòng 1 đêm (ở 2)", v: "290–360k" },
      { k: "Xe máy 2 ngày (chia 2)", v: "100–200k" },
      { k: "Ăn uống 2 ngày", v: "600–900k" },
    ],
    narration: LINES.cost,
    gallery: g(["k-sea", "k-run"]),
  },
  {
    id: "truth", layout: "extra", caption: "Nói thật nè", kicker: "NGƯỜI ĐI TRƯỚC DẶN",
    items: [
      { t: "Chưa có biển chỉ dẫn", s: "có nhóm lạc trong rừng cả tiếng", cue: "biển chỉ dẫn" },
      { t: "Mưa xong: đường su su rất trơn", s: "xe ga dễ trượt", cue: "trơn" },
      { t: "Đỉnh đồi gió to, rét", s: "mây là trời cho, có hôm chỉ có sương", cue: "gió to" },
    ],
    narration: LINES.truth,
    gallery: g(["x-fog", "x-mud", "x-wind"]),
  },
  {
    id: "outro", layout: "outro", caption: "Hẹn ở Đồi Bò", cta: "Lưu lại nhé!",
    narration: LINES.outro,
    gallery: g(["o-walk", "o-sunset", "o-lamp"]),
  },
];

const LEAD = 0.5;
const MIN = { hook: 0, point: 7, extra: 9, cost: 10, outro: 8.5 };
for (const s of scenes) {
  const v = voice[s.id]?.durationSec;
  const base = v ?? s.narration.length / 14;
  const breathe = (s.breathe ?? []).reduce((n, b) => n + dur(b), 0);
  s.durationSec = Math.ceil(Math.max(base + LEAD + (s.voiceDelay ?? 0) + 0.6, MIN[s.layout] ?? 0) * 2) / 2 + breathe + (s.recap ? RECAP : 0);
  if (s.breathe) { s.breatheSec = Math.round(breathe * 1000) / 1000; s.breathe = s.breathe.map((b) => ({ src: F(b), audio: `videos/doi-bo/footage/${b}.m4a`, dur: dur(b) })); }
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
  id: slug, title: "Đồi Bò Sa Pa: săn biển mây", language: "vi", region: "Đồi Bò, Tả Phìn, Sa Pa, Lào Cai", template: "travel-itinerary",
  format: { width: 1080, height: 1920, fps: 30 }, transitionFrames: 15,
  theme: { accent: "#e0a43c", highlight: "#fff6e0", brand: "ĐỒI BÒ · SA PA" },
  narrator: { provider: "omnivoice", voice: "vi-nu-tre-03" }, subtitles: true,
  music: { src: "shared/music/travel-pastoral.mp3", volume: 0.42 },
  maps: {},
  scenes,
};
writeFileSync(`${dir}/video.json`, JSON.stringify(video, null, 2) + "\n");
writeFileSync(`${dir}/credits.json`, JSON.stringify(credits, null, 2) + "\n");
console.log(slug, scenes.length, "scenes,", used.size, "clips,", scenes.reduce((n, s) => n + s.narration.length, 0), "chars,", scenes.reduce((n, s) => n + s.durationSec, 0).toFixed(1), "s");
