'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Package, Wallet, GraduationCap, Users, ArrowUpRight, TrendingUp, Sparkles,
  Shield, Clock, Shirt, UserX, User, ShieldAlert,
} from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';

function formatCompact(num: number): string {
  if (num >= 1_000_000_000) return `Rp${(num / 1_000_000_000).toFixed(1).replace('.0', '')}M`;
  if (num >= 1_000_000) return `Rp${(num / 1_000_000).toFixed(1).replace('.0', '')}Jt`;
  if (num >= 1_000) return `Rp${(num / 1_000).toFixed(0)}Rb`;
  return `Rp${num}`;
}
import Link from 'next/link';
import { useEffect, useState } from 'react';

const CONDITION_LABEL: Record<string, string> = {
  BAIK: 'Baik', RUSAK_RINGAN: 'Rusak Ringan', RUSAK_BERAT: 'Rusak Berat',
};

const TYPE_MAP: Record<string, { label: string; cls: string; icon: any }> = {
  TERLAMBAT: { label: 'Terlambat', cls: 'badge-warning', icon: Clock },
  ATRIBUT: { label: 'Atribut', cls: 'badge-info', icon: Shirt },
  PERILAKU: { label: 'Perilaku', cls: 'badge-danger', icon: UserX },
};

const CARD_STYLE = {
  green:  { bg: 'bg-green-500/10',  border: 'border-green-500/40',  icon: 'bg-green-500/20 text-green-600',   text: 'text-green-700 dark:text-green-400' },
  yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/40', icon: 'bg-yellow-500/20 text-yellow-600', text: 'text-yellow-700 dark:text-yellow-400' },
  red:    { bg: 'bg-red-500/10',    border: 'border-red-500/40',    icon: 'bg-red-500/20 text-red-600',       text: 'text-red-700 dark:text-red-400' },
};

