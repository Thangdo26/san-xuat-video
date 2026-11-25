// Writes output/<slug>/tiktok-caption.txt for the three Hà Giang videos (Vietnamese only).
// Places come from video.json, credits from credits.json, so the caption matches the video.
// The last line holds the hashtags (the upload script types them one by one).
// Run: node data/gen-captions.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const read = (p) => JSON.parse(readFileSync(p, "utf8"));
const star = (r) => (r == null ? "" : ` ★${r.toFixed(1)}`);

const COMMON = {
  arrive: "🚌 Từ Hà Nội: xe giường nằm/cabin chạy đêm từ Mỹ Đình, 3–4h sáng tới TP Hà Giang (khoảng 280 km, VnExpress). Thuê xe máy ở TP, khoảng 180–300k/ngày (TikTok). Hà Giang nay thuộc tỉnh Tuyên Quang.",
  stayHead: "🏨 Nên ở đâu?",
  tips: "💡 Mang bằng lái (nhiều chốt kiểm tra, cả nồng độ cồn). Xuống dốc nhấp nhả phanh, sau mưa có đoạn sạt lở. Chợ phiên Đồng Văn, Mèo Vạc họp sáng Chủ nhật. Tháng 12–1 có thể 0 độ.",
  rating: "⭐ Điểm Google Maps kiểm tra và ảnh chụp Maps trong video ngày 08/11/2026 (≥4.5★, ≥50 lượt). Quán ưu tiên theo review TikTok nếu đạt chuẩn.",
  oldies: "🏷️ Nổi tiếng nhưng dưới 4.5★ trên Maps (không lên hình): Cháo Ấu Tẩu Hương 4.2★, Bánh Cuốn Bà Hà (phố cổ Đồng Văn) 4.2★, cháo Mộc Miên 4.1★, Ngọc Lan Quán (Mèo Vạc) 4.0★.",
  photos: "Ảnh: Wikimedia Commons, Pexels",
  };
