import api from './api';

export type QueueStatus = 'WAITING' | 'CALLING' | 'SERVING' | 'DONE' | 'SKIPPED';
export type QueueCallType = 'NORMAL' | 'CUSTOM' | 'RECALL';

export type QueueCallLog = {
  id: string;
  type: QueueCallType;
  containerId: string;
  containerName: string;
  calledAt: string;
  calledBy?: string;
};

export type QueueTicket = {
  id: string;
  number: string;
  visitorName: string;
  phoneNumber?: string;
  originSchool?: string;
  registrationPath?: string;
  serviceChoice?: string;
  service: string;
  containerId: string;
  status: QueueStatus;
  createdAt: string;
  calledAt?: string;
  calledBy?: string;
  callType?: QueueCallType;
  callLogs?: QueueCallLog[];
  finishedAt?: string;
  skippedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  estimatedWaitMinutes: number;
};

export type CreateQueueTicketInput = {
  visitorName: string;
  phoneNumber?: string;
  containerId?: string;
  originSchool?: string;
  registrationPath?: string;
  serviceChoice?: string;
};

export type QueueContainer = {
  id: string;
  name: string;
  service: string;
  code: string;
  operator: string;
  isPaused: boolean;
  accent: string;
  activeTicket: QueueTicket | null;
  nextTickets: QueueTicket[];
  waitingCount: number;
  doneCount: number;
  skippedCount: number;
};

export type QueueContainerConfig = Pick<QueueContainer, 'id' | 'name' | 'service' | 'code' | 'operator' | 'isPaused' | 'accent'>;

export type QueueEvent = {
  id: string;
  type: 'CREATED' | 'CALLED' | 'CUSTOM_CALLED' | 'RECALLED' | 'SKIPPED' | 'DONE' | 'PAUSED' | 'RESUMED' | 'OPENED' | 'CLOSED';
  ticketNumber?: string;
  containerId?: string;
  actor?: string;
  message: string;
  createdAt: string;
};

export type QueueSnapshot = {
  containers: QueueContainer[];
  tickets: QueueTicket[];
  events: QueueEvent[];
  analytics: {
    totalToday: number;
    waiting: number;
    calling: number;
    serving: number;
    done: number;
    skipped: number;
    activeContainers: number;
    averageWaitMinutes: number;
    peakHour: string;
    hourlyTraffic: { hour: string; total: number; done: number }[];
  };
  isOpen: boolean;
  generatedAt: string;
};

export const emptyQueueSnapshot: QueueSnapshot = {
  containers: [],
  tickets: [],
  events: [],
  analytics: {
    totalToday: 0,
    waiting: 0,
    calling: 0,
    serving: 0,
    done: 0,
    skipped: 0,
    activeContainers: 0,
    averageWaitMinutes: 0,
    peakHour: '-',
    hourlyTraffic: [],
  },
  isOpen: true,
  generatedAt: '',
};

export const QUEUE_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function fetchQueueState() {
  const { data } = await api.get<{ success: boolean; data: QueueSnapshot }>('/queue/state');
  return data.data;
}

export async function createQueueTicket(input: CreateQueueTicketInput) {
  const { data } = await api.post<{ success: boolean; data: QueueTicket; snapshot: QueueSnapshot }>('/queue/tickets', {
    ...input,
  });
  return data;
}

export async function queueAction(containerId: string, action: 'call' | 'next' | 'recall' | 'done' | 'skip') {
  const { data } = await api.post<{ success: boolean; data: QueueTicket; snapshot: QueueSnapshot }>(`/queue/containers/${containerId}/${action}`);
  return data;
}

export async function customQueueCall(containerId: string, queueNumber: string) {
  const { data } = await api.post<{ success: boolean; data: QueueTicket; snapshot: QueueSnapshot }>(
    `/queue/containers/${containerId}/custom-call`,
    { queueNumber }
  );
  return data;
}

export async function pauseContainer(containerId: string, paused: boolean) {
  const { data } = await api.post<{ success: boolean; snapshot: QueueSnapshot }>(`/queue/containers/${containerId}/pause`, { paused });
  return data;
}

export async function setQueueOpen(isOpen: boolean) {
  const { data } = await api.post<{ success: boolean; data: { isOpen: boolean }; snapshot: QueueSnapshot }>('/queue/status', { isOpen });
  return data;
}

export async function updateQueueContainers(containers: QueueContainerConfig[]) {
  const { data } = await api.put<{ success: boolean; data: QueueContainerConfig[]; snapshot: QueueSnapshot }>('/queue/containers', {
    containers,
  });
  return data;
}

export async function resetQueueState() {
  const { data } = await api.post<{ success: boolean; snapshot: QueueSnapshot }>('/queue/reset');
  return data;
}

export function formatQueueNumber(number?: string | null) {
  return (number ?? '').replace(/^PPDB-/i, 'SPMB-');
}

