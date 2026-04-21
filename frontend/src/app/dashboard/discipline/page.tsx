'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, Trash2, X, ChevronLeft, ChevronRight,
  AlertTriangle, Clock, Shirt, UserX, BarChart3, Eye, User,
  TrendingUp, TrendingDown, Minus, Calendar, Shield, Award,
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

const TYPE_MAP: Record<string, { label: string; cls: string; icon: any }> = {
  TERLAMBAT: { label: 'Terlambat', cls: 'badge-warning', icon: Clock },
  ATRIBUT: { label: 'Atribut', cls: 'badge-info', icon: Shirt },
  PERILAKU: { label: 'Perilaku', cls: 'badge-danger', icon: UserX },
};

// ─── STUDENT VIEW ───────────────────────────────────────
const CARD_STYLE = {
  green:  { bg: 'bg-green-500/10',  border: 'border-green-500/40',  icon: 'bg-green-500/20 text-green-600',   text: 'text-green-700 dark:text-green-400',  divider: 'border-green-500/20' },
  yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/40', icon: 'bg-yellow-500/20 text-yellow-600', text: 'text-yellow-700 dark:text-yellow-400', divider: 'border-yellow-500/20' },
  red:    { bg: 'bg-red-500/10',    border: 'border-red-500/40',    icon: 'bg-red-500/20 text-red-600',       text: 'text-red-700 dark:text-red-400',      divider: 'border-red-500/20' },
};

