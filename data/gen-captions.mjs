// Writes output/<slug>/tiktok-caption.txt for the Phú Quốc food videos from
// video.json and credits.json. Run: node data/gen-captions.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const read = (p) => JSON.parse(readFileSync(p, "utf8"));

const TXT = {
  vi: {
    head: "Ra Phú Quốc ăn gì? 5 món phải thử, kèm nguồn gốc, cách làm, cách ăn và quán ngon 🦀🍜😋 Lưu lại đi là vừa!",
    oneLine: {
      "goi-ca-trich": "cá trích tươi trộn sốt chua, rau răm, dừa nạo; cuốn bánh tráng, chấm nước mắm đậu phộng",
      "bun-quay": "nhiều cách kể về nguồn gốc, Kiến Xây làm nổi tiếng; tự quậy chén chấm đường, tắc, ớt",
      "nhum-nuong": "nhum là cầu gai (nhím biển), cắt đôi nướng mỡ hành, hành phi, đậu phộng; hỏi rõ nhum hay ốc gai",
      "hai-san": "ghẹ Hàm Ninh, tôm hùm, ốc: chọn con sống trong bể, cân ký, hỏi giá và tiền chế biến trước",
      "nuoc-mam": "di sản văn hóa phi vật thể quốc gia; cá cơm ủ muối 12–18 tháng trong thùng gỗ",
    },
    famous: "🏮 Quán nổi tiếng nhưng dưới 4.5★ (không lên hình): Bún quậy Kiến Xây ★4.2 (6.400+ lượt) · Bánh canh Phụng ★4.2 · Bún kèn Út Lượm ★4.3 · Nhà hàng Xin Chào (gỏi cá trích) ★4.2 · nhà bè Bé Ghẹ Hàm Ninh ★3.7",
    extra: "🦀 Ăn ghẹ ngay làng chài Hàm Ninh: nhà bè Thảo Nhi ★4.8, Hải Sản Thiện ★5.0. Món nên thử thêm: bún kèn Cô Thu (An Thới) ★4.7, bánh canh chả cá Cô Út ★4.9.",
    rating: "⭐ Điểm Google Maps kiểm tra ngày 30/10/2026 (≥4.5★). Nguồn: VnExpress, Báo Văn Hóa, Vinpearl, VinWonders, Sun Paradise Land.",
    ask: "Bạn sẽ lật thẻ món nào đầu tiên? 👇",
    photos: "Ảnh: Wikimedia Commons (ảnh gỏi cá trích là ảnh minh hoạ món, không rõ nơi chụp)",
    voice: "Giọng đọc AI · Nhạc nền tự sản xuất",
    tags: "#amthucphuquoc #phuquocangi #dacsanphuquoc #bunquay #phuquoc #ancungtiktok #reviewanngon #amthucvietnam #foodtour #fyp",
  },
  en: {
    head: "What to eat in Phu Quoc: 5 dishes, with where they come from, how they're made, how to eat them and where to go 🦀🍜😋 Save it!",
    oneLine: {
      "goi-ca-trich": "fresh herring in a sour dressing with herbs and coconut, rolled in rice paper, fish sauce and peanut dip",
      "bun-quay": "origin told several ways, Kien Xay made it famous; stir your own dip of sugar, kumquat and chili",
      "nhum-nuong": "sea urchin halved and grilled with scallion oil, shallots and peanuts; ask if it's urchin or murex snail",
      "hai-san": "Ham Ninh crab, lobster, snails: pick a live one, it's weighed; ask price per kilo and cooking fee first",
      "nuoc-mam": "national intangible cultural heritage; anchovies aged in salt 12–18 months in wooden vats",
    },
    famous: "🏮 Famous but under 4.5★ (not shown in the video): Kien Xay bun quay ★4.2 (6,400+ reviews) · Phung noodle soup ★4.2 · Ut Luom bun ken ★4.3 · Xin Chao restaurant (herring salad) ★4.2 · Be Ghe raft, Ham Ninh ★3.7",
    extra: "🦀 Crab right in Ham Ninh village: Thao Nhi raft ★4.8, Hai San Thien ★5.0. Also try: bun ken (coconut fish noodles) at Co Thu, An Thoi ★4.7, fish cake noodle soup at Co Ut ★4.9.",
    rating: "⭐ Google Maps ratings checked 30 Oct 2026 (4.5★+). Sources: VnExpress, Bao Van Hoa, Vinpearl, VinWonders, Sun Paradise Land.",
    ask: "Which card would you flip first? 👇",
    photos: "Photos: Wikimedia Commons (the herring salad photo is illustrative, location unknown)",
    voice: "AI voice: Microsoft Edge TTS · Original music",
    tags: "#phuquocfood #vietnamesefood #phuquoc #vietnam #foodtok #streetfood #vietnamtravel #traveltok #foodie #fyp",
  },
};

for (const lang of ["vi", "en"]) {
  const slug = lang === "en" ? "phuquoc-am-thuc-en" : "phuquoc-am-thuc";
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
  lines.push(t.voice, "", t.tags);
  const text = lines.join("\n") + "\n";
  mkdirSync(`output/${slug}`, { recursive: true });
  writeFileSync(`output/${slug}/tiktok-caption.txt`, text);
  console.log(slug, [...text].length, "chars");
}
