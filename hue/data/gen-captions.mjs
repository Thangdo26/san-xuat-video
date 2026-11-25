// Writes output/<slug>/tiktok-caption.txt for the six Huế videos.
// Places come from video.json (dishes + moreDishes, or story places for food),
// credits from credits.json, so the caption always matches the video.
// The last line holds the hashtags (the upload script types them one by one).
// Run: node data/gen-captions.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const read = (p) => JSON.parse(readFileSync(p, "utf8"));

const TRAVEL = {
  vi: {
    head: {
      3: "Huế 3N2Đ gom từ những video TikTok được thả tim nhiều nhất và lời mách của người Huế: Đại Nội, Thiên Mụ, sông Hương lúc hoàng hôn, lăng Tự Đức, Khải Định 🏯🛶🌅 Lưu lại đi là vừa!",
      4: "Huế 4N3Đ gom từ TikTok: Đại Nội, Thiên Mụ, thuyền trên sông Hương, hai lăng vua và hoàng hôn phá Tam Giang 🏯🛶🌅 Lưu lại đi là vừa!",
    },
    arrive: "✈️ Bay tới sân bay Phú Bài, vào trung tâm Huế khoảng 25–30 phút",
    tips: "💡 Từ bình luận TikTok: vào Đại Nội trước 10h vì trong Kinh thành nắng mà ít gió; đi thuyền sông Hương lúc chiều, thuyền rồng buổi tối gần như không thấy cảnh; đoạn bờ nam Lê Lợi cấm đậu xe, gửi xe dưới chân cầu Trường Tiền; bị thu sai giá thì phản ánh qua app Hue-S; tháng 3 đẹp nhất, tháng 6–7 rất nóng, tháng 9–11 mùa mưa.",
    tickets: "🎫 Vé (Tuổi Trẻ, 2025): Đại Nội 200k; lăng Tự Đức, Khải Định, Minh Mạng 150k mỗi lăng. Có bình luận cho biết chính điện lăng Tự Đức đang tu sửa.",
    research: "🔎 Kịch bản dựa trên 13 video TikTok về Huế nhiều tim nhất 2026, đọc cả bình luận và phản hồi, đối chiếu Tuổi Trẻ, VnExpress, Vinpearl.",
    rating: "⭐ Điểm Google Maps kiểm tra ngày 31/10/2026 (≥4.5★, ≥50 lượt). Quanh lăng Khải Định rất ít quán nên gợi ý quán trên đường về; phá Tam Giang chỉ có 4 quán đạt chuẩn.",
    oldies: "🏷️ Nổi tiếng nhưng dưới 4.5★ trên Maps: chè Hẻm (4.0★, 3.600+ lượt), chè Mợ Tôn Đích (3.8★), cơm hến Hoa Đông (4.4★), bún bò bà Nga (4.3★), bánh mì O Thơ (4.4★), cơm mắm Cô Ri (4.1★).",
    ask: "Bạn sẽ đi Đại Nội hay lăng Tự Đức trước? 👇",
    photos: "Ảnh: Wikimedia Commons",
    map: "Ảnh vệ tinh: Esri, Maxar, Earthstar Geographics",
    tags: {
      3: "#hue #dulichhue #codohue #lichtrinhdulich #hue3n2d #reviewhue #dulichvietnam #reviewdulich #ancungtiktok #fyp",
      4: "#hue #dulichhue #codohue #lichtrinhdulich #phatamgiang #reviewhue #dulichvietnam #reviewdulich #ancungtiktok #fyp",
    },
  },
  en: {
    head: {
      3: "Hue in 3 days, built from the most-liked TikTok videos and tips from locals: the Imperial City, Thien Mu, a Perfume River sunset, Tu Duc and Khai Dinh tombs 🏯🛶🌅 Save it for your trip!",
      4: "Hue in 4 days, built from TikTok: the Imperial City, Thien Mu, the Perfume River, two royal tombs and a Tam Giang lagoon sunset 🏯🛶🌅 Save it!",
    },
    arrive: "✈️ Fly into Phu Bai airport, about 25–30 minutes to central Hue",
    tips: "💡 From TikTok comments: enter the Imperial City before 10 am (hot, little breeze inside); take the river boat in the late afternoon, night dragon boats show almost nothing; no parking on the south bank of Le Loi, park under Truong Tien Bridge; March is the best month, June–July very hot, Sept–Nov rainy.",
    tickets: "🎫 Tickets (Tuoi Tre, 2025): Imperial City 200,000 VND; Tu Duc, Khai Dinh and Minh Mang tombs 150,000 VND each. Comments say Tu Duc's main hall is under repair.",
    research: "🔎 Script based on the 13 most-liked Hue TikToks of 2026, including comments and replies, checked against Tuoi Tre, VnExpress and Vinpearl.",
    rating: "⭐ Google Maps ratings checked 31 Oct 2026 (4.5★+, 50+ reviews). Few places near Khai Dinh tomb, so these are on the way back; only 4 qualify at Tam Giang.",
    oldies: "🏷️ Famous but under 4.5★ on Maps: Che Hem (4.0★, 3,600+ reviews), Che Mo Ton Dich (3.8★), Hoa Dong clam rice (4.4★), Ba Nga bun bo (4.3★), O Tho banh mi (4.4★), Co Ri (4.1★).",
    ask: "Imperial City or Tu Duc tomb first? 👇",
    photos: "Photos: Wikimedia Commons",
    map: "Satellite imagery: Esri, Maxar, Earthstar Geographics",
    tags: {
      3: "#hue #huevietnam #vietnam #vietnamtravel #imperialcity #perfumeriver #travelvietnam #traveltok #foodtok #fyp",
      4: "#hue #huevietnam #vietnam #vietnamtravel #imperialcity #perfumeriver #travelvietnam #traveltok #foodtok #fyp",
    },
  },
};
const EMOJI = { dainoi: "🏯", thienmu: "🛕", song: "🛶", truongtien: "🌉", tuduc: "🌲", khaidinh: "👑", tamgiang: "🌅", dongba: "🛍️" };

