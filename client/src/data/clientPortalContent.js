/**
 * Every word the client portal says — master spec §7.
 *
 * NOTHING HERE IS INVENTED. Each statement is either a spec fact (cited at the
 * line) or a description of a screen this chunk does not build yet. There are
 * deliberately NO timelines — no "coming soon", no "available next week" —
 * because no date has been agreed and a missed promise reads worse than
 * silence. Same call as the therapist application's confirmation screen (3.5).
 */

export const CLIENT_NAV = [
  {
    to: '/portal/chat',
    label: 'Chat',
    icon: 'chat',
    // §7.1 — the first feature, and where the mandatory first message lives.
    // §14: the only place in this portal that carries an unread count. Declared
    // on the nav data rather than checked against the route in two components,
    // so the rail and the tab bar cannot disagree about where the badge goes.
    unread: true,
  },
  // 8.5: a quiet dot while a worksheet is still to complete.
  { to: '/portal/worksheets', label: 'Worksheets', icon: 'worksheets', dot: true },
  { to: '/portal/journal', label: 'Journal', icon: 'journal' },
  { to: '/portal/sessions', label: 'Sessions', icon: 'sessions' },
  { to: '/portal/account', label: 'Account', icon: 'account' },
]

/**
 * The placeholder screens.
 *
 * Each carries `truths` — things that are already true today, from the spec —
 * rather than a description of software that does not exist. §24.8: empty
 * states are designed, never blank; and they teach the interface rather than
 * announcing an absence.
 */
export const SCREENS = {
  chat: {
    title: 'Chat',
    lead: 'Your conversation with your therapist lives here — text, whenever you need it, included in your subscription.',
    truths: [
      // §7.1
      'It opens with one message from you, in your own words: how you are feeling and what you are dealing with. Nothing structured, no form.',
      'If your therapist is offline your message waits for them. It is never lost, and there is nothing you need to do.',
      'Their working hours sit at the top of the conversation, in your own clock.',
    ],
  },

  worksheets: {
    title: 'Worksheets',
    lead: 'Exercises your therapist sets for you, and your answers coming back to them.',
    // §7.2 — the real loop, drawn as a sequence because the order is the thing
    // a reader needs. Numbered markers are earned here for that reason.
    steps: [
      { label: 'They assign it', detail: 'A document appears here with the date it was set.' },
      { label: 'You download it', detail: 'It saves to your own device, to open however suits you.' },
      { label: 'You fill it in', detail: 'On paper, in a PDF app, or in Word — whichever you prefer.' },
      { label: 'You send it back', detail: 'Upload it here, and your therapist sees it has come back.' },
    ],
  },

  journal: {
    title: 'Journal',
    lead: 'Somewhere to write down how you are doing between sessions, in as much or as little detail as you want.',
    // §7.3 requires this stated plainly in the UI, for trust and legal
    // clarity. It leads the screen rather than sitting in small print.
    transparency:
      'Your therapist can read every entry you write here. That is deliberate — it is what lets them see how a week actually went rather than only the hour you spend together.',
    truths: [
      'There is no private space here. If you want to keep something to yourself, keep it outside the portal.',
      'You can add a note about your mood to an entry, or leave it out.',
    ],
  },

  sessions: {
    title: 'Sessions',
    // Zoom or Google Meet since 9.1, so the lead names neither.
    lead: 'Four sessions a month, one a week, included in your subscription. Times are shown in your own time zone.',
  },
}

/** The four states §13 defines, as the client sees them. */
export const ACCESS_NOTICES = {
  // A date, never a countdown: a draining timer is an urgency tactic (11.2).
  past_due: {
    title: 'Your last payment did not go through',
    until: 'Your portal stays open until',
    untilUnknown: 'Your portal is still open.',
    body: 'Update your card before then and nothing changes — your therapist, your history and everything here stay exactly as they are.',
    action: 'Update your card',
    opening: 'Opening Stripe…',
    caption: 'Opens Stripe’s secure page. You come back here afterwards.',
    failed: 'We could not open the card page. Please try again in a moment.',
  },
  ending: {
    title: 'Your subscription is set to end',
    // No retention pressure of any kind — that is on the excluded list. It
    // states the fact and the date, and offers nothing to talk them out of it.
    body: 'You have full access until then, and nothing changes before that date.',
  },
}