const STAY = {
  "3n2d": [
    "• Làng Lô Lô Chải (dưới chân cột cờ, yên bình; cuối tuần đông) · À Lôi Lô Lô Chải ★4.9 · Chanh Homestay ★4.8",
    "• Thị trấn Đồng Văn (gần phố cổ, chợ phiên, nhiều quán) · Nhà nghỉ Quang Trung ★4.9 · Bình Minh Hostel ★4.7",
    "• Mùa hoa tam giác mạch (tháng 10–11), lễ và cuối tuần nên đặt phòng sớm.",
  ],
  "4n3d": [
    "• Làng Lô Lô Chải · À Lôi Lô Lô Chải ★4.9 · Chanh Homestay ★4.8",
    "• Đồng Văn/Mèo Vạc · Nhà nghỉ Quang Trung ★4.9 · Bình Minh Hostel ★4.7",
    "• Du Già (ngủ giữa ruộng, suối) · Pachidua Ecolodge ★4.9 · Km0Home Du Già ★5.0",
    "• Mùa hoa tam giác mạch, lễ và cuối tuần nên đặt phòng sớm.",
  ],
};
const TRAVEL = {
  "3n2d": {
    head: "Hà Giang 3N2Đ gom từ TikTok: cổng trời Quản Bạ, dốc Thẩm Mã, dinh thự họ Vương, cột cờ Lũng Cú, phố cổ Đồng Văn, đèo Mã Pí Lèng và sông Nho Quế, kèm chi phí từng khoản 🇻🇳🏍️⛰️ Lưu lại nhé!",
    ask: "Bạn lên Hà Giang vì cột cờ Lũng Cú hay vì sông Nho Quế? 👇",
    tags: "#hagiang #dulichhagiang #hagiangloop #hagiang3n2d #lichtrinhdulich #lungcu #mapileng #dulichvietnam #chiphidulich #fyp",
  },
  "4n3d": {
    head: "Hà Giang 4N3Đ đi chậm, gom từ TikTok: Quản Bạ, Thẩm Mã, nhà Vương, Lũng Cú, Đồng Văn, Mã Pí Lèng, chợ phiên Mèo Vạc và một đêm ở Du Già, kèm chi phí 🇻🇳🏍️⛰️ Lưu lại nhé!",
    ask: "Nếu chỉ chọn một: ngủ Lô Lô Chải hay ngủ Du Già? 👇",
    tags: "#hagiang #dulichhagiang #hagiangloop #hagiang4n3d #lichtrinhdulich #dugia #mapileng #dulichvietnam #chiphidulich #fyp",
  },
};
const EMOJI = { quanba: "⛰️", thamma: "🛣️", vuong: "🏯", lungcu: "🚩", dongvan: "🏮", mapileng: "🛶", meovac: "🧺", dugia: "🌾" };

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
  const slug = `ha-giang-${plan}`;
  const v = read(`data/videos/${slug}/video.json`);
  const t = { ...COMMON, ...TRAVEL[plan] };
  const lines = [t.head, "", t.arrive, ""];
  for (const s of v.scenes.filter((x) => x.layout === "point")) {
    lines.push(`${EMOJI[s.id]} ${s.label} · ${s.caption}: ${s.points.join(", ")}`);
    lines.push(`   🍽️ ${(plan === "4n3d" ? s.dishes.slice(0, 2) : s.dishes).map((d) => `${d.place} · ${d.address}${star(d.rating)}`).join(" | ")}`);
  }
  const cost = v.scenes.find((x) => x.layout === "cost");
  lines.push("", t.stayHead, ...STAY[plan], "");
  lines.push(`💰 Chi phí ${plan.toUpperCase().replace("D", "Đ")} cho 1 người (2 người đi chung, giá tham khảo đọc ngày 08/11/2026):`);
  for (const it of cost.items) lines.push(`• ${it.k}${it.note ? ` (${it.note})` : ""}: ${it.v}`);
  lines.push(`👉 Tổng khoảng ${cost.total}/người. Chưa gồm cà phê, quà, xe ghép nếu không tự lái. Nguồn: VnExpress, MIA.vn, TikTok.`);
  lines.push("", t.tips, t.rating, t.oldies, "", t.ask, "", "—", t.photos, ...credits(slug), "", t.tags);
  save(slug, lines);
}

const FOOD = {
  head: "Lên Hà Giang ăn gì? 5 món được nhắc nhiều nhất trên TikTok và báo, kèm cách ăn và quán ≥4.5★ 🥢🍲🐓🌸 Lưu lại nhé!",
  extra: "➕ Cũng nên thử: phở chua (Nhà Hàng Hiền Lương ★4.5, 12 Bạch Đằng, TP), mèn mén (bột ngô hấp, nhai kỹ và ăn kèm canh), xôi ngũ sắc ở chợ phiên, cơm bến sông Nho Quế (Sông Nho Quế ★4.8).",
  note: "📸 Ảnh minh hoạ đúng món từ Wikimedia Commons và Pexels, không phải ảnh của các quán trong video (ảnh cháo ấu tẩu, lẩu gà đen chụp nơi khác). Cháo ấu tẩu và bánh tam giác mạch chưa có quán nào đạt ≥4.5★/50 lượt, nên chỉ ghi nơi nên ăn theo VnExpress và TikTok.",
  rating: "⭐ Điểm Google Maps kiểm tra và ảnh chụp Maps trong video ngày 08/11/2026 (≥4.5★, ≥50 lượt). Món và cách ăn theo TikTok, VnExpress, MIA.vn.",
  ask: "Cháo ấu tẩu hay thắng cố, bạn dám thử món nào? 👇",
  tags: "#hagiang #hagiangangi #amthuchagiang #dacsanhagiang #chaoautau #ancungtiktok #reviewanngon #amthucvietnam #dulichhagiang #fyp",
};
const DISH_EMOJI = { banhcuon: "🥢", autau: "🥣", gaden: "🐓", thangco: "🍲", tgm: "🌸" };

{
  const slug = "ha-giang-am-thuc";
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
