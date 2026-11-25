# Hà Giang làm lại từ đầu (người dùng yêu cầu 20/11/2026)

Yêu cầu: "sản xuất video du lịch Hà Giang 3n2d và gợi ý 4n3d + video về ẩm thực Hà Giang. Sản xuất lại theo quy trình từ đầu cho tôi để làm lại hai video này."

## Quyết định
- Dự án: `D:/Thang_space_archive/ha-giang-v2` (bộ công cụ chép từ `da-lat`: scripts, node_modules, public/shared, hf/build-dl.mjs, hf/build-dla.mjs, hf/build-dc.mjs, hf/face-stickers.py + models, data/gen-captions.mjs).
- Slug: `ha-giang-3n2d-v2` (du lịch 3N2Đ, có cảnh "thêm 1 ngày → 4N3Đ"), `ha-giang-am-thuc-v2` (ẩm thực).
- Giọng: **Adam (ElevenLabs)**, nói nhanh **~×1,4 so với video Đà Lạt** (người dùng yêu cầu 21/11/2026). Tạo bằng ElevenLabs (bộ `C:/Users/thang/Thang_space/voices/adam-elevenlabs/`), rồi tăng tốc bằng ffmpeg `atempo` (giữ cao độ) cho đủ ×1,4. Còn **2.463 credit** ElevenLabs (kiểm tra 21/11/2026) → lời thoại cả 2 video phải gọn (du lịch ≤1.200, ẩm thực ≤1.000 ký tự, chừa ~200 để thu lại); kiểm tra credit trước khi tạo.
- Du lịch: cold open footage + nhạc không lời (mẫu Đồng Cao). Ẩm thực: vào thẳng phần giới thiệu (người dùng vừa bỏ cold open của video ẩm thực Đà Lạt).
- Footage-first: clip TikTok viral (ghi nguồn trên màn hình + caption), Pexels/Pixabay nếu có. Che mặt chủ video bằng sticker (face-stickers.py), không che người bán/dân.
- Chuyển giữa 2 địa điểm/2 món: chuỗi 3–4 ảnh của nơi vừa xong (kiểu mới, khác polaroid Đà Lạt).
- Quán/chỗ ở ≥4.5★ ≥50 lượt + ảnh chụp Maps (chụp 21/11/2026).
- Phong cách: khác 10 dòng STYLE-LOG (đặc biệt khác Hà Giang 15/11: khung ngắm film, la bàn, cửa chớp, cánh hoa; và Đà Lạt 20/11). Nhạc: ambient cho du lịch (video trước là upbeat).
- Mỗi ngày đăng 1 video; chỉ đăng khi người dùng bảo.

## Tiến độ
- [x] 1b TikTok: 63 video đọc trọn (33 du lịch + 30 ẩm thực) → `research/tiktok.md` (20/11/2026).
- [x] 1 Blog/báo kiểm chứng (giá vé, mùa hoa, quy định Lũng Cú, dinh Vương) → `research/itinerary.md`
- [x] 1a Chỗ ở → `research/stay.md`; 1a2 Chi phí → `research/cost.md`
- [x] 3 Quán Maps + ảnh chụp → `research/food.md`, `public/videos/ha-giang/maps/`
- [x] 2 Footage (95 clip: 82 TikTok + 11 Pexels video + 4 ảnh Pexels gà đen; che mặt lau-pot→bỏ) (TikTok yt-dlp + Pexels) → `public/videos/ha-giang/footage/`, che mặt
- [ ] 4 Kịch bản + `data/gen-hg.mjs`, `data/gen-hga.mjs`
- [x] 5 Giọng Adam (ElevenLabs) + atempo ×1,4, kiểm tra bằng whisper
- [ ] 6 Builder mới (`hf/build-hg2.mjs`, `hf/build-hga2.mjs`), lint, render, kiểm tra khung hình
- [ ] Caption, cover, STYLE-LOG, CHUA-DANG-TIKTOK.md, upload-queue.md
