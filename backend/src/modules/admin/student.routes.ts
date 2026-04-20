import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../lib/prisma.js';
import { createStudentSchema, updateStudentSchema, paginationSchema } from '../../lib/validators.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { NotFoundError } from '../../lib/errors.js';

const router = Router();

router.use(authenticate);

// GET /api/students
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, search, sortBy, sortOrder } = paginationSchema.parse(req.query);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { nisn: { contains: search, mode: 'insensitive' } },
        { nis: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (req.query.classId) where.classId = req.query.classId;
    if (req.query.isActive !== undefined) where.isActive = req.query.isActive === 'true';

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy || 'fullName']: sortOrder === 'desc' ? 'desc' : 'asc' },
        include: { class: { select: { id: true, name: true, grade: true } } },
      }),
      prisma.student.count({ where }),
    ]);

    res.json({
      success: true,
      data: students,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/students/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id as string },
      include: { class: true },
    });
    if (!student) throw new NotFoundError('Siswa');
    res.json({ success: true, data: student });
  } catch (err) {
    next(err);
  }
});

// POST /api/students
router.post(
  '/',
  authorize('ADMIN', 'STAF_TU'),
  validate(createStudentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = { ...req.body };
      if (data.birthDate) data.birthDate = new Date(data.birthDate);

      const student = await prisma.student.create({ data });
      res.status(201).json({ success: true, data: student });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/students/:id
router.patch(
  '/:id',
  authorize('ADMIN', 'STAF_TU'),
  validate(updateStudentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const existing = await prisma.student.findUnique({ where: { id: req.params.id as string } });
      if (!existing) throw new NotFoundError('Siswa');

      const data = { ...req.body };
      if (data.birthDate) data.birthDate = new Date(data.birthDate);

      const student = await prisma.student.update({ where: { id: req.params.id as string }, data });
      res.json({ success: true, data: student });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/students/:id
router.delete(
  '/:id',
  authorize('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const existing = await prisma.student.findUnique({ where: { id: req.params.id as string } });
      if (!existing) throw new NotFoundError('Siswa');

      await prisma.student.update({
        where: { id: req.params.id as string },
        data: { isActive: false },
      });

      res.json({ success: true, message: 'Siswa berhasil dinonaktifkan' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
