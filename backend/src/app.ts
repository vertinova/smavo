import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './modules/auth/auth.routes.js';
import assetRoutes from './modules/asset/asset.routes.js';
import loanRoutes from './modules/asset/loan.routes.js';
import financeRoutes from './modules/finance/finance.routes.js';
import studentRoutes from './modules/admin/student.routes.js';
import teacherRoutes from './modules/admin/teacher.routes.js';
import statsRoutes from './modules/stats/stats.routes.js';
import classRoutes from './modules/admin/class.routes.js';
import letterRoutes from './modules/letter/letter.routes.js';
import userRoutes from './modules/admin/user.routes.js';
import disciplineRoutes from './modules/discipline/discipline.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? 'https://smavo.sch.id'
    : ['http://localhost:3000', 'http://localhost:4000'],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak request, coba lagi nanti' },
});
app.use('/api/auth', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'SMAVO Backend' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/asset-loans', loanRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/letters', letterRoutes);
app.use('/api/users', userRoutes);
app.use('/api/discipline', disciplineRoutes);

// Error handler (must be last)
app.use(errorHandler);

export default app;
