import fs from 'node:fs';
import path from 'node:path';

type QueueStatus = 'WAITING' | 'CALLING' | 'SERVING' | 'DONE' | 'SKIPPED';
type QueueCallType = 'NORMAL' | 'CUSTOM' | 'RECALL';

export type QueueCallLog = {
  id: string;
  type: QueueCallType;
  containerId: string;
  containerName: string;
  calledAt: string;
  calledBy?: string;
};

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

export type QueueTicketInput = {
  visitorName: string;
  phoneNumber?: string;
  containerId?: string;
  originSchool?: string;
  registrationPath?: string;
  serviceChoice?: string;
};

export type QueueEvent = {
  id: string;
  type: 'CREATED' | 'CALLED' | 'CUSTOM_CALLED' | 'RECALLED' | 'SKIPPED' | 'DONE' | 'PAUSED' | 'RESUMED' | 'OPENED' | 'CLOSED';
  ticketNumber?: string;
  containerId?: string;
  actor?: string;
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
  isOpen: boolean;
  generatedAt: string;
};

type PersistedQueueState = {
  containers?: QueueContainer[];
  tickets?: QueueTicket[];
  events?: QueueEvent[];
  counters?: Array<[string, number]>;
  isOpen?: boolean;
};

const accents = ['cyan', 'violet', 'emerald', 'amber', 'rose'];
const queueStateFile = process.env.QUEUE_STATE_FILE || path.join(process.cwd(), 'data', 'queue-state.json');
const QUEUE_SERVICES = {
  verification: 'Verifikasi Berkas',
  information: 'Informasi',
  operator: 'Operator',
};
const ACCOUNT_SERVICE_CHOICE = 'PEMBUATAN AKUN SPMB';
const ACCOUNT_CONTAINER_ID = 'operator-5';

let containers: QueueContainer[] = [
  { id: 'verifikator-1', name: 'Verifikator 1', service: QUEUE_SERVICES.verification, code: 'SPMB', operator: 'Dra. Kristiana, M.Pd.', isPaused: false, accent: 'cyan' },
  { id: 'verifikator-2', name: 'Verifikator 2', service: QUEUE_SERVICES.verification, code: 'SPMB', operator: 'Artanti, S.Si.', isPaused: false, accent: 'violet' },
  { id: 'verifikator-3', name: 'Verifikator 3', service: QUEUE_SERVICES.verification, code: 'SPMB', operator: 'Mariyana Septi Nugraheni, S.Pd.', isPaused: false, accent: 'emerald' },
  { id: 'verifikator-4', name: 'Verifikator 4', service: QUEUE_SERVICES.verification, code: 'SPMB', operator: 'Rizki, S.Pd.', isPaused: false, accent: 'amber' },
  { id: 'verifikator-5', name: 'Verifikator 5', service: QUEUE_SERVICES.verification, code: 'SPMB', operator: 'Fatasya Kamal, S.Pd.', isPaused: false, accent: 'rose' },
  { id: 'operator-5', name: 'Operator 5', service: QUEUE_SERVICES.operator, code: 'SPMB', operator: 'Operator 5', isPaused: false, accent: 'rose' },
  { id: 'informasi-1', name: 'INFORMASI', service: QUEUE_SERVICES.information, code: 'SPMB', operator: 'Dra. Sumitri, M.Pd.', isPaused: false, accent: 'cyan' },
];

let tickets: QueueTicket[] = [];
let events: QueueEvent[] = [];
let isOpen = true;
const counters = new Map<string, number>();

function loadQueueState() {
  if (!fs.existsSync(queueStateFile)) return;

  try {
    const parsed = JSON.parse(fs.readFileSync(queueStateFile, 'utf8')) as PersistedQueueState;
    if (Array.isArray(parsed.containers) && parsed.containers.length) containers = parsed.containers;
    if (Array.isArray(parsed.tickets)) tickets = parsed.tickets;
    if (Array.isArray(parsed.events)) events = parsed.events;
    if (typeof parsed.isOpen === 'boolean') isOpen = parsed.isOpen;
    if (Array.isArray(parsed.counters)) {
      counters.clear();
      parsed.counters.forEach(([key, value]) => {
        if (typeof key === 'string' && Number.isFinite(value)) counters.set(key, value);
      });
    }
  } catch (error) {
    console.error('Gagal membaca state antrean tersimpan:', error);
  }
}

function persistQueueState() {
  try {
    fs.mkdirSync(path.dirname(queueStateFile), { recursive: true });
    const payload: PersistedQueueState = {
      containers,
      tickets,
      events,
      counters: [...counters.entries()],
      isOpen,
    };
    fs.writeFileSync(queueStateFile, JSON.stringify(payload, null, 2));
  } catch (error) {
    console.error('Gagal menyimpan state antrean:', error);
  }
}

