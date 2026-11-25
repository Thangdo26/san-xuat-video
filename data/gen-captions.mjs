// Writes output/<slug>/tiktok-caption.txt for the three Cao Bằng videos (Vietnamese only).
// Places come from video.json, credits from credits.json, so the caption matches the video.
// The last line holds the hashtags (the upload script types them one by one).
// Run: node data/gen-captions.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const read = (p) => JSON.parse(readFileSync(p, "utf8"));
const star = (r) => (r == null ? "" : ` ★${r.toFixed(1)}`);

const COMMON = {
  arrive: "🚌 Từ Hà Nội khoảng 280 km, xe khách 6–7 tiếng (VnExpress). Phổ biến nhất là xe giường nằm chạy đêm, sáng sớm tới TP Cao Bằng rồi thuê xe máy (theo các video TikTok). Đoạn sau Ngân Sơn nhiều cua, đi chậm.",
  stayHead: "🏨 Nên ở đâu?",
  stay: [
    "• Trung tâm TP Cao Bằng (gần bờ sông Bằng, quán ăn, xe khách tới đây) · Mina Homestay ★4.8 · Cao Bang Eco House ★4.8 · Primrose Homestay ★4.7",
    "• Đàm Thủy, gần thác Bản Giốc (ngắm thác sớm, ở làng bản; ít quán) · Lan's Homestay ★4.7 · Minh Khang Homestay ★4.9 · Hoàng Công Homestay ★4.9",
    "• Gợi ý: đêm đầu ngủ TP, đêm hai ngủ Đàm Thủy. Mùa lúa chín (9–10) và tam giác mạch (11–12) nên đặt phòng sớm.",
  ],
  tips: "💡 Từ TikTok và báo: thác Bản Giốc nhiều nước nhất tháng 8–9, nên tới 10h30–13h; đi bè ra gần chân thác; động Ngườm Ngao cách thác khoảng 3 km; Pác Bó nên dành khoảng 4 tiếng và tránh ngày lễ; đường vào núi Mắt Thần có đoạn lầy khi mưa; sáng tối se lạnh, mang áo khoác; vé tham khảo (VnExpress): Bản Giốc 40–45k, Ngườm Ngao 45k, Pác Bó 25k.",
  rating: "⭐ Điểm Google Maps kiểm tra và ảnh chụp Maps trong video ngày 06/11/2026 (≥4.5★, ≥50 lượt). Quán ưu tiên theo review TikTok nếu đạt chuẩn.",
  oldies: "🏷️ Nổi tiếng nhưng dưới 4.5★ trên Maps (không lên hình): phở chua Quyên 4.3★, chân cánh gà nướng Hồ Điệp 4.3★, chợ ẩm thực Cao Bằng 4.2★, bánh cuốn Cô Lan 4.3★, Hạt Dẻ Quán 4.0★.",
  photos: "Ảnh: Wikimedia Commons, Flickr (CC), Pexels",
  };
const TRAVEL = {
  "3n2d": {
    head: "Cao Bằng 3N2Đ gom từ TikTok: suối Lê Nin, phố Cao Bằng về đêm, thác Bản Giốc, động Ngườm Ngao và núi Mắt Thần ⛰️💦🌙 Lưu lại nhé!",
    ask: "Bạn lên Cao Bằng vì thác Bản Giốc hay vì bánh cuốn chan canh? 👇",
    tags: "#caobang #dulichcaobang #reviewcaobang #caobang3n2d #lichtrinhdulich #thacbangioc #dulichvietnam #reviewdulich #ancungtiktok #fyp",
  },
  "4n3d": {
    head: "Cao Bằng 4N3Đ đi chậm, gom từ TikTok: suối Lê Nin, phố Cao Bằng, thác Bản Giốc, động Ngườm Ngao, sông Quây Sơn, núi Mắt Thần và hồ Ba Bể trên đường về ⛰️💦🛶 Lưu lại nhé!",
    ask: "Nếu chỉ chọn một: thác Bản Giốc hay núi Mắt Thần? 👇",
    tags: "#caobang #dulichcaobang #reviewcaobang #caobang4n3d #lichtrinhdulich #thacbangioc #hobabe #dulichvietnam #reviewdulich #fyp",
  },
};
const EMOJI = { pacbo: "🏞️", city: "🌙", gioc: "💦", nguom: "🦇", matthan: "⛰️", quay: "🛶", babe: "🚣" };

