// Writes output/cat-ba-2n1d/tiktok-caption.txt (Vietnamese only).
// Places come from video.json, credits from credits.json, so the caption matches the video.
// The last line holds the hashtags (the upload script types them one by one).
// Run: node data/gen-captions.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const read = (p) => JSON.parse(readFileSync(p, "utf8"));
const star = (r) => (r == null ? "" : ` ★${r.toFixed(1)}`);
const slug = "cat-ba-2n1d";
const v = read(`data/videos/${slug}/video.json`);
const EMOJI = { duongra: "🌉", venbien: "🛵", catco: "🌅", lanha: "🛶", xuyendao: "🌾" };

const lines = [
  "Cát Bà mùa lạnh không để tắm biển mà để chạy xe: cầu vượt biển dài nhất Việt Nam, cáp treo qua biển, cung đường ven biển 356 và đường xuyên đảo mùa hoa lau. Lịch trình 2N1Đ gom từ TikTok, kèm quán ≥4.5★ và chi phí từng khoản 🌊🛵 Lưu lại nhé!",
  "",
  "🚌 Từ Hà Nội khoảng 160 km: limousine, xe khách 3,5–4,5 tiếng (đã gồm phà), hoặc tự đi xe máy qua cầu Tân Vũ – Lạch Huyện (5,44 km). Qua đảo bằng cáp treo Cát Hải – Phù Long (~3.955 m, khoảng 10–15 phút, nghỉ thứ Ba từ 7/9/2026) hoặc phà Đồng Bài – Cái Viềng.",
  "",
];
for (const s of v.scenes.filter((x) => x.layout === "point")) {
  lines.push(`${EMOJI[s.id]} ${s.label} · ${s.caption}: ${s.points.join(", ")}`);
  lines.push(`   🍽️ ${[...s.dishes, ...s.moreDishes].map((d) => `${d.place} · ${d.address}${star(d.rating)}`).join(" | ")}`);
}
const stay = v.scenes.find((x) => x.layout === "stay");
lines.push("", "🏨 Nên ở đâu?");
for (const z of stay.zones) lines.push(`• ${z.title} (${z.note}) · ${z.picks.map(([n, r]) => `${n} ★${r.toFixed(1)}`).join(" · ")}`);
lines.push("• Mùa vắng phòng đẹp ở trung tâm khoảng 500–600k/phòng (TikTok); vẫn nên đặt trước khi ra đảo.");
const cost = v.scenes.find((x) => x.layout === "cost");
lines.push("", "💰 Chi phí 2N1Đ cho 1 người (2 người đi chung, giá tham khảo đọc ngày 14/11/2026):");
for (const it of cost.items) lines.push(`• ${it.k}${it.note ? ` (${it.note})` : ""}: ${it.v}`);
lines.push(`👉 Tổng khoảng ${cost.total}/người. Nguồn: Vietnamtourism, Sun Paradise Land, trang tour Cát Bà, TikTok.`);
lines.push(
  "",
  "💡 Mang áo gió khi chạy xe dọc biển; đường 356 nhiều cua, chạy chậm. Xem lịch phà, chuyến cáp treo cuối; gió to phà có thể dừng. Pháo đài Thần Công có nguồn ghi đang đóng cửa (10/2026), hỏi trước khi lên.",
  "⭐ Điểm Google Maps kiểm tra và ảnh chụp Maps trong video ngày 14/11/2026 (≥4.5★, ≥50 lượt).",
  "🏷️ Nổi tiếng trên TikTok nhưng dưới 4.5★ trên Maps (không lên hình): bánh đa cua Khánh Trang 4.2★, buffet Ốc Ba Tàu 4.2★, lẩu nướng Thuý Anh 4.2★, Đại Lộc Quán 4.2★, hải sản Vũ Dương 4.4★.",
  "",
  "Bạn thích chạy đường ven biển hay đường xuyên đảo hơn? 👇",
  "",
  "—",
);
const credits = read(`data/videos/${slug}/credits.json`);
const cc = new Set();
for (const c of credits) if (!/public domain|CC0|Pexels/i.test(c.license)) cc.add(`${c.author.replace(/ at vi\.wikipedia$/, "")} (${c.license})`);
const px = new Set(credits.filter((c) => /Pexels/.test(c.license)).map((c) => c.author));
lines.push("Ảnh, video: Wikimedia Commons, Flickr, Pexels", [...cc].join(" · "), `Pexels: ${[...px].join(" · ")}`);
lines.push("");
lines.push("#catba #dulichcatba #haiphong #catbamuadong #cungduongvenbien #lichtrinhdulich #vinhlanha #dulichvietnam #chiphidulich #fyp");
const text = lines.join("\n") + "\n";
mkdirSync(`output/${slug}`, { recursive: true });
writeFileSync(`output/${slug}/tiktok-caption.txt`, text);
console.log(slug, [...text].length, "chars");
