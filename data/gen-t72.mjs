// "Thác 72 · Đắk Glung: Tây Nguyên hoang sơ" (22/11/2026): cẩm nang một con thác, chia 3 chặng (đường tới, xuống thác,
// cầu vồng), rồi ăn & ở, chi phí, nói thật. Nghiên cứu: research/tiktok.md (28 video), itinerary.md, cost.md, food-stay.md.
// Giọng chuẩn OmniVoice vi-nu-tre-03. Ba đoạn ngắm cảnh (breathe) giữ nguyên âm thanh gốc của clip TikTok, có câu dẫn
// "Sau đây là vài thước phim…" (người dùng yêu cầu 22/11/2026); giữa các chặng là một dải 4 ảnh (recap, quy tắc 20/11/2026).
// Quanh thác không có quán đạt chuẩn: thẻ "Ăn & ở" ghi món nên thử (không sao) + quán/chỗ ở ≥4.5★ có ảnh Google Maps.
// Run: node data/gen-t72.mjs
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { LINES } from "./script.mjs";

const slug = "thac-72-dak-glung";
const dir = `data/videos/${slug}`;
mkdirSync(dir, { recursive: true });
const voice = existsSync(`${dir}/voiceover.json`) ? JSON.parse(readFileSync(`${dir}/voiceover.json`, "utf8")).clips : {};

const SRC = {};
for (const file of ["research/cuts.txt", "research/cuts-audio.txt"]) {
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line.trim() || line.startsWith("#")) continue;
    const [name, src] = line.split("|").map((x) => x.trim());
    const tk = src.match(/raw-tiktok\/t72__(.+)__(\d+)\.mp4$/);
    if (tk) SRC[name] = { who: tk[1], id: tk[2] };
  }
}
const F = (f) => `videos/thac-72/footage/${f}.mp4`;
const g = (list) => list.map(F);
const dur = (name) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", `public/${F(name)}`]).toString().trim());

const COLD = 5.6;
const RECAP = 3.0;
const scenes = [
  {
    id: "hook", layout: "hook", caption: "THÁC 72", label: "Đắk Glung · Tây Nguyên", kicker: "HOT NHẤT TIKTOK · THÁNG 11/2026", voiceDelay: COLD,
    cold: g(["c-rainbow", "c-aerial", "c-bridge", "c-fall"]),
    narration: LINES.hook,
    gallery: g(["h-wide", "h-mist", "h-top"]),
  },
  {
    id: "d1", layout: "point", day: "1", label: "Chặng 1 · Đường tới thác", caption: "Về Tuy Đức", badge: "~50 km từ Gia Nghĩa",
    points: ["Xe Thu Hà / Đức Phong · BX Miền Đông", "Đoạn cuối: ổ gà, đất đỏ"],
    narration: LINES.d1,
    gallery: g(["r-aerial", "r-sign", "r-dirt", "r-trail"]),
    recap: ["h-wide", "r-aerial", "r-trail", "c-bridge"], recapLabel: "Chặng 1",
  },
  {
    id: "d2", layout: "point", day: "2", label: "Chặng 2 · Xuống chân thác", caption: "Cầu sắt, hang đá", badge: "vé ~90k · mở 7h",
    points: ["Bậc đá rêu trơn: mang giày bám", "Hang đá có bàn thờ Phật"],
    narration: LINES.d2,
    gallery: g(["x-bridge", "x-stairs", "x-mist", "x-cave", "x-lotus"]),
    breathe: ["b1-trail", "b1-falls"], breatheTitle: "Đường xuống thác",
  },
  {
    id: "d3", layout: "point", day: "3", label: "Chặng 3 · Chân thác", caption: "Săn cầu vồng", badge: "đẹp nhất T10–T11",
    points: ["Nắng gần trưa có cầu vồng", "Đi ngày thường, né chủ nhật"],
    narration: LINES.d3,
    gallery: g(["v-lotus", "v-arc", "v-big", "v-drone", "t-rail"]),
    breathe: ["b2-hello", "b2-falls", "b2-falls2"], breatheTitle: "Chân thác · 12/11/2026",
    recap: ["v-big", "x-bridge", "v-drone", "x-lotus"], recapLabel: "Chặng 3",
  },
  {
    id: "stay", layout: "extra", style: "stay", caption: "Ăn gì, ở đâu?", kicker: "QUANH THÁC ÍT QUÁN · CHỌN THẾ NÀY",
    items: [
      { t: "Gà nướng · cơm lam", s: "nhà hàng trong khu (theo review Maps)", cue: "gà nướng" },
      { t: "Chòi nướng ~200k", s: "ngày thường · được mang đồ vào", cue: "thuê chòi" },
      { t: "Sky Garden ★4.6", s: "món Tây Nguyên · Gia Nghĩa", cue: "sky garden", maps: "sky-garden" },
      { t: "Robin Hotel ★4.8", s: "Gia Nghĩa · hoặc Đức Lộc Phát ★4.5, Kiến Đức", cue: "robin", maps: ["robin", "duc-loc-phat"] },
    ],
    narration: LINES.stay,
    gallery: g(["s-boats", "s-cave", "s-bridge"]),
  },
  {
    id: "cost", layout: "cost", caption: "Hết bao nhiêu?", kicker: "TỰ TÚC TỪ SÀI GÒN · 2N1Đ · 1 NGƯỜI",
    total: "1,6–2,1 triệu", totalCue: "một phẩy sáu", stamp: "THAM KHẢO 11/2026",
    note: "chưa gồm ăn uống, xe Gia Nghĩa ⇄ thác · tour ghép kèm Tà Đùng ~2,29tr",
    items: [
      { k: "Xe khách SG ⇄ Gia Nghĩa", v: "540k–1tr" },
      { k: "Phòng Gia Nghĩa (ở 2)", v: "~900k" },
      { k: "Vé thác + gửi xe", v: "100–110k" },
      { k: "Chòi nướng (chia 4)", v: "~50k" },
    ],
    narration: LINES.cost,
    gallery: g(["k-flow", "k-wide"]),
  },
  {
    id: "truth", layout: "extra", caption: "Nói thật nè", kicker: "NGƯỜI ĐI TRƯỚC DẶN",
    items: [
      { t: "Ngoài đời nhỏ hơn flycam", s: "hoang sơ, đừng kỳ vọng quá", cue: "ngoài đời" },
      { t: "Đường vào xấu", s: "trò chơi trong khu thu tiền riêng", cue: "đường vào" },
      { t: "Mùa khô ít nước", s: "đẹp nhất tháng 10–11", cue: "mùa khô" },
    ],
    narration: LINES.truth,
    gallery: g(["t-flood", "t-dry", "t-dryrb"]),
    breathe: ["b3-walk", "b3-view"], breatheTitle: "Tiếng rừng Tây Nguyên",
  },
  {
    id: "outro", layout: "outro", caption: "Hẹn ở thác 72", cta: "Lưu lại nhé!",
    narration: LINES.outro,
    gallery: g(["o-aerial", "o-rain", "o-wide"]),
  },
];

