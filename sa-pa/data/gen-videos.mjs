// Builds data/videos/<slug>/video.json (+ credits.json) for the three Sa Pa videos
// (Vietnamese only): sa-pa-3n2d, sa-pa-4n3d, sa-pa-am-thuc.
// Story, tips, costs and food picks follow research/tiktok.md, itinerary.md, stay.md, cost.md
// and food.md (Google Maps checked 07/11/2026). Re-running resets durationSec, so run the voice again.
// Run: node data/gen-videos.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const IMG = (f) => (f.includes("/") ? `videos/sa-pa/${f}.jpg` : `videos/sa-pa/candidates/${f}.jpg`);
const allCredits = [
  ...JSON.parse(readFileSync("data/videos/sa-pa/credits.json", "utf8")),
  ...JSON.parse(readFileSync("data/videos/sa-pa/credits-pexels.json", "utf8")),
];

const NARRATOR = { provider: "omnivoice", voice: "vi-nu-tre-03" };

// One place: dish, place, address, Maps rating (null = suggestion without a rating), screenshot key.
const P = (name, place, address, rating, shot) => ({ name, place, address, rating, shot });

const HOA_CUA_NUI = P("Cơm, lẩu", "Hoa Cua Nui", "trong bản Cát Cát", 4.9, "hoa-cua-nui");
const DUNG_THU = P("Cơm bản", "Dũng Thu Cát Cát", "trong bản Cát Cát", 4.7, "dung-thu");
const CHO_TINH = P("Lẩu, cơm", "Chợ Tình Quán", "63D Fansipan", 4.8, "cho-tinh");
const A_PHU = P("Lẩu cá tầm", "Nhà hàng A Phủ", "15 Fansipan", 4.7, "a-phu");
const A_QUYNH = P("Thắng cố", "Thắng cố A Quỳnh", "15 Thạch Sơn", 4.6, "a-quynh");
const HOA_SON_TRA = P("Đồ nướng", "Hoa Sơn Tra", "ngõ 679 Điện Biên Phủ", 4.6, "hoa-son-tra");
const CA_HOI_VUA = P("Cá hồi, cá tầm", "Cá Hồi Vua", "15 Lê Văn Tám", 4.7, "ca-hoi-vua");
const O_QUY_HO = P("Gà ủ bí ngô", "Nhà hàng Ô Quý Hồ", "1 Thạch Sơn", 4.5, "o-quy-ho");
const TUK_TUK = P("Gà đen", "Tiệm Gà Tuk Tuk", "639 Điện Biên Phủ", 4.9, "tuk-tuk");
const VIET_DELI = P("Món Tây Bắc", "Viet Deli", "06 Thủ Dầu Một", 4.7, "viet-deli");
const MAY_QUAN = P("Món Tây Bắc", "Mẩy Quán", "057 Xuân Viên", 4.6, "may-quan");
const TOAN_MAN = P("Cơm bản", "Toàn Mán Restaurant", "bản Tả Van", 4.9, "toan-man");
const TAVAN_RES = P("Cơm bản", "Tả Van Restaurant", "bản Tả Van", 4.9, "tavan-res");
const LUA_CAFE = P("Cà phê, cơm", "Lúa Cafe", "bản Tả Van", 4.7, "lua-cafe");
const SON_RAU = P("Phở gà", "Phở gà Sơn Râu", "19 Đông Lợi", 4.8, "son-rau");
const PHO_HA = P("Phở", "Phở Hà Sapa", "15A Thác Bạc", 4.8, "pho-ha");
const PHO_NGO = P("Phở ngô", "Phở Ngô Góc Nhà Thờ", "sau nhà thờ Đá", 4.9, "pho-ngo");
const LO_CO = P("Cà phê, đồ ăn", "Lô.Cồ Coffee", "bản Lao Chải", 4.9, "lo-co");
const LAOCHAI_VIEW = P("Cà phê", "Lao Chải View", "bản Lao Chải", 4.6, "laochai-view");
const A_NGUYEN = P("Thắng cố", "Thắng Cố A Nguyên 2", "591 Điện Biên Phủ", 4.7, "a-nguyen");
const TRA_PHUONG = P("Lẩu nướng", "Trà Phương Quán", "026 Ngũ Chỉ Sơn", 4.7, "tra-phuong");
const CHAM_QUAN = P("Cơm lam", "Chạm Quán Sapa", "22 Ngũ Chỉ Sơn", 4.8, "cham-quan");
const AM_THUC_MONG = P("Món Mông", "Ẩm Thực Mông", "08 Xuân Viên", 4.6, "am-thuc-mong");
const CA_TAM_VUA = P("Cá tầm", "Nhà hàng Cá Tầm Vua", "trung tâm", 4.7, null);
const SAPA_LIFE = P("Món Việt", "Sapa Life Restaurant", "trung tâm", 4.9, null);
const GINGER = P("Món Việt", "Ginger Sapa", "trung tâm", 4.9, null);
const MUONG_LAY = P("Món Tây Bắc", "Mường Lay Quán", "trung tâm", 4.9, null);
const CA_HOI_VUA2 = P("Cá hồi", "Cá Hồi Vua cs2", "trung tâm", 4.9, null);
const PHO_BAT_DA = P("Phở", "Phở Bát Đá Sapa", "trung tâm", 4.9, null);
const DONG_NHUNG = P("Bánh cuốn, bún chả", "Bánh cuốn Đông Nhung", "trung tâm", 4.8, null);
const THAC_BAC = P("Cá hồi, cá tầm", "Khu thác Bạc", "gợi ý từ VnExpress", null, null);

