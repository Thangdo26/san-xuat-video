// Writes output/<slug>/tiktok-caption.txt for the six Saigon videos.
// Places come from video.json (dishes + moreDishes, or story places for food),
// credits from credits.json, so the caption always matches the video.
// The last line holds the hashtags (the upload script types them one by one).
// Run: node data/gen-captions.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const read = (p) => JSON.parse(readFileSync(p, "utf8"));

const TRAVEL = {
  vi: {
    head: {
      3: "Sài Gòn 3N2Đ gom từ những video TikTok được thả tim nhiều nhất: Dinh Độc Lập, Chợ Lớn, sông Sài Gòn về đêm và địa đạo Củ Chi 🌃🛶🍜 Lưu lại đi là vừa!",
      4: "Sài Gòn 4N3Đ gom từ TikTok: Dinh Độc Lập, Chợ Lớn, Waterbus ngắm cầu Ba Son, Củ Chi và rừng Sác Cần Giờ 🌃🛶🐒 Lưu lại đi là vừa!",
    },
    arrive: "✈️ Bay thẳng tới sân bay Tân Sơn Nhất, vào Quận 1 khoảng 20–30 phút",
    tips: "💡 Từ bình luận TikTok: đi Waterbus sớm để có chỗ ngồi (gửi xe hầm Saigon Marina ~30k); chợ đêm Bến Thành không còn mở; Bùi Viện coi chừng giá (có người kể 3 xiên nướng 300k); Nhà thờ Đức Bà đang trùng tu tới cuối 2027, chỉ ngắm bên ngoài.",
    research: "🔎 Kịch bản dựa trên 7 video TikTok du lịch nhiều tim nhất 2025–2026 và bình luận, đối chiếu VnExpress, Tuổi Trẻ, Vinpearl.",
    rating: "⭐ Điểm Google Maps kiểm tra ngày 31/10/2026 (≥4.5★, ≥50 lượt).",
    oldies: "🏷️ Nổi tiếng nhưng dưới 4.5★ trên Maps: bánh mì Huỳnh Hoa (4.1★, 7.800+ lượt), cơm tấm Hồng Calmette (4.1★), hủ tiếu Nhân Quán (4.1★), sủi cảo Thiên Thiên (4.2★).",
    ask: "Bạn sẽ đi Waterbus hay Củ Chi trước? 👇",
    photos: "Ảnh: Wikimedia Commons",
    map: "Ảnh vệ tinh: Esri, Maxar, Earthstar Geographics",
    tags: {
      3: "#saigon #dulichsaigon #lichtrinhdulich #saigon3n2d #saigondidau #waterbus #dulichvietnam #reviewdulich #ancungtiktok #fyp",
      4: "#saigon #dulichsaigon #lichtrinhdulich #saigon4n3d #saigondidau #cangio #dulichvietnam #reviewdulich #ancungtiktok #fyp",
    },
  },
  en: {
    head: {
      3: "Saigon in 3 days, built from the most-liked TikTok videos: Independence Palace, Cho Lon, the river at night and the Cu Chi Tunnels 🌃🛶🍜 Save it for your trip!",
      4: "Saigon in 4 days, built from TikTok: Independence Palace, Cho Lon, the Waterbus under Ba Son Bridge, Cu Chi and the Can Gio mangroves 🌃🛶🐒 Save it!",
    },
    arrive: "✈️ Fly into Tan Son Nhat airport, about 20–30 minutes to District 1",
    tips: "💡 From TikTok comments: board the Waterbus early for a seat; the Ben Thanh night market no longer runs; check prices on Bui Vien; Notre-Dame Cathedral is under restoration until late 2027 (outside only).",
    research: "🔎 Script based on the 7 most-liked Saigon travel TikToks of 2025–2026 and their comments, checked against VnExpress, Tuoi Tre and Vinpearl.",
    rating: "⭐ Google Maps ratings checked 31 Oct 2026 (4.5★+, 50+ reviews).",
    oldies: "🏷️ Famous but under 4.5★ on Maps: Huynh Hoa banh mi (4.1★, 7,800+ reviews), Hong Calmette broken rice (4.1★), Nhan Quan hu tieu (4.1★), Thien Thien dumplings (4.2★).",
    ask: "Waterbus or Cu Chi first? 👇",
    photos: "Photos: Wikimedia Commons",
    map: "Satellite imagery: Esri, Maxar, Earthstar Geographics",
    tags: {
      3: "#saigon #hochiminhcity #vietnam #vietnamtravel #saigontravel #waterbus #travelvietnam #traveltok #foodtok #fyp",
      4: "#saigon #hochiminhcity #vietnam #vietnamtravel #saigontravel #cangio #travelvietnam #traveltok #foodtok #fyp",
    },
  },
};
const EMOJI = { dinhdoclap: "🏛️", buudien: "📮", benthanh: "🛍️", nguyenhue: "🌃", cholon: "🏮", song: "🛶", cuchi: "🌿", cangio: "🐒" };

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
    const slug = `saigon-${days === 4 ? "4n3d" : "3n2d"}${lang === "en" ? "-en" : ""}`;
    const v = read(`data/videos/${slug}/video.json`);
    const t = TRAVEL[lang];
    const lines = [t.head[days], "", t.arrive, ""];
    for (const s of v.scenes.filter((x) => x.layout === "point")) {
      lines.push(`${EMOJI[s.id]} ${s.label} · ${s.caption}: ${s.points.join(", ")}`);
      const all = [...s.dishes, ...(s.moreDishes ?? [])];
      lines.push(...all.slice(0, 3).map((d) => `🍽️ ${d.place} · ${d.address} ★${d.rating.toFixed(1)}`));
      const rest = all.slice(3).map((d) => `${d.place} ★${d.rating.toFixed(1)}`).join(" · ");
      if (rest) lines.push(`➕ ${rest}`);
    }
    lines.push("", t.tips, t.research, t.rating, t.oldies, "", t.ask, "", "—", t.photos, ...credits(slug), t.map, "", t.tags[days]);
    save(slug, lines);
  }
}