function StudentDisciplineView() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['discipline-me'],
    queryFn: () => api.get('/discipline/me').then(r => r.data),
  });

  const myData = data?.data;
  const cardStatus = myData?.cardStatus;
  const cs = cardStatus ? CARD_STYLE[cardStatus.color as keyof typeof CARD_STYLE] : null;

  if (isLoading) return (
    <div className="space-y-4 animate-fadeIn">
      {[1,2,3].map(i => <div key={i} className="h-28 bg-foreground/[0.03] rounded-2xl animate-pulse" />)}
    </div>
  );

  if (error) return (
    <div className="card text-center py-10">
      <AlertTriangle size={28} className="mx-auto text-muted/30 mb-3" />
      <p className="text-sm text-muted">Gagal memuat data disiplin</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <p className="text-[11px] text-muted uppercase tracking-widest mb-1">Kedisiplinan</p>
        <h2 className="text-xl font-bold text-foreground tracking-tight">Riwayat Disiplin Saya</h2>
      </div>

      {/* Student Info */}
      {myData?.student && (
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
            <User size={22} className="text-accent" />
          </div>
          <div>
            <p className="font-bold text-foreground text-base">{myData.student.fullName}</p>
            <p className="text-xs text-muted">NISN: {myData.student.nisn} · Kelas: {myData.student.class?.name ?? '—'}</p>
          </div>
        </div>
      )}

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
            <div className={cn('mt-4 pt-4 border-t', cs.divider)}>
              <p className={cn('text-sm font-semibold mb-1', cs.text)}>⚠ Perhatian!</p>
              <p className="text-sm text-muted-foreground">
                Kamu telah melebihi batas pelanggaran dan memerlukan pembinaan dari BK, Wakasek Kesiswaan, dan Orang Tua.
                Segera temui guru BK untuk tindak lanjut.
              </p>
            </div>
          )}
          {cardStatus.color === 'yellow' && (
            <div className={cn('mt-4 pt-4 border-t', cs.divider)}>
              <p className="text-sm text-muted-foreground">
                Kamu memerlukan pembinaan dari Wali Kelas. Perhatikan peraturan sekolah agar tidak bertambah pelanggaran.
              </p>
            </div>
          )}
          {cardStatus.color === 'green' && (
            <div className={cn('mt-4 pt-4 border-t', cs.divider)}>
              <p className="text-sm text-muted-foreground">
                Kamu sudah mendapatkan kartu hijau. Perbaiki perilaku agar tidak bertambah pelanggaran.
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

      {/* Stats by type - colorful gradient cards */}
      {(myData?.total ?? 0) > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {(myData?.byType ?? []).map((t: any) => {
            const tm = TYPE_MAP[t.type] ?? TYPE_MAP.TERLAMBAT;
            const TIcon = tm.icon;
            const cfg = t.type === 'TERLAMBAT'
              ? { gradient: 'stat-card-amber', iconBg: 'bg-amber-500', valueColor: 'stat-value-amber' }
              : t.type === 'ATRIBUT'
              ? { gradient: 'stat-card-blue', iconBg: 'bg-blue-500', valueColor: 'stat-value-blue' }
              : { gradient: 'stat-card-emerald', iconBg: 'bg-red-500', valueColor: 'stat-value-emerald' };
            return (
              <div key={t.type} className={`stat-card ${cfg.gradient}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-8 h-8 rounded-lg ${cfg.iconBg} flex items-center justify-center shadow-md`}>
                    <TIcon size={14} strokeWidth={1.5} className="text-white" />
                  </div>
                </div>
                <p className={`text-2xl font-extrabold tracking-tight ${cfg.valueColor}`}>{t.count}</p>
                <p className="text-[10px] stat-card-label uppercase tracking-wider mt-1 font-medium">{tm.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Violation history - timeline */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Calendar size={14} className="text-accent" />
          </div>
          <p className="text-sm font-semibold text-foreground">Riwayat Pelanggaran</p>
        </div>
        {(myData?.logs?.length ?? 0) === 0 ? (
          <div className="text-center py-8">
            <Shield size={28} className="mx-auto text-muted/30 mb-3" />
            <p className="text-sm text-muted">Belum ada catatan pelanggaran</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[18px] top-3 bottom-3 w-px bg-border" />
            <div className="space-y-3">
              {(myData?.logs ?? []).map((log: any, idx: number) => {
                const t = TYPE_MAP[log.type] ?? TYPE_MAP.TERLAMBAT;
                const TIcon = t.icon;
                const dotColor = log.type === 'TERLAMBAT' ? 'bg-warning ring-warning/20' :
                                 log.type === 'ATRIBUT' ? 'bg-info ring-info/20' : 'bg-danger ring-danger/20';
                return (
                  <div key={log.id} className="relative flex items-start gap-4 pl-10">
                    {/* Timeline dot */}
                    <div className={cn('absolute left-3.5 top-3 w-2.5 h-2.5 rounded-full ring-4 z-10', dotColor)} />
                    <div className="flex-1 p-3 rounded-xl bg-foreground/[0.02] border border-border/50 hover:bg-foreground/[0.04] transition-colors">
                      <div className="flex items-center justify-between mb-1">
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
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MANAGEMENT VIEW ─────────────────────────────────────
export default function DisciplinePage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [tab, setTab] = useState<'list' | 'summary'>('list');
  const [form, setForm] = useState({
    studentId: '', date: new Date().toISOString().split('T')[0], type: 'TERLAMBAT', notes: '',
  });
  const [studentSearch, setStudentSearch] = useState('');
  const [delId, setDelId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('smavo_user');
    if (raw) {
      try { setUserRole(JSON.parse(raw).role); } catch { /* ignore */ }
    }
  }, []);

  // Fetch logs
  const { data, isLoading } = useQuery({
    queryKey: ['discipline', page, search, typeFilter, classFilter],
    queryFn: () => {
      const p = new URLSearchParams({ page: String(page), limit: '20', sortOrder: 'desc' });
      if (search) p.set('search', search);
      if (typeFilter) p.set('type', typeFilter);
      if (classFilter) p.set('classId', classFilter);
      return api.get(`/discipline?${p}`).then(r => r.data);
    },
    enabled: tab === 'list',
  });

  const list = data?.data ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, total: 0 };

  // Fetch summary
  const { data: summaryData, isLoading: loadingSummary } = useQuery({
    queryKey: ['discipline-summary'],
    queryFn: () => api.get('/discipline/summary').then(r => r.data),
    enabled: tab === 'summary',
  });

  const summary = summaryData?.data;

  // Fetch classes for filter
  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes').then(r => r.data),
  });
  const classes = classesData?.data ?? [];

  // Fetch student discipline detail
  const { data: detailData, isLoading: loadingDetail } = useQuery({
    queryKey: ['discipline-detail', detailId],
    queryFn: () => api.get(`/discipline/student/${detailId}`).then(r => r.data),
    enabled: !!detailId,
  });
  const detail = detailData?.data;

  // Fetch students for modal
  const { data: studentsData } = useQuery({
    queryKey: ['students-search', studentSearch],
    queryFn: () => {
      const p = new URLSearchParams({ limit: '10' });
      if (studentSearch) p.set('search', studentSearch);
      return api.get(`/students?${p}`).then(r => r.data);
    },
    enabled: modal,
  });
  const studentOptions = studentsData?.data ?? [];

  const createM = useMutation({
    mutationFn: (d: any) => api.post('/discipline', d),
    onSuccess: () => {
      toast.success('Pelanggaran berhasil dicatat');
      qc.invalidateQueries({ queryKey: ['discipline'] });
      qc.invalidateQueries({ queryKey: ['discipline-summary'] });
      closeModal();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal mencatat'),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => api.delete(`/discipline/${id}`),
    onSuccess: () => {
      toast.success('Log dihapus');
      qc.invalidateQueries({ queryKey: ['discipline'] });
      qc.invalidateQueries({ queryKey: ['discipline-summary'] });
      setDelId(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal menghapus'),
  });

  const closeModal = () => {
    setModal(false);
    setForm({ studentId: '', date: new Date().toISOString().split('T')[0], type: 'TERLAMBAT', notes: '' });
    setStudentSearch('');
  };

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId) { toast.error('Pilih siswa terlebih dahulu'); return; }
    createM.mutate({
      studentId: form.studentId,
      date: new Date(form.date).toISOString(),
      type: form.type,
      notes: form.notes || undefined,
    });
  };

  // ── Student gets their own read-only view ──
  if (userRole === 'SISWA') return <StudentDisciplineView />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] text-muted uppercase tracking-widest mb-1">Kedisiplinan</p>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Discipline Log</h2>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <Plus size={14} /> Catat Pelanggaran
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card rounded-xl p-1 w-fit border border-border">
        {([['list', 'Riwayat'], ['summary', 'Dashboard']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn(
              'px-4 py-1.5 rounded-md text-[13px] font-medium transition-colors',
              tab === key ? 'bg-accent/10 text-accent' : 'text-muted hover:text-foreground'
            )}>
            {label}
          </button>
        ))}
      </div>

      {/* LIST TAB */}
      {tab === 'list' && (
        <>
          {/* Filters */}
          <div className="card !p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input className="input pl-9" placeholder="Cari nama siswa atau NISN..."
                  value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
              </div>
              <select className="input w-auto" value={typeFilter}
                onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
                <option value="">Semua Jenis</option>
                <option value="TERLAMBAT">Terlambat</option>
                <option value="ATRIBUT">Atribut</option>
                <option value="PERILAKU">Perilaku</option>
              </select>
              <select className="input w-auto" value={classFilter}
                onChange={e => { setClassFilter(e.target.value); setPage(1); }}>
                <option value="">Semua Kelas</option>
                {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="card !p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface/50">
                    <th className="th">Tanggal</th>
                    <th className="th">Siswa</th>
                    <th className="th">Kelas</th>
                    <th className="th">Jenis</th>
                    <th className="th">Catatan</th>
                    <th className="th w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? [...Array(5)].map((_, i) => (
                    <tr key={i} className="tr"><td colSpan={6} className="td"><div className="h-5 bg-foreground/[0.03] rounded animate-pulse" /></td></tr>
                  )) : list.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-16 text-center">
                      <AlertTriangle size={28} className="mx-auto text-muted/30 mb-3" />
                      <p className="text-muted text-sm">Belum ada catatan pelanggaran</p>
                    </td></tr>
                  ) : list.map((log: any) => {
                    const t = TYPE_MAP[log.type] ?? TYPE_MAP.TERLAMBAT;
                    const card = log.cardStatus;
                    const cardDot = card?.color === 'green' ? '🟢' : card?.color === 'yellow' ? '🟡' : card?.color === 'red' ? '🔴' : null;
                    return (
                      <tr key={log.id} className="tr cursor-pointer" onClick={() => setDetailId(log.student?.id)}>
                        <td className="td text-muted text-xs">
                          {new Date(log.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="td">
                          <div className="flex items-center gap-1.5">
                            {cardDot && <span className="text-sm leading-none" title={card?.card}>{cardDot}</span>}
                            <div>
                              <p className="font-medium text-foreground">{log.student?.fullName}</p>
                              <p className="text-[11px] text-muted">{log.student?.nisn}</p>
                            </div>
                          </div>
                        </td>
                        <td className="td text-muted-foreground">{log.student?.class?.name ?? '—'}</td>
                        <td className="td"><span className={t.cls}>{t.label}</span></td>
                        <td className="td text-muted-foreground max-w-[200px] truncate">{log.notes || '—'}</td>
                        <td className="td">
                          <div className="flex items-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); setDetailId(log.student?.id); }}
                              className="p-1.5 rounded-lg hover:bg-accent/10 text-muted hover:text-accent transition-colors" title="Lihat detail">
                              <Eye size={14} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setDelId(log.id); }}
                              className="p-1.5 rounded-lg hover:bg-danger-muted text-muted hover:text-danger transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-xs text-muted">{list.length} dari {meta.total} data</p>
                <div className="flex gap-1">
                  <button className="btn-ghost text-xs px-2 py-1" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <span className="text-xs text-muted px-2 py-1">{page} / {meta.totalPages}</span>
                  <button className="btn-ghost text-xs px-2 py-1" onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page >= meta.totalPages}>
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* SUMMARY TAB */}
      {tab === 'summary' && (
        <div className="space-y-6">
          {/* Overview cards - colorful gradient */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total', value: summary?.total ?? 0, icon: AlertTriangle, gradient: 'stat-card-violet', iconBg: 'bg-violet-500', valueColor: 'stat-value-violet' },
              ...(summary?.byType ?? []).map((t: any) => {
                const cfg = t.type === 'TERLAMBAT'
                  ? { gradient: 'stat-card-amber', iconBg: 'bg-amber-500', valueColor: 'stat-value-amber' }
                  : t.type === 'ATRIBUT'
                  ? { gradient: 'stat-card-blue', iconBg: 'bg-blue-500', valueColor: 'stat-value-blue' }
                  : { gradient: 'stat-card-emerald', iconBg: 'bg-red-500', valueColor: 'stat-value-emerald' };
                return {
                  label: TYPE_MAP[t.type]?.label ?? t.type,
                  value: t.count,
                  icon: TYPE_MAP[t.type]?.icon ?? AlertTriangle,
                  ...cfg,
                };
              }),
            ].map((card, i) => (
              <div key={i} className={`stat-card ${card.gradient}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center shadow-lg`}>
                    <card.icon size={18} strokeWidth={1.5} className="text-white" />
                  </div>
                </div>
                <p className={`text-2xl font-extrabold tracking-tight ${card.valueColor}`}>{card.value}</p>
                <p className="text-[11px] stat-card-label uppercase tracking-wider mt-1 font-medium">{card.label}</p>
              </div>
            ))}
          </div>

          {/* Top offenders - enhanced */}
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center">
                  <TrendingUp size={15} className="text-danger" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Siswa Terbanyak Pelanggaran</h3>
              </div>
            </div>
            {loadingSummary ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-foreground/[0.03] rounded-xl animate-pulse" />)}
              </div>
            ) : (summary?.topStudents?.length ?? 0) > 0 ? (
              <div className="space-y-2">
                {summary.topStudents.map((ts: any, i: number) => {
                  const colors = i === 0 ? 'bg-danger/10 text-danger border-danger/20' :
                                 i === 1 ? 'bg-warning/10 text-warning border-warning/20' :
                                 i === 2 ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                 'bg-foreground/[0.03] text-muted border-border/50';
                  return (
                    <div key={ts.studentId}
                      className={cn('flex items-center gap-3 p-3 rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-card cursor-pointer', colors)}
                      onClick={() => setDetailId(ts.studentId)}>
                      <span className={cn(
                        'w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0',
                        i === 0 ? 'bg-danger text-white' :
                        i === 1 ? 'bg-warning text-white' :
                        i === 2 ? 'bg-amber-500 text-white' :
                        'bg-muted/20 text-muted'
                      )}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{ts.student?.fullName}</p>
                        <p className="text-[11px] text-muted">{ts.student?.class?.name ?? '—'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-foreground">{ts._count.id}</p>
                        <p className="text-[10px] text-muted uppercase tracking-wider">kali</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted text-sm py-8">Belum ada data</p>
            )}
          </div>

          {/* By class - enhanced with bars */}
          {summary?.byClass?.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <BarChart3 size={15} className="text-accent" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Pelanggaran Per Kelas</h3>
              </div>
              <div className="space-y-3">
                {(() => {
                  const grouped: Record<string, Record<string, number>> = {};
                  (summary.byClass ?? []).forEach((r: any) => {
                    if (!grouped[r.class]) grouped[r.class] = {};
                    grouped[r.class][r.type] = r.count;
                  });
                  const entries = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
                  const maxTotal = Math.max(...entries.map(([, types]) =>
                    (types.TERLAMBAT ?? 0) + (types.ATRIBUT ?? 0) + (types.PERILAKU ?? 0)
                  ), 1);

                  return entries.map(([cls, types]) => {
                    const total = (types.TERLAMBAT ?? 0) + (types.ATRIBUT ?? 0) + (types.PERILAKU ?? 0);
                    const pct = (total / maxTotal) * 100;
                    return (
                      <div key={cls} className="group">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-foreground">{cls}</span>
                          <span className="text-xs text-muted font-semibold">{total}</span>
                        </div>
                        <div className="flex h-2.5 rounded-full overflow-hidden bg-foreground/[0.04]">
                          {types.TERLAMBAT > 0 && (
                            <div className="bg-warning h-full transition-all duration-700" style={{ width: `${(types.TERLAMBAT / maxTotal) * 100}%` }} title={`Terlambat: ${types.TERLAMBAT}`} />
                          )}
                          {types.ATRIBUT > 0 && (
                            <div className="bg-info h-full transition-all duration-700" style={{ width: `${(types.ATRIBUT / maxTotal) * 100}%` }} title={`Atribut: ${types.ATRIBUT}`} />
                          )}
                          {types.PERILAKU > 0 && (
                            <div className="bg-danger h-full transition-all duration-700" style={{ width: `${(types.PERILAKU / maxTotal) * 100}%` }} title={`Perilaku: ${types.PERILAKU}`} />
                          )}
                        </div>
                        <div className="flex gap-3 mt-1">
                          {types.TERLAMBAT > 0 && <span className="text-[10px] text-warning font-medium">Terlambat: {types.TERLAMBAT}</span>}
                          {types.ATRIBUT > 0 && <span className="text-[10px] text-info font-medium">Atribut: {types.ATRIBUT}</span>}
                          {types.PERILAKU > 0 && <span className="text-[10px] text-danger font-medium">Perilaku: {types.PERILAKU}</span>}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-warning" /><span className="text-[10px] text-muted">Terlambat</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-info" /><span className="text-[10px] text-muted">Atribut</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-danger" /><span className="text-[10px] text-muted">Perilaku</span></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={closeModal}>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" />
          <div className="relative bg-card border border-border rounded-2xl shadow-modal w-full max-w-md animate-slideUp" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Catat Pelanggaran</h3>
              <button onClick={closeModal} className="p-1 rounded-lg hover:bg-foreground/[0.06] text-muted"><X size={16} /></button>
            </div>
            <form onSubmit={submit}>
              <div className="p-6 space-y-4">
                {/* Student search */}
                <div>
                  <label className="label">Siswa *</label>
                  <input className="input" placeholder="Ketik nama atau NISN..."
                    value={studentSearch} onChange={e => setStudentSearch(e.target.value)} />
                  {studentSearch && studentOptions.length > 0 && !form.studentId && (
                    <div className="border border-border rounded-lg mt-1 max-h-40 overflow-y-auto bg-card">
                      {studentOptions.map((s: any) => (
                        <button key={s.id} type="button"
                          className="w-full text-left px-3 py-2 hover:bg-foreground/[0.04] text-sm transition-colors"
                          onClick={() => { set('studentId', s.id); setStudentSearch(s.fullName); }}>
                          <span className="font-medium text-foreground">{s.fullName}</span>
                          <span className="text-[11px] text-muted ml-2">{s.nisn} · {s.class?.name ?? '—'}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {form.studentId && (
                    <button type="button" className="text-[11px] text-muted hover:text-foreground mt-1"
                      onClick={() => { set('studentId', ''); setStudentSearch(''); }}>
                      × Ganti siswa
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Tanggal *</label>
                    <input type="date" className="input" required value={form.date} onChange={e => set('date', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Jenis *</label>
                    <select className="input" value={form.type} onChange={e => set('type', e.target.value)}>
                      <option value="TERLAMBAT">Terlambat</option>
                      <option value="ATRIBUT">Atribut</option>
                      <option value="PERILAKU">Perilaku</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Catatan</label>
                  <textarea className="input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)}
                    placeholder="Rambut gondrong, tidak pakai kacu, dll..." />
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
                <button type="button" onClick={closeModal} className="btn-secondary">Batal</button>
                <button type="submit" className="btn-primary" disabled={createM.isPending}>
                  {createM.isPending ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setDetailId(null)}>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" />
          <div className="relative bg-card border border-border rounded-2xl shadow-modal w-full max-w-lg max-h-[85vh] flex flex-col animate-slideUp" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <h3 className="font-semibold text-foreground">Detail Pelanggaran Siswa</h3>
              <button onClick={() => setDetailId(null)} className="p-1 rounded-lg hover:bg-foreground/[0.06] text-muted"><X size={16} /></button>
            </div>

            {loadingDetail ? (
              <div className="p-6 space-y-4">
                <div className="h-16 bg-foreground/[0.03] rounded-xl animate-pulse" />
                <div className="h-8 bg-foreground/[0.03] rounded-xl animate-pulse" />
                <div className="h-32 bg-foreground/[0.03] rounded-xl animate-pulse" />
              </div>
            ) : detail ? (
              <div className="flex-1 overflow-y-auto">
                {/* Student Info */}
                <div className="px-6 pt-5 pb-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                      <User size={20} className="text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground text-base truncate">{detail.student?.fullName}</p>
                      <p className="text-xs text-muted">NISN: {detail.student?.nisn} · Kelas: {detail.student?.class?.name ?? '—'}</p>
                    </div>
                  </div>

                  {/* Summary badges */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="badge-neutral">Total: {detail.total} pelanggaran</span>
                    {detail.byType?.map((t: any) => {
                      const tm = TYPE_MAP[t.type] ?? TYPE_MAP.TERLAMBAT;
                      return <span key={t.type} className={tm.cls}>{tm.label}: {t.count}</span>;
                    })}
                  </div>

                  {/* Card Status */}
                  {detail.cardStatus ? (
                    <div className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl border-2 mb-1',
                      detail.cardStatus.color === 'green' && 'border-green-500/40 bg-green-500/10',
                      detail.cardStatus.color === 'yellow' && 'border-yellow-500/40 bg-yellow-500/10',
                      detail.cardStatus.color === 'red' && 'border-red-500/40 bg-red-500/10',
                    )}>
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold shrink-0',
                        detail.cardStatus.color === 'green' && 'bg-green-500/20 text-green-600',
                        detail.cardStatus.color === 'yellow' && 'bg-yellow-500/20 text-yellow-600',
                        detail.cardStatus.color === 'red' && 'bg-red-500/20 text-red-600',
                      )}>
                        {detail.cardStatus.color === 'green' ? '🟢' : detail.cardStatus.color === 'yellow' ? '🟡' : '🔴'}
                      </div>
                      <div>
                        <p className={cn(
                          'font-bold text-sm',
                          detail.cardStatus.color === 'green' && 'text-green-700 dark:text-green-400',
                          detail.cardStatus.color === 'yellow' && 'text-yellow-700 dark:text-yellow-400',
                          detail.cardStatus.color === 'red' && 'text-red-700 dark:text-red-400',
                        )}>{detail.cardStatus.card}</p>
                        <p className="text-xs text-muted">{detail.cardStatus.action}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-foreground/[0.02] border border-border">
                      <span className="text-sm text-muted">Belum ada pelanggaran</span>
                    </div>
                  )}
                </div>

                {/* Logs list */}
                <div className="px-6 pb-6">
                  <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">Riwayat Pelanggaran</p>
                  {detail.logs?.length === 0 ? (
                    <p className="text-sm text-muted text-center py-6">Belum ada catatan</p>
                  ) : (
                    <div className="space-y-2">
                      {detail.logs.map((log: any) => {
                        const t = TYPE_MAP[log.type] ?? TYPE_MAP.TERLAMBAT;
                        const TIcon = t.icon;
                        return (
                          <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-foreground/[0.02] border border-border/50 hover:bg-foreground/[0.04] transition-colors">
                            <div className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                              log.type === 'TERLAMBAT' ? 'bg-warning/10' :
                              log.type === 'ATRIBUT' ? 'bg-info/10' : 'bg-danger/10'
                            )}>
                              <TIcon size={14} className={cn(
                                log.type === 'TERLAMBAT' ? 'text-warning' :
                                log.type === 'ATRIBUT' ? 'text-info' : 'text-danger'
                              )} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className={cn('text-xs font-semibold', t.cls)}>{t.label}</span>
                                <span className="text-[10px] text-muted">
                                  {new Date(log.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                              {log.notes ? (
                                <p className="text-sm text-muted-foreground">{log.notes}</p>
                              ) : (
                                <p className="text-sm text-muted italic">Tidak ada catatan</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center">
                <AlertTriangle size={28} className="mx-auto text-muted/30 mb-3" />
                <p className="text-sm text-muted">Data tidak ditemukan</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {delId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setDelId(null)}>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" />
          <div className="relative bg-card border border-border rounded-2xl shadow-modal w-full max-w-sm p-6 animate-slideUp" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-foreground mb-2">Hapus Log?</h3>
            <p className="text-sm text-muted mb-6">Catatan pelanggaran ini akan dihapus permanen.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDelId(null)} className="btn-secondary">Batal</button>
              <button onClick={() => deleteM.mutate(delId)} className="btn-danger" disabled={deleteM.isPending}>
                {deleteM.isPending ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
