# 🏫 SMAVO — Sistem Manajemen & Administrasi SMAN 2 Cibinong

Production-ready school administration system focusing on **BOS Fund accountability** and **Asset Management (KIB)**.

---

## 📁 Project Structure

```
smavo/
├── apps/
│   ├── backend/                  # Express + TypeScript API
│   │   ├── prisma/
│   │   │   ├── schema.prisma     # Full database schema
│   │   │   └── seed.ts           # Seed data
│   │   └── src/
│   │       ├── lib/              # Shared utilities
│   │       │   ├── prisma.ts     # Prisma client singleton
│   │       │   ├── validators.ts # Zod validation schemas
│   │       │   ├── tax.ts        # PPN/PPH calculation
│   │       │   ├── qrcode.ts     # QR generation for assets
│   │       │   └── errors.ts     # Custom error classes
│   │       ├── middleware/
│   │       │   ├── auth.ts       # JWT authentication + RBAC
│   │       │   ├── validate.ts   # Zod validation middleware
│   │       │   └── errorHandler.ts
│   │       ├── modules/
│   │       │   ├── auth/         # Login, Register, Refresh, Logout
│   │       │   ├── asset/        # KIB CRUD, QR, Maintenance, Loans
│   │       │   ├── finance/      # RKAS, Expenses, Tax, Summary
│   │       │   └── admin/        # Students & Teachers CRUD
│   │       ├── app.ts            # Express app setup
│   │       └── server.ts         # Entry point
│   └── frontend/                 # Next.js 15 (App Router)
│       └── src/
│           ├── app/
│           │   ├── login/        # Login page
│           │   ├── dashboard/    # Dashboard layout + pages
│           │   │   ├── assets/   # Asset management table
│           │   │   ├── finance/  # BOS finance overview
│           │   │   ├── students/ # Student data table
│           │   │   ├── teachers/ # Teacher data table
│           │   │   └── letters/  # Document generator
│           │   └── layout.tsx    # Root layout
│           └── lib/
│               ├── api.ts        # Axios instance + interceptors
│               └── utils.ts      # Helpers (currency, date, cn)
├── docker-compose.yml
└── package.json                  # Workspace root
```

---

## 🛠 Tech Stack

| Layer      | Technology                               |
|------------|------------------------------------------|
| Backend    | Node.js, Express, TypeScript             |
| Database   | PostgreSQL 16 + Prisma ORM               |
| Frontend   | Next.js 15 (App Router), TailwindCSS     |
| State      | TanStack Query v5                        |
| Auth       | JWT + Refresh Token, RBAC                |
| Validation | Zod                                      |
| Container  | Docker Compose                           |

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- PostgreSQL 16 (or Docker)
- npm

### 1. Clone & Install

```bash
cd smavo
npm install
```

### 2. Setup Environment

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env
# Edit apps/backend/.env with your database credentials and secure JWT secrets

# Frontend
cp apps/frontend/.env.example apps/frontend/.env.local
```

### 3. Setup Database

```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

### 4. Run Development Servers

```bash
# Terminal 1: Backend (port 4000)
npm run dev:backend

# Terminal 2: Frontend (port 3000)
npm run dev:frontend
```

### 5. Login

| Email                    | Password  | Role       |
|--------------------------|-----------|------------|
| admin@smavo.sch.id       | admin123  | Admin      |
| bendahara@smavo.sch.id   | admin123  | Bendahara  |

---

## 🐳 Docker Setup

```bash
# Start all services (PostgreSQL, Backend, Frontend)
docker compose up -d

# Run migrations & seed inside the backend container
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx tsx prisma/seed.ts
```

---

## 📡 API Endpoints

### Auth
| Method | Endpoint            | Access    | Description          |
|--------|---------------------|-----------|----------------------|
| POST   | `/api/auth/login`   | Public    | Login                |
| POST   | `/api/auth/register`| Admin     | Create user          |
| POST   | `/api/auth/refresh` | Public    | Refresh token        |
| POST   | `/api/auth/logout`  | Auth      | Logout               |
| GET    | `/api/auth/me`      | Auth      | Current user profile |

