# CreditLinker - Financial Intelligence Platform

A Next.js-based financial intelligence platform designed for pharmacy businesses to analyze transaction data and generate Financial Identity Scores (0-100).

## 🎯 Purpose

CreditLinker ingests pharmacy transaction data (CSV/Excel bank statements) and provides:
- **Financial Identity Score** (0-100) based on 5 weighted factors
- **Revenue & Expense Analysis** with trends and patterns
- **Cashflow Insights** including stability and growth metrics
- **Pharmacy-Specific Intelligence** (inventory detection, supplier analysis)

**Note**: This is NOT a lending tool—purely analysis and reporting.

---

## 🛠️ Tech Stack

- **Frontend/Backend**: Next.js 14+ (App Router, TypeScript)
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js (JWT strategy)
- **File Storage**: MinIO (S3-compatible)
- **Caching**: Redis
- **Charts**: Recharts
- **PDF Export**: jsPDF + jsPDF-AutoTable
- **Styling**: Tailwind CSS

---

## 📁 Project Structure

```
/app
  /api               # API routes
    /auth            # NextAuth endpoints
    /upload          # File upload handlers
    /transactions    # Transaction CRUD
    /metrics         # Metrics calculation
    /scores          # Identity score generation
    /reports         # PDF/CSV export
  /dashboard         # Dashboard pages
  /login             # Login page
  /register          # Registration page
  layout.tsx         # Root layout
  page.tsx           # Landing page
  globals.css        # Global styles

/lib
  /auth              # Authentication utilities
  /database          # Prisma client
  /parser            # CSV/Excel parsing
  /categorization    # Transaction categorization
  /metrics           # Metrics calculation engine
  /scoring           # Identity score algorithm
  /pharmacy          # Pharmacy-specific logic
  /storage           # MinIO file storage
  /cache             # Redis caching
  utils.ts           # Shared utilities

/components          # React components
/types               # TypeScript types
/prisma              # Database schema & seeds
/public              # Static assets
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for local development)

### 1. Clone and Install

```bash
cd /home/greene/Documents/Creditlinker
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Generate NextAuth secret:
```bash
openssl rand -base64 32
```

Update `.env` with the generated secret:
```env
NEXTAUTH_SECRET="your-generated-secret-here"
```

### 3. Start Docker Services

```bash
npm run docker:up
```

This starts:
- PostgreSQL (port 5432)
- MinIO (port 9000 API, 9001 Console)
- Redis (port 6379)

### 4. Setup Database

```bash
# Push schema to database
npm run db:push

# Seed test data
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🧪 Test Credentials

After seeding, use these credentials:

- **Email**: test@pharmacy.com
- **Password**: password123
- **Business**: Green Valley Pharmacy

---

## 📊 Database Schema

### Core Models

1. **User** - Authentication and profile
2. **Business** - Pharmacy business details
3. **Import** - File upload tracking
4. **Transaction** - Parsed bank transactions
5. **CalculatedMetrics** - Monthly financial metrics
6. **IdentityScore** - Monthly identity scores (0-100)

### Relationships

```
User (1:N) Business
Business (1:N) Import, CalculatedMetrics, IdentityScore
Import (1:N) Transaction
```

---

## 🔐 Authentication Flow

1. User registers with email/password
2. NextAuth creates JWT session (30-day expiry)
3. Middleware protects `/dashboard/*` routes
4. Session includes `businessId` for data access

---

## 📈 Financial Identity Score Algorithm

**Total Score: 0-100** (Weighted Average)

| Component | Weight | Description |
|-----------|--------|-------------|
| **Positivity** | 30% | Net cashflow vs. revenue ratio |
| **Stability** | 20% | Consistency of income/expenses |
| **Growth** | 20% | Month-over-month revenue trend |
| **Expense Control** | 15% | Expense volatility & categorization |
| **Buffer** | 15% | Average balance vs. monthly expenses |

---

## 🎯 Transaction Categories

- `INCOME` - Revenue from sales
- `EXPENSE_INVENTORY` - Pharmacy stock purchases
- `EXPENSE_OPERATIONAL` - Rent, supplies, etc.
- `EXPENSE_SALARY` - Staff wages
- `EXPENSE_UTILITIES` - Electricity, water
- `EXPENSE_OTHER` - Miscellaneous
- `TRANSFER` - Internal transfers
- `FEE` - Bank charges
- `UNCATEGORIZED` - Pending categorization

---

## 📦 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

npm run db:push      # Push Prisma schema to database
npm run db:migrate   # Create migration
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed test data

npm run docker:up    # Start Docker services
npm run docker:down  # Stop Docker services
```

---

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/signin` - Login
- `POST /api/auth/signout` - Logout

### Uploads
- `POST /api/upload` - Upload CSV/Excel file

### Transactions
- `GET /api/transactions` - List transactions
- `GET /api/transactions/:id` - Get single transaction

### Metrics
- `GET /api/metrics` - Get calculated metrics
- `POST /api/metrics/calculate` - Trigger recalculation

### Scores
- `GET /api/scores` - Get identity scores
- `POST /api/scores/generate` - Generate new score

### Reports
- `GET /api/reports/pdf` - Export PDF report
- `GET /api/reports/csv` - Export CSV transactions

---

## 🔧 Development

### MinIO Console

Access at [http://localhost:9001](http://localhost:9001)
- Username: `creditlink_minio`
- Password: `creditlink_minio_secret_key_2024`

### Prisma Studio

```bash
npm run db:studio
```

Access at [http://localhost:5555](http://localhost:5555)

---

## 🚢 Deployment

### Recommended Stack

- **Frontend/API**: Vercel or Railway
- **Database**: Supabase (PostgreSQL)
- **Storage**: AWS S3 or DigitalOcean Spaces
- **Cache**: Upstash Redis

### Environment Variables

Ensure all `.env` variables are set in production:
- `DATABASE_URL`
- `NEXTAUTH_URL` & `NEXTAUTH_SECRET`
- `MINIO_*` or S3 credentials
- `REDIS_URL`

---

## 📝 License

MIT License - See LICENSE file for details

---

## 👥 Contributors

Built for pharmacy business financial intelligence.

---

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart Docker services
npm run docker:down && npm run docker:up
```

### MinIO Access Denied
- Ensure bucket policy is set (run `db:seed` which initializes MinIO)
- Check MinIO console for bucket permissions

### Redis Connection Failed
```bash
# Test Redis connection
docker exec -it creditlinker-redis redis-cli ping
# Should return: PONG
```

---

For more details, see:
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [API_DOCS.md](./API_DOCS.md) - API reference
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Database details
