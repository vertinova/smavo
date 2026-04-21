'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { isStandaloneMode } from '@/lib/pwa';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // PWA gate: only allow login in standalone/installed mode
  useEffect(() => {
    if (!isStandaloneMode()) {
      router.replace('/');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('smavo_token', data.data.accessToken);
      localStorage.setItem('smavo_refresh_token', data.data.refreshToken);
      localStorage.setItem('smavo_user', JSON.stringify(data.data.user));
      localStorage.removeItem('smavo_pw_changed');
      toast.success('Berhasil masuk!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Email atau password salah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed top-[-40%] right-[-20%] w-[70vw] h-[70vw] rounded-full bg-accent/[0.05] blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-30%] left-[-15%] w-[50vw] h-[50vw] rounded-full bg-purple-600/[0.04] blur-[120px] pointer-events-none" />

      {/* Grid */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)', backgroundSize: '64px 64px' }}
      />

      {/* Corner logo */}
      <div className="fixed top-6 left-6 sm:top-8 sm:left-8 flex items-center gap-2.5 sm:gap-3 z-20">
        <Image src="/logo-smavo.jpeg" alt="SMAVO" width={36} height={36} className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover shadow-md" />
        <div>
          <span className="text-foreground font-bold text-xs sm:text-sm tracking-tight">SMAVO</span>
          <span className="block text-[9px] sm:text-[10px] text-muted tracking-widest uppercase">SMAN 2 Cibinong</span>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-sm animate-fadeIn">
        {/* Glass card */}
        <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-modal">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Selamat Datang
            </h1>
            <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
              Masuk dengan akun yang terdaftar di sistem.
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
                  placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;"
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
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full justify-center py-3 rounded-xl"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  Masuk
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-muted mt-6">
            Lupa password? Hubungi administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
