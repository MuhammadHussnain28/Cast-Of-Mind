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
