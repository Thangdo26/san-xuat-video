// Writes output/<slug>/tiktok-caption.txt for the four Quy Nhơn videos.
// Restaurants come from video.json (dishes + moreDishes), photo credits from
// credits.json, so the caption always matches what the video shows.
// Run: node data/gen-captions.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const read = (p) => JSON.parse(readFileSync(p, "utf8"));

const HEAD = {
  vi: {
    3: "Quy Nhơn 3N2Đ: tháp Chăm cổ, Eo Gió, biển Kỳ Co xanh ngọc và làng chài Hòn Khô 🌊🏛️🦐 Lưu lại đi là vừa!",
    4: "Quy Nhơn 4N3Đ: tháp Chăm, Kỳ Co xanh ngọc, đảo Cù Lao Xanh, Hòn Khô và tháp Bánh Ít 🌊🏝️🦐 Lưu lại đi là vừa!",
  },
  en: {
    3: "Quy Nhon in 3 days: ancient Cham towers, Eo Gio, turquoise Ky Co and the Hon Kho fishing village 🌊🏛️🦐 Save it for your trip!",
    4: "Quy Nhon in 4 days: Cham towers, turquoise Ky Co, Cu Lao Xanh island, Hon Kho and the Banh It towers 🌊🏝️🦐 Save it for your trip!",
  },
};
const TXT = {
  vi: {
    flight: "✈️ Bay thẳng từ Hà Nội, TP.HCM tới sân bay Phù Cát, rồi đi xe về Quy Nhơn",
    day: { thapdoi: "🏛️ Ngày 1 · Sáng", ghenhrang: "🌅 Ngày 1 · Chiều", eogio: "🌄 Ngày 2 · Bình minh", kyco: "🏖️ Ngày 2 · Trưa", culaoxanh: "🏝️ Ngày 3", honkho: "🚤 Ngày cuối", banhit: "🏛️ Ngày 4" },
    day4: { honkho: "🚤 Ngày 4 · Sáng" },
    suggest: "món nên thử",
    research: "🔎 Lịch trình tổng hợp từ VnExpress, Vietnam Airlines, Mia.vn, MoMo và bình luận TikTok (Quy Nhơn Bản Địa…).",
    rating: "⭐ Điểm Google Maps kiểm tra ngày 31/10/2026 (≥4.5★). Nhơn Hải là làng chài nhỏ, vài quán còn ít lượt đánh giá.",
    oldies: "🏷️ Quán lâu đời nhưng điểm Maps dưới 4.5★: bánh xèo Gia Vỹ 14 Diên Hồng (4.1★, 2.100+ lượt), bún chả cá Phượng Tèo 211 Nguyễn Huệ (4.0★), bánh hỏi cháo lòng Mai Tư 41 Nguyễn Chánh (4.0★), bánh canh Bà O 384 Bạch Đằng (3.9★).",
    notes: "ℹ️ Giá vé theo review TikTok 2026: Kỳ Co đường bộ ~170k (vé + xe điện), Eo Gió ~30k, Hòn Khô ~80k, Tháp Đôi ~30k. Mùa đẹp nhất khoảng tháng 3–8; tháng 9–12 mưa, có ngày ngừng tàu/cano. Tàu ra Cù Lao Xanh đón ở bến Mũi Tấn (Xuân Diệu). Từ 1/7/2025 Quy Nhơn thuộc tỉnh Gia Lai.",
    ask: "Bạn thích Kỳ Co hay Hòn Khô hơn? 👇",
    photos: "Ảnh: Wikimedia Commons",
    map: "Bản đồ: © OpenMapTiles © OpenStreetMap contributors",
    tags: { 3: "#quynhon #dulichquynhon #lichtrinhdulich #quynhon3n2d #kyco #eogio #dulichvietnam #reviewdulich #ancungtiktok #fyp", 4: "#quynhon #dulichquynhon #lichtrinhdulich #quynhon4n3d #kyco #culaoxanh #dulichvietnam #reviewdulich #ancungtiktok #fyp" },
  },
  en: {
    flight: "✈️ Direct flights from Hanoi and Ho Chi Minh City to Phu Cat airport, then a drive into Quy Nhon",
    day: { thapdoi: "🏛️ Day 1 · Morning", ghenhrang: "🌅 Day 1 · Afternoon", eogio: "🌄 Day 2 · Sunrise", kyco: "🏖️ Day 2 · Midday", culaoxanh: "🏝️ Day 3", honkho: "🚤 Last day", banhit: "🏛️ Day 4" },
    day4: { honkho: "🚤 Day 4 · Morning" },
    suggest: "dish to try",
    research: "🔎 Built from VnExpress, Vietnam Airlines, Mia.vn, MoMo and TikTok comments from local creators.",
    rating: "⭐ Google Maps ratings checked 31 Oct 2026 (4.5★+). Nhon Hai is a small village, so some places have few reviews.",
    oldies: "🏷️ Famous old-timers rated under 4.5★ on Maps: Gia Vy banh xeo, 14 Dien Hong (4.1★, 2,100+ reviews), Phuong Teo fish cake noodles, 211 Nguyen Hue (4.0★), Mai Tu banh hoi, 41 Nguyen Chanh (4.0★).",
    notes: "ℹ️ Prices from 2026 TikTok reviews: Ky Co by road ~170k VND (ticket + e-shuttle), Eo Gio ~30k, Hon Kho ~80k, Twin Towers ~30k. Best season is roughly Mar–Aug; Sep–Dec is rainy and boats sometimes stop. Boats to Cu Lao Xanh leave from Mui Tan pier (Xuan Dieu street).",
    ask: "Ky Co or Hon Kho, which would you pick? 👇",
    photos: "Photos: Wikimedia Commons",
    map: "Map: © OpenMapTiles © OpenStreetMap contributors",
    tags: { 3: "#quynhon #vietnam #vietnamtravel #kyco #eogio #beachvibes #travelvietnam #traveltok #foodtok #fyp", 4: "#quynhon #vietnam #vietnamtravel #kyco #culaoxanh #beachvibes #travelvietnam #traveltok #foodtok #fyp" },
  },
};
const EMOJI = { thapdoi: "🦐", ghenhrang: "🐟", eogio: "🦀", kyco: "🦞", culaoxanh: "🦑", honkho: "🥞", banhit: "🎁" };

