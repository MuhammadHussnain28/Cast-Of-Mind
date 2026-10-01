# Ongoing — Progress Log

**Restructured 2026-09-16.** This file had reached 533 KB and 5,084 lines, which made it
the single largest cost of every context sync — roughly 133,000 tokens, about two thirds
of a context window, before any work could begin.

**The raw history of Slices 0 to 6 now lives in [`docs/archive/ongoing-slices-0-6.md`](archive/ongoing-slices-0-6.md),
unedited.** Nothing was deleted. What was extracted from it — every decision that still
binds — is in this file, below.

### What is in this file

| Section | What it is |
|---|---|
| **Spec Corrections & Decisions Log** | Items 1–11, resolved with Asad. Unchanged. |
| **Standing Decisions from Slices 0–5** | Every engineering, feature and architectural decision from those slices that still binds. |
| **Slice 6 Summary** | Payments and subscriptions, condensed but thorough — it handles real money. |
| **Slice 7** | The client portal and chat. Full entries, untouched. |
| **Pre-Launch Blockers** | The 13, in one place. |

**Read the archive** when you need the full reasoning behind one of the extracted lines —
what was tried first, what a test caught, why an alternative was rejected. **Read this
file** for what is still true.

---

## ENTRY FORMAT — mandatory from Chunk 8.1 onwards

**The essay format is terminated.** Entries for Slices 0 to 7 run 150 to 200 lines with
long narratives and full contrast tables. That was useful while the patterns were being
established and it is now the reason this file grew past its own usefulness.

**Every entry from Chunk 8.1 onwards is 60 to 70 lines. Five headings, in this order,
and nothing else:**

```markdown
## Chunk X.Y — <name>

**Status:** Complete / Complete with exceptions. Say plainly if anything was skipped.

**Built**
- server: <files, routes>
- client: <files, components>
- Packages / env vars: <or "none">

**Key decisions**
- <the decision> — <why, in one or two sentences>
  (Only actual decisions. Not descriptions of what the code does.)

**Verification**
- Tests: N passing across M suites (K new)
- Lint: server / client
- Mutation check: removing <guard> broke N tests
- Contrast: N pairs computed, N failures  ← one line, NEVER a table
- Live/manual checks run, if any

**Manual steps for the developer**
1. <exact steps to test it — what to click, what to expect>

**Carried forward**
- <what the next chunk must pick up, blockers, open questions>
```

**What this rules out:** full contrast tables (report the count and only a failure that
was actually found), narrative sections with their own headings, restating what the code
does, and "Yours to check" as a separate section — fold it into Manual steps.

**What it does not rule out:** saying plainly when something was skipped, when a test
proved nothing, or when a decision has a cost. Those stay, in one line each.

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

## Standing Decisions from Slices 0–5

> Extracted 2026-09-16 when the raw history moved to `docs/archive/ongoing-slices-0-6.md`.
> **These still bind.** Each is a decision that was made, argued, or approved — not a
> description of code. Where a decision has a date it was the developer's or the client's
> call on that date. The full reasoning behind any line is in the archive, under the chunk
> named beside it.

### Project shape and tooling

- **`/client` and `/server` are independent** — no monorepo tooling, separate `package.json` files. (0.1)
- **The server is ESM throughout**, `"type": "module"`, `.js` extensions on every relative import. **Jest runs via `node --experimental-vm-modules`** — never bare `npx jest`, which fails with "Cannot use import statement outside a module". (0.1)
- **Zod is the validator**, everywhere, both ends. `safeParse()` gives field-level errors without throwing. (0.2)
- **axios, not fetch** — interceptors are a real axios feature, not something hand-rolled. (0.6)
- **Redux Toolkit** for cross-route state; `Intl`, never `date-fns`, for dates and timezones. (0.6)
- **`mongodb-memory-server` for tests, never a mocked driver.** `unique: true` is a MongoDB *index* enforced on write, not a Mongoose validator — mocking it makes the duplicate-email test assert nothing. Call `await Model.init()` before relying on an index. (1.1)
- **Tailwind v4 with `@theme` tokens**, not v3 config. (0.3)
- **Test convention:** `beforeAll`/`afterAll` hooks need an explicit long timeout. As of 7.6 the global `testTimeout` is 30s and the in-memory Mongo `launchTimeout` is 60s — both because this machine is slow, and a suite that fails at random teaches everyone to ignore red.

### Authentication and tokens

- **The refresh token hash is SHA-256, NOT bcrypt.** bcrypt silently truncates at 72 bytes, and every JWT we issue shares a near-identical prefix — two different tokens could collide. A refresh token is long and random, so there is nothing to slow an attacker down for. (1.2)
- **Passwords are bcrypt at cost 12, capped at 72 bytes**, minimum 8 characters for every role including admin. `MIN_PASSWORD_LENGTH` in `utils/password.js` is the single source. No complexity rules, no blocklist — developer's call. (1.1, 1.5)
- **`passwordHash`, `refreshTokenHash`, `refreshTokenExpiresAt` are `select: false`** and stripped again in `toJSON`. Two independent defences. (1.1)
- **The access token carries only `sub` and `role`.** A JWT is base64, not encrypted. **Consequence: a role change or deactivation takes up to 15 minutes to bite** — `/auth/refresh` and `/auth/me` re-read the database, and that is where an account is actually cut off. (1.2, 1.4)
- **The 7-day refresh window is ABSOLUTE, not sliding.** Rotation issues the new token with only the time that remains. **Cost: everyone logs in again once a week.** (1.3)
- **One active session per user** — the hash lives on `users`, so a new login silently ends the old session. (§10.1)
- **Cookie options live in exactly one object.** `clearCookie` only works when `path`, `sameSite` and `secure` match; two drifting call sites produce a cheerful 200 with the cookie still set. (1.3)
- **NEVER put a TTL index on `refreshTokenExpiresAt`.** The token lives *on* the user record — a TTL index would delete the entire account. Cleanup is a script that clears two fields. Warnings sit in the service and the script, and a test asserts the user count is unchanged. (1.3)
- **Refresh-token reuse detection was deliberately NOT built** — two browser tabs would trigger it and throw an honest user out. Carried to chunk 12.3. (1.3)
- **Guards FAIL CLOSED.** `requireRole` returns 401 when `req.user` is missing rather than passing through. A guard that passes when misused is worse than no guard, because the route still *looks* protected. Invalid role names throw at **startup**, not at request time. (1.4)
- **401 means "I don't know who you are"; 403 means "I know, and no."** The 403 body never names the required role — a test asserts "admin" and "therapist" never appear in one. (1.4)

### Privacy, and the enumeration rules that shaped the API

- **Login is equalised for TIMING, not just wording.** One bcrypt comparison always runs, against a throwaway hash when no user is found — otherwise an unknown email returns in ~1ms and a wrong password in ~250ms, and the gap reveals who has an account. On this platform "this address is a patient of ours" is itself sensitive. (1.2)
- **Deactivated accounts get the identical generic login error.** **Consequence: a deactivated therapist cannot learn why they cannot sign in — Asad must tell them by email.** (1.2)
- **Forgot-password sends the email WITHOUT awaiting it**, for the same timing reason. A test asserts the endpoint returns in under 400ms. (1.5)
- **One rejection message for every "email already known" case** on the therapist application — client, therapist, admin or pending application all return a byte-identical 409. (3.2)
- **One generic `SESSION_EXPIRED` for every refresh failure.** (1.3)
- **Never log therapy content.** The admin action log records the path only, never the body or query string — an admin searching a client list would otherwise write that person's name into the server log. (4.1)
- **Operational errors log one line; unknown errors log the full stack.** A wrong password is an expected event, not a fault — before this fix every failed login printed a stack trace. (1.2)

### Data, uploads and files

- **Store IDs only, never copied names.** (§10)
- **Tag values are the display labels verbatim**, never slugs. An entry must never be reworded or re-cased — existing documents hold the old string and would silently stop matching. `Career Counselling` (specialty, British) and `Career Counseling` (orientation, American) are both correct and deliberate. (1.1)
- **Files go through our own server, never browser-direct to Cloudinary.** You cannot verify content you never receive. (3.1, Decision A)
- **Content is checked by magic bytes, not by the filename or the declared MIME type** — both are written by the sender. ZIP and SVG are rejected outright. (3.1)
- **Credential documents are Cloudinary `authenticated`; the profile photo is public.** The `publicId` is stored beside each URL so the admin can sign a short-lived link. (3.1, Decision B)
- **The original filename is discarded** — it can carry the applicant's name into a URL. (3.1)
- **Any submitted URL must point at our own Cloudinary account** — https, exact host `res.cloudinary.com`, our cloud name. Rejects lookalikes like `res.cloudinary.com.evil.example`. Applied again on the therapist profile photo. (3.2, 4.6)
- **Admin document viewing streams through our own API**, so nothing leaks through history, referrer or a screenshot, and every view is logged. The upstream content type is never echoed unchecked. (4.2)
- **Duplicate tags are rejected**, not just out-of-range counts — three identical tags satisfy "3 to 4" while leaving one real specialty. (3.1)
- **A partial unique index on pending applications** — one live application per address, with rejected and approved records retained so someone can reapply. (3.1)
- **Search regexes are escaped** before reaching `$regex` — unescaped, `.*` returns everything and `(a+)+$` is catastrophic backtracking against our own database. (4.2)

### Email

- **A failed email never loses the record.** The application, the approval, the account — all saved first, email after, failure logged and swallowed. This fired for real during live runs. (3.2, 4.3)
- **The welcome email is sent AFTER the commit, never inside the transaction.** A test asserts no email is sent when the transaction rolls back. (4.3)
- **NO REJECTION EMAIL** for therapist applications — developer's decision, 2026-09-04. §16 lists none, and the wording belongs to Asad. The reason is stored for the admin's own record. (4.3)
- **No email promises a timeline or an outcome.** No "we reply within 48 hours" anywhere — there is no basis for a number and a missed promise reads worse than silence. Tests assert it. (3.2, 3.5)
- **Email HTML is deliberately 2005-style** — inlined CSS, tables not flexbox (Outlook renders through Microsoft Word), no `border-radius` or `box-shadow` on anything structural. The button is a table cell with a background colour. Every email ships a plain-text part, because a message without one scores badly with spam filters. (1.5)
- **Gold appears in email exactly once, as a background, never as text** (1.63:1 on white). The **ink** logo is used — the white one would be invisible. (1.5)
- **`RESEND_API_KEY` and Cloudinary config are optional in development, required in production.** Partial configuration exits at startup in every environment. (1.5, 3.1)

### Admin portal

