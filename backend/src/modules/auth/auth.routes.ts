import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../lib/prisma.js';
import { loginSchema, registerSchema, refreshTokenSchema } from '../../lib/validators.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, authorize, AuthPayload } from '../../middleware/auth.js';
import { AppError, UnauthorizedError } from '../../lib/errors.js';

const router = Router();

function signTokens(payload: AuthPayload) {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: 900, // 15 minutes
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: 604800, // 7 days
  });
  return { accessToken, refreshToken };
}

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Email atau password salah');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedError('Email atau password salah');
    }

    const payload: AuthPayload = { userId: user.id, email: user.email, role: user.role };
    const tokens = signTokens(payload);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          fullName: user.profile?.fullName,
          allowedFeatures: user.allowedFeatures,
        },
        ...tokens,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/register (Admin only)
router.post(
  '/register',
  authenticate,
  authorize('ADMIN'),
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, fullName, role } = req.body;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        throw new AppError('Email sudah terdaftar', 409);
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: role || 'STAF_TU',
          profile: {
            create: { fullName },
          },
        },
        include: { profile: true },
      });

      res.status(201).json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          role: user.role,
          fullName: user.profile?.fullName,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/refresh
router.post('/refresh', validate(refreshTokenSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as AuthPayload;

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || user.refreshToken !== refreshToken) {
      throw new UnauthorizedError('Refresh token tidak valid');
    }

    const payload: AuthPayload = { userId: user.id, email: user.email, role: user.role };
    const tokens = signTokens(payload);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    res.json({ success: true, data: tokens });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { refreshToken: null },
    });
    res.json({ success: true, message: 'Berhasil logout' });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { profile: true },
    });
    if (!user) throw new UnauthorizedError();

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.profile?.fullName,
        avatarUrl: user.profile?.avatarUrl,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
