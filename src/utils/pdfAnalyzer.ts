import { PDFDocument } from 'pdf-lib';
import { pdfjsLib } from './pdfWorker';
import { PdfAnalysis, PdfFontInfo, PdfPageDimension } from '../types/converter';

// Convert points (72 DPI) to millimeters (25.4 mm / inch)
export function ptToMm(pt: number): number {
  return Math.round((pt * 25.4 / 72) * 10) / 10;
}

// Identify common standard paper / graphic presets
export function detectPreset(widthMm: number, heightMm: number): string | undefined {
  const w = Math.min(widthMm, heightMm);
  const h = Math.max(widthMm, heightMm);
  
  if (Math.abs(w - 210) < 3 && Math.abs(h - 297) < 3) return 'A4 (210 × 297 mm)';
  if (Math.abs(w - 148) < 3 && Math.abs(h - 210) < 3) return 'A5 (148 × 210 mm)';
  if (Math.abs(w - 297) < 3 && Math.abs(h - 420) < 3) return 'A3 (297 × 420 mm)';
  if (Math.abs(w - 320) < 5 && Math.abs(h - 480) < 5) return 'A3+ Digital Print';
  if (Math.abs(w - 215.9) < 3 && Math.abs(h - 279.4) < 3) return 'Letter / Kuarto';
  if (Math.abs(w - 215.9) < 3 && Math.abs(h - 330.2) < 3) return 'F4 / Folio';
  if (Math.abs(w - 54) < 3 && Math.abs(h - 86) < 3) return 'Kartu Nama / ID Card';
  if (Math.abs(w - h) < 2) return `Persegi / Square (${Math.round(w)} mm)`;
  if (w > 500 || h > 1000) return `Spanduk / Banner (${Math.round(w)} × ${Math.round(h)} mm)`;
  return undefined;
}

