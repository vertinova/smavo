'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Maximize2, RadioTower, Volume2 } from 'lucide-react';
import { formatQueueNumber, formatQueueService, speakQueueCall, unlockQueueAudio, type QueueContainer } from '@/lib/queue';
import { useQueueStore } from '@/lib/queueStore';

type DisplayMode = 'grid' | 'focus' | 'tv';

const tickerText = [
  'Selamat Datang di Layanan SPMB Sekolah MAUNG SMAN 2 Cibinong Tahun 2026',
  'Berakhlak Mulia, Tangguh, dan Unggul',
  'SMAVO: Smart, Milenial, Awasome, Visioner, Outstanding',
  'Beyond Expectations',
  'Siapkan Berkas Yang Diperlukan',
  'Perhatikan Nomor Antre Anda',
].join('     -     ');

function useClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return now;
}

function formatClock(date: Date) {
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function QueueNumber({ container, featured }: { container: QueueContainer; featured: boolean }) {
  const active = container.activeTicket;

  return (
    <h2
      className={`break-words font-black leading-none tracking-normal text-slate-950 ${
        featured ? 'text-[clamp(4.75rem,11vw,10.5rem)]' : 'text-[clamp(2.5rem,5vw,4.5rem)]'
      }`}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={active?.number ?? `${container.id}-empty`}
          className="block"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -24, scale: 1.03 }}
          transition={{ type: 'spring', stiffness: 180, damping: 20 }}
        >
          {active ? formatQueueNumber(active.number) : '---'}
        </motion.span>
      </AnimatePresence>
    </h2>
  );
}

function StatusPill({ paused }: { paused: boolean }) {
  return (
    <span
      className={`inline-flex h-10 shrink-0 items-center rounded-full px-4 text-sm font-black ring-1 ${
        paused
          ? 'bg-amber-100 text-amber-800 ring-amber-200'
          : 'bg-emerald-100 text-emerald-800 ring-emerald-200'
      }`}
    >
      {paused ? 'PAUSE' : 'OPEN'}
    </span>
  );
}

