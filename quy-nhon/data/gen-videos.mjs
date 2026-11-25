// Builds the four Quy Nhơn video.json files (VI/EN × 3N2Đ/4N3Đ) from one
// scene list, so shared facts (stops, restaurants, ratings) stay in sync.
// Photo credits are filtered from research/credits-all.json per video.
// Run: node data/gen-videos.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const IMG = "videos/quy-nhon-4n3d/images/";
const img = (name) => IMG + name + ".jpg";

const map = {
  plate: "videos/quy-nhon-4n3d/map/region.jpg",
  style: "https://tiles.openfreemap.org/styles/fiord",
  center: [109.245, 13.765],
  zoom: 10.9,
  width: 1600,
  height: 1600,
  attribution: "© OpenMapTiles © OpenStreetMap",
};
const flightMap = {
  plate: "videos/quy-nhon-4n3d/map/vietnam.jpg",
  style: "https://tiles.openfreemap.org/styles/fiord",
  center: [106.6, 15.6],
  zoom: 5.9,
  width: 1080,
  height: 1920,
  attribution: "© OpenMapTiles © OpenStreetMap",
};

const STOP = {
  thapdoi: { vi: "Tháp Đôi", en: "Twin Towers", lng: 109.2111, lat: 13.7868 },
  ghenhrang: { vi: "Ghềnh Ráng", en: "Ghenh Rang", lng: 109.2148, lat: 13.7433 },
  eogio: { vi: "Eo Gió", en: "Eo Gio", lng: 109.292, lat: 13.8849 },
  kyco: { vi: "Kỳ Co", en: "Ky Co", lng: 109.2923, lat: 13.8501 },
  nhonhai: { vi: "Nhơn Hải", en: "Nhon Hai", lng: 109.288, lat: 13.769 },
  honkho: { vi: "Hòn Khô", en: "Hon Kho", lng: 109.2993, lat: 13.7644 },
  muitan: { vi: "Bến Mũi Tấn", en: "Mui Tan pier", lng: 109.236, lat: 13.756 },
  culaoxanh: { vi: "Cù Lao Xanh", en: "Cu Lao Xanh", lng: 109.355, lat: 13.62 },
  banhit: { vi: "Tháp Bánh Ít", en: "Banh It towers", lng: 109.1352, lat: 13.8684 },
};
const route = (lang, ...keys) =>
  keys.map((k) => ({ name: STOP[k][lang], lng: STOP[k].lng, lat: STOP[k].lat }));
const pin = (lang, k) => ({ name: STOP[k][lang], lng: STOP[k].lng, lat: STOP[k].lat });

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

