// Builds data/videos/<slug>/video.json (+ credits.json) for the six Huế videos:
// hue-3n2d, hue-4n3d, hue-am-thuc and their -en versions.
// Story, tips and food picks follow research/tiktok.md (13 TikTok videos, their comments
// and replies); ratings come from research/food.md (Google Maps, 31/10/2026).
// Re-running resets durationSec, so run video:voice (EN) or video:import-voice (VI) again.
// Run: node data/gen-videos.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const IMG = (f) => `videos/hue/images/${f}.jpg`;
const allCredits = JSON.parse(readFileSync("data/videos/hue/credits.json", "utf8"));

const NARRATOR = {
  vi: { provider: "omnivoice", voice: "vi-nu-tre-03" },
  en: { provider: "edge", voice: "en-US-AvaMultilingualNeural", rate: "+5%" },
};

// One place to eat: dish, place, address, Maps rating; spokenAs = words the voice says.
const P = (name, place, address, rating, en, spokenAs) => ({ name, place, address, rating, en, spokenAs });

const STOPS = {
  dainoi: {
    lat: 16.4677, lng: 107.5791, accent: "#e8c170",
    gallery: ["dainoi-1", "dainoi-2", "dainoi-3", "dainoi-4"],
    vi: {
      caption: "Đại Nội Huế",
      points: ["Ngọ Môn, điện Thái Hòa", "Vé 200 nghìn, đi trước 10 giờ"],
      narration:
        "Ngày một, vào Đại Nội thật sớm. Qua Ngọ Môn tới điện Thái Hòa, nơi triều Nguyễn thiết triều. Vé hai trăm nghìn, nên đi trước mười giờ, vì trong Kinh thành nắng mà ít gió. Trưa làm tô bún bò ở O Thư hoặc O Mai, ngay gần đó.",
    },
    en: {
      caption: "Imperial City",
      points: ["Meridian Gate, Thai Hoa Palace", "200,000 dong, go before 10 am"],
      narration:
        "Day one, head into the Imperial City early. Walk through the Meridian Gate to Thai Hoa Palace, where the Nguyen court held audience. Tickets are two hundred thousand dong; go before ten, because the citadel gets hot with little breeze. For lunch, a bowl of bun bo is close by.",
    },
    dishes: [
      P("Bún bò", "Bún bò O Thư", "41 Ông Ích Khiêm", 4.5, "Beef noodle soup", "bún bò"),
      P("Bún bò", "Bún bò Huế O Mai", "29 Lê Thánh Tôn", 4.7, "Beef noodle soup"),
      P("Món Huế", "36 Quán", "36 Đinh Tiên Hoàng", 4.7, "Hue dishes"),
    ],
    more: [P("Bún, cơm nguội", "Bún cơm nguội Cảnh Vân", "198B kiệt 4 Chi Lăng", 4.5), P("Bún, cơm nguội", "Cơm nguội và Bún O Liễu", "206A kiệt 4 Chi Lăng", 4.5)],
    enSpoken: "bun bo",
  },
  thienmu: {
    lat: 16.4537, lng: 107.5446, accent: "#f2a65a",
    gallery: ["thienmu-1", "thienmu-2", "thienmu-3", "thienmu-4"],
    vi: {
      caption: "Chùa Thiên Mụ",
      points: ["Tháp Phước Duyên bảy tầng", "Hoàng hôn bên sông Hương"],
      narration:
        "Chiều lên chùa Thiên Mụ, ngôi chùa có từ năm mười sáu trăm lẻ một, với tháp Phước Duyên bảy tầng nhìn ra sông Hương. Người Huế khuyên lên lúc chiều, hoàng hôn ở đây rất đẹp. Gần chùa có Mandarin và Chạmm Garden.",
    },
    en: {
      caption: "Thien Mu Pagoda",
      points: ["The seven-tier Phuoc Duyen tower", "Sunset over the Perfume River"],
      narration:
        "In the afternoon, ride up to Thien Mu Pagoda, founded in sixteen-oh-one, its seven-tier tower looking over the Perfume River. Locals say come late in the day, the sunset here is lovely. Nearby, try Mandarin or Chamm Garden.",
    },
    dishes: [
      P("Món Việt", "Mandarin Coffee & Restaurant", "06 Bà Nguyễn Đình Chi", 4.8, "Vietnamese", "Mandarin"),
      P("Món Việt", "Chạmm Garden", "18 Nguyễn Phúc Nguyên", 4.8, "Vietnamese garden"),
      P("Món Huế", "Nhà Vườn Xuân Đài", "22 Thanh Nghị", 4.8, "Garden house"),
    ],
    more: [P("Món chay", "Tâm Vegan", "74 Nguyễn Phúc Nguyên", 4.8), P("Bánh Huế", "Quán bánh O Lé", "kiệt 104 Kim Long", 4.5), P("Bánh nậm, lọc", "Bánh Nậm Lọc O Ân", "kiệt 104 Kim Long", 5.0)],
    enSpoken: "Mandarin",
  },
  song: {
    lat: 16.4689, lng: 107.5889, accent: "#ff8a5b",
    gallery: ["song-1", "song-2", "song-3", "song-4"],
    vi: {
      caption: "Sông Hương lúc hoàng hôn",
      points: ["Đi thuyền lúc chiều, đừng đi tối", "Du thuyền trà chiều khoảng 490 nghìn"],
      narration:
        "Rồi xuống thuyền trên sông Hương lúc hoàng hôn. Bình luận TikTok dặn đi lúc chiều, vì thuyền rồng buổi tối gần như không thấy cảnh. Du thuyền trà chiều khoảng bốn trăm chín mươi nghìn một người. Tối ăn món Huế ở Vị Huế hoặc Madam Thu.",
    },
    en: {
      caption: "Perfume River at sunset",
      points: ["Take the boat late afternoon, not at night", "Afternoon-tea cruise, about 490,000 dong"],
      narration:
        "Then take a boat on the Perfume River at sunset. TikTok comments warn that night dragon boats show you almost nothing, so go in the late afternoon. An afternoon-tea cruise is about four hundred ninety thousand dong. For dinner, have Hue dishes at Vi Hue or Madam Thu.",
    },
    dishes: [
      P("Món Huế", "Vị Huế Restaurant", "61 Võ Thị Sáu", 4.9, "Hue dishes", "món Huế"),
      P("Món Huế", "Madam Thu 2", "04 Võ Thị Sáu", 4.7, "Hue dishes"),
      P("Cơm niêu", "Cơm Niêu Khải Hoàn", "90 Lê Lợi", 4.7, "Clay-pot rice"),
    ],
    more: [P("Bánh Huế", "Nhà hàng Bánh Gánh Huế", "51A Võ Thị Sáu", 4.8), P("Cơm nhà", "Cơm Cườm", "20/11 Lý Thường Kiệt", 4.9)],
    enSpoken: "Hue dishes",
  },
  truongtien: {
    lat: 16.4689, lng: 107.5889, accent: "#b98cff",
    gallery: ["truongtien-1", "truongtien-2", "truongtien-3", "truongtien-4"],
    vi: {
      caption: "Cầu Trường Tiền về đêm",
      points: ["Cầu đổi màu, cầu gỗ ven sông", "Gửi xe dưới chân cầu"],
      narration:
        "Tối dạo cầu Trường Tiền đổi màu, cầu gỗ ven sông và Phu Văn Lâu lên đèn. Người Huế nhắc, đoạn bờ nam đường Lê Lợi cấm đậu xe, nên gửi xe dưới chân cầu. Đói thì ghé quán Món ăn đặc sản Huế, hơn hai nghìn lượt đánh giá.",
    },
    en: {
      caption: "Truong Tien Bridge by night",
      points: ["Colour-changing bridge, riverside boardwalk", "Park under the bridge"],
      narration:
        "At night, stroll the colour-changing Truong Tien Bridge, the wooden riverside walk and the lit-up Phu Van Lau pavilion. Locals warn there's no parking on the south bank of Le Loi street, so park under the bridge. Still hungry? Try the local specialty house nearby.",
    },
    dishes: [
      P("Đặc sản Huế", "Món ăn đặc sản Huế", "kiệt 42 Nguyễn Công Trứ", 4.9, "Hue specialties", "đặc sản Huế"),
      P("Món Việt", "Quán ăn An Tâm", "kiệt 33 Nguyễn Công Trứ", 4.8, "Vietnamese"),
      P("Cơm quê", "Cơm Quê Mự Hải", "20 Nguyễn Thái Học", 4.8, "Home-style rice"),
    ],
    more: [P("Cơm niêu", "Cơm niêu Chạn", "19 Nguyễn Thái Học", 4.6), P("Cơm nhà", "Nhà Nâu", "45 Hàn Thuyên", 4.6)],
    enSpoken: "specialty",
  },
  tuduc: {
    lat: 16.433, lng: 107.5655, accent: "#7fc8a9",
    gallery: ["tuduc-1", "tuduc-2", "tuduc-3", "tuduc-4"],
    vi: {
      caption: "Lăng Tự Đức",
      points: ["Hồ Lưu Khiêm, rừng thông cuối hồ", "Vé 150 nghìn"],
      narration:
        "Ngày hai, đi lăng Tự Đức, đẹp như một khu vườn thơ bên hồ Lưu Khiêm. Men theo hồ tới cuối là rừng thông mà dân TikTok rất mê. Có bình luận cho biết chính điện đang tu sửa. Trưa ăn ở Không Gian Xưa, bốn chấm chín sao, ngay gần đó.",
    },
    en: {
      caption: "Tu Duc Tomb",
      points: ["Luu Khiem lake, pines at the far end", "150,000 dong"],
      narration:
        "Day two, visit Tu Duc's tomb, a poet's garden around Luu Khiem lake. Follow the lake to the far end for the pine grove TikTok loves. Comments say the main hall is under repair. For lunch, Khong Gian Xua, rated four point nine, is close by.",
    },
    dishes: [
      P("Món Huế", "Nhà Hàng Không Gian Xưa", "98 Minh Mạng", 4.9, "Hue dishes", "Không Gian Xưa"),
      P("Món Việt", "Maison Trang 2", "94 Huyền Trân Công Chúa", 4.9, "Vietnamese"),
      P("Bánh ép", "Bánh ép Huệ", "118 Lê Ngô Cát", 4.5, "Pressed rice crisps"),
    ],
    more: [P("Món Việt", "Hello Restaurant", "40 Đoàn Nhữ Hải", 5.0), P("Bún bò", "Bún Bò Huế Cố Đô", "268D Điện Biên Phủ", 4.9)],
    enSpoken: "Khong Gian Xua",
  },
  khaidinh: {
    lat: 16.399, lng: 107.5903, accent: "#c9a0dc",
    gallery: ["khaidinh-1", "khaidinh-2", "khaidinh-3", "khaidinh-4"],
    vi: {
      caption: "Lăng Khải Định",
      points: ["Pha kiến trúc Đông và Tây", "Cung Thiên Định khảm sành sứ"],
      narration:
        "Chiều sang lăng Khải Định, xây mất mười một năm, pha kiến trúc Đông và Tây. Bên trong cung Thiên Định khảm sành sứ và thủy tinh lấp lánh. Quanh lăng ít quán, nên ăn trên đường về, ở La Pines hoặc Không Gian Xưa đường Điện Biên Phủ.",
    },
    en: {
      caption: "Khai Dinh Tomb",
      points: ["East meets West in stone", "Thien Dinh hall, inlaid with porcelain"],
      narration:
        "In the afternoon, Khai Dinh's tomb took eleven years to build and mixes Eastern and Western styles. Inside, Thien Dinh hall glitters with porcelain and glass inlay. There are few places to eat nearby, so eat on the way back, at La Pines or Khong Gian Xua.",
    },
    dishes: [
      P("Món Việt", "La Pines – Lá Thông", "94 Minh Mạng", 4.6, "Vietnamese", "La Pines"),
      P("Món Huế", "Không Gian Xưa", "205 Điện Biên Phủ", 4.8, "Hue dishes"),
      P("Món Việt", "Pinetree House", "Thủy Tiên", 4.7, "Vietnamese"),
    ],
    more: [P("Món chay", "Tĩnh Garden", "140 Phan Bội Châu", 4.9), P("Món chay", "Chay Mây", "248 Phan Bội Châu", 4.7)],
    enSpoken: "La Pines",
  },
  dongba: {
    lat: 16.4724, lng: 107.5886, accent: "#ff6f61",
    gallery: ["dongba-1", "dongba-2", "dongba-3", "dongba-4"],
    vi: {
      caption: "Chợ Đông Ba",
      points: ["Mè xửng, tôm chua, hạt sen làm quà", "Bánh bèo, nậm, lọc gần chợ"],
      narration:
        "ghé chợ Đông Ba mua mè xửng, tôm chua, hạt sen làm quà. Quán bánh bèo nậm lọc Huế Xưa ngay gần đó, bốn chấm tám sao với hơn một nghìn sáu trăm đánh giá.",
    },
    en: {
      caption: "Dong Ba Market",
      points: ["Sesame candy, sour shrimp, lotus seeds", "Hue rice cakes near the market"],
      narration:
        "stop at Dong Ba Market for sesame candy, sour shrimp and lotus seeds to take home. Hue Xua, rated four point eight, serves banh beo rice cakes nearby.",
    },
    dishes: [
      P("Bánh bèo, nậm, lọc", "Bánh Bèo Nậm Lọc Huế Xưa", "1 Nguyễn Bỉnh Khiêm", 4.8, "Hue rice cakes", "bánh bèo"),
      P("Bèo, lọc, nậm", "Quán Trung Bộ", "16 Tô Hiến Thành", 4.9, "Hue rice cakes"),
      P("Bánh lọc", "Bánh lọc Huế Hương Cau", "4 Nguyễn Bỉnh Khiêm", 4.7, "Tapioca dumplings"),
    ],
    more: [P("Bánh canh Nam Phổ", "Rin – Bánh canh Nam Phổ", "15 Hàn Mặc Tử", 5.0), P("Bánh canh Nam Phổ", "Quán Hằng", "9 Phó Đức Chính", 4.7)],
    enSpoken: "banh beo",
  },
  tamgiang: {
    lat: 16.5226, lng: 107.6383, accent: "#4fb3bf",
    gallery: ["tamgiang-1", "tamgiang-2", "tamgiang-3", "tamgiang-4"],
    vi: {
      caption: "Phá Tam Giang",
      points: ["Hệ đầm phá lớn nhất Đông Nam Á", "Hoàng hôn ở đầm Chuồn"],
      narration:
        "Ngày ba, ra phá Tam Giang, hệ đầm phá lớn nhất Đông Nam Á. Chiều ngồi đầm Chuồn ngắm hoàng hôn giữa những chòi lưới, rồi ăn hải sản ở Đầm Chuồn Hội Quán hoặc ốc ở Thuận An.",
    },
    en: {
      caption: "Tam Giang Lagoon",
      points: ["Southeast Asia's largest lagoon system", "Sunset at Chuon lagoon"],
      narration:
        "Day three, drive out to Tam Giang, Southeast Asia's largest lagoon system. Watch the sunset among the fishing huts at Chuon lagoon, then have seafood at Dam Chuon Hoi Quan or snails in Thuan An.",
    },
    dishes: [
      P("Hải sản", "Đầm Chuồn Hội Quán", "đầm Chuồn", 4.5, "Seafood", "hải sản"),
      P("Ốc", "Quán Ốc Thành Mập", "Thuận An", 4.7, "Snails"),
      P("Ốc", "Ốc Truyền Nam", "Thuận An", 4.5, "Snails"),
    ],
    more: [P("Bánh xèo cá kình", "Bánh Xèo Cá Kình O Lợi", "Thuận An", 4.7)],
    enSpoken: "seafood",
  },
};

