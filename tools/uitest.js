'use strict';
// Browser smoke test (needs Playwright + Chromium): jumps through every era via dev mode, opens every tab,
// renders tooltips, clicks buttons, prestiges, exports/imports and simulates offline time. Fails on any error.
//   node tools/uitest.js
const { chromium } = (function () { try { return require('playwright'); } catch (e) { return require('/opt/node22/lib/node_modules/playwright'); } })();
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + require('path').join(__dirname, '..', 'index.html'));
  await page.waitForTimeout(500);
  for (let era = 0; era <= 8; era++) {
    await page.evaluate((e) => { IG.Dev.jumpToEra(e); const s = IG.state; for (const r in s.run.resources) s.run.resources[r] = s.run.resources[r].add(1e9); s.perm.pp += 50; }, era);
    await page.waitForTimeout(300);
    const tabs = await page.evaluate(() => IG.UI.tabs.filter((t) => t.isUnlocked()).map((t) => t.id));
    for (const t of tabs) {
      await page.evaluate((id) => IG.UI.switchTab(id), t);
      await page.waitForTimeout(250);
      // hover a few tooltip targets and click some buttons
      await page.evaluate(() => {
        const nodes = Array.from(document.querySelectorAll('#tab-content *')).filter((n) => n._tip).slice(0, 12);
        for (const n of nodes) { const tip = typeof n._tip === 'function' ? n._tip() : n._tip; if (!tip) throw new Error('empty tip'); }
        const btns = Array.from(document.querySelectorAll('#tab-content button')).slice(0, 8);
        for (const b of btns) b.click();
      });
      await page.waitForTimeout(150);
    }
    console.log('era', era, 'tabs', tabs.join(','), 'errors so far', errors.length);
  }
  // prestige, export/import, offline
  await page.evaluate(() => { IG.UI.switchTab('powertree'); IG.Prestige.doPrestige(); });
  await page.waitForTimeout(300);
  const ok = await page.evaluate(() => { const s = IG.Save.exportString(); const st = IG.Save.importString(s); IG.Main.loadState(st); return st.perm.prestiges; });
  console.log('prestiges after import', ok);
  await page.evaluate(() => { const sum = IG.Offline.simulate(3 * 3600); IG.UI.welcomeBack(sum); });
  await page.waitForTimeout(500);
  
  console.log(errors.length ? errors.slice(0, 20).join('\n') : 'NO ERRORS');
  process.exitCode = errors.length ? 1 : 0;
  await browser.close();
})();