// Google Maps, ≥4.5★, checked 31/10/2026 (research/food.md). Entries with no
// rating are dishes to try, suggested by an article, not checked restaurants.
const FOOD = {
  thapdoi: [
    D("Bánh xèo tôm nhảy", "Jumping shrimp pancakes", "Bánh xèo Anh Tú", "105 Đống Đa", 4.9, "anh tú", "anh tu"),
    D("Bánh xèo tôm nhảy", "Jumping shrimp pancakes", "Bánh xèo Phước Sơn", "122 Đống Đa", 4.9, "phước sơn", "phuoc son"),
    D("Món cuốn", "Fresh rolls", "Nẫu Cuốn", "84-86 Đống Đa", 4.7, "nẫu cuốn", "nau cuon"),
  ],
  thapdoiMore: [
    D("Đặc sản Bình Định", "Binh Dinh specialties", "Đặc Sản Ông Bảy", "23 Phan Văn Lân", 4.8),
    D("Hải sản, quán nhậu", "Seafood pub", "Quán Nhậu Biển Hồ", "31 Trương Vĩnh Ký", 4.6),
  ],
  ghenhrang: [
    D("Cá, món Việt", "Fish & Vietnamese food", "Nhà Hàng Cá Khói", "04 Nguyễn Trung Tín", 4.9, "cá khói", "ca khoi"),
    D("Hải sản", "Seafood", "Hải Sản Mr Mộc", "56 Nguyễn Thị Định", 4.8, "mr mộc", "mister moc"),
    D("Món Bắc", "Northern food", "Hà Nội Quán", "08 Nguyễn Trung Tín", 4.8, "hà nội quán", "ha noi quan"),
  ],
  ghenhrangMore: [
    D("Cơm, món Việt", "Rice dishes", "Cơm Ngon Mr Mộc", "57 Nguyễn Thị Định", 4.8),
    D("Buffet hải sản", "Seafood buffet", "Buffet Hải Sản Ố Lè", "Lô D5 Nguyễn Trung Tín", 4.7),
  ],
  eogio: [
    D("Hải sản", "Seafood", "Hải sản Cát Vàng", "KDL Eo Gió", 5.0, "cát vàng", "cat vang"),
    D("Cơm quê, hải sản", "Home cooking & seafood", "Phương Trang", "Thôn Lý Lương", 4.9, "phương trang", "phuong trang"),
    D("Hải sản", "Seafood", "Hải sản Anh Khôi", "Mặt biển Lý Hưng", 4.8, "anh khôi", "anh khoi"),
  ],
  eogioMore: [
    D("Cơm gia đình", "Family cooking", "Quán ăn Duy Phương", "Thôn Lý Chánh", 4.7),
    D("Hải sản", "Seafood", "Coco Jambo", "Lý Hưng, Nhơn Lý", 4.7),
  ],
  kyco: [
    D("Hải sản", "Seafood", "Coco Jambo", "Lý Hưng, Nhơn Lý", 4.7, "coco jambo", "coco jambo"),
    D("Hải sản", "Seafood", "Hoa Biển Kỳ Co", "Thôn Lý Hòa", 4.6, "hoa biển", "hoa bien"),
    D("Hải sản", "Seafood", "Quán Phương Nghĩa", "01 Dốc quán Lý Lương", 4.5, "phương nghĩa", "phuong nghia"),
  ],
  kycoMore: [
    D("Cơm gia đình", "Family cooking", "Quán ăn Duy Phương", "Thôn Lý Chánh", 4.7),
    D("Hải sản", "Seafood", "Hải sản Anh Khôi", "Mặt biển Lý Hưng", 4.8),
  ],
  honkho: [
    D("Hải sản", "Seafood", "Nhà hàng Rong Mơ", "Hải Nam, Nhơn Hải", 4.8, "rong mơ", "rong mo"),
    D("Bánh xèo", "Banh xeo", "Bánh Xèo Rêu Xanh", "Thôn Hải Bắc", 5.0, "rêu xanh", "reu xanh"),
    D("Bánh xèo", "Banh xeo", "Bánh Xèo Cô Ba", "Hải Nam, Nhơn Hải", 4.9, "cô ba", "co ba"),
  ],
  honkhoMore: [
    D("Hải sản", "Seafood", "Hải sản Nhơn Hải", "Nhơn Hải", 4.9),
    D("Bánh xèo", "Banh xeo", "Bánh Xèo Cô Tư", "Hải Đông, Nhơn Hải", 4.7),
  ],
  culaoxanh: [
    D("Chả cá", "Fish cake", "Đặc sản đảo Nhơn Châu", "gợi ý từ Mytour", undefined, "chả cá", "fish cake"),
    D("Mực tươi", "Fresh squid", "Ghe mành mực trên đảo", "gợi ý từ Mytour", undefined, "mực tươi", "squid"),
    D("Hải sản trưa", "Seafood lunch", "Quán trên đảo", "gợi ý từ Mia.vn", undefined, "hải sản", "seafood"),
  ],
  banhit: [
    D("Bánh ít lá gai", "Banh it la gai", "Đặc sản Tuy Phước", "gợi ý từ Tuổi Trẻ", undefined, "bánh ít lá gai", "leaf cake"),
    D("Nem chợ Huyện", "Cho Huyen nem", "Chợ Huyện, Phước Lộc", "gợi ý từ Mytour", undefined, "nem chợ huyện", "cho huyen"),
  ],
};

