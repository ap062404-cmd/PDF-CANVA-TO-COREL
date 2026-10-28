import React from 'react';
import { BookOpen, CheckCircle2, AlertOctagon, HelpCircle, CornerDownRight, ShieldCheck } from 'lucide-react';

export const CorelImportGuide: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Step by Step CorelDraw Instructions */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 sm:p-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800 mb-6">
          <BookOpen className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-base font-bold text-white">
              Panduan Langkah Demi Langkah Impor ke CorelDraw
            </h3>
            <p className="text-xs text-slate-400">
              Ikuti 4 langkah ini agar tata letak tidak berantakan, garis putih tidak berubah ukuran, dan bentuk tidak terpotong
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Step 1 */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 relative">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-2">
              <span className="w-5 h-5 rounded-full bg-amber-400/10 text-amber-400 flex items-center justify-center font-mono">
                1
              </span>
              <span>Gunakan Perintah Import (Bukan Open)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Jangan klik ganda atau menggunakan <code className="text-amber-300 font-mono">File &gt; Open</code> karena CorelDraw akan mencoba membuka dokumen sebagai template kosong.
            </p>
            <div className="p-2.5 bg-slate-900 rounded border border-slate-800 text-xs font-mono text-slate-200 flex items-center justify-between">
              <span>Shortcut CorelDraw:</span>
              <span className="bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded font-bold">Ctrl + I</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 relative">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-2">
              <span className="w-5 h-5 rounded-full bg-amber-400/10 text-amber-400 flex items-center justify-center font-mono">
                2
              </span>
              <span>Pilih "Import text as: Curves"</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Saat pop-up dialog <span className="text-white font-medium">"Import PDF"</span> muncul di CorelDraw, pastikan memilih opsi kurva:
            </p>
            <div className="p-2.5 bg-slate-900 rounded border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Pilih Radio Button: <strong>Curves</strong> (Bukan Text)</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 relative">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-2">
              <span className="w-5 h-5 rounded-full bg-amber-400/10 text-amber-400 flex items-center justify-center font-mono">
                3
              </span>
              <span>Letakkan Presisi dengan Tombol Spasi</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Setelah memilih file, kursor CorelDraw akan berubah menjadi ikon sudut siku. Jangan drag sembarangan agar skala milimeter tidak berubah.
            </p>
            <div className="p-2.5 bg-slate-900 rounded border border-slate-800 text-xs font-mono text-slate-200 flex items-center justify-between">
              <span>Tekan tombol:</span>
              <span className="bg-slate-800 text-white px-2 py-0.5 rounded font-bold">SPACEBAR / ENTER</span>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 relative">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-2">
              <span className="w-5 h-5 rounded-full bg-amber-400/10 text-amber-400 flex items-center justify-center font-mono">
                4
              </span>
              <span>Edit Ulang & Ungroup Objek</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Untuk mengedit bentuk atau warna elemen yang sudah diimpor, lakukan pisah grup secara bertahap:
            </p>
            <div className="p-2.5 bg-slate-900 rounded border border-slate-800 text-xs font-mono text-slate-200 flex items-center justify-between">
              <span>Pisahkan Grup:</span>
              <span className="bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded font-bold">Ctrl + U</span>
            </div>
          </div>
        </div>
      </div>

      {/* Root causes section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 sm:p-6">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-rose-400" />
          <span>Solusi Masalah Garis Putih & Bagian Bawah Terpotong di CorelDraw</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h4>Penyebab Garis Putih Berubah Ukuran Ketebalannya</h4>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Di Canva, garis putih sering dibuat dengan stroke outline. Saat diimpor ke CorelDraw, filter PDF CorelDraw sering menganggap garis tipis sebagai <em>Hairline</em> (garis rambut 0.076 mm) atau mengalami scaling error akibat matriks transformasi (CTM).
            </p>
            <p className="text-emerald-400 font-medium">
              Solusi Kami: Converter mengonversi garis putih dan divider menjadi <strong>kurva vektor tertutup (filled polygon)</strong>. Karena menjadi bidang tertutup, ketebalannya terkunci 100% dan tidak bisa diperkecil atau diubah oleh CorelDraw!
            </p>
          </div>

          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h4>Penyebab Bagian Bawah Terpotong (Bentuk Tidak Utuh)</h4>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Canva menambahkan clipping path ketat <code className="text-slate-200 font-mono">0 0 W H re W n</code> di batas kanvas. Jika ada lengkungan atau elemen desain yang menyentuh koordinat Y=0, CorelDraw memotongnya ke dalam wadah PowerClip sehingga bentuk bawah terbelah dua.
            </p>
            <p className="text-emerald-400 font-medium">
              Solusi Kami: Converter membebaskan batas clipping mask Canva dan menyelaraskan titik nol [0, 0] MediaBox, BleedBox, dan TrimBox. Seluruh bentuk bawah, kurva, dan footer tetap utuh dan sempurna.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 sm:p-6">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-400" />
          <span>Pertanyaan Umum (FAQ) Percetakan & Desain</span>
        </h3>

        <div className="space-y-3 text-xs">
          <details className="group bg-slate-950/60 border border-slate-800 rounded-lg p-3 open:border-slate-700">
            <summary className="font-semibold text-slate-200 cursor-pointer list-none flex items-center justify-between">
              <span>Mengapa hasil konversi ini tidak menjadi flat bitmap?</span>
              <CornerDownRight className="w-3.5 h-3.5 text-slate-500 group-open:rotate-90 transition-transform" />
            </summary>
            <p className="text-slate-400 mt-2 leading-relaxed pt-2 border-t border-slate-800/80">
              Converter ini membersihkan dictionary transparansi Canva (<code className="text-amber-300 font-mono">/Group</code>) yang biasanya memicu CorelDraw melakukan perataan bitmap otomatis. Dengan demikian, semua path, kurva bezier, dan teks tetap 100% vektor asli yang dapat dipecah grupnya (<code className="text-amber-300 font-mono">Ctrl + U</code>) dan diedit nodenya dengan Shape Tool (<code className="text-amber-300 font-mono">F10</code>).
            </p>
          </details>

          <details className="group bg-slate-950/60 border border-slate-800 rounded-lg p-3 open:border-slate-700">
            <summary className="font-semibold text-slate-200 cursor-pointer list-none flex items-center justify-between">
              <span>Apa perbedaan mode PDF Vektor vs CorelDraw SVG?</span>
              <CornerDownRight className="w-3.5 h-3.5 text-slate-500 group-open:rotate-90 transition-transform" />
            </summary>
            <p className="text-slate-400 mt-2 leading-relaxed pt-2 border-t border-slate-800/80">
              Mode PDF Vektor mempertahankan dokumen dalam format PDF multi-halaman siap cetak dengan standar linear xref CorelDraw. Mode SVG mengekstrak elemen ke dalam file vektor XML murni (.svg) yang dapat langsung diimpor dan dipecah tanpa dialog opsi PDF CorelDraw.
            </p>
          </details>

          <details className="group bg-slate-950/60 border border-slate-800 rounded-lg p-3 open:border-slate-700">
            <summary className="font-semibold text-slate-200 cursor-pointer list-none flex items-center justify-between">
              <span>Apa fungsi K100 Pure Black Normalization?</span>
              <CornerDownRight className="w-3.5 h-3.5 text-slate-500 group-open:rotate-90 transition-transform" />
            </summary>
            <p className="text-slate-400 mt-2 leading-relaxed pt-2 border-t border-slate-800/80">
              Canva sering menghasilkan warna hitam rich black (campuran C:75% M:68% Y:67% K:90%). Pada mesin cetak, teks kecil akan terlihat buram berbayang warna jika plat cetak sedikit bergeser. Opsi K100 mengunci hitam murni hanya menggunakan tinta Black (K=100%), menghasilkan teks cetak yang sangat tajam.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
};
