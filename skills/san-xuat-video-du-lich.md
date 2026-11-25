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

### 1a. Nên ở đâu: khu lưu trú (người dùng yêu cầu 02/11/2026)

Mỗi video du lịch có thêm phần **gợi ý khu nên ở**, để du khách cân nhắc trước khi đặt phòng. Đây là một bước nghiên cứu riêng:
- Tìm "<nơi> nên ở khu nào", "<nơi> ở đâu tiện đi chơi", "where to stay in <nơi>", và đọc bình luận TikTok về chỗ ở (ồn, xa, bị chặt chém, gần chợ đêm…).
- Chọn **2–3 khu**, mỗi khu hợp một kiểu khách. Ví dụ: trung tâm gần phố đi bộ, tiện ăn uống; ven sông hoặc ven biển, yên tĩnh, view đẹp; homestay hay nhà vườn ngoại ô, giá mềm. Mỗi khu ghi ưu điểm, nhược điểm, khoảng cách tới các điểm trong lịch trình, và mức giá phòng tham khảo **chỉ khi có nguồn**.
- Có thể gợi ý vài chỗ ở cụ thể (khách sạn, homestay) **≥4.5★ trên Google Maps với ≥50 lượt** (kiểm tra như quán ăn ở mục 3). Không gợi ý chỗ chưa kiểm tra, không ghi giá nếu không có nguồn.
- Ghi vào `research/stay.md`: khu, hợp với ai, ưu và nhược điểm, khoảng cách, chỗ ở gợi ý (sao, lượt, link Maps, ngày kiểm tra), nguồn.
- Trong video: một cảnh ngắn "Nên ở đâu?" (khoảng 6–10 giây), đặt sau cảnh đến nơi (máy bay hay hook) hoặc ngay trước outro, ghim các khu trên bản đồ hoặc dùng ảnh khu đó. Chữ trên màn hình vẫn đặt ở phần dưới (y ≥ ~1300). Trong mô tả bài đăng có thêm mục 🏨 liệt kê các khu và chỗ ở gợi ý.

### 1a2. Chi phí ước tính: liệt kê từng khoản (người dùng yêu cầu 07/11/2026, từ Sa Pa)

Mỗi video du lịch có thêm cảnh **"Hết bao nhiêu tiền?"** đặt **ngay sau cảnh "Nên ở đâu?"**:
- Liệt kê từng khoản cho **1 người**, theo đúng lịch trình của video (3N2Đ và 4N3Đ tính riêng):
  - di chuyển tới nơi, khứ hồi (xe khách, limousine, tàu, máy bay);
  - phòng: số đêm × giá phòng, chia cho 2 người ở chung;
  - đi lại tại chỗ (thuê xe máy theo ngày, taxi, xe điện);
  - vé tham quan: từng vé có tên, ví dụ "Cáp treo Fansipan khứ hồi 850k";
  - ăn uống theo ngày;
  - **tổng**, ghi dạng khoảng, ví dụ "khoảng 3,2–4,5 triệu/người".
- Mỗi con số phải có nguồn: báo (VnExpress), trang chính thức, bảng giá trên Google Maps hay trang đặt phòng, hoặc mức giá creator TikTok nói trong video, ghi là "theo review TikTok". Ghi vào `research/cost.md`: khoản, mức giá, nguồn (link), ngày đọc. Khoản không có nguồn thì bỏ, không đoán. Giá ghi dạng khoảng và làm tròn, ví dụ "250–350k".
- Trên màn hình là một thẻ kiểu hoá đơn hay bảng kê: các dòng hiện lần lượt, số tiền đếm lên, dòng tổng in đậm ở cuối. Chữ vẫn ở phần dưới (y ≥ ~1300) và ghi nhỏ "giá tham khảo · <tháng/năm>". Cảnh dài khoảng 8–12 giây. Lời thuyết minh chỉ đọc tổng và 2–3 khoản lớn nhất.
- Trong mô tả bài đăng thêm mục 💰 liệt kê đủ các khoản và tổng, ghi rõ là giá tham khảo và ngày kiểm tra.

### 1b. Nghiên cứu trên TikTok: xem video và lướt bình luận

TikTok cho biết điểm nào đang hot, điểm nào đã đóng, chỗ nào chặt chém, nên đi giờ nào. Blog thường chậm hơn vài tháng. Làm bằng Playwright MCP trong trình duyệt đã đăng nhập TikTok:

1. **Tìm video:** mở `https://www.tiktok.com/search/video?q=<từ khoá>`, với nhiều từ khoá: "<nơi> 3n2d", "lịch trình <nơi>", "<nơi> có gì chơi", "<nơi> ăn gì", "review <điểm>", "<nơi> đừng đi". Lấy danh sách bằng `page.evaluate` (link `a[href*="/video/"]`, lượt xem, mô tả). Chọn **ít nhất 20 video cho mỗi địa điểm** (người dùng yêu cầu 15/11/2026, trước đây là 6–10). Ưu tiên video nhiều lượt xem, đăng trong 12 tháng gần đây, của nhiều creator khác nhau. Video phải phủ đủ lịch trình, từng điểm chính, ăn uống, chỗ ở, chi phí và cảnh báo ("đừng đi", "chặt chém").
   - **Mỗi video trong 20 video phải đọc hết lời thoại (bước 2b) và đọc bình luận (bước 3).** Video chỉ xem lướt hoặc chỉ đọc caption thì không tính.
   - Đầu `research/tiktok.md` có bảng đếm: STT, link, tài khoản, lượt xem, ngày đăng, đã đọc lời thoại (có/không, phụ đề hay whisper), số bình luận đã đọc, ý hữu ích. **Chưa đủ 20 dòng đọc trọn cả hai phần thì chưa chuyển sang viết kịch bản.**
   - Video du lịch và video ẩm thực của cùng địa điểm được dùng chung những video có nói về cả hai, nhưng mỗi loại vẫn cần đủ 20 video liên quan.
   - Máy ít RAM nên chép lời bằng whisper từng video một và đóng trình duyệt khi xong.
