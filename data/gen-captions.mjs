// Writes output/<slug>/tiktok-caption.txt for the four Phú Quốc videos.
// Restaurants come from video.json (dishes + moreDishes), photo credits from
// credits.json, so the caption always matches what the video shows.
// Run: node data/gen-captions.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const read = (p) => JSON.parse(readFileSync(p, "utf8"));

const HEAD = {
  vi: {
    3: "Phú Quốc 3N2Đ: Bãi Sao, cáp treo vượt biển, hoàng hôn Dinh Cậu và hải sản tươi rói 🏝️🚡🦀 Lưu lại đi là vừa!",
    4: "Phú Quốc 4N3Đ: Bãi Sao, cáp treo Hòn Thơm, sao biển Rạch Vẹm, Grand World và hải sản 🏝️⭐🦀 Lưu lại đi là vừa!",
  },
  en: {
    3: "Phu Quoc in 3 days: Sao beach, a cable car over the sea, sunset at Dinh Cau and fresh seafood 🏝️🚡🦀 Save it for your trip!",
    4: "Phu Quoc in 4 days: Sao beach, the Hon Thom cable car, starfish at Rach Vem, Grand World and seafood 🏝️⭐🦀 Save it for your trip!",
  },
};
const TXT = {
  vi: {
    flight: "✈️ Bay thẳng từ Hà Nội, TP.HCM tới sân bay Phú Quốc (giữa đảo)",
    day: { "day1-sang": "📍 Ngày 1 · Sáng", "day1-toi": "🌇 Ngày 1 · Tối", "day2-captreo": "🚡 Ngày 2 · Sáng", "day2-dinhcau": "🌅 Ngày 2 · Chiều", "day3-bac": "⭐ Ngày 3 · Sáng", "day3-grand": "🏮 Ngày 3 · Tối", "last-duongdong": "📍 Ngày cuối" },
    research: "🔎 Lịch trình tổng hợp từ blog du lịch (VnExpress, Explorer Tom 10/2026, Vinpearl) và bình luận TikTok.",
    rating: "⭐ Điểm Google Maps kiểm tra ngày 30/10/2026 (≥4.5★).",
    oldies: "🏷️ Quán lâu đời, nổi tiếng nhưng điểm Maps dưới 4.5★: bún quậy Kiến Xây 28 Bạch Đằng (4.2★, 6.400+ lượt), bánh canh Phụng 27 Bạch Đằng (4.2★), bún kèn Út Lượm 42 Đường 30/4 (4.3★).",
    notes: "ℹ️ Show Nụ hôn của biển 21h, nghỉ thứ Ba. Giá vé cáp treo, Safari thay đổi theo đợt, xem trang chính thức. Mùa khô (đẹp nhất) khoảng tháng 11–4. Từ 1/7/2025 Phú Quốc là đặc khu thuộc tỉnh An Giang.",
    ask: "Bạn sẽ đi Phú Quốc mấy ngày? 👇",
    photos: "Ảnh: Wikimedia Commons",
    map: "Bản đồ: © OpenMapTiles © OpenStreetMap contributors",
    voice: "Giọng đọc AI · Nhạc nền tự sản xuất",
    tags: { 3: "#phuquoc #dulichphuquoc #lichtrinhdulich #phuquoc3n2d #captreohonthom #sunsettown #dulichvietnam #reviewdulich #ancungtiktok #fyp", 4: "#phuquoc #dulichphuquoc #lichtrinhdulich #phuquoc4n3d #grandworld #rachvem #dulichvietnam #reviewdulich #ancungtiktok #fyp" },
  },
  en: {
    flight: "✈️ Direct flights from Hanoi and Ho Chi Minh City to Phu Quoc airport (mid-island)",
    day: { "day1-sang": "📍 Day 1 · Morning", "day1-toi": "🌇 Day 1 · Evening", "day2-captreo": "🚡 Day 2 · Morning", "day2-dinhcau": "🌅 Day 2 · Afternoon", "day3-bac": "⭐ Day 3 · Morning", "day3-grand": "🏮 Day 3 · Evening", "last-duongdong": "📍 Last day" },
    research: "🔎 Built from travel blogs (VnExpress, Explorer Tom Oct 2026, Vinpearl) plus TikTok comments.",
    rating: "⭐ Google Maps ratings checked 30 Oct 2026 (4.5★+).",
    oldies: "🏷️ Famous old-timers rated under 4.5★ on Maps: Kien Xay bun quay, 28 Bach Dang (4.2★, 6,400+ reviews), Phung noodle soup, 27 Bach Dang (4.2★), Ut Luom bun ken, 42 Duong 30/4 (4.3★).",
    notes: "ℹ️ Kiss of the Sea show at 9 pm, no show on Tuesdays. Cable car and Safari prices change often, check official sites. Dry season (best) is roughly Nov–Apr.",
    ask: "How many days would you spend in Phu Quoc? 👇",
    photos: "Photos: Wikimedia Commons",
    map: "Map: © OpenMapTiles © OpenStreetMap contributors",
    voice: "AI voice: Microsoft Edge TTS · Original music",
    tags: { 3: "#phuquoc #vietnam #vietnamtravel #phuquocisland #sunsettown #islandlife #travelvietnam #traveltok #foodtok #fyp", 4: "#phuquoc #vietnam #vietnamtravel #phuquocisland #grandworld #islandlife #travelvietnam #traveltok #foodtok #fyp" },
  },
};
const EMOJI = { "day1-sang": "🍲", "day1-toi": "🦀", "day2-captreo": "🍤", "day2-dinhcau": "🦞", "day3-bac": "🐟", "day3-grand": "🦐", "last-duongdong": "🍜" };

