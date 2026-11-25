// Builds data/videos/<slug>/video.json (+ credits.json) for the six Saigon videos:
// saigon-3n2d, saigon-4n3d, saigon-am-thuc and their -en versions.
// Story, tips and food picks follow research/tiktok.md; ratings come from
// research/food.md (Google Maps, 31/10/2026). Re-running resets durationSec,
// so run video:voice (EN) or video:import-voice (VI) again afterwards.
// Run: node data/gen-videos.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const IMG = (f) => `videos/sai-gon/images/${f}.jpg`;
const allCredits = JSON.parse(readFileSync("data/videos/sai-gon/credits.json", "utf8"));

const NARRATOR = {
  vi: { provider: "omnivoice", voice: "vi-nu-tre-03" },
  en: { provider: "edge", voice: "en-US-AvaMultilingualNeural", rate: "+5%" },
};

// One place to eat: dish, place, address, Maps rating; spokenAs = words the voice says.
const P = (name, place, address, rating, en, spokenAs) => ({ name, place, address, rating, en, spokenAs });

const STOPS = {
  dinhdoclap: {
    lat: 10.777, lng: 106.6953, accent: "#ffb547",
    gallery: ["0-palace", "0-palace-room", "0-palace-cinema", "0-palace-court"],
    vi: {
      caption: "Dinh Độc Lập",
      points: ["Phòng họp, phòng chiếu phim xưa", "Đi sớm, vé bán tới 15:30"],
      narration:
        "Ngày một, mở đầu ở Dinh Độc Lập. Đi sớm để ngắm phòng họp, phòng chiếu phim xưa và bãi cỏ trước dinh. Trưa ăn cơm tấm ngay gần đó, ở cơm tấm A Còng Hai hoặc Sáu Bảy Tấm.",
    },
    en: {
      caption: "Independence Palace",
      points: ["Cabinet room and the old cinema", "Go early, tickets until 3:30 pm"],
      narration:
        "Day one starts at Independence Palace. Go early for the cabinet room, the old private cinema and the lawn out front. For lunch, broken rice is a short walk away.",
    },
    dishes: [
      P("Cơm tấm", "Cơm Tấm @2 Sài Gòn", "48 Trịnh Văn Cấn", 4.9, "Broken rice", "cơm tấm"),
      P("Cơm tấm", "Tiệm Cơm 67 Tấm", "Võ Văn Tần", 4.6, "Broken rice"),
      P("Bánh mì", "Bánh mì Chim Chạy", "11/4 Nguyễn Thị Minh Khai", 4.5, "Banh mi"),
    ],
    more: [P("Cơm, món Việt", "Anh Ba Rọi", "66/5 Phạm Ngọc Thạch", 4.6), P("Hủ tiếu", "Hủ Tiếu Hồng Phát", "293 Lý Tự Trọng", 4.9)],
    enSpoken: "broken rice",
  },
  buudien: {
    lat: 10.7799, lng: 106.6999, accent: "#ffd166",
    gallery: ["buudien-1", "buudien-3", "nhatho-2", "nhatho-3", "buudien-2"],
    vi: {
      caption: "Bưu điện · Nhà thờ",
      points: ["Bưu điện Thành phố, Đường sách", "Nhà thờ Đức Bà trùng tu tới cuối 2027"],
      narration:
        "Đi bộ vài phút là tới Bưu điện Thành phố và Đường sách. Nhà thờ Đức Bà đang đại trùng tu tới cuối năm hai không hai bảy, nên chỉ ngắm bên ngoài thôi nha. Bánh mì Mẹ Ỉn ở ngay gần đó.",
    },
    en: {
      caption: "Post Office · Cathedral",
      points: ["Central Post Office, Book Street", "Notre-Dame under restoration until late 2027"],
      narration:
        "A few minutes on foot bring you to the Central Post Office and Book Street. Notre-Dame Cathedral is under restoration until late twenty twenty-seven, so admire it from outside. Grab a banh mi nearby.",
    },
    dishes: [
      P("Bánh mì", "Bánh Mì Mẹ Ỉn", "136/13 Lê Thánh Tôn", 4.8, "Banh mi", "bánh mì"),
      P("Món Việt", "Mặn Mòi", "125 Hai Bà Trưng", 4.7, "Vietnamese"),
      P("Món Việt", "Gánh", "91 Hai Bà Trưng", 4.6, "Vietnamese"),
    ],
    more: [P("Bánh mì", "Bánh Mì Oanh", "146 Lê Thánh Tôn", 4.7), P("Căn-tin món Việt", "Dì Mai Căn-tin", "Mplaza, 39 Lê Duẩn", 4.7)],
    enSpoken: "banh mi",
  },
  benthanh: {
    lat: 10.7725, lng: 106.698, accent: "#ff7a59",
    gallery: ["benthanh-2", "benthanh-1", "benthanh-3", "benthanh-4"],
    vi: {
      caption: "Chợ Bến Thành",
      points: ["Mua quà, đặc sản buổi chiều", "Chợ đêm Bến Thành không còn"],
      narration:
        "Chiều ghé chợ Bến Thành mua quà. Lưu ý, chợ đêm Bến Thành đã không còn mở, nên đi ban ngày nha. Đói thì làm một tô hủ tiếu Hồng Phát, bốn chấm chín sao.",
    },
    en: {
      caption: "Ben Thanh Market",
      points: ["Souvenirs in the afternoon", "The night market no longer runs"],
      narration:
        "In the afternoon, shop for gifts at Ben Thanh Market. Heads up, the old night market is gone, so come by day. Hungry? Have a bowl of hu tieu at Hong Phat, rated four point nine.",
    },
    dishes: [
      P("Hủ tiếu", "Hủ Tiếu Hồng Phát", "293 Lý Tự Trọng", 4.9, "Hu tieu noodles", "hủ tiếu"),
      P("Cơm thố", "Cơm Thố Xá Lị", "76/6 Tôn Thất Đạm", 4.9, "Clay-pot rice"),
      P("Ăn vặt", "Hanoi Ngon", "7 Huỳnh Thúc Kháng", 4.7, "Street snacks"),
    ],
    more: [P("Bánh xèo", "XÈO Restaurant", "gần chợ Bến Thành", 4.7), P("Bánh mì", "Bánh Mì Mẹ Ỉn", "136/13 Lê Thánh Tôn", 4.8)],
    enSpoken: "hu tieu",
  },
  nguyenhue: {
    lat: 10.774, lng: 106.7038, accent: "#ff4f81",
    gallery: ["nguyenhue-2", "nguyenhue-4", "nguyenhue-3", "nguyenhue-1"],
    vi: {
      caption: "Phố đi bộ Nguyễn Huệ",
      points: ["Cà phê chung cư 42 Nguyễn Huệ", "Bùi Viện vui nhưng coi chừng giá"],
      narration:
        "Tối dạo phố đi bộ Nguyễn Huệ, ăn tối ở MANA Station rồi lên chung cư bốn hai Nguyễn Huệ uống cà phê. Bùi Viện vui, nhưng coi chừng giá, có người kể ba xiên nướng tới ba trăm nghìn.",
    },
    en: {
      caption: "Nguyen Hue Walking Street",
      points: ["Cafes in the 42 Nguyen Hue apartments", "Bui Vien is fun, but check prices"],
      narration:
        "At night, stroll Nguyen Hue Walking Street, have dinner at MANA Station, then climb to a cafe in the forty-two Nguyen Hue apartments. Bui Vien is fun, but check prices first.",
    },
    dishes: [
      P("Món Việt", "MANA Station", "Hai Bà Trưng", 4.6, "Vietnamese", "MANA Station"),
      P("Món Việt", "Hoang Yen", "7 Ngô Đức Kế", 4.5, "Vietnamese"),
      P("Cơm gà", "Cơm Gà Lý Tự Trọng", "31 Lý Tự Trọng", 4.5, "Chicken rice"),
    ],
    more: [P("Ăn vặt", "Hanoi Ngon", "7 Huỳnh Thúc Kháng", 4.7), P("Cơm thố", "Cơm Thố Xá Lị", "76/6 Tôn Thất Đạm", 4.9)],
    enSpoken: "MANA Station",
  },
  cholon: {
    lat: 10.753, lng: 106.661, accent: "#e63946",
    gallery: ["cholon-3", "cholon-2", "cholon-1", "cholon-4", "cholon-5"],
    vi: {
      caption: "Chợ Lớn",
      points: ["Chùa Bà Thiên Hậu, chợ Bình Tây", "Sủi cảo Hà Tôn Quyền"],
      narration:
        "Ngày hai, về Chợ Lớn. Thắp nhang ở chùa Bà Thiên Hậu, dạo chợ Bình Tây, rồi ăn sủi cảo trên đường Hà Tôn Quyền. Bánh canh cua Bà Ba gần đó vừa được Michelin gọi tên.",
    },
    en: {
      caption: "Cho Lon (Chinatown)",
      points: ["Thien Hau Temple, Binh Tay Market", "Dumplings on Ha Ton Quyen street"],
      narration:
        "Day two takes you to Cho Lon, Saigon's Chinatown. Light incense at Thien Hau Temple, wander Binh Tay Market, then eat dumplings on Ha Ton Quyen street. Nearby, Ba Ba crab noodle soup is on the Michelin list.",
    },
    dishes: [
      P("Sủi cảo", "Cường Ký · Sủi cảo 157", "157 Hà Tôn Quyền", 4.6, "Dumplings", "sủi cảo"),
      P("Bánh canh cua", "Bánh canh cua Bà Ba", "84/6 Nguyễn Biểu", 4.6, "Crab noodle soup"),
      P("Há cảo", "Há Cảo Kiều Ký", "43 Lão Tử", 4.5, "Har gow"),
    ],
    more: [P("Hủ tiếu Nam Vang", "Hủ tiếu Nhân Nghĩa", "385/1A Nguyễn Trãi", 4.9), P("Hủ tiếu", "Hủ Tiếu Tân Vinh Nguyên", "345 Nguyễn Chí Thanh", 4.6)],
    enSpoken: "dumplings",
  },
  song: {
    lat: 10.7745, lng: 106.7065, accent: "#7b61ff",
    gallery: ["song-4", "song-1", "song-5", "song-2", "song-3", "song-6"],
    vi: {
      caption: "Sông Sài Gòn về đêm",
      points: ["Hoàng hôn ở Công viên bờ sông", "Waterbus 15 nghìn, ngắm cầu Ba Son"],
      narration:
        "Chiều tối là phần đẹp nhất. Ngắm hoàng hôn ở Công viên bờ sông, rồi đi Waterbus từ bến Bạch Đằng, chỉ mười lăm nghìn, ngắm cầu Ba Son đổi màu và tháp Landmark tám mốt. Đi sớm để có chỗ ngồi nha.",
    },
    en: {
      caption: "Saigon River by night",
      points: ["Sunset at Saigon Riverside Park", "Waterbus from 15,000 dong, Ba Son Bridge"],
      narration:
        "Evening is the best part. Watch the sunset at Saigon Riverside Park, then ride the Waterbus from Bach Dang pier for about sixty cents, past the glowing Ba Son Bridge and Landmark eighty-one. Come early for a seat.",
    },
    dishes: [
      P("Món Việt", "Quán Bụi Central", "1B Ngô Văn Năm", 4.5, "Vietnamese"),
      P("Món Huế", "Minh – Món Huế", "6 Thi Sách", 4.5, "Hue dishes"),
      P("Nhà hàng nổi", "Elisa Floating", "5 Nguyễn Tất Thành", 4.6, "Floating restaurant"),
    ],
    more: [P("Món Việt", "Mặn Mòi", "125 Hai Bà Trưng", 4.7), P("Căn-tin món Việt", "Dì Mai Căn-tin", "Mplaza, 39 Lê Duẩn", 4.7)],
  },
  cuchi: {
    lat: 11.143, lng: 106.463, accent: "#8ab17d",
    gallery: ["cuchi-4", "cuchi-2", "cuchi-3", "cuchi-1"],
    vi: {
      caption: "Địa đạo Củ Chi",
      points: ["Cách trung tâm khoảng 70 km", "Chui thử đường hầm"],
      narration:
        "Đi sớm lên địa đạo Củ Chi, cách trung tâm khoảng bảy mươi cây số. Chui thử một đoạn đường hầm, xem nắp hầm ngụy trang, rồi ăn bò tơ Củ Chi trước khi về.",
    },
    en: {
      caption: "Cu Chi Tunnels",
      points: ["About 70 km from the centre", "Crawl a stretch of tunnel"],
      narration:
        "Leave early for the Cu Chi Tunnels, about seventy kilometres out of the city. Crawl a short stretch of tunnel, spot the hidden trapdoors, then try Cu Chi's young beef before heading back.",
    },
    dishes: [
      P("Bò tơ", "Bò tơ Bảy Biệm", "677 Nguyễn Thị Rành", 4.7, "Young beef", "bò tơ"),
      P("Bò tơ, món quê", "Nhà hàng Trường Lạc", "Trung Lập", 4.7, "Country food"),
      P("Món Việt", "Vườn Sinh Thái Ven Sông", "147 Cây Bài", 4.6, "Riverside garden"),
    ],
    more: [P("Bò tơ", "Bò tơ Minh Thành", "48 Nguyễn Thị Hẹ", 4.8), P("Cơm niêu", "Cơm niêu Tây Sơn Củ Chi", "1925 Tỉnh Lộ 15", 4.5)],
    enSpoken: "young beef",
  },
  cangio: {
    lat: 10.41, lng: 106.95, accent: "#2ec4b6",
    gallery: ["cangio-3", "cangio-2", "cangio-4", "cangio-1"],
    vi: {
      caption: "Cần Giờ",
      points: ["Rừng Sác, đảo khỉ", "Giữ chặt điện thoại, khỉ hay giật đồ"],
      narration:
        "Ngày bốn, xuống Cần Giờ ngắm rừng Sác và đảo khỉ. Giữ chặt điện thoại vì khỉ hay giật đồ. Trưa ăn hải sản ở quán Ngọc Hân hoặc Út Ngọc, rồi về sân bay.",
    },
    en: {
      caption: "Can Gio",
      points: ["Rung Sac mangroves, Monkey Island", "Hold on to your phone"],
      narration:
        "Day four heads down to Can Gio for the Rung Sac mangroves and Monkey Island. Hold on to your phone, the monkeys grab things. Have seafood for lunch, then head to the airport.",
    },
    dishes: [
      P("Hải sản", "Quán Ngọc Hân", "Cần Thạnh", 4.8, "Seafood", "hải sản"),
      P("Hải sản", "Út Ngọc", "Bùi Lâm", 4.7, "Seafood"),
      P("Hải sản", "Quán Mây Biển", "158 Tắc Xuất", 4.7, "Seafood"),
    ],
    more: [P("Hải sản", "Hải Sản Nhà Kim", "833 Duyên Hải", 4.8), P("Đặc sản, cà phê", "Nhà Tôi – Đặc sản", "50 Lương Văn Nho", 4.5)],
    enSpoken: "seafood",
  },
};

