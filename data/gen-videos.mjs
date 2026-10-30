// Builds the Đà Nẵng food video in Vietnamese and English from one list of
// dishes, so facts, places and ratings stay identical in both.
// Sources for every claim: research/dishes.md. Run: node data/gen-videos.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const img = (name) => `videos/danang-am-thuc/images/${name}.jpg`;
const P = (place, address, rating) => ({ place, address, rating });

// Ratings checked on Google Maps 29/10/2026 (≥4.5★, ≥80 reviews).
const DISHES = [
  {
    id: "mi-quang",
    accent: "#ffc24d",
    gallery: [img("01-mi"), img("01b-mi"), img("01c-mi")],
    stickers: ["🍜", "🦐", "🥚", "🥜", "🌶️"],
    vi: {
      name: "Mì Quảng",
      tagline: "Linh hồn ẩm thực xứ Quảng",
      narration:
        "Món thứ nhất, mì Quảng. Món này có nhiều giả thuyết về nguồn gốc, gắn với các làng mì ven sông Thu Bồn như Phú Chiêm. Sợi mì làm từ bột gạo, tráng thành bánh rồi xắt to bản, thường nhuộm vàng bằng nghệ. Nước nhưn chỉ chan xâm xấp, có tôm thịt hoặc gà. Khi ăn, bẻ bánh tráng mè, thêm rau sống, đậu phộng, chanh ớt rồi trộn đều. Quán ngon: mì Quảng sứa Hồng Nga, Cô Sáu và Mỹ Sơn.",
      origin: ["giả thuyết", "Nhiều giả thuyết, gắn với làng mì Phú Chiêm ven sông Thu Bồn (Quảng Nam)"],
      made: ["sợi mì", "Bột gạo tráng bánh, xắt to bản, nhuộm nghệ · nước nhưn chỉ xâm xấp"],
      eat: ["khi ăn", "Bẻ bánh tráng mè, thêm rau, đậu phộng, chanh ớt, trộn đều"],
      where: "quán ngon",
    },
    en: {
      name: "Mì Quảng",
      tagline: "The soul of Quang Nam cooking",
      narration:
        "Dish one, mi Quang. Its origin is still debated, but it is tied to noodle villages on the Thu Bon river, such as Phu Chiem. The rice noodles are steamed as sheets, cut wide and often tinted yellow with turmeric. There is only a splash of broth, with shrimp and pork or chicken. To eat it, crumble a sesame rice cracker on top, add herbs, peanuts, lime and chili, and mix it all. Try Hong Nga, Co Sau, or My Son.",
      origin: ["origin", "Debated, but tied to Phu Chiem and other noodle villages on the Thu Bon river"],
      made: ["rice noodles", "Steamed rice sheets cut wide, tinted with turmeric · just a splash of broth"],
      eat: ["to eat it", "Crumble a sesame cracker, add herbs, peanuts, lime and chili, mix"],
      where: "try",
    },
    places: [P("Mì Quảng Sứa Hồng Nga", "67 Yên Bái", 4.9), P("Mỳ Quảng Cô Sáu", "397 Trần Hưng Đạo", 4.5), P("Mì Quảng Mỹ Sơn", "155 Đỗ Bá", 4.7)],
  },
  {
    id: "banh-trang-cuon",
    accent: "#9fe07a",
    gallery: [img("02-btc"), img("02b-btc")],
    stickers: ["🐷", "🥬", "🌯", "🍍", "🌿"],
    vi: {
      name: "Bánh tráng cuốn thịt heo",
      tagline: "Cuốn tay, chấm mắm nêm",
      narration:
        "Món thứ hai, bánh tráng cuốn thịt heo. Chưa rõ ai nghĩ ra món này, xưa chỉ người Quảng Nam, Đà Nẵng biết, nay thành đặc sản. Thịt heo luộc hoặc hấp, thái mỏng có cả da, mỡ, nạc, ngon nhất với bánh tráng Đại Lộc phơi sương. Khi ăn, trải bánh tráng, xếp rau sống, thêm thịt, cuốn chặt rồi chấm mắm nêm pha thơm, tỏi ớt. Quán ngon: quán Cốm Đại Lộc, Donald Trung và Bếp Bé Anh.",
      origin: ["chưa rõ", "Chưa rõ ai nghĩ ra · xưa chỉ người Quảng Nam, Đà Nẵng biết"],
      made: ["luộc hoặc hấp", "Thịt heo luộc hoặc hấp, thái mỏng · bánh tráng Đại Lộc phơi sương"],
      eat: ["khi ăn", "Bánh tráng + rau sống + thịt, cuốn chặt, chấm mắm nêm pha thơm"],
      where: "quán ngon",
    },
    en: {
      name: "Bánh tráng cuốn thịt heo",
      tagline: "Pork rolls you wrap yourself",
      narration:
        "Dish two, pork rice paper rolls. Nobody knows who first made them. They were once known only in Quang Nam and Da Nang, and are now a local specialty. Pork is boiled or steamed and sliced thin, best with dew-softened rice paper from Dai Loc. To eat, lay out the rice paper, add herbs and pork, roll it tight, and dip it in fermented fish sauce with pineapple and chili. Try Com Dai Loc, Donald Trung, or Bep Be Anh.",
      origin: ["nobody knows", "Nobody knows who first made it · once known only in Quang Nam and Da Nang"],
      made: ["boiled or steamed", "Pork boiled or steamed, sliced thin · dew-softened Dai Loc rice paper"],
      eat: ["to eat", "Rice paper + herbs + pork, roll tight, dip in mắm nêm with pineapple"],
      where: "try",
    },
    places: [P("Quán Cốm Đại Lộc", "103 Trưng Nữ Vương", 4.7), P("Donald Trung", "352 Hải Phòng", 4.7), P("Bếp Bé Anh", "04 Mai Thúc Lân", 4.9)],
  },
  {
    id: "bun-cha-ca",
    accent: "#ffa36b",
    gallery: [img("03-bcc"), img("03b-bcc")],
    stickers: ["🐟", "🎃", "🍅", "🌶️", "🧅"],
    vi: {
      name: "Bún chả cá",
      tagline: "Bữa sáng của dân biển",
      narration:
        "Món thứ ba, bún chả cá. Đà Nẵng gần biển, cá tươi nhiều nên chả cá thành món ăn sáng quen thuộc. Thịt cá thu, cá mối giã nhuyễn với gia vị, quết dẻo rồi hấp hoặc chiên vàng. Nước dùng ninh từ xương cá, thêm bí đỏ, thơm, cà chua cho ngọt. Khi ăn, thêm hành tím ngâm giấm, tỏi ớt, ai thích thì thêm chút mắm ruốc. Quán ngon: Dì Tấm và Má Hai.",
      origin: ["gần biển", "Gần biển, cá tươi nhiều · món ăn sáng quen thuộc của người Đà Nẵng"],
      made: ["giã nhuyễn", "Cá thu, cá mối giã nhuyễn, hấp hoặc chiên · nước dùng xương cá, bí đỏ, thơm"],
      eat: ["khi ăn", "Thêm hành tím ngâm giấm, tỏi ớt, chút mắm ruốc nếu thích"],
      where: "quán ngon",
    },
    en: {
      name: "Bún chả cá",
      tagline: "A seaside breakfast",
      narration:
        "Dish three, fish cake noodle soup. Da Nang sits right by the sea, so fresh fish is everywhere and fish cake became a breakfast staple. Mackerel or lizardfish is pounded with seasoning, kneaded until springy, then steamed or fried golden. The broth is simmered from fish bones with pumpkin, pineapple and tomato. To eat, add pickled shallots and chili garlic, and a little shrimp paste if you like. Try Di Tam or Ma Hai.",
      origin: ["by the sea", "Right by the sea, fresh fish everywhere · a local breakfast staple"],
      made: ["pounded", "Mackerel or lizardfish pounded, steamed or fried · fish bone broth with pumpkin"],
      eat: ["to eat", "Add pickled shallots, chili garlic, a little shrimp paste if you like"],
      where: "try",
    },
    places: [P("Bún Chả Cá Dì Tấm", "583 Trần Cao Vân", 4.9), P("Bún Chả Cá Má Hai", "66 An Trung 1", 5.0)],
  },
  {
    id: "bun-mam-nem",
    accent: "#d9a7ff",
    gallery: [img("04-bm")],
    stickers: ["🐟", "🐷", "🥗", "🌶️", "🍍"],
    vi: {
      name: "Bún mắm nêm",
      tagline: "Đậm đà, ăn là ghiền",
      narration:
        "Món thứ tư, bún mắm nêm. Mắm nêm là đặc sản của dải duyên hải miền Trung, làm từ cá biển ướp muối, ủ lâu ngày. Tô bún có thịt heo luộc, heo quay, chả, đu đủ bào, mít non và rau thơm. Khi ăn, chan mắm nêm pha thơm, ớt, rồi trộn thật đều cho thấm. Quán ngon: bún mắm Liêm, bún mắm Hồng và Bé Hà.",
      origin: ["duyên hải", "Mắm nêm: đặc sản duyên hải miền Trung, cá biển ướp muối, ủ lâu ngày"],
      made: ["tô bún", "Thịt heo luộc, heo quay, chả, đu đủ bào, mít non, rau thơm"],
      eat: ["khi ăn", "Chan mắm nêm pha thơm, ớt, trộn thật đều cho thấm"],
      where: "quán ngon",
    },
    en: {
      name: "Bún mắm nêm",
      tagline: "Bold, funky, addictive",
      narration:
        "Dish four, noodles with fermented fish sauce. Mam nem is a specialty of the central coast, made from sea fish salted and fermented for a long time. The bowl has boiled pork, roast pork, pork roll, shredded papaya, young jackfruit and herbs. To eat, pour on the sauce mixed with pineapple and chili, then toss everything well. Try Liem, Hong, or Be Ha.",
      origin: ["central coast", "Mắm nêm: a central coast specialty, sea fish salted and fermented"],
      made: ["the bowl", "Boiled and roast pork, pork roll, green papaya, young jackfruit, herbs"],
      eat: ["to eat", "Pour on the sauce with pineapple and chili, toss well"],
      where: "try",
    },
    places: [P("Bún mắm Liêm", "41 Đoàn Thị Điểm", 4.8), P("Bún mắm Hồng heo quay", "23/6 Trần Kế Xương", 4.9), P("Bún mắm Bé Hà", "130 Bùi Hữu Nghĩa", 4.6)],
  },
  {
    id: "banh-xeo",
    accent: "#ffd84d",
    gallery: [img("05-bx"), img("05b-bx")],
    stickers: ["🥞", "🦐", "🌿", "🥜", "🔥"],
    vi: {
      name: "Bánh xèo",
      tagline: "Nhỏ, giòn, kiểu miền Trung",
      narration:
        "Món thứ năm, bánh xèo kiểu miền Trung, nhỏ và giòn hơn bánh miền Nam. Bột gạo pha nghệ, đổ vào khuôn nóng, thêm tôm, thịt, giá, chiên đến khi vàng giòn. Điểm khác là nước chấm sệt làm từ gan, đậu phộng và mè. Khi ăn, cuốn bánh với bánh tráng, rau sống, nem lụi rồi chấm. Quán ngon: bánh xèo bảy mươi sáu, từng vào danh sách Bib Gourmand của Michelin, bà Tuyết và bánh xèo Làng.",
      origin: ["miền trung", "Kiểu miền Trung: nhỏ, giòn hơn bánh miền Nam"],
      made: ["bột gạo", "Bột gạo pha nghệ, tôm thịt giá, chiên giòn · nước chấm gan, đậu phộng, mè"],
      eat: ["khi ăn", "Cuốn với bánh tráng, rau sống, nem lụi rồi chấm"],
      where: "quán ngon",
    },
    en: {
      name: "Bánh xèo",
      tagline: "Small, crispy, central style",
      narration:
        "Dish five, central style crispy pancakes, smaller and crunchier than the southern kind. Rice batter with turmeric goes into a hot pan with shrimp, pork and bean sprouts, and fries until golden. What sets them apart is the thick dipping sauce made from liver, peanuts and sesame. To eat, wrap a pancake in rice paper with herbs and grilled pork skewers, then dip. Try Banh Xeo seventy six, a Michelin Bib Gourmand pick, Ba Tuyet, or Banh Xeo Lang.",
      origin: ["central style", "Central style: smaller and crunchier than the southern kind"],
      made: ["rice batter", "Rice batter with turmeric, shrimp, pork, sprouts · liver and peanut dip"],
      eat: ["to eat", "Wrap in rice paper with herbs and pork skewers, then dip"],
      where: "try",
    },
    places: [P("Bánh Xèo 76", "85A Lê Văn Hưu", 4.6), P("Bánh Xèo Bà Tuyết", "25/16 Trần Quốc Toản", 4.7), P("Bánh Xèo Làng", "58 Trần Quốc Toản", 4.9)],
  },
  {
    id: "goi-ca",
    accent: "#7fd3ff",
    illustration: ["🐟", "🌿", "🫚", "🌶️", "🥜", "🍃"],
    stickers: ["🐟", "🌊", "🌿", "🥢"],
    vi: {
      name: "Gỏi cá Nam Ô",
      tagline: "Vị biển của làng chài",
      narration:
        "Món thứ sáu, gỏi cá Nam Ô, của làng chài Nam Ô dưới chân đèo Hải Vân. Cá trích tươi bỏ đầu, xương, thái miếng, ướp gừng, riềng, tỏi và thính. Nước chấm nấu từ nước cốt cá với nước mắm Nam Ô, ớt và bột năng, rắc thêm mè, đậu phộng. Khi ăn, cuốn cá với rau rừng, bánh tráng rồi chấm. Quán ngon: gỏi cá A Sinh, quán Cô Hồng và Gỏi cá Miền Trung.",
      origin: ["làng chài", "Làng chài Nam Ô dưới chân đèo Hải Vân"],
      made: ["cá trích", "Cá trích tươi thái miếng, ướp gừng, riềng, tỏi, thính · nước chấm từ nước cốt cá"],
      eat: ["khi ăn", "Cuốn cá với rau rừng, bánh tráng rồi chấm"],
      where: "quán ngon",
    },
    en: {
      name: "Gỏi cá Nam Ô",
      tagline: "A fishing village classic",
      narration:
        "Dish six, Nam O raw fish salad, from the fishing village of Nam O at the foot of the Hai Van pass. Fresh herring is boned and sliced, then marinated with ginger, galangal, garlic and toasted rice powder. The dip is cooked from the fish juices with Nam O fish sauce, chili and tapioca starch, topped with sesame and peanuts. To eat, roll the fish with wild herbs in rice paper and dip. Try A Sinh, Co Hong, or Goi Ca Mien Trung.",
      origin: ["fishing village", "From the Nam O fishing village at the foot of the Hai Van pass"],
      made: ["fresh herring", "Fresh herring sliced, marinated with ginger, galangal, garlic · dip from fish juices"],
      eat: ["to eat", "Roll the fish with wild herbs in rice paper, then dip"],
      where: "try",
    },
    places: [P("Gỏi cá Nam Ô A. Sinh", "130 Huỳnh Thúc Kháng", 4.8), P("Quán Cô Hồng", "38 Lê Hồng Phong", 4.5), P("Gỏi Cá Miền Trung", "28 Nguyễn Phong Sắc", 4.7)],
  },
];

