// Đà Lạt 4N3Đ mùa cỏ hồng (20/11/2026), giọng Adam (ElevenLabs), vui mà tự nhiên (người dùng yêu cầu 20/11/2026).
// Researched from 27 TikTok travel videos read in full (script + comments) + Báo Lâm Đồng, SGGP, Tuổi Trẻ, Lao Động;
// Google Maps checked 20/11/2026. Facts: research/itinerary.md, tiktok.md (#n), cost.md, food.md, stay.md.
// Footage: Pexels (licensed) + TikTok clips credited on screen and in the caption (research/cuts.txt).
// The cold open keeps the original sound of two viral clips (user request 20/11/2026); music starts with the voice.
// The 4N3Đ video also suggests a fifth day (user request 20/11/2026).
// Run: node data/gen-dl.mjs
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const slug = "da-lat-4n3d";
const dir = `data/videos/${slug}`;
mkdirSync(dir, { recursive: true });
const voice = existsSync(`${dir}/voiceover.json`) ? JSON.parse(readFileSync(`${dir}/voiceover.json`, "utf8")).clips : {};

// Clip name → [author, video id] (TikTok) or ["pexels:<author>", pexels id].
const SRC = {
  "cold-mist": ["minhsangg1002", "7589121496648387860"], "tl-mist": ["minhsangg1002", "7589121496648387860"],
  "cold-sun": ["dalatstatus", "7694131782538562836"],
  "dq-drone": ["minhsangg1002", "7701525692772551957"], "dq-drone2": ["minhsangg1002", "7701525692772551957"],
  "px-city": ["pexels:Love art", "16311090"], "px-city2": ["pexels:Love art", "16311090"], "px-yersin": ["pexels:Love art", "16311005"],
  "px-farm": ["pexels:Ninh Tien Dat", "27664206"], "px-pine": ["pexels:Hữu Thịnh 79", "31597905"], "px-trek": ["pexels:Hữu Thịnh 79", "31597908"],
  "night-square": ["giangjoile.vlog", "7684637067917167890"], "window-view": ["giangjoile.vlog", "7684637067917167890"], "cafe-house": ["giangjoile.vlog", "7684637067917167890"],
  "ga-dalat": ["_buingoctuyet_", "7706085285259398418"], "city-view": ["_buingoctuyet_", "7706085285259398418"], "pine-girl": ["_buingoctuyet_", "7706085285259398418"], "cafe-cup": ["_buingoctuyet_", "7706085285259398418"],
  "cd-road": ["langthangviet95", "7681278138239814932"], "cd-sea": ["langthangviet95", "7681278138239814932"], "cd-dawn": ["langthangviet95", "7681278138239814932"],
  "cd-turbine": ["homestaymoctrafarm", "7645567772805631252"], "cd-valley": ["homestaymoctrafarm", "7645567772805631252"],
  "cd-deck": ["dalatstatus", "7663294714195528980"], "cd-sit": ["dalatstatus", "7663294714195528980"],
  "cd-girl": ["sanmaycaugo_binhminh", "7632177887696686356"], "cd-daquy": ["tom_laoshi", "7709672005057973511"],
  "ch-pink": ["dalatcham", "7709281067353541894"], "ch-pink2": ["dalatcham", "7709281067353541894"],
  "ch-gold": ["lahannn.203", "7709871042797341958"], "ch-lake": ["lahannn.203", "7709871042797341958"], "ch-sun": ["somewhere_in_dalat", "7708964235665018133"],
  "lb-trek": ["suatuoicaphe_7", "7667810649916984596"], "lb-peak": ["suatuoicaphe_7", "7667810649916984596"],
  "tl-falls": ["hothienngaaa", "7568305733155048711"], "tl-suoitia": ["hothienngaaa", "7568305733155048711"],
  "tl-sunset": ["nehexinchao", "7593264516268379413"], "tl-sunset2": ["nehexinchao", "7593264516268379413"],
  "dq-girl": ["dienodalat.py", "7701986486484356360"], "pm-forest": ["dienodalat.py", "7680797857976192263"],
  "dtl-slide": ["vanamreview", "7708942634932276487"], "dtl-falls": ["vanamreview", "7708942634932276487"],
  "tn-lake": ["dalatdreamer", "7645549684018236690"], "tn-house": ["dalatdreamer", "7645549684018236690"], "tn-cafe": ["floating.town", "7673422449337289991"],
};
const F = (f) => `videos/da-lat/footage/${f}.mp4`;
const g = (list) => list.map(F);
const d = (name, place, address, rating, spokenAs) => ({ name, place, address, ...(rating != null ? { rating } : {}), ...(spokenAs ? { spokenAs } : {}) });

