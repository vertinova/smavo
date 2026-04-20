'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, X, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const EMPTY = {
  nip: '', nuptk: '', fullName: '', gender: 'LAKI_LAKI' as string,
  birthPlace: '', birthDate: '', subject: '', phone: '', email: '', address: '',
};

export default function TeachersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [delId, setDelId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['teachers', page, search],
    queryFn: () => {
      const p = new URLSearchParams({ page: String(page), limit: '20', sortOrder: 'asc' });
      if (search) p.set('search', search);
      return api.get(`/teachers?${p}`).then(r => r.data);
    },
  });

  const list = data?.data ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, total: 0 };

  const createM = useMutation({
    mutationFn: (d: any) => api.post('/teachers', d),
    onSuccess: () => { toast.success('Guru berhasil ditambahkan'); qc.invalidateQueries({ queryKey: ['teachers'] }); close(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal menambah guru'),
  });

  const updateM = useMutation({
    mutationFn: ({ id, d }: { id: string; d: any }) => api.patch(`/teachers/${id}`, d),
    onSuccess: () => { toast.success('Data guru diperbarui'); qc.invalidateQueries({ queryKey: ['teachers'] }); close(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal memperbarui'),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => api.delete(`/teachers/${id}`),
    onSuccess: () => { toast.success('Guru dinonaktifkan'); qc.invalidateQueries({ queryKey: ['teachers'] }); setDelId(null); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal menghapus'),
  });

  const close = () => { setModal(false); setEditId(null); setForm(EMPTY); };
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const openEdit = (t: any) => {
    setForm({
      nip: t.nip || '', nuptk: t.nuptk || '', fullName: t.fullName, gender: t.gender,
      birthPlace: t.birthPlace || '', birthDate: t.birthDate ? t.birthDate.split('T')[0] : '',
      subject: t.subject || '', phone: t.phone || '', email: t.email || '', address: t.address || '',
    });
    setEditId(t.id);
    setModal(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      ...form,
      birthDate: form.birthDate ? new Date(form.birthDate).toISOString() : undefined,
      nip: form.nip || undefined,
      nuptk: form.nuptk || undefined,
      email: form.email || undefined,
    };
    if (editId) updateM.mutate({ id: editId, d: payload });
    else createM.mutate(payload);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Data Guru &amp; GTK</h2>
          <p className="text-sm text-muted mt-0.5">Kelola data guru dan tenaga kependidikan</p>
        </div>
        <button className="btn-primary" onClick={() => { setForm(EMPTY); setEditId(null); setModal(true); }}>
          <Plus size={16} /> Tambah Guru
        </button>
      </div>

      <div className="card !p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input pl-9" placeholder="Cari nama atau NIP..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/50">
                <th className="th">NIP</th>
                <th className="th">Nama Lengkap</th>
                <th className="th">Mata Pelajaran</th>
                <th className="th">Wali Kelas</th>
                <th className="th">Status</th>
                <th className="th w-20"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? [...Array(5)].map((_, i) => (
                <tr key={i} className="tr"><td colSpan={6} className="td"><div className="h-5 bg-surface rounded animate-pulse" /></td></tr>
              )) : list.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-16 text-center">
                  <Users size={36} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-muted text-sm">Belum ada data guru</p>
                  <button className="btn-primary mt-4 text-xs" onClick={() => { setForm(EMPTY); setModal(true); }}>
                    <Plus size={14} /> Tambah Guru Pertama
                  </button>
                </td></tr>
              ) : list.map((t: any) => (
                <tr key={t.id} className="tr">
                  <td className="td font-mono text-xs text-muted">{t.nip ?? '—'}</td>
                  <td className="td font-medium text-foreground">{t.fullName}</td>
                  <td className="td text-muted">{t.subject ?? '—'}</td>
                  <td className="td text-muted">{t.homeroomOf?.name ?? '—'}</td>
                  <td className="td"><span className={t.isActive ? 'badge-success' : 'badge-danger'}>{t.isActive ? 'Aktif' : 'Nonaktif'}</span></td>
                  <td className="td">
                    <div className="flex gap-0.5 justify-end">
                      <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-foreground transition-colors"><Pencil size={15} /></button>
                      <button onClick={() => setDelId(t.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-muted hover:text-rose-600 transition-colors"><Trash2 size={15} /></button>
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
              <button className="btn-ghost text-xs px-2 py-1" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}><ChevronLeft size={14} /> Prev</button>
              <span className="text-xs text-muted px-2 py-1">{page} / {meta.totalPages}</span>
              <button className="btn-ghost text-xs px-2 py-1" onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page >= meta.totalPages}>Next <ChevronRight size={14} /></button>
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
              <h3 className="font-semibold text-foreground">{editId ? 'Edit Data Guru' : 'Tambah Guru Baru'}</h3>
              <button onClick={close} className="p-1 rounded-lg hover:bg-surface text-muted"><X size={18} /></button>
            </div>
            <form onSubmit={submit}>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="label">NIP</label><input className="input" value={form.nip} onChange={e => set('nip', e.target.value)} /></div>
                  <div><label className="label">NUPTK</label><input className="input" value={form.nuptk} onChange={e => set('nuptk', e.target.value)} /></div>
                  <div><label className="label">Nama Lengkap *</label><input className="input" required value={form.fullName} onChange={e => set('fullName', e.target.value)} /></div>
                  <div><label className="label">Jenis Kelamin *</label><select className="input" value={form.gender} onChange={e => set('gender', e.target.value)}><option value="LAKI_LAKI">Laki-laki</option><option value="PEREMPUAN">Perempuan</option></select></div>
                  <div><label className="label">Tempat Lahir</label><input className="input" value={form.birthPlace} onChange={e => set('birthPlace', e.target.value)} /></div>
                  <div><label className="label">Tanggal Lahir</label><input type="date" className="input" value={form.birthDate} onChange={e => set('birthDate', e.target.value)} /></div>
                  <div><label className="label">Mata Pelajaran</label><input className="input" value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="Matematika" /></div>
                  <div><label className="label">No. Telepon</label><input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
                  <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={e => set('email', e.target.value)} /></div>
                </div>
                <div><label className="label">Alamat</label><textarea className="input" rows={2} value={form.address} onChange={e => set('address', e.target.value)} /></div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
                <button type="button" onClick={close} className="btn-secondary">Batal</button>
                <button type="submit" className="btn-primary" disabled={createM.isPending || updateM.isPending}>
                  {createM.isPending || updateM.isPending ? 'Menyimpan...' : editId ? 'Simpan' : 'Tambah Guru'}
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
            <h3 className="font-semibold text-foreground mb-2">Nonaktifkan Guru?</h3>
            <p className="text-sm text-muted mb-6">Status guru akan diubah menjadi nonaktif.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDelId(null)} className="btn-secondary">Batal</button>
              <button onClick={() => deleteM.mutate(delId)} className="btn-danger" disabled={deleteM.isPending}>
                {deleteM.isPending ? 'Memproses...' : 'Nonaktifkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
