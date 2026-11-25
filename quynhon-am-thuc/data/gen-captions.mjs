// Writes output/<slug>/tiktok-caption.txt for the Quy Nhơn food videos from
// video.json and credits.json. Run: node data/gen-captions.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const read = (p) => JSON.parse(readFileSync(p, "utf8"));

const TXT = {
  vi: {
    head: "Về Quy Nhơn ăn gì? 5 món phải thử của xứ Nẫu, kèm nguồn gốc, cách làm, cách ăn và quán ngon 🦐🍜😋 Lưu lại đi là vừa!",
    oneLine: {
      "banh-xeo": "tôm đất còn nhảy trong khuôn nóng, bánh nhỏ giòn; cuốn bánh tráng, rau, xoài chua, chấm mắm tỏi ớt",
      "bun-cha-ca": "chả cá giã tay chiên hoặc hấp, nước dùng ninh xương cá trong và ngọt thanh; món sáng",
      "banh-hoi": "bánh hỏi Bình Định, ngon nhất Diêu Trì (VnExpress); ăn với lòng heo, rau, húp cháo nóng",
      "banh-can": "đổ khuôn đất nung trên than, nhân trứng, mực, tôm; Quy Nhơn còn ăn kèm nước cá",
      "nem-cho-huyen": "làng nghề chợ Huyện (Phước Lộc, Tuy Phước); thịt nạc giã nhuyễn, gói lá ổi, lá chuối, lên men",
    },
    famous: "🏮 Quán lâu đời nhưng dưới 4.5★ (không lên hình): Bánh xèo Gia Vỹ ★4.1 (2.100+ lượt) · Bún chả cá Phượng Tèo ★4.0 · Bánh hỏi cháo lòng Mai Tư ★4.0 · Bánh canh Bà O ★3.9",
    extra: "🥞 Ăn bánh xèo ngay làng chài Nhơn Hải: Bánh Xèo Rêu Xanh ★5.0, Cô Ba ★4.9. Món nên thử thêm: bánh ít lá gai Tuy Phước, tré Bình Định, bánh canh chả cá.",
    rating: "⭐ Điểm Google Maps kiểm tra ngày 31/10/2026 (≥4.5★). Nguồn: VnExpress, Vietnam Coracle, Greensm, Mia.vn, Báo Nông nghiệp & Môi trường.",
    ask: "Bạn sẽ thử món nào đầu tiên? 👇",
    photos: "Ảnh: Wikimedia Commons (ảnh minh hoạ đúng món, phần lớn không chụp tại Quy Nhơn)",
    tags: "#amthucquynhon #quynhonangi #dacsanbinhdinh #banhxeotomnhay #quynhon #ancungtiktok #reviewanngon #amthucvietnam #foodtour #fyp",
  },
  en: {
    head: "What to eat in Quy Nhon: 5 dishes, with where they come from, how they're made, how to eat them and where to go 🦐🍜😋 Save it!",
    oneLine: {
      "banh-xeo": "river shrimp still jumping in the hot mould, small crispy pancakes; roll with herbs and green mango",
      "bun-cha-ca": "hand-pounded fish cakes, fried or steamed, in a clear, lightly sweet fish-bone broth; a breakfast dish",
      "banh-hoi": "Binh Dinh's woven rice vermicelli, best from Dieu Tri (VnExpress); with pork offal and hot congee",
      "banh-can": "cooked in clay moulds over charcoal with egg, squid or shrimp; in Quy Nhon also with fish broth",
      "nem-cho-huyen": "from the Cho Huyen craft village (Tuy Phuoc); pounded lean pork fermented in guava and banana leaves",
    },
    famous: "🏮 Famous but under 4.5★ (not shown in the video): Gia Vy banh xeo ★4.1 (2,100+ reviews) · Phuong Teo fish cake noodles ★4.0 · Mai Tu banh hoi ★4.0 · Ba O noodle soup ★3.9",
    extra: "🥞 Pancakes in Nhon Hai fishing village: Reu Xanh ★5.0, Co Ba ★4.9. Also try: Tuy Phuoc leaf cake (banh it la gai), Binh Dinh tre, fish cake noodle soup.",
    rating: "⭐ Google Maps ratings checked 31 Oct 2026 (4.5★+). Sources: VnExpress, Vietnam Coracle, Greensm, Mia.vn, Nong nghiep & Moi truong.",
    ask: "Which one would you try first? 👇",
    photos: "Photos: Wikimedia Commons (illustrative photos of each dish, mostly not taken in Quy Nhon)",
    tags: "#quynhonfood #vietnamesefood #quynhon #vietnam #foodtok #streetfood #vietnamtravel #traveltok #foodie #fyp",
  },
};

for (const lang of ["vi", "en"]) {
  const slug = lang === "en" ? "quynhon-am-thuc-en" : "quynhon-am-thuc";
  const v = read(`data/videos/${slug}/video.json`);
  const t = TXT[lang];
  const lines = [t.head, ""];
  for (const s of v.scenes.filter((x) => x.layout === "dish")) {
    const where = s.story.sections.find((x) => x.part === "where").places;
    lines.push(`${s.story.number}️⃣ ${s.caption}: ${t.oneLine[s.id]}`);
    lines.push(`   📍 ${where.map((p) => `${p.place} · ${p.address} ★${p.rating}`).join(" | ")}`);
  }
  lines.push("", t.famous, t.extra, "", t.rating, "", t.ask, "", "—", t.photos);
  const credits = read(`data/videos/${slug}/credits.json`).filter((c) => !/public domain|CC0/i.test(c.license));
  for (const c of credits) lines.push(`• ${c.author.replace(/ \(thảo luận\)$/, "")} · ${c.license} · ${c.title.replace(/^File:/, "")}${c.note ? (lang === "vi" ? " (đã cắt)" : " (cropped)") : ""}`);
  lines.push("", t.tags);
  const text = lines.join("\n") + "\n";
  mkdirSync(`output/${slug}`, { recursive: true });
  writeFileSync(`output/${slug}/tiktok-caption.txt`, text);
  console.log(slug, [...text].length, "chars");
}
