---
name: san-xuat-video-du-lich
description: Quy trình chuẩn sản xuất video du lịch dọc 9:16 (TikTok/Reels) bằng Remotion, từ nghiên cứu blog du lịch và video, bình luận TikTok, chọn ảnh, tìm quán ăn ≥4.5★ trên Google Maps, viết lời thuyết minh, tạo giọng đọc (Vbee/Edge), dựng và xuất video, tới đăng TikTok. Dùng khi người dùng muốn làm video du lịch cho một địa điểm mới.
---

# Sản xuất video du lịch: quy trình chuẩn

Quy trình rút ra từ video **Đà Nẵng 3N2Đ** (`C:\Users\thang\Thang_space\danang-3n2d`).
Mỗi điểm đến là một thư mục dự án riêng trong `C:\Users\thang\Thang_space\`,
dựng từ cùng một bộ công cụ Remotion. Trả lời người dùng bằng **tiếng Việt**.

> ⏱️ **Phần lớn thời gian (khoảng 70%) dành cho nghiên cứu:** đọc blog du lịch, tìm
> ảnh và video đẹp, và săn quán ăn ngon có đánh giá cao. Dựng video, tạo giọng và
> render đều đã tự động, chỉ chiếm phần nhỏ. **Đừng vội dựng video khi nghiên cứu
> chưa đủ.** Video hay hay dở là do lịch trình đúng, ảnh đẹp, quán ngon thật, không phải do code.

| Giai đoạn | Thời gian | Kết quả |
|---|---|---|
| 1. Nghiên cứu lịch trình (blog, TikTok) | ~25% | `research/itinerary.md`, `research/tiktok.md` |
| 2. Ảnh và video đẹp | ~20% | ảnh trong `public/videos/<slug>/`, `credits.json` |
| 3. Món ăn và quán ăn ≥4.5★ | ~25% | `research/food.md`, `dishes` trong `video.json` |
| 4. Kịch bản và `video.json` | ~10% | `brief.md`, `video.json` |
| 5. Giọng đọc | ~5% | `voiceover.json`, clip giọng |
| 6. Dựng, xuất, kiểm tra | ~10% | `output/<slug>/final.mp4` |
| 7. Đăng TikTok | ~5% | bài đăng trên kênh |

---

## 0. Tạo dự án mới

1. Tạo thư mục `C:\Users\thang\Thang_space\<slug>`, ví dụ `phu-yen-3n2d`. Slug viết thường, không dấu, nối bằng gạch ngang.
2. Chép bộ công cụ từ dự án gần nhất: `src/`, `scripts/`, `public/shared/`, các file cấu hình (`package.json`, `package-lock.json`, `tsconfig.json`, `remotion.config.ts`, `eslint.config.mjs`, `.prettierrc`, `.gitignore`) và `README.md`.
   **Không chép** `node_modules/`, `output/`, `pickup-voice/`, `.env`, hay dữ liệu và ảnh của video cũ.
3. Đổi `name` trong `package.json`. Trong `src/Root.tsx`, đổi import `video.json` và `voiceover.json` sang slug mới (Studio xem trước bằng file này).
4. `git init`, rồi `npm ci`.
5. Tạo `data/videos/<slug>/` và `research/` (để ghi chép nghiên cứu, có commit).

## 1. Nghiên cứu lịch trình từ blog du lịch (~25%)

**Mục tiêu:** một lịch trình thực tế, đi được thật, gồm các điểm nổi tiếng nhất của nơi đó.

- Đọc **ít nhất 6–10 nguồn**: blog cá nhân (Vietnam Travel, Klook, Traveloka, Vinpearl, iVIVU, Mytour, Chudu24…), trang du lịch của tỉnh, báo (VnExpress Du lịch, Tuổi Trẻ, Thanh Niên), và các video TikTok hoặc YouTube review gần đây (đọc phụ đề bằng `agent-reach youtube subtitle <link>`).
- Dùng `WebSearch` với nhiều câu hỏi khác nhau, gửi song song: "lịch trình <nơi> 3 ngày 2 đêm", "kinh nghiệm du lịch <nơi> tự túc", "<nơi> có gì chơi", "<nơi> itinerary 3 days".
- Lập bảng điểm đến: tên, toạ độ, mấy nguồn nhắc tới, nên đi giờ nào hay mùa nào, khoảng cách và thời gian di chuyển, lưu ý (phí vào cửa thì chỉ ghi khi chắc chắn, kèm nguồn).
- Chọn các điểm được **nhiều nguồn nhắc tới nhất**. Sắp theo tuyến đường hợp lý, mỗi ngày chừng 2–3 điểm, đừng nhồi lịch.
- **Kiểm tra điểm còn mở cửa:** tìm "<điểm> tạm ngưng đón khách" và "<điểm> đóng cửa <năm>". Ví dụ Bãi Xép (Phú Yên) đã ngừng đón khách từ 30/9/2024 và bị loại khỏi lịch trình.
- **Kiểm tra thực tế hành chính:** từ 1/7/2025 nhiều tỉnh đã sáp nhập (ví dụ Phú Yên vào Đắk Lắk, Quảng Nam vào Đà Nẵng). Địa chỉ mới có thể khác tên tỉnh cũ. Trong video vẫn dùng tên điểm đến quen thuộc, nhưng ghi địa chỉ theo Google Maps hiện tại.
- Ghi tất cả vào `research/itinerary.md`, kèm link nguồn.
- Lấy toạ độ từ OpenStreetMap (`nominatim.openstreetmap.org/search?q=...&format=json`) để ghim bản đồ khớp.

**Không bịa** giá vé, giờ mở cửa hay số liệu. Con số nào (độ cao, năm xây…) cũng phải có ít nhất một nguồn uy tín.

### 1b. Nghiên cứu trên TikTok: xem video và lướt bình luận

TikTok cho biết điểm nào đang hot, điểm nào đã đóng, chỗ nào chặt chém, nên đi giờ nào. Blog thường chậm hơn vài tháng. Làm bằng Playwright MCP trong trình duyệt đã đăng nhập TikTok:

1. **Tìm video:** mở `https://www.tiktok.com/search/video?q=<từ khoá>`, với nhiều từ khoá: "<nơi> 3n2d", "lịch trình <nơi>", "<nơi> có gì chơi", "<nơi> ăn gì", "review <điểm>", "<nơi> đừng đi". Lấy danh sách bằng `page.evaluate` (link `a[href*="/video/"]`, lượt xem, mô tả). Chọn **6–10 video** nhiều lượt xem, đăng trong khoảng 12 tháng gần đây.
2. **Xem video:** mở từng link, chụp màn hình (`page.screenshot` của khung video) ở 3–5 thời điểm, vì creator hay ghi tên điểm, giá và giờ thành chữ trên video. Xem ảnh bằng Read và đọc caption.
3. **Lướt bình luận:** bấm `[data-e2e="comment-icon"]`, cuộn khung `[class*="DivCommentListContainer"]` (đặt `scrollTop`, đừng lăn chuột vì trang sẽ nhảy sang video kế), rồi lấy chữ trong `[class*="DivCommentContentWrapper"]` → `[data-e2e="comment-level-1"]`. Ngày đăng tính từ ID video: `BigInt(id) >> 32n` là giây Unix. Ghép ảnh chụp thành một tấm (Pillow trong venv của VoiceStudio) để xem nhanh. Ghi lại:
   - điểm người xem gợi ý thêm;
   - cảnh báo: đóng cửa, đang sửa, chặt chém, đông, bị lừa;
   - mẹo về giờ đẹp, mùa đẹp, cách đi;
   - quán và món được khen nhiều.
