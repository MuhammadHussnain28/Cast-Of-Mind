# Cast of Mind — Product, Scope & Decisions

> **Part of the Cast of Mind specification set.** The complete specification is
> `Cast_of_Mind_Master_Spec.md` — this file is an extract for focused reference during development.
> If this file and the master spec ever disagree, **the master spec wins** and this file must be re-synced.

**Source:** Master Spec v1.4 · **Sections included:** 1, 2, 3, 4, 19, 20, 21, 22

What we are building, for whom, on what stack, what we deliberately are NOT building, and the reasoning behind every significant architectural choice.

**Read this file when:** starting the project, onboarding, questioning why something was designed a certain way, or checking whether a feature is in scope.

---

## 1. Project Overview

### What Cast of Mind Is

Cast of Mind is a **global online therapy platform** that connects clients experiencing mental health challenges with professional therapists matched to their specific needs.

A visitor arrives at the website seeking support, completes an intake questionnaire describing their situation and concerns, is shown therapists whose specialties align with those concerns, selects one, subscribes to a monthly plan, and then works with that therapist inside a private portal — chatting, completing worksheets, journaling, and attending scheduled video sessions.

### The Core Concept

The platform operates on **tag-based matching**. There is a fixed master list of 30+ psychiatric/therapeutic concern areas (panic attacks, depression, anxiety, grief, OCD, trauma, etc.). Therapists tag themselves with the areas they specialize in. Clients tag the concerns they are experiencing. The system matches them where those tags overlap.

### Business Context

- The business operates **outside Pakistan** and serves an **international client base**
- The developer (Muhammad Hussnain) is based in Pakistan and building this as a freelance engagement
- This is a **production-grade platform**, not a prototype — it handles sensitive mental health data, real money, and real user relationships
- Therapists may be located anywhere in the world; clients may be located anywhere in the world
- There are no geographic restrictions on client-therapist matching

### Existing Assets

- The client owns a domain purchased through **GoDaddy**
- A previous version of the website exists at `castofminds.netlify.app` (built by a different developer) — it is being fully replaced
- The old site's **Privacy Policy and Terms of Service content** will be reused
- The old database had a thin, incomplete schema and is not being carried forward

---

---

## 2. Business Model

### Subscription

- **Price:** €200/month (euro — confirmed)
- **What it includes:** 4 therapy sessions per month (one per week) plus unlimited chat access with the assigned therapist
- **Billing:** Monthly recurring subscription with automatic renewal
- **Only one plan exists.** There are no weekly, 4-weekly, quarterly, or tiered options — a single monthly plan only.
- **Sessions do NOT carry over.** Unused sessions are forfeited at the end of each billing cycle; the counter resets to 4 on renewal, and drops to 0 when a subscription ends.
- **Sessions:** Conducted via **Zoom links** shared by the therapist (video calling is NOT built into the platform)

### Revenue Split

- **40%** to the platform (Cast of Mind)
- **60%** to the therapist

**Important:** This split is an **offline business arrangement handled by Asad and his team**. It is NOT processed, calculated, or tracked by the application. Therapist earnings and payouts are entirely outside the system's scope.

### Session Model

- A "session" is a scheduled video meeting conducted on Zoom
- The therapist creates the session (date, time, Zoom link) from their portal
- The client sees it in their Session Hub and joins by clicking
- The client **cannot** schedule, edit, or request sessions through the system — this is deliberately therapist-controlled
- If a client wants to change a session time, they message the therapist via chat, and the therapist reschedules

### Changing Therapist

