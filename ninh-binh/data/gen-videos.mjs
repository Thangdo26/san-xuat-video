// Builds data/videos/<slug>/video.json (+ credits.json) for the three Ninh Bình videos
// (Vietnamese only, no 4N3Đ): ninh-binh-2n1d, ninh-binh-3n2d, ninh-binh-am-thuc.
// Story, tips, costs and food picks follow research/tiktok.md, itinerary.md, stay.md, cost.md
// and food.md (Google Maps checked 09/11/2026). Re-running resets durationSec, so run the voice again.
// Run: node data/gen-videos.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const IMG = (f) => (f.includes("/") ? `videos/ninh-binh/${f}.jpg` : `videos/ninh-binh/candidates/${f}.jpg`);
const allCredits = [
  ...JSON.parse(readFileSync("data/videos/ninh-binh/credits.json", "utf8")),
  ...JSON.parse(readFileSync("data/videos/ninh-binh/credits-pexels.json", "utf8")),
];

const NARRATOR = { provider: "omnivoice", voice: "vi-nu-tre-03" };

// One place: dish, place, address, Maps rating (null = suggestion without a rating), screenshot key.
const P = (name, place, address, rating, shot) => ({ name, place, address, rating, shot });

const CUONG_DE = P("Dê núi", "Nhà hàng Cường Dê", "Tràng An", 4.8, "cuong-de");
const CHEF_DUNG = P("Cơm, món Việt", "Chef Dung Restaurant", "Tây Hoa Lư", 4.9, "chef-dung");
const TA_LOCAL = P("Cơm, món Việt", "Trang An Local", "Trường Yên", 5.0, "trangan-local");
const PHO_XUA = P("Cơm, dê", "Nhà hàng Phố Xưa", "gần bến Tràng An", 4.5, null);
const RIVERSIDE = P("Cơm", "Trang An Riverside garden", "Tràng An", 4.6, null);
const THUY_DUONG = P("Cơm, dê", "Nhà hàng Thùy Dương", "Trường Yên", 4.8, "thuy-duong");
const HA_TU = P("Cơm", "Nhà hàng Hà Tú", "chân cầu Hội", 4.7, "ha-tu");
const GARDEN = P("Cơm, món Việt", "Garden Food & Drink", "Tràng An", 5.0, "garden-food");
const HOALU_QUAN = P("Dê, cơm cháy", "Hoa Lư Quán", "ĐT491, Hoa Lư", 4.7, "hoalu-quan");
const PIZZA_SEN = P("Pizza, view phố cổ", "Pizza Sen Ninh Bình", "01 Trần Hưng Đạo", 4.9, "pizza-sen");
const CHUON_CHUON = P("Cơm quê", "Cơm Chuồn Chuồn Xưa", "ngõ 125 Đô Thiên", 4.8, "chuon-chuon");
const CO_LAU = P("Cơm, món Việt", "Cờ Lau Ninh Bình", "01 Tràng An", 4.8, "co-lau");
const VI_AN = P("Đồ chay, trà", "Vị An Heritage", "phố cổ Hoa Lư", 4.9, null);
const UT_HAN = P("Cơm", "Út Hân Phố Cổ", "phố cổ Hoa Lư", 4.9, null);
const AN_TAMCOC = P("Cơm, món Việt", "An Tam Coc Restaurant", "đường Tam Cốc", 4.8, "an-tamcoc");
const COM_NIEU_TC = P("Cơm niêu", "Cơm Niêu Tam Cốc", "Nam Hoa Lư", 4.9, "com-nieu-tc");
const TC_KITCHEN = P("Cơm, món Việt", "Tam Coc Kitchen", "thôn Tuân Cáo", 4.8, "tamcoc-kitchen");
const TC_VINTAGE = P("Cơm", "Tam Coc Vintage", "Tam Cốc", 4.9, null);
const HA_NGAN = P("Bún chả quạt", "Hà Ngân Tam Cốc", "Tam Cốc", 4.9, null);
const DUC_DAN = P("Cơm, dê", "Nhà hàng Đức Dẫn", "cạnh Tam Cốc", 4.8, "duc-dan");
const MONALISA = P("Cơm, đồ Tây", "Monalisa Restaurant", "Hang Múa", 4.7, "monalisa");
const FAMILY_GARDEN = P("Cơm, đồ uống", "The Family Garden", "Khê Hạ", 5.0, "family-garden");
const FATHER = P("Cơm", "Father Cooking", "Tam Cốc", 4.5, null);
const HAVEN = P("Cơm", "Haven Hang Mua", "Hang Múa", 5.0, null);
const VIET_XUA = P("Cơm niêu", "Cơm Niêu Việt Xưa", "Bái Đính", 4.8, "viet-xua-bd");
const VIETS_CHOICE = P("Cơm, mì", "Viet's Choice", "xóm 4, Tây Hoa Lư", 4.8, "viets-choice");
const BANHMI_1998 = P("Bánh mì, cơm", "Bánh Mì 1998", "Bái Đính", 4.9, "banhmi-1998");
const KHANH_LINH = P("Cơm", "Khánh Linh Restaurant", "Gia Sinh", 4.9, null);
const LAM_DE = P("Dê", "Nhà hàng Lâm Dê", "Gia Sinh", 4.6, null);
const NAM_DE = P("Dê núi", "Nhà hàng Năm Dê", "ĐT491, Hoa Lư", 4.7, "nam-de");
const HOANG_PHUONG = P("Dê núi", "Dê Hoàng Phương 2", "253 Lê Thái Tổ", 4.6, "hoang-phuong");
const SEN_TA = P("Dê, cơm cháy", "Nhà hàng Sen Tràng An", "62 Phạm Văn Nghị", 4.9, "sen-trangan");
const BC_35 = P("Bánh cuốn chả quạt", "Bánh cuốn chả quạt 35", "206 Lê Thái Tổ", 4.9, "bc-35");
const LY_TUYEN = P("Bánh cuốn Phủ Lý", "Bánh cuốn Lý Tuyên", "386 Trần Hưng Đạo, Phủ Lý", 4.5, "ly-tuyen");
const LEO_QUAN = P("Bánh cuốn Phủ Lý", "Leo Quán cơ sở 3", "142 Lê Công Thanh, Phủ Lý", 4.8, "leo-quan");
const CHA_CO_DO = P("Bún chả quạt", "Bún chả quạt Cố Đô", "502 Hải Thượng Lãn Ông", 4.9, "cha-co-do");
const NGO5 = P("Bún chả quạt", "Bún chả quạt Ngõ 5", "283 Xuân Thành", 4.9, "ngo5");
const CHUNG_AN = P("Bún chả quạt", "Bún chả Chung An", "ngõ 9 Phạm Hồng Thái", 4.6, "chung-an");
const YEN_MAC = P("Nem chua", "Làng Yên Mạc, Yên Mô", "theo VnExpress", null, null);

