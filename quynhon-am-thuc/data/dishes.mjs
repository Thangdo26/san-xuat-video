// Quy Nhơn food video: five dishes, facts and places shared by VI and EN.
// Sources: research/dishes.md. Ratings: Google Maps scans 31/10/2026 (≥4.5★).
const img = (name) => `videos/quynhon-am-thuc/images/${name}.jpg`;
const P = (place, address, rating) => ({ place, address, rating });

export const DISHES = [
  {
    id: "banh-xeo",
    accent: "#ffb347",
    background: "dots",
    backgroundTo: "#ffe08a",
    gallery: [img("01-banhxeo"), img("01b-banhxeo")],
    stickers: ["🦐", "🥬", "🥭", "🌶️", "🔥"],
    vi: {
      name: "Bánh xèo tôm nhảy",
      tagline: "Tôm còn nhảy trong khuôn",
      narration:
        "Món thứ nhất, bánh xèo tôm nhảy. Cái tên đến từ con tôm đất còn tươi, vừa thả vào khuôn nóng là nhảy tanh tách. Theo VnExpress, xưa chỉ Mỹ Cang cách thành phố khoảng hai mươi cây số có quán, giờ thì khắp Quy Nhơn. Bột gạo pha nghệ, đổ trong khuôn nhỏ, bánh giòn và chỉ to cỡ bàn tay. Khi ăn, cuốn bánh tráng với rau và xoài chua, chấm nước mắm tỏi ớt. Quán ngon: Anh Tú, Phước Sơn, và Ngọc Liên.",
      origin: ["tôm đất", "Tôm đất còn tươi thả vào khuôn nóng là nhảy · xưa nổi tiếng ở Mỹ Cang"],
      made: ["bột gạo", "Bột gạo pha nghệ, đổ khuôn nhỏ · bánh giòn, cỡ bàn tay"],
      eat: ["khi ăn", "Cuốn bánh tráng, rau, xoài chua · chấm nước mắm tỏi ớt"],
      where: "quán ngon",
    },
    en: {
      name: "Bánh xèo tôm nhảy",
      tagline: "Pancakes with jumping shrimp",
      narration:
        "Dish one, jumping shrimp pancakes. The name comes from the fresh little river shrimp, which jump as soon as they hit the hot mould. According to VnExpress, only My Cang, about twenty kilometres from the city, used to make them; now they are all over Quy Nhon. Rice batter with turmeric goes into small moulds, so each pancake is crispy and palm sized. To eat, roll it in rice paper with herbs and green mango, and dip it in garlic chili fish sauce. Try Anh Tu, Phuoc Son, or Ngoc Lien.",
      origin: ["river shrimp", "Fresh river shrimp jump in the hot mould · once only made in My Cang"],
      made: ["rice batter", "Rice batter with turmeric in small moulds · crispy, palm sized"],
      eat: ["to eat", "Roll in rice paper with herbs, green mango · garlic chili fish sauce"],
      where: "try",
    },
    places: [P("Bánh xèo tôm nhảy Anh Tú", "105 Đống Đa", 4.9), P("Bánh Xèo Tôm Nhảy Phước Sơn", "122 Đống Đa", 4.9), P("Bánh Xèo Ngọc Liên", "63/13 Thanh Niên", 4.7)],
  },
  {
    id: "bun-cha-ca",
    accent: "#5fc8e8",
    background: "waves",
    backgroundTo: "#a8ecff",
    gallery: [img("02-buncha"), img("02c-chaca"), img("02b-buncha")],
    stickers: ["🐟", "🍜", "🌿", "🌶️", "🥢"],
    vi: {
      name: "Bún chả cá",
      tagline: "Bữa sáng của dân biển",
      narration:
        "Món thứ hai, bún chả cá, bữa sáng quen thuộc của người Quy Nhơn. Thành phố biển có cá tươi mỗi sáng, nên chả cá làm ngay tại chỗ. Cá được giã tay thành chả, có loại chiên vàng, có loại hấp, nước dùng ninh từ xương và đầu cá nên trong và ngọt thanh. Khi ăn, thêm rau sống, chút ớt và chanh, rồi húp nước dùng nóng. Quán ngon: bún Thùy, ba đời bán bún cá, bún cá tươi Quy Nhơn, và quán Vân.",
      origin: ["cá tươi", "Thành phố biển có cá tươi mỗi sáng · chả làm ngay tại chỗ"],
      made: ["giã tay", "Cá giã tay thành chả chiên, chả hấp · nước dùng ninh xương, đầu cá"],
      eat: ["khi ăn", "Thêm rau sống, ớt, chanh · húp nước dùng nóng"],
      where: "quán ngon",
    },
    en: {
      name: "Bún chả cá",
      tagline: "Breakfast by the sea",
      narration:
        "Dish two, fish cake noodle soup, the classic Quy Nhon breakfast. A seaside city has fresh fish every morning, so the fish cakes are made on the spot. The fish is pounded by hand, then either fried golden or steamed, and the broth is simmered from fish bones and heads, so it is clear and lightly sweet. To eat, add fresh herbs, a little chili and lime, and sip the hot broth. Try Bun Thuy, run by three generations, Bun Ca Tuoi, or Van.",
      origin: ["fresh fish", "Fresh fish every morning · fish cakes made on the spot"],
      made: ["pounded by hand", "Hand-pounded fish cakes, fried or steamed · broth from fish bones"],
      eat: ["to eat", "Add herbs, chili and lime · sip the hot broth"],
      where: "try",
    },
    places: [P("Bún Thùy", "261 Tăng Bạt Hổ", 4.5), P("Bún Cá Tươi Quy Nhơn", "42 Nguyễn Văn Bé", 4.8), P("Bún cá Vân Quy Nhơn", "169A Lê Lợi", 4.6)],
  },
  {
    id: "banh-hoi",
    accent: "#9fd86b",
    background: "gingham",
    backgroundTo: "#e2f7b5",
    gallery: [img("03-banhhoi"), img("03b-banhhoi"), img("03c-banhhoi")],
    stickers: ["🍚", "🧅", "🥣", "🌿", "🌶️"],
    vi: {
      name: "Bánh hỏi cháo lòng",
      tagline: "Bánh hỏi Diêu Trì trứ danh",
      narration:
        "Món thứ ba, bánh hỏi cháo lòng. Theo VnExpress, bánh hỏi là đặc sản Bình Định, ngon nhất ở Diêu Trì. Bột gạo được ép thành những sợi rất mảnh, đan vào nhau thành từng tấm, rưới mỡ hành. Cháo nấu loãng từ nước hầm xương và lòng heo. Khi ăn, gắp bánh hỏi với lòng heo, rau thơm, chấm nước mắm ớt, rồi húp thêm thìa cháo nóng. Quán ngon: cháo lòng bánh hỏi chín mươi bốn Nguyễn Huệ, quán Thùy, và cô Hương.",
      origin: ["diêu trì", "Đặc sản Bình Định · bánh hỏi ngon nhất ở Diêu Trì (VnExpress)"],
      made: ["sợi rất mảnh", "Bột gạo ép sợi mảnh đan thành tấm, rưới mỡ hành · cháo hầm xương, lòng"],
      eat: ["khi ăn", "Bánh hỏi với lòng heo, rau, nước mắm ớt · húp thêm cháo nóng"],
      where: "quán ngon",
    },
    en: {
      name: "Bánh hỏi cháo lòng",
      tagline: "Rice vermicelli mats & congee",
      narration:
        "Dish three, banh hoi with offal congee. According to VnExpress, banh hoi is a Binh Dinh specialty, and the best comes from Dieu Tri. Rice batter is pressed into very fine threads that weave into thin mats, topped with scallion oil. The congee is cooked thin from bone and pork offal broth. To eat, pick up the noodle mats with offal and herbs, dip them in chili fish sauce, then take a spoon of hot congee. Try ninety four Nguyen Hue, Thuy, or Co Huong.",
      origin: ["dieu tri", "A Binh Dinh specialty · best from Dieu Tri (VnExpress)"],
      made: ["very fine threads", "Fine rice threads woven into mats, scallion oil · bone & offal congee"],
      eat: ["to eat", "Noodle mats with offal, herbs, chili fish sauce · then hot congee"],
      where: "try",
    },
    places: [P("Cháo lòng bánh hỏi Quy Nhơn", "94 Nguyễn Huệ", 4.7), P("Bánh hỏi cháo lòng Thùy", "187 Nguyễn Huệ", 4.8), P("Bánh hỏi cháo lòng cô Hương", "17 Phan Bội Châu", 4.7)],
  },
  {
    id: "banh-can",
    accent: "#ff8a7a",
    background: "stripes",
    backgroundTo: "#ffd0c2",
    gallery: [img("04-banhcan"), img("04c-banhcan"), img("04b-banhcan")],
    stickers: ["🥚", "🦑", "🔥", "🌶️", "🧄"],
    vi: {
      name: "Bánh căn",
      tagline: "Khuôn đất trên than hồng",
      narration:
        "Món thứ tư, bánh căn, nhìn giống bánh khọt nhưng là món của miền Trung. Bột gạo xay đổ vào khuôn đất nung, đậy nắp trên than hồng, chờ đến khi mặt bánh rỗ và đáy vàng giòn. Nhân có trứng, mực hoặc tôm. Ở Quy Nhơn còn có kiểu ăn bánh căn với nước cá. Khi ăn, chấm nước mắm tỏi ớt chua ngọt, kèm rau sống. Quán ngon: bánh căn nước cá cô Dư, và bánh căn mực cô Năm.",
      origin: ["miền trung", "Giống bánh khọt miền Nam · nhưng là món của miền Trung"],
      made: ["khuôn đất", "Bột gạo đổ khuôn đất nung trên than · nhân trứng, mực, tôm"],
      eat: ["khi ăn", "Chấm nước mắm tỏi ớt chua ngọt, rau sống · Quy Nhơn còn có nước cá"],
      where: "quán ngon",
    },
    en: {
      name: "Bánh căn",
      tagline: "Clay moulds over charcoal",
      narration:
        "Dish four, banh can, which looks like the southern banh khot but comes from central Vietnam. Rice batter goes into clay moulds, covered over glowing charcoal, until the top is full of little holes and the bottom is golden. Fillings include egg, squid or shrimp. In Quy Nhon you can also eat them with a fish broth. To eat, dip them in sweet and sour garlic chili fish sauce, with fresh herbs. Try Co Du for the fish broth, or Co Nam for squid.",
      origin: ["central vietnam", "Looks like southern banh khot · a central Vietnamese dish"],
      made: ["clay moulds", "Rice batter in clay moulds over charcoal · egg, squid, shrimp"],
      eat: ["to eat", "Sweet & sour garlic chili fish sauce, herbs · or with fish broth"],
      where: "try",
    },
    places: [P("Bánh căn nước cá Cô Dư", "63/1 Nguyễn Huệ", 4.6), P("Bánh căn mực tươi Cô Năm", "67/10 Đặng Văn Ngữ", 4.5)],
  },
  {
    id: "nem-cho-huyen",
    accent: "#ff6f91",
    background: "hearts",
    backgroundTo: "#ffc4d6",
    gallery: [img("05-nem"), img("05b-nem"), img("05c-nem")],
    stickers: ["🐖", "🍃", "🧄", "🌶️", "🎁"],
    whereTitle: { vi: "Nơi mua, nơi ăn", en: "Where to buy & eat" },
    vi: {
      name: "Nem chợ Huyện",
      tagline: "Nem chua của làng nghề Tuy Phước",
      narration:
        "Món thứ năm, nem chợ Huyện. Nghề làm nem chả gắn với chợ Huyện ở xã Phước Lộc, Tuy Phước, rồi lan khắp Bình Định. Thịt heo nạc giã nhuyễn, gói lá ổi bên trong, lá chuối bên ngoài, để lên men tự nhiên vài ngày cho chua. Khi ăn, có thể nướng than, cuốn bánh tráng với rau thơm, khế, chuối chát, chấm nước mắm pha đậu phộng. Nơi mua: nem chợ Huyện Mộc Lan, đặc sản Quy Nhơn Làm Quà, và quán Ông Bảy.",
      origin: ["chợ huyện", "Làng nghề nem chả chợ Huyện, Phước Lộc, Tuy Phước"],
      made: ["giã nhuyễn", "Thịt nạc giã nhuyễn · gói lá ổi, lá chuối, lên men vài ngày"],
      eat: ["khi ăn", "Nướng than hoặc cuốn bánh tráng, rau, khế, chuối chát · chấm mắm đậu phộng"],
      where: "nơi mua",
    },
    en: {
      name: "Nem chợ Huyện",
      tagline: "Cured pork from a craft village",
      narration:
        "Dish five, Cho Huyen nem. The craft of making nem is tied to Cho Huyen market in Phuoc Loc, Tuy Phuoc, and spread across Binh Dinh. Lean pork is pounded fine, wrapped in guava leaves and then banana leaves, and left to ferment for a few days until it turns sour. To eat, grill it over charcoal, or roll it in rice paper with herbs, star fruit and green banana, dipped in fish sauce with peanuts. Buy it at Moc Lan, Lam Qua, or Ong Bay.",
      origin: ["cho huyen", "A nem-making craft village at Cho Huyen, Tuy Phuoc"],
      made: ["pounded fine", "Lean pork pounded fine · guava & banana leaves, fermented a few days"],
      eat: ["to eat", "Grilled, or rolled with herbs, star fruit, banana · peanut fish sauce"],
      where: "buy it",
    },
    places: [P("Nem Chợ Huyện Mộc Lan", "52 Trần Phú", 4.6), P("Đặc Sản Quy Nhơn: Làm Quà", "03a Võ Lai", 4.9), P("Đặc Sản Bình Định Ông Bảy", "23 Phan Văn Lân", 4.8)],
  },
];
