# Cast of Mind — Master Project Specification

> **Single source of truth.** This document contains the complete product vision, architecture, feature set, business logic, and technical decisions for the Cast of Mind platform. It is written to be self-contained: any developer or AI reading this document should have full context to work on the project without additional background.

**Document version:** 1.4
**Last updated:** August 2026
**Developer:** Muhammad Hussnain
**Client:** Asad (Founder, Cast of Mind)
**Status:** Pre-development — planning complete, ready to begin implementation

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Business Model](#2-business-model)
3. [User Roles](#3-user-roles)
4. [Technology Stack](#4-technology-stack)
5. [Public Website](#5-public-website)
6. [Client Onboarding Flow](#6-client-onboarding-flow)
7. [Client Portal](#7-client-portal)
8. [Therapist Portal](#8-therapist-portal)
9. [Admin Portal](#9-admin-portal)
10. [Database Schema](#10-database-schema)
11. [Authentication & Authorization](#11-authentication--authorization)
12. [Payment System](#12-payment-system)
13. [Subscription Lifecycle](#13-subscription-lifecycle)
14. [Real-Time Chat Architecture](#14-real-time-chat-architecture)
15. [Matching Engine](#15-matching-engine)
16. [Email System](#16-email-system)
17. [File Storage](#17-file-storage)
18. [Security Requirements](#18-security-requirements)
19. [Infrastructure & Deployment](#19-infrastructure--deployment)
20. [Deferred to Future Versions](#20-deferred-to-future-versions)
21. [Open Items Requiring Client Confirmation](#21-open-items-requiring-client-confirmation)
22. [Key Architectural Decisions & Rationale](#22-key-architectural-decisions--rationale)
23. [Therapist Application Form — Complete Field Specification](#23-therapist-application-form--complete-field-specification)
24. [Frontend Design Specification](#24-frontend-design-specification)

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

## 5. Public Website

Seven public pages plus legal pages in the footer.

### Navigation Bar (5 items)

| Page | Route | Purpose |
|---|---|---|
| **Home** | `/` | Marketing, emotional hook, trust building, primary CTA to "Get Started" |
| **How It Works** | `/how-it-works` | Step-by-step explanation of the process to reduce anxiety and hesitation |
| **About** | `/about` | Story of Cast of Mind, mission, and team (team page merged in — no separate team page) |
| **Join as a Therapist** | `/join-as-therapist` | Therapist recruitment — the 5-step application form |
| **Contact** | `/contact` | Simple contact form (Name, Email, Message) for general questions |

### Right side of navbar (visually separated)

| Item | Route | Purpose |
|---|---|---|
| **Login** | `/login` | Single unified login for all three roles |
| **Get Started** (highlighted button) | `/questionnaire` | Primary CTA leading to intake |

### Footer

- Privacy Policy (`/privacy`)
- Terms of Service (`/terms`)
- Refund Policy (`/refund`)
- **Developer credit — confirmed:** a small, discreet "Developed by Muhammad Hussnain" line, hyperlinked to the developer's **LinkedIn** profile. (LinkedIn rather than WhatsApp — a personal chat link on a professional mental-health site looks informal and exposes a personal number to every visitor.)

### Pages Not in Navbar

| Page | Route | Reached from |
|---|---|---|
| Questionnaire flow | `/questionnaire` | "Get Started" button |
| Therapist matches | `/matches` | After questionnaire completion |
| Therapist detail | `/therapist/[id]` | Clicked from matches |
| Checkout | `/checkout` | After selecting a therapist |
| Payment success | `/welcome` | After payment platform confirms |
| Client/Therapist portal | `/portal` | After login (content by role) |
| Admin portal | `/admin` | After login (admin role) |
| 404 | catch-all | Auto |

### Design Decisions Made

- **"How It Works" replaced "Why Join Us."** Rationale: an anxious visitor's blocker is "I don't understand what will happen," not "why should I pick you." Clarity converts better than persuasion for this audience.
- **Team page merged into About.** A standalone team page for a small business looks either empty or redundant. One page with depth beats two thin pages.
- **Contact split from therapist applications.** The old site had one form doing three jobs (general contact, therapist joining, client support) which is why it collected irrelevant fields like date/time/gender for a simple question. Now: `/contact` is short and simple; therapist applications have their own dedicated page and 5-step form.
- **Legal pages in footer, not navbar.** Standard practice.
- **Two "Get Started" CTAs on the homepage** — one in the hero (for visitors ready to act) and one after the process explanation (for visitors who needed context first).

> **Visual direction, palette, typography, motion language, and page-by-page section breakdowns are specified in [Section 24](#24-frontend-design-specification).**

---

## 6. Client Onboarding Flow

### The Complete Journey

```
Visitor lands on homepage
        ↓
Clicks "Get Started"
        ↓
Completes intake questionnaire
        ↓
System matches by specialty tags
        ↓
Views matched therapist profiles
        ↓
Selects one therapist
        ↓
Proceeds to checkout (€200/month)
        ↓
Payment platform processes payment
        ↓
Webhook confirms payment succeeded
        ↓
System creates: user + clientProfile + booking + subscription (atomic)
        ↓
Credentials emailed to client
        ↓
Client logs in → Client Portal
        ↓
Client sends mandatory first message
```

### Questionnaire Fields

The questionnaire **branches** based on whether the client is an individual or a couple.

**First question:** Individual or Couple?

#### If INDIVIDUAL:
- Country
- City
- Gender
- Client name
- Age
- Email
- Relationship status
- **Concern tags** (select 3–4 from the master list of 30+)
- **Therapist gender preference** — Male / Female / No preference

#### If COUPLE:
- Country *(shared)*
- City *(shared)*
- Email *(shared — one account)*
- Relationship status *(shared)*
- **Partner 1:** Name, Age, Gender
- **Partner 2:** Name, Age, Gender
- **Concern tags** *(shared — select 3–4 from the master list)*
- **Therapist gender preference** *(shared)* — Male / Female / No preference

### Therapist Gender Preference

**Confirmed for inclusion.** Clients may state a preference for their therapist's gender. This is a common and legitimate preference in therapy.

**Effect on matching:** this acts as a **soft prioritisation, not a hard filter** — see [Section 15](#15-matching-engine). Preferred-gender therapists appear first; others still appear below. If "No preference" is selected, gender plays no role at all.

### Critical Rule: Couples Share ONE Account

**Confirmed by Asad.** A couple receives a single account: one `users` record, one `clientProfile` (containing both partners' data), one `booking`, one `subscription`. They log in together with one set of credentials.

### Concern Tag Selection

- Clients select **3–4 tags** (minimum 1)
- Therapists also select **3–4 tags** on their application
- Both pull from the **same fixed master list of 30+ terms**
- Symmetrical limits keep matching reliable

---

## 7. Client Portal

Five features. The client portal is organized **by feature** (unlike the therapist portal, which is organized by client) because a client has exactly one therapist.

### 7.1 Chat

- Real-time text messaging with their assigned therapist
- **Mandatory first message:** before normal chat begins, the client must send an opening message describing their feelings, emotions, current experience, and challenges. This is **free text** (not a structured form) — deliberately, to let them express themselves naturally. It gives the therapist immediate context and means no conversation starts cold.
- Unread message indicators
- **Therapist working hours displayed** at the top of the chat so the client knows when their therapist is online
- If the therapist is offline, messages simply wait — no blocking, no "unavailable" barrier. The therapist replies when back online.
- **Text only for v1.** Voice messages deferred (see [Section 20](#20-deferred-to-future-versions)).

### 7.2 Worksheets

**Model: file upload/download (not structured in-app forms).**

The complete flow:

1. **Therapist uploads** a worksheet document (PDF/DOC) and assigns it to a client
2. **Client sees it** in their Worksheets tab — title, date assigned, download button
3. **Client downloads** it to their own device
4. **Client fills it out off-platform**, using whichever method suits them:
   - Print → handwrite → photograph or scan
   - Open in a PDF app and type/annotate (if fillable)
   - Open in Word and type answers (if .docx)
5. **Client uploads the completed file back** through the same tab → stored on Cloudinary → `completedFileUrl` populated
6. **Therapist sees** the status flip from `assigned` to `completed` and downloads to review

**The application's responsibility is limited to:** storing the file, serving it for download, accepting the returned file, and showing status to both parties. **The actual filling-in happens outside the app** on the client's own device.

**Trade-off (accepted):** simple to build and maximally flexible for therapists who already have their own materials, at the cost of a slightly clunkier client experience (download → fill → re-upload) compared to typing directly in the portal.

> The previous version of the platform used **structured in-app forms** instead (fixed clinical intake questions typed directly into the site — age/gender, issues experienced, prior treatment history, medical history, family history, developmental history, educational history, work history). This approach is **deferred** — see [Section 20](#20-deferred-to-future-versions) — and remains an open question for the client (see [Section 21](#21-open-items-requiring-client-confirmation)).

### 7.3 Journal

- Client writes journal entries about their feelings and experiences
- **The assigned therapist always has full access** to all journal entries (no per-entry privacy toggle)
- **A visible transparency note must be shown** to the client in the UI (e.g., "Your therapist can see your journal entries") — required for trust and legal clarity
- No client-side private notes — the journal is the only client writing space

### 7.4 Session Hub

- **View-only** for the client
- Shows upcoming sessions scheduled by the therapist: date, time, Zoom link
- **Timezone auto-conversion:** the therapist enters a time in their timezone; the client sees it in their own local time
- Session counter: sessions used/remaining this billing cycle
- Session history
- The "Join" button becomes active when the session time arrives
- Client **cannot** create, edit, or request sessions

### 7.5 Subscription & Account

- View profile information
- Subscription status (active / past due / cancelled / expired)
- Next billing date
- Payment method management
- Cancel subscription
- **Auto-renewal transparency notice** (see [Section 13](#13-subscription-lifecycle))

---

## 8. Therapist Portal

Eight features. The therapist portal uses an **inbox pattern** — organized by client first, features second.

### The Architecture (Critical to Understand)

A therapist may have multiple clients. The portal does **not** create separate tabs per client. Instead:

- **Left sidebar (persistent):** list of the therapist's clients with unread badge counts
- **Right side (dynamic):** clicking a client loads *that client's* full workspace
- The same set of tabs always exists; only the data changes based on who is selected

This is the same pattern as an email inbox: one list, one detail pane, content swaps on selection.

### 8.1 Client List Sidebar *(global)*

- List of all matched clients
- Unread message count badges per client
- Last activity indicator
- **Empty state (minimal, by explicit decision):** if the therapist has no clients, show only *"No clients yet. You'll see them here once they're matched with you."*
  - **Deliberately NOT shown:** profile completion prompts, "boost your visibility" tips, specialty tag suggestions. Rationale: the therapist already submitted everything in the 5-step application, and their profile was created automatically on approval. Prompting them to "complete" it would create false uncertainty.

### 8.2 Chat *(per client)*

- Real-time text messaging, scoped to the selected client
- Text only for v1

### 8.3 Worksheets *(per client)*

- Upload and assign worksheets
- View completed submissions returned by the client

### 8.4 Sessions *(per client)*

- Create a session: date, time, Zoom link, optional note
- **On scheduling, an automatic system message posts to the chat** (e.g., "Session scheduled for Thursday, Aug 14 at 6:00 PM") so the client is notified naturally
- View session history

### 8.5 & 8.6 Journal & Notes *(per client — unified workspace)*

**Feature name: "Journal and Notes"**

This is a **single UI area with two sections**:
1. **Client's journal entries** — written by the client, readable by the therapist
2. **Private clinical notes** — written by the therapist, **never visible to the client**

#### CRITICAL SAFETY REQUIREMENT

These two are **unified in the UI but strictly separated in the data layer**:

- They are stored in **two separate collections** (`journals` and `privateNotes`)
- Private notes must be **architecturally unreachable** from the client side — not merely hidden in the UI
- The client's API responses must **never include private note data at all**, so it cannot be exposed by inspecting network traffic or a UI bug

**Rationale:** merging them into one data structure is one bug away from a patient seeing their therapist's clinical notes about them — a serious breach of trust and a liability on a mental health platform. The unified UI gives the therapist a convenient workflow (read the client's feelings, write observations beside them) while the separated storage guarantees safety.

### 8.7 Profile *(global)*

**Displayed (read-only):**
- Full name and professional title
- Credentials / qualifications
- Specialty tags
- Languages spoken
- Country and timezone
- Working hours / availability (collected during application)
- Member since date

**Editable by the therapist:**
- Profile photo
- Bio

**NOT editable by the therapist (admin-controlled):**
- Email address
- Specialty tags
- Credentials / qualifications
- Name and professional title
- **Password** — set once on the application form, carries over on approval. Not editable from the profile. Recoverable only via "Forgot password." **Confirmed by Asad.**

**Rationale for locking these:** matching integrity and client trust depend on specialties and credentials being admin-verified. If therapists could freely edit them, the verification process would be meaningless.

**Practice stats (simple counts only):**
- Number of active clients
- Total clients helped to date
- Sessions scheduled / completed

> **Scope warning:** these must remain **simple counts**. Charts, trends, and analytics belong in the Admin Portal. Adding them here would duplicate the admin dashboard inside the therapist portal.

### 8.8 Notifications *(global)*

- Bell icon with indicator
- Triggers: new message from any client, new worksheet submission, new client matched
- Clicking an alert navigates to the relevant client's view
- Purpose: if the therapist is viewing Client A and Client B messages, they need to know without manually checking every client

---

## 9. Admin Portal

Six features. Accessed at `/admin` (separate route from `/portal` for security clarity).

### 9.1 Stats Dashboard

The business command center. Asad should understand his business at a glance in ~20 seconds.

**Money:**
- Monthly recurring revenue (active subscriptions × price)
- Active subscriptions count
- New subscriptions this month vs. last month
- Cancelled / expired this month (churn)

**People:**
- Total clients (active vs. inactive)
- Total therapists onboarded
- Pending therapist applications (with count badge — this is an action item)

**Activity:**
- Sessions scheduled this month
- New signups trend

**Quality:**
- Platform-wide average therapist star rating
- Recent reviews feed

> Keep to counts and simple trends. This is an overview, not an analytics suite.

### 9.2 Therapist Applications

- List of submitted applications with status (`pending` / `approved` / `rejected`)
- View full submission including uploaded credential documents
- **Approve** → automatically creates the therapist's `users` record + `therapistProfile`, generates a temporary password, and emails credentials
- **Reject** → application marked rejected, no account created, record retained

**This is the ONLY way therapists enter the platform.** There is no manual-add feature (see decision below).

### 9.3 Therapist Management

- List of all onboarded therapists
- View full profile
- **Edit the admin-controlled fields** (specialties, credentials, name/title, email)
- View active client count and average rating
- View individual reviews for that therapist
- Deactivate / reactivate a therapist
- Reset a therapist's password

### 9.4 Client Management

- List of all clients
- View client profile and intake questionnaire responses
- See subscription status and assigned therapist
- Manually cancel a subscription (refund disputes, complaints, therapist departure)
- Deactivate a client (abuse, spam)
- Reset a client's password

> **Note:** "Reassign therapist" is **deferred to v2** by explicit decision — it adds significant complexity around what happens to existing chat history, worksheets, journals, and private notes.

### 9.5 Bookings / Subscriptions Overview

- Table of every client-therapist pairing
- Columns: client, assigned therapist, subscription status, start date, next billing date
- Asad's operational "who is paired with whom right now" view

### 9.6 Performance Monitoring

Driven by end-of-subscription reviews.

**Review collection:**
- Triggered when a subscription ends
- **Star rating is MANDATORY**
- **Written review is OPTIONAL**
- Routed to **admin only** — never displayed on therapist profiles or publicly

**Display split:**
- **On the dashboard:** high-level only — platform average rating, top-rated therapists, lowest-rated ("needs attention")
- **In therapist management:** each therapist's individual rating and full review list

**Rationale for admin-only reviews:** public reviews on a mental health platform create moderation burden, fairness problems (therapists handling severe cases may score lower through no fault of their own), matching distortion (clients would choose by rating rather than specialty fit), and therapist recruitment friction.

> **Important caveat for Asad:** because stars are mandatory but written reviews are optional, most ratings will arrive without context. Star averages should be read as a **trend signal across many clients**, not a verdict on any single rating.

### Decisions Made About the Admin Portal

**Manual "Add Therapist" — REMOVED.** Originally proposed, then removed after discussion with Asad. Rationale: the therapist application is a detailed 5-step form; Asad does not have time to fill it out manually even for someone he knows personally. The application form is the single intake path.

**Manage specialty tags — REMOVED.** The 30+ concern tags are fixed and will never change per Asad. They will live as a constant in the codebase rather than an editable collection.

**Manage legal page content — REMOVED.** The old site's Privacy Policy and Terms content will be reused; no CMS-style editing needed.

---

## 10. Database Schema

**14 collections.** MongoDB.

### Design Philosophy

- **`users` is separate from profiles** — it holds only identity and login data. This keeps login queries fast and simple, and cleanly separates "who you are" from "your detailed information," which differs substantially between roles.
- **Applications are separate from profiles** — an applicant is not a therapist. Merging them would pollute the therapist collection with rejected/pending records.
- **`bookings` is the central hub** — nearly everything (messages, worksheets, sessions, journals, notes, reviews, subscription) links to it. This is the "shared record both sides read from" that makes client-therapist synchronization work.
- **Store IDs only, not copied names.** Names are looked up live from `users` when displaying. This guarantees names are always current and avoids duplicated, potentially stale copies. (Denormalizing names was considered and rejected — at this scale the extra lookup is negligible and correctness is worth more.)

### 10.1 `users`

**Purpose:** Identity and login for every person on the platform, regardless of role.

**Created when:**
- Client: the moment payment succeeds (webhook confirmed)
- Therapist: the moment admin approves their application
- Admin: manually, once, at setup

**Not created again on subsequent logins** — login only looks up the existing record.

```
{
  _id: ObjectId,
  email: String (unique, indexed),
  passwordHash: String,
  refreshTokenHash: String,      // hashed, single active session — see note below
  refreshTokenExpiresAt: Date,
  role: "client" | "therapist" | "admin",
  status: "active" | "inactive",
  createdAt: Date,
  updatedAt: Date
}
```

> **Refresh token storage — confirmed by Asad:** the hashed refresh token lives directly on the `users` record (`refreshTokenHash` + `refreshTokenExpiresAt`), not in a separate `refreshTokens` collection. This means **one active refresh session per user at a time** — logging in on a new device overwrites the previous hash, silently ending the old session. Rotation on every refresh just overwrites these two fields; password reset or logout just clears them. This is simpler than a separate collection and sufficient for this platform's usage pattern, but it does mean multi-device concurrent sessions are not supported — a deliberate trade-off, not an oversight.

### 10.2 `clientProfiles`

**Purpose:** A client's questionnaire responses and personal details.

**Created when:** payment succeeds (same moment as their `users` record).

```
{
  _id: ObjectId,
  userId: ObjectId → users,
  type: "individual" | "couple",
  country: String,
  city: String,
  relationshipStatus: String,
  concernTags: [String],       // 3-4 from master list
  therapistGenderPreference: "male" | "female" | "no_preference",

  // Individual only:
  name: String,
  age: Number,
  gender: String,

  // Couple only:
  coupleData: {
    partner1: { name, age, gender },
    partner2: { name, age, gender }
  },

  createdAt: Date
}
```

### 10.3 `therapistProfiles`

**Purpose:** A working (approved) therapist's professional profile. This is what the matching engine reads and what clients see.

**Created when:** admin approves their application.

```
{
  _id: ObjectId,
  userId: ObjectId → users,

  // Identity
  title: String,                // Mr. / Ms. / Mrs. / Dr. / Prof.
  firstName: String,
  lastName: String,
  gender: String,               // used for gender-preference prioritisation
  dateOfBirth: Date,
  photoUrl: String,

  // Location
  streetAddress: String,
  city: String,
  stateProvince: String,
  zipPostal: String,
  country: String,
  timezone: String,             // IANA identifier, e.g. "Europe/London"

  // Professional
  therapistType: String,        // FREE TEXT, ~50 char limit
  credentialType: String,       // Diploma/Degree | Certificate | License
  credentialInitials: String,   // MS, M.Phil, PhD, MA...
  licenseNumber: String,
  taxpayerIdNumber: String,
  yearsExperience: Number,
  educationSummary: String,
  currentWorkSituation: String,
  languages: [String],

  // Practice
  specialtyTags: [String],      // 3-4 from fixed master list — DRIVES MATCHING
  treatmentOrientations: [String], // 1-5 from fixed 33-item list — DISPLAY ONLY
  bio: String,                  // 3-4 lines, shown to clients
  licensingStatus: String,
  disciplinaryActions: Boolean,
  disciplinaryDetails: String,  // only if disciplinaryActions is true

  // Compliance
  malpracticeInsurance: Boolean,
  insuranceDetails: String,

  // Availability (structured)
  workingHours: {
    monday:    { enabled: Boolean, start: String, end: String },
    tuesday:   { enabled: Boolean, start: String, end: String },
    wednesday: { enabled: Boolean, start: String, end: String },
    thursday:  { enabled: Boolean, start: String, end: String },
    friday:    { enabled: Boolean, start: String, end: String },
    saturday:  { enabled: Boolean, start: String, end: String },
    sunday:    { enabled: Boolean, start: String, end: String },
    note: String                // optional free-text for unusual availability
  },

  // Documents
  certificateUrl1: String,      // Cloudinary
  certificateUrl2: String,      // Cloudinary
  licenseDocUrl: String,        // Cloudinary

  status: "active" | "inactive",
  createdAt: Date
}
```

> **`therapistType` is deliberately free text** (with a character limit), not a dropdown — the client wants therapists to describe their role in their own words (e.g. "Clinical Psychologist & Trauma Specialist").

> **`workingHours` is deliberately structured** (day toggles + time ranges) rather than free text, because it is displayed to clients at the top of the chat. The optional `note` field ensures no therapist is prevented from expressing unusual availability.

### 10.4 `therapistApplications`

**Purpose:** A submitted 5-step application awaiting admin review. **The applicant is not yet a user and cannot log in.**

**Created when:** a prospective therapist submits the form on `/join-as-therapist`.

```
{
  _id: ObjectId,

  // Contains every field listed in Section 23 (33 fields across 5 steps),
  // mirroring the therapistProfiles structure above, plus:

  email: String,
  passwordHash: String,         // set by applicant, carried over on approval

  status: "pending" | "approved" | "rejected",
  submittedAt: Date,
  reviewedAt: Date
}
```

> **Field list finalized** — see [Section 23](#23-therapist-application-form--complete-field-specification) for the complete 33-field, 5-step specification including mandatory/optional status and input types.

> On approval, the data in this document is used to populate the new `users` and `therapistProfiles` records. The application document itself is retained permanently as a record.

### 10.5 `bookings`

**Purpose:** The link between one client and one therapist. **The central record both portals read from.**

**Created when:** payment succeeds.

```
{
  _id: ObjectId,
  clientId: ObjectId → users,
  therapistId: ObjectId → users,
  status: "active" | "ended",
  matchedAt: Date,
  endedAt: Date
}
```

**How synchronization works:** the client portal queries `bookings` where `clientId = me` to find their therapist. The therapist portal queries `bookings` where `therapistId = me` to build their client list. Both read the same record from opposite sides. There is no separate sync mechanism.

### 10.6 `subscriptions`

**Purpose:** The current billing and access state for a booking. Access to the portal is gated on this.

**Created when:** payment succeeds.

```
{
  _id: ObjectId,
  bookingId: ObjectId → bookings,
  clientId: ObjectId → users,
  status: "active" | "past_due" | "cancelled" | "expired",
  currency: String,
  amount: Number,
  startDate: Date,
  currentPeriodEnd: Date,
  nextBillingDate: Date,
  sessionsRemaining: Number,     // resets to 4 each cycle
  platformSubscriptionId: String, // Stripe/PayPal subscription ID
  cancelledAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 10.7 `messages`

**Purpose:** Individual chat messages.

**Created when:** anyone sends a message. The client's first message is the mandatory intake message.

```
{
  _id: ObjectId,
  bookingId: ObjectId → bookings,
  senderId: ObjectId → users,
  text: String,
  type: "text" | "system",       // "system" for auto session-scheduled messages
  read: Boolean,
  createdAt: Date
}
```

> Structured so `voice` / `attachment` types can be added later without a rebuild.

**Unread badges** = count of messages in a booking where `read: false` and `senderId ≠ me`.

### 10.8 `worksheets`

**Purpose:** The two-way worksheet flow.

**Created when:** therapist uploads and assigns one. Updated when the client returns the completed version.

```
{
  _id: ObjectId,
  bookingId: ObjectId → bookings,
  title: String,
  assignedFileUrl: String,       // Cloudinary — therapist's upload
  completedFileUrl: String,      // Cloudinary — client's submission
  status: "assigned" | "completed",
  assignedAt: Date,
  completedAt: Date
}
```

### 10.9 `journals`

**Purpose:** Client's journal entries. **Always visible to the assigned therapist.**

**Created when:** the client writes an entry.

```
{
  _id: ObjectId,
  bookingId: ObjectId → bookings,
  clientId: ObjectId → users,
  text: String,
  moodTag: String,               // optional
  createdAt: Date
}
```

### 10.10 `privateNotes`

**Purpose:** Therapist's confidential clinical notes about a client. **NEVER visible to the client.**

**Created when:** the therapist writes a note.

```
{
  _id: ObjectId,
  bookingId: ObjectId → bookings,
  therapistId: ObjectId → users,
  text: String,
  createdAt: Date,
  updatedAt: Date
}
```

> **This collection must never be queried by, joined into, or returned to any client-facing endpoint.** Its physical separation from `journals` is the safety guarantee.

### 10.11 `sessions`

**Purpose:** Scheduled Zoom sessions.

**Created when:** the therapist schedules a session.

```
{
  _id: ObjectId,
  bookingId: ObjectId → bookings,
  scheduledAt: Date,             // stored in UTC, displayed in local time per user
  zoomLink: String,
  note: String,
  status: "scheduled" | "completed" | "cancelled",
  createdAt: Date
}
```

### 10.12 `reviews`

**Purpose:** End-of-subscription rating. **Admin-only visibility.**

**Created when:** a subscription ends and the client submits their rating.

```
{
  _id: ObjectId,
  bookingId: ObjectId → bookings,
  clientId: ObjectId → users,
  therapistId: ObjectId → users,
  stars: Number,                 // MANDATORY, 1-5
  text: String,                  // OPTIONAL
  createdAt: Date
}
```

### 10.13 `notifications`

**Purpose:** Cross-portal alert feed powering the notification bell.

**Created when:** a notable event occurs (new message, new worksheet submission, new client matched).

```
{
  _id: ObjectId,
  userId: ObjectId → users,      // recipient
  type: "new_message" | "worksheet_submitted" | "new_client",
  bookingId: ObjectId → bookings,
  read: Boolean,
  createdAt: Date
}
```

### 10.14 `paymentEvents`

**Purpose:** **Immutable, append-only ledger of every payment webhook received.** This is the single source of truth for dispute resolution and payment auditing.

**Created when:** any webhook arrives from the payment platform.

```
{
  _id: ObjectId,
  subscriptionId: ObjectId → subscriptions,
  clientId: ObjectId → users,
  platform: "stripe" | "paypal",
  eventType: String,             // e.g. "payment_succeeded", "payment_failed"
  platformEventId: String,       // for idempotency — prevents double-processing
  amount: Number,
  currency: String,
  rawPayload: Object,            // full webhook body, stored verbatim
  receivedAt: Date
}
```

> **Never edit or delete these records.** The `subscriptions` collection holds *current state*; `paymentEvents` holds *permanent history*. Storing webhook data as a field on `subscriptions` was considered and rejected — it would be overwritten on each renewal, destroying exactly the audit trail that matters for disputes.

### Removed / Rejected Collections

| Collection | Why removed |
|---|---|
| `specialties` | The 30+ tags never change per Asad — they live as a code constant instead |
| `refreshTokens` | **Confirmed removed by Asad.** The hashed refresh token is stored directly on `users` (`refreshTokenHash` + `refreshTokenExpiresAt` — see §10.1) rather than in its own collection. |

### Multi-Document Transaction Requirement

When a client pays, **four documents are created together**: `users`, `clientProfiles`, `bookings`, `subscriptions`. These **must be wrapped in a MongoDB transaction** so all succeed or none do. A half-created account (e.g., a user with no subscription) is a serious failure state.

Similarly, therapist approval creates **two documents together**: `users` + `therapistProfiles`.

---

## 11. Authentication & Authorization

### Strategy: JWT Access + Refresh Tokens

| Token | Lifetime | Storage |
|---|---|---|
| **Access token** | ~15 minutes | In memory (JS variable / React state) |
| **Refresh token** | ~7 days | `httpOnly` cookie + **hashed** in database |

### How It Works

1. User logs in with email + password
2. Server verifies the password against `passwordHash`, reads their role
3. Server issues an access token (15 min) and a refresh token (7 days)
4. Every API request carries the access token
5. When the access token expires, the client **silently** exchanges the refresh token for a new access token — the user notices nothing
6. After 7 days, the refresh token expires and the user must log in again

### Why This Design

- **Short access token** limits damage if it's ever stolen
- **Refresh token in `httpOnly` cookie** means JavaScript cannot read it — protects against XSS attacks
- **Access token in memory (not localStorage/Redux)** means there is no persistent copy for a malicious script to steal
- **Refresh token hashed in the database** enables **revocation** — you can invalidate a stolen session by deleting the record, which is impossible with a purely stateless token

> **Note:** the developer's previous approach stored the access token in Redux global state. This has been changed to in-memory only, because Redux/localStorage is JavaScript-readable and therefore XSS-vulnerable — an unacceptable risk for a platform holding mental health data.

### Password Handling

- Passwords are stored **only as bcrypt hashes** — never in readable form
- **Hashes are one-way and cannot be reversed.** Neither the admin, nor the developer, nor anyone else can retrieve a user's password
- The only recovery path is **reset**, never *retrieve* — this is why "Forgot password" exists
- If the database were ever breached, hashed passwords are useless to the attacker
- **Therapists set their own password** on the application form. On approval, that same password becomes their login credential. The admin never sees it.
- **Therapists CANNOT change their own password from their profile.** The only recovery path is "Forgot password," same as any other role. **Confirmed by Asad** — resolves an earlier draft inconsistency (see [Section 21](#21-open-items-requiring-client-confirmation)).

### DECISION: Plain-Text Passwords Were Considered and Rejected

The previous version of this platform stored passwords in **plain text**, visible in the database. Replicating this was explicitly considered — the motivation being that the admin could then log in as a therapist to investigate misconduct — and **rejected**.

**Why plain text is unacceptable here:**
- A database breach would expose every therapist's actual password. Because most people reuse passwords, this would also compromise their email, banking, and other accounts.
- This is a **mental health platform**. Compromised therapist accounts mean exposed patient conversations, journals, and clinical notes.
- Storing plain-text passwords is a **GDPR compliance violation** with real legal exposure for the business, which serves international clients.
- The reputational damage to Cast of Mind if it became known would be severe.

**The underlying concern (admin oversight of therapist misconduct) is legitimate**, but logging in *as* a therapist is the wrong solution to it.

### DECISION: No Admin "View Conversation" Feature

An admin conversation-viewing capability was proposed as the safe alternative to plain-text passwords, and **the client decided against building it for v1**.

**How misconduct is handled instead:** clients report issues to the business by **email and phone** (contact details published on the site), and Asad resolves them manually outside the platform.

> **Consequence to be aware of:** the admin has **no in-app visibility into chat content**. If Asad later wants to investigate a complaint directly, a read-only conversation viewer would need to be added — and if it is, every access should be logged, and the capability disclosed in the Privacy Policy.

### Account Recovery

| Role | Initial credentials | Recovery |
|---|---|---|
| Client | Emailed after payment succeeds | "Forgot password" on login page |
| Therapist | Emailed after admin approval | "Forgot password" on login page |
| Admin | Set manually at creation | "Forgot password" works identically — admin is a normal `users` record with an email |

> **Admin security caution:** because the admin can do everything, their **email inbox becomes the master key**. Anyone controlling Asad's email could reset the admin password. This is a primary reason 2FA on the admin account is strongly recommended.

### Required Security Layers

- Rate limiting on the login endpoint (prevents brute-force password guessing)
- HTTPS everywhere (otherwise tokens can be intercepted)
- Input validation on **both** frontend and backend — never trust the frontend alone
- Role checks on every protected endpoint, server-side

---

## 12. Payment System

### Status: Platform Choice Pending Final Confirmation

**Confirmed:** the business operates **outside Pakistan** and works with foreign partners, so **Stripe and PayPal are both available** (unlike a Pakistan-registered business, which cannot open direct Stripe/PayPal merchant accounts due to State Bank of Pakistan licensing rules).

**Confirmed:** billing currency is **EUR (€200/month)**.

> Note: the previous website's Terms & Conditions listed a Karachi, Pakistan address. That document is outdated and will be replaced; the business's actual operating base is outside Pakistan.

### Understanding the Three Services (Important Distinction)

A payment system has **two separate halves** that are commonly confused:

1. **Collecting money FROM the patient** — the checkout on the website
2. **Getting money OUT to the business's bank** — the payout

| Service | Collects from customers? | Holds a balance? | Role |
|---|---|---|---|
| **Stripe** | ✅ Yes | ❌ No — auto-forwards to linked bank | Checkout + processing |
| **PayPal** | ✅ Yes | ✅ Yes — holds in PayPal balance | Checkout + processing + holding |
| **Payoneer** | ✅ Yes, via **Payoneer Checkout** | ✅ Yes | Checkout (restricted) + receiving/holding |

> **Correction on Payoneer:** Payoneer *does* offer a checkout product ("Payoneer Checkout") that can accept card payments on a website. **However**, its availability is restricted — it has been offered primarily to merchants with a Hong Kong legal entity or businesses meeting volume thresholds. Its integration also requires an approved merchant account and Developer Portal access *before* building, and its sandbox cannot test payouts, refunds, or chargebacks. **Confirm eligibility with Asad before considering it.**

### Recommended Approach

**Stripe as the primary payment processor**, because it handles recurring subscriptions (auto-renewal, failed-payment retries, cancellation webhooks) more cleanly than alternatives — and this platform's entire model is monthly recurring billing. **PayPal optional as a second option** if Asad wants to offer patients a choice.

> Note: adding both means **two separate integrations**. Stripe money lands in Stripe; PayPal money lands in PayPal. They do not cross — integrating Stripe alone does not let patients pay via PayPal.

### The Payment Flow

```
Patient clicks "Subscribe — €200/month"
        ↓
Backend creates a Checkout Session with the payment platform
        ↓
Patient redirected to the platform's SECURE HOSTED PAGE
   (the application never touches raw card details)
        ↓
Patient pays
        ↓
Payment platform processes it
        ↓
*** WEBHOOK sent to backend: "payment succeeded" ***
        ↓
Backend creates user + clientProfile + booking + subscription (in a transaction)
        ↓
Backend logs the event in paymentEvents
        ↓
Credentials emailed to patient
        ↓
Patient redirected back to /welcome
```

### THE GOLDEN RULE

> **Create the account only when the WEBHOOK confirms payment — never when the browser redirects to a success page.**

Browsers can lose connection, close early, or be manipulated. Webhooks are the authoritative source of truth from the payment platform. This single principle is what separates a reliable payment system from a broken one.

### Webhook Events to Handle

| Event | Action |
|---|---|
| Payment succeeded (initial) | Create account, booking, subscription; email credentials |
| Payment succeeded (renewal) | Extend `currentPeriodEnd`, reset `sessionsRemaining` to 4 |
| Payment failed | Set status to `past_due`, show banner to client, start grace period |
| Subscription cancelled | Set status to `cancelled`, retain access until `currentPeriodEnd` |

**Idempotency:** store `platformEventId` in `paymentEvents` and check it before processing — payment platforms may send the same webhook more than once, and processing twice would double-charge or duplicate records.

### Fees

- Approximately **2.9% + $0.30** per transaction (industry standard, varies slightly by platform and country)
- On a €200 subscription, the business receives approximately **€193.90**
- **No setup fee, no monthly fee, no minimum** — fees apply only when money actually moves
- Fees are deducted automatically; the business is not separately invoiced

### Development vs. Production

| Phase | Approach |
|---|---|
| **Development** | Use the developer's **own test/sandbox account**. Test keys are instant and free, require no business verification, and process only fake money. Asad's involvement is not needed. |
| **Launch** | Switch to **Asad's live API keys**, generated from his own business account. |

### What the Developer's Responsibility Is — and Is Not

**In scope:** wiring the checkout, listening for webhooks, creating/updating accounts and subscriptions correctly, logging payment events.

**Out of scope:** where Asad's money goes after collection — whether it sits in PayPal, forwards to his bank, routes through Payoneer, how he withdraws it, tax handling, and the 40/60 therapist revenue split. **All of that is Asad's business operation, not application logic.**

### Refunds

A refund means returning a patient's payment (e.g., they changed their mind immediately, were double-charged, or a dispute was resolved in their favor).

**For v1:** Asad handles refunds directly from his Stripe/PayPal dashboard using their built-in refund button. **No refund logic needs to be built into the application.**

### Questions Still to Confirm With Asad

1. Card payments (Stripe), PayPal, or both?
2. Does he already have business accounts for the chosen platform(s)?
3. What country is the business legally registered in, and can his bank receive directly from Stripe/PayPal, or is Payoneer needed as an intermediary?
4. Confirm he handles refunds and the therapist revenue split offline.

---

## 13. Subscription Lifecycle

This is the **heart of the platform**. Access to the client portal is controlled entirely by subscription status, checked on every login and every sensitive action.

### State Machine

```
   [Payment succeeds]
          ↓
      ACTIVE ←──────────────┐
     ↙   ↓   ↘              │
    ↙    ↓    ↘        [payment fixed]
   ↙     ↓     ↘            │
[client [renewal      [renewal        │
 cancels] succeeds]    fails]         │
   ↓      ↓              ↓            │
CANCELLED  ACTIVE     PAST_DUE ───────┘
   ↓     (extended)      ↓
   ↓                [grace expires]
   ↓                     ↓
   └────────→ EXPIRED ←──┘
                ↓
        [re-subscribe]
                ↓
             ACTIVE
```

### The Five States

**1. ACTIVE**
- Full portal access
- Session counter tracks 4 sessions per cycle
- `nextBillingDate` stored

**2. Renewal (automatic, monthly)**
- Payment platform auto-charges the saved card
- Webhook confirms → `currentPeriodEnd` extended one month, `sessionsRemaining` reset to 4
- **Seamless — the client notices nothing**

**3. PAST_DUE (payment failed)**
- Webhook reports failure → status becomes `past_due`
- Client sees a banner: *"Your payment failed — please update your card to continue"*
- **Grace period: ~3 days** (industry standard)
- If resolved → back to `active`. If not → `expired`

**4. CANCELLED (client chooses to stop)**
- Client clicks Cancel in their portal
- **They keep full access until the end of the period they already paid for** — never cut off mid-paid-period (this would be a refund nightmare and is what every major platform does)
- At period end → `expired`

**5. EXPIRED**
- Login still works (they can authenticate)
- But instead of the portal, they see a **re-subscribe screen**: *"Your subscription has ended. Reactivate to continue with Dr. [Name]"*
- **All data is preserved:** chat history, journal entries, worksheets, and their therapist match
- If they re-subscribe, everything resumes exactly where it left off

**Why preserve data:** returning clients can pick up seamlessly, the therapeutic relationship (emotionally important in mental health) is maintained, and Asad benefits from returning-customer revenue rather than only new signups.

### Admin Override

Asad can manually cancel or expire a subscription from the Admin Portal for edge cases: refund disputes, complaints, or a therapist leaving the platform.

### Auto-Renewal Transparency (REQUIRED)

The client must be clearly informed that their card will be charged again. This is both an ethical requirement and protection against chargeback disputes.

**Show it at three points:**

1. **At checkout (most important):** *"This is a monthly subscription. Your card will be charged €200 automatically each month until you cancel."*
2. **In the portal** (Subscription & Account section, always visible): *"Next payment: [date]. To stop it, cancel before this date."*
3. **Reminder email a few days before each renewal:** *"Your subscription renews on [date]. No action needed to continue; cancel anytime before then."*

### Session Counter Rules

- 4 sessions per billing cycle
- Decrements when a session is completed
- Resets to 4 on successful renewal
- **Sessions do NOT carry over — confirmed.** Unused sessions are forfeited at the end of each billing cycle. When a subscription ends (cancelled or expired), the counter drops to **0**. A client with 2 unused sessions at cycle end does not receive 6 the following month.

---

## 14. Real-Time Chat Architecture

### The Core Concept

Client and therapist do not "connect" to each other directly. Both read from and write to the **same `bookingId`-scoped message thread**. The client portal asks "show me messages for my booking"; the therapist portal asks "show me messages for the selected client's booking." Same data, two viewpoints.

### Real-Time Delivery (Socket.io)

- Messages are **always persisted to MongoDB** — that is the permanent record
- Socket.io handles **instant delivery** to the other party if they are currently online
- If the recipient is offline, the message simply waits; they see it (and the unread badge) next time they open the portal

### Unread Indicators

- Each message has `read: false` when created
- Opening a conversation marks that conversation's messages as `read: true` for the viewer
- **Badge count** = number of messages in that booking where `read: false` and `senderId ≠ me`
- Socket.io pushes badge updates live so counts change without a page refresh

### System Messages

When a therapist schedules a session, an automatic message of `type: "system"` posts into the chat (e.g., *"📅 Session scheduled for Thursday, Aug 14 at 6:00 PM"*). This notifies the client naturally rather than silently updating a separate tab.

### The Mandatory First Message

Before normal chat begins, the client must send an opening free-text message describing their feelings, current experience, and challenges. This ensures the therapist never starts with zero context and the conversation is never empty.

---

## 15. Matching Engine

### How It Works

1. A fixed master list of concern/specialty terms exists (see below)
2. Therapists select **3–4 tags** during their application
3. Clients select **3–4 tags** during the questionnaire
4. The system finds therapists whose `specialtyTags` **overlap** with the client's `concernTags`
5. If the client stated a **therapist gender preference**, matching therapists of that gender are **sorted to the top**; the rest still appear below
6. Matching therapists are displayed for the client to choose from

### Concern / Specialty Tags — Fixed List (27 options, confirmed by Asad)

This is the single list both clients (`concernTags`) and therapists (`specialtyTags`) select from — the only thing that drives matching. It lives as a constant in the codebase, not an editable database collection.

Anger Management · Anxiety · Career Counselling · Depression · Family Issues · Social Anxiety · Stress · Panic Attacks · Procrastination · Sleep Issues or Insomnia · Self Esteem · Relationship Issues · Trauma and/or Abuse · Parenting · Weight Loss · Addictions · ADHD & Attention Issues · Alzheimer's · Autism · Children & Teens · Divorce · Domestic Violence · Eating & Food Disorders · Grief · Marriage Issues · Phobias · Speech Anxiety

> **Note:** earlier draft text in this document described the list loosely as "30+ terms" with illustrative examples including "OCD," which does not appear in this final approved list. This enumerated list is authoritative; treat any other prose description of the concern/specialty tags elsewhere in this document as superseded by it.

### Gender Preference — Soft Prioritisation, Not a Hard Filter

Clients may state a preferred therapist gender (Male / Female / No preference).

- **This never hides therapists.** Preferred-gender matches are ordered first; all other specialty matches still appear beneath them.
- **Rationale:** a hard filter could return an empty result (e.g. a client wanting a female trauma specialist when none is available), leaving the client with nothing. Soft prioritisation honours the preference while guaranteeing options.
- If "No preference" is selected, gender is ignored entirely and results are pure specialty matching.

### No-Match Fallback — Show All Therapists Silently

If a client's concern tags overlap with **zero** therapists:

- **Display all available therapists**, ordered by gender preference if one was stated
- **Show no message, banner, or explanation** that a match could not be found

**Rationale (client decision):** an anxious visitor told "we couldn't find a match for you" is likely to overthink, lose confidence, and abandon the flow — potentially closing the tab entirely. Showing the full therapist list silently keeps them moving forward.

> **Note for future maintainers:** the alternative considered was showing a transparency message ("no exact specialty match — browse all our therapists"). This was **deliberately rejected** by the client on user-psychology grounds. Do not reintroduce it without confirming with the client.

### Critical Rules

- **Both sides MUST select from the same fixed list.** Free-text specialties would break matching entirely — a therapist writing "I help with sadness" would never match a client who selected "depression."
- **Country is NOT a matching filter.** It is collected for record-keeping and timezone display only. Clients may match with therapists anywhere in the world; Asad has already vetted his therapists.
- **Timezone is NOT a matching filter.** It affects only how times are displayed, never who is matched with whom.
- **Treatment orientations are NOT a matching filter.** They are display-only profile information.
- The tag list is **fixed and will not change** — it lives as a constant in the codebase, not an editable database collection.

### Timezone Handling

**The rule: store one universal time, display it converted to whoever is looking.**

- Every timestamp in the database is stored in **UTC** — one universal clock, no daylight-saving ambiguity
- When displaying, convert to the viewer's local timezone (from their profile's IANA identifier)
- The same stored moment shows as different local times to different people — but it is the same real moment

**Worked example — therapist in London, client in New York:**

1. The London therapist schedules a session for **3:00 PM their time**
2. System converts and stores it as **14:00 UTC**
3. The New York client opens their Session Hub and sees **10:00 AM**
4. Both are the same moment. Neither party does mental arithmetic.

**This applies to chat as well.** A message sent at 10:00 AM New York time displays as 3:00 PM to the London therapist. One stored UTC timestamp, each screen showing its own local clock.

**Implementation note:** conversion is handled by a standard library (`moment-timezone`, `date-fns-tz`, or the browser's native `Intl` API) — never calculated manually. The timezone dropdown on forms is populated from the **standard IANA timezone list**, not a hand-written list.

---

## 16. Email System

### Service: Resend

**Why Resend:** 3,000 emails/month permanently free, simple setup, high deliverability.

> **Note:** SendGrid was originally considered but its permanent free tier was discontinued in 2025 (new accounts get a 60-day trial, then paid plans from ~$20/month). Brevo (300 emails/day free) is a viable alternative.

### Important Clarification About Email Delivery

**Email always goes to whatever address the person signed up with.** If a client used Gmail, it lands in Gmail. Outlook → Outlook. Yahoo → Yahoo. This is not controlled by Resend or any sending service — email is an open universal standard.

What a professional sending service changes is **deliverability** (not landing in spam) and **volume limits** — not the destination.

**Nodemailer vs. Resend is a false comparison.** Nodemailer is a code library that sends email *through* something. Using Gmail SMTP is fine for practice but unsuitable for production (~500/day limit, spam flagging, account blocking risk). The production setup is a proper sending service like Resend.

### Emails the System Must Send

| Trigger | Recipient | Content |
|---|---|---|
| Payment succeeds | Client | Welcome + login credentials |
| Admin approves application | Therapist | Welcome + login credentials |
| Forgot password requested | Any user | Password reset link |
| Pre-renewal reminder | Client | *"Your subscription renews on [date]"* |
| Payment failed | Client | *"Please update your payment method"* |
| New therapist application submitted | Admin (Asad) | *"New application from [name]"* |

---

## 17. File Storage

### Service: Cloudinary

**Why not store files on the server:** servers get restarted, redeployed, or run as multiple instances. Files saved directly to a server's disk can be lost.

**Free tier:** 25 credits/month (1 credit ≈ 1 GB storage or bandwidth). Comfortably sufficient for lightweight PDF/document worksheets at early scale.

### What Gets Stored

- Therapist-assigned worksheets (PDF/DOC)
- Client-completed worksheet submissions
- Therapist license/credential documents (from applications)
- Therapist profile photos

### Account Ownership Clarification

Cloudinary, MongoDB, Resend, Vercel, and the payment platforms are **entirely separate, unrelated companies**. None are owned by Google. None require a Google account.

The confusion arises because many offer "Continue with Google" as a *convenience login option* — but that does not mean Google owns the account or controls the free tier.

**The correct model:** the client has **one dedicated business email address**, and every service account is created using that same email. That is the only "connection" between them. Free tiers are **per-service, per-account**, and completely independent of one another.

---

## 18. Security Requirements

Because this platform handles **sensitive mental health data**, security is treated as healthcare-grade even where not strictly legally mandated.

### Non-Negotiables

- **All passwords bcrypt-hashed** — never stored readably
- **HTTPS everywhere** (SSL certificate, free via Vercel/Cloudflare)
- **Environment variables for all secrets** — never hardcoded API keys
- **Rate limiting** on login and other sensitive endpoints
- **Input validation on both frontend and backend** — never trust the frontend
- **Server-side role checks** on every protected endpoint
- **Private clinical notes never sent to client-facing endpoints** (see [Section 8.5](#85--86-journal--notes-per-client--unified-workspace))

### Admin-Specific Security

Because the admin can see and control everything:

- **Two-factor authentication (2FA)** on the admin login — strongly recommended, effectively non-negotiable for a mental health platform
- **IP logging** on admin actions (accountability)
- **Session timeout** after ~30 minutes of inactivity

### Environment Separation

Three environments:
- **Development** — the developer's machine, developer's own service accounts
- **Staging** — pre-launch testing
- **Production** — real users, **the client's service accounts**

### Legal / Compliance

Depending on where clients are located, **HIPAA (US)** or **GDPR (EU)** may apply. **This is the client's responsibility, not the developer's** — but it must be raised explicitly and confirmed in writing who is handling legal compliance and terms of service.

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

## 23. Therapist Application Form — Complete Field Specification

**33 fields across 5 steps. 28 mandatory, 5 optional.**

This is the single intake path for therapists — there is no manual-add feature in the admin portal.

### Eligibility Requirements Notice

**Displayed prominently at the start of Step 1**, before the applicant begins. Sourced from the client's existing requirements:

> **You may register from anywhere in the world.**
>
> **Requirements for registering:**
> - MA, MS, MSW, Psy. or PhD in counseling, clinical psychology or related mental health areas
> - Minimum of 2 years of and/or 1000 hours of providing counselling services
> - Professional malpractice liability insurance policy, minimum coverage limits for your country
> - No disciplinary actions in the past 10 years
> - We do not accept interns or if you require supervision

**Purpose:** unqualified applicants self-select out before investing time in a long form, reducing the admin review burden.

### Step 1 — Personal Details

| Field | Required | Input type | Notes |
|---|---|---|---|
| Title | Mandatory | Dropdown | Mr., Ms., Mrs., Dr., Prof. |
| First name | Mandatory | Free text | |
| Last name | Mandatory | Free text | |
| Gender | Mandatory | Dropdown | Feeds client gender-preference prioritisation |
| Date of birth | Mandatory | Date picker | |
| Email | Mandatory | Free text | Becomes their login email |
| Password | Mandatory | Password field | |
| Profile photo | Mandatory | Upload | Cloudinary |

### Step 2 — Location & Availability

| Field | Required | Input type | Notes |
|---|---|---|---|
| Street address | Mandatory | Free text | |
| City | Mandatory | Free text | |
| State / Province | Mandatory | Free text | |
| Zip / Postal code | Mandatory | Free text | |
| Country | Mandatory | Dropdown | |
| Timezone | Mandatory | Dropdown | Populated from standard IANA list |
| Languages spoken | Mandatory | Multi-select | |
| Working hours | Mandatory | Structured | Day checkboxes + start/end time per day, plus optional free-text note |

### Step 3 — Professional Background

| Field | Required | Input type | Notes |
|---|---|---|---|
| Therapist type | Mandatory | **Free text (~50 char limit)** | e.g. "Clinical Psychologist" |
| Credential type | Mandatory | Dropdown | Diploma/Degree, Certificate, License |
| Credential initials | Mandatory | Free text | MS, M.Phil, PhD, MA... |
| Years of experience | Mandatory | Number | Must satisfy the 2-year minimum |
| Summary of education | Mandatory | Free text (long) | |
| Current work situation | Mandatory | Free text | |
| License number | Optional | Free text | |
| Taxpayer identification number | Optional | Free text | **Sensitive — see Section 21** |

### Step 4 — Practice & Specialties

| Field | Required | Input type | Notes |
|---|---|---|---|
| **Specialty tags** | Mandatory | Multi-select, **3–4** from fixed master list | **DRIVES MATCHING** |
| Treatment orientations | Mandatory | Multi-select, **1–5** from fixed 33-item list | **Display only — never affects matching** |
| Bio | Mandatory | Free text, 3–4 lines | Shown to clients on the matching page |
| Licensing status | Mandatory | Free text | Who they are licensed to accept |
| Disciplinary actions | Mandatory | Yes/No + conditional free text | Covers the 10-year requirement |

### Step 5 — Compliance & Documents

| Field | Required | Input type | Notes |
|---|---|---|---|
| Malpractice insurance confirmation | Mandatory | Yes/No | Compliance checkpoint per requirements |
| Insurance details | Optional | Free text | Provider, policy number, coverage |
| Certificate upload 1 | Mandatory | Upload | Cloudinary |
| Certificate upload 2 | Optional | Upload | Cloudinary |
| License document | Optional | Upload | Cloudinary |

Followed by a **final review and submit screen**.

### Field Count Summary

| Step | Fields | Mandatory | Optional |
|---|---|---|---|
| 1 — Personal details | 8 | 8 | 0 |
| 2 — Location & availability | 8 | 8 | 0 |
| 3 — Professional background | 8 | 6 | 2 |
| 4 — Practice & specialties | 5 | 5 | 0 |
| 5 — Compliance & documents | 5 | 3 | 2 |
| **Total** | **33** | **28** | **5** |

### Placeholders

Every free-text field must carry a helpful placeholder to improve data quality — e.g. *"e.g. Clinical Psychologist specializing in trauma"* for therapist type, *"e.g. MS, M.Phil, PhD"* for credential initials.

### Fields Deliberately Excluded

| Old field | Why excluded |
|---|---|
| `selected_therapy_types` (Online, Phone, Text Chat, Video, Email, Individual, Couples) | The platform already fixes the delivery channels — all sessions are Zoom, all messaging is in-portal chat. Asking therapists which channels they offer is meaningless. |
| `ChatName` | The old system's way of tracking a therapist's client conversations and unread flags, stored on the therapist record. Replaced cleanly by the `bookings` and `messages` collections. |
| `isApprovl` (boolean) | Replaced by the richer `status` field (`pending` / `approved` / `rejected`) on `therapistApplications`. |
| `__v` | Mongoose's internal version key — added automatically, never designed or used. |

### Treatment Orientations — Fixed List (33 options, cleaned)

Display-only. Never used in matching. Therapists select 1–5.

ACT · Art Therapy · Behavioral Therapy · CAT · CBT · Career Counseling · Christian Counseling · Cognitive Therapy · Couples Therapy · DBT · Drama Therapy · EMDR · Emotionally Focused · Existential Therapy · Family Therapy · Gestalt Therapy · Group Therapy · Human Givens Psychotherapy · Humanistic Therapy · Hypnotherapy · Individual Therapy · Intervention · Jungian Therapy · Life Coaching · Mindfulness · Music Therapy · Play Therapy · Psychoanalytic Therapy · Psychodynamic Therapy · Religious Counseling · Transactional Analysis · Transpersonal Psychology · Trauma Focused

> **What "treatment orientation" means:** the *method* or *approach* a therapist uses. Specialty = *what problem* they treat (anxiety, addiction). Orientation = *what technique* they use to treat it (CBT, EMDR, mindfulness). Two therapists may both treat anxiety but work in entirely different ways.

**Cleaned from the original 37-item list — 4 entries removed:**

| Removed | Reason |
|---|---|
| "Emotionally" | Data-entry error — "Emotionally Focused" retained |
| "Psychoanalytic" | Duplicate — "Psychoanalytic Therapy" retained |
| "Couples Counseling" | Duplicate — "Couples Therapy" retained |
| "Coaching" | Duplicate — "Life Coaching" retained |

> "Christian Counseling" and "Religious Counseling" are both **retained deliberately** — a therapist offering specifically Christian counseling is advertising something different from general faith-based counseling.

---

## 24. Frontend Design Specification

### 24.1 The Design Mandate

> **Role for anyone (human or AI) building this frontend:**
>
> You are a **senior UI/UX designer and frontend developer** who builds premium, distinctive marketing sites and product interfaces. You have shipped work for brands that could not be mistaken for anyone else's. You do not produce templated layouts, stock-looking hero sections, or default component-library aesthetics.
>
> Every colour, typeface, spacing decision, and animation must be **deliberate and justifiable** against this brief. Where a choice reads as "what any site would do," revise it.

**The audience matters more than the aesthetics.** Visitors to Cast of Mind are often anxious, sometimes in distress, frequently seeking therapy for the first time. The design must feel:

- **Calm** — no aggressive motion, no urgency tactics, no countdown timers or hard-sell patterns
- **Trustworthy** — this is healthcare, not a startup landing page
- **Premium** — the quality signals professionalism and justifies the €200/month price
- **Warm** — clinical coldness alienates; this should feel human

**Anti-goals:** SaaS-template look, aggressive gradients, floating 3D blobs, generic stock photography of smiling people, "Book a demo" energy, dark-pattern urgency.

### 24.2 Colour Palette

Base palette confirmed by the client: **#19122B**, white, black, and a touch of yellow. Extended into a full working system:

> **Accent changed 2026-08-22 — confirmed by Asad.** The accent moved from muted antique gold `#E3B23C` to warm saturated yellow **`#F5C518`**. The earlier wording "muted antique gold, **not** bright yellow" is superseded. The token name stays `gold` so nothing downstream needs renaming — read it as "the accent", not as a colour description.

| Token | Hex | Role |
|---|---|---|
| `--ink` | `#19122B` | Primary brand — deep aubergine. Navigation, footer, headings, dark sections |
| `--ink-deep` | `#0D0916` | Near-black with a plum undertone. Maximum-contrast text, deepest surfaces |
| `--gold` | `#F5C518` | Accent — warm saturated yellow. CTAs, active states, key highlights. Used sparingly |
| `--paper` | `#FFFFFF` | Primary background |
| `--mist` | `#F4F2F7` | Very light lavender-grey, derived from `--ink`. Alternating section backgrounds, cards |
| `--sage` | `#7C9082` | Muted sage green. Secondary accent for growth/calm motifs, success states, illustration support |
| `--clay` | `#B3453A` | Muted brick red. Errors, danger actions, destructive states. **Added 2026-08-22, approved by Asad.** |
| `--sage-deep` | `#5A6E60` | Darker sage. Success **text** only — plain `sage` fails contrast at text sizes. **Added 2026-08-22, approved by Asad.** |

**Added 2026-08-22 — approved by Asad.** Two tokens were added because the original six could not cover required states:

- **`clay` `#B3453A`** — there was no red in the palette at all, so errors and danger buttons had nothing to use. Ink would have removed the warning signal entirely, which is unsafe for an anxious reader who needs to see that something went wrong. Chosen muted rather than bright so it warns without alarming. **5.48:1 on paper**, **4.9:1 on mist** — passes AA for text.
- **`sage-deep` `#5A6E60`** — the spec gives success states to `sage`, but `#7C9082` on white is only **3.44:1**, which **fails** the 4.5:1 floor for text. `sage` stays exactly as specified for fills, icons, illustration and large text; `sage-deep` is for success **text** only. **5.48:1 on paper**.

Neither addition changes any existing token.

**Usage rules:**

- **The accent is an accent, not a theme.** If more than roughly 5% of a screen is yellow, reduce it. Its power comes from scarcity.
- **`--mist` prevents the flat-white problem.** Alternate white and mist sections to create rhythm without hard dividers.
- **Sage is optional.** Use it in illustration, iconography, and success states — never as a competing CTA colour.
- **Never place yellow text on white** at any size; contrast fails. `#F5C518` on white is **1.63:1** — worse than the old gold's 1.96:1, so this rule is now stricter, not looser. Yellow is for fills, borders, and large display text on dark surfaces.
- **Yellow is never a focus ring on light surfaces.** It fails the 3:1 WCAG floor for focus indicators. Focus rings are `ink` on light surfaces, yellow only on dark ones.
- **Measured contrast:** `#F5C518` on `ink` `#19122B` = **9.5:1** (passes). On `paper` `#FFFFFF` = **1.63:1** (fails — fills and borders only).

### 24.3 Typography

| Role | Typeface | Rationale |
|---|---|---|
| **Display** | **Fraunces** (variable, Google Fonts) | A warm, soft-edged serif with optical sizing. Feels crafted and human rather than corporate-editorial. Avoids the cold high-contrast serif that appears on every premium template. |
| **Body** | **Satoshi** (Fontshare, free) | Clean geometric-humanist sans with genuine warmth. Highly legible at small sizes. Alternative if licensing is a concern: **Instrument Sans** (Google Fonts). |
| **Utility** | Satoshi at reduced size/weight | Captions, form labels, table data, metadata |

**Type scale (desktop):**

| Use | Size | Weight | Face |
|---|---|---|---|
| Hero headline | 64–80px | 400–500 | Fraunces |
| Section heading | 40–48px | 400 | Fraunces |
| Subsection heading | 24–28px | 500 | Satoshi |
| Body | 17–18px | 400 | Satoshi |
| Small / caption | 14px | 400 | Satoshi |

**Rules:**

- Fraunces is used **only** for display sizes. Never for body copy or UI labels.
- Body line-height ≥ 1.6 — this audience reads carefully, and generous leading reads as calm.
- Line length capped at ~70 characters.
- Sentence case throughout. No ALL-CAPS headings (reads as shouting to an anxious reader); small-caps eyebrows are acceptable at low frequency.

### 24.4 Motion Language — The Signature

**The signature element of this site is that its motion is timed to a calm breathing rhythm rather than standard UI timings.**

Where most sites animate in 200–300ms snaps, Cast of Mind's ambient and reveal animations run on a **slow 4-second ease** — the approximate pace of a deliberate inhale. This is subtle enough that most visitors won't consciously notice it, but it makes the entire site *feel* slower and calmer than competitors without anything looking sluggish.

**Applied as:**

| Motion type | Duration | Where |
|---|---|---|
| Ambient / atmospheric | 4s+, infinite, ease-in-out | Hero background gradient drift, subtle illustration movement |
| Scroll reveals | 600–800ms, ease-out | Section entrances, staggered by 80–120ms |
| Micro-interactions | 150–250ms | Hover states, button feedback, form focus — these stay snappy for responsiveness |

**Critical rules:**

- **Functional interactions stay fast.** Only ambient and reveal motion is slowed. A button that responds in 4 seconds is broken, not calm.
- **`prefers-reduced-motion` must be fully respected.** All ambient and reveal motion disables; content appears immediately. This is an accessibility requirement, not a nicety — vestibular disorders are common and this audience is health-sensitive.
- **No parallax on text.** Decorative parallax on background layers only.
- **No autoplay video with sound. Ever.**

**Recommended library:** Framer Motion (works cleanly with React, has built-in reduced-motion support).

### 24.5 Imagery & Illustration

- **Avoid generic stock photography of smiling people.** It reads as inauthentic and every competitor uses it.
- **Preferred direction:** abstract organic forms, soft gradients, botanical/growth motifs (aligning with the existing tree-in-head logo), and calm textural backgrounds.
- **Therapist photos are the exception** — these are real people and must be shown as real, warm, professional portraits.
- All decorative imagery must have empty `alt` attributes; meaningful imagery must be described.

### 24.6 Quality Floor (Non-Negotiable)

Applies to every page without exception:

- Fully responsive down to 360px width
- Visible keyboard focus states on all interactive elements
- `prefers-reduced-motion` respected throughout
- Colour contrast meets WCAG AA (4.5:1 body text, 3:1 large text)
- Forms: proper labels, inline validation, clear error messages that explain how to fix the problem
- All interactive targets ≥ 44×44px on touch devices
- Semantic HTML — headings in order, landmarks, no div-only structure

---

### 24.7 Page Specifications

#### Home (`/`)

Seven sections, in order:

| # | Section | Content & treatment |
|---|---|---|
| 1 | **Hero** | Animated landing with therapy-focused visuals. Headline, supporting line, primary "Get Started" CTA. Ambient background motion on the breathing rhythm. This is the thesis of the entire brand — it must not look like a template hero. |
| 2 | **Services** | What Cast of Mind offers — the therapy areas covered and what a subscription includes. |
| 3 | **Testimonials** | Animated review cards with images and text. **Placeholder/fictional content for now** — see the honesty note below. |
| 4 | **How it works** | The process in visual steps. Condensed version of the dedicated page, with a link through to it. |
| 5 | **Who we help** | Target audiences, supporting figures, and current client count. **Placeholder figures for now** — see the honesty note below. |
| 6 | **Comparison table** | In-person therapy vs. Cast of Mind therapy — cost, accessibility, scheduling, continuity of contact between sessions. |
| 7 | **FAQ + Footer** | Accordion FAQ addressing the real hesitations (cost, privacy, "is this real therapy?", what happens if it isn't a good fit). Full footer. |

**Second "Get Started" CTA** sits after section 4 or 6, for visitors who needed context before acting.

> **⚠️ Honesty note on placeholder content (sections 3 and 5):** fictional testimonials and invented client numbers are used as **design placeholders during development only**. Publishing fabricated reviews or false user counts on a live mental-health platform is a consumer-protection risk in most jurisdictions (misleading advertising) and a serious trust problem if discovered. **Before launch, these must be replaced with real testimonials (with client consent and anonymisation) and real figures — or the sections must be removed.** This is worth raising with the client explicitly.

#### About (`/about`)

- Introduction to Cast of Mind — mission and story
- Brand logo presentation (client to supply)
- **Full team section** — all team members, staff, and anyone associated with the business (the separate team page was deliberately merged here)
- Owner/founder profile
- **Placeholder content for now**; client will supply real bios, photos, and logo
- Treatment: premium, properly animated, generous whitespace, strong visual hierarchy. Team members revealed on scroll with staggered timing.

#### How It Works (`/how-it-works`)

- The full process explained step by step: questionnaire → matching → choose your therapist → subscribe → receive credentials → start chatting → attend Zoom sessions
- Each step animated on scroll with a supporting visual
- **Numbered markers are appropriate here** — this genuinely is a sequence, and the order carries information the reader needs
- Tone: reassuring and concrete. This page exists to remove the fear of the unknown, so it should answer "what will actually happen to me?" plainly
- Ends with a "Get Started" CTA

#### Join as a Therapist (`/join-as-therapist`)

- Opens with the **eligibility requirements notice** (see [Section 23](#23-therapist-application-form--complete-field-specification))
- A short section selling the platform *to therapists* — why practise here
- The **5-step application form**: clean, professional, generously spaced
- **Form UX requirements:**
  - Visible step indicator (Step 2 of 5) with progress
  - Ability to move back without losing entered data
  - Inline validation on blur, not only on submit
  - Placeholders on every free-text field
  - Clear file-upload states (idle / uploading / uploaded / error)
  - Final review screen before submission
  - Explicit confirmation screen after submission explaining what happens next and roughly when

#### Contact (`/contact`)

- Deliberately simple: Name, Email, Message, optional subject dropdown
- Alongside the form: business contact details, including the **email address and phone number** used for reporting misconduct or account issues (this is the agreed escalation path in place of an admin conversation-viewing feature)
- No date/time/gender/age fields — those belonged to the old site's conflated form

#### Login (`/login`)

- Single unified login for all three roles — email, password, "Forgot password" link
- **No "Continue with Google"** (see [Section 3](#3-user-roles) for rationale)
- No visible role selector — the backend determines role and redirects
- Calm, minimal, centred. Clear error messaging that never reveals whether an email exists in the system (security)

#### Get Started (`/questionnaire` → subscription)

The full intake journey, built as one continuous flow:

1. Multi-step questionnaire, branching on Individual/Couple ([Section 6](#6-client-onboarding-flow))
2. Matched therapist results ([Section 15](#15-matching-engine))
3. Individual therapist detail view
4. Checkout
5. Post-payment welcome/confirmation

**Flow UX requirements:**

- One question or one tight group per screen — never a wall of fields. This audience is anxious; density increases abandonment
- Visible progress indicator throughout
- Back navigation preserves all answers
- The concern-tag selection screen is the emotional core of the flow — it deserves the most design care on the entire site
- Therapist cards show photo, name, specialties, and bio with enough warmth to make a human choice feel possible
- Checkout states the auto-renewal terms clearly ([Section 13](#13-subscription-lifecycle))

---

### 24.8 Portal Design Notes

The three portals ([Sections 7](#7-client-portal), [8](#8-therapist-portal), [9](#9-admin-portal)) are **application interfaces, not marketing pages.** The premium marketing aesthetic does not carry over directly:

- Denser information, faster interactions, less ambient motion
- Same palette and typefaces for brand continuity, applied more functionally
- **Empty states are designed, never blank** — every "nothing here yet" moment gets intentional treatment (see the therapist portal's deliberately minimal empty state in [Section 8.1](#81-client-list-sidebar-global))
- The client portal skews warmer; the admin portal skews denser and more utilitarian

---

## Appendix: Complete Collection Reference

| # | Collection | Created when | Central purpose |
|---|---|---|---|
| 1 | `users` | Payment / approval / manual setup | Identity + login for all roles |
| 2 | `clientProfiles` | Payment succeeds | Questionnaire + personal data |
| 3 | `therapistProfiles` | Admin approves application | Working therapist's profile |
| 4 | `therapistApplications` | Form submitted | Pending intake for review |
| 5 | `bookings` | Payment succeeds | **Central client↔therapist link** |
| 6 | `subscriptions` | Payment succeeds | Current billing + access state |
| 7 | `messages` | Message sent | Chat + unread tracking |
| 8 | `worksheets` | Therapist assigns | Two-way worksheet flow |
| 9 | `journals` | Client writes entry | Client journal (therapist-visible) |
| 10 | `privateNotes` | Therapist writes note | **Therapist-only clinical notes** |
| 11 | `sessions` | Therapist schedules | Zoom session records |
| 12 | `reviews` | Subscription ends | Admin-only quality signal |
| 13 | `notifications` | Notable event occurs | Notification bell feed |
| 14 | `paymentEvents` | Webhook received | **Immutable payment ledger** |

---

*End of specification.*
