// Testa norska /robinhood -> /jamfor-elpriser
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const pageViews = [];
  page.on('request', (r) => {
    if (r.url().includes('/api/events/page-view')) pageViews.push((r.postData() || '').slice(0, 160));
  });

  console.log('1) Öppnar https://stromsjef.no/robinhood …');
  await page.goto('https://stromsjef.no/robinhood', { waitUntil: 'domcontentloaded', timeout: 60000 });
  try { await page.waitForURL('**/jamfor-elpriser**', { timeout: 20000 }); } catch {}
  await page.waitForTimeout(2500);

  console.log('   slut-URL:', page.url());
  const url = new URL(page.url());
  console.log('   utm_source :', url.searchParams.get('utm_source'));
  console.log('   utm_medium :', url.searchParams.get('utm_medium'));
  console.log('   utm_campaign:', url.searchParams.get('utm_campaign'));

  const ls = await page.evaluate(() => ({
    robinhood: localStorage.getItem('came_via_robinhood'),
    sid: localStorage.getItem('invoiceSessionId'),
  }));
  console.log('   localStorage:', JSON.stringify(ls));
  console.log('   page-view-anrop:', pageViews.length ? pageViews : 'INGET');

  await browser.close();
  process.exit(0);
})().catch((e) => { console.error('CRASH:', e.message); process.exit(1); });
