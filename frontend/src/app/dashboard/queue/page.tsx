'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  CheckCircle2,
  Clock3,
  Megaphone,
  MonitorUp,
  Moon,
  Pause,
  Play,
  RadioTower,
  RotateCcw,
  Save,
  Settings,
  SkipForward,
  Sun,
  Trash2,
  UsersRound,
  Volume2,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  pauseContainer,
  formatQueueNumber,
  formatQueueService,
  queueAction,
  speakQueueCall,
  unlockQueueAudio,
  updateQueueContainers,
  type QueueContainer,
  type QueueContainerConfig,
} from '@/lib/queue';
import { useQueueStore } from '@/lib/queueStore';
import { useTheme } from '@/lib/theme';

const accentMap: Record<string, string> = {
  cyan: 'from-cyan-400 to-blue-500 shadow-cyan-500/25 border-cyan-300/30',
  violet: 'from-violet-400 to-fuchsia-500 shadow-violet-500/25 border-violet-300/30',
  emerald: 'from-emerald-400 to-teal-500 shadow-emerald-500/25 border-emerald-300/30',
  amber: 'from-amber-300 to-orange-500 shadow-amber-500/25 border-amber-300/30',
  rose: 'from-rose-400 to-pink-500 shadow-rose-500/25 border-rose-300/30',
};

const accentOptions = [
  { value: 'cyan', label: 'Cyan' },
  { value: 'violet', label: 'Violet' },
  { value: 'emerald', label: 'Emerald' },
  { value: 'amber', label: 'Amber' },
  { value: 'rose', label: 'Rose' },
];

function toContainerConfig(container: QueueContainer): QueueContainerConfig {
  return {
    id: container.id,
    name: container.name,
    service: container.service,
    code: container.code,
    operator: container.operator,
    isPaused: container.isPaused,
    accent: container.accent,
  };
}

function makeNewContainer(index: number): QueueContainerConfig {
  const number = index + 1;
  return {
    id: `container-${number}`,
    name: `Operator ${number}`,
    service: 'SPMB',
    code: 'SPMB',
    operator: `Operator ${number}`,
    isPaused: false,
    accent: accentOptions[index % accentOptions.length].value,
  };
}

type QueueThemeClasses = {
  panel: string;
  subPanel: string;
  text: string;
  muted: string;
  faint: string;
  input: string;
  graphGrid: string;
  tooltip: { background: string; border: string; color: string };
};

function StatCard({ label, value, icon: Icon, hint, ui }: { label: string; value: string | number; icon: typeof Activity; hint: string; ui: QueueThemeClasses }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl border p-5 shadow-xl backdrop-blur-xl ${ui.panel}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className={`text-xs font-bold uppercase tracking-[0.22em] ${ui.muted}`}>{label}</p>
          <p className={`mt-3 text-3xl font-black tracking-normal ${ui.text}`}>{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-300/20">
          <Icon size={22} />
        </div>
      </div>
      <p className={`mt-4 text-xs font-medium ${ui.muted}`}>{hint}</p>
    </motion.div>
  );
}

