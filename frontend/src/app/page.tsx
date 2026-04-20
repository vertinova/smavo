import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-sidebar">
      {/* Dot pattern */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-lg">
          <div className="inline-flex items-center gap-2.5 mb-8">
            <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
              <span className="text-white font-extrabold text-lg">S</span>
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-white tracking-tight leading-none">SMAVO</h1>
              <p className="text-[11px] text-white/30 uppercase tracking-[0.2em] leading-none mt-0.5">
                SMAN 2 Cibinong
              </p>
            </div>
          </div>

          <p className="text-white/50 text-base leading-relaxed mb-10 max-w-sm mx-auto">
            Sistem Manajemen &amp; Administrasi Sekolah untuk pengelolaan aset, keuangan BOS, dan data akademik.
          </p>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-primary text-white font-semibold text-sm
                       px-7 py-3 rounded-[10px] shadow-lg shadow-primary/25
                       hover:bg-primary-hover hover:shadow-xl hover:shadow-primary/30
                       transition-all duration-200 active:scale-[0.97]"
          >
            Masuk ke Sistem
            <ArrowRight size={16} />
          </Link>
        </div>

        <p className="absolute bottom-8 text-white/15 text-xs">
          Jl. Raya Jakarta-Bogor KM 43, Cibinong, Bogor
        </p>
      </div>
    </div>
  );
}
