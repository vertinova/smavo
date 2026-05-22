type QueueStatus = 'WAITING' | 'CALLING' | 'SERVING' | 'DONE' | 'SKIPPED';

export type QueueContainer = {
  id: string;
  name: string;
  service: string;
  code: string;
  operator: string;
  isPaused: boolean;
  accent: string;
};

export type QueueContainerInput = Partial<QueueContainer> & {
  name: string;
  service: string;
  code: string;
};

export type QueueTicket = {
  id: string;
  number: string;
  visitorName: string;
  service: string;
  containerId: string;
  status: QueueStatus;
  createdAt: string;
  calledAt?: string;
  finishedAt?: string;
  skippedAt?: string;
  estimatedWaitMinutes: number;
};

export type QueueEvent = {
  id: string;
  type: 'CREATED' | 'CALLED' | 'RECALLED' | 'SKIPPED' | 'DONE' | 'PAUSED' | 'RESUMED';
  ticketNumber?: string;
  containerId?: string;
  message: string;
  createdAt: string;
};

type QueueSnapshot = {
  containers: Array<QueueContainer & {
    activeTicket: QueueTicket | null;
    nextTickets: QueueTicket[];
    waitingCount: number;
    doneCount: number;
    skippedCount: number;
  }>;
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

const accents = ['cyan', 'violet', 'emerald', 'amber', 'rose'];

let containers: QueueContainer[] = [
  { id: 'container-1', name: 'Container 1', service: 'SPMB', code: 'SPMB', operator: 'Petugas SPMB', isPaused: false, accent: 'cyan' },
  { id: 'container-2', name: 'Container 2', service: 'Tata Usaha', code: 'TU', operator: 'Petugas TU', isPaused: false, accent: 'violet' },
  { id: 'container-3', name: 'Container 3', service: 'BK', code: 'BK', operator: 'Petugas BK', isPaused: false, accent: 'emerald' },
  { id: 'container-4', name: 'Container 4', service: 'Legalisir', code: 'LGL', operator: 'Petugas Legalisir', isPaused: false, accent: 'amber' },
  { id: 'container-5', name: 'Container 5', service: 'Informasi Akademik', code: 'IA', operator: 'Petugas Akademik', isPaused: false, accent: 'rose' },
];

let tickets: QueueTicket[] = [];
let events: QueueEvent[] = [];
const counters = new Map<string, number>();

function sameDay(dateIso: string) {
  const input = new Date(dateIso);
  const now = new Date();
  return input.getFullYear() === now.getFullYear()
    && input.getMonth() === now.getMonth()
    && input.getDate() === now.getDate();
}

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeCode(value: string, fallback: string) {
  const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  return cleaned || fallback;
}

function makeUniqueCode(code: string, used: Set<string>, index: number) {
  if (!used.has(code)) return code;

  const base = code.slice(0, 6) || `C${index + 1}`;
  let suffix = 2;
  let nextCode = `${base}${suffix}`;
  while (used.has(nextCode)) {
    suffix += 1;
    nextCode = `${base}${suffix}`;
  }
  return nextCode.slice(0, 8);
}

function addEvent(event: Omit<QueueEvent, 'id' | 'createdAt'>) {
  const nextEvent = { ...event, id: makeId('event'), createdAt: nowIso() };
  events = [nextEvent, ...events].slice(0, 80);
  return nextEvent;
}

function todayTickets() {
  return tickets.filter((ticket) => sameDay(ticket.createdAt));
}

function waitingFor(containerId: string) {
  return todayTickets()
    .filter((ticket) => ticket.containerId === containerId && ticket.status === 'WAITING')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

function activeFor(containerId: string) {
  return todayTickets()
    .filter((ticket) => ticket.containerId === containerId && ['CALLING', 'SERVING'].includes(ticket.status))
    .sort((a, b) => new Date(b.calledAt ?? b.createdAt).getTime() - new Date(a.calledAt ?? a.createdAt).getTime())[0] ?? null;
}

function updateTicket(id: string, patch: Partial<QueueTicket>) {
  tickets = tickets.map((ticket) => ticket.id === id ? { ...ticket, ...patch } : ticket);
  return tickets.find((ticket) => ticket.id === id) ?? null;
}

function finishActiveTicket(containerId: string) {
  const active = activeFor(containerId);
  if (!active) return null;
  return updateTicket(active.id, { status: 'DONE', finishedAt: nowIso() });
}

function getAverageWaitMinutes(doneTickets: QueueTicket[]) {
  const waited = doneTickets
    .filter((ticket) => ticket.calledAt)
    .map((ticket) => Math.max(1, Math.round((new Date(ticket.calledAt!).getTime() - new Date(ticket.createdAt).getTime()) / 60000)));

  if (!waited.length) return 0;
  return Math.round(waited.reduce((sum, value) => sum + value, 0) / waited.length);
}

function getHourlyTraffic(allTickets: QueueTicket[]) {
  const buckets = Array.from({ length: 10 }, (_, index) => {
    const hour = 7 + index;
    return { hour: `${String(hour).padStart(2, '0')}:00`, total: 0, done: 0 };
  });

  allTickets.forEach((ticket) => {
    const hour = new Date(ticket.createdAt).getHours();
    const bucket = buckets.find((item) => item.hour.startsWith(String(hour).padStart(2, '0')));
    if (bucket) {
      bucket.total += 1;
      if (ticket.status === 'DONE') bucket.done += 1;
    }
  });

  return buckets;
}

export function getQueueSnapshot(): QueueSnapshot {
  const allToday = todayTickets();
  const done = allToday.filter((ticket) => ticket.status === 'DONE');
  const skipped = allToday.filter((ticket) => ticket.status === 'SKIPPED');
  const hourlyTraffic = getHourlyTraffic(allToday);
  const peak = hourlyTraffic.reduce((winner, item) => item.total > winner.total ? item : winner, hourlyTraffic[0]);

  return {
    containers: containers.map((container) => ({
      ...container,
      activeTicket: activeFor(container.id),
      nextTickets: waitingFor(container.id).slice(0, 5),
      waitingCount: waitingFor(container.id).length,
      doneCount: done.filter((ticket) => ticket.containerId === container.id).length,
      skippedCount: skipped.filter((ticket) => ticket.containerId === container.id).length,
    })),
    tickets: allToday.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    events,
    analytics: {
      totalToday: allToday.length,
      waiting: allToday.filter((ticket) => ticket.status === 'WAITING').length,
      calling: allToday.filter((ticket) => ticket.status === 'CALLING').length,
      serving: allToday.filter((ticket) => ticket.status === 'SERVING').length,
      done: done.length,
      skipped: skipped.length,
      activeContainers: containers.filter((container) => !container.isPaused).length,
      averageWaitMinutes: getAverageWaitMinutes(done),
      peakHour: peak?.total ? peak.hour : '-',
      hourlyTraffic,
    },
    generatedAt: nowIso(),
  };
}

export function updateQueueContainers(inputs: QueueContainerInput[]) {
  const usedIds = new Set<string>();
  const usedCodes = new Set<string>();

  containers = inputs.map((input, index) => {
    const fallbackId = `container-${index + 1}`;
    const incomingId = input.id?.trim() || fallbackId;
    const id = usedIds.has(incomingId) ? fallbackId : incomingId;
    usedIds.add(id);

    const existing = containers.find((container) => container.id === id);
    const fallbackCode = `C${index + 1}`;
    const code = makeUniqueCode(normalizeCode(input.code, fallbackCode), usedCodes, index);
    usedCodes.add(code);

    return {
      id,
      name: input.name.trim() || `Container ${index + 1}`,
      service: input.service.trim() || `Layanan ${index + 1}`,
      code,
      operator: input.operator?.trim() || `Petugas ${input.service.trim() || `Container ${index + 1}`}`,
      isPaused: input.isPaused ?? existing?.isPaused ?? false,
      accent: accents.includes(input.accent ?? '') ? input.accent! : accents[index % accents.length],
    };
  });

  addEvent({
    type: 'RESUMED',
    message: `Konfigurasi container diperbarui menjadi ${containers.length} container`,
  });

  return containers;
}

export function createQueueTicket(visitorName: string, containerId = 'container-1') {
  const container = containers.find((item) => item.id === containerId) ?? containers[0];
  const counterKey = `${container.code}-${new Date().toISOString().slice(0, 10)}`;
  const nextNumber = (counters.get(counterKey) ?? tickets.filter((ticket) => sameDay(ticket.createdAt) && ticket.service === container.service).length) + 1;
  counters.set(counterKey, nextNumber);

  const ticket: QueueTicket = {
    id: makeId('ticket'),
    number: `${container.code}-${String(nextNumber).padStart(3, '0')}`,
    visitorName,
    service: container.service,
    containerId: container.id,
    status: 'WAITING',
    createdAt: nowIso(),
    estimatedWaitMinutes: Math.max(6, waitingFor(container.id).length * 6),
  };

  tickets = [ticket, ...tickets];
  addEvent({
    type: 'CREATED',
    ticketNumber: ticket.number,
    containerId: container.id,
    message: `${ticket.number} masuk ke antrian ${container.service}`,
  });

  return ticket;
}

export function callNextTicket(containerId: string) {
  const container = containers.find((item) => item.id === containerId);
  if (!container || container.isPaused) return null;

  if (activeFor(containerId)) return null;

  const next = waitingFor(containerId)[0];
  if (!next) return null;

  const called = updateTicket(next.id, { status: 'CALLING', calledAt: nowIso() });
  addEvent({
    type: 'CALLED',
    ticketNumber: called?.number,
    containerId,
    message: `${called?.number} dipanggil ke ${container.name}`,
  });
  return called;
}

export function recallTicket(containerId: string) {
  const container = containers.find((item) => item.id === containerId);
  const active = activeFor(containerId);
  if (!container || !active) return null;

  const recalled = updateTicket(active.id, { status: 'CALLING', calledAt: nowIso() });
  addEvent({
    type: 'RECALLED',
    ticketNumber: active.number,
    containerId,
    message: `${active.number} dipanggil ulang ke ${container.name}`,
  });
  return recalled;
}

export function completeTicket(containerId: string) {
  const container = containers.find((item) => item.id === containerId);
  const completed = finishActiveTicket(containerId);
  if (!container || !completed) return null;

  addEvent({
    type: 'DONE',
    ticketNumber: completed.number,
    containerId,
    message: `${completed.number} selesai dilayani di ${container.name}`,
  });
  return completed;
}

export function skipTicket(containerId: string) {
  const container = containers.find((item) => item.id === containerId);
  const active = activeFor(containerId);
  if (!container || !active) return null;

  const skipped = updateTicket(active.id, { status: 'SKIPPED', skippedAt: nowIso(), finishedAt: nowIso() });
  addEvent({
    type: 'SKIPPED',
    ticketNumber: active.number,
    containerId,
    message: `${active.number} dilewati dari ${container.name}`,
  });
  return skipped;
}

export function setContainerPaused(containerId: string, paused: boolean) {
  const container = containers.find((item) => item.id === containerId);
  if (!container) return null;

  container.isPaused = paused;
  addEvent({
    type: paused ? 'PAUSED' : 'RESUMED',
    containerId,
    message: `${container.name} ${paused ? 'pause layanan' : 'aktif kembali'}`,
  });
  return container;
}