// Two viral clips with their own sound, ~4.6 s each, then the ticket title and the voice.
const COLD = 9.6;
const scenes = [
  {
    id: "hook", layout: "hook", caption: "ĐÀ LẠT", label: "4 NGÀY 3 ĐÊM", kicker: "MÙA CỎ HỒNG · CUỐI THÁNG 11", voiceDelay: COLD,
    cold: g(["cold-mist", "cold-sun"]), coldAudio: ["videos/da-lat/audio/cold-mist.mp3", "videos/da-lat/audio/cold-sun.mp3"],
    narration: "Hello hô lê các con vợ! Cuối tháng mười một rồi, Đà Lạt đang vào mùa đẹp nhất năm: trời xanh, tối lạnh, đồi cỏ hồng lên màu, mây thì nằm đầy thung lũng. Mình đã cày hơn năm chục video TikTok của người vừa đi về để gom lịch trình bốn ngày ba đêm này. Lưu lại liền đi nha!",
    gallery: g(["px-city", "dq-drone", "tl-mist"]),
  },
  {
    id: "d1", layout: "point", day: "N1", label: "Ngày 1 · Trung tâm", caption: "Chào Đà Lạt", badge: "Hồ Xuân Hương",
    points: ["Xe đêm tới sớm: ngồi quán cà phê chờ nhận phòng", "17h30 quảng trường Lâm Viên lên đèn"],
    narration: "Ngày một, đáp sân bay Liên Khương thì taxi về trung tâm tầm hai trăm nghìn. Đi xe đêm tới lúc năm giờ sáng thì đừng ôm vali đứng giữa trời mười mấy độ, ghé quán cà phê mở cửa sớm ngồi chờ nhận phòng. Chiều dạo hồ Xuân Hương, năm rưỡi ra quảng trường Lâm Viên ngắm phố lên đèn. Tối làm nồi lẩu gà lá é Cao Phụng cho ấm bụng. Nhớ né ăn ở bậc thang chợ đêm nha, có người hai tô bún bay bốn trăm nghìn đó.",
    gallery: g(["px-city2", "px-yersin", "city-view", "ga-dalat", "night-square"]),
    cardTitle: "TỐI NAY ĂN GÌ",
    dishes: [d("Lẩu gà lá é", "Lẩu gà lá é Cao Phụng", "KQH Hoàng Văn Thụ", 4.5, "Cao Phụng"), d("Nem nướng", "Nem nướng Hà Tốt", "272/6 Bùi Thị Xuân", 4.9), d("Bánh tráng nướng", "Bánh tráng nướng Cô Chi", "20 Xô Viết Nghệ Tĩnh", 4.8)],
  },
  {
    id: "d2", layout: "point", day: "N2", label: "Ngày 2 · Hướng Cầu Đất", caption: "Săn mây Cầu Đất", badge: "~28 km · 4h sáng",
    points: ["Đèo không đèn, sương dày: tay lái non đi tour", "Ngày ít mây ở đây vẫn có mây"],
    narration: "Ngày hai là ngày test nhân phẩm. Bốn giờ sáng chạy hai mươi tám cây số ra đồi chè Cầu Đất. Đèo không đèn, sương dày đặc, tay lái non thì đi tour cho lành. Bù lại, ở đây ngày ít mây vẫn có mây, chứ mấy đồi gần trung tâm phải trúng ngày thật nhiều mây mới thấy. Ngồi Biển Mây Chill nhâm nhi cà phê, ngắm đồi chè với mấy cái tua bin gió, đẹp muốn xỉu.",
    gallery: g(["cd-road", "cd-sea", "cd-turbine", "cd-deck", "cd-valley", "cd-daquy"]),
    cardTitle: "CÀ PHÊ SĂN MÂY",
    dishes: [d("Cà phê", "Biển Mây Chill – Cầu Gỗ", "đồi chè Cầu Đất", 4.9, "Biển Mây Chill"), d("Cà phê", "Săn Mây Cầu Gỗ – Bình Minh", "đồi chè Cầu Đất", 4.6), d("Cà phê", "The Diff House's", "Đất Làng, Trường Xuân", 4.5)],
  },
  {
    id: "d3", layout: "point", day: "N3", label: "Ngày 3 · Hướng Lạc Dương", caption: "Cỏ hồng & Langbiang", badge: "6h30–8h",
    points: ["Đồi cỏ hồng chỉ hồng khi nắng sớm", "Langbiang 2.167 m: leo ~4 tiếng hoặc đi Jeep"],
    narration: "Ngày ba đi hướng Lạc Dương. Từ sáu rưỡi tới tám giờ sáng là lúc đồi cỏ hồng trên đường lên Suối Vàng hồng rực nhất, lên trễ là chỉ thấy cỏ khô thôi á. Xong đi chinh phục Langbiang, nóc nhà Đà Lạt cao hai nghìn một trăm sáu mươi bảy mét: leo bộ mất chừng bốn tiếng, còn lười thì leo lên xe Jeep. Trưa làm bữa bò tơ bản địa ở Lạc Dương cho lại sức.",
    gallery: g(["ch-pink", "ch-gold", "ch-sun", "lb-trek", "px-pine", "lb-peak"]),
    cardTitle: "ĂN Ở LẠC DƯƠNG",
    dishes: [d("Bò tơ, lẩu nướng", "Bò Tơ Bản Địa", "QL27C, Lạc Dương", 4.7, "bò tơ"), d("Món nướng", "SOLENA", "Biđoúp, Lạc Dương", 4.6), d("Món Tây Nguyên", "Ẩm thực KRIN", "79 Biđoúp", 4.7)],
  },
  {
    id: "d4", layout: "point", day: "N4", label: "Ngày 4 · Hướng đèo Prenn", caption: "Hồ Tuyền Lâm", badge: "Dã quỳ cuối mùa",
    points: ["Cáp treo Robin → Thiền viện: 80k/chiều", "Máng trượt Datanla: chọn đường số 3"],
    narration: "Ngày cuối đi hướng đèo Prenn. Sáng sớm hồ Tuyền Lâm còn sương, đi cáp treo từ đồi Robin qua Thiền viện Trúc Lâm, vé tám mươi nghìn một chiều. Mùa này dã quỳ còn nở vàng dọc đường quanh hồ. Còn sức thì ghé thác Datanla trượt máng, chọn đường số ba, mới nhất mà dài nhất. Ghé An Tuyền Lâm uống ly cà phê ngắm hồ, rồi mua đặc sản ra sân bay.",
    gallery: g(["tl-falls", "tl-suoitia", "dq-girl", "dq-drone2", "dtl-falls", "tl-sunset"]),
    cardTitle: "CÀ PHÊ VEN HỒ",
    dishes: [d("Cà phê", "An – Tuyền Lâm", "Hoa Phượng Tím", 4.7, "An Tuyền Lâm"), d("Cà phê", "Lac du LeLe", "Hoa Cẩm Tú Cầu", 4.7), d("Cà phê", "The Seen House", "KDL hồ Tuyền Lâm", 4.6)],
  },
  {
    id: "extra", layout: "extra", day: "+1", caption: "Có thêm ngày 5?", kicker: "ĐI 5N4Đ THÌ THÊM",
    items: [
      { t: "Tà Nung · thôn 13", s: "~15 km, cà phê view thung lũng", cue: "Tà Nung" },
      { t: "Dinh Bảo Đại · ga Đà Lạt", s: "đi chậm, chụp ảnh cổ", cue: "dinh Bảo Đại" },
      { t: "Festival Hoa Đà Lạt", s: "khai mạc dự kiến tối 19/12", cue: "Festival" },
    ],
    narration: "Có thêm ngày thứ năm thì sao? Chạy mười lăm cây sang Tà Nung, ghé thôn mười ba với mấy quán cà phê nhìn ra thung lũng. Hoặc ghé dinh Bảo Đại với ga Đà Lạt cổ, đi chậm cho đã. Còn ai lên sau mười chín tháng mười hai thì trúng luôn Festival Hoa Đà Lạt, dự kiến khai mạc ở quảng trường Lâm Viên.",
    gallery: g(["tn-lake", "tn-house", "tn-cafe", "px-farm"]),
  },
  {
    id: "stay", layout: "stay", caption: "Ngủ ở đâu?",
    zones: [
      { title: "Trung tâm", note: "Đi bộ ra chợ, ra hồ · lần đầu nên ở đây", picks: [["Cozy Garden Boutique Hotel", 4.9, "94 Lữ Gia"], ["Thanh Nhã House", 5.0, "400 Hai Bà Trưng"]] },
      { title: "Cầu Đất", note: "Mê săn mây · khỏi chạy đèo lúc 3h sáng", picks: [["Dream Garden Homestay", 4.7, "Đất Làng, Trường Xuân"], ["Nhà Hoa Nắng Homestay", 4.9, "Đất Làng, Trường Xuân"]] },
    ],
    tip: "Chọn phòng có nước nóng, chăn dày, cửa kín gió",
    cues: ["trung tâm", "cầu đất", "nước nóng"],
    narration: "Ở đâu cho tiện? Lần đầu đi thì ở trung tâm, đi bộ ra chợ ra hồ, như Cozy Garden bốn chấm chín sao. Mê săn mây thì ngủ luôn ở Cầu Đất, như Dream Garden Homestay, khỏi phải chạy đèo lúc ba giờ sáng. Nhớ chọn phòng có nước nóng với chăn dày, tháng này tối lạnh run cầm cập.",
    gallery: g(["window-view", "pine-girl", "cd-girl"]),
  },
  {
    id: "cost", layout: "cost", caption: "Hết bao nhiêu tiền?", kicker: "BẢNG GIÁ 1 NGƯỜI",
    receiptTitle: "ĐÀ LẠT 4N3Đ · 1 NGƯỜI", total: "4,5–6,2tr", totalCue: "tổng cộng", stamp: "THAM KHẢO 20/11/2026",
    note: "Nguồn: review TikTok, Jungle Boss, Nam Thiên Travel",
    items: [
      { k: "Máy bay HN khứ hồi", note: "đặt sớm", v: "2,3–3,2tr", n: [2300, 3200] },
      { k: "Phòng 3 đêm", note: "ở 2 người", v: "450–825k", n: [450, 825] },
      { k: "Xe máy 4 ngày", note: "chia 2 người", v: "240–360k", n: [240, 360] },
      { k: "Ăn uống 4 ngày", note: "~300k/ngày", v: "1,2–1,3tr", n: [1200, 1320] },
      { k: "Vé, taxi sân bay", note: "cáp treo 80k, Langbiang 50k", v: "330–450k", n: [330, 450] },
    ],
    narration: "Ví tiền thì sao? Vé máy bay từ Hà Nội đặt sớm tầm hai triệu ba tới ba triệu hai. Phòng ba đêm ở chung chừng năm trăm tới tám trăm nghìn mỗi người. Xe máy, ăn uống, vé với taxi thêm khoảng hai triệu. Tổng cộng tầm bốn triệu rưỡi tới sáu triệu hai một người, đi xe khách từ Sài Gòn thì còn rẻ hơn nhiều.",
    gallery: g(["cafe-cup", "pm-forest"]),
  },
  {
    id: "outro", layout: "outro", caption: "Đà Lạt chờ bạn", kicker: "3 ĐIỀU NHỚ MANG", cta: "Lưu lại nhé!",
    tips: ["Áo khoác + kem chống nắng", "Hỏi giá trước ở chợ đêm", "Taxi: đặt qua app"],
    tipCues: ["áo khoác", "hỏi giá", "taxi"],
    caseTags: ["Hồ Xuân Hương", "Cầu Đất", "Langbiang", "Tuyền Lâm", "Tà Nung"],
    narration: "Ba điều người đi trước dặn nè: mang áo khoác lẫn kem chống nắng vì sáng lạnh trưa nắng, hỏi giá trước khi ăn hay chụp hình ở chợ đêm, và taxi thì đặt qua app. Clip trong video là của các bạn TikToker, nguồn mình để ở phần mô tả. Lưu lại rồi rủ cạ cứng lên Đà Lạt đón lạnh liền đi các con vợ!",
    gallery: g(["cd-sit", "ch-pink2", "tl-sunset2"]),
  },
];

