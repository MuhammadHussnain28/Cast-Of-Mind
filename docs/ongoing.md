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

- **The admin action log goes to the server log, not a 15th collection** — approved 2026-09-04. **Consequence: host logs rotate, so this is accountability, not a permanent audit trail.** A durable one is chunk 10.6. (4.1)
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

Five caught so far, and **every one passed while proving nothing**. Listed because the pattern repeats and mutation testing is what finds it.

1. **1.3** — the "deactivated user cannot refresh" test reused a rotated token, so the 401 proved revocation, not deactivation.
2. **4.2** — see the archive.
3. **7.2** — the unread badge test seeded only therapist messages, so "drops to zero" would have passed with the `senderId ≠ me` exclusion deleted.
4. **7.3** — "persists before it emits" passed against a deliberately inverted implementation, because the network round-trip let the save win. Rewritten to assert order. `Message.prototype.save` alone does not intercept `Model.create` in Mongoose 9 — **both must be patched.**
5. **7.6** — the linkifier's XSS tests: widening the regex so `javascript:` matched broke *nothing*, proving the allowlist rather than the pattern carries the security.

**Standing practice: every guard gets mutation-checked, and the number of tests it breaks is recorded.**

### Open items carried out of Slices 0–5

- **Relationship-status list wants Asad's confirmation** before launch. (5.1)
- **The compensation wording on `/join-as-therapist`** — "guaranteed weekly session rates" — wants Asad's confirmation, since "guaranteed" is a commitment. (3.3)
- **Chunk 12.3:** refresh-token reuse detection (1.3), server-side idle enforcement via `lastSeenAt` (4.1), the emailed password versus a set-password link (6.4).
- **`clientProfiles` has no timezone field**, so every portal uses the browser's zone. Settled pattern since 5.6.
- **Admin 2FA does not exist** — decided as email OTP via Resend, scheduled for chunk 10.5. Pre-launch blocker 12.
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
- **Handlers stubbed for slice 11:** `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.deleted`, `customer.subscription.updated`.

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
## Pre-Launch Blockers

**The list stands at 13.** Unchanged since chunk 5.5. Every one of these must be resolved
or consciously waived before the platform takes a real client.

1. **`/styleguide` must be deleted** — development only. Also carries the DataTable demo rows.
2. **LinkedIn URL in `lib/siteConfig.js` is a placeholder** — swap for the real profile.
3. **Legal pages need real content** — Privacy, Terms, Refund. The old site's text contradicts this build (§21).
4. **Favicon still missing** — client to supply. The brain mark does not survive 16px; a simplified vector is needed.
5. **Footer tagline copy is mine, not the client's** — one sentence in `Footer.jsx` for Asad to approve or replace.
6. **Delete `server/routes/dev.routes.js` and its mount** — guard-testing routes. Now also carries `GET /api/v1/dev/client-gated` (7.1).
7. **Verify `castofmind.com` in Resend**, then change `EMAIL_FROM`. Until this is done **no email on the platform can reach anyone but the Resend account owner** — welcome emails, credentials, resets, application notices. Also blocks the admin 2FA email at chunk 10.5.
8. **Create `support@castofmind.com`** and forward it — printed in every email footer and on `/contact`, and it does not exist. Also supply the misconduct escalation phone number, or confirm email-only is the intended launch state.
9. **`client/src/assets/hero.png` has unknown provenance** — referenced by nothing. Delete it or record where it came from.
10. **Replace or remove everything in `client/src/data/homePlaceholders.js`** — invented testimonials and figures attached to photographs of real, identifiable people.
11. **Replace or remove everything in `client/src/data/aboutPlaceholders.js`** — invented team, including two entries carrying clinical credentials.
12. **Admin two-factor authentication does not exist.** §18 calls it effectively non-negotiable for a platform holding mental health data; scheduled for **chunk 10.5**, decided as email OTP via Resend. Until then **the admin account is protected by a password alone**, and per §11 the admin mailbox can reset that password.
13. **Remove the seeded therapists before launch** — `npm run seed:therapists:remove`. Ten fake practitioners with placeholder photos and invented credentials sit in the development database. The script cannot run in production, but that guard does not protect a production database populated from a development one. A client choosing a therapist who does not exist, and paying €200 for it, is the failure this line exists to prevent.

---
