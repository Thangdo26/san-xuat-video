// Hà Giang 3N2Đ (+ gợi ý ngày 4), làm lại từ đầu (người dùng yêu cầu 20/11/2026), giọng Adam nói nhanh ~x1,4 (21/11/2026).
// Nghiên cứu: 33 video TikTok du lịch đọc trọn lời thoại + bình luận (research/tiktok.md #n), báo (itinerary.md),
// Google Maps kiểm tra 21/11/2026 (food.md, stay.md), chi phí (cost.md). Lời thoại: data/script.mjs.
// Footage: clip TikTok (ghi nguồn trên màn hình + mô tả) và Pexels, danh sách cắt ở research/cuts.txt.
// Mở đầu: vài giây footage + nhạc, chưa có giọng (quy tắc 16/11/2026); giữa hai ngày là một xấp 3–4 ảnh của ngày vừa đi (20/11/2026).
// Run: node data/gen-hg2.mjs
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { TRAVEL } from "./script.mjs";

const slug = "ha-giang-3n2d-v2";
const dir = `data/videos/${slug}`;
mkdirSync(dir, { recursive: true });
const voice = existsSync(`${dir}/voiceover.json`) ? JSON.parse(readFileSync(`${dir}/voiceover.json`, "utf8")).clips : {};

// Source of every cut: research/cuts.txt "name | raw-tiktok/<tag>__<author>__<id>.mp4 | ..." or raw-pexels/<id>.mp4 (author in the note).
const SRC = {};
for (const line of readFileSync("research/cuts.txt", "utf8").split(/\r?\n/)) {
  if (!line.trim() || line.startsWith("#")) continue;
  const [name, src, , , note] = line.split("|").map((x) => x.trim());
  const tk = src.match(/raw-tiktok\/[^_]+__(.+)__(\d+)\.mp4$/);
  if (tk) SRC[name] = { who: tk[1], id: tk[2] };
  const px = src.match(/raw-pexels\/(\d+)\.mp4$/);
  if (px) SRC[name] = { who: `pexels:${(note.match(/\(([^)]+)\)\s*$/) || [, "Pexels"])[1]}`, id: px[1] };
}
const F = (f) => `videos/ha-giang/footage/${f}.mp4`;
const g = (list) => list.map(F);
const d = (dish, place, address, rating, spokenAs) => ({ name: dish, place, address, ...(rating == null ? {} : { rating }), ...(spokenAs ? { spokenAs } : {}) });

