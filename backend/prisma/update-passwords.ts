import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🔑 Updating passwords for all non-ADMIN accounts to "password"\n');

  const newHash = await bcrypt.hash('password', 12);

  const result = await prisma.user.updateMany({
    where: { role: { not: 'ADMIN' } },
    data: { password: newHash },
  });

  console.log(`✅ Updated ${result.count} accounts.`);
  console.log('   Admin account unchanged (still admin123).');
  console.log('   All other accounts now use password: password');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