4. **Ghi vào `research/tiktok.md`:** link, tài khoản, lượt xem, ngày đăng, các ý chính, và các bình luận đáng chú ý (tóm tắt, không chép tên người bình luận).
5. **Kiểm chứng trước khi dùng:** TikTok là nguồn gợi ý. Quán thì vẫn phải đạt ≥4.5★ trên Google Maps. Điểm đóng cửa hay giá vé thì kiểm tra thêm báo hoặc trang chính thức. Thông tin chỉ có trên TikTok thì ghi "theo review trên TikTok", không đưa thành số liệu chắc chắn.
6. **Không lấy** khung hình, nhạc hay lời thoại của creator vào video của mình (bản quyền). Ảnh chụp chỉ để nghiên cứu, để trong thư mục tạm, không commit. Không like, follow hay bình luận khi nghiên cứu.

## 2. Ảnh và video đẹp (~20%)

- **Nguồn ưu tiên:** Wikimedia Commons (CC0, PD, CC BY, CC BY-SA). Tìm bằng API:
  `https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srsearch=<từ khoá>&format=json&srlimit=30`.
  Tìm bằng cả tên tiếng Việt có dấu, không dấu và tiếng Anh, ví dụ "Gành Đá Đĩa", "Ganh Da Dia", "Da Dia Reef".
