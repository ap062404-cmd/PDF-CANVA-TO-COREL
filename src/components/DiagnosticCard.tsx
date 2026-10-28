import React from 'react';
import { PdfAnalysis } from '../types/converter';
import { AlertTriangle, CheckCircle, Info, Sparkles, Layers, Type, Maximize2 } from 'lucide-react';

interface DiagnosticCardProps {
  analysis: PdfAnalysis;
}

export const DiagnosticCard: React.FC<DiagnosticCardProps> = ({ analysis }) => {
  const primaryPage = analysis.pages[0];

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getRiskLabel = (score: 'low' | 'medium' | 'high') => {
    if (score === 'high') {
      return {
        text: 'Risiko Layout Berantakan: Tinggi',
        color: 'text-rose-400',
        icon: AlertTriangle,
        bg: 'bg-rose-950/30 border-rose-900/50',
      };
    }
    if (score === 'medium') {
      return {
        text: 'Risiko Layout Berantakan: Sedang',
        color: 'text-amber-400',
        icon: Info,
        bg: 'bg-amber-950/30 border-amber-900/50',
      };
    }
    return {
      text: 'Risiko Layout Berantakan: Rendah',
      color: 'text-emerald-400',
      icon: CheckCircle,
      bg: 'bg-emerald-950/30 border-emerald-900/50',
    };
  };

  const risk = getRiskLabel(analysis.riskScore);
  const RiskIcon = risk.icon;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Hasil Diagnostik Struktur Dokumen</span>
          </h3>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>{analysis.fileName}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{formatFileSize(analysis.fileSizeBytes)}</span>
            <span aria-hidden="true">·</span>
            <span>{analysis.pageCount} Halaman</span>
          </div>
        </div>

        {/* Canva verification status */}
        <div className="text-xs text-slate-300 flex items-center gap-1.5">
          <span className="text-slate-500">Asal Generator:</span>
          <span className={`font-medium ${analysis.isCanvaGenerated ? 'text-amber-300' : 'text-slate-300'}`}>
            {analysis.isCanvaGenerated ? 'Canva Web Engine' : analysis.producer || 'Standar PDF'}
          </span>
        </div>
      </div>

      {/* Grid of Key Metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Ukuran Kanvas Fisik</span>
          </div>
          {primaryPage ? (
            <div>
              <p className="text-sm font-semibold text-white font-mono tabular-nums">
                {primaryPage.widthMm} × {primaryPage.heightMm} mm
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {primaryPage.detectedPreset || `${Math.round(primaryPage.widthPt)} × ${Math.round(primaryPage.heightPt)} pt`}
              </p>
            </div>
          ) : (
            <span className="text-xs text-slate-500">-</span>
          )}
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Type className="w-3.5 h-3.5 text-slate-400" />
            <span>Font Subset / CID</span>
          </div>
          <p className="text-sm font-semibold text-white font-mono tabular-nums">
            {analysis.fonts.length} Font Terdeteksi
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {analysis.fonts.some(f => f.isSubset) ? 'Perlu Vector Curves (Anti-Missing)' : 'Format Standar'}
          </p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Lapisan & Transparansi</span>
          </div>
          <p className="text-sm font-semibold text-white">
            {analysis.hasTransparency ? 'Transparansi Aktif' : 'Vektor Rata'}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {analysis.hasClippingMasks ? 'Clipping Masks Ada' : 'Tanpa Mask'}
          </p>
        </div>
      </div>

      {/* Risk Box */}
      <div className={`border rounded-lg p-3.5 ${risk.bg}`}>
        <div className="flex items-start gap-2.5">
          <RiskIcon className={`w-4 h-4 shrink-0 mt-0.5 ${risk.color}`} />
          <div className="space-y-1">
            <h4 className={`text-xs font-semibold ${risk.color}`}>
              {risk.text}
            </h4>
            <ul className="text-xs text-slate-300 space-y-1 mt-1.5 list-disc list-inside">
              {analysis.riskReasons.map((reason, idx) => (
                <li key={idx} className="leading-relaxed">
                  {reason}
                </li>
              ))}
            </ul>
            <p className="text-xs text-amber-300/90 font-medium pt-1.5 border-t border-slate-800/60 mt-2">
              Solusi Otomatis: {analysis.recommendation}
            </p>
          </div>
        </div>
      </div>

      {/* Fonts detail list if available */}
      {analysis.fonts.length > 0 && (
        <div className="pt-2">
          <span className="text-xs text-slate-400 block mb-2 font-medium">
            Daftar Font Canva dalam Dokumen:
          </span>
          <div className="flex flex-wrap gap-2 text-xs">
            {analysis.fonts.map((f, i) => (
              <span
                key={i}
                className="font-mono text-slate-300 bg-slate-950 px-2.5 py-1 rounded border border-slate-800"
              >
                {f.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
