/**
 * Home page content — chunk 2.1 (hero and services only).
 *
 * Copy lives here rather than inside components so it can be reviewed and
 * replaced without touching layout. Sections 3-7 (testimonials, who we help,
 * comparison, FAQ) add their own entries here in chunks 2.2 and 2.3.
 *
 * NOTHING IN THIS FILE IS A PLACEHOLDER. Every claim below is drawn from the
 * master spec and is true of the product as specified:
 *   - €200/month, one plan only ..................... master spec §2
 *   - 4 sessions per month, one a week, over Zoom ... master spec §2
 *   - sessions do not carry over ..................... master spec §2, §13
 *   - unlimited chat with the assigned therapist ..... master spec §2, §7.1
 *   - the therapist can read the journal ............. master spec §7.3
 *   - cancel any time, access until period end ....... master spec §13
 *   - matching is specialty-tag overlap only ......... master spec §15
 * If any of these change in the spec, change them here too.
 */

/**
 * The five themes group all 27 concern tags from master spec §15. The 27 tags
 * themselves are fixed and authoritative; these groupings are a presentation
 * layer for the home page ONLY and never touch matching.
 *
 * Every one of the 27 appears exactly once below. If a tag is ever added to the
 * master list, add it to a group here as well, or it silently disappears from
 * this page while still driving matching.
 *
 * The strings below are DISPLAY labels, deliberately not byte-identical to the
 * canonical tags. They are set in sentence case and use "and" where the
 * canonical value uses "&", because ampersands in running text read as
 * abbreviation and this is prose, not a UI control.
 *
 * That is safe here and ONLY here: this page never sends a tag anywhere. The
 * canonical values - the ones the matching engine actually compares - live in
 * server/constants/specialtyTags.js and must never be reworded there, because
 * existing documents hold the old string and would silently stop matching.
 * Verified 2026-08-28: all 27 canonical tags appear below exactly once.
 */
export const concernThemes = [
  {
    id: 'mood',
    name: 'Anxiety and low mood',
    blurb: 'The everyday weight of worry, dread, and flatness.',
    tags: [
      'Anxiety',
      'Depression',
      'Panic attacks',
      'Social anxiety',
      'Stress',
      'Phobias',
      'Speech anxiety',
    ],
  },
  {
    id: 'relationships',
    name: 'Relationships and family',
    blurb: 'The people closest to you, and what happens between you.',
    tags: [
      'Relationship issues',
      'Marriage issues',
      'Divorce',
      'Family issues',
      'Parenting',
      'Children and teens',
    ],
  },
  {
    id: 'trauma',
    name: 'Trauma, abuse and grief',
    blurb: 'What happened, and what it left behind.',
    // "and/or", not "and": someone who experienced abuse but would not use the
    // word trauma about themselves still belongs in this row.
    tags: ['Trauma and/or abuse', 'Domestic violence', 'Grief'],
  },
  {
    id: 'habits',
    name: 'Habits, body and daily life',
    blurb: 'The patterns that run without asking you first.',
    tags: [
      'Addictions',
      'Eating and food disorders',
      'Weight loss',
      'Sleep issues or insomnia',
      'Procrastination',
      'Anger management',
    ],
  },
  {
    id: 'self',
    name: 'Self, work and neurodivergence',
    blurb: 'Who you are, how you work, and how your mind is wired.',
    tags: [
      'Self esteem',
      'Career counselling',
      'ADHD and attention issues',
      'Autism',
      "Alzheimer's",
    ],
  },
]

/** What a subscription actually includes. Master spec §2 and §13. */
export const subscriptionIncludes = [
  'Four therapy sessions a month, one a week, over Zoom.',
  'Unlimited chat with your therapist in between.',
  'Worksheets and a private journal your therapist can read.',
  'Cancel whenever you like. You keep access until the month you paid for ends.',
]

/**
 * Stated plainly rather than buried. Master spec §13 forbids retention dark
 * patterns, and unused sessions being forfeited is the kind of term people
 * should read before paying, not after.
 */
export const subscriptionCaveat = 'Sessions do not roll over into the next month.'

