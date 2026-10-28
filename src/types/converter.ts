export type ConversionMode = 
  | 'vector_trace'// Auto Trace Vektor Warna Blok (Clipart & Flat Color Vectorizer) - Anti-Kotak 100%
  | 'curves'      // Native Vector PDF Presisi (Outline text & locked strokes)
  | 'svg_corel'   // Clean standalone SVG formatted specifically for CorelDraw Ctrl+I
  | 'pdfx_print'  // PDF/X-1a prepress CMYK K100 + linear xref
  | 'ultra_hd';   // 600 DPI raster composite for complex blend modes

export type ColorSpaceMode = 'keep_rgb' | 'cmyk_standard' | 'cmyk_k100_black';

export type CorelVersion = 'x7_x8' | '2019_2021' | '2022_2024' | 'legacy';

export interface TraceOptions {
  numberOfColors: number;       // 2 - 16 dominant block colors
  preset: 'block_color' | 'sharp_logo' | 'curvy_sign' | 'detailed';
  blurRadius: number;           // 0 for ultra-sharp, 1-2 for antialiasing noise removal
  lineFilter: boolean;          // sharpen straight edges
  minArea: number;              // noise speckle filter
  dpi: 300 | 450 | 600;
  strokeWidth: number;
}

export interface DetectedColor {
  hex: string;
  rgb: string;
  percentage: number;
}

export interface ConversionOptions {
  mode: ConversionMode;
  targetCorelVersion: CorelVersion;
  colorSpace: ColorSpaceMode;
  flattenPowerClips: boolean;       // Unrestricts Canva's tight root clipping mask to prevent bottom cut-off
  lockWhiteLines: boolean;          // Converts strokes to closed vector polygons to permanently preserve line thickness
  removeTransparencyGroups: boolean;// Removes /Group << /S /Transparency >> to prevent Corel flattening to flat bitmap
  preciseMediaBox: boolean;         // Synchronizes MediaBox, CropBox, BleedBox & TrimBox to [0, 0, W, H]
  dpi: 300 | 450 | 600;
  preserveBleed: boolean;
  bleedMarginMm: number;
  traceOptions?: TraceOptions;
}

export interface PdfFontInfo {
  name: string;
  isEmbedded: boolean;
  isSubset: boolean;
  type: string;
}

export interface PdfPageDimension {
  pageNumber: number;
  widthPt: number;
  heightPt: number;
  widthMm: number;
  heightMm: number;
  aspectRatio: string;
  detectedPreset?: string;
}

export interface PdfAnalysis {
  fileName: string;
  fileSizeBytes: number;
  pageCount: number;
  isCanvaGenerated: boolean;
  producer: string;
  creator: string;
  pdfVersion: string;
  pages: PdfPageDimension[];
  fonts: PdfFontInfo[];
  riskScore: 'low' | 'medium' | 'high';
  riskReasons: string[];
  recommendation: string;
  hasTransparency: boolean;
  hasClippingMasks: boolean;
}

export interface ConversionResult {
  mode: ConversionMode;
  fileName: string;
  fileUrl: string;
  fileBlob: Blob;
  fileType: 'pdf' | 'svg' | 'zip';
  pageCount: number;
  processingTimeMs: number;
  svgPages?: { pageNumber: number; svgString: string; url: string }[];
  detectedColors?: DetectedColor[];
  tracedVectorSvg?: string;
  summary: {
    textVectorized: boolean;
    transparencyFlattened: boolean;
    colorProfileApplied: string;
    corelDrawShortcut: string;
  };
}