for (const lang of ["vi", "en"]) {
  for (const days of [3, 4]) {
    const slug = `phu-quoc-${days === 4 ? "4n3d" : "3n2d"}${lang === "en" ? "-en" : ""}`;
    const v = read(`data/videos/${slug}/video.json`);
    const credits = read(`data/videos/${slug}/credits.json`);
    const t = TXT[lang];
    const lines = [HEAD[lang][days], "", t.flight, ""];
    for (const s of v.scenes.filter((x) => x.layout === "point")) {
      lines.push(`${t.day[s.id]} · ${s.points.join(", ")}`);
      const all = [...(s.dishes || []), ...(s.moreDishes || [])];
      const first = days === 4
        ? [`${EMOJI[s.id]} ` + all.slice(0, 3).map((d) => `${d.place} · ${d.address} ★${d.rating}`).join(" | ")]
        : all.slice(0, 3).map((d) => `${EMOJI[s.id]} ${d.place} (${d.name}) · ${d.address} ★${d.rating}`);
      const rest = all.slice(3, days === 4 ? 3 : 5).map((d) => `${d.place} ★${d.rating}`).join(" · ");
      lines.push(...first);
      if (rest) lines.push(`${EMOJI[s.id]} ${rest}`);
      if (s.tip && days === 3) lines.push(`💡 ${s.tip}`);
      lines.push("");
    }
    if (days === 3) lines.push(t.research);
    lines.push(t.rating, t.oldies, t.notes, "", t.ask, "", "—", t.photos);
    const credited = credits.filter((c) => !/public domain|CC0/i.test(c.license));
    for (const c of credited) lines.push(`• ${c.author.replace(/ \(thảo luận\)$/, "")} · ${c.license} · ${c.title.replace(/^File:/, "")}`);
    lines.push(t.map, t.voice, "", t.tags[days]);
    const text = lines.join("\n") + "\n";
    mkdirSync(`output/${slug}`, { recursive: true });
    writeFileSync(`output/${slug}/tiktok-caption.txt`, text);
    console.log(slug, [...text].length, "chars");
  }
}
