// Writes output/<slug>/tiktok-caption.txt for the winter remake (14/11/2026) of cao-bang-3n2d and
// cao-bang-am-thuc (Vietnamese only). Places come from video.json, credits from credits.json.
// The last line holds the hashtags (the upload script types them one by one).
// Run: node data/gen-captions-winter.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const read = (p) => JSON.parse(readFileSync(p, "utf8"));
const star = (r) => (r == null ? "" : ` ★${r.toFixed(1)}`);

const RATING = "⭐ Điểm Google Maps kiểm tra và ảnh chụp Maps trong video ngày 06/11/2026 (≥4.5★, ≥50 lượt), ưu tiên quán được review trên TikTok.";
const OLDIES = "🏷️ Nổi tiếng nhưng dưới 4.5★ trên Maps (không lên hình): phở chua Quyên 4.3★, chân cánh gà nướng Hồ Điệp 4.3★, chợ ẩm thực Cao Bằng 4.2★, bánh cuốn Cô Lan 4.3★, Hạt Dẻ Quán 4.0★.";

// One entry per author and licence: file titles would push the caption past TikTok's limit.
const credits = (slug) => {
  const all = read(`data/videos/${slug}/credits.json`);
  const cc = new Set();
  for (const c of all) if (!/public domain|CC0|Pexels|Pixabay/i.test(c.license)) cc.add(`${c.author.replace(/ \(thảo luận\)$/, "").replace(/ from .*$/, "")} (${c.license})`);
  const by = (re) => [...new Set(all.filter((c) => re.test(c.license)).map((c) => c.author))];
  const px = by(/Pexels/), pb = by(/Pixabay/);
  return [[...cc].join(" · "), ...(px.length ? [`Pexels: ${px.join(" · ")}`] : []), ...(pb.length ? [`Pixabay: ${pb.join(" · ")}`] : [])].filter(Boolean);
};

const save = (slug, lines) => {
  const text = lines.join("\n") + "\n";
  mkdirSync(`output/${slug}`, { recursive: true });
  writeFileSync(`output/${slug}/tiktok-caption.txt`, text);
  console.log(slug, [...text].length, "chars");
};

{
  const slug = "cao-bang-3n2d";
  const v = read(`data/videos/${slug}/video.json`);
  const EMOJI = { pacbo: "🏞️", city: "🌇", gioc: "💦", nguom: "🦇", matthan: "⛰️" };
  const lines = [
    "Cao Bằng tháng 11: thác Bản Giốc nước trong xanh, suối Lê Nin càng trong, mây phủ thung lũng, sáng sớm se lạnh. Lịch trình 3N2Đ mùa này gom từ TikTok, kèm quán ≥4.5★ và chi phí từng khoản 🍂💦 Lưu lại nhé!",
    "",
    "🚌 Từ Hà Nội khoảng 280 km, xe giường nằm chạy đêm tới TP Cao Bằng lúc rạng sáng, rồi thuê xe máy (theo các video TikTok). Đoạn sau Ngân Sơn nhiều cua, đi chậm.",
    "",
  ];
  for (const s of v.scenes.filter((x) => x.layout === "point")) {
    lines.push(`${EMOJI[s.id]} ${s.label} · ${s.caption}: ${s.points.join(", ")}`);
    lines.push(`   🍽️ ${[...s.dishes, ...(s.moreDishes ?? [])].map((d) => `${d.place} · ${d.address}${star(d.rating)}`).join(" | ")}`);
  }
  const stay = v.scenes.find((x) => x.layout === "stay");
  lines.push("", "🏨 Nên ở đâu?");
  for (const z of stay.zones) lines.push(`• ${z.title} (${z.note}) · ${z.picks.map(([n, r]) => `${n} ★${r.toFixed(1)}`).join(" · ")}`);
  lines.push("• Đêm đầu ngủ TP, đêm hai ngủ Đàm Thủy. Cuối tuần mùa này nên đặt phòng trước.");
  const cost = v.scenes.find((x) => x.layout === "cost");
  lines.push("", "💰 Chi phí 3N2Đ cho 1 người (2 người đi chung, giá tham khảo đọc ngày 14/11/2026):");
  for (const it of cost.items) lines.push(`• ${it.k}${it.note ? ` (${it.note})` : ""}: ${it.v}`);
  lines.push(`👉 Tổng khoảng ${cost.total}/người. Nguồn: Vietnamtourism (10/2026), TikTok.`);
  lines.push(
    "",
    "💡 Tháng 11 thác Bản Giốc trong xanh nhưng nhỏ dần so với tháng 8–9 (VTC News); dã quỳ nở cuối T11 – giữa T12 ở Quảng Uyên, Hạ Lang (Tiền Phong); Phia Oắc hay có băng giá cuối T12 – T1. Có ngày mưa phùn, mang áo khoác, giày đế bám.",
    RATING,
    OLDIES,
    "",
    "Bạn lên Cao Bằng mùa này để ngắm thác hay để ăn bánh cuốn chan canh nóng? 👇",
    "",
    "—",
    "Ảnh, video: Wikimedia Commons, Flickr (CC), Pexels, Pixabay",
    ...credits(slug),
    "",
    "#caobang #dulichcaobang #caobangmuadong #caobang3n2d #lichtrinhdulich #thacbangioc #dulichvietnam #chiphidulich #reviewdulich #fyp",
  );
  save(slug, lines);
}

{
  const slug = "cao-bang-am-thuc";
  const v = read(`data/videos/${slug}/video.json`);
  const DISH_EMOJI = { cuon: "🥢", chao: "🥟", khau: "🍖", de: "🌰", xoi: "🍚" };
  const lines = ["Trời Cao Bằng chuyển lạnh, ăn gì cho ấm? 5 món được nhắc nhiều nhất trên TikTok và báo, kèm cách ăn và quán ≥4.5★ 🥢🥟🍖🌰🍚 Lưu lại nhé!", ""];
  for (const s of v.scenes.filter((x) => x.story)) {
    const [origin, , eat, where] = s.story.sections;
    lines.push(`${DISH_EMOJI[s.id]} ${s.caption}: ${origin.text}. ${eat.text}`);
    lines.push(`   📍 ${where.places.map((p) => `${p.place} · ${p.address}${star(p.rating)}`).join(" | ")}`);
  }
  lines.push(
    "",
    "➕ Phở vịt quay và cá suối chiên giòn cũng nên thử (chưa có ảnh tự do nên không lên hình): Phở Vịt Dung Thịnh ★4.7 (065 Đường 3/10), Vịt quay giòn O Thoa ★4.6 (121 Kim Đồng); cá suối chiên ở Nhà hàng Sơn Huệ ★4.8 (Pác Bó, khoảng 180k/đĩa theo TikTok).",
    OLDIES,
    "📸 Ảnh và clip minh hoạ đúng món từ Wikimedia Commons, Pexels, không phải của các quán trong video (ảnh áp chao chụp ở Lạng Sơn; ảnh khâu nhục, ảnh và clip hạt dẻ rang là minh hoạ cùng món).",
    RATING,
    "",
    "Mùa lạnh này, bánh cuốn chan canh hay áp chao nóng giòn, bạn chọn món nào? 👇",
    "",
    "—",
    "Ảnh, video: Wikimedia Commons, Flickr (CC), Pexels, Pixabay",
    ...credits(slug),
    "",
    "#caobang #caobangangi #amthuccaobang #banhcuoncaobang #dacsancaobang #ancungtiktok #reviewanngon #amthucvietnam #dulichcaobang #fyp",
  );
  save(slug, lines);
}
