'use client';

import { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import {
  BadgeCheck,
  CheckCircle2,
  Download,
  Loader2,
  ShieldCheck,
  Sparkles,
  Ticket,
  UserRound,
  X,
} from 'lucide-react';
import { createQueueTicket as createRemoteQueueTicket, type QueueTicket as RemoteQueueTicket } from '@/lib/queue';

type QueueTicketImage = {
  id: string;
  number: string;
  visitor: string;
  originSchool: string;
  registrationPath: string;
  serviceChoice: string;
  service: string;
  status: string;
  estimate: string;
  createdAt: Date;
  qrPayload: string;
};

type DownloadStatus = 'pending' | 'downloaded' | 'failed';

type QueueTicketForm = {
  visitorName: string;
  originSchool: string;
  registrationPath: string;
  serviceChoice: string;
};

const SERVICE_CONFIG: Record<string, { name: string; prefix: string; accent: string; wait: number; flow: string }> = {
  'Verifikasi Berkas': {
    name: 'Verifikasi Berkas SMAN 2 Cibinong',
    prefix: 'SPMB',
    accent: 'from-indigo-600 to-cyan-600',
    wait: 6,
    flow: 'Menunggu dipanggil, menuju verifikator, lalu data diteruskan ke operator.',
  },
  'Informasi': {
    name: 'Informasi SMAN 2 Cibinong',
    prefix: 'SPMB',
    accent: 'from-amber-500 to-cyan-600',
    wait: 4,
    flow: 'Menunggu dipanggil, menuju layanan informasi, lalu selesai.',
  },
};

const registrationPathOptions = [
  'Potensi Akademik',
  'Prestasi Rapor',
  'Kejuaraan Akademik',
  'Kejuaraan Non Akademik',
  'Kepemimpinan',
];

const serviceChoiceOptions = [
  'Verifikasi Berkas',
  'Informasi',
];

const DOWNLOADED_NUMBERS_KEY = 'smavo_downloaded_queue_numbers';

const formatTime = (date: Date) =>
  new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);

function getDownloadedNumbers() {
  if (typeof window === 'undefined') return new Set<string>();

  try {
    const parsed = JSON.parse(localStorage.getItem(DOWNLOADED_NUMBERS_KEY) ?? '[]') as string[];
    return new Set(parsed);
  } catch {
    return new Set<string>();
  }
}

function saveDownloadedNumber(number: string) {
  const numbers = getDownloadedNumbers();
  numbers.add(number);
  localStorage.setItem(DOWNLOADED_NUMBERS_KEY, JSON.stringify([...numbers].slice(-300)));
}

function formatQueueLabel(value?: string | null) {
  return (value ?? 'SPMB').replace(/^PPDB$/i, 'SPMB');
}

function getServiceConfig(serviceChoice: string) {
  if (/informasi/i.test(serviceChoice)) return SERVICE_CONFIG.Informasi;
  return SERVICE_CONFIG[serviceChoice] ?? SERVICE_CONFIG['Verifikasi Berkas'];
}

function makeLocalTicket(form: QueueTicketForm): QueueTicketImage {
  const serviceConfig = getServiceConfig(form.serviceChoice);
  const storageKey = `smavo_queue_${serviceConfig.prefix}`;
  const current = Number(localStorage.getItem(storageKey) ?? '0') + 1;
  localStorage.setItem(storageKey, String(current));

  const now = new Date();
  const number = `${serviceConfig.prefix}-${String(current).padStart(3, '0')}`;
  const id = `SMAVO-${serviceConfig.prefix}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(current).padStart(4, '0')}`;

  return {
    id,
    number,
    visitor: form.visitorName,
    originSchool: form.originSchool,
    registrationPath: form.registrationPath,
    serviceChoice: form.serviceChoice,
    service: serviceConfig.name,
    status: 'Menunggu',
    estimate: `${Math.max(serviceConfig.wait, current * serviceConfig.wait)} menit`,
    createdAt: now,
    qrPayload: JSON.stringify({
      system: 'SMAVO Queue',
      school: 'SMAN 2 Cibinong',
      id,
      number,
      visitor: form.visitorName,
      originSchool: form.originSchool,
      registrationPath: form.registrationPath,
      serviceChoice: form.serviceChoice,
      service: serviceConfig.name,
      createdAt: now.toISOString(),
    }),
  };
}