// One entry per author and licence: file titles would push the caption past TikTok's limit.
const credits = (slug) => {
  const all = read(`data/videos/${slug}/credits.json`);
  const seen = new Set();
  for (const c of all) {
    if (/public domain|CC0|Pexels/i.test(c.license)) continue;
    seen.add(`${c.author.replace(/ \(thảo luận\)$/, "").replace(/ from .*$/, "")} (${c.license})`);
  }
  const px = new Set(all.filter((c) => /Pexels/.test(c.license)).map((c) => c.author));
  return [[...seen].join(" · "), ...(px.size ? [`Pexels: ${[...px].join(" · ")}`] : [])];
};

const save = (slug, lines) => {
  const text = lines.join("\n") + "\n";
  mkdirSync(`output/${slug}`, { recursive: true });
  writeFileSync(`output/${slug}/tiktok-caption.txt`, text);
  console.log(slug, [...text].length, "chars");
};

for (const plan of ["3n2d", "4n3d"]) {
  const slug = `cao-bang-${plan}`;
  const v = read(`data/videos/${slug}/video.json`);
  const t = { ...COMMON, ...TRAVEL[plan] };
  const lines = [t.head, "", t.arrive, ""];
  for (const s of v.scenes.filter((x) => x.layout === "point")) {
    lines.push(`${EMOJI[s.id]} ${s.label} · ${s.caption}: ${s.points.join(", ")}`);
    lines.push(`   🍽️ ${[...s.dishes, ...(plan === "4n3d" ? [] : s.moreDishes)].map((d) => `${d.place} · ${d.address}${star(d.rating)}`).join(" | ")}`);
  }
  lines.push("", t.stayHead, ...t.stay, "", t.tips, t.rating, t.oldies, "", t.ask, "", "—", t.photos, ...credits(slug), "", t.tags);
  save(slug, lines);
}

const FOOD = {
  head: "Lên Cao Bằng ăn gì? 5 món được nhắc nhiều nhất trên TikTok và báo, kèm cách ăn và quán ≥4.5★ 🥢🥟🍖🌰🍚 Lưu lại nhé!",
  extra: "➕ Phở chua, vịt quay 7 vị và phở vịt quay cũng phải thử (chưa có ảnh tự do nên không lên hình): Phở Vịt Dung Thịnh ★4.7 (065 Đường 3/10), Vịt quay giòn O Thoa ★4.6 (121 Kim Đồng). Ăn sáng: Bánh mỳ Thu Thắng ★4.8 (119 Kim Đồng), Vị Mế ★4.7 (139 Kim Đồng).",
  note: "📸 Ảnh minh hoạ đúng món từ Wikimedia Commons và Pexels, không phải ảnh của các quán trong video (ảnh áp chao chụp ở Lạng Sơn, ảnh khâu nhục và hạt dẻ là ảnh minh hoạ cùng món).",
  rating: "⭐ Điểm Google Maps kiểm tra và ảnh chụp Maps trong video ngày 06/11/2026 (≥4.5★, ≥50 lượt). Món chọn theo TikTok, VnExpress và Mytour.",
  ask: "Bánh cuốn chan canh hay áp chao nóng giòn, bạn chọn món nào? 👇",
  tags: "#caobang #caobangangi #amthuccaobang #banhcuoncaobang #dacsancaobang #ancungtiktok #reviewanngon #amthucvietnam #dulichcaobang #fyp",
};
const DISH_EMOJI = { cuon: "🥢", chao: "🥟", khau: "🍖", de: "🌰", xoi: "🍚" };

{
  const slug = "cao-bang-am-thuc";
  const v = read(`data/videos/${slug}/video.json`);
  const t = { ...COMMON, ...FOOD };
  const lines = [t.head, ""];
  for (const s of v.scenes.filter((x) => x.story)) {
    const [origin, , eat, where] = s.story.sections;
    lines.push(`${DISH_EMOJI[s.id]} ${s.caption}: ${origin.text}. ${eat.text}`);
    lines.push(`   📍 ${where.places.map((p) => `${p.place} · ${p.address}${star(p.rating)}`).join(" | ")}`);
  }
  lines.push("", t.extra, t.oldies, t.note, t.rating, "", t.ask, "", "—", t.photos, ...credits(slug), "", t.tags);
  save(slug, lines);
}
