import { useId } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Button } from '../../../../ui'
import { cx } from '../../../../../lib/cx'
import { useSessions } from '../../../../../lib/therapist/useSessions'
import { detectViewerZone } from '../../../../../lib/workingHours'
import { useNow } from '../../../../../lib/useNow'
import SessionCounter from '../../../sessions/SessionCounter'
import { SESSIONS } from '../../../../../data/therapistPortalContent'
import { HoursIcon, SessionsIcon } from '../../../client/ClientPortalIcons'
import SessionForm from './SessionForm'
import SessionItem from './SessionItem'

const SHADOW = 'shadow-[0_18px_50px_-28px_rgba(25,18,43,0.35)]'

// Sessions for one client (§8.4): schedule, see what is ahead, keep the record.
export default function SessionsTab({ bookingId, client, ended }) {
  const sessions = useSessions(bookingId)
  const reduce = useReducedMotion()
  const upcomingId = useId()
  const historyId = useId()

  const name = client.client?.name ?? 'your client'
  const clientZone = client.client?.timezone ?? null
  // No subscription at all resolves to ended, as the server's gate does.
  const clientEnded = !client.subscription || client.subscription.access === 'ended'
  const zone = sessions.therapistTimezone
  const displayZone = zone || detectViewerZone()
  const canSchedule = !ended && !clientEnded && Boolean(zone)
  const canEdit = canSchedule

  const now = useNow(30 * 1000)
  const [next, ...later] = sessions.upcoming.data
  const nothing = sessions.upcoming.data.length === 0 && sessions.history.data.length === 0

  // The counter as the list read it, after the on-read check (9.5).
  const counter = sessions.counter
  const cycleEnds = counter?.cycleEndsAt
    ? new Intl.DateTimeFormat(undefined, { timeZone: displayZone, day: 'numeric', month: 'long' }).format(
        new Date(counter.cycleEndsAt),
      )
    : null
  const counterCaption = !counter
    ? null
    : counter.access === 'ended'
      ? SESSIONS.counter.ended
      : cycleEnds
        ? counter.access === 'ending'
          ? SESSIONS.counter.ends(cycleEnds)
          : SESSIONS.counter.resets(cycleEnds)
        : null
  const cycle = counter?.cycleEndsAt
    ? {
        remaining: counter.sessionsRemaining,
        endsAt: counter.cycleEndsAt,
        scheduledTimes: sessions.upcoming.data.map((row) => row.scheduledAt),
      }
    : null

  const itemProps = {
    therapistZone: displayZone,
    clientZone,
    clientName: name,
    canEdit,
    now,
    onUpdate: sessions.update,
    onCancel: sessions.cancel,
    onHeld: sessions.markHeld,
    onNotHeld: sessions.markNotHeld,
  }

  return (
    <div className="mt-6 flex flex-col gap-8">
      <h2 className="sr-only">
        {SESSIONS.heading} — {name}
      </h2>

      {sessions.status === 'loading' && <TabSkeleton />}

      {sessions.status === 'error' && (
        <div className="flex flex-col items-start gap-3 rounded-2xl bg-paper px-5 py-5">
          <p className="font-body text-ui text-ink">{SESSIONS.loadError}</p>
          <Button variant="ghost" size="sm" onClick={sessions.retry}>
            {SESSIONS.retry}
          </Button>
        </div>
      )}

      {sessions.status === 'ready' && (
        <>
          {counter && (
            <SessionCounter
              layout="row"
              left={counter.sessionsRemaining}
              total={counter.total}
              title={SESSIONS.counter.left(counter.sessionsRemaining)}
              caption={counterCaption}
            />
          )}

          {canSchedule ? (
            <Surface glow="right">
              <div className="px-5 py-5 sm:px-6 sm:py-6">
                <SessionForm
                  therapistZone={zone}
                  clientZone={clientZone}
                  clientName={name}
                  cycle={cycle}
                  onSubmit={sessions.schedule}
                />
              </div>
            </Surface>
          ) : (
            <p className="flex items-start gap-3 rounded-2xl bg-paper px-5 py-4 font-body text-caption text-ink">
              <HoursIcon size={18} className="mt-0.5 shrink-0 text-ink/70" />
              {!zone ? SESSIONS.zoneMissing : ended ? SESSIONS.ended.booking : SESSIONS.ended.subscription(name)}
            </p>
          )}

          {nothing ? (
            <Empty name={name} />
          ) : (
            <>
              <section aria-labelledby={upcomingId} className="flex flex-col gap-3">
                <SectionHeading id={upcomingId} title={SESSIONS.upcoming} count={sessions.upcoming.data.length} />

                {next ? (
                  <Surface glow="left">
                    <SessionItem key={next.id} session={next} tone="next" {...itemProps} />
                  </Surface>
                ) : (
                  <p className="rounded-2xl bg-paper px-5 py-4 font-body text-caption text-ink/70">
                    {SESSIONS.noUpcoming}
                  </p>
                )}

                {later.length > 0 && (
                  <Surface>
                    <Rows rows={later} tone="upcoming" reduce={reduce} itemProps={itemProps} />
                  </Surface>
                )}

                {sessions.upcoming.nextCursor && (
                  <div>
                    <Button variant="ghost" size="sm" onClick={() => sessions.loadMore('upcoming').catch(() => {})}>
                      {SESSIONS.loadMoreUpcoming}
                    </Button>
                  </div>
                )}
              </section>

              {sessions.history.data.length > 0 && (
                <section aria-labelledby={historyId} className="flex flex-col gap-3">
                  <SectionHeading id={historyId} title={SESSIONS.history} />
                  <Surface quiet>
                    <Rows rows={sessions.history.data} tone="history" reduce={reduce} itemProps={itemProps} />
                  </Surface>
                  {sessions.history.nextCursor && (
                    <div>
                      <Button variant="ghost" size="sm" onClick={() => sessions.loadMore('history').catch(() => {})}>
                        {SESSIONS.loadMoreHistory}
                      </Button>
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

// A paper surface with one declared depth. `quiet` drops the shadow for history.
function Surface({ glow, quiet, children }) {
  return (
    <div className={cx('relative overflow-hidden rounded-2xl bg-paper', !quiet && SHADOW)}>
      {glow && (
        <div
          aria-hidden="true"
          className={cx(
            'pointer-events-none absolute -top-24 size-64 rounded-full bg-sage/10 blur-[130px]',
            glow === 'left' ? '-left-20' : '-right-20',
          )}
        />
      )}
      <div className="relative">{children}</div>
    </div>
  )
}

function SectionHeading({ id, title, count }) {
  return (
    <h3 id={id} className="flex items-center gap-2 px-1 font-body text-ui font-medium text-ink">
      {title}
      {count > 0 && <span className="font-body text-caption font-normal tabular-nums text-ink/70">{count}</span>}
    </h3>
  )
}

function Rows({ rows, tone, reduce, itemProps }) {
  return (
    <ul className="divide-y divide-ink/12">
      <AnimatePresence initial={false}>
        {rows.map((session) => (
          <motion.li
            key={session.id}
            className="overflow-hidden"
            initial={reduce ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <SessionItem session={session} tone={tone} {...itemProps} />
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  )
}

function Empty({ name }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-paper px-6 py-10 text-center">
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 size-64 -translate-x-1/2 rounded-full bg-sage/10 blur-[130px]" />
      <span aria-hidden="true" className="relative inline-flex size-14 items-center justify-center rounded-full bg-sage/15 text-sage-deep">
        <SessionsIcon size={26} />
      </span>
      <p className="relative mt-4 font-body text-ui font-medium text-ink">{SESSIONS.empty.title(name)}</p>
      <p className="relative mx-auto mt-1.5 max-w-sm font-body text-caption leading-relaxed text-ink/70">
        {SESSIONS.empty.body}
      </p>
    </div>
  )
}

// The shape the tab is about to take, not a spinner. The status sits outside
// the hidden shapes, or a screen reader would never hear it.
function TabSkeleton() {
  return (
    <>
      <div aria-hidden="true" className="flex flex-col gap-8">
        <div className="rounded-2xl bg-paper px-5 py-6">
          <div className="h-4 w-56 rounded bg-ink/10 motion-safe:animate-pulse" />
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div className="space-y-4">
              <div className="h-11 rounded-xl bg-ink/10 motion-safe:animate-pulse" />
              <div className="h-11 rounded-xl bg-ink/10 motion-safe:animate-pulse" />
            </div>
            <div className="h-44 rounded-2xl bg-ink/10 motion-safe:animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl bg-paper px-5 py-5">
          <div className="h-20 w-16 rounded-xl bg-ink/10 motion-safe:animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-52 rounded bg-ink/10 motion-safe:animate-pulse" />
            <div className="h-3 w-40 rounded bg-ink/10 motion-safe:animate-pulse" />
          </div>
        </div>
      </div>
      <p className="sr-only" role="status">
        Loading sessions
      </p>
    </>
  )
}
