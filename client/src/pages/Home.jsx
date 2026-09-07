import Hero from '../components/home/Hero'
import Services from '../components/home/Services'
import Testimonials from '../components/home/Testimonials'
import HowItWorks from '../components/home/HowItWorks'
import WhoWeHelp from '../components/home/WhoWeHelp'
import Comparison from '../components/home/Comparison'
import Faq from '../components/home/Faq'
import Hero1 from '../components/home/Hero1'

/*
 * ---------------------------------------------------------------------------
 * DIRECTION CONTRACT — Home, chunk 2.1 (hero + services)
 *
 * THESIS: The page inhales. One continuous lightening from ink to paper, and a
 *   refusal of the three-column icon-card grid every therapy site ships as
 *   "services" — five kinds of human difficulty are not five identical boxes.
 *
 * OWN-WORLD: The approved Cast of Mind tokens only, no additions. Photographs
 *   under an ink wash; full-bleed grounds instead of containers below the fold;
 *   Fraunces at display sizes only; the accent appearing three times on the
 *   whole page and never as text on a light surface.
 *
 * STORY: A visitor in distress meets calm before copy, finds the word for what
 *   they are carrying inside a named theme, reads plainly what €200 buys and
 *   what it does not, and clicks Get started.
 *
 * FIRST VIEWPORT: A split on flat ink-deep. Left, the Fraunces headline, one
 *   supporting line, the gold Get started button, and a quiet link out to How
 *   it works. Right, one photograph of a quiet corner — armchair, plant,
 *   afternoon light — drifting on a 9s breath under a 12% ink wash. Stacked on
 *   small screens, words first.
 *
 *   REVISED 2026-08-29 at the developer's request. This was a full-bleed
 *   photograph under a two-layer scrim, with the words anchored lower-left.
 *   The descent through the services section below is unchanged, so the THESIS
 *   still holds; only the first viewport was restructured.
 *
 * FORM: Horizon — candidate 1 of 7 on the grounded list, dealt and locked from
 *   surface seed 06087d6a (persuade).
 *
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the
 *   finish review, the verdict, DESIGN.md, and every shipping raster carrying
 *   its provenance.
 * ---------------------------------------------------------------------------
 */

/**
 * The complete home page, in master spec §24.7 order: hero, services,
 * testimonials, how it works, who we help, comparison, FAQ. The footer comes
 * from PublicLayout, so the page itself ends at the FAQ.
 *
 * GROUND RHYTHM. §24.2 asks for alternating surfaces rather than hard dividers
 * between sections, and the sequence below is built to give the scroll a pulse
 * instead of a flat run of white:
 *
 *   hero .............. ink-deep
 *   services .......... ink-deep -> ink -> mist -> paper -> ink-deep
 *   testimonials ...... paper
 *   how it works ...... ink          <- mid-page anchor, and the 2nd CTA
 *   who we help ....... mist
 *   comparison ........ paper
 *   FAQ ............... mist
 *   footer ............ ink          <- from PublicLayout
 *
 * Putting "how it works" on ink is what lets the second Get started button be
 * gold: yellow on paper is 1.63:1 and is never a button face on a light ground.
 *
 * CONTENT. Everything on this page is true and traceable to the spec EXCEPT the
 * testimonials and the two invented figures in "who we help", which live in
 * data/homePlaceholders.js and are on the pre-launch blocker list. Real copy
 * lives in data/homeContent.js. Neither is ever mixed into a component.
 */
export default function Home() {
  return (
    <>
      {/* <Hero /> */}
      <Hero1/>
      <Services />
      <Testimonials />
      <HowItWorks />
      <WhoWeHelp />
      <Comparison />
      <Faq />
    </>
  )
}