// §13's re-subscribe screen (11.4). Facts and one way back: no guilt, no
// urgency, no countdown, no "we miss you".
export const ENDED = {
  title: 'Your subscription has ended',
  continueWith: (name) => `Reactivate to continue with ${name}.`,
  continueWithout: 'Reactivate to continue where you left off.',
  keptHeading: 'Everything is still here',
  keptNote: 'Nothing has been deleted. Reactivating brings it all back exactly as you left it.',
  kept: [
    { key: 'messages', one: 'Message', many: 'Messages' },
    { key: 'journalEntries', one: 'Journal Entry', many: 'Journal Entries' },
    { key: 'worksheets', one: 'Worksheet', many: 'Worksheets' },
    { key: 'sessions', one: 'Session Held', many: 'Sessions Held' },
  ],
  action: 'Reactivate subscription',
  opening: 'Opening the payment page…',
  actionNote: 'You confirm and pay on Stripe’s secure page. Nothing is charged until you do.',
  failed: 'We could not open the payment page. Nothing has been charged. Please try again in a moment.',
  unavailable:
    'Your therapist is no longer seeing clients here, so this cannot be restarted from this page. Everything you wrote is kept. Write to us at',
  unavailableTail: 'and we will help you find a way forward.',
}

// Back from Stripe (11.4): the webhook, not the redirect, opens the portal.
export const WELCOME_BACK = {
  title: 'Welcoming you back',
  body: 'We are confirming your payment. Your portal opens by itself in a moment.',
  slowTitle: 'This is taking a little longer',
  slowBody: 'Your payment may still be on its way to us. You can wait here, or check again. If your portal has not opened within a few minutes, write to us at',
  checkAgain: 'Check again',
}

/**
 * Cancelling and reactivating (11.3). FACTS ONLY: no "we're sad to see you go",
 * no discount, no warning about loss, no "are you sure". Leaving therapy is a
 * decision to respect, and dark patterns here are excluded outright.
 */
export const CANCELLATION = {
  heading: 'Cancelling',
  intro: 'You can stop your subscription at any time. You keep everything you have paid for, and you are not charged again.',
  open: 'Cancel subscription',
  confirmHeading: 'What happens if you cancel',
  stations: {
    now: { label: 'Today', body: 'No further payments are taken.' },
    nowPastDue: { label: 'Today', body: 'Payments stop, and your card is not tried again.' },
    until: { label: 'Until', body: 'Everything carries on as normal: your conversation, sessions left, journal and worksheets.' },
    after: { label: 'After that', body: 'Your portal closes. Nothing is deleted, and it is all kept should you come back.' },
  },
  pastDueNote: 'Because your last payment did not go through, this cannot be undone from here.',
  keep: 'Keep my subscription',
  confirm: 'Cancel subscription',
  cancelling: 'Cancelling…',
  failed: 'That did not go through, and nothing has changed. Please try again in a moment.',

  endsHeading: 'Your subscription ends',
  endsBody: 'You will not be charged again. Everything stays open until then, and nothing is deleted afterwards.',
  today: 'Today',
  reactivateHeading: 'Reactivate',
  reactivateBody: (amount, date) =>
    `Your plan carries on as before. Your card is charged ${amount} on ${date}, then monthly until you cancel.`,
  reactivate: 'Reactivate subscription',
  reactivating: 'Reactivating…',
  adminCancelled: 'This subscription was stopped by the Cast of Minds team. If you would like to carry on, write to us at',
  noUndo: 'This subscription has already stopped with our payment provider. If you would like to carry on, write to us at',
}

/**
 * The Subscription & Account page (11.5). §13's portal notice is quoted exactly
 * in `renewalNotice`, and is shown whenever a renewal is scheduled — never
 * collapsed, never in a submenu.
 */
export const ACCOUNT = {
  title: 'Account',
  lead: 'Your plan, your payments and the details you gave us.',
  status: {
    active: 'Active',
    past_due: 'Payment needed',
    ending: 'Ending',
  },
  plan: 'Monthly plan',
  nextPayment: 'Next payment',
  renewalNotice: (date) => `Next payment: ${date}. To stop it, cancel before this date.`,
  endsLabel: 'Your plan ends',
  endsNote: 'No further payments will be taken. Everything stays open until then.',
  pastDueLabel: 'Your portal stays open until',
  pastDueNote: 'Your last payment did not go through. Update your card before then and nothing changes.',
  updateCard: 'Update your card',
  opening: 'Opening Stripe…',
  sessionsLeft: (left, total) => `${left} of ${total} sessions left this month`,
  noRollover: 'Unused sessions do not roll over.',

  payment: {
    heading: 'Payment method',
    body: 'Your card is held safely by Stripe. We never see or store your card number.',
    note: 'Update it, or find receipts and invoices, on Stripe’s secure page.',
    action: 'Manage payment method',
  },

  history: {
    heading: 'Billing history',
    empty: 'Your payments will appear here.',
    item: 'Monthly subscription',
    paid: 'Paid',
    failed: 'Did not go through',
    retried: 'Paid after a retry',
    more: 'Show earlier payments',
    loading: 'Loading your payments',
    failedToLoad: 'We could not load your payments just now.',
    retry: 'Try again',
  },

  details: {
    heading: 'Your details',
    note: 'These are the details you gave when you joined. To change any of these, write to us at',
    couple: 'You both',
    name: 'Name',
    email: 'Sign-in email',
    place: 'Where you are',
    since: 'With us since',
  },

  password: {
    heading: 'Password',
    body: 'We will email you a link to choose a new one.',
    action: 'Change password',
    sending: 'Sending…',
    sent: (email) => `A link is on its way to ${email}. It works on any device.`,
    failed: 'We could not send the link just now. Please try again in a moment.',
  },

  failed: 'That did not go through. Please try again in a moment.',
}


