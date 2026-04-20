import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../../lib/prisma.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { AppError, NotFoundError } from '../../lib/errors.js';
import { z } from 'zod';

const router = Router();
router.use(authenticate, authorize('ADMIN'));

const createUserSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  fullName: z.string().min(2, 'Nama lengkap minimal 2 karakter'),
  role: z.enum(['ADMIN', 'BENDAHARA', 'GURU', 'STAF_TU']),
  nip: z.string().optional(),
  phone: z.string().optional(),
});

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  fullName: z.string().min(2).optional(),
  role: z.enum(['ADMIN', 'BENDAHARA', 'GURU', 'STAF_TU']).optional(),
  nip: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
});

const changePasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password minimal 6 karakter'),
});

// GET /api/users
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = req.query.search as string | undefined;
    const role = req.query.role as string | undefined;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { profile: { fullName: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          profile: { select: { fullName: true, nip: true, phone: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: users,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        profile: { select: { fullName: true, nip: true, phone: true, address: true } },
      },
    });
    if (!user) throw new NotFoundError('Pengguna');
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// POST /api/users
router.post('/', validate(createUserSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, fullName, role, nip, phone } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError('Email sudah digunakan', 409);

    if (nip) {
      const nipExists = await prisma.profile.findUnique({ where: { nip } });
      if (nipExists) throw new AppError('NIP sudah digunakan', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        profile: { create: { fullName, nip: nip || null, phone: phone || null } },
      },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        profile: { select: { fullName: true, nip: true, phone: true } },
      },
    });

    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/:id
router.patch('/:id', validate(updateUserSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, fullName, role, nip, phone, isActive } = req.body;

    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError('Pengguna');

    // Prevent deactivating own account
    const authUser = (req as any).user;
    if (authUser.userId === req.params.id && isActive === false) {
      throw new AppError('Tidak dapat menonaktifkan akun sendiri', 400);
    }

    if (email && email !== existing.email) {
      const emailExists = await prisma.user.findUnique({ where: { email } });
      if (emailExists) throw new AppError('Email sudah digunakan', 409);
    }

    if (nip) {
      const nipExists = await prisma.profile.findFirst({
        where: { nip, NOT: { userId: req.params.id } },
      });
      if (nipExists) throw new AppError('NIP sudah digunakan', 409);
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(email && { email }),
        ...(role && { role }),
        ...(isActive !== undefined && { isActive }),
        profile: {
          update: {
            ...(fullName && { fullName }),
            ...(nip !== undefined && { nip: nip || null }),
            ...(phone !== undefined && { phone: phone || null }),
          },
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
        profile: { select: { fullName: true, nip: true, phone: true } },
      },
    });

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/:id/password
router.patch('/:id/password', validate(changePasswordSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError('Pengguna');

    const hashedPassword = await bcrypt.hash(req.body.newPassword, 12);
    await prisma.user.update({
      where: { id: req.params.id },
      data: { password: hashedPassword },
    });

    res.json({ success: true, message: 'Password berhasil diubah' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/:id (soft delete = deactivate)
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError('Pengguna');

    const authUser = (req as any).user;
    if (authUser.userId === req.params.id) {
      throw new AppError('Tidak dapat menghapus akun sendiri', 400);
    }

    await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    res.json({ success: true, message: 'Akun berhasil dinonaktifkan' });
  } catch (err) {
    next(err);
  }
});

export default router;