const T = {
  vi: {
    hook4: "Có bốn ngày ở Quy Nhơn? Lưu ngay lịch trình bốn ngày ba đêm này: tháp Chăm cổ, biển Kỳ Co xanh ngọc, đảo Cù Lao Xanh, và làng chài Hòn Khô.",
    hook3: "Có ba ngày ở Quy Nhơn? Lưu ngay lịch trình ba ngày hai đêm này: tháp Chăm cổ, Eo Gió lộng gió, biển Kỳ Co xanh ngọc, và làng chài Hòn Khô.",
    hookTip4: "Tháp Chăm · Kỳ Co · Cù Lao Xanh · Hòn Khô",
    hookTip3: "Tháp Chăm · Eo Gió · Kỳ Co · Hòn Khô",
    flight: "Từ Hà Nội hay Thành phố Hồ Chí Minh đều có chuyến bay thẳng tới sân bay Phù Cát, rồi đi xe về thành phố biển Quy Nhơn.",
    thapdoi: "Ngày đầu ghé Tháp Đôi ngay giữa thành phố, hai ngọn tháp Chăm được xây khoảng thế kỷ mười hai. Gần đó có bánh xèo tôm nhảy Anh Tú, Phước Sơn, hoặc quán Nẫu Cuốn.",
    ghenhrang: "Chiều qua Ghềnh Ráng, ngắm bãi Đá Trứng, tương truyền Nam Phương hoàng hậu từng chọn làm bãi tắm, rồi viếng mộ thi sĩ Hàn Mặc Tử. Tối ăn ở Cá Khói, hải sản Mr Mộc, hay Hà Nội quán.",
    eogio: "Ngày hai dậy sớm ra Eo Gió ở Nhơn Lý, đón bình minh trên con đường ven vách đá. Nhớ đi sớm, vì sau chín giờ gần như không có bóng mát. Ăn hải sản ở Cát Vàng, Phương Trang, hoặc Anh Khôi.",
    kyco: "Rồi xuống Kỳ Co, nước xanh ngọc được ví như Maldives của Việt Nam. Giờ có thể đi đường bộ, rồi đi xe điện xuống bãi. Biển không có cứu hộ, chỉ tắm gần bờ thôi nhé. Trưa ăn ở Coco Jambo, Hoa Biển, hay Phương Nghĩa.",
    culaoxanh: "Ngày ba đi cano ra Cù Lao Xanh, tàu giờ đón khách ở bến Mũi Tấn trên đường Xuân Diệu. Lên ngọn hải đăng, lặn ngắm san hô, rồi thử chả cá, mực tươi, và hải sản của đảo. Mùa mưa biển động, nhớ hỏi lịch tàu trước.",
    honkho3: "Ngày cuối qua làng chài Nhơn Hải, đi cano vài phút ra Hòn Khô. Từ tháng năm đến tháng bảy còn có mùa rong mơ vàng óng dưới nước. Ăn ở nhà hàng Rong Mơ, bánh xèo Rêu Xanh, hoặc Cô Ba.",
    honkho4: "Sáng ngày cuối qua làng chài Nhơn Hải, đi cano vài phút ra Hòn Khô. Từ tháng năm đến tháng bảy còn có mùa rong mơ vàng óng dưới nước. Ăn ở nhà hàng Rong Mơ, bánh xèo Rêu Xanh, hoặc Cô Ba.",
    banhit: "Trên đường ra sân bay, ghé tháp Bánh Ít trên đồi, tương truyền được gọi tên vì nhìn xa giống chiếc bánh ít lá gai. Quanh đây ít quán, nên mua bánh ít lá gai và nem chợ Huyện làm quà.",
    outro4: "Bốn ngày ở Quy Nhơn vẫn chưa đủ. Địa chỉ quán mình để ở phần mô tả. Lưu lại cho chuyến đi biển sắp tới nhé!",
    outro3: "Ba ngày ở Quy Nhơn trôi nhanh lắm. Địa chỉ quán mình để ở phần mô tả. Lưu lại cho chuyến đi biển sắp tới nhé!",
  },
  en: {
    hook4: "Four days in Quy Nhon? Save this itinerary: ancient Cham towers, the turquoise water of Ky Co, Cu Lao Xanh island, and the fishing village at Hon Kho.",
    hook3: "Three days in Quy Nhon? Save this itinerary: ancient Cham towers, windy Eo Gio, the turquoise water of Ky Co, and the fishing village at Hon Kho.",
    hookTip4: "Cham towers · Ky Co · Cu Lao Xanh · Hon Kho",
    hookTip3: "Cham towers · Eo Gio · Ky Co · Hon Kho",
    flight: "There are direct flights from Hanoi and Ho Chi Minh City to Phu Cat airport, then a drive into the seaside city of Quy Nhon.",
    thapdoi: "Day one starts at the Twin Towers, right in the city: two Cham brick towers built around the twelfth century. Nearby, try jumping shrimp pancakes at Anh Tu, Phuoc Son, or the fresh rolls at Nau Cuon.",
    ghenhrang: "In the afternoon, head to Ghenh Rang to see the egg-shaped stones of Queen's beach, said to be where Empress Nam Phuong once swam, and the grave of the poet Han Mac Tu. For dinner, try Ca Khoi, Mister Moc seafood, or Ha Noi Quan.",
    eogio: "On day two, get up early for sunrise at Eo Gio in Nhon Ly, a cliff path above the sea. Go early, because there is almost no shade after nine. For seafood, try Cat Vang, Phuong Trang, or Anh Khoi.",
    kyco: "Then head down to Ky Co, turquoise water often called the Maldives of Vietnam. You can now go by road and ride an electric shuttle down to the beach. There are no lifeguards, so stay close to shore. For lunch, try Coco Jambo, Hoa Bien, or Phuong Nghia.",
    culaoxanh: "On day three, take a boat to Cu Lao Xanh island; boats now leave from Mui Tan pier on Xuan Dieu street. Climb to the lighthouse, snorkel over the coral, then try the island's fish cake, fresh squid, and seafood. In the rainy season the sea gets rough, so check the boat times first.",
    honkho3: "On the last day, go to the fishing village of Nhon Hai and take a short boat ride to Hon Kho. From May to July, golden seaweed fields grow under the water. Eat at Rong Mo, or the pancakes at Reu Xanh or Co Ba.",
    honkho4: "On the last morning, go to the fishing village of Nhon Hai and take a short boat ride to Hon Kho. From May to July, golden seaweed fields grow under the water. Eat at Rong Mo, or the pancakes at Reu Xanh or Co Ba.",
    banhit: "On the way to the airport, stop at the Banh It towers on a hilltop, said to be named because from afar they look like a leaf cake. There are few restaurants here, so pick up some leaf cake and Cho Huyen nem to take home.",
    outro4: "Four days still isn't enough for Quy Nhon. All the addresses are in the description. Save this for your next beach trip!",
    outro3: "Three days in Quy Nhon fly by. All the addresses are in the description. Save this for your next beach trip!",
  },
};

