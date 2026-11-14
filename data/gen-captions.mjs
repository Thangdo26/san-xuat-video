// Writes output/<slug>/tiktok-caption.txt for the Đà Nẵng food videos from
// video.json and credits.json. Run: node data/gen-captions.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const read = (p) => JSON.parse(readFileSync(p, "utf8"));

const TXT = {
  vi: {
    head: "Đà Nẵng ăn gì? 6 món phải thử, kèm nguồn gốc, cách làm, cách ăn và quán ngon 🍜🥢😋 Lưu lại đi là vừa!",
    oneLine: {
      "mi-quang": "nguồn gốc còn nhiều giả thuyết, gắn với làng mì Phú Chiêm; nước nhưn ít, bẻ bánh tráng mè trộn đều",
      "banh-trang-cuon": "thịt heo luộc, bánh tráng Đại Lộc, cuốn rau chấm mắm nêm pha thơm",
      "bun-cha-ca": "chả cá thu, cá mối; nước dùng xương cá, bí đỏ, thơm",
      "bun-mam-nem": "mắm nêm duyên hải miền Trung, thịt luộc, heo quay, mít non, trộn đều",
      "banh-xeo": "nhỏ, giòn kiểu miền Trung, cuốn bánh tráng, chấm nước gan đậu phộng",
      "goi-ca": "của làng chài Nam Ô, cá trích ướp gừng riềng thính, cuốn rau rừng",
    },
    famous: "🏮 Quán lâu đời (dưới 4.5★ nên không lên hình): Bánh xèo Bà Dưỡng ★4.3 · Mì Quảng Hồng Vân (Bib Gourmand 2024) ★4.4 · Bún chả cá Bà Phiến ★4.3",
    rating: "⭐ Điểm Google Maps kiểm tra ngày 29/10/2026 (≥4.5★). Nguồn gốc, cách làm tổng hợp từ Báo Văn Hóa, Nhân Dân, Báo Pháp Luật, VnExpress, Đà Nẵng Fantasticity và bình luận TikTok.",
    ask: "Bạn mê món nào nhất? 👇",
    photos: "Ảnh: Wikimedia Commons (gỏi cá Nam Ô là hình minh hoạ vì chưa có ảnh tự do)",
    tags: "#amthucdanang #danangangi #dacsandanang #miquang #danang #ancungtiktok #reviewanngon #amthucvietnam #foodtour #fyp",
  },
  en: {
    head: "What to eat in Da Nang: 6 dishes, with where they come from, how they're made, how to eat them and where to go 🍜🥢😋 Save it!",
    oneLine: {
      "mi-quang": "origin still debated, tied to Phu Chiem noodle village; little broth, crumble a sesame cracker and mix",
      "banh-trang-cuon": "boiled pork, Dai Loc rice paper, wrap with herbs and dip in fermented fish sauce",
      "bun-cha-ca": "mackerel fish cakes; fish bone broth with pumpkin and pineapple",
      "bun-mam-nem": "central coast fermented fish sauce, boiled and roast pork, young jackfruit, tossed",
      "banh-xeo": "small crispy central style, wrapped in rice paper, dipped in liver and peanut sauce",
      "goi-ca": "from Nam O fishing village, herring with ginger, galangal and rice powder, wrapped in wild herbs",
    },
    famous: "🏮 Old favourites under 4.5★ (not shown in the video): Banh Xeo Ba Duong ★4.3 · Mi Quang Hong Van (Bib Gourmand 2024) ★4.4 · Bun cha ca Ba Phien ★4.3",
    rating: "⭐ Google Maps ratings checked 29 Oct 2026 (4.5★+). Origins and recipes from Vietnamese press, the Da Nang tourism site and local TikTok comments.",
    ask: "Which one would you try first? 👇",
    photos: "Photos: Wikimedia Commons (the Nam O fish salad is an illustration; no free photo exists yet)",
    tags: "#danangfood #vietnamesefood #danang #vietnam #foodtok #streetfood #vietnamtravel #traveltok #foodie #fyp",
  },
};

for (const lang of ["vi", "en"]) {
  const slug = lang === "en" ? "danang-am-thuc-en" : "danang-am-thuc";
  const v = read(`data/videos/${slug}/video.json`);
  const t = TXT[lang];
  const lines = [t.head, ""];
  for (const s of v.scenes.filter((x) => x.layout === "dish")) {
    const where = s.story.sections.find((x) => x.part === "where").places;
    lines.push(`${s.story.number}️⃣ ${s.caption}: ${t.oneLine[s.id]}`);
    lines.push(`   📍 ${where.map((p) => `${p.place} · ${p.address} ★${p.rating}`).join(" | ")}`);
  }
  lines.push("", t.famous, "", t.rating, "", t.ask, "", "—", t.photos);
  const credits = read(`data/videos/${slug}/credits.json`).filter((c) => !/public domain|CC0/i.test(c.license));
  for (const c of credits) lines.push(`• ${c.author.replace(/ \(thảo luận\)$/, "")} · ${c.license} · ${c.title.replace(/^File:/, "")}`);
  lines.push("", t.tags);
  const text = lines.join("\n") + "\n";
  mkdirSync(`output/${slug}`, { recursive: true });
  writeFileSync(`output/${slug}/tiktok-caption.txt`, text);
  console.log(slug, [...text].length, "chars");
}