export function formatQueueService(service?: string | null) {
  return (service ?? '').replace(/^PPDB$/i, 'SPMB');
}

export function openQueueEventSource(onSnapshot: (snapshot: QueueSnapshot) => void) {
  const source = new EventSource(`${QUEUE_API_URL}/queue/events`);
  source.onmessage = (event) => {
    try {
      onSnapshot(JSON.parse(event.data) as QueueSnapshot);
    } catch {
      // Ignore malformed SSE packets.
    }
  };
  return source;
}

export type QueueVoiceStyle = 'bank' | 'semangat' | 'formal' | 'singkat';

export type QueueVoiceOptions = {
  volume?: number;
  style?: QueueVoiceStyle;
};

function normalizeVoiceOptions(options?: number | QueueVoiceOptions): Required<QueueVoiceOptions> {
  if (typeof options === 'number') {
    return { volume: options, style: 'bank' };
  }

  return {
    volume: options?.volume ?? 0.9,
    style: options?.style ?? 'bank',
  };
}

function getPreferredVoice() {
  const voices = window.speechSynthesis.getVoices();

  return voices.find((voice) => voice.lang.toLowerCase().startsWith('id'))
    ?? voices.find((voice) => voice.lang.toLowerCase().startsWith('ms'))
    ?? voices.find((voice) => voice.lang.toLowerCase().startsWith('en'))
    ?? voices[0];
}

function makeSpokenQueueNumber(number: string) {
  const digitWords: Record<string, string> = {
    '0': 'nol',
    '1': 'satu',
    '2': 'dua',
    '3': 'tiga',
    '4': 'empat',
    '5': 'lima',
    '6': 'enam',
    '7': 'tujuh',
    '8': 'delapan',
    '9': 'sembilan',
  };
  const [rawPrefix, rawSuffix] = formatQueueNumber(number).split('-');
  const prefix = rawPrefix.split('').join(' ');
  const suffix = (rawSuffix ?? '').split('').map((digit) => digitWords[digit] ?? digit).join(' ');
  return suffix ? `${prefix}, ${suffix}` : prefix;
}

function makeQueueCallText(ticket: QueueTicket, container: QueueContainer, style: QueueVoiceStyle) {
  const number = makeSpokenQueueNumber(ticket.number);
  const destination = container.name;

  if (style === 'singkat') return `Nomor ${number}, ke ${destination}.`;
  if (style === 'formal') return `Mohon perhatian. Nomor antrean ${number}, dipersilakan menuju ${destination}. Terima kasih.`;
  if (style === 'bank') return `Nomor antrean. ${number}. Silakan menuju ${destination}.`;
  return `Perhatian. Nomor ${number}. Yuk, silakan menuju ${destination} sekarang. Terima kasih.`;
}

function getVoiceTuning(style: QueueVoiceStyle) {
  if (style === 'singkat') return { rate: 1.18, pitch: 1.02 };
  if (style === 'formal') return { rate: 0.88, pitch: 0.95 };
  if (style === 'bank') return { rate: 0.98, pitch: 0.98 };
  return { rate: 1.1, pitch: 1.12 };
}

function makeUnlockText(style: QueueVoiceStyle) {
  if (style === 'singkat') return 'Suara singkat aktif.';
  if (style === 'formal') return 'Suara formal antrean aktif.';
  if (style === 'bank') return 'Suara antrean bank aktif.';
  return 'Suara semangat aktif. Siap memanggil.';
}

export function unlockQueueAudio(options: number | QueueVoiceOptions = 0.5) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;

  const config = normalizeVoiceOptions(options);
  const tuning = getVoiceTuning(config.style);
  const synth = window.speechSynthesis;
  synth.cancel();
  synth.resume();

  const utterance = new SpeechSynthesisUtterance(makeUnlockText(config.style));
  utterance.lang = 'id-ID';
  utterance.rate = tuning.rate;
  utterance.pitch = tuning.pitch;
  utterance.volume = Math.max(0, Math.min(1, config.volume));
  const voice = getPreferredVoice();
  if (voice) utterance.voice = voice;
  synth.speak(utterance);
  return true;
}

export function speakQueueCall(ticket: QueueTicket, container: QueueContainer, options: number | QueueVoiceOptions = 0.9) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;

  const config = normalizeVoiceOptions(options);
  const tuning = getVoiceTuning(config.style);
  const synth = window.speechSynthesis;
  synth.cancel();
  synth.resume();
  const utterance = new SpeechSynthesisUtterance(makeQueueCallText(ticket, container, config.style));
  utterance.lang = 'id-ID';
  utterance.rate = tuning.rate;
  utterance.pitch = tuning.pitch;
  utterance.volume = Math.max(0, Math.min(1, config.volume));
  const voice = getPreferredVoice();
  if (voice) utterance.voice = voice;
  synth.speak(utterance);
  return true;
}
