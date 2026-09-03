import { motion, useReducedMotion } from 'framer-motion'
import { eligibility } from '../../data/joinContent'
import * as Icons from './JoinIcons'

/**
 * The five requirements, as a frosted plate over the dark column.
 *
 * Frosted rather than solid because it genuinely sits over the ambient glows
 * behind it — backdrop-blur is a property of the surface here, not decoration.
 * Contrast on paper/85 over ink-deep is 15.0:1; the sage icon strokes are 5.8:1.
 */
export default function EligibilityCard() {
  const reduceMotion = useReducedMotion()

  return (
    <section aria-labelledby="eligibility-heading" className="relative">
      <div className="rounded-3xl border border-paper/12 bg-paper/[0.04] p-6 backdrop-blur-md sm:p-8">
        <h2
          id="eligibility-heading"
          className="font-display text-subsection text-paper"
        >
          {eligibility.heading}
        </h2>

        <p className="mt-2 font-body text-ui leading-relaxed text-paper/85">
          {eligibility.openingLine}
        </p>

        <ul className="mt-6 space-y-4">
          {eligibility.requirements.map((item, i) => {
            const Glyph = Icons[item.icon]

            return (
              <motion.li
                key={item.id}
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  duration: 0.7,
                  delay: reduceMotion ? 0 : i * 0.09,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="flex gap-4"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-sage/35 text-sage">
                  <Glyph className="h-[18px] w-[18px]" />
                </span>
                <span className="font-body text-ui leading-relaxed text-paper/85">
                  {item.text}
                </span>
              </motion.li>
            )
          })}
        </ul>

        <p className="mt-7 border-t border-paper/10 pt-5 font-body text-caption leading-relaxed text-paper/60">
          {eligibility.footnote}
        </p>
      </div>
    </section>
  )
}
