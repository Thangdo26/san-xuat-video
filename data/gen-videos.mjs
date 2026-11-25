// Builds data/videos/<slug>/video.json (+ credits.json) for the three Hà Giang videos
// (Vietnamese only): ha-giang-3n2d, ha-giang-4n3d, ha-giang-am-thuc.
// Story, tips, costs and food picks follow research/tiktok.md, itinerary.md, stay.md, cost.md
// and food.md (Google Maps checked 08/11/2026). Re-running resets durationSec, so run the voice again.
// Run: node data/gen-videos.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const IMG = (f) => (f.includes("/") ? `videos/ha-giang/${f}.jpg` : `videos/ha-giang/candidates/${f}.jpg`);
const allCredits = [
  ...JSON.parse(readFileSync("data/videos/ha-giang/credits.json", "utf8")),
  ...JSON.parse(readFileSync("data/videos/ha-giang/credits-pexels.json", "utf8")),
];

const NARRATOR = { provider: "omnivoice", voice: "vi-nu-tre-03" };

// One place: dish, place, address, Maps rating (null = suggestion without a rating), screenshot key.
const P = (name, place, address, rating, shot) => ({ name, place, address, rating, shot });

const LAN_ANH = P("Cơm, lẩu", "Lan Anh Restaurant", "192 Tam Sơn", 4.8, "lan-anh");
const HUY_DINH = P("Cơm, lẩu", "Nhà hàng Huy Định", "tổ 3 Tam Sơn", 4.8, "huy-dinh");
const YEN_NGOC = P("Cơm", "Nhà hàng Yến Ngọc 2", "tổ 3 Tam Sơn", 4.9, "yen-ngoc");
const HUONG_LAN = P("Cơm", "Nhà hàng Hương Lan", "Tam Sơn", 4.6, null);
const HUYEN_TRANG = P("Cơm", "Nhà hàng Huyền Trang", "Tam Sơn", 4.6, null);
const NGOC_TUYEN = P("Cơm, phở, lẩu", "Ngọc Tuyên", "cổng chào Yên Minh", 4.9, "ngoc-tuyen");
const HANG_VENUS = P("Cơm", "Hằng Venus", "451 Trần Hưng Đạo", 4.7, "hang-venus");
const PHONG_VAN = P("Cơm", "Phong Vân Quán", "tổ 8 Trần Hưng Đạo", 4.8, "phong-van");
const NHA_SAN = P("Cơm", "Nhà Sàn Restaurant", "Yên Minh", 4.5, null);
const HOA_CUONG = P("Cơm", "Nhà hàng Hóa Cường", "Yên Minh", 4.5, null);
const TUNG_TY = P("Cơm", "Nhà hàng Tùng Tỷ", "Sà Phìn", 4.8, "tung-ty");
const NHA_PAO = P("Cơm", "Quán Cơm nhà Pao", "QL4C Sà Phìn", 4.5, "nha-pao");
const THACH_SON = P("Lẩu gà đen", "Thạch Sơn quán", "chợ cổ Đồng Văn", 4.9, "thach-son");
const CND = P("Thắng cố ngựa", "Nhà hàng CND", "đường 3/2 Đồng Văn", 4.8, "cnd");
const GIANG_QUAN = P("Cơm, lẩu", "Giàng Quán", "Đồng Văn", 5.0, "giang-quan");
const TUNG_PHUC = P("Cơm", "Nhà hàng Tùng Phúc", "số 135 Đồng Văn", 4.9, "tung-phuc");
const ETHNIC = P("Cơm, đồ Tây", "Ethnic House", "phố cổ Đồng Văn", 4.8, null);
const CO_XUAN = P("Lẩu nướng", "Lẩu nướng Cô Xuân", "Đồng Văn", 4.6, null);
const CUC_BAC = P("Lẩu gà đen", "Cafe Cực Bắc", "Lô Lô Chải", 4.7, "cuc-bac");
const LALALAND = P("Cơm, lẩu", "Lalaland Restaurant", "Lô Lô Chải", 4.9, "lalaland");
const A_LOI = P("Cơm, lẩu", "À Lôi Lô Lô Chải", "homestay Lô Lô Chải", 4.9, "a-loi");
const VI_LU = P("Cơm", "Vị Lư", "Lô Lô Chải", 4.9, null);
const THEN_PA = P("Cà phê, cơm", "Then Pa Cafe", "làng Thèn Pả", 4.7, null);
const SONG_NHO_QUE = P("Cơm bến sông", "Sông Nho Quế", "bến thuyền", 4.8, "song-nho-que");
const TU_SAN = P("Cà phê", "Tu Sản Coffee", "đèo Mã Pí Lèng", 4.9, "tu-san-coffee");
const CAFE_MY = P("Cà phê", "Cafe Mỷ", "đèo Mã Pí Lèng", 4.7, "cafe-my");
const NQ_RETREAT = P("Cơm", "Nho Quế Retreat", "Mèo Vạc", 4.7, null);
const MPL_RES = P("Cơm", "Ma Pi Leng restaurant", "Đồng Văn", 4.6, null);
const ADVENTURE = P("Cơm, món Tây", "Adventure Restaurant", "202 đường Hạnh Phúc", 5.0, "adventure");
const THUY_TIEN = P("Cơm", "Nhà hàng Thủy Tiên", "342 đường Hạnh Phúc", 4.7, "thuy-tien");
const TUAN_HEN = P("Cơm", "Tuấn Hen", "Mèo Vạc", 4.7, "tuan-hen");
const HAI_YEN = P("Lẩu nướng", "Lẩu nướng Hải Yến", "chợ đêm Mèo Vạc", 4.7, null);
const HMONG_DG = P("Cơm bản", "H'mong Restaurant", "Du Già", 4.9, "hmong-dg");
const NGAN_TRANG = P("Cơm", "Ngan Trang Restaurant", "Du Già", 4.8, "ngan-trang");
const TO_DAY = P("Cơm, homestay", "Tớ Dày Village", "làng Khác, Du Già", 4.7, "to-day");
const PACHIDUA = P("Cơm, homestay", "Pachidua Ecolodge", "Du Già", 4.9, null);
const DG_PANORAMA = P("Cơm, homestay", "Du Gia Panorama", "Du Già", 4.8, null);
const BC_GIANG = P("Bánh cuốn", "Bánh cuốn Giang", "207 Lý Thường Kiệt", 5.0, "bc-giang");
const BC_CHINH = P("Bánh cuốn", "Bánh cuốn Bà Chính", "Phan Đình Phùng", 4.6, "bc-chinh");
const AU_TAU = P("Cháo ấu tẩu", "Quán đêm phố cổ Đồng Văn", "theo VnExpress", null, null);
const TGM = P("Bánh tam giác mạch", "Chợ phiên, ven dốc Thẩm Mã", "gợi ý từ TikTok", null, null);
const CHO_PHIEN = P("Thắng cố", "Chợ phiên Đồng Văn", "sáng Chủ nhật", null, null);

