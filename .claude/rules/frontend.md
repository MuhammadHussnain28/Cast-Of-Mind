---
description: Frontend conventions for the Cast of Mind React app
globs: client/**
---

# Frontend Rules

Applies to everything under `/client`. Full design specification: `docs/05-design-system.md`.

**When building any UI component or page, use the impeccable skill for frontend design guidance.**

---

## The Audience

Visitors are often anxious, sometimes in distress, frequently seeking therapy for the first time. Every design decision serves that.

**Required feel:** calm, trustworthy, premium, warm.

**Never build:** urgency tactics, countdown timers, guilt-tripping copy, aggressive gradients, floating 3D blobs, stock photography of smiling people, "Book a demo" energy, gamification, streak counters, motivational nudges.

If something reads as "what any SaaS site would do," revise it.

---

## Colour

Tailwind theme tokens — use these names, never raw hex in components.

| Token | Hex | Use |
|---|---|---|
| `ink` | `#19122B` | Primary brand. Navigation, footer, headings, dark sections |
| `ink-deep` | `#0D0916` | Maximum-contrast text, deepest surfaces |
| `gold` | `#E3B23C` | Accent only. CTAs, active states, key highlights |
| `paper` | `#FFFFFF` | Primary background |
| `mist` | `#F4F2F7` | Alternating section backgrounds, cards |
| `sage` | `#7C9082` | Growth/calm motifs, success states, illustration |

**Rules:**

- **Gold is scarce.** If more than ~5% of a screen is gold, reduce it. Its power comes from restraint.
- **Never gold text on white** at body size — contrast fails. Gold is for fills, borders, and large display text on dark.
- **Alternate `paper` and `mist`** for section rhythm instead of hard dividers.
- **Sage never competes with gold** as a CTA colour.

---

## Type

| Role | Face | Notes |
|---|---|---|
| Display | **Fraunces** | Display sizes only. Never body copy or UI labels. |
| Body / UI | **Satoshi** | Fallback: Instrument Sans |

| Use | Size | Weight |
|---|---|---|
| Hero headline | 64–80px | 400–500 |
| Section heading | 40–48px | 400 |
| Subsection heading | 24–28px | 500 |
| Body | 17–18px | 400 |
| Small / caption | 14px | 400 |

- Body line-height ≥ 1.6
- Line length capped ~70 characters
- Sentence case throughout. **No ALL-CAPS headings** — reads as shouting to an anxious reader.

---

## Motion

**The signature: ambient motion runs on a slow breathing rhythm, not standard UI snaps.**

| Type | Duration | Where |
|---|---|---|
| Ambient / atmospheric | 4s+, infinite, ease-in-out | Hero background drift, illustration movement |
| Scroll reveals | 600–800ms, ease-out, 80–120ms stagger | Section entrances |
| Micro-interactions | 150–250ms | Hover, button feedback, form focus |

**Non-negotiable:**

- **Functional interactions stay fast.** Only ambient and reveal motion is slowed. A button responding in 4s is broken, not calm.
- **`prefers-reduced-motion` fully respected** — all ambient and reveal motion disables, content appears immediately. Accessibility requirement, not a nicety.
- No parallax on text. No autoplay video with sound, ever.

Use Framer Motion.

---

## Components

- Custom-built in `/src/components/ui`. **No component library.**
- Compose from existing primitives before creating new ones.
- Props typed, sensible defaults, no required props without defaults where avoidable.
- Every interactive component: loading, disabled, error, and focus states.

---

## Accessibility Floor

Every screen, no exceptions:

- Responsive down to **360px**
- Visible keyboard focus on all interactive elements
- Touch targets ≥ **44×44px**
- WCAG AA contrast — 4.5:1 body, 3:1 large text
- Semantic HTML: headings in order, landmarks, no div-only structure
- Forms: real labels with `htmlFor`, inline validation, errors that explain **how to fix**
- Decorative images `alt=""`; meaningful images described
- Modals: focus-trapped, Escape closes, focus returns on close

---

## State

- **Access token in memory only.** Never localStorage, sessionStorage, or persisted Redux. This is a security requirement — JavaScript-readable storage is XSS-vulnerable.
- Redux for auth, user, and cross-cutting state. Local state for component concerns.
- Server data through the API client in `/src/lib` — no scattered `fetch` calls.
- Draft persistence (questionnaire, therapist form) may store non-sensitive answers. **Never persist passwords.**

---

## Portals vs Marketing

`docs/05-design-system.md` §24.8 — these are different modes.

| | Marketing pages | Portals |
|---|---|---|
| Density | Generous | Denser |
| Motion | Ambient + reveals | Minimal |
| Priority | Emotional impact | Task speed |

Same palette and typefaces throughout for brand continuity.

**Empty states are designed, never blank.** But keep them honest and plain — no motivational messaging, no gamification. The therapist portal's empty state is deliberately minimal: *"No clients yet. You'll see them here once they're matched with you."* Do not add profile prompts or tips to it.

---

## Content Rules

- Write real copy. No lorem ipsum.
- Placeholder content (testimonials, team bios, client counts) goes in **one data file per feature**, marked `// TODO: PLACEHOLDER — REPLACE BEFORE LAUNCH`, and logged in `docs/ongoing.md` under pre-launch blockers.
- Never invent credentials, qualifications, or statistics that could be mistaken for real claims.