- Tải nhiều ảnh ứng viên vào `--dir candidates`, xem từng ảnh, rồi chép ảnh được chọn sang `images/<NN-ten>.jpg` và sửa `file` trong `credits.json` cho khớp. **Loại ảnh có watermark** (ví dụ "Taken by …" ở góc; thường gặp ở ảnh lấy từ Flickr) và **ảnh nhỏ hơn khoảng 1200px** chiều ngang.
- Tải ảnh về bằng `npm run video:fetch-image -- --slug <slug> --dir images --slot <NN-ten> --title "File:..."`. Lệnh này tự ghi tác giả và giấy phép vào `credits.json`.
- **Mở xem từng ảnh** bằng Read: tên file trên Commons không chứng minh ảnh chụp đúng nơi đó. Chọn ảnh sắc nét, ngang hoặc dọc đều được (khung ảnh cao 950px, có Ken Burns), đủ sáng, không có watermark, không có người quá rõ mặt.
- Mỗi cảnh địa điểm cần **2–3 ảnh**; cảnh hook và outro dùng ảnh đẹp nhất. Ảnh món ăn có thì tốt (đặt `image` trong dish), không có cũng được.
- Video clip (`.mp4`/`.webm`) dùng được trong `gallery`. Chỉ lấy video có giấy phép rõ ràng (Commons, Pexels, Pixabay) và ghi nguồn vào `credits.json` bằng tay.
- **Không dùng** ảnh lấy từ Google Images, ảnh trong blog, Facebook hay TikTok của người khác.

**Tìm ảnh hiệu quả:** tìm kiếm toàn văn trên Commons hay trả về kết quả rác với tên tiếng Việt. Nên duyệt theo **danh mục** (API `generator=categorymembers`, ví dụ `Category:Tuy Hoa`, `Category:Dien Cape`, `Category:Tuy An District`), chậm khoảng 2 giây mỗi lượt gọi vì Commons hay chặn khi gọi dồn. Openverse (`api.openverse.org`, `license=by,by-sa,cc0,pdm`) là nguồn dự phòng. Không có ảnh thì dùng cảnh bản đồ lộ trình (mục 5b), không lấy ảnh nơi khác thay vào.

## 3. Món ăn và quán ăn ngon (~25%)

**Quy tắc bắt buộc:**
- Mỗi điểm du lịch (mỗi cảnh `point`) có **ít nhất 5 quán ăn**, mỗi quán **≥ 4.5★ trên Google Maps**, với **ít nhất ~50 lượt đánh giá**, để tránh quán 5.0★ mà chỉ có 3 lượt.
- Quán phải ở gần điểm đó (cùng khu, khoảng 15 phút đi xe), hoặc trên đường đi.

