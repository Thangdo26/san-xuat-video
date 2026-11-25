// Ẩm thực Hà Giang: 6 món, làm lại từ đầu (người dùng yêu cầu 20/11/2026), giọng Adam nói nhanh ~x1,4 (21/11/2026).
// Nghiên cứu: 30 video TikTok ẩm thực đọc trọn lời thoại + bình luận (research/tiktok.md F1–F30, ≥3 video mỗi món),
// Google Maps kiểm tra 21/11/2026 (research/food.md). Lời thoại: data/script.mjs.
// Không có đoạn mở đầu riêng: vào thẳng phần giới thiệu (người dùng bỏ cold open của video ẩm thực Đà Lạt, 20/11/2026).
// Giữa hai món: một hàng 3–4 ảnh của món vừa ăn (20/11/2026).
// Run: node data/gen-hga2.mjs
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { FOOD } from "./script.mjs";

const slug = "ha-giang-am-thuc-v2";
const dir = `data/videos/${slug}`;
mkdirSync(dir, { recursive: true });
const voice = existsSync(`${dir}/voiceover.json`) ? JSON.parse(readFileSync(`${dir}/voiceover.json`, "utf8")).clips : {};

const SRC = {};
for (const line of readFileSync("research/cuts.txt", "utf8").split(/\r?\n/)) {
  if (!line.trim() || line.startsWith("#")) continue;
  const [name, src, , , note] = line.split("|").map((x) => x.trim());
  const tk = src.match(/raw-tiktok\/[^_]+__(.+)__(\d+)\.mp4$/);
  if (tk) SRC[name] = { who: tk[1], id: tk[2] };
  const px = src.match(/raw-pexels\/(\d+)\.mp4$/);
  if (px) SRC[name] = { who: `pexels:${(note.match(/\(([^)]+)\)\s*$/) || [, "Pexels"])[1]}`, id: px[1] };
}
// Pexels photos of lẩu gà đen turned into push-in clips (research/pexels-photo-credits.json).
Object.assign(SRC, {
  "gaden-ph1": { who: "pexels:Anh Lee", id: "33621138", photo: true }, "gaden-ph2": { who: "pexels:Diana", id: "33312413", photo: true },
  "gaden-ph3": { who: "pexels:Đậu Photograph", id: "30882911", photo: true }, "gaden-ph4": { who: "pexels:Mika Mark", id: "31514374", photo: true },
});
const F = (f) => `videos/ha-giang/footage/${f}.mp4`;
const g = (list) => list.map(F);
const q = (place, address, rating) => ({ place, address, ...(rating == null ? {} : { rating }) });

