import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const classes = await prisma.class.findMany({
      orderBy: [{ grade: 'asc' }, { name: 'asc' }],
      include: {
        homeroom: { select: { id: true, fullName: true } },
        _count: { select: { students: true } },
      },
    });
    res.json({ success: true, data: classes });
  } catch (err) {
    next(err);
  }
});

export default router;
