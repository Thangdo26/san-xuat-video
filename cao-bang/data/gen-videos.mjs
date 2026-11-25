// Builds data/videos/<slug>/video.json (+ credits.json) for the three Cao Bằng videos
// (Vietnamese only, user 06/11/2026): cao-bang-3n2d, cao-bang-4n3d, cao-bang-am-thuc.
// Story, tips and food picks follow research/tiktok.md, itinerary.md, stay.md and food.md
// (Google Maps checked 06/11/2026). Re-running resets durationSec, so run the voice again.
// Run: node data/gen-videos.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const IMG = (f) => (f.includes("/") ? `videos/cao-bang/${f}.jpg` : `videos/cao-bang/candidates/${f}.jpg`);
const allCredits = JSON.parse(readFileSync("data/videos/cao-bang/credits.json", "utf8"));

const NARRATOR = { provider: "omnivoice", voice: "vi-nu-tre-03" };

// One place: dish, place, address, Maps rating (null = suggestion without a rating).
const P = (name, place, address, rating, spokenAs) => ({ name, place, address, rating, spokenAs });

const QUAN_NGON = P("Cơm bản", "Quán Ngon", "bản Pác Bó", 5.0);
const SON_HUE = P("Cơm bản", "Nhà hàng Sơn Huệ", "bản Pác Bó", 4.8);
const NUNG = P("Món Nùng", "Nhà hàng Nùng", "bản Pác Bó", 4.7);
const BEP_ME = P("Cơm", "Bếp của Mế", "Trường Hà", 4.6);
const DUNG_THINH = P("Phở vịt, vịt quay", "Phở Vịt Dung Thịnh", "065 Đường 3/10", 4.7);
const CO_HAC = P("Bánh áp chao", "Áp chao cô Hạc", "124 Hiến Giang", 4.5);
const YEN = P("Cơm nhà", "Yên - Ngon như mẹ nấu", "22 Đường 1-4", 4.6);
const PHO_CU = P("Bánh cuốn", "Bánh cuốn Phố Cũ", "59 Phố Cũ", 4.6);
const THU_THANG = P("Bánh mì", "Bánh mỳ Thu Thắng", "119 Kim Đồng", 4.8);
const CO_NGAN = P("Bánh áp chao", "Áp Chao Cô Ngân", "138 Phố Cũ", 4.5);
const O_THOA = P("Vịt quay", "Vịt quay O Thoa", "121 Kim Đồng", 4.6);
const VI_ME = P("Cơm, lẩu riêu", "Vị Mế", "139 Kim Đồng", 4.7);
const CHIEM_CHAO = P("Cháo", "Chiêm Cháo", "191 Kim Đồng", 4.6);
const HUONG_VIET = P("Nhà hàng", "Hương Việt Palace", "Km3, Nà Cáp", 4.5);
const HOANG_DUONG = P("Cơm, phở", "Hoàng Dương", "Đàm Thủy", 4.7);
const LINH_NGOAN = P("Phở", "Phở Linh Ngoan", "chợ bản Rạ", 4.7);
const BC_SANG = P("Bánh cuốn", "Bánh Cuốn Sáng", "làng đá Khuổi Ky", 4.5);
const COM_VINH = P("Cơm", "Quán Cơm Vinh", "bãi xe Ngườm Ngao", 4.8);
const CHINH_LANH = P("Phở", "Phở Chinh Lành", "Trùng Khánh", 4.9);
const CAY_KHE = P("Nhà hàng", "Nhà hàng Cây Khế", "ĐT206, Trùng Khánh", 4.7);
const NHA_MOC = P("Cơm homestay", "Nhà Mộc Homestay", "Bản Doanh, Trà Lĩnh", 4.6);
const KHUONG_THUY = P("Nhà hàng", "Nhà hàng Khương Thuỷ", "Quảng Uyên", 4.6);
const HUYEN_TRANG = P("Cơm, phở", "Cơm-Phở Huyền Trang", "Bố Lù, Ba Bể", 4.9);
const NAM_PE = P("Cơm nhà sàn", "Nặm Pé Homestay", "ven hồ Ba Bể", 4.8);
const SON_LAM = P("Cơm nhà sàn", "Sơn Lâm Homestay", "ĐT254, Bố Lù", 4.8);

const sp = (p, spokenAs) => ({ ...p, spokenAs });

