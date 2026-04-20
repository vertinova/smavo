'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import {
  ArrowRight, Package, Wallet, GraduationCap, Users, FileText,
  ShieldAlert, BarChart3, CheckCircle2, Zap, Lock, ChevronDown,
  Sparkles, MousePointer2, Globe, Award, BookOpen, Building2,
  MapPin, Phone, Mail, Star, Heart, Rocket,
} from 'lucide-react';

/* ─── Data ─── */
const MODULES = [
  {
    icon: Package,
    title: 'Inventaris Aset',
    desc: 'Manajemen aset sekolah lengkap dengan QR Code tracking, peminjaman, perawatan, dan pelaporan kondisi barang.',
    bg: 'bg-gradient-to-br from-blue-50 to-cyan-50',
    iconBg: 'bg-blue-500',
    border: 'hover:border-blue-300',
    shadow: 'hover:shadow-blue-200/50',
  },
  {
    icon: Wallet,
    title: 'Keuangan BOS',
    desc: 'Pengelolaan dana BOS transparan — RKAS, pencatatan pengeluaran, bukti transaksi, dan laporan realisasi anggaran.',
    bg: 'bg-gradient-to-br from-emerald-50 to-teal-50',
    iconBg: 'bg-emerald-500',
    border: 'hover:border-emerald-300',
    shadow: 'hover:shadow-emerald-200/50',
  },
  {
    icon: GraduationCap,
    title: 'Data Siswa',
    desc: 'Database siswa terintegrasi per kelas dan angkatan, status aktif, mutasi, serta riwayat akademik lengkap.',
    bg: 'bg-gradient-to-br from-violet-50 to-purple-50',
    iconBg: 'bg-violet-500',
    border: 'hover:border-violet-300',
    shadow: 'hover:shadow-violet-200/50',
  },
  {
    icon: Users,
    title: 'Data Guru & Staf',
    desc: 'Profil lengkap tenaga pendidik dan kependidikan — NIP, mata pelajaran, jabatan, dan informasi kontak.',
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
    iconBg: 'bg-amber-500',
    border: 'hover:border-amber-300',
    shadow: 'hover:shadow-amber-200/50',
  },
  {
    icon: FileText,
    title: 'Persuratan Digital',
    desc: 'Pembuatan surat resmi otomatis — surat mutasi, keterangan aktif, izin, dan penomoran surat terintegrasi.',
    bg: 'bg-gradient-to-br from-rose-50 to-pink-50',
    iconBg: 'bg-rose-500',
    border: 'hover:border-rose-300',
    shadow: 'hover:shadow-rose-200/50',
  },
  {
    icon: ShieldAlert,
    title: 'Kedisiplinan',
    desc: 'Pencatatan pelanggaran dan prestasi siswa, akumulasi poin, serta laporan kedisiplinan per individu.',
    bg: 'bg-gradient-to-br from-cyan-50 to-sky-50',
    iconBg: 'bg-cyan-500',
    border: 'hover:border-cyan-300',
    shadow: 'hover:shadow-cyan-200/50',
  },
];

const SCHOOL_FACTS = [
  { value: 'SMAN 2', label: 'Cibinong, Kab. Bogor', color: 'text-indigo-600', bg: 'bg-indigo-100', icon: Building2 },
  { value: '1987', label: 'Tahun Berdiri', color: 'text-emerald-600', bg: 'bg-emerald-100', icon: Award },
  { value: 'A', label: 'Akreditasi Sekolah', color: 'text-violet-600', bg: 'bg-violet-100', icon: Star },
  { value: '1200+', label: 'Siswa Aktif', color: 'text-rose-600', bg: 'bg-rose-100', icon: GraduationCap },
];

const WHY_SUPER_APP = [
  { icon: Rocket, title: 'All-in-One', desc: 'Satu platform untuk semua kebutuhan manajemen sekolah — tidak perlu banyak aplikasi.', color: 'text-indigo-500', bg: 'bg-indigo-100' },
  { icon: Zap, title: 'Cepat & Real-time', desc: 'Data selalu terkini, akses instan dari mana saja melalui browser.', color: 'text-amber-500', bg: 'bg-amber-100' },
  { icon: Lock, title: 'Aman & Terpercaya', desc: 'Autentikasi berlapis dengan enkripsi data untuk keamanan informasi sekolah.', color: 'text-emerald-500', bg: 'bg-emerald-100' },
  { icon: Heart, title: 'Dibuat untuk SMAVO', desc: 'Dirancang khusus sesuai kebutuhan operasional SMAN 2 Cibinong.', color: 'text-rose-500', bg: 'bg-rose-100' },
];

