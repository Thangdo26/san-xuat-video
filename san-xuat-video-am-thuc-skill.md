---
name: san-xuat-video-am-thuc
description: Quy trình sản xuất video dọc 9:16 (TikTok/Reels) giới thiệu ẩm thực vùng miền bằng Remotion, ít nhất 5 món mỗi vùng. Mỗi món được nghiên cứu kỹ nguồn gốc, cách làm, cách ăn và quán nổi tiếng (Google Maps ≥4.5★), cùng TikTok và báo chí; video là ảnh món ăn, phụ đề và hiệu ứng dễ thương (khung polaroid, emoji nhảy, khói, lấp lánh). Có bản tiếng Việt và tiếng Anh, tự đăng TikTok. Dùng khi người dùng muốn làm video "<vùng> ăn gì", "đặc sản <vùng>", "ẩm thực <vùng>".
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
Làm như mục 1b của skill du lịch: tìm video, chụp màn hình, đọc bình luận. Từ khoá: "<món> <vùng>", "<vùng> ăn gì", "đặc sản <vùng>".
- Kết quả tìm kiếm nằm trong `[data-e2e="search_video-item"]`. Đừng lấy mọi `a[href*="/video/"]`, vì ô thông báo (inbox) cũng có link video.
- Cẩn thận với **seeding**: nhiều bình luận cùng giới thiệu một địa chỉ bằng lời lẽ giống nhau. Không đưa những quán đó vào.
- Bình luận rất có ích để biết **quán theo gu khách du lịch hay gu dân địa phương**, và quán nào đang xuống chất.

## 4. Quán ngon
- Kiểm tra từng quán trên Google Maps bằng Playwright, cách làm như skill du lịch mục 3.
- Quét theo món: `/maps/search/<món>/@<lat>,<lng>,14z`, lọc ≥4.5★ và ≥80 lượt.
- **Trên màn hình chỉ hiện quán ≥4.5★**, 2–3 quán mỗi món.
- **Quán nổi tiếng nhưng dưới 4.5★** (rất hay gặp, ví dụ bánh xèo Bà Dưỡng 4.3★ với hơn 10.000 lượt): không đưa lên màn hình. Ghi vào phần mô tả bài đăng như "quán lâu đời", kèm số sao thật. Không giấu số sao.
- Mở trang chi tiết từng quán hiện trên màn hình để xem có dòng "đóng cửa" không, và đối chiếu tên.

## 5. Ảnh món ăn
- Wikimedia Commons: tìm cả `generator=search` lẫn danh mục (`Category:<món>`, `Category:Cuisine of <vùng>`). Ưu tiên ảnh **chụp tại vùng đó** (xem phần mô tả của file).
- Món phải là **đúng món**. Đúng kiểu vùng càng tốt: bánh xèo miền Trung nhỏ và giòn, khác bánh miền Nam.
- **Món nào cũng phải có ảnh thật của đúng món đó** (người dùng yêu cầu 30/10/2026). Không được có món chỉ có icon mà không có ảnh minh hoạ.
  - Tìm kỹ trước khi bỏ cuộc:
    - Commons: dùng cả `generator=search` và danh mục, thử tên có dấu, không dấu và tên tiếng Anh.
    - Openverse và Flickr, chỉ lấy ảnh CC BY, CC BY-SA hoặc CC0.
  - Ảnh chụp đúng món nhưng ở vùng khác thì dùng được, nhưng phải ghi rõ trong caption, ví dụ "ảnh minh hoạ món chụp ở X".
  - **Không bao giờ** lấy ảnh món khác thay vào.
  - Vẫn không có ảnh thì đổi sang món khác.
  - `story.illustration` (emoji) chỉ là phương án dự phòng cũ, không còn dùng làm hình chính của món.
- **Xen ảnh người địa phương đang làm món** (nướng, tráng bánh, ủ mắm, bán ở chợ…): ảnh làm món tăng sự thích thú cho người xem. Mỗi video nên có vài món như vậy. Thứ tự gợi ý trong `gallery`: ảnh món, ảnh làm món, ảnh món cận cảnh.
- **Mỗi món 3–4 ảnh** nếu tìm được, để khung ảnh chuyển đủ nhanh.
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