// ─── STUDENT DASHBOARD ──────────────────────────────────
function StudentDashboard({ user }: { user: any }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['discipline-me'],
    queryFn: () => api.get('/discipline/me').then(r => r.data),
  });

  const myData = data?.data;
  const cardStatus = myData?.cardStatus;
  const cs = cardStatus ? CARD_STYLE[cardStatus.color as keyof typeof CARD_STYLE] : null;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Selamat Pagi';
    if (h < 15) return 'Selamat Siang';
    if (h < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Greeting */}
      <div>
        <p className="text-xs text-muted uppercase tracking-widest mb-1 flex items-center gap-2" suppressHydrationWarning>
          <Sparkles size={12} className="text-accent" />
          {new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
        </p>
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
          <span className="greeting-text" suppressHydrationWarning>
            {greeting()}, {user?.fullName?.split(' ')[0] || 'Siswa'}
          </span>
        </h2>
      </div>

      {/* Student Info */}
      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-28 bg-foreground/[0.03] rounded-2xl animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="card text-center py-10">
          <ShieldAlert size={28} className="mx-auto text-muted/30 mb-3" />
          <p className="text-sm text-muted">Gagal memuat data</p>
        </div>
      ) : (
        <>
          {/* Profile Card */}
          {myData?.student && (
            <div className="card flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                <User size={24} className="text-accent" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground text-lg">{myData.student.fullName}</p>
                <p className="text-sm text-muted">NISN: {myData.student.nisn} · Kelas: {myData.student.class?.name ?? '—'}</p>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat-card stat-card-violet">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center shadow-lg">
                  <ShieldAlert size={18} strokeWidth={1.5} className="text-white" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-extrabold tracking-tight stat-value-violet">{myData?.total ?? 0}</p>
              <p className="text-[11px] stat-card-label uppercase tracking-wider mt-1 font-medium">Total Pelanggaran</p>
            </div>
            {(myData?.byType ?? []).map((t: any) => {
              const tm = TYPE_MAP[t.type] ?? TYPE_MAP.TERLAMBAT;
              const TIcon = tm.icon;
              const colors = t.type === 'TERLAMBAT'
                ? { gradient: 'stat-card-amber', iconBg: 'bg-amber-500', value: 'stat-value-amber' }
                : t.type === 'ATRIBUT'
                ? { gradient: 'stat-card-blue', iconBg: 'bg-blue-500', value: 'stat-value-blue' }
                : { gradient: 'stat-card-emerald', iconBg: 'bg-red-500', value: 'stat-value-emerald' };
              return (
                <div key={t.type} className={`stat-card ${colors.gradient}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl ${colors.iconBg} flex items-center justify-center shadow-lg`}>
                      <TIcon size={18} strokeWidth={1.5} className="text-white" />
                    </div>
                  </div>
                  <p className={`text-xl sm:text-2xl font-extrabold tracking-tight ${colors.value}`}>{t.count}</p>
                  <p className="text-[11px] stat-card-label uppercase tracking-wider mt-1 font-medium">{tm.label}</p>
                </div>
              );
            })}
          </div>

          {/* Card Status */}
          {cardStatus && cs ? (
            <div className={cn('card border-2', cs.border, cs.bg)}>
              <div className="flex items-center gap-4">
                <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0', cs.icon)}>
                  {cardStatus.color === 'green' ? '🟢' : cardStatus.color === 'yellow' ? '🟡' : '🔴'}
                </div>
                <div className="flex-1">
                  <p className={cn('font-bold text-lg leading-tight', cs.text)}>{cardStatus.card}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Tindakan: <span className="font-medium text-foreground">{cardStatus.action}</span>
                  </p>
                  <p className="text-xs text-muted mt-1">{myData?.total ?? 0} pelanggaran tercatat</p>
                </div>
              </div>
              {cardStatus.color === 'red' && (
                <div className="mt-4 pt-4 border-t border-red-500/20">
                  <p className={cn('text-sm font-semibold mb-1', cs.text)}>⚠ Perhatian!</p>
                  <p className="text-sm text-muted-foreground">
                    Kamu telah melebihi batas pelanggaran dan memerlukan pembinaan dari BK, Wakasek Kesiswaan, dan Orang Tua.
                  </p>
                </div>
              )}
              {cardStatus.color === 'yellow' && (
                <div className="mt-4 pt-4 border-t border-yellow-500/20">
                  <p className="text-sm text-muted-foreground">
                    Kamu memerlukan pembinaan dari Wali Kelas. Perhatikan peraturan sekolah.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="card text-center py-10">
              <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                <Shield size={28} className="text-green-600" />
              </div>
              <p className="font-semibold text-foreground mb-1">Tidak Ada Pelanggaran</p>
              <p className="text-sm text-muted">Pertahankan prestasi kedisiplinanmu!</p>
            </div>
          )}

          {/* Recent Violations */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-foreground">Riwayat Pelanggaran Terakhir</p>
              <Link href="/dashboard/discipline" className="text-xs text-accent hover:text-accent-hover transition-colors">
                Semua →
              </Link>
            </div>
            {(myData?.logs?.length ?? 0) === 0 ? (
              <div className="text-center py-8">
                <Shield size={28} className="mx-auto text-muted/30 mb-3" />
                <p className="text-sm text-muted">Belum ada catatan pelanggaran</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(myData?.logs ?? []).slice(0, 5).map((log: any) => {
                  const t = TYPE_MAP[log.type] ?? TYPE_MAP.TERLAMBAT;
                  const TIcon = t.icon;
                  return (
                    <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-foreground/[0.02] border border-border/50">
                      <div className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                        log.type === 'TERLAMBAT' ? 'bg-warning/10' : log.type === 'ATRIBUT' ? 'bg-info/10' : 'bg-danger/10'
                      )}>
                        <TIcon size={15} className={cn(
                          log.type === 'TERLAMBAT' ? 'text-warning' : log.type === 'ATRIBUT' ? 'text-info' : 'text-danger'
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={cn('text-xs font-semibold', t.cls)}>{t.label}</span>
                          <span className="text-[10px] text-muted">
                            {new Date(log.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        {log.notes
                          ? <p className="text-sm text-muted-foreground">{log.notes}</p>
                          : <p className="text-sm text-muted italic">Tidak ada catatan</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── ADMIN/STAFF DASHBOARD ──────────────────────────────
function AdminDashboard({ user }: { user: any }) {
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

  const role = user?.role ?? '';
  const features: string[] = user?.allowedFeatures ?? [];
  const isAdmin = role === 'ADMIN';

  // Role-based access checks
  const canSeeAssets = isAdmin || role === 'STAF_TU';
  const canSeeFinance = isAdmin || role === 'BENDAHARA';
  const canSeeStudents = isAdmin || features.includes('students');
  const canSeeTeachers = isAdmin || features.includes('teachers');
  const canSeeDiscipline = isAdmin || features.includes('discipline');

  // Build stat cards based on role access
  const statCards = [
    canSeeAssets && { label: 'Total Aset', value: isLoading ? '—' : s?.totalAssets?.toLocaleString('id-ID') ?? '0', icon: Package, href: '/dashboard/assets', gradient: 'stat-card-blue', iconBg: 'bg-blue-500', valueColor: 'stat-value-blue' },
    canSeeFinance && { label: 'Anggaran', value: isLoading ? '—' : formatCurrency(s?.totalBudget ?? 0), icon: Wallet, href: '/dashboard/finance', gradient: 'stat-card-emerald', iconBg: 'bg-emerald-500', valueColor: 'stat-value-emerald' },
    canSeeStudents && { label: 'Siswa', value: isLoading ? '—' : s?.totalStudents?.toLocaleString('id-ID') ?? '0', icon: GraduationCap, href: '/dashboard/students', gradient: 'stat-card-violet', iconBg: 'bg-violet-500', valueColor: 'stat-value-violet' },
    canSeeTeachers && { label: 'Guru', value: isLoading ? '—' : s?.totalTeachers?.toLocaleString('id-ID') ?? '0', icon: Users, href: '/dashboard/teachers', gradient: 'stat-card-amber', iconBg: 'bg-amber-500', valueColor: 'stat-value-amber' },
    canSeeDiscipline && { label: 'Kedisiplinan', value: isLoading ? '—' : s?.totalDisciplineLogs?.toLocaleString('id-ID') ?? '0', icon: ShieldAlert, href: '/dashboard/discipline', gradient: 'stat-card-blue', iconBg: 'bg-red-500', valueColor: 'stat-value-blue' },
  ].filter(Boolean) as { label: string; value: string; icon: any; href: string; gradient: string; iconBg: string; valueColor: string }[];

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Greeting */}
      <div>
        <p className="text-xs text-muted uppercase tracking-widest mb-1 flex items-center gap-2" suppressHydrationWarning>
          <Sparkles size={12} className="text-accent" />
          {new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
        </p>
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
          <span className="greeting-text" suppressHydrationWarning>
            {greeting()}, {user?.fullName?.split(' ')[0] || 'User'}
          </span>
        </h2>
        <p className="text-xs text-muted mt-1 capitalize">{role.toLowerCase().replace('_', ' ')}</p>
      </div>

      {/* Stats */}
      {statCards.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {statCards.map((card) => (
            <Link key={card.label} href={card.href}
              className={`group stat-card ${card.gradient}`}>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl ${card.iconBg} flex items-center justify-center shadow-lg`}>
                  <card.icon size={16} strokeWidth={1.5} className="text-white sm:!w-[18px] sm:!h-[18px]" />
                </div>
                <ArrowUpRight size={14} className="stat-card-arrow group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              <p className={`text-sm sm:text-xl font-extrabold tracking-tight ${card.valueColor} truncate leading-tight`}>{card.value}</p>
              <p className="text-[10px] sm:text-[11px] stat-card-label uppercase tracking-wider mt-1 font-medium">{card.label}</p>
            </Link>
          ))}
        </div>
      )}

      {/* Two-column: Budget + Assets (only if user has access) */}
      {(canSeeFinance || canSeeAssets) && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Budget chart */}
          {canSeeFinance && (
            <div className={cn('card', canSeeAssets ? 'lg:col-span-2' : 'lg:col-span-5')}>
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
          )}

          {/* Recent assets */}
          {canSeeAssets && (
            <div className={cn('card', canSeeFinance ? 'lg:col-span-3' : 'lg:col-span-5')}>
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
          )}
        </div>
      )}

      {/* Condition breakdown */}
      {canSeeAssets && s?.assetsByCondition?.length > 0 && (
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

// ─── PAGE WRAPPER ────────────────────────────────────────
export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const raw = localStorage.getItem('smavo_user');
    if (raw) try { setUser(JSON.parse(raw)); } catch { /* */ }
  }, []);

  if (user?.role === 'SISWA') return <StudentDashboard user={user} />;
  return <AdminDashboard user={user} />;
}
