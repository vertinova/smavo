'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Maximize2, RadioTower, Volume2, MousePointerClick, Sparkles } from 'lucide-react';
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
  const displayNumber = active ? formatQueueNumber(active.number) : '---';
  const [prefix, suffix] = displayNumber.includes('-') ? displayNumber.split('-', 2) : ['', displayNumber];

  if (featured) {
    return (
      <div className="min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={active?.number ?? `${container.id}-empty`}
            className="min-w-0"
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 1.03 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          >
            {prefix ? (
              <p className="truncate text-[clamp(1.15rem,2.1vw,2.25rem)] font-black leading-none tracking-normal text-slate-950/80">
                {prefix}
              </p>
            ) : null}
            <p className="mt-1 text-[clamp(4rem,8.5vw,7.5rem)] font-black leading-[0.86] tracking-tight text-slate-950">
              {suffix}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <AnimatePresence mode="wait">
        <motion.div
          key={active?.number ?? `${container.id}-empty`}
          className="min-w-0"
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 200, damping: 22 }}
        >
          {prefix && active ? (
            <p className="truncate text-[0.7rem] font-black uppercase tracking-[0.12em] text-slate-500">
              {prefix}
            </p>
          ) : null}
          <p className="truncate text-[clamp(1.85rem,2.35vw,2.75rem)] font-black leading-none tracking-normal text-slate-950">
            {active ? suffix : displayNumber}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function StatusPill({ paused, compact = false }: { paused: boolean; compact?: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full font-black ring-1 ${
        compact ? 'h-7 px-2.5 text-[10px]' : 'h-8 px-3 text-xs'
      } ${
        paused
          ? 'bg-amber-100 text-amber-800 ring-amber-200'
          : 'bg-emerald-100 text-emerald-800 ring-emerald-200'
      }`}
    >
      {paused ? 'PAUSE' : 'OPEN'}
    </span>
  );
}

function ServiceTile({ container, featured = false, highlight = false }: { container: QueueContainer; featured?: boolean; highlight?: boolean }) {
  const nextTickets = container.nextTickets.slice(0, featured ? 5 : 2);
  const isActive = Boolean(container.activeTicket);

  if (!featured) {
    return (
      <motion.div
        layout
        layoutId={`tile-${container.id}`}
        transition={{ layout: { type: 'spring', stiffness: 220, damping: 26 } }}
        className={`relative flex h-full min-h-[96px] flex-col justify-between overflow-hidden rounded-2xl border bg-white/95 p-3 text-left shadow-lg shadow-sky-200/20 backdrop-blur-xl transition-colors ${
          highlight ? 'border-cyan-400 ring-2 ring-cyan-300/50' : 'border-slate-200/80'
        }`}
      >
        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${isActive ? 'from-cyan-400 via-sky-500 to-amber-300' : 'from-slate-200 via-slate-100 to-slate-200'}`} />
        <div className="flex min-w-0 items-start justify-between gap-2">
          <p className="min-w-0 truncate text-[0.62rem] font-black uppercase tracking-[0.2em] text-cyan-700">{container.name}</p>
          <StatusPill paused={container.isPaused} compact />
        </div>

        <div className="grid min-h-0 grid-cols-[minmax(4.7rem,0.75fr)_minmax(0,1fr)_minmax(6.8rem,auto)] items-end gap-2">
          <div className="min-w-0">
            <QueueNumber container={container} featured={false} />
          </div>
          <div className="min-w-0 pb-0.5">
            <p className="truncate text-sm font-black leading-tight text-slate-900">{container.operator || container.name}</p>
            <p className="truncate text-[11px] font-bold leading-tight text-slate-500">{formatQueueService(container.service)}</p>
          </div>
          <div className="min-w-0 pb-0.5 text-right">
            <p className="text-[0.6rem] font-black uppercase tracking-[0.18em] text-slate-400">Berikutnya</p>
            <div className="mt-1 flex flex-wrap justify-end gap-1">
              {nextTickets.length ? (
                nextTickets.map((ticket) => (
                  <span key={ticket.id} className="rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-black text-sky-900 ring-1 ring-sky-100">
                    {formatQueueNumber(ticket.number)}
                  </span>
                ))
              ) : (
                <span className="text-[11px] font-bold text-slate-400">Menunggu</span>
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
      layoutId={`tile-${container.id}`}
      transition={{ layout: { type: 'spring', stiffness: 220, damping: 26 } }}
      className="relative flex h-full min-h-[240px] flex-col overflow-hidden rounded-[2rem] border border-cyan-200 bg-white/95 p-5 shadow-2xl shadow-cyan-200/40 backdrop-blur-xl xl:p-6"
    >
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-cyan-400 via-sky-500 to-amber-300" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(34,211,238,0.20),transparent_34%),radial-gradient(circle_at_88%_82%,rgba(251,191,36,0.18),transparent_36%)]" />
      {isActive ? (
        <motion.div
          className="absolute inset-0 bg-cyan-100/30"
          animate={{ opacity: [0.2, 0.45, 0.2] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      ) : null}

      <div className="relative flex items-start justify-between gap-5">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.28em] text-cyan-700 xl:text-sm">
            <Sparkles size={14} className="text-amber-500" />
            Sedang Dipanggil
          </p>
          <p className="mt-2 truncate text-xl font-extrabold text-slate-600 xl:text-2xl">{container.name}</p>
        </div>
        <StatusPill paused={container.isPaused} />
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col justify-center py-3 xl:py-4">
        <QueueNumber container={container} featured />
        <div className="mt-3 min-w-0">
          <p className="truncate text-lg font-black text-slate-950 xl:text-xl">{container.operator || container.name}</p>
          <p className="mt-1 truncate text-sm font-bold text-slate-600 xl:text-base">{formatQueueService(container.service)}</p>
        </div>
      </div>

      <div className="relative rounded-2xl bg-slate-50/90 p-3 ring-1 ring-slate-200/80 xl:p-4">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Antrean Berikutnya</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {nextTickets.length ? (
            nextTickets.map((ticket) => (
              <span key={ticket.id} className="rounded-xl bg-white px-3 py-1.5 text-base font-black text-sky-900 shadow-sm ring-1 ring-sky-100 xl:text-lg">
                {formatQueueNumber(ticket.number)}
              </span>
            ))
          ) : (
            <span className="rounded-xl bg-white px-3 py-1.5 text-sm font-bold text-slate-500 ring-1 ring-slate-200">
              Menunggu antrean masuk
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
  const [focusId, setFocusId] = useState<string>('');
  const [autoFocus, setAutoFocus] = useState(true);
  const [volume, setVolume] = useState(0.85);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const lastSpokenKey = useRef('');
  const manualOverrideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clock = useClock();

  useEffect(() => {
    refresh().catch(() => {});
    return connect();
  }, [connect, refresh]);

  const mostRecentActiveContainer = useMemo(() => {
    return snapshot.containers
      .filter((item) => item.activeTicket?.calledAt)
      .sort((a, b) => new Date(b.activeTicket!.calledAt!).getTime() - new Date(a.activeTicket!.calledAt!).getTime())[0]
      ?? null;
  }, [snapshot.containers]);

  useEffect(() => {
    if (!autoFocus) return;
    if (mostRecentActiveContainer) {
      setFocusId(mostRecentActiveContainer.id);
    } else if (!focusId && snapshot.containers.length) {
      setFocusId(snapshot.containers[0].id);
    }
  }, [autoFocus, mostRecentActiveContainer, snapshot.containers, focusId]);

  const focusedContainer = useMemo(
    () => snapshot.containers.find((container) => container.id === focusId) ?? mostRecentActiveContainer ?? snapshot.containers[0],
    [focusId, snapshot.containers, mostRecentActiveContainer]
  );

  useEffect(() => {
    if (snapshot.containers.length && !snapshot.containers.some((container) => container.id === focusId)) {
      setFocusId(snapshot.containers[0].id);
    }
  }, [focusId, snapshot.containers]);

  useEffect(() => {
    if (!audioEnabled) return;
    const container = mostRecentActiveContainer;
    const active = container?.activeTicket;
    const nextKey = active ? `${active.id}-${active.calledAt ?? active.createdAt}` : '';
    if (!container || !active || !nextKey || lastSpokenKey.current === nextKey) return;
    lastSpokenKey.current = nextKey;
    speakQueueCall(active, container, volume);
  }, [audioEnabled, mostRecentActiveContainer, volume]);

  const enableAudio = () => {
    const enabled = unlockQueueAudio(volume);
    setAudioEnabled(enabled);
    const container = mostRecentActiveContainer;
    if (container?.activeTicket) {
      lastSpokenKey.current = `${container.activeTicket.id}-${container.activeTicket.calledAt ?? container.activeTicket.createdAt}`;
      speakQueueCall(container.activeTicket, container, volume);
    }
  };

  const manualSelect = (id: string) => {
    setFocusId(id);
    setAutoFocus(false);
    if (manualOverrideTimer.current) clearTimeout(manualOverrideTimer.current);
    manualOverrideTimer.current = setTimeout(() => setAutoFocus(true), 12000);
  };

  useEffect(() => () => {
    if (manualOverrideTimer.current) clearTimeout(manualOverrideTimer.current);
  }, []);

  const featuredContainer = focusedContainer;
  const otherContainers = useMemo(
    () => snapshot.containers.filter((container) => container.id !== featuredContainer?.id),
    [featuredContainer?.id, snapshot.containers]
  );

  const otherCount = otherContainers.length;

  return (
    <main className="relative h-screen overflow-hidden bg-sky-50 text-slate-950">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(34,211,238,0.24),transparent_32%),radial-gradient(circle_at_86%_88%,rgba(251,191,36,0.22),transparent_34%)]" />
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage: 'linear-gradient(#0ea5e9 1px, transparent 1px), linear-gradient(90deg, #0ea5e9 1px, transparent 1px)',
            backgroundSize: '72px 72px',
          }}
        />
      </div>

      <header className="relative z-10 flex h-[76px] items-center justify-between gap-4 px-5 py-3 xl:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <Image src="/logo-smavo.jpeg" alt="SMAN 2 Cibinong" width={64} height={64} className="h-12 w-12 shrink-0 rounded-2xl object-cover shadow-xl xl:h-14 xl:w-14" />
          <div className="min-w-0">
            <p className="truncate text-[11px] font-black uppercase tracking-[0.28em] text-cyan-700 xl:text-sm">SMAN 2 Cibinong</p>
            <h1 className="truncate text-xl font-black tracking-tight xl:text-3xl">Realtime Queue Display</h1>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-3xl font-black leading-none tracking-normal xl:text-5xl">{formatClock(clock)}</p>
          <p className="mt-1 text-xs font-bold text-slate-500 xl:text-sm">{formatDate(clock)}</p>
        </div>
      </header>

      <section className="relative z-10 h-[calc(100vh-128px)] px-3 pb-3 sm:px-5 xl:px-8">
        {mode === 'grid' ? (
          <div
            className="grid h-full min-h-0 gap-3 overflow-hidden md:gap-4"
            style={{
              gridTemplateColumns: `repeat(${Math.min(snapshot.containers.length || 1, 3)}, minmax(0, 1fr))`,
              gridAutoRows: '1fr',
            }}
          >
            <AnimatePresence>
              {snapshot.containers.map((container) => (
                <ServiceTile
                  key={container.id}
                  container={container}
                  highlight={container.id === featuredContainer?.id}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="grid h-full min-h-0 grid-rows-[minmax(230px,0.78fr)_minmax(0,1fr)] gap-3 overflow-hidden xl:grid-cols-[minmax(380px,0.78fr)_minmax(680px,1.22fr)] xl:grid-rows-none xl:gap-5">
            <AnimatePresence mode="popLayout">
              {featuredContainer ? (
                <ServiceTile key={`featured-${featuredContainer.id}`} container={featuredContainer} featured />
              ) : null}
            </AnimatePresence>
            <div
              className="grid min-h-0 content-start gap-2 overflow-y-auto pr-1 xl:gap-3"
              style={{
                gridAutoRows: otherCount > 8 ? 'minmax(96px, 1fr)' : 'minmax(112px, 1fr)',
                gridTemplateColumns: otherCount > 2 ? 'repeat(2, minmax(0, 1fr))' : 'minmax(0, 1fr)',
              }}
            >
              <AnimatePresence>
                {otherContainers.map((container) => (
                  <button
                    key={container.id}
                    onClick={() => manualSelect(container.id)}
                    className="h-full min-h-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-2xl"
                  >
                    <ServiceTile container={container} />
                  </button>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </section>

      <div className="absolute bottom-0 left-0 right-0 z-20 flex h-12 items-center border-t border-cyan-100 bg-white/90 shadow-[0_-18px_50px_rgba(14,165,233,0.12)] backdrop-blur-xl xl:h-14">
        <div className="animate-[ticker_34s_linear_infinite] whitespace-nowrap text-lg font-black tracking-normal text-cyan-800 xl:text-2xl">
          {tickerText}     -     {tickerText}
        </div>
      </div>

      <div className="absolute bottom-[3.25rem] left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-2 opacity-0 transition-opacity hover:opacity-100 focus-within:opacity-100 sm:left-5 sm:right-5 xl:bottom-[4rem] xl:left-8 xl:right-8">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-cyan-100 bg-white/85 px-3 py-1.5 text-[11px] font-black text-slate-700 shadow-lg shadow-cyan-200/20 backdrop-blur">
            <RadioTower size={14} className={connected ? 'text-emerald-500' : 'text-amber-500'} />
            {connected ? 'LIVE SYNC' : 'RECONNECTING'}
          </div>
          <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black shadow-lg backdrop-blur ${autoFocus ? 'border-emerald-200 bg-emerald-50/90 text-emerald-700' : 'border-amber-200 bg-amber-50/90 text-amber-700'}`}>
            <MousePointerClick size={13} />
            {autoFocus ? 'AUTO FOCUS' : 'MANUAL'}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-3xl border border-cyan-100 bg-white/90 p-1.5 shadow-lg shadow-cyan-200/20 backdrop-blur-xl">
          <button onClick={enableAudio} className={`rounded-2xl px-3 py-1.5 text-[11px] font-black uppercase transition ${audioEnabled ? 'bg-emerald-300 text-slate-950' : 'bg-cyan-300 text-slate-950'}`}>
            {audioEnabled ? 'Suara Aktif' : 'Aktifkan Suara'}
          </button>
          {(['tv', 'grid', 'focus'] as DisplayMode[]).map((item) => (
            <button key={item} onClick={() => setMode(item)} className={`rounded-2xl px-3 py-1.5 text-[11px] font-black uppercase transition ${mode === item ? 'bg-cyan-300 text-slate-950' : 'text-slate-600 hover:bg-cyan-50'}`}>
              {item}
            </button>
          ))}
          <button
            onClick={() => setAutoFocus((current) => !current)}
            className={`rounded-2xl px-3 py-1.5 text-[11px] font-black uppercase transition ${autoFocus ? 'bg-emerald-300 text-slate-950' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-emerald-50'}`}
          >
            Auto
          </button>
          <select
            value={focusId}
            onChange={(event) => manualSelect(event.target.value)}
            className="rounded-2xl border border-cyan-100 bg-white px-3 py-1.5 text-[11px] font-black text-slate-950 outline-none"
          >
            {snapshot.containers.map((container) => (
              <option key={container.id} value={container.id}>{container.name} - {formatQueueService(container.service)}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 rounded-2xl bg-cyan-50 px-2.5 py-1.5 text-[11px] font-black text-slate-700">
            <Volume2 size={13} />
            <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(event) => setVolume(Number(event.target.value))} className="w-20 accent-cyan-400" />
          </label>
          <button onClick={() => document.documentElement.requestFullscreen?.()} className="rounded-2xl bg-cyan-50 px-2.5 py-1.5 text-slate-700 hover:bg-cyan-100">
            <Maximize2 size={14} />
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
