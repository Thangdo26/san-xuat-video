// Builds the Nha Trang food video in Vietnamese and English from one list of
// dishes, so facts, places and ratings stay identical in both.
// Sources for every claim: research/dishes.md. Run: node data/gen-videos.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const img = (name) => `videos/nhatrang-am-thuc/images/${name}.jpg`;
const P = (place, address, rating) => ({ place, address, rating });

// Ratings checked on Google Maps 30/10/2026 (≥4.5★). Review counts are in
// research/dishes.md; gỏi cá mai and bánh ướt have few qualifying shops.
// Each dish gets its own backdrop pattern so the six scenes look different.
const DISHES = [
  {
    id: "nem-nuong",
    accent: "#ff8a65",
    background: "gingham",
    backgroundTo: "#ffcf8a",
    gallery: [img("01c-nem"), img("01b-nem")],
    stickers: ["🍢", "🔥", "🌿", "🥒", "🌶️"],
    vi: {
      name: "Nem nướng Ninh Hòa",
      tagline: "Đặc sản số một xứ Trầm",
      narration:
        "Món thứ nhất, nem nướng Ninh Hòa. Chưa ai biết chính xác món này ra đời khi nào, các cụ ở Ninh Hòa kể rằng người từ Thanh Hóa vào đã mang theo. Thịt heo nạc xay, ướp tỏi, tiêu, nước mắm, đường, quấn quanh que tre rồi nướng trên than hồng. Linh hồn là chén nước chấm sệt, nấu từ nếp, tương, cà chua, thịt, gan heo, tôm và đậu phộng. Khi ăn, cuốn nem với bánh tráng chiên giòn, rau sống, dưa leo, chuối chát, khế rồi chấm. Quán ngon: nem nướng Hồng Vũ, A Long và bà Mười Ninh Hòa.",
      origin: ["chưa ai biết", "Chưa rõ năm ra đời · các cụ kể do người Thanh Hóa mang vào Ninh Hòa"],
      made: ["thịt heo nạc", "Thịt nạc xay ướp tỏi, tiêu, nước mắm, nướng than · chấm sệt từ nếp, gan, tôm"],
      eat: ["khi ăn", "Cuốn bánh tráng chiên giòn, rau sống, dưa leo, chuối chát, khế rồi chấm"],
      where: "quán ngon",
    },
    en: {
      name: "Nem nướng Ninh Hòa",
      tagline: "Grilled pork rolls from Ninh Hoa",
      narration:
        "Dish one, Ninh Hoa grilled pork. No one knows exactly when it first appeared, but elders in Ninh Hoa say settlers from Thanh Hoa brought the recipe. Lean pork is ground with garlic, pepper, fish sauce and sugar, wrapped around bamboo sticks and grilled over charcoal. The star is a thick dipping sauce simmered from sticky rice, soybean paste, tomato, pork, pig liver, shrimp and peanuts. To eat, roll the pork in crispy fried rice paper with herbs, cucumber, green banana and star fruit, then dip. Try Hong Vu, A Long, or Ba Muoi.",
      origin: ["no one knows", "Date unknown · elders say settlers from Thanh Hoa brought it to Ninh Hoa"],
      made: ["lean pork", "Lean pork with garlic, pepper, fish sauce, charcoal grilled · thick rice and liver dip"],
      eat: ["to eat", "Roll in crispy rice paper with herbs, cucumber, green banana, star fruit"],
      where: "try",
    },
    places: [P("Nem Nướng Hồng Vũ", "89 Nhị Hà", 4.9), P("Nem Nướng A Long", "27 Phù Đổng", 4.8), P("Nem Bà Mười Ninh Hòa", "7A Bạch Đằng", 4.8)],
  },
  {
    id: "bun-cha-ca",
    accent: "#4fc3f7",
    background: "waves",
    backgroundTo: "#b2f0e8",
    gallery: [img("02-bcc")],
    stickers: ["🐟", "🍅", "🌊", "🌶️", "🍋"],
    vi: {
      name: "Bún chả cá, bún sứa",
      tagline: "Vị ngọt của biển",
      narration:
        "Món thứ hai, bún chả cá Nha Trang. Vì là thành phố biển, nước dùng ở đây ninh từ cá biển và xương cá, trong và thanh, không béo. Chả làm từ cá thu, cá nhồng hay cá mối, giã nhuyễn rồi hấp hoặc chiên. Gọi thêm sứa giòn mát là thành bún sứa, món hiếm nơi nào có. Khi ăn, thêm rau sống, giá, ớt, vắt chanh và chút nước mắm ớt. Quán ngon: bún cá Nha Trang bảy mươi chín, Hạnh Nhiên và bún cá sứa cô Hạnh.",
      origin: ["thành phố biển", "Thành phố biển: nước dùng ninh từ cá biển, xương cá · trong, thanh, không béo"],
      made: ["chả làm từ", "Chả cá thu, cá nhồng, cá mối giã nhuyễn · thêm sứa giòn là thành bún sứa"],
      eat: ["khi ăn", "Thêm rau sống, giá, ớt, vắt chanh, chút nước mắm ớt"],
      where: "quán ngon",
    },
    en: {
      name: "Bún chả cá, bún sứa",
      tagline: "The sweetness of the sea",
      narration:
        "Dish two, Nha Trang fish cake noodle soup. This is a seaside city, so the broth is simmered from sea fish and fish bones, clear and light, never greasy. The fish cakes are made from mackerel, barracuda or lizardfish, pounded smooth, then steamed or fried. Add crunchy jellyfish and it becomes bun sua, a bowl you rarely find anywhere else. To eat, add herbs, bean sprouts, chili, a squeeze of lime and a little chili fish sauce. Try Bun Ca seventy nine, Hanh Nhien, or Co Hanh.",
      origin: ["seaside city", "A seaside city: broth from sea fish and fish bones · clear, light, never greasy"],
      made: ["fish cakes are made", "Mackerel or barracuda fish cakes · add jellyfish and it becomes bún sứa"],
      eat: ["to eat", "Add herbs, bean sprouts, chili, lime and a little chili fish sauce"],
      where: "try",
    },
    places: [P("Bún Cá Nha Trang 79", "15 Nguyễn Chánh", 4.7), P("Bún Cá Hạnh Nhiên", "32C Lê Đại Hành", 4.5), P("Bún cá sứa Cô Hạnh", "53/8 Nguyễn Thiện Thuật", 4.6)],
  },
  {
    id: "banh-can",
    accent: "#ffc94d",
    background: "dots",
    backgroundTo: "#ff9f6b",
    gallery: [img("03b-bc"), img("03-bc")],
    stickers: ["🥚", "🦑", "🦐", "🔥", "🥭"],
    vi: {
      name: "Bánh căn",
      tagline: "Nướng từng chiếc trong khuôn đất",
      narration:
        "Món thứ ba, bánh căn. Nguồn gốc còn tranh cãi: có tài liệu nói từ người Chăm ở Ninh Thuận, có nơi lại gắn với Đà Lạt, Tây Nguyên. Bột chỉ có gạo và nước, đổ vào khuôn đất nung trên than hồng, thêm trứng cút, tôm hoặc mực, đậy nắp nướng từng chiếc. Khi ăn, chấm nước mắm chua ngọt hoặc mắm nêm, kèm xoài bào sợi và rau sống. Nên đi sớm, nhiều quán chỉ bán buổi sáng. Quán ngon: Út Liên, bánh căn Số Tám và cô Ly.",
      origin: ["tranh cãi", "Còn tranh cãi: người Chăm Ninh Thuận, hay Đà Lạt, Tây Nguyên"],
      made: ["bột chỉ có", "Bột gạo và nước, khuôn đất nung trên than · trứng cút, tôm, mực"],
      eat: ["khi ăn", "Chấm nước mắm chua ngọt hoặc mắm nêm · xoài bào, rau sống · đi sớm"],
      where: "quán ngon",
    },
    en: {
      name: "Bánh căn",
      tagline: "Baked one by one in clay",
      narration:
        "Dish three, banh can, little rice cakes. Their origin is disputed: some sources credit the Cham people of Ninh Thuan, others link them to Da Lat and the Central Highlands. The batter is just rice and water, poured into clay molds over charcoal, topped with quail egg, shrimp or squid, and baked one by one under a lid. To eat, dip them in sweet and sour fish sauce or fermented fish sauce, with shredded green mango and herbs. Go early, many stalls sell only in the morning. Try Ut Lien, Banh Can So Tam, or Co Ly.",
      origin: ["disputed", "Disputed: the Cham of Ninh Thuan, or Da Lat and the Central Highlands"],
      made: ["just rice", "Rice and water batter in clay molds over charcoal · quail egg, shrimp, squid"],
      eat: ["to eat", "Dip in sweet and sour fish sauce · green mango, herbs · go early"],
      where: "try",
    },
    places: [P("Út Liên – Bánh Căn", "977 Đường 2/4", 4.9), P("Bánh căn Số 8", "08 Phan Đình Phùng", 4.8), P("Bánh Căn Cô Ly", "186 Thống Nhất", 4.9)],
  },
  {
    id: "goi-ca-mai",
    accent: "#7fd3ff",
    background: "stars",
    backgroundTo: "#a78bfa",
    illustration: ["🐟", "🍋", "🌿", "🍌", "🥜", "🌶️"],
    stickers: ["🐟", "🍋", "🌊", "🥢"],
    vi: {
      name: "Gỏi cá mai",
      tagline: "Cá tái chanh, cuốn rau",
      narration:
        "Món thứ tư, gỏi cá mai. Chưa rõ ai nghĩ ra món này, chỉ biết cá mai là loài cá nhỏ cỡ ngón tay cái, thịt trắng trong, không tanh. Cá bỏ đầu, rút xương, tái bằng nước cốt chanh hoặc giấm rồi bóp với thính, gừng, hành tây, đậu phộng. Nước chấm sệt nấu từ xương cá, có quán thêm gan heo và đậu phộng. Khi ăn, cuốn cá với bánh tráng, rau sống, chuối chát, khế, dưa leo rồi chấm, ăn kèm bánh tráng nướng. Quán ngon: gỏi cá Hà Ra.",
      origin: ["chưa rõ", "Chưa rõ ai nghĩ ra · cá mai nhỏ cỡ ngón tay, thịt trắng trong, không tanh"],
      made: ["rút xương", "Rút xương, tái chanh hoặc giấm, bóp thính, gừng · nước chấm từ xương cá"],
      eat: ["khi ăn", "Cuốn bánh tráng, rau sống, chuối chát, khế rồi chấm · kèm bánh tráng nướng"],
      where: "quán ngon",
    },
    en: {
      name: "Gỏi cá mai",
      tagline: "Lime-cured fish, rolled in herbs",
      narration:
        "Dish four, goi ca mai, a lime-cured fish salad. No one knows who first made it. Ca mai is a tiny sea fish the size of a thumb, with clear white flesh and no fishy smell. The fish is boned, cured in lime juice or vinegar, then tossed with toasted rice powder, ginger, onion and peanuts. The thick dip is cooked from the fish bones, and some places add pig liver and peanuts. To eat, wrap the fish in rice paper with herbs, green banana, star fruit and cucumber, dip, and enjoy it with grilled rice crackers. Try Goi Ca Ha Ra.",
      origin: ["no one knows", "Origin unknown · ca mai: thumb-sized, clear white flesh, no fishy smell"],
      made: ["is boned", "Boned, cured in lime or vinegar, tossed with rice powder · dip from fish bones"],
      eat: ["to eat", "Wrap in rice paper with herbs, green banana, star fruit · with rice crackers"],
      where: "try",
    },
    places: [P("Gỏi Cá Hà Ra", "997 Đường 2/4", 4.7)],
  },
  {
    id: "banh-canh",
    accent: "#ffab91",
    background: "stripes",
    backgroundTo: "#ffe082",
    gallery: [img("05-bcanh"), img("05b-bcanh")],
    stickers: ["🦀", "🦞", "🐟", "🌶️", "🧅"],
    vi: {
      name: "Bánh canh chả cá, ghẹ",
      tagline: "Sợi dai, nước lèo ngọt",
      narration:
        "Món thứ năm, bánh canh. Món này phổ biến khắp miền Trung, nhưng ở Nha Trang nổi bật với bánh canh chả cá, bánh canh ghẹ, có quán còn nấu cả tôm hùm. Sợi bánh canh dai từ bột gạo, nước lèo ninh với củ cải và hành tây nướng, thêm chả cá chiên hoặc hấp. Khi ăn, thêm hành lá, tiêu, ớt, chấm chả với nước mắm Khánh Hòa và ớt xanh. Quán ngon: Quán Nhỏ bánh canh tôm hùm, Cô Ba Miền Biển và bánh canh bà Thừa.",
      origin: ["phổ biến", "Phổ biến khắp miền Trung · Nha Trang nổi bật bánh canh chả cá, ghẹ, tôm hùm"],
      made: ["sợi bánh canh", "Sợi bột gạo dai · nước lèo củ cải, hành tây nướng · chả cá chiên, hấp"],
      eat: ["khi ăn", "Thêm hành, tiêu, ớt · chấm chả với nước mắm Khánh Hòa, ớt xanh"],
      where: "quán ngon",
    },
    en: {
      name: "Bánh canh chả cá, ghẹ",
      tagline: "Chewy noodles, sweet broth",
      narration:
        "Dish five, banh canh, a thick rice noodle soup. It is common all over central Vietnam, but Nha Trang is known for versions with fish cake or blue crab, and some shops even use lobster. The chewy noodles are made from rice flour, the broth is simmered with daikon and charred onion, and the fish cakes are fried or steamed. To eat, add scallions, pepper and chili, and dip the fish cake in Khanh Hoa fish sauce with green chili. Try Quan Nho, Co Ba Mien Bien, or Ba Thua.",
      origin: ["common all over", "Common all over central Vietnam · Nha Trang: fish cake, blue crab, lobster"],
      made: ["chewy noodles", "Chewy rice noodles · broth with daikon and charred onion · fish cakes"],
      eat: ["to eat", "Add scallions, pepper, chili · dip in Khanh Hoa fish sauce, green chili"],
      where: "try",
    },
    places: [P("Quán Nhỏ – Bánh canh tôm hùm", "8B Đường 12A, Hà Quang 2", 4.9), P("Bánh canh ghẹ Cô Ba Miền Biển", "5 Thái Nguyên", 4.7), P("Bánh canh bà Thừa 2", "19 Cửu Long", 4.8)],
  },
  {
    id: "banh-uot",
    accent: "#ffb3c7",
    background: "hearts",
    backgroundTo: "#ffd6a5",
    illustration: ["🍚", "🧅", "🦐", "🥢", "🌶️", "🍽️"],
    stickers: ["🍽️", "🍚", "🦐", "🧅"],
    vi: {
      name: "Bánh ướt Diên Khánh",
      tagline: "Ăn cả chục đĩa mới no",
      narration:
        "Món thứ sáu, và cũng là món cuối, bánh ướt Diên Khánh. Diên Khánh xưa có nghề làm bánh tráng cổ truyền ở Phú Lộc, dần dần các lò bánh ướt mọc lên dọc quốc lộ, thành phố bánh ướt. Gạo xay thành bột, tráng thật mỏng, vớt bằng đũa tre, rồi quét mỡ hành, rắc ruốc tôm và đậu xanh. Khi ăn, chấm mắm chua ngọt hoặc mắm nêm, kèm chả lụa, ớt, tỏi. Mỗi đĩa chỉ một lớp mỏng nên người ta thường ăn cả chục đĩa. Quán ngon: bánh ướt Quế, trên đường hai mươi ba tháng mười.",
      origin: ["nghề làm bánh tráng", "Từ nghề bánh tráng cổ truyền Phú Lộc · nay thành phố bánh ướt"],
      made: ["tráng thật mỏng", "Tráng thật mỏng, vớt bằng đũa tre · quét mỡ hành, ruốc tôm, đậu xanh"],
      eat: ["khi ăn", "Chấm mắm chua ngọt hoặc mắm nêm, kèm chả lụa · ăn cả chục đĩa"],
      where: "quán ngon",
    },
    en: {
      name: "Bánh ướt Diên Khánh",
      tagline: "Ten plates is normal",
      narration:
        "Dish six, the last one, Dien Khanh steamed rice sheets. Dien Khanh had an old rice paper craft in Phu Loc village, and over time banh uot kitchens lined the highway, earning it the name banh uot street. Rice is ground into a batter, steamed paper thin, lifted off with bamboo chopsticks, then brushed with scallion oil and sprinkled with shrimp floss and mung beans. To eat, dip it in sweet and sour fish sauce or fermented fish sauce, with pork roll, chili and garlic. Each plate holds just one sheet, so people often eat ten plates. Try Banh Uot Que on 23 October Street.",
      origin: ["rice paper craft", "From the old Phu Loc rice paper craft · now a whole banh uot street"],
      made: ["paper thin", "Steamed paper thin, lifted with bamboo chopsticks · scallion oil, shrimp floss"],
      eat: ["to eat", "Dip in sweet and sour fish sauce, with pork roll · ten plates is normal"],
      where: "try",
    },
    places: [P("Bánh ướt Quế", "708 Đường 23/10", 4.8)],
  },
];

