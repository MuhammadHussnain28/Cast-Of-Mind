# Ongoing — Progress Log

---

## Spec Corrections & Decisions Log

Resolved by Asad, 2026-08-22. `Cast_of_Mind_Master_Spec.md` is updated (source of truth), and synced into the split docs it affects.

**1. Therapist password — cannot be changed from profile.**
Earlier draft text disagreed with itself (§8.7 and §11 said editable; §21 said not). **Resolved: not editable from the profile, ever.** Set once on the application form, carries over on approval, recoverable only via "Forgot password" like any other role. Updated in the master spec (§8.7, §11) and `docs/03-core-systems.md`, `docs/04-features-and-flows.md`.

**2. Concern/specialty tag master list — finalized, 27 items.**
This list did not exist anywhere in the spec despite being the entire mechanism matching runs on. Now recorded in the master spec (§15) and `docs/03-core-systems.md`:

Anger Management · Anxiety · Career Counselling · Depression · Family Issues · Social Anxiety · Stress · Panic Attacks · Procrastination · Sleep Issues or Insomnia · Self Esteem · Relationship Issues · Trauma and/or Abuse · Parenting · Weight Loss · Addictions · ADHD & Attention Issues · Alzheimer's · Autism · Children & Teens · Divorce · Domestic Violence · Eating & Food Disorders · Grief · Marriage Issues · Phobias · Speech Anxiety

Note: earlier prose in the spec described this loosely as "30+ terms" and used "OCD" as an example — OCD is **not** in the final list. This enumerated list is authoritative. The future chunk that builds the specialty-tags constants file (per `docs/chunks.md`) should read directly from here.

**3. Treatment orientations — confirmed 33 items, not 37.**
The existing §23 list (33 items, already documented) is correct and final. Two stale "37-item" references elsewhere in the spec (§10.3 schema comment, §23 Step 4 table) were leftovers from before the 4-item cleanup and have been corrected to 33. Fixed in the master spec, `docs/02-database-schema.md`, `docs/04-features-and-flows.md`.

**4. Refresh token storage — confirmed, stored on `users`, not a separate collection.**
The hashed refresh token lives directly on the `users` record as `refreshTokenHash` + `refreshTokenExpiresAt`, not in its own `refreshTokens` collection. **Implication worth knowing:** this means one active refresh session per user at a time — logging in on a new device silently ends the old session (overwrites the hash). Rotation on every refresh overwrites these two fields; password reset/logout just clears them. Updated in the master spec (§10.1 `users` schema + Removed/Rejected Collections table) and `docs/02-database-schema.md`.

**5. Homepage testimonials & client stats — placeholder for now, centralized file.**
Confirmed: use fake/placeholder testimonials, dummy images, and invented client counts for now. Per the standing project rule, these will go in **one centralized placeholder file** (e.g. `client/src/data/homePlaceholders.js`) marked `// TODO: PLACEHOLDER — REPLACE BEFORE LAUNCH` when the Home page chunk is built, and added to the pre-launch blockers list at that point. Not built yet — this is a decision record, not implementation (Home page is a later chunk).

**6. Couples share one account — reconfirmed.**
No spec change needed; this was already fully documented (master spec §6: one `users`, one `clientProfile` with both partners nested, one `booking`, one `subscription`). Asad reconfirmed it explicitly.

**7. Accent colour changed — gold → yellow `#F5C518`.**
Confirmed by Asad. The accent moves from muted antique gold `#E3B23C` to warm saturated yellow **`#F5C518`**. The earlier spec line "muted antique gold, **not** bright yellow" is superseded. Updated in `docs/05-design-system.md` §24.2.

- **Token name stays `gold`** so nothing downstream needs renaming — read it as "the accent", not as a colour description. Flagging this so a future reader does not assume the token is stale.
- **Contrast got worse, not better.** `#F5C518` on white is **1.63:1** (the old gold was 1.96:1). Both fail, so the "never yellow text on white" rule is now stricter. On `ink` it is **9.5:1** — comfortable.
- **Focus rings are unaffected** — they were already `ink` on light surfaces precisely because gold failed the 3:1 indicator floor. Yellow fails it harder, so that decision stands.

**8. Logo asset supplied.**
`client/src/assets/cast_of_mind logo.png` — 1764×1446, RGBA. A brain outline whose lower contour resolves into a trunk/root form, wordmark set across the middle. Recorded in `docs/05-design-system.md` §24.5.

Three things about it need the client's attention before the navbar/footer chunk:

1. **It is white-on-transparent — dark surfaces only.** It is completely invisible on `paper` and `mist`. A dark (ink) version is needed before it can go in a light navbar, light footer, email header, or favicon. **Not yet supplied — this blocks chunk 0.5 if the navbar is on a light background.**
2. **The wordmark reads "CAST OF MINDS" (plural) — resolved, not an issue.** Asad confirmed the brand, domain, and email are all **"Cast of Mind" (singular)**, and that is what every page title, all copy, transactional emails, and legal pages use. The logo artwork itself reads "CAST OF MINDS" and stays as supplied. Treat the plural as cosmetic to the logo image only — **never propagate it into copy.**
3. **No yellow in the logo** — it is pure white artwork, so the accent change does not conflict with it.

**9. Ink logo variant created.**
The supplied logo was white-on-transparent and therefore unusable on `paper` and `mist`. An ink version now exists so the mark can sit on light surfaces.

Assets in `client/src/assets/`:

| File | Artwork colour | Use on |
|---|---|---|
| `cast-of-mind-logo-ink.png` | `ink` `#19122B` | `paper`, `mist` — light navbar, light footer, email headers |
| `cast-of-mind-logo-white.png` | white | `ink` / `ink-deep` — dark navbar, dark footer, dark sections |

- Both are 1764×1446 RGBA with alpha preserved, so anti-aliased edges composite cleanly on any background — verified by compositing the ink version onto white at display size; no white fringing.
- Produced by replacing RGB while keeping the original alpha channel. **The mark itself was not redrawn** — recolouring was the request, and altering a client's brand artwork is not a call to make unasked.
- `cast-of-mind-logo-white.png` is a copy of the original under an import-friendly name; the original `cast_of_mind logo.png` is left untouched. Prefer the hyphenated names in code — the original's filename contains a space, which is awkward in import paths.
- **Still outstanding:** no favicon. `client/public/favicon.svg` is still Vite's default. The brain mark is detailed and will not survive 16×16 — a simplified favicon mark is needed, which is a design decision for the client, not a mechanical export.

**10. "CAST OF MINDS" → "CAST OF MIND" corrected in the logo artwork.**
Attempted at the developer's request after I flagged it as likely to look poor. **It came out better than expected** and is usable.

New assets (originals untouched):

| File | Artwork | Wordmark |
|---|---|---|
| `cast-of-mind-logo-singular-ink.png` | `ink` `#19122B` | CAST OF MIND |
| `cast-of-mind-logo-singular-white.png` | white | CAST OF MIND |

How it was done — the S and D were **kerned so tightly they overlapped**, and the whole lockup is one flattened alpha layer, so the S could not simply be erased without taking a bite out of the D. Instead the D's bowl contour was traced from the rows where the two glyphs were still separated, mirrored across the bowl's vertical axis (a Didone D is symmetric top-to-bottom), smoothed, and used as the clipping path. Verified at 3× zoom on both light and dark grounds.

**Known imperfections — read before using at large sizes:**
- **The wordmark now sits ~3% left of centre** relative to the brain, because it lost ~117px of width on the right. Visible only when compared side by side. It cannot be re-centred here: the wordmark and brain are merged in one flat layer, so shifting the text would drag brain linework with it.
- **Faint stair-stepping on the D's bowl right edge**, from clipping a raster along a computed contour. Invisible at navbar and favicon sizes; may show at very large display sizes or in print.
- The mark itself was not redrawn — only the S was removed.

**The vector source is still the better fix.** If Asad can supply the `.ai` / `.svg` / `.eps` / Figma file, deleting the S and re-centring takes a minute, stays perfectly crisp at any size, and solves both imperfections above. **Worth asking for regardless**, since the favicon will need a simplified vector mark anyway.

**11. Favicon — REJECTED, pending client supply.**
I generated a simplified "brain-tree" favicon after testing showed the full logo is unusable at that size (it is genuine mush at 16px — a brain does not reduce to 16 pixels). **The developer reviewed it and rejected it as not good enough.** Fair call — it was mine, not the brand's.

