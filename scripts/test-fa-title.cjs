// Verifiera rubriken pa iPhone-bredder
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  for (const [name, w] of [['iPhone SE', 375], ['iPhone 14', 390], ['iPhone 15 Pro Max', 430]]) {
    const page = await browser.newPage({ viewport: { width: w, height: 844 }, deviceScaleFactor: 2 });
    await page.goto('https://www.elchef.se/fakturaanalys', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2200);

    const info = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      if (!h1) return null;
      const r = h1.getBoundingClientRect();
      const cs = getComputedStyle(h1);
      // räkna antal textrader via höjd / line-height
      const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.15;
      return {
        text: h1.innerText,
        fontSize: cs.fontSize,
        lines: Math.round(r.height / lh),
        width: Math.round(r.width),
        viewport: window.innerWidth,
        overflow: r.right > window.innerWidth + 1 || r.left < -1,
      };
    });
    console.log(`[${name} ${w}px]`, JSON.stringify(info));
    if (w === 390) await page.screenshot({ path: 'scripts/fa_h1.png', clip: { x: 0, y: 0, width: w, height: 620 } });
    await page.close();
  }
  await browser.close();
  process.exit(0);
})().catch((e) => { console.error('CRASH:', e.message); process.exit(1); });
