# Cast of Mind — Build Chunks

> **This is the build file.** Every chunk below is a ready-to-paste prompt for Claude Code.
> Work through them in order. Do not skip ahead — later chunks depend on earlier ones.

**Source of truth:** `Cast_of_Mind_Master_Spec.md` (v1.4)
**Total:** 13 slices · 78 chunks
**Estimated:** 1.5–2 months

---

## How To Use This File

### The loop for every chunk

1. Open terminal → run `claude`
2. Copy the chunk prompt → paste it
3. Claude Code **plans** → you read the plan and correct anything wrong
4. You say "approved, go ahead" → it builds and tests
5. It updates `docs/ongoing.md` and lists any manual steps for you
6. **You do the manual steps** (env vars, package installs, account setup)
7. **You read the code and understand it** — ask "why did you do this?" until you do
8. **You test it manually** in the browser or with the API
9. `git add . && git commit -m "chunk X.Y: description"` and push
10. Next chunk

### When to `/clear`

- **Keep the session** for chunks within the same slice — the continuity helps
- **`/clear` at slice boundaries**, or any time responses feel sloppy, repetitive, or forgetful
- Run `/context` to check — if free space drops below 30%, clear
- After clearing, Claude Code re-reads `CLAUDE.md` and `docs/ongoing.md`, so nothing is lost

### Non-negotiable rules for you (not Claude Code)

- **Never skip step 7.** A working app you don't understand is worse than a half-built one you do.
- **Commit after every chunk.** It is your undo button when a chunk goes wrong.
- **Slices 1, 6, and 12 (auth, payments, subscription lifecycle) require extra care.** Read every line. Ask for tests. These are where bugs cost real money and real trust.

### Prompt conventions used below

| Element | Purpose |
|---|---|
| `Read @docs/...` | Loads the spec file Claude Code needs |
| **Build:** | What to create in this chunk |
| **Do NOT:** | Scope fence — prevents Claude Code building ahead |
| **Verify:** | What you personally check before committing |

---

## Standing Instructions

**Add this to `CLAUDE.md` so it applies to every session automatically:**

```
At the end of every task:
1. Update docs/ongoing.md — mark the chunk complete with a one-line summary
   of what was built and any decisions made.
2. List all manual steps I need to perform:
   - New environment variables (name + what value goes in it)
   - New packages installed
   - External account setup or API keys required
   - Anything you could not complete, and why
3. Never mark a chunk complete if any part was skipped — say so explicitly.
```

---

# SLICE 0 — Foundation & Setup

*6 chunks. Nothing else works until this is right.*

---

### Chunk 0.1 — Repository structure and backend skeleton

```
Read @docs/01-product-and-decisions.md (Section 4: Technology Stack).

CHUNK 0.1 — Repository structure and backend skeleton

Build:
- Monorepo structure: /client (React + Vite) and /server (Node + Express)
- Server: Express app with a clean folder structure —
  routes/, controllers/, services/, models/, middleware/, utils/, config/
- Environment config module that reads from .env and FAILS LOUDLY at startup
  if a required variable is missing (do not fall back to defaults silently)
- .env.example listing every variable the project will need, with comments
- Health check endpoint: GET /api/v1/health returning { status: "ok" }
- API versioning: all routes under /api/v1
- CORS configured for the client origin
- .gitignore covering node_modules, .env, build output
- package.json scripts: dev, start, test, lint (both client and server)
- Jest configured on the server side

Do NOT:
- Connect to MongoDB yet (that is chunk 0.2)
- Build any feature routes
- Build any React pages beyond the Vite default

Verify: `npm run dev` starts the server, /api/v1/health responds,
and the server refuses to start if a required env var is missing.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 0.2 — Database connection, error handling, logging

```
Read @docs/01-product-and-decisions.md (Section 4) and
@docs/03-core-systems.md (Section 18: Security Requirements).

CHUNK 0.2 — Database connection, error handling, logging

Build:
- Mongoose connection module with retry logic and clear startup logging
- Graceful shutdown (close DB connection on SIGTERM/SIGINT)
- Global error-handling middleware:
  - Never leak stack traces or internal details in production responses
  - Consistent error response shape: { error: { message, code } }
- A custom AppError class for throwing known, safe errors
- Async handler wrapper so controllers don't need try/catch everywhere
- Request logging middleware (method, path, status, duration)
- Rate limiting middleware, configurable per route (not applied yet)
- Input validation setup using a schema validator of your choice —
  explain your choice in the plan

Do NOT:
- Create any models yet
- Apply rate limiting to specific routes yet

Verify: server connects to MongoDB Atlas, logs clearly on success and failure,
and a thrown error returns a clean JSON response with no stack trace.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 0.3 — React scaffold and design tokens

```
Read @docs/05-design-system.md in full.

CHUNK 0.3 — React scaffold and design tokens

Build:
- React + Vite app in /client with Tailwind CSS configured
- React Router set up with placeholder routes for all public pages:
  /, /about, /how-it-works, /join-as-therapist, /contact, /login,
  /questionnaire, plus a 404 catch-all
- Tailwind config extending the theme with the EXACT design tokens:
    ink        #19122B
    ink-deep   #0D0916
    gold       #F5C518
    paper      #FFFFFF
    mist       #F4F2F7
    sage       #7C9082
- Fonts loaded and configured:
    Display: Fraunces (variable, Google Fonts)
    Body:    Satoshi (Fontshare) — if licensing blocks it, use Instrument Sans
- Type scale from Section 24.3 defined as Tailwind utilities
- Framer Motion installed
- A global CSS layer that respects prefers-reduced-motion:
  all ambient and reveal animations disabled, content shown immediately

Do NOT:
- Build any actual page content
- Build the navbar or footer yet (chunk 0.5)

Verify: fonts render correctly, all six colours are available as Tailwind classes,
and every placeholder route loads without error.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```


---

### Chunk 0.4 — Design system primitives

```
Read @docs/05-design-system.md (Sections 24.2, 24.3, 24.4, 24.6).

CHUNK 0.4 — Design system primitives

Build a small component library in /client/src/components/ui:
- Button — variants: primary (gold), secondary, ghost, danger.
  Sizes: sm, md, lg. Loading and disabled states.
- Input, Textarea, Select — with label, helper text, error state,
  and proper htmlFor/id association
- Checkbox and Radio
- Card
- Badge / Tag
- Modal (focus-trapped, Escape closes, returns focus on close)
- Spinner / Loading state
- Toast notification system
- Heading and Text components using the Section 24.3 type scale

Requirements for every component:
- Visible keyboard focus states
- Touch targets minimum 44x44px
- WCAG AA colour contrast
- Micro-interactions 150–250ms (NOT the slow breathing timing —
  that applies only to ambient and scroll-reveal motion)

Do NOT:
- Build page layouts or real pages
- Use any component library — these are custom built

Verify: render every component on a temporary /styleguide route,
tab through them with the keyboard, and confirm focus is always visible.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 0.5 — Layout shell: navbar and footer

```
Read @docs/04-features-and-flows.md (Section 5: Public Website) and
@docs/05-design-system.md.

CHUNK 0.5 — Layout shell: navbar and footer

Build:
- Navbar with exactly these 5 items: Home, How It Works, About,
  Join as a Therapist, Contact
- Right side, visually separated: Login link + "Get Started" button
  (gold, highlighted)
- Mobile navigation (hamburger → accessible drawer, focus trapped,
  Escape closes)
- Active route indication
- Footer containing:
  - Brand block
  - Legal links: Privacy Policy, Terms of Service, Refund Policy
  - Small credit line: "Developed by Muhammad Hussnain" linking to LinkedIn
    (placeholder URL for now, opens in new tab)
- A PublicLayout wrapper that composes navbar + page + footer
- Placeholder pages for /privacy, /terms, /refund

Do NOT:
- Build home page content
- Build the portal layouts (those come later and are different)

Verify: navigation works on desktop and mobile, keyboard-navigable,
footer legal links resolve.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 0.6 — Shared frontend utilities

```
Read @docs/01-product-and-decisions.md (Section 4).

CHUNK 0.6 — Shared frontend utilities

Build:
- API client wrapper (axios or fetch) with:
  - Base URL from environment variable
  - Automatic JSON handling
  - Centralised error handling that surfaces user-friendly messages
  - Placeholder interceptor for attaching the access token (wired in slice 1)
- Redux store configured, ready for slices
- A useApi hook or equivalent for loading/error/data states
- Reusable page-level states: LoadingState, ErrorState, EmptyState components
- Form validation helpers
- Date/time formatting utilities (these will be extended for timezones later)

Do NOT:
- Implement authentication logic yet
- Create feature-specific Redux slices

Verify: a test API call to /api/v1/health from the React app succeeds
and errors are handled gracefully when the server is stopped.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

# SLICE 1 — Authentication

*6 chunks. **HIGH RISK — read every line.** Ask for tests.*

---

### Chunk 1.1 — users model and constants

```
Read @docs/02-database-schema.md (Section 10.1: users) and
@docs/03-core-systems.md (Section 11: Authentication).

CHUNK 1.1 — users model and project constants

Build:
- Mongoose users model exactly per Section 10.1:
  email (unique, indexed, lowercase), passwordHash, role
  ("client" | "therapist" | "admin"), status ("active" | "inactive"),
  timestamps
- bcrypt password hashing utility (hash + compare)
- A constants file containing the fixed master list of 30+ specialty /
  concern tags. If the exact list is not in the spec, create a clearly
  marked PLACEHOLDER array of 30 common therapy concerns and flag it in
  ongoing.md as needing the client's real list.
- A constants file with the 33 treatment orientation options
  (from @docs/04-features-and-flows.md Section 23)
- A seed script that creates the single admin account from env variables
  (ADMIN_EMAIL, ADMIN_PASSWORD)

Do NOT:
- Build any auth endpoints yet
- Create other models

Tests (Jest): password hashing produces a valid hash; comparing correct
and incorrect passwords behaves correctly; the users model rejects
duplicate emails and invalid roles.

Verify: run the seed script, confirm the admin appears in MongoDB Atlas
with a HASHED password (never plain text).

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 1.2 — Login endpoint

```
Read @docs/03-core-systems.md (Section 11: Authentication) in full.

CHUNK 1.2 — Login endpoint

Build POST /api/v1/auth/login:
- Accept email + password
- Find the user by email; verify against passwordHash with bcrypt
- On failure: return a GENERIC error that never reveals whether the
  email exists in the system
- On success:
  - Access token: JWT, ~15 minute expiry, returned in the response body
  - Refresh token: ~7 day expiry, set as an httpOnly cookie
    (secure, sameSite)
  - Store the HASHED refresh token in the database for revocation
  - Return the user's role so the frontend can redirect
- Reject login if user.status is "inactive"
- Apply rate limiting to this endpoint

Do NOT:
- Build refresh, logout, or password reset endpoints (later chunks)
- Build any frontend

Tests (Jest): valid login returns tokens and role; wrong password fails;
non-existent email fails with the SAME message as wrong password;
inactive user cannot log in; rate limiting triggers after repeated attempts.

Verify: test with a REST client. Confirm the refresh token arrives as an
httpOnly cookie and the access token is in the body. Confirm the DB stores
the refresh token hashed, not raw.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 1.3 — Refresh, logout, token revocation

```
Read @docs/03-core-systems.md (Section 11).

CHUNK 1.3 — Refresh, logout, token revocation

Build:
- POST /api/v1/auth/refresh
  - Read the refresh token from the httpOnly cookie
  - Verify it and confirm its hash matches a stored, non-revoked record
  - Issue a new access token
  - Rotate the refresh token (issue new, invalidate old) and explain
    in the plan why rotation matters
- POST /api/v1/auth/logout
  - Invalidate the stored refresh token
  - Clear the cookie
- GET /api/v1/auth/me — return the current user's basic info and role
- Cleanup for expired refresh token records

Do NOT:
- Build the frontend
- Build password reset

Tests (Jest): refresh with a valid token issues a new access token;
refresh with a revoked token fails; refresh after logout fails;
an expired refresh token is rejected.

