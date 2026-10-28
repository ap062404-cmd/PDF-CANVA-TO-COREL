import React from 'react';
import { ConversionOptions, ConversionMode, CorelVersion, ColorSpaceMode } from '../types/converter';
import { Sliders, Check, ShieldCheck, Printer, FileCode, Sparkles } from 'lucide-react';

interface ConversionSettingsProps {
  options: ConversionOptions;
  onChange: (updated: Partial<ConversionOptions>) => void;
  disabled?: boolean;
}

export const ConversionSettings: React.FC<ConversionSettingsProps> = ({
  options,
  onChange,
  disabled = false,
}) => {
  const modes: {
    id: ConversionMode;
    title: string;
    description: string;
    badge: string;
    icon: React.ComponentType<{ className?: string }>;
    fileFormat: string;
  }[] = [
    {
      id: 'vector_trace',
      title: 'Auto-Trace Vektor Warna Blok (Solusi Pasti Anti-Kotak)',
      description: 'Mendeteksi warna blok (plang rambu, logo, panah, teks) dan mengonversinya langsung menjadi kurva vektor tertutup sejati. 100% bebas dari kotak pembungkus dan list bawah terpotong.',
      badge: 'Solusi Pasti (Bebas Kotak & PowerClip)',
      icon: Sparkles,
      fileFormat: '.SVG / .PDF',
    },
    {
      id: 'curves',
      title: 'Vektor PDF Asli Presisi (Anti-Potong & Stroke Locked)',
      description: '100% mempertahankan kurva & bentuk vektor Canva. Mengunci ketebalan garis putih agar tidak berubah di CorelDraw dan membebaskan clipping mask bawah agar bentuk tidak terpotong.',
      badge: 'Struktur Asli PDF',
      icon: ShieldCheck,
      fileFormat: '.PDF',
    },
    {
      id: 'svg_corel',
      title: 'CorelDraw Native SVG Vector (<path>)',
      description: 'Mengekstrak kurva bezier dan path vektor ke SVG murni. Diimpor ke CorelDraw sebagai objek kurva asli yang bebas diedit nodenya (F10) & di-ungroup (Ctrl+U).',
      badge: 'Kurva Vektor Murni',
      icon: FileCode,
      fileFormat: '.SVG',
    },
    {
      id: 'pdfx_print',
      title: 'PDF/X Vektor & K100 Prepress',
      description: 'Menjaga struktur vektor tetap utuh dan mengonversi operator warna hitam menjadi CMYK K100 murni agar cetakan sangat tajam tanpa bayangan.',
      badge: 'Standar Prepress',
      icon: Printer,
      fileFormat: '.PDF',
    },
  ];

  const currentTraceOptions = options.traceOptions || {
    numberOfColors: 4,
    preset: 'block_color',
    blurRadius: 0,
    lineFilter: true,
    minArea: 6,
    dpi: options.dpi || 300,
    strokeWidth: 1,
  };

  const handleTraceOptionChange = (updatedTrace: Partial<typeof currentTraceOptions>) => {
    onChange({
      traceOptions: {
        ...currentTraceOptions,
        ...updatedTrace,
      },
    });
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">
            Konfigurasi Optimasi CorelDraw
          </h3>
        </div>
        <span className="text-xs text-slate-400">
          Target Mesin & Versi Corel
        </span>
      </div>

      {/* Mode Selection Cards */}
      <div className="space-y-2.5">
        <label className="text-xs font-semibold text-slate-300 block">
          Pilih Mode Stabilisasi Tata Letak:
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {modes.map((m) => {
            const Icon = m.icon;
            const isSelected = options.mode === m.id;
            return (
              <div
                key={m.id}
                onClick={() => !disabled && onChange({ mode: m.id })}
                className={`relative p-3.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-400 bg-amber-500/10 shadow-sm'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
                } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                      <h4 className="text-xs font-bold text-white">
                        {m.title}
                      </h4>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      {m.fileFormat}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {m.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-[11px] text-amber-400 font-medium">
                    {m.badge}
                  </span>
                  {isSelected && (
                    <span className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold">
                      <Check className="w-3.5 h-3.5" />
                      <span>Aktif</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dedicated Interactive Trace Settings when vector_trace is active */}
      {options.mode === 'vector_trace' && (
        <div className="bg-amber-500/5 border border-amber-500/30 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Parameter Auto-Trace Warna Blok
              </span>
            </div>
            <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 font-medium">
              Anti-Kotak & Anti-PowerClip
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Color Count */}
            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">
                Jumlah Warna Blok:
              </label>
              <select
                value={currentTraceOptions.numberOfColors}
                onChange={(e) => handleTraceOptionChange({ numberOfColors: parseInt(e.target.value) })}
                disabled={disabled}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value={2}>2 Warna (Monokrom / Hitam Putih)</option>
                <option value={3}>3 Warna (Contoh: Biru + Putih + Hitam)</option>
                <option value={4}>4 Warna (Rambu & Plang Standar Canva)</option>
                <option value={6}>6 Warna (Poster & Logo)</option>
                <option value={8}>8 Warna (Ilustrasi Flat)</option>
                <option value={12}>12 Warna (Desain Kompleks)</option>
                <option value={16}>16 Warna (Detail Tinggi)</option>
              </select>
            </div>

            {/* Tracing Preset */}
            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">
                Gaya Kontur Kurva:
              </label>
              <select
                value={currentTraceOptions.preset}
                onChange={(e) => handleTraceOptionChange({ preset: e.target.value as any })}
                disabled={disabled}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="block_color">Warna Blok Rambu / Clipart (Standar)</option>
                <option value="curvy_sign">Kurva Halus (Lingkaran & Sudut Bulat)</option>
                <option value="sharp_logo">Sudut Tajam & Presisi (Logo / Huruf)</option>
                <option value="detailed">Detail Mikro & Garis Halus</option>
              </select>
            </div>

            {/* Filter Noise */}
            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">
                Filter Titik / Noise Kecil:
              </label>
              <select
                value={currentTraceOptions.minArea}
                onChange={(e) => handleTraceOptionChange({ minArea: parseInt(e.target.value) })}
                disabled={disabled}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value={2}>Tanpa Filter (Semua detail disimpan)</option>
                <option value={6}>Sedang (Rekomendasi untuk Teks & Rambu)</option>
                <option value={12}>Tinggi (Hapus bintik kecil / debu scan)</option>
              </select>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded border border-slate-800/80 leading-relaxed">
            💡 <strong className="text-slate-200">Keunggulan Mode Trace:</strong> Gambar/PDF dirasterisasi pada resolusi 300 DPI, lalu kontur warna biru, putih, dan teks di-trace langsung menjadi garis vektor murni. Lingkaran dan panah dijamin berbentuk asli tanpa kotak pembungkus.
          </div>
        </div>
      )}

      {/* Target CorelDraw Version & Color Profile Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
        
        {/* CorelDraw Version Target */}
        <div>
          <label className="text-xs font-medium text-slate-300 block mb-1.5">
            Versi CorelDraw Target
          </label>
          <select
            value={options.targetCorelVersion}
            onChange={(e) => onChange({ targetCorelVersion: e.target.value as CorelVersion })}
            disabled={disabled}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors cursor-pointer"
          >
            <option value="2022_2024">CorelDraw 2022 – 2024 / SE (Terbaru)</option>
            <option value="2019_2021">CorelDraw 2019 – 2021</option>
            <option value="x7_x8">CorelDraw X7 – X8 (Standar Percetakan)</option>
            <option value="legacy">CorelDraw X4 – X6 (Versi Lama)</option>
          </select>
          <p className="text-[11px] text-slate-500 mt-1">
            Menyesuaikan parser PostScript & engine PDF linear xref.
          </p>
        </div>

        {/* Color Space */}
        <div>
          <label className="text-xs font-medium text-slate-300 block mb-1.5">
            Manajemen Warna Cetak
          </label>
          <select
            value={options.colorSpace}
            onChange={(e) => onChange({ colorSpace: e.target.value as ColorSpaceMode })}
            disabled={disabled}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors cursor-pointer"
          >
            <option value="cmyk_k100_black">CMYK K100 (Teks & Garis Hitam Pekat Anti-Blur)</option>
            <option value="cmyk_standard">Simulasi CMYK Standard (FOGRA39)</option>
            <option value="keep_rgb">Pertahankan Nilai RGB Asli Canva</option>
          </select>
          <p className="text-[11px] text-slate-500 mt-1">
            K100 mengunci hitam murni agar tidak pecah 4 plat cetak.
          </p>
        </div>
      </div>

      {/* Advanced Precision Fixes for CorelDraw */}
      <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
        <span className="text-xs font-semibold text-slate-300 block mb-2">
          Perbaikan Presisi Vektor & Garis (Solusi Masalah CorelDraw):
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-800/80 bg-slate-950/40 cursor-pointer text-slate-300 hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={options.lockWhiteLines}
              onChange={(e) => onChange({ lockWhiteLines: e.target.checked })}
              disabled={disabled}
              className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-400 bg-slate-950"
            />
            <div>
              <span className="font-medium text-white block">Kunci Ketebalan Garis & Stroke (Anti-Perubahan Ukuran)</span>
              <span className="text-[11px] text-slate-400 leading-relaxed block mt-0.5">
                Mengunci ketebalan stroke dengan parameter eksplisit (round caps, round joins, anti-hairline, dan non-overprint) agar bentuk dan ketebalan garis presisi 100% tanpa berubah menjadi kotak.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-800/80 bg-slate-950/40 cursor-pointer text-slate-300 hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={options.flattenPowerClips}
              onChange={(e) => onChange({ flattenPowerClips: e.target.checked })}
              disabled={disabled}
              className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-400 bg-slate-950"
            />
            <div>
              <span className="font-medium text-white block">Bebaskan Clipping Path Bawah (Anti-Potong Bentuk)</span>
              <span className="text-[11px] text-slate-400 leading-relaxed block mt-0.5">
                Memperluas masking Canva agar bentuk kurva, lengkungan, dan elemen tepi bawah tidak terpotong oleh PowerClip CorelDraw.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-800/80 bg-slate-950/40 cursor-pointer text-slate-300 hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={options.removeTransparencyGroups}
              onChange={(e) => onChange({ removeTransparencyGroups: e.target.checked })}
              disabled={disabled}
              className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-400 bg-slate-950"
            />
            <div>
              <span className="font-medium text-white block">Hapus Group Transparansi (Anti-Flat Bitmap)</span>
              <span className="text-[11px] text-slate-400 leading-relaxed block mt-0.5">
                Mencegah CorelDraw mengubah elemen vektor menjadi gambar bitmap flat saat mendeteksi grup transparansi Canva.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-800/80 bg-slate-950/40 cursor-pointer text-slate-300 hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={options.preciseMediaBox}
              onChange={(e) => onChange({ preciseMediaBox: e.target.checked })}
              disabled={disabled}
              className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-400 bg-slate-950"
            />
            <div>
              <span className="font-medium text-white block">Sinkronisasi Koordinat [0, 0] Presisi</span>
              <span className="text-[11px] text-slate-400 leading-relaxed block mt-0.5">
                Mengunci MediaBox, CropBox, dan TrimBox pada titik 0,0 agar artboard CorelDraw tidak bergeser saat diimpor.
              </span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