const COLD = 6.0;
const RECAP = 3.0;
const scenes = [
  {
    id: "hook", layout: "hook", caption: "HÀ GIANG", label: "3 NGÀY 2 ĐÊM", kicker: "MÙA TAM GIÁC MẠCH · CUỐI THÁNG 11", sub: "+ gợi ý ngày 4", voiceDelay: COLD,
    cold: g(["nq-sparkle", "tm-fly", "lc-flag", "mpl-fly1", "tgm-flower"]),
    narration: TRAVEL.hook,
    gallery: g(["mpl-flag", "tgm-village", "loop-serp"]),
  },
  {
    id: "d1", layout: "point", day: "N1", label: "Ngày 1 · QL4C", caption: "Quản Bạ → Lô Lô", badge: "~180 km",
    points: ["Cây cô đơn = đúng đường Cán Tỷ", "Tới Lô Lô trước 17h, trời tối sớm"],
    narration: TRAVEL.d1,
    gallery: g(["px-road", "loop-road", "tm-fly2", "px-thamma", "tgm-field", "tm-crowd2"]),
    recap: ["tm-fly", "loop-serp", "tgm-flower", "tm-crowd"], recapLabel: "Ngày 1",
    cardTitle: "ĂN DỌC ĐƯỜNG",
    dishes: [d("Cơm trưa", "Lan Anh Restaurant", "192 QL4C, Quản Bạ", 4.8), d("Cơm, phở", "Ngọc Tuyên", "cổng chào Yên Minh", 4.9), d("Tối ở Lô Lô", "Lalaland Restaurant", "Lô Lô Chải", 4.9)],
  },
  {
    id: "d2", layout: "point", day: "N2", label: "Ngày 2 · Lũng Cú → Nho Quế", caption: "Mã Pì Lèng", badge: "thuyền 150k",
    points: ["Maps: \"bến thuyền hẻm Tu Sản\"", "Cơm view sông: tới trước 11h"],
    narration: TRAVEL.d2,
    gallery: g(["lc-tower", "lc-pond", "mpl-fly2", "nq-view", "nq-boats", "px-nq-boat", "dv-fire"]),
    recap: ["lc-flag", "mpl-gorge", "nq-sparkle2", "dv-dance"], recapLabel: "Ngày 2",
    cardTitle: "ĂN · NGHỈ CHÂN",
    dishes: [d("Cà phê view hẻm", "Tu Sản Coffee", "đèo Mã Pì Lèng", 4.9), d("Lẩu gà đen, ngựa", "Thạch Sơn quán", "chợ cổ Đồng Văn", 4.9), d("Cơm, lẩu", "Thao Linh", "phố cổ Đồng Văn", 4.8)],
  },
  {
    id: "d3", layout: "point", day: "N3", label: "Ngày 3 · Đồng Văn → TP", caption: "Chợ phiên & về", badge: "Chủ nhật",
    points: ["Về: tìm \"dừng chân dốc Cán Tỷ\"", "Đừng theo Maps vào đường rừng thông"],
    narration: TRAVEL.d3,
    gallery: g(["cho-fire", "pho-stall", "cho-walk", "px-moto", "mpl-road"]),
    recap: ["pho-bowls", "px-fog", "mpl-drive"], recapLabel: "Ngày 3",
    cardTitle: "ĂN SÁNG ĐỒNG VĂN",
    dishes: [d("Phở lợn bản", "Phở chợ Đồng Văn", "quán bà Dung, trong chợ", null, "phở"), d("Cơm, lẩu", "Nhà hàng Tùng Phúc", "số 135 Đồng Văn", 4.9), d("Ăn sáng, cà phê", "Ethnic House", "15 Phố Cổ", 4.8)],
  },
  {
    id: "extra", layout: "extra", day: "+1", caption: "Thêm ngày 4?", kicker: "ĐI 4N3Đ THÌ THÊM",
    items: [
      { t: "Ngủ Mèo Vạc", s: "Cao nguyên đá homestay ★4.8", cue: "Mèo Vạc" },
      { t: "Về bằng cung Du Già", s: "đẹp nhất, đường xấu, vắng", cue: "Du Già" },
      { t: "Đổ đầy bình xăng", s: "dọc đường ít cây xăng", cue: "đổ đầy" },
    ],
    narration: TRAVEL.extra,
    gallery: g(["dg-road", "dg-valley", "px-pavi", "dg-terrace", "dg-road2"]),
  },
  {
    id: "stay", layout: "stay", caption: "Ngủ ở đâu?",
    zones: [
      { title: "Lô Lô Chải · Thèn Pả", note: "Đêm 1 · yên tĩnh, gần Lũng Cú", picks: [["Ma Pi Leng Homestay", 4.9, "Cẳng Tẳng, Lũng Cú"], ["Thing 0 Homestay", 4.9, "Lô Lô Chải"]] },
      { title: "Phố cổ Đồng Văn", note: "Đêm 2 · vui, tối thứ 7 lửa trại", picks: [["PiTu Homestay", 5.0, "Phố Cổ, Đồng Văn"], ["CiCi homestay", 4.7, "Đồng Văn"]] },
    ],
    tip: "Mùa hoa đông lắm: đặt phòng trước",
    cues: ["lô lô", "phố cổ", "đặt phòng"],
    narration: TRAVEL.stay,
    gallery: g(["lc-wide", "dv-fire2", "dv-crowd"]),
  },
  {
    id: "cost", layout: "cost", caption: "Hết bao nhiêu?", kicker: "TỰ TÚC TỪ HÀ NỘI · 1 NGƯỜI",
    receiptTitle: "HÀ GIANG 3N2Đ", total: "2,8–3,3tr", totalCue: "ba triệu", stamp: "THAM KHẢO 21/11/2026",
    note: "Nguồn: review TikTok 2026, Dân Việt (vé thuyền)",
    items: [
      { k: "Xe giường nằm khứ hồi", v: "650–700k" },
      { k: "Phòng 2 đêm (ở 2 người)", v: "500–800k" },
      { k: "Thuê Wave 3 ngày + xăng", v: "350–420k" },
      { k: "Vé: thuyền 150k, Lũng Cú 70k…", v: "≈250k" },
      { k: "Ăn uống 3 ngày", v: "1–1,2tr" },
    ],
    narration: TRAVEL.cost,
    gallery: g(["px-nq-wide", "px-fog"]),
  },
  {
    id: "outro", layout: "outro", caption: "Hà Giang chờ bạn", kicker: "3 ĐIỀU NHỚ", cta: "Lưu lại nhé!",
    tips: ["Mang bằng lái", "Giữ xăng đầy bình", "Áo ấm + áo mưa"],
    tipCues: ["bằng lái", "xăng", "áo ấm"],
    routeStops: ["Km0", "Quản Bạ", "Thẩm Mã", "Lô Lô Chải", "Lũng Cú", "Đồng Văn", "Mã Pì Lèng", "Nho Quế"],
    narration: TRAVEL.outro,
    gallery: g(["px-nq-gorge", "px-nq-curve", "px-nq-ben"]),
  },
];