// ── Worksheets, client side — §7.2 (8.5) ─────────────────────────────────────

export const MY_WORKSHEETS = {
  lead: (name) => `Exercises from ${name}. Download one, fill it in however suits you, and send it back here.`,
  howTitle: 'Ways to fill one in',
  ways: [
    { key: 'screen', title: 'On screen', body: 'Open a PDF in a PDF app, or a Word file in Word, and type your answers. Save it, then send that file back.' },
    { key: 'paper', title: 'On paper', body: 'Print it and write by hand. Then take a clear photo, or scan it, and send that back.' },
    { key: 'pages', title: 'Several pages?', body: "Your phone's document scanner can turn them into one PDF — on iPhone in the Files or Notes app, on Android in Google Drive." },
  ],
  sections: { toComplete: 'To complete', submitted: 'Submitted' },
  row: {
    assigned: (date) => `Assigned ${date}`,
    sent: (date) => `Sent ${date}`,
    download: 'Download',
    sendBack: 'Send it back',
    replace: 'Replace file',
    yourFile: 'Your file',
    withTherapist: 'With your therapist',
    canReplace: 'You can replace it until your therapist has reviewed it.',
    downloadFailed: 'That file could not be downloaded. Try again.',
    cancel: 'Cancel',
  },
  drop: {
    choose: 'Choose your completed file',
    drop: 'or drop it here',
    rules: 'PDF, Word (.docx) or a photo · up to 10 MB',
    send: 'Send',
    sending: 'Sending',
    sent: 'Sent. Your therapist can see it now.',
  },
  empty: {
    title: 'No worksheets assigned yet',
    body: (name) => `When ${name} sets you an exercise, it will appear here.`,
  },
  loadError: 'Your worksheets could not be loaded.',
  retry: 'Try again',
  loadMore: 'Show older worksheets',
}

/**
 * The journal (§7.3). Written by the client, always read by their therapist.
 * The transparency line above is the one the spec requires; it leads the screen.
 */
export const JOURNAL = {
  transparencyTitle: 'Your therapist reads this',

  composer: {
    heading: 'Write an entry',
    placeholder:
      'How has it been since you last wrote? Anything at all — a whole week, or one moment from today.',
    save: 'Save entry',
    cancel: 'Cancel',
  },

  mood: {
    label: 'Add a mood, if you want to',
    other: 'In my own words',
    otherLabel: 'Your word for it',
    otherPlaceholder: 'e.g. restless',
  },

  entry: {
    edit: 'Edit',
    delete: 'Delete',
    saveChanges: 'Save changes',
    confirm: 'Delete this entry for good?',
    confirmYes: 'Delete it',
    confirmNo: 'Keep it',
    deleteFailed: 'That entry could not be deleted. Try again.',
  },

  empty: {
    title: 'Nothing written yet',
    body: 'Whatever you write here stays, so you and your therapist can look back over it together.',
  },

  count: (n) => (n === 1 ? '1 entry' : `${n} entries`),
  saveFailed: 'That entry could not be saved. Try again.',
  loadError: 'Your journal could not be loaded.',
  retry: 'Try again',
  loadMore: 'Show older entries',
}

// ── Sessions, client side — §7.4 (9.4) ──────────────────────────────────────

// View only: the therapist schedules, the client joins. Never a session length.
export const MY_SESSIONS = {
  nextHeading: 'Your next session',
  withTherapist: (name) => `with ${name}`,
  yourTime: (time) => `${time}, your time`,
  join: 'Join session',
  joinNewTab: 'Opens in a new tab.',
  joinsFrom: (time) => `You can join from ${time}`,
  joinsFromOn: (time, date) => `You can join from ${time} on ${date}`,
  gettingLink: 'Getting your link…',
  counter: {
    left: (n) => `${n} of 4 sessions left this month`,
    resets: (date) => `Resets on ${date}. Unused sessions do not roll over.`,
    ends: (date) => `Your plan ends on ${date}.`,
  },
  later: 'Later',
  earlier: 'Earlier',
  status: { completed: 'Completed', cancelled: 'Cancelled', past: 'Past', notHeld: "Didn't take place" },
  // The brief's own words.
  empty: {
    title: 'No sessions scheduled yet.',
    body: 'Your therapist will schedule your sessions.',
  },
  // §7.4: the only way to change a session is to ask in the chat.
  change: (name) => `Need a different time? Message ${name} in the chat.`,
  openChat: 'Open chat',
  loadError: 'Your sessions could not be loaded.',
  retry: 'Try again',
  loadMore: 'Show earlier sessions',
}
