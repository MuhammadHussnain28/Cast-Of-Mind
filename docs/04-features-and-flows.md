# Cast of Mind — Features & User Flows

> **Part of the Cast of Mind specification set.** The complete specification is
> `Cast_of_Mind_Master_Spec.md` — this file is an extract for focused reference during development.
> If this file and the master spec ever disagree, **the master spec wins** and this file must be re-synced.

**Source:** Master Spec v1.4 · **Sections included:** 5, 6, 7, 8, 9, 23

Every page and every portal: what the user sees, what they can do, and the exact field specification for the therapist application.

**Read this file when:** building any UI feature, page, or portal screen.

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
