---
name: san-xuat-video-am-thuc
description: Quy trình sản xuất video dọc 9:16 (TikTok/Reels) giới thiệu ẩm thực vùng miền bằng Remotion, ít nhất 5 món mỗi vùng. Mỗi món được nghiên cứu kỹ nguồn gốc, cách làm, cách ăn và quán nổi tiếng (Google Maps ≥4.5★), cùng TikTok và báo chí; video là ảnh món ăn, phụ đề và hiệu ứng dễ thương (khung polaroid, emoji nhảy, khói, lấp lánh). Có bản tiếng Việt và tiếng Anh, đăng TikTok khi người dùng bảo. Dùng khi người dùng muốn làm video "<vùng> ăn gì", "đặc sản <vùng>", "ẩm thực <vùng>".
---

# Sản xuất video ẩm thực vùng miền

Video mẫu: **Ẩm thực Đà Nẵng** (`C:\Users\thang\Thang_space\danang-am-thuc`) và **Ẩm thực Nha Trang** (`C:\Users\thang\Thang_space\nhatrang-am-thuc`). Bản Nha Trang có thêm nhiều kiểu nền. Trả lời người dùng bằng **tiếng Việt**.

Skill này dùng cùng bộ công cụ Remotion với video du lịch (skill `san-xuat-video-du-lich`). Các phần dùng chung làm y như bên đó: giọng đọc, xuất video, kiểm tra khung hình, đăng TikTok. File này chỉ ghi những điểm **khác**.

> **Khác video du lịch:**
> - Nhân vật chính là **món ăn**, không phải điểm đến.
> - Không có bản đồ, không có cảnh máy bay.
> - Mỗi món là một câu chuyện ngắn gồm 4 nhịp: **Nguồn gốc → Cách làm → Cách ăn → Quán ngon**.
> - Dựng theo phong cách ấm áp, dễ thương. Không làm kiểu điện ảnh.

| Giai đoạn | Thời gian | Kết quả |
|---|---|---|
| 1. Chọn món (≥5) | ~10% | danh sách món, lý do chọn |
| 2. Nghiên cứu từng món | ~35% | `research/dishes.md` |
| 3. TikTok, bình luận | ~10% | `research/tiktok.md` |
| 4. Quán ngon trên Google Maps | ~15% | bảng quán trong `dishes.md` |
| 5. Ảnh món ăn | ~10% | `public/videos/<slug>/images`, `credits.json` |
| 6. Kịch bản và dữ liệu | ~10% | `data/gen-videos.mjs` → `video.json` VI và EN |
| 7. Giọng, xuất, kiểm tra, đăng | ~10% | `output/<slug>/final.mp4`, bài TikTok |

---

## 0. Tạo dự án
- Chép bộ công cụ từ `nhatrang-am-thuc` (có sẵn layout `dish`, `src/DishScene.tsx`) sang thư mục `C:\Users\thang\Thang_space\<vung>-am-thuc`. Không chép dữ liệu, ảnh, `output/`, `node_modules/`.
- Đổi `name` trong `package.json`. Trỏ `src/Root.tsx` sang slug mới. Chạy `git init` và `npm ci`.
- Slug: `<vung>-am-thuc` (tiếng Việt) và `<vung>-am-thuc-en` (tiếng Anh).

## 1. Chọn món
- **Tối thiểu 5 món mỗi vùng** (người dùng yêu cầu). 6 món là vừa đẹp, khoảng 2–3 phút.
- Chọn món **gắn với vùng đó**: báo chí và blog đều nhắc, dân địa phương ăn thật. Đừng chọn món có ở khắp nơi.
- Đa dạng: món nước, món cuốn, món chiên, món gỏi, món sáng, món tối.
- Kiểm tra trước là món đó **có ảnh tự do không** (xem mục 5). **Món nào lên video cũng phải có ảnh thật** (người dùng yêu cầu 30/10/2026). Món không tìm được ảnh tự do thì đổi sang món khác cùng vùng.

## 2. Nghiên cứu từng món (phần quan trọng nhất)
Mỗi món cần **đủ 4 phần**, mỗi phần có nguồn ghi trong `research/dishes.md`:

| Phần | Cần tìm | Nguồn tốt |
|---|---|---|
| **Nguồn gốc** | làng nghề, vùng, giai thoại, năm; ai nói | Báo Văn Hóa, Nhân Dân, Tuổi Trẻ, VnExpress, Báo Pháp Luật, cổng du lịch tỉnh |
| **Cách làm** | nguyên liệu chính, công đoạn đặc trưng (bột, nước dùng, nước chấm) | bài báo về làng nghề, VnExpress, công thức của các trang ẩm thực |
| **Cách ăn** | ăn kèm gì, chấm gì, trộn hay cuốn, ăn giờ nào | báo, blog du lịch, TikTok của dân địa phương |
| **Quán ngon** | quán nổi tiếng và quán đạt chuẩn | Google Maps, Michelin Guide (Bib Gourmand, Selected), TikTok |

