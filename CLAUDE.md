# Cast of Mind

Online therapy platform. Clients complete an intake questionnaire, are matched to therapists by specialty tags, subscribe at €200/month, and work with their therapist in a private portal — chat, worksheets, journal, and Zoom sessions.

**Three roles, one login page:** client, therapist, admin. The backend reads `role` and redirects.

Production-grade. Handles sensitive mental health data and real money. Treat it accordingly.

---

## Stack

React (Vite) · Tailwind · Framer Motion · React Router · Redux
Node + Express · MongoDB Atlas + Mongoose · Socket.io · JWT + bcrypt · Jest
Cloudinary (files) · Resend (email) · Stripe/PayPal (payments, TBC)

## Structure

```
/client          React app
  /src/components/ui    design system primitives
  /src/pages            route components
  /src/store            Redux slices
  /src/lib              api client, utils
/server          Express API
  /routes /controllers /services /models /middleware /utils /config
/docs            specification files
```

## Commands

```bash
npm run dev      # start (run in both /client and /server)
npm test         # Jest
npm run lint
```

---

## Specification Files

**Read the relevant file before building. Do not guess at requirements.**

| File | Contents |
|---|---|
| `docs/01-product-and-decisions.md` | Product, business model, roles, stack, infrastructure, deferred features, architectural decisions |
| `docs/02-database-schema.md` | All 14 collections — read before touching any model or query |
| `docs/03-core-systems.md` | Auth, payments, subscriptions, chat, matching, email, storage, security |
| `docs/04-features-and-flows.md` | Every page, portal, and the 33-field therapist form |
| `docs/05-design-system.md` | Palette, typography, motion, page specs — read before any UI work |
| `docs/chunks.md` | The build plan. Chunks are executed in order. |
| `docs/ongoing.md` | Progress log. You update this. |

`Cast_of_Mind_Master_Spec.md` is the complete source of truth. If a split file and the master spec disagree, **the master spec wins**.

---

## Hard Rules

These are non-negotiable and apply everywhere.

**Data safety**

- `privateNotes` (therapist clinical notes) must **never** be returned by any client-facing endpoint, in any form. Not hidden in the UI — structurally absent from the response. A client seeing their therapist's notes is a serious breach.
- `paymentEvents` is an **immutable append-only ledger**. Never update or delete a record.
- Client payment creates **four documents in one transaction** (`users`, `clientProfiles`, `bookings`, `subscriptions`). Therapist approval creates **two** (`users`, `therapistProfiles`). All succeed or none do.

**Auth**

- Passwords are bcrypt-hashed. Never stored, logged, or returned in readable form. Hashes are one-way — recovery is by reset only, never retrieval.
- Access token: ~15 min, **held in memory only**. Never localStorage, sessionStorage, or persisted Redux.
- Refresh token: ~7 days, httpOnly cookie, **hashed** in the database for revocation.
- Role checks are enforced **server-side on every request**. Hiding a button is not access control.
- Login errors must never reveal whether an email exists.

**Money and time**

- Account creation happens on **webhook confirmation**, never on browser redirect.
- Webhooks are idempotent — check `platformEventId` before processing.
- All times stored in **UTC**, displayed in each viewer's IANA timezone. Never store local times.
- Currency is **EUR**. €200/month, 4 sessions, no carry-over.

**Matching**

- Matching is **specialty tags only**. Country, timezone, and treatment orientations are never filters.
- Gender preference is a **soft sort**, never a filter — it must not hide any therapist.
- Zero matches → return **all** therapists **silently**. No "no match found" message. This was a deliberate client decision.

**Privacy in logs**

- Never log or send to Sentry: message content, journal text, private notes, passwords, or payment details.

---

## Deliberately Excluded — Do Not Build

These were considered and rejected. Do not reintroduce them.

- "Continue with Google" login — accounts are system-issued, not self-created
- Admin ability to view client-therapist conversations
- Manual "add therapist" in admin — the application form is the only intake path
- Reassign therapist (deferred to v2)
- Structured in-app worksheet forms — worksheets are file upload/download
- Voice messages, attachments — text chat only in v1
- Session carry-over between billing cycles
- Public therapist ratings — reviews are admin-only
- Client-initiated session scheduling or reschedule requests
- Retention dark patterns on cancellation

---

## Working Agreement

**Plan before building.** Show the plan and wait for approval before writing code.

**Stay inside the chunk.** Each chunk in `docs/chunks.md` has a "Do NOT" list. Respect it — do not build ahead.

**When building any UI component or page, use the impeccable skill for frontend design guidance.**

**Every screen must be genuinely premium, polished and consistent — client directive, 2026-09-13.** No plain text in bare boxes. Use real visual language: considered hierarchy, drawn icons, subtle graphics, elegant styling. A stack of same-shaped bordered rectangles is not a finished screen. This is permanent and applies to portals as well as marketing pages — full detail in `.claude/rules/frontend.md`.

**At the end of every task:**

1. Update `docs/ongoing.md` — mark the chunk complete with a one-line summary of what was built and any decisions made.
2. List all manual steps required from the developer:
   - New environment variables (name + what value goes in it)
   - Packages installed
   - External account setup or API keys needed
   - Anything blocked or incomplete, and why
3. Never mark a chunk complete if any part was skipped — say so explicitly.

**Tests are required** for auth, payments, and subscription lifecycle. Elsewhere, use judgement.

**Placeholder content** (testimonials, team bios, client counts) must be centralised in one file per feature, marked `// TODO: PLACEHOLDER — REPLACE BEFORE LAUNCH`, and added to the pre-launch blockers list in `ongoing.md`.