function mapRemoteTicket(ticket: RemoteQueueTicket): QueueTicketImage {
  return {
    id: ticket.id,
    number: ticket.number,
    visitor: ticket.visitorName,
    originSchool: ticket.originSchool ?? '-',
    registrationPath: ticket.registrationPath ?? '-',
    serviceChoice: ticket.serviceChoice ?? formatQueueLabel(ticket.service),
    service: `${ticket.service} SMAN 2 Cibinong`,
    status: ticket.status === 'WAITING' ? 'Menunggu' : ticket.status,
    estimate: `${ticket.estimatedWaitMinutes} menit`,
    createdAt: new Date(ticket.createdAt),
    qrPayload: JSON.stringify({
      system: 'SMAVO Queue',
      school: 'SMAN 2 Cibinong',
      id: ticket.id,
      number: ticket.number,
      visitor: ticket.visitorName,
      originSchool: ticket.originSchool,
      registrationPath: ticket.registrationPath,
      serviceChoice: ticket.serviceChoice,
      service: ticket.service,
      createdAt: ticket.createdAt,
    }),
  };
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function displayQueueNumber(number: string) {
  return formatQueueLabel(number);
}

function PremiumImageTicket({ ticket }: { ticket: QueueTicketImage }) {
  const displayNumber = displayQueueNumber(ticket.number);
  const serviceConfig = getServiceConfig(ticket.serviceChoice);

  return (
    <div className="relative w-[430px] overflow-hidden rounded-[28px] bg-slate-950 text-white shadow-2xl shadow-indigo-950/20">
      <div className={`absolute inset-0 bg-gradient-to-br ${serviceConfig.accent} opacity-90`} />
      <div className="absolute inset-x-0 top-0 h-36 bg-white/15 blur-3xl" />
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative p-7">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <img src="/logo-smavo.jpeg" alt="Logo SMAN 2 Cibinong" className="h-14 w-14 shrink-0 rounded-2xl border border-white/30 object-cover shadow-lg" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">SMAN 2 Cibinong</p>
              <h3 className="text-2xl font-extrabold leading-tight">Nomor Antrean</h3>
            </div>
          </div>
          <div className="shrink-0 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[11px] font-bold backdrop-blur">
            {ticket.status}
          </div>
        </div>

        <div className="mt-8 rounded-[24px] border border-white/20 bg-white/16 p-6 text-center backdrop-blur-md">
          <p className="break-words text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">{ticket.service}</p>
          <div className="mt-5">
            <p className="text-[6.8rem] font-black leading-[0.85] tracking-normal">{displayNumber.split('-')[1]}</p>
            <p className="mt-5 break-words rounded-2xl bg-white/15 px-4 py-2 text-lg font-black text-white">{displayNumber}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl border border-white/15 bg-white/12 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Calon Peserta</p>
            <p className="mt-2 break-words text-base font-bold leading-snug">{ticket.visitor}</p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/12 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Asal Sekolah</p>
            <p className="mt-2 break-words text-base font-bold leading-snug">{ticket.originSchool}</p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/12 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Jalur</p>
            <p className="mt-2 break-words text-base font-bold leading-snug">{ticket.registrationPath}</p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/12 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Layanan</p>
            <p className="mt-2 break-words text-base font-bold leading-snug">{ticket.serviceChoice}</p>
          </div>
          <div className="col-span-2 rounded-2xl border border-white/15 bg-white/12 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Waktu Pengambilan</p>
            <p className="mt-2 break-words text-base font-semibold leading-snug">{formatTime(ticket.createdAt)} - estimasi {ticket.estimate}</p>
          </div>
        </div>

        <p className="mt-5 rounded-2xl bg-white/12 px-4 py-3 text-center text-[12px] font-semibold leading-relaxed text-white/78">
          {serviceConfig.flow}
        </p>
      </div>
    </div>
  );
}

function QueueTicketResultModal({
  ticket,
  downloadStatus,
  onClose,
}: {
  ticket: QueueTicketImage;
  downloadStatus: DownloadStatus;
  onClose: () => void;
}) {
  const displayNumber = displayQueueNumber(ticket.number);
  const queueNumber = displayNumber.split('-')[1] ?? displayNumber;
  const serviceConfig = getServiceConfig(ticket.serviceChoice);
  const isDownloaded = downloadStatus === 'downloaded';
  const isFailed = downloadStatus === 'failed';
  const isPending = downloadStatus === 'pending';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        aria-label="Tutup pop up nomor antrean"
        onClick={onClose}
      />

      <div className="relative w-full max-w-[420px] overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-slate-950/25">
        <div className={`absolute inset-x-0 top-0 h-36 bg-gradient-to-br ${serviceConfig.accent} opacity-95`} />
        <div className="absolute right-[-72px] top-[-72px] h-48 w-48 rounded-full bg-white/20" />
        <div className="absolute left-[-48px] top-24 h-32 w-32 rounded-full bg-cyan-200/30 blur-2xl" />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/30"
          aria-label="Tutup"
        >
          <X size={18} />
        </button>

        <div className="relative z-10 p-5 sm:p-6">
          <div className="flex min-w-0 items-center gap-3 pr-10 text-white">
            <img src="/logo-smavo.jpeg" alt="SMAVO" className="h-12 w-12 shrink-0 rounded-2xl border border-white/40 object-cover shadow-lg" />
            <div className="min-w-0">
              <p className="truncate text-[11px] font-bold uppercase tracking-[0.2em] text-white/75">Antrean SMAVO</p>
              <h3 className="text-base font-black leading-tight sm:text-lg">Nomor Antrean Berhasil Dibuat</h3>
            </div>
          </div>

          <div className="mt-7 rounded-[24px] border border-slate-100 bg-white p-5 text-center shadow-xl shadow-slate-900/10">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Nomor Antrean</p>
            <p className="mt-2 break-words text-[4.4rem] font-black leading-none tracking-normal text-slate-950 sm:text-[5rem]">
              {queueNumber}
            </p>
            <p className="mt-2 break-words text-sm font-black text-indigo-600">{displayNumber}</p>

            <div className="mt-5 grid grid-cols-1 gap-3 text-left sm:grid-cols-2">
              <div className="min-w-0 rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Nama</p>
                <p className="mt-1 break-words text-sm font-bold text-slate-800">{ticket.visitor}</p>
              </div>
              <div className="min-w-0 rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Asal Sekolah</p>
                <p className="mt-1 break-words text-sm font-bold text-slate-800">{ticket.originSchool}</p>
              </div>
              <div className="min-w-0 rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Jalur</p>
                <p className="mt-1 break-words text-sm font-bold text-slate-800">{ticket.registrationPath}</p>
              </div>
              <div className="min-w-0 rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Layanan</p>
                <p className="mt-1 break-words text-sm font-bold text-slate-800">{ticket.serviceChoice}</p>
              </div>
              <div className="min-w-0 rounded-2xl bg-slate-50 p-4 sm:col-span-2">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Estimasi dan Alur</p>
                <p className="mt-1 break-words text-sm font-bold text-slate-800">{ticket.estimate}</p>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500">{serviceConfig.flow}</p>
              </div>
            </div>
          </div>

          <div className={`mt-4 flex items-start gap-3 rounded-2xl border px-4 py-3 ${
            isDownloaded
              ? 'border-emerald-100 bg-emerald-50 text-emerald-800'
              : isFailed
                ? 'border-rose-100 bg-rose-50 text-rose-800'
              : 'border-amber-100 bg-amber-50 text-amber-800'
          }`}>
            {isDownloaded ? (
              <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" />
            ) : isFailed ? (
              <Download size={20} className="mt-0.5 shrink-0 text-rose-600" />
            ) : (
              <Loader2 size={20} className="mt-0.5 shrink-0 animate-spin text-amber-600" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-black">
                {isDownloaded
                  ? 'Tiket PNG sudah diunduh'
                  : isFailed
                    ? 'Tiket belum berhasil diunduh'
                    : 'Tiket sedang disiapkan untuk download'}
              </p>
              <p className="mt-1 text-xs font-medium leading-relaxed opacity-80">
                {isDownloaded
                  ? 'Silakan simpan file tiket dan tunjukkan nomor ini saat dipanggil.'
                  : isFailed
                    ? 'Nomor tetap tampil di layar. Silakan coba ambil ulang jika file belum masuk ke perangkat.'
                  : 'Biarkan pop up ini terbuka sebentar sampai proses download selesai.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-slate-950/20 transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
            disabled={isPending}
          >
            {isDownloaded ? 'Selesai' : isFailed ? 'Tutup' : 'Menunggu Download...'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function QueueTicketStudio() {
  const [visitor, setVisitor] = useState('');
  const [originSchool, setOriginSchool] = useState('');
  const [registrationPath, setRegistrationPath] = useState(registrationPathOptions[0]);
  const [serviceChoice, setServiceChoice] = useState(serviceChoiceOptions[0]);
  const [ticket, setTicket] = useState<QueueTicketImage | null>(null);
  const [modalTicket, setModalTicket] = useState<QueueTicketImage | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>('pending');
  const [lastIssued, setLastIssued] = useState<QueueTicketImage | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [pendingDownload, setPendingDownload] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const originSchoolRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!pendingDownload || !ticket) return;

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      if (!imageRef.current || cancelled) return;

      try {
        const canvas = await html2canvas(imageRef.current, {
          scale: 3,
          backgroundColor: null,
          useCORS: true,
          logging: false,
        });
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', 1));

        if (!blob || cancelled) {
          setMessage('Tiket gagal diunduh. Coba tekan tombol sekali lagi.');
          setDownloadStatus('failed');
          setTicket(null);
          return;
        }

        downloadBlob(blob, `tiket-antrean-${ticket.number}.png`);
        saveDownloadedNumber(ticket.number);
        setLastIssued(ticket);
        setDownloadStatus('downloaded');
        setTicket(null);
        setMessage(`Nomor ${ticket.number} berhasil dibuat dan tiket PNG sudah diunduh.`);
      } catch {
        if (!cancelled) {
          setDownloadStatus('failed');
          setTicket(null);
          setMessage('Tiket gagal diunduh. Coba ambil ulang jika file belum masuk ke perangkat.');
        }
      } finally {
        if (!cancelled) {
          setPendingDownload(false);
          setIsBusy(false);
        }
      }
    }, 150);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [pendingDownload, ticket]);

  const generateUniqueTicket = async (form: QueueTicketForm) => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      let nextTicket: QueueTicketImage;

      try {
        const result = await createRemoteQueueTicket({
          visitorName: form.visitorName,
          originSchool: form.originSchool,
          registrationPath: form.registrationPath,
          serviceChoice: form.serviceChoice,
        });
        nextTicket = mapRemoteTicket(result.data);
      } catch {
        nextTicket = makeLocalTicket(form);
      }

      if (!getDownloadedNumbers().has(nextTicket.number)) {
        return nextTicket;
      }
    }

    throw new Error('Tidak dapat membuat nomor antrean unik.');
  };

  const handleTakeQueue = async () => {
    const cleanName = visitor.trim();
    const cleanOriginSchool = originSchool.trim();
    if (!cleanName) {
      setMessage('Isi nama calon peserta didik terlebih dahulu.');
      nameRef.current?.focus();
      return;
    }
    if (!cleanOriginSchool) {
      setMessage('Isi asal sekolah terlebih dahulu.');
      originSchoolRef.current?.focus();
      return;
    }

    if (isBusy) return;

    setIsBusy(true);
    setMessage('Membuat nomor antrean dan menyiapkan tiket...');
    setLastIssued(null);
    setModalTicket(null);
    setDownloadStatus('pending');

    try {
      const nextTicket = await generateUniqueTicket({
        visitorName: cleanName,
        originSchool: cleanOriginSchool,
        registrationPath,
        serviceChoice,
      });
      setModalTicket(nextTicket);
      setTicket(nextTicket);
      setPendingDownload(true);
    } catch {
      setIsBusy(false);
      setPendingDownload(false);
      setMessage('Nomor antrean belum bisa dibuat. Coba lagi sebentar.');
    }
  };

  const closeResultModal = () => {
    if (downloadStatus === 'pending') return;
    setModalTicket(null);
  };

  return (
    <section id="antrean" className="relative z-10 py-10 sm:py-20">
      <div className="mx-auto max-w-md px-4 sm:max-w-lg">
        <div className="mb-6 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-4 py-1.5">
            <Ticket size={13} className="text-cyan-600" />
            <span className="text-xs font-semibold text-cyan-700">Antrean Layanan Digital</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Ambil nomor antrean layanan dari ponsel.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            Pilih Verifikasi Berkas atau Informasi, lalu nomor akan tampil dan tiket PNG otomatis terunduh.
          </p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-xl shadow-slate-200/50 backdrop-blur">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/20">
              <Sparkles size={21} />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-slate-900">Nomor Antrean Layanan</h3>
              <p className="text-xs leading-relaxed text-slate-500">Nomor tampil sebagai pop up, tiket langsung download.</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <UserRound size={13} /> Nama Calon Peserta Didik
              </span>
              <input
                ref={nameRef}
                value={visitor}
                onChange={(event) => setVisitor(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                placeholder="Contoh: Ahmad Fauzan"
                autoComplete="name"
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <BadgeCheck size={13} /> Asal Sekolah
              </span>
              <input
                ref={originSchoolRef}
                value={originSchool}
                onChange={(event) => setOriginSchool(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                placeholder="Contoh: SMP Negeri 1 Cibinong"
                autoComplete="organization"
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <BadgeCheck size={13} /> Jalur Pendaftaran
              </span>
              <select
                value={registrationPath}
                onChange={(event) => setRegistrationPath(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base font-semibold text-slate-800 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              >
                {registrationPathOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <BadgeCheck size={13} /> Pilihan Layanan
              </span>
              <select
                value={serviceChoice}
                onChange={(event) => setServiceChoice(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base font-semibold text-slate-800 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              >
                {serviceChoiceOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>

            <button
              type="button"
              disabled={isBusy}
              onClick={handleTakeQueue}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-5 py-4 text-base font-black text-white shadow-xl shadow-indigo-500/25 transition hover:scale-[1.01] active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
            >
              {isBusy ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
              {isBusy ? 'Menyiapkan Tiket...' : 'Ambil No Antrean'}
            </button>
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
              {message}
            </div>
          ) : null}

          {lastIssued ? (
            <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" />
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Tiket Terakhir</p>
                  <p className="mt-1 break-words text-2xl font-black tracking-normal text-emerald-900">{lastIssued.number}</p>
                  <p className="mt-1 text-xs font-medium text-emerald-700">
                    File tiket PNG sudah diunduh ke perangkat ini.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-5 flex items-start gap-3 rounded-2xl bg-slate-950 px-4 py-4 text-white">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-cyan-300" />
            <p className="text-xs leading-relaxed text-slate-300">
              Layanan tersedia: Verifikasi Berkas dan Informasi sesuai loket yang tampil di dashboard.
            </p>
          </div>
        </div>
      </div>

      {ticket ? (
        <div className="pointer-events-none fixed left-[-10000px] top-0" aria-hidden="true">
          <div ref={imageRef}>
            <PremiumImageTicket ticket={ticket} />
          </div>
        </div>
      ) : null}

      {modalTicket ? (
        <QueueTicketResultModal
          ticket={modalTicket}
          downloadStatus={downloadStatus}
          onClose={closeResultModal}
        />
      ) : null}
    </section>
  );
}
