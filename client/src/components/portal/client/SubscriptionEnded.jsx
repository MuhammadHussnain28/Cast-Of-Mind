import { motion, useReducedMotion } from 'framer-motion'
import { Heading, Text } from '../../ui'
import { ENDED } from '../../../data/clientPortalContent'
import { KeptIcon } from './ClientPortalIcons'
import TherapistPresence from './TherapistPresence'

/**
 * What an expired client sees instead of their portal (§13).
 *
 * THERE IS NO REACTIVATE BUTTON, on purpose. The re-subscribe flow is slice 12,
 * and a button that goes nowhere is worse than none — especially for someone
 * who may have let the subscription lapse because money is tight. When that
 * chunk lands it replaces this screen; the copy here is the honest holding
 * state, not a stub.
 *
 * The mark is a bookmark rather than a lock or a cross: the meaning of this
 * screen is that their place is kept, which is exactly what §13 promises —
 * every record preserved, and re-subscribing resumes where it left off. Same
 * reasoning as the bookmark on /checkout/cancel in 6.6, and it is static
 * because nothing here is being celebrated.
 */
export default function SubscriptionEnded({ therapist }) {
  const reduce = useReducedMotion()

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-mist px-4 py-12">
      {/* Ambient wash behind the card, the device used on every other outcome
          surface. Large, slow, low contrast. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 size-[28rem] -translate-x-1/2 rounded-full bg-sage/10 blur-[130px]"
      />

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        // Elevation declared once — a real shadow with offset and blur, and no
        // border underneath it. A hairline under a soft shadow is the ghost card.
        className="relative w-full max-w-xl rounded-2xl bg-paper px-6 py-8 shadow-[0_18px_50px_-24px_rgba(25,18,43,0.35)] sm:px-9 sm:py-10"
      >
        <span
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-xl bg-sage/12 text-sage-deep"
        >
          <KeptIcon size={24} />
        </span>

        <Heading level={1} size="subsection" className="mt-5">
          {ENDED.title}
        </Heading>

        <Text tone="muted" className="mt-3 max-w-measure">
          {ENDED.lead}
        </Text>

        {therapist && (
          <div className="mt-7 rounded-xl bg-mist px-4 py-4">
            <p className="font-body text-caption text-ink/70">Your therapist</p>
            <div className="mt-3">
              {/* Hours are suppressed here: telling someone their therapist is
                  working right now, on the one screen where they cannot reach
                  them, is information with nothing behind it. */}
              <TherapistPresence therapist={therapist} tone="light" showHours={false} />
            </div>
          </div>
        )}

        <Text size="caption" tone="muted" className="mt-6 max-w-measure">
          {ENDED.note}
        </Text>
      </motion.div>
    </div>
  )
}
