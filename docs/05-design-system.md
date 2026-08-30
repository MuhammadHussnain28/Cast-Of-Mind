# Cast of Mind — Design System

> **Part of the Cast of Mind specification set.** The complete specification is
> `Cast_of_Mind_Master_Spec.md` — this file is an extract for focused reference during development.
> If this file and the master spec ever disagree, **the master spec wins** and this file must be re-synced.

**Source:** Master Spec v1.4 · **Sections included:** 24

Visual direction, colour palette, typography, motion language, and page-by-page design specifications.

**Read this file when:** building or styling ANY frontend component or page. Every visual decision must trace back to this file.

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

**Anti-goals:** SaaS-template look, harsh or neon gradients, floating 3D blobs, generic stock photography of smiling people, "Book a demo" energy, dark-pattern urgency.

> **Relaxed 2026-08-29 — approved by the developer.** This previously read "aggressive gradients", which was being applied as a ban on gradients altogether. Soft atmospheric gradients are now explicitly permitted — see §24.9. The anti-goal is *harshness*, never visual ambition.
>
> **Read this list as a register, not a fence.** Nothing here forbids depth, colour, movement or craft. A page that is calm because it is empty has failed the brief as surely as one that shouts.

### 24.2 Colour Palette

Base palette confirmed by the client: **#19122B**, white, black, and a touch of yellow. Extended into a full working system:

> **Accent changed 2026-08-22 — confirmed by Asad.** The accent moved from muted antique gold `#E3B23C` to warm saturated yellow **`#F5C518`**. The earlier spec text explicitly said "muted antique gold, **not** bright yellow"; that instruction is superseded. The token name stays `gold` so nothing downstream has to be renamed — read it as "the accent," not as a colour description.

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

- **The accent is an accent, not a theme.** Yellow still leads nothing and shouts nothing — but the rigid "roughly 5% of a screen" cap is **lifted (2026-08-29)**. Gold may now appear in borders, icon strokes, rules, small fills and card highlights as well as on CTAs. The test: does the eye still land on the primary action first? See §24.9.
- **`--mist` prevents the flat-white problem.** Alternate white and mist sections to create rhythm without hard dividers.
- **Sage is encouraged, not merely optional (relaxed 2026-08-29).** Use it freely in illustration, iconography, borders, ambient washes, growth motifs and success states — it is the warmth in a palette that is otherwise aubergine and paper. Standing limit: **never a competing CTA colour**, because two colours both reading as "press this" is a usability problem, not a taste one.
- **Never place yellow text on white** at any size; contrast fails. `#F5C518` on white is **1.63:1** — worse than the old gold's 1.96:1, so this rule is now stricter, not looser. Yellow is for fills, borders, and large display text on dark surfaces.
- **Yellow is never a focus ring on light surfaces.** It fails the 3:1 WCAG floor for focus indicators. Focus rings are `ink` on light surfaces and yellow only on dark ones.
- **Measured contrast:** `#F5C518` on `ink` `#19122B` = **9.5:1** (passes comfortably). On `paper` `#FFFFFF` = **1.63:1** (fails — fills and borders only).

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
- **Gentle scroll-linked motion is permitted (added 2026-08-29).** Layered parallax drifts of roughly **10-20px**, and reveals that unfold across a scroll rather than firing once. Slow and organic. The old rule read "no parallax on text" and had the effect of removing scroll-linked motion from the site entirely; the real constraint is **displacement, not element type** — 10-20px is a drift, 200px is a ride, and body copy a reader is mid-sentence in should never move under them.
- **No autoplay video with sound. Ever.**

**Recommended library:** Framer Motion (works cleanly with React, has built-in reduced-motion support).

### 24.5 Imagery & Illustration

