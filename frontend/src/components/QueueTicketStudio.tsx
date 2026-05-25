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
  phoneNumber: string;
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
  phoneNumber: string;
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
  'Pembuatan Akun SPMB': {
    name: 'Pembuatan Akun SPMB SMAN 2 Cibinong',
    prefix: 'SPMB',
    accent: 'from-rose-500 to-indigo-600',
    wait: 6,
    flow: 'Menunggu dipanggil langsung menuju Operator 5 untuk pembuatan akun SPMB.',
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
  'Pembuatan Akun SPMB',
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
    phoneNumber: form.phoneNumber,
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
      phoneNumber: form.phoneNumber,
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
    phoneNumber: ticket.phoneNumber ?? '-',
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
      phoneNumber: ticket.phoneNumber,
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
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">No HP</p>
            <p className="mt-2 break-words text-base font-bold leading-snug">{ticket.phoneNumber}</p>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3 py-3 sm:px-4 sm:py-6">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        aria-label="Tutup pop up nomor antrean"
        onClick={onClose}
      />

      <div className="relative max-h-[calc(100dvh-24px)] w-full max-w-[360px] overflow-hidden rounded-[24px] bg-white shadow-2xl shadow-slate-950/25 sm:max-w-[420px] sm:rounded-[28px]">
        <div className={`absolute inset-x-0 top-0 h-40 bg-gradient-to-br ${serviceConfig.accent} opacity-95 sm:h-44`} />
        <div className="absolute right-[-60px] top-[-70px] h-44 w-44 rounded-full bg-white/20" />
        <div className="absolute left-[-48px] top-20 h-28 w-28 rounded-full bg-cyan-200/30 blur-2xl" />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/30 sm:right-4 sm:top-4 sm:h-10 sm:w-10"
          aria-label="Tutup"
        >
          <X size={18} />
        </button>

        <div className="relative z-10 max-h-[calc(100dvh-24px)] overflow-y-auto p-4 sm:p-6">
          <div className="flex min-w-0 items-center gap-3 pr-9 text-white sm:pr-10">
            <img src="/logo-smavo.jpeg" alt="SMAVO" className="h-10 w-10 shrink-0 rounded-xl border border-white/40 object-cover shadow-lg sm:h-12 sm:w-12 sm:rounded-2xl" />
            <div className="min-w-0">
              <p className="truncate text-[10px] font-bold uppercase tracking-[0.2em] text-white/75 sm:text-[11px]">Antrean SMAVO</p>
              <h3 className="text-sm font-black leading-tight sm:text-lg">Nomor Antrean Berhasil Dibuat</h3>
            </div>
          </div>

          <div className="mt-4 rounded-[22px] border border-slate-100 bg-white p-4 shadow-xl shadow-slate-900/10 sm:mt-7 sm:rounded-[24px] sm:p-5">
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.26em] text-slate-400 sm:text-xs">Nomor Antrean</p>
              <div className="mt-2 rounded-[20px] bg-slate-950 px-4 py-4 text-white shadow-lg shadow-slate-950/20">
                <p className="break-words text-[4.2rem] font-black leading-none tracking-normal sm:text-[5rem]">
                  {queueNumber}
                </p>
                <p className="mt-1 break-words text-sm font-black text-cyan-200">{displayNumber}</p>
              </div>
            </div>

            <div className="mt-3 space-y-2 text-left sm:mt-4 sm:space-y-3">
              <div className="rounded-2xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Nama</p>
                <p className="mt-0.5 break-words text-sm font-black text-slate-900">{ticket.visitor}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="min-w-0 rounded-2xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">No HP</p>
                  <p className="mt-0.5 truncate text-sm font-bold text-slate-800">{ticket.phoneNumber}</p>
                </div>
                <div className="min-w-0 rounded-2xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Estimasi</p>
                  <p className="mt-0.5 truncate text-sm font-bold text-slate-800">{ticket.estimate}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="min-w-0 rounded-2xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Asal Sekolah</p>
                  <p className="mt-0.5 truncate text-sm font-bold text-slate-800">{ticket.originSchool}</p>
                </div>
                <div className="min-w-0 rounded-2xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Jalur</p>
                  <p className="mt-0.5 truncate text-sm font-bold text-slate-800">{ticket.registrationPath}</p>
                </div>
              </div>
              <div className="rounded-2xl bg-indigo-50 px-3 py-2.5 ring-1 ring-indigo-100">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-indigo-400">Layanan</p>
                <p className="mt-0.5 break-words text-sm font-black text-indigo-900">{ticket.serviceChoice}</p>
                <p className="mt-1 text-[11px] font-semibold leading-snug text-indigo-700/75">{serviceConfig.flow}</p>
              </div>
            </div>
          </div>

          <div className={`mt-3 flex items-start gap-2.5 rounded-2xl border px-3 py-2.5 sm:mt-4 sm:gap-3 sm:px-4 sm:py-3 ${
            isDownloaded
              ? 'border-emerald-100 bg-emerald-50 text-emerald-800'
              : isFailed
                ? 'border-rose-100 bg-rose-50 text-rose-800'
              : 'border-amber-100 bg-amber-50 text-amber-800'
          }`}>
            {isDownloaded ? (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600 sm:size-5" />
            ) : isFailed ? (
              <Download size={18} className="mt-0.5 shrink-0 text-rose-600 sm:size-5" />
            ) : (
              <Loader2 size={18} className="mt-0.5 shrink-0 animate-spin text-amber-600 sm:size-5" />
            )}
            <div className="min-w-0">
              <p className="text-xs font-black sm:text-sm">
                {isDownloaded
                  ? 'Tiket PNG sudah diunduh'
                  : isFailed
                    ? 'Tiket belum berhasil diunduh'
                    : 'Tiket sedang disiapkan untuk download'}
              </p>
              <p className="mt-0.5 text-[11px] font-medium leading-snug opacity-80 sm:mt-1 sm:text-xs sm:leading-relaxed">
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
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/20 transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60 sm:mt-4 sm:py-3.5"
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
  const [phoneNumber, setPhoneNumber] = useState('');
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
  const phoneNumberRef = useRef<HTMLInputElement>(null);
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
          phoneNumber: form.phoneNumber,
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

  const handlePhoneNumberChange = (value: string) => {
    setPhoneNumber(value.replace(/[^0-9+\-\s()]/g, '').slice(0, 20));
  };

  const handleTakeQueue = async () => {
    const cleanName = visitor.trim();
    const cleanPhoneNumber = phoneNumber.trim();
    const cleanOriginSchool = originSchool.trim();
    if (!cleanName) {
      setMessage('Isi nama calon peserta didik terlebih dahulu.');
      nameRef.current?.focus();
      return;
    }
    if (!cleanPhoneNumber) {
      setMessage('Isi nomor HP terlebih dahulu.');
      phoneNumberRef.current?.focus();
      return;
    }
    if (!/^[0-9+\-\s()]{8,20}$/.test(cleanPhoneNumber)) {
      setMessage('Nomor HP harus 8-20 karakter dan hanya berisi angka, spasi, +, -, atau tanda kurung.');
      phoneNumberRef.current?.focus();
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
        phoneNumber: cleanPhoneNumber,
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
    <section id="antrean" className="relative z-10 py-2 sm:py-20">
      <div className="mx-auto max-w-md px-2.5 sm:max-w-lg sm:px-4">
        <div className="mb-2 text-center sm:mb-6">
          <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-cyan-100 bg-cyan-50 px-2.5 py-0.5 sm:mb-4 sm:gap-2 sm:px-4 sm:py-1.5">
            <Ticket size={13} className="text-cyan-600" />
            <span className="text-[11px] font-semibold text-cyan-700 sm:text-xs">Antrean Layanan Digital</span>
          </div>
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Ambil Nomor Antrean
          </h2>
          <p className="mx-auto mt-0.5 max-w-xs text-[11px] leading-snug text-slate-500 sm:mt-3 sm:max-w-none sm:text-sm sm:leading-relaxed">
            Pilih layanan SPMB, lalu nomor akan tampil dan tiket PNG otomatis terunduh.
          </p>
        </div>

        <div className="rounded-[18px] border border-slate-200 bg-white/90 p-2.5 shadow-xl shadow-slate-200/50 backdrop-blur sm:rounded-[28px] sm:p-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2 sm:gap-3 sm:pb-5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/20 sm:h-12 sm:w-12 sm:rounded-2xl">
              <Sparkles size={17} className="sm:hidden" />
              <Sparkles size={21} className="hidden sm:block" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[13px] font-extrabold text-slate-900 sm:text-base">Nomor Antrean Layanan</h3>
              <p className="hidden text-xs leading-relaxed text-slate-500 sm:block">Nomor tampil sebagai pop up, tiket langsung download.</p>
            </div>
          </div>

          <div className="mt-2 space-y-1.5 sm:mt-5 sm:space-y-4">
            <label className="block">
              <span className="mb-0.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 sm:mb-2 sm:gap-2 sm:text-xs">
                <UserRound size={13} /> Nama Calon Peserta Didik
              </span>
              <input
                ref={nameRef}
                value={visitor}
                onChange={(event) => setVisitor(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100 sm:rounded-2xl sm:px-4 sm:py-4 sm:text-base"
                placeholder="Contoh: Ahmad Fauzan"
                autoComplete="name"
              />
            </label>

            <label className="block">
              <span className="mb-0.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 sm:mb-2 sm:gap-2 sm:text-xs">
                <BadgeCheck size={13} /> No HP
              </span>
              <input
                ref={phoneNumberRef}
                value={phoneNumber}
                onChange={(event) => handlePhoneNumberChange(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100 sm:rounded-2xl sm:px-4 sm:py-4 sm:text-base"
                placeholder="Contoh: 081234567890"
                autoComplete="tel"
                inputMode="tel"
              />
            </label>

            <label className="block">
              <span className="mb-0.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 sm:mb-2 sm:gap-2 sm:text-xs">
                <BadgeCheck size={13} /> Asal Sekolah
              </span>
              <input
                ref={originSchoolRef}
                value={originSchool}
                onChange={(event) => setOriginSchool(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100 sm:rounded-2xl sm:px-4 sm:py-4 sm:text-base"
                placeholder="Contoh: SMP Negeri 1 Cibinong"
                autoComplete="organization"
              />
            </label>

            <div className="grid grid-cols-2 gap-2 sm:block sm:space-y-4">
              <label className="block min-w-0">
                <span className="mb-0.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 sm:mb-2 sm:gap-2 sm:text-xs">
                  <BadgeCheck size={13} /> Jalur
                </span>
                <select
                  value={registrationPath}
                  onChange={(event) => setRegistrationPath(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs font-semibold text-slate-800 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100 sm:rounded-2xl sm:px-4 sm:py-4 sm:text-base"
                >
                  {registrationPathOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label className="block min-w-0">
                <span className="mb-0.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 sm:mb-2 sm:gap-2 sm:text-xs">
                  <BadgeCheck size={13} /> Layanan
                </span>
                <select
                  value={serviceChoice}
                  onChange={(event) => setServiceChoice(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs font-semibold text-slate-800 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100 sm:rounded-2xl sm:px-4 sm:py-4 sm:text-base"
                >
                  {serviceChoiceOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
            </div>

            <button
              type="button"
              disabled={isBusy}
              onClick={handleTakeQueue}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 px-4 py-2.5 text-sm font-black text-white shadow-xl shadow-indigo-500/25 transition hover:scale-[1.01] active:scale-[0.98] disabled:cursor-wait disabled:opacity-70 sm:gap-3 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-base"
            >
              {isBusy ? <Loader2 size={18} className="animate-spin sm:hidden" /> : <Download size={18} className="sm:hidden" />}
              {isBusy ? <Loader2 size={20} className="hidden animate-spin sm:block" /> : <Download size={20} className="hidden sm:block" />}
              {isBusy ? 'Menyiapkan Tiket...' : 'Ambil No Antrean'}
            </button>
          </div>

          {message ? (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 sm:mt-4 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
              {message}
            </div>
          ) : null}

          {lastIssued ? (
            <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3 sm:mt-4 sm:rounded-2xl sm:p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" />
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Tiket Terakhir</p>
                  <p className="mt-0.5 break-words text-xl font-black tracking-normal text-emerald-900 sm:mt-1 sm:text-2xl">{lastIssued.number}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-emerald-700 sm:mt-1 sm:text-xs">
                    File tiket PNG sudah diunduh ke perangkat ini.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-5 hidden items-start gap-3 rounded-2xl bg-slate-950 px-4 py-4 text-white sm:flex">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-cyan-300" />
            <p className="text-xs leading-relaxed text-slate-300">
              Layanan tersedia: Verifikasi Berkas, Pembuatan Akun SPMB, dan Informasi sesuai loket yang tampil di dashboard.
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