const LABEL = {
  vi: { dainoi: "Ngày 1 · Sáng", thienmu: "Ngày 1 · Chiều", song: "Ngày 1 · Hoàng hôn", truongtien: "Ngày 1 · Tối", tuduc: "Ngày 2 · Sáng", khaidinh: "Ngày 2 · Chiều", tamgiang: "Ngày 3 · Hoàng hôn", dongba: { 3: "Ngày cuối", 4: "Ngày 4" } },
  en: { dainoi: "Day 1 · Morning", thienmu: "Day 1 · Afternoon", song: "Day 1 · Sunset", truongtien: "Day 1 · Night", tuduc: "Day 2 · Morning", khaidinh: "Day 2 · Afternoon", tamgiang: "Day 3 · Sunset", dongba: { 3: "Last day", 4: "Day 4" } },
};
// The market opener depends on which day it falls on.
const DONGBA_OPEN = {
  vi: { 3: "Ngày cuối, trước khi ra sân bay Phú Bài, ", 4: "Ngày bốn, trước khi ra sân bay Phú Bài, " },
  en: { 3: "On your last day, before the airport, ", 4: "On day four, before the airport, " },
};

const HOOK = {
  vi: {
    3: "Lần đầu tới Huế? Đây là lịch trình ba ngày hai đêm, gom từ những video TikTok được thả tim nhiều nhất và lời mách của người Huế trong bình luận. Lưu lại nhé!",
    4: "Có bốn ngày ở Huế? Lịch trình này gom từ những video TikTok được thả tim nhiều nhất, thêm hoàng hôn phá Tam Giang. Lưu lại nhé!",
  },
  en: {
    3: "First time in Hue? Here's a three-day plan built from the most-liked TikTok videos and tips from locals in the comments. Save it!",
    4: "Four days in Hue? This plan comes from the most-liked TikTok videos, plus a sunset on Tam Giang lagoon. Save it!",
  },
};
const OUTRO = {
  vi: "Huế chậm thôi mà thương. Đi tháng ba là đẹp nhất, né mùa mưa từ tháng chín tới tháng mười một. Địa chỉ quán mình để ở phần mô tả, lưu lại nhé!",
  en: "Hue is slow, and that's the charm. March is the sweetest month; avoid the rainy season from September to November. All the addresses are in the description. Save it!",
};

