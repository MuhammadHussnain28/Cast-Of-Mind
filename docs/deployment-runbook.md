# Production Deployment Runbook — Cast of Minds

This runbook is the official, definitive, single-source operational manual for deploying, configuring, verifying, and maintaining the **Cast of Minds** production platform.

---

## 1. Production Architecture & Infrastructure Map

| Layer | Provider | Tier / Cost | Production Domain / Target |
| :--- | :--- | :--- | :--- |
| **Frontend** | Vercel | Hobby ($0/mo) | `https://castofminds.com` (and `www.castofminds.com`) |
| **Backend API** | Render | Starter ($7/mo — Always-On) | `https://api.castofminds.com` |
| **Database** | MongoDB Atlas | M0 Free Tier (Initial Launch) | Dedicated database: `castofminds_prod` |
| **DNS Registrar** | GoDaddy | Standard Domain Registration | Root domain: `castofminds.com` |
| **Payments** | Stripe | Live Mode (EUR €) | Webhook: `https://api.castofminds.com/api/v1/webhooks/payment` |
| **Transactional Email** | Resend | Free Tier (3,000 emails/mo) | Sender: `Cast of Minds <noreply@castofminds.com>` |
| **Media / File Storage** | Cloudinary | Free Tier (25 GB credits/mo) | Therapist certificates & profile portraits |
| **Observability** | Sentry | Free Developer Tier | Projects: `cast-of-minds-server` & `cast-of-minds-client` |

---

## 2. Phase 1: Sitting Next to Asad — Stripe Live Setup & Credentials Handover

Perform these steps directly on Asad's computer logged into his Stripe dashboard (`https://dashboard.stripe.com`):

