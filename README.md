# Cast of Minds — Teletherapy Platform

Cast of Minds is a production-grade full-stack teletherapy platform designed for automated clinical matching, private real-time client-therapist communication, automated Stripe subscription billing, and comprehensive administrative oversight.

The system is built around strict clinical privacy boundaries, healthcare compliance patterns, and automated subscription lifecycle management.

Complete Explanation below ⬇⬇⬇ (Understand it )

---

## System Architecture & Features

### 1. Multi-Factor Clinical Matching Engine
* Interactive client onboarding questionnaire scoring therapists across clinical focus areas (anxiety, depression, trauma, relationships), therapy modalities, and personal preferences.
* Deterministic matching algorithm with gender preference handling, secondary tag fallbacks, and real-time therapist capacity checks.

### 2. Role-Based Three-Tier Portals
* **Client Portal:** Private workspace with real-time therapist chat, interactive homework worksheets, reflective mood journal, and monthly session quota tracker (4 sessions per billing cycle).
* **Therapist Workspace:** Clinical caseload management, structured client dossiers, private session notes, worksheet assignments, and live availability scheduling.
* **Admin Management Console:** Real-time MRR and active subscription telemetry, therapist application review/verification pipeline, and client subscription management.

### 3. Real-Time Communication
* Dual-transport bidirectional messaging via **Socket.io** with automatic REST polling fallback.
* Real-time read receipts, typing status, unread notification badges, and optimistic UI message reconciliation.

### 4. Subscription & Billing Lifecycle (Stripe Webhooks)
* Automated recurring monthly billing (€200/mo) integrated via Stripe Webhooks (`checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`).
* **Automated Grace Period & Recovery:** 3-day grace period on payment failure before access restrictions apply.
* **Quiet Resubscription Workflow:** Lapsed clients retain full historical records (messages, worksheets, journal counts) and can reactivate with their original therapist in one click.

---

## Clinical Privacy & Security Engineering

* **Architectural Clinical Isolation:** Therapist private clinical notes (`privateNotes`) are physically isolated at the service and query layers from all Admin endpoints. An administrative user cannot view clinical session notes by design.
* **Defense Against Third-Party Cookie Drops (Safari / WebKit ITP):** Scoped with a unified registrable domain (`castofminds.com` $\leftrightarrow$ `api.castofminds.com`) and `SameSite: 'lax'` configuration, eliminating silent iOS WebKit authentication drops while preventing CSRF logout exploits.
* **Token Lifecycle Security:** 15-minute ephemeral access tokens stored exclusively in browser memory paired with 7-day rotating `httpOnly` refresh cookies stored as cryptographic hashes in MongoDB.
* **Zero PII Observability:** Custom Sentry event scrubbers redact client names, emails, JWT tokens, and request payloads before error traces leave the application boundary.

---

## Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, Redux Toolkit, React Router v7, Framer Motion, Axios |
| **Backend** | Node.js (>=22.12), Express, MongoDB Atlas, Mongoose, Socket.io, Stripe SDK, Resend, Cloudinary |
| **Quality & Security** | Jest, Supertest, MongoDB Memory Server, Sentry, Helmet, BCrypt, Zod |
| **Infrastructure** | Vercel (Frontend), Render (Always-On Backend API), GoDaddy (DNS Management) |

---

## Project Structure

```text
Cast-Of-Mind/
├── client/                     # Frontend Single Page Application
│   ├── src/
│   │   ├── components/         # Shared UI, layout, portal widgets, and modals
│   │   ├── lib/                # API clients, auth interceptors, socket client
│   │   ├── pages/              # Public marketing, auth, and portal route views
│   │   └── store/              # Redux slices (auth, notifications, portal state)
│   └── package.json
│
├── server/                     # Backend REST & WebSocket Server
│   ├── config/                 # Environment validation, database, Sentry, and Stripe
│   ├── constants/              # System-wide enum values, messages, and role definitions
│   ├── controllers/            # Route request handlers and payload normalization
│   ├── middleware/             # Role guards, rate limiters, error & logging pipelines
│   ├── models/                 # Mongoose schemas (User, Subscription, Booking, etc.)
│   ├── routes/                 # Express API route modules (/api/v1/...)
│   ├── services/               # Core business logic (matching, billing, lifecycle)
│   └── scripts/                # Database migrations, maintenance sweeps, and seeds
│
└── docs/                       # Specifications, deployment runbook, and ongoing logs
```

---

## Local Development Quickstart

### Prerequisites
* **Node.js:** `>= 22.12.0`
* **MongoDB:** Local instance or MongoDB Atlas connection string
* **npm:** `>= 10.0.0`

### 1. Setup Backend
```bash
cd server

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Open .env and fill in MONGODB_URI and JWT secrets (generate with openssl rand -hex 32)

# Start development server
npm run dev
```
Backend runs by default at `http://localhost:5000`.

### 2. Setup Frontend
```bash
cd client

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Set VITE_API_BASE_URL=http://localhost:5000/api/v1

# Start development server
npm run dev
```
Frontend runs by default at `http://localhost:5173`.

---

## Automated Test Suite

The platform maintains comprehensive test coverage across access control, payment webhooks, session lifecycles, and cryptographic routines.

```bash
cd server

# Run the complete test suite
npm test
```

* **1,820+ Automated Tests** passing across 67 test suites.
* Powered by `Jest`, `Supertest`, and `mongodb-memory-server` for zero-leakage, transactional database testing.Professional and high quality testing.
