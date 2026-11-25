// Builds the four Nha Trang video.json files (VI/EN × 3N2Đ/4N3Đ) from one
// scene list, so shared facts (stops, restaurants, ratings) stay in sync.
// Run: node data/gen-videos.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const IMG = "videos/nha-trang-4n3d/images/";
const img = (name) => IMG + name + ".jpg";

const map = {
  plate: "videos/nha-trang-4n3d/map/region.jpg",
  style: "https://tiles.openfreemap.org/styles/fiord",
  center: [109.215, 12.385],
  zoom: 11,
  width: 1600,
  height: 1600,
  attribution: "© OpenMapTiles © OpenStreetMap",
};
const flightMap = {
  plate: "videos/nha-trang-4n3d/map/vietnam.jpg",
  style: "https://tiles.openfreemap.org/styles/fiord",
  center: [107.4, 15.3],
  zoom: 5.9,
  width: 1080,
  height: 1920,
  attribution: "© OpenMapTiles © OpenStreetMap",
};

const STOP = {
  ponagar: { vi: "Tháp Bà Ponagar", en: "Po Nagar towers", lng: 109.1952, lat: 12.2654 },
  honchong: { vi: "Hòn Chồng", en: "Hon Chong rocks", lng: 109.2066, lat: 12.2728 },
  longson: { vi: "Chùa Long Sơn", en: "Long Son pagoda", lng: 109.1806, lat: 12.2513 },
  nhatho: { vi: "Nhà thờ Núi", en: "Stone cathedral", lng: 109.1881, lat: 12.2467 },
  cauda: { vi: "Cảng Cầu Đá", en: "Cau Da pier", lng: 109.2149, lat: 12.2066 },
  hontam: { vi: "Hòn Tằm", en: "Hon Tam", lng: 109.2447, lat: 12.1747 },
  honmun: { vi: "Hòn Mun", en: "Hon Mun", lng: 109.3049, lat: 12.1667 },
  chodam: { vi: "Chợ Đầm", en: "Dam market", lng: 109.1917, lat: 12.2553 },
  vien: { vi: "Viện Hải dương học", en: "Oceanographic museum", lng: 109.2139, lat: 12.208 },
};
const route = (lang, ...keys) =>
  keys.map((k) => ({ name: STOP[k][lang], lng: STOP[k].lng, lat: STOP[k].lat }));

// name/place/address stay Vietnamese on screen in both languages; `en`
// replaces the dish name for the English version.
const D = (name, en, place, address, rating, spokenVi, spokenEn) => ({
  name, en, place, address, rating, spokenVi, spokenEn,
});
const dish = (lang, d) => {
  const out = { name: lang === "en" ? d.en : d.name, place: d.place, address: d.address };
  const spoken = lang === "en" ? d.spokenEn : d.spokenVi;
  if (spoken) out.spokenAs = spoken;
  if (d.rating) out.rating = d.rating;
  return out;
};

