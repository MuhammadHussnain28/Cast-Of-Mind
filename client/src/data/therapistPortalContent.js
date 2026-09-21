/**
 * Every word the therapist portal says — master spec §8.
 *
 * NOTHING HERE IS INVENTED. Each line is either a spec fact (cited where it
 * matters) or a plain description of a screen this chunk does not build yet.
 * No timelines anywhere — no "coming soon", no dates — because none has been
 * agreed and a missed promise reads worse than silence. Same call as the client
 * portal's placeholder screens (7.1) and the application confirmation (3.5).
 */

/**
 * The global navigation, below the client list.
 *
 * §8.7 and §8.8 both mark these *(global)* — they belong to the therapist, not
 * to whichever client is selected, which is the whole distinction the inbox
 * pattern turns on.
 */
export const THERAPIST_GLOBAL_NAV = [
  { to: '/portal/profile', label: 'My profile', icon: 'profile', end: true },
  { to: '/portal/notifications', label: 'Notifications', icon: 'notifications', end: true },
]

/**
 * THE EMPTY STATE — ONE SENTENCE, AND NOTHING ELSE.
 *
 * §8.1 is unusually specific here: show only this line. Profile completion
 * prompts, "boost your visibility" tips and specialty suggestions were all
 * explicitly rejected, because a therapist who already submitted a 33-field
 * application and was approved would read them as "something is wrong with my
 * profile". Do not add to this.
 */
export const CLIENTS_EMPTY = {
  title: 'No clients yet',
  body: "You'll see them here once they're matched with you.",
}

export const CLIENTS_LIST = {
  heading: 'Your clients',
  // Announced to assistive technology when the list finishes loading, since the
  // count beside the heading is decorative.
  countLabel: (n) => `${n} ${n === 1 ? 'client' : 'clients'}`,
  error: 'Your client list could not be loaded.',
  loadMore: 'Load more clients',
  // The list is a navigation landmark, not a table of data.
  navLabel: 'Your clients',
  backToList: 'All clients',
}

/**
 * The resting state, when no client is selected.
 *
 * Desktop only — on a phone the list IS the screen, so there is no empty
 * right-hand pane to fill.
 */
export const NO_CLIENT_SELECTED = {
  title: 'Choose a client',
  body: 'Their conversation, worksheets, sessions and notes open here.',
}

/**
 * The selected client, in chunk 8.1.
 *
 * The workspace tabs are 8.2. This screen carries the client's identity and one
 * honest line about what is not switched on yet — the same treatment the four
 * client portal screens got in 7.1, for the same reason: a screen that
 * describes software warmly and then does nothing reads as broken.
 */
export const WORKSPACE_PENDING = {
  title: 'Workspace',
  body: 'Chat, worksheets, sessions and your journal and notes for this client open here. This part is not switched on yet.',
  // §8.5's safety line, stated to the therapist rather than assumed. It is true
  // today at the data layer and is what the unified workspace is built around.
  notesNote: 'Your private notes are never visible to a client.',
}

/**
 * Notifications — §8.8.
 *
 * Chunk 10.4 builds the feed. The nav entry ships now so the inbox has the
 * shape §8 describes, and this screen says plainly that it is not live.
 */
export const NOTIFICATIONS_PENDING = {
  title: 'Notifications',
  lead: 'Alerts about your clients collect here, so you never have to check each conversation to find out what changed.',
  truths: [
    // §8.8 — the three triggers, stated as facts about the finished feature.
    'A new message from any client, including one you are not currently viewing.',
    'A worksheet coming back completed.',
    'A new client matched with you.',
  ],
  note: 'This part is not switched on yet. Unread counts beside each client are live now.',
}

/** Relative time, shortened for a 320px rail. */
export const ACTIVITY_PREFIX = {
  // "Matched 3 days ago" rather than "3 days ago" — otherwise a client who has
  // never written looks identical to one who wrote three days ago.
  matched: 'Matched',
  message: null,
}

// ── One client's workspace — §8.2 to §8.6 ────────────────────────────────────

/**
 * The tabs, in §8's own order. `slug` is the URL segment, so the tab a
 * therapist is on survives a refresh and travels with them when they click the
 * next client in the sidebar.
 *
 * Chat is first and is the DEFAULT — §8.2 lists it first and it is why a
 * therapist opens a client at all. `chunk: null` marks a tab that is built.
 */
