/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { DiagnosticCard } from './components/DiagnosticCard';
import { ConversionSettings } from './components/ConversionSettings';
import { DocumentPreview } from './components/DocumentPreview';
import { ConversionProgress } from './components/ConversionProgress';
import { ResultCard } from './components/ResultCard';
import { CorelImportGuide } from './components/CorelImportGuide';
import { VectorTracerStudio } from './components/VectorTracerStudio';
import { 
  ConversionOptions, 
  PdfAnalysis, 
  ConversionResult 
} from './types/converter';
import { analyzePdf } from './utils/pdfAnalyzer';
import { convertCanvaToCorel, generatePagePreview } from './utils/corelConverter';
import { generateSampleCanvaPdf } from './utils/sampleGenerator';
import { ArrowRight, AlertCircle, Sparkles, ShieldCheck, Wand2 } from 'lucide-react';

export default function App() {
  const [activeSection, setActiveSection] = useState<string>('converter');
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [analysis, setAnalysis] = useState<PdfAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [conversionProgress, setConversionProgress] = useState<number>(0);
  const [conversionStatus, setConversionStatus] = useState<string>('');
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string>('');
  const [convertedPreviewUrl, setConvertedPreviewUrl] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [options, setOptions] = useState<ConversionOptions>({
    mode: 'vector_trace',
    targetCorelVersion: '2022_2024',
    colorSpace: 'cmyk_k100_black',
    flattenPowerClips: true,
    lockWhiteLines: true,
    removeTransparencyGroups: true,
    preciseMediaBox: true,
    dpi: 300,
    preserveBleed: false,
    bleedMarginMm: 3,
    traceOptions: {
      numberOfColors: 4,
      preset: 'block_color',
      blurRadius: 0,
      lineFilter: true,
      minArea: 6,
      dpi: 300,
      strokeWidth: 1,
    },
  });

  const handleUpdateOptions = (updated: Partial<ConversionOptions>) => {
    setOptions((prev) => ({ ...prev, ...updated }));
  };

  // Process and analyze an uploaded PDF
  const processPdfBuffer = async (buffer: ArrayBuffer, name: string) => {
    try {
      setErrorMessage(null);
      setIsAnalyzing(true);
      setResult(null);
      setConvertedPreviewUrl('');
      
      // Store an isolated cloned buffer in state
      const masterBuffer = buffer.slice(0);
      setFileBuffer(masterBuffer);
      setFileName(name);
      setCurrentPage(1);

      // Perform in-depth analysis on an isolated clone
      const diag = await analyzePdf(buffer.slice(0), name);
      setAnalysis(diag);

      // Generate preview of page 1 on an isolated clone
      const previewUrl = await generatePagePreview(buffer.slice(0), 1);
      setOriginalPreviewUrl(previewUrl);
    } catch (err: any) {
      console.error('Error analyzing PDF:', err);
      setErrorMessage(
        'Gagal membaca file PDF. Pastikan file valid, tidak rusak, dan tidak dilindungi kata sandi.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePageChange = async (newPage: number) => {
    setCurrentPage(newPage);
    if (fileBuffer) {
      const origPrev = await generatePagePreview(fileBuffer.slice(0), newPage);
      if (origPrev) setOriginalPreviewUrl(origPrev);
    }
    if (result && result.fileType === 'pdf') {
      const convertedBuf = await result.fileBlob.arrayBuffer();
      const convPrev = await generatePagePreview(convertedBuf.slice(0), newPage);
      if (convPrev) setConvertedPreviewUrl(convPrev);
    } else if (result?.svgPages && result.svgPages[newPage - 1]) {
      setConvertedPreviewUrl(result.svgPages[newPage - 1].url);
    }
  };

  const handleFileSelected = async (file: File) => {
    try {
      if (file.type.startsWith('image/')) {
        // Direct image upload (PNG, JPG, WebP) -> switch to Vector Tracer Studio immediately
        setActiveSection('tracer');
        return;
      }
      const buffer = await file.arrayBuffer();
      await processPdfBuffer(buffer, file.name);
    } catch (err: any) {
      setErrorMessage('Gagal membuka file dari perangkat: ' + (err?.message || ''));
    }
  };

  const handleLoadSample = async () => {
    try {
      setIsAnalyzing(true);
      setErrorMessage(null);
      const { buffer, fileName: sampleName } = await generateSampleCanvaPdf();
      await processPdfBuffer(buffer, sampleName);
    } catch (err: any) {
      setErrorMessage('Gagal memuat contoh desain Canva: ' + (err?.message || ''));
      setIsAnalyzing(false);
    }
  };

  // Convert the PDF for CorelDraw
  const handleStartConversion = async () => {
    if (!fileBuffer) return;

    try {
      setIsConverting(true);
      setErrorMessage(null);
      setConversionProgress(5);
      setConversionStatus('Memulai engine converter CorelDraw...');

      const res = await convertCanvaToCorel(
        fileBuffer.slice(0),
        fileName,
        options,
        (progress, statusText) => {
          setConversionProgress(progress);
          setConversionStatus(statusText);
        }
      );

      setResult(res);

      // Generate preview of the converted document
      if (res.fileType === 'pdf') {
        const convertedBuf = await res.fileBlob.arrayBuffer();
        const convPreview = await generatePagePreview(convertedBuf.slice(0), currentPage);
        setConvertedPreviewUrl(convPreview);
      } else if (res.svgPages && res.svgPages.length > 0) {
        setConvertedPreviewUrl(res.svgPages[0].url);
      }
    } catch (err: any) {
      console.error('Conversion failed:', err);
      setErrorMessage(
        'Proses konversi mengalami kendala: ' + (err?.message || 'Format tidak didukung')
      );
    } finally {
      setIsConverting(false);
    }
  };

  const handleReset = () => {
    setFileBuffer(null);
    setFileName('');
    setAnalysis(null);
    setResult(null);
    setOriginalPreviewUrl('');
    setConvertedPreviewUrl('');
    setErrorMessage(null);
  };

  // Load sample on first mount so the user has immediate interactive experience
  useEffect(() => {
    handleLoadSample();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        onLoadSample={handleLoadSample}
        activeSection={activeSection}
        onNavigate={(sec) => setActiveSection(sec)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Hero Banner Section */}
        <div className="border-b border-slate-800/80 pb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Format Stabilizer untuk Percetakan & Desain Grafis</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Konverter PDF Canva ke CorelDraw
              </h1>
              <p className="text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
                Kunci tata letak, ubah font Canva ke <strong className="text-slate-200">Curves (Kurva Vektor)</strong>, ratakan transparansi, dan atur warna <strong className="text-slate-200">CMYK K100</strong> agar tidak pecah saat diedit ulang di CorelDraw.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Anti-Geser 100%</span>
              </span>
              <span aria-hidden="true">·</span>
              <span>Corel X7 – 2024</span>
              <span aria-hidden="true">·</span>
              <span>Bebas Missing Font</span>
            </div>
          </div>
        </div>

        {/* Error notification if any */}
        {errorMessage && (
          <div className="bg-rose-950/40 border border-rose-900 text-rose-200 text-xs rounded-lg p-3.5 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Section View: Studio Converter */}
        {activeSection === 'converter' && (
          <div className="space-y-6">
            
            {/* 1. Upload or Drop Area */}
            <UploadZone
              onFileSelected={handleFileSelected}
              onLoadSample={handleLoadSample}
              isProcessing={isAnalyzing || isConverting}
              currentFileName={fileName}
            />

            {/* Loading Analysis state */}
            {isAnalyzing && (
              <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-xl">
                <p className="text-xs text-slate-400 animate-pulse">
                  Menganalisis metadata, font subset, dan lapisan kanvas PDF...
                </p>
              </div>
            )}

            {/* 2. Diagnostic & Preview Area when file loaded */}
            {analysis && !isAnalyzing && (
              <div className="space-y-6">
                
                {/* PDF Diagnostics Card */}
                <DiagnosticCard analysis={analysis} />

                {/* Document Preview (No compare feature, clean and focused) */}
                {originalPreviewUrl && (
                  <DocumentPreview
                    previewUrl={convertedPreviewUrl || originalPreviewUrl}
                    currentPage={currentPage}
                    totalPages={analysis.pageCount}
                    onPageChange={handlePageChange}
                    analysis={analysis}
                    title={convertedPreviewUrl ? 'Pratinjau Hasil Stabilisasi CorelDraw' : 'Pratinjau Desain Canva'}
                    isConverted={!!convertedPreviewUrl}
                  />
                )}

                {/* Conversion Settings Form */}
                <ConversionSettings
                  options={options}
                  onChange={handleUpdateOptions}
                  disabled={isConverting}
                />

                {/* Progress bar during conversion */}
                {isConverting && (
                  <ConversionProgress
                    progress={conversionProgress}
                    statusText={conversionStatus}
                  />
                )}

                {/* Action Button: Start Conversion */}
                {!isConverting && !result && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-900/90 border border-amber-500/30 rounded-xl">
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        Siap Memproses Dokumen untuk CorelDraw?
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Mode aktif: <strong className="text-amber-400">{options.mode === 'curves' ? 'Curves / Vector Outlines' : options.mode === 'svg_corel' ? 'CorelDraw SVG' : options.mode === 'pdfx_print' ? 'PDF/X Print Ready' : 'Ultra HD 600 DPI'}</strong> (Target: CorelDraw {options.targetCorelVersion.replace('_', ' - ')})
                      </p>
                    </div>

                    <button
                      onClick={handleStartConversion}
                      className="w-full sm:w-auto px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all whitespace-nowrap cursor-pointer"
                    >
                      <span>Mulai Konversi untuk CorelDraw</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Result Card with Download and Instructions */}
                {result && !isConverting && (
                  <ResultCard result={result} onReset={handleReset} />
                )}
              </div>
            )}

            {/* Quick CorelDraw Guidelines below the studio */}
            <div className="pt-8 border-t border-slate-800/80">
              <CorelImportGuide />
            </div>

          </div>
        )}

        {/* Section View: Trace Vektor Warna Blok */}
        {activeSection === 'tracer' && (
          <VectorTracerStudio />
        )}

        {/* Section View: Panduan CorelDraw */}
        {activeSection === 'guide' && (
          <div className="space-y-6">
            <CorelImportGuide />
          </div>
        )}

        {/* Section View: Penyebab Layout Berantakan */}
        {activeSection === 'causes' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-white">
                Analisis Teknis: Mengapa PDF Canva Berantakan di CorelDraw?
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Canva dirancang untuk rendering web dan browser, sedangkan CorelDraw dirancang untuk mesin prepress dan percetakan desktop. Perbedaan arsitektur ini memicu 4 kendala utama:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                  <h3 className="text-xs font-bold text-amber-400">
                    1. Font CID / Subset Encoding Tanpa Standard Tables
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Saat Anda mengunduh PDF dari Canva, font hanya menyertakan huruf yang digunakan (subsetting) dengan identifikasi acak seperti <code className="text-slate-300">ABCDEE+Montserrat</code>. CorelDraw tidak dapat mencocokkan ini dengan font Windows Anda, sehingga CorelDraw secara otomatis menggantinya dengan font default (Arial/Times). Karena lebar karakter berbeda, baris kalimat langsung berantakan dan turun ke bawah.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                  <h3 className="text-xs font-bold text-amber-400">
                    2. PowerClip Bersarang Berlebihan (Deep Clipping Stacks)
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Canva menggunakan tag <code className="text-slate-300">&lt;clipPath&gt;</code> untuk hampir setiap elemen (foto dalam bingkai, teks bergradasi, lingkaran). CorelDraw menerjemahkan ini sebagai wadah PowerClip. Saat pengguna melakukan Ungroup di CorelDraw, koordinat matriks sering ter-reset sehingga gambar meloncat keluar bingkai.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                  <h3 className="text-xs font-bold text-amber-400">
                    3. Blending Mode PDF 1.7 (Kotak Hitam Transparansi)
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Drop shadow dan efek glow Canva diekspor dalam standar PDF 1.7 (Multiply, Screen). CorelDraw X7-2020 memiliki bug terkenal di mana transparansi ini berubah menjadi kotak hitam pekat saat diimpor. Converter kami meratakan (flattening) lapisan ini menjadi bitmap beresolusi 300-600 DPI tanpa merusak vektor sekitarnya.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                  <h3 className="text-xs font-bold text-amber-400">
                    4. Warna RGB vs CMYK Rich Black (Teks Berbayang)
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Canva versi gratis mengekspor dalam format warna sRGB. Jika dibuka di CorelDraw dan langsung dicetak, warna hitam teks akan dipecah menjadi 4 pelat tinta cetak (C:75% M:68% Y:67% K:90%). Fitur <strong>K100 Pure Black Normalization</strong> kami mengunci teks ke 100% Black agar hasil cetak setajam silet.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section View: FAQ */}
        {activeSection === 'faq' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-white mb-2">
                Tanya Jawab Percetakan seputar File Canva & CorelDraw
              </h2>
              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                  <h3 className="font-semibold text-slate-200">
                    Q: Format apa yang paling aman untuk diimpor ke CorelDraw?
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    Format <strong>Curves PDF</strong> dan <strong>CorelDraw Native SVG</strong> adalah yang paling aman. Dengan mengubah teks menjadi kurva, komputer manapun yang membuka file tersebut tidak akan meminta font tambahan.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                  <h3 className="font-semibold text-slate-200">
                    Q: Berapa DPI yang disarankan untuk spanduk outdoor?
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    Untuk spanduk ukuran besar di atas 3 meter, 150-300 DPI sudah sangat tajam karena jarak pandang lebih dari 2 meter. Untuk brosur, kartu nama, dan packaging, pilih 300 DPI atau 450 DPI.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                  <h3 className="font-semibold text-slate-200">
                    Q: Apakah converter ini mengunggah file saya ke server luar?
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    Tidak sama sekali! Seluruh proses dekomposisi, vektorisasi kurva, dan rendering PDF dilakukan secara lokal di dalam browser Anda menggunakan teknologi WebAssembly dan Web Workers, sehingga privasi desain pelanggan Anda 100% terjaga aman.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Subtle, clean footer following anti-slop rules */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>CanvaToCorel Studio · Prepress & Digital Printing Utility</span>
          <span>Kompatibel dengan CorelDraw X4, X7, X8, 2019, 2020, 2021, 2022, 2024</span>
        </div>
      </footer>
    </div>
  );
}
