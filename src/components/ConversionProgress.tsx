import React from 'react';
import { Loader2 } from 'lucide-react';

interface ConversionProgressProps {
  progress: number;
  statusText: string;
}

export const ConversionProgress: React.FC<ConversionProgressProps> = ({
  progress,
  statusText,
}) => {
  return (
    <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-6 text-center space-y-4 shadow-lg shadow-amber-500/5">
      <div className="flex items-center justify-center gap-3">
        <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
        <span className="text-sm font-semibold text-white">
          Sedang Mengonversi Dokumen ke Format CorelDraw
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
        <div
          className="bg-gradient-to-r from-amber-500 to-amber-400 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${Math.max(progress, 5)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="truncate max-w-md">{statusText}</span>
        <span className="font-mono tabular-nums font-semibold text-amber-400">
          {progress}%
        </span>
      </div>
    </div>
  );
};
