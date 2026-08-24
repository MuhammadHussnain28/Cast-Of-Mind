# Cast of Mind — Database Schema

> **Part of the Cast of Mind specification set.** The complete specification is
> `Cast_of_Mind_Master_Spec.md` — this file is an extract for focused reference during development.
> If this file and the master spec ever disagree, **the master spec wins** and this file must be re-synced.

**Source:** Master Spec v1.4 · **Sections included:** 10, Appendix

All 14 MongoDB collections with fields, creation triggers, relationships, and safety rules.

**Read this file when:** building any model, writing any query, or touching data structure. This is the most frequently needed reference in the project.

---

## 10. Database Schema

**14 collections.** MongoDB.

### Design Philosophy

- **`users` is separate from profiles** — it holds only identity and login data. This keeps login queries fast and simple, and cleanly separates "who you are" from "your detailed information," which differs substantially between roles.
- **Applications are separate from profiles** — an applicant is not a therapist. Merging them would pollute the therapist collection with rejected/pending records.
- **`bookings` is the central hub** — nearly everything (messages, worksheets, sessions, journals, notes, reviews, subscription) links to it. This is the "shared record both sides read from" that makes client-therapist synchronization work.
- **Store IDs only, not copied names.** Names are looked up live from `users` when displaying. This guarantees names are always current and avoids duplicated, potentially stale copies. (Denormalizing names was considered and rejected — at this scale the extra lookup is negligible and correctness is worth more.)

### 10.1 `users`

**Purpose:** Identity and login for every person on the platform, regardless of role.

**Created when:**
- Client: the moment payment succeeds (webhook confirmed)
- Therapist: the moment admin approves their application
- Admin: manually, once, at setup

**Not created again on subsequent logins** — login only looks up the existing record.

```
{
  _id: ObjectId,
  email: String (unique, indexed),
  passwordHash: String,
  refreshTokenHash: String,      // hashed, single active session — see note below
  refreshTokenExpiresAt: Date,
  role: "client" | "therapist" | "admin",
  status: "active" | "inactive",
  createdAt: Date,
  updatedAt: Date
}
```

> **Refresh token storage — confirmed by Asad:** the hashed refresh token lives directly on the `users` record (`refreshTokenHash` + `refreshTokenExpiresAt`), not in a separate `refreshTokens` collection. This means **one active refresh session per user at a time** — logging in on a new device overwrites the previous hash, silently ending the old session. Rotation on every refresh just overwrites these two fields; password reset or logout just clears them. This is simpler than a separate collection and sufficient for this platform's usage pattern, but it does mean multi-device concurrent sessions are not supported — a deliberate trade-off, not an oversight.

### 10.2 `clientProfiles`

**Purpose:** A client's questionnaire responses and personal details.

**Created when:** payment succeeds (same moment as their `users` record).

```
{
  _id: ObjectId,
  userId: ObjectId → users,
  type: "individual" | "couple",
  country: String,
  city: String,
  relationshipStatus: String,
  concernTags: [String],       // 3-4 from master list
  therapistGenderPreference: "male" | "female" | "no_preference",

  // Individual only:
  name: String,
  age: Number,
  gender: String,

  // Couple only:
  coupleData: {
    partner1: { name, age, gender },
    partner2: { name, age, gender }
  },

  createdAt: Date
}
```

### 10.3 `therapistProfiles`

**Purpose:** A working (approved) therapist's professional profile. This is what the matching engine reads and what clients see.

**Created when:** admin approves their application.

```
{
  _id: ObjectId,
  userId: ObjectId → users,

  // Identity
  title: String,                // Mr. / Ms. / Mrs. / Dr. / Prof.
  firstName: String,
  lastName: String,
  gender: String,               // used for gender-preference prioritisation
  dateOfBirth: Date,
  photoUrl: String,

  // Location
  streetAddress: String,
  city: String,
  stateProvince: String,
  zipPostal: String,
  country: String,
  timezone: String,             // IANA identifier, e.g. "Europe/London"

  // Professional
  therapistType: String,        // FREE TEXT, ~50 char limit
  credentialType: String,       // Diploma/Degree | Certificate | License
  credentialInitials: String,   // MS, M.Phil, PhD, MA...
  licenseNumber: String,
  taxpayerIdNumber: String,
  yearsExperience: Number,
  educationSummary: String,
  currentWorkSituation: String,
  languages: [String],

  // Practice
  specialtyTags: [String],      // 3-4 from fixed master list — DRIVES MATCHING
  treatmentOrientations: [String], // 1-5 from fixed 33-item list — DISPLAY ONLY
  bio: String,                  // 3-4 lines, shown to clients
  licensingStatus: String,
  disciplinaryActions: Boolean,
  disciplinaryDetails: String,  // only if disciplinaryActions is true

  // Compliance
  malpracticeInsurance: Boolean,
  insuranceDetails: String,

  // Availability (structured)
  workingHours: {
    monday:    { enabled: Boolean, start: String, end: String },
    tuesday:   { enabled: Boolean, start: String, end: String },
    wednesday: { enabled: Boolean, start: String, end: String },
    thursday:  { enabled: Boolean, start: String, end: String },
    friday:    { enabled: Boolean, start: String, end: String },
    saturday:  { enabled: Boolean, start: String, end: String },
    sunday:    { enabled: Boolean, start: String, end: String },
    note: String                // optional free-text for unusual availability
  },

  // Documents
  certificateUrl1: String,      // Cloudinary
  certificateUrl2: String,      // Cloudinary
  licenseDocUrl: String,        // Cloudinary

  status: "active" | "inactive",
  createdAt: Date
}
```

