// Builds data/videos/<slug>/video.json (+ credits.json) for the four Tam Đảo videos:
// tam-dao-2n1d, tam-dao-am-thuc and their -en versions.
// Story, tips and food picks follow research/tiktok.md, itinerary.md, stay.md and food.md
// (Google Maps checked 02/11/2026). Re-running resets durationSec, so run the voice again.
// Run: node data/gen-videos.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const IMG = (f) => `videos/tam-dao/candidates/${f}.jpg`;
const allCredits = [...JSON.parse(readFileSync("data/videos/tam-dao/credits.json", "utf8")), ...JSON.parse(readFileSync("data/videos/tam-dao/credits-flickr.json", "utf8")), ...JSON.parse(readFileSync("data/videos/tam-dao/credits-pexels.json", "utf8"))];

const NARRATOR = {
  vi: { provider: "omnivoice", voice: "vi-nu-tre-03" },
  en: { provider: "edge", voice: "en-US-AvaMultilingualNeural", rate: "+5%" },
};

// One place: dish, place, address, Maps rating (null = suggestion without a rating).
const P = (name, place, address, rating, en, spokenAs) => ({ name, place, address, rating, en, spokenAs });

const STOPS = {
  town: {
    lat: 21.4562, lng: 105.645, accent: "#9ad1b0",
    gallery: ["town-1", "town-3", "town-6", "town-2"],
    vi: {
      label: "Ngày 1 · Trưa", caption: "Thị trấn trong sương",
      points: ["Quảng trường, nhà thờ Đá năm 1937", "Đi ngày thường cho vắng"],
      narration:
        "Ngày một, qua mười ba cây số đèo là tới thị trấn trong sương. Dạo quảng trường, rồi ghé nhà thờ Đá xây từ năm một chín ba bảy. Trưa gọi đĩa su su xào tỏi với gà đồi ở Thông Đỏ, bốn chấm chín sao, ngay gần quảng trường.",
    },
    en: {
      label: "Day 1 · Noon", caption: "The town in the mist",
      points: ["Main square, the 1937 stone church", "Go on a weekday for fewer crowds"],
      narration:
        "Day one, thirteen kilometres of mountain pass bring you to a town wrapped in mist. Stroll the main square, then the stone church built in nineteen thirty-seven. For lunch, order garlicky chayote shoots and hill chicken at Thong Do, rated four point nine, right by the square.",
    },
    dishes: [
      P("Su su, gà đồi", "Nhà Hàng Thông Đỏ", "79 Tây Thiên", 4.9, "Chayote, hill chicken", "su su"),
      P("Món Việt", "Nhà Hàng Tam Đảo Núi", "Tổ 1, trung tâm", 4.8, "Vietnamese"),
      P("Món Việt", "Nhà Hàng Phố Mưa", "16 phố Tây Thiên", 4.8, "Vietnamese"),
    ],
    more: [P("Cơm", "Cơm Thố Anh Nguyễn", "Khu 1", 4.6), P("Món Á", "Nhà Hàng Dương Xỉ", "trung tâm", 4.9), P("Món Việt", "Nhà Hàng Thiên Hương", "Tổ dân phố 1", 4.7)],
    enSpoken: "chayote",
  },
  den: {
    lat: 21.4596, lng: 105.6481, accent: "#e8b86b",
    gallery: ["den-1", "den-2", "den-4", "den-3"],
    vi: {
      label: "Ngày 1 · Chiều", caption: "Đền Bà Chúa",
      points: ["Vài trăm bậc đá qua rừng trúc", "Mặc kín đáo khi vào đền"],
      narration:
        "Chiều leo vài trăm bậc đá qua rừng trúc lên đền Bà Chúa Thượng Ngàn, nhớ mặc kín đáo. Chân khỏe thì leo tiếp gần một nghìn bốn trăm bậc lên tháp truyền hình. Xuống núi, ngồi Mufa hoặc Coco cho ấm bụng.",
    },
    en: {
      label: "Day 1 · Afternoon", caption: "Ba Chua Temple",
      points: ["A few hundred stone steps through bamboo", "Dress modestly at the temple"],
      narration:
        "In the afternoon, climb a few hundred stone steps through the bamboo to Ba Chua Thuong Ngan temple, and dress modestly. Strong legs? Keep going, almost fourteen hundred steps to the TV tower. Back down, warm up at Mufa or Coco.",
    },
    dishes: [
      P("Món lai Á, bia", "Mufa Restaurant", "Võ Nguyên Giáp, Khu 1", 4.9, "Asian fusion, craft beer", "Mufa"),
      P("Café, món ăn", "Coco Tam Đảo", "58 Võ Nguyên Giáp", 4.9, "Café"),
      P("Món Việt", "Tam Đảo Mạc Quán", "Phạm Văn Đồng", 4.8, "Vietnamese"),
    ],
    more: [P("Món Việt", "Nhà Hàng Tuấn Hương", "Khu 1", 4.5), P("Món Việt", "Góc Hội An", "trung tâm", 4.5)],
    enSpoken: "Mufa",
  },
  castle: {
    lat: 21.451, lng: 105.6389, accent: "#ffb36b",
    gallery: ["castle-2", "castle-1", "castle-4", "castle-3", "castle-5"],
    vi: {
      label: "Ngày 1 · Hoàng hôn", caption: "Hoàng hôn lâu đài",
      points: ["Lâu đài trên sườn núi phía tây", "Tháng 11 tới tháng 1 dễ có biển mây"],
      narration:
        "Chiều tà, sang phía lâu đài trên sườn núi phía tây ngắm hoàng hôn. Từ tháng mười một tới tháng một, sau một ngày mưa mà trời hửng nắng là dễ gặp biển mây. Tối ăn đồ nướng ở Mơ Màng, rồi ra dốc chợ ăn ngô, hạt dẻ nướng.",
    },
    en: {
      label: "Day 1 · Sunset", caption: "Castle at sunset",
      points: ["The castle on the western slope", "Nov to Jan: best chance of a cloud sea"],
      narration:
        "At golden hour, head to the castle on the western slope for the sunset. From November to January, when the sun comes out after a day of rain, you may get a sea of clouds. For dinner, grill your own at Mo Mang, then grab corn and chestnuts at the market slope.",
    },
    dishes: [
      P("Đồ nướng", "Tiệm Nướng Mơ Màng", "sườn tây thị trấn", 4.7, "Barbecue", "đồ nướng"),
      P("Đồ nướng", "May Rooftop & BBQ", "30 Võ Nguyên Giáp", 4.7, "Barbecue"),
      P("Café view", "La May Coffee & Tea", "22 Trần Quốc Tuấn", 4.9, "View café"),
    ],
    more: [P("Món Việt", "Nhà Hàng Kumo Chan", "Nguyễn Tất Thành", 4.6), P("Cơm lam", "Trường Mai Quán", "Võ Nguyên Giáp", 4.6)],
    enSpoken: "grill",
  },
  // Day 2 (user, 06/11/2026): early cloud hunt, breakfast, rest and drive home; Tây Thiên is only an optional stop.
  cloud: {
    lat: 21.4535, lng: 105.6395, accent: "#b8c8ff",
    gallery: ["town-4", "cloud-2", "cloud-3"],
    vi: {
      label: "Ngày 2 · Bình minh", caption: "Săn mây sớm",
      points: ["Dậy 5 giờ, ra sườn tây hoặc Cổng Trời", "Tuỳ chọn: ghé Tây Thiên trên đường về"],
      narration:
        "Ngày hai, dậy từ năm giờ, ra sườn núi phía tây hoặc Cổng Trời đón bình minh, may mắn sẽ thấy mây phủ kín thung lũng. Ăn sáng ở Thạch Bàn, bốn chấm sáu sao, rồi về nghỉ ngơi, trả phòng và về Hà Nội. Còn thời gian thì ghé Tây Thiên trên đường về, tuỳ bạn.",
    },
    en: {
      label: "Day 2 · Sunrise", caption: "Chasing clouds",
      points: ["Up at 5, head to the west slope or Heaven's Gate", "Optional: Tay Thien on the way home"],
      narration:
        "Day two, wake at five and head to the western slope or Heaven's Gate for sunrise; with luck, clouds fill the whole valley. Have breakfast at Thach Ban, rated four point six, then rest, check out and drive back to Hanoi. Got spare time? Tay Thien makes an optional stop on the way.",
    },
    dishes: [
      P("Ăn sáng", "Nhà hàng Thạch Bàn", "trung tâm thị trấn", 4.6, "Breakfast", "Thạch Bàn"),
      P("Món Việt, ăn sáng", "Nhà Hàng Tuấn Hương", "Khu 1", 4.5, "Vietnamese, breakfast"),
      P("Café view mây", "Sound Of Mountains", "Triệu Thái, thôn 2", 4.9, "Cloud-view café"),
    ],
    more: [P("Món Việt", "Dân Tộc Quán", "Km13 QL2B (nếu ghé Tây Thiên)", 4.8), P("Món Việt", "Mộc Quán Tây Thiên", "khu du lịch Tây Thiên", 4.6)],
    enSpoken: "Thach Ban",
  },
};

