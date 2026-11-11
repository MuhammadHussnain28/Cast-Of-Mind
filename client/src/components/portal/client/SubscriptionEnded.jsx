import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Button, Heading, Text } from '../../ui'
import { ENDED } from '../../../data/clientPortalContent'
import { SUPPORT_EMAIL } from '../../../data/contactContent'
import { startResubscription } from '../../../lib/api/clientPortalApi'
import RenewalDisclosure from '../../checkout/RenewalDisclosure'
import { ChatIcon, JournalIcon, KeptIcon, SessionsIcon, WorksheetsIcon } from './ClientPortalIcons'
import RatingForm from './review/RatingForm'

/**
 * What an expired client sees instead of their portal — §13's re-subscribe
 * screen (11.4).
 *
 * Their therapist leads, because that relationship is what they are coming back
 * to. What is kept is DRAWN, as counts only — never a word of content. The
 * renewal terms sit on the same ink panel as checkout (6.5), verbatim, before
 * the one button. No guilt, no urgency, no countdown: a lapsed subscription may
 * mean money is tight, and this screen must never lean on that.
 */

const KEPT_ICONS = { messages: ChatIcon, journalEntries: JournalIcon, worksheets: WorksheetsIcon, sessions: SessionsIcon }

const fullName = (therapist) =>
  [therapist?.title, therapist?.firstName, therapist?.lastName].filter(Boolean).join(' ')

function Portrait({ therapist }) {
  const initials = [therapist?.firstName, therapist?.lastName].filter(Boolean).map((part) => part[0]).join('')
  return (
    <div className="relative mx-auto size-24 sm:size-28">
      {/* A soft halo, a property of the light rather than a ring drawn on. */}
      <span aria-hidden="true" className="absolute -inset-3 rounded-full bg-sage/15 blur-xl" />
      {therapist?.photoUrl ? (
        <img
          src={therapist.photoUrl}
          alt=""
          className="relative size-full rounded-full object-cover ring-4 ring-paper shadow-[0_12px_30px_-14px_rgb(25_18_43/0.45)]"
        />
      ) : (
        <span
          aria-hidden="true"
          className="relative grid size-full place-items-center rounded-full bg-ink font-body text-subsection text-paper ring-4 ring-paper"
        >
          {initials}
        </span>
      )}
    </div>
  )
}

/** The keepsake: what is waiting, as four drawn counts on hairline seams. */
function KeptPanel({ kept }) {
  if (!kept) return null
  return (
    <section aria-labelledby="kept-heading" className="rounded-2xl bg-paper px-5 py-6 sm:px-7">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-sage/15 text-sage-deep">
          <KeptIcon size={18} />
        </span>
        <h2 id="kept-heading" className="font-body text-ui font-medium text-ink-deep">
          {ENDED.keptHeading}
        </h2>
      </div>

      {/* gap-px over a sage ground draws the seams, correct at every width. */}

      {/* -------------------------------------- */}

      <ul className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
        {ENDED.kept.map(({ key, one, many }) => {
          const Icon = KEPT_ICONS[key]
          const count = kept[key] ?? 0
          return (
            <li
              key={key}
              className="flex flex-col items-center justify-center rounded-xl border border-ink/5 bg-mist/60 p-4 text-center transition-colors hover:bg-mist"
            >
              <Icon size={18} className="mb-2 text-sage-deep" />
              <span className="block font-body text-subsection font-bold tabular-nums leading-tight text-ink-deep">
                {count}
              </span>
              <span className="mt-1 block font-body text-caption leading-tight text-ink/70">
                {count === 1 ? one : many}
              </span>
            </li>
          )
        })}
      </ul>


      {/* -------------------------------------- */}

      <Text size="caption" tone="muted" className="mt-4 max-w-measure">
        {ENDED.keptNote}
      </Text>
    </section>
  )
}

function Reactivate() {
  const [opening, setOpening] = useState(false)
  const [error, setError] = useState(null)

  async function go() {
    setOpening(true)
    setError(null)
    try {
      const { url } = await startResubscription()
      // Stays "opening" while the browser leaves for Stripe.
      window.location.assign(url)
    } catch (failure) {
      setOpening(false)
      setError(failure?.status ? failure.message : ENDED.failed)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Button
        size="lg"
        loading={opening}
        onClick={go}
        className="w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink aria-busy:disabled:cursor-progress aria-busy:disabled:opacity-100 sm:w-auto"
      >
        {opening ? ENDED.opening : ENDED.action}
      </Button>
      <Text size="caption" tone="muted" className="max-w-sm">
        {ENDED.actionNote}
      </Text>
      {error && (
        <p role="alert" className="max-w-sm font-body text-caption text-clay">
          {error}
        </p>
      )}
    </div>
  )
}

function Unavailable() {
  return (
    <p className="rounded-2xl bg-paper px-5 py-5 text-center font-body text-ui leading-relaxed text-ink/70 sm:px-7">
      {ENDED.unavailable}{' '}
      <a
        href={`mailto:${SUPPORT_EMAIL}`}
        className="font-medium text-ink underline decoration-ink/60 underline-offset-2 hover:decoration-2"
      >
        {SUPPORT_EMAIL}
      </a>{' '}
      {ENDED.unavailableTail}
    </p>
  )
}

export default function SubscriptionEnded({ therapist, reviewState, kept, canResubscribe }) {
  const reduce = useReducedMotion()
  const name = fullName(therapist)
  // One gentle settle, in order, then stillness. Reduced motion: all at once.
  const rise = (index) => ({
    initial: reduce ? false : { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay: reduce ? 0 : index * 0.1, ease: [0.16, 1, 0.3, 1] },
  })

  return (
    <div className="relative min-h-dvh overflow-y-auto bg-mist px-4 py-12 sm:py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-24 size-[30rem] -translate-x-1/2 rounded-full bg-sage/10 blur-[130px]"
      />

      <main className="relative mx-auto flex w-full max-w-2xl flex-col gap-6">
        <motion.header {...rise(0)} className="text-center">
          <Portrait therapist={therapist} />
          <Heading level={1} size="subsection" className="mt-6">
            {ENDED.title}
          </Heading>
          <Text tone="muted" className="mx-auto mt-2 max-w-measure">
            {name ? ENDED.continueWith(name) : ENDED.continueWithout}
          </Text>
        </motion.header>

        <motion.div {...rise(1)}>
          <KeptPanel kept={kept} />
        </motion.div>

        {canResubscribe ? (
          <>
            <motion.div {...rise(2)}>
              <RenewalDisclosure />
            </motion.div>
            <motion.div {...rise(3)}>
              <Reactivate />
            </motion.div>
          </>
        ) : (
          <motion.div {...rise(2)}>
            <Unavailable />
          </motion.div>
        )}

        {/* §9.6: offered once, below everything they came here to know. */}
        {reviewState === 'eligible' && (
          <div className="rounded-2xl bg-paper px-5 py-6 sm:px-7">
            <RatingForm therapistName={therapist?.firstName} />
          </div>
        )}
      </main>
    </div>
  )
}
