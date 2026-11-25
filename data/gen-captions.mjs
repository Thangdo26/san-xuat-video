// Writes output/<slug>/tiktok-caption.txt for "Đồi Bò Sa Pa: săn biển mây" (24/11/2026). TikTok clips are credited by
// handle + video id (user request 16/11/2026). The last line holds the hashtags. No AI-voice/tool credit line (user, 14/11/2026).
// Run: node data/gen-captions.mjs doi-bo-san-may
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const slug = process.argv[2] ?? "doi-bo-san-may";
const credits = JSON.parse(readFileSync(`data/videos/${slug}/credits.json`, "utf8"));

const lines = [
  "Ai bảo Sa Pa bị bê tông hoá? Cách trung tâm ~8 km có thảo nguyên Đồi Bò cao ~2.400 m, bò thả rông và biển mây tới chân trời ☁️🐄 Mình đọc 35 video + bình luận của người vừa leo để gom cẩm nang. Lưu lại nhé!",
  "",
  "📍 Ở đâu: Đồi Bò, xã Tả Phìn, phía đèo Ô Quy Hồ, Sa Pa. Trên Google Maps tìm \"Thảo Nguyên Nhỏ SaPa\".",
  "🛵 Đường lên: từ trung tâm chạy ~7 km tới trụ sở phường Ô Quy Hồ cũ (biển HTX nông sản Ô Quy Hồ), rẽ vào đường bê tông nhỏ xuyên vườn su su. Dốc, hẹp: xe máy chỉ lên ~2/3, người đi trước khuyên thuê xe ôm bà con ở đây (hỏi giá trước).",
  "🥾 Leo: trèo qua hàng rào là đi bộ, khoảng 1 tiếng (khoẻ) đến 1,5–2 tiếng. Ngã rẽ để ý mũi tên vẽ dưới đất. Giữa đường có lán nghỉ bán mì tôm, nước, ngủ qua đêm được.",
  "☁️ Săn mây: sáng 5h–8h (đi từ lúc trời tối, mang đèn pin) hoặc lên từ trưa chờ mây chiều + hoàng hôn. Mây hay có khi hôm trước mưa, hôm sau hửng nắng. Mùa đẹp tháng 11 – tháng 3.",
  "🐄 Vì sao tên Đồi Bò: trời rét, cỏ dưới thấp ít, đàn bò lên gần đỉnh gặm cỏ (Tuổi Trẻ).",
  "⛺ Cắm trại: nhiều nhóm mang lều lên ngủ, đêm ngắm sao, sáng mở lều là biển mây. Đêm rất lạnh.",
  "",
  "🍲 Ăn (trung tâm Sa Pa): lẩu cá tầm Nhà hàng A Phủ ★4.7 (3.987 đánh giá); Thắng cố A Quỳnh ★4.6 (3.936); Tiệm Gà Tuk Tuk ★4.9 (830); Cá Hồi Vua ★4.7 (2.359); Mạnh Mộc Quán ★4.9 (536); Chợ Tình Quán ★4.8 (2.445).",
  "🏨 Ở: Sapa Centre Hotel ★4.8 (2.659), Mega View Homestay ★4.8 (1.677), đi bộ ra nhà thờ Đá; The Link Farmstay ★4.8 (335) yên tĩnh nhìn ra núi; Hello Sapa Hotel ★4.9 (330).",
  "",
  "💰 Tự túc 2N1Đ từ Hà Nội, 1 người (giá tham khảo, đọc ngày 24/11/2026):",
  "• Xe khách khứ hồi (giường, cabin): 480–780k",
  "• Phòng 1 đêm, ở 2 người: 290–360k",
  "• Xe máy 2 ngày (chia 2): 100–200k",
  "• Ăn uống 2 ngày: 600–900k",
  "👉 Khoảng 1,5–2,2tr/người, chưa tính xe ôm qua vườn su su. Dịch vụ dẫn đường + quay flycam ~600k/người (theo review TikTok). Nguồn: review TikTok, VnExpress, vietnamtourism.",
  "",
  "⚠️ Nói thật: Đồi Bò còn hoang sơ, chưa có biển chỉ dẫn, đã có nhóm lạc trong rừng cả tiếng; mưa xong đường su su rất trơn, xe ga dễ trượt; đỉnh đồi gió to, lạnh hơn thị trấn nhiều; mây là trời cho, có hôm chỉ có sương mù. Mặc quần dài, đi giày, mang đồ ăn và mang rác về.",
  "⭐ Số sao Google Maps kiểm tra ngày 24/11/2026.",
  "",
  "Bạn đã lên Đồi Bò chưa? 👇",
  "",
  "—",
  "🎥 Clip trong video là của các bạn TikToker, cảm ơn các bạn (các đoạn 🔊 giữ nguyên âm thanh gốc của clip):",
];
const seen = new Map();
for (const c of credits) if (!seen.has(c.source)) seen.set(c.source, c.author);
for (const [src, author] of seen) lines.push(`${author} · video ${src.match(/(\d+)\/?$/)[1]}`);
lines.push("", "#doibosapa #doibo #sapa #sanmaysapa #trekkingsapa #dulichsapa #taybac #dulichvietnam #reviewsapa #fyp");

const text = lines.join("\n") + "\n";
mkdirSync(`output/${slug}`, { recursive: true });
writeFileSync(`output/${slug}/tiktok-caption.txt`, text);
console.log(slug, [...text].length, "chars");
