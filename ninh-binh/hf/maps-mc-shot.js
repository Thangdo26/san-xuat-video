async (page) => {
  // Captures the Google Maps header (name + stars + review count) of each on-screen restaurant, at 2x.
  const OUT = "D:/Thang_space_archive/moc-chau/public/videos/moc-chau/maps";
  const PLACES = [
    ["phuong-nhi", "NHÀ HÀNG PHƯƠNG NHI MỘC CHÂU", 20.835, 104.67],
    ["bep-nho", "Bếp Nhớ Tiểu khu 70 Mộc Châu", 20.837, 104.68],
    ["nguyet-anh", "Nguyệt Anh Quán Hẻm Nướng Mộc Châu", 20.84, 104.68],
    ["a-pao", "Nhà Hàng A Páo Mộc Châu", 20.84, 104.68],
    ["minh-chi", "Bún Cá Minh Chi Mộc Châu", 20.84, 104.68],
    ["be-be", "Bún riêu bề bề mộc châu", 20.84, 104.68],
    ["lau-nam", "Lẩu Nấm Thiên Nhiên Mộc Châu", 20.84, 104.68],
    ["com-thai", "Cơm Thái Sơn La Mộc Châu", 20.84, 104.68],
    ["tusa", "TuSa Đây Lẩu nướng Cafe Mộc Châu", 20.84, 104.68],
    ["lau-ngua", "Nhà Hàng Lẩu Ngựa 911 Mộc Châu", 20.84, 104.68],
    ["ban-moc", "Bản Mộc Quán Mộc Châu", 20.84, 104.68],
    ["ka-to", "Ka Tờ Rang Café Mộc Châu", 20.84, 104.68],
    ["viet-vh", "Nhà hàng Việt Mộc Châu Vân Hồ", 20.78, 104.76],
    ["vigolando", "Nhà hàng Vigolando Vân Hồ", 20.78, 104.76],
    ["hieu-thoa", "Nhà Hàng Hiếu Thoa Tây Bắc", 20.78, 104.76],
    ["xuan-bac", "Nhà Hàng Xuân Bắc Cá Hồi Cá Tầm CS Số 1 Chiềng Đi", 20.8, 104.7],
    ["ca-hoi-26", "Nhà Hàng Sinh Thái Cá Hồi 26 Mộc Châu", 20.83, 104.6],
    ["trinh-hau", "Trịnh Hậu Quán Mộc Châu", 20.84, 104.6],
    ["leo-xeo", "LÈO XÈO Grill Hotpot Mộc Châu", 20.845, 104.63],
  ];
  const ctx = await page.context().browser().newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2, locale: "vi-VN" });
  const p = await ctx.newPage();
  const out = [];
  for (const [key, q, lat, lng] of PLACES) {
    await p.goto(`https://www.google.com/maps/search/${encodeURIComponent(q)}/@${lat},${lng},14z?hl=vi`);
    await p.waitForTimeout(4000);
    const first = p.locator('div[role="feed"] a.hfpxzc').first();
    if (await first.count()) { await first.click(); await p.waitForTimeout(4000); }
    const box = await p.evaluate(() => {
      const main = [...document.querySelectorAll('div[role="main"]')].pop();
      const h1 = main?.querySelector("h1");
      const rate = main?.querySelector("div.F7nice");
      if (!h1 || !rate) return null;
      const cat = main.querySelector("button.DkEaL");
      const rs = [h1, rate].filter(Boolean).map((e) => e.getBoundingClientRect());
      const panel = main.getBoundingClientRect();
      const top = Math.min(...rs.map((r) => r.top)) - 12, bottom = Math.max(...rs.map((r) => r.bottom)) + 12;
      return { x: panel.left, y: top, width: panel.width, height: bottom - top, name: h1.textContent.trim(), rating: rate.innerText.replace(/\s+/g, " ").trim() };
    });
    if (!box) { out.push(`${key}: NOT FOUND`); continue; }
    await p.screenshot({ path: `${OUT}/${key}.png`, clip: { x: box.x, y: box.y, width: box.width, height: box.height } });
    out.push(`${key}: ${box.name} | ${box.rating} | ${Math.round(box.width)}x${Math.round(box.height)}`);
  }
  await ctx.close();
  return out;
}