const FOOD = {
  ponagar: [
    D("Hải sản", "Seafood", "Xuân Trà", "27 Tháp Bà", 4.9, "xuân trà", "xuan tra"),
    D("Bún cá", "Fish noodle soup", "Bún Cá Tháp Bà", "19 Hồ Tùng Mậu", 4.7, "bún cá tháp bà", "fish noodle"),
    D("Bánh canh tôm tít", "Mantis shrimp noodles", "Bếp Nhà 61", "61 Tháp Bà", 4.7, "bếp nhà", "mantis shrimp"),
  ],
  ponagarMore: [
    D("Kem flan", "Flan & ice cream", "Kem Flan Cô Giỏi", "17 Tháp Bà, Nha Trang", 4.5),
    D("Hải sản địa phương", "Local seafood", "Hải sản Viên Hồ", "33 Cù Huân, Nha Trang", 4.5),
    D("Hải sản", "Seafood", "Nhà Hàng Hải Sản Hằng 66", "46 Cù Huân, Nha Trang", 4.5),
    D("Hải sản tươi sống", "Fresh seafood", "Quán Bờ Biển", "8 Phạm Văn Đồng, Nha Trang", 4.5),
  ],
  center: [
    D("Bánh canh ghẹ", "Crab noodle soup", "Cô Ba Miền Biển", "5 Thái Nguyên", 4.7, "bánh canh ghẹ", "crab noodle"),
    D("Cơm gà xối mắm", "Chicken rice", "B-Food", "04 Núi Một", 4.8, "cơm gà", "chicken rice"),
    D("Nem nướng Ninh Hòa", "Grilled pork rolls", "Nem Bà Mười", "7A Bạch Đằng", 4.8, "nem nướng bà mười", "grilled pork"),
  ],
  centerMore: [
    D("Bánh căn", "Banh can", "Bánh Căn Cô Ly", "186 Thống Nhất, Nha Trang", 4.9),
    D("Bún cá", "Fish noodle soup", "Bún Cá Nha Trang 79", "15 Nguyễn Chánh, Nha Trang", 4.7),
    D("Bánh canh tôm hùm", "Lobster noodle soup", "Quán Nhỏ", "8B Đường 12A, Nha Trang", 4.9),
    D("Nem nướng", "Grilled pork rolls", "Nem Nướng Hồng Vũ", "89 Nhị Hà, Nha Trang", 4.9),
  ],
  night: [
    D("Hải sản", "Seafood", "Đông Hải", "24 Tô Hiến Thành", 4.9, "đông hải", "dong hai"),
    D("Hải sản", "Seafood", "JJ Seafood", "20 Nguyễn Thiện Thuật", 4.7, "jj seafood", "jj seafood"),
    D("Ốc các loại", "Sea snails", "Ốc Làng Biển", "48 Nguyễn Thiện Thuật", 4.8, "ốc ngon làng biển", "snails"),
  ],
  nightMore: [
    D("Hải sản", "Seafood", "Nhà Hàng Hải Sản Phố Việt", "69 Trần Quang Khải, Nha Trang", 4.8),
    D("Ốc, hải sản", "Snails & seafood", "Quán Ốc Ngon Nha Trang", "48 Nguyễn Thiện Thuật, Nha Trang", 4.6),
    D("Chè Thái", "Thai-style sweet soup", "Chè Thái WanWan", "98 Hồng Bàng, Nha Trang", 4.7),
    D("Bánh căn, bánh xèo", "Banh can & banh xeo", "Hai Phượng - Yến", "46/27 Hùng Vương, Nha Trang", 4.6),
  ],
  dao: [
    D("Hải sản", "Seafood", "Hà Linh", "34 Trần Phú", 4.8, "hà linh", "ha linh"),
    D("Hải sản", "Seafood", "Thanh An", "11A Trần Phú", 4.8, "thanh an", "thanh an"),
    D("Gỏi ốc", "Snail salad", "Gỏi Ốc Cửa Bé", "350 Võ Thị Sáu", 4.6, "gỏi ốc cửa bé", "snail salad"),
  ],
  daoMore: [
    D("Hải sản", "Seafood", "Quán Hải Sản Ty Rô", "5A Tô Hiệu, Nha Trang", 4.5),
    D("Hải sản trên bè", "Floating seafood raft", "Bè Hải sản Sơn Khánh", "gần cảng Cầu Đá", 5.0),
    D("Cá nóc nhím", "Porcupine fish", "Quán Long Ka", "Võ Thị Sáu, Nha Trang", 4.5),
  ],
  chodam: [
    D("Bánh căn", "Banh can", "Bánh Căn Số 8", "08 Phan Đình Phùng", 4.8, "bánh căn số tám", "number eight"),
    D("Bún cá lá Ninh Hòa", "Ninh Hoa fish noodles", "Quán 24", "19 Phan Đình Phùng", 4.8, "bún cá", "fish noodle"),
    D("Bánh căn", "Banh can", "Út Liên", "977 Đường 2/4", 4.9, "út liên", "ut lien"),
  ],
  chodamMore: [
    D("Quán ăn", "Local eatery", "Quán ăn Xuân Thu", "13 Nguyễn Thái Học, Nha Trang", 4.9),
    D("Phở khô", "Dry pho", "Phở Khô Hưng Huỳnh", "51 Hoàng Hoa Thám, Nha Trang", 4.8),
    D("Bánh canh, bún cá", "Noodle soups", "Cô Ba An", "03 Hai Bà Trưng, Nha Trang", 4.7),
    D("Bún thịt nướng, nem", "Grilled pork noodles", "Nem Ninh Hoà Cô Phước", "24B Đoàn Thị Điểm, Nha Trang", 4.7),
  ],
  vin: [
    D("Món Việt", "Vietnamese food", "Hola", "Phố mua sắm VinWonders", 4.6, "hola", "hola"),
    D("Burger", "Burgers", "Caribe Rock Burger", "Phố thương mại Vinpearl", 4.9, "caribe rock burger", "caribe rock"),
    D("Món Hoa", "Chinese food", "Bách Giai", "Lầu vọng cảnh", 4.7, "bách giai", "bach giai"),
  ],
  vinMore: [
    D("Món Ý", "Italian", "Oceania Italian Restaurant", "đảo Hòn Tre", 4.6),
    D("Pizza", "Pizza", "Mamma Mia Italian Cucina", "đảo Hòn Tre", 4.7),
    D("Món Nha Trang", "Local dishes", "Ẩm Thực Nha Trang (Vinpearl)", "Khu phố đi bộ Vinpearl", 4.8),
  ],
  doclet: [
    D("Hải sản", "Seafood", "Tính Thu", "Bãi biển Dốc Lết", 4.6, "tính thu", "tinh thu"),
    D("Hải sản trên bè", "Seafood on a raft", "Nhà Bè Bảo An", "Ninh Hải, Ninh Hòa", 4.7, "bè bảo an", "bao an"),
    D("Bún riêu, mì quảng", "Noodle soups", "Quán Trang", "Hòn Khói, Ninh Hòa", 4.9, "mì quảng", "noodle"),
  ],
  docletMore: [
    D("Hải sản trên bè", "Seafood raft", "Bè hải sản Quân Thảo", "Ninh Hải, Ninh Hòa", 4.5),
    D("Cơm", "Rice dishes", "Cơm Huyền", "32 Hòn Khói, Ninh Hòa", 4.7),
    D("Quán ăn gia đình", "Family eatery", "Quán 8 Cương", "gần bãi Dốc Lết", 4.8),
    D("Hải sản", "Seafood", "Trâm Anh Quán", "206 Lê Hồng Phong, Ninh Hòa", 4.5),
  ],
};