// Durations: voice + lead-in (+ cold open) + 1 s tail, never shorter than the layout needs, rounded up to 0.5 s;
// a stop with a recap gets RECAP more seconds at its end.
const LEAD = 0.5;
const MIN = { hook: 0, point: 9, extra: 8, stay: 9, cost: 9.5, outro: 12 };
for (const s of scenes) {
  const v = voice[s.id]?.durationSec;
  const base = v ?? s.narration.length / 20;
  s.durationSec = Math.ceil(Math.max(base + LEAD + (s.voiceDelay ?? 0) + 1.0, MIN[s.layout] ?? 0) * 2) / 2 + (s.recap ? RECAP : 0);
  if (s.recap) s.recapSec = RECAP;
}

const used = new Set(scenes.flatMap((s) => [...(s.gallery ?? []), ...(s.cold ?? []), ...(s.recap ?? []).map(F)]));
const credits = [...used].map((file) => {
  const name = file.split("/").pop().replace(".mp4", "");
  const src = SRC[name];
  if (!src) throw new Error(`no source for ${name}`);
  if (src.who.startsWith("pexels:")) return { file, author: `Pexels · ${src.who.slice(7)}`, source: `https://www.pexels.com/video/${src.id}/`, license: "Pexels License" };
  return { file, author: `@${src.who}`, source: `https://www.tiktok.com/@${src.who}/video/${src.id}`, license: "TikTok, dùng có ghi nguồn (người dùng đồng ý 16/11/2026)" };
});

const video = {
  id: slug, title: "Hà Giang 3N2Đ mùa tam giác mạch", language: "vi", region: "Hà Giang (Tuyên Quang), Việt Nam", template: "travel-itinerary",
  format: { width: 1080, height: 1920, fps: 30 }, transitionFrames: 15,
  theme: { accent: "#e2384a", highlight: "#f5c84c", brand: "HÀ GIANG" },
  narrator: { provider: "elevenlabs", voice: "Adam" }, subtitles: true,
  music: { src: "shared/music/travel-ambient.mp3", volume: 0.8 },
  maps: {
    "Lan Anh Restaurant": "lan-anh", "Ngọc Tuyên": "ngoc-tuyen", "Lalaland Restaurant": "lalaland",
    "Tu Sản Coffee": "tu-san-coffee", "Thạch Sơn quán": "thach-son", "Thao Linh": "thao-linh",
    "Nhà hàng Tùng Phúc": "tung-phuc", "Ethnic House": "ethnic",
    "Ma Pi Leng Homestay": "mpl-home-llc", "Thing 0 Homestay": "thing0", "PiTu Homestay": "pi-tu", "CiCi homestay": "cici",
  },
  scenes,
};
writeFileSync(`${dir}/video.json`, JSON.stringify(video, null, 2) + "\n");
writeFileSync(`${dir}/credits.json`, JSON.stringify(credits, null, 2) + "\n");
console.log(slug, scenes.length, "scenes,", used.size, "clips,", scenes.reduce((n, s) => n + s.narration.length, 0), "chars,", scenes.reduce((n, s) => n + s.durationSec, 0), "s");
