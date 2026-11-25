// Writes output/<slug>/tiktok-caption.txt for the four Tam Đảo videos.
// Places come from video.json, credits from credits.json, so the caption matches the video.
// The last line holds the hashtags (the upload script types them one by one).
// Run: node data/gen-captions.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const read = (p) => JSON.parse(readFileSync(p, "utf8"));
const star = (r) => (r == null ? "" : ` ★${r.toFixed(1)}`);

const TRAVEL = {
  vi: {
    head: "Tam Đảo 2N1Đ gom từ TikTok: phố núi trong sương, đền Bà Chúa Thượng Ngàn, hoàng hôn bên lâu đài và sáng sớm săn mây ⛰️🌫️🌅☁️ Lưu lại cho cuối tuần!",
    arrive: "🚗 Từ Hà Nội khoảng 80 km, đi ô tô hoặc xe máy chừng 2 tiếng; 13 km cuối là đường đèo, đi xe máy nên chọn xe số (VnExpress). Mát hơn Hà Nội 4–5°C.",
    stayHead: "🏨 Nên ở đâu?",
    stay: [
      "• Quanh quảng trường: đi bộ ra quán, hợp lần đầu đi · Chân Mây Tam Đảo ★4.6 · Khách sạn Quỳnh Hoa ★4.8 · Nhà nghỉ dưỡng Tam Đảo ★4.5",
      "• Homestay sườn phía tây (cách trung tâm 1–2 km): view thung lũng, săn mây, nhưng hay phải leo dốc · Samma Stay ★4.9 · Nhím Homestay ★4.9 · Hola Homestay ★4.9 · Homestay Biển Mây ★4.9",
      "• Muốn yên tĩnh: resort xa trung tâm như Belvedere, Venus (VnExpress gợi ý). Giá phòng tham khảo 450k–2 triệu/đêm (VnExpress). Cuối tuần nhớ đặt trước.",
    ],
    tips: "💡 Từ bình luận TikTok và báo: đi ngày thường cho vắng; tháng 11 tới tháng 1 dễ có biển mây (sau ngày mưa trời hửng nắng); đường trơn khi mưa, mang giày đế bám và áo ấm; Thác Bạc leo khoảng 400 bậc, thuê dép 20k; Cầu Mây vé 30k (VnExpress). Thị trấn Tam Đảo nay thuộc xã Tam Đảo, tỉnh Phú Thọ.",
    rating: "⭐ Điểm Google Maps kiểm tra 02/11 và 06/11/2026, ảnh chụp Maps trong video ngày 06/11/2026 (≥4.5★, ≥50 lượt).\n🛕 Tuỳ chọn trên đường về: Tây Thiên (thiền viện Trúc Lâm, cáp treo); ăn trưa Dân Tộc Quán ★4.8 (Km13 QL2B); mua măng ớt Tây Thiên làm quà.",
    oldies: "🏷️ Nổi tiếng nhưng dưới 4.5★ trên Maps: Tọoc Quán 4.3★, Tiệm nướng Trên Mây 4.3★, Nhà hàng Phố Núi 4.0★, Sơn Tinh 4.4★.",
    ask: "Bạn đi Tam Đảo để săn mây hay để ăn gà đồi? 👇",
    photos: "Ảnh: Wikimedia Commons, Flickr (CC), Pexels",
    tags: "#tamdao #dulichtamdao #reviewtamdao #tamdao2n1d #lichtrinhdulich #dulichganhanoi #dulichvietnam #reviewdulich #ancungtiktok #fyp",
  },
  en: {
    head: "Tam Dao in 2 days, built from TikTok: a hill town in the mist, Ba Chua temple, sunset by the castle and an early cloud hunt ⛰️🌫️🌅☁️ Save it for a weekend!",
    arrive: "🚗 About 80 km from Hanoi, roughly 2 hours by car or motorbike; the last 13 km is a mountain pass, so a manual bike is safer (VnExpress). 4–5°C cooler than Hanoi.",
    stayHead: "🏨 Where to stay?",
    stay: [
      "• Around the square: walk to dinner, best for a first trip · Chân Mây Tam Đảo ★4.6 · Khách sạn Quỳnh Hoa ★4.8 · Nhà nghỉ dưỡng Tam Đảo ★4.5",
      "• West-slope homestays (1–2 km out): valley views and cloud seas, but often a climb · Samma Stay ★4.9 · Nhím Homestay ★4.9 · Hola Homestay ★4.9 · Homestay Biển Mây ★4.9",
      "• For quiet: resorts outside town such as Belvedere or Venus (VnExpress). Rooms about 450k–2m VND a night (VnExpress). Book ahead for weekends.",
    ],
    tips: "💡 From TikTok comments and the press: go on a weekday; Nov–Jan brings the best chance of a cloud sea (sun after a rainy day); roads get slippery, bring grippy shoes and a warm layer; Silver Falls is about 400 steps; Cau May bridge ticket 30k VND (VnExpress). Tam Dao town is now part of Tam Dao commune, Phu Tho province.",
    rating: "⭐ Google Maps ratings checked 2 and 6 Nov 2026, Maps screenshots in the video taken 6 Nov 2026 (4.5★+, 50+ reviews).\n🛕 Optional on the way home: Tay Thien (Truc Lam Zen monastery, cable car); lunch at Dan Toc Quan ★4.8 (Km13, highway 2B); pick up Tay Thien pickled bamboo shoots as a gift.",
    oldies: "🏷️ Famous but under 4.5★ on Maps: Tọoc Quán 4.3★, Tiệm nướng Trên Mây 4.3★, Phố Núi 4.0★, Sơn Tinh 4.4★.",
    ask: "Clouds or hill chicken: what's your Tam Dao reason? 👇",
    photos: "Photos: Wikimedia Commons, Flickr (CC), Pexels",
    tags: "#tamdao #vietnam #vietnamtravel #hanoi #weekendtrip #travelvietnam #traveltok #mountaintown #foodtok #fyp",
  },
};
const EMOJI = { town: "🌫️", den: "🎋", castle: "🏰", cloud: "☁️" };

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
  const slug = `tam-dao-2n1d${lang === "en" ? "-en" : ""}`;
  const v = read(`data/videos/${slug}/video.json`);
  const t = TRAVEL[lang];
  const lines = [t.head, "", t.arrive, ""];
  for (const s of v.scenes.filter((x) => x.layout === "point")) {
    lines.push(`${EMOJI[s.id]} ${s.label} · ${s.caption}: ${s.points.join(", ")}`);
    lines.push(...[...s.dishes, ...s.moreDishes].map((d) => `🍽️ ${d.place} · ${d.address}${star(d.rating)}`));
  }
  lines.push("", t.stayHead, ...t.stay, "", t.tips, t.rating, t.oldies, "", t.ask, "", "—", t.photos, ...credits(slug), "", t.tags);
  save(slug, lines);
}

