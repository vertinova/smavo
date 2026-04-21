'use client';

import { useQuery } from '@tanstack/react-query';
import { Package, Wallet, GraduationCap, Users, ArrowUpRight, TrendingUp, Sparkles } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const CONDITION_LABEL: Record<string, string> = {
  BAIK: 'Baik', RUSAK_RINGAN: 'Rusak Ringan', RUSAK_BERAT: 'Rusak Berat',
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
    <div className="space-y-5 animate-fadeIn">
      {/* Greeting */}
      <div>
        <p className="text-xs text-muted uppercase tracking-widest mb-1 flex items-center gap-2">
          <Sparkles size={12} className="text-accent" />
          {new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
        </p>
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
          <span className="greeting-text">
            {greeting()}, {user?.fullName?.split(' ')[0] || 'User'}
          </span>
        </h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Aset', value: isLoading ? '—' : s?.totalAssets?.toLocaleString('id-ID') ?? '0', icon: Package, href: '/dashboard/assets', gradient: 'stat-card-blue', iconBg: 'bg-blue-500', valueColor: 'stat-value-blue' },
          { label: 'Anggaran', value: isLoading ? '—' : formatCurrency(s?.totalBudget ?? 0), icon: Wallet, href: '/dashboard/finance', gradient: 'stat-card-emerald', iconBg: 'bg-emerald-500', valueColor: 'stat-value-emerald' },
          { label: 'Siswa', value: isLoading ? '—' : s?.totalStudents?.toLocaleString('id-ID') ?? '0', icon: GraduationCap, href: '/dashboard/students', gradient: 'stat-card-violet', iconBg: 'bg-violet-500', valueColor: 'stat-value-violet' },
          { label: 'Guru', value: isLoading ? '—' : s?.totalTeachers?.toLocaleString('id-ID') ?? '0', icon: Users, href: '/dashboard/teachers', gradient: 'stat-card-amber', iconBg: 'bg-amber-500', valueColor: 'stat-value-amber' },
        ].map((card) => (
          <Link key={card.label} href={card.href}
            className={`group stat-card ${card.gradient}`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center shadow-lg`}>
                <card.icon size={18} strokeWidth={1.5} className="text-white" />
              </div>
              <ArrowUpRight size={14} className="stat-card-arrow group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <p className={`text-xl sm:text-2xl font-extrabold tracking-tight ${card.valueColor}`}>{card.value}</p>
            <p className="text-[11px] stat-card-label uppercase tracking-wider mt-1 font-medium">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Two-column */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Budget */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-foreground">Realisasi Anggaran</h3>
            <Link href="/dashboard/finance" className="text-xs text-accent hover:text-accent-hover transition-colors">
              Detail →
            </Link>
          </div>

          <div className="text-center">
            <div className="relative w-28 h-28 mx-auto mb-5">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgb(var(--border))" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r="52" fill="none"
                  stroke={budgetPct > 80 ? 'rgb(var(--danger))' : 'rgb(var(--accent))'}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${(budgetPct / 100) * 327} 327`}
                  className="transition-all duration-700"
                  style={{ filter: `drop-shadow(0 0 6px ${budgetPct > 80 ? 'rgb(var(--danger) / 0.4)' : 'rgb(var(--accent) / 0.4)'})` }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-foreground">{isLoading ? '—' : `${budgetPct}%`}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-accent/[0.06] rounded-xl border border-accent/10 px-3 py-2.5">
                <p className="text-[10px] text-muted uppercase tracking-widest">Anggaran</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">
                  {isLoading ? '—' : formatCurrency(s?.totalBudget ?? 0)}
                </p>
              </div>
              <div className="bg-warning/[0.06] rounded-xl border border-warning/10 px-3 py-2.5">
                <p className="text-[10px] text-muted uppercase tracking-widest">Terpakai</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">
                  {isLoading ? '—' : formatCurrency(s?.totalSpent ?? 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent assets */}
        <div className="lg:col-span-3 card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-foreground">Aset Terbaru</h3>
            <Link href="/dashboard/assets" className="text-xs text-accent hover:text-accent-hover transition-colors">
              Semua →
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-foreground/[0.03] rounded-xl animate-pulse" />)}
            </div>
          ) : s?.recentAssets?.length > 0 ? (
            <div className="space-y-1">
              {s.recentAssets.map((a: any) => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-foreground/[0.03] transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                    <Package size={14} className="text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.name}</p>
                    <p className="text-xs text-muted">{a.code} · {a.location}</p>
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
              <Package size={28} className="mx-auto text-muted/30 mb-2" />
              <p className="text-sm text-muted">Belum ada data aset</p>
            </div>
          )}
        </div>
      </div>

      {/* Condition breakdown */}
      {s?.assetsByCondition?.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Kondisi Aset</h3>
          <div className="flex gap-6 flex-wrap">
            {s.assetsByCondition.map((c: any) => (
              <div key={c.condition} className="flex items-center gap-2.5">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  c.condition === 'BAIK' ? 'bg-success' :
                  c.condition === 'RUSAK_RINGAN' ? 'bg-warning' : 'bg-danger'
                }`} />
                <span className="text-sm text-muted-foreground">{CONDITION_LABEL[c.condition] || c.condition}</span>
                <span className="text-sm font-semibold text-foreground">{c._count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