/**
 * Photography credits.
 *
 * Both images are from Pexels under the Pexels License, which permits
 * commercial use with no attribution required. They are recorded here anyway
 * so the origin of every shipped asset is traceable, and so Asad can swap
 * either one for his own photography without hunting through components.
 *
 * EVERY image here was checked for embedded rights metadata before it shipped,
 * and one candidate was rejected because of it: Pexels 15957181 carried an XMP
 * `dc:rights` of "This photos are not for sale. Contact the owner for more
 * info", which contradicts the licence Pexels grants. Almost certainly a stale
 * camera string rather than a real reservation — but a commercial mental health
 * platform should not ship an asset whose own metadata asserts a restriction,
 * so it was replaced rather than argued with. Apply the same check to anything
 * added here later.
 */
export const photoCredits = [
  {
    file: 'home-hero-corner.jpg',
    variants: ['home-hero-corner-800.jpg'],
    source: 'Pexels',
    id: '31893675',
    url: 'https://www.pexels.com/photo/31893675/',
    license: 'Pexels License — free for commercial use, no attribution required',
    rightsMetadata: 'none embedded — checked 2026-08-29',
    use: 'Hero, right-hand panel, under a 12% ink wash',
  },
  {
    file: 'home-window.jpg',
    source: 'Pexels',
    id: '5835536',
    url: 'https://www.pexels.com/photo/red-framed-glass-window-with-white-curtains-5835536/',
    license: 'Pexels License — free for commercial use, no attribution required',
    rightsMetadata: 'none embedded — checked 2026-08-28',
    use: 'Services closing band, under a 14% ink wash',
  },
]

/* ===========================================================================
 * Chunk 2.3 — how it works, comparison, FAQ.
 *
 * Still no placeholders. Every statement below is traceable to the master spec,
 * cited inline. Fabricated content lives in data/homePlaceholders.js and only
 * there.
 * ======================================================================== */

/**
 * The seven-step journey in §24.7 condensed to four for the home page. The full
 * sequence — questionnaire, matching, choose, subscribe, credentials, chat,
 * sessions — belongs to the dedicated /how-it-works page (chunk 2.5), which
 * this section links to rather than duplicating.
 *
 * Numbered on purpose. Section numbering is a default worth refusing on most
 * pages, but this is genuinely a sequence and the order carries information the
 * reader needs — which is the exception §24.7 names explicitly.
 */
export const processSteps = [
  {
    id: 'step-1',
    title: 'Tell us what is going on',
    body: 'A short questionnaire about what you are dealing with. No account, no card, and you can stop at any point.',
  },
  {
    id: 'step-2',
    title: 'See who works with it',
    // §15: matching is specialty-tag overlap, and the client picks from the
    // results — the system never assigns anyone.
    body: 'We match what you are carrying against the areas each therapist specialises in, and show you who fits. You choose.',
  },
  {
    id: 'step-3',
    title: 'Subscribe and get your login',
    // §12: the account is created on webhook confirmation, then credentials are
    // emailed. "Once payment clears" is the honest phrasing of that.
    body: '€200 a month. Your account is created once the payment clears, and your login arrives by email.',
  },
  {
    id: 'step-4',
    title: 'Start talking',
    // §7.1 chat is immediate; §7.4 sessions are therapist-scheduled. Careful
    // not to promise a first session within any particular window.
    body: 'Message your therapist as soon as you are in. Sessions are scheduled with them from there.',
  },
]

/**
 * In-person therapy against this platform.
 *
 * THE BRIEF SAYS CALM AND FACTUAL, NOT COMBATIVE, AND THAT SHAPED EVERY LINE:
 *
 *  - No ticks and crosses. Both columns are sentences, set identically, and
 *    neither is styled as the winner.
 *  - No invented numbers about in-person therapy. Session rates vary by city
 *    and practitioner and this project has no source for them, so the row
 *    describes how the charging works rather than quoting a figure.
 *  - The scheduling row states a REAL LIMITATION OF OURS: the client cannot
 *    book or move a session (§7.4). A comparison table that admits nothing is
 *    the kind nobody believes, and someone who finds this out after paying
 *    would be right to be annoyed.
 */
export const comparisonIntro =
  'In-person therapy works. This is a description of what is different, not a claim that one replaces the other.'

