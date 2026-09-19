// Journal and private notes — master spec §7.3, §8.5/8.6, §10.9, §10.10.

export const JOURNAL_TEXT_MAX = 10000;
export const NOTE_TEXT_MAX = 10000;

// Approved 2026-09-18: eight presets plus a free "Other" the client types.
// THE LIST IS OURS, NOT ASAD'S — wants his confirmation before launch (as 5.1's).
export const MOOD_PRESETS = Object.freeze([
  'Low',
  'Anxious',
  'Flat',
  'Steady',
  'Hopeful',
  'Tired',
  'Angry',
  'Overwhelmed',
]);

// A custom mood has to fit on the tag it renders as.
export const MOOD_TAG_MAX = 30;

export const JOURNAL_PAGE_SIZE = 30;
export const JOURNAL_MAX_PAGE_SIZE = 100;

// One refusal for every "not yours / not there" case, as in 8.2 and 8.4.
export const ENTRY_NOT_FOUND_MESSAGE = 'We could not find that entry.';
export const ENTRY_NOT_FOUND_CODE = 'JOURNAL_ENTRY_NOT_FOUND';

export const NOTE_NOT_FOUND_MESSAGE = 'We could not find that note.';
export const NOTE_NOT_FOUND_CODE = 'PRIVATE_NOTE_NOT_FOUND';

// Writing is the point of this screen, so the limit stops automation, not people.
export const JOURNAL_WRITE_RATE_LIMIT = Object.freeze({
  windowMs: 60 * 60 * 1000,
  max: 120,
  message: 'Too many entries saved at once. Please try again in a little while.',
});