const sp = (p, spokenAs) => ({ ...p, spokenAs });
const ALL_PLACES = [LAN_ANH, HUY_DINH, YEN_NGOC, NGOC_TUYEN, HANG_VENUS, PHONG_VAN, TUNG_TY, NHA_PAO, THACH_SON, CND, GIANG_QUAN, TUNG_PHUC, CUC_BAC, LALALAND, A_LOI, SONG_NHO_QUE, TU_SAN, CAFE_MY, ADVENTURE, THUY_TIEN, TUAN_HEN, HMONG_DG, NGAN_TRANG, TO_DAY, BC_GIANG, BC_CHINH];
const MAPS = Object.fromEntries(ALL_PLACES.filter((p) => p.shot).map((p) => [p.place, p.shot]));

const STOPS = {
  quanba: {
    lat: 23.0697, lng: 104.9886, accent: "#7bd389",
    gallery: ["qb-03", "qb-02", "qb-01", "qb-04"],
    label: "Ngày 1 · Sáng", caption: "Cổng trời Quản Bạ",
    points: ["Chụp cột mốc Km0 lúc sáng sớm", "Qua dốc Bắc Sum, ngắm núi đôi Cô Tiên"],
    narration:
      "Xe đêm tới thành phố Hà Giang lúc ba, bốn giờ sáng. Ngày một, chụp ảnh ở cột mốc số không, rồi chạy quốc lộ bốn C qua dốc Bắc Sum, lên cổng trời Quản Bạ ngắm núi đôi Cô Tiên. Ăn sáng ở Lan Anh Restaurant, bốn chấm tám sao.",
    dishes: [sp(LAN_ANH, "Lan Anh"), HUY_DINH, YEN_NGOC],
    more: [HUONG_LAN, HUYEN_TRANG],
  },
  thamma: {
    lat: 23.1785, lng: 105.216, accent: "#f2c14e",
    gallery: ["tm-01", "pexels/36582384", "tm-02", "tm-07"],
    label: "Ngày 1 · Trưa", caption: "Dốc Thẩm Mã",
    points: ["Ăn trưa ở Yên Minh, suất khoảng 100k (TikTok)", "Dốc Chín Khoanh nhìn xuống phố Cáo"],
    narration:
      "Trưa dừng ở Yên Minh, TikTok gợi ý suất cơm chừng một trăm nghìn, như ở quán Ngọc Tuyên, bốn chấm chín sao. Chiều qua dốc Thẩm Mã, nơi các em nhỏ đeo gùi hoa, rồi dốc Chín Khoanh nhìn xuống phố Cáo.",
    dishes: [sp(NGOC_TUYEN, "Ngọc Tuyên"), HANG_VENUS, PHONG_VAN],
    more: [NHA_SAN, HOA_CUONG],
  },
  vuong: {
    lat: 23.2263, lng: 105.2397, accent: "#e8a87c",
    gallery: ["vg-03", "vg-08", "vg-06", "vg-01"],
    label: "Ngày 1 · Chiều", caption: "Dinh thự họ Vương",
    points: ["Xây đầu thế kỷ 20, vé khoảng 30k (TikTok)", "Hai vòng tường đá, nhà gỗ quý"],
    narration:
      "Ghé dinh thự họ Vương ở Sà Phìn, xây từ đầu thế kỷ hai mươi theo lối nhà Thanh, có hai vòng tường đá bao quanh. Vé theo TikTok khoảng ba mươi nghìn. Gần đó có nhà hàng Tùng Tỷ, bốn chấm tám sao.",
    dishes: [sp(TUNG_TY, "Tùng Tỷ"), NHA_PAO, THACH_SON],
    more: [CND, GIANG_QUAN],
  },
  lungcu: {
    lat: 23.3633, lng: 105.3166, accent: "#ff6b6b",
    gallery: ["lc-10", "pexels/15997684", "lc-07", "lc-04", "lc-09"],
    label: "Ngày 2 · Sáng", caption: "Cột cờ Lũng Cú",
    points: ["Cao khoảng 1.470 m, lá cờ rộng 54 m²", "Vé 25k; tối ngủ làng Lô Lô Chải"],
    narration:
      "Tối ngủ làng Lô Lô Chải dưới chân cột cờ, ăn lẩu gà đen ở Cafe Cực Bắc, bốn chấm bảy sao. Ngày hai, leo cột cờ Lũng Cú ở độ cao khoảng một nghìn bốn trăm bảy mươi mét, lá cờ rộng năm mươi tư mét vuông, vé hai mươi lăm nghìn.",
    dishes: [sp(CUC_BAC, "Cực Bắc"), LALALAND, A_LOI],
    more: [VI_LU, THEN_PA],
  },
  dongvan: {
    lat: 23.2775, lng: 105.3622, accent: "#ffd166",
    gallery: ["pexels/31621608", "pexels/36606046", "dv-07", "pexels/20557941"],
    label: "Ngày 2 · Trưa", caption: "Phố cổ Đồng Văn",
    points: ["Chợ phiên họp sáng Chủ nhật", "Tối cuối tuần có văn nghệ, đốt lửa (TikTok)"],
    narration:
      "Trưa về phố cổ Đồng Văn, quanh khu chợ cổ có những ngôi nhà hơn trăm năm tuổi, chợ phiên họp vào sáng Chủ nhật. Ăn lẩu gà đen ở Thạch Sơn quán, bốn chấm chín sao với hơn năm trăm lượt đánh giá.",
    dishes: [sp(THACH_SON, "Thạch Sơn"), GIANG_QUAN, TUNG_PHUC],
    more: [ETHNIC, CND, CO_XUAN],
  },
  mapileng: {
    lat: 23.24, lng: 105.411, accent: "#5fd3a8",
    gallery: ["pexels/39243869", "mpl-08", "pexels/30318714", "pexels/22028924", "pexels/31334165"],
    label: "Ngày 2 · Chiều", caption: "Đèo Mã Pí Lèng",
    points: ["Thuyền sông Nho Quế 120–150k", "Qua hẻm Tu Sản, vách đá dựng đứng"],
    narration:
      "Chiều vượt đèo Mã Pí Lèng, xuống bến đi thuyền trên sông Nho Quế qua hẻm Tu Sản, vé thuyền khoảng một trăm hai mươi tới một trăm năm mươi nghìn. Ăn cơm ở nhà hàng Sông Nho Quế ngay bến, bốn chấm tám sao. Ngày ba về lại thành phố theo quốc lộ bốn C.",
    dishes: [sp(SONG_NHO_QUE, "Sông Nho Quế"), TU_SAN, CAFE_MY],
    more: [NQ_RETREAT, MPL_RES],
  },
  meovac: {
    lat: 23.156, lng: 105.411, accent: "#c3a6ff",
    gallery: ["pexels/38924531", "mv-04", "mv-05", "pexels/39243877"],
    label: "Ngày 3 · Sáng", caption: "Mèo Vạc",
    points: ["Chợ phiên họp sáng Chủ nhật", "Thung lũng Pả Vi, đường Hạnh Phúc"],
    narration:
      "Ngày ba, sáng đi chợ phiên Mèo Vạc nếu đúng Chủ nhật, thử thắng cố và mèn mén, rồi ngắm thung lũng Pả Vi. Ăn ở Adventure Restaurant trên đường Hạnh Phúc, năm sao với hơn ba trăm lượt đánh giá.",
    dishes: [sp(ADVENTURE, "Adventure"), THUY_TIEN, TUAN_HEN],
    more: [HAI_YEN, CAFE_MY],
  },
  dugia: {
    lat: 22.9076, lng: 105.1667, accent: "#8ecbff",
    gallery: ["dg-02", "pexels/27421515", "dg-01"],
    label: "Ngày 3 · Chiều", caption: "Du Già",
    points: ["Đường hơi khó, ít người đi (TikTok)", "Suối, thác, ngủ homestay giữa ruộng"],
    narration:
      "Chiều về Du Già, cung đường TikTok bảo hơi khó đi nhưng yên bình, có suối, thác và ruộng lúa. Tối ngủ homestay, ăn ở H'mong Restaurant, bốn chấm chín sao với gần chín trăm lượt đánh giá. Ngày bốn về lại thành phố.",
    dishes: [sp(HMONG_DG, "H'mong"), NGAN_TRANG, TO_DAY],
    more: [PACHIDUA, DG_PANORAMA],
  },
};

