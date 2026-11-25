// Builds the four Phú Quốc video.json files (VI/EN × 3N2Đ/4N3Đ) from one
// scene list, so shared facts (stops, restaurants, ratings) stay in sync.
// Photo credits are filtered from research/credits-all.json per video.
// Run: node data/gen-videos.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const IMG = "videos/phu-quoc-4n3d/images/";
const img = (name) => IMG + name + ".jpg";

const map = {
  plate: "videos/phu-quoc-4n3d/map/region.jpg",
  style: "https://tiles.openfreemap.org/styles/fiord",
  center: [103.97, 10.19],
  zoom: 10.6,
  width: 1600,
  height: 1600,
  attribution: "© OpenMapTiles © OpenStreetMap",
};
const flightMap = {
  plate: "videos/phu-quoc-4n3d/map/vietnam.jpg",
  style: "https://tiles.openfreemap.org/styles/fiord",
  center: [106.3, 15.3],
  zoom: 5.9,
  width: 1080,
  height: 1920,
  attribution: "© OpenMapTiles © OpenStreetMap",
};

const STOP = {
  hoquoc: { vi: "Chùa Hộ Quốc", en: "Ho Quoc pagoda", lng: 104.0275, lat: 10.1092 },
  baisao: { vi: "Bãi Sao", en: "Sao beach", lng: 104.0352, lat: 10.0525 },
  nhatu: { vi: "Nhà tù Phú Quốc", en: "Phu Quoc prison", lng: 104.0188, lat: 10.0435 },
  captreo: { vi: "Ga cáp treo", en: "Cable car station", lng: 104.012, lat: 10.024 },
  honthom: { vi: "Hòn Thơm", en: "Hon Thom island", lng: 104.0176, lat: 9.9543 },
  rachvem: { vi: "Rạch Vẹm", en: "Rach Vem", lng: 103.9331, lat: 10.3612 },
  safari: { vi: "Vinpearl Safari", en: "Vinpearl Safari", lng: 103.895, lat: 10.3394 },
  nuocmam: { vi: "Nhà thùng nước mắm", en: "Fish sauce house", lng: 103.9612, lat: 10.2205 },
  suoitranh: { vi: "Suối Tranh", en: "Tranh stream", lng: 104.0153, lat: 10.1838 },
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

// Google Maps, ≥4.5★, scanned 30/10/2026 (research/food.md).
const FOOD = {
  nam: [
    D("Cơm, món Việt", "Vietnamese home cooking", "Đồng Hương Quán", "409 Nguyễn Văn Cừ", 4.6, "đồng hương", "dong huong"),
    D("Ốc các loại", "Sea snails", "Ốc Cồ 39k", "ĐT 975, An Thới", 4.7, "ốc cồ", "snails"),
    D("Quán ăn bình dân", "Local eatery", "Quán ăn Tuệ Anh", "An Thới", 5.0, "tuệ anh", "tue anh"),
  ],
  namMore: [
    D("Quán ăn", "Local eatery", "Phương Đông quán", "Nguyễn Văn Cừ, An Thới", 4.5),
    D("Hải sản", "Seafood", "Ann Seafood", "KB-03 KĐT Bãi Khem", 4.8),
  ],
  sunset: [
    D("Cua", "Crab", "Crab Easy", "152 Đ. Amalfi", 4.8, "crab easy", "crab easy"),
    D("Hải sản", "Seafood", "Madam Khánh 2", "A164 Đ. Amalfi", 4.8, "madam khánh", "madam khanh"),
    D("Hải sản", "Seafood", "The Gangs Sunset", "65 Đ. Amalfi", 4.6, "the gangs", "the gangs"),
  ],
  sunsetMore: [
    D("Đồ nướng", "Barbecue", "Phố Nướng", "AT60, Sunset Town", 4.6),
    D("Hải sản", "Seafood", "Mai Huong Restaurant", "AT119-127 New An Thới", 5.0),
  ],
  captreo: CAPTREO_FOOD(),
  captreoMore: CAPTREO_MORE(),
  dinhcau: [
    D("Hải sản", "Seafood", "Hải sản Động Tôm Hùm", "1 Bạch Đằng", 4.8, "động tôm hùm", "lobster cave"),
    D("Hải sản", "Seafood", "MYLA Seafood", "98 Trần Hưng Đạo", 4.9, "myla", "myla"),
    D("Hải sản", "Seafood", "Thuận Kiều 2", "70B Trần Hưng Đạo", 4.7, "thuận kiều", "thuan kieu"),
  ],
  dinhcauMore: [
    D("Hải sản", "Seafood", "Đảo Hải Sản", "Hẻm 111 Trần Phú", 4.7),
    D("Ốc, hải sản", "Snails & seafood", "Ốc Hải Sản KTIN 1", "147a Trần Hưng Đạo", 4.6),
    D("Hải sản, bar biển", "Beach bar & seafood", "Aloha Beach Bar", "68 Trần Hưng Đạo", 4.7),
  ],
  duongdong: [
    D("Bún quậy", "Bun quay", "Bún Quậy Bạch Đằng", "32A Bạch Đằng", 4.9, "bún quậy bạch đằng", "bun quay"),
    D("Bánh canh chả cá", "Fish cake noodle soup", "Bánh canh Cô Út", "7 Nguyễn Đình Chiểu", 4.9, "cô út", "fish cake"),
    D("Bánh canh cua", "Crab noodle soup", "Cua 350", "38 Đường 30/4", 4.9, "cua ba trăm năm mươi", "crab"),
  ],
  duongdongMore: [
    D("Bún quậy", "Bun quay", "Bún quậy Thiện Mỹ", "103 Trần Hưng Đạo", 4.7),
    D("Bánh canh", "Noodle soup", "Bánh Canh Hạnh", "44 Bạch Đằng", 4.6),
    D("Cơm tấm", "Broken rice", "Cơm tấm Nhị", "1 Nguyễn Trung Trực", 4.6),
    D("Bún kèn", "Bun ken", "Bún kèn 87", "87 Đường 30/4", 4.6),
  ],
  rachvem: [
    D("Hải sản trên biển", "Seafood over the water", "Nhà Trên Biển – Joy Adventures", "Rạch Vẹm", 4.8, "joy adventures", "joy adventures"),
    D("Hải sản trên bè", "Seafood raft", "Nhà Bè Thu Bao", "Rạch Vẹm", 4.5, "thu bao", "thu bao"),
    D("Món Việt", "Vietnamese food", "Hà Nội Quán", "Bãi Dài", 4.8, "hà nội quán", "ha noi quan"),
  ],
  rachvemMore: [
    D("Hải sản trên bè", "Seafood raft", "Nhà bè Mường Thượng", "Rạch Vẹm", 4.9),
    D("Hải sản", "Seafood", "Nhà hàng Biển Rạch Vẹm", "Rạch Vẹm", 4.9),
  ],
  grand: [
    D("Hải sản", "Seafood", "Hải sản Cường Kua", "Grand World", 4.8, "cường kua", "cuong kua"),
    D("Hải sản", "Seafood", "Nhà hàng Vua Hải Sản", "Grand World", 4.8, "vua hải sản", "seafood king"),
    D("Hải sản", "Seafood", "Sunset Restaurant", "Grand World", 4.9, "sunset restaurant", "sunset restaurant"),
  ],
  grandMore: [
    D("Hải sản", "Seafood", "Madam Khánh", "Grand World", 4.7),
    D("Món Việt", "Vietnamese food", "HANA Coffee & Restaurant", "sông Venice, Grand World", 4.8),
    D("Món Việt", "Vietnamese food", "Bếp Nhà", "Grand World", 4.5),
  ],
};

function CAPTREO_FOOD() {
  return JSON.parse(readFileSync("research/captreo-food.json", "utf8")).spoken.map((a) => D(...a));
}
function CAPTREO_MORE() {
  return JSON.parse(readFileSync("research/captreo-food.json", "utf8")).more.map((a) => D(...a));
}

const T = {
  vi: {
    hook4: "Có bốn ngày ở Phú Quốc? Lưu ngay lịch trình bốn ngày ba đêm này: Bãi Sao, cáp treo vượt biển, bắc đảo ngắm sao biển, và hải sản tươi rói.",
    hook3: "Có ba ngày ở Phú Quốc? Lưu ngay lịch trình ba ngày hai đêm này: Bãi Sao, cáp treo vượt biển, hoàng hôn Dinh Cậu, và hải sản tươi rói.",
    hookTip4: "Bãi Sao · Cáp treo · Bắc đảo · Hải sản",
    hookTip3: "Bãi Sao · Cáp treo · Dinh Cậu · Hải sản",
    flight: "Từ Hà Nội hay Thành phố Hồ Chí Minh đều có chuyến bay thẳng tới sân bay Phú Quốc, nằm giữa đảo, đi về nam hay bắc đảo đều tiện.",
    d1s: "Ngày đầu khám phá nam đảo: ghé chùa Hộ Quốc nhìn ra biển, tắm Bãi Sao cát trắng mịn, rồi vào Nhà tù Phú Quốc tìm hiểu lịch sử. Gần đây có Đồng Hương quán, ốc Cồ, và quán ăn Tuệ Anh.",
    d1t: "Tối qua Sunset Town ở An Thới: ngắm hoàng hôn ở Cầu Hôn, dạo phố kiểu Địa Trung Hải, rồi xem show Nụ hôn của biển khoảng chín giờ tối. Ăn tối ở Crab Easy, Madam Khánh, hay The Gangs.",
    d2c: "Ngày hai đi cáp treo Hòn Thơm, vượt biển ngắm cả quần đảo An Thới từ trên cao. Mẹo nhỏ: đi buổi sáng cho đỡ nắng, và xem trước giờ chạy vì có ngày tạm nghỉ trưa. CAPTREO_SPOKEN",
    d2t: "Chiều về Dương Đông ngắm hoàng hôn ở Dinh Cậu, ngôi miếu trên ghềnh đá, rồi dạo chợ đêm. Hải sản ngon có Động Tôm Hùm, MYLA, và Thuận Kiều.",
    bac: "Ngày ba lên bắc đảo: sáng ra Rạch Vẹm ngắm sao biển, nhớ chỉ nhìn, đừng nhấc sao biển lên khỏi nước. Rồi qua Vinpearl Safari. Trưa ăn ở Joy Adventures, nhà bè Thu Bao, hay Hà Nội quán.",
    grand: "Tối ở lại Grand World, thành phố không ngủ với dòng sông Venice và phố đèn lồng. Hải sản có Cường Kua, Vua Hải Sản, và Sunset Restaurant.",
    dd: "Ngày cuối ở Dương Đông: ăn sáng bún quậy Bạch Đằng, bánh canh Cô Út, hay bánh canh cua ba trăm năm mươi, rồi ghé nhà thùng nước mắm xem cá cơm ủ muối, mua làm quà trước khi ra sân bay.",
    outro4: "Bốn ngày ở Phú Quốc vẫn chưa đủ. Địa chỉ quán mình để ở phần mô tả. Lưu lại cho chuyến đi đảo sắp tới nhé!",
    outro3: "Ba ngày ở Phú Quốc trôi nhanh lắm. Địa chỉ quán mình để ở phần mô tả. Lưu lại cho chuyến đi đảo sắp tới nhé!",
  },
  en: {
    hook4: "Four days in Phu Quoc? Save this itinerary: Sao beach, a cable car over the sea, starfish in the north, and fresh seafood every night.",
    hook3: "Three days in Phu Quoc? Save this itinerary: Sao beach, a cable car over the sea, sunset at Dinh Cau, and fresh seafood every night.",
    hookTip4: "Sao beach · Cable car · The north · Seafood",
    hookTip3: "Sao beach · Cable car · Dinh Cau · Seafood",
    flight: "There are direct flights from Hanoi and Ho Chi Minh City to Phu Quoc airport, right in the middle of the island, so both the south and the north are easy to reach.",
    d1s: "Day one is the south: start at Ho Quoc pagoda above the sea, swim at Sao beach with its soft white sand, then learn the history at Phu Quoc prison. Nearby, try Dong Huong, the snails at Oc Co, or Tue Anh.",
    d1t: "In the evening, head to Sunset Town in An Thoi: watch the sunset from the Kiss Bridge, wander the Mediterranean style streets, and catch the Kiss of the Sea show at around nine. For dinner, try Crab Easy, Madam Khanh, or The Gangs.",
    d2c: "Day two, ride the Hon Thom cable car across the sea and see the An Thoi islands from above. Tip: go in the morning before the heat, and check the timetable, since some days it pauses at midday. CAPTREO_SPOKEN",
    d2t: "In the afternoon, go back to Duong Dong for sunset at Dinh Cau, the little shrine on the rocks, then walk the night market. For seafood, try the Lobster Cave, MYLA, or Thuan Kieu.",
    bac: "Day three is the north: in the morning, see the starfish at Rach Vem, and please look but never lift them out of the water. Then visit Vinpearl Safari. For lunch, try Joy Adventures, the Thu Bao raft, or Ha Noi Quan.",
    grand: "Stay for the evening at Grand World, the city that never sleeps, with its Venice style canal and lantern streets. For seafood, try Cuong Kua, Seafood King, or Sunset Restaurant.",
    dd: "On the last morning, eat breakfast in Duong Dong: bun quay at Bach Dang, fish cake noodle soup at Co Ut, or crab noodles at Cua three fifty. Then visit a fish sauce house, where anchovies age in salt, and buy a bottle to take home.",
    outro4: "Four days still isn't enough for Phu Quoc. All the addresses are in the description. Save this for your next island trip!",
    outro3: "Three days in Phu Quoc fly by. All the addresses are in the description. Save this for your next island trip!",
  },
};

const L = {
  vi: {
    region: "ĐẢO NGỌC · VIỆT NAM", way: "ĐƯỜNG ĐẾN", fly: "Bay tới Phú Quốc",
    d1s: "NGÀY 1 · SÁNG", d1t: "NGÀY 1 · TỐI", d2s: "NGÀY 2 · SÁNG", d2t: "NGÀY 2 · CHIỀU",
    d3s: "NGÀY 3 · SÁNG", d3t: "NGÀY 3 · TỐI", d3: "NGÀY 3", d4: "NGÀY 4",
    back: "HẸN QUAY LẠI", cta: "Lưu lại để lên kế hoạch nhé!",
    p: {
      d1s: ["Chùa Hộ Quốc nhìn ra biển", "Bãi Sao cát trắng mịn", "Nhà tù Phú Quốc"],
      d1t: ["Hoàng hôn ở Cầu Hôn", "Show Nụ hôn của biển ~21h"],
      d2c: ["Cáp treo vượt biển ra Hòn Thơm", "Ngắm quần đảo An Thới từ trên cao"],
      d2t: ["Hoàng hôn ở Dinh Cậu", "Dạo chợ đêm Dương Đông"],
      bac: ["Ngắm sao biển ở Rạch Vẹm", "Vinpearl Safari"],
      grand: ["Sông Venice, phố đèn lồng", "Thành phố không ngủ"],
      dd: ["Ăn sáng bún quậy, bánh canh", "Nhà thùng nước mắm"],
    },
    tip: {
      d1s: "Bãi Sao đẹp nhất buổi sáng, trước khi đông",
      d1t: "Vào Sunset Town không mất vé",
      d2c: "Xem giờ chạy trước, có ngày nghỉ trưa",
      d2t: "Chợ đêm có xáo trộn năm 2026, hỏi lại trước khi đi",
      bac: "Chỉ ngắm, đừng nhấc sao biển khỏi nước",
      dd: "Nước mắm mang lên máy bay cần đóng gói kỹ, hỏi hãng trước",
    },
    cap: { d1s: "Nam đảo", d1t: "Sunset Town", d2c: "Cáp treo Hòn Thơm", d2t: "Dinh Cậu", bac: "Bắc đảo", grand: "Grand World", dd: "Dương Đông" },
    pin: { d1t: "Sunset Town", d2t: "Dinh Cậu", grand: "Grand World" },
    outroTip4: "Bốn ngày vẫn chưa đủ", outroTip3: "Ba ngày trôi nhanh lắm",
  },
  en: {
    region: "THE PEARL ISLAND · VIETNAM", way: "GETTING THERE", fly: "Fly to Phu Quoc",
    d1s: "DAY 1 · MORNING", d1t: "DAY 1 · EVENING", d2s: "DAY 2 · MORNING", d2t: "DAY 2 · AFTERNOON",
    d3s: "DAY 3 · MORNING", d3t: "DAY 3 · EVENING", d3: "DAY 3", d4: "DAY 4",
    back: "SEE YOU AGAIN", cta: "Save it for your trip!",
    p: {
      d1s: ["Ho Quoc pagoda above the sea", "Soft white sand at Sao beach", "Phu Quoc prison"],
      d1t: ["Sunset from the Kiss Bridge", "Kiss of the Sea show ~9 pm"],
      d2c: ["Cable car over the sea to Hon Thom", "The An Thoi islands from above"],
      d2t: ["Sunset at Dinh Cau", "Duong Dong night market"],
      bac: ["Starfish at Rach Vem", "Vinpearl Safari"],
      grand: ["Venice style canal, lantern streets", "The city that never sleeps"],
      dd: ["Bun quay and noodle soup breakfast", "A fish sauce house"],
    },
    tip: {
      d1s: "Sao beach is best in the morning, before the crowds",
      d1t: "Sunset Town itself is free to enter",
      d2c: "Check the timetable, some days it pauses at midday",
      d2t: "The night market changed in 2026, ask locally first",
      bac: "Look, but never lift a starfish out of the water",
      dd: "Ask your airline before flying with fish sauce",
    },
    cap: { d1s: "The south", d1t: "Sunset Town", d2c: "Hon Thom cable car", d2t: "Dinh Cau", bac: "The north", grand: "Grand World", dd: "Duong Dong" },
    pin: { d1t: "Sunset Town", d2t: "Dinh Cau", grand: "Grand World" },
    outroTip4: "Four days isn't enough", outroTip3: "Three days fly by",
  },
};

const allCredits = JSON.parse(readFileSync("research/credits-all.json", "utf8"));
const captreo = JSON.parse(readFileSync("research/captreo-food.json", "utf8"));

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
      label: l.region, caption: lang === "en" ? "PHU QUOC" : "PHÚ QUỐC", badge: lang === "en" ? (four ? "4D3N" : "3D2N") : four ? "4N3Đ" : "3N2Đ",
      tip: four ? t.hookTip4 : t.hookTip3, frame: "full", durationSec: 8,
    },
    {
      id: "flight", layout: "flight", narration: t.flight, label: l.way, caption: l.fly,
      flight: {
        to: { name: lang === "en" ? "Phu Quoc" : "Phú Quốc", lng: 103.9922, lat: 10.1727 },
        from: [
          { name: lang === "en" ? "Hanoi" : "Hà Nội", lng: 105.8072, lat: 21.2212 },
          { name: lang === "en" ? "HCMC" : "TP.HCM", lng: 106.652, lat: 10.8188 },
        ],
      },
      transition: "slide", durationSec: 7,
    },
    point("day1-sang", {
      route: route(lang, "hoquoc", "baisao", "nhatu"),
      gallery: [img("03b-hoquoc"), img("02-baisao"), img("02c-baisao"), img("03-nhatu")],
      narration: t.d1s, label: l.d1s, caption: l.cap.d1s, points: l.p.d1s, tip: l.tip.d1s,
      accent: "#7fe0d8", dishes: dishes("nam"), moreDishes: more("nam"),
      transition: "wipe", durationSec: 15,
    }),
    point("day1-toi", {
      map: { name: l.pin.d1t, lng: 104.0083, lat: 10.0294 },
      gallery: [img("04-sunset"), img("04d-town"), img("04c-show")],
      narration: t.d1t, label: l.d1t, caption: l.cap.d1t, points: l.p.d1t, tip: l.tip.d1t,
      accent: "#ffb48a", dishes: dishes("sunset"), moreDishes: more("sunset"),
      frame: "full", transition: "fade", durationSec: 14,
    }),
    point("day2-captreo", {
      route: route(lang, "captreo", "honthom"),
      gallery: [img("05-captreo"), img("05b-captreo"), img("04b-sunset")],
      narration: t.d2c.replace("CAPTREO_SPOKEN", captreo.narration[lang]),
      label: l.d2s, caption: l.cap.d2c, points: l.p.d2c, tip: l.tip.d2c,
      accent: "#7fd3ff", dishes: dishes("captreo"), moreDishes: more("captreo"),
      transition: "slide", durationSec: 15,
    }),
    point("day2-dinhcau", {
      map: { name: l.pin.d2t, lng: 103.9564, lat: 10.2172 },
      gallery: [img("06-dinhcau"), img("06b-chodem"), img("06c-haisan")],
      narration: t.d2t, label: l.d2t, caption: l.cap.d2t, points: l.p.d2t, tip: l.tip.d2t,
      accent: "#ffd27a", dishes: dishes("dinhcau"), moreDishes: more("dinhcau"),
      transition: "wipe", durationSec: 13,
    }),
  ];
  if (four) {
    scenes.push(
      point("day3-bac", {
        route: route(lang, "rachvem", "safari"),
        gallery: [img("07-saobien"), img("07b-safari"), img("07d-vinwonders")],
        narration: t.bac, label: l.d3s, caption: l.cap.bac, points: l.p.bac, tip: l.tip.bac,
        accent: "#8fe0b0", dishes: dishes("rachvem"), moreDishes: more("rachvem"),
        transition: "slide", durationSec: 15,
      }),
      point("day3-grand", {
        map: { name: l.pin.grand, lng: 103.8581, lat: 10.3249 },
        gallery: [img("07c-grandworld")],
        narration: t.grand, label: l.d3t, caption: l.cap.grand, points: l.p.grand,
        accent: "#c3a6ff", dishes: dishes("grand"), moreDishes: more("grand"),
        frame: "full", transition: "fade", durationSec: 12,
      }),
    );
  }
  scenes.push(
    point("last-duongdong", {
      map: { name: lang === "en" ? "Duong Dong" : "Dương Đông", lng: 103.9612, lat: 10.2205 },
      gallery: [img("08-nuocmam"), img("06c-haisan")],
      narration: t.dd, label: four ? l.d4 : l.d3, caption: l.cap.dd, points: l.p.dd, tip: l.tip.dd,
      accent: "#ff9f8a", dishes: dishes("duongdong"), moreDishes: more("duongdong"),
      transition: "slide", durationSec: 14,
    }),
    {
      id: "outro", layout: "outro", gallery: [img("09-outro")],
      narration: four ? t.outro4 : t.outro3, label: l.back, caption: lang === "en" ? "PHU QUOC" : "PHÚ QUỐC",
      tip: four ? l.outroTip4 : l.outroTip3, cta: l.cta, frame: "full", transition: "iris", durationSec: 9,
    },
  );

  const slug = `phu-quoc-${four ? "4n3d" : "3n2d"}${lang === "en" ? "-en" : ""}`;
  const data = {
    id: slug,
    title: lang === "en" ? `Phu Quoc in ${days} days, ${days - 1} nights` : `Phú Quốc ${days} ngày ${days - 1} đêm`,
    language: lang,
    region: "Đặc khu Phú Quốc, An Giang, Việt Nam",
    template: "travel-itinerary",
    format: { width: 1080, height: 1920, fps: 30 },
    transitionFrames: 15,
    theme: {
      accent: "#7fe0d8",
      brand: lang === "en" ? `PHU QUOC · ${four ? "4D3N" : "3D2N"}` : `PHÚ QUỐC · ${four ? "4N3Đ" : "3N2Đ"}`,
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
