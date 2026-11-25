// Writes output/<slug>/tiktok-caption.txt for the six Mộc Châu videos.
// Places come from video.json, credits from credits.json, so the caption matches the video.
// The last line holds the hashtags (the upload script types them one by one).
// Run: node data/gen-captions.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const read = (p) => JSON.parse(readFileSync(p, "utf8"));
const star = (r) => (r == null ? "" : ` ★${r.toFixed(1)}`);

const COMMON = {
  vi: {
    arrive: "🚌 Từ Hà Nội khoảng 190 km, chừng 4,5 giờ theo QL6, qua đèo Thung Khe (VnExpress). Đi xe giường nằm hoặc limousine, lên tới nơi thuê xe máy để đi các điểm xa.",
    stayHead: "🏨 Nên ở đâu?",
    stay: [
      "• Trung tâm Nông Trường (gần chợ đêm, đi bộ ăn tối, hợp lần đầu đi) · Mũm Homestay ★4.6 · Sunflower Hotel ★4.8 · Kumo Chan Hotel ★4.6",
      "• Bản Áng – Mường Sang (yên tĩnh, gần rừng thông, Happy Land, cầu kính; cần xe máy) · Vườn An Nhiên ★4.7 · Eco House ★4.6",
      "• Hỏi kỹ vị trí trước khi đặt (có người ở xa chợ đêm 3 km vẫn trả 1,8 triệu, theo bình luận TikTok). Cuối tuần và mùa hoa nên đặt sớm.",
    ],
    tips: "💡 Từ TikTok và báo: săn mây 5h–8h sáng; hoa cải trắng khoảng tháng 10–11, hoa mận Nà Ka cuối tháng 1 – giữa tháng 2; sáng tối lạnh, mang áo ấm; nhiều vườn hoa thu vé chụp ảnh; đầu đường vào đồi chè có người bán vé photocopy, hỏi kỹ. Thác Dải Yếm và cầu kính Bạch Long (632 m, kỷ lục Guinness) ở gần Happy Land.",
    rating: "⭐ Điểm Google Maps kiểm tra 03/11/2026, ảnh chụp Maps trong video ngày 04/11/2026 (≥4.5★, ≥50 lượt).",
    oldies: "🏷️ Nổi tiếng nhưng dưới 4.5★ trên Maps (không lên hình): Xuân Bắc 181 cs2 4.2★, Tuân Gù 4.4★, Đông Hải 4.1★, cá hồi Vườn Đào 4.2★, Nhà Cuối Ngõ 4.3★, Mu Náu Farm 4.4★, Chợ đêm Mộc Châu 4.0★.",
    photos: "Ảnh: Wikimedia Commons, Flickr (CC), Pexels",
    },
  en: {
    arrive: "🚌 About 190 km from Hanoi, roughly 4.5 hours on Highway 6 over the Thung Khe pass (VnExpress). Take a sleeper bus or limousine van, then rent a motorbike for the far stops.",
    stayHead: "🏨 Where to stay?",
    stay: [
      "• Nong Truong town centre (near the night market, walk to dinner, best for a first trip) · Mũm Homestay ★4.6 · Sunflower Hotel ★4.8 · Kumo Chan Hotel ★4.6",
      "• Ban Ang – Muong Sang (quiet, near the pine forest, Happy Land and the glass bridge; you need a bike) · Vườn An Nhiên ★4.7 · Eco House ★4.6",
      "• Check the exact location before booking; book early for weekends and flower seasons.",
    ],
    tips: "💡 From TikTok and the press: clouds are best 5–8 am; white mustard blooms around Oct–Nov, Na Ka plum blossom late Jan – mid Feb; mornings and nights are cold; many flower gardens charge a photo fee. Dai Yem waterfall and the Bach Long glass bridge (632 m, a Guinness record) are near Happy Land.",
    rating: "⭐ Google Maps ratings checked 3 Nov 2026, Maps screenshots in the video taken 4 Nov 2026 (4.5★+, 50+ reviews).",
    oldies: "🏷️ Famous but under 4.5★ on Maps (not shown): Xuân Bắc 181 cs2 4.2★, Tuân Gù 4.4★, Đông Hải 4.1★, Vườn Đào salmon 4.2★, Nhà Cuối Ngõ 4.3★, Mu Náu Farm 4.4★, the night market 4.0★.",
    photos: "Photos: Wikimedia Commons, Flickr (CC), Pexels",
    },
};
const TRAVEL = {
  "3n2d": {
    vi: {
      head: "Mộc Châu 3N2Đ gom từ TikTok: đồi chè Trái Tim, chợ đêm, săn mây, thác Chiềng Khoa, Happy Land và đồi hoa cải trắng 🍃☁️🌼 Lưu lại nhé!",
      ask: "Bạn lên Mộc Châu để săn mây hay để ăn bê chao? 👇",
      tags: "#mocchau #dulichmocchau #reviewmocchau #mocchau3n2d #lichtrinhdulich #sonla #dulichvietnam #reviewdulich #ancungtiktok #fyp",
    },
    en: {
      head: "Moc Chau in 3 days, built from TikTok: Heart Tea Hill, the night market, chasing clouds, Chieng Khoa Falls, Happy Land and white mustard fields 🍃☁️🌼 Save it!",
      ask: "Clouds at dawn or flash-fried veal: what's your Moc Chau reason? 👇",
      tags: "#mocchau #vietnam #vietnamtravel #hanoi #traveltok #travelvietnam #northvietnam #teahills #foodtok #fyp",
    },
  },
  "4n3d": {
    vi: {
      head: "Mộc Châu 4N3Đ đi chậm, gom từ TikTok: đồi chè, chợ đêm, săn mây, thác Chiềng Khoa, nông trại bò sữa, Happy Land, hoa cải và thung lũng mận Nà Ka 🍃☁️🐄🌸 Lưu lại nhé!",
      ask: "Bạn sẽ đi Mộc Châu mùa hoa cải hay mùa hoa mận? 👇",
      tags: "#mocchau #dulichmocchau #reviewmocchau #mocchau4n3d #lichtrinhdulich #sonla #dulichvietnam #reviewdulich #hoamanmocchau #fyp",
    },
    en: {
      head: "Moc Chau in 4 slow days, built from TikTok: tea hills, the night market, sunrise clouds, Chieng Khoa Falls, a dairy farm, Happy Land, white mustard and Na Ka plum valley 🍃☁️🐄🌸 Save it!",
      ask: "Mustard-flower season or plum-blossom season? 👇",
      tags: "#mocchau #vietnam #vietnamtravel #hanoi #traveltok #travelvietnam #northvietnam #slowtravel #foodtok #fyp",
    },
  },
};
const EMOJI = { tea: "🍃", town: "🌙", cloud: "☁️", khoa: "💦", happy: "🎡", farm: "🐄", cai: "🌼", naka: "🌸" };