const FOOD = {
  vi: {
    head: "Đến Sài Gòn ăn gì? 5 món dân TikTok khen nhiều nhất, kèm nguồn gốc, cách ăn và quán ≥4.5★ 🍚🥖🍜 Lưu lại đi là vừa!",
    oldies: "🏷️ Quán nổi tiếng nhưng dưới 4.5★ (không lên hình): cơm tấm Hồng Calmette 4.1★ (1.500+ lượt, nhiều bình luận chê), cơm tấm Thuận Kiều 3.7★, bánh mì Huỳnh Hoa 4.1★ (7.800+), bánh mì Hòa Mã 4.3★, hủ tiếu Nhân Quán 4.1★, bột chiên Đạt Thành 4.2★, sủi cảo Thiên Thiên 4.2★.",
    note: "📸 Ảnh minh hoạ đúng món từ Wikimedia Commons, không phải ảnh của các quán trong video.",
    rating: "⭐ Điểm Google Maps kiểm tra ngày 31/10/2026 (≥4.5★). Món chọn theo 6 video TikTok ẩm thực nhiều tim nhất và bình luận.",
    ask: "Bạn chọn món nào đầu tiên? 👇",
    photos: "Ảnh: Wikimedia Commons",
    tags: "#amthucsaigon #saigonangi #comtam #banhmi #hutieu #ancungtiktok #reviewanngon #amthucvietnam #foodtour #fyp",
  },
  en: {
    head: "What to eat in Saigon? The 5 dishes TikTok loves most, with origins, how to eat them and places rated 4.5★+ 🍚🥖🍜 Save it!",
    oldies: "🏷️ Famous but under 4.5★ (not shown): Hong Calmette broken rice 4.1★, Thuan Kieu 3.7★, Huynh Hoa banh mi 4.1★ (7,800+ reviews), Hoa Ma 4.3★, Nhan Quan hu tieu 4.1★, Dat Thanh bot chien 4.2★, Thien Thien dumplings 4.2★.",
    note: "📸 Photos show each dish from Wikimedia Commons, not the restaurants listed.",
    rating: "⭐ Google Maps ratings checked 31 Oct 2026 (4.5★+). Dishes picked from the 6 most-liked Saigon food TikToks and their comments.",
    ask: "Which one first? 👇",
    photos: "Photos: Wikimedia Commons",
    tags: "#saigonfood #vietnamesefood #banhmi #saigon #vietnam #foodtok #streetfood #vietnamtravel #foodie #fyp",
  },
};
const DISH_EMOJI = { comtam: "🍚", banhmi: "🥖", hutieu: "🍜", bolalot: "🌿", botchien: "🍳" };

for (const lang of ["vi", "en"]) {
  const slug = `saigon-am-thuc${lang === "en" ? "-en" : ""}`;
  const v = read(`data/videos/${slug}/video.json`);
  const t = FOOD[lang];
  const lines = [t.head, ""];
  for (const s of v.scenes.filter((x) => x.story)) {
    const [origin, , eat, where] = s.story.sections;
    lines.push(`${DISH_EMOJI[s.id]} ${s.caption}: ${origin.text}. ${eat.text}`);
    lines.push(`   📍 ${where.places.map((p) => `${p.place} · ${p.address} ★${p.rating.toFixed(1)}`).join(" | ")}`);
  }
  lines.push("", t.oldies, t.note, t.rating, "", t.ask, "", "—", t.photos, ...credits(slug), "", t.tags);
  save(slug, lines);
}
