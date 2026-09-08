'use client';

/**
 * Konverterar en PDF (elräkning) till en JPEG-blob i webbläsaren med pdf.js.
 * Används före uppladdning till /api/gpt-ocr (som bara tar bilder).
 *
 * Worker-filen ligger i /public/pdf/pdf.worker.min.mjs och matchar pdfjs-dist-versionen
 * i package.json — om du uppgraderar pdfjs-dist, kopiera om worker-filen:
 *   cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf/pdf.worker.min.mjs
 */

let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null;

async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist').then((mod) => {
      // Worker måste sättas en gång innan getDocument anropas
      mod.GlobalWorkerOptions.workerSrc = '/pdf/pdf.worker.min.mjs';
      return mod;
    });
  }
  return pdfjsPromise;
}

export interface PdfToJpegResult {
  file: File;
  pageCount: number;
  pagesRendered: number;
}

/**
 * Renderar PDF:ns sidor till en enda hög JPEG (sidorna staplade lodrätt).
 * @param file PDF-fil
 * @param maxPages Högst antal sidor som renderas (standard 3)
 * @param scale Upplösningsskala (2 = ~A4 1190×1684 px per sida)
 */
export async function pdfToJpeg(
  file: File,
  maxPages = 3,
  scale = 2,
): Promise<PdfToJpegResult> {
  const pdfjs = await getPdfjs();
  const arrayBuffer = await file.arrayBuffer();

  const pdf = await pdfjs.getDocument({
    data: arrayBuffer,
    // Rendera inte onödigt: bara sidor vi faktiskt använder
  }).promise;

  const pageCount = pdf.numPages;
  const pagesRendered = Math.min(pageCount, maxPages);
  if (pagesRendered < 1) {
    throw new Error('PDF:en innehöll inga sidor.');
  }

  // Rendera varje sida till canvas och mät total höjd
  const canvases: HTMLCanvasElement[] = [];
  let maxWidth = 0;
  let totalHeight = 0;

  for (let i = 1; i <= pagesRendered; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Kunde inte skapa canvas för PDF-konvertering.');
    // Vit bakgrund (PDF-sidor kan vara transparenta)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    canvases.push(canvas);
    maxWidth = Math.max(maxWidth, canvas.width);
    totalHeight += canvas.height;
    page.cleanup();
  }

  await pdf.destroy();

  // Kombinera sidorna lodrätt i en gemensam canvas
  const combined = document.createElement('canvas');
  combined.width = maxWidth;
  combined.height = totalHeight;
  const ctx = combined.getContext('2d');
  if (!ctx) throw new Error('Kunde inte skapa canvas för PDF-konvertering.');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, combined.width, combined.height);
  let y = 0;
  for (const c of canvases) {
    ctx.drawImage(c, 0, y);
    y += c.height;
  }

  // JPEG-blob → File (behåll basnamnet från PDF:en)
  const blob = await new Promise<Blob | null>((resolve) =>
    combined.toBlob(resolve, 'image/jpeg', 0.92),
  );
  if (!blob) throw new Error('Kunde inte konvertera PDF:en till JPEG.');

  const baseName = file.name.replace(/\.pdf$/i, '');
  const jpegFile = new File([blob], `${baseName}.jpg`, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });

  return { file: jpegFile, pageCount, pagesRendered };
}

/** True om filen är en PDF. */
export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
}
