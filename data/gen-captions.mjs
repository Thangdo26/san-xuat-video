// Writes output/<slug>/tiktok-caption.txt for the three Sa Pa videos (Vietnamese only).
// Places come from video.json, credits from credits.json, so the caption matches the video.
// The last line holds the hashtags (the upload script types them one by one).
// Run: node data/gen-captions.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const read = (p) => JSON.parse(readFileSync(p, "utf8"));
const star = (r) => (r == null ? "" : ` ★${r.toFixed(1)}`);

const COMMON = {
  arrive: "🚌 Từ Hà Nội: xe cabin chạy đêm (phổ biến nhất trên TikTok), 5,5–6,5 tiếng, sáng sớm tới Sa Pa. Thuê xe máy, hạn chế xe ga vì nhiều dốc (VnExpress).",
  stayHead: "🏨 Nên ở đâu?",
  stay: [
    "• Trung tâm Sa Pa (gần nhà thờ Đá, quán ăn, ga tàu lên Fansipan) · Sapa Centre Hotel ★4.8 · Mega View Homestay ★4.8",
    "• Bản Tả Van (yên tĩnh, view ruộng bậc thang; cách 11 km, cần xe) · Sapa Bamboo Eco ★5.0 · MT House ★4.6",
    "• Mùa lúa chín (cuối tháng 8–9) và cuối tuần nên đặt phòng sớm.",
  ],
  tips: "💡 Cáp treo Fansipan: chuyến lên 8h–15h30, chuyến về cuối 17h, mua online thường rẻ hơn (TikTok). Tháng 6–đầu tháng 8 mưa, dễ sạt lở (VnExpress). Mang áo khoác dày, giày bám.",
  rating: "⭐ Điểm Google Maps kiểm tra và ảnh chụp Maps trong video ngày 07/11/2026 (≥4.5★, ≥50 lượt). Quán ưu tiên theo review TikTok nếu đạt chuẩn.",
  oldies: "🏷️ Nổi tiếng nhưng dưới 4.5★ trên Maps (không lên hình): Cốn Sủi Ông Há 3.9★, bún chả Nga Cảnh 4.4★, Huy Vân 4.4★.",
  photos: "Ảnh: Wikimedia Commons, Pexels",
  };
const TRAVEL = {
  "3n2d": {
    head: "Sa Pa 3N2Đ gom từ TikTok: bản Cát Cát, trung tâm Sa Pa, đỉnh Fansipan, đèo Ô Quy Hồ và bản Tả Van, kèm chi phí từng khoản ⛰️🚡🌾 Lưu lại nhé!",
    ask: "Bạn lên Sa Pa vì Fansipan hay vì lẩu cá tầm? 👇",
    tags: "#sapa #dulichsapa #reviewsapa #sapa3n2d #lichtrinhdulich #fansipan #dulichvietnam #reviewdulich #chiphidulich #fyp",
  },
  "4n3d": {
    head: "Sa Pa 4N3Đ đi chậm, gom từ TikTok: Cát Cát, Fansipan, Ô Quy Hồ, Hàm Rồng, homestay Tả Van, trek Mường Hoa, kèm chi phí ⛰️🚡🌾 Lưu lại nhé!",
    ask: "Nếu chỉ chọn một: săn mây Fansipan hay ngủ homestay Tả Van? 👇",
    tags: "#sapa #dulichsapa #reviewsapa #sapa4n3d #lichtrinhdulich #fansipan #tavan #dulichvietnam #chiphidulich #fyp",
  },
};
const EMOJI = { catcat: "🏞️", city: "⛪", fansipan: "🚡", oquyho: "🌄", tavan: "🌾", hamrong: "⛰️", muonghoa: "🥾" };

// One entry per author and licence: file titles would push the caption past TikTok's limit.
const credits = (slug) => {
  const all = read(`data/videos/${slug}/credits.json`);
  const seen = new Set();
  for (const c of all) {
    if (/public domain|CC0|Pexels/i.test(c.license)) continue;
    seen.add(`${c.author.replace(/ \(thảo luận\)$/, "").replace(/ from .*$/, "")} (${c.license})`);
  }
  const px = new Set(all.filter((c) => /Pexels/.test(c.license)).map((c) => c.author));
  return [[...seen].join(" · "), ...(px.size ? [`Pexels: ${[...px].join(" · ")}`] : [])];
};

