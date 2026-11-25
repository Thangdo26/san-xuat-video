// Writes data/videos/cat-ba-2n1d/video.json and credits.json (Vietnamese only, one video).
// Facts come from research/*.md (read 14/11/2026); restaurants were checked on Google Maps the same day.
// Run: node data/gen-videos.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const IMG = (f) => (f.endsWith(".mp4") ? `videos/cat-ba/${f}` : f.includes("/") ? `videos/cat-ba/${f}.jpg` : `videos/cat-ba/candidates/${f}.jpg`);
const allCredits = [
  ...JSON.parse(readFileSync("data/videos/cat-ba/credits.json", "utf8")),
  ...JSON.parse(readFileSync("data/videos/cat-ba/credits-extra.json", "utf8")),
];
const NARRATOR = { provider: "omnivoice", voice: "vi-nu-tre-03" };

// name = dish, place = restaurant, shot = Google Maps screenshot key (public/videos/cat-ba/maps).
const P = (name, place, address, rating, shot) => ({ name, place, address, rating, shot });
const BA_BEO = P("Bánh đa cua", "Quán Bà Béo", "KCN Đình Vũ, gần cầu", 5.0, "ba-beo");
const BA_KY = P("Bánh đa cua", "Bánh đa cua Bà Kỵ", "96 Lạch Tray", 4.8, "ba-ky");
const LY_PHINH = P("Bánh đa cua", "Bánh đa cua Lý Phình", "143 ngõ Lý Tiêm", 4.6, "ly-phinh");
const MANGROVE = P("Cơm, cà phê", "The.Mangrove Café", "Phù Long", 5.0, "mangrove");
const GREEN_GARDEN = P("Cà phê, đồ ăn", "Green Garden Café & Bistro", "Gia Luận", 5.0, "green-garden");
const DINING = P("Cơm, món Việt", "Dining garden", "Hải Sơn, Khe Sâu", 5.0, "dining-garden");
const BUN_PHEN = P("Bún chả", "Bún Chả Phên Trân Châu", "thôn Bến", 4.8, "bun-cha-phen");
const MADAME_LAN = P("Cơm", "Madame Lan Restaurant", "Liên Hoà", 4.9, "madame-lan");
const LAU_HA = P("Lẩu hải sản", "Lẩu Hà", "72 Tùng Dinh", 4.8, "lau-ha");
const LANG_CHAI = P("Hải sản", "Nhà hàng Làng Chài", "256 đường 1/4", 4.6, "lang-chai");
const HAI_YEN = P("Hải sản", "Nhà hàng Hải Yến", "258 đường 1/4", 4.5, "hai-yen");
const LITTLE_LEAF = P("Cơm, món Việt", "The Little Leaf", "224 đường 1/4", 4.6, "little-leaf");
const HOANG_HA = P("Bún, món Huế", "Đặc sản Huế Hoàng Hà", "160 Núi Ngọc", 4.8, "hoang-ha");
const MAI_HOA = P("Hải sản", "Nhà hàng nổi Mai Hoa", "Cái Bèo", 4.8, "mai-hoa");
const NHAT_ANH = P("Hải sản", "Nhà hàng nổi Nhật Anh", "bến Bèo", 4.7, "nhat-anh");
const TRUONG_PHAT = P("Hải sản", "Nhà bè Trường Phát", "bến Bèo", 4.9, "truong-phat");
const SUN_GARDEN = P("Cơm, đồ uống", "Sun Garden Cat Ba", "bến Bèo", 4.7, "sun-garden");
const QUAN_GIO = P("Đồ ăn, đồ uống", "Quán Gió", "gần Xuân Đám", 4.8, "quan-gio");
const LAN_HAPPY = P("Cơm", "Lan Happy Restaurant", "đường xuyên đảo", 4.9, "lan-happy");
const HANDAK = P("Gà, cơm", "Handak Chicken", "176 Hà Sen", 4.9, "handak");

const sp = (p, spokenAs) => ({ ...p, spokenAs });
const ALL_PLACES = [BA_BEO, BA_KY, LY_PHINH, MANGROVE, GREEN_GARDEN, DINING, BUN_PHEN, MADAME_LAN, LAU_HA, LANG_CHAI, HAI_YEN, LITTLE_LEAF, HOANG_HA, MAI_HOA, NHAT_ANH, TRUONG_PHAT, SUN_GARDEN, QUAN_GIO, LAN_HAPPY, HANDAK];
const MAPS = Object.fromEntries(ALL_PLACES.filter((p) => p.shot).map((p) => [p.place, p.shot]));