const sp = (p, spokenAs) => ({ ...p, spokenAs });
const ALL_PLACES = [HOA_CUA_NUI, DUNG_THU, CHO_TINH, A_PHU, A_QUYNH, HOA_SON_TRA, CA_HOI_VUA, O_QUY_HO, TUK_TUK, VIET_DELI, MAY_QUAN, TOAN_MAN, TAVAN_RES, LUA_CAFE, SON_RAU, PHO_HA, PHO_NGO, LO_CO, LAOCHAI_VIEW, A_NGUYEN, TRA_PHUONG, CHAM_QUAN, AM_THUC_MONG];
const MAPS = Object.fromEntries(ALL_PLACES.filter((p) => p.shot).map((p) => [p.place, p.shot]));

const STOPS = {
  catcat: {
    lat: 22.3297, lng: 103.832, accent: "#ffb4a2",
    gallery: ["pexels/36913918", "pexels/36223140", "catcat-02", "catcat-03", "pexels/29180561"],
    label: "Ngày 1 · Sáng", caption: "Bản Cát Cát",
    points: ["Cách trung tâm khoảng 2 km, bản người Mông", "Vé khoảng 150k (theo TikTok)"],
    narration:
      "Xe đêm tới Sa Pa lúc tờ mờ sáng. Ngày một, xuống bản Cát Cát cách trung tâm chừng hai cây số, bản của người Mông với thác nước, nghề dệt và nhuộm chàm. Vé theo review TikTok khoảng một trăm năm mươi nghìn. Trưa ăn ở Hoa Cua Nui ngay trong bản, bốn chấm chín sao.",
    dishes: [sp(HOA_CUA_NUI, "Hoa Cua Nui"), DUNG_THU, CHO_TINH],
    more: [SAPA_LIFE, GINGER],
  },
  city: {
    lat: 22.3361, lng: 103.8433, accent: "#ffd166",
    gallery: ["pexels/18023011", "pexels/33411899", "city-07", "pexels/38220875", "pexels/36074826"],
    label: "Ngày 1 · Tối", caption: "Trung tâm Sa Pa",
    points: ["Nhà thờ Đá khởi công năm 1895", "Dạo hồ Sa Pa, chợ đêm, đồ nướng"],
    narration:
      "Chiều tối dạo trung tâm: nhà thờ Đá khởi công từ năm một nghìn tám trăm chín mươi lăm, hồ Sa Pa và chợ đêm. Bữa tối gọi lẩu cá tầm ở A Phủ, quán TikTok khen nhiều nhất, bốn chấm bảy sao, hoặc thử thắng cố A Quỳnh, rồi ăn đồ nướng ở Hoa Sơn Tra.",
    dishes: [sp(A_PHU, "A Phủ"), A_QUYNH, HOA_SON_TRA],
    more: [VIET_DELI, MAY_QUAN, TRA_PHUONG],
  },
  fansipan: {
    lat: 22.3033, lng: 103.775, accent: "#8ecbff",
    gallery: ["pexels/30172036", "pexels/36561115", "pexels/40026063", "fan-04", "pexels/28600258"],
    label: "Ngày 2 · Sáng", caption: "Đỉnh Fansipan",
    points: ["Cao 3.143 m, đi tàu rồi cáp treo", "Cáp treo khứ hồi khoảng 850k"],
    narration:
      "Ngày hai, lên đỉnh Fansipan cao ba nghìn một trăm bốn mươi ba mét. Đi tàu leo núi Mường Hoa rồi cáp treo, vé cáp treo khứ hồi khoảng tám trăm năm mươi nghìn. Theo TikTok nên đi sớm, mang áo ấm và mua vé online cho rẻ. Về trung tâm ăn ở Cá Hồi Vua, bốn chấm bảy sao.",
    dishes: [sp(CA_HOI_VUA, "Cá Hồi Vua"), O_QUY_HO, TUK_TUK],
    more: [CA_TAM_VUA, CA_HOI_VUA2],
  },
  oquyho: {
    lat: 22.3527, lng: 103.7653, accent: "#ffa94d",
    gallery: ["oqh-02", "oqh-01", "bac-02", "pexels/36340822", "oqh-03"],
    label: "Ngày 2 · Chiều", caption: "Đèo Ô Quy Hồ",
    points: ["Cổng Trời ngắm hoàng hôn 17h–17h30", "Thác Bạc cách đỉnh đèo khoảng 3 km"],
    narration:
      "Chiều chạy lên đèo Ô Quy Hồ nối Lào Cai với Lai Châu, ghé thác Bạc rồi ngắm hoàng hôn ở Cổng Trời khoảng năm giờ chiều. Quanh đèo ít quán đạt bốn sao rưỡi, VnExpress gợi ý ăn cá hồi ở khu thác Bạc, hoặc về trung tâm ăn tối ở Viet Deli, bốn chấm bảy sao.",
    dishes: [sp(THAC_BAC, "VnExpress"), VIET_DELI, MAY_QUAN],
    more: [MUONG_LAY, SAPA_LIFE],
  },
  tavan: {
    lat: 22.302, lng: 103.887, accent: "#7bd389",
    gallery: ["pexels/37225705", "pexels/37668077", "tavan-03", "pexels/40580220", "pexels/37667909"],
    label: "Ngày 3 · Sáng", caption: "Bản Tả Van",
    points: ["Cách trung tâm khoảng 11 km", "Ruộng bậc thang, Cầu Mây, bản Lao Chải"],
    narration:
      "Ngày ba, chạy mười một cây số xuống bản Tả Van trong thung lũng Mường Hoa, đi bộ qua ruộng bậc thang, Cầu Mây và bản Lao Chải. Trưa ăn ở Toàn Mán, bốn chấm chín sao, rồi về trung tâm bắt xe về Hà Nội.",
    dishes: [sp(TOAN_MAN, "Toàn Mán"), TAVAN_RES, LUA_CAFE],
    more: [LO_CO, LAOCHAI_VIEW],
  },
  hamrong: {
    lat: 22.3375, lng: 103.847, accent: "#c3a6ff",
    gallery: ["hr-02", "hr-01", "pexels/34389394", "hr-03"],
    label: "Ngày 3 · Sáng", caption: "Núi Hàm Rồng",
    points: ["Sát trung tâm, vé khoảng 70k", "Nhìn xuống thị trấn và hồ Sa Pa"],
    narration:
      "Ngày ba, ăn sáng ở phở gà Sơn Râu, bốn chấm tám sao, rồi leo núi Hàm Rồng ngay sát trung tâm, vé theo VnExpress khoảng bảy mươi nghìn. Từ trên cao nhìn xuống cả thị trấn và hồ Sa Pa. Chiều trả phòng, xuống bản Tả Van ngủ homestay.",
    dishes: [sp(SON_RAU, "Sơn Râu"), PHO_HA, PHO_NGO],
    more: [PHO_BAT_DA, DONG_NHUNG],
  },
  muonghoa: {
    lat: 22.3126, lng: 103.8786, accent: "#5fd3a8",
    gallery: ["mh-02", "pexels/37724187", "mh-06", "mh-03", "pexels/33908278"],
    label: "Ngày 4 · Sáng", caption: "Thung lũng Mường Hoa",
    points: ["Trek Lao Chải – Tả Van 7–12 km", "Lúa chín cuối tháng 8 – tháng 9"],
    narration:
      "Ngày bốn, dậy sớm đi bộ cung Lao Chải, Tả Van dài bảy tới mười hai cây số, men theo thung lũng Mường Hoa và ruộng bậc thang. Nghỉ chân ở Lô Cồ Coffee trong bản Lao Chải, bốn chấm chín sao, rồi về trung tâm bắt xe về Hà Nội.",
    dishes: [sp(LO_CO, "Lô Cồ"), LAOCHAI_VIEW, TAVAN_RES],
    more: [TOAN_MAN, LUA_CAFE],
  },
};

