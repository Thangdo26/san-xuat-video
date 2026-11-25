// Remake (15/11/2026) of moc-chau-3n2d for mid-November (white and yellow mustard just opening, sea of
// clouds at Pa Phách, clear waterfalls), researched again from scratch: 26 TikTok videos read in full
// (script + comments). More real footage than before (Pexels / Pixabay clips labelled Mộc Châu), fewer stills.
// The 03/11 version is kept in research/v1-0311/.
// Facts: research/itinerary.md, research/tiktok.md (#n), research/cost.md, research/food.md, research/stay.md.
// Google Maps screenshots captured 15/11/2026 into public/videos/moc-chau/maps-1511.
// Run: node data/gen-winter.mjs
import { readFileSync, writeFileSync } from "node:fs";

const read = (p) => JSON.parse(readFileSync(p, "utf8"));
const IMG = (f) => (f.endsWith(".mp4") ? `videos/moc-chau/footage/${f}` : `videos/moc-chau/images/${f}.jpg`);
const photoCredits = [...read("research/v1-0311/moc-chau-3n2d.credits.json"), ...read("data/videos/moc-chau-4n3d/credits.json")];
const footageCredits = read("data/videos/moc-chau/credits-footage.json");

const MAPS = {
  "Nhà hàng Phương Nhi": "phuong-nhi", "Cơm Thái Sơn La": "com-thai", "Bếp Nhớ": "bep-nho",
  "TuSa Đây!": "tusa", "Nguyệt Anh Quán": "nguyet-anh", "ONE GRILL&HOTPOT": "one-grill",
  "Nhà hàng Việt Vân Hồ": "viet-vh", "Hiếu Thoa Tây Bắc": "hieu-thoa", "Vigolando Vân Hồ": "vigolando",
  "Bún riêu bề bề": "be-be", "Bún Cá Minh Chi": "minh-chi", "Ka Tờ Rang Café": "ka-to",
};

const credit = (files) => {
  const out = [];
  for (const f of files) {
    const c = footageCredits.find((x) => x.file === f) ?? photoCredits.find((x) => x.file === f);
    if (!c) throw new Error(`no credit for ${f}`);
    if (!out.some((x) => x.file === c.file)) out.push(c);
  }
  return out;
};

const old = read("research/v1-0311/moc-chau-3n2d.video.json");
const g = (list) => list.map(IMG);
const d = (name, place, address, rating, spokenAs) => ({ name, place, address, ...(rating != null ? { rating } : {}), ...(spokenAs ? { spokenAs } : {}) });
const scenes = [];

scenes.push({
  id: "hook", layout: "hook", caption: "MỘC CHÂU", label: "3N2Đ MÙA HOA CẢI", kicker: "THÁNG 11 · TỪ 26 VIDEO TIKTOK",
  narration: "Mộc Châu giữa tháng mười một: trời se lạnh, cải trắng vừa nở, thác nước trong xanh. Đây là lịch trình ba ngày hai đêm, gom từ hai mươi sáu video TikTok của những người vừa đi về, kèm quán ngon và chi phí từng khoản. Lưu lại nhé!",
  durationSec: 13, gallery: g(["nt-pool.mp4", "tea-hill.mp4", "highland.mp4", "nt-valley.mp4"]),
});

