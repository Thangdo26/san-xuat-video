// Săn mây Đồng Cao 2N1Đ (16/11/2026). Researched from 25 TikTok videos read in full (script + comments),
// VNA / Viet Nam News / Tiền Phong / VnExpress, Google Maps checked 16/11/2026.
// No free-licensed footage of Đồng Cao exists (research/media.md), so the user asked (16/11/2026) to use clips
// from popular TikTok videos of the place, crediting every creator in the caption and on screen.
// Facts: research/itinerary.md, research/tiktok.md (#n), research/cost.md, research/food.md, research/stay.md.
// Scene durations come from the voice clips once they exist (voice + cold open + tail).
// Run: node data/gen-dc.mjs [--adam]
// --adam: the playful cut voiced by ElevenLabs "Adam" (user request 17/11/2026), same facts and footage, own slug.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const ADAM = process.argv.includes("--adam");
const slug = ADAM ? "dong-cao-san-may-adam" : "dong-cao-san-may";
const dir = `data/videos/${slug}`;
mkdirSync(dir, { recursive: true });
const voice = existsSync(`${dir}/voiceover.json`) ? JSON.parse(readFileSync(`${dir}/voiceover.json`, "utf8")).clips : {};

const SRC = {
  tramphuotchill: ["7548661561439571218", ["cloud-river", "sunrise-rocks"]],
  xuan_k2: ["7557572851478416648", ["drone-peak", "drone-green"]],
  "xuan_k2 ": ["7671836409254120711", ["xk-sea", "xk-people"]],
  xuanhoangk2: ["7620762356620102919", ["meadow-rocks"]],
  toandidaudo: ["7707862145467190549", ["td-silhouette", "td-sea", "man-cloud"]],
  "toandidaudo ": ["7708416685773982996", ["pov-orange"]],
  "toandidaudo  ": ["7699099326156508437", ["sunset-group"]],
  "toandidaudo   ": ["7515650488440720648", ["green-hills"]],
  phungviethuy365: ["7694230426554092807", ["milkyway"]],
  "phungviethuy365 ": ["7536511581660761362", ["phung-meadow"]],
  vf9roadtrips: ["7661527312545975572", ["dirt-road", "drone-path", "vf9-road"]],
  "vinhvivu.1": ["7537839859298274567", ["drone-mist", "drone-cliff"]],
  "vinhvivu.1 ": ["7598771221429226770", ["road-1", "road-2"]],
  chillcamp: ["7684522575073922311", ["chill-tent", "chill-ridge"]],
  hyeni502: ["7549727316872678677", ["crowd", "crowd-sun"]],
  "giadinhcamping.vn": ["7587235612101594389", ["suv-slope", "suv-meadow", "campfire", "dusk-cars"]],
  dtrinhss: ["7676679338527411463", ["horses-dusk", "dusk-sky", "night-tent"]],
};
const credits = [];
for (const [key, [id, files]] of Object.entries(SRC)) {
  const author = key.trim();
  for (const f of files) credits.push({ file: `videos/dong-cao/footage/${f}.mp4`, author: `@${author}`, source: `https://www.tiktok.com/@${author}/video/${id}`, license: "TikTok, dùng có ghi nguồn (người dùng đồng ý 16/11/2026)" });
}
const F = (f) => `videos/dong-cao/footage/${f}.mp4`;
const g = (list) => list.map(F);
const d = (name, place, address, rating, spokenAs) => ({ name, place, address, ...(rating != null ? { rating } : {}), ...(spokenAs ? { spokenAs } : {}) });

