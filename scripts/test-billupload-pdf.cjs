// Playwright: verifiera BillUpload (chatten) tar emot PDF och konverterar
const { chromium } = require('playwright');
const { PDFDocument, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

(async () => {
  // skapa test-PDF
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page1 = doc.addPage([595, 842]);
  page1.drawText('Elräkning Testbolaget - fast manadsavgift 55,20 kr', { x: 50, y: 780, size: 13, font });
  const pdfPath = path.join(__dirname, 'billupload_test.pdf');
  fs.writeFileSync(pdfPath, await doc.save());

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const msgs = [];
  page.on('console', (m) => msgs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', (e) => msgs.push(`[pageerror] ${e.message}`));

  await page.goto('http://localhost:3000/fakturaanalys', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000); // chatten laddas idle ~2.5s

  // Hitta chatten och dess BillUpload-komponent.
  // BillUpload visas bara efter [SHOW_BILL_UPLOAD]; enklare: öppna komponenten direkt via
  // att hitta "Analysera din elräkning"-rutan. Vi klickar på chatt-knappen först om den finns.
  let opened = false;
  const chatToggle = page.locator('button:has-text("AI"), [aria-label*="chatt" i], [aria-label*="Chat" i]').first();
  try {
    if (await chatToggle.isVisible({ timeout: 2000 })) {
      await chatToggle.click();
      opened = true;
      await page.waitForTimeout(1500);
    }
  } catch { opened = false; }

  // Direkt-testa BillUpload: den ligger i chatten; om inte synlig, navigera till en sida som
  // renderar komponenten direkt är ej möjlig, så vi försöker hitta texten.
  const bodyText = await page.locator('body').innerText();
  console.log('chat öppnad:', opened, '| BillUpload synlig:', bodyText.includes('Analysera din elräkning'));

  // Om komponenten inte är synlig, injicera BillUpload på sidan? Enklare: testa pdfToJpeg-modulen
  // direkt i webbläsaren via import från dev-servern (Next serverar inte ts direkt).
  // Fallback: vi verifierar via FA-sidan (redan gjort) + kompileringskoll. Här kollar vi att
  // accept-attributet på chat-input uppdaterats om komponenten syns.
  const fileInputs = page.locator('input[type="file"]');
  const count = await fileInputs.count();
  console.log('file-inputs på sidan:', count);
  for (let i = 0; i < count; i++) {
    const accept = await fileInputs.nth(i).getAttribute('accept');
    console.log(`  input ${i} accept:`, accept);
    if (accept && accept.includes('application/pdf')) {
      await fileInputs.nth(i).setInputFiles(pdfPath);
      console.log('  PDF uppladdad i input', i, '— väntar på konvertering…');
      await page.waitForTimeout(6000);
      const after = await fileInputs.nth(i).evaluate((el) => ({ files: el.files?.length }));
      console.log('  filer efter:', JSON.stringify(after));
    }
  }
  const body2 = await page.locator('body').innerText();
  if (body2.includes('Konverterar PDF')) console.log('OK: "Konverterar PDF" sågs');
  if (body2.includes('sidor konverterade')) console.log('OK: sidkonvertering visas');
  if (body2.includes('Kunde inte läsa PDF')) console.log('FAIL: PDF-konverteringsfel');

  await browser.close();
  process.exit(0);
})().catch((e) => { console.error('CRASH:', e); process.exit(1); });