// 4N3Đ: Tả Van moves to the afternoon of day 3 (night in a homestay).
const FOUR = {
  tavan: {
    label: "Ngày 3 · Chiều",
    points: ["Cách trung tâm khoảng 11 km", "Ngủ homestay giữa ruộng bậc thang"],
    narration:
      "Chiều xuống bản Tả Van cách trung tâm mười một cây số, ngủ homestay giữa ruộng bậc thang như các video TikTok hay gợi ý. Tối ăn cơm bản ở Toàn Mán, bốn chấm chín sao, hoặc Tả Van Restaurant ngay trong bản.",
  },
};

const STAY = {
  caption: "Nên ở đâu?",
  zones: [
    { title: "Trung tâm Sa Pa", note: "Gần nhà thờ Đá, quán ăn, ga tàu lên Fansipan", picks: [["Sapa Centre Hotel", 4.8, "trung tâm"], ["Mega View Homestay", 4.8, "trung tâm"]] },
    { title: "Bản Tả Van", note: "Yên tĩnh, view ruộng; cách 11 km, cần xe", picks: [["Sapa Bamboo Eco", 5.0, "bản Tả Van"], ["MT House", 4.6, "bản Tả Van"]] },
  ],
  tip: "Mùa lúa chín và cuối tuần: đặt sớm",
  narration:
    "Nên ở đâu? Lần đầu đi nên ở trung tâm cho gần quán ăn và ga tàu lên Fansipan, như Sapa Centre Hotel hay Mega View Homestay. Muốn yên tĩnh giữa ruộng bậc thang thì ngủ homestay ở Tả Van, như Sapa Bamboo Eco. Mùa lúa chín và cuối tuần nhớ đặt phòng sớm.",
  cues: ["trung tâm", "tả van", "mùa lúa"],
};