const L = {
  vi: {
    region: "XỨ NẪU · VIỆT NAM", way: "ĐƯỜNG ĐẾN", fly: "Bay tới Quy Nhơn",
    d1s: "NGÀY 1 · SÁNG", d1c: "NGÀY 1 · CHIỀU", d2s: "NGÀY 2 · BÌNH MINH", d2t: "NGÀY 2 · TRƯA",
    d3: "NGÀY 3", d4s: "NGÀY 4 · SÁNG", d4: "NGÀY 4", last: "NGÀY CUỐI",
    back: "HẸN QUAY LẠI", cta: "Lưu lại để lên kế hoạch nhé!",
    p: {
      thapdoi: ["Hai tháp Chăm thế kỷ XII", "Ngay giữa thành phố"],
      ghenhrang: ["Bãi Đá Trứng · bãi Hoàng Hậu", "Mộ thi sĩ Hàn Mặc Tử"],
      eogio: ["Đón bình minh ở Nhơn Lý", "Đường đi bộ ven vách đá"],
      kyco: ["Nước xanh ngọc", "Đường bộ + xe điện xuống bãi"],
      culaoxanh: ["Hải đăng Cù Lao Xanh", "Lặn ngắm san hô"],
      honkho: ["Làng chài Nhơn Hải", "Cano ra Hòn Khô"],
      banhit: ["Cụm tháp Chăm trên đồi", "Tiện đường ra sân bay"],
    },
    tip: {
      thapdoi: "Đi sáng sớm cho đẹp nắng, chụp ảnh đỡ đông",
      ghenhrang: "Bãi Đá Trứng để ngắm, không nên tắm",
      eogio: "Sau 9h gần như không có bóng mát",
      kyco: "Không có cứu hộ, chỉ tắm gần bờ",
      culaoxanh: "Mùa mưa biển động, hỏi lịch tàu trước",
      honkho: "Rong mơ đẹp nhất tháng 5–7",
      banhit: "Mua bánh ít lá gai làm quà",
    },
    cap: { thapdoi: "Tháp Đôi", ghenhrang: "Ghềnh Ráng", eogio: "Eo Gió", kyco: "Kỳ Co", culaoxanh: "Cù Lao Xanh", honkho: "Hòn Khô", banhit: "Tháp Bánh Ít" },
    outroTip4: "Bốn ngày vẫn chưa đủ", outroTip3: "Ba ngày trôi nhanh lắm",
  },
  en: {
    region: "BINH DINH COAST · VIETNAM", way: "GETTING THERE", fly: "Fly to Quy Nhon",
    d1s: "DAY 1 · MORNING", d1c: "DAY 1 · AFTERNOON", d2s: "DAY 2 · SUNRISE", d2t: "DAY 2 · MIDDAY",
    d3: "DAY 3", d4s: "DAY 4 · MORNING", d4: "DAY 4", last: "LAST DAY",
    back: "SEE YOU AGAIN", cta: "Save it for your trip!",
    p: {
      thapdoi: ["Two 12th-century Cham towers", "Right in the city"],
      ghenhrang: ["Egg stones of Queen's beach", "Poet Han Mac Tu's grave"],
      eogio: ["Sunrise in Nhon Ly", "A cliff path above the sea"],
      kyco: ["Turquoise water", "By road, then an e-shuttle"],
      culaoxanh: ["Cu Lao Xanh lighthouse", "Snorkelling over coral"],
      honkho: ["Nhon Hai fishing village", "Boat ride to Hon Kho"],
      banhit: ["Cham towers on a hilltop", "On the way to the airport"],
    },
    tip: {
      thapdoi: "Go early for soft light and fewer people",
      ghenhrang: "The egg-stone beach is for looking, not swimming",
      eogio: "Almost no shade after 9 am",
      kyco: "No lifeguards, stay close to shore",
      culaoxanh: "Rough seas in the rainy season, check boats first",
      honkho: "Seaweed fields peak May–July",
      banhit: "Pick up leaf cakes to take home",
    },
    cap: { thapdoi: "Twin Towers", ghenhrang: "Ghenh Rang", eogio: "Eo Gio", kyco: "Ky Co", culaoxanh: "Cu Lao Xanh", honkho: "Hon Kho", banhit: "Banh It towers" },
    outroTip4: "Four days isn't enough", outroTip3: "Three days fly by",
  },
};