const T = {
  vi: {
    hook4: "Có bốn ngày ở Nha Trang? Lưu ngay lịch trình bốn ngày ba đêm này: tháp Chăm, lặn ngắm san hô, VinWonders, và biển Dốc Lết.",
    hook3: "Có ba ngày ở Nha Trang? Lưu ngay lịch trình ba ngày hai đêm này: tháp Chăm, tour đảo, hải sản, và ăn sáng chợ Đầm.",
    hookTip4: "Tháp Chăm · Đảo · VinWonders · Dốc Lết",
    hookTip3: "Tháp Chăm · Đảo · Hải sản · Chợ Đầm",
    flight: "Từ Hà Nội hay Thành phố Hồ Chí Minh đều có chuyến bay thẳng tới sân bay Cam Ranh, cách trung tâm Nha Trang khoảng ba mươi lăm cây số.",
    d1s: "Ngày đầu, sáng sớm ghé tháp Bà Ponagar, cụm tháp Chăm cổ bên sông Cái, rồi qua Hòn Chồng ngắm biển. Gần tháp có hải sản Xuân Trà, bún cá Tháp Bà, và bánh canh tôm tít Bếp Nhà.",
    d1c: "Chiều leo lên chùa Long Sơn với tượng Phật trắng trên đồi, rồi ghé nhà thờ Núi xây bằng đá. Ăn gần đây có bánh canh ghẹ Cô Ba Miền Biển, cơm gà xối mắm B-Food, và nem nướng bà Mười.",
    dem: "Tối dạo biển Trần Phú hóng gió, rồi đi ăn hải sản. Khu Nguyễn Thiện Thuật có hải sản Đông Hải, JJ Seafood, và ốc ngon Làng Biển.",
    dao: "Ngày hai đi tour đảo từ cảng Cầu Đá: lặn ngắm san hô ở Hòn Mun, rồi tắm biển Hòn Tằm. Về đất liền ăn hải sản Hà Linh, Thanh An, hay gỏi ốc Cửa Bé.",
    vin: "Ngày ba dành trọn cho VinWonders trên đảo Hòn Tre. Mẹo của dân địa phương: vào sớm chơi Tata World trước khi đông, trưa trốn nắng trong thủy cung, và ở lại xem Tata show. Ăn trưa ở Hola, Caribe Rock Burger, hay Bách Giai.",
    doclet: "Ngày cuối chạy lên biển Dốc Lết ở Ninh Hòa: nước trong, cát trắng, vắng hơn Nha Trang. Trưa ăn hải sản Tính Thu, bè Bảo An, hay mì quảng Trang, rồi về sân bay.",
    chodam: "Ngày cuối ăn sáng quanh chợ Đầm: bánh căn số tám, bún cá Quán hai mươi bốn, bánh căn Út Liên, rồi mua hải sản khô làm quà. Trên đường ra sân bay ghé Viện Hải dương học.",
    outro4: "Bốn ngày ở Nha Trang vẫn chưa đủ. Địa chỉ quán mình để ở phần mô tả. Lưu lại cho chuyến đi biển sắp tới nhé!",
    outro3: "Ba ngày ở Nha Trang trôi nhanh lắm. Địa chỉ quán mình để ở phần mô tả. Lưu lại cho chuyến đi biển sắp tới nhé!",
  },
  en: {
    hook4: "Four days in Nha Trang? Save this itinerary: ancient Cham towers, snorkeling over coral, VinWonders, and the quiet beach at Doc Let.",
    hook3: "Three days in Nha Trang? Save this itinerary: ancient Cham towers, an island hopping tour, fresh seafood, and breakfast at Dam market.",
    hookTip4: "Cham towers · Islands · VinWonders · Doc Let",
    hookTip3: "Cham towers · Islands · Seafood · Dam market",
    flight: "There are direct flights from Hanoi and Ho Chi Minh City to Cam Ranh airport, about thirty five kilometers from central Nha Trang.",
    d1s: "Day one, go early to Po Nagar, the ancient Cham towers above the Cai river, then walk out to the Hon Chong rocks. Nearby, try Xuan Tra for seafood, a bowl of fish noodle soup, or noodles with mantis shrimp.",
    d1c: "In the afternoon, climb to Long Son pagoda and its white Buddha on the hill, then visit the stone cathedral. Close by, try crab noodle soup, chicken rice, and Ninh Hoa style grilled pork rolls.",
    dem: "In the evening, stroll along Tran Phu beach, then go for seafood. Around Nguyen Thien Thuat street, try Dong Hai, JJ Seafood, and the snails at Lang Bien.",
    dao: "Day two is an island tour from Cau Da pier: snorkel over the coral at Hon Mun, then swim at Hon Tam. Back on land, eat seafood at Ha Linh or Thanh An, or try a snail salad.",
    vin: "Spend day three at VinWonders on Hon Tre island. Local tips: arrive early for Tata World before the queues, hide from the midday sun in the aquarium, and stay for the Tata show at night. For lunch, try Hola, Caribe Rock burgers, or Bach Giai.",
    doclet: "On the last day, drive north to Doc Let beach in Ninh Hoa: clear water, white sand, and far fewer people. Have seafood at Tinh Thu or on the Bao An raft, or a bowl of noodle soup, then head to the airport.",
    chodam: "On the last morning, eat breakfast around Dam market: banh can at number eight, fish noodle soup at Quan twenty four, or more banh can at Ut Lien, then buy dried seafood to take home. On the way to the airport, stop at the Oceanographic museum.",
    outro4: "Four days still isn't enough for Nha Trang. All the addresses are in the description. Save this for your next beach trip!",
    outro3: "Three days in Nha Trang fly by. All the addresses are in the description. Save this for your next beach trip!",
  },
};

