import { motion, useReducedMotion } from 'framer-motion'
import { Heading, Text } from '../components/ui'
import WhyPractiseHere from '../components/join/WhyPractiseHere'
import EligibilityCard from '../components/join/EligibilityCard'
import ApplicationForm from '../components/join/ApplicationForm'
import { Lock } from '../components/join/JoinIcons'
import { intro } from '../data/joinContent'

/**
 * /join-as-therapist — master spec §5, §23, §24.7.
 *
 * DIRECTION: the page is two modes stacked in one frame. The left column
 * persuades a qualified clinician to spend twenty minutes; the right column is
 * the tool they spend them in. Warm and open on the left, dense and quick on
 * the right — most recruitment pages make the form as airy as the pitch, which
 * turns 34 fields into an endless scroll.
 *
 * Same split-screen frame as /contact so the two public forms are recognisably
 * the same product. Depth comes from radial washes and one elevated card, never
 * from a horizontal band gradient.
 */
export default function JoinAsTherapist() {
  const reduceMotion = useReducedMotion()

  const settle = (delay) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
        }

  return (
    <div
      data-surface="dark"
      className="relative min-h-[calc(100svh-72px)] overflow-hidden bg-ink-deep text-paper"
    >
      {/* Ambient washes. Radial and low-contrast — felt before they are noticed. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-32 -z-10 h-[38rem] w-[38rem] rounded-full bg-sage/10 blur-[140px] motion-safe:animate-drift"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-[55%] -z-10 h-[32rem] w-[32rem] rounded-full bg-gold/5 blur-[130px]"
      />

      <div className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-start lg:gap-16">
          {/* ============ LEFT (5) — the case for practising here ============ */}
          <div className="lg:col-span-5">
            <motion.div {...settle(0)}>
              <Heading level={1} size="hero" tone="inverse" className="max-w-[15ch]">
                {intro.heading}
              </Heading>
            </motion.div>

            <motion.p
              {...settle(0.05)}
              className="mt-6 max-w-[30ch] font-display text-section leading-snug text-paper/90"
            >
              {intro.lede}
            </motion.p> 

            <motion.div {...settle(0.1)}>
              <Text tone="inverse" className="mt-5 max-w-measure opacity-75">
                {intro.body}
              </Text>
            </motion.div>

            <div className="mt-10">
              <WhyPractiseHere />
            </div>

            <div className="mt-10">
              <EligibilityCard />
            </div>

            {/* The one promise a therapist checks for, stated where they finish reading. */}
            <motion.div
              {...settle(0.2)}
              className="mt-8 flex items-start gap-3 border-t border-paper/10 pt-6"
            >
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-sage" />
              <p className="font-body text-caption leading-relaxed text-paper/60">
                Your application, your documents, and everything you later write about a client are
                held apart from anything a client can reach.
              </p>
            </motion.div>
          </div>

          {/* ============ RIGHT (7) — the elevated form card ============ */}
          <motion.div {...settle(0.15)} className="lg:col-span-7">
            <div
              data-surface="light"
              className="rounded-3xl bg-paper p-6 text-ink shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] sm:p-10"
            >
              <ApplicationForm />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
