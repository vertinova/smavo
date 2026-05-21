import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../../middleware/auth.js';
import { AppError } from '../../lib/errors.js';
import {
  callNextTicket,
  completeTicket,
  createQueueTicket,
  getQueueSnapshot,
  recallTicket,
  setContainerPaused,
  skipTicket,
} from './queue.store.js';

const router = Router();
const clients = new Set<Response>();

const createTicketSchema = z.object({
  visitorName: z.string().min(2).max(120),
  containerId: z.string().optional(),
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
    const ticket = createQueueTicket(payload.visitorName, payload.containerId);
    broadcastQueueState();
    res.status(201).json({ success: true, data: ticket, snapshot: getQueueSnapshot() });
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

export default router;