// One entry per author and licence: file titles would push the caption past TikTok's limit.
const credits = (slug) => {
  const seen = new Set();
  for (const c of read(`data/videos/${slug}/credits.json`)) {
    if (/public domain|CC0/i.test(c.license)) continue;
    seen.add(`${c.author.replace(/ \(thảo luận\)$/, "")} (${c.license})`);
  }
  return [[...seen].join(" · ")];
};

const save = (slug, lines) => {
  const text = lines.join("\n") + "\n";
  mkdirSync(`output/${slug}`, { recursive: true });
  writeFileSync(`output/${slug}/tiktok-caption.txt`, text);
  console.log(slug, [...text].length, "chars");
};

for (const lang of ["vi", "en"]) {
  for (const days of [3, 4]) {
    const slug = `hue-${days === 4 ? "4n3d" : "3n2d"}${lang === "en" ? "-en" : ""}`;
    const v = read(`data/videos/${slug}/video.json`);
    const t = TRAVEL[lang];
    const lines = [t.head[days], "", t.arrive, ""];
    for (const s of v.scenes.filter((x) => x.layout === "point")) {
      lines.push(`${EMOJI[s.id]} ${s.label} · ${s.caption}: ${s.points.join(", ")}`);
      // Only the three on-screen places: listing moreDishes too would pass 4,000 characters
      // (the full list stays in research/food.md).
      lines.push(...s.dishes.map((d) => `🍽️ ${d.place} · ${d.address} ★${d.rating.toFixed(1)}`));
    }
    lines.push("", t.tips, t.tickets, t.rating, t.oldies, "", t.ask, "", "—", t.photos, ...credits(slug), t.map, "", t.tags[days]);
    save(slug, lines);
  }
}

