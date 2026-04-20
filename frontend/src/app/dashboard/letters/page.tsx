'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Plus, X, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const TYPES: Record<string, { label: string; desc: string }> = {
  SURAT_TUGAS: { label: 'Surat Tugas', desc: 'Penugasan guru/staf untuk kegiatan tertentu' },
  SURAT_KETERANGAN_AKTIF: { label: 'SK Aktif', desc: 'Bukti status siswa aktif' },
  SURAT_KETERANGAN_PINDAH: { label: 'SK Pindah', desc: 'Proses mutasi siswa' },
  SURAT_KETERANGAN_LULUS: { label: 'SK Lulus', desc: 'Bukti kelulusan siswa' },
  SURAT_IZIN: { label: 'Surat Izin', desc: 'Izin kegiatan atau permohonan' },
  LAINNYA: { label: 'Lainnya', desc: 'Surat kustom lainnya' },
};

export default function LettersPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [form, setForm] = useState({ subject: '', content: '', number: '' });
  const [delId, setDelId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['letters'],
    queryFn: () => api.get('/letters?limit=50').then(r => r.data),
  });

  const letters = data?.data ?? [];

  const createM = useMutation({
    mutationFn: (d: any) => api.post('/letters', d),
    onSuccess: () => {
      toast.success('Surat berhasil dibuat');
      qc.invalidateQueries({ queryKey: ['letters'] });
      setModal(false); setForm({ subject: '', content: '', number: '' }); setSelectedType('');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal membuat surat'),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => api.delete(`/letters/${id}`),
    onSuccess: () => {
      toast.success('Surat dihapus');
      qc.invalidateQueries({ queryKey: ['letters'] });
      setDelId(null);
    },
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const openCreate = (type: string) => {
    setSelectedType(type);
    setForm({ subject: '', content: '', number: '' });
    setModal(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    createM.mutate({
      letterType: selectedType,
      subject: form.subject,
      content: form.content,
      number: form.number || undefined,
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Persuratan</h2>
        <p className="text-sm text-muted mt-0.5">Buat dan kelola surat resmi sekolah</p>
      </div>

      {/* Type cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(TYPES).map(([key, val]) => (
          <button
            key={key}
            onClick={() => openCreate(key)}
            className="card-interactive text-left group"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <FileText size={16} className="text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">{val.label}</h3>
                <p className="text-xs text-muted mt-0.5 leading-relaxed">{val.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Recent letters */}
      <div className="card">
        <h3 className="font-semibold text-foreground mb-4">Riwayat Surat</h3>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-surface rounded-lg animate-pulse" />)}
          </div>
        ) : letters.length === 0 ? (
          <div className="text-center py-10">
            <FileText size={36} className="mx-auto text-gray-300 mb-3" />
            <p className="text-muted text-sm">Belum ada surat dibuat</p>
          </div>
        ) : (
          <div className="space-y-2">
            {letters.map((l: any) => (
              <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <FileText size={16} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{l.subject}</p>
                  <p className="text-xs text-muted">
                    {TYPES[l.letterType]?.label ?? l.letterType} &middot; {l.number} &middot;{' '}
                    {new Date(l.issuedDate).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <span className="text-xs text-muted hidden sm:block">
                  {l.issuedBy?.profile?.fullName}
                </span>
                <button
                  onClick={() => setDelId(l.id)}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-50 text-muted hover:text-rose-600 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setModal(false)}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-lg animate-slideUp" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h3 className="font-semibold text-foreground">Buat Surat</h3>
                <p className="text-xs text-muted mt-0.5">{TYPES[selectedType]?.label}</p>
              </div>
              <button onClick={() => setModal(false)} className="p-1 rounded-lg hover:bg-surface text-muted"><X size={18} /></button>
            </div>
            <form onSubmit={submit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="label">Nomor Surat (opsional)</label>
                  <input className="input" value={form.number} onChange={e => set('number', e.target.value)}
                    placeholder="Otomatis jika dikosongkan" />
                </div>
                <div>
                  <label className="label">Perihal / Subjek *</label>
                  <input className="input" required value={form.subject} onChange={e => set('subject', e.target.value)}
                    placeholder="Perihal surat" />
                </div>
                <div>
                  <label className="label">Isi Surat *</label>
                  <textarea className="input" rows={6} required value={form.content} onChange={e => set('content', e.target.value)}
                    placeholder="Tuliskan isi surat di sini..." />
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary">Batal</button>
                <button type="submit" className="btn-primary" disabled={createM.isPending}>
                  {createM.isPending ? 'Membuat...' : 'Buat Surat'}
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
            <h3 className="font-semibold text-foreground mb-2">Hapus Surat?</h3>
            <p className="text-sm text-muted mb-6">Surat akan dihapus permanen.</p>
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
