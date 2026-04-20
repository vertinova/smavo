'use client';

import { useQuery } from '@tanstack/react-query';
import { Package, Wallet, GraduationCap, Users, TrendingUp, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const CONDITION_LABEL: Record<string, string> = {
  BAIK: 'Baik',
  RUSAK_RINGAN: 'Rusak Ringan',
  RUSAK_BERAT: 'Rusak Berat',
};

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const raw = localStorage.getItem('smavo_user');
    if (raw) try { setUser(JSON.parse(raw)); } catch { /* */ }
  }, []);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => api.get('/stats').then(r => r.data),
  });

  const s = stats?.data;
  const budgetPct = s?.totalBudget > 0 ? Math.round((s.totalSpent / s.totalBudget) * 100) : 0;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Selamat Pagi';
    if (h < 15) return 'Selamat Siang';
    if (h < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">
          {greeting()}, {user?.fullName?.split(' ')[0] || 'User'}
        </h2>
        <p className="text-muted text-sm mt-1">
          {new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {[
          {
            label: 'Total Aset',
            value: isLoading ? '—' : s?.totalAssets?.toLocaleString('id-ID') ?? '0',
            sub: 'Inventaris aktif',
            icon: Package,
            color: 'bg-blue-500',
            ring: 'ring-blue-500/10',
            href: '/dashboard/assets',
          },
          {
            label: 'Anggaran BOS',
            value: isLoading ? '—' : formatCurrency(s?.totalBudget ?? 0),
            sub: `TA ${s?.fiscalYear ?? new Date().getFullYear()}`,
            icon: Wallet,
            color: 'bg-amber-500',
            ring: 'ring-amber-500/10',
            href: '/dashboard/finance',
          },
          {
            label: 'Siswa Aktif',
            value: isLoading ? '—' : s?.totalStudents?.toLocaleString('id-ID') ?? '0',
            sub: 'Terdaftar aktif',
            icon: GraduationCap,
            color: 'bg-emerald-500',
            ring: 'ring-emerald-500/10',
            href: '/dashboard/students',
          },
          {
            label: 'Guru & GTK',
            value: isLoading ? '—' : s?.totalTeachers?.toLocaleString('id-ID') ?? '0',
            sub: 'Tenaga pendidik',
            icon: Users,
            color: 'bg-violet-500',
            ring: 'ring-violet-500/10',
            href: '/dashboard/teachers',
          },
        ].map((card) => (
          <Link key={card.label} href={card.href} className="card-interactive group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted uppercase tracking-wide">{card.label}</p>
                <p className="text-2xl font-bold text-foreground mt-2 tracking-tight">{card.value}</p>
                <p className="text-xs text-muted mt-1">{card.sub}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center ring-4 ${card.ring}`}>
                <card.icon size={18} className="text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Budget overview - wider */}
        <div className="xl:col-span-2 card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-foreground">Realisasi Anggaran</h3>
            <Link href="/dashboard/finance" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              Lihat detail <ArrowRight size={12} />
            </Link>
          </div>

          <div className="text-center py-2">
            <div className="relative w-28 h-28 mx-auto mb-4">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#e8eaed" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="52" fill="none"
                  stroke={budgetPct > 80 ? '#f43f5e' : '#2d7ff9'}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(budgetPct / 100) * 327} 327`}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-foreground">{isLoading ? '—' : `${budgetPct}%`}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="bg-surface rounded-xl px-3 py-2.5">
                <p className="text-[11px] text-muted uppercase tracking-wide">Anggaran</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">
                  {isLoading ? '—' : formatCurrency(s?.totalBudget ?? 0)}
                </p>
              </div>
              <div className="bg-surface rounded-xl px-3 py-2.5">
                <p className="text-[11px] text-muted uppercase tracking-wide">Terpakai</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">
                  {isLoading ? '—' : formatCurrency(s?.totalSpent ?? 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent assets */}
        <div className="xl:col-span-3 card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-foreground">Aset Terbaru</h3>
            <Link href="/dashboard/assets" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              Lihat semua <ArrowRight size={12} />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-surface rounded-lg animate-pulse" />)}
            </div>
          ) : s?.recentAssets?.length > 0 ? (
            <div className="space-y-2">
              {s.recentAssets.map((a: any) => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Package size={16} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.name}</p>
                    <p className="text-xs text-muted">{a.code} &middot; {a.location}</p>
                  </div>
                  <span className={
                    a.condition === 'BAIK' ? 'badge-success' :
                    a.condition === 'RUSAK_RINGAN' ? 'badge-warning' : 'badge-danger'
                  }>
                    {CONDITION_LABEL[a.condition] || a.condition}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-muted">Belum ada data aset</p>
            </div>
          )}
        </div>
      </div>

      {/* Asset condition breakdown */}
      {s?.assetsByCondition?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-foreground mb-4">Kondisi Aset</h3>
          <div className="flex gap-6 flex-wrap">
            {s.assetsByCondition.map((c: any) => (
              <div key={c.condition} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  c.condition === 'BAIK' ? 'bg-emerald-500' :
                  c.condition === 'RUSAK_RINGAN' ? 'bg-amber-500' : 'bg-rose-500'
                }`} />
                <span className="text-sm text-muted">{CONDITION_LABEL[c.condition] || c.condition}</span>
                <span className="text-sm font-semibold text-foreground">{c._count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
