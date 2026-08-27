// Concern / specialty tags — the fixed master list. 27 items, confirmed by Asad.
// Source of truth: master spec Section 15, and docs/ongoing.md decision #2.
//
// THIS LIST DRIVES MATCHING. Clients pick 3-4 as `concernTags`; therapists pick
// 3-4 as `specialtyTags`; a match is an overlap between the two. Both sides MUST
// select from this one list — a free-text specialty would never match anything.
//
// Values are stored in the database verbatim as written here. Do not reword,
// re-case, or re-punctuate an entry: existing documents hold the old string and
// would stop matching. Adding or removing entries is a client decision, not a
// developer one — the client has confirmed this list is fixed.
//
// Note on spelling: "Career Counselling" here is the British double-L spelling,
// while treatmentOrientations.js has "Career Counseling" with a single L. Both
// are verbatim from the spec. This is not a typo — do not "fix" either one.
//
// Earlier draft prose in the spec called this "30+ terms" and used OCD as an
// example. OCD is NOT in the final approved list. This enumeration is authoritative.

export const SPECIALTY_TAGS = Object.freeze([
  'Anger Management',
  'Anxiety',
  'Career Counselling',
  'Depression',
  'Family Issues',
  'Social Anxiety',
  'Stress',
  'Panic Attacks',
  'Procrastination',
  'Sleep Issues or Insomnia',
  'Self Esteem',
  'Relationship Issues',
  'Trauma and/or Abuse',
  'Parenting',
  'Weight Loss',
  'Addictions',
  'ADHD & Attention Issues',
  "Alzheimer's",
  'Autism',
  'Children & Teens',
  'Divorce',
  'Domestic Violence',
  'Eating & Food Disorders',
  'Grief',
  'Marriage Issues',
  'Phobias',
  'Speech Anxiety',
]);

// Selection limits are symmetrical on both sides — master spec Section 6.
export const SPECIALTY_TAGS_MIN = 3;
export const SPECIALTY_TAGS_MAX = 4;