const sp = (p, spokenAs) => ({ ...p, spokenAs });
const ALL_PLACES = [CUONG_DE, CHEF_DUNG, TA_LOCAL, THUY_DUONG, HA_TU, GARDEN, HOALU_QUAN, PIZZA_SEN, CHUON_CHUON, CO_LAU, AN_TAMCOC, COM_NIEU_TC, TC_KITCHEN, DUC_DAN, MONALISA, FAMILY_GARDEN, VIET_XUA, VIETS_CHOICE, BANHMI_1998, NAM_DE, HOANG_PHUONG, SEN_TA, BC_35, LY_TUYEN, LEO_QUAN, CHA_CO_DO, NGO5, CHUNG_AN];
const MAPS = Object.fromEntries(ALL_PLACES.filter((p) => p.shot).map((p) => [p.place, p.shot]));

// Narration never names the day, so 2N1Đ and 3N2Đ share the voice clips of the same stop.
const STOPS = {
  trangan: {
    lat: 20.2536, lng: 105.9142, accent: "#2bb39a",
    gallery: ["pexels/38245597", "pexels/34997380", "pexels/38093155", "pexels/29819078", "pexels/38017051"],
    caption: "Tràng An",
    points: ["Vé 300k, đã gồm thuyền", "Đi sớm 7h, mua vé online"],
    narration:
      "Đi Tràng An thật sớm, khoảng bảy giờ cho mát. Vé ba trăm nghìn đã gồm thuyền, ngồi chừng hai tiếng rưỡi tới ba tiếng, xuyên qua những hang đá và thủy đình giữa núi. Trưa ăn dê núi ở nhà hàng Cường Dê, bốn chấm tám sao.",
    dishes: [sp(CUONG_DE, "Cường Dê"), CHEF_DUNG, TA_LOCAL],
    more: [PHO_XUA, RIVERSIDE],
  },
  codo: {
    lat: 20.2846, lng: 105.9051, accent: "#e0a458",
    gallery: ["pexels/5250727", "cd-3", "cd-2", "pexels/37324360", "cd-5"],
    caption: "Cố đô Hoa Lư",
    points: ["Kinh đô Đại Cồ Việt 968–1010", "Vé 20k, đền vua Đinh, vua Lê"],
    narration:
      "Ghé cố đô Hoa Lư, kinh đô của nước Đại Cồ Việt từ năm chín trăm sáu mươi tám tới năm một nghìn không trăm mười. Vé hai mươi nghìn, thăm đền vua Đinh và đền vua Lê. Gần đó có nhà hàng Thùy Dương, bốn chấm tám sao.",
    dishes: [sp(THUY_DUONG, "Thùy Dương"), HA_TU, GARDEN],
    more: [CHEF_DUNG, HOALU_QUAN],
  },
  phoco: {
    lat: 20.264, lng: 105.9675, accent: "#f08aa8",
    gallery: ["pexels/31003644", "pexels/40580502", "pexels/38093157", "pexels/38093154", "pexels/38093098"],
    caption: "Phố cổ Hoa Lư",
    points: ["Vào cửa miễn phí", "Đông vui nhất 19h30–22h"],
    narration:
      "Tối ra phố cổ Hoa Lư dưới chân núi Kỳ Lân, vào cửa miễn phí, đông vui nhất từ bảy rưỡi tới mười giờ tối. Ăn pizza sen ngắm phố lên đèn, bốn chấm chín sao với gần năm nghìn lượt đánh giá, hoặc cơm quê ở Chuồn Chuồn Xưa.",
    dishes: [sp(PIZZA_SEN, "pizza sen"), CHUON_CHUON, CO_LAU],
    more: [VI_AN, UT_HAN],
  },
  tamcoc: {
    lat: 20.216, lng: 105.9326, accent: "#f5c26b",
    gallery: ["pexels/6531912", "pexels/19757775", "pexels/30564720", "pexels/37715574", "pexels/3000978"],
    caption: "Tam Cốc – Bích Động",
    points: ["Vé 120k + đò 150k/chuyến", "Hoa súng nở trước 9h"],
    narration:
      "Đi Tam Cốc trước chín giờ, khi hoa súng còn nở. Đò đi qua ba hang giữa đồng lúa, cuối tháng năm là mùa lúa vàng. Vé thắng cảnh một trăm hai mươi nghìn, đò một trăm năm mươi nghìn một chuyến. Ăn ở An Tam Cốc, bốn chấm tám sao.",
    dishes: [sp(AN_TAMCOC, "An Tam Cốc"), COM_NIEU_TC, TC_KITCHEN],
    more: [TC_VINTAGE, HA_NGAN],
  },
  hangmua: {
    lat: 20.2287, lng: 105.9352, accent: "#ff8a5c",
    gallery: ["pexels/29874550", "pexels/38236281", "pexels/39054237", "pexels/8775540", "pexels/37273050"],
    caption: "Hang Múa",
    points: ["Gần 500 bậc đá lên đỉnh", "Vé 150k, đẹp lúc hoàng hôn"],
    narration:
      "Leo Hang Múa, gần năm trăm bậc đá lên đỉnh Ngọa Long có tượng rồng, ngắm đồng lúa Tam Cốc lúc hoàng hôn. Vé một trăm năm mươi nghìn từ tháng tư năm nay. Xuống núi ăn ở nhà hàng Đức Dẫn, bốn chấm tám sao.",
    dishes: [sp(DUC_DAN, "Đức Dẫn"), MONALISA, FAMILY_GARDEN],
    more: [FATHER, HAVEN],
  },
  baidinh: {
    lat: 20.2741, lng: 105.8645, accent: "#c3a6ff",
    gallery: ["pexels/38093095", "pexels/38093144", "pexels/28505160", "pexels/40881163", "pexels/14281265"],
    caption: "Chùa Bái Đính",
    points: ["Chùa không bán vé", "Xe điện 30k một chiều"],
    narration:
      "Ngày cuối, lên chùa Bái Đính, quần thể chùa rộng lớn giữa núi. Chùa không bán vé, xe điện ba mươi nghìn một chiều. Ăn trưa ở Cơm Niêu Việt Xưa ngay gần chùa, bốn chấm tám sao, rồi về Hà Nội.",
    dishes: [sp(VIET_XUA, "Việt Xưa"), VIETS_CHOICE, BANHMI_1998],
    more: [KHANH_LINH, LAM_DE],
  },
};

