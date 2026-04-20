import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../lib/prisma.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { NotFoundError } from '../../lib/errors.js';
import { paginationSchema } from '../../lib/validators.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (req.query.letterType) where.letterType = req.query.letterType;

    const [letters, total] = await Promise.all([
      prisma.letter.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          issuedBy: { include: { profile: { select: { fullName: true } } } },
        },
      }),
      prisma.letter.count({ where }),
    ]);

    res.json({
      success: true,
      data: letters,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  authorize('ADMIN', 'STAF_TU'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { letterType, number, subject, content, data } = req.body;

      const autoNumber = number ||
        `${String(Date.now()).slice(-4)}/SMAN2/${letterType.replace('SURAT_', '')}/${new Date().getFullYear()}`;

      const letter = await prisma.letter.create({
        data: {
          letterType,
          number: autoNumber,
          subject,
          content,
          data: data || undefined,
          issuedDate: new Date(),
          issuedById: req.user!.userId,
        },
        include: {
          issuedBy: { include: { profile: { select: { fullName: true } } } },
        },
      });

      res.status(201).json({ success: true, data: letter });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/:id',
  authorize('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const existing = await prisma.letter.findUnique({ where: { id: req.params.id as string } });
      if (!existing) throw new NotFoundError('Surat');

      await prisma.letter.delete({ where: { id: req.params.id as string } });
      res.json({ success: true, message: 'Surat berhasil dihapus' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