**Cách làm:**
1. Tìm món đặc sản của vùng qua blog ẩm thực và báo, ví dụ "đặc sản <nơi>", "<nơi> ăn gì", "quán ngon <nơi>". Ghi tên món, mô tả và các quán được nhắc nhiều.
2. Kiểm tra từng quán trên **Google Maps bằng Playwright MCP**. **Luôn gắn toạ độ** vào URL: `https://www.google.com/maps/search/<từ khoá>/@<lat>,<lng>,14z?hl=vi`. Nếu không gắn, kết quả bị lệch về nơi đặt trình duyệt (ví dụ Hà Nội).
   - Đọc danh sách kết quả: thẻ `a.hfpxzc` có `aria-label` là tên quán, `span.MW4etd` là số sao, `span.UY7F9` là lượt đánh giá; toạ độ lấy trong href (`!3d<lat>!4d<lng>`). Lọc theo khoảng cách tới điểm tham quan.
   - Với quán được chọn, mở trang chi tiết: tên ở `h1`, địa chỉ ở `button[data-item-id="address"]`, và xem có dòng "đóng cửa vĩnh viễn" không. **Đối chiếu tên trên trang chi tiết với quán đang tìm**: Google đôi khi mở quán được tài trợ hoặc quán khác.
   - Từ khoá nên dùng: "quán ăn", "nhà hàng hải sản", "<món đặc sản> <nơi>", gửi nhiều từ khoá trong một lần chạy.
   - Vùng quê ít quán đạt chuẩn: gộp các điểm gần nhau trên cùng tuyến vào một cảnh. Ví dụ Phú Yên: quanh đầm Ô Loan chỉ có 1 quán ≥4.5★, nên gộp với Gành Đá Đĩa.
3. Ghi vào `research/food.md` theo bảng: điểm, món, quán, địa chỉ, sao, lượt đánh giá, ngày kiểm tra, link Maps.
4. Trong `video.json`:
   - `dishes`: **3 quán hiện trên màn hình**, chọn ngon và nổi tiếng nhất. **Tên quán và địa chỉ phải ngắn** để `name · địa chỉ · ★` nằm trên một dòng (khoảng ≤ 40 ký tự), ví dụ "Mr Mộc · 185A Điện Biên Phủ". Nếu xuống dòng, quán thứ ba sẽ đè lên phụ đề. Bỏ tên phường hoặc tỉnh; phần mô tả vẫn tìm đúng nhờ `region`. Lời thuyết minh nhắc tên món hoặc quán để ảnh đổi đúng lúc; thêm `spokenAs` nếu cách đọc khác `name`. Đặt `rating` khi đã kiểm tra.
   - `moreDishes`: các quán còn lại (để đủ ≥5), chỉ liệt kê trong phần mô tả bài đăng.
5. `video:validate` cảnh báo cảnh nào chưa đủ 5 quán hoặc có quán dưới 4.5★.
6. **Điểm không tìm được quán gần đó** (hoang sơ, núi, đầm, hải đăng… không đủ quán ≥4.5★ dù đã gộp cảnh): đừng bỏ trống và đừng hạ chuẩn sao. Thay vào đó, **tìm bài báo và blog** (ví dụ "<điểm> ăn gì", "đặc sản gần <điểm>", "<điểm> review ẩm thực" trên VnExpress, Tuổi Trẻ, Báo Phú Yên/báo địa phương, các blog du lịch) để **đề xuất món nên thử** gắn với điểm đó: đặc sản của vùng, món dân địa phương hay ăn, hoặc món nên mang theo hay ăn trước khi tới.
   - Trên màn hình dùng `dishes` với `name` là tên món và `place` ghi nguồn gợi ý hoặc nơi nên ăn (ví dụ `"place": "Chợ Hòa Hiệp"`, `"address": "gợi ý từ VnExpress"`); **không đặt `rating`** khi không có điểm Google Maps thật. Không bịa tên quán.
   - Ghi bảng riêng trong `research/food.md`: điểm, món đề xuất, lý do, nguồn (link bài viết), ngày đọc. Trong phần mô tả bài đăng, ghi rõ đây là "món nên thử" chứ không phải quán đã kiểm tra.
   - Lời thuyết minh nói kiểu "ở đây ít quán, nên thử …" hoặc "ăn trước ở …", để người xem không đi tìm một quán không có thật.

## 4. Kịch bản và `video.json` (~10%)

- `brief.md`: mục tiêu, đối tượng xem, tone (thân thiện, thực tế, không đọc như quảng cáo), các điểm chính, ràng buộc.
- Cấu trúc cảnh:
  - `hook`: câu mở bằng lợi ích, ví dụ "Có ba ngày ở X? Lưu ngay lịch trình này…";
  - các cảnh `point`, mỗi điểm một cảnh, có `map`, `points`, `tip` và `dishes`;
  - `outro`: lời khuyên và CTA nhẹ nhàng, ví dụ "Lưu lại…", "Địa chỉ quán mình để ở phần mô tả".
