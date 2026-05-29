'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  FileSpreadsheet,
  Hash,
  Info,
  ListChecks,
  Loader2,
  Megaphone,
  MonitorUp,
  Pause,
  Play,
  Plus,
  RadioTower,
  RotateCcw,
  Save,
  Settings2,
  ShieldCheck,
  SkipForward,
  Sparkles,
  Trash2,
  UsersRound,
  Volume2,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import {
  customQueueCall,
  pauseContainer,
  formatQueueNumber,
  formatQueueService,
  queueAction,
  resetQueueState,
  setQueueOpen as updateQueueOpen,
  setOfflineMode,
  speakQueueCall,
  unlockQueueAudio,
  updateQueueContainers,
  type QueueContainer,
  type QueueContainerConfig,
  type QueueCallLog,
  type QueueTicket,
  type QueueVoiceOptions,
  type QueueVoiceStyle,
} from '@/lib/queue';
import { useQueueStore } from '@/lib/queueStore';

const accentMap: Record<string, { gradient: string; border: string; glow: string; chip: string }> = {
  cyan: {
    gradient: 'from-cyan-400 to-blue-500',
    border: 'border-cyan-200',
    glow: 'shadow-cyan-500/30',
    chip: 'bg-cyan-100 text-cyan-800 ring-cyan-200',
  },
  violet: {
    gradient: 'from-violet-400 to-fuchsia-500',
    border: 'border-violet-200',
    glow: 'shadow-violet-500/30',
    chip: 'bg-violet-100 text-violet-800 ring-violet-200',
  },
  emerald: {
    gradient: 'from-emerald-400 to-teal-500',
    border: 'border-emerald-200',
    glow: 'shadow-emerald-500/30',
    chip: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  },
  amber: {
    gradient: 'from-amber-300 to-orange-500',
    border: 'border-amber-200',
    glow: 'shadow-amber-500/30',
    chip: 'bg-amber-100 text-amber-800 ring-amber-200',
  },
  rose: {
    gradient: 'from-rose-400 to-pink-500',
    border: 'border-rose-200',
    glow: 'shadow-rose-500/30',
    chip: 'bg-rose-100 text-rose-800 ring-rose-200',
  },
};

const accentOptions = [
  { value: 'cyan', label: 'Cyan' },
  { value: 'violet', label: 'Violet' },
  { value: 'emerald', label: 'Emerald' },
  { value: 'amber', label: 'Amber' },
  { value: 'rose', label: 'Rose' },
];

const voiceStyleOptions: { value: QueueVoiceStyle; label: string }[] = [
  { value: 'bank', label: 'Bank Natural' },
  { value: 'semangat', label: 'Semangat' },
  { value: 'singkat', label: 'Singkat' },
  { value: 'formal', label: 'Formal' },
];

const SERVICE_PRESETS = [
  { value: 'Verifikasi Berkas', label: 'Verifikasi Berkas', hint: 'Loket awal pemeriksaan dokumen.' },
  { value: 'Operator', label: 'Operator', hint: 'Memanggil user yang sudah selesai verifikasi.' },
  { value: 'Informasi', label: 'Informasi', hint: 'Loket layanan informasi umum.' },
];

const MAX_CONTAINERS = 50;

const isOperatorService = (service?: string | null) =>
  formatQueueService(service).trim().toLowerCase() === 'operator';

const isVerificationService = (service?: string | null) =>
  formatQueueService(service).toLowerCase().includes('verifikasi');

const isInformationService = (service?: string | null) =>
  formatQueueService(service).trim().toLowerCase() === 'informasi';

const isAccountCreationServiceChoice = (serviceChoice?: string | null) =>
  (serviceChoice ?? '').trim().toLowerCase() === 'pembuatan akun spmb';

function normalizeQueueLookup(value: string, fallbackCode = 'SPMB') {
  const cleaned = value.trim().toUpperCase().replace(/\s+/g, '');
  const code = fallbackCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'SPMB';
  if (!cleaned) return '';
  if (/^\d+$/.test(cleaned)) return `${code}-${cleaned.padStart(3, '0')}`;
  if (/^[A-Z0-9]+-\d+$/.test(cleaned)) {
    const [prefix, suffix] = cleaned.split('-');
    const safePrefix = prefix.replace(/[^A-Z0-9]/g, '').slice(0, 8) || code;
    return `${safePrefix}-${suffix.padStart(3, '0')}`.replace(/^PPDB-/i, 'SPMB-');
  }
  return cleaned.replace(/^PPDB-/i, 'SPMB-');
}

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

function makeNewContainer(index: number, service: string = 'Verifikasi Berkas'): QueueContainerConfig {
  const number = index + 1;
  const isOp = service.toLowerCase() === 'operator';
  const isInfo = service.toLowerCase() === 'informasi';
  const baseName = isOp ? 'Operator' : isInfo ? 'Informasi' : 'Verifikator';
  return {
    id: `${baseName.toLowerCase()}-${number}-${Date.now().toString(36)}`,
    name: `${baseName} ${number}`,
    service,
    code: 'SPMB',
    operator: `${baseName} ${number}`,
    isPaused: false,
    accent: accentOptions[index % accentOptions.length].value,
  };
}

function formatTicketDateTime(value?: string) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatTicketDate(value?: string) {
  if (!value) return '';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value));
}

