// Writes output/moc-chau-3n2d/tiktok-caption.txt for the remake of 15/11/2026 (Vietnamese only).
// Places come from video.json, credits from credits.json. The last line holds the hashtags
// (the upload script types them one by one).
// Run: node data/gen-captions-winter.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const read = (p) => JSON.parse(readFileSync(p, "utf8"));
const star = (r) => (r == null ? "" : ` ★${r.toFixed(1)}`);
const slug = "moc-chau-3n2d";
const v = read(`data/videos/${slug}/video.json`);

// One entry per author and licence: file titles would push the caption past TikTok's limit.
const all = read(`data/videos/${slug}/credits.json`);
const cc = new Set();
for (const c of all) if (!/public domain|CC0|Pexels|Pixabay/i.test(c.license)) cc.add(`${c.author} (${c.license})`);
const px = [...new Set(all.filter((c) => /Pexels/.test(c.license)).map((c) => c.author))];
const pb = all.filter((c) => /Pixabay/.test(c.license)).map((c) => c.source.match(/id-(\d+)/)?.[1]).filter(Boolean);

const EMOJI = { tea: "🍃", town: "🏮", falls: "💦", cai: "🌼" };
const lines = [
  "Mộc Châu giữa tháng 11: se lạnh, cải trắng và vàng vừa nở, thác nước trong xanh, Pa Phách hôm nào cũng có mây. Lịch trình 3N2Đ gom từ 26 video TikTok của người vừa đi về, kèm quán ≥4.5★ và chi phí từng khoản 🌿 Lưu lại nhé!",
  "",
  "🚌 Limousine/xe khách Hà Nội ⇄ Mộc Châu ~4 tiếng, nhiều nhà xe trả tận homestay. Thuê xe máy 120–180k/ngày.",
  "",
];
for (const s of v.scenes.filter((x) => x.layout === "point")) {
  lines.push(`${EMOJI[s.id]} ${s.label} · ${s.caption}: ${s.points.join("; ")}`);
  lines.push(`   🍽️ ${[...s.dishes, ...(s.moreDishes ?? [])].map((d) => `${d.place} · ${d.address}${star(d.rating)}`).join(" | ")}`);
}
lines.push("☁️ Pa Phách săn mây: đi từ 5h sáng; tới ngã ba thì rẽ trái; dốc đầu bản nhiều sạn, đi số 1; đoạn đang làm đường mưa xong rất trơn.");
lines.push("🅱️ Phương án B thay cho 2 thác (sáng ngày 2): 5h săn mây Pa Phách rồi vào làng nguyên thủy Hang Táu, cùng cung đường. Vé 30k, gói 70k kèm bánh sắn + nước mía; cưỡi ngựa 50k (theo review TikTok). Trong bản không có sóng điện thoại; đường dốc, tay lái yếu nên thuê người bản địa chở.");
lines.push("➕ Muốn đi thêm: thác Dải Yếm 150k; cầu kính Bạch Long 550k ngày thường, 650k cuối tuần.");
const stay = v.scenes.find((x) => x.layout === "stay");
lines.push("", "🏨 Nên ở đâu?");
for (const z of stay.zones) lines.push(`• ${z.title} (${z.note}): ${z.picks.map(([n, r]) => `${n} ★${r.toFixed(1)}`).join(" · ")}`);
lines.push("• Cuối tuần hay cháy phòng, nên đặt trước 1–2 tuần.");
const cost = v.scenes.find((x) => x.layout === "cost");
lines.push("", "💰 Chi phí 3N2Đ cho 1 người (2 người đi chung, giá tham khảo, đọc ngày 15/11/2026):");
for (const it of cost.items) lines.push(`• ${it.k}${it.note ? ` (${it.note})` : ""}: ${it.v}`);
lines.push(`👉 Tổng khoảng ${cost.total}/người. Nguồn: MoMo, VnExpress và review TikTok.`);
lines.push(
  "",
  "⚠️ Người vừa đi về dặn: hoa nở theo đợt, nhắn hỏi vườn trước khi đi; chợ phiên Bản Vặt Hồng chỉ họp thứ 6 đến Chủ nhật; ở thác đừng tự ý xuống tắm; mang áo ấm.",
  "⭐ Điểm Google Maps kiểm tra và chụp ngày 15/11/2026 (≥4.5★, ≥50 lượt). Bếp Mệ Tình được khen nhiều trên TikTok nhưng mới 4.2★ nên không đưa lên hình.",
  "",
  "Bạn thích Mộc Châu mùa hoa cải hay chờ mùa hoa mận? 👇",
  "",
  "—",
  ...(cc.size ? [`Ảnh: ${[...cc].join(" · ")}`] : []),
  ...(px.length ? [`Pexels: ${px.join(" · ")}`] : []),
  ...(pb.length ? [`Pixabay: video ${pb.join(", ")}`] : []),
  "",
  "#mocchau #dulichmocchau #mocchau3n2d #hoacaimocchau #thacnangtien #lichtrinhdulich #chiphidulich #dulichvietnam #taybac #fyp",
);
const text = lines.join("\n") + "\n";
mkdirSync(`output/${slug}`, { recursive: true });
writeFileSync(`output/${slug}/tiktok-caption.txt`, text);
console.log(slug, [...text].length, "chars");
