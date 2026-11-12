import AboutHeroModern from '../components/about/AboutHeroModern'
import BrandStoryModern from '../components/about/BrandStoryModern'
import BrandStory from '../components/about/BrandStory'
import Founder from '../components/about/Founder'
import TeamGrid from '../components/about/TeamGrid'
import { useEffect } from 'react'


/**
 * About — master spec §24.7: mission and story, brand presentation, the full
 * team (the standalone team page was deliberately merged in here), and the
 * founder profile.
 *
 * GROUND RHYTHM. §24.2 asks for alternating surfaces rather than hard dividers,
 * and §24.9 permits the tone changes to happen as gradients:
 *
 *   hero ........ ink-deep
 *   strip ....... ink-deep -> ink     (no text)
 *   brand ....... ink
 *   strip ....... ink -> mist         (no text, the long one)
 *   founder ..... mist
 *   team ........ paper
 *
 * The strips carry no words on purpose. A band whose ground runs from ink to
 * mist has no text colour that passes contrast at both ends, so the gradient
 * gets its own space and every section holding copy keeps one flat, measured
 * ground. The descent reads continuous; the contrast stays provable.
 *
 * CONTENT. The mission and brand sections are true and make no claim about
 * people, numbers or outcomes (data/aboutContent.js). The founder and the team
 * — every name, face, role and qualification — are invented
 * (data/aboutPlaceholders.js) and are on the pre-launch blocker list.
 */
export default function About() {

  useEffect(() => {
    document.title = 'About Us & Our Mission | Cast of Minds'
  }, [])

  return (
    <>
      <AboutHeroModern />
      <div aria-hidden="true" className="h-20 bg-linear-to-b from-ink-deep to-ink lg:h-28" />
      <BrandStoryModern />

      {/* GRADIENT */}
      {/* <div aria-hidden="true" className="h-28 bg-linear-to-b from-ink to-mist lg:h-40" /> */}
      {/* <div aria-hidden="true" className="h-12 bg-linear-to-b from-ink to-mist " /> */}
      
      {/* <Founder /> */}
      {/* <TeamGrid /> */}
    </>
  )
}