loadQueueState();

function ensureFlowContainers() {
  const verificationService = normalizeService(QUEUE_SERVICES.verification);
  const informationService = normalizeService(QUEUE_SERVICES.information);
  const operatorService = normalizeService(QUEUE_SERVICES.operator);
  const hasVerification = containers.some((container) => normalizeService(container.service) === verificationService);
  const hasInformation = containers.some((container) => normalizeService(container.service) === informationService);
  const hasAccountOperator = containers.some((container) => (
    container.id === ACCOUNT_CONTAINER_ID
    || (normalizeService(container.service) === operatorService && normalizeService(container.name) === 'OPERATOR 5')
  ));

  if (hasVerification && hasInformation && hasAccountOperator) return;

  const legacyVerificationServices = ['SPMB', 'VERIFIKASI SPMB', 'VERIFIKASI BERKAS'];
  const legacyInfoServices = ['INFORMASI', 'LAYANAN INFORMASI', 'INFORMASI SPMB'];
  const legacyOperatorServices = ['OPERATOR SPMB'];
  const legacySpmb = containers.filter((container) => legacyVerificationServices.includes(normalizeService(container.service)));
  const defaultVerificationContainers = [
    { id: 'verifikator-1', name: 'Verifikator 1', service: QUEUE_SERVICES.verification, code: 'SPMB', operator: 'Dra. Kristiana, M.Pd.', isPaused: false, accent: 'cyan' },
    { id: 'verifikator-2', name: 'Verifikator 2', service: QUEUE_SERVICES.verification, code: 'SPMB', operator: 'Artanti, S.Si.', isPaused: false, accent: 'violet' },
    { id: 'verifikator-3', name: 'Verifikator 3', service: QUEUE_SERVICES.verification, code: 'SPMB', operator: 'Mariyana Septi Nugraheni, S.Pd.', isPaused: false, accent: 'emerald' },
    { id: 'verifikator-4', name: 'Verifikator 4', service: QUEUE_SERVICES.verification, code: 'SPMB', operator: 'Rizki, S.Pd.', isPaused: false, accent: 'amber' },
    { id: 'verifikator-5', name: 'Verifikator 5', service: QUEUE_SERVICES.verification, code: 'SPMB', operator: 'Fatasya Kamal, S.Pd.', isPaused: false, accent: 'rose' },
  ];
  const defaultAccountOperatorContainer = {
    id: ACCOUNT_CONTAINER_ID,
    name: 'Operator 5',
    service: QUEUE_SERVICES.operator,
    code: 'SPMB',
    operator: 'Operator 5',
    isPaused: false,
    accent: 'rose',
  };
  containers = [
    ...(hasVerification
      ? containers.filter((container) => normalizeService(container.service) === verificationService)
      : (legacySpmb.length ? legacySpmb.slice(0, 5).map((container, index) => ({
        ...container,
        id: container.id || `verifikator-${index + 1}`,
        name: container.name?.replace(/operator/gi, 'Verifikator') || `Verifikator ${index + 1}`,
        service: QUEUE_SERVICES.verification,
        code: 'SPMB',
        operator: container.operator?.replace(/operator/gi, 'Verifikator') || `Verifikator ${index + 1}`,
        accent: accents[index % accents.length],
      })) : defaultVerificationContainers)),
    ...(hasAccountOperator ? [] : [defaultAccountOperatorContainer]),
    ...(hasInformation ? containers.filter((container) => normalizeService(container.service) === informationService) : [{
      id: 'informasi-1',
      name: 'INFORMASI',
      service: QUEUE_SERVICES.information,
      code: 'SPMB',
      operator: 'Dra. Sumitri, M.Pd.',
      isPaused: false,
      accent: 'cyan',
    }]),
    ...containers.filter((container) => {
      const service = normalizeService(container.service);
      return ![
        ...legacyVerificationServices,
        ...legacyInfoServices,
        ...legacyOperatorServices,
        normalizeService(QUEUE_SERVICES.verification),
        normalizeService(QUEUE_SERVICES.information),
      ].includes(service);
    }),
  ];
}

ensureFlowContainers();