const LABEL = {
  vi: { dinhdoclap: "Ngày 1 · Sáng", buudien: "Ngày 1 · Trưa", benthanh: "Ngày 1 · Chiều", nguyenhue: "Ngày 1 · Tối", cholon: "Ngày 2 · Sáng", song: "Ngày 2 · Hoàng hôn", cuchi: { 3: "Ngày cuối", 4: "Ngày 3" }, cangio: "Ngày 4" },
  en: { dinhdoclap: "Day 1 · Morning", buudien: "Day 1 · Midday", benthanh: "Day 1 · Afternoon", nguyenhue: "Day 1 · Night", cholon: "Day 2 · Morning", song: "Day 2 · Sunset", cuchi: { 3: "Last day", 4: "Day 3" }, cangio: "Day 4" },
};

const HOOK = {
  vi: {
    3: "Lần đầu tới Sài Gòn? Đây là lịch trình ba ngày hai đêm, gom từ những video TikTok được thả tim nhiều nhất và bình luận của dân bản địa. Lưu lại nhé!",
    4: "Có bốn ngày ở Sài Gòn? Lịch trình này gom từ những video TikTok được thả tim nhiều nhất, thêm Củ Chi và rừng Cần Giờ. Lưu lại nhé!",
  },
  en: {
    3: "First time in Saigon? Here's a three-day plan built from the most-liked TikTok videos and what locals say in the comments. Save it!",
    4: "Four days in Saigon? This plan comes from the most-liked TikTok videos, plus the Cu Chi Tunnels and the Can Gio mangroves. Save it!",
  },
};
const OUTRO = {
  vi: "Sài Gòn không chán đâu, chỉ cần đi đúng giờ. Bạn muốn đi chỗ nào trước? Địa chỉ quán mình để ở phần mô tả, lưu lại nhé!",
  en: "Saigon is never boring if you time it right. Where would you go first? All the addresses are in the description. Save it for your trip!",
};

