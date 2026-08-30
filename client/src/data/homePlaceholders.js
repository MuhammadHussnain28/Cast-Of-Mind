// TODO: PLACEHOLDER — REPLACE BEFORE LAUNCH
//
// ============================================================================
// EVERY TESTIMONIAL, NAME, PORTRAIT AND FIGURE IN THIS FILE IS INVENTED.
//
// Nothing here describes a real person, a real course of therapy, or a real
// number. It exists so the home page can be designed against realistic content
// instead of lorem ipsum, and it is the ONE file that has to be emptied before
// this site goes live.
//
// WHY THIS MATTERS MORE THAN A NORMAL PLACEHOLDER
//
// Two separate risks are stacked in this file, and the second is the sharp one:
//
//   1. Fabricated reviews and invented user counts on a live mental-health
//      platform are a consumer-protection problem in most jurisdictions
//      (misleading advertising) and a serious trust problem if discovered.
//      Master spec §24.7 records this as an explicit warning.
//
//   2. The portraits are photographs of REAL, IDENTIFIABLE PEOPLE, and this
//      file attaches each of them to an invented statement about their own
//      mental health — grief, anger, insomnia, a failing relationship. The
//      Pexels licence permits commercial use of the image; it does not make it
//      acceptable to publish a claim that a named real person was treated for
//      depression. That is a different kind of wrong from fake body copy, and
//      it does not become acceptable because the licence is clean.
//
// Using human portraits as development placeholders was approved by Asad
// (2026-08-29) for the whole project. That approval covers building with them.
// It does not cover shipping them.
//
// BEFORE LAUNCH, one of these must happen:
//   - replace with real testimonials, given with written consent and
//     anonymised, plus real figures; or
//   - delete the Testimonials and Who we help sections entirely.
// Logged under PRE-LAUNCH BLOCKERS in docs/ongoing.md.
// ============================================================================

import portrait1 from '../assets/testimonial-portrait-1.jpg'
import portrait2 from '../assets/testimonial-portrait-2.jpg'
import portrait3 from '../assets/testimonial-portrait-3.jpg'
import portrait4 from '../assets/testimonial-portrait-4.jpg'

/**
 * INVENTED. Written to model the shape real testimonials will have to take.
 *
 * The attribution format is deliberate and should survive the swap: a first
 * name, what the person came for, and how long they have been here. No
 * surnames, no photographs of faces that can be traced back to a specific
 * person's therapy. §24.7 requires real testimonials to be anonymised, so the
 * placeholder is already in the anonymised shape rather than setting a
 * precedent that has to be walked back later.
 *
 * Each quote names something that changed in an ordinary day — sleeping through
 * the night, stopping an argument mid-sentence — because that is what people
 * actually report, and it is far harder to mistake for marketing than "life
 * changing" would be.
 */
export const testimonials = [
  {
    id: 't1',
    quote:
      'I used to lie awake rerunning the same conversation until three in the morning, then write the next day off before it started. My therapist gave me something concrete to do with that loop instead of just riding it out, and I have slept through most nights since February.',
    name: 'Sara',
    context: 'Anxiety and sleep',
    duration: '7 months with Cast of Mind',
    portrait: portrait1,
    // Described rather than empty: these carry meaning, not decoration.
    portraitAlt: 'Sara, seated indoors in warm evening light, looking away from the camera',
  },
  {
    id: 't2',
    quote:
      'After my wife died I kept telling people I was fine, mostly because saying anything else felt like it would take the whole evening and I could not face it. Having one hour a week where that was the actual point meant I stopped carrying it into every other conversation.',
    name: 'Peter',
    context: 'Grief',
    duration: '5 months with Cast of Mind',
    portrait: portrait2,
    portraitAlt: 'Peter, standing at a window in daylight, looking out',
  },
  {
    id: 't3',
    quote:
      'We had the same argument roughly once a fortnight for two years, and afterwards neither of us could explain what it had actually been about. Doing this together meant somebody finally named the pattern out loud, and we have managed to stop it mid-sentence three times now.',
    name: 'Marta and Joris',
    context: 'Couples counselling',
    duration: '11 months with Cast of Mind',
    portrait: portrait3,
    portraitAlt: 'Marta, turning toward soft light from a window',
  },
  {
    id: 't4',
    quote:
      'I had been snapping at my kids over nothing and then feeling wretched about it for the rest of the day, which only made the next time more likely. What helped most was the chat between sessions — writing it down while it was still happening, instead of trying to reconstruct it a week later.',
    name: 'Tom',
    context: 'Stress and anger',
    duration: '4 months with Cast of Mind',
    portrait: portrait4,
    portraitAlt: 'Tom, seated by a window, looking out',
  },
]

/**
 * INVENTED situations, written as plain description rather than as market
 * segments. "People who have never spoken to a therapist before" is something a
 * reader recognises themselves in; "first-time therapy seekers" is something a
 * pitch deck recognises them in.
 *
 * These are safe to keep after launch if Asad is happy with the wording — they
 * make no factual claim about the business. The figures below are the part that
 * has to go.
 */
export const audiences = [
  'People who have never spoken to a therapist before and are quietly unsure whether what they are dealing with counts.',
  'People carrying something they have not said out loud to anyone, including the people closest to them.',
  'Couples who keep having the same argument and cannot find where it starts.',
  'People whose working week looks fine from the outside and whose evenings do not.',
  'People who tried therapy once, years ago, and left before it had a chance to work.',
]

/**
 * Two of these three are INVENTED. One is not, and the distinction is marked on
 * each entry so that whoever clears this file does not delete a true statement
 * along with the false ones.
 */
export const figures = [
  {
    value: '1,200',
    label: 'people supported since we opened',
    invented: true,
  },
  {
    value: '40',
    label: 'therapists practising across 18 countries',
    invented: true,
  },
  {
    // TRUE. The 27 concern tags are fixed and client-confirmed — master spec
    // §15, and server/constants/specialtyTags.js is the authority. Keep this
    // one when the other two are removed.
    value: '27',
    label: 'areas of concern our therapists specialise in',
    invented: false,
  },
]