2. **Xem video:** mở từng link, chụp màn hình (`page.screenshot` của khung video) ở 3–5 thời điểm, vì creator hay ghi tên điểm, giá và giờ thành chữ trên video. Xem ảnh bằng Read và đọc caption.
2b. **Lấy lời thoại (script) của video (người dùng yêu cầu 07/11/2026):** đọc lời nói của cả video để hiểu trọn nội dung (lịch trình, giá, mẹo, quán), không chỉ dựa vào caption và vài khung hình. Làm song song với bước đọc bình luận.
   - Cách 1, phụ đề tự động của TikTok: trên trang video, đọc `window.__UNIVERSAL_DATA_FOR_REHYDRATION__` → `__DEFAULT_SCOPE__["webapp.video-detail"].itemInfo.itemStruct.video.subtitleInfos`, lấy mục có `LanguageCodeName` là `vie-VN`, rồi `fetch(Url)` (WebVTT) ngay trong trang để có lời thoại kèm mốc thời gian.
   - Cách 2, khi video không có phụ đề: tải âm thanh bằng `yt_dlp` rồi chép lời bằng `faster_whisper` (mô hình `small`, `compute_type="int8"`, `language="vi"`). Cả hai đều có sẵn trong venv của VoiceStudio. Chạy từng video một và không chạy cùng lúc với OmniVoice, vì máy ít RAM.
   - Ghi tóm tắt lời thoại của từng video vào `research/tiktok.md`, gồm các mốc chính, giá, quán và mẹo. File lời thoại thô để trong thư mục tạm, không commit, không chép lời của creator vào video.
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
- **Mỗi điểm đến (mỗi cảnh `point`) phải có ít nhất 3 ảnh thật của chính điểm đó** (người dùng yêu cầu 31/10/2026). Cảnh hook và outro dùng ảnh đẹp nhất.
  - Tìm đủ nguồn trước khi kết luận thiếu ảnh: Commons (tìm kiếm và danh mục, tên có dấu, không dấu, tiếng Anh), Openverse, Flickr CC không watermark, Pexels, Pixabay.
  - Không đủ 3 ảnh thì **đổi sang điểm khác** hoặc gộp với điểm gần đó có đủ ảnh. Bản đồ lộ trình chỉ là phần thêm, không thay cho ảnh (Cù Lao Xanh ở Quy Nhơn từng chỉ có bản đồ, không làm vậy nữa).
  - Không lấy ảnh nơi khác thay vào. Ảnh món ăn có thì tốt (đặt `image` trong dish), không có cũng được.
- Video clip (`.mp4`/`.webm`) dùng được trong `gallery`. Chỉ lấy video có giấy phép rõ ràng (Commons, Pexels, Pixabay) và ghi nguồn vào `credits.json` bằng tay.
- **Mở đầu bằng footage + nhạc, chưa có giọng (người dùng yêu cầu 16/11/2026):** vài giây đầu là clip đẹp nhất của chính địa điểm trên một đoạn nhạc kiểu trend TikTok, không có lời thoại; sau đó mới vào giọng giới thiệu như các video khác. Không ghép bài hát có bản quyền vào file render (TikTok kiểm tra bản quyền nhạc sẽ tắt tiếng); dùng nhạc tự tổng hợp hoặc nhạc miễn phí bản quyền theo phong cách trend.
- **Ưu tiên video hơn ảnh (người dùng yêu cầu 16/11/2026):** từ giờ mọi video (du lịch lẫn ẩm thực) chèn **càng nhiều clip quay đúng địa điểm hoặc đúng món càng tốt**; ảnh tĩnh chỉ để lấp chỗ không có clip. Tìm clip trước khi tìm ảnh, và ưu tiên điểm có nhiều clip.
- **Bắt buộc đan xen video clip với ảnh (người dùng yêu cầu 14/11/2026, sau Cát Bà):** mỗi video du lịch phải chèn thêm footage chuyển động xen giữa ảnh, không chỉ ảnh tĩnh. Video tập trung vào **cảnh thiên nhiên đẹp**: flycam núi, biển, vịnh, ruộng bậc thang, thác, cung đường, hoàng hôn, mây. Ưu tiên clip cho hook, outro và các điểm thiên nhiên; mỗi cảnh `point` có clip thì đặt 1 clip (thường mở đầu cảnh), xen kẽ với ≥3 ảnh của điểm đó.
  - Nguồn: Pexels (mở trang video, chỉ lấy clip có tiêu đề hoặc mô tả ghi đúng địa danh; file `videos.pexels.com/video-files/<id>/..._2560_1440_25fps.mp4`), Pixabay, Wikimedia Commons (CC BY, BY-SA, CC0). Không lấy clip YouTube, TikTok hay Facebook của người khác. Ghi tác giả và nguồn vào `credits-extra.json` để lên phần ghi nguồn của mô tả.
  - Xử lý: tải bản gốc vào `public/videos/<slug>/footage/raw/` (đã gitignore), rồi cắt dọc và chỉnh màu bằng ffmpeg, ví dụ `-ss <bắt đầu> -t 6 -vf "crop=810:1440,scale=1080:1920,eq=contrast=1.22:saturation=1.45:brightness=0.015:gamma=0.97,unsharp,fps=30" -an -c:v libx264 -crf 20` ra `footage/<tên>.mp4`. Mỗi clip 4–8 giây, không tiếng, xem vài khung để chắc không có watermark, chữ hay mặt người quá rõ.
  - Dựng trong HyperFrames: `<video class="clip" muted playsinline data-start data-duration data-track-index>` trong khung ảnh; section cảnh không được có `clip`/`data-start` (lint `video_nested_in_timed_element`). Mẫu: `D:\Thang_space_archive\cat-ba/hf/build-catba.mjs`.
  - Điểm nào không tìm được clip đúng nơi thì dùng ảnh như cũ, **không lấy clip nơi khác thay vào**.
- **Che mặt người trong clip TikTok (người dùng yêu cầu 20/11/2026, Đà Lạt):** đoạn clip lấy từ TikTok mà **chủ video** (người quay vlog, bạn đi cùng, người mẫu tạo dáng) lộ rõ mặt ở gần thì phải che mặt họ bằng sticker (emoji hoặc hình tròn có biểu tượng) bám theo khuôn mặt suốt đoạn đó, để không vi phạm quyền riêng tư. **Không che** mặt cô chú bán hàng, nhân viên quán, người dân hay khách khác ở địa điểm. Ưu tiên chọn đoạn quay cảnh, tay, món ăn; đoạn nào buộc phải dùng thì dò mặt từng khung (OpenCV, script `hf/face-stickers.py` của dự án `D:/Thang_space_archive/da-lat`) (chế độ `--proof` để xem ai bị dò), chỉ chọn các clip có mặt chủ video rồi dán sticker trước khi đưa vào dựng. Người ở xa, chỉ thấy dáng hoặc lưng thì không cần che. Kiểm tra lại khung hình trong final.mp4.
- **Không dùng** ảnh lấy từ Google Images, ảnh trong blog, Facebook hay TikTok của người khác.

**Tìm ảnh hiệu quả:** tìm kiếm toàn văn trên Commons hay trả về kết quả rác với tên tiếng Việt. Nên duyệt theo **danh mục** (API `generator=categorymembers`, ví dụ `Category:Tuy Hoa`, `Category:Dien Cape`, `Category:Tuy An District`), chậm khoảng 2 giây mỗi lượt gọi vì Commons hay chặn khi gọi dồn. Openverse (`api.openverse.org`, `license=by,by-sa,cc0,pdm`) là nguồn dự phòng. Điểm không đủ 3 ảnh thì đổi điểm khác, không lấy ảnh nơi khác thay vào và không để cảnh chỉ có bản đồ.

## 3. Món ăn và quán ăn ngon (~25%)