**A client cannot switch therapists themselves.** There is no in-app "change therapist" feature. If a client wants a different therapist, they must contact the business directly via the published contact details (email / phone), and Asad handles it manually. Therapist reassignment as a system feature is deferred — see [Section 20](#20-deferred-to-future-versions).

---

---

## 3. User Roles

The platform has exactly **three roles**, all sharing a single login page:

| Role | How they get an account | What they access |
|---|---|---|
| **Client** | Auto-created when their payment succeeds | Client Portal |
| **Therapist** | Auto-created when admin approves their application | Therapist Portal |
| **Admin** | Created manually (one account, for Asad) | Admin Portal |

### Single Login Page Behavior

There is **one login page** at `/login`. A user enters email + password. The backend:
1. Finds the user in the `users` collection by email
2. Verifies the password against the stored hash
3. Reads their `role` field
4. Redirects them to the appropriate portal

Users never select their role — the system determines it.

**Rule:** One email = one account = one role. The same email cannot exist as both a client and a therapist.

### Important: No Self-Registration

Clients and therapists **cannot create their own accounts**. Accounts are **system-issued**:
- Clients get an account only after successful payment
- Therapists get an account only after admin approval

This is why **"Continue with Google" is deliberately NOT included** — it is designed for self-service signup, which contradicts the system-issued account model and would create identity conflicts (e.g., a Google email different from the subscription email).

---

---

## 4. Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| **Frontend** | React (Vite) | Client decision. Single-page app for both public pages and portals |
| **Styling** | Tailwind CSS | Utility-first, pairs well with the design tokens in Section 24 |
| **Animation** | Framer Motion | Powers the breathing-rhythm motion language (Section 24.4) |
| **Routing** | React Router | Client-side routing for public pages and portals |
| **State management** | Redux | Developer's existing preference |
| **Backend** | Node.js + Express | Developer has existing expertise; NestJS considered and rejected as unnecessary complexity for a solo build |
| **Database** | MongoDB (Atlas) | Flexible document model suits varied questionnaire data; developer has strong expertise |
| **ODM** | Mongoose | Schema definition, validation, and `.populate()` for live name lookups |
| **Real-time** | Socket.io | For live chat, unread indicators, instant notifications |
| **Payments** | Stripe and/or PayPal (see [Section 12](#12-payment-system)) | Platform choice pending final client confirmation |
| **File storage** | Cloudinary | Worksheets, therapist license documents, profile photos |
| **Email** | Resend | Transactional email (credentials, notifications, reminders) |
| **Authentication** | JWT (access + refresh tokens) | Custom implementation, not a managed auth service |
| **Testing** | Jest | Required coverage on auth, payments, and subscription lifecycle |
| **Frontend hosting** | Vercel | Free tier sufficient initially; custom domain supported |
| **Backend hosting** | Render or Railway | ~$7/month for always-on (free tier sleeps, unacceptable for production) |
| **Error monitoring** | Sentry | Catch errors before users report them |

### Stack Rationale

**Why MongoDB over SQL:** Questionnaire responses vary in shape (individual vs. couple paths), chat and journal data are naturally document-shaped, and MongoDB supports multi-document transactions for the critical "create account + booking + subscription atomically" operation. Financial safety — the usual argument for SQL — does not apply here because **the payment platform handles all actual money movement**; the database only records what already happened.

**Why Express over NestJS:** For a solo developer with existing Express expertise, NestJS's enforced structure adds a learning curve without meaningful benefit at this scale.

**Why React (not Next.js):** Client decision, made for full control over the frontend and to stay within the developer's strongest skillset.

> **Known trade-off, recorded deliberately:** a plain React SPA renders as an empty shell before JavaScript loads, which makes public marketing pages harder for search engines to index than server-rendered pages would be. This affects the **public pages only** (Home, About, How It Works, Join as a Therapist, Contact) — the portals are behind login and never need indexing.
>
> **Mitigations available if organic search traffic matters later:** pre-rendering the public routes at build time, adding `react-helmet` for per-page meta tags, generating a sitemap, and ensuring fast load performance. None of these require abandoning React. If SEO becomes a business priority, migrating the public pages alone to a server-rendered setup is possible without touching the portals.

**Why Jest:** Standard, well-documented, works for both backend logic and React components. Full coverage is not the goal — the requirement is meaningful tests on the three areas where bugs cost real money or trust: **authentication, payments, and subscription lifecycle**.

---

---

## 19. Infrastructure & Deployment

### Account Ownership Model

| Phase | Whose accounts |
|---|---|
| **Development** | The developer's own accounts (free tiers). Nothing risks the client's setup; test data doesn't consume the client's limits. |
| **Production / Handover** | A fresh, parallel set of accounts created under **Asad's business email**. Same code, different connection strings and API keys via environment variables. |

**Why:** ownership clarity from day one, the client's data and billing are theirs, clean handover with nothing to migrate, and the client can revoke developer access at any time by changing passwords.

### Cost Breakdown

| Service | Free tier | Paid when needed |
|---|---|---|
| Domain | None | ~$12/year |
| Vercel (frontend) | 100 GB bandwidth/month | ~$20/month at high traffic |
| Backend hosting | Limited (sleeps when idle) | **~$7/month — upgrade at launch** |
| MongoDB Atlas | 512 MB (M0) | **~$9/month (M10) — recommended at launch, see below** |
| Cloudinary | 25 credits/month | From ~$99/month at large scale |
| Resend | 3,000 emails/month | ~$20/month at high volume |
| Socket.io | Free (runs on own server) | No separate cost |
| Sentry | 5,000 errors/month | ~$26/month |
| SSL | Free | Never |

**Realistic launch cost:** ~$16–25/month (backend always-on + MongoDB M10).

### CRITICAL: Database Backups

**MongoDB Atlas free tier (M0) does NOT include automatic backups.** For a production platform holding patient data, launching without backups is an unacceptable risk.

**Recommendation: launch on M10 (~$9/month), which includes automated continuous backups.** This is a "do not cut this corner" item.

**How databases actually get corrupted** (it is rarely dramatic):
- A bug in application code — e.g., a "cancel one subscription" function with a flaw that sets *all* subscriptions to cancelled
- A server crash mid-write leaving half-written data
- Human error running a wrong command directly against the database
- A failed schema migration mangling existing data

In each case, the cause is usually **your own code or human mistake**, not MongoDB failing. Backups mean Tuesday's bad script can be undone by restoring Monday's snapshot.

### Bandwidth Explained

Bandwidth = **total data sent to visitors over a month** (like a mobile data plan), *not* how many people visit simultaneously. Handling many simultaneous visitors is **concurrency**, which Vercel manages automatically.

Example: a homepage load ≈ 500 KB. 1,000 visitors ≈ 500 MB. Vercel's 100 GB free tier handles tens of thousands of visitors.

### Upgrade Path

All services in this stack have **frictionless free→paid upgrades** — a plan change in the dashboard, no code changes, no downtime, no data migration. MongoDB Atlas migrates data automatically when upgrading cluster tiers.

**Practical tip:** set **billing alerts** on every service (e.g., notify at 80% of free tier) so the client is never surprised by a bill.

### Domain Setup

The client's domain is registered with **GoDaddy**. To connect it to Vercel, DNS records must be added in the GoDaddy dashboard. This requires either the client's GoDaddy access or a 10-minute guided call. This happens **once, at launch**.

### Account Creation & OTP Handling

When creating accounts under Asad's business email, verification codes (OTPs) are sent to his inbox, which the developer cannot access.

**Recommended approach: a screen-share session.** Developer and client join a call; the client shares their inbox screen and reads out codes as the developer creates each account. One focused hour covers all services. Secure, professional, no password sharing.

**Credential storage:** use a password manager (Bitwarden) during setup, then export cleanly to the client at handover. Never store credentials in plain text files or messaging apps.

---

---

## 20. Deferred to Future Versions

These were explicitly discussed and **consciously deferred** — they are not oversights.

| Feature | Why deferred |
|---|---|
| **Voice messages in chat** | Moderate build complexity (recording, compression, upload, player UI, edge cases). Text fully delivers the therapeutic conversation for v1. **The chat data model must be structured so voice/attachments can be added later without a rebuild.** |
| **Native mobile app (React Native)** | Significant separate build. **Not mentioned in the client proposal** — v1 is web only. |
| **PWA capability** | Small effort (~1 week); can be added post-launch so the site installs to a phone home screen. Note: PWAs **cannot** be published to the App Store or Play Store. |
| **RAG-based AI chatbot** | **Confirmed as a client requirement**, but should be built *after* launch when real user questions exist to inform it. Requires careful guardrails so it never gives clinical advice or mishandles a crisis. |
| **Reassign therapist** | Explicitly deferred. Raises unresolved questions: does the new therapist see old chat history? Do the previous therapist's private notes carry over (they should not)? Too complex for v1. |
| **Video calls built into the platform** | Zoom works and is trusted. Building video would add weeks and real cost. |
| **Peer support / group forum** | Requires moderation, creates legal liability for user-generated content on a mental health platform, and risks unattended crisis posts. Does not fit the private 1-on-1 model. |
| **Public therapist ratings/reviews** | Reviews are collected but routed to admin only. Public display creates moderation burden, unfairness (severe cases score lower), and matching distortion. |
| **Multi-admin with permission levels** | One admin (Asad) at launch. |
| **Activity log / audit trail** | Useful at team scale; overkill for a single admin. |
| **Bulk actions, broadcast messaging, deep analytics, support ticket system** | Not needed at launch volume. |
| **Therapist earnings/payouts in-system** | Handled entirely offline by Asad's team. |
| **Availability calendar** | Working hours collected at application as structured day/time ranges; a full calendar system is unnecessary since sessions are therapist-scheduled. |
| **Structured in-app worksheet forms** | The previous platform used fixed clinical intake forms typed directly into the site. Building this requires a form-builder for therapists — significantly more work than the file upload/download model chosen for v1. **Open question for the client** (see Section 21). |
| **Session-type preference for clients** | The old platform asked clients to choose a session format ("Voice only", etc.). Not needed — all sessions are Zoom, and the subscription page simply states everything that is included. |
| **Activity scheduling (yoga, wellness sessions)** | The old platform had a `create activities` collection for scheduling activities like yoga. Out of scope for v1. |

---

---

## 21. Open Items Requiring Client Confirmation

| Item | Detail |
|---|---|
| **Payment platform** | Stripe, PayPal, both, or Payoneer Checkout? (If Payoneer — confirm business entity eligibility.) |
| **Worksheet format** | File upload/download (current design) or structured in-app forms (as the old platform had)? This materially changes the build. |
| **Legal compliance ownership** | Confirm **in writing** that the client is responsible for legal compliance (GDPR/HIPAA as applicable), privacy policy content, and terms of service. See note below. |
| **Legal pages rewrite** | The existing Terms & Conditions and Privacy Policy from the old site contain claims that contradict this build (see note below). A fresh set will likely be needed before launch — deferred as a separate task. |

### Legal Compliance Ownership — What This Means

**Definition:** who is legally answerable if the platform breaches a data-protection law.

**Example:** a client in Germany exercises their GDPR right to have all their data deleted. The request goes unanswered. They complain to their national data-protection authority, which investigates and issues a fine.

**Who is liable:** the business — Asad. He is the "data controller," owns the business, and sets the policies. The developer implements features as specified.

**Why it still matters to the developer:** if the topic is never raised and something goes wrong, the client could argue the developer should have advised them. One line in the engagement agreement resolves this permanently:

> *"Client is responsible for legal compliance, privacy policy content, and terms of service. Developer implements features as specified."*

### Note: Old Legal Pages Conflict With This Build

The client has confirmed the old Terms & Conditions and Privacy Policy are **not authoritative** and should not be treated as constraints on the build. They contain overstated or inaccurate claims. Known conflicts, recorded for whoever eventually rewrites them:

| Old legal text claims | This build actually does |
|---|---|
| Business located in Karachi, Pakistan | Business operates **outside Pakistan** |
| Clients may switch therapists themselves | Clients **cannot** switch; they contact the business to request a change |
| Weekly, 4-weekly, and quarterly subscription options | **Monthly only** — 4 sessions, one per week |
| Journal sharing is opt-in by the client | Therapist **always** sees journal entries |
| Matching considers state/country for licensing | Country is **not** a matching filter |
| A "Clinical Operations Team" may review conversations for quality assurance | **No such review capability exists** — no admin conversation-viewing feature |
| Emergency contact collected at signup | **Not currently collected** — worth considering, but not in scope |

### Recently Resolved

| Item | Resolution |
|---|---|
| ~~Currency~~ | **Confirmed — EUR.** €200/month. |
| ~~Business registration country~~ | **Confirmed — operates outside Pakistan.** Stripe and PayPal are therefore both viable. |
| ~~Taxpayer ID number~~ | **Confirmed — include it, as an optional field.** |
| ~~Treatment orientations list~~ | **Confirmed — near-duplicates removed.** Clean 33-item list in [Section 23](#23-therapist-application-form--complete-field-specification). |
| ~~Session carry-over~~ | **Confirmed — no carry-over.** Unused sessions forfeited; counter resets to 4 on renewal, drops to 0 when subscription ends. |
| ~~Zoom accounts~~ | **No development impact.** The system stores whatever URL the therapist enters — personal, business, or shared account is functionally identical. Client will decide once the product is ready. |
| ~~Footer credit~~ | **Confirmed — "Developed by Muhammad Hussnain", linked to the developer's LinkedIn profile.** Added now; will be shown to the client at the next meeting and removed on request. |
| ~~Password storage~~ | **Confirmed — bcrypt hashed for all roles.** Plain-text storage was considered and rejected (see [Section 22](#22-key-architectural-decisions--rationale)). |
| ~~Admin conversation viewing~~ | **Not being built.** Misconduct will be reported by clients via email and a published phone number, and handled off-platform. |
| ~~Therapist gender preference~~ | **Confirmed — included.** Added to client questionnaire as soft prioritisation in matching. |
| ~~5-step therapist application fields~~ | **Finalized — 33 fields.** See [Section 23](#23-therapist-application-form--complete-field-specification). |
| ~~No-match fallback behaviour~~ | **Confirmed — show all therapists silently, no message.** |
| ~~Availability format~~ | **Confirmed — structured day toggles + time ranges + optional free-text note.** |
| ~~Therapist type field format~~ | **Confirmed — free text with ~50 character limit.** |
| ~~Therapist password self-edit~~ | **Resolved.** The therapist sets their own password on the application form; it carries over on approval. Not editable from the profile; recoverable via "Forgot password". The admin never sees it. |

---

---

## 22. Key Architectural Decisions & Rationale

A record of significant decisions and *why* they were made, so future work doesn't accidentally reverse them.

### Why one `users` collection instead of separate client/therapist/admin collections

The platform uses **one shared login page** where the backend reads a role field and redirects. That only works cleanly if all three roles share one collection with one email index — otherwise login would check three places. Role-specific detail lives in separate profile collections linked by `userId`, keeping the login record small and fast.

### Why `users` is separate from profile collections

`users` answers only "who is logging in, what's their password, what's their role." Profile collections hold heavy, role-specific data (a therapist profile is large; an admin has almost none). Merging them would produce wildly different-shaped documents in one collection and make login queries drag through irrelevant data.

### Why `therapistApplications` is separate from `therapistProfiles`

An applicant is not a therapist. Keeping applications separate means `therapistProfiles` contains **only real, approved, working therapists** — never half-empty records for rejected or pending applicants. Approval *creates* new records; the application does not transform into a profile.

### Why `privateNotes` is a separate collection, not a field

Safety. Physical separation makes it structurally impossible for a client-facing query to touch clinical notes. Hiding data in the UI is insufficient — a bug or network inspection could expose a hidden field. Separate collection = the client's app never receives the data at all.

### Why `paymentEvents` is a separate collection, not a field on `subscriptions`

A field would be **overwritten** on every renewal, destroying history. Payments are a stream of events over time; disputes require the full permanent trail. `subscriptions` = current state (changes). `paymentEvents` = immutable ledger (append-only, never edited).

### Why IDs are stored without copied names

Two approaches were considered:
- **Store ID only, look up the name live** → always current, never stale
- **Store ID + a copy of the name** → faster (no lookup) but the copy is frozen at write time and becomes stale if the user later changes their name

At this platform's scale the extra lookup is negligible, so **store IDs only**. No name fields are added anywhere; names are always read live from `users`.

**Implementation pattern (Mongoose):**

```js
// Schema — only the reference is stored
senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }

// Query — name pulled live at display time
const messages = await Message.find({ bookingId })
  .populate('senderId', 'email');
```

If a user later changes their name, every historical record automatically reflects the new name, because no stale copy exists anywhere.

### Why "Continue with Google" is excluded

Accounts are **system-issued** (created on payment or admin approval), not self-created. Google login is designed for self-service signup and would create identity conflicts — e.g., a Google email different from the subscription email producing two identities for one person.

### Why the therapist portal uses an inbox pattern

A therapist thinks *"who am I working with right now,"* not *"let me open the chat feature and pick a person."* Organizing by client (sidebar) with feature tabs inside matches their actual mental model, and avoids the impossible alternative of duplicating every feature tab per client.

### Why the therapist empty state is minimal

Prompts like "complete your profile" or "add specialty tags to get matched" would create false uncertainty — the therapist already submitted everything in the 5-step application, and their profile was auto-created on approval. A single clear line avoids implying something is wrong.

### Why sessions are therapist-controlled and view-only for clients

Simplicity and clinical appropriateness. The therapist owns scheduling; clients request changes via chat rather than through a separate request-and-approve feature that would add complexity for little gain.

### Why reviews are admin-only

Public ratings on a mental health platform create moderation burden, unfairness to therapists handling severe cases, matching distortion (clients choosing by score rather than specialty fit), and recruitment friction. Admin-only preserves the quality signal without those costs.

---