const STOPS = {
  pacbo: {
    lat: 22.9805, lng: 106.0465, accent: "#4fd1c5",
    gallery: ["pacbo-03", "pacbo-07", "pacbo-04", "pacbo-02", "pacbo-01"],
    label: "Ngày 1 · Sáng", caption: "Suối Lê Nin",
    points: ["Khu di tích Pác Bó, cách TP khoảng 50 km", "Dành khoảng 4 tiếng, tránh ngày lễ"],
    narration:
      "Xe đêm tới thành phố lúc rạng sáng. Ngày một, chạy chừng năm mươi cây số lên khu di tích Pác Bó, suối Lê Nin xanh như ngọc, là đầu nguồn sông Bằng. Nên dành khoảng bốn tiếng, tránh ngày lễ cho vắng. Trưa ăn cơm bản ở Quán Ngon, năm sao trên bản đồ.",
    dishes: [sp(QUAN_NGON, "Quán Ngon"), SON_HUE, NUNG],
    more: [BEP_ME],
  },
  city: {
    lat: 22.6657, lng: 106.2579, accent: "#ffc56b",
    gallery: ["city-03", "city-02", "city-06", "city-01", "city-05"],
    label: "Ngày 1 · Tối", caption: "Phố Cao Bằng",
    points: ["Dạo bờ sông Bằng, cầu Bằng Giang lên đèn", "Thử áp chao, vịt quay, bánh cuốn"],
    narration:
      "Tối về thành phố, dạo bờ sông Bằng lúc cầu Bằng Giang lên đèn. Bữa tối gọi phở vịt, vịt quay ở Dung Thịnh, bốn chấm bảy sao, rồi ghé áp chao cô Hạc mà các bạn trên TikTok hay review. Sáng mai ăn bánh cuốn chan canh trước khi đi.",
    dishes: [sp(DUNG_THINH, "phở vịt"), CO_HAC, YEN],
    more: [PHO_CU, THU_THANG, O_THOA, VI_ME, CHIEM_CHAO, CO_NGAN],
  },
  gioc: {
    lat: 22.8545, lng: 106.7225, accent: "#5ee0b0",
    gallery: ["pexels/6348018", "pexels/37511190", "gioc-11", "pexels/5334888", "gioc-12", "chua-02"],
    label: "Ngày 2 · Sáng", caption: "Thác Bản Giốc",
    points: ["Cách TP khoảng 90 km", "Tới 10h30–13h, đi bè ra gần chân thác"],
    narration:
      "Ngày hai, chạy chừng chín mươi cây số tới thác Bản Giốc. Theo VnExpress, nên tới khoảng mười giờ rưỡi tới một giờ trưa khi thác nhiều nước, rồi đi bè ra sát chân thác, leo thêm lên chùa Phật Tích Trúc Lâm ngay gần đó. Trưa ăn cơm ở Hoàng Dương, bốn chấm bảy sao.",
    dishes: [sp(HOANG_DUONG, "Hoàng Dương"), LINH_NGOAN, BC_SANG],
    more: [COM_VINH, CHINH_LANH],
  },
  nguom: {
    lat: 22.8465, lng: 106.7046, accent: "#ffb15e",
    gallery: ["nguom-05", "nguom-02", "nguom-04", "nguom-03"],
    label: "Ngày 2 · Chiều", caption: "Động Ngườm Ngao",
    points: ["Cách thác khoảng 3 km", "Đường trong động dài khoảng 2 km"],
    narration:
      "Chiều ghé động Ngườm Ngao, cách thác chừng ba cây số, lối đi trong động dài khoảng hai cây số với thạch nhũ lấp lánh. Ra khỏi động thì dạo làng đá Khuổi Ky. Tối ngủ homestay gần thác, ăn cơm ở Quán Cơm Vinh, bốn chấm tám sao.",
    dishes: [sp(COM_VINH, "Cơm Vinh"), CHINH_LANH, CAY_KHE],
    more: [HOANG_DUONG, BC_SANG],
  },
  matthan: {
    lat: 22.78, lng: 106.31, accent: "#9be15d",
    gallery: ["pexels/37724043", "pexels/37511188", "pexels/40310960", "pexels/37724044", "pexels/38622560"],
    label: "Ngày 3 · Sáng", caption: "Núi Mắt Thần",
    points: ["Hang thủng tròn ngay giữa đỉnh núi", "Đường có đoạn lầy, đi xe máy dễ hơn"],
    narration:
      "Ngày ba, qua đèo Mã Phục tới núi Mắt Thần ở Trà Lĩnh, ngọn núi có hang thủng tròn ngay giữa đỉnh, trâu thong thả gặm cỏ dưới chân. Đường vào có đoạn lầy khi mưa, đi xe máy dễ hơn. Trưa ghé Nhà Mộc Homestay, bốn chấm sáu sao, rồi về thành phố bắt xe về Hà Nội.",
    dishes: [sp(NHA_MOC, "Nhà Mộc"), KHUONG_THUY, THU_THANG],
    more: [YEN, VI_ME],
  },
  quay: {
    lat: 22.852, lng: 106.70, accent: "#3fc7e0",
    gallery: ["quay-07", "quay-05", "quay-01", "quay-04"],
    label: "Ngày 3 · Sáng", caption: "Sông Quây Sơn",
    points: ["Nước xanh ngọc chảy qua Đàm Thủy", "Đẹp nhất khoảng tháng 8–9"],
    narration:
      "Ngày ba, dậy sớm thả bộ ven sông Quây Sơn, nước xanh ngọc chảy qua những mái nhà sàn của Đàm Thủy. Theo MIA, sông đẹp nhất vào khoảng tháng tám, tháng chín. Ăn sáng bánh cuốn ở quán Bánh Cuốn Sáng trong làng đá, bốn chấm năm sao.",
    dishes: [sp(BC_SANG, "bánh cuốn"), LINH_NGOAN, HOANG_DUONG],
    more: [COM_VINH],
  },
  babe: {
    lat: 22.41, lng: 105.62, accent: "#7fd18a",
    gallery: ["babe-04", "pexels/28137421", "babe-06", "babe-08", "pexels/1653982"],
    label: "Ngày 4 · Sáng", caption: "Hồ Ba Bể",
    points: ["Ghé trên đường QL3 về Hà Nội", "Đi thuyền, ăn cơm nhà sàn"],
    narration:
      "Ngày bốn, trên đường về Hà Nội rẽ qua hồ Ba Bể, ngồi thuyền giữa núi rừng, ngắm người dân chống thuyền độc mộc. Trưa ăn ở Huyền Trang, bốn chấm chín sao, hoặc cơm nhà sàn ở Nặm Pé, rồi lên xe về Hà Nội.",
    dishes: [sp(HUYEN_TRANG, "Huyền Trang"), NAM_PE, SON_LAM],
    more: [],
  },
};