### Assets (KIB)
| Method | Endpoint                      | Access         | Description          |
|--------|-------------------------------|----------------|----------------------|
| GET    | `/api/assets`                 | Auth           | List assets          |
| GET    | `/api/assets/:id`             | Auth           | Asset detail         |
| POST   | `/api/assets`                 | Admin, Staf TU | Create asset         |
| PATCH  | `/api/assets/:id`             | Admin, Staf TU | Update asset         |
| DELETE | `/api/assets/:id`             | Admin          | Soft-delete asset    |
| GET    | `/api/assets/:id/qr`          | Auth           | Generate QR Code     |
| POST   | `/api/assets/:id/maintenance` | Admin, Staf TU | Add maintenance log  |

### Asset Loans
| Method | Endpoint                      | Access         | Description         |
|--------|-------------------------------|----------------|---------------------|
| GET    | `/api/asset-loans`            | Auth           | List loans          |
| POST   | `/api/asset-loans`            | Admin, Staf TU | Create loan         |
| PATCH  | `/api/asset-loans/:id/return` | Admin, Staf TU | Return asset        |

### Finance (BOS)
| Method | Endpoint                         | Access           | Description          |
|--------|----------------------------------|------------------|----------------------|
| GET    | `/api/finance/rkas`              | Auth             | Get RKAS             |
| GET    | `/api/finance/expenses`          | Auth             | List expenses        |
| POST   | `/api/finance/expenses`          | Admin, Bendahara | Create expense       |
| PATCH  | `/api/finance/expenses/:id`      | Admin, Bendahara | Update expense       |
| PATCH  | `/api/finance/expenses/:id/approve` | Admin, Bendahara | Approve expense   |
| GET    | `/api/finance/summary`           | Auth             | Budget summary       |

### Students & Teachers
| Method | Endpoint             | Access         | Description       |
|--------|----------------------|----------------|-------------------|
| GET    | `/api/students`      | Auth           | List students     |
| GET    | `/api/students/:id`  | Auth           | Student detail    |
| POST   | `/api/students`      | Admin, Staf TU | Create student    |
| PATCH  | `/api/students/:id`  | Admin, Staf TU | Update student    |
| DELETE | `/api/students/:id`  | Admin          | Deactivate        |
| GET    | `/api/teachers`      | Auth           | List teachers     |
| GET    | `/api/teachers/:id`  | Auth           | Teacher detail    |
| POST   | `/api/teachers`      | Admin, Staf TU | Create teacher    |
| PATCH  | `/api/teachers/:id`  | Admin, Staf TU | Update teacher    |
| DELETE | `/api/teachers/:id`  | Admin          | Deactivate        |

---

## 🗄 Database Models

- **User / Profile** — Authentication, RBAC (Admin, Bendahara, Guru, Staf TU)
- **Asset** — KIB B (Equipment) & KIB E (Books/Arts), QR codes, fund source tracking
- **MaintenanceLog** — Asset maintenance history
- **AssetLoan** — Borrowing/return tracking
- **RKAS / RKASItem** — Annual school budget plan
- **Expense / ExpenseAttachment** — BOS fund expenditures with tax calculation
- **Student / Class** — Academic structure (Dapodik-compatible)
- **Teacher** — GTK data (NIP, NUPTK)
- **StudentAttendance / StaffAttendance** — Attendance records
- **Letter** — Dynamic document templates

---

## 🎨 UI Theme

- **White** background with **Gold** (`#D4A012`) accents
- Sidebar navigation with dark theme (`#1A1A2E`)
- Professional, clean, responsive design
- Inter font family

---

## 🔒 Security

- Helmet.js for HTTP security headers
- Rate limiting on auth endpoints
- JWT with short-lived access + refresh tokens
- RBAC middleware for role-based access
- Zod validation on all inputs
- Bcrypt password hashing (12 rounds)
- Soft-delete pattern (no data loss)
- CORS restricted by environment

---

## 📜 License

Internal use — SMAN 2 Cibinong