/* ─── Scroll reveal hook ─── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    el.querySelectorAll('.reveal').forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, []);
  return ref;
}

export default function HomePage() {
  const aboutRef = useReveal();
  const factsRef = useReveal();
  const featuresRef = useReveal();
  const whyRef = useReveal();
  const ctaRef = useReveal();

  return (
    <div className="min-h-screen bg-[#f8faff] relative overflow-hidden">
      {/* ── Animated background shapes ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-8%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-indigo-200/60 to-violet-200/40 blur-[100px] animate-float" />
        <div className="absolute bottom-[-10%] right-[-8%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-br from-rose-200/50 to-pink-200/30 blur-[100px] animate-float-delayed" />
        <div className="absolute top-[30%] right-[10%] w-[30vw] h-[30vw] rounded-full bg-gradient-to-br from-emerald-200/40 to-teal-100/30 blur-[80px] animate-float-slow" />
        <div className="absolute top-[12%] right-[18%] w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-300/30 to-orange-300/20 rotate-12 animate-float-delayed blur-sm" />
        <div className="absolute top-[60%] left-[8%] w-16 h-16 rounded-full bg-gradient-to-br from-cyan-300/30 to-sky-300/20 animate-float blur-sm" />
        <div className="absolute top-[40%] left-[50%] w-12 h-12 rounded-xl bg-gradient-to-br from-violet-300/25 to-purple-300/15 -rotate-12 animate-float-slow blur-sm" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      {/* ═══ NAVBAR ═══ */}
      <nav className="relative z-20 w-full animate-fade-up">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <span className="text-white font-bold text-base">S</span>
            </div>
            <div>
              <span className="text-slate-800 font-bold text-sm tracking-tight">SMAVO</span>
              <span className="hidden sm:block text-[10px] text-slate-400 tracking-widest uppercase">
                Super App
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="#tentang" className="hidden sm:inline text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors">Tentang</a>
            <a href="#fitur" className="hidden sm:inline text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors">Fitur</a>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded-full bg-white/80 backdrop-blur border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 shadow-sm hover:shadow-md transition-all duration-300"
            >
              Masuk
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="relative z-10 pt-12 sm:pt-20 pb-16 sm:pb-28">
        <div className="max-w-6xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="animate-fade-up inline-flex items-center gap-2.5 bg-white/80 backdrop-blur border border-indigo-100 rounded-full px-5 py-2 mb-8 shadow-sm">
            <Sparkles size={14} className="text-indigo-500" />
            <span className="text-xs font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              SMAN 2 Cibinong &middot; Kabupaten Bogor
            </span>
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up-delay-1 text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-[1.1] mb-3">
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x">
              SMAVO
            </span>
          </h1>
          <h2 className="animate-fade-up-delay-1 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-800 mb-6">
            Super App
          </h2>

          {/* Subtitle */}
          <p className="animate-fade-up-delay-2 text-slate-500 text-base sm:text-lg leading-relaxed mb-4 max-w-2xl mx-auto">
            Satu aplikasi untuk seluruh kebutuhan manajemen SMAN 2 Cibinong &mdash;
            dari inventaris aset, keuangan BOS, data akademik, persuratan,
            hingga kedisiplinan siswa.
          </p>
          <p className="animate-fade-up-delay-2 text-slate-400 text-sm mb-10 max-w-lg mx-auto">
            Dibangun khusus untuk warga SMAVO. Akses mudah, data real-time, semua dalam satu platform.
          </p>

          {/* CTA buttons */}
          <div className="animate-fade-up-delay-3 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="group relative inline-flex items-center gap-3 font-semibold text-sm text-white px-8 py-3.5 rounded-full overflow-hidden shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-[length:200%_auto] animate-gradient-x" />
              <span className="relative z-10">Masuk ke SMAVO</span>
              <ArrowRight size={15} className="relative z-10 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a
              href="#tentang"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
            >
              Tentang Kami
              <ChevronDown size={14} className="animate-bounce-gentle" />
            </a>
          </div>

          {/* ── Dashboard preview mockup ── */}
          <div className="animate-fade-up-delay-4 mt-14 sm:mt-20 max-w-4xl mx-auto">
            <div className="relative">
              {/* Glow behind */}
              <div className="absolute -inset-4 bg-gradient-to-r from-indigo-400/20 via-violet-400/20 to-purple-400/20 rounded-3xl blur-2xl" />

              <div className="relative bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl p-2 shadow-2xl shadow-indigo-500/10">
                <div className="bg-gradient-to-b from-slate-50 to-white rounded-xl border border-slate-100 overflow-hidden">
                  {/* Browser bar */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-white/60">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="bg-slate-100 rounded-md px-4 py-1 text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                        <Lock size={8} />
                        smavo.sch.id/dashboard
                      </div>
                    </div>
                  </div>

                  {/* Dashboard mock */}
                  <div className="p-4 sm:p-6 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Total Siswa', val: '1,247', c: 'from-blue-500 to-cyan-500', bg: 'from-blue-50 to-cyan-50' },
                        { label: 'Total Guru', val: '86', c: 'from-emerald-500 to-teal-500', bg: 'from-emerald-50 to-teal-50' },
                        { label: 'Aset Aktif', val: '3,521', c: 'from-violet-500 to-purple-500', bg: 'from-violet-50 to-purple-50' },
                        { label: 'Dana BOS', val: 'Rp 2.1M', c: 'from-amber-500 to-orange-500', bg: 'from-amber-50 to-orange-50' },
                      ].map((s) => (
                        <div key={s.label} className={`bg-gradient-to-br ${s.bg} rounded-xl border border-white p-3 text-left shadow-sm`}>
                          <p className="text-[10px] text-slate-400 mb-1 font-medium">{s.label}</p>
                          <p className={`text-base sm:text-lg font-bold bg-gradient-to-r ${s.c} bg-clip-text text-transparent`}>{s.val}</p>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2 bg-gradient-to-br from-indigo-50/50 to-white rounded-xl border border-slate-100 p-3 h-28 flex items-end gap-1">
                        {[40, 65, 50, 80, 60, 90, 70, 85, 55, 75, 95, 68].map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-t-sm bg-gradient-to-t from-indigo-500 to-violet-400 origin-bottom animate-bar-grow"
                            style={{ height: `${h}%`, animationDelay: `${0.5 + i * 0.08}s` }}
                          />
                        ))}
                      </div>
                      <div className="bg-gradient-to-br from-violet-50/50 to-white rounded-xl border border-slate-100 p-3 flex flex-col justify-center items-center">
                        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 60 60">
                          <circle cx="30" cy="30" r="24" fill="none" stroke="#e2e8f0" strokeWidth="5" />
                          <circle cx="30" cy="30" r="24" fill="none" stroke="url(#donutGrad)" strokeWidth="5" strokeLinecap="round" className="animate-donut-draw" style={{ strokeDasharray: '0 151' }} />
                          <defs>
                            <linearGradient id="donutGrad" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#6366f1" />
                              <stop offset="100%" stopColor="#a855f7" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium">71% Realisasi</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating accent cards */}
              <div className="hidden lg:block absolute -left-16 top-1/3 animate-float">
                <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-lg shadow-slate-200/50 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                    <CheckCircle2 size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Akreditasi</p>
                    <p className="text-xs font-bold text-emerald-600">A</p>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block absolute -right-12 top-1/2 animate-float-delayed">
                <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-lg shadow-slate-200/50 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
                    <BarChart3 size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Super App</p>
                    <p className="text-xs font-bold text-violet-600">6 Modul</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="mt-12 flex justify-center animate-bounce-gentle">
            <MousePointer2 size={18} className="text-slate-300 rotate-180" />
          </div>
        </div>
      </section>

      {/* ═══ TENTANG SMAVO ═══ */}
      <section id="tentang" ref={aboutRef} className="relative z-10 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left — Text */}
            <div>
              <div className="reveal inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 mb-5">
                <Building2 size={12} className="text-indigo-500" />
                <span className="text-xs font-semibold text-indigo-600">Tentang SMAVO</span>
              </div>
              <h2 className="reveal text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-800 mb-5 leading-tight">
                SMAN 2 Cibinong{' '}
                <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  Kabupaten Bogor
                </span>
              </h2>
              <div className="reveal space-y-4 text-slate-500 leading-relaxed text-sm sm:text-base">
                <p>
                  SMAN 2 Cibinong — yang akrab disapa <strong className="text-slate-700">SMAVO</strong> — adalah salah satu
                  sekolah menengah atas negeri unggulan di Kabupaten Bogor, Jawa Barat. Berdiri sejak tahun 1987,
                  SMAVO telah meluluskan ribuan alumni yang tersebar di berbagai bidang profesional.
                </p>
                <p>
                  Dengan semangat inovasi dan teknologi, SMAVO kini hadir dengan{' '}
                  <strong className="text-indigo-600">SMAVO Super App</strong> — platform digital terpadu yang
                  menyatukan seluruh aspek manajemen sekolah dalam satu aplikasi modern.
                </p>
                <p>
                  Dari pengelolaan aset, keuangan BOS, data siswa dan guru, persuratan resmi, hingga
                  pemantauan kedisiplinan — semua terintegrasi, transparan, dan dapat diakses kapan saja.
                </p>
              </div>
            </div>

            {/* Right — School identity card */}
            <div className="reveal">
              <div className="bg-white/80 backdrop-blur border border-slate-100 rounded-3xl p-8 shadow-xl shadow-slate-200/30 relative overflow-hidden">
                {/* Decorative gradient */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-indigo-100 to-transparent rounded-bl-full" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-violet-100 to-transparent rounded-tr-full" />

                <div className="relative z-10">
                  {/* School logo placeholder */}
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                      <span className="text-white font-extrabold text-2xl">S</span>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-lg">SMAN 2 Cibinong</h3>
                      <p className="text-sm text-slate-500">SMAVO &middot; Kab. Bogor</p>
                    </div>
                  </div>

                  {/* Info items */}
                  <div className="space-y-4">
                    {[
                      { icon: MapPin, label: 'Alamat', value: 'Jl. Raya Jakarta-Bogor Km. 43, Cibinong, Bogor' },
                      { icon: BookOpen, label: 'Kurikulum', value: 'Kurikulum Merdeka' },
                      { icon: Award, label: 'Akreditasi', value: 'A (Unggul)' },
                      { icon: Globe, label: 'NPSN', value: '20201485' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-50 to-indigo-50 border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                          <item.icon size={15} className="text-indigo-500" />
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{item.label}</p>
                          <p className="text-sm text-slate-700 font-medium">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SCHOOL FACTS ═══ */}
      <section ref={factsRef} className="relative z-10">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="bg-white/70 backdrop-blur border border-slate-100 rounded-3xl p-8 shadow-xl shadow-slate-200/30">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {SCHOOL_FACTS.map((s, i) => (
                <div key={s.label} className="reveal text-center" style={{ transitionDelay: `${i * 100}ms` }}>
                  <div className={`w-14 h-14 rounded-2xl ${s.bg} flex items-center justify-center mx-auto mb-3`}>
                    <s.icon size={20} className={s.color} />
                  </div>
                  <p className={`text-xl sm:text-2xl font-extrabold ${s.color} mb-0.5`}>{s.value}</p>
                  <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ WHAT IS SMAVO SUPER APP ═══ */}
      <section className="relative z-10 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="reveal bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50 border border-indigo-100/50 rounded-3xl p-8 sm:p-12 relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-10%] w-40 h-40 rounded-full bg-indigo-200/30 blur-3xl" />
            <div className="absolute bottom-[-15%] left-[-8%] w-32 h-32 rounded-full bg-violet-200/30 blur-3xl" />

            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-500/20">
                <Sparkles size={24} className="text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 mb-4">
                Apa itu{' '}
                <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">SMAVO Super App</span>?
              </h2>
              <p className="text-slate-500 leading-relaxed max-w-2xl mx-auto text-sm sm:text-base">
                SMAVO Super App adalah platform manajemen sekolah all-in-one yang dibangun khusus untuk
                SMAN 2 Cibinong. Menggabungkan enam modul utama dalam satu sistem terintegrasi —
                inventaris aset dengan QR Code, pengelolaan keuangan BOS yang transparan,
                database siswa dan guru, persuratan digital otomatis, serta pemantauan kedisiplinan.
                Semua data terpusat, real-time, dan dapat diakses oleh seluruh pihak yang berwenang
                melalui browser — kapan saja, di mana saja.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ MODULES / FEATURES ═══ */}
      <section id="fitur" ref={featuresRef} className="relative z-10 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="reveal inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 mb-4">
              <Package size={12} className="text-indigo-500" />
              <span className="text-xs font-semibold text-indigo-600">6 Modul Terintegrasi</span>
            </div>
            <h2 className="reveal text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-800 mb-4">
              Fitur{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Super App</span>
            </h2>
            <p className="reveal text-slate-500 max-w-lg mx-auto">
              Enam modul utama yang dirancang khusus untuk kebutuhan operasional harian SMAN 2 Cibinong.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {MODULES.map((f, i) => (
              <div
                key={f.title}
                className={`reveal group ${f.bg} border border-white/80 rounded-2xl p-6
                           ${f.border} ${f.shadow} hover:shadow-xl
                           hover:-translate-y-1 transition-all duration-300 cursor-default`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className={`w-11 h-11 rounded-xl ${f.iconBg} flex items-center justify-center mb-4
                               shadow-lg shadow-slate-300/20 group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon size={20} className="text-white" />
                </div>
                <h3 className="font-bold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WHY SUPER APP ═══ */}
      <section ref={whyRef} className="relative z-10 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="reveal inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-full px-4 py-1.5 mb-4">
              <Rocket size={12} className="text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-600">Kenapa Super App?</span>
            </div>
            <h2 className="reveal text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-800">
              Satu Aplikasi,{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Semua Kebutuhan</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {WHY_SUPER_APP.map((b, i) => (
              <div
                key={b.title}
                className="reveal group text-center bg-white/70 backdrop-blur border border-slate-100 rounded-2xl p-6 hover:shadow-xl hover:shadow-slate-200/40 hover:-translate-y-1 transition-all duration-300"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className={`w-14 h-14 rounded-2xl ${b.bg} flex items-center justify-center mx-auto mb-4
                               group-hover:scale-110 transition-transform duration-300`}>
                  <b.icon size={24} className={b.color} />
                </div>
                <h3 className="font-bold text-slate-800 mb-2">{b.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section ref={ctaRef} className="relative z-10 py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-6">
          <div className="reveal relative overflow-hidden rounded-3xl p-10 sm:p-14 text-center">
            {/* Gradient bg */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700" />
            <div className="absolute top-[-30%] right-[-10%] w-[50%] h-[60%] rounded-full bg-white/10 blur-3xl animate-float" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[50%] rounded-full bg-white/10 blur-3xl animate-float-delayed" />
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
                backgroundSize: '48px 48px',
              }}
            />

            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur border border-white/30 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-black/10">
                <span className="text-white font-extrabold text-2xl">S</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
                SMAVO Super App
              </h2>
              <p className="text-indigo-200 text-sm mb-6">
                Siap Digunakan oleh Seluruh Warga SMAN 2 Cibinong
              </p>
              <p className="text-indigo-100 mb-8 max-w-md mx-auto text-sm">
                Masuk ke dashboard dan kelola inventaris, keuangan, data akademik, persuratan, dan kedisiplinan
                dalam satu platform terpadu.
              </p>
              <Link
                href="/login"
                className="group inline-flex items-center gap-3 bg-white font-semibold text-sm text-indigo-600 px-8 py-3.5 rounded-full shadow-xl shadow-black/10 hover:shadow-2xl hover:scale-[1.03] transition-all duration-300 active:scale-[0.98]"
              >
                Masuk Sekarang
                <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="relative z-10 border-t border-slate-100 py-10 bg-white/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <div>
                  <span className="text-slate-800 font-bold text-sm">SMAVO Super App</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Platform manajemen sekolah all-in-one untuk SMAN 2 Cibinong, Kabupaten Bogor.
              </p>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">Kontak Sekolah</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <MapPin size={12} className="text-slate-300 shrink-0" />
                  <span>Jl. Raya Jakarta-Bogor Km. 43, Cibinong</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Phone size={12} className="text-slate-300" />
                  <span>(021) 8752435</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Mail size={12} className="text-slate-300" />
                  <span>info@sman2cibinong.sch.id</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">Tautan</h4>
              <div className="space-y-2">
                <a href="#tentang" className="block text-xs text-slate-400 hover:text-indigo-600 transition-colors">Tentang SMAVO</a>
                <a href="#fitur" className="block text-xs text-slate-400 hover:text-indigo-600 transition-colors">Fitur Super App</a>
                <Link href="/login" className="block text-xs text-slate-400 hover:text-indigo-600 transition-colors">Masuk Dashboard</Link>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-400">
              &copy; {new Date().getFullYear()} SMAVO Super App &mdash; SMAN 2 Cibinong. Hak cipta dilindungi.
            </p>
            <p className="text-[10px] text-slate-300">
              Dibangun dengan Next.js, Express &amp; PostgreSQL
            </p>
          </div>
        </div>
      </footer>

      {/* ═══ REVEAL CSS ═══ */}
      <style jsx global>{`
        .reveal {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1);
        }
        .reveal.revealed {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