const save = (slug, lines) => {
  const text = lines.join("\n") + "\n";
  mkdirSync(`output/${slug}`, { recursive: true });
  writeFileSync(`output/${slug}/tiktok-caption.txt`, text);
  console.log(slug, [...text].length, "chars");
};

for (const plan of ["3n2d", "4n3d"]) {
  const slug = `sa-pa-${plan}`;
  const v = read(`data/videos/${slug}/video.json`);
  const t = { ...COMMON, ...TRAVEL[plan] };
  const lines = [t.head, "", t.arrive, ""];
  for (const s of v.scenes.filter((x) => x.layout === "point")) {
    lines.push(`${EMOJI[s.id]} ${s.label} · ${s.caption}: ${s.points.join(", ")}`);
    lines.push(`   🍽️ ${[...s.dishes, ...(plan === "4n3d" ? [] : s.moreDishes)].map((d) => `${d.place} · ${d.address}${star(d.rating)}`).join(" | ")}`);
  }
  const cost = v.scenes.find((x) => x.layout === "cost");
  lines.push("", t.stayHead, ...t.stay, "");
  lines.push(`💰 Chi phí ${plan.toUpperCase().replace("N", "N").replace("D", "Đ")} cho 1 người (2 người đi chung, giá tham khảo đọc ngày 07/11/2026):`);
  for (const it of cost.items) lines.push(`• ${it.k}${it.note ? ` (${it.note})` : ""}: ${it.v}`);
  lines.push(`👉 Tổng khoảng ${cost.total}/người. Chưa gồm tàu Mường Hoa (200k), cafe, quà. Nguồn: vietnamtourism, Google Maps, VnExpress, TikTok.`);
  lines.push("", t.tips, t.rating, t.oldies, "", t.ask, "", "—", t.photos, ...credits(slug), "", t.tags);
  save(slug, lines);
}

const FOOD = {
  head: "Lên Sa Pa ăn gì? 5 món được nhắc nhiều nhất trên TikTok và báo, kèm cách ăn và quán ≥4.5★ 🍲🐟🐓🍢🎋 Lưu lại nhé!",
  extra: "➕ Cũng nên thử: phở ngô (Phở Ngô Góc Nhà Thờ ★4.9, sau nhà thờ Đá), phở gà (Phở gà Sơn Râu ★4.8, 19 Đông Lợi), lẩu sườn, cá suối nướng. Nhiều người trên TikTok thấy cốn sủi lạ miệng, nhưng điểm Maps của quán nổi tiếng chỉ 3.9★.",
  note: "📸 Ảnh minh hoạ đúng món từ Wikimedia Commons và Pexels, không phải ảnh của các quán trong video (ảnh gà đen, lẩu cá, cơm lam có ảnh chụp nơi khác).",
  rating: "⭐ Điểm Google Maps kiểm tra và ảnh chụp Maps trong video ngày 07/11/2026 (≥4.5★, ≥50 lượt). Món và giá theo TikTok và VnExpress.",
  ask: "Thắng cố hay lẩu cá tầm, bạn chọn món nào? 👇",
  tags: "#sapa #sapaangi #amthucsapa #dacsansapa #lauca tam #ancungtiktok #reviewanngon #amthucvietnam #dulichsapa #fyp".replace("#lauca tam", "#laucatam"),
};
const DISH_EMOJI = { thangco: "🍲", lau: "🐟", gaden: "🐓", nuong: "🍢", comlam: "🎋" };

{
  const slug = "sa-pa-am-thuc";
  const v = read(`data/videos/${slug}/video.json`);
  const t = { ...COMMON, ...FOOD };
  const lines = [t.head, ""];
  for (const s of v.scenes.filter((x) => x.story)) {
    const [origin, made, eat, where] = s.story.sections;
    lines.push(`${DISH_EMOJI[s.id]} ${s.caption}: ${origin.text}. ${made.text}. ${eat.text}`);
    lines.push(`   📍 ${where.places.map((p) => `${p.place} · ${p.address}${star(p.rating)}`).join(" | ")}`);
  }
  lines.push("", t.extra, t.oldies, t.note, t.rating, "", t.ask, "", "—", t.photos, ...credits(slug), "", t.tags);
  save(slug, lines);
}
