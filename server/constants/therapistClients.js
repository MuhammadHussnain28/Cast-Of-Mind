// The therapist's client list — master spec §8.1, inbox architecture §8.

/**
 * PAGE SIZE.
 *
 * A therapist's sidebar wants every client at once, and in practice that is
 * tens of rows rather than thousands. It still paginates, because "every list
 * endpoint paginates, no unbounded queries" is not a rule with a size
 * exemption — a therapist who somehow accumulated a thousand bookings would
 * otherwise take the aggregation and the rail down together.
 *
 * The sidebar loads one page and only asks for another if `nextCursor` comes
 * back, so on a real account this is one request.
 */
export const CLIENT_LIST_PAGE_SIZE = 50;
export const CLIENT_LIST_MAX_PAGE_SIZE = 100;

export const INVALID_CURSOR_MESSAGE = 'That page reference is not valid.';
export const INVALID_CURSOR_CODE = 'INVALID_CURSOR';

/**
 * WHAT A ROW SAYS HAPPENED LAST.
 *
 * A time, never a quotation. `message` means the timestamp is the newest
 * message in the conversation; `matched` means there are none and the row is
 * falling back to the day the booking was created.
 *
 * The browser needs the distinction because "4 minutes ago" and "matched 4
 * minutes ago" are different sentences, and rendering the second as the first
 * would tell a therapist somebody had written when nobody had.
 */
export const LAST_ACTIVITY_KIND = Object.freeze({
  MESSAGE: 'message',
  MATCHED: 'matched',
});

/**
 * WHAT A ROW DELIBERATELY DOES NOT CARRY.
 *
 * Recorded here rather than left to be inferred from the service, because each
 * one is a decision somebody could reasonably reverse by accident.
 *
 * - NO MESSAGE PREVIEW TEXT. An inbox invites a snippet under each name, and
 *   that snippet is therapy content sitting permanently in a sidebar — visible
 *   over a shoulder, in a screen share, in a screenshot. §8.1 asks for "last
 *   activity", which is a time, not a quotation. A test asserts no message text
 *   reaches this endpoint's response.
 *
 * - NO CLIENT USER ID. Same rule as the message payload (7.2): the booking id
 *   is the only handle the therapist's browser needs, and every per-client
 *   screen from 8.2 onwards is keyed on it. A key into `users` has no use
 *   there. A test asserts it appears nowhere.
 *
 * - NO QUESTIONNAIRE DATA AND NO CONCERN TAGS. That is the workspace (8.2),
 *   opened deliberately, not a list someone glances at.
 *
 * - NO SUBSCRIPTION OR BILLING STATE. It would put money on a clinical surface,
 *   and §13 already decided the therapist keeps the conversation either way.
 *
 * - NO `privateNotes`, WHICH IS NOT MERELY ABSENT BUT NEVER REACHED FOR. See
 *   the boundary comment in services/therapistClients.service.js.
 */
export const CLIENT_LIST_EXCLUDED = Object.freeze([
  'messageText',
  'clientUserId',
  'concernTags',
  'subscriptionStatus',
  'privateNotes',
]);

// ── One client's workspace — §8.2 to §8.6 ────────────────────────────────────

export const CLIENT_NOT_FOUND_MESSAGE = 'We could not find that client.';
export const CLIENT_NOT_FOUND_CODE = 'CLIENT_NOT_FOUND';

/**
 * ONE MESSAGE FOR EVERY REFUSAL, AND THAT IS THE POINT.
 *
 * A booking that does not exist, a malformed id, and ANOTHER THERAPIST'S client
 * all return this identical 404. A 403 on the third would confirm the id is
 * real, which is the whole of what an attacker needs to enumerate booking ids
 * by diffing responses. A test asserts the three bodies are byte-identical.
 *
 * Same rule the chat endpoints hold (7.2), reused rather than re-derived.
 */

/**
 * THE CLIENT FIELDS A THERAPIST MAY SEE — an allowlist, not a denylist.
 *
 * A denylist leaks whatever a later chunk adds to `clientProfiles` unless
 * whoever adds it remembers this file. Same discipline as CLIENT_THERAPIST_FIELDS
 * and PUBLIC_THERAPIST_FIELDS.
 *
 * DELIBERATELY ABSENT, each for its own reason:
 *
 * - The client's `users._id`. The booking id is the only handle any therapist
 *   screen needs (8.1's rule, held here too).
 * - THEIR EMAIL. §8 never lists it, every contact between these two people
 *   happens in the portal, and it is the one field that turns a clinical record
 *   into a mailing list.
 * - Every billing figure — amount, next billing date, Stripe identifiers. §8.2
 *   asks for subscription STATUS, which tells a therapist why a client may have
 *   gone quiet. It does not ask for their money.
 * - `privateNotes`, which is not merely absent but never reached for. See the
 *   boundary comment in services/therapistClient.service.js.
 *
 * NOT PRESENT IN THE DATA AT ALL: a client timezone. `clientProfiles` has never
 * collected one (§10.2 does not list it), and the settled pattern since 5.6 is
 * that every portal uses the viewer's own browser zone. The Client Info tab
 * says so plainly rather than leaving a blank row. Carried forward to 9.2,
 * where session scheduling is the first place it genuinely costs something.
 */
export const THERAPIST_CLIENT_FIELDS = Object.freeze([
  'type',
  'country',
  'city',
  'relationshipStatus',
  'concernTags',
  'therapistGenderPreference',
  'age',
  'gender',
]);
