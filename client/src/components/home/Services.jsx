import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button, Heading, Text } from '../ui'
import {
  concernThemes,
  subscriptionIncludes,
  subscriptionCaveat,
} from '../../data/homeContent'
import windowLight from '../../assets/home-window.jpg'

/**
 * The page inhales.
 *
 * The ground lightens as the reader descends - ink-deep, then ink, then mist,
 * then a photograph of an open window at the brightest point - and closes on a
 * dark panel that anchors the page and carries the price. That descent is the
 * whole structure; there are no cards here on purpose. Same-size cards of icon
 * plus heading plus text are what every therapy site ships as "services", and
 * they turn five different kinds of human difficulty into five identical
 * rectangles.
 *
 * Only palette tokens are used as grounds. No mid-tone was invented to smooth
 * the gradient, because a derived tint that nobody approved is how a fixed
 * palette quietly becomes an unfixed one - and every step below has measured
 * text contrast, which an invented one would not.
 *
 * MEASURED (all pass AA):
 *   paper       on ink-deep .... 19.7:1
 *   paper/75    on ink-deep .... 11.0:1
 *   paper/75    on ink ......... 10.4:1
 *   ink         on mist ........ 16.2:1
 *   ink/70      on mist ........  6.4:1
 *   gold        on ink-deep .... 12.1:1  (display size, never body)
 */

/**
 * Which ground each theme sits on. Presentation, so it lives here rather than
 * in the content file - the themes themselves do not know how they are drawn.
 */
const THEME_GROUNDS = [
  // The rhythm opens as the ground lightens - tight and dark at the top, wide
  // and airy by the bottom - so the descent is felt in the spacing and not only
  // in the colour. The column split widens with it. Five rows on one template
  // would have refused the card and kept the sameness the card is a symptom of.
  { ground: 'bg-ink-deep', surface: 'dark', rule: 'border-paper/12',
    pad: 'py-12 lg:py-14', head: 'lg:col-span-4', tags: 'lg:col-span-8' },
  { ground: 'bg-ink', surface: 'dark', rule: 'border-paper/12',
    pad: 'py-14 lg:py-16', head: 'lg:col-span-4', tags: 'lg:col-span-8' },
  { ground: 'bg-ink', surface: 'dark', rule: 'border-transparent',
    pad: 'py-14 lg:py-18', head: 'lg:col-span-5', tags: 'lg:col-span-7' },
  { ground: 'bg-mist', surface: 'light', rule: 'border-ink/12',
    pad: 'py-16 lg:py-20', head: 'lg:col-span-5', tags: 'lg:col-span-7' },
  { ground: 'bg-mist', surface: 'light', rule: 'border-transparent',
    pad: 'py-16 lg:py-24', head: 'lg:col-span-6', tags: 'lg:col-span-6' },
]

/**
 * Each row watches for itself rather than being orchestrated by the list.
 *
 * The obvious build - one stagger container around all five - looks right and
 * behaves wrong: the list is well over a screen tall, so the container triggers
 * while only the first row or two is visible, and rows three to five finish
 * animating far below the fold. By the time the reader reaches them they are
 * already in their final state, so three of the five reveals are spent on an
 * empty room. Per-row triggers mean every row actually reveals when it is
 * reached, which is the point of a reveal.
 *
 * Rows that enter together do animate together. That is deliberate: at 800ms on
 * §24.4's ease-out, two or three rows settling at once reads as the page
 * arriving, and an artificial index delay would make later rows lag visibly
 * behind the scroll.
 */
function ThemeRow({ theme, index, reduceMotion }) {
  const { ground, surface, rule, pad, head, tags } = THEME_GROUNDS[index]
  const isDark = surface === 'dark'

  // Deliberately NOT the hero's fade-up. The hero rises into place; these rows
  // come into focus, which is a different gesture for a different job and stops
  // the page having one entrance repeated eight times. Blur suits the subject
  // better than movement too - nothing on this page should lurch.
  //
  // THE BLUR GOES ON THE CONTENT, NOT THE BAND. `filter` blurs an element's
  // background box along with its text, so putting it on the <li> would soften
  // the band's own top and bottom edges and bleed the neighbouring grounds
  // through the seam for the whole 800ms. The ground stays solid; only what
  // sits on it comes into focus.
  const reveal = reduceMotion
    ? {} 
    : {
        initial: { opacity: 0, filter: 'blur(10px)' },
        whileInView: { opacity: 1, filter: 'blur(0px)' },
        viewport: { once: true, amount: 0.4 },
        transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
      }

  return (
    <li data-surface={surface} className={ground}>
      <motion.div
        {...reveal}
        className={`mx-auto grid w-full max-w-7xl gap-x-12 gap-y-4 border-b px-5 sm:px-8 lg:grid-cols-12 ${pad} ${rule}`}
      >
        <div className={head}>
          <Heading level={3} size="subsection" tone={isDark ? 'inverse' : 'default'}>
            {theme.name}
          </Heading>
          <Text
            size="ui"
            className={`mt-2 max-w-measure ${isDark ? 'text-paper/75' : 'text-ink/70'}`}
          >
            {theme.blurb}
          </Text>
        </div>

        {/* The concern words themselves, set as reading text rather than as a
            row of pills. A visitor scanning for their own word finds it faster
            in a sentence-like list than in twenty-seven identical chips, and
            pills would read as filter controls that do nothing when clicked. */}
        <ul className={`flex flex-wrap items-baseline gap-x-3 gap-y-2 lg:justify-end ${tags}`}>
          {theme.tags.map((tag, i) => (
            <li
              key={tag}
              className={`text-ui ${isDark ? 'text-paper/75' : 'text-ink/70'}`}
            >
              {tag}
              {i < theme.tags.length - 1 && (
                <span
                  aria-hidden="true"
                  className={isDark ? 'ml-3 text-paper/35' : 'ml-3 text-ink/35'}
                >
                  ·
                </span>
              )}
            </li>
          ))}
        </ul>
      </motion.div>
    </li>
  )
}