for (const lang of ["vi", "en"]) {
  for (const days of [3, 4]) {
    const slug = `quy-nhon-${days === 4 ? "4n3d" : "3n2d"}${lang === "en" ? "-en" : ""}`;
    const v = read(`data/videos/${slug}/video.json`);
    const credits = read(`data/videos/${slug}/credits.json`);
    const t = TXT[lang];
    const star = (d) => (d.rating ? `★${d.rating.toFixed(1)}` : `(${t.suggest}, ${d.address})`);
    const lines = [HEAD[lang][days], "", t.flight, ""];
    for (const s of v.scenes.filter((x) => x.layout === "point")) {
      const head = (days === 4 && t.day4[s.id]) || t.day[s.id];
      lines.push(`${head} · ${s.caption}: ${s.points.join(", ")}`);
      const all = [...(s.dishes || []), ...(s.moreDishes || [])];
      const first = all.slice(0, 3).map((d) => `${EMOJI[s.id]} ${d.place} (${d.name}) · ${d.rating ? d.address + " " : ""}${star(d)}`);
      const rest = all.slice(3, 5).map((d) => `${d.place} ★${d.rating.toFixed(1)}`).join(" · ");
      lines.push(...first);
      if (rest) lines.push(`${EMOJI[s.id]} ${rest}`);
      if (s.tip) lines.push(`💡 ${s.tip}`);
      lines.push("");
    }
    lines.push(t.research, t.rating, t.oldies, t.notes, "", t.ask, "", "—", t.photos);
    const credited = credits.filter((c) => !/public domain|CC0/i.test(c.license));
    for (const c of credited) lines.push(`• ${c.author.replace(/ \(thảo luận\)$/, "")} · ${c.license} · ${c.title.replace(/^File:/, "")}`);
    lines.push(t.map, "", t.tags[days]);
    const text = lines.join("\n") + "\n";
    mkdirSync(`output/${slug}`, { recursive: true });
    writeFileSync(`output/${slug}/tiktok-caption.txt`, text);
    console.log(slug, [...text].length, "chars");
  }
}
