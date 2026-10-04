/**
 * About page — the parts that are TRUE.
 *
 * Everything invented (the founder's story, the team, their names, faces and
 * qualifications) lives in data/aboutPlaceholders.js and only there. This file
 * holds statements of purpose and design philosophy, which make no factual
 * claim about people, numbers, outcomes or credentials, and are therefore safe
 * to ship as written.
 *
 * The one thing to watch when editing: keep it to what the company INTENDS and
 * how the product WORKS. The moment a line starts describing how many people
 * do something, or how well it works, it has become a claim and belongs under
 * the same scrutiny as the placeholder file.
 */

/** Statement of purpose. No statistics, no outcome claims. */
export const mission = {
  heading: 'Why Cast of Minds exists?',
  lede: '" The distance between deciding to get help and actually getting it is too long. "',
  body: [
    'Distance, wait lists, and the exhaustion of starting over with the wrong specialist. Traditional therapy demands too much resilience exactly when you have the least to give.',
    'Cast of Mind dismantles these barriers. Tell us what you are navigating, review exact-fit specialists, and choose your therapist. Geography never dictates your care.',
  ],
  // body: [
  //   'Too far to travel. Too long to wait. And at the end of it, too easy to be matched with someone who does not work with the thing you actually came about — which means starting over, and explaining yourself again, at the point where most people have the least left to give.',
  //   'Cast of Mind is built to remove those three obstacles and nothing else. You describe what you are carrying, you see the therapists who specialise in exactly that, and you choose one. Where either of you happens to live never enters into it.',
  // ],
}

/**
 * The mark, and what it is for. Master spec §24.5 describes the logo as a brain
 * outline whose lower contour resolves into a trunk and roots — this section
 * explains that rather than restating it.
 */
export const brand = {
  heading: 'A mind that turns into a tree.',
  body: [
    'The upper contour is a brain. Follow the line down and it becomes a trunk, then roots.',
    'It is drawn that way because therapy is not repair work. Nothing is being fixed, replaced, or returned to how it was. What changes is slower and far less visible than that something grows, mostly below the surface, and the part anyone else can see arrives last.',
  ],
  /** How the brand is held, expressed as commitments rather than adjectives. */
  principles: [
    {
      id: 'calm',
      title: 'Calm before persuasion',
      body: 'Nothing on this site counts down, pressures, or tries to close you. If you leave to think about it, that was a reasonable thing to do.',
    },
    {
      id: 'plain',
      title: 'Plain language, not clinical language',
      body: 'You should never need a glossary to understand what you are being offered or what it costs.',
    },
    {
      id: 'effort',
      title: 'Never more effort than necessary',
      body: 'Someone in distress should not have to work hard to use a website. Every extra step is a place to lose them.',
    },
  ],
}