### Khung ảnh và nhịp ảnh (người dùng yêu cầu 30/10/2026)
- Khung ảnh nên **rộng hơn** khung polaroid cũ, gần tràn ngang màn hình nhưng vẫn chừa lề an toàn.
- **Chuyển ảnh trong khung nhanh hơn**: mỗi ảnh khoảng 3–5 giây thay vì chia đều cả cảnh dài; ảnh hết thì quay vòng lại.

### Mỗi video phải có điểm mới về dựng (người dùng yêu cầu 30/10/2026)
- **Phong cách edit và hiệu ứng phải sáng tạo, biến tấu liên tục**, áp dụng cho cả video du lịch lẫn video ẩm thực. Nhiều video đăng liên tiếp không được cùng một kiểu.
- **Đừng làm video nào cũng giống hệt nhau.** Mỗi vùng mới phải **thêm hoặc chỉnh ít nhất một điểm** về hiệu ứng, chuyển cảnh hay cách dựng, sao cho sáng tạo và hợp với vùng đó.
  - Ví dụ: Đà Nẵng có polaroid, sticker, khói. Nha Trang thêm mỗi món một kiểu nền, con trỏ chuột bấm qua thẻ, nút "món tiếp". Phú Quốc bỏ con trỏ, thay bằng lật thẻ món.
- **Con trỏ chuột và các hiệu ứng trong bảng đều không bắt buộc.** Hiệu ứng linh hoạt theo từng video. Cứ thoải mái sáng tạo: dùng, bỏ, đổi hoặc nghĩ cái mới cho hợp với vùng. Chỉ cần mỗi video có nét riêng.
- Ghi điểm mới vào bảng trên, kèm tên vùng, để lần sau biết đã có gì và tránh lặp lại.
- Tái sử dụng được, nhưng đổi cách phối: kiểu nền, màu, vị trí sticker, kiểu chuyển cảnh (`slide`, `wipe`, `fade`, `iris`), nhịp xuất hiện của thẻ…

Ý tưởng cho lần sau:
- Món "lật thẻ" như lật bài (thẻ xoay 3D khi đổi phần).
- Thanh tiến độ dạng bát đũa ở cạnh dưới.
- Màn "chọn món" kiểu menu ở hook, con trỏ bấm vào món đầu tiên.
- Thêm âm thanh "pop" khi thẻ hiện (cần file âm thanh có giấy phép).
- Bản đồ nhỏ ghim quán.
- Thẻ "giá tham khảo" khi có nguồn chắc chắn.

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
  - phần ghi nguồn ảnh;
  - hashtag (`#amthuc<vung>`, `#<vung>angi`, `#ancungtiktok`, `#reviewanngon`, `#dacsan`, `#fyp`; bản tiếng Anh dùng `#vietnamesefood`, `#foodtok`…).
- Đăng TikTok như skill du lịch mục 7: chọn hashtag từ gợi ý, ảnh bìa không phụ đề, công khai, **tự bấm Post**.
- **Thứ tự đăng khi làm một địa điểm mới** (quy tắc xuyên suốt, xem skill du lịch mục 7):
  - Mỗi địa điểm có 6 video: du lịch 3N2Đ, video ẩm thực và du lịch 4N3Đ, mỗi loại hai bản VI và EN.
  - Làm xong hết rồi đăng theo thứ tự:
    1. 3N2Đ (VI, EN);
    2. ẩm thực (VI, EN);
    3. 4N3Đ (VI, EN).

## Quy tắc chung
- **Đúng sự thật:** nguồn gốc không rõ thì nói không rõ. Không bịa giai thoại, năm hay số liệu.
- **Ảnh phải đúng món, và món nào cũng phải có ảnh.** Không tìm được ảnh tự do thì đổi món, không dùng icon thay ảnh.
- Quán trên màn hình ≥4.5★, đã kiểm tra trên Google Maps. Quán nổi tiếng mà dưới chuẩn thì ghi rõ số sao trong phần mô tả.
- **Bản quyền:** chỉ dùng ảnh có giấy phép tự do và ghi nguồn đủ. Ảnh chụp TikTok chỉ dùng để nghiên cứu.
- **Làm trọn gói:** tự làm từ nghiên cứu tới đăng cả bản tiếng Việt và tiếng Anh, chỉ dừng hỏi khi có sự cố nghiêm trọng. Commit khi người dùng nói "Commit giúp tôi".
