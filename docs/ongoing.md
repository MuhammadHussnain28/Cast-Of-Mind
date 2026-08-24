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

