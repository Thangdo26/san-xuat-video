// Ẩm thực Đà Lạt: 6 món (20/11/2026), giọng Adam (ElevenLabs), vui mà tự nhiên (người dùng yêu cầu 20/11/2026).
// Researched from 24 TikTok food videos read in full (≥3 per dish, script + comments), Google Maps checked 20/11/2026.
// Facts: research/food.md, tiktok.md (F#). Footage: TikTok clips credited on screen and in the caption, Pexels for bánh tráng.
// Run: node data/gen-dla.mjs
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const slug = "da-lat-am-thuc";
const dir = `data/videos/${slug}`;
mkdirSync(dir, { recursive: true });
const voice = existsSync(`${dir}/voiceover.json`) ? JSON.parse(readFileSync(`${dir}/voiceover.json`, "utf8")).clips : {};

const SRC = {
  "fcold-cloud": ["homestaymoctrafarm", "7645567772805631252"], "fcold-mist": ["minhsangg1002", "7589121496648387860"],
  "xm-pot": ["minhphat.foodaholic", "7674567627116711175"], "xm-bowl": ["minhphat.foodaholic", "7674567627116711175"],
  "xm-pot2": ["didalatcungtruc", "7698730533492247828"], "xm-ladle": ["didalatcungtruc", "7698730533492247828"], "xm-dip": ["didalatcungtruc", "7698730533492247828"],
  "xm-pot3": ["toiladandalat", "7631455203354545440"],
  "bc-pour": ["haovacay", "7689018631061097780"], "bc-plate": ["haovacay", "7689018631061097780"], "bc-grill": ["ghiendalat_official", "7677505588086967572"],
  "bc-coal": ["ngocduy_diachianuong", "7599515795651071253"], "bc-molds": ["ngocduy_diachianuong", "7599515795651071253"], "bc-man": ["khaikhampha", "7672374694330273031"],
  "bu-mix": ["didalatcungtruc", "7654541247402577173"], "bu-mix2": ["didalatcungtruc", "7654541247402577173"], "bu-bowl3": ["didalatcungtruc", "7654541247402577173"],
  "bu-bowl": ["chuyennhatui0912", "7704315926535261460"], "bu-bowl2": ["chuyennhatui0912", "7704315926535261460"], "bu-pour": ["roanchoi.19", "7642651491437776148"],
  "nem-plate": ["dihetdalatcungnip", "7704542871193537800"], "nem-roll": ["dihetdalatcungnip", "7704542871193537800"],
  "nem-grill": ["ban.tai.cho.tam.hon", "7686374998637808917"], "nem-table": ["ban.tai.cho.tam.hon", "7686374998637808917"],
  "lau-le": ["haidanghaydi", "7596651592124763399"], "lau-pot2": ["haidanghaydi", "7596651592124763399"],
  "lau-pot": ["henryhaydi", "7604112052512214279"], "lau-green": ["henryhaydi", "7604112052512214279"], "lau-dip": ["vinhthichanngon", "7527594999035251975"],
  "btn-grill": ["lananhne95", "7555353793521667336"], "btn-eggs": ["lananhne95", "7555353793521667336"], "btn-cook": ["lananhne95", "7555353793521667336"],
  "btn-plate": ["afanglaila", "7653854417329949972"], "btn-dip": ["afanglaila", "7653854417329949972"],
  "btn-night": ["dattr.1", "7700581668268018964"], "btn-grill2": ["dattr.1", "7700581668268018964"], "btn-eggs2": ["dattr.1", "7700581668268018964"],
  "px-btn1": ["pexels:Anh Nguyen", "36339392"], "px-btn2": ["pexels:Anh Nguyen", "36339397"],
};
const F = (f) => `videos/da-lat/footage/${f}.mp4`;
const g = (list) => list.map(F);
const q = (place, address, rating) => ({ place, address, rating });

