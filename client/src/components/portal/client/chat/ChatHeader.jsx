import { useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { cx } from '../../../../lib/cx'
import { Text } from '../../../ui'
import WorkingHoursTable from '../../../therapist/WorkingHoursTable'
import { convertWorkingHours, detectViewerZone, hasAnyHours } from '../../../../lib/workingHours'
import {
  availabilityLabel,
  therapistAvailability,
} from '../../../../lib/therapistAvailability'
import { chat, headerNote } from '../../../../data/chatContent'
import { ChevronDownIcon } from './ChatIcons'

/**
 * The top of the conversation — §7.1's explicit requirement.
 *
 * "Therapist working hours displayed at the top of the chat so the client knows
 * when their therapist is online." Shown two ways: the one-line state everyone
 * reads, and the full week behind a disclosure for anyone who wants to plan.
 *
 * EVERY TIME IS CONVERTED INTO THE READER'S OWN ZONE, reusing the DST-safe
 * conversion from 5.6 rather than a second implementation — including the
 * day-rollover handling, so a Perth therapist reads correctly from Dublin.
 *
 * The note is the developer's approved wording. It makes no promise about reply
 * speed, which §7.1 is explicit about: a message simply waits.
 */
export default function ChatHeader({ therapist }) {
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()

  const zone = useMemo(() => detectViewerZone(), [])
  const now = useMemo(() => new Date(), [])

  const rows = useMemo(
    () =>
      therapist?.workingHours && therapist?.timezone
        ? convertWorkingHours(therapist.workingHours, therapist.timezone, zone, now)
        : [],
    [therapist, zone, now],
  )

  if (!therapist) return null

  const name = therapist.name ?? 'Your therapist'
  const availability = therapistAvailability(therapist.workingHours, therapist.timezone, now)
  const hoursLine = availabilityLabel(availability, zone, now)
  const week = hasAnyHours(rows) ? rows : null

  return (
    <header className="shrink-0 border-b border-ink/12 bg-paper">
      <div className="mx-auto w-full max-w-3xl px-4 py-3 sm:px-5">
        <div className="flex items-start gap-3">
          {therapist.photoUrl ? (
            <img
              src={therapist.photoUrl}
              alt={name}
              className="size-10 shrink-0 rounded-full object-cover ring-1 ring-ink/12"
            />
          ) : null}

          <div className="min-w-0 flex-1">
            <p className="font-body text-ui font-medium text-ink">{name}</p>
            {hoursLine && (
              <p className="font-body text-caption text-ink/70">{hoursLine}</p>
            )}
          </div>

          {week && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="chat-week"
              className={cx(
                'flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-2',
                'font-body text-caption text-ink/70',
                'transition-colors duration-200 ease-out hover:text-ink',
              )}
            >
              <span className="hidden sm:inline">
                {open ? chat.hoursToggleOpen : chat.hoursToggleClosed}
              </span>
              <ChevronDownIcon
                className={cx('transition-transform duration-200', open && 'rotate-180')}
              />
            </button>
          )}
        </div>

        {/* The approved note. Warm, specific, and promising nothing. */}
        <Text size="caption" tone="muted" className="mt-2.5 max-w-measure">
          {headerNote({ name, hours: hoursLine })}
        </Text>

        <AnimatePresence initial={false}>
          {open && week && (
            <motion.div
              id="chat-week"
              initial={reduce ? false : { height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="pt-3">
                <WorkingHoursTable rows={week} theirZone={therapist.timezone} yourZone={zone} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
