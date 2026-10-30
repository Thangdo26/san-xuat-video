// Writes output/<slug>/tiktok-caption.txt for the Nha Trang food videos from
// video.json and credits.json. Run: node data/gen-captions.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const read = (p) => JSON.parse(readFileSync(p, "utf8"));

const TXT = {
  vi: {
    head: "Nha Trang ăn gì? 6 món phải thử, kèm nguồn gốc, cách làm, cách ăn và quán ngon 🍢🦀😋 Lưu lại đi là vừa!",
    oneLine: {
      "nem-nuong": "chưa rõ năm ra đời, các cụ kể do người Thanh Hóa mang vào; nước chấm sệt từ nếp, gan, tôm",
      "bun-cha-ca": "nước dùng ninh từ cá biển, chả cá thu, cá nhồng; thêm sứa là thành bún sứa",
      "banh-can": "nguồn gốc còn tranh cãi; khuôn đất nung, trứng cút, mực; nên ăn sáng",
      "goi-ca-mai": "cá mai tái chanh, bóp thính, cuốn rau chấm nước xương cá (TikTok khen chê trái chiều về Hà Ra, quán vẫn đạt 4.7★ nhưng ít lượt)",
      "banh-canh": "phổ biến khắp miền Trung, Nha Trang nổi bật với chả cá, ghẹ, tôm hùm",
      "banh-uot": "từ nghề bánh tráng Phú Lộc, mỡ hành, ruốc tôm, ăn cả chục đĩa",
    },
    famous: "🏮 Quán nổi tiếng nhưng dưới 4.5★ (không lên hình): Nem nướng Đặng Văn Quyên ★4.1 · Bún cá Nguyên Loan ★4.0 · Bánh căn Thủy ★4.4 (TikTok khen nhiều, nên lấy số trước) · Gỏi cá mai Cô Hằng ★4.4 · Bánh canh Hai Cá ★4.4",
    rating: "⭐ Điểm Google Maps kiểm tra ngày 30/10/2026 (≥4.5★). Nguồn gốc, cách làm tổng hợp từ Vietnam News, VnExpress, Báo Pháp Luật, VinWonders, Vinpearl và bình luận TikTok.",
    ask: "Bạn mê món nào nhất? 👇",
    photos: "Ảnh: Wikimedia Commons (gỏi cá mai và bánh ướt là hình minh hoạ vì chưa có ảnh tự do)",
    voice: "Giọng đọc AI · Nhạc nền tự sản xuất",
    tags: "#amthucnhatrang #nhatrangangi #dacsannhatrang #nemnuong #nhatrang #ancungtiktok #reviewanngon #amthucvietnam #foodtour #fyp",
  },
  en: {
    head: "What to eat in Nha Trang: 6 dishes, with where they come from, how they're made, how to eat them and where to go 🍢🦀😋 Save it!",
    oneLine: {
      "nem-nuong": "date unknown, elders say settlers from Thanh Hoa brought it; thick dip of sticky rice, liver and shrimp",
      "bun-cha-ca": "broth from sea fish, mackerel fish cakes; add jellyfish and it becomes bun sua",
      "banh-can": "origin disputed; clay molds, quail egg, squid; best in the morning",
      "goi-ca-mai": "lime-cured fish with rice powder, rolled in herbs, fish bone dip (mixed TikTok reviews of Ha Ra; 4.7★ but few ratings)",
      "banh-canh": "common across central Vietnam, Nha Trang does fish cake, blue crab and lobster",
      "banh-uot": "from the Phu Loc rice paper craft, scallion oil, shrimp floss, ten plates is normal",
    },
    famous: "🏮 Famous but under 4.5★ (not shown in the video): Nem Dang Van Quyen ★4.1 · Bun ca Nguyen Loan ★4.0 · Banh can Thuy ★4.4 (TikTok favourite, take a number early) · Goi ca mai Co Hang ★4.4 · Banh canh Hai Ca ★4.4",
    rating: "⭐ Google Maps ratings checked 30 Oct 2026 (4.5★+). Origins and recipes from Vietnam News, Vietnamese press, VinWonders, Vinpearl and local TikTok comments.",
    ask: "Which one would you try first? 👇",
    photos: "Photos: Wikimedia Commons (goi ca mai and banh uot are illustrations; no free photos exist yet)",
    voice: "AI voice: Microsoft Edge TTS · Original music",
    tags: "#nhatrangfood #vietnamesefood #nhatrang #vietnam #foodtok #streetfood #vietnamtravel #traveltok #foodie #fyp",
  },
};

for (const lang of ["vi", "en"]) {
  const slug = lang === "en" ? "nhatrang-am-thuc-en" : "nhatrang-am-thuc";
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
  for (const c of credits) lines.push(`• ${c.author.replace(/ \(thảo luận\)$/, "")} · ${c.license} · ${c.title.replace(/^File:/, "")}${c.note ? (lang === "vi" ? " (đã cắt)" : " (cropped)") : ""}`);
  lines.push(t.voice, "", t.tags);
  const text = lines.join("\n") + "\n";
  mkdirSync(`output/${slug}`, { recursive: true });
  writeFileSync(`output/${slug}/tiktok-caption.txt`, text);
  console.log(slug, [...text].length, "chars");
}