// research/cost.md (prices read 07/11/2026), per person, two people sharing a room and a motorbike.
const COST = {
  "3n2d": {
    items: [
      { k: "Xe Hà Nội ⇄ Sa Pa", note: "giường nằm, cabin · khứ hồi", v: "480–780k" },
      { k: "Phòng 2 đêm", note: "580–720k/đêm, ở 2 người", v: "580–720k" },
      { k: "Thuê xe máy 3 ngày", note: "100–200k/ngày, đi 2 người", v: "150–300k" },
      { k: "Cáp treo Fansipan", note: "khứ hồi", v: "850k" },
      { k: "Vé Cát Cát, Cổng Trời, thác Bạc, Tả Van", v: "320k" },
      { k: "Ăn uống 3 ngày", note: "khoảng 300–450k/ngày", v: "0,9–1,35tr" },
    ],
    total: "3,3–4,3 triệu",
    narration:
      "Hết bao nhiêu tiền? Tính cho một người, đi hai người: xe giường nằm khứ hồi khoảng năm trăm tới tám trăm nghìn, phòng hai đêm sáu, bảy trăm nghìn, cáp treo Fansipan tám trăm năm mươi nghìn. Tổng cộng khoảng ba phẩy ba tới bốn phẩy ba triệu một người.",
  },
  "4n3d": {
    items: [
      { k: "Xe Hà Nội ⇄ Sa Pa", note: "giường nằm, cabin · khứ hồi", v: "480–780k" },
      { k: "Phòng 3 đêm", note: "2 đêm trung tâm + 1 đêm Tả Van", v: "0,88–1,03tr" },
      { k: "Thuê xe máy 4 ngày", note: "100–200k/ngày, đi 2 người", v: "200–400k" },
      { k: "Cáp treo Fansipan", note: "khứ hồi", v: "850k" },
      { k: "Vé Cát Cát, Cổng Trời, thác Bạc, Tả Van, Hàm Rồng", v: "390k" },
      { k: "Ăn uống 4 ngày", note: "khoảng 300–450k/ngày", v: "1,2–1,8tr" },
    ],
    total: "4,0–5,3 triệu",
    narration:
      "Hết bao nhiêu tiền? Tính cho một người, đi hai người: xe giường nằm khứ hồi khoảng năm trăm tới tám trăm nghìn, phòng ba đêm chừng chín trăm nghìn tới một triệu, cáp treo Fansipan tám trăm năm mươi nghìn. Tổng cộng khoảng bốn tới năm phẩy ba triệu một người.",
  },
};

