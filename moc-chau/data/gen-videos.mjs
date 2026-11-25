// Builds data/videos/<slug>/video.json (+ credits.json) for the six Mộc Châu videos:
// moc-chau-3n2d, moc-chau-4n3d, moc-chau-am-thuc and their -en versions.
// Story, tips and food picks follow research/tiktok.md, itinerary.md, stay.md and food.md
// (Google Maps checked 03/11/2026). Re-running resets durationSec, so run the voice again.
// Run: node data/gen-videos.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const IMG = (f) => (f.includes("/") ? `videos/moc-chau/${f}.jpg` : `videos/moc-chau/images/${f}.jpg`);
const allCredits = JSON.parse(readFileSync("data/videos/moc-chau/credits.json", "utf8"));

const NARRATOR = {
  vi: { provider: "omnivoice", voice: "vi-nu-tre-03" },
  en: { provider: "edge", voice: "en-US-AvaMultilingualNeural", rate: "+5%" },
};

// One place: dish, place, address, Maps rating (null = suggestion without a rating).
const P = (name, place, address, rating, en, spokenAs) => ({ name, place, address, rating, en, spokenAs });

const PHUONG_NHI = P("Cá hồi, cá tầm", "Phương Nhi", "Hoàng Quốc Việt", 4.9, "Salmon, sturgeon");
const NGUYET_ANH = P("Nướng than", "Nguyệt Anh Quán", "73 Tô Hiệu", 4.9, "Charcoal grill");
const TUSA = P("Lẩu nướng", "TuSa Đây!", "Thảo Nguyên", 4.8, "Hotpot, grill");
const COM_THAI = P("Món Thái", "Cơm Thái Sơn La", "Hoàng Quốc Việt", 4.6, "Thai-style dishes");
const A_PAO = P("Đặc sản Tây Bắc", "A Páo", "26 TK Nhà Nghỉ", 4.5, "Northwest specialties");
const BAN_MOC = P("Món Tây Bắc", "Bản Mộc Quán", "448 Hoàng Quốc Việt", 4.5, "Northwest dishes");
const BEP_NHO = P("Cơm", "Bếp Nhớ", "77 Tiểu khu 70", 4.6, "Home-style rice");
const LAU_NGUA = P("Lẩu", "Lẩu Ngựa 911", "Tiểu khu 70", 5.0, "Hotpot");
const LAU_NAM = P("Lẩu nấm", "Lẩu Nấm Thiên Nhiên", "TDP Nhà Nghỉ", 4.6, "Mushroom hotpot");
const MINH_CHI = P("Bún cá, ăn sáng", "Bún Cá Minh Chi", "45 Lê Thanh Nghị", 4.8, "Fish noodles");
const BE_BE = P("Bún riêu", "Bún riêu bề bề", "359 Hoàng Quốc Việt", 4.8, "Crab noodle soup");
const KA_TO = P("Cà phê", "Ka Tờ Rang Café", "Thảo Nguyên", 4.9, "Coffee");
const VIET_VH = P("Món Việt", "Nhà hàng Việt", "Hua Tạt, Vân Hồ", 4.9, "Vietnamese");
const HIEU_THOA = P("Món Tây Bắc", "Hiếu Thoa Tây Bắc", "Vân Sơn", 4.7, "Northwest dishes");
const VIGOLANDO = P("Món Việt", "Vigolando Vân Hồ", "Chiềng Đi 2", 4.6, "Vietnamese");
const XUAN_BAC = P("Cá hồi, cá tầm", "Xuân Bắc CS1", "Chiềng Đi, QL6", 4.7, "Salmon, sturgeon");
const DINH_HONG = P("Cá hồi, cá tầm", "Đinh Hồng", "Chiềng Đi", 4.5, "Salmon, sturgeon");
const TRINH_HAU = P("Món Việt", "Trịnh Hậu Quán", "Nguyễn Lương Bằng", 4.9, "Vietnamese");
const LEO_XEO = P("Nướng, lẩu", "LÈO XÈO", "104 Nguyễn Hoài Xuân", 4.9, "Grill, hotpot");
const CA_HOI_26 = P("Cá hồi", "Cá Hồi 26", "gần Happy Land", 4.6, "Salmon");
const QUAN_XUA = P("Cơm, nướng", "Quán Xưa", "193 TDP 1, Mộc Sơn", 4.7, "Rice, grill");
const CHINH_LINH = P("Món gia đình", "Chính Linh", "238 Trần Huy Liệu", 4.7, "Family dishes");

