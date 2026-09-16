// Verifiera matning: bada Hampus-lankarna med utm_content
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();

  const targets = [
    { name: 'SE', url: 'https://www.elchef.se/robinhood?utm_content=test-se', expect: '/fakturaanalys' },
    { name: 'NO', url: 'https://stromsjef.no/robinhood?utm_content=test-no', expect: '/jamfor-elpriser' },
  ];

  for (const t of targets) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const pv = [];
    page.on('request', (r) => { if (r.url().includes('/api/events/page-view')) pv.push(r.url()); });

    try {
      await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      try { await page.waitForURL(`**${t.expect}**`, { timeout: 20000 }); } catch {}
      await page.waitForTimeout(2500);
    } catch (e) { console.log(`[${t.name}] navigeringsfel:`, e.message); }

    const u = new URL(page.url());
    const ls = await page.evaluate(() => localStorage.getItem('came_via_robinhood')).catch(() => null);
    console.log(`[${t.name}] ${t.url}`);
    console.log(`   -> ${u.pathname}?${u.search}`);
    console.log(`   utm_source=${u.searchParams.get('utm_source')}  utm_content=${u.searchParams.get('utm_content')}`);
    console.log(`   came_via_robinhood=${ls}   page-view-anrop=${pv.length}`);
    await page.close();
  }

  await browser.close();
  process.exit(0);
})().catch((e) => { console.error('CRASH:', e.message); process.exit(1); });
