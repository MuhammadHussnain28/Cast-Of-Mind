---
description: Backend conventions for the Cast of Mind Express API
globs: server/**
---

# Backend Rules

Applies to everything under `/server`. Full specifications: `docs/02-database-schema.md` and `docs/03-core-systems.md`.

---

## Structure

```
/routes        route definitions only — no logic
/controllers   request/response handling, validation
/services      business logic (this is where real work lives)
/models        Mongoose schemas
/middleware    auth, validation, rate limiting, errors
/utils         shared helpers
/config        env, database, third-party clients
```

Controllers stay thin. Business logic belongs in services. A controller that queries the database directly is a smell.

---

## API Conventions

- All routes under `/api/v1`
- Plural resource names: `/api/v1/therapists`, not `/api/v1/therapist`
- Standard status codes: 200, 201, 400, 401, 403, 404, 409, 422, 429, 500
- Consistent error shape:

```js
{ error: { message: "Human-readable message", code: "MACHINE_CODE" } }
```

- Success responses return the resource directly or `{ data, meta }` for paginated lists
- Every list endpoint paginates. No unbounded queries.

---

## Errors

- Throw `AppError` for known, safe errors. Unknown errors are caught by the global handler.
- Wrap async controllers in the async handler — no bare try/catch repetition.
- **Never leak** stack traces, internal paths, or database details in production responses.
- Log the full error server-side; return the safe message to the client.

---

## Security

Non-negotiable on every endpoint:

- **Validate and sanitise all input.** Never trust the client — including IDs. Verify ownership server-side rather than trusting a `bookingId` in the request.
- **Role checks server-side on every protected route.** UI hiding is not access control.
- **Rate limit** all auth, contact, upload, and public endpoints.
- Protect against NoSQL injection and XSS.
- Security headers via helmet. CORS locked to known origins.
- No secrets in code — environment variables only. Fail loudly at startup if a required variable is missing.
- File uploads: restrict type, size, and verify content.

**Never log or send to Sentry:** message content, journal text, private notes, passwords, tokens, or payment details. This is a mental health platform — error reports must contain no therapy content.

---

## Auth

- bcrypt for passwords. Never store, log, or return readable passwords.
- Access token ~15 min, returned in the response body.
- Refresh token ~7 days, httpOnly + secure + sameSite cookie, **stored hashed** in the database so it can be revoked.
- Rotate the refresh token on every refresh.
- Login errors are **generic** — never reveal whether an email exists. Same message and timing for wrong password and unknown email.
- Password reset invalidates all existing refresh tokens for that user.
- Reset tokens: single-use, time-limited, stored hashed.

---

## Data Rules

Read `docs/02-database-schema.md` before touching any model.

**Critical — do not compromise:**

- **`privateNotes` must never reach a client-facing endpoint.** Not filtered in the response — never queried or joined there at all. Add a comment marking this constraint wherever the boundary exists.
- **`paymentEvents` is append-only.** Never update or delete. Guard this at the model level. It is the permanent audit trail for payment disputes.
- **Transactions are mandatory** where the spec requires them:
  - Client payment → `users` + `clientProfiles` + `bookings` + `subscriptions` (four documents)
  - Therapist approval → `users` + `therapistProfiles` (two documents)
  
  All succeed or none do. A half-created account is a serious failure state.

**Conventions:**

- **Store IDs only, never copied names.** Use `.populate()` to fetch current names at read time. A stored name copy goes stale when a user renames.
- Index every field used in a frequent query — especially `bookingId`, `clientId`, `therapistId`, `email`, `status`.
- Watch for N+1 queries on the therapist client list and chat loading.
- Validate enums and constrained arrays at the schema level (specialty tags 3–4, treatment orientations 1–5).

---

## Payments

- Account creation happens on **webhook confirmation only**. Never on browser redirect — browsers can drop, close early, or be manipulated.
- **Verify the webhook signature** using the raw request body before processing anything.
- **Idempotency:** check `platformEventId` against `paymentEvents` first. If already processed, return 200 and do nothing.
- Log every webhook to `paymentEvents` before acting on it.
- Return 200 quickly so the platform does not retry unnecessarily.
- Handle unknown event types gracefully.
- The application never touches raw card details.

---

## Time

- **Store UTC. Always.** Never store local times.
- Convert to the viewer's IANA timezone at display time.
- Use a standard library (`date-fns-tz`) — never manual offset arithmetic. Daylight saving will break hand-rolled maths.

---

## Real-Time

- Messages are **persisted to MongoDB first**, then emitted via Socket.io. The database is the record; sockets are delivery.
- Socket connections authenticate with the access token.
- Room per booking. Users join only rooms for bookings they belong to.
- If the recipient is offline the message simply waits — no blocking, no "unavailable" state.
- Chat must still work over REST if the socket connection fails.
- Clean up socket subscriptions when switching context, so messages never leak between conversations.

---

## Testing

Jest. **Required coverage:**

- Authentication — login, refresh, revocation, role guards, reset flow
- Payments — webhook verification, idempotency, the four-document transaction and its rollback
- Subscription lifecycle — renewal, failure, cancellation, expiry
- The `privateNotes` boundary — prove no client endpoint returns it

Elsewhere, use judgement. Test business logic in services, not framework plumbing.

Every test that involves a failure path should assert the **rollback**, not just the error.
