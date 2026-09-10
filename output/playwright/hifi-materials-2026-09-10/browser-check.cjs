const fs = require('node:fs');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/ASUS/AppData/Local/npm-cache/_npx/31e32ef8478fbf80/node_modules/playwright');
(async () => {
  const dir = 'output/playwright/hifi-materials-2026-09-10';
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.stack || error.message));
  const session = () => page.evaluate(() => JSON.stringify(window.hifiSnapshot().session));
  const action = id => page.locator(`[data-action="${id}"]`).click();
  try {
    await page.goto('http://127.0.0.1:4262/');
    await page.locator('[data-bowl-target="OBJ_W"]').first().click();
    await action('A.OBSERVE.WHOLE');
    await page.locator('[data-claim="identity"]').click();
    await page.locator('.source-row').filter({ hasText: '整器形制与可见修补' }).click();
    await page.locator('.material-reader').waitFor();
    const before = await session();
    const first = await page.locator('.material-reader').innerText();
    assert.ok(first.includes('年代与类别'));
    assert.ok(first.includes('这项判断尚未成立'));
    assert.ok(first.includes('尚缺底足'));
    assert.equal(await page.locator('.material-reader canvas').count(), 0);
    const resultBounds = await page.locator('.material-result').boundingBox();
    const boundaryBounds = await page.locator('.material-boundary').boundingBox();
    assert.ok(boundaryBounds.y + boundaryBounds.height < 1000);
    await page.screenshot({ path: `${dir}/identity-reading.png` });
    await page.locator('.material-image-toggle').click();
    await page.locator('.material-reader canvas').waitFor();
    assert.equal(await page.locator('.material-reader canvas').count(), 1);
    await page.getByRole('button', { name: '底足位置', exact: true }).click();
    await page.getByRole('button', { name: '放大或恢复材料图像' }).click();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.material-reader').count(), 0);
    assert.equal(await session(), before);
    for (const [place, id] of [['T1', 'A.LOCATE.HISTORIC_IMAGE'], ['XRAY', 'A.IMAGE.XRAY']]) {
      await page.locator(`[data-place="${place}"]`).click();
      await action(id);
    }
    await page.locator('[data-bowl-target="OBJ_W"]').first().click();
    await page.locator('input[name="comparison-basis"][value="photo"]').check();
    await action('A.MAP.REGION_CONTINUITY');
    await page.getByRole('button', { name: '全览', exact: true }).click();
    if (await page.getByRole('button', { name: /展开这份材料/ }).count() === 0) await page.locator('[data-map-node="obs.structure.major.cross-time"]').click();
    await page.getByRole('button', { name: /展开这份材料/ }).click();
    assert.ok((await page.locator('.material-reader').innerText()).includes('照片归属尚未核实'));
    assert.equal(await page.locator('[data-material-source]').count(), 3);
    const contextId = await page.locator('.material-reader').getAttribute('data-context-id');
    const beforeInputs = await session();
    await page.locator('[data-material-source="obs.phase.t1"]').click();
    assert.equal(await page.locator('.material-reader').getAttribute('data-context-id'), contextId);
    assert.ok((await page.locator('.material-reader').innerText()).includes('返回「旧照与现状的区域差异报告」'));
    await page.locator('.material-return').click();
    assert.equal(await page.locator('[data-material-source]').count(), 3);
    assert.equal(await session(), beforeInputs);
    await page.screenshot({ path: `${dir}/comparison-reading.png` });
    assert.deepEqual(errors, []);
    const report = {
      reviewRequired: true, provenance: 'Implementation owner, real UI and read-only hifiSnapshot',
      viewport: { width: 1440, height: 1000 },
      checks: [
        'Partial identity context and missing basis are visible before images',
        'Images start collapsed; canvas, angle and zoom remain available',
        'Escape closes; reading does not change the session',
        'D uses three acquired inputs and retains pending photo attribution',
        'Following an input preserves context; return restores the original report',
      ], resultBounds, boundaryBounds, contextId, pageErrors: errors,
    };
    fs.writeFileSync(`${dir}/browser-check.json`, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
  } catch (error) {
    fs.writeFileSync(`${dir}/browser-failure-${Date.now()}.json`, JSON.stringify({ message: error.message, pageErrors: errors, body: await page.locator('body').innerText() }, null, 2));
    throw error;
  } finally { await browser.close(); }
})();
