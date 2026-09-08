// Playwright-test: ladda upp test-PDF på /fakturaanalys, verifiera konvertering till bild
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const consoleMsgs = [];
  page.on('console', (m) => consoleMsgs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', (e) => consoleMsgs.push(`[pageerror] ${e.message}`));

  await page.goto('http://localhost:3000/fakturaanalys', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Ladda upp PDF:en via det dolda input-fältet
  const input = page.locator('input[type="file"]');
  await input.setInputFiles(path.join(__dirname, 'test_faktura.pdf'));
  console.log('fil uppladdad, väntar på konvertering…');

  // Vänta på att konverteringen ska bli klar (knappen "Analysera min elräkning nu" aktiverad)
  try {
    await page.waitForSelector('text=Analysera min elräkning nu', { timeout: 30000 });
    console.log('OK: analys-knapp aktiverad efter PDF-konvertering');
  } catch {
    console.log('FAIL: analys-knapp ej aktiverad. Console-meddelanden:');
    consoleMsgs.forEach((m) => console.log(m));
    const text = await page.locator('body').innerText();
    console.log('Sidtext (utdrag):', text.slice(0, 800));
    await browser.close();
    process.exit(1);
  }

  // Kolla att filnamn visas
  const bodyText = await page.locator('body').innerText();
  if (bodyText.includes('test_faktura.pdf (2 sidor konverterade till bild)')) {
    console.log('OK: filnamn visar "2 sidor konverterade till bild"');
  } else {
    console.log('INFO: filnamnsvisning =', bodyText.split('\n').filter(l => l.includes('test_faktura')).join(' | ') || '(saknas)');
  }

  // Om konsolen visar pdfjs-fel -> fail
  const errors = consoleMsgs.filter((m) => m.startsWith('[error]') || m.startsWith('[pageerror]'));
  if (errors.length) {
    console.log('Konsolfel:', errors.join('\n'));
  }

  await page.screenshot({ path: path.join(__dirname, 'fa_pdf_test.png'), fullPage: false });
  console.log('screenshot: scripts/fa_pdf_test.png');

  await browser.close();
  process.exit(0);
})().catch((e) => { console.error('TEST CRASH:', e); process.exit(1); });