const FOOD = {
  vi: {
    head: "Đến Huế ăn gì? 5 món dân TikTok khen nhiều nhất, kèm nguồn gốc, cách ăn và quán ≥4.5★ 🍜🍚🥟 Lưu lại đi là vừa!",
    extra: "➕ Cũng được khen nhiều trên TikTok (không có ảnh tự do nên không lên hình): bánh ép (Bánh ép Trang 9A Nguyễn Hữu Thọ ★4.6, O Đơ 118 Mai Thúc Loan ★4.8), bánh canh Nam Phổ (Rin 15 Hàn Mặc Tử ★5.0), gân kiệu bóp (rất cay).",
    oldies: "🏷️ Quán nổi tiếng nhưng dưới 4.5★ (không lên hình): chè Hẻm 4.0★ (3.600+ lượt), chè Mợ Tôn Đích 3.8★ (dân Huế chê giá cao), cơm hến Hoa Đông 4.4★ (2.500+), bún bò bà Nga 4.3★, bún bò Loan 4.3★, bánh ép 1992 4.3★, bánh mì O Thơ 4.4★.",
    note: "⚠️ Đồ Huế cay và mặn, bụng yếu thì dặn ít cay. 📸 Ảnh minh hoạ đúng món từ Wikimedia Commons, không phải ảnh của các quán trong video.",
    rating: "⭐ Điểm Google Maps kiểm tra ngày 31/10/2026 (≥4.5★). Món chọn theo các video TikTok ẩm thực Huế nhiều tim nhất, cả bình luận và phản hồi của người Huế.",
    ask: "Bạn có dám thử chè bột lọc heo quay không? 👇",
    photos: "Ảnh: Wikimedia Commons",
    tags: "#amthuchue #hueangi #bunbohue #comhen #banhbeo #ancungtiktok #reviewanngon #amthucvietnam #foodtour #fyp",
  },
  en: {
    head: "What to eat in Hue? The 5 dishes TikTok loves most, with origins, how to eat them and places rated 4.5★+ 🍜🍚🥟 Save it!",
    extra: "➕ Also loved on TikTok (no free photos, so not shown): banh ep pressed rice crisps (Banh ep Trang ★4.6, O Do ★4.8), banh canh Nam Pho (Rin ★5.0), spicy gan kieu bop.",
    oldies: "🏷️ Famous but under 4.5★ (not shown): Che Hem 4.0★ (3,600+ reviews), Che Mo Ton Dich 3.8★, Hoa Dong clam rice 4.4★, Ba Nga bun bo 4.3★, Loan bun bo 4.3★, Banh ep 1992 4.3★, O Tho banh mi 4.4★.",
    note: "⚠️ Hue food is spicy and salty; ask for less chili. 📸 Photos show each dish from Wikimedia Commons, not the restaurants listed.",
    rating: "⭐ Google Maps ratings checked 31 Oct 2026 (4.5★+). Dishes picked from the most-liked Hue food TikToks, their comments and locals' replies.",
    ask: "Would you try roast pork in your che? 👇",
    photos: "Photos: Wikimedia Commons",
    tags: "#huefood #vietnamesefood #bunbohue #hue #vietnam #foodtok #streetfood #vietnamtravel #foodie #fyp",
  },
};
const DISH_EMOJI = { bunbo: "🍜", comhen: "🍚", banhbeo: "🥟", banhnam: "🍃", che: "🍧" };

for (const lang of ["vi", "en"]) {
  const slug = `hue-am-thuc${lang === "en" ? "-en" : ""}`;
  const v = read(`data/videos/${slug}/video.json`);
  const t = FOOD[lang];
  const lines = [t.head, ""];
  for (const s of v.scenes.filter((x) => x.story)) {
    const [origin, , eat, where] = s.story.sections;
    lines.push(`${DISH_EMOJI[s.id]} ${s.caption}: ${origin.text}. ${eat.text}`);
    lines.push(`   📍 ${where.places.map((p) => `${p.place} · ${p.address} ★${p.rating.toFixed(1)}`).join(" | ")}`);
  }
  lines.push("", t.extra, t.oldies, t.note, t.rating, "", t.ask, "", "—", t.photos, ...credits(slug), "", t.tags);
  save(slug, lines);
}