Verify: log in, wait for the access token to expire, confirm refresh
issues a new one. Then log out and confirm refresh now fails.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 1.4 — Auth middleware and role guards

```
Read @docs/03-core-systems.md (Sections 11 and 18) and
@docs/01-product-and-decisions.md (Section 3: User Roles).

CHUNK 1.4 — Auth middleware and role guards

Build:
- requireAuth middleware — validates the access token, attaches the user
  to the request, returns 401 cleanly when invalid or missing
- requireRole(...roles) middleware — returns 403 when the role does not match
- Convenience guards: requireClient, requireTherapist, requireAdmin
- A protected test route per role to prove the guards work

CRITICAL RULE from the spec: role checks are ALWAYS enforced server-side.
The frontend hiding a button is never sufficient protection.

Do NOT:
- Apply guards to feature routes that don't exist yet
- Build the subscription access gate (that is slice 12)

Tests (Jest): no token returns 401; invalid token returns 401;
expired token returns 401; wrong role returns 403; correct role passes.

Verify: hit each test route with each role's token and confirm the
correct status codes.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 1.5 — Password reset and email service

```
Read @docs/03-core-systems.md (Section 11: Account Recovery, and
Section 16: Email System).

CHUNK 1.5 — Password reset and email service

Build:
- Resend email service module with a reusable template system
- Base email template styled with the brand palette (ink, gold, mist)
- POST /api/v1/auth/forgot-password
  - Accept email
  - Generate a single-use, time-limited reset token; store it HASHED
  - Send the reset email
  - ALWAYS return the same success response whether or not the email
    exists (never reveal account existence)
- POST /api/v1/auth/reset-password
  - Validate the token, enforce password strength rules
  - Update passwordHash, invalidate the reset token
  - Invalidate ALL existing refresh tokens for that user
- Rate limiting on both endpoints

This flow must work identically for all three roles, including admin.

Do NOT:
- Build the frontend pages
- Build other email types (credentials, notifications) yet

Tests (Jest): reset token is single-use; expired token rejected;
successful reset invalidates old refresh tokens; response is identical
for existing and non-existing emails.

Verify: trigger a real reset email to your own address, complete the flow,
confirm the old password no longer works.

MANUAL STEP EXPECTED: I will need to add RESEND_API_KEY to .env.
Tell me exactly what to set.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 1.6 — Login page UI and auth wiring

```
Read @docs/04-features-and-flows.md (Section 5, Login page) and
@docs/05-design-system.md.

CHUNK 1.6 — Login page UI and auth wiring

Build:
- /login page: single unified login for all three roles
  - Email + password fields, "Forgot password" link
  - NO "Continue with Google" — see spec rationale
  - NO role selector — the backend decides
  - Calm, centred, minimal, on-brand
- /forgot-password and /reset-password pages
- Redux auth slice:
  - Access token held IN MEMORY ONLY — never localStorage, never persisted
  - User info and role in state
- API client interceptor: attach the access token; on 401, silently call
  refresh and retry the original request once
- Role-based redirect after login:
  client → /portal · therapist → /portal · admin → /admin
- ProtectedRoute component that redirects unauthenticated users to /login
- Placeholder /portal and /admin pages proving the redirect works
- Session restoration on page reload via the refresh token

CRITICAL: the access token must never be written to localStorage,
sessionStorage, or persisted Redux. In-memory only. Explain in your plan
how you are guaranteeing this.

Do NOT:
- Build actual portal content

Verify: log in as admin → lands on /admin. Reload the page → still logged in.
Wait 15+ minutes → session silently refreshes without logging you out.
Check DevTools → no token in localStorage.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

# SLICE 2 — Public Pages

*6 chunks. This slice establishes the visual language for everything after it.*

---

### Chunk 2.1 — Home: hero and services

```
Read @docs/05-design-system.md in full and
@docs/04-features-and-flows.md (Section 5, Home page spec).

CHUNK 2.1 — Home page: hero and services sections

Build:
- Hero section:
  - Animated, therapy-focused, calm
  - Headline, supporting line, primary "Get Started" CTA → /questionnaire
  - Ambient background motion on the 4s breathing rhythm (Section 24.4)
  - This is the thesis of the brand. It must NOT look like a template hero.
- Services section: what Cast of Mind offers, therapy areas covered,
  what a subscription includes

Design requirements:
- Follow Section 24.4 motion rules exactly: ambient/reveal motion slow
  (4s / 600–800ms), micro-interactions fast (150–250ms)
- prefers-reduced-motion fully respected
- Gold used sparingly — under ~5% of the screen
- NO stock photography of smiling people. Abstract organic forms,
  soft gradients, botanical motifs.
- Fully responsive down to 360px

Do NOT:
- Build the other five home sections yet
- Use placeholder lorem ipsum — write real, calm, on-brand copy

Verify: view on desktop and mobile, enable "reduce motion" in OS settings
and confirm animations stop while content still appears.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 2.2 — Home: testimonials and who we help

```
Read @docs/05-design-system.md (Section 24.7, Home spec including the
honesty note) and @docs/04-features-and-flows.md.

CHUNK 2.2 — Home page: testimonials and who we help

Build:
- Testimonials section: animated review cards with images and text
- "Who we help" section: target audiences, supporting figures,
  current client count

CRITICAL — PLACEHOLDER CONTENT WARNING:
Both sections use fictional testimonials and invented figures as DESIGN
PLACEHOLDERS ONLY. Per the spec, publishing fabricated reviews or false
user counts on a live mental-health platform is a consumer-protection risk.

Therefore:
- Mark every placeholder clearly in the code with a
  // TODO: PLACEHOLDER — REPLACE BEFORE LAUNCH comment
- Store all placeholder content in ONE data file so it is trivial to
  swap out later
- Add an entry to docs/ongoing.md under a "PRE-LAUNCH BLOCKERS" heading

Design: scroll-reveal with 80–120ms stagger, avatars as warm abstract
illustrations rather than stock photos.

Do NOT:
- Build remaining home sections
- Scatter placeholder content across multiple files

Verify: placeholder data is centralised in one file and clearly flagged.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 2.3 — Home: how it works, comparison, FAQ

```
Read @docs/05-design-system.md and @docs/04-features-and-flows.md
(Section 5 and Section 6 for the process steps).

CHUNK 2.3 — Home page: process summary, comparison table, FAQ

Build:
- "How it works" summary section: the process in visual steps,
  condensed, with a link through to /how-it-works
- Second "Get Started" CTA placed after this section
- Comparison table: in-person therapy vs Cast of Mind therapy —
  cost, accessibility, scheduling, contact between sessions
  (must be readable on mobile — consider a card layout below 768px)
- FAQ accordion addressing REAL hesitations:
  cost, privacy, "is this real therapy?", what happens if the therapist
  isn't a good fit, what if I need to cancel
- Assemble the complete home page in the correct order:
  hero → services → testimonials → how it works → who we help →
  comparison → FAQ → footer

Design: accordion is keyboard accessible with proper ARIA.
Comparison table must not feel aggressive toward in-person therapy —
calm and factual, not combative.

Do NOT:
- Build the dedicated /how-it-works page (that is chunk 2.5)

Verify: full home page scrolls cleanly on mobile and desktop,
accordion works by keyboard, all CTAs route correctly.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 2.4 — About page

```
Read @docs/04-features-and-flows.md (Section 5, About) and
@docs/05-design-system.md (Section 24.7, About spec).

CHUNK 2.4 — About page

Build /about:
- Introduction to Cast of Mind — mission and story
- Brand logo presentation area (client will supply the logo —
  use a clearly marked placeholder)
- Full team section: all team members and staff
  (the separate team page was deliberately merged here)
- Owner/founder profile
- All content is PLACEHOLDER — centralise it in one data file and flag it
  in ongoing.md under PRE-LAUNCH BLOCKERS
- Redirect /team → /about#team for any old inbound links

Design: premium, generously spaced, team members revealed on scroll with
staggered timing. Strong visual hierarchy.

Do NOT:
- Invent fake credentials or fake qualifications for team members —
  use obvious placeholders like "[Team Member Name]" and "[Role]"

Verify: page is responsive, animations respect reduced-motion,
placeholder content is centralised and flagged.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 2.5 — How It Works page

```
Read @docs/04-features-and-flows.md (Section 6: Client Onboarding Flow)
and @docs/05-design-system.md (Section 24.7, How It Works spec).

CHUNK 2.5 — How It Works page

Build /how-it-works:
- The full process, step by step:
  questionnaire → matching → choose your therapist → subscribe →
  receive credentials → start chatting → attend Zoom sessions
- Each step animated on scroll with a supporting visual
- Numbered step markers ARE appropriate here — this is genuinely a
  sequence and the order carries information
- Ends with a "Get Started" CTA

Tone requirement from the spec: this page exists to remove fear of the
unknown. It must answer "what will actually happen to me?" plainly and
reassuringly. Concrete, not marketing fluff.

Do NOT:
- Duplicate the home page's condensed version — this is the full detail

Verify: reads clearly to someone who has never used online therapy;
animations respect reduced-motion.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 2.6 — Contact page and endpoint

```
Read @docs/04-features-and-flows.md (Section 5, Contact) and
@docs/03-core-systems.md (Section 16: Email System).

CHUNK 2.6 — Contact page and backend endpoint

Build:
- /contact page:
  - Simple form: Name, Email, Message, optional subject dropdown
    (General question / Support / Media inquiry)
  - Alongside the form: business contact details including the email
    address and PHONE NUMBER used for reporting misconduct or account
    issues (this is the agreed escalation path — there is deliberately
    no admin conversation-viewing feature)
  - NO date, time, gender, or age fields — those belonged to the old
    site's conflated form
- POST /api/v1/contact endpoint:
  - Validate input, rate limit, send the message by email to the business
  - Return a clear success state
- Honeypot or similar basic spam protection

Do NOT:
- Store contact messages in the database — email delivery is sufficient
  for v1
- Build the therapist application form (that is slice 3)

Verify: submit the form, confirm the email arrives, confirm validation
errors are clear and helpful.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

# SLICE 3 — Therapist Application

*6 chunks. 33 fields across 5 steps.*

---

### Chunk 3.1 — Application model and file uploads

```
Read @docs/02-database-schema.md (Section 10.4: therapistApplications),
@docs/04-features-and-flows.md (Section 23: complete field spec),
and @docs/03-core-systems.md (Section 17: File Storage).

CHUNK 3.1 — therapistApplications model and Cloudinary uploads

Build:
- Mongoose therapistApplications model covering ALL 33 fields from
  Section 23, plus: email, passwordHash, status
  ("pending" | "approved" | "rejected"), submittedAt, reviewedAt
- Structured workingHours sub-schema: per-day enabled/start/end
  plus an optional free-text note
- Cloudinary integration module:
  - Secure signed uploads
  - File type restrictions (images and PDFs only)
  - File size limits
  - Separate folders for photos, certificates, licenses
- POST /api/v1/uploads endpoint returning a secure URL

Constraints from the spec:
- specialtyTags: 3–4 items, validated against the master constant list
- treatmentOrientations: 1–5 items, validated against the 33-item list
- therapistType: free text, ~50 character limit
- Password is hashed at submission time and carried over on approval

Do NOT:
- Build the application form UI
- Build the approval flow (slice 4)

Tests (Jest): model rejects out-of-range tag counts; rejects tags not in
the master list; rejects therapistType over the character limit.

Verify: upload a test PDF and image via the endpoint, confirm they appear
in Cloudinary and that a .exe or oversized file is rejected.

MANUAL STEP EXPECTED: Cloudinary credentials in .env.
Tell me exactly which variables to set.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 3.2 — Application submission endpoint