// 4N3Đ re-labels Mắt Thần (it moves to the afternoon and the night is spent in town).
const FOUR = {
  matthan: {
    label: "Ngày 3 · Chiều",
    narration:
      "Chiều qua đèo Mã Phục tới núi Mắt Thần ở Trà Lĩnh, ngọn núi có hang thủng tròn ngay giữa đỉnh, trâu thong thả gặm cỏ dưới chân. Đường vào có đoạn lầy khi mưa, đi xe máy dễ hơn. Ghé Nhà Mộc Homestay, bốn chấm sáu sao, rồi về thành phố nghỉ đêm.",
  },
};

const STAY = {
  caption: "Nên ở đâu?",
  zones: [
    { title: "Trung tâm thành phố", note: "Gần bờ sông, quán ăn; xe khách tới đây", picks: [["Mina Homestay", 4.8, "trung tâm"], ["Cao Bang Eco House", 4.8, "trung tâm"]] },
    { title: "Đàm Thủy, gần thác", note: "Ngắm thác sớm, ở làng bản; ít quán", picks: [["Lan's Homestay", 4.7, "ven sông Quây Sơn"], ["Minh Khang Homestay", 4.9, "làng đá Khuổi Ky"]] },
  ],
  tip: "Mùa lúa chín, tam giác mạch: đặt sớm",
  narration:
    "Nên ở đâu? Đêm đầu ở trung tâm thành phố cho gần quán ăn, như Mina Homestay hay Cao Bang Eco House. Đêm hai ngủ homestay ở Đàm Thủy gần thác, như Lan's Homestay hay Minh Khang. Mùa lúa chín và mùa tam giác mạch nhớ đặt phòng sớm.",
  cues: ["trung tâm", "đàm thủy", "mùa lúa"],
};

