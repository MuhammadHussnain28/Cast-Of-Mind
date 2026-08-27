import { motion, useReducedMotion } from 'framer-motion'
import { Heading, Text } from '../ui'

/**
 * The frame the three auth pages share: a calm centred column on mist, with
 * the title given room to breathe above the form rather than crammed inside
 * it.
 *
 * Composition note — the heading sits OUTSIDE the panel on purpose. Boxing a
 * 44px display serif inside a 400px card crushes it, and this is the one
 * moment where the brand voice should be legible: someone in difficulty is
 * arriving at a door and needs to feel they are in the right place.
 *
 * Motion is a single settle, not a per-element cascade. Gated on
 * useReducedMotion so the content is simply there for anyone who asked for
 * less movement (§24.4 — an accessibility requirement, not a nicety).
 */
export default function AuthShell({ title, intro, children, footer }) {
  const reduceMotion = useReducedMotion()

  const settle = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
      }

  return (
    <section className="bg-mist px-4 py-16 sm:py-24">
      <motion.div className="mx-auto w-full max-w-md" {...settle}>
        <div className="text-center">
          <Heading level={1} size="section">
            {title}
          </Heading>
          {intro && (
            <Text tone="muted" className="mt-4">
              {intro}
            </Text>
          )}
        </div>

        <div className="mt-10 rounded-2xl border border-ink/12 bg-paper p-6 sm:p-8">
          {children}
        </div>

        {footer && <div className="mt-8 text-center">{footer}</div>}
      </motion.div>
    </section>
  )
}
