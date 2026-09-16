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
  { to: '/portal/worksheets', label: 'Worksheets', icon: 'worksheets' },
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
      { label: 'You upload it back', detail: 'Your therapist sees it is done and reads it before your next session.' },
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
    lead: 'Your Zoom sessions — four a month, one a week, included in your subscription.',
    truths: [
      // §7.4
      'Your therapist schedules each session and posts it into your chat. You join by clicking the link when the time comes.',
      'Times are shown in your own time zone, converted from theirs. Neither of you has to do the arithmetic.',
      'To move a session, message your therapist in the chat and they will reschedule it.',
    ],
  },
}

/** The four states §13 defines, as the client sees them. */
export const ACCESS_NOTICES = {
  past_due: {
    title: 'Your last payment did not go through',
    body: 'Your portal is still open. Update your card to keep it that way — your therapist, your history and everything here stay exactly as they are.',
    action: 'Go to your account',
  },
  ending: {
    title: 'Your subscription is set to end',
    // No retention pressure of any kind — that is on the excluded list. It
    // states the fact and the date, and offers nothing to talk them out of it.
    body: 'You have full access until then, and nothing changes before that date.',
  },
}

export const ENDED = {
  title: 'Your subscription has ended',
  lead: 'Everything is still here — your conversation, your journal, your worksheets and your therapist. Nothing has been deleted.',
  // §13: all data is preserved and re-subscribing resumes where it left off.
  // NO reactivate button: slice 12 builds that flow, and a button that does
  // nothing is worse than none.
  note: 'Reactivating your subscription brings it all back exactly as you left it.',
}

/** §13 requires this sentence visible in the portal, not only at checkout. */
export const RENEWAL_NOTICE = 'To stop your subscription, cancel before this date.'
