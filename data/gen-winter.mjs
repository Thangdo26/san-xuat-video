// Remake (14/11/2026) of cao-bang-3n2d and cao-bang-am-thuc for this season (Nov–Dec), with real
// footage mixed between the photos. Starts from the 06/11 versions kept in research/v1-0611/ and
// overrides the narration, galleries and season notes; adds the cost scene to 3N2Đ.
// Facts: research/itinerary.md, research/tiktok.md, research/cost.md (read 14/11/2026).
// Run: node data/gen-winter.mjs
import { readFileSync, writeFileSync } from "node:fs";

const read = (p) => JSON.parse(readFileSync(p, "utf8"));
const IMG = (f) => (f.startsWith("videos/") ? f : f.endsWith(".mp4") ? `videos/cao-bang/footage/${f}` : f.includes("/") ? `videos/cao-bang/${f}.jpg` : `videos/cao-bang/candidates/${f}.jpg`);
const photoCredits = read("data/videos/cao-bang/credits.json");
const footageCredits = read("data/videos/cao-bang/credits-footage.json");

// Google Maps screenshots captured 06/11/2026 (public/videos/cao-bang/maps).
const MAPS = {
  "Quán Ngon": "quan-ngon", "Nhà hàng Sơn Huệ": "son-hue", "Nhà hàng Nùng": "nha-hang-nung",
  "Phở Vịt Dung Thịnh": "dung-thinh", "Áp chao cô Hạc": "co-hac", "Yên - Ngon như mẹ nấu": "yen",
  "Bánh cuốn Phố Cũ": "pho-cu", "Bánh mỳ Thu Thắng": "thu-thang", "Áp Chao Cô Ngân": "co-ngan", "Hương Việt Palace": "huong-viet",
  "Hoàng Dương": "hoang-duong", "Phở Linh Ngoan": "linh-ngoan", "Bánh Cuốn Sáng": "banh-cuon-sang",
  "Quán Cơm Vinh": "com-vinh", "Phở Chinh Lành": "chinh-lanh", "Nhà hàng Cây Khế": "cay-khe",
  "Nhà Mộc Homestay": "nha-moc", "Nhà hàng Khương Thuỷ": "khuong-thuy",
};

const credit = (files) => {
  const out = [];
  for (const f of files) {
    const c = photoCredits.find((x) => x.file === f) ?? footageCredits.find((x) => x.file === f);
    if (!c) throw new Error(`no credit for ${f}`);
    if (!out.includes(c)) out.push(c);
  }
  return out;
};

const write = (slug, video) => {
  const files = [...new Set(video.scenes.flatMap((s) => [...(s.gallery ?? []), ...(s.polaroids ?? []).map((p) => p.src)]))];
  writeFileSync(`data/videos/${slug}/video.json`, JSON.stringify(video, null, 2) + "\n");
  writeFileSync(`data/videos/${slug}/credits.json`, JSON.stringify(credit(files), null, 2) + "\n");
  console.log(slug, video.scenes.length, "scenes,", files.length, "media,", files.filter((f) => f.endsWith(".mp4")).length, "clips");
};

