'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, QrCode, Pencil, Trash2, X, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const CONDITION_MAP: Record<string, { label: string; cls: string }> = {
  BAIK: { label: 'Baik', cls: 'badge-success' },
  RUSAK_RINGAN: { label: 'Rusak Ringan', cls: 'badge-warning' },
  RUSAK_BERAT: { label: 'Rusak Berat', cls: 'badge-danger' },
};
const FUND: Record<string, string> = {
  BOS_REGULER: 'BOS Reguler', BOS_KINERJA: 'BOS Kinerja', BOS_AFIRMASI: 'BOS Afirmasi',
  APBD: 'APBD', KOMITE: 'Komite', LAINNYA: 'Lainnya',
};

const EMPTY = {
  code: '', name: '', kibType: 'KIB_B' as string, brand: '', specification: '',
  acquisitionDate: '', acquisitionCost: '', fundSource: 'BOS_REGULER' as string,
  budgetYear: new Date().getFullYear(), location: '', condition: 'BAIK' as string,
  quantity: 1, unit: 'unit', notes: '',
};

export default function AssetsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [kibF, setKibF] = useState('');
  const [condF, setCondF] = useState('');
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [delId, setDelId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['assets', page, search, kibF, condF],
    queryFn: () => {
      const p = new URLSearchParams({ page: String(page), limit: '20', sortBy: 'createdAt', sortOrder: 'desc' });
      if (search) p.set('search', search);
      if (kibF) p.set('kibType', kibF);
      if (condF) p.set('condition', condF);
      return api.get(`/assets?${p}`).then(r => r.data);
    },
  });

  const list = data?.data ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, total: 0 };

  const createM = useMutation({
    mutationFn: (d: any) => api.post('/assets', d),
    onSuccess: () => { toast.success('Aset berhasil ditambahkan'); qc.invalidateQueries({ queryKey: ['assets'] }); close(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal menambah aset'),
  });

  const updateM = useMutation({
    mutationFn: ({ id, d }: { id: string; d: any }) => api.patch(`/assets/${id}`, d),
    onSuccess: () => { toast.success('Aset diperbarui'); qc.invalidateQueries({ queryKey: ['assets'] }); close(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal memperbarui'),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => api.delete(`/assets/${id}`),
    onSuccess: () => { toast.success('Aset dihapus'); qc.invalidateQueries({ queryKey: ['assets'] }); setDelId(null); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal menghapus'),
  });

  const close = () => { setModal(false); setEditId(null); setForm(EMPTY); };

  const openEdit = (a: any) => {
    setForm({
      code: a.code, name: a.name, kibType: a.kibType, brand: a.brand || '',
      specification: a.specification || '',
      acquisitionDate: a.acquisitionDate ? a.acquisitionDate.split('T')[0] : '',
      acquisitionCost: a.acquisitionCost ? String(a.acquisitionCost) : '',
      fundSource: a.fundSource, budgetYear: a.budgetYear, location: a.location,
      condition: a.condition, quantity: a.quantity, unit: a.unit, notes: a.notes || '',
    });
    setEditId(a.id);
    setModal(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      ...form,
      acquisitionCost: form.acquisitionCost ? Number(form.acquisitionCost) : undefined,
      acquisitionDate: form.acquisitionDate ? new Date(form.acquisitionDate).toISOString() : undefined,
      budgetYear: Number(form.budgetYear),
      quantity: Number(form.quantity),
    };
    if (editId) updateM.mutate({ id: editId, d: payload });
    else createM.mutate(payload);
  };

  const showQr = async (id: string) => {
    try {
      const { data } = await api.get(`/assets/${id}/qr`);
      setQrUrl(data.data.qrCodeUrl);
    } catch { toast.error('Gagal generate QR'); }
  };

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Inventaris Aset</h2>
          <p className="text-sm text-muted mt-0.5">Kelola barang milik sekolah (KIB B &amp; KIB E)</p>
        </div>
        <button className="btn-primary" onClick={() => { setForm(EMPTY); setEditId(null); setModal(true); }}>
          <Plus size={16} /> Tambah Aset
        </button>
      </div>

      {/* Filters */}
      <div className="card !p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input className="input pl-9" placeholder="Cari kode, nama, atau lokasi..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="input w-auto" value={kibF} onChange={e => { setKibF(e.target.value); setPage(1); }}>
            <option value="">Semua Tipe</option>
            <option value="KIB_B">KIB B — Peralatan</option>
            <option value="KIB_E">KIB E — Aset Lainnya</option>
          </select>
          <select className="input w-auto" value={condF} onChange={e => { setCondF(e.target.value); setPage(1); }}>
            <option value="">Semua Kondisi</option>
            <option value="BAIK">Baik</option>
            <option value="RUSAK_RINGAN">Rusak Ringan</option>
            <option value="RUSAK_BERAT">Rusak Berat</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/50">
                <th className="th">Kode</th>
                <th className="th">Nama Barang</th>
                <th className="th">Tipe</th>
                <th className="th">Sumber Dana</th>
                <th className="th">Kondisi</th>
                <th className="th">Lokasi</th>
                <th className="th text-right">Nilai</th>
                <th className="th w-24"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? [...Array(5)].map((_, i) => (
                <tr key={i} className="tr"><td colSpan={8} className="td"><div className="h-5 bg-surface rounded animate-pulse" /></td></tr>
              )) : list.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-16 text-center">
                  <Package size={36} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-muted text-sm">Belum ada data aset</p>
                  <button className="btn-primary mt-4 text-xs" onClick={() => { setForm(EMPTY); setModal(true); }}>
                    <Plus size={14} /> Tambah Aset Pertama
                  </button>
                </td></tr>
              ) : list.map((a: any) => (
                <tr key={a.id} className="tr">
                  <td className="td font-mono text-xs text-muted">{a.code}</td>
                  <td className="td font-medium text-foreground">{a.name}</td>
                  <td className="td"><span className="badge-info">{a.kibType === 'KIB_B' ? 'KIB B' : 'KIB E'}</span></td>
                  <td className="td text-muted">{FUND[a.fundSource] ?? a.fundSource}</td>
                  <td className="td"><span className={CONDITION_MAP[a.condition]?.cls ?? 'badge-neutral'}>{CONDITION_MAP[a.condition]?.label ?? a.condition}</span></td>
                  <td className="td text-muted">{a.location}</td>
                  <td className="td text-right text-foreground">{a.acquisitionCost ? formatCurrency(Number(a.acquisitionCost)) : '—'}</td>
                  <td className="td">
                    <div className="flex gap-0.5 justify-end">
                      <button onClick={() => showQr(a.id)} className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-foreground transition-colors" title="QR Code">
                        <QrCode size={15} />
                      </button>
                      <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-foreground transition-colors" title="Edit">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setDelId(a.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-muted hover:text-rose-600 transition-colors" title="Hapus">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted">{list.length} dari {meta.total} data</p>
            <div className="flex gap-1">
              <button className="btn-ghost text-xs px-2 py-1" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                <ChevronLeft size={14} /> Sebelumnya
              </button>
              <span className="text-xs text-muted px-2 py-1">{page} / {meta.totalPages}</span>
              <button className="btn-ghost text-xs px-2 py-1" onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page >= meta.totalPages}>
                Selanjutnya <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={close}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-2xl animate-slideUp" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-semibold text-foreground">{editId ? 'Edit Aset' : 'Tambah Aset Baru'}</h3>
              <button onClick={close} className="p-1 rounded-lg hover:bg-surface text-muted"><X size={18} /></button>
            </div>
            <form onSubmit={submit}>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="label">Kode Barang *</label><input className="input" required value={form.code} onChange={e => set('code', e.target.value)} placeholder="INV-001" /></div>
                  <div><label className="label">Nama Barang *</label><input className="input" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Laptop Asus" /></div>
                  <div><label className="label">Tipe KIB *</label><select className="input" value={form.kibType} onChange={e => set('kibType', e.target.value)}><option value="KIB_B">KIB B — Peralatan &amp; Mesin</option><option value="KIB_E">KIB E — Aset Tetap Lainnya</option></select></div>
                  <div><label className="label">Sumber Dana *</label><select className="input" value={form.fundSource} onChange={e => set('fundSource', e.target.value)}>{Object.entries(FUND).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
                  <div><label className="label">Merk / Brand</label><input className="input" value={form.brand} onChange={e => set('brand', e.target.value)} /></div>
                  <div><label className="label">Spesifikasi</label><input className="input" value={form.specification} onChange={e => set('specification', e.target.value)} /></div>
                  <div><label className="label">Tanggal Perolehan</label><input type="date" className="input" value={form.acquisitionDate} onChange={e => set('acquisitionDate', e.target.value)} /></div>
                  <div><label className="label">Harga Perolehan (Rp)</label><input type="number" className="input" value={form.acquisitionCost} onChange={e => set('acquisitionCost', e.target.value)} placeholder="0" /></div>
                  <div><label className="label">Tahun Anggaran *</label><input type="number" className="input" required value={form.budgetYear} onChange={e => set('budgetYear', e.target.value)} /></div>
                  <div><label className="label">Lokasi *</label><input className="input" required value={form.location} onChange={e => set('location', e.target.value)} placeholder="Ruang Lab Komputer" /></div>
                  <div><label className="label">Kondisi</label><select className="input" value={form.condition} onChange={e => set('condition', e.target.value)}><option value="BAIK">Baik</option><option value="RUSAK_RINGAN">Rusak Ringan</option><option value="RUSAK_BERAT">Rusak Berat</option></select></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="label">Jumlah</label><input type="number" className="input" value={form.quantity} onChange={e => set('quantity', e.target.value)} /></div>
                    <div><label className="label">Satuan</label><input className="input" value={form.unit} onChange={e => set('unit', e.target.value)} /></div>
                  </div>
                </div>
                <div><label className="label">Catatan</label><textarea className="input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
                <button type="button" onClick={close} className="btn-secondary">Batal</button>
                <button type="submit" className="btn-primary" disabled={createM.isPending || updateM.isPending}>
                  {createM.isPending || updateM.isPending ? 'Menyimpan...' : editId ? 'Simpan' : 'Tambah Aset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {delId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setDelId(null)}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-sm p-6 animate-slideUp" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-foreground mb-2">Hapus Aset?</h3>
            <p className="text-sm text-muted mb-6">Data aset akan dihapus dan tidak dapat dikembalikan.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDelId(null)} className="btn-secondary">Batal</button>
              <button onClick={() => deleteM.mutate(delId)} className="btn-danger" disabled={deleteM.isPending}>
                {deleteM.isPending ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setQrUrl(null)}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-xs p-6 text-center animate-slideUp" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-foreground mb-4">QR Code Aset</h3>
            <img src={qrUrl} alt="QR Code" className="w-48 h-48 mx-auto mb-4" />
            <button onClick={() => setQrUrl(null)} className="btn-secondary w-full">Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}
