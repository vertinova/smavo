import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../lib/prisma.js';
import { createTeacherSchema, updateTeacherSchema, paginationSchema } from '../../lib/validators.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { NotFoundError } from '../../lib/errors.js';

const router = Router();

router.use(authenticate);

// GET /api/teachers
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, search, sortBy, sortOrder } = paginationSchema.parse(req.query);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { nip: { contains: search, mode: 'insensitive' } },
        { nuptk: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (req.query.isActive !== undefined) where.isActive = req.query.isActive === 'true';

    const [teachers, total] = await Promise.all([
      prisma.teacher.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy || 'fullName']: sortOrder === 'desc' ? 'desc' : 'asc' },
        include: { homeroomOf: { select: { id: true, name: true } } },
      }),
      prisma.teacher.count({ where }),
    ]);

    res.json({
      success: true,
      data: teachers,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/teachers/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: req.params.id as string },
      include: { homeroomOf: true },
    });
    if (!teacher) throw new NotFoundError('Guru');
    res.json({ success: true, data: teacher });
  } catch (err) {
    next(err);
  }
});

// POST /api/teachers
router.post(
  '/',
  authorize('ADMIN', 'STAF_TU'),
  validate(createTeacherSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = { ...req.body };
      if (data.birthDate) data.birthDate = new Date(data.birthDate);

      const teacher = await prisma.teacher.create({ data });
      res.status(201).json({ success: true, data: teacher });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/teachers/:id
router.patch(
  '/:id',
  authorize('ADMIN', 'STAF_TU'),
  validate(updateTeacherSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const existing = await prisma.teacher.findUnique({ where: { id: req.params.id as string } });
      if (!existing) throw new NotFoundError('Guru');

      const data = { ...req.body };
      if (data.birthDate) data.birthDate = new Date(data.birthDate);

      const teacher = await prisma.teacher.update({ where: { id: req.params.id as string }, data });
      res.json({ success: true, data: teacher });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/teachers/:id (soft)
router.delete(
  '/:id',
  authorize('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const existing = await prisma.teacher.findUnique({ where: { id: req.params.id as string } });
      if (!existing) throw new NotFoundError('Guru');

      await prisma.teacher.update({
        where: { id: req.params.id as string },
        data: { isActive: false },
      });

      res.json({ success: true, message: 'Guru berhasil dinonaktifkan' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
