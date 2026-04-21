import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  Role,
  Gender,
  KIBType,
  AssetCondition,
  FundSource,
  BOSComponent,
  TaxType,
  ExpenseStatus,
  LoanStatus,
  AttendanceStatus,
  LetterType,
  ViolationType,
} from '../src/generated/prisma/client.js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding SMAVO database...');

  const hashedPassword = await bcrypt.hash('admin123', 12);

  // ─── USERS ───────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@smavo.sch.id' },
    update: {},
    create: {
      email: 'admin@smavo.sch.id',
      password: hashedPassword,
      role: Role.ADMIN,
      profile: { create: { fullName: 'Administrator SMAVO', nip: '000000000000000000', phone: '081200000001' } },
    },
  });

  const bendahara = await prisma.user.upsert({
    where: { email: 'bendahara@smavo.sch.id' },
    update: {},
    create: {
      email: 'bendahara@smavo.sch.id',
      password: hashedPassword,
      role: Role.BENDAHARA,
      profile: { create: { fullName: 'Siti Rahayu, S.Pd', nip: '198501012010012001', phone: '081200000002' } },
    },
  });

  await prisma.user.upsert({
    where: { email: 'guru@smavo.sch.id' },
    update: {},
    create: {
      email: 'guru@smavo.sch.id',
      password: hashedPassword,
      role: Role.GURU,
      profile: { create: { fullName: 'Drs. Budi Santoso', nip: '197203152000031002', phone: '081200000003' } },
    },
  });

  await prisma.user.upsert({
    where: { email: 'tu@smavo.sch.id' },
    update: {},
    create: {
      email: 'tu@smavo.sch.id',
      password: hashedPassword,
      role: Role.STAF_TU,
      profile: { create: { fullName: 'Ahmad Fauzi', nip: '199001052015041001', phone: '081200000004' } },
    },
  });

  // ─── TEACHERS ─────────────────────────────────────────
  const teacherData = [
    { nip: '197001011995121001', nuptk: '4331748650200022', fullName: 'Drs. Agus Setiawan, M.Pd', gender: Gender.LAKI_LAKI, birthPlace: 'Jakarta', birthDate: new Date('1970-01-01'), subject: 'Matematika', phone: '08121000001', email: 'agus@smavo.sch.id' },
    { nip: '197502152000122001', nuptk: '5547753654300042', fullName: 'Dra. Rina Wulandari', gender: Gender.PEREMPUAN, birthPlace: 'Bandung', birthDate: new Date('1975-02-15'), subject: 'Bahasa Indonesia', phone: '08121000002', email: 'rina@smavo.sch.id' },
    { nip: '198003202005011003', nuptk: '6552758658200032', fullName: 'Eko Prasetyo, S.Pd', gender: Gender.LAKI_LAKI, birthPlace: 'Bogor', birthDate: new Date('1980-03-20'), subject: 'Fisika', phone: '08121000003', email: 'eko@smavo.sch.id' },
    { nip: '197810102003122002', nuptk: '3342756662300022', fullName: 'Dewi Anggraini, S.Pd', gender: Gender.PEREMPUAN, birthPlace: 'Depok', birthDate: new Date('1978-10-10'), subject: 'Kimia', phone: '08121000004', email: 'dewi@smavo.sch.id' },
    { nip: '198206152006041001', nuptk: '8947760664200033', fullName: 'Hendra Wijaya, S.Pd', gender: Gender.LAKI_LAKI, birthPlace: 'Bekasi', birthDate: new Date('1982-06-15'), subject: 'Biologi', phone: '08121000005', email: 'hendra@smavo.sch.id' },
    { nip: '197904282002122001', nuptk: '2760757662300042', fullName: 'Sri Lestari, S.Pd', gender: Gender.PEREMPUAN, birthPlace: 'Cibinong', birthDate: new Date('1979-04-28'), subject: 'Bahasa Inggris', phone: '08121000006', email: 'sri@smavo.sch.id' },
    { nip: '198511052010011005', nuptk: '8437763668200023', fullName: 'Ridwan Firmansyah, S.Pd', gender: Gender.LAKI_LAKI, birthPlace: 'Sukabumi', birthDate: new Date('1985-11-05'), subject: 'Sejarah', phone: '08121000007', email: 'ridwan@smavo.sch.id' },
    { nip: '197607182001121001', nuptk: '5050754666200032', fullName: 'Nurul Hidayah, S.Pd', gender: Gender.PEREMPUAN, birthPlace: 'Bogor', birthDate: new Date('1976-07-18'), subject: 'Geografi', phone: '08121000008', email: 'nurul@smavo.sch.id' },
  ];

  const teachers = await Promise.all(
    teacherData.map((t) =>
      prisma.teacher.upsert({
        where: { nip: t.nip },
        update: {},
        create: t,
      })
    )
  );

  // ─── REAL TEACHERS (from CSV) ─────────────────────────
  const realTeacherData = [
    { code: 1,  name: 'Hj. Elis Nurhayati, M.Pd',           subject: 'B. Inggris',            gender: Gender.PEREMPUAN },
    { code: 2,  name: 'Hj. Tintin Sugiharti, S.Pd., M.Pd.', subject: 'Kimia',                 gender: Gender.PEREMPUAN },
    { code: 3,  name: 'Heni Handayani, M.Pd.',               subject: 'B. Indonesia',           gender: Gender.PEREMPUAN },
    { code: 4,  name: 'Rr. Rara Tatra Sudhawati, M.Pd.',     subject: 'Matematika',             gender: Gender.PEREMPUAN },
    { code: 5,  name: 'Ilmia Fathonah, S.Pd., M.Pd.',        subject: 'Sejarah',               gender: Gender.PEREMPUAN },
    { code: 6,  name: 'Dra. Dwi Kartika Rini',               subject: 'Matematika',             gender: Gender.PEREMPUAN },
    { code: 7,  name: 'Hj. Sri Rohayati, M.Pd.',             subject: 'Biologi',               gender: Gender.PEREMPUAN },
    { code: 8,  name: 'Diyah Nursela, S.Pd.',                subject: 'Penjasorkes',            gender: Gender.PEREMPUAN },
    { code: 9,  name: 'Dra. Nani Suryani, M.Pd.',            subject: 'B. Inggris',            gender: Gender.PEREMPUAN },
    { code: 10, name: 'Margaretha S., S.Pd.',                 subject: 'Fisika',                gender: Gender.PEREMPUAN },
    { code: 11, name: 'Dra. Kristiana K., M.Pd.',             subject: 'Biologi',               gender: Gender.PEREMPUAN },
    { code: 12, name: 'Helfy M. Ilfa, S.Pd., M.Pd.',         subject: 'B. Indonesia',           gender: Gender.PEREMPUAN },
    { code: 13, name: 'Dra. Sapmi Rahmawati, M.Pd.',         subject: 'B. Perancis',            gender: Gender.PEREMPUAN },
    { code: 14, name: 'Fadjar Djaja W., S.Pd.',              subject: 'Seni Budaya',            gender: Gender.LAKI_LAKI },
    { code: 15, name: 'Cony Nugraheni, S.Pd.',               subject: 'Biologi',               gender: Gender.PEREMPUAN },
    { code: 16, name: 'Dra. Sumitri, M.Pd.',                 subject: 'Fisika',                gender: Gender.PEREMPUAN },
    { code: 17, name: 'Elita Sari, S.Pd.',                   subject: 'Seni Budaya',            gender: Gender.PEREMPUAN },
    { code: 18, name: 'Hj. Srie Endang Wigati, M.Pd.',       subject: 'B. Inggris',            gender: Gender.PEREMPUAN },
    { code: 19, name: 'Dwi Rokhmiyatun, S.Pd.',              subject: 'PPKn',                  gender: Gender.PEREMPUAN },
    { code: 20, name: 'Dijah Noeringtyas, M.Pd.',            subject: 'B. Inggris',            gender: Gender.PEREMPUAN },
    { code: 21, name: 'Wawan Kurniawan, S.Sos.',             subject: 'Sosiologi',             gender: Gender.LAKI_LAKI },
    { code: 22, name: 'Lina Yudiastuti, S.Si.',              subject: 'Fisika',                gender: Gender.PEREMPUAN },
    { code: 23, name: 'Tatat Rahmalia, S.Pd., M.Pd.',        subject: 'B. Perancis',            gender: Gender.PEREMPUAN },
    { code: 24, name: 'Yanuarita Nur Hanifa, S.Pd.',         subject: 'Sosiologi/Antropologi',  gender: Gender.PEREMPUAN },
    { code: 25, name: 'Teguh Satya Pratama, S.Pd.',          subject: 'Penjasorkes',            gender: Gender.LAKI_LAKI },
    { code: 26, name: 'Ramlan Sulthon, S.Pd.I.',             subject: 'Agama Islam',            gender: Gender.LAKI_LAKI },
    { code: 27, name: 'Rizki, S.Pd.',                        subject: 'Matematika',             gender: Gender.LAKI_LAKI },
    { code: 28, name: 'Ari Aryanto, S.Pd.',                  subject: 'BK',                    gender: Gender.LAKI_LAKI },
    { code: 29, name: 'Ranti Mustika, S.Pd.',                subject: 'Bahasa Inggris',         gender: Gender.PEREMPUAN },
    { code: 30, name: 'Rudi Zaenudin, S.Kom.',               subject: 'Informatika',            gender: Gender.LAKI_LAKI },
    { code: 31, name: 'Artanti, S.Si.',                      subject: 'Biologi/PKWU',           gender: Gender.PEREMPUAN },
    { code: 32, name: 'M. Yusuf, S.Pd.',                     subject: 'Sejarah',               gender: Gender.LAKI_LAKI },
    { code: 33, name: 'Raharjo, S.Pd., M.Pd.',               subject: 'Matematika',             gender: Gender.LAKI_LAKI },
    { code: 34, name: 'Airis Rizkia, S.Pd.',                 subject: 'B. Indonesia',           gender: Gender.PEREMPUAN },
    { code: 35, name: 'Masitoh Noer, S.Pd.',                 subject: 'BK',                    gender: Gender.PEREMPUAN },
    { code: 36, name: 'Nurlaela, S.Si.',                     subject: 'Matematika',             gender: Gender.PEREMPUAN },
    { code: 37, name: 'Muthia Nurhidayah Ashfaar, S.H., M.H.', subject: 'BK',                 gender: Gender.PEREMPUAN },
    { code: 38, name: 'Syamsi Jawawi Wahyudi, S.Pd.',        subject: 'Sejarah',               gender: Gender.LAKI_LAKI },
    { code: 39, name: 'Ichsan, S.Pd.',                       subject: 'Penjasorkes',            gender: Gender.LAKI_LAKI },
    { code: 40, name: 'Mariyana Septi Nugraheni, S.Pd.',     subject: 'BK',                    gender: Gender.PEREMPUAN },
    { code: 41, name: 'Nur Adillawati, M.Pd.',               subject: 'Informatika',            gender: Gender.PEREMPUAN },
    { code: 42, name: 'Dwi Lestari, S.Pd.',                  subject: 'PKWU',                  gender: Gender.PEREMPUAN },
    { code: 43, name: 'Dewi Rahmawati, S.Pd.',               subject: 'B. Indonesia',           gender: Gender.PEREMPUAN },
    { code: 44, name: 'Dini Nurhasanah, S.Pd.',              subject: 'B. Indonesia',           gender: Gender.PEREMPUAN },
    { code: 45, name: 'Imania Bidari, S.Pd.',                subject: 'Matematika',             gender: Gender.PEREMPUAN },
    { code: 46, name: 'Aripudin, S.Pd.',                     subject: 'Penjasorkes',            gender: Gender.LAKI_LAKI },
    { code: 47, name: 'Fatmawati, S.Pd.I.',                  subject: 'Agama Islam',            gender: Gender.PEREMPUAN },
    { code: 48, name: 'Fatasya Kamal, S.Pd.',                subject: 'Kimia/PAI',              gender: Gender.PEREMPUAN },
    { code: 49, name: 'Selly Amalia, M.Pd.',                 subject: 'B. Sunda',              gender: Gender.PEREMPUAN },
    { code: 50, name: 'Rahmalia Dewi',                       subject: 'Geografi',              gender: Gender.PEREMPUAN },
    { code: 51, name: 'Dian Haerunnisa, S.Pd.',              subject: 'PKWU',                  gender: Gender.PEREMPUAN },
    { code: 52, name: 'Ahmad Tirtayasa, M.Pd.',              subject: 'Sosiologi/Informatika',  gender: Gender.LAKI_LAKI },
    { code: 53, name: 'Yanti Kurniati, S.Pd.',               subject: 'PKn',                   gender: Gender.PEREMPUAN },
    { code: 54, name: 'Deden Hasanah, S.E.',                 subject: 'Ekonomi',               gender: Gender.LAKI_LAKI },
    { code: 55, name: 'Eva Fauziah, S.Pd.',                  subject: 'Matematika',             gender: Gender.PEREMPUAN },
    { code: 56, name: 'Neng Santi',                          subject: 'B. Inggris',            gender: Gender.PEREMPUAN },
    { code: 57, name: 'Sari Rahayu Hidayat, S.Pd.',          subject: 'B. Indonesia',           gender: Gender.PEREMPUAN },
    { code: 58, name: 'Muhammad, S.Pd.',                     subject: 'Agama Islam/Biologi',    gender: Gender.LAKI_LAKI },
    { code: 59, name: 'Heri Wibowo, S.Pd.',                  subject: 'Agama Kristen/PKWU',     gender: Gender.LAKI_LAKI },
    { code: 60, name: 'Ai Siti R., S.Hum.',                  subject: 'B. Sunda',              gender: Gender.PEREMPUAN },
    { code: 61, name: 'Rini Candra, S.Pd.',                  subject: 'Ekonomi',               gender: Gender.PEREMPUAN },
    { code: 62, name: 'Rafika, S.Pd.',                       subject: 'PKn',                   gender: Gender.PEREMPUAN },
    { code: 63, name: 'Yunita Eka Refitasari, S.Pd.',        subject: 'BK',                    gender: Gender.PEREMPUAN },
    { code: 64, name: 'Reiska Putri, S.Pd.',                 subject: 'Sosiologi/PKWU',         gender: Gender.PEREMPUAN },
    { code: 65, name: 'Fitria Pelangi',                      subject: 'Kimia',                 gender: Gender.PEREMPUAN },
    { code: 66, name: 'Rebecca',                             subject: 'B. Inggris',            gender: Gender.PEREMPUAN },
  ];

  const realTeachers: any[] = [];
  for (const t of realTeacherData) {
    const syntheticNip = `SMAVO-${String(t.code).padStart(3, '0')}`;
    const teacher = await prisma.teacher.upsert({
      where: { nip: syntheticNip },
      update: { fullName: t.name, subject: t.subject, gender: t.gender },
      create: {
        nip: syntheticNip,
        fullName: t.name,
        subject: t.subject,
        gender: t.gender,
        isActive: true,
      },
    });
    realTeachers.push({ ...teacher, code: t.code });
  }
  console.log(`   Real Teachers: ${realTeachers.length}`);

  // ─── CLASSES ──────────────────────────────────────────
  const classData = [
    { name: 'X-MIPA-1', grade: 10, academicYear: '2025/2026', homeroomId: teachers[0].id },
    { name: 'X-MIPA-2', grade: 10, academicYear: '2025/2026', homeroomId: teachers[1].id },
    { name: 'X-IPS-1',  grade: 10, academicYear: '2025/2026', homeroomId: teachers[2].id },
    { name: 'XI-MIPA-1', grade: 11, academicYear: '2025/2026', homeroomId: teachers[3].id },
    { name: 'XI-MIPA-2', grade: 11, academicYear: '2025/2026', homeroomId: teachers[4].id },
    { name: 'XI-IPS-1',  grade: 11, academicYear: '2025/2026', homeroomId: teachers[5].id },
    { name: 'XII-MIPA-1', grade: 12, academicYear: '2025/2026', homeroomId: teachers[6].id },
    { name: 'XII-IPS-1',  grade: 12, academicYear: '2025/2026', homeroomId: teachers[7].id },
  ];

  const classes = await Promise.all(
    classData.map((c) =>
      prisma.class.upsert({
        where: { name_academicYear: { name: c.name, academicYear: c.academicYear } },
        update: {},
        create: c,
      })
    )
  );

  // ─── STUDENTS ─────────────────────────────────────────
  const firstNames = ['Aldi', 'Bagas', 'Citra', 'Dian', 'Eka', 'Fajar', 'Galuh', 'Hani', 'Indra', 'Joko', 'Kiki', 'Lina', 'Mira', 'Nanda', 'Okta', 'Putri', 'Qori', 'Reza', 'Sari', 'Taufik'];
  const lastNames = ['Pratama', 'Sanjaya', 'Wibowo', 'Kusuma', 'Nugraha', 'Hidayat', 'Setiawan', 'Permana', 'Rahayu', 'Santoso'];

  let nisnCounter = 1000000001;
  let nisCounter = 240001;
  const studentCreates: any[] = [];

  for (let ci = 0; ci < classes.length; ci++) {
    for (let si = 0; si < 20; si++) {
      const fn = firstNames[(ci * 20 + si) % firstNames.length];
      const ln = lastNames[si % lastNames.length];
      const gender: Gender = si % 2 === 0 ? Gender.LAKI_LAKI : Gender.PEREMPUAN;
      studentCreates.push({
        nisn: String(nisnCounter++),
        nis: String(nisCounter++),
        fullName: `${fn} ${ln}`,
        gender,
        birthPlace: 'Bogor',
        birthDate: new Date(`${2007 - (classes[ci].grade - 10)}-0${(si % 9) + 1}-15`),
        religion: 'Islam',
        classId: classes[ci].id,
        entryYear: 2025 - (classes[ci].grade - 10),
        parentName: `Orang Tua ${fn}`,
        parentPhone: `0812${String(nisnCounter).slice(-7)}`,
      });
    }
  }

  for (const s of studentCreates) {
    await prisma.student.upsert({ where: { nisn: s.nisn }, update: {}, create: s });
  }

  // ─── ASSETS ───────────────────────────────────────────
  const assetData = [
    { code: 'KIB-B-001', name: 'Laptop Dell Inspiron 15', kibType: KIBType.KIB_B, brand: 'Dell', specification: 'Intel Core i5, RAM 8GB, SSD 256GB', acquisitionDate: new Date('2022-07-01'), acquisitionCost: 8500000, fundSource: FundSource.BOS_REGULER, budgetYear: 2022, location: 'Lab Komputer', condition: AssetCondition.BAIK, quantity: 30, unit: 'unit' },
    { code: 'KIB-B-002', name: 'Proyektor Epson EB-X41', kibType: KIBType.KIB_B, brand: 'Epson', specification: '3600 Lumens, XGA', acquisitionDate: new Date('2021-08-15'), acquisitionCost: 5200000, fundSource: FundSource.BOS_REGULER, budgetYear: 2021, location: 'Ruang Kelas', condition: AssetCondition.BAIK, quantity: 8, unit: 'unit' },
    { code: 'KIB-B-003', name: 'Printer Canon PIXMA G2010', kibType: KIBType.KIB_B, brand: 'Canon', specification: 'Print/Scan/Copy, Ink Tank', acquisitionDate: new Date('2023-01-10'), acquisitionCost: 1850000, fundSource: FundSource.BOS_KINERJA, budgetYear: 2023, location: 'Ruang TU', condition: AssetCondition.BAIK, quantity: 3, unit: 'unit' },
    { code: 'KIB-B-004', name: 'Meja Guru', kibType: KIBType.KIB_B, brand: '-', specification: 'Kayu jati, 120x60x75 cm', acquisitionDate: new Date('2020-01-01'), acquisitionCost: 750000, fundSource: FundSource.APBD, budgetYear: 2020, location: 'Ruang Guru', condition: AssetCondition.BAIK, quantity: 40, unit: 'buah' },
    { code: 'KIB-B-005', name: 'Kursi Siswa', kibType: KIBType.KIB_B, brand: 'Chitose', specification: 'Plastik + besi, lipat', acquisitionDate: new Date('2021-06-01'), acquisitionCost: 280000, fundSource: FundSource.BOS_REGULER, budgetYear: 2021, location: 'Ruang Kelas', condition: AssetCondition.BAIK, quantity: 320, unit: 'buah' },
    { code: 'KIB-B-006', name: 'AC Split Samsung 1PK', kibType: KIBType.KIB_B, brand: 'Samsung', specification: '1PK, 9000 BTU, Inverter', acquisitionDate: new Date('2022-03-15'), acquisitionCost: 3800000, fundSource: FundSource.BOS_KINERJA, budgetYear: 2022, location: 'Ruang Kepala Sekolah', condition: AssetCondition.BAIK, quantity: 5, unit: 'unit' },
    { code: 'KIB-B-007', name: 'Lemari Arsip Besi', kibType: KIBType.KIB_B, brand: 'Brother', specification: '4 laci, kunci', acquisitionDate: new Date('2019-08-01'), acquisitionCost: 1650000, fundSource: FundSource.APBD, budgetYear: 2019, location: 'Ruang TU', condition: AssetCondition.RUSAK_RINGAN, quantity: 6, unit: 'buah' },
    { code: 'KIB-B-008', name: 'Microphone Wireless TOA', kibType: KIBType.KIB_B, brand: 'TOA', specification: 'UHF, 2 mic handheld', acquisitionDate: new Date('2023-05-20'), acquisitionCost: 2100000, fundSource: FundSource.KOMITE, budgetYear: 2023, location: 'Aula', condition: AssetCondition.BAIK, quantity: 2, unit: 'set' },
    { code: 'KIB-E-001', name: 'Buku Teks Matematika Kelas X', kibType: KIBType.KIB_E, brand: 'Kemendikbud', specification: 'Kurikulum Merdeka 2022, edisi revisi', acquisitionDate: new Date('2022-07-15'), acquisitionCost: 65000, fundSource: FundSource.BOS_REGULER, budgetYear: 2022, location: 'Perpustakaan', condition: AssetCondition.BAIK, quantity: 200, unit: 'eksemplar' },
    { code: 'KIB-E-002', name: 'Buku Teks Bahasa Indonesia Kelas XI', kibType: KIBType.KIB_E, brand: 'Kemendikbud', specification: 'Kurikulum Merdeka 2022', acquisitionDate: new Date('2022-07-15'), acquisitionCost: 65000, fundSource: FundSource.BOS_REGULER, budgetYear: 2022, location: 'Perpustakaan', condition: AssetCondition.BAIK, quantity: 180, unit: 'eksemplar' },
  ];

  const assets = await Promise.all(
    assetData.map((a) =>
      prisma.asset.upsert({
        where: { code: a.code },
        update: {},
        create: { ...a, acquisitionCost: a.acquisitionCost },
      })
    )
  );

  // Maintenance logs
  await prisma.maintenanceLog.createMany({
    skipDuplicates: true,
    data: [
      { assetId: assets[0].id, date: new Date('2024-03-10'), description: 'Servis rutin dan reinstall OS', cost: 150000, vendor: 'CV Teknindo Jaya' },
      { assetId: assets[1].id, date: new Date('2024-01-20'), description: 'Ganti lampu proyektor', cost: 350000, vendor: 'Toko Elektronik Maju' },
      { assetId: assets[6].id, date: new Date('2024-06-05'), description: 'Perbaikan engsel laci', cost: 75000, vendor: 'Tukang Las Pak Udi' },
    ],
  });

  // Asset loans
  await prisma.assetLoan.createMany({
    skipDuplicates: true,
    data: [
      { assetId: assets[1].id, borrowerId: admin.id, borrowDate: new Date('2025-04-01'), dueDate: new Date('2025-04-07'), returnDate: new Date('2025-04-06'), status: LoanStatus.DIKEMBALIKAN, notes: 'Untuk acara rapat dinas' },
      { assetId: assets[7].id, borrowerId: bendahara.id, borrowDate: new Date('2025-04-10'), dueDate: new Date('2025-04-12'), status: LoanStatus.DIPINJAM, notes: 'Untuk acara perpisahan kelas XII' },
    ],
  });

  // ─── RKAS ─────────────────────────────────────────────
  const rkas = await prisma.rKAS.upsert({
    where: { fiscalYear: 2025 },
    update: {},
    create: {
      fiscalYear: 2025,
      title: 'RKAS SMAN 2 Cibinong TA 2025',
      totalBudget: 1200000000,
      approvedAt: new Date('2025-01-15'),
      items: {
        create: [
          { component: BOSComponent.HONORARIUM,        description: 'Honor GTK Non-ASN',                 budgetAmount: 240000000 },
          { component: BOSComponent.PEMELIHARAAN,       description: 'Pemeliharaan Sarana Prasarana',     budgetAmount: 180000000 },
          { component: BOSComponent.ATK,                description: 'Alat Tulis Kantor & Fotokopi',      budgetAmount:  60000000 },
          { component: BOSComponent.KEGIATAN_SISWA,     description: 'Kegiatan Kesiswaan & Ekstrakurikuler', budgetAmount: 120000000 },
          { component: BOSComponent.DAYA_JASA,          description: 'Listrik, Air, Internet',            budgetAmount: 144000000 },
          { component: BOSComponent.BAHAN_HABIS_PAKAI,  description: 'Bahan Habis Pakai Lab & Kelas',     budgetAmount:  90000000 },
          { component: BOSComponent.PENGEMBANGAN_GTK,   description: 'Pelatihan & Workshop Guru',         budgetAmount:  72000000 },
          { component: BOSComponent.PERJALANAN_DINAS,   description: 'Perjalanan Dinas & Supervisi',      budgetAmount:  48000000 },
        ],
      },
    },
  });

  const rkasItems = await prisma.rKASItem.findMany({ where: { rkasId: rkas.id } });
  const itemMap = Object.fromEntries(rkasItems.map((i) => [i.component, i]));

  // ─── EXPENSES ─────────────────────────────────────────
  const expenseData = [
    { rkasItemId: itemMap['HONORARIUM']?.id, invoiceNumber: 'INV/2025/01/001', description: 'Honorarium GTK Non-ASN Januari 2025', amount: 18500000, taxType: TaxType.PPH21, taxAmount: 925000, totalAmount: 19425000, component: BOSComponent.HONORARIUM, fundSource: FundSource.BOS_REGULER, transactionDate: new Date('2025-01-31'), vendor: 'GTK Non-ASN SMAN 2 Cibinong', status: ExpenseStatus.APPROVED, approvedAt: new Date('2025-02-01') },
    { rkasItemId: itemMap['HONORARIUM']?.id, invoiceNumber: 'INV/2025/02/001', description: 'Honorarium GTK Non-ASN Februari 2025', amount: 18500000, taxType: TaxType.PPH21, taxAmount: 925000, totalAmount: 19425000, component: BOSComponent.HONORARIUM, fundSource: FundSource.BOS_REGULER, transactionDate: new Date('2025-02-28'), vendor: 'GTK Non-ASN SMAN 2 Cibinong', status: ExpenseStatus.APPROVED, approvedAt: new Date('2025-03-02') },
    { rkasItemId: itemMap['ATK']?.id, invoiceNumber: 'INV/2025/01/002', description: 'Pembelian ATK Semester Genap 2024/2025', amount: 4250000, taxType: TaxType.PPN, taxAmount: 467500, totalAmount: 4717500, component: BOSComponent.ATK, fundSource: FundSource.BOS_REGULER, transactionDate: new Date('2025-01-10'), vendor: 'UD Sumber Makmur', status: ExpenseStatus.APPROVED, approvedAt: new Date('2025-01-11') },
    { rkasItemId: itemMap['DAYA_JASA']?.id, invoiceNumber: 'INV/2025/01/003', description: 'Tagihan Listrik PLN Januari 2025', amount: 8750000, taxType: TaxType.NONE, taxAmount: 0, totalAmount: 8750000, component: BOSComponent.DAYA_JASA, fundSource: FundSource.BOS_REGULER, transactionDate: new Date('2025-01-20'), vendor: 'PLN', status: ExpenseStatus.APPROVED, approvedAt: new Date('2025-01-20') },
    { rkasItemId: itemMap['DAYA_JASA']?.id, invoiceNumber: 'INV/2025/02/002', description: 'Langganan Internet Fiber Februari 2025', amount: 1500000, taxType: TaxType.PPN, taxAmount: 165000, totalAmount: 1665000, component: BOSComponent.DAYA_JASA, fundSource: FundSource.BOS_REGULER, transactionDate: new Date('2025-02-05'), vendor: 'PT Telkom Indonesia', status: ExpenseStatus.APPROVED, approvedAt: new Date('2025-02-05') },
    { rkasItemId: itemMap['PEMELIHARAAN']?.id, invoiceNumber: 'INV/2025/02/003', description: 'Perbaikan WC dan Saluran Air', amount: 6500000, taxType: TaxType.NONE, taxAmount: 0, totalAmount: 6500000, component: BOSComponent.PEMELIHARAAN, fundSource: FundSource.BOS_REGULER, transactionDate: new Date('2025-02-15'), vendor: 'CV Bangun Rapi', status: ExpenseStatus.APPROVED, approvedAt: new Date('2025-02-16') },
    { rkasItemId: itemMap['KEGIATAN_SISWA']?.id, invoiceNumber: 'INV/2025/03/001', description: 'Study Tour Siswa Kelas XI ke Jogja', amount: 32000000, taxType: TaxType.NONE, taxAmount: 0, totalAmount: 32000000, component: BOSComponent.KEGIATAN_SISWA, fundSource: FundSource.KOMITE, transactionDate: new Date('2025-03-10'), vendor: 'CV Wisata Nusantara', status: ExpenseStatus.APPROVED, approvedAt: new Date('2025-03-12') },
    { rkasItemId: itemMap['PENGEMBANGAN_GTK']?.id, invoiceNumber: 'INV/2025/03/002', description: 'Workshop Implementasi Kurikulum Merdeka', amount: 5500000, taxType: TaxType.PPH23, taxAmount: 110000, totalAmount: 5610000, component: BOSComponent.PENGEMBANGAN_GTK, fundSource: FundSource.BOS_KINERJA, transactionDate: new Date('2025-03-20'), vendor: 'LPMP Jawa Barat', status: ExpenseStatus.APPROVED, approvedAt: new Date('2025-03-21') },
    { rkasItemId: itemMap['ATK']?.id, invoiceNumber: 'INV/2025/04/001', description: 'Kertas HVS A4 80gr 50 rim', amount: 2250000, taxType: TaxType.PPN, taxAmount: 247500, totalAmount: 2497500, component: BOSComponent.ATK, fundSource: FundSource.BOS_REGULER, transactionDate: new Date('2025-04-02'), vendor: 'Toko Kertas Sejahtera', status: ExpenseStatus.PENDING },
    { rkasItemId: itemMap['BAHAN_HABIS_PAKAI']?.id, invoiceNumber: 'INV/2025/04/002', description: 'Bahan Praktikum Kimia Semester Genap', amount: 7800000, taxType: TaxType.PPN, taxAmount: 858000, totalAmount: 8658000, component: BOSComponent.BAHAN_HABIS_PAKAI, fundSource: FundSource.BOS_REGULER, transactionDate: new Date('2025-04-05'), vendor: 'PT Kimia Farma Tbk', status: ExpenseStatus.DRAFT },
  ];

  for (const e of expenseData) {
    const existing = await prisma.expense.findUnique({ where: { invoiceNumber: e.invoiceNumber } });
    if (!existing) {
      await prisma.expense.create({ data: { ...e, createdById: bendahara.id } });
    }
  }

  // Update spentAmount on RKAS items
  for (const item of rkasItems) {
    const spent = await prisma.expense.aggregate({
      where: { rkasItemId: item.id, status: ExpenseStatus.APPROVED },
      _sum: { totalAmount: true },
    });
    await prisma.rKASItem.update({
      where: { id: item.id },
      data: { spentAmount: spent._sum.totalAmount ?? 0 },
    });
  }

  // ─── LETTERS ──────────────────────────────────────────
  const letterData = [
    { letterType: LetterType.SURAT_TUGAS, number: '421.3/001/SMAN2CB/I/2025', subject: 'Surat Tugas Mengikuti Diklat Kurikulum Merdeka', content: 'Menugaskan yang bersangkutan untuk mengikuti Diklat Implementasi Kurikulum Merdeka yang diselenggarakan oleh Dinas Pendidikan Provinsi Jawa Barat.', issuedDate: new Date('2025-01-15'), data: { recipient: 'Drs. Agus Setiawan, M.Pd', nip: '197001011995121001', event: 'Diklat Kurikulum Merdeka', date: '20-22 Januari 2025', location: 'Bandung' } },
    { letterType: LetterType.SURAT_KETERANGAN_AKTIF, number: '421.3/010/SMAN2CB/II/2025', subject: 'Surat Keterangan Masih Aktif Belajar', content: 'Menerangkan bahwa nama yang tersebut di bawah ini benar-benar masih aktif belajar di SMAN 2 Cibinong.', issuedDate: new Date('2025-02-10'), data: { studentName: 'Aldi Pratama', nisn: '1000000001', class: 'X-MIPA-1', academicYear: '2025/2026' } },
    { letterType: LetterType.SURAT_TUGAS, number: '421.3/015/SMAN2CB/II/2025', subject: 'Surat Tugas Pengawas Ujian Akhir Semester', content: 'Menugaskan yang bersangkutan sebagai pengawas Ujian Akhir Semester Genap TA 2024/2025.', issuedDate: new Date('2025-02-20'), data: { recipient: 'Rina Wulandari', nip: '197502152000122001', event: 'Ujian Akhir Semester Genap', date: '3-14 Maret 2025' } },
    { letterType: LetterType.SURAT_KETERANGAN_LULUS, number: '421.3/050/SMAN2CB/IV/2025', subject: 'Surat Keterangan Lulus Sementara', content: 'Menerangkan bahwa siswa yang bersangkutan telah dinyatakan lulus dari SMAN 2 Cibinong.', issuedDate: new Date('2025-04-10'), data: { studentName: 'Taufik Santoso', nisn: '1000000160', class: 'XII-IPS-1', graduationYear: '2025' } },
    { letterType: LetterType.SURAT_IZIN, number: '421.3/055/SMAN2CB/IV/2025', subject: 'Surat Izin Penggunaan Aula untuk Kegiatan Pramuka', content: 'Memberikan izin penggunaan Aula SMAN 2 Cibinong untuk kegiatan Perkemahan Pramuka Penggalang.', issuedDate: new Date('2025-04-15'), data: { event: 'Perkemahan Pramuka Penggalang', date: '19-20 April 2025', location: 'Aula SMAN 2 Cibinong' } },
  ];

  for (const l of letterData) {
    const existing = await prisma.letter.findUnique({ where: { number: l.number } });
    if (!existing) {
      await prisma.letter.create({ data: { ...l, issuedById: admin.id } });
    }
  }

  // ─── ATTENDANCE ───────────────────────────────────────
  const today = new Date('2025-04-14'); // Last Monday
  const attendanceDates = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    return d;
  });

  const allStudents = await prisma.student.findMany({ take: 20 });
  const statusPool: AttendanceStatus[] = [
    AttendanceStatus.HADIR, AttendanceStatus.HADIR, AttendanceStatus.HADIR, AttendanceStatus.HADIR,
    AttendanceStatus.HADIR, AttendanceStatus.HADIR, AttendanceStatus.HADIR, AttendanceStatus.HADIR,
    AttendanceStatus.SAKIT, AttendanceStatus.IZIN, AttendanceStatus.ALPHA,
  ];

  for (const date of attendanceDates) {
    for (const student of allStudents) {
      const status = statusPool[Math.floor(Math.random() * statusPool.length)];
      await prisma.studentAttendance.upsert({
        where: { studentId_date: { studentId: student.id, date } },
        update: {},
        create: { studentId: student.id, date, status },
      });
    }
  }

  for (const date of attendanceDates) {
    for (const teacher of teachers) {
      await prisma.staffAttendance.upsert({
        where: { teacherId_date: { teacherId: teacher.id, date } },
        update: {},
        create: {
          teacherId: teacher.id,
          date,
          checkIn: new Date(date.getTime() + 6.5 * 3600 * 1000),
          checkOut: new Date(date.getTime() + 14 * 3600 * 1000),
          status: AttendanceStatus.HADIR,
        },
      });
    }
  }

  // ─── REAL STUDENTS & DISCIPLINE LOGS (from CSV) ────────
  console.log('📄 Seeding real students from Presensi CSV...');

  // Simple CSV row parser that handles quoted fields
  function parseCSVRow(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  }

  const rootDir = path.resolve(process.cwd(), '..');

  // ── Create 12 real classes (X 1 – X 12) ──
  const realClassNames = Array.from({ length: 12 }, (_, i) => `X ${i + 1}`);
  const realClasses: Record<string, string> = {}; // name -> id

  for (let i = 0; i < realClassNames.length; i++) {
    const cName = realClassNames[i];
    const homeroom = teachers[i % teachers.length];
    const cls = await prisma.class.upsert({
      where: { name_academicYear: { name: cName, academicYear: '2025/2026' } },
      update: {},
      create: { name: cName, grade: 10, academicYear: '2025/2026' },
    });
    realClasses[cName] = cls.id;
  }
  console.log(`   Real Classes: ${Object.keys(realClasses).length}`);

  // ── Parse Presensi CSV for real students ──
  const presensiPath = path.join(rootDir, 'Dicipline Log Kelas X 2025 - Presensi.csv');
  let realStudentCount = 0;
  const studentIdMap: Record<string, string> = {}; // "name|class" -> student.id

  if (fs.existsSync(presensiPath)) {
    const presensiLines = fs.readFileSync(presensiPath, 'utf-8').split('\n');
    // Find header row (starts with "No,NISN,Nama,Kelas")
    let headerIdx = -1;
    for (let i = 0; i < Math.min(20, presensiLines.length); i++) {
      if (presensiLines[i].startsWith('No,NISN,')) { headerIdx = i; break; }
    }

    if (headerIdx >= 0) {
      for (let i = headerIdx + 1; i < presensiLines.length; i++) {
        const cols = parseCSVRow(presensiLines[i].trim());
        const no = cols[0]?.trim();
        const nisn = cols[1]?.trim();
        const fullName = cols[2]?.trim();
        const className = cols[3]?.trim();
        if (!no || !nisn || !fullName || !className) continue;

        // Normalize class name: "X 1" stays, "X  1" -> "X 1"
        const normClass = className.replace(/\s+/g, ' ').trim();
        const classId = realClasses[normClass];
        if (!classId) continue;

        const gender = Gender.LAKI_LAKI; // default, real gender not in CSV
        const nis = `2025${String(i).padStart(4, '0')}`;

        try {
          const student = await prisma.student.upsert({
            where: { nisn },
            update: { fullName, classId },
            create: {
              nisn,
              nis,
              fullName,
              gender,
              birthPlace: 'Bogor',
              birthDate: new Date('2008-01-01'),
              religion: 'Islam',
              classId,
              entryYear: 2025,
              parentName: `Orang Tua ${fullName.split(' ')[0]}`,
              parentPhone: `0812${nisn.slice(-7)}`,
            },
          });
          studentIdMap[`${fullName.toLowerCase()}|${normClass}`] = student.id;
          realStudentCount++;
        } catch {
          // skip duplicates or errors
        }
      }
    }
    console.log(`   Real Students: ${realStudentCount}`);
  } else {
    console.log('   ⚠ Presensi CSV not found, skipping real students');
  }

  // ── Parse Discipline Log CSV ──
  const disciplinePath = path.join(rootDir, 'Dicipline Log Kelas X 2025 - Data Input.csv');
  let disciplineCount = 0;

  if (fs.existsSync(disciplinePath)) {
    console.log('📋 Seeding discipline logs from CSV...');

    // Preload all students with class for matching
    const allRealStudents = await prisma.student.findMany({
      where: { classId: { in: Object.values(realClasses) } },
      include: { class: true },
    });
    const studentLookup: Record<string, string> = {};
    for (const s of allRealStudents) {
      if (s.class) {
        studentLookup[`${s.fullName.toLowerCase()}|${s.class.name}`] = s.id;
      }
    }

    const lines = fs.readFileSync(disciplinePath, 'utf-8').split('\n');
    let lastDate = '';

    // Delete existing discipline logs first to avoid duplicates on re-seed
    await prisma.disciplineLog.deleteMany({});

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVRow(lines[i].trim());
      let dateStr = cols[0]?.trim();
      const name = cols[2]?.trim();
      const className = cols[3]?.trim();
      const typeStr = cols[5]?.trim();
      const notes = cols[6]?.trim();

      if (!name) continue;

      // Normalize class: "X 4 " -> "X 4"
      const normClass = (className || '').replace(/\s+/g, ' ').trim();

      // Use last known date if this row has no date
      if (dateStr) lastDate = dateStr;
      else dateStr = lastDate;

      if (!dateStr) continue;

      // Skip rows without violation type
      if (!typeStr) continue;

      // Parse date (DD/MM/YYYY) — handle "20 /10/2025" (space in date)
      const cleanDate = dateStr.replace(/\s/g, '');
      const dateParts = cleanDate.split('/');
      if (dateParts.length !== 3) continue;
      const [day, month, year] = dateParts.map(Number);
      if (!day || !month || !year) continue;
      const date = new Date(year, month - 1, day);
      if (isNaN(date.getTime())) continue;

      // Map violation type
      const typeMap: Record<string, string> = {
        terlambat: ViolationType.TERLAMBAT,
        atribut: ViolationType.ATRIBUT,
        perilaku: ViolationType.PERILAKU,
      };
      const vType = typeMap[typeStr.toLowerCase()];
      if (!vType) continue;

      // Find student
      const key = `${name.toLowerCase()}|${normClass}`;
      const studentId = studentLookup[key];
      if (!studentId) continue;

      try {
        await prisma.disciplineLog.create({
          data: {
            studentId,
            date,
            type: vType as any,
            notes: notes || null,
          },
        });
        disciplineCount++;
      } catch {
        // skip errors
      }
    }
    console.log(`   Discipline Logs: ${disciplineCount}`);
  } else {
    console.log('   ⚠ Discipline CSV not found, skipping');
  }

  console.log('✅ Seeding completed!');

  // ─── TEACHER ACCOUNTS ──────────────────────────────────
  console.log('👤 Creating teacher accounts...');
  const guruPassword = await bcrypt.hash('guru123', 12);
  let teacherAccountCount = 0;

  for (const t of realTeachers) {
    const email = `guru${t.code}@smavo.sch.id`;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          email,
          password: guruPassword,
          role: Role.GURU,
          allowedFeatures: ['students', 'discipline', 'letters', 'teachers'],
          profile: { create: { fullName: t.fullName, nip: t.nip } },
        },
      });
      teacherAccountCount++;
    }
  }
  console.log(`   Teacher accounts created: ${teacherAccountCount}`);

  // ─── STUDENT ACCOUNTS ──────────────────────────────────
  console.log('🎓 Creating student accounts...');
  const siswaPassword = await bcrypt.hash('siswa123', 12);
  let studentAccountCount = 0;

  const allStudentsForAccounts = await prisma.student.findMany({
    where: { isActive: true },
    select: { id: true, nisn: true, fullName: true },
    take: 750,
  });

  for (const s of allStudentsForAccounts) {
    const email = `siswa.${s.nisn}@smavo.sch.id`;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          email,
          password: siswaPassword,
          role: Role.SISWA,
          allowedFeatures: ['discipline'],
          profile: { create: { fullName: s.fullName } },
        },
      });
      studentAccountCount++;
    }
  }
  console.log(`   Student accounts created: ${studentAccountCount}`);

  console.log(`   Users    : admin, bendahara, guru, tu (password: admin123)`);
  console.log(`   Teachers : ${teachers.length} dummy + ${realTeachers.length} real (password: guru123)`);
  console.log(`   Students : ${studentCreates.length} dummy + ${realStudentCount} real (password: siswa123)`);
  console.log(`   Assets   : ${assets.length}`);
  console.log(`   Expenses : ${expenseData.length}`);
  console.log(`   Letters  : ${letterData.length}`);
  console.log(`   Discipline: ${disciplineCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
