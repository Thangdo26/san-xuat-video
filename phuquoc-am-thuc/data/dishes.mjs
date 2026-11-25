// Phú Quốc food video: six dishes, facts and places shared by VI and EN.
// Sources: research/dishes.md. Ratings: Google Maps list scans 30/10/2026 (≥4.5★).
const img = (name) => `videos/phuquoc-am-thuc/images/${name}.jpg`;
const P = (place, address, rating) => ({ place, address, rating });

export const DISHES = [
  {
    id: "goi-ca-trich",
    accent: "#5fd3c6",
    background: "waves",
    backgroundTo: "#9be7ff",
    gallery: [img("01-goica")],
    stickers: ["🐟", "🥥", "🌿", "🌶️", "🥜"],
    vi: {
      name: "Gỏi cá trích",
      tagline: "Món nhậu đầu bảng của đảo",
      narration:
        "Món thứ nhất, gỏi cá trích. Theo VnExpress, sau mỗi chuyến biển, người Phú Quốc từng làm gỏi từ nhiều loại cá, dần dà chọn cá trích là ngon nhất. Cá trích thật tươi được lóc hai miếng phi lê, trộn sốt chua từ giấm, rồi phủ rau răm, hành tím, ớt và dừa nạo. Khi ăn, cuốn cá với bánh tráng, rau rừng, rau sống, chấm nước mắm Phú Quốc pha đậu phộng. Quán ngon: Động Tôm Hùm, Đảo Hải Sản, và Phượng Hoàng.",
      origin: ["sau mỗi chuyến biển", "Sau chuyến biển, dân đảo làm gỏi nhiều loại cá · dần chọn cá trích ngon nhất"],
      made: ["lóc hai miếng", "Cá tươi lóc phi lê, trộn sốt chua · phủ rau răm, hành tím, ớt, dừa nạo"],
      eat: ["khi ăn", "Cuốn bánh tráng, rau rừng · chấm nước mắm Phú Quốc pha đậu phộng"],
      where: "quán ngon",
    },
    en: {
      name: "Gỏi cá trích",
      tagline: "Herring salad, the island classic",
      narration:
        "Dish one, herring salad. According to VnExpress, islanders once made salads from many kinds of fish after a trip at sea, and over time chose herring as the best. Very fresh herring is cut into two fillets, mixed with a sour dressing, then topped with herbs, shallots, chili and grated coconut. To eat, roll the fish in rice paper with wild greens and herbs, and dip it in Phu Quoc fish sauce with peanuts. Try the Lobster Cave, Dao Hai San, or Phuong Hoang.",
      origin: ["after a trip at sea", "After fishing trips, islanders tried many fish · herring won"],
      made: ["two fillets", "Fresh herring fillets in a sour dressing · herbs, shallot, chili, coconut"],
      eat: ["to eat", "Roll in rice paper with wild greens · dip in fish sauce with peanuts"],
      where: "try",
    },
    places: [P("Hải sản Động Tôm Hùm", "1 Bạch Đằng", 4.8), P("Đảo Hải Sản", "Hẻm 111 Trần Phú", 4.7), P("Hải Sản Phượng Hoàng", "127G Trần Hưng Đạo", 4.5)],
  },
  {
    id: "bun-quay",
    accent: "#ffb14d",
    background: "stripes",
    backgroundTo: "#ffe08a",
    gallery: [img("02-bunquay-1"), img("02-bunquay-3")],
    stickers: ["🍜", "🦐", "🍋", "🌶️", "🥄"],
    vi: {
      name: "Bún quậy",
      tagline: "Tự quậy chén nước chấm",
      narration:
        "Món thứ hai, bún quậy. Nguồn gốc còn nhiều cách kể: có bài nói món này từ miền Trung mang ra đảo, có bài nói quán Kiến Xây gần Dinh Cậu là nơi làm nổi tiếng. Bún tươi làm tại chỗ, chan nước dùng, thả chả tôm, chả cá viên. Gọi là bún quậy vì khi ăn, bạn tự quậy chén nước chấm gồm bột ngọt, đường, tắc, ớt và nước mắm theo khẩu vị. Quán ngon: bún quậy Bạch Đằng, Thiện Mỹ, và cô Thắm.",
      origin: ["nhiều cách kể", "Nhiều cách kể: từ miền Trung ra đảo · Kiến Xây gần Dinh Cậu làm nổi tiếng"],
      made: ["bún tươi", "Bún tươi làm tại chỗ, chan nước dùng · chả tôm, chả cá viên"],
      eat: ["khi ăn", "Tự quậy chén chấm: đường, tắc, ớt, nước mắm theo khẩu vị"],
      where: "quán ngon",
    },
    en: {
      name: "Bún quậy",
      tagline: "Stir your own dipping sauce",
      narration:
        "Dish two, bun quay, or stirred noodles. Its origin has several versions: some say it came to the island from central Vietnam, others that the Kien Xay shop near Dinh Cau made it famous. Fresh noodles are pressed on the spot, covered in broth, with shrimp paste and fish balls. It is called stirred noodles because to eat, you stir your own dipping sauce of sugar, kumquat, chili and fish sauce to taste. Try Bach Dang, Thien My, or Co Tham.",
      origin: ["several versions", "Several versions: from central Vietnam · Kien Xay near Dinh Cau made it famous"],
      made: ["fresh noodles", "Fresh noodles pressed on the spot · shrimp paste, fish balls"],
      eat: ["to eat", "Stir your own dip: sugar, kumquat, chili, fish sauce"],
      where: "try",
    },
    places: [P("Bún Quậy Bạch Đằng", "32A Bạch Đằng", 4.9), P("Bún quậy Thiện Mỹ", "103 Trần Hưng Đạo", 4.7), P("Bún Quậy Cô Thắm", "Xóm Làng Chài", 4.8)],
  },
  {
    id: "nhum-nuong",
    accent: "#b48cff",
    background: "gingham",
    backgroundTo: "#ffc2e0",
    gallery: [img("03-nhum"), img("03b-ocnuong")],
    stickers: ["🔥", "🧅", "🥜", "🌊"],
    vi: {
      name: "Nhum nướng mỡ hành",
      tagline: "Nhím biển của chợ đêm",
      narration:
        "Món thứ ba, nhum nướng mỡ hành. Nhum là tên dân biển gọi con cầu gai, hay nhím biển, khai thác tươi quanh đảo. Nhum được cắt đôi, giữ phần thịt bên trong, rưới mỡ hành rồi nướng trên than, rắc thêm hành phi và đậu phộng rang. Khi ăn, múc từng muỗng thịt nhum béo ngậy, có quán còn nấu cháo nhum. Mẹo nhỏ: hỏi rõ là nhum hay ốc gai, vì nhiều nơi gọi lẫn. Quán ngon: hàu nướng nhum nướng tám K, và Thuận Kiều.",
      origin: ["cầu gai", "Nhum là cầu gai, hay nhím biển · khai thác tươi quanh đảo"],
      made: ["cắt đôi", "Cắt đôi, rưới mỡ hành, nướng than · rắc hành phi, đậu phộng"],
      eat: ["khi ăn", "Múc từng muỗng thịt béo · hỏi rõ nhum hay ốc gai khi gọi"],
      where: "quán ngon",
    },
    en: {
      name: "Nhum nướng mỡ hành",
      tagline: "Grilled sea urchin",
      narration:
        "Dish three, grilled sea urchin with scallion oil. Nhum is the local name for sea urchin, gathered fresh around the island. Each one is cut in half, drizzled with scallion oil and grilled over charcoal, then topped with fried shallots and roasted peanuts. To eat, spoon out the rich, creamy meat; some places also make sea urchin porridge. Tip: ask whether it is sea urchin or murex snail, since some menus mix them up. Try Hau Nuong Nhum Nuong eight K, or Thuan Kieu.",
      origin: ["sea urchin", "Nhum is the local name for sea urchin · gathered fresh around the island"],
      made: ["cut in half", "Cut in half, scallion oil, charcoal grilled · fried shallots, peanuts"],
      eat: ["to eat", "Spoon out the creamy meat · ask: sea urchin or murex snail?"],
      where: "try",
    },
    places: [P("Hàu – Nhum nướng 8K", "Trần Hưng Đạo", 5.0), P("Hải sản Thuận Kiều 2", "70B Trần Hưng Đạo", 4.7)],
  },
  {
    id: "hai-san",
    accent: "#ff7a8a",
    background: "stars",
    backgroundTo: "#ffb38a",
    gallery: [img("04-tomhum"), img("04c-be"), img("04b-quay")],
    stickers: ["🦀", "🦞", "🍋", "⚓"],
    vi: {
      name: "Hải sản chọn tại bể",
      tagline: "Ghẹ Hàm Ninh, tôm hùm, ốc",
      narration:
        "Món thứ tư là hải sản chọn tại bể. Phú Quốc có nhiều làng chài, nổi tiếng nhất là ghẹ Hàm Ninh ở bờ đông đảo, đánh bắt gần bờ nên thịt chắc, ngọt, nhiều gạch. Ở chợ đêm và quán hải sản, bạn chọn con còn sống trong bể, cân ký, rồi nhờ quán luộc, hấp hay nướng. Khi ăn, ghẹ chấm muối tiêu chanh là đủ ngọt. Mẹo nhỏ: hỏi giá theo ký và tiền chế biến trước khi chọn. Quán ngon: MYLA, vựa hải sản Su và Bee, và ốc hải sản Kờ Tin.",
      origin: ["làng chài", "Làng chài khắp đảo · ghẹ Hàm Ninh bờ đông: chắc thịt, nhiều gạch"],
      made: ["chọn con còn sống", "Chọn con còn sống trong bể, cân ký · luộc, hấp hay nướng"],
      eat: ["khi ăn", "Ghẹ chấm muối tiêu chanh · hỏi giá ký và tiền chế biến trước"],
      where: "quán ngon",
    },
    en: {
      name: "Hải sản chọn tại bể",
      tagline: "Pick it live: crab, lobster, snails",
      narration:
        "Dish four is seafood you pick live from the tank. Phu Quoc has many fishing villages, and the most famous catch is Ham Ninh crab from the east coast, caught close to shore, so the meat is firm, sweet and full of roe. At the night market and seafood restaurants, you choose a live one from the tank, it is weighed, and the kitchen boils, steams or grills it. To eat, crab with salt, pepper and lime is all you need. Tip: ask the price per kilo and the cooking fee first. Try MYLA, Su and Bee seafood, or KTIN.",
      origin: ["fishing villages", "Fishing villages all over · Ham Ninh crab: firm, sweet, full of roe"],
      made: ["choose a live one", "Pick a live one from the tank, weighed · boiled, steamed or grilled"],
      eat: ["to eat", "Crab with salt, pepper and lime · ask price per kilo and cooking fee"],
      where: "try",
    },
    places: [P("MYLA Seafood", "98 Trần Hưng Đạo", 4.9), P("Vựa hải sản nhà Su & Bee", "30 Bạch Đằng", 4.5), P("Ốc Hải Sản KTIN 1", "147a Trần Hưng Đạo", 4.6)],
  },
  {
    id: "nuoc-mam",
    accent: "#e8a04c",
    background: "hearts",
    backgroundTo: "#ffd39a",
    gallery: [img("07b-thung"), img("07-nuocmam")],
    whereTitle: { vi: "Nơi mua", en: "Where to buy" },
    stickers: ["🐟", "🧂", "🛢️", "🎁"],
    vi: {
      name: "Nước mắm Phú Quốc",
      tagline: "Đặc sản mang về",
      narration:
        "Món thứ năm là đặc sản để mang về, nước mắm Phú Quốc. Nghề làm nước mắm Phú Quốc đã được công nhận là di sản văn hóa phi vật thể quốc gia. Cá cơm tươi ủ với muối trong thùng gỗ lớn từ mười hai tới mười tám tháng, rồi mới rút lấy nước mắm nhĩ. Khi ăn, dùng làm nước chấm cho gỏi cá, bánh canh, hải sản. Nơi mua: nhà thùng Huỳnh Khoa, Thành Khoa, và trung tâm đặc sản Khải Hoàn.",
      origin: ["di sản", "Nghề làm nước mắm Phú Quốc: di sản văn hóa phi vật thể quốc gia"],
      made: ["cá cơm", "Cá cơm ủ muối trong thùng gỗ 12–18 tháng · rồi rút nước mắm nhĩ"],
      eat: ["khi ăn", "Làm nước chấm cho gỏi cá, bánh canh, hải sản · mua làm quà"],
      where: "nơi mua",
    },
    en: {
      name: "Nước mắm Phú Quốc",
      tagline: "The one to take home",
      narration:
        "Number five is the one to take home, Phu Quoc fish sauce. Fish sauce making in Phu Quoc is recognised as national intangible cultural heritage. Fresh anchovies are layered with salt in big wooden vats for twelve to eighteen months before the first sauce is drawn off. To eat, use it as the dip for fish salad, noodle soup and seafood. Buy it at the Huynh Khoa or Thanh Khoa fish sauce houses, or the Khai Hoan specialty centre.",
      origin: ["heritage", "Phu Quoc fish sauce making: national intangible cultural heritage"],
      made: ["anchovies", "Anchovies and salt aged 12–18 months in wooden vats"],
      eat: ["to eat", "The dip for fish salad, noodle soup, seafood · a great gift"],
      where: "buy it",
    },
    places: [P("Nước mắm Huỳnh Khoa", "Dương Đông", 4.9), P("Nước mắm Thành Khoa", "Dương Đông", 4.9), P("Đặc sản Khải Hoàn", "289 TL47", 4.8)],
  },
];