const COLD = 6.2; // seconds of footage + music before the voice starts
const scenes = [
  {
    id: "hook", layout: "hook", caption: "ĐỒNG CAO", label: "SĂN MÂY 2N1Đ", kicker: "BẮC NINH · GIỮA THÁNG 11", voiceDelay: COLD,
    cold: g(["cloud-river", "drone-mist", "td-sea", "xk-sea", "sunrise-rocks"]),
    narration: "Không phải Tà Xùa đâu, đây là Đồng Cao, Bắc Ninh, cách Hà Nội chừng một trăm năm mươi cây số. Sáng mười bốn tháng mười một vừa rồi, người địa phương gọi đây là biển mây đẹp nhất năm. Lưu lại lịch trình hai ngày một đêm này nhé!",
    gallery: g(["drone-peak", "td-silhouette"]),
  },
  {
    id: "route", layout: "point", label: "Ngày 1 · Chiều", clock: "14:00", caption: "Đường lên Đồng Cao", badge: "Vân Sơn",
    points: ["Cao tốc → QL31 → An Châu → Vân Sơn", "Bê tông tới chân đồi, dốc cuối gắt"],
    narration: "Đi cao tốc Hà Nội Bắc Giang, rẽ quốc lộ ba mốt qua Chũ, tới An Châu rồi vào Vân Sơn. Đường bê tông tới tận chân đồi, ô tô xe máy đều lên được. Đoạn dốc cuối khá gắt, tay lái yếu thì gửi xe nhà dân rồi đi bộ mười lăm phút. Dọc đường ghé Mây Coffee, năm sao, hay tiệm trà F5 ở Chũ, nhớ mua mì Chũ mang lên nấu.",
    gallery: g(["road-1", "road-2", "dirt-road", "suv-slope", "drone-path", "green-hills"]),
    cardTitle: "DỌC QL31",
    dishes: [d("Cà phê", "Mây Coffee Phượng Sơn", "QL31, Phượng Sơn", 5.0, "Mây Coffee"), d("Đồ uống", "F5. Tiệm trà bờ hồ", "Lê Duẩn, Chũ", 4.6), d("Mì Chũ", "Mì Chũ mang lên nấu", "mua ở Chũ, Lục Ngạn")],
  },
  {
    id: "camp", layout: "point", label: "Ngày 1 · Tối", clock: "18:00", caption: "Cắm trại trên đồi", badge: "Đỉnh Đồng Cao",
    points: ["Lều 4 người 200k, 6 người 300k", "Gà nướng, lẩu: gọi đặt từ trưa"],
    narration: "Tối ở lại cắm trại cho tiện săn mây. Nhà Hoa Hồng, Hoa Thuận dưới chân đồi cho thuê lều và mang lên dựng giúp: lều bốn người hai trăm nghìn, sáu người ba trăm nghìn. Muốn ăn gà nướng hay lẩu thì gọi đặt từ trưa. Trên đỉnh không có quán, không có nhà vệ sinh, gió thổi cả đêm nên mang áo ấm. Trời quang thì nằm ngắm cả dải Ngân Hà.",
    gallery: g(["chill-tent", "horses-dusk", "sunset-group", "campfire", "night-tent", "milkyway"]),
    cardTitle: "ĂN TỐI TRÊN ĐỒI",
    dishes: [d("Gà nướng, lẩu", "Đặt nhà cho thuê lều", "gọi trước từ trưa", null, "gà nướng"), d("Mì hộp, nước, củi", "Tạp hoá chân đồi", "chân đồi"), d("Bún 30k", "Chợ phiên Quế Sơn", "Đại Sơn")],
  },
  {
    id: "clouds", layout: "point", label: "Ngày 2 · Bình minh", clock: "04:30", caption: "Săn biển mây", badge: "Mây 5h–8h",
    points: ["Hôm trước mưa, sáng khô ráo", "Sương mù dưới thung = có mây"],
    narration: "Bốn rưỡi sáng dậy, leo mười lăm phút lên đỉnh. Mây thường lên từ năm giờ, đẹp tới tám giờ. Mẹo của dân địa phương: hôm trước mưa, sáng hôm sau khô ráo, có sương mù dưới thung là gần như chắc có mây. Gió to thì mây tan rất nhanh. Mười bốn tháng mười một mây phủ kín, nhưng sáng mười lăm không còn tí nào, nên dân săn mây gọi là test nhân phẩm.",
    gallery: g(["crowd", "pov-orange", "xk-people", "drone-cliff", "meadow-rocks", "drone-green"]),
    cardTitle: "TRÊN GOOGLE MAPS",
    dishes: [d("Điểm săn mây", "Cao nguyên Đồng Cao", "Vân Sơn, Bắc Ninh", 4.6, "Đồng Cao")],
  },
  {
    id: "stay", layout: "stay", caption: "Ngủ ở đâu?",
    zones: [
      { title: "Lều trên đồi", note: "Mở lều là thấy mây · 150–300k/lều", picks: [["Nhà Hoa Hồng, Hoa Thuận", null, "chân đồi"]] },
      { title: "Thị trấn Chũ (~35 km)", note: "3h sáng chạy lên", picks: [["Nhà nghỉ Đại Dương", 4.7, "QL31, Chũ"], ["Bản Meo Homestay", 4.8, "Nam Dương"]] },
    ],
    tip: "Hoặc đi đêm từ Hà Nội lúc 0–1h, tới nơi 4–5h sáng",
    cues: ["ngủ lều", "thị trấn chũ", "đi đêm"],
    narration: "Nên ngủ ở đâu? Hay nhất là ngủ lều ngay trên đồi, mở lều là thấy mây. Không quen cắm trại thì ngủ ở thị trấn Chũ, cách chừng ba lăm cây, như nhà nghỉ Đại Dương bốn chấm bảy sao, rồi ba giờ sáng chạy lên. Hoặc đi đêm từ Hà Nội, tới nơi lúc bốn năm giờ sáng.",
    gallery: g(["chill-ridge", "crowd-sun"]),
  },
  {
    id: "cost", layout: "cost", caption: "Hết bao nhiêu tiền?", kicker: "TRƯỚC KHI ĐI",
    receiptTitle: "SĂN MÂY 2N1Đ · 1 NGƯỜI", total: "330–500k", totalCue: "tổng cộng", stamp: "THAM KHẢO 16/11/2026",
    note: "Xe máy 2 người · nguồn: review TikTok, Báo Văn Hoá",
    items: [
      { k: "Vé lên đồi", note: "không thu phí", v: "0đ", n: [0, 0] },
      { k: "Xăng ~300 km khứ hồi", note: "RON95 ~21–22k/lít · 2 người/xe", v: "80–100k", n: [80, 100] },
      { k: "Thuê lều + bạt", note: "lều 4 người 200k · chia 4", v: "50–100k", n: [50, 100] },
      { k: "Ăn tối, ăn sáng", note: "nướng, lẩu đặt trước", v: "200–300k", n: [200, 300] },
    ],
    narration: "Hết bao nhiêu tiền? Lên đồi không mất vé. Đi xe máy, xăng khoảng tám mươi tới một trăm nghìn mỗi người, lều chia nhau năm mươi tới một trăm nghìn, ăn tối và ăn sáng hai tới ba trăm nghìn. Tổng cộng chỉ khoảng ba trăm ba mươi tới năm trăm nghìn một người.",
    gallery: g(["dusk-sky", "phung-meadow"]),
  },
  {
    id: "outro", layout: "outro", caption: "Hẹn một sáng có mây", kicker: "3 LƯU Ý", cta: "Lưu lại nhé!",
    tips: ["Áo ấm: đêm gió rất lạnh", "Đồ để cỏ may không bám", "Mang rác về"],
    narration: "Ba điều người đi trước dặn: mang áo ấm vì đêm gió rất lạnh, mặc đồ để cỏ may không bám, và mang rác về, vì đoàn thanh niên ở đây vẫn phải đi nhặt rác của khách. Clip trong video là của các bạn TikToker, mình ghi nguồn ở phần mô tả. Lưu lại và hẹn bạn một sáng có mây nhé!",
    gallery: g(["man-cloud", "vf9-road"]),
  },
];

