// Writes output/<slug>/tiktok-caption.txt for "Thác 72 · Đắk Glung" (22/11/2026). TikTok clips are credited by handle +
// video id (user request 16/11/2026). The last line holds the hashtags. No AI-voice/tool credit line (user, 14/11/2026).
// Run: node data/gen-captions.mjs thac-72-dak-glung
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const slug = process.argv[2] ?? "thac-72-dak-glung";
const credits = JSON.parse(readFileSync(`data/videos/${slug}/credits.json`, "utf8"));

const lines = [
  "Thác 72 (Đắk Glung) đang hot nhất TikTok: cao gần 60 m giữa hơn 1.000 ha rừng Tây Nguyên 🌿💦 Mình đọc hết 28 video + bình luận của người vừa đi để gom cẩm nang này. Lưu lại nhé!",
  "",
  "📍 Ở đâu: xã Tuy Đức, Lâm Đồng (Đắk Nông cũ), cách Gia Nghĩa ~50 km, TP.HCM ~220 km.",
  "🚌 Đi sao: từ Sài Gòn ra BX Miền Đông bắt xe Thu Hà / Đức Phong về Tuy Đức (gần thác nhất, theo bình luận người địa phương); ô tô, xe máy vào tận bãi. Đoạn cuối ổ gà, đất đỏ bụi: đi chậm, hỏi đường dễ nhất.",
  "🎫 Vé: ~90k/người lớn (có review ghi 100k), gửi xe máy 10k; mở cửa 7h (Google Maps).",
  "🥾 Xuống thác: bậc đá dốc, rêu trơn, mang giày bám; qua cầu sắt phủ rêu, hang đá có bàn thờ Phật, nơi thắp nhang cho các chiến sĩ.",
  "🌈 Cầu vồng: hôm nắng, gần trưa hơi nước tạo cầu vồng giữa thác.",
  "🗓️ Mùa đẹp: nhiều nước nhất tháng 10–11 (cập nhật 15 và 17/11/2026 vẫn dồi dào); tháng 12 còn mưa thì vẫn đẹp; mùa khô ít nước. Chủ nhật rất đông, đi ngày thường.",
  "",
  "🍗 Ăn gì: quanh thác chưa có quán ≥4.5★ trên Google Maps. Món nên thử: gà nướng, cơm lam ở nhà hàng trong khu (theo review Maps); thuê chòi ~200k ngày thường, mang đồ vào tự nướng. Về Gia Nghĩa: Sky Garden Ẩm Thực Tây Nguyên ★4.6 (302 đánh giá).",
  "🏨 Ở đâu: Gia Nghĩa – Robin Hotel ★4.8 (1.309), Laca homestay ★4.7 (80), Eva Village ★4.5 (717); gần thác hơn: Khách sạn Đức Lộc Phát, Kiến Đức ★4.5 (82).",
  "",
  "💰 Tự túc từ Sài Gòn 2N1Đ, 1 người (giá tham khảo, đọc ngày 22/11/2026):",
  "• Xe khách SG ⇄ Gia Nghĩa: 540k–1tr (270k/chiều giường nằm, 450–499k limousine; MoMo, mia.vn)",
  "• Phòng Gia Nghĩa 1 đêm, ở 2 người: ~900k (Robin Hotel, Trip.com)",
  "• Vé thác + gửi xe: 100–110k",
  "• Chòi nướng chia 4: ~50k",
  "👉 Khoảng 1,6–2,1tr/người, chưa gồm ăn uống và xe Gia Nghĩa ⇄ thác. Hoặc tour ghép 2N1Đ kèm hồ Tà Đùng ~2,29tr (Đất Việt Tour).",
  "",
  "⚠️ Nói thật: ngoài đời thác nhỏ và hoang sơ hơn clip flycam; đường vào xấu; trò chơi trong khu thu tiền riêng; mùa khô chỉ còn vài dòng nước.",
  "⭐ Số sao Google Maps kiểm tra ngày 22/11/2026.",
  "",
  "Bạn đã tới thác 72 chưa? 👇",
  "",
  "—",
  "🎥 Clip trong video là của các bạn TikToker, cảm ơn các bạn (các đoạn 🔊 giữ nguyên âm thanh gốc của clip):",
];
const seen = new Map();
for (const c of credits) if (!seen.has(c.source)) seen.set(c.source, c.author);
for (const [src, author] of seen) lines.push(`${author} · video ${src.match(/(\d+)\/?$/)[1]}`);
lines.push("", "#thac72 #dakglung #taynguyen #lamdong #daknong #dulichvietnam #trekking #thacnuoc #reviewdulich #fyp");

const text = lines.join("\n") + "\n";
mkdirSync(`output/${slug}`, { recursive: true });
writeFileSync(`output/${slug}/tiktok-caption.txt`, text);
console.log(slug, [...text].length, "chars");