**Quy tắc bắt buộc:**
- Mỗi điểm du lịch (mỗi cảnh `point`) có **ít nhất 5 quán ăn**, mỗi quán **≥ 4.5★ trên Google Maps**, với **ít nhất ~50 lượt đánh giá**, để tránh quán 5.0★ mà chỉ có 3 lượt.
- Quán phải ở gần điểm đó (cùng khu, khoảng 15 phút đi xe), hoặc trên đường đi.
- **Ảnh chụp Google Maps làm bằng chứng (người dùng yêu cầu 04/11/2026):** mỗi quán lên màn hình phải kèm ảnh chụp phần đầu trang Google Maps của quán, gồm tên quán và dòng số sao + số lượt đánh giá, để người xem tin hơn. Chụp bằng Playwright ở `deviceScaleFactor: 2`, `locale: "vi-VN"`: mở `/maps/search/<tên quán>/@lat,lng,14z?hl=vi`, bấm kết quả đầu, rồi chụp vùng từ `h1` tới `div.F7nice` (đệm khoảng 12 px, cắt bỏ dòng loại hình quán bên dưới). Lưu vào `public/videos/<slug>/maps/<quán>.png`, kiểm tra tên và số sao khớp với dữ liệu, rồi đóng trình duyệt. Trong video, khi thẻ quán hiện lên thì một khung "📍 Google Maps · chụp <ngày>" (rộng ~620 px, đáy ở y ≈ 1090, ngay trên thẻ quán) trượt vào lần lượt từng ảnh chụp, đồng thời dòng quán tương ứng trên thẻ sáng lên. Khi đủ thông tin (ảnh chụp cuối đã vào, thêm khoảng 1,6 giây để đọc), **thẻ quán và khung Maps cùng mờ đi để lộ lại ảnh cho người xem** (người dùng yêu cầu 08/11/2026), không giữ tới hết cảnh. Nếu quán được nhắc quá sát cuối cảnh, cho thẻ hiện sớm hơn một chút để vẫn còn ít nhất ~1 giây ảnh sạch trước khi chuyển cảnh. Mẫu: `D:\Thang_space_archive\ha-giang/hf/build-hg.mjs` (hàm `clearAt`, `hideOut`). Không sửa hay che số sao trong ảnh. Mẫu: `D:\Thang_space_archive\moc-chau\hf/build-mc.mjs` (hàm `proofs`) và script chụp `hf/maps-mc-shot.js` cùng thư mục.

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
  - cảnh "Nên ở đâu?" lấy từ `research/stay.md` (mục 1a);
  - cảnh "Hết bao nhiêu tiền?" ngay sau đó, lấy từ `research/cost.md` (mục 1a2);
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
| **Bản đồ lộ trình trong ngày** | Cảnh `point` có `"route": [{name,lng,lat}, …]`: camera zoom vừa khung các điểm, ghim đánh số rơi lần lượt, đường chấm nối điểm trước tới điểm sau (`src/RouteMap.tsx`). Có `gallery` thì bản đồ chạy 4,5 giây rồi tới ảnh; **không có `gallery` thì bản đồ giữ cả cảnh**. | Dùng cho ngày nhiều điểm, chạy trước phần ảnh. **Không dùng thay ảnh**: mỗi điểm vẫn cần ≥3 ảnh thật (từ 31/10/2026); điểm không có ảnh tự do (Vân Hòa, Vực Hòm, Hòn Yến…) thì đổi điểm. Hai điểm cách nhau dưới ~1,5 km thì gộp thành một ghim ("Mỏm Cá Mập · Gành Đèn") để nhãn không đè nhau. Điểm phải nằm trong `map` plate (cách mép ≥100px). |
| **Con dấu hộ chiếu** (từ Phú Quốc) | Mỗi cảnh `point` có một con dấu tròn kiểu hộ chiếu ("✈ PHÚ QUỐC / NGÀY 1 / SÁNG") ở góc trên bên phải. Con dấu đóng "bộp" xuống ngay khi bản đồ chuyển sang ảnh: rơi từ 2,4 lần, nảy nhẹ và toả vòng mực màu accent. Cảnh chẵn và cảnh lẻ nghiêng ngược chiều nhau (`src/Scene.tsx`: `PassportStamp`, lấy chữ từ `label` và `theme.brand`). | Hợp với điểm đến phải bay tới. Tắt bằng cách bỏ khối `PassportStamp` trong `Scene.tsx`. |
| **Máy ảnh chụp + toạ độ GPS** (từ Quy Nhơn) | Thay con dấu hộ chiếu. Khi bản đồ chuyển sang ảnh, hai lá chập màn trập khép lại rồi mở ra, có chớp đèn trắng. Sau đó bốn góc khung ngắm màu accent nảy vào, và ô "● REC · NGÀY 1 · SÁNG" hiện ở góc phải, bên dưới là toạ độ GPS của điểm gõ dần từng ký tự ("📍 13.7868°N · 109.2111°E", lấy từ `map` hoặc điểm đầu của `route`). Chấm REC nhấp nháy. Cảnh chỉ có bản đồ (không ảnh) thì chụp ngay đầu cảnh (`src/Scene.tsx`: `ViewfinderSnap`). | Hợp với video thiên về "đi và chụp". Lần sau có thể đổi sang kiểu khác (con dấu, tem thư…). |

### Mỗi video phải có điểm mới về dựng (người dùng yêu cầu 30/10/2026)
- **Phong cách edit và hiệu ứng phải sáng tạo, biến tấu liên tục** (người dùng nhắc lại 30/10/2026), cho cả video du lịch lẫn ẩm thực, để nhiều video liên tiếp không cùng một kiểu. Ví dụ: đổi kiểu chuyển cảnh, nhịp cắt, kiểu khung ảnh, overlay, cách hiện quán ăn.
- **Đừng làm video nào cũng một kiểu.** Mỗi điểm đến mới phải **thêm hoặc chỉnh ít nhất một điểm** về hiệu ứng, chuyển cảnh hay cách dựng, sao cho sáng tạo và hợp với nơi đó.
  - Gợi ý: hiệu ứng con trỏ chuột bấm chuyển cảnh, giống bên video ẩm thực Nha Trang (`src/DishScene.tsx`: `Cursor`, `NextButton`).
  - **Đây chỉ là gợi ý, không bắt buộc.** Con trỏ chuột hay bất kỳ hiệu ứng nào khác đều linh hoạt theo từng video. Cứ thoải mái sáng tạo: chọn cái hợp với địa điểm, có thể bỏ, đổi hoặc nghĩ cái mới.
  - Hoặc: kiểu nền và hoa văn khác nhau, kiểu chuyển cảnh mới, nhịp cắt khác, hay một trong các ý tưởng bên dưới.
- Ghi điểm mới vào bảng trên, kèm tên điểm đến, để lần sau tránh lặp lại.
- Giữ nhất quán **trong** một video (một kiểu bản đồ, một bảng màu), nhưng **giữa các video** thì phải khác nhau.

### 10 video liên tiếp không trùng phong cách, dựng điện ảnh, nội dung đúng trải nghiệm thật (người dùng yêu cầu 15/11/2026)
Người dùng khen bản làm lại Cao Bằng (footage xen ảnh, âm thanh chuyển cảnh, hiệu ứng) và muốn giữ mức đó cho mọi địa điểm sau.