// Durations: voice + lead-in (+ cold open) + 1 s tail, rounded up to 0.5 s; rough guesses before the voice exists.
const LEAD = 0.5;
for (const s of scenes) {
  const v = voice[s.id]?.durationSec;
  const base = v ?? s.narration.length / 15.5;
  s.durationSec = Math.ceil((base + LEAD + (s.voiceDelay ?? 0) + 1.0) * 2) / 2;
}

const used = new Set(scenes.flatMap((s) => [...(s.gallery ?? []), ...(s.cold ?? [])]));
const credits = [...used].map((file) => {
  const name = file.split("/").pop().replace(".mp4", "");
  const [who, id] = SRC[name];
  if (who.startsWith("pexels:")) return { file, author: `Pexels · ${who.slice(7)}`, source: `https://www.pexels.com/video/${id}/`, license: "Pexels License" };
  return { file, author: `@${who}`, source: `https://www.tiktok.com/@${who}/video/${id}`, license: "TikTok, dùng có ghi nguồn (người dùng đồng ý 16/11/2026)" };
});

const video = {
  id: slug, title: "Đà Lạt 4N3Đ mùa cỏ hồng", language: "vi", region: "Đà Lạt, Lâm Đồng, Việt Nam", template: "travel-itinerary",
  format: { width: 1080, height: 1920, fps: 30 }, transitionFrames: 15,
  theme: { accent: "#f28fae", highlight: "#ffd25e", brand: "ĐÀ LẠT" },
  narrator: { provider: "elevenlabs", voice: "Adam" }, subtitles: true,
  music: { src: "shared/music/travel-ambient.mp3", volume: 0.8 },
  maps: {
    "Lẩu gà lá é Cao Phụng": "lau-cao-phung", "Nem nướng Hà Tốt": "nem-ha-tot", "Bánh tráng nướng Cô Chi": "btn-co-chi",
    "Biển Mây Chill – Cầu Gỗ": "cd-bien-may", "Săn Mây Cầu Gỗ – Bình Minh": "cd-binh-minh", "The Diff House's": "cd-diff",
    "Bò Tơ Bản Địa": "ld-bo-to", "SOLENA": "ld-solena", "Ẩm thực KRIN": "ld-krin",
    "An – Tuyền Lâm": "tl-an", "Lac du LeLe": "tl-lele", "The Seen House": "tl-seen",
    "Cozy Garden Boutique Hotel": "st-cozy", "Thanh Nhã House": "st-thanh-nha", "Dream Garden Homestay": "st-dream", "Nhà Hoa Nắng Homestay": "st-hoa-nang",
  },
  scenes,
};
writeFileSync(`${dir}/video.json`, JSON.stringify(video, null, 2) + "\n");
writeFileSync(`${dir}/credits.json`, JSON.stringify(credits, null, 2) + "\n");
console.log(slug, scenes.length, "scenes,", used.size, "clips,", scenes.reduce((n, s) => n + s.narration.length, 0), "chars,", scenes.reduce((n, s) => n + s.durationSec, 0), "s");