function migrateAccountCreationTickets() {
  const accountContainer = getAccountCreationContainer();
  if (!accountContainer) return;

  let changed = false;
  tickets = tickets.map((ticket) => {
    if (!isAccountCreationTicket(ticket) || ticket.status !== 'WAITING') return ticket;
    if (normalizeService(ticket.service) === normalizeService(QUEUE_SERVICES.operator) && ticket.containerId === accountContainer.id) {
      return ticket;
    }
    changed = true;
    return {
      ...ticket,
      service: QUEUE_SERVICES.operator,
      containerId: accountContainer.id,
      verifiedAt: ticket.verifiedAt ?? ticket.createdAt,
    };
  });

  if (changed) persistQueueState();
}

migrateAccountCreationTickets();

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

function normalizeQueueNumber(value: string, fallbackCode: string) {
  const cleaned = value.trim().toUpperCase().replace(/\s+/g, '');
  const safeCode = normalizeCode(fallbackCode, 'SPMB');
  if (!cleaned) return '';
  if (/^\d+$/.test(cleaned)) return `${safeCode}-${cleaned.padStart(3, '0')}`;
  if (/^[A-Z0-9]+-\d+$/.test(cleaned)) {
    const [code, suffix] = cleaned.split('-');
    return `${normalizeCode(code, safeCode)}-${suffix.padStart(3, '0')}`;
  }
  return cleaned.replace(/^PPDB-/i, 'SPMB-');
}

function normalizeService(value: string) {
  return value.trim().toUpperCase();
}

function getInitialService(input: QueueTicketInput) {
  const choice = normalizeService(input.serviceChoice ?? '');
  if (choice.includes('INFORMASI')) return QUEUE_SERVICES.information;
  if (choice === ACCOUNT_SERVICE_CHOICE) return QUEUE_SERVICES.operator;
  return QUEUE_SERVICES.verification;
}

function isAccountCreationTicket(ticket: Pick<QueueTicket, 'serviceChoice'>) {
  return normalizeService(ticket.serviceChoice ?? '') === ACCOUNT_SERVICE_CHOICE;
}

function getAccountCreationContainer() {
  return containers.find((item) => item.id === ACCOUNT_CONTAINER_ID)
    ?? containers.find((item) => normalizeService(item.service) === normalizeService(QUEUE_SERVICES.operator) && normalizeService(item.name) === 'OPERATOR 5')
    ?? containers.find((item) => normalizeService(item.service) === normalizeService(QUEUE_SERVICES.operator) && normalizeService(item.name).endsWith(' 5'));
}

function getFirstContainerForService(service: string) {
  const serviceKey = normalizeService(service);
  return containers.find((item) => normalizeService(item.service) === serviceKey) ?? containers[0];
}

function addEvent(event: Omit<QueueEvent, 'id' | 'createdAt'>) {
  const nextEvent = { ...event, id: makeId('event'), createdAt: nowIso() };
  events = [nextEvent, ...events].slice(0, 80);
  return nextEvent;
}

function todayTickets() {
  return tickets.filter((ticket) => sameDay(ticket.createdAt));
}

function getTicketSequence(ticket: QueueTicket) {
  const suffix = Number(ticket.number.split('-').pop());
  return Number.isFinite(suffix) ? suffix : Number.MAX_SAFE_INTEGER;
}

function compareQueueOrder(a: QueueTicket, b: QueueTicket) {
  // For re-queued tickets (post-verifikasi) the verifiedAt timestamp drives the
  // operator queue order. Original verifikasi/informasi tickets fall back to
  // createdAt so the existing flow is preserved.
  const aTime = a.verifiedAt ?? a.createdAt;
  const bTime = b.verifiedAt ?? b.createdAt;
  const timeDiff = new Date(aTime).getTime() - new Date(bTime).getTime();
  if (timeDiff !== 0) return timeDiff;
  return getTicketSequence(a) - getTicketSequence(b);
}