- Câu thoại ngắn, dễ đọc thành tiếng. Mỗi cảnh khoảng 8–15 giây; cả video khoảng 70–100 giây.
- **Giới hạn ký tự khi dùng Vbee:** mỗi ký tự tốn 1 điểm. Kiểm tra điểm còn lại trước, và giữ tổng lời thuyết minh dưới số điểm đó.
- `map`: plate vùng gồm center, zoom, kích thước 1600; chạy `npm run video:map -- --slug <slug>`. Pin quá sát mép plate sẽ bị `validate` báo lỗi.
- Nhạc: `shared/music/travel-upbeat.mp3`, `volume` 0.8. Nhạc tự tổng hợp nên không lo bản quyền.
- Theo `src/schema.ts`; chạy `npm run video:validate -- --slug <slug>`.

## 5. Giọng đọc (~5%)

| Ngôn ngữ | Giọng mặc định | Cấu hình `narrator` |
|---|---|---|
| Tiếng Việt | **Giọng thiết kế `vi-nu-tre-03`** (giọng chuẩn của kênh từ 28/10/2026, OmniVoice qua VoiceStudio, không tốn điểm) | `{ "provider": "omnivoice", "voice": "vi-nu-tre-03" }` |
| Tiếng Việt (cũ) | Vbee HN - Ngọc Huyền | `{ "provider": "vbee", "voice": "hn_female_ngochuyen_full_48k-fhg" }` |
| Tiếng Việt (dự phòng, miễn phí) | Edge HoaiMy | `{ "provider": "edge", "voice": "vi-VN-HoaiMyNeural", "rate": "+10%" }` |
| Tiếng Anh | **Edge Ava** | `{ "provider": "edge", "voice": "en-US-AvaMultilingualNeural", "rate": "+5%" }` |

Người dùng có thể đổi giọng tuỳ ý; các giọng mẫu để so sánh nằm ở `danang-3n2d/pickup-voice/`.

**Giọng thiết kế OmniVoice (mặc định cho tiếng Việt):**
- Mẫu giọng nằm ở `C:\Users\thang\Thang_space\voices\vi-nu-tre-03.wav` cùng file `.txt` (lời của mẫu).
- VoiceStudio nằm ở `C:\Users\thang\Thang_space\VoiceStudio` và chạy bằng CPU.
- Lệnh tạo giọng:
  ```
  set HF_DEACTIVATE_ASYNC_LOAD=1
  <VoiceStudio>\.venv\Scripts\python scripts\voice-design\synth.py data\videos\<slug>\video.json <voices>\vi-nu-tre-03.wav <voices>\vi-nu-tre-03.txt <thư mục clip>
  npm run video:import-voice -- --slug <slug> --dir <thư mục clip>
  ```
- Máy chỉ có 7,7 GB RAM, nên mô hình được nạp ở dạng bfloat16, với `load_asr=False` và `HF_DEACTIVATE_ASYNC_LOAD=1`. Không làm vậy thì quá trình nạp sẽ sập với lỗi "access violation".
- Chạy ở chế độ nền: khoảng 1–2 phút cho mỗi cảnh. Nên đóng bớt trình duyệt trước khi chạy.
- **Chỉ nhân bản giọng khi có sự cho phép của chủ giọng.** Không nhân bản giọng của Vbee hay của người thật khi chưa được đồng ý. Muốn có giọng mới thì thiết kế bằng `scripts/voice-design/design.py` (khai báo giới tính, tuổi, cao độ, seed), nghe thử rồi chọn.
- Nghe kỹ dấu thanh và tên riêng trong clip.

