import { motion, useReducedMotion } from 'framer-motion'
import { Heading, Text } from '../ui'
import { Check } from './JoinIcons'
import { submitted } from '../../data/joinContent'

/**
 * Confirmation after a successful submission.
 *
 * NO TIMELINE IS PROMISED. §24.7 asks for "roughly when", but there is no basis
 * for a number and a missed promise on a professional application reads worse
 * than saying nothing — the same reasoning as the emails in chunk 3.2. The
 * approved wording says what happens and in what order instead. If Asad ever
 * gives a real turnaround, it goes in `submitted.next` in data/joinContent.js.
 */
export default function SubmittedScreen({ applicationId }) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      // Announced without stealing focus from whatever the reader is doing.
      role="status"
      aria-live="polite"
      className="py-4"
    >
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-sage text-paper">
        <Check className="h-6 w-6" />
      </span>

      <Heading level={2} size="subsection" className="mt-6 text-ink">
        {submitted.heading}
      </Heading>

      <Text tone="muted" className="mt-3 max-w-measure">
        {submitted.next}
      </Text>

      <div className="mt-8 rounded-2xl bg-mist p-5">
        <p className="font-body text-caption text-ink/70">Your reference</p>
        <p className="mt-1 break-all font-mono text-ui text-ink">{applicationId}</p>
        <p className="mt-3 font-body text-caption leading-relaxed text-ink/70">
          {submitted.reference}
        </p>
      </div>

      <Text tone="muted" className="mt-6 max-w-measure text-sm">
        {submitted.closing}
      </Text>
    </motion.div>
  )
}
