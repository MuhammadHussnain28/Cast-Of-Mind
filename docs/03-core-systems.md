# Cast of Mind — Core Systems

> **Part of the Cast of Mind specification set.** The complete specification is
> `Cast_of_Mind_Master_Spec.md` — this file is an extract for focused reference during development.
> If this file and the master spec ever disagree, **the master spec wins** and this file must be re-synced.

**Source:** Master Spec v1.4 · **Sections included:** 11, 12, 13, 14, 15, 16, 17, 18

The engine rooms: authentication, payments, subscription lifecycle, real-time chat, matching, email, file storage, and security requirements.

**Read this file when:** building backend logic. Sections 11, 12 and 13 are the highest-risk areas in the entire project — bugs here cost real money and real trust.

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
- **Therapists CANNOT change their own password from their profile.** The only recovery path is "Forgot password," same as any other role. **Confirmed by Asad.**

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
