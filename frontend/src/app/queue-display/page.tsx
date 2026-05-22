'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Maximize2, RadioTower, Volume2 } from 'lucide-react';
import { formatQueueNumber, formatQueueService, speakQueueCall, unlockQueueAudio, type QueueContainer } from '@/lib/queue';
import { useQueueStore } from '@/lib/queueStore';

type DisplayMode = 'grid' | 'focus' | 'tv';

const tickerText = [
  'Selamat datang di layanan SPMB SMAN 2 Cibinong.',
  'Siapkan berkas pendaftaran sebelum nomor antrian dipanggil.',
  'Perhatikan layar informasi dan suara panggilan petugas.',
  'SMAVO Super App mendukung pelayanan sekolah yang cepat, transparan, dan modern.',
].join('     •     ');

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

function ServiceTile({ container, featured = false }: { container: QueueContainer; featured?: boolean }) {
  const active = container.activeTicket;

  return (
    <motion.div
      layout
      className={`relative flex h-full min-h-0 flex-col overflow-hidden rounded-[2rem] border border-cyan-100/80 bg-white/90 shadow-2xl shadow-cyan-200/40 backdrop-blur-xl ${featured ? 'p-7 xl:p-9' : 'p-4 xl:p-5'}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-100/80 via-white/30 to-amber-100/70" />
      {active ? <div className="absolute inset-0 animate-pulse bg-cyan-200/25" /> : null}
      <div className="relative flex min-h-0 items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={`${featured ? 'text-base xl:text-lg' : 'text-[0.68rem] xl:text-xs'} truncate font-black uppercase tracking-[0.28em] text-cyan-700`}>
            {featured ? 'SEDANG DIPANGGIL' : container.name}
          </p>
          <h2 className={`${featured ? 'mt-3 text-[clamp(4.5rem,9vw,8rem)]' : 'mt-2 text-[clamp(2.2rem,3.1vw,3.8rem)]'} break-words font-black leading-none tracking-normal text-slate-950 drop-shadow-[0_0_28px_rgba(14,165,233,0.18)]`}>
            <AnimatePresence mode="wait">
              <motion.span
                key={active?.number ?? `${container.id}-empty`}
                initial={{ opacity: 0, y: 30, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 180, damping: 20 }}
              >
                {active ? formatQueueNumber(active.number) : '---'}
              </motion.span>
            </AnimatePresence>
          </h2>
          <p className={`${featured ? 'mt-4 text-2xl xl:text-3xl' : 'mt-2 text-base xl:text-lg'} truncate font-black text-slate-900`}>{container.name}</p>
          <p className={`${featured ? 'text-xl xl:text-2xl' : 'text-xs xl:text-sm'} truncate font-bold text-slate-600`}>{formatQueueService(container.service)}</p>
        </div>
        <div className="shrink-0 rounded-full bg-emerald-100 px-3 py-2 text-xs font-black text-emerald-700 ring-1 ring-emerald-200 xl:px-4 xl:text-sm">
          {container.isPaused ? 'PAUSE' : 'OPEN'}
        </div>
      </div>

      <div className={`relative min-h-0 overflow-hidden ${featured ? 'mt-8 xl:mt-10' : 'mt-4 xl:mt-5'}`}>
        <p className="text-[0.68rem] font-black uppercase tracking-[0.24em] text-slate-500 xl:text-xs">Antrian Berikutnya</p>
        <div className="mt-3 flex flex-wrap gap-2 xl:gap-3">
          {container.nextTickets.slice(0, featured ? 5 : 3).map((ticket) => (
            <span key={ticket.id} className={`${featured ? 'px-4 py-2 text-xl xl:px-5 xl:py-3 xl:text-2xl' : 'px-3 py-2 text-xs xl:text-sm'} rounded-2xl bg-cyan-50 font-black text-cyan-900 ring-1 ring-cyan-100`}>
              {formatQueueNumber(ticket.number)}
            </span>
          ))}
          {!container.nextTickets.length ? <span className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-500">Menunggu antrian masuk</span> : null}
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
        <div className="absolute left-[8%] top-[12%] h-[34rem] w-[34rem] animate-pulse rounded-full bg-cyan-300/35 blur-[120px]" />
        <div className="absolute bottom-[-8%] right-[8%] h-[36rem] w-[36rem] rounded-full bg-amber-200/45 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.2]"
          style={{
            backgroundImage: 'linear-gradient(#0ea5e9 1px, transparent 1px), linear-gradient(90deg, #0ea5e9 1px, transparent 1px)',
            backgroundSize: '72px 72px',
          }}
        />
      </div>

      <header className="relative z-10 flex h-[104px] items-center justify-between gap-4 px-6 py-4 xl:px-8">
        <div className="flex items-center gap-4">
          <Image src="/logo-smavo.jpeg" alt="SMAN 2 Cibinong" width={64} height={64} className="h-14 w-14 rounded-2xl object-cover shadow-xl xl:h-16 xl:w-16" />
          <div className="min-w-0">
            <p className="text-sm font-black uppercase tracking-[0.28em] text-cyan-700">SMAN 2 Cibinong</p>
            <h1 className="truncate text-2xl font-black tracking-tight xl:text-3xl">Realtime Queue Display</h1>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-4xl font-black tracking-normal xl:text-5xl">{formatClock(clock)}</p>
          <p className="mt-1 text-sm font-bold text-slate-500">{formatDate(clock)}</p>
        </div>
      </header>

      <section className="relative z-10 h-[calc(100vh-168px)] px-6 pb-4 xl:px-8">
        {mode === 'grid' ? (
          <div className="grid h-full min-h-0 auto-rows-fr gap-4 overflow-hidden xl:grid-cols-3 xl:gap-5">
            {snapshot.containers.map((container) => (
              <ServiceTile key={container.id} container={container} featured={container.id === featuredContainer?.id} />
            ))}
          </div>
        ) : (
          <div className="grid h-full min-h-0 grid-rows-[minmax(0,1.35fr)_minmax(0,0.65fr)] gap-5 overflow-hidden xl:grid-cols-[1.35fr_0.65fr] xl:grid-rows-none xl:gap-6">
            {featuredContainer ? <ServiceTile container={featuredContainer} featured /> : null}
            <div className="grid min-h-0 grid-rows-4 gap-3 overflow-hidden xl:gap-4">
              {snapshot.containers.filter((container) => container.id !== featuredContainer?.id).slice(0, 4).map((container) => (
                <button key={container.id} onClick={() => setFocusId(container.id)} className="h-full min-h-0 text-left">
                  <ServiceTile container={container} />
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="absolute bottom-0 left-0 right-0 z-20 flex h-16 items-center border-t border-cyan-100 bg-white/85 shadow-[0_-18px_50px_rgba(14,165,233,0.12)] backdrop-blur-xl">
        <div className="animate-[ticker_34s_linear_infinite] whitespace-nowrap text-xl font-black tracking-normal text-cyan-800 xl:text-2xl">
          {tickerText}     •     {tickerText}
        </div>
      </div>

      <div className="absolute bottom-20 left-6 right-6 z-30 flex flex-wrap items-center justify-between gap-3 opacity-25 transition-opacity hover:opacity-100 focus-within:opacity-100 xl:left-8 xl:right-8">
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