const FOOD = {
  vi: {
    head: "Lên Tam Đảo ăn gì? 5 món phố núi được nhắc nhiều nhất trên TikTok và báo, kèm cách ăn và quán ≥4.5★ 🥬🐓🎋🔥🌽 Lưu lại nhé!",
    extra: "➕ Lẩu cá tầm cũng được khen nhiều (không có ảnh tự do nên không lên hình): các quán hiện khi tìm \"lẩu cá tầm\" trên Maps gồm Nhà Hàng Dương Xỉ ★4.9, Tam Đảo Mạc Quán ★4.8, Kumo Chan ★4.6. Ngoài ra còn lợn mán, cá suối, bò tái kiến đốt, xôi đen.",
    oldies: "🏷️ Quán nổi tiếng nhưng dưới 4.5★ (không lên hình): Tọoc Quán 4.3★ (lợn mán, lẩu cá tầm), Tiệm nướng Trên Mây 4.3★, Nhà hàng Phố Núi 4.0★, Hiền Nhung 4.4★.",
    note: "📸 Ảnh minh hoạ đúng món từ Wikimedia Commons và Flickr, không phải ảnh của các quán trong video. Hàng đêm ở dốc chợ là gợi ý từ MoMo, không có điểm Maps.",
    rating: "⭐ Điểm Google Maps kiểm tra 02/11/2026, ảnh chụp Maps trong video ngày 06/11/2026 (≥4.5★, ≥50 lượt). Món chọn theo TikTok, MoMo và VnExpress.",
    ask: "Su su xào tỏi hay gà đồi, bạn chọn món nào? 👇",
    photos: "Ảnh: Wikimedia Commons, Flickr (CC)",
    tags: "#tamdao #tamdaoangi #amthuctamdao #gadoi #raususu #ancungtiktok #reviewanngon #amthucvietnam #dulichtamdao #fyp",
  },
  en: {
    head: "What to eat in Tam Dao? 5 hill-town dishes people talk about most, with how to eat them and places rated 4.5★+ 🥬🐓🎋🔥🌽 Save it!",
    extra: "➕ Sturgeon hotpot is loved too (no free photos, so not shown): places that come up for it on Maps include Nhà Hàng Dương Xỉ ★4.9, Tam Đảo Mạc Quán ★4.8, Kumo Chan ★4.6. Also try upland pork, stream fish and black sticky rice.",
    oldies: "🏷️ Famous but under 4.5★ (not shown): Tọoc Quán 4.3★, Tiệm nướng Trên Mây 4.3★, Phố Núi 4.0★, Hiền Nhung 4.4★.",
    note: "📸 Photos show each dish from Wikimedia Commons and Flickr, not the restaurants listed. The market-slope night stalls are a MoMo tip with no Maps rating.",
    rating: "⭐ Google Maps ratings checked 2 Nov 2026, Maps screenshots in the video taken 6 Nov 2026 (4.5★+, 50+ reviews). Dishes picked from TikTok, MoMo and VnExpress.",
    ask: "Garlicky chayote shoots or hill chicken first? 👇",
    photos: "Photos: Wikimedia Commons, Flickr (CC)",
    tags: "#tamdao #vietnamesefood #vietnam #foodtok #streetfood #vietnamtravel #hanoi #foodie #traveltok #fyp",
  },
};
const DISH_EMOJI = { susu: "🥬", ga: "🐓", comlam: "🎋", nuong: "🔥", dem: "🌽" };

for (const lang of ["vi", "en"]) {
  const slug = `tam-dao-am-thuc${lang === "en" ? "-en" : ""}`;
  const v = read(`data/videos/${slug}/video.json`);
  const t = FOOD[lang];
  const lines = [t.head, ""];
  for (const s of v.scenes.filter((x) => x.story)) {
    const [origin, , eat, where] = s.story.sections;
    lines.push(`${DISH_EMOJI[s.id]} ${s.caption}: ${origin.text}. ${eat.text}`);
    lines.push(`   📍 ${where.places.map((p) => `${p.place} · ${p.address}${star(p.rating)}`).join(" | ")}`);
  }
  lines.push("", t.extra, t.oldies, t.note, t.rating, "", t.ask, "", "—", t.photos, ...credits(slug), "", t.tags);
  save(slug, lines);
}
