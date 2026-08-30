import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button, Heading, Text } from '../ui'
import { processSteps } from '../../data/homeContent'

/**
 * Section 4 of the home page (master spec §24.7): the process in visual steps,
 * condensed, linking through to the dedicated page.
 *
 * THE ONE AUTHORED MOTION MOMENT ON THIS PAGE BELOW THE HERO.
 * A line runs through the four steps and DRAWS ITSELF as the section arrives —
 * left to right on desktop, top to bottom on mobile — with the markers landing
 * on it in sequence behind the leading edge, then the text settling under them.
 *
 * The line is not decoration. It is the process made visible: a path with a
 * beginning and an end, drawn in the order the reader will walk it. That is
 * also why the steps are numbered here when numbering is a default worth
 * refusing almost everywhere else — this genuinely is a sequence, and §24.7
 * names it as the exception.
 *
 * Everything else in this chunk is deliberately quiet so this lands. A page
 * where every section performs has no signature, only noise.
 *
 * WHY DARK. The section is the mid-page anchor between two light sections, and
 * it carries the second Get started. Yellow on paper is 1.63:1 and is never a
 * button face on a light ground; on ink it is 9.5:1. Putting this section on
 * ink is what lets the second CTA look like the first one.
 *
 * MEASURED — computed, not estimated (all text pairs clear AA):
 *   paper      on ink ....... 18.1:1
 *   paper/75   on ink ....... 10.4:1
 *   sage       on ink .......  5.3:1  (step labels — text, so it must pass)
 *   gold       on ink ....... 11.1:1  (button face)
 *   paper/25   on ink .......  2.2:1  (connector line — decorative, exempt)
 *
 * NOTE ON THE GOLD FIGURE. §24.2 states gold on ink as 9.5:1. Computing it from
 * the two hex values gives 11.1:1. The spec's number is conservative rather than
 * wrong in effect — both clear every threshold that applies — but the two do not
 * agree, and 11.1:1 is what the palette actually produces. Recorded in
 * docs/ongoing.md rather than silently overwritten here.
 */
export default function HowItWorks() {
  const reduceMotion = useReducedMotion()

  // One orchestration for the whole section rather than per-element props, so
  // the line, the markers and the copy are provably on the same clock.
  const container = reduceMotion
    ? {}
    : {
        initial: 'hidden',
        whileInView: 'shown',
        viewport: { once: true, amount: 0.3 },
      }

  // The draw. 1.1s is past §24.4's 600-800ms reveal band on purpose: this is
  // closer to ambient than to a section entrance, and a line that snaps across
  // the viewport in 700ms reads as a swipe rather than as a path being traced.
  const lineVariants = {
    hidden: { scaleX: 0, scaleY: 0 },
    shown: {
      scaleX: 1,
      scaleY: 1,
      transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1] },
    },
  }

  // Markers land behind the leading edge of the line, not with it — the 0.25s
  // offset is what makes the line look like it is drawing them into place
  // rather than everything appearing at once.
  const markerVariants = (index) => ({
    hidden: { scale: 0, opacity: 0 },
    shown: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.45,
        delay: 0.25 + index * 0.1, // §24.4: 80-120ms stagger
        ease: [0.22, 1, 0.36, 1],
      },
    },
  })

  const copyVariants = (index) => ({
    hidden: { opacity: 0, y: 16 },
    shown: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, delay: 0.35 + index * 0.1, ease: [0.22, 1, 0.36, 1] },
    },
  })

  return (
    <section
      aria-labelledby="how-it-works-heading"
      data-surface="dark"
      className="bg-ink"
    >
      <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
        <Heading
          level={2}
          id="how-it-works-heading"
          tone="inverse"
          className="max-w-[18ch]"
        >
          What actually happens.
        </Heading>
        <Text tone="inverse" className="mt-7 max-w-measure opacity-75">
          Four steps, and you can stop after any of them. Nothing is charged
          until you have seen who you would be talking to.
        </Text>

        {/* The lines are siblings of the list, not children of it: an <ol> may
            only contain <li>, so a decorative <div> inside it would break the
            list semantics a screen reader relies on to announce "4 items". */}
        <motion.div {...container} className="relative mt-16 lg:mt-20">
          {/* Two lines, because the axis changes with the layout and one element
              cannot be both. Each is hidden at the other breakpoint, so only one
              is ever painted.

              transform-origin is what makes this a draw rather than a grow: the
              horizontal line starts at the left edge, the vertical at the top —
              the direction the reader travels in each case. Both are scale
              transforms on the compositor, so a full-width line costs nothing to
              animate. */}
          <motion.div
            aria-hidden="true"
            variants={lineVariants}
            style={{ originX: 0 }}
            className="absolute left-0 right-0 top-1.75 hidden h-px bg-paper/25 lg:block"
          />
          <motion.div
            aria-hidden="true"
            variants={lineVariants}
            style={{ originY: 0 }}
            className="absolute bottom-0 left-1.75 top-1.75 w-px bg-paper/25 lg:hidden"
          />

          <ol className="grid gap-10 lg:grid-cols-4 lg:gap-8">
            {processSteps.map((step, index) => (
              <li key={step.id} className="relative pl-9 lg:pl-0">
                {/* Sits ON the line, which is why the marker and both lines
                    share the same 7px axis offset. */}
                <motion.span
                  aria-hidden="true"
                  variants={markerVariants(index)}
                  className="absolute left-0 top-0 block h-3.5 w-3.5 rounded-full bg-sage lg:relative lg:mb-7"
                />

                <motion.div variants={copyVariants(index)}>
                  {/* The number is read out as part of the step, not hidden:
                      an ordered list already conveys sequence to a screen
                      reader, but the visible numeral has to belong to
                      something, and pairing it with the title keeps the
                      heading and the marker from disagreeing. */}
                  <Text
                    size="caption"
                    as="span"
                    className="block font-medium text-sage"
                  >
                    Step {index + 1}
                  </Text>
                  <Heading
                    level={3}
                    size="subsection"
                    tone="inverse"
                    className="mt-2"
                  >
                    {step.title}
                  </Heading>
                  <Text
                    size="ui"
                    tone="inverse"
                    className="mt-3 max-w-measure opacity-75"
                  >
                    {step.body}
                  </Text>
                </motion.div>
              </li>
            ))}
          </ol>
        </motion.div>

        {/* The second Get started (§24.7) — for the visitor who needed the
            context before they could act. The link through to the full page sits
            beside it for the one who still does not feel ready, which is the
            entire reason /how-it-works exists. */}
        <div className="mt-16 flex flex-wrap items-center gap-x-8 gap-y-4 lg:mt-20">
          <Button as={Link} to="/questionnaire" size="lg">
            Get started
          </Button>
          <Link
            to="/how-it-works"
            className="inline-flex min-h-11 items-center text-ui text-paper/85 underline decoration-paper/40 underline-offset-4 transition-colors duration-200 ease-out hover:text-paper hover:decoration-paper"
          >
            See the whole process in detail
          </Link>
        </div>
      </div>
    </section>
  )
}