**Vbee** (tạo trên Studio, vì tài khoản không có điểm API):
1. Kiểm tra số điểm Studio còn lại và báo người dùng nếu không đủ. **Không bấm** nâng cấp hay thanh toán.
2. `npm run video:vbee-script -- --slug <slug> --out <thư mục clip>`, rồi chạy từng file `vbee-studio-N.js` bằng `browser_run_code_unsafe` (tham số `filename`), trong trình duyệt đã đăng nhập `studio.vbee.vn`. Người dùng tự đăng nhập và tự nhập OTP/captcha.
3. `npm run video:import-voice -- --slug <slug> --dir <thư mục clip>`.
4. **Giới hạn theo ngày:** gói miễn phí ngoài tổng điểm còn có **trần điểm mỗi ngày**. Ngày 28/10/2026, Vbee chặn ("Bạn đã sử dụng gần hết điểm trong ngày") sau khoảng 430 điểm. Video khoảng 950 ký tự có thể phải tạo trong 2–3 ngày. Clip đã tạo cứ để trong thư mục clip; hôm sau chạy `--scenes` cho phần còn lại. **Không trộn giọng Vbee với Edge trong cùng một video.** Trong lúc chờ, có thể xuất bản nháp bằng Edge HoaiMy để duyệt hình.
5. **Popup và banner quảng cáo** của Vbee (lớp phủ khuyến mãi, hộp "tải lại nội dung làm việc trước?", banner iPhone nổi ở góc phải dưới) có thể che đúng chỗ nút tải về. Template đã tự đóng và ẩn chúng, và chỉ bấm khi điểm bấm nằm trong đúng dòng. Nếu trang chuyển sang `top-paid-event`, quay lại `/studio/text-to-speech` rồi tải clip có sẵn trong danh sách, **không tạo lại** (tạo lại là bị trừ điểm lần nữa).
6. **Nghe kỹ đoạn quảng cáo:** gói miễn phí có thể chèn lời quảng cáo vào cuối clip. Dấu hiệu là clip có nhiều cụm nói hơn số mệnh đề trong lời thuyết minh, hoặc có một khoảng lặng dài trước đoạn nói cuối. Cắt bằng `--trim <scene-id>=<giây>`.

**Edge:** `npm run video:voice -- --slug <slug>`. Có mốc thời gian từng từ, phụ đề khớp chính xác.

**Bản tiếng Anh:** dùng slug `<slug>-en` với `"language": "en"`, dùng lại ảnh và bản đồ của bản Việt. Trong lời thuyết minh, viết tên riêng không dấu (Hoi An, Mi Quang); trên màn hình, tên quán và địa chỉ giữ tiếng Việt có dấu.

## 5b. Dựng hình "điện ảnh": đừng để mọi cảnh giống một template

Nguyên tắc rút từ các hướng dẫn dựng video du lịch ngắn (Splice blog: flight-path, arrival reveal, map overlay transitions):
- Chuyển động nhẹ thường hiệu quả hơn chuyển động phức tạp.
- Giữ cùng một kiểu bản đồ và một bảng màu xuyên suốt video.
- Câu chuyện đi theo mạch: cất cánh, rồi đến nơi, rồi khám phá.

Các công cụ có sẵn trong bộ công cụ (`video.json`):

| Kỹ thuật | Cách dùng | Ghi chú |
|---|---|---|
| **Cảnh máy bay** từ Hà Nội và TP.HCM | Cảnh `"layout": "flight"`, có `flight.to` và `flight.from[]` (tên, lng, lat của sân bay); khai báo `flightMap` toàn quốc, kích thước 1080×1920, rồi chạy `npm run video:map -- --slug <slug> --which flight` | Đặt ngay sau hook, để khán giả cả hai miền thấy đường đến. Mỗi máy bay vẽ đường bay cong ra biển, mũi quay theo hướng bay, và ghim điểm đến nhấp nháy khi hạ cánh. Chỉ ghi "bay thẳng" khi đã kiểm tra hãng có đường bay đó; không ghi thời gian bay nếu chưa có nguồn. |
| **Lia máy** trên ảnh | Tự động: đẩy vào, lia ngang, kéo ra, lia dọc, trôi chéo; mỗi ảnh và mỗi cảnh một kiểu | Ảnh nên lớn hơn hoặc bằng 1600px để phóng 1,2× vẫn nét |
| **Ảnh tràn khung** | `"frame": "full"`: ảnh phủ cả khung, chữ nằm trên ảnh có lớp phủ tối | Xen kẽ với `split` (ảnh ở trên, chữ ở dưới). Nên dùng cho hook, cảnh đêm, cảnh bình minh, outro. |
| **Chuyển cảnh khác nhau** | `"transition": "fade" \| "slide" \| "wipe" \| "iris"` | Chỉ dùng kiểu CSS. Các kiểu WebGL (cross-zoom, film-burn, ripple…) cần GPU. Iris hợp cho outro, slide hợp khi đổi ngày. |
| **Nền đổi theo cảnh** | Quầng sáng sau chữ lấy màu `accent` của từng cảnh | Mỗi ngày một màu nhấn |
| **Bản đồ lộ trình trong ngày** | Cảnh `point` có `"route": [{name,lng,lat}, …]`: camera zoom vừa khung các điểm, ghim đánh số rơi lần lượt, đường chấm nối điểm trước tới điểm sau (`src/RouteMap.tsx`). Có `gallery` thì bản đồ chạy 4,5 giây rồi tới ảnh; **không có `gallery` thì bản đồ giữ cả cảnh**. | Dùng cho ngày nhiều điểm, và **cho điểm không có ảnh tự do** (Vân Hòa, Vực Hòm, Hòn Yến… không có ảnh CC trên Wikimedia/Openverse): thà dùng bản đồ còn hơn dùng ảnh nơi khác. Hai điểm cách nhau dưới ~1,5 km thì gộp thành một ghim ("Mỏm Cá Mập · Gành Đèn") để nhãn không đè nhau. Điểm phải nằm trong `map` plate (cách mép ≥100px). |

