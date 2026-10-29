// Writes output/<slug>/tiktok-caption.txt for the four Nha Trang videos.
// Restaurants come from video.json (dishes + moreDishes), photo credits from
// credits.json, so the caption always matches what the video shows.
// Run: node data/gen-captions.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const read = (p) => JSON.parse(readFileSync(p, "utf8"));

const HEAD = {
  vi: {
    3: "Nha Trang 3N2Đ: tháp Chăm, tour đảo lặn ngắm san hô, hải sản và ăn sáng chợ Đầm 🌊🐠🦐 Lưu lại đi là vừa!",
    4: "Nha Trang 4N3Đ: tháp Chăm, tour đảo, VinWonders và biển Dốc Lết vắng người 🌊🎢🏝️ Lưu lại đi là vừa!",
  },
  en: {
    3: "Nha Trang in 3 days: Cham towers, island hopping over coral, seafood and breakfast at Dam market 🌊🐠🦐 Save it for your trip!",
    4: "Nha Trang in 4 days: Cham towers, islands, VinWonders and the quiet beach at Doc Let 🌊🎢🏝️ Save it for your trip!",
  },
};
const TXT = {
  vi: {
    flight: "✈️ Bay thẳng từ Hà Nội, TP.HCM tới sân bay Cam Ranh (cách trung tâm ~35 km)",
    day: { "day1-sang": "📍 Ngày 1 · Sáng", "day1-chieu": "📍 Ngày 1 · Chiều", "day1-toi": "🌙 Ngày 1 · Tối", "day2-dao": "📍 Ngày 2", "day3-vin": "📍 Ngày 3", "day3-chodam": "📍 Ngày 3", "day4-doclet": "📍 Ngày 4" },
    research: "🔎 Lịch trình tổng hợp từ blog du lịch và mẹo của dân Nha Trang trong bình luận TikTok.",
    rating: "⭐ Điểm Google Maps kiểm tra ngày 29/10/2026 (≥4.5★), nhớ xem lại giờ mở cửa.",
    weather: "🌧️ Mùa mưa tháng 9–12, mưa nhiều nhất tháng 10–11. Hàng quán trên bãi biển Trần Phú hiện ngưng sau 18h (từ 12/8/2026).",
    ask: "Bạn sẽ đi Nha Trang mấy ngày? 👇",
    photos: "Ảnh: Wikimedia Commons",
    map: "Bản đồ: © OpenMapTiles © OpenStreetMap contributors",
    voice: "Giọng đọc AI · Nhạc nền tự sản xuất",
    tags: { 3: "#nhatrang #dulichnhatrang #lichtrinhdulich #nhatrang3n2d #honmun #khanhhoa #dulichvietnam #reviewdulich #ancungtiktok #fyp", 4: "#nhatrang #dulichnhatrang #lichtrinhdulich #nhatrang4n3d #vinwonders #doclet #dulichvietnam #reviewdulich #ancungtiktok #fyp" },
  },
  en: {
    flight: "✈️ Direct flights from Hanoi and Ho Chi Minh City to Cam Ranh airport (~35 km from the centre)",
    day: { "day1-sang": "📍 Day 1 · Morning", "day1-chieu": "📍 Day 1 · Afternoon", "day1-toi": "🌙 Day 1 · Evening", "day2-dao": "📍 Day 2", "day3-vin": "📍 Day 3", "day3-chodam": "📍 Day 3", "day4-doclet": "📍 Day 4" },
    research: "🔎 Built from travel blogs plus tips from Nha Trang locals in TikTok comments.",
    rating: "⭐ Google Maps ratings checked 29 Oct 2026 (4.5★+). Check opening hours before you go.",
    weather: "🌧️ Rainy season is Sep–Dec, wettest in Oct–Nov. Beach vendors on Tran Phu currently close at 6 pm (since 12 Aug 2026).",
    ask: "How many days would you spend in Nha Trang? 👇",
    photos: "Photos: Wikimedia Commons",
    map: "Map: © OpenMapTiles © OpenStreetMap contributors",
    voice: "AI voice: Microsoft Edge TTS · Original music",
    tags: { 3: "#nhatrang #vietnam #vietnamtravel #nhatrangvietnam #khanhhoa #centralvietnam #travelvietnam #traveltok #foodtok #fyp", 4: "#nhatrang #vietnam #vietnamtravel #nhatrangvietnam #vinwonders #centralvietnam #travelvietnam #traveltok #foodtok #fyp" },
  },
};
const EMOJI = { "day1-sang": "🍜", "day1-chieu": "🍲", "day1-toi": "🦐", "day2-dao": "🦑", "day3-vin": "🍔", "day3-chodam": "🥞", "day4-doclet": "🐟" };

for (const lang of ["vi", "en"]) {
  for (const days of [3, 4]) {
    const slug = `nha-trang-${days === 4 ? "4n3d" : "3n2d"}${lang === "en" ? "-en" : ""}`;
    const v = read(`data/videos/${slug}/video.json`);
    const credits = read(`data/videos/${slug}/credits.json`);
    const t = TXT[lang];
    const lines = [HEAD[lang][days], "", days === 4 ? t.flight.split(" (")[0] : t.flight, ""];
    for (const s of v.scenes.filter((x) => x.layout === "point")) {
      lines.push(`${t.day[s.id]} · ${s.points.join(", ")}`);
      const all = [...(s.dishes || []), ...(s.moreDishes || [])];
      const first = all.slice(0, 3).map((d) => `${EMOJI[s.id]} ${d.place} (${d.name}) · ${d.address} ★${d.rating}`);
      const rest = all.slice(3, days === 4 ? 5 : 7).map((d) => `${d.place} ★${d.rating}`).join(" · ");
      lines.push(...first);
      if (rest) lines.push(`${EMOJI[s.id]} ${rest}`);
      if (s.tip && days === 3) lines.push(`💡 ${s.tip}`);
      lines.push("");
    }
    if (days === 3) lines.push(t.research);
    lines.push(t.rating, days === 4 ? t.weather.split(". ")[0] + "." : t.weather, "", t.ask, "", "—", t.photos);
    const credited = credits.filter((c) => !/public domain|CC0/i.test(c.license));
    for (const c of credited) lines.push(`• ${c.author.replace(/ \(thảo luận\)$/, "")} · ${c.license} · ${c.title.replace(/^File:/, "")}`);
    lines.push(t.map, t.voice, "", t.tags[days]);
    const text = lines.join("\n") + "\n";
    mkdirSync(`output/${slug}`, { recursive: true });
    writeFileSync(`output/${slug}/tiktok-caption.txt`, text);
    console.log(slug, [...text].length, "chars");
  }
}
