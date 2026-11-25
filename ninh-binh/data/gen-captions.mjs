// Writes output/<slug>/tiktok-caption.txt for the three Ninh Bình videos (Vietnamese only).
// Places come from video.json, credits from credits.json, so the caption matches the video.
// The last line holds the hashtags (the upload script types them one by one).
// Run: node data/gen-captions.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const read = (p) => JSON.parse(readFileSync(p, "utf8"));
const star = (r) => (r == null ? "" : ` ★${r.toFixed(1)}`);

const COMMON = {
  arrive: "🚌 Từ Hà Nội: limousine/xe khách khoảng 2 tiếng (~90 km), nhiều nhà xe có trung chuyển tới tận homestay; hoặc đi tàu hoả. Thuê xe máy 120–180k/ngày (TikTok). Ninh Bình mới gồm cả Hà Nam và Nam Định cũ.",
  stayHead: "🏨 Nên ở đâu?",
  stay: [
    "• Quanh phố cổ Hoa Lư (tối đi bộ ra phố cổ, nhiều quán) · Hoa Lu City Hotel ★4.9 · OLong Phố cổ Hotel ★4.9",
    "• Tam Cốc (yên tĩnh, đồng lúa, gần Hang Múa) · Tam Coc Minh Hung Homestay ★4.8 · Tamcoc Tropical Homestay ★4.9",
    "• Ven sông Tràng An (sáng ra bến sớm) · Trang An Hana Homestay ★5.0 · Trang An Luxury Homestay ★5.0",
    "• Homestay thường nhận phòng 14h; lễ, cuối tuần nên đặt sớm.",
  ],
  tips: "💡 Mua vé Tràng An online trên web Di sản Tràng An để khỏi xếp hàng; Tràng An có 3 tuyến, mỗi tuyến 2,5–3 tiếng, đi vệ sinh trước khi lên thuyền. Mưa lớn đò có thể tạm dừng (như 09/11/2026), xem thông báo trước khi đi. Chuẩn bị chút tiền tip lái đò. Đi Tam Cốc trước 9h mùa hoa súng; lúa vàng cuối tháng 5 – đầu tháng 6. Thêm nếu còn thời gian: Tuyệt Tình Cốc (~100k), Thung Nham, đầm Vân Long, hồ Đồng Chương.",
  rating: "⭐ Điểm Google Maps kiểm tra và ảnh chụp Maps trong video ngày 09/11/2026 (≥4.5★, ≥50 lượt). Quán ưu tiên theo review TikTok nếu đạt chuẩn.",
  oldies: "🏷️ Nổi tiếng nhưng dưới 4.5★ trên Maps (không lên hình): dê Chính Thư 4.2★, Đức Dê 3.8★, Tam Gia Trang 4.0★, Lương Thương 7 4.0★, bún chả quạt Tuấn Anh 4.2★, bánh cuốn Hương Hương 3.8★, kem xôi Thanh Hằng 4.3★.",
  photos: "Ảnh: Wikimedia Commons, Pexels",
  };
const TRAVEL = {
  "2n1d": {
    head: "Có 2 ngày rảnh? Về Ninh Bình, cách Hà Nội chừng 2 tiếng: Tràng An, Hang Múa, phố cổ Hoa Lư và Tam Cốc, gom từ TikTok, kèm quán ≥4.5★ và chi phí từng khoản 🛶⛰️🏮 Lưu lại nhé!",
    ask: "Nếu chỉ chọn một: Tràng An hay Tam Cốc? 👇",
    tags: "#ninhbinh #dulichninhbinh #trangan #ninhbinh2n1d #lichtrinhdulich #hangmua #tamcoc #dulichvietnam #chiphidulich #fyp",
  },
  "3n2d": {
    head: "Ninh Bình 3N2Đ gom từ TikTok: Tràng An, cố đô Hoa Lư, phố cổ Hoa Lư, Tam Cốc – Bích Động, Hang Múa và chùa Bái Đính, kèm quán ≥4.5★ và chi phí từng khoản 🛶⛰️🏮 Lưu lại nhé!",
    ask: "Bạn sẽ leo Hang Múa lúc bình minh hay hoàng hôn? 👇",
    tags: "#ninhbinh #dulichninhbinh #trangan #ninhbinh3n2d #lichtrinhdulich #hangmua #baidinh #dulichvietnam #chiphidulich #fyp",
  },
};
const EMOJI = { trangan: "🛶", codo: "🏯", phoco: "🏮", tamcoc: "🌾", hangmua: "⛰️", baidinh: "🛕" };