function ContainerCard({
  container,
  onAction,
  onPause,
  onSpeak,
  busy,
}: {
  container: QueueContainer;
  onAction: (containerId: string, action: 'call' | 'next' | 'recall' | 'done' | 'skip') => void;
  onPause: (containerId: string, paused: boolean) => void;
  onSpeak: (container: QueueContainer) => void;
  busy: boolean;
}) {
  const accent = accentMap[container.accent] ?? accentMap.cyan;
  const active = container.activeTicket;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-3xl border bg-slate-950/80 p-5 shadow-2xl backdrop-blur-xl ${accent}`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent.split(' ').slice(0, 2).join(' ')}`} />
      <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-white/10 blur-3xl" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">{container.name}</p>
          <h3 className="mt-1 text-xl font-black text-white">{formatQueueService(container.service)}</h3>
          <p className="mt-1 text-xs text-slate-400">{container.operator}</p>
        </div>
        <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ${container.isPaused ? 'bg-amber-400/15 text-amber-200' : 'bg-emerald-400/15 text-emerald-200'}`}>
          <span className={`h-2 w-2 rounded-full ${container.isPaused ? 'bg-amber-300' : 'bg-emerald-300 animate-pulse'}`} />
          {container.isPaused ? 'PAUSE' : 'LIVE'}
        </div>
      </div>

      <div className="relative mt-6 rounded-3xl border border-white/10 bg-white/[0.06] p-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Nomor Aktif</p>
        <motion.p
          key={active?.number ?? 'empty'}
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`mt-2 text-5xl font-black leading-none tracking-normal ${active ? 'text-white drop-shadow-[0_0_22px_rgba(34,211,238,0.45)]' : 'text-slate-600'}`}
        >
          {active ? formatQueueNumber(active.number) : '---'}
        </motion.p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-black/20 p-3">
            <p className="text-lg font-black text-white">{container.waitingCount}</p>
            <p className="text-[10px] font-bold uppercase text-slate-500">Antri</p>
          </div>
          <div className="rounded-2xl bg-black/20 p-3">
            <p className="text-lg font-black text-white">{container.doneCount}</p>
            <p className="text-[10px] font-bold uppercase text-slate-500">Selesai</p>
          </div>
          <div className="rounded-2xl bg-black/20 p-3">
            <p className="text-lg font-black text-white">{container.skippedCount}</p>
            <p className="text-[10px] font-bold uppercase text-slate-500">Lewat</p>
          </div>
        </div>
      </div>

      <div className="relative mt-4 grid grid-cols-3 gap-2">
        <button
          disabled={busy || container.isPaused || Boolean(active)}
          onClick={() => onAction(container.id, 'call')}
          title={active ? 'Selesaikan nomor aktif dulu sebelum memanggil nomor berikutnya' : 'Panggil nomor berikutnya'}
          className="rounded-2xl bg-cyan-400 px-3 py-3 text-xs font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:scale-[1.02] disabled:opacity-40"
        >
          <SkipForward className="mx-auto mb-1" size={16} /> {active ? 'Tunggu' : 'Next'}
        </button>
        <button disabled={busy || !active} onClick={() => onAction(container.id, 'recall')} className="rounded-2xl bg-white/10 px-3 py-3 text-xs font-black text-white ring-1 ring-white/10 transition hover:bg-white/15 disabled:opacity-40">
          <RotateCcw className="mx-auto mb-1" size={16} /> Recall
        </button>
        <button disabled={busy || !active} onClick={() => onAction(container.id, 'done')} className="rounded-2xl bg-emerald-400/90 px-3 py-3 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:scale-[1.02] disabled:opacity-40">
          <CheckCircle2 className="mx-auto mb-1" size={16} /> Selesai
        </button>
        <button disabled={busy || !active} onClick={() => onAction(container.id, 'skip')} className="rounded-2xl bg-rose-400/90 px-3 py-3 text-xs font-black text-white shadow-lg shadow-rose-500/20 transition hover:scale-[1.02] disabled:opacity-40">
          <SkipForward className="mx-auto mb-1" size={16} /> Lewati
        </button>
        <button disabled={busy || !active} onClick={() => onSpeak(container)} className="rounded-2xl bg-white/10 px-3 py-3 text-xs font-black text-white ring-1 ring-white/10 transition hover:bg-white/15 disabled:opacity-40">
          <Volume2 className="mx-auto mb-1" size={16} /> Audio
        </button>
        <button disabled={busy} onClick={() => onPause(container.id, !container.isPaused)} className="rounded-2xl bg-white/10 px-3 py-3 text-xs font-black text-white ring-1 ring-white/10 transition hover:bg-white/15 disabled:opacity-40">
          {container.isPaused ? <Play className="mx-auto mb-1" size={16} /> : <Pause className="mx-auto mb-1" size={16} />}
          {container.isPaused ? 'Aktif' : 'Pause'}
        </button>
      </div>
    </motion.div>
  );
}

function ContainerSettingsPanel({
  draft,
  busy,
  message,
  onChange,
  onCountChange,
  onRemove,
  onSave,
  ui,
}: {
  draft: QueueContainerConfig[];
  busy: boolean;
  message: string;
  onChange: (index: number, patch: Partial<QueueContainerConfig>) => void;
  onCountChange: (count: number) => void;
  onRemove: (index: number) => void;
  onSave: () => void;
  ui: QueueThemeClasses;
}) {
  return (
    <div className={`relative mt-6 rounded-3xl border p-5 shadow-xl backdrop-blur-xl ${ui.panel}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] font-black text-cyan-200">
            <Settings size={13} />
            Pengaturan Admin
          </div>
          <h2 className={`text-xl font-black ${ui.text}`}>Operator Layanan</h2>
          <p className={`mt-1 max-w-2xl text-xs leading-relaxed ${ui.muted}`}>
            Ubah jumlah operator, nama loket, layanan, kode nomor, operator, dan warna tampilan. Kode dipakai sebagai prefix nomor antrian.
          </p>
          <p className={`mt-2 max-w-2xl text-xs leading-relaxed ${ui.muted}`}>
            Cara pakai: ubah angka <span className="font-black">Jumlah</span> untuk tambah/kurangi operator, edit kolom nama/layanan, lalu klik <span className="font-black">Simpan Operator</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-xs font-bold ${ui.subPanel} ${ui.muted}`}>
            Jumlah
            <input
              type="number"
              min={1}
              max={12}
              value={draft.length}
              onChange={(event) => onCountChange(Number(event.target.value))}
              className={`w-16 rounded-xl border px-3 py-2 text-center text-sm font-black outline-none focus:border-cyan-300/60 ${ui.input}`}
            />
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={onSave}
            className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:scale-[1.02] disabled:cursor-wait disabled:opacity-60"
          >
            <Save size={16} />
            {busy ? 'Menyimpan...' : 'Simpan Operator'}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {draft.map((container, index) => (
          <div key={`${container.id}-${index}`} className={`grid gap-3 rounded-3xl border p-4 lg:grid-cols-[1.1fr_1.1fr_0.7fr_1fr_0.75fr_auto] ${ui.subPanel}`}>
            <label className="min-w-0">
              <span className={`mb-1 block text-[10px] font-black uppercase tracking-[0.18em] ${ui.faint}`}>Nama Operator</span>
              <input
                value={container.name}
                onChange={(event) => onChange(index, { name: event.target.value })}
                className={`w-full rounded-2xl border px-3 py-2.5 text-sm font-bold outline-none focus:border-cyan-300/60 ${ui.input}`}
                placeholder="Operator 1"
              />
            </label>

            <label className="min-w-0">
              <span className={`mb-1 block text-[10px] font-black uppercase tracking-[0.18em] ${ui.faint}`}>Layanan</span>
              <input
                value={container.service}
                onChange={(event) => onChange(index, { service: event.target.value })}
                className={`w-full rounded-2xl border px-3 py-2.5 text-sm font-bold outline-none focus:border-cyan-300/60 ${ui.input}`}
                placeholder="SPMB"
              />
            </label>

            <label className="min-w-0">
              <span className={`mb-1 block text-[10px] font-black uppercase tracking-[0.18em] ${ui.faint}`}>Kode</span>
              <input
                value={container.code}
                maxLength={8}
                onChange={(event) => onChange(index, { code: event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '') })}
                className={`w-full rounded-2xl border px-3 py-2.5 text-sm font-black uppercase outline-none focus:border-cyan-300/60 ${ui.input}`}
                placeholder="SPMB"
              />
            </label>

            <label className="min-w-0">
              <span className={`mb-1 block text-[10px] font-black uppercase tracking-[0.18em] ${ui.faint}`}>Operator</span>
              <input
                value={container.operator}
                onChange={(event) => onChange(index, { operator: event.target.value })}
                className={`w-full rounded-2xl border px-3 py-2.5 text-sm font-bold outline-none focus:border-cyan-300/60 ${ui.input}`}
                placeholder="Petugas SPMB"
              />
            </label>

            <label className="min-w-0">
              <span className={`mb-1 block text-[10px] font-black uppercase tracking-[0.18em] ${ui.faint}`}>Warna</span>
              <select
                value={container.accent}
                onChange={(event) => onChange(index, { accent: event.target.value })}
                className={`w-full rounded-2xl border px-3 py-2.5 text-sm font-black outline-none focus:border-cyan-300/60 ${ui.input}`}
              >
                {accentOptions.map((accent) => (
                  <option key={accent.value} value={accent.value}>{accent.label}</option>
                ))}
              </select>
            </label>

            <button
              type="button"
              disabled={draft.length <= 1}
              onClick={() => onRemove(index)}
              className="flex h-[42px] w-full items-center justify-center self-end rounded-2xl bg-rose-400/15 text-rose-200 ring-1 ring-rose-300/20 transition hover:bg-rose-400/25 disabled:cursor-not-allowed disabled:opacity-40 lg:w-12"
              aria-label={`Hapus ${container.name}`}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {message ? (
        <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-bold ${ui.subPanel} ${ui.text}`}>
          {message}
        </div>
      ) : null}
    </div>
  );
}