export const comparisonRows = [
  {
    id: 'cost',
    dimension: 'Cost',
    inPerson:
      'Charged per session. The rate varies by city and by practitioner, and each session is billed separately.',
    // §2: €200/month, one plan, 4 sessions + unlimited chat.
    castOfMind:
      '€200 a month, the same wherever you live. Four sessions and unlimited chat in between.',
  },
  {
    id: 'access',
    dimension: 'Getting there',
    inPerson:
      'You travel to an appointment, which limits you to therapists near enough to reach.',
    // §15: country and timezone are never matching filters.
    castOfMind:
      'Anywhere you have a private room and a connection. Your therapist may be in another country.',
  },
  {
    id: 'scheduling',
    dimension: 'Scheduling',
    inPerson:
      'Arranged between you and your therapist, within the hours they hold.',
    // §7.4: view-only for the client. Stated plainly rather than omitted.
    castOfMind:
      'Your therapist schedules each session and you join by link. You cannot book or move a session yourself.',
  },
  {
    id: 'between',
    dimension: 'Between sessions',
    inPerson: 'Usually nothing until the next appointment.',
    // §7.1: messages wait when the therapist is offline; no blocking state.
    castOfMind:
      'Unlimited chat. If your therapist is offline your message waits — it is not lost.',
  },
]

/**
 * The hesitations someone actually has before paying €200 to talk to a stranger
 * on the internet, answered plainly. Cost, privacy, legitimacy, fit,
 * cancellation — plus one the brief did not ask for.
 *
 * THE CRISIS ANSWER IS IN AT THE DEVELOPER'S DECISION (2026-08-29) and it
 * matters more than the other five. A mental health site with no word about
 * emergencies has a duty-of-care gap, and someone at 2am is a realistic visitor
 * to this page. It is written to three rules: say plainly that this is not an
 * emergency service, point to services that are, and invent no phone numbers.
 * A wrong helpline number on a crisis answer is worse than no answer at all,
 * which is why it names no specific line and defers to local emergency numbers.
 * It offers no clinical advice of any kind.
 */
export const faqItems = [
  {
    id: 'faq-cost',
    question: 'How much is it, and what am I paying for?',
    // §2 and §13.
    answer:
      '€200 a month. There is one plan and no tiers. It covers four therapy sessions one a week, over Zoom and unlimited chat with your therapist in between. Unused sessions do not roll over into the next month, which we would rather you know now than discover later.',
  },
  {
    id: 'faq-privacy',
    question: 'Who can see what I write?',
    // §7.3 requires a visible transparency note about journal access; §11
    // records that no admin conversation-viewing feature exists.
    answer:
      'Your therapist can see your messages, your journal entries and any worksheet you send back. Nobody else can. There is no administrator view of conversations anywhere in this platform. Your journal is visible to your assigned therapist by design rather than by accident it exists so they can read what you could not say out loud, and we would rather state that plainly than let you assume otherwise.',
  },
  {
    id: 'faq-real',
    question: 'Is this real therapy?',
    // §23 eligibility: MA/MS/MSW/Psy/PhD, 2 years or 1000 hours, malpractice
    // insurance, no disciplinary actions in 10 years. All verified by the admin
    // before an account exists.
    answer:
      'Yes. Every therapist here holds a masters or a doctorate in counselling, clinical psychology or a related field, has at least two years of practice behind them, carries professional liability insurance, and has had no disciplinary action in the past decade. All of that is checked before they are given an account. The format is different from a room with two chairs. The work is not.',
  },
  {
    id: 'faq-fit',
    question: 'What if my therapist turns out not to be right for me?',
    // §2: the client cannot switch in-app; they contact the business, and Asad
    // handles it manually. Said outright rather than glossed.
    answer:
      'You cannot switch from inside the site, and we would rather tell you that here than let you find out when you go looking for the button. Contact us by email or phone and we will arrange it. A poor fit is common and it is nobody’s fault not yours and not your therapist’s. It is a reason to change who you are talking to, not a reason to stop.',
  },
  {
    id: 'faq-cancel',
    question: 'What if I need to cancel?',
    // §13: cancel from the portal, access retained to period end, all data
    // preserved. §20 forbids retention dark patterns.
    answer:
      'Cancel from your account whenever you like. There is no phone call, no exit survey and no offer designed to keep you. You keep full access until the end of the month you have already paid for. Your chat history, journal entries and worksheets stay exactly where they are, so if you come back later you pick up where you left off.',
  },
  {
    id: 'faq-crisis',
    question: 'What if I am in crisis right now?',
    answer:
      'Cast of Minds is not an emergency service, and your therapist will not see a message immediately if they are offline. If you are in immediate danger, or you are thinking about harming yourself, please contact your local emergency number or a crisis line in your country now. Those services are staffed around the clock and this is exactly what they are there for. Therapy alongside that is still worth having, and this will still be here afterwards.',
  },
]
