/**
 * Every word the intake flow says. One file per feature, per the project's
 * content rule — nothing is written inline in a component.
 *
 * ALL OF IT IS TRUE. No invented timelines, no claims about who can see what
 * beyond what the spec actually says. Each reassurance line is cited.
 */

export const asideCopy = {
  soFar: 'So far',
  // §12: the account is created on webhook confirmation, never before. Nothing
  // is taken at any point in this questionnaire.
  noCharge: 'Nothing is charged until you choose a therapist and subscribe.',
  empty: 'Your answers will appear here as you go.',
}

export const screens = {
  type: {
    heading: 'Who is this for?',
    reassurance: 'This changes what we ask next.',
  },

  about: {
    heading: 'Tell us a little about you',
    // §9.4 gives the admin sight of questionnaire responses too, so this
    // deliberately does NOT say "nobody else". It says only what is certain.
    reassurance: 'Your therapist sees this once you are matched.',
    nameLabel: 'Your name',
    namePlaceholder: 'What you would like to be called',
    ageLabel: 'Age',
    genderLabel: 'Gender',
    // The therapist-preference question comes later (§6), and people conflate
    // the two. Saying so here costs one line and prevents a wrong answer.
    genderHelper: 'This is about you. You can state a preference for your therapist later.',
  },

  // ---------- Couple branch only (chunk 5.3) ----------
  partner1: {
    heading: 'Tell us about the first of you',
    reassurance: 'Whoever goes first — it makes no difference to anything.',
  },

  partner2: {
    heading: 'And the second of you',
    // Filled in with the first partner's name at render, so the screen confirms
    // what was already captured instead of asking twice for the same person.
    reassurance: 'You have told us about {name}. This is the other of you.',
    reassuranceFallback: 'This is the other of you.',
  },

  location: {
    heading: 'Where are you based?',
    // §15, and this is the reassuring part: country and timezone are NEVER
    // matching filters. Worth saying plainly to someone in a small country.
    reassurance:
      'Used for your records, and to show session times in your own clock. It never limits which therapists you can see.',
    countryLabel: 'Country',
    cityLabel: 'City',
    cityPlaceholder: 'The town or city you live in',
    couple: {
      heading: 'Where are you both based?',
      reassurance:
        'Used for your records, and to show session times in your own clock. It never limits which therapists you can see.',
    },
  },

  relationship: {
    heading: 'What is your relationship status?',
    reassurance:
      'It helps your therapist understand your situation. Choose “Prefer not to say” if you would rather not.',
    couple: {
      heading: 'How would you describe your relationship?',
      reassurance:
        'It helps your therapist understand where you are. Choose “Prefer not to say” if you would rather not.',
    },
  },

  // ---------- The emotional core of the flow (§24.7) ----------
  concerns: {
    heading: 'What would you like help with?',
    // The stakes are what make this screen hard. Lowering them is the job.
    reassurance:
      'You do not have to be certain. Your therapist will help you make sense of it.',
    searchLabel: 'Search concerns',
    searchPlaceholder: 'Search, or just browse below',
    chosenHeading: 'What you have named',
    chosenEmpty: 'Nothing chosen yet.',
    // §6: "3–4 tags (minimum 1)". The floor is one; the rest is an offer.
    limitHelp: 'Choose up to four. One is enough.',
    nudge: 'You can add one or two more if others fit.',
    atLimit: 'That is four. Remove one to swap it.',
    removeLabel: 'Remove',
    // Someone will search a word the fixed list does not carry — OCD is the
    // obvious one, and it was deliberately dropped from the approved 27. This
    // must never be a dead end.
    noMatchHeading: 'We do not have that exact word',
    noMatchBody:
      'The list is fixed, so it will not cover everything. Choose whatever is closest, or leave it — you can describe it in your own words to your therapist.',
    clearSearch: 'Clear search',
  },

  preference: {
    heading: 'Would you prefer a particular therapist?',
    // §15, and it removes the real fear — that choosing narrows the list.
    reassurance:
      'Whatever you choose, you will still see every therapist who works with what you named. It changes the order, not who appears.',
  },

  contact: {
    heading: 'Where should we send your login details?',
    // §12's golden rule, stated to the person it protects.
    reassurance:
      'This becomes your login if you subscribe. No account is created until a payment succeeds.',
    emailLabel: 'Email address',
    emailPlaceholder: 'you@example.com',
    couple: {
      heading: 'Where should we send your login details?',
      // The moment the one-account rule is literally true (§6), so it is stated
      // here in full rather than left to the card they chose six screens ago.
      reassurance:
        'One login for both of you — you will both sign in with this address. No account is created until a payment succeeds.',
    },
  },
}

/** Copy for the two partner screens and the pair diagram. */
export const partners = {
  firstLabel: 'First of you',
  secondLabel: 'Second of you',
  slotFillingNow: 'Filling in now',
  slotWaiting: 'Next',
  // §6, confirmed by Asad: one users record, one clientProfile, one booking,
  // one subscription. Said at the point the pair is visibly being formed.
  oneAccount: 'One account for both of you',
  nameLabel: 'Name',
  namePlaceholder: 'What they would like to be called',
  ageLabel: 'Age',
  genderLabel: 'Gender',
}

/**
 * The branch question. Each option says what it commits you to — the couple
 * card carries the one-account rule (§6) at the moment it is chosen, rather
 * than surprising them at checkout.
 */
export const clientTypeOptions = [
  {
    value: 'individual',
    icon: 'person',
    label: 'Just me',
    blurb: 'One person, one therapist.',
  },
  {
    value: 'couple',
    icon: 'couple',
    label: 'My partner and me',
    blurb: 'You share one account, one login and one therapist.',
  },
]

export const nav = {
  back: 'Back',
  continue: 'Continue',
  startOver: 'Start over',
}

/** The review screen, one past the last question. */
export const review = {
  heading: 'Before we show you therapists',
  reassurance: 'Have a look over your answers. You can change anything from here.',
  edit: 'Edit',
  sections: {
    type: 'Who this is for',
    about: 'About you',
    partner1: 'First of you',
    partner2: 'Second of you',
    location: 'Where you are',
    relationship: 'Relationship status',
    concerns: 'What you named',
    preference: 'Therapist preference',
    contact: 'Email',
  },
  // §12 again, at the last moment before the flow hands over to matching.
  next: 'Next you will see therapists who work with what you named. Nothing is charged until you choose one and subscribe.',
  submit: 'See your matches',
}
