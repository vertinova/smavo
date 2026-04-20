import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../lib/prisma.js';
import { createAssetLoanSchema, returnAssetLoanSchema, paginationSchema } from '../../lib/validators.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { NotFoundError, AppError } from '../../lib/errors.js';

const router = Router();

router.use(authenticate);

// GET /api/asset-loans
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (req.query.status) where.status = req.query.status;

    const [loans, total] = await Promise.all([
      prisma.assetLoan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          asset: { select: { id: true, code: true, name: true, location: true } },
          borrower: { include: { profile: { select: { fullName: true } } } },
        },
      }),
      prisma.assetLoan.count({ where }),
    ]);

    res.json({
      success: true,
      data: loans,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/asset-loans
router.post(
  '/',
  authorize('ADMIN', 'STAF_TU'),
  validate(createAssetLoanSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { assetId, borrowerId, dueDate, notes } = req.body;

      // Check asset exists
      const asset = await prisma.asset.findUnique({ where: { id: assetId, isDeleted: false } });
      if (!asset) throw new NotFoundError('Aset');

      // Check for active loans on this asset
      const activeLoan = await prisma.assetLoan.findFirst({
        where: { assetId, status: 'DIPINJAM' },
      });
      if (activeLoan) throw new AppError('Aset sedang dipinjam', 409);

      const loan = await prisma.assetLoan.create({
        data: {
          assetId,
          borrowerId,
          dueDate: new Date(dueDate),
          notes,
        },
        include: {
          asset: { select: { code: true, name: true } },
          borrower: { include: { profile: { select: { fullName: true } } } },
        },
      });

      res.status(201).json({ success: true, data: loan });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/asset-loans/:id/return
router.patch(
  '/:id/return',
  authorize('ADMIN', 'STAF_TU'),
  validate(returnAssetLoanSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const loan = await prisma.assetLoan.findUnique({ where: { id: req.params.id } });
      if (!loan) throw new NotFoundError('Peminjaman');
      if (loan.status === 'DIKEMBALIKAN') throw new AppError('Aset sudah dikembalikan', 400);

      const returnDate = req.body.returnDate ? new Date(req.body.returnDate) : new Date();

      const updated = await prisma.assetLoan.update({
        where: { id: req.params.id },
        data: {
          returnDate,
          status: 'DIKEMBALIKAN',
          notes: req.body.notes || loan.notes,
        },
      });

      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
