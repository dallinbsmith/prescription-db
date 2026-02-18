# ARCHITECT_NOTES.md — Prescription Drug Reference Database

> **Status:** Draft — Awaiting Approval
> **Last Updated:** 2026-02-17

---

## 1. Project Overview

Internal multi-user research tool for a licensed pharmacy exploring online sales and compounding operations. The app allows the team to search, filter, and discuss prescription drugs (human + veterinary) to determine what can be sold/distributed online, including compounding opportunities.

**This is NOT a customer-facing e-commerce platform.** It's an internal decision-support tool.

---

## 2. Goals

- Searchable database of FDA-approved drugs (human and veterinary)
- Classification by regulatory status: Rx-only, OTC, controlled substance schedule
- Multi-user collaborative notes/discussions attached to drugs
- Scrape competitor pharmacy sites to analyze their offerings and approaches
- Simple deployment for internal team use

## 3. Non-Goals

- Customer-facing storefront
- E-commerce / payment processing
- Prescription management or patient data
- Mobile app (web-only for now)
- High availability / scaling infrastructure

---

## 4. Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials
npm install
npm run migrate
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Import FDA Data
```bash
# Download NDC Directory from FDA
# Extract product.txt to data/
cd scripts
npx tsx import-fda-data.ts
```

### Default Admin Account
- Email: admin@pharmacy.local
- Password: admin123 (CHANGE IN PRODUCTION)

---

## 5. Project Structure

```
prescription-db/
├── backend/
│   ├── src/
│   │   ├── api/           # REST endpoints
│   │   ├── scrapers/      # Per-site scraper modules
│   │   ├── services/      # Business logic
│   │   ├── models/        # Database models
│   │   └── config/        # Configuration
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── features/      # Feature modules
│   │   │   ├── core/          # Services, guards, interceptors
│   │   │   └── shared/        # Common components
│   │   └── environments/
│   └── angular.json
├── database/
│   └── migrations/
├── scripts/
│   └── import-fda-data.ts
└── ARCHITECT_NOTES.md
```

---

## 6. API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Drugs
- `GET /api/drugs` - Search drugs (query params: search, rx_otc, dea_schedule, species, dosage_form, limit, offset)
- `GET /api/drugs/:id` - Get drug by ID
- `GET /api/drugs/ndc/:ndc` - Get drug by NDC
- `GET /api/drugs/filters/:field` - Get distinct filter values

### Users (Admin only)
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Discussions
- `GET /api/discussions/drug/:drugId` - Get discussions for drug
- `POST /api/discussions` - Create discussion
- `PATCH /api/discussions/:id` - Update discussion
- `DELETE /api/discussions/:id` - Delete discussion

### Competitors
- `GET /api/competitors` - List competitors
- `GET /api/competitors/drugs` - Get competitor drugs
- `GET /api/competitors/scrapers` - List available scrapers
- `POST /api/competitors/scrape/:competitor` - Run scraper (Admin)

### State Regulations
- `GET /api/state-regulations` - List all
- `GET /api/state-regulations/state/:code` - Get by state
- `POST /api/state-regulations` - Create (Admin)
- `PATCH /api/state-regulations/:id` - Update (Admin)
- `DELETE /api/state-regulations/:id` - Delete (Admin)

### Compounding
- `GET /api/compounding/ingredients` - Search ingredients
- `GET /api/compounding/formulas` - Search formulas
- `GET /api/compounding/formulas/:id` - Get formula with ingredients
- `GET /api/compounding/regulations` - List regulations

---

## 7. Database Schema

See `database/migrations/00001_initial_schema.sql` for complete schema.

### Core Tables
- `drugs` - FDA drug database
- `users` - User accounts
- `discussions` - Threaded comments on drugs
- `state_regulations` - State-specific regulations
- `competitor_drugs` - Scraped competitor data
- `scrape_logs` - Scraper run history

### Compounding Tables
- `bulk_ingredients` - 503A/503B ingredients
- `compounding_formulas` - Formula definitions
- `formula_ingredients` - Formula ingredient junction
- `compounding_regulations` - Compounding regulations

---

## 8. Deployment

Recommended: Railway or Render

```bash
# Build frontend
cd frontend && npm run build

# Build backend
cd backend && npm run build

# Start production server
cd backend && npm start
```

Environment variables needed:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `NODE_ENV=production`

---

## 9. Remaining Work

- [ ] Test all API endpoints
- [ ] Add more competitor scrapers
- [ ] Implement data export (CSV, PDF)
- [ ] Add dashboard with summary stats
- [ ] Set up CI/CD pipeline
