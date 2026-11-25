// Writes output/dong-cao-san-may/tiktok-caption.txt (Vietnamese). Every clip is from a TikTok video of Đồng Cao,
// so each creator is credited by handle with the video link (user request 16/11/2026). The last line holds
// the hashtags (typed one by one when posting).
// Run: node data/gen-captions.mjs [--adam]  (--adam: the playful Adam-voice cut, same caption, own output folder)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const slug = process.argv.includes("--adam") ? "dong-cao-san-may-adam" : "dong-cao-san-may";
const v = JSON.parse(readFileSync(`data/videos/${slug}/video.json`, "utf8"));
const credits = JSON.parse(readFileSync(`data/videos/${slug}/credits.json`, "utf8"));
const cost = v.scenes.find((s) => s.layout === "cost");

const lines = [
  "Không phải Tà Xùa đâu, đây là cao nguyên Đồng Cao (Vân Sơn, Bắc Ninh, Sơn Động cũ), cách Hà Nội ~150 km ☁️ Lịch trình săn mây 2N1Đ gom từ 25 video TikTok của người vừa đi về. Lưu lại nhé!",
  "",
  "🛵 Đường đi: cao tốc Hà Nội – Bắc Giang → QL31 qua Chũ → An Châu → Vân Sơn. Đường bê tông tới tận chân đồi, ô tô xe máy đều lên được; dốc cuối gắt, tay lái yếu thì gửi xe nhà dân, đi bộ 15–20 phút.",
  "☕ Dọc QL31: Mây Coffee Phượng Sơn ★5.0 · F5. Tiệm trà bờ hồ (Chũ) ★4.6. Mua mì Chũ mang lên nấu.",
  "⛺ Cắm trại: nhà Hoa Hồng, Hoa Thuận dưới chân đồi cho thuê lều, mang lên dựng giúp: lều đôi 150k, lều 4 người 200k, 6 người 300k, bạt 150k, ghế 20k (theo review TikTok). Gà nướng, lẩu gọi đặt từ trưa.",
  "🍜 Món nên thử (quanh đây không có quán ≥4.5★ trên Maps): gà nướng, lẩu đặt nhà cho thuê lều; mì Chũ; bún chợ phiên Quế Sơn (Đại Sơn) ~30k.",
  "☁️ Săn mây: dậy 4h30, leo 15 phút lên đỉnh. Mây lên từ ~5h, đẹp tới 8h. Hôm trước mưa, sáng hôm sau khô ráo, có sương mù dưới thung = gần như chắc có mây; gió to mây tan nhanh. 14/11 mây phủ kín, 15/11 không còn tí nào: test nhân phẩm!",
  "",
  "🏨 Ngủ ở đâu?",
  "• Lều trên đồi: mở lều là thấy mây (150–300k/lều).",
  "• Thị trấn Chũ (~35 km), 3h sáng chạy lên: Nhà nghỉ Đại Dương ★4.7 · Bản Meo Homestay ★4.8.",
  "• Hoặc đi đêm từ Hà Nội lúc 0–1h, tới nơi 4–5h sáng.",
  "",
  "💰 Chi phí 2N1Đ cho 1 người (xe máy 2 người, giá tham khảo, đọc ngày 16/11/2026):",
  ...cost.items.map((it) => `• ${it.k}${it.note ? ` (${it.note})` : ""}: ${it.v}`),
  `👉 Tổng khoảng ${cost.total}/người. Nguồn: review TikTok, giá xăng Báo Văn Hoá 9/11/2026.`,
  "",
  "⚠️ Người đi trước dặn: trên đỉnh không có quán, không có nhà vệ sinh; đêm gió rất lạnh (không có muỗi), mang áo ấm; mặc đồ để cỏ may không bám, dép thấp; có phân ngựa, bò; mang rác về vì đoàn thanh niên địa phương vẫn phải đi nhặt rác.",
  "⭐ Google Maps kiểm tra và chụp ngày 16/11/2026: Cao nguyên Đồng Cao ★4.6 (351 lượt).",
  "",
  "Bạn đã \"test nhân phẩm\" ở Đồng Cao chưa? 👇",
  "",
  "—",
  "🎥 Clip trong video là của các bạn TikToker, cảm ơn các bạn:",
];
const seen = new Map();
for (const c of credits) if (!seen.has(c.source)) seen.set(c.source, c.author);
for (const [src, author] of seen) lines.push(`${author} · ${src}`);
lines.push("", "#dongcao #sanmay #dongcaobacgiang #sanmaydongcao #caonguyendongcao #camping #dulichbacninh #lichtrinhdulich #dulichvietnam #fyp");

const text = lines.join("\n") + "\n";
mkdirSync(`output/${slug}`, { recursive: true });
writeFileSync(`output/${slug}/tiktok-caption.txt`, text);
console.log(slug, [...text].length, "chars");