Quy tắc:
- **Nguồn gốc thường không rõ hoặc tranh cãi.** Đừng bịa một câu chuyện cho hay. Nói thẳng trong video: "nhiều giả thuyết…", "chưa rõ ai nghĩ ra…". Ghi các giả thuyết kèm người nói vào `dishes.md`.
- Khi các nguồn **mâu thuẫn**, ghi cả hai, rồi chọn cách nói đúng với cả hai. Ví dụ nước chấm bánh xèo: một nguồn ghi gan heo, nguồn khác ghi gan heo và gan gà, nên video chỉ nói "gan".
- Dùng `WebSearch` song song nhiều câu: "<món> nguồn gốc", "<món> cách làm", "<món> cách ăn", "<món> <vùng> quán ngon", "<món> làng nghề". Bài nào quan trọng thì `WebFetch` để đọc kỹ.
- Danh hiệu Michelin (Bib Gourmand, Selected) chỉ ghi khi có bài báo nêu tên quán và năm.

## 3. TikTok
Làm như mục 1b của skill du lịch: tìm video, chụp màn hình, **lấy lời thoại (script) của cả video** (mục 2b, người dùng yêu cầu 07/11/2026), đọc bình luận. Lời thoại thường nói rõ giá món, giờ mở cửa, món nào của quán ngon nhất. Từ khoá: "<món> <vùng>", "<vùng> ăn gì", "đặc sản <vùng>".
- **Ít nhất 20 video TikTok cho mỗi địa điểm (người dùng yêu cầu 15/11/2026).** Mỗi video phải đọc hết lời thoại và đọc bình luận, không chỉ xem tiêu đề. Chia đều cho các món, mỗi món ít nhất 3 video. Ưu tiên video đăng trong 12 tháng gần đây, nhiều lượt xem, của nhiều creator khác nhau, cả dân địa phương lẫn khách du lịch. Chưa đủ 20 video thì chưa chuyển sang viết kịch bản. Cách đếm và ghi chép như mục 1b của skill du lịch.
- Kết quả tìm kiếm nằm trong `[data-e2e="search_video-item"]`. Đừng lấy mọi `a[href*="/video/"]`, vì ô thông báo (inbox) cũng có link video.
- Cẩn thận với **seeding**: nhiều bình luận cùng giới thiệu một địa chỉ bằng lời lẽ giống nhau. Không đưa những quán đó vào.
- Món có giá thì ghi thêm giá tham khảo một phần ăn (có nguồn: báo, menu trên Google Maps, hoặc giá creator nói trong video, ghi "theo review TikTok") vào `research/food.md`; có thể hiện trên thẻ quán và trong mô tả bài đăng. Không có nguồn thì không ghi giá.
- Bình luận rất có ích để biết **quán theo gu khách du lịch hay gu dân địa phương**, và quán nào đang xuống chất.

## 4. Quán ngon
- Kiểm tra từng quán trên Google Maps bằng Playwright, cách làm như skill du lịch mục 3.
- Quét theo món: `/maps/search/<món>/@<lat>,<lng>,14z`, lọc ≥4.5★ và ≥80 lượt.
- **Trên màn hình chỉ hiện quán ≥4.5★**, 2–3 quán mỗi món.
- **Ảnh chụp Google Maps làm bằng chứng (người dùng yêu cầu 04/11/2026):** mỗi quán lên màn hình phải kèm ảnh chụp phần đầu trang Google Maps của quán, gồm tên quán và dòng số sao + số lượt đánh giá, để người xem tin hơn. Chụp bằng Playwright ở `deviceScaleFactor: 2`, `locale: "vi-VN"`: mở `/maps/search/<tên quán>/@lat,lng,14z?hl=vi`, bấm kết quả đầu, rồi chụp vùng từ `h1` tới `div.F7nice` (đệm khoảng 12 px, cắt bỏ dòng loại hình quán bên dưới). Lưu vào `public/videos/<slug>/maps/<quán>.png`, kiểm tra tên và số sao khớp với dữ liệu, rồi đóng trình duyệt. Trong video, khi thẻ quán hiện lên thì một khung "📍 Google Maps · chụp <ngày>" (rộng ~620 px, đáy ở y ≈ 1090, ngay trên thẻ quán) trượt vào lần lượt từng ảnh chụp, đồng thời dòng quán tương ứng trên thẻ sáng lên. Khi đủ thông tin (ảnh chụp cuối đã vào, thêm khoảng 1,6 giây để đọc), **thẻ quán và khung Maps cùng mờ đi để lộ lại ảnh cho người xem** (người dùng yêu cầu 08/11/2026), không giữ tới hết cảnh. Nếu quán được nhắc quá sát cuối cảnh, cho thẻ hiện sớm hơn một chút để vẫn còn ít nhất ~1 giây ảnh sạch trước khi chuyển cảnh. Mẫu: `D:\Thang_space_archive\ha-giang/hf/build-hg.mjs` (hàm `clearAt`, `hideOut`). Không sửa hay che số sao trong ảnh. Mẫu: `D:\Thang_space_archive\moc-chau\hf/build-mc.mjs` (hàm `proofs`) và script chụp `hf/maps-mc-shot.js` cùng thư mục.
- **Quán nổi tiếng nhưng dưới 4.5★** (rất hay gặp, ví dụ bánh xèo Bà Dưỡng 4.3★ với hơn 10.000 lượt): không đưa lên màn hình. Ghi vào phần mô tả bài đăng như "quán lâu đời", kèm số sao thật. Không giấu số sao.
- Mở trang chi tiết từng quán hiện trên màn hình để xem có dòng "đóng cửa" không, và đối chiếu tên.

