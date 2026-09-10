// Verifiera att FA-mät-events skickas: fa_upload_cta_click + fa_file_selected + ocr_started
const { chromium } = require('playwright');
const { PDFDocument, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

(async () => {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const p = doc.addPage([595, 842]);
  p.drawText('Elrakning Test 55,20 kr', { x: 50, y: 780, size: 13, font });
  const pdfPath = path.join(__dirname, 'fa_events_test.pdf');
  fs.writeFileSync(pdfPath, await doc.save());

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const events = [];
  page.on('request', (req) => {
    if (req.url().includes('/api/events/funnel')) {
      try { const d = JSON.parse(req.postData() || '{}'); events.push(d.event); } catch {}
    }
  });

  await page.goto('http://localhost:3000/fakturaanalys', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  // Klicka "Välj faktura" (label kopplad till input)
  await page.locator('label[for="file-upload"]').click();
  await page.waitForTimeout(500);
  console.log('efter CTA-klick, events:', events.join(', '));

  // Ladda upp PDF
  await page.locator('input[type="file"]').setInputFiles(pdfPath);
  await page.waitForSelector('text=Analysera min elräkning nu', { timeout: 30000 });
  console.log('efter filval, events:', events.join(', '));

  // Klicka analysera (kommer ge 500 pga saknad nyckel, men event ska skickas)
  await page.click('text=Analysera min elräkning nu');
  await page.waitForTimeout(2500);
  console.log('efter analys-klick, events:', events.join(', '));

  console.log('\nRESULTAT:');
  console.log('  fa_upload_cta_click:', events.includes('fa_upload_cta_click') ? 'OK' : 'SAKNAS');
  console.log('  fa_file_selected:', events.includes('fa_file_selected') ? 'OK' : 'SAKNAS');
  console.log('  ocr_started:', events.includes('ocr_started') ? 'OK' : 'SAKNAS');

  // kolla trygghetsraden syns
  const body = await page.locator('body').innerText();
  console.log('  trygghetsrad synlig:', body.includes('Behandlas säkert') ? 'OK' : 'SAKNAS');

  await browser.close();
  process.exit(0);
})().catch((e) => { console.error('CRASH:', e.message); process.exit(1); });