Ý tưởng cho lần sau (chưa làm):
- Cắt "whip pan" (lia nhanh có nhoè) giữa hai cảnh cùng một ngày.
- Mở đầu bằng "scale reveal": bắt đầu cận cảnh, kéo ra toàn cảnh.
- Thêm footage video có giấy phép (Pexels, Pixabay) xen giữa các ảnh tĩnh.
- Parallax: tách lớp tiền cảnh và hậu cảnh của ảnh. Cần ảnh đã tách nền.

## 6. Dựng, xuất và kiểm tra (~10%)

```bash
npm run video:pipeline -- --slug <slug> --final   # music → map → voice → validate → render → description
npm run lint
```

- Sau mỗi lần sửa: **xoá video cũ, render lại `final.mp4`**, báo đường dẫn. Chỉ commit khi người dùng bảo.
- Trích khung hình để tự kiểm tra, rồi xem bằng Read. Trên Windows, gọi thẳng `node_modules\@remotion\compositor-win32-x64-msvc\ffmpeg.exe`, vì `npx` (cmd) cắt tham số tại dấu phẩy. Bản ffmpeg này không có bộ lọc `pad`, `tile`, `drawtext` và `volumedetect`; chỉ dùng `scale`. Những điểm cần xem: **tiêu đề cảnh (`caption`) phải nằm trên một dòng** (khoảng ≤ 16 ký tự; nếu xuống dòng, quán thứ ba bị phụ đề che, ví dụ "Tháp Bà · Hòn Chồng" phải rút thành "Tháp Bà Ponagar"), chữ có tràn không, có đè lên vùng nút của TikTok không (lề phải 140px), phụ đề có nằm đáy không, ảnh có đúng nơi không.
- Đo âm lượng: giọng phải to hơn nhạc và đỉnh không vượt -0.5 dBFS.
- Đi hết **Review checklist** trong README.

## 7. Đăng TikTok (~5%)

1. **Caption** `output/<slug>/tiktok-caption.txt`, **dưới 4.000 ký tự**, gồm:
   - một câu hook ngắn có emoji;
   - lịch trình theo ngày (📍);
   - một dòng về quán ăn (🍜);
   - câu hỏi kéo bình luận;
   - 8–10 hashtag (tên nơi, tỉnh, `#dulich<noi>`, `#lichtrinhdulich`, `#dulichvietnam`, `#reviewdulich`, `#fyp`; bản tiếng Anh thì `#vietnamtravel`, `#traveltok`…);
   - phần ghi nguồn: các ảnh CC BY và CC BY-SA (tác giả · giấy phép · tên file), dòng bản quyền bản đồ OpenStreetMap, ghi chú giọng đọc AI.
2. **Ảnh bìa:** render ảnh tiêu đề không có phụ đề:
   ```
   npx remotion still src/index.ts TravelShort output/<slug>/cover.jpg --frame=105 --props=<video.json đã đặt subtitles:false> --image-format=jpeg
   ```
