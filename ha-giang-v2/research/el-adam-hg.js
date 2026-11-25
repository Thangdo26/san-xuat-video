// Tạo giọng Adam (ElevenLabs) cho từng cảnh, chạy bằng mcp__playwright__browser_run_code_unsafe.
// Trước khi chạy: trình duyệt Playwright đã đăng nhập elevenlabs.io (Google), mở Text to Speech,
// chọn voice "Adam - Dominant, Firm" (tab My voices) và model Eleven v4.
// Sửa OUT và LINES (lời từng cảnh, số đọc thành chữ), rồi chạy. OUT phải là thư mục đã có.
async (page) => {
  const OUT = "D:/Thang_space_archive/ha-giang-v2/adam-hg";
  const LINES = {
    "hook": "Hello hô lê các con vợ! Cuối tháng mười một, Hà Giang đang mùa tam giác mạch, sáng tám độ mà cảnh đẹp muốn xỉu. Mình cày hơn sáu chục video TikTok của người vừa đi về để gom lịch trình ba ngày hai đêm này. Lưu lại liền nha!",
    "d1": "Ngày một, xe đêm tới thành phố lúc ba giờ sáng, ngủ tạm ở chỗ thuê xe rồi chạy: cổng trời Quản Bạ, dốc Thẩm Mã, dốc Chín Khoanh, nhà của Pao. Tối ngủ Lô Lô Chải, tới trước năm giờ chiều vì trời tối sớm lắm.",
    "d2": "Ngày hai lên cột cờ Lũng Cú, rồi đổ đèo Mã Pì Lèng xuống sông Nho Quế. Gõ bến thuyền hẻm Tu Sản chứ đừng gõ sông Nho Quế. Vé thuyền một trăm rưỡi, muốn ăn cơm view sông thì tới trước mười một giờ. Tối về phố cổ Đồng Văn quẩy lửa trại.",
    "d3": "Ngày ba, Chủ nhật thì ăn bát phở chợ phiên Đồng Văn rồi về. Từ Yên Minh tìm dừng chân dốc Cán Tỷ, không là Maps dắt vào đường rừng, xa thêm hai chục cây.",
    "extra": "Có thêm ngày thứ tư thì ngủ Mèo Vạc, về bằng cung Du Già. Đẹp nhất mà đường xấu, ít cây xăng, đổ đầy bình rồi hẵng đi.",
    "stay": "Đêm đầu ở Lô Lô Chải hoặc làng Thèn Pả cho yên, đêm hai ở phố cổ Đồng Văn cho vui. Mùa hoa đông lắm, đặt phòng trước nha.",
    "cost": "Tự túc từ Hà Nội hết khoảng ba triệu một người, nặng nhất là xe giường nằm với tiền phòng.",
    "outro": "Nhớ mang bằng lái, giữ xăng đầy bình, áo ấm với áo mưa. Clip là của các bạn TikToker, nguồn mình để ở mô tả. Lưu lại rồi lên Hà Giang đi các con vợ!"
  };
  const done = [];
  for (const [id, text] of Object.entries(LINES)) {
    const ed = page.locator(".tiptap.ProseMirror").first();
    await ed.click(); await page.keyboard.press("Control+A"); await page.keyboard.press("Backspace");
    await page.evaluate((txt) => {
      const el = document.querySelector(".tiptap.ProseMirror");
      const dt = new DataTransfer(); dt.setData("text/plain", txt);
      el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
    }, text);
    await page.waitForTimeout(1000);
    const resP = page.waitForResponse(r => /text-to-(dialogue|speech)/.test(r.url()) && r.request().method() === "POST", { timeout: 120000 });
    await page.getByRole("button", { name: /(Re)?generate speech/i }).first().click();
    const res = await resP; await res.finished();
    await page.waitForTimeout(1500);
    const dlP = page.waitForEvent("download", { timeout: 60000 });
    await page.getByRole("button", { name: "Download", exact: true }).first().click();
    const dl = await dlP;
    await dl.saveAs(`${OUT}/${id}.mp3`);
    done.push(id);
  }
  return done;
}