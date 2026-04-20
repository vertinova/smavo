import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../lib/prisma.js';
import { createAssetSchema, updateAssetSchema, paginationSchema } from '../../lib/validators.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { NotFoundError } from '../../lib/errors.js';
import { generateQRCode, buildAssetQRData } from '../../lib/qrcode.js';

const router = Router();

// All routes require auth
router.use(authenticate);

// GET /api/assets
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, search, sortBy, sortOrder } = paginationSchema.parse(req.query);
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by query params
    if (req.query.kibType) where.kibType = req.query.kibType;
    if (req.query.fundSource) where.fundSource = req.query.fundSource;
    if (req.query.condition) where.condition = req.query.condition;
    if (req.query.budgetYear) where.budgetYear = Number(req.query.budgetYear);

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy || 'createdAt']: sortOrder },
      }),
      prisma.asset.count({ where }),
    ]);

    res.json({
      success: true,
      data: assets,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/assets/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: req.params.id, isDeleted: false },
      include: {
        maintenanceLogs: { orderBy: { date: 'desc' }, take: 10 },
        loans: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { borrower: { include: { profile: true } } },
        },
      },
    });

    if (!asset) throw new NotFoundError('Aset');

    res.json({ success: true, data: asset });
  } catch (err) {
    next(err);
  }
});

// POST /api/assets
router.post(
  '/',
  authorize('ADMIN', 'STAF_TU'),
  validate(createAssetSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const asset = await prisma.asset.create({ data: req.body });

      // Generate QR Code
      const qrData = buildAssetQRData(asset);
      const qrCodeUrl = await generateQRCode(qrData);
      const updated = await prisma.asset.update({
        where: { id: asset.id },
        data: { qrCodeUrl },
      });

      res.status(201).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/assets/:id
router.patch(
  '/:id',
  authorize('ADMIN', 'STAF_TU'),
  validate(updateAssetSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const existing = await prisma.asset.findUnique({ where: { id: req.params.id, isDeleted: false } });
      if (!existing) throw new NotFoundError('Aset');

      const asset = await prisma.asset.update({
        where: { id: req.params.id as string },
        data: req.body,
      });

      res.json({ success: true, data: asset });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/assets/:id (soft delete)
router.delete(
  '/:id',
  authorize('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const existing = await prisma.asset.findUnique({ where: { id: req.params.id, isDeleted: false } });
      if (!existing) throw new NotFoundError('Aset');

      await prisma.asset.update({
        where: { id: req.params.id as string },
        data: { isDeleted: true },
      });

      res.json({ success: true, message: 'Aset berhasil dihapus' });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/assets/:id/qr - Regenerate QR Code
router.get('/:id/qr', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const asset = await prisma.asset.findUnique({ where: { id: req.params.id, isDeleted: false } });
    if (!asset) throw new NotFoundError('Aset');

    const qrData = buildAssetQRData(asset);
    const qrCodeUrl = await generateQRCode(qrData);

    await prisma.asset.update({ where: { id: asset.id }, data: { qrCodeUrl } });

    res.json({ success: true, data: { qrCodeUrl } });
  } catch (err) {
    next(err);
  }
});

// POST /api/assets/:id/maintenance
router.post(
  '/:id/maintenance',
  authorize('ADMIN', 'STAF_TU'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const asset = await prisma.asset.findUnique({ where: { id: req.params.id, isDeleted: false } });
      if (!asset) throw new NotFoundError('Aset');

      const log = await prisma.maintenanceLog.create({
        data: {
          assetId: asset.id,
          date: new Date(req.body.date),
          description: req.body.description,
          cost: req.body.cost,
          vendor: req.body.vendor,
        },
      });

      res.status(201).json({ success: true, data: log });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