## 5. Ảnh món ăn
- **Ưu tiên clip hơn ảnh (người dùng yêu cầu 16/11/2026):** chèn càng nhiều clip quay đúng món (làm món, ăn món) càng tốt; ảnh chỉ để lấp chỗ không có clip.
- **Mở đầu bằng footage + nhạc, chưa có giọng (16/11/2026):** vài giây đầu là clip đẹp nhất của món hoặc vùng trên đoạn nhạc kiểu trend TikTok, không lời thoại, rồi mới vào giọng. Không ghép bài hát có bản quyền vào file render; dùng nhạc tự tổng hợp hoặc miễn phí bản quyền.
- Wikimedia Commons: tìm cả `generator=search` lẫn danh mục (`Category:<món>`, `Category:Cuisine of <vùng>`). Ưu tiên ảnh **chụp tại vùng đó** (xem phần mô tả của file).
- Món phải là **đúng món**. Đúng kiểu vùng càng tốt: bánh xèo miền Trung nhỏ và giòn, khác bánh miền Nam.
- **Món nào cũng phải có ít nhất 3 ảnh thật của đúng món đó** (người dùng yêu cầu 30/10/2026, nâng lên tối thiểu 3 ảnh ngày 31/10/2026). Ảnh người dân đang làm món được tính. Cảnh hook và outro cũng nên có ảnh đẹp của vùng. Không được có món chỉ có icon mà không có ảnh minh hoạ.
  - Tìm kỹ trước khi bỏ cuộc:
    - Commons: dùng cả `generator=search` và danh mục, thử tên có dấu, không dấu và tên tiếng Anh.
    - Openverse và Flickr, chỉ lấy ảnh CC BY, CC BY-SA hoặc CC0.
  - Ảnh chụp đúng món nhưng ở vùng khác thì dùng được, nhưng phải ghi rõ trong caption, ví dụ "ảnh minh hoạ món chụp ở X".
  - **Không bao giờ** lấy ảnh món khác thay vào.
  - Vẫn không có ảnh thì đổi sang món khác.
  - `story.illustration` (emoji) chỉ là phương án dự phòng cũ, không còn dùng làm hình chính của món.
- **Xen ảnh người địa phương đang làm món** (nướng, tráng bánh, ủ mắm, bán ở chợ…): ảnh làm món tăng sự thích thú cho người xem. Mỗi video nên có vài món như vậy. Thứ tự gợi ý trong `gallery`: ảnh món, ảnh làm món, ảnh món cận cảnh.
- **Mỗi món 3–4 ảnh** nếu tìm được, để khung ảnh chuyển đủ nhanh.
- **Bắt buộc đan xen video clip với ảnh (người dùng yêu cầu 14/11/2026, sau Cát Bà):** mỗi video ẩm thực chèn thêm footage chuyển động xen giữa ảnh món. Tìm hai loại clip cho món: **người làm món** (tráng bánh, nướng, đổ khuôn, chan nước dùng, quầy bán ở chợ) và **khách đang ăn món đó** (gắp, húp, chấm, bàn ăn đông vui). Hook và outro có thể dùng clip cảnh đẹp của vùng hoặc khu chợ, phố ăn uống.
  - Nguồn và cách xử lý như skill du lịch mục 2 (Pexels, Pixabay, Commons; crop dọc 1080×1920, chỉnh màu ấm hơn cho món ăn, 4–8 giây, không tiếng; ghi credit). Clip phải đúng món; clip món đó quay ở vùng khác thì được nhưng ghi "minh hoạ" trong caption. Tránh clip lộ rõ mặt người ăn nếu có thể, hoặc chọn đoạn quay tay, bát đũa.
  - Thứ tự gợi ý trong `gallery`: ảnh món → clip làm món → ảnh cận cảnh → clip khách ăn. Món không có clip thì vẫn dùng ảnh như cũ; không lấy clip món khác thay vào.