export default function Services() {
  const reduceMotion = useReducedMotion()

  return (
    <>
      <section aria-labelledby="services-heading">
        {/* The dark continues out of the hero, so the two sections read as one
            field rather than as a photograph with a page stuck underneath it. */}
        <div data-surface="dark" className="bg-ink-deep">
          <div className="mx-auto w-full max-w-7xl px-5 pb-14 pt-24 sm:px-8 lg:pb-16 lg:pt-32">
            <Heading level={2} id="services-heading" tone="inverse" className="max-w-[20ch]">
              What people bring us.
            </Heading>
            <Text tone="inverse" className="mt-7 max-w-measure opacity-80">
              Cast of Mind is online therapy with one therapist you keep: an hour
              together over Zoom each week, and unlimited chat in between.
            </Text>
            <Text tone="inverse" className="mt-5 max-w-measure opacity-80">
              Therapists tag the areas they work in. You tag what you are going
              through, and we match where those overlap. Where you live and what
              time zone you are in never narrow the list.
            </Text>
          </div>
        </div>


        {/* originla one  */}

        {/* <ul>
          {concernThemes.map((theme, i) => (
            <ThemeRow
              key={theme.id}
              theme={theme}
              index={i}
              reduceMotion={reduceMotion}
            />
          ))}
        </ul> */}

       

      {/* testing one  */}

      <div className="relative bg-ink-deep py-6 lg:py-10">
        {concernThemes.map((theme, index) => {
          const grounds = [
            { bg: 'bg-ink-deep', border: 'border-paper/12', text: 'text-paper', tagText: 'text-paper/70', dot: 'text-paper/30' },
            { bg: 'bg-ink',      border: 'border-paper/12', text: 'text-paper', tagText: 'text-paper/70', dot: 'text-paper/30' },
            { bg: 'bg-ink',      border: 'border-paper/10', text: 'text-paper', tagText: 'text-paper/70', dot: 'text-paper/30' },
            { bg: 'bg-mist',     border: 'border-ink/10',   text: 'text-ink',   tagText: 'text-ink/65',   dot: 'text-ink/30' },
            { bg: 'bg-mist',     border: 'border-ink/8',    text: 'text-ink',   tagText: 'text-ink/65',   dot: 'text-ink/30' },
          ]
          const g = grounds[index]
          return (
            <div
              key={theme.id}
              className="sticky px-4 sm:px-6 lg:px-8 mb-6"
              style={{
                top: `calc(5rem + ${index * 18}px)`,
                zIndex: index + 1,
              }}
            >
              <div
                className={`
                  mx-auto w-full max-w-5xl min-h-[200px]
                  rounded-3xl ${g.bg} ${g.border} border
                  px-7 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12
                  shadow-[0_-6px_30px_-10px_rgba(13,9,22,0.6)]
                  transition-all duration-300 ease-out
                `}
              >
                <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
                  
                  {/* Left: Heading + Blurb */}
                  <div className="lg:col-span-5">
                    <Heading level={3} size="subsection" tone={g.text === 'text-paper' ? 'inverse' : 'default'}>
                      {theme.name}
                    </Heading>
                    <Text size="ui" className={`mt-2 max-w-measure ${g.tagText}`}>
                      {theme.blurb}
                    </Text>
                  </div>
                  {/* Right: Tags */}
                  <ul className={`flex flex-wrap items-baseline gap-x-3 gap-y-2 lg:col-span-7 lg:justify-end`}>
                    {theme.tags.map((tag, i) => (
                      <li key={tag} className={`text-ui ${g.tagText}`}>
                        {tag}
                        {i < theme.tags.length - 1 && (
                          <span aria-hidden="true" className={`ml-3 ${g.dot}`}>·</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )
        })}
        {/* Spacer so the last card has room to fully stack */}
        <div className="h-[40vh]" />
      </div>


        <div className="relative bg-paper">
          <img
            src={windowLight}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="h-64 w-full object-cover object-center sm:h-80 lg:h-112"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-ink-deep/14" />
        </div>
      </section>

      {/* Its own landmark, not a tail on the one above. "What people bring us"
          and "what the plan costs" are different questions, and a screen reader
          user jumping by region should be able to land on the price directly
          instead of arriving inside a section announced as something else. */}
      <section
        aria-labelledby="plan-heading"
        data-surface="dark"
        className="bg-ink-deep"
      >
        <div className="mx-auto grid w-full max-w-7xl gap-x-12 gap-y-10 px-5 py-20 sm:px-8 lg:grid-cols-12 lg:py-24">
          <div className="lg:col-span-5">
            <Heading level={2} id="plan-heading" size="section" tone="inverse">
              One plan.
            </Heading>
            <p className="mt-6 font-display text-section text-gold">€200 a month</p>
            <Text size="ui" className="mt-6 max-w-measure text-paper/75">
              {subscriptionCaveat}
            </Text>
            <Button as={Link} to="/questionnaire" size="lg" className="mt-8">
              Get started
            </Button>
          </div>

          <ul className="space-y-5 lg:col-span-6 lg:col-start-7">
            {subscriptionIncludes.map((item) => (
              <li key={item} className="flex gap-4">
                {/* Drawn, not a unicode tick. One stroke weight, matching the
                    navbar's icon. */}
                <svg
                  viewBox="0 0 20 20"
                  className="mt-1.5 h-4 w-4 shrink-0 text-sage"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M4 10.5 8 14.5 16 6"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <Text className="max-w-measure text-paper/85">{item}</Text>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