const STAY = {
  caption: "Nên ở đâu?",
  zones: [
    { title: "Quanh phố cổ Hoa Lư", note: "Tối đi bộ ra phố cổ, nhiều quán ăn", picks: [["Hoa Lu City Hotel", 4.9, "TP Ninh Bình"], ["OLong Phố cổ Hotel", 4.9, "phố cổ"]] },
    { title: "Tam Cốc", note: "Yên tĩnh, đồng lúa, gần Hang Múa", picks: [["Tam Coc Minh Hung Homestay", 4.8, "Tam Cốc"], ["Tamcoc Tropical Homestay", 4.9, "Tam Cốc"]] },
    { title: "Ven sông Tràng An", note: "Sáng ra bến sớm; xa phố cổ", picks: [["Trang An Hana Homestay", 5.0, "Tràng An"], ["Trang An Luxury Homestay", 5.0, "Tràng An"]] },
  ],
  tip: "Homestay thường nhận phòng lúc 14h",
  narration:
    "Nên ở đâu? Ở quanh phố cổ Hoa Lư cho tối tiện đi chơi, như Hoa Lư City Hotel, bốn chấm chín sao. Thích yên tĩnh thì ở homestay Tam Cốc gần Hang Múa, hoặc ven sông Tràng An để sáng ra bến sớm. Nhớ hỏi giờ nhận phòng, thường là hai giờ chiều.",
  cues: ["phố cổ", "tam cốc", "ven sông", "nhận phòng"],
};