- **Che mặt người trong clip TikTok (người dùng yêu cầu 20/11/2026, Đà Lạt):** đoạn clip lấy từ TikTok mà **chủ video** (người quay vlog, bạn đi cùng, người mẫu tạo dáng) lộ rõ mặt ở gần thì phải che mặt họ bằng sticker (emoji hoặc hình tròn có biểu tượng) bám theo khuôn mặt suốt đoạn đó, để không vi phạm quyền riêng tư. **Không che** mặt cô chú bán hàng, nhân viên quán, người dân hay khách khác ở địa điểm. Ưu tiên chọn đoạn quay cảnh, tay, món ăn; đoạn nào buộc phải dùng thì dò mặt từng khung (OpenCV, script `hf/face-stickers.py` của dự án `D:/Thang_space_archive/da-lat`) (chế độ `--proof` để xem ai bị dò), chỉ chọn các clip có mặt chủ video rồi dán sticker trước khi đưa vào dựng. Người ở xa, chỉ thấy dáng hoặc lưng thì không cần che. Kiểm tra lại khung hình trong final.mp4.
- Tải ảnh bằng `npm run video:fetch-image` như skill du lịch. Ảnh outro có thể lấy lại cảnh đẹp của vùng từ dự án du lịch cũ, nhớ chép cả dòng credit.

## 6. Kịch bản
Khung chung (theo hướng dẫn kịch bản video ngắn: hook 0–3 giây, cứ 4–5 giây có một nhịp mới):
- **Hook** (khoảng 8 giây): con số và lời hứa, ví dụ "Đến Đà Nẵng ăn gì? Đây là sáu món phải thử, kèm nguồn gốc, cách làm, cách ăn, và quán ngon…".
- **Mỗi món** (khoảng 20–25 giây), lời đọc đi theo đúng 4 nhịp. Mỗi nhịp có một **cụm từ mốc (`cue`)** xuất hiện nguyên văn trong lời đọc, để thẻ đổi đúng lúc:
  1. "Món thứ N, <tên>." rồi nguồn gốc. Cue ví dụ: "giả thuyết", "chưa rõ", "gần biển", "làng chài".
  2. Cách làm. Cue: "sợi mì", "giã nhuyễn", "bột gạo"…
  3. "Khi ăn, …". Cue: "khi ăn" (bản tiếng Anh: "to eat").
  4. "Quán ngon: A, B và C." Cue: "quán ngon" (bản tiếng Anh: "try"; cue tiếng Anh phải chỉ xuất hiện một lần trong lời đọc).
- **Outro**: hỏi người xem thích món nào, rồi nhắc "Lưu lại nhé!".
- Thẻ trên màn hình là **bản tóm tắt ngắn**, khoảng ≤ 90 ký tự, tối đa 3 dòng. Lời đọc mới là phần kể dài.
- Tên quán trong lời đọc phải khớp chữ trên thẻ. Số đọc thành chữ ("bánh xèo bảy mươi sáu").
- Viết dữ liệu bằng **một file sinh `data/gen-videos.mjs`** chứa danh sách món với cả `vi` và `en`, để hai bản luôn cùng quán, cùng số sao. **Đừng chạy lại** file này sau khi đã tạo giọng: nó ghi đè `durationSec` mà bước tạo giọng đã chỉnh.

### Cấu trúc `video.json` của một món
```json
{
  "id": "mi-quang", "layout": "dish", "caption": "Mì Quảng",
  "gallery": ["videos/<slug>/images/01-mi.jpg"],
  "accent": "#ffc24d",
  "stickers": ["🍜", "🦐", "🥚", "🥜", "🌶️"],
  "narration": "Món thứ nhất, mì Quảng. … Khi ăn, … Quán ngon: …",
  "story": {
    "number": 1, "total": 6, "tagline": "Linh hồn ẩm thực xứ Quảng",
    "illustration": ["🐟", "🌿"],
    "background": "waves", "backgroundTo": "#b2f0e8",
    "sections": [
      { "part": "origin", "title": "Nguồn gốc", "cue": "giả thuyết", "text": "…" },
      { "part": "made", "title": "Cách làm", "cue": "sợi mì", "text": "…" },
      { "part": "eat", "title": "Cách ăn", "cue": "khi ăn", "text": "…" },
      { "part": "where", "title": "Quán ngon", "cue": "quán ngon",
        "places": [{ "name": "Mì Quảng", "place": "Mì Quảng Sứa Hồng Nga", "address": "67 Yên Bái", "rating": 4.9 }] }
    ]
  }
}
```
- Không dùng `illustration` thay ảnh (xem mục 5). Mỗi món có `gallery` 2–4 ảnh.
- `video:validate` báo lỗi khi thiếu phần nào, khi cue không có trong lời đọc, hoặc khi quán dưới 4.5★.

## 7. Phong cách dựng (`src/DishScene.tsx`)
Đã có sẵn, cứ dùng:

| Hiệu ứng | Mô tả |
|---|---|
| **Nền ấm, mỗi món một kiểu** | gradient từ `accent` sang `story.backgroundTo` (mặc định cam đào), phủ một hoa văn trôi chậm theo `story.background`: `dots` (chấm bi), `gingham` (khăn bàn caro), `waves` (sóng biển), `stripes` (sọc kẹo), `stars` (sao lấp lánh), `hearts` (tim). **Đừng để cả video chỉ một kiểu nền**: mỗi món chọn hoa văn và màu riêng, hợp với món (sóng cho món biển, caro cho món nướng, tim cho món ngọt hay món dễ thương) |
| **Khung polaroid** | viền trắng, bo góc, nghiêng nhẹ và đung đưa, hai miếng băng dính ở mép trên, ảnh bên trong có Ken Burns |
| **Con dấu "MÓN 1/6"** | hình tròn viền nét đứt, bật vào (spring) |
| **Khói bốc lên** | ba sợi trắng mờ bay lên phía trên ảnh, lặp mãi |
| **Sticker emoji** | `stickers`, tối đa 6, bật vào lần lượt, rồi nhún nhảy và lắc nhẹ quanh ảnh; dùng được cả ở hook và outro |
| **Tên món kiểu sticker** | chữ trắng viền đậm, đổ bóng màu accent, nảy vào; tên dài tự thu nhỏ để nằm trên một dòng |
| **Thẻ thông tin** | thẻ kem bo tròn, nhãn 📜 Nguồn gốc, 👩‍🍳 Cách làm, 🥢 Cách ăn, 📍 Quán ngon; nảy vào khi tới cue, có chấm tiến độ và chùm ✨ lấp lánh |
| **Danh sách quán** | từng dòng trượt vào, kèm nhãn ★ |
| **Con trỏ chuột bấm qua thẻ** (từ Nha Trang) | mũi tên trắng viền đậm lướt theo đường cong tới chấm tiến độ của thẻ đúng lúc thẻ hiện, nhấn xuống, toả vòng sóng; giữa các lần bấm thì nghỉ ở mép phải để không che chữ. Cuối cảnh, nút "MÓN TIẾP ➜" / "NEXT ➜" bật ra ở góc trên bên phải, con trỏ bấm vào khoảng 20 khung trước khi chuyển cảnh, nên chuyển cảnh trông như bị bấm sang (`Cursor`, `NextButton`, `cursorPath`) |
| **Lật thẻ món** (từ Phú Quốc) | khung polaroid hiện ra úp mặt sau: giấy kraft kẻ sọc, "MÓN 1 ❓". Từ khung 6 tới khung 24 thẻ lật quanh trục dọc (rotateY) để lộ ảnh hoặc hình minh hoạ, rồi con dấu "MÓN n/6" mới bật ra. Video này tắt con trỏ chuột (`SHOW_CURSOR = false` trong `src/DishScene.tsx`; xem `CardBack`, `FLIP_START`, `FLIP_END`). Hợp với video có nhiều hình minh hoạ, vì thẻ lật tạo cảm giác "bốc thăm món". |
| **Ảnh lấy liền hiện dần** (từ Quy Nhơn) | Thay lật thẻ. Thẻ polaroid vào khung như một tấm ảnh chụp lấy liền chưa hiện hình: tối, nâu sepia và nhoè. Từ khung 4 tới khung 36, ảnh rõ dần sang màu thật trong lúc thẻ bị "lắc" qua lại như người ta lắc ảnh. Con dấu "MÓN n/5" bật ra khi ảnh hiện xong. Mỗi lần đổi ảnh trong khung có một chớp đèn trắng ngắn (`src/DishScene.tsx`: `REVEAL = "develop"`, `DEVELOP_START`, `DEVELOP_END`; đặt `REVEAL = "flip"` để quay về lật thẻ). |
| **Bản điện ảnh, kiểu phim tài liệu** (từ Huế, HyperFrames `hf/build-cine.mjs`, bản thử 01/11/2026 chờ người dùng duyệt) | Mở đầu cắt dồn ảnh các món, mỗi nhát cắt có chớp trắng; tựa "HUẾ ĂN GÌ?" đập vào với hiệu ứng tách màu đỏ/xanh và tiếng bass. Mỗi món là một "chương": hiện dạng khung màn ảnh rộng 2.39:1, phía trên ghi "CHƯƠNG 01 / 05", phía dưới là tên món, rồi hai thanh đen trượt mở ra toàn khung. Ảnh trong một món đổi bằng lia nhanh có nhoè (whip pan) kèm tiếng whoosh; ảnh được chỉnh màu ấm, có khói bốc trên món nóng. Phủ nhiễu hạt phim và viền letterbox mảnh suốt video. Thông tin hiện dạng chú thích phim tài liệu: vạch vàng kéo ra, chữ nghiêng hiện dần từ trái sang. Quán hiện như ghim bản đồ, số ★ quay như đồng hồ đo. Dưới phụ đề có dải phim 5 ô ảnh món, ô đang nói được sáng lên. Kết bằng thực đơn 5 món được tick mực đỏ lần lượt, rồi thanh đen khép lại như cảnh cuối phim. Chuyển cảnh dùng shader cinematic-zoom, whip-pan, thermal-distortion (gợn hơi nóng), chromatic-split, flash-through-white, sdf-iris. Âm thanh hiệu ứng lấy từ bộ có sẵn của HyperFrames (Pixabay, `public/shared/sfx`). **Tiếng chuyển cảnh phải nhỏ** (người dùng yêu cầu 02/11/2026): whoosh khoảng 0.14–0.2, bass mở chương khoảng 0.18, để không lấn giọng đọc. |

