'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Maximize2, RadioTower, Volume2 } from 'lucide-react';
import { speakQueueCall, unlockQueueAudio, type QueueContainer } from '@/lib/queue';
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
      className={`relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.07] shadow-2xl shadow-black/30 backdrop-blur-xl ${featured ? 'p-10' : 'p-6'}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-violet-500/10" />
      {active ? <div className="absolute inset-0 animate-pulse bg-cyan-300/5" /> : null}
      <div className="relative flex items-start justify-between gap-6">
        <div>
          <p className={`${featured ? 'text-lg' : 'text-xs'} font-black uppercase tracking-[0.32em] text-cyan-200`}>
            {featured ? 'NOW SERVING' : container.name}
          </p>
          <h2 className={`${featured ? 'mt-4 text-7xl xl:text-8xl' : 'mt-2 text-4xl'} font-black leading-none tracking-normal text-white drop-shadow-[0_0_34px_rgba(34,211,238,0.35)]`}>
            <AnimatePresence mode="wait">
              <motion.span
                key={active?.number ?? `${container.id}-empty`}
                initial={{ opacity: 0, y: 30, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 180, damping: 20 }}
              >
                {active?.number ?? '---'}
              </motion.span>
            </AnimatePresence>
          </h2>
          <p className={`${featured ? 'mt-5 text-3xl' : 'mt-3 text-lg'} font-black text-slate-200`}>{container.name}</p>
          <p className={`${featured ? 'text-2xl' : 'text-sm'} font-bold text-slate-400`}>{container.service}</p>
        </div>
        <div className="rounded-full bg-emerald-400/15 px-4 py-2 text-sm font-black text-emerald-200">
          {container.isPaused ? 'PAUSE' : 'OPEN'}
        </div>
      </div>

      <div className={`relative ${featured ? 'mt-10' : 'mt-6'}`}>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Next Queue</p>
        <div className="mt-3 flex flex-wrap gap-3">
          {container.nextTickets.slice(0, featured ? 5 : 3).map((ticket) => (
            <span key={ticket.id} className={`${featured ? 'px-5 py-3 text-2xl' : 'px-3 py-2 text-sm'} rounded-2xl bg-white/10 font-black text-white`}>
              {ticket.number}
            </span>
          ))}
          {!container.nextTickets.length ? <span className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-bold text-slate-400">Menunggu antrian masuk</span> : null}
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
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0">
        <div className="absolute left-[8%] top-[12%] h-[34rem] w-[34rem] animate-pulse rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute bottom-[-8%] right-[8%] h-[36rem] w-[36rem] rounded-full bg-violet-500/20 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
            backgroundSize: '72px 72px',
          }}
        />
      </div>

      <header className="relative z-10 flex items-center justify-between gap-6 px-8 py-6">
        <div className="flex items-center gap-4">
          <Image src="/logo-smavo.jpeg" alt="SMAN 2 Cibinong" width={64} height={64} className="h-16 w-16 rounded-2xl object-cover shadow-xl" />
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-cyan-200">SMAN 2 Cibinong</p>
            <h1 className="text-3xl font-black tracking-tight">Realtime Queue Display</h1>
          </div>
        </div>
        <div className="text-right">
          <p className="text-5xl font-black tracking-normal">{formatClock(clock)}</p>
          <p className="mt-1 text-sm font-bold text-slate-400">{formatDate(clock)}</p>
        </div>
      </header>

      <section className="relative z-10 px-8 pb-24">
        {mode === 'grid' ? (
          <div className="grid gap-5 xl:grid-cols-3">
            {snapshot.containers.map((container) => (
              <ServiceTile key={container.id} container={container} featured={container.id === featuredContainer?.id} />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            {featuredContainer ? <ServiceTile container={featuredContainer} featured /> : null}
            <div className="grid gap-4">
              {snapshot.containers.filter((container) => container.id !== featuredContainer?.id).slice(0, 4).map((container) => (
                <button key={container.id} onClick={() => setFocusId(container.id)} className="text-left">
                  <ServiceTile container={container} />
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-black/45 py-4 backdrop-blur-xl">
        <div className="animate-[ticker_34s_linear_infinite] whitespace-nowrap text-2xl font-black tracking-normal text-cyan-100">
          {tickerText}     •     {tickerText}
        </div>
      </div>

      <div className="absolute bottom-20 left-8 right-8 z-30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black text-slate-200 backdrop-blur">
          <RadioTower size={15} className={connected ? 'text-emerald-300' : 'text-amber-300'} />
          {connected ? 'LIVE SYNC' : 'RECONNECTING'}
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-3xl border border-white/10 bg-white/10 p-2 backdrop-blur-xl">
          <button onClick={enableAudio} className={`rounded-2xl px-4 py-2 text-xs font-black uppercase transition ${audioEnabled ? 'bg-emerald-300 text-slate-950' : 'bg-cyan-300 text-slate-950'}`}>
            {audioEnabled ? 'Suara Aktif' : 'Aktifkan Suara'}
          </button>
          {(['tv', 'grid', 'focus'] as DisplayMode[]).map((item) => (
            <button key={item} onClick={() => setMode(item)} className={`rounded-2xl px-4 py-2 text-xs font-black uppercase transition ${mode === item ? 'bg-cyan-300 text-slate-950' : 'text-slate-300 hover:bg-white/10'}`}>
              {item}
            </button>
          ))}
          <select value={focusId} onChange={(event) => setFocusId(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-2 text-xs font-black text-white outline-none">
            {snapshot.containers.map((container) => (
              <option key={container.id} value={container.id}>{container.name} - {container.service}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-xs font-black text-slate-300">
            <Volume2 size={14} />
            <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(event) => setVolume(Number(event.target.value))} className="w-20 accent-cyan-300" />
          </label>
          <button onClick={() => document.documentElement.requestFullscreen?.()} className="rounded-2xl bg-white/10 px-3 py-2 text-slate-200 hover:bg-white/15">
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
