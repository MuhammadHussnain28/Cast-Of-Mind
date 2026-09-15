/**
 * Every word the chat says — master spec §7.1.
 *
 * NOTHING HERE IS INVENTED and nothing promises a reply time. §7.1 is explicit
 * that a message simply waits when the therapist is offline, with no blocking
 * and no "unavailable" state, so the copy says exactly that and no more.
 */

/**
 * The header note, approved by the developer 2026-09-14.
 *
 * `{name}` is the therapist's own name and `{hours}` their published hours,
 * converted into the reader's clock. Neither is hardcoded, and the pronoun is
 * neutral — therapists are any gender and a template that switches on it would
 * read wrong for someone.
 */
export const HEADER_NOTE =
  'Write anytime your heart needs to speak, day or night. {name} mostly replies during their clinic hours ({hours}), but often answers sooner when free. There is never any rush.'

/** Used when a therapist has published no usable hours at all. */
export const HEADER_NOTE_NO_HOURS =
  'Write anytime your heart needs to speak, day or night. {name} replies as soon as they are able. There is never any rush.'

export function headerNote({ name, hours }) {
  const who = name || 'Your therapist'
  if (!hours) return HEADER_NOTE_NO_HOURS.replace('{name}', who)
  return HEADER_NOTE.replace('{name}', who).replace('{hours}', hours)
}

export const chat = {
  heading: 'Chat',
  hoursToggleOpen: 'Hide their full week',
  hoursToggleClosed: 'See their full week',

  composerLabel: 'Write a message',
  composerPlaceholder: 'Write as much or as little as you want…',
  send: 'Send',
  sending: 'Sending',

  failed: 'Not sent',
  retry: 'Try again',

  jumpToLatest: 'Jump to latest',
  loadingOlder: 'Loading earlier messages',
  threadStart: 'This is the beginning of your conversation.',

  typing: 'is typing',

  offline: 'Reconnecting — your messages will still send.',

  /**
   * The empty state. It does NOT implement the mandatory first message (§7.1,
   * chunk 7.5) — it explains what this space is for, warmly and without
   * instruction, and 7.5 replaces it with the real opening flow.
   */
  empty: {
    title: 'Nothing here yet',
    body: 'This is where you and {name} talk. Whatever you write stays between the two of you.',
    hint: 'There is no right way to start. A sentence is enough.',
  },

  /** Errors say what happened and what to do, never only what failed. */
  loadError: 'We could not load your conversation. Check your connection and try again.',
  retryLoad: 'Try again',
}

/**
 * THE MANDATORY FIRST MESSAGE — §7.1.
 *
 * Free text, never a structured form: the client chose that deliberately so
 * somebody can express themselves naturally. The four things §7.1 asks them to
 * describe — feelings, emotions, current experience, challenges — appear as
 * PROSE SUGGESTIONS, not as four fields and not as a checklist, because a list
 * of four prompts is a form wearing different clothes.
 *
 * Nothing here instructs, and nothing implies a right answer.
 */
export const opening = {
  eyebrowless: true, // a reminder: no kicker above the heading, ever
  title: 'Say hello, in your own words',

  lead: 'Before you start messaging, {name} would like to hear from you — whatever feels true right now.',

  /** §7.1's four prompts, as one sentence somebody can ignore entirely. */
  suggestions:
    'Some people write about how they have been feeling, what has been happening lately, and what feels hardest at the moment. Others write one line. There is no right way to do this.',

  placeholder: 'Start wherever you like…',

  /**
   * TRUE, and worth saying here of all places.
   *
   * §11 records that an admin conversation viewer was proposed and the client
   * decided AGAINST building it, so nobody but the two of them can read this.
   * If that ever changes, this line changes with it — §11 also requires the
   * capability be disclosed in the privacy policy.
   */
  privacy: 'Only {name} can read your messages.',

  reassurance: 'Take as long as you need. Nothing is sent until you choose to send it.',
  tooShort: 'A few more words, whenever you are ready.',
  send: 'Send to {name}',
  sending: 'Sending…',
  failed: 'That did not send. Nothing you wrote has been lost — try again when you are ready.',
  retry: 'Try again',
}
