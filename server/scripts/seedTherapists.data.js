// Fake therapists for local testing. DEVELOPMENT ONLY — see seedTherapists.js,
// which refuses to run against production.
//
// DESIGNED SO EVERY MATCHING SCENARIO IS OBSERVABLE:
//
//  - Both genders appear inside every tag cluster, so the gender sort visibly
//    reorders rather than appearing to do nothing.
//  - Overlap counts differ within a cluster, so best-fit-first is visible.
//  - Countries and treatment orientations vary wildly, proving they never
//    filter (§15).
//  - THREE TAGS ARE DELIBERATELY UNUSED by every therapist below:
//        Career Counselling · Weight Loss · Speech Anxiety
//    Choose those three in the questionnaire and NOTHING overlaps, which is the
//    only way to see the silent fallback. If a tag is ever added here, keep
//    those three free or that scenario becomes untestable.

export const SEED_EMAIL_DOMAIN = 'seed.castofmind.test';

/** Never resolves — `.test` is reserved (RFC 2606), so no real mail can collide. */
export const seedEmail = (slug) => `${slug}@${SEED_EMAIL_DOMAIN}`;

// Obvious grey placeholders rather than portraits of real people. Blocker 11
// exists because invented credentials were attached to real faces once already;
// these are unmistakably fake, which is the honest choice for throwaway data.
const photo = (name) =>
  `https://placehold.co/400x500/F4F2F7/19122B?text=${encodeURIComponent(name)}`;

const hours = {
  monday: { enabled: true, start: '09:00', end: '17:00' },
  tuesday: { enabled: true, start: '09:00', end: '17:00' },
  wednesday: { enabled: true, start: '09:00', end: '17:00' },
  thursday: { enabled: true, start: '09:00', end: '17:00' },
  friday: { enabled: true, start: '09:00', end: '15:00' },
  saturday: { enabled: false, start: '', end: '' },
  sunday: { enabled: false, start: '', end: '' },
  note: '',
};

const base = {
  streetAddress: '1 Example Street',
  stateProvince: 'Example region',
  zipPostal: '00000',
  credentialType: 'Diploma/Degree',
  yearsExperience: 8,
  educationSummary: 'Seeded record for local testing. Not a real practitioner.',
  currentWorkSituation: 'Seeded record for local testing.',
  licensingStatus: 'Seeded record — not licensed to accept anyone.',
  disciplinaryActions: false,
  malpracticeInsurance: true,
  workingHours: hours,
  // Required on the model. A seeded therapist has no real credential document;
  // an obviously-fake URL is more honest than borrowing a real one.
  certificateUrl1: 'https://placehold.co/600x800?text=Seed+certificate',
};