const TEXT = {
  vi: {
    title: "Ẩm thực Nha Trang: 6 món phải thử",
    brand: "ẨM THỰC NHA TRANG",
    hook: "Đến Nha Trang ăn gì? Đây là sáu món phải thử, kèm nguồn gốc, cách làm, cách ăn, và quán ngon đã kiểm tra trên Google Maps.",
    hookLabel: "ẨM THỰC VÙNG MIỀN",
    hookCaption: "NHA TRANG",
    hookBadge: "6 MÓN",
    hookTip: "Nguồn gốc · Cách làm · Cách ăn · Quán ngon",
    outro: "Sáu món này đủ cho một chuyến ăn sập Nha Trang. Địa chỉ quán mình để ở phần mô tả. Bạn thích món nào nhất? Lưu lại nhé!",
    outroLabel: "ĂN SẬP NHA TRANG",
    outroTip: "Bạn thích món nào nhất?",
    outroCta: "Lưu lại cho chuyến đi nhé!",
    titles: { origin: "Nguồn gốc", made: "Cách làm", eat: "Cách ăn", where: "Quán ngon" },
    narrator: { provider: "omnivoice", voice: "vi-nu-tre-03" },
  },
  en: {
    title: "Nha Trang food: 6 dishes to try",
    brand: "NHA TRANG FOOD",
    hook: "What to eat in Nha Trang? Here are six dishes you have to try, with where they come from, how they are made, how to eat them, and places checked on Google Maps.",
    hookLabel: "REGIONAL FOOD",
    hookCaption: "NHA TRANG",
    hookBadge: "6 DISHES",
    hookTip: "Origin · How it's made · How to eat · Where",
    outro: "These six dishes are a full food tour of Nha Trang. All the addresses are in the description. Which one would you try first? Save this for your trip!",
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
      stickers: ["🍢", "🥢", "🐟", "🦀", "😋", "✨"],
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
          background: dish.background,
          backgroundTo: dish.backgroundTo,
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
      caption: "NHA TRANG",
      tip: t.outroTip,
      cta: t.outroCta,
      stickers: ["😋", "🌊", "💛", "🥢"],
      frame: "full",
      transition: "iris",
      durationSec: 9,
    },
  ];
  const slug = lang === "en" ? "nhatrang-am-thuc-en" : "nhatrang-am-thuc";
  const data = {
    id: slug,
    title: t.title,
    language: lang,
    region: "Nha Trang, Khánh Hòa, Việt Nam",
    template: "food-explainer",
    format: { width: 1080, height: 1920, fps: 30 },
    transitionFrames: 15,
    theme: { accent: "#4fc3f7", brand: t.brand },
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
const credits = readFileSync("data/videos/nhatrang-am-thuc/credits.json", "utf8");
writeFileSync("data/videos/nhatrang-am-thuc-en/credits.json", credits);
