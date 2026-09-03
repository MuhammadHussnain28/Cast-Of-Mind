import { motion, useReducedMotion } from 'framer-motion'
import { propositions } from '../../data/joinContent'
import * as Icons from './JoinIcons'

/**
 * Four reasons to practise here.
 *
 * Deliberately NOT four equal cards — that is the shape every recruitment page
 * ships. They are rows on a single hairline rail, so the eye reads a list of
 * commitments rather than a grid of tiles.
 */
export default function WhyPractiseHere() {
  const reduceMotion = useReducedMotion()

  return (
    <ul className="relative space-y-6 border-l border-paper/12 pl-6">
      {propositions.map((item, i) => {
        const Glyph = Icons[item.icon]

        return (
          <motion.li
            key={item.id}
            initial={reduceMotion ? false : { opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{
              duration: 0.7,
              delay: reduceMotion ? 0 : i * 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative"
          >
            {/* Sits on the rail, so the rail reads as threading the points together. */}
            <span
              aria-hidden="true"
              className="absolute -left-[31px] top-1.5 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-ink-deep text-gold"
            >
              <Glyph className="h-4 w-4" />
            </span>

            <h3 className="font-body text-ui font-medium text-paper">{item.title}</h3>
            <p className="mt-1 max-w-[46ch] font-body text-caption leading-relaxed text-paper/70">
              {item.body}
            </p>
          </motion.li>
        )
      })}
    </ul>
  )
}