const sp = (p, spokenAs) => ({ ...p, spokenAs });

const STOPS = {
  tea: {
    lat: 20.8907, lng: 104.6865, accent: "#8fd16b",
    gallery: ["tea-1", "tea-3", "tea-2", "tea-4"],
    vi: {
      label: "Ngày 1 · Chiều", caption: "Đồi chè Trái Tim",
      points: ["Cách trung tâm khoảng 9–10 km", "Hỏi kỹ trước khi mua vé"],
      narration:
        "Ngày một, xe chạy chừng bốn tiếng rưỡi là lên tới cao nguyên. Chiều ghé đồi chè Trái Tim, cách trung tâm chừng chín, mười cây số, những luống chè uốn cong thành hình trái tim. Đói thì về Cơm Thái Sơn La, bốn chấm sáu sao, ăn món người Thái.",
    },
    en: {
      label: "Day 1 · Afternoon", caption: "Heart Tea Hill",
      points: ["About 9–10 km from the centre", "Check before you buy a ticket"],
      narration:
        "Day one: about four and a half hours by road and you're up on the plateau. In the afternoon, visit the Heart-shaped Tea Hill, nine or ten kilometres from town, its rows curving into a heart. Hungry? Head back to Com Thai Son La, rated four point six, for Thai-style dishes.",
    },
    dishes: [sp(COM_THAI, "Cơm Thái"), A_PAO, BAN_MOC],
    more: [LAU_NAM, BEP_NHO],
    enSpoken: "Com Thai",
  },
  town: {
    lat: 20.8371, lng: 104.6826, accent: "#ffb36b",
    gallery: ["town-2", "town-1", "town-5", "town-3", "town-4"],
    vi: {
      label: "Ngày 1 · Tối", caption: "Chợ đêm Mộc Châu",
      points: ["Ở trung tâm Nông Trường", "Đồ nướng than, mua quà"],
      narration:
        "Tối, dạo chợ đêm ở trung tâm Nông Trường, đồ nướng than thơm cả con phố. Muốn ăn đàng hoàng thì gọi cá hồi, cá tầm ở Phương Nhi, bốn chấm chín sao, hoặc tự nướng ở Nguyệt Anh Quán.",
    },
    en: {
      label: "Day 1 · Night", caption: "Night market",
      points: ["In the Nong Truong town centre", "Charcoal grills and gifts"],
      narration:
        "At night, wander the night market in the town centre; the whole street smells of charcoal. For a proper dinner, order salmon or sturgeon at Phuong Nhi, rated four point nine, or grill your own at Nguyet Anh.",
    },
    dishes: [sp(PHUONG_NHI, "cá hồi"), NGUYET_ANH, TUSA],
    more: [LAU_NGUA, BEP_NHO],
    enSpoken: "salmon",
  },
  cloud: {
    lat: 20.86, lng: 104.66, accent: "#c9b6ff",
    gallery: ["cloud-1", "cloud-2", "cloud-4"],
    vi: {
      label: "Ngày 2 · Bình minh", caption: "Săn mây sớm",
      points: ["Đi từ 5 giờ, mây đẹp tới khoảng 8 giờ", "Mang áo ấm, sáng sớm rất lạnh"],
      narration:
        "Ngày hai, dậy từ năm giờ đi săn mây. Theo các bạn trên TikTok, mây đẹp nhất từ năm tới tám giờ sáng, nhớ mang áo ấm. Về ăn sáng bát bún cá Minh Chi, bốn chấm tám sao, rồi đi tiếp.",
    },
    en: {
      label: "Day 2 · Sunrise", caption: "Chasing clouds",
      points: ["Leave at 5; clouds last till about 8", "Bring a warm layer, dawn is cold"],
      narration:
        "Day two, wake at five to chase the clouds. According to TikTok creators, the sea of clouds is best from five to eight in the morning, so bring a warm layer. Then grab a bowl of fish noodles at Minh Chi, rated four point eight.",
    },
    dishes: [sp(MINH_CHI, "bún cá"), BE_BE, KA_TO],
    more: [BEP_NHO, TUSA],
    enSpoken: "fish noodles",
  },
  khoa: {
    lat: 20.8347, lng: 104.8593, accent: "#5fd3c6",
    gallery: ["khoa-2", "khoa-1", "khoa-3"],
    vi: {
      label: "Ngày 2 · Sáng", caption: "Thác Chiềng Khoa",
      points: ["Khoảng 20–28 km, gần 50 phút", "Nhiều tầng thác, hồ nước xanh"],
      narration:
        "Sáng chạy hơn hai mươi cây số sang thác Chiềng Khoa ở Vân Hồ, nhiều tầng thác đổ xuống hồ nước xanh ngọc. Trưa ăn ở Nhà hàng Việt Vân Hồ, bốn chấm chín sao, trên đường quay về.",
    },
    en: {
      label: "Day 2 · Morning", caption: "Chieng Khoa Falls",
      points: ["20–28 km, nearly 50 minutes", "Tier after tier, a turquoise pool"],
      narration:
        "Then ride twenty-odd kilometres to Chieng Khoa waterfall in Van Ho, tier after tier falling into a turquoise pool. Have lunch at Nha Hang Viet in Van Ho, rated four point nine, on the way back.",
    },
    dishes: [sp(VIET_VH, "Nhà hàng Việt"), HIEU_THOA, VIGOLANDO],
    more: [XUAN_BAC, DINH_HONG],
    enSpoken: "Nha Hang Viet",
  },
  happy: {
    lat: 20.8366, lng: 104.5844, accent: "#ff8fb1",
    gallery: ["happy-1", "happy-2", "happy-3", "happy-4"],
    vi: {
      label: "Ngày 2 · Chiều", caption: "Happy Land",
      points: ["Vườn hoa ở bản Lùn, Mường Sang", "Gần cầu kính Bạch Long"],
      narration:
        "Chiều sang Happy Land ở bản Lùn, Mường Sang, cách trung tâm chừng bảy, tám cây số, vườn hoa có vòng quay và đủ góc chụp. Gần đó là cầu kính Bạch Long, được Guinness công nhận là cầu kính đi bộ dài nhất thế giới. Tối ăn ở Trịnh Hậu Quán, bốn chấm chín sao.",
    },
    en: {
      label: "Day 2 · Afternoon", caption: "Happy Land",
      points: ["Flower park in Ban Lun, Muong Sang", "Near the Bach Long glass bridge"],
      narration:
        "In the afternoon, head to Happy Land in Muong Sang, seven or eight kilometres from town, a flower park with a Ferris wheel. Nearby is Bach Long, which Guinness lists as the world's longest glass-bottomed pedestrian bridge. For dinner, try Trinh Hau Quan, rated four point nine.",
    },
    dishes: [sp(TRINH_HAU, "Trịnh Hậu"), LEO_XEO, CA_HOI_26],
    more: [QUAN_XUA, CHINH_LINH],
    enSpoken: "Trinh Hau",
  },
  farm: {
    lat: 20.835, lng: 104.665, accent: "#f5e6b8",
    gallery: ["farm-1", "farm-3", "farm-2"],
    vi: {
      label: "Ngày 3 · Sáng", caption: "Nông trại bò sữa",
      points: ["Nuôi bò sữa từ năm 1958", "Mua sữa chua, bánh sữa làm quà"],
      narration:
        "Ngày ba, ghé trang trại du lịch bò sữa trên đường Hoàng Quốc Việt. Mộc Châu nuôi bò sữa từ năm một chín năm tám, nên nhớ mua sữa chua, bánh sữa làm quà. Trưa ăn cơm ở Bếp Nhớ, bốn chấm sáu sao, ngay gần đó.",
    },
    en: {
      label: "Day 3 · Morning", caption: "Dairy farm",
      points: ["Dairy cows here since 1958", "Buy yogurt and milk candy as gifts"],
      narration:
        "Day three, stop by the dairy farm on Hoang Quoc Viet street. Moc Chau has raised dairy cows since nineteen fifty-eight, so pick up yogurt and milk candy as gifts. Lunch nearby at Bep Nho, rated four point six.",
    },
    dishes: [sp(BEP_NHO, "Bếp Nhớ"), BE_BE, LAU_NGUA],
    more: [COM_THAI],
    enSpoken: "Bep Nho",
  },
  cai: {
    lat: 20.84, lng: 104.70, accent: "#f2f2f2",
    gallery: ["cai-2", "cai-1", "cai-3"],
    vi: {
      label: "Ngày 3 · Sáng", caption: "Hoa cải trắng",
      points: ["Thường nở khoảng tháng 10–11", "Nhiều vườn thu vé chụp ảnh"],
      narration:
        "Sáng cuối, ghé một đồi hoa cải trắng. Hoa thường nở khoảng tháng mười, tháng mười một, nhiều vườn thu vé vào chụp ảnh. Trưa ăn lẩu nấm ở Lẩu Nấm Thiên Nhiên, bốn chấm sáu sao, rồi lên xe về Hà Nội.",
    },
    en: {
      label: "Day 3 · Morning", caption: "White mustard",
      points: ["Usually blooms Oct–Nov", "Many gardens charge a photo fee"],
      narration:
        "On the last morning, visit a field of white mustard flowers. They usually bloom around October and November, and many gardens charge a small photo fee. Have mushroom hotpot at Lau Nam Thien Nhien, rated four point six, then head back to Hanoi.",
    },
    dishes: [sp(LAU_NAM, "lẩu nấm"), BEP_NHO, LAU_NGUA],
    more: [KA_TO, COM_THAI],
    enSpoken: "mushroom hotpot",
  },
  naka: {
    lat: 20.89, lng: 104.70, accent: "#ffd1e3",
    gallery: ["naka-1", "naka-4", "naka-2", "naka-3"],
    vi: {
      label: "Ngày 4 · Chiều", caption: "Thung lũng Nà Ka",
      points: ["Hoa mận: cuối tháng 1 – giữa tháng 2", "Cách trung tâm khoảng 15–20 km"],
      narration:
        "Nếu đi vào tháng một, tháng hai, đừng bỏ thung lũng mận Nà Ka, cách trung tâm chừng mười lăm, hai mươi cây số, hoa mận phủ trắng cả thung lũng. Ăn tối sớm ở A Páo, bốn chấm năm sao, rồi lên xe về Hà Nội.",
    },
    en: {
      label: "Day 4 · Afternoon", caption: "Na Ka Valley",
      points: ["Plum blossom: late Jan – mid Feb", "About 15–20 km from the centre"],
      narration:
        "If you come in January or February, don't miss Na Ka plum valley, fifteen to twenty kilometres from town, when the blossoms turn it white. Have an early dinner at A Pao, rated four point five, then head back to Hanoi.",
    },
    dishes: [sp(A_PAO, "A Páo"), NGUYET_ANH, COM_THAI],
    more: [LAU_NAM],
    enSpoken: "A Pao",
  },
};

