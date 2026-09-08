// Playwright: öppna chatten via aria-label, trigga [SHOW_BILL_UPLOAD], ladda upp PDF
const { chromium } = require('playwright');
const { PDFDocument, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

(async () => {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const p = doc.addPage([595, 842]);
  p.drawText('Elrakning Test - fast manadsavgift 55,20 kr', { x: 50, y: 780, size: 13, font });
  const pdfPath = path.join(__dirname, 'billupload_test.pdf');
  fs.writeFileSync(pdfPath, await doc.save());

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const msgs = [];
  page.on('console', (m) => msgs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', (e) => msgs.push(`[pageerror] ${e.message}`));

  await page.goto('http://localhost:3000/fakturaanalys', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3500);

  // Öppna chatten via aria-label
  const openBtn = page.locator('[aria-label="Öppna chat"]').first();
  try {
    await openBtn.click({ timeout: 3000 });
    console.log('chat öppnad');
    await page.waitForTimeout(1500);
  } catch {
    console.log('kunde inte öppna chat');
  }

  const input = page.locator('textarea, input[type="text"]').last();
  const inputVisible = await input.isVisible().catch(() => false);
  console.log('chatt-input synlig:', inputVisible);

  if (inputVisible) {
    await input.click();
    await input.fill('Jag vill ladda upp min elräkning för analys');
    await input.press('Enter');
    console.log('meddelande skickat — väntar på BillUpload…');

    let billSeen = false;
    try {
      await page.waitForSelector('text=Analysera din elräkning', { timeout: 25000 });
      billSeen = true;
    } catch {}
    console.log('BillUpload synlig:', billSeen);

    if (billSeen) {
      const bi = page.locator('input[type="file"][accept*="application/pdf"]');
      const cnt = await bi.count();
      console.log('pdf-inputs:', cnt);
      if (cnt > 0) {
        await bi.first().setInputFiles(pdfPath);
        console.log('PDF uppladdad — väntar på konvertering…');
        await page.waitForTimeout(8000);
        const body = await page.locator('body').innerText();
        console.log('visar Konverterar:', body.includes('Konverterar PDF'));
        console.log('visar sidinfo:', body.includes('sidor konverterade') || body.includes('billupload_test'));
        const btn = page.locator('button:has-text("Analysera elräkning")').first();
        const disabled = await btn.isDisabled().catch(() => true);
        console.log('Analys-knapp redo (disabled=false):', disabled === false);
        // klicka om consent finns ikryssad krävs; bara logga om knappen finns
        const consent = page.locator('input[type="checkbox"]').first();
        if (await consent.isVisible().catch(() => false)) {
          await consent.check().catch(() => {});
          const disabled2 = await btn.isDisabled().catch(() => true);
          console.log('Analys-knapp redo efter consent:', disabled2 === false);
        }
      } else {
        console.log('FAIL: ingen pdf-input i BillUpload. accept=', await page.locator('input[type="file"]').first().getAttribute('accept'));
      }
    }
  }

  const errors = msgs.filter((m) => m.startsWith('[error]') || m.startsWith('[pageerror]'));
  if (errors.length) console.log('Konsolfel:', errors.join('\n'));
  await browser.close();
  process.exit(0);
})().catch((e) => { console.error('CRASH:', e); process.exit(1); });
