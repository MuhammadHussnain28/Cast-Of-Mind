/**
 * Copy for /join-as-therapist.
 *
 * Every claim below traces to the master spec — nothing invented. Sources are
 * named inline so a future reader can check them rather than trust them.
 *
 * ONE EXCEPTION, flagged in docs/ongoing.md: the compensation line is the
 * developer's approved wording (2026-09-02) and deliberately states no
 * percentage. The 40/60 split is an offline arrangement (§2) and publishing a
 * figure would commit the business. Asad should confirm the wording.
 */

export const intro = {
  eyebrowless: true,
  heading: 'Practise where the work is the whole job.',
  lede: '"No caseload targets. No dashboards ranking you against other clinicians."',
  body:
    'Cast of Minds matches people to you by what they are actually dealing with, then gets out of the way. You set your hours, you schedule the sessions, and what happens between you and your client stays between you and your client.',
}

/** Why practise here — each traces to a spec section. */
export const propositions = [
  {
    id: 'matched',
    icon: 'Overlap',
    title: 'Clients arrive matched to you',
    body:
      'People choose from therapists whose specialties overlap what they came for. No cold enquiries, no triage queue.',
    source: '§15 matching engine',
  },
  {
    id: 'private',
    icon: 'Lock',
    title: 'Nobody here reads your sessions',
    body:
      'There is no admin conversation viewer on this platform. Your clinical notes are stored apart from anything a client can reach.',
    source: '§11, §8.5',
  },
  {
    id: 'hours',
    icon: 'Clock',
    title: 'Your week, your terms',
    body:
      'You set the days and hours you work, and you decide when each session happens. Clients cannot book or move a session themselves.',
    source: '§7.4, §23 working hours',
  },
  {
    id: 'pay',
    icon: 'Steady',
    title: 'Competitive compensation',
    body:
      'Competitive compensation are guaranteed. Payment is handled directly by the business, outside the platform.',
    source: 'developer-approved wording, 2026-09-02',
  },
]

/** Eligibility — verbatim from master spec §23. Do not soften this wording. */
export const eligibility = {
  heading: 'Before you begin',
  openingLine: 'You may apply from anywhere in the world.',
  requirements: [
    {
      id: 'qualification',
      icon: 'Certificate',
      text: 'MA, MS, MSW, Psy. or PhD in counselling, clinical psychology, or a related mental health field',
    },
    {
      id: 'experience',
      icon: 'Hours',
      text: 'At least 2 years, and/or 1000 hours, of providing counselling services',
    },
    {
      id: 'insurance',
      icon: 'Shield',
      text: 'A professional malpractice liability insurance policy meeting your country’s minimum cover',
    },
    {
      id: 'record',
      icon: 'Clean',
      text: 'No disciplinary actions in the past 10 years',
    },
    {
      id: 'supervision',
      icon: 'Independent',
      text: 'Fully qualified , we do not accept interns or anyone still requiring supervision',
    },
  ],
  footnote:
    'We check every one of these. Applying without them is time neither of us gets back.',
}

export const steps = [
  { number: 1, label: 'Personal details', short: 'You' },
  { number: 2, label: 'Location and availability', short: 'Where' },
  { number: 3, label: 'Professional background', short: 'Training' },
  { number: 4, label: 'Practice and specialties', short: 'Practice' },
  { number: 5, label: 'Compliance and documents', short: 'Proof' },
]

export const stepIntros = {
  1: 'This becomes your login. The name and photo are what clients see when they choose a therapist.',
  2: 'Your address stays private. Your timezone and working hours are shown to clients so they know when you are reachable.',
  3: 'Your qualifications and experience. Our team reads this in full before deciding.',
  4: 'The two lists below do different jobs. Specialties decide who reaches you; orientations describe how you work.',
  5: 'The last step. Your documents are stored privately and are only ever opened by our review team.',
}

/** The review screen, shown after step 5 and before submitting. */
export const review = {
  heading: 'Check it over',
  intro:
    'Everything you have entered, in one place. Edit any section and you will come back here.',
}

/**
 * Confirmation copy. Developer-approved wording, 2026-09-03.
 *
 * NO TIMELINE. §24.7 asks for "roughly when", but no turnaround has been agreed
 * and a missed promise reads worse than none — the same call made for the
 * emails in chunk 3.2. Replace `next` if Asad ever sets a real one.
 */
export const submitted = {
  heading: 'Your application is in.',
  next:
    'A person reads your application in full. We review them in the order they arrive, and you will receive an email confirmation.',
  reference:
    'Keep this if you need to ask us about your application. There is nothing you need to do with it otherwise.',
  closing:
    'You can close this page. Nothing else is needed from you for now.',
}

/** Starting suggestions only — the picker also takes any language typed in. */
export const commonLanguages = [
  'English',
  'Spanish',
  'French',
  'German',
  'Portuguese',
  'Arabic',
  'Mandarin',
  'Hindi',
  'Urdu',
  'Russian',
  'Italian',
  'Dutch',
  'Turkish',
  'Polish',
  'Bengali',
  'Japanese',
]
