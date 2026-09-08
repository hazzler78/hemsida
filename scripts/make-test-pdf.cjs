// Skapar en test-PDF (elräkningsliknande) med pdf-lib
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function main() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595, 842]); // A4
  page.drawText('Elräkning - Testbolaget AB', { x: 50, y: 780, size: 18, font });
  page.drawText('Fast manadsavgift: 55,20 kr', { x: 50, y: 730, size: 12, font });
  page.drawText('Pasalagg: 13,80 kr', { x: 50, y: 710, size: 12, font });
  page.drawText('Elavtal arsavgift: 44,84 kr', { x: 50, y: 690, size: 12, font });
  page.drawText('Totalt att betala: 1 234,56 kr', { x: 50, y: 650, size: 14, font });
  page.drawRectangle({ x: 50, y: 600, width: 300, height: 1, color: rgb(0.8, 0.8, 0.8) });
  // sida 2 för att testa flersidig PDF
  const page2 = doc.addPage([595, 842]);
  page2.drawText('Specifikation sida 2', { x: 50, y: 780, size: 14, font });
  const bytes = await doc.save();
  const out = path.join(__dirname, 'test_faktura.pdf');
  fs.writeFileSync(out, bytes);
  console.log('skapa test PDF:', out, bytes.length, 'bytes');
}
main().catch(e => { console.error(e); process.exit(1); });