const credit = (files) => allCredits.filter((c) => files.some((f) => c.file === IMG(f)));

const base = (slug, lang, title, theme) => ({
  id: slug,
  title,
  language: lang,
  region: "Thành phố Huế, Việt Nam",
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

const TRAVEL_THEME = { accent: "#e8c170", highlight: "#f5d58a", brand: "HUẾ" };

for (const lang of ["vi", "en"]) {
  for (const days of [3, 4]) {
    const slug = `hue-${days === 4 ? "4n3d" : "3n2d"}${lang === "en" ? "-en" : ""}`;
    const ids = ["dainoi", "thienmu", "song", "truongtien", "tuduc", "khaidinh", ...(days === 4 ? ["tamgiang"] : []), "dongba"];
    const files = ["outro-1", "outro-2"];
    const scenes = [
      {
        id: "hook",
        layout: "hook",
        caption: lang === "vi" ? "HUẾ" : "HUE",
        kicker: lang === "vi" ? "CỐ ĐÔ · LỊCH TRÌNH TỪ TIKTOK" : "THE IMPERIAL CITY · FROM TIKTOK",
        label: days === 4 ? (lang === "vi" ? "4N3Đ" : "4 DAYS") : lang === "vi" ? "3N2Đ" : "3 DAYS",
        sub: lang === "vi" ? "Đại Nội · Thiên Mụ · sông Hương lúc hoàng hôn" : "Imperial City · Thien Mu · the Perfume River at sunset",
        kind: "dive",
        narration: HOOK[lang][days],
        durationSec: 8,
      },
    ];
    for (const id of ids) {
      const s = STOPS[id];
      const t = s[lang];
      const narration = id === "dongba" ? DONGBA_OPEN[lang][days] + t.narration : t.narration;
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
      caption: lang === "vi" ? "Hẹn gặp ở Huế" : "See you in Hue",
      cta: lang === "vi" ? "Lưu lại cho chuyến đi nhé!" : "Save it for your trip!",
      narration: OUTRO[lang],
      durationSec: 7,
      gallery: [IMG("outro-1"), IMG("outro-2")],
    });
    const title = lang === "vi" ? `Huế ${days === 4 ? "4N3Đ" : "3N2Đ"}` : `Hue in ${days} days`;
    write(slug, { ...base(slug, lang, title, TRAVEL_THEME), dive: "videos/shared/map/dive-hue", scenes }, files);
  }
}

// ---------------------------------------------------------------- food video
const DISHES = [
  {
    id: "bunbo", accent: "#e85d3f", gallery: ["bunbo-1", "bunbo-2", "bunbo-3", "bunbo-4"],
    vi: {
      caption: "Bún bò Huế", tagline: "Ở Huế gọi là bún bò giò chả",
      origin: "Nguồn gốc chỉ có giai thoại, chưa có tài liệu chắc chắn",
      made: "Nước xương nấu sả và mắm ruốc · giò heo, chả cua, bắp bò",
      eat: "Thêm sa tế, rau sống; dân Huế dặn chọn quán nồi nhôm to",
      narration:
        "Món thứ nhất, bún bò. Ở Huế, người ta gọi là bún bò giò chả, còn nguồn gốc thì chỉ có giai thoại. Nước dùng nấu xương với sả và mắm ruốc, ăn cùng giò heo, chả cua. Khi ăn, thêm sa tế và rau sống. Quán ngon: bún bò Sen, Nhà An và O Tý.",
      cues: ["giai thoại", "mắm ruốc", "khi ăn", "quán ngon"],
    },
    en: {
      caption: "Bun bo Hue", tagline: "Locals just call it bun bo gio cha",
      origin: "Its origin is only legend; no firm record",
      made: "Bone broth with lemongrass and shrimp paste · pork knuckle, crab cake, beef shank",
      eat: "Add chili sate and herbs; locals say pick a shop with a big aluminium pot",
      narration:
        "Dish number one, bun bo. In Hue they simply call it bun bo gio cha, and its origin is only legend. The broth simmers bones with lemongrass and fermented shrimp paste, served with pork knuckle and crab cake. To eat, add chili sate and fresh herbs. Try Sen, Nha An or O Ty.",
      cues: ["legend", "shrimp paste", "to eat", "try"],
    },
    places: [P("Bún bò", "Bún Bò Huế Sen", "69 Võ Thị Sáu", 4.7), P("Bún bò", "Bún Bò Huế Nhà An", "45 Nguyễn Công Trứ", 4.9), P("Bún bò", "Bún bò O Tý", "5 Nguyễn Du", 4.5)],
  },
  {
    id: "comhen", accent: "#d4a373", gallery: ["comhen-1", "comhen-2", "comhen-3"],
    vi: {
      caption: "Cơm hến", tagline: "Món bình dân của cồn Hến",
      origin: "Món bình dân gắn với cồn Hến giữa sông Hương",
      made: "Cơm nguội, hến xào, tóp mỡ, đậu phộng, rau sống",
      eat: "Trộn đều, chan nước hến nóng; chỉ khoảng 15 nghìn",
      narration:
        "Món thứ hai, cơm hến, món bình dân gắn với cồn Hến giữa sông Hương. Cơm nguội trộn hến xào, tóp mỡ, đậu phộng và rau sống. Khi ăn, trộn đều rồi chan nước hến nóng, giá chỉ khoảng mười lăm nghìn. Quán ngon: cơm hến Hàn Mặc Tử, Bà Đen và Hương Xưa.",
      cues: ["cồn hến", "tóp mỡ", "khi ăn", "quán ngon"],
    },
    en: {
      caption: "Com hen", tagline: "Hue's humble clam rice",
      origin: "A humble dish tied to Hen Islet in the Perfume River",
      made: "Cold rice, stir-fried baby clams, crackling, peanuts, herbs",
      eat: "Mix well, pour on hot clam broth; about 15,000 dong",
      narration:
        "Dish number two, com hen, a humble dish tied to Hen Islet in the Perfume River. Cold rice is tossed with stir-fried baby clams, crackling, peanuts and herbs. To eat, mix it all and pour on hot clam broth, for about fifteen thousand dong. Try Han Mac Tu, Ba Den or Huong Xua.",
      cues: ["hen islet", "crackling", "to eat", "try"],
    },
    places: [P("Cơm hến", "Cơm hến 05 Hàn Mặc Tử", "05 Hàn Mặc Tử", 4.8), P("Cơm hến", "Cơm Hến Bà Đen", "31 Trần Quang Khải", 4.6), P("Cơm hến", "Cơm hến Hương Xưa", "30/7 Ưng Bình", 4.7)],
  },
  {
    id: "banhbeo", accent: "#f4c95d", gallery: ["banhbeo-1", "banhbeo-2", "banhbeo-3"],
    vi: {
      caption: "Bánh bèo chén", tagline: "Nhỏ xíu, rất riêng của Huế",
      origin: "Bánh bèo hấp trong chén nhỏ là kiểu riêng của Huế",
      made: "Bột gạo hấp trong chén · tôm chấy, mỡ hành",
      eat: "Chan nước mắm ngọt, ăn khi bánh còn nóng",
      narration:
        "Món thứ ba, bánh bèo chén, kiểu bánh nhỏ xíu rất riêng của Huế. Bột gạo hấp ngay trong chén, rắc tôm chấy và mỡ hành. Khi ăn, chan nước mắm ngọt và ăn lúc bánh còn nóng. Quán ngon: Huế Xưa, Quán Trung Bộ và Quán Ngỏ.",
      cues: ["rất riêng", "tôm chấy", "khi ăn", "quán ngon"],
    },
    en: {
      caption: "Banh beo", tagline: "Tiny saucer cakes, pure Hue",
      origin: "Rice cakes steamed in little saucers, a Hue signature",
      made: "Rice batter steamed in the dish · shrimp floss, scallion oil",
      eat: "Spoon on sweet fish sauce, eat them hot",
      narration:
        "Dish number three, banh beo, tiny rice cakes steamed in little saucers, a Hue signature. The batter cooks right in the dish, topped with shrimp floss and scallion oil. To eat, spoon on sweet fish sauce while they're hot. Try Hue Xua, Trung Bo or Quan Ngo.",
      cues: ["saucers", "shrimp floss", "to eat", "try"],
    },
    places: [P("Bánh bèo", "Bánh Bèo Nậm Lọc Huế Xưa", "1 Nguyễn Bỉnh Khiêm", 4.8), P("Bánh bèo", "Quán Trung Bộ", "16 Tô Hiến Thành", 4.9), P("Bánh bèo", "Quán Ngỏ", "30 Phú Mộng", 4.9)],
  },
  {
    id: "banhnam", accent: "#9ccc65", gallery: ["banhnam-1", "banhnam-2", "banhnam-3", "banhnam-4"],
    vi: {
      caption: "Bánh nậm, bánh lọc", tagline: "Gói lá chuối, trong veo",
      origin: "Tương truyền bánh nậm có từ làng Nam Phổ, ven Huế",
      made: "Nậm: bột gạo mỏng gói lá · Lọc: bột năng trong, nhân tôm thịt",
      eat: "Chấm nước mắm ớt, gọi chung với bánh bèo",
      narration:
        "Món thứ tư, bánh nậm và bánh lọc. Tương truyền bánh nậm có từ làng Nam Phổ, ven Huế. Nậm là bột gạo mỏng gói lá chuối, còn bánh lọc làm từ bột năng trong veo, nhân tôm thịt. Khi ăn, chấm nước mắm ớt. Quán ngon: Hương Cau, Rin và Hue Cuisine.",
      cues: ["nam phổ", "bột năng", "khi ăn", "quán ngon"],
    },
    en: {
      caption: "Banh nam & banh loc", tagline: "Leaf-wrapped and see-through",
      origin: "Legend says banh nam began in Nam Pho village near Hue",
      made: "Nam: thin rice cake in banana leaf · Loc: clear tapioca, shrimp and pork",
      eat: "Dip in chili fish sauce; order with banh beo",
      narration:
        "Dish number four, banh nam and banh loc. Legend says banh nam began in Nam Pho village near Hue. Nam is a thin rice cake wrapped in banana leaf, while banh loc is clear tapioca dough with shrimp and pork. To eat, dip in chili fish sauce. Try Huong Cau, Rin or Hue Cuisine.",
      cues: ["nam pho", "tapioca", "to eat", "try"],
    },
    places: [P("Bánh lọc", "Bánh lọc Huế Hương Cau", "4 Nguyễn Bỉnh Khiêm", 4.7), P("Bèo, nậm, lọc", "Rin – Bánh canh Nam Phổ", "15 Hàn Mặc Tử", 5.0), P("Bèo, nậm, lọc", "Hue Cuisine", "44 Hoàng Quốc Việt", 4.6)],
  },
  {
    id: "che", accent: "#c08fd8", gallery: ["che-1", "che-2", "che-3", "che-4"],
    vi: {
      caption: "Chè Huế", tagline: "Hạt sen cung đình và heo quay",
      origin: "Nổi tiếng với chè hạt sen kiểu cung đình",
      made: "Hạt sen, đậu xanh, bột lọc bọc thịt heo quay",
      eat: "Gọi một mâm nhiều loại; chè heo quay người mê, người chê",
      narration:
        "Món thứ năm, chè Huế, nổi tiếng với chè hạt sen kiểu cung đình. Có cả chè bột lọc bọc thịt heo quay, món gây tranh cãi nhất trên TikTok, người mê người chê. Khi ăn, gọi một mâm nhiều loại để thử. Quán ngon: chè Thanh, Ngọc Chè Bưởi và chè ông Lạc.",
      cues: ["hạt sen", "heo quay", "khi ăn", "quán ngon"],
    },
    en: {
      caption: "Che Hue", tagline: "Royal lotus seeds and… roast pork",
      origin: "Famous for royal-style lotus seed che",
      made: "Lotus seeds, mung beans, tapioca balls around roast pork",
      eat: "Order a tray of several; roast pork che splits the crowd",
      narration:
        "Dish number five, che, Hue's sweet soups, famous for royal-style lotus seed che. There's even che with tapioca balls wrapped around roast pork, the most debated dish on TikTok. To eat, order a tray of several kinds. Try Che Thanh, Ngoc Che Buoi or Ong Lac.",
      cues: ["lotus seed", "roast pork", "to eat", "try"],
    },
    places: [P("Chè", "Chè Thanh", "76-78 Mai Thúc Loan", 4.6), P("Chè", "Ngọc Chè Bưởi", "07 Trương Định", 4.6), P("Chè", "Chè ông Lạc", "36 Thanh Tịnh", 4.6)],
  },
];

const FOOD_HOOK = {
  vi: "Đến Huế ăn gì? Đây là năm món dân TikTok khen nhiều nhất, kèm nguồn gốc, cách ăn và quán trên bốn sao rưỡi. Lưu lại nhé!",
  en: "What to eat in Hue? Here are the five dishes TikTok loves most, with where they come from, how to eat them, and places rated four and a half stars or more.",
};
const FOOD_OUTRO = {
  vi: "Đồ Huế cay và mặn, bụng yếu thì dặn quán ít cay nha. Quán nổi tiếng dưới bốn sao rưỡi, mình ghi ở phần mô tả. Lưu lại nhé!",
  en: "Hue food runs spicy and salty, so ask for less chili if you need to. Famous spots under four and a half stars are in the description. Save it!",
};
const SECTION = {
  vi: ["Nguồn gốc", "Cách làm", "Cách ăn", "Quán ngon"],
  en: ["Origin", "How it's made", "How to eat", "Where"],
};

for (const lang of ["vi", "en"]) {
  const slug = `hue-am-thuc${lang === "en" ? "-en" : ""}`;
  const files = ["outro-food"];
  const scenes = [
    {
      id: "hook", layout: "hook", caption: lang === "vi" ? "HUẾ ĂN GÌ" : "HUE EATS",
      kicker: lang === "vi" ? "ẨM THỰC · TIKTOK KHEN" : "FOOD · TIKTOK FAVOURITES",
      label: lang === "vi" ? "5 MÓN" : "5 DISHES", narration: FOOD_HOOK[lang], durationSec: 8,
      gallery: DISHES.map((d) => IMG(d.gallery[0])),
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
    id: "outro", layout: "outro", caption: lang === "vi" ? "Ăn sập Huế" : "Eat your way through Hue",
    cta: lang === "vi" ? "Lưu lại cho chuyến đi nhé!" : "Save it for your trip!",
    narration: FOOD_OUTRO[lang], durationSec: 7, gallery: [IMG("outro-food")],
  });
  const title = lang === "vi" ? "Ẩm thực Huế: 5 món" : "Hue food: 5 dishes";
  write(slug, { ...base(slug, lang, title, { accent: "#e8c170", highlight: "#f5d58a", brand: "HUẾ" }), template: "food", scenes }, files);
}
