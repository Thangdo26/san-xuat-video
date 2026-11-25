// Writes output/<slug>/tiktok-caption.txt (Vietnamese) for the two Đà Lạt videos. TikTok clips are credited by
// handle with the video link, Pexels clips by author (user request 16/11/2026). The last line holds the hashtags
// (typed one by one when posting). No AI-voice/tool credit line (user, 14/11/2026).
// Run: node data/gen-captions.mjs da-lat-4n3d | da-lat-am-thuc
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const slug = process.argv[2];
const v = JSON.parse(readFileSync(`data/videos/${slug}/video.json`, "utf8"));
const credits = JSON.parse(readFileSync(`data/videos/${slug}/credits.json`, "utf8"));

const TRAVEL = [
  "Đà Lạt cuối tháng 11 đẹp nhất năm: trời xanh, tối lạnh, cỏ hồng lên màu, mây đầy thung lũng 🌸☁️ Lịch trình 4N3Đ gom từ 27 video TikTok của người vừa đi về. Lưu lại nhé!",
  "",
  "📍 N1 · Trung tâm: taxi sân bay ~195k; xe đêm tới sớm thì ngồi cà phê chờ nhận phòng. Hồ Xuân Hương, 17h30 quảng trường Lâm Viên lên đèn.",
  "🍲 Tối: Lẩu gà lá é Cao Phụng ★4.5 · Nem nướng Hà Tốt ★4.9 · Bánh tráng nướng Cô Chi ★4.8. Né ăn ở bậc thang chợ đêm.",
  "☁️ N2 · Săn mây đồi chè Cầu Đất (~28 km, đi 4h sáng): đèo tối, sương dày, tay lái non nên đi tour. Biển Mây Chill – Cầu Gỗ ★4.9 · Săn Mây Cầu Gỗ – Bình Minh ★4.6 · The Diff House's ★4.5.",
  "🌸 N3 · Hướng Lạc Dương: đồi cỏ hồng đường lên Suối Vàng chỉ hồng khoảng 6h30–8h sáng. Langbiang 2.167 m: leo ~4 tiếng hoặc đi Jeep. Bò Tơ Bản Địa ★4.7 · SOLENA ★4.6 · Ẩm thực KRIN ★4.7.",
  "🌼 N4 · Hướng đèo Prenn: hồ Tuyền Lâm sương sớm, cáp treo Robin → Thiền viện Trúc Lâm 80k/chiều, dã quỳ ven hồ, máng trượt Datanla (đường số 3). An – Tuyền Lâm ★4.7 · Lac du LeLe ★4.7 · The Seen House ★4.6.",
  "",
  "➕ Đi 5N4Đ thì thêm: Tà Nung (thôn 13, cà phê view thung lũng, ~15 km) · dinh Bảo Đại, ga Đà Lạt · Festival Hoa Đà Lạt lần XI dự kiến khai mạc tối 19/12/2026 ở quảng trường Lâm Viên (SGGP, Tuổi Trẻ).",
  "",
  "🏨 Ở đâu?",
  "• Trung tâm (lần đầu nên ở): Cozy Garden Boutique Hotel ★4.9 · Thanh Nhã House ★5.0",
  "• Cầu Đất (mê săn mây): Dream Garden Homestay ★4.7 · Nhà Hoa Nắng Homestay ★4.9",
  "• Chọn phòng có nước nóng, chăn dày. Homestay gần chợ ~300–350k/đêm.",
  "",
];
const FOOD = [
  "Đà Lạt ăn gì ngoài cà phê với đồ nướng? 6 món phải thử, chọn từ 24 video TikTok và cả nghìn bình luận, quán nào cũng ≥4.5★ Google Maps 🍜 Lưu lại nhé!",
  "",
];

const lines = [...(slug === "da-lat-4n3d" ? TRAVEL : FOOD)];
if (slug === "da-lat-4n3d") {
  const cost = v.scenes.find((s) => s.layout === "cost");
  lines.push("💰 Chi phí 4N3Đ cho 1 người (từ Hà Nội, giá tham khảo, đọc ngày 20/11/2026):");
  lines.push(...cost.items.map((it) => `• ${it.k}${it.note ? ` (${it.note})` : ""}: ${it.v}`));
  lines.push(`👉 Tổng khoảng ${cost.total}/người. Nguồn: review TikTok, Jungle Boss, Nam Thiên Travel. Đi xe khách từ Sài Gòn (~325k/chiều) rẻ hơn nhiều.`, "");
  lines.push("⚠️ Người đi trước dặn: áo khoác + kem chống nắng; hỏi giá trước ở chợ đêm; taxi đặt qua app; thuê xe thì chụp xe trước khi nhận.");
  lines.push("⭐ Số sao Google Maps kiểm tra ngày 20/11/2026.", "", "Bạn định đi Đà Lạt mấy ngày? 👇", "");
} else {
  for (const s of v.scenes.filter((x) => x.layout === "dish")) {
    lines.push(`${s.n}. ${s.caption} (${s.tag.toLowerCase()}): ${s.facts.join("; ")}.`);
    lines.push(`   📍 ${s.places.map((p) => `${p.place} ★${p.rating.toFixed(1)} · ${p.address}`).join(" | ")}`);
  }
  lines.push("", "🔥 Nổi tiếng trên TikTok nhưng chưa tới 4.5★ (để bạn tự cân nhắc): Bánh căn Lệ ★4.3 · Bánh căn Nhà Cổ ★4.4 · Bánh ướt Long Chuyên ★4.0 · 44 Tăng Bạt Hổ ★4.4 · Nem nướng Phượng ★4.1 · Bánh tráng nướng Dì Đinh ★4.4 · Cô Hạnh lòng đào ★4.3 · Xíu mại Cô Tuy ★4.0 · Yết Kiêu Quán ★4.4.");
  lines.push("⚠️ Bánh ướt lòng gà Đà Lạt ăn nguội. Ở chợ đêm và quảng trường hỏi giá trước khi ngồi. Quán ngon hết hàng sớm.");
  lines.push("⭐ Số sao Google Maps kiểm tra ngày 20/11/2026. Lẩu gà lá é gốc Phú Yên (mia.vn, lời chủ quán trên TikTok).", "", "Bạn mê món nào nhất? 👇", "");
}
lines.push("—", "🎥 Clip trong video là của các bạn TikToker và Pexels, cảm ơn các bạn:");
const seen = new Map();
for (const c of credits) if (!seen.has(c.source)) seen.set(c.source, c.author);
for (const [src, author] of seen) lines.push(`${author} · ${src.replace("https://www.", "")}`);
lines.push("", slug === "da-lat-4n3d"
  ? "#dalat #dulichdalat #lichtrinhdalat #dalat4n3d #cohongdalat #sanmaydalat #reviewdalat #dulichvietnam #fyp"
  : "#dalat #dalatangi #anngondalat #amthucdalat #reviewdalat #banhcan #laugalae #dulichdalat #fyp");

const text = lines.join("\n") + "\n";
mkdirSync(`output/${slug}`, { recursive: true });
writeFileSync(`output/${slug}/tiktok-caption.txt`, text);
console.log(slug, [...text].length, "chars");