// ---- travel 3N2Đ, mùa đông --------------------------------------------------
{
  const old = read("research/v1-0611/cao-bang-3n2d.video.json");
  const by = Object.fromEntries(old.scenes.map((s) => [s.id, s]));
  const g = (list) => list.map(IMG);
  const scenes = [];
  scenes.push({
    id: "hook", layout: "hook", caption: "CAO BẰNG", label: "3N2Đ MÙA ĐÔNG", kicker: "THÁNG 11 · NON NƯỚC VIỆT BẮC",
    narration: "Cao Bằng tháng mười một, thác Bản Giốc nước trong xanh, mây phủ thung lũng, sáng sớm se lạnh. Đây là lịch trình ba ngày hai đêm cho mùa này, gom từ TikTok, kèm quán từ bốn sao rưỡi. Lưu lại nhé!",
    durationSec: 12, gallery: g(["cb-mist.mp4", "gioc-top.mp4"]),
    pages: [["NGÀY 1", "Pác Bó · phố Cao Bằng"], ["NGÀY 2", "Bản Giốc · Ngườm Ngao"], ["NGÀY 3", "Núi Mắt Thần"]],
  });
  const stop = (id, o) => scenes.push({ ...by[id], layout: "point", ...o, gallery: g(o.gallery) });
  stop("pacbo", {
    label: "Ngày 1 · Sáng", caption: "Suối Lê Nin", badge: "~50 km",
    points: ["Cách TP khoảng 50 km", "Từ tháng 11 nước càng trong"],
    narration: "Xe đêm tới thành phố lúc rạng sáng. Ngày một, chạy chừng năm mươi cây số lên Pác Bó. Từ tháng mười một, suối Lê Nin càng trong, càng xanh, theo các đoàn vừa đi về. Sáng sớm lạnh, nhớ mang áo khoác. Trưa ăn cơm bản ở Quán Ngon, năm sao trên bản đồ.",
    gallery: ["pacbo-03", "pacbo-07", "pacbo-04", "pacbo-02"],
  });
  stop("city", {
    label: "Ngày 1 · Tối", caption: "Phố Cao Bằng", badge: "TP",
    points: ["Hoàng hôn trên sông Bằng", "Áp chao vào mùa, tháng 11 – 2"],
    narration: "Chiều về thành phố, ngắm hoàng hôn trên sông Bằng. Bữa tối gọi phở vịt quay ở Dung Thịnh, bốn chấm bảy sao. Trời lạnh là mùa bánh áp chao, bán nhiều từ tháng mười một tới tháng hai, ghé áp chao cô Hạc mà TikTok hay review. Sáng mai ăn bánh cuốn chan canh nóng.",
    gallery: ["city-sunset.mp4", "city-03", "city-02", "city-06"],
  });
  stop("gioc", {
    label: "Ngày 2 · Sáng", caption: "Thác Bản Giốc", badge: "~90 km",
    points: ["Tháng 11: nước trong, xanh", "Thuyền ra chân thác ~50k"],
    narration: "Ngày hai, chạy chừng chín mươi cây số tới thác Bản Giốc. Tháng mười một nước thác trong và xanh hơn mùa mưa, dù dòng nước nhỏ dần so với tháng tám, tháng chín. Đi thuyền ra sát chân thác, chừng năm mươi nghìn. Trưa ăn ở Hoàng Dương, bốn chấm bảy sao.",
    gallery: ["gioc-raft.mp4", "pexels/6348018", "gioc-river.mp4", "pexels/37511190", "gioc-11"],
  });
  stop("nguom", {
    label: "Ngày 2 · Chiều", caption: "Động Ngườm Ngao", badge: "~93 km",
    points: ["Cách thác khoảng 3 km", "Ghé làng đá Khuổi Ky"],
    narration: "Chiều ghé động Ngườm Ngao, cách thác chừng ba cây số, lối đi trong động khoảng hai cây số, thạch nhũ lấp lánh. Ra khỏi động thì dạo làng đá Khuổi Ky giữa đồng Trùng Khánh. Tối ngủ homestay gần thác, ăn cơm ở Quán Cơm Vinh, bốn chấm tám sao.",
    gallery: ["trungkhanh.mp4", "nguom-05", "nguom-02", "nguom-04"],
  });
  stop("matthan", {
    label: "Ngày 3 · Sáng", caption: "Núi Mắt Thần", badge: "Trà Lĩnh",
    points: ["Hang thủng tròn giữa đỉnh núi", "Dã quỳ: cuối T11 – giữa T12"],
    narration: "Ngày ba, qua đèo Mã Phục tới núi Mắt Thần ở Trà Lĩnh, ngọn núi có hang thủng tròn ngay giữa đỉnh. Đường vào có đoạn lầy khi mưa, mùa khô dễ đi hơn. Cuối tháng mười một tới giữa tháng mười hai, dã quỳ nở vàng ở Quảng Uyên và Hạ Lang. Trưa ghé Nhà Mộc Homestay, bốn chấm sáu sao, rồi về thành phố bắt xe về Hà Nội.",
    gallery: ["matthan.mp4", "pexels/37724043", "pexels/37511188", "pexels/40310960"],
  });
  scenes.push({
    ...by.stay, tip: "Cuối tuần mùa này: đặt phòng trước", cues: ["trung tâm", "đàm thủy", "cuối tuần"],
    narration: "Nên ở đâu? Đêm đầu ở trung tâm thành phố cho gần quán ăn, như Mina Homestay hay Cao Bang Eco House. Đêm hai ngủ homestay ở Đàm Thủy gần thác, như Lan's Homestay hay Minh Khang. Cuối tuần mùa này nên đặt phòng trước.",
    gallery: g(["song-bang.mp4", "city-01", "quay-06"]),
  });
  scenes.push({
    id: "cost", layout: "cost", caption: "Hết bao nhiêu tiền?", kicker: "TRƯỚC KHI ĐI", accent: "#ffcf5a",
    receiptTitle: "CHI PHÍ 3N2Đ · 1 NGƯỜI", total: "1,8–2,6 triệu", totalCue: "tổng cộng", stamp: "THAM KHẢO 11/2026",
    note: "2 người đi chung · nguồn: Vietnamtourism (10/2026), TikTok",
    items: [
      { k: "Xe giường nằm HN ⇄ CB", note: "khứ hồi · từ 340k/chiều", v: "700–800k" },
      { k: "Phòng 2 đêm", note: "TP + gần thác · ở 2 người", v: "200–450k" },
      { k: "Xe máy + xăng", note: "200–300k/ngày · đi 2 người", v: "300–500k" },
      { k: "Vé thác, động, thuyền", note: "45k + 45k + 50k, gửi xe", v: "~160k" },
      { k: "Ăn uống 3 ngày", note: "bữa địa phương 30–120k", v: "400–700k" },
    ],
    narration: "Hết bao nhiêu tiền? Tính cho một người, hai người đi chung. Xe giường nằm khứ hồi khoảng bảy đến tám trăm nghìn, xe máy và xăng ba đến năm trăm, vé thác, động và thuyền chừng một trăm sáu mươi nghìn. Tổng cộng khoảng một phẩy tám đến hai phẩy sáu triệu.",
    durationSec: 13, gallery: g(["gioc-road.mp4", "pexels/6348025"]),
  });
  scenes.push({
    id: "outro", layout: "outro", caption: "Hẹn gặp ở Cao Bằng", kicker: "LỊCH TRÌNH MÙA ĐÔNG", cta: "Lưu lại nhé!",
    narration: "Cao Bằng mùa này lạnh và có ngày mưa phùn, nhớ áo khoác, giày đế bám. Đỉnh Phia Oắc thường có băng giá vào cuối tháng mười hai, tháng một. Quán ăn mình để ở phần mô tả. Lưu lại cho chuyến đi nhé!",
    durationSec: 12, gallery: g(["lungnam.mp4"]),
    polaroids: [
      { src: IMG("pacbo-03"), label: "Suối Lê Nin" }, { src: IMG("city-03"), label: "Phố Cao Bằng" },
      { src: IMG("pexels/6348018"), label: "Bản Giốc" }, { src: IMG("nguom-05"), label: "Ngườm Ngao" },
      { src: IMG("pexels/37724043"), label: "Mắt Thần" },
    ],
  });
  for (const s of scenes) delete s.gauge;
  write("cao-bang-3n2d", {
    ...old, title: "Cao Bằng 3N2Đ mùa đông", theme: { accent: "#4fd1c5", highlight: "#ffcf5a", brand: "CAO BẰNG" }, maps: MAPS, scenes,
  });
}