export const WORKSPACE_TABS = [
  { slug: 'chat', label: 'Chat', icon: 'chat', chunk: null },
  { slug: 'worksheets', label: 'Worksheets', icon: 'worksheets', chunk: null },
  { slug: 'sessions', label: 'Sessions', icon: 'sessions', chunk: null },
  { slug: 'journal', label: 'Journal and Notes', icon: 'journal', chunk: null },
  { slug: 'info', label: 'Client info', icon: 'info', chunk: null },
]

export const DEFAULT_WORKSPACE_TAB = 'chat'

/** The identity strip that stays above the tabs. */
export const IDENTITY_STRIP = {
  concernsLabel: 'Presenting concerns',
  since: (date) => `Client since ${date}`,
  endedNotice: 'This booking has ended. You can still read the record.',
}

/**
 * Client info — §8.2's own list.
 *
 * NOTHING HERE IS INVENTED and nothing is guessed. Where the platform does not
 * hold a value, the row says so rather than sitting blank or showing something
 * derived.
 */
export const CLIENT_INFO = {
  title: 'Client info',
  lead: 'What they told us when they joined. These are their own answers, unedited.',

  groups: {
    concerns: 'Presenting concerns',
    who: 'Who you are working with',
    where: 'Where they are',
    plan: 'Their plan with us',
  },

  labels: {
    type: 'Client type',
    age: 'Age',
    gender: 'Gender',
    relationshipStatus: 'Relationship status',
    country: 'Country',
    city: 'City',
    timezone: 'Time zone',
    genderPreference: 'Therapist gender preference',
    matchedAt: 'Matched with you',
    subscription: 'Subscription',
  },

  // Saved from the client's own browser since 9.2. Never guessed from their country.
  timezoneUnknown: 'Not known yet. Saved automatically the next time they open their portal.',

  genderPreferenceValues: {
    male: 'Male therapist preferred',
    female: 'Female therapist preferred',
    no_preference: 'No preference stated',
  },

  typeValues: {
    individual: 'Individual',
    couple: 'Couple — one account, two people',
  },

  /** §13's five states, said in words a therapist can act on. */
  subscriptionValues: {
    active: 'Active',
    past_due: 'Payment failed — in the grace period',
    cancelled: 'Cancelled, still inside the paid period',
    expired: 'Ended',
    none: 'No subscription on record',
  },

  accessNote: {
    past_due: 'They keep full access while this is resolved.',
    ending: 'They keep access until the period they paid for runs out.',
    ended: 'They have lost access to their portal. You can still read the record.',
  },

  error: 'This client could not be loaded.',
  retry: 'Try again',
}

// ── The therapist's side of the conversation — §8.2, §14 (8.3) ───────────────

/**
 * Every word the therapist chat says that the client chat does not.
 *
 * The shared thread, composer and notices keep their own copy in
 * data/chatContent.js; only what is genuinely different on this side lives
 * here. Nothing promises a reply time or anything about the client.
 */
export const THERAPIST_CHAT = {
  heading: 'Conversation',
  placeholder: 'Write a reply…',

  /** Where the history starts, once the whole of it is on screen. */
  startLabel: (name) => `The beginning of your conversation with ${name}.`,

  /** §7.1's mandatory first message, named where it sits in the thread. */
  openingLabel: 'Their opening message',

  /**
   * THE CLIENT HAS NOT WRITTEN YET.
   *
   * TRUE, AND IT HAS TO BE: chunk 7.5's opening screen REPLACES the client's
   * thread until they have sent their first message. So a therapist who writes
   * first is not read until then — and the copy says exactly that rather than
   * "they will see it when they sign in", which would be false.
   *
   * The composer stays open regardless. 7.5 decided a therapist is never
   * blocked from reaching somebody, and this does not change that.
   */
  awaiting: {
    title: (name) => `${name} has not written yet`,
    body: 'Their opening message — how they are feeling and what brought them here, in their own words — will be the first thing in this conversation.',
    writeFirst: 'You can write first if you want to. They will see it once they have sent their opening message.',
  },

  /**
   * Shown only when the therapist's profile time zone is not the browser's.
   *
   * §15 puts every time in the viewer's PROFILE zone, which is also the zone
   * sessions will be scheduled in (9.2). A therapist working away from home
   * would otherwise read times that do not match the clock on their wall, with
   * nothing to say why.
   */
  zoneNote: (zone) => `Times shown in ${zone}`,

  loadError: 'This conversation could not be loaded.',
  retry: 'Try again',
}

