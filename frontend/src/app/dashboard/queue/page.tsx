'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  CheckCircle2,
  Clock3,
  Megaphone,
  MonitorUp,
  Pause,
  Play,
  RadioTower,
  RotateCcw,
  SkipForward,
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
import { pauseContainer, queueAction, speakQueueCall, type QueueContainer } from '@/lib/queue';
import { useQueueStore } from '@/lib/queueStore';

const accentMap: Record<string, string> = {
  cyan: 'from-cyan-400 to-blue-500 shadow-cyan-500/25 border-cyan-300/30',
  violet: 'from-violet-400 to-fuchsia-500 shadow-violet-500/25 border-violet-300/30',
  emerald: 'from-emerald-400 to-teal-500 shadow-emerald-500/25 border-emerald-300/30',
  amber: 'from-amber-300 to-orange-500 shadow-amber-500/25 border-amber-300/30',
  rose: 'from-rose-400 to-pink-500 shadow-rose-500/25 border-rose-300/30',
};

function StatCard({ label, value, icon: Icon, hint }: { label: string; value: string | number; icon: typeof Activity; hint: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-white/10 bg-white/[0.07] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-normal text-white">{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-300/20">
          <Icon size={22} />
        </div>
      </div>
      <p className="mt-4 text-xs font-medium text-slate-400">{hint}</p>
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
          <h3 className="mt-1 text-xl font-black text-white">{container.service}</h3>
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
          {active?.number ?? '---'}
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
        <button disabled={busy || container.isPaused} onClick={() => onAction(container.id, active ? 'next' : 'call')} className="rounded-2xl bg-cyan-400 px-3 py-3 text-xs font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:scale-[1.02] disabled:opacity-40">
          <SkipForward className="mx-auto mb-1" size={16} /> Next
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

export default function QueueDashboardPage() {
  const { snapshot, connected, connect, refresh } = useQueueStore();
  const [busy, setBusy] = useState(false);
  const [volume, setVolume] = useState(0.9);
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    setChartReady(true);
    refresh().catch(() => {});
    return connect();
  }, [connect, refresh]);

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

  return (
    <div className="min-h-full rounded-[32px] bg-slate-950 p-4 text-white shadow-2xl shadow-slate-950/30 lg:p-6">
      <div className="pointer-events-none fixed inset-0 opacity-30">
        <div className="absolute left-1/4 top-20 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />
      </div>

      <div className="relative mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-1.5 text-xs font-black text-cyan-200">
            <RadioTower size={14} />
            {connected ? 'REALTIME CONNECTED' : 'CONNECTING'}
          </div>
          <h1 className="text-3xl font-black tracking-tight lg:text-5xl">Command Center Antrian</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Dashboard petugas untuk memanggil, melewati, menyelesaikan, dan memonitor seluruh container pelayanan SMAN 2 Cibinong secara realtime.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a href="/queue-display" target="_blank" className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 shadow-lg shadow-white/10">
            <MonitorUp size={17} /> Buka Display TV
          </a>
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-xs font-bold text-slate-300">
            <Volume2 size={16} />
            <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(event) => setVolume(Number(event.target.value))} className="w-24 accent-cyan-300" />
          </label>
        </div>
      </div>

      <div className="relative grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Hari Ini" value={snapshot.analytics.totalToday} icon={UsersRound} hint="Semua tiket yang dibuat hari ini" />
        <StatCard label="Sedang Dipanggil" value={latestCalled?.number ?? '-'} icon={Megaphone} hint={latestCalled?.service ?? 'Belum ada panggilan aktif'} />
        <StatCard label="Selesai" value={snapshot.analytics.done} icon={CheckCircle2} hint="Layanan berhasil selesai" />
        <StatCard label="Rata-rata Tunggu" value={`${snapshot.analytics.averageWaitMinutes}m`} icon={Clock3} hint={`Peak hour: ${snapshot.analytics.peakHour}`} />
        <StatCard label="Container Aktif" value={snapshot.analytics.activeContainers} icon={Activity} hint="Loket/container yang tidak pause" />
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
          <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <h2 className="text-sm font-black uppercase tracking-[0.22em] text-slate-300">Realtime Graph</h2>
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
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: '#020617', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, color: '#fff' }} />
                    <Area type="monotone" dataKey="total" stroke="#22d3ee" strokeWidth={3} fill="url(#queueTotal)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <h2 className="text-sm font-black uppercase tracking-[0.22em] text-slate-300">Live Queue</h2>
            <div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {snapshot.tickets.slice(0, 14).map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <div>
                    <p className="font-black text-white">{ticket.number}</p>
                    <p className="text-xs text-slate-400">{ticket.visitorName} - {ticket.service}</p>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black text-slate-300">{ticket.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