**Không trùng phong cách trong 10 video liên tiếp** (tính chung du lịch và ẩm thực):
- Nhật ký chung: `D:\Thang_space_archive\STYLE-LOG.md`, 10 dòng, mỗi dòng 8 cột: intro, outro, kiểu đổi ảnh, lớp phủ, huy hiệu cảnh, cảnh chi phí/thẻ món, bộ shader, bảng màu.
- Trước khi viết builder mới: đọc nhật ký, chọn **intro, outro, kiểu đổi ảnh, lớp phủ và huy hiệu chưa có trong 10 dòng**; so với bất kỳ dòng nào chỉ được trùng tối đa 2/8 cột; bộ shader không được y hệt (đổi ít nhất 3/5). Ý tưởng chưa dùng nằm ở cuối file nhật ký.
- Video du lịch và video ẩm thực của cùng một địa điểm cũng phải khác nhau rõ (không cùng lớp phủ, không cùng kiểu đổi ảnh).
- Dựng xong: thêm dòng mới lên đầu nhật ký, bỏ dòng cũ nhất, và vẫn ghi vào bảng intro/outro bên dưới.

**Dựng điện ảnh:**
- Mở bằng hình đẹp nhất có chuyển động (footage flycam, bình minh, mây trôi) trong 1–2 giây đầu; câu hook nói lợi ích ngay.
- Xen footage thật với ảnh (mỗi cảnh thiên nhiên ít nhất một clip 4–8 s nếu có nguồn đúng nơi); ảnh tĩnh luôn có chuyển động máy (push-in, lia, parallax).
- Chỉnh màu thống nhất cả video (một LUT/`eq` chung theo mùa: lạnh cho mùa đông, ấm cho ẩm thực), letterbox hoặc vignette nhẹ khi hợp.
- **Chuyển giữa hai địa điểm bằng một chuỗi 3–4 ảnh** (người dùng gợi ý 20/11/2026): hết phần một địa điểm, có thể cho hiện nhanh 3–4 ảnh (hoặc clip ngắn) của chính địa điểm đó như một danh sách hoặc dải ảnh, mỗi ảnh khoảng 0,6–1 s, rồi mới cắt sang cảnh địa điểm tiếp theo. Kiểu hiện (lưới, dải phim, xấp ảnh lật, cuộn ngang...) đổi theo từng video để không lặp phong cách. Ảnh phải đúng nơi đó và chưa trùng ảnh vừa dùng trong cảnh, mặt người vẫn theo luật che mặt.
- **Đoạn nghỉ không lời để ngắm cảnh (người dùng yêu cầu 21/11/2026):** thỉnh thoảng chèn một đoạn ngắn (khoảng 3–5 giây, 2–4 đoạn mỗi video, thường ngay sau lời của một địa điểm hoặc trước địa điểm kế tiếp) **không có giọng, không có thẻ chữ**, chỉ có footage đẹp nhất của chính nơi đó và nhạc nền được nâng lên một chút, để người xem ngắm. Phụ đề để trống ở đoạn này.
- **Đoạn ngắm cảnh giữ nguyên âm thanh gốc TikTok (người dùng yêu cầu 22/11/2026, thác 72):** mỗi video có **2–3 đoạn ngắm cảnh**: giọng đọc dẫn trước một câu kiểu "Sau đây là vài thước phim về <nơi>", rồi tới chuỗi 2–4 clip ngắn lấy từ video TikTok của chính nơi đó, **giữ nguyên âm thanh gốc của clip** (tiếng thác, gió, tiếng người quay), nhạc nền tắt hoặc hạ rất nhỏ, không phụ đề, không thẻ chữ (chỉ tag nhỏ 🎥 @handle ghi nguồn). Quy tắc này thay cách làm đoạn nghỉ bằng nhạc nền ở dòng trên. Cắt clip giữ tiếng (`-c:a aac`, không dùng `-an`), chuẩn hoá âm lượng (loudnorm) để các clip đều nhau và không to hơn giọng đọc quá nhiều; tránh đoạn có nhạc bản quyền hay lời nói riêng tư rõ của creator.
- Nhịp cắt theo lời: đổi ảnh 3–5 s, đổi cảnh trúng nhịp câu; âm thanh chuyển cảnh (whoosh, bass hit, pop) nhỏ dưới giọng, khoảng 0,07–0,2.
- Chữ ít, to, ở nửa dưới; hiện vừa đủ để đọc rồi ẩn để trả lại hình (như thẻ quán + Maps).
- Kiểm tra từng frame trích từ `final.mp4` (không tin snapshot khi có shader), không frame đen, không chữ đè nhau.

**Uy tín: chỉ nói điều người đã đi thật chia sẻ và kiểm chứng được:**
- Lịch trình, mẹo, cảnh báo, giá lấy từ trải nghiệm thật: lời thoại và bình luận TikTok gần đây (≤12 tháng), blog cá nhân có ảnh tự chụp, báo du lịch. Mỗi ý đưa vào video phải có ít nhất một nguồn ghi trong `research/`; ý quan trọng (đường đi, giá, đóng cửa, mùa đẹp) cần 2 nguồn hoặc 1 nguồn báo/chính thức.
- Ưu tiên kinh nghiệm được nhiều người lặp lại (nhiều bình luận cùng nói), ghi rõ "theo review TikTok" khi chỉ có nguồn TikTok. Không phóng đại, không bịa con số, không lấy kinh nghiệm mùa khác cho mùa này.
- Đúng mùa đăng: kiểm tra thời tiết, mùa hoa, mực nước, lễ hội của tháng đăng; ảnh và clip phải hợp mùa (bỏ clip nước lũ khi nói mùa khô...).
- Quán và chỗ ở vẫn theo chuẩn ≥4.5★, ≥50 lượt kèm ảnh chụp Maps; quán nổi tiếng dưới chuẩn chỉ ghi ở mô tả kèm số sao thật.
- Mô tả bài đăng có nguồn cho giá và các con số, ghi ngày kiểm tra.

### Đổi intro và outro theo vòng (người dùng yêu cầu 02/11/2026)
- **Cứ sau 2 địa điểm thì đổi kiểu intro và outro**, kèm đổi một vài hiệu ứng chính (chuyển cảnh, kiểu thẻ quán, kiểu tiêu đề). Mục đích là để nhiều video liên tiếp về các địa điểm không trông giống nhau.
- Ví dụ: Sài Gòn và Huế đều mở bằng cảnh vệ tinh zoom từ địa cầu xuống, nên địa điểm tiếp theo **quay lại intro máy bay** (cảnh `flight`, bay từ Hà Nội và TP.HCM), hoặc chọn một intro khác chưa dùng gần đây.
- Các kiểu intro có thể xoay vòng: máy bay bay tới; vệ tinh zoom từ địa cầu; "scale reveal" từ cận cảnh kéo ra toàn cảnh; cắt dồn nhanh các ảnh đẹp nhất có chớp trắng; tấm vé, tem thư hay hộ chiếu mở ra; bản đồ giấy vẽ dần lộ trình.
- Các kiểu outro có thể xoay vòng: tựa lớn trên ảnh đẹp nhất; bản đồ tổng kết cả lộ trình; checklist các điểm được tick lần lượt; thanh đen khép lại như cảnh cuối phim; tấm bưu thiếp "Lưu lại nhé!".
- Trước khi dựng, xem bảng nhật ký dưới đây và **không lặp intro hay outro của 2 địa điểm gần nhất**. Làm xong thì thêm một dòng vào bảng.