const scenes = [
  {
    // No cold open: the user asked (20/11/2026, after review) to drop the two viral clips and start on the intro.
    id: "hook", layout: "hook", caption: "ĐÀ LẠT ĂN GÌ", kicker: "6 MÓN · QUÁN ≥4.5★",
    narration: "Hello hô lê các con vợ! Lên Đà Lạt mà chỉ biết cà phê với đồ nướng là phí nửa chuyến. Mình đã xem hơn hai chục video TikTok, đọc cả nghìn bình luận khen có chê có, để chọn ra sáu món phải ăn, kèm quán trên bốn chấm năm sao Google Maps. Lưu lại đi nha!",
    gallery: g(["bc-pour", "btn-night", "lau-le"]),
  },
  {
    id: "xiumai", layout: "dish", n: 1, time: "06:30", caption: "Bánh mì xíu mại", tag: "Ăn sáng",
    facts: ["Xíu mại trong nước hầm xương", "Da heo, đu đủ bào, sa tế", "Xé bánh mì chấm vào chén"],
    narration: "Sáng sớm trời mười mấy độ, dân Đà Lạt làm chén xíu mại. Mấy viên thịt to tròn trong nước hầm xương, thêm da heo, đu đủ bào, chút sa tế, rồi xé bánh mì nóng chấm vào. Quán Ri bảy chín có tới hai nghìn lượt đánh giá, dân địa phương ăn đông lắm, đi sớm không thì hết bàn.",
    gallery: g(["xm-pot2", "xm-ladle", "xm-pot", "xm-dip", "xm-bowl"]),
    recap: ["xm-pot3", "xm-bowl", "xm-dip", "xm-ladle"],
    cue: "Ri bảy chín",
    places: [q("Bánh mì xíu mại Ri 79", "2 Thông Thiên Học", 4.6), q("Bánh mì xíu mại Phương", "40 Nguyễn Trãi", 4.9), q("Xíu mại Hồng Hoa (Yến)", "77 Bùi Thị Xuân", 4.9)],
  },
  {
    id: "banhcan", layout: "dish", n: 2, time: "08:00", caption: "Bánh căn", tag: "Ăn sáng",
    facts: ["Đổ khuôn đất trên bếp than", "Trứng cút hoặc hải sản", "Mắm nêm hoặc nước mắm, xoài bào"],
    narration: "Món thứ hai là bánh căn, đổ trong khuôn đất trên bếp than nên vỏ giòn xém. Gọi trứng cút hay hải sản, chấm mắm nêm hoặc nước mắm với xoài bào là cuốn. Bánh căn Cô Thương thì đông nghẹt, có người đợi cả tiếng. Muốn yên hơn thì ghé bánh căn ngoại ô trên đường Hoàng Hoa Thám, từ ba mươi nghìn một phần.",
    gallery: g(["bc-pour", "bc-coal", "bc-grill", "bc-man", "bc-plate"]),
    recap: ["bc-plate", "bc-pour", "bc-grill", "bc-coal"],
    cue: "Cô Thương",
    places: [q("Bánh Căn Cô Thương", "2A Hoàng Hoa Thám", 4.5), q("Bánh căn ngoại ô quán", "56 Hoàng Hoa Thám", 4.6), q("Bánh Căn Nhỏ", "KQH Phạm Hồng Thái", 4.8)],
  },
  {
    id: "banhuot", layout: "dish", n: 3, time: "10:00", caption: "Bánh ướt lòng gà", tag: "Ăn nguội",
    facts: ["Gà ta xé, tim, mề, trứng non", "Bánh ăn nguội, chan nước mắm", "Quen ăn nóng thì báo trước nha"],
    narration: "Bánh ướt lòng gà là đặc sản xứ này, nhưng nói trước nè: bánh ăn nguội, gà ta xé trộn, chan nước mắm chua ngọt. Ai quen ăn nóng hay chê lạnh, còn người mê thì ăn tám chín năm không chán. Thử Thu Phương gà ta dai ngọt, hay Góc Phố bốn chấm chín sao, quán mới mà khen nức nở.",
    gallery: g(["bu-mix", "bu-mix2", "bu-bowl2", "bu-pour", "bu-bowl3"]),
    recap: ["bu-mix", "bu-bowl3", "bu-pour", "bu-mix2"],
    cue: "Thu Phương",
    places: [q("Bánh ướt lòng gà Thu Phương", "202/23 Phan Đình Phùng", 4.5), q("Bánh ướt lòng gà Góc Phố", "94 Xô Viết Nghệ Tĩnh", 4.9), q("Bánh ướt lòng gà Hà Phương", "Đặng Thùy Trâm", 4.7)],
  },
  {
    id: "nem", layout: "dish", n: 4, time: "14:00", caption: "Nem nướng", tag: "Ăn xế",
    facts: ["Nem nướng than", "Cuốn bánh tráng chiên giòn, rau, đồ chua", "Nước chấm béo béo, ngọt ngọt"],
    narration: "Xế chiều làm dĩa nem nướng: nem nướng than, bánh tráng chiên giòn, rau với đồ chua, cuốn lại chấm nước sốt béo béo. Tân Long trong hẻm Bùi Thị Xuân là quán quen của dân Đà Lạt, dù có người chê nước chấm ngọt như chè. Cùng con hẻm có Hà Tốt bốn chấm chín sao, nem đặc thịt, ăn đã luôn.",
    gallery: g(["nem-grill", "nem-plate", "nem-table", "nem-roll"]),
    recap: ["nem-plate", "nem-roll", "nem-grill"],
    cue: "Tân Long",
    places: [q("Nem nướng Tân Long", "290 Bùi Thị Xuân", 4.5), q("Nem nướng Hà Tốt", "272/6 Bùi Thị Xuân", 4.9), q("Nem nướng Hoàng Hải", "12 La Sơn Phu Tử", 4.7)],
  },
  {
    id: "lau", layout: "dish", n: 5, time: "19:00", caption: "Lẩu gà lá é", tag: "Ăn tối",
    facts: ["Gốc Phú Yên, thành đặc sản Đà Lạt", "Lá é thơm như húng chanh, tía tô", "Nồi nhỏ ~200–250k"],
    narration: "Tối trời lạnh thì phải có nồi lẩu gà lá é. Món này gốc Phú Yên, nhưng lên Đà Lạt lại thành đặc sản. Lá é thơm như lai giữa húng chanh với tía tô, thả vào nồi gà ta là thơm lừng. Cao Phụng nồi hai trăm nghìn, ba đứa ăn ê hề. Cả thành phố quán nào cũng tên Tao Ngộ, nên xem kỹ số sao nha.",
    gallery: g(["lau-le", "lau-pot", "lau-green", "lau-pot2", "lau-dip"]),
    recap: ["lau-pot", "lau-green", "lau-le"],
    cue: "Cao Phụng",
    places: [q("Lẩu gà lá é Cao Phụng", "KQH Hoàng Văn Thụ", 4.5), q("Lẩu gà lá é Tao Ngộ", "28B Hải Thượng", 4.8), q("Lẩu gà lá é Ò ó o", "11 Kim Đồng", 4.7)],
  },
  {
    id: "btn", layout: "dish", n: 6, time: "22:00", caption: "Bánh tráng nướng", tag: "Ăn khuya",
    facts: ["\"Pizza Việt Nam\" nướng than", "Trứng cút, hành, phô mai kéo sợi", "Ở quán địa phương 10–25k"],
    narration: "Khuya đói thì gọi bánh tráng nướng, người ta hay gọi vui là pizza Việt Nam. Bánh tráng nướng than, trứng cút, hành, phô mai kéo sợi. Cô Chi bán mười tới hai lăm nghìn, khách du lịch cũng giá như dân địa phương. Còn ở quảng trường có người mua sáu lăm nghìn một cái đó nha.",
    gallery: g(["btn-cook", "btn-grill", "px-btn1", "btn-eggs", "btn-dip", "btn-grill2"]),
    recap: ["btn-plate", "btn-eggs", "btn-grill2", "px-btn1"],
    cue: "Cô Chi",
    places: [q("Bánh tráng nướng Cô Chi", "20 Xô Viết Nghệ Tĩnh", 4.8), q("Bánh tráng nướng Cô Hương", "46 Nguyễn Văn Trỗi", 4.5), q("Hia Lee – Bánh tráng nướng", "hẻm 12C Triệu Việt Vương", 4.7)],
  },
  {
    id: "outro", layout: "outro", caption: "Ăn cho đã nha!", kicker: "MẸO DÂN SÀNH ĂN",
    tips: ["Xem sao Google Maps trước", "Hỏi giá trước ở chợ đêm", "Đi sớm, quán ngon hết nhanh"],
    tipCues: ["google maps", "hỏi giá", "đi sớm"],
    narration: "Mẹo của dân sành ăn nè: xem số sao Google Maps trước, đừng chỉ tin review; hỏi giá trước khi ngồi ở chợ đêm; và đi sớm, quán ngon hết hàng nhanh lắm. Clip là của các bạn TikToker, nguồn mình để ở mô tả. Lưu lại rồi lên Đà Lạt ăn cho đã đi các con vợ!",
    gallery: g(["btn-eggs2", "px-btn2", "bc-coal"]),
  },
];