export async function analyzePdf(fileBuffer: ArrayBuffer, fileName: string): Promise<PdfAnalysis> {
  // Clone slices so the parent buffer is never detached by Web Worker transfer
  const pdfDoc = await PDFDocument.load(fileBuffer.slice(0), { ignoreEncryption: true });
  const pageCount = pdfDoc.getPageCount();
  
  // Extract Metadata via pdf-lib
  const title = pdfDoc.getTitle() || '';
  const author = pdfDoc.getAuthor() || '';
  const producer = pdfDoc.getProducer() || '';
  const creator = pdfDoc.getCreator() || '';
  
  const isCanvaGenerated = 
    producer.toLowerCase().includes('canva') || 
    creator.toLowerCase().includes('canva') ||
    title.toLowerCase().includes('canva') ||
    author.toLowerCase().includes('canva');

  // Load via pdfjs with an isolated slice for deep font and operator inspection
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(fileBuffer.slice(0)) });
  const pdfJsDoc = await loadingTask.promise;
  
  const pages: PdfPageDimension[] = [];
  const fontsMap = new Map<string, PdfFontInfo>();
  let hasTransparency = false;
  let hasClippingMasks = false;

  for (let i = 1; i <= Math.min(pageCount, 10); i++) {
    const page = await pdfJsDoc.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    const widthPt = viewport.width;
    const heightPt = viewport.height;
    const widthMm = ptToMm(widthPt);
    const heightMm = ptToMm(heightPt);

    pages.push({
      pageNumber: i,
      widthPt,
      heightPt,
      widthMm,
      heightMm,
      aspectRatio: `${Math.round(widthPt)}:${Math.round(heightPt)}`,
      detectedPreset: detectPreset(widthMm, heightMm),
    });

    try {
      const operatorList = await page.getOperatorList();
      // Inspect PDF operators: 
      // fnArray contains operator codes. Check for clipping (clip / eoClip) and transparency (setGState)
      for (let j = 0; j < operatorList.fnArray.length; j++) {
        const op = operatorList.fnArray[j];
        // 20 = clip, 21 = eoClip, 19 = setGState
        if (op === 20 || op === 21) {
          hasClippingMasks = true;
        }
        if (op === 19) {
          hasTransparency = true;
        }
      }

      // Check common font objects
      const commonObjs = (page as unknown as { commonObjs?: { _objs?: Record<string, unknown> } }).commonObjs;
      if (commonObjs && commonObjs._objs) {
        Object.keys(commonObjs._objs).forEach((key) => {
          const obj = commonObjs._objs![key] as { name?: string; loadedName?: string; type?: string };
          if (obj && (obj.name || obj.loadedName)) {
            const fontName = obj.loadedName || obj.name || key;
            const isSubset = fontName.includes('+') || fontName.length > 7 && fontName.slice(6, 7) === '+';
            if (!fontsMap.has(fontName)) {
              fontsMap.set(fontName, {
                name: fontName,
                isEmbedded: true,
                isSubset,
                type: obj.type || 'CIDFont/TrueType',
              });
            }
          }
        });
      }
    } catch {
      // Continue even if deep operator inspection encounters non-standard stream
    }
  }

  const fonts = Array.from(fontsMap.values());
  const riskReasons: string[] = [];
  let riskScore: 'low' | 'medium' | 'high' = 'low';

  if (isCanvaGenerated) {
    riskReasons.push('File dideteksi berasal dari Canva (struktur teks dan layer Canva rentan pecah di CorelDraw)');
    riskScore = 'high';
  }

  if (fonts.length > 0) {
    const subsetCount = fonts.filter(f => f.isSubset).length;
    if (subsetCount > 0) {
      riskReasons.push(`${subsetCount} Font subset/CID terdeteksi. CorelDraw akan memicu dialog "Font Missing" dan mengganti jenis huruf otomatis sehingga spasi dan baris teks berantakan.`);
      riskScore = 'high';
    } else {
      riskReasons.push(`${fonts.length} Font tersemat dalam file.`);
      if (riskScore !== 'high') riskScore = 'medium';
    }
  } else {
    // Even if font map is clean, Canva often encodes text in stream operators
    if (isCanvaGenerated) {
      riskReasons.push('Teks Canva tersimpan dalam CID encoding yang belum di-convert ke Curves/Outlines.');
    }
  }

  if (hasClippingMasks) {
    riskReasons.push('Clipping mask / frame Canva terdeteksi. CorelDraw akan mengonversi ini menjadi PowerClip bersarang yang sering geser posisinya.');
    if (riskScore !== 'high') riskScore = 'high';
  }

  if (hasTransparency) {
    riskReasons.push('Efek transparansi / drop shadow Canva terdeteksi (PDF 1.7). CorelDraw versi lama rentan memunculkan kotak hitam (black box bug).');
    if (riskScore !== 'high') riskScore = 'high';
  }

  if (riskReasons.length === 0) {
    riskReasons.push('Struktur PDF relatif standar dan bersih.');
    riskScore = 'low';
  }

  let recommendation = '';
  if (riskScore === 'high') {
    recommendation = 'Gunakan Mode "Convert to Curves / Vector Outlines" atau "CorelDraw SVG Vector" agar semua font menjadi kurva vektor absolut, 100% bebas font hilang & tidak bergeser.';
  } else if (riskScore === 'medium') {
    recommendation = 'Gunakan Mode "PDF/X-1a Print Ready" untuk menormalkan transparansi dan palet warna ke CMYK.';
  } else {
    recommendation = 'File siap diimpor ke CorelDraw. Anda dapat mengoptimalkan palet CMYK K100.';
  }

  try {
    await pdfJsDoc.cleanup();
    await loadingTask.destroy();
  } catch {
    // Ignore cleanup errors
  }

  return {
    fileName,
    fileSizeBytes: fileBuffer.byteLength,
    pageCount,
    isCanvaGenerated,
    producer: producer || 'Tidak tertera',
    creator: creator || 'Tidak tertera',
    pdfVersion: 'PDF 1.4 - 1.7',
    pages,
    fonts,
    riskScore,
    riskReasons,
    recommendation,
    hasTransparency,
    hasClippingMasks,
  };
}
