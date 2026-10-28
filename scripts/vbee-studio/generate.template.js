// Playwright code for Vbee Studio (studio.vbee.vn), run through the Playwright
// MCP tool browser_run_code_unsafe in a browser already signed in to Vbee.
// scripts/vbee-script.mjs fills in the clip folder and the scenes; do not run
// this template directly.
//
// For each scene: make sure the house voice is selected, type the narration,
// press "Tạo audio", wait for the request to finish and download it as
// <DIR>/<scene-id>.mp3. It stops instead of guessing whenever something is off
// (wrong voice, text not as typed, Vbee asking to upgrade), and resubmits only
// when no points were charged, so a scene is never paid for twice.
async (page) => {
  const DIR = __DIR__;
  const SCENES = __SCENES__;
  const VOICE = 'HN - Ngọc Huyền';
  const log = [];

  // Download icons are clicked by position in the request list.
  await page.setViewportSize({ width: 1440, height: 1000 });

  const dismiss = async () => {
    for (const name of ['Nhắc lại sau', 'close', 'Đóng']) {
      const button = page.getByRole('button', { name, exact: true });
      const n = await button.count();
      for (let i = 0; i < n; i++) {
        if (await button.nth(i).isVisible().catch(() => false)) await button.nth(i).click().catch(() => {});
      }
    }
  };

  // The toolbar label; the same name also shows in the request list below.
  const voiceShown = () =>
    page.evaluate((voice) =>
      [...document.querySelectorAll('p, span, div, button')].some(
        (el) =>
          el.childElementCount === 0 &&
          el.textContent.trim().toLowerCase() === voice.toLowerCase() &&
          el.getClientRects().length > 0 &&
          el.getBoundingClientRect().top < 200 &&
          !el.closest('[role="dialog"]'),
      ), VOICE);

  const ensureVoice = async () => {
    if (await voiceShown()) return 'kept';
    const pickerOpen = await page.getByText('Giọng cộng đồng', { exact: true }).first().isVisible().catch(() => false);
    if (!pickerOpen) {
      // The voice button is the first one in the editor toolbar, top left.
      const opened = await page.evaluate(() => {
        const button = [...document.querySelectorAll('button')].find((b) => {
          const r = b.getBoundingClientRect();
          return r.top > 130 && r.top < 190 && r.left > 260 && r.left < 400 && b.textContent.trim().length > 0;
        });
        if (!button) return false;
        button.click();
        return true;
      });
      if (!opened) throw new Error('voice button not found in the toolbar');
      await page.waitForTimeout(2500);
    }
    // The row is the smallest ancestor of the name holding exactly one
    // "Sử dụng" button; click that button and nothing else.
    const clicked = await page.evaluate((target) => {
      const dialogs = [...document.querySelectorAll('[role="dialog"]')].filter((d) => d.textContent.includes('Giọng Vbee'));
      if (dialogs.length !== 1) return `dialogs: ${dialogs.length}`;
      const name = [...dialogs[0].querySelectorAll('p, span, div')].find(
        (el) => el.childElementCount === 0 && el.textContent.trim() === target,
      );
      if (!name) return 'name not found';
      let row = name.parentElement;
      while (row) {
        const buttons = [...row.querySelectorAll('button')].filter((b) => b.textContent.trim() === 'Sử dụng');
        if (buttons.length === 1) {
          buttons[0].scrollIntoView({ block: 'center' });
          buttons[0].click();
          return 'ok';
        }
        if (buttons.length > 1) return 'ambiguous row';
        row = row.parentElement;
      }
      return 'no button';
    }, VOICE);
    if (clicked !== 'ok') throw new Error(`voice picker: ${clicked}`);
    for (let t = 0; t < 10; t++) {
      await page.waitForTimeout(1000);
      if (await voiceShown()) return 'selected';
    }
    throw new Error(`could not select ${VOICE}`);
  };

  const readPoints = () => page.locator('text=/điểm$/').first().innerText().catch(() => null);

  for (const [id, text] of SCENES) {
    await dismiss();
    const voice = await ensureVoice();
    const editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Delete');
    await page.waitForTimeout(500);
    await page.keyboard.type(text);
    await page.waitForTimeout(1200);
    const typed = (await editor.innerText()).trim();
    if (typed !== text) throw new Error(`${id}: editor text mismatch: ${typed.slice(0, 80)}`);
    if (!(await voiceShown())) throw new Error(`${id}: voice changed`);

    const pointsBefore = await readPoints();
    const submit = async () => {
      await page.keyboard.press('Escape');
      await page.getByText('Tạo audio', { exact: true }).last().click();
      await page.waitForTimeout(2000);
      const confirm = page.getByText('Tiếp tục chuyển đổi', { exact: true });
      if (await confirm.isVisible().catch(() => false)) await confirm.click();
    };
    const blocked = () => page.getByText(/Vui lòng nâng cấp gói/).first().isVisible().catch(() => false);
    await submit();
    if (await blocked()) throw new Error(`${id}: Vbee asks to upgrade (trial or plan limit)`);
    for (let t = 0; t < 10; t++) {
      await page.waitForTimeout(2000);
      if ((await readPoints()) !== pointsBefore) break;
    }
    // Only resubmit if nothing was charged: a second click must never pay twice.
    if ((await readPoints()) === pointsBefore) {
      await dismiss();
      await submit();
      if (await blocked()) throw new Error(`${id}: Vbee asks to upgrade (trial or plan limit)`);
    }

    // The finished request shows at the top of the list, below the editor.
    const prefix = text.slice(0, 25);
    let found = false;
    for (let t = 0; t < 60 && !found; t++) {
      await page.waitForTimeout(2000);
      await dismiss();
      const title = page.getByText(prefix, { exact: false }).last();
      const box = (await title.isVisible().catch(() => false)) ? await title.boundingBox() : null;
      found = Boolean(box && box.y > 600);
    }
    if (!found) throw new Error(`${id}: the request never showed as finished`);
    await page.waitForTimeout(3000);
    let saved = null;
    for (let attempt = 0; attempt < 5 && !saved; attempt++) {
      const box = await page.getByText(prefix, { exact: false }).last().boundingBox();
      const downloading = page.waitForEvent('download', { timeout: 8000 }).catch(() => null);
      await page.mouse.click(1323, box.y + box.height / 2 + 8);
      const download = await downloading;
      if (download) {
        await download.saveAs(`${DIR}/${id}.mp3`);
        saved = download.suggestedFilename();
      } else {
        await page.waitForTimeout(4000);
      }
    }
    log.push({ id, voice, pointsBefore, saved });
    if (!saved) break;
  }
  return { log, points: await readPoints() };
}
