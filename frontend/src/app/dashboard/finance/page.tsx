'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet, TrendingDown, CheckCircle, Plus, X, Receipt } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

const COMP: Record<string, string> = {
  HONORARIUM: 'Honorarium', PEMELIHARAAN: 'Pemeliharaan', ATK: 'ATK',
  BAHAN_HABIS_PAKAI: 'Bahan Habis Pakai', DAYA_JASA: 'Daya & Jasa',
  PERJALANAN_DINAS: 'Perjalanan Dinas', PENGEMBANGAN_GTK: 'Pengembangan GTK',
  KEGIATAN_SISWA: 'Kegiatan Siswa', LANGGANAN: 'Langganan', LAINNYA: 'Lainnya',
};
const FUND: Record<string, string> = {
  BOS_REGULER: 'BOS Reguler', BOS_KINERJA: 'BOS Kinerja', BOS_AFIRMASI: 'BOS Afirmasi',
  APBD: 'APBD', KOMITE: 'Komite', LAINNYA: 'Lainnya',
};
const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: 'Draft', cls: 'badge-neutral' },
  PENDING: { label: 'Menunggu', cls: 'badge-warning' },
  APPROVED: { label: 'Disetujui', cls: 'badge-success' },
  REJECTED: { label: 'Ditolak', cls: 'badge-danger' },
};

const EMPTY_EXP = {
  description: '', amount: '', taxType: 'NONE' as string, component: 'ATK' as string,
  fundSource: 'BOS_REGULER' as string, transactionDate: new Date().toISOString().split('T')[0],
  vendor: '', notes: '', rkasItemId: '',
};