// 4N3Đ: day 2 ends in Mèo Vạc instead of heading home on day 3.
const FOUR = {
  mapileng: {
    narration:
      "Chiều vượt đèo Mã Pí Lèng, xuống bến đi thuyền trên sông Nho Quế qua hẻm Tu Sản, vé thuyền khoảng một trăm hai mươi tới một trăm năm mươi nghìn. Ăn cơm ở nhà hàng Sông Nho Quế ngay bến, bốn chấm tám sao, rồi về Mèo Vạc nghỉ đêm.",
  },
};

const STAY = {
  caption: "Nên ở đâu?",
  zones: [
    { title: "Làng Lô Lô Chải", note: "Dưới chân cột cờ, yên bình; cuối tuần đông", picks: [["À Lôi Lô Lô Chải", 4.9, "Lô Lô Chải"], ["Chanh Homestay", 4.8, "Lô Lô Chải"]] },
    { title: "Thị trấn Đồng Văn", note: "Gần phố cổ, chợ phiên, nhiều quán ăn", picks: [["Nhà nghỉ Quang Trung", 4.9, "Đồng Văn"], ["Bình Minh Hostel", 4.7, "Đồng Văn"]] },
  ],
  tip: "Mùa hoa tam giác mạch và cuối tuần: đặt sớm",
  narration:
    "Nên ở đâu? Đêm đầu ngủ làng Lô Lô Chải dưới chân cột cờ, như À Lôi hay Chanh Homestay. Đêm hai ở thị trấn Đồng Văn cho gần phố cổ, như nhà nghỉ Quang Trung, bốn chấm chín sao. Mùa hoa tam giác mạch và cuối tuần nhớ đặt phòng sớm.",
  cues: ["lô lô", "đồng văn", "mùa hoa"],
};
const STAY4 = {
  zones: [
    ...STAY.zones,
    { title: "Du Già", note: "Ngủ giữa ruộng, suối; đường khó hơn", picks: [["Pachidua Ecolodge", 4.9, "Du Già"], ["Km0Home Du Già", 5.0, "Du Già"]] },
  ],
  narration:
    "Nên ở đâu? Đêm đầu ngủ làng Lô Lô Chải dưới chân cột cờ, như À Lôi Lô Lô Chải. Đêm hai ở Đồng Văn hoặc Mèo Vạc, như nhà nghỉ Quang Trung, bốn chấm chín sao. Đêm ba ở Du Già, như Pachidua Ecolodge. Mùa hoa tam giác mạch và cuối tuần nhớ đặt phòng sớm.",
  cues: ["lô lô", "đồng văn", "du già", "mùa hoa"],
};

