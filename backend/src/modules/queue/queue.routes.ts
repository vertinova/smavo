import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../../middleware/auth.js';
import { AppError } from '../../lib/errors.js';
import {
  callNextTicket,
  callCustomTicket,
  callBackTicket,
  completeTicket,
  createQueueTicket,
  getQueueSnapshot,
  isQueueOpen,
  recallTicket,
  resetQueueState,
  setContainerPaused,
  setOfflineMode,
  setQueueOpen,
  skipTicket,
  updateQueueContainers,
} from './queue.store.js';

const router = Router();
const clients = new Set<Response>();

const createTicketSchema = z.object({
  visitorName: z.string().min(2).max(120),
  phoneNumber: z.string().min(8).max(20).regex(/^[0-9+\-\s()]+$/).optional(),
  originSchool: z.string().min(2).max(120).optional(),
  registrationPath: z.string().min(2).max(80).optional(),
  serviceChoice: z.string().min(2).max(80).optional(),
  containerId: z.string().optional(),
});

const updateContainersSchema = z.object({
  containers: z.array(z.object({
    id: z.string().min(1).max(80).optional(),
    name: z.string().min(1).max(80),
    service: z.string().min(1).max(80),
    code: z.string().min(1).max(8).regex(/^[a-zA-Z0-9-]+$/),
    operator: z.string().max(80).optional(),
    isPaused: z.boolean().optional(),
    accent: z.enum(['cyan', 'violet', 'emerald', 'amber', 'rose']).optional(),
  })).min(1).max(50),
});

const updateQueueStatusSchema = z.object({
  isOpen: z.boolean(),
});

const updateOfflineModeSchema = z.object({
  isOfflineMode: z.boolean(),
});

const customCallSchema = z.object({
  queueNumber: z.string().min(1).max(24),
});

function broadcastQueueState() {
  const payload = `data: ${JSON.stringify(getQueueSnapshot())}\n\n`;
  for (const client of clients) {
    client.write(payload);
  }
}

function handleAction(result: unknown, res: Response) {
  if (!result) throw new AppError('Aksi tidak dapat diproses untuk container ini', 400);
  broadcastQueueState();
  res.json({ success: true, data: result, snapshot: getQueueSnapshot() });
}

function getParamId(req: Request) {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : id;
}

router.get('/state', (_req, res) => {
  res.json({ success: true, data: getQueueSnapshot() });
});

router.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  clients.add(res);
  res.write(`data: ${JSON.stringify(getQueueSnapshot())}\n\n`);

  const keepAlive = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 25000);

  req.on('close', () => {
    clearInterval(keepAlive);
    clients.delete(res);
  });
});

router.post('/tickets', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = createTicketSchema.parse(req.body);
    if (!isQueueOpen()) {
      throw new AppError('Antrean sedang ditutup oleh admin. Silakan ambil nomor saat antrean dibuka kembali.', 403);
    }
    const ticket = createQueueTicket(payload);
    broadcastQueueState();
    res.status(201).json({ success: true, data: ticket, snapshot: getQueueSnapshot() });
  } catch (err) {
    next(err);
  }
});

router.post('/status', authenticate, authorize('ADMIN'), (req, res, next) => {
  try {
    const payload = updateQueueStatusSchema.parse(req.body);
    const isOpen = setQueueOpen(payload.isOpen);
    broadcastQueueState();
    res.json({ success: true, data: { isOpen }, snapshot: getQueueSnapshot() });
  } catch (err) {
    next(err);
  }
});

// Toggle offline mode (global across all admin dashboards).
// Saat offline, dashboard menyembunyikan tiket baru yang masuk setelah toggle,
// supaya operator fokus selesaikan backlog. Aksi panggil/lewati/dll tetap jalan via server.
router.post('/mode', authenticate, authorize('ADMIN'), (req, res, next) => {
  try {
    const payload = updateOfflineModeSchema.parse(req.body);
    const result = setOfflineMode(payload.isOfflineMode);
    broadcastQueueState();
    res.json({ success: true, data: result, snapshot: getQueueSnapshot() });
  } catch (err) {
    next(err);
  }
});

router.put('/containers', authenticate, authorize('ADMIN'), (req, res, next) => {
  try {
    const payload = updateContainersSchema.parse(req.body);
    const containers = updateQueueContainers(payload.containers);
    broadcastQueueState();
    res.json({ success: true, data: containers, snapshot: getQueueSnapshot() });
  } catch (err) {
    next(err);
  }
});

router.post('/containers/:id/call', authenticate, authorize('ADMIN', 'STAF_TU'), (req, res, next) => {
  try {
    handleAction(callNextTicket(getParamId(req)), res);
  } catch (err) {
    next(err);
  }
});

router.post('/containers/:id/next', authenticate, authorize('ADMIN', 'STAF_TU'), (req, res, next) => {
  try {
    handleAction(callNextTicket(getParamId(req)), res);
  } catch (err) {
    next(err);
  }
});

router.post('/containers/:id/recall', authenticate, authorize('ADMIN', 'STAF_TU'), (req, res, next) => {
  try {
    handleAction(recallTicket(getParamId(req)), res);
  } catch (err) {
    next(err);
  }
});

router.post('/containers/:id/custom-call', authenticate, authorize('ADMIN', 'STAF_TU'), (req, res, next) => {
  try {
    const payload = customCallSchema.parse(req.body);
    const actor = req.user?.email ?? req.user?.userId;
    const result = callCustomTicket(getParamId(req), payload.queueNumber, actor);
    if (!result.ticket) throw new AppError(result.error || 'Nomor antrean custom tidak dapat dipanggil', 400);
    handleAction(result.ticket, res);
  } catch (err) {
    next(err);
  }
});

// Panggil kembali nomor antrean yang sudah dilewati (SKIPPED).
// Body schema sama dengan custom-call: { queueNumber }.
router.post('/containers/:id/call-back', authenticate, authorize('ADMIN', 'STAF_TU'), (req, res, next) => {
  try {
    const payload = customCallSchema.parse(req.body);
    const actor = req.user?.email ?? req.user?.userId;
    const result = callBackTicket(getParamId(req), payload.queueNumber, actor);
    if (!result.ticket) throw new AppError(result.error || 'Nomor antrean tidak dapat dipanggil kembali', 400);
    handleAction(result.ticket, res);
  } catch (err) {
    next(err);
  }
});

router.post('/containers/:id/done', authenticate, authorize('ADMIN', 'STAF_TU'), (req, res, next) => {
  try {
    handleAction(completeTicket(getParamId(req)), res);
  } catch (err) {
    next(err);
  }
});

router.post('/containers/:id/skip', authenticate, authorize('ADMIN', 'STAF_TU'), (req, res, next) => {
  try {
    handleAction(skipTicket(getParamId(req)), res);
  } catch (err) {
    next(err);
  }
});

router.post('/containers/:id/pause', authenticate, authorize('ADMIN', 'STAF_TU'), (req, res, next) => {
  try {
    handleAction(setContainerPaused(getParamId(req), Boolean(req.body?.paused)), res);
  } catch (err) {
    next(err);
  }
});

router.post('/reset', authenticate, authorize('ADMIN'), (_req, res, next) => {
  try {
    const snapshot = resetQueueState();
    broadcastQueueState();
    res.json({ success: true, snapshot });
  } catch (err) {
    next(err);
  }
});

export default router;