### Step 1: Account Isolation Check
1. Open [dashboard.stripe.com](https://dashboard.stripe.com).
2. Look at the **Top-Left Corner** dropdown menu:
   - Check if an account named **"Cast-Of-Minds"** (or Cast of Mind) exists.
   - If it exists: Click it to select it.
   - If it does NOT exist: Click **"+ Create account"** (or "+ New account"), name it **Cast-Of-Minds**, select currency (**EUR €**), and complete creation.
3. **Verify:** Confirm that the top-left corner clearly shows **"Cast-Of-Minds"**. Everything you configure applies ONLY to this business.

### Step 2: Switch to Live Mode
1. Look at the **Top-Right navigation bar** for the **"Test mode"** toggle.
2. Ensure the toggle is switched **OFF** (Live mode).
   - *Note: If an orange banner says "Test mode", click the toggle to turn it off so you are working with real live credentials.*

### Step 3: Copy the Live Secret Key
1. In the top-right menu (or left navigation), click **Developers**.
2. Click on the **API keys** tab.
3. Under the **Standard keys** table, locate **Secret key**.
4. Click **Reveal live key token** (Asad will receive a phone 2FA code).
5. Copy the key (starts with `sk_live_...`).
6. **Store as:** `STRIPE_SECRET_KEY`.

### Step 4: Account Settings Toggles (Chunk 11.2 / 11.3 Compliance)
1. Click the **Settings (⚙️) gear icon** in the top-right navigation.
2. Under **Billing**, click **Customer portal**:
   - Turn **ON**: *"Allow customers to update payment methods"* (lets patients update expired cards).
   - Turn **OFF**: *"Allow customers to cancel subscriptions"* (cancellation is handled inside our portal to enforce therapeutic boundaries and notice periods).
   - Click **Save changes**.
3. Under **Billing**, click **Revenue recovery**:
   - Set Smart Retries / retry schedule to end within **3 days** (aligns with the 3-day grace period in our code).
   - Click **Save**.
4. Under **Billing**, click **Customer emails**:
   - Turn **OFF**: *"Send upcoming renewal emails"* (our backend sends its own branded reminder email via Resend; turning this off prevents the patient from receiving duplicate emails).
   - Click **Save**.

> [!NOTE]
> **Why is Webhook creation deferred?** We do NOT create the webhook endpoint yet. We will deploy the Render backend and verify `https://api.castofminds.com/api/v1/health` first (Phase 4). Once the domain is 100% verified, we create the webhook with zero risk of URL mismatch.

---

## 3. Phase 2: Deploy Backend on Render (Placeholder Strategy)

### A. Web Service Creation
1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** $\rightarrow$ **Web Service**.
3. Connect your GitHub repository: `MuhammadHussnain28/Cast-Of-Mind`.
4. Configure service basics:
   - **Name:** `cast-of-minds-api-prod`
   - **Region:** Frankfurt (EU Central) *(Matches EU data protection requirements)*
   - **Branch:** `main`
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Instance Type:** **Starter ($7/month)** *(Crucial: keeps server always-on with zero cold-starts)*

### B. Add Custom Domain on Render
1. Inside the service dashboard, click **Settings** in the left sidebar.
2. Scroll to **Custom Domains** $\rightarrow$ Click **Add Custom Domain**.
3. Enter: `api.castofminds.com` $\rightarrow$ Click **Save**.
4. Note the DNS target shown by Render (e.g., `cast-of-minds-api-prod.onrender.com`).

### C. Backend Production Environment Variables (20 Variables)
In Render $\rightarrow$ **Environment** $\rightarrow$ Click **Edit**, configure these exact keys:

| Key | Value / Source | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enforces HTTPS cookies, security headers & disables test routes |
| `NODE_VERSION` | `22.12.0` | Locks the exact Node LTS runtime version |
| `PORT` | `5000` *(or `10000`)* | Backend internal listening port |
| `CLIENT_ORIGIN` | `https://castofminds.com` | Allowed CORS origin for production frontend |
| `COOKIE_SAMESITE` | `lax` | Enables cross-subdomain authentication cookies |
| `MONGODB_URI` | `mongodb+srv://<user>:<password>@cluster0.xxx.mongodb.net/castofminds_prod?retryWrites=true&w=majority` | Dedicated production MongoDB Atlas replica set |
| `JWT_ACCESS_SECRET` | *(64-hex string from `openssl rand -hex 32`)* | Signs 15-minute access tokens |
| `JWT_REFRESH_SECRET` | *(Different 64-hex string from `openssl rand -hex 32`)* | Signs 7-day refresh tokens (must differ from access) |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Live Stripe API secret key obtained from Asad |
| `STRIPE_WEBHOOK_SECRET` | `whsec_placeholder` | Temporary placeholder to allow boot while awaiting DNS |
| `RESEND_API_KEY` | `re_...` | Resend production API key |
| `EMAIL_FROM` | `Cast of Minds <noreply@castofminds.com>` | Verified sender address on Resend |
| `CONTACT_TO` | `contact@castofminds.com` | Recipient inbox for contact form submissions |
| `EMAIL_LOGO_URL` | `https://res.cloudinary.com/.../cast-of-mind-logo.png` | Public CDN URL for email header logo |
| `CLOUDINARY_CLOUD_NAME` | `...` | Cloudinary account cloud name |
| `CLOUDINARY_API_KEY` | `...` | Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | `...` | Cloudinary API Secret |
| `SENTRY_DSN` | `https://...@...ingest.sentry.io/...` | Sentry backend DSN |
| `SENTRY_ENVIRONMENT` | `production` | Marks server errors as production |
| `LOG_LEVEL` | `info` | Production structured JSON logging |

> [!CAUTION]
> **DO NOT include `ALLOW_TEST_STRIPE` in production.** The backend code checks `ALLOW_TEST_STRIPE`. In production, this variable must be completely deleted from Render so that test cards can never be used.

---

## 4. Phase 3: GoDaddy DNS Configuration (Audited & Safe)

Log in to **GoDaddy** $\rightarrow$ **Domain Portfolio** $\rightarrow$ **castofminds.com** $\rightarrow$ **Manage DNS**.

### Step 1: Forwarding Tab (CRITICAL FIX)
1. Click the **Forwarding** tab.
2. Locate the existing forwarder: `castofminds.com` $\rightarrow$ `https://www.instagram.com/thecastofmind/` (301 Permanent).
3. **DELETE THIS FORWARDER.**
   > *Why? If left active, GoDaddy's redirect servers intercept all traffic to `castofminds.com` and bounce visitors to Instagram instead of Vercel!*

### Step 2: Delete Old A Records
In the **DNS Records** table, locate and **DELETE** the two default A records pointing to:
- `15.197.x.x`
- `3.33.x.x`
*(These are GoDaddy's forwarding proxy IPs).*

### Step 3: Add / Update Production DNS Records

| Type | Name (Host) | Value (Target) | TTL | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **A** | `@` | `76.76.21.21` | 1 Hour | Routes apex domain `castofminds.com` to Vercel |
| **CNAME** | `www` | `cname.vercel-dns.com` | 1 Hour | Routes `www.castofminds.com` to Vercel |
| **CNAME** | `api` | `cast-of-minds-api-prod.onrender.com` | 1 Hour | Routes `api.castofminds.com` to Render API |

### Step 4: Protected Records (DO NOT TOUCH — KEEP AS-IS)

> [!WARNING]
> **UNDER NO CIRCUMSTANCES DELETE OR MODIFY THESE RECORDS:**
> - `MX` records: `smtp.secureserver.net` (Priority 0) and `mailstore1.secureserver.net` (Priority 10)
> - `CNAME` record: `email` $\rightarrow$ `email.secureserver.net`
> - `SRV` record: `_autodiscover._tcp.@`
> 
> *These records power Asad's official business email (`asad@castofminds.com`). Deleting them will crash his entire inbox.*

### Step 5: Email Verification Status (Resend)
- The `TXT` record `resend._domainkey` (`p=MIGfMA0G...`) is **already present** in your GoDaddy DNS.
- Log in to [resend.com](https://resend.com) $\rightarrow$ **Domains** $\rightarrow$ `castofminds.com` and verify that Status displays green **Verified**.

---

## 5. Phase 4: API Health Verification & Stripe Webhook Setup

### Step 1: Verify Live Backend
Once Render finishes deploying and DNS propagates (usually 2–5 minutes), open your browser or terminal and test:
```bash
curl -i https://api.castofminds.com/api/v1/health
```
**Expected Response:** `HTTP/1.1 200 OK` with JSON:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

### Step 2: Create Webhook Endpoint in Stripe
Now that the custom domain is 100% verified, go to Asad's Stripe Dashboard:
1. In **Developers**, click the **Webhooks** tab $\rightarrow$ Click **+ Add endpoint**.
2. **Endpoint URL:** `https://api.castofminds.com/api/v1/webhooks/payment`
3. Click **+ Select events** and check these **exact 5 events**:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
   *(Note: `customer.subscription.created` is omitted intentionally; initial subscriptions are handled by `checkout.session.completed`).*
4. Click **Add endpoint**.
5. On the summary page, locate **Signing secret** on the right side $\rightarrow$ Click **Reveal**.
6. Copy the key (starts with `whsec_...`).

### Step 3: Update Render with Real Webhook Secret
1. In Render Dashboard $\rightarrow$ Web Service $\rightarrow$ **Environment**.
2. Edit `STRIPE_WEBHOOK_SECRET` $\rightarrow$ Replace `whsec_placeholder` with the real `whsec_...`.
3. Click **Save Changes**. Render performs an instant, zero-downtime rolling restart.

---

## 6. Phase 5: Seed Production Admin Account

The database connection is verified and the backend is live, but frontend traffic has not started. This is the perfect moment to seed the primary admin.

1. In Render Dashboard $\rightarrow$ Select `cast-of-minds-api-prod`.
2. Click the **Shell** tab on the left sidebar.
3. Run the admin seed command:
   ```bash
   ADMIN_EMAIL="admin@castofminds.com" ADMIN_PASSWORD="AsadsPassword123!" npm run seed:admin
   ```
4. **Expected Output:**
   ```text
   Admin account created. role: admin status: active
   ```
   *(Or `Admin account verified` if already existing).*

---

## 7. Phase 6: Frontend Deployment on Vercel

### A. Project Import & Settings
1. Log in to [vercel.com](https://vercel.com).
2. Click **Add New...** $\rightarrow$ **Project** $\rightarrow$ Import `MuhammadHussnain28/Cast-Of-Mind`.
3. Configure project settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click Edit $\rightarrow$ Select `client` $\rightarrow$ Click Continue.
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

### B. Frontend Environment Variables (6 Variables)
In Vercel $\rightarrow$ **Settings** $\rightarrow$ **Environment Variables**, add:

| Key | Production Value | Scope |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `https://api.castofminds.com/api/v1` | Production, Preview |
| `VITE_SENTRY_DSN` | *(Your Sentry frontend DSN)* | Production |
| `VITE_SENTRY_ENVIRONMENT` | `production` | Production |
| `SENTRY_AUTH_TOKEN` | `sntrys_...` | Build-only (source map upload) |
| `SENTRY_ORG` | *(Your Sentry organization slug)* | Build-only |
| `SENTRY_PROJECT` | *(Your Sentry frontend project slug)* | Build-only |

### C. Deploy & Connect Custom Domains
1. Click **Deploy**. Wait ~60 seconds for build completion.
2. Go to **Settings** $\rightarrow$ **Domains**.
3. Add: `castofminds.com`.
4. Vercel will prompt to add both `castofminds.com` and redirect `www.castofminds.com`. Confirm.
5. Vercel automatically verifies the GoDaddy DNS records added in Phase 3 and provisions a free Let's Encrypt SSL certificate.

---

## 8. Phase 7: Post-Deployment 5-Minute Smoke Test

Run through this test checklist immediately:

1. **API Health Check:**
   Visit `https://api.castofminds.com/api/v1/health` $\rightarrow$ Expect `HTTP 200` with `{"status":"healthy"}`.
2. **Homepage & SSL Padlock:**
   Visit `https://castofminds.com`. Confirm the site loads over HTTPS with a secure padlock icon and no mixed content warnings.
3. **Admin Authentication:**
   Visit `https://castofminds.com/login` $\rightarrow$ Log in with seeded admin credentials $\rightarrow$ Confirm access to the Admin Dashboard.
4. **Safari / iPhone Cookie Session Verification (Crucial):**
   - Open `https://castofminds.com` on an iPhone Safari browser or Mac Safari.
   - Log in.
   - Refresh the page and close/re-open the tab.
   - **Confirm:** You remain logged in. (Proves `SameSite=Lax` on shared apex domain `castofminds.com` prevents Safari ITP from dropping cookies).
5. **Questionnaire & Therapist Display:**
   Go to `/questionnaire`, complete the steps, and verify therapist profile cards and images load from Cloudinary.
6. **Contact Form Delivery:**
   Submit a test message on `/contact` $\rightarrow$ Verify delivery at `contact@castofminds.com`.

---

## 9. Phase 8: Emergency Procedures (Rollback & Kill-Switch)

### A. Instant Rollback
- **Frontend (Vercel — 30 Seconds):**
  Vercel Dashboard $\rightarrow$ Deployments $\rightarrow$ Find previous working deploy $\rightarrow$ Click `...` $\rightarrow$ **Instant Rollback**.
- **Backend (Render — 60 Seconds):**
  Render Dashboard $\rightarrow$ Web Service $\rightarrow$ Deploys $\rightarrow$ Find previous stable deploy $\rightarrow$ Click `...` $\rightarrow$ **Rollback to this deploy**.

### B. Emergency Kill-Switch (Take Offline)
- **Halt Backend:** Render Dashboard $\rightarrow$ Settings $\rightarrow$ Danger Zone $\rightarrow$ Click **Suspend Service** (instantly severs database and Stripe processing).
- **Protect Frontend:** Vercel Dashboard $\rightarrow$ Settings $\rightarrow$ Deployment Protection $\rightarrow$ Enable **Password Protection**.