const STOPS = [
  {
    id: "duongra", label: "Ngày 1 · Sáng", lat: 20.8, lng: 106.83, accent: "#4fd1c5",
    gallery: ["br-1", "fe-2", "fe-3", "fe-1"],
    caption: "Đường ra đảo",
    points: ["Cầu vượt biển 5,44 km", "Cáp treo nghỉ thứ Ba"],
    gauge: "km 0",
    narration:
      "Sáng ngày đầu, từ Hải Phòng lên cầu Tân Vũ, Lạch Huyện, cây cầu vượt biển dài nhất Việt Nam, năm phẩy bốn bốn cây số giữa biển. Sang Cát Hải thì qua đảo bằng cáp treo, mùa này vắng, hai người một cabin. Cáp treo nghỉ thứ Ba, hôm đó thì đi phà Đồng Bài. Ăn sáng bánh đa cua ở quán Bà Béo, năm sao.",
    dishes: [sp(BA_BEO, "Bà Béo"), BA_KY, LY_PHINH],
    more: [],
  },
  {
    id: "venbien", label: "Ngày 1 · Trưa", lat: 20.77, lng: 107.0, accent: "#ffb454",
    gallery: ["flickr/road-curve", "rd-3", "pexels/6876803", "rd-6"], pano: true,
    caption: "Đường ven biển",
    points: ["~25 km, Cái Viềng → thị trấn", "Hoa giấy nở quanh năm"],
    gauge: "km 25",
    narration:
      "Từ bến Cái Viềng vào thị trấn là khoảng hai mươi lăm cây số đường ven biển, được gọi là cung đường biển đẹp nhất miền Bắc. Một bên vách núi đá, một bên là biển, hoa giấy nở dọc đường. Nhiều cua nên chạy chậm thôi, ghé bãi Chút Chít chụp ảnh, không mất phí. Ăn trưa ở Dining garden, năm sao.",
    dishes: [sp(DINING, "Dining garden"), MANGROVE, BUN_PHEN],
    more: [GREEN_GARDEN, MADAME_LAN],
  },
  {
    id: "catco", label: "Ngày 1 · Chiều", lat: 20.716, lng: 107.054, accent: "#ff7a8a",
    gallery: ["cc-1", "pexels/24701013", "flickr/town-bay", "tw-1"],
    caption: "Cát Cò",
    points: ["Lối đi bộ men vách đá", "Hoàng hôn trên vịnh"],
    gauge: "km 27",
    narration:
      "Chiều đi bộ con đường men vách đá nối bãi Cát Cò một sang Cát Cò ba, hơi mỏi chân nhưng rất đẹp. Mùa này nước lạnh, cứ ngồi ngắm biển là đủ. Gần năm giờ ra vịnh đón hoàng hôn. Tối ăn lẩu hải sản ở Lẩu Hà, bốn chấm tám sao, rồi ra quảng trường ăn ngô nướng cho ấm.",
    dishes: [sp(LAU_HA, "Lẩu Hà"), LANG_CHAI, HAI_YEN],
    more: [LITTLE_LEAF, HOANG_HA],
  },
  {
    id: "lanha", label: "Ngày 2 · Sáng", lat: 20.728, lng: 107.066, accent: "#3fb6e8",
    gallery: ["footage/boat.mp4", "pexels/6348812", "pexels/34635623", "pexels/34635616", "pexels/1018475"],
    caption: "Vịnh Lan Hạ",
    points: ["Tàu đi từ bến Bèo", "Mùa lạnh: chèo kayak"],
    gauge: "km 29",
    narration:
      "Sáng hôm sau ra bến Bèo đi tàu ghép vịnh Lan Hạ, qua làng chài Cái Bèo và những đảo đá vôi. Mùa lạnh không tắm biển, thay bằng chèo kayak, nhớ mang áo gió. Muốn tự ăn thì về bến ăn hải sản ở Mai Hoa, bốn chấm tám sao.",
    dishes: [sp(MAI_HOA, "Mai Hoa"), NHAT_ANH, TRUONG_PHAT],
    more: [SUN_GARDEN],
  },
  {
    id: "xuyendao", label: "Ngày 2 · Chiều", lat: 20.8, lng: 107.0, accent: "#c9e27a",
    gallery: ["rd-1", "np-1", "vh-1", "rd-2", "np-3"], pano: true,
    caption: "Đường xuyên đảo",
    points: ["Qua Vườn quốc gia Cát Bà", "Hoa lau tháng 11–12"],
    gauge: "km 55",
    narration:
      "Chiều về thì đổi sang đường xuyên đảo, đi qua rừng của vườn quốc gia. Từ đầu tháng mười một tới cuối tháng mười hai, hoa lau phủ hai bên đường. Ghé Quán Gió nghỉ chân, rồi ra phà Cái Viềng trước chuyến cuối, ngắm hoàng hôn trên phà về.",
    dishes: [sp(QUAN_GIO, "Quán Gió"), LAN_HAPPY, HANDAK],
    more: [],
  },
];

