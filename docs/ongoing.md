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

## Chunk 2.4 — About page (`/about`)

**Status: Complete.** Nothing skipped. First page built under the §24.9 visual latitude.

Built:
- `pages/About.jsx` — composition plus the two text-free gradient transition strips.
- `components/about/` — `AboutHero` · `BrandStory` · `Founder` · `TeamGrid`.
- `components/layout/ScrollToHash.jsx` — new, mounted in `PublicLayout`.
- `data/aboutContent.js` — the parts that are **true** (mission, brand philosophy).
- `data/aboutPlaceholders.js` — **everything invented**, marker on line 1.
- `App.jsx` — the `/team` redirect, and nothing else.
- Five portraits in `client/src/assets/`, provenance embedded in each.

**Ground rhythm.** `ink-deep` → strip → `ink` → strip → `mist` → `paper`. The strips carry no words on purpose: a band whose ground runs ink to mist has no text colour that passes contrast at both ends, so the gradient gets its own space and every section holding copy keeps one flat, measured ground. This is the one technique from the abandoned home-page redesign that was worth keeping, and it is the whole fix for the "stack of flat bands" problem.

**Decisions made:**

- **The founder section is third person with no quotation marks.** Asad is a real, named person — unlike the invented clients quoted on the home page, who do not exist. A fabricated first-person quote attributed to him would be misattribution, not placeholder copy. Approved on that basis. If a real quote replaces this later it must be his own words.
- **Asad appears in both his own section and the team grid.** `/team` redirects to the grid, so the grid has to read as a complete team standing alone rather than as four people and a gap. Developer's decision.
- **Elevation is declared once per state, which is why the card shadow only appears on hover.** A 1px border sitting under a soft shadow at rest is the "ghost card" — two competing depth cues on a surface that is not actually raised. At rest the cards are flat mist panels with a hairline edge; on hover they lift 3px, the border warms to sage, and a shadow appears, because the card is now genuinely off the page. This is a deliberate deviation from the literal brief (which asked for border *and* shadow) and produces the same result the brief wanted without the tell. 200ms, because §24.4 keeps hover feedback fast.
- **The logo is presented at 260px, not at display scale.** The singular-wordmark asset was made in chunk 0.5 by clipping the S out of a flattened raster, and carries two known defects recorded above: the wordmark sits ~3% left of centre, and the D's bowl has faint stair-stepping. Invisible at navbar size; visible the larger it is printed — and a brand section is exactly where someone looks closely. **This constraint disappears the moment Asad supplies the vector source**, which is worth asking for regardless because the favicon needs it too.
- **The white logo original is used rather than the ink recolour**, which is why the brand section is dark. The white file is the untouched client asset; the ink version is a derivative I produced. A brand presentation should be built around the real thing.

**A routing gotcha that would have shipped silently.** React Router sets `location.hash` and **does not scroll**. Without a handler, `/team` → `/about#team` lands the visitor at the top of the About page and the anchor does nothing — the redirect looks like it worked and did not. `ScrollToHash` fixes it, retries across ~10 animation frames because the target usually has not painted when the effect first runs, then gives up rather than looping. Smooth scrolling is disabled under `prefers-reduced-motion`; `scroll-mt-28` (112px) clears the 72px sticky navbar.

**Contrast — computed by script, not estimated. All 17 pairs checked, every text pair clears AA:**

| Pair | Ratio | | Pair | Ratio |
|---|---|---|---|---|
| paper on ink-deep | 19.7:1 | | ink on mist | 16.2:1 |
| paper/80 on ink-deep | 12.5:1 | | ink/70 on mist | 6.4:1 |
| paper on ink | 18.1:1 | | ink on paper | 18.1:1 |
| paper/80 on ink | 11.7:1 | | ink/70 on paper | 6.7:1 |
| paper/75 on ink | 10.4:1 | | sage-deep on mist | 4.9:1 |
| sage icon on ink | 5.3:1 | | | |

Decorative and exempt: `ink/8` rest border 1.2:1, `sage/40` hover border 1.5:1, `sage/25` logo ring 1.4:1.

Three comment figures were wrong on first write and were corrected against the calculator rather than left: `sage-deep on mist` was recorded as 5.2 (it is 4.9), `paper/80 on ink` as 11.6 (11.7), and one block listed a `paper/70` pair that the file does not use.

**Verified:**
- `npm run build` passes; 665 modules; all five portraits emitted.
- `oxlint` — **0 findings** on every file this chunk touched.
- Impeccable detector — 0 findings, and as before **read that as a degraded 0**: the parsing dependencies are still absent, so it runs on regex and cannot evaluate contrast. The table above is the compensation.
- Generated CSS confirmed to contain the arbitrary hover shadow, `scroll-margin-top`, `aspect-ratio:4/5`, `sage-deep`, and both gradient stops.
- All five portraits metadata-screened before use; **three candidates rejected outright** for carrying `dc:rights` or `dc:creator`.
- An unused `group` class was removed from the team card during cleanup.

**Not verified — developer check needed.** Nothing has been seen rendered. Worth judging specifically:
1. **`/team` actually landing on the team grid** — the whole point of `ScrollToHash`, and the easiest thing to get wrong.
2. The hover lift on the cards — 3px and a soft shadow, or does it need more?
3. The logo at 260px: does it read as a considered presentation, and are the two known defects visible at that size?
4. The two gradient strips — continuous descent, or still visible as bands?
5. 360px, and reduced motion on (the hash jump should be instant, not smooth).

**PRE-LAUNCH BLOCKERS — one added, list now stands at 11:**

11. **NEW — replace or remove everything in `client/src/data/aboutPlaceholders.js`.** Every name, face, role and biography is invented, and this one carries a sharper edge than the home-page placeholders:

    - **Two entries carry clinical credentials** — a PhD in Clinical Psychology with HCPC registration, and an MSc with BACP accreditation. A named person with a clinical title on a mental health platform is an **implied credential claim**: a visitor reasonably concludes that qualified clinical governance exists. If that reaches production before it is true it is closer to a regulatory misstatement than to placeholder copy, and the professional bodies named protect their accreditation wording.
    - **Each claim is attached to a real person's face.** These are photographs of identifiable people who have not agreed to be presented as this company's staff, still less as holding degrees they may not hold. The Pexels licence permits commercial use of the image; it does not make the claim acceptable.

    **This was raised before building and the developer confirmed it deliberately** (2026-08-31), on the grounds that realistic qualifications help the design read correctly and will be replaced with the real team's details before launch. Recorded here so the decision is traceable and the swap is unmissable — the warning at the top of the file says the same thing at length.

    Before launch, one of: the real team with their real roles, real qualifications and their own photographs, with consent — or remove the founder and team sections from `/about` entirely.

---

### Chunk 2.4 follow-up — About hero refined (2026-08-31)

**A bug shipped in 2.4 and now fixed.** `AboutHero` used `motion-safe:animate-drift`, but `--animate-drift` was defined in the Part 1 home redesign that was reverted to `03d10ff`. The token no longer existed, so Tailwind generated nothing and the class was dead — the sage glow rendered but never moved. Caught by grepping the built CSS (0 occurrences), not by looking at the page. **Lesson: a token introduced in work that gets reverted must be re-checked wherever else it was used.** The token is now defined in `index.css` in its own right.

**Layout** now matches the home hero exactly — `py-10 lg:py-12`, `lg:min-h-[calc(100svh-72px)]`, `items-center` — on a 7/5 twelve-column split. Developer's request, for consistency between the two landings.

**New `components/about/UntanglingLine.jsx`.** An authored SVG rather than a photograph, for two reasons: the home hero already carries a photograph on the right, so a second one would make the two pages the same page with different words; and the BrandStory section directly below already presents the logo's brain-and-roots form, so reusing that motif here would weaken both.

The concept is the mission sentence drawn — one continuous stroke that starts tangled at the top and resolves into a straight line descending to a single gold point. Sage stroke at one weight, `non-scaling-stroke` so it stays 1.75px at any size, drawn via Framer Motion's `pathLength` over 1.6s, with the gold arrival point landing at 1.45s. Full and static under `prefers-reduced-motion`.

**The path was verified, not guessed.** Hand-authored béziers cannot be checked by eye without a browser, so the `d` attribute was parsed, sampled at 212 points and plotted as an ASCII grid in the terminal. The shape confirmed: a loop at the top, a wave whose amplitude decays through the middle, a straight vertical resolution at the bottom. Content spans x 95–189 in a 300-wide viewBox, so the line sits centred with generous air either side — intentional, and what §24.7 asks for on this page.

**Standing instruction recorded: keep code comments concise.** Only where the logic is genuinely non-obvious; no multi-paragraph headers. Durable reasoning belongs in this file, which is the actual decision log. The long headers already in `home/` and `about/` were left in place rather than bulk-trimmed — that is a separate pass and was not requested.

**Verified:** build passes (666 modules); `oxlint` 0 findings on the changed files; detector 0 findings (degraded, as always); `animate-drift`, its keyframes and the 12-column grid all confirmed present in the built stylesheet. Decorative colours: sage on ink-deep 5.8:1, gold 12.1:1.

**Not verified:** the rendered result. The ASCII plot proves the geometry, not how it reads at size. **Worth judging: does the line land as meaningful, or as a squiggle?** If the latter, the fallback is a photograph and it is a ten-minute change.

---

### About hero — layered photo composition (2026-08-31)

**The untangling-line SVG was rejected and removed.** The developer's verdict was that it felt basic, and that was correct: a single hairline stroke is a small idea printed large, occupying about 30% of its frame with the rest empty. Abstraction only reads as restraint when it has density; otherwise it reads as unfinished. `UntanglingLine.jsx` is deleted.

**Replaced with three photographs at three depths** — a dim room with light through an arched window, hands round a cup on mustard linen, fern fronds against a sunlit wall. Chosen as a set rather than individually: room, then gesture, then detail, with a colour story running dark interior → mustard (near `gold`) → sage. Two of the three carry palette colours in the subject itself, which is why they sit on `ink-deep` without fighting it.

Why photographs and not another graphic: the home hero already carries one contained photograph, so a *composition* of three at different depths is visibly a different page rather than the same layout twice. It also puts the most important ingredient — the images — somewhere it can actually be checked before shipping, which the SVG never was.

**Geometry was computed, not eyeballed.** Three absolutely-positioned percentage layers is exactly where blind authoring fails, so the layout was modelled numerically and printed as a coverage map. The first arrangement had a large dead block in the bottom-right quadrant and a fern/room overlap of only 0.038 — effectively adjacent rather than layered. Adjusted to: fern `left-2% w-42%`, room `w-72% aspect-2/3`, hands `left-14% bottom-0 w-46%`. Overlaps rose to 0.067 and 0.093, coverage from 76% to 80%, and the remaining gaps sit as negative space rather than as one hole.

**The room photograph was re-cropped at source to 2:3** to match its display ratio. It had been 4:5, so `object-cover` would have silently trimmed 17% off its sides — including part of the window that is the whole reason the frame was chosen.

**Depth is carried by drift rate, not just by z-index.** Front layer travels 24px, middle 16px, rear 8px — all within §24.9's 10-20px band except the front, which is marginally over at 24px and is the element furthest from the reader's eye. Proportional drift is what makes the group read as space rather than as three images sliding together.

**One elevation cue per element.** The front photograph gets a light ring rather than a shadow: it sits over another photograph on a near-black ground, where a shadow is invisible. The rear layer gets nothing at all, because it is behind everything and needs no separation.

**Also fixed:** `--animate-drift` was reintroduced to `index.css` in the previous change; the composition's ambient wash uses it.

**Verified:** build passes (669 modules); `oxlint` 0 findings; detector 0 (degraded); `aspect-ratio:2/3` and the ring utility both confirmed in the built stylesheet; all three photographs metadata-screened, with two candidates rejected for carrying `dc:rights`.

**Not verified:** how it reads at real size. The coverage map proves the boxes land where intended; it says nothing about whether the three images look good together.

---

## Chunk 2.5 — How It Works page (`/how-it-works`)

**Status: Complete.** Nothing skipped.

Built:
- `pages/HowItWorks.jsx` — composition and the tone strips.
- `components/how-it-works/` — `HowItWorksHero` · `ProcessPhase` · `ProcessStep` · `StepIcons` · `ClosingCta`.
- `data/howItWorksContent.js` — seven steps in three phases. All true, each cited to its spec section.

**Structure: three phases, not seven rows.** Seven identical rows is the sameness trap hit in Services. Grouping does three jobs at once — rhythm, ground alternation without seven bands, and one genuinely reassuring fact delivered by the structure rather than the copy: the first phase is headed *"Before you pay anything"*, so an anxious reader learns that steps 1–3 cost nothing before reading a word of them.

```
hero ......... ink-deep
Before you pay anything ... paper   (questionnaire, matching, choosing)
Signing up ................ mist    (subscribe, credentials)
Working together .......... paper   (first message, sessions)
close ........ ink
```

Tone changes happen in text-free gradient strips, so each phase keeps one flat measured ground.

**Decisions made:**

- **Left rail throughout, not zig-zag.** Alternating sides is busier and this page's job is to calm. Variation comes from the icons and the phase breaks. The rail is drawn on the `<ol>` rather than per step, so it stays continuous between them.
- **Every step carries a reassurance line** — *"No account, no card. You can close the tab at any point."*, *"You choose — nobody is assigned to you."*, *"Your card details never reach us."*, *"If your therapist is offline your message waits. It is not lost."* This is the copy doing the page's actual job.
- **Seven authored icons, one language:** 24px viewBox, 1.5 stroke, round caps, colour inherited. Matching is two overlapping circles with a dot in the lens, because the overlap *is* the mechanism. Choosing is three cards with one brought forward. Credentials is an envelope with a key, so it does not read as generic mail.
- **Different from the home page's version by construction.** Home is a dark section with four steps on a horizontal rail; this is seven steps in three phases on light grounds with a vertical rail. Same visual language, different application.

**Two things deliberately NOT said on this page:**
1. **The zero-match fallback.** §15 returns every therapist silently when nothing overlaps — an explicit client decision. Explaining it here would broadcast the message they chose not to show.
2. **Any timing claim.** No "takes five minutes", no "matched within a day". There is no basis for either.

**Geometry verified before shipping, not eyeballed.** Every icon's shapes were bounds-checked against the 24×24 viewBox including the 1.5 stroke. All seven fit; the tightest is Credentials at y 22.0, leaving 1.25 of clearance. This is the same discipline used on the About composition and it exists because hand-authored SVG is exactly where a browserless build goes wrong.

**A real contrast failure found by measurement.** The step number badge was `sage-deep` on a `sage/12` tint. On the paper phases that is 4.85:1, but on the **mist phase it measured 4.40:1 — under the 4.5 floor for text.** The tint sat on an already-tinted ground and lost the margin. Fixed by making the badge `paper` with a sage ring, matching the icon plate: the numeral now holds **5.48:1** and the icon **3.40:1** on every ground, and badge and plate read as one material. Nothing on the page depends on which phase it lands in.

**Full measured table — all pairs clear their floor:**

| Pair | Ratio | | Pair | Ratio |
|---|---|---|---|---|
| paper on ink-deep | 19.7:1 | | ink on mist | 16.3:1 |
| paper/80 on ink-deep | 12.5:1 | | ink/70 on mist | 6.4:1 |
| ink on paper | 18.1:1 | | sage-deep on mist | 4.9:1 |
| ink/70 on paper | 6.7:1 | | badge sage-deep on paper | 5.5:1 |
| sage-deep on paper | 5.5:1 | | icon sage on paper | 3.4:1 |
| paper on ink (close) | 18.1:1 | | gold button face on ink | 11.1:1 |

Decorative and exempt: sage/30 rail 1.4:1, sage/30 plate ring 1.3:1.

**Two lint issues fixed at the root rather than suppressed:**
1. `StepIcons.jsx` exported a lookup object alongside its components, which breaks fast refresh for the whole file. The icons are now individual named component exports and the lookup is built locally in `ProcessStep`.
2. The page numbered its steps by mutating a counter during render — flagged by the React Compiler rule. Start numbers are now derived up front with a reduce.

**A Tailwind trap avoided.** The tone strips were first written as `` from-${x} `` template literals. Tailwind scans source *text*, so an interpolated class name is invisible to it and the utility never gets generated — the gradients would have silently rendered as nothing. Replaced with a map of complete literal class strings, and all six gradient stops confirmed present in the built stylesheet.

**Verified:** build passes (676 modules); `oxlint` **0 findings**; detector 0 (degraded, as always — the parsing dependencies are still absent, which is why every pair above was computed by hand).

**Not verified — developer check needed.** Nothing has been seen rendered:
1. **The seven icons at 28px.** Bounds are proven; how they read is not. Choosing and Credentials are the two with the most going on and the most likely to look busy.
2. The rail drawing per phase, and whether the badge sits on it cleanly.
3. 360px — the rail and badge occupy the left 56px of every step.
4. Reduced motion: rails full-length and static, no missing content.

---

## Chunk 2.6 — Contact page and `POST /api/v1/contact`

**Status: Complete.** Nothing skipped. **Slice 2 (public marketing pages) is finished.**

Built — server:
- `routes/contact.routes.js` · `controllers/contact.controller.js` · `services/contact.service.js`
- `validation/contact.schema.js` · `constants/contact.js`
- `services/email/templates/contactMessage.js`
- `routes/contact.test.js` — 13 tests
- Edits: `email.service.js` (replyTo), `config/env.js` (`CONTACT_TO`), `routes/index.js`, `.env.example`

Built — client:
- `pages/Contact.jsx` · `components/contact/{ContactForm,ContactChannels,ContactIcons}.jsx`
- `data/contactContent.js` · `lib/api/contactApi.js` · `lib/validation/contact.js`
- Edit: `lib/controlStyles.js` plus the three text controls (see the focus note below)

**Decisions made:**

- **Nothing is written to MongoDB.** Email delivery only, per the chunk brief. A test asserts the contact service exports exactly one function, so a future change that quietly adds a model fails review rather than at runtime.
- **`replyTo` is the sender; `from` stays our verified domain.** Sending *as* the visitor would fail SPF and land the message in spam. Asad can hit reply and reach them directly.
- **The honeypot returns success.** A filled honeypot means the message is discarded and the response is byte-identical to a real send. Telling a bot it was caught just teaches it which field to leave alone. Two tests cover this — one that a filled field discards, one that an empty field still sends.
- **The message body is never logged.** Message content is on the never-log list, and a contact message from someone in distress is exactly the case that rule exists for. Only success or failure is recorded.
- **Every field is HTML-escaped in the email template.** This is the one email on the platform whose body is written by an untrusted stranger. Line breaks are preserved because they wrote prose, not one block.
- **An invalid `subject` is rejected rather than silently corrected**, so a tampered payload never reaches the email body.
- **One reply for every outcome** — sent, discarded, or delivery failed. A visitor cannot act on the difference.

**The escalation phone is deliberately null.** §11 and §18 both describe a published phone number as part of the misconduct route, and no number exists. Inventing one would be worse than a fabricated testimonial: someone in distress could dial it and reach a stranger or nothing at all. While it is null the card shows the email route and says a line is being set up. Supply the real number in `data/contactContent.js` and the card completes itself. Same treatment for support hours — no response-time promise is made anywhere, because there is no basis for one.

**Focus ring — the brief and the spec conflicted, and the spec won on the part that matters.** The request was a sage or gold focus ring. §24.2 is explicit that yellow is never a focus ring on a light surface (1.63:1), and sage manages only 3.40:1 — clearing the 3:1 floor, but with no margin, and it would have diverged from `/login` and `/reset-password`.

Resolved by separating the two jobs: the **keyboard indicator stays the ink `:focus-visible` outline**, and a **sage border plus a soft glow** marks the active field on any focus, mouse included. Keyboard users get both. Approved on that basis.

**This applies site-wide, not just to Contact**, and that is worth stating plainly: `className` on Input/Textarea/Select goes to the `Field` wrapper rather than the control, so the treatment had to live in `lib/controlStyles.js`. Login and password reset now have it too. Additive only — nothing at rest changed, and both pages were rebuilt and linted clean.

**Contrast — computed, all thirteen pairs clear their floor:**

| Pair | Ratio | | Pair | Ratio |
|---|---|---|---|---|
| paper on ink-deep | 19.7:1 | | ink on mist | 16.3:1 |
| paper/80 on ink-deep | 12.5:1 | | ink/70 on mist | 6.4:1 |
| ink on paper (labels) | 18.1:1 | | sage-deep on mist | 4.9:1 |
| ink/60 placeholder | 4.8:1 | | sage icon on paper | 3.4:1 |
| ink/50 rest border | 3.4:1 | | clay error text | 5.5:1 |
| sage focus border | 3.4:1 | | clay error border | 5.5:1 |

**A regression I caused, found and fixed.** Making `CONTACT_TO` required in production broke `roleGuards.test.js`, which boots a real `NODE_ENV=production` child process to prove the dev routes are unmounted. The child now exited at startup. **This is the identical pattern to chunk 1.5**, where adding the production email checks broke the same test for the same reason — a production-only env check is invisible until something actually boots production. Fixed by supplying `CONTACT_TO` to the child, since that test is about route mounting rather than email configuration.

**A diagnostic worth recording.** The full suite first reported **94 failures across 4 suites**. Run individually, every one passed. This is the flake recorded in chunk 1.6 — parallel `mongodb-memory-server` instances are more than this machine holds. `npm test -- --runInBand` gave a clean signal and isolated the single real failure above. **If the suite ever fails oddly again, run it serially before investigating.**

**Verified:**
- `npm test -- --runInBand` — **173 tests across 9 suites, all passing** (160 from earlier chunks, 13 new).
- `npm run lint` (server) clean; `oxlint` (client) **0 findings** on everything this chunk touched.
- Client build passes, 682 modules.
- Detector 0 findings (degraded, as always — hence the hand-computed table).
- All three contact icons bounds-checked against the 24×24 viewBox including stroke: envelope, shield and clock all fit.
- The same non-component-export trap from `StepIcons` was caught again in `ContactIcons` and fixed before it reached lint.

**Manual steps for the developer:**
1. **Add to `server/.env`:** `CONTACT_TO=atcastofmind@gmail.com`. Without it the server still runs in development (messages print to the terminal), but **production refuses to start**.
2. **No new packages.** Everything reuses the Resend service from chunk 1.5.
3. **Sending a real message is yours to trigger** — an outward-facing action, same as the password reset in 1.5. Fill in the form on `/contact` with the dev servers running and confirm it arrives.

**Not verified — developer check needed.** Nothing has been seen rendered:
1. The sage focus border and glow — **and check `/login` and `/reset-password` too**, since they now have it.
2. The three icons at 24px.
3. Validation: submit empty, submit a bad email, and confirm the errors say how to fix rather than just what is wrong.
4. The success screen replacing the form.
5. 360px, and reduced motion.

**Pre-launch blockers — list stands at 11, one updated.** Blocker 8 (`support@castofmind.com` does not exist) now has a second consequence: it is the address published on `/contact`, not only in email footers. Add to it: **supply the misconduct escalation phone number**, or confirm the email-only route is the intended launch state.

---

## Developer visual pass — 2026-09-02

Developer replaced three layouts by hand: About hero now mounts a 3D fanned card deck (`WhyCardsDeck.jsx`) driven by scroll and touch, Contact is a split-screen (dark left panel, elevated white form card), and Services uses sticky stacking cards for the five themes.

Reviewed, not modified. Contrast passes on every text pair; open items are sub-44px deck controls, `ink/40`–`ink/50` swipe hints below 4.5:1, the unused `video-for-about.mp4` import still shipping 2.1MB, and `peace.jpg` at 5.5MB.

---

## Chunk 3.1 — therapistApplications model and Cloudinary uploads

**Status: Built and tested. ONE VERIFICATION IS BLOCKED** on a Cloudinary account permission — see "The live check could not complete" below. Nothing was skipped by choice.

Built — model:
- `models/TherapistApplication.js` — every field in master spec §23, plus `status` / `submittedAt` / `reviewedAt`.
- `models/TherapistApplication.test.js` — 83 tests.

Built — uploads:
- `constants/uploads.js` · `config/cloudinary.js` · `utils/fileSignature.js`
- `middleware/upload.js` · `services/upload.service.js` · `controllers/upload.controller.js` · `routes/upload.routes.js`
- `routes/uploads.test.js` (27 tests) · `utils/fileSignature.test.js` (14 tests)
- Edits: `config/env.js` (Cloudinary vars), `routes/index.js` (mount), `.env.example`

**SPEC DISCREPANCY FOUND — the field count is wrong.** §23 is titled "33 fields, 28 mandatory, 5 optional". Adding up its own per-step table gives **34 fields — 30 mandatory, 4 optional**. The summary row disagrees with the rows above it. Counting storage slots it is **35**, because `disciplinaryDetails` is a conditional sub-field the table folds into the yes/no it hangs off. Every field in the per-step tables is built. The number "33" is quoted in `CLAUDE.md`, `docs/chunks.md` and the master spec and is off by one — **not corrected here, because the spec is the client's document.**

**Decisions made:**

- **Files go through our server, not browser-direct to Cloudinary** (Decision A, approved 2026-09-02). Direct signed upload would mean we never see the bytes — and `.claude/rules/backend.md` requires "restrict type, size, **and verify content**". You cannot verify content you never receive. It also hands the browser a signed permit it can point at any file.
- **Content is checked by magic bytes, not by the label.** The filename and the browser-declared MIME type are both written by the sender. An executable renamed to a .pdf and sent as application/pdf passes every check that trusts either one. `utils/fileSignature.js` reads the leading bytes and rejects everything else, including ZIP (so .docx and .xlsx) and SVG (which can carry script). Hand-rolled in ~50 lines rather than adding `file-type`: four formats, and it is directly unit-testable.
- **Credential documents are `type: 'authenticated'`; the profile photo is public** (Decision B). A Cloudinary URL is unguessable but not secret, and once leaked it is public for ever — these are a real person's professional papers and sometimes personal ID. The photo stays public because clients see it on the matching page anyway. **Consequence for slice 4: the admin cannot open a certificate by pasting its URL.** The Cloudinary `publicId` is stored beside each document URL (`certificatePublicId1/2`, `licenseDocPublicId`) so slice 4 can sign a short-lived delivery URL without parsing one back out of a URL string.
- **This endpoint is public and unauthenticated, and has to be** — an applicant has no account until an admin approves them (§10.4), so there is no token to check. That single fact drives the rate limit (10/hour/IP against a legitimate maximum of four), the hard size caps, and the byte-level type check. It is the only endpoint on the platform where a stranger can write to paid storage.
- **The original filename is discarded.** The `public_id` is 16 random bytes. A filename can carry the applicant's own name straight into a URL.
- **Duplicate tags are rejected**, not just out-of-range counts. Three identical tags satisfy "3 to 4 tags" while leaving the therapist with effectively one specialty — quietly broken matching rather than a visible error. Same check on treatment orientations and on languages.
- **Tag count limits are imported from `constants/specialtyTags.js`**, not redeclared in the model, so the model and the form cannot drift apart.
- **No plaintext `password` field exists on the schema at all** — only `passwordHash`, `select: false`, stripped again in `toJSON`. A mistaken caller cannot store a readable password even by trying. A test pins this.
- **`disciplinaryActions: true` and `malpracticeInsurance: false` are recorded, never auto-rejected.** Both fail the eligibility notice, but the admin decides. Two tests assert the application still saves as `pending`.
- **Working hours: end must be after start, and the error says how to fix it** — *"For hours that cross midnight, use the notes field."* Rejecting an end before a start catches the common typo; genuinely overnight availability goes in `workingHours.note`, which is what that field is for. At least one day must be enabled.
- **A partial unique index on `email` where `status: 'pending'`** — one live application per address. Rejected and approved records are retained, so a rejected applicant can reapply and the history survives. Without it the admin could approve two pending applications for one address and the second would collide on the unique `users.email` index halfway through slice 4's two-document transaction.
- **`timestamps: { createdAt: 'submittedAt' }`** rather than carrying both a `createdAt` and a near-identical `submittedAt`.
- **Cloudinary config is required in production, optional in development** — same pattern as Resend. A missing key in development returns a clear 503 from the endpoint rather than stopping the server booting for someone working on auth. **Partial configuration exits at startup in every environment**, because one missing value of three surfaces later as an opaque authentication failure.
- **An 18+ floor on date of birth** is a sanity check, not a spec rule — flagged rather than slipped in.

**Verified:**
- `npm test -- --runInBand` — **297 tests across 12 suites, all passing** (173 from earlier chunks, 124 new).
- `npm run lint` — clean.
- **Mutation-checked.** Disabling the magic-byte guard — the exact mistake the module exists to prevent — broke **6 tests**. Restored and the suite re-run. The tests detect the behaviour they claim to.
- The endpoint tests mock Cloudinary via `jest.unstable_mockModule`, so the suite never touches a real account or spends quota, and the upload options can be asserted directly: authenticated delivery on documents, public on photos, three separate folders, random non-reused public ids, `overwrite: false`.
- Every rejection path asserts **Cloudinary was never called** — a bad file must not reach the network at all.

**THE LIVE CHECK COULD NOT COMPLETE — and the cause is not the code.**

Running real uploads through the real endpoint against the real account, the image and PDF uploads returned **403 from Cloudinary**, while the rejection paths (executable renamed to a .pdf, and an oversized file) both passed correctly with 422 and 400.

Diagnosed rather than guessed. A hand-built signed upload, bypassing our code entirely, returned the same thing — *"Request forbidden due to missing permissions (actions=[create])"* — and the management API returned the same for `actions=[read]`.

**That message is the proof.** An incorrect signature returns *"Invalid Signature"*; bad credentials return *"Invalid credentials"*. "Missing permissions" means the request and the signature are correct and the key is simply not allowed to act. **The API key in `.env` is a scoped key with no permissions granted.** Cloudinary's newer scoped keys are created empty.

**Nothing was left behind in the account** — no upload ever succeeded, so there is nothing to clean up. The `cast-of-mind/_test/` folder was never created.

Also found on the way: `api.cloudinary.com` timed out entirely on the first two attempts and then responded normally, while `res.cloudinary.com` was fine throughout. **The connection to Cloudinary's API from this machine is intermittent.** Worth knowing before blaming code for a timeout. `services/upload.service.js` now logs the HTTP status alongside the SDK message, because the SDK's message on its own is just *"Server returned unexpected status code - 403"* and hides the real cause.

**Manual steps for the developer:**

1. **GRANT THE CLOUDINARY KEY ITS PERMISSIONS — this is what blocks the live check.** Cloudinary Console → Settings → API Keys. Either grant the existing key **create** and **read** on the product environment, or switch to the account's master key. All three Cloudinary variables are already set in `server/.env` and are otherwise valid — only the permissions are missing.
2. **Enable PDF delivery.** Cloudinary Console → Settings → Security → allow delivery of PDF and ZIP files. Blocked by default on newer accounts; without it a PDF uploads fine and its URL then returns 401, which reads like a bug in our code and is not.
3. **Packages installed** in `/server`: `cloudinary` (^2.11.0), `multer` (^2.3.0 — v2 is the maintained line; v1 had known CVEs). No new external accounts.
4. **Re-run the live check once step 1 is done.** With the dev server running, upload a real image and a real PDF to `POST /api/v1/uploads` with a `kind` field of `photo` or `certificate`, and confirm: both return 201, the photo URL opens in a browser, and **the certificate URL does NOT** — that last one is the whole point of Decision B. Say the word and I will re-run the scripted version, which also deletes everything it creates.

**A small fix in passing:** `routes/contact.test.js` from chunk 2.6 had a lint error (the destructure-to-omit idiom tripping `no-unused-vars`). The 2.6 entry records lint as clean, so it was missed. Rewritten as an explicit `delete`; lint is clean again.

**Carried forward:**
- **Orphaned uploads.** Someone can upload four files and never submit the form; those files stay in Cloudinary for ever. A cleanup script belongs beside `npm run cleanup:tokens`, but it cannot tell what is orphaned until the submission endpoint (3.2) exists to say which URLs are referenced. **Build it in 3.2 or shortly after.**
- **Slice 4 must generate signed delivery URLs** for authenticated documents, using the stored `publicId` fields. Without it the admin sees a broken link where a certificate should be.

**Pre-launch blockers — unchanged, the list stands at 11.** No placeholder content was created in this chunk.

**Not done (out of scope, by design):**
- No application form UI (chunk 3.3+), no submission endpoint (3.2), no approval flow or two-document transaction (slice 4).
- No check that an application email collides with an existing `users` record — that belongs to 3.2's service, alongside password hashing at submission.
- No signed viewing URLs for the admin (slice 4).

---

## Chunk 3.2 — Application submission endpoint

**Status: Complete.** Nothing skipped. The live check ran end to end against the real server and the real Atlas cluster, and the test record was deleted afterwards.

Built:
- `POST /api/v1/therapist-applications` — validate, check the email, hash the password, save as pending, send two emails.
- `GET /api/v1/therapist-applications/:id/status` — public status check.
- `validation/therapistApplication.schema.js` · `services/therapistApplication.service.js` · `controllers/therapistApplication.controller.js` · `routes/therapistApplication.routes.js`
- `constants/therapistApplications.js` · `utils/cloudinaryUrl.js`
- `services/email/templates/applicationReceived.js` (applicant) · `newApplication.js` (admin)
- `routes/therapistApplications.test.js` — 84 tests
- Edit: `routes/index.js` (mount)

**Decisions made:**

- **ONE rejection message for every "email already known" case** — an existing client, therapist or admin account, and a pending application all return the identical 409 body. Chunk 1.2 was built so login never reveals whether an address has an account, and on a mental health platform *"this address belongs to a client"* is the sensitive part. Separate messages would have handed that straight back. **Accepted trade-off, approved 2026-09-02:** this still tells a stranger the address is known to us, but never what kind of record it is. Two tests pin it — one asserts the two replies are byte-identical, one asserts the words "client", "therapist" and "admin" never appear in the message.
- **A fully silent duplicate response was considered and rejected.** The obvious privacy-maximal design is to accept, save nothing, and email the real owner — the pattern chunk 1.5 uses for forgot-password. It does not work here: the status endpoint is keyed by a real application id, so a silent success would have to return a fake id, and that difference leaks anyway.
- **Submitted file URLs must point at our own Cloudinary account.** The form uploads a file in 3.1, gets a URL back, then submits that URL as ordinary text — so nothing stopped someone posting `photoUrl: "https://evil.example/tracker.jpg"`, which the admin portal would then load while reviewing the application. `utils/cloudinaryUrl.js` requires https, the exact host `res.cloudinary.com`, and a path beginning with our own cloud name. It rejects an http URL, another account's cloud, and a lookalike host such as `res.cloudinary.com.evil.example`. Applied to the optional upload fields too.
- **Validation lives in two layers and shares one source of truth.** Zod rejects bad input with a 422 and a per-field message before anything reaches the database; the model (3.1) is the last line of defence for any caller that bypasses a route. Every limit is **imported** — `SPECIALTY_TAGS`, `TREATMENT_ORIENTATIONS`, `MIN_PASSWORD_LENGTH`, `MAX_PASSWORD_BYTES`, `THERAPIST_TYPE_MAX` — never retyped, so the two layers cannot drift apart.
- **A failed email never loses the application.** The record is saved first; both sends run through a wrapper that logs a failure and returns. Losing a complete 34-field application because Resend hiccuped would be far worse than a missing notification, and the admin sees every application in the portal regardless. **This was not a theoretical concern — it fired for real during the live check (see below).**
- **The status endpoint returns only `status`, `submittedAt` and `reviewedAt`.** MongoDB ObjectIds embed a timestamp and a counter, so they are partly guessable; returning a name or an email would hand it to whoever guessed one. A test asserts the response has exactly those three keys and contains no name, address or tag.
- **The id is checked for shape before the query.** Without it, `/not-an-id/status` throws a Mongoose CastError and the global handler reports it as an unknown 500. It now returns a 400.
- **The race is covered by the database, not just the read.** Two simultaneous submissions both pass the "does this email exist" check. The partial unique index from 3.1 lets only one win the write, and the 11000 duplicate-key error is translated into the same 409. A test fires two submissions at once and asserts exactly one 201, one 409, and one stored record.
- **The admin email is a headline, not the full submission.** Name, type, country, specialties, reference. Pasting all 34 fields into an inbox would put an applicant's home address and taxpayer id there for no benefit — the admin portal is where an application is actually reviewed, with the documents attached. Every value is escaped; the name and therapist type are written by an untrusted stranger.
- **The applicant email promises no timeline and no outcome.** No "we reply within 48 hours" — there is no basis for a number, and a missed promise on a professional application reads worse than saying nothing. Same reasoning as the contact page. A test asserts no time period and no "approved" appears in either the HTML or the text version.
- **`CONTACT_TO` carries the admin notification**, rather than adding a second variable pointing at the same inbox. Approved 2026-09-02.
- **Unknown extra fields are dropped, not rejected.** A future form field cannot 422 an entire submission before the backend knows about it.
- **The plaintext password exists only on the request.** The schema is the one place it appears; the service hashes it immediately and the model has no field that could hold it. Tests confirm the stored document contains a real bcrypt hash, that the hash verifies, and that the plaintext appears nowhere in the document or the response.

**Verified:**
- `npm test -- --runInBand` — **381 tests across 13 suites, all passing** (297 from earlier chunks, 84 new).
- `npm run lint` — clean.
- **Mutation-checked twice.** Disabling the Cloudinary URL guard broke **7 tests**. Disabling the duplicate-email pre-check broke **3** — correctly only 3, because the partial unique index still catches the duplicate-*application* case on its own; the case with no index behind it, an existing `users` record, failed exactly as it should. Both restored and the full suite re-run.
- **Live end-to-end against the real server and real MongoDB Atlas — 26 checks, all passing:**
  - A complete 34-field application returned 201 with an id, and no password or hash anywhere in the response.
  - The stored Atlas record: status `pending`, `reviewedAt` null, `submittedAt` set, all three specialty tags verbatim, working hours stored structurally, optional fields defaulted to empty.
  - `passwordHash` was a real bcrypt hash that verified against the actual password, **the plaintext appeared nowhere in the document**, and no `password` field existed on it.
  - A second submission for the same address returned 409 with the unified message.
  - A foreign `photoUrl` returned 422 and stored nothing.
  - The status endpoint returned exactly three keys and leaked no name or address.
  - **The test record was deleted and its absence confirmed.** Nothing was left in the cluster.

**THE EMAIL PATH FAILED FOR REAL — and that is a useful result, not a defect.**

Both emails were attempted during the live run and **both were refused by Resend**:

> *"You can only send testing emails to your own email address. To send emails to other recipients, please verify a domain at resend.com/domains."*

This is **pre-launch blocker 7** (verify `castofmind.com` in Resend) showing up in practice, exactly as that entry predicted. `EMAIL_FROM` is still the shared test sender `onboarding@resend.dev`, which can only deliver to the Resend account owner.

**The application still saved and still returned 201.** The "a failed email never loses the application" design was therefore proven under real conditions rather than only against a mock — which is the single most valuable thing this live run produced. No probe email was delivered to any inbox.

**The two email templates have not been seen rendered.** They are built and unit-tested for content, but nobody has looked at them in a mail client. That needs blocker 7 done first.

**Manual steps for the developer:**
1. **No new environment variables, no new packages.** Everything reuses Resend from 1.5, `CONTACT_TO` from 2.6, and the model and uploads from 3.1.
2. **Verify `castofmind.com` in Resend and change `EMAIL_FROM`** — pre-launch blocker 7, and it now blocks seeing either of these emails. Until it is done, no applicant and no admin can receive anything.
3. **Then re-run one real submission** and check both emails land and read well.

**Carried forward:**
- **Orphaned uploads — now buildable.** 3.1 recorded that a cleanup script could not tell what was orphaned until this endpoint existed to say which URLs are referenced. It exists now: a script can list Cloudinary assets and delete any whose URL appears in no application. Worth doing before launch, since every abandoned half-filled form leaves files behind for ever.
- **Slice 4 still needs signed delivery URLs** for the authenticated certificate and licence documents, using the stored `publicId` fields.

**Pre-launch blockers — unchanged, the list stands at 11.** No placeholder content was created.

**Not done (out of scope, by design):**
- No form UI (chunk 3.3+). No approve or reject (slice 4). No `therapistProfiles` model — it is created on approval and belongs to slice 4.

---

## Chunk 3.3 — Join as a Therapist page + form steps 1 and 2

**Status: Complete.** Nothing skipped. **Not seen rendered** — see "Yours to check".

Built:
- `pages/JoinAsTherapist.jsx` — split-screen frame, replacing the placeholder.
- `components/join/` — `ApplicationForm` (the shell) · `StepRail` · `StepPersonalDetails` · `StepLocationAvailability` · `PhotoUpload` · `LanguagePicker` · `WorkingHoursGrid` · `EligibilityCard` · `WhyPractiseHere` · `JoinIcons`.
- `data/joinContent.js` · `lib/timezones.js` · `lib/validation/therapistApplication.js` · `lib/api/uploadApi.js`.
- Edits: `ui/Input.jsx`, `ui/Textarea.jsx`, `ui/Select.jsx` (ref pass-through), `ui/Button.jsx` (a contrast fix — see below).

**Structure: the page is two modes in one frame.** The left column persuades a qualified clinician to spend twenty minutes; the right column is the tool they spend them in. Warm and open on the left, dense and quick on the right. Most recruitment pages make the form as airy as the pitch, which turns a long application into an endless scroll. Same split-screen frame as `/contact`, so the two public forms read as the same product. **No horizontal band gradients** — depth is radial washes and one elevated card, per the developer's instruction.

**The brief was to stop explaining things in prose and show them instead.** Where that landed:

| Default build | What was built |
|---|---|
| A bulleted list of 5 eligibility rules | A frosted plate, each rule with a drawn icon — it reads as a standard you meet or do not |
| The words "Step 1 of 5" | A 5-node rail whose filled line IS the progress bar, in the same visual language as the How It Works connector |
| 7 rows of checkbox plus two time boxes | **A week you can see** — every enabled day draws its span across a shared 24-hour track, so the shape of the week is checkable at a glance |
| "Upload a photo" | The real headshot in the round frame clients will see it in, with live upload percentage |
| A `<select multiple>` | Chips, plus a free-text field so a therapist working in Pashto is not shut out by my list |
| Four equal "why join us" cards | Four rows threaded on one hairline rail — a list of commitments, not a grid of tiles |

**Decisions made:**

- **React Hook Form + Zod**, per the developer. This was deferred from earlier chunks pending one blocker: none of the UI inputs passed a `ref`, so `register()` could not reach the real element. Fixed by accepting `ref` as a plain prop — **React 19 treats `ref` as an ordinary prop, so no `forwardRef` wrapper was needed**. Purely additive; nothing already using those components changed.
- **One `useForm` holds every field for the whole application.** Steps only change which inputs are *rendered*, so Back and Forward cannot lose data — the values never lived in the step component. Moving forward runs `trigger()` on that step's fields only, so Step 2 can never block Step 1.
- **`register()` for plain inputs, `Controller` only for the three custom controls** (photo, languages, working hours). Controller everywhere would re-render the whole form on every keystroke.
- **Timezones and countries are derived, never typed out.** `Intl.supportedValuesOf('timeZone')` gives **417 zones**, grouped into 10 regions so a native select stays scannable, each option carrying its live UTC offset so the right one is confirmable. Countries come from `Intl.DisplayNames` over ISO 3166 codes — **197 names, no raw codes, no duplicates**. Only the two-letter codes are stored, so spellings cannot go stale.
- **A native `<select>`, not a custom searchable combobox.** A hand-built combobox is one of the easiest components to get wrong for keyboard and screen-reader users. The native control gives type-ahead on desktop and the platform wheel on phones for free. `Select` gained a `children` escape hatch so `<optgroup>` can be passed.
- **Native `<input type="time">`** for the hours. Real picker, keyboard-correct, and its value is always 24-hour `HH:MM` whatever locale it displays in — exactly the format the API stores.
- **The applicant's own timezone is preselected** from `Intl.DateTimeFormat().resolvedOptions()`, and Monday–Friday 09:00–17:00 is prefilled. A blank 7-day grid is a wall of work; a sensible week is an edit.
- **Focus moves to the step heading on every step change.** Without it a screen reader user is left where the old Continue button was, with no signal the panel changed.
- **`noValidate` on the form.** The browser's own bubbles would compete with the inline messages, which say how to fix the problem rather than only naming it.
- **The compensation line states no percentage** — developer's approved wording, "competitive compensation with guaranteed weekly session rates". The 40/60 split is an offline arrangement (§2) and publishing a figure would commit the business publicly. **Worth Asad confirming this wording**, since "guaranteed" is a commitment either way. Flagged in `data/joinContent.js`.
- **Every other claim traces to the spec and is cited inline** in the content file: clients arrive matched (§15), nobody reads your sessions (§11, §8.5), you set your hours and control scheduling (§7.4, §23).
- **A text "Show password" toggle, not an eye glyph** — it states what it will do, and the craft rules ban unicode glyphs standing in for a drawn icon system. Same choice as the login page.
- **`aria-hidden` on the step-rail graphic with a live text status beside it**, so a screen reader gets "Step 2 of 5: Location and availability" rather than five ambiguous circles.

**Contrast computed by hand — the detector is still degraded.** `htmlparser2`, `css-select`, `css-tree` and `domutils` remain absent on this machine, exactly as recorded since chunk 2.1, so its 0 findings is a **degraded 0** and it evaluates no contrast at all. Every pair below came out of a calculator run against the real hex values.

**Two real failures were found and fixed:**

| What | Was | Now |
|---|---|---|
| Step-rail inactive numbers and labels, "Not available", hour ruler, the "to" separator, empty-photo icon | `ink/45` — **2.97:1 FAIL** (and 2.91:1 on mist) | `ink/60` — **4.74:1** pass |
| Working-hours switch, off state | `bg-ink/20` — **1.53:1 FAIL** against the 3:1 floor for a control boundary | `border-ink/50` track at **3.43:1**, with a dark `ink/60` knob at **4.56:1** (a white knob is invisible on a light track) |

**A THIRD failure was found in shipped code, and it is site-wide.** `ui/Button.jsx` set the primary (gold) button's border to `ink/35`, and its comment claimed **"ink/35 measures 3.45:1 against paper"**. It does not — **`ink/35` is 2.24:1**. The recorded figure matches `ink/50` (3.43:1), so chunk 0.4 appears to have computed one value and written down another. This matters because gold on paper is 1.63:1, so that border is the *only* thing giving the primary CTA a findable edge — it has been below the WCAG 1.4.11 floor on **every gold button on the site** since chunk 0.4.

Fixed to `ink/50` and the comment corrected. **This touches a shared primitive outside this chunk and is flagged rather than slipped in** — it was left in place only as long as it took to measure it. The accessibility floor is listed as non-negotiable, so leaving a known failure across every page was not an option.

**Full measured table — everything else clears its floor:**

| Pair | Ratio | | Pair | Ratio |
|---|---|---|---|---|
| paper on ink-deep | 19.67:1 | | ink on paper | 18.06:1 |
| paper/85 on the frosted card | 13.33:1 | | ink/70 on paper | 6.74:1 |
| paper/80 on ink-deep | 12.54:1 | | ink/60 on paper | 4.74:1 |
| paper/70 on ink-deep | 9.65:1 | | ink on mist | 16.25:1 |
| paper/60 on the frosted card | 7.11:1 | | clay error text | 5.48:1 |
| gold icon on ink-deep | 12.06:1 | | ink on gold (button face) | 11.08:1 |
| sage icon on ink-deep | 5.78:1 | | sage on paper (icon, border) | 3.40:1 |
| ink/50 control border | 3.43:1 | | paper knob on sage | 3.40:1 |

Decorative and exempt: `ink/12` hairline 1.28:1, `paper/12` border 1.34:1, `sage/35` icon ring 1.66:1, `ink/8` track 1.2:1.

**Verified:**
- `npm run build` passes.
- `oxlint` — **0 findings** on every file this chunk touched. (The nine pre-existing warnings in `home/Hero.jsx`, `home/Services.jsx` and `about/WhyCardsDeck.jsx` are untouched and not mine.)
- **The validation schema was actually executed, not just compiled — 20 checks, all passing.** A valid application parses and lowercases the email; short, over-72-byte, bad-email, under-18, future-date and bad-title inputs are all rejected; empty and duplicate languages rejected; no-days-enabled rejected; end-before-start rejected **with the message that points at the notes field**; a non-24-hour time rejected; and junk times on a *disabled* day are correctly ignored. This mattered because Zod 4 changed several APIs and a broken schema would only fail at runtime, not at build.
- **The derived lists were executed too:** 417 timezones in 10 regions with live UTC offsets, 197 country names with no raw codes and no duplicates, and the machine's own zone detected correctly.
- Generated CSS confirmed to contain `animate-drift` **and its keyframes** (the exact token that was silently dead in chunk 2.4), `backdrop-blur-md`, the arbitrary blurs, the elevation shadow, the focus glow, and the toggle's knob translation.
- Server suite re-run: **381 tests, 13 suites, all passing** — unchanged by this chunk.

**Yours to check — nothing here has been seen rendered:**
1. **The working-hours week.** Does the sage bar across the 24-hour track actually read as "this is my week", or as decoration? This is the piece the chunk was built around.
2. **The step rail** — does the line filling between nodes read as progress?
3. **The photo upload, end to end.** Choose a real headshot and watch idle → uploading → uploaded. Then try a `.exe` renamed to `.png`; the server rejects it by its real bytes and the message should appear under the frame.
4. **Back and forward between steps 1 and 2**, confirming nothing is lost — the point of the chunk.
5. **360px.** The week grid is the tightest thing on the page; the span bar is hidden below `lg` on purpose.
6. **Reduced motion on** — the step transition and all reveals should be absent, with nothing missing or invisible.
7. **Keyboard through the whole form**, especially the day toggles and the language chips.

**Manual steps for the developer:**
1. **Packages installed** in `/client`: `react-hook-form` (^7.87.0), `@hookform/resolvers` (^5.9.1). Zod was already there. No new environment variables, no external accounts.
2. **Ask Asad to confirm the compensation wording** in `client/src/data/joinContent.js`. It states no percentage, which is deliberate — but "guaranteed weekly session rates" is still a commitment.
3. The photo upload posts to the real `/api/v1/uploads`, so both dev servers need to be running to test it.

**Carried forward:**
- **Draft persistence was deliberately not built.** A 34-field application loses everything on an accidental refresh. The frontend rules permit storing non-sensitive answers and **forbid persisting the password**. Raised in the plan, agreed as a later chunk. Worth doing before the form ships.
- **The client and server schemas mirror each other but cannot share a file** across the split. Both now carry a comment naming the other. This is the one place the two can drift.
- **`client/src/assets/peace.jpg` is still 5.6 MB** and dominates the build output. Flagged in the 2026-09-02 visual pass and still open.

**Pre-launch blockers — unchanged, the list stands at 11.** No placeholder people or invented statistics were created; every claim on this page is spec-sourced or explicitly flagged.

**Not done (out of scope, by design):**
- Steps 3, 4 and 5. Continue is disabled at the end of step 2 and says so.
- No submission — `POST /api/v1/therapist-applications` exists from 3.2 but nothing calls it yet.
- No review screen and no post-submit confirmation screen (§24.7 requires both; they belong with step 5).

---

## Chunk 3.4 — Application form steps 3 and 4

**Status: Complete.** Nothing skipped. **Not seen rendered** — see "Yours to check".

Built:
- `components/join/StepProfessionalBackground.jsx` — step 3, 8 fields (6 mandatory, 2 optional).
- `components/join/StepPracticeSpecialties.jsx` — step 4, 5 fields, all mandatory.
- `components/join/TagPicker.jsx` — one control, two configurations.
- `components/join/CharCounter.jsx`.
- `data/specialtyTags.js` · `data/treatmentOrientations.js` — the mirrored master lists.
- `server/test/constantsParity.test.js` — 37 tests.
- Edits: `lib/validation/therapistApplication.js` (step 3 and 4 schemas), `ApplicationForm.jsx` (wire the steps), `data/joinContent.js` (step intros).

**THE DECISION LEFT OPEN SINCE CHUNK 1.1 IS NOW MADE.** That entry recorded: *"whether it gets them by a duplicated file or a small public endpoint is that chunk's decision, deliberately not pre-empted here."*

**Chosen: a copy in `client/src/data/`, guarded by a parity test.** The lists are client-fixed and will never change, so an endpoint would add a network round trip, a loading state and an error state to every render of step 4 for no benefit. The one real cost of a copy is drift — and drift here is silent and serious: a therapist storing `"anxiety"` or `"Anxiety "` would match no client for ever, with nothing erroring anywhere. Matching would simply return fewer people than it should, and nobody would know why.

So the copy is only acceptable if something proves it is still a copy. `server/test/constantsParity.test.js` does that, and **it deliberately reaches across the client/server boundary** — a server test importing a client file. Unusual, and flagged rather than slipped in: this is a repo-level invariant, not a server one, and the server suite is the only test runner in the project.

**Neither list was typed by hand.** Both client files were generated directly from the server constants, so they are byte-identical by construction rather than by care — including `Alzheimer's` with its apostrophe.

**Decisions made:**

- **The 3–4 limit is shown, not written.** Four slots sit above the tag grid — three labelled "Choice 1/2/3", one labelled "Optional" — and fill in as tags are picked. The rule is legible at a glance instead of being a sentence to parse. The slot row is `aria-hidden`; the live "2 of 4 chosen" line beside it carries the same information for a screen reader.
- **At the ceiling the remaining chips lock rather than erroring.** Unchosen tags go quiet, stop responding, and one line explains why. Hitting a limit and being told afterwards is worse than watching the limit arrive.
- **Specialty tags and treatment orientations are the same component, configured to look unequal — on purpose.** Specialties sit in a sage-bordered panel headed *"This is the only thing that decides who is matched with you"*, with filled chips and the slot row. Orientations get plain outline chips and a line saying they appear on your profile and never affect matching. Two identical chip grids would imply they weigh the same, and §15 is explicit that only one of them does.
- **Counters do not truncate, and there is no `maxLength`.** Pasting a long bio and silently losing the end is worse than seeing `1,340 / 1,200` turn clay and being told to trim. You always know what happened to your text.
- **Counters are `aria-hidden`; the limit is stated once in the helper text.** A count announced on every keystroke is miserable with a screen reader.
- **`yearsExperience` is coerced before its numeric rules run.** A number input hands back a *string*, so without the coercion every value would have failed as "not a number" — a bug that only appears at runtime. Covered by six tests.
- **The two optional step-3 fields are grouped in their own panel** headed "Optional — leave blank if they do not apply", rather than sitting in the flow looking like two more things to fill in.
- **The taxpayer ID carries a plain explanation**, per the approved plan: used only for paying you, never shown to clients, never used in matching, and safe to leave blank. §23 flags the field as sensitive, and asking a stranger for a tax number with no reason given is how a good applicant closes the tab.
- **Disciplinary details are revealed only on "yes"**, and the question carries a line saying a yes does not end the application. Recording the answer honestly matters more than a clean form.
- **A "yes" is still not auto-rejected** — consistent with the model and the server, which record and let the admin decide.
- **`.js` extensions added to the two new data imports** in the validation file. Vite resolves extensionless imports; plain Node does not, and that file needs to load in both so its logic can be executed directly.

**A REAL BUG WAS CAUGHT AND FIXED BEFORE IT SHIPPED.** The first version of the merged `applicationSchema` reached for `stepFourSchema.shape?.specialtyTags` with a fallback of `z.array(z.string())`. But `stepFourSchema` ends in `.superRefine()`, which returns a *wrapped* schema whose `.shape` is `undefined` — so the fallback would have won, and **the merged schema used by `zodResolver` would have silently accepted any strings at all: five tags, zero tags, tags not on the master list.** The step-level check would still have passed, so nothing would have looked wrong.

Fixed by extracting the step-4 fields into a plain shape object that both schemas build from, with the conditional refinement applied to each. **Three tests now specifically pin the merged schema** — it must still reject five tags, still reject an unknown tag, and still require details on "yes".

**Verified:**
- `npm test -- --runInBand` — **418 tests across 14 suites, all passing** (381 from earlier chunks, 37 new).
- `npm run build` and `oxlint` — clean, **0 warnings** on every file this chunk touched.
- **The parity test was mutation-checked.** Changing a single letter's case in the client copy (`"Anxiety"` → `"anxiety"`) broke **2 tests**. Restored and re-run. A one-character drift is caught.
- **The new schema logic was executed, not just compiled — 46 checks, all passing.** Year coercion from string; 1 year rejected and exactly 2 accepted; fractional and 200 rejected; therapist type at exactly 50 and 51; every count boundary on both tag lists (2/3/4/5 and 0/1/5/6); duplicates rejected; a tag outside the list rejected; **a lowercase variant and a trailing-space variant both rejected** — the exact drift the parity test exists to prevent; all 27 tags and all 33 orientations confirmed individually selectable; bio at 1200 and 1201; "yes" with empty and with whitespace-only details both rejected, with the error pointing at the right field.
- Detector — 0 findings, and as since chunk 2.1 **read that as a degraded 0**: `htmlparser2`, `css-select`, `css-tree` and `domutils` are still absent, so it runs on regex and evaluates no contrast at all. The table below is the compensation.

**Contrast computed, and one real failure found and fixed:**

| What | Was | Now |
|---|---|---|
| Locked (unselectable) tag chip | `text-ink/40` — **2.57:1** | `bg-mist text-ink/60` — **4.56:1** |

WCAG exempts disabled controls from contrast, so this was technically compliant — but the whole point of the locked state is that you can still *read* the tag to decide what to give up. Illegible defeats the design. It now reads as inactive through its filled ground rather than through faint text.

**All other new pairs clear their floor:**

| Pair | Ratio | | Pair | Ratio |
|---|---|---|---|---|
| ink on sage/12 (filled slot) | 16.02:1 | | ink on mist/50 (optional box) | 17.21:1 |
| ink on sage/15 (chosen chip) | 15.46:1 | | ink/70 on mist/50 (note) | 6.60:1 |
| paper on ink (quiet chip) | 18.06:1 | | sage-deep on mist/50 | 5.22:1 |
| sage-deep on the sage/6 panel | 5.15:1 | | clay counter (over limit) | 5.48:1 |
| sage-deep icon on sage/12 | 4.86:1 | | ink/60 counter and empty slot | 4.74:1 |

Non-text boundaries: sage chip border 3.40:1 and ink/50 chip border 3.43:1 both clear the 3:1 floor. Decorative and exempt: the sage/40 panel edge 1.53:1, the ink/40 dashed slot outline 2.57:1 (raised from ink/30 for visibility), and the ink/12 group border 1.28:1.

**Yours to check — nothing here has been seen rendered:**
1. **The four slots.** Do they read as "pick 3 to 4" instantly, or as four mysterious boxes? This is the piece the chunk was built around.
2. **Choosing a fourth tag** — do the remaining 23 visibly lock, and is the reason clear?
3. **Does the specialty panel clearly outrank the orientations list?** They must not look like two equal chip grids.
4. **The counters** — type past 50 in therapist type and past 1200 in the bio and confirm nothing is truncated and the number turns red.
5. **Disciplinary "yes"** — the extra field should appear immediately.
6. **360px.** 27 chips and 33 chips wrapping is the tightest layout on the page.
7. Keyboard through the chips, and back and forward across all four steps confirming nothing is lost.

**Manual steps for the developer:**
1. **No new packages, no new environment variables, no external accounts.**
2. **If the master tag list ever changes**, edit `server/constants/` and re-run `npm test` — the parity test will fail until the client copy matches, which is the point.

**A note on your edit to `joinContent.js`:** the compensation line currently reads *"Competitive compensation are guaranteed."* — "compensation" is singular, so it should be "is". Left as written rather than changed, since it is your copy.

**Carried forward, unchanged:**
- Draft persistence still not built. A now 34-field form still loses everything on an accidental refresh.
- The client and server schemas still mirror each other by hand and cannot share a file. **The tag lists are now covered by a test; the validation rules are not.**
- `client/src/assets/peace.jpg` is still 5.6 MB.

**Pre-launch blockers — unchanged, the list stands at 11.**

**Not done (out of scope, by design):**
- Step 5 — malpractice insurance, insurance details, and the three document uploads.
- No review screen, no submission, no confirmation screen. Continue is disabled at the end of step 4 and says so.

---

## Chunk 3.5 — Step 5, review screen, submission

**Status: Complete.** Nothing skipped. **Slice 3 (therapist application) is finished.** The API half was verified live end to end; the browser half is yours.

Built:
- `components/join/StepComplianceDocuments.jsx` — step 5, 5 fields (3 mandatory, 2 optional).
- `components/join/DocumentUpload.jsx` · `YesNoField.jsx` · `ReviewScreen.jsx` · `SubmittedScreen.jsx`.
- `lib/toApplicationPayload.js` · `lib/api/applicationApi.js` · `lib/useApplicationDraft.js`.
- Edits: `lib/validation/therapistApplication.js` (step 5 schema, `TOTAL_STEPS`, the three publicId fields), `ApplicationForm.jsx` (review, submission, error recovery, draft), `data/joinContent.js` (step 5 intro, review and confirmation copy), `lib/api/ApiError.js` (see below).

**THE REAL WORK WAS A TYPE MISMATCH NOBODY HAD NOTICED.** This is the first chunk where the form actually posts, and the two sides disagreed in three places:

| Field | Form holds | API wants |
|---|---|---|
| `disciplinaryActions` | `'yes'` / `'no'` (radio strings) | boolean |
| `malpracticeInsurance` | `'yes'` / `'no'` | boolean |
| `yearsExperience` | string from a number input | number |

Left alone, **every correctly-filled application would have been rejected with a 422.** `lib/toApplicationPayload.js` is the single translation layer, kept free of React so it can be executed directly — 29 checks run against it, because a silent mistake here is invisible until a real applicant hits it.

It also drops stale data the form may still be holding: **`disciplinaryDetails` is not sent when the answer is "no"** (someone who typed an explanation and then changed their mind), and **a disabled working day sends empty times rather than whatever was last typed**, so a leftover value cannot fail the server's format check on a day nobody works.

**Decisions made:**

- **Draft saving, approved 2026-09-03.** `lib/useApplicationDraft.js` writes to `localStorage`, debounced at 500ms. **The password is stripped on write and again on read** — `.claude/rules/frontend.md` permits non-sensitive draft persistence and forbids persisting passwords, and nothing else on this form is a credential. A draft older than 14 days is dropped rather than restored, because fields change between releases and a month-old half-form confuses more than it helps. Every read and write is wrapped in try/catch: `localStorage` throws outright in some private-window modes, and a convenience must never be the reason the form fails to load. The draft is cleared the moment a submission succeeds, and writing stops on the confirmation screen so it cannot be written back after being cleared.
- **A restored draft says so, and says the password is missing.** Silently repopulating 30 fields while one is mysteriously blank is worse than explaining it.
- **`ApiError` now carries `details`.** The server has sent per-field validation paths since chunk 0.2, but the client error wrapper was dropping them — so the planned 422 handling would have quietly done nothing. It now maps each server message back onto its own field and **jumps to the earliest step that has a problem**, rather than showing one generic failure on a five-step form.
- **A 409 carries a way back.** The duplicate-email message is true but useless on the review screen, because the email lives on step 1 — so the alert includes a link that goes there.
- **Submit is disabled while sending.** The rate limiter allows five submissions an hour; a double click would burn two of them.
- **The review screen validates everything, not just one step,** before posting. It is the last place a gap can be caught locally.
- **THE PASSWORD IS NEVER RENDERED ON THE REVIEW SCREEN — not even as dots.** There is nothing to check by looking at masked characters, and drawing it at all would put a credential on screen somewhere shoulder-surfable. It shows "Chosen — you will use it to sign in".
- **The week is reviewed as a week**, not as fourteen time values, so it stays checkable at a glance.
- **`DocumentUpload` is a sibling of `PhotoUpload`, not a generalisation of it.** The affordances genuinely differ: a PDF has no thumbnail, so it needs a file name, a format badge, a size and a real progress bar, where a headshot needs the round preview clients will see. Forcing one component to do both would have made both worse.
- **Each document upload writes two fields.** The URL the applicant submits, and the Cloudinary `publicId` — because chunk 3.1 stores credential documents as *authenticated*, so the plain URL returns nothing and slice 4 must sign a viewing link from the id. The server schema has accepted these three fields since 3.2; the form now actually collects them.
- **`YesNoField` was extracted** because the disciplinary question (step 4) and the insurance question (step 5) are the same control, and two copies would drift.
- **A "no" to insurance is not a dead end.** It says the team will discuss cover before any client is matched — true, and consistent with the model recording rather than judging.
- **The review screen is step 6 in position but not in the rail**, which keeps reading "5 of 5". It is a read-through, not another form to fill.
- **NO TIMELINE ON THE CONFIRMATION SCREEN.** §24.7 asks for "roughly when", and this deliberately does not answer it: no turnaround has been agreed, and a missed promise on a professional application reads worse than none — the same call made for the emails in chunk 3.2. The approved wording says what happens and in what order instead. **If Asad sets a real turnaround it is one line in `submitted.next`.**

**A lint warning was fixed at the root rather than suppressed.** The draft was first read with `useRef(readDraft()).current`, and the React Compiler rule correctly objected to reading a ref during render. Changed to a lazy `useState(readDraft)`, which reads once on mount and is render-safe.

**Verified:**
- `npm run build` and `oxlint` — clean, **0 warnings** on every file this chunk touched.
- Server suite re-run: **418 tests across 14 suites, all passing** — unchanged by this chunk.
- **The payload mapper and step 5 schema were executed, not just compiled — 29 checks, all passing.** Both booleans in both directions, the string-to-number coercion, stale disciplinary text dropped on "no" and kept on "yes", a disabled day's junk times blanked, trimming and lowercasing, empty optional uploads sent as `''` rather than `undefined`, and a field-by-field comparison against the server's contract confirming **every expected key present and no unexpected extras**.
- **LIVE END TO END against the real server, real Cloudinary and real Atlas — 27 checks, all passing.** A real PNG and a real PDF uploaded through the actual upload endpoint, the payload built by **the same mapper the form uses**, then submitted. The stored record confirmed field by field:
  - `disciplinaryActions` stored as **boolean `false`**, `malpracticeInsurance` as **boolean `true`**, `yearsExperience` as **number `9`** — the three mismatches, proven fixed in the database rather than assumed.
  - The stale `disciplinaryDetails` was **not** stored; the disabled day was stored blank, not junk.
  - All three specialty tags and both orientations stored verbatim; the availability note kept.
  - The certificate `publicId` stored, so slice 4 can sign a viewing URL.
  - `passwordHash` is bcrypt, it verifies against the real password, and **the plaintext appears nowhere in the document**.
  - A second identical submission returned **409** with the unified privacy-safe message.
  - **The test record and both Cloudinary assets were deleted, and the collection confirmed empty afterwards.** Nothing was left behind.

**Two process notes worth recording:**
- **An orphan record survived a failed first run** because the script imported `mongoose` from the client directory, where it is not installed. It was found by querying Atlas directly, deleted, and the run repeated on a clean database. Checked rather than assumed.
- **A scripted edit silently did not apply.** A `replace` that was meant to insert an orphan-cleanup block never matched, and reported success anyway. The block was simply absent. **Verify that an edit landed, rather than trusting the exit code** — the first symptom was a confusing 409, not an error.

**Yours to check — the form has not been driven in a browser:**
1. **The whole flow, steps 1 to 5, then review, then submit.** This is the first time it can be done.
2. **Refresh the page halfway through** — the draft should restore, the password field should be empty, and the note should explain why.
3. **Submit twice with the same email** — the second should show the 409 with a working "go back to personal details" link.
4. **Upload a `.exe` renamed to `.pdf`** as a certificate — the server rejects it by its real bytes and the message should appear under that upload.
5. **The review screen** — check every value is right, that the password shows as "Chosen" and never as characters, and that each Edit link lands on the right step.
6. 360px, reduced motion, and keyboard through step 5 and the review.

**Manual steps for the developer:**
1. **No new packages, no new environment variables.**
2. **Verify `castofmind.com` in Resend and change `EMAIL_FROM`** — pre-launch blocker 7. Both application emails still fail with the shared test sender, so **neither you nor an applicant can see them yet**. The application saves regardless, which the live run confirmed again.
3. **Ask Asad for a real review turnaround** if he wants one stated on the confirmation screen.

**Carried forward:**
- The client and server validation rules still mirror each other by hand. The tag lists are covered by a parity test; **the rules are not, and the payload mapper is now a third place that has to agree with both.**
- `client/src/assets/peace.jpg` is still 5.6 MB.

**Pre-launch blockers — unchanged, the list stands at 11.**

**Not done (out of scope, by design):**
- The admin approval side — the applications list, approve and reject, and the two-document transaction that creates the therapist's `users` + `therapistProfiles` records. That is slice 4, and `therapistProfiles` does not exist yet.
- Signed viewing URLs for the authenticated documents (also slice 4, using the publicIds this chunk now stores).

---

## Chunk 3.6 — Form resilience and polish

**Status: Complete.** Nothing skipped. **Slice 3 is closed.** The two checks that need a browser and a keyboard are yours — listed below.

**HALF OF THIS CHUNK WAS ALREADY BUILT IN 3.5, and it is recorded rather than re-billed.** Draft persistence, the loading and disabled states on submit, the upload error states, and focus moving on step change all landed in earlier chunks. This entry covers only what was genuinely missing, plus one bug the review turned up.

Built:
- `components/join/ResumePrompt.jsx` — the resume-or-start-fresh choice.
- `components/join/ErrorSummary.jsx` — the per-step summary with jump links.
- Edits: `ApplicationForm.jsx` (resume flow, summary wiring, live announcer, mobile button order), `DocumentUpload.jsx` and `PhotoUpload.jsx` (retry), `TagPicker.jsx` / `LanguagePicker.jsx` / `WorkingHoursGrid.jsx` (jump anchors, 360px), `ReviewScreen.jsx` (360px), `StepPracticeSpecialties.jsx` (field names).

**A BUG FOUND AND FIXED.** The 3.5 draft note rendered on **every step, forever**, whenever a draft existed — fill three steps and "we kept what you had already filled in" was still sitting there on step 5. It is gone, replaced by the prompt below which shows once and then never again.

**Decisions made:**

- **A saved draft is now OFFERED, never applied silently.** Before, thirty fields repopulated on load with a passive note. Now the form shows a choice first: **Resume my application** or **Start fresh**. Silently restoring someone's half-finished application is presumptuous on a shared computer, and it buried the one thing they need to know — that the password was deliberately not saved. The prompt says that in its own panel, and says how long ago the draft was saved and which step it reached.
- **Draft writing is paused while the choice is open.** Without it, the empty form behind the prompt would overwrite the very draft being offered before the applicant answered.
- **The error summary takes focus when it appears**, which is the WCAG-recommended pattern for a validation summary: a screen reader reads the list immediately, and Tab from there walks the links instead of restarting at the top of the page.
- **`shouldFocus` was turned OFF on the step validation** as a direct consequence. React Hook Form focusing the first bad field and the summary focusing itself would fight, and the summary would lose — the reader would land mid-form with no idea a list existed.
- **The summary flattens nested errors.** Working hours keep their messages one level down (`workingHours.monday`), so a top-level read alone would show nothing for the very step most likely to need the summary.
- **Jump links reach custom controls through `data-field`.** A plain input is found by its `name`, but the tag pickers, the language chips and the working-hours grid have no single named element — each now carries an anchor the summary resolves to, then focuses the first focusable child inside it.
- **Upload retry keeps the `File` object.** A failed upload used to clear everything, so recovering meant finding the document in the file picker again. The common failure here is a flaky connection mid-form, not a wrong file, so **Try again** re-sends what was already chosen. Added to both the photo and document uploads.
- **A live region announces the step, because moving focus does not.** Focus already went to the heading, which announces "Location and availability" — but not *where that is*. An off-screen `aria-live` region now says "Step 2 of 5, location and availability", and "Review your answers before submitting" at the end.
- **On a phone the buttons stack with the primary action on top** (`flex-col-reverse`). After scrolling a long step, Continue should not be the control furthest from the thumb.

**The 360px pass — three specific fixes, not a general tidy:**

| What was wrong at 360px | Fix |
|---|---|
| Working hours: the day label and toggle took a fixed 120px, leaving almost nothing for two time inputs beside it | The label takes the full width and the row wraps below `sm`; time inputs shrink instead of overflowing |
| Specialty slot row: `basis-40` forced two 160px boxes per line, truncating longer tag names | Full width below `sm`, back to two-up from `sm` |
| Review screen: a 180px label gutter on a 360px screen | 160px from `sm`, 180px from `lg`, padding reduced |

**Verified:**
- `npm run build` and `oxlint` — clean, **0 warnings** on every file this chunk touched.
- Server suite: **418 tests across 14 suites, all passing** — untouched, as intended. No field definitions changed, per the chunk's own "Do NOT".
- **The draft module was executed against a faked `localStorage` — 14 checks, all passing.** The one that matters: a draft written with a `password` key (as a rogue or older build might) has it **stripped on read**, while every other field survives. Also covered: corrupt JSON returns null instead of throwing, a wrong version is rejected, a missing `savedAt` is rejected, a 15-day-old draft is dropped while a 13-day-old one is kept, and **a `localStorage` that throws outright — which is what a private window does on some browsers — returns null and does not crash the form.**
- Generated CSS confirmed to contain every new responsive utility (`basis-full`, `sm:basis-40`, `flex-col-reverse`, `sm:w-[120px]`, `grid-cols-[160px_1fr]`).
- Detector — 0 findings, and as since chunk 2.1 **read that as a degraded 0**: the parsing dependencies are still absent, so it evaluates no contrast.

**Contrast: no new pairs.** Everything added reuses values already computed — `clay` on `clay/5` 5.12:1 (error summary), `ink` on `mist` 16.25:1 and `ink/70` on `mist` 6.42:1 (resume panel), and the gold button with its `ink/50` border at 3.43:1.

**YOURS TO CHECK — these two need a browser and a keyboard, and neither has been done:**

**1. The draft round trip.**
Fill steps 1 to 3, then reload the page. You should see the resume prompt, not the form. Choose **Resume** — everything comes back, you land on the step you left, and the password field is **empty**. Then reload again and choose **Start fresh** — everything is gone and you are on step 1.

**2. The whole form on the keyboard only.** Tab, Shift-Tab, Enter, Space, arrow keys. No mouse. The places I expect trouble, in order:
- **The day toggles** (step 2) — Space should flip them, and the focus ring should be visible on the switch, not just the label.
- **The tag chips** (step 4) — Enter and Space should both toggle; check a *locked* chip is skipped rather than focusable-but-dead.
- **The language chips** (step 2) — Enter in the "another language" box must add a chip, **not submit the form**.
- **The file inputs** (steps 1 and 5) — the real input is visually hidden, so confirm Tab reaches the **button** and that it is announced with its label.
- **The error summary** — trigger it by pressing Continue on an empty step, then confirm focus lands on it and Tab walks the links.

**3. 360px**, on the three places named in the table above.

**Manual steps for the developer:**
- **No new packages, no new environment variables, no field changes.**
- **Verify `castofmind.com` in Resend** — still pre-launch blocker 7, still the reason neither application email can be seen.

**Carried forward, unchanged:**
- The client and server validation rules still mirror each other by hand, and the payload mapper is a third place that must agree. Only the tag lists are covered by a test.
- `client/src/assets/peace.jpg` is still 5.6 MB.

**Pre-launch blockers — unchanged, the list stands at 11.**

**Not done (out of scope, by design):**
- No field definitions touched, on the chunk's instruction.
- Slice 4 — the admin portal, the applications list, approve and reject, the two-document transaction, and signed viewing URLs for the authenticated documents.

---

### Developer hero pass — 2026-09-03

Developer replaced both remaining heroes by hand.

**About hero.** The layered three-photograph composition is commented out and replaced by **`WhyCardsDeck.jsx`** — a scroll-driven fanned card deck. The section is now `sm:h-[180vh]` with `sticky top-0`, so the deck animates as the reader scrolls past it. A video experiment (`video-for-about.mp4`) sits commented out alongside.

**How It Works hero.** Rebuilt as a two-column layout: copy plus a "Get started free" CTA on the left, and a new **`HowItWorksPathway.jsx`** on the right — a four-node interactive pathway whose milestone cards expand on click. The previous hero is retained as a commented block at the top of the file.

Reviewed, not modified.

---

### Decision log — admin 2FA will be email OTP, not an authenticator app (2026-09-04, developer)

**Recorded now, built in chunk 10.5.** Admin two-factor authentication (pre-launch blocker 12 below) will be a **6-digit one-time code emailed via Resend to the admin address**, not TOTP in an authenticator app.

**Rationale, as given:** Asad may delegate day-to-day admin work to an assistant or manager. A code sent to the admin mailbox allows shared operational access without requiring Asad's personal phone every time someone signs back in after the 30-minute idle timeout.

**The caveat, raised before the decision was confirmed and recorded here so 10.5 sees both sides.** Master spec §11 already states that the admin's email inbox is the master key, because "Forgot password" sends a reset link there. Putting the second factor in the same inbox means one compromised mailbox yields both the password reset *and* the OTP — so this raises the bar against a **stolen password** but not against a **compromised inbox**, which is the threat §11 names. The developer confirmed the decision on the delegation grounds above, which are real. Worth pairing with, at 10.5 or before:

- a strong, unique password on the admin mailbox with its own 2FA at the mail provider — that is where the real second factor ends up living;
- short OTP expiry (5–10 minutes), single use, stored hashed, and rate limited — the same treatment the reset token already gets in chunk 1.5;
- keeping the admin login address unpublished, which is pre-launch blocker 8's `support@` split.

Implementation notes for 10.5: the OTP reuses `baseTemplate` and the Resend service from chunk 1.5, and `EMAIL_FROM` must be on a verified domain first (blocker 7) or the code cannot be delivered at all.

---

## Chunk 4.1 — Admin layout and route protection

**Status: Complete.** Nothing skipped. **Not seen rendered** — see "Yours to check".

Built — server:
- `routes/admin.routes.js` — everything under `/api/v1/admin`, guarded at router level.
- `controllers/admin.controller.js` · `services/admin.service.js` — `GET /api/v1/admin/session`.
- `middleware/adminActionLog.js` · `constants/admin.js`.
- `routes/admin.test.js` — 17 tests.
- Edit: `routes/index.js` (mount).

Built — client:
- `pages/admin/AdminLayout.jsx` and five section pages (`Dashboard` · `Applications` · `Therapists` · `Clients` · `Bookings`), replacing the single `Admin.jsx` placeholder, which is deleted.
- `components/admin/` — `AdminSidebar` · `AdminTopBar` · `AdminIcons` · `DataTable` · `IdleTimeout` · `AdminSectionPlaceholder` · `AdminNotFound`.
- `lib/useIdleTimer.js` · `lib/api/adminApi.js` · `data/adminNav.js`.
- Edits: `App.jsx` (nested layout route), `lib/authSession.js` (`endSession`), `components/auth/SignOutButton.jsx`, `components/auth/FormAlert.jsx` (a `notice` tone and a `role` prop), `pages/Login.jsx` (the inactivity notice), `pages/Styleguide.jsx` (the DataTable demo).

**THE GUARDS SIT ON THE ROUTER, NOT ON EACH ROUTE.** This is the decision the chunk turns on. `router.use(adminRateLimiter, adminActionLog, requireAuth, requireAdmin)` means every screen slice 4 adds from here inherits protection instead of having to remember it — a new admin route cannot ship unguarded by forgetting a middleware argument. It also means a **mistyped path under the mount is refused before it reaches the 404 handler**, so an outsider cannot map the admin surface by comparing 403s against 404s. Three tests pin exactly that: unknown path → 403 for a client, 401 with no token, and 404 only once you are actually the admin.

The same shape is used on the client: `ProtectedRoute` wraps the **layout**, so all five child routes are covered by one guard. That decides only what renders — the server check is the security.

**Decisions made:**

- **The admin action log goes to the server log, not a collection.** Approved 2026-09-04. §18 asks for IP logging on admin actions, but §20 defers an audit trail as overkill for a single admin and §10 fixes the schema at 14 collections — a 15th here would contradict both. One structured line per request: time, admin id, method, path, status, IP. **Consequence, stated plainly: host logs rotate, so this is accountability, not a permanent audit trail.** If a durable one is wanted, chunk 10.6 (admin polish and audit) is where the chunk plan already puts that work.
- **The log records the path only — never the body, never the query string.** An admin searching a client list would otherwise write that person's name into the server log. Two tests cover it, one firing `?q=` with a name in it and asserting the name never appears.
- **It logs refused attempts too**, because a client token reaching an admin path is exactly the event worth having a record of. Worth knowing: the line is written on response *finish*, by which point `requireAuth` has already run, so a refused attempt **names the account that made it**. Only a request with no valid token at all logs as `anonymous`. My first test asserted the opposite and was wrong; the real behaviour is the more useful one, and both cases are now pinned.
- **`GET /admin/session` re-reads the database.** The guards do no lookup by design (chunk 1.2), so a deactivated or demoted admin keeps a working token for up to 15 more minutes. This endpoint is where that actually bites, and a test proves it by deactivating the admin, confirming 401, then reactivating and confirming 200 — so the status check is the only thing that changed the outcome.
- **The idle timeout is served by the server, not hardcoded in the browser.** §18 sets ~30 minutes; the value now lives in `constants/admin.js` and travels in the session payload, so the spec's number has one home.
- **The idle sign-out is a real `POST /auth/logout`**, which clears `refreshTokenHash` — the session is genuinely revoked, not merely hidden. **The gap, stated rather than glossed: if the tab dies (a closed laptop) no timer fires and the refresh cookie stays valid for its remaining 7 days.** Closing that needs a `lastSeenAt` field on `users`. Developer's decision, 2026-09-04: client timer now, server-side reinforcement carried to **chunk 12.3** alongside the deferred refresh-token reuse detection.
- **The timer compares timestamps on one 1s interval, rather than nesting setTimeouts.** That is the difference that matters for the case people actually hit: a browser may throttle or defer a pending timeout while the machine sleeps, so it can fire late or out of order, while comparing `Date.now()` against the last activity is correct the instant the tab wakes.
- **Activity is shared across tabs** through a plain timestamp in `localStorage`. It is not a credential and never touches the access token, which stays in memory. Every read and write is wrapped in try/catch, because `localStorage` throws outright in some private-window modes and a convenience must never be the reason the portal fails to load.
- **The warning modal's countdown is `aria-hidden`.** A number announced every second is unusable with a screen reader; the dialog description carries the fact once and the digits are there for people watching them.
- **A modal is the right answer here**, which is unusual — the craft rules treat modals as a first-thought smell. It earns it because the session is about to end whatever the admin is doing, and they need the chance to stop it.
- **The sidebar is dark `ink`, and that is not decoration.** Gold on a light surface is 1.63:1 and is banned as text or an indicator, so ink is the **only** place in this portal where the accent can mark the current section at all (gold on ink, 11.08:1). `data-surface="dark"` flips the focus ring to gold there via the rule already in `index.css`.
- **The active nav item is marked by a filled ground and weight as well as the gold icon** — colour alone fails WCAG 1.4.1. It is deliberately *not* a coloured left border, which is the category default the craft rules name.
- **No Fraunces anywhere in the admin chrome.** §24.3 restricts it to display sizes, and a serif over dense table data is the "display font where a label should be" mistake. `Heading size="subsection"` is already Satoshi, so the page titles needed no new token. §24.8's "same typefaces" is satisfied by the palette and Satoshi carrying the brand; nothing requires both faces to appear.
- **No new colour or type tokens.** Everything reuses `text-ui`, `text-caption` and `text-subsection`.
- **`endSession` was extracted into `lib/authSession.js`** so the sign-out button and the idle timeout cannot drift on what signing out means. `SignOutButton` now calls it.
- **The login page explains an inactivity sign-out.** Without it the admin lands there with no idea why and assumes something broke. `FormAlert` gained a `notice` tone and a `role` prop for it — an error the user did not ask to see should interrupt a screen reader (`alert`); a notice that is simply present on load should not (`status`). **This touches a shared primitive outside the chunk and is flagged rather than slipped in.**

**The DataTable is on `/styleguide`, not on an admin screen.** The chunk forbids building a management screen, and demo rows sitting on `/admin/therapists` would read as real data. The styleguide is already where every primitive is exercised and is already on the pre-launch delete list, so the demo goes with it.

It ships five states — loading (**skeleton rows, not a spinner floating in the content area**), populated, empty, no-search-results, and error with a retry. Empty and no-results are deliberately separate: "no results for that search" needs a way to clear the search, while "nothing here yet" needs to say what will appear and when, and showing the first when the truth is the second reads as a broken filter. A real `<table>` with `<th scope="col">`, `aria-sort`, sort controls as buttons inside the header cell, and a polite live region announcing the result count. Below `md` it renders cards instead — a table cannot reflow to 360px without losing the row and column relationships that are the reason to use one, and exactly one of the two layouts is in the DOM so nothing is announced twice.

Client-side sort, search and pagination by default, with a `mode="server"` branch that skips all of it and reports changes through `onQueryChange` — chunk 4.2 switches over without a rewrite, which the "every list endpoint paginates" rule will require.

**Two defects found by reading, before they shipped:**

1. **The public 404 was being reused inside the admin shell.** It renders its own `<main>`, and a document may only have one — nesting it would have broken the landmark a screen reader navigates by. It is also full-viewport-height, and its only exit is the marketing homepage, which is the wrong destination for someone working in the portal. `AdminNotFound` replaces it.
2. **`document.title` was never restored.** Navigating from `/admin` to a public page would have left the tab reading "Dashboard · Cast of Mind admin". Now restored on unmount.

**Two lint findings fixed at the root, not suppressed:**

- `useIdleTimer` seeded a ref with `Date.now()` **during render**, which the React Compiler purity rule correctly flagged — it returns a different answer on every re-render. The ref now starts at 0 and is seeded inside the effect.
- `DataTable` reset the page in its own effect on `[query]`, a synchronous `setState` inside an effect. The reset now rides along inside the debounce's timeout callback, where both changes belong to the same event — the same root fix `useApi` got in chunk 0.6, rather than a disable comment.

**Contrast computed by script — all 23 text and control pairs pass, 0 failures.** No fix was needed this time, which is worth noting because every previous UI chunk found at least one.

| Pair | Ratio | | Pair | Ratio |
|---|---|---|---|---|
| paper label on ink | 18.06:1 | | ink header on mist | 16.25:1 |
| paper label on the active `paper/10` ground | 13.72:1 | | ink cell on paper | 18.06:1 |
| paper/70 idle label on ink | 9.20:1 | | ink/60 sort icon on mist | 4.56:1 |
| gold active icon on ink | 11.08:1 | | ink/70 card label on paper | 6.74:1 |
| gold active icon on the active ground | 8.41:1 | | ink-deep placeholder on mist | 17.69:1 |
| ink h1 on paper | 18.06:1 | | clay error text on `clay/5` | 5.12:1 |
| ink/70 email on paper | 6.74:1 | | ink/50 control border on paper | 3.43:1 |

Decorative and exempt: sidebar divider `paper/12` 1.40:1, table and top-bar borders `ink/12` 1.28:1, skeleton bar `ink/10` 1.23:1.

**Verified:**
- `npm test -- --runInBand` — **435 tests across 15 suites, all passing** (418 from earlier chunks, 17 new).
- `npm run lint` (server) clean; `oxlint` (client) **0 findings** on every file this chunk touched.
- Client build passes, 727 modules.
- **Mutation-checked.** Removing `requireAdmin` from the router — the exact mistake router-level guarding exists to prevent — broke **4 tests**. Restored and the suite re-run.
- Generated CSS confirmed to contain the 248px sidebar grid template, `tabular-nums`, the skeleton pulse under `@media (prefers-reduced-motion:no-preference)`, both `data-surface` focus-ring rules, and the sort-arrow rotation.
- **LIVE against the real running server and real MongoDB Atlas — the full role matrix, which chunk 1.4 could not do.** That entry recorded that only an admin exists in the cluster, so client and therapist paths had never been exercised live. Solved without creating fake users: the guards read the role from the token and do no database lookup, so tokens were signed with the dev `JWT_ACCESS_SECRET` for a client and a therapist against a non-existent id. Results — no token **401**, junk token **401**, therapist token **403**, client token **403**, admin token **200** returning the real admin email with `idleTimeoutMs: 1800000` and `idleWarningMs: 120000`, and an unknown admin path with a client token **403, not 404**. **Nothing was written to the cluster.**
- Detector — 0 findings, and as since chunk 2.1 **read that as a degraded 0**: `htmlparser2`, `css-select`, `css-tree` and `domutils` are still absent (re-checked this chunk, all four still missing), so it runs on regex and evaluates no contrast at all. The table above is the compensation.

**Yours to check — nothing here has been seen rendered:**
1. **The idle timeout end to end.** Easiest way to test it without waiting 28 minutes: temporarily lower `ADMIN_IDLE_TIMEOUT_MS` and `ADMIN_IDLE_WARNING_MS` in `server/constants/admin.js` to, say, 60000 and 30000, restart the server, and sit still. The warning should appear, the countdown should tick, **Stay signed in** should dismiss it, and doing nothing should sign you out and land you on `/login` with the inactivity notice. Put the real values back afterwards.
2. **Two tabs open on `/admin`.** Work in one, leave the other still — neither should sign out, because activity is shared. This is the part most likely to be wrong.
3. **The `[admin]` log lines in your server terminal.** One per admin request, with the path and no query string.
4. **`/styleguide` → "Admin DataTable"** — sort each column (three presses: ascending, descending, cleared), search, page through, and switch between the rows / loading / empty / error buttons.
5. **The sidebar at 360px** — the drawer should trap Tab, Escape should close it, and focus should return to the menu button.
6. **Keyboard through the table** — the sort buttons must show a visible focus ring on the mist header row.
7. **Reduced motion on** — the drawer and modal should appear without sliding, and the skeleton bars should not pulse.

**Manual steps for the developer:**
1. **No new packages, no new environment variables, no external accounts.**
2. Nothing to configure — the admin account already exists in Atlas and the new endpoint uses it as-is.

**Carried forward:**
- **Server-side idle enforcement** (`lastSeenAt` on `users`) to chunk 12.3, with the refresh-token reuse detection already parked there.
- **A durable admin audit trail**, if wanted, to chunk 10.6.
- The client and server validation rules still mirror each other by hand; `client/src/assets/peace.jpg` is still 5.6 MB.

**PRE-LAUNCH BLOCKERS — one added, the list now stands at 12:**
1. **`/styleguide` must be deleted** — development only. **Now also carries the DataTable demo rows.**
2. **LinkedIn URL in `lib/siteConfig.js` is a placeholder** — swap for the real profile.
3. **Legal pages need real content** — Privacy, Terms, Refund.
4. **Favicon still missing** — client to supply.
5. **Footer tagline copy is mine, not the client's.**
6. **Delete `server/routes/dev.routes.js` and its mount** — guard-testing routes.
7. **Verify `castofmind.com` in Resend**, then change `EMAIL_FROM`. Now also blocks the admin 2FA email at chunk 10.5.
8. **Create `support@castofmind.com`** and forward it — printed in every email footer and on `/contact`, and it does not exist yet. Also supply the misconduct escalation phone number, or confirm email-only is the intended launch state.
9. **`client/src/assets/hero.png` has unknown provenance** — referenced by nothing. Delete it or record where it came from.
10. **Replace or remove everything in `client/src/data/homePlaceholders.js`** — invented testimonials and figures attached to photographs of real, identifiable people.
11. **Replace or remove everything in `client/src/data/aboutPlaceholders.js`** — invented team, including two entries carrying clinical credentials.
12. **NEW — admin two-factor authentication does not exist.** §18 calls it effectively non-negotiable for a platform holding mental health data, and it is scheduled for **chunk 10.5**. Until then **the admin account is protected by a password alone**, and per §11 the admin mailbox can reset that password. The method is decided — email OTP via Resend; see the decision entry above, including its caveat.

**Not done (out of scope, by design):**
- No dashboard statistics, no applications list, no therapist, client or booking management. Those are chunks 4.2–4.6, 10.1 and 10.2 — the five sections are honest placeholders naming the chunk that fills them.
- No admin 2FA (chunk 10.5, blocker 12 above).
- No subscription access gate — slice 12.

---

## Chunk 4.2 — Applications review screen

**Status: Complete.** Nothing skipped. **Verified live against the real pending application in Atlas**, including the document stream. The rendered screens are still yours to look at.

Built — server:
- `routes/admin.routes.js` — three routes added under the existing guarded mount.
- `services/adminApplications.service.js` · `controllers/adminApplications.controller.js`
- `validation/adminApplications.schema.js` · `constants/adminApplications.js` · `utils/cloudinaryDelivery.js`
- `routes/adminApplications.test.js` — 32 tests.
- Edit: `middleware/validate.js` — added `validateQuery`.

Built — client:
- `pages/admin/Applications.jsx` — the real list, replacing the 4.1 placeholder.
- `pages/admin/ApplicationDetail.jsx` at `/admin/applications/:id`.
- `components/admin/applications/` — `StatusBadge` · `FieldList` · `SensitiveValue` · `WorkingHoursSummary` · `DocumentPanel`.
- `lib/api/adminApplicationsApi.js`.
- Edits: `App.jsx` (detail route), `components/admin/DataTable.jsx` (two fixes, below), `data/adminNav.js`.

---

### THE FINDING THAT CHANGED THE DESIGN

Chunk 3.1 stored certificates as Cloudinary **`authenticated`** assets and recorded that slice 4 would need to sign a delivery URL for them. Probing the real asset before writing any code showed something that entry did not anticipate:

**The stored `secure_url` is itself a permanent, working credential.** It already carries an embedded signature — `…/image/authenticated/s--Fc3-SV2d--/v…/….pdf` — and fetching it returns the file. Strip the `s--…--` segment and it returns 401. There is no expiry.

So "authenticated" here means "the URL must be signed", not "the holder must be authenticated". The consequence is direct: **if the detail endpoint returned those URLs to the browser, we would be handing out unrevocable access to a stranger's professional credentials**, and the whole streaming design would be theatre.

**What was built instead.** The detail response carries document *metadata* only — which documents exist, and their format. Every stored URL and public id is stripped from the payload. Bytes are served by a separate route that signs a 5-minute URL server-side, fetches it, and pipes it back. Three tests pin this, one of which asserts the string `authenticated` never appears in a detail response.

This also settles the question the plan asked: streaming was chosen over redirecting, and the probe turned that from a preference into a requirement.

---

**Decisions made:**

- **Documents stream through our own API.** Approved 2026-09-04. Nothing leaves our origin, so no Cloudinary URL can leak through history, a referrer header or a screenshot; every view is recorded by the 4.1 admin action log; and access ends with the admin's session. Consistent with Decision A in 3.1 — bytes go through our server so we can see them. The cost is bandwidth through the backend, which is nothing at review volumes.
- **`private_download_url` rather than a plain signed delivery URL**, because it actually expires. It serves as an attachment, which does not matter: we set our own `Content-Disposition: inline` on the response the browser receives.
- **The upstream content type is never echoed unchecked.** It is matched against the four types chunk 3.1 accepts on upload, and anything else becomes `application/octet-stream`. If that path ever served `text/html`, passing the type through would run someone else's markup on our own origin. A test sends `<script>` with a `text/html` header and asserts it comes back as a download, not as HTML.
- **The list projection is narrow.** Name, email, therapist type, country, experience, status, dates. Not the home address, the taxpayer id, the education summary or any document field. The list cannot display them, and shipping an applicant's personal data to a browser that will not show it is exposure for nothing. A test asserts each absent field.
- **The search regex is escaped.** `q` goes into a `$regex`, so unescaped, `.*` returns every applicant and `(a+)+$` is catastrophic backtracking aimed at our own database. Two tests cover it, and disabling the escape breaks both.
- **Full-name search works across two fields.** A term containing a space is matched as first-name-plus-last-name in either order, because "Muhammad Rauf" appears in no single field and would otherwise find nobody.
- **The status counts are computed over ALL applications, not the current filter.** A badge that changed when you clicked a chip would be reporting the chip rather than the work outstanding. They travel in `meta` so the badge and the four chips cost no extra request.
- **The taxpayer id is masked behind a Reveal control.** §23 flags it as sensitive. The admin is trusted with it, but a review screen gets shared and screenshotted — and the 2026-09-04 delegation decision means an assistant may be the one reviewing. The street address is shown in full, because judging licensing jurisdiction needs it on nearly every review.
- **The detail screen is laid out in the applicant's five steps, not in schema order.** The reviewer is checking a story told in a particular sequence; reading it back in that sequence is how a gap becomes obvious.
- **Two eligibility answers are surfaced as a flag strip at the top** — a declared disciplinary action, and no malpractice insurance. Both are §23 eligibility conditions, both are recorded rather than auto-rejected (the 3.1 decision), and both are otherwise buried in steps 4 and 5 of a long page. The strip says explicitly that neither rejects an application on its own.
- **Approve and Reject render disabled for pending applications**, with one line saying what approving will do and which chunk wires it. Visibly deliberate rather than looking broken.
- **`validateQuery` writes to `req.validatedQuery`, not `req.query`.** Express 4 allows reassigning `req.query`; Express 5 makes it a getter and the assignment throws. Writing to a new property means a future upgrade cannot break every route that validates a query string at runtime.

**Two fixes to the DataTable built in 4.1**, both found by using it for the first time:

1. **`onQueryChange` moved into a ref.** It sat in the reporting effect's dependency array, so a parent passing an inline arrow would re-fire it on every one of its own renders. Same pattern `useIdleTimer` already uses for `onTimeout`.
2. **A `resetKey` prop.** A filter owned by the parent has to send the table back to page 1 — page 4 of the previous filter is usually an empty screen that reads as a bug. Implemented as a render-phase state adjustment, React's documented pattern for reacting to a changed prop, because an effect would render twice and flash the old page.

**A wasted request removed.** Changing the status chip while on page 3 fetched page 3 of the new filter, then page 1 a render later when the table reported its reset. The chip now resets the parent's page at the same moment, so both agree and only one request goes out.

**Two lint findings fixed at the root, not suppressed.** Both screens set `loading` and `error` synchronously at the top of their fetch effect, which the React Compiler rule correctly flags. Rewritten so **`loading` is derived**: a `requestKey` string describes the request currently wanted, and loading is simply whether the stored result matches it. Every `setState` now happens in a promise callback. This is the same root fix `useApi` got in chunk 0.6, and it removed a state variable rather than adding one.

**Two test bugs caught and fixed — one of them the dangerous kind:**

1. **A test that passed while proving nothing.** The helper was `get(path, token = tokens[ADMIN])`, so the "no token is refused" case calling `get(path, undefined)` triggered the *default parameter* and sent the admin token — then asserted 401 against a 200. It failed loudly here, but the same shape with a laxer assertion would have sat green forever. Replaced with an explicit `NO_TOKEN` sentinel. This is the second false-passing test the project has caught (chunk 1.3 had one), and both came from a test setting up the wrong thing rather than asserting the wrong thing.
2. **Mongoose silently ignored the fixture timestamps.** `submittedAt` is mapped as the `createdAt` timestamp, and Mongoose refuses to change `createdAt` in an update — so three `updateOne` calls reported success and did nothing, and the newest-first assertion failed against creation order. Fixed by going through the raw collection.

**Contrast computed by script — all 28 new text and control pairs pass, 0 failures.**

| Pair | Ratio | | Pair | Ratio |
|---|---|---|---|---|
| active chip: paper on ink | 18.06:1 | | badge pending: ink on `gold/20` | 16.27:1 |
| active chip count: `paper/75` on ink | 10.45:1 | | badge approved: sage-deep on `sage/15` | 4.69:1 |
| idle chip: ink on paper | 18.06:1 | | badge rejected: clay on `clay/10` | 4.74:1 |
| idle chip count: `ink/70` on paper | 6.74:1 | | flag text: clay on `clay/5` | 5.12:1 |
| idle chip border: `ink/50` on paper | 3.43:1 | | flag note: `ink/70` on `clay/5` | 6.54:1 |
| field term: `ink/70` on paper | 6.74:1 | | hours closed: `ink/60` on paper | 4.74:1 |
| field value: ink-deep on paper | 19.67:1 | | reject button: paper on clay | 5.48:1 |

The two badge tones are the tightest at 4.69:1 and 4.74:1 — both clear 4.5:1, but they have almost no margin and must not be lightened. Decorative and exempt: badge borders 1.29–1.63:1, card borders `ink/12` 1.28:1, the row-link underline `ink/30` 1.96:1.

**Verified:**
- `npm test -- --runInBand` — **467 tests across 16 suites, all passing** (435 from earlier chunks, 32 new).
- `npm run lint` (server) clean; `oxlint` (client) **0 findings** on every file this chunk touched.
- Client build passes, 735 modules.
- **Mutation-checked twice.** Disabling the regex escape broke **2** tests; removing the document-URL stripping from the detail response broke **1**. Both restored and re-run.
- Cloudinary is faked in the suite via `jest.unstable_mockModule`, so no test touches a real account. Fixture URLs are built from the configured cloud name, because `isOwnCloudinaryUrl` pins to it — hardcoding a fake cloud made every document assertion fail for the wrong reason, which is how a test suite ends up asserting its own mock.
- **LIVE against the real running server, real Atlas and real Cloudinary — 20 checks, all passing.** Using the developer's own pending application, and writing nothing:
  - list returns it with `counts {pending:1, approved:0, rejected:0}`, and the payload contains no `taxpayerIdNumber`, `streetAddress`, `passwordHash` or `certificateUrl`;
  - search by first name finds it; searching `.*` returns **0** results, so the escape holds against the real database;
  - detail returns the taxpayer id, **no** `$2b$` hash, and **no** `authenticated` URL anywhere in the body, while keeping the public photo URL;
  - `documents` reports certificate 1 present as `pdf`, the other two absent;
  - the document route returned **200 `application/pdf`, 272,383 real bytes beginning `%PDF`**, with `inline; filename="certificate1.pdf"`, `Cache-Control: private, no-store`, no `Location` header and no Cloudinary string in any header;
  - a missing document 404, an unknown field 400, a malformed id 400, and a therapist token 403.

**A blocker from chunk 3.1 is now RESOLVED.** That entry's manual steps 1 and 2 — granting the Cloudinary key `create` and `read`, and enabling PDF delivery — are done. `cloudinary.api.ping()` succeeds, a real PDF certificate uploaded through the form is stored on the account, and it now delivers through the new route. The live check 3.1 could not complete has effectively completed here.

**Yours to check — the screens have not been seen rendered:**
1. **The detail screen top to bottom** against what you actually submitted — every value in the right step, nothing showing "Not provided" that you filled in.
2. **The document viewer.** Press View on Certificate 1: the PDF should appear inline, and "Open in a new tab" should work afterwards. This is the piece the chunk was built around.
3. **The Reveal control** on the taxpayer id.
4. **The status chips** — counts correct, switching filters does not lose your search, and the empty states read properly for a status with nothing in it.
5. **Search**, including a full name with a space in it.
6. **360px** on the detail screen — the field list is two columns from `sm` and the working-hours table is the tightest part.
7. Keyboard through the chips and the document buttons.

**Manual steps for the developer:**
1. **No new packages, no new environment variables, no external accounts.**
2. Nothing to configure — Cloudinary is already working, which this chunk confirmed.

**Carried forward:**
- Chunk 4.3 approves and rejects: the two-document transaction, the `therapistProfiles` model, and the credentials email. **Blocker 7 (Resend domain) will block that email**, exactly as it blocked the application emails in 3.2.
- Server-side idle enforcement to 12.3; a durable admin audit trail to 10.6 if wanted.
- `client/src/assets/peace.jpg` is still 5.6 MB.

**Pre-launch blockers — unchanged, the list stands at 12.** No placeholder content was created; every value on these screens comes from the real record.

**Not done (out of scope, by design):**
- No approve or reject logic, no `therapistProfiles` model, no two-document transaction, no credentials email. That is chunk 4.3 — the buttons are rendered disabled and say so.
- No dashboard statistics (4.4), no therapist management (4.5), no client or booking screens (10.1, 10.2).

---

## Chunk 4.3 — Approval flow creates therapist account

**Status: Complete.** Nothing skipped. **Verified live end to end**, including logging in as a newly approved therapist with the password from the form — then deleting everything the test created.

Built — server:
- `models/TherapistProfile.js` — the `therapistProfiles` collection per §10.3.
- `models/workingHours.js` — the availability sub-schema and its validator, now shared by both models.
- `services/adminApprovals.service.js` — the transaction.
- `services/email/templates/therapistWelcome.js` · `sendTherapistWelcomeEmail` in `email.service.js`.
- `routes/adminApprovals.test.js` — 22 tests, running against a real replica set.
- Edits: `models/TherapistApplication.js` (`rejectionReason`, shared working hours), `constants/adminApplications.js`, `constants/email.js`, `validation/adminApplications.schema.js`, `controllers/adminApplications.controller.js`, `routes/admin.routes.js`, `test/mongoMemory.js`, and three existing test files (see the ripple below).

Built — client:
- `components/admin/applications/ReviewActions.jsx` — both confirmations.
- Edits: `pages/admin/ApplicationDetail.jsx`, `lib/api/adminApplicationsApi.js`.

---

### A SPEC CONTRADICTION, RESOLVED RATHER THAN GUESSED AT

`docs/04` §9.2 says approval "generates a temporary password, and emails credentials." **That is stale.** §11 and §8.7 both say the therapist sets their own password on the application form, it carries over on approval, and the admin never sees it — "Confirmed by Asad" — and §21 lists it under *Recently Resolved*. The chunk brief agrees explicitly.

Built to §11: **the welcome email contains no password at all.** It says to sign in with the address they applied with and the password they chose, and points at "Forgot password" if they cannot remember it. A live test proves the original password still works after approval.

**The stale §9.2 line is left in the client's document rather than edited**, and recorded here so the next reader does not implement it.

---

### THE TRANSACTION, AND HOW IT WAS ACTUALLY TESTED

Approval performs **three writes in one `session.withTransaction`**: create `users`, create `therapistProfiles`, and move the application to `approved` with `reviewedAt`.

The third belongs inside for a reason worth stating: left outside, a crash between the writes could create a live therapist while the application still read `pending`, and the next admin would approve them a second time.

**A rollback test needs real transactions, and the existing harness could not provide them.** `mongodb-memory-server` was starting a standalone instance, where transactions do not exist — every write simply succeeds, so a rollback test would have passed while proving nothing. `test/mongoMemory.js` gained `startMemoryReplSet`, used by this suite alone because a replica set takes about four seconds to elect and the other sixteen suites do not need one.

**Mutation-checked.** Taking the three writes out of the transaction — leaving the code otherwise identical — broke **2 tests**, both rollback assertions. Restored and re-run.

**Decisions made:**

- **The welcome email is sent AFTER the commit, never inside it.** An email sent inside a transaction that then aborts tells someone they were approved when they were not. A test asserts no email is sent when the transaction rolls back.
- **A failed email does not undo the approval.** The account exists and works; losing it because Resend hiccuped would be far worse than a missing notification. Same reasoning as the application emails in 3.2 — and the live run exercised it for real, since `emailSent` came back `false`.
- **Approving twice is idempotent, not an error.** The second call returns 200 with `alreadyApproved: true` and the original `reviewedAt`, and creates nothing. A plain 409 would show the admin a failure immediately after a success, which reads as though something broke. The UI says "this had already been approved."
- **A rejected application can never be approved.** Developer's decision, 2026-09-04. Approve acts only on a pending record; a rejected one returns 409 and the applicant submits a new application, which §10.4 already allows by retaining rejected records. Keeps the state machine one-directional, and the original rejection is never quietly overwritten.
- **An approved application can never be rejected** — a therapist account exists by then, and deactivating them is chunk 4.5's job, not this one.
- **Rejecting twice does not overwrite the first reason.** A test pins it: the second call is idempotent and the original reason survives.
- **The email clash is checked inside the transaction AND caught at the index.** The pre-check gives a clear 409; the unique index on `users.email` is the actual guarantee, and an 11000 error is translated into the same clean 409 rather than a 500.
- **NO REJECTION EMAIL.** Developer's decision, 2026-09-04. §16's email table lists none, and the wording of a rejection to a qualified clinician is a business decision that belongs to Asad. The reason is stored for the admin's own record. **Open item, recorded plainly: a rejected applicant currently hears nothing at all, ever.** Worth Asad deciding before launch.

**Two SPEC ADDITIONS — approved by the developer, 2026-09-04**, the same footing as the reset-token fields added in chunk 1.5:

| Field | Where | Why |
|---|---|---|
| `rejectionReason` | `therapistApplications` | The chunk brief asks for an optional reason and §10.4 has nowhere to put one. Internal only — nobody is sent it. |
| `applicationId` | `therapistProfiles` | The permanent link back to the application. §10.3 stores the document URLs but not the Cloudinary public ids needed to sign a viewing URL for them, and those live on the retained application. Matching on email instead would break the moment an admin edits a therapist's email, which §9.3 explicitly allows. |

**The working-hours schema is now shared, not copied.** `models/workingHours.js` holds the day sub-schema, the `DAYS` list and the document-level validator, and both models import it. The approval flow builds a profile from an application, so the two shapes must agree exactly — and a duplicated forty-line validator is precisely what drifts once and then silently accepts a week on one model that the other would reject. The application model's 83 tests were re-run immediately after the extraction and all still pass.

**A ripple through three existing test files, and it is the third time this pattern has bitten.** Adding one export to `email.service.js` broke `therapistApplications.test.js`, `contact.test.js` and `auth.reset.test.js` — each mocks that module with a factory listing only the exports that existed when it was written, and an ESM mock factory must provide **every** export or importing `app.js` fails to link. All three failed to run rather than failing an assertion, so no test was silently skipped. Fixed by adding the new export to each factory, with a comment saying why.

Recorded because chunk 1.5 and chunk 2.6 both hit the same shape: **a change to shared infrastructure breaks a test that was mocking it, and the breakage appears somewhere unrelated to the change.** Adding an export to a mocked module is now a known cost.

**Contrast: no new pairs.** Everything added reuses values already computed and recorded — `ink` on `mist` 16.25:1 and `ink/70` on `mist` 6.42:1 (the action panel and the rejection-reason panel), `ink` on `gold` 11.08:1 (Approve), `paper` on `clay` 5.48:1 (Reject), and the existing Modal and Textarea treatments.

**Verified:**
- `npm test -- --runInBand` — **489 tests across 17 suites, all passing** (467 from earlier chunks, 22 new).
- `npm run lint` (server) clean; `oxlint` (client) **0 findings** on every file this chunk touched.
- Client build passes, 736 modules.
- **Mutation-checked**, as above: removing the transaction broke both rollback tests.
- Detector — 0 findings, and as since chunk 2.1 **read that as a degraded 0**.
- Tests cover every case the chunk names and several it does not: both records created, the full field copy including working hours and the note, the application marked approved, **the applicant able to log in with their original password**, a mid-transaction failure leaving zero users and zero profiles with the application still `pending`, no email on rollback, a retry after a rollback succeeding cleanly, approving twice, rejection creating no account, the reason optional and length-capped, rejecting twice not overwriting, an approved application refusing rejection, no password hash in any response, and the role guard on both endpoints.
- **LIVE against the real running server, real Atlas and real Cloudinary — 11 checks, all passing.** A throwaway application was submitted through the real public endpoint with a password chosen for the test, then:
  - approved: `users` created with `role=therapist status=active`, `therapistProfiles` created with the right specialty tags and `status=active`, and `applicationId` linking the two;
  - the stored `passwordHash` was **byte-identical to the application's** — nothing was regenerated;
  - **logging in at `/api/v1/auth/login` with the form password returned 200 and `role: therapist`** — the check the chunk asks for;
  - approving again returned `alreadyApproved: true` with still exactly one user;
  - rejecting the approved application returned 409;
  - `emailSent: false`, because Resend cannot deliver to a test address — which exercised the "a failed email does not undo the approval" path for real.
  - **Everything created was then deleted and the cluster confirmed restored**: 1 user (the admin), 1 application (the developer's own, untouched), 0 profiles.
- **The developer's real pending application was deliberately NOT approved.** That creates a live account for an actual person on the production cluster, and it is the developer's call rather than mine. The flow is proven; approving it is one click.
- No new Cloudinary assets were uploaded — the throwaway application reused the URLs already on the real record, so nothing was created or deleted there.

**Yours to check — the screens have not been seen rendered:**
1. **Approve your real application**, if you are ready to. The confirmation says exactly what will happen; afterwards the status badge should flip to Approved and a toast should report whether the email went out.
2. **The email will NOT arrive** until pre-launch blocker 7 is done — `EMAIL_FROM` is still the Resend test sender, which delivers only to your own Resend account address. If you approve with your own address, you should get it.
3. **The reject dialog** — the optional reason, and that cancelling changes nothing.
4. **Both dialogs on the keyboard**: Escape closes, Tab stays trapped, focus returns to the button that opened it.
5. **360px** on both dialogs.

**Manual steps for the developer:**
1. **No new packages, no new environment variables.**
2. **Verify `castofmind.com` in Resend and change `EMAIL_FROM`** — pre-launch blocker 7. Until then no approved therapist can receive their welcome email, and the approval itself still succeeds regardless, which the live run confirmed.
3. **Decide whether rejected applicants should be emailed.** Nothing is sent today, by decision. If Asad wants a message, the wording is his and it is a small addition.

**Carried forward:**
- The rejection email question above.
- Chunk 4.4 (dashboard statistics) can now count therapists for real — `therapistProfiles` exists.
- Chunk 4.6 will sign viewing URLs for an approved therapist's documents using `applicationId` to reach the public ids.
- Server-side idle enforcement to 12.3; a durable admin audit trail to 10.6 if wanted.

**Pre-launch blockers — unchanged, the list stands at 12.** No placeholder content was created.

**Not done (out of scope, by design):**
- **No manual "add therapist" feature** — deliberately excluded per §9.2, and the chunk's own "Do NOT".
- No therapist portal, no therapist profile editing, no deactivation — chunks 4.5, 4.6 and slice 8.
- No dashboard statistics (4.4).

---

## Chunk 4.4 — Admin dashboard statistics

**Status: Complete.** Nothing skipped. Verified live against the real cluster with `subscriptions`, `sessions` and `reviews` genuinely absent.

Built — server:
- `services/adminStats.service.js` · `constants/adminStats.js`
- `GET /api/v1/admin/stats`, added to the existing guarded router.
- `routes/adminStats.test.js` — 13 tests.
- Edits: `controllers/admin.controller.js`, `routes/admin.routes.js`.

Built — client:
- `pages/admin/Dashboard.jsx` — replaces the 4.1 placeholder.
- `components/admin/dashboard/` — `MoneyBand` · `SignupsTrend` · `StatFigure` · `PendingApplicationsCard` · `QualityPanel`.
- `lib/dashboardFormat.js`.
- Edits: `lib/api/adminApi.js`, plus the four Applications fixes below.

---

### THE DESIGN PROBLEM, AND WHY THE OBVIOUS BUILD IS WRONG

§9.1 asks for roughly twelve figures in four groups. The default build is a 4×3 grid of identical stat cards — and that is the "same-size cards as the page structure" pattern the craft rules name. It gives every figure equal weight, so nothing leads, and the one item that needs *acting on* disappears among the counts.

**Four groups, four deliberately different forms:**

| Group | Form | Why |
|---|---|---|
| Money | A dark `ink-deep` band with one hero figure | Gold and sage cannot carry weight on a light surface (gold on paper is 1.63:1 and is never text), so this is the only ground in the portal where the palette can do its job. It also gives the page one focal point. |
| People | Quiet figures, no borders of their own | The container is the group; a border round each number would be three more rectangles. |
| Pending applications | An action card, gold rule, whole card links | §9.1 calls it "an action item". Rendering it as another number is what makes it vanish. |
| Quality | A rating plus a short feed | Reviews are a feed. A tile would drop the reviews entirely. |

**Exactly one hero figure**, per the house chart rules — MRR, and nothing else competes with it.

**Decisions made:**

- **The hero is Satoshi, not Fraunces.** A serif on a dashboard number reads as decoration, and §24.3 restricts Fraunces to display sizes regardless. **Proportional figures, not `tabular-nums`** — equal-width digits make a number like `121` look loose at 56px. `tabular-nums` stays where numbers align vertically: table rows, the filter counts, axis ticks.
- **`averageRating` is `null` when nothing has been rated, never 0.** Zero would claim every therapist scored the lowest possible mark — a different and damaging statement. The API returns null and the panel renders the absence. A test pins it.
- **The quality panel repeats §9.6's own caveat in the UI** — stars are mandatory and written reviews optional, so most ratings arrive with no context. The caption says to read it as a trend, not a verdict, rather than letting one number look like a judgement on a person.
- **The trend is genuinely live from day one.** It counts new client signups per month from `users`, a collection that already exists — so it is real data now rather than a placeholder waiting for slice 6. Every month is returned including the empty ones; a trend with its zero months dropped is a different shape from the truth.
- **The trend renders as one series, so it has no legend** — a one-swatch legend box only restates the title. 2px sage line, a ~10% wash rather than a solid block, hairline solid gridlines (never dashed), and the current month marked with a gold dot ringed in the surface colour so it reads over the line.
- **Nothing is gated behind hover.** The endpoint value is labelled in the caption, every point has a hover *and* keyboard tooltip with a hit area far larger than the mark, and a visually hidden table carries all twelve exact values for a screen reader.
- **The month label is generated `en-US`, not the `en-GB` used everywhere else for dates.** en-GB abbreviates September as "Sept" — four characters where every other month is three, leaving the axis visibly ragged. Caught in the live run, not by reading.
- **MRR sums each subscription's own `amount`** rather than count × €200. Same number today, still correct if a price ever changes.
- **The pending card's gold rule is not the only signal.** It changes with state, so the same information is also in the number and in the words ("They are waiting for review" / "Nothing waiting for review") — colour alone would fail WCAG 1.4.1.

**How the not-yet-existing collections are read.** `subscriptions`, `sessions`, `reviews`, `bookings` and `clientprofiles` go through the **raw driver** rather than a model, because MongoDB answers 0 and `[]` for a collection that has never been created. Every figure is honest today and starts reporting by itself the moment its slice ships, with no code change.

The names are centralised in one constant with a warning: **they must match what Mongoose will pluralise to**, or the dashboard reports 0 for ever — silently, which is far worse than an error. A test asserts those collections really are absent, so the "returns 0 without crashing" claim is not being made against collections that quietly exist.

**Churn uses `updatedAt`**, because it is the only timestamp cancelled and expired subscriptions share — `cancelledAt` exists but expiry has no stamp of its own. Slice 11 may want a dedicated `endedAt`; the limitation is commented at the query.

---

### THE FOUR APPLICATIONS FIXES

The developer reviewed chunk 4.2 and judged the screens good but short of finished. That was correct, and the diagnosis was specific rather than a matter of taste. Four of the eight problems were fixed here because leaving them would have made the new dashboard inconsistent with the screen beside it:

1. **The top bar said "Applications" while you were reading one application.** The header stopped being useful exactly when you were deepest in. There is now a breadcrumb, and the detail page's own title reads "Review application".
2. **Skeletons flashed on every refetch.** Changing a filter replaced correct data with grey bars and jumped the layout. Skeletons are now the first load only; a refetch holds the previous rows at 60% opacity. This is a named anti-pattern in the house chart rules and the dashboard follows the same rule.
3. **Four heavy outlined filter pills competed with each other**, each carrying a 3.43:1 border. They are now a segmented control on a mist track: only the selected segment carries weight. An unselected segment is identified by its own label, which needs no border — WCAG 1.4.11 does not apply to text.
4. **Even `gap-6` spacing everywhere**, which reads as unconsidered rather than calm. Filter and summary now sit tight together (`gap-3`) with generous separation before the table (`gap-8`).

**Still open, recorded so they are not lost** — a focused pass, not this chunk:
- The application detail page is five identical bordered boxes stacked vertically.
- No hierarchy inside them: the specialty tags, the only field that drives matching, are set exactly like the zip code.

**Contrast computed by script — all 25 new pairs pass, 0 failures.**

| Pair | Ratio | | Pair | Ratio |
|---|---|---|---|---|
| hero paper on ink-deep | 19.67:1 | | sage trend line on the chart ground | 5.37:1 |
| band label `paper/70` on ink-deep | 9.65:1 | | gold end dot on the chart ground | 11.21:1 |
| chart axis `paper/70` on ground | 9.26:1 | | "No ratings yet" `ink/60` on paper | 4.74:1 |
| people figure ink on paper | 18.06:1 | | star `sage-deep` on paper | 5.48:1 |
| activity `ink/70` on mist | 6.42:1 | | segmented idle ink on the mist track | 16.25:1 |

Decorative and exempt: the chart gridline `paper/12` 1.40:1, the pending card's gold rule 1.63:1 (an accent, and its meaning is also carried in words), card and track borders `ink/12` 1.28:1.

**Verified:**
- `npm test -- --runInBand` — **502 tests across 18 suites, all passing** (489 from earlier chunks, 13 new).
- `npm run lint` (server) clean; `oxlint` (client) **0 findings** on every file this chunk touched. The three remaining warnings in `home/Hero.jsx` are the developer's own, open since 2.2.
- Client build passes, 742 modules.
- Detector — 0 findings, and as since chunk 2.1 **read that as a degraded 0**.
- **LIVE against the real running server and Atlas.** `listCollections` confirmed only `users`, `therapistapplications` and `therapistprofiles` exist — so the defensive reads were exercised against genuinely missing collections rather than empty ones. `/admin/stats` returned **200**, every money figure 0, `averageRating: null`, twelve trend buckets ending on the current UTC month, `pendingApplications: 1` (the real application), `totalTherapists: 0`, and a therapist token **403**.
- The zero-state test deletes the fixture client accounts first, so "every figure reads zero" is a real assertion rather than one that tolerates its own seed data.

**Yours to check — nothing has been seen rendered:**
1. **The money band.** Does it read as a considered focal point, or as a dark rectangle? This is the piece the chunk was built around.
2. **The trend at a flat zero** — the line should sit on the baseline and look deliberate, not broken.
3. **Hover and keyboard along the trend**, and that the axis months are evenly spaced now.
4. **The pending applications card** — it should look like the one thing to act on, and it links to the list.
5. **The four fixes on Applications**: the breadcrumb on a detail page, changing filters without a skeleton flash, the segmented control, and the tighter grouping.
6. **360px** — the band collapses to one column and the chart keeps its axis labels.
7. Reduced motion: the skeleton should not pulse, and nothing else moves.

**Manual steps for the developer:**
1. **No new packages, no new environment variables, no new colour or type tokens.**
2. Nothing to configure.

**Carried forward:**
- **OPEN ITEM for slice 6:** §10.6 types `amount` as a Number without saying whether it holds euros or cents. The dashboard formats it as whole euros. It cannot be wrong today because there are no subscriptions, and it would be very wrong later — **check this when slice 6 defines the field.**
- The two remaining Applications defects above.
- Whether rejected applicants should be emailed (chunk 4.3).
- Server-side idle enforcement to 12.3; a durable admin audit trail to 10.6 if wanted.

**Pre-launch blockers — unchanged, the list stands at 12.** No placeholder content was created: every figure on this screen is real, and the ones that read zero are genuinely zero.

**Not done (out of scope, by design):**
- **No charts beyond the one trend**, per the chunk's own "Do NOT" and §9.1's "counts and simple trends".
- No management screens — therapists (4.5), clients (10.1), bookings (10.2) are still placeholders.

---

## Chunk 4.5 — Therapist management screen

**Status: Complete.** Nothing skipped. Both of the chunk's verify steps were run live against the real cluster, and everything the run created was deleted afterwards.

Built — server:
- `services/adminTherapists.service.js` · `controllers/adminTherapists.controller.js`
- `constants/adminTherapists.js` · `validation/adminTherapists.schema.js`
- `utils/search.js` — the shared search helper, extracted from 4.2.
- `services/email/templates/emailChanged.js` · `sendEmailChangedNotices` in `email.service.js`
- `test/emailServiceMock.js` · `test/emailMockParity.test.js` — see below.
- `routes/adminTherapists.test.js` — 31 tests.
- Edits: `routes/admin.routes.js` (five routes), `middleware/adminActionLog.js`, `constants/email.js`, `services/adminApplications.service.js` (now uses the shared search), and five test files rewired onto the shared email mock.

Built — client:
- `pages/admin/Therapists.jsx` and `pages/admin/TherapistDetail.jsx`.
- `components/admin/therapists/` — `TherapistHeader` · `TherapistEditForm` · `TherapistActions`.
- `lib/api/adminTherapistsApi.js`.
- Edits: `App.jsx`, `pages/admin/AdminLayout.jsx` (breadcrumbs are now a table rather than one hardcoded case), `components/ui/Badge.jsx` (a dark-surface tone — see the contrast failure below).

---

### THE LINE THIS CHUNK DOES NOT CROSS

Nothing here reads `messages`, `journals` or `privateNotes`, and no endpoint exists that could. §11 records that an admin conversation viewer was proposed as the safe alternative to plain-text passwords and **the client decided against building it**; misconduct is reported by email and phone and handled off-platform.

A test asserts the detail response contains no such keys, and the live run checked the same thing against a real record. The decision is pinned rather than merely respected today.

**Decisions made:**

- **Deactivation flips BOTH records in one transaction.** `users.status` decides whether they can sign in; `therapistProfiles.status` decides whether matching can still offer them to a client. Flipping only the first produces the worst state available — a therapist clients can still be matched with, who cannot log in to answer them. **Mutation-checked: removing the profile half broke 2 tests.**
- **The edit is a transaction too**, because the email lives on `users` and everything else on the profile. A test proves a rejected email change does not leave a renamed therapist behind.
- **The editable set is a hard allowlist, and anything else is REFUSED rather than dropped.** A bio silently ignored is worse than a bio rejected, because the admin believes it saved. `.strict()` on the schema does this; **mutation-checked: removing it broke 5 tests.** Refused fields include `workingHours`, `photoUrl`, `status` and `taxpayerIdNumber`.
- **What the admin may edit** (developer's decision, 2026-09-04): email, specialty tags, title, first and last name, professional title, credential type, credential initials, licence number. **Education summary and current work situation are deliberately not editable** — correcting a licence number is a different act from rewriting someone's account of their own career.
- **Changing the login email notifies BOTH addresses** (developer's decision, 2026-09-04). Not in §16's table; added as a security notice rather than business copy. The old inbox is the one that can raise an alarm and the one that until now controlled password recovery (§11); without any notice a therapist silently loses the ability to sign in with no way to find out why. Sent after the commit, and a failure never undoes the edit.
- **Password reset calls the SAME `forgotPassword` the public endpoint uses.** One reset path in the codebase, no admin-only shortcut that could drift from it. The admin never sees, sets or chooses a password — a test asserts the response carries none, and another asserts only a *hashed* token is stored.
- **The admin reset endpoint differs from the public one in exactly one way, deliberately.** `/auth/forgot-password` stays silent about deactivated accounts because saying anything leaks whether an address exists. Here the admin already knows the account exists, so it says plainly that no email was sent and why — otherwise they click a button, nothing happens, and they have no idea it was refused.
- **Deactivating a therapist with active clients is allowed**, with the count stated in the confirmation and an explicit note that bookings and subscriptions are untouched and must be cancelled separately (§13 gives the admin that control). Blocking it would mean the one action needed in an urgent case is the one the system refuses.
- **The action log now records WHICH fields an edit changed** — names only, never values. Editing someone's credentials is exactly what §18 wants accountability for, but an email address in a rotating host log is personal data with no reason to be there.
- **The client sends only the fields that actually changed**, so a save does not report an edit of every field.
- **Counts stay defensive**: active clients reads `bookings`, ratings read `reviews`, both through the raw driver, so they read 0 today and switch on when slice 6 and chunk 10.3 land. `averageRating` is `null`, never 0 — same reasoning as the dashboard.

---

### THE MOCK RIPPLE, FIXED AT THE ROOT THIS TIME

Adding one export to `email.service.js` again broke every suite that mocks it — an ESM mock factory must provide **every** export or importing `app.js` fails to link, and the failure appears as four unrelated suites refusing to run with a message about a module none of them test.

**This was the fourth time** (chunks 1.5, 2.6, 4.3, and now). Patching four factories again would have guaranteed a fifth, so:

- `test/emailServiceMock.js` is now the single place that knows the service's exports. Each suite spreads it and overrides only what it needs to observe.
- `test/emailMockParity.test.js` fails **first and clearly**, naming the missing function, if a sender is added without updating the shared mock. It also catches the reverse — a stale entry faking a function that no longer exists, which would let suites pass against something deleted.

**Mutation-checked:** removing an export from the shared mock makes the parity test fail with the missing name, instead of four suites dying with a link error.

---

### A CONTRAST FAILURE FOUND BY MEASURING

`Badge tone="success"` is built for light surfaces — `sage-deep` text on a `sage/15` tint. On the therapist header's dark `ink-deep` band that is dark on dark: **3.05:1, failing the 4.5 floor.** It looked fine in the source and would have looked plausible on screen.

Fixed by adding an `inverse` tone to `Badge` (`bg-paper/10 text-paper border-paper/25`, **15.61:1**) and marking the state with a small dot beside the word. The dot only reinforces — the word carries the state, so nothing depends on colour (WCAG 1.4.1).

**All other pairs pass.** Header text 19.67:1 · header captions 9.65:1 · specialty panel ink-deep on `sage/6` 18.48:1 · panel headings `ink/70` on paper 6.74:1 · list badge success on paper 4.69:1 · sage state dot 4.59:1 · danger button 5.48:1. Decorative: the photo ring `paper/20` 1.77:1, the sage panel edge 1.53:1.

---

### THE UI

Consistent with the dashboard by construction rather than by intention: the therapist header uses the same dark `ink-deep` band with the same ambient sage wash the dashboard uses for its headline, so the admin recognises "this is what the page is about" from the surface alone. The list uses the same segmented control and spacing rhythm as applications.

The detail page is **weighted, not uniform** — the specialty tags lead in their own sage-edged panel because they are the only field on the screen that changes who gets matched with whom; credentials and practice sit side by side beneath; bio, hours and reviews follow. This is the treatment the applications detail page still needs (see below).

`TagPicker` is reused from the application form rather than rebuilt, so the 3–4 limit is enforced the same way in both places and a set that would break matching cannot be saved.

**Verified:**
- `npm test -- --runInBand` — **535 tests across 20 suites, all passing** (502 from earlier chunks, 33 new).
- `npm run lint` (server) clean; `oxlint` (client) **0 findings** on every file this chunk touched. The remaining warnings are the developer's own in `home/Hero.jsx`, `home/Services.jsx` and `about/WhyCardsDeck.jsx`.
- Client build passes, 747 modules. Detector 0 findings (degraded, as always).
- **Mutation-checked three times**: deactivating only the user broke 2 tests; dropping the strict allowlist broke 5; removing an export from the shared email mock made the parity test fail by name.
- **LIVE against the real server and Atlas — 15 checks, all passing.** A throwaway therapist was created through the real pipeline (submit → approve), then:
  - list and search found them, with status counts;
  - the detail carried no conversation data and no hash;
  - **editing specialty tags persisted** — `Trauma and/or Abuse / Grief / Parenting` read back from the database, with `changedFields: ["licenseNumber","specialtyTags"]`;
  - an attempt to edit the bio returned **422**;
  - login worked, then after deactivation **both records read `inactive` and login returned 401 `INVALID_CREDENTIALS`** — the same generic message as any other failure, so nothing confirms the address exists;
  - a reset on the deactivated account was refused with an explanation;
  - reactivating restored login.
  - **Everything created was deleted and the cluster confirmed restored**: 1 user, 1 application (the developer's own, untouched), 0 profiles.

**Yours to check — nothing has been seen rendered:**
1. **The therapist detail page** — does the dark header read as consistent with the dashboard, and do the specialties clearly lead?
2. **The edit form**, especially the TagPicker at the 3–4 ceiling and the helper line that appears when the email is being changed.
3. **The three confirmation dialogs**, and that the reset one makes clear no password can ever be seen.
4. **360px** on the detail page and the dialogs.
5. Keyboard through the edit form and the segmented control.

**Manual steps for the developer:**
1. **No new packages, no new environment variables, no new colour or type tokens.**
2. **Verify `castofmind.com` in Resend** — pre-launch blocker 7. The email-change notices are subject to it like every other email: the change still applies, but neither address would receive anything today.

**Carried forward:**
- **The applications detail page still needs its hierarchy pass** — five identical bordered boxes, with the specialty tags set exactly like the zip code. The therapist detail page built here is the pattern to follow.
- Whether rejected applicants should be emailed (4.3).
- The `amount` unit question for slice 6 (4.4).
- Server-side idle enforcement to 12.3; a durable admin audit trail to 10.6 if wanted.

**Pre-launch blockers — unchanged, the list stands at 12.** No placeholder content was created.

**Not done (out of scope, by design):**
- **No admin conversation viewer of any kind** — deliberately excluded per §11 and the chunk's own "Do NOT".
- No manual "add therapist" — excluded per §9.2.
- No client management (10.1), bookings overview (10.2) or reviews screen beyond the per-therapist list (10.3).

---

## Chunk 4.6 — Therapist profile page

**Status: Complete.** Nothing skipped. **Slice 4 (admin portal) is finished.** The chunk's verify step was run live: logged in as a real approved therapist, edited the bio, and confirmed a specialty-tags change is rejected.

Built — server:
- `services/therapistProfile.service.js` · `controllers/therapistProfile.controller.js`
- `constants/therapistProfile.js` · `validation/therapistProfile.schema.js`
- `routes/therapist.routes.js` — `GET` and `PATCH /api/v1/therapist/profile`.
- `routes/therapistProfile.test.js` — 33 tests.
- Edit: `routes/index.js` (mount).

Built — client:
- `pages/portal/PortalLayout.jsx` · `pages/portal/PortalHome.jsx` · `pages/portal/TherapistProfile.jsx`
- `components/portal/` — `ClientPreviewCard` · `VerifiedPanel` · `ProfileEditor` · `PracticeCounts` · `PortalIcons`
- `lib/api/therapistProfileApi.js`
- Edits: `App.jsx`. `pages/portal/Portal.jsx` (the 1.6 placeholder) is deleted.

---

### THE LOCK

`PATCH /api/v1/therapist/profile` accepts exactly `photoUrl` and `bio`. Every other field is **refused with a 422 naming it**, never silently dropped — a therapist told their save succeeded while the specialty tags that decide their matching quietly stayed put would be worse than an error.

**Mutation-checked: removing `.strict()` from the schema breaks 16 tests.**

The dangerous shape has its own test: a locked field sent *alongside* a legitimate bio change. The whole request is rejected and neither half applies, so a valid edit can never be used as a carrier for an invalid one.

**There is no id in either route.** The therapist comes from the verified access token, so there is no parameter to point at somebody else's record — a test confirms a second therapist hitting the same URL gets their own answer, never the first's.

**THE TWO ALLOWLISTS ARE TESTED AS DISJOINT.** Chunk 4.5 gave the admin eight fields; this chunk gives the therapist two. A field appearing on both would be a field whose value nobody owns, editable by two parties under different rules. The test fails the moment a future chunk hands the same field to both.

**Decisions made:**

- **The response returns only §8.7's display list**, plus the two editable fields and the stats. Deliberately absent: the taxpayer id, the home address, and the credential documents — none are on the display list, and there is no reason to put a tax number back on the wire to render a profile page. A test asserts all three are missing.
- **The photo URL is re-checked against our own Cloudinary account.** A photo is submitted as text after an upload, so nothing stops a therapist posting a link to anywhere — and every client who saw them on the matching page would load it. Same guard the application form uses (3.2).
- **Practice stats are three counts and nothing else.** §8.7 carries an explicit scope warning that charts and trends belong in the admin portal and would duplicate the admin dashboard inside the therapist's own. `bookings` and `sessions` are read through the raw driver, so they read 0 today and switch on when slices 6 and 9 ship.
- **"Clients helped" counts distinct clients, not bookings.** Someone who left and came back is one person helped, not two.
- **No password field anywhere**, per §11 — set once on the application form and recoverable only by reset. The page says so and links to "Forgot password", which is kinder than leaving someone hunting for a control that will never exist.
- **`/therapist/profile` is singular** against the plural-resources convention. That rule governs collections; this is a singleton for the authenticated user, so it does not apply. Noted rather than silently deviated from.
- **`/portal` moved out of the marketing layout** into its own shell. It was rendering a signed-in surface inside the public navbar and footer — the same mistake the admin portal fixed in 4.1. The shell is deliberately minimal: slice 8 replaces the body with the inbox, so a navigation rail built now would be thrown away.

---

### THE VISUAL IDEA

A therapist has two audiences, and the page says so structurally rather than in a paragraph.

**The card at the top is what a client sees** — photo, name, credentials, professional title, specialty tags and bio, rendered as a `paper` card presented on an `ink` stage, captioned *"How you appear to someone choosing a therapist."* That card is also the editing surface. A "bio" field in a form tells a therapist nothing about what it is for; seeing the actual thing a client reads while deciding who to trust makes both editable fields obviously worth care. Show the thing rather than describing it.

**Below it, the locked fields are presented as verification, not restriction.** Each carries a small drawn **shield-and-check** in sage under a *"Verified by Cast of Mind"* heading. A padlock would say "you are shut out"; §8.7's actual reasoning is the opposite — these are the fields a person checked, and that checking is what makes them worth anything to a client. The mark should read as a credential, and the one line of copy explains exactly that.

Consistency with the rest of the product comes from reuse rather than resemblance: the same dark-band language the admin detail pages use (on `ink` rather than `ink-deep`, because §24.8 says the portals run warmer), the same drawn icon set at one stroke weight, `WorkingHoursSummary` and `PhotoUpload` reused outright, and the same spacing rhythm.

**Contrast computed by script — all 20 new pairs pass, 0 failures.** Stage caption `paper/70` on ink 9.20:1 · card name 18.06:1 · specialty chip ink on `sage/15` 15.46:1 · verified panel heading 16.97:1 · shield icon `sage-deep` on `sage/6` 5.15:1 · practice icon on mist 4.93:1 · over-limit counter clay 5.48:1 · password link ink on mist 16.25:1. Decorative: the verified panel edge `sage/40` 1.53:1, card borders `ink/12` 1.28:1.

---

### AN OPEN ITEM THIS CHUNK CREATES

**Education summary and current work situation are now editable by nobody.** Chunk 4.5 deliberately excluded them from the admin's allowlist — they are the therapist's own account of their career, and rewriting someone's professional history is a different act from correcting a licence number. This chunk's brief then lists both as read-only for the therapist.

Put together, a typo in either is permanent. Developer's decision, 2026-09-04: **leave them frozen and flag it.** They are a point-in-time record of what was claimed at application, and the application document is retained permanently anyway, so freezing is arguably correct rather than an oversight. **Worth Asad knowing**, because the only route to a correction today is a developer or a direct database edit.

---

**Verified:**
- `npm test -- --runInBand` — **568 tests across 21 suites, all passing** (535 from earlier chunks, 33 new).
- `npm run lint` (server) clean; `oxlint` (client) **0 findings** on every file this chunk touched.
- Client build passes, 755 modules. Detector 0 findings (degraded, as always).
- **Mutation-checked:** dropping `.strict()` broke 16 tests.
- **LIVE against the real server and Atlas — 12 checks, all passing.** A throwaway therapist was created through the real pipeline (submit → approve), then **signed in as that therapist**:
  - read their own profile, with `stats` reading three zeroes;
  - the response carried no taxpayer id, no home address and no hash;
  - **the bio edit saved** and read back from the database;
  - **a specialty-tags change returned 422 and the tags were unchanged** — the chunk's verify step;
  - a locked field sent alongside a valid bio change rejected the whole request, leaving both untouched;
  - a foreign photo URL returned 422;
  - an admin token on the therapist route returned 403.
  - **Everything created was deleted and the baseline confirmed restored.**

**A note on the live run, and a correction to an assumption.** The first attempt crashed: it expected a *pending* application to borrow Cloudinary URLs from, and there was none. The developer had approved their own application through the UI in between — so the cluster now legitimately holds a real therapist (`Muhammad Rauf`, active, with specialty tags edited through the 4.5 admin screen). **Nothing was damaged:** the cleanup only deletes by id and every id was still null. The script was corrected to take its baseline from whatever is actually there rather than assuming, and re-run clean.

**Yours to check — nothing has been seen rendered:**
1. **The client-preview card.** Does seeing your own card make the bio and photo feel worth editing? That is the idea the page is built on.
2. **The verified panel** — does the shield read as "checked", or as "locked out"? The wording and the mark are both trying to land the first.
3. **Editing**: change the bio, watch the counter, save, and confirm the preview card updates.
4. **The photo upload**, including a `.exe` renamed to `.png` — the server rejects it by its real bytes.
5. **360px**, and the whole page with reduced motion.
6. Keyboard through the editor and the top bar.

**Manual steps for the developer:**
1. **No new packages, no new environment variables, no new colour or type tokens.**
2. You can now sign in as `devhussnain28@gmail.com` and see this page against your own real profile.

**Carried forward:**
- **Education summary and current work situation are frozen** — see above.
- **Changing a photo orphans the previous Cloudinary asset.** This joins the orphaned-uploads item already open from 3.1 and 3.2; a cleanup script can now identify unreferenced assets from both applications and profiles.
- The applications detail page still needs its hierarchy pass (4.5).
- Whether rejected applicants should be emailed (4.3); the `amount` unit question for slice 6 (4.4).
- Server-side idle enforcement to 12.3; a durable admin audit trail to 10.6 if wanted.

**Pre-launch blockers — unchanged, the list stands at 12.** No placeholder content was created.

**Not done (out of scope, by design):**
- **No client sidebar and no chat** — slice 8, and the chunk's own "Do NOT". The portal shell is deliberately minimal so that work replaces the body rather than fighting a rail built too early.
- No charts or trends on the practice stats, per §8.7's scope warning.
- The client portal is still a placeholder — slice 7.

---

## Chunk 5.1 — clientProfiles model and questionnaire state

**Status: Complete.** Nothing skipped. **Slice 5 has started.** The model and the state layer were executed and tested; the shell has **not been seen rendered** — see "Yours to check".

Built — server:
- `models/ClientProfile.js` — the `clientProfiles` collection per §10.2.
- `models/fixedListValidator.js` — extracted, see below.
- `constants/clientProfile.js` — types, genders, preferences, relationship statuses, tag counts, age bounds.
- `models/ClientProfile.test.js` — 60 tests.
- Edits: `models/TherapistApplication.js` and `models/TherapistProfile.js` (both now import the shared validator), `test/constantsParity.test.js` (+3 tests).

Built — client:
- `store/questionnaireSlice.js`, registered in `store/index.js`.
- `lib/validation/questionnaire.js` — per-step and per-branch Zod schemas.
- `lib/questionnaireDraft.js` — sessionStorage draft.
- `data/questionnaireSteps.js` · `data/relationshipStatuses.js`.
- `components/questionnaire/QuestionnaireFlow.jsx` · `QuestionnaireProgress.jsx`.
- `pages/Questionnaire.jsx` — replaces the placeholder.

---

### THE SIX DECISIONS, ALL APPROVED 2026-09-05

**1. Concern tags are 1–4 in the database, 3–4 on screen.** The spec disagrees with itself — §10.2's comment says "3-4", §6 says "select 3–4 tags (minimum 1)", the chunk brief says 1–4. The only reading where all three hold is that storage accepts 1 and the screen asks for 3–4. Recorded as **two named constants**, `CONCERN_TAGS_MIN = 1` and `CONCERN_TAGS_ASK_MIN = 3`, rather than one number and a comment. Client-side validation enforces the storage floor deliberately: someone who genuinely has one concern must not hit a gate the spec does not require. A single tag is safe — zero overlap shows every therapist silently (§15), so nobody reaches a dead end.

**2. There is NO `email` field on `clientProfiles`, and that is not an omission.** §6 lists email as a questionnaire question; §10.2 has no field for it because email belongs to `users` — one address, one account, one unique index. The Redux slice carries it to checkout, and it lands on `users` at payment. Two tests assert the stored document has no `email` key, and the model file says why.

**3. Draft persistence is sessionStorage, not localStorage.** The therapist form uses localStorage for 14 days, which is right for a job application and wrong here: the most sensitive thing in this flow is `concernTags` — a list of someone's mental health concerns, beside their name, age and email. localStorage would leave that on a shared or family computer for a fortnight. sessionStorage survives a refresh, which is exactly what the brief asks for, and is gone when the tab closes. A test asserts localStorage is never written to at all.

**4. NO 18+ restriction — developer's decision.** §10.2 sets no minimum age and one was deliberately not invented. Bounds are 1–120 as a sanity check only, applied identically to an individual and to each partner. This differs from the therapist application, which does hold an 18+ floor.

**5. Relationship status is a fixed dropdown**, not free text. **The list is mine, not Asad's** — §10.2 types it as a bare String and names no options. Worth his confirmation before launch; the constants file and the client mirror both say so. It includes "Prefer not to say", and a test pins that: an anxious visitor must not be forced to disclose this to continue.

**6. A dedicated `QuestionnaireProgress` bar**, not a reuse of the join form's `StepRail`. That rail is five fixed labelled nodes; this flow is seven or eight depending on the branch, and labelling every node would crowd a 360px screen with words nobody needs yet.

---

### WHY REDUX HERE, WHEN THE THERAPIST FORM USES ONE `useForm`

Not inconsistency. That form submits from a single page, so React Hook Form owning its state is correct. These answers must **outlive the `/questionnaire` route** — `/matches`, `/therapist/:id` and `/checkout` all read them, and RHF state dies the moment the route unmounts. Redux survives the navigation. That is the whole reason the brief asks for a slice.

**Nothing sensitive is persisted by the store itself.** The access token is still not in Redux (chunk 1.6), no `redux-persist` is registered anywhere, and draft saving is sessionStorage in its own module.

---

### THE BRANCH GUARD

`type: "individual"` must carry `name`/`age`/`gender` and **must not** carry `coupleData`; `type: "couple"` must carry both partners and **must not** carry the individual fields. A document holding both shapes is one where nobody can say which is true, and every screen reading it would have to guess.

The questionnaire deliberately **keeps both branches' answers** while someone switches back and forth — switch to couple, switch back, and the individual answers are still there. `selectActiveAnswers` is the boundary where that stops: it drops the inactive branch before anything is validated or sent. **Mutation-checked: neutering the guard broke 6 tests.**

**A couple is one profile, not two** (§6, confirmed by Asad), so partner data nests rather than becoming a second document. A test asserts one document after creating a couple.

---

### THE VALIDATOR WAS EXTRACTED RATHER THAN COPIED A THIRD TIME

`fixedListValidator` — count, membership, **and no duplicates** — already existed verbatim in both `TherapistApplication` and `TherapistProfile`. `concernTags` needed the same three checks, and a third copy is how a validator drifts once and then silently accepts on one model what another rejects. Now `models/fixedListValidator.js`, imported by all three. Same precedent as `models/workingHours.js` in chunk 4.3.

**This touches two shipped models and is flagged rather than slipped in.** Both models' full suites were re-run immediately after and all still pass. **Mutation-checked: removing the duplicate check broke 3 tests across two suites** — so the shared version is genuinely covered from both sides.

---

### A CONTRAST FAILURE FOUND BY MEASURING, BEFORE IT SHIPPED

The progress bar's fill was `sage` on an `ink/12` track. Computed: **2.66:1** — under the 3:1 floor for a graphic that carries meaning. It looked entirely reasonable in the source.

Fixed with `sage-deep`: **4.28:1 against the track**, 5.48:1 against paper. Note this is `sage-deep` used as a fill rather than as success text, which is a small widening of that token's stated job in §24.2 — the reasoning is identical (plain sage does not carry enough contrast), and it is recorded here rather than done quietly.

**All other pairs pass:** step counter ink on paper 18.06:1 · step label `ink/70` 6.74:1 · placeholder panel `ink` on mist 16.25:1 and `ink/70` on mist 6.42:1 · error text clay on mist 5.12:1 · "Start over" `ink/70` on paper 6.74:1 with an `ink/40` underline · gold Continue button face 11.08:1 with its `ink/50` border at 3.43:1. Decorative and exempt: the `ink/12` track and panel border at 1.28:1.

---

### A BUG CAUGHT BEFORE IT SHIPPED

The save effect ran on mount with the still-empty answers and **overwrote the very draft the restore effect was putting back**. This is the same trap chunk 3.6 fixed on the therapist form ("the empty form behind the prompt would overwrite the draft being offered"), arrived at from a different direction.

Fixed with a `hasAnyAnswer` guard rather than a flag or a timer: an untouched form has nothing worth saving. It also means simply opening `/questionnaire` writes nothing at all, which is the right default when the thing being stored is a list of health concerns. Seven checks cover it.

**Also fixed at the root, not suppressed:** the draft is read with a lazy `useState(readQuestionnaireDraft)` rather than a ref read during render — the exact React Compiler objection chunk 3.5 hit.

---

**Other decisions:**

- **The flow is 7 steps for an individual, 8 for a couple** — each partner gets their own screen, because six name/age/gender fields on one screen is the wall of fields §24.7 rules out. **The total therefore changes from 7 to 8 the moment someone picks "couple"**, which is one change at the one moment it is explicable; hiding the total until they answer is worse for someone deciding whether they have the energy to start.
- **Ages are coerced from strings.** A number input hands back a string, and chunk 3.5 shipped exactly this bug on the therapist form — every correct application was rejected with a 422 until the payload mapper fixed it. Coerced in the schema this time so the mistake cannot be made twice.
- **The collection name is pinned by a test.** Chunk 4.4 reads `clientprofiles` through the raw driver and warns that a name mismatch makes the dashboard report 0 for ever, silently. A test now asserts `ClientProfile.collection.name` equals the string that constant holds.
- **`coupleData` defaults to `undefined`, not `{}`**, so an individual profile genuinely has no couple key rather than an empty object Mongoose invented. Checked against the raw document, not the Mongoose one.
- **`.js` extensions on the slice's imports**, so it loads in plain Node and its reducer logic can be executed directly. Vite resolves either form.
- **The step heading takes focus on each change** but the live region is what says *where* — focus alone announces "Where are you based?" without saying it is step 3 of 7. First render is skipped: taking focus on page load is disorienting.
- **The progress bar is `aria-hidden`.** The same fact is in the text above it and in the live region; three announcements of one fact is worse than one.

**Verified:**
- `npm test -- --runInBand` — **631 tests across 22 suites, all passing** (568 from earlier chunks, 63 new).
- `npm run lint` (server) clean; `oxlint` (client) **0 findings** on every file this chunk touched. The six remaining warnings are the developer's own in `home/Hero.jsx` and `about/WhyCardsDeck.jsx`, open since 2.2.
- Client build passes, 762 modules. `bg-sage-deep` and `flex-col-reverse` confirmed present in the generated CSS.
- **Mutation-checked twice**, as above: the branch guard (6 tests) and the shared duplicate check (3 tests).
- **The validation schemas and step definitions were executed, not just compiled — 44 checks, all passing.** Both branches parse; age coerces from string in both the individual and the partner shapes; an individual payload is rejected by the couple schema and vice versa; every count boundary on concern tags (0/1/4/5); duplicates rejected; a lowercased and a trailing-space variant both rejected — the exact drift the parity test exists to prevent; all 27 tags individually selectable; a later step never blocks an earlier one; nested partner errors key correctly as `partner2.name`; every declared step field exists in `emptyAnswers`.
- **The slice and the draft were executed against a faked storage — 40 checks, all passing.** Switching branch keeps both sets of answers and `selectActiveAnswers` drops the inactive one in both directions; step advance and back clamp at both ends and the ceiling moves with the branch; restore backfills missing keys; reset does not share the frozen `emptyAnswers` object; and on the draft — round trip, **writes to sessionStorage and never to localStorage**, wrong version dropped, a 25-hour-old draft dropped while a 23-hour-old one is kept, corrupt JSON returns null rather than throwing, and **a storage that throws outright, which is what a private window does on some browsers, returns null without crashing the form.**
- Detector — 0 findings, and as since chunk 2.1 **read that as a degraded 0**: `htmlparser2`, `css-select`, `css-tree` and `domutils` are still absent, so it evaluates no contrast at all. The measured table above is the compensation.

**Yours to check — nothing here has been seen rendered:**
1. **The whole flow end to end.** Continue through all seven steps, then Back through them — the placeholder panel names the fields each screen will ask for, so the order and the branching are checkable now.
2. **Pick "couple" on step 1** — the total should go from 7 to 8 and two partner steps should appear after it.
3. **The draft round trip.** Answer a step or two, refresh, and your answers should still be there. Then **close the tab, reopen `/questionnaire`, and they should be gone** — that is the sessionStorage decision working.
4. **The progress bar** — does it read as calm progress, or as a loading bar? It is the one piece of chrome the later chunks inherit.
5. **360px**, and reduced motion on (the step transition should be absent, the bar should jump rather than slide, and nothing should be missing).
6. **Keyboard**: Tab to Continue and Back, confirm the focus ring is visible, and confirm focus lands on the question heading after each step change.

**Manual steps for the developer:**
1. **No new packages, no new environment variables, no external accounts, no new colour or type tokens.**
2. **Ask Asad to confirm the relationship-status list** in `server/constants/clientProfile.js` — it is mine, not his.
3. **If the list ever changes**, edit the server constant and re-run `npm test` — the parity test fails until the client mirror matches, which is the point.

**Carried forward:**
- **The client and server rules still mirror each other by hand.** The tag lists and now the relationship statuses are covered by the parity test; the validation *rules* are not, and slice 6 will add a payload mapper as a third place that has to agree.
- **Nothing writes `clientProfiles` yet** — by design. The payment webhook creates it inside the four-document transaction in slice 6, and the questionnaire holds its answers in the browser until then, because an account must never exist before the money does.
- The `amount` euros-or-cents question for slice 6 (4.4). Whether rejected applicants should be emailed (4.3). Education summary and current work situation are still frozen (4.6). `client/src/assets/peace.jpg` is still 5.6 MB.

**Pre-launch blockers — unchanged, the list stands at 12.** No placeholder content was created: every value on this screen is either a real spec constant or a field label.

**Not done (out of scope, by design):**
- **No question screens** — 5.2 (individual), 5.3 (couple), 5.4 (concerns and gender preference). Each step renders a marked placeholder naming what it will ask for.
- **No matching and no checkout** (5.5, 5.6 and slice 6). The last step's button is disabled and says where the flow will hand over.
- No API endpoint for clientProfiles — there is nothing for one to do until payment exists.

---

## Chunk 5.2 — Questionnaire: individual path

**Status: Complete.** Nothing skipped. **Not seen rendered** — see "Yours to check".

Built:
- `components/questionnaire/QuestionnaireAside.jsx` — the standing panel.
- `components/questionnaire/AnswerEcho.jsx` · `QuestionScreen.jsx` · `ChoiceCards.jsx` · `ChoiceChips.jsx` · `FieldError.jsx` · `QuestionnaireIcons.jsx`.
- `components/questionnaire/steps/` — `StepWhoFor` · `StepAboutYou` · `StepLocation` · `StepRelationship` · `StepContact`.
- `data/questionnaireContent.js` — every word the flow says.
- Edits: `QuestionnaireFlow.jsx` (rewritten around the split frame), `QuestionnaireProgress.jsx` (a `tone` prop), `store/questionnaireSlice.js` (`selectAnswerEcho`), `data/questionnaireSteps.js` (headings moved out).

---

### THE COMPOSITION, AND WHY IT IS NOT A FORM

Five screens of "one question and one box" is a form. §24.7 says this sequence deserves the most design care on the site, so the shape of it had to carry something.

**A split frame — the same one `/contact` and `/join-as-therapist` already use**, so the three form surfaces read as one product rather than three. Left: a sticky `ink-deep` panel with a soft sage radial wash (a glow, never a vertical band gradient). Right: one question on `paper`, with room around it.

**The left panel fills in as you answer.** Name, age, where you are, relationship status — building up as a short list. It is not decoration:

- It makes Back **visibly** safe. This chunk's own verify step is "navigate backwards and forwards, confirm no answer is lost", and the panel is that proof without having to click anything.
- It changes the register from filling a form to someone taking notes while you talk.

**THE PRIVACY RULE BUILT INTO IT, which chunk 5.4 must not break:** the echo **never shows concern tags**, and `selectAnswerEcho` is written so it cannot. That panel stays on screen for the rest of the flow, so anything in it is readable by whoever is sitting near the reader — a list of someone's mental health concerns is not that. The email is left out too (long, wraps badly, and it is confirmed on its own screen). **Four checks pin this**, including one that sets three real concern tags and asserts none of them reach the panel.

---

### NO DROPDOWNS WHERE A QUESTION DESERVES BETTER

| Question | Built as | Why not a select |
|---|---|---|
| Individual or couple | Two large cards, each with a drawn figure | It is the branch question and the first thing anyone sees. The couple card carries the one-account rule (§6) **at the moment it is chosen**, not as a surprise at checkout. |
| Gender (4) | Chips | One tap instead of open-scan-close. |
| Relationship status (8) | Chips, two columns | Seeing "Prefer not to say" **without opening anything** is the point. |
| Country (197) | Native select | The one question where the platform picker genuinely wins — type-ahead on desktop, the wheel on phones. Reuses the therapist form's derived ISO list; no second country list exists. |

Both custom controls are **real radio groups with the input hidden rather than replaced**, so arrow keys, grouping and screen readers behave normally. **Selection is never colour alone** (WCAG 1.4.1) — a drawn check and a border change accompany every fill. The hidden input's own focus ring would be drawn on a clipped 1px box, so the ring is carried by the card or chip via `has-[:focus-visible]`, using the same `--focus-ring` token as everything else.

---

### THE CRAFT FLOOR CHANGED THE PLAN ONCE

The approved plan had an eyebrow above each question ("Where you are" over "Where are you based?"). The craft floor bans that outright — *"no brief earns it back"* — and it was right: the step label already sits in the progress panel, so the eyebrow was a second copy of a label the heading did not need. **Dropped.**

Also applied from it: elevation declared once (the cards carry a border and **no** shadow, so there is no ghost card), card radii at 16px, and the icons drawn rather than glyphs.

---

### COPY — AND ONE CLAIM CORRECTED BEFORE IT SHIPPED

Every screen carries one reassurance line, the device chunk 2.5 established. They are all true and all cited in the content file:

- **Location** — *"Used for your records, and to show session times in your own clock. It never limits which therapists you can see."* §15: country and timezone are never matching filters. This is the reassuring part, and it is worth saying plainly to someone in a small country.
- **Email** — *"This becomes your login if you subscribe. No account is created until a payment succeeds."* §12's golden rule, told to the person it protects.
- **Aside, permanently** — *"Nothing is charged until you choose a therapist and subscribe."*

**The correction:** my first draft of the "about you" line read *"Your therapist sees this. Nobody else does."* **That is false** — §9.4 gives the admin sight of client profiles and questionnaire responses. It now says only *"Your therapist sees this once you are matched."*, which is certain. A test asserts the words "nobody else" and "only your therapist" appear nowhere in the flow's copy.

The gender screen also says *"This is about you. You can state a preference for your therapist later."* — people conflate the two questions, and the preference screen is four steps away.

---

### A PROCESS NOTE: THE FIRST ICON CHECKER LIED

Icon geometry is bounds-checked before shipping, as in chunks 2.5 and 2.6. The first checker reported **4 of 6 icons overflowing the viewBox** — and it was wrong. It was reading arc flags and relative radii inside path data (`a6.75 6.75 0 0 1 13.5 0`) as absolute coordinates.

Replaced with a command-aware parser that tracks the current point and samples curves and arcs through the real endpoint-to-centre conversion. **All six icons fit, stroke included** — the tightest is Place at y 4.00–21.75. Recorded because a checker that produces false failures is worse than none: the obvious next move was to "fix" six correct icons.

---

### CONTRAST — 33 PAIRS COMPUTED, 0 FAILURES

The progress bar's fill **flips token with its ground**, which is the detail I would otherwise have got wrong in one direction or the other:

| Ground | Fill | Against track | Against ground |
|---|---|---|---|
| Light shell | `sage-deep` | 4.28:1 | 5.48:1 |
| Dark aside | `sage` | 4.30:1 | 5.78:1 |

Plain `sage` on the light track is **2.66:1 and fails**; `sage-deep` on the dark ground would be dark on dark. Same bar, two tokens.

Aside: paper 19.67:1 · paper/70 9.65:1 · paper/60 echo term 7.30:1. Question side: heading 18.06:1 · reassurance `ink/70` 6.74:1 · error clay 5.48:1. Cards: title 18.06:1, selected title on `sage/12` 16.02:1, `sage-deep` border and check 5.48:1, `ink/50` rest border 3.43:1. Chips: chosen `ink` on `sage/15` 15.46:1, check 4.69:1. Continue button 11.08:1 on its gold face.

**The tightest pair is the unselected card's sage icon on its mist plate at 3.06:1.** It clears the 3:1 floor with almost nothing to spare — **it must not be lightened**, and that is noted at the component.

Decorative and exempt: aside divider `paper/15` 1.48:1, card and rule borders `ink/12` 1.28:1, icon plate ring `sage/30` 1.37:1.

---

**Other decisions:**

- **Errors clear per field, not all at once.** Correcting your age should not silently wipe the message still sitting under gender.
- **`role="alert"` on the custom-control errors**, so someone who pressed Continue and stayed put is told why. Text inputs keep the existing `Field` error plumbing.
- **The standing panel is desktop-only.** On a phone it would eat a third of the screen, so the answers appear as a compact row under the buttons instead, and the progress bar rides at the top of the panel which stacks above the question.
- **Headings moved out of `questionnaireSteps.js` into `questionnaireContent.js`**, so screen copy has one home rather than being split across a structure file and a content file.
- **Motion is one authored moment plus the step change**: echo items settle in as they are added (400ms), and the screen crossfades at 250ms. Both gated on `useReducedMotion`.

**Verified:**
- `npm test -- --runInBand` (server) — **631 tests across 22 suites, all passing**, unchanged by this chunk.
- `oxlint` — **0 findings** on every file this chunk touched. Client build passes, **775 modules**.
- **All six icons bounds-checked** against the 24×24 viewBox with a real path parser, stroke included.
- **33 contrast pairs computed, 0 failures** (table above).
- **24 new checks executed** on the echo selector and the copy: the privacy rule (concern tags never appear, email never appears), the couple branch never leaking the individual name field, city and country reading as one place — plus copy checks for no urgency language, no invented timeline, no overclaim about who can see the answers, and sentence-case headings.
- The 5.1 checks re-run unchanged: **44** on validation and step definitions, **40** on the slice and draft.
- Generated CSS confirmed to carry `has(:focus-visible)` (5 rules), `bg-sage/12`, `bg-sage/15`, `bg-sage-deep`, `blur(130px)`, the `minmax(320px…)` grid template and `100dvh`.
- Impeccable detector — 0 findings, and **read that as a degraded 0**: `htmlparser2`, `css-select`, `css-tree` and `domutils` were re-checked this chunk and are all still absent, so it evaluates no contrast at all. The computed table is the compensation.

**Yours to check — nothing here has been seen rendered:**
1. **The whole individual path**, forwards then backwards. Nothing should be lost, and the left panel should show it without you having to check.
2. **The two cards on screen 1** — do they read as a considered opening rather than a settings screen? This is the first thing a visitor sees after "Get started".
3. **The sticky aside.** It is `lg:sticky` inside a grid column; sticky in a grid item is the one thing here most likely to behave differently from how I have reasoned about it. Scroll a long screen (relationship status) and confirm the panel stays put.
4. **360px** — the panel stacks above the question, the cards go single-column, and the echo becomes the row under the buttons.
5. **Reduced motion on** — the crossfade and the echo settle should both be absent, with nothing missing.
6. **Keyboard**: arrow keys should move between the two cards and between chips, Tab should reach Continue, and the focus ring should be visible on cards and chips (that ring is carried by the label, not the hidden input — worth a specific look).

**Manual steps for the developer:**
1. **No new packages, no new environment variables, no new colour or type tokens.**
2. **The relationship-status list still wants Asad's confirmation** (carried from 5.1) — it is now visible on screen as eight chips, so it is easier to review.

**Carried forward:**
- **`clientProfiles` has no timezone field** (§10.2), so slices 7 and 9 will have to convert session times using the browser's zone. Fine, but it should be a decision rather than a surprise when the Session Hub is built.
- The client and server validation rules still mirror each other by hand; slice 6 adds a payload mapper as a third place that must agree.
- The `amount` euros-or-cents question for slice 6 (4.4); whether rejected applicants are emailed (4.3); `peace.jpg` still 5.6 MB.

**Pre-launch blockers — unchanged, the list stands at 12.** No placeholder content was created: every word on these screens is spec-true.

**Not done (out of scope, by design):**
- **The couple branch** (5.3) — the two partner screens still render the marked placeholder.
- **Concern tags and therapist gender preference** (5.4) — same. The concerns screen is the emotional core of the flow and deserves its own chunk.
- No matching (5.5), no therapist results (5.6), no checkout.

---

### Chunk 5.2 follow-up - concern tags now shown in the summary panel (2026-09-05, developer)

**A decision from chunk 5.2 is REVERSED.** That entry recorded the answer echo as deliberately
never showing concern tags. The developer's instruction is that the client should see their whole
answer set accumulating on the left, tags included. Done.

**What changed:**
- `selectAnswerEcho` now returns concern tags, therapist gender preference and email as well.
  The preference is read back in the words the screen offered ("A female therapist"), never the
  stored value - `no_preference` is a database string, not something to show a person.
- An echo item now carries either `value` (a string) or `values` (a list) and never both. Tags
  render as small pills in the panel, so four long names wrap instead of running as one paragraph.
- `AnswerEcho` renders the pills; the mobile summary row joins the list with commas. Reading
  `item.value` on a list item would have printed "undefined" on a phone - caught before it shipped.
- The privacy comments in `selectAnswerEcho` and `AnswerEcho` are rewritten. They previously
  instructed chunk 5.4 to keep tags out, which is now the opposite of the decision.

**The trade-off, recorded because it was argued and then overruled rather than missed:** the panel
stays on screen for the rest of the flow, so a list of someone's mental health concerns is visible
to anyone near the reader - on a train, in an open-plan office. The developer weighed that against
the client seeing a complete picture of what they have answered, and chose the complete picture.
**If it is ever revisited, showing a count ("3 chosen") rather than the tags themselves keeps most
of the reassurance without the exposure.**

**Preference and email were added alongside the tags** because the instruction was "all their chosen
answers"; both are trivially removable if only the tags were wanted.

**Verified:** `oxlint` 0 findings; client build passes, 775 modules; **34 echo and copy checks, all
passing** (up from 24 - the four privacy assertions are replaced by eleven covering the fuller
panel, including that no tag is dropped, that four tags fit, that "No preference" reads back
properly, and that the rows appear in flow order). The 5.1 checks re-run unchanged: 44 and 40.
Contrast on the new pill: **paper on `paper/10` over ink-deep is 15.61:1**; the pill against the
panel ground is 1.26:1 and decorative.

**Not verified:** how a four-tag row looks in a 26rem panel at real size. Worth a glance.

---

## Chunk 5.3 — Questionnaire: couple path

**Status: Complete.** Nothing skipped. **Slice 5's questionnaire branches are both built.** Not seen rendered — see "Yours to check".

Built:
- `components/questionnaire/steps/StepPartner.jsx` — one component, used twice.
- `components/questionnaire/PartnerSlots.jsx` — the pair diagram.
- `components/questionnaire/ScopeMarker.jsx` — one-of-you / both-of-you.
- Edits: `QuestionnaireFlow.jsx` (partner wiring, branch-aware copy, nested error clearing), `QuestionScreen.jsx` (a `marker` slot), `data/questionnaireContent.js` (partner screens, couple overrides, pair copy), `store/questionnaireSlice.js` (the echo split).

**No model, schema or step-list changes.** `partnerSchema`, `partnerUpdated`, `selectActiveAnswers` and the 8-step couple list all landed in 5.1 and were already tested; this chunk is screens, copy and wiring.

---

### THE DISTINCTION IS CARRIED BY A MARK, NOT A PARAGRAPH

The chunk asks for a clear visual difference between "about you both" and "about each of you". Every couple-branch screen now carries one small marker under its heading:

| Screen | Mark | Line |
|---|---|---|
| Either partner | one figure | About one of you |
| Location, relationship, concerns, preference, email | two figures | About both of you |

**One figure means one person; two figures mean both.** It reuses the exact icons from the branch cards on screen 1, so the card someone chose at the start becomes the mark they see the whole way through. The individual branch shows no marker at all — there is nothing to distinguish, so nothing is added.

It sits **below** the heading. Above it, it would be an eyebrow, which the craft floor bans outright.

---

### THE ONE-ACCOUNT RULE, DRAWN

`PartnerSlots` puts two seats and a brace above the partner fields: the pair being collected into one account, captioned *"One account for both of you"*.

- On the **first** partner screen the second seat sits empty and reads "Next", so it is obvious another person is coming.
- On the **second**, the first seat is filled with `Marta · 38` and a check — which confirms nothing was lost **and** stops the common mistake of entering the same person twice.

It reuses the slot language from the therapist form's specialty picker (chunk 3.4), so "these positions get filled" means the same thing in both places. `aria-hidden`, because the fields and heading already carry all of it and a screen reader does not need the diagram narrated.

**The rule is stated at three separate moments**, each where it actually bites: the couple card on screen 1 (5.2), the pair diagram on both partner screens, and the email screen — *"One login for both of you — you will both sign in with this address."* That last one is where §6's rule becomes literally true, so it is spelled out rather than left to a card chosen six screens earlier.

**The second partner screen names the first:** *"You have told us about Marta. This is the other of you."* A fallback line covers the case where no name was entered, and a test asserts the fallback carries no leftover `{name}` placeholder.

---

### BRANCH-AWARE COPY WITHOUT DUPLICATE SCREENS

`screens[stepId]` gained an optional `couple` override, and the flow merges it when the branch is couple. Location asks *"Where are you both based?"*; relationship becomes *"How would you describe your relationship?"*; email carries the one-login line. **The components, validation and layout are identical** — both branches converge on the same five shared screens rather than on copies of them, and a test asserts the shared tail of `COUPLE_STEPS` is the *same object references* as the individual path, not a duplicate.

---

### A BUG THIS CHUNK WOULD HAVE INTRODUCED, HANDLED UP FRONT

Partner errors key by their full path (`partner1.name`) because that is what the step schema produces. The existing `handleChange` cleared errors by top-level patch key, so a corrected partner name would have left *"Enter a name."* sitting underneath it — visibly wrong, and only on the couple path.

`handlePartnerChange` maps each changed field back to its full key before clearing. Flagged here because it was foreseeable from the schema shape rather than discovered by clicking.

---

### A CONTRAST FAILURE FOUND BY MEASURING

The filled seat's border was `sage-deep/40` — **1.76:1 against paper**. Raised to full `sage-deep` at **5.48:1**, which also matches the selected choice card from 5.2, so a "this one is chosen/filled" edge now measures the same everywhere.

**All other new pairs pass:** scope marker text and icon 5.48:1 · current seat label `ink/60` 4.74:1 and value 18.06:1 · filled seat label on `sage/12` 4.54:1, value 16.02:1, check 4.86:1 · waiting seat text 4.74:1 · brace caption 5.48:1.

The filled seat's label at **4.54:1 is the tightest pair on the screen** and must not be lightened. Decorative and exempt: the waiting seat's dashed `ink/40` border 2.57:1 and the brace rule `sage/40` 1.53:1 — the seat's state is also carried by its text and its check, never by colour alone.

---

**The sidebar now splits the partners into two rows** (developer's decision, approved before building):

```
First partner     Marta · 38
Second partner    Joris · 41
```

The previous single `Partners — Marta and Joris` row was **throwing the ages away**. Splitting it also makes this chunk's own verify step — "confirm both partners' data is captured correctly" — visible on screen rather than something to check in Redux DevTools.

**Verified:**
- `npm test -- --runInBand` (server) — **631 tests across 22 suites, all passing**, untouched by this chunk.
- `oxlint` — 0 findings on every file this chunk touched. Client build passes, **778 modules**. The nine remaining warnings are the developer's own in `home/Hero.jsx`, `home/Services.jsx` and `about/WhyCardsDeck.jsx`.
- **40 new checks executed against the real reducer, walking the couple path exactly as the UI does.** The verify step itself: both partners captured with all three fields each, the two objects distinct, writing partner 2 leaving partner 1 untouched, and a partial write (age only) preserving the other fields. Plus: the couple payload dropping the individual fields, the whole branch validating, errors keyed by full path, one partner never blocking the other, ages 0 and 121 rejected on partners as on individuals, and **switching branch mid-flow keeping both answer sets intact in both directions**.
- Also covered: the two sidebar rows with ages and in order, a partner with no age yet still showing their name, no partner row before a name exists, every couple override keeping both a heading and a reassurance, both branches keeping the no-account-until-payment fact, and the couple step order converging on the individual path's own step objects.
- Earlier suites re-run: **34** echo and copy, **44** validation, **40** slice and draft — all passing. One stale assertion was updated rather than worked around: it still expected the old joined `Marta and Joris` row.
- Generated CSS confirmed to carry `border-dashed`, `border-sage-deep`, `grid-cols-2` and `mt-0.5`.
- Detector — 0 findings, and **read that as a degraded 0**: the four parsing dependencies are still absent, so it evaluates no contrast. The measured table above is the compensation.

**Yours to check — nothing here has been seen rendered:**
1. **The pair diagram across both partner screens.** Does the empty second seat read as "someone else is coming", and does the filled first seat on screen 3 read as "already done"? This is the piece the chunk was built around.
2. **The scope marker** — is one figure versus two figures legible enough at 16px to carry the distinction, or does it need the words to do more work?
3. **The whole couple path**, forwards and backwards, watching the sidebar fill with both partners.
4. **Switch branch mid-flow**: fill the individual path, go back to screen 1, choose couple, then switch back. Nothing should be lost either way — it is proven in the reducer, but worth seeing.
5. **360px** — the two seats are a 2-column grid and are the tightest new layout.
6. Reduced motion, and keyboard through both partner screens.

**Manual steps for the developer:**
1. **No new packages, no new environment variables, no new colour or type tokens.**
2. The relationship-status list still wants Asad's confirmation (carried from 5.1).

**Carried forward:**
- `clientProfiles` has no timezone field (§10.2), so slices 7 and 9 must convert session times using the browser's zone.
- The client and server validation rules still mirror each other by hand; slice 6 adds a payload mapper as a third place that must agree — **and it will need to nest `partner1`/`partner2` under `coupleData`**, which is the one shape difference between the form state and the API.
- The `amount` euros-or-cents question for slice 6 (4.4); whether rejected applicants are emailed (4.3); `peace.jpg` still 5.6 MB.

**Pre-launch blockers — unchanged, the list stands at 12.** No placeholder content was created.

**Not done (out of scope, by design):**
- **Concern tags and therapist gender preference** (5.4) — still the marked placeholder on both branches. They are shared answers, so the scope marker already reads "About both of you" on those screens for couples.
- No matching (5.5), no therapist results (5.6), no checkout.

---

## Chunk 5.4 — Concern tags, gender preference and review

**Status: Complete.** Nothing skipped. **The questionnaire is now walkable end to end on both branches.** Not seen rendered — see "Yours to check".

Built:
- `data/concernThemes.js` — the 27 tags grouped into five themes, canonical values, plus the search filter.
- `components/questionnaire/ConcernPicker.jsx` — the emotional core.
- `components/questionnaire/SelectionMarks.jsx` · `ReviewScreen.jsx`
- `components/questionnaire/steps/StepConcerns.jsx` · `StepPreference.jsx`
- Edits: `QuestionnaireIcons.jsx` (Cross, Search), `QuestionnaireFlow.jsx` (three screens plus the review path), `store/questionnaireSlice.js` (`atReview`, `selectReviewRows`), `data/questionnaireContent.js`, `server/test/constantsParity.test.js`.

---

### THE REGISTER, WHICH IS THE WHOLE JOB ON THIS SCREEN

§24.7 says this screen deserves the most design care on the site. What that means in practice is that a grid of 27 clinical terms is the failure mode, and three things avoid it:

**Grouping.** Five themes — the same five names the home page uses, so someone who read it meets the same organisation here. The reader scans five things, not twenty-seven.

**Permission not to be sure.** *"You do not have to be certain. Your therapist will help you make sense of it."* The stakes are what make this screen hard, and lowering them is the design.

**Your words gathering.** Chosen concerns collect in a panel at the top under *"What you have named"*. You watch your own answer assemble rather than watching checkboxes tick.

**NO ICONS ON THE THEMES — a deliberate refusal, approved before building.** A pictogram for someone's depression or abuse is where this screen turns twee, and the clinical-cute register is exactly what §24.1 rules out. The visual investment went into the gathering panel and the marks instead, both of which are about *the person's answer* rather than illustrations of suffering.

---

### THE LIMIT, DRAWN RATHER THAN ENFORCED BY REFUSAL

Four marks under the panel heading fill as concerns are chosen. **Deliberately unlabelled**: the therapist form labels its slots "Choice 1 / 2 / 3 / Optional" because that side genuinely requires three, and the same treatment here would tell someone with one concern they had answered wrong.

One status line changes with where they are, so the ceiling is never discovered by being blocked:

| State | Line |
|---|---|
| Nothing or three chosen | Choose up to four. One is enough. |
| One or two chosen | You can add one or two more if others fit. |
| Four chosen | That is four. Remove one to swap it. |

**The floor is one, and Continue stays enabled at one.** 5.1 recorded the screen as "asking for 3–4"; this chunk softens that to an offer, because §6 says "3–4 (minimum 1)" and this chunk's brief says "1–4", and blocking someone who has one thing would be the wrong reading of both.

At the ceiling the remaining tags recede rather than look broken — `bg-mist text-ink/60` at **4.56:1**, because the entire point of the locked state is that you can still *read* the tag to decide what to give up. Same fix chunk 3.4 had to make on the therapist side.

---

### SEARCH, AND THE WORD WE DO NOT HAVE

Search sits above the grouped list — the developer's call, and it earns its place for anyone who already knows their word.

**The case that mattered was the empty one.** Someone will search a term the fixed list does not carry, and **OCD is the obvious one** — it appears in the spec's older prose but was deliberately dropped from the approved 27. A bare "no results" there is a dead end on the one screen where a dead end is least acceptable. It now says we do not have that exact word, that the list is fixed so it will not cover everything, and that they can choose the closest **or describe it in their own words to their therapist** — which is true, and is what the mandatory first message (§7.1) is for.

A test asserts that copy blames nobody: no "invalid", no "error", no "wrong".

---

### THE PREFERENCE SCREEN

Three equal options, no icons, no ordering that implies a right answer. The line that does the work is true and removes the real fear:

> *"Whatever you choose, you will still see every therapist who works with what you named. It changes the order, not who appears."*

That is §15 exactly — a soft sort, never a filter. A test asserts no option is framed as recommended, best or most popular.

---

### THE REVIEW SCREEN

Every answer in one place, each row jumping back to the step that owns it via the `stepJumped` action from 5.1 — **no second set of controls**, so there is one implementation of every question and nothing to keep in step.

**`selectReviewRows` builds from the branch's own step list**, not a hardcoded order, so the couple path reviews two partners and the individual path one person, and neither can drift from the flow actually walked. Unanswered rows say *"Not answered yet"* rather than rendering blank.

**The review is a flag, not a step index.** `atReview` sits beside `stepIndex` rather than letting the index run one past the end, so the progress bar keeps reading "7 of 7" and 5.1's clamping tests keep meaning what they say. Back from the review closes it rather than moving a step; editing, resetting and restoring a draft all clear it. Six checks cover those transitions.

---

### CONTRAST — 24 NEW PAIRS, 0 FAILURES

Gathering panel: heading 16.25:1 · empty state `ink/60` on mist 4.56:1 · status `ink/70` 6.42:1 · at-limit `sage-deep` 4.93:1 · chosen chip 14.06:1 with a 4.27:1 cross. Marks: filled `sage-deep` against the `ink/12` empty mark **3.85:1**, and 4.93:1 against the ground. Search: text 18.06:1, placeholder and magnifier `ink/60` 4.74:1, border 3.43:1. List: theme heading 18.06:1, chips 15.46:1 and 18.06:1, **locked chip 4.56:1**. Review: label 6.74:1, value 19.67:1, pill 15.46:1.

The two tightest are the **locked chip and the panel's empty state, both 4.56:1** — neither may be lightened. Decorative and exempt: the theme rule `sage/40` 1.53:1 and card borders `ink/12` 1.28:1.

---

**Verified:**
- `npm test -- --runInBand` — **636 tests across 22 suites, all passing** (631 before, **5 new parity tests**).
- **The grouping is now covered by the server parity test.** A tag missing from every theme errors nowhere — it simply cannot be chosen, while still driving matching on the therapist side. The test asserts all 27 present exactly once, byte-identical to the canonical list, and **explicitly asserts the home page's reworded prose labels are NOT used here** ("Panic attacks", "ADHD and attention issues") — those are safe only on a page that never sends a tag.
- `oxlint` — 0 findings on every file this chunk touched. Client build passes, **779 modules**.
- **57 new checks executed**: the grouping and its canonical values; search matching case-insensitively and mid-word, keeping group headings, dropping empty groups, and returning nothing for "ocd"; the 1–4 boundaries; all six review-flag transitions; review rows for both branches with correct step indices; and copy checks for register — permission to be uncertain, no clinical command language, no urgency, no invented timeline, no option framed as better.
- Earlier suites re-run: **44 · 40 · 34 · 40**, all passing.
- All eight icons re-bounds-checked against the 24×24 viewBox with the command-aware path parser, including the two new ones.
- Detector — 0 findings, and **read that as a degraded 0**; the four parsing dependencies are still absent, so the measured table is the compensation.

**Yours to check — nothing here has been seen rendered:**
1. **Does the concerns screen feel calm or clinical?** That is the only question that matters on it, and it is the one I cannot answer from here.
2. **The four marks** — do they read as "up to four" rather than "four required"? If they read as a target, they are wrong and should become a plain count.
3. **The ceiling.** Choose four, then confirm the rest recede legibly rather than looking broken, and that the swap line explains it.
4. **Search for "ocd"** — the empty state is the piece I would most like a second opinion on.
5. **The review screen**, and that each Edit lands on the right step with your answer intact.
6. **360px**, reduced motion, and keyboard through the chips (they are toggle buttons with `aria-pressed`, so Space and Enter should both fire and locked chips should be skipped).

**Manual steps for the developer:**
1. **No new packages, no new environment variables, no new colour or type tokens.**
2. The relationship-status list still wants Asad's confirmation (carried from 5.1).

**Carried forward:**
- The brief said "30+ concerns"; the approved list is **27** (§15). Built 27. `CLAUDE.md`, `docs/chunks.md` and the master spec all still say "30+" in places — stale, and worth a pass at some point.
- `clientProfiles` has no timezone field, so slices 7 and 9 must convert session times using the browser's zone.
- Slice 6's payload mapper must nest `partner1`/`partner2` under `coupleData` — the one shape difference between form state and API.
- The `amount` euros-or-cents question (4.4); whether rejected applicants are emailed (4.3); `peace.jpg` still 5.6 MB.

**Pre-launch blockers — unchanged, the list stands at 12.** No placeholder content: every concern on this screen is a real spec constant.

**Not done (out of scope, by design):**
- **No matching logic** (5.5) — the review's "See your matches" is rendered disabled and says where the flow will hand over.
- No therapist results (5.6), no checkout, no submission. Nothing writes `clientProfiles` until the payment webhook in slice 6.

---

## Chunk 5.5 — Matching engine, plus seeded therapists

**Status: Complete.** Nothing skipped. Verified live against the real Atlas cluster with 11 active therapists.

Built:
- `POST /api/v1/matching` — public, rate limited, read-only.
- `services/matching.service.js` · `controllers/matching.controller.js` · `routes/matching.routes.js`
- `validation/matching.schema.js` · `constants/matching.js`
- `routes/matching.test.js` — 61 tests.
- `scripts/seedTherapists.js` + `seedTherapists.data.js`, with `npm run seed:therapists` and `npm run seed:therapists:remove`.
- Edit: `routes/index.js` (mount), `package.json` (two scripts).

---

### THE SEED SCRIPT — ADDED BECAUSE THE DEVELOPER ASKED THE RIGHT QUESTION

Before building, the developer asked how any of this could be checked with **one therapist in the database**. The honest answer was that it could not: every scenario returns that one person, the gender sort is invisible with a single row, and — worst — **a match and the silent fallback look identical**. The rule the whole chunk is built around was the one rule that could not be observed. No chunk anywhere in `docs/chunks.md` planned seed data; only the admin seed from 1.1 exists. It would have fallen through.

**Ten fake therapists**, designed so every scenario is observable: both genders inside every tag cluster (so the sort visibly reorders), differing overlap counts (so best-fit-first is visible), and wildly varied countries and orientations (proving neither filters).

**Two safety properties, both deliberate:**
1. **It refuses to run in production.** A fake therapist on the live site is a real person choosing someone who does not exist, and paying €200 for it.
2. **It only ever touches its own records.** Every seeded account lives on `@seed.castofmind.test` — `.test` is reserved by RFC 2606 and can never be a real address — and the teardown deletes by that suffix alone. Real therapists cannot be caught by it. **Rehearsed:** the teardown removed exactly 10 users and 10 profiles and left the baseline of 2 users and 1 profile untouched, then a re-seed restored them.

Photos are obvious grey placeholders, not portraits of real people. Blocker 11 exists because invented credentials were once attached to real faces; unmistakably fake is the honest choice for throwaway data.

---

### TWO REAL DEFECTS IN MY OWN SCRIPT, FOUND BY RUNNING IT

**1. It created a half-account and then entrenched it.** The first run failed partway (two required fields I had missed), after writing a user but before its profile. The script skipped therapists whose user already existed — so every later run skipped that orphan **for ever**, leaving a user with no profile. That is precisely the half-created state §10 calls a serious failure.

Rewritten to find-or-create **each document independently**, so a re-run repairs the orphan instead of stepping over it. It then did exactly that: `Repaired 1 user(s) left without a profile by an earlier partial run.`

**2. It told the developer to use tags that were not actually free.** The script printed three tags "no therapist carries" so the fallback could be triggered. One of them — **Weight Loss** — is carried by the real therapist already in the cluster. So the documented fallback scenario quietly returned a genuine match of one, and the live check caught it as a failed assertion rather than as a passing test that proved nothing.

Now **computed from the database at run time** rather than asserted from the seed file: it reads every active therapist's tags, subtracts them from the 27, and prints whatever is genuinely free. Correct whoever else is in the database. Today that is `Career Counselling | Speech Anxiety`.

---

### THE THREE RULES, MADE STRUCTURAL RATHER THAN REMEMBERED

**1. Gender preference is a sort, never a filter.** There is **no gender condition in the query at all** — it is a `$sort` key computed in the aggregation, so it cannot accidentally become a filter. Tests assert the *same set* comes back under every preference, reordered only. **Mutation-checked: turning it into a hard filter broke 4 tests.**

**2. The fallback is silent, and the response cannot say otherwise.** The payload is **shape-identical** on both paths — no `fallback`, no `matched`, no message. A future developer cannot build the banner the client rejected, because the API never hands them the fact. A test asserts the key sets match and that the words "fallback", "exact" and "message" appear nowhere. **Mutation-checked: making the fallback return an empty list broke 3 tests.**

Being honest about the limit: a determined frontend could still compare returned `specialtyTags` against what it sent and infer a zero-overlap result. Perfect concealment is impossible while cards show specialties. What is guaranteed is that the API never states it.

The service returns `usedFallback` **for the server only** — the controller writes one anonymous log line (a count, never the tags; therapy content must not reach a log file) and never puts it in the response. Worth having because "how often does nobody match" is a real signal about the roster.

**3. Specialty tags only.** No country, timezone, availability or orientation in the query — and the endpoint **does not even accept those fields**. Unknown keys are stripped, so a future frontend cannot start sending a filter that a future backend then honours. A filter the endpoint cannot receive is one it can never apply.

---

### THE PUBLIC PROJECTION IS AN ALLOWLIST

This endpoint is unauthenticated, so a denylist would leak any field added to `therapistProfiles` later by whoever forgot to update it. `PUBLIC_THERAPIST_FIELDS` names what may leave, and the `$project` is built from it.

**The public id is the PROFILE id, not `userId`** — nothing hands a stranger a key into the `users` collection. A test asserts the two differ.

Absent, each for a reason: email, street address, state, postcode, date of birth, taxpayer id, licence number, licensing status, disciplinary answers, insurance answers, certificate URLs, `applicationId`, `status`, education summary, current work situation, working hours. `city` is included where `streetAddress` is not — a city is professional context, a street address is where someone lives. **23 tests assert each absent field by name**, plus one that no secret *value* appears anywhere in the payload.

---

**Other decisions:**

- **POST for a read, deliberately.** Concern tags in a query string land in access logs, browser history and `Referer` headers — that is someone's mental health data in three places it must not be. The body keeps it out of all of them.
- **Ranking: preferred gender, then overlap count, then `_id`.** Overlap is still tags-only, just degree of fit; the `_id` tiebreak means a refresh does not reshuffle the list. Approved 2026-09-07. **A therapist matching three concerns still sits below a preferred-gender therapist matching one** — the spec says preferred gender sorts to the top, and a test pins that reading.
- **Paging never excludes anyone.** The backend rule says every list paginates; §15 says return everyone. They reconcile as paging, not filtering — tests assert the total is unchanged across pages and that every therapist appears exactly once across them.
- **Active therapists only, read from the profile's status.** Chunk 4.5 flips the user and the profile in one transaction, so the profile is the documented source. Noted: if those two ever drift, this engine trusts the profile.

**Verified:**
- `npm test -- --runInBand` — **697 tests across 23 suites, all passing** (636 before, 61 new).
- `npm run lint` — clean.
- **Mutation-checked twice**, as above: 4 tests for the gender filter, 3 for the empty fallback.
- **LIVE against the real running server and Atlas — 23 checks, all passing**, across eight scenarios: overlap with no preference; the same tags preferring male and then female (same set, different leader, women and men both still present); the silent fallback returning all 11 with nothing said; the fallback still honouring the preference; a therapist in India returned to a request carrying no country; nothing sensitive in the payload; and validation rejecting unknown tags, five tags and none.
- **The seed teardown was rehearsed**, not assumed: 10 removed, baseline of 2 users and 1 profile intact, then re-seeded.

**Manual steps for the developer:**
1. **No new packages, no new environment variables.**
2. **The seeded therapists are in your database now** — 10 of them, alongside your real one. Sign in as any with `SeedTherapist!2026`; emails are `firstname-lastname@seed.castofmind.test`.
3. **Remove them any time with `npm run seed:therapists:remove`.** It deletes only the seeded records.
4. **To see the silent fallback**, choose only `Career Counselling` or `Speech Anxiety` in the questionnaire — the script recomputes and prints this list each run, so trust its output over this note.
5. **I left a stray `nodemon` running.** I started a dev server that hit `EADDRINUSE` because yours was already up; two nodemon processes are now alive and I could not tell mine from yours with certainty, so I did not kill either. Worth closing the spare terminal.

**Carried forward:**
- **The seeded therapists must be gone before launch** — the script refuses to run in production, but nothing stops a seeded record being carried into a production database by a restore or a copied connection string. **Run the teardown before any production cutover.**
- Slice 6's payload mapper must nest `partner1`/`partner2` under `coupleData`.
- `clientProfiles` has no timezone field, so slices 7 and 9 must use the browser's zone.
- The `amount` euros-or-cents question (4.4); whether rejected applicants are emailed (4.3).

**PRE-LAUNCH BLOCKERS — one added, the list now stands at 13:**

13. **NEW — remove the seeded therapists before launch.** `npm run seed:therapists:remove`. Ten fake practitioners with placeholder photos and invented credentials sit in the development database. The script cannot run in production, but that guard does not protect a production database populated from a development one. A client choosing a therapist who does not exist, and paying €200 for it, is the failure this line exists to prevent.

**Not done (out of scope, by design):**
- **No matching UI** — the questionnaire's review screen still hands over nowhere. Therapist results and the detail page are chunk 5.6.
- No checkout, no booking, no `clientProfiles` write. Nothing is created until the payment webhook in slice 6.
- No "no match found" messaging of any kind, per §15.

---

## Chunk 5.6 — Therapist results and detail pages

**Status: Complete.** Nothing skipped. **Slice 5 is finished** — the intake journey now runs from "Get started" to a chosen therapist. Verified live against the real cluster; the rendered pages are yours.

Built — server:
- `GET /api/v1/therapists/:id` — public, rate limited: `services/therapistDirectory.service.js` · `controllers/therapists.controller.js` · `routes/therapists.routes.js`.
- `routes/therapists.test.js` — 32 tests.
- Edits: `constants/matching.js` (detail projection), `routes/index.js`.

Built — client:
- `pages/Matches.jsx` · `pages/TherapistDetail.jsx`
- `components/matches/TherapistCard.jsx` · `MatchesSkeleton.jsx`
- `components/therapist/TherapistIdentity.jsx` · `WorkingHoursTable.jsx`
- `lib/workingHours.js` · `lib/api/matchingApi.js` · `data/matchesContent.js`
- Edits: `App.jsx` (two routes), `store/questionnaireSlice.js` (the selection), `QuestionnaireFlow.jsx` (the review now hands over), `components/portal/ClientPreviewCard.jsx` (see below).

---

### A SECOND ENDPOINT THE CHUNK DID NOT ASK FOR, AND WHY IT IS NEEDED

The matching projection deliberately withholds `workingHours`, and this page must show them. Handing the therapist over from `/matches` through router state would have worked — right up until someone bookmarked, refreshed or shared `/therapist/:id`, which §5 lists as a real page. A page that only exists mid-flow is not a page.

Same allowlist discipline as matching: `PUBLIC_THERAPIST_DETAIL_FIELDS` is matching's list **plus `workingHours` and nothing else**. `educationSummary` and `currentWorkSituation` were left out because they are not on this chunk's list and an unauthenticated endpoint should carry the least that does the job.

**A malformed id and an unknown id return the identical 404**, so ids cannot be probed — and a test asserts the two response bodies match exactly. **Inactive therapists 404 too:** a client must never reach a profile they cannot actually be matched with.

---

### THE WARM FEATURE I DID NOT BUILD, AND WHY

The obvious move on a results card is *"works with 3 of the concerns you named"*. **It is not there, deliberately.**

On §15's silent-fallback path nothing overlaps, so every card would show zero — and the grid itself would become the "no exact match found" message the client rejected on user-psychology grounds. The rule would be breached without a single line of copy saying so.

So: no match counts, no "best fit" badges, no ranking labels, and a heading that reads the same whether the list is a perfect match or the whole roster. The warmth has to come from the photography, the type and the bio rather than from scoring people. This is written at the top of `data/matchesContent.js` so the next person to reach for that feature meets the reason first.

**No star ratings anywhere** — reviews are admin-only (§9.6). A test asserts the words "rating", "stars" and "review" appear nowhere in the payload.

---

### THE PIECE MOST LIKELY TO BE SILENTLY WRONG: HOURS ACROSS TIMEZONES

Working hours are **recurring local times, not timestamps**, so §15's "store UTC, convert on display" does not apply directly. Three traps, all real:

1. **The day rolls over.** A Perth therapist working Monday 09:00–17:00 is **Sunday 20:00 – Monday 04:00** in Toronto. Converting the clock and keeping the day label would be quietly wrong for half the world.
2. **DST makes any weekly answer approximate.** A recurring schedule carries no date, so a reference date has to be chosen and the answer moves when either country changes its clocks.
3. **A span can cross midnight** in the viewer's zone even when it did not in the therapist's.

`lib/workingHours.js` converts against the current week using `Intl` only — the same choice `dateFormat.js` made, and it already knows every IANA zone and its DST rules. The wall-clock-to-instant conversion runs **two passes**, because a single pass leaves a residual error exactly on a DST boundary.

**21 checks executed against fixed zones and fixed reference dates**, so the results are deterministic rather than dependent on today: Warsaw→Dublin in both winter and summer; **Perth→Toronto rolling back to Sunday**; **Toronto→Perth rolling forward to Tuesday**; a 22:00–02:00 span treated as ending next day rather than going backwards; India's **half-hour offset** (09:00 → 13:30); and malformed or missing hours degrading to "closed" instead of crashing.

**Showing both columns turned out to be the safer choice**, not just the more transparent one — seeing what was converted *from* makes the daylight-saving caveat checkable instead of hiding it behind numbers the reader has no way to verify. Both zones are named under the table, and a row that crosses a day says so.

---

### KEEPING CHUNK 4.6 HONEST

Chunk 4.6 shows a therapist a card captioned *"How you appear to someone choosing a therapist."* Building a separate client-facing card would have made that caption quietly false the first time either changed.

`TherapistIdentity` — photo block aside, the name, credentials, professional title and specialty chips — is now **one component used by the results card, the detail hero and 4.6's preview**. Each context keeps its own container, tone and affordances; only the part that shows *the person* is shared. `ClientPreviewCard` was rewritten to use it, so the promise it makes is now structural rather than a coincidence.

**No ink wash on therapist photographs.** Every other photo on this site sits under one, but §24.5 makes therapist portraits the explicit exception: these are real people and must be shown as real, warm, professional portraits.

---

### THE STATES THAT ARE NOT THE FALLBACK

Three different empty-ish situations, deliberately distinguished:

| Situation | What happens |
|---|---|
| Nothing overlaps | §15's fallback: every therapist, silently, no message |
| **Roster genuinely empty** | An honest "no therapists available right now — this is on our side" |
| **Arrived with no answers** | A shared link or fresh tab: sent to the questionnaire rather than firing a request with nothing |

The middle one matters: it is **not** the no-match case and must not borrow its silence, because there is genuinely nothing to show and saying so is the honest thing.

---

**Other decisions:**

- **Portrait-led cards, two up** (developer's choice). The photograph leads and takes real space, because §24.7 asks for enough warmth that choosing feels like a human decision — and a small avatar beside a row of fields is exactly the database lookup it warns against.
- **Elevation declared once:** a hairline at rest; a genuine lift with a shadow on hover, when the card really is off the page.
- **Specialties lead the detail page in their own sage panel; orientations are plain outline chips** with a line saying they describe *how* a therapist works, not what they treat, and play no part in matching. Two identical chip lists would imply both decide the match, and only one does (§15, §23).
- **The choose panel stays in view while reading**, carrying the €200/month and what it includes — the price should not be a surprise that arrives only at checkout.
- **The stagger is capped at five steps.** An uncapped index delay makes the last card sit visibly waiting, which reads as lag rather than rhythm (the chunk 2.2 lesson).
- **Loading is derived, not set inside the effect** — the React Compiler objection, fixed the same way `useApi` was in chunk 0.6: a request key describes what is wanted, and "the stored result is for a different request" is what loading means. Both pages.
- **Selection stores the id plus a small display snapshot.** **Slice 6 must re-verify the therapist is still active before taking payment** — a snapshot could be minutes or days old, and someone paying to reach a deactivated therapist is the failure to avoid.

**Verified:**
- `npm test -- --runInBand` — **729 tests across 24 suites, all passing** (697 before, 32 new).
- `npm run lint` (server) clean; `oxlint` (client) 0 findings on everything this chunk touched. Client build passes, **788 modules**.
- **32 contrast pairs computed, 0 failures** across the results grid, the detail hero, the specialty and approach panels, the hours table and the choose panel. Tightest are the closed-day dash at `ink/60` **4.74:1** and the choose button's border on mist at **3.35:1** — neither may be lightened.
- **21 timezone checks**, as above.
- **Live against the real running server and Atlas:** a real seeded therapist fetched by profile id, returning 18 fields with `workingHours` and `timezone` present, and **no `userId`, taxpayer id, licence number, street address, education summary or status anywhere**. Unknown id and malformed id both 404.
- Every earlier client suite re-run: 57 · 44 · 40 · 40 · 34, all passing.
- Detector — 0 findings, and **read that as a degraded 0**; the parsing dependencies are still absent, so the computed table is the compensation.

**Yours to check — nothing here has been seen rendered:**
1. **Run the whole flow.** Questionnaire → review → matches → a profile → Choose. This is the first time it goes end to end. Ten seeded therapists are in your database.
2. **Do the cards feel like people rather than records?** That is the whole brief for this page and the one thing I cannot judge from here.
3. **The hours table.** Priya (Asia/Kolkata) and Tom (Australia/Perth) are the interesting ones from Ireland — Perth should visibly roll the day back. Check the two columns read clearly and the day labels are not confusing.
4. **The detail page's sticky choose panel** at desktop width, and that it stacks sensibly below `lg`.
5. **360px** on both pages, and reduced motion (the stagger, the drift and the hover scale should all be absent).
6. **Keyboard:** tab through the cards — each card is one link, so focus should move card to card and the ring must be visible on the mist ground.

**Manual steps for the developer:**
1. **No new packages, no new environment variables, no new colour or type tokens.**
2. Nothing to configure — the seeded therapists from 5.5 make this immediately usable.

**Carried forward:**
- **Slice 6 must re-verify the chosen therapist is still active** before payment, and map `partner1`/`partner2` into `coupleData`.
- `clientProfiles` has no timezone field. This chunk uses the browser's zone for the hours table, which works — but slices 7 and 9 will need the same approach for session times, so it is now a settled pattern rather than an open question.
- Remove the seeded therapists before launch (blocker 13). The `amount` euros-or-cents question (4.4); whether rejected applicants are emailed (4.3).

**Pre-launch blockers — unchanged, the list stands at 13.** No placeholder content was created; every therapist shown comes from the database.

**Not done (out of scope, by design):**
- **No checkout and no payment** (slice 6). Choosing records the selection and says where the flow will continue.
- No booking, no `clientProfiles` write — nothing is created until the payment webhook.
- No ratings, no reviews, no admin-only fields anywhere on either page.

---

### Dev config — Vite proxy for cross-device testing (2026-09-07, developer)

The developer configured `client/vite.config.js` with `server.host: true` and a proxy
forwarding `/api` to `http://localhost:5000` (`changeOrigin: true`), and changed
`client/.env` to `VITE_API_BASE_URL=/api/v1` (the absolute localhost URL is kept
commented above it).

**What it buys:** the site can be opened from a phone on the same Wi-Fi using the
laptop's LAN address. Requests go to the same origin Vite is serving, so the browser
never makes a cross-origin call — no CORS negotiation, and no machine IP hardcoded
into a committed file.

**`client/.env.example` still carries the absolute URL** and was deliberately left
alone: it documents the shape a real deployment needs, where the API is on another
host entirely and there is no dev proxy in front of it.

**Carried to chunk 12.5 (deployment):** production has no Vite dev server, so
`VITE_API_BASE_URL` must be set to the real API origin at build time. A relative
`/api/v1` would resolve against the Vercel domain, where nothing is listening. This
sits alongside the `sameSite` cookie note already parked for that chunk — both are
"works locally, silently wrong in production" traps.


---

## Chunk 6.1 — Payment models

**Status: Complete.** Nothing skipped. **Slice 6 has started.** Models and tests only — nothing writes these collections until the webhook in 6.4.

Built:
- `constants/payments.js` — the canonical home for every payment value.
- `models/Booking.js` · `models/Booking.test.js` (14 tests)
- `models/Subscription.js` · `models/Subscription.test.js` (22 tests)
- `models/PaymentEvent.js` · `models/PaymentEvent.test.js` (28 tests)
- Edits: `constants/adminStats.js` (re-exports instead of duplicating), `client/src/lib/dashboardFormat.js` (the cents change).

---

### THE OPEN ITEM FROM CHUNK 4.4 IS NOW CLOSED: MONEY IS STORED IN CENTS

§10.6 types `amount` as a bare Number and never says which unit. Chunk 4.4 flagged it and said it could not be wrong yet but would be very wrong later. **Decided 2026-09-07: minor units. €200.00 is `20000`, never `200`.**

Three reasons, and the second decided it:

1. **Stripe speaks cents.** The webhook hands us `20000`, so nothing converts between the platform and our ledger — and a conversion is exactly where a ×100 bug lives.
2. **`paymentEvents.amount` must match Stripe exactly**, because it is the dispute record. If `subscriptions` held euros and the ledger held cents, two fields with the same name in the same slice would mean different things. That is precisely the silent bug 4.4 was warning about.
3. **Integers never lose a cent.** Floats eventually do, once proration or partial refunds produce values like 66.666.

**The cost, and it was paid in this chunk rather than deferred:** chunk 4.4's dashboard would otherwise have shown **€20,000** for a single subscription. `client/src/lib/dashboardFormat.js` now divides by 100 and its doc comment states the unit contract. That is one line in a file from another chunk — flagged rather than slipped in, and safe to change today only because no subscription exists yet. **Deferring it is how it would have been forgotten.**

`formatMinorUnits()` in `constants/payments.js` is the server-side equivalent, so the welcome email (6.4) and the renewal reminders (11.6) do not each divide by hand. A test pins `SUBSCRIPTION_AMOUNT_MINOR === 20000` and pins the model default to it — if that ever reads 200, every money figure is out by a factor of 100 and nothing else would fail.

---

### THE APPEND-ONLY GUARD, AND THE ONE HOLE IT DOES NOT CLOSE

The chunk asked for "a model-level guard that prevents updates." A guard on `save()` alone would have been theatre — most accidental edits arrive through `Model.updateOne` or `findOneAndUpdate`, which never touch document middleware.

Blocked, each proven by its own test rather than trusted: `updateOne` · `updateMany` · `findOneAndUpdate` · `findOneAndReplace` · `replaceOne` · `deleteOne` · `deleteMany` · `findOneAndDelete` · `doc.deleteOne()` · re-saving an existing document · `bulkWrite` · an aggregation carrying `$out` or `$merge`. Creating, reading and ordinary aggregation are untouched.

`updateOne` and `deleteOne` exist as **both** query and document middleware, so both are registered with `{ document: true, query: true }` — a hook registered for only one form lets the other straight through.

**THE HOLE, STATED PLAINLY:** the raw driver (`mongoose.connection.db.collection('paymentevents').updateOne(...)`) does not pass through Mongoose and cannot be blocked from a schema. This guard stops accidents, not somebody deliberately going around it. **Closing it properly needs a database user without update or delete rights on this collection — a deployment concern, carried to chunk 12.5.** The test suite's own `clearCollections` helper goes through the raw driver, which is why this suite can clean up after itself at all; that is the hole demonstrating itself.

**A REAL BUG WAS CAUGHT BY RUNNING THE TESTS, AND IT WOULD HAVE BROKEN CREATION.** The guards were first written in the classic `function (next) { next(err) }` style. Mongoose 9 did not hand the `save` hook a `next`, so `next()` threw `TypeError: next is not a function` **on every insert** — 24 of 28 tests failed, including plain creation. Rewritten as zero-argument hooks that `throw`, which Kareem turns into a rejected promise. Recorded because the failure looked like a guard problem and was actually a middleware-signature problem: **a hook that looks registered is not the same as a hook that fires correctly.**

---

### WHAT MAY BE MISSING ON A PAYMENT EVENT, AND WHY

**`subscriptionId` and `clientId` are both optional, and that is not an oversight.** The backend rules require every webhook to be logged *before* it is acted on. On a first payment neither the user nor the subscription exists yet — 6.4 creates them *from* that webhook. Requiring either field would make the first event of a client's life impossible to log, which is the one event a dispute is most likely to be about. 6.4 links them on the way out.

**`eventType` is free text, not an enum.** An enum would reject any event type we had not anticipated, and the rule is to log every webhook and handle unknown types gracefully. A validation error would drop the record rather than store it, so the ledger would be missing precisely the surprising events worth investigating.

**`currency` is free on the ledger but EUR-only on `subscriptions`.** A deliberate asymmetry: the subscription records what we charge, the ledger records what actually arrived. A payment in an unexpected currency is something to investigate, not something to refuse to write down.

**`rawPayload` is `select: false` and stripped from `toJSON`.** A webhook body carries payment details, which are on the never-log list and have no business reaching a response. Storing it is the audit trail the spec requires; that is not the same as exposing it. A test confirms it is genuinely stored while being absent from both an ordinary query and the serialised form.

---

### DECISIONS MADE

- **The unique index is compound — `{ platform, platformEventId }`, approved 2026-09-07.** The brief said `platformEventId` alone. If PayPal is ever added and one of its event ids collided with a Stripe one, a single-field index would silently refuse a real payment event — a lost row on the one collection that must never lose one. Duplicate detection is unaffected, because a resent webhook carries the same platform and the same id. **CONTRACT FOR CHUNK 6.3: look duplicates up on BOTH fields, never on `platformEventId` alone.**
- **Two "one live row" partial unique indexes — spec additions, approved 2026-09-07.** Neither is in §10.5 or §10.6; same footing as the reset-token fields added in 1.5 and the two fields added in 4.3.
  - `bookings`: one **active** booking per client. §6 gives a client exactly one therapist and reassignment is deferred to v2. Without it, a re-subscribe that failed to reuse the existing booking would create a second active one and the client portal would silently pick whichever came back first. Ended bookings are exempt, so history survives — and a test confirms one therapist may still hold many active bookings, since getting that index the wrong way round would break the platform.
  - `subscriptions`: one **active** subscription per booking. Cancelled and expired rows are exempt so a re-subscribe keeps its history. **Lower confidence than the booking one — if slice 11 ever genuinely needs two live rows on one booking, this is the index to drop.**
- **`platformSubscriptionId` uses a partial index on string values, not `sparse`.** `sparse` only skips a *missing* field; several rows explicitly holding `null` would still collide, and `null` is exactly what a careless insert writes. A test covers all three cases — absent, null, and undefined.
- **`sessionsRemaining` has `max: 4`.** §13's no-carry-over rule becomes impossible to break by construction rather than something to remember. A client with 2 unused sessions can never reach 6.
- **Shape guards on both records.** A booking cannot link a person to themselves; an ended booking must carry an end date and an active one must not. A subscription's period cannot end before it starts, and a cancelled one must record when it was cancelled. `cancelledAt` deliberately **survives** the later move to `expired` (§13), and a test pins that — losing it would destroy the only stamp saying why the subscription ended, which is why 4.4's churn figure falls back to `updatedAt`.
- **`bookings` carries no `updatedAt`** (§10.5 defines only `matchedAt` and `endedAt`); `subscriptions` carries both (§10.6 lists them); `paymentEvents` carries neither, only `receivedAt` — nothing there is ever updated, so an `updatedAt` could only ever lie.
- **`SUBSCRIPTION_STATUS` and `BILLING_CURRENCY` now live in `constants/payments.js`.** `constants/adminStats.js` re-exports them, so its existing callers were not rewritten. Its own comment asked slice 6 to do exactly this.
- **Collection names pinned by tests** against `FUTURE_COLLECTIONS` — the chunk 5.1 precedent. Chunk 4.4 reads `bookings` and `subscriptions` through the raw driver, and a rename would make the dashboard report 0 for ever, silently. The raw reads in `adminStats`, `adminTherapists` and `therapistProfile` were left alone: they still work, and switching them to models is cleanup for 6.4 or later, not this chunk.

---

### A PRE-EXISTING DEFECT FOUND, FIXED ONLY IN THE NEW FILES

**Mongoose does not substitute a `{VALUES}` token in an enum message.** A test expecting the real list got back the literal string `"Only {VALUES} is billed."`

There are **15 occurrences** in the codebase. The 4 in this chunk's models now build the list explicitly with a template literal. **The other 11 are pre-existing and were left alone** — 2 in `User.js` (chunk 1.1), 5 in `ClientProfile.js` (5.1), 4 in `TherapistApplication.js` (3.1). Touching three shipped models is outside this chunk.

**Impact is low but real:** these are model-level validators, the last line of defence, and the user-facing 422 messages come from the Zod layer — so a literal `{VALUES}` only surfaces if something bypasses validation. It is cosmetic, not a safety issue. **One line each to fix whenever the developer wants it done.**

---

**Verified:**
- `npm test -- --runInBand` — **793 tests across 27 suites, all passing** (729 from earlier chunks, 64 new).
- `npm run lint` (server) clean; `oxlint` (client) 0 findings on everything this chunk touched. Client build passes.
- **Mutation-checked three times.** Emptying the query-hook list broke **8** tests; reducing the compound index to `platformEventId` alone broke **1** (the cross-platform case, which is the whole reason the index is compound); removing the one-active-booking index broke **1**. All three restored and the full suite re-run.
- The money path was checked arithmetically end to end: 20000 → €200, 140000 → €1,400, 0 → €0, and null/undefined → €0 rather than NaN.
- Standalone in-memory Mongo, not a replica set — there are no transactions in this chunk, so the suite stays fast. `Model.init()` is called before every unique-index test, per the chunk 1.1 lesson that an index is enforced on write and not by a validator.

**Manual steps for the developer:**
1. **No new packages, no new environment variables, no external accounts.**
2. **Nothing to configure.** Nothing writes these collections yet, so your Atlas cluster is unchanged — no indexes are built until the first document is inserted in 6.4.

**Carried forward:**
- **Chunk 6.3 must match webhooks on `{ platform, platformEventId }`**, not on the id alone.
- **Chunk 12.5: restrict the production database user's rights on `paymentevents`** to close the raw-driver hole in the append-only guard.
- The 11 remaining `{VALUES}` enum messages, if the developer wants them fixed.
- Slice 6 still needs to re-verify the chosen therapist is active before payment, and to nest `partner1`/`partner2` under `coupleData` (5.6, 5.3).
- Remove the seeded therapists before launch (blocker 13). Whether rejected applicants are emailed (4.3). Education summary and current work situation are still frozen (4.6).

**Pre-launch blockers — unchanged, the list stands at 13.** No placeholder content was created.

**Not done (out of scope, by design):**
- **No payment endpoints of any kind**, per the chunk's own "Do NOT" — no checkout session (6.2), no webhook handler (6.3), no four-document transaction (6.4), no checkout UI (6.5).
- No Stripe or PayPal SDK, and no decision on which platform is used. §21 still lists that as an open item for Asad.
- Nothing writes `bookings`, `subscriptions` or `paymentEvents`. The admin dashboard still reads honest zeroes.

---

## Chunk 6.2 — Checkout session creation

**Status: Complete.** Nothing skipped. Verified live end to end against the real Stripe **test** account and the real Atlas cluster — 22 checks, all passing. **One thing is yours: opening the URL and looking at it.**

Built — server:
- `config/stripe.js` — the SDK client, required in production, optional in development.
- `constants/checkout.js` · `validation/checkout.schema.js`
- `models/PendingCheckout.js` · `models/PendingCheckout.test.js` (11 tests)
- `services/checkout.service.js` · `controllers/checkout.controller.js` · `routes/checkout.routes.js`
- `routes/checkout.test.js` — 33 tests
- Edits: `config/env.js` (Stripe vars + two guards), `routes/index.js` (mount), `.env.example`, `routes/roleGuards.test.js` (see the ripple below).

**Package installed:** `stripe` (^22.6.1) in `/server`. No other new dependency.

---

### THE PLATFORM: STRIPE, AND WHAT THAT DOES NOT SETTLE

Stripe is now integrated in test mode. §12 recommends it as primary because this platform is entirely monthly recurring billing, and §21 still lists the final platform choice as an open item for Asad — **that question is not closed by this chunk.** Nothing here depends on him: test keys need no business verification. If he later wants PayPal as well, §12 is explicit that it is a **second, separate integration**, not a configuration change.

---

### A FIFTEENTH COLLECTION — `pendingCheckouts`

§10 fixes the schema at 14 collections, so this is a spec addition, **approved 2026-09-07** on the same footing as the reset-token fields in 1.5 and the two fields in 4.3.

**Why it has to exist.** §12's golden rule puts account creation behind webhook confirmation. The questionnaire is answered minutes earlier in a browser and has to survive until then.

**The alternative was rejected on two grounds.** Stripe's Checkout Session `metadata` caps values at 500 characters, which a couple's answers would breach — and, the real objection, it would put somebody's mental health concerns on a third party's servers for no reason. **A test asserts no questionnaire data reaches Stripe at all**, and the live run confirmed the same against the real session Stripe stored.

**THE TTL INDEX, AND WHY IT IS NOT THE CHUNK 1.3 MISTAKE.** That entry warned never to put a TTL index on `refreshTokenExpiresAt`, and it was right: that field lives *on* the `users` record, so TTL would have deleted entire client and therapist accounts, silently. **This is the opposite case — the whole document is the disposable thing, so deleting all of it is precisely the intent.** The distinction is the field's owner, not the index: TTL is correct exactly when the document is disposable. Written into the model, and a test asserts there is exactly one TTL index and it sits on `expiresAt`.

**26 hours, and the margin is deliberate.** Stripe sessions expire at 24 hours, so the draft must outlive the session it belongs to — otherwise someone paying near the end of the window arrives at a webhook with no answers behind them. A test pins that the draft TTL is strictly longer than the session TTL, so the two cannot be edited into the wrong order.

**Privacy, stated plainly:** this collection holds concern tags for people who have not paid and may never become clients. It is never logged, never returned by any endpoint, stripped from `toJSON`, deleted outright on success at 6.4, and gone within 26 hours otherwise.

---

### DECISIONS MADE

- **Inline pricing, not a dashboard price id — developer's decision, 2026-09-07.** `price_data` carries `unit_amount: SUBSCRIPTION_AMOUNT_MINOR`, `currency: 'eur'`, `recurring: { interval: 'month' }`. The amount Stripe charges and the amount stored at 6.4 therefore come from **one line of code**, so they cannot silently diverge the way a dashboard price and a code constant can. It also removes a manual setup step and the `STRIPE_PRICE_ID` variable entirely.

  **The cost, recorded because it will show:** `product_data` creates a **new Stripe Product on every checkout**, so the dashboard's product list grows one row per attempt. Tolerable at this volume and invisible to clients. If it ever becomes annoying, the fix is one line — create a single Product once and pass `product: 'prod_...'` beside `price_data` instead of `product_data`.

- **A registered email is refused BEFORE payment, with one unified 409.** The same message whether the address belongs to a client, a therapist or the admin — the chunk 3.2 pattern, approved on the same grounds. It concedes the address is known to us but never what kind of record it is, and on this platform "this address belongs to a client" is the sensitive half. A test loops all three roles and asserts the words "client", "therapist" and "admin" appear in none of the replies.

  **The alternative was letting them pay and failing at the webhook**, which means taking €200 from someone who then cannot be given an account. Refusing early is worth the mild enumeration signal, and the rate limit is what keeps that signal small.

- **The questionnaire is validated TWICE, and the second pass is the useful one.** Zod checks the shape; then the service builds a real `ClientProfile` in memory and runs the model's own validators without saving. The model carries rules Zod does not — the fixed-list duplicate check, the cross-branch guard, the enum lists — so this guarantees **we can never take €200 for answers that would fail to persist at 6.4**, which would leave a paying client with no account and a webhook that cannot succeed.

- **Write order: draft first, then Stripe, then the session id back.** If the Stripe call fails we are left with an orphan draft that expires on its own — harmless. The reverse order could leave a **paid** session with no questionnaire behind it, stranding someone already charged. A test asserts the orphan is left to expire rather than deleted. The write-back is non-fatal by design, because `client_reference_id` already reaches the webhook, so 6.4 can find the draft either way.

- **The therapist is re-verified as existing and active before any money moves** — closing the item carried from 5.6, where the log noted the client's selection is a snapshot that could be days old. **6.4 must check again**, because a therapist can be deactivated while the Stripe page is open.

- **The API takes partners NESTED under `coupleData`**, matching §10.2 and `clientProfiles` exactly. This is the contract 6.5's mapper must meet, and it closes the shape question the log has carried since 5.3.

- **§13's auto-renewal disclosure is on Stripe's own page**, via `custom_text.submit.message`. §13 calls checkout "the most important" of the three places it must appear, and Stripe's page is the last screen before a card is charged. 6.5 states it in our UI as well.

- **The Stripe API version is pinned to the one this SDK ships with** (`2026-08-26.dahlia` for stripe 22.6.1). Pinning to a version the SDK does not expect is worse than not pinning, because the request and the types disagree — my first draft guessed a different string and would have done exactly that.

- **Nothing from the request body is logged.** It carries an email, concern tags and, for a couple, two people's names and ages.

- **Stripe's own error text never reaches the caller** — a 502 with a fixed message. A test asserts an internal Stripe string does not appear in the response.

---

### THE APPLICATION NEVER TOUCHES CARD DETAILS

No card field is accepted, and none could be: the schema strips unknown keys. A test posts `cardNumber` and `cvc` alongside a valid payload and asserts neither is stored nor forwarded to Stripe. **There is deliberately no Stripe publishable key anywhere in this project** — the browser is redirected to Stripe's hosted page by URL, so no Stripe.js runs in our frontend.

---

### THE MOCK RIPPLE, FOR THE FOURTH TIME — AND IT WAS PREDICTED

Making `STRIPE_SECRET_KEY` required in production broke `roleGuards.test.js`, which boots a real `NODE_ENV=production` child process to prove the dev routes are unmounted. The child exited at startup.

**This is the identical pattern to chunks 1.5 and 2.6, and the 2.6 entry named it in advance:** "a production-only env check is invisible until something actually boots production." Fixed the same way — the child is given a value, because that test is about route mounting rather than payment configuration. It needs a **non-test-looking** key, because production now refuses an `sk_test_` key outright.

**Two startup guards were added, and the second is the one that matters:**
1. Production refuses to start without `STRIPE_SECRET_KEY` — without it nobody can subscribe, which is the only way a client account is ever created.
2. **Production refuses to start with an `sk_test_` key.** A test key in production would accept real subscriptions and never charge a card — the business would be giving therapy away and would not find out until the money failed to arrive.

---

### TWO BUGS CAUGHT BY RUNNING THINGS

1. **`validateSync()` is deprecated in Mongoose 9 and removed in 10.** The suite printed a deprecation warning; switched to `await draft.validate()`, which does the same job and survives the next major.
2. **The test fixture was missing `applicationId`**, which chunk 4.3 made required on `therapistProfiles`. Every test failed on the seed rather than on anything it was testing.

---

**Verified:**
- `npm test -- --runInBand` — **837 tests across 29 suites, all passing** (793 from earlier chunks, 44 new).
- `npm run lint` — clean.
- **Mutation-checked three times.** Removing the pre-payment email check broke **2** tests; removing the active-therapist check broke **2**; leaking the questionnaire into Stripe's metadata broke **2**, including the privacy assertion. All restored and the full suite re-run.
  - Worth recording: my first reading of the second mutation's output was wrong — a truncated log made it look like a broad failure. Re-run properly it was exactly 2, and the failure was the deactivated-therapist case returning 201 instead of 409.
- **LIVE against the real running code, the real Stripe test account and real Atlas — 22 checks, all passing:**
  - the endpoint returned **201** with a real `checkout.stripe.com` URL;
  - Stripe's own record of the session confirmed **mode `subscription`, `amount_total` 20000, currency `eur`, `recurring.interval` month, price type `recurring`** — the money, read back from Stripe rather than from our own arguments;
  - the renewal disclosure was present on the session, both return URLs correct, the email prefilled, and `client_reference_id` matching our stored draft;
  - **neither the concern tags nor the client's name appeared anywhere in Stripe's stored session**;
  - **THE GOLDEN RULE HELD: zero users, zero client profiles, zero bookings, zero subscriptions created** — checked against a baseline taken before the run;
  - the run then expired its session, deleted its draft, and **the cluster was confirmed byte-for-byte back to baseline** (12 users, 0 bookings, 0 subscriptions, 0 profiles, 0 drafts).

**Yours to check — the one thing I cannot do from here:**

A second session was created deliberately and **left open** so it can be opened by hand. There is no browser on this machine, per the standing decision of 2026-08-27.

> Open the URL printed at the end of the chunk-6.2 run and confirm Stripe's page shows **€200.00 per month**, the product name, and the renewal sentence above the pay button.

Nothing needs cleaning up afterwards: Stripe expires the session at 24 hours and the draft TTLs out at 26. **That is the expiry design demonstrating itself.** If you would rather it were gone now, say so and I will remove both.

**Manual steps for the developer:**
1. **`STRIPE_SECRET_KEY` is already set** in `server/.env` and was confirmed to be an `sk_test_` key, 107 characters. Nothing else to do for this chunk.
2. **`STRIPE_PRICE_ID` is NOT needed** — the inline-pricing decision removed it. If you created a Product and Price in the dashboard while reading the plan, they are unused and can be deleted.
3. **`STRIPE_WEBHOOK_SECRET` is for chunk 6.3** and is deliberately not enforced yet. For local work it comes from the Stripe CLI (`stripe listen`), not the dashboard — exact instructions will come with 6.3.
4. **No publishable key, ever.** Documented in `.env.example` so nobody adds one later thinking it was forgotten.

**Carried forward:**
- **Chunk 6.4 must re-check the therapist is still active** at webhook time, and must **delete the pending draft on success**.
- Chunk 6.3 must match webhooks on `{ platform, platformEventId }`, not the id alone (from 6.1).
- **`/welcome` and `/checkout` do not exist yet.** The success and cancel URLs point at routes 6.6 and 6.5 build, so a real redirect will 404 until then. Expected.
- Chunk 12.5: restrict the production database user's rights on `paymentevents` (from 6.1); and the Stripe dashboard will hold one Product per checkout unless the `product:` id change above is made.
- The 11 remaining `{VALUES}` enum messages (6.1). Remove the seeded therapists before launch (blocker 13). Whether rejected applicants are emailed (4.3).

**Pre-launch blockers — unchanged, the list stands at 13.** No placeholder content was created.

**Not done (out of scope, by design):**
- **No webhook handler** (6.3) and **no account creation** (6.4). Nothing in this chunk writes a user, a client profile, a booking or a subscription, and a test asserts exactly that.
- **No checkout UI** (6.5) and no `/welcome` page (6.6). The endpoint is reachable only by a direct request today.
- No PayPal. No refund logic — §12 puts refunds in Asad's dashboard for v1.

---

## Chunk 6.3 — Webhook handler and idempotency

**Status: Complete.** Nothing skipped. Verified: 864 tests passing across 30 suites.

Built — server:
- `constants/webhooks.js` — Stripe event types, billing reasons, tolerance window (300s), rate limit config.
- `services/stripeWebhook.service.js` — raw body HMAC signature verification, atomic insert idempotency, event routing stubs.
- `controllers/webhook.controller.js` · `routes/webhook.routes.js` — `POST /api/v1/webhooks/payment` with failure-only rate limiting.
- `routes/webhook.test.js` — 27 tests (signatures, raw body preservation, concurrency, duplicates, routing, ledger writes).
- Edits: `app.js` (raw body parser mounted ahead of `express.json()`), `config/env.js` (`STRIPE_WEBHOOK_SECRET` required in production), `middleware/rateLimiter.js` (`skipSuccessfulRequests`), `routes/index.js`, `routes/roleGuards.test.js`, `.env.example`.

---

### RAW BODY MOUNTING & SIGNATURE VERIFICATION
- `stripe.webhooks.constructEvent()` verifies an HMAC over the exact bytes sent by Stripe. `app.use('/api/v1/webhooks', express.raw({ type: '*/*', limit: '1mb' }))` is mounted **before** `express.json()` in `app.js` so bytes are preserved uncorrupted.

---

### ATOMIC IDEMPOTENCY VIA THE COMPOUND UNIQUE INDEX
- Rather than a race-prone read-then-write check (`findOne` then `create`), the handler attempts `PaymentEvent.create()`.
- MongoDB's compound unique index on `{ platform, platformEventId }` (from Chunk 6.1) atomically accepts the first write and throws code `11000` on any duplicate, returning `200 { received: true, duplicate: true }` cleanly without race conditions.

---

### EVENT ROUTING & THE INITIAL INVOICE TRAP
- Handlers stubbed for `checkout.session.completed` (chunk 6.4), `invoice.payment_succeeded` (slice 11), `invoice.payment_failed` (slice 11), `customer.subscription.deleted` (slice 11), and `customer.subscription.updated` (slice 11).
- `billing_reason === 'subscription_create'` guards `invoice.payment_succeeded` so the first invoice is never double-processed as a renewal.
- Unknown event types are logged and return `200` without crashing or triggering unnecessary Stripe retries.

---

**Verified:**
- `node --experimental-vm-modules node_modules/jest/bin/jest.js --runInBand` — **864 tests across 30 suites, all passing** (837 from earlier chunks, 27 new).
- ESLint clean across all touched files.
- Mutation-checked: raw body ordering, atomic unique index gate, replay tolerance units, and mock production env.

**Manual steps for the developer:**
1. **Local webhook testing:** When running local tests with Stripe CLI:
   - Run `stripe listen --forward-to localhost:5000/api/v1/webhooks/payment`.
   - Copy the printed `whsec_...` into `server/.env` as `STRIPE_WEBHOOK_SECRET`.
2. **Production:** Set `STRIPE_WEBHOOK_SECRET` in the production environment from the Stripe Dashboard Webhooks section.

**Carried forward:**
- **Chunk 6.4:** Build account creation (`User` + `ClientProfile` + `Booking` + `Subscription`) triggered by `checkout.session.completed`. Ensure effect-level idempotency on `client_reference_id` and delete pending draft on success.
- **`/welcome` and `/checkout` do not exist yet** (chunks 6.6 and 6.5).
- Pre-launch blockers stand at 13, unchanged.


---

## Chunk 6.4 — Account creation transaction

**Status: Complete.** Nothing skipped. **882 tests across 31 suites, all passing.** The four-document transaction now runs from a verified webhook, and a newly created client can genuinely sign in with the password they were emailed.

Built — server:
- `services/clientOnboarding.service.js` — the transaction, the idempotency guard, the period-end lookup.
- `services/email/templates/clientWelcome.js` — the only email on the platform that carries a password.
- `routes/webhookAccountCreation.test.js` — 18 tests against a **real replica set**.
- Edits: `utils/password.js` (`generateTemporaryPassword`), `models/Subscription.js` (`platformCustomerId`), `services/email/email.service.js` (`sendClientWelcomeEmail`), `constants/email.js`, `test/emailServiceMock.js`, `services/stripeWebhook.service.js` and `controllers/webhook.controller.js` (the handler is now real and awaited), plus two stale test premises corrected (see below).

**No new packages, no new environment variables.**

---

### THE GAP 6.3 LEFT OPEN IS NOW CLOSED

Chunk 6.3 recorded the risk plainly: the ledger row is written *before* the handler runs, so if the handler fails, Stripe's retry is recognised as a duplicate **event** and skipped — and a payment would never be acted on. The ledger cannot be its own guard.

**The guard lives at the effect instead.** Before doing anything, the service asks whether a `subscriptions` record already exists for this `platformSubscriptionId`. That record exists only if the whole transaction committed, so its presence is proof the work is done — and its absence means the work is still outstanding, whatever the ledger says.

Underneath it, 6.1's partial unique index on `platformSubscriptionId` is the atomic backstop for two retries arriving together, exactly as the ledger's compound index was in 6.3.

**Two tests pin it, and the second is the one that matters:** an identical replayed event, and — more importantly — a *different event id carrying the same subscription*, which is precisely the case a ledger-based duplicate check would let straight through.

---

### THE TRANSACTION, AND WHAT WAS ACTUALLY PROVEN

Four documents in one `withTransaction`: `users`, `clientProfiles`, `bookings`, `subscriptions` — plus the `pendingCheckouts` draft consumed **inside** the same transaction, so a rollback puts it back and a retry can still succeed. Deleting it afterwards would strand a failed attempt with no questionnaire left to rebuild from.

**Tested against a real replica set** (`startMemoryReplSet`, the chunk 4.3 precedent). On a standalone instance transactions do not exist, every write simply succeeds, and a rollback test would pass while proving nothing.

The rollback test fails on the **last** of the four, so the first three have genuinely been written and must be undone. It asserts each of the four is back to zero individually, and that the draft survives. A second test then proves a retry succeeds cleanly afterwards.

**Mutation-checked twice:** taking the writes out of the transaction broke **2** tests (both rollback assertions); removing the idempotency lookup broke **1**.

---

### DECISIONS MADE

- **`platformCustomerId` added to `subscriptions`** — spec addition, approved 2026-09-09. §10.6 does not list it. Slice 11 needs the Stripe customer to let a client update a failed card or open the billing portal; reaching it through `platformSubscriptionId` would mean an extra API call every time. **Deliberately not unique** — Stripe reuses one customer across a cancel-and-resubscribe, so the same id legitimately appears on more than one of our records.

- **`currentPeriodEnd` is read from Stripe, with a +1 month fallback** — approved 2026-09-09. The brief said "+1 month"; Stripe's own `current_period_end` is used instead because that date is shown to the client as "Next payment" and drives slice 11's reminder emails. A hand-computed date drifts from Stripe's real schedule, and then we tell people the wrong day and email them on it. **The fallback is deliberate and tested:** if the Stripe call fails, the account is still created with an approximately-right date, because refusing an account somebody has paid for would be far worse.

- **The therapist's USER id goes on the booking, not their profile id.** §10.5 links two users, and both portals query it that way. A test pins it — using the profile id would look fine until the therapist portal returned nothing.

- **A couple is one user and one profile.** The questionnaire is already stored in exactly the `clientProfiles` shape with partners nested under `coupleData`, so it passes straight through with no reshaping. A test asserts one of each document and that no individual `name` leaked onto the profile.

- **The welcome email is sent after the commit, never inside it**, and a failure never undoes the account. An email sent from inside a transaction that then aborts tells somebody their account is ready when it is not. Two tests: the account survives a failed send, and **nothing is sent when the transaction rolls back**. Same call as chunk 4.3, where it fired for real.

- **A deactivated therapist aborts the whole thing**, re-checked here as well as at checkout — a therapist can be deactivated while the Stripe page is open. The draft is deliberately **kept** so the payment can be resolved by hand rather than lost.

- **A missing draft with no existing account fails loudly with a 500.** That means the 26-hour TTL expired before the webhook arrived, so the questionnaire is genuinely gone and no retry can fix it. It surfaces as a failed delivery in Stripe's dashboard rather than disappearing silently, and the ledger's `rawPayload` holds everything needed to rebuild it by hand. Somebody has paid €200; silence would be the wrong failure.

- **`routeEvent` is now awaited.** It was not, and it did not matter while every handler was a synchronous stub. It matters now: an un-awaited promise would return 200 to Stripe before the transaction finished, so a failure would be invisible and the request would look successful.

---

### THE TEMPORARY PASSWORD

A client never chooses a password — there is no password field anywhere in the questionnaire, because no account exists until the money does (§12). So one is generated here and emailed, per §16 ("Welcome + login credentials"). This is the opposite of the therapist welcome email, which deliberately carries no password because they chose their own on the application form (§11) — the two are different on purpose.

- **`crypto.randomInt`, not `randomBytes % length`.** The modulo version is biased toward the start of the alphabet whenever 256 does not divide evenly, which quietly shrinks the keyspace.
- **The alphabet omits `0 O 1 l I`.** This password is read by a person out of an email, not by a machine.
- 16 characters of a 55-character alphabet — about 92 bits, and still retypable.
- **It is never logged**, and exists in exactly two places: the email, and the bcrypt hash.

**THE STRONGEST TEST IN THE CHUNK:** the emailed password is fed to the real `POST /auth/login` endpoint and must return 200 with `role: client`. Everything else could pass while the emailed password did not match the stored hash, and nobody would find out until a real person was locked out of something they had paid for. A second test confirms the stored document holds a `$2b$12$` hash and that the plaintext appears nowhere in it.

**A SECURITY NOTE, RECORDED RATHER THAN ACTED ON.** A password sitting in an inbox is a standing credential until it is changed, and nothing forces a change. The stronger pattern reuses the reset-token machinery from chunk 1.5 — create the account with a random hash nobody knows, and email a single-use, 30-minute "set your password" link instead. Same number of steps for the client, no password ever transmitted. Raised before building; the developer chose the briefed approach, which the spec supports. **Worth revisiting at chunk 12.3 (security hardening).** The email itself asks the client to change the password after signing in.

---

### THE MOCK RIPPLE DID NOT HAPPEN, AND THAT IS THE POINT

Adding `sendClientWelcomeEmail` to the email service is the fifth time a sender has been added. The first four (chunks 1.5, 2.6, 4.3 and 4.5) each broke several unrelated suites with an opaque ESM link error.

This time it was **one line** in `test/emailServiceMock.js`, and `emailMockParity.test.js` would have named the missing function had it been forgotten. The root fix from chunk 4.5 worked exactly as intended.

---

### TWO STALE TEST PREMISES CORRECTED

Both were tests asserting things that used to be true and quietly stopped being true. Neither was a code defect — the behaviour under test is unchanged.

1. **`adminStats.test.js` asserted the `subscriptions` collection did not exist.** It does now: chunk 6.1 added the model, and Mongoose builds indexes on connect, which creates the empty collection. The dashboard still reports zero for every figure — that part is unchanged and still asserted. The assertion now covers only `sessions` and `reviews`, which genuinely have no model yet. Keeping the old claim would have pinned an accident of when a model happened to be written.

2. **`webhook.test.js` defaulted its events to `checkout.session.completed`.** That event now really creates an account, which needs a draft that suite deliberately does not seed — so six transport tests started failing with a 500. The default is now a non-account event type, and the routing matrix sends an *unpaid* checkout session. **That suite is about the transport** — signatures, raw bytes, the ledger, idempotency — and account creation now has its own suite against a replica set. The separation is clearer than it was.

---

**Verified:**
- `npm test -- --runInBand` — **882 tests across 31 suites, all passing** (864 from earlier chunks, 18 new).
- `npm run lint` — clean.
- **Mutation-checked twice**, as above: the transaction (2 tests) and the idempotency guard (1 test).
- Tests cover everything the brief asked for and several things it did not: the four documents and the consumed draft, rollback leaving zero of each, a couple as one account, a deactivated therapist, a duplicate webhook, **the emailed password logging in for real**, the amount stored as 20000, both Stripe identifiers recorded, the period end taken from Stripe and the fallback when it cannot be, no email on rollback, and the account surviving a failed email.

**Manual steps for the developer:**
1. **No new packages, no new environment variables, nothing to configure.**
2. **The live end-to-end run is still outstanding**, and it is the one thing worth doing before 6.5. It needs the Stripe CLI, which was set up but never used — `STRIPE_WEBHOOK_SECRET` is still absent from `server/.env`. See below.

**THE LIVE CHECK NOT YET RUN — carried from 6.3, and now more valuable:**

The whole pipe can be proven in one pass once `stripe listen` is running:

1. `stripe listen --forward-to localhost:5000/api/v1/webhooks/payment`, copy the `whsec_` into `server/.env`, restart the API.
2. Create a real checkout session (chunk 6.2's endpoint), pay it with Stripe's test card `4242 4242 4242 4242`.
3. Confirm in Atlas: one `users`, one `clientprofiles`, one `bookings`, one `subscriptions`, the `pendingcheckouts` draft **gone**, and one `paymentevents` row.
4. Sign in at `/login` with the emailed password.

**Step 4 will not work until pre-launch blocker 7 is done** — `EMAIL_FROM` is still the Resend test sender, so the welcome email only reaches the Resend account owner's address. The account is created regardless, which every test proves.

**Carried forward:**
- **Slice 11** now has real records to act on: renewal extends `currentPeriodEnd` and resets `sessionsRemaining` to 4; failure moves to `past_due`; cancellation keeps access to period end. All four handlers are still stubs.
- **Chunk 12.3:** consider replacing the emailed password with a set-password link; and restrict the production database user's rights on `paymentevents` (from 6.1).
- Chunk 6.5 (checkout UI) must map `partner1`/`partner2` into `coupleData`; `/welcome` and `/checkout` still do not exist.
- The 11 remaining `{VALUES}` enum messages (6.1). Remove the seeded therapists before launch (blocker 13). Whether rejected applicants are emailed (4.3).

**Pre-launch blockers — unchanged, the list stands at 13.** No placeholder content was created.

**Not done (out of scope, by design):**
- **No renewal, failed-payment or cancellation handling** — slice 11. Those three handlers still log and return.
- No checkout UI (6.5), no `/welcome` page (6.6), no forced password change on first login.
- No PayPal. No refund logic — §12 puts refunds in Asad's dashboard for v1.

---

## Chunk 6.5 — Checkout UI and renewal disclosure

**Status: Complete.** Nothing skipped. **Not seen rendered** — see "Yours to check". The intake journey now runs from "Get started" all the way to Stripe's hosted payment page.

Built — client:
- `pages/Checkout.jsx` · `pages/CheckoutCancelled.jsx`
- `components/checkout/` — `TherapistSummary` · `IncludedGrid` · `RenewalDisclosure` · `BillingRhythm` · `CheckoutIcons`
- `data/checkoutContent.js` · `lib/toCheckoutPayload.js` · `lib/api/checkoutApi.js`
- Edits: `App.jsx` (two routes), `data/matchesContent.js` (the "built in slice 6" copy was stale), `pages/TherapistDetail.jsx` (Choose now continues to checkout).

Edited — server:
- `services/checkout.service.js` — `cancel_url` now points at `/checkout/cancel`, and its test asserts the full path.

**No new packages, no new environment variables.**

---

### THE DESIGN PROBLEM, AND THE THESIS

The default build is a price, a bulleted list of inclusions, a yellow warning panel and a button. It is inert, and the yellow is banned anyway — gold on a light surface is 1.63:1.

**The person leads, the price supports.** Every other checkout puts the order summary first. Here there is no form to fill — Stripe's hosted page collects the card — so the page's only jobs are *who you are starting with*, *what it costs*, and *the terms, unmissably*. Leading with the therapist follows §24.7's "enough warmth to make a human choice feel possible", and it is the one moment in the flow where the commitment stops being abstract.

**The frame is the split already used by `/contact`, `/join-as-therapist` and `/questionnaire`** — dark `ink-deep` aside with a soft sage radial wash, light column beside it. Four pre-account form surfaces, one product. No vertical band gradients anywhere.

---

### THE DISCLOSURE — WHAT THE CHUNK TURNS ON

§13 calls checkout the most important of the three places the renewal terms appear, and the brief says it must be impossible to miss.

**It sits on an `ink` panel on a `paper` page, and that inversion IS the mechanism.** Prominence comes from contrast, not from an alarm colour — `clay` or amber would signal that something is wrong, and nothing is wrong. The dark ground also makes gold legible at **11.08:1**, which it can never be on paper, so the accent finally earns a job here.

Two things, together:

1. **The required sentence, quoted verbatim from §13**, at body size and never in a caption. It is a commitment to the person paying, not copy to tighten. `data/checkoutContent.js` says so at the field.
2. **The billing rhythm, drawn.** Four marks on a rule: the first filled gold and labelled "Today", the next three outlined and fading, the rule itself dissolving to transparent at the right edge — because the billing does not stop either. Caption: *Every month, until you cancel.*

That second piece is transparency rather than decoration: it makes the recurring nature **more** visible, which is the opposite of burying it. The marks are `aria-hidden`, so the caption has to stand alone for a screen reader, and it does.

---

### THE MOBILE FOLD — THE BRIEF'S OWN VERIFY STEP

"Visible without scrolling on mobile" is a real constraint, and it drove a real layout decision: **`IncludedGrid` is hidden below `lg` in the aside and rendered after the button instead.** Four descriptions in the aside would have pushed the disclosure under the fold on a 360×640 screen.

Budget at 360×640: navbar 72 + therapist row ~96 + heading and intro ~110 + price ~76 + disclosure ~230 ≈ 584px, so the disclosure ends on screen and the button sits just below it.

**That arithmetic is a model, not a measurement.** It is the first item in "Yours to check".

**No DOM duplication** — exactly one copy of the inclusions is in the layout at a time via `hidden` / `lg:block`, which resolves to `display:none` and leaves the accessibility tree with one. The chunk 2.3 comparison table set that precedent.

---

### DECISIONS MADE

- **`/checkout/cancel` is a page, not a query-param mode.** Chunk 6.2 set `cancel_url` to `/checkout?status=cancelled`; this brief asks for `/checkout/cancel`, so the server constant moved. **A server edit inside a UI chunk, flagged rather than slipped in** — one line plus its test assertion, which was tightened from `/checkout` to the full path so the two cannot drift apart again.

- **The cancel page carries NO retention pressure.** No "are you sure", no discount, no countdown, no guilt. §24.1 rules out dark patterns and this is precisely where a lesser product puts one. Somebody who backed out of a €200 commitment may be deciding whether they can afford help at all: the page says nothing was charged, says their answers and their therapist are still there, and offers two plain ways forward.

- **The submit button does not re-enable on success.** Only on failure. The page is navigating to Stripe anyway, and re-enabling would let a second click burn another of the ten attempts an hour the 6.2 rate limiter allows.

- **Every error names the problem AND the way out.** `EMAIL_IN_USE` links back to the questionnaire, `THERAPIST_UNAVAILABLE` links to `/matches`, everything else shows the server's own message with a plain retry. A 409 on a checkout screen with no route onward is a dead end at the worst possible moment.

- **Guards redirect rather than fail.** No answers sends you to `/questionnaire`; no chosen therapist sends you to `/matches`. A shared link or a fresh tab would otherwise fire a request with nothing in it and collect a 422.

- **The inclusions are threaded on one hairline rail, not four cards.** Same-size cards of icon-plus-heading-plus-text as the page structure is the category default, and it turns four different things into four rectangles. The marks sit *on* the rail so the list reads as one thread.

- **Five drawn icons at 1.5 stroke**, matching the existing How It Works / Contact / Join sets. The lock beside the Stripe note is deliberately a plain padlock — a shield would overclaim.

- **No ink wash on the therapist photograph.** §24.5 makes therapist portraits the explicit exception to the site's photo treatment: real people, shown as real people.

- **`sessions do not roll over` is stated before payment, not after.** §13's rule, and someone who discovered it afterwards would be entitled to be annoyed.

- **One authored motion moment** — the billing marks settle in on arrival, ~450ms each on a 110ms stagger, exponential ease-out. The column itself does one quiet 8px settle. Both gated on `useReducedMotion`, and under reduced motion the marks are simply present. Nothing on a page about money should feel like pressure.

---

### THE PAYLOAD MAPPER — A CARRIED ITEM SINCE 5.3 CLOSES

`lib/toCheckoutPayload.js` nests `partner1` / `partner2` under `coupleData` and drops the flat individual fields. The Redux slice holds partners flat because that is what a form binds to; §10.2 stores them nested. **Without this, every couple would 422 — the exact class of bug chunk 3.5 shipped on the therapist form**, where every correctly-filled application was rejected until a mapper was written.

It is kept free of React so it can be executed directly, and it was — **against the REAL server Zod schema, not a copy. 14 checks, all passing**: both branches accepted, ages coerced from string to number on the individual and on both partners, email lowercased and trimmed, no `coupleData` on an individual, no individual fields on a couple, no flat partner keys leaking through either, and the top-level key set exactly `email` / `therapistProfileId` / `questionnaire`.

**The check that proves the mapper is doing work:** the raw un-mapped Redux answers are **rejected** by the same schema. If that ever starts passing, the mapper has become a no-op.

---

### CONTRAST — 21 PAIRS COMPUTED, 0 FAILURES

The detector still runs degraded on this machine and evaluates no contrast at all, so every pair was calculated against the real hex values.

| Pair | Ratio | | Pair | Ratio |
|---|---|---|---|---|
| therapist name, paper on ink-deep | 19.67:1 | | disclosure sentence, paper on ink | 18.06:1 |
| section labels, paper/70 | 9.65:1 | | cadence caption, paper/80 | 11.78:1 |
| included detail, paper/70 | 9.65:1 | | gold billing mark | 11.08:1 |
| included icon, sage | 5.78:1 | | outlined mark, paper/45 | 4.50:1 |
| h1 and price, ink on paper | 18.06:1 | | intro and legal, ink/70 | 6.74:1 |
| lock icon, sage-deep | 5.48:1 | | error text, clay | 5.48:1 |

**The tightest pair is the outlined billing mark at 4.50:1 against a 3:1 graphic floor** — comfortable, and it must not be lightened further or the fading marks stop being visible at all.

---

**Verified:**
- `npm test -- --runInBand` (server) — **882 tests across 31 suites, all passing**, including the tightened `cancel_url` assertion. Unchanged in count by this chunk, which is a frontend one.
- Client build passes. `oxlint` — **0 findings** on every file this chunk touched. (The two remaining warnings, in `Matches.jsx` and `Home.jsx`, are the developer's own and predate this work.)
- **Impeccable detector — `[]`, a genuinely empty result** on all seven new files. Still read it as a degraded pass: the parsing dependencies are absent, so it evaluates no contrast. The table above is the compensation.
- **The mapper executed against the real server schema — 14 checks, all passing** (above).
- Generated CSS confirmed to carry every new value the page depends on: the `2.75rem` price figure, `calc(100dvh - 72px)`, both ambient blurs, `animate-drift`, and the rule's gradient.
- The `<main>` landmark trap was caught during the build and fixed: both new pages first rendered their own `<main>` inside `PublicLayout`'s, which is invalid — the same defect chunk 4.1 caught on the admin 404.
- The `StepIcons` non-component-export trap was caught again in `CheckoutIcons` and fixed at the root — the lookup is built where it is used rather than exported from the icon file.

**YOURS TO CHECK — nothing here has been seen rendered:**

1. **The mobile fold, and it is the brief's own verify step.** At 360px the renewal disclosure must be readable without scrolling. My budget says it lands with room, but that is arithmetic, not a screenshot. **If it falls below the fold, the fix is to move the price above the heading** — one block swap.
2. **The billing rhythm.** Does the row of marks read as "this happens again every month", or as decoration? This is the piece the chunk was built around, and it is the one thing I most want a second opinion on.
3. **The disclosure panel overall** — does a dark panel on a light page read as *important* rather than as *a warning*? That distinction is the whole design bet.
4. **The full flow, now unbroken:** questionnaire → matches → a therapist → Choose → Continue to checkout → Continue to payment → Stripe. This is the first time it runs end to end.
5. **Cancel from Stripe's page** and confirm you land on `/checkout/cancel` with your therapist still chosen.
6. **360px on both pages**, reduced motion on (the marks should be present and still), and keyboard through the button and both legal links.

**Manual steps for the developer:**
1. **No new packages, no new environment variables, no new colour or type tokens.**
2. **Restart the API server** if it is running — the `cancel_url` change is read at session-creation time.

**Carried forward:**
- **`/welcome` does not exist yet** (chunk 6.6), so the success redirect still 404s. Expected.
- The live Stripe CLI run is still outstanding, and this chunk makes it worth more: the whole pipe — checkout UI → session → payment → webhook → four documents → login — can now be proven in one pass. `STRIPE_WEBHOOK_SECRET` is still absent from `server/.env`.
- Chunk 12.3: the emailed password versus a set-password link (6.4); the production database user's rights on `paymentevents` (6.1).
- The 11 remaining `{VALUES}` enum messages (6.1). Remove the seeded therapists before launch (blocker 13). Whether rejected applicants are emailed (4.3).

**Pre-launch blockers — unchanged, the list stands at 13.** No placeholder content was created: every word on both pages is spec-sourced, and the price, inclusions and renewal terms all trace to §2 and §13.

**Not done (out of scope, by design):**
- **No card fields of any kind.** Stripe's hosted page owns that, and the schema strips unknown keys so one could not be sent even by accident.
- No `/welcome` page (6.6). No portal (slice 7).
- No PayPal option — §21 still lists the platform choice as open.

---

### Chunk 6.5 follow-up — the cancel flow bounced to /questionnaire (2026-09-10)

**A bug I shipped in 6.5, found by the developer testing the real Stripe cancel button.** Pressing Stripe's back arrow landed on `/questionnaire` instead of `/checkout/cancel`.

**Their diagnosis was right, and it was worse than the cancel page.**

Redux lives in memory and is never persisted — `store/index.js` says so deliberately. So **any full page load starts it empty**: not just returning from Stripe, but pressing F5 anywhere. Stripe was not doing anything special.

Two gaps had to combine for the symptom:

1. **`selectedTherapist` was saved nowhere.** `writeQuestionnaireDraft` persisted `{ answers, stepIndex }` and nothing else, and `draftRestored` restored the same two. The therapist was written by one reducer, read by two selectors, and never touched storage.
2. **The restore only ran on one route.** `readQuestionnaireDraft` was called in exactly one file — `QuestionnaireFlow.jsx`, which mounts on `/questionnaire` alone. `/matches`, `/therapist/:id`, `/checkout` and `/checkout/cancel` restored nothing, not even the answers.

So: leave for Stripe → JS context destroyed → return to `/checkout/cancel` → Redux blank → my guard `if (!therapist?.id) return <Navigate to="/questionnaire" />` fires → `/questionnaire` mounts and restores the ANSWERS, which is why it looked like being dumped back to the start with everything still filled in.

**Where the original build went wrong:** the guard was written for a cold visitor on a shared link, which is a real case. It did not account for the page being reached by a **cross-origin round trip** — the one situation where a memory-only store is guaranteed to be empty. The two look identical to a guard and need different answers.

---

**THE FIX — three parts, and the second is the one that matters.**

**1. The draft carries the therapist.** `VERSION` bumped to 2, so a v1 draft is discarded rather than restored: restoring one would put the answers back with no therapist, which is exactly the half-state this removes. The snapshot is a name, photo and professional title — all public on `/matches`, adding no sensitivity to a record that already holds concern tags.

**2. The store is SEEDED, not restored in an effect.** `configureStore({ preloadedState })` reads the draft once at module load, before React renders anything.

This is the part worth remembering: **an effect restores one render too late.** The guards on `/checkout` and `/checkout/cancel` run during the first render, so an effect-based restore would redirect first and land the state on a page nobody is looking at. That is the same ordering trap chunk 1.6 hit with the login-page flash, where it needed an explicit `bootstrapping` status. Seeding removes the race rather than working around it.

**3. Persistence moved to the store as well, and this was a second real defect.** The save effect lived in `QuestionnaireFlow` — but the therapist is chosen on `/therapist/:id`, where that component is not mounted. **An effect there could never have seen the choice at all**, so even adding the field to the draft would not have fixed it. Both directions now live in `store/index.js`: preload on creation, `store.subscribe` on change. Blank state still writes nothing, so opening the flow and leaving stores no health answers.

**4. `/checkout/cancel` no longer redirects, ever.** A tab closed at Stripe still loses the draft, and **"nothing was charged" is the one thing that page exists to say** — true either way, and worth saying before anything else. It now degrades: with a therapist it offers Back to checkout and Choose a different therapist; without one it says plainly that we could not pick up where you left off and no account exists, and offers Start again. Redirecting somebody who has just backed out of a payment is confusing and faintly alarming.

**Verified:**
- **13 checks executed against the real modules**, simulating the actual round trip — write the draft, destroy the module context, rebuild the store from storage alone. Covers: the therapist surviving, both page guards no longer firing, every slice key present (`preloadedState` replaces rather than merges), a v1 draft discarded, a cold visitor blank, a 25-hour-old draft dropped, and **a private window that throws on every storage call not crashing the app**.
- **Mutation-checked.** Dropping the therapist from the restore — the original bug — broke **3** checks and reproduced the reported symptom exactly: `selectedTherapist` null, guard redirects. Restored and re-run.
- Client build passes; `oxlint` 0 findings on every touched file; detector clean on the changed page.
- Server suite re-run: **882 tests across 31 suites, all passing** — untouched by this fix.

**Worth knowing:** the version bump discards any draft currently open in a tab. Only affects testing.

**Still not covered, and it is a real limit:** sessionStorage is per tab. If the payment page were ever opened in a NEW tab, the draft would not be there. It is not today — `window.location.assign` navigates the same tab — but anything that later opens checkout in a new tab would reintroduce this.

---

## Chunk 6.6 — Welcome page and payment tests

**Status: Complete.** Nothing skipped. **Slice 6 (payments) is finished.** The intake journey now runs from "Get started" to a live account. **Not seen rendered** — see "Yours to check".

Built — server:
- `GET /api/v1/checkout/session-status` — read-only, one key out.
- `routes/paymentJourney.test.js` — 9 tests walking the whole path in one file.
- Edits: `models/Subscription.js` (`checkoutSessionId`), `services/clientOnboarding.service.js` (records it), `services/checkout.service.js` · `controllers/checkout.controller.js` · `routes/checkout.routes.js` · `constants/checkout.js` · `validation/checkout.schema.js`.

Built — client:
- `pages/Welcome.jsx` · `components/checkout/OutcomeCard.jsx` · `components/checkout/OutcomeMarks.jsx`
- Edits: `pages/CheckoutCancelled.jsx` (rebuilt on the shared card), `lib/api/checkoutApi.js`, `data/checkoutContent.js`, `App.jsx`.

**No new packages, no new environment variables.**

---

### THE PAGE REPORTS. IT DOES NOT CREATE.

§12's golden rule is the whole constraint here, and it pulls against the brief's other requirement — a "setting up your account" state means the page has to *know* whether the account exists.

Resolved by making the page a pure reader. `GET /checkout/session-status?sessionId=cs_...` answers with **one word**:

| Answer | Meaning |
|---|---|
| `ready` | a subscription exists for this session — the transaction committed |
| `processing` | the pending draft is still there — the webhook has not been through |
| `unknown` | neither: expired, or invented |

**Nothing else ever leaves it.** No email, no therapist, no amount, no name — the same discipline chunk 3.2 applied to the application-status endpoint, and for the same reason: a payment confirmation page is a link people paste and screenshot.

**`unknown` deliberately does not separate "never existed" from "expired"**, so the endpoint cannot be used to probe for valid session ids.

**The subscription is what it checks, not the draft.** A subscription exists only if the whole four-document transaction committed, so its presence means the work is genuinely finished rather than merely started.

**A test asserts the endpoint creates nothing** — counts unchanged after repeated calls.

**Query string, not path.** `requestLogger` logs `req.path` and deliberately never the query string (chunk 4.1), and a payment session id has no business in our own logs.

**Rate limit is deliberately loose** — 120 per 15 minutes, against the checkout endpoint's 10 per hour. The page polls every 2s for under a minute, and throttling an honest visitor moments after they paid €200 would be the worst possible time to show them an error.

---

### `checkoutSessionId` ON `subscriptions` — spec addition, approved 2026-09-10

§10.6 does not list it. It is the **only** link from the id Stripe puts in the `/welcome` URL back to the account that was created: 6.4 deletes the pending draft inside the transaction, so nothing else survives to join on.

Without it the poll would need either a Stripe API round trip **on every request**, or a scan inside `paymentEvents.rawPayload`, which is `select: false` and unindexed. One indexed field makes it a single fast lookup, which is what polling needs.

---

### THE TEST SUITE — AND AN HONEST ACCOUNTING

The brief asks for a comprehensive suite covering six areas. **Five were already covered**, and rewriting them would have inflated the count without adding safety:

| Area | Already covered in |
|---|---|
| Checkout session creation | 33 tests (6.2) |
| Webhook signature verification | 27 tests (6.3) |
| Idempotency | 6.3 (ledger) and 6.4 (effect) |
| Four-document transaction and rollback | 18 tests (6.4) |
| Couple account creation | 6.4 |
| Email dispatch on success | 6.4 |

**What genuinely did not exist was a test of the SEAMS between them.** Each chunk tested its own piece against fixtures it built itself. Nothing proved that the session the checkout endpoint creates is the one the webhook can find, that the reference handed to Stripe is the one the draft is keyed by, or that `/welcome` can then see the result.

`routes/paymentJourney.test.js` walks the real path in one file — real signatures, real transaction, real replica set, only Stripe's network faked. It covers the brief's own verify step directly: **complete once, abandon once, replay once, and confirm exactly one account exists from the completed attempt only.**

It also carries the harder replay case: **the same payment reported under a NEW event id.** The ledger cannot catch that one — only 6.4's effect-level guard can — and it asserts two ledger rows but one account and one email.

**A bug in my own test helper, caught by running it.** `createSessionMock.mock.results.at(-1).value` resolves to the whole session object, not the id, so `session.id` arrived as an object and Mongoose threw on the cast — 6 of 9 tests failing with a 500. The helper now takes `.id` off the resolved session.

---

### THE UI — A GROUNDED CARD AND ONE MARK

Developer's requirement, and it was the right call: bare centred paragraphs on an empty page read as an error screen, not as a considered end to something.

Both outcome pages now share `OutcomeCard` — a `paper` card on a `mist` ground with a soft sage wash behind it, radius 16px. **Elevation declared once**: a real shadow with offset and blur, and no border beneath it. A hairline under a soft shadow is the ghost card the craft floor names.

**One drawn mark each, 48px, 1.5 stroke, on its own sage-tinted plate:**

- **`/welcome` — a ring that CLOSES around a check.** The ring draws first and the check follows it in, so the mark reads as something being *finished*, which is what has just happened. Same path-tracing language as the How It Works connector and the 6.5 billing rhythm. Deliberately not a filled green success badge.
- **`/checkout/cancel` — a bookmark ribbon.** Chosen over a pause mark because a bookmark says *your place is kept*, which is exactly what that page means. A pause reads mechanical; a cross would read as failure when nothing failed. **Static — nothing there is being celebrated.**

Both gated on `useReducedMotion`: the ring is simply present, complete, when motion is reduced.

**Four states on `/welcome`, each with its own honest copy:**

| State | What it says |
|---|---|
| `processing` | payment went through, account being made, safe to leave the page |
| `ready` | account open, check your email, and what to do first |
| `slow` (after ~40s) | **honest, not reassuring** — payment is safe, account still being set up, contact us if nothing arrives within an hour |
| no `session_id` | **never claims a payment happened** — a bookmark or direct visit gets a neutral message |

**A failed status check is never reported as a payment failure.** It says nothing about whether the money moved, and telling somebody their payment failed because a poll timed out would be the worst error this page could make.

**One privacy detail:** on `ready`, the sessionStorage draft is cleared. The account exists now, so leaving someone's concern tags in storage until they close the tab is retention with no purpose left.

---

**Verified:**
- `npm test -- --runInBand` — **891 tests across 32 suites, all passing** (882 from earlier chunks, 9 new).
- `npm run lint` (server) clean; `oxlint` (client) 0 findings on every file this chunk touched. Client build passes.
- **Impeccable detector — `[]`** on all four new/changed UI files.
- **Contrast computed, 0 failures.** Card heading 18.06:1 · body `ink/70` 6.74:1 · **the mark, `sage-deep` on its `sage/12` plate, 4.86:1** against a 3:1 graphic floor.

**YOURS TO CHECK — nothing here has been seen rendered:**
1. **The two marks.** Does the closing ring read as *completion* rather than a tick badge, and does the bookmark read as *your place is kept*? These are the two pieces the UI requirement was about.
2. **The card on both pages** — grounded and premium, or still floating?
3. **The processing state.** Easiest way to see it without racing the webhook: stop `stripe listen`, pay, and watch it sit on "setting up" and then fall through to the honest "taking longer than usual" after ~40 seconds.
4. **360px** on both, and reduced motion (the ring should be present and complete, not animating).

---

### MANUAL TEST CHECKLIST — the four scenarios

Run with both dev servers up and `stripe listen --forward-to localhost:5000/api/v1/webhooks/payment` in a third terminal, with the printed `whsec_` in `server/.env`. Test card **4242 4242 4242 4242**, any future expiry, any CVC.

**Before each run**, note the baseline: `users`, `clientprofiles`, `bookings`, `subscriptions`, `pendingcheckouts`, `paymentevents`.

**1. Successful payment**
- Questionnaire → matches → a therapist → Choose → Continue to checkout → Continue to payment → pay.
- Expect: redirected to `/welcome`, briefly "Setting up your account", then "You are all set".
- Atlas: **+1** user (role `client`), **+1** clientProfile, **+1** booking, **+1** subscription, **+1** paymentEvent, and the `pendingcheckouts` draft **gone**.
- Subscription: `amount` **20000**, `currency` EUR, `sessionsRemaining` **4**, `checkoutSessionId` set.
- Sign in at `/login` with the emailed password. **Blocked by pre-launch blocker 7 until the Resend domain is verified** — the account is created regardless.

**2. Abandoned payment**
- Reach Stripe's page, press the back arrow.
- Expect: `/checkout/cancel`, "Nothing was charged", your therapist still shown, Back to checkout works.
- Atlas: **no** new user, profile, booking or subscription. The draft is still there and expires on its own.

**3. Duplicate webhook**
- After a successful run, take the event id from the CLI output and `stripe events resend evt_...`.
- Expect: 200 again. Atlas: **exactly one** `paymentevents` row for that id, **still one** account, and **no second welcome email**.

**4. Already-registered email**
- Run the questionnaire again using the email from scenario 1.
- Expect: **409 before Stripe is ever called**, with the neutral "an account already exists" message and a link back to change it.
- Atlas: no new draft, and the Stripe dashboard shows **no** new checkout session.

---

**Manual steps for the developer:**
1. **No new packages, no new environment variables.**
2. **Restart the API server** — the new route and the `checkoutSessionId` field are read at startup.
3. **`STRIPE_WEBHOOK_SECRET` is still absent from `server/.env`**, so the live run above is still outstanding. It is now the single most valuable thing left in this slice: it proves checkout → webhook → four documents → `/welcome` → login in one pass.

**Carried forward:**
- Slice 11 owns renewal, failed payment and cancellation — all three handlers are still stubs.
- Chunk 12.3: the emailed password versus a set-password link (6.4); the production database user's rights on `paymentevents` (6.1).
- **sessionStorage is per tab** (from the 6.5 follow-up): if checkout were ever opened in a new tab, the draft would not be there.
- The 11 remaining `{VALUES}` enum messages (6.1). Remove the seeded therapists before launch (blocker 13). Whether rejected applicants are emailed (4.3).

**Pre-launch blockers — unchanged, the list stands at 13.** No placeholder content was created.

**Not done (out of scope, by design):**
- **No account creation on `/welcome`** — the endpoint it calls is read-only, and a test asserts it writes nothing.
- No portal behind the sign-in button (slice 7). No renewal, past-due or cancellation handling (slice 11).
- No PayPal — §21 still lists the platform choice as open.

---

## Chunk 7.1 — Client portal shell and access gate

**Status: Complete.** Nothing skipped. **Slice 7 has started.** Verified live against the real Atlas cluster with a throwaway client created and then deleted; the rendered screens are yours.

Built — server:
- `middleware/requireActiveSubscription.js` — the gate, plus `resolveAccess` and `findCurrentSubscription`.
- `services/clientPortal.service.js` · `controllers/clientPortal.controller.js`
- `routes/client.routes.js` — `GET /api/v1/client/me`, then the gate.
- `constants/clientPortal.js`
- `routes/clientPortal.test.js` — 34 tests.
- Edits: `routes/index.js` (mount), `routes/dev.routes.js` (one gated route, see below).

Built — client:
- `pages/portal/ClientPortalShell.jsx` — the client's chrome.
- `pages/portal/client/` — `Chat` · `Worksheets` · `Journal` · `Sessions` · `Account`.
- `components/portal/client/` — `ClientRail` · `ClientTabBar` · `TherapistPresence` · `AccessNotice` · `SubscriptionEnded` · `PortalSkeleton` · `ScreenScaffold` · `ClientPortalIcons` · `navIcons`.
- `lib/therapistAvailability.js` · `lib/clientPortalContext.js` · `lib/api/clientPortalApi.js` · `data/clientPortalContent.js`
- Edits: `App.jsx` (five child routes), `pages/portal/PortalLayout.jsx` (branches by role), `pages/portal/PortalHome.jsx`, `lib/workingHours.js` (two helpers exported).

**An edge case closed before it shipped:** the five child routes belong to the client, and `Account` reads the client portal context — which the therapist's shell does not provide, so a therapist who typed `/portal/account` would have hit a thrown error and a blank screen rather than something merely odd. `PortalLayout` now sends a non-client on any child path back to `/portal`, which is the same "redirected, not refused" call `ProtectedRoute` makes.

**No new packages, no new environment variables, no new colour tokens.**

---

### THE DECISION THE CHUNK TURNS ON: /client/me IS NOT BEHIND THE GATE

Everything else under `/api/v1/client` is. `router.use(requireActiveSubscription)` sits *after* the `/me` route, so chat (7.2), worksheets (8.5), the journal (8.6) and the session hub (9.4) are all gated by default, and a new route would have to be deliberately mounted above that line to escape it — the same router-level discipline as the admin mount in 4.1.

`/me` is exempt because **it is the endpoint that reports access**. Behind the gate it would return a bare 403, and the browser could not tell "your subscription ended" from "something broke" — leaving slice 12's re-subscribe screen with nothing to render and an anxious person looking at an error. It leaks nothing: their own account, their own answers, the therapist they already chose, the state of their own subscription.

Two tests pin it, and the live run confirmed it against a genuinely expired record.

---

### THE STATE MACHINE, AND THE CASE WORTH READING TWICE

| Stored status | Resolved access | Gated routes |
|---|---|---|
| `active` | `active` | open |
| `past_due` | `past_due` | **open** — §13 gives a ~3-day grace period with a banner, not a lockout |
| `cancelled`, period still running | `ending` | **open** — §13: never cut off mid-paid-period |
| `cancelled`, period passed | `ended` | 403 `SUBSCRIPTION_ENDED` |
| `expired` | `ended` | 403 |
| no subscription at all | `ended` | 403 — fails closed |

The cancelled case is the one that bites. A client who cancels keeps everything until the end of the period they already paid for; cutting them off early would be a refund problem as well as a broken promise. Slice 11 will flip the stored status on that same boundary, and this comparison is what keeps the two in step in the meantime.

**The gate FAILS CLOSED**, as `requireRole` does: no `req.user` means 401, never a pass-through. A guard that waves requests through when it is misused is worse than no guard, because the route still looks protected in the code.

**Mutation-checked twice.** Making a cancelled subscription always allowed broke **3** tests; making the gate never refuse broke **4**. Both restored and the suite re-run.

---

### DECISIONS MADE

- **The response carries BOTH the resolved access and the stored status.** `access: "ending"` decides what renders; `subscription.status: "cancelled"` is what the screen says out loud. One without the other means either the UI guesses or the copy lies.
- **The therapist projection is an allowlist**, not a denylist — a denylist leaks whatever a later chunk adds to `therapistProfiles`. Every field on it is already public on `GET /api/v1/therapists/:id`, which the client read before paying, so nothing new is exposed. `workingHours` and `timezone` are included because §7.1 needs them at the top of the chat, which saves 7.4 a second endpoint.
- **The therapist's PROFILE id goes out, never their user id.** A test asserts the two differ and that the user id appears nowhere in the payload.
- **The Stripe identifiers are withheld.** `platformSubscriptionId`, `platformCustomerId` and `checkoutSessionId` have no use in a browser; slice 11 will open Stripe's billing portal server-side rather than handing the customer id to the page.
- **`privateNotes` is never imported, queried or joined by the portal service**, and the file carries a comment marking that boundary. §8.5 requires the separation to be architectural, not a filter on a response.
- **One temporary route, `GET /api/v1/dev/client-gated`.** No real client route is gated yet — 7.2's chat is the first — so this is the only way to exercise the gate by hand. It went into `dev.routes.js`, which exists for exactly this (1.4), is mounted only outside production, and is already pre-launch blocker 6, so it adds no new debt.

---

### THE UI

**The frame is the one the site already has.** `/contact`, `/join-as-therapist`, `/questionnaire` and `/checkout` all use a dark ink aside with a soft sage wash beside a light work area. The portal is the fifth surface in that family rather than a new place the client has been moved to. Content sits on `mist` with `paper` panels — warmer than the admin's flat paper, which is the difference §24.8 asks for. Flat seams and radial glows only; no vertical band gradients.

The rail is dark for an accessibility reason rather than a stylistic one: gold is 1.63:1 on a light surface and is never permitted as text or an indicator there, so ink is the only ground in a portal where the accent can mark the current section (11.08:1).

**The rail opens with the therapist, not with a product name.** Photo, name, credentials, and one factual line built from the working hours — *"In clinic today · Until 12:30"* or *"Next in clinic: Monday, 9:00 AM"* (wording revised 2026-09-13, see the follow-up below). A client has exactly one therapist (§7) and that is what their portal is about.

**It is NOT presence, and that is deliberate.** §7.1 rules out any "unavailable" barrier and says a message simply waits. There is no online dot, nothing is greyed out, and the line gates nothing — it reports published hours so someone knows roughly when to expect a reply.

**The phone gets a bottom tab bar, not a drawer.** Five items is what a thumb-reachable bar is for, and every section is one tap from every other. The admin's drawer suits dense tables; this suits a client. Exactly one of the bar and the rail is in the DOM at a time, so a screen reader never meets the same navigation twice. The active item is marked three ways — gold icon, weight, and a rule above it — so it never depends on colour alone.

**The placeholder screens are designed and carry things that are already TRUE**, rather than describing software that does not exist: the journal leads with §7.3's transparency note (your therapist reads every entry), the worksheets screen draws §7.2's real four-step loop, sessions states that your therapist schedules them and you cannot move one yourself (§7.4). **No timelines anywhere** — none has been agreed, and a missed date reads worse than saying nothing, the same call made on the application confirmation screen (3.5).

Each also carries one quiet line saying that part is not switched on yet. A screen that describes a feature warmly and then does nothing reads as broken software, and someone paying €200 a month is entitled to know which it is.

**`/portal/account` is a read-only summary** — developer's decision, 2026-09-12. Status, plan, sessions left with the no-carry-over rule (§13), next payment with §13's required "cancel before this date" sentence, and the client's own details. **No cancel button and no payment-method controls**: 11.3 and 11.5 own those, and the screen says so rather than leaving someone hunting for a control that does not exist.

**The expired screen carries NO reactivate button.** Slice 12 builds that flow; a button that goes nowhere is worse than none, particularly for someone who may have let the subscription lapse because money is tight. The mark is a bookmark — their place is kept, which is exactly what §13 promises.

**No retention pressure on the ending notice.** No discount, no "are you sure", no warning about what they will lose. Dark patterns on cancellation are excluded outright, and this is precisely where a lesser product puts one.

---

### A REAL CONTRAST FAILURE, FOUND BY MEASURING

| What | Was | Now |
|---|---|---|
| Past-due notice title, `clay` on `clay/8` over **mist** | **4.42:1 FAIL** | `clay` on `clay/8` over **paper** — **4.90:1** pass |

A tint composites over whatever is behind it, and the content ground is mist. Putting the notice on a paper base lifts the title to 4.90:1 and its body copy to 6.01:1. It looked entirely reasonable in the source.

**43 pairs computed, 0 failures after the fix.** The three tightest, none of which may be lightened: the past-due title at **4.90:1**, the worksheet step numeral and the past-due button label at **5.48:1**.

Selected: rail name 18.06:1 · rail credentials and hours 9.20:1 · active nav label 13.75:1 · active nav icon 8.44:1 · tab bar gold 11.08:1 · screen heading on mist 16.25:1 · screen lead 6.41:1 · journal panel heading 15.08:1 and body 5.95:1 · account value 19.67:1 · ended mark 4.85:1. Decorative and exempt: the sage rails at 1.49:1 and the `ink/12` dividers at 1.28:1.

---

### ONE DEVIATION FROM THE TYPE SCALE, FLAGGED RATHER THAN SLIPPED IN

The tab bar labels are **11px**, below the scale's 14px caption floor. At 360px each tab has about 64px of usable width and "Worksheets" does not fit at 14px. The icon carries the meaning and the label confirms it, which is the standard tab-bar relationship. Same footing as the `--text-ui` step added in 0.4 — if it should instead be 14px with shorter labels, that is one line here plus the labels in `data/clientPortalContent.js`.

---

### THE HOURS LINE WAS EXECUTED, NOT ASSUMED

Recurring working hours are the piece most likely to be silently wrong, so `lib/therapistAvailability.js` reuses the DST-safe two-pass conversion from `workingHours.js` (5.6, 21 tests) rather than carrying a second copy — two screens disagreeing about a Perth therapist's Monday is exactly what a duplicate causes. Two helpers were exported from that module for it.

**22 checks executed against fixed zones and fixed instants**, so the results do not depend on today: Kolkata to Dublin inside hours and before hours; after hours rolling to tomorrow; **a Friday evening correctly finding next Monday** (the reason the search window is two weeks — a one-week window answers "never"); **Perth to Toronto**, where the day rolls back; a 22:00–02:00 span treated as ending next day rather than going backwards; India's half-hour offset preserved; **the same schedule either side of a DST change**, where the viewer's end time moves and nothing is hardcoded; and every degradation path — no hours, no zone, all days disabled, malformed times, and an unrecognised IANA zone — returning "unknown" instead of throwing.

**A real improvement came out of running it.** `hour: 'numeric'` rendered "4:30" in a 24-hour locale, which is ambiguous with no am/pm to disambiguate it. `timeStyle: 'short'` is idiomatic in both conventions — en-GB "12:30", en-US "7:30 AM", de-DE "13:30" — and all three were checked.

---

**Verified:**
- `npm test -- --runInBand` — **925 tests across 33 suites, all passing** (891 from earlier chunks, 34 new).
- `npm run lint` (server) clean; `oxlint` (client) **0 findings** on every file this chunk touched. The six remaining warnings are the developer's own in `home/Hero.jsx`, `home/Services.jsx`, `pages/Home.jsx`, `pages/Matches.jsx` and `about/WhyCardsDeck.jsx`, open since 2.2.
- Client build passes. Generated CSS confirmed to carry every new value the shell depends on: the 272px rail column, `env(safe-area-inset-bottom)`, `blur(130px)`, `motion-safe:animate-pulse`, `backdrop-blur`, the 11px label and the card shadow.
- **43 contrast pairs computed, 0 failures** (table above).
- **22 availability checks executed** (above).
- Impeccable detector — an empty result, and **read that as a degraded empty**: `htmlparser2`, `css-select`, `css-tree` and `domutils` were re-checked this chunk and are all still absent, so it evaluates no contrast at all. The computed table is the compensation.
- **Mutation-checked twice** on the gate, as above.

**LIVE AGAINST THE REAL SERVER AND REAL ATLAS — 31 checks, all passing.** Authorised by the developer, 2026-09-12. A throwaway client was created **through the real onboarding transaction** (`createClientAccount`, the same path the webhook uses) against a **seeded** therapist, never the real one:
- all four documents created, the pending draft consumed inside the transaction;
- the client signed in at `/api/v1/auth/login` and reached `/client/me` with the therapist, their working hours and timezone, `amount` 20000 and `sessionsRemaining` 4;
- **no bcrypt hash, no Stripe id, no taxpayer id or street address, and the therapist's user id nowhere in the payload**;
- the gate opened for `active`, `past_due` and cancelled-inside-period, and returned **403 `SUBSCRIPTION_ENDED`** for cancelled-past-period and for **expired — the chunk's own verify step**;
- **`/client/me` still answered 200 while expired**, reporting `ended` and still naming the therapist;
- restoring to active reopened the gate.
- **Everything created was deleted and the cluster confirmed byte-identical to its baseline**: 14 users, 2 client profiles, 2 bookings, 2 subscriptions, 3 drafts before and after, with zero throwaway records left.

**This also proved chunk 6.4 live for the first time** — that entry's end-to-end run had never been done. The welcome email failed, as expected (blocker 7), and the account was created regardless, which is the behaviour 6.4 designed for.

**Worth knowing: two real client accounts now exist in Atlas** (`testclient1@example.com` and `muhammadhussnainrauf000@gmail.com`), each with a booking and an active subscription. The developer completed the live Stripe run since the 6.6 entry was written. **You can sign in as either and see this portal against real data.**

**Yours to check — nothing here has been seen rendered:**
1. **The therapist at the top of the rail.** Does the hours line read as warm and useful, or as clutter? It is the piece the shell was built around, and the one thing I cannot judge from here.
2. **The bottom tab bar at 360px** — five labels at 11px, and whether the gold rule above the active icon reads as a marker rather than a stray line.
3. **The past-due banner.** Does it read as unmissable and calm, or as an alarm? That distinction is the whole design bet.
4. **The expired screen** — sign in as a real client, set their subscription to `expired` in Atlas, and confirm the portal is replaced by it. Set it back afterwards.
5. **360px throughout**, and reduced motion on (the skeleton should not pulse, the ended card should not rise).
6. **Keyboard**: tab through the rail and the tab bar, and confirm the focus ring is visible and gold on the ink ground.

**Manual steps for the developer:**
1. **No new packages, no new environment variables, no external accounts, no new colour or type tokens.**
2. **Restart the API server** — the `/api/v1/client` mount and the new dev route are read at startup.
3. To try the gate by hand: `GET /api/v1/dev/client-gated` with a client's token, then flip that client's subscription to `expired` in Atlas and call it again. 200 becomes 403.

**Carried forward:**
- **The four placeholder screens are replaced by 7.2–7.6 and slice 9.** Each says plainly it is not switched on; none may ship in that state.
- **Slice 11 must flip a cancelled subscription to `expired` on the same `currentPeriodEnd` boundary the gate compares against**, or the two readings drift apart.
- Slice 12 replaces `SubscriptionEnded` with the real re-subscribe flow; 11.3 adds cancellation and 11.5 the payment-method controls the account screen currently says are unavailable.
- `clientProfiles` has no timezone field, so the portal uses the browser's zone — the settled pattern since 5.6.
- Chunk 12.3: the emailed password versus a set-password link (6.4); the production database user's rights on `paymentevents` (6.1). The 11 remaining `{VALUES}` enum messages (6.1). Whether rejected applicants are emailed (4.3).

**Pre-launch blockers — unchanged, the list stands at 13.** No placeholder content was created: every word in `data/clientPortalContent.js` is a spec fact or a description of a screen. **Blocker 6 now also covers `GET /api/v1/dev/client-gated`**, added to the same file.

**Not done (out of scope, by design):**
- **No re-subscribe screen** (slice 12), per the chunk's own "Do NOT".
- **No feature content** — no chat, no worksheet upload or download, no journal writing, no session list. Those are 7.2–7.6, 8.5 and slice 9.
- No cancellation and no payment-method management (11.3, 11.5).
- The therapist portal is untouched — slice 8 replaces its shell with the inbox.

---

### Chunk 7.1 follow-up — clinic language on the availability line (2026-09-13, developer)

**The wording changed.** *"Back tomorrow at 12:00 PM your time"* read as a closed door and wrapped onto two lines in a 272px rail. Replaced with clinic language:

| State | Line |
|---|---|
| In hours | `In clinic today · Until 12:30 PM` |
| Later today | `Next in clinic: Today, 4:30 PM` |
| Tomorrow | `Next in clinic: Tomorrow, 12:00 PM` |
| Beyond | `Next in clinic: Monday, 9:00 AM` |

Measured across locales the new lines run **28–32 characters**, against 34–35 before, so they sit on one line in the rail.

**The `your time` suffix was dropped, on instruction, and the trade-off is worth recording.** Every time on this line is still converted into the reader's own zone — that logic did not change — but the line no longer says so. A Dublin client reading a Kolkata therapist's hours now has no on-screen cue that the conversion already happened, and §15's whole premise is that neither party does the arithmetic. **The chat header (7.2) is where that reassurance now lives** and it must carry it; the copy below does. If the rail ever needs it back, it is one string in `availabilityLabel`.

**Two icons instead of one, following the intent of the spec rather than its glyphs.** The wording spec sketched 🕒 for "next" and 🌿 for "in clinic". Emoji are banned as an icon system by the craft rules — they render in a different style on every platform, which is the exact problem the one-stroke-weight set exists to solve — so a **drawn `SproutIcon`** was added beside the existing clock, at the same 1.5 stroke. Something growing when they are here, a clock when they are not. Bounds-checked against the 24 viewBox including stroke: x 4.5–18.9, y 6.25–21.25, comfortably inside.

**Verified:** the 22 availability checks re-run against the new strings, **all passing** — every timezone, rollover, overnight and DST case is unchanged, only the wording moved. Client build passes, `oxlint` 0 findings, detector empty (degraded, as always). No server change, so the suite is untouched at **925 across 33**.

**Not seen rendered.** Worth a glance at whether `In clinic today · Until 12:30 PM` holds one line at 272px with a long therapist name above it.

---

### CARRIED TO CHUNK 7.2 — the chat header transparency note

Approved wording, to sit at the top of the chat area (§7.1 already requires the therapist's working hours there; this is the reassurance around them):

> Feel free to message [Therapist name] anytime — whenever thoughts or feelings arise. They typically review messages during their regular hours ([Hours]), but read and reply as soon as they are available. Take all the time you need to write.

Three notes for whoever builds it:

1. **The pronoun must not be hardcoded.** The developer's draft read "She typically reviews". Therapists are any gender, and `therapistProfiles.gender` exists — but a template that switches on it will read wrong for anyone it does not fit. Neutral "they" above is the safe default and needs no lookup.
2. **It pairs with, and does not replace, the hours display §7.1 requires.** `[Hours]` is the therapist's own published hours; the rail already converts them, and `lib/therapistAvailability.js` is there to reuse.
3. **It makes no promise about reply speed** — "as soon as they are available", never a number. Consistent with every other surface: no invented timelines anywhere on this platform.

---

### Standing directive — every screen must look premium (2026-09-13, client)

Recorded in `.claude/rules/frontend.md` (its own section, ahead of Visual Latitude) and summarised in `CLAUDE.md`, so it loads every session and does not need restating per chunk.

> Make the UI genuinely premium, polished and consistent. **Do not put plain text inside bare boxes.** Use real visual language — considered hierarchy, drawn icons, subtle graphics, elegant styling — so the platform feels high-end, beautiful and visually engaging rather than merely correct.

The rules file spells out what that rules out, because "correct but flat" has recognisable shapes: a heading-paragraph-rectangle stack repeated down a page, text doing a job a drawn element would do better, unstyled defaults, and one flat depth across a whole screen. **Portals are included** — §24.8 makes them denser and quieter, not plainer. The accessibility floor and the eight palette tokens still outrank all of it, and §24.9's line holds: natural, not decorated.

---

## Chunk 7.2 — Messages model and chat REST endpoints

**Status: Complete.** Nothing skipped. Verified live against the real Atlas cluster using the two real client accounts, with every message created then deleted.

Built:
- `models/Message.js` · `models/Message.test.js` (11 tests)
- `services/chat.service.js` · `controllers/chat.controller.js`
- `routes/chat.routes.js` · `validation/chat.schema.js` · `constants/chat.js`
- `routes/chat.test.js` — 36 tests.
- Edits: `routes/index.js` (mount), `middleware/requireActiveSubscription.js` (a clients-only variant).

**No new packages, no new environment variables.**

---

### WHERE IT MOUNTS, AND THE FOUR LAYERS

Chat is the one surface both roles share, so it belongs under neither `/client` (client-only, gated) nor `/therapist`. New mount at **`/api/v1/chat`**, with four layers that each do a different job:

1. `requireAuth` — who is this
2. `requireRole(CLIENT, THERAPIST)` — **the admin is refused outright.** §11 records that an admin conversation viewer was proposed and the client decided against building it; refusing by role means there is no route through which chat content could reach them by mistake. Two tests pin it.
3. `requireActiveSubscriptionForClients` — §13, clients only (below)
4. **Membership, per request, in the service** — the layer that actually protects a conversation

---

### THE AUTHORISATION, AND WHY EVERY REFUSAL IS A 404

The `bookingId` comes from the URL, so it is attacker-controlled. Membership is proved against the stored booking — `clientId` or `therapistId` must be the caller — and never inferred from role.

**A booking that does not exist, a malformed id, and somebody else's booking all return the identical 404.** A 403 for the third case would confirm the id is real, which is all that is needed to enumerate booking ids by comparing responses. A test asserts all three response bodies are byte-identical.

**Mutation-checked: removing the membership check broke 5 tests.**

---

### THE SUBSCRIPTION GATE CLOSES ON ONE SIDE ONLY

Developer's decision, 2026-09-13. An expired client loses the conversation along with the rest of their portal (§13). **The therapist keeps read access**, because the thread is their clinical record of the relationship and taking it away because somebody else's card failed penalises the wrong party.

Implemented as `requireActiveSubscriptionForClients`, which wraps the existing gate rather than copying its logic — one source of truth for what "expired" means. A `past_due` client still passes, as everywhere else.

---

### DECISIONS MADE

- **CURSOR PAGINATION, NOT OFFSET — and the reason is the whole point.** A conversation grows at the end while it is being read. With `?page=2`, a message arriving between two requests shifts every row down, so page 2 re-serves a message page 1 already showed and eventually skips one. A cursor means "the thirty before this exact point", which is the same answer however much has arrived since. `createdAt` is not unique, so the cursor carries `_id` as the tiebreak and the compound index serves the pair. **A test proves it directly: it reads page one, sends a message, then reads page two and asserts no overlap, nothing skipped, and the new message absent.**
- **`type` IS FORCED SERVER-SIDE, NEVER READ FROM THE REQUEST.** A caller who could set `type: "system"` could forge *"Session scheduled for Thursday at 6pm"* in the other party's voice. System messages are written by the platform alone (9.3). Unknown keys are stripped rather than refused, so the attempt has no effect instead of returning a probe-friendly error — two tests, one over the wire and one reading the stored document.
- **NO RAW `senderId` GOES OVER THE WIRE.** A booking has exactly two participants, so "who sent this" is fully answered by `senderRole` plus a `mine` flag — which means no id from the `users` collection reaches either browser. A test asserts neither user id appears anywhere in the payload.
- **NO `read` FLAG ON A MESSAGE EITHER, and that is a decision rather than an omission.** Returning it on your own messages is a read receipt. §14 does not ask for one, nobody requested it, and on this platform it would be actively harmful: *"she read it four hours ago and has not replied"* is precisely the thought an anxious client does not need. The flag still drives the recipient's unread badge, which is the job §14 gives it.
- **Participants are resolved once per request, not per message.** Names live on the profile collections rather than on `users` (the store-IDs-only rule), so populating a sender per row would be one lookup per message — the N+1 the backend rules name for this exact screen. Two lookups serve a page of any size. **A couple is labelled with both partners** ("Marta and Joris"), because one account is two people (§6).
- **`read` is a single boolean, and that only works because chat is strictly 1:1.** Commented at the model: if a third party ever joined a booking this breaks silently, because the first reader would clear the flag for everyone.
- **Writing to an ended booking is refused (409), reading it is not.** Nothing sets a booking to `ended` yet — slice 11 and the deferred reassignment do — so this is a guard ahead of that rather than a path reachable today.
- **Text is capped at 5,000 characters and sending at 30 a minute** — both approved 2026-09-13. The rate limit is deliberately loose: someone in distress types in short bursts, and a person who hits a wall mid-sentence on a mental health platform is a product failure, not a protected system. It is set to stop automation, not people.
- **`GET /chat/unread-count` returns a total and a per-booking breakdown.** A client has one booking; a therapist has many and §8.1 needs a badge per client. One endpoint, one aggregation, serves both portals.

---

### PRIVACY

**Message text is never logged from anywhere in this code.** It is on the never-log list and a chat message here is the most sensitive text in the product; `requestLogger` already records only method, path and status, and no service or error path echoes the body. A test asserts a refused cross-booking read returns nothing of the other conversation's content.

`privateNotes` is not imported, queried, or reachable from any of this.

---

### A TEST THAT PASSED WHILE PROVING TOO LITTLE, CAUGHT BY MUTATING

Removing `senderId: { $ne: me }` from the unread aggregation — the condition §14 defines the badge by — broke only **1** test. The "badge drops to zero" case seeded only therapist messages, so there were no messages of the client's own to be wrongly counted; it would have stayed green with the exclusion deleted.

Fixed by seeding a reply from the client into that test, so "zero" now proves the exclusion rather than proving `markRead` cleared the booking. **The same mutation now breaks 2 tests**, and the test also asserts the therapist still has that reply waiting.

This is the third false-confidence test the project has caught (1.3, 4.2, now this), and all three came from a test setting up the wrong fixture rather than asserting the wrong thing.

---

**Verified:**
- `npm test -- --runInBand` — **972 tests across 35 suites, all passing** (925 from earlier chunks, 47 new).
- `npm run lint` — clean.
- **Mutation-checked twice:** the membership check broke 5 tests; the unread sender exclusion broke 2 after the test above was strengthened.
- Tests cover everything the brief names and more: both parties reading and writing, cross-booking reads, writes and mark-read all refused, the identical-404 rule, the admin refused, an expired client blocked and their therapist not, a forged `type` and a forged `read` and a forged `senderId` all ignored, the length boundary at exactly 5,000, oldest-first ordering, an empty thread, a couple's label, cursor stability under a concurrent send, an invalid cursor, an absurd limit, unread excluding your own messages, mark-read touching only the right booking, and idempotent marking.

**LIVE AGAINST THE REAL SERVER AND REAL ATLAS — 25 checks, all passing.** Using the two real client accounts and their real therapists, writing only messages:
- a real exchange both directions, returned oldest-first with the therapist named once in `meta` and their working hours carried for the 7.4 chat header;
- **no user id and no read flag anywhere in the payload**;
- a forged `type: "system"` stored as `text`;
- client A refused from booking B on read and on write, with nothing written there, and therapist A refused too;
- the unread breakdown correct from both sides, clearing on mark-read while the other party's reply stayed waiting;
- **an expired client shut out with 403 while their therapist still read the thread** — the decision above, proven on a real subscription;
- restoring the subscription reopened it.
- **Cleanup confirmed:** the cluster held 0 messages before and 0 after, the three created messages were deleted by id, the temporary password hashes were restored to all three accounts, and the subscription status was put back.

**Manual steps for the developer:**
1. **No new packages, no new environment variables.**
2. **Restart the API server** — the `/api/v1/chat` mount is read at startup.
3. Nothing to configure. The endpoints are usable now with any real client or therapist token.

**Carried forward:**
- **Chunk 7.3 (Socket.io) must persist first and emit second.** §14 makes the database the record and sockets delivery only; the REST path built here is what a dropped socket falls back to.
- **Chunk 7.4's chat header** carries the transparency note recorded in the 7.1 follow-up, and `meta.participants.therapist.workingHours` is already on the response for it.
- **Chunk 7.5** adds the mandatory first message on top of these endpoints — nothing here blocks it.
- **Chunk 9.3** writes the `type: "system"` message when a session is scheduled. It is the only writer of that type, and the send endpoint cannot produce one.
- Slice 11 must flip a cancelled subscription to `expired` on the same `currentPeriodEnd` boundary the gate compares against (from 7.1).

**Pre-launch blockers — unchanged, the list stands at 13.** No placeholder content was created.

**Not done (out of scope, by design):**
- **No Socket.io** (7.3) and **no chat UI** (7.4), per the chunk's own "Do NOT".
- No system messages written by anything (9.3).
- No notifications (10.4); no admin visibility of any kind (§11).

---

## Chunk 7.3 — Socket.io real-time layer

**Status: Complete.** Nothing skipped. Verified live against the real Atlas cluster with two real socket clients on an actual booking; every message created was deleted afterwards.

Built:
- `realtime/socketServer.js` — the Socket.io server and its middleware chain.
- `realtime/socketAuth.js` — handshake auth, role and subscription gates, room joining.
- `realtime/socketHandlers.js` — the event surface, send limiter and typing.
- `realtime/emitter.js` — the one place that knows how to push to a socket.
- `constants/socket.js`
- `realtime/socket.test.js` — 38 tests against a real server on an ephemeral port.
- Edits: `server.js` (explicit `http.Server` + socket attach + ordered shutdown), `services/chat.service.js` (emit after persist, `after` cursor), `controllers/chat.controller.js` and `validation/chat.schema.js` (`after` on REST).

**Packages installed:** `socket.io` (^4.8.3, dependency) and `socket.io-client` (^4.8.3, devDependency — tests only). The client app gets its own copy in 7.4.

---

### ONE WRITE PATH, TWO TRANSPORTS

`message:send` is a thin socket wrapper over the **same `sendMessage` service the REST route uses**. Membership, the forced `type`, the ended-booking guard and the 5,000-character limit therefore exist once, not twice. A socket send is a transport, not a second set of rules — and the suite proves it by asserting that an empty message, an oversized one and a forged `type: "system"` are refused identically over both.

After the write commits, the service calls `emitMessage`. That emitter **no-ops when no socket server is attached**, which is why all 972 earlier tests kept passing untouched and why graceful degradation is structural rather than a fallback mode: there is one write path and delivery is simply switched off. A test asserts REST still sends and stores with the socket server explicitly detached.

---

### A REAL RACE, FOUND BY THE TESTS AND FIXED PROPERLY

Six typing tests failed on the first run. The cause was not the typing code.

`joinOwnRooms` was `await`ed inside `io.on('connection')`. **The client's `connect` event fires as soon as the handshake completes** — before that database query resolves. So a client could believe it was connected, send immediately, and have the message emitted to a room the recipient had not joined yet: persisted correctly, never delivered, and nothing anywhere reporting a problem. The fast tests won the race; the slower ones did not.

**Room joining is now middleware**, which completes before the connection is established, so by the time either side sees "connected" both are already in their rooms. The `connection` handler is now synchronous as well, because an async body there drops the first events a keen client sends — the same class of race one layer up.

This is exactly the silent-failure shape this project keeps looking for, and it would have been miserable to diagnose from a UI in 7.4.

---

### THE SOCKET THAT OUTLIVES ITS TOKEN — CLOSED

An access token lives ~15 minutes; a socket can stay open for hours. Verifying once at connect — which is what most implementations do — means a user whose token expired, or whose account was deactivated, keeps a live privileged socket indefinitely, quietly undoing the short-token design §11 is built on.

So the expiry is **re-checked before every inbound event**. It is a comparison against the already-decoded `exp`, not a database hit, so it costs nothing. On expiry the socket is told why and disconnected, and the client reconnects with a fresh token exactly as the REST interceptor already refreshes.

---

### DECISIONS MADE

- **Four middleware layers, each refusing the CONNECTION rather than an event:** authenticate, role, subscription, rooms. A rejected user never reaches a room at all.
- **THE ADMIN GETS NO SOCKET.** §11 records that an admin conversation viewer was proposed and the client decided against building it. Refusing by role at the handshake means there is no transport through which chat content could reach them, not merely no endpoint.
- **The subscription gate closes on one side only**, consistent with 7.2: an expired client gets no real-time connection; their therapist still does, because the thread is their clinical record.
- **The server decides the rooms, always.** A socket cannot ask to join a booking — membership is read from the database at connect. This is the socket equivalent of never trusting a `bookingId` from a request, and **mutation-checked: joining every booking instead of the user's own broke 4 tests.**
- **A therapist joins every booking they hold**, not just the one on screen, because §8.8's notification bell needs messages from a client they are not currently viewing.
- **The socket payload carries no `mine` flag.** One emit reaches both parties, so a viewer-relative field cannot be baked into it; the client derives it by comparing `senderRole` with its own role, which is unambiguous because a booking has exactly two participants.
- **The sender's own sockets receive the message too**, deliberately — excluding them would break the second tab of anyone with two open. The client de-duplicates by id, which it must do anyway to survive a reconnect that re-syncs an overlapping window.
- **`unread:update` goes to the reader's own room, never the booking's.** A badge is personal, and pushing it to the booking would tell the sender their message had been read — the read receipt deliberately left out in 7.2. A test asserts the sender receives nothing.
- **The socket send path has its own rate limiter**, a sliding window matching the REST limit exactly. `express-rate-limit` does not apply to sockets, so without it the socket path would have bypassed the 30-a-minute budget entirely. A test walks a burst and asserts the 31st is refused.
- **`message:new`, not the brief's `message:receive`.** The latter reads like something the client sends, and a mis-wired listener is a silent failure rather than a loud one.

---

### RECONNECTION

`listMessages` gained an **`after` cursor** — one branch, reusing the same encoding — exposed on both the socket (`conversation:sync`) and REST (`?after=`), so gap-filling works with or without a socket. `before` and `after` together are refused.

`meta.syncCursor` is new and is always the newest row on the page: the client keeps it and hands it back on reconnect to fill exactly what it missed, rather than blindly refetching. `meta.nextCursor` still means "load older" and is unchanged.

---

### THE TYPING INDICATOR — SYMMETRICAL, APPROVED 2026-09-13

Both sides see the other typing, as in a standard chat app. **Purely ephemeral: zero database writes**, and a test asserts the message count is unchanged across a full start-stop cycle.

Three things that make it not broken:

- **Auto-stop after 5 seconds**, plus an explicit stop on disconnect and after a send. Without it a connection dropping mid-sentence would leave the other side watching "typing…" for ever. Both paths are tested, the timeout one for real rather than with fake timers.
- **No draft text crosses the wire.** The payload is exactly `{ bookingId, senderRole }` — a test sends a `text` field alongside and asserts it never arrives, and pins the payload's key set.
- **Never echoed to the typist, and never into another booking.** Membership for typing is checked against the socket's own rooms, which the server assigned, so it needs no database hit on an event this frequent.

---

### A SECOND TEST THAT PASSED WHILE PROVING NOTHING

The first version of "persists before it emits" listened for the event and then looked the row up. **It passed against a deliberately inverted implementation** — the network round trip to the client and back takes milliseconds, by which time the write has landed whatever order the code used.

Rewritten to assert the **order** rather than the timing: both the write and the emit are marked as they happen and the sequence is compared. Patching `Message.prototype.save` alone was not enough either — Mongoose's `Model.create` does not go through the document prototype, so it recorded nothing; both paths are now patched, which also survives a future refactor to `new Message().save()`.

**Mutation-checked properly this time:** emitting before the write now breaks the test. The original round-trip check is kept as a delivery test under an honest name.

That is the fourth false-confidence test this project has caught (1.3, 4.2, 7.2, now this), and the second in two chunks.

---

**Verified:**
- `npm test -- --runInBand` — **1010 tests across 36 suites, all passing** (972 from earlier chunks, 38 new).
- `npm run lint` — clean.
- **Mutation-checked twice:** room membership broke 4 tests; emit-before-persist broke the rewritten ordering test.
- Tests cover: valid, missing, malformed, forged and already-expired tokens at the handshake; the admin refused; an expired client refused and their therapist admitted; room membership and isolation; delivery both ways; persist-before-emit; a send into a foreign booking refused; the sender's second tab; no `mine` flag; shared validation; a forged system type; the send rate limit; live unread updates; no read receipt to the sender; reconnection gap-fill; a foreign sync refused; every typing property above; and REST working with the socket layer detached.

**LIVE AGAINST THE REAL SERVER AND REAL ATLAS — 20 checks, all passing.** The real socket server on an ephemeral port, two real accounts on an actual booking, and a third from a different booking. **No account was modified at all this time** — tokens were signed directly rather than obtained by login, so not even a password hash was touched:
- instant delivery both directions, with the right sender role and no `mine` flag;
- both messages confirmed present in the database;
- **a third party on another booking heard nothing, and could not send into booking A**;
- **typing symmetrical in both directions, isolated to the booking, and writing nothing to the database**;
- marking read pushed a live badge update;
- **reconnection filled exactly the one message missed while the client was away**;
- REST still sent and stored with the socket server detached.
- **Cleanup confirmed:** 0 messages before, 0 after, the 5 created deleted by id.

**Manual steps for the developer:**
1. **Packages installed:** `socket.io` and `socket.io-client` in `/server`. No new environment variables, no external accounts.
2. **Restart the API server** — `server.js` now creates an explicit `http.Server` and attaches Socket.io to it. You should see `Socket.io attached.` after the listening line.
3. **The chunk's own verify step is yours**, and it needs the 7.4 UI to be meaningful: two browsers, client and therapist of the same booking, messages both ways, then kill the socket and confirm REST still carries the conversation. The API half is proven above.

**Carried forward:**
- **Chunk 7.4 builds the chat UI on this.** It must de-duplicate incoming messages by id (the sender's own sockets receive their own message), keep `meta.syncCursor` for reconnection, and derive `mine` from `senderRole`.
- **The chat header transparency note** recorded in the 7.1 follow-up belongs on that screen, and `meta.participants.therapist.workingHours` is already on the response for it.
- **Chunk 12.5 — two additions to the deployment list:**
  - **Sticky sessions or a Redis adapter.** In-memory rooms are correct on one instance, which is what Render runs today. The moment the backend scales to two, a message emitted on instance 1 never reaches a socket on instance 2, and it fails silently. This sits beside the `sameSite` cookie and `VITE_API_BASE_URL` notes already parked there.
  - **The socket URL in production.** Same trap as the API base URL: a relative path works behind the Vite dev proxy and resolves to nothing on Vercel.
- Slice 11 must flip a cancelled subscription to `expired` on the same `currentPeriodEnd` boundary the gate compares against (from 7.1).

**Pre-launch blockers — unchanged, the list stands at 13.** No placeholder content was created.

**Not done (out of scope, by design):**
- **No chat UI** (7.4), per the chunk's own "Do NOT".
- **Nothing is stored in memory as a record.** The only in-memory state is a typing timer and a send-rate window, both of which die with the socket and neither of which is data.
- **Sending is never blocked when the recipient is offline** — the message is persisted and simply waits, per §14 and the chunk's "Do NOT". There is no presence state anywhere in this code.
- No notifications (10.4); no system messages (9.3); no admin visibility on any transport (§11).

---

## Chunk 7.4 — Client chat UI

**Status: Complete.** Nothing skipped. **Not seen rendered** — see "Yours to check".

> **A power cut interrupted this chunk mid-build on 2026-09-14.** Nothing was lost or corrupted: every file written before the cut was complete and the client still built. What was outstanding was the shell wiring and the whole verification pass, and both were finished on 2026-09-15. Recorded because the log should say when a chunk was built in two sittings.

Built — server (the small addition approved 2026-09-14):
- `constants/chat.js` — `CLIENT_MESSAGE_ID_MAX` / `CLIENT_MESSAGE_ID_PATTERN`.
- Edits: `validation/chat.schema.js`, `services/chat.service.js`, `controllers/chat.controller.js`, `realtime/socketHandlers.js`, and 5 new tests across `routes/chat.test.js` and `realtime/socket.test.js`.

Built — client:
- `lib/chat/` — `messageStore.js` · `groupMessages.js` · `useChat.js`
- `lib/socket/` — `socketClient.js` · `socketContext.js`
- `lib/api/chatApi.js` · `data/chatContent.js`
- `components/portal/client/PortalSocketProvider.jsx`
- `components/portal/client/chat/` — `ChatHeader` · `MessageThread` · `MessageCluster` · `SystemNotice` · `DaySeparator` · `TypingDots` · `Composer` · `ChatEmptyState` · `ChatIcons`
- `pages/portal/client/Chat.jsx` — replaces the 7.1 placeholder.
- Edits: `pages/portal/ClientPortalShell.jsx` (socket provider + a bounded layout chain).

**Package installed:** `socket.io-client` (^4.8.3) in `/client`. No new environment variables, no new colour or type tokens.

---

### `clientMessageId` — THE RACE REMOVED RATHER THAN PAPERED OVER

Sending produces three events in no guaranteed order: the optimistic bubble, the server's ack, and the socket echo (your own sockets receive your own message, so a second tab stays in step). If the echo arrives before the ack, a naive list shows the message twice.

The browser now generates an id, passes it with the send, and the server **echoes it back on both the ack and the emit**. Reconciliation is then exact rather than a guess based on matching text and timestamps — the fragile approach this project keeps rejecting.

**IT IS NEVER STORED.** It is a rendering hint, not data: the model has no field for it, and four tests assert it never reaches the database on either transport. It is also attacker-controlled and round-tripped to the other party, so it is length-bounded and charset-restricted, and nothing interprets it as anything but an opaque token.

---

### A REAL BUG FOUND WHILE FINISHING

The reconnection handler computed an anchor message and then called `fetchMessages(bookingId, { after: undefined })` — **the cursor was never actually passed**, so the gap-fill was a blind refetch of the newest page wearing the costume of a precise sync.

Fixed properly: `meta.syncCursor` (added to the API in 7.3) is now kept in a ref and handed back as `after` on reconnect, so the server returns exactly what was missed. The merge is idempotent — anything already held dedupes by id — so an overlap costs nothing and a missed message cannot slip through.

**Limitation stated rather than hidden:** if more than one page arrived while disconnected, the remainder fills by scrolling up as normal. At 30 sends a minute in a one-to-one conversation, that is not a case a real reconnect produces.

---

### DECISIONS MADE

- **Enter sends on a pointer device; on touch it makes a new line.** Approved 2026-09-14. A phone's return key is how people break a line and there is no Shift to hold, so sending on Enter there would fire half-finished sentences. Detected with `pointer: coarse` — the platform's own answer — rather than sniffing the user agent. The send button is always present and is the only send path on touch.
- **The socket lives in the SHELL, not the chat screen.** A connection that tore down every time someone tapped Worksheets would drop messages between tabs, and 7.6's unread badges need the same one. Marginally ahead of this chunk's brief, and flagged rather than slipped in.
- **Nothing here requires the socket.** Every operation has a REST path and takes it whenever the connection is absent, disconnected, or times out. A blocked websocket costs instant delivery and nothing else (§14).
- **The client half of 7.3's expiry fix landed here.** On `auth:expired` the client refreshes through the SAME single-flight promise the REST interceptor uses and reconnects — two separate refreshes would be worse than useless, because refresh rotates the token and the second would present one that no longer exists.
- **Clustered, not stacked.** Consecutive messages from one person within five minutes share one timestamp and one tail. Five bubbles each carrying their own time is what turns a conversation into a spreadsheet. The tail is a single tightened corner rather than a drawn arrow — the shape says who spoke without an applied decoration.
- **System messages are not bubbles.** Centred, on a pill with a drawn mark, visibly the platform speaking. Rendering one as a bubble would read as though one of the two people had typed *"Session scheduled for Thursday"*. They also never cluster into someone's run. (9.3 writes them; this chunk styles them.)
- **Every date decision is made in the READER's timezone.** "Today" for a client in Dublin and their therapist in Perth are different days, and a boundary computed in UTC would put the separator in the wrong place for one of them.
- **A failed message keeps its text, exactly where it was**, with Retry beneath it. Somebody who has just written something difficult must not have to write it twice. The failure line sits on the thread ground rather than inside the bubble — clay on ink would not clear contrast, and the message is not the thing that went wrong.
- **The character counter appears only from 4,500.** A permanent counter on a therapy message reads as a limit on how much you are allowed to feel.
- **Typing is throttled to one `start` every two seconds** with a stop after a pause. An event per keystroke would be jittery on the other side, and the server auto-stops after five seconds regardless.

---

### THE HEADER — §7.1's EXPLICIT REQUIREMENT

"Therapist working hours displayed at the top of the chat." Shown two ways: the one-line state everyone reads (*"In clinic today · Until 17:00"*), and the full week behind a disclosure for anyone planning around it — reusing `convertWorkingHours` from 5.6, including the day-rollover handling, rather than a second implementation.

The note is the developer's approved wording, with the therapist's name and their hours templated in and a neutral pronoun:

> Write anytime your heart needs to speak, day or night. {name} mostly replies during their clinic hours ({hours}), but often answers sooner when free. There is never any rush.

A second variant covers a therapist with no usable published hours, so the sentence never renders with an empty bracket. **No promise about reply speed anywhere** — §7.1 is explicit that a message simply waits.

---

### THE SCROLL BEHAVIOUR, WHICH IS WHERE CHAT UIs BREAK

Four specific things, each a known failure:

1. **First paint jumps to the bottom without animating** — a smooth scroll on load makes the whole history flick past.
2. **A new message never yanks anyone down while they are reading history.** It increments the jump-to-latest count instead.
3. **Loading older messages preserves position**, by correcting the scroll offset by the `scrollHeight` delta in a layout effect — before paint, or the reader visibly leaps mid-sentence.
4. **Jump to latest carries the count** of what arrived, so the control says what it will do rather than only that it exists.

**Mark-as-read fires only when the thread is open AND the reader is at the bottom** — never merely on mount. Marking messages read that nobody has seen is a lie the unread badge then tells.

---

### THE LAYOUT CHAIN, WHICH IS NOT COSMETIC

`ClientPortalShell` moved from `min-h-dvh` to **`h-dvh` with `overflow-hidden`**, and `min-h-0` was added down the column. Without a definite height the whole way down, the chat's `flex-1` resolves to nothing and the thread cannot scroll at all — the composer would be pushed off-screen and the history unreachable. Screens that do not want the viewport simply sit at the top of the column as before.

---

### THREE ROOT FIXES RATHER THAN SUPPRESSIONS

All three were React Compiler objections, handled the way 0.6, 4.2 and 5.1 handled theirs:

- **`useChat`** assigned a ref during render. Now synced in an effect.
- **`MessageThread`** incremented the missed-message counter inside a layout effect. Now a **render-phase state adjustment** — React's documented pattern for reacting to changed input, and the same one the admin DataTable uses for `resetKey`. The layout effect does scrolling only.
- **`PortalSocketProvider`** set state from inside an effect. The socket is now built in a lazy state initialiser; construction is inert because `autoConnect` is false, so nothing happens on the wire until the effect connects.

---

### CONTRAST — TWO REAL FAILURES FOUND BY MEASURING

| What | Was | Now |
|---|---|---|
| System notice text, `sage-deep` on `sage/12` over **mist** | **4.40:1 FAIL** | `sage-deep` on a **paper** pill — **5.48:1** |
| System notice time, `sage-deep/80` on that tint | **2.98:1 FAIL** | `ink/70` on paper — **6.73:1** |

The pill is now paper with a `sage/40` ring: the sage character is carried by the ring and the drawn mark rather than by a tint that cost the contrast. The time is differentiated **by hue rather than opacity** — a faded version of the same colour is exactly what failed.

**35 pairs computed, 0 failures after the fix.** Tightest against their own floors: the composer placeholder at 4.59:1, the composer's sage focus border at 3.06:1, and the unsent label at 4.93:1. None may be lightened.

---

**Verified:**
- `npm test -- --runInBand` — **1015 tests across 36 suites, all passing** (1010 from earlier chunks, 5 new).
- `npm run lint` (server) clean; `oxlint` (client) **0 warnings** on every file this chunk touched. The six that remain are the developer's own in `home/Hero.jsx`, `home/Services.jsx`, `pages/Home.jsx`, `pages/Matches.jsx` and `about/WhyCardsDeck.jsx`, open since 2.2.
- Client build passes.
- **42 logic checks executed** against the real modules — the client has no Jest suite, so the merge rules were run rather than assumed: the optimistic/ack/echo race **in both orders**, a second tab, an overlapping history page never duplicating, out-of-order arrival, identical timestamps keeping a stable order, failure and retry preserving the text, the sync anchor ignoring pending rows, day boundaries **in the viewer's zone** including a Perth rollover and a same-instant-different-day case west of UTC, clustering by sender and by gap, and system messages splitting a run.
- **35 contrast pairs computed, 0 failures.**
- **All 6 chat icons bounds-checked** against the 24×24 viewBox including stroke, with a command-aware path parser — the false-failure trap from 5.2.
- Impeccable detector — `[]`, and **read that as a degraded empty**: the four parsing dependencies are still absent, so it evaluates no contrast. The computed table is the compensation.
- Generated CSS confirmed to carry every new utility the screen depends on: `overscroll-contain`, `whitespace-pre-wrap`, `wrap-break-word`, both tail radii, `tabular-nums`, `h-dvh`, `ring-sage` and the jump-pill shadow.

**LIVE AGAINST THE REAL SERVER AND REAL ATLAS — 12 checks, all passing.** Using a real booking, writing only messages, and **modifying no account at all** (tokens signed directly, so not even a password hash was touched):
- `clientMessageId` echoed on the socket ack **and** on the emit the other party receives, and on REST;
- **never stored on either path**, confirmed against the raw document;
- a non-opaque id refused with 422;
- `meta.syncCursor` present, and **`after` returning exactly the one message that arrived while the client was "away"**;
- the therapist's working hours and name on the response, which is what the chat header renders.
- **Cleanup confirmed:** 0 messages before, 0 after, the 3 created deleted by id.

**YOURS TO CHECK — nothing here has been seen rendered:**
1. **The brief's own verify step:** two browsers, client and therapist of the same booking, messages both ways. Then kill the socket (stop the API or block the websocket) and confirm the conversation still sends over REST.
2. **The working hours at the top**, and the full week when expanded — both converted into your clock.
3. **The scroll behaviour**, which is the piece most likely to need tuning: scroll up, receive a message, and confirm you are not yanked down; then scroll to the top and confirm loading older history does not make the view jump.
4. **Enter on a phone should make a new line**, and the send button should be the only way to send there. On a desktop Enter sends and Shift+Enter breaks the line.
5. **The layout at 360px** — the header, thread and composer are three fixed regions and the page itself must not scroll.
6. **Reduced motion**: no smooth scrolling, the typing dots hold still, the jump pill appears without sliding.

**Manual steps for the developer:**
1. **Package installed:** `socket.io-client` in `/client`. No new environment variables.
2. **Restart both dev servers** — the client has a new dependency and the server has the `clientMessageId` field.
3. Nothing to configure. Sign in as a real client and the conversation is live.

**Carried forward:**
- **Chunk 7.5 replaces the empty state** with §7.1's mandatory first message. The current empty state explains what the space is for and deliberately does not gate anything.
- **Chunk 7.6** builds the unread badges on the socket provider this chunk mounted, and on `GET /chat/unread-count`.
- **Chunk 9.3** writes the `type: "system"` messages this chunk already styles.
- **Chunk 12.5 — the socket URL in production.** `socketClient.js` strips the API path to find an origin, so a relative `VITE_API_BASE_URL` means "same origin as the page". In production it must resolve to the real API origin, beside the `sameSite` cookie, the `VITE_API_BASE_URL` and the sticky-sessions notes already parked there.
- Slice 11 must flip a cancelled subscription to `expired` on the same `currentPeriodEnd` boundary the gate compares against (from 7.1).

**Pre-launch blockers — unchanged, the list stands at 13.** No placeholder content was created: every word on this screen is either spec-sourced or the developer's own approved copy.

**Not done (out of scope, by design):**
- **No mandatory first message** (7.5) and **no voice messages** — text only for v1, per the chunk's own "Do NOT".
- No unread badges in the navigation (7.6).
- No therapist-side chat (8.3).

---

## Chunk 7.5 — Mandatory first message

**Status: Complete.** Nothing skipped. **Slice 7's chat is now whole apart from unread badges (7.6).** The brief's own verify step was run live against Atlas with a genuinely fresh paying client. Not seen rendered — see "Yours to check".

Built — server:
- `constants/chat.js` — `OPENING_MESSAGE_MIN`, `OPENING_MESSAGE_SUGGESTED`, the refusal message and code.
- `services/chat.service.js` — `clientHasWritten()`, the enforcement in `sendMessage`, and `meta.awaitingOpeningMessage` on the message list.
- `models/Message.js` — one supporting index.
- 11 new tests across `routes/chat.test.js` and `realtime/socket.test.js`.

Built — client:
- `components/portal/client/chat/OpeningMessage.jsx`
- `data/chatContent.js` — the `opening` copy.
- Edits: `lib/chat/useChat.js` (`awaitingOpeningMessage` + a dedicated `sendOpening`), `pages/portal/client/Chat.jsx` (the branch).

**No new packages, no new environment variables, no new colour tokens.**

---

### THE RULE, STATED PLAINLY

The brief's wording — "reject other client messages on a booking that has no first message yet" — is circular, because the first message *is* the opening message. Confirmed with the developer, the enforceable rule underneath is:

> **A client's first message on a booking must clear the opening floor. Every message after it is ordinary.**

That closes the actual hole: someone bypassing the UI with curl and sending "hi" as their entire opening.

**Enforced in the `sendMessage` service**, so REST and the socket inherit it identically — there is one write path and this sits on it. **Mutation-checked: removing the enforcement broke 6 tests** across both transports.

---

### TWENTY CHARACTERS, AND WHY IT IS NOT THIRTY

**Developer's decision, 2026-09-15**, argued down from the 30 I proposed — and they were right.

A 30-character floor refuses **"I can't do this anymore."** (24) and **"I feel completely broken"** (25). Those are not spam. They may be the most important message anyone on this platform ever sends, and a product that answers them with *"please write more"* has failed at the exact moment it matters.

Twenty still stops "hi", "test" and "hello", which is the entire job of the floor. A test asserts the 24-character sentence is accepted, and names the reason, so nobody later raises the number without meeting the case first.

**`OPENING_MESSAGE_SUGGESTED` (200) is never enforced anywhere.** The screen encourages roughly that much and then gets out of the way.

The check measures the **trimmed** length, so twenty spaces around "hi" does not pass.

---

### DECISIONS MADE

- **Clients only.** A therapist is never blocked: nothing in §7.1 restricts them, and stopping a clinician reaching someone would be the wrong failure. Two tests cover it, including the case where a therapist writes first.
- **`awaitingOpeningMessage` is computed from THE CLIENT's messages, not the booking's.** So a therapist who somehow messaged first cannot accidentally unlock the requirement — the client still owes their opening, and a test pins exactly that.
- **The server reports the flag; the browser never derives it.** With pagination the client may hold only the newest page and cannot know whether an opening exists further back.
- **One flag serves both portals.** For the client it means "you still owe this"; for the therapist (8.3) it means "they have not written yet". A test checks it from the therapist's side too.
- **A new index, `{ bookingId, senderId }`.** The existing unread index has `read` between those two fields, so the existence check that now runs on every send would scan rather than seek.
- **The opening send is deliberately NOT optimistic**, unlike ordinary sending. In the thread an optimistic bubble is right, because the thread is where a failure should show. Here the reader is watching one button on a screen with nothing else on it: optimism buys nothing and would leave a phantom failed row behind a screen they cannot yet see. `sendOpening` awaits the real write and throws, so the screen can say what happened **while keeping every word they wrote**.
- **The server's own refusal text is shown when there is one.** Its explanation of what this message is for reads far better than a generic failure.

---

### THE SCREEN

§7.1: free text, never a structured form — the client chose that deliberately so somebody can express themselves naturally. So the design had to say "this is the beginning of a conversation" rather than describe it:

- **The therapist's face is the first thing on the screen**, under "You are writing to". A real person, not a heading. §24.5 makes therapist portraits the exception to the site's photo treatment, so it carries no wash.
- **§7.1's four prompts are one sentence of prose**, not four labelled fields and not a bulleted checklist — four prompts in a list is a form wearing different clothes. It ends *"There is no right way to do this."*
- **The writing area is a page, not an input** — borderless on a mist ground, body-size type, generous leading, growing with the writing so the words never scroll away inside a fixed box.
- **No counter, no progress bar, no step indicator.** A progress bar here would turn somebody's account of their own distress into a task with a completion state. Below the floor the cue reads *"A few more words, whenever you are ready."* — encouragement, never a requirement unmet.
- **FRAUNCES IS USED HERE, AND NOWHERE ELSE IN EITHER PORTAL.** §24.3 permits it at display sizes; chunk 4.1 banned it from the admin chrome because a serif over dense table data is the wrong register. This is the one screen in the portal that is not a task, and §24.8 says the client portal skews warmer. Flagged as a deliberate break rather than an oversight.
- **A true privacy line: *"Only {name} can read your messages."*** §11 records that an admin conversation viewer was proposed and the client decided against building it, so nobody else can. The content file carries that citation and notes the line must change if that ever does — §11 also requires such a capability be disclosed in the privacy policy.

**It replaces the thread rather than sitting over it in a modal.** A modal would frame this as an interruption; it is the opposite.

**There is no skip, and no client-side-only gate.** Someone who edited their own JavaScript past this screen would still be refused by the server.

---

### THREE PRE-EXISTING TEST FIXTURES, AND ONE BAD ASSERTION OF MY OWN

Adding the rule broke four tests. Three were older fixtures whose message text — "Hello.", "No hint.", "Optimistic send." — was now too short to be a valid opening. That is the rule working, not a defect; the texts were incidental to what those tests check and were lengthened.

The fourth was mine: I asserted the refusal body does not contain the rejected text `"hi"` — but **"hi" occurs inside the word "This"** in the refusal copy, so it failed for a reason that had nothing to do with a leak. Rewritten with a distinctive token, and the reason recorded at the test so nobody re-introduces the same shape.

---

**Verified:**
- `npm test -- --runInBand` — **1026 tests across 36 suites, all passing** (1015 from earlier chunks, 11 new).
- `npm run lint` (server) clean; `oxlint` (client) **0 warnings** on every file this chunk touched.
- Client build passes. Impeccable detector `[]` on both new/changed UI files — **a degraded empty**, as always here.
- **Mutation-checked:** removing the enforcement broke **6** tests.
- **14 contrast pairs computed for the opening screen, 0 failures.** Tightest: the writing-page placeholder at 4.59:1, its sage focus ring at 3.06:1, and the send border at 3.44:1 — none may be lightened.
- Tests cover: below the floor refused, exactly at the floor accepted, one under refused, **the 24-character cry for help accepted**, trimmed length measured, the rule applying once, the therapist never restricted, the client still owing after a therapist writes first, the flag reported correctly from both sides, refusal on **both** transports, and no message text echoed in the error.

**LIVE AGAINST REAL ATLAS — 13 checks, all passing.** The brief's own verify step, with a **genuinely fresh paying client** created through the real onboarding transaction against a seeded therapist:
- the portal was told an opening was owed, and the thread was genuinely empty;
- "hi" refused with `OPENING_MESSAGE_REQUIRED`, and one character under the floor refused, with nothing written;
- **"I can't do this anymore." accepted** — the sentence the floor was lowered for;
- the requirement cleared, the opening message first in the thread, and **a two-character second message then accepted**;
- the therapist never blocked.

**DATABASE SAFETY — the developer's strict instruction was followed exactly.** Only the throwaway client's own records were created and deleted, each by the id recorded on the way in. Afterwards: 14 users, 2 client profiles, 2 bookings, 2 subscriptions — identical to the baseline, and zero throwaway accounts remaining.

**One pre-existing message was found and deliberately LEFT ALONE.** A 2-character message sent 2026-09-14 21:26 from `muhammadhussnainrauf@gmail.com` — the developer's own test of the 7.4 chat UI. It was inspected only to confirm it was not created by this run. **Consequence worth knowing:** because that account already has a first message, it is grandfathered past this rule and will go straight to the normal chat. **`testclient1@example.com` has no messages, so that account is the one that will show the opening screen.**

(The three expired `pendingCheckouts` drafts present in earlier runs are gone — their 26-hour TTL lapsed on its own. Nothing in this run deleted them.)

**Yours to check — nothing here has been seen rendered:**
1. **Sign in as `testclient1@example.com` and open Chat.** The opening screen should appear instead of the thread.
2. **Does it read as a letter to a person, or as a form?** That is the entire brief for this screen and the one thing I cannot judge from here. The therapist's face, the Fraunces heading and the page-like writing area are the three things carrying it.
3. **Type "hi" and try to send** — the button should stay disabled and the cue should read as encouragement, not as a rule.
4. **Send a real opening, and confirm the normal chat appears** with it as the first message.
5. **360px**, and reduced motion (the card should appear without rising).
6. If you want to see the opening screen on the other account, its existing 2-character message would have to go — **your call, not mine, and I have not touched it.**

**Manual steps for the developer:**
1. **No new packages, no new environment variables.**
2. **Restart the API server** — the new rule and the `awaitingOpeningMessage` field are read at startup.

**Carried forward:**
- **Chunk 7.6** builds unread badges on the socket provider mounted in 7.4 and `GET /chat/unread-count`.
- **Chunk 8.3** can use `meta.awaitingOpeningMessage` to show a therapist that a newly matched client has not written yet.
- Chunk 12.5: the socket URL in production, beside the `sameSite` cookie, `VITE_API_BASE_URL` and sticky-sessions notes.

**Pre-launch blockers — unchanged, the list stands at 13.** No placeholder content was created.

**Not done (out of scope, by design):**
- **Not a structured form**, per the chunk's explicit "Do NOT" — free text only.
- **Not skippable**, and not client-side-only: the server refuses independently.
- No voice messages. No unread badges (7.6). No therapist-side chat (8.3).
