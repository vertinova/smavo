'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('smavo_token', data.data.accessToken);
      localStorage.setItem('smavo_refresh_token', data.data.refreshToken);
      localStorage.setItem('smavo_user', JSON.stringify(data.data.user));
      toast.success('Berhasil masuk!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Email atau password salah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[55%] bg-sidebar relative overflow-hidden">
        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        {/* Gradient orb */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-white font-extrabold text-base">S</span>
            </div>
            <div>
              <span className="text-white font-bold text-xl tracking-tight">SMAVO</span>
              <span className="block text-white/25 text-[10px] uppercase tracking-[0.2em] leading-none mt-0.5">
                SMAN 2 Cibinong
              </span>
            </div>
          </div>

          <div className="max-w-md">
            <h2 className="text-3xl font-bold text-white leading-tight tracking-tight mb-4">
              Kelola sekolah lebih efisien dengan satu platform.
            </h2>
            <p className="text-white/40 text-sm leading-relaxed">
              Manajemen inventaris aset, pertanggungjawaban dana BOS, data siswa dan guru,
              serta pembuatan surat resmi — semua dalam satu sistem terintegrasi.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4">
              {[
                { val: 'Aset & KIB', desc: 'Inventaris lengkap' },
                { val: 'Dana BOS', desc: 'Keuangan transparan' },
                { val: 'Data Siswa', desc: 'Dapodik terintegrasi' },
                { val: 'Persuratan', desc: 'Generator otomatis' },
              ].map((f) => (
                <div key={f.val} className="bg-white/[0.04] rounded-xl px-4 py-3 border border-white/[0.06]">
                  <p className="text-white/80 text-sm font-medium">{f.val}</p>
                  <p className="text-white/25 text-xs mt-0.5">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/15 text-xs">
            &copy; {new Date().getFullYear()} SMAN 2 Cibinong. Kabupaten Bogor.
          </p>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-extrabold text-sm">S</span>
            </div>
            <span className="text-foreground font-bold text-lg tracking-tight">SMAVO</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Selamat datang
            </h1>
            <p className="text-muted text-sm mt-1.5">
              Masukkan akun Anda untuk melanjutkan
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="nama@smavo.sch.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full justify-center py-3"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Memproses...
                </>
              ) : 'Masuk'}
            </button>
          </form>

          <p className="text-center text-xs text-muted/50 mt-8">
            Hubungi administrator jika Anda lupa password
          </p>
        </div>
      </div>
    </div>
  );
}
