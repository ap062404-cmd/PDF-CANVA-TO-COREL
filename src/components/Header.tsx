import React from 'react';
import { Layers, FileCheck } from 'lucide-react';

interface HeaderProps {
  onLoadSample: () => void;
  activeSection: string;
  onNavigate: (section: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onLoadSample,
  activeSection,
  onNavigate,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Single text element wordmark */}
        <div 
          onClick={() => onNavigate('converter')}
          className="flex items-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0 group"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/10">
            <Layers className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors">
              CanvaToCorel
            </span>
            <span className="text-xs text-slate-400 block font-normal -mt-0.5">
              PDF Layout Stabilizer
            </span>
          </div>
        </div>

        {/* Zone 2: 4-5 clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            onClick={() => onNavigate('converter')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              activeSection === 'converter' ? 'text-amber-400 font-bold' : ''
            }`}
          >
            Studio Konverter
          </button>
          <button
            onClick={() => onNavigate('tracer')}
            className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 hover:text-white ${
              activeSection === 'tracer' ? 'text-amber-400 font-bold' : ''
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span>Trace Vektor Warna Blok</span>
          </button>
          <button
            onClick={() => onNavigate('guide')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              activeSection === 'guide' ? 'text-amber-400 font-bold' : ''
            }`}
          >
            Panduan CorelDraw
          </button>
          <button
            onClick={() => onNavigate('causes')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              activeSection === 'causes' ? 'text-amber-400 font-bold' : ''
            }`}
          >
            Penyebab Vektor Terpotong
          </button>
          <button
            onClick={() => onNavigate('faq')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              activeSection === 'faq' ? 'text-amber-400' : ''
            }`}
          >
            FAQ Percetakan
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onLoadSample}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 rounded-lg hover:bg-amber-300 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 shadow-sm shadow-amber-500/20"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Coba File Contoh</span>
          </button>
        </div>

      </div>
    </header>
  );
};