// 4N3Đ re-labels some stops and changes the hand-off lines so each day ends right.
const FOUR = {
  happy: {
    vi: { label: "Ngày 3 · Chiều" },
    en: { label: "Day 3 · Afternoon" },
    gallery: ["happy-1", "happy-2", "happy-3", "bridge-1", "happy-4"],
  },
  cai: {
    vi: {
      label: "Ngày 4 · Sáng",
      narration:
        "Sáng ngày bốn, ghé một đồi hoa cải trắng. Hoa thường nở khoảng tháng mười, tháng mười một, nhiều vườn thu vé vào chụp ảnh. Trưa ăn lẩu nấm ở Lẩu Nấm Thiên Nhiên, bốn chấm sáu sao.",
    },
    en: {
      label: "Day 4 · Morning",
      narration:
        "On day four, visit a field of white mustard flowers. They usually bloom around October and November, and many gardens charge a small photo fee. Lunch is mushroom hotpot at Lau Nam Thien Nhien, rated four point six.",
    },
  },
};

const STAY = {
  vi: {
    caption: "Nên ở đâu?",
    zones: [
      { title: "Trung tâm Nông Trường", note: "Gần chợ đêm, đi bộ ăn tối", picks: [["Mũm Homestay", 4.6, "TDP Minh Châu, Thảo Nguyên"], ["Sunflower Hotel", 4.8, "đường 3/2 Hoa Ban"]] },
      { title: "Bản Áng – Mường Sang", note: "Yên tĩnh, gần rừng thông; cần xe máy", picks: [["Vườn An Nhiên", 4.7, "37 Bản Áng 3"], ["Eco House", 4.6, "bản Là Ngà 1"]] },
    ],
    tip: "Hỏi kỹ vị trí, đặt sớm cuối tuần",
    narration:
      "Nên ở đâu? Lần đầu đi thì ở trung tâm Nông Trường cho gần chợ đêm, như Mũm Homestay hay Sunflower Hotel. Thích yên tĩnh thì ở phía Bản Áng, Mường Sang, như Vườn An Nhiên, nhưng cần thuê xe máy. Nhớ hỏi kỹ vị trí và đặt sớm cuối tuần.",
    cues: ["trung tâm", "bản áng", "nhớ hỏi"],
  },
  en: {
    caption: "Where to stay?",
    zones: [
      { title: "Town centre", note: "Near the night market, walk to dinner", picks: [["Mũm Homestay", 4.6, "TDP Minh Châu, Thảo Nguyên"], ["Sunflower Hotel", 4.8, "đường 3/2 Hoa Ban"]] },
      { title: "Ban Ang – Muong Sang", note: "Quiet, by the pine forest; you need a bike", picks: [["Vườn An Nhiên", 4.7, "37 Bản Áng 3"], ["Eco House", 4.6, "bản Là Ngà 1"]] },
    ],
    tip: "Check the exact location; book weekends early",
    narration:
      "Where to stay? First time, stay in the town centre near the night market, at Mum Homestay or Sunflower Hotel. Want it quiet? Try Ban Ang or Muong Sang, like Vuon An Nhien, but you'll need a motorbike. Check the exact location and book weekends early.",
    cues: ["town centre", "quiet", "check the exact"],
  },
};