// research/cost.md (prices read 08/11/2026), per person, two people sharing a room and a motorbike.
const COST = {
  "3n2d": {
    items: [
      { k: "Xe Hà Nội ⇄ Hà Giang", note: "giường nằm, cabin · khứ hồi", v: "550–700k" },
      { k: "Phòng 2 đêm", note: "Lô Lô Chải + Đồng Văn, ở 2 người", v: "450–700k" },
      { k: "Thuê xe máy 3 ngày", note: "180–300k/ngày, đi 2 người", v: "270–450k" },
      { k: "Xăng", note: "khoảng 400 km, chia 2", v: "~100k" },
      { k: "Vé Lũng Cú, dinh thự, thuyền Nho Quế", v: "175–205k" },
      { k: "Ăn uống 3 ngày", note: "theo TikTok và MIA.vn", v: "500–900k" },
    ],
    total: "2,0–3,1 triệu",
    narration:
      "Hết bao nhiêu tiền? Tính cho một người, đi hai người: xe giường nằm khứ hồi khoảng năm trăm rưỡi tới bảy trăm nghìn, phòng hai đêm bốn trăm rưỡi tới bảy trăm nghìn, thuê xe máy ba ngày chừng ba, bốn trăm nghìn. Tổng cộng khoảng hai tới ba phẩy một triệu một người.",
  },
  "4n3d": {
    items: [
      { k: "Xe Hà Nội ⇄ Hà Giang", note: "giường nằm, cabin · khứ hồi", v: "550–700k" },
      { k: "Phòng 3 đêm", note: "Lô Lô Chải, Mèo Vạc, Du Già", v: "650k–1,05tr" },
      { k: "Thuê xe máy 4 ngày", note: "180–300k/ngày, đi 2 người", v: "360–600k" },
      { k: "Xăng", note: "chia 2", v: "~150k" },
      { k: "Vé Lũng Cú, dinh thự, thuyền Nho Quế", v: "175–205k" },
      { k: "Ăn uống 4 ngày", note: "theo TikTok và MIA.vn", v: "650k–1,2tr" },
    ],
    total: "2,5–3,9 triệu",
    narration:
      "Hết bao nhiêu tiền? Tính cho một người, đi hai người: xe giường nằm khứ hồi khoảng năm trăm rưỡi tới bảy trăm nghìn, phòng ba đêm sáu trăm rưỡi tới hơn một triệu, thuê xe máy bốn ngày bốn tới sáu trăm nghìn. Tổng cộng khoảng hai phẩy năm tới ba phẩy chín triệu một người.",
  },
};