const HOOK = {
  "3n2d": "Sa Pa có đỉnh Fansipan cao ba nghìn một trăm bốn mươi ba mét, có bản làng giữa ruộng bậc thang. Đây là lịch trình ba ngày hai đêm gom từ TikTok, kèm quán ăn từ bốn sao rưỡi và chi phí từng khoản. Lưu lại nhé!",
  "4n3d": "Có bốn ngày? Đi Sa Pa thong thả, từ bản Cát Cát, đỉnh Fansipan, đèo Ô Quy Hồ tới một đêm homestay ở Tả Van. Đây là lịch trình bốn ngày ba đêm gom từ TikTok, kèm chi phí từng khoản. Lưu lại nhé!",
};
const OUTRO =
  "Sa Pa sáng tối se lạnh, mùa đông có hôm chỉ bảy độ, nhớ mang áo khoác dày và giày bám. Địa chỉ quán và bảng chi phí mình để ở phần mô tả. Hẹn gặp ở Sa Pa, lưu lại nhé!";

const credit = (files) => allCredits.filter((c) => files.some((f) => c.file === IMG(f)));

const THEME = { accent: "#8ecbff", highlight: "#ffd166", brand: "SA PA" };

const base = (slug, title) => ({
  id: slug,
  title,
  language: "vi",
  region: "Sa Pa, Lào Cai, Việt Nam",
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
  "3n2d": { stops: ["catcat", "city", "fansipan", "oquyho", "tavan"], hook: ["pexels/31669075", "pexels/37650250", "pexels/36913918", "pexels/30172036"], outro: ["pexels/34782073"], days: 3 },
  "4n3d": { stops: ["catcat", "city", "fansipan", "oquyho", "hamrong", "tavan", "muonghoa"], hook: ["pexels/36561115", "pexels/37724187", "pexels/18023011", "pexels/37225705"], outro: ["pexels/33908278"], days: 4 },
};

for (const [plan, cfg] of Object.entries(PLANS)) {
  const slug = `sa-pa-${plan}`;
  const files = [...cfg.hook, ...cfg.outro];
  const nights = cfg.days - 1;
  const scenes = [
    {
      id: "hook", layout: "hook", caption: "SA PA", kicker: "NÓC NHÀ ĐÔNG DƯƠNG · TỪ TIKTOK",
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
  const stayGallery = ["pexels/33411899", "pexels/37668077"];
  files.push(...stayGallery);
  scenes.push({
    id: "stay", layout: "stay", caption: STAY.caption, accent: "#8ecbff", zones: STAY.zones, tip: STAY.tip,
    cues: STAY.cues, narration: STAY.narration, durationSec: 11, gallery: stayGallery.map(IMG),
  });
  const costGallery = ["pexels/38220859", "pexels/34782076"];
  files.push(...costGallery);
  scenes.push({
    id: "cost", layout: "cost", caption: "Hết bao nhiêu tiền?", kicker: "TRƯỚC KHI ĐI", accent: "#ffd166",
    receiptTitle: `CHI PHÍ ${cfg.days}N${nights}Đ · 1 NGƯỜI`, items: COST[plan].items, total: COST[plan].total,
    stamp: "THAM KHẢO 11/2026", totalCue: "tổng cộng",
    note: "2 người đi chung · nguồn: VnExpress, Google Maps, TikTok",
    narration: COST[plan].narration, durationSec: 12, gallery: costGallery.map(IMG),
  });
  scenes.push({
    id: "outro", layout: "outro", caption: "Hẹn gặp ở Sa Pa", kicker: "LƯU LẠI CHO CHUYẾN ĐI", cta: "Lưu lại nhé!",
    narration: OUTRO, durationSec: 10, gallery: cfg.outro.map(IMG),
  });
  write(slug, { ...base(slug, `Sa Pa ${cfg.days}N${nights}Đ`), scenes }, files);
}

// ---------------------------------------------------------------- food video
const DISHES = [
  {
    id: "thangco", accent: "#ffa94d", gallery: ["f-thangco-1", "food/33921253", "f-thangco-2"],
    caption: "Thắng cố", tagline: "Món của phiên chợ vùng cao", tag: "Món phiên chợ",
    origin: "Món của người Mông, nấu trong chảo lớn ở phiên chợ",
    made: "Thịt ngựa và nội tạng ninh nhiều giờ với thảo quả, quế, hồi",
    eat: "Ăn nóng, chấm muối ớt",
    narration:
      "Món thứ nhất, thắng cố, món của người Mông thường nấu trong chảo lớn ở phiên chợ. Thịt ngựa và nội tạng được ninh nhiều giờ với thảo quả, quế, hồi. Khi ăn, ăn nóng và chấm muối ớt. Quán ngon ở Sa Pa: thắng cố A Quỳnh, và thắng cố A Nguyên.",
    cues: ["người mông", "thịt ngựa", "khi ăn", "quán ngon"],
    places: [A_QUYNH, A_NGUYEN],
  },
  {
    id: "lau", accent: "#8ecbff", gallery: ["food/40747253", "food/17597131", "food/17597151", "food/17597153"],
    caption: "Lẩu cá tầm", tagline: "Cá nuôi vùng nước lạnh", tag: "Cá hồi, cá tầm",
    origin: "Cá hồi, cá tầm nuôi ở vùng nước lạnh Sa Pa",
    made: "Nấu lẩu chua cay, làm gỏi hoặc nướng; nồi lẩu 300–600k cho 3–6 người (VnExpress)",
    eat: "Nhúng cá với rau, ăn kèm bún; set 500k đủ 2 người (TikTok)",
    narration:
      "Món thứ hai, lẩu cá tầm, cá hồi, loại cá nuôi ở vùng nước lạnh Sa Pa. Cá được nấu lẩu chua cay, làm gỏi hoặc nướng, theo VnExpress một nồi lẩu khoảng ba tới sáu trăm nghìn. Khi ăn, nhúng cá với rau và bún. Quán ngon: A Phủ mà TikTok khen nhiều nhất, và Cá Hồi Vua.",
    cues: ["món thứ hai", "nấu lẩu", "khi ăn", "quán ngon"],
    places: [A_PHU, CA_HOI_VUA],
  },
  {
    id: "gaden", accent: "#c3a6ff", gallery: ["food/21938179", "food/30751222", "f-gaden-2"],
    caption: "Gà đen", tagline: "Gà bản da đen, thịt đen", tag: "Gà bản",
    origin: "Gà người Mông, người Dao nuôi thả trên núi; da, thịt đều đen",
    made: "Hầm thuốc bắc, nấu lẩu, hoặc ủ nguyên con trong quả bí đỏ",
    eat: "Gà ủ bí: ăn gà rồi cạo phần bí, húp nước (theo TikTok)",
    narration:
      "Món thứ ba, gà đen, giống gà người Mông, người Dao nuôi thả trên núi, da và thịt đều đen. Gà được hầm thuốc bắc, nấu lẩu, hay ủ nguyên con trong quả bí đỏ. Khi ăn món gà ủ bí, ăn thịt rồi cạo phần bí, húp nước. Quán ngon: Ô Quý Hồ mà TikTok khen, và Tiệm Gà Tuk Tuk.",
    cues: ["người mông", "hầm thuốc", "khi ăn", "quán ngon"],
    places: [O_QUY_HO, TUK_TUK],
  },
  {
    id: "nuong", accent: "#ff8f6b", gallery: ["pexels/34509892", "food/34509894", "f-nuong-1", "food/20782551"],
    caption: "Đồ nướng Sa Pa", tagline: "Ấm bụng tối se lạnh", tag: "Phố nướng",
    origin: "Món ăn tối quen thuộc quanh chợ đêm Sa Pa",
    made: "Xiên thịt, trứng, ngô, khoai nướng trên than hoa",
    eat: "Ngồi quanh bếp than cho ấm; mỗi xiên 20–100k (VnExpress)",
    narration:
      "Món thứ tư, đồ nướng, món ăn tối quen thuộc mỗi khi lên Sa Pa. Xiên thịt, trứng, ngô, khoai được nướng trên than hoa. Khi ăn, ngồi quanh bếp than cho ấm, theo VnExpress mỗi xiên chừng hai mươi tới một trăm nghìn. Quán ngon: Hoa Sơn Tra mà người Sa Pa trên TikTok hay giới thiệu, và Trà Phương Quán.",
    cues: ["món ăn tối", "xiên thịt", "khi ăn", "quán ngon"],
    places: [HOA_SON_TRA, TRA_PHUONG],
  },
  {
    id: "comlam", accent: "#7bd389", gallery: ["pexels/33873817", "food/37060140", "food/38766046", "f-comlam-2"],
    caption: "Cơm lam", tagline: "Gạo nếp nướng trong ống tre", tag: "Ống tre nướng",
    origin: "Món của đồng bào vùng cao, mang theo khi lên nương",
    made: "Gạo nếp cho vào ống tre non, nướng tới khi chín dẻo",
    eat: "Bóc vỏ tre, chấm muối vừng, ăn cùng thịt nướng",
    narration:
      "Món thứ năm, cơm lam, món quen của đồng bào vùng cao khi lên nương. Gạo nếp cho vào ống tre non rồi nướng trên lửa tới khi chín dẻo. Khi ăn, bóc lớp vỏ tre, chấm muối vừng, ăn cùng thịt nướng. Quán ngon: Chạm Quán, và nhà hàng Ẩm Thực Mông.",
    cues: ["đồng bào", "gạo nếp", "khi ăn", "quán ngon"],
    places: [CHAM_QUAN, AM_THUC_MONG],
  },
];

const FOOD_HOOK = "Lên Sa Pa ăn gì? Đây là năm món được nhắc nhiều nhất trên TikTok và báo, kèm cách ăn và quán từ bốn sao rưỡi. Lưu lại nhé!";
const FOOD_OUTRO = "Cốn sủi, phở ngô và cá suối nướng cũng nên thử, quán mình để ở phần mô tả. Bạn chọn món nào trước?";
const SECTION = ["Nguồn gốc", "Cách làm", "Cách ăn", "Quán ngon"];

{
  const slug = "sa-pa-am-thuc";
  const files = [];
  const scenes = [
    {
      id: "hook", layout: "hook", caption: "SA PA ĂN GÌ?", kicker: "ẨM THỰC TÂY BẮC",
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
          { part: "where", title: SECTION[3], cue: d.cues[3], places: d.places.map((p) => ({ name: p.name, place: p.place, address: p.address, rating: p.rating })) },
        ],
      },
    });
  });
  scenes.push({
    id: "outro", layout: "outro", caption: "Bạn chọn món nào?", cta: "Lưu lại cho chuyến đi nhé!",
    narration: FOOD_OUTRO, durationSec: 8, gallery: DISHES.map((d) => IMG(d.gallery[1])),
    names: DISHES.map((d) => d.caption),
  });
  write(slug, { ...base(slug, "Ẩm thực Sa Pa: 5 món"), template: "food", scenes }, files);
}