const HOOK = {
  "3n2d": {
    vi: "Mộc Châu tháng này có mây, có hoa cải trắng. Cách Hà Nội chừng một trăm chín mươi cây số, khoảng bốn tiếng rưỡi đường bộ. Đây là lịch trình ba ngày hai đêm gom từ TikTok. Lưu lại nhé!",
    en: "Moc Chau right now means morning clouds and white mustard flowers. It's about a hundred and ninety kilometres from Hanoi, four and a half hours by road. Here's a three-day plan built from TikTok. Save it!",
  },
  "4n3d": {
    vi: "Có bốn ngày? Đi Mộc Châu chậm thôi. Cách Hà Nội chừng một trăm chín mươi cây số, đây là lịch trình bốn ngày ba đêm gom từ TikTok, kèm quán ăn từ bốn sao rưỡi. Lưu lại nhé!",
    en: "Got four days? Take Moc Chau slowly. It's about a hundred and ninety kilometres from Hanoi, and here's a four-day plan built from TikTok, with places to eat rated four and a half stars or more. Save it!",
  },
};
const OUTRO = {
  vi: "Mộc Châu sáng sớm và tối khá lạnh, mang áo ấm và thuê xe máy để đi các điểm xa. Nhớ thử bê chao và cá hồi, địa chỉ quán và chỗ ở mình để ở phần mô tả. Lưu lại nhé!",
  en: "Mornings and nights get cold, so pack a warm layer and rent a motorbike for the far stops. Try be chao, flash-fried veal, and the local salmon. All addresses are in the description. Save it!",
};

