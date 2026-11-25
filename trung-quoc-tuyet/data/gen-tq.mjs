// "Tour ngắm tuyết Trung Quốc 6 triệu" (21/11/2026): Côn Minh – núi tuyết Kiệu Tử 4N3Đ, kèm so sánh Ngọc Long, Cáp Nhĩ Tân.
// Nghiên cứu: research/tiktok.md (28 video đọc lời thoại + bình luận), itinerary.md. Lời thoại: data/script.mjs.
// Giọng chuẩn OmniVoice vi-nu-tre-03 (người dùng yêu cầu không dùng Adam, 21/11/2026).
// Có những đoạn nghỉ không lời chỉ có footage + nhạc để ngắm cảnh (breatheSec, quy tắc 21/11/2026), và giữa hai địa
// điểm là một khung 3–4 ảnh (recap, quy tắc 20/11/2026). Không có thẻ quán ăn: tour đã bao ăn, Maps ở Trung Quốc ít dữ liệu.
// Run: node data/gen-tq.mjs
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { LINES } from "./script.mjs";

const slug = "tq-tuyet-kieu-tu";
const dir = `data/videos/${slug}`;
mkdirSync(dir, { recursive: true });
const voice = existsSync(`${dir}/voiceover.json`) ? JSON.parse(readFileSync(`${dir}/voiceover.json`, "utf8")).clips : {};

const SRC = {};
for (const line of readFileSync("research/cuts.txt", "utf8").split(/\r?\n/)) {
  if (!line.trim() || line.startsWith("#")) continue;
  const [name, src] = line.split("|").map((x) => x.trim());
  const tk = src.match(/raw-tiktok\/[^_]+__(.+)__(\d+)\.mp4$/);
  if (tk) SRC[name] = { who: tk[1], id: tk[2] };
}
const F = (f) => `videos/tq-tuyet/footage/${f}.mp4`;
const g = (list) => list.map(F);

const COLD = 5.5;
const RECAP = 3.0;
const BREATHE = 4.5;
const scenes = [
  {
    id: "hook", layout: "hook", caption: "6 TRIỆU", label: "ĐI NGẮM TUYẾT TRUNG QUỐC?", kicker: "TOUR ĐANG VIRAL · THÁNG 11/2026", voiceDelay: COLD,
    cold: g(["kt-stairs", "dc-blue", "kt-cablesnow", "kt-frost"]),
    narration: LINES.hook,
    gallery: g(["kt-snowland", "dc-gulls2", "km-park"]),
  },
  {
    id: "d1", layout: "point", day: "N1", label: "Ngày 1 · Hà Nội → Côn Minh", caption: "Lên tàu cao tốc", badge: "~5 tiếng",
    points: ["Xe giường nằm Hà Nội → Lào Cai", "Cửa khẩu Hà Khẩu → tàu cao tốc"],
    narration: LINES.d1,
    gallery: g(["km-train", "km-ginkgo", "km-night", "km-tower"]),
  },
  {
    id: "d2", layout: "point", day: "N2", label: "Ngày 2 · Núi tuyết Kiệu Tử", caption: "Kiệu Tử phủ băng", badge: "gần 4.000 m",
    points: ["2 chặng cáp treo", "Cách Côn Minh ~150 km"],
    narration: LINES.d2,
    gallery: g(["kt-cablesnow", "kt-snowland", "kt-cliff", "kt-rock", "kt-cable2", "kt-frost"]),
    breathe: F("kt-stairs"),
    recap: ["kt-summit", "kt-platform", "kt-ice", "kt-cabin"], recapLabel: "Ngày 2",
  },
  {
    id: "d3", layout: "point", day: "N3", label: "Ngày 3 · Côn Minh", caption: "Hải âu Điền Trì", badge: "T11–T3",
    points: ["Hải âu Siberia về trú đông", "Tối: Kim Mã Bích Kê, chợ đêm"],
    narration: LINES.d3,
    gallery: g(["dc-gulls2", "dc-dusk", "lng-red", "dc-sunset", "km-kmbk", "km-market"]),
    breathe: F("dc-blue"),
    recap: ["km-tower", "km-gate", "lau-nam", "km-park"], recapLabel: "Ngày 3",
  },
  {
    id: "d4", layout: "point", day: "N4", label: "Ngày 4 · về Hà Nội", caption: "Quan Độ cổ trấn", badge: "tàu về",
    points: ["Hoặc chợ hoa Đấu Nam"],
    narration: LINES.d4,
    gallery: g(["qd-aerial", "km-night"]),
  },
  {
    id: "truth", layout: "extra", caption: "Nói thật nè", kicker: "NGƯỜI ĐI TRƯỚC DẶN",
    items: [
      { t: "Tuyết hên xui", s: "có đợt lên núi nắng, không tuyết", cue: "tuyết là thời tiết" },
      { t: "Côn Minh mưa → núi có tuyết", s: "theo dõi thời tiết Kiệu Tử", cue: "côn minh mưa" },
      { t: "Gần 4.000 m", s: "cần sức khoẻ, mặc thật ấm", cue: "sức khoẻ" },
    ],
    narration: LINES.truth,
    gallery: g(["kt-snowland", "kt-stairs", "kt-frost"]),
  },
  {
    id: "cost", layout: "cost", caption: "Giá bao nhiêu?", kicker: "TOUR TRỌN GÓI 4N3Đ · 1 NGƯỜI",
    receiptTitle: "CÔN MINH – KIỆU TỬ", total: "6–7 triệu", totalCue: "sáu đến bảy", stamp: "THAM KHẢO 11/2026",
    note: "Giá các tour quảng cáo trên TikTok 11/2026",
    items: [
      { k: "Visa đoàn + xe HN ⇄ Lào Cai", v: "✓ gồm" },
      { k: "Tàu cao tốc khứ hồi", v: "✓ gồm" },
      { k: "Khách sạn 3–4★ + ăn đoàn", v: "✓ gồm" },
      { k: "Cáp treo Kiệu Tử", v: "✓ gồm" },
      { k: "Tip HDV, phụ thu, đồ ấm", v: "hỏi kỹ" },
    ],
    narration: LINES.cost,
    gallery: g(["km-park", "dc-gulls"]),
  },
  {
    id: "compare", layout: "extra", style: "compare", caption: "Hay đi đâu?", kicker: "3 CHỖ NGẮM TUYẾT",
    items: [
      { t: "Kiệu Tử · Côn Minh", s: "~6–7tr · 4N3Đ · tuyết hên xui", cue: "côn minh" },
      { t: "Ngọc Long · Lệ Giang", s: "~17tr · hỏi kỹ cáp lên mốc 4.680 m", cue: "ngọc long" },
      { t: "Cáp Nhĩ Tân", s: "từ ~30tr · −20°C · đẹp T12–T1", cue: "cáp nhĩ tân" },
    ],
    narration: LINES.compare,
    gallery: g(["nl-gold", "nl-peak", "hb-village", "hb-castle", "hb-iceworld"]),
    breathe: F("hb-village2"),
  },
  {
    id: "outro", layout: "outro", caption: "Bạn chọn đâu?", cta: "Lưu lại nhé!",
    narration: LINES.outro,
    gallery: g(["kt-rock", "dc-blue", "hb-roofs"]),
  },
];