3. **Đăng bằng Playwright MCP:**
   - Người dùng tự đăng nhập TikTok, ví dụ bằng mã QR. Mở `https://www.tiktok.com/tiktokstudio/upload` và đặt viewport 1440×1000.
   - Tải video lên bằng `setInputFiles` vào `input[type=file]`.
   - **Dán caption** bằng một ClipboardEvent `paste` vào ô `[contenteditable]`. Gõ từng dòng sẽ bị mất dòng do popup gợi ý hashtag. Sau khi dán, kiểm tra lại nội dung trong ô. **Dán phần caption trừ dòng hashtag.**
   - **Hashtag phải được chọn từ gợi ý của TikTok**, không chỉ gõ chữ `#tag`. Hashtag gõ hoặc dán thẳng chỉ là chữ thường, không gắn link và không lên trang hashtag. Làm như sau:
     - đặt con trỏ ở cuối caption, bấm nút **"# Hashtags"** hoặc gõ `#`;
     - gõ từng tag bằng `keyboard.type`, đợi khoảng 1,5 giây cho danh sách gợi ý hiện ra, rồi **bấm vào đúng dòng gợi ý** có tên trùng tag (danh sách có kèm số lượt xem);
     - kiểm tra trong ô caption: tag đã chọn hiện thành một khối hashtag (phần tử có class hoặc thuộc tính hashtag), chứ không chỉ là chữ;
     - tag không có trong gợi ý thì bỏ, hoặc đổi sang tag phổ biến gần nghĩa.
   - Ảnh bìa: bấm **Edit cover → Upload cover → chọn cover.jpg → Save**.
   - Cài đặt: chế độ hiển thị (mặc định Everyone), bình luận bật. Nhãn AI để tắt, trừ khi người dùng muốn bật.
   - **Tự bấm Post, không cần hỏi lại** (người dùng dặn ngày 29/10/2026): video đã xuất và xem khung hình ổn là đăng luôn, cả bản tiếng Việt lẫn tiếng Anh. Nếu hiện hộp "Continue to post?" thì chọn "Post now".
   - **Giới hạn 4.000 ký tự tính cả hashtag.** TikTok đếm nhiều hơn số ký tự của file một chút; khi chạm trần, các hashtag cuối không gõ vào được. Giữ phần dán (không kể hashtag) dưới khoảng 3.800 ký tự và kiểm tra bộ đếm `x/4000` trước khi bấm Post.
   - Đừng `page.goto` lại trang upload khi trang đang có bản nháp: hộp "rời trang?" (beforeunload) làm lệnh bị huỷ. Mở trang bằng `browser_navigate` rồi chạy script không có `goto`. Không chạy hai script gõ phím cùng lúc vào ô caption (chữ sẽ lẫn vào nhau).
   - Kiểm tra ở `tiktokstudio/content`. Bài đăng khi phần kiểm tra nội dung chưa xong có thể bị "Content under review", tạm hiện "Only me"; sau khi duyệt sẽ tự chuyển công khai.

---

## Quy tắc chung

- **Đúng sự thật:** địa điểm khớp ảnh, quán có thật và còn mở cửa, sao và địa chỉ đã kiểm tra trên Google Maps. Không bịa.
- **Bản quyền:** chỉ dùng ảnh và video có giấy phép, và ghi nguồn đầy đủ.
- **An toàn tài khoản:** không nhập mật khẩu, OTP hay captcha thay người dùng; không in token; không bấm thanh toán hay nâng cấp; bí mật để trong `.env`.
- **Hỏi trước** khi làm việc khó hoàn tác hoặc hướng ra bên ngoài (tiêu điểm Vbee nhiều…). Riêng việc đăng TikTok video đã kiểm tra thì tự đăng (mục 7).
- **Làm trọn gói** (người dùng dặn ngày 29/10/2026): khi được giao làm video cho một nơi, tự làm từ nghiên cứu tới đăng TikTok, cả bản tiếng Việt và tiếng Anh, không chờ duyệt. Chỉ dừng lại hỏi khi có sự cố nghiêm trọng (mất đăng nhập, cần thanh toán, dữ liệu có thể mất).
- Commit chỉ khi người dùng nói "Commit giúp tôi".
