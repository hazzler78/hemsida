// Verifiera: knappen ryms pa smal skarm + FA-ramen borta
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();

  for (const w of [360, 390]) {
    const page = await browser.newPage({ viewport: { width: w, height: 844 }, deviceScaleFactor: 2 });
    await page.goto('https://www.elchef.se/', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);

    const info = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('button, span, a'));
      const btn = els.find((e) => (e.innerText || '').trim() === 'Analysera din elräkning');
      if (!btn) return { found: false };
      const r = btn.getBoundingClientRect();
      return {
        found: true,
        left: Math.round(r.left),
        right: Math.round(r.right),
        width: Math.round(r.width),
        viewport: window.innerWidth,
        stickerUt: r.right > window.innerWidth || r.left < 0,
      };
    });
    console.log(`[${w}px]`, JSON.stringify(info));
    if (w === 390) await page.screenshot({ path: 'scripts/hero_390.png' });
    await page.close();
  }

  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await page.goto('https://www.elchef.se/fakturaanalys', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2500);

  const frame = await page.evaluate(() => {
    const main = document.querySelector('main');
    if (!main) return null;
    const inner = main.firstElementChild;
    if (!inner) return null;
    const cs = getComputedStyle(inner);
    return { background: cs.backgroundColor, border: cs.borderWidth + ' ' + cs.borderStyle, radius: cs.borderRadius, shadow: cs.boxShadow };
  });
  console.log('\nFA-innerram:', JSON.stringify(frame));
  await page.screenshot({ path: 'scripts/fa_noframe.png' });

  await browser.close();
  process.exit(0);
})().catch((e) => { console.error('CRASH:', e.message); process.exit(1); });