const credit = (files) => allCredits.filter((c) => files.some((f) => c.file === IMG(f)));

const theme = { accent: "#ffb547", brand: "SÀI GÒN" };
const base = (slug, lang, title) => ({
  id: slug,
  title,
  language: lang,
  region: "Thành phố Hồ Chí Minh, Việt Nam",
  template: "travel-itinerary",
  format: { width: 1080, height: 1920, fps: 30 },
  transitionFrames: 15,
  theme,
  narrator: NARRATOR[lang],
  subtitles: true,
  music: { src: "shared/music/travel-upbeat.mp3", volume: 0.8 },
});

const write = (slug, video, files) => {
  const dir = `data/videos/${slug}`;
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/video.json`, JSON.stringify(video, null, 2) + "\n");
  writeFileSync(`${dir}/credits.json`, JSON.stringify(credit(files), null, 2) + "\n");
  console.log(slug, video.scenes.length, "scenes");
};

for (const lang of ["vi", "en"]) {
  for (const days of [3, 4]) {
    const slug = `saigon-${days === 4 ? "4n3d" : "3n2d"}${lang === "en" ? "-en" : ""}`;
    const ids = ["dinhdoclap", "buudien", "benthanh", "nguyenhue", "cholon", "song", "cuchi", ...(days === 4 ? ["cangio"] : [])];
    const files = ["0-palace", "song-1", "song-2"];
    const scenes = [
      {
        id: "hook",
        layout: "hook",
        caption: lang === "vi" ? "SÀI GÒN" : "SAIGON",
        label: days === 4 ? (lang === "vi" ? "4N3Đ" : "4 DAYS") : lang === "vi" ? "3N2Đ" : "3 DAYS",
        kind: "dive",
        narration: HOOK[lang][days],
        durationSec: 8,
      },
    ];
    for (const id of ids) {
      const s = STOPS[id];
      const t = s[lang];
      let narration = t.narration;
      if (id === "cuchi") {
        narration = lang === "vi"
          ? (days === 3 ? "Ngày cuối, đi sớm" : "Ngày ba, đi sớm") + narration.slice("Đi sớm".length) + (days === 3 ? " Chiều ra sân bay là vừa." : "")
          : (days === 3 ? "On your last day, leave early" : "On day three, leave early") + narration.slice("Leave early".length);
      }
      const label = typeof LABEL[lang][id] === "object" ? LABEL[lang][id][days] : LABEL[lang][id];
      const dish = (d, i) => ({
        name: lang === "vi" ? d.name : d.en ?? d.name,
        place: d.place,
        address: d.address,
        rating: d.rating,
        ...(i === 0 && (lang === "vi" ? d.spokenAs : s.enSpoken) ? { spokenAs: lang === "vi" ? d.spokenAs : s.enSpoken } : {}),
      });
      files.push(...s.gallery);
      scenes.push({
        id,
        layout: "point",
        caption: t.caption,
        label,
        accent: s.accent,
        points: t.points,
        narration,
        durationSec: 12,
        gallery: s.gallery.map(IMG),
        geo: { lat: s.lat, lng: s.lng },
        dishes: s.dishes.map(dish),
        moreDishes: s.more.map((d) => ({ name: d.name, place: d.place, address: d.address, rating: d.rating })),
      });
    }
    scenes.push({
      id: "outro",
      layout: "outro",
      caption: lang === "vi" ? "Hẹn gặp ở Sài Gòn" : "See you in Saigon",
      cta: lang === "vi" ? "Lưu lại cho chuyến đi nhé!" : "Save it for your trip!",
      narration: OUTRO[lang],
      durationSec: 7,
      gallery: [IMG("song-1"), IMG("song-2")],
    });
    const title = lang === "vi" ? `Sài Gòn ${days === 4 ? "4N3Đ" : "3N2Đ"}` : `Saigon in ${days} days`;
    write(slug, { ...base(slug, lang, title), scenes }, files);
  }
}

// ---------------------------------------------------------------- food video
const DISHES = [
  {
    id: "comtam", accent: "#ffb347", gallery: ["comtam-3", "comtam-4", "comtam-2", "comtam-1"],
    vi: {
      caption: "Cơm tấm", tagline: "Hạt gạo vỡ thành đặc sản",
      origin: "Tấm là hạt gạo vỡ, xưa là gạo rẻ của nhà nông",
      made: "Sườn nướng than, bì, chả trứng · chan mỡ hành",
      eat: "Rưới nước mắm ngọt, ăn kèm đồ chua, canh",
      narration:
        "Món thứ nhất, cơm tấm. Tấm là hạt gạo vỡ, xưa là gạo rẻ của nhà nông. Sài Gòn biến nó thành dĩa sườn nướng than, bì, chả trứng. Khi ăn, rưới nước mắm ngọt. Quán ngon: Sà Bì Chưởng, cơm tấm A Còng Hai và Sáu Bảy Tấm.",
      cues: ["gạo vỡ", "sườn nướng", "khi ăn", "quán ngon"],
    },
    en: {
      caption: "Broken rice", tagline: "Cracked grains turned icon",
      origin: "Tam means broken grains, once the cheap rice of farmers",
      made: "Charcoal pork chop, shredded skin, egg meatloaf",
      eat: "Pour on sweet fish sauce, add pickles and soup",
      narration:
        "Dish number one, com tam, broken rice. The broken grains were once cheap farmers' rice. Saigon turned them into a plate of charcoal-grilled pork chop, shredded skin and egg meatloaf. To eat, pour on sweet fish sauce. Try Sa Bi Chuong, Com Tam at Two, or Sixty-Seven Tam.",
      cues: ["broken grains", "charcoal", "to eat", "try"],
    },
    places: [P("Cơm tấm", "Cơm Tấm Sà Bì Chưởng", "160 Phan Xích Long", 4.8), P("Cơm tấm", "Cơm Tấm @2 Sài Gòn", "48 Trịnh Văn Cấn", 4.9), P("Cơm tấm", "Tiệm Cơm 67 Tấm", "Võ Văn Tần", 4.6)],
  },
  {
    id: "banhmi", accent: "#f4a261", gallery: ["banhmi-4", "banhmi-2", "banhmi-3", "banhmi-1"],
    vi: {
      caption: "Bánh mì", tagline: "Ổ bánh thời Pháp, nhân kiểu Sài Gòn",
      origin: "Ổ bánh mì đến từ thời Pháp, người Việt làm lại theo cách riêng",
      made: "Pa tê, chả, thịt, đồ chua, dưa leo, ngò",
      eat: "Dân địa phương dặn: vỏ đừng giòn quá mới ngon",
      narration:
        "Món thứ hai, bánh mì. Ổ bánh có từ thời Pháp, người Sài Gòn kẹp pa tê, chả, thịt, đồ chua và ngò. Khi ăn, dân địa phương dặn vỏ đừng giòn quá mới ngon. Quán ngon: Mẹ Ỉn, Chim Chạy và bánh mì Oanh.",
      cues: ["thời Pháp", "pa tê", "khi ăn", "quán ngon"],
    },
    en: {
      caption: "Banh mi", tagline: "A French loaf, a Saigon filling",
      origin: "The loaf came with the French; Vietnamese cooks made it their own",
      made: "Pâté, cold cuts, grilled pork, pickles, cucumber, coriander",
      eat: "Locals say the crust shouldn't be too crunchy",
      narration:
        "Dish number two, banh mi. The loaf arrived in French times, and Saigon fills it with pâté, cold cuts, pickles and coriander. To eat, locals say the crust shouldn't be too crunchy. Try Me In, Chim Chay or Banh Mi Oanh.",
      cues: ["french times", "pâté", "to eat", "try"],
    },
    places: [P("Bánh mì", "Bánh Mì Mẹ Ỉn", "136/13 Lê Thánh Tôn", 4.8), P("Bánh mì", "Bánh Mì Chim Chạy", "97 Nguyễn Gia Trí", 4.7), P("Bánh mì", "Bánh Mì Oanh", "146 Lê Thánh Tôn", 4.7)],
  },
  {
    id: "hutieu", accent: "#e9c46a", gallery: ["hutieu-1", "hutieu-2", "hutieu-3"],
    vi: {
      caption: "Hủ tiếu Nam Vang", tagline: "Tô mì mang tên Phnom Penh",
      origin: "Nam Vang là tên cũ của Phnom Penh, Campuchia",
      made: "Tôm, thịt bằm, gan, trứng cút, nước dùng xương",
      eat: "Ăn nước hoặc khô, thêm giá, hẹ, chanh",
      narration:
        "Món thứ ba, hủ tiếu Nam Vang. Nam Vang là tên cũ của Phnom Penh, món theo người Hoa từ Campuchia sang. Một tô có tôm, thịt bằm, gan, trứng cút. Khi ăn, chọn nước hoặc khô. Quán ngon: Hồng Phát và Nhân Nghĩa.",
      cues: ["phnom penh", "trứng cút", "khi ăn", "quán ngon"],
    },
    en: {
      caption: "Hu tieu Nam Vang", tagline: "A noodle soup named after Phnom Penh",
      origin: "Nam Vang is the old Vietnamese name for Phnom Penh",
      made: "Shrimp, minced pork, liver, quail eggs, bone broth",
      eat: "Soup or dry, with bean sprouts, chives and lime",
      narration:
        "Dish number three, hu tieu Nam Vang. Nam Vang is the old name for Phnom Penh, and the dish came over from Cambodia with Chinese cooks. A bowl holds shrimp, minced pork, liver and quail eggs. To eat, pick soup or dry. Try Hong Phat or Nhan Nghia.",
      cues: ["phnom penh", "quail eggs", "to eat", "try"],
    },
    places: [P("Hủ tiếu", "Hủ Tiếu Hồng Phát", "293 Lý Tự Trọng", 4.9), P("Hủ tiếu", "Hủ tiếu Nhân Nghĩa", "385/1A Nguyễn Trãi", 4.9), P("Hủ tiếu", "Hồng Phát Bàn Cờ", "389 Võ Văn Tần", 4.6)],
  },
  {
    id: "bolalot", accent: "#90be6d", gallery: ["bolalot-3", "bolalot-1", "bolalot-2", "bolalot-4"],
    vi: {
      caption: "Bò lá lốt", tagline: "Khói than và mùi lá lốt",
      origin: "Món nhậu, món chiều quen thuộc của dân Sài Gòn",
      made: "Bò băm ướp sả, cuộn lá lốt, có nơi bọc mỡ chài",
      eat: "Cuốn bánh tráng, bún, rau sống, chấm mắm nêm",
      narration:
        "Món thứ tư, bò nướng lá lốt, món chiều quen thuộc của dân Sài Gòn. Thịt bò băm ướp sả, cuộn lá lốt, có nơi bọc thêm mỡ chài rồi nướng than. Khi ăn, cuốn bánh tráng, chấm mắm nêm. Quán ngon: O Lét và quán Na đường ray.",
      cues: ["món chiều", "ướp sả", "khi ăn", "quán ngon"],
    },
    en: {
      caption: "Beef in betel leaves", tagline: "Charcoal smoke and betel leaf",
      origin: "An everyday evening snack across Saigon",
      made: "Minced beef with lemongrass, wrapped in betel leaves",
      eat: "Roll in rice paper with herbs, dip in fermented anchovy sauce",
      narration:
        "Dish number four, bo la lot, an evening favourite across Saigon. Minced beef with lemongrass is wrapped in betel leaves, sometimes in caul fat too, then grilled over charcoal. To eat, roll it in rice paper with herbs. Try O Let or Na by the railway.",
      cues: ["evening favourite", "lemongrass", "to eat", "try"],
    },
    places: [P("Bò lá lốt", "Bò Lá Lốt O Lét", "54 Phan Văn Hân", 4.7), P("Bò lá lốt", "Bò lá lốt đường ray (Na)", "129/12B Hoàng Văn Thụ", 4.5), P("Bò lá lốt", "Bún thịt nướng 59", "59 Nguyễn Thái Bình", 5.0)],
  },
  {
    id: "botchien", accent: "#f9844a", gallery: ["botchien-2", "botchien-1", "botchien-3"],
    vi: {
      caption: "Bột chiên", tagline: "Món ăn vặt gốc Hoa",
      origin: "Món ăn vặt gốc người Hoa, phổ biến quanh Chợ Lớn",
      made: "Bột gạo cắt miếng, chiên giòn với trứng",
      eat: "Ăn kèm đu đủ ngâm chua, nước tương",
      narration:
        "Món thứ năm, bột chiên, món ăn vặt gốc người Hoa. Bột gạo cắt miếng, chiên giòn rồi đập trứng lên. Khi ăn, thêm đu đủ ngâm chua và nước tương. Quán ngon: bột chiên khoai môn Cô Hiền, Rạp Thủ Đô và Bột chiên năm mốt.",
      cues: ["gốc người hoa", "chiên giòn", "khi ăn", "quán ngon"],
    },
    en: {
      caption: "Bot chien", tagline: "A Chinese-Vietnamese street snack",
      origin: "A street snack from Saigon's Chinese community",
      made: "Rice-flour cakes, fried crisp with egg",
      eat: "With pickled papaya and soy sauce",
      narration:
        "Dish number five, bot chien, a snack from Saigon's Chinese community. Rice-flour cakes are fried crisp, then egg is cracked over them. To eat, add pickled papaya and soy sauce. Try Co Hien, Rap Thu Do or Bot Chien Fifty-One.",
      cues: ["chinese community", "fried crisp", "to eat", "try"],
    },
    places: [P("Bột chiên", "Bột chiên khoai môn Cô Hiền", "3 Trương Hán Siêu", 4.9), P("Bột chiên", "Bột chiên Rạp Thủ Đô", "35 Lão Tử", 4.6), P("Bột chiên", "Bột chiên 51", "51 Nguyễn Văn Lạc", 4.5)],
  },
];

const FOOD_HOOK = {
  vi: "Đến Sài Gòn ăn gì? Đây là năm món dân TikTok khen nhiều nhất, kèm nguồn gốc, cách ăn và quán trên bốn sao rưỡi. Lưu lại nhé!",
  en: "What to eat in Saigon? Here are the five dishes TikTok loves most, with where they come from, how to eat them, and places rated four and a half stars or more.",
};
const FOOD_OUTRO = {
  vi: "Bạn sẽ thử món nào trước? Quán nổi tiếng nhưng dưới bốn sao rưỡi, mình ghi đủ ở phần mô tả. Lưu lại nhé!",
  en: "Which one would you try first? Famous spots rated under four and a half stars are listed in the description. Save it!",
};
const SECTION = {
  vi: ["Nguồn gốc", "Cách làm", "Cách ăn", "Quán ngon"],
  en: ["Origin", "How it's made", "How to eat", "Where"],
};

for (const lang of ["vi", "en"]) {
  const slug = `saigon-am-thuc${lang === "en" ? "-en" : ""}`;
  const files = ["nguyenhue-2", "song-1"];
  const scenes = [
    {
      id: "hook", layout: "hook", caption: lang === "vi" ? "SÀI GÒN ĂN GÌ" : "SAIGON EATS",
      label: lang === "vi" ? "5 MÓN" : "5 DISHES", narration: FOOD_HOOK[lang], durationSec: 8,
      gallery: [IMG("comtam-3"), IMG("banhmi-4"), IMG("hutieu-1"), IMG("bolalot-3"), IMG("botchien-2")],
    },
  ];
  DISHES.forEach((d, i) => {
    const t = d[lang];
    files.push(...d.gallery);
    scenes.push({
      id: d.id, layout: "point", caption: t.caption, label: `${i + 1}/5`, accent: d.accent,
      narration: t.narration, durationSec: 20, gallery: d.gallery.map(IMG),
      story: {
        number: i + 1, total: 5, tagline: t.tagline,
        sections: [
          { part: "origin", title: SECTION[lang][0], cue: t.cues[0], text: t.origin },
          { part: "made", title: SECTION[lang][1], cue: t.cues[1], text: t.made },
          { part: "eat", title: SECTION[lang][2], cue: t.cues[2], text: t.eat },
          { part: "where", title: SECTION[lang][3], cue: t.cues[3], places: d.places.map((p) => ({ name: p.name, place: p.place, address: p.address, rating: p.rating })) },
        ],
      },
    });
  });
  scenes.push({
    id: "outro", layout: "outro", caption: lang === "vi" ? "Ăn sập Sài Gòn" : "Eat your way through Saigon",
    cta: lang === "vi" ? "Lưu lại cho chuyến đi nhé!" : "Save it for your trip!",
    narration: FOOD_OUTRO[lang], durationSec: 7, gallery: [IMG("nguyenhue-2")],
  });
  const title = lang === "vi" ? "Ẩm thực Sài Gòn: 5 món" : "Saigon food: 5 dishes";
  write(slug, { ...base(slug, lang, title), template: "food", scenes }, files);
}
