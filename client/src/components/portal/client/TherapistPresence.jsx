import { useEffect, useMemo, useState } from 'react'
import { cx } from '../../../lib/cx'
import { detectViewerZone } from '../../../lib/workingHours'
import { availabilityLabel, therapistAvailability } from '../../../lib/therapistAvailability'
import { HoursIcon, SproutIcon } from './ClientPortalIcons'

/**
 * The therapist, at the top of the client's portal.
 *
 * A client has exactly one therapist (§7), and this is what their portal is
 * actually about — so the rail opens with a person rather than a product name.
 *
 * THE HOURS LINE IS NOT PRESENCE. §7.1 rules out any "unavailable" barrier and
 * says a message simply waits. There is no online dot, nothing is greyed out,
 * and nothing here gates anything: it reports published working hours in the
 * reader's own clock so they know roughly when to expect a reply.
 *
 * No ink wash on the photograph — §24.5 makes therapist portraits the explicit
 * exception to the site's photo treatment. Real people, shown as real people.
 */
export default function TherapistPresence({ therapist, tone = 'dark', showHours = true }) {
  const dark = tone === 'dark'
  const zone = useMemo(() => detectViewerZone(), [])

  // Re-checked on a slow minute rather than once on mount, so the line does not
  // still read "back at 9:00" an hour after they started working. One interval,
  // comparing timestamps — the same approach useIdleTimer took, and for the
  // same reason: a tab that slept must be correct the instant it wakes.
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  if (!therapist) return null

  const name = [therapist.title, therapist.firstName, therapist.lastName].filter(Boolean).join(' ')
  const credentials = [therapist.credentialInitials, therapist.therapistType]
    .filter(Boolean)
    .join(' · ')

  const availability = showHours
    ? therapistAvailability(therapist.workingHours, therapist.timezone, now)
    : null
  const hours = availabilityLabel(availability, zone, now)

  const initials = [therapist.firstName, therapist.lastName]
    .filter(Boolean)
    .map((part) => part[0])
    .join('')

  return (
    <div className="flex items-start gap-3">
      {therapist.photoUrl ? (
        <img
          src={therapist.photoUrl}
          alt={name}
          className={cx(
            'size-12 shrink-0 rounded-full object-cover',
            dark ? 'ring-1 ring-paper/20' : 'ring-1 ring-ink/12',
          )}
        />
      ) : (
        <span
          aria-hidden="true"
          className={cx(
            'flex size-12 shrink-0 items-center justify-center rounded-full font-body text-ui',
            dark ? 'bg-paper/10 text-paper' : 'bg-sage/12 text-sage-deep',
          )}
        >
          {initials}
        </span>
      )}

      <div className="min-w-0">
        <p
          className={cx(
            'font-body text-ui font-medium',
            dark ? 'text-paper' : 'text-ink',
          )}
        >
          {name}
        </p>

        {credentials && (
          <p className={cx('font-body text-caption', dark ? 'text-paper/70' : 'text-ink/70')}>
            {credentials}
          </p>
        )}

        {hours && (
          <p
            className={cx(
              'mt-1.5 flex items-start gap-1.5 font-body text-caption',
              dark ? 'text-paper/70' : 'text-ink/70',
            )}
          >
            {/* Something growing when they are here, a clock when they are not. */}
            {availability.state === 'working' ? (
              <SproutIcon
                size={14}
                className={cx('mt-0.5 shrink-0', dark ? 'text-sage' : 'text-sage-deep')}
              />
            ) : (
              <HoursIcon
                size={14}
                className={cx('mt-0.5 shrink-0', dark ? 'text-sage' : 'text-sage-deep')}
              />
            )}
            <span>{hours}</span>
          </p>
        )}
      </div>
    </div>
  )
}