```
Read @docs/04-features-and-flows.md (Section 23) and
@docs/02-database-schema.md (Section 10.4).

CHUNK 3.2 — Application submission endpoint

Build:
- POST /api/v1/therapist-applications
  - Validate every field per Section 23 (mandatory vs optional)
  - Reject if the email already exists in users OR in a pending application
  - Hash the password before storing
  - Set status to "pending"
  - Send a notification email to the admin: "New application from [name]"
  - Send a confirmation email to the applicant explaining what happens next
- GET /api/v1/therapist-applications/:id/status — public status check
- Rate limiting

Validation must enforce: 28 mandatory fields present, 5 optional fields
allowed empty, tag count limits, character limits, valid email format,
password strength.

Do NOT:
- Build the form UI
- Build admin approve/reject

Tests (Jest): valid submission succeeds; missing mandatory field fails
with a clear message; duplicate email rejected; tag limits enforced.

Verify: submit a complete application via REST client, confirm the DB
record and both emails.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 3.3 — Application form: steps 1–2

```
Read @docs/04-features-and-flows.md (Section 23, Steps 1 and 2, and
Section 5 Join as a Therapist page) and @docs/05-design-system.md
(Section 24.7, Join as a Therapist form UX requirements).

CHUNK 3.3 — Join as a Therapist page + form steps 1–2

Build /join-as-therapist:
- Eligibility requirements notice displayed PROMINENTLY before the form:
  * MA, MS, MSW, Psy. or PhD in counseling, clinical psychology or
    related mental health areas
  * Minimum 2 years and/or 1000 hours providing counselling services
  * Professional malpractice liability insurance
  * No disciplinary actions in the past 10 years
  * No interns or anyone requiring supervision
- A short section selling the platform TO therapists
- Multi-step form shell with:
  - Visible step indicator ("Step 2 of 5") with progress
  - Back navigation that PRESERVES all entered data
  - Inline validation on blur, not only on submit
  - Placeholders on every free-text field
- Step 1 — Personal Details (8 fields, all mandatory):
  title, first name, last name, gender, date of birth, email, password,
  profile photo upload
- Step 2 — Location & Availability (8 fields, all mandatory):
  street address, city, state/province, zip, country, timezone
  (IANA dropdown), languages (multi-select), working hours
  (structured day toggles + time ranges + optional note)

Timezone dropdown must be populated from the standard IANA list —
do not hand-write it.

Do NOT:
- Build steps 3, 4, or 5
- Submit anything yet

Verify: fill both steps, navigate back and forward, confirm nothing is lost.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 3.4 — Application form: steps 3–4

```
Read @docs/04-features-and-flows.md (Section 23, Steps 3 and 4).

CHUNK 3.4 — Application form steps 3–4

Build:
- Step 3 — Professional Background (8 fields, 6 mandatory, 2 optional):
  therapist type (free text, ~50 char limit, with character counter),
  credential type (dropdown: Diploma/Degree, Certificate, License),
  credential initials, years of experience (number),
  summary of education (long text), current work situation (mandatory),
  license number (optional), taxpayer ID (optional)
- Step 4 — Practice & Specialties (5 fields, all mandatory):
  * Specialty tags — multi-select, ENFORCE 3–4 selections, from the
    master constant list. This drives matching, so make the constraint
    obvious in the UI.
  * Treatment orientations — multi-select, ENFORCE 1–5, from the 33-item
    list. Label it clearly as profile information, not matching criteria.
  * Bio — 3–4 lines, with a character counter; note that clients will see it
  * Licensing status (mandatory)
  * Disciplinary actions — Yes/No, with a conditional text field if Yes

Do NOT:
- Build step 5 or submission

Verify: tag selection limits are enforced in the UI with clear messaging
when the maximum is reached; character counters work.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 3.5 — Application form: step 5, review, submit

```
Read @docs/04-features-and-flows.md (Section 23, Step 5) and
@docs/05-design-system.md (Section 24.7, form UX requirements).

CHUNK 3.5 — Application form step 5, review screen, submission

Build:
- Step 5 — Compliance & Documents (5 fields, 3 mandatory, 2 optional):
  * Malpractice insurance confirmation — Yes/No, mandatory
  * Insurance details — optional free text
  * Certificate upload 1 — mandatory
  * Certificate upload 2 — optional
  * License document — optional
- File upload UI with clear states: idle / uploading / uploaded / error,
  file name display, and remove option
- Final REVIEW screen showing every entered value grouped by step,
  with an edit link jumping back to the relevant step
- Submission wired to POST /api/v1/therapist-applications
- Explicit confirmation screen after submission explaining what happens
  next and roughly when

Do NOT:
- Build the admin approval side

Verify: complete the entire 5-step form end to end, confirm the review
screen shows everything accurately, submit, confirm the DB record and
both emails.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 3.6 — Form resilience and polish

```
Read @docs/05-design-system.md (Sections 24.6 and 24.7).

CHUNK 3.6 — Application form resilience and polish

Build:
- Draft persistence: save progress so an accidental refresh does not lose
  30 minutes of typing.
  IMPORTANT: uploaded file URLs and non-sensitive fields only.
  The password must NEVER be persisted to browser storage.
  Explain your approach in the plan.
- "Resume your application" prompt if a draft exists
- Full keyboard navigation through all 5 steps
- Screen-reader announcements on step change
- Error summary at the top of a step when validation fails, with links
  to the offending fields
- Mobile layout pass — this form is long; make it comfortable on a phone
- Graceful handling of upload failure mid-form
- Loading and disabled states on submit to prevent double submission

Do NOT:
- Change any field definitions

Verify: fill three steps, refresh the browser, confirm the draft is
restored and the password field is empty. Complete the form using only
the keyboard.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

# SLICE 4 — Admin Core & Therapist Approval

*6 chunks. Therapists cannot exist until this works.*

---

### Chunk 4.1 — Admin layout and route protection

```
Read @docs/04-features-and-flows.md (Section 9: Admin Portal) and
@docs/03-core-systems.md (Section 18: Security Requirements).

CHUNK 4.1 — Admin portal layout and protection

Build:
- /admin route protected by requireAdmin (server-side enforced)
- Admin layout: sidebar navigation with placeholders for
  Dashboard, Applications, Therapists, Clients, Bookings
- Denser, more utilitarian styling than the marketing site, while using
  the same palette and typefaces (per Section 24.8)
- Session timeout: automatic logout after ~30 minutes of inactivity,
  with a warning shortly before
- Admin action logging middleware — record who did what and when
- Reusable admin DataTable component: sorting, pagination, search,
  loading state, empty state

Do NOT:
- Build dashboard statistics or any management screen yet

Verify: a client or therapist token cannot reach /admin (server returns
403, not just a hidden UI). Inactivity triggers logout.

NOTE: Two-factor authentication for admin is a spec requirement
(Section 18). Flag it in ongoing.md as a pre-launch item if not
implemented in this chunk.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 4.2 — Applications review screen

```
Read @docs/04-features-and-flows.md (Section 9.2: Therapist Applications
and Section 23).

CHUNK 4.2 — Admin: therapist applications review

Build:
- GET /api/v1/admin/applications — list with status filter, pagination,
  search by name/email, sorted newest first
- GET /api/v1/admin/applications/:id — full detail
- Applications list screen with a pending-count badge
- Application detail screen showing ALL 33 fields grouped by the 5 steps,
  clearly laid out for review
- Uploaded documents viewable inline or in a new tab (photo, certificates,
  license)
- Approve and Reject buttons — UI only in this chunk, wired in 4.3
- Empty state when there are no applications

Do NOT:
- Implement approve/reject logic yet (chunk 4.3)

Verify: submit a test application, confirm it appears in the list with all
fields readable and documents openable.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 4.3 — Approval flow creates therapist account

```
Read @docs/02-database-schema.md (Sections 10.1, 10.3, 10.4 and the
Multi-Document Transaction Requirement) and
@docs/04-features-and-flows.md (Section 9.2).

CHUNK 4.3 — Approve / reject flow

Build:
- Mongoose therapistProfiles model exactly per Section 10.3
- POST /api/v1/admin/applications/:id/approve
  - Inside a MongoDB TRANSACTION, create BOTH:
    1. A users record (role: "therapist", carrying over the hashed
       password from the application)
    2. A therapistProfiles record populated from the application data
  - Mark the application "approved", set reviewedAt
  - Send a welcome email to the therapist with login instructions
    (they already set their own password — do NOT generate a new one)
  - If any step fails, the whole transaction rolls back
- POST /api/v1/admin/applications/:id/reject
  - Mark "rejected", set reviewedAt, retain the record permanently
  - Optional rejection reason
  - No account is created
- Confirmation dialogs on both actions in the UI

CRITICAL: the two documents must be created atomically. A therapist with
a login but no profile (or vice versa) is a broken state.

Do NOT:
- Build a manual "add therapist" feature — deliberately excluded per spec

Tests (Jest): approval creates both records; simulated failure mid-way
rolls back completely leaving no partial data; rejection creates no user;
approving twice is safely idempotent.

Verify: approve a test application, confirm both records exist, then log
in as that therapist using the password from the application form.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 4.4 — Admin dashboard statistics

```
Read @docs/04-features-and-flows.md (Section 9.1: Stats Dashboard).

CHUNK 4.4 — Admin dashboard

Build:
- GET /api/v1/admin/stats returning:
  MONEY: monthly recurring revenue, active subscriptions count,
         new subscriptions this month vs last, cancelled/expired this month
  PEOPLE: total clients (active vs inactive), total therapists,
          pending applications count
  ACTIVITY: sessions scheduled this month, new signups trend
  QUALITY: platform-wide average star rating, recent reviews
- Dashboard UI with clear stat cards and a simple signups trend
- Pending applications card links directly to the applications screen
- Graceful zero-state — every figure shows 0 cleanly before real data exists

Note: collections for subscriptions, sessions, and reviews do not exist
yet. Write the queries defensively so they return 0 rather than crashing,
and structure the code so those numbers activate automatically once those
collections exist.

Constraint from the spec: keep this to COUNTS AND SIMPLE TRENDS.
This is a 20-second overview, not an analytics suite.

Do NOT:
- Build charts beyond one simple trend
- Build management screens

Verify: dashboard loads without error on an empty database.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 4.5 — Therapist management screen

```
Read @docs/04-features-and-flows.md (Section 9.3: Therapist Management)
and @docs/02-database-schema.md (Section 10.3).

CHUNK 4.5 — Admin: therapist management

Build:
- GET /api/v1/admin/therapists — list with search, filter by status
- GET /api/v1/admin/therapists/:id — full profile
- PATCH /api/v1/admin/therapists/:id — edit ADMIN-CONTROLLED fields only:
  specialty tags, credentials, name/title, email
  (these are deliberately NOT self-editable by therapists)
- POST /api/v1/admin/therapists/:id/deactivate and /reactivate
- POST /api/v1/admin/therapists/:id/reset-password — triggers the standard
  reset email; the admin NEVER sees or sets the password directly
- UI: list, detail view, edit form, status toggle, confirmation dialogs
- Show active client count and average rating (0 until those exist)

CRITICAL: the admin can trigger a password reset but can never view or
choose a password. Passwords are hashed and irreversible by design.

Do NOT:
- Add any feature allowing the admin to view therapist-client
  conversations — deliberately excluded per spec

Verify: edit a therapist's specialties, confirm the change persists.
Deactivate one and confirm they can no longer log in.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 4.6 — Therapist profile page

```
Read @docs/04-features-and-flows.md (Section 8.7: Therapist Profile).

CHUNK 4.6 — Therapist portal: profile page

Build:
- Basic therapist portal shell at /portal for role "therapist"
  (full layout comes in slice 8 — this is minimal)
- Profile page showing:
  READ-ONLY: name, title, credentials, credential type, specialty tags,
  languages, country, timezone, working hours, member since,
  therapist type, education summary, licensing status
  EDITABLE: profile photo, bio
- PATCH /api/v1/therapist/profile — accepts ONLY photo and bio.
  The endpoint must REJECT attempts to modify locked fields even if
  they are sent in the request body.
- Practice stats (simple counts only): active clients, total clients
  helped, sessions completed
- Password change is NOT available here — direct them to
  "Forgot password" instead, per spec

CRITICAL: enforce the editable/locked split SERVER-SIDE. Hiding fields in
the UI is not sufficient — the spec requires matching integrity and client
trust to depend on admin-verified credentials.

Constraint: stats stay simple counts. No charts, no trends —
that is admin territory.

Do NOT:
- Build the client sidebar or chat (slice 8)

Verify: log in as an approved therapist, edit the bio successfully, then
attempt to send a specialtyTags change via REST client and confirm it is
rejected.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

# SLICE 5 — Questionnaire & Matching

*6 chunks.*

---

### Chunk 5.1 — clientProfiles model and questionnaire state

```
Read @docs/02-database-schema.md (Section 10.2: clientProfiles) and
@docs/04-features-and-flows.md (Section 6: Client Onboarding Flow).