const TEXT = {
  vi: {
    title: "Ẩm thực Đà Nẵng: 6 món phải thử",
    brand: "ẨM THỰC ĐÀ NẴNG",
    hook: "Đến Đà Nẵng ăn gì? Đây là sáu món phải thử, kèm nguồn gốc, cách làm, cách ăn, và quán ngon đã kiểm tra trên Google Maps.",
    hookLabel: "ẨM THỰC VÙNG MIỀN",
    hookCaption: "ĐÀ NẴNG",
    hookBadge: "6 MÓN",
    hookTip: "Nguồn gốc · Cách làm · Cách ăn · Quán ngon",
    outro: "Sáu món này đủ cho một chuyến ăn sập Đà Nẵng. Địa chỉ quán mình để ở phần mô tả. Bạn thích món nào nhất? Lưu lại nhé!",
    outroLabel: "ĂN SẬP ĐÀ NẴNG",
    outroTip: "Bạn thích món nào nhất?",
    outroCta: "Lưu lại cho chuyến đi nhé!",
    titles: { origin: "Nguồn gốc", made: "Cách làm", eat: "Cách ăn", where: "Quán ngon" },
    narrator: { provider: "omnivoice", voice: "vi-nu-tre-03" },
  },
  en: {
    title: "Da Nang food: 6 dishes to try",
    brand: "DA NANG FOOD",
    hook: "What to eat in Da Nang? Here are six dishes you have to try, with where they come from, how they are made, how to eat them, and places checked on Google Maps.",
    hookLabel: "REGIONAL FOOD",
    hookCaption: "DA NANG",
    hookBadge: "6 DISHES",
    hookTip: "Origin · How it's made · How to eat · Where",
    outro: "These six dishes are a full food tour of Da Nang. All the addresses are in the description. Which one would you try first? Save this for your trip!",
    outroLabel: "EAT LIKE A LOCAL",
    outroTip: "Which one would you try first?",
    outroCta: "Save it for your trip!",
    titles: { origin: "Origin", made: "How it's made", eat: "How to eat", where: "Where to eat" },
    narrator: { provider: "edge", voice: "en-US-AvaMultilingualNeural", rate: "+5%" },
  },
};