const LEAD = 0.5;
const MIN = { hook: 0, point: 7, extra: 9, cost: 10, outro: 8.5 };
for (const s of scenes) {
  const v = voice[s.id]?.durationSec;
  const base = v ?? s.narration.length / 14;
  const breathe = (s.breathe ?? []).reduce((n, b) => n + dur(b), 0);
  s.durationSec = Math.ceil(Math.max(base + LEAD + (s.voiceDelay ?? 0) + 0.6, MIN[s.layout] ?? 0) * 2) / 2 + breathe + (s.recap ? RECAP : 0);
  if (s.breathe) { s.breatheSec = Math.round(breathe * 1000) / 1000; s.breathe = s.breathe.map((b) => ({ src: F(b), audio: `videos/thac-72/footage/${b}.m4a`, dur: dur(b) })); }
  if (s.recap) s.recapSec = RECAP;
}

const used = new Set(scenes.flatMap((s) => [...(s.gallery ?? []), ...(s.cold ?? []), ...(s.breathe ?? []).map((b) => b.src), ...(s.recap ?? []).map(F)]));
const credits = [...used].map((file) => {
  const name = file.split("/").pop().replace(".mp4", "");
  const src = SRC[name];
  if (!src) throw new Error(`no source for ${name}`);
  return { file, author: `@${src.who}`, source: `https://www.tiktok.com/@${src.who}/video/${src.id}`, license: "TikTok, dùng có ghi nguồn (người dùng đồng ý 16/11/2026)" };
});

const video = {
  id: slug, title: "Thác 72 Đắk Glung: Tây Nguyên hoang sơ", language: "vi", region: "Tuy Đức, Lâm Đồng (Đắk Nông cũ)", template: "travel-itinerary",
  format: { width: 1080, height: 1920, fps: 30 }, transitionFrames: 15,
  theme: { accent: "#d9a441", highlight: "#ffd27a", brand: "THÁC 72 · TÂY NGUYÊN" },
  narrator: { provider: "omnivoice", voice: "vi-nu-tre-03" }, subtitles: true,
  music: { src: "shared/music/travel-taynguyen.mp3", volume: 0.8 },
  maps: {},
  scenes,
};
writeFileSync(`${dir}/video.json`, JSON.stringify(video, null, 2) + "\n");
writeFileSync(`${dir}/credits.json`, JSON.stringify(credits, null, 2) + "\n");
console.log(slug, scenes.length, "scenes,", used.size, "clips,", scenes.reduce((n, s) => n + s.narration.length, 0), "chars,", scenes.reduce((n, s) => n + s.durationSec, 0).toFixed(1), "s");
