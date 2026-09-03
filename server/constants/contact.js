// Contact form settings.

export const CONTACT_SUBJECTS = Object.freeze([
  'General question',
  'Support',
  'Media enquiry',
]);

export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 4000;
export const NAME_MAX = 120;

// One reply for every outcome — sent, silently dropped as spam, or delivery
// failed. A visitor cannot act on the difference, and distinguishing them would
// tell a bot whether its submission got through.
export const CONTACT_SUCCESS_MESSAGE =
  'Thank you — your message is on its way. We read everything that arrives here.';

export const CONTACT_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const CONTACT_RATE_LIMIT_MAX = 5;
export const CONTACT_RATE_LIMIT_MESSAGE =
  'Too many messages sent. Please try again in a few minutes.';