// Playful narration for the Adam cut: same facts, Gen Z TikTok tone; numbers spelled out because Adam misreads
// digits and abbreviations. Keeps the cue words the builder listens for (Mây Coffee, ngủ lều, thị trấn Chũ, đi đêm).
const FUN = {
  hook: "Hello hô lê các con vợ! Không phải Tà Xùa đâu nha, đây là Đồng Cao, Bắc Ninh, cách Hà Nội có một trăm năm mươi cây số thôi. Sáng mười bốn tháng mười một vừa rồi biển mây ở đây đẹp xỉu up xỉu down luôn. Lưu ngay lịch trình hai ngày một đêm này kẻo lạc trôi nha!",
  route: "Đường đi dễ như ăn kẹo: cao tốc Hà Nội Bắc Giang, rẽ quốc lộ ba mốt qua Chũ, tới An Châu rồi quẹo vào Vân Sơn. Đường bê tông tới tận chân đồi, ô tô xe máy chơi tất. Riêng con dốc cuối hơi bị gắt, tay lái non thì gửi xe nhà dân rồi cuốc bộ mười lăm phút, coi như tập thể dục. Dọc đường ghé Mây Coffee năm sao sống ảo, hay tiệm trà ép năm ở Chũ, nhớ xách thêm mì Chũ lên nấu nha.",
  camp: "Tối thì cắm trại luôn cho tiện săn mây. Nhà Hoa Hồng, Hoa Thuận dưới chân đồi cho thuê lều, còn vác lên dựng giúp, đỉnh của chóp: lều bốn người hai trăm nghìn, sáu người ba trăm nghìn. Thèm gà nướng hay lẩu thì gọi đặt từ trưa nha. Cảnh báo nhẹ: trên đỉnh không có quán, không có nhà vệ sinh, gió thổi cả đêm lạnh run cầm cập, nên nhớ mang áo ấm. Bù lại trời quang thì nằm ngắm Ngân Hà, chill hết nấc.",
  clouds: "Bốn rưỡi sáng bật dậy, leo mười lăm phút lên đỉnh. Mây lên từ năm giờ, đẹp tới tám giờ. Bí kíp của dân địa phương nè: hôm trước mưa, sáng hôm sau khô ráo, dưới thung có sương mù là gần như chắc kèo có mây. Gió to thì mây chạy mất dép. Mười bốn tháng mười một mây phủ kín mít, sáng mười lăm thì không còn một cọng, nên ở đây gọi là test nhân phẩm đó các con vợ.",
  stay: "Ngủ đâu bây giờ? Xịn nhất là ngủ lều ngay trên đồi, mở lều ra là mây ùa vào mặt. Không quen cắm trại thì ngủ ở thị trấn Chũ, cách chừng ba lăm cây, như nhà nghỉ Đại Dương bốn chấm bảy sao, rồi ba giờ sáng phi lên. Còn máu hơn nữa thì đi đêm từ Hà Nội, tới nơi đúng bốn năm giờ sáng.",
  cost: "Còn ví tiền thì sao? Lên đồi không mất vé, nghe đã chưa. Đi xe máy, xăng tầm tám mươi tới một trăm nghìn mỗi người, lều chia nhau năm mươi tới một trăm nghìn, ăn tối với ăn sáng hai tới ba trăm nghìn. Tổng cộng chỉ tầm ba trăm ba mươi tới năm trăm nghìn một người, quá hời luôn.",
  outro: "Ba điều người đi trước dặn nè: mang áo ấm vì đêm lạnh xỉu, mặc đồ để cỏ may không bám, và mang rác về nha, đừng để đoàn thanh niên ở đây đi nhặt hộ nữa. Clip trong video là của các bạn TikToker, nguồn mình để ở phần mô tả. Lưu lại rồi rủ cạ cứng đi test nhân phẩm liền đi các con vợ!",
};
if (ADAM) for (const s of scenes) s.narration = FUN[s.id];

