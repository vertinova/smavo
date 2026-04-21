import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../lib/prisma.js';
import { createDisciplineLogSchema, updateDisciplineLogSchema, paginationSchema } from '../../lib/validators.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { NotFoundError } from '../../lib/errors.js';

const router = Router();

router.use(authenticate);

// GET /api/discipline
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, search, sortBy, sortOrder } = paginationSchema.parse(req.query);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.student = {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { nisn: { contains: search, mode: 'insensitive' } },
        ],
      };
    }
    if (req.query.type) where.type = req.query.type;
    if (req.query.classId) where.student = { ...where.student, classId: req.query.classId };

    if (req.query.startDate || req.query.endDate) {
      where.date = {};
      if (req.query.startDate) where.date.gte = new Date(req.query.startDate as string);
      if (req.query.endDate) where.date.lte = new Date(req.query.endDate as string);
    }

    const [logs, total] = await Promise.all([
      prisma.disciplineLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy || 'date']: sortOrder === 'asc' ? 'asc' : 'desc' },
        include: {
          student: {
            select: { id: true, nisn: true, fullName: true, class: { select: { id: true, name: true } } },
          },
        },
      }),
      prisma.disciplineLog.count({ where }),
    ]);

    // Attach student total violation count + card status
    const studentIds = [...new Set(logs.map(l => l.studentId))];
    const counts = await prisma.disciplineLog.groupBy({
      by: ['studentId'],
      where: { studentId: { in: studentIds } },
      _count: { id: true },
    });
    const countMap = Object.fromEntries(counts.map(c => [c.studentId, c._count.id]));

    const logsWithCard = logs.map(l => ({
      ...l,
      studentTotalViolations: countMap[l.studentId] ?? 0,
      cardStatus: getCardStatus(countMap[l.studentId] ?? 0),
    }));

    res.json({
      success: true,
      data: logsWithCard,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// Helper: compute card status based on total violations
function getCardStatus(total: number): { card: string; color: string; action: string } | null {
  if (total === 0) return null;
  if (total <= 3) return { card: 'Kartu Hijau', color: 'green', action: 'Pembinaan Wali Kelas' };
  if (total <= 6) return { card: 'Kartu Kuning', color: 'yellow', action: 'Pembinaan Wali Kelas' };
  return { card: 'Kartu Merah', color: 'red', action: 'Pembinaan BK, Wakasek Kesiswaan & Orang Tua' };
}

// GET /api/discipline/me — current logged-in student's violations
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId: string = (req as any).user?.userId ?? '';
    const role: string = (req as any).user?.role ?? '';
    if (role !== 'SISWA') {
      return res.status(403).json({ success: false, message: 'Endpoint ini hanya untuk akun siswa' });
    }

    // Find student by matching profile fullName
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { fullName: true },
    });
    if (!profile) throw new NotFoundError('Profil pengguna tidak ditemukan');

    const student = await prisma.student.findFirst({
      where: { fullName: profile.fullName, isActive: true },
      select: {
        id: true, nisn: true, fullName: true, gender: true, phone: true,
        class: { select: { id: true, name: true } },
      },
    });
    if (!student) throw new NotFoundError('Data siswa tidak ditemukan');

    const logs = await prisma.disciplineLog.findMany({
      where: { studentId: student.id },
      orderBy: { date: 'desc' },
    });

    const byType = await prisma.disciplineLog.groupBy({
      by: ['type'],
      where: { studentId: student.id },
      _count: { id: true },
    });

    const cardStatus = getCardStatus(logs.length);

    res.json({
      success: true,
      data: {
        student,
        logs,
        total: logs.length,
        byType: byType.map(b => ({ type: b.type, count: b._count.id })),
        cardStatus,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/discipline/student/:studentId — all violations for a student
router.get('/student/:studentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.studentId as string },
      select: {
        id: true, nisn: true, fullName: true, gender: true, phone: true,
        class: { select: { id: true, name: true } },
      },
    });
    if (!student) throw new NotFoundError('Siswa tidak ditemukan');

    const logs = await prisma.disciplineLog.findMany({
      where: { studentId: req.params.studentId as string },
      orderBy: { date: 'desc' },
    });

    const byType = await prisma.disciplineLog.groupBy({
      by: ['type'],
      where: { studentId: req.params.studentId as string },
      _count: { id: true },
    });

    const cardStatus = getCardStatus(logs.length);

    res.json({
      success: true,
      data: {
        student,
        logs,
        total: logs.length,
        byType: byType.map(b => ({ type: b.type, count: b._count.id })),
        cardStatus,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/discipline/summary
router.get('/summary', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [byType, byClass, total, recentWeek, thisMonth, lastMonth, totalStudents, todayLogs, todayByType, studentsWithViolations] = await Promise.all([
      prisma.disciplineLog.groupBy({
        by: ['type'],
        _count: { id: true },
      }),
      prisma.$queryRaw`
        SELECT c.name as class, d.type, COUNT(*)::int as count
        FROM discipline_logs d
        JOIN students s ON s.id = d."studentId"
        JOIN classes c ON c.id = s."classId"
        GROUP BY c.name, d.type
        ORDER BY c.name
      ` as Promise<any[]>,
      prisma.disciplineLog.count(),
      prisma.disciplineLog.count({
        where: { date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
      prisma.disciplineLog.count({
        where: { date: { gte: thisMonthStart } },
      }),
      prisma.disciplineLog.count({
        where: { date: { gte: lastMonthStart, lte: lastMonthEnd } },
      }),
      // Total active students
      prisma.student.count({ where: { isActive: true } }),
      // Today's violations with student info
      prisma.disciplineLog.findMany({
        where: { date: { gte: todayStart, lte: todayEnd } },
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            select: { id: true, nisn: true, fullName: true, class: { select: { name: true } } },
          },
        },
      }),
      // Today's violations by type
      prisma.disciplineLog.groupBy({
        by: ['type'],
        where: { date: { gte: todayStart, lte: todayEnd } },
        _count: { id: true },
      }),
      // Unique students who have violations
      prisma.disciplineLog.groupBy({
        by: ['studentId'],
        _count: { id: true },
      }),
    ]);

    // Monthly trend (last 6 months)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const monthlyTrend = await prisma.$queryRaw`
      SELECT
        TO_CHAR(date, 'YYYY-MM') as month,
        COUNT(*)::int as count
      FROM discipline_logs
      WHERE date >= ${sixMonthsAgo}
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY month
    ` as { month: string; count: number }[];

    const topStudents = await prisma.disciplineLog.groupBy({
      by: ['studentId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    const studentIds = topStudents.map(s => s.studentId);
    const students = await prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, nisn: true, fullName: true, class: { select: { name: true } } },
    });

    const topStudentsWithNames = topStudents.map(ts => {
      const student = students.find(s => s.id === ts.studentId);
      return { ...ts, student };
    });

    // Violation breakdown by type for percentage
    const violationsByType: Record<string, number> = {};
    studentsWithViolations.forEach(sv => {
      // We need per-type unique students, but groupBy only gives per-student count
      // Use a simpler approach: count unique students per type
    });

    // Get unique students per violation type
    const studentsPerType = await prisma.$queryRaw`
      SELECT type, COUNT(DISTINCT "studentId")::int as unique_students
      FROM discipline_logs
      GROUP BY type
    ` as { type: string; unique_students: number }[];

    const totalStudentsWithViolations = studentsWithViolations.length;
    const safeStudents = totalStudents - totalStudentsWithViolations;

    res.json({
      success: true,
      data: {
        total,
        recentWeek,
        thisMonth,
        lastMonth,
        byType: byType.map(b => ({ type: b.type, count: b._count.id })),
        byClass,
        topStudents: topStudentsWithNames,
        monthlyTrend,
        // New: today's data
        today: {
          total: todayLogs.length,
          logs: todayLogs,
          byType: todayByType.map(b => ({ type: b.type, count: b._count.id })),
        },
        // New: student percentage stats
        studentStats: {
          totalStudents,
          totalStudentsWithViolations,
          safeStudents,
          violationPercentage: totalStudents > 0 ? Math.round((totalStudentsWithViolations / totalStudents) * 1000) / 10 : 0,
          safePercentage: totalStudents > 0 ? Math.round((safeStudents / totalStudents) * 1000) / 10 : 0,
          byType: studentsPerType,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/discipline
router.post('/', validate(createDisciplineLogSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId, date, type, notes } = req.body;

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundError('Siswa tidak ditemukan');

    const log = await prisma.disciplineLog.create({
      data: { studentId, date: new Date(date), type, notes },
      include: {
        student: {
          select: { id: true, nisn: true, fullName: true, class: { select: { id: true, name: true } } },
        },
      },
    });

    res.status(201).json({ success: true, data: log });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/discipline/:id
router.patch('/:id', validate(updateDisciplineLogSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.disciplineLog.findUnique({ where: { id: req.params.id as string } });
    if (!existing) throw new NotFoundError('Log tidak ditemukan');

    const data: any = { ...req.body };
    if (data.date) data.date = new Date(data.date);

    const log = await prisma.disciplineLog.update({
      where: { id: req.params.id as string },
      data,
      include: {
        student: {
          select: { id: true, nisn: true, fullName: true, class: { select: { id: true, name: true } } },
        },
      },
    });

    res.json({ success: true, data: log });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/discipline/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.disciplineLog.findUnique({ where: { id: req.params.id as string } });
    if (!existing) throw new NotFoundError('Log tidak ditemukan');

    await prisma.disciplineLog.delete({ where: { id: req.params.id as string } });
    res.json({ success: true, message: 'Log berhasil dihapus' });
  } catch (err) {
    next(err);
  }
});

export default router;