const STAY = {
  caption: "Nên ở đâu?",
  zones: [
    { title: "Trung tâm, đường 1/4", note: "Ra biển, bến tàu vài phút; nhiều quán", picks: [["Giếng Ngọc Cát Bà Hotel", 4.7, "240 đường 1/4"], ["Gia Cat Long Boutique", 4.6, "238 đường 1/4"]] },
    { title: "Bãi Cát Cò", note: "Ngay bãi biển, gần lối đi vách đá", picks: [["Flamingo Cát Bà Beach Resort", 4.8, "Cát Cò 1, 2"]] },
    { title: "Thung lũng ven đường 356", note: "Yên tĩnh; xa trung tâm, tối đường vắng", picks: [["Catba Papillon Garden", 4.8, "ven đường 356"], ["The Eden Cat Ba", 4.8, "đường 356"]] },
  ],
  tip: "Mùa vắng phòng rẻ, vẫn nên đặt trước khi ra đảo",
  narration:
    "Nên ở đâu? Lần đầu thì ở trung tâm, đường một tháng tư, như Giếng Ngọc, bốn chấm bảy sao, ra biển và bến tàu chỉ vài phút. Thích biển thì ở Flamingo ngay bãi Cát Cò. Muốn yên tĩnh thì ở thung lũng ven đường ba năm sáu, nhưng tối đường khá vắng. Mùa này phòng rẻ, vẫn nên đặt trước.",
  cues: ["trung tâm", "flamingo", "thung lũng", "mùa này"],
};

// research/cost.md (prices read 14/11/2026), per person, two people sharing a room and a motorbike.
const COST = {
  items: [
    { k: "Xe Hà Nội ⇄ Cát Bà", note: "limousine, xe khách · khứ hồi, gồm phà", v: "500–700k" },
    { k: "Cáp treo vượt biển", note: "1 chiều, kèm xe bus · nghỉ thứ Ba", v: "100–130k" },
    { k: "Phòng 1 đêm", note: "mùa vắng · ở 2 người", v: "250–300k" },
    { k: "Thuê xe máy", note: "120–200k/ngày · đi 2 người", v: "60–100k" },
    { k: "Tour ghép vịnh Lan Hạ", note: "tàu, vé, kayak, bữa trưa", v: "650–700k" },
    { k: "Ăn uống", note: "theo TikTok", v: "200–400k" },
  ],
  total: "1,8–2,3 triệu",
  narration:
    "Hết bao nhiêu tiền? Tính cho một người, đi hai người: xe khứ hồi khoảng năm tới bảy trăm nghìn, tour ghép vịnh Lan Hạ khoảng sáu trăm rưỡi tới bảy trăm nghìn, đã gồm kayak và bữa trưa. Tổng cộng khoảng một phẩy tám tới hai phẩy ba triệu một người.",
};

const HOOK =
  "Cát Bà mùa lạnh không phải để tắm biển, mà để chạy xe. Đảo vắng, trời mát, nước vịnh xanh trong. Đây là lịch trình hai ngày một đêm qua những cung đường đẹp nhất của đảo, gom từ TikTok. Lưu lại nhé!";
const OUTRO =
  "Cát Bà mùa lạnh vắng, mát và đẹp theo một kiểu rất riêng. Trước khi đi, xem lịch phà, cáp treo và dự báo gió, gió to phà có thể dừng. Địa chỉ quán và bảng chi phí mình để ở phần mô tả. Lưu lại cho chuyến đi sắp tới nhé!";