CHUNK 5.1 — clientProfiles model and questionnaire state

Build:
- Mongoose clientProfiles model per Section 10.2, including:
  type ("individual" | "couple"), country, city, relationshipStatus,
  concernTags, therapistGenderPreference
  ("male" | "female" | "no_preference"),
  individual fields (name, age, gender),
  and coupleData { partner1, partner2 }
- Redux slice managing questionnaire answers across steps
- Draft persistence so a refresh does not lose progress
  (non-sensitive answers only)
- Validation logic for both the individual and couple branches
- A questionnaire flow shell with progress indication and back navigation
  that preserves answers

Key rule from the spec: a COUPLE SHARES ONE ACCOUNT — one users record,
one clientProfile containing both partners, one booking, one subscription.

Do NOT:
- Build the question screens yet
- Build matching or checkout

Tests (Jest): model validates individual vs couple shapes correctly;
concernTags enforced at 1–4 items from the master list.

Verify: model accepts a valid individual profile and a valid couple
profile, and rejects malformed ones.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 5.2 — Questionnaire: individual path

```
Read @docs/04-features-and-flows.md (Section 6) and
@docs/05-design-system.md (Section 24.7, Get Started flow UX).

CHUNK 5.2 — Questionnaire: individual path

Build the /questionnaire flow, individual branch:
- Screen 1: Individual or Couple? (this determines the branch)
- Then, one question or one tight group PER SCREEN:
  country, city, gender, client name, age, email, relationship status
- Visible progress indicator throughout
- Back navigation preserving every answer
- Calm, spacious, reassuring design

CRITICAL UX RULE from the spec: never show a wall of fields.
This audience is anxious; density increases abandonment. One question or
one tight group per screen.

Do NOT:
- Build the couple branch (chunk 5.3)
- Build the concern tag screen (chunk 5.4)
- Build matching or checkout

Verify: complete the individual path, navigate backwards and forwards,
confirm no answer is lost. Test on mobile.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 5.3 — Questionnaire: couple path

```
Read @docs/04-features-and-flows.md (Section 6, couple branch).

CHUNK 5.3 — Questionnaire: couple path

Build the couple branch:
- Shared fields: country, city, email, relationship status
- Partner 1: name, age, gender
- Partner 2: name, age, gender
- Clear visual distinction between "about you both" and
  "about each of you" so the shared-account model is intuitive
- Same one-group-per-screen pacing as the individual path
- Both branches converge into the same next step

Make it clear in the UI that a couple shares ONE account and ONE set of
login credentials — this prevents confusion later.

Do NOT:
- Build concern tags or matching

Verify: complete the couple path, confirm both partners' data is captured
correctly in the Redux state.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 5.4 — Concern tags and gender preference

```
Read @docs/04-features-and-flows.md (Section 6, Concern Tag Selection and
Therapist Gender Preference) and @docs/05-design-system.md.

CHUNK 5.4 — Concern tags and therapist gender preference

Build:
- Concern tag selection screen:
  - The full master list of 30+ concerns
  - Enforce 1–4 selections with clear UI feedback at the limit
  - Searchable or well-grouped — 30+ options must not overwhelm
  - Calm, non-clinical presentation
- Therapist gender preference screen:
  Male / Female / No preference
  - Frame it neutrally, with no implication that any answer is "better"
- Final review screen before proceeding to matches

FROM THE SPEC — this screen deserves the most design care on the entire
site. It is the emotional core of the flow: the moment someone names what
they are struggling with. Treat it accordingly. No clinical coldness,
no overwhelming grid of jargon.

Do NOT:
- Build matching logic (chunk 5.5)

Verify: selection limits enforced clearly; the screen feels calm rather
than clinical; works well on mobile.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 5.5 — Matching engine

```
Read @docs/03-core-systems.md (Section 15: Matching Engine) IN FULL.

CHUNK 5.5 — Matching engine

Build POST /api/v1/matching (public, rate limited):
- Accept concernTags and therapistGenderPreference
- Find active therapists whose specialtyTags OVERLAP the client's
  concernTags
- If a gender preference was stated, SORT preferred-gender matches to the
  top — but STILL RETURN the others below them
- If ZERO therapists match the tags: return ALL active therapists,
  ordered by gender preference if stated
- Return only public-safe profile fields
  (never email, address, taxpayer ID, license number)

THREE CRITICAL RULES — implement exactly:
1. Gender preference is a SOFT PRIORITISATION, never a hard filter.
   It must never hide a therapist from the results.
2. The no-match fallback shows all therapists SILENTLY.
   NO message, banner, or explanation that a match was not found.
   This was a deliberate client decision on user-psychology grounds —
   do not add a "no exact match" message.
3. Country, timezone, and treatment orientations are NOT matching
   filters. Matching is specialty tags only.

Do NOT:
- Filter by country, timezone, availability, or treatment orientation
- Add any "no match found" messaging

Tests (Jest): overlapping tags return matches; gender preference reorders
but never removes; zero-overlap returns the full active therapist list;
sensitive fields are never included in the response.

Verify: create test therapists with different tags and genders, run
several matching scenarios, confirm ordering and the silent fallback.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 5.6 — Therapist results and detail pages

```
Read @docs/04-features-and-flows.md (Section 6) and
@docs/05-design-system.md (Section 24.7).

CHUNK 5.6 — Therapist results and detail pages

Build:
- /matches results page:
  - Therapist cards: photo, name, professional title, specialty tags,
    short bio, languages
  - Enough warmth that choosing feels like a human decision, not a
    database lookup
  - Reveal animation with stagger
  - Loading skeleton while matching runs
- /therapist/:id detail page:
  - Full bio, specialties, treatment orientations (clearly labelled as
    approach/method, not matching criteria), languages, credentials,
    working hours displayed in the VIEWER's local timezone
  - "Choose this therapist" CTA → proceeds to checkout
- Selected therapist stored in questionnaire state

Do NOT:
- Build checkout or payment (slice 6)
- Show any admin-only or sensitive therapist fields
- Show star ratings — reviews are admin-only per spec

Verify: complete the full questionnaire, land on matches, open a detail
page, select a therapist, and confirm the selection is held in state.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

# SLICE 6 — Payments & Account Creation

*6 chunks. **HIGHEST RISK IN THE PROJECT.** Read every line. Do not rush.*

> **Before starting this slice:** the payment platform must be confirmed with the client
> (Stripe / PayPal / both). See Open Items in `01-product-and-decisions.md`.
> Build and test entirely in test/sandbox mode using your OWN account.

---

### Chunk 6.1 — Payment models

```
Read @docs/02-database-schema.md (Sections 10.5 bookings,
10.6 subscriptions, 10.14 paymentEvents) and
@docs/03-core-systems.md (Section 12: Payment System).

CHUNK 6.1 — bookings, subscriptions, paymentEvents models

Build:
- Mongoose bookings model per Section 10.5:
  clientId, therapistId, status, matchedAt, endedAt
- Mongoose subscriptions model per Section 10.6:
  bookingId, clientId, status ("active"|"past_due"|"cancelled"|"expired"),
  currency (EUR), amount (200), startDate, currentPeriodEnd,
  nextBillingDate, sessionsRemaining, platformSubscriptionId,
  cancelledAt, timestamps
- Mongoose paymentEvents model per Section 10.14:
  subscriptionId, clientId, platform, eventType, platformEventId
  (UNIQUE INDEX — this enforces idempotency), amount, currency,
  rawPayload, receivedAt
- Indexes on all frequently queried fields

CRITICAL DESIGN RULES from the spec:
- paymentEvents is an IMMUTABLE APPEND-ONLY LEDGER.
  Never update or delete these records. Add a model-level guard that
  prevents updates.
- subscriptions holds CURRENT STATE (changes over time).
  paymentEvents holds PERMANENT HISTORY (never changes).
  Do not merge these responsibilities.
- The unique index on platformEventId is what prevents a duplicate
  webhook from being processed twice.

Do NOT:
- Build any payment endpoints yet

Tests (Jest): duplicate platformEventId is rejected by the unique index;
attempting to update a paymentEvent is blocked.

Verify: models create correctly; inserting the same platformEventId twice
fails.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 6.2 — Checkout session creation

```
Read @docs/03-core-systems.md (Section 12: Payment System) IN FULL.

CHUNK 6.2 — Checkout session creation

Build:
- Payment platform SDK integration in TEST/SANDBOX MODE
- POST /api/v1/checkout/create-session
  - Accept the completed questionnaire data + selected therapistId
  - Validate the therapist exists and is active
  - Validate the email is not already registered
  - Create a subscription checkout session on the payment platform:
    €200/month recurring
  - Store the pending questionnaire data temporarily, keyed to the
    session ID, so the webhook can retrieve it
  - Return the redirect URL
- Success and cancel return URLs configured
- Rate limiting

CRITICAL RULES:
- The application NEVER touches raw card details. The payment platform's
  hosted page handles that entirely.
- NO account, booking, or subscription is created here.
  Creation happens ONLY on webhook confirmation (chunk 6.4).
- Temporary questionnaire storage must expire if payment is abandoned.

Do NOT:
- Create any user account in this chunk
- Handle webhooks yet

Verify: hit the endpoint, receive a valid checkout URL, open it, and
confirm the payment platform's page shows €200/month recurring.

MANUAL STEP EXPECTED: payment platform test API keys in .env.
Tell me exactly which variables to set.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 6.3 — Webhook handler and idempotency

```
Read @docs/03-core-systems.md (Section 12, especially THE GOLDEN RULE and
Webhook Events to Handle).

CHUNK 6.3 — Webhook endpoint and idempotency

Build POST /api/v1/webhooks/payment:
- VERIFY THE WEBHOOK SIGNATURE before processing anything.
  An unverified webhook must be rejected outright.
- Use the RAW request body for verification (not parsed JSON) —
  ensure body parsing is configured correctly for this route only
- Log EVERY received event to paymentEvents before acting on it
- Idempotency: check platformEventId against paymentEvents.
  If already processed, return 200 immediately and do nothing further.
- Route event types to handlers:
  * payment succeeded (initial)  → chunk 6.4
  * payment succeeded (renewal)  → slice 12
  * payment failed               → slice 12
  * subscription cancelled       → slice 12
  For this chunk, stub the handlers and log clearly.
- Always return 200 quickly on successfully received events;
  process asynchronously if needed so the platform does not retry
  unnecessarily
- Handle unknown event types gracefully without erroring

THE GOLDEN RULE from the spec:
Account creation happens on WEBHOOK CONFIRMATION, never on browser
redirect. Browsers can lose connection, close early, or be manipulated.
The webhook is the authoritative source of truth.

Do NOT:
- Create accounts yet (chunk 6.4)
- Trust any data sent from the browser about payment status

Tests (Jest): invalid signature rejected; duplicate platformEventId
processed only once; unknown event type does not crash.

Verify: use the payment platform's CLI/test tool to send test webhooks.
Send the same event twice and confirm only one paymentEvents record exists.

MANUAL STEP EXPECTED: webhook signing secret in .env, and local webhook
forwarding set up. Tell me exactly how.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 6.4 — Account creation transaction