// research/cost.md (prices read 09/11/2026), per person, two people sharing a room and a motorbike.
const COST = {
  "2n1d": {
    items: [
      { k: "Xe Hà Nội ⇄ Ninh Bình", note: "limousine, xe khách · khứ hồi", v: "300–500k" },
      { k: "Phòng 1 đêm", note: "homestay, khách sạn · ở 2 người", v: "180–350k" },
      { k: "Thuê xe máy 2 ngày", note: "120–180k/ngày · đi 2 người", v: "120–180k" },
      { k: "Xăng", v: "~50k" },
      { k: "Vé Tràng An, Hang Múa, Tam Cốc", note: "300k + 150k + 195–250k", v: "645–700k" },
      { k: "Ăn uống 2 ngày", note: "theo TikTok và MIA.vn", v: "400–600k" },
    ],
    total: "1,7–2,4 triệu",
    narration:
      "Hết bao nhiêu tiền? Tính cho một người, đi hai người: xe limousine khứ hồi khoảng ba tới năm trăm nghìn, vé Tràng An ba trăm nghìn, Hang Múa một trăm năm mươi nghìn. Tổng cộng khoảng một phẩy bảy tới hai phẩy bốn triệu một người.",
  },
  "3n2d": {
    items: [
      { k: "Xe Hà Nội ⇄ Ninh Bình", note: "limousine, xe khách · khứ hồi", v: "300–500k" },
      { k: "Phòng 2 đêm", note: "homestay, khách sạn · ở 2 người", v: "360–700k" },
      { k: "Thuê xe máy 3 ngày", note: "120–180k/ngày · đi 2 người", v: "180–270k" },
      { k: "Xăng", v: "~70k" },
      { k: "Vé Tràng An, Hang Múa, Tam Cốc", note: "300k + 150k + 195–250k", v: "645–700k" },
      { k: "Cố đô Hoa Lư, xe điện Bái Đính", note: "20k + 2 chiều × 30k", v: "80k" },
      { k: "Ăn uống 3 ngày", note: "theo TikTok và MIA.vn", v: "600–900k" },
    ],
    total: "2,2–3,2 triệu",
    narration:
      "Hết bao nhiêu tiền? Tính cho một người, đi hai người: xe limousine khứ hồi khoảng ba tới năm trăm nghìn, phòng hai đêm bốn tới bảy trăm nghìn, vé Tràng An, Hang Múa và Tam Cốc khoảng bảy trăm nghìn. Tổng cộng khoảng hai phẩy hai tới ba phẩy hai triệu một người.",
  },
};

