import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      totalAssets,
      totalStudents,
      totalTeachers,
      totalClasses,
      totalDisciplineLogs,
      latestRkas,
      assetsByCondition,
      recentExpenses,
      recentAssets,
    ] = await Promise.all([
      prisma.asset.count({ where: { isDeleted: false } }),
      prisma.student.count({ where: { isActive: true } }),
      prisma.teacher.count({ where: { isActive: true } }),
      prisma.class.count(),
      prisma.disciplineLog.count(),
      prisma.rKAS.findFirst({
        orderBy: { fiscalYear: 'desc' },
        include: { items: true },
      }),
      prisma.asset.groupBy({
        by: ['condition'],
        where: { isDeleted: false },
        _count: true,
      }),
      prisma.expense.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { include: { profile: { select: { fullName: true } } } },
        },
      }),
      prisma.asset.findMany({
        where: { isDeleted: false },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalBudget = Number(latestRkas?.totalBudget ?? 0);
    const totalSpent = latestRkas?.items?.reduce(
      (sum, item) => sum + Number(item.spentAmount),
      0
    ) ?? 0;

    res.json({
      success: true,
      data: {
        totalAssets,
        totalStudents,
        totalTeachers,
        totalClasses,
        totalDisciplineLogs,
        totalBudget,
        totalSpent,
        fiscalYear: latestRkas?.fiscalYear ?? new Date().getFullYear(),
        assetsByCondition,
        recentExpenses,
        recentAssets,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