### Khung ảnh và nhịp ảnh (người dùng yêu cầu 30/10/2026)
- Khung ảnh nên **rộng hơn** khung polaroid cũ, gần tràn ngang màn hình nhưng vẫn chừa lề an toàn.
- **Chuyển ảnh trong khung nhanh hơn**: mỗi ảnh khoảng 3–5 giây thay vì chia đều cả cảnh dài; ảnh hết thì quay vòng lại.

### Mỗi video phải có điểm mới về dựng (người dùng yêu cầu 30/10/2026)
- **Phong cách edit và hiệu ứng phải sáng tạo, biến tấu liên tục**, áp dụng cho cả video du lịch lẫn video ẩm thực. Nhiều video đăng liên tiếp không được cùng một kiểu.
- **Đừng làm video nào cũng giống hệt nhau.** Mỗi vùng mới phải **thêm hoặc chỉnh ít nhất một điểm** về hiệu ứng, chuyển cảnh hay cách dựng, sao cho sáng tạo và hợp với vùng đó.
  - Ví dụ: Đà Nẵng có polaroid, sticker, khói. Nha Trang thêm mỗi món một kiểu nền, con trỏ chuột bấm qua thẻ, nút "món tiếp". Phú Quốc bỏ con trỏ, thay bằng lật thẻ món. Quy Nhơn thay lật thẻ bằng ảnh lấy liền hiện dần và chớp đèn khi đổi ảnh.
- **Con trỏ chuột và các hiệu ứng trong bảng đều không bắt buộc.** Hiệu ứng linh hoạt theo từng video. Cứ thoải mái sáng tạo: dùng, bỏ, đổi hoặc nghĩ cái mới cho hợp với vùng. Chỉ cần mỗi video có nét riêng.
- Ghi điểm mới vào bảng trên, kèm tên vùng, để lần sau biết đã có gì và tránh lặp lại.
- Tái sử dụng được, nhưng đổi cách phối: kiểu nền, màu, vị trí sticker, kiểu chuyển cảnh (`slide`, `wipe`, `fade`, `iris`), nhịp xuất hiện của thẻ…

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
- **Cứ sau 2 vùng thì đổi kiểu intro và outro**, kèm đổi một vài hiệu ứng chính (cách hiện món, chuyển cảnh, kiểu thẻ), để các video ẩm thực đăng liên tiếp không giống nhau. Cùng quy tắc với skill du lịch.
- Các kiểu intro có thể xoay vòng: tựa lớn trên ảnh món tràn khung; cắt dồn nhanh ảnh các món có chớp trắng; menu "chọn món" có con trỏ bấm; bàn ăn nhìn từ trên xuống, các món trượt vào; bản đồ vùng ghim các món.
- Các kiểu outro có thể xoay vòng: hỏi "bạn thích món nào?" trên ảnh ghép các món; thực đơn được tick lần lượt; bàn ăn đầy đủ các món; polaroid các món xếp chồng.
- Trước khi dựng, xem bảng nhật ký dưới đây và **không lặp intro hay outro của 2 vùng gần nhất**. Làm xong thì thêm một dòng vào bảng.