// ── Worksheets, therapist side — §7.2, §8.3 (8.4) ────────────────────────────

export const WORKSHEETS = {
  heading: 'Worksheets',
  upload: {
    heading: 'Assign a worksheet',
    titleLabel: 'Title',
    titlePlaceholder: 'e.g. Thought record, week 2',
    fileLabel: 'File',
    choose: 'Choose a PDF or Word file',
    drop: 'or drop it here',
    rules: 'PDF or Word (.docx), up to 10 MB',
    change: 'Choose another',
    assign: (name) => `Assign to ${name}`,
    uploading: 'Uploading',
    done: (name) => `Assigned to ${name}.`,
    another: 'Assign another',
    note: 'They download it, fill it in, and send it back from their portal.',
  },
  sections: {
    waiting: 'Waiting for their answers',
    returned: 'Returned',
    noneReturned: 'Nothing has come back yet.',
  },
  row: {
    assigned: (date) => `Assigned ${date}`,
    returned: (date) => `Returned ${date}`,
    download: 'Download',
    downloadAnswers: 'Download their answers',
    yourCopy: 'Your original',
    withdraw: 'Withdraw',
    confirm: (title) => `Withdraw “${title}”? It will be removed for your client.`,
    confirmYes: 'Withdraw it',
    confirmNo: 'Keep it',
    downloadFailed: 'That file could not be downloaded. Try again.',
    markReviewed: 'Mark as reviewed',
    reviewed: (date) => `Reviewed ${date}`,
    reviewHint: 'Until you mark it reviewed, your client can still replace this file.',
  },
  empty: {
    title: 'Nothing assigned yet',
    body: 'Worksheets you assign appear here. When your client sends one back, it moves to Returned.',
  },
  loadError: 'Worksheets could not be loaded.',
  retry: 'Try again',
  loadMore: 'Show older worksheets',
}

// ── Sessions, therapist side — §8.4 (9.2) ────────────────────────────────────