// ---- ẩm thực, mùa lạnh ------------------------------------------------------
{
  const old = read("research/v1-0611/cao-bang-am-thuc.video.json");
  const by = Object.fromEntries(old.scenes.map((s) => [s.id, s]));
  const sec = (story, part, o) => ({ ...story, sections: story.sections.map((x) => (x.part === part ? { ...x, ...o } : x)) });
  by.cuon.story = sec(sec(by.cuon.story, "made", { cue: "cuộn thịt", text: "Cuộn thịt băm mộc nhĩ hoặc đập trứng ngay trên lớp bánh" }), "eat", { text: "Nhúng bánh vào bát canh xương nóng, thêm măng ớt" });
  by.chao.story = sec(by.chao.story, "made", { text: "Bột nếp nặn nhân thịt, rán ngập dầu tới vàng giòn" });
  by.de.story = { ...sec(sec(by.de.story, "origin", { cue: "hạt dẻ trùng khánh" }), "eat", { text: "Bóc nóng vừa ăn vừa đi; giá quá rẻ dễ là hạt dẻ Trung Quốc" }), tagline: "Đặc sản cuối thu" };
  const F = (f) => (f.endsWith(".mp4") ? IMG(f) : `videos/cao-bang/food/${f}.jpg`);
  const scenes = [
    { ...by.hook, kicker: "TRỜI LẠNH · ẨM THỰC VIỆT BẮC",
      narration: "Trời Cao Bằng chuyển lạnh là mùa của những món nóng hổi. Lên Cao Bằng mùa này ăn gì? Đây là năm món được nhắc nhiều nhất trên TikTok và báo, kèm cách ăn và quán từ bốn sao rưỡi. Lưu lại nhé!",
      gallery: ["city-sunset.mp4", "cuon-1", "chao-1", "khau-1", "de-1", "xoi-2"].map(F) },
    { ...by.cuon,
      narration: "Món thứ nhất, bánh cuốn, bữa sáng của người Cao Bằng, sáng lạnh ăn là ấm bụng. Bánh tráng từ bột gạo tẻ địa phương, cuộn thịt băm mộc nhĩ, hoặc đập trứng ngay trên lớp bánh. Khi ăn, nhúng bánh vào bát canh xương nóng, thêm măng ớt, chứ không chấm nước mắm. Quán ngon: bánh cuốn Phố Cũ, và Bánh Cuốn Sáng trong làng đá Khuổi Ky.",
      gallery: ["cuon-1", "cuon-5", "cuon-3", "cuon-2"].map(F) },
    { ...by.chao,
      narration: "Món thứ hai, bánh áp chao, món ăn vặt đúng mùa này, bán nhiều từ tháng mười một tới tháng hai. Bột nếp nặn nhân thịt, rán ngập dầu tới khi vàng giòn. Khi ăn, chấm nước chua ngọt lúc còn nóng, gọi thêm đĩa vịt rán. Quán ngon: áp chao cô Hạc mà TikTok hay review, và áp chao cô Ngân ở Phố Cũ.",
      gallery: ["chao-1", "chao-6", "chao-2", "chao-4"].map(F) },
    { ...by.khau, gallery: ["khau-1", "khau-3", "khau-2"].map(F) },
    { ...by.de,
      narration: "Món thứ tư, hạt dẻ Trùng Khánh, vào mùa khoảng tháng mười, tháng mười một. Hạt dẻ được rang trên chảo, hoặc hầm cùng gà, giò lợn. Khi ăn, bóc nóng vừa ăn vừa đi. Người địa phương nhắc: hạt dẻ giá quá rẻ dễ là hàng Trung Quốc, nên mua ở chợ Trùng Khánh trên đường đi thác.",
      gallery: ["de-1", "de-rang.mp4", "de-5", "de-boc.mp4", "de-3"].map(F) },
    { ...by.xoi, gallery: ["xoi-2", "xoi-1", "xoi-4", "xoi-3"].map(F) },
    { ...by.outro,
      narration: "Phở vịt quay và cá suối chiên giòn cũng nên thử, quán mình để ở phần mô tả. Mùa lạnh này, bạn chọn món nào trước?",
      gallery: ["song-bang.mp4"].map(F) },
  ];
  write("cao-bang-am-thuc", { ...old, title: "Ẩm thực Cao Bằng mùa lạnh: 5 món", maps: MAPS, scenes });
}