| Vùng | Intro | Outro |
|---|---|---|
| Sài Gòn (31/10/2026) | tựa lớn trên ảnh món tràn khung, tông tối | câu hỏi trên ảnh món, sdf-iris |
| Huế, bản điện ảnh (02/11/2026) | cắt dồn ảnh món có chớp trắng, tựa tách màu đập vào | thực đơn 5 món tick mực đỏ, thanh đen khép lại |
| Tam Đảo (02/11/2026, `tam-dao/hf/build-td.mjs`) | bàn gỗ nhìn từ trên xuống, 5 đĩa món trượt vào quanh tựa | chồng polaroid các món rơi xuống, "Bạn chọn món nào?" |
| Mộc Châu (03/11/2026, `moc-chau/hf/build-mc.mjs`) | 5 thẻ úp mặt (họa tiết xanh chè, đánh số) lật 3D lần lượt để lộ ảnh món trên khăn kẻ ô màu kem | ảnh ghép (mosaic) 5 món có số và tên trên khăn kẻ ô, tựa "Bạn chọn món nào?" |
| Cao Bằng (06/11/2026, `cao-bang/hf/build-cb.mjs`) | bảng phấn khung gỗ: tựa "CAO BẰNG ĂN GÌ?", 5 món viết dần bằng phấn kèm ảnh tròn | dải phim (lỗ răng cưa) chạy ngang với 5 món trên bảng phấn, "Bạn chọn món nào?" |
| Cao Bằng làm lại mùa lạnh (14/11/2026, `cao-bang/hf/build-cbf.mjs`) | bàn gỗ nhìn từ trên: 5 đĩa món (ảnh tròn trong đĩa sứ, nhãn đỏ) trượt vào từ các mép, thẻ tựa "CAO BẰNG ĂN GÌ?" bật lên giữa bàn, rồi bàn nhấc đi lộ footage hoàng hôn TP Cao Bằng | thực đơn giấy "THỰC ĐƠN MÙA LẠNH", mỗi món được tick đỏ (SVG nét vẽ), rồi câu hỏi "Bạn chọn món nào?" + CTA; huy hiệu bát nóng bốc hơi kèm số món, đốm lửa ấm bay lên, ảnh đổi bằng nở dần + chớp ấm; clip hạt dẻ rang và bóc hạt dẻ (Pexels, ghi là minh hoạ) |
| Sa Pa (07/11/2026, `sa-pa/hf/build-sp.mjs`) | thực đơn kiểu ứng dụng: 5 dòng món (ảnh vuông bo góc, tên, nhãn phụ) trượt vào, con trỏ chuột bay tới bấm món đầu | vòng quay 5 món (ảnh tròn quanh tâm thổ cẩm) quay chậm dần dưới mũi tên, "Bạn chọn món nào?" |
| Hà Giang (08/11/2026, `ha-giang/hf/build-hg.mjs`) | bảng phấn chợ phiên viền gỗ: 5 món (ảnh tròn, tên, nhãn) trượt vào kèm gạch chân phấn, vòng phấn vàng khoanh món đầu | 5 món rơi xuống mẹt tre đan (nảy bounce), mẹt xoay nhẹ, "Bạn chọn món nào?" |
| Ninh Bình (09/11/2026, `ninh-binh/hf/build-nb.mjs`) | thuyền nan chở 5 ảnh món lướt từ trái vào trên mặt nước, nhấp nhô, rồi danh sách 5 món (số tròn xanh ngọc, tên, nhãn) hiện lần lượt | 5 món nổi lên từ mặt sông đêm như đèn hoa đăng (viền vàng phát sáng), nhấp nhô, "Bạn chọn món nào?" |
| **Vùng tiếp theo** | **đổi: không dùng bảng phấn hay thuyền chở món** | **đổi: không dùng mẹt hay đèn hoa đăng** |

**Kiểm tra màu của footage trước khi dựng (15/11/2026):** `ffprobe -show_entries stream=color_transfer` từng clip; clip HDR (arib-std-b67/smpte2084, hay gặp ở clip quay iPhone trên Pexels) làm HyperFrames tự chuyển sang HDR ("HDR auto-promotion", "Layered composite frame" trong render.log) và video ra tối, mọi phụ đề hiện chồng cùng lúc. Chuyển clip về SDR trước: `zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p` kèm `-color_primaries bt709 -color_trc bt709 -colorspace bt709`. Validator `scripts/lib/video-data.mjs` của dự án cũ phải có layout "cost" (chép từ cat-ba), nếu không import giọng sẽ lỗi. Máy ít RAM thì chạy synth và render bằng `Start-Process -WindowStyle Minimized` (cửa sổ riêng) để Claude Code không tự tắt tác vụ nền.

Ý tưởng cho lần sau:
- Món "lật thẻ" như lật bài (thẻ xoay 3D khi đổi phần).
- Thanh tiến độ dạng bát đũa ở cạnh dưới.
- Màn "chọn món" kiểu menu ở hook, con trỏ bấm vào món đầu tiên.
- Thêm âm thanh "pop" khi thẻ hiện (cần file âm thanh có giấy phép).
- Bản đồ nhỏ ghim quán.
- Thẻ "giá tham khảo" khi có nguồn chắc chắn.

### Bố cục: chừa chỗ cho ảnh món (người dùng yêu cầu 31/10/2026, sau video Sài Gòn)
- **Phụ đề và thẻ thông tin hoặc danh sách quán phải nằm ở phần dưới màn hình**, khoảng từ y ≈ 1300 trở xuống (khung 1920). Không đặt ở giữa, vì như vậy che mất ảnh món. Ở video Sài Gòn, thẻ nằm ở y ≈ 1000 và phụ đề ở y ≈ 1185, nên bị che. Gợi ý: thẻ ở khoảng y 1320–1600, phụ đề ở khoảng y 1640–1700, vẫn trên vùng nút của TikTok (cách đáy khoảng 200px).
- **Có độ trễ trước khi hiện thẻ quán.** Mỗi món phải để ảnh hiện **rõ, không bị che ít nhất khoảng 2,5–3 giây** từ đầu cảnh, rồi mới hiện thẻ. Khi đổi sang ảnh mới, cũng nên cho ảnh mới hiện trọn một nhịp trước khi thẻ phủ lên. Người xem phải thấy món ăn trước, đọc chữ sau.