const build = (lang) => {
  const t = TEXT[lang];
  const scenes = [
    {
      id: "hook",
      layout: "hook",
      gallery: [img("00-hook")],
      narration: t.hook,
      label: t.hookLabel,
      caption: t.hookCaption,
      badge: t.hookBadge,
      tip: t.hookTip,
      stickers: ["🍜", "🥢", "🐟", "🌶️", "😋", "✨"],
      frame: "full",
      durationSec: 8,
    },
    ...DISHES.map((dish, index) => {
      const d = dish[lang];
      const section = (part, [cue, text]) => ({ part, title: t.titles[part], text, cue });
      return {
        id: dish.id,
        layout: "dish",
        ...(dish.gallery ? { gallery: dish.gallery } : {}),
        narration: d.narration,
        caption: d.name,
        accent: dish.accent,
        stickers: dish.stickers,
        story: {
          number: index + 1,
          total: DISHES.length,
          tagline: d.tagline,
          ...(dish.illustration ? { illustration: dish.illustration } : {}),
          sections: [
            section("origin", d.origin),
            section("made", d.made),
            section("eat", d.eat),
            { part: "where", title: t.titles.where, cue: d.where, places: dish.places.map((p) => ({ name: d.name, ...p })) },
          ],
        },
        transition: index % 2 === 0 ? "slide" : "wipe",
        durationSec: 22,
      };
    }),
    {
      id: "outro",
      layout: "outro",
      gallery: [img("09-outro")],
      narration: t.outro,
      label: t.outroLabel,
      caption: "ĐÀ NẴNG",
      tip: t.outroTip,
      cta: t.outroCta,
      stickers: ["😋", "🍜", "💛", "🥢"],
      frame: "full",
      transition: "iris",
      durationSec: 9,
    },
  ];
  const slug = lang === "en" ? "danang-am-thuc-en" : "danang-am-thuc";
  const data = {
    id: slug,
    title: t.title,
    language: lang,
    region: "Đà Nẵng, Việt Nam",
    template: "food-explainer",
    format: { width: 1080, height: 1920, fps: 30 },
    transitionFrames: 15,
    theme: { accent: "#ffc24d", brand: t.brand },
    narrator: t.narrator,
    subtitles: true,
    music: { src: "shared/music/travel-upbeat.mp3", volume: 0.8 },
    scenes,
  };
  mkdirSync(`data/videos/${slug}`, { recursive: true });
  writeFileSync(`data/videos/${slug}/video.json`, JSON.stringify(data, null, 2) + "\n");
  console.log(slug, scenes.length, "scenes");
};

for (const lang of ["vi", "en"]) build(lang);

// Both videos credit the same photos.
const credits = JSON.parse(readFileSync("data/videos/danang-am-thuc/credits.json", "utf8"));
if (!credits.some((c) => c.slot === "09-outro")) {
  credits.push({
    slot: "09-outro",
    file: "videos/danang-am-thuc/images/09-outro.jpg",
    title: "File:Han River Bridge in Vietnam Night View.jpg",
    author: "kizamaya",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0",
    source: "https://commons.wikimedia.org/wiki/File%3AHan_River_Bridge_in_Vietnam_Night_View.jpg",
  });
  writeFileSync("data/videos/danang-am-thuc/credits.json", JSON.stringify(credits, null, 2) + "\n");
}
writeFileSync("data/videos/danang-am-thuc-en/credits.json", JSON.stringify(credits, null, 2) + "\n");
