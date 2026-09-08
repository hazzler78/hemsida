// End-to-end: ladda upp test-PDF -> konvertering -> OCR-anrop -> svar
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const msgs = [];
  page.on('console', (m) => msgs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', (e) => msgs.push(`[pageerror] ${e.message}`));
  let ocrRequest = null;
  page.on('request', (req) => {
    if (req.url().includes('/api/gpt-ocr')) ocrRequest = req;
  });

  await page.goto('http://localhost:3000/fakturaanalys', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.locator('input[type="file"]').setInputFiles(path.join(__dirname, 'test_faktura.pdf'));
  await page.waitForSelector('text=Analysera min elräkning nu', { timeout: 30000 });
  console.log('PDF konverterad -> klickar Analysera');

  await page.click('text=Analysera min elräkning nu');

  // Vänta på resultat (gptAnswer) ELLER felmeddelande
  let outcome = 'timeout';
  try {
    await page.waitForSelector('text=Så skulle kostnaden se ut', { timeout: 60000 });
    outcome = 'SUCCESS (analys visad)';
  } catch {
    // kolla efter error eller annat resultat
    const body = await page.locator('body').innerText();
    const errIdx = body.indexOf('Kunde inte analysera');
    if (errIdx >= 0) outcome = 'ERROR: ' + body.slice(errIdx, errIdx + 200);
    else outcome = 'INGET RESULTAT. Sidtext: ' + body.slice(0, 400).replace(/\n/g, ' | ');
  }

  // Kolla vad som skickades i OCR-anropet
  let sentType = 'n/a', sentName = 'n/a';
  if (ocrRequest) {
    try {
      const post = ocrRequest.postData();
      const m = post && post.match(/filename="([^"]+)"/);
      const ct = post && post.match(/Content-Type: ([^\r\n]+)/);
      sentName = m ? m[1] : '(okänd)';
      sentType = ct ? ct[1] : '(okänd)';
    } catch {}
  }

  console.log('OCR-anrop:', ocrRequest ? 'SKEDDE' : 'SAKNAS');
  console.log('  filnamn skickat:', sentName);
  console.log('  content-type:', sentType);
  console.log('Utfall:', outcome);

  await page.screenshot({ path: path.join(__dirname, 'fa_pdf_e2e.png'), fullPage: false });
  await browser.close();
  process.exit(ocrRequest && outcome.startsWith('SUCCESS') ? 0 : 2);
})().catch((e) => { console.error('CRASH:', e.message); process.exit(1); });