```
Read @docs/02-database-schema.md (Multi-Document Transaction Requirement),
@docs/03-core-systems.md (Section 12) and @docs/01-product-and-decisions.md
(Section 3: No Self-Registration).

CHUNK 6.4 — The four-document creation transaction

Build the "payment succeeded (initial)" handler:
- Retrieve the stored questionnaire data using the session ID
- Generate a secure random temporary password
- Inside ONE MongoDB TRANSACTION, create ALL FOUR documents:
    1. users          (role "client", hashed temporary password)
    2. clientProfiles (all questionnaire data, individual or couple)
    3. bookings       (clientId + selected therapistId, status active)
    4. subscriptions  (status active, sessionsRemaining 4,
                       currentPeriodEnd = +1 month, EUR 200,
                       platformSubscriptionId stored)
- If ANY step fails, the ENTIRE transaction rolls back — no partial account
- After the transaction commits, send the welcome email containing login
  credentials
- Mark the temporary questionnaire data as consumed
- Log the outcome to paymentEvents

CRITICAL:
- A half-created account (a user with no subscription, or a booking with
  no user) is a serious failure state. The transaction is not optional.
- Email sending happens AFTER the transaction commits. If the email fails,
  the account must still exist — log the failure loudly so it can be
  resent manually.
- For a couple: still exactly ONE users record and ONE clientProfile
  containing both partners.

Tests (Jest): successful payment creates exactly four documents;
simulated failure at each step rolls back everything; a couple creates one
account not two; duplicate webhook does not create duplicate accounts.

Verify: complete a full test payment. Confirm all four documents exist,
the credentials email arrives, and you can log in with them.
Then re-send the same webhook and confirm no duplicates appear.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 6.5 — Checkout UI and renewal disclosure

```
Read @docs/03-core-systems.md (Section 13: Auto-Renewal Transparency) and
@docs/05-design-system.md.

CHUNK 6.5 — Checkout page and auto-renewal disclosure

Build:
- /checkout page:
  - Order summary: selected therapist (photo + name), €200/month,
    what is included — Zoom sessions, unlimited chat, worksheets, journal
  - NO "what session type do you want?" question — the platform provides
    one model and simply states what is included
  - Prominent, unmissable auto-renewal disclosure:
    "This is a monthly subscription. Your card will be charged €200
     automatically each month until you cancel."
  - Link to Terms and Refund Policy
  - "Proceed to payment" → creates the session and redirects
- Loading state during session creation
- Clear error handling if session creation fails
- /checkout/cancel page for users who abandon payment, offering a way back

FROM THE SPEC: the checkout disclosure is the single most important
transparency point — legally and ethically. It must be impossible to miss.
Do not bury it in small print.

Do NOT:
- Collect card details in your own UI — always redirect to the platform's
  hosted page

Verify: the disclosure is clearly visible without scrolling on mobile;
the full flow from matches → checkout → payment page works.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 6.6 — Welcome page and payment tests

```
Read @docs/03-core-systems.md (Sections 12 and 13).

CHUNK 6.6 — Welcome page and end-to-end payment testing

Build:
- /welcome page shown after successful payment:
  - Confirmation that payment succeeded
  - "Check your email for login credentials"
  - Explanation of what happens next
  - IMPORTANT: this page must NOT be what creates the account.
    It only displays a message. If the user never reaches it, the account
    still exists because the webhook created it.
  - Handle the case where the user lands here before the webhook has
    finished processing — show a friendly "setting up your account" state
- Comprehensive Jest test suite for the whole payment flow:
  * checkout session creation
  * webhook signature verification
  * idempotency under duplicate webhooks
  * the four-document transaction and its rollback
  * couple account creation
  * email dispatch on success
- A documented manual test checklist in docs/ongoing.md covering:
  successful payment, abandoned payment, duplicate webhook,
  and payment with an already-registered email

Do NOT:
- Add any account creation logic to this page

Verify: run the full flow three times — complete once, abandon once,
and replay a webhook once. Confirm exactly one account exists from the
completed attempt only.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

# SLICE 7 — Client Portal & Chat

*6 chunks.*

---

### Chunk 7.1 — Client portal shell and access gate

```
Read @docs/04-features-and-flows.md (Section 7: Client Portal),
@docs/03-core-systems.md (Section 13: Subscription Lifecycle) and
@docs/05-design-system.md (Section 24.8: Portal Design Notes).

CHUNK 7.1 — Client portal shell and subscription access gate

Build:
- /portal layout for role "client":
  - Sidebar/navigation: Chat, Worksheets, Journal, Sessions,
    Subscription & Account
  - Warmer than the admin portal, denser than the marketing site
  - Mobile-responsive navigation
- requireActiveSubscription middleware:
  - Checks subscription status on every protected client action
  - "active" → full access
  - "past_due" → access allowed, but a payment warning banner is shown
  - "cancelled" → access until currentPeriodEnd, then treated as expired
  - "expired" → NO portal access; redirect to the re-subscribe screen
- GET /api/v1/client/me returning profile, booking, therapist basics,
  and subscription status
- Placeholder screens for each nav item

CRITICAL: the access gate is enforced SERVER-SIDE on every request.
Hiding navigation in the UI is not access control.

Do NOT:
- Build the re-subscribe screen yet (slice 12)
- Build any feature content

Verify: log in as a paying client and reach the portal. Manually set the
subscription to "expired" in the database and confirm access is blocked.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 7.2 — Messages model and chat endpoints

```
Read @docs/02-database-schema.md (Section 10.7: messages) and
@docs/03-core-systems.md (Section 14: Real-Time Chat Architecture).

CHUNK 7.2 — messages model and chat REST endpoints

Build:
- Mongoose messages model per Section 10.7:
  bookingId, senderId, text, type ("text" | "system"), read, createdAt
  Indexed on bookingId + createdAt.
  Structured so "voice" and "attachment" types can be added later
  without a rebuild.
- GET /api/v1/chat/:bookingId/messages — paginated, newest last
- POST /api/v1/chat/:bookingId/messages — send a message
- POST /api/v1/chat/:bookingId/read — mark messages as read
- GET /api/v1/chat/unread-count — unread count for the current user
- Authorisation: a user may ONLY access chats for bookings they belong to.
  Verify against the booking, never trust a bookingId from the client.

Unread logic per the spec: count messages where read is false AND
senderId is not the current user.

Do NOT:
- Build Socket.io yet (chunk 7.3)
- Build any chat UI

Tests (Jest): a user cannot read another booking's messages; unread count
excludes their own messages; marking read updates only the correct records.

Verify: send messages via REST client between a client and therapist
booking, confirm authorisation blocks cross-booking access.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 7.3 — Socket.io real-time layer

```
Read @docs/03-core-systems.md (Section 14: Real-Time Chat Architecture).

CHUNK 7.3 — Socket.io real-time delivery

Build:
- Socket.io server attached to the Express app
- Socket authentication using the access token —
  reject unauthenticated connections
- Room-per-booking model: users join only rooms for their own bookings
- Events:
  * message:send → persist to MongoDB, then emit to the room
  * message:receive → delivered to the other party if online
  * message:read → live unread count updates
  * typing indicator (optional, only if it does not complicate delivery)
- Reconnection handling: on reconnect, fetch any messages missed while
  disconnected
- Graceful degradation: if the socket connection fails, chat must still
  work via the REST endpoints

CRITICAL from the spec: messages are ALWAYS persisted to MongoDB first.
Socket.io only handles instant delivery. If the recipient is offline, the
message simply waits — there is no blocking, no "user unavailable" state.

Do NOT:
- Store messages only in memory
- Block message sending when the recipient is offline

Verify: open two browsers logged in as the client and the therapist of the
same booking. Send messages both ways and confirm instant delivery.
Kill the socket connection and confirm chat still works through REST.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 7.4 — Client chat UI

```
Read @docs/04-features-and-flows.md (Section 7.1: Chat) and
@docs/05-design-system.md.

CHUNK 7.4 — Client chat interface

Build the client Chat screen:
- Message thread: client messages and therapist messages visually distinct
- System messages (type "system") styled differently — these are automated
  notices such as scheduled sessions
- Message input with send button, Enter to send, Shift+Enter for newline
- Timestamps displayed in the CLIENT'S local timezone
- Auto-scroll to newest, with a "jump to latest" control when scrolled up
- Loading state, pagination when scrolling up through history
- Optimistic sending with a clear failure state and retry
- THERAPIST'S WORKING HOURS displayed at the top of the chat,
  converted to the client's local timezone, so they know when the
  therapist is likely online
- Empty state before the first message

Do NOT:
- Build the mandatory first message flow yet (chunk 7.5)
- Build voice messages — text only for v1

Verify: send and receive messages live; confirm working hours display
correctly converted; test on mobile.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 7.5 — Mandatory first message

```
Read @docs/04-features-and-flows.md (Section 7.1, mandatory first message).

CHUNK 7.5 — Mandatory first message flow

Build:
- On a client's first entry to chat with no messages yet, present a
  required opening message before normal chat unlocks
- FREE TEXT, not a structured form — deliberately, so the client can
  express themselves naturally
- Prompt them to describe: their feelings, emotions, current experience,
  and challenges
- Warm, calm framing — this must not feel like a form to complete.
  It is the beginning of a conversation.
- Minimum length guidance (gentle, not punitive)
- Once sent, normal chat is enabled
- Backend enforcement: reject other client messages on a booking that has
  no first message yet

Do NOT:
- Make this a multi-field structured form — the client explicitly chose
  free text
- Allow it to be skipped

Verify: create a fresh paying client, enter chat, confirm the first
message is required and that normal chat unlocks afterwards.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 7.6 — Unread badges and chat polish

```
Read @docs/03-core-systems.md (Section 14) and
@docs/05-design-system.md (Section 24.6).

CHUNK 7.6 — Unread indicators and chat polish

Build:
- Unread badge in the client portal navigation, updating live via socket
- Mark-as-read when the conversation is opened and visible
- Browser tab title showing unread count when the tab is not focused
- Accessibility pass on chat:
  * ARIA live region announcing new messages to screen readers
  * Full keyboard navigation
  * Focus management when messages arrive
- Long message handling, link detection, whitespace preservation
- Message send failure recovery
- Mobile keyboard handling (input must stay visible when the keyboard opens)

Do NOT:
- Add file attachments or voice — deferred to v2

Verify: unread badge updates live; screen reader announces new messages;
mobile input remains visible with the keyboard open.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

# SLICE 8 — Therapist Portal & Chat

*6 chunks. This is the inbox pattern — read Section 8 carefully.*

---

### Chunk 8.1 — Therapist portal layout and client sidebar

```
Read @docs/04-features-and-flows.md (Section 8: Therapist Portal,
especially "The Architecture (Critical to Understand)" and
Section 8.1) and @docs/05-design-system.md (Section 24.8).

CHUNK 8.1 — Therapist portal layout and client list sidebar

Build the therapist portal at /portal for role "therapist":
- THE INBOX PATTERN — this is the key architectural concept:
  * LEFT (persistent): the therapist's client list with unread badges
  * RIGHT (dynamic): selecting a client loads THAT client's full workspace
  * The same tabs always exist; only the loaded data changes
  * There is NO duplication of features per client
- GET /api/v1/therapist/clients — list of the therapist's active bookings
  with unread counts and last activity
- Client list items: name, last activity, unread badge
- Global navigation below the client list: My Profile, Notifications
- EMPTY STATE — deliberately minimal per client decision. Show ONLY:
  "No clients yet. You'll see them here once they're matched with you."
  Do NOT show profile completion prompts, visibility tips, or specialty
  tag suggestions — these were explicitly rejected because they create
  false uncertainty for a therapist whose profile was already completed
  and approved.
- Mobile: client list and detail as separate views with clear navigation

Do NOT:
- Build the client detail tabs yet (chunk 8.2)
- Add any onboarding prompts to the empty state

Verify: log in as a therapist with no clients and confirm the minimal
empty state. Approve a paying client match and confirm they appear.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 8.2 — Client workspace tabs