const credit = (files) => allCredits.filter((c) => files.some((f) => c.file === IMG(f)));
const THEME = { accent: "#4fd1c5", highlight: "#ffd36e", brand: "CÁT BÀ" };
const slug = "cat-ba-2n1d";
const files = [];
const use = (list) => (files.push(...list), list.map(IMG));

const scenes = [
  {
    id: "hook", layout: "hook", caption: "CÁT BÀ", kicker: "MÙA LẠNH · NHỮNG CUNG ĐƯỜNG", label: "2N1Đ",
    narration: HOOK, durationSec: 12, gallery: use(["footage/karst.mp4", "footage/bay-boats.mp4"]),
    // GPS intro: turn-by-turn banners (sources: VOV for the bridge, Sun World for the cable car, Thanh Niên for road 356).
    nav: [["up", "Cầu Tân Vũ – Lạch Huyện", "5,44 km"], ["left", "Cáp treo vượt biển", "3.955 m"], ["right", "Đường ven biển 356", "~25 km"]],
    trip: "Hà Nội → Cát Bà · khoảng 160 km",
  },
];
for (const s of STOPS) {
  scenes.push({
    id: s.id, layout: "point", ...(s.pano ? { pano: true } : {}), caption: s.caption, label: s.label, accent: s.accent, points: s.points, gauge: s.gauge,
    narration: s.narration, durationSec: 13, gallery: use(s.gallery), geo: { lat: s.lat, lng: s.lng },
    dishes: s.dishes.map((d) => ({ name: d.name, place: d.place, address: d.address, ...(d.rating != null ? { rating: d.rating } : {}), ...(d.spokenAs ? { spokenAs: d.spokenAs } : {}) })),
    moreDishes: s.more.map((d) => ({ name: d.name, place: d.place, address: d.address, rating: d.rating })),
  });
}
scenes.push({
  id: "stay", layout: "stay", caption: STAY.caption, accent: "#4fd1c5", zones: STAY.zones, tip: STAY.tip,
  cues: STAY.cues, narration: STAY.narration, durationSec: 12, gallery: use(["tw-5", "pexels/6876856", "lh-4"]),
});
scenes.push({
  id: "cost", layout: "cost", caption: "Hết bao nhiêu tiền?", kicker: "TRƯỚC KHI ĐI", accent: "#ffd36e",
  receiptTitle: "CHI PHÍ 2N1Đ · 1 NGƯỜI", items: COST.items, total: COST.total,
  stamp: "THAM KHẢO 11/2026", totalCue: "tổng cộng",
  note: "2 người đi chung · nguồn: Vietnamtourism, Sun World, tour Cát Bà, TikTok",
  narration: COST.narration, durationSec: 12, gallery: use(["pexels/6876848", "tw-3"]),
});
scenes.push({
  id: "outro", layout: "outro", caption: "Hẹn gặp ở Cát Bà", kicker: "TỔNG KẾT HÀNH TRÌNH", cta: "Lưu lại nhé!",
  narration: OUTRO, durationSec: 11, gallery: use(["footage/karst-boat.mp4"]),
  stats: [["Cầu vượt biển", "5,44 km"], ["Cáp treo vượt biển", "3.955 m"], ["Đường ven biển", "~25 km"], ["Hoa lau xuyên đảo", "T11 – T12"]],
});

const video = {
  id: slug, title: "Cát Bà mùa lạnh 2N1Đ", language: "vi", region: "Cát Bà, Hải Phòng, Việt Nam",
  template: "travel-itinerary", format: { width: 1080, height: 1920, fps: 30 }, transitionFrames: 15, theme: THEME,
  narrator: NARRATOR, subtitles: true, music: { src: "shared/music/travel-upbeat.mp3", volume: 0.8 }, maps: MAPS, scenes,
};
const dir = `data/videos/${slug}`;
mkdirSync(dir, { recursive: true });
writeFileSync(`${dir}/video.json`, JSON.stringify(video, null, 2) + "\n");
writeFileSync(`${dir}/credits.json`, JSON.stringify(credit(files), null, 2) + "\n");
const missing = files.filter((f) => !allCredits.some((c) => c.file === IMG(f)));
console.log(slug, scenes.length, "scenes,", credit(files).length, "credits", missing.length ? `MISSING: ${missing.join(", ")}` : "");