const HOOK = {
  "3n2d": "Hà Giang có cột cờ Lũng Cú nơi địa đầu, có đèo Mã Pí Lèng và dòng Nho Quế xanh ngọc. Đây là lịch trình ba ngày hai đêm gom từ TikTok, kèm quán ăn từ bốn sao rưỡi và chi phí từng khoản. Lưu lại nhé!",
  "4n3d": "Có bốn ngày? Đi Hà Giang thong thả, từ cổng trời Quản Bạ, cột cờ Lũng Cú, đèo Mã Pí Lèng tới một đêm ở Du Già. Đây là lịch trình bốn ngày ba đêm gom từ TikTok, kèm chi phí từng khoản. Lưu lại nhé!",
};
const OUTRO =
  "Đi Hà Giang nhớ mang bằng lái vì trên đường có nhiều chốt kiểm tra, và đừng uống rượu khi chạy đèo. Địa chỉ quán và bảng chi phí mình để ở phần mô tả. Hẹn gặp ở Hà Giang, lưu lại nhé!";

const credit = (files) => allCredits.filter((c) => files.some((f) => c.file === IMG(f)));

const THEME = { accent: "#e86a92", highlight: "#f2c14e", brand: "HÀ GIANG" };

const base = (slug, title) => ({
  id: slug,
  title,
  language: "vi",
  region: "Hà Giang (nay thuộc Tuyên Quang), Việt Nam",
  template: "travel-itinerary",
  format: { width: 1080, height: 1920, fps: 30 },
  transitionFrames: 15,
  theme: THEME,
  narrator: NARRATOR,
  subtitles: true,
  music: { src: "shared/music/travel-upbeat.mp3", volume: 0.8 },
  maps: MAPS,
});