export default function QueueDashboardPage() {
  const { snapshot, connected, connect, refresh, setSnapshot } = useQueueStore();
  const { theme, setTheme } = useTheme();
  const [busy, setBusy] = useState(false);
  const [volume, setVolume] = useState(0.9);
  const [chartReady, setChartReady] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [containerDraft, setContainerDraft] = useState<QueueContainerConfig[]>([]);

  useEffect(() => {
    setChartReady(true);
    refresh().catch(() => {});
    return connect();
  }, [connect, refresh]);

  useEffect(() => {
    if (settingsDirty) return;
    setContainerDraft(snapshot.containers.map(toContainerConfig));
  }, [settingsDirty, snapshot.containers]);

  const latestCalled = useMemo(
    () => snapshot.containers.find((container) => container.activeTicket)?.activeTicket ?? null,
    [snapshot.containers]
  );

  const runAction = async (containerId: string, action: 'call' | 'next' | 'recall' | 'done' | 'skip') => {
    setBusy(true);
    try {
      const result = await queueAction(containerId, action);
      const container = result.snapshot.containers.find((item) => item.id === containerId);
      if (container?.activeTicket && ['call', 'next', 'recall'].includes(action)) {
        speakQueueCall(container.activeTicket, container, volume);
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const runPause = async (containerId: string, paused: boolean) => {
    setBusy(true);
    try {
      await pauseContainer(containerId, paused);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const enableAudio = () => {
    setAudioEnabled(unlockQueueAudio(volume));
  };

  const changeContainerDraft = (index: number, patch: Partial<QueueContainerConfig>) => {
    setSettingsDirty(true);
    setContainerDraft((current) => current.map((container, itemIndex) => (
      itemIndex === index ? { ...container, ...patch } : container
    )));
  };

  const changeContainerCount = (count: number) => {
    const nextCount = Math.max(1, Math.min(12, Number.isFinite(count) ? count : 1));
    setSettingsDirty(true);
    setContainerDraft((current) => {
      if (nextCount <= current.length) return current.slice(0, nextCount);

      const next = [...current];
      while (next.length < nextCount) {
        next.push(makeNewContainer(next.length));
      }
      return next;
    });
  };

  const removeContainerDraft = (index: number) => {
    setSettingsDirty(true);
    setContainerDraft((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const saveContainers = async () => {
    setSettingsBusy(true);
    setSettingsMessage('Menyimpan konfigurasi container...');
    try {
      const result = await updateQueueContainers(containerDraft.map((container, index) => ({
        ...container,
        name: container.name.trim() || `Operator ${index + 1}`,
        service: container.service.trim() || 'SPMB',
        code: container.code.trim() || 'SPMB',
        operator: container.operator.trim() || `Operator ${index + 1}`,
      })));
      setSnapshot(result.snapshot);
      setContainerDraft(result.snapshot.containers.map(toContainerConfig));
      setSettingsDirty(false);
      setSettingsMessage('Konfigurasi operator berhasil disimpan.');
    } catch (error: any) {
      setSettingsMessage(error.response?.data?.message || 'Konfigurasi operator gagal disimpan.');
    } finally {
      setSettingsBusy(false);
    }
  };

  const isLight = theme === 'light';
  const ui: QueueThemeClasses = {
    panel: isLight
      ? 'border-slate-200 bg-white text-slate-900 shadow-slate-200/70'
      : 'border-white/10 bg-white/[0.07] text-white shadow-black/20',
    subPanel: isLight
      ? 'border-slate-200 bg-slate-50 text-slate-900'
      : 'border-white/10 bg-black/20 text-white',
    text: isLight ? 'text-slate-950' : 'text-white',
    muted: isLight ? 'text-slate-600' : 'text-slate-400',
    faint: isLight ? 'text-slate-500' : 'text-slate-500',
    input: isLight
      ? 'border-slate-200 bg-white text-slate-950 placeholder:text-slate-400'
      : 'border-white/10 bg-slate-950 text-white placeholder:text-slate-600',
    graphGrid: isLight ? 'rgba(15,23,42,0.08)' : 'rgba(255,255,255,0.06)',
    tooltip: isLight
      ? { background: '#ffffff', border: '1px solid rgba(15,23,42,0.14)', color: '#0f172a' }
      : { background: '#020617', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' },
  };

  return (
    <div className={`min-h-full rounded-[32px] p-4 shadow-2xl lg:p-6 ${isLight ? 'bg-slate-50 text-slate-950 shadow-slate-200/70' : 'bg-slate-950 text-white shadow-slate-950/30'}`}>
      <div className={`pointer-events-none fixed inset-0 ${isLight ? 'opacity-20' : 'opacity-30'}`}>
        <div className="absolute left-1/4 top-20 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />
      </div>

      <div className="relative mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-1.5 text-xs font-black text-cyan-200">
            <RadioTower size={14} />
            {connected ? 'REALTIME CONNECTED' : 'CONNECTING'}
          </div>
          <h1 className={`text-3xl font-black tracking-tight lg:text-5xl ${ui.text}`}>Command Center Antrian</h1>
          <p className={`mt-2 max-w-2xl text-sm ${ui.muted}`}>
            Dashboard petugas untuk memanggil, melewati, menyelesaikan, dan memonitor seluruh operator pelayanan SPMB SMAN 2 Cibinong secara realtime.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className={`flex items-center gap-1 rounded-2xl border p-1 ${ui.subPanel}`}>
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black transition ${theme === 'light' ? 'bg-cyan-300 text-slate-950 shadow-sm' : `${ui.muted} hover:bg-cyan-300/10`}`}
            >
              <Sun size={14} /> Light
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black transition ${theme === 'dark' ? 'bg-cyan-300 text-slate-950 shadow-sm' : `${ui.muted} hover:bg-cyan-300/10`}`}
            >
              <Moon size={14} /> Dark
            </button>
          </div>
          <a href="/queue-display" target="_blank" className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 shadow-lg shadow-white/10">
            <MonitorUp size={17} /> Buka Display TV
          </a>
          <button
            type="button"
            onClick={enableAudio}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black shadow-lg transition ${
              audioEnabled
                ? 'bg-emerald-300 text-slate-950 shadow-emerald-500/10'
                : 'bg-cyan-300 text-slate-950 shadow-cyan-500/20'
            }`}
          >
            <Volume2 size={17} /> {audioEnabled ? 'Suara Aktif' : 'Aktifkan Suara'}
          </button>
          <label className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-xs font-bold ${ui.subPanel} ${ui.muted}`}>
            <Volume2 size={16} />
            <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(event) => setVolume(Number(event.target.value))} className="w-24 accent-cyan-300" />
          </label>
        </div>
      </div>

      <ContainerSettingsPanel
        draft={containerDraft}
        busy={settingsBusy}
        message={settingsMessage}
        onChange={changeContainerDraft}
        onCountChange={changeContainerCount}
        onRemove={removeContainerDraft}
        onSave={saveContainers}
        ui={ui}
      />

      <div className="relative grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Hari Ini" value={snapshot.analytics.totalToday} icon={UsersRound} hint="Semua tiket yang dibuat hari ini" ui={ui} />
        <StatCard label="Sedang Dipanggil" value={latestCalled ? formatQueueNumber(latestCalled.number) : '-'} icon={Megaphone} hint={latestCalled ? formatQueueService(latestCalled.service) : 'Belum ada panggilan aktif'} ui={ui} />
        <StatCard label="Selesai" value={snapshot.analytics.done} icon={CheckCircle2} hint="Layanan berhasil selesai" ui={ui} />
        <StatCard label="Rata-rata Tunggu" value={`${snapshot.analytics.averageWaitMinutes}m`} icon={Clock3} hint={`Peak hour: ${snapshot.analytics.peakHour}`} ui={ui} />
        <StatCard label="Operator Aktif" value={snapshot.analytics.activeContainers} icon={Activity} hint="Operator yang tidak pause" ui={ui} />
      </div>

      <div className="relative mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-4 lg:grid-cols-2">
          {snapshot.containers.map((container) => (
            <ContainerCard
              key={container.id}
              container={container}
              busy={busy}
              onAction={runAction}
              onPause={runPause}
              onSpeak={(item) => item.activeTicket && speakQueueCall(item.activeTicket, item, volume)}
            />
          ))}
        </div>

        <div className="space-y-4">
          <div className={`rounded-3xl border p-5 shadow-xl backdrop-blur-xl ${ui.panel}`}>
            <h2 className={`text-sm font-black uppercase tracking-[0.22em] ${ui.muted}`}>Realtime Graph</h2>
            <div className="mt-4 h-56">
              {chartReady ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <AreaChart data={snapshot.analytics.hourlyTraffic}>
                    <defs>
                      <linearGradient id="queueTotal" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.65} />
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={ui.graphGrid} vertical={false} />
                    <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ ...ui.tooltip, borderRadius: 16 }} />
                    <Area type="monotone" dataKey="total" stroke="#22d3ee" strokeWidth={3} fill="url(#queueTotal)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          </div>

          <div className={`rounded-3xl border p-5 shadow-xl backdrop-blur-xl ${ui.panel}`}>
            <h2 className={`text-sm font-black uppercase tracking-[0.22em] ${ui.muted}`}>Live Queue</h2>
            <div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {snapshot.tickets.slice(0, 14).map((ticket) => (
                <div key={ticket.id} className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${ui.subPanel}`}>
                  <div>
                    <p className={`font-black ${ui.text}`}>{formatQueueNumber(ticket.number)}</p>
                    <p className={`text-xs ${ui.muted}`}>{ticket.visitorName} - {formatQueueService(ticket.service)}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-black ${isLight ? 'bg-slate-200 text-slate-700' : 'bg-white/10 text-slate-300'}`}>{ticket.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