// One entry per author and licence: file titles would push the caption past TikTok's limit.
const credits = (slug) => {
  const seen = new Set();
  for (const c of read(`data/videos/${slug}/credits.json`)) {
    if (/public domain|CC0|Pexels/i.test(c.license)) continue;
    seen.add(`${c.author.replace(/ \(thảo luận\)$/, "")} (${c.license})`);
  }
  const px = new Set(read(`data/videos/${slug}/credits.json`).filter((c) => /Pexels/.test(c.license)).map((c) => c.author));
  return [[...seen].join(" · "), ...(px.size ? [`Pexels: ${[...px].join(" · ")}`] : [])];
};

const save = (slug, lines) => {
  const text = lines.join("\n") + "\n";
  mkdirSync(`output/${slug}`, { recursive: true });
  writeFileSync(`output/${slug}/tiktok-caption.txt`, text);
  console.log(slug, [...text].length, "chars");
};

for (const plan of ["3n2d", "4n3d"]) {
  for (const lang of ["vi", "en"]) {
    const slug = `moc-chau-${plan}${lang === "en" ? "-en" : ""}`;
    const v = read(`data/videos/${slug}/video.json`);
    const t = { ...COMMON[lang], ...TRAVEL[plan][lang] };
    const lines = [t.head, "", t.arrive, ""];
    for (const s of v.scenes.filter((x) => x.layout === "point")) {
      lines.push(`${EMOJI[s.id]} ${s.label} · ${s.caption}: ${s.points.join(", ")}`);
      lines.push(`   🍽️ ${[...s.dishes, ...(plan === "4n3d" ? [] : s.moreDishes)].map((d) => `${d.place} · ${d.address}${star(d.rating)}`).join(" | ")}`);
    }
    lines.push("", t.stayHead, ...t.stay, "", t.tips, t.rating, t.oldies, "", t.ask, "", "—", t.photos, ...credits(slug), "", t.tags);
    save(slug, lines);
  }
}

