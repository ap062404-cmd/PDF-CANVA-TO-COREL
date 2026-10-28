import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Sparkles, CheckCircle2 } from 'lucide-react';

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
  onLoadSample: () => void;
  isProcessing: boolean;
  currentFileName?: string;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFileSelected,
  onLoadSample,
  isProcessing,
  currentFileName,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const name = file.name.toLowerCase();
      if (
        file.type === 'application/pdf' || 
        name.endsWith('.pdf') ||
        file.type.startsWith('image/') ||
        name.endsWith('.png') ||
        name.endsWith('.jpg') ||
        name.endsWith('.jpeg') ||
        name.endsWith('.webp')
      ) {
        onFileSelected(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onFileSelected(file);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 sm:p-10 transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
          isDragging
            ? 'border-amber-400 bg-amber-500/10 scale-[0.99]'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900/90'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf,image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          className="hidden"
          disabled={isProcessing}
        />

        <div className="w-14 h-14 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mb-4 text-amber-400 group-hover:scale-105 transition-transform">
          {currentFileName ? (
            <CheckCircle2 className="w-7 h-7 text-emerald-400" />
          ) : (
            <UploadCloud className="w-7 h-7" />
          )}
        </div>

        {currentFileName ? (
          <div>
            <p className="text-base font-semibold text-white mb-1 flex items-center justify-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>{currentFileName}</span>
            </p>
            <p className="text-xs text-slate-400">
              Klik atau tarik file lain untuk mengganti PDF / Gambar
            </p>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Tarik file PDF atau Gambar Canva ke sini
            </h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-4">
              Mendukung <strong className="text-slate-200">PDF Canva</strong> serta gambar flat warna blok (<strong className="text-slate-200">PNG, JPG, WebP</strong>) untuk Auto-Trace Vektor.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <span>Batas ukuran rekomendasi: s/d 100 MB</span>
              <span aria-hidden="true">·</span>
              <span>Pemrosesan lokal aman di browser</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick sample loader prompt */}
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 px-1">
        <span className="flex items-center gap-1.5">
          <span>Belum punya file PDF Canva di perangkat ini?</span>
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onLoadSample();
          }}
          className="text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1.5 underline underline-offset-4 cursor-pointer transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Muat contoh desain flyer Canva (A4)</span>
        </button>
      </div>
    </div>
  );
};
