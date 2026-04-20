import { z } from 'zod';

// Auth
export const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export const registerSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  fullName: z.string().min(2, 'Nama lengkap minimal 2 karakter'),
  role: z.enum(['ADMIN', 'BENDAHARA', 'GURU', 'STAF_TU']).optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

// Asset
export const createAssetSchema = z.object({
  code: z.string().min(1, 'Kode barang wajib diisi'),
  name: z.string().min(1, 'Nama barang wajib diisi'),
  kibType: z.enum(['KIB_B', 'KIB_E']),
  brand: z.string().optional(),
  specification: z.string().optional(),
  acquisitionDate: z.string().datetime().optional(),
  acquisitionCost: z.number().positive().optional(),
  fundSource: z.enum(['BOS_REGULER', 'BOS_KINERJA', 'BOS_AFIRMASI', 'APBD', 'KOMITE', 'LAINNYA']),
  budgetYear: z.number().int().min(2000).max(2100),
  location: z.string().min(1, 'Lokasi wajib diisi'),
  condition: z.enum(['BAIK', 'RUSAK_RINGAN', 'RUSAK_BERAT']).optional(),
  quantity: z.number().int().positive().optional(),
  unit: z.string().optional(),
  notes: z.string().optional(),
});

export const updateAssetSchema = createAssetSchema.partial();

export const createAssetLoanSchema = z.object({
  assetId: z.string().cuid(),
  borrowerId: z.string().cuid(),
  dueDate: z.string().datetime(),
  notes: z.string().optional(),
});

export const returnAssetLoanSchema = z.object({
  returnDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

// Expense
export const createExpenseSchema = z.object({
  rkasItemId: z.string().cuid().optional(),
  invoiceNumber: z.string().optional(),
  description: z.string().min(1),
  amount: z.number().positive(),
  taxType: z.enum(['PPN', 'PPH21', 'PPH22', 'PPH23', 'NONE']).optional(),
  component: z.enum([
    'HONORARIUM', 'PEMELIHARAAN', 'ATK', 'BAHAN_HABIS_PAKAI',
    'DAYA_JASA', 'PERJALANAN_DINAS', 'PENGEMBANGAN_GTK',
    'KEGIATAN_SISWA', 'LANGGANAN', 'LAINNYA',
  ]),
  fundSource: z.enum(['BOS_REGULER', 'BOS_KINERJA', 'BOS_AFIRMASI', 'APBD', 'KOMITE', 'LAINNYA']),
  transactionDate: z.string().datetime(),
  vendor: z.string().optional(),
  notes: z.string().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

// Student
export const createStudentSchema = z.object({
  nisn: z.string().length(10, 'NISN harus 10 digit'),
  nis: z.string().optional(),
  fullName: z.string().min(2),
  gender: z.enum(['LAKI_LAKI', 'PEREMPUAN']),
  birthPlace: z.string().optional(),
  birthDate: z.string().datetime().optional(),
  religion: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  parentName: z.string().optional(),
  parentPhone: z.string().optional(),
  classId: z.string().cuid().optional(),
  entryYear: z.number().int().min(2000).max(2100),
});

export const updateStudentSchema = createStudentSchema.partial();

// Teacher
export const createTeacherSchema = z.object({
  nip: z.string().optional(),
  nuptk: z.string().optional(),
  fullName: z.string().min(2),
  gender: z.enum(['LAKI_LAKI', 'PEREMPUAN']),
  birthPlace: z.string().optional(),
  birthDate: z.string().datetime().optional(),
  subject: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
});

export const updateTeacherSchema = createTeacherSchema.partial();

// Discipline Log
export const createDisciplineLogSchema = z.object({
  studentId: z.string().cuid(),
  date: z.string().datetime(),
  type: z.enum(['TERLAMBAT', 'ATRIBUT', 'PERILAKU']),
  notes: z.string().optional(),
});

export const updateDisciplineLogSchema = createDisciplineLogSchema.partial();

// Pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
