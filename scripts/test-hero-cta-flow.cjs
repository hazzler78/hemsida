// Verifiera: grön CTA -> intro-video -> /fakturaanalys (mot produktion)
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const navigations = [];
  page.on('framenavigated', (f) => {
    if (f === page.mainFrame()) navigations.push(f.url());
  });

  console.log('1) Öppnar www.elchef.se …');
  await page.goto('https://www.elchef.se/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2000);

  console.log('2) Klickar grön CTA …');
  await page.getByText('Analysera din elräkning – kom igång').first().click();
  await page.waitForTimeout(3000);

  // kolla video-overlay
  const videoInfo = await page.evaluate(() => {
    const vids = Array.from(document.querySelectorAll('video'));
    return vids.map((v) => ({
      src: v.currentSrc || v.src || (v.querySelector('source') || {}).src || '',
      paused: v.paused,
      readyState: v.readyState,
    }));
  });
  console.log('   video-element på sidan:', JSON.stringify(videoInfo));

  const dialog = await page.locator('[role="dialog"]').count();
  const hint = await page.locator('text=Så här gör du').count();
  console.log('   intro-overlay (dialog):', dialog, '| hint-text:', hint);

  // försök hitta källan till overlay-videon
  const overlaySrc = await page.evaluate(() => {
    const d = document.querySelector('[role="dialog"]');
    const v = d && d.querySelector('video');
    return v ? (v.getAttribute('src') || v.currentSrc) : null;
  });
  console.log('   overlay-video src:', overlaySrc);

  console.log('3) Klickar "Fortsätt →" …');
  const skip = page.locator('[role="dialog"] button', { hasText: 'Fortsätt' });
  if (await skip.count()) {
    await skip.first().click();
  } else {
    console.log('   (ingen Fortsätt-knapp hittad)');
  }
  await page.waitForTimeout(4000);
  console.log('   URL nu:', page.url());

  await browser.close();
  console.log('\nSLUTSATS: landade på', page.url ? page.url() : '?');
  process.exit(0);
})().catch((e) => { console.error('CRASH:', e.message); process.exit(1); });