const LEAD = 0.5;
// Between two dishes: a 3–4 photo list of the dish just covered, then the next dish (user request 20/11/2026).
// Stills are late frames of the dish's clips (public/videos/da-lat/recap/<name>.jpg); clips that show a stickered face are left out.
const RECAP = 3.0;
for (const s of scenes) {
  const v = voice[s.id]?.durationSec;
  const base = v ?? s.narration.length / 15.5;
  s.durationSec = Math.ceil((base + LEAD + (s.voiceDelay ?? 0) + 1.0) * 2) / 2 + (s.recap ? RECAP : 0);
  if (s.recap) s.recapSec = RECAP;
}

const used = new Set(scenes.flatMap((s) => [...(s.gallery ?? []), ...(s.cold ?? []), ...(s.recap ?? []).map(F)]));
const credits = [...used].map((file) => {
  const name = file.split("/").pop().replace(".mp4", "");
  const [who, id] = SRC[name];
  if (who.startsWith("pexels:")) return { file, author: `Pexels · ${who.slice(7)}`, source: `https://www.pexels.com/video/${id}/`, license: "Pexels License" };
  return { file, author: `@${who}`, source: `https://www.tiktok.com/@${who}/video/${id}`, license: "TikTok, dùng có ghi nguồn (người dùng đồng ý 16/11/2026)" };
});

