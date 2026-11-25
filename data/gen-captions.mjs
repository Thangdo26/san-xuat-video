// Writes output/<slug>/tiktok-caption.txt (Vietnamese) for the two Hà Giang v2 videos. TikTok clips are credited by
// handle with the video link, Pexels clips by author (user request 16/11/2026). The last line holds the hashtags
// (typed one by one when posting). No AI-voice/tool credit line (user, 14/11/2026).
// Run: node data/gen-captions.mjs ha-giang-3n2d-v2 | ha-giang-am-thuc-v2
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const slug = process.argv[2];
const v = JSON.parse(readFileSync(`data/videos/${slug}/video.json`, "utf8"));
const credits = JSON.parse(readFileSync(`data/videos/${slug}/credits.json`, "utf8"));
const TRAVEL_SLUG = "ha-giang-3n2d-v2";

const TRAVEL = [
  "Hà Giang cuối tháng 11: mùa tam giác mạch, sáng 8–14°C, cảnh đẹp muốn xỉu 🌸⛰️ Lịch trình 3N2Đ (+ gợi ý ngày 4) gom từ 33 video TikTok của người vừa đi về, đọc hết lời thoại và bình luận. Lưu lại nhé!",
  "",
  "🚌 Đêm 0: xe giường nằm/cabin 20–22h từ Hà Nội, 3–4h sáng tới TP Hà Giang, ngủ tạm ở chỗ thuê xe (dorm miễn phí).",
  "📍 N1 (~180 km): Km0 → cổng trời Quản Bạ → cây cô đơn (đúng đường Cán Tỷ) → trưa Yên Minh → dốc Thẩm Mã → dốc Chín Khoanh, phố Cáo → nhà của Pao → ngủ Lô Lô Chải, tới trước 17h. Ăn: Lan Anh ★4.8 (Quản Bạ) · Ngọc Tuyên ★4.9 (Yên Minh) · Lalaland ★4.9 (Lô Lô).",
  "📍 N2: cột cờ Lũng Cú (cuối tuần gửi xe, đi xe điện; vé ~70k gồm xe điện, theo review TikTok) → đèo Mã Pì Lèng → sông Nho Quế: Maps gõ \"bến thuyền hẻm Tu Sản\", vé thuyền 150k (Dân Việt, từ 13/4/2026), cơm view sông tới trước 11h, dành 3–4 tiếng → tối phố cổ Đồng Văn (tối thứ 7 lửa trại). Ăn: Tu Sản Coffee ★4.9 · Thạch Sơn quán ★4.9 · Thao Linh ★4.8.",
  "📍 N3: Chủ nhật ăn phở chợ phiên Đồng Văn → về TP. Từ Yên Minh tìm \"dừng chân dốc Cán Tỷ\", đừng theo Maps vào đường rừng thông (xa thêm ~20 km, đường xấu).",
  "",
  "➕ Đi 4N3Đ thì thêm: ngủ Mèo Vạc (Cao nguyên đá homestay ★4.8), về bằng cung Du Già: đẹp nhất nhưng đường xấu, vắng, ít cây xăng, đổ đầy bình và đi trước 11h.",
  "",
  "🏨 Ngủ đâu?",
  "• Đêm 1 Lô Lô Chải / Thèn Pả (yên tĩnh): Ma Pi Leng Homestay ★4.9 · Thing 0 Homestay ★4.9",
  "• Đêm 2 phố cổ Đồng Văn (vui): PiTu Homestay ★5.0 · CiCi homestay ★4.7",
  "• Mùa hoa cuối tháng 11 rất đông, đặt phòng trước.",
  "",
];
const FOOD = [
  "Lên Hà Giang ăn gì ngoài lẩu? 6 món dân địa phương ăn thật, chọn từ 30 video TikTok (đọc hết lời thoại + bình luận), quán lên hình đều ≥4.5★ Google Maps 🍜 Lưu lại nhé!",
  "",
];