function escapeExcelCell(value: unknown) {
  const text = String(value ?? '');
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function exportTicketsForExcel(tickets: QueueTicket[]) {
  const headers = [
    'Nomor',
    'Nama Calon Peserta Didik',
    'No HP',
    'Asal Sekolah',
    'Jalur Pendaftaran',
    'Pilihan Layanan',
    'Status',
    'Container',
    'Jenis Panggilan',
    'Dipanggil Oleh',
    'Dibuat',
    'Dipanggil',
    'Selesai',
  ];
  const rows = tickets.map((ticket) => [
    formatQueueNumber(ticket.number),
    ticket.visitorName,
    ticket.phoneNumber ?? '',
    ticket.originSchool ?? '',
    ticket.registrationPath ?? '',
    ticket.serviceChoice ?? formatQueueService(ticket.service),
    ticket.status,
    ticket.containerId,
    ticket.callType ?? '',
    ticket.calledBy ?? '',
    formatTicketDateTime(ticket.createdAt),
    formatTicketDateTime(ticket.calledAt),
    formatTicketDateTime(ticket.finishedAt ?? ticket.skippedAt),
  ]);
  const table = `
    <html>
      <head><meta charset="utf-8" /></head>
      <body>
        <table border="1">
          <thead><tr>${headers.map((header) => `<th>${escapeExcelCell(header)}</th>`).join('')}</tr></thead>
          <tbody>
            ${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeExcelCell(cell)}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;
  const blob = new Blob([table], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `data-antrean-spmb-${new Date().toISOString().slice(0, 10)}.xls`;
  anchor.click();
  URL.revokeObjectURL(url);
}

type StatCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  tone: 'cyan' | 'emerald' | 'violet' | 'amber';
};

const toneClasses: Record<StatCardProps['tone'], string> = {
  cyan: 'bg-gradient-to-br from-cyan-50 to-sky-100 ring-cyan-200 text-cyan-700',
  emerald: 'bg-gradient-to-br from-emerald-50 to-teal-100 ring-emerald-200 text-emerald-700',
  violet: 'bg-gradient-to-br from-violet-50 to-fuchsia-100 ring-violet-200 text-violet-700',
  amber: 'bg-gradient-to-br from-amber-50 to-orange-100 ring-amber-200 text-amber-700',
};

const toneIconClasses: Record<StatCardProps['tone'], string> = {
  cyan: 'bg-cyan-500 text-white',
  emerald: 'bg-emerald-500 text-white',
  violet: 'bg-violet-500 text-white',
  amber: 'bg-amber-500 text-white',
};

function StatCard({ label, value, icon: Icon, hint, tone }: StatCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-card p-4 shadow-sm ring-1 ${toneClasses[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-80">{label}</p>
          <p className="mt-2 truncate text-2xl font-black text-foreground lg:text-3xl">{value}</p>
          {hint ? <p className="mt-1 truncate text-[11px] font-semibold opacity-70">{hint}</p> : null}
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-md ${toneIconClasses[tone]}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

type ContainerAction = 'call' | 'next' | 'recall' | 'done' | 'skip';

type ContainerCardProps = {
  container: QueueContainer;
  isSelected: boolean;
  busy: boolean;
  onSelect: (id: string) => void;
  onAction: (containerId: string, action: ContainerAction) => void;
  onCustomCall: (container: QueueContainer) => void;
  onPause: (containerId: string, paused: boolean) => void;
  onSpeak: (container: QueueContainer) => void;
};

function ContainerCard({ container, isSelected, busy, onSelect, onAction, onCustomCall, onPause, onSpeak }: ContainerCardProps) {
  const accent = accentMap[container.accent] ?? accentMap.cyan;
  const active = container.activeTicket;
  const hasWaiting = container.waitingCount > 0;
  const containerIsOperator = isOperatorService(container.service);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onSelect(container.id)}
      className={`relative cursor-pointer overflow-hidden rounded-2xl border-2 bg-card p-4 shadow-sm transition-all ${
        isSelected ? `${accent.border} shadow-lg ${accent.glow}` : 'border-border hover:border-accent/40'
      }`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent.gradient}`} />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{container.name}</p>
          <h3 className="mt-0.5 truncate text-base font-black text-foreground">{formatQueueService(container.service)}</h3>
          <p className="mt-0.5 truncate text-xs font-semibold text-muted">{container.operator}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black ring-1 ${
          container.isPaused
            ? 'bg-amber-100 text-amber-800 ring-amber-200'
            : 'bg-emerald-100 text-emerald-800 ring-emerald-200'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${container.isPaused ? 'bg-amber-500' : 'animate-pulse bg-emerald-500'}`} />
          {container.isPaused ? 'PAUSE' : 'LIVE'}
        </span>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Nomor Aktif</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={active?.number ?? `${container.id}-empty`}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.05, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`mt-0.5 truncate text-3xl font-black leading-none ${active ? 'text-foreground' : 'text-muted/40'} lg:text-4xl`}
            >
              {active ? formatQueueNumber(active.number) : '---'}
            </motion.p>
          </AnimatePresence>
          {active ? (
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Daftar {formatTicketDate(active.createdAt)}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 text-right">
          <div className={`rounded-lg px-2 py-1 text-center text-[10px] font-black ring-1 ${accent.chip}`}>
            {container.waitingCount} antre
          </div>
          <p className="text-[10px] font-semibold text-muted">
            {container.doneCount} selesai
          </p>
        </div>
      </div>

      {active ? (
        <div className="mt-3 rounded-xl border border-border bg-surface px-3 py-2">
          <p className="truncate text-xs font-black text-foreground">{active.visitorName}</p>
          <p className="mt-0.5 truncate text-[11px] font-semibold text-muted">
            {active.phoneNumber || '—'} {active.originSchool ? `· ${active.originSchool}` : ''} {active.registrationPath ? `· ${active.registrationPath}` : ''}
          </p>
          {containerIsOperator && active.verifiedBy ? (
            <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-widest text-emerald-700">
              ✓ Diverifikasi oleh {active.verifiedBy}
            </p>
          ) : null}
          {active.callType === 'CUSTOM' ? (
            <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-widest text-cyan-700">
              Custom oleh {active.calledBy || container.operator}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 grid grid-cols-2 gap-2" onClick={(event) => event.stopPropagation()}>
        <button
          disabled={busy || container.isPaused || Boolean(active) || !hasWaiting}
          onClick={() => onAction(container.id, 'call')}
          title={active ? 'Selesaikan nomor aktif dulu' : hasWaiting ? 'Panggil nomor berikutnya' : 'Antrean kosong'}
          className={`flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br ${accent.gradient} px-3 py-2.5 text-xs font-black text-white shadow-md transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100`}
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Megaphone size={14} />}
          {active ? 'Aktif' : hasWaiting ? 'Normal' : 'Kosong'}
        </button>
        <button
          disabled={busy || container.isPaused || Boolean(active) || !hasWaiting}
          onClick={() => onCustomCall(container)}
          title={active ? 'Selesaikan nomor aktif dulu' : hasWaiting ? 'Panggil nomor antrean tertentu' : 'Antrean kosong'}
          className="flex items-center justify-center gap-2 rounded-xl bg-surface px-3 py-2.5 text-xs font-black text-foreground ring-1 ring-border transition hover:bg-card-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Hash size={14} />
          Custom
        </button>
        <button
          disabled={busy || !active}
          onClick={() => onAction(container.id, 'done')}
          className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-2.5 text-xs font-black text-white shadow-md transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
        >
          <CheckCircle2 size={14} />
          Selesai
        </button>
        <div className="col-span-2 grid grid-cols-3 gap-2">
          <button
            disabled={busy || !active}
            onClick={() => onAction(container.id, 'recall')}
            title="Panggil ulang nomor aktif"
            className="flex items-center justify-center gap-1.5 rounded-lg bg-surface px-2 py-2 text-[11px] font-bold text-muted-foreground ring-1 ring-border transition hover:bg-card-hover hover:text-foreground disabled:opacity-40"
          >
            <RotateCcw size={12} /> Ulang
          </button>
          <button
            disabled={busy || !active}
            onClick={() => onSpeak(container)}
            title="Putar suara panggilan"
            className="flex items-center justify-center gap-1.5 rounded-lg bg-surface px-2 py-2 text-[11px] font-bold text-muted-foreground ring-1 ring-border transition hover:bg-card-hover hover:text-foreground disabled:opacity-40"
          >
            <Volume2 size={12} /> Audio
          </button>
          <button
            disabled={busy || !active}
            onClick={() => onAction(container.id, 'skip')}
            title="Lewati nomor aktif"
            className="flex items-center justify-center gap-1.5 rounded-lg bg-rose-50 px-2 py-2 text-[11px] font-bold text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-100 disabled:opacity-40"
          >
            <SkipForward size={12} /> Lewati
          </button>
        </div>
        <button
          disabled={busy}
          onClick={() => onPause(container.id, !container.isPaused)}
          className="col-span-2 flex items-center justify-center gap-1.5 rounded-lg bg-surface px-2 py-1.5 text-[11px] font-bold text-muted-foreground ring-1 ring-border transition hover:bg-card-hover hover:text-foreground disabled:opacity-40"
        >
          {container.isPaused ? <Play size={12} /> : <Pause size={12} />}
          {container.isPaused ? 'Aktifkan Loket' : 'Pause Loket'}
        </button>
      </div>
    </motion.div>
  );
}

type ActiveCallHeroProps = {
  container: QueueContainer | null;
  busy: boolean;
  onAction: (containerId: string, action: ContainerAction) => void;
  onCustomCall: (container: QueueContainer) => void;
  onSpeak: (container: QueueContainer) => void;
};

function ActiveCallHero({ container, busy, onAction, onCustomCall, onSpeak }: ActiveCallHeroProps) {
  const active = container?.activeTicket ?? null;
  const accent = accentMap[container?.accent ?? 'cyan'] ?? accentMap.cyan;
  const containerIsOperator = isOperatorService(container?.service);
  const hasWaiting = (container?.waitingCount ?? 0) > 0;

  return (
    <div className={`relative overflow-hidden rounded-3xl border bg-card p-5 shadow-xl ${active ? accent.border : 'border-border'} lg:p-7`}>
      <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${accent.gradient}`} />
      {active ? (
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${accent.gradient} opacity-[0.06]`}
          animate={{ opacity: [0.04, 0.10, 0.04] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      ) : null}

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-accent">
            <Sparkles size={12} />
            {active ? 'Sedang Dipanggil' : 'Tidak Ada Panggilan'}
          </div>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-muted">{container?.name ?? '—'}</p>
          <AnimatePresence mode="wait">
            <motion.div
              key={active?.number ?? 'hero-empty'}
              initial={{ scale: 0.92, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 1.04, opacity: 0, y: -8 }}
              transition={{ type: 'spring', stiffness: 220, damping: 24 }}
              className="mt-2 min-w-0"
            >
              <p className={`truncate text-5xl font-black leading-none tracking-tight lg:text-7xl ${active ? 'text-foreground' : 'text-muted/40'}`}>
                {active ? formatQueueNumber(active.number) : '---'}
              </p>
              {active ? (
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Tanggal Daftar: {formatTicketDate(active.createdAt)}
                </p>
              ) : null}
            </motion.div>
          </AnimatePresence>
          {active ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:max-w-2xl">
              <div className="rounded-xl bg-surface px-3 py-2 ring-1 ring-border">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Nama</p>
                <p className="mt-0.5 truncate text-sm font-black text-foreground">{active.visitorName}</p>
              </div>
              <div className="rounded-xl bg-surface px-3 py-2 ring-1 ring-border">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted">No HP</p>
                <p className="mt-0.5 truncate text-sm font-black text-foreground">{active.phoneNumber || '—'}</p>
              </div>
              <div className="rounded-xl bg-surface px-3 py-2 ring-1 ring-border">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Asal Sekolah</p>
                <p className="mt-0.5 truncate text-sm font-black text-foreground">{active.originSchool || '—'}</p>
              </div>
              <div className="rounded-xl bg-surface px-3 py-2 ring-1 ring-border">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Jalur</p>
                <p className="mt-0.5 truncate text-sm font-black text-foreground">{active.registrationPath || '—'}</p>
              </div>
              <div className="rounded-xl bg-surface px-3 py-2 ring-1 ring-border">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                  {containerIsOperator ? 'Diverifikasi oleh' : 'Layanan'}
                </p>
                <p className="mt-0.5 truncate text-sm font-black text-foreground">
                  {containerIsOperator
                    ? (active.verifiedBy || 'Verifikator')
                    : (active.serviceChoice ?? formatQueueService(active.service))}
                </p>
              </div>
              {active.callType === 'CUSTOM' ? (
                <div className="rounded-xl bg-cyan-50 px-3 py-2 ring-1 ring-cyan-200">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-700">Panggil Custom</p>
                  <p className="mt-0.5 truncate text-sm font-black text-cyan-900">{active.calledBy || container?.operator || '-'}</p>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 max-w-md text-sm font-semibold text-muted">
              {hasWaiting ? 'Tekan tombol panggil untuk menarik nomor antrean berikutnya.' : 'Belum ada antrean menunggu di loket ini.'}
            </p>
          )}
        </div>

        <div className="flex flex-row flex-wrap items-stretch gap-2 lg:flex-col lg:w-72">
          <div className="grid flex-1 grid-cols-2 gap-2">
            <button
              disabled={busy || !container || container.isPaused || Boolean(active) || !hasWaiting}
              onClick={() => container && onAction(container.id, 'call')}
              className={`group flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br ${accent.gradient} px-4 py-3.5 text-sm font-black text-white shadow-lg transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 lg:py-4 lg:text-base`}
            >
              {busy ? <Loader2 size={18} className="animate-spin" /> : <Megaphone size={18} />}
              {active ? 'Aktif' : hasWaiting ? 'Normal' : 'Kosong'}
            </button>
            <button
              disabled={busy || !container || container.isPaused || Boolean(active) || !hasWaiting}
              onClick={() => container && onCustomCall(container)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-surface px-4 py-3.5 text-sm font-black text-foreground shadow-sm ring-1 ring-border transition hover:bg-card-hover disabled:cursor-not-allowed disabled:opacity-40 lg:py-4 lg:text-base"
            >
              <Hash size={18} />
              Custom
            </button>
          </div>
          <button
            disabled={busy || !active}
            onClick={() => container && onAction(container.id, 'done')}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3.5 text-sm font-black text-white shadow-lg transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 lg:py-4 lg:text-base"
          >
            <CheckCircle2 size={18} />
            Selesai
          </button>
          <div className="flex w-full gap-2">
            <button
              disabled={busy || !active}
              onClick={() => container && onAction(container.id, 'recall')}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-surface px-3 py-2 text-xs font-bold text-muted-foreground ring-1 ring-border transition hover:bg-card-hover hover:text-foreground disabled:opacity-40"
            >
              <RotateCcw size={13} /> Ulang
            </button>
            <button
              disabled={busy || !active || !container}
              onClick={() => container && onSpeak(container)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-surface px-3 py-2 text-xs font-bold text-muted-foreground ring-1 ring-border transition hover:bg-card-hover hover:text-foreground disabled:opacity-40"
            >
              <Volume2 size={13} /> Audio
            </button>
            <button
              disabled={busy || !active}
              onClick={() => container && onAction(container.id, 'skip')}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-100 disabled:opacity-40"
            >
              <SkipForward size={13} /> Lewati
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type WaitingChipProps = {
  ticket: QueueTicket;
  highlightVerified?: boolean;
};

function WaitingChip({ ticket, highlightVerified }: WaitingChipProps) {
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-baseline gap-1.5">
            <p className="truncate text-sm font-black text-foreground">{formatQueueNumber(ticket.number)}</p>
            <span className="shrink-0 text-[10px] font-bold text-muted-foreground">{formatTicketDate(ticket.createdAt)}</span>
          </div>
          <p className="mt-0.5 truncate text-xs font-semibold text-muted-foreground">{ticket.visitorName}</p>
        </div>
        {highlightVerified ? (
          <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-black text-emerald-700">
            Verifikasi OK
          </span>
        ) : null}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px] font-bold text-muted-foreground">
        {ticket.originSchool ? (
          <span className="rounded-md bg-card px-1.5 py-0.5">{ticket.originSchool}</span>
        ) : null}
        {ticket.phoneNumber ? (
          <span className="rounded-md bg-card px-1.5 py-0.5">{ticket.phoneNumber}</span>
        ) : null}
        {isAccountCreationServiceChoice(ticket.serviceChoice) ? (
          <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-rose-700 ring-1 ring-rose-100">Operator 5</span>
        ) : null}
        {ticket.registrationPath ? (
          <span className="rounded-md bg-card px-1.5 py-0.5">{ticket.registrationPath}</span>
        ) : null}
      </div>
      {highlightVerified && ticket.verifiedBy ? (
        <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-widest text-emerald-700">
          ✓ Diverifikasi {ticket.verifiedBy}
        </p>
      ) : null}
    </div>
  );
}

type RoleSectionProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  tone: 'cyan' | 'emerald' | 'violet';
  containers: QueueContainer[];
  waitingTickets: QueueTicket[];
  selectedContainerId: string;
  busy: boolean;
  highlightVerified?: boolean;
  emptyMessage: string;
  onSelect: (id: string) => void;
  onAction: (containerId: string, action: ContainerAction) => void;
  onCustomCall: (container: QueueContainer) => void;
  onPause: (containerId: string, paused: boolean) => void;
  onSpeak: (container: QueueContainer) => void;
  onOpenSettings: () => void;
};

const roleToneClasses: Record<RoleSectionProps['tone'], { ring: string; icon: string; chip: string }> = {
  cyan: {
    ring: 'ring-cyan-200',
    icon: 'bg-cyan-500 text-white',
    chip: 'bg-cyan-100 text-cyan-800 ring-cyan-200',
  },
  emerald: {
    ring: 'ring-emerald-200',
    icon: 'bg-emerald-500 text-white',
    chip: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  },
  violet: {
    ring: 'ring-violet-200',
    icon: 'bg-violet-500 text-white',
    chip: 'bg-violet-100 text-violet-800 ring-violet-200',
  },
};

function RoleSection({
  title,
  description,
  icon: Icon,
  tone,
  containers,
  waitingTickets,
  selectedContainerId,
  busy,
  highlightVerified,
  emptyMessage,
  onSelect,
  onAction,
  onCustomCall,
  onPause,
  onSpeak,
  onOpenSettings,
}: RoleSectionProps) {
  const [open, setOpen] = useState(true);
  const toneClasses = roleToneClasses[tone];
  const activeCount = containers.filter((container) => !container.isPaused).length;

  return (
    <section className={`rounded-3xl border border-border bg-card shadow-sm ring-1 ${toneClasses.ring}`}>
      <header className="flex flex-col gap-3 border-b border-border px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-5">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex flex-1 items-center gap-3 text-left"
        >
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-sm ${toneClasses.icon}`}>
            <Icon size={18} />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-base font-black text-foreground lg:text-lg">{title}</h2>
            <p className="truncate text-xs font-semibold text-muted-foreground">{description}</p>
          </div>
          <ChevronDown size={18} className={`ml-auto shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-[11px] font-black ring-1 ${toneClasses.chip}`}>
            {containers.length} loket · {activeCount} aktif
          </span>
          <span className={`rounded-full px-3 py-1 text-[11px] font-black ring-1 ${
            waitingTickets.length ? toneClasses.chip : 'bg-card-hover text-muted-foreground ring-border'
          }`}>
            {waitingTickets.length} menunggu
          </span>
        </div>
      </header>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid gap-4 px-4 py-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:px-5">
              <div>
                {containers.length ? (
                  <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                    {containers.map((container) => (
                      <ContainerCard
                        key={container.id}
                        container={container}
                        isSelected={container.id === selectedContainerId}
                        busy={busy}
                        onSelect={onSelect}
                        onAction={onAction}
                        onCustomCall={onCustomCall}
                        onPause={onPause}
                        onSpeak={onSpeak}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-border bg-surface px-4 py-6">
                    <p className="text-sm font-bold text-foreground">Belum ada loket {title.toLowerCase()}.</p>
                    <p className="text-xs text-muted-foreground">{emptyMessage}</p>
                    <button
                      type="button"
                      onClick={onOpenSettings}
                      className="inline-flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-accent-hover"
                    >
                      <Settings2 size={13} /> Buka Pengaturan Loket
                    </button>
                  </div>
                )}
              </div>
              <div className="rounded-2xl border border-border bg-surface p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted">Antrean Menunggu</h3>
                  <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-black text-foreground">
                    {waitingTickets.length}
                  </span>
                </div>
                <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                  {waitingTickets.length ? waitingTickets.map((ticket) => (
                    <WaitingChip key={ticket.id} ticket={ticket} highlightVerified={highlightVerified} />
                  )) : (
                    <div className="rounded-xl border border-border bg-card px-3 py-6 text-center text-xs font-bold text-muted-foreground">
                      Tidak ada antrean menunggu.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

type ContainerSettingsDrawerProps = {
  open: boolean;
  draft: QueueContainerConfig[];
  busy: boolean;
  message: string;
  dirty: boolean;
  onClose: () => void;
  onChange: (index: number, patch: Partial<QueueContainerConfig>) => void;
  onAdd: (service?: string) => void;
  onRemove: (index: number) => void;
  onReset: () => void;
  onSave: () => void;
};

function ContainerSettingsDrawer({
  open,
  draft,
  busy,
  message,
  dirty,
  onClose,
  onChange,
  onAdd,
  onRemove,
  onReset,
  onSave,
}: ContainerSettingsDrawerProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 240, damping: 28 }}
            className="flex h-full w-full max-w-2xl flex-col bg-card shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-accent">Pengaturan</p>
                <h2 className="mt-0.5 text-xl font-black text-foreground">Konfigurasi Loket</h2>
              </div>
              <button type="button" onClick={onClose} className="rounded-xl bg-surface p-2 text-muted-foreground transition hover:bg-card-hover">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted">Jumlah Loket</p>
                  <p className="text-2xl font-black text-foreground">{draft.length} <span className="text-xs font-bold text-muted-foreground">/ {MAX_CONTAINERS}</span></p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {dirty ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800 ring-1 ring-amber-200">
                      <AlertTriangle size={10} /> Belum disimpan
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={onReset}
                    disabled={busy || !dirty}
                    title="Batalkan perubahan, kembali ke konfigurasi tersimpan"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-card px-3 py-2 text-xs font-black text-muted-foreground ring-1 ring-border transition hover:bg-card-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <RotateCcw size={13} /> Batal
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={onSave}
                    className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-black text-white shadow-md transition hover:bg-accent-hover disabled:cursor-wait disabled:opacity-60"
                  >
                    {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {busy ? 'Menyimpan' : 'Simpan'}
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 text-xs text-muted-foreground">
                <p className="mb-1 text-[11px] font-black uppercase tracking-widest text-accent">Alur Antrean</p>
                <ol className="list-decimal space-y-0.5 pl-4">
                  <li><span className="font-black text-foreground">Verifikasi Berkas</span> — loket pertama, memeriksa dokumen calon peserta. Setelah klik <span className="font-black">Selesai</span>, tiket otomatis masuk antrean Operator.</li>
                  <li><span className="font-black text-foreground">Operator</span> — memanggil user yang sudah selesai verifikasi.</li>
                  <li><span className="font-black text-foreground">Informasi</span> — loket independen untuk layanan informasi umum.</li>
                </ol>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-muted">Tambah Loket:</span>
                {SERVICE_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    disabled={draft.length >= MAX_CONTAINERS}
                    onClick={() => onAdd(preset.value)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-card px-3 py-1.5 text-[11px] font-black text-foreground ring-1 ring-border transition hover:bg-card-hover disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus size={12} /> {preset.label}
                  </button>
                ))}
                {draft.length >= MAX_CONTAINERS ? (
                  <span className="text-[11px] font-bold text-amber-700">Maksimum {MAX_CONTAINERS} loket.</span>
                ) : null}
              </div>

              <div className="space-y-3">
                {draft.map((container, index) => (
                  <div key={container.id} className="rounded-2xl border border-border bg-surface p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-[11px] font-black text-accent">{index + 1}</span>
                        <span className="text-[11px] font-black uppercase tracking-widest text-muted">{formatQueueService(container.service)}</span>
                      </div>
                      <button
                        type="button"
                        disabled={draft.length <= 1}
                        onClick={() => onRemove(index)}
                        className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1 text-[11px] font-black text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Hapus ${container.name}`}
                      >
                        <Trash2 size={12} /> Hapus
                      </button>
                    </div>
                    <div className="grid gap-2 lg:grid-cols-[1.2fr_1fr_0.7fr_1fr_0.7fr]">
                      <label className="min-w-0">
                        <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-muted">Nama</span>
                        <input
                          value={container.name}
                          onChange={(event) => onChange(index, { name: event.target.value })}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold text-foreground outline-none focus:border-accent/60"
                          placeholder="Verifikator 1"
                        />
                      </label>
                      <label className="min-w-0">
                        <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-muted">Layanan</span>
                        <select
                          value={
                            SERVICE_PRESETS.some((preset) => preset.value.toLowerCase() === container.service.trim().toLowerCase())
                              ? SERVICE_PRESETS.find((preset) => preset.value.toLowerCase() === container.service.trim().toLowerCase())!.value
                              : container.service
                          }
                          onChange={(event) => onChange(index, { service: event.target.value })}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold text-foreground outline-none focus:border-accent/60"
                        >
                          {SERVICE_PRESETS.map((preset) => (
                            <option key={preset.value} value={preset.value}>{preset.label}</option>
                          ))}
                          {SERVICE_PRESETS.every((preset) => preset.value.toLowerCase() !== container.service.trim().toLowerCase()) && container.service.trim() ? (
                            <option value={container.service}>{container.service} (custom)</option>
                          ) : null}
                        </select>
                      </label>
                      <label className="min-w-0">
                        <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-muted">Kode</span>
                        <input
                          value={container.code}
                          maxLength={8}
                          onChange={(event) => onChange(index, { code: event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '') })}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-black uppercase text-foreground outline-none focus:border-accent/60"
                          placeholder="SPMB"
                        />
                      </label>
                      <label className="min-w-0">
                        <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-muted">Petugas</span>
                        <input
                          value={container.operator}
                          onChange={(event) => onChange(index, { operator: event.target.value })}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold text-foreground outline-none focus:border-accent/60"
                        />
                      </label>
                      <label className="min-w-0">
                        <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-muted">Warna</span>
                        <select
                          value={container.accent}
                          onChange={(event) => onChange(index, { accent: event.target.value })}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-black text-foreground outline-none focus:border-accent/60"
                        >
                          {accentOptions.map((accent) => (
                            <option key={accent.value} value={accent.value}>{accent.label}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              {message ? (
                <div className="rounded-xl border border-border bg-surface px-4 py-3 text-xs font-bold text-foreground">
                  {message}
                </div>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

type CustomCallDialogProps = {
  open: boolean;
  container: QueueContainer | null;
  queueNumber: string;
  confirming: boolean;
  busy: boolean;
  error: string;
  previewTicket: QueueTicket | null;
  eligibleTickets: QueueTicket[];
  onChange: (value: string) => void;
  onCancel: () => void;
  onStartConfirm: () => void;
  onConfirm: () => void;
};

function CustomCallDialog({
  open,
  container,
  queueNumber,
  confirming,
  busy,
  error,
  previewTicket,
  eligibleTickets,
  onChange,
  onCancel,
  onStartConfirm,
  onConfirm,
}: CustomCallDialogProps) {
  const formattedInput = normalizeQueueLookup(queueNumber, container?.code ?? 'SPMB');

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 10 }}
            className="w-full max-w-lg overflow-hidden rounded-3xl bg-card shadow-2xl ring-1 ring-border"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-border bg-surface px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-accent">Custom Panggil</p>
                  <h3 className="mt-1 truncate text-xl font-black text-foreground">{container?.name ?? 'Loket'}</h3>
                  <p className="mt-0.5 truncate text-xs font-semibold text-muted-foreground">{formatQueueService(container?.service)} · {eligibleTickets.length} nomor aktif</p>
                </div>
                <button type="button" onClick={onCancel} disabled={busy} className="rounded-xl bg-card p-2 text-muted-foreground ring-1 ring-border transition hover:bg-card-hover disabled:opacity-40">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-4 px-5 py-5">
              <label className="block">
                <span className="mb-2 block text-[11px] font-black uppercase tracking-widest text-muted">Nomor Antrean</span>
                <div className="flex items-center gap-2 rounded-2xl border border-border bg-background px-3 py-2 focus-within:border-accent/70">
                  <Hash size={18} className="shrink-0 text-muted-foreground" />
                  <input
                    value={queueNumber}
                    onChange={(event) => onChange(event.target.value)}
                    disabled={busy || confirming}
                    autoFocus
                    placeholder={`${container?.code ?? 'SPMB'}-001 atau 001`}
                    className="min-w-0 flex-1 bg-transparent py-1 text-lg font-black uppercase text-foreground outline-none placeholder:text-muted-foreground/50"
                  />
                </div>
              </label>

              {formattedInput ? (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted">Preview Nomor</p>
                    <p className="mt-0.5 truncate text-2xl font-black text-foreground">{formatQueueNumber(formattedInput)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-black ring-1 ${
                    previewTicket
                      ? 'bg-emerald-100 text-emerald-800 ring-emerald-200'
                      : 'bg-amber-100 text-amber-800 ring-amber-200'
                  }`}>
                    {previewTicket ? 'Terdaftar' : 'Belum cocok'}
                  </span>
                </div>
              ) : null}

              {previewTicket ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Data Antrean</p>
                  <p className="mt-1 truncate text-sm font-black text-emerald-950">{previewTicket.visitorName}</p>
                  <p className="mt-0.5 truncate text-xs font-semibold text-emerald-800">
                    {previewTicket.phoneNumber || '-'} · {previewTicket.originSchool || '-'}
                  </p>
                </div>
              ) : null}

              {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                  {error}
                </div>
              ) : null}

              {confirming ? (
                <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-bold text-cyan-900">
                  Konfirmasi panggil {previewTicket ? formatQueueNumber(previewTicket.number) : formatQueueNumber(formattedInput)} ke {container?.name}. Panggilan akan langsung tampil realtime dan suara antrean diputar.
                </div>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-border bg-surface px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                className="rounded-xl bg-card px-4 py-2 text-sm font-black text-muted-foreground ring-1 ring-border transition hover:bg-card-hover hover:text-foreground disabled:opacity-40"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirming ? onConfirm : onStartConfirm}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-black text-white shadow-md transition hover:bg-accent-hover disabled:cursor-wait disabled:opacity-60"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : confirming ? <Megaphone size={14} /> : <CheckCircle2 size={14} />}
                {busy ? 'Memanggil...' : confirming ? 'Ya, Panggil Sekarang' : 'Lanjut Konfirmasi'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

type ResetConfirmDialogProps = {
  open: boolean;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

function ResetConfirmDialog({ open, busy, onCancel, onConfirm }: ResetConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 8 }}
            className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl ring-1 ring-border"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                <AlertTriangle size={22} />
              </span>
              <div>
                <h3 className="text-lg font-black text-foreground">Reset Semua Nomor Antrean?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Semua tiket hari ini, histori panggilan, dan counter nomor akan dihapus. Loket dan petugas tetap sama, tapi nomor antrean akan mulai dari <span className="font-black">001</span> lagi.
                </p>
                <p className="mt-2 text-xs font-bold text-rose-700">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                className="rounded-xl bg-surface px-4 py-2 text-sm font-black text-muted-foreground ring-1 ring-border transition hover:bg-card-hover hover:text-foreground disabled:opacity-40"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-black text-white shadow-md transition hover:bg-rose-700 disabled:cursor-wait disabled:opacity-60"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {busy ? 'Mereset...' : 'Ya, Reset Semua'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default function QueueDashboardPage() {
  const { snapshot, connected, connect, refresh, setSnapshot } = useQueueStore();
  const [busy, setBusy] = useState(false);
  const [volume, setVolume] = useState(0.9);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [voiceStyle, setVoiceStyle] = useState<QueueVoiceStyle>('bank');
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedContainerId, setSelectedContainerId] = useState('');
  const [containerDraft, setContainerDraft] = useState<QueueContainerConfig[]>([]);
  const [actionFeedback, setActionFeedback] = useState<{ text: string; tone: 'ok' | 'warn' } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showLiveQueue, setShowLiveQueue] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [customCallTarget, setCustomCallTarget] = useState<QueueContainer | null>(null);
  const [customQueueNumber, setCustomQueueNumber] = useState('');
  const [customConfirming, setCustomConfirming] = useState(false);
  const [customBusy, setCustomBusy] = useState(false);
  const [customError, setCustomError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    refresh().catch(() => {});
    return connect();
  }, [connect, refresh]);

  useEffect(() => {
    const raw = localStorage.getItem('smavo_user');
    if (!raw) return;

    try {
      setIsAdmin(JSON.parse(raw).role === 'ADMIN');
    } catch {
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    const savedStyle = localStorage.getItem('smavo_queue_voice_style') as QueueVoiceStyle | null;
    if (savedStyle && voiceStyleOptions.some((option) => option.value === savedStyle)) {
      setVoiceStyle(savedStyle);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('smavo_queue_voice_style', voiceStyle);
    localStorage.removeItem('smavo_queue_voice_uri');
  }, [voiceStyle]);

  useEffect(() => {
    if (settingsDirty) return;
    setContainerDraft(snapshot.containers.map(toContainerConfig));
  }, [settingsDirty, snapshot.containers]);

  useEffect(() => {
    if (!snapshot.containers.length) return;
    if (!snapshot.containers.some((container) => container.id === selectedContainerId)) {
      setSelectedContainerId(snapshot.containers[0].id);
    }
  }, [selectedContainerId, snapshot.containers]);

  useEffect(() => () => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
  }, []);

  const latestCalled = useMemo(
    () => snapshot.containers
      .filter((container) => container.activeTicket?.calledAt)
      .sort((a, b) => new Date(b.activeTicket!.calledAt!).getTime() - new Date(a.activeTicket!.calledAt!).getTime())[0]
      ?.activeTicket ?? null,
    [snapshot.containers]
  );

  const selectedContainer = useMemo(
    () => snapshot.containers.find((container) => container.id === selectedContainerId) ?? snapshot.containers[0] ?? null,
    [selectedContainerId, snapshot.containers]
  );

  const verifContainers = useMemo(
    () => snapshot.containers.filter((container) => isVerificationService(container.service)),
    [snapshot.containers]
  );

  const operatorContainers = useMemo(
    () => snapshot.containers.filter((container) => isOperatorService(container.service)),
    [snapshot.containers]
  );

  const informationContainers = useMemo(
    () => snapshot.containers.filter((container) => isInformationService(container.service)),
    [snapshot.containers]
  );

  const verifWaiting = useMemo(
    () => snapshot.tickets
      .filter((ticket) => ticket.status === 'WAITING' && isVerificationService(ticket.service))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(0, 20),
    [snapshot.tickets]
  );

  const operatorWaiting = useMemo(
    () => snapshot.tickets
      .filter((ticket) => ticket.status === 'WAITING' && isOperatorService(ticket.service))
      .sort((a, b) => new Date(a.verifiedAt ?? a.createdAt).getTime() - new Date(b.verifiedAt ?? b.createdAt).getTime())
      .slice(0, 20),
    [snapshot.tickets]
  );

  const informationWaiting = useMemo(
    () => snapshot.tickets
      .filter((ticket) => ticket.status === 'WAITING' && isInformationService(ticket.service))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(0, 20),
    [snapshot.tickets]
  );

  const customEligibleTickets = useMemo(() => {
    if (!customCallTarget) return [];
    const targetService = formatQueueService(customCallTarget.service).trim().toLowerCase();
    const isAccountOperator = customCallTarget.id === 'operator-5'
      || customCallTarget.name.trim().toLowerCase() === 'operator 5'
      || (isOperatorService(customCallTarget.service) && customCallTarget.name.trim().endsWith('5'));

    return snapshot.tickets
      .filter((ticket) => {
        if (ticket.status !== 'WAITING') return false;
        if (formatQueueService(ticket.service).trim().toLowerCase() !== targetService) return false;
        if (!isOperatorService(customCallTarget.service)) return true;
        return isAccountOperator
          ? isAccountCreationServiceChoice(ticket.serviceChoice)
          : !isAccountCreationServiceChoice(ticket.serviceChoice);
      })
      .sort((a, b) => new Date(a.verifiedAt ?? a.createdAt).getTime() - new Date(b.verifiedAt ?? b.createdAt).getTime());
  }, [customCallTarget, snapshot.tickets]);

  const customPreviewTicket = useMemo(() => {
    if (!customCallTarget) return null;
    const normalized = normalizeQueueLookup(customQueueNumber, customCallTarget.code);
    if (!normalized) return null;
    return customEligibleTickets.find((ticket) => normalizeQueueLookup(ticket.number, customCallTarget.code) === normalized) ?? null;
  }, [customCallTarget, customEligibleTickets, customQueueNumber]);

  const recentCallHistory = useMemo(
    () => snapshot.tickets
      .flatMap((ticket) => {
        const logs = ticket.callLogs?.length
          ? ticket.callLogs
          : ticket.calledAt
            ? [{
              id: `${ticket.id}-called`,
              type: ticket.callType ?? 'NORMAL',
              containerId: ticket.containerId,
              containerName: ticket.containerId,
              calledAt: ticket.calledAt,
              calledBy: ticket.calledBy,
            } satisfies QueueCallLog]
            : [];
        return logs.map((log) => ({ ticket, log }));
      })
      .sort((a, b) => new Date(b.log.calledAt).getTime() - new Date(a.log.calledAt).getTime())
      .slice(0, 14),
    [snapshot.tickets]
  );

  const audioOptions = useMemo<QueueVoiceOptions>(() => ({
    volume,
    style: voiceStyle,
  }), [voiceStyle, volume]);

  const showFeedback = (text: string, tone: 'ok' | 'warn' = 'ok') => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setActionFeedback({ text, tone });
    feedbackTimer.current = setTimeout(() => setActionFeedback(null), 2400);
  };

  const runAction = async (containerId: string, action: ContainerAction) => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await queueAction(containerId, action);
      const container = result.snapshot.containers.find((item) => item.id === containerId);
      if (container?.activeTicket && ['call', 'next', 'recall'].includes(action)) {
        speakQueueCall(container.activeTicket, container, audioOptions);
      }
      const labels: Record<ContainerAction, string> = {
        call: 'Nomor berikutnya dipanggil',
        next: 'Nomor berikutnya dipanggil',
        recall: 'Nomor aktif dipanggil ulang',
        done: 'Layanan diselesaikan',
        skip: 'Nomor dilewati',
      };
      showFeedback(labels[action]);
      await refresh();
    } catch (error: any) {
      showFeedback(error?.response?.data?.message || 'Aksi gagal dijalankan', 'warn');
    } finally {
      setBusy(false);
    }
  };

  const openCustomCall = (container: QueueContainer) => {
    setSelectedContainerId(container.id);
    setCustomCallTarget(container);
    setCustomQueueNumber('');
    setCustomConfirming(false);
    setCustomBusy(false);
    setCustomError('');
  };

  const closeCustomCall = () => {
    if (customBusy) return;
    setCustomCallTarget(null);
    setCustomQueueNumber('');
    setCustomConfirming(false);
    setCustomError('');
  };

  const changeCustomQueueNumber = (value: string) => {
    setCustomQueueNumber(value.toUpperCase());
    setCustomConfirming(false);
    setCustomError('');
  };

  const startCustomConfirm = () => {
    if (!customCallTarget) return;
    if (!customQueueNumber.trim()) {
      setCustomError('Masukkan nomor antrean yang akan dipanggil.');
      return;
    }
    if (!customPreviewTicket) {
      const normalized = normalizeQueueLookup(customQueueNumber, customCallTarget.code);
      setCustomError(`Nomor antrean ${formatQueueNumber(normalized)} tidak ditemukan dalam daftar aktif ${customCallTarget.name}.`);
      return;
    }
    setCustomConfirming(true);
    setCustomError('');
  };

  const runCustomCall = async () => {
    if (!customCallTarget || customBusy) return;
    setCustomBusy(true);
    setBusy(true);
    try {
      const result = await customQueueCall(customCallTarget.id, customQueueNumber);
      const container = result.snapshot.containers.find((item) => item.id === customCallTarget.id);
      if (container?.activeTicket) {
        speakQueueCall(container.activeTicket, container, audioOptions);
      }
      setSnapshot(result.snapshot);
      showFeedback('Nomor custom berhasil dipanggil');
      setCustomCallTarget(null);
      setCustomQueueNumber('');
      setCustomConfirming(false);
      await refresh();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Nomor antrean custom gagal dipanggil';
      setCustomError(message);
      setCustomConfirming(false);
      showFeedback(message, 'warn');
    } finally {
      setCustomBusy(false);
      setBusy(false);
    }
  };

  const runPause = async (containerId: string, paused: boolean) => {
    if (busy) return;
    setBusy(true);
    try {
      await pauseContainer(containerId, paused);
      showFeedback(paused ? 'Loket di-pause' : 'Loket diaktifkan');
      await refresh();
    } catch (error: any) {
      showFeedback(error?.response?.data?.message || 'Aksi gagal dijalankan', 'warn');
    } finally {
      setBusy(false);
    }
  };

  const toggleQueueOpen = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await updateQueueOpen(!snapshot.isOpen);
      setSnapshot(result.snapshot);
      showFeedback(result.snapshot.isOpen ? 'Antrean dibuka' : 'Antrean ditutup');
    } catch (error: any) {
      showFeedback(error?.response?.data?.message || 'Gagal mengubah status antrean', 'warn');
    } finally {
      setBusy(false);
    }
  };

  const toggleOfflineMode = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await setOfflineMode(!snapshot.isOfflineMode);
      setSnapshot(result.snapshot);
      showFeedback(
        result.snapshot.isOfflineMode
          ? 'Mode Offline aktif: tiket baru ditahan dari dashboard'
          : 'Mode Online aktif: tiket baru ditampilkan kembali',
      );
    } catch (error: any) {
      showFeedback(error?.response?.data?.message || 'Gagal mengubah mode', 'warn');
    } finally {
      setBusy(false);
    }
  };

  const enableAudio = () => {
    const enabled = unlockQueueAudio(audioOptions);
    setAudioEnabled(enabled);
    showFeedback(enabled ? 'Suara panggilan aktif' : 'Browser belum mendukung suara', enabled ? 'ok' : 'warn');
  };

  const changeContainerDraft = (index: number, patch: Partial<QueueContainerConfig>) => {
    setSettingsDirty(true);
    setContainerDraft((current) => current.map((container, itemIndex) => (
      itemIndex === index ? { ...container, ...patch } : container
    )));
  };

  const addContainerDraft = (service: string = 'Verifikasi Berkas') => {
    setSettingsDirty(true);
    setContainerDraft((current) => {
      if (current.length >= MAX_CONTAINERS) return current;
      return [...current, makeNewContainer(current.length, service)];
    });
  };

  const removeContainerDraft = (index: number) => {
    setSettingsDirty(true);
    setContainerDraft((current) => current.length <= 1 ? current : current.filter((_, itemIndex) => itemIndex !== index));
  };

  const resetContainerDraft = () => {
    setContainerDraft(snapshot.containers.map(toContainerConfig));
    setSettingsDirty(false);
    setSettingsMessage('');
  };

  const saveContainers = async () => {
    setSettingsBusy(true);
    setSettingsMessage('Menyimpan konfigurasi loket...');
    try {
      const result = await updateQueueContainers(containerDraft.map((container, index) => ({
        ...container,
        name: container.name.trim() || `Verifikator ${index + 1}`,
        service: container.service.trim() || 'Verifikasi Berkas',
        code: container.code.trim() || 'SPMB',
        operator: container.operator.trim() || `Verifikator ${index + 1}`,
      })));
      setSnapshot(result.snapshot);
      setContainerDraft(result.snapshot.containers.map(toContainerConfig));
      setSettingsDirty(false);
      setSettingsMessage('Konfigurasi loket berhasil disimpan.');
      showFeedback('Konfigurasi loket tersimpan');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Konfigurasi loket gagal disimpan.';
      setSettingsMessage(message);
      showFeedback(message, 'warn');
    } finally {
      setSettingsBusy(false);
    }
  };

  const handleResetConfirm = async () => {
    setResetBusy(true);
    try {
      const result = await resetQueueState();
      setSnapshot(result.snapshot);
      showFeedback('Semua nomor antrean direset');
      setResetOpen(false);
    } catch (error: any) {
      showFeedback(error?.response?.data?.message || 'Gagal mereset antrean', 'warn');
    } finally {
      setResetBusy(false);
    }
  };

  return (
    <div className="space-y-4 lg:space-y-5">
      {snapshot.isOfflineMode ? (
        <div className="flex items-center gap-3 rounded-xl border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-amber-900 shadow-sm">
          <WifiOff size={18} className="shrink-0 text-amber-600" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black uppercase tracking-wider">Mode Offline Aktif</p>
            <p className="mt-0.5 text-xs font-semibold">
              Tiket baru ditahan dari dashboard sampai mode dikembalikan ke Online. Aksi panggil/lewati/custom/selesai tetap berfungsi normal.
            </p>
          </div>
          {isAdmin ? (
            <button
              type="button"
              onClick={toggleOfflineMode}
              disabled={busy}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-black text-white shadow-sm transition hover:bg-amber-600 disabled:opacity-70"
            >
              {busy ? <Loader2 size={12} className="animate-spin" /> : <Wifi size={12} />}
              Aktifkan Online
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-accent">
            <RadioTower size={12} className={connected ? '' : 'animate-pulse'} />
            {connected ? 'Realtime Connected' : 'Connecting'}
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-foreground lg:text-3xl">Command Center Antrean</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Verifikator memeriksa berkas → klik <span className="font-black">Selesai</span>, lalu tiket otomatis menunggu dipanggil oleh Operator. Loket Informasi berdiri sendiri.
          </p>
          <p className={`mt-1 text-sm font-black ${snapshot.isOpen ? 'text-emerald-600' : 'text-rose-600'}`}>
            {snapshot.isOpen ? 'Antrean publik sedang dibuka.' : 'Antrean publik sedang ditutup.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin ? (
            <button
              type="button"
              onClick={toggleQueueOpen}
              disabled={busy}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black shadow-sm transition hover:scale-[1.02] disabled:cursor-wait disabled:opacity-70 ${
                snapshot.isOpen
                  ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100'
                  : 'bg-emerald-500 text-white shadow-emerald-500/30 hover:bg-emerald-600'
              }`}
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : snapshot.isOpen ? <Pause size={14} /> : <Play size={14} />}
              {snapshot.isOpen ? 'Tutup Antrean' : 'Buka Antrean'}
            </button>
          ) : null}
          {isAdmin ? (
            <button
              type="button"
              onClick={toggleOfflineMode}
              disabled={busy}
              title={snapshot.isOfflineMode ? 'Kembali ke Mode Online (tampilkan tiket baru)' : 'Aktifkan Mode Offline (tahan tiket baru dari dashboard)'}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black shadow-sm transition hover:scale-[1.02] disabled:cursor-wait disabled:opacity-70 ${
                snapshot.isOfflineMode
                  ? 'bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600'
                  : 'bg-emerald-500 text-white shadow-emerald-500/30 hover:bg-emerald-600'
              }`}
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : snapshot.isOfflineMode ? <WifiOff size={14} /> : <Wifi size={14} />}
              {snapshot.isOfflineMode ? 'Mode Offline' : 'Mode Online'}
            </button>
          ) : null}
          <button
            type="button"
            onClick={enableAudio}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black shadow-sm transition hover:scale-[1.02] ${
              audioEnabled ? 'bg-emerald-500 text-white shadow-emerald-500/30' : 'bg-card text-foreground ring-1 ring-border hover:bg-card-hover'
            }`}
          >
            <Volume2 size={14} />
            {audioEnabled ? 'Suara Aktif' : 'Aktifkan Suara'}
          </button>
          <label className="inline-flex items-center gap-2 rounded-xl bg-card px-3 py-2 text-xs font-bold text-muted-foreground ring-1 ring-border">
            <Volume2 size={13} />
            <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(event) => setVolume(Number(event.target.value))} className="w-20 accent-cyan-500" />
          </label>
          <select
            value={voiceStyle}
            onChange={(event) => setVoiceStyle(event.target.value as QueueVoiceStyle)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-black text-foreground outline-none focus:border-accent/60"
          >
            {voiceStyleOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <a
            href="/queue-display"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-xl bg-foreground px-3 py-2 text-xs font-black text-background shadow-sm transition hover:opacity-90"
          >
            <MonitorUp size={14} /> Display TV
          </a>
          <button
            type="button"
            onClick={() => exportTicketsForExcel(snapshot.tickets)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-emerald-600"
          >
            <FileSpreadsheet size={14} /> Export
          </button>
          <button
            type="button"
            onClick={() => setResetOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-100"
          >
            <Trash2 size={14} /> Reset Semua
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-card px-3 py-2 text-xs font-black text-foreground ring-1 ring-border transition hover:bg-card-hover"
          >
            <Settings2 size={14} /> Loket
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Hari Ini" value={snapshot.analytics.totalToday} icon={UsersRound} hint="Tiket yang dibuat hari ini" tone="cyan" />
        <StatCard
          label="Sedang Dipanggil"
          value={latestCalled ? formatQueueNumber(latestCalled.number) : '—'}
          icon={Megaphone}
          hint={latestCalled ? formatQueueService(latestCalled.service) : 'Belum ada panggilan'}
          tone="violet"
        />
        <StatCard label="Selesai" value={snapshot.analytics.done} icon={CheckCircle2} hint="Layanan berhasil" tone="emerald" />
        <StatCard
          label="Rata-rata Tunggu"
          value={`${snapshot.analytics.averageWaitMinutes}m`}
          icon={Clock3}
          hint={`Peak: ${snapshot.analytics.peakHour} · ${snapshot.analytics.activeContainers} loket aktif`}
          tone="amber"
        />
      </div>

      <ActiveCallHero
        container={selectedContainer}
        busy={busy}
        onAction={runAction}
        onCustomCall={openCustomCall}
        onSpeak={(item) => item.activeTicket && speakQueueCall(item.activeTicket, item, audioOptions)}
      />

      <RoleSection
        title="Verifikator"
        description="Loket pemeriksaan berkas. Klik Selesai untuk meneruskan ke Operator."
        icon={ShieldCheck}
        tone="cyan"
        containers={verifContainers}
        waitingTickets={verifWaiting}
        selectedContainerId={selectedContainer?.id ?? ''}
        busy={busy}
        emptyMessage="Tambahkan loket Verifikator dari pengaturan loket."
        onSelect={setSelectedContainerId}
        onAction={runAction}
        onCustomCall={openCustomCall}
        onPause={runPause}
        onSpeak={(item) => item.activeTicket && speakQueueCall(item.activeTicket, item, audioOptions)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <RoleSection
        title="Operator"
        description="Memanggil user yang sudah selesai verifikasi berkas."
        icon={UsersRound}
        tone="emerald"
        containers={operatorContainers}
        waitingTickets={operatorWaiting}
        selectedContainerId={selectedContainer?.id ?? ''}
        busy={busy}
        highlightVerified
        emptyMessage="Buat loket Operator agar user yang sudah diverifikasi bisa dipanggil."
        onSelect={setSelectedContainerId}
        onAction={runAction}
        onCustomCall={openCustomCall}
        onPause={runPause}
        onSpeak={(item) => item.activeTicket && speakQueueCall(item.activeTicket, item, audioOptions)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <RoleSection
        title="Informasi"
        description="Loket layanan informasi umum, independen dari alur verifikasi."
        icon={Info}
        tone="violet"
        containers={informationContainers}
        waitingTickets={informationWaiting}
        selectedContainerId={selectedContainer?.id ?? ''}
        busy={busy}
        emptyMessage="Tambahkan loket Informasi dari pengaturan loket."
        onSelect={setSelectedContainerId}
        onAction={runAction}
        onCustomCall={openCustomCall}
        onPause={runPause}
        onSpeak={(item) => item.activeTicket && speakQueueCall(item.activeTicket, item, audioOptions)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <button
            type="button"
            onClick={() => setShowHistory((current) => !current)}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <div className="flex items-center gap-2">
              <ListChecks size={16} className="text-muted-foreground" />
              <div>
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted">Histori Panggilan</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">14 panggilan terakhir hari ini.</p>
              </div>
            </div>
            <ChevronDown size={16} className={`text-muted transition-transform ${showHistory ? 'rotate-180' : ''}`} />
          </button>
          {showHistory ? (
            <div className="mt-3 max-h-[340px] space-y-2 overflow-y-auto pr-1">
              {recentCallHistory.length ? recentCallHistory.map(({ ticket, log }) => {
                const containerInfo = snapshot.containers.find((container) => container.id === log.containerId);
                const statusTone = log.type === 'CUSTOM'
                  ? 'bg-cyan-500/15 text-cyan-700'
                  : log.type === 'RECALL'
                    ? 'bg-amber-500/15 text-amber-700'
                    : 'bg-emerald-500/15 text-emerald-700';
                return (
                  <div key={log.id} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-foreground">{formatQueueNumber(ticket.number)}</p>
                      <p className="truncate text-[11px] font-semibold text-muted-foreground">
                        {ticket.visitorName} · {ticket.phoneNumber || '-'} · {containerInfo?.name ?? ticket.containerId}
                      </p>
                      {log.type === 'CUSTOM' ? (
                        <p className="truncate text-[10px] font-bold uppercase tracking-widest text-cyan-700">
                          Custom oleh {log.calledBy || '-'} - {formatTicketDateTime(log.calledAt)}
                        </p>
                      ) : null}
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${statusTone}`}>
                      {log.type}
                    </span>
                  </div>
                );
              }) : (
                <div className="rounded-xl border border-border bg-surface px-3 py-6 text-center text-xs font-bold text-muted-foreground">
                  Belum ada histori panggilan.
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <button
            type="button"
            onClick={() => setShowLiveQueue((current) => !current)}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <div className="flex items-center gap-2">
              <RadioTower size={16} className="text-muted-foreground" />
              <div>
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted">Live Queue</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">12 tiket terbaru masuk hari ini.</p>
              </div>
            </div>
            <ChevronDown size={16} className={`text-muted transition-transform ${showLiveQueue ? 'rotate-180' : ''}`} />
          </button>
          {showLiveQueue ? (
            <div className="mt-3 max-h-[340px] space-y-2 overflow-y-auto pr-1">
              {snapshot.tickets.slice(0, 12).map((ticket) => {
                const stage = isOperatorService(ticket.service)
                  ? 'Operator'
                  : isVerificationService(ticket.service)
                    ? 'Verifikasi'
                    : formatQueueService(ticket.service);
                return (
                  <div key={ticket.id} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-foreground">{formatQueueNumber(ticket.number)}</p>
                      <p className="truncate text-[11px] font-semibold text-muted-foreground">
                        {ticket.visitorName} · {ticket.phoneNumber || '-'} · {stage}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-card-hover px-2 py-0.5 text-[10px] font-black text-muted-foreground">
                      {ticket.status}
                    </span>
                  </div>
                );
              })}
              {!snapshot.tickets.length ? (
                <div className="rounded-xl border border-border bg-surface px-3 py-6 text-center text-xs font-bold text-muted-foreground">
                  Belum ada tiket hari ini.
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <ContainerSettingsDrawer
        open={settingsOpen}
        draft={containerDraft}
        busy={settingsBusy}
        message={settingsMessage}
        dirty={settingsDirty}
        onClose={() => setSettingsOpen(false)}
        onChange={changeContainerDraft}
        onAdd={addContainerDraft}
        onRemove={removeContainerDraft}
        onReset={resetContainerDraft}
        onSave={saveContainers}
      />

      <CustomCallDialog
        open={Boolean(customCallTarget)}
        container={customCallTarget}
        queueNumber={customQueueNumber}
        confirming={customConfirming}
        busy={customBusy}
        error={customError}
        previewTicket={customPreviewTicket}
        eligibleTickets={customEligibleTickets}
        onChange={changeCustomQueueNumber}
        onCancel={closeCustomCall}
        onStartConfirm={startCustomConfirm}
        onConfirm={runCustomCall}
      />

      <ResetConfirmDialog
        open={resetOpen}
        busy={resetBusy}
        onCancel={() => !resetBusy && setResetOpen(false)}
        onConfirm={handleResetConfirm}
      />

      <AnimatePresence>
        {actionFeedback ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className={`pointer-events-none fixed bottom-24 right-6 z-40 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black shadow-2xl lg:bottom-6 ${
              actionFeedback.tone === 'ok'
                ? 'bg-emerald-500 text-white'
                : 'bg-rose-500 text-white'
            }`}
          >
            {actionFeedback.tone === 'ok' ? <CheckCircle2 size={16} /> : <ChevronRight size={16} />}
            {actionFeedback.text}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