export const SEED_THERAPISTS = [
  // ---- Cluster A: anxiety and low mood. Both genders, differing overlap. ----
  {
    slug: 'marta-kowalska',
    title: 'Dr.', firstName: 'Marta', lastName: 'Kowalska', gender: 'female',
    dateOfBirth: '1985-04-12', country: 'Poland', city: 'Kraków', timezone: 'Europe/Warsaw',
    therapistType: 'Clinical Psychologist', credentialInitials: 'PhD',
    languages: ['Polish', 'English'],
    specialtyTags: ['Anxiety', 'Depression', 'Panic Attacks', 'Stress'],
    treatmentOrientations: ['CBT', 'Mindfulness'],
    bio: 'Seeded test therapist. Works with anxiety, low mood and the physical side of panic.',
  },
  {
    slug: 'joris-de-vries',
    title: 'Mr.', firstName: 'Joris', lastName: 'de Vries', gender: 'male',
    dateOfBirth: '1979-09-30', country: 'Netherlands', city: 'Utrecht', timezone: 'Europe/Amsterdam',
    therapistType: 'Psychotherapist', credentialInitials: 'MSc',
    languages: ['Dutch', 'English', 'German'],
    specialtyTags: ['Anxiety', 'Depression', 'Social Anxiety'],
    treatmentOrientations: ['ACT', 'Existential Therapy'],
    bio: 'Seeded test therapist. Long-term work with anxiety and social withdrawal.',
  },
  {
    slug: 'amara-okafor',
    title: 'Ms.', firstName: 'Amara', lastName: 'Okafor', gender: 'female',
    dateOfBirth: '1990-01-22', country: 'Nigeria', city: 'Lagos', timezone: 'Africa/Lagos',
    therapistType: 'Counselling Psychologist', credentialInitials: 'MA',
    languages: ['English', 'Igbo'],
    specialtyTags: ['Anxiety', 'Self Esteem', 'Phobias'],
    treatmentOrientations: ['Humanistic Therapy', 'Art Therapy', 'Play Therapy'],
    bio: 'Seeded test therapist. Confidence, fear and the beliefs underneath them.',
  },

  // ---- Cluster B: relationships and family. Both genders. ----
  {
    slug: 'sofia-almeida',
    title: 'Mrs.', firstName: 'Sofia', lastName: 'Almeida', gender: 'female',
    dateOfBirth: '1982-06-05', country: 'Portugal', city: 'Porto', timezone: 'Europe/Lisbon',
    therapistType: 'Family and Couples Therapist', credentialInitials: 'M.Phil',
    languages: ['Portuguese', 'Spanish', 'English'],
    specialtyTags: ['Marriage Issues', 'Relationship Issues', 'Divorce', 'Family Issues'],
    treatmentOrientations: ['Couples Therapy', 'Emotionally Focused', 'Family Therapy'],
    bio: 'Seeded test therapist. Couples, separation and the family around it.',
  },
  {
    slug: 'daniel-okonkwo',
    title: 'Mr.', firstName: 'Daniel', lastName: 'Okonkwo', gender: 'male',
    dateOfBirth: '1988-11-14', country: 'Canada', city: 'Toronto', timezone: 'America/Toronto',
    therapistType: 'Marriage and Family Therapist', credentialInitials: 'MSW',
    languages: ['English', 'French'],
    specialtyTags: ['Relationship Issues', 'Parenting', 'Children & Teens'],
    treatmentOrientations: ['Family Therapy', 'Behavioral Therapy'],
    bio: 'Seeded test therapist. Parents, teenagers and the friction between them.',
  },

  // ---- Cluster C: trauma and grief. Both genders. ----
  {
    slug: 'hannah-reeves',
    title: 'Dr.', firstName: 'Hannah', lastName: 'Reeves', gender: 'female',
    dateOfBirth: '1976-02-18', country: 'United Kingdom', city: 'Bristol', timezone: 'Europe/London',
    therapistType: 'Trauma Specialist', credentialInitials: 'PhD',
    languages: ['English'],
    specialtyTags: ['Trauma and/or Abuse', 'Domestic Violence', 'Grief', 'Anxiety'],
    treatmentOrientations: ['EMDR', 'Trauma Focused', 'DBT'],
    bio: 'Seeded test therapist. Trauma, its aftermath, and grief that will not settle.',
  },
  {
    slug: 'yusuf-demir',
    title: 'Mr.', firstName: 'Yusuf', lastName: 'Demir', gender: 'male',
    dateOfBirth: '1983-07-09', country: 'Türkiye', city: 'Izmir', timezone: 'Europe/Istanbul',
    therapistType: 'Psychotherapist', credentialInitials: 'MS',
    languages: ['Turkish', 'English'],
    specialtyTags: ['Grief', 'Trauma and/or Abuse', 'Sleep Issues or Insomnia'],
    treatmentOrientations: ['Psychodynamic Therapy', 'Mindfulness'],
    bio: 'Seeded test therapist. Loss, and the sleep it takes away.',
  },

  // ---- Cluster D: habits and neurodivergence. Rare tags, so a client picking
  //      these sees a short, specific list rather than the whole roster. ----
  {
    slug: 'priya-raman',
    title: 'Ms.', firstName: 'Priya', lastName: 'Raman', gender: 'female',
    dateOfBirth: '1992-03-27', country: 'India', city: 'Bengaluru', timezone: 'Asia/Kolkata',
    therapistType: 'Clinical Psychologist', credentialInitials: 'M.Phil',
    languages: ['English', 'Tamil', 'Hindi'],
    specialtyTags: ['ADHD & Attention Issues', 'Autism', 'Procrastination'],
    treatmentOrientations: ['CBT', 'Life Coaching'],
    bio: 'Seeded test therapist. Attention, routine and how a differently wired mind works.',
  },
  {
    slug: 'tom-jansen',
    title: 'Mr.', firstName: 'Tom', lastName: 'Jansen', gender: 'male',
    dateOfBirth: '1974-12-02', country: 'Australia', city: 'Perth', timezone: 'Australia/Perth',
    therapistType: 'Addiction Counsellor', credentialInitials: 'MA',
    languages: ['English'],
    specialtyTags: ['Addictions', 'Anger Management', 'Eating & Food Disorders'],
    treatmentOrientations: ['Intervention', 'Group Therapy', 'Behavioral Therapy'],
    bio: 'Seeded test therapist. Addiction, anger and eating — the patterns that run themselves.',
  },
  {
    slug: 'elena-rossi',
    title: 'Prof.', firstName: 'Elena', lastName: 'Rossi', gender: 'female',
    dateOfBirth: '1968-08-16', country: 'Italy', city: 'Bologna', timezone: 'Europe/Rome',
    therapistType: 'Neuropsychologist', credentialInitials: 'PhD',
    languages: ['Italian', 'English'],
    specialtyTags: ["Alzheimer's", 'Grief', 'Family Issues'],
    treatmentOrientations: ['Cognitive Therapy', 'Family Therapy'],
    bio: 'Seeded test therapist. Memory conditions, and the families living alongside them.',
  },
].map((therapist) => ({
  ...base,
  ...therapist,
  email: seedEmail(therapist.slug),
  photoUrl: photo(`${therapist.firstName} ${therapist.lastName}`),
}));

/** Tags no seeded therapist carries — choose these to see the silent fallback. */
export const UNMATCHED_TAGS = Object.freeze([
  'Career Counselling',
  'Weight Loss',
  'Speech Anxiety',
]);