- **Avoid generic stock photography of smiling people.** It reads as inauthentic and every competitor uses it.
- **Preferred direction:** abstract organic forms, soft gradients, botanical/growth motifs (aligning with the logo's brain-and-root form), and calm textural backgrounds.
- **Custom SVG, delicate line icons and authored visual accents are encouraged (2026-08-29)** wherever they clarify a concept or add human warmth. One consistent stroke weight; icons are drawn, never emoji or unicode glyphs.
- **Use good, relevant photography** where a real image serves the reader better than an abstraction. Human portraits are permitted as development placeholders (2026-08-29 decision, `docs/ongoing.md`) and must be replaced before launch.
- **Logo asset supplied 2026-08-22:** `client/src/assets/cast_of_mind logo.png` — 1764×1446, RGBA. A brain outline whose lower contour resolves into a trunk/root form, with the wordmark set across the middle.
  - **It is white artwork on transparency, so it is only usable on dark surfaces.** It disappears entirely on `paper` and `mist`. A dark (ink) version is required before the logo can appear on any light background — navbar, light footer, email headers, favicon. **Not yet supplied.**
  - The logo's lettering is a high-contrast Didone-style serif plus a script "of" — deliberately different from Fraunces. That is normal for a lockup; do not try to reset the logo in Fraunces.
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

### 24.9 Visual Latitude — What Is Explicitly Permitted

**Added 2026-08-29, approved by the developer.**

**Why this section exists.** The first build of the home page was correct against every rule in §24 and still landed flat — a stack of horizontal bands, each a rectangle of solid colour holding a heading, a paragraph and a grid. Nothing overlapped, nothing had depth, almost every animation was the same fade-and-rise. It read as premium but inert.

The cause was not the rules individually. It was that §24 was written almost entirely as prohibitions, so it was read defensively: an eight-token palette where two tokens were capped or discouraged, a motion section whose memorable line was "no parallax", and an anti-goals list nine items long. Following it literally produced restraint without character.

This section is the counterweight. **Everything below is permitted, and using it is expected rather than merely tolerated.**

#### The line that governs all of it

> **Natural, not decorated.** Every effect below has to look like a property of the material — light falling on a surface, a page settling, something growing. If it looks like an effect that was *applied*, it is wrong for this brand, however tasteful it is in isolation.

Nothing here overrides §24.1's audience. The reader is still often anxious, often new to therapy, sometimes in distress. The permissions below exist to make the site feel **alive and cared-for**, never busy, clever, or attention-seeking.

#### 1. Soft atmospheric gradients — permitted

- Smooth transitions within the palette: `ink-deep` into `ink`, `mist` into `paper`, a soft `sage` ambient wash, a warm low-opacity glow behind a focal element.
- Large, slow, low-contrast. A gradient should be felt before it is noticed.
- **Not permitted:** harsh stops, neon, multi-hue rainbows, gradients used as a button face, gradient text.

#### 2. Richer colour presence — `sage` and `gold`

- The rigid ~5% cap on gold is lifted. Gold may sit in borders, rules, icon strokes, small fills and card highlights.
- Sage moves from "optional" to encouraged: illustration, icons, borders, ambient washes, growth motifs.
- **The two standing limits are unchanged, because both are accessibility rather than taste:** gold is never text or a focus ring on a light surface (1.63:1), and `sage-deep` is the token for success *text* (plain `sage` is 3.44:1 on paper).
- The test is no longer a percentage. It is: **does the eye still land on the primary action first?**

#### 3. Gentle scroll depth and motion — permitted

- Layered parallax drifts of roughly **10–20px**.
- Scroll-linked reveals that unfold progressively, not only entrance animations that fire once.
- Depth cues that respond to scroll position: a background layer moving slower than its foreground.
- **Guardrails:** slow and organic. No displacement large enough to read as a ride. Nothing that moves body copy under a reader mid-sentence. `prefers-reduced-motion` still disables all of it, without exception.

#### 4. Meaningful SVG, icons and imagery — encouraged

- Custom SVG, delicate line icons, drawn diagrams and authored accents wherever they clarify a concept or add human warmth.
- One consistent stroke weight across the whole icon set. Icons are **drawn** — never emoji or unicode glyphs standing in for an icon system.
- Good, relevant photography where a real image serves the reader better than an abstraction.

#### 5. Spatial layering — permitted

- Break the flat rectangle. Gentle card offsets, elements that overlap or bleed past their container, content sitting at more than one visual depth.
- Soft shadows with a real offset and blur; `backdrop-blur` where something genuinely sits over something else.
- **Guardrails:** depth is declared once per element — a border *or* a shadow, not both. Blur is a material property of an overlapping surface, never decoration sprayed on a flat one. Nothing tilts or floats far enough to look unstable; this is a mental health platform, and the ground should feel solid.

#### What has NOT changed

Non-negotiable, and none of the above touches them:

- Every contrast floor in §24.2 and §24.6. WCAG AA everywhere, measured rather than assumed.
- `prefers-reduced-motion` fully respected.
- Responsive to 360px, visible keyboard focus, 44×44px touch targets, semantic HTML.
- Functional interactions stay at 150–250ms. Only ambient and reveal motion is slow.
- Sentence case. No ALL-CAPS headings.
- No dark patterns, no urgency, no gamification.
- The palette itself. These are permissions to use the eight tokens **more fully**, not permission to add a ninth.

---

