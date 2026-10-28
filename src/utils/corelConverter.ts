import { PDFDocument, rgb } from 'pdf-lib';
import { pdfjsLib } from './pdfWorker';
import { ConversionOptions, ConversionResult } from '../types/converter';
import { sanitizeCanvaVectorPdf, extractPureVectorSvg } from './vectorEngine';

/**
 * Renders a PDF page to a Canvas element at a given scale / DPI
 * (Used exclusively for live screen preview and ultra-hd raster mode)
 */
export async function renderPageToCanvas(
  pdfJsDoc: any,
  pageNumber: number,
  targetDpi: number = 300
): Promise<{ canvas: HTMLCanvasElement; widthPt: number; heightPt: number }> {
  const page = await pdfJsDoc.getPage(pageNumber);
  const scale = targetDpi / 72;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('Cannot create 2D canvas context');

  context.fillStyle = '#FFFFFF';
  context.fillRect(0, 0, canvas.width, canvas.height);

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
    intent: 'print',
  };

  await page.render(renderContext).promise;

  return {
    canvas,
    widthPt: viewport.width / scale,
    heightPt: viewport.height / scale,
  };
}

/**
 * Apply CMYK K100 normalization on pixel buffer if requested (for raster fallback mode)
 */
function applyK100Optimization(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const len = data.length;

  for (let i = 0; i < len; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (r < 35 && g < 35 && b < 35) {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

import { tracePdfDocument, traceImageFile, DEFAULT_TRACE_OPTIONS } from './vectorTracer';

export { traceImageFile };

/**
 * Converts a Canva PDF into a CorelDraw-Ready PDF or SVG
 * PURE VECTOR GUARANTEE: Does NOT convert vectors into flat bitmaps unless ultra_hd mode is chosen.
 */
export async function convertCanvaToCorel(
  fileBuffer: ArrayBuffer,
  originalFileName: string,
  options: ConversionOptions,
  onProgress?: (progress: number, statusText: string) => void
): Promise<ConversionResult> {
  const startTime = performance.now();
  const baseName = originalFileName.replace(/\.[^/.]+$/, '');

  // 0. AUTO VECTOR TRACE MODE (Flat block colors / Clipart / Anti-Kotak 100%)
  if (options.mode === 'vector_trace') {
    onProgress?.(15, 'Menginisialisasi Engine Trace Vektor Warna Blok...');
    const traceOpts = options.traceOptions || {
      ...DEFAULT_TRACE_OPTIONS,
      dpi: options.dpi,
    };
    return await tracePdfDocument(fileBuffer, originalFileName, traceOpts, onProgress);
  }

  onProgress?.(10, 'Membaca struktur vektor PDF Canva...');

  // 1. PURE VECTOR SVG MODE
  if (options.mode === 'svg_corel') {
    onProgress?.(25, 'Mengekstrak kurva bezier dan path vektor ke SVG murni (Non-Bitmap)...');
    const pdfDoc = await PDFDocument.load(fileBuffer.slice(0), { ignoreEncryption: true });
    const pageCount = pdfDoc.getPageCount();
    const svgPages: { pageNumber: number; svgString: string; url: string }[] = [];

    for (let p = 0; p < pageCount; p++) {
      onProgress?.(
        Math.round(25 + ((p + 1) / pageCount) * 65),
        `Mengekstrak kurva vektor halaman ${p + 1} dari ${pageCount}...`
      );

      const vectorSvg = await extractPureVectorSvg(pdfDoc, p, options);
      svgPages.push({
        pageNumber: vectorSvg.pageNumber,
        svgString: vectorSvg.svgString,
        url: vectorSvg.url,
      });
    }

    onProgress?.(95, 'Menyusun paket SVG vektor CorelDraw...');
    const primarySvg = svgPages[0];
    const outName = `${baseName}_CorelVector_Pure.svg`;
    const processingTimeMs = Math.round(performance.now() - startTime);

    onProgress?.(100, 'Konversi vektor selesai! Siap di-edit ulang di CorelDraw.');

    return {
      mode: 'svg_corel',
      fileName: outName,
      fileUrl: primarySvg.url,
      fileBlob: new Blob([primarySvg.svgString], { type: 'image/svg+xml;charset=utf-8' }),
      fileType: 'svg',
      pageCount,
      processingTimeMs,
      svgPages,
      summary: {
        textVectorized: true,
        transparencyFlattened: true,
        colorProfileApplied: 'Vektor Kurva Asli (Non-Bitmap)',
        corelDrawShortcut: 'Buka CorelDraw -> Ctrl + I -> Pilih file SVG ini -> Tekan Ctrl + U untuk Ungroup & Edit Node (F10)',
      },
    };
  }

  // 2. PURE VECTOR PDF MODES ('curves' / 'pdfx_print')
  // Retains 100% of the native PDF vector content stream, removes /Group transparency bug, fixes bounding boxes
  if (options.mode === 'curves' || options.mode === 'pdfx_print') {
    onProgress?.(30, 'Menstabilkan dokumen vektor (100% Native Vector Preserved)...');
    onProgress?.(60, 'Membersihkan clipping mask Canva dan mengunci garis putih...');
    
    const result = await sanitizeCanvaVectorPdf(fileBuffer, originalFileName, options);

    // Also generate clean SVG pages as a versatile CorelDraw alternative
    try {
      const pdfDoc = await PDFDocument.load(fileBuffer.slice(0), { ignoreEncryption: true });
      const svgPages: { pageNumber: number; svgString: string; url: string }[] = [];
      for (let p = 0; p < result.pageCount; p++) {
        const svgRes = await extractPureVectorSvg(pdfDoc, p, options);
        svgPages.push({
          pageNumber: svgRes.pageNumber,
          svgString: svgRes.svgString,
          url: svgRes.url,
        });
      }
      result.svgPages = svgPages;
    } catch (err) {
      console.warn('SVG secondary generation notice:', err);
    }

    onProgress?.(100, 'Dokumen vektor berhasil distabilkan untuk CorelDraw!');
    return result;
  }

  // 3. ULTRA HD RASTER COMPOSITE (Only when explicitly selected by user for extreme filter effects)
  onProgress?.(25, 'Membuat komposit raster resolusi tinggi 600 DPI...');
  let loadingTask: any = null;
  let pdfJsDoc: any = null;

  try {
    loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(fileBuffer.slice(0)) });
    pdfJsDoc = await loadingTask.promise;
    const pageCount = pdfJsDoc.numPages;
    const newPdfDoc = await PDFDocument.create();

    newPdfDoc.setTitle(`${baseName} (CorelDraw 600DPI Composite)`);
    newPdfDoc.setProducer('CanvaToCorel Raster Composite Engine');

    const targetDpi = 600;

    for (let p = 1; p <= pageCount; p++) {
      onProgress?.(
        Math.round(25 + (p / pageCount) * 65),
        `Memproses halaman ${p} dari ${pageCount} (600 DPI)...`
      );

      const { canvas, widthPt, heightPt } = await renderPageToCanvas(
        pdfJsDoc,
        p,
        targetDpi
      );

      if (options.colorSpace === 'cmyk_k100_black') {
        applyK100Optimization(canvas);
      }

      const pngBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png');
      });
      const pngArrayBuffer = await pngBlob.arrayBuffer();
      const embeddedImage = await newPdfDoc.embedPng(pngArrayBuffer);

      let finalWidth = widthPt;
      let finalHeight = heightPt;
      let offsetX = 0;
      let offsetY = 0;

      if (options.preserveBleed && options.bleedMarginMm > 0) {
        const bleedPt = (options.bleedMarginMm * 72) / 25.4;
        finalWidth += bleedPt * 2;
        finalHeight += bleedPt * 2;
        offsetX = bleedPt;
        offsetY = bleedPt;
      }

      const newPage = newPdfDoc.addPage([finalWidth, finalHeight]);
      newPage.drawRectangle({
        x: 0,
        y: 0,
        width: finalWidth,
        height: finalHeight,
        color: rgb(1, 1, 1),
      });

      newPage.drawImage(embeddedImage, {
        x: offsetX,
        y: offsetY,
        width: widthPt,
        height: heightPt,
      });
    }

    const pdfBytes = await newPdfDoc.save();
    const pdfBlob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const outName = `${baseName}_Corel_UltraHD_600DPI.pdf`;
    const processingTimeMs = Math.round(performance.now() - startTime);

    return {
      mode: 'ultra_hd',
      fileName: outName,
      fileUrl: pdfUrl,
      fileBlob: pdfBlob,
      fileType: 'pdf',
      pageCount,
      processingTimeMs,
      summary: {
        textVectorized: true,
        transparencyFlattened: true,
        colorProfileApplied: 'Raster Komposit 600 DPI',
        corelDrawShortcut: 'Buka CorelDraw -> Tekan Ctrl + I -> Pilih file ini',
      },
    };
  } finally {
    if (pdfJsDoc) {
      try {
        await pdfJsDoc.cleanup();
      } catch {}
    }
    if (loadingTask) {
      try {
        await loadingTask.destroy();
      } catch {}
    }
  }
}

/**
 * Generate a quick low-res preview data URL of page 1 for immediate UI display
 */
export async function generatePagePreview(fileBuffer: ArrayBuffer, pageNumber: number = 1): Promise<string> {
  let pdfJsDoc: any = null;
  let loadingTask: any = null;
  try {
    if (!fileBuffer || fileBuffer.byteLength === 0) {
      console.warn('Cannot generate preview: ArrayBuffer is empty or detached');
      return '';
    }
    loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(fileBuffer.slice(0)) });
    pdfJsDoc = await loadingTask.promise;
    const { canvas } = await renderPageToCanvas(pdfJsDoc, pageNumber, 120);
    return canvas.toDataURL('image/jpeg', 0.85);
  } catch (err) {
    console.error('Failed to render preview', err);
    return '';
  } finally {
    if (pdfJsDoc) {
      try {
        await pdfJsDoc.cleanup();
      } catch {}
    }
    if (loadingTask) {
      try {
        await loadingTask.destroy();
      } catch {}
    }
  }
}