const FOOD = {
  vi: {
    head: "Lên Mộc Châu ăn gì? 5 món Tây Bắc được nhắc nhiều nhất trên TikTok và báo, kèm cách ăn và quán ≥4.5★ 🐟🔥🥩🍚🍢 Lưu lại nhé!",
    extra: "➕ Bê chao (bê sữa chao dầu nóng, chấm tương) là món nổi tiếng nhất nhưng chưa có ảnh tự do nên không lên hình; các quán đặc sản như A Páo ★4.5, Phương Nhi ★4.9 có món bê. Quà mang về: sữa chua, bánh sữa Mộc Châu (nông trường bò sữa từ 1958), mận sấy (mận chín tháng 5–6), thịt gác bếp (chọn chỗ uy tín).",
    oldies: "🏷️ Quán nổi tiếng nhưng dưới 4.5★ (không lên hình): Xuân Bắc 181 cs2 4.2★, Tuân Gù 4.4★, Đông Hải 4.1★, cá hồi Vườn Đào 4.2★, cá hồi Thanh Bẩy 4.2★, Thắng cố A Định 4.1★, Chợ đêm Mộc Châu 4.0★.",
    note: "📸 Ảnh minh hoạ đúng món từ Wikimedia Commons và Pexels, không phải ảnh của các quán trong video. Cá suối nướng không phải hôm nào cũng có, nên gọi hỏi quán trước.",
    rating: "⭐ Điểm Google Maps kiểm tra 03/11/2026, ảnh chụp Maps trong video ngày 04/11/2026 (≥4.5★, ≥50 lượt). Món chọn theo TikTok, MoMo, Znews và VnExpress.",
    ask: "Cá hồi hay trâu gác bếp, bạn chọn món nào trước? 👇",
    tags: "#mocchau #mocchauangi #amthucmocchau #dacsantaybac #cahoi #ancungtiktok #reviewanngon #amthucvietnam #dulichmocchau #fyp",
  },
  en: {
    head: "What to eat in Moc Chau? 5 northwest dishes people talk about most, with how to eat them and places rated 4.5★+ 🐟🔥🥩🍚🍢 Save it!",
    extra: "➕ Be chao (veal flash-fried in hot oil, dipped in soy) is the most famous dish but has no free photos, so it isn't shown; specialty places such as A Páo ★4.5 and Phương Nhi ★4.9 serve veal. Take home Moc Chau yogurt and milk candy (dairy farming here since 1958), dried plums, and smoked meat from trusted shops.",
    oldies: "🏷️ Famous but under 4.5★ (not shown): Xuân Bắc 181 cs2 4.2★, Tuân Gù 4.4★, Đông Hải 4.1★, Vườn Đào salmon 4.2★, Thanh Bẩy salmon 4.2★, the night market 4.0★.",
    note: "📸 Photos show each dish from Wikimedia Commons and Pexels, not the restaurants listed. Grilled stream fish isn't always on, so ask ahead.",
    rating: "⭐ Google Maps ratings checked 3 Nov 2026, Maps screenshots in the video taken 4 Nov 2026 (4.5★+, 50+ reviews). Dishes picked from TikTok, MoMo, Znews and VnExpress.",
    ask: "Salmon or smoked buffalo first? 👇",
    tags: "#mocchau #vietnamesefood #vietnam #foodtok #streetfood #vietnamtravel #hanoi #foodie #traveltok #fyp",
  },
};
const DISH_EMOJI = { cahoi: "🐟", papinh: "🔥", gacbep: "🥩", xoi: "🍚", xien: "🍢" };

for (const lang of ["vi", "en"]) {
  const slug = `moc-chau-am-thuc${lang === "en" ? "-en" : ""}`;
  const v = read(`data/videos/${slug}/video.json`);
  const t = { ...COMMON[lang], ...FOOD[lang] };
  const lines = [t.head, ""];
  for (const s of v.scenes.filter((x) => x.story)) {
    const [origin, , eat, where] = s.story.sections;
    lines.push(`${DISH_EMOJI[s.id]} ${s.caption}: ${origin.text}. ${eat.text}`);
    lines.push(`   📍 ${where.places.map((p) => `${p.place} · ${p.address}${star(p.rating)}`).join(" | ")}`);
  }
  lines.push("", t.extra, t.oldies, t.note, t.rating, "", t.ask, "", "—", t.photos, ...credits(slug), "", t.tags);
  save(slug, lines);
}