```
Read @docs/04-features-and-flows.md (Section 8, all subsections).

CHUNK 8.2 — Client detail workspace shell

Build:
- When a client is selected, show a client identity strip that stays
  visible: name, country, presenting concerns, client since date
- Tab navigation scoped to the selected client:
  Chat · Worksheets · Sessions · Journal and Notes · Client Info
- Tab state resets appropriately when switching clients
- GET /api/v1/therapist/clients/:bookingId — the selected client's
  full context
- Client Info tab: questionnaire responses, timezone, subscription status,
  matched date, therapist gender preference stated
- Loading and error states per tab
- URL reflects the selected client and tab so refresh preserves position

CRITICAL: verify server-side that the requesting therapist actually owns
this booking. A therapist must never be able to load another therapist's
client by changing the URL.

Do NOT:
- Build tab contents beyond Client Info yet

Verify: switch between clients and confirm data swaps correctly. Attempt
to load another therapist's bookingId and confirm it is rejected.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 8.3 — Therapist chat UI

```
Read @docs/04-features-and-flows.md (Section 8.2) and
@docs/03-core-systems.md (Section 14).

CHUNK 8.3 — Therapist chat interface

Build the Chat tab in the client workspace:
- Message thread scoped to the selected client's booking
- Reuse the chat components from slice 7 where sensible, adapted for the
  therapist's denser working context
- Timestamps in the THERAPIST'S local timezone
- Unread count syncing between the sidebar badge and the tab
- Mark as read on view
- Socket rooms handled correctly when switching between clients
  (leave the previous room, join the new one)
- The client's mandatory first message is clearly visible as the opening
  of the conversation

CRITICAL: when the therapist switches clients, ensure socket subscriptions
are cleaned up. Messages from Client A must never appear in Client B's
thread.

Do NOT:
- Add voice or attachments

Verify: with three test clients, switch rapidly between chats and confirm
no message leakage. Confirm unread badges clear correctly.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 8.4 — Worksheets: therapist side

```
Read @docs/02-database-schema.md (Section 10.8: worksheets),
@docs/04-features-and-flows.md (Sections 7.2 and 8.3) and
@docs/03-core-systems.md (Section 17: File Storage).

CHUNK 8.4 — Worksheets: model and therapist interface

Build:
- Mongoose worksheets model per Section 10.8:
  bookingId, title, assignedFileUrl, completedFileUrl,
  status ("assigned" | "completed"), assignedAt, completedAt
- POST /api/v1/therapist/worksheets — upload and assign to a client
- GET /api/v1/therapist/worksheets/:bookingId — list for a client
- Worksheets tab (therapist side):
  * Upload form: title + file (PDF/DOC), assign to the selected client
  * List of assigned worksheets with status
  * Download the client's completed submission when available
  * Clear visual distinction between assigned and completed
- File validation: type and size limits, clear errors

FROM THE SPEC — the worksheet model is FILE UPLOAD / DOWNLOAD, not
structured in-app forms. The therapist uploads a document; the client
downloads it, completes it off-platform, and uploads it back. The
application only stores and serves files.

Do NOT:
- Build a form builder or structured in-app worksheet forms —
  that approach is explicitly deferred
- Build the client side yet (chunk 8.5)

Verify: upload a worksheet as a therapist, confirm it appears with status
"assigned" and the file opens from Cloudinary.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 8.5 — Worksheets: client side

```
Read @docs/04-features-and-flows.md (Section 7.2: Worksheets) IN FULL.

CHUNK 8.5 — Worksheets: client interface

Build the client Worksheets screen:
- List of assigned worksheets: title, date assigned, status
- Download button for each
- Upload control to return the completed file
- Clear status: "To complete" vs "Submitted"
- Upload states: idle / uploading / uploaded / error
- Ability to replace a submission before the therapist reviews it
- Empty state: "No worksheets assigned yet"
- POST /api/v1/client/worksheets/:id/submit
- Brief inline guidance explaining the flow, since download-fill-reupload
  is not self-evident: print and scan, or fill in a PDF app, or open in
  Word — whatever suits them

The spec acknowledges this flow is slightly clunky for the client. Good
guidance copy is what makes it feel intentional rather than broken.

Do NOT:
- Build in-app form filling

Verify: as a client, download an assigned worksheet, upload a completed
file, and confirm the therapist sees status "completed" with the file.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 8.6 — Journal and Private Notes

```
Read @docs/02-database-schema.md (Sections 10.9 journals and
10.10 privateNotes) and @docs/04-features-and-flows.md
(Sections 7.3 and 8.5/8.6) — read the safety requirement CAREFULLY.

CHUNK 8.6 — Journal (client) and Journal-and-Notes workspace (therapist)

Build:
- Mongoose journals model: bookingId, clientId, text, moodTag, createdAt
- Mongoose privateNotes model: bookingId, therapistId, text, timestamps
- Client Journal screen:
  * Write, edit, and delete own entries
  * Optional mood tag
  * Chronological list
  * A VISIBLE TRANSPARENCY NOTE: the client must be clearly told their
    therapist can see their journal entries. This is a spec requirement
    for trust and legal clarity.
- Therapist "Journal and Notes" tab — ONE unified workspace with
  TWO sections:
  * Section 1: the client's journal entries (read-only for the therapist)
  * Section 2: the therapist's own private clinical notes
    (create, edit, delete)

*** CRITICAL SAFETY REQUIREMENT — DO NOT COMPROMISE ***
journals and privateNotes are UNIFIED IN THE UI but STRICTLY SEPARATED
IN THE DATA LAYER:
- They are two separate collections. Never merge them.
- privateNotes must be ARCHITECTURALLY UNREACHABLE from any client-facing
  endpoint — not merely hidden in the UI.
- No client API response may ever include private note data in any form,
  so it cannot be exposed by inspecting network traffic or through a UI bug.
- Add an explicit comment in the code marking this constraint.
Hiding data in the UI is NOT sufficient. A patient seeing their
therapist's clinical notes about them would be a serious breach.

Tests (Jest): no client endpoint returns privateNotes data under any
circumstance; a client cannot access the privateNotes route even with a
valid token; a therapist cannot read another therapist's notes.

Verify: as a client, inspect every network response in DevTools while
using the portal and confirm the word "privateNotes" and any note text
never appears.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

# SLICE 9 — Sessions & Scheduling

*6 chunks.*

---

### Chunk 9.1 — Sessions model and timezone utilities

```
Read @docs/02-database-schema.md (Section 10.11: sessions) and
@docs/03-core-systems.md (Section 15, Timezone Handling).

CHUNK 9.1 — sessions model and timezone handling

Build:
- Mongoose sessions model per Section 10.11:
  bookingId, scheduledAt (UTC), zoomLink, note,
  status ("scheduled" | "completed" | "cancelled"), createdAt
- Timezone utility module:
  * Convert a local time + IANA timezone → UTC for storage
  * Convert UTC → any IANA timezone for display
  * Format for display with timezone abbreviation
  * Use a standard library (date-fns-tz or similar) — never manual
    offset arithmetic
- Session endpoints:
  * POST /api/v1/therapist/sessions — create
  * GET /api/v1/sessions/:bookingId — list (both roles)
  * PATCH /api/v1/therapist/sessions/:id — update
  * DELETE /api/v1/therapist/sessions/:id — cancel
- Zoom link validation (must be a plausible URL)

THE RULE from the spec: store ONE universal time (UTC), display converted
to whoever is looking. A therapist in London scheduling 3:00 PM their time
must appear as 10:00 AM to a client in New York — same moment, each seeing
their own clock.

Do NOT:
- Store local times in the database
- Build any scheduling UI yet

Tests (Jest): a session created at 3PM Europe/London stores the correct
UTC value and renders as the correct America/New_York local time;
daylight saving transitions handled correctly.

Verify: create a session via REST client from one timezone and read it
back in another.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 9.2 — Session scheduling UI

```
Read @docs/04-features-and-flows.md (Section 8.4: Sessions).

CHUNK 9.2 — Therapist session scheduling interface

Build the Sessions tab in the therapist's client workspace:
- "Schedule a session" form:
  * Date picker
  * Time picker — clearly labelled as the THERAPIST'S timezone
  * Live preview showing what time the CLIENT will see, in their timezone
    (this prevents scheduling mistakes)
  * Zoom link field
  * Optional note
- List of upcoming sessions for this client
- Session history (past sessions)
- Edit and cancel actions with confirmation
- Empty state when no sessions are scheduled

The client's-time preview is important — without it, a therapist scheduling
across timezones is working blind.

Do NOT:
- Build the client-side Session Hub yet (chunk 9.4)
- Build the automatic chat message yet (chunk 9.3)

Verify: schedule a session and confirm the client-time preview is accurate.
Edit and cancel it.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 9.3 — System message on scheduling

```
Read @docs/04-features-and-flows.md (Section 8.4) and
@docs/03-core-systems.md (Section 14, System Messages).

CHUNK 9.3 — Automatic chat message when a session is scheduled

Build:
- When a therapist creates a session, automatically post a message of
  type "system" into that booking's chat, for example:
  "Session scheduled for Thursday, 14 August at 6:00 PM"
- The time in the message must render in each viewer's own timezone
- Distinct visual styling for system messages — clearly not a person
  speaking
- Also post system messages when a session is rescheduled or cancelled
- These messages trigger the normal unread badge so the client is notified
- Sending the system message must not fail the session creation if it
  errors — log and continue

FROM THE SPEC: this exists so the client is notified naturally through a
channel they already watch, rather than silently updating a tab they may
not open.

Do NOT:
- Allow system messages to be sent manually by any user
- Let a chat failure roll back a successfully created session

Verify: schedule a session and confirm the system message appears in both
the client's and therapist's chat, with correct local times on each side.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 9.4 — Client Session Hub

```
Read @docs/04-features-and-flows.md (Section 7.4: Session Hub).

CHUNK 9.4 — Client Session Hub

Build the client Sessions screen — VIEW ONLY:
- Next upcoming session displayed prominently:
  date and time in the CLIENT'S local timezone, therapist name
- "Join session" button linking to the Zoom link, which becomes ACTIVE
  only near the session time (e.g. 10 minutes before until the expected end)
- Session counter: "X of 4 sessions remaining this month" with the
  reset date
- Session history
- Empty state: "No sessions scheduled yet. Your therapist will schedule
  your sessions."

CRITICAL PERMISSIONS from the spec:
- The client CANNOT create, edit, reschedule, or request sessions.
  This is deliberately therapist-controlled.
- If a client wants a change, they message the therapist in chat.
  Do NOT build a reschedule-request feature.
- Enforce this server-side, not only by hiding buttons.

Do NOT:
- Add any session request or booking capability for clients

Verify: as a client, confirm sessions are visible but not editable, times
show in local timezone, and the join button activates at the right moment.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 9.5 — Session counter integration

```
Read @docs/03-core-systems.md (Section 13, Session Counter Rules) and
@docs/01-product-and-decisions.md (Section 2: Business Model).

CHUNK 9.5 — Session counter and completion

Build:
- Mark a session "completed" — decide and implement the trigger:
  automatic once the scheduled time has passed, with a manual therapist
  override. Explain your choice in the plan.
- When a session completes, decrement subscriptions.sessionsRemaining
- Prevent it dropping below 0
- Warn the therapist when scheduling would exceed the client's remaining
  sessions — but do NOT hard-block it; flag it as a business decision for
  the client to confirm
- Display the counter in both portals
- Scheduled job or on-read check to mark past sessions completed

RULES from the spec:
- 4 sessions per billing cycle, one per week
- NO CARRY-OVER — unused sessions are forfeited
- The counter resets to 4 on successful renewal
- The counter drops to 0 when the subscription ends

Do NOT:
- Implement carry-over logic — the client explicitly decided against it

Tests (Jest): completion decrements correctly; the counter never goes
negative; renewal resets to 4.

Verify: schedule and complete a session, confirm the counter decreases in
both portals.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 9.6 — Session reminders

