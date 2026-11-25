// Remake (15/11/2026) of ha-giang-3n2d for this season (mid-November: buckwheat flowers, first cold
// snap), researched again from scratch: 28 TikTok videos read in full (script + comments), plus press.
// Real footage (Pexels clips of Hà Giang) mixed with the photos. The 08/11 version is kept in research/v1-0811/.
// Facts: research/itinerary.md, research/tiktok.md (#n below), research/cost.md, research/food.md, research/stay.md.
// Google Maps screenshots captured 15/11/2026 into public/videos/ha-giang/maps-1511.
// Run: node data/gen-winter.mjs
import { readFileSync, writeFileSync } from "node:fs";

const read = (p) => JSON.parse(readFileSync(p, "utf8"));
const IMG = (f) => (f.startsWith("videos/") ? f : f.endsWith(".mp4") ? `videos/ha-giang/footage/${f}` : f.includes("/") ? `videos/ha-giang/${f}.jpg` : `videos/ha-giang/candidates/${f}.jpg`);
const photoCredits = [...read("data/videos/ha-giang/credits.json"), ...read("data/videos/ha-giang/credits-pexels.json")];
const footageCredits = read("data/videos/ha-giang/credits-footage.json");

const MAPS = {
  "Nhà hàng Huy Định": "huy-dinh", "Nhà hàng Yến Ngọc 2": "yen-ngoc", "Nhà hàng Hương Lan": "huong-lan",
  "Ngọc Tuyên": "ngoc-tuyen", "Phong Vân Quán": "phong-van", "Nhà Sàn Restaurant": "nha-san",
  "Nhà hàng Tùng Tỷ": "tung-ty", "Quán Cơm nhà Pao": "nha-pao", "Thạch Sơn quán": "thach-son",
  "Cafe Cực Bắc": "cuc-bac", "Lalaland Restaurant": "lalaland", "Then Pa Cafe": "then-pa",
  "Ma Pi Leng restaurant": "mpl-restaurant", "Tu Sản Coffee": "tu-san-coffee", "Cafe Mỷ": "cafe-my",
  "Giàng Quán": "giang-quan", "Nhà hàng Tùng Phúc": "tung-phuc",
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

const old = read("research/v1-0811/ha-giang-3n2d.video.json");
const g = (list) => list.map(IMG);
const d = (name, place, address, rating, spokenAs) => ({ name, place, address, ...(rating != null ? { rating } : {}), ...(spokenAs ? { spokenAs } : {}) });
const scenes = [];

scenes.push({
  id: "hook", layout: "hook", caption: "HÀ GIANG", label: "3N2Đ MÙA TAM GIÁC MẠCH", kicker: "THÁNG 11 · TỪ 28 VIDEO TIKTOK",
  narration: "Hà Giang giữa tháng mười một, tam giác mạch nở dọc quốc lộ bốn C, sông Nho Quế xanh ngọc, sáng sớm có hôm chỉ tám, chín độ. Đây là lịch trình ba ngày hai đêm, gom từ hai mươi tám video TikTok của những người vừa đi về. Lưu lại nhé!",
  durationSec: 13, gallery: g(["road-vertical.mp4", "mpl-fog.mp4", "nhoque-wide.mp4", "nhoque-curve.mp4", "pexels/39243865"]),
  shots: ["Đường đèo", "Sương sớm", "Cao nguyên đá"],
});

const stop = (o) => scenes.push({ layout: "point", durationSec: 15, ...o, gallery: g(o.gallery) });
stop({
  id: "quanba", label: "Ngày 1 · Sáng", caption: "Cổng trời Quản Bạ", badge: "~45 km", geo: { lat: 23.0697, lng: 104.9886 },
  points: ["Xe tới ~4h sáng: nghỉ tới 6h rồi đi", "Có chốt kiểm tra bằng lái"],
  narration: "Xe đêm tới thành phố khoảng bốn giờ sáng. Người đi trước khuyên nghỉ ở nhà xe tới sáu giờ, ăn sáng rồi mới chạy. Chụp cột mốc số không, lên cổng trời Quản Bạ ngắm núi đôi và triền tam giác mạch. Nhớ mang bằng lái, đoạn này có chốt kiểm tra. Ăn ở nhà hàng Huy Định, bốn chấm tám sao.",
  gallery: ["qb-03", "qb-02", "qb-01", "qb-04"],
  dishes: [d("Cơm, lẩu", "Nhà hàng Huy Định", "tổ 3 Tam Sơn", 4.8, "Huy Định"), d("Cơm", "Nhà hàng Yến Ngọc 2", "tổ 3 Tam Sơn", 4.8), d("Cơm", "Nhà hàng Hương Lan", "Tam Sơn", 4.6)],
  moreDishes: [d("Cơm", "Nhà hàng Huyền Trang", "Tam Sơn", 4.6), d("Cơm", "Nhà Sàn Restaurant", "Yên Minh, trên đường đi", 4.5)],
});
stop({
  id: "thamma", label: "Ngày 1 · Chiều", caption: "Dốc Thẩm Mã", badge: "Yên Minh", geo: { lat: 23.1785, lng: 105.216 },
  points: ["Trưa Yên Minh, cơm ~50–100k/người", "Tết tóc, cài hoa: hỏi giá trước"],
  narration: "Trưa dừng Yên Minh, cơm chừng năm mươi tới một trăm nghìn một người, như ở quán Ngọc Tuyên, bốn chấm chín sao. Chiều qua dốc Thẩm Mã. Người đi trước dặn: muốn tết tóc, chụp ảnh với các em thì hỏi giá trước, chỉ nhờ một hai em, và đừng đội vòng hoa đã qua tay nhiều người.",
  gallery: ["thamma-zigzag.mp4", "tm-01", "pexels/36582384", "tm-02"],
  dishes: [d("Cơm, phở, lẩu", "Ngọc Tuyên", "cổng chào Yên Minh", 4.9, "Ngọc Tuyên"), d("Cơm", "Phong Vân Quán", "tổ 8 Trần Hưng Đạo", 4.8), d("Cơm, lẩu", "Nhà Sàn Restaurant", "Yên Minh", 4.5)],
  moreDishes: [d("Cơm", "Nhà hàng Hằng Cảnh", "Yên Minh", 4.6), d("Cơm", "Nhà hàng Hóa Cường", "Yên Minh", 4.5)],
});
stop({
  id: "vuong", label: "Ngày 1 · Chiều muộn", caption: "Dinh thự họ Vương", badge: "Sà Phìn", geo: { lat: 23.2263, lng: 105.2397 },
  points: ["Vé khoảng 30–40k", "17h40 đã tối: tới chỗ ngủ trước 17h"],
  narration: "Ghé dinh thự họ Vương ở Sà Phìn, vé chừng ba mươi tới bốn mươi nghìn. Mùa này chưa tới sáu giờ chiều trời đã tối om, nên mỗi điểm chỉ dừng mười lăm phút, để tới Lô Lô Chải trước khi tối. Cạnh dinh thự có nhà hàng Tùng Tỷ, bốn chấm tám sao.",
  gallery: ["vg-03", "vg-08", "vg-06", "vg-01"],
  dishes: [d("Cơm", "Nhà hàng Tùng Tỷ", "Sà Phìn", 4.8, "Tùng Tỷ"), d("Cơm", "Quán Cơm nhà Pao", "QL4C Sà Phìn", 4.6), d("Lẩu gà đen", "Thạch Sơn quán", "chợ cổ Đồng Văn", 4.9)],
  moreDishes: [d("Thắng cố", "Nhà hàng CND", "đường 3/2 Đồng Văn", 4.8), d("Cơm, lẩu", "Giàng Quán", "Đồng Văn", 5)],
});
stop({
  id: "lungcu", label: "Ngày 2 · Sáng", caption: "Cột cờ Lũng Cú", badge: "Lô Lô Chải", geo: { lat: 23.3633, lng: 105.3166 },
  points: ["Vé ~40–70k gồm xe điện", "Sáng sớm vắng nhưng cờ ướt sương"],
  narration: "Đêm đầu ngủ làng Lô Lô Chải, nhà trình tường dưới chân cột cờ, tối ăn lẩu gà đen ở Cafe Cực Bắc, bốn chấm bảy sao. Sáng lên cột cờ Lũng Cú, vé chừng bốn mươi tới bảy mươi nghìn gồm xe điện. Sáng sớm vắng, nhưng cờ ướt sương không bay, ai thích cờ bay thì lên buổi chiều.",
  gallery: ["lc-10", "pexels/15997684", "lc-07", "lc-04", "lc-09"],
  dishes: [d("Lẩu gà đen", "Cafe Cực Bắc", "Lô Lô Chải", 4.7, "Cực Bắc"), d("Cơm, lẩu", "Lalaland Restaurant", "Lô Lô Chải", 4.9), d("Cà phê, cơm", "Then Pa Cafe", "làng Thèn Pả", 4.7)],
  moreDishes: [d("Cơm, lẩu", "À Lôi Lô Lô Chải", "homestay có nấu cơm", 4.9), d("Cơm", "Vị Lư", "Lô Lô Chải", 4.9)],
});
stop({
  id: "nhoque", label: "Ngày 2 · Trưa", caption: "Sông Nho Quế", badge: "Mã Pí Lèng", geo: { lat: 23.24, lng: 105.411 },
  points: ["Maps: gõ “bến thuyền hẻm Tu Sản”", "Vé 150k gồm xe điện, dành 3–4 tiếng"],
  narration: "Qua đèo Mã Pí Lèng, xuống sông Nho Quế. Trên Google Maps nhớ gõ bến thuyền hẻm Tu Sản, gõ sông Nho Quế dễ bị dẫn nhầm đường. Vé thuyền một trăm năm mươi nghìn gồm xe điện. Dành ba, bốn tiếng, tới trước mười một giờ để ăn cơm ở bến, chừng một trăm nghìn một người. Cà phê ngắm đèo ở Tu Sản Coffee, bốn chấm chín sao.",
  gallery: ["mpl-river-road.mp4", "nhoque-ben.mp4", "pexels/39243869", "nhoque-boat.mp4", "nhoque-gorge.mp4"],
  dishes: [d("Cà phê", "Tu Sản Coffee", "đèo Mã Pí Lèng", 4.9, "Tu Sản Coffee"), d("Cà phê", "Cafe Mỷ", "đèo Mã Pí Lèng", 4.7), d("Cơm", "Ma Pi Leng restaurant", "Đồng Văn", 4.7)],
  moreDishes: [d("Cơm bến sông", "Cơm nhà anh Quân", "bến hẻm Tu Sản · ~100k/người theo TikTok", null)],
});
stop({
  id: "dongvan", label: "Ngày 2 · Tối", caption: "Phố cổ Đồng Văn", badge: "Phố cổ", geo: { lat: 23.2775, lng: 105.3622 },
  points: ["Tối có hát, đốt lửa ở quảng trường", "Chợ phiên họp sáng Chủ nhật"],
  narration: "Tối về phố cổ Đồng Văn, quảng trường có hát và đốt lửa. Trời lạnh thì ăn món nóng: thắng dền nước gừng, cháo ấu tẩu, thịt cuốn cải mèo, hay lẩu gà đen ở Thạch Sơn quán, bốn chấm chín sao. Ngày ba ăn bánh cuốn, gặp Chủ nhật thì dạo chợ phiên, rồi chạy về thành phố trước khi trời tối.",
  gallery: ["pexels/20557941", "pexels/31621608", "pexels/36606046", "dv-07"],
  dishes: [d("Lẩu gà đen", "Thạch Sơn quán", "chợ cổ Đồng Văn", 4.9, "Thạch Sơn"), d("Cơm, lẩu", "Giàng Quán", "Đồng Văn", 5), d("Cơm", "Nhà hàng Tùng Phúc", "số 135 Đồng Văn", 4.9)],
  moreDishes: [d("Cơm, đồ Tây", "Ethnic House", "phố cổ Đồng Văn", 4.8), d("Thắng cố", "Nhà hàng CND", "đường 3/2 Đồng Văn", 4.8), d("Lẩu nướng", "Lẩu nướng Cô Xuân", "Đồng Văn", 4.6)],
});
scenes.push({
  id: "stay", layout: "stay", caption: "Nên ở đâu?", durationSec: 14,
  zones: [
    { title: "Làng Lô Lô Chải", note: "Đêm 1 · nhà trình tường, gần cột cờ", picks: [["À Lôi Lô Lô Chải", 4.9, "Lô Lô Chải"], ["Chanh Homestay", 4.8, "Lô Lô Chải"], ["Homestay Lô Lô Time", 4.9, "Lô Lô Chải"]] },
    { title: "Thị trấn Đồng Văn", note: "Đêm 2 · gần phố cổ, nhiều quán", picks: [["Nhà nghỉ Quang Trung", 4.9, "Đồng Văn"], ["Bình Minh Hostel", 4.7, "Đồng Văn"], ["Linh Chi Hotel", 4.6, "Đồng Văn"]] },
  ],
  tip: "Mùa hoa: giữa tuần cũng hết phòng đẹp, đặt trước ở chỗ uy tín",
  cues: ["lô lô", "đồng văn", "mùa hoa"],
  narration: "Nên ở đâu? Đêm đầu ở Lô Lô Chải cho gần cột cờ, như À Lôi hay Chanh Homestay. Đêm hai ở Đồng Văn cho gần phố cổ, như nhà nghỉ Quang Trung, bốn chấm chín sao. Mùa hoa, giữa tuần Lô Lô Chải cũng hết phòng đẹp, nên đặt trước, và chỉ chuyển cọc cho chỗ uy tín.",
  gallery: g(["lc-07", "dv-08"]),
});
scenes.push({
  id: "cost", layout: "cost", caption: "Hết bao nhiêu tiền?", kicker: "TRƯỚC KHI ĐI",
  receiptTitle: "CHI PHÍ 3N2Đ · 1 NGƯỜI", total: "2,1–3,2 triệu", totalCue: "tổng cộng", stamp: "THAM KHẢO 15/11/2026",
  note: "2 người đi chung · nguồn: Dân Việt, Vietnamtourism, VnExpress, TikTok",
  items: [
    { k: "Xe HN ⇄ Hà Giang", note: "giường nằm, cabin · khứ hồi", v: "550–700k", n: [550, 700] },
    { k: "Phòng 2 đêm", note: "Lô Lô Chải + Đồng Văn · ở 2 người", v: "500k–1tr", n: [500, 1000] },
    { k: "Xe máy 3 ngày + xăng", note: "Wave ~180k/ngày · đi 2 người", v: "350–550k", n: [350, 550] },
    { k: "Vé thuyền, cột cờ, dinh thự", note: "150k + 40–70k + 30–40k", v: "220–260k", n: [220, 260] },
    { k: "Ăn uống 3 ngày", note: "cơm bến sông ~100k/người", v: "500–700k", n: [500, 700] },
  ],
  narration: "Hết bao nhiêu tiền? Tính cho một người, hai người đi chung. Xe khứ hồi năm trăm rưỡi tới bảy trăm nghìn, phòng hai đêm năm trăm nghìn tới một triệu, xe máy và xăng ba trăm rưỡi tới năm trăm rưỡi. Tổng cộng khoảng hai phẩy một tới ba phẩy hai triệu. Mang thêm ít tiền mặt cho chợ phiên.",
  durationSec: 16, gallery: g(["moto-road.mp4", "mpl-cliff.mp4"]),
});
scenes.push({
  id: "outro", layout: "outro", caption: "Hẹn gặp ở Hà Giang", kicker: "3 LƯU Ý MÙA NÀY", cta: "Lưu lại nhé!",
  narration: "Ba điều người vừa đi về nhắc nhiều nhất: mang bằng lái và không uống rượu khi chạy đèo, đừng đổ đèo khi trời tối, và mang áo ấm, áo mưa, vì đợt rét đầu mùa Đồng Văn chỉ tám, chín độ. Quán ăn và chi phí mình để ở phần mô tả. Lưu lại nhé!",
  durationSec: 14, gallery: g(["nhoque-wide.mp4"]),
  tips: ["Bằng lái · không rượu bia", "Không đổ đèo khi tối", "Áo ấm, áo mưa · 8–9°C"],
  negatives: [
    { src: IMG("qb-03"), label: "Quản Bạ" }, { src: IMG("tm-01"), label: "Thẩm Mã" }, { src: IMG("lc-10"), label: "Lũng Cú" },
    { src: IMG("pexels/39243869"), label: "Nho Quế" }, { src: IMG("pexels/31621608"), label: "Đồng Văn" },
  ],
});

const video = {
  ...old, title: "Hà Giang 3N2Đ mùa tam giác mạch",
  theme: { accent: "#f28dbb", highlight: "#ffd27a", brand: "HÀ GIANG" }, music: { src: "shared/music/travel-ambient.mp3", volume: 0.8 }, maps: MAPS, scenes,
};
const files = [...new Set(scenes.flatMap((s) => [...(s.gallery ?? []), ...(s.negatives ?? []).map((p) => p.src)]))];
writeFileSync("data/videos/ha-giang-3n2d/video.json", JSON.stringify(video, null, 2) + "\n");
writeFileSync("data/videos/ha-giang-3n2d/credits.json", JSON.stringify(credit(files), null, 2) + "\n");
console.log("ha-giang-3n2d", scenes.length, "scenes,", files.length, "media,", files.filter((f) => f.endsWith(".mp4")).length, "clips,", scenes.reduce((n, s) => n + s.narration.length, 0), "chars");
