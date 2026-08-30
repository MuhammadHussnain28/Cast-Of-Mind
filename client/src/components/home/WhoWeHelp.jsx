import { motion, useReducedMotion } from 'framer-motion'
import { Heading, Text } from '../ui'
import { audiences, figures } from '../../data/homePlaceholders'

/**
 * Section 5 of the home page (master spec §24.7): target audiences, supporting
 * figures, and the current client count.
 *
 * WHAT THIS SECTION DELIBERATELY IS NOT.
 * The default build for "supporting figures and a client count" is a row of
 * big-number tiles — 1,200 / 40 / 27 set at display size with small grey labels
 * underneath. Two reasons that is not what this is. It is a named anti-pattern
 * in this project's craft rules, and more importantly it is the wrong register:
 * a wall of metrics aimed at someone deciding whether to ask for help reads as
 * a company talking about itself at the moment the reader needs to be talked
 * to. The audiences lead and take the width. The figures sit underneath at
 * reading size, present and checkable, but not shouted.
 *
 * The list is the substance. Each line is a situation rather than a segment,
 * written so a reader can recognise themselves in it — the whole job of this
 * section is one person thinking "that is me" and scrolling on with slightly
 * less doubt than they arrived with.
 *
 * TWO OF THE THREE FIGURES ARE INVENTED and flagged as such in
 * data/homePlaceholders.js. The 27 is real.
 *
 * Sits on mist so the page keeps alternating: the plan panel closes dark, then
 * testimonials open on paper, then this returns to mist. §24.2 asks for that
 * rhythm instead of hard dividers between sections.
 *
 * MEASURED (all pass AA):
 *   ink        on mist ..... 16.2:1
 *   ink/70     on mist ..... 6.4:1
 *   sage       on mist ..... 3.1:1  — a 1.5px rule only, never text. Clears the
 *                                     3:1 floor for non-text graphics, and only
 *                                     just, so it must not be thinned further.
 */
export default function WhoWeHelp() {
  const reduceMotion = useReducedMotion()

  const reveal = (index) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.5 },
          // §24.4: 80-120ms stagger. Capped at four steps so the last line does
          // not sit visibly waiting after the ones above it have arrived.
          transition: {
            duration: 0.7,
            delay: Math.min(index, 4) * 0.1,
            ease: [0.22, 1, 0.36, 1],
          },
        }

  return (
    <section
      aria-labelledby="who-we-help-heading"
      data-surface="light"
      className="bg-mist"
    >
      <div className="mx-auto w-full max-w-7xl gap-x-16 px-5 py-20 sm:px-8 lg:grid lg:grid-cols-12 lg:py-28">
        <div className="lg:col-span-4">
          <motion.div {...reveal(0)}>
            <Heading level={2} id="who-we-help-heading" className="max-w-[16ch]">
              Who this is for.
            </Heading>
            <Text tone="muted" className="mt-7 max-w-measure">
              There is no threshold you have to cross first, and no version of
              this that is too small to bring.
            </Text>
          </motion.div>
        </div>

        <ul className="mt-12 lg:col-span-8 lg:mt-0">
          {audiences.map((line, i) => (
            <motion.li
              key={line}
              {...reveal(i)}
              className="border-t border-ink/12 py-6 first:border-t-0 first:pt-0 sm:py-7"
            >
              {/* Larger than body on purpose. These five lines are the section,
                  so they are set at reading-forward size rather than as list
                  items under a heading that outweighs them. */}
              <Text size="subsection" className="max-w-measure text-ink">
                {line}
              </Text>
            </motion.li>
          ))}
        </ul>
      </div>

      {/* The figures. Kept below the list, at reading size, on a rule rather
          than in tiles — see the note at the top of this file. */}
      <div className="mx-auto w-full max-w-7xl px-5 pb-20 sm:px-8 lg:pb-28">
        <motion.dl
          {...reveal(0)}
          className="flex flex-col gap-y-6 border-t-[1.5px] border-sage pt-8 sm:flex-row sm:flex-wrap sm:gap-x-16"
        >
          {figures.map((figure) => (
            <div key={figure.label} className="flex items-baseline gap-3">
              {/* Number as the term, label as its description — so a screen
                  reader announces "1,200, people supported since we opened"
                  rather than reading a hidden duplicate of the label first.

                  Satoshi, not Fraunces. §24.3 keeps the display face to display
                  sizes, and 26px is the subsection step, which the type scale
                  assigns to Satoshi. Setting these in Fraunces would also make
                  them look like the hero-metric treatment this section exists
                  to avoid. */}
              <dt data-numeric className="font-body text-subsection text-ink">
                {figure.value}
              </dt>
              <dd>
                <Text size="ui" tone="muted" as="span" className="max-w-measure">
                  {figure.label}
                </Text>
              </dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  )
}
