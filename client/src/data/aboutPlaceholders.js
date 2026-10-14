// TODO: PLACEHOLDER — REPLACE BEFORE LAUNCH
//
// ============================================================================
// EVERY NAME, FACE, BIOGRAPHY AND QUALIFICATION IN THIS FILE IS INVENTED.
//
// Nothing here describes a real employee, a real degree, or a real licence.
// It exists so the About page can be designed against realistic content, and
// it is the ONE file that has to be emptied before this site goes live.
//
// ---------------------------------------------------------------------------
// THE QUALIFICATIONS ARE THE SHARP PART. READ THIS BEFORE EDITING.
// ---------------------------------------------------------------------------
//
// Two entries below carry clinical credentials — an "MSc in Clinical
// Psychology", a "BACP-accredited" line, registration-body wording. The
// developer asked for realistic placeholder qualifications (2026-08-31) on the
// grounds that they build credibility in the design and will be replaced with
// real ones before launch. That decision is recorded and this file follows it.
//
// What that means in practice, stated plainly so nobody has to reconstruct it:
//
//   A named person with a clinical title on a mental health platform is an
//   IMPLIED CREDENTIAL CLAIM. A visitor reading "Clinical Lead, MSc" reasonably
//   concludes that qualified clinical governance exists at this company. If
//   that reaches production before it is true, it is closer to a regulatory
//   misstatement than to placeholder copy, and professional bodies named in it
//   (BACP and similar) protect their accreditation wording.
//
//   It is also attached to a REAL PERSON'S FACE. Each portrait is a photograph
//   of an identifiable human being who has not agreed to be presented as this
//   company's Clinical Lead, and certainly not as holding a degree they may not
//   hold. The Pexels licence permits commercial use of the image. It does not
//   make that claim acceptable.
//
// None of this is a reason not to build with it. It is the reason blocker 11 in
// docs/ongoing.md exists and why this comment is this long.
//
// BEFORE LAUNCH, one of these must happen:
//   - replace every field below with the real team, their real roles, their
//     real qualifications and their own photographs, with their consent; or
//   - remove the founder and team sections from /about entirely.
// ============================================================================

import portrait1 from '../assets/team-portrait-1.jpg'
import portrait2 from '../assets/team-portrait-2.jpg'
import portrait3 from '../assets/team-portrait-3.jpg'
import portrait4 from '../assets/team-portrait-4.jpg'
import portrait5 from '../assets/team-portrait-5.jpg'

/**
 * INVENTED. The founding story.
 *
 * Written in the THIRD PERSON and carrying no quotation marks, deliberately.
 * Asad is a real, named person — unlike the invented clients quoted on the home
 * page — so a fabricated first-person quote attributed to him would be
 * misattribution rather than placeholder copy. Third person says the same thing
 * and leaves nothing to retract. Approved 2026-08-31.
 */
export const founder = {
  name: 'Asad',
  role: 'Founder',
  portrait: portrait1,
  portraitAlt: 'Asad, founder of Cast of Minds',
  lede: 'Cast of Minds began with a wait.',
  body: [
    'Asad founded Cast of Minds after watching someone close to him spend four months on a waiting list, then travel two hours for a fifty-minute appointment with a therapist who did not work with what he was actually dealing with. Nothing about that had gone wrong administratively. It was simply how the system worked.',
    'The company exists to remove the three obstacles in that story: the wait, the journey, and the mismatch. A person describes what they are carrying, sees therapists who specialise in exactly that, and chooses one. Where either of them happens to live never enters into it.',
    'He is deliberately not a clinician, and Cast of Minds is built so that he does not need to be. Clinical judgement belongs to the therapists; his job is to make sure the platform never gets in their way, and never asks a client to explain themselves twice.',
  ],
}

/**
 * INVENTED — names, roles, biographies and every qualification.
 *
 * Asad appears here as well as in his own section above. That is deliberate:
 * /team redirects to this grid, so it has to read as a complete team on its
 * own. Approved 2026-08-31.
 */
export const team = [
  {
    id: 'founder',
    name: 'Asad',
    role: 'Founder',
    credential: null,
    bio: 'Runs the business and owns everything that is not a clinical decision — partnerships, pricing, and the standard the platform is held to.',
    portrait: portrait1,
    portraitAlt: 'Asad, founder',
  },
  {
    id: 'clinical-lead',
    name: 'Dr Miriam Vance',
    role: 'Clinical Lead',
    // INVENTED CREDENTIAL — see the warning at the top of this file.
    credential: 'PhD Clinical Psychology · HCPC registered',
    bio: 'Reviews every therapist application before an account is created, and sets the clinical standards the platform holds its practitioners to. She is the reason an application takes days rather than minutes.',
    portrait: portrait2,
    portraitAlt: 'Miriam Vance, Clinical Lead',
  },
  {
    id: 'senior-counsellor',
    name: 'Yuna Park',
    role: 'Senior Counsellor',
    // INVENTED CREDENTIAL — see the warning at the top of this file.
    credential: 'MSc Counselling Psychology · BACP accredited',
    bio: 'Works with clients directly and supports newer therapists on the platform. Her particular interest is the first fortnight of therapy, which is where most people decide whether to continue.',
    portrait: portrait3,
    portraitAlt: 'Yuna Park, Senior Counsellor',
  },
  {
    id: 'client-care',
    name: 'Elena Marchetti',
    role: 'Client Care Lead',
    credential: null,
    bio: 'The person on the other end of the contact form. Handles matching questions, billing, and the awkward conversation about changing therapist — which she would rather you had than quietly leave.',
    portrait: portrait4,
    portraitAlt: 'Elena Marchetti, Client Care Lead',
  },
  {
    id: 'operations',
    name: 'Tomas Reyes',
    role: 'Operations Lead',
    credential: null,
    bio: 'Keeps sessions, scheduling and payments working across every time zone the platform operates in, so that neither client nor therapist has to think about any of it.',
    portrait: portrait5,
    portraitAlt: 'Tomas Reyes, Operations Lead',
  },
]

/**
 * Portrait credits. All five metadata-screened for embedded rights strings
 * before use, as with every other photograph on this site. Three candidates
 * were rejected outright for carrying `dc:rights` or `dc:creator`.
 */
export const teamPhotoCredits = [
  { file: 'team-portrait-1.jpg', source: 'Pexels', id: '34947154' },
  { file: 'team-portrait-2.jpg', source: 'Pexels', id: '6180966' },
  { file: 'team-portrait-3.jpg', source: 'Pexels', id: '31085325' },
  { file: 'team-portrait-4.jpg', source: 'Pexels', id: '20147827' },
  { file: 'team-portrait-5.jpg', source: 'Pexels', id: '7956492' },
]