| Địa điểm | Intro | Outro |
|---|---|---|
| Phú Quốc, Quy Nhơn | hook ảnh, rồi cảnh máy bay | (chưa ghi) |
| Sài Gòn (31/10/2026) | vệ tinh zoom từ địa cầu xuống Quận 1 | sdf-iris mở vào tựa lớn trên ảnh đẹp nhất |
| Huế (01/11/2026) | vệ tinh zoom từ địa cầu xuống Kinh thành | light-leak vào tựa lớn trên ảnh + nút CTA |
| Tam Đảo (02/11/2026, `tam-dao/hf/build-td.mjs`) | bản đồ địa hình vẽ dần đường Hà Nội → Vĩnh Yên → 13 km đèo → Tam Đảo, chấm sáng chạy theo đường, ghim rơi xuống (điểm gần Hà Nội, không bay) | bưu thiếp "Gửi từ Tam Đảo" rơi vào, có tem và dấu bưu điện đóng xuống |
| Mộc Châu (03/11/2026, `moc-chau/hf/build-mc.mjs`) | vé xe giường nằm Hà Nội → Mộc Châu trượt lên, bấm lỗ, đóng dấu "ĐÃ SOÁT VÉ", xé cuống theo đường răng cưa, rồi scale reveal ảnh (1,7× → 1×) | checklist các điểm được tick lần lượt trên giấy kem, rồi hai thanh đen khép lại như cảnh cuối phim |
| Cao Bằng (06/11/2026, `cao-bang/hf/build-cb.mjs`) | cắt dồn 5–6 ảnh đẹp nhất qua chớp trắng (mỗi ảnh 0,55 s, punch-in, nhãn tên điểm), rồi tựa lớn hiện trên ảnh cuối | "Lưu lại lịch trình": đường lộ trình uốn lượn, ghim đánh số rơi lần lượt theo ngày, nhãn hai bên |
| Sa Pa (07/11/2026, `sa-pa/hf/build-sp.mjs`) | hai mảng mây tách sang hai bên để lộ thung lũng, đồng hồ độ cao (từng cột số cuộn) dừng ở 3.143 m, rồi tựa lớn hiện ra | tựa lớn "Hẹn gặp ở Sa Pa" trên ảnh đẹp nhất, biển mây dâng lên từ dưới, nút "Lưu lại nhé!" |
| Hà Giang (08/11/2026, `ha-giang/hf/build-hg.mjs`) | tem thư có răng cưa rơi xuống nền giấy kraft, dấu bưu điện tròn "HÀ GIANG · CỰC BẮC · 1.470 m" đóng xuống, rồi camera lao xuyên qua ô ảnh của tem vào ảnh tràn khung, tựa lớn hiện ra | trang hộ chiếu du lịch: mỗi điểm đã đi được đóng một con dấu màu (chữ nhật/tròn, nghiêng xen kẽ), rồi nút "Lưu lại nhé!" |
| Ninh Bình (09/11/2026, `ninh-binh/hf/build-nb.mjs`; chỉ 2N1Đ, 3N2Đ, ẩm thực) | bản đồ giấy gấp 3 tấm mở ra lần lượt (lật 3D), đường đi Hà Nội → Ninh Bình vẽ dần (~90 km · khoảng 2 giờ), ghim rơi, camera lao vào ghim để vào ảnh, tựa lớn hiện ra | kết phim: hai thanh đen điện ảnh vào, lịch trình cuộn lên như danh đề cuối phim, rồi thanh đen khép kín, "Lưu lại nhé!" trên nền đen |
| Cát Bà (14/11/2026, `cat-ba/hf/build-catba.mjs`; chỉ 1 video 2N1Đ mùa lạnh, thiên về ngắm cảnh và cung đường) | màn hình dẫn đường trên điện thoại: đường đi vẽ dần qua cầu Tân Vũ – Lạch Huyện, cáp treo, đường ven biển 356, thẻ chỉ hướng đổi theo từng chặng ("5,44 km", "3.955 m", "~25 km"), chấm xe chạy theo, ghim rơi, camera lao vào ghim ra footage flycam thật, tựa lớn hiện ra | máy tính hành trình: bảng tổng kết (cầu 5,44 km, cáp treo 3.955 m, đường ven biển ~25 km, hoa lau T11–T12) hiện từng dòng, rồi tựa lớn "Hẹn gặp ở Cát Bà" trên footage + "Lưu lại nhé!" |
| Cao Bằng làm lại mùa đông (14/11/2026, `cao-bang/hf/build-cbw.mjs`; 3N2Đ) | lịch bloc treo tường: tờ "THÁNG 11" rồi NGÀY 1, 2, 3 bị xé lần lượt (xoay, bay khỏi gáy lịch), tờ cuối xé xong thì tường lịch phóng to mờ đi lộ footage flycam thật, tựa lớn hiện ra | dây phơi ảnh: 5 polaroid các điểm rơi xuống treo bằng kẹp gỗ (đung đưa elastic, ảnh lẻ treo thấp hơn), rồi tựa "Hẹn gặp ở Cao Bằng" + "Lưu lại nhé!" |
| **Địa điểm tiếp theo** | **đổi: không dùng màn hình dẫn đường hay lịch bloc; thử máy bay (nếu bay tới), vệ tinh zoom, vé tàu/vé xe** | **đổi: không dùng máy tính hành trình hay dây phơi polaroid; thử checklist, bưu thiếp hoặc tựa lớn trên ảnh** |

Hiệu ứng mới ở Tam Đảo (02/11/2026): sương trôi phủ cả video, biển gỗ treo đinh đung đưa thay con dấu ("NGÀY 1 / TRƯA"), thẻ kính xanh thông thay thẻ giấy, ảnh đổi bằng tan sương (nhoè + sáng), cảnh "Nên ở đâu?" (layout `stay`, thẻ theo cue), shader flash-through-white, cross-warp-morph, gravitational-lens, cinematic-zoom; whoosh khẽ 0.15 ở mỗi lần chuyển.

Hiệu ứng mới ở Mộc Châu (03/11/2026): cánh hoa mận trôi xuống phủ cả video, cuống vé bấm lỗ (có mẩu giấy rơi) thay biển gỗ, thẻ giấy màu kem sữa viền xanh chè, ảnh đổi bằng quét mép mềm (mask gradient trượt trái/phải, xen kẽ), shader light-leak, ripple-waves, domain-warp, chromatic-split; whoosh 0.15, tiếng "pop" 0.12 khi bấm vé. Ảnh: ngoài Commons, Flickr CC, còn tải Pexels (giấy phép Pexels) qua trình duyệt và chỉ lấy ảnh có ghi địa điểm đúng nơi; bỏ ảnh có chữ ký/watermark (ví dụ "TMT", "© Tran Kien Trung").

Hiệu ứng mới ở Cao Bằng (06/11/2026): bụi nắng vàng bay lên phủ cả video, cột mốc km đỏ trắng trồi lên từ mặt đất thay cuống vé ("CAO BẰNG / NGÀY 1 / SÁNG"), thẻ trắng ngà viền xanh ngọc, ảnh đổi bằng zoom xuyên (scale 1,14 → 1 kèm nhoè), bảng màu xanh ngọc thác Bản Giốc + vàng nắng, shader whip-pan, swirl-vortex, ridged-burn, domain-warp-dissolve, chromatic-radial-split (chưa dùng ở nơi nào trước). Chỉ làm bản tiếng Việt (người dùng yêu cầu 06/11/2026). Quán ưu tiên theo review TikTok nếu đạt ≥4.5★/≥50 lượt. Bản 4N3Đ dùng lại clip giọng của các cảnh có lời giống hệt bản 3N2Đ (chỉ thu thêm cảnh mới) để rút ngắn thời gian OmniVoice.

