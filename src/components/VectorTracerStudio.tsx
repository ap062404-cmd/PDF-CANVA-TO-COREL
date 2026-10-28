import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  UploadCloud, 
  Download, 
  Copy, 
  Check, 
  Layers, 
  Sliders, 
  Eye, 
  EyeOff, 
  FileCode,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TraceOptions, DetectedColor } from '../types/converter';
import { traceCanvasToSvg, createVectorPdfFromTracedSvg, extractDominantColors } from '../utils/vectorTracer';
import { generateSampleCanvaPdf } from '../utils/sampleGenerator';
import { pdfjsLib } from '../utils/pdfWorker';

export const VectorTracerStudio: React.FC = () => {
  const [sourceType, setSourceType] = useState<'sample' | 'upload' | null>('sample');
  const [originalImageUrl, setOriginalImageUrl] = useState<string>('');
  const [tracedSvgString, setTracedSvgString] = useState<string>('');
  const [detectedColors, setDetectedColors] = useState<DetectedColor[]>([]);
  const [isTracing, setIsTracing] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'traced' | 'original' | 'split'>('traced');
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('Rambu_Keluar_Canva');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [options, setOptions] = useState<TraceOptions>({
    numberOfColors: 4,
    preset: 'block_color',
    blurRadius: 0,
    lineFilter: true,
    minArea: 6,
    dpi: 300,
    strokeWidth: 1,
  });

  // Run the vector trace on a provided Canvas element
  const runTraceOnCanvas = (canvas: HTMLCanvasElement, currentOpts: TraceOptions) => {
    setIsTracing(true);
    try {
      const { svgString, colors } = traceCanvasToSvg(canvas, currentOpts);
      setTracedSvgString(svgString);
      setDetectedColors(colors);
    } catch (err) {
      console.error('Error during vector tracing:', err);
    } finally {
      setIsTracing(false);
    }
  };

  // Load and render sample Canva signage into canvas then trace
  const handleLoadSample = async () => {
    try {
      setIsTracing(true);
      setFileName('Rambu_Keluar_Canva_Sample');
      const { buffer } = await generateSampleCanvaPdf();

      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer.slice(0)) });
      const pdfJsDoc = await loadingTask.promise;
      const page = await pdfJsDoc.getPage(1);

      const scale = options.dpi / 72;
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: ctx,
        viewport,
        canvas: canvas as any,
        intent: 'print',
      }).promise;

      canvasRef.current = canvas;
      setOriginalImageUrl(canvas.toDataURL('image/png'));
      setSourceType('sample');

      runTraceOnCanvas(canvas, options);
    } catch (err) {
      console.error('Failed to load sample:', err);
    } finally {
      setIsTracing(false);
    }
  };

  // Handle uploaded file (PDF or Image PNG/JPG/WebP)
  const handleFileUpload = async (file: File) => {
    try {
      setIsTracing(true);
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      setFileName(baseName);
      setSourceType('upload');

      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const buffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer.slice(0)) });
        const pdfJsDoc = await loadingTask.promise;
        const page = await pdfJsDoc.getPage(1);

        const scale = options.dpi / 72;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvasContext: ctx,
          viewport,
          canvas: canvas as any,
          intent: 'print',
        }).promise;

        canvasRef.current = canvas;
        setOriginalImageUrl(canvas.toDataURL('image/png'));
        runTraceOnCanvas(canvas, options);
      } else {
        // Image file (PNG, JPG, WebP)
        const imgBitmap = await createImageBitmap(file);
        const canvas = document.createElement('canvas');
        canvas.width = imgBitmap.width;
        canvas.height = imgBitmap.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(imgBitmap, 0, 0);
        canvasRef.current = canvas;
        setOriginalImageUrl(canvas.toDataURL('image/png'));
        runTraceOnCanvas(canvas, options);
      }
    } catch (err) {
      console.error('Failed to process uploaded file for tracing:', err);
    } finally {
      setIsTracing(false);
    }
  };

  // Re-trace when user changes options
  const handleUpdateOption = (updated: Partial<TraceOptions>) => {
    const newOpts = { ...options, ...updated };
    setOptions(newOpts);
    if (canvasRef.current) {
      runTraceOnCanvas(canvasRef.current, newOpts);
    }
  };

  // Download SVG file
  const handleDownloadSvg = () => {
    if (!tracedSvgString) return;
    try {
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
    } catch {}

    const blob = new Blob([tracedSvgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}_Traced_Kurva_Corel.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download PDF file
  const handleDownloadPdf = async () => {
    if (!tracedSvgString || !canvasRef.current) return;
    try {
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
      const wPt = (canvasRef.current.width * 72) / options.dpi;
      const hPt = (canvasRef.current.height * 72) / options.dpi;
      const pdfBlob = await createVectorPdfFromTracedSvg(tracedSvgString, wPt, hPt, fileName);
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}_Traced_Vector_Corel.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export traced PDF:', err);
    }
  };

  // Copy SVG XML string to clipboard
  const handleCopySvg = () => {
    if (!tracedSvgString) return;
    navigator.clipboard.writeText(tracedSvgString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyColorHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1500);
  };

  // Auto load sample on first mount
  React.useEffect(() => {
    handleLoadSample();
  }, []);

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-950 border border-amber-500/30 rounded-xl p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1.5 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Studio Auto-Trace Vektor Warna Blok</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Konversi Gambar & PDF Flat Jadi Kurva Vektor Murni
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Mendeteksi warna blok (seperti plang biru rambu, panah, lingkaran, dan teks Canva), lalu men-trace konturnya menjadi <strong className="text-slate-200">100% kurva tertutup</strong>. Dijamin bebas dari kotak pembungkus dan garis bawah yang terpotong.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 text-white text-xs font-medium rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <UploadCloud className="w-4 h-4 text-amber-400" />
              <span>Unggah File (PDF / Gambar)</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/png,image/jpeg,image/webp"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              className="hidden"
            />

            <button
              onClick={handleLoadSample}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-sm shadow-amber-500/10"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Muat Contoh Rambu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Grid: Controls & Live Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Trace Controls */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Sliders className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">
                Pengaturan Trace Kontur Warna
              </h3>
            </div>

            {/* Number of Colors */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label className="font-medium text-slate-300">
                  Jumlah Warna Blok Dominan:
                </label>
                <span className="font-mono font-bold text-amber-400">
                  {options.numberOfColors} Warna
                </span>
              </div>
              <input
                type="range"
                min={2}
                max={12}
                step={1}
                value={options.numberOfColors}
                onChange={(e) => handleUpdateOption({ numberOfColors: parseInt(e.target.value) })}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                <span>2 (Monokrom)</span>
                <span>4 (Plang Rambu)</span>
                <span>8 (Poster)</span>
                <span>12</span>
              </div>
            </div>

            {/* Contour Style Preset */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Gaya Kontur Kurva
              </label>
              <select
                value={options.preset}
                onChange={(e) => handleUpdateOption({ preset: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="block_color">Warna Blok Rambu / Clipart (Standar)</option>
                <option value="curvy_sign">Kurva Halus (Lingkaran & Sudut Bulat)</option>
                <option value="sharp_logo">Sudut Tajam & Presisi (Logo / Teks)</option>
                <option value="detailed">Detail Mikro Maksimal</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Mengontrol toleransi sudut dan kehalusan Bézier spline.
              </p>
            </div>

            {/* Noise Speckle Filter */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Pembersihan Bintik / Noise Kecil
              </label>
              <select
                value={options.minArea}
                onChange={(e) => handleUpdateOption({ minArea: parseInt(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value={2}>Detail Penuh (Tanpa Filter)</option>
                <option value={6}>Rekomendasi (Abaikan partikel kecil)</option>
                <option value={12}>Kuat (Hapus bercak noise scan)</option>
              </select>
            </div>

            {/* Straight Line Enhancer */}
            <div className="pt-2 border-t border-slate-800">
              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.lineFilter}
                  onChange={(e) => handleUpdateOption({ lineFilter: e.target.checked })}
                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-400 bg-slate-950"
                />
                <span className="text-white font-medium">Pertegas Garis Lurus (Anti-Gelombang)</span>
              </label>
              <p className="text-[11px] text-slate-500 mt-1 ml-6">
                Menjaga garis bingkai kotak dan lis tetap lurus rata tanpa distorsi.
              </p>
            </div>

            {/* Detected Colors Palette Widget */}
            {detectedColors.length > 0 && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-300 block">
                  Warna Terdeteksi ({detectedColors.length}):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {detectedColors.map((c, i) => (
                    <div
                      key={i}
                      onClick={() => handleCopyColorHex(c.hex)}
                      className="flex items-center justify-between p-1.5 bg-slate-950 rounded border border-slate-800 hover:border-slate-700 text-[11px] cursor-pointer transition-colors"
                      title="Klik untuk menyalin kode warna"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-4 h-4 rounded border border-slate-700 shrink-0 shadow-sm"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span className="font-mono text-slate-300 truncate">{c.hex}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {copiedHex === c.hex ? '✓' : `${c.percentage}%`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Download Cards */}
          <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-5 space-y-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              Ekspor Hasil Trace untuk CorelDraw
            </span>

            <button
              onClick={handleDownloadSvg}
              disabled={isTracing || !tracedSvgString}
              className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-md shadow-amber-500/10 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Unduh SVG Kurva (Paling Direkomendasikan)</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isTracing || !tracedSvgString}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 font-semibold text-xs rounded-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Unduh PDF Vektor Kurva</span>
            </button>

            <button
              onClick={handleCopySvg}
              disabled={isTracing || !tracedSvgString}
              className="w-full py-2 px-3 bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-800 text-xs rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Kode SVG Tersalin!' : 'Salin Kode SVG Vektor'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Live Vector Preview */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-full min-h-[500px]">
            
            {/* Viewport Top Bar */}
            <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <FileCode className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-white truncate max-w-xs">
                  {fileName}
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-[11px] text-emerald-400 font-medium">
                  {isTracing ? 'Sedang men-trace kurva...' : '100% Kurva Vektor Aktif'}
                </span>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => setViewMode('traced')}
                  className={`px-3 py-1 rounded font-medium transition-colors ${
                    viewMode === 'traced'
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Hasil Vektor (Kurva)
                </button>
                <button
                  onClick={() => setViewMode('original')}
                  className={`px-3 py-1 rounded font-medium transition-colors ${
                    viewMode === 'original'
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Raster Asli
                </button>
              </div>
            </div>

            {/* Canvas Display Viewport */}
            <div className="flex-1 p-6 flex items-center justify-center bg-slate-950/60 overflow-auto relative">
              {isTracing ? (
                <div className="text-center space-y-3">
                  <div className="w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-300 font-medium">
                    Menganalisis warna blok dan merekonstruksi kurva Bézier...
                  </p>
                </div>
              ) : viewMode === 'traced' && tracedSvgString ? (
                <div
                  className="max-w-full max-h-[580px] shadow-2xl rounded border border-slate-800 bg-white"
                  dangerouslySetInnerHTML={{ __html: tracedSvgString }}
                />
              ) : originalImageUrl ? (
                <img
                  src={originalImageUrl}
                  alt="Original raster"
                  className="max-w-full max-h-[580px] object-contain shadow-2xl rounded border border-slate-800"
                />
              ) : (
                <div className="text-center text-slate-500 text-xs">
                  Tidak ada gambar aktif. Unggah file untuk memulai.
                </div>
              )}
            </div>

            {/* Bottom Info Banner */}
            <div className="px-4 py-3 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Bebas PowerClip & Kotak: Diimpor sebagai objek kurva asli di CorelDraw.</span>
              </div>
              <span className="font-mono text-slate-500">
                Tekan Ctrl + U di Corel untuk Ungroup
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
