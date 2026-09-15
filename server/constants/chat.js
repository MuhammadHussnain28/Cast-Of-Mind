// Chat — master spec §10.7 and §14.

export const MESSAGE_TYPE = Object.freeze({
  TEXT: 'text',
  SYSTEM: 'system',
});

export const MESSAGE_TYPE_VALUES = Object.freeze(Object.values(MESSAGE_TYPE));

/**
 * §10.7: "structured so voice / attachment types can be added later without a
 * rebuild." That is carried by `type` being an enum beside a text body — a new
 * kind is a new enum value plus its own URL field, not a reshape of what is
 * already stored. Nothing about today's shape blocks it.
 */

/**
 * 5,000 characters. Approved 2026-09-13.
 *
 * The spec sets no limit. This is long enough for the mandatory first message
 * (§7.1 — someone describing everything they are dealing with, in their own
 * words) and short enough to bound the payload and the database document.
 */
export const MESSAGE_TEXT_MAX = 5000;

/**
 * A browser-generated id echoed back on the ack and the socket emit, so a
 * sender can swap their optimistic bubble for the real message without the
 * flicker of briefly holding both. Approved 2026-09-14.
 *
 * IT IS NEVER STORED. It is a rendering hint, not data — the model has no field
 * for it and a test asserts it never reaches the database. It is also
 * attacker-controlled and echoed to the other party, so it is bounded and
 * charset-restricted, and no code ever interprets it as anything but an opaque
 * string.
 */
export const CLIENT_MESSAGE_ID_MAX = 64;
export const CLIENT_MESSAGE_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * THE MANDATORY FIRST MESSAGE — master spec §7.1 and §14.
 *
 * A client's first message on a booking must clear this floor. Everything
 * after it is an ordinary message.
 *
 * TWENTY CHARACTERS, and the number was argued down from thirty deliberately
 * (developer's decision, 2026-09-15). A floor of 30 would refuse "I can't do
 * this anymore" (24) and "I feel completely broken" (25) — the most important
 * messages anyone on this platform will ever send. Twenty still stops "hi",
 * "test" and "hello", which is all the floor is for.
 *
 * `OPENING_MESSAGE_SUGGESTED` is NEVER enforced. The screen encourages roughly
 * this much and then gets out of the way; nothing refuses a message for being
 * shorter than it.
 */
export const OPENING_MESSAGE_MIN = 20;
export const OPENING_MESSAGE_SUGGESTED = 200;

export const OPENING_MESSAGE_MESSAGE =
  'This is your first message to your therapist. Please write a little more so they have something to begin with — a sentence or two is enough.';
export const OPENING_MESSAGE_CODE = 'OPENING_MESSAGE_REQUIRED';

export const MESSAGES_PAGE_SIZE = 30;
export const MESSAGES_PAGE_SIZE_MAX = 100;

/**
 * 30 sends a minute. Approved 2026-09-13.
 *
 * Deliberately loose. Someone in distress types in short bursts, and a person
 * who hits a wall mid-sentence on a mental health platform is a failure of the
 * product, not a protected system. This is set to stop automation, not people.
 */
export const CHAT_SEND_RATE_LIMIT = Object.freeze({
  windowMs: 60 * 1000,
  max: 30,
  message: 'You are sending messages very quickly. Please wait a moment.',
});

/** Reading is cheap and the portal polls it until Socket.io lands in 7.3. */
export const CHAT_READ_RATE_LIMIT = Object.freeze({
  windowMs: 15 * 60 * 1000,
  max: 600,
  message: 'Too many requests. Please try again in a few minutes.',
});

/**
 * ONE MESSAGE FOR "THIS BOOKING IS NOT YOURS" AND "THIS BOOKING DOES NOT EXIST".
 *
 * Both return 404 with this body. A 403 for a booking that exists but belongs
 * to someone else would confirm the id is real, which is all an attacker needs
 * to enumerate valid booking ids by comparing responses. Same discipline as the
 * public therapist lookup in 5.6.
 */
export const CONVERSATION_NOT_FOUND_MESSAGE = 'Conversation not found.';
export const CONVERSATION_NOT_FOUND_CODE = 'CONVERSATION_NOT_FOUND';

export const BOOKING_ENDED_MESSAGE = 'This conversation has ended and is read-only.';
export const BOOKING_ENDED_CODE = 'BOOKING_ENDED';

export const INVALID_CURSOR_MESSAGE = 'That page reference is not valid.';
export const INVALID_CURSOR_CODE = 'INVALID_CURSOR';
