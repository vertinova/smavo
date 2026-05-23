import api from './api';

export type QueueStatus = 'WAITING' | 'CALLING' | 'SERVING' | 'DONE' | 'SKIPPED';

export type QueueTicket = {
  id: string;
  number: string;
  visitorName: string;
  originSchool?: string;
  registrationPath?: string;
  serviceChoice?: string;
  service: string;
  containerId: string;
  status: QueueStatus;
  createdAt: string;
  calledAt?: string;
  finishedAt?: string;
  skippedAt?: string;
  estimatedWaitMinutes: number;
};

export type CreateQueueTicketInput = {
  visitorName: string;
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
  type: 'CREATED' | 'CALLED' | 'RECALLED' | 'SKIPPED' | 'DONE' | 'PAUSED' | 'RESUMED';
  ticketNumber?: string;
  containerId?: string;
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
  generatedAt: new Date().toISOString(),
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

export async function pauseContainer(containerId: string, paused: boolean) {
  const { data } = await api.post<{ success: boolean; snapshot: QueueSnapshot }>(`/queue/containers/${containerId}/pause`, { paused });
  return data;
}

export async function updateQueueContainers(containers: QueueContainerConfig[]) {
  const { data } = await api.put<{ success: boolean; data: QueueContainerConfig[]; snapshot: QueueSnapshot }>('/queue/containers', {
    containers,
  });
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
  voiceURI?: string;
  style?: QueueVoiceStyle;
};

function normalizeVoiceOptions(options?: number | QueueVoiceOptions): Required<QueueVoiceOptions> {
  if (typeof options === 'number') {
    return { volume: options, voiceURI: '', style: 'bank' };
  }

  return {
    volume: options?.volume ?? 0.9,
    voiceURI: options?.voiceURI ?? '',
    style: options?.style ?? 'bank',
  };
}

function getPreferredVoice(voiceURI = '') {
  const voices = window.speechSynthesis.getVoices();
  const selected = voices.find((voice) => voice.voiceURI === voiceURI);
  if (selected) return selected;

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
  if (style === 'formal') return `Nomor antrean ${number}, silakan menuju ${destination}.`;
  if (style === 'bank') return `Nomor antrean ${number}. Silakan menuju ${destination}.`;
  return `Nomor ${number}, silakan menuju ${destination} sekarang. Semangat!`;
}

function getVoiceTuning(style: QueueVoiceStyle) {
  if (style === 'singkat') return { rate: 1.08, pitch: 1.02 };
  if (style === 'formal') return { rate: 0.94, pitch: 1 };
  if (style === 'bank') return { rate: 0.98, pitch: 0.98 };
  return { rate: 1.03, pitch: 1.08 };
}

export function unlockQueueAudio(options: number | QueueVoiceOptions = 0.5) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;

  const config = normalizeVoiceOptions(options);
  const tuning = getVoiceTuning(config.style);
  const synth = window.speechSynthesis;
  synth.cancel();
  synth.resume();

  const utterance = new SpeechSynthesisUtterance(config.style === 'semangat' ? 'Suara antrean aktif. Siap memanggil!' : 'Suara antrean aktif.');
  utterance.lang = 'id-ID';
  utterance.rate = tuning.rate;
  utterance.pitch = tuning.pitch;
  utterance.volume = Math.max(0, Math.min(1, config.volume));
  const voice = getPreferredVoice(config.voiceURI);
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
  const voice = getPreferredVoice(config.voiceURI);
  if (voice) utterance.voice = voice;
  synth.speak(utterance);
  return true;
}
