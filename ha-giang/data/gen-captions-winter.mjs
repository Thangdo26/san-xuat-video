// Writes output/ha-giang-3n2d/tiktok-caption.txt for the remake of 15/11/2026 (Vietnamese only).
// Places come from video.json, credits from credits.json. The last line holds the hashtags
// (the upload script types them one by one).
// Run: node data/gen-captions-winter.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const read = (p) => JSON.parse(readFileSync(p, "utf8"));
const star = (r) => (r == null ? "" : ` ★${r.toFixed(1)}`);
const slug = "ha-giang-3n2d";
const v = read(`data/videos/${slug}/video.json`);

// One entry per author and licence: file titles would push the caption past TikTok's limit.
const all = read(`data/videos/${slug}/credits.json`);
const cc = new Set();
for (const c of all) if (!/public domain|CC0|Pexels|Pixabay/i.test(c.license)) cc.add(`${c.author.replace(/ \(thảo luận\)$/, "")} (${c.license})`);
const px = [...new Set(all.filter((c) => /Pexels/.test(c.license)).map((c) => c.author))];

const EMOJI = { quanba: "⛰️", thamma: "🌸", vuong: "🏯", lungcu: "🚩", nhoque: "🛶", dongvan: "🏮" };
const lines = [
  "Hà Giang giữa tháng 11: tam giác mạch nở dọc QL4C, sông Nho Quế xanh ngọc, sáng sớm có hôm chỉ 8–9°C. Lịch trình 3N2Đ gom từ 28 video TikTok của người vừa đi về, kèm quán ≥4.5★ và chi phí từng khoản 🌸🏍️ Lưu lại nhé!",
  "",
  "🚌 Xe giường nằm/cabin chạy đêm từ Hà Nội (~300 km), khoảng 4h sáng tới TP Hà Giang. Người đi trước khuyên nghỉ ở nhà xe tới 6h, ăn sáng rồi mới chạy. Hà Giang nay thuộc tỉnh Tuyên Quang.",
  "",
];
for (const s of v.scenes.filter((x) => x.layout === "point")) {
  lines.push(`${EMOJI[s.id]} ${s.label} · ${s.caption}: ${s.points.join("; ")}`);
  lines.push(`   🍽️ ${[...s.dishes, ...(s.moreDishes ?? [])].map((d) => `${d.place} · ${d.address}${star(d.rating)}`).join(" | ")}`);
}
const stay = v.scenes.find((x) => x.layout === "stay");
lines.push("", "🏨 Nên ở đâu? (đêm 1 Lô Lô Chải, đêm 2 Đồng Văn)");
for (const z of stay.zones) lines.push(`• ${z.title}: ${z.picks.map(([n, r]) => `${n} ★${r.toFixed(1)}`).join(" · ")}`);
lines.push("• Mùa hoa, giữa tuần Lô Lô Chải cũng hết phòng đẹp: đặt trước, chỉ chuyển cọc cho chỗ uy tín.");
const cost = v.scenes.find((x) => x.layout === "cost");
lines.push("", "💰 Chi phí 3N2Đ cho 1 người (2 người đi chung, giá tham khảo đọc ngày 15/11/2026):");
for (const it of cost.items) lines.push(`• ${it.k}${it.note ? ` (${it.note})` : ""}: ${it.v}`);
lines.push(`👉 Tổng khoảng ${cost.total}/người. Vé thuyền Nho Quế 150k áp dụng từ 13/4/2026 (Dân Việt); giá xe, phòng theo Vietnamtourism, VnExpress và TikTok.`);
lines.push(
  "",
  "⚠️ Người vừa đi về dặn: mang bằng lái (chốt kiểm tra cả nồng độ cồn); không đổ đèo khi tối; Đồng Văn rét đầu mùa 8–9°C, mang áo ấm, găng, áo mưa; gặp đám tang người Lô Lô thì đứng xem giữ ý.",
  "⭐ Điểm Google Maps kiểm tra và chụp ngày 15/11/2026 (≥4.5★, ≥50 lượt). Cơm nhà anh Quân ở bến Nho Quế chưa có điểm Maps, giá theo review TikTok.",
  "",
  "Bạn định lên Hà Giang ngắm tam giác mạch hay chờ mùa hoa đào? 👇",
  "",
  "—",
  `Ảnh, video: Wikimedia Commons: ${[...cc].join(" · ")}`,
  ...(px.length ? [`Pexels: ${px.join(" · ")}`] : []),
  "",
  "#hagiang #dulichhagiang #hagiangloop #tamgiacmach #hagiang3n2d #songnhoque #lichtrinhdulich #chiphidulich #dulichvietnam #fyp",
);
const text = lines.join("\n") + "\n";
mkdirSync(`output/${slug}`, { recursive: true });
writeFileSync(`output/${slug}/tiktok-caption.txt`, text);
console.log(slug, [...text].length, "chars");