const stop = (o) => scenes.push({ layout: "point", durationSec: 15, ...o, gallery: g(o.gallery) });
stop({
  id: "tea", label: "Ngày 1 · Chiều", caption: "Đồi chè Tân Lập", badge: "Đồi chè Trái Tim",
  points: ["Nhiều đồi chè vào miễn phí", "Mai 5h: Pa Phách săn mây"],
  narration: "Đi limousine buổi sáng, trưa tới nơi, ăn ở nhà hàng Phương Nhi, bốn chấm chín sao. Chiều ra đồi chè Tân Lập, nhiều đồi chè vào miễn phí. Người đi trước dặn đừng nhồi quá nhiều điểm một ngày. Sáng mai trời đẹp thì dậy năm giờ lên Pa Phách săn mây, mấy hôm nay hôm nào cũng có mây. Dốc đầu bản nhiều sạn, nhớ về số một.",
  gallery: ["tea-hill.mp4", "tea-1", "tea-2", "tea-4", "tea-3"],
  dishes: [d("Cá hồi, món Tây Bắc", "Nhà hàng Phương Nhi", "Hoàng Quốc Việt", 4.9, "Phương Nhi"), d("Món Thái", "Cơm Thái Sơn La", "Hoàng Quốc Việt", 4.6), d("Cơm", "Bếp Nhớ", "77 Tiểu khu 70", 4.6)],
  moreDishes: [d("Tây Bắc", "Bản Mộc Quán", "448 Hoàng Quốc Việt", 4.5), d("Tây Bắc", "Nhà hàng A Páo", "26 tiểu khu Nhà Nghỉ", 4.5)],
});
stop({
  id: "town", label: "Ngày 1 · Tối", caption: "Phố đi bộ, chợ phiên", badge: "Trung tâm", durationSec: 15,
  points: ["Chợ phiên Bản Vặt Hồng: T6–CN", "Tối T6, T7 có múa xòe Thái"],
  narration: "Tối về trung tâm dạo phố đi bộ. Đi cuối tuần thì ghé chợ phiên bản Vặt Hồng, chỉ họp từ thứ sáu tới chủ nhật, tối thứ sáu và thứ bảy có múa xòe. Vào cửa miễn phí, nhưng có người chê đồ ăn hơi đắt. Ăn lẩu nướng thì TuSa Đây, bốn chấm tám sao, được nhiều người khen.",
  gallery: ["town-2", "town-1", "town-5", "town-3"],
  dishes: [d("Lẩu nướng", "TuSa Đây!", "Thảo Nguyên", 4.8, "TuSa Đây"), d("Nướng than", "Nguyệt Anh Quán", "73 Tô Hiệu", 4.9), d("Lẩu nướng", "ONE GRILL&HOTPOT", "Mộc Sơn", 4.7)],
  moreDishes: [d("Nướng, lẩu", "LÈO XÈO Grill&Hotpot", "104 Nguyễn Hoài Xuân", 4.9), d("Lẩu ngựa", "Nhà hàng Lẩu Ngựa 911", "Tiểu khu 70", 5), d("Buffet tối", "Nhà hàng Chính Linh", "238 Trần Huy Liệu", 4.7)],
});
stop({
  id: "falls", label: "Ngày 2 · Sáng", caption: "Thác Nàng Tiên, Chiềng Khoa", badge: "Vân Hồ", durationSec: 28,
  points: ["Vé mỗi thác ~50k", "Hai thác cách ~10 phút xe"],
  narration: "Ngày hai chạy về Vân Hồ, xem hai thác cách nhau chừng mười phút xe. Thác Nàng Tiên nhiều tầng, mùa này hết mưa nên nước trong xanh, vé chừng năm mươi nghìn. Thác Chiềng Khoa cũng năm mươi nghìn, ngồi trên mỏm đá dưới chân thác rất đã. Trưa ăn ở nhà hàng Việt Vân Hồ, bốn chấm chín sao. Không mê thác thì đổi sang phương án B: năm giờ sáng săn mây Pa Phách, rồi vào làng nguyên thủy Hang Táu cùng cung đường. Vé ba mươi tới bảy mươi nghìn, cưỡi ngựa năm mươi nghìn, trong bản không có sóng điện thoại.",
  // Plan B (TikTok #5, #6, #7, #14, #16, #22): no free photos of Hang Táu or Pa Phách, so a card over the falls footage, not a scene.
  alt: {
    cue: "phương án B", title: "Phương án B · không mê thác?",
    rows: [["Săn mây Pa Phách", "dốc sạn: đi số 1", "5h sáng"], ["Làng nguyên thủy Hang Táu", "cùng tuyến", "30–70k"], ["Cưỡi ngựa trong bản", "theo review TikTok", "50k"]],
    note: "Trong bản không có sóng · tay lái yếu thuê người chở",
  },
  gallery: ["nt-wide.mp4", "nt-fall.mp4", "nt-raft.mp4", "nt-cliff.mp4", "nt-woman.mp4", "khoa-2", "khoa-1"],
  dishes: [d("Món Việt", "Nhà hàng Việt Vân Hồ", "Hua Tạt, Vân Hồ", 4.9, "nhà hàng Việt"), d("Tây Bắc", "Hiếu Thoa Tây Bắc", "Vân Sơn", 4.7), d("Món Việt", "Vigolando Vân Hồ", "Chiềng Đi 2", 4.6)],
  moreDishes: [d("Cá hồi, cá tầm", "Xuân Bắc CS1 Chiềng Đi", "QL6, Chiềng Đi", 4.7), d("Cá hồi, cá tầm", "Đinh Hồng cá hồi", "Chiềng Đi", 4.5)],
});
stop({
  id: "cai", label: "Ngày 2 · Chiều", caption: "Hoa cải Lỏi Tươi", badge: "Xồm Lồm",
  points: ["Cải trắng, vàng mới nở từ 11/11", "Hoa theo đợt: hỏi vườn trước"],
  narration: "Chiều quay về, ghé vườn hoa cải Lỏi Tươi. Ngày mười một tháng mười một vườn mới bắt đầu nở, một bên trắng một bên vàng, còn nhiều nụ. Hoa nở theo đợt nên nhắn hỏi nhà vườn trước khi đi. Sáng ngày ba ăn bún riêu bề bề, bốn chấm tám sao, rồi về Hà Nội.",
  gallery: ["cai-2", "cai-1", "cai-3"],
  dishes: [d("Ăn sáng", "Bún riêu bề bề", "359 Hoàng Quốc Việt", 4.8, "bề bề"), d("Ăn sáng", "Bún Cá Minh Chi", "45 Lê Thanh Nghị", 4.8), d("Cà phê", "Ka Tờ Rang Café", "Thảo Nguyên", 4.9)],
  moreDishes: [d("Lẩu nấm", "Lẩu Nấm Thiên Nhiên", "Đường 31m, Thảo Nguyên", 4.6), d("Tây Bắc", "Nhà hàng A Páo", "26 tiểu khu Nhà Nghỉ", 4.5)],
});
scenes.push({
  id: "stay", layout: "stay", caption: "Nên ở đâu?", durationSec: 14,
  zones: [
    { title: "Trung tâm", note: "Lần đầu đi · gần quán ăn, chợ phiên", picks: [["Mũm Homestay", 4.6, "TDP Minh Châu"], ["Sunflower Hotel", 4.8, "đường 3/2"], ["Kumo Chan Hotel", 4.6, "Lê Thanh Nghị"]] },
    { title: "Rừng thông Bản Áng", note: "Yên tĩnh · cần xe máy, xa chỗ ăn tối", picks: [["Eco House Mộc Châu", 4.6, "bản Là Ngà 1"]] },
  ],
  tip: "Cuối tuần hay cháy phòng: đặt trước 1–2 tuần",
  cues: ["trung tâm", "rừng thông", "cuối tuần"],
  narration: "Nên ở đâu? Lần đầu đi thì ở trung tâm cho gần quán ăn và chợ phiên, như Mũm Homestay hay khách sạn Sunflower, bốn chấm tám sao. Thích yên tĩnh thì ở phía rừng thông bản Áng, như Eco House, nhưng xa chỗ ăn tối. Cuối tuần hay cháy phòng, nên đặt trước.",
  gallery: g(["town-4", "ban-1"]),
});
scenes.push({
  id: "cost", layout: "cost", caption: "Hết bao nhiêu tiền?", kicker: "TRƯỚC KHI ĐI",
  receiptTitle: "CHI PHÍ 3N2Đ · 1 NGƯỜI", total: "1,7–3,0 triệu", totalCue: "tổng cộng", stamp: "THAM KHẢO 15/11/2026",
  note: "2 người đi chung · nguồn: MoMo, VnExpress, TikTok",
  items: [
    { k: "Xe HN ⇄ Mộc Châu", note: "limousine, xe khách · khứ hồi", v: "300–560k", n: [300, 560] },
    { k: "Phòng 2 đêm", note: "homestay trung tâm · ở 2 người", v: "400k–1tr", n: [400, 1000] },
    { k: "Xe máy 3 ngày + xăng", note: "120–180k/ngày · đi 2 người", v: "250–370k", n: [250, 370] },
    { k: "Vé 2 thác + vườn cải", note: "50k + 50k + 30–50k", v: "130–150k", n: [130, 150] },
    { k: "Ăn uống 3 ngày", note: "cơm ~60k, lẩu nướng ~150k", v: "600–900k", n: [600, 900] },
  ],
  narration: "Hết bao nhiêu tiền? Tính cho một người, hai người đi chung. Xe khứ hồi ba trăm tới năm trăm sáu mươi nghìn, phòng hai đêm bốn trăm nghìn tới một triệu, ăn uống sáu trăm tới chín trăm nghìn. Tổng cộng khoảng một phẩy bảy tới ba triệu. Cầu kính Bạch Long tính riêng, năm trăm rưỡi nghìn ngày thường.",
  durationSec: 20, gallery: g(["nt-raft2.mp4", "nt-cascade.mp4"]),
});
scenes.push({
  id: "outro", layout: "outro", caption: "Hẹn gặp ở Mộc Châu", kicker: "3 LƯU Ý MÙA NÀY", cta: "Lưu lại nhé!",
  narration: "Ba điều người vừa đi về nhắc nhiều nhất: mang áo ấm vì sáng tối se lạnh, đường lên Pa Phách và Hang Táu dốc trơn, tay lái yếu thì thuê người chở, và ở thác đừng tự ý xuống tắm. Quán ăn và chi phí mình để ở phần mô tả. Lưu lại nhé!",
  durationSec: 14, gallery: g(["highland.mp4"]),
  tips: ["Áo ấm · sáng tối se lạnh", "Dốc trơn: tay lái yếu thuê người chở", "Ở thác: không tự ý xuống tắm"],
  postcards: [
    { src: IMG("tea-1"), label: "Đồi chè" }, { src: IMG("town-2"), label: "Trung tâm" },
    { src: IMG("khoa-1"), label: "Chiềng Khoa" }, { src: IMG("cai-1"), label: "Hoa cải" },
  ],
});

const video = {
  ...old, title: "Mộc Châu 3N2Đ mùa hoa cải",
  theme: { accent: "#9bd16a", highlight: "#ffd76a", brand: "MỘC CHÂU" }, music: { src: "shared/music/travel-upbeat.mp3", volume: 0.8 }, maps: MAPS, scenes,
};
const files = [...new Set(scenes.flatMap((s) => [...(s.gallery ?? []), ...(s.postcards ?? []).map((p) => p.src)]))];
writeFileSync("data/videos/moc-chau-3n2d/video.json", JSON.stringify(video, null, 2) + "\n");
writeFileSync("data/videos/moc-chau-3n2d/credits.json", JSON.stringify(credit(files), null, 2) + "\n");
console.log("moc-chau-3n2d", scenes.length, "scenes,", files.length, "media,", files.filter((f) => f.endsWith(".mp4")).length, "clips,", scenes.reduce((n, s) => n + s.narration.length, 0), "chars");