const RECAP = 3.0;
const scenes = [
  {
    id: "hook", layout: "hook", caption: "HÀ GIANG ĂN GÌ?", kicker: "6 MÓN · QUÁN ≥4.5★",
    narration: FOOD.hook,
    gallery: g(["tc-pot", "cc-skewer", "pho-stall", "bc-steam"]),
  },
  {
    id: "banhcuon", layout: "dish", n: 1, time: [7, 0], tag: "Ăn sáng · TP Hà Giang", caption: "Bánh cuốn trứng",
    facts: ["Chan nước ninh xương", "Không chấm nước mắm"],
    narration: FOOD.banhcuon, cue: "Bánh cuốn Giang",
    gallery: g(["bc-steam", "bc-pour", "bc-fill", "bc-vendor", "bc-roll"]),
    recap: ["bc-bowl2", "bc-soup", "bc-plate", "bc-rolling"],
    places: [q("Bánh cuốn Giang", "207 Lý Thường Kiệt", 5.0), q("Bánh Cuốn Bà Cúc", "78 Trường Chinh", 4.8)],
  },
  {
    id: "pho", layout: "dish", n: 2, time: [8, 0], tag: "Chợ phiên Chủ nhật · Đồng Văn", caption: "Phở lợn bản",
    facts: ["Lợn bản da giòn", "Nước xương ngọt thanh"],
    narration: FOOD.pho, cue: "bà Dung",
    gallery: g(["pho-stall", "cho-fire", "pho-noodle", "pho-pork", "pho-bowls"]),
    recap: ["pho-bowl", "pho-chop", "pho-stalls", "pho-market"],
    places: [q("Phở bà Dung", "trong chợ Đồng Văn · dân địa phương khen", null)],
  },
  {
    id: "cuoncai", layout: "dish", n: 3, time: [16, 0], tag: "Ăn vặt · Lô Lô Chải", caption: "Thịt cuốn cải",
    facts: ["Cải mèo hơi đắng", "Nướng than, vừa đi vừa ăn"],
    narration: FOOD.cuoncai, cue: "thịt cuốn cải",
    gallery: g(["cc-lolo", "cc-grill", "cc-skewer", "xoi-make"]),
    recap: ["cc-skewer", "cc-grill", "xoi-make"],
    places: [q("Quầy nướng trong làng", "Lô Lô Chải · theo review TikTok", null)],
  },
  {
    id: "lau", layout: "dish", n: 4, time: [19, 0], tag: "Ăn tối · Đồng Văn, Lô Lô", caption: "Lẩu gà đen",
    facts: ["Gà đen thịt chắc", "Tối 8 độ là hợp"],
    narration: FOOD.lau, cue: "Giàng Quán",
    gallery: g(["lau-spread", "gaden-ph3", "gaden-ph1", "gaden-ph2", "gaden-ph4"]),
    recap: ["lau-spread", "gaden-ph3", "gaden-ph1"],
    places: [q("Giàng Quán", "Đồng Văn", 5.0), q("Thạch Sơn quán", "chợ cổ Đồng Văn", 4.9), q("Cafe Cực Bắc", "Lô Lô Chải", 4.7)],
  },
  {
    id: "thangco", layout: "dish", n: 5, time: [20, 0], tag: "Ăn tối · Đồng Văn", caption: "Thắng cố ngựa",
    facts: ["Thịt, lòng ngựa + thảo quả", "2 người: gọi nồi nhỏ"],
    narration: FOOD.thangco, cue: "Thạch Sơn",
    gallery: g(["tc-pot", "tc-boil", "tc-horse", "tc-plate", "tc-pot2", "tc-hall"]),
    recap: ["tc-dip", "tc-plate", "tc-pot2", "tc-hall"],
    places: [q("Thạch Sơn quán", "chợ cổ Đồng Văn", 4.9), q("Nhà Hàng CND", "đường 3/2 Đồng Văn", 4.8)],
  },
  {
    id: "chao", layout: "dish", n: 6, time: [22, 30], tag: "Ăn khuya", caption: "Cháo ấu tẩu",
    facts: ["Củ có độc: ăn quán làm kỹ", "Sợ đắng: xin ít ấu tẩu"],
    narration: FOOD.chao, cue: "quán làm kỹ",
    gallery: g(["chao-tuber", "chao-root", "chao-ladle", "chao-bowl", "chao-spoon"]),
    recap: ["chao-bowl2", "chao-pile", "chao-close"],
    places: [q("Quán cháo làm kỹ", "chưa quán nào ≥4.5★ · xem mô tả", null)],
  },
  {
    id: "outro", layout: "outro", caption: "Ăn cho đã nha!", kicker: "MANG VỀ LÀM QUÀ",
    gift: "Thịt treo gác bếp",
    pins: [["Bánh cuốn", "TP"], ["Phở", "Đồng Văn"], ["Cuốn cải", "Lô Lô"], ["Lẩu gà đen", "Đồng Văn"], ["Thắng cố", "Đồng Văn"], ["Cháo ấu tẩu", "TP"]],
    narration: FOOD.outro,
    gallery: g(["tc-pot2", "bc-steam", "gaden-ph2"]),
  },
];

const LEAD = 0.5;
const MIN = { hook: 9, dish: 9, outro: 10.5 };
for (const s of scenes) {
  const v = voice[s.id]?.durationSec;
  const base = v ?? s.narration.length / 20;
  s.durationSec = Math.ceil(Math.max(base + LEAD + 1.0, MIN[s.layout] ?? 0) * 2) / 2 + (s.recap ? RECAP : 0);
  if (s.recap) s.recapSec = RECAP;
}

const used = new Set(scenes.flatMap((s) => [...(s.gallery ?? []), ...(s.recap ?? []).map(F)]));
const credits = [...used].map((file) => {
  const name = file.split("/").pop().replace(".mp4", "");
  const src = SRC[name];
  if (!src) throw new Error(`no source for ${name}`);
  if (src.who.startsWith("pexels:")) return { file, author: `Pexels · ${src.who.slice(7)}`, source: `https://www.pexels.com/${src.photo ? "photo" : "video"}/${src.id}/`, license: "Pexels License" };
  return { file, author: `@${src.who}`, source: `https://www.tiktok.com/@${src.who}/video/${src.id}`, license: "TikTok, dùng có ghi nguồn (người dùng đồng ý 16/11/2026)" };
});

const video = {
  id: slug, title: "Ẩm thực Hà Giang: 6 món", language: "vi", region: "Hà Giang (Tuyên Quang), Việt Nam", template: "food",
  format: { width: 1080, height: 1920, fps: 30 }, transitionFrames: 15,
  theme: { accent: "#c8321e", highlight: "#f2b134", brand: "HÀ GIANG ĂN GÌ" },
  narrator: { provider: "elevenlabs", voice: "Adam" }, subtitles: true,
  music: { src: "shared/music/travel-upbeat.mp3", volume: 0.8 },
  maps: {
    "Bánh cuốn Giang": "bc-giang", "Bánh Cuốn Bà Cúc": "bc-ba-cuc", "Giàng Quán": "giang-quan", "Thạch Sơn quán": "thach-son",
    "Cafe Cực Bắc": "cuc-bac", "Nhà Hàng CND": "cnd",
  },
  scenes,
};
writeFileSync(`${dir}/video.json`, JSON.stringify(video, null, 2) + "\n");
writeFileSync(`${dir}/credits.json`, JSON.stringify(credits, null, 2) + "\n");
console.log(slug, scenes.length, "scenes,", used.size, "clips,", scenes.reduce((n, s) => n + s.narration.length, 0), "chars,", scenes.reduce((n, s) => n + s.durationSec, 0), "s");