// Times are typed in the therapist's own zone; the preview shows the client's.
export const SESSIONS = {
  heading: 'Sessions',
  form: {
    heading: (name) => `Schedule a session with ${name}`,
    editHeading: 'Change this session',
    dateLabel: 'Date',
    timeLabel: (place) => `Time · your time (${place})`,
    linkLabel: 'Meeting link',
    linkPlaceholder: 'https://zoom.us/j/…',
    linkHelper: 'Zoom or Google Meet. Paste the link for this session.',
    noteLabel: (name) => `Note for ${name} (optional)`,
    noteHelper: (name) => `${name} will see this. Private thoughts belong in Journal and Notes.`,
    notePlaceholder: 'e.g. Bring last week’s thought record.',
    submit: 'Schedule session',
    save: 'Save changes',
    keep: 'Keep as it was',
    scheduled: (when) => `Scheduled for ${when}, your time.`,
    told: (name) => `${name} is told in the chat and sees it on their Sessions page, in their own time.`,
    errors: {
      date: 'Choose a date.',
      time: 'Choose a time.',
      past: 'That time has already passed. Pick a time in the future.',
      dateInvalid: 'That date does not exist. Check the day and month.',
      nonexistent:
        'That time does not exist on that day, because the clocks go forward. Pick another time.',
      link: 'Use a Zoom or Google Meet link that starts with https://.',
      note: (max) => `A note must be ${max} characters or fewer.`,
    },
  },
  preview: {
    label: 'The time for each of you',
    you: 'You',
    empty: 'Pick a date and time to see it on both clocks.',
    skipped: 'The clocks go forward over that time, so it does not exist on that day.',
    forYou: (date, time) => `${date}, ${time} for you`,
    forThem: (time, name, place) => `${time} for ${name} in ${place}`,
    onDate: (date) => `on ${date}`,
    sameZone: (name) => `Same time for ${name}. You share a time zone.`,
    unknownTitle: 'Not known yet',
    unknownBody: (name) =>
      `${name}'s time zone is saved automatically the next time they open their portal.`,
    night: (time, name) => `That's ${time} for ${name}.`,
  },
  confirmMove: {
    title: 'Move this session?',
    move: 'Move it',
    back: 'Go back',
  },
  upcoming: 'Upcoming',
  history: 'History',
  next: 'Next',
  noUpcoming: 'Nothing scheduled ahead.',
  openLink: 'Open link',
  edit: 'Edit',
  cancel: 'Cancel',
  cancelConfirm: (day, name) => `Cancel ${day}'s session with ${name}? It stays in the history.`,
  cancelYes: 'Cancel session',
  cancelNo: 'Keep it',
  status: {
    completed: 'Completed',
    cancelled: (date) => `Cancelled ${date}`,
    past: 'Past',
    notHeld: "Didn't take place",
  },
  // 9.5 — the counter and the two corrections. No session length, ever.
  counter: {
    left: (n) => `${n} of 4 sessions left this cycle`,
    resets: (date) => `Resets on ${date}.`,
    ends: (date) => `Their plan ends on ${date}.`,
    ended: 'Their subscription has ended.',
  },
  held: 'Mark as held',
  notHeld: "Didn't take place",
  notHeldConfirm: (day, name) =>
    `Mark ${day}'s session as not taking place? If it counted this cycle, ${name} gets the session back.`,
  notHeldYes: 'Mark as not held',
  notHeldNo: 'Keep it',
  // Warned, never blocked — a business decision for Asad to confirm.
  overLimit: (name, left, scheduled) =>
    `${name} has ${left} ${left === 1 ? 'session' : 'sessions'} left this cycle and ${scheduled} already scheduled. You can still schedule this one.`,
  yourTime: (time) => `${time} your time`,
  theirTime: (time, name, place) => `${time} for ${name} in ${place}`,
  theirTimeUnknown: (name) => `${name}'s time not known yet`,
  sameTime: (name) => `Same time for ${name}`,
  empty: {
    title: (name) => `No sessions with ${name} yet.`,
    body: 'Sessions you schedule appear here, soonest first.',
  },
  ended: {
    booking: 'This booking has ended. Past sessions stay here for your record.',
    subscription: (name) => `${name}'s subscription has ended, so new sessions can't be scheduled.`,
  },
  zoneMissing:
    'Your timezone is missing from your profile, so sessions cannot be placed. Please contact support.',
  loadError: 'Sessions could not be loaded.',
  retry: 'Try again',
  loadMoreHistory: 'Show earlier sessions',
  loadMoreUpcoming: 'Show later sessions',
}

/**
 * Journal and Notes (§8.5/8.6). Two sections, two collections, one screen.
 * The "only you" line is a statement of fact, not reassurance: §11 records that
 * no admin conversation viewer exists, so nobody else can read these.
 */
export const JOURNAL_NOTES = {
  journal: {
    heading: (name) => `${name}'s journal`,
    note: 'They write it; you read it. Nothing here is yours to edit.',
    count: (n) => (n === 1 ? '1 entry' : `${n} entries`),
    emptyTitle: 'No entries yet',
    emptyBody: (name) =>
      `${name} has not written in their journal. It is theirs to use or not — there is nothing to prompt them with.`,
    loadError: 'Their journal could not be loaded.',
    retry: 'Try again',
    loadMore: 'Show older entries',
  },

  notes: {
    heading: 'Your private notes',
    private: 'Only you can see these. Your client never can.',
    composerLabel: 'Write a private note about this client',
    placeholder: 'Observations, formulation, what to pick up next time…',
    save: 'Save note',
    saveChanges: 'Save changes',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    edited: 'Edited',
    confirm: 'Delete this note?',
    confirmYes: 'Delete it',
    confirmNo: 'Keep it',
    count: (n) => (n === 1 ? '1 note' : `${n} notes`),
    emptyTitle: 'No notes yet',
    emptyBody: 'Anything you write here stays with you, on this client only.',
    saveFailed: 'That note could not be saved. Try again.',
    deleteFailed: 'That note could not be deleted. Try again.',
    loadError: 'Your notes could not be loaded.',
    retry: 'Try again',
    loadMore: 'Show older notes',
  },
}