const L = {
  vi: {
    region: "MIỀN TRUNG · VIỆT NAM", way: "ĐƯỜNG ĐẾN", fly: "Bay tới Cam Ranh",
    d1s: "NGÀY 1 · SÁNG", d1c: "NGÀY 1 · CHIỀU", dem: "NGÀY 1 · TỐI", d2: "NGÀY 2", d3: "NGÀY 3", d4: "NGÀY 4",
    back: "HẸN QUAY LẠI", cta: "Lưu lại để lên kế hoạch nhé!",
    p: {
      d1s: ["Tháp Bà Ponagar bên sông Cái", "Hòn Chồng ngắm biển"],
      d1c: ["Chùa Long Sơn · tượng Phật trắng", "Nhà thờ Núi xây bằng đá"],
      dem: ["Dạo biển Trần Phú buổi tối", "Hải sản, ốc quanh Nguyễn Thiện Thuật"],
      dao: ["Lặn ngắm san hô Hòn Mun", "Tắm biển Hòn Tằm"],
      vin: ["Cáp treo hoặc tàu cao tốc ra đảo", "Ở lại xem Tata show buổi tối"],
      doclet: ["Biển Dốc Lết nước trong, cát trắng", "Vắng hơn biển Nha Trang"],
      chodam: ["Ăn sáng, mua hải sản khô ở chợ Đầm", "Viện Hải dương học gần cảng Cầu Đá"],
    },
    tip: {
      d1s: "Đi sáng sớm cho mát, mặc lịch sự vào tháp",
      dem: "Dân địa phương mách: né quán do taxi tự chở tới",
      dao: "Nước trong nhất từ tháng 4 tới tháng 8",
      vin: "Chơi trò khô trước, công viên nước sau",
      doclet: "Nhiều dân Nha Trang trên TikTok khuyên đi",
      chodam: "Bánh căn ngon nhất là buổi sáng",
    },
    cap: { d1s: "Tháp Bà Ponagar", d1c: "Chùa Long Sơn", dem: "Biển Trần Phú", dao: "Tour đảo", vin: "VinWonders", doclet: "Dốc Lết", chodam: "Chợ Đầm" },
    pin: { dem: "Biển Trần Phú", vin: "VinWonders", doclet: "Biển Dốc Lết" },
    outroTip4: "Bốn ngày vẫn chưa đủ", outroTip3: "Ba ngày trôi nhanh lắm",
  },
  en: {
    region: "CENTRAL VIETNAM", way: "GETTING THERE", fly: "Fly to Cam Ranh",
    d1s: "DAY 1 · MORNING", d1c: "DAY 1 · AFTERNOON", dem: "DAY 1 · EVENING", d2: "DAY 2", d3: "DAY 3", d4: "DAY 4",
    back: "SEE YOU AGAIN", cta: "Save it for your trip!",
    p: {
      d1s: ["Po Nagar Cham towers", "Hon Chong rocks by the sea"],
      d1c: ["Long Son pagoda · white Buddha", "The stone cathedral"],
      dem: ["Evening walk on Tran Phu beach", "Seafood around Nguyen Thien Thuat"],
      dao: ["Snorkel over coral at Hon Mun", "Swim at Hon Tam"],
      vin: ["Cable car or speedboat to the island", "Stay for the Tata show"],
      doclet: ["Clear water, white sand", "Far quieter than Nha Trang"],
      chodam: ["Breakfast and dried seafood at Dam market", "Oceanographic museum by Cau Da pier"],
    },
    tip: {
      d1s: "Go early and dress modestly",
      dem: "Locals say: skip places a taxi takes you to",
      dao: "Clearest water from April to August",
      vin: "Rides first, water park after",
      doclet: "A favourite of Nha Trang locals on TikTok",
      chodam: "Banh can is best in the morning",
    },
    cap: { d1s: "Po Nagar", d1c: "Long Son pagoda", dem: "Tran Phu beach", dao: "Island tour", vin: "VinWonders", doclet: "Doc Let", chodam: "Dam market" },
    pin: { dem: "Tran Phu beach", vin: "VinWonders", doclet: "Doc Let beach" },
    outroTip4: "Four days isn't enough", outroTip3: "Three days fly by",
  },
};

