import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ── Prefixes (gelar depan) & suffixes (gelar belakang) to strip ──
const PREFIXES = ['hj.', 'drs.', 'dra.', 'rr.', 'prof.', 'dr.', 'ir.', 'h.', 'kh.'];
const SUFFIXES = [
  'm.pd.', 's.pd.', 's.si.', 's.sos.', 's.kom.', 's.h.', 'm.h.',
  's.pd.i.', 's.hum.', 's.e.', 'm.si.', 'm.m.', 'm.pd', 's.pd',
  's.si', 's.sos', 's.kom', 's.h', 'm.h', 's.pd.i', 's.hum', 's.e',
  'm.si', 'm.m', 'm.sc', 'm.sc.',
];

/**
 * Strip gelar/title from full name, return array of "real" name parts
 * e.g. "Hj. Elis Nurhayati, M.Pd." → ["Elis", "Nurhayati"]
 *      "Drs. Budi Santoso"          → ["Budi", "Santoso"]
 *      "Rebecca"                     → ["Rebecca"]
 */
function extractNameParts(fullName: string): string[] {
  // Remove everything after comma (degrees)
  let name = fullName.split(',')[0].trim();

  let parts = name.split(/\s+/);

  // Remove prefix titles
  parts = parts.filter(p => !PREFIXES.includes(p.toLowerCase()));

  // Remove suffix titles
  parts = parts.filter(p => {
    const lower = p.toLowerCase().replace(/\.$/, '');
    return !SUFFIXES.some(s => {
      const sClean = s.replace(/\.$/, '');
      return lower === sClean || lower === s;
    });
  });

  // Remove standalone dots, single chars, abbreviated initials like "S." "M."
  parts = parts.filter(p => p.length > 1 && p !== '.' && !/^[A-Z]\.$/.test(p));

  return parts;
}

/** Convert string to email-safe lowercase (only a-z, 0-9) */
function toEmailSlug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

async function main() {
  console.log('📧 Script: Update email guru & siswa menggunakan nama depan\n');

  // ── Fetch all GURU and SISWA users with profiles ──
  const users = await prisma.user.findMany({
    where: {
      role: { in: ['GURU', 'SISWA'] },
      isActive: true,
    },
    include: { profile: true },
    orderBy: { role: 'asc' },
  });

  console.log(`Found ${users.length} users (GURU + SISWA)\n`);

  // ── Step 1: Extract first name for each user ──
  type UserEntry = {
    userId: string;
    role: string;
    oldEmail: string;
    fullName: string;
    firstName: string;
    lastName: string;
  };

  const entries: UserEntry[] = [];

  for (const user of users) {
    const fullName = user.profile?.fullName || '';
    if (!fullName) continue;

    const parts = extractNameParts(fullName);
    if (parts.length === 0) continue;

    const firstName = parts[0];
    const lastName = parts.length > 1 ? parts[parts.length - 1] : '';

    entries.push({
      userId: user.id,
      role: user.role,
      oldEmail: user.email,
      fullName,
      firstName,
      lastName,
    });
  }

  // ── Step 2: Detect duplicate first names ──
  const firstNameGroups: Record<string, UserEntry[]> = {};
  for (const entry of entries) {
    const key = toEmailSlug(entry.firstName);
    if (!key) continue;
    if (!firstNameGroups[key]) firstNameGroups[key] = [];
    firstNameGroups[key].push(entry);
  }

  // ── Step 3: Assign unique emails ──
  const usedEmails = new Set<string>();
  const updates: { userId: string; role: string; oldEmail: string; newEmail: string; fullName: string }[] = [];

  // Collect admin/other emails to avoid conflicts
  const existingAdmins = await prisma.user.findMany({
    where: { role: { notIn: ['GURU', 'SISWA'] } },
    select: { email: true },
  });
  for (const a of existingAdmins) usedEmails.add(a.email);

  for (const [firstSlug, group] of Object.entries(firstNameGroups)) {
    if (group.length === 1) {
      // Unique first name → firstname@smavo.sch.id
      const email = `${firstSlug}@smavo.sch.id`;
      if (!usedEmails.has(email)) {
        usedEmails.add(email);
        updates.push({
          userId: group[0].userId,
          role: group[0].role,
          oldEmail: group[0].oldEmail,
          newEmail: email,
          fullName: group[0].fullName,
        });
      } else {
        // Conflict with admin — use firstname.lastname
        const lSlug = toEmailSlug(group[0].lastName);
        let email2 = lSlug ? `${firstSlug}.${lSlug}@smavo.sch.id` : `${firstSlug}1@smavo.sch.id`;
        let c = 2;
        while (usedEmails.has(email2)) {
          email2 = `${firstSlug}.${lSlug || ''}${c}@smavo.sch.id`;
          c++;
        }
        usedEmails.add(email2);
        updates.push({
          userId: group[0].userId,
          role: group[0].role,
          oldEmail: group[0].oldEmail,
          newEmail: email2,
          fullName: group[0].fullName,
        });
      }
    } else {
      // Multiple users with same first name → use firstname.lastname
      for (const entry of group) {
        const lSlug = toEmailSlug(entry.lastName);
        let email = lSlug ? `${firstSlug}.${lSlug}@smavo.sch.id` : `${firstSlug}@smavo.sch.id`;
        let counter = 2;
        while (usedEmails.has(email)) {
          email = `${firstSlug}.${lSlug || ''}${counter}@smavo.sch.id`;
          counter++;
        }
        usedEmails.add(email);
        updates.push({
          userId: entry.userId,
          role: entry.role,
          oldEmail: entry.oldEmail,
          newEmail: email,
          fullName: entry.fullName,
        });
      }
    }
  }

  // ── Step 4: Apply updates ──
  console.log('─── GURU ─────────────────────────────────────');
  let guruCount = 0;
  for (const u of updates.filter(u => u.role === 'GURU')) {
    if (u.oldEmail === u.newEmail) continue;
    console.log(`  ${u.fullName}`);
    console.log(`    ${u.oldEmail}  →  ${u.newEmail}`);
    await prisma.user.update({ where: { id: u.userId }, data: { email: u.newEmail } });
    guruCount++;
  }

  console.log(`\n─── SISWA ────────────────────────────────────`);
  let siswaCount = 0;
  for (const u of updates.filter(u => u.role === 'SISWA')) {
    if (u.oldEmail === u.newEmail) continue;
    console.log(`  ${u.fullName}`);
    console.log(`    ${u.oldEmail}  →  ${u.newEmail}`);
    await prisma.user.update({ where: { id: u.userId }, data: { email: u.newEmail } });
    siswaCount++;
  }

  console.log(`\n✅ Selesai! Updated ${guruCount} guru + ${siswaCount} siswa emails.`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
