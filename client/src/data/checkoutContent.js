/**
 * Every word the checkout says.
 *
 * NOTHING HERE IS INVENTED. Each claim traces to the spec: the price and what
 * it includes to §2, the no-carry-over rule to §13, and the renewal sentence is
 * quoted VERBATIM from §13's transparency requirement — it is a commitment to
 * the person paying, not copy to improve.
 *
 * No urgency, no scarcity, no "limited time". §24.1 rules those out, and on a
 * page where somebody is deciding whether they can afford help, they would be
 * worse than tacky.
 */

export const checkout = {
  heading: 'Your subscription',
  intro: 'One plan, one price. Everything below is included from the day you start.',

  whoHeading: 'You will be working with',
  whoNote: 'You can message them as soon as your account is open.',

  price: '€200',
  priceUnit: 'per month',

  includedHeading: "What's included",

  // §13: unused sessions are forfeited. A term to read BEFORE paying.
  noCarryOver: 'Sessions do not roll over , each month starts again at four.',

  submit: 'Continue to payment',
  submitting: 'Taking you to payment…',

  // The application never sees a card number; Stripe's own page collects it.
  secureNote: 'Payment is handled by Stripe. Your card details never reach us.',

  legalIntro: 'By continuing you agree to our',
  terms: 'Terms of Service',
  refund: 'Refund Policy',

  backToTherapist: 'Choose a different therapist',
}

/**
 * The four things a subscription buys. Drawn icons, not a bulleted list —
 * §24.5 and §24.9 both ask for authored marks where they clarify a concept.
 */
export const included = [
  {
    icon: 'sessions',
    title: 'Four sessions a month',
    detail: 'Weekly video session with your therapist.',
  },
  {
    icon: 'chat',
    title: 'Unlimited messaging',
    detail: 'Write between sessions. Your therapist will definitely replies you.',
  },
  {
    icon: 'worksheets',
    title: 'Worksheets',
    detail: 'Material your therapist chooses for you, to work through in your own time.',
  },
  {
    icon: 'journal',
    title: 'A private journal',
    detail: 'Somewhere to write things down. Your therapist can read it.',
  },
]

/**
 * THE DISCLOSURE. §13 calls checkout the most important of the three places the
 * renewal terms must appear, and the brief says it must be impossible to miss.
 *
 * `sentence` is quoted verbatim and must not be reworded, shortened, or moved
 * into a caption. The rhythm marks beside it show the same fact rather than
 * restating it — the recurring charge made visible, which is the opposite of
 * burying it.
 */
export const renewal = {
  heading: 'This renews every month',
  sentence:
    'This is a monthly subscription. Your card will be charged €200 automatically each month until you cancel.',
  cadenceCaption: 'Every month, until you cancel.',
  todayLabel: 'Today',
  cancelNote: 'You can cancel any time from your portal. Cancelling stops the next payment.',
}

/**
 * The cancel screen.
 *
 * "Nothing was charged" is true whether or not we still know who was chosen, so
 * it always shows. Only the second line and the resume button depend on the
 * draft surviving — a tab closed at Stripe, or a draft past its 24-hour life,
 * loses it, and redirecting somebody who just backed out of a payment would be
 * both confusing and faintly alarming.
 */
export const cancelled = {
  heading: 'Nothing was charged',
  body:
    'You closed the payment page before finishing, so no payment was taken and no account was created.',
  reassurance: 'Your answers and your chosen therapist are still here.',
  // Shown instead when the choice could not be recovered.
  lostReassurance:
    'We could not pick up where you left off, so you will need to choose again. Nothing was lost on our side — no account exists yet.',
  resume: 'Back to checkout',
  browse: 'Choose a different therapist',
  restart: 'Start again',
}

/** Every failure names the problem AND the way out of it. */
export const errors = {
  EMAIL_IN_USE: {
    action: 'Change your email address',
    to: '/questionnaire',
  },
  THERAPIST_UNAVAILABLE: {
    action: 'See who else is available',
    to: '/matches',
  },
  fallbackAction: 'Try again',
}

export const guards = {
  noAnswers: 'Start with a few questions so we know who to match you with.',
  noTherapist: 'Choose a therapist before continuing to payment.',
}

/**
 * /welcome — shown after Stripe reports a successful payment.
 *
 * THIS PAGE ONLY REPORTS. It never creates an account: §12's golden rule puts
 * that behind the webhook, so if somebody closes the tab before landing here,
 * the account still exists and this copy is the only thing they missed.
 *
 * No "congratulations", no confetti register. Someone has just committed €200
 * to therapy — the tone is steady, not celebratory.
 */
export const welcome = {
  processingHeading: 'Setting up your account',
  processingBody:
    'Your payment went through. We are creating your account now — this usually takes a few seconds.',
  processingNote: 'You can safely leave this page. Your account will be ready either way.',

  readyHeading: 'You are all set',
  readyBody: 'Your payment went through and your account is open.',
  readyEmail:
    'Check your email for your sign-in details. They are sent to the address you gave us, and the message includes your password.',
  readyNext:
    'Once you are in, send your therapist a first message about what brought you here. It gives them the context to start properly.',
  readyCta: 'Go to sign in',

  // The webhook has not arrived within the polling window. Honest rather than
  // reassuring: something may genuinely need looking at.
  slowHeading: 'This is taking longer than usual',
  slowBody:
    'Your payment went through — that part is safe. Your account is still being set up, and your sign-in details will arrive by email as soon as it is ready.',
  slowNote: 'If nothing arrives within an hour, contact us and we will sort it out.',
  slowCta: 'Contact us',

  // Someone opened /welcome directly, with no session in the URL. It must never
  // claim a payment happened when it does not know that.
  unknownHeading: 'Nothing to confirm here',
  unknownBody:
    'If you have just paid, check your email for your sign-in details. If you have not, you can start from the beginning.',
  unknownCta: 'Go to sign in',
  unknownSecondary: 'Start from the beginning',
}