// Durations: voice + lead-in (+ cold open) + 1 s tail, rounded up to 0.5 s; rough guesses before the voice exists.
const LEAD = 0.5;
for (const s of scenes) {
  const v = voice[s.id]?.durationSec;
  const base = v ?? s.narration.length / 15.5;
  s.durationSec = Math.ceil((base + LEAD + (s.voiceDelay ?? 0) + 1.0) * 2) / 2;
}

const video = {
  id: slug, title: "Săn mây Đồng Cao 2N1Đ", language: "vi", region: "Đồng Cao, Vân Sơn, Bắc Ninh, Việt Nam", template: "travel-itinerary",
  format: { width: 1080, height: 1920, fps: 30 }, transitionFrames: 15,
  theme: { accent: "#ff9e7a", highlight: "#ffd9a0", brand: "ĐỒNG CAO" },
  narrator: ADAM ? { provider: "elevenlabs", voice: "Adam" } : { provider: "omnivoice", voice: "vi-nu-tre-03" }, subtitles: true,
  music: { src: "shared/music/travel-upbeat.mp3", volume: 0.8 },
  maps: { "Mây Coffee Phượng Sơn": "may-coffee", "F5. Tiệm trà bờ hồ": "f5-tra", "Cao nguyên Đồng Cao": "dong-cao", "Nhà nghỉ Đại Dương": "dai-duong", "Bản Meo Homestay": "ban-meo" },
  scenes,
};
const used = new Set(scenes.flatMap((s) => [...(s.gallery ?? []), ...(s.cold ?? [])]));
writeFileSync(`${dir}/video.json`, JSON.stringify(video, null, 2) + "\n");
writeFileSync(`${dir}/credits.json`, JSON.stringify(credits.filter((c) => used.has(c.file)), null, 2) + "\n");
console.log(slug, scenes.length, "scenes,", used.size, "clips,", scenes.reduce((n, s) => n + s.narration.length, 0), "chars,", scenes.reduce((n, s) => n + s.durationSec, 0), "s");
