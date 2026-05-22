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

function getPreferredVoice() {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((voice) => voice.lang.toLowerCase().startsWith('id'))
    ?? voices.find((voice) => voice.lang.toLowerCase().startsWith('ms'))
    ?? voices.find((voice) => voice.lang.toLowerCase().startsWith('en'))
    ?? voices[0];
}

export function unlockQueueAudio(volume = 0.5) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;

  const synth = window.speechSynthesis;
  synth.cancel();
  synth.resume();

  const utterance = new SpeechSynthesisUtterance('Suara antrean aktif.');
  utterance.lang = 'id-ID';
  utterance.rate = 0.72;
  utterance.pitch = 1;
  utterance.volume = Math.max(0, Math.min(1, volume));
  const voice = getPreferredVoice();
  if (voice) utterance.voice = voice;
  synth.speak(utterance);
  return true;
}

export function speakQueueCall(ticket: QueueTicket, container: QueueContainer, volume = 0.9) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;

  const synth = window.speechSynthesis;
  synth.cancel();
  synth.resume();
  const utterance = new SpeechSynthesisUtterance(`Nomor antrean ${formatQueueNumber(ticket.number)}, silakan menuju ${container.name}, layanan ${formatQueueService(container.service)}.`);
  utterance.lang = 'id-ID';
  utterance.rate = 0.72;
  utterance.pitch = 1;
  utterance.volume = Math.max(0, Math.min(1, volume));
  const voice = getPreferredVoice();
  if (voice) utterance.voice = voice;
  synth.speak(utterance);
  return true;
}