function waitingFor(containerId: string) {
  const container = containers.find((item) => item.id === containerId);
  if (!container) return [];
  const serviceKey = normalizeService(container.service);
  const accountContainerId = getAccountCreationContainer()?.id;

  return todayTickets()
    .filter((ticket) => {
      if (ticket.status !== 'WAITING' || normalizeService(ticket.service) !== serviceKey) return false;
      if (!accountContainerId) return true;
      if (container.id === accountContainerId) return isAccountCreationTicket(ticket);
      return !isAccountCreationTicket(ticket);
    })
    .sort(compareQueueOrder);
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

function appendCallLog(ticket: QueueTicket, container: QueueContainer, type: QueueCallType, calledAt: string, calledBy?: string) {
  return [
    ...(ticket.callLogs ?? []),
    {
      id: makeId('call'),
      type,
      containerId: container.id,
      containerName: container.name,
      calledAt,
      calledBy,
    },
  ].slice(-30);
}

function finishActiveTicket(containerId: string) {
  const active = activeFor(containerId);
  if (!active) return null;
  return updateTicket(active.id, { status: 'DONE', finishedAt: nowIso() });
}

function getHighestIssuedNumber(code: string) {
  const prefix = `${code}-`;
  return todayTickets()
    .filter((ticket) => ticket.number.startsWith(prefix))
    .reduce((highest, ticket) => {
      const suffix = Number(ticket.number.slice(prefix.length));
      return Number.isFinite(suffix) ? Math.max(highest, suffix) : highest;
    }, 0);
}

function makeNextQueueNumber(code: string) {
  const counterKey = `${code}-${new Date().toISOString().slice(0, 10)}`;
  const usedNumbers = new Set(todayTickets().map((ticket) => ticket.number));
  let nextNumber = Math.max(counters.get(counterKey) ?? 0, getHighestIssuedNumber(code));
  let formatted = '';

  do {
    nextNumber += 1;
    formatted = `${code}-${String(nextNumber).padStart(3, '0')}`;
  } while (usedNumbers.has(formatted));

  counters.set(counterKey, nextNumber);
  return formatted;
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
    isOpen,
    generatedAt: nowIso(),
  };
}

export function isQueueOpen() {
  return isOpen;
}

export function setQueueOpen(open: boolean) {
  if (isOpen === open) return isOpen;

  isOpen = open;
  addEvent({
    type: open ? 'OPENED' : 'CLOSED',
    message: open ? 'Antrean dibuka oleh admin' : 'Antrean ditutup oleh admin',
  });
  persistQueueState();
  return isOpen;
}

export function updateQueueContainers(inputs: QueueContainerInput[]) {
  const usedIds = new Set<string>();

  containers = inputs.map((input, index) => {
    const fallbackId = `container-${index + 1}`;
    const incomingId = input.id?.trim() || fallbackId;
    const id = usedIds.has(incomingId) ? fallbackId : incomingId;
    usedIds.add(id);

    const existing = containers.find((container) => container.id === id);
    const fallbackCode = 'SPMB';
    const code = normalizeCode(input.code, fallbackCode);

    return {
      id,
      name: input.name.trim() || `Verifikator ${index + 1}`,
      service: input.service.trim() || QUEUE_SERVICES.verification,
      code,
      operator: input.operator?.trim() || `Verifikator ${index + 1}`,
      isPaused: input.isPaused ?? existing?.isPaused ?? false,
      accent: accents.includes(input.accent ?? '') ? input.accent! : accents[index % accents.length],
    };
  });
  ensureFlowContainers();

  addEvent({
    type: 'RESUMED',
    message: `Konfigurasi loket diperbarui menjadi ${containers.length} loket`,
  });
  persistQueueState();

  return containers;
}

export function createQueueTicket(input: QueueTicketInput) {
  const initialService = getInitialService(input);
  const accountContainer = normalizeService(input.serviceChoice ?? '') === ACCOUNT_SERVICE_CHOICE
    ? getAccountCreationContainer()
    : null;
  const requestedContainer = accountContainer ?? (input.containerId ? containers.find((item) => item.id === input.containerId) : null);
  const container = requestedContainer && normalizeService(requestedContainer.service) === initialService
    ? requestedContainer
    : getFirstContainerForService(initialService);
  const number = makeNextQueueNumber(container.code);

  const ticket: QueueTicket = {
    id: makeId('ticket'),
    number,
    visitorName: input.visitorName.trim(),
    phoneNumber: input.phoneNumber?.trim() || undefined,
    originSchool: input.originSchool?.trim() || undefined,
    registrationPath: input.registrationPath?.trim() || undefined,
    serviceChoice: input.serviceChoice?.trim() || undefined,
    service: initialService,
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
    message: `${ticket.number} masuk ke antrean ${ticket.service}`,
  });
  persistQueueState();

  return ticket;
}

export function callNextTicket(containerId: string) {
  const container = containers.find((item) => item.id === containerId);
  if (!container || container.isPaused) return null;

  if (activeFor(containerId)) return null;

  const next = waitingFor(containerId)[0];
  if (!next) return null;

  const calledAt = nowIso();
  const called = updateTicket(next.id, {
    containerId,
    status: 'CALLING',
    calledAt,
    callType: 'NORMAL',
    callLogs: appendCallLog(next, container, 'NORMAL', calledAt),
  });
  addEvent({
    type: 'CALLED',
    ticketNumber: called?.number,
    containerId,
    message: `${called?.number} dipanggil ke ${container.name}`,
  });
  persistQueueState();
  return called;
}