const credit = (files) => allCredits.filter((c) => files.some((f) => c.file === IMG(f)));

const base = (slug, lang, title, theme) => ({
  id: slug,
  title,
  language: lang,
  region: "Mộc Châu, Sơn La, Việt Nam",
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

const THEME = { accent: "#8fd16b", highlight: "#ffe08a", brand: "MỘC CHÂU" };

const PLANS = {
  "3n2d": { stops: ["tea", "town", "cloud", "khoa", "happy", "cai"], hook: ["cloud-1", "khoa-1", "cai-2"], outro: ["cai-2", "tea-1"], days: 3 },
  "4n3d": { stops: ["tea", "town", "cloud", "khoa", "farm", "happy", "cai", "naka"], hook: ["tea-1", "naka-2", "khoa-1"], outro: ["naka-4", "cloud-1"], days: 4 },
};

for (const [plan, cfg] of Object.entries(PLANS)) {
  for (const lang of ["vi", "en"]) {
    const slug = `moc-chau-${plan}${lang === "en" ? "-en" : ""}`;
    const files = [...cfg.hook, ...cfg.outro];
    const nights = cfg.days - 1;
    const scenes = [
      {
        id: "hook",
        layout: "hook",
        kind: "ticket",
        caption: lang === "vi" ? "MỘC CHÂU" : "MOC CHAU",
        kicker: lang === "vi" ? "CAO NGUYÊN SƠN LA · TỪ TIKTOK" : "SON LA PLATEAU · FROM TIKTOK",
        label: lang === "vi" ? `${cfg.days}N${nights}Đ` : `${cfg.days} DAYS`,
        ticket: lang === "vi"
          ? { from: "HÀ NỘI", to: "MỘC CHÂU", km: "~190 km", time: "~4,5 giờ", via: "QL6 · đèo Thung Khe", seat: "GIƯỜNG 07", cls: "XE GIƯỜNG NẰM" }
          : { from: "HANOI", to: "MOC CHAU", km: "~190 km", time: "~4.5 hrs", via: "Highway 6 · Thung Khe pass", seat: "BERTH 07", cls: "SLEEPER BUS" },
        narration: HOOK[plan][lang],
        durationSec: 10,
        gallery: cfg.hook.map(IMG),
      },
    ];
    for (const id of cfg.stops) {
      const s = STOPS[id];
      const over = plan === "4n3d" ? FOUR[id] : undefined;
      const t = { ...s[lang], ...(over?.[lang] ?? {}) };
      const gallery = over?.gallery ?? s.gallery;
      files.push(...gallery);
      scenes.push({
        id,
        layout: "point",
        caption: t.caption,
        label: t.label,
        accent: s.accent,
        points: t.points,
        narration: t.narration,
        durationSec: 13,
        gallery: gallery.map(IMG),
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
    const stayGallery = plan === "3n2d" ? ["town-2", "cloud-4"] : ["cloud-4", "ban-1"];
    files.push(...stayGallery);
    scenes.push({
      id: "stay", layout: "stay", caption: st.caption, accent: "#8fd16b", zones: st.zones, tip: st.tip,
      cues: st.cues, narration: st.narration, durationSec: 11, gallery: stayGallery.map(IMG),
    });
    scenes.push({
      id: "outro",
      layout: "outro",
      caption: lang === "vi" ? "Lưu lại lịch trình" : "Save the plan",
      cta: lang === "vi" ? "Lưu lại cho chuyến đi nhé!" : "Save it for your trip!",
      checklist: cfg.stops.map((id) => ({ ...STOPS[id][lang], ...(plan === "4n3d" ? FOUR[id]?.[lang] ?? {} : {}) }).caption),
      narration: OUTRO[lang],
      durationSec: 9,
      gallery: cfg.outro.map(IMG),
    });
    const title = lang === "vi" ? `Mộc Châu ${cfg.days}N${nights}Đ` : `Moc Chau in ${cfg.days} days`;
    write(slug, { ...base(slug, lang, title, THEME), scenes }, files);
  }
}

// ---------------------------------------------------------------- food video
const DISHES = [
  {
    id: "cahoi", accent: "#ff9f6b", gallery: ["food/cahoi-3", "food/cahoi-2", "food/cahoi-6", "food/cahoi-5"],
    vi: {
      caption: "Cá hồi, cá tầm", tagline: "Món cá nước lạnh",
      origin: "Đặc sản mới của cao nguyên; quán nhiều ở Chiềng Đi, Vườn Đào",
      made: "Làm gỏi, nướng, chiên da giòn, nấu lẩu hay nấu cháo",
      eat: "Gọi set 5–6 món cho cả nhóm; cuối tuần đặt bàn trước",
      narration:
        "Món thứ nhất, cá hồi và cá tầm, đặc sản mới của cao nguyên, quán mọc nhiều ở Chiềng Đi và Vườn Đào. Cá làm gỏi, nướng, chiên da giòn, nấu lẩu hay nấu cháo. Khi ăn, gọi set năm, sáu món cho cả nhóm, cuối tuần nhớ đặt bàn trước. Quán ngon: Phương Nhi, Xuân Bắc Chiềng Đi và Cá Hồi hai sáu.",
      cues: ["đặc sản mới", "làm gỏi", "khi ăn", "quán ngon"],
    },
    en: {
      caption: "Salmon & sturgeon", tagline: "Cold-water fish of the plateau",
      origin: "The plateau's newer specialty; many places in Chieng Di and Vuon Dao",
      made: "Raw salad, grilled, crispy skin, hotpot or porridge",
      eat: "Order a 5–6 dish set for the group; book ahead on weekends",
      narration:
        "Dish number one, salmon and sturgeon, the plateau's newer specialty, with restaurants clustered in Chieng Di and Vuon Dao. It's served as a raw salad, grilled, as crispy skin, in hotpot or porridge. To eat, order a five or six dish set for the group and book ahead on weekends. Try Phuong Nhi, Xuan Bac in Chieng Di or Ca Hoi twenty-six.",
      cues: ["newer specialty", "raw salad", "to eat", "try"],
    },
    places: [PHUONG_NHI, XUAN_BAC, CA_HOI_26],
  },
  {
    id: "papinh", accent: "#f2c46b", gallery: ["food/papinh-7", "food/papinh-2", "food/papinh-1", "food/papinh-11"],
    vi: {
      caption: "Cá suối nướng", tagline: "Pa pỉnh tộp của người Thái",
      origin: "Món của người Thái, tên nghĩa là \"cá nướng gập\"",
      made: "Cá ướp mắc khén, sả, gừng, gập đôi kẹp tre, nướng than",
      eat: "Ăn nóng với xôi, rau rừng; hỏi quán trước vì không phải hôm nào cũng có",
      narration:
        "Món thứ hai, cá suối nướng, người Thái gọi là pa pỉnh tộp, nghĩa là cá nướng gập. Cá ướp mắc khén, sả, gừng, gập đôi kẹp tre rồi nướng trên than. Khi ăn, kèm xôi và rau rừng, nên hỏi quán trước vì không phải hôm nào cũng có. Thử ở A Páo, Cơm Thái Sơn La hay Hiếu Thoa.",
      cues: ["người thái", "mắc khén", "khi ăn", "thử ở"],
    },
    en: {
      caption: "Grilled stream fish", tagline: "The Thai people's pa pinh top",
      origin: "A Thai dish; the name means \"folded grilled fish\"",
      made: "Marinated in mac khen pepper, lemongrass, ginger; folded in bamboo, grilled",
      eat: "Eat hot with sticky rice and wild greens; ask ahead, it's not always on",
      narration:
        "Dish number two, grilled stream fish, which the Thai people call pa pinh top, folded grilled fish. It's marinated in mac khen pepper, lemongrass and ginger, folded into a bamboo clamp and grilled over charcoal. To eat, have it with sticky rice and wild greens, and ask ahead, it isn't always on. Try A Pao, Com Thai Son La or Hieu Thoa.",
      cues: ["thai people", "mac khen", "to eat", "try"],
    },
    places: [A_PAO, COM_THAI, HIEU_THOA],
  },
  {
    id: "gacbep", accent: "#e07a5f", gallery: ["food/gacbep-7", "food/gacbep-1", "food/gacbep-6", "food/chamcheo-1"],
    vi: {
      caption: "Trâu gác bếp", tagline: "Hun khói trên gác bếp",
      origin: "Đặc sản của người Thái đen",
      made: "Ướp ớt, gừng, mắc khén, treo gác bếp hun khói nhiều ngày",
      eat: "Xé sợi, chấm chẩm chéo; mua làm quà thì chọn chỗ uy tín",
      narration:
        "Món thứ ba, thịt trâu gác bếp, đặc sản của người Thái đen. Thịt ướp ớt, gừng, mắc khén, rồi treo trên gác bếp hun khói nhiều ngày. Khi ăn, xé sợi, chấm chẩm chéo cay nồng, mua làm quà thì chọn chỗ uy tín. Quán ngon: A Páo, Bản Mộc Quán và Hiếu Thoa.",
      cues: ["thái đen", "hun khói", "khi ăn", "quán ngon"],
    },
    en: {
      caption: "Smoked buffalo", tagline: "Cured above the kitchen fire",
      origin: "A specialty of the Black Thai people",
      made: "Rubbed with chili, ginger, mac khen; smoked over the hearth for days",
      eat: "Tear into strips, dip in cham cheo; buy gifts from trusted shops",
      narration:
        "Dish number three, smoked buffalo, a specialty of the Black Thai people. The meat is rubbed with chili, ginger and mac khen pepper, then hung above the hearth and smoked for days. To eat, tear it into strips and dip it in fiery cham cheo; buy gifts from trusted shops. Try A Pao, Ban Moc Quan or Hieu Thoa.",
      cues: ["black thai", "smoked", "to eat", "try"],
    },
    places: [A_PAO, BAN_MOC, HIEU_THOA],
  },
  {
    id: "xoi", accent: "#c9a3ff", gallery: ["food/xoi-2", "food/xoi-1", "food/xoi-4", "food/xoi-3"],
    vi: {
      caption: "Xôi ngũ sắc", tagline: "Năm màu từ lá cây",
      origin: "Món xôi truyền thống của người Thái",
      made: "Nếp nương nhuộm màu từ lá cây, đồ chung một chõ",
      eat: "Chấm muối vừng hay lạc rang, ăn kèm gà, cá nướng",
      narration:
        "Món thứ tư, xôi ngũ sắc, món xôi truyền thống của người Thái. Gạo nếp nương được nhuộm màu từ lá cây, rồi đồ chung một chõ. Khi ăn, chấm muối vừng hay lạc rang, kèm gà hoặc cá nướng. Quán ngon: Phương Nhi, Cơm Thái Sơn La và Nhà hàng Việt ở Vân Hồ.",
      cues: ["người thái", "nhuộm màu", "khi ăn", "quán ngon"],
    },
    en: {
      caption: "Five-colour rice", tagline: "Colours from forest leaves",
      origin: "A traditional sticky rice of the Thai people",
      made: "Upland sticky rice dyed with leaves, steamed together",
      eat: "Dip in sesame salt or crushed peanuts; with chicken or grilled fish",
      narration:
        "Dish number four, five-colour sticky rice, a tradition of the Thai people. Upland sticky rice is dyed with leaves and steamed together in one pot. To eat, dip it in sesame salt or crushed peanuts, with chicken or grilled fish. Try Phuong Nhi, Com Thai Son La or Nha Hang Viet in Van Ho.",
      cues: ["thai people", "dyed", "to eat", "try"],
    },
    places: [PHUONG_NHI, COM_THAI, VIET_VH],
  },
  {
    id: "xien", accent: "#ffb36b", gallery: ["food/xien-3", "food/xien-6", "food/xien-1", "food/xien-7"],
    vi: {
      caption: "Xiên nướng", tagline: "Chợ đêm thơm mùi than",
      origin: "Chợ đêm ở trung tâm Nông Trường bày hàng nướng mỗi tối",
      made: "Thịt xiên que tẩm ướp, nướng trên than hoa",
      eat: "Vừa ăn vừa dạo chợ; lạnh quá thì vào quán nướng",
      narration:
        "Món thứ năm, xiên nướng chợ đêm. Tối xuống là trung tâm Nông Trường bày hàng nướng. Thịt xiên que tẩm ướp, nướng trên than hoa. Khi ăn, cầm xiên vừa ăn vừa dạo chợ, lạnh quá thì vào quán nướng. Quán ngon: Nguyệt Anh Quán, TuSa và Lèo Xèo.",
      cues: ["chợ đêm", "than hoa", "khi ăn", "quán ngon"],
    },
    en: {
      caption: "Night-market skewers", tagline: "Charcoal smoke after dark",
      origin: "Every evening the night market in the town centre fires up its grills",
      made: "Marinated meat on skewers, grilled over charcoal",
      eat: "Eat as you stroll; if it's too cold, sit down at a grill house",
      narration:
        "Dish number five, night-market skewers. When evening falls, the town centre fills with grills. Marinated meat goes onto skewers over charcoal. To eat, stroll the market skewer in hand, and if it's too cold, sit down at a grill house. Try Nguyet Anh, TuSa or Leo Xeo.",
      cues: ["night market", "charcoal", "to eat", "try"],
    },
    places: [NGUYET_ANH, TUSA, LEO_XEO],
  },
];

const FOOD_HOOK = {
  vi: "Lên Mộc Châu ăn gì? Đây là năm món Tây Bắc được nhắc nhiều nhất, kèm cách ăn và quán từ bốn sao rưỡi. Lưu lại nhé!",
  en: "What to eat in Moc Chau? Here are the five northwest dishes people talk about most, with how to eat them and places rated four and a half stars or more.",
};
const FOOD_OUTRO = {
  vi: "Bê chao cũng là món phải thử, quán mình để ở phần mô tả. Về nhớ mua sữa chua, bánh sữa làm quà. Bạn chọn món nào trước?",
  en: "Be chao, flash-fried veal, is a must too; places are in the description. Take home some yogurt and milk candy. Which dish would you try first?",
};
const SECTION = {
  vi: ["Nguồn gốc", "Cách làm", "Cách ăn", "Quán ngon"],
  en: ["Origin", "How it's made", "How to eat", "Where"],
};

for (const lang of ["vi", "en"]) {
  const slug = `moc-chau-am-thuc${lang === "en" ? "-en" : ""}`;
  const files = [];
  const scenes = [
    {
      id: "hook", layout: "hook", caption: lang === "vi" ? "MỘC CHÂU ĂN GÌ?" : "MOC CHAU EATS",
      kicker: lang === "vi" ? "ẨM THỰC TÂY BẮC" : "NORTHWEST FOOD",
      label: lang === "vi" ? "5 MÓN" : "5 DISHES", narration: FOOD_HOOK[lang], durationSec: 8,
      gallery: DISHES.map((d) => IMG(d.gallery[0])),
      names: DISHES.map((d) => d[lang].caption),
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
    names: DISHES.map((d) => d[lang].caption),
  });
  const title = lang === "vi" ? "Ẩm thực Mộc Châu: 5 món" : "Moc Chau food: 5 dishes";
  write(slug, { ...base(slug, lang, title, THEME), template: "food", scenes }, files);
}
