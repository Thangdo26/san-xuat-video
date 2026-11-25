// Tạo giọng Adam (ElevenLabs) cho từng cảnh, chạy bằng mcp__playwright__browser_run_code_unsafe.
// Trước khi chạy: trình duyệt Playwright đã đăng nhập elevenlabs.io (Google), mở Text to Speech,
// chọn voice "Adam - Dominant, Firm" (tab My voices) và model Eleven v4.
// Sửa OUT và LINES (lời từng cảnh, số đọc thành chữ), rồi chạy. OUT phải là thư mục đã có.
async (page) => {
  const OUT = "D:/Thang_space_archive/ha-giang-v2/adam-hga";
  const LINES = {
    "hook": "Hello hô lê các con vợ! Lên Hà Giang mà chỉ ăn lẩu là phí. Đây là sáu món dân địa phương ăn thật, chọn từ ba chục video TikTok, quán nào lên hình cũng trên bốn chấm năm sao.",
    "banhcuon": "Sáng ở thành phố ăn bánh cuốn trứng, chan nước ninh xương chứ không chấm nước mắm. Bánh cuốn Giang năm sao, Bà Cúc bốn chấm tám.",
    "pho": "Chủ nhật ra chợ phiên Đồng Văn làm bát phở lợn bản da giòn, nước xương ngọt thanh. Quán bà Dung trong chợ được dân Đồng Văn khen nhất.",
    "cuoncai": "Chiều ở Lô Lô Chải thì mua xiên thịt cuốn cải nướng, cải hơi đắng mà béo thơm, vừa đi vừa ăn.",
    "lau": "Tối lạnh tám độ thì phải có nồi lẩu gà đen. Giàng Quán năm sao, Thạch Sơn bốn chấm chín.",
    "thangco": "Dám thử thì gọi thắng cố ngựa ở Đồng Văn, đi hai người gọi nồi nhỏ thôi. Thạch Sơn với CND đều trên bốn chấm tám.",
    "chao": "Khuya thì húp bát cháo ấu tẩu, đắng nhẹ mà ấm người. Củ ấu tẩu có độc nên chỉ ăn ở quán làm kỹ, sợ đắng thì xin ít ấu tẩu.",
    "outro": "Mua thịt treo gác bếp về làm quà nữa nha. Clip của các bạn TikToker, nguồn ở mô tả. Lưu lại rồi lên Hà Giang ăn cho đã đi các con vợ!"
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