export function callCustomTicket(containerId: string, queueNumber: string, actor?: string) {
  const container = containers.find((item) => item.id === containerId);
  if (!container) return { ticket: null, error: 'Container antrean tidak ditemukan' };
  if (container.isPaused) return { ticket: null, error: 'Loket sedang pause. Aktifkan loket sebelum memanggil antrean.' };
  if (activeFor(containerId)) return { ticket: null, error: 'Selesaikan atau lewati nomor aktif sebelum memanggil nomor custom.' };

  const normalizedNumber = normalizeQueueNumber(queueNumber, container.code);
  if (!normalizedNumber) return { ticket: null, error: 'Nomor antrean wajib diisi.' };

  const eligibleTicket = waitingFor(containerId).find((ticket) => normalizeQueueNumber(ticket.number, container.code) === normalizedNumber);
  if (!eligibleTicket) {
    const registeredTicket = todayTickets().find((ticket) => normalizeQueueNumber(ticket.number, container.code) === normalizedNumber);
    if (!registeredTicket) {
      return { ticket: null, error: `Nomor antrean ${normalizedNumber} tidak ditemukan pada data antrean aktif.` };
    }

    if (registeredTicket.status !== 'WAITING') {
      return { ticket: null, error: `Nomor antrean ${normalizedNumber} sudah dipanggil, selesai, atau tidak lagi menunggu.` };
    }

    return { ticket: null, error: `Nomor antrean ${normalizedNumber} tidak berada dalam daftar aktif ${container.name}.` };
  }

  const calledAt = nowIso();
  const calledBy = actor?.trim() || container.operator || container.name;
  const called = updateTicket(eligibleTicket.id, {
    containerId,
    status: 'CALLING',
    calledAt,
    calledBy,
    callType: 'CUSTOM',
    callLogs: appendCallLog(eligibleTicket, container, 'CUSTOM', calledAt, calledBy),
  });

  addEvent({
    type: 'CUSTOM_CALLED',
    ticketNumber: called?.number,
    containerId,
    actor: calledBy,
    message: `${called?.number} dipanggil custom ke ${container.name} oleh ${calledBy}`,
  });
  persistQueueState();
  return { ticket: called, error: null };
}

export function recallTicket(containerId: string) {
  const container = containers.find((item) => item.id === containerId);
  const active = activeFor(containerId);
  if (!container || !active) return null;

  const calledAt = nowIso();
  const recalled = updateTicket(active.id, {
    status: 'CALLING',
    calledAt,
    callType: 'RECALL',
    callLogs: appendCallLog(active, container, 'RECALL', calledAt),
  });
  addEvent({
    type: 'RECALLED',
    ticketNumber: active.number,
    containerId,
    message: `${active.number} dipanggil ulang ke ${container.name}`,
  });
  persistQueueState();
  return recalled;
}

export function completeTicket(containerId: string) {
  const container = containers.find((item) => item.id === containerId);
  const active = activeFor(containerId);
  if (!container || !active) return null;

  const isVerification = normalizeService(active.service) === normalizeService(QUEUE_SERVICES.verification);

  if (isVerification) {
    // Verifikasi selesai → ticket kembali ke pool menunggu, lalu dipanggil
    // oleh loket Operator yang dibuat admin. Tidak ditandai DONE supaya bisa
    // diambil ulang via callNextTicket pada container ber-service Operator.
    const verifiedAt = nowIso();
    const verified = updateTicket(active.id, {
      status: 'WAITING',
      service: QUEUE_SERVICES.operator,
      verifiedAt,
      verifiedBy: container.name,
      calledAt: undefined,
      calledBy: undefined,
      callType: undefined,
      finishedAt: undefined,
    });
    if (!verified) return null;
    addEvent({
      type: 'DONE',
      ticketNumber: verified.number,
      containerId,
      message: `${verified.number} selesai verifikasi di ${container.name}, menunggu panggilan operator`,
    });
    persistQueueState();
    return verified;
  }

  const completed = finishActiveTicket(containerId);
  if (!completed) return null;

  addEvent({
    type: 'DONE',
    ticketNumber: completed.number,
    containerId,
    message: `${completed.number} selesai dilayani di ${container.name}`,
  });
  persistQueueState();
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
  persistQueueState();
  return skipped;
}

export function resetQueueState() {
  tickets = [];
  events = [];
  counters.clear();
  addEvent({
    type: 'RESUMED',
    message: 'Semua nomor antrean direset oleh admin',
  });
  persistQueueState();
  return getQueueSnapshot();
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
  persistQueueState();
  return container;
}