Hiệu ứng mới ở Sa Pa (07/11/2026): tuyết nhỏ rơi phủ cả video, cabin cáp treo đỏ trượt vào theo dây cáp rồi đung đưa (thay cột mốc km), thẻ trắng có dải thổ cẩm (đỏ, vàng, xanh, chàm) ở trên, ảnh đổi bằng đẩy lên từ đáy (transform yPercent, có lớp trong chạy ngược tạo chiều sâu; không dùng clip-path vì lint cảnh báo quá nhiều lớp nặng làm khung hình đen), cảnh "Hết bao nhiêu tiền?" dạng hoá đơn in từng dòng và con dấu "THAM KHẢO", shader gravitational-lens, cinematic-zoom, cross-warp-morph, flash-through-white, sdf-iris trước outro. Lưu ý lint: không tween letterSpacing (lỗi gsap_non_transform_motion).

Hiệu ứng mới ở Hà Giang (08/11/2026): vệt gió mảnh lướt ngang phủ cả video (thay tuyết), biển chỉ đường xanh QL4C mọc lên trên cột rồi lật xuống ("QL4C · HÀ GIANG / NGÀY 1 / SÁNG ➜", thay cabin cáp treo), thẻ màu kem có viền trái hồng tam giác mạch → vàng, ảnh đổi bằng whip pan (ảnh mới trượt vào từ phải có skew, ảnh cũ bị đẩy sang trái; chỉ dùng transform), cảnh chi phí dạng trang sổ tay kẻ dòng có lề đỏ, mỗi dòng được tick ✓ rồi tổng tiền được khoanh tròn bằng nét vẽ (SVG strokeDashoffset), shader thermal-distortion, light-leak, ripple-waves, domain-warp, chromatic-split trước outro. Video ẩm thực: bảng phấn chợ phiên (gạch chân phấn từng món, vòng phấn khoanh món đầu), outro năm món rơi xuống mẹt tre nảy nhẹ. Hà Giang nhiều quán nổi tiếng trên TikTok dưới 4.5★ (cháo ấu tẩu Hương, bánh cuốn Bà Hà…): ghi ở mục 🏷️ trong mô tả, món không có quán đạt chuẩn thì ghi "gợi ý" theo báo/TikTok.

Hiệu ứng mới ở Ninh Bình (09/11/2026): đèn hoa đăng (chấm sáng ấm) bay lên phủ cả video (thay vệt gió), huy hiệu nón lá xoay rơi xuống kèm dải băng xanh ngọc "NGÀY 1 / SÁNG" (thay biển QL4C), ảnh đổi kiểu lật trang album (ảnh mới xoay vào quanh mép trái, rotationY −92° → 0; ảnh cũ thu nhỏ lại), thẻ trắng viền xanh ngọc → vàng lúa, cảnh chi phí dạng vé đò dài có cuống đục lỗ và con dấu tròn đỏ "ĐÃ TÍNH" đóng lên cuống, shader whip-pan, ripple-waves, swirl-vortex, light-leak, ridged-burn (cháy phim) trước outro. Video ẩm thực: intro thuyền nan chở 5 món lướt qua mặt nước rồi danh sách món hiện ra; outro 5 món nổi lên như đèn hoa đăng trên sông đêm. Ninh Bình mới gồm cả Hà Nam và Nam Định cũ (từ 1/7/2025), nên video ẩm thực có bánh cuốn Phủ Lý. 3N2Đ dùng lại clip giọng của các cảnh giống hệt 2N1Đ (lời thuyết minh không nhắc ngày để dùng chung được).

Hiệu ứng mới ở Cát Bà (14/11/2026): footage flycam thật (Pexels, chỉnh màu lạnh, cắt dọc 9:16 bằng ffmpeg; `<video muted class="clip">` trong cảnh, lint báo lỗi `video_nested_in_timed_element` nếu `section` của cảnh có `data-start`, nên cảnh không đặt `clip`/`data-start`) xen với ảnh; ảnh đổi bằng **cần gạt nước** (một lưỡi gạt quay từ trái sang phải quanh tâm đáy khung, ảnh mới lộ ra theo mask conic-gradient với biến CSS `--a` tween 0 → 181deg; mỗi tween fromTo phải có `opacity:1` ở đích để lint không báo lỗi cold-seek); cảnh cung đường dùng **lia ngang** như nhìn qua cửa xe (ảnh cao bằng khung, tween xPercent −38 ↔ −62); huy hiệu **đồng hồ tốc độ** (kim vung lên, cung màu đầy dần, "NGÀY 1 / TRƯA / km 25") thay nón lá; sương lạnh trôi ngang phủ cả video; thanh lộ trình dưới phụ đề là con đường nhỏ có xe hơi chạy tới điểm hiện tại; cảnh chi phí dạng **biển chỉ đường cao tốc xanh** trên hai cột, các dòng nhấp nháy sáng lên, tổng tiền trong ô vàng; shader cinematic-zoom, cross-warp-morph, domain-warp, flash-through-white, sdf-iris trước outro. Ảnh đẹp cho cung đường lấy thêm từ Flickr CC BY/BY-SA (bỏ NC, ND), bản lớn tải qua trang `/sizes/k/`. Pexels video: lấy link `video-files/<id>/..._2560_1440_25fps.mp4` trong HTML trang video. Snapshot lúc OmniVoice đang chạy dễ chụp nhầm màn hình "Caching transition frames": thêm `--timeout 400000`.

Hiệu ứng mới ở Cao Bằng mùa đông (14/11/2026, làm lại 3N2Đ và ẩm thực theo mùa, có footage): lá vàng rơi phủ cả video (SVG, không dùng filter để đỡ lớp nặng), huy hiệu tờ lịch nhỏ lật xuống từ gáy (rotationX −100° → 0, "NGÀY 1 / SÁNG / ~50 km"), ảnh đổi bằng **giọt sương loang** (mask radial-gradient với biến `--r` tween 0 → 2300px, kèm vòng sáng lan ra; chỉ dùng cho lần đổi đầu ở cảnh lẻ vì lint đếm mask là lớp nặng, các lần khác ảnh nở dần), thanh lộ trình là đường chấm với ghim đỏ nhảy tới điểm hiện tại, cảnh chi phí dạng **nhiệt kế** (mỗi dòng làm cột thuỷ ngân dâng lên, ô tổng màu vàng dưới bảng), shader light-leak, gravitational-lens, ripple-waves, chromatic-split, domain-warp-dissolve trước outro. Footage: Pexels (Anh Tuan, Hồng Thiệu, GIANG VU) và **Pixabay** (địa điểm ghi ở dòng sau "View more" trên trang video, ví dụ "Trung Khanh, Cao Bang", "Angel Eye Mountain, Cao Bang"; file `cdn.pixabay.com/video/.../<id>-..._large.mp4`, tác giả là tên trong khung creatorDetails). Bỏ clip Bản Giốc nước đục mùa lũ vì không hợp mùa. Không chụp snapshot khi OmniVoice đang chạy: Chrome làm hết RAM khiến synth lỗi "could not execute a primitive". **Kiểm tra màu của footage trước khi dựng (15/11/2026):** `ffprobe -show_entries stream=color_transfer` từng clip; clip HDR (arib-std-b67/smpte2084, hay gặp ở clip quay iPhone trên Pexels) làm HyperFrames tự chuyển sang HDR ("HDR auto-promotion", "Layered composite frame" trong render.log) và video ra tối, mọi phụ đề hiện chồng cùng lúc. Chuyển clip về SDR trước: `zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p` kèm `-color_primaries bt709 -color_trc bt709 -colorspace bt709`. Validator `scripts/lib/video-data.mjs` của dự án cũ phải có layout "cost" (chép từ cat-ba), nếu không import giọng sẽ lỗi. Máy ít RAM thì chạy synth và render bằng `Start-Process -WindowStyle Minimized` (cửa sổ riêng) để Claude Code không tự tắt tác vụ nền.