const HOOK = {
  "2n1d": "Có hai ngày rảnh? Về Ninh Bình, chỉ cách Hà Nội chừng hai tiếng. Đây là lịch trình hai ngày một đêm gom từ TikTok: Tràng An, Hang Múa, phố cổ Hoa Lư và Tam Cốc, kèm quán từ bốn sao rưỡi và chi phí từng khoản. Lưu lại nhé!",
  "3n2d": "Ninh Bình có Tràng An, di sản thế giới kép được UNESCO ghi danh, có Tam Cốc, Hang Múa và cố đô Hoa Lư. Đây là lịch trình ba ngày hai đêm gom từ TikTok, kèm quán từ bốn sao rưỡi và chi phí từng khoản. Lưu lại nhé!",
};
const OUTRO =
  "Đi Ninh Bình nhớ xem dự báo thời tiết, mưa lớn Tràng An có thể tạm dừng đò, và chuẩn bị chút tiền tip cho cô lái đò. Địa chỉ quán và bảng chi phí mình để ở phần mô tả. Lưu lại nhé!";

const credit = (files) => allCredits.filter((c) => files.some((f) => c.file === IMG(f)));

const THEME = { accent: "#2bb39a", highlight: "#f5c26b", brand: "NINH BÌNH" };

const base = (slug, title) => ({
  id: slug,
  title,
  language: "vi",
  region: "Ninh Bình, Việt Nam",
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
  "2n1d": {
    stops: [["trangan", "Ngày 1 · Sáng"], ["hangmua", "Ngày 1 · Chiều"], ["phoco", "Ngày 1 · Tối"], ["tamcoc", "Ngày 2 · Sáng"]],
    hook: ["pexels/36703376", "pexels/38295436", "pexels/31003644", "pexels/37457669"], outro: ["pexels/27356559"], days: 2,
  },
  "3n2d": {
    stops: [["trangan", "Ngày 1 · Sáng"], ["codo", "Ngày 1 · Chiều"], ["phoco", "Ngày 1 · Tối"], ["tamcoc", "Ngày 2 · Sáng"], ["hangmua", "Ngày 2 · Chiều"], ["baidinh", "Ngày 3 · Sáng"]],
    hook: ["pexels/38336567", "pexels/36640790", "pexels/38093106", "pexels/13878582"], outro: ["pexels/37457669"], days: 3,
  },
};

for (const [plan, cfg] of Object.entries(PLANS)) {
  const slug = `ninh-binh-${plan}`;
  const files = [...cfg.hook, ...cfg.outro];
  const nights = cfg.days - 1;
  const scenes = [
    {
      id: "hook", layout: "hook", caption: "NINH BÌNH", kicker: "CỐ ĐÔ & NON NƯỚC · TỪ TIKTOK",
      label: `${cfg.days}N${nights}Đ`, narration: HOOK[plan], durationSec: 10, gallery: cfg.hook.map(IMG),
    },
  ];
  for (const [id, label] of cfg.stops) {
    const s = STOPS[id];
    files.push(...s.gallery);
    scenes.push({
      id, layout: "point", caption: s.caption, label, accent: s.accent, points: s.points,
      narration: s.narration, durationSec: 13, gallery: s.gallery.map(IMG), geo: { lat: s.lat, lng: s.lng },
      dishes: s.dishes.map((d) => ({ name: d.name, place: d.place, address: d.address, ...(d.rating != null ? { rating: d.rating } : {}), ...(d.spokenAs ? { spokenAs: d.spokenAs } : {}) })),
      moreDishes: s.more.map((d) => ({ name: d.name, place: d.place, address: d.address, rating: d.rating })),
    });
  }
  const stayGallery = ["pexels/31188623", "pexels/37859904", "pexels/31188624"];
  files.push(...stayGallery);
  scenes.push({
    id: "stay", layout: "stay", caption: STAY.caption, accent: "#2bb39a", zones: STAY.zones, tip: STAY.tip,
    cues: STAY.cues, narration: STAY.narration, durationSec: 11, gallery: stayGallery.map(IMG),
  });
  const costGallery = ["pexels/38295550", "pexels/17574200"];
  files.push(...costGallery);
  scenes.push({
    id: "cost", layout: "cost", caption: "Hết bao nhiêu tiền?", kicker: "TRƯỚC KHI ĐI", accent: "#f5c26b",
    receiptTitle: `CHI PHÍ ${cfg.days}N${nights}Đ · 1 NGƯỜI`, items: COST[plan].items, total: COST[plan].total,
    stamp: "THAM KHẢO 11/2026", totalCue: "tổng cộng",
    note: "2 người đi chung · nguồn: VnExpress, Znews, MIA.vn, TikTok",
    narration: COST[plan].narration, durationSec: 12, gallery: costGallery.map(IMG),
  });
  scenes.push({
    id: "outro", layout: "outro", caption: "Hẹn gặp ở Ninh Bình", kicker: "LƯU LẠI CHO CHUYẾN ĐI", cta: "Lưu lại nhé!",
    narration: OUTRO, durationSec: 10, gallery: cfg.outro.map(IMG),
    credits: cfg.stops.map(([id, label]) => [label, STOPS[id].caption]),
  });
  write(slug, { ...base(slug, `Ninh Bình ${cfg.days}N${nights}Đ`), scenes }, files);
}

// ---------------------------------------------------------------- food video
const DISHES = [
  {
    id: "de", accent: "#e0a458", gallery: ["f-de-2", "food/28273396", "f-de-1", "f-cc-2", "f-de-6"],
    caption: "Dê núi", tagline: "Dê thả trên núi đá", tag: "Dê tái chanh",
    origin: "Dê thả trên núi đá, đi lại nhiều nên thịt chắc, thơm (VnExpress)",
    made: "Dê tái chanh: hấp sả tới tái, thái mỏng, trộn chanh, gừng, sả, vừng",
    eat: "Cuốn lá sung, rau thơm, khế, chuối xanh; chấm tương",
    narration:
      "Món thứ nhất, dê núi. Dê ở đây được thả trên núi đá, đi lại nhiều nên thịt chắc và thơm. Món nổi nhất là dê tái chanh: thịt hấp sả tới tái, thái mỏng, trộn chanh, gừng, sả và vừng. Khi ăn, cuốn với lá sung, rau thơm, chấm tương. Quán ngon: Cường Dê, bốn chấm tám sao, và Năm Dê.",
    cues: ["núi đá", "tái chanh", "khi ăn", "quán ngon"],
    places: [CUONG_DE, NAM_DE, HOANG_PHUONG],
  },
  {
    id: "comchay", accent: "#f5c26b", gallery: ["f-cc-1", "f-cc-3", "f-cc-5", "f-cc-4"],
    caption: "Cơm cháy", tagline: "Giòn rụm, đi cặp với dê", tag: "Sốt nóng rưới lên",
    origin: "Đặc sản nổi tiếng từ lâu của Ninh Bình; nguồn gốc chưa rõ",
    made: "Lớp cơm sát đáy nồi gang giữ lửa cho cháy mỏng, phơi khô, chiên giòn",
    eat: "Rưới sốt nóng lên cho xèo xèo, hoặc chấm sốt dê (VnExpress)",
    narration:
      "Món thứ hai, cơm cháy, thường đi cặp với dê núi, nổi tiếng từ lâu nhưng nguồn gốc chưa rõ. Lớp cơm sát đáy nồi gang được giữ lửa cho cháy mỏng, phơi khô rồi chiên giòn. Khi ăn, rưới nước sốt nóng lên cho xèo xèo, hoặc chấm sốt dê. Quán ngon: Hoa Lư Quán, bốn chấm bảy sao, và nhà hàng Sen Tràng An.",
    cues: ["món thứ hai", "đáy nồi", "khi ăn", "quán ngon"],
    places: [HOALU_QUAN, SEN_TA],
  },
  {
    id: "nem", accent: "#f08aa8", gallery: ["f-nem-1", "f-nem-2", "f-nem-3", "f-nem-4"],
    caption: "Nem chua Yên Mạc", tagline: "Đặc sản làng Yên Mạc", tag: "Gói lá ổi",
    origin: "Đặc sản làng Yên Mạc, Yên Mô; khác nem chua Thanh Hóa (VnExpress)",
    made: "Thịt nạc mông lọc mỡ, bì lợn, thính; gói lá ổi, bọc lá chuối",
    eat: "Chấm nước mắm chanh tỏi",
    narration:
      "Món thứ ba, nem chua Yên Mạc, đặc sản làng Yên Mạc ở Yên Mô. Thịt nạc mông lọc mỡ, trộn bì lợn và thính, gói lá ổi rồi bọc lá chuối, ủ cho chua. Khi ăn, chấm nước mắm chanh tỏi. Quán ngon thì chưa có cửa hàng nào đủ đánh giá, nên mua ngay ở làng Yên Mạc.",
    cues: ["món thứ ba", "nạc mông", "khi ăn", "quán ngon"],
    places: [YEN_MAC],
  },
  {
    id: "banhcuon", accent: "#7fc8a9", gallery: ["food/34314598", "f-bc-1", "f-bc-3", "f-bc-2"],
    caption: "Bánh cuốn Phủ Lý", tagline: "Từ Hà Nam cũ, nay cùng tỉnh", tag: "Chả nướng than",
    origin: "Từ Phủ Lý, Hà Nam cũ, nay thuộc tỉnh Ninh Bình (MIA.vn)",
    made: "Bột gạo tráng mỏng vừa, rắc hành phi, chút mỡ; thường không có nhân",
    eat: "Ăn kèm chả thịt nướng than hoa, nước chấm chua cay, dưa góp",
    narration:
      "Món thứ tư, bánh cuốn Phủ Lý, từ Hà Nam cũ, nay cùng tỉnh Ninh Bình. Bánh tráng từ bột gạo, rắc hành phi và chút mỡ, thường không có nhân. Khi ăn, kèm chả thịt nướng than hoa, chấm nước chua cay có dưa góp. Quán ngon: Lý Tuyên ở Phủ Lý, và quán ba mươi lăm ở thành phố Ninh Bình, bốn chấm chín sao.",
    cues: ["hà nam", "hành phi", "khi ăn", "quán ngon"],
    places: [LY_TUYEN, LEO_QUAN, BC_35],
  },
  {
    id: "buncha", accent: "#ff8a5c", gallery: ["food/3858270", "food/36868235", "food/34888273", "food/34888274"],
    caption: "Bún chả quạt", tagline: "Chả nướng, quạt tay", tag: "Thịt băm vo viên",
    origin: "Khác Hà Nội: chả làm từ thịt băm vo viên hoặc miếng vuông (MIA.vn)",
    made: "Kẹp vỉ nướng trên than hồng, quạt đều tay cho chả mềm, thơm",
    eat: "Bún lá cắt miếng; chấm nước mắm chua ngọt, đu đủ xanh, rau sống",
    narration:
      "Món thứ năm, bún chả quạt. Khác Hà Nội, chả ở đây làm từ thịt băm vo viên hoặc miếng vuông, kẹp vỉ nướng trên than hồng, quạt đều tay. Khi ăn, dùng bún lá, chấm nước mắm chua ngọt với đu đủ xanh. Quán ngon: bún chả quạt Cố Đô, bốn chấm chín sao, và Ngõ Năm.",
    cues: ["món thứ năm", "than hồng", "khi ăn", "quán ngon"],
    places: [CHA_CO_DO, NGO5, CHUNG_AN],
  },
];

const FOOD_HOOK = "Về Ninh Bình ăn gì? Đây là năm món được nhắc nhiều nhất trên TikTok và báo, từ dê núi, cơm cháy tới bún chả quạt, kèm cách ăn và quán từ bốn sao rưỡi. Lưu lại nhé!";
const FOOD_OUTRO = "Gỏi cá nhệch Kim Sơn, miến lươn và kem xôi cũng nên thử, mình để ở phần mô tả. Bạn chọn món nào trước?";
const SECTION = ["Nguồn gốc", "Cách làm", "Cách ăn", "Quán ngon"];

{
  const slug = "ninh-binh-am-thuc";
  const files = [];
  const scenes = [
    {
      id: "hook", layout: "hook", caption: "NINH BÌNH ĂN GÌ?", kicker: "ẨM THỰC ĐẤT CỐ ĐÔ",
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
  const outroGallery = ["f-de-2", "f-cc-1", "f-nem-1", "food/34314598", "food/3858270"];
  files.push(...outroGallery);
  scenes.push({
    id: "outro", layout: "outro", caption: "Bạn chọn món nào?", cta: "Lưu lại cho chuyến đi nhé!",
    narration: FOOD_OUTRO, durationSec: 8, gallery: outroGallery.map(IMG),
    names: DISHES.map((d) => d.caption),
  });
  write(slug, { ...base(slug, "Ẩm thực Ninh Bình: 5 món"), template: "food", scenes }, files);
}