```
Read @docs/03-core-systems.md (Section 16: Email System).

CHUNK 9.6 — Session reminder emails

Build:
- Scheduled job checking for upcoming sessions
- Reminder email to the client 24 hours before a session:
  time shown in THEIR timezone, therapist name, Zoom link
- Reminder email 1 hour before
- Reminder to the therapist as well
- Do not send reminders for cancelled sessions
- Idempotency: never send the same reminder twice, even if the job runs
  more than once
- Log all sent reminders

Consider how the scheduled job runs in production on Render —
document the approach in ongoing.md.

Do NOT:
- Send reminders to expired or cancelled subscriptions

Tests (Jest): reminders are not duplicated; cancelled sessions produce no
reminders; timezone rendering is correct per recipient.

Verify: create a session 24 hours out, run the job manually, confirm the
email arrives with the correct local time.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

# SLICE 10 — Admin Management

*6 chunks. Completes the admin portal.*

---

### Chunk 10.1 — Client management

```
Read @docs/04-features-and-flows.md (Section 9.4: Client Management).

CHUNK 10.1 — Admin: client management

Build:
- GET /api/v1/admin/clients — list with search, filter by subscription
  status, pagination
- GET /api/v1/admin/clients/:id — full detail: profile, questionnaire
  responses, assigned therapist, subscription status and history
- POST /api/v1/admin/clients/:id/cancel-subscription — manual cancellation
  for refund disputes, complaints, or therapist departure
- POST /api/v1/admin/clients/:id/deactivate and /reactivate
- POST /api/v1/admin/clients/:id/reset-password — triggers the standard
  reset email
- UI: list, detail view, action buttons with confirmation dialogs
- Handle couple accounts correctly — show both partners' details under
  the single account

Do NOT:
- Build a "reassign therapist" feature — explicitly deferred to v2
- Add any capability to view client-therapist conversations —
  explicitly excluded per spec

Verify: view a client's full detail including questionnaire answers;
manually cancel a subscription and confirm the status change.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 10.2 — Bookings and subscriptions overview

```
Read @docs/04-features-and-flows.md (Section 9.5: Bookings / Subscriptions
Overview).

CHUNK 10.2 — Admin: bookings and subscriptions overview

Build:
- GET /api/v1/admin/bookings — every client-therapist pairing
- Table columns: client, assigned therapist, subscription status,
  start date, next billing date
- Filter by status, search by client or therapist name, sortable columns
- Pagination
- Row click → client detail
- Export to CSV (useful for the client's own bookkeeping)
- Summary row: totals by status

This is the operational "who is paired with whom right now" view.
Keep it fast and scannable rather than decorative.

Do NOT:
- Duplicate the dashboard statistics here

Verify: table displays all bookings accurately with correct statuses;
filters and search work.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 10.3 — Reviews and performance monitoring

```
Read @docs/02-database-schema.md (Section 10.12: reviews) and
@docs/04-features-and-flows.md (Section 9.6: Performance Monitoring).

CHUNK 10.3 — Reviews model and admin performance monitoring

Build:
- Mongoose reviews model per Section 10.12:
  bookingId, clientId, therapistId, stars (MANDATORY, 1–5),
  text (OPTIONAL), createdAt
- POST /api/v1/client/reviews — submit at subscription end
- GET /api/v1/admin/reviews — admin only
- Dashboard: platform-wide average rating, top-rated therapists,
  lowest-rated ("needs attention")
- Therapist detail screen in admin: that therapist's individual rating
  and full review list
- Include the spec's caveat visibly in the admin UI: because stars are
  mandatory but written reviews are optional, most ratings arrive without
  context. Star averages should be read as a TREND across many clients,
  not a verdict on any single rating.

CRITICAL: reviews are ADMIN-ONLY. They must NEVER appear on therapist
profiles, on the matching results page, or anywhere client-facing.
Verify no client-facing endpoint exposes review data.

Do NOT:
- Display ratings publicly or to therapists
- Make the written review mandatory

Tests (Jest): stars are required, text is optional; no client-facing
endpoint returns review data.

Verify: submit a test review and confirm it appears ONLY in the admin
portal.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 10.4 — Notifications system

```
Read @docs/02-database-schema.md (Section 10.13: notifications) and
@docs/04-features-and-flows.md (Section 8.8: Notifications).

CHUNK 10.4 — Notifications

Build:
- Mongoose notifications model per Section 10.13:
  userId, type ("new_message" | "worksheet_submitted" | "new_client"),
  bookingId, read, createdAt
- Create notifications on: new message received, worksheet submitted by a
  client, new client matched to a therapist
- GET /api/v1/notifications — current user's notifications, paginated
- POST /api/v1/notifications/:id/read and /read-all
- Notification bell in the therapist portal with an unread indicator
- Dropdown listing recent alerts; clicking navigates to the relevant
  client and tab
- Live updates via socket
- Cleanup job for notifications older than a sensible retention period

PURPOSE from the spec: if a therapist is viewing Client A and Client B
sends a message, the bell tells them something happened elsewhere without
forcing them to check every client manually.

Do NOT:
- Duplicate the per-client unread badges — this is cross-client awareness

Verify: as a therapist viewing one client, have another client send a
message and confirm the bell updates live and navigates correctly.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 10.5 — Admin 2FA

```
Read @docs/03-core-systems.md (Section 18: Security Requirements,
Admin-Specific Security).

CHUNK 10.5 — Two-factor authentication for admin

Build:
- TOTP-based 2FA for the admin role (compatible with Google Authenticator
  and similar apps)
- Setup flow: generate secret, display QR code, verify a code before
  enabling
- Login flow: after correct password, require the 2FA code
- Recovery codes generated at setup, displayed ONCE, stored hashed
- Ability to regenerate recovery codes
- 2FA required for admin; optional and off by default for other roles

FROM THE SPEC: because the admin can see and control everything, and
because the admin's email inbox is effectively the master key for password
resets, 2FA on the admin account is effectively non-negotiable for a
mental health platform.

Do NOT:
- Force 2FA on clients or therapists in v1
- Store recovery codes in plain text

Tests (Jest): login fails without the correct code; recovery codes are
single-use; an incorrect code is rejected.

Verify: enable 2FA on the admin account using a real authenticator app,
log out, and confirm login now requires the code. Test a recovery code.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 10.6 — Admin polish and audit

```
Read @docs/04-features-and-flows.md (Section 9) and
@docs/03-core-systems.md (Section 18).

CHUNK 10.6 — Admin portal polish

Build:
- Admin action logging surfaced as a simple viewable log:
  who did what, when, and to which record
- Consistent confirmation dialogs on every destructive action
- Bulk-safe guards: prevent accidental mass operations
- Loading, error, and empty states audited across every admin screen
- Keyboard navigation through tables
- Responsive check — admin will sometimes be used on a tablet
- A "system health" panel showing: database connection, email service,
  payment platform, and file storage status

Do NOT:
- Add bulk actions — explicitly deferred per spec
- Add multi-admin support — one admin in v1

Verify: walk through every admin screen and confirm no dead ends, no
unstyled states, and no unguarded destructive actions.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

# SLICE 11 — Subscription Lifecycle

*6 chunks. **HIGH RISK.** This is the heart of the platform.*

---

### Chunk 11.1 — Renewal handling

```
Read @docs/03-core-systems.md (Section 13: Subscription Lifecycle) IN FULL.

CHUNK 11.1 — Automatic renewal

Build the "payment succeeded (renewal)" webhook handler:
- Log the event to paymentEvents (idempotent via platformEventId)
- Extend currentPeriodEnd by one month
- Update nextBillingDate
- RESET sessionsRemaining to 4 (no carry-over — unused sessions forfeited)
- Keep status "active"
- Send a payment receipt email
- Handle the case where the subscription is not found — log loudly,
  never crash

FROM THE SPEC: renewal must be SEAMLESS. The client notices nothing.
No interruption, no re-login, no action required.

Do NOT:
- Carry over unused sessions
- Require any client action on renewal

Tests (Jest): renewal extends the period correctly; sessions reset to 4;
a duplicate renewal webhook is processed only once; the paymentEvents
ledger records every renewal.

Verify: using the payment platform's test tools, trigger a renewal and
confirm the period extends and the counter resets.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 11.2 — Failed payment and grace period

```
Read @docs/03-core-systems.md (Section 13, PAST_DUE state).

CHUNK 11.2 — Failed payment and grace period

Build the "payment failed" webhook handler:
- Log to paymentEvents
- Set subscription status to "past_due"
- Send an email: "Your payment failed — please update your card"
- Start a grace period of approximately 3 days (industry standard)
- Portal access CONTINUES during the grace period, with a persistent,
  clearly visible banner in the client portal
- Banner links to payment method update
- Scheduled job: when the grace period expires without resolution,
  transition to "expired"
- If payment succeeds during the grace period, return to "active" and
  remove the banner

Do NOT:
- Cut off access immediately on a failed payment — the grace period is
  deliberate

Tests (Jest): failure sets past_due; grace expiry transitions to expired;
successful payment during grace restores active.

Verify: simulate a failed payment, confirm the banner appears and access
continues. Then simulate recovery and confirm the banner clears.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 11.3 — Cancellation

```
Read @docs/03-core-systems.md (Section 13, CANCELLED state).

CHUNK 11.3 — Client-initiated cancellation

Build:
- POST /api/v1/client/subscription/cancel
  - Cancel the recurring subscription on the payment platform
  - Set status "cancelled", record cancelledAt
  - ACCESS CONTINUES until currentPeriodEnd — the client already paid for
    this period
  - Send a confirmation email stating exactly when access ends
- Cancellation UI in Subscription & Account:
  - Clear explanation that access continues until the paid period ends
  - Confirmation step, without dark patterns or guilt-tripping
  - Show the exact end date
- Option to reactivate before the period ends
- Handle the "subscription cancelled" webhook from the platform side
- Scheduled job transitions cancelled → expired at period end

CRITICAL from the spec: NEVER cut off access mid-paid-period. That would
be a refund nightmare and is not what any major platform does.

Do NOT:
- Use retention dark patterns — this is a mental health platform and
  guilt-tripping someone leaving therapy is unacceptable

Tests (Jest): cancellation preserves access until period end; the
transition to expired occurs at the right time; reactivation works
before period end.

Verify: cancel a test subscription, confirm access continues and the end
date is stated accurately.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 11.4 — Expired state and re-subscribe

```
Read @docs/03-core-systems.md (Section 13, EXPIRED state).

CHUNK 11.4 — Expired state and re-subscription

Build:
- When status is "expired":
  * Login STILL WORKS — the client can authenticate
  * But instead of the portal, they see a RE-SUBSCRIBE screen:
    "Your subscription has ended. Reactivate to continue with
     Dr. [Therapist Name]"
  * ALL DATA IS PRESERVED: chat history, journal entries, worksheets,
    and their therapist match
- Re-subscribe flow:
  * Reuses the existing booking and therapist — no new questionnaire
  * Creates a new checkout session
  * On success, reactivates the SAME booking and subscription record,
    resets sessions to 4
  * Everything resumes exactly where it left off
- Clear messaging that their history is safe and waiting

WHY THIS MATTERS (from the spec): preserving data means returning clients
resume seamlessly rather than starting over, the therapeutic relationship
is maintained — which is emotionally important in mental health — and the
business benefits from returning customers.

Do NOT:
- Delete any client data on expiry
- Force a returning client back through the questionnaire

Tests (Jest): expired blocks portal access but allows login; re-subscribe
restores access with history intact; the same booking is reused.

Verify: expire a test subscription, log in, confirm the re-subscribe
screen. Re-subscribe and confirm chat history is still present.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

### Chunk 11.6 — Renewal reminders and end-of-subscription review

```
Read @docs/03-core-systems.md (Sections 13 and 16) and
@docs/04-features-and-flows.md (Section 9.6).

CHUNK 11.6 — Pre-renewal reminders and exit review

Build:
- Scheduled job sending a pre-renewal reminder email a few days before
  each billing date:
  "Your subscription renews on [date]. No action needed to continue;
   cancel anytime before then."
  This is the THIRD required transparency point.
- End-of-subscription review prompt:
  * Triggered when a subscription ends (cancelled or expired)
  * Star rating MANDATORY (1–5)
  * Written review OPTIONAL
  * Presented as an OPTIONAL invitation — never a wall blocking the
    client from leaving. Forcing feedback at the end of therapy is
    inappropriate.
  * Submitted reviews route to ADMIN ONLY
