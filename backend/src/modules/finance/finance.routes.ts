import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../lib/prisma.js';
import { createExpenseSchema, updateExpenseSchema, paginationSchema } from '../../lib/validators.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { NotFoundError } from '../../lib/errors.js';
import { calculateTax } from '../../lib/tax.js';

const router = Router();

router.use(authenticate);

// GET /api/finance/rkas
router.get('/rkas', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const includeOpts = {
      items: { include: { _count: { select: { expenses: true } } } },
    };

    const rkas = req.query.year
      ? await prisma.rKAS.findUnique({
          where: { fiscalYear: Number(req.query.year) },
          include: includeOpts,
        })
      : await prisma.rKAS.findFirst({
          orderBy: { fiscalYear: 'desc' },
          include: includeOpts,
        });

    if (!rkas) throw new NotFoundError('RKAS');
    res.json({ success: true, data: rkas });
  } catch (err) {
    next(err);
  }
});

// GET /api/finance/expenses
router.get('/expenses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, search, sortBy, sortOrder } = paginationSchema.parse(req.query);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { vendor: { contains: search, mode: 'insensitive' } },
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (req.query.component) where.component = req.query.component;
    if (req.query.status) where.status = req.query.status;
    if (req.query.fundSource) where.fundSource = req.query.fundSource;

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy || 'transactionDate']: sortOrder },
        include: {
          createdBy: { include: { profile: { select: { fullName: true } } } },
          attachments: true,
        },
      }),
      prisma.expense.count({ where }),
    ]);

    res.json({
      success: true,
      data: expenses,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/finance/expenses
router.post(
  '/expenses',
  authorize('ADMIN', 'BENDAHARA'),
  validate(createExpenseSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { amount, taxType, ...rest } = req.body;
      const tax = calculateTax(amount, taxType || 'NONE');

      const expense = await prisma.expense.create({
        data: {
          ...rest,
          amount,
          taxType: taxType || 'NONE',
          taxAmount: tax.taxAmount,
          totalAmount: tax.totalAmount,
          transactionDate: new Date(rest.transactionDate),
          createdById: req.user!.userId,
        },
      });

      // Update RKAS spent amount if linked
      if (expense.rkasItemId) {
        await prisma.rKASItem.update({
          where: { id: expense.rkasItemId },
          data: { spentAmount: { increment: tax.totalAmount } },
        });
      }

      res.status(201).json({ success: true, data: expense });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/finance/expenses/:id
router.patch(
  '/expenses/:id',
  authorize('ADMIN', 'BENDAHARA'),
  validate(updateExpenseSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const existing = await prisma.expense.findUnique({ where: { id: req.params.id as string } });
      if (!existing) throw new NotFoundError('Pengeluaran');

      const data: any = { ...req.body };
      if (req.body.amount !== undefined) {
        const taxType = req.body.taxType || existing.taxType;
        const tax = calculateTax(req.body.amount, taxType);
        data.taxAmount = tax.taxAmount;
        data.totalAmount = tax.totalAmount;
      }
      if (data.transactionDate) data.transactionDate = new Date(data.transactionDate);

      const expense = await prisma.expense.update({
        where: { id: req.params.id as string },
        data,
      });

      res.json({ success: true, data: expense });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/finance/expenses/:id/approve
router.patch(
  '/expenses/:id/approve',
  authorize('ADMIN', 'BENDAHARA'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const expense = await prisma.expense.update({
        where: { id: req.params.id as string },
        data: { status: 'APPROVED', approvedAt: new Date() },
      });
      res.json({ success: true, data: expense });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/finance/summary
router.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const targetRkas = req.query.year
      ? await prisma.rKAS.findUnique({ where: { fiscalYear: Number(req.query.year) } })
      : await prisma.rKAS.findFirst({ orderBy: { fiscalYear: 'desc' } });
    const year = targetRkas?.fiscalYear ?? new Date().getFullYear();

    const [expensesByComponent, totalExpenses] = await Promise.all([
      prisma.expense.groupBy({
        by: ['component'],
        where: {
          transactionDate: {
            gte: new Date(`${year}-01-01`),
            lte: new Date(`${year}-12-31`),
          },
          status: 'APPROVED',
        },
        _sum: { totalAmount: true },
      }),
      prisma.expense.aggregate({
        where: {
          transactionDate: {
            gte: new Date(`${year}-01-01`),
            lte: new Date(`${year}-12-31`),
          },
          status: 'APPROVED',
        },
        _sum: { totalAmount: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        fiscalYear: year,
        totalBudget: targetRkas?.totalBudget ?? 0,
        totalSpent: totalExpenses._sum.totalAmount ?? 0,
        byComponent: expensesByComponent,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
