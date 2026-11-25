// Writes output/<slug>/tiktok-caption.txt for "Tour ngắm tuyết Trung Quốc 6 triệu" (21/11/2026). TikTok clips are
// credited by handle + video id (user request 16/11/2026). The last line holds the hashtags. No AI-voice/tool credit
// line (user, 14/11/2026).
// Run: node data/gen-captions.mjs tq-tuyet-kieu-tu
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const slug = process.argv[2] ?? "tq-tuyet-kieu-tu";
const credits = JSON.parse(readFileSync(`data/videos/${slug}/credits.json`, "utf8"));

const lines = [
  "Đi Trung Quốc ngắm tuyết chỉ khoảng 6 triệu: có thật không? ❄️ Tour Côn Minh – núi tuyết Kiệu Tử (Vân Nam) đang viral nhất tháng 11. Mình xem 28 video TikTok, đọc hết lời thoại và bình luận của người đi thật. Lưu lại nhé!",
  "",
  "🚆 N1: xe giường nằm Hà Nội → Lào Cai, cửa khẩu Hà Khẩu, tàu cao tốc tới Côn Minh (~5 tiếng).",
  "🏔️ N2: núi tuyết Kiệu Tử, cách Côn Minh ~150 km; 2 chặng cáp treo lên gần 4.000 m (hồ trên núi ở 4.150 m). Tuyết đầu mùa 2026 đã rơi từ 09/11.",
  "🕊️ N3: hồ Điền Trì ngắm hải âu từ Siberia về trú đông (T11–T3, CGTN); chiều Lão Ngư Hà, tối Kim Mã Bích Kê, chợ đêm Nam Cường.",
  "🏯 N4: Quan Độ cổ trấn hoặc chợ hoa Đấu Nam, rồi tàu về.",
  "",
  "💰 Tour quảng cáo trên TikTok 11/2026: khoảng 6–7 triệu/người (5,99–6,99tr), thường gồm visa đoàn, xe HN ⇄ Lào Cai, tàu cao tốc, khách sạn 3–4★, ăn đoàn, cáp treo Kiệu Tử. Hỏi kỹ: tip hướng dẫn viên, phụ thu, đi đủ 2 chặng cáp không.",
  "",
  "⚠️ Nói thật:",
  "• Tuyết là thời tiết: có đợt lên núi nắng, không tuyết (nhiều bình luận đi cuối T12, dịp Tết không gặp tuyết).",
  "• Mẹo của người đi nhiều: theo dõi thời tiết Kiệu Tử; Côn Minh mưa thì trên núi thường đang có tuyết.",
  "• Núi gần 4.000 m, đi lại nhiều: cần sức khoẻ, mặc thật ấm, có tour phát bình oxy.",
  "",
  "🧭 Chỗ khác để ngắm tuyết:",
  "• Ngọc Long (Lệ Giang): tour ~17 triệu; chỉ cáp Băng Xuyên lên mốc 4.680 m mới chạm tuyết, Vân Sam Bình 3.200 m chỉ ngắm xa.",
  "• Cáp Nhĩ Tân: từ ~30 triệu, −20°C, đẹp nhất T12–T1; làng Tuyết Hương 15/11 gần như chưa có tuyết, nên đi giữa T12 – cuối T1.",
  "",
  "Bạn chọn Kiệu Tử, Ngọc Long hay Cáp Nhĩ Tân? 👇",
  "",
  "—",
  "🎥 Clip trong video là của các bạn TikToker, cảm ơn các bạn:",
];
const seen = new Map();
for (const c of credits) if (!seen.has(c.source)) seen.set(c.source, c.author);
for (const [src, author] of seen) lines.push(`${author} · video ${src.match(/(\d+)\/?$/)[1]}`);
lines.push("", "#trungquoc #dulichtrungquoc #santuyet #nuituyetkieutu #conminh #tourtrungquoc #ngamtuyet #capnhitan #fyp");

const text = lines.join("\n") + "\n";
mkdirSync(`output/${slug}`, { recursive: true });
writeFileSync(`output/${slug}/tiktok-caption.txt`, text);
console.log(slug, [...text].length, "chars");
