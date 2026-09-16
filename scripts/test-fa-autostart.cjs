// Testa att analysen auto-startar vid filval (ingen extra knapp)
const { chromium } = require('playwright');
const { PDFDocument, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

(async () => {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const p = doc.addPage([595, 842]);
  p.drawText('ELRAKNING TEST', { x: 50, y: 780, size: 18, font });
  p.drawText('Forbrukning: 5000 kWh', { x: 50, y: 740, size: 12, font });
  p.drawText('Paslag: 15 ore/kWh', { x: 50, y: 720, size: 12, font });
  p.drawText('Totalt: 3 412 kr', { x: 50, y: 690, size: 14, font });
  const pdfPath = path.join(__dirname, 'auto_test.pdf');
  fs.writeFileSync(pdfPath, await doc.save());

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const events = [];
  page.on('request', (r) => {
    if (r.url().includes('/api/events/funnel')) {
      const d = r.postData() || '';
      events.push(d.replace(/\s+/g, ' ').slice(0, 90));
    }
  });
  const ocrCalls = [];
  page.on('response', async (res) => {
    if (res.url().includes('/api/gpt-ocr')) {
      let b = ''; try { b = (await res.text()).slice(0, 120); } catch {}
      ocrCalls.push({ status: res.status(), body: b });
    }
  });

  console.log('1) Öppnar /fakturaanalys …');
  await page.goto('http://localhost:3000/fakturaanalys', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2000);

  // räkna synliga knappar
  const btns = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('button, label[for], a').forEach((el) => {
      const t = (el.innerText || '').trim();
      if (el.offsetParent !== null && t && t.length < 50) out.push(t);
    });
    return [...new Set(out)];
  });
  console.log('   synliga klickbara:', JSON.stringify(btns));

  console.log('2) Väljer fil (ingen extra klick) …');
  await page.locator('input[type="file"]').setInputFiles(pdfPath);

  // vänta på att OCR-anropet sker automatiskt
  for (let i = 0; i < 25; i++) {
    await page.waitForTimeout(2000);
    if (ocrCalls.length) break;
  }
  console.log('\n3) OCR-anrop:', ocrCalls.length ? JSON.stringify(ocrCalls) : 'INGET (auto-start misslyckades)');
  console.log('   funnel-events:', JSON.stringify(events, null, 1));
  console.log('   URL:', page.url());

  await page.screenshot({ path: 'scripts/fa_simplified.png' });
  await browser.close();
  fs.unlinkSync(pdfPath);
  process.exit(0);
})().catch((e) => { console.error('CRASH:', e.message); process.exit(1); });
