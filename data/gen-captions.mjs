// Writes output/<slug>/tiktok-caption.txt for "Tà Xùa: săn thác mây" (23/11/2026). TikTok clips are credited by handle +
// video id (user request 16/11/2026). The last line holds the hashtags. No AI-voice/tool credit line (user, 14/11/2026).
// Run: node data/gen-captions.mjs ta-xua-san-may
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const slug = process.argv[2] ?? "ta-xua-san-may";
const credits = JSON.parse(readFileSync(`data/videos/${slug}/credits.json`, "utf8"));

const lines = [
  "Thác mây Tà Xùa sáng 11/11 làm cả TikTok choáng ngợp ☁️ Mình đọc hết 36 video + bình luận của người vừa đi để gom cẩm nang săn mây 2N1Đ từ Hà Nội. Lưu lại nhé!",
  "",
  "📍 Ở đâu: xã Tà Xùa, Bắc Yên, Sơn La, cách Hà Nội ~240 km.",
  "🚌 Đi sao: xe cabin / giường nằm chạy ~21h30, khứ hồi 550–700k, sáng sớm tới trung tâm. Thuê xe máy 150–200k/ngày. Đèo Bắc Yên hẹp, dốc; tay lái yếu thì thuê xe ôm.",
  "☁️ Săn mây: 21h mở app thời tiết, độ ẩm >85% + gió <5 km/h → báo thức 5h. Mây đẹp 5h30–7h30 ở đỉnh Gió, Khe Cải, Làng Chếu. Đêm trước mưa, sáng hửng nắng là dễ có mây.",
  "🌄 Chiều: thảo nguyên (35k), mỏm cá heo (5k), cây cô đơn (25k, hoa đang nở), hoàng hôn ~17h30.",
  "🦖 Sống lưng khủng long: ~15 km từ trung tâm, đường đá một bên vực, gửi xe đi xe ôm bản địa ~100k khứ hồi (theo bình luận TikTok). Tháng 11 hết hoa sao nhái, bình minh vẫn rất đẹp.",
  "",
  "🍜 Ăn gì: phở gà đen ~35k ở trung tâm; Lẩu gà lá è É ee ★4.9 (246 đánh giá); Bếp ăn Xuân Thì ★4.8 (226); cà phê Mị ơi ★4.6 (352).",
  "🏨 Ở đâu: homestay ngay trung tâm, có kính + đệm sưởi: ManDo ★4.8 (791), Pơ Mu ★4.6 (388), Tà Xùa Clouds ★4.5 (789). Cuối tuần mùa mây nên đặt trước.",
  "",
  "💰 Tự túc 2N1Đ từ Hà Nội, 1 người (giá tham khảo, đọc ngày 23/11/2026):",
  "• Xe khứ hồi (cabin, giường nằm): 550–700k",
  "• Phòng 1 đêm, ở 2 người: 250–500k",
  "• Xe máy + xăng (chia 2): 100–150k",
  "• Vé điểm + xe ôm sống lưng: 150–200k",
  "• Ăn uống, cà phê: 400–600k",
  "👉 Khoảng 1,5–2,2tr/người. Tour 2N1Đ từ Hà Nội ~2,48tr (PYS Travel). Nguồn: review TikTok, VnExpress.",
  "",
  "⚠️ Nói thật: quán cơm viral như Vị Nhà mới ★3.8 trên Google Maps; cuối tuần tắc đường từ sáng sớm, có lúc mất điện nước; đêm dưới 10°C; mây là trời cho, có người đi 3 lần chưa gặp.",
  "⭐ Số sao Google Maps kiểm tra ngày 23/11/2026.",
  "",
  "Bạn săn được mây Tà Xùa chưa? 👇",
  "",
  "—",
  "🎥 Clip trong video là của các bạn TikToker, cảm ơn các bạn (các đoạn 🔊 giữ nguyên âm thanh gốc của clip):",
];
const seen = new Map();
for (const c of credits) if (!seen.has(c.source)) seen.set(c.source, c.author);
for (const [src, author] of seen) lines.push(`${author} · video ${src.match(/(\d+)\/?$/)[1]}`);
lines.push("", "#taxua #sanmay #thacmay #taxuasonla #dulichtaxua #songlungkhunglong #dulichvietnam #dulichmienbac #reviewdulich #fyp");

const text = lines.join("\n") + "\n";
mkdirSync(`output/${slug}`, { recursive: true });
writeFileSync(`output/${slug}/tiktok-caption.txt`, text);
console.log(slug, [...text].length, "chars");