const STAY = {
  vi: {
    caption: "Nên ở đâu?",
    zones: [
      { title: "Quanh quảng trường", note: "Đi bộ ra quán, lần đầu đi", picks: [["Chân Mây Tam Đảo", 4.6, "trung tâm"], ["Khách sạn Quỳnh Hoa", 4.8, "Khu 1"]] },
      { title: "Homestay sườn tây", note: "View thung lũng, săn mây; hay phải leo dốc", picks: [["Samma Stay", 4.9, "thôn 2, QL2B"], ["Nhím Homestay", 4.9, "ngõ cụ Ty, thôn 2"]] },
    ],
    tip: "Cuối tuần nhớ đặt phòng trước",
    narration:
      "Nên ở đâu? Lần đầu đi thì ở quanh quảng trường, đi bộ ra quán ăn, như Chân Mây hay Quỳnh Hoa. Muốn săn mây thì chọn homestay sườn phía tây như Samma Stay, nhưng hỏi kỹ có phải leo dốc nhiều không. Cuối tuần nhớ đặt phòng trước.",
    cues: ["quảng trường", "sườn phía tây", "cuối tuần"],
  },
  en: {
    caption: "Where to stay?",
    zones: [
      { title: "Around the square", note: "Walk to food; best for a first trip", picks: [["Chân Mây Tam Đảo", 4.6, "trung tâm"], ["Khách sạn Quỳnh Hoa", 4.8, "Khu 1"]] },
      { title: "West-slope homestays", note: "Valley views, cloud seas; often a climb", picks: [["Samma Stay", 4.9, "thôn 2, QL2B"], ["Nhím Homestay", 4.9, "ngõ cụ Ty, thôn 2"]] },
    ],
    tip: "Book ahead for weekends",
    narration:
      "Where to stay? First time, stay around the square and walk to dinner, at Chan May or Quynh Hoa. Chasing clouds? Pick a homestay on the western slope like Samma Stay, but ask how many steps you'll climb. Book ahead for weekends.",
    cues: ["around the square", "western slope", "book ahead"],
  },
};

