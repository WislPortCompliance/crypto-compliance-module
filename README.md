# CryptoComply — UK FCA Cryptoasset Compliance Platform

Enterprise-grade compliance management for crypto firms seeking UK FCA Cryptoassets Regime 2026 authorisation.

---

## Deploy to Render (Public Demo URL)

### Prerequisites
- [Neon](https://neon.tech) PostgreSQL database (free tier works)
- [Render](https://render.com) account
- This repo pushed to GitHub

### Step 1 — Create Neon Database

1. Log into [neon.tech](https://neon.tech) → **New Project**
2. Name it `crypto-comply`, region **EU West** or **US East**
3. Copy the **Connection string** (pooled) — looks like:
   ```
   postgresql://user:pass@ep-xxx.eu-west-2.aws.neon.tech/neondb?sslmode=require
   ```

### Step 2 — Deploy on Render

**Option A — Blueprint (fastest)**

1. Push this repo to GitHub
2. In Render dashboard: **New → Blueprint**
3. Connect your repo — Render reads `render.yaml` automatically
4. Set the two manual environment variables:
   - `DATABASE_URL` → paste your Neon connection string
   - `NEXTAUTH_URL` → `https://<your-service-name>.onrender.com`
5. Click **Apply** — Render builds, migrates, seeds, and starts

**Option B — Manual web service**

1. Render dashboard → **New → Web Service** → connect repo
2. Configure:
   | Setting | Value |
   |---------|-------|
   | Runtime | Node |
   | Build command | `npm ci && npx prisma generate && npm run build` |
   | Start command | `bash render-start.sh` |
   | Plan | Starter (free) or Standard |
3. Add environment variables:
   - `DATABASE_URL` — your Neon connection string
   - `NEXTAUTH_SECRET` — click **Generate** in Render
   - `NEXTAUTH_URL` — `https://<your-service>.onrender.com`
   - `NODE_ENV` — `production`
4. **Create Web Service**

### Step 3 — Demo login

Once deployed, go to `https://<your-service>.onrender.com` and log in:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@demo.com | Demo2024! |
| Compliance Officer | compliance@demo.com | Demo2024! |
| Risk Manager | risk@demo.com | Demo2024! |
| Auditor | auditor@demo.com | Demo2024! |

---

## Local Development

```bash
# Clone and install
npm install

# Copy env and fill in DATABASE_URL
cp .env.example .env.local
# Edit .env.local with your Neon connection string

# Generate Prisma client, push schema, seed
npx prisma generate
npx prisma db push
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

> **Quick local test without Neon:** You can temporarily switch to SQLite for offline dev:
> 1. In `prisma/schema.prisma` change `provider = "postgresql"` → `provider = "sqlite"`
> 2. In `.env.local` change `DATABASE_URL` → `file:./dev.db`
> 3. Run `npx prisma db push && npm run db:seed`
> 4. Revert before deploying to Render

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 App Router + TypeScript |
| Styling | Tailwind CSS |
| Database | Neon PostgreSQL |
| ORM | Prisma 5 |
| Auth | NextAuth.js v4 (JWT sessions) |
| Deployment | Render (Node runtime) |

---

## Features

| Page | Description |
|------|-------------|
| **Dashboard** | Compliance score gauge, 8-stage FCA pipeline, alerts, actions, activity |
| **FCA Tracker** | Interactive stage checklists — stages 1–3 complete, 4–5 in progress |
| **Controls** | 50 controls across 9 domains, inline status editing, detail panel |
| **Compliance Map** | 15 regulations by jurisdiction with gap analysis |
| **Monitoring** | Alerts, action items, risk register (RAG scoring) |
| **Documents** | Document library, upload, full audit trail |
| **Reports** | 6 report types — all print-to-PDF via browser |
| **Organisation** | Company profile, asset types, team management |
| **Settings** | Org config, users, notifications, integrations |

---

## Demo Organisation

**BlockChain Securities Ltd** — UK crypto exchange  
FCA Ref: FRN 987654 · **Compliance readiness: 67%**

- 50 controls seeded (27 compliant, 10 partial, 4 non-compliant, 9 not assessed)
- FCA application stages 1–3 complete, 4–5 in progress
- 7 regulatory alerts, 8 action items, 6 risk register entries
- 8 demo documents, 15 regulations mapped

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/          # Login page
│   ├── (dashboard)/           # Auth-protected app shell
│   │   ├── layout.tsx          # Session guard + sidebar
│   │   ├── dashboard/          # Main dashboard
│   │   ├── fca-tracker/        # FCA application pipeline
│   │   ├── controls/           # Compliance controls grid
│   │   ├── compliance-map/     # Regulatory landscape
│   │   ├── organisation/       # Org profile + users
│   │   ├── documents/          # Evidence library + audit log
│   │   ├── monitoring/         # Alerts, actions, risks
│   │   ├── reports/            # 6 report types
│   │   └── settings/           # Config + integrations
│   └── api/                    # REST endpoints
├── components/layout/          # Sidebar navigation
└── lib/
    ├── prisma.ts               # Prisma singleton
    ├── auth.ts                 # NextAuth config
    └── utils.ts                # Helpers (status colours, dates, scores)
prisma/
├── schema.prisma               # Full PostgreSQL schema with enums
└── seed.ts                     # 50 controls, 8 stages, 15 regulations, users
render.yaml                     # Render blueprint (one-click deploy)
render-start.sh                 # Startup: migrate → conditional seed → start
```

---

## Re-seeding

If you need to reset the demo data on the deployed instance:

```bash
# Via Render shell (Dashboard → your service → Shell)
npx prisma db push --force-reset
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```