> **`therapistType` is deliberately free text** (with a character limit), not a dropdown — the client wants therapists to describe their role in their own words (e.g. "Clinical Psychologist & Trauma Specialist").

> **`workingHours` is deliberately structured** (day toggles + time ranges) rather than free text, because it is displayed to clients at the top of the chat. The optional `note` field ensures no therapist is prevented from expressing unusual availability.

### 10.4 `therapistApplications`

**Purpose:** A submitted 5-step application awaiting admin review. **The applicant is not yet a user and cannot log in.**

**Created when:** a prospective therapist submits the form on `/join-as-therapist`.

```
{
  _id: ObjectId,

  // Contains every field listed in Section 23 (33 fields across 5 steps),
  // mirroring the therapistProfiles structure above, plus:

  email: String,
  passwordHash: String,         // set by applicant, carried over on approval

  status: "pending" | "approved" | "rejected",
  submittedAt: Date,
  reviewedAt: Date
}
```

> **Field list finalized** — see [Section 23](#23-therapist-application-form--complete-field-specification) for the complete 33-field, 5-step specification including mandatory/optional status and input types.

> On approval, the data in this document is used to populate the new `users` and `therapistProfiles` records. The application document itself is retained permanently as a record.

### 10.5 `bookings`

**Purpose:** The link between one client and one therapist. **The central record both portals read from.**

**Created when:** payment succeeds.

```
{
  _id: ObjectId,
  clientId: ObjectId → users,
  therapistId: ObjectId → users,
  status: "active" | "ended",
  matchedAt: Date,
  endedAt: Date
}
```

**How synchronization works:** the client portal queries `bookings` where `clientId = me` to find their therapist. The therapist portal queries `bookings` where `therapistId = me` to build their client list. Both read the same record from opposite sides. There is no separate sync mechanism.

### 10.6 `subscriptions`

**Purpose:** The current billing and access state for a booking. Access to the portal is gated on this.

**Created when:** payment succeeds.

```
{
  _id: ObjectId,
  bookingId: ObjectId → bookings,
  clientId: ObjectId → users,
  status: "active" | "past_due" | "cancelled" | "expired",
  currency: String,
  amount: Number,
  startDate: Date,
  currentPeriodEnd: Date,
  nextBillingDate: Date,
  sessionsRemaining: Number,     // resets to 4 each cycle
  platformSubscriptionId: String, // Stripe/PayPal subscription ID
  cancelledAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 10.7 `messages`

**Purpose:** Individual chat messages.

**Created when:** anyone sends a message. The client's first message is the mandatory intake message.

```
{
  _id: ObjectId,
  bookingId: ObjectId → bookings,
  senderId: ObjectId → users,
  text: String,
  type: "text" | "system",       // "system" for auto session-scheduled messages
  read: Boolean,
  createdAt: Date
}
```

> Structured so `voice` / `attachment` types can be added later without a rebuild.

**Unread badges** = count of messages in a booking where `read: false` and `senderId ≠ me`.

### 10.8 `worksheets`

**Purpose:** The two-way worksheet flow.

**Created when:** therapist uploads and assigns one. Updated when the client returns the completed version.

```
{
  _id: ObjectId,
  bookingId: ObjectId → bookings,
  title: String,
  assignedFileUrl: String,       // Cloudinary — therapist's upload
  completedFileUrl: String,      // Cloudinary — client's submission
  status: "assigned" | "completed",
  assignedAt: Date,
  completedAt: Date
}
```

### 10.9 `journals`

**Purpose:** Client's journal entries. **Always visible to the assigned therapist.**

**Created when:** the client writes an entry.

```
{
  _id: ObjectId,
  bookingId: ObjectId → bookings,
  clientId: ObjectId → users,
  text: String,
  moodTag: String,               // optional
  createdAt: Date
}
```

### 10.10 `privateNotes`

**Purpose:** Therapist's confidential clinical notes about a client. **NEVER visible to the client.**

**Created when:** the therapist writes a note.

```
{
  _id: ObjectId,
  bookingId: ObjectId → bookings,
  therapistId: ObjectId → users,
  text: String,
  createdAt: Date,
  updatedAt: Date
}
```

> **This collection must never be queried by, joined into, or returned to any client-facing endpoint.** Its physical separation from `journals` is the safety guarantee.

### 10.11 `sessions`

**Purpose:** Scheduled Zoom sessions.

**Created when:** the therapist schedules a session.

```
{
  _id: ObjectId,
  bookingId: ObjectId → bookings,
  scheduledAt: Date,             // stored in UTC, displayed in local time per user
  zoomLink: String,
  note: String,
  status: "scheduled" | "completed" | "cancelled",
  createdAt: Date
}
```

### 10.12 `reviews`

**Purpose:** End-of-subscription rating. **Admin-only visibility.**

**Created when:** a subscription ends and the client submits their rating.

```
{
  _id: ObjectId,
  bookingId: ObjectId → bookings,
  clientId: ObjectId → users,
  therapistId: ObjectId → users,
  stars: Number,                 // MANDATORY, 1-5
  text: String,                  // OPTIONAL
  createdAt: Date
}
```

### 10.13 `notifications`

**Purpose:** Cross-portal alert feed powering the notification bell.

**Created when:** a notable event occurs (new message, new worksheet submission, new client matched).

```
{
  _id: ObjectId,
  userId: ObjectId → users,      // recipient
  type: "new_message" | "worksheet_submitted" | "new_client",
  bookingId: ObjectId → bookings,
  read: Boolean,
  createdAt: Date
}
```

### 10.14 `paymentEvents`

**Purpose:** **Immutable, append-only ledger of every payment webhook received.** This is the single source of truth for dispute resolution and payment auditing.

**Created when:** any webhook arrives from the payment platform.

```
{
  _id: ObjectId,
  subscriptionId: ObjectId → subscriptions,
  clientId: ObjectId → users,
  platform: "stripe" | "paypal",
  eventType: String,             // e.g. "payment_succeeded", "payment_failed"
  platformEventId: String,       // for idempotency — prevents double-processing
  amount: Number,
  currency: String,
  rawPayload: Object,            // full webhook body, stored verbatim
  receivedAt: Date
}
```

> **Never edit or delete these records.** The `subscriptions` collection holds *current state*; `paymentEvents` holds *permanent history*. Storing webhook data as a field on `subscriptions` was considered and rejected — it would be overwritten on each renewal, destroying exactly the audit trail that matters for disputes.

### Removed / Rejected Collections

| Collection | Why removed |
|---|---|
| `specialties` | The 30+ tags never change per Asad — they live as a code constant instead |
| `refreshTokens` | **Confirmed removed by Asad.** The hashed refresh token is stored directly on `users` (`refreshTokenHash` + `refreshTokenExpiresAt` — see §10.1) rather than in its own collection. |

### Multi-Document Transaction Requirement

When a client pays, **four documents are created together**: `users`, `clientProfiles`, `bookings`, `subscriptions`. These **must be wrapped in a MongoDB transaction** so all succeed or none do. A half-created account (e.g., a user with no subscription) is a serious failure state.

Similarly, therapist approval creates **two documents together**: `users` + `therapistProfiles`.

---

---

## Appendix: Complete Collection Reference

| # | Collection | Created when | Central purpose |
|---|---|---|---|
| 1 | `users` | Payment / approval / manual setup | Identity + login for all roles |
| 2 | `clientProfiles` | Payment succeeds | Questionnaire + personal data |
| 3 | `therapistProfiles` | Admin approves application | Working therapist's profile |
| 4 | `therapistApplications` | Form submitted | Pending intake for review |
| 5 | `bookings` | Payment succeeds | **Central client↔therapist link** |
| 6 | `subscriptions` | Payment succeeds | Current billing + access state |
| 7 | `messages` | Message sent | Chat + unread tracking |
| 8 | `worksheets` | Therapist assigns | Two-way worksheet flow |
| 9 | `journals` | Client writes entry | Client journal (therapist-visible) |
| 10 | `privateNotes` | Therapist writes note | **Therapist-only clinical notes** |
| 11 | `sessions` | Therapist schedules | Zoom session records |
| 12 | `reviews` | Subscription ends | Admin-only quality signal |
| 13 | `notifications` | Notable event occurs | Notification bell feed |
| 14 | `paymentEvents` | Webhook received | **Immutable payment ledger** |

---

*End of specification.*
