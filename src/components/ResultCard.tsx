import React, { useState } from 'react';
import { ConversionResult } from '../types/converter';
import { Download, CheckCircle, Copy, Check, FileDown, Sparkles, ExternalLink, FileCode } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ResultCardProps {
  result: ConversionResult;
  onReset: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result, onReset }) => {
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // Confetti fallback
    }

    const a = document.createElement('a');
    a.href = result.fileUrl;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadSvgPage = (url: string, pageNum: number) => {
    const a = document.createElement('a');
    a.href = url;
    const base = result.fileName.replace('.svg', '');
    a.download = `${base}_Halaman_${pageNum}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyShortcut = () => {
    navigator.clipboard.writeText('Ctrl + I lalu pilih Import text as: Curves');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-5 sm:p-6 space-y-5 shadow-lg shadow-emerald-500/5">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Dokumen Berhasil Dikonversi & Siap Impor!
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Diproses dalam <span className="font-mono tabular-nums text-slate-200">{result.processingTimeMs} ms</span> untuk {result.pageCount} halaman
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors"
          >
            Konversi File Lain
          </button>
        </div>
      </div>

      {/* Main Download CTA */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileDown className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold text-white truncate max-w-sm">
              {result.fileName}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Format: <span className="font-mono uppercase text-slate-200 font-semibold">{result.fileType}</span> · 100% Kurva Vektor Murni · Bebas Kotak & PowerClip · Garis Utuh
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
          {result.fileType === 'svg' ? (
            <>
              <button
                onClick={handleDownload}
                className="w-full sm:w-auto px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 active:scale-[0.98] transition-all whitespace-nowrap cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Unduh SVG Kurva (Rekomendasi Corel)</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleDownload}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all whitespace-nowrap cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Unduh PDF Siap Corel</span>
              </button>

              {result.svgPages && result.svgPages[0] && (
                <button
                  onClick={() => handleDownloadSvgPage(result.svgPages![0].url, 1)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/40 hover:border-amber-400 font-semibold text-xs rounded-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all whitespace-nowrap cursor-pointer"
                  title="Unduh format SVG kurva murni sebagai alternatif cepat tanpa dialog PDF"
                >
                  <FileCode className="w-4 h-4 text-amber-400" />
                  <span>Unduh Format SVG</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Detected Block Color Palette (For Vector Trace Mode) */}
      {result.detectedColors && result.detectedColors.length > 0 && (
        <div className="p-3.5 bg-slate-950/80 rounded-lg border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Palet Warna Blok yang Berhasil Di-Trace:</span>
            </span>
            <span className="text-[11px] text-slate-400">
              {result.detectedColors.length} Lapisan Vektor Terpisah
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {result.detectedColors.map((c, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs"
              >
                <span
                  className="w-4 h-4 rounded border border-slate-700 shadow-sm"
                  style={{ backgroundColor: c.hex }}
                />
                <span className="font-mono text-slate-200 text-[11px] font-semibold">{c.hex}</span>
                <span className="text-[10px] text-slate-500 font-medium">({c.percentage}%)</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 italic">
            Setiap blok warna diimpor sebagai objek vektor mandiri di CorelDraw. Tekan <kbd className="font-mono text-amber-300">Ctrl + U</kbd> untuk memisahkan dan mengedit nodenya dengan tombol <kbd className="font-mono text-amber-300">F10</kbd>.
          </p>
        </div>
      )}

      {/* Individual SVG Pages if multiple */}
      {result.svgPages && result.svgPages.length > 1 && (
        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-2">
          <span className="text-xs font-semibold text-slate-300 block">
            Unduh Halaman Tertentu (.SVG):
          </span>
          <div className="flex flex-wrap gap-2">
            {result.svgPages.map((pg) => (
              <button
                key={pg.pageNumber}
                onClick={() => handleDownloadSvgPage(pg.url, pg.pageNumber)}
                className="px-2.5 py-1 text-xs bg-slate-900 border border-slate-700 hover:border-amber-400 text-slate-300 hover:text-white rounded flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3 h-3 text-amber-400" />
                <span>Halaman {pg.pageNumber}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Summary of what was stabilized */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-lg">
          <span className="text-slate-400 block mb-0.5">Struktur Desain:</span>
          <span className="font-semibold text-emerald-400 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            100% Vektor Kurva Murni
          </span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-lg">
          <span className="text-slate-400 block mb-0.5">Bentuk Lingkaran & Panah:</span>
          <span className="font-semibold text-emerald-400 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            Bebas Kotak (Presisi Asli)
          </span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-lg">
          <span className="text-slate-400 block mb-0.5">Optimasi Warna / Edit:</span>
          <span className="font-semibold text-slate-200 truncate">
            {result.summary.colorProfileApplied}
          </span>
        </div>
      </div>

      {/* Quick Corel Tip */}
      <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 text-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-slate-300">
            Cara cepat di CorelDraw: Tekan <kbd className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">Ctrl + I</kbd> lalu pilih <strong className="text-white">"Import text as: Curves"</strong>
          </span>
        </div>

        <button
          onClick={handleCopyShortcut}
          className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] underline underline-offset-2 transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Tersalin' : 'Salin Instruksi'}</span>
        </button>
      </div>
    </div>
  );
};