const build = (lang, days) => {
  const t = T[lang];
  const l = L[lang];
  const four = days === 4;
  const dishes = (k) => FOOD[k].map((d) => dish(lang, d));
  const more = (k) => FOOD[k + "More"].map((d) => dish(lang, d));
  const point = (id, extra) => ({ id, layout: "point", ...extra });

  const scenes = [
    {
      id: "hook", layout: "hook", gallery: [img("01-hook")],
      narration: four ? t.hook4 : t.hook3,
      label: l.region, caption: "NHA TRANG", badge: lang === "en" ? (four ? "4D3N" : "3D2N") : four ? "4N3Đ" : "3N2Đ",
      tip: four ? t.hookTip4 : t.hookTip3, frame: "full", durationSec: 8,
    },
    {
      id: "flight", layout: "flight", narration: t.flight, label: l.way, caption: l.fly,
      flight: {
        to: { name: "Cam Ranh", lng: 109.2174, lat: 11.9983 },
        from: [
          { name: lang === "en" ? "Hanoi" : "Hà Nội", lng: 105.8072, lat: 21.2212 },
          { name: lang === "en" ? "HCMC" : "TP.HCM", lng: 106.652, lat: 10.8188 },
        ],
      },
      transition: "slide", durationSec: 6,
    },
    point("day1-sang", {
      route: route(lang, "ponagar", "honchong"),
      gallery: [img("02-ponagar"), img("02c-honchong"), img("02b-ponagar")],
      narration: t.d1s, label: l.d1s, caption: l.cap.d1s, points: l.p.d1s, tip: l.tip.d1s,
      accent: "#ffb978", dishes: dishes("ponagar"), moreDishes: more("ponagar"),
      transition: "wipe", durationSec: 13,
    }),
    point("day1-chieu", {
      route: route(lang, "longson", "nhatho"),
      gallery: [img("03c-longson"), img("03d-longson"), img("03-nhatho")],
      narration: t.d1c, label: l.d1c, caption: l.cap.d1c, points: l.p.d1c,
      accent: "#ffd27a", dishes: dishes("center"), moreDishes: more("center"),
      transition: "slide", durationSec: 13,
    }),
    point("day1-toi", {
      map: { name: l.pin.dem, lng: 109.196, lat: 12.2385 },
      gallery: [img("05-dem"), img("05b-nem")],
      narration: t.dem, label: l.dem, caption: l.cap.dem, points: l.p.dem, tip: l.tip.dem,
      accent: "#b9a2ff", dishes: dishes("night"), moreDishes: more("night"),
      frame: "full", transition: "fade", durationSec: 11,
    }),
    point("day2-dao", {
      route: route(lang, "cauda", "hontam", "honmun"),
      gallery: [img("04-honmun"), img("04b-sanho"), img("04c-hontam")],
      narration: t.dao, label: l.d2, caption: l.cap.dao, points: l.p.dao, tip: l.tip.dao,
      accent: "#7fd3ff", dishes: dishes("dao"), moreDishes: more("dao"),
      transition: "wipe", durationSec: 13,
    }),
  ];
  if (four) {
    scenes.push(
      point("day3-vin", {
        map: { name: l.pin.vin, lng: 109.2412, lat: 12.2174 },
        gallery: [img("07-captreo"), img("07b-vin"), img("07c-nhacnuoc")],
        narration: t.vin, label: l.d3, caption: l.cap.vin, points: l.p.vin, tip: l.tip.vin,
        accent: "#ff9fc4", dishes: dishes("vin"), moreDishes: more("vin"),
        transition: "slide", durationSec: 15,
      }),
      point("day4-doclet", {
        map: { name: l.pin.doclet, lng: 109.2293, lat: 12.5494 },
        gallery: [img("08-doclet"), img("08b-doclet"), img("08c-ninhhoa")],
        narration: t.doclet, label: l.d4, caption: l.cap.doclet, points: l.p.doclet, tip: l.tip.doclet,
        accent: "#8fe0b0", dishes: dishes("doclet"), moreDishes: more("doclet"),
        transition: "wipe", durationSec: 13,
      }),
    );
  } else {
    scenes.push(
      point("day3-chodam", {
        route: route(lang, "chodam", "vien"),
        gallery: [img("06-chodam"), img("06b-chodam"), img("06c-vien")],
        narration: t.chodam, label: l.d3, caption: l.cap.chodam, points: l.p.chodam, tip: l.tip.chodam,
        accent: "#8fe0b0", dishes: dishes("chodam"), moreDishes: more("chodam"),
        transition: "slide", durationSec: 13,
      }),
    );
  }
  scenes.push({
    id: "outro", layout: "outro", gallery: [img("09-outro")],
    narration: four ? t.outro4 : t.outro3, label: l.back, caption: "NHA TRANG",
    tip: four ? l.outroTip4 : l.outroTip3, cta: l.cta, frame: "full", transition: "iris", durationSec: 9,
  });

  const slug = `nha-trang-${four ? "4n3d" : "3n2d"}${lang === "en" ? "-en" : ""}`;
  const data = {
    id: slug,
    title: lang === "en" ? `Nha Trang in ${days} days, ${days - 1} nights` : `Nha Trang ${days} ngày ${days - 1} đêm`,
    language: lang,
    region: "Nha Trang, Khánh Hòa, Việt Nam",
    template: "travel-itinerary",
    format: { width: 1080, height: 1920, fps: 30 },
    transitionFrames: 15,
    theme: {
      accent: "#7fd3ff",
      brand: lang === "en" ? `NHA TRANG · ${four ? "4D3N" : "3D2N"}` : `NHA TRANG · ${four ? "4N3Đ" : "3N2Đ"}`,
    },
    narrator: lang === "en"
      ? { provider: "edge", voice: "en-US-AvaMultilingualNeural", rate: "+5%" }
      : { provider: "omnivoice", voice: "vi-nu-tre-03" },
    subtitles: true,
    music: { src: "shared/music/travel-upbeat.mp3", volume: 0.8 },
    map,
    flightMap,
    scenes,
  };
  mkdirSync(`data/videos/${slug}`, { recursive: true });
  writeFileSync(`data/videos/${slug}/video.json`, JSON.stringify(data, null, 2) + "\n");
  console.log(slug, scenes.length, "scenes");
};

for (const lang of ["vi", "en"]) for (const days of [3, 4]) build(lang, days);
