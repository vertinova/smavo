'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, Pencil, Trash2, X, ChevronLeft, ChevronRight,
  UserCog, KeyRound, ShieldCheck, Settings2,
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

const ROLES = [
  { value: 'ADMIN',     label: 'Admin',       color: 'bg-accent/10 text-accent' },
  { value: 'BENDAHARA', label: 'Bendahara',   color: 'bg-success-muted text-success' },
  { value: 'GURU',      label: 'Guru',        color: 'bg-info-muted text-info' },
  { value: 'STAF_TU',   label: 'Staf TU',     color: 'bg-warning-muted text-warning' },
  { value: 'SISWA',     label: 'Siswa',       color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
];

const FEATURES = [
  { key: 'assets',      label: 'Inventaris Aset' },
  { key: 'finance',     label: 'Keuangan BOS' },
  { key: 'students',    label: 'Data Siswa' },
  { key: 'teachers',    label: 'Data Guru' },
  { key: 'letters',     label: 'Persuratan' },
  { key: 'discipline',  label: 'Kedisiplinan' },
];

const EMPTY = { email: '', password: '', fullName: '', role: 'STAF_TU', nip: '', phone: '', allowedFeatures: [] as string[] };

export default function UsersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [delId, setDelId] = useState<string | null>(null);
  const [pwModal, setPwModal] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search, roleFilter],
    queryFn: () => {
      const p = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) p.set('search', search);
      if (roleFilter) p.set('role', roleFilter);
      return api.get(`/users?${p}`).then(r => r.data);
    },
  });

  const list = data?.data ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, total: 0 };

  const createM = useMutation({
    mutationFn: (d: any) => api.post('/users', d),
    onSuccess: () => { toast.success('Akun berhasil dibuat'); qc.invalidateQueries({ queryKey: ['users'] }); close(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal membuat akun'),
  });

  const updateM = useMutation({
    mutationFn: ({ id, d }: { id: string; d: any }) => api.patch(`/users/${id}`, d),
    onSuccess: () => { toast.success('Akun berhasil diperbarui'); qc.invalidateQueries({ queryKey: ['users'] }); close(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal memperbarui akun'),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => { toast.success('Akun dinonaktifkan'); qc.invalidateQueries({ queryKey: ['users'] }); setDelId(null); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal menonaktifkan akun'),
  });

  const pwM = useMutation({
    mutationFn: ({ id, pw }: { id: string; pw: string }) => api.patch(`/users/${id}/password`, { newPassword: pw }),
    onSuccess: () => { toast.success('Password berhasil diubah'); setPwModal(null); setNewPassword(''); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal mengubah password'),
  });

  const close = () => { setModal(false); setEditId(null); setForm(EMPTY); };
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const toggleFeature = (key: string) => {
    setForm(f => ({
      ...f,
      allowedFeatures: f.allowedFeatures.includes(key)
        ? f.allowedFeatures.filter(k => k !== key)
        : [...f.allowedFeatures, key],
    }));
  };

  const openEdit = (u: any) => {
    setForm({
      email: u.email,
      password: '',
      fullName: u.profile?.fullName || '',
      role: u.role,
      nip: u.profile?.nip || '',
      phone: u.profile?.phone || '',
      allowedFeatures: u.allowedFeatures ?? [],
    });
    setEditId(u.id);
    setModal(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      email: form.email,
      fullName: form.fullName,
      role: form.role,
      nip: form.nip || undefined,
      phone: form.phone || undefined,
      allowedFeatures: form.role === 'ADMIN' ? [] : form.allowedFeatures,
    };
    if (editId) {
      updateM.mutate({ id: editId, d: payload });
    } else {
      createM.mutate({ ...payload, password: form.password });
    }
  };

  const roleInfo = (role: string) => ROLES.find(r => r.value === role) ?? ROLES[3];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] text-muted uppercase tracking-widest mb-1">Sistem</p>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Akun & Role</h2>
        </div>
        <button className="btn-primary" onClick={() => { setForm(EMPTY); setEditId(null); setModal(true); }}>
          <Plus size={14} /> Tambah Pengguna
        </button>
      </div>

      {/* Filters */}
      <div className="card !p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input pl-9" placeholder="Cari nama atau email..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input sm:w-44" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="">Semua Role</option>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/50">
                <th className="th">Nama</th>
                <th className="th">Email</th>
                <th className="th">Role</th>
                <th className="th">Akses Fitur</th>
                <th className="th">Status</th>
                <th className="th w-28"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? [...Array(5)].map((_, i) => (
                <tr key={i} className="tr"><td colSpan={6} className="td"><div className="h-5 bg-surface rounded animate-pulse" /></td></tr>
              )) : list.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-16 text-center">
                  <UserCog size={36} className="mx-auto text-muted/30 mb-3" />
                  <p className="text-muted text-sm">Belum ada pengguna</p>
                </td></tr>
              ) : list.map((u: any) => {
                const ri = roleInfo(u.role);
                const features: string[] = u.allowedFeatures ?? [];
                return (
                  <tr key={u.id} className="tr">
                    <td className="td">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                          <span className="text-accent text-xs font-bold">
                            {u.profile?.fullName?.split(' ').slice(0,2).map((w: string) => w[0]).join('').toUpperCase() || '?'}
                          </span>
                        </div>
                        <span className="font-medium text-foreground">{u.profile?.fullName || 'â€”'}</span>
                      </div>
                    </td>
                    <td className="td text-muted text-xs">{u.email}</td>
                    <td className="td">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ri.color}`}>
                        <ShieldCheck size={11} />
                        {ri.label}
                      </span>
                    </td>
                    <td className="td">
                      {u.role === 'ADMIN' ? (
                        <span className="text-xs text-accent font-medium">Semua Fitur</span>
                      ) : features.length === 0 ? (
                        <span className="text-xs text-muted italic">Tidak ada</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {features.map((f: string) => (
                            <span key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-foreground/[0.06] text-muted capitalize">
                              {FEATURES.find(x => x.key === f)?.label ?? f}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="td">
                      <span className={u.isActive ? 'badge-success' : 'badge-danger'}>
                        {u.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="td">
                      <div className="flex gap-0.5 justify-end">
                        <button
                          onClick={() => { setPwModal(u.id); setNewPassword(''); }}
                          className="p-1.5 rounded-lg hover:bg-foreground/[0.04] text-muted hover:text-info transition-colors"
                          title="Ubah Password"
                        >
                          <KeyRound size={15} />
                        </button>
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 rounded-lg hover:bg-foreground/[0.04] text-muted hover:text-foreground transition-colors"
                          title="Edit & Atur Fitur"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDelId(u.id)}
                          className="p-1.5 rounded-lg hover:bg-danger-muted text-muted hover:text-danger transition-colors"
                          title="Nonaktifkan"
                        >
                          <Trash2 size={15} />
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
            <p className="text-xs text-muted">{list.length} dari {meta.total} pengguna</p>
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

      {/* Create / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={close}>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" />
          <div className="relative bg-card border border-border rounded-2xl shadow-modal w-full max-w-lg animate-slideUp max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <h3 className="font-semibold text-foreground">{editId ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h3>
              <button onClick={close} className="p-1 rounded-lg hover:bg-foreground/[0.06] text-muted"><X size={18} /></button>
            </div>
            <form onSubmit={submit} className="flex flex-col flex-1 min-h-0">
              <div className="p-6 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="label">Nama Lengkap *</label>
                    <input className="input" required value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="Nama lengkap pengguna" />
                  </div>
                  <div>
                    <label className="label">Email *</label>
                    <input type="email" className="input" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="nama@smavo.sch.id" />
                  </div>
                  <div>
                    <label className="label">Role *</label>
                    <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
                      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                  {!editId && (
                    <div className="sm:col-span-2">
                      <label className="label">Password *</label>
                      <input type="password" className="input" required minLength={6} value={form.password} onChange={e => set('password', e.target.value)} placeholder="Minimal 6 karakter" />
                    </div>
                  )}
                  <div>
                    <label className="label">NIP</label>
                    <input className="input" value={form.nip} onChange={e => set('nip', e.target.value)} placeholder="NIP (opsional)" />
                  </div>
                  <div>
                    <label className="label">No. Telepon</label>
                    <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="08xxxxxxxxxx" />
                  </div>
                </div>

                {/* Feature Access - only for non-ADMIN */}
                {form.role !== 'ADMIN' && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Settings2 size={14} className="text-muted" />
                      <label className="label !mb-0">Akses Fitur</label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {FEATURES.map(f => (
                        <label key={f.key} className={cn(
                          'flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-sm',
                          form.allowedFeatures.includes(f.key)
                            ? 'border-accent bg-accent/5 text-foreground'
                            : 'border-border hover:border-border/80 text-muted'
                        )}>
                          <input
                            type="checkbox"
                            className="accent-accent"
                            checked={form.allowedFeatures.includes(f.key)}
                            onChange={() => toggleFeature(f.key)}
                          />
                          {f.label}
                        </label>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted mt-2">
                      Fitur yang tidak dipilih tidak akan terlihat di sidebar pengguna.
                    </p>
                  </div>
                )}
                {form.role === 'ADMIN' && (
                  <div className="rounded-lg bg-accent/5 border border-accent/20 px-4 py-3">
                    <p className="text-sm text-accent font-medium">Admin memiliki akses ke semua fitur secara otomatis.</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
                <button type="button" onClick={close} className="btn-secondary">Batal</button>
                <button type="submit" className="btn-primary" disabled={createM.isPending || updateM.isPending}>
                  {createM.isPending || updateM.isPending ? 'Menyimpan...' : editId ? 'Simpan Perubahan' : 'Buat Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {pwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setPwModal(null)}>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" />
          <div className="relative bg-card border border-border rounded-2xl shadow-modal w-full max-w-sm p-6 animate-slideUp" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Ubah Password</h3>
              <button onClick={() => setPwModal(null)} className="p-1 rounded-lg hover:bg-foreground/[0.06] text-muted"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label">Password Baru *</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Minimal 6 karakter"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  minLength={6}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setPwModal(null)} className="btn-secondary">Batal</button>
              <button
                onClick={() => pwM.mutate({ id: pwModal, pw: newPassword })}
                className="btn-primary"
                disabled={newPassword.length < 6 || pwM.isPending}
              >
                {pwM.isPending ? 'Menyimpan...' : 'Simpan Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Confirm */}
      {delId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setDelId(null)}>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" />
          <div className="relative bg-card border border-border rounded-2xl shadow-modal w-full max-w-sm p-6 animate-slideUp" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-foreground mb-2">Nonaktifkan Akun?</h3>
            <p className="text-sm text-muted mb-6">Pengguna tidak akan bisa login setelah dinonaktifkan.</p>
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