// One entry per author and licence: file titles would push the caption past TikTok's limit.
const credits = (slug) => {
  const all = read(`data/videos/${slug}/credits.json`);
  const seen = new Set();
  for (const c of all) {
    if (/public domain|CC0|Pexels/i.test(c.license)) continue;
    seen.add(`${c.author.replace(/ \(thảo luận\)$/, "").replace(/ from .*$/, "")} (${c.license})`);
  }
  const px = new Set(all.filter((c) => /Pexels/.test(c.license)).map((c) => c.author));
  return [...(seen.size ? [[...seen].join(" · ")] : []), ...(px.size ? [`Pexels: ${[...px].join(" · ")}`] : [])];
};

const save = (slug, lines) => {
  const text = lines.join("\n") + "\n";
  mkdirSync(`output/${slug}`, { recursive: true });
  writeFileSync(`output/${slug}/tiktok-caption.txt`, text);
  console.log(slug, [...text].length, "chars");
};

for (const plan of ["2n1d", "3n2d"]) {
  const slug = `ninh-binh-${plan}`;
  const v = read(`data/videos/${slug}/video.json`);
  const t = { ...COMMON, ...TRAVEL[plan] };
  const lines = [t.head, "", t.arrive, ""];
  for (const s of v.scenes.filter((x) => x.layout === "point")) {
    lines.push(`${EMOJI[s.id]} ${s.label} · ${s.caption}: ${s.points.join(", ")}`);
    // 3N2Đ has six stops: two places each keeps the caption under TikTok's limit.
    lines.push(`   🍽️ ${(plan === "3n2d" ? s.dishes.slice(0, 2) : s.dishes).map((d) => `${d.place} · ${d.address}${star(d.rating)}`).join(" | ")}`);
    if (plan === "2n1d") lines.push(`   ➕ ${s.moreDishes.map((d) => `${d.place}${star(d.rating)}`).join(" | ")}`);
  }
  const cost = v.scenes.find((x) => x.layout === "cost");
  lines.push("", t.stayHead, ...t.stay, "");
  lines.push(`💰 Chi phí ${plan.toUpperCase().replace("D", "Đ")} cho 1 người (2 người đi chung, giá tham khảo đọc ngày 09/11/2026):`);
  for (const it of cost.items) lines.push(`• ${it.k}${it.note ? ` (${it.note})` : ""}: ${it.v}`);
  lines.push(`👉 Tổng khoảng ${cost.total}/người. Chưa gồm tip lái đò, cà phê, photobooth. Nguồn: VnExpress, Znews (Hang Múa 150k từ 1/4/2026), MIA.vn, TikTok.`);
  lines.push("", t.tips, t.rating, t.oldies, "", t.ask, "", "—", t.photos, ...credits(slug), "", t.tags);
  save(slug, lines);
}

const FOOD = {
  head: "Về Ninh Bình ăn gì? 5 món được nhắc nhiều nhất trên TikTok và báo, kèm cách ăn và quán ≥4.5★ 🐐🍚🥢 Lưu lại nhé!",
  extra: "➕ Cũng nên thử: gỏi cá nhệch Kim Sơn (cuốn lá đinh lăng, mơ lông, thính; VnExpress), miến lươn, kem xôi ăn kèm bánh đa, bánh xèo mềm phố 3, cua đồng rang lá lốt.",
  note: "📸 Ảnh minh hoạ đúng món từ Wikimedia Commons và Pexels, không phải ảnh của các quán trong video (một số ảnh dê, bánh cuốn, bún chả chụp nơi khác). Nem chua Yên Mạc chưa có cửa hàng nào đạt ≥4.5★/50 lượt nên chỉ ghi nơi nên mua theo VnExpress.",
  rating: "⭐ Điểm Google Maps kiểm tra và ảnh chụp Maps trong video ngày 09/11/2026 (≥4.5★, ≥50 lượt). Món và cách ăn theo VnExpress, MIA.vn, TikTok.",
  ask: "Dê tái chanh hay bún chả quạt, bạn chọn món nào? 👇",
  tags: "#ninhbinh #ninhbinhangi #amthucninhbinh #dacsanninhbinh #denui #comchay #ancungtiktok #reviewanngon #amthucvietnam #fyp",
};
const DISH_EMOJI = { de: "🐐", comchay: "🍚", nem: "🌿", banhcuon: "🥢", buncha: "🔥" };

{
  const slug = "ninh-binh-am-thuc";
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