function ServiceTile({ container, featured = false }: { container: QueueContainer; featured?: boolean }) {
  const nextTickets = container.nextTickets.slice(0, featured ? 5 : 2);

  if (!featured) {
    return (
      <motion.div
        layout
        className="relative grid h-full min-h-[136px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white/90 p-5 text-left shadow-xl shadow-sky-200/30 backdrop-blur-xl"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-sky-500 to-amber-300" />
        <div className="min-w-0">
          <p className="truncate text-xs font-black uppercase tracking-[0.24em] text-cyan-700">{container.name}</p>
          <div className="mt-2">
            <QueueNumber container={container} featured={false} />
          </div>
          <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <p className="truncate text-lg font-black leading-tight text-slate-900">{container.operator || container.name}</p>
            <p className="truncate text-sm font-bold text-slate-500">{formatQueueService(container.service)}</p>
          </div>
        </div>
        <div className="flex h-full flex-col items-end justify-between gap-3">
          <StatusPill paused={container.isPaused} />
          <div className="max-w-[12rem] text-right">
            <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-slate-400">Berikutnya</p>
            <div className="mt-2 flex flex-wrap justify-end gap-2">
              {nextTickets.length ? (
                nextTickets.map((ticket) => (
                  <span key={ticket.id} className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-black text-sky-900 ring-1 ring-sky-100">
                    {formatQueueNumber(ticket.number)}
                  </span>
                ))
              ) : (
                <span className="text-xs font-bold text-slate-400">Menunggu</span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      className="relative flex h-full min-h-[320px] flex-col overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/95 p-7 shadow-2xl shadow-sky-200/40 backdrop-blur-xl xl:p-9"
    >
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-cyan-400 via-sky-500 to-amber-300" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(34,211,238,0.18),transparent_34%),radial-gradient(circle_at_88%_82%,rgba(251,191,36,0.18),transparent_36%)]" />
      {container.activeTicket ? <div className="absolute inset-0 animate-pulse bg-cyan-100/25" /> : null}

      <div className="relative flex items-start justify-between gap-5">
        <div className="min-w-0">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-cyan-700 xl:text-base">Sedang Dipanggil</p>
          <p className="mt-2 truncate text-xl font-extrabold text-slate-600 xl:text-2xl">{container.name}</p>
        </div>
        <StatusPill paused={container.isPaused} />
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col justify-center py-8">
        <QueueNumber container={container} featured />
        <div className="mt-5 min-w-0">
          <p className="truncate text-3xl font-black text-slate-950 xl:text-4xl">{container.operator || container.name}</p>
          <p className="mt-1 truncate text-xl font-bold text-slate-600 xl:text-2xl">{formatQueueService(container.service)}</p>
        </div>
      </div>

      <div className="relative rounded-2xl bg-slate-50/90 p-4 ring-1 ring-slate-200/80 xl:p-5">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Antrian Berikutnya</p>
        <div className="mt-3 flex flex-wrap gap-2 xl:gap-3">
          {nextTickets.length ? (
            nextTickets.map((ticket) => (
              <span key={ticket.id} className="rounded-xl bg-white px-4 py-2 text-lg font-black text-sky-900 shadow-sm ring-1 ring-sky-100 xl:text-xl">
                {formatQueueNumber(ticket.number)}
              </span>
            ))
          ) : (
            <span className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-500 ring-1 ring-slate-200">
              Menunggu antrian masuk
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function QueueDisplayPage() {
  const { snapshot, connected, connect, refresh } = useQueueStore();
  const [mode, setMode] = useState<DisplayMode>('tv');
  const [focusId, setFocusId] = useState('container-1');
  const [volume, setVolume] = useState(0.85);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const lastSpokenKey = useRef('');
  const clock = useClock();

  useEffect(() => {
    refresh().catch(() => {});
    return connect();
  }, [connect, refresh]);

  const focusedContainer = useMemo(
    () => snapshot.containers.find((container) => container.id === focusId) ?? snapshot.containers[0],
    [focusId, snapshot.containers]
  );

  useEffect(() => {
    if (snapshot.containers.length && !snapshot.containers.some((container) => container.id === focusId)) {
      setFocusId(snapshot.containers[0].id);
    }
  }, [focusId, snapshot.containers]);

  useEffect(() => {
    if (!audioEnabled) return;
    const container = snapshot.containers
      .filter((item) => item.activeTicket?.calledAt)
      .sort((a, b) => new Date(b.activeTicket!.calledAt!).getTime() - new Date(a.activeTicket!.calledAt!).getTime())[0];
    const active = container?.activeTicket;
    const nextKey = active ? `${active.id}-${active.calledAt ?? active.createdAt}` : '';
    if (!container || !active || !nextKey || lastSpokenKey.current === nextKey) return;
    lastSpokenKey.current = nextKey;
    speakQueueCall(active, container, volume);
  }, [audioEnabled, snapshot.containers, volume]);

  const enableAudio = () => {
    const enabled = unlockQueueAudio(volume);
    setAudioEnabled(enabled);
    const container = snapshot.containers.find((item) => item.activeTicket);
    if (container?.activeTicket) {
      lastSpokenKey.current = `${container.activeTicket.id}-${container.activeTicket.calledAt ?? container.activeTicket.createdAt}`;
      speakQueueCall(container.activeTicket, container, volume);
    }
  };

  const featuredContainer = mode === 'grid'
    ? snapshot.containers.find((container) => container.activeTicket) ?? focusedContainer
    : focusedContainer;

  return (
    <main className="relative h-screen overflow-hidden bg-sky-50 text-slate-950">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(34,211,238,0.24),transparent_32%),radial-gradient(circle_at_86%_88%,rgba(251,191,36,0.22),transparent_34%)]" />
        <div
          className="absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage: 'linear-gradient(#0ea5e9 1px, transparent 1px), linear-gradient(90deg, #0ea5e9 1px, transparent 1px)',
            backgroundSize: '72px 72px',
          }}
        />
      </div>

      <header className="relative z-10 flex h-[96px] items-center justify-between gap-4 px-5 py-4 xl:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <Image src="/logo-smavo.jpeg" alt="SMAN 2 Cibinong" width={64} height={64} className="h-14 w-14 shrink-0 rounded-2xl object-cover shadow-xl" />
          <div className="min-w-0">
            <p className="truncate text-xs font-black uppercase tracking-[0.28em] text-cyan-700 xl:text-sm">SMAN 2 Cibinong</p>
            <h1 className="truncate text-2xl font-black tracking-normal xl:text-3xl">Realtime Queue Display</h1>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-4xl font-black leading-none tracking-normal xl:text-5xl">{formatClock(clock)}</p>
          <p className="mt-1 text-sm font-bold text-slate-500">{formatDate(clock)}</p>
        </div>
      </header>

      <section className="relative z-10 h-[calc(100vh-152px)] px-5 pb-4 xl:px-8">
        {mode === 'grid' ? (
          <div className="grid h-full min-h-0 auto-rows-fr gap-4 overflow-hidden md:grid-cols-2 xl:grid-cols-3 xl:gap-5">
            {snapshot.containers.map((container) => (
              <ServiceTile key={container.id} container={container} featured={container.id === featuredContainer?.id} />
            ))}
          </div>
        ) : (
          <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_minmax(0,0.72fr)] gap-4 overflow-hidden xl:grid-cols-[minmax(0,1.25fr)_minmax(420px,0.75fr)] xl:grid-rows-none xl:gap-6">
            {featuredContainer ? <ServiceTile container={featuredContainer} featured /> : null}
            <div className="grid min-h-0 auto-rows-fr gap-3 overflow-hidden xl:gap-4">
              {snapshot.containers.filter((container) => container.id !== featuredContainer?.id).slice(0, 4).map((container) => (
                <button key={container.id} onClick={() => setFocusId(container.id)} className="h-full min-h-0 text-left">
                  <ServiceTile container={container} />
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="absolute bottom-0 left-0 right-0 z-20 flex h-14 items-center border-t border-cyan-100 bg-white/90 shadow-[0_-18px_50px_rgba(14,165,233,0.12)] backdrop-blur-xl">
        <div className="animate-[ticker_34s_linear_infinite] whitespace-nowrap text-xl font-black tracking-normal text-cyan-800 xl:text-2xl">
          {tickerText}     -     {tickerText}
        </div>
      </div>

      <div className="absolute bottom-[4.5rem] left-5 right-5 z-30 flex flex-wrap items-center justify-between gap-3 opacity-25 transition-opacity hover:opacity-100 focus-within:opacity-100 xl:left-8 xl:right-8">
        <div className="flex items-center gap-2 rounded-full border border-cyan-100 bg-white/80 px-4 py-2 text-xs font-black text-slate-700 shadow-lg shadow-cyan-200/20 backdrop-blur">
          <RadioTower size={15} className={connected ? 'text-emerald-300' : 'text-amber-300'} />
          {connected ? 'LIVE SYNC' : 'RECONNECTING'}
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-3xl border border-cyan-100 bg-white/85 p-2 shadow-lg shadow-cyan-200/20 backdrop-blur-xl">
          <button onClick={enableAudio} className={`rounded-2xl px-4 py-2 text-xs font-black uppercase transition ${audioEnabled ? 'bg-emerald-300 text-slate-950' : 'bg-cyan-300 text-slate-950'}`}>
            {audioEnabled ? 'Suara Aktif' : 'Aktifkan Suara'}
          </button>
          {(['tv', 'grid', 'focus'] as DisplayMode[]).map((item) => (
            <button key={item} onClick={() => setMode(item)} className={`rounded-2xl px-4 py-2 text-xs font-black uppercase transition ${mode === item ? 'bg-cyan-300 text-slate-950' : 'text-slate-600 hover:bg-cyan-50'}`}>
              {item}
            </button>
          ))}
          <select value={focusId} onChange={(event) => setFocusId(event.target.value)} className="rounded-2xl border border-cyan-100 bg-white px-4 py-2 text-xs font-black text-slate-950 outline-none">
            {snapshot.containers.map((container) => (
              <option key={container.id} value={container.id}>{container.name} - {formatQueueService(container.service)}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 rounded-2xl bg-cyan-50 px-3 py-2 text-xs font-black text-slate-700">
            <Volume2 size={14} />
            <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(event) => setVolume(Number(event.target.value))} className="w-20 accent-cyan-300" />
          </label>
          <button onClick={() => document.documentElement.requestFullscreen?.()} className="rounded-2xl bg-cyan-50 px-3 py-2 text-slate-700 hover:bg-cyan-100">
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </main>
  );
}