## 7b. Dựng bằng HyperFrames (từ Sài Gòn, 31/10/2026)
Có thể dựng bằng HyperFrames thay cho Remotion (dự án mẫu `sai-gon`, cảnh `story` trong `hf/build.mjs`). Cách dựng, xuất và làm ảnh bìa xem skill du lịch, mục 5c. Bản ẩm thực Sài Gòn dùng:
- tông tối điện ảnh: ảnh món tràn khung có Ken Burns;
- thẻ ORIGIN/HOW IT'S MADE/HOW TO EAT/WHERE hiện lần lượt theo cue;
- chuyển cảnh shader.

Lần sau đổi lại sang kiểu dễ thương hoặc thử kiểu mới.

## 8. Giọng, xuất, kiểm tra, đăng
- Giọng đọc: bản tiếng Việt dùng OmniVoice `vi-nu-tre-03`, bản tiếng Anh dùng Edge Ava `+5%`, như skill du lịch.
  - Clip dài khoảng 20 giây nên mỗi clip OmniVoice mất khoảng 10 phút. Chạy tách riêng bằng `Start-Process` để Claude Code không dừng nó khi thiếu RAM.
- Xuất video bằng `npm run video:render -- --slug <slug> --final`. Remotion đã đặt `Config.setConcurrency(2)` cho máy 8 GB RAM.
- Kiểm tra khung hình:
  - thẻ không đè phụ đề (thẻ kết thúc trước y ≈ 1590);
  - tên món nằm trên một dòng;
  - emoji hiện màu (font emoji của Windows);
  - thẻ đổi đúng lúc giọng nói tới cue;
  - ảnh chuyển trong khung đủ nhanh, mỗi ảnh khoảng 3–5 giây; khung ảnh đủ rộng.
- Mô tả TikTok (dưới khoảng 3.800 ký tự, không kể hashtag):
  - hook;
  - mỗi món một dòng 🍜, gồm tên món, một câu nguồn gốc, các quán kèm ★;
  - một dòng "quán lâu đời" cho các quán nổi tiếng dưới chuẩn;
  - câu hỏi kéo bình luận;
  - phần ghi nguồn ảnh (không ghi dòng "Giọng đọc AI · Nhạc nền tự sản xuất · Dựng bằng HyperFrames" hay ghi chú giọng AI, nhạc, công cụ dựng nào; người dùng yêu cầu 14/11/2026);
  - hashtag (`#amthuc<vung>`, `#<vung>angi`, `#ancungtiktok`, `#reviewanngon`, `#dacsan`, `#fyp`; bản tiếng Anh dùng `#vietnamesefood`, `#foodtok`…).
- Đăng TikTok như skill du lịch mục 7: chọn hashtag từ gợi ý, ảnh bìa không phụ đề, công khai. **Chỉ upload khi người dùng bảo upload** (từ 31/10/2026); làm xong thì báo và chờ.
- **Thứ tự đăng khi làm một địa điểm mới** (quy tắc xuyên suốt, xem skill du lịch mục 7):
  - Mỗi địa điểm có 6 video: du lịch 3N2Đ, video ẩm thực và du lịch 4N3Đ, mỗi loại hai bản VI và EN.
  - Làm xong hết rồi đăng theo thứ tự:
    1. 3N2Đ (VI, EN);
    2. ẩm thực (VI, EN);
    3. 4N3Đ (VI, EN).

## Quy tắc chung
- **Đúng sự thật:** nguồn gốc không rõ thì nói không rõ. Không bịa giai thoại, năm hay số liệu.
- **Ảnh phải đúng món, và món nào cũng phải có ít nhất 3 ảnh.** Không tìm được ảnh tự do thì đổi món, không dùng icon thay ảnh.
- Quán trên màn hình ≥4.5★, đã kiểm tra trên Google Maps. Quán nổi tiếng mà dưới chuẩn thì ghi rõ số sao trong phần mô tả.
- **Bản quyền:** chỉ dùng ảnh có giấy phép tự do và ghi nguồn đủ. Ảnh chụp TikTok chỉ dùng để nghiên cứu.
- **Làm trọn gói:** tự làm từ nghiên cứu tới đăng cả bản tiếng Việt và tiếng Anh, chỉ dừng hỏi khi có sự cố nghiêm trọng. Commit khi người dùng nói "Commit giúp tôi".
