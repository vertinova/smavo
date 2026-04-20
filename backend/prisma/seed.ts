import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { Role } from '../src/generated/prisma/client.js';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding SMAVO database...');

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@smavo.sch.id' },
    update: {},
    create: {
      email: 'admin@smavo.sch.id',
      password: hashedPassword,
      role: Role.ADMIN,
      profile: {
        create: {
          fullName: 'Administrator SMAVO',
          nip: '000000000000000000',
        },
      },
    },
  });

  const bendahara = await prisma.user.upsert({
    where: { email: 'bendahara@smavo.sch.id' },
    update: {},
    create: {
      email: 'bendahara@smavo.sch.id',
      password: hashedPassword,
      role: Role.BENDAHARA,
      profile: {
        create: {
          fullName: 'Bendahara BOS',
          nip: '198501012010012001',
        },
      },
    },
  });

  // Create sample classes
  const classes = await Promise.all([
    prisma.class.upsert({
      where: { name_academicYear: { name: 'X-MIPA-1', academicYear: '2025/2026' } },
      update: {},
      create: { name: 'X-MIPA-1', grade: 10, academicYear: '2025/2026' },
    }),
    prisma.class.upsert({
      where: { name_academicYear: { name: 'XI-MIPA-1', academicYear: '2025/2026' } },
      update: {},
      create: { name: 'XI-MIPA-1', grade: 11, academicYear: '2025/2026' },
    }),
    prisma.class.upsert({
      where: { name_academicYear: { name: 'XII-MIPA-1', academicYear: '2025/2026' } },
      update: {},
      create: { name: 'XII-MIPA-1', grade: 12, academicYear: '2025/2026' },
    }),
  ]);

  // Create sample RKAS
  await prisma.rKAS.upsert({
    where: { fiscalYear: 2025 },
    update: {},
    create: {
      fiscalYear: 2025,
      title: 'RKAS SMAN 2 Cibinong TA 2025',
      totalBudget: 900000000,
      approvedAt: new Date('2025-01-15'),
      items: {
        create: [
          { component: 'HONORARIUM', description: 'Honor GTK Non-ASN', budgetAmount: 200000000 },
          { component: 'PEMELIHARAAN', description: 'Pemeliharaan Sarana Prasarana', budgetAmount: 150000000 },
          { component: 'ATK', description: 'Alat Tulis Kantor', budgetAmount: 50000000 },
          { component: 'KEGIATAN_SISWA', description: 'Kegiatan Kesiswaan', budgetAmount: 100000000 },
          { component: 'DAYA_JASA', description: 'Listrik, Air, Internet', budgetAmount: 120000000 },
        ],
      },
    },
  });

  console.log('✅ Seeding completed.');
  console.log(`   Admin: ${admin.email}`);
  console.log(`   Bendahara: ${bendahara.email}`);
  console.log(`   Classes: ${classes.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
