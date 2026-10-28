import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Eye, ChevronLeft, ChevronRight, FileCheck } from 'lucide-react';
import { PdfAnalysis } from '../types/converter';

interface DocumentPreviewProps {
  previewUrl: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  analysis?: PdfAnalysis | null;
  title?: string;
  isConverted?: boolean;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  previewUrl,
  currentPage,
  totalPages,
  onPageChange,
  analysis,
  title = 'Pratinjau Dokumen',
  isConverted = false,
}) => {
  const [zoom, setZoom] = useState<number>(100);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleZoomReset = () => setZoom(100);

  const currentPageData = analysis?.pages.find((p) => p.pageNumber === currentPage);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
      {/* Top Toolbar */}
      <div className="px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
            {isConverted ? (
              <FileCheck className="w-4 h-4 text-emerald-400" />
            ) : (
              <Eye className="w-4 h-4 text-amber-400" />
            )}
            <span>{title}</span>
          </div>

          {currentPageData && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {currentPageData.widthMm} × {currentPageData.heightMm} mm
              </span>
              <span aria-hidden="true">·</span>
              <span>{currentPageData.detectedPreset || 'Ukuran Khusus'}</span>
            </div>
          )}
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900 rounded-lg border border-slate-800 p-0.5 text-xs text-slate-400">
            <button
              onClick={handleZoomOut}
              className="p-1 hover:text-white transition-colors cursor-pointer"
              title="Perkecil (-25%)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomReset}
              className="px-2 py-0.5 text-[11px] font-mono hover:text-white transition-colors cursor-pointer"
              title="Reset Zoom (100%)"
            >
              {zoom}%
            </button>
            <button
              onClick={handleZoomIn}
              className="p-1 hover:text-white transition-colors cursor-pointer"
              title="Perbesar (+25%)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1 pl-2 border-l border-slate-800 text-xs">
              <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:text-white cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 font-mono text-slate-400 text-[11px]">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
                className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:text-white cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="p-6 bg-slate-950 flex items-center justify-center min-h-[380px] max-h-[560px] overflow-auto">
        <div
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }}
          className="transition-transform duration-150 flex items-center justify-center shadow-2xl rounded border border-slate-800 bg-white"
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={`Halaman ${currentPage}`}
              className="max-h-[460px] w-auto object-contain select-none block"
            />
          ) : (
            <div className="w-[320px] h-[450px] flex items-center justify-center text-slate-400 text-xs">
              Memuat pratinjau...
            </div>
          )}
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-900/50 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Pratinjau Vektor Siap Cetak (300 DPI Rendering)</span>
        </div>
        <div>
          <span>Garis & bentuk tepi bawah terlindungi dari pemotongan</span>
        </div>
      </div>
    </div>
  );
};