const LEAD = 0.5;
const MIN = { hook: 0, point: 7, extra: 8.5, cost: 9.5, outro: 9 };
for (const s of scenes) {
  const v = voice[s.id]?.durationSec;
  const base = v ?? s.narration.length / 14;
  s.durationSec = Math.ceil(Math.max(base + LEAD + (s.voiceDelay ?? 0) + 0.8, MIN[s.layout] ?? 0) * 2) / 2 + (s.breathe ? BREATHE : 0) + (s.recap ? RECAP : 0);
  if (s.breathe) s.breatheSec = BREATHE;
  if (s.recap) s.recapSec = RECAP;
}

const used = new Set(scenes.flatMap((s) => [...(s.gallery ?? []), ...(s.cold ?? []), ...(s.breathe ? [s.breathe] : []), ...(s.recap ?? []).map(F)]));
const credits = [...used].map((file) => {
  const name = file.split("/").pop().replace(".mp4", "");
  const src = SRC[name];
  if (!src) throw new Error(`no source for ${name}`);
  return { file, author: `@${src.who}`, source: `https://www.tiktok.com/@${src.who}/video/${src.id}`, license: "TikTok, dùng có ghi nguồn (người dùng đồng ý 16/11/2026)" };
});

const video = {
  id: slug, title: "Tour ngắm tuyết Trung Quốc 6 triệu: Kiệu Tử có đáng?", language: "vi", region: "Côn Minh, Vân Nam, Trung Quốc", template: "travel-itinerary",
  format: { width: 1080, height: 1920, fps: 30 }, transitionFrames: 15,
  theme: { accent: "#5fc3ff", highlight: "#ffd76a", brand: "SĂN TUYẾT TRUNG QUỐC" },
  narrator: { provider: "omnivoice", voice: "vi-nu-tre-03" }, subtitles: true,
  music: { src: "shared/music/travel-winter.mp3", volume: 0.8 },
  maps: {},
  scenes,
};
writeFileSync(`${dir}/video.json`, JSON.stringify(video, null, 2) + "\n");
writeFileSync(`${dir}/credits.json`, JSON.stringify(credits, null, 2) + "\n");
console.log(slug, scenes.length, "scenes,", used.size, "clips,", scenes.reduce((n, s) => n + s.narration.length, 0), "chars,", scenes.reduce((n, s) => n + s.durationSec, 0), "s");