const lines = [...(slug === TRAVEL_SLUG ? TRAVEL : FOOD)];
if (slug === TRAVEL_SLUG) {
  const cost = v.scenes.find((s) => s.layout === "cost");
  lines.push("💰 3N2Đ tự túc từ Hà Nội, 1 người (giá tham khảo, đọc ngày 21/11/2026):");
  lines.push(...cost.items.map((it) => `• ${it.k}: ${it.v}`));
  lines.push(`👉 Tổng khoảng ${cost.total.replace("~", "")}/người (4N3Đ khoảng 3,5–4,2tr). Nguồn: review TikTok 2026, Dân Việt.`, "");
  lines.push("⚠️ Người đi trước dặn: mang bằng lái (có chốt kiểm tra); giữ xăng đầy bình; trời tối ~17h, đừng chạy đèo khi tối, sương; không đỗ xe đường vào phố cổ Đồng Văn (biển cấm); đợt lạnh 18–22/11 có mưa phùn, mang áo ấm + áo mưa.");
  lines.push("⭐ Số sao Google Maps kiểm tra ngày 21/11/2026.", "", "Bạn định đi Hà Giang mấy ngày? 👇", "");
} else {
  const notes = {
    banhcuon: "bột gạo tẻ, chan nước ninh xương, suất 30–35k",
    pho: "lợn bản da giòn, nước xương; quán bà Dung trong chợ Đồng Văn (không có trên Maps, dân địa phương khen)",
    cuoncai: "thịt cuốn cải mèo nướng than ở làng Lô Lô Chải (quầy nướng, theo review TikTok)",
    lau: "gà đen nấu lẩu, ăn tối trời lạnh",
    thangco: "thịt, lòng ngựa hầm thảo quả, lá thắng cố; 2 người gọi nồi nhỏ",
    chao: "củ ấu tẩu (ô đầu) có độc nếu chế biến sai (BV Bạch Mai), chỉ ăn quán làm kỹ; sợ đắng xin ít ấu tẩu. Chưa quán nào ≥4.5★: Cháo Ấu Tẩu Hương ★4.2 · Quán cháo Mộc Miên (Đồng Văn) ★4.1",
  };
  for (const s of v.scenes.filter((x) => x.layout === "dish")) {
    const rated = s.places.filter((p) => p.rating != null);
    lines.push(`${s.n}. ${s.caption} (${s.tag}): ${notes[s.id]}.`);
    if (rated.length) lines.push(`   📍 ${rated.map((p) => `${p.place} ★${p.rating.toFixed(1)} · ${p.address}`).join(" | ")}`);
  }
  lines.push("", "🏷️ Nổi tiếng trên TikTok nhưng dưới 4.5★ (tự cân nhắc): Quý Bếp thắng cố ngựa ★4.2 · Bánh Cuốn Bà Hà (Đồng Văn) ★4.1 · Bánh cuốn Bà Làn ★4.3.");
  lines.push("🎁 Mua làm quà: thịt treo gác bếp (lợn đen ướp muối, gừng, ớt, hun khói bếp củi).");
  lines.push("⭐ Số sao Google Maps kiểm tra ngày 21/11/2026.", "", "Bạn dám thử món nào? 👇", "");
}
lines.push("—", "🎥 Clip trong video là của các bạn TikToker và Pexels, cảm ơn các bạn:");
const seen = new Map();
for (const c of credits) if (!seen.has(c.source)) seen.set(c.source, c.author);
// One line per source video, kept short to fit TikTok's 4,000 characters: "@handle · video <id>".
for (const [src, author] of seen) lines.push(`${author} · ${/pexels/.test(src) ? "" : "video "}${src.match(/(\d+)\/?$/)[1]}`);
lines.push("", slug === TRAVEL_SLUG
  ? "#hagiang #dulichhagiang #lichtrinhhagiang #hagiang3n2d #hoatamgiacmach #songnhoque #reviewhagiang #dulichvietnam #fyp"
  : "#hagiang #hagiangangi #amthuchagiang #dacsanhagiang #thangco #chaoautau #reviewhagiang #dulichhagiang #fyp");

const text = lines.join("\n") + "\n";
mkdirSync(`output/${slug}`, { recursive: true });
writeFileSync(`output/${slug}/tiktok-caption.txt`, text);
console.log(slug, [...text].length, "chars");