const HOOK = {
  vi: "Cuối tuần muốn trốn nóng? Tam Đảo cách Hà Nội chừng tám mươi cây số, mát hơn bốn, năm độ. Đây là lịch trình hai ngày một đêm, gom từ TikTok. Lưu lại nhé!",
  en: "Need a weekend escape from the heat? Tam Dao is about eighty kilometres from Hanoi and four to five degrees cooler. Here's a two-day plan built from TikTok. Save it!",
};
const OUTRO = {
  vi: "Mang theo áo ấm và giày đế bám, vì đường trơn khi mưa. Địa chỉ quán và chỗ ở mình để ở phần mô tả. Lưu lại cho chuyến cuối tuần nhé!",
  en: "Pack a warm layer and shoes with grip; the roads get slippery in the rain. All the addresses are in the description. Save it for your weekend!",
};

const credit = (files) => allCredits.filter((c) => files.some((f) => c.file === IMG(f)));

const base = (slug, lang, title, theme) => ({
  id: slug,
  title,
  language: lang,
  region: "Tam Đảo, Phú Thọ, Việt Nam",
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
  console.log(slug, video.scenes.length, "scenes,", credit(files).length, "credits");
};

const THEME = { accent: "#9ad1b0", highlight: "#ffd28a", brand: "TAM ĐẢO" };

for (const lang of ["vi", "en"]) {
  const slug = `tam-dao-2n1d${lang === "en" ? "-en" : ""}`;
  const files = ["town-5", "town-3", "castle-4", "castle-1"];
  const scenes = [
    {
      id: "hook",
      layout: "hook",
      kind: "road",
      caption: lang === "vi" ? "TAM ĐẢO" : "TAM DAO",
      kicker: lang === "vi" ? "PHỐ NÚI GẦN HÀ NỘI · TỪ TIKTOK" : "HANOI'S HILL TOWN · FROM TIKTOK",
      label: lang === "vi" ? "2N1Đ" : "2 DAYS",
      road: lang === "vi"
        ? { from: "Hà Nội", via: "Vĩnh Yên", to: "Tam Đảo", km: "~80 km · 2 giờ", pass: "13 km đèo", cool: "mát hơn 4–5°C" }
        : { from: "Hanoi", via: "Vinh Yen", to: "Tam Dao", km: "~80 km · 2 hrs", pass: "13 km pass", cool: "4–5°C cooler" },
      narration: HOOK[lang],
      durationSec: 9,
      gallery: [IMG("town-5")],
    },
  ];
  for (const id of ["town", "den", "castle", "cloud"]) {
    const s = STOPS[id];
    const t = s[lang];
    files.push(...s.gallery);
    scenes.push({
      id,
      layout: "point",
      caption: t.caption,
      label: t.label,
      accent: s.accent,
      points: t.points,
      narration: t.narration,
      durationSec: 13,
      gallery: s.gallery.map(IMG),
      geo: { lat: s.lat, lng: s.lng },
      dishes: s.dishes.map((d, i) => ({
        name: lang === "vi" ? d.name : d.en ?? d.name,
        place: d.place,
        address: d.address,
        rating: d.rating,
        ...(i === 0 ? { spokenAs: lang === "vi" ? d.spokenAs : s.enSpoken } : {}),
      })),
      moreDishes: s.more.map((d) => ({ name: d.name, place: d.place, address: d.address, rating: d.rating })),
    });
  }
  const st = STAY[lang];
  scenes.push({
    id: "stay", layout: "stay", caption: st.caption, accent: "#9ad1b0", zones: st.zones, tip: st.tip,
    cues: st.cues, narration: st.narration, durationSec: 11, gallery: [IMG("town-3"), IMG("castle-4")],
  });
  scenes.push({
    id: "outro",
    layout: "outro",
    caption: lang === "vi" ? "Gửi từ Tam Đảo" : "Greetings from Tam Dao",
    cta: lang === "vi" ? "Lưu lại cho chuyến cuối tuần nhé!" : "Save it for your weekend!",
    narration: OUTRO[lang],
    durationSec: 8,
    gallery: [IMG("castle-1"), IMG("castle-4")],
  });
  const title = lang === "vi" ? "Tam Đảo 2N1Đ" : "Tam Dao in 2 days";
  write(slug, { ...base(slug, lang, title, THEME), scenes }, files);
}

// ---------------------------------------------------------------- food video
const DISHES = [
  {
    id: "susu", accent: "#8fd18a", gallery: ["susu-1", "susu-4", "susu-3", "susu-5", "susu-2"],
    vi: {
      caption: "Ngọn su su", tagline: "Rau trồng khắp phố núi",
      origin: "Su su trồng khắp thị trấn nhờ khí hậu mát quanh năm",
      made: "Ngọn non xào tỏi lửa lớn, hoặc luộc chấm mắm tôm",
      eat: "Gọi kèm đồ nướng; về mua vài bó làm quà (VnExpress: 50k/4 bó)",
      narration:
        "Món thứ nhất, ngọn su su, loại rau trồng khắp thị trấn nhờ khí hậu mát. Ngọn non đem xào tỏi lửa lớn, hoặc luộc chấm mắm tôm. Khi ăn, gọi một đĩa đi kèm đồ nướng, về thì mua vài bó làm quà. Quán ngon: Phố Mưa, Tam Đảo Núi và Cơm Thố Anh Nguyễn.",
      cues: ["trồng khắp", "xào tỏi", "khi ăn", "quán ngon"],
    },
    en: {
      caption: "Chayote shoots", tagline: "The vine that grows all over town",
      origin: "Chayote grows all over town thanks to the cool climate",
      made: "Young shoots stir-fried with garlic, or boiled with shrimp paste",
      eat: "Order a plate with the barbecue; buy a few bunches to take home",
      narration:
        "Dish number one, chayote shoots, grown all over town thanks to the cool air. The young tips are stir-fried with lots of garlic, or boiled and dipped in shrimp paste. To eat, order a plate with your barbecue, and take a few bunches home. Try Pho Mua, Tam Dao Nui or Com Tho Anh Nguyen.",
      cues: ["grown all over", "garlic", "to eat", "try"],
    },
    places: [P("Su su", "Nhà Hàng Phố Mưa", "16 phố Tây Thiên", 4.8), P("Su su", "Nhà Hàng Tam Đảo Núi", "Tổ 1, trung tâm", 4.8), P("Su su", "Cơm Thố Anh Nguyễn", "Khu 1", 4.6)],
  },
  {
    id: "ga", accent: "#f2c46b", gallery: ["ga-5", "ga-1", "ga-2"],
    vi: {
      caption: "Gà đồi", tagline: "Đặc sản nổi tiếng nhất",
      origin: "Gà thả đồi, được xem là đặc sản nổi tiếng nhất Tam Đảo",
      made: "Bọc lá sen và đất sét, nướng than tới khi đất nứt; hoặc luộc, hấp",
      eat: "Ăn nóng, chấm muối tiêu chanh",
      narration:
        "Món thứ hai, gà đồi, được xem là đặc sản nổi tiếng nhất. Gà bọc lá sen và đất sét, nướng trên than hồng tới khi đất nứt là chín, nhiều quán làm luộc hay hấp. Khi ăn, chấm muối tiêu chanh lúc còn nóng. Quán ngon: Thông Đỏ, Thiên Hương và Tuấn Hương.",
      cues: ["nổi tiếng nhất", "đất sét", "khi ăn", "quán ngon"],
    },
    en: {
      caption: "Hill chicken", tagline: "Tam Dao's most famous dish",
      origin: "Free-range hill chicken, Tam Dao's best-known specialty",
      made: "Wrapped in lotus leaf and clay, baked on coals till the clay cracks; or boiled",
      eat: "Eat it hot with salt, pepper and lime",
      narration:
        "Dish number two, hill chicken, Tam Dao's best-known specialty. It's wrapped in lotus leaf and clay and baked on hot coals until the clay cracks; many places boil or steam it too. To eat, dip it in salt, pepper and lime while it's hot. Try Thong Do, Thien Huong or Tuan Huong.",
      cues: ["best-known", "clay", "to eat", "try"],
    },
    places: [P("Gà đồi", "Nhà Hàng Thông Đỏ", "79 Tây Thiên", 4.9), P("Gà đồi", "Nhà Hàng Thiên Hương", "Tổ dân phố 1", 4.7), P("Gà đồi", "Nhà Hàng Tuấn Hương", "Khu 1", 4.5)],
  },
  {
    id: "comlam", accent: "#c9d77a", gallery: ["comlam-1", "comlam-4", "comlam-2", "comlam-3"],
    vi: {
      caption: "Cơm lam", tagline: "Xôi nướng trong ống tre",
      origin: "Gạo nếp nướng trong ống tre, món quen của vùng núi",
      made: "Nếp ngâm kỹ cho vào ống tre, nướng trên than tới khi vỏ cháy sém",
      eat: "Chẻ ống, chấm muối vừng, ăn cùng gà hay thịt nướng",
      narration:
        "Món thứ ba, cơm lam, gạo nếp nướng trong ống tre, món quen của vùng núi. Nếp ngâm kỹ cho vào ống tre, nướng trên than tới khi vỏ cháy sém. Khi ăn, chẻ ống, chấm muối vừng, ăn cùng gà hay thịt nướng. Quán ngon: Trường Mai Quán, hoặc hàng nướng ở dốc chợ.",
      cues: ["ống tre", "cháy sém", "khi ăn", "quán ngon"],
    },
    en: {
      caption: "Com lam", tagline: "Sticky rice roasted in bamboo",
      origin: "Sticky rice roasted inside bamboo, a mountain classic",
      made: "Soaked rice packed into bamboo, roasted on coals until the shell chars",
      eat: "Split the tube, dip in sesame salt, eat with chicken or grilled meat",
      narration:
        "Dish number three, com lam, sticky rice roasted inside bamboo, a mountain classic. Soaked rice goes into the tube and roasts over coals until the bamboo chars. To eat, split it open and dip it in sesame salt, with chicken or grilled meat. Try Truong Mai Quan, or the grill stalls on the market slope.",
      cues: ["inside bamboo", "chars", "to eat", "try"],
    },
    places: [P("Cơm lam", "Trường Mai Quán", "Võ Nguyên Giáp, Khu 1", 4.6), P("Cơm lam nướng", "Hàng nướng dốc chợ", "gợi ý từ MoMo", null)],
  },
  {
    id: "nuong", accent: "#ff9f6b", gallery: ["nuong-1", "nuong-2", "nuong-4", "nuong-3"],
    vi: {
      caption: "Thịt nướng cuốn su su", tagline: "Tối nào phố núi cũng thơm mùi nướng",
      origin: "Món nướng đặc trưng của phố núi (VnExpress)",
      made: "Thịt cuốn ngọn su su, nướng trên than hoa",
      eat: "Đi nhóm gọi set, nướng ngay tại bàn cho ấm",
      narration:
        "Món thứ tư, thịt nướng cuốn su su, món nướng đặc trưng của phố núi. Thịt cuốn ngọn su su rồi nướng trên than hoa. Khi ăn, đi nhóm thì gọi set, nướng ngay tại bàn cho ấm. Quán ngon: Tiệm Nướng Mơ Màng, May Rooftop và Mufa.",
      cues: ["phố núi", "than hoa", "khi ăn", "quán ngon"],
    },
    en: {
      caption: "Chayote-wrapped BBQ", tagline: "Every night smells of the grill",
      origin: "The hill town's signature barbecue (VnExpress)",
      made: "Meat rolled around chayote shoots, grilled over charcoal",
      eat: "Order a set for the group and grill at the table to keep warm",
      narration:
        "Dish number four, meat wrapped around chayote shoots, the hill town's signature barbecue. It's rolled up and grilled over charcoal. To eat, order a set for the group and grill right at the table to stay warm. Try Mo Mang, May Rooftop or Mufa.",
      cues: ["signature", "charcoal", "to eat", "try"],
    },
    places: [P("Đồ nướng", "Tiệm Nướng Mơ Màng", "sườn tây thị trấn", 4.7), P("Đồ nướng", "May Rooftop & BBQ", "30 Võ Nguyên Giáp", 4.7), P("Món lai Á", "Mufa Restaurant", "Võ Nguyên Giáp, Khu 1", 4.9)],
  },
  {
    id: "dem", accent: "#e0a3ff", gallery: ["dem-2", "dem-3", "dem-1", "dem-4"],
    vi: {
      caption: "Ngô, hạt dẻ nướng", tagline: "Quà vặt đêm ở dốc chợ",
      origin: "Đêm xuống lạnh, dốc chợ bày hàng nướng (MoMo, VnExpress)",
      made: "Ngô, khoai nướng than; hạt dẻ rang bơ mật ong",
      eat: "Cầm túi hạt dẻ, vừa ăn vừa dạo quảng trường",
      narration:
        "Món thứ năm, quà vặt đêm. Trời lạnh xuống là dốc chợ bày hàng nướng. Ngô, khoai nướng trên than, hạt dẻ rang thơm lừng. Khi ăn, cầm túi hạt dẻ vừa ăn vừa dạo quảng trường. Ở đâu: dốc chợ Tam Đảo, rồi ngồi ấm ở Coco hay La May.",
      cues: ["dốc chợ", "hạt dẻ", "khi ăn", "ở đâu"],
    },
    en: {
      caption: "Corn & chestnuts", tagline: "Night snacks on the market slope",
      origin: "When it gets cold, grill stalls line the market slope",
      made: "Corn and sweet potato on charcoal; roasted chestnuts",
      eat: "Grab a bag of chestnuts and stroll the square",
      narration:
        "Dish number five, night snacks. When the air turns cold, grill stalls line the market slope. Corn and sweet potato on charcoal, and fragrant roasted chestnuts. To eat, grab a bag and stroll the square. Where: the market slope, then warm up at Coco or La May.",
      cues: ["market slope", "chestnuts", "to eat", "where"],
    },
    places: [P("Ngô, hạt dẻ", "Dốc chợ Tam Đảo", "hàng đêm, gợi ý từ MoMo", null), P("Café", "Coco Tam Đảo", "58 Võ Nguyên Giáp", 4.9), P("Café", "La May Coffee & Tea", "22 Trần Quốc Tuấn", 4.9)],
  },
];

const FOOD_HOOK = {
  vi: "Lên Tam Đảo ăn gì? Đây là năm món phố núi được nhắc nhiều nhất, kèm cách ăn và quán từ bốn sao rưỡi. Lưu lại nhé!",
  en: "What to eat in Tam Dao? Here are the five hill-town dishes people talk about most, with how to eat them and places rated four and a half stars or more.",
};
const FOOD_OUTRO = {
  vi: "Lẩu cá tầm cũng được khen nhiều, quán có món này mình để ở phần mô tả. Bạn muốn thử món nào trước? Lưu lại nhé!",
  en: "Sturgeon hotpot gets lots of love too; places that serve it are in the description. Which dish would you try first? Save it!",
};
const SECTION = {
  vi: ["Nguồn gốc", "Cách làm", "Cách ăn", "Quán ngon"],
  en: ["Origin", "How it's made", "How to eat", "Where"],
};

for (const lang of ["vi", "en"]) {
  const slug = `tam-dao-am-thuc${lang === "en" ? "-en" : ""}`;
  const files = [];
  const scenes = [
    {
      id: "hook", layout: "hook", caption: lang === "vi" ? "TAM ĐẢO ĂN GÌ?" : "TAM DAO EATS",
      kicker: lang === "vi" ? "ẨM THỰC PHỐ NÚI" : "HILL-TOWN FOOD",
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
    id: "outro", layout: "outro", caption: lang === "vi" ? "Bạn chọn món nào?" : "Which one first?",
    cta: lang === "vi" ? "Lưu lại cho chuyến đi nhé!" : "Save it for your trip!",
    narration: FOOD_OUTRO[lang], durationSec: 8, gallery: DISHES.map((d) => IMG(d.gallery[1])),
  });
  const title = lang === "vi" ? "Ẩm thực Tam Đảo: 5 món" : "Tam Dao food: 5 dishes";
  write(slug, { ...base(slug, lang, title, { accent: "#9ad1b0", highlight: "#ffd28a", brand: "TAM ĐẢO" }), template: "food", scenes }, files);
}