export default function FinancePage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'rkas' | 'expenses'>('rkas');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY_EXP);
  const [expPage, setExpPage] = useState(1);

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['finance', 'summary'],
    queryFn: () => api.get('/finance/summary').then(r => r.data),
  });

  const { data: rkasData } = useQuery({
    queryKey: ['finance', 'rkas'],
    queryFn: () => api.get('/finance/rkas').then(r => r.data),
  });

  const { data: expData, isLoading: loadingExp } = useQuery({
    queryKey: ['expenses', expPage],
    queryFn: () => api.get(`/finance/expenses?page=${expPage}&limit=20&sortOrder=desc`).then(r => r.data),
    enabled: tab === 'expenses',
  });

  const createExp = useMutation({
    mutationFn: (d: any) => api.post('/finance/expenses', d),
    onSuccess: () => {
      toast.success('Pengeluaran berhasil ditambahkan');
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['finance'] });
      setModal(false); setForm(EMPTY_EXP);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal menambah pengeluaran'),
  });

  const approveExp = useMutation({
    mutationFn: (id: string) => api.patch(`/finance/expenses/${id}/approve`),
    onSuccess: () => {
      toast.success('Pengeluaran disetujui');
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['finance'] });
    },
  });

  const budget = Number(summary?.data?.totalBudget ?? 0);
  const spent = Number(summary?.data?.totalSpent ?? 0);
  const remaining = budget - spent;
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const submitExp = (e: React.FormEvent) => {
    e.preventDefault();
    createExp.mutate({
      ...form,
      amount: Number(form.amount),
      transactionDate: new Date(form.transactionDate).toISOString(),
      rkasItemId: form.rkasItemId || undefined,
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] text-muted uppercase tracking-widest mb-1">Keuangan</p>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Dana BOS</h2>
        </div>
        <button className="btn-primary" onClick={() => { setForm(EMPTY_EXP); setModal(true); }}>
          <Plus size={14} /> Catat Pengeluaran
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: 'Total Anggaran', value: budget, icon: Wallet, iconColor: 'text-accent', iconBg: 'bg-accent/10' },
          { label: 'Terpakai', value: spent, icon: TrendingDown, iconColor: 'text-warning', iconBg: 'bg-warning/10' },
          { label: 'Sisa Anggaran', value: remaining, icon: CheckCircle, iconColor: 'text-success', iconBg: 'bg-success/10' },
        ].map(c => (
          <div key={c.label} className="card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] text-muted uppercase tracking-widest">{c.label}</span>
              <div className={`w-8 h-8 rounded-lg ${c.iconBg} flex items-center justify-center`}>
                <c.icon size={14} className={c.iconColor} strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-xl font-bold text-foreground tracking-tight">
              {loadingSummary ? '—' : formatCurrency(c.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card rounded-xl p-1 w-fit border border-border">
        {(['rkas', 'expenses'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t ? 'bg-accent/10 text-accent' : 'text-muted hover:text-foreground'
            }`}>
            {t === 'rkas' ? 'RKAS' : 'Pengeluaran'}
          </button>
        ))}
      </div>

      {/* RKAS Tab */}
      {tab === 'rkas' && (
        <div className="card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/50">
                  <th className="th">Komponen</th>
                  <th className="th">Uraian</th>
                  <th className="th text-right">Anggaran</th>
                  <th className="th text-right">Terpakai</th>
                  <th className="th text-right">Sisa</th>
                  <th className="th w-36">Realisasi</th>
                </tr>
              </thead>
              <tbody>
                {rkasData?.data?.items?.map((item: any) => {
                  const b = Number(item.budgetAmount), s = Number(item.spentAmount);
                  const pct = b > 0 ? Math.round((s / b) * 100) : 0;
                  return (
                    <tr key={item.id} className="tr">
                      <td className="td"><span className="badge-info">{COMP[item.component] ?? item.component}</span></td>
                      <td className="td text-foreground">{item.description}</td>
                      <td className="td text-right font-medium">{formatCurrency(b)}</td>
                      <td className="td text-right text-muted">{formatCurrency(s)}</td>
                      <td className="td text-right text-success font-medium">{formatCurrency(b - s)}</td>
                      <td className="td">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-border rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full transition-all ${pct > 80 ? 'bg-danger' : 'bg-accent'}`}
                              style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                          <span className="text-[11px] text-muted w-8 text-right">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!rkasData?.data?.items?.length && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-muted">Belum ada data RKAS</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expenses Tab */}
      {tab === 'expenses' && (
        <div className="card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/50">
                  <th className="th">Tanggal</th>
                  <th className="th">Deskripsi</th>
                  <th className="th">Komponen</th>
                  <th className="th text-right">Jumlah</th>
                  <th className="th">Pajak</th>
                  <th className="th text-right">Total</th>
                  <th className="th">Status</th>
                  <th className="th w-20"></th>
                </tr>
              </thead>
              <tbody>
                {loadingExp ? [...Array(3)].map((_, i) => (
                  <tr key={i} className="tr"><td colSpan={8} className="td"><div className="h-5 bg-surface rounded animate-pulse" /></td></tr>
                )) : (expData?.data ?? []).length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center">
                    <Receipt size={32} className="mx-auto text-muted/30 mb-2" />
                    <p className="text-muted text-sm">Belum ada pengeluaran</p>
                  </td></tr>
                ) : (expData?.data ?? []).map((ex: any) => {
                  const st = STATUS_MAP[ex.status] ?? STATUS_MAP.DRAFT;
                  return (
                    <tr key={ex.id} className="tr">
                      <td className="td text-muted text-xs">{new Date(ex.transactionDate).toLocaleDateString('id-ID')}</td>
                      <td className="td font-medium text-foreground">{ex.description}</td>
                      <td className="td"><span className="badge-info text-[10px]">{COMP[ex.component] ?? ex.component}</span></td>
                      <td className="td text-right">{formatCurrency(Number(ex.amount))}</td>
                      <td className="td text-muted text-xs">{ex.taxType !== 'NONE' ? ex.taxType : '—'}</td>
                      <td className="td text-right font-medium">{formatCurrency(Number(ex.totalAmount))}</td>
                      <td className="td"><span className={st.cls}>{st.label}</span></td>
                      <td className="td">
                        {ex.status === 'DRAFT' && (
                          <button onClick={() => approveExp.mutate(ex.id)}
                            className="text-xs text-accent font-medium hover:underline">
                            Setujui
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setModal(false)}>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" />
          <div className="relative bg-card border border-border rounded-2xl shadow-modal w-full max-w-lg animate-slideUp" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Catat Pengeluaran</h3>
              <button onClick={() => setModal(false)} className="p-1 rounded-lg hover:bg-foreground/[0.06] text-muted"><X size={18} /></button>
            </div>
            <form onSubmit={submitExp}>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div><label className="label">Deskripsi *</label><input className="input" required value={form.description} onChange={e => set('description', e.target.value)} placeholder="Pembelian ATK" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label">Jumlah (Rp) *</label><input type="number" className="input" required value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0" /></div>
                  <div><label className="label">Tanggal *</label><input type="date" className="input" required value={form.transactionDate} onChange={e => set('transactionDate', e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label">Komponen *</label><select className="input" value={form.component} onChange={e => set('component', e.target.value)}>
                    {Object.entries(COMP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select></div>
                  <div><label className="label">Sumber Dana *</label><select className="input" value={form.fundSource} onChange={e => set('fundSource', e.target.value)}>
                    {Object.entries(FUND).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label">Pajak</label><select className="input" value={form.taxType} onChange={e => set('taxType', e.target.value)}>
                    <option value="NONE">Tanpa Pajak</option><option value="PPN">PPN 11%</option>
                    <option value="PPH21">PPH 21</option><option value="PPH22">PPH 22</option><option value="PPH23">PPH 23</option>
                  </select></div>
                  <div><label className="label">Vendor</label><input className="input" value={form.vendor} onChange={e => set('vendor', e.target.value)} placeholder="Nama vendor" /></div>
                </div>
                {rkasData?.data?.items?.length > 0 && (
                  <div><label className="label">RKAS Item (opsional)</label><select className="input" value={form.rkasItemId} onChange={e => set('rkasItemId', e.target.value)}>
                    <option value="">— Tidak ditautkan —</option>
                    {rkasData.data.items.map((it: any) => <option key={it.id} value={it.id}>{COMP[it.component] ?? it.component} — {it.description}</option>)}
                  </select></div>
                )}
                <div><label className="label">Catatan</label><textarea className="input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary">Batal</button>
                <button type="submit" className="btn-primary" disabled={createExp.isPending}>
                  {createExp.isPending ? 'Menyimpan...' : 'Simpan Pengeluaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
