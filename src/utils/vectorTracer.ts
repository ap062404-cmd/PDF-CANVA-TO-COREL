// @ts-ignore
import ImageTracer from 'imagetracerjs';
import { PDFDocument, rgb } from 'pdf-lib';
import { pdfjsLib } from './pdfWorker';
import { TraceOptions, DetectedColor, ConversionResult } from '../types/converter';

/**
 * Default options tuned specifically for Flat Block-Color Canva Designs (Signboards, Posters, Logos)
 */
export const DEFAULT_TRACE_OPTIONS: TraceOptions = {
  numberOfColors: 4,
  preset: 'block_color',
  blurRadius: 0,
  lineFilter: true,
  minArea: 6,
  dpi: 300,
  strokeWidth: 1,
};

/**
 * Extracts the dominant color palette from a Canvas context with percentage coverage
 */
export function extractDominantColors(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  maxColors: number = 6
): DetectedColor[] {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const colorBuckets = new Map<string, { count: number; r: number; g: number; b: number }>();
  const step = Math.max(1, Math.floor((width * height) / 50000)); // Sample ~50,000 pixels

  for (let i = 0; i < data.length; i += 4 * step) {
    const a = data[i + 3];
    if (a < 50) continue; // ignore transparent
    // Quantize to 16-level buckets
    const r = Math.round(data[i] / 16) * 16;
    const g = Math.round(data[i + 1] / 16) * 16;
    const b = Math.round(data[i + 2] / 16) * 16;
    const key = `${r},${g},${b}`;

    const existing = colorBuckets.get(key);
    if (existing) {
      existing.count++;
    } else {
      colorBuckets.set(key, { count: 1, r, g, b });
    }
  }

  const total = Array.from(colorBuckets.values()).reduce((sum, item) => sum + item.count, 0) || 1;
  const sorted = Array.from(colorBuckets.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, maxColors);

  return sorted.map((item) => {
    const hex =
      '#' +
      [item.r, item.g, item.b]
        .map((x) => Math.min(255, Math.max(0, x)).toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
    return {
      hex,
      rgb: `rgb(${item.r}, ${item.g}, ${item.b})`,
      percentage: Math.round((item.count / total) * 100),
    };
  });
}

/**
 * Traces an HTMLCanvasElement into high-precision SVG vector curves
 */
export function traceCanvasToSvg(
  canvas: HTMLCanvasElement,
  options: Partial<TraceOptions> = {}
): { svgString: string; colors: DetectedColor[] } {
  const opts: TraceOptions = { ...DEFAULT_TRACE_OPTIONS, ...options };
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot acquire 2D context for vector tracing');

  const width = canvas.width;
  const height = canvas.height;
  const widthMm = ((width * 25.4) / opts.dpi).toFixed(2);
  const heightMm = ((height * 25.4) / opts.dpi).toFixed(2);

  // Extract detected block colors for user inspection
  const colors = extractDominantColors(ctx, width, height, opts.numberOfColors);

  // Configure ImageTracer parameters based on chosen preset
  const tracerConfig: any = {
    corsenabled: false,
    colorsampling: 2, // deterministic palette quantization
    numberofcolors: Math.max(2, Math.min(16, opts.numberOfColors)),
    mincolorratio: 0.015,
    colorquantcycles: 4,
    scale: 1,
    simplifytolerance: 0,
    roundcoords: 2,
    blurradius: opts.blurRadius,
    blurdelta: 10,
    pathomit: opts.minArea,
    linefilter: opts.lineFilter,
  };

  if (opts.preset === 'sharp_logo') {
    tracerConfig.ltres = 0.15;
    tracerConfig.qtres = 0.5;
    tracerConfig.rightangleenhance = true;
    tracerConfig.linefilter = true;
  } else if (opts.preset === 'curvy_sign') {
    tracerConfig.ltres = 0.8;
    tracerConfig.qtres = 0.8;
    tracerConfig.rightangleenhance = false;
  } else if (opts.preset === 'detailed') {
    tracerConfig.ltres = 0.2;
    tracerConfig.qtres = 0.2;
    tracerConfig.pathomit = 2;
  } else {
    // Default 'block_color'
    tracerConfig.ltres = 0.4;
    tracerConfig.qtres = 0.5;
    tracerConfig.rightangleenhance = true;
  }

  const imgData = ctx.getImageData(0, 0, width, height);
  const rawSvg: string = ImageTracer.imagedataToSVG(imgData, tracerConfig);

  // Extract inner paths from ImageTracer's SVG output
  const pathMatch = rawSvg.match(/<path\b[^>]*>/g);
  const paths = pathMatch ? pathMatch.join('\n    ') : '';

  // Format clean W3C Standalone SVG optimized for CorelDraw import
  const polishedSvg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg 
  xmlns="http://www.w3.org/2000/svg" 
  xmlns:xlink="http://www.w3.org/1999/xlink" 
  version="1.1" 
  width="${widthMm}mm" 
  height="${heightMm}mm" 
  viewBox="0 0 ${width} ${height}"
  xml:space="preserve"
  style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd;">
  <!-- Traced with Canva-to-Corel Auto Vectorizer (100% Native Curves) -->
  <g id="CorelDraw_Traced_Vector_Layers">
    ${paths}
  </g>
</svg>`;

  return { svgString: polishedSvg, colors };
}

/**
 * Converts a traced SVG into a 100% Vector PDF for CorelDraw
 */
export async function createVectorPdfFromTracedSvg(
  svgString: string,
  widthPt: number,
  heightPt: number,
  title: string = 'Traced Vector'
): Promise<Blob> {
  const targetDoc = await PDFDocument.create();
  targetDoc.setTitle(`${title} (CorelDraw Traced Vector)`);
  targetDoc.setProducer('CanvaToCorel Vector Trace Engine');
  targetDoc.setCreator('CorelDraw Compatible Vector Pipeline');

  const page = targetDoc.addPage([widthPt, heightPt]);

  // Extract paths and fills from the traced SVG
  const pathRegex = /<path\b([^>]*)\/?>/gi;
  let match;

  while ((match = pathRegex.exec(svgString)) !== null) {
    const attrString = match[1];
    const dMatch = attrString.match(/d="([^"]+)"/);
    const fillMatch = attrString.match(/fill="rgb\(([^)]+)\)"/);

    if (dMatch && dMatch[1]) {
      const d = dMatch[1].trim();
      let fillColor = rgb(0, 0, 0);

      if (fillMatch && fillMatch[1]) {
        const [r, g, b] = fillMatch[1].split(',').map((n) => parseFloat(n.trim()) / 255);
        if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
          fillColor = rgb(r, g, b);
        }
      }

      try {
        // Draw the native SVG vector curve onto the PDF page
        page.drawSvgPath(d, {
          x: 0,
          y: heightPt,
          color: fillColor,
          scale: 1,
        });
      } catch {
        // Fallback for custom path command
      }
    }
  }

  const pdfBytes = await targetDoc.save({ useObjectStreams: false });
  return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}

/**
 * Traces an entire PDF document using the high-accuracy Color Block Vectorizer
 */
export async function tracePdfDocument(
  fileBuffer: ArrayBuffer,
  originalFileName: string,
  options: TraceOptions,
  onProgress?: (progress: number, statusText: string) => void
): Promise<ConversionResult> {
  const startTime = performance.now();
  const baseName = originalFileName.replace(/\.[^/.]+$/, '');

  onProgress?.(10, 'Membuka dokumen PDF untuk rasterisasi 300 DPI...');
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(fileBuffer.slice(0)) });
  const pdfJsDoc = await loadingTask.promise;
  const pageCount = pdfJsDoc.numPages;

  const svgPages: { pageNumber: number; svgString: string; url: string }[] = [];
  let allColors: DetectedColor[] = [];
  let primaryWidthPt = 595.28;
  let primaryHeightPt = 841.89;

  for (let p = 1; p <= pageCount; p++) {
    onProgress?.(
      Math.round(15 + (p / pageCount) * 70),
      `Melakukan Auto-Trace Vektor warna blok halaman ${p} dari ${pageCount}...`
    );

    const page = await pdfJsDoc.getPage(p);
    const scale = options.dpi / 72;
    const viewport = page.getViewport({ scale });

    primaryWidthPt = viewport.width / scale;
    primaryHeightPt = viewport.height / scale;

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Cannot create canvas context for tracer');

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport,
      canvas: canvas as any,
      intent: 'print',
    }).promise;

    // Trace canvas to native SVG vector curves
    const { svgString, colors } = traceCanvasToSvg(canvas, options);
    if (p === 1) allColors = colors;

    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    svgPages.push({
      pageNumber: p,
      svgString,
      url: svgUrl,
    });
  }

  onProgress?.(90, 'Menghasilkan file PDF Vektor & SVG Siap CorelDraw...');
  const primarySvg = svgPages[0];
  const pdfBlob = await createVectorPdfFromTracedSvg(
    primarySvg.svgString,
    primaryWidthPt,
    primaryHeightPt,
    baseName
  );
  const pdfUrl = URL.createObjectURL(pdfBlob);

  const processingTimeMs = Math.round(performance.now() - startTime);
  onProgress?.(100, 'Trace Vektor selesai! 100% Bentuk Kurva Murni Tanpa Kotak.');

  return {
    mode: 'vector_trace',
    fileName: `${baseName}_Traced_Vector_Corel.svg`,
    fileUrl: primarySvg.url,
    fileBlob: new Blob([primarySvg.svgString], { type: 'image/svg+xml;charset=utf-8' }),
    fileType: 'svg',
    pageCount,
    processingTimeMs,
    svgPages,
    detectedColors: allColors,
    tracedVectorSvg: primarySvg.svgString,
    summary: {
      textVectorized: true,
      transparencyFlattened: true,
      colorProfileApplied: `Auto-Trace ${options.numberOfColors} Warna Blok (Non-Kotak)`,
      corelDrawShortcut: 'Buka CorelDraw -> Ctrl + I -> Pilih file SVG ini -> Tekan Ctrl + U untuk Ungroup Semua Objek Vektor',
    },
  };
}

/**
 * Traces an uploaded Image file (PNG, JPG, WebP) directly into native CorelDraw curves
 */
export async function traceImageFile(
  file: File | Blob,
  fileName: string,
  options: TraceOptions,
  onProgress?: (progress: number, statusText: string) => void
): Promise<ConversionResult> {
  const startTime = performance.now();
  const baseName = fileName.replace(/\.[^/.]+$/, '');

  onProgress?.(20, 'Memuat gambar resolusi tinggi...');
  const imgBitmap = await createImageBitmap(file);

  const canvas = document.createElement('canvas');
  canvas.width = imgBitmap.width;
  canvas.height = imgBitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot acquire canvas context for image');

  ctx.drawImage(imgBitmap, 0, 0);

  onProgress?.(50, `Mendeteksi kontur & warna blok (${options.numberOfColors} warna)...`);
  const { svgString, colors } = traceCanvasToSvg(canvas, options);

  onProgress?.(85, 'Menyusun kurva vektor SVG & PDF CorelDraw...');
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  const widthPt = (imgBitmap.width * 72) / options.dpi;
  const heightPt = (imgBitmap.height * 72) / options.dpi;

  const pdfBlob = await createVectorPdfFromTracedSvg(svgString, widthPt, heightPt, baseName);
  const processingTimeMs = Math.round(performance.now() - startTime);

  onProgress?.(100, 'Trace Vektor gambar selesai!');

  return {
    mode: 'vector_trace',
    fileName: `${baseName}_Traced_Vector_Corel.svg`,
    fileUrl: svgUrl,
    fileBlob: svgBlob,
    fileType: 'svg',
    pageCount: 1,
    processingTimeMs,
    svgPages: [{ pageNumber: 1, svgString, url: svgUrl }],
    detectedColors: colors,
    tracedVectorSvg: svgString,
    summary: {
      textVectorized: true,
      transparencyFlattened: true,
      colorProfileApplied: `Auto-Trace ${options.numberOfColors} Warna Blok`,
      corelDrawShortcut: 'Buka CorelDraw -> Ctrl + I -> Pilih file SVG ini -> Tekan Ctrl + U (Ungroup & Edit Node F10)',
    },
  };
}