const write = (slug, video, files) => {
  const dir = `data/videos/${slug}`;
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/video.json`, JSON.stringify(video, null, 2) + "\n");
  writeFileSync(`${dir}/credits.json`, JSON.stringify(credit(files), null, 2) + "\n");
  console.log(slug, video.scenes.length, "scenes,", credit(files).length, "credits");
};

const PLANS = {
  "3n2d": { stops: ["quanba", "thamma", "vuong", "lungcu", "dongvan", "mapileng"], hook: ["pexels/39243865", "pexels/35792509", "lc-10", "pexels/30318714"], outro: ["pexels/30318692"], days: 3 },
  "4n3d": { stops: ["quanba", "thamma", "vuong", "lungcu", "dongvan", "mapileng", "meovac", "dugia"], hook: ["pexels/35792511", "pexels/39243869", "pexels/15997684", "pexels/27421515"], outro: ["pexels/39243864"], days: 4 },
};

for (const [plan, cfg] of Object.entries(PLANS)) {
  const slug = `ha-giang-${plan}`;
  const files = [...cfg.hook, ...cfg.outro];
  const nights = cfg.days - 1;
  const scenes = [
    {
      id: "hook", layout: "hook", caption: "HÀ GIANG", kicker: "CỰC BẮC TỔ QUỐC · TỪ TIKTOK",
      label: `${cfg.days}N${nights}Đ`, narration: HOOK[plan], durationSec: 10, gallery: cfg.hook.map(IMG),
    },
  ];
  for (const id of cfg.stops) {
    const s = { ...STOPS[id], ...(plan === "4n3d" ? FOUR[id] ?? {} : {}) };
    files.push(...s.gallery);
    scenes.push({
      id, layout: "point", caption: s.caption, label: s.label, accent: s.accent, points: s.points,
      narration: s.narration, durationSec: 13, gallery: s.gallery.map(IMG), geo: { lat: s.lat, lng: s.lng },
      dishes: s.dishes.map((d) => ({ name: d.name, place: d.place, address: d.address, ...(d.rating != null ? { rating: d.rating } : {}), ...(d.spokenAs ? { spokenAs: d.spokenAs } : {}) })),
      moreDishes: s.more.map((d) => ({ name: d.name, place: d.place, address: d.address, rating: d.rating })),
    });
  }
  const stay = plan === "4n3d" ? { ...STAY, ...STAY4 } : STAY;
  const stayGallery = plan === "4n3d" ? ["lc-07", "dv-08", "dg-02"] : ["lc-07", "dv-08"];
  files.push(...stayGallery);
  scenes.push({
    id: "stay", layout: "stay", caption: stay.caption, accent: "#e86a92", zones: stay.zones, tip: stay.tip,
    cues: stay.cues, narration: stay.narration, durationSec: 11, gallery: stayGallery.map(IMG),
  });
  const costGallery = ["pexels/37970026", "pexels/34574527"];
  files.push(...costGallery);
  scenes.push({
    id: "cost", layout: "cost", caption: "Hết bao nhiêu tiền?", kicker: "TRƯỚC KHI ĐI", accent: "#f2c14e",
    receiptTitle: `CHI PHÍ ${cfg.days}N${nights}Đ · 1 NGƯỜI`, items: COST[plan].items, total: COST[plan].total,
    stamp: "THAM KHẢO 11/2026", totalCue: "tổng cộng",
    note: "2 người đi chung · nguồn: VnExpress, MIA.vn, TikTok",
    narration: COST[plan].narration, durationSec: 12, gallery: costGallery.map(IMG),
  });
  scenes.push({
    id: "outro", layout: "outro", caption: "Hẹn gặp ở Hà Giang", kicker: "LƯU LẠI CHO CHUYẾN ĐI", cta: "Lưu lại nhé!",
    narration: OUTRO, durationSec: 10, gallery: cfg.outro.map(IMG),
    stamps: cfg.stops.map((id) => STOPS[id].caption),
  });
  write(slug, { ...base(slug, `Hà Giang ${cfg.days}N${nights}Đ`), scenes }, files);
}

// ---------------------------------------------------------------- food video
const DISHES = [
  {
    id: "banhcuon", accent: "#f2c14e", gallery: ["f-banhcuon-3", "food/34314598", "f-banhcuon-1", "f-banhcuon-2"],
    caption: "Bánh cuốn", tagline: "Ăn cùng bát nước xương", tag: "Nước xương hầm",
    origin: "Món sáng quen thuộc của người Hà Giang",
    made: "Bánh tráng mỏng, nhân thịt, mộc nhĩ hoặc trứng",
    eat: "Ăn cùng bát nước xương hầm như canh, thêm măng cay; gọi kèm sữa ngô (TikTok)",
    narration:
      "Món thứ nhất, bánh cuốn, món sáng quen thuộc của người Hà Giang. Bánh tráng mỏng, nhân thịt, mộc nhĩ hoặc trứng. Khi ăn, ăn cùng bát nước xương hầm như canh, thêm chút măng cay. Quán ngon: bánh cuốn Giang, năm sao, và bánh cuốn Bà Chính.",
    cues: ["món sáng", "bánh tráng", "khi ăn", "quán ngon"],
    places: [BC_GIANG, BC_CHINH],
  },
  {
    id: "autau", accent: "#c3a6ff", gallery: ["food/39585943", "food/32835478", "food/5652188"],
    caption: "Cháo ấu tẩu", tagline: "Đắng nhẹ, ăn cho ấm", tag: "Món ăn đêm",
    origin: "Món của người Mông, thường ăn vào buổi tối cho ấm",
    made: "Củ ấu tẩu có độc nếu không ninh kỹ; ninh nhiều giờ, nấu cùng gạo và chân giò",
    eat: "Vị ngọt rồi đắng nhẹ; ăn nóng, lần đầu nên gọi ít đắng (TikTok)",
    narration:
      "Món thứ hai, cháo ấu tẩu, món của người Mông thường ăn vào buổi tối. Củ ấu tẩu có độc nếu không chế biến kỹ, nên được ninh nhiều giờ rồi nấu cùng gạo và chân giò. Khi ăn, vị ngọt rồi đắng nhẹ, lần đầu nên gọi ít đắng. Quán ngon thì các quán nổi tiếng chưa đạt bốn sao rưỡi, VnExpress gợi ý ăn ở các quán đêm quanh phố cổ Đồng Văn.",
    cues: ["người mông", "củ ấu", "khi ăn", "quán ngon"],
    places: [AU_TAU],
  },
  {
    id: "gaden", accent: "#ff6b6b", gallery: ["food/33621138", "food/33312413", "food/30882911", "food/31514374"],
    caption: "Lẩu gà đen", tagline: "Gà bản của cao nguyên đá", tag: "Gà bản, thuốc bắc",
    origin: "Gà đen là giống gà quý, xưa chỉ làm khi nhà có khách (theo TikTok)",
    made: "Gà bản da giòn, thịt chắc, nấu lẩu với thuốc bắc và thảo mộc",
    eat: "Ăn tối sau một ngày chạy đèo; ở homestay khoảng 200k/người (TikTok)",
    narration:
      "Món thứ ba, lẩu gà đen, giống gà quý của vùng cao, ngày xưa chỉ làm khi nhà có khách. Gà bản da giòn, thịt chắc, nấu lẩu với thuốc bắc và thảo mộc. Khi ăn, ngồi quanh nồi lẩu sau một ngày chạy đèo. Quán ngon: Thạch Sơn quán ở phố cổ Đồng Văn, và Cafe Cực Bắc ở Lô Lô Chải.",
    cues: ["giống gà", "gà bản", "khi ăn", "quán ngon"],
    places: [THACH_SON, CUC_BAC],
  },
  {
    id: "thangco", accent: "#ffa94d", gallery: ["f-thangco-1", "mv-02", "f-thangco-2"],
    caption: "Thắng cố", tagline: "Món canh của phiên chợ", tag: "Chợ phiên",
    origin: "Món canh truyền thống của người Mông, nấu ở chợ phiên",
    made: "Thịt và nội tạng ngựa hoặc bò, hoa hồi, thảo quả, lá thắng cố",
    eat: "Ăn nóng ở chợ phiên Đồng Văn, Mèo Vạc vào sáng Chủ nhật",
    narration:
      "Món thứ tư, thắng cố, món canh truyền thống của người Mông ở chợ phiên. Thịt và nội tạng ngựa hoặc bò được nấu với hoa hồi, thảo quả và lá thắng cố. Khi ăn, ăn nóng ở chợ phiên Đồng Văn hay Mèo Vạc vào sáng Chủ nhật. Quán ngon: nhà hàng CND ở Đồng Văn, bốn chấm tám sao.",
    cues: ["món canh", "nội tạng", "khi ăn", "quán ngon"],
    places: [CND, CHO_PHIEN],
  },
  {
    id: "tgm", accent: "#e86a92", gallery: ["f-tgm-1", "pexels/30269214", "pexels/28396511", "pexels/29863314"],
    caption: "Bánh tam giác mạch", tagline: "Từ loài hoa của cao nguyên", tag: "Hạt tam giác mạch",
    origin: "Làm từ hạt tam giác mạch, loài hoa nở tháng 10–11 trên cao nguyên đá",
    made: "Hạt xay thành bột, nhào rồi hấp hoặc nướng (MIA.vn)",
    eat: "Ăn nóng hoặc mua làm quà",
    narration:
      "Món thứ năm, bánh tam giác mạch, làm từ hạt của loài hoa nở vào tháng mười, tháng mười một trên cao nguyên đá. Hạt được xay thành bột, nhào rồi hấp hoặc nướng. Khi ăn, ăn nóng hoặc mua làm quà. Quán ngon thì chưa có quán nào đủ đánh giá, TikTok gợi ý mua ở chợ phiên hay ven dốc Thẩm Mã.",
    cues: ["món thứ năm", "hạt được", "khi ăn", "quán ngon"],
    places: [TGM],
  },
];

const FOOD_HOOK = "Lên Hà Giang ăn gì? Đây là năm món được nhắc nhiều nhất trên TikTok và báo, kèm cách ăn và quán từ bốn sao rưỡi. Lưu lại nhé!";
const FOOD_OUTRO = "Phở chua, mèn mén và xôi ngũ sắc cũng nên thử, quán mình để ở phần mô tả. Bạn chọn món nào trước?";
const SECTION = ["Nguồn gốc", "Cách làm", "Cách ăn", "Quán ngon"];

{
  const slug = "ha-giang-am-thuc";
  const files = [];
  const scenes = [
    {
      id: "hook", layout: "hook", caption: "HÀ GIANG ĂN GÌ?", kicker: "ẨM THỰC CAO NGUYÊN ĐÁ",
      label: "5 MÓN", narration: FOOD_HOOK, durationSec: 8,
      gallery: DISHES.map((d) => IMG(d.gallery[0])), names: DISHES.map((d) => d.caption), tags: DISHES.map((d) => d.tag),
    },
  ];
  DISHES.forEach((d, i) => {
    files.push(...d.gallery);
    scenes.push({
      id: d.id, layout: "point", caption: d.caption, label: `${i + 1}/5`, accent: d.accent,
      narration: d.narration, durationSec: 20, gallery: d.gallery.map(IMG),
      story: {
        number: i + 1, total: 5, tagline: d.tagline,
        sections: [
          { part: "origin", title: SECTION[0], cue: d.cues[0], text: d.origin },
          { part: "made", title: SECTION[1], cue: d.cues[1], text: d.made },
          { part: "eat", title: SECTION[2], cue: d.cues[2], text: d.eat },
          { part: "where", title: SECTION[3], cue: d.cues[3], places: d.places.map((p) => ({ name: p.name, place: p.place, address: p.address, ...(p.rating != null ? { rating: p.rating } : {}) })) },
        ],
      },
    });
  });
  scenes.push({
    id: "outro", layout: "outro", caption: "Bạn chọn món nào?", cta: "Lưu lại cho chuyến đi nhé!",
    narration: FOOD_OUTRO, durationSec: 8, gallery: ["food/34314598", "food/32835478", "food/33621138", "f-thangco-2", "f-tgm-1"].map(IMG),
    names: DISHES.map((d) => d.caption),
  });
  write(slug, { ...base(slug, "Ẩm thực Hà Giang: 5 món"), template: "food", scenes }, files);
}