Hiệu ứng mới ở thác 72 Đắk Glung (22–23/11/2026, `D:/Thang_space_archive/thac-72/hf/build-t72.mjs`): âm thanh đậm bản sắc vùng miền theo yêu cầu người dùng: nhạc nền tự tổng hợp `--style taynguyen` (chiêng mẹ mỗi ô nhịp, 3 chiêng đánh xen kẽ kiểu cồng chiêng, trống da, lục lạc tre, đàn t'rưng, sáo tre) và sfx tự tổng hợp `scripts/sfx-taynguyen.mjs` (gong-hit, gong-low, trung-pluck, trung-run, drum-hit). Intro: chiêng đồng "72" được gõ trên nền đen, 4 clip cắt theo tiếng trống, tựa khắc trên mặt chiêng; huy hiệu chiêng treo dây đung đưa được gõ; đổi ảnh "màn nước đổ" (mask từ trên xuống) ↔ "rung chiêng"; bụi nước bay ngược + vệt nắng; chuyển chặng bằng 4 cột ảnh khung gỗ viền thổ cẩm; chi phí là các ống tre t'rưng ngân khi hiện; outro lửa trại. Ba đoạn ngắm cảnh giữ âm thanh gốc TikTok (chọn clip có tiếng tự nhiên bằng cách đo độ "tonal" của phổ, ~5–20 là tiếng thác/rừng/lời nói, ≥25 là có nhạc; clip lồng nhạc trend chỉ dùng hình), nhạc nền hạ xuống 0.05 trong lúc đó. Snapshot HyperFrames bị timeout khi có ~40 clip: kiểm tra bằng khung trích từ final.mp4; ảnh bìa: bản --cover cắt `data-duration` còn 7,6 s rồi `render --fps 2` và lấy khung 7,0 s.
Hiệu ứng mới ở Tà Xùa săn thác mây (23/11/2026, `D:/Thang_space_archive/ta-xua/hf/build-tx.mjs`): nhạc nền tự tổng hợp `--style hmong` (khèn thở theo nhịp, đàn môi, sáo mèo có láy, trống, chuông ngựa, tiếng gió) và sfx `scripts/sfx-hmong.mjs` (khen-swell, jaw-twang, horse-bell, wind-gust, alarm-ring, flute-call). Intro: trời đêm chàm + thẻ thời tiết "MẸO SĂN MÂY 21:00 · độ ẩm > 85% · gió < 5 km/h", chuông báo 05:00, khối mây bùng phủ màn hình rồi mở ra 4 clip; tựa lộ dần khi đám mây trôi qua (mask). Đổi ảnh: mây quét ngang ↔ "ống khèn" (mask sọc dọc lớn dần). Huy hiệu: thẻ app thời tiết + thanh độ ẩm. Giữa chặng: đường độ cao SVG tự vẽ, 4 ảnh bật lên trên đỉnh. Thẻ vải chàm viền chỉ khâu; chi phí là ba lô với miếng vá, tổng trên thẻ hành lý; outro biển mây dâng. Bài học: (1) `face-stickers.py --proof` chỉ là chạy thử, KHÔNG dán sticker; chạy lại không có `--proof` rồi xem khung trong final.mp4. (2) Không chạy hai lượt `dl-tiktok.sh` cùng lúc (TaskStop có thể không giết yt-dlp con): file bị ghi chồng sẽ hỏng (lỗi NAL, khung viền đen lẫn vào); kiểm tra nguồn bằng `ffmpeg -v error -i f -f null -`. (3) Video TikTok của người chụp ảnh hay chèn khung ảnh kết quả có viền đen: xem dải 1 khung/giây trước khi chọn đoạn. (4) Clip có nhãn ngày của creator đè lên tiêu đề: cắt `zoom` (phóng 1,2 lần, neo đáy) trong `cut.sh`. (5) Quán viral trên TikTok có thể dưới chuẩn Maps (Vị Nhà 3,8★, Bếp Củi 3,4★): đưa vào phần "Nói thật" kèm ảnh Maps.
Hiệu ứng mới ở Đồi Bò Sa Pa (24/11/2026, `D:/Thang_space_archive/doi-bo/hf/build-db.mjs`): nhạc nền tự tổng hợp `--style pastoral` và sfx `scripts/sfx-pastoral.mjs` (chuông bò, gió đồi, bước cỏ). Intro: bản đồ địa hình (đường đồng mức) với bộ đếm độ cao chạy lên ~2.400 m rồi gập lại mở ra clip. Đổi chặng: bản đồ gấp đôi theo nếp giữa ↔ ảnh lộ theo đường đồng mức. Huy hiệu vòng tròn "CHẶNG 1/3" kèm ghi chú quãng đường; cỏ lay ở đáy phủ cả video; recap giữa chặng là 4 ảnh kẹp trên hàng rào gỗ; chi phí là cột biển chỉ đường gỗ, mỗi khoản là một tấm mũi tên đóng xen trái/phải, tổng trên bảng xanh; outro chồng đá (cairn) xếp từng viên. Shader cross-warp-morph, whip-pan, chromatic-radial-split, light-leak, ridged-burn. Bài học: (1) tiêu đề 2 dòng ("Hết bao nhiêu?") bị biển gỗ đè: đặt khối thẻ từ y ≥ 560. (2) Clip creator có chữ chạy suốt video (hp1, lt1): thêm chế độ `low` trong `cut.sh` (phóng 1,65 lần, neo đáy, bỏ ~39% phía trên) thay vì `zoom` 1,2 lần. (3) Lệnh chờ nền dạng `until …; sleep` vẫn có thể bị hệ thống tắt khi thiếu RAM: báo người dùng, không tự chạy lại. (4) `import-voice` cần `--dir omni-clips` và tự rút ngắn cảnh; chạy lại `gen-db.mjs` ngay sau để cộng lại đoạn chèn âm thanh gốc và recap.

Ý tưởng cho lần sau (chưa làm):
- Con trỏ chuột "bấm" vào ghim trên bản đồ để mở cảnh điểm đó (dùng lại `Cursor` của video ẩm thực).
- Cắt "whip pan" (lia nhanh có nhoè) giữa hai cảnh cùng một ngày.
- Mở đầu bằng "scale reveal": bắt đầu cận cảnh, kéo ra toàn cảnh.
- Thêm footage video có giấy phép (Pexels, Pixabay) xen giữa các ảnh tĩnh.
- Parallax: tách lớp tiền cảnh và hậu cảnh của ảnh. Cần ảnh đã tách nền.

## 5c. Dựng bằng HyperFrames thay cho Remotion (từ Sài Gòn, 31/10/2026)

HyperFrames (`github.com/heygen-com/hyperframes`, CLI `npx hyperframes@0.8.223`) dựng video từ HTML + GSAP, rồi Chrome headless và FFmpeg ghi thành MP4. Dự án mẫu: `sai-gon` (`hf/build.mjs`). Repo gốc clone ở `C:\Users\thang\Thang_space\hyperframes`.

- **Bộ công cụ:** giữ `scripts/` cũ để làm giọng (`video:voice`, `video:import-voice`, `video:fetch-image`). `scripts/lib/media.mjs` gọi `ffmpeg`/`ffprobe` trong `C:\Users\thang\bin` (chép từ VoiceStudio và Remotion compositor). Dữ liệu vẫn là `video.json` + `voiceover.json`, sinh bằng `data/gen-videos.mjs`.
- **Dựng:** `node hf/build.mjs --slug <slug>` → `build/<slug>/index.html` + `assets/`; rồi `npx hyperframes lint` (phải 0 lỗi) và `npx hyperframes snapshot --at 6,20,45` để xem `contact-sheet.jpg`.
- **Xuất:** chạy tách riêng (`Start-Process`) file `render-sg.cmd <slug>` (`npx hyperframes render --quality delivery --output output/<slug>/final.mp4`). Máy 8 GB mất khoảng 12–20 phút cho 2 phút video, chậm gấp đôi nếu OmniVoice đang chạy cùng.
- **Ảnh bìa:** `node hf/build.mjs --slug <slug> --cover` dựng bản không phụ đề vào `build/<slug>-cover`, rồi snapshot ở giây 5,5 (du lịch) hoặc giây 2 (ẩm thực), lưu thành `output/<slug>/cover.jpg`.
- **Luật của HyperFrames:** phần tử có thời gian cần `class="clip"` + `data-start` + `data-duration`; một timeline GSAP dừng sẵn ở `window.__timelines["main"]`; không tween `letterSpacing` (dùng `scale`); mỗi `<audio>` cần `id` và `data-duration`, nếu thiếu thì các clip giọng chồng lên nhau.
- **Hiệu ứng đã dùng ở Sài Gòn:**
  - mở đầu bằng cảnh vệ tinh từ địa cầu lao xuống Quận 1 (`bake-basemap.mjs`, ảnh Esri);
  - chuyển cảnh shader `@hyperframes/shader-transitions` (light-leak, whip-pan, cinematic-zoom, flash-through-white, cross-warp-morph, sdf-iris trước outro);
  - tiêu đề serif hiện từng từ có làm mờ, số ngày to dạng nét viền phía sau;
  - thẻ "ĂN GẦN ĐÂY" hiện đúng lúc giọng nhắc món;
  - phụ đề karaoke đổi màu từng từ, thanh chấm lộ trình.
- **Độ trễ trước thẻ quán ăn (người dùng yêu cầu 31/10/2026):** mỗi điểm đến phải để ảnh địa điểm hiện **rõ, không bị che ít nhất khoảng 3 giây** (cả ảnh đầu cảnh, và tốt nhất là cả ảnh vừa đổi), rồi mới hiện thẻ quán ăn. Thẻ quán và phụ đề đặt ở **phần dưới** màn hình, khoảng y ≥ 1300, không đặt ở giữa ảnh. Mốc thời gian theo lời nhắc món chỉ dùng khi đã qua độ trễ này; nếu chưa qua thì lùi thẻ lại.
- **Dãy chấm sáng tiến độ địa điểm (người dùng yêu cầu 01/11/2026, Huế):** dãy chấm báo đang ở điểm thứ mấy (`.rail`) đặt **dưới phụ đề** (Huế: phụ đề top 1500, chấm top 1690), không đặt giữa màn hình.
- **Lần sau nên đổi:** bảng màu, kiểu shader, bố cục tiêu đề. Có thể thử khối dựng sẵn trong `hyperframes-registry` (khoảng 450 khối).

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

> **Quy tắc xuyên suốt khi làm một địa điểm mới (người dùng yêu cầu 30/10/2026):**
> - Mỗi địa điểm mới làm **cả video du lịch** (3N2Đ và 4N3Đ, VI và EN, theo skill này) **lẫn video khám phá ẩm thực** (VI và EN, theo skill `san-xuat-video-am-thuc`). Tổng cộng 6 video.
> - Làm xong hết rồi mới đăng, **đúng thứ tự**:
>   1. Du lịch 3N2Đ: bản VI, rồi bản EN.
>   2. Ẩm thực: bản VI, rồi bản EN.
>   3. Du lịch 4N3Đ: bản VI, rồi bản EN.

1. **Caption** `output/<slug>/tiktok-caption.txt`, **dưới 4.000 ký tự**, gồm:
   - một câu hook ngắn có emoji;
   - lịch trình theo ngày (📍);
   - một dòng về quán ăn (🍜);
   - câu hỏi kéo bình luận;
   - 8–10 hashtag (tên nơi, tỉnh, `#dulich<noi>`, `#lichtrinhdulich`, `#dulichvietnam`, `#reviewdulich`, `#fyp`; bản tiếng Anh thì `#vietnamtravel`, `#traveltok`…);
   - phần ghi nguồn: các ảnh CC BY và CC BY-SA (tác giả · giấy phép · tên file), dòng bản quyền bản đồ OpenStreetMap.
   - **Không ghi dòng "Giọng đọc AI · Nhạc nền tự sản xuất · Dựng bằng HyperFrames"** (hay bất kỳ ghi chú giọng AI, nhạc, công cụ dựng nào) trong caption (người dùng yêu cầu 14/11/2026). Khi chép `gen-captions.mjs` từ dự án cũ thì xoá dòng đó.
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
- **Hỏi trước** khi làm việc khó hoàn tác hoặc hướng ra bên ngoài (tiêu điểm Vbee nhiều…). **Đăng TikTok: làm xong và kiểm tra hết video thì dừng lại, chỉ upload khi người dùng bảo upload** (người dùng đổi quy tắc ngày 31/10/2026).
- **Làm trọn gói** (người dùng dặn ngày 29/10/2026): khi được giao làm video cho một nơi, tự làm từ nghiên cứu tới đăng TikTok, cả bản tiếng Việt và tiếng Anh, không chờ duyệt. Chỉ dừng lại hỏi khi có sự cố nghiêm trọng (mất đăng nhập, cần thanh toán, dữ liệu có thể mất).
- Commit chỉ khi người dùng nói "Commit giúp tôi".

> **Lưu trữ (30/10/2026):** dự án đã đăng xong được chuyển sang `D:\Thang_space_archive\` để giải phóng ổ C. Trong đó có danang-3n2d, danang-am-thuc, phu-yen-3n2d, nha-trang, nhatrang-am-thuc. Dự án đang làm vẫn ở `C:\Users\thang\Thang_space\`. Khi muốn chép bộ công cụ, lấy dự án gần nhất ở một trong hai nơi.