const video = {
  id: slug, title: "Ẩm thực Đà Lạt: 6 món", language: "vi", region: "Đà Lạt, Lâm Đồng, Việt Nam", template: "food",
  format: { width: 1080, height: 1920, fps: 30 }, transitionFrames: 15,
  theme: { accent: "#ff8a3d", highlight: "#ffe08a", brand: "ĐÀ LẠT ĂN GÌ" },
  narrator: { provider: "elevenlabs", voice: "Adam" }, subtitles: true,
  music: { src: "shared/music/travel-upbeat.mp3", volume: 0.8 },
  maps: {
    "Bánh mì xíu mại Ri 79": "xm-ri79", "Bánh mì xíu mại Phương": "xm-phuong", "Xíu mại Hồng Hoa (Yến)": "xm-hong-hoa",
    "Bánh Căn Cô Thương": "co-thuong", "Bánh căn ngoại ô quán": "ngoai-o", "Bánh Căn Nhỏ": "can-nho",
    "Bánh ướt lòng gà Thu Phương": "bu-thu-phuong", "Bánh ướt lòng gà Góc Phố": "bu-goc-pho", "Bánh ướt lòng gà Hà Phương": "bu-ha-phuong",
    "Nem nướng Tân Long": "nem-tan-long", "Nem nướng Hà Tốt": "nem-ha-tot", "Nem nướng Hoàng Hải": "nem-hoang-hai",
    "Lẩu gà lá é Cao Phụng": "lau-cao-phung", "Lẩu gà lá é Tao Ngộ": "lau-hai-thuong", "Lẩu gà lá é Ò ó o": "lau-o-o-o",
    "Bánh tráng nướng Cô Chi": "btn-co-chi", "Bánh tráng nướng Cô Hương": "btn-co-huong", "Hia Lee – Bánh tráng nướng": "btn-hia-lee",
  },
  scenes,
};
writeFileSync(`${dir}/video.json`, JSON.stringify(video, null, 2) + "\n");
writeFileSync(`${dir}/credits.json`, JSON.stringify(credits, null, 2) + "\n");
console.log(slug, scenes.length, "scenes,", used.size, "clips,", scenes.reduce((n, s) => n + s.narration.length, 0), "chars,", scenes.reduce((n, s) => n + s.durationSec, 0), "s");