- **The admin action log goes to the server log, not a 15th collection** — approved 2026-09-04. **Consequence: host logs rotate, so this is accountability, not a permanent audit trail.** A durable one was not built in 10.6 — §20 defers it (developer's decision, 2026-09-24). (4.1)
- **Idle timeout is served by the server**, not hardcoded in the browser, and the sign-out is a real `POST /auth/logout` so the session is genuinely revoked. **Gap: if the tab dies no timer fires and the cookie stays valid.** Server-side reinforcement carried to 12.3. (4.1)
- **Approving twice is idempotent**, returning `alreadyApproved: true` rather than a 409 the admin would read as a failure. A rejected application can never be approved; an approved one can never be rejected. (4.3)
- **Deactivation flips BOTH `users.status` and `therapistProfiles.status` in one transaction** — flipping only the first leaves a therapist who cannot sign in but is still offered to clients. (4.5)
- **The admin's editable set is a hard allowlist and anything else is REFUSED, not dropped.** A bio silently ignored is worse than one rejected, because the admin believes it saved. (4.5)
- **Changing a login email notifies BOTH addresses** — developer's decision, 2026-09-04. The old inbox is the one that can raise an alarm. (4.5)
- **Admin password reset calls the SAME `forgotPassword` the public endpoint uses.** One reset path; the admin never sees, sets or chooses a password. (4.5)
- **`averageRating` is `null` when nothing is rated, never 0** — zero claims every therapist scored the lowest possible mark. (4.4, 4.5)
- **MRR sums each subscription's own `amount`**, not count × €200, so it stays correct if a price changes. (4.4)

### Matching engine — the three structural rules

- **Gender preference is a `$sort` key, never a query condition.** There is no gender filter in the aggregation at all, so it cannot accidentally become one. **Mutation-checked: making it a filter broke 4 tests.** (5.5)
- **The zero-match fallback is silent, and the response is shape-identical on both paths** — no `fallback`, no `matched`, no message. A future developer cannot build the banner the client rejected, because the API never hands them the fact. **Mutation-checked: returning an empty list broke 3 tests.** The service reports `usedFallback` to the server log only, as a count, never the tags. (5.5)
- **Specialty tags only, and the endpoint does not even ACCEPT country, timezone, availability or orientation.** Unknown keys are stripped. A filter the endpoint cannot receive is one it can never apply. (5.5)
- **Ranking: preferred gender, then overlap count, then `_id`** — approved 2026-09-07. A therapist matching three concerns still sits below a preferred-gender therapist matching one; the `_id` tiebreak stops a refresh reshuffling the list.
- **Matching is a POST despite being a read.** Concern tags in a query string land in access logs, browser history and `Referer` headers — that is someone's mental health data in three places it must not be. (5.5)
- **The public therapist projection is an ALLOWLIST** (`PUBLIC_THERAPIST_FIELDS`), because the endpoint is unauthenticated and a denylist leaks whatever a later chunk adds. **The public id is the PROFILE id, never `userId`.** 23 tests assert each absent field by name. (5.5)

### Client questionnaire

- **Concern tags are 1–4 in the database, 3–4 on screen** — `CONCERN_TAGS_MIN = 1`, `CONCERN_TAGS_ASK_MIN = 3`. Someone with genuinely one concern must not hit a gate the spec does not require, and a single tag is safe because zero overlap shows everyone silently. (5.1)
- **There is NO `email` field on `clientProfiles`** — email belongs to `users`. Two tests assert the stored document has no `email` key. (5.1)
- **Draft persistence is sessionStorage, NOT localStorage.** The most sensitive thing in this flow is `concernTags` — a list of someone's mental health concerns beside their name, age and email. localStorage would leave that on a shared computer for a fortnight. A test asserts localStorage is never written. (5.1)
- **NO 18+ restriction on clients** — developer's decision. Bounds are 1–120 as a sanity check. The therapist application *does* hold an 18+ floor. (5.1)
- **Relationship status is a fixed dropdown including "Prefer not to say"** — **the list is mine, not Asad's, and wants his confirmation before launch.** (5.1)
- **Redux here, not React Hook Form**, because these answers must outlive the `/questionnaire` route — `/matches`, `/therapist/:id` and `/checkout` all read them. Nothing sensitive is persisted by the store itself. (5.1)
- **The therapist form uses ONE `useForm` for all 33 fields**, so Back and Forward cannot lose data. localStorage draft, 14-day expiry, **password stripped on write and on read**. (3.3, 3.5)
- **THE PASSWORD IS NEVER RENDERED ON THE REVIEW SCREEN, not even as dots.** (3.5)
- **Timezones and countries are derived from `Intl`, never typed out** — 417 zones grouped into 10 regions, 197 country names from ISO codes. Only the two-letter code is stored. (3.3)

### Working hours across timezones — the piece most likely to be silently wrong

- **Working hours are recurring LOCAL times, not timestamps**, so §15's "store UTC, convert on display" does not apply directly. `lib/workingHours.js` is the single implementation and must not be duplicated. (5.6)
- Three real traps it handles: **the day rolls over** (Perth Monday 09:00–17:00 is Sunday 20:00 in Toronto), **DST makes any weekly answer approximate**, and **a span can cross midnight in the viewer's zone when it did not in the therapist's**.
- **The wall-clock-to-instant conversion runs two passes** — a single pass leaves a residual error exactly on a DST boundary.
- **Use `timeStyle: 'short'`, never `hour: 'numeric'`** — the latter renders "4:30" in 24-hour locales, which is ambiguous with no am/pm. (7.1)

### Frontend architecture and UI rules

- **`ProtectedRoute` is not security and says so in its own comment.** It decides what to render; the server guards are the protection. (1.6)
- **A signed-in user on the wrong portal is redirected, not refused.** (1.6, 7.1)
- **The access token is in memory only** — never Redux, never localStorage, never sessionStorage.
- **Errors that matter are persistent alerts, not toasts.** A toast slides away on a timer, and someone anxious who has just failed to sign in may still be reading. (1.6)
- **A text "Show password" toggle, never an eye glyph** — unicode glyphs standing in for a drawn icon system are banned, and a text label states what it will do. (1.6, 3.3)
- **Native `<select>` and native `<input type="time">`**, not custom comboboxes — keyboard and screen-reader correct everywhere, and the platform picker on phones. (0.4, 3.3)
- **Limits are drawn, not written.** The 3–4 tag rule is four slots that fill in; at the ceiling the remaining chips lock rather than erroring. (3.4)
- **Counters never truncate and there is no `maxLength`** — silently losing pasted text is worse than being told to trim. Counters are `aria-hidden`; the limit is stated once in helper text. (3.4)
- **Specialty tags and treatment orientations look deliberately unequal**, because §15 says only one of them decides matching. (3.4)
- **Focus moves to the step heading on every step change.** (3.3)
- **Empty and no-search-results are different states** and must not share a component. (4.1)
- **React Compiler objections are fixed at the root, never silenced** — a ref written during render becomes an effect, a setState-in-effect becomes a render-phase adjustment or a lazy initialiser. Established 0.6, repeated 3.5, 4.1, 5.1, 7.4, 7.6.
- **No Fraunces in the admin chrome** — a serif over dense table data is the wrong register. (4.1) *(Slice 7 carries one deliberate exception: the chat opening screen.)*
- **Portal navigation rails are dark ink for an accessibility reason, not a stylistic one** — gold is 1.63:1 on light and banned as text or an indicator, so ink is the only ground where the accent can mark the current section (11.08:1). (4.1, 7.1)
- **Active states are never colour alone** — always weight, or a ground, or a rule as well. WCAG 1.4.1. (0.5, 4.1, 7.1)

### Accessibility floor, and what measuring has actually caught

- **Every contrast ratio is computed, never eyeballed.** **The impeccable detector runs DEGRADED on this machine** — `htmlparser2`, `css-select`, `css-tree` and `domutils` are absent, so its empty result is a *degraded empty* and it evaluates no contrast at all. Every ratio in this project came from a calculator. Recorded since 2.1 and re-checked every chunk since.
- **Known-good values:** `ink/60` is 4.74:1 on paper (the minimum for body text) · `ink/50` is 3.46:1 on paper and 3.08:1 on mist (the minimum for a control border) · `ink/70` is 6.74:1 · ink on paper is 18.06:1 · paper on ink is 18.06:1 · gold on ink is 11.08:1 · clay is 5.48:1 on paper, 4.90:1 on mist · `sage-deep` is 5.48:1 on paper · plain `sage` is 3.44:1 and **fails for text**.
- **`ink/35` is 2.24:1, not the 3.45:1 chunk 0.4 recorded.** That wrong figure put every gold button on the site below the 1.4.11 floor until 3.3 measured it. Borders are `ink/50`.
- **A tint composites over whatever is behind it.** The same clay title is 4.42:1 on mist and 4.90:1 on paper — the failure found in 7.1.
- **Differentiate by hue, never by opacity.** A faded version of the same colour is what failed in 7.4.
- **The floor itself:** 360px, visible keyboard focus, 44×44px targets, semantic HTML, `prefers-reduced-motion` fully respected, 150–250ms functional interactions, sentence case, no dark patterns, the eight palette tokens and no ninth.
- **One flagged deviation from the type scale:** portal tab-bar labels are 11px against the 14px caption floor, because "Worksheets" does not fit at 360px. The icon carries the meaning. (7.1, extended to the unread badge in 7.6)

### False-confidence tests — the recurring failure mode of this project

Seven caught so far, and **every one passed while proving nothing**. Listed because the pattern repeats and mutation testing is what finds it.

1. **1.3** — the "deactivated user cannot refresh" test reused a rotated token, so the 401 proved revocation, not deactivation.
2. **4.2** — see the archive.
3. **7.2** — the unread badge test seeded only therapist messages, so "drops to zero" would have passed with the `senderId ≠ me` exclusion deleted.
4. **7.3** — "persists before it emits" passed against a deliberately inverted implementation, because the network round-trip let the save win. Rewritten to assert order. `Message.prototype.save` alone does not intercept `Model.create` in Mongoose 9 — **both must be patched.**
5. **7.6** — the linkifier's XSS tests: widening the regex so `javascript:` matched broke *nothing*, proving the allowlist rather than the pattern carries the security.
6. **10.2** — the case-insensitive sort fixture sorted identically in binary order, so deleting the collation broke nothing. Caught before it shipped; the fixture now uses names whose byte and human orders disagree.
7. **10.3** — the import-graph walker followed only `from '…'`, so a bare `import '…'` of the review read service onto the client path passed every test. 8.6's private-notes walker had the same hole; both now match bare and dynamic imports too.

**Standing practice: every guard gets mutation-checked, and the number of tests it breaks is recorded.**

### Open items carried out of Slices 0–5

- **Relationship-status list wants Asad's confirmation** before launch. (5.1)
- **The compensation wording on `/join-as-therapist`** — "guaranteed weekly session rates" — wants Asad's confirmation, since "guaranteed" is a commitment. (3.3)
- **Chunk 12.3:** refresh-token reuse detection (1.3), server-side idle enforcement via `lastSeenAt` (4.1), the emailed password versus a set-password link (6.4).
- **`clientProfiles` has no timezone field**, so every portal uses the browser's zone. Settled pattern since 5.6.
- **Admin 2FA does not exist** — planned as email OTP via Resend; chunk 10.5 was deferred to a pre-launch security review (2026-09-24). Pre-launch blocker 12.
- **`peace.jpg` is 5.6 MB** and still unoptimised.

---
## Slice 6 Summary (Payments & Subscriptions)

> Condensed 2026-09-16. The full six chunk entries are in
> `docs/archive/ongoing-slices-0-6.md`.
>
> **This slice handles real money.** Everything below is a rule that is currently
> load-bearing in production code. If a later chunk appears to contradict one of
> these, stop and check the archive before changing it.

**Chunks:** 6.1 models · 6.2 checkout session · 6.3 webhook + idempotency · 6.4 the four-document transaction · 6.5 checkout UI · 6.6 welcome page.
**Collections written:** `bookings`, `subscriptions`, `paymentEvents`, `pendingCheckouts` (+ `users`, `clientProfiles` at 6.4).
**Package:** `stripe` (test mode). **Env:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.

### 1. Money is stored in MINOR UNITS. Always.

**€200.00 is `20000`, never `200`** — decided 2026-09-07, closing an open item from 4.4.

- Stripe speaks cents, so nothing converts between the platform and our ledger — and a conversion is exactly where a ×100 bug lives.
- `paymentEvents.amount` must match Stripe **exactly**, because it is the dispute record.
- Integers never lose a cent; floats do, once proration or partial refunds appear.
- `SUBSCRIPTION_AMOUNT_MINOR = 20000` in `constants/payments.js` is the single source. A test pins it **and** pins the model default to it — if that ever reads `200`, every money figure is out by a factor of 100 and nothing else would fail.
- `formatMinorUnits()` (server) and `client/src/lib/dashboardFormat.js` (browser) are the only two places that divide.

### 2. The golden rule, and where it is actually enforced

**Account creation happens on webhook confirmation only — never on browser redirect.**

The chain, in order:

```
POST /checkout/create-session
  → validate questionnaire TWICE (Zod, then a real ClientProfile validated in memory)
  → refuse a registered email (one unified 409)
  → re-verify the therapist exists and is ACTIVE
  → write the pendingCheckouts draft FIRST
  → create the Stripe session
  → write the session id back (non-fatal)
        ↓ client pays on Stripe's hosted page ↓
POST /api/v1/webhooks/payment
  → verify the HMAC signature over the RAW bytes
  → PaymentEvent.create() — the ledger row, written BEFORE anything is acted on
  → routeEvent (awaited)
        ↓ checkout.session.completed ↓
  → idempotency guard at the EFFECT, not the ledger
  → withTransaction: users + clientProfiles + bookings + subscriptions
    (and the pendingCheckouts draft consumed INSIDE the same transaction)
  → commit, THEN send the welcome email
```

**The application never touches card details.** No card field is accepted and none could be — the schema strips unknown keys, and a test posts `cardNumber` and `cvc` and asserts neither is stored nor forwarded. **There is deliberately no Stripe publishable key anywhere in this project**; the browser is redirected by URL, so no Stripe.js runs in our frontend.

### 3. Idempotency has TWO layers, and the second one is the important one

**Layer 1 — the ledger, atomic via the compound unique index.** The handler attempts `PaymentEvent.create()` rather than a race-prone `findOne`-then-`create`. MongoDB accepts the first write and throws `11000` on a duplicate, which returns `200 { received: true, duplicate: true }`.

> **CONTRACT: match on `{ platform, platformEventId }`, NEVER on `platformEventId` alone.** The index is compound (approved 2026-09-07) so that a future PayPal event id colliding with a Stripe one cannot silently refuse a real payment event.

**Layer 2 — the effect guard, which is what actually protects the account.** 6.3 left a real gap: the ledger row is written *before* the handler runs, so if the handler failed, Stripe's retry would be recognised as a duplicate **event** and skipped — and the payment would never be acted on. **The ledger cannot be its own guard.**

So 6.4 asks instead whether a `subscriptions` record already exists for this `platformSubscriptionId`. That record exists only if the whole transaction committed, so its presence is proof the work is done and its absence means it is still outstanding, whatever the ledger says. The partial unique index on `platformSubscriptionId` is the atomic backstop for two retries arriving together.

**Two tests pin it, and the second is the one that matters:** an identical replayed event, and *a different event id carrying the same subscription* — precisely the case a ledger-based check lets straight through.

### 4. The four-document transaction

`users` + `clientProfiles` + `bookings` + `subscriptions`, in one `withTransaction`, **plus the `pendingCheckouts` draft deleted inside the same transaction** — so a rollback puts the draft back and a retry can still succeed. Deleting it afterwards would strand a failed attempt with no questionnaire to rebuild from.

- **Tested against a real replica set** (`startMemoryReplSet`). On a standalone instance transactions do not exist, every write succeeds, and a rollback test passes while proving nothing.
- The rollback test fails on the **last** of the four, so the first three have genuinely been written and must be undone. It asserts each of the four is back to zero individually, and that the draft survives.
- **Mutation-checked: taking the writes out of the transaction broke 2 tests; removing the idempotency lookup broke 1.**
- **The therapist's USER id goes on the booking, not their profile id.** §10.5 links two users and both portals query it that way. Using the profile id would look fine until the therapist portal returned nothing.
- **A couple is one user and one profile**, partners nested under `coupleData`, passed straight through with no reshaping.
- **A deactivated therapist aborts the whole thing** — re-checked here as well as at checkout, because a therapist can be deactivated while the Stripe page is open. The draft is deliberately **kept** so the payment can be resolved by hand.
- **A missing draft with no existing account fails loudly with a 500.** The 26-hour TTL expired, the questionnaire is genuinely gone, and no retry can fix it — so it surfaces as a failed delivery in Stripe's dashboard rather than disappearing. Somebody has paid €200; silence would be the wrong failure. `paymentEvents.rawPayload` holds everything needed to rebuild it by hand.
- **`routeEvent` is awaited.** An un-awaited promise would return 200 to Stripe before the transaction finished, so a failure would be invisible.

### 5. `paymentEvents` — the immutable ledger

**Never updated, never deleted.** Blocked at the model and each proven by its own test: `updateOne` · `updateMany` · `findOneAndUpdate` · `findOneAndReplace` · `replaceOne` · `deleteOne` · `deleteMany` · `findOneAndDelete` · `doc.deleteOne()` · re-saving an existing document · `bulkWrite` · an aggregation carrying `$out` or `$merge`.

- `updateOne` and `deleteOne` exist as **both** query and document middleware, so both are registered `{ document: true, query: true }` — a hook registered for one form lets the other straight through.
- **THE HOLE, STATED PLAINLY:** the raw driver bypasses Mongoose entirely and cannot be blocked from a schema. This stops accidents, not deliberate circumvention. **Closing it needs a production database user without update or delete rights on this collection — carried to chunk 12.5.**
- **`subscriptionId` and `clientId` are optional on purpose.** Every webhook is logged *before* it is acted on, and on a first payment neither the user nor the subscription exists yet. Requiring either would make the first event of a client's life impossible to log — the one event a dispute is most likely to be about. 6.4 links them on the way out.
- **`eventType` is free text, not an enum.** An enum would reject an unanticipated type, and a validation error drops the record — so the ledger would be missing precisely the surprising events worth investigating.
- **`currency` is free on the ledger but EUR-only on `subscriptions`.** The subscription records what we charge; the ledger records what actually arrived. An unexpected currency is something to investigate, not to refuse to write down.
- **`rawPayload` is `select: false` and stripped from `toJSON`.** Storing it is the audit trail; exposing it is not.
- **Mongoose 9 note:** these guards are zero-argument hooks that `throw`. The classic `function (next)` style threw `TypeError: next is not a function` on **every insert**. A hook that looks registered is not the same as a hook that fires correctly.

### 6. `pendingCheckouts` — the fifteenth collection

Spec addition, **approved 2026-09-07**. §12's golden rule puts account creation behind the webhook, but the questionnaire is answered minutes earlier in a browser and has to survive until then.

- **Stripe `metadata` was rejected** on two grounds: values cap at 500 characters, which a couple's answers breach — and, the real objection, it would put somebody's mental health concerns on a third party's servers for no reason. **A test asserts no questionnaire data reaches Stripe at all.**
- **A TTL index on `expiresAt`, and this is NOT the chunk 1.3 mistake.** That warning was about `refreshTokenExpiresAt`, which lives *on* the `users` record — TTL there would delete entire accounts. Here **the whole document is the disposable thing**, so deleting all of it is precisely the intent. The distinction is the field's owner, not the index.
- **26 hours, deliberately longer than Stripe's 24-hour session.** The draft must outlive the session it belongs to, or someone paying near the end of the window arrives at a webhook with no answers behind them. A test pins that the draft TTL is strictly longer.
- **Privacy:** it holds concern tags for people who have not paid and may never become clients. Never logged, never returned by any endpoint, stripped from `toJSON`, deleted inside the 6.4 transaction, gone within 26 hours otherwise.

### 7. Stripe integration specifics

- **Inline `price_data`, not a dashboard price id** — developer's decision, 2026-09-07. The amount Stripe charges and the amount stored come from **one line of code**, so they cannot silently diverge. It also removes a manual setup step and the `STRIPE_PRICE_ID` variable. **Cost: `product_data` creates a new Stripe Product on every checkout**, so the dashboard's product list grows one row per attempt. Tolerable at this volume; the fix is one line if it becomes annoying.
- **The API version is pinned to the one the SDK ships with** (`2026-08-26.dahlia` for stripe 22.6.1). Pinning to a version the SDK does not expect is worse than not pinning, because the request and the types disagree.
- **Raw body mounting order matters.** `express.raw({ type: '*/*', limit: '1mb' })` is mounted on `/api/v1/webhooks` **before** `express.json()` in `app.js`, or the HMAC verification fails on corrupted bytes.
- **`billing_reason === 'subscription_create'` guards `invoice.payment_succeeded`**, so the first invoice is never double-processed as a renewal.
- **Unknown event types are logged and return 200** without crashing or triggering unnecessary Stripe retries.
- **Two startup guards, and the second is the one that matters:** production refuses to start without `STRIPE_SECRET_KEY`, and **production refuses to start with an `sk_test_` key** — a test key in production would accept real subscriptions and never charge a card, and the business would not find out until the money failed to arrive.
- **Stripe's own error text never reaches the caller** — a 502 with a fixed message.
- **Nothing from the checkout request body is logged.** It carries an email, concern tags and, for a couple, two people's names and ages.
- **Handlers stubbed for slice 11: none remain.** `invoice.payment_succeeded` was built in 11.1 (which also started routing duplicate events to their handlers), `invoice.payment_failed` in 11.2, and both `customer.subscription.*` events in 11.3.

### 8. Subscription records and the lifecycle constraints

- **`sessionsRemaining` has `max: 4`** — §13's no-carry-over rule made impossible to break by construction rather than something to remember.
- **`currentPeriodEnd` is read from Stripe, with a +1 month fallback** (approved 2026-09-09). That date is shown as "Next payment" and drives slice 11's reminder emails; a hand-computed date drifts from Stripe's real schedule and then we email people on the wrong day. **The fallback is deliberate and tested** — if the Stripe call fails the account is still created, because refusing an account somebody has paid for would be far worse.
- **`cancelledAt` survives the later move to `expired`** — a test pins it. Losing it destroys the only stamp saying why the subscription ended.
- **Two "one live row" partial unique indexes** (spec additions, approved 2026-09-07):
  - `bookings` — one **active** booking per client. Ended bookings exempt, so history survives. A test confirms one therapist may still hold many active bookings.
  - `subscriptions` — one **active** subscription per booking. Cancelled and expired exempt so a re-subscribe keeps its history. **Lower confidence: if slice 11 genuinely needs two live rows on one booking, this is the index to drop.**
- **`platformSubscriptionId` uses a partial index on string values, not `sparse`.** `sparse` only skips a *missing* field; rows explicitly holding `null` would still collide, and `null` is what a careless insert writes.
- **`platformCustomerId`** — spec addition, approved 2026-09-09. Slice 11 needs it for the billing portal and failed-card updates. **Deliberately not unique**, because Stripe reuses one customer across a cancel-and-resubscribe.
- **`checkoutSessionId`** — spec addition, approved 2026-09-10. The **only** link from the id in the `/welcome` URL back to the account created, because the draft is deleted inside the transaction.

### 9. The client's temporary password

A client never chooses a password — no account exists until the money does. One is generated and emailed, per §16. **This is the opposite of the therapist welcome email**, which deliberately carries no password because they chose their own on the application form (§11).

- **`crypto.randomInt`, not `randomBytes % length`** — the modulo version is biased toward the start of the alphabet and quietly shrinks the keyspace.
- **The alphabet omits `0 O 1 l I`** — this is read by a person out of an email.
- 16 characters of a 55-character alphabet (~92 bits) and still retypable. **Never logged**; it exists in exactly two places, the email and the bcrypt hash.
- **THE STRONGEST TEST IN THE SLICE:** the emailed password is fed to the real `POST /auth/login` and must return 200 with `role: client`. Everything else could pass while the emailed password did not match the stored hash, and nobody would find out until a real person was locked out of something they had paid for.
- **SECURITY NOTE, RECORDED RATHER THAN ACTED ON.** A password sitting in an inbox is a standing credential and nothing forces a change. The stronger pattern reuses the 1.5 reset-token machinery — create the account with a random hash nobody knows and email a single-use 30-minute "set your password" link. Raised before building; the developer chose the briefed approach, which the spec supports. **Worth revisiting at chunk 12.3.**

### 10. The renewal disclosure (§13) and the welcome page

**The disclosure sits on an `ink` panel on a `paper` page, and that inversion IS the mechanism.** Prominence comes from contrast, not from an alarm colour — `clay` or amber would signal something is wrong, and nothing is wrong. The dark ground also makes gold legible at 11.08:1, which it can never be on paper.

- **The §13 sentence is quoted verbatim, at body size, never in a caption.** It is a commitment to the person paying, not copy to tighten.
- **The billing rhythm is drawn** — four marks on a dissolving rule, "Every month, until you cancel." The marks are `aria-hidden`, so the caption stands alone for a screen reader.
- **It also appears on Stripe's own page** via `custom_text.submit.message` — the last screen before a card is charged.

**`/welcome` REPORTS. IT DOES NOT CREATE.** `GET /checkout/session-status?sessionId=cs_...` answers with one word:

| Answer | Meaning |
|---|---|
| `ready` | a subscription exists — the transaction committed |
| `processing` | the pending draft is still there — the webhook has not been through |
| `unknown` | neither: expired, or invented |

- **Nothing else ever leaves it** — no email, no therapist, no amount, no name. A payment confirmation page is a link people paste and screenshot.
- **`unknown` deliberately does not separate "never existed" from "expired"**, so the endpoint cannot probe for valid session ids.
- **It checks the subscription, not the draft** — a subscription exists only if the whole transaction committed.
- **Query string, not path**, because `requestLogger` logs `req.path` and never the query string, and a payment session id has no business in our logs.
- **Rate limit deliberately loose** (120 per 15 min, against checkout's 10 per hour) — the page polls every 2s, and throttling an honest visitor moments after they paid €200 would be the worst possible time to show an error.

### 11. Open items carried out of Slice 6

- **Chunk 12.5: restrict the production database user's rights on `paymentevents`** to close the raw-driver hole in the append-only guard.
- **Chunk 12.3:** the emailed password versus a set-password link.
- **Slice 11 owns:** renewal, `past_due` and the ~3-day grace period, cancellation, expiry, the billing portal, and flipping a cancelled subscription to `expired` on the same `currentPeriodEnd` boundary the 7.1 access gate compares against.
- **Refunds are handled by Asad in the Stripe dashboard** — no refund logic is built, per §12.
- **The final payment platform is still an open item for Asad** (§21). PayPal, if wanted, is a second separate integration, not a configuration change.
- **11 remaining `{VALUES}` enum messages** in `User.js`, `ClientProfile.js` and `TherapistApplication.js` — Mongoose does not substitute that token. Cosmetic; one line each.

---
# SLICE 7 — Client Portal & Chat

> Kept in full. These are the live chunks: the access gate, the messages model,
> the socket layer, the chat UI, the mandatory first message, and unread badges.

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

---

## Chunk 7.6 — Unread badges and chat polish

**Status: Complete.** Nothing skipped. **SLICE 7 IS FINISHED.** The brief's own verify step was run live against Atlas. Not seen rendered — see "Yours to check".

Built — server:
- `services/chat.service.js` — `pushUnreadToRecipient()`, and the call on the write path.
- 7 new tests in `realtime/socket.test.js`.

Built — client:
- `lib/chat/` — `unreadStore.js` · `unreadContext.js` · `useUnreadTabTitle.js` · `linkify.js`
- `lib/` — `useOnline.js` · `useVisualViewport.js`
- `components/portal/` — `UnreadProvider.jsx` · `UnreadBadge.jsx`
- `components/portal/client/chat/` — `MessageText.jsx` · `MessageAnnouncer.jsx`
- Edits: `ClientPortalShell.jsx` · `ClientRail.jsx` · `ClientTabBar.jsx` · `MessageThread.jsx` · `Composer.jsx` · `MessageCluster.jsx` · `SystemNotice.jsx` · `TypingDots.jsx` · `Chat.jsx` · `useChat.js` · `messageStore.js` · `chatApi.js` · `chatContent.js` · `clientPortalContent.js` · `index.html`

**No new packages, no new environment variables, no new colour or type tokens.**

---

### THE GAP THAT MADE THIS CHUNK NECESSARY: THE BADGE COULD ONLY GO DOWN

§14 says *"Socket.io pushes badge updates live so counts change without a page refresh."* Half of that was built. `markRead` pushed `unread:update` to the reader, so the count went **down** live. **Nothing pushed it up.** A client sitting on Worksheets or the Journal learned a message had arrived only by opening the chat or reloading the page — which is precisely the person the badge exists for.

`sendMessage` now pushes the recipient's new count to their own room after the write commits. **To the recipient only:** the sender's count did not change (their own message is never unread for them), and emitting to the booking room instead would tell the sender their message had been received — the read receipt deliberately left out in 7.2.

**Skipped entirely when no socket server is attached.** `emitUnread` already no-ops, but the aggregation behind it would have run on every send regardless. Reading the attachment first keeps the REST-only path — the whole Jest suite, and any deployment without sockets — at exactly the cost it had before. **A test asserts `Message.aggregate` is never called in that state**, rather than trusting the comment.

**Mutation-checked: removing the push broke 7 tests.**

---

### DECISIONS MADE

- **The server is the truth; the socket is the speed.** `GET /chat/unread-count` on mount and on every reconnect is what makes the number right; `unread:update` makes it instant. A `message:new` that arrives before its push raises the badge locally so it never lags a message already on screen — and the server's number overwrites it a moment later, so a local guess can never leave the badge permanently wrong.
- **`UnreadProvider` is role-agnostic and lives in `components/portal/`, not `portal/client/`.** §8.1's therapist sidebar needs exactly this — one count per booking — and nothing in it assumes a single conversation. Built once rather than twice.
- **GOLD ON INK FOR THE BADGE, NOT CLAY.** Clay is the error token. A message from your therapist is not an error, and a red badge reads as an alarm to exactly the reader least able to absorb one. Gold is the accent for "attention here" and is the one colour that carries on a dark surface — **11.08:1 on ink, against 1.63:1 on paper**, which is why both portal navigations are ink in the first place. *(Note: §24.2 states 9.5:1 for this pair. Computed here and in chunk 7.1 it is 11.08:1. The spec figure is slightly off; the token is unchanged either way and passes comfortably.)*
- **The pill is `aria-hidden` and the count goes in the link's accessible name** — "Chat, 3 unread messages". A bare numeral announced on its own means nothing. `unreadLabel` lives in the store so the rail and the tab bar cannot word it differently.
- **`unread: true` is declared on the nav DATA**, not checked against the route in two components, so the two navigations cannot disagree about where the badge belongs.
- **Not built on the `Badge` primitive (0.4).** That is a bordered `px-3` status label sized for words; a count is a different shape and has to stay inside a 64px tab at 360px.
- **The open conversation is suppressed rather than allowed to flicker.** When the reader is at the bottom of a visible thread, increments for that booking are ignored and its count is cleared locally — so the badge never flashes 1 and back to 0 in front of somebody watching the message land.
- **Mark-as-read now refuses outright while the tab is hidden**, inside `markRead` rather than at each call site, so every path inherits it. A `visibilitychange` listener fires it when they actually look. Marking messages read on a background tab is a lie the badge then tells.
- **NO AUTOMATIC RETRY OF A FAILED SEND, and this is a correctness decision rather than a scope one.** `clientMessageId` is never stored server-side, so the server cannot recognise a repeat. If a send landed and only the acknowledgement was lost, an automatic retry would post the message **twice** — and a duplicated message in a therapy conversation is worse than a visible failure. Retrying stays the reader's deliberate act.
- **A failed row now says WHY when the server said why.** "Not sent" alone is a dead end: someone who hit the rate limit or the 5,000-character cap could only guess, and guessing wrong means writing it all again. Transport failures (offline, timeout) still fall back to the plain wording, because "Not sent" is the honest description there.
- **The offline line appears only when the BROWSER reports no network** — never merely when the socket is down. Chat works completely over REST (§14), so a dropped websocket is invisible and harmless, and announcing "reconnecting" then would worry somebody about nothing. This also puts `chat.offline` to use: it was written in 7.4 and referenced nowhere.
- **Nothing about the message goes in the tab title** — not the text, not the therapist's name. A tab title is visible in a tab strip, over a shoulder, in a screenshot and in browser history, which makes it the least private surface the product has. `(3) Cast of Mind` is enough to bring someone back and discloses nothing.

---

### THE ACCESSIBILITY PASS, INCLUDING THREE DEFECTS ALREADY PRESENT

- **A dedicated live region, not `aria-live` on the thread.** A live region on the list would announce the entire first page on load, every page of history scrolled back through, and read the reader's own sent messages back to them. This one is fed only by arrivals.
- **The 400-character line** (developer's decision, 2026-09-16): the full text under it, sender-only above. A live announcement cannot be paused, replayed or navigated, so a long one interrupted is simply gone. Past that length the message is better read from the log.
- **TWO ALTERNATING REGIONS, and that is not decoration.** A live region speaks only when its content *changes*, so the same message twice in a row would be announced once and the second would vanish silently. The usual fix — blank it, re-fill it a tick later — means setting state from an effect, the React Compiler objection this project fixes at the root (0.6, 4.2, 5.1, 7.4). Alternating between two regions gets the same guarantee **by derivation alone, with no effect at all.**
- **`role="log"` and `tabIndex` on the thread** — it was an anonymous scrolling div, so a keyboard user had nothing focused to scroll with.
- **A real "Load earlier messages" button.** Loading history was **scroll-only**, which meant a keyboard or screen-reader user simply could not read back through their own conversation. The scroll trigger stays; this adds the path that did not exist.
- **TypingDots no longer announces.** It carried `role="status"`, so a screen reader said "Priya is typing" every time the indicator appeared — repeatedly through a long message, and again on every pause and restart. Typing is a glance-level cue with no action attached.
- **Focus no longer falls to `<body>` after a successful retry.** The Retry button unmounts with the failure row, and a keyboard user was being dropped at the top of the page having just fixed something. Focus returns to the composer.

---

### LINKS, AND THE MUTATION TEST THAT TOLD ME SOMETHING USEFUL

`linkify.js` returns **data**, and `MessageText` builds real elements from it. The obvious implementation — a regex replace producing `<a>` tags and `dangerouslySetInnerHTML` — is a cross-site-scripting hole, because everything the regex does *not* match goes into the DOM as markup too. One message containing a script tag would execute in the other person's session, on a platform holding their therapy history. **There is no path here that produces markup.**

**Two independent defences**, and the mutation run showed exactly how much each carries:

1. The pattern matches only `https?://`, `www.` and emails.
2. `safeHref` parses the candidate and allows only `http:`, `https:` and `mailto:`.

**Widening the regex so `javascript:`, `data:`, `vbscript:` and `file:` all match it — all 78 checks still passed.** The allowlist alone holds the line. **Removing the allowlist as well — 8 checks failed.** So the guard is real and it is defence 2 that is doing the work; the regex is the outer fence, not the lock.

Trailing punctuation is trimmed, with balanced-bracket handling, so `read https://en.wikipedia.org/wiki/Ireland_(island).` keeps the bracket and loses the full stop. A fresh regex per call, because a module-level `/g` pattern carries `lastIndex` between calls and would silently skip matches on the second message — checked directly.

System notices are linkified too: 9.3's session messages carry a Zoom link, and a join link nobody can click is the whole notice wasted.

**Long messages are NOT collapsed** — developer's decision, 2026-09-16. Folding away what somebody wrote about how they are doing puts a "show more" on the one thing on that screen that should never need permission to be read.

---

### THE MOBILE KEYBOARD

The shell is `h-dvh` with `overflow-hidden`, which is what gives the chat a definite height to scroll inside (7.4). On iOS the keyboard is drawn **over** the viewport rather than shrinking it, so `dvh` does not change and the composer ends up underneath it.

Two halves, because no single mechanism covers both platforms:
- **`interactive-widget=resizes-content`** on the viewport meta — the declarative fix, honoured by Chromium. **This line is global and affects every page, not only the portal**, which is why it was approved explicitly rather than slipped in.
- **`useKeyboardViewportHeight`** measures `visualViewport` and takes over the shell's height only while a keyboard is genuinely up — a 150px threshold, so a mobile toolbar collapsing on scroll does not trigger it. Null the rest of the time, so `dvh` governs in the ordinary case.

The thread also re-pins to the bottom on a viewport resize if the reader was already there, otherwise the newest message slides behind the keyboard the moment it opens.

---

### CONTRAST — TWO REAL FAILURES FOUND BY MEASURING

| What | Was | Now |
|---|---|---|
| Link underline, `ink/40` on the paper bubble | **2.58:1 FAIL** | inherits the text colour — **19.67:1** |
| "Load earlier" border, `ink/25` on mist | **1.55:1 FAIL** | `ink/50` — **3.08:1** |

The underline one matters more than the number suggests. A link here sits in the **same colour as the words around it** — there is no second colour available inside an ink bubble — so the underline is the only thing marking it as a link, which is what WCAG 1.4.1 requires. At `ink/40` it was too faint to do the one job it has. It now inherits the text colour at full strength (19.67:1 in their bubble, 18.06:1 in mine) and hover thickens it rather than darkening it.

The button one is the §24.9 rule biting: a paper button on the mist thread ground is 1.11:1 between the two surfaces, so the border **is** the boundary and 1.4.11 wants 3:1 for it. `ink/50` is the same token chunk 0.4 settled on for input borders, for the same reason.

**16 pairs computed, 0 failures after the fixes.** Selected: gold badge on ink **11.08:1** · badge on the active nav row (`paper/10` over ink) **8.32:1** · offline line **6.74:1** · thread focus ring on mist **16.25:1** · load-earlier label **18.06:1**.

**The badge numeral is 11px**, below the 14px caption floor — the same deviation the tab bar labels already carry and which 7.1 flagged. Here it is a numeral on a 11.08:1 pill and the accessible name carries the real information.

---

### TWO TEST-INFRASTRUCTURE FIXES, BEYOND THIS CHUNK AND FLAGGED AS SUCH

Both are about a machine that is slow, not about code that is wrong. Neither weakens an assertion — **a timeout is a guard against a hang, not a claim about behaviour.**

1. **`test/mongoMemory.js` — `launchTimeout` 10s → 60s.** The library's default let `mongod` fail to start under load, and the whole file then reported as 48 broken tests with "Instance failed to start within 10000ms". That looks exactly like a code failure and is not one. It happened three times on 2026-09-16, every time something else was running alongside. The binary is already on disk, so nothing is downloaded and a healthy start still takes a second or two.
2. **`jest.config.js` — `testTimeout` added at 30s.** Every suite here talks to a real in-memory MongoDB and several also stand up an HTTP server. On the full run, `checkout.test.js` — **a file this chunk never touched** — timed out at the 5s default on "creates no user, profile, booking or subscription", and passed **33/33 in isolation**. A suite that fails at random is worse than a slow one, because it teaches everybody to ignore red. Tests that legitimately need longer still declare their own, so the intent stays visible at the test.

One existing socket test also got an explicit `20000`: it is the only supertest call in a file that has already opened and closed several dozen sockets, measured at 785ms alone and over 12s at the end of a full run.

---

**Verified:**
- `npm test -- --runInBand` — **1033 tests across 36 suites, all passing** (1026 from earlier chunks, 7 new).
- `npm run lint` (server) clean; `oxlint` (client) **0 warnings** on every file this chunk touched. The six that remain are the developer's own in `home/Hero.jsx`, `home/Services.jsx`, `pages/Home.jsx`, `pages/Matches.jsx` and `about/WhyCardsDeck.jsx`, open since 2.2.
- Client build passes. Generated CSS confirmed to carry `border-ink/50`, `min-w-4.5`, `hover:decoration-2`, `underline-offset-2`, `ring-ink` and the gold pill.
- **78 logic checks executed** against the real modules — the client has no Jest suite, so these were run rather than assumed. `linkify`: the reassembly invariant on nine samples (nothing dropped, duplicated or reordered), whitespace and newlines preserved, every scheme case, **five XSS payloads**, trailing punctuation with balanced brackets, no `lastIndex` leak between calls, and a 5,000-character message. `unreadStore`: the total recomputed rather than trusted, malformed rows dropped, increment and clear, same-reference on a no-op, the 9+ cap, singular/plural, and the full round trip a real conversation takes.
- **Mutation-checked three times:** removing the unread push broke 7 tests; widening the link pattern with the allowlist intact broke **nothing** (which is the point — the allowlist carries it); removing the allowlist as well broke 8.
- **16 contrast pairs computed, 0 failures** after the two fixes above.

**LIVE AGAINST REAL ATLAS — 12 checks, all passing.** The brief's own verify step, with a **genuinely fresh paying client** created through the real onboarding transaction against a seeded therapist, and two real sockets:
- a brand new conversation reads zero;
- **the badge rises live on the client's socket the moment the therapist sends**, naming the right booking, and REST agrees;
- **the sender is told nothing** — no reverse read receipt;
- a second message makes two;
- **the therapist's badge rises when the client writes** — the same event §8.1 will use;
- the client's own reply does not raise their own count;
- **reading clears the badge live**, and REST agrees.

**DATABASE SAFETY — the developer's strict instruction was followed exactly.** Only the throwaway client's own records were created and deleted, each by the id recorded on the way in; the message delete was `{ _id: { $in: [three ids] } }` and reported exactly 3, so it could not have reached a fourth. Afterwards: **14 users, 2 client profiles, 2 bookings, 2 subscriptions — identical to the baseline**, both real client accounts intact, zero throwaway records.

**Worth knowing: the message collection is now empty.** The 2-character message recorded in the 7.5 entry was already gone before this run began — 7.5 left that call to the developer and it appears to have been taken. **Consequence: BOTH client accounts now have no messages, so both will show 7.5's opening screen** rather than going straight to the thread.

**Yours to check — nothing here has been seen rendered:**
1. **The brief's own verify step:** two browsers, client and therapist of the same booking. Send from the therapist while the client sits on **Worksheets**, and watch the badge appear on Chat without a refresh. That is the whole chunk.
2. **The badge on both navigations** — the gold pill in the desktop rail, and on the icon's corner in the phone tab bar at 360px. Does the corner pill read as sitting above the icon, or as stuck to it?
3. **The tab title.** Switch to another browser tab, have the therapist send, and confirm the title reads `(1) Cast of Mind` and clears when you come back.
4. **Mark-as-read with the tab hidden** — messages arriving on a background tab must stay unread.
5. **A screen reader** (NVDA or Narrator on Windows). One announcement per arriving message, nothing on typing, and the thread reachable and scrollable with the arrow keys.
6. **A link in a message.** Send `https://example.com` and confirm it is clickable, underlined, and opens in a new tab.
7. **The phone keyboard** — the composer must stay visible with the keyboard open, on a real device. This is the piece most likely to need tuning and the one I cannot test at all.

**Manual steps for the developer:**
1. **No new packages, no new environment variables.**
2. **Restart the API server** — the unread push is on the send path and is read at startup.
3. **Hard-refresh the client** — `index.html` changed, and a cached copy keeps the old viewport meta.

**Carried forward:**
- **Chunk 8.1 reuses `UnreadProvider` unchanged** for the therapist's client sidebar — the per-booking breakdown and the push from the client's side are both already proven.
- **Chunk 9.3** writes the `type: "system"` messages this chunk now linkifies, which is what makes a Zoom link in a session notice clickable.
- Chunk 12.5: the socket URL in production, sticky sessions or a Redis adapter, the `sameSite` cookie and `VITE_API_BASE_URL`.
- Slice 11 must flip a cancelled subscription to `expired` on the same `currentPeriodEnd` boundary the gate compares against (from 7.1).

**Pre-launch blockers — unchanged, the list stands at 13.** No placeholder content was created.

**Not done (out of scope, by design):**
- **No file attachments and no voice**, per the chunk's own "Do NOT" — deferred to v2.
- No therapist-side badges (8.1), no notification bell (10.4), no admin visibility of any kind (§11).
- **No automatic retry of a failed send**, for the duplication reason recorded above.

---

# SLICE 8 — Therapist Portal & Chat

## Chunk 8.1 — Therapist portal layout and client list sidebar

**Status:** Complete. Nothing skipped. **Slice 8 has started.** First entry in the 60–70 line format. Not seen rendered — see Manual steps.

**Built**
- server: `services/therapistClients.service.js` · `controllers/therapistClients.controller.js` · `validation/therapistClients.schema.js` · `constants/therapistClients.js` · `utils/cursor.js` · `utils/clientDisplayName.js` · `routes/therapistClients.test.js` (24 tests). Edits: `routes/therapist.routes.js` (mounts `GET /api/v1/therapist/clients`), `services/chat.service.js` (now uses the two extracted utils).
- client: `pages/portal/TherapistPortalShell.jsx` · `pages/portal/therapist/{ClientsIndex,ClientWorkspace,Notifications}.jsx` · `components/portal/therapist/{TherapistRail,ClientListItem,ClientListEmpty,ClientMonogram,TherapistGlobalNav,TherapistPortalIcons,navIcons}` · `lib/therapist/{useTherapistClients,initials}.js` · `lib/api/therapistClientsApi.js` · `data/therapistPortalContent.js`. Edits: `App.jsx` (three therapist routes), `PortalLayout.jsx` (branches by role, redirects either role off the other's paths), `PortalHome.jsx`, `SkipLink.jsx` (`target` prop). Moved: `PortalSocketProvider` → `components/portal/` (role-agnostic already; no code change).
- Packages / env vars: none.

**Key decisions**
- **The selected client lives in the URL (`/portal/clients/:bookingId`), not in state** — a refresh keeps their place, §8.8's notification can link straight to a client, and the phone's list-then-detail split needs no extra machinery.
- **Keyed on `bookingId`, never `clientId`** — the booking is the central record (§10.5) and every screen from 8.2 onwards hangs off it; a client id would cost a lookup on each one.
- **NO MESSAGE PREVIEW, on the wire or on screen.** Every inbox puts a snippet under the name, and here that snippet is therapy content sitting permanently in a sidebar — over a shoulder, in a screen share, in a screenshot of something else. §8.1 asks for "last activity", which is a time. The server never projects `text`, so it is a boundary rather than a markup choice.
- **No client user id in the response** — same rule as 7.2's messages; `bookingId` is the only handle a therapist's browser needs.
- **The client list is ink, and that is accessibility not taste** — the unread badge is gold, gold is 1.63:1 on light and banned there as an indicator, 11.08:1 on ink. A light list would have no legible colour for the one signal it exists to carry. This also decides the phone: the list is dark at every width, the workspace light.
- **The cursor encoding and the client display name were extracted to `utils/`** (approved) — chat and the client list must never disagree about a page boundary or about whether a couple is "Marta and Joris" or "Marta".
- **One aggregation, two `$lookup` sub-pipelines, whatever the client count** — the backend rules name this exact screen as an N+1 risk. Both sub-pipelines ride indexes `messages` already has.
- **`/portal` is now the inbox; the profile moved to `/portal/profile`** (approved) — §8 makes the client list the portal's home.
- **Notifications ships as a nav entry plus an honest screen** (your call) — §8.8's feed is 10.4, and the screen says so plainly rather than leaving a therapist waiting for alerts that never come. No timeline, as everywhere.
- **The empty state is one sentence and nothing else** — §8.1 explicitly rejected profile prompts, visibility tips and tag suggestions, because a therapist who completed a 33-field application and was approved would read them as "something is wrong".

**Verification**
- Tests: **1057 passing across 37 suites** (1033 from earlier chunks, 24 new). `npm run lint` (server) clean; `oxlint` (client) **0 findings** on every file this chunk touched — the six that remain are the developer's own, open since 2.2.
- **Mutation-checked twice:** removing the `therapistId` scope broke **6** tests; removing the `senderId ≠ me` exclusion broke **1**, which is too few, so the fixture was strengthened with a booking where only the therapist has written — the same false-confidence shape 7.2 caught in this aggregation. It now breaks **2**.
- Contrast: **41 pairs computed, 0 failures.** One real failure caught before it shipped: `ClientMonogram` used `paper` initials, correct at 12.59:1 on the ink rail and about 1.2:1 on the light workspace — a tint composites over whatever is behind it, the same trap 7.1 and 7.4 found. It now carries a tone, `ink` initials on light at 12.81:1. Tightest against their floors: the not-found border at 3.35:1, the rail's button border at 3.81:1, the empty-state leaf at 4.05:1. *(Note: 7.6 recorded `ink/50` on mist as 3.08:1 for a paper button on a mist page; this border has no fill behind it so it composites over mist directly and reads 3.35:1. Different geometry, not a corrected figure.)*
- **14 client logic checks executed** on `initialsFrom` (the client has no Jest suite) — individual, couple, the joining word never becoming an initial, accents, whitespace, the server's fallback name, null/undefined, and no surrogate-pair split.
- **6 icons bounds-checked** against the 24 viewBox including stroke, 0 out of bounds. The checker was rewritten to sample arcs from their true centre rather than read their endpoints — endpoint-only bounds reported the bell's dome 5 units short, the inverse of 5.2's false-failure trap.
- Client build passes; generated CSS confirmed to carry the 320px grid column, `blur(130px)`, `min-h-16`, `size-14`, `tabular-nums` and the panel shadow.
- Impeccable detector `[]` — **read that as a degraded empty**: `htmlparser2`, `css-select`, `css-tree` and `domutils` were re-checked this chunk and are all still absent, so it evaluates no contrast at all. The computed table is the compensation.
- **No live run against Atlas this chunk** — nothing here writes, and the read path is covered by the suite against a real in-memory MongoDB. Nothing in the database was created, modified or deleted.

**Manual steps for the developer**
1. **No new packages, no new environment variables, no external setup.**
2. **Restart the API server** — the `/api/v1/therapist/clients` route is read at startup. **Hard-refresh the client**, since `/portal` changed meaning for therapists.
3. Sign in as a therapist with no clients: you should see only *"No clients yet. You'll see them here once they're matched with you."* — if anything else appears there, that is a bug, not a feature.
4. Sign in as a seeded therapist who has a paying client. Confirm they appear, and that selecting them loads that person's name in the right pane. The workspace itself is 8.2.
5. **The badge is the thing worth testing.** With the inbox open, send a message as that client from a second browser — the row's count should rise and the row should move to the top without a refresh.
6. **At 360px**: `/portal` is the dark list, tapping a client is a separate screen with "All clients" back at the top. Check a long couple name (*"Marta and Joris"*) truncates rather than pushing the badge out.
7. **Keyboard and reduced motion**: tab through the list and confirm the focus ring is visible and gold on the ink ground; with reduced motion on, the skeleton rows must not pulse.
8. **Your old bookmark to `/portal` as the profile page now lands on the inbox** — the profile is at `/portal/profile`.

**Carried forward**
- **Chunk 8.2 builds the workspace tabs** into `ClientWorkspace`, which currently carries the client's identity and one honest line. It is the shell's `Outlet`, so the list and the tabs already share one fetch. `max-w-4xl` was chosen with a tab row and a conversation in mind.
- **Chunk 8.3** can use `meta.awaitingOpeningMessage` from `GET /chat/:bookingId/messages` to show that a newly matched client has not written yet — deliberately kept out of the sidebar in 8.1 (your call) so the rows stay to §8.1's three fields.
- **Chunk 10.4** replaces `pages/portal/therapist/Notifications.jsx` with the real feed; the nav entry and route are already in place.
- **A known limit, stated:** the list refetches its FIRST page when a message arrives, dropping any further pages that were loaded. Page size is 50 against real client counts in the tens, so a live account does not reach it.
- Slice 11 must still flip a cancelled subscription to `expired` on the same `currentPeriodEnd` boundary the 7.1 gate compares against.
- Chunk 12.5: the socket URL in production, sticky sessions or a Redis adapter, the `sameSite` cookie and `VITE_API_BASE_URL`.
- **Pre-launch blockers — unchanged, the list stands at 13.** No placeholder content was created: every word in `data/therapistPortalContent.js` is a spec fact or a plain description of a screen.

**Not done (out of scope, by design):** no per-client tabs, chat, worksheets, sessions or journal/notes (8.2–8.6, slice 9) · no onboarding prompts in the empty state · no notification logic (10.4) · no search or filter on the client list.

---

## Chunk 8.2 — Client workspace tabs

**Status:** Complete. Nothing skipped. Not seen rendered — see Manual steps.

**Built**
- server: `services/therapistClient.service.js` · `controllers/therapistClient.controller.js` · `routes/therapistClient.test.js` (22 tests). Edits: `routes/therapist.routes.js` (mounts `GET /api/v1/therapist/clients/:bookingId`), `constants/therapistClients.js` (the client-field allowlist and the one refusal message).
- client: `components/portal/therapist/workspace/{ClientIdentityStrip,WorkspaceTabs,TabPending,ClientInfo,ConcernChips}.jsx` · `components/portal/therapist/workspaceIcons.js` · `lib/therapist/useTherapistClient.js`. Rewritten: `pages/portal/therapist/ClientWorkspace.jsx` (8.1's placeholder, as planned). Edits: `App.jsx` (`clients/:bookingId/:tab` plus a redirect from the bare id), `TherapistPortalShell.jsx` (derives the active tab, main is now full width), `TherapistRail.jsx` and `ClientListItem.jsx` (carry the tab), `Notifications.jsx` (caps its own width), `TherapistPortalIcons.jsx` (`InfoIcon`), `data/therapistPortalContent.js`, `lib/api/therapistClientsApi.js`.
- Packages / env vars: none.

**Key decisions**
- **Every refusal is a byte-identical 404** — a booking that does not exist, a malformed id, and another therapist's client are indistinguishable. A 403 on the third confirms the id is real, which is the whole of what is needed to enumerate booking ids by diffing responses. This is the strongest form of the chunk's own critical requirement, and it is 7.2's rule reused rather than re-derived.
- **The tab is in the URL and travels with the therapist** (your call) — reading worksheets for one client and clicking the next stays in worksheets. Only the choice travels; `useTherapistClient` is keyed on the booking id and clears **during render**, so no row of one person's record can appear for a frame under another's name.
- **Chat is the default tab** (your call) — §8.2 lists it first and it is why a therapist opens a client. It shows an honest pending panel until 8.3, which is better than moving a URL therapists may have bookmarked.
- **The client's timezone is reported as not collected** (your call). `clientProfiles` has never held one (§10.2 lists none) and the settled pattern since 5.6 is the viewer's own browser zone. A blank row reads as missing data; a country-derived guess would be worse than either. A test pins that no timezone value reaches this endpoint, so nobody can quietly add a guessed one.
- **No email, no billing figures, no Stripe ids.** §8.2 asks for subscription *status*, which tells a therapist why a client may have gone quiet. It does not ask for their money, and email is the one field that turns a clinical record into a mailing list.
- **Both the stored status and the resolved access ship**, as in 7.1 — `access` decides what renders, `status` is what the screen says out loud.
- **An ended booking still loads** and says so in the strip. 8.1's list shows only active bookings, but 7.2 already decided the therapist keeps read access because the record is clinically theirs.
- **Concern chips are shown, message previews still are not.** The opposite call to 8.1's sidebar, and the distinction is not squeamishness: a therapist is the one person these concerns are *for*, §8.2 asks for them by name, and tags chosen from a fixed list are not a quotation from a conversation.
- **The active tab marker is ink, not gold** — gold is 1.63:1 on a light surface and banned there as an indicator, so the accent stays in the ink rail. Marked three ways: rule, weight, and full-strength ink against `ink/70`.
- **A 404 and a network failure are different screens.** The 404 offers no retry, because nothing about it is transient; a timeout or a 500 does, because refusing one would strand a therapist on a page that would have worked a second later.

**Verification**
- Tests: **1079 passing across 38 suites** (1057 from earlier chunks, 22 new). `oxlint` (client) **0 findings** on every file this chunk touched — the six that remain are the developer's own, open since 2.2. **Correction, recorded in 8.3:** this line originally also said server lint was clean. It was not run in 8.2, and it had two errors (an unused rest-destructure in `therapistClient.service.js`). Fixed in 8.3 with no change in behaviour; the 22 tests still pass.
- **Mutation-checked twice, both on the guard the endpoint rests on:** removing the ownership comparison broke **3** tests; downgrading the refusal from an identical 404 to a 403 broke **2**.
- Contrast: **32 pairs computed, 0 failures.** One design fault the numbers caught: the concern chip's `sage/15` fill is **1.17:1** against paper — legible text in a shape with no visible edge. It now carries a `sage/40` ring, the same fix the chat system notice took in 7.4. Tightest against their floors: the retry border at 3.35:1 and the pending-tab icon at 4.69:1.
- **18 client logic checks executed** (the client has no Jest suite): the tab derivation across eight real paths including a trailing slash and the client portal's own routes, the tab set's order and uniqueness, that exactly one tab is built, that no two pending tabs share a body, that all three gender preferences and all five subscription states are worded, and that no copy anywhere promises a timeline.
- **7 icons bounds-checked**, 0 out of bounds. The checker gained `<rect>` support for `InfoIcon` — its first run silently reported bounds that excluded the card, which would have passed while measuring the wrong shape.
- Client build passes. **Two Tailwind findings verified in the generated CSS rather than trusted:** `scrollbar-none` emits only `scrollbar-width`, which Safari did not support until 18.2, so the `::-webkit-scrollbar` rule is kept beside it; and the questionnaire stores the country **display name**, not an ISO code, so nothing here maps one — a code-to-name lookup would have printed "IE" for every real client.
- Impeccable detector `[]` — **a degraded empty**, as in every chunk: the four parsing dependencies are still absent, so it evaluates no contrast. The computed table is the compensation.
- **No live Atlas run.** This endpoint only reads, and the suite covers it against a real in-memory MongoDB. Nothing in the database was created, modified or deleted.

**Manual steps for the developer**
1. **No new packages, no new environment variables, no external setup.**
2. **Restart the API server** — the `/clients/:bookingId` route is read at startup. **Hard-refresh the client**, since the workspace URL gained a tab segment.
3. **The chunk's own verify step, part one:** open a client, move between tabs, and confirm the URL changes and a refresh keeps you on the same tab. Then click a different client in the sidebar and confirm you stay on that tab with the new person's data.
4. **The chunk's own verify step, part two — the important one.** Copy a booking id belonging to a *different* therapist and put it in the URL. You should get "Client not found", identical to what a made-up id gives. The API returns the same 404 for both.
5. **Client info** is the only tab with real content. Check a couple in particular — both partners should get their own row.
6. **At 360px**: the identity strip and tabs are one sticky block, the tab strip scrolls sideways with the active tab brought into view, and the concern chips run on one scrolling line rather than pushing the tabs off screen.
7. **Keyboard and reduced motion**: tab through the tab strip and confirm focus is visible; with reduced motion on, no skeleton should pulse.

**Carried forward**
- **Chunk 8.3 replaces the chat tab**, 8.4 the worksheets tab, 8.6 journal and notes, 9.2 sessions. Each is one component swap in `ClientWorkspace` — the strip, the tabs and the fetch are already in place.
- **THE TIMEZONE GAP IS A SLICE 9 DECISION AND SHOULD BE TAKEN BEFORE 9.2.** Session scheduling converts a therapist's local time into the client's, and with no stored client zone it can only use whatever browser that client last opened. That works, but a therapist cannot see *"6pm mine is 2am theirs"* while choosing a slot — which is exactly when it matters. Adding `timezone` to `clientProfiles` means a questionnaire change and a field that stays null for every existing client, so it is a real trade rather than an oversight.
- **Worth asking:** whether a therapist should be able to see a client's email address. Deliberately withheld here; §8 never lists it and all contact is in-portal.
- Slice 11 must still flip a cancelled subscription to `expired` on the same `currentPeriodEnd` boundary the 7.1 gate compares against.
- Chunk 12.5: the socket URL in production, sticky sessions or a Redis adapter, the `sameSite` cookie and `VITE_API_BASE_URL`.
- **Pre-launch blockers — unchanged, the list stands at 13.** No placeholder content was created: every word in the workspace is a spec fact or a plain description of a screen.

**Not done (out of scope, by design):** no tab contents beyond Client info, per the chunk's own "Do NOT" — no chat, worksheets, sessions, journal or private notes. Nothing on this screen is editable; 8.2 is entirely read-only.

---

## Chunk 8.3 — Therapist chat UI

**Status:** Complete. Nothing skipped. Not seen rendered — see Manual steps. **Three real bugs found and fixed on the way**, two of them in shipped code (7.6 and 8.1).

**Built**
- server: `realtime/emitter.js` (room reconciliation, `bookingId` on every `message:new`), `services/chat.service.js` (passes the booking's two user ids), `realtime/socket.test.js` (7 new tests + one fake server updated). `services/therapistClient.service.js` lint fix (see Verification).
- client: new `components/portal/therapist/workspace/TherapistChat.jsx` · `lib/chat/{openingMessage,draftStore,draftContext}.js`. **Moved** to `components/portal/chat/` (role-neutral, as `UnreadProvider` was): `MessageThread`, `MessageCluster`, `SystemNotice`, `DaySeparator`, `TypingDots`, `Composer`, `MessageText`, `MessageAnnouncer`, `ChatIcons`. Edits: `useChat.js`, `messageStore.js`, `groupMessages.js`, `UnreadProvider.jsx`, `unreadContext.js`, `ClientListItem.jsx`, `ClientWorkspace.jsx`, `TherapistPortalShell.jsx`, `pages/portal/client/Chat.jsx`, `therapistPortalContent.js`.
- Packages / env vars: none.

**Key decisions**
- **THE LEAK THE BRIEF WARNED ABOUT WAS REAL.** `useChat`'s `message:new` handler never checked the booking — harmless for a client in one room, a straight leak for a therapist in every room. Five layers now: the chat remounts with `key={bookingId}`; every socket handler passes `belongsTo(bookingId, event)`, which **fails closed**; every row carries its booking; every late REST result is applied only if its booking is still open; the screen-reader announcer only hears the open booking — otherwise Client A's words would be *read aloud* on Client B's screen.
- **`message:new` never carried `bookingId`**, so the layers above had nothing to check. Added on the emit. The same gap had silently disabled `UnreadProvider`'s instant increment since 7.6 — it returned early on every message, covered by the separate `unread:update` push.
- **All rooms stay joined; the browser never picks one** (your call). "Leave/join" is met at the subscription layer: switching tears down the old chat's listeners.
- **Rooms are reconciled at send time from the STORED booking** (`socketsJoin`). A client who paid while their therapist was online had no room on that therapist's socket, so the opening message — the most important one — did not arrive live.
- **The sidebar badge never cleared (8.1 bug).** `live || client.unreadCount` turns a live 0 into the stale list count. The provider now reports `ready`, and is the only truth once it is.
- **Times in the therapist's PROFILE zone** (§15), with a quiet "Times shown in …" when it differs from the browser's.
- **The opening message is marked only once the whole history is held** (your call), in a cluster of its own. Marking a reply as somebody's opening would be worse than marking nothing.
- **"Not written yet" copy is literally true:** 7.5's opening screen replaces the client's thread, so a therapist who writes first is read only after the client sends theirs.
- **Drafts per client, memory only** (your call) — never browser storage; cleared on send and on sign-out.
- **Your `main` edit in `TherapistPortalShell.jsx` was folded into one rule** (approved): the text `// py-6 sm:py-8 lg:py-10` sat inside the class string, so it was live classes, not a comment. Main has one padding rule again; the workspace cancels it with matching negative margins, and Profile and Notifications get their top padding back.

**Verification**
- Tests: **1086 passing across 38 suites** (1079 from earlier chunks, 7 new). Server lint clean; client `oxlint` **0 findings** on touched files.
- **Correction to 8.2:** its log claimed server lint was clean; it had not been run and had 2 errors (an unused rest-destructure in `therapistClient.service.js`). Fixed here with no behaviour change; the 8.2 entry now says so.
- **Mutation-checked four times.** Removing room reconciliation broke **1** test (the one that exercises it). Dropping `bookingId` from the emit broke **3**. Making the client's `belongsTo` accept everything failed **11 of 47** logic checks, including all five rapid-switch runs.
- A test fake broke on the first full run: "persists before it emits" stubs the socket server with only `to()`, and the emitter now also calls `in()`. The fake was extended; production code was not bent to suit it.
- **47 client logic checks**, including **a rapid-switch simulation** — three clients, 5,000 interleaved events and switches across five seeds, with late responses landing after a switch — and **zero messages ever shown under the wrong client**.
- Contrast: **25 pairs, 0 failures.** Tightest: composer placeholder 4.56:1, opening label 4.93:1, unsent reason 4.93:1. The opening ring (2.07:1) is decorative; the label carries the meaning.
- Two files turned out to be **CRLF**; patched on a normalised copy and written back CRLF.
- Build passes; generated CSS confirmed. Detector `[]` — degraded, as always. **Atlas not touched** (your call).

**Manual steps for the developer**
1. **Restart the API server BEFORE loading the new client.** The browser now refuses any live message without a `bookingId`, and only the new server sends one — the old server with the new client drops live messages in **both** portals until a refresh.
2. Hard-refresh the client.
3. **The brief's verify step:** three test clients, one therapist. Open A, then B, then C quickly while messages arrive — no message may appear under the wrong name, and no screen reader may read one out.
4. Read a thread to the bottom and confirm **both** the sidebar badge and the Chat tab dot clear.
5. Type half a reply to A, switch to B, switch back — A's draft should be there; B's composer empty.
6. A client who has not written: the "has not written yet" panel, and the composer still usable.
7. At 360px: the page must not scroll — only the thread — and the composer stays reachable.

**Carried forward**
- **Chunk 12.5: deploy the server before, or with, the client** — step 1's hazard applies in production too.
- **12.5, again: `socketsJoin` works across instances only with the Redis adapter** — beside the sticky-sessions note already parked there.
- 8.4 worksheets, 8.6 journal and notes, 9.2 sessions each replace one pending tab. The timezone decision (from 8.2) is still owed before 9.2.
- Slice 11: flip a cancelled subscription to `expired` on the 7.1 gate's `currentPeriodEnd` boundary.
- **Pre-launch blockers — unchanged at 13.** No placeholder content.

**Not done (by design):** no voice or attachments; no leave/join events from the browser; no pinned opening-message bar; no live Atlas run.

---

## Chunk 8.4 — Worksheets: therapist side

**Status:** Complete. Nothing skipped. Not seen rendered — see Manual steps. Client side is 8.5.

**Built**
- server: `models/Worksheet.js` · `constants/worksheets.js` · `validation/worksheets.schema.js` · `services/worksheet.service.js` · `controllers/worksheet.controller.js` · `test/zipFixture.js` · `routes/therapistWorksheets.test.js`. Routes on `/therapist`: `POST /worksheets`, `GET /worksheets/:bookingId`, `GET /worksheets/:bookingId/:worksheetId/file/:which`, `DELETE /worksheets/:bookingId/:worksheetId`.
- server edits: `utils/fileSignature.js` (DOCX), `constants/uploads.js` (`worksheet` kind), `services/upload.service.js` (raw files, `destroyFile`), `controllers/upload.controller.js`, `services/therapistClient.service.js` (`loadOwnBooking` exported and shared).
- client: `workspace/{WorksheetsTab,WorksheetUploader,WorksheetRow}.jsx` · `lib/therapist/{useWorksheets,worksheetFiles}.js` · `lib/api/therapistWorksheetsApi.js` · 5 icons · copy in `therapistPortalContent.js` · `ClientWorkspace.jsx`.
- Packages / env vars: none.

**Key decisions**
- **PDF + DOCX, DOCX inspected** (your call). The server reads the ZIP's directory only — nothing is unzipped, so a zip bomb costs nothing. Needs `[Content_Types].xml` + `word/document.xml` and **no `vbaProject.bin`**. `.docm`, `.xlsx`, plain ZIPs and old `.doc` are refused; `.doc` gets a "save as PDF or .docx" fix.
- **Security hole caught before it opened:** the PUBLIC `/uploads` endpoint accepts any kind in `UPLOAD_KIND_VALUES`. Adding `worksheet` there would have let a stranger write into the private folder. It is now excluded; tests pin it, and that a DOCX is still refused as a certificate.
- **Spec addition (§10.8):** `publicId`, `resourceType`, `format` and `bytes` beside each file URL — needed to sign, stream and delete. URLs and ids never leave the server.
- **Files are private (`authenticated`) and streamed through our API**, as admin documents are (4.2). `Content-Type` comes from our stored format, never Cloudinary's. `attachment`, `nosniff`, `no-store`; the filename is a cleaned title in RFC 5987 form.
- **DOCX is stored `raw`, with `.docx` inside its public id** — how Cloudinary keys raw files.
- **Ownership before upload:** a foreign booking stores nothing. One shared `loadOwnBooking` gives 8.2's byte-identical 404. An ended booking gets 409 on upload but its list still loads.
- **No orphan files:** if the record fails to save, the stored file is deleted.
- **Withdraw only while `assigned`** (your call), as one atomic conditional delete, so a client returning it at the same moment keeps their work (409). A failed file delete is logged, never fatal.
- **Titles are never logged** — a title can name the client or their difficulty.
- **Upload limit 30/hour** for therapists (the public limit is 10). Client timeout raised to 120 s for uploads, 60 s for downloads — the 15 s default would cut a 10 MB upload on a slow line.
- **UI:** "Waiting for their answers" and "Returned" sections, with a drawn state mark (open ring vs tick), never colour alone. The client's answers are the primary gold action. Withdraw is confirmed inline, not in a modal.
- **Honest note in the uploader:** the client cannot open worksheets yet; 8.5 removes it.

**Verification**
- Tests: **1132 passing across 39 suites** (1086 before, 46 new). Server lint clean; client `oxlint` 0 findings on touched files; build passes.
- **Mutation-checked three times:** removing the ownership check broke **5** tests; removing the macro check broke **3**; removing "only while assigned" broke **1**.
- DOCX tests use real ZIPs built by `test/zipFixture.js` (valid CRCs), not faked headers. The existing upload suite passes unchanged.
- **26 client logic checks** (file rules, size and name formatting, copy). Two first-run failures were my own test script, not the code.
- **12 icons bounds-checked**, 0 out of bounds. **33 contrast pairs, 0 failures**; tightest: dropzone dashed border 3.37:1, returned-tile icon 4.69:1.
- Detector `[]` — degraded, as always. **Atlas and real Cloudinary untouched** — Cloudinary is faked in tests.

**Manual steps for the developer**
1. **Restart the API server; hard-refresh the client.**
2. The brief's check: as a therapist, open a client → Worksheets → assign a PDF. It should appear under "Waiting for their answers"; **Download** should open the file.
3. Assign a real `.docx` and download it. **This is the first live test of raw files on Cloudinary** — if it fails, check the Cloudinary settings allow document delivery.
4. Try a `.doc` and a renamed `.exe` — both refused with a clear reason.
5. Withdraw one: an inline confirm, then it disappears.
6. At 360px: rows wrap and the buttons stay at least 44px tall.

**Carried forward**
- **8.5 builds the client side:** download, return with images allowed (the model already accepts JPEG/PNG/WebP), status flips to `completed`. Remove the uploader's "not switched on" note then.
- 10.4: a notification when a worksheet is returned.
- 12.5: confirm Cloudinary allows raw and PDF delivery on Asad's account.
- Timezone decision still owed before 9.2. Slice 11: cancelled → expired on the 7.1 boundary.
- **Pre-launch blockers — unchanged at 13.** No placeholder content.

**Not done (by design):** client side (8.5); structured in-app forms; editing a title or replacing a file (withdraw and assign again).

---

## Chunk 8.5 — Worksheets: client side

**Status:** Complete. Nothing skipped. Not seen rendered — see Manual steps. The worksheet loop is now whole: assign → download → return → review.

**Built**
- server routes (client, behind the subscription gate):
  - `GET /client/worksheets`
  - `GET /client/worksheets/:id/file/:which`
  - `POST /client/worksheets/:id/submit`
- server route (therapist): `POST /therapist/worksheets/:bookingId/:id/review`.
- server new: `routes/clientWorksheets.test.js` (28 tests).
- server edits:
  - `services/worksheet.service.js` — client functions, review, shared stream and presenter, live count.
  - `controllers/worksheet.controller.js` — one `sendFile` for both roles.
  - `models/Worksheet.js` (`reviewedAt`); `constants/{uploads,worksheets,socket}.js`; `realtime/emitter.js` (`emitWorksheetsUpdate`).
  - `services/clientPortal.service.js` (`pendingWorksheets`); both route files.
- client new:
  - `pages/portal/client/Worksheets.jsx` (replaces the 7.1 placeholder).
  - `components/portal/client/worksheets/{MyWorksheetRow,ReturnDrop}.jsx`; `components/portal/client/{WorksheetsPendingProvider,NavDot}.jsx`.
  - `lib/client/{useMyWorksheets,worksheetsPending}.js`; `lib/api/clientWorksheetsApi.js`; 3 icons.
- client edits: `ClientRail`, `ClientTabBar`, `ClientPortalShell`, `worksheetFiles.js`, `socketClient.js`, both content files, and the therapist `WorksheetRow`/`WorksheetsTab`/`WorksheetUploader`/`useWorksheets`.
- Packages / env vars: none.

**Key decisions**
- **The therapist marks a worksheet reviewed** (your call). Until then the client can replace their file; after, 409. Spec addition `reviewedAt`; the model refuses it on an unreturned sheet. Reviewing twice keeps the first date.
- **No read receipt:** the client sees "With your therapist", never "opened" or a time.
- **One returned file** (your call), with guidance: on screen, on paper plus a photo, and "several pages? your phone's scanner makes one PDF". Photos (JPEG/PNG/WebP) are allowed for returns only. No HEIC in `accept`, so iOS converts to JPEG itself.
- **Submit is one atomic update that only matches while unreviewed.** An early check refuses a reviewed sheet before any upload. A review landing mid-submit → the new file is deleted and 409. A replaced file is deleted only after the new one is recorded; a failed save deletes the new file.
- **The client's booking comes from the token, never the URL.** Another client's worksheet, a missing one and junk give one identical 404. An expired client is refused by the existing gate (403).
- **Nav dot (your addition — not in the brief text).** A quiet gold dot on Worksheets while any sheet is to complete: no number, no pulse. The count sits in the link's name ("Worksheets, 2 to complete"). It starts from `/client/me` and stays live: assign, withdraw and submit push `worksheets:update` to the client's own room, **a number only**. The push is best-effort and skipped without a socket server.
- **Copy corrected:** 7.1's step "reads it before your next session" promised something nobody guarantees; now "your therapist sees it has come back". The therapist uploader's "not switched on" note is gone.
- `worksheetReturn` is private and excluded from the public `/uploads` kinds, like `worksheet`.

**Verification**
- Tests: **1160 passing across 40 suites** (1132 before, 28 new). Server lint clean; client `oxlint` 0 findings on touched files; build passes.
- **Mutation-checked four times:** removing "worksheet belongs to this booking" broke **2**; the atomic review lock **1** (the race test); the early review check **1**; "review only once returned" **1**.
- The race is tested for real: a review is written between the check and the write, and the new file must be deleted.
- **20 client logic checks** (return rules, the HEIC-free accept list, nav labels, copy). **13 client icons** bounds-checked, 0 out. **21 contrast pairs, 0 failures**; tightest: the drop edge against the mist panel 3.08:1, the "With your therapist" chip 4.69:1.
- Detector `[]` — degraded, as always. **Atlas and real Cloudinary untouched.**

**Manual steps for the developer**
1. **Restart the API server; hard-refresh the client.**
2. As a therapist, assign a worksheet. With the client's portal already open elsewhere, **the gold dot on Worksheets should appear without a refresh.**
3. As the client: open Worksheets, download it, then **Send it back** with a PDF or a phone photo. It moves to "Submitted" and the dot clears.
4. **Replace file** once; then as the therapist, **Download their answers** (it should be the replacement) and **Mark as reviewed**. The client now sees "With your therapist" and no Replace.
5. At 360px, and on a real iPhone: choosing a photo should upload a JPEG.

**Carried forward**
- 10.4: a therapist notification when a worksheet comes back.
- 12.5: confirm Cloudinary delivers raw, PDF and image files on Asad's account.
- Timezone decision still owed before 9.2. Slice 11: cancelled → expired on the 7.1 boundary.
- **Pre-launch blockers — unchanged at 13.** No placeholder content.

**Not done (by design):** in-app form filling; several files per return; notifications (10.4).

---

## Chunk 8.6 — Journal and Private Notes

**Status:** Complete. Nothing skipped. Not seen rendered — see Manual steps. Slice 8 is finished.

**Built**
- server models: `Journal.js` (§10.9 + `editedAt`) · `PrivateNote.js` (§10.10).
- server new: `constants/journal.js` · `validation/journal.schema.js` · `services/journal.service.js` · `services/privateNotes.service.js` · `controllers/{journal,privateNotes}.controller.js` · `routes/journal.test.js` (28) · `routes/privateNotes.test.js` (16).
- server routes (client, behind the subscription gate): `GET/POST /client/journal`, `PATCH/DELETE /client/journal/:entryId`.
- server routes (therapist): `GET /therapist/journal/:bookingId` (read only) · `GET/POST /therapist/notes/:bookingId` · `PATCH/DELETE /therapist/notes/:bookingId/:noteId`.
- client new: `pages/portal/client/Journal.jsx` (replaces the 7.1 placeholder) · `components/portal/journal/{EntrySpine,JournalIcons}.jsx` · `components/portal/client/journal/{JournalComposer,MoodPicker,EntryRow}.jsx` · `components/portal/therapist/workspace/{JournalNotesTab,NoteComposer,NoteRow}.jsx`.
- client new libs: `lib/client/{useJournal,moods}.js` · `lib/therapist/{useClientJournal,usePrivateNotes}.js` · `lib/api/{journalApi,therapistJournalApi}.js` · `lib/journalDates.js` · 7 icons.
- client edits: `ClientWorkspace.jsx`, both content files (`TAB_PENDING.journal` removed, tab marked built).
- Packages / env vars: none.

**Key decisions**
- **THE BOUNDARY IS AN IMPORT EDGE, NOT A FILTER.** Two collections, two services, two endpoints. Nothing on the client request path imports `PrivateNote` or its service, so a note cannot reach a client response even by mistake — there is no code path to filter. A test walks the import graph from `client.routes.js` and `chat.routes.js` and asserts it never reaches them, and asserts the therapist path DOES, so the walker cannot pass vacuously.
- **No combined endpoint**, though the tab shows both side by side. One response object holding both collections is the shape a later refactor leaks; the browser fetches twice and the layout is the only place they meet.
- **Mood: eight presets plus a word the client types** (your call), capped at 30. Each preset is drawn as a line that behaves like the feeling — Low descends, Hopeful rises, Angry spikes — so the row is not eight identical word-boxes. **The eight are mine, not Asad's**, and want his confirmation like the 5.1 relationship-status list.
- **An edited entry shows "Edited" to the therapist** (your call); spec addition `editedAt`. There is still **no read stamp** — 7.2's rule holds, the client never learns when it was read.
- **Deleting is permanent** (your call) and removes it from the therapist's view too.
- **The therapist has no write route for a client's entries at all** — not hidden, absent. Three verbs are tested and all 404.
- **Notes are scoped by author as well as booking**, and an ended booking still takes one: a closing note is written after the work ends.
- **The notes section sits under a dark ink header** — prominence by inversion, as 6.6's renewal disclosure does, not by an alarm colour. It is also the only ground where gold is legible (11.08:1 against 1.63:1 on paper), and the clearest signal that this half is not shared.
- Journal text and note text are never logged.

**Verification**
- Tests: **1204 passing across 42 suites** (1160 before, 44 new). Server lint clean; client `oxlint` 0 findings on touched files; build passes.
- **Mutation-checked five times, and the first run was the useful one: FOUR OF THE FIVE BROKE NOTHING.** A booking has one client and one therapist today, so `bookingId` alone carried every case and the ownership scopes were decorative. Two tests were added that construct the situation reassignment would create — a colleague's note on my booking, and an entry on my booking by another author. Now each of the five breaks a test: notes' `therapistId` on a single note **1** and on the list **1**; the entry's author match **1** and booking match **1**; importing `PrivateNote` into the journal service **1**.
- The client-response sweep runs all eight client endpoints and asserts a seeded note's text, `privatenote`, `clinicalnote` and `"notes"` appear in none. *(Not `"note"` — `workingHours.note` is the therapist's own availability field, §10.3.)*
- **55 client logic checks** (mood strokes in bounds, preset uniqueness, date labels including a 12-hour locale always showing am/pm, and copy rules — no timelines, no nudges, no gamification). **7 icons** bounds-checked, 0 out; **9 mood strokes** checked against their own 24×12 box. **67 contrast pairs, 0 failures**; tightest: the writing-area focus border 3.06:1 and the notes composer against its mist body 3.08:1.
- **8.5's list-nesting bug repeated and was caught again before shipping**: the animation wrappers put a `<div>` between `<ol>` and its `<li>`. `Entry` and `NoteRow` now render no list item of their own — the caller's `motion.li` is it.
- Generated CSS confirmed to carry every new utility, including the spine offsets Tailwind v4 emits as `calc(var(--spacing) * -7.25)` rather than a literal rem.
- Detector `[]` — degraded, as always; the four parsers were re-checked and are still absent. **Atlas untouched.**

**Manual steps for the developer**
1. **Restart the API server; hard-refresh the client.**
2. **The brief's own verify step.** As a client, open DevTools → Network, use the whole portal, and confirm no response anywhere contains `privateNotes` or any note text. Write a note as the therapist first, so there is something real to leak.
3. As the client: write an entry, add a mood, edit it, then delete one. The transparency panel should be the first thing you read.
4. As the therapist: open that client → Journal and Notes. Their entries on the left, your notes under the dark header on the right. Check the "Edited" mark appears after the client edits.
5. At 360px the two sections stack with the journal first; at 1280px+ they sit side by side.
6. Keyboard and reduced motion: the mood chips must show a visible focus ring, and entries must not slide in.

**Carried forward**
- **Asad to confirm the eight mood words** before launch, with the 5.1 relationship-status list.
- 10.4: a therapist notification when a journal entry is written; 12.5: Cloudinary delivery, socket URL, sticky sessions.
- **The timezone decision is now owed — 9.2 is next.** Slice 11: cancelled → expired on the 7.1 boundary.
- **Pre-launch blockers — unchanged at 13.** No placeholder content.

**Not done (by design):** no per-entry privacy toggle (§7.3 rules it out) · no client sight of notes in any form · no notifications (10.4) · no admin visibility (§11).

---

# SLICE 9 — Sessions & Scheduling

## Chunk 9.1 — Sessions model and timezone utilities

**Status:** Complete. Nothing skipped. Server only, with no UI, so there was no impeccable pass and no contrast work. **Atlas not touched** (developer's instruction); every test ran in memory.

**Built**
- server new: `models/Session.js` · `utils/timezone.js` · `utils/meetingLink.js` · `constants/sessions.js` · `validation/sessions.schema.js` · `services/session.service.js` · `services/bookingMembership.service.js` · `controllers/session.controller.js` · `routes/sessions.routes.js`.
- server tests: `utils/timezone.test.js` · `utils/meetingLink.test.js` · `models/Session.test.js` · `routes/sessions.test.js` (65).
- routes: `POST /therapist/sessions` · `PATCH /therapist/sessions/:sessionId` · `DELETE /therapist/sessions/:sessionId` (cancels) · `GET /sessions/:bookingId?scope=upcoming|history` (both roles).
- edits: `routes/index.js` (mount), `routes/therapist.routes.js` (3 routes), `services/chat.service.js` (uses the extracted membership check), `routes/privateNotes.test.js` (sessions added to both boundary tests), `routes/adminStats.test.js` (see Verification).
- Packages / env vars: none.

**Key decisions**
- **The zone comes from the therapist's PROFILE, never the request.** The body carries only a wall-clock `date` + `time`. Sending `timezone` or `scheduledAt` is refused (422), not ignored, so a laptop set to the wrong zone cannot silently move a session.
- **Intl, not date-fns-tz** (developer's call, 2026-09-19): the standing 0.6 decision, the same method as `client/src/lib/workingHours.js`, and no packages. §15 names Intl as allowed.
- **Clock changes:** it tries every offset in force within a day either side and keeps only candidates that read back as the same wall clock. None means a skipped time → 422 *"the clocks go forward. Pick another time."* Two means a repeated time → the first one. Also handles Lord Howe's 30-minute shift and Samoa's skipped day.
- **Meeting links: Zoom, its subdomains, zoomgov.com, and `meet.google.com` exactly** (developer's call, 2026-09-19; the spec says Zoom). Checked on the parsed host, so `zoom.us.evil.example` and `zoom.us@evil.example` are refused. The field stays `zoomLink` per §10.11.
- **A link is returned only while the session is `scheduled`, and is never logged**: it carries the meeting passcode. A finished session's link may open a room the therapist now uses with someone else.
- **The note is visible to the client** (developer's call, 2026-09-19). Clinical thoughts belong in Private Notes; 9.2 must label the field.
- **Guards:** the time must be in the future and no more than 366 days ahead (a leap year still fits); ended booking → 409; client with an ended subscription → 409; past-due and cancelled-but-still-paid clients are allowed (§13). Cancelling is always allowed.
- **Cancel is soft and idempotent.** The record stays, a second cancel keeps the first `cancelledAt`, and a completed session is refused. Edit and cancel are conditional atomic updates, so a cancel that lands mid-edit wins.
- **`upcoming` / `history`, not the plan's "past"**, because a cancelled session whose date is still ahead belongs in history. A session stays upcoming for 60 minutes after it starts.
- **The API returns UTC only;** each screen formats in its own zone. `formatInZone` is for 9.3's message and 9.6's emails.
- **The membership check moved to `bookingMembership.service.js`** so chat and sessions share one; chat's behaviour is unchanged. Every refusal is the same 404, as in 7.2 and 8.2.
- Spec additions: `updatedAt`, `cancelledAt`. Code names instances `therapySession`, because `session` means a Mongo transaction here.

**Verification**
- Tests: **1344 passing across 46 suites** (1204 before, 140 new). Server lint clean.
- **The brief's case:** 15:00 London in summer is stored as 14:00Z and reads 10:00 AM EDT in New York. Winter is 15:00Z / 10:00 EST, and the weeks the UK and US change clocks apart give 11:00.
- **Every hour of 2026 round-trips** in London, New York and Lord Howe (26,280 checks).
- **Mutation-checked five times:** session ownership broke **2**; the skipped-time check **9**; the zone coming from the profile **3** (winter cases cannot catch it, because London is UTC then, which is why the Kolkata test exists); the client write refusal **2**; booking membership **1** in sessions plus **8** in chat/socket.
- **privateNotes:** the import-graph walk now includes `sessions.routes.js`, and the client sweep reads both session lists, each seeded with a real session so the check is not vacuous.
- The route tests find their summer, winter and mismatch dates by scanning ahead with Intl, so they pass whatever day they run.
- **One existing test broke on the first full run, the same way 6.4's did:** `adminStats.test.js` asserted the `sessions` collection did not exist yet. The model now creates it. That assertion was removed; the dashboard's "reads zero" check stays.

**Manual steps for the developer**
1. **Restart the API server.** The new routes are read at startup. No packages, no environment variables.
2. With a REST client, sign in as a therapist and `POST /api/v1/therapist/sessions` with `{ bookingId, date: "YYYY-MM-DD", time: "15:00", zoomLink }`. The reply gives `scheduledAt` in UTC and the `therapistTimezone` used. **This writes to whichever database the server uses, so pick a test booking.**
3. Sign in as that client and `GET /api/v1/sessions/:bookingId`. The same UTC instant should come back; their browser will show it in their clock from 9.4.
4. Try 01:30 on the last Sunday of March from a London therapist (422), an `http://` link (422), and a client token on `POST` (403).

**Carried forward**
- **9.2:** save the client's browser timezone on `clientProfiles` (decided 2026-09-19); label the note *"Your client will see this"*; label the time field with `therapistTimezone`.
- **9.3:** the system message should carry the instant, not a baked string, so each reader sees their own clock.
- **9.4:** session length for the Join window is not in the spec. Decide it there and align it with the 60-minute live window.
- **9.6:** reminders format per recipient with `formatInZone` and will need a `{ status, scheduledAt }` index.
- **The admin dashboard's "sessions this month" (4.4) now counts real rows.** It counts every session from the 1st onwards, including cancelled ones and those in later months. That's worth tightening in chunk 10.x; not changed here.
- **For Asad:** a reused meeting link (a Zoom Personal Meeting Room, a fixed Meet code) lets one client walk into another's session. Therapists should use per-session links or the waiting room.
- Double-booking a therapist across two clients is not checked. Slice 11: cancelled → expired on the 7.1 boundary.
- **Pre-launch blockers — unchanged at 13.** No placeholder content.

**Not done (by design):** no UI (9.2, 9.4) · no chat system message (9.3) · no completion or session counter (9.5) · no reminders (9.6) · no local time stored anywhere.

---

## Chunk 9.2 — Session scheduling UI

**Status:** Complete. Nothing skipped. Not seen rendered; see Manual steps. **Atlas not touched**; every test ran in memory. The impeccable skill was loaded before design, as the standing directive requires.

**Built**
- client new: `components/portal/therapist/workspace/sessions/{SessionsTab,SessionForm,TwoClocks,ClockFace,SessionItem}.jsx` · `lib/therapist/{useSessions,sessionTime,meetingLink}.js` · `lib/api/sessionsApi.js` · `lib/client/useSaveBrowserTimezone.js` · `lib/useNow.js` · 4 icons (`VideoIcon`, `CancelledIcon`, `MoonIcon`, `NoteIcon`).
- client edits: `lib/workingHours.js` (`resolveWallTime`), `ClientWorkspace.jsx`, `ClientInfo.jsx`, `ClientPortalShell.jsx`, `clientPortalApi.js`, `therapistPortalContent.js`. **Deleted** `TabPending.jsx` and its copy, since all five tabs are now built.
- server: `clientProfiles.timezone` (spec addition) · `PATCH /client/timezone` behind the gate · `validation/clientPortal.schema.js` · timezone on `/client/me` and the therapist's client view · `meta.therapistTimezone` on the sessions list · `test/timezoneParity.test.js` (28).
- Packages / env vars: none.

**Key decisions**
- **The preview is two drawn clock faces**: your time and theirs, each light by day and ink at night, with the gap drawn between them. Before a time is picked they show *now*, so the time difference is visible at once. The hands sweep in 250ms and hold still under reduced motion. The sentence below carries everything in words for screen readers (the dials are `aria-hidden`).
- **The client's zone is saved from their own browser** (developer's call, 2026-09-19), silently, when it differs. **This reverses 8.2's "no timezone reaches the therapist"**; that test was rewritten, and the value is still never guessed from the country (null until saved). A couple's one account keeps whichever browser saved last. It is stored exactly as sent, because Intl would rewrite `Asia/Kolkata` as the legacy `Asia/Calcutta`.
- **The preview cannot disagree with what is stored.** The browser's converter lives in `lib/workingHours.js` (no second copy), and a server parity test runs it against `utils/timezone.js`.
- **Edit asks only when the time moves** (developer's call): it shows old → new in both clocks. Link and note changes save straight away. Cancel is confirmed inline and the session moves to History.
- **Night note** (developer's call): 22:00–06:59 for the client adds *"That's 03:00 for Marta."* It never blocks. **No next-week shortcut** (developer's call).
- **Honest line until 9.3/9.4:** *"Marta can't see sessions in their portal yet, so tell them in the chat for now,"* with a link to the chat. The old pending copy claimed an automatic chat message that does not exist yet, and it is gone.
- The note field says *"[Name] will see this. Private thoughts belong in Journal and Notes."*
- **Scheduling is hidden** (a plain notice instead) when the booking has ended, the client's subscription has ended, or the therapist's profile has no zone. It is hidden rather than left to fail with a 409.
- The next session is a calendar leaf in ink, with gold on ink for the weekday (11.08:1). Later sessions are quiet rows. History is read-only, with drawn marks: tick for completed, struck ring for cancelled, clock for past.

**Verification**
- Tests: **1386 passing across 47 suites** (1344 before, 42 new). Server lint clean; client `oxlint` shows only the six pre-existing warnings; build passes; generated CSS confirmed for every new utility.
- **Parity:** every quarter hour on the six days around each 2026 clock change (London, New York, Lord Howe), and 15:00 on every day of the year in four zones, give identical results in browser and server. **Mutation-checked three times:** the browser taking the later repeated time broke 3; guessing a skipped time broke 4; letting Meet subdomains through broke 2.
- **47 client logic checks** on the preview, bounds, labels and copy rules. One check was itself wrong at first ("soon" matched "soonest"); it was fixed, and a check proving it is live was added.
- **Contrast: 38 pairs, 0 failures.** Tightest: field error under the sage glow 4.96:1, placeholder 4.75:1, empty-state icon 4.70:1. 4 icons bounds-checked, all inside. Detector `[]`, degraded as always.
- Found in passing: `WorksheetsTab`'s skeleton puts its "Loading" status inside an `aria-hidden` wrapper, so it is never announced. Not fixed here; the new skeleton avoids it.

**Manual steps for the developer**
1. **Restart the API server; hard-refresh both portals.** No packages, no environment variables.
2. **Sign in as a client first** and open their portal once. That saves their timezone.
3. As their therapist: open that client → Sessions. **The chunk's verify step:** pick a date and time and check the right-hand clock against a world clock for the client's city. Try a time that is night for them and watch for the moon note.
4. Schedule it; it appears as the next session. **Edit** only the note (saves at once), then move the time (asks first, showing old → new). **Cancel** it: it moves to History.
5. A client who has never opened the portal shows a dashed clock and "Not known yet". Client info shows the same.
6. At 360px, and with reduced motion on (the hands jump instead of sweep).

**Carried forward**
- **9.3:** post the system message and delete `notYetVisible`. **9.4:** the client Session Hub.
- **9.5** decides completion. Until then past sessions show as "Past" in History.
- Fix `WorksheetsTab`'s skeleton status (above).
- **Pre-launch blockers — unchanged at 13.** No placeholder content.

**Not done (by design):** client Session Hub (9.4) · chat system message (9.3) · counter or over-4 warning (9.5) · no timezone question in the questionnaire.

---

## Chunk 9.3 — System message on scheduling

**Status:** Complete. Nothing skipped. Not seen rendered; see Manual steps. **Atlas not touched**; every test ran in memory.

**Built**
- server: `models/Message.js` (a `session` sub-document, a spec addition to §10.7, plus a shape guard) · `constants/chat.js` (events and fallback text) · `services/chat.service.js` (`postSessionNotice`, the presenter carries `session`) · `services/session.service.js` (`notify` on create, a real move, and a real cancel).
- server tests: `models/Message.test.js` (5 replace 1), `routes/sessions.test.js` (+10), `routes/chat.test.js` (+1), `realtime/socket.test.js` (+2).
- client: `lib/chat/sessionNotice.js` (new) · `SystemNotice.jsx` · `MessageAnnouncer.jsx` · `ChatIcons.jsx` (`NoticeCancelledIcon`) · `OpeningMessage.jsx` · `pages/portal/client/Chat.jsx` · `TherapistChat.jsx` · `chatContent.js` · `therapistPortalContent.js` (the 9.2 form line reworded).
- Packages / env vars: none.

**Key decisions**
- **The time travels as data, never as words.** The notice stores `{ sessionId, event, scheduledAt, previousScheduledAt }` and its `text` is a zone-free fallback ("Session scheduled."). Each screen words it in its own clock: 15:00 for a London therapist, 10:00 AM for a New York client, from the same row. This is the brief's "each viewer's own timezone".
- **Sent as the therapist.** The existing badge rule ("unread and not from me") then makes it unread for the client and never for the therapist, with no new badge logic.
- **Posted only on a real change:** create; a move where the time actually differs (link or note edits post nothing); and a cancel that actually happened (not a repeat). Never into an ended booking.
- **A chat failure never touches the session.** The notice goes after the session write, outside any transaction, in a try/catch that logs the event and session id by error name only, never the error's message.
- **The only writer of `type: "system"` is `postSessionNotice`**; no route or socket event reaches it. The model refuses session data on a person's message and requires it on a system one.
- **No meeting link in chat** (developer's call): a chat line is permanent, survives a cancel, and usually carries the passcode.
- **The opening screen shows the next session** (developer's call). A client who has not written yet cannot see the thread, so a line appears above the writing page: *"Your next session: Thursday, 14 August at 18:00, your time."* It is worked out from the notices alone, and a cancelled one drops out. **"Next", not the plan's "first"**, because "first" could be untrue.
- **The notice pill is `rounded-2xl`, not a stadium**, because the sentences now wrap to two lines at 360px. A cancelled notice gets a struck calendar mark.
- Screen readers hear the formatted sentence in their own zone, not the fallback text.

**Verification**
- Tests: **1403 passing across 47 suites** (1386 before, 17 new). Server lint clean; client build passes; `oxlint` shows only pre-existing warnings plus two in `home/Services1.jsx`, the developer's untracked file, not touched here.
- **Mutation-checked three times:** removing the try/catch broke **3**; posting on every edit broke **1**; sending as the client broke **4**. The first attempt at the third mutation did not apply because `chat.service.js` is CRLF; it was caught and re-run with a line-ending-aware pattern.
- **The failure path is tested for real:** `Message.create` is made to throw, and the session is still created, moved or cancelled. The log line is checked to hold no error message, link or note.
- **18 client logic checks**, including one stored notice reading differently in two zones, a Sydney next-day case, the moved sentence carrying both times, and the opening line's "latest notice wins, cancelled drops out".
- **Contrast: 7 new pairs, 0 failures.** Tightest: the opening-line mark on mist at 4.93:1. New icon bounds-checked. Detector `[]`, degraded.

**Manual steps for the developer**
1. **Restart the API server; hard-refresh both portals.** No packages, no environment variables.
2. **The chunk's verify step:** as a therapist, schedule a session. In the client's chat (another browser), a centred notice appears in *their* clock, and their Chat badge rises without a refresh. The therapist's chat shows the same notice in *their* clock.
3. Move the time: a "moved" notice showing both times. Change only the note: no notice. Cancel: a struck-calendar notice.
4. A client who has not written their opening message yet should see *"Your next session: …"* on the opening screen.
5. 360px: the notice wraps to two lines and stays a soft rectangle.

**Carried forward**
- **9.4:** the client Session Hub; then delete the form's `notYetVisible` line (it now says to share the link in chat until then).
- 10.4: notifications can reuse `session` on the message; nothing here depends on it.
- Fix `WorksheetsTab`'s hidden skeleton status (from 9.2).
- **Pre-launch blockers — unchanged at 13.** No placeholder content.

**Not done (by design):** no meeting link in chat · no notice for link or note edits · no manual system messages · no Session Hub (9.4).

**Post-9.3 fix (developer, 2026-09-19):** the notices first rendered as the plain fallback text ("Session scheduled."). `normalise()` in `lib/chat/messageStore.js` copies a fixed list of fields and dropped `session`. The developer added `session: message.session ?? null`. My checks had exercised the formatter directly, not through the store, which is why it slipped.

---

## Chunk 9.4 — Client Session Hub

**Status:** Complete. Nothing skipped. Not seen rendered; see Manual steps. **Atlas not touched**; every test ran in memory. Impeccable loaded before design.

**Built**
- server: `constants/sessions.js` (`SESSION_JOIN_OPENS_BEFORE_MINUTES`), `services/session.service.js` (the join window on every scheduled session, and the client link rule), `routes/sessions.test.js` (+9, 3 updated).
- client new: `pages/portal/client/Sessions.jsx` (replaces the 7.1 placeholder) · `components/portal/client/sessions/{NextSession,SessionCounter,MySessionRow}.jsx` · `components/portal/sessions/DateLeaf.jsx` (extracted from 9.2, now shared by both portals) · `lib/client/{mySessions,useMySessions}.js`.
- client edits: `clientPortalContent.js` (`MY_SESSIONS`; lead no longer says "Zoom"), therapist `SessionItem.jsx` (shared leaf), `SessionForm.jsx`/`SessionsTab.jsx` (the temporary "share the link in chat" line becomes *"Marta is told in the chat and sees it on their Sessions page"*), `therapistPortalContent.js`.
- Packages / env vars: none.

**Key decisions**
- **VIEW ONLY, enforced by the server.** The client has no write route: 9.1's writes sit behind `requireTherapist`, and the shared mount is read-only. A new test sends every verb to every sessions route as a client, and nothing changes. The page has no request or reschedule control. The one way to change a session is the chat, and the page says so: *"Need a different time? Message Priya in the chat."*
- **The join window comes from the server:** `joinOpensAt` (10 minutes before) and `joinClosesAt` (on the same boundary that keeps a session "upcoming", developer's call). The page never works the window out itself, so the screen and server cannot disagree.
- **A client gets the meeting link ONLY inside the window** (developer's call); the therapist always does. A reused meeting room cannot be walked into early. The page refetches at each window edge, and 30 seconds later if a window is open but the link has not arrived (clock drift).
- **NO SESSION LENGTH ANYWHERE IN THE UI** (developer's instruction, 2026-09-19): length is flexible and agreed between therapist and client. The close boundary is internal only; the page never says when Join closes. A copy check enforces it.
- **No countdown.** Before the window: *"You can join from 17:50"* (or "…on Thu 14 Aug"). During it: a gold **Join session** link that opens in a new tab.
- **The counter is on this screen too**, reversing 7.1's "one copy only" note. Both screens read the one stored `sessionsRemaining`, so they cannot disagree. It is four marks on a thread (filled = left), with *"Resets on 14 October. Unused sessions do not roll over."* A cancelled-but-paid plan says *"Your plan ends on …"*.
- **Updates live:** a session notice arriving on the socket for this booking refetches the page.
- The empty state uses the brief's exact words. History is read-only and never shows a link.

**Verification**
- Tests: **1412 passing across 47 suites** (1403 before, 9 new). Server lint clean; client build passes; `oxlint` shows only pre-existing warnings.
- **Mutation-checked three times:** the client always getting the link broke **4**; the window opening at 15 minutes broke **2**; the window never closing broke **1**.
- **29 client logic checks:** every window edge to the millisecond, refetch timing, the counter (resets, ends, clamped, hidden, date in the reader's zone), display in the client's zone including a Sydney day-roll, and copy rules (no length, no countdown, no request wording, no "Zoom" claim, the brief's empty line exact).
- **Contrast: 21 pairs, 0 failures.** Tightest: the chat-link underline on mist 3.36:1 and the empty counter ring 3.44:1. Detector `[]`, degraded.

**Manual steps for the developer**
1. **Restart the API server; hard-refresh the client.**
2. As a client with a session scheduled more than 10 minutes out: the next session shows in *your* clock with *"You can join from …"* and no link. DevTools → Network → the sessions response should have `zoomLink: null`.
3. Schedule one (as the therapist) 12 minutes ahead and wait on the client page. At 10 minutes before, the gold **Join session** appears without a refresh.
4. As the therapist, move or cancel it. The client page updates on its own.
5. At 360px the counter sits under the session card; with reduced motion, rows appear without sliding.

**Carried forward**
- **Flagged, not changed:** the Journal transparency note (8.6, `clientPortalContent.js`) says *"…rather than only **the hour** you spend together."* That implies a session length, against today's instruction. Suggested: *"…rather than only what comes up in your sessions."* Developer's call.
- **9.5:** completion and the counter going down; until then the counter shows the stored value.
- Fix `WorksheetsTab`'s hidden skeleton status (from 9.2).
- **Pre-launch blockers — unchanged at 13.** No placeholder content.

**Not done (by design):** no booking, request or reschedule for clients · no session length shown anywhere · no completion (9.5) · no reminders (9.6).

---

## Chunk 9.5 — Session counter and completion

**Status:** Complete. Nothing skipped. Not seen rendered; see Manual steps. **Atlas not touched**; every test ran in memory. Impeccable loaded before the UI.

**Built**
- server new: `services/sessionCounter.service.js` (complete, the on-read sweep, not-held, renew, end, period maths, counter view) · `routes/sessionCounter.test.js` (32, on a replica set).
- server edits: `models/Session.js` (`countedAt`, `notHeldAt`, spec additions) · `constants/{sessions,chat}.js` (a `not_held` notice event, refusals, warning code) · `services/session.service.js` (on-read check, `meta.counter`, `warning`, held/not-held) · `services/therapistClient.service.js` and `clientPortal.service.js` (on-read check; counter and reset date to the therapist) · routes `POST /therapist/sessions/:id/held` and `/not-held` · tests updated in `sessions.test.js` (now on a replica set) and `therapistClient.test.js` (+1).
- client: `components/portal/sessions/SessionCounter.jsx` (shared by both portals, moved from the client folder, with a row layout) · therapist `SessionsTab`/`SessionItem`/`SessionForm` · `useSessions` (`markHeld`, `markNotHeld`, silent refresh) · `sessionsApi` · `sessionTime.overCycleLimit` · client `Sessions.jsx`/`MySessionRow`/`useMySessions` · `SystemNotice`, `sessionNotice.js` and copy files.
- Packages / env vars: none.

**Key decisions**
- **A session completes automatically when its Join window closes**, the same internal boundary as "upcoming". The therapist can **Mark as held** once it has started, and mark a completed one as **Didn't take place** (developer's call: an emergency should not waste the credit). No session length appears in any of it.
- **On-read, not a scheduled job.** Every read that shows sessions or the counter (the sessions list, `/client/me`, the therapist's client view) completes that booking's overdue sessions first. 9.6's reminder job can call the same `completeOverdue`.
- **Completion and the decrement are one transaction**, and only the call that moves a session out of `scheduled` counts. Five concurrent readers take exactly one per session. **Transactions need a replica set: Atlas is one; a local standalone `mongod` is not.**
- **Never below 0**, by an atomic `sessionsRemaining > 0` filter. At 0 a session still completes, takes nothing, and gets no `countedAt`, so "didn't take place" can never give back a credit that was never taken.
- **Only sessions inside the current period count.** The period start is estimated as one calendar month before `currentPeriodEnd` (never before `startDate`), because no start is stored yet. **Slice 11 should store Stripe's exact `current_period_start`.**
- **Didn't take place** turns the session into a cancelled one with `notHeldAt`. The credit comes back only if it was taken, only within the current period (no carry-over), and never above 4. The client is told in the chat (a new `not_held` notice). A completed session cannot be cancelled the ordinary way, and the refusal says to use this.
- **Renewal and ending are built and tested, not wired:** `renewCycle` (→ 4) and `endCycle` (→ 0) wait for slice 11's webhooks. Wiring them now would half-build renewal (counter reset, period not extended).
- **The counter shows 0 once access has ended**, whatever is stored (§13).
- **Scheduling past what is left is warned, never blocked** (the brief). The server returns `warning: { code: 'OVER_REMAINING', remaining, scheduled }`, and the form says it before saving, as an ink note (attention, not alarm): *"Marta has 1 session left this cycle and 1 already scheduled. You can still schedule this one."* **A business decision for Asad to confirm.**
- **The therapist now sees the counter and its reset date** (developer's call, extending 8.2): sessions, not money. The 8.2 test still refuses amounts and Stripe ids, and a new test pins the exact shape.
- Auto-completion and Mark-as-held post nothing into the chat; only *Didn't take place* does.

**Verification**
- Tests: **1445 passing across 48 suites** (1412 before, 33 new). Server lint clean; client build passes; `oxlint` shows only pre-existing warnings.
- **The brief's three:** completion decrements by exactly one; the counter never goes negative (including a fifth session in a cycle); renewal resets to 4, and 2 unused become 4, never 6.
- **Mutation-checked six times:** no floor at 0 broke **3**; completing twice broke **2**; every session counting broke **3**; restoring an untaken credit broke **1**; restoring above 4 broke **1**; renewal carrying over broke **1**.
- **15 client logic checks:** the over-limit maths (next cycle excluded, the boundary exact), notice wording, the opening line dropping a not-held session, labels agreeing across portals, and no session length in any copy. New UI pairs reuse already-measured colours; detector `[]`, degraded.

**Manual steps for the developer**
1. **Restart the API server; hard-refresh both portals.** No packages, no env vars.
2. As a therapist, schedule a session 12 minutes ahead. After it starts, **Mark as held** appears; press it. The counter drops to 3 in both portals.
3. On that session in History, press **Didn't take place** and confirm. The counter goes back to 4, and the client's chat shows the notice.
4. Leave a session to pass its window untouched, then open either portal: it is completed and counted.
5. With 1 session left, start scheduling two more this cycle. The note appears on the second, and it still schedules.

**Carried forward**
- **For Asad:** (1) does a no-show use up a session? As built, an uncancelled session auto-completes and counts; the therapist can mark it *Didn't take place*. (2) Should scheduling past the limit be allowed at all?
- **Slice 11:** call `renewCycle` on renewal and `endCycle` on expiry; store Stripe's `current_period_start` and use it in `periodStartOf`.
- **9.6:** the reminder job should call `completeOverdue` too.
- Journal copy "the hour you spend together" (from 9.4) and the `WorksheetsTab` skeleton status (from 9.2) are still open.
- **Pre-launch blockers — unchanged at 13.** No placeholder content.

**Not done (by design):** no carry-over logic of any kind · no hard block on over-scheduling · no scheduled job (9.6) · renewal and expiry not wired (slice 11).

---

## Chunk 9.6 — Session reminder emails

**Status:** Complete. Nothing skipped. **SLICE 9 IS FINISHED.** No UI, so no impeccable pass. **Atlas not touched**; every test ran in memory with email mocked, so nothing was sent.

**Built**
- server new: `services/sessionReminders.service.js` (the sweep, the due rules, the claim, the scheduler) · `services/email/templates/sessionReminder.js` · `scripts/runSessionReminders.js` · `routes/sessionReminders.test.js` (23, on a replica set).
- server edits: `models/Session.js` (`timeSetAt`, `reminders.day/hour` — spec additions) · `constants/sessions.js` (`SESSION_REMINDERS` leads and cutoffs, interval) · `services/session.service.js` (sets `timeSetAt` on create and on every move) · `email.service.js` (+ the test mock) · `config/env.js` (`SESSION_REMINDERS=off`) · `server.js` (starts and stops the sweep) · `package.json` (`npm run reminders:run`).
- Packages / env vars: no packages. One **optional** env var, `SESSION_REMINDERS=off`.

**Key decisions**
- **THE SHORT-NOTICE RULE, which answers both of the developer's cases:** a reminder is only sent if the session was on the calendar at least that reminder's own notice before it starts. Booked 3 hours ahead → no day reminder, the hour one still goes. Booked 15 minutes ahead → neither, so nobody is emailed about something already upon them. `timeSetAt` restarts whenever the time moves, so a rescheduled session is judged afresh and a move to short notice goes quiet.
- **Windows:** day from 24 h before until 2 h before; hour from 1 h before until 10 minutes before (when Join opens). The late edge exists so a sweep missed during a restart still lands, rather than never.
- **Never twice:** each reminder is claimed in one atomic update keyed to the exact session time, before anything is sent. A failed send is logged and **not** retried — the brief's rule, and the cost is that a Resend outage loses that one reminder.
- **The client's email carries NO meeting link** (developer's call) — it would outlive the session in an inbox, and 9.4 already gives the link on their Sessions page when Join opens. The therapist's does carry it.
- **Both people are reminded** (developer's confirmation), each in their own clock, from one stored instant. A client with no saved zone gets the therapist's clock, named ("London time"), never a silent guess.
- **Cancelled-but-still-paid clients keep their reminders** (developer's call): they paid for those sessions. Ended subscriptions, ended bookings and deactivated accounts get none, and a cancelled session is never reminded about.
- **No session length anywhere**, in any of the four emails. A test asserts it.
- **The log holds ids and roles only** — no address, no meeting link, no note.
- **The sweep also completes overdue sessions** (carried from 9.5), so the counter stays right even if nobody opens a portal.

**How it runs on Render (the brief asks this be written down)**
- **In the web service**, a sweep every 5 minutes, first run 10 seconds after boot, with a flag so a slow sweep never overlaps itself. Render's paid plan keeps the service awake; the free tier sleeps and was already ruled out.
- **Two instances are safe:** the atomic claim decides who sends, so a scaled deployment cannot double-send.
- **The alternative, if the timer should ever leave the web service:** a Render Cron Job running `npm run reminders:run` on the same schedule. The script is the same sweep and is safe to run beside the server.
- **Timing accuracy:** with 5-minute ticks a reminder lands within 5 minutes of its mark, which is what the wording promises ("tomorrow", "coming up") rather than an exact countdown.

**Verification**
- Tests: **1468 passing across 49 suites** (1445 before, 23 new). Server lint clean.
- **Mutation-checked four times:** dropping the short-notice rule broke **4**; dropping the claim guard broke **1** — the three-sweeps-at-once test, which is the one that actually proves it, with the sequential case held by the separate due check; ignoring the subscription state broke **1**; never closing the window broke **1**.
- Both developer cases are tested directly, at several moments each, as is a move to short notice.
- Also covered: the exact window edges, each person's own clock (London 15:00 / New York 10:00 from one instant), the zone fallback, no link for the client, no length in any email, plain-text parts, log contents, and the overdue sweep completing a session nobody looked at.

**Manual steps for the developer**
1. **Restart the API server.** You should see `Session reminders scheduled.` after the socket line. No packages, no required env vars.
2. **The chunk's own verify step:** schedule a session about 24 hours out, then run `npm run reminders:run`. It prints what it sent. **This writes to whichever database your server uses and sends real email if `RESEND_API_KEY` is set.**
3. Check both inboxes: the client's time and the therapist's time differ if your zones do. The client's email has a button, not a link; the therapist's has the link.
4. To test the hour one, schedule a session about 55 minutes out and run the command again.
5. **Blocker 7 still applies:** until `castofmind.com` is verified in Resend, these emails only reach the Resend account owner.
6. `SESSION_REMINDERS=off` in `.env` turns the timer off while leaving the manual command working.

**Carried forward**
- **Slice 11** still owns renewal (`renewCycle`) and expiry (`endCycle`), and should store Stripe's `current_period_start` for 9.5's period maths.
- A failed reminder is not retried; if that ever matters, the claim would need a release-on-failure path.
- Journal copy "the hour you spend together" (9.4) and the `WorksheetsTab` skeleton status (9.2) are still open.
- **Pre-launch blockers — unchanged at 13.** No placeholder content.

**Not done (by design):** no retry of a failed send · no reminder for cancelled sessions or ended subscriptions · no second scheduler service · no UI.

---

# SLICE 10 — Admin Management

## Chunk 10.1 — Admin: client management

**Status:** Complete. Nothing skipped. **Slice 10 has started.** Not seen rendered; see Manual steps. **Atlas and real Stripe both untouched** — Stripe is faked in tests. One branch is uncovered by the suite and is named under Verification.

**Built**
- server new: `constants/adminClients.js` · `validation/adminClients.schema.js` · `services/adminClients.service.js` · `controllers/adminClients.controller.js` · `routes/adminClients.test.js` (34).
- server routes, on the existing `/admin` mount so they inherit its limiter, action log and guards: `GET /clients` · `GET /clients/:id` · `POST /clients/:id/cancel-subscription` · `/deactivate` · `/reactivate` · `/reset-password`.
- server edits: `models/Subscription.js` and `constants/payments.js` (`cancelledBy`, spec addition) · `routes/admin.routes.js` · `routes/privateNotes.test.js` (the import walk now starts from the admin router too).
- client new: `pages/admin/ClientDetail.jsx` · `components/admin/clients/{ClientHeader,ClientActions,SubscriptionPanel,SubscriptionHistory,ClientIcons}.jsx` · `lib/api/adminClientsApi.js` · `data/adminClientContent.js`. Rewritten: `pages/admin/Clients.jsx`.
- client edits: `App.jsx` (`clients/:id`) · `data/adminNav.js` (placeholder fields removed) · `components/portal/sessions/SessionCounter.jsx` (a `bare` variant) · four admin screens (the underline fix below).
- Packages / env vars: none.

**Key decisions**
- **STRIPE FIRST, DATABASE SECOND, and a failed Stripe call writes nothing** (approved 2026-09-20). Writing `cancelled` after a failed call would leave the screen saying one thing and the bank another, and the person who finds out is the client, on their statement. A Stripe failure is a 502 with nothing changed; Stripe's own error text never reaches the caller.
- **`cancel_at_period_end`, never an immediate cancel** — §13 is explicit that a cancelled client keeps access to the end of the period already paid for. Immediate expiry stays with slice 11 (approved).
- **Spec addition `cancelledBy: 'client' | 'admin'`** (approved) — §10.6 stores only `cancelledAt`, so a manual cancellation and a client's own are indistinguishable afterwards, on the one record a dispute is about. Slice 11 sets `'client'` on the self-serve path.
- **The admin sees `platformSubscriptionId`, not `platformCustomerId` or `checkoutSessionId`** (approved) — a refund starts with finding the row in Stripe; the other two answer no question this screen asks.
- **Deactivating does NOT stop the billing**, and both the header and the dialog say so. `clientProfiles` has no status field and should not gain one: unlike a therapist, a client is not offered to anyone by matching, so there is no second place for the state to be read from.
- **`:id` is the client PROFILE id**, matching `/admin/therapists/:id`, and the therapist's user id appears in no response here — 5.5 and 7.1's rule, reused.
- **The list opens on All, not Active** — the opposite of the therapist list, deliberately. That one is a roster; this one is reached with a person in mind, usually the cancelled client who has just phoned, and an Active default hides exactly them. The counts sit in the control so the shape of the business still reads.
- **`none` is a real filter bucket, shown only when it is not empty** — a client with no subscription row is a broken state worth finding, and a permanent filter for a state that does not exist reads as though it were expected.
- **Cancelling is idempotent and keeps the first `cancelledAt`**, via a conditional update, so a client cancelling from their own portal at the same moment (slice 11) cannot be overwritten.
- **The screens never mention what the admin cannot see.** There is no conversation, journal or notes view, and no line explaining its absence — naming a capability that was deliberately not built only invites a request for it.

**Verification**
- Tests: **1502 passing across 50 suites** (1468 before, 34 new). Server lint clean; client `oxlint` 0 findings on touched files; build passes; the generated CSS was confirmed to carry every new utility.
- **Mutation-checked four times:** writing the database before calling Stripe broke **2**; removing both idempotency guards on cancel broke **1**; keeping the populated user on the detail response broke **1**; widening the subscription allowlist to the customer and session ids broke **1**.
- **The ordering test asserts order, not timing** — the Stripe fake reads the stored row as it is called, the lesson 7.3 learned when "persists before it emits" passed against an inverted implementation.
- **One branch is deliberately untested: "no Stripe key configured at all."** Jest builds an ESM mock's namespace once, so `isStripeConfigured` cannot be flipped between cases in one suite. It is unreachable in production — `config/env.js` refuses to start without a key — and exists only so a developer without one gets a notice instead of a crash. Checked by hand, not by the suite.
- **`privateNotes`:** the import-graph walk now starts from `admin.routes.js` as well and asserts the notes modules are unreachable from it, with a non-vacuous size check. A response sweep over both new endpoints asserts no journal, note or conversation key.
- Contrast: **57 pairs computed, 1 failure found and fixed.** Tightest after it: the modal caption at 4.56:1, the success badge at 4.69:1, the list and panel notes at 4.74:1.
- **The failure was a real one, and it was already shipped.** The admin's table links carried `decoration-ink/30` — **1.96:1**, and that underline is the only thing distinguishing a link from the identical-coloured text beside it. Raised to `decoration-ink/60` (**4.74:1**) here and on Applications, Therapists and the dashboard card, so all five admin screens stay identical. Same defect 7.6 found in the chat bubble.
- **30 client logic checks** (the client has no Jest suite): icon bounds, the state wording and tones, the couple label being announced and not only drawn, the list default, the filter's appear-when-present rule, money going through the one helper that divides, and copy rules — no session length, no invented timeline, no retention pressure on the cancellation dialog.
- **4 icons bounds-checked** against the 24 viewBox including stroke, 0 out of bounds; arcs sampled from their true centre rather than read at their endpoints (the 8.1 trap).
- Detector `[]` — **a degraded empty**: the four parsing dependencies were re-checked this chunk and are all still absent, so it evaluates no contrast. The computed table is the compensation.

**Manual steps for the developer**
1. **Restart the API server; hard-refresh the client.** No packages, no environment variables, no external setup.
2. Sign in as the admin → **Clients**. Both real client accounts should appear with their therapist and subscription state. Search by name, by a partner's name, and by email.
3. Open one. Check the intake answers, the concern chips, and that the therapist links through to their admin page.
4. **The chunk's own verify step, and it spends real money if your key is live.** Use a test-mode client. Press **Cancel subscription**: the dialog must name the real end date, the row must move to Cancelled, and **the subscription in your Stripe dashboard must show "Cancels at period end"**. If Stripe is unreachable you should get an error and *no* change here — that is the behaviour, not a bug.
5. **This path has never run against real Stripe** — the suite fakes it. Step 4 is its first live exercise.
6. Try **Deactivate**: they can no longer sign in, and the subscription is untouched. Reactivate afterwards.
7. At 360px the table collapses to cards; with reduced motion on, the skeleton rows must not pulse.

**Carried forward**
- **Slice 11 must handle the webhooks an admin cancellation now produces.** `customer.subscription.updated` fires on `cancel_at_period_end`, and `customer.subscription.deleted` at the period end; both are still stubs, so nothing yet flips `cancelled` → `expired` on the 7.1 gate's boundary.
- **Slice 11 sets `cancelledBy: 'client'`** when a client cancels from their own portal.
- **10.2** reuses this list's shape for the bookings overview; **10.3** adds reviews, which the therapist detail already has a panel waiting for.
- **For Asad:** manual cancellation stops the billing but issues no refund — that stays a dashboard action (§12). Worth confirming that is what he expects when he uses this button for a refund dispute.
- Journal copy "the hour you spend together" (9.4) and the `WorksheetsTab` skeleton status (9.2) are still open.
- **Pre-launch blockers — unchanged at 13.** No placeholder content was created: every word in `data/adminClientContent.js` is a spec fact or a plain description of a control.

**Not done (by design):** no reassign therapist (v2) · no conversation, journal or note visibility in any form (§11) · no immediate expiry (slice 11) · no refund logic · no free-text cancellation reason · nothing on these screens edits what a client told us.

---

## Chunk 10.2 — Admin: bookings and subscriptions overview

**Status:** Complete. **CSV export was dropped by the developer at approval (2026-09-21)** — not built, not skipped. Not seen rendered; see Manual steps. **Atlas untouched**; every test ran in memory.

**Built**
- server new: `constants/adminBookings.js` · `validation/adminBookings.schema.js` · `services/adminBookings.service.js` · `controllers/adminBookings.controller.js` · `routes/adminBookings.test.js` (24). Route: `GET /admin/bookings`, on the existing guarded mount.
- server edits: `utils/search.js` (`clientNameClauses`, moved out of 10.1's service) · `validation/adminClients.schema.js` (`SUBSCRIPTION_STATUS_FILTERS`, now shared) · `routes/admin.routes.js` · `routes/roleGuards.test.js` (see Verification).
- client new: `components/admin/bookings/StatusLedger.jsx` · `data/subscriptionStates.js` · `data/adminBookingContent.js` · `lib/api/adminBookingsApi.js` · `OpenRowIcon`. Rewritten: `pages/admin/Bookings.jsx`.
- client edits: `DataTable.jsx` (`rowHref`, `initialSort`) · `ui/Badge.jsx` (the contrast fix below) · 10.1's three client files (shared state wording) · `data/adminNav.js`. **Deleted** `AdminSectionPlaceholder.jsx` — all five sections are built, so nothing used it.
- Packages / env vars: none.

**Key decisions**
- **One row per booking, carrying its NEWEST subscription** — the rule the 7.1 gate uses, so this screen and a client's portal cannot disagree about one pairing.
- **Sort is an allowlist of five named keys, mapped server-side to computed fields.** The query string picks a key and never supplies a field; anything else is 422, not ignored — a sort silently not applied would present rows in an order the header claims.
- **Status sorts in LIFECYCLE order** (active → payment failed → cancelled → ended → none), not alphabetically. **Missing values sort last in both directions**, so "soonest payment first" does not open on rows with no payment.
- **Only a live subscription has a next payment.** Cancelled and expired rows still STORE `nextBillingDate` (the model requires it); showing or sorting by it would schedule money that is not coming. Cancelled rows show "Access ends …" instead.
- **Counts are taken after the search and before the status filter** — they describe the table the admin is looking at, never the business. No money, month comparison or trend anywhere: the dashboard owns those.
- **The ledger is the summary AND the control.** A thin bar draws the mix; the chips beneath are its legend and the filter, so each number appears once. On ink: the only ground where gold can mark the cancelled slice, and the same command surface that opens every admin detail screen. Choosing a chip dims the other slices. The bar is aria-hidden; "no subscription" is drawn hollow, so it differs from "payment failed" by shape, not only hue.
- **Rows click through via a new `rowHref` on the shared table**, off by default so the other three lists are unchanged. The client's name stays a real link for keyboard and screen readers; clicks on links inside the row, text selection and ctrl/cmd-click all behave as they would on a link.
- **`initialSort`** hands the table the server's default, so the header marks the order the rows are actually in.
- **"Paired since" is `booking.matchedAt`** (approved). **The client's email is searchable but not shown** — the brief's five columns, and the email is one click away.
- **Flags are words on the row:** "Deactivated — cannot sign in" under a departed therapist, "Deactivated" under a blocked client — the pairings this screen exists to surface.

**Verification**
- Tests: **1526 passing across 51 suites** (1502 before, 24 new). Server lint clean; client `oxlint` 0 findings on touched files; build passes; generated CSS confirmed for every arbitrary value, including the `color-mix` badges.
- **Mutation-checked seven times, each breaking at least one test:** the sort allowlist 1 · counts after the status filter 1 · next payment regardless of status 2 · missing-last removed 1 · oldest subscription deciding 1 · alphabetical status 1 · collation removed 1.
- **A sixth false-confidence test, caught before it shipped.** The case-insensitive sort fixture (`charlie`, `Alice`, `bob`) sorts identically in binary order, so deleting the collation would have broken nothing. Rewritten with `Carl`, `Alice`, `bob`, where byte order and human order disagree.
- **A real contrast failure, already shipped since 4.2.** Admin table rows turn mist on hover, and the `Badge` tints composited over it: success **4.27:1**, danger **4.32:1**. Fixed at the primitive — the tints are now mixed opaque into paper with `color-mix(in srgb …)`, so every badge is its paper figure (4.69 / 4.74) on any ground. Fixes every admin table, not only this one.
- Contrast: **37 pairs computed, 0 failures after that fix.** Tightest: success badge 4.69:1, ledger note 4.74:1, the "ended" slice 3.14:1 on ink.
- **Dataviz validator on the ledger palette (dark, ink-deep):** CVD separation ΔE 10.9, normal vision 19.1, all fills ≥ 3:1 — pass. It fails lightness band (gold) and chroma floor (sage, grey): categorical checks, on a status encoding with a fixed palette and a deliberately neutral grey. Accepted and recorded.
- **27 client checks** (client/server parity of sort keys, default sort, filter buckets and slice order; row-click behaviour; no dashboard figures; no CSV; copy rules). `OpenRowIcon` bounds-checked. Detector `[]` — degraded, as always.
- **Test infrastructure, beyond this chunk and flagged:** `roleGuards.test.js` boots the whole app in a child process with a 15s window; under the full run it missed it once, and passed 21/21 alone. Widened to 45s (test timeout 60s) — a hang guard, not a behaviour claim, as 7.6's were.
- **One failure I could not reproduce.** Straight after the mutation run (seven back-to-back Jest processes) one run of three suites failed a single test I did not see; four further runs and the full suite passed. Recorded rather than called fixed.

**Manual steps for the developer**
1. **Restart the API server; hard-refresh the client.**
2. Admin → **Bookings**. The ledger shows the mix; click a chip and the table filters while the other slices dim.
3. Search a therapist's surname: every client paired with them appears, and the ledger's counts follow the search.
4. Sort each column both ways. Next payment: ended and no-subscription rows stay at the bottom either way.
5. Click anywhere on a row → that client's screen. Ctrl-click opens a new tab; selecting a name to copy does not navigate.
6. Deactivate a test therapist, then return: their pairings read "Deactivated — cannot sign in". Reactivate afterwards.
7. At 360px the table becomes cards and the ledger chips wrap; the hover badge colour should no longer shift.

**Carried forward**
- **10.3** next: reviews. **Slice 11** still owns the webhooks an admin cancellation produces, `cancelledBy: 'client'`, and cancelled → expired on the 7.1 boundary.
- A name sort joins every matched booking before ordering — fine at tens to hundreds; past a few thousand, store a sort key.
- Journal copy "the hour you spend together" (9.4) and the `WorksheetsTab` skeleton status (9.2) are still open.
- **Pre-launch blockers — unchanged at 13.** No placeholder content.

**Not done (by design):** CSV export (dropped) · dashboard figures of any kind · editing or reassigning a pairing (v2) · any conversation or clinical content.

---

## Chunk 10.3 — Reviews and performance monitoring

**Status:** Complete. Nothing skipped. Not seen rendered; see Manual steps. **Atlas untouched**; every test ran in memory. Two defects in shipped code were found and fixed on the way (Verification).

**Built**
- server new: `models/Review.js` (§10.12 + `subscriptionId`) · `constants/reviews.js` · `validation/reviews.schema.js` · `services/reviewSubmission.service.js` (write half) · `services/adminReviews.service.js` (the ONLY reader) · `controllers/reviews.controller.js` · `controllers/adminReviews.controller.js` · tests `models/Review.test.js` (7), `routes/reviews.test.js` (26).
- routes: `POST /client/reviews` (above the subscription gate) · `GET /admin/reviews?therapistId=&page=`.
- server edits: `clientPortal.service.js` (`reviewState` on `/me`) · `adminStats.service.js` and `adminTherapists.service.js` (the 4.4/4.5 raw-collection reads replaced) · `journal.service.js` (a real 500, below) · four existing test files.
- client new: `components/reviews/ReviewMarks.jsx` (shared stars and marks) · `components/portal/client/review/RatingForm.jsx` · `components/admin/therapists/RatingsSection.jsx` · `lib/api/{reviewsApi,adminReviewsApi}.js` · `data/reviewContent.js`. Rewritten: `admin/dashboard/QualityPanel.jsx`.
- client edits: `SubscriptionEnded.jsx`, `Account.jsx`, `ClientPortalShell.jsx`, `TherapistDetail.jsx`.
- Packages / env vars: none.

**Key decisions**
- **A client can rate once their subscription is cancelled OR expired** (approved) — on the ended screen, and on Account while a cancelled plan runs out. Someone who cancels rarely returns after expiry.
- **The submit route sits ABOVE the subscription gate.** §9.6 asks for a rating when a subscription ends — the exact people the gate refuses. Eligibility is checked in the service instead.
- **The therapist is resolved from the client's own booking, never the request.** The body is stars and optional words; any other key is a 422 with nothing written.
- **One rating per subscription** (approved spec addition `subscriptionId`, unique index) — double submissions are refused by the database, and two racing requests leave exactly one row.
- **The client never sees a review again** (approved). Submit answers `{ submitted: true }`; `/me` carries a state only (`not_yet` · `eligible` · `submitted`). Once sent it is simply gone on their next visit — no second thank-you.
- **The admin sees who wrote it** (approved), and the form says so before they send: *"Only the Cast of Mind team reads this, with your name. Your therapist never sees your rating or your words."*
- **The read path is one file, and the boundary is structural.** `adminReviews.service.js` is the only code that reads reviews; the split controllers keep the client router from reaching it. A test walks EVERY router but the admin's (read from the directory, so future routers are covered) and asserts it is unreachable, plus a response sweep of 20 client, therapist and public endpoints with a canary review.
- **3 ratings before a therapist is ranked** (approved, for Asad to confirm). The ranked set splits at its middle — no name in both lists, no below-average therapist shown as "highest rated" because only two are ranked. Deactivated therapists are not ranked; unranked ones are counted, so their absence is explained.
- **Stars are sage-deep, never gold,** on light ground (gold 1.63:1 fails even as a graphic). The form's stars are real radio buttons drawn over — native arrow keys, one tab stop, a spoken "4 of 5" — with the choice also written in words.

**Verification**
- Tests: **1560 passing across 53 suites** (1526 before, 34 new). Server lint clean; client `oxlint` 0 findings on touched files; build passes; generated CSS confirmed, including the `has-[:focus-visible]` focus rings.
- **Mutation-checked eight times — seven broke tests at once:** eligibility widened (3) · therapist from the body (1) · unique index removed (3) · ranking minimum at 1 (1) · stars optional (2) · lists not split (2) · the reply echoing the review (1).
- **THE EIGHTH BROKE NOTHING — a seventh false-confidence test.** A bare `import '…adminReviews.service.js'` on the client path passed all 33: the import walker matched only `from '…'`. **8.6's private-notes walker had the same hole.** Both now also match bare and dynamic `import()`, and each is proven to catch all three shapes.
- **A real 500 in shipped code (8.6).** Editing a journal entry deleted in another tab between load and save threw an uncaught `DocumentNotFoundError`. It now answers the same 404 a missing entry does; a new test forces the interleaving and fails without the fix.
- **8.6's boundary sweep raced itself** — it fired PATCH and DELETE on one entry in parallel, and failed whenever the delete won. The two now run in order.
- Contrast: **28 pairs computed, 0 failures.** Tightest: open star stroke 3.35:1 on its hover ground, 3.43:1 on paper; clay error 5.48:1.
- **31 client checks** (radio semantics, 48px targets, the disclosure's exact wording, offered only while eligible, no nudge or celebration, the caveat on both admin surfaces, no hooks rule silenced, the skeleton announced). **4 icons** bounds-checked with cubic curves sampled. Detector `[]` — degraded, as always.

**Manual steps for the developer**
1. **Restart the API server; hard-refresh both apps.**
2. **The brief's verify step needs an ended subscription — set one on a TEST client yourself** (Atlas: `status: "expired"`, `currentPeriodEnd` in the past). I have not touched your data.
3. Sign in as that client: the ended screen offers the stars. Try the arrow keys; send with and without words. Reload — the form is gone, no second thanks.
4. As the therapist: nothing about ratings anywhere. As a visitor: nothing on their public profile or in matching.
5. As the admin: the dashboard average, lists and caveat; the therapist's screen shows the bars and the review with the client's name.
6. Put the test client's subscription back afterwards.

**Carried forward**
- **For Asad:** the 3-rating minimum, and the form's wording — added to the relationship-status and mood-word confirmations.
- **Slice 11** sets `cancelled`/`expired` for real, which is what makes clients eligible outside a hand-edited test.
- 10.4 notifications next. Journal copy "the hour you spend together" (9.4) and the `WorksheetsTab` skeleton status (9.2) are still open.
- **Pre-launch blockers — unchanged at 13.** No placeholder content.

**Not done (by design):** ratings shown to therapists, publicly or back to their writer · a mandatory written review · editing, deleting or replying to reviews · any reminder to rate.

---

## Chunk 10.4 — Notifications

**Status:** Complete. Nothing skipped. Not seen rendered; see Manual steps. **Atlas untouched**; every test ran in memory. Includes the star-colour fix the developer asked for (below).

**Built**
- server new: `models/Notification.js` (§10.13 + `count`, `lastAt`) · `constants/notifications.js` · `validation/notifications.schema.js` · `services/notification.service.js` · `controllers/notification.controller.js` · `routes/notifications.routes.js` · `routes/notifications.test.js` (21).
- routes: `GET /api/v1/notifications` · `POST /:id/read` · `POST /read-all` — all scoped to the token's own user.
- server edits: `constants/socket.js` and `realtime/emitter.js` (`notification:new`) · `chat.service.js`, `worksheet.service.js`, `clientOnboarding.service.js` (the three triggers) · `routes/index.js`.
- client new: `components/portal/NotificationProvider.jsx` · `components/portal/therapist/notifications/{NotificationBell,NotificationRow,NotificationIcons}.jsx` · `lib/notifications/{notificationContext,notificationStore}.js` · `lib/api/notificationsApi.js` · `data/notificationContent.js`. Rewritten: `pages/portal/therapist/Notifications.jsx` (the 8.1 placeholder is gone).
- client edits: `TherapistRail` (the bell), `TherapistPortalShell` (the provider), `socketClient.js`, `therapistPortalContent.js` (placeholder copy removed), plus the three star call sites.
- Packages / env vars: none.

**Key decisions**
- **ONE OPEN ALERT PER CLIENT PER KIND, not one per event** (approved). Twelve messages are one row reading "12 new messages", carried by spec additions `count` and `lastAt`. Anything else turns the bell into a wall of identical lines and repeats the sidebar badge — the one thing §8.8 is not for.
- **The grouping is an atomic upsert** against a partial unique index on `{userId, bookingId, type}` where `read: false`. Two messages landing together cannot both insert; a genuine race surfaces as a duplicate key and the retry increments the row the other request just wrote.
- **Reading one closes it.** The next event opens a fresh alert rather than quietly raising a count the therapist has already cleared.
- **Therapists only, in v1** (approved). A client gets an empty list, not a 403 — an empty feed is the truth for them, and a refusal would advertise a feature they do not have.
- **No content, anywhere** (approved): not in the payload, not on screen. A row is who, what kind, how many, when. The panel sits open in a rail, which is the least private surface the therapist portal has (8.1's rule).
- **Retention is a TTL index at 60 days from `lastAt`**, not a scheduled job (approved). Safe here for the reason it was unsafe in 1.3: the whole document is the disposable thing, where `refreshTokenExpiresAt` lived on a record that had to survive. From `lastAt`, not `createdAt`, so a group still in use does not vanish because its first event was two months ago.
- **The record is always written; only the push is best-effort.** Unlike 7.6's unread push, which is skipped without a socket server, the bell reads over REST — so the row must exist either way. A failure is logged by error NAME only and can never fail the message, the worksheet or the account it describes.
- **The new-client alert is written after the payment transaction commits**, never inside it — the same rule the welcome email follows. A bell must not be able to roll back an account somebody paid for.
- **Opening the panel marks nothing read.** Reading happens on opening an alert or on "Mark all as read" — 7.6's rule, because a count that clears itself is a count that lies.
- **The panel is `fixed`, so it escapes the rail's own scroll container** rather than being clipped by it; Escape closes it, a click outside closes it, and focus returns to the bell.
- **Unread is weight plus a dot, never colour alone.** Gold carries the count on ink (11.08:1); on the paper feed the same dot is ink, because gold there is 1.63:1.

**Verification**
- Tests: **1581 passing across 54 suites** (1560 before, 21 new). Server lint clean; client `oxlint` 0 findings on touched files; build passes.
- **Mutation-checked ten times, every one broke a test:** the feed not scoped to the caller (2) · mark-read not scoped (1) · read-all clearing everybody's (1) · grouping removed (2) · a read alert reopened instead of a fresh one (1) · the therapist alerted by their own message (1) · a notification failure allowed to fail the send (1) · the client's user id added to the payload (1) · the open-alert index no longer unique (1) · retention expiring from `createdAt` (1).
- Contrast: **29 pairs computed, 0 failures.** Tightest: the "Mark all as read" underline and the retry border, both 3.76:1 on ink-deep.
- **34 client checks**: store rules (an incoming alert updates its row rather than adding a second, the panel limit, newest-not-unread-first ordering), the row being a real link, the count in the bell's accessible name, Escape and click-outside, 44px targets, no content anywhere, no hooks rule silenced. **4 icons** bounds-checked with arcs and curves sampled. Detector `[]` — degraded, as always.
- **A Tailwind class that silently emitted nothing, caught by checking the built CSS:** `top-[calc(100%+0.5rem)]` is invalid because CSS needs spaces around the `+`. Written with underscores it compiles to `calc(100% + .5rem)`. The editor's "canonical class" hint suggests the broken form; the generated CSS is the evidence.

**Manual steps for the developer**
1. **Restart the API server; hard-refresh the client.** No packages, no environment variables.
2. **The brief's own verify step:** sign in as a therapist with two clients, open Client A, and have Client B send a message from another browser. The bell's count should rise without a refresh, and opening the alert should land on Client B's chat.
3. Have the same client send several more messages: it stays **one** row, and the count climbs.
4. Read it, then have them write again — a fresh alert appears.
5. Return a worksheet as a client, and check the bell says so without naming the worksheet.
6. Check "See all" and the feed page, grouped by day, and "Mark all as read".
7. Keyboard: tab to the bell, Enter to open, Escape to close — focus must return to the bell. At 360px the panel is full width.

**Carried forward**
- **Slice 12.5:** `notification:new` uses the same per-user rooms as the unread push, so it needs the Redis adapter alongside the sticky-sessions note already parked there.
- A client-side bell, email or push notifications, and muting are all deliberately not built.
- **Star colour (developer's request):** filled stars are now `fill-gold` with a `stroke-ink/70` outline (6.74:1). Gold alone is 1.63:1 on paper and would have been all but invisible on the white cards.
- Journal copy "the hour you spend together" (9.4) and Asad's confirmations (mood words, relationship statuses, the 3-rating minimum) are still open.
- **Pre-launch blockers — unchanged at 13.** No placeholder content.

**Not done (by design):** no client bell · no message previews · no email or push · no preferences or muting · no admin notifications · no scheduled cleanup job.

---

## Chunk 10.5 — Admin 2FA (SKIPPED / DEFERRED)

**Status: NOT BUILT. Deferred by the developer, 2026-09-24.** No code was written, no tests were added, and nothing in the codebase changed for this chunk. It is recorded here so the gap is visible rather than looking like an oversight.

**The decision**
- Deferred to a **pre-launch security review**, on the grounds that Asad has not requested it, and the admin account already has a strong password and the 30-minute idle timeout built in 4.1.
- **Pre-launch blocker 12 stays open** and is updated to say so. It needs the client's explicit confirmation before launch — deferring the build is not the same as waiving the requirement.

**What this leaves standing, stated plainly**
- §18 calls admin 2FA "effectively non-negotiable" for a platform holding mental health data. That sentence is unchanged by this decision.
- §11 records that the admin mailbox can reset the admin password. **So the admin's email inbox is, today, the master key to every record on this platform** — every client's account, every therapist's credentials, the payment ledger.
- The idle timeout (4.1) closes an abandoned session. It does nothing about a stolen password or a compromised inbox, which are the two cases 2FA exists for. They are different risks and only one of them is currently covered.
- The plan, if it is picked up later, is unchanged: **email OTP via Resend**, which also depends on blocker 7 (verify `castofmind.com` in Resend) — until that is done no OTP could reach anyone but the Resend account owner.

**Verification**
- None. Nothing was built, so nothing was tested. The suite stands where 10.4 left it: **1581 passing across 54 suites.**

**Manual steps for the developer**
1. Nothing to restart, install or configure.
2. **Put admin 2FA on the agenda for the pre-launch security review**, together with blocker 7, since the intended method depends on it.

**Carried forward**
- **Blocker 12 remains on the list of 13**, now marked as deferred rather than scheduled.
- 10.6 (admin polish and audit) is next in slice 10.

---

## Chunk 10.6 — Admin polish (focused scope)

**Status:** Complete **for the scope the developer set at approval (2026-09-24)**. The brief's activity log, keyboard table navigation, tablet/sidebar redesign, state-component audit and a separate health page were **deliberately not built, on instruction**. Not skipped. The 7 existing confirmation dialogs were left untouched. Not seen rendered; see Manual steps. **Atlas, Stripe, Resend and Cloudinary untouched**; every test ran in memory with the vendors faked.

**Built**
- server new: `constants/systemStatus.js` · `services/systemStatus.service.js` · `routes/systemStatus.test.js` (17) · `routes/adminBulkSafety.test.js` (5). Route: `GET /admin/system-status`, on the existing guarded admin mount.
- server edits: `controllers/admin.controller.js` · `routes/admin.routes.js` · `test/constantsParity.test.js` (+1).
- client new: `components/admin/dashboard/SystemStatusCard.jsx` · `data/systemStatusContent.js`.
- client edits: `therapists/TherapistEditForm.jsx` (the email-change dialog) · `AdminIcons.jsx` (Mail, Database, Card, Cloud) · `lib/api/adminApi.js` · `pages/admin/Dashboard.jsx`.
- `ongoing.md`: blocker 7 and the Slices 0–5 open items no longer describe 10.5 as scheduled.
- Packages / env vars: none.

**Key decisions**
- **No activity log and no new collection.** Master spec §20 defers it, and the developer chose the spec over the brief. The 4.1 server-log line stays as it is.
- **The status is checked when the dashboard loads, and again only on "Check again". Never polled.** The server makes one call per vendor per request, and a test proves exactly one.
- **The email check surfaces blocker 7 live.** Resend's shared test sender reads "Needs attention"; so does a sending domain Resend hasn't verified. A lookalike domain (`notcastofmind.com`) doesn't count as verified. A sending-only key is reported as reachable but uncheckable, not as a fault.
- **Fixed words out, never vendor text.** Each service answers `operational` · `attention` · `down` · `not_configured` plus a detail code. Failures are logged by error name only, because a vendor message can carry account ids or hosts.
- **Every check is raced against a 4-second timeout**, so one slow vendor can't hold the card and the others still report.
- **Each state has its own mark shape** (solid, half-filled, crossed, dashed) as well as its word and hue. Nothing rests on colour alone. The state rule across the top of the card is sage / ink / clay.
- **The card has one elevation (a soft shadow, no border)** plus the house sage glow. Service tiles are separated by hairline seams from a `gap-px` grid, so the seams stay correct at every width.
- **The email dialog appears only for a real change.** It compares the trimmed, lower-cased address the server would store. It shows old → new drawn, says the password is unchanged and both inboxes are told, and puts the safe button first so it gets focus.
- **Bulk safety has two layers.** (1) An import-graph walk from the admin router fails if any `admin*` file uses `updateMany`, `deleteMany`, `bulkWrite` or `insertMany`. (2) All 10 admin write routes refuse six query-operator-shaped ids with 400, and a snapshot of six collections proves nothing moved. A body naming another record or an operator gets 422. A real id still changes exactly its own record, so the guard isn't passing by refusing everything.

**Verification**
- Tests: **1604 passing across 56 suites** (1581 before, 23 new). Server lint clean; client `oxlint` 0 findings on touched files; build passes; generated CSS confirmed for the arbitrary shadow, `border-[1.5px]`, the grid seams and the status fills.
- **Mutation-checked six times, and every one broke a test:** no timeout race 1 · vendor message returned 2 · vendor message logged 1 · lookalike domain accepted 1 · unverified domain treated as verified 1 · a multi-document write added to admin code 1.
- **The timeout mutation also hung Jest** on the request that never answers, and I had to stop it by hand. That's the failure the timeout exists to prevent.
- Contrast: **30 pairs computed, 0 failures.** Tightest: the loading placeholder ring 3.36:1 on mist, the sage state rule 3.40:1, the header marks 4.59:1 on mist.
- **34 client checks** (summary wording and precedence, singular/plural, no polling in the card, reduced motion, 44px targets, the dialog's guard and focus order). **4 icons + 3 status marks** bounds-checked with arcs sampled from their true centre. Detector `[]`, degraded as always.

**Manual steps for the developer**
1. **Restart the API server; hard-refresh the client.** No packages, no environment variables.
2. Admin → **Dashboard**, scroll to **System status**. With your development keys you should see Database working, Payments working ("Test mode…"), and Email "Needs attention" (the test sender) until blocker 7 is done.
3. Press **Check again**: the tiles dim, then refresh, and the time updates. Stop your internet and press it again: Payments, Email and File storage should read "Not responding" within about 4 seconds.
4. Therapists → one therapist → **Edit** → change only the sign-in email → **Save**. The dialog shows old → new. Escape keeps the form as it was. **Change the email** saves.
5. Change only a name and save: no dialog.
6. At 360px the status tiles stack; at tablet width they sit two by two.

**Carried forward**
- The client-detail screen still has no breadcrumb in the top bar (the header reads "Clients"). Out of this chunk's scope as set.
- **Slice 11** next: renewal, failure, cancellation and expiry, including the webhooks an admin cancellation produces.
- **Pre-launch blockers: unchanged at 13.** No placeholder content.

**Not done (by instruction):** activity log · keyboard table navigation · tablet/sidebar redesign · changes to loading/error/empty states · a separate status page · any background polling · changes to the 7 existing dialogs.

---

# SLICE 11 — Subscription Lifecycle

## Chunk 11.1 — Renewal handling

**Status:** Complete. Nothing skipped. **Slice 11 has started.** Server only, no UI, so no impeccable pass and no contrast work. **Atlas and real Stripe untouched**; every test ran in memory with real signatures and email faked. **One real gap in shipped code (6.3) was found and fixed** (below).

**Built**
- server new: `services/subscriptionRenewal.service.js` · `services/email/templates/paymentReceipt.js` · `routes/subscriptionRenewal.test.js` (37).
- server edits: `services/stripeWebhook.service.js` (the renewal handler, ledger linking) · `controllers/webhook.controller.js` (duplicates routed) · `services/clientOnboarding.service.js` (concurrent-delivery recovery) · `models/Subscription.js` (`currentPeriodStart`, spec addition) · `services/sessionCounter.service.js` (`periodStartOf` reads it; `renewCycle` removed) · `email.service.js`, `constants/email.js`, `test/emailServiceMock.js` · tests in `webhook`, `webhookAccountCreation`, `sessionCounter`.
- Packages / env vars: none.

**Key decisions**
- **THE GAP: a failed handler was lost for ever.** The ledger row is written before the handler runs, and a duplicate returned 200 without running it. So a handler that failed once turned Stripe's retry into a skipped "duplicate": paid, and never acted on. 6.4's effect guard only ever saw a *different* event id. **Duplicates are now routed again** (developer's call, 2026-09-24); every handler guards at its effect, and the reply still says `duplicate: true`.
- **Concurrent identical checkouts now recover:** the losing delivery hits a unique index, finds the winner's subscription, and answers 200 instead of 500.
- **The forward-only condition IS the idempotency.** One atomic update matches only while the stored `currentPeriodEnd` is earlier than the new one. Replays, a different event for the same invoice, three deliveries at once, and a late older invoice all match nothing.
- **Period, counter and status move in one write.** `sessionsRemaining: 4` sits in the same `$set` as the dates, so they can never be applied apart. `renewCycle` is gone, so the reset has one source.
- **The new period comes from the signed invoice's subscription line,** with no Stripe API call. **Never `invoice.period_start/period_end`:** on a renewal those are the period that just ENDED. **Fallback:** one month from `invoice.period_end`, clamped (31 Jan → 28/29 Feb). **It reads only the invoice:** anchored on our own record, every retry would add another month.
- **Both invoice shapes are read.** API `2026-08-26.dahlia` moved the subscription id to `parent.subscription_details.subscription`; the older top-level field is the fallback.
- **Only `billing_reason: subscription_cycle` renews.** `subscription_create` is still skipped; any other reason is recorded and left alone.
- **A paid renewal brings `past_due` back to `active`** (developer's call). `cancelled` and `expired` are refused loudly and left unchanged: money arrived and a person must look.
- **Unknown subscription, no period, or a refused status: a loud `RENEWAL NOT APPLIED` log and a 200.** A retry cannot fix any of them. A database error still throws, so Stripe retries.
- **An amount other than €200 still renews** (Stripe is the truth about money) and warns with amounts only.
- **Ledger rows are linked** to `subscriptionId` and `clientId`, read before the insert because the ledger can never be updated. Best effort: a failed lookup leaves a row unlinked, never unwritten.
- **Our own receipt** (developer's call): amount, paid on, the period covered, next payment, and §13's *"To stop it, cancel before this date."* Dates are in the client's saved zone, or labelled UTC. No card detail, no Stripe link, no session length. Sent only when the update really changed the row, after the write; a failure is logged by error name and never undoes the renewal.

**Verification**
- Tests: **1644 passing across 57 suites** (1604 before, 40 new; one `renewCycle` test replaced by the real webhook). Server lint clean.
- **Mutation-checked ten times, every one caught:** forward-only condition removed 4 · duplicates not routed 2 · sessions carried over 3 · receipt on a no-op 4 · first invoice renewed 2 · fallback anchored on our record 2 · the invoice's own (old) period used 17 · cancelled/expired renewable 2 · ledger not linked 1 · concurrent checkout loser not recovered 1. Each file was restored byte-for-byte and checked.
- **The gap is tested for real on both paths:** the handler fails once (500), the SAME event is retried, and the renewal (and the account, for checkout) happens exactly once.
- A test fake was wrong on the first run: it returned a bare promise where the service calls `.lean()`. The fake was fixed; the code was not bent to suit it.

**Manual steps for the developer**
1. **Restart the API server.** No packages, no environment variables.
2. **The brief's verify step, with Stripe test clocks.** It writes to whichever database your server uses, so use a test client. Run `stripe listen --forward-to localhost:<port>/api/v1/webhooks/payment` and put its `whsec_` in `STRIPE_WEBHOOK_SECRET`. Stripe Dashboard (test mode) → Billing → Test clocks: create a clock, a customer and a €200 monthly subscription on it, then check out that client once. Advance the clock by one month.
3. Expect `invoice.payment_succeeded` with `subscription_cycle`, then in Atlas: `currentPeriodEnd` one month later, `sessionsRemaining: 4`, `status: active`, and a receipt (blocker 7 applies: only the Resend owner receives it until the domain is verified).
4. In the Stripe dashboard, **Resend** the same event: the reply says `duplicate: true` and nothing changes.

**Carried forward**
- **11.2:** failed payment and grace. The renewal already restores `past_due` → `active`; 11.2 adds the failure, the banner and the grace expiry.
- **11.3 / 11.4:** cancellation and expiry must call `endCycle`, and flip cancelled → expired on the 7.1 gate's `currentPeriodEnd` boundary.
- **Every future handler must be safe to run twice** — duplicates now reach them.
- **Pre-launch blockers — unchanged at 13.** No placeholder content.

**Not done (by design):** no past-due logic, cancellation, expiry or UI (11.2–11.5) · no renewal reminders (11.6) · no Stripe-sent receipt · no client action anywhere.

---

## Chunk 11.2 — Failed payment and grace period

**Status:** Complete. Nothing skipped. Not seen rendered; see Manual steps. **Atlas and real Stripe untouched**; tests fake the Stripe API and email, with real signatures. Impeccable loaded before the banner. **One more real bug in shipped 6.3 code was found and fixed** (the ledger amount, below).

**Built**
- server new: `services/subscriptionLifecycle.service.js` (past-due, the grace sweep, the scheduler) · `services/billingPortal.service.js` · `constants/subscriptionLifecycle.js` · `services/email/templates/paymentFailed.js` · `scripts/runLifecycleSweep.js` · `routes/paymentFailure.test.js` (38).
- server edits: `stripeWebhook.service.js` (failure handler, ledger amount fix) · `requireActiveSubscription.js` (the grace boundary) · `subscriptionRenewal.service.js` (recovery clears the grace) · `models/Subscription.js` (`pastDueSince`, `graceEndsAt`, index) · `sessionCounter.service.js` (`endCycle` removed) · `client.routes.js` + controller (`POST /client/billing/portal`) · `constants/clientPortal.js` (`graceEndsAt` on `/me`) · `server.js`, `config/env.js`, `package.json` (`lifecycle:run`) · email service, subjects, mock.
- client: `AccessNotice.jsx` (the banner rebuilt) · `CardRenewIcon` · `openBillingPortal` in `clientPortalApi.js` · banner copy in `clientPortalContent.js`.
- Packages: none. Env: one **optional** `LIFECYCLE_SWEEP=off`.

**Key decisions**
- **Only a failed renewal (`subscription_cycle`) on an `active` row starts the grace.** A failed first invoice means no account exists. Cancelled and expired rows are left alone.
- **One episode, one email** (developer's call). The update matches only `active`, so Stripe's own retries failing again never restart the grace or email twice.
- **The grace runs from Stripe's time of failure (`event.created`)**, so a retried webhook lands on the same deadline. 3 days, from `PAST_DUE_GRACE_DAYS`.
- **A stale failure is ignored:** if 11.1 already moved the period past this invoice, it was paid, and an out-of-order failure must not undo that.
- **The atomic filter is the real guard; the early checks only log a clearer reason.** Mutation proved it (Verification), and two race tests now pin the filter by handing the service an out-of-date read.
- **Recovery is 11.1's renewal,** which now also clears `pastDueSince` and `graceEndsAt` in the same write, so the banner goes.
- **The gate closes on the grace boundary itself**, even before the sweep stores `expired` — the same pattern 7.1 uses for cancelled-past-period.
- **The sweep cancels at Stripe FIRST** (developer's call; 10.1's rule), then one conditional update → `expired`, `sessionsRemaining: 0`. Stripe keeps retrying a card for weeks by default, so without the cancel a late retry could charge someone already locked out.
  - **Paid at Stripe → never expired:** 11.1's webhook is on its way. Already ended at Stripe → no second cancel. A Stripe failure changes nothing and the next sweep retries.
  - The update matches only a row still past-due and past its grace, so a recovery at the same moment wins.
  - `graceEndsAt` is **kept** on expiry, as the record of why it ended.
  - Every 5 minutes in the web server, like 9.6; `npm run lifecycle:run` by hand. Two instances are safe.
- **`EXPIRED_SET` replaces `endCycle`**: the status and "0 sessions" move in one write. 11.3/11.4 reuse it.
- **"Update your card" is Stripe's Customer Portal** (developer's call; 11.5 reuses it). The customer id is read from the token's own subscription and never reaches the browser. Only an https `*.stripe.com` URL is handed back; anything else is a 502. Behind the gate, so past-due reaches it and ended does not.
- **The email links to the portal, not to Stripe:** a Stripe portal link expires long before an email is read.
- **The banner states a DATE, never a countdown** — a draining bar is an urgency tactic for an anxious reader. On every portal screen until fixed.
  - A drawn card-with-renew-arrow in a soft clay disc; the date in full ink; one action.
  - The button stays full strength while "Opening Stripe…" (an `aria-busy` override on the shared Button's fade).
  - A failed press is the only thing announced (`role="alert"`), using the server's own safe words.
  - The title is a paragraph, not a heading, because it sits above each screen's own h1.

**Verification**
- Tests: **1681 passing across 58 suites** (1644 before, 38 new, 1 `endCycle` test removed). The full run gave 1679 before the two race tests were added; that suite then passed 38/38 on its own. Server lint clean; client `oxlint` 0 findings on touched files; build passes; generated CSS confirmed (`aria-busy` override, shadow, disc).
- **Mutation-checked 16 times.** Caught: the filter alone, active guard (1) · the filter alone, stale guard (1) · zero-day grace (4) · the gate ignoring the deadline (3) · the sweep skipping Stripe (4) · ignoring paid-at-Stripe (1) · the sweep losing its status guard (1) · recovery leaving the grace set (2) · the portal URL check (1) · the portal leaking the customer id (1) · the ledger recording €0 (1) · a second email (4) · both active checks together (5) · both stale checks together (2).
- **MISSED, by design: removing only an early check breaks nothing,** because the atomic filter holds on its own. This was first seen as two misses with the filter itself untested — a false-confidence gap caught before it shipped. The two race tests above close it.
- **The real 6.3 bug:** a failed invoice has `amount_paid: 0`, not null, so `??` never reached `amount_due`, and the ledger recorded a failed €200 as €0. It now reads `amount_due` for failures.
- Contrast: **11 pairs computed, 0 failures.** Tightest: the clay title and error line 4.90:1; the icon on its disc 4.16:1 (a graphic, 3:1 floor). The caption was moved from `ink/60` (4.58:1) to `ink/70` (6.39:1) rather than sitting on the line. `CardRenewIcon` bounds-checked by hand: x 2.0–22.25, y 4.5–21.75. Detector `[]` — degraded, as always.

**Manual steps for the developer**
1. **Restart the API server; hard-refresh the client.** You should see `Subscription lifecycle sweep scheduled.`
2. **Stripe dashboard (test mode), once:**
   - Settings → Billing → Customer portal: turn it on and allow **updating the payment method**. Without this, "Update your card" returns an error.
   - Billing → Revenue recovery → Retries: keep the retries **inside 3 days**, so Stripe's last try comes before our grace ends.
3. **The brief's verify step,** with `stripe listen` running and a test-clock subscription (as in 11.1). It writes to your database, so use a test client.
   - Attach the failing test card `4000 0000 0000 0341` to the customer and advance the clock one month.
   - The client should be past due, get one email, and see the banner with the date on every screen.
   - Then "Update your card" opens Stripe. Add `4242 4242 4242 4242`, and Stripe retries (or pay the invoice from the dashboard). The banner clears and the status is back to active.
4. **Expiry by hand:** in Atlas, set a test client's `graceEndsAt` to the past, then run `npm run lifecycle:run`. It cancels the test subscription at Stripe and marks it expired.

**Carried forward**
- **11.3 / 11.4:** cancelled → expired joins `runLifecycleSweep`, reusing `EXPIRED_SET`; `customer.subscription.deleted` (fired by the sweep's cancel) is still a stub.
- **11.5** reuses `POST /client/billing/portal` on the account page.
- **12.5:** the Customer Portal and retry settings above must be repeated on Asad's live Stripe account.
- **Pre-launch blockers — unchanged at 13.** No placeholder content.

**Not done (by design):** no countdown or progress bar · no email when the grace ends · no Stripe-sent dunning emails · no admin override (11.3 onwards) · no re-subscribe (11.4).

---

## Chunk 11.3 — Cancellation

**Status:** Complete. Nothing skipped. Not seen rendered; see Manual steps. **Atlas and real Stripe untouched**; tests fake Stripe's API and email, with real signatures. Impeccable loaded before the UI. **A real defect in shipped 10.1 code was found and fixed** (the admin's past-due cancel, below).

**Built**
- server new: `services/clientSubscription.service.js` · `services/email/templates/subscriptionChange.js` · `routes/subscriptionCancellation.test.js` (37). Routes: `POST /client/subscription/cancel`, `POST /client/subscription/reactivate` (both gated).
- server edits: `subscriptionLifecycle.service.js` (the shared `cancelSubscription`, the cancelled → expired sweep, both Stripe handlers) · `requireActiveSubscription.js` (`accessEndsAt`) · `adminClients.service.js` (onto the shared path) · `stripeWebhook.service.js` (the last two stubs replaced) · `clientPortal.service.js` + `constants/clientPortal.js` (`accessEndsAt`, `cancelledBy` on `/me`) · `models/Subscription.js` (index) · `constants/subscriptionLifecycle.js` · controller, routes, email service, subjects, mock, script · `adminClients.test.js`.
- client: new `components/portal/client/account/SubscriptionControls.jsx` · `lib/client/accessDates.js` · `CardStopIcon`. Edits: `Account.jsx`, `AccessNotice.jsx` + `ClientPortalShell.jsx` (the ending banner reads the server's end), `clientPortalApi.js`, `clientPortalContent.js`.
- Packages / env vars: none.

**Key decisions**
- **ONE cancel path for client and admin** (`cancelSubscription`). Stripe first, database second; a Stripe failure writes nothing.
  - **Active:** Stripe stops at the period end, and access runs to it.
  - **Past due:** Stripe stops **at once**, and access runs to the grace end already promised (developer's call).
- **The 10.1 defect:** the admin's cancel used "at period end" for past-due too. The gate then cut the client off at once while Stripe kept retrying their card, so a successful retry charged €200 to someone locked out. It now goes through the shared path, and a test proves `cancel` is called, not `update`.
- **`accessEndsAt` is the one place the end is worked out** (the paid period, or the later grace end). The gate, the sweep, `/me`, the banner and the emails all read it. **Never mid-paid-period.**
- **Sessions stay usable until the end**, and drop to 0 in the same write that expires the plan (`EXPIRED_SET`).
- **Reactivation: only the client's own cancellation, and only before the end** (developer's call). An admin cancellation may be a refund dispute. A past-due one has already ended at Stripe. Each check is repeated in the atomic filter.
- **The sweep expires a cancelled plan on its end with no Stripe call:** Stripe already stops at the period end. A reactivation racing it wins.
- **`customer.subscription.deleted`:** paid time left → `cancelled` with access kept; none → `expired`. The filter is pinned to the status and period it read, so a renewal landing meanwhile wins.
- **`customer.subscription.updated` re-reads Stripe's LIVE state**, never the payload, so a late event cannot flip us the wrong way. A cancel made in Stripe's own screens leaves `cancelledBy` unset, so it cannot be undone from our page.
- **The UI has no retention pressure.** The way out is an ordinary control, never hidden. The confirmation is inline, not a modal, and draws what happens as three stations (Today · Until [date, time] · After that). Its two buttons are the same size and both filled. No discount, no "are you sure", no loss framing.
- **The cancelled state is a drawn horizon from today to the end:** a date, never a count of days, because a countdown is an urgency tactic.
- **Focus is handled:** it moves into the panel's heading on open (reduced motion too) and back to the trigger on close.

**Verification**
- Tests: **1718 passing across 59 suites** (1681 before, 37 new). Server lint clean; client `oxlint` 0 findings on touched files; build passes; generated CSS confirmed for every new utility (the path lines, discs, horizon, edges).
- **Mutation-checked 14 times, every one caught:** past-due stopped at period end (2) · the cancel filter losing its status (1) · the end ignoring the grace (4) · the gate cutting a cancelled plan at once (12) · the sweep ignoring the period end (1) · the sweep ignoring the grace (1) · the sweep update losing its boundary (1) · reactivating an admin cancellation (1) · the reactivation filter losing its conditions (1) · `deleted` cutting off mid-period (2) · `deleted` not pinned to what it read (1) · `updated` trusting the payload (3) · a second press erroring (2) · expiry keeping the sessions (2).
- **Each atomic filter has its own race test**, the lesson from 11.2: two cancels at once, a sweep racing a reactivation, a reactivation racing an expiry, and a `deleted` racing a renewal.
- Contrast: **18 pairs computed, 0 failures.** Tightest: the trigger's edge `ink/50` on paper 3.44:1, the clay icon on its disc 4.30:1 (a graphic, 3:1 floor), the station icons 4.70:1. The sage path lines are decorative. `CardStopIcon` bounds-checked by hand (x 2.0–22.25, y 4.5–21.75). Detector `[]` — degraded, as always.

**Manual steps for the developer**
1. **Restart the API server; hard-refresh the client.** No packages, no env vars.
2. **Stripe dashboard (test mode) → Customer portal:** turn **off** "Cancel subscriptions" (developer's call), so every cancel goes through our page and our email.
3. **The brief's verify step** (writes to your database, so use a test client). Account → **Cancel subscription** → read the three stations → **Cancel subscription**. The page shows the end date, the "ending" banner appears on every screen, the portal still works, and Stripe shows "Cancels at period end".
4. Press **Reactivate**: the plan is active again and Stripe shows no pending cancellation.
5. **End by hand:** set that test row's `currentPeriodEnd` to the past in Atlas and run `npm run lifecycle:run`. It is expired and the portal closes.
6. At 360px the stations stack on a vertical path; from `sm` up they sit across one line. With reduced motion on, the panel appears without sliding.

**Carried forward**
- **11.4:** the re-subscribe screen for `expired`, reusing `EXPIRED_SET` and `accessEndsAt`.
- **11.5:** the card update on the Account page (the endpoint exists since 11.2); the build note now names only that.
- **Therapist side:** sessions a therapist scheduled after a client's end date are not flagged. Worth deciding in 11.4 or 12.
- **Pre-launch blockers — unchanged at 13.** No placeholder content.

**Not done (by design):** no retention offer, survey or "reason for leaving" · no countdown · no reactivation of an admin or past-due cancellation · no immediate-expiry option for the client · no refund logic (§12).

---

## Chunk 11.4 — Expired state and re-subscribe

**Status:** Complete. Nothing skipped. Not seen rendered; see Manual steps. **Atlas and real Stripe untouched**; tests fake Stripe's API and email, with real signatures. Impeccable loaded before the UI. **A flaky test from 6.2 was found and fixed** (Verification).

**Built**
- server new: `services/resubscription.service.js` · `utils/stripeUrl.js` (shared with 11.2's portal) · `routes/resubscribe.test.js` (21). Route: `POST /client/subscription/resubscribe` (above the gate).
- server edits: `checkout.service.js` (`subscriptionLineItem`, now shared) · `clientOnboarding.service.js` (`resolvePeriodEnd` exported; the month fallback clamped) · `stripeWebhook.service.js` (the re-subscribe branch) · `clientPortal.service.js` (`kept`, `canResubscribe` on `/me`) · `billingPortal.service.js` · `constants/subscriptionLifecycle.js` · controller, routes, the welcome-back email, subjects, mock · `checkout.test.js`.
- client: rebuilt `components/portal/client/SubscriptionEnded.jsx` · new `WelcomingBack.jsx` · `ClientPortalShell.jsx` (`?welcome_back=1`) · `clientPortalApi.js` · `clientPortalContent.js` (`ENDED`, `WELCOME_BACK`).
- Packages / env vars: none.

**Key decisions**
- **THE SAME BOOKING, A NEW SUBSCRIPTION ROW** (approved with the developer's mentor, 2026-09-25). The brief said to reuse the old subscription row. But every message, journal entry, worksheet, session and note hangs off the booking, so all of it resumes either way; a new row also keeps each Stripe subscription, its ledger rows and its one review (10.3) separate, and matches 6.1's one-active-per-booking index.
- **No questionnaire.** The page reuses the booking, the therapist and the client's Stripe customer. It uses the same price line as a first checkout (one source) and states §13's renewal terms on Stripe's page. **Only our own ids go to Stripe.**
- **Offered only once access has ENDED and the therapist is still active,** decided on the server (`canResubscribe` on `/me`), so the screen never shows a button that would fail (decision 3).
- **Two tabs, one page:** an open re-subscribe page for this booking is handed back rather than a second one made.
- **The golden rule holds:** the portal returns only on the webhook. It is marked by metadata we wrote and Stripe signed, and it goes to its own handler ahead of the new-client path.
  - **Replays** are recognised before anything is written.
  - **Two deliveries at once:** the one-active-per-booking index is the backstop.
  - **A second payment** (including one while a cancelled plan still runs, which the index does not cover) is cancelled at Stripe at once and logged `REFUND BY HAND`.
  - **A therapist who left while the page was open:** same.
  - **A booking that is not this client's** fails loudly (500), so it shows in Stripe.
- **`/me` reports what is kept as COUNTS ONLY** (messages, journal entries, worksheets, sessions held) for an ended client, never a word of content (decision 2). A test asserts no text leaks.
- **The screen:**
  - The therapist's portrait leads, with *"Your subscription has ended. Reactivate to continue with Dr. [Name]."*
  - The kept counts are drawn as four tiles on hairline seams.
  - The ink renewal panel is reused verbatim from checkout (6.5).
  - One gold button, with the caption "Nothing is charged until you confirm on Stripe".
  - A calm contact line instead when the therapist is gone.
  - No guilt, no urgency, no countdown.
- **Back from Stripe:** "Welcoming you back" with a breathing mark, asking `/me` every 2s. The portal appears on its own once the webhook lands, and the address is tidied. After ~45s it says plainly that it's taking longer, with "Check again" and a contact line. Never a false "done".
- **The 6.4 month fallback was unclamped** (31 January → 3 March); it now uses 11.1's clamped `addOneMonth`.

**Verification**
- Tests: **1739 passing across 60 suites** (1718 before, 21 new). Server lint clean; client `oxlint` 0 findings on touched files; build passes; generated CSS confirmed for the new utilities.
- **Mutation-checked 12 times, every one caught:** re-subscribe while still subscribed (2) · a page for a departed therapist (1) · open page not reused (1) · extra data sent to Stripe (1) · a webhook forgetting it had processed an event (1) · the second-payment guard (1) · the booking not checked against the client (1) · the webhook ignoring a departed therapist (1) · `/me` offering the button regardless (1) · `/me` counting for a live client (1) · counting sessions never held (1) · the new row starting without sessions (1).
- **Two tests tightened before the run, because of what they would have missed:**
  - The replay test did not check that Stripe was left alone. Without the "already processed" check, a replay would have **cancelled the client's real, paid subscription at Stripe** and still passed.
  - Nothing covered a second payment while a cancelled plan still runs, which only the early check guards.
- **A flaky 6.2 test, found by the full run:** it searched the whole Stripe request for "4242" to prove no card number leaked, and failed when `expires_at` read `1790424269`. It now looks for the whole number and the `cvc` key.
- Contrast: **12 pairs, 0 failures** — every pair reuses a value already measured (kept disc 4.70:1, labels 6.73:1, error on mist 4.93:1, the gold button's `ink/50` edge 3.08:1). Detector `[]` — degraded, as always.

**Manual steps for the developer**
1. **Restart the API server; hard-refresh the client.** No packages, no env vars.
2. **The brief's verify step** (writes to your database, so use a TEST client). Expire one: set its subscription to `expired`, `currentPeriodEnd` in the past. Sign in: the re-subscribe screen shows their therapist and the kept counts.
3. Press **Reactivate subscription** with `stripe listen` running. Pay with `4242 4242 4242 4242`. You return to "Welcoming you back", then the portal opens by itself. Open Chat: the history is all there.
4. In Atlas: the same booking, **two** subscription rows (the old one expired, the new one active with 4 sessions).
5. Deactivate that client's therapist and sign in again as an expired client: no button, the contact line instead. Reactivate the therapist afterwards.

**Carried forward**
- **Therapist side:** a returning client is not announced on the bell (10.4 has no "returning" type). Their row simply shows in the list again. Worth deciding with 11.6 or 12.
- **Refunds are by hand** for the two "REFUND BY HAND" cases (§12, the Stripe dashboard). Worth telling Asad the log line exists.
- **11.5:** the card update on Account. **11.6:** renewal reminders and the end-of-subscription review.
- **Pre-launch blockers — unchanged at 13.** No placeholder content.

**Not done (by design):** no new questionnaire · no therapist reassignment (v2) · no deletion of anything on expiry · no countdown or "we miss you" · no refund logic.

---

## Chunk 11.5 — Subscription & Account page

**Status:** Complete. Nothing skipped. **The Account page was rebuilt, not extended** — the developer found it basic. Not seen rendered; see Manual steps. **Atlas and real Stripe untouched**; every test ran in memory. Impeccable loaded before the UI.

**Built**
- server new: `services/billingHistory.service.js` · `routes/billingHistory.test.js` (20). Route: `GET /client/billing/history?page=` (gated).
- server edits: `models/PaymentEvent.js` (`platformSubscriptionId`, spec addition, indexed) · `stripeWebhook.service.js` (recorded on every event shape) · `validation/clientPortal.schema.js` · `constants/subscriptionLifecycle.js` · controller, routes.
- client new: `components/portal/client/account/{PlanHero,AccountCards,BillingHistory}.jsx` · `ReceiptIcon`, `TickIcon`, `LockIcon`. Rewritten: `pages/portal/client/Account.jsx`. Edits: `SubscriptionControls.jsx` (the repeated date removed), `clientPortalContent.js` (`ACCOUNT`; the old non-verbatim `RENEWAL_NOTICE` removed), `clientPortalApi.js`.
- Packages / env vars: none.

**Key decisions**
- **§13's portal notice is quoted exactly and lives in the hero** — *"Next payment: [date]. To stop it, cancel before this date."* — at body size, whenever a renewal is due. It is the second of the three required transparency points, so it is never collapsed or put in a submenu. The old constant carried different words and is gone, so nobody reuses the wrong sentence.
- **The plan hero is ink,** the only surface where gold is legible (11.08:1):
  - a status mark and word (Active · Payment needed · Ending);
  - the next payment date large, with €200;
  - sessions left as four gold marks with "Unused sessions do not roll over".
  - **Past due** shows the grace date and **Update your card**. **Ending** shows the end date and time and "No further payments".
- **Billing history comes from the ledger, one row per invoice** (developer's call). Stripe's retries group into one row ("Paid after a retry"), not three alarming lines. Status is a drawn mark AND a word, never colour alone.
- **Spec addition: every new ledger row stores its Stripe subscription id,** read before the insert. The first payment is logged before the account exists, so this is the only link that finds it. Older rows are still found through the previous links. **The ledger stays append-only.**
- **Only derived fields leave the server:** date, amount, currency, status, period and our own row id. Never the payload, a Stripe id, or anything about the card, which the raw payload does hold (`last4`); a test asserts none of it appears.
- **Details are read-only**, with *"To change any of these, write to us"* (developer's call). They are the intake record the therapist relies on.
- **Change password sends the standard reset link to the account's own email** (developer's call) — the same `forgot-password` path as the sign-in page.
- **Payment method** opens Stripe's portal (the 11.2 endpoint), where receipts and invoices also live.
- **The cancelled state no longer shows the end date twice:** the hero owns it; the 11.3 panel keeps its drawn horizon and Reactivate.

**Verification**
- Tests: **1759 passing across 61 suites** (1739 before, 20 new). Server lint clean; client `oxlint` 0 findings on touched files; build passes; generated CSS confirmed for all new utilities.
- **Mutation-checked 9 times, every one caught:** reading another client's subscriptions (1) · widening the client link to anyone (1) · retries not grouped (2) · a retried payment read as failed (1) · non-payment events listed (1) · Stripe's invoice id leaking as the row id (1) · no paging (1) · the ledger forgetting the Stripe subscription (5) · the checkout shape not read (1).
- Contrast: **17 pairs computed, 0 failures.** Tightest: the clay "Payment needed" dot on ink 3.29:1 (a graphic beside its word, 3:1 floor), the empty session ring 4.48:1, the ghost button edge 3.44:1. The thread and skeleton are decorative. 3 new icons bounds-checked by hand. Detector `[]` — degraded, as always.

**Manual steps for the developer**
1. **Restart the API server; hard-refresh the client.** No packages, no env vars.
2. **The brief's verify step — every state** (writes to your database, so use a TEST client):
   - **Active:** open Account. The ink hero shows the next payment large and the exact §13 sentence; four gold marks show sessions left.
   - **Past due:** set the subscription `past_due` with `graceEndsAt` a day ahead. The hero reads "Payment needed" with the grace date and **Update your card**; the banner shows too.
   - **Cancelled:** press Cancel (11.3). The hero reads "Your plan ends" with date and time; Reactivate sits below.
3. **Billing history in development:** payments logged before this chunk may be missing, because they do not carry the new field. New payments (a test-clock renewal, 11.1) appear at once. Production starts clean.
4. Press **Change password**: a reset email to the account address (blocker 7 applies until the domain is verified).
5. At 360px the two small cards stack, the hero's session marks drop below the date, and nothing scrolls sideways.

**Carried forward**
- **11.6:** renewal reminders (the third transparency point) and the end-of-subscription review.
- `BuildNote` (7.1) is now unused anywhere; it can go in a cleanup.
- **Pre-launch blockers — unchanged at 13.** No placeholder content.

**Not done (by design):** no self-service edits to intake details · no card fields in our UI (Stripe holds the card) · no receipt downloads of our own (Stripe's portal has them) · no countdown.

---

## Chunk 11.6 — Renewal reminders and end-of-subscription review

**Status:** Complete. Nothing skipped. **SLICE 11 IS FINISHED.** Not seen rendered; see Manual steps. **Atlas and Resend untouched**; every test ran in memory with email faked. Impeccable loaded before the form change.

**Built**
- server new: `services/renewalReminders.service.js` · `routes/renewalReminders.test.js` (20). Route: `POST /client/reviews/decline` (above the gate, beside the rating).
- server edits: `models/Subscription.js` (`renewalReminderFor`, `reviewDeclinedAt` — spec additions; `{status, nextBillingDate}` index) · `subscriptionLifecycle.service.js` + `scripts/runLifecycleSweep.js` (the reminder joins the sweep) · `reviewSubmission.service.js` (`declineReview`, the `declined` state) · `constants/{reviews,subscriptionLifecycle,email}.js` · the renewal-reminder email, sender, mock · controller, routes.
- client: `RatingForm.jsx` ("No thanks") · `reviewsApi.js` · `reviewContent.js`.
- Packages / env vars: none.

**Key decisions**
- **The reminder is §13's third transparency point, and its first sentence is §13's, verbatim:** *"Your subscription renews on [date]. No action needed to continue; cancel anytime before then."* The date is in the client's own zone (labelled UTC when none is saved), with the amount and a link to Account. No card details, no pressure.
- **From 3 days before billing** (developer's call), with a late edge of 6 hours before the charge, so a sweep missed during a restart still lands but nobody is emailed hours before being charged.
- **Active plans only.** A cancelled plan will not renew; a past-due one already has its own email (11.2).
- **One per cycle, never twice.** The reminder is claimed in one atomic update keyed to the exact billing date, before anything is sent. A renewal moves the date, which starts the next cycle's reminder.
- **A failed send is retried** (developer's call): the claim is released if Resend refuses, and the next sweep sends it. This differs from 9.6's session reminders on purpose, because this email is a legal protection for the client. The cost is a rare double email if Resend fails after actually sending.
- **The exit review is an invitation, never a wall** (developer's decision). The developer first considered making the stars compulsory to proceed; that would be a wall, and the brief rules it out. So:
  - stars are required **to submit** (1–5) and words are optional, as in 10.3;
  - nothing is gated behind it — the ended screen and Account work whether they rate, decline or ignore it;
  - **"No thanks"** sits beside Send as quiet text, and puts the invitation away for good for that subscription (`reviewDeclinedAt`). No reason is asked for.
- **After "No thanks"** the card goes and one quiet line stays ("Understood. We will not ask again."), which also takes the keyboard focus instead of dropping it to the top of the page.
- **No email asking for a review.** At the end of therapy that would be pressure.
- **Reviews stay admin-only** — 10.3's walker still proves no client, therapist or public route can reach the read path.

**Verification**
- Tests: **1779 passing across 62 suites** (1759 before, 20 new). Server lint clean; client `oxlint` 0 findings on touched files; build passes.
- **Mutation-checked 8 times, every one caught:** the claim not checking "already reminded" (1) · the claim not checking the plan is still active (1) · a failed send never retried (1) · reminders a month early (1) · reminders hours before the charge (1) · "No thanks" allowed before the plan ends (1) · a second "No thanks" overwriting the first (1) · the form returning after "No thanks" (1).
- **Each atomic claim has its own race test:** three sweeps at once send one email, and a plan cancelled between the sweep's read and its claim is never reminded.
- Contrast: 3 new pairs, all reusing measured values ("No thanks" `ink/70` 6.73:1, its underline `ink/60` 4.74:1, the ink focus ring). Detector `[]` — degraded, as always.

**Manual steps for the developer**
1. **Restart the API server; hard-refresh the client.** No packages, no env vars.
2. **The brief's verify step — the reminder** (writes to your database and sends real email if `RESEND_API_KEY` is set, so use a TEST client). Set its active subscription's `nextBillingDate` two days ahead, run `npm run lifecycle:run` and check the inbox. Run it again: nothing more is sent.
3. **The review.** Expire (or cancel) a test subscription and sign in: the stars appear with **No thanks** beside Send. Press it: the card goes, and it does not come back after a reload. On another test client, rate with stars only.
4. **Stripe dashboard → Settings → Billing → Customer emails:** turn off Stripe's own "upcoming renewal" email, so clients do not get two.
5. Blocker 7 still applies: until the domain is verified in Resend, only the account owner receives these.

**Carried forward**
- **Slice 11 is complete.** Before launch, repeat on Asad's live Stripe account: the Customer Portal (card updates on, cancel off), the retry schedule inside 3 days, and Stripe's renewal emails off.
- **Asad to confirm:** the 3-rating ranking minimum and the form's wording (10.3), the 3-day lead, and that no review email is sent.
- **Pre-launch blockers — unchanged at 13.** No placeholder content.

**Not done (by design):** no review email · no reason asked on "No thanks" · no gate on leaving · no reviews shown anywhere but the admin portal.

---

## Pre-Launch Blockers

**The list stands at 15.** The count is unchanged since chunk 5.5; **item 12 was rewritten in
10.5**, when admin 2FA was deferred rather than built. Every one of these must be resolved
or consciously waived before the platform takes a real client.

1. **`/styleguide` must be deleted** — development only. Also carries the DataTable demo rows.
2. **LinkedIn URL in `lib/siteConfig.js` is a placeholder** — swap for the real profile.
3. **Legal pages need real content** — Privacy, Terms, Refund. The old site's text contradicts this build (§21).
4. **Favicon still missing** — client to supply. The brain mark does not survive 16px; a simplified vector is needed.
5. **Footer tagline copy is mine, not the client's** — one sentence in `Footer.jsx` for Asad to approve or replace.
6. **Delete `server/routes/dev.routes.js` and its mount** — guard-testing routes. Now also carries `GET /api/v1/dev/client-gated` (7.1).
7. **Verify `castofmind.com` in Resend**, then change `EMAIL_FROM`. Until this is done **no email on the platform can reach anyone but the Resend account owner** — welcome emails, credentials, resets, application notices. Also blocks the admin 2FA email, if blocker 12 is picked up (10.5 was deferred).
8. **Create `support@castofmind.com`** and forward it — printed in every email footer and on `/contact`, and it does not exist. Also supply the misconduct escalation phone number, or confirm email-only is the intended launch state.
9. **`client/src/assets/hero.png` has unknown provenance** — referenced by nothing. Delete it or record where it came from.
10. **Replace or remove everything in `client/src/data/homePlaceholders.js`** — invented testimonials and figures attached to photographs of real, identifiable people.
11. **Replace or remove everything in `client/src/data/aboutPlaceholders.js`** — invented team, including two entries carrying clinical credentials.
12. **Admin two-factor authentication does not exist — and chunk 10.5 was DEFERRED, not delivered** (developer's decision, 2026-09-24). It was to be email OTP via Resend; it is now deferred to a pre-launch security review, on the grounds that Asad has not asked for it and the admin already has a strong password and a 30-minute idle timeout. **This blocker therefore stays open and needs the client's explicit confirmation before launch.** What is unchanged: §18 calls 2FA effectively non-negotiable for a platform holding mental health data, and per §11 the admin mailbox can reset the admin password — so **the admin's email inbox is currently the master key to every record on the platform**. The idle timeout limits an abandoned session; it does nothing about a stolen password or a compromised inbox. See the chunk 10.5 entry above.
13. **Remove the seeded therapists before launch** — `npm run seed:therapists:remove`. Ten fake practitioners with placeholder photos and invented credentials sit in the development database. The script cannot run in production, but that guard does not protect a production database populated from a development one. A client choosing a therapist who does not exist, and paying €200 for it, is the failure this line exists to prevent.
14. **Configure Asad's live Stripe Dashboard** — three required settings from Slice 11 must be configured in live mode before taking real money:
    - **Customer Portal** (*Settings → Billing → Customer portal*): turn **ON** "Allow customers to update payment methods" (so the card-update button works without errors) and turn **OFF** "Allow customers to cancel subscriptions" (cancellation is handled inside our own quiet portal flow).
    - **Retry Schedule** (*Settings → Billing → Revenue recovery*): set failed payment retries to stop **within 3 days** (matches our 3-day grace period, preventing Stripe from charging someone weeks after they were locked out).
    - **Customer Emails** (*Settings → Billing → Customer emails*): turn **OFF** "Send upcoming renewal emails" (our server sends the custom-branded reminder email from Chunk 11.6; leaving Stripe's on would send duplicate emails).
15. **Remove `ALLOW_TEST_STRIPE` before real production launch** — staging uses `ALLOW_TEST_STRIPE=true` on Render to allow Asad to test checkout with fake card 4242. For final launch with Asad's live Stripe keys, ensure `ALLOW_TEST_STRIPE` is removed from production environment variables so the server strictly guards against accidental test keys.

                                                                             

---
