// Email settings and the brand values the templates use.
//
// Colours are repeated here as literal hex rather than imported from the React
// theme, because email HTML cannot use CSS variables — every value must be
// inlined. If the palette in client/src/index.css ever changes, change it here
// too. Values confirmed by the developer, 2026-08-24.

export const BRAND = Object.freeze({
  name: 'Cast of Minds',

  ink: '#19122B',       // headings, body text, dark surfaces
  gold: '#F5C518',      // the accent — buttons only, NEVER text
  mist: '#F4F2F7',      // the page behind the email card
  paper: '#FFFFFF',     // the card itself

  // Muted body text. ink at ~70% over white, computed rather than guessed, so
  // it clears the 4.5:1 contrast floor. Email cannot do colour-mix, so it is
  // written out as a solid hex.
  inkMuted: '#5B5468',
});

// GOLD IS NEVER TEXT. #F5C518 on white is 1.63:1 — effectively invisible.
// On ink it is 9.5:1, which is why the button is a gold block with ink text.

// Public contact address shown in every email footer.
//
// NOTE FOR LAUNCH: support@castofmind.com does not exist yet. The developer's
// plan is to forward it to atcastofmind@gmail.com once the domain is set up.
// Until then, mail sent to it will bounce. On the pre-launch checklist.
export const SUPPORT_EMAIL = 'support@castofmind.com';

export const EMAIL_SUBJECTS = Object.freeze({
  passwordReset: 'Reset your Cast of Minds password',
  therapistWelcome: 'Your Cast of Minds therapist account is ready',
  clientWelcome: 'Welcome to Cast of Minds — your account is ready',
  emailChanged: 'Your Cast of Minds sign-in email has changed',
  paymentReceipt: 'Your Cast of Minds payment was received',
  paymentFailed: 'Your Cast of Minds payment did not go through',
  subscriptionCancelled: 'Your Cast of Minds subscription is cancelled',
  subscriptionReactivated: 'Your Cast of Minds subscription will continue',
  welcomeBack: 'Welcome back to Cast of Minds',
  renewalReminder: 'Your Cast of Minds subscription renews soon',
});