const HOOK = {
  "3n2d": "Cao Bằng có thác Bản Giốc, có núi Mắt Thần, cách Hà Nội chừng hai trăm tám mươi cây số. Đây là lịch trình ba ngày hai đêm gom từ TikTok, kèm quán ăn từ bốn sao rưỡi. Lưu lại nhé!",
  "4n3d": "Có bốn ngày? Đi Cao Bằng thong thả, từ suối Lê Nin, thác Bản Giốc tới sông Quây Sơn, rồi về qua hồ Ba Bể. Đây là lịch trình bốn ngày ba đêm gom từ TikTok. Lưu lại nhé!",
};
const OUTRO =
  "Cao Bằng sáng tối se lạnh, nhớ mang áo khoác và giày đế bám. Đừng quên phở chua, vịt quay và hạt dẻ Trùng Khánh, địa chỉ quán mình để ở phần mô tả. Lưu lại nhé!";

const credit = (files) => allCredits.filter((c) => files.some((f) => c.file === IMG(f)));

const base = (slug, title) => ({
  id: slug,
  title,
  language: "vi",
  region: "Cao Bằng, Việt Nam",
  template: "travel-itinerary",
  format: { width: 1080, height: 1920, fps: 30 },
  transitionFrames: 15,
  theme: THEME,
  narrator: NARRATOR,
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

const THEME = { accent: "#4fd1c5", highlight: "#ffd27a", brand: "CAO BẰNG" };

const PLANS = {
  "3n2d": { stops: ["pacbo", "city", "gioc", "nguom", "matthan"], hook: ["pexels/6348018", "pexels/37724043", "pacbo-07", "nguom-05", "pexels/14776381"], hookNames: ["Thác Bản Giốc", "Núi Mắt Thần", "Suối Lê Nin", "Động Ngườm Ngao"], outro: ["pexels/6348025"], days: 3 },
  "4n3d": { stops: ["pacbo", "city", "gioc", "nguom", "quay", "matthan", "babe"], hook: ["pexels/37511190", "quay-07", "pexels/40310960", "babe-04", "pacbo-03", "pexels/6348323"], hookNames: ["Thác Bản Giốc", "Sông Quây Sơn", "Núi Mắt Thần", "Hồ Ba Bể", "Suối Lê Nin"], outro: ["pexels/14776381"], days: 4 },
};

for (const [plan, cfg] of Object.entries(PLANS)) {
  const slug = `cao-bang-${plan}`;
  const files = [...cfg.hook, ...cfg.outro];
  const nights = cfg.days - 1;
  const scenes = [
    {
      id: "hook",
      layout: "hook",
      kind: "flash",
      caption: "CAO BẰNG",
      kicker: "NON NƯỚC VIỆT BẮC · TỪ TIKTOK",
      label: `${cfg.days}N${nights}Đ`,
      narration: HOOK[plan],
      durationSec: 10,
      gallery: cfg.hook.map(IMG),
      names: cfg.hookNames,
    },
  ];
  for (const id of cfg.stops) {
    const s = { ...STOPS[id], ...(plan === "4n3d" ? FOUR[id] ?? {} : {}) };
    files.push(...s.gallery);
    scenes.push({
      id,
      layout: "point",
      caption: s.caption,
      label: s.label,
      accent: s.accent,
      points: s.points,
      narration: s.narration,
      durationSec: 13,
      gallery: s.gallery.map(IMG),
      geo: { lat: s.lat, lng: s.lng },
      dishes: s.dishes.map((d) => ({ name: d.name, place: d.place, address: d.address, rating: d.rating, ...(d.spokenAs ? { spokenAs: d.spokenAs } : {}) })),
      moreDishes: s.more.map((d) => ({ name: d.name, place: d.place, address: d.address, rating: d.rating })),
    });
  }
  const stayGallery = ["city-01", "quay-06"];
  files.push(...stayGallery);
  scenes.push({
    id: "stay", layout: "stay", caption: STAY.caption, accent: "#4fd1c5", zones: STAY.zones, tip: STAY.tip,
    cues: STAY.cues, narration: STAY.narration, durationSec: 11, gallery: stayGallery.map(IMG),
  });
  scenes.push({
    id: "outro",
    layout: "outro",
    caption: "Lưu lại lịch trình",
    cta: "Lưu lại cho chuyến đi nhé!",
    trail: cfg.stops.map((id) => ({ name: STOPS[id].caption, label: (plan === "4n3d" ? FOUR[id]?.label : null) ?? STOPS[id].label, lat: STOPS[id].lat, lng: STOPS[id].lng })),
    narration: OUTRO,
    durationSec: 10,
    gallery: cfg.outro.map(IMG),
  });
  write(slug, { ...base(slug, `Cao Bằng ${cfg.days}N${nights}Đ`), scenes }, files);
}

// ---------------------------------------------------------------- food video
const DISHES = [
  {
    id: "cuon", accent: "#ffd27a", gallery: ["food/cuon-1", "food/cuon-5", "food/cuon-3"],
    caption: "Bánh cuốn", tagline: "Chan canh, không chấm mắm",
    origin: "Bột gạo tẻ địa phương, tráng mỏng mỗi sáng",
    made: "Nhân thịt băm mộc nhĩ hoặc đập trứng ngay trên lớp bánh",
    eat: "Chan nước canh xương nóng thay vì chấm nước mắm",
    narration:
      "Món thứ nhất, bánh cuốn, bữa sáng của người Cao Bằng, tráng từ bột gạo tẻ địa phương. Bánh cuốn nhân thịt băm mộc nhĩ, hoặc đập trứng ngay trên lớp bánh. Khi ăn, chan nước canh xương nóng chứ không chấm nước mắm. Quán ngon: bánh cuốn Phố Cũ, và Bánh Cuốn Sáng trong làng đá Khuổi Ky.",
    cues: ["bữa sáng", "nhân thịt", "khi ăn", "quán ngon"],
    places: [PHO_CU, BC_SANG],
  },
  {
    id: "chao", accent: "#ff9f5b", gallery: ["food/chao-1", "food/chao-6", "food/chao-2", "food/chao-4"],
    caption: "Bánh áp chao", tagline: "Giòn rụm ngày se lạnh",
    origin: "Món ăn vặt vùng Cao Bằng, Lạng Sơn; bán nhiều tháng 11 tới tháng 2",
    made: "Bột nếp nặn nhân thịt hoặc vịt, rán ngập dầu tới vàng giòn",
    eat: "Ăn nóng, chấm nước chua ngọt, gọi thêm vịt rán",
    narration:
      "Món thứ hai, bánh áp chao, món ăn vặt bán nhiều từ tháng mười một tới tháng hai. Bột nếp nặn nhân thịt hoặc vịt, rán ngập dầu tới khi vàng giòn. Khi ăn, chấm nước chua ngọt lúc còn nóng, gọi thêm đĩa vịt rán. Quán ngon: áp chao cô Hạc mà TikTok hay review, và áp chao cô Ngân ở Phố Cũ.",
    cues: ["ăn vặt", "bột nếp", "khi ăn", "quán ngon"],
    places: [CO_HAC, CO_NGAN],
  },
  {
    id: "khau", accent: "#e07a5f", gallery: ["food/khau-1", "food/khau-3", "food/khau-2"],
    caption: "Khâu nhục", tagline: "Món của mâm cỗ",
    origin: "Gốc từ người Hoa, thành món cỗ quen của người Tày, Nùng",
    made: "Ba chỉ luộc, rán bì, tẩm gia vị rồi hấp nhiều giờ với khoai môn",
    eat: "Miếng thịt mềm tan, ăn với cơm nóng và rau cải",
    narration:
      "Món thứ ba, khâu nhục, món gốc người Hoa đã thành món cỗ quen của người Tày, Nùng. Thịt ba chỉ luộc, rán bì, tẩm gia vị rồi hấp nhiều giờ cùng khoai môn. Khi ăn, miếng thịt mềm tan, ăn với cơm nóng. Quán ngon: Yên Ngon như mẹ nấu và Hương Việt Palace.",
    cues: ["người hoa", "ba chỉ", "khi ăn", "quán ngon"],
    places: [YEN, HUONG_VIET],
  },
  {
    id: "de", accent: "#c98a4b", gallery: ["food/de-1", "food/de-5", "food/de-3", "food/de-6"],
    caption: "Hạt dẻ Trùng Khánh", tagline: "Đặc sản mùa thu",
    origin: "Hạt dẻ trồng ở Trùng Khánh, vào mùa khoảng tháng 10–11",
    made: "Rang trên chảo hoặc hầm cùng gà, giò lợn",
    eat: "Bóc nóng vừa ăn vừa đi; mua làm quà nhớ chọn đúng mùa",
    narration:
      "Món thứ tư, hạt dẻ Trùng Khánh, đặc sản mùa thu, vào mùa khoảng tháng mười, tháng mười một. Hạt dẻ được rang trên chảo, hoặc hầm cùng gà, giò lợn. Khi ăn, bóc nóng vừa ăn vừa đi, mua làm quà nhớ chọn đúng mùa. Nên mua ở chợ Trùng Khánh trên đường đi thác.",
    cues: ["đặc sản mùa thu", "rang", "khi ăn", "nên mua"],
    places: [P("Hạt dẻ", "Chợ Trùng Khánh", "gợi ý từ VnExpress", null)],
  },
  {
    id: "xoi", accent: "#c9a3ff", gallery: ["food/xoi-2", "food/xoi-1", "food/xoi-4", "food/xoi-3"],
    caption: "Xôi ngũ sắc", tagline: "Năm màu từ lá rừng",
    origin: "Món xôi của người Tày trong ngày lễ, ngày chợ",
    made: "Nếp nhuộm màu từ lá cây, đồ chung một chõ",
    eat: "Ăn với thịt gác bếp, muối vừng; hỏi quán trước",
    narration:
      "Món thứ năm, xôi ngũ sắc, món xôi của người Tày trong ngày lễ, ngày chợ. Gạo nếp nhuộm màu từ lá cây rồi đồ chung một chõ. Khi ăn, kèm thịt gác bếp hay muối vừng, nên hỏi quán trước. Thử ở Quán Ngon và Nhà hàng Nùng ngay khu Pác Bó.",
    cues: ["người tày", "nhuộm màu", "khi ăn", "thử ở"],
    places: [QUAN_NGON, NUNG],
  },
];

const FOOD_HOOK = "Lên Cao Bằng ăn gì? Đây là năm món được nhắc nhiều nhất trên TikTok và báo, kèm cách ăn và quán từ bốn sao rưỡi. Lưu lại nhé!";
const FOOD_OUTRO = "Phở chua và vịt quay bảy vị cũng phải thử, quán mình để ở phần mô tả. Bạn chọn món nào trước?";
const SECTION = ["Nguồn gốc", "Cách làm", "Cách ăn", "Quán ngon"];

{
  const slug = "cao-bang-am-thuc";
  const files = [];
  const scenes = [
    {
      id: "hook", layout: "hook", caption: "CAO BẰNG ĂN GÌ?", kicker: "ẨM THỰC VIỆT BẮC",
      label: "5 MÓN", narration: FOOD_HOOK, durationSec: 8,
      gallery: DISHES.map((d) => IMG(d.gallery[0])), names: DISHES.map((d) => d.caption),
    },
  ];
  DISHES.forEach((d, i) => {
    files.push(...d.gallery);
    scenes.push({
      id: d.id, layout: "point", caption: d.caption, label: `${i + 1}/5`, accent: d.accent,
      narration: d.narration, durationSec: 20, gallery: d.gallery.map(IMG),
      story: {
        number: i + 1, total: 5, tagline: d.tagline,
        sections: [
          { part: "origin", title: SECTION[0], cue: d.cues[0], text: d.origin },
          { part: "made", title: SECTION[1], cue: d.cues[1], text: d.made },
          { part: "eat", title: SECTION[2], cue: d.cues[2], text: d.eat },
          { part: "where", title: SECTION[3], cue: d.cues[3], places: d.places.map((p) => ({ name: p.name, place: p.place, address: p.address, rating: p.rating })) },
        ],
      },
    });
  });
  scenes.push({
    id: "outro", layout: "outro", caption: "Bạn chọn món nào?", cta: "Lưu lại cho chuyến đi nhé!",
    narration: FOOD_OUTRO, durationSec: 8, gallery: DISHES.map((d) => IMG(d.gallery[1])),
    names: DISHES.map((d) => d.caption),
  });
  write(slug, { ...base(slug, "Ẩm thực Cao Bằng: 5 món"), template: "food", scenes }, files);
}
