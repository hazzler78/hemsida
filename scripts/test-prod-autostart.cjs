// Verifiera auto-start mot PRODUKTION
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
  const pdfPath = path.join(__dirname, 'prod_auto.pdf');
  fs.writeFileSync(pdfPath, await doc.save());

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const ocr = [];
  page.on('response', async (res) => {
    if (res.url().includes('/api/gpt-ocr')) {
      let b = ''; try { b = (await res.text()).slice(0, 150); } catch {}
      ocr.push({ status: res.status(), body: b });
    }
  });

  await page.goto('https://www.elchef.se/fakturaanalys?utm_source=hero&utm_medium=cta', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2500);

  const btns = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('button, label[for]').forEach((el) => {
      const t = (el.innerText || '').trim();
      if (el.offsetParent !== null && t && t.length < 50) out.push(t);
    });
    return [...new Set(out)];
  });
  console.log('Synliga knappar (topp):', JSON.stringify(btns));

  console.log('Väljer fil …');
  await page.locator('input[type="file"]').setInputFiles(pdfPath);
  for (let i = 0; i < 25; i++) {
    await page.waitForTimeout(2000);
    if (ocr.length) break;
  }
  console.log('OCR-anrop:', ocr.length ? JSON.stringify(ocr) : 'INGET');

  const body = await page.locator('body').innerText();
  console.log('Resultat synligt:', /onödiga|elavgifter|kr\/mån/i.test(body) ? 'JA' : 'nej');
  console.log('URL:', page.url());

  await browser.close();
  fs.unlinkSync(pdfPath);
  process.exit(0);
})().catch((e) => { console.error('CRASH:', e.message); process.exit(1); });