const allCredits = JSON.parse(readFileSync("research/credits-all.json", "utf8"));

const build = (lang, days) => {
  const t = T[lang];
  const l = L[lang];
  const four = days === 4;
  const dishes = (k) => FOOD[k].map((d) => dish(lang, d));
  const more = (k) => (FOOD[k + "More"] ?? []).map((d) => dish(lang, d));
  const point = (id, extra) => ({ id, layout: "point", ...extra });

  const scenes = [
    {
      id: "hook", layout: "hook", gallery: [img("00-hook"), img("00b-hook")],
      narration: four ? t.hook4 : t.hook3,
      label: l.region, caption: lang === "en" ? "QUY NHON" : "QUY NHƠN", badge: lang === "en" ? (four ? "4D3N" : "3D2N") : four ? "4N3Đ" : "3N2Đ",
      tip: four ? t.hookTip4 : t.hookTip3, frame: "full", durationSec: 8,
    },
    {
      id: "flight", layout: "flight", narration: t.flight, label: l.way, caption: l.fly,
      flight: {
        to: { name: lang === "en" ? "Phu Cat (Quy Nhon)" : "Phù Cát (Quy Nhơn)", lng: 109.0424, lat: 13.955 },
        from: [
          { name: lang === "en" ? "Hanoi" : "Hà Nội", lng: 105.8072, lat: 21.2212 },
          { name: lang === "en" ? "HCMC" : "TP.HCM", lng: 106.652, lat: 10.8188 },
        ],
      },
      transition: "slide", durationSec: 7,
    },
    point("thapdoi", {
      map: pin(lang, "thapdoi"),
      gallery: [img("01-thapdoi"), img("01b-thapdoi"), img("01c-thapdoi")],
      narration: t.thapdoi, label: l.d1s, caption: l.cap.thapdoi, points: l.p.thapdoi, tip: l.tip.thapdoi,
      accent: "#ffb27a", dishes: dishes("thapdoi"), moreDishes: more("thapdoi"),
      transition: "wipe", durationSec: 13,
    }),
    point("ghenhrang", {
      map: pin(lang, "ghenhrang"),
      gallery: [img("02-datrung"), img("02b-hanmactu")],
      narration: t.ghenhrang, label: l.d1c, caption: l.cap.ghenhrang, points: l.p.ghenhrang, tip: l.tip.ghenhrang,
      accent: "#ffd27a", dishes: dishes("ghenhrang"), moreDishes: more("ghenhrang"),
      frame: "full", transition: "fade", durationSec: 15,
    }),
    point("eogio", {
      route: route(lang, "eogio", "kyco"),
      gallery: [img("03-eogio"), img("03b-eogio"), img("03c-nhonly")],
      narration: t.eogio, label: l.d2s, caption: l.cap.eogio, points: l.p.eogio, tip: l.tip.eogio,
      accent: "#ff9fb0", dishes: dishes("eogio"), moreDishes: more("eogio"),
      transition: "slide", durationSec: 14,
    }),
    point("kyco", {
      map: pin(lang, "kyco"),
      gallery: [img("04-kyco"), img("04b-nhonly")],
      narration: t.kyco, label: l.d2t, caption: l.cap.kyco, points: l.p.kyco, tip: l.tip.kyco,
      accent: "#6fe3d6", dishes: dishes("kyco"), moreDishes: more("kyco"),
      frame: "full", transition: "wipe", durationSec: 16,
    }),
  ];
  if (four) {
    scenes.push(
      point("culaoxanh", {
        // No freely licensed photos of the island: the route map holds the scene.
        route: route(lang, "muitan", "culaoxanh"),
        narration: t.culaoxanh, label: l.d3, caption: l.cap.culaoxanh, points: l.p.culaoxanh, tip: l.tip.culaoxanh,
        accent: "#7fc8ff", dishes: dishes("culaoxanh"),
        transition: "slide", durationSec: 16,
      }),
    );
  }
  scenes.push(
    point("honkho", {
      route: route(lang, "nhonhai", "honkho"),
      gallery: [img("05-nhonhai")],
      narration: four ? t.honkho4 : t.honkho3, label: four ? l.d4s : l.last, caption: l.cap.honkho, points: l.p.honkho, tip: l.tip.honkho,
      accent: "#ffe08a", dishes: dishes("honkho"), moreDishes: more("honkho"),
      transition: "fade", durationSec: 14,
    }),
  );
  if (four) {
    scenes.push(
      point("banhit", {
        map: pin(lang, "banhit"),
        gallery: [img("06-banhit"), img("06b-banhit"), img("06c-banhit")],
        narration: t.banhit, label: l.d4, caption: l.cap.banhit, points: l.p.banhit, tip: l.tip.banhit,
        accent: "#ff8f6b", dishes: dishes("banhit"),
        transition: "wipe", durationSec: 14,
      }),
    );
  }
  scenes.push({
    id: "outro", layout: "outro", gallery: [img("07-outro"), img("07b-night")],
    narration: four ? t.outro4 : t.outro3, label: l.back, caption: lang === "en" ? "QUY NHON" : "QUY NHƠN",
    tip: four ? l.outroTip4 : l.outroTip3, cta: l.cta, frame: "full", transition: "iris", durationSec: 9,
  });

  const slug = `quy-nhon-${four ? "4n3d" : "3n2d"}${lang === "en" ? "-en" : ""}`;
  const data = {
    id: slug,
    title: lang === "en" ? `Quy Nhon in ${days} days, ${days - 1} nights` : `Quy Nhơn ${days} ngày ${days - 1} đêm`,
    language: lang,
    region: "Quy Nhơn, Gia Lai, Việt Nam",
    template: "travel-itinerary",
    format: { width: 1080, height: 1920, fps: 30 },
    transitionFrames: 15,
    theme: {
      accent: "#6fe3d6",
      brand: lang === "en" ? `QUY NHON · ${four ? "4D3N" : "3D2N"}` : `QUY NHƠN · ${four ? "4N3Đ" : "3N2Đ"}`,
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
  const used = new Set(scenes.flatMap((s) => s.gallery ?? []));
  const credits = allCredits.filter((c) => used.has(c.file));
  writeFileSync(`data/videos/${slug}/credits.json`, JSON.stringify(credits, null, 2) + "\n");
  console.log(slug, scenes.length, "scenes", credits.length, "credits");
};

for (const lang of ["vi", "en"]) for (const days of [3, 4]) build(lang, days);
