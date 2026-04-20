import 'dotenv/config';
import app from './app.js';
import prisma from './lib/prisma.js';

const PORT = process.env.PORT || 4000;

async function main() {
  // Verify database connection
  await prisma.$connect();
  console.log('📦 Database connected');

  app.listen(PORT, () => {
    console.log(`🚀 SMAVO Backend running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  });
}

main().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
