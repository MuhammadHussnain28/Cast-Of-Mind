# Product

<!-- impeccable:product-schema 1 -->

> Derived entirely from `Cast_of_Mind_Master_Spec.md` (v1.4) and the split docs in `/docs`,
> which are client-confirmed and authoritative. No facts here are inferred or invented.
> If this file and the master spec ever disagree, **the master spec wins**.

## Platform

web

## Users

Three roles share one login page; the backend reads `role` and redirects.

- **Clients** — people experiencing mental health difficulties, often anxious, sometimes in distress, frequently seeking therapy for the first time. They arrive via the public site, complete an intake questionnaire, choose a matched therapist, and subscribe. Located anywhere in the world.
- **Therapists** — vetted professionals who applied through a 5-step form and were approved by the admin. They work an inbox-style portal, one client at a time.
- **Admin** — a single account (Asad, the founder). Reviews therapist applications, manages therapists and clients, monitors the business.

Clients and therapists **cannot self-register**. Accounts are system-issued: clients on payment confirmation, therapists on admin approval.

## Product Purpose

Connect clients to therapists matched on specialty, then hold the working relationship in a private portal — chat, worksheets, journal, and scheduled Zoom sessions. Success is a client who completes intake without abandoning, finds a therapist they can commit to, and keeps the relationship going month over month.

## Positioning

**Tag-based specialty matching against a fixed 27-item concern list.** Both sides pick from the identical list, so overlap is exact rather than approximate. Country, timezone, and treatment orientation never filter — the therapist pool is global and pre-vetted, so matching is on need alone.

## Operating Context

- Subscription: **€200/month**, one plan only. Includes 4 Zoom sessions per month plus unlimited chat. Sessions do not carry over.
- Sessions are **therapist-scheduled**; clients view and join, never book or reschedule in-app.
- All times stored UTC, displayed in each viewer's IANA timezone.
- Worksheets are file upload/download — filled in off-platform on the client's own device.
- Therapist portal is an inbox pattern: client list sidebar, feature tabs inside the selected client.

## Capabilities and Constraints

- **Stack (already scaffolded):** React (Vite) · Tailwind · Framer Motion · React Router · Redux · Node/Express · MongoDB Atlas + Mongoose · Socket.io · JWT + bcrypt · Jest · Cloudinary · Resend · Stripe/PayPal (platform TBC).
- **15 collections.** `privateNotes` must be structurally unreachable from any client-facing endpoint. `paymentEvents` is an append-only ledger.
- Account creation happens on **webhook confirmation only**, never browser redirect. Four documents in one transaction.
- Access token in memory only; refresh token hashed on the `users` record (one active session per user).
- Couples share exactly one account.
- **Undecided:** payment platform (Stripe / PayPal / both); whether worksheets stay file-based or become structured in-app forms.

## Brand Commitments

- Name: **Cast of Mind**. Existing tree-in-head logo (client to supply).
- Palette confirmed by client: `#19122B`, white, black, and a touch of yellow — extended into ink / ink-deep / gold / paper / mist / sage.
- Display face **Fraunces**; body face **Satoshi**.
- Footer credit: "Developed by Muhammad Hussnain", linked to LinkedIn.
- Voice: calm, trustworthy, premium, warm. Sentence case throughout, never ALL-CAPS headings.

## Evidence on Hand

- Full written specification: `Cast_of_Mind_Master_Spec.md` plus five split docs in `/docs`.
- Old site at `castofminds.netlify.app` — being fully replaced, treated as anti-reference.
- **No real testimonials, client counts, team bios, or therapist profiles exist yet.** Placeholders are permitted during development but must live in one centralized file per feature and be replaced before launch. Fabricated reviews or user counts on a live mental health platform are a consumer-protection risk — this is recorded in the spec as an explicit pre-launch blocker.
- No real logo asset supplied yet.

## Product Principles

1. **The anxious first-timer is the design constraint.** Density, urgency, and ambiguity all increase abandonment. Clarity converts better than persuasion here.
2. **Never leave the client with nothing.** Zero specialty matches returns the full therapist list silently — no "no match found" message. Gender preference sorts, never filters.
3. **Separation is the safety mechanism.** Clinical notes, payment history, and credentials are protected by architecture, not by UI hiding.
4. **Therapist-controlled, client-transparent.** The therapist owns scheduling and clinical judgement; the client always knows what is happening to their data and their money.
5. **No dark patterns, ever.** No urgency tactics, no retention friction on cancellation, no gamification, no motivational nudges.

## Accessibility & Inclusion

WCAG AA minimum on every screen: 4.5:1 body text, 3:1 large text. Responsive to 360px. Visible keyboard focus everywhere. Touch targets ≥44×44px. Semantic HTML with ordered headings and landmarks.

**`prefers-reduced-motion` must be fully respected** — all ambient and reveal motion disables and content appears immediately. This is a hard requirement, not a nicety: vestibular disorders are common and this audience is health-sensitive.