- Ensure reminders are never duplicated

Do NOT:
- Block the client from leaving until they review
- Show reviews publicly

Tests (Jest): reminders sent once per cycle; review requires stars but
not text; reviews never surface client-side.

Verify: trigger the reminder job and confirm the email. Expire a
subscription and confirm the review prompt appears and can be dismissed.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

# SLICE 12 — Polish, Hardening & Launch

*6 chunks.*

---

### Chunk 12.1 — Empty states and error states audit

```
Read @docs/05-design-system.md (Sections 24.6 and 24.8) and
@docs/04-features-and-flows.md (Section 8.1).

CHUNK 12.1 — Empty state and error state audit

Build:
- Audit EVERY screen in all three portals and the public site for:
  * Empty states — designed, never blank
  * Loading states — skeletons rather than spinners where sensible
  * Error states — with a clear recovery action
  * Offline handling
- Consistent 404 and 500 pages, on-brand
- React error boundaries preventing full white-screen crashes
- Session expiry handled gracefully — never an abrupt dump to login
  without explanation

IMPORTANT: preserve the therapist portal's DELIBERATELY MINIMAL empty
state ("No clients yet. You'll see them here once they're matched with
you."). Do NOT add profile prompts or tips to it — that was an explicit
client decision.

Do NOT:
- Add motivational or gamified messaging to empty states —
  this is a mental health platform

Verify: walk every screen with no data, with a failed request, and with
the server stopped. No blank screens, no unhandled crashes.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 12.2 — Accessibility and responsive audit

```
Read @docs/05-design-system.md (Section 24.6: Quality Floor) IN FULL.

CHUNK 12.2 — Accessibility and responsive audit

Build/fix across the ENTIRE application:
- Responsive down to 360px on every page and portal screen
- Visible keyboard focus on every interactive element
- prefers-reduced-motion respected everywhere
- WCAG AA contrast: 4.5:1 body text, 3:1 large text
  (pay particular attention to gold on light backgrounds — per the spec,
  gold must never be used for body-size text on white)
- Forms: proper labels, inline validation, errors that explain how to fix
- Touch targets minimum 44x44px
- Semantic HTML: headings in order, landmarks, no div-only structure
- Screen reader pass on the critical flows: login, questionnaire,
  checkout, chat
- Skip-to-content link
- All images have appropriate alt text; decorative images have empty alt

Produce a written audit report in docs/ongoing.md listing what was
checked, what was fixed, and anything outstanding.

Do NOT:
- Mark this complete without actually testing with a screen reader and
  keyboard-only navigation

Verify: navigate the entire questionnaire and checkout flow using only
the keyboard. Run an automated accessibility checker on every page.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 12.3 — Security hardening

```
Read @docs/03-core-systems.md (Section 18: Security Requirements) IN FULL.

CHUNK 12.3 — Security hardening pass

Build/verify across the whole application:
- Rate limiting applied to every sensitive endpoint
- Input validation and sanitisation on ALL endpoints
- NoSQL injection protection
- XSS protection — audit anywhere user content is rendered
- Security headers (helmet or equivalent): CSP, HSTS, X-Frame-Options
- CORS locked to known origins only
- No secrets in code — all in environment variables
- Error responses never leak stack traces or internal details
- File upload restrictions verified: type, size, and content checks
- Every protected route re-verified for correct server-side role checks
- Access tokens confirmed never persisted to browser storage

*** RE-VERIFY THE CRITICAL SAFETY REQUIREMENT ***
Audit every client-facing endpoint and confirm privateNotes data is NEVER
returned in any form, under any condition. Document how you verified this.

Produce a written security checklist in docs/ongoing.md.

Do NOT:
- Assume earlier chunks got everything right — verify independently

Verify: attempt to access another user's data by manipulating IDs in
requests. Attempt to reach admin endpoints with a client token. Confirm
all fail with correct status codes.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 12.4 — Monitoring and performance

```
Read @docs/01-product-and-decisions.md (Section 4 and Section 19).

CHUNK 12.4 — Monitoring, logging and performance

Build:
- Sentry integrated on both frontend and backend
- Source maps configured for readable production stack traces
- Sensitive data scrubbed from error reports —
  never log message content, journal text, private notes, or passwords
- Structured backend logging with appropriate levels
- Performance pass:
  * Code splitting per route
  * Image optimisation and lazy loading
  * Bundle size review
  * Database indexes verified on all frequently queried fields
  * N+1 query audit, particularly on the therapist client list and
    chat loading
- Health check endpoint reporting database, email, and storage status
- Uptime monitoring configured

CRITICAL: this is a mental health platform. Error reports must NEVER
contain therapy content. Explicitly scrub message text, journal entries,
and private notes before sending to Sentry.

Do NOT:
- Log any personal health information anywhere

Verify: trigger a test error and confirm it reaches Sentry with no
sensitive content. Check bundle size and page load performance.

MANUAL STEP EXPECTED: Sentry DSN in .env. Tell me what to set.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 12.5 — Deployment

```
Read @docs/01-product-and-decisions.md (Section 19: Infrastructure &
Deployment) IN FULL.

CHUNK 12.5 — Production deployment

Build:
- Frontend deployment configuration for Vercel
- Backend deployment configuration for Render (always-on, NOT free tier —
  the free tier sleeps, which is unacceptable in production)
- Environment variable documentation for production
- MongoDB Atlas M10 setup notes — the spec requires this at launch
  because the free M0 tier has NO AUTOMATIC BACKUPS, which is
  unacceptable for a platform holding patient data
- Production build optimisation
- Scheduled jobs configured to run in production
- Webhook endpoint configured with the production URL
- Custom domain and DNS setup instructions for GoDaddy
- SSL verification
- CORS updated for production origins
- A deployment runbook in docs/ containing:
  * Step-by-step deploy process
  * Rollback procedure
  * Environment variable reference
  * How to verify a successful deploy

Do NOT:
- Deploy with test payment keys
- Deploy on the MongoDB free tier

Verify: deploy to a staging environment first and run the full flow
end to end before touching production.

MANUAL STEPS EXPECTED: many. List every account, key, and setting I need
to configure, in order.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md.
```

---

### Chunk 12.6 — Handover preparation

```
Read @docs/01-product-and-decisions.md (Sections 19, 20 and 21).

CHUNK 12.6 — Handover documentation and pre-launch checklist

Build:
- README.md covering: project overview, local setup, architecture,
  folder structure, and how to run tests
- Admin user guide (non-technical, written for the client):
  * How to review and approve therapist applications
  * How to manage therapists and clients
  * How to read the dashboard
  * What to do when a client reports a problem
- Account handover checklist: every service account, what it does, and
  transfer steps
- A consolidated PRE-LAUNCH BLOCKERS list gathered from ongoing.md,
  which must include at minimum:
  * Replace ALL placeholder testimonials and client-count figures
    with real data, or remove those sections
  * Replace placeholder team content and logo on the About page
  * Confirm the real 30+ specialty tag list with the client
  * Switch payment keys from test to live
  * Confirm legal pages (the old Terms and Privacy contradict this build
    in seven documented ways — see Section 21)
  * Confirm legal compliance ownership in writing
  * Verify database backups are active
- Final end-to-end test script covering every user journey

Do NOT:
- Mark the project complete while any pre-launch blocker is open

Verify: a person unfamiliar with the project can follow the README and
run it locally.

Plan first and show me. Do not write code until I approve.
When done, update @docs/ongoing.md and mark the build complete.
```

---

# Appendix A — Chunk Index

| Slice | Chunks | Focus | Risk |
|---|---|---|---|
| 0 — Foundation | 0.1–0.6 | Structure, DB, React, design system, layout, utilities | Low |
| 1 — Authentication | 1.1–1.6 | Users, login, refresh, guards, reset, login UI | **HIGH** |
| 2 — Public Pages | 2.1–2.6 | Home, About, How It Works, Contact | Low |
| 3 — Therapist Application | 3.1–3.6 | Model, uploads, 5-step form, resilience | Medium |
| 4 — Admin Core | 4.1–4.6 | Admin shell, applications, approval, dashboard, therapist mgmt, profile | Medium |
| 5 — Questionnaire & Matching | 5.1–5.6 | Client profiles, both branches, tags, matching, results | Medium |
| 6 — Payments | 6.1–6.6 | Models, checkout, webhooks, transaction, UI, tests | **HIGHEST** |
| 7 — Client Portal & Chat | 7.1–7.6 | Shell, messages, Socket.io, chat UI, first message, badges | Medium |
| 8 — Therapist Portal | 8.1–8.6 | Inbox pattern, workspace, chat, worksheets, journal + notes | **HIGH** |
| 9 — Sessions | 9.1–9.6 | Model, timezones, scheduling, system messages, hub, reminders | Medium |
| 10 — Admin Management | 10.1–10.6 | Clients, bookings, reviews, notifications, 2FA, polish | Medium |
| 11 — Subscription Lifecycle | 11.1–11.6 | Renewal, failure, cancellation, expiry, account page, reminders | **HIGH** |
| 12 — Polish & Launch | 12.1–12.6 | States, accessibility, security, monitoring, deploy, handover | Medium |

**78 chunks total.**

---

# Appendix B — Where Each Spec Section Is Built

Confirms complete coverage of the master specification.

| Spec Section | Built in |
|---|---|
| 1–3 Product, Business Model, Roles | Informs all slices |
| 4 Technology Stack | 0.1–0.6 |
| 5 Public Website | 0.5, 2.1–2.6 |
| 6 Client Onboarding | 5.1–5.6 |
| 7 Client Portal | 7.1–7.6, 8.5, 8.6, 9.4, 11.5 |
| 8 Therapist Portal | 4.6, 8.1–8.6, 9.2, 10.4 |
| 9 Admin Portal | 4.1–4.5, 10.1–10.6 |
| 10 Database Schema | Models built across all slices |
| 11 Authentication | 1.1–1.6, 10.5 |
| 12 Payment System | 6.1–6.6 |
| 13 Subscription Lifecycle | 11.1–11.6 |
| 14 Real-Time Chat | 7.2, 7.3, 8.3, 9.3 |
| 15 Matching Engine | 5.5, 9.1 (timezones) |
| 16 Email System | 1.5, 3.2, 6.4, 9.6, 11.6 |
| 17 File Storage | 3.1, 8.4, 8.5 |
| 18 Security | 1.4, 4.1, 10.5, 12.3 |
| 19 Infrastructure | 12.4, 12.5, 12.6 |
| 20 Deferred | Explicitly excluded throughout |
| 21 Open Items | Tracked in ongoing.md |
| 22 Architectural Decisions | Enforced via prompt constraints |
| 23 Therapist Form | 3.1–3.6, 4.2 |
| 24 Design System | 0.3, 0.4, 2.1–2.6, all UI chunks |

---

# Appendix C — Pre-Launch Blockers

Maintain this list in `ongoing.md` as you build. **The project is not launchable while any item is open.**

- [ ] Replace placeholder testimonials with real, consented reviews — or remove the section
- [ ] Replace invented client-count figures with real numbers — or remove the section
- [ ] Replace placeholder About page content, team bios, and logo
- [ ] Confirm the real 30+ specialty tag list with the client
- [ ] Confirm the payment platform and switch from test to live keys
- [ ] Confirm currency and pricing display (€200)
- [ ] MongoDB upgraded to M10 with automatic backups verified
- [ ] Legal pages reviewed — the old Terms and Privacy contradict this build in seven documented ways (Section 21)
- [ ] Legal compliance ownership confirmed in writing with the client
- [ ] Admin 2FA enabled and tested
- [ ] All service accounts created under the client's business email
- [ ] Real business phone number and support email published on the Contact page
- [ ] Footer LinkedIn credit URL updated to the real profile
- [ ] Full end-to-end test on production with a real payment
- [ ] Sentry verified to contain no therapy content in error reports

---

*End of build file.*
