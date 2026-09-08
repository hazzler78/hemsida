// Playwright: direkt-test av BillUpload-komponenten på /billupload-test
const { chromium } = require('playwright');
const { PDFDocument, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

(async () => {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const p = doc.addPage([595, 842]);
  p.drawText('Elrakning Test - fast manadsavgift 55,20 kr', { x: 50, y: 780, size: 13, font });
  const p2 = doc.addPage([595, 842]);
  p2.drawText('Specifikation sida 2', { x: 50, y: 780, size: 12, font });
  const pdfPath = path.join(__dirname, 'billupload_test.pdf');
  fs.writeFileSync(pdfPath, await doc.save());

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const msgs = [];
  page.on('console', (m) => msgs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', (e) => msgs.push(`[pageerror] ${e.message}`));

  await page.goto('http://localhost:3000/billupload-test', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const input = page.locator('input[type="file"]');
  const accept = await input.getAttribute('accept');
  console.log('accept:', accept);

  await input.setInputFiles(pdfPath);
  console.log('PDF uppladdad — väntar på konvertering…');
  await page.waitForTimeout(8000);

  const body = await page.locator('body').innerText();
  const hasConverting = body.includes('Konverterar PDF');
  const hasInfo = body.includes('billupload_test.pdf') && body.includes('2 sidor');
  console.log('visar konvertering-status (tidigare):', hasConverting);
  console.log('visar filinfo (2 sidor):', hasInfo);
  const snippet = body.split('\n').filter((l) => l.includes('billupload_test') || l.includes('sid')).slice(0, 5);
  console.log('rader:', snippet.join(' | '));

  // consent + analys-knapp
  const cb = page.locator('input[type="checkbox"]');
  if (await cb.isVisible().catch(() => false)) { await cb.check().catch(() => {}); }
  const btn = page.locator('button:has-text("Analysera elräkning")').first();
  const disabled = await btn.isDisabled().catch(() => true);
  console.log('Analys-knapp disabled:', disabled, '(false = redo efter PDF)');
  console.log('knapptext:', (await btn.innerText().catch(() => '')));

  const errors = msgs.filter((m) => m.startsWith('[error]') || m.startsWith('[pageerror]'));
  if (errors.length) console.log('Konsolfel:', errors.join('\n'));

  await browser.close();
  process.exit(0);
})().catch((e) => { console.error('CRASH:', e); process.exit(1); });