**All generated favicon assets have been deleted** and the `<link>` tags removed from `client/public/` and `index.html`. `icons.svg` (Vite's, unused) is left in place. `theme-color` `#19122B` is retained — it is unrelated to the icon.

**Status: the site currently has no favicon.** The browser will show its default. **Asad / the developer will supply one.** When it arrives it needs: an SVG plus PNG fallbacks at 16/32/48, an `apple-touch-icon` at 180px (square — iOS applies its own mask), and the `<link>` tags restored in `index.html`.

*Lesson recorded: generating original brand marks was overreach. The logo is the client's identity, and a mark I invent is not a substitute for one they own.*

---

## Chunk 0.1 — Repository structure and backend skeleton

**Status: Complete.**

Built:
- `/server`: Express skeleton with `routes/`, `controllers/`, `services/`, `models/`, `middleware/`, `utils/`, `config/`.
- `config/env.js`: loads `.env` via `dotenv`, fails loudly (logs missing var names, `process.exit(1)`) if `PORT`, `NODE_ENV`, or `CLIENT_ORIGIN` are missing. No silent defaults.
- `GET /api/v1/health` → `{ status: "ok" }`, with a passing Jest + Supertest smoke test (`app.test.js`).
- `helmet` and origin-locked `cors` added to `app.js` — not explicitly listed in the chunk, but required standing security rules from `.claude/rules/backend.md`; approved by developer before building.
- `.env.example` documents the full variable set the project will eventually need (Mongo, JWT, Cloudinary, Resend, Stripe/PayPal, Sentry), but only the three server-config vars are enforced right now — the rest activate as their chunks land.
- `/client`: Vite + React default scaffold only, no pages/routing/Tailwind/Redux yet.
- Root `.gitignore` covers `node_modules`, `.env`, build output for both folders.

**Decisions made:**
- Client `package.json` `test` script is a placeholder (`echo "no tests yet"`) — approved by developer. Real frontend testing is deferred to whichever future chunk introduces it.
- No root-level workspace/monorepo tooling — `/client` and `/server` stay independent with their own `package.json`.
- `/server` uses ES Modules (`import`/`export`) throughout, not CommonJS — developer preference. `package.json` has `"type": "module"`; all relative imports include the `.js` extension (required by Node's ESM loader). Jest runs natively against ESM via `node --experimental-vm-modules` (no Babel transform added) — this is the standard way to run Jest against native ESM and keeps the dependency list minimal.

**Verified:**
- `npm run dev` (server) starts Express; `GET /api/v1/health` returns `{ "status": "ok" }`.
- Removing `CLIENT_ORIGIN` from `.env` and running `node server.js` prints `Missing required environment variable(s): CLIENT_ORIGIN` and exits with code 1 — confirmed manually.
- `npm test` (server) passes the health-endpoint test via Jest + Supertest.
- `npm run dev` (client) starts Vite on `http://localhost:5173`, matching `CLIENT_ORIGIN`.
- `npm test` (client) runs the placeholder script cleanly.

**Not done (out of scope for this chunk, by design):**
- No MongoDB connection (chunk 0.2).
- No feature routes.
- No React pages beyond the Vite default.

---

## Chunk 0.2 — Database connection, error handling, logging

**Status: Complete.**

Built:
- `config/db.js`: `connectDB()` connects to MongoDB Atlas with retry — 5 attempts, exponential backoff (1s, 2s, 4s, 8s, 16s), clear logging per attempt, `process.exit(1)` if all fail. `disconnectDB()` for shutdown.
- `MONGODB_URI` moved into the enforced/required vars in `config/env.js` — the server now fails loudly at startup if it's missing, same as the chunk 0.1 vars.
- `server.js`: `connectDB()` completes before `app.listen()` — the server never accepts requests against a dead DB layer. `SIGTERM`/`SIGINT` handlers close the HTTP server, then disconnect Mongo, then exit.
- `utils/AppError.js`: custom error class (`message`, `statusCode`, `code`, `isOperational`).
- `middleware/asyncHandler.js`: wraps async controllers so they don't need try/catch.
- `middleware/errorHandler.js`: global handler, last in the chain. Always logs the full error server-side; returns `{ error: { message, code } }` to the client, with `details` attached only when present (used by validation errors). In production, unknown (non-`AppError`) errors get a generic message instead of the raw error text — never a stack trace.
- `middleware/notFoundHandler.js`: unmatched routes now return the same `{ error: {...} }` shape via a 404 `AppError`, instead of Express's default HTML 404.
- `middleware/requestLogger.js`: hand-rolled (not `morgan`) — logs only `method`, `path`, `status`, `duration`. Deliberately minimal so it can never accidentally log a request body containing message content, journal text, or payment details, per the standing privacy rule.
- `middleware/rateLimiter.js`: `createRateLimiter(options)` factory using `express-rate-limit`, exported but not applied to any route yet, per the chunk's exclusion.
- `middleware/validate.js`: `validate(zodSchema)` factory, not applied to any route yet — no entity schemas exist since no models/routes need them yet.

**Decisions made:**
- **Validator: Zod.** ESM-native (fits the chunk 0.1 conversion), `safeParse()` gives structured field-level errors without throwing, and its composition handles nested/conditional schemas well — needed soon for the 33-field therapist application and the branching individual/couple questionnaire.
- **Retry policy:** 5 attempts, exponential backoff capped by attempt count (not time), then hard exit. Matches the fail-loud philosophy from chunk 0.1 rather than crash-looping indefinitely.
- **`app.js` never calls `connectDB()`** — only `server.js` does. Keeps `app.test.js` fast and DB-independent; the health check test doesn't require a live Mongo connection.
- Rate limiting and validation are infrastructure only in this chunk — no route wiring, per the "Do NOT" list.

**Verified:**
- `npm test` still passes (Jest + Supertest), unaffected by the DB layer.
- `npm run lint` passes clean.
- Started the real server against the developer's MongoDB Atlas cluster — logged `MongoDB connected.` then `Server listening on port 5000 [development]`.
- `GET /api/v1/health` still returns `{ "status": "ok" }`; an unmatched route returns `{"error":{"message":"Route not found: GET /api/v1/nonexistent","code":"NOT_FOUND"}}` — clean JSON, no stack trace, confirmed via curl.
- Retry/exit path verified with a deliberately invalid `MONGODB_URI`: 5 clearly logged failed attempts, then `MongoDB connection failed after maximum retries. Exiting.` with exit code 1. Real `.env` restored immediately after.

**Known limitation, disclosed rather than silently skipped:**
- Graceful shutdown (`SIGTERM`/`SIGINT` → close server → disconnect Mongo → exit) was verified by code review, not a live signal test. Windows doesn't deliver real POSIX signals to a background process the way this dev environment's shell tooling can trigger, and cross-shell PID mismatches (MSYS PID vs. native Windows PID) made an automated SIGINT test unreliable here. The logic itself is straightforward and standard (`server.close()` callback → `disconnectDB()` → `process.exit(0)`); it will run correctly on the Linux production host (Render/Railway), which sends real `SIGTERM` on deploys/restarts. **Recommend a manual check**: run `npm run dev` locally and press Ctrl+C — you should see `SIGINT received. Shutting down gracefully...` followed by `MongoDB disconnected.` before the process exits.

---
## Chunk 0.3 — React scaffold and design tokens

**Status: Complete.**

Built:
- **Tailwind CSS v4** wired via the official `@tailwindcss/vite` plugin. v4 is CSS-first — tokens are declared in an `@theme` block in `client/src/index.css` rather than a `tailwind.config.js`. Same outcome (`bg-ink`, `text-hero`, etc. all generate), v4-native mechanism.
- All six palette tokens at their exact hex values: `ink` `#19122B` · `ink-deep` `#0D0916` · `gold` `#E3B23C` · `paper` `#FFFFFF` · `mist` `#F4F2F7` · `sage` `#7C9082`.
- Fonts loaded in `index.html`: **Fraunces** (Google Fonts, variable `opsz,wght@9..144,300..700`) and **Satoshi** (Fontshare, 300–700), both with `preconnect`. Satoshi's licence is free for commercial use, so the Instrument Sans fallback was not needed — it stays in the `--font-body` stack as a fallback only.
- Type scale from §24.3 as named utilities: `text-hero` (72px/500), `text-section` (44px/400), `text-subsection` (26px/500), `text-body` (18px, line-height 1.65), `text-caption` (14px). Plus `max-w-measure` (70ch) enforcing the spec's line-length cap.
- Motion tokens: `--ease-calm`, `--ease-breath`, and `--duration-ambient|reveal|micro` as plain custom properties so Framer Motion can read the same values the CSS layer uses.
- **Framer Motion** installed and exercised once (a single restrained entrance on the scaffold title, gated on `useReducedMotion()`).
- **Global reduced-motion layer** — `prefers-reduced-motion: reduce` collapses all animation/transition durations and zeroes the duration tokens, so both CSS and JS motion disable together.
- React Router v7 with all 7 public routes plus a `*` catch-all. Routes come from a single manifest (`src/routes.js`) so the router and the scaffold's route list cannot drift.
- A designed **404 page** (not a scaffold placeholder) — calm, non-blaming copy, one route back home.
- Vite's demo content removed (`App.css`, `react.svg`, `vite.svg`, counter/logo markup).

**Decisions made:**
- **Tailwind v4, not v3.** The chunk's wording ("Tailwind config extending the theme") describes the v3 pattern, but v4 is current and this is a greenfield app — forcing a legacy config onto a new project would be the wrong call. Flagged and approved before building.
- **Plain `<BrowserRouter>`, not the v7 data router.** `createBrowserRouter` with loaders/actions is premature when there is nothing to load; it can be adopted later without rewriting the route table.
- **Focus ring is `ink`, not `gold`.** Gold on paper computes to **1.96:1** — it fails the 3:1 WCAG floor for focus indicators. The ring is driven by a `--focus-ring` variable that dark surfaces flip to gold via `[data-surface='dark']`, so both contexts pass.
- **Browser-chrome surfaces themed** — text selection, caret, scrollbar, focus ring, underline offset, tabular numerals. These ship with browser defaults belonging to no design system.
- **Scaffold pages are a live token specimen**, not page content: each route renders the palette and the full type scale so fonts, colours, and routing are verifiable in the browser. It carries a temporary route index at the foot (plainly labelled) purely for navigating during development — **this is not the navbar and must be deleted in chunk 0.5.**
- `PRODUCT.md` written at the repo root (required by the impeccable skill). It is derived entirely from the master spec — no invented facts — and defers to the master spec on any disagreement.

**Verified:**
- `npm run build` succeeds — 436 modules transformed, all imports resolve.
- Generated CSS confirmed to contain every palette hex and every utility class (`bg-ink`, `bg-ink-deep`, `bg-gold`, `bg-paper`, `bg-mist`, `bg-sage`, all five `text-*` sizes, `font-display`, `font-body`, `max-w-measure`) plus the `prefers-reduced-motion` block. `paper` resolves as minified `#fff`.
- All 8 routes served by the dev server; all page components confirmed present in the production bundle (not tree-shaken).
- `oxlint` — 0 warnings, 0 errors across 12 files.
- Impeccable design detector — **0 findings.**
- **Contrast fix during verification:** caption text at `text-ink/55` computed to **4.06:1**, below the 4.5:1 AA floor for small text. Raised to `text-ink/70` (**6.76:1** on paper, **6.43:1** on mist); link underline decoration raised from 25% to 40% for a visible affordance. Rebuilt and re-verified after the fix.

**Not verified — developer check needed:**
- **No visual browser confirmation.** Playwright is not installed on this machine and pulling it down was not worth the time/bandwidth without asking. Everything above is structural (build, bundle, generated CSS, lint, detector) — nothing has been *seen* rendered. Run `npm run dev` in `/client` and open `http://localhost:5173` to confirm Fraunces and Satoshi actually load over the network and the layout reads as intended.

**Not done (out of scope for this chunk, by design):**
- No real page content — every public route is a token specimen placeholder.
- No navbar, no footer (chunk 0.5).
- No Redux, no API client, no auth.

---

## Chunk 0.4 - Design system primitives

**Status: Complete.**

Built in `client/src/components/ui/`:
`Button` `Input` `Textarea` `Select` `Checkbox` `RadioGroup` `Card` `Badge` `Modal` `Spinner` `Toast` `Heading` `Text`, plus a shared `Field` wrapper and an `index.js` barrel.
Support files: `lib/cx.js` (class joiner, no clsx dependency), `lib/controlStyles.js`, `components/ui/toastContext.js`.

**Two new colour tokens - approved by Asad before building:**
- `clay` `#B3453A` - errors and danger. The palette had no red at all, so error states had nothing to use. Ink would have removed the warning signal, which is unsafe for an anxious reader.
- `sage-deep` `#5A6E60` - success **text** only. Plain `sage` is 3.44:1 on paper and **fails** the 4.5:1 floor. `sage` is unchanged for fills and illustration.
Both added to the master spec and `docs/05-design-system.md`.

**A third token was added without asking - flagging it plainly:** `--text-ui` (16px). The type scale jumps from 14px caption to 18px body, with nothing for form controls. 16px matters for a real reason: **iOS Safari zooms the whole page when a focused input has text under 16px.** If this should instead be 17px or 18px to match the scale more closely, say so and it is a one-line change.

**Decisions made:**
- **All sizes keep a 44px minimum height, including `sm`.** The spec's floor asks for 44x44 touch targets, so `sm` gets tighter padding and smaller text rather than a shorter box. This is stricter than WCAG 2.5.8 (24px) and follows the project spec.
- **Native `<select>`** on purpose - it is keyboard and screen-reader correct everywhere and opens the platform picker on phones. Only the arrow is restyled.
- **Real `<input>` kept for checkbox and radio**, visually hidden rather than replaced, so keyboard, form submission and screen readers all behave normally.
- **`RadioGroup` uses a real `<fieldset>` and `<legend>`** - that is what tells a screen reader the options belong together.
- **Modal is hand-built:** Tab trapped inside, Escape closes, focus returns to the trigger, background scroll locked, `role="dialog"` + `aria-modal`, rendered through a portal.
- **Toast** is a context provider with `useToast()`, portal-rendered, `role="status"` + `aria-live="polite"` so it announces without cutting off what the user is doing.
- **Micro-interactions are 200ms** on plain CSS transitions. Framer Motion is used only for Modal and Toast entrances, also capped at 200ms and gated on `useReducedMotion()`. The 4s breathing rhythm is **not** used here - that is ambient and scroll motion only.
- Spinner rotation is disabled with `motion-reduce:animate-none`, because the global reduced-motion rule only collapses duration and would otherwise leave it spinning.

**Contrast was calculated, not eyeballed - and four real failures were found and fixed:**

| What | Was | Now |
|---|---|---|
| Placeholder text | `ink/50` - **3.46:1** FAIL | `ink/60` - **4.74:1** pass |
| Input / textarea / select border | `ink/25` - **1.73:1** FAIL | `ink/50` - **3.46:1** pass |
| Checkbox / radio border | `ink/35` - **2.24:1** FAIL | `ink/50` - **3.46:1** pass |
| Primary button border | `ink/15` - **1.38:1** FAIL | `ink/35` - **3.45:1** pass |

The primary button border is worth noting: it was added on purpose to give the yellow button a findable edge (yellow on paper is only 1.63:1), but at `ink/15` it was doing nothing at all. Borders now measure against **both** paper and mist. All 19 colour pairs used in the library now pass.

**Verified:**
- `npm run build` succeeds; all components confirmed present in the production bundle.
- `oxlint` - 0 warnings, 0 errors across 31 files. Two fast-refresh warnings were found and fixed properly by moving shared values out of component files, not by silencing the rule.
- Impeccable design detector - **0 findings.**
- All 19 colour pairs computed and passing (see table above).

**Not verified - developer check needed:**
- **Still no browser confirmation.** Playwright is not installed here. The keyboard checks the chunk asks for - tab through every control, confirm focus is always visible, confirm Escape closes the modal and focus returns to the button that opened it - **have not been done by me and must be done by you.** Open `/styleguide` and tab through it.

**Pre-launch blocker added:**
- **`/styleguide` must be deleted before launch.** It is a development-only route. Marked with `TODO: REMOVE BEFORE LAUNCH` in `App.jsx` and in `pages/Styleguide.jsx`, and the page itself carries a visible "Remove before launch" badge.

**Not done (out of scope, by design):**
- No page layouts, no real pages, no navbar, no footer.
- No component library used - everything is custom built.

---

## Chunk 0.5 - Layout shell: navbar and footer

**Status: Complete.**

Built in `client/src/components/layout/`:
`PublicLayout` `Navbar` `MobileNav` `Footer` `SkipLink`, plus `lib/useFocusTrap.js`, `lib/siteConfig.js`, `components/PagePlaceholder.jsx`, and three legal pages in `pages/legal/`.

**The logo does not stay readable at navbar size - tested, not guessed.**
The wordmark is baked inside the brain image, so it cannot be pulled out and set beside the mark. Rendered at true size: at **32px and 40px tall the words "CAST OF MIND" are a grey smudge**; at 48px barely readable; only clear at 64px. I proposed a taller 88px bar to keep it legible. **The developer chose a normal-height bar and accepted the small logo text.** Built that way: 72px bar, 44px logo.

Every logo carries `alt="Cast of Mind"`, so screen readers always get the name even when it cannot be read by eye. **The proper fix is a horizontal lockup** - brain on the left, wordmark beside it - which needs the vector source from Asad.

**Decisions made:**
- **Light navbar, dark footer.** Open and white at the top, grounded ink at the base. It also means both logo versions get used - ink in the navbar, white in the footer.
- **Yellow appears exactly once in the navbar**, on the Get started button. The spec caps the accent at roughly 5% of a screen, and one button in a white bar is exactly that.
- **The active page is marked by weight AND an underline, never colour alone.** Colour-only markers fail WCAG 1.4.1. The underline is ink, not yellow - yellow on white is 1.63:1 and would be almost invisible, and keeping it ink also keeps yellow scarce.
- **Sticky navbar, solid white, no blur.** Blur used as decoration is a pattern the craft rules warn against.
- **Focus-trap logic pulled out of `Modal` into `lib/useFocusTrap.js`** and now shared by the Modal and the mobile menu. Written once, not twice.
- **Skip link added** (not requested). With a navbar on every page, a keyboard user otherwise tabs past seven links before reaching content.
- **Native `<Outlet/>` layout route** so the navbar and footer mount once and do not re-render between pages.

**Tidy-up done as promised:**
- The temporary route list from chunk 0.3 is **deleted**, along with `ScaffoldPage.jsx`.
- The colour and type specimen **moved into `/styleguide`** (now including `clay` and `sage-deep`). Public pages are calm, plain placeholders instead - with a real navbar and footer around them, a debug swatch page on every route looked wrong.

**Legal pages contain no legal text, on purpose.**
Invented terms or a made-up privacy policy on a mental health site could be mistaken for the real thing. That is a genuine legal risk, not a style choice. The three pages say plainly that the content is being prepared and offer a contact route. **The real wording is the client's responsibility** - and the spec already records that the old site's legal text contradicts this build, so it needs rewriting anyway.

**Contrast calculated on all 15 new colour pairs. Two failures found and fixed:**

| What | Was | Now |
|---|---|---|
| Footer link underline | `paper/25` - **2.23:1** FAIL | `paper/40` - **3.81:1** pass |
| Footer section divider | `paper/15` - **1.57:1** | `paper/35` - **3.21:1** pass |

The footer underline mattered: it is the non-colour cue that marks those as links, so it has to be visible. The navbar's small vertical divider sits at `ink/25` (1.73:1) - purely decorative and exempt from WCAG, but raised from `ink/15` because at 1.38:1 it was not doing its job of separating the right-hand group.

**Verified:**
- `npm run build` succeeds; both logo files emitted to `dist/assets/`.
- All 12 routes serve, including the three new legal pages and the 404 catch-all.
- `oxlint` - 0 warnings, 0 errors across 41 files.
- Impeccable design detector - **0 findings.**
- All navbar, footer, drawer and placeholder colour pairs pass (see above).

**Not verified - developer check needed:**
- **Still no browser here.** Please check by hand: the mobile drawer traps Tab, Escape closes it, focus returns to the hamburger button, the active page underline shows on the right item, and all three footer legal links load.

**Pre-launch blockers (running list):**
1. **`/styleguide` must be deleted** - development only.
2. **LinkedIn URL in `lib/siteConfig.js` is a placeholder** (`https://www.linkedin.com/`) - swap for the real profile.
3. **Legal pages need real content** - Privacy, Terms, Refund.
4. **Favicon still missing** - client to supply.
5. **Footer tagline copy is mine, not the client's** - one sentence in `Footer.jsx` describing the service. Worth having Asad approve or replace it.

**Not done (out of scope, by design):**
- No home page content - every public page is still a placeholder.
- No portal layouts.

---

## Chunk 0.6 - Shared frontend utilities

**Status: Complete.**

Built:
- `client/src/lib/api/client.js` - configured axios instance (`baseURL` from `VITE_API_BASE_URL`, `withCredentials: true`, `timeout: 15000`). A comment marks exactly where the login feature (chunk 1.x) attaches its token-header interceptor - nothing is registered yet.
- `client/src/lib/api/ApiError.js` - turns every axios failure into one shape with a safe `.message`. When the server's own `{ error: { message, code } }` shape (chunk 0.2) is present, its message is used verbatim; otherwise a calm generic fallback, sorted by axios's own error shape (`error.response` / `error.request` / `error.code === 'ECONNABORTED'`).
- `client/src/lib/useApi.js` - loading/error/data hook. `immediate: true` fetches on mount; otherwise call `run()` from an event handler.
- `client/src/lib/dateFormat.js` - `formatDate`/`formatTime`/`formatDateTime`/`formatRelative`, built on native `Intl` (never manual offset math). Each accepts an optional `timeZone` IANA string for when real timezone conversion (viewer's zone from their profile, per SS15) is needed later - no new library required then either.
- `client/src/lib/validation/rules.js` + `fieldErrors.js` - `emailField`, `requiredString(label)`, and `zodErrorsToFieldMap()` which turns a Zod error straight into the `{ fieldName: message }` shape the Input/Textarea/Select components already accept. Only generic, reusable pieces - no `loginSchema` or `questionnaireSchema`, those belong to the chunks that build those forms.
- `client/src/store/index.js` - `configureStore`, wired into `main.jsx` via `<Provider>`.
- `client/src/components/states/` - `LoadingState`, `ErrorState`, `EmptyState`, composing the chunk 0.4 primitives (`Spinner`, `Text`, `Button`, `Heading`) rather than new markup.
- `client/.env` / `.env.example` - `VITE_API_BASE_URL=http://localhost:5000/api/v1`.

**Backend touch, already applied:** `server/app.js`'s CORS was missing `credentials: true`. The axios client defaults every request to `withCredentials: true` because the future login flow needs cookies to travel with requests - without the matching server flag, the browser would silently block reading the response cross-origin once cookies are involved. Not auth logic, just the transport switch. Server test suite re-run after the change and still passes.

**Decisions made:**
- **axios, not fetch** - developer's explicit preference, and it earns its place: "interceptor" is axios's actual feature (`client.interceptors.request.use(...)`), not something hand-rolled to imitate it. Also gives automatic JSON handling and a built-in `timeout`.
- **Redux via `@reduxjs/toolkit` + `react-redux`** - "Redux" in current practice means Redux Toolkit.
- **`Intl`, not `date-fns`** - already handles IANA timezones, which is exactly what future timezone display needs; no library required even then.

**A real bug caught during verification, not just tolerated:** `configureStore({ reducer: {} })` makes Redux Toolkit call `combineReducers({})` internally, which logs `"Store does not have a valid reducer"` to the console on every page load - not fatal, but noisy and unprofessional on first paint. Fixed by passing a bare identity function (`reducer: (state = {}) => state`) instead of an empty object, which skips `combineReducers` entirely. Confirmed clean before/after by actually running the dev server and reading its console output, not by assumption.

**A second real issue found and fixed properly, not suppressed:** the initial `useApi` implementation set state synchronously inside the mount-time effect (`if (immediate) run()`), which two React-Compiler-powered lint rules (`react(set-state-in-effect)`, `react-hooks(exhaustive-deps)`) correctly flagged - and which, in this oxlint version, could not be silenced with a disable comment (verified empirically: the same comment syntax suppressed a plain `console.log` in a throwaway test file but not a real `setState` call, meaning these two rules bypass the normal disable-directive pipeline here). Fixed at the root instead: split the hook into `execute` (the async call, no synchronous state changes before its first `await`) and `run` (resets loading/error, only ever called from event handlers - never from the mount effect). The mount effect now calls `execute()` directly, which contains no synchronous `setState`, so the warning is gone because the underlying pattern it was warning about no longer exists.

**Verified:**
- Server test suite passes after the CORS change.
- `npm run build`, `oxlint` (0 warnings, 0 errors across 52 files), and the impeccable design detector (0 findings) all pass on the client.
- **The actual request layer was tested against the real server, not just assumed to work**, by running the exported axios instance directly from Node (axios has its own Node HTTP adapter):
  - Success: `GET /health` returns `{"status":"ok"}`.
  - Server error shape: hitting a nonexistent route returns `ApiError.message = "Route not found: GET /api/v1/does-not-exist"`, `code: "NOT_FOUND"`, `status: 404` - the exact message chunk 0.2's `notFoundHandler` produces, passed through unchanged.
  - Server down: `ApiError.message = "We couldn't reach the server. Please check your connection and try again."`, `code: "NETWORK_ERROR"` - a clean `ApiError` instance, never a raw exception or crash.
- Both dev servers were actually started together and the browser-console output was read directly (via Vite's terminal-forwarded console) for `/`, `/styleguide`, `/login`, `/privacy` - confirmed zero console errors after the Redux fix, where there had been one before it.

**Not verified - developer check needed:**
- **The rendered UI itself is still unseen by me** - no Playwright here. I confirmed the console is clean and the request layer works correctly at the code level, but the actual loading spinner / success text / error message / retry button on `/styleguide`'s new "API check" section have not been *looked at*. Open `/styleguide`, watch the health check succeed, stop the server, click "Try again", and confirm the error state reads calmly.

**Not done (out of scope, by design):**
- No auth logic, no login form, no token interceptor actually registered.
- No feature-specific Redux slices - the store is empty and ready.
- No form built using the new validation helpers - they exist as infrastructure only.

---
## Chunk 1.1 - users model and project constants

**Status: Complete.** Nothing skipped.

Built:
- `server/models/User.js` - the `users` collection exactly per master spec §10.1. `email` (required, unique, lowercase, trimmed, format-checked), `passwordHash`, `refreshTokenHash`, `refreshTokenExpiresAt`, `role` (enum), `status` (enum, defaults `active`), plus `timestamps`.
- `server/utils/password.js` - `hashPassword` / `comparePassword` on bcrypt, cost factor 12.
- `server/constants/roles.js` - `ROLES` and `USER_STATUS`, frozen. The model enum reads from here so no role name is ever a loose string literal.
- `server/constants/specialtyTags.js` - the real **27** concern/specialty tags.
- `server/constants/treatmentOrientations.js` - the **33** treatment orientations.
- `server/scripts/seedAdmin.js` + `npm run seed:admin` - creates the single admin account from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
- Tests: `server/utils/password.test.js`, `server/models/User.test.js`, and `server/test/mongoMemory.js` (in-memory MongoDB helper).
- `.env.example` documents `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

**The chunk's PLACEHOLDER instruction was correctly NOT followed.** Chunk 1.1 said to invent a placeholder array of 30 concerns *"if the exact list is not in the spec."* It is in the spec now - 27 items, confirmed by Asad, recorded in master spec §15 and decision #2 above. The real list is in place. **No placeholder exists and no pre-launch blocker was created.** The running pre-launch blocker list from chunk 0.5 is unchanged at 5 items.

**Decisions made:**
- **Tag values are the display labels verbatim** (`"ADHD & Attention Issues"`), not slugs - developer's call, and it matches how the schema is written in the spec. Both constants files carry a comment stating that an entry must never be reworded or re-cased: existing documents hold the old string and would silently stop matching. The list is client-fixed, which removes the usual reason to slug.
- **`Career Counselling` (specialty, British double-L) and `Career Counseling` (orientation, American single-L)** are both verbatim from the spec. Commented in both files so nobody later "fixes" one and breaks matching.
- **New top-level `server/constants/` and `server/scripts/` folders** - approved by developer. Neither appears in the folder list in `.claude/rules/backend.md`; recorded here as a deliberate, approved deviation.
- **bcrypt cost factor 12.** The spec mandates bcrypt but names no cost. 12 is the current sane default - about 250ms per hash.
- **`passwordHash`, `refreshTokenHash`, `refreshTokenExpiresAt` are all `select: false`**, so no ordinary query returns them. Login will opt in explicitly with `.select('+passwordHash')`. A `toJSON` transform strips all three again as a second line of defence, so a hash cannot reach a response body even if a future controller fetches the document with its hidden fields selected.
- **Refresh token fields exist now but nothing writes them** in this chunk. Declaring them here means chunks 1.2/1.3 need no migration.
- **`ADMIN_EMAIL` / `ADMIN_PASSWORD` are validated inside the seed script, not added to `config/env.js`.** Putting them in the server's required-vars list would stop the API booting on a production host that has no reason to hold admin credentials.
- **The seed script is idempotent and never overwrites.** If the account exists it reports and exits 0 without touching it - silently resetting a live admin's password because someone re-ran a seed script would be a real outage, and the spec's recovery path is "Forgot password", not re-seeding.
- **The seed script refuses to create a *second* admin** under a different email unless run with `--force`. The platform is specified for exactly one admin (§3).
- **Admin password floor of 12 characters** - not from the spec, added so the seed cannot create a trivially guessable admin. Also capped at 72 bytes, because **bcrypt silently truncates past 72 bytes** - two passwords sharing their first 72 bytes hash identically. `MAX_PASSWORD_BYTES` is exported for the auth chunks to enforce at the validation layer, and a test pins the behaviour so it is documented rather than discovered later.
- **`mongodb-memory-server` for tests.** A real database is not optional here: `unique: true` is a MongoDB *index* enforced on write (error 11000), not a Mongoose validator. Mocking the driver would make the duplicate-email test assert nothing. Tests call `await User.init()` before relying on it - without that, on a fresh database the index may not exist yet and a duplicate insert can succeed, passing the test for the wrong reason.

**Verified:**
- `npm test` - **28 tests across 3 suites, all passing** (the chunk 0.1 health test still included).
- `npm run lint` - clean. Confirmed via `--debug` that all nine new files are actually being linted, not silently ignored.
- Both constants lists confirmed at the right length with **no duplicates**: 27 specialty tags, 33 treatment orientations.
- bcrypt's native binding confirmed loading and hashing on this Windows machine before anything was built on top of it.
- **The seed script was verified end-to-end, 30 checks, all passing** - run against a throwaway in-memory database rather than the real Atlas cluster, so no dev data was touched and no password was written into `.env`. Confirmed: creates the admin with `role: admin` / `status: active` / lowercased email; stores a `$2b$12$` bcrypt hash; **the plaintext password appears nowhere in the stored document and is never printed to the console**; the stored hash verifies against the real password and rejects a wrong one; re-running leaves the hash byte-identical; a second admin under a different email is refused with exit 1; `--force` allows it; and missing, too-short, and over-72-byte passwords are all rejected with exit 1 *before* the database is touched.

**Manual steps for the developer:**
1. **Add to `server/.env`:**
   - `ADMIN_EMAIL` - the admin login email (Asad's business address for production; your own for dev).
   - `ADMIN_PASSWORD` - minimum 12 characters, maximum 72 bytes. **Put it in a password manager as you set it.** It is stored as a bcrypt hash and is not recoverable - the only way back in is "Forgot password", which does not exist until chunk 1.5.
2. **Run `npm run seed:admin`** in `/server`, then confirm in MongoDB Atlas that the `users` document shows `passwordHash` beginning `$2b$12$` and **no plaintext password field**. (Verified here against an in-memory database; running it against your own Atlas cluster is yours to do.)
3. **Packages installed** (both in `/server`): `bcrypt` (dependency), `mongodb-memory-server` (devDependency). No external accounts or API keys needed for this chunk.

**Not done (out of scope, by design):**
- No auth endpoints - no login, refresh, logout, or password reset (chunks 1.2-1.5).
- No JWT logic and no `jsonwebtoken` package yet.
- No other models.
- `rateLimiter` and `validate` are still unwired - no route needs them yet.
- No frontend work, and **no client-side copy of the constants.** The client needs both lists at chunks 3.4 and 5.4; whether it gets them by a duplicated file or a small public endpoint is that chunk's decision, deliberately not pre-empted here.

---
## Chunk 1.2 - Login endpoint

**Status: Complete.** Nothing skipped.

Built:
- `POST /api/v1/auth/login`. Returns `{ accessToken, user: { id, email, role } }` in the body, and the refresh token as an httpOnly cookie only.
- `constants/auth.js` - token lifetimes, cookie name and path, the single generic error message, rate limit settings.
- `utils/tokens.js` - `signAccessToken`, `signRefreshToken`, `hashRefreshToken`.
- `validation/auth.schema.js` - `loginSchema` (new top-level `validation/` folder, approved by developer).
- `services/auth.service.js` - the login logic. `controllers/auth.controller.js` - thin, sets the cookie.
- `routes/auth.routes.js` - route wiring, with the rate limiter applied before validation.
- `routes/auth.login.test.js` - 22 integration tests.
- `config/env.js` - `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are now required, plus two new startup checks (see below).
- `app.js` - `trust proxy` enabled in production only.

**Decisions made:**
- **The refresh token hash is SHA-256, NOT bcrypt.** This is the most important decision in the chunk. bcrypt silently cuts its input at 72 bytes. A refresh token is a JWT of 200+ characters, and every JWT we issue shares the same header and a near-identical payload prefix - so two different tokens could match on their first 72 bytes and bcrypt would treat them as the same token. That is a real authentication hole. bcrypt's slowness exists to protect low-entropy human passwords; a refresh token is long and random, so there is nothing to brute-force. A fast cryptographic hash is the correct tool, and a database leak still hands out no usable sessions.
- **Failed logins are equalised for TIMING, not just wording.** `.claude/rules/backend.md` requires the same message *and timing* for a wrong password and an unknown email. Without this, an unknown email returns in about 1ms (no bcrypt) while a wrong password takes about 250ms - an attacker can measure that gap and discover which emails have accounts here. On a mental health platform, "this address is a patient of ours" is itself sensitive. The service now always runs exactly one bcrypt comparison, against a hardcoded throwaway hash when no user is found. A test asserts both paths take over 50ms.
- **Deactivated accounts get the identical generic message** - `Invalid email or password.` / `INVALID_CREDENTIALS` / 401. Confirmed by the developer. A distinct "your account is disabled" message would confirm the email exists. Consequence to be aware of: **a deactivated therapist has no way to learn why they cannot log in.** Asad must tell them by email.
- **Unknown email, wrong password, and inactive account are one combined `if`, not three branches.** Separate branches invite someone later to make one of them "more helpful", which is exactly the leak this prevents.
- **The access token carries only `sub` (user id) and `role`.** No email, no name - a JWT is base64, not encrypted, so anyone holding it can read the payload. The role is included so chunk 1.4's guards need no database hit per request. Recorded trade-off: if an account is deactivated or its role changed, the old token keeps the old value until it expires - at most 15 minutes.
- **Refresh tokens carry a random `jwtid`.** Without it, two logins for the same user in the same second would produce byte-identical JWTs (same payload, same issued-at second), making the rotation in chunk 1.3 impossible to test or reason about.
- **Cookie is `httpOnly`, `sameSite: 'lax'`, `path: '/api/v1/auth'`, `secure` in production only.** Path scoping means the browser never attaches this cookie to ordinary API calls. `secure` is off in development because localhost is plain HTTP and the cookie would otherwise never be set at all.
- **Two new startup checks in `config/env.js`, added without being asked - flagging plainly.** (1) Each JWT secret must be at least 32 characters, because a short or guessable secret lets anyone forge a token and log in as the admin. (2) The two secrets must be different - if they were the same, a 7-day refresh token would also verify as an access token, turning it into an unlimited credential and defeating the whole point of a short access token. Both fail loudly at startup and never print the secret value itself.
- **`trust proxy` is enabled in production only.** On Render/Railway every request arrives through the host's proxy, so `req.ip` would be the proxy's address for everyone and rate limiting would share ONE counter across all users - a single attacker could lock out the entire platform. It is deliberately OFF in development, because enabling it there would let anyone spoof their IP with an `X-Forwarded-For` header and walk straight past the login limiter.
- **Rate limit: 10 attempts per 15 minutes per IP**, applied before validation so a flood of junk is rejected before any database work. The limiter instance is exported so tests can reset its counter between cases.
- **Login is case- and whitespace-insensitive on email.** The schema trims and lowercases before the lookup, because `users.email` is stored lowercase. Without it, "Asad@Example.com" would simply not be found and the user would be told their password was wrong.
- **No minimum password length on login.** Login must accept whatever password the account already has; a policy check here would lock out existing users and quietly leak what the policy is.

**A real problem found during testing and fixed - it touches chunk 0.2's `errorHandler.js`:**
Every failed login printed a **full stack trace** to the server log, because the handler called `console.error(err)` for all errors. A wrong password is an expected event, not a fault, and its stack points only at our own `throw`. In production a brute-force attempt would have flooded the logs with hundreds of stack traces and buried the real errors. Operational (`AppError`) failures now log a single line - `INVALID_CREDENTIALS 401 POST /api/v1/auth/login - Invalid email or password.` Unknown errors still get the complete dump, because those are genuine bugs and the stack is the whole point. Confirmed: 0 stack traces across the run, down from 32.

**Verified:**
- `npm test` - **50 tests across 4 suites, all passing** (28 from earlier chunks, 22 new).
- `npm run lint` - clean.
- **Tested live against the real server and the real MongoDB Atlas cluster**, not only in-memory:
  - Server boots with the new required-variable and secret-strength checks: `MongoDB connected.` then `Server listening on port 5000 [development]`.
  - Unknown email returns `{"error":{"message":"Invalid email or password.","code":"INVALID_CREDENTIALS"}}` with 401.
  - Malformed email and a NoSQL injection attempt (`{"email":{"$ne":null}}`) are both rejected with 422 before any database query.
  - A real admin login returned 200 with `Set-Cookie: refreshToken=...; Max-Age=604800; Path=/api/v1/auth; HttpOnly; SameSite=Lax` and **no `Secure` flag in development**, exactly as intended.
  - The response body contained only `accessToken` and `user`. **`refreshToken` was not in the body.**
  - The decoded access token payload was `{"role":"admin","iat":...,"exp":...,"sub":"..."}` - **900 seconds (15 minutes), and no email inside**.
  - The Atlas record then held `refreshTokenHash` as **64 hex characters (SHA-256), containing no dots - so it is a hash, not the raw JWT** - and `refreshTokenExpiresAt` exactly 7.00 days out.
- Tests also cover: the exact-match reply for unknown email vs wrong password, deactivated accounts, no cookie or token on failure, a failed attempt not disturbing an existing session, the stored hash matching SHA-256 of the actual cookie value, a second login replacing the first hash, and the rate limiter returning 429 on the 11th attempt.

**Manual steps for the developer:**
1. **Package installed:** `jsonwebtoken` in `/server`. No accounts or API keys needed.
2. **Nothing else to do** - your `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are already set, 64 characters each and different from one another, and the server accepted them.
3. **You can now delete `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `server/.env`** - the admin exists in Atlas and the API does not read these. Save the password in a password manager first; it cannot be read back from the database.

**Carried forward - must not be forgotten at chunk 12.5 (deployment):**
- **The cookie's `sameSite: 'lax'` depends on the final domains.** It works while the site and API share a registrable domain (`castofmind.com` and `api.castofmind.com`), and on localhost. If the API ends up on a *different* domain - for example `cast-of-mind.onrender.com` serving `castofmind.com` - this must become `sameSite: 'none'` with `secure: true`. Otherwise the browser silently drops the cookie and every refresh fails, **with nothing in the logs to explain why**. A `TODO (chunk 12.5)` comment marks the exact line in `controllers/auth.controller.js`.

**Not done (out of scope, by design):**
- No refresh, logout, or `/me` endpoint (chunk 1.3). No `cookie-parser` yet - this chunk only *sets* the cookie; reading it is 1.3.
- No auth middleware or role guards (chunk 1.4). `utils/tokens.js` deliberately has no verify functions yet.
- No password reset (chunk 1.5). No frontend, no login page, no token interceptor (chunk 1.6).
- No 2FA - admin 2FA is chunk 10.5. **Until then the admin account is protected by password alone.**

---
## Chunk 1.3 - Refresh, logout, token revocation

**Status: Complete.** Nothing skipped.

Built:
- `POST /api/v1/auth/refresh` - reads the httpOnly cookie, verifies it, checks the stored hash, issues a new access token, and **rotates** the refresh token.
- `POST /api/v1/auth/logout` - clears the stored token and the cookie. Always returns 200.
- `GET /api/v1/auth/me` - the signed-in user's id, email, role and `createdAt`, read fresh from the database.
- `utils/refreshCookie.js` - `setRefreshCookie` / `clearRefreshCookie` / `readRefreshCookie`, with the cookie options defined **once**.
- `utils/tokens.js` - added `verifyAccessToken`, `verifyRefreshToken`, `refreshTokenHashMatches`; `signRefreshToken` now takes `expiresInSeconds`.
- `middleware/authenticate.js` - verifies the access token and sets `req.user` (see the scope note below).
- `services/auth.service.js` - added `refresh()`, `logout()`, `getMe()`, `cleanupExpiredRefreshTokens()`.
- `scripts/cleanupRefreshTokens.js` + `npm run cleanup:tokens`.
- `app.js` - `cookie-parser` wired in.
- `routes/auth.session.test.js` - 36 integration tests.

**Why rotation matters** (the chunk asked for this in the plan, recorded here too): without rotation a stolen refresh token keeps working silently for the whole 7 days and nobody ever finds out. With rotation the old token dies the instant it is used - so if a thief uses yours, **your** next refresh fails and you get logged out. That is irritating, but it is a visible symptom instead of silence, and logging back in overwrites the thief's token and locks them out.

**Decisions made:**
- **The 7-day window is ABSOLUTE, not sliding** - developer's decision, following master spec §11 step 6 ("After 7 days, the refresh token expires and the user must log in again"). Rotation issues the new token with only the time that **remains**, and `refreshTokenExpiresAt` is never moved. A sliding window would have quietly turned "log in weekly" into "never log in again as long as you keep visiting". **Cost, stated plainly: every user logs in again once a week, however active they are.**
- **Reuse detection deliberately NOT built.** A correctly signed token whose hash does not match the stored one is evidence of theft, and the strong response is to kill the session. That is not done, because **two browser tabs would trigger it by accident** - each refreshes independently, so the second presents the token the first just replaced and an honest user gets thrown out. Doing it safely needs a grace window or an extra field, and the `users` schema is fixed by §10.1. What happens instead: mismatch returns 401, the user logs in again, and their new token overwrites the thief's anyway. **Recorded for chunk 12.3 (security hardening).**
- **Cookie options live in exactly one file.** `res.clearCookie` only works when `path`, `sameSite` and `secure` match the cookie that was set. If two call sites drift apart, logout returns a cheerful 200 while the cookie quietly stays in the browser - a bug that looks like nothing is wrong. Login, refresh and logout now share one options object.
- **On rotation the cookie's `maxAge` is the REMAINING time**, not a fresh 7 days, so the cookie can never outlive the record in the database.
- **A stale token cannot log out the session that replaced it.** Logout only clears the session when the presented token's hash matches the stored one. Without that check, someone signing out on a laptop would kill the live session on their phone - because "one session per user" means the phone's login had already overwritten the stored hash. There is a test for this exact case.
- **Logout always returns 200** - with no cookie, a junk cookie, or an expired one. Whether a session existed is not something to report.
- **One generic `SESSION_EXPIRED` error for every refresh failure** - no cookie, bad signature, expired, revoked by logout, replaced by a login elsewhere, or account deactivated. Same reasoning as the login endpoint: separate messages would tell an attacker holding a stolen token exactly which wall they hit, and the client's response is identical in every case anyway.
- **`TOKEN_EXPIRED` is reported separately from `UNAUTHENTICATED` on `/me`.** This is not a leak - whoever holds the token can already read its expiry, since a JWT is base64 and not encrypted - and chunk 1.6's interceptor needs it to tell "try refreshing" apart from "give up and go to login".
- **Refresh and `/me` both re-read the database and check `status`.** This is where a deactivated account actually loses access: their existing access token keeps working for up to 15 more minutes, then these checks cut them off. Verified live: `/me` still returned 200 for ~15 minutes after logout, which is the documented and intended trade-off of a stateless access token.
- **Hash comparison uses `crypto.timingSafeEqual`**, with a length check first because it throws on mismatched buffers.
- **Rate limits:** refresh, logout and `/me` share a separate, far more generous limiter than login - 60 per 15 minutes. A signed-in user hits refresh about four times an hour and several open tabs multiply that, so a tight limit here would break ordinary use rather than stop an attack. Login stays at 10.

**SCOPE NOTE - a small, unavoidable overlap with chunk 1.4:**
`GET /auth/me` is authenticated by the **access token**, not the refresh cookie, so it cannot exist without access-token verification - which is chunk 1.4's subject. `middleware/authenticate.js` was therefore built here, kept to the minimum: read the Bearer header, verify, set `req.user`. **Chunk 1.4 still has to add the role guards** (`requireRole('admin')` and so on) and apply them across protected routes. Flagged rather than built quietly ahead.

**A dangerous shortcut deliberately avoided, written down so nobody adds it later:**
**Never put a MongoDB TTL index on `refreshTokenExpiresAt`.** It is the obvious-looking way to "clean up expired tokens" and it would be a catastrophe here - the refresh token lives **on** the `users` record, so a TTL index would delete **the entire user account** when the token expired. Every client and therapist, silently gone. Cleanup is a script that only ever clears the two token fields. Warnings sit in both `services/auth.service.js` and `scripts/cleanupRefreshTokens.js`, and a test asserts the user count is unchanged after cleanup.

**A false-passing test was caught and fixed, not left in place:**
The "deactivated user cannot refresh" test originally reused the *original* login token after already refreshing once. That token had been rotated away, so the 401 proved **revocation**, not deactivation - the test would have passed even if the status check were deleted entirely. Rewritten to keep the rotated token, assert the stored hash still matches it, deactivate, confirm 401, then **reactivate and confirm 200** - proving the status check is the only thing that changed the outcome.

**Verified:**
- `npm test` - **86 tests across 5 suites, all passing** (50 from earlier chunks, 36 new).
- `npm run lint` - clean.
- **The tests were mutation-checked, not just run.** Deliberately making the 7-day window slide broke **1 test**; deliberately removing rotation broke **4 tests**. Both restored afterwards and the full suite re-run. This proves the tests actually detect the behaviour they claim to.
- **Full flow verified live against the real server and the real MongoDB Atlas cluster - 28 checks, all passing:**
  - Login, then refresh: new access token, refresh token **rotated**, cookie still `HttpOnly; Path=/api/v1/auth; SameSite=Lax`.
  - The database held the hash of the **new** token, and **`refreshTokenExpiresAt` was byte-identical before and after** (`2026-09-01T06:11:54.400Z` both times) - the window did not slide.
  - The new token's lifetime was **604798s of 604800s** - the remaining time, not a fresh week.
  - The old refresh token returned 401 `SESSION_EXPIRED` immediately after rotation.
  - `/me` returned the right user with no hash of any kind in the body; a missing token returned 401 `UNAUTHENTICATED`.
  - Logout returned `refreshToken=; Path=/api/v1/auth; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`, cleared both database fields, and **left the user account and its passwordHash untouched**.
  - Refresh after logout returned 401.
- **`npm run cleanup:tokens` run against the real Atlas cluster**: reported "No expired refresh tokens to clear", and the user count was 1 before and 1 after, with the admin account fully intact.
- The "wait for the access token to expire" step was covered by signing tokens with a negative lifetime rather than waiting 15 minutes.

**Manual steps for the developer:**
1. **Package installed:** `cookie-parser` in `/server`. No accounts or API keys needed.
2. **Nothing else to do.** No new environment variables in this chunk.
3. **Optional:** `npm run cleanup:tokens` can be scheduled later (a daily cron on the production host). It is safe to run while the server is live - it only touches tokens that have **already** expired. **Do not replace it with a TTL index** (see above).

**Carried forward:**
- **Reuse detection for stolen refresh tokens** - deferred to chunk 12.3, with the multi-tab problem to solve first.
- **The cookie's `sameSite: 'lax'` still depends on the final domains** (chunk 12.5). The `TODO` comment moved into `utils/refreshCookie.js`, which is now the single line to change.

**Not done (out of scope, by design):**
- No role guards (chunk 1.4) - `authenticate` sets `req.user` but nothing checks roles yet, and no route outside `/auth/me` is protected.
- No password reset (chunk 1.5). No frontend, login page, or token interceptor (chunk 1.6).
- No automatic scheduling of the cleanup script - it is manual until someone wires a cron at deployment.
- No 2FA - admin 2FA is chunk 10.5.

---
## Chunk 1.4 - Auth middleware and role guards

**Status: Complete.** Nothing skipped.

Built:
- `middleware/requireAuth.js` - **renamed** from `middleware/authenticate.js` (built early in chunk 1.3, flagged there). Same behaviour, clearer name.
- `middleware/requireRole.js` - `requireRole(...roles)` plus `requireClient`, `requireTherapist`, `requireAdmin`.
- `routes/dev.routes.js` - four temporary routes for testing the guards by hand.
- `constants/auth.js` - added `FORBIDDEN_MESSAGE` / `FORBIDDEN_CODE`.
- `routes/index.js` - mounts the dev routes **only outside production**.
- `middleware/requireRole.test.js` - 18 unit tests on the guard alone.
- `routes/roleGuards.test.js` - 21 tests over the full request path.

**Why the rename:** the chunk specified `requireAuth`, and it reads correctly beside the role guard - `router.get('/x', requireAuth, requireAdmin, handler)`. Only one file imported the old name, so the change was contained.

**Decisions made:**
- **The guards FAIL CLOSED.** This is the most important line in the chunk. Picture a future route written as `router.get('/admin/clients', requireAdmin, handler)` with `requireAuth` accidentally left off. `req.user` is then `undefined`. A carelessly written guard would crash, or worse, quietly let the request through. `requireRole` checks `req.user` first and returns **401** when it is missing. A guard that passes when misused is worse than no guard at all, because the route *looks* protected in the code and nobody goes back to check it. Nine tests cover this, and a deliberate mutation confirmed they catch it (see below).
- **Invalid role names throw at STARTUP, not at request time.** `requireRole('admins')` - a plausible typo - would otherwise reject everyone silently and for ever, while the route still looked protected. It now throws when the route file loads, so the server refuses to start.
- **401 and 403 mean different things and are kept separate.** 401 = "I do not know who you are" (no token, junk token, expired token, forged token). 403 = "I know who you are, and the answer is no." The frontend reacts differently to each: 401 means try refreshing or go to login, 403 means the user genuinely lacks permission.
- **The 403 message does not name the required role** - it is `You do not have access to this.` Telling a client "admins only" hands out a map of the admin surface for free, and they cannot act on the detail anyway, since a client can never become an admin. A test asserts the words "admin" and "therapist" never appear in a 403 body.
- **`requireRole` takes a list**, so a future route needing therapist *or* admin uses `requireRole(ROLES.THERAPIST, ROLES.ADMIN)` rather than getting a new named guard.
- **No database lookup in the guards.** The role comes from the access token, decided back in chunk 1.2 so guards cost no query per request. **The trade-off, restated because it surprises people: a role change or deactivation takes up to 15 minutes to bite** - the current access token keeps its old role until it expires. `/auth/refresh` and `/auth/me` re-read the database, so that is where the account is actually cut off.
- **Guards applied nowhere else**, per the chunk's "Do NOT" list. Only the dev routes and the existing `/auth/me`. No feature routes exist yet, and no subscription gate - that is slice 12.

**The dev routes are gated so they cannot reach production:**

| Route | Guard |
|---|---|
| `GET /api/v1/dev/any` | `requireAuth` only - any signed-in user |
| `GET /api/v1/dev/client` | `requireAuth` + `requireClient` |
| `GET /api/v1/dev/therapist` | `requireAuth` + `requireTherapist` |
| `GET /api/v1/dev/admin` | `requireAuth` + `requireAdmin` |

`routes/index.js` mounts them only when `NODE_ENV` is not `production`, so on the live site these paths do not exist and fall through to the 404 handler. **That gate is a safety net, not the plan** - the file is on the pre-launch blocker list and should be deleted outright. Verified by starting a real child process with `NODE_ENV=production` and confirming `/api/v1/health` returns 200 while all four dev routes return **404**.

**Verified:**
- `npm test` - **125 tests across 7 suites, all passing** (86 from earlier chunks, 39 new).
- `npm run lint` - clean.
- **Mutation-checked, not just run.** Deliberately changing the fail-closed check to `return next()` - the exact mistake the guard exists to prevent - broke **9 tests**. Restored afterwards and the full suite re-run.
- Tests cover the full matrix: all three roles on their own route (pass), **all nine role-versus-route pairs** (the six mismatches all 403), all three roles on the shared route (pass), no token, malformed `Authorization` headers, junk, an expired token (401 `TOKEN_EXPIRED`), a **token forged with an attacker's own secret claiming to be admin** (401), a **refresh token presented as an access token** (401), and a **token whose role was edited in the payload** (401 - the signature no longer matches).
- **Live-tested against the running dev server and the real MongoDB Atlas cluster, 7 checks, all passing:** an admin token reached `/dev/any` and `/dev/admin` with 200, was refused from `/dev/client` and `/dev/therapist` with 403 and the body `{"error":{"message":"You do not have access to this.","code":"FORBIDDEN"}}`, no token gave 401 `UNAUTHENTICATED`, junk gave 401, and the 403 body was confirmed to contain neither "client" nor "admin".

**Limitation of the live test, stated plainly:**
Only the **admin** account exists in the Atlas cluster, so the live Postman-style check used an admin token only. The client and therapist paths are fully covered in the test suite against an in-memory database, including every role-versus-route pair - but they have not been exercised against real Atlas. **To try them in Postman you need client and therapist accounts**, and those are only created by the payment webhook (chunk 6.4) and admin approval (chunk 4.3), neither of which exists yet. I did not create fake users in your cluster to work around this; that is your call, not mine.

**Pre-launch blockers (running list) - one added:**
1. **`/styleguide` must be deleted** - development only.
2. **LinkedIn URL in `lib/siteConfig.js` is a placeholder** - swap for the real profile.
3. **Legal pages need real content** - Privacy, Terms, Refund.
4. **Favicon still missing** - client to supply.
5. **Footer tagline copy is mine, not the client's** - worth having Asad approve or replace it.
6. **NEW: delete `server/routes/dev.routes.js` and its mount in `routes/index.js`** - guard-testing routes. Already gated to non-production, but they should not exist in the shipped code at all.

**Not done (out of scope, by design):**
- No guards on feature routes - none exist yet.
- No subscription access gate - slice 12.
- No password reset (chunk 1.5). No frontend, login page, or token interceptor (chunk 1.6).
- No 2FA - admin 2FA is chunk 10.5.

---
## Chunk 1.5 - Password reset and email service

**Status: Complete.** Nothing skipped. **One step is yours to finish - see "Manual steps" below.**

Built:
- `POST /api/v1/auth/forgot-password` - accepts an email, always replies identically, sends the link in the background.
- `POST /api/v1/auth/reset-password` - validates the token, sets the new password, destroys the token, ends every session.
- `services/email/email.service.js` - `sendEmail()` and `sendPasswordResetEmail()`, with a development fallback that prints to the terminal.
- `services/email/templates/base.js` - the brand-styled shell every future email will reuse, plus a plain-text version.
- `services/email/templates/passwordReset.js` - the reset email itself.
- `constants/email.js` - brand colours and the support address.
- `models/User.js` - added `resetTokenHash` and `resetTokenExpiresAt`, both `select: false`.
- `utils/tokens.js` - `generateResetToken`, `hashResetToken`, `resetTokenHashMatches`.
- `config/env.js` - `RESEND_API_KEY` and `EMAIL_FROM` required in production, optional in development; `EMAIL_LOGO_URL` optional everywhere.
- `routes/auth.reset.test.js` - 35 integration tests.
- Removed the stray `console.log` from `middleware/requireRole.js`, as requested.

**SPEC ADDITION - two new fields on `users`:**
Master spec §10.1 lists 8 fields and has nowhere to store a reset token. Two were added: `resetTokenHash` and `resetTokenExpiresAt`. **Approved by the developer.** The alternative was a 15th collection, which §10 already considered and rejected for the refresh token (decision #4) - so putting reset state on `users` is the consistent choice, not a new pattern. Recording it here so the schema in the spec and the schema in the code do not silently drift.

**Decisions made:**
- **Reset token expires in 30 minutes.** Developer's decision, choosing 30 over the 15 originally proposed. The token is 256-bit random and single-use, so guessing is not the threat - the window only limits how long a *leaked* email stays useful. Against that, email can take minutes to arrive and people step away. 30 balances both.
- **Password minimum is 8 characters for EVERY role, admin included.** Developer's decision: one universal rule rather than a role-aware one, chosen for predictability. Maximum 72 bytes. **`MIN_PASSWORD_LENGTH` in `utils/password.js` is the single source** - the admin seed, password reset, and the therapist application form in slice 3 all read from it. Existing passwords are unaffected; the rule is only checked when a password is being set. **No complexity rules and no common-password blocklist** - also the developer's call, for user freedom.
- **The reset token is random bytes, not a JWT.** 32 bytes of randomness, stored as a SHA-256 hash. There is nothing to sign: the database record is the authority, and being able to *delete* that record is exactly what makes the token single-use. A self-contained JWT would stay valid until its own expiry no matter what the database said.
- **The email is sent WITHOUT the request waiting for it.** Two reasons, and the second is the important one. (1) Talking to Resend takes a few hundred milliseconds and the user does not need to wait. (2) **TIMING.** If the send were awaited, a request for a real address would take ~300ms while an unknown address returned instantly - an attacker could simply time the responses to discover which emails have accounts, undoing the whole point of the identical message. This is the same leak closed on the login endpoint in chunk 1.2. A test asserts the endpoint returns in under 400ms.
- **Deactivated accounts get no email.** They would reset successfully and still be unable to log in - confusing and pointless. The reply stays identical, so nothing is revealed.
- **One error for every bad token** - wrong, expired, already used, or belonging to a deactivated account. An attacker learns nothing from the difference, and the message still tells an honest user what to do: request a new one.
- **A reset ends every signed-in session.** One database write does three things at once: sets the new password, destroys the reset token (this is what makes it single-use), and clears the refresh token. The third matters after a suspected compromise - if someone else was signed in as that user, the reset throws them out. "All refresh tokens" is two fields here, because the design allows only one session per user.
- **A new password cannot be the current one.** Re-using it would leave the account exactly as exposed as whatever prompted the reset.
- **Asking for a second reset link kills the first**, which is what people expect when they click "resend".
- **Rate limits: forgot-password 5 per 15 minutes** - the strictest on the platform, because this endpoint sends real mail to an address the caller chooses, making it a tool for flooding a stranger's inbox. Reset-password is 10 per 15 minutes.
- **`RESEND_API_KEY` is optional in development, required in production.** Without a key in development, emails print to the terminal, so the whole flow can be walked through with no Resend account. In production the server **refuses to start** - password resets silently never arriving would lock users out with nothing in the logs to explain why.

**Email template - why it looks like 2005 HTML:**
Email is not the web. Three constraints drive everything: no stylesheets or CSS variables (Gmail strips `<style>` in many contexts, so every rule is inlined), tables not flexbox (**Outlook on Windows renders email through Microsoft Word**, which supports neither), and no `border-radius` or `box-shadow` on anything structural (Word ignores both, so a design leaning on them looks broken for a large share of users). The button is a **table cell with a background colour** - the only construction Outlook renders as a real button.

**Brand rules held in email, and verified:**
- **Gold appears exactly once, as `background-color`, never as text.** `#F5C518` on white is 1.63:1 and would be unreadable; ink on gold is 9.5:1. Checked against the rendered HTML, not assumed.
- Logo is the **ink** version from Cloudinary at `w_400`, displayed at 200px. Fetched and inspected during the build: 400x328, 22KB, uncropped, transparent - it reads correctly on white. **The white logo would have been invisible on the white email background.**
- `alt="Cast of Mind"` on the logo, because many clients block images by default.
- A plain-text version accompanies every email - not politeness: a message with no text part scores far worse with spam filters.
- Copy is calm and carries no urgency, per the project's content rules. Verified there is no "hurry", "act now", or "urgent" anywhere in it.

**Verified:**
- `npm test` - **160 tests across 8 suites, all passing** (125 from earlier chunks, 35 new).
- `npm run lint` - clean.
- **Mutation-checked.** Removing the token-clearing broke **3 tests** (single-use); removing the refresh-token clearing broke **1 test** (session invalidation). Both restored and re-run.
- **The email service is faked in tests** via `jest.unstable_mockModule`, so `npm test` never sends real mail, and the reset link is read from the captured call rather than an inbox.
- **The rendered email was checked against 12 rules**, including the Outlook-safe button structure, gold-never-as-text, the support address, the single-use and 30-minute wording, and the absence of urgency language.
- **Live checks against the real server** (deliberately using addresses that trigger **no** email): an unknown address returned the generic reply; a never-issued token returned `RESET_TOKEN_INVALID`; a malformed token and a 7-character password were both rejected with 422 before any database work.
- Tests also cover: identical replies for existing / unknown / deactivated addresses, the token stored hashed and never raw, the 30-minute expiry, a fresh token each request, single use, the old password ceasing to work, the new one working, expiry rejection, one user's token not touching another account, byte-counting so multi-byte passwords cannot slip past the 72-byte cap, and **the full flow working for all three roles including admin**.

**A test caught my own new code, which is worth recording:** adding the production email checks broke the chunk 1.4 test that boots a real `NODE_ENV=production` child process - it now exited at startup because `EMAIL_FROM` was missing. That was the new check working correctly. The test now supplies both variables, so it tests route mounting rather than email configuration.

**Manual steps for the developer:**
1. **Add `EMAIL_FROM` to `server/.env`** - it is currently missing. For development:
   ```
   EMAIL_FROM=Cast of Mind <onboarding@resend.dev>
   ```
   The code already falls back to exactly this, so nothing is broken without it - but **production will refuse to start** unless it is set explicitly, and having it in `.env` now means no surprise later.
2. **`RESEND_API_KEY` and `EMAIL_LOGO_URL` are already set** and both were verified working.
3. **Package installed:** `resend` in `/server`.
4. **THE ONE THING NOT DONE HERE - send a real email.** Triggering a genuine password-reset email to a real inbox is an outward-facing action, so it was left for you rather than done unasked. Start the server and run:
   ```
   curl -X POST http://localhost:5000/api/v1/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d "{\"email\":\"YOUR_RESEND_ACCOUNT_EMAIL\"}"
   ```
   **It must be the address your Resend account is registered with** - `onboarding@resend.dev` cannot deliver anywhere else until a domain is verified. Then copy the token from the link and:
   ```
   curl -X POST http://localhost:5000/api/v1/auth/reset-password \
     -H "Content-Type: application/json" \
     -d "{\"token\":\"PASTE_TOKEN\",\"password\":\"your-new-password\"}"
   ```
   Then confirm the old password no longer works and the new one does.
5. **A rendered preview of the email** was saved outside the repo so you can open it in a browser without sending anything. Say the word and I will regenerate it anywhere you like.

**Pre-launch blockers (running list) - two added:**
1. **`/styleguide` must be deleted** - development only.
2. **LinkedIn URL in `lib/siteConfig.js` is a placeholder** - swap for the real profile.
3. **Legal pages need real content** - Privacy, Terms, Refund.
4. **Favicon still missing** - client to supply.
5. **Footer tagline copy is mine, not the client's**.
6. **Delete `server/routes/dev.routes.js` and its mount** - guard-testing routes.
7. **NEW - verify `castofmind.com` in Resend** by adding DNS records at GoDaddy, then change `EMAIL_FROM` to `Cast of Mind <noreply@castofmind.com>`. Until this is done, email can only be delivered to the developer's own Resend account address - **no client or therapist can receive anything**.
8. **NEW - create `support@castofmind.com`** and forward it to `atcastofmind@gmail.com`. That address is printed in the footer of every email the platform sends, and **it does not exist yet** - mail sent to it today will bounce.

**A security observation, recorded rather than acted on:**
`atcastofmind@gmail.com` is both the admin login address and the intended destination for support mail. Per master spec §11, whoever controls the admin inbox can reset the admin password - and there is no 2FA until chunk 10.5. Using a separate public `support@` address (blocker 8 above) keeps the admin login address unpublished, which is why it is worth doing before launch rather than after.

**Not done (out of scope, by design):**
- **No frontend.** The reset link points at `${CLIENT_ORIGIN}/reset-password?token=...` and **that page does not exist yet** - clicking the link in a real email will show a 404 until the frontend chunk builds it. The flow works end to end through the API in the meantime.
- **No other email types.** Welcome-with-credentials, renewal reminders, payment-failed, and new-application notices all reuse `baseTemplate` when their chunks arrive (4.3, 6.4, 11.x).
- No 2FA - admin 2FA is chunk 10.5.

---
## Chunk 1.6 - Login page UI and auth wiring

**Status: Complete.** Nothing skipped. **Slice 1 (Authentication) is finished.**

Built:
- `/login` - real page, replacing the placeholder. Email, password, "Forgot your password?", one button.
- `/forgot-password` and `/reset-password` - full flows including the empty-token and expired-token states.
- `/portal` and `/admin` - placeholders proving the role redirect and the guards work.
- `lib/api/accessToken.js` - the in-memory token.
- `lib/api/authApi.js` - every auth call in one place.
- `lib/api/interceptors.js` - attaches the token; single-flight refresh and retry-once on 401.
- `lib/authSession.js`, `lib/authRedirect.js`, `lib/validation/auth.js`.
- `store/authSlice.js` - `user` and `status`. **No token.**
- `components/auth/` - `AuthBootstrap`, `ProtectedRoute`, `AuthShell`, `FormAlert`, `SignOutButton`.

**HOW THE TOKEN IS GUARANTEED TO STAY IN MEMORY - the chunk asked for this explicitly:**

The strongest guarantee is not "do not persist Redux". It is that **the token never enters Redux at all.** It lives in `lib/api/accessToken.js` as a plain module variable - a closure. It cannot be serialised, does not appear in Redux DevTools, and is gone the instant the tab reloads. Redux holds only the user and their role. If anyone adds `redux-persist` in two years, **there is nothing here for it to leak.**

**Proven, not asserted.** Three separate checks:
1. `grep` over `client/src` - **no source file touches `localStorage`, `sessionStorage`, `indexedDB` or `document.cookie`.** The only matches are the words inside explanatory comments.
2. `grep` over the **built production bundle** - **0 occurrences** of `localStorage` or `sessionStorage`, not even from a dependency.
3. **In a real browser, while signed in as admin:** `localStorage` empty, `sessionStorage` empty, no `eyJ` (JWT prefix) string in either, and `document.cookie` does not contain the refresh token because it is `httpOnly`.

**Three problems this chunk had to solve, each a direct consequence of earlier decisions:**

1. **Two failed requests at once would have logged the user out.** Chunk 1.3 rotates the refresh token on every use, so five simultaneous 401s starting five refreshes means the first succeeds and the other four present a token that no longer exists - session destroyed, for no reason the user could explain. **Fixed with a single-flight promise:** the first 401 starts the refresh, every other 401 in that window awaits the same promise. One refresh, ever.

2. **React StrictMode would have broken session restore in development only.** StrictMode deliberately runs mount effects twice; the second `/auth/refresh` would present the token the first just rotated away, and you would appear signed out after every reload - on your machine, never in production. **Fixed with a `startedRef` guard plus sharing the same single-flight promise with the interceptor.** This would have been miserable to diagnose after the fact.

3. **Reloading `/admin` would have flashed the login page.** On reload there is no token for a moment while the refresh runs. **Fixed with an explicit `bootstrapping` status** that `ProtectedRoute` waits on rather than treating as "signed out".

**Decisions made:**
- **`ProtectedRoute` is not security, and says so in its own comment.** It decides what to render. Anyone can edit JavaScript in their own browser; the real protection is the chunk 1.4 server guards, which run on every request whatever the frontend shows.
- **A signed-in user on the wrong portal is redirected, not refused.** An admin visiting `/portal` goes to `/admin`. A bare "access denied" for someone who mistyped a URL reads as an accusation, and there is nothing there they could act on anyway.
- **Login errors are shown verbatim from the server**, in an alert above the form. No client-side "no account found" check was added - that would have undone the email-enumeration protection the whole backend was built around.
- **The error is a persistent alert, not a toast.** A toast slides away on a timer, and someone anxious who has just failed to sign in may still be reading when it vanishes.
- **A "Show password" text toggle**, not an eye icon. Typing a password blind is a real cause of failed sign-ins, and the craft rules ban unicode glyphs standing in for a drawn icon system - a text label also states exactly what it will do.
- **The page title sits outside the form panel.** Boxing a 44px display serif inside a 400px card crushes it, and this is the one moment where the brand voice should be legible.
- **One motion moment** - the whole column settles once, gated on `useReducedMotion`. Not a per-element cascade.
- **`/reset-password` handles three failure states**, none of them a dead end: no token in the URL, an invalid or expired token, and mismatched confirmation. Each offers the one action that helps.
- **Sign-out clears local state even if the server call fails.** Leaving someone apparently signed in on a shared computer because the network dropped is the wrong way round.

**Two real problems found during verification and fixed:**

1. **Touch targets under the 44px floor.** "Show password", "Forgot your password?" and the reset page's standalone "Back to sign in" measured 17-29px in a real 360px browser. All now carry `min-h-11`. Links sitting *inside a sentence* are left alone - WCAG 2.5.8 exempts them, and padding an inline link breaks the line box around it.

2. **`toApiError` dumped a full axios stack for every expected failure - this touches chunk 0.6 code.** Every wrong password printed a stack trace into the user's browser console. Exactly the same problem as the server-side handler fixed in chunk 1.2, and fixed the same way: handled statuses (400, 401, 403, 404, 409, 422, 429) now log one concise line; genuine faults - network failure, 5xx, anything unrecognised - still get the full object, because there the stack is the point.

**Verified - and this is the first chunk where the UI was actually driven, not just built:**
- **Playwright installed and Chromium driving a real browser. 45 checks, all passing.** Screenshots captured at 1280px and 360px.
- Login page: correct heading and fields, a working "Forgot your password?" link, **no "Continue with Google"**, **no role selector**.
- Wrong password → `Invalid email or password.` shown in an alert, still on `/login`.
- Correct password → **redirected to `/admin`**, signed-in email displayed.
- **Reload → still signed in, still on `/admin`, never bounced to `/login`.** Then **three more reloads in a row**, still signed in - proving token rotation holds under repeated restores.
- Admin visiting `/portal` → sent to `/admin`. Signed out → `/admin` sends them to `/login`.
- Sign out → refresh cookie **gone**.
- Forgot password with an unknown address → the neutral "if that address has an account" confirmation, revealing nothing.
- Reset with no token, with an invalid token, and with mismatched passwords → all three handled with a way forward.
- **360px: no sideways scrolling on any of the three pages, every standalone control 44px+.**
- **No application errors, React warnings, or uncaught exceptions** across the whole run.
- `npm run build` succeeds, `oxlint` clean, **impeccable design detector: 0 findings.**
- Server suite re-run: **160 tests, 8 suites, all passing** - unchanged by this chunk.

**Not verified, stated plainly:**
- **The 401 → silent refresh → retry path has no UI trigger yet.** The interceptor is built and the refresh machinery it depends on is proven (the reload path uses the same single-flight function, exercised four times in the browser run). But the placeholder portal pages fetch nothing, so **no screen currently makes an authenticated request that could expire.** The chunk's "wait 15 minutes" check therefore has nothing to act on yet. It will be exercised naturally by the first real data screen in slice 4. Worth re-testing then rather than assuming.

**A known flake, so it is not mistaken for a bug later:** running the full server suite *while* Chromium and both dev servers are running caused 133 spurious failures on this machine - eight parallel `mongodb-memory-server` instances plus a browser is more than it can hold. Every test passed immediately once the browser and Vite were stopped. **If the suite fails oddly, close other heavy processes and re-run before investigating.**

**Manual steps for the developer:**
1. **Playwright was installed for verification, then REMOVED at the developer's request** (2026-08-27, immediately after this chunk). The developer will check the frontend by hand from here on. Nothing in the codebase referenced it - it was a tool, never a dependency of the app - so `npm run build` and `oxlint` both still pass with it gone, and no source file mentions it.

   **Worth knowing for next time:** the Playwright browser cache in the user's AppData folder **already held browsers dated 21 June, belonging to a different project.** Only the two this chunk downloaded (`chromium-1234` and `chromium_headless_shell-1234`, about 700MB) were removed, using `npx playwright uninstall` **without** the `--all` flag. The four pre-existing browsers were deliberately left alone - `--all` would have deleted another project's tooling.
2. **No new environment variables.**
3. **Screenshots** from the browser run are saved outside the repo. Ask and I will regenerate them anywhere you like.
4. **Worth your own look:** run both dev servers and try the flow by hand. Note the login limit is **10 attempts per 15 minutes** - a 429 while testing is correct behaviour, and restarting the API server clears it.

**Not done (out of scope, by design):**
- **No portal content.** `/portal` and `/admin` show the signed-in email, a line of explanation, and a sign-out button. Client portal is slice 7, therapist portal slice 8, admin slice 4.
- No frontend test suite. `npm test` in `/client` is still the chunk 0.1 placeholder. Playwright was used once as a verification tool and then uninstalled - it was never wired in as a permanent suite.

**Standing change from 2026-08-27: frontend verification is the developer's, not mine.** From this chunk onward there is no browser on this machine, so any future frontend chunk is verified structurally only - build, lint, the design detector, and reading the generated output. **Anything that needs to be seen or clicked must be checked by the developer**, and I will say so explicitly rather than implying a page has been looked at.
- No 2FA - admin 2FA is chunk 10.5.

---

## Chunk 2.1 - Home: hero and services

**Status: Complete.** Nothing skipped. **Not seen in a browser - see "Yours to check" below.**

Built:
- `client/src/components/home/Hero.jsx` - full-bleed photograph, two-layer ink scrim, Fraunces headline, gold Get started, and a quiet link out to How it works.
- `client/src/components/home/Services.jsx` - the five concern themes as full-width rows on a lightening ground, a wide photograph at the brightest point, then an anchored dark panel carrying the price.
- `client/src/data/homeContent.js` - all copy, the five themes, and the photo credits.
- `client/src/pages/Home.jsx` - composes the two, and carries the direction contract as its opening comment.
- Two photographs in `client/src/assets/`.

**The composition was chosen by the developer, not by me.** Three structures were put up - "Threshold" (lopsided split with a tall photo breaking the top edge), "Horizon", and "The words you already use" (the 27 concern words drifting at display scale on ink). The developer locked **Horizon**. The other two are recorded here because they were real options, and either could be revived without touching the visual system: the world is fixed, only the arrangement differed.

**Horizon, in one line: the page inhales.** The ground lightens as the reader descends - ink-deep, ink, mist, a photograph of an open window at the lightest point - and then closes on a dark panel. That descent *is* the structure.

**No cards, deliberately.** Same-size cards of icon plus heading plus text are what every therapy site ships as "services", and they turn five different kinds of human difficulty into five identical rectangles. Each theme is a full-width row instead.

**The 27 tags are grouped into 5 themes** - developer's decision, chosen over showing all 27 flat. The concern words themselves still appear, set as reading text inside each row rather than as pills: someone scanning for their own word finds it faster in a sentence-like list, and pills would read as filter controls that do nothing when clicked. **All 27 appear exactly once**, verified programmatically against `server/constants/specialtyTags.js`, not by counting them by eye.

**The display labels are deliberately not byte-identical to the canonical tags** - sentence case, and "and" where the canonical uses an ampersand, because an ampersand in running prose reads as an abbreviation. Safe *only* because this page never sends a tag anywhere; the values the matching engine compares are untouched. One of those rewordings was caught and reverted during verification: "Trauma and abuse" became **"Trauma and/or abuse"**, because the two mean different things and someone who experienced abuse but would not use the word trauma about themselves still belongs in that row.

**Price is in the services section, not the hero** - developer's decision. 200 EUR/month, what is included, and the fact that **sessions do not roll over** are all stated plainly. That last one is a term people should read before paying, not after, and the spec bans retention dark patterns.

**Decisions made:**
- **Code-led, not comp-led.** No image generation is available on this machine (no harness image tool, no `OPENAI_API_KEY`), so no mockup was generated and the ambition lives in the written direction contract instead. Stated rather than quietly skipped.
- **Photographs are real and sourced, not generated.** Both from Pexels under the Pexels License (commercial use, no attribution required). **I opened and looked at every candidate before choosing** - six were downloaded, two kept. Rejected: murky amber curtains (dingy, off-palette) and a dark bedroom-at-dawn shot (beautiful, but reads melancholy and a bed is too private for a first viewport). Credits are recorded in `homeContent.js` so Asad can swap either for his own photography without hunting through components.
- **The hero scrim is two layers, and heavier than it looks like it needs to be.** Text over a photograph is where accessibility usually fails quietly, because contrast depends on which part of the image happens to sit behind the words. Measured against the *brightest* region of this particular photograph, paper text lands at **17.0:1** at the baseline and **9.9:1** at the top of the text block - so the check does not depend on the photograph never being replaced. The flat ink layer does a second job: the photograph is blue and the brand is aubergine, and without it a cool blue rectangle sits in a warm ink site.
- **One ambient motion on the whole page** - the hero photograph breathing, 20s, ease-in-out, infinite. Section 24.4 sets a 4s floor; at hero scale a 4s cycle reads as a zoom rather than a breath, so it is far slower. Its first and last frames are identical, so the reduced-motion rule (which collapses duration and forces one iteration) lands the image where it started instead of snapping it to a different size.
- **Scroll reveals are per row, not one stagger container.** The obvious build looks right and behaves wrong: the theme list is well over a screen tall, so a container would trigger while only the first row is visible and rows three to five would finish animating far below the fold - three of the five reveals spent on an empty room.
- **No mid-tone was invented to smooth the lightening.** Only palette tokens are used as grounds. A derived tint nobody approved is how a fixed palette quietly stops being fixed, and every step used has measured contrast.
- **Gold appears three times on the page** - two Get started buttons and the price. The price is set in the accent at display size on a dark ground, which is the only place section 24.2 permits it: gold on paper is 1.63:1 and is never text anywhere.
- **The tick icon is drawn SVG**, one stroke weight matching the navbar's, not a unicode glyph.

**Two pieces of pre-existing code were touched. Both are flagged rather than slipped in:**

1. **`components/ui/Button.jsx` gained an `as` prop.** The "Get started" styling was already hand-copied onto a `<Link>` in the navbar and mobile menu; the hero and the price panel would have made it four copies of one control, which is how a design system quietly stops being one. `<Button as={Link}>` now renders a real anchor - so middle-click opens a tab, the status bar shows the target, and screen readers announce a link. `type` and `disabled` are withheld when `as` is set, because neither is meaningful on an anchor.

2. **`index.css` display type is now `clamp()`, not fixed.** **This was a real bug, found by reading rather than by any tool:** `--text-hero` was a flat 72px, and "Somewhere to begin." at 72px overflows a 360px screen. Section 24.3's sizes are the *desktop* values and section 24.6 requires 360px support - the two only reconcile if the type is fluid. Measured: hero **44px at 360px**, and **exactly 72px from 1024px up**, so every desktop value the spec specifies is still hit precisely. Section and subsection got the same treatment. This affects every page, including the login page from chunk 1.6 and `/styleguide`.

**Verified:**
- `npm run build` - passes; both photographs emitted to `dist/assets/`.
- `oxlint` - exit 0, no findings.
- **Impeccable design detector - 0 findings** across all changed targets.
- All 27 canonical tags present exactly once, checked in code against the server constant.
- **Contrast computed, not eyeballed**, on every pair used: paper on ink-deep 19.7:1 - paper/75 on ink-deep 11.0:1 - paper/75 on ink 10.4:1 - ink on mist 16.2:1 - ink/70 on mist 6.4:1 - gold on ink-deep 12.1:1 - sage icon on ink-deep 5.8:1 - hero text through the scrim 17.0:1 and 9.9:1. All pass AA.
- Fluid type computed at 360 / 390 / 768 / 1024 / 1280 / 1920px.
- **Provenance embedded in every shipped raster** (`embed-prompt.mjs`), including the four logo variants from chunk 0.5, which had none. Each now carries its real origin - supplied by the client, or derived and how.

**Yours to check - I have not seen this page:**
There is still no browser on this machine and Playwright stays uninstalled, per the standing decision from 2026-08-27. Everything above is structural. Please run `npm run dev` in `/client` and confirm by eye:
1. **Desktop** - the hero photograph reads as calm atmosphere and the headline is comfortably legible over it.
2. **360px** - no sideways scrolling anywhere; the headline wraps without overflowing; the theme rows stack cleanly.
3. **Reduced motion on** (Windows: Settings, Accessibility, Visual effects, Animation effects **off**) - the hero photograph stops breathing, the rows appear immediately, and **nothing is invisible or missing**.
4. **Keyboard** - tab through: skip link, navbar, hero Get started, "Or read what happens first", the price panel's Get started. Focus visible on every one.
5. The two photographs are stand-ins in the sense that Asad may prefer his own. Worth showing him.

**Pre-launch blockers (running list) - one added:**
1. **`/styleguide` must be deleted** - development only.
2. **LinkedIn URL in `lib/siteConfig.js`** - swap for the real profile.
3. **Legal pages need real content** - Privacy, Terms, Refund.
4. **Favicon still missing** - client to supply.
5. **Footer tagline copy is mine, not the client's**.
6. **Delete `server/routes/dev.routes.js` and its mount**.
7. **Verify `castofmind.com` in Resend**, then change `EMAIL_FROM`.
8. **Create `support@castofmind.com`** and forward it.
9. **NEW - delete `client/src/assets/hero.png`.** A generic purple 3D isometric slab, 343x361, from some template - wrong colour family, far too small, and unrelated to therapy. **Nothing references it** and it is the only raster in the project with no recorded provenance, because I do not know where it came from. I did not delete it: it is not my file to remove.

**Manual steps for the developer:**
1. **No new packages, no new environment variables, no external accounts.**
2. **Confirm the photography with Asad** before launch, or swap it - the credits and licence terms are in `client/src/data/homeContent.js`.
3. The client bundle is now 537 kB (170 kB gzipped), mostly Framer Motion. Not new to this chunk and not a problem yet, but worth code-splitting before launch.

**Not done (out of scope, by design):**
- **The other five home sections.** Testimonials, how it works, who we help, the comparison table, and the FAQ are chunks 2.2 and 2.3, along with the second Get started CTA. They compose beneath `<Services />` in `Home.jsx`; nothing above needs to change to accept them.
- No placeholder testimonials or invented client counts were created. None were needed for this chunk, and the running blocker list is unchanged on that front.
- Every other public page is still a `PagePlaceholder`.

---

### Chunk 2.1 - finish review and fix round

A finish review ran against the direction contract and the craft floor. It returned **`disposition: fix`** with 8 material findings. All 8 were applied. Recorded here because several changed shipped assets, not just code.

**The review was run inline, not by a subagent, and it had no screenshots.** There is no browser on this machine, so every check that needs a render - what the photographs actually look like, whether the scrim reads as calm rather than muddy, real reflow at 360px, focus-ring visibility - **was not run by anyone**. The review covered source only. That limit is the reason the developer check below still matters.

**1. The hero photograph was replaced, on rights grounds.**
The original (Pexels 15957181, blurred water) carried embedded XMP metadata reading `dc:rights`: *"This photos are not for sale. Contact the owner for more info"*, and `dc:creator`: "Nai Jose". That contradicts the Pexels licence recorded beside it. It is very probably a stale camera or upload string rather than a real reservation - but a commercial mental-health platform should not ship an asset whose own metadata asserts a restriction, and arguing the point is not worth the exposure.

Replaced with **Pexels 12088034** - a hillside under fog, verified to carry no `dc:rights`, `dc:creator`, or copyright metadata at all. Three further candidates were downloaded and two of those were rejected for the same metadata problem, so the check is not theoretical. **Every image is now metadata-screened before it ships**, and that rule is written into `homeContent.js` for whoever adds the next one.

The replacement is also the better photograph for this composition: its luminous fog fills the upper frame where the scrim is lightest and the image is meant to be seen, and its dark plant silhouettes run along the bottom where the words sit and the scrim is heaviest. The silhouettes answer the brain-and-root form in the logo. Hero contrast was **re-measured against the new image** - 16.8:1 at the text baseline, 9.2:1 at the top of the text block, against near-white fog. Both still clear AA comfortably.

**2. The window photograph shipped raw, contradicting the page's own contract.**
OWN-WORLD says photographs sit *under an ink wash*. The hero honoured that; the closing band did not - which put an off-palette red window frame at full strength at the brightest moment of the page. It now carries a 14% ink wash: enough to pull it toward the palette, not enough to dim the arrival, which is that band's entire job.

**3. The window band was cropping badly.** The asset was 2:1 in a box that is over 6:1 at desktop, so `object-cover` was showing roughly the middle third of the photograph and whatever composition it had was being thrown away. Re-downloaded at **2400x900** to match the band, band height raised (`h-64 / sm:h-80 / lg:h-112`), and `object-center` set explicitly rather than left to the default.

**4. The reveal was one stock fade-up, eight times over.** Hero and all five rows used the same opacity-plus-y-translate. The craft floor names this directly, and names blur, clip-path and mask as the under-used alternatives. The hero still rises into place; the theme rows now **come into focus** - blur(10px) to 0 over 800ms, no translate. Two gestures for two jobs.

**A real bug was introduced fixing this, and caught before it shipped:** the blur was first applied to the `<li>` itself. `filter` blurs an element's background box along with its text, so each band's own top and bottom edges would have gone soft and bled the neighbouring grounds through the seam for the full 800ms. The blur now sits on the content div; the ground stays solid.

**5. Five rows were still one template.** The card was genuinely refused, but every row had the same column split, the same padding and the same arrangement - so the sameness the card is a symptom of survived anyway. The rhythm now **opens as the ground lightens**: padding grows from `py-12` to `py-24`, and the column split widens from 4/8 to 6/6, across the descent. The spacing carries the lightening, not just the colour.

**6. Coverage gap against the chunk brief.** The brief asks the services section to say *what Cast of Mind offers*. Areas and inclusions were unmistakable; there was no plain statement of what the service actually **is**. Added as the section's opening line: online therapy with one therapist you keep, an hour over Zoom each week, unlimited chat in between.

**7. A copy claim was overstated.** *"We match where those overlap, and nothing else decides it"* is not quite true - master spec §15 makes gender preference a soft sort that reorders results. Rewritten to *"Where you live and what time zone you are in never narrow the list"*, which is exactly what §15 says.

**8. Two latent CSS fragilities, both fixed at the root:**
- **`[data-surface='light']` did not exist.** The mist rows emit it, but no rule matched, so it never reset `--focus-ring`. It was correct today only because no dark ancestor happens to wrap those rows - and gold on mist is ~1.55:1, far under the 3:1 floor for a focus indicator. Now defined.
- **Dark-section text was relying on CSS source order.** `className="text-paper"` overrode `Heading`'s built-in `text-ink` only because `.text-paper` is emitted after `.text-ink`, and that ordering is decided by the order the palette happens to be declared in `@theme`. Reordering two lines in `index.css` would have silently turned every dark section into ink-on-ink. `Heading` gained a `tone` prop matching `Text`'s, and both now pick exactly one colour class instead of two fighting.

**9. Font flash on the largest text on the site.** Fraunces loaded `display=swap` with no preload, so the 72px hero headline paints in Georgia and reflows. Both font stylesheets are now preloaded. **This shortens the chain, it does not delete it** - removing the swap entirely means self-hosting the woff2 files, which is a larger change than this chunk owns. Worth doing before launch.

**10. The hero image was unoptimised on the one screen that matters most.** A 2400px file was served to 360px phones. Now `srcset` at 900 / 1400 / 2400 with `sizes="100vw"` - a phone fetches **28 kB instead of 214 kB**.

**A correction to this entry's own verification claims.** The impeccable detector reports itself **DEGRADED** on this machine: `htmlparser2`, `css-select`, `css-tree` and `domutils` are not installed, so it falls back to regex and evaluates neither custom properties, selector matching, nor computed contrast. Its own output says findings are "an undercount, not a clean bill of health". **The "0 findings" recorded earlier in this entry was a degraded 0**, and should be read as such. The compensation is that every colour pair on this page was computed by hand rather than trusted to the tool - which is the check the degraded detector is specifically missing. When `index.html` was finally included in the target list the detector did produce a finding: **Fraunces flagged as an overused font**. Not acted on, and it should not be: Fraunces is fixed by master spec §24.3 and confirmed by the client, and a pinned brief outranks a generic slop heuristic. Recorded so nobody later reads it as an unnoticed warning.

**Re-verified after all fixes:** build passes, `oxlint` exit 0, all 27 tags still present exactly once, provenance re-embedded on all four new/replaced rasters. `hero.png` remains the only raster without provenance, because its origin is unknown - see blocker 9.

---

### Chunk 2.1 - hero restructured (2026-08-29, developer request)

The hero moved from a full-bleed background photograph to a **split: words left, one photograph right**. Everything below the fold is untouched, so the services descent and the page thesis are unchanged.

**The text and both calls to action are byte-identical.** Only the arrangement and the image changed, as asked.

**New photograph: a quiet corner - armchair, plant, afternoon light** (Pexels 31893675, licence-clean, metadata-screened like everything else here).

Two candidates were rejected before it:
- **Hands cradling a seedling** hit the brief's words exactly - warmth, growth - and is also the single most-used image in the therapy and wellness category. Using it would have put the page's most prominent frame on the one shot every competitor already has.
- **A warm amber interior** was genuinely calming but amber-dominant, and would have needed a heavy wash to sit next to an aubergine brand.

The corner was chosen because it is **already built from the palette**: the cushion is close to `gold`, the plant to `sage`, the chair and shelving to `ink`. It carries human warmth with no face in frame, which §24.5 requires and which also asks less of an anxious visitor than a stranger's expression does.

**The two-layer scrim is gone, and that is a simplification, not a loss.** It existed because every word sat on top of the photograph and contrast depended on which part of the image was behind them. The text now sits on flat `ink-deep` at **19.7:1**, so nothing is being compensated for. The 12% wash left on the image is the OWN-WORLD rule - photographs on this page sit under an ink wash - not an accessibility measure.

**Motion:** Framer Motion, as requested, replacing the CSS keyframe. The panel drifts `y: 0 → -14 → 0` over 9s, ease-in-out, infinite. Past §24.4's 4s floor on purpose: at this size a faster cycle reads as a bob rather than a breath. `useReducedMotion()` means the `animate` prop is never mounted when the visitor has asked for less motion, so the image sits still rather than animating to a halt.

**Responsive:** `lg:grid-cols-12` with a 6/6 split; below `lg` it stacks in DOM order, words first. The frame changes shape with the layout - `3/2` on phones, `16/10` from `sm`, `4/5` on desktop - because a portrait frame stacked under the copy would push the whole page down. `min-h` applies at `lg` only.

**`srcset` added:** a phone fetches 96 kB instead of 349 kB.

**Housekeeping:** the three `home-hero-mist*.jpg` files added yesterday are now unimported, so they were **deleted** rather than left as 310 kB of dead weight in the repo. Say the word if the previous hero should come back - the Pexels ID (12088034) is recorded in this log and the asset is one command away.

**The direction contract in `pages/Home.jsx` was updated to match.** Its FIRST VIEWPORT block described the full-bleed composition, and a contract that describes a page which no longer exists is worse than no contract, because the next reader trusts it. The revision is dated and says what it replaced.

**Files touched, and nothing else:** `components/home/Hero.jsx`, the contract block in `pages/Home.jsx`, the hero's own entry in `data/homeContent.js`, and the asset folder.

**Verified:** build passes, `oxlint` exit 0, impeccable detector 0 findings on the changed files, provenance embedded on both new rasters. **Still unseen in a browser** - the split layout at 360px, the drift, and the reduced-motion state all need the developer's eyes.

---

### Decision log — human portraits as placeholders (2026-08-29, Asad)

**Asad has approved using realistic human portraits as temporary placeholders across the whole project**, to be replaced with real client and therapist photographs before launch.

This is recorded here because it sits against master spec §24.5, which says to avoid generic stock photography of smiling people. The two are reconcilable, and the distinction matters:

- §24.5's objection is to the **register** — grinning stock faces that read as inauthentic and appear on every competitor's site. It is a design-quality rule.
- Asad's decision permits **human faces as development stand-ins**. It does not turn generic smiling stock into good design, and it is not a licence to stop caring which photograph is used.

So the rule this project now works to: human portraits are allowed, chosen in the register §24.5 actually asks for — natural light, looking away or in profile, contemplative rather than beaming. Every portrait used in chunk 2.2 follows that.

**What the approval does not cover: shipping them.** See blocker 10 below.

---

## Chunk 2.2 — Home: testimonials and who we help

**Status: Complete.** Nothing skipped.

Built:
- `client/src/data/homePlaceholders.js` — **the single placeholder file**, `// TODO: PLACEHOLDER — REPLACE BEFORE LAUNCH` on line 1. Holds all four testimonials, all four portrait imports, the five audience lines and the three figures. Neither component contains a word of its own copy, so there is one file to empty and not three.
- `client/src/components/home/Testimonials.jsx` — section 3.
- `client/src/components/home/WhoWeHelp.jsx` — section 5.
- `client/src/pages/Home.jsx` — composition only, with the gap for chunk 2.3 marked.
- Four portraits in `client/src/assets/`, provenance embedded in each.

**Section order is honoured, including the gap.** Master spec §24.7 puts "How it works" (section 4) *between* testimonials and who-we-help. They are therefore not adjacent in `Home.jsx`; a comment marks where 2.3 inserts, so that chunk is an insertion rather than a reshuffle.

**Decisions made:**

- **Testimonials are attributed as first name · what they came for · how long**, never a surname. §24.7 requires real testimonials to be anonymised with consent, so the placeholder is already in the shape the real ones must take rather than setting a precedent that has to be walked back.
- **Each quote is two sentences naming something that changed in an ordinary day** — sleeping through the night, catching an argument mid-sentence, writing something down while it was still happening. Developer's explicit requirement, and it is also the harder thing to mistake for marketing: "life changing" is a slogan, "I have slept through most nights since February" is a report.
- **One quote is a couple** (Marta and Joris), because couples share one account (§6) and the home page should show that path exists.
- **"Who we help" is NOT a row of big-number stat tiles.** That is the default build for "supporting figures and a client count", it is a named anti-pattern in the project's craft rules, and it is the wrong register — a wall of metrics aimed at someone deciding whether to ask for help is a company talking about itself at the moment the reader needs to be talked to. The five audience lines lead and take the width; the figures sit underneath at reading size on a sage rule, present and checkable but not shouted.
- **Audiences are written as situations, not segments.** "People who have never spoken to a therapist before and are quietly unsure whether what they are dealing with counts" is something a reader recognises themselves in; "first-time therapy seekers" is something a pitch deck recognises them in.
- **Two of the three figures are invented; one is not, and the file says which.** The 27 areas of concern is true (§15, `server/constants/specialtyTags.js`). It is flagged `invented: false` so whoever clears this file does not delete a true statement along with the false ones.
- **Cards are mist on paper, not paper on mist.** The first build had it the other way round and the cards would have been close to invisible — paper and mist are only **1.11:1** apart, so a white card on a mist ground has no edge of its own and a hairline border ends up doing all the work. Inverting it means the card is defined by its own ground, needs no border at all, and matches §24.2, which assigns mist to "alternating section backgrounds, cards" in as many words.
- **Ground rhythm:** the plan panel closes on `ink-deep`, testimonials open on `paper`, who-we-help returns to `mist`. Alternating per §24.2 rather than hard dividers.
- **Motion:** scroll reveals, 700ms, ease-out, **100ms stagger** — inside §24.4's 80–120ms band. `whileInView` with `once: true` per item, so nothing animates below the fold. The testimonial stagger is taken **modulo the column count** and the audience stagger is **capped at four steps**, because an uncapped index delay makes the last item sit visibly waiting after the ones above it have already arrived — that reads as lag, not rhythm. Everything gated on `useReducedMotion()`.

**Two primitives were extended rather than worked around:**
- `Text` gained a `subsection` size (26px). The audience lines needed it, and passing `className="text-subsection"` instead would have put two font-size utilities on one element, where the winner is decided by their order in the generated stylesheet rather than by the author.
- `Heading` gained a `tone` prop in chunk 2.1 for the same underlying reason. Both are recorded here so the pattern is visible: when a primitive is missing a step, add the step.

**A false claim was caught in my own draft and removed.** The testimonials intro originally opened "Names and details are shared with permission." That would have been a false statement sitting directly above four invented quotes, and a claim someone would then have to make true at launch. Replaced with a line that makes no claim about consent, verification, or collection, and which stays true whoever is eventually quoted.

**Contrast computed by hand, not eyeballed** (the detector cannot do it — see below). All pass AA:

| Pair | Ratio |
|---|---|
| `ink-deep` on `mist` (quote text) | 17.7:1 |
| `ink` on `mist` (name, headings) | 16.2:1 |
| `ink/70` on `mist` (captions) | 6.4:1 |
| `ink` on `paper` (heading) | 18.1:1 |
| `ink/70` on `paper` (intro) | 6.7:1 |
| `sage` rule on `mist` | 3.1:1 — non-text; clears the 3:1 floor and only just, so it must not be thinned |

**A correction to my own figures during the build:** I first wrote 16.6:1 for `ink` on `paper`, having carried over the `ink`-on-`mist` number. The real figure is **18.1:1**. Both component files carry the corrected table.

**Verified:**
- `npm run build` passes; 649 modules; all four portraits emitted to `dist/assets/`.
- `oxlint` — clean on every file this chunk touched.
- Impeccable detector — **0 findings, but read that as a degraded 0.** `htmlparser2`, `css-select`, `css-tree` and `domutils` are still not installed on this machine, exactly as recorded in the 2.1 entry, so the detector falls back to regex and evaluates neither custom properties nor computed contrast. The hand-computed table above is the compensation, since contrast is precisely the check it cannot run.
- Both `[data-surface=dark]` and `[data-surface=light]` focus-ring rules confirmed present in the built stylesheet.
- All four portraits metadata-screened before use; two candidates were **rejected outright** for carrying `dc:rights` / `dc:creator` strings — the same screen that rejected the original 2.1 hero photograph.

**Not verified — developer check needed:**
- **Nothing here has been seen rendered.** No browser on this machine, per the standing decision of 2026-08-27. Please check: the offset two-column arrangement at desktop width, the single-column stack at 360px, the 100ms stagger reading as rhythm rather than lag, and the whole page with reduced motion switched on in Windows settings.

**Not done (out of scope, by design):**
- Sections 4, 6 and 7 — how it works, comparison table, FAQ — and the second Get started CTA. All chunk 2.3.
- **The hero was not touched**, on explicit instruction. Three items raised there on 2026-08-29 are therefore still open: `data-surface=""` leaves the focus ring invisible on the dark hero ground, so a keyboard user cannot see focus on Get started; five unused imports; and three comments describing code that is no longer in the file.
- **The chunk 2.1 entry above no longer matches the code.** It records the hero photograph as Pexels 31893675, the armchair corner; the hero now renders `img3.jpg`. Flagged rather than edited, because the log is a record of what was done at the time and the hero is the developer's to change.

**PRE-LAUNCH BLOCKERS (running list) — one added:**
1. **`/styleguide` must be deleted** — development only.
2. **LinkedIn URL in `lib/siteConfig.js` is a placeholder** — swap for the real profile.
3. **Legal pages need real content** — Privacy, Terms, Refund.
4. **Favicon still missing** — client to supply.
5. **Footer tagline copy is mine, not the client's.**
6. **Delete `server/routes/dev.routes.js` and its mount** — guard-testing routes.
7. **Verify `castofmind.com` in Resend**, then change `EMAIL_FROM`.
8. **Create `support@castofmind.com`** and forward it — printed in every email footer and it does not exist yet.
9. **`client/src/assets/hero.png` has unknown provenance** — a 343×361 purple isometric graphic referenced by nothing. Delete it or record where it came from.
10. **NEW — replace or remove everything in `client/src/data/homePlaceholders.js`.** Two stacked risks, and the second is the sharp one:
    - Fabricated reviews and invented user counts on a live mental-health platform are a consumer-protection problem in most jurisdictions and a serious trust problem if discovered. §24.7 records this explicitly.
    - **The four portraits are photographs of real, identifiable people, and the file attaches each of them to an invented statement about their own mental health** — grief, anger, insomnia, a failing relationship. The Pexels licence permits commercial use of the image; it does not make it acceptable to publish a claim that a named real person was treated for depression. That is a different kind of wrong from fake body copy, and a clean licence does not cure it.

    Before launch, one of: real testimonials with **written consent and anonymisation** plus real figures, or **delete both sections**. Keep the `27` figure either way — it is true.

---

## Chunk 2.3 — Home: how it works, comparison, FAQ

**Status: Complete.** Nothing skipped. **The home page is now assembled in full.**

Built:
- `client/src/components/home/HowItWorks.jsx` — section 4, plus the second Get started CTA.
- `client/src/components/home/Comparison.jsx` — section 6.
- `client/src/components/home/Faq.jsx` — section 7, accordion built inline.
- `client/src/data/homeContent.js` — extended with `processSteps`, `comparisonIntro`, `comparisonRows`, `faqItems`. **All real content, every claim cited inline to the spec.** Nothing invented went into this file; fabricated material stays in `homePlaceholders.js`.
- `client/src/pages/Home.jsx` — all seven sections in §24.7 order.

**Final ground rhythm**, recorded because it is now fixed and later chunks should not disturb it:

```
hero .......... ink-deep      testimonials ... paper
services ...... ink-deep → ink → mist → paper → ink-deep
how it works .. ink           <- mid-page anchor, carries the 2nd CTA
who we help ... mist          comparison ..... paper
FAQ ........... mist          footer ......... ink  (from PublicLayout)
```

Putting "how it works" on ink is not decoration: yellow on paper is 1.63:1 and is never a button face on a light ground, so a dark section is what lets the second Get started look like the first one.

**Decisions made:**

- **The connector line is this chunk's one authored motion moment.** A line runs through the four steps and draws itself as the section arrives — left to right on desktop, top to bottom on mobile — with the markers landing behind its leading edge at a 100ms stagger and the copy settling under them. It is the process made visible: a path with a beginning and an end, drawn in the order the reader will walk it. Everything else in the chunk is deliberately quiet so this lands; a page where every section performs has no signature, only noise.
- **The line draw runs 1.1s, past §24.4's 600–800ms reveal band, on purpose.** It sits closer to ambient than to a section entrance, and a line that crosses the viewport in 700ms reads as a swipe rather than as a path being traced.
- **The steps are numbered, which is a default worth refusing almost everywhere else.** The project's craft rules ban section numbering unless the sequence itself carries information — and §24.7 names this section as exactly that exception. Recorded so nobody removes them thinking it is slop.
- **Two lines, not one, because the axis changes with the layout.** Each is hidden at the other breakpoint, and both animate by `scale` on the compositor, so a full-width line costs nothing.
- **The lines are siblings of the `<ol>`, not children.** An `<ol>` may only contain `<li>`; a decorative `<div>` inside it breaks the list semantics a screen reader uses to announce "4 items". Caught during the build.
- **The comparison uses no ticks and no crosses, and no red anything.** A column of green ticks beside red crosses is an argument, not a comparison, and `clay` is the error colour — using it to mark someone else's option as wrong would be the palette telling a lie. Both columns are set identically, with no highlight, tint, border, or "recommended" flag on ours.
- **No invented numbers about in-person therapy.** Session rates vary by city and practitioner and this project has no source for them, so the cost row describes how the charging works instead of quoting a figure it cannot stand behind.
- **The comparison states a real limitation of ours.** Under scheduling: *your therapist schedules each session and you join by link; you cannot book or move a session yourself.* True per §7.4, and someone who found that out after paying would be entitled to be annoyed. A comparison table that concedes nothing is the kind nobody believes.
- **The comparison ships two layouts, one set of facts.** A real `<table>` from `md` up, cards below it. Exactly one is displayed — `hidden` resolves to `display:none`, which removes the other from the accessibility tree, so nothing is announced twice. Reflowing a single table with `display:block` would have kept one DOM tree but stripped the row and column relationships that are the entire reason to use a table.
- **The FAQ accordion opens in 200ms, not 700ms.** §24.4 slows ambient and reveal motion but holds functional interactions at 150–250ms. Opening a panel is functional — the reader asked a question and is waiting. A 700ms accordion is the standard misreading of "calm": it is not calm, it is slow, and the spec says outright that a control taking that long is broken rather than serene. The section entrance around it still reveals at 700ms.
- **More than one panel can be open at a time.** Single-open accordions close the answer someone was reading when they open the next one, which is hostile if they were comparing two — cost against cancellation, say.
- **The FAQ panel unmounts when closed rather than being clamped to zero height.** Collapsed content left in the DOM stays in the accessibility tree, so a screen reader would read every answer whether open or not, which defeats the control. The cost is that `aria-controls` briefly points at an absent id, which ARIA tolerates; `aria-expanded` is the attribute doing the real work.
- **Arrow-key movement between FAQ headers is deliberately not implemented**, and is flagged in the file. It is optional in the ARIA authoring practices, and a half-built roving tabindex is worse than none — it would capture Tab without delivering the Home/End behaviour people who rely on it expect.

**The crisis question is in the FAQ, at the developer's decision.** It was not in the chunk brief; it was proposed, approved, and it matters more than the other five. A mental-health site with no word about emergencies has a duty-of-care gap, and someone at 2am is a realistic visitor to this page. It is written to three rules: say plainly this is not an emergency service, point to services that are, and **invent no phone numbers** — a wrong helpline number on a crisis answer is worse than no answer, which is why it names no specific line and defers to local emergency numbers. It gives no clinical advice of any kind.

**Contrast computed by script this time, not by hand.** Chunk 2.2 shipped a wrong figure (16.6:1 for ink on paper, which is actually 18.1:1) because it was carried over from another pair by eye. Every value below came out of a calculator run against the real hex values:

| Pair | Ratio | |
|---|---|---|
| `paper` on `ink` | 18.06:1 | pass |
| `paper/75` on `ink` | 10.42:1 | pass |
| `sage` on `ink` (step labels) | 5.31:1 | pass |
| `gold` on `ink` (button face) | 11.08:1 | pass |
| `ink` on `paper` | 18.06:1 | pass |
| `ink/70` on `paper` | 6.73:1 | pass |
| `ink` on `mist` | 16.25:1 | pass |
| `ink/70` on `mist` | 6.41:1 | pass |
| `paper/25` on `ink` (connector line) | 2.24:1 | decorative, exempt |
| `ink/20` on `mist` (rules) | 1.53:1 | decorative, exempt |

**A discrepancy found in the spec itself, recorded rather than silently patched:** §24.2 states gold on ink as **9.5:1**. Computed from the two hex values it is **11.08:1**. Nothing is broken — both clear every threshold that applies, and the spec's figure is conservative rather than dangerous — but the two do not agree, and 11.08:1 is what the palette actually produces. Worth correcting in the spec at some point; not changed here, because the spec is the client's document.

**Verified:**
- `npm run build` passes; 652 modules.
- `oxlint` — **0 findings** on every file this chunk touched.
- Impeccable detector — 0 findings, and as in 2.1 and 2.2 **read that as a degraded 0**: `htmlparser2`, `css-select`, `css-tree` and `domutils` are still not installed, so it runs on regex and evaluates neither custom properties nor computed contrast. The table above is the compensation.
- Responsive utilities confirmed present in the built stylesheet. Note for anyone checking this in future: Tailwind v4 emits `@media (width>=48rem)`, **not** `min-width` — grepping for `min-width` returns one hit across the whole file and proves nothing.

**Not verified — developer check needed:**
- **Nothing has been seen rendered.** No browser here, per the standing decision of 2026-08-27. Worth your time on this chunk specifically:
  1. **The connector line drawing** — does it read as a path being traced, or as a bar sliding in?
  2. **The full page scroll**, desktop and 360px, top to bottom, now that all seven sections are in.
  3. **Keyboard through the accordion** — Tab to a question, Enter and Space both toggle it, focus ring visible on `mist`, and the chevron rotation matches the panel.
  4. **The comparison at exactly 768px**, where it swaps from table to cards.
  5. **Reduced motion on** — the connector line should be present and full-length immediately, not absent.
  6. **All CTAs route** — two Get started to `/questionnaire`, and the two links to `/how-it-works`.

**Not done (out of scope, by design):**
- The dedicated `/how-it-works` page is chunk 2.5. This section links to it; that route still renders a placeholder.
- **The hero was not touched**, on explicit instruction for the third time. The three items raised on 2026-08-29 remain open: `data-surface=""` leaves the focus ring invisible on the dark hero ground, so a keyboard user cannot see focus on Get started; five unused imports (the only lint warnings in the client); and three comments describing code no longer in the file.
- No new pre-launch blockers. The list stands at 10.

---

### Decision log — design guidelines relaxed (2026-08-29, developer)

**What prompted it.** The developer reviewed the finished home page and said it felt premium but flat and static — good, but short of what they expected. That judgement was correct, and the diagnosis is worth recording because the cause was not a single bad decision.

**The honest cause.** The page was a stack of horizontal bands: each section a rectangle of solid colour containing a heading, a paragraph and a grid. Nothing overlapped, nothing sat at a second depth, nothing bled past its container, and almost every animation was the same fade-and-rise. It was correct against every rule in §24 and still inert.

The rules were not individually wrong. The problem was that §24 was written almost entirely as prohibitions and was therefore read defensively:

- an eight-token palette in which one token was capped at ~5% of a screen and another was described as "optional" and barred from CTAs, leaving aubergine and paper to do nearly all the work;
- a motion section whose most memorable line was "no parallax on text", which in practice removed scroll-linked motion from the site altogether;
- an anti-goals list nine items long, opening with "aggressive gradients", which was being applied as a ban on gradients of any kind.

Following that literally produces restraint without character. **Calm and inert are not the same thing**, and the first build collapsed them.

**What was granted.** Five permissions, approved by the developer:

1. **Soft atmospheric gradients** — `ink-deep` into `ink`, `sage` ambient washes, warm low-opacity glows. Harsh, neon and multi-hue gradients remain out.
2. **Richer `sage` and `gold`** — the rigid ~5% cap lifted; both usable in borders, icon strokes, rules, small fills, card highlights and washes.
3. **Gentle scroll depth and motion** — layered parallax drifts of roughly 10–20px, and reveals that unfold across a scroll rather than firing once.
4. **Custom SVG, delicate line icons, authored accents, and good relevant photography.**
5. **Spatial layering** — card offsets, overlap, elements bleeding past their container, `backdrop-blur`, soft shadows.

**The governing line, and the reason this is not a licence to redecorate:**

> **Natural, not decorated.** Every effect must look like a property of the material — light falling on a surface, a page settling, something growing. If it looks like an effect that was *applied*, it is wrong for this brand however tasteful it is in isolation.

The developer was explicit that this must stay inside the brand identity and must not be pushed too far, because it is a mental health platform. The permissions exist to make the site feel **alive and cared-for**, never busy or attention-seeking. §24.1's audience is unchanged: often anxious, often new to therapy, sometimes in distress.

**What did NOT change**, and none of the above touches it: every contrast floor, `prefers-reduced-motion`, 360px responsiveness, visible keyboard focus, 44×44px targets, semantic HTML, 150–250ms functional interactions, sentence case with no ALL-CAPS, no dark patterns — and the palette itself. These are permissions to use the eight existing tokens more fully, **not** permission to add a ninth.

**Files updated:**

| File | Change |
|---|---|
| `Cast_of_Mind_Master_Spec.md` | §24.1 anti-goals reframed; §24.2 gold cap lifted and sage promoted; §24.4 scroll-linked motion permitted; §24.5 SVG/icons/photography encouraged; **new §24.9 "Visual Latitude"** |
| `docs/05-design-system.md` | Same five changes, re-synced from the master spec |
| `.claude/rules/frontend.md` | Same relaxations, plus a new "Visual Latitude" block — and a **stale-data fix**, below |
| `docs/ongoing.md` | This entry |

**A stale file was found and corrected while doing this.** `.claude/rules/frontend.md` still listed the accent as `#E3B23C` and omitted `clay` and `sage-deep` — all three superseded on 2026-08-22 and never synced into that file. The code has been correct since then; this rules file was the only place still disagreeing, and it is the file that loads into context every session, so it was actively teaching the wrong palette. Now matches the spec.

**Also recorded while updating §24.2:** the spec states gold on ink as 9.5:1. Computed from the hex values it is **11.08:1**. Both clear every threshold, so nothing is broken and nothing was changed — noted in the chunk 2.3 entry above and repeated here so it is not lost.

**No code was touched.** This entry is documentation only. The existing home page still reflects the old, tighter reading of the guidelines; applying the new latitude to it is separate work and has not been done or authorised yet.

---
