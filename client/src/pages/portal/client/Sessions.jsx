import { useId, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ScreenHeader } from '../../../components/portal/client/ScreenScaffold'
import { Button } from '../../../components/ui'
import NextSession from '../../../components/portal/client/sessions/NextSession'
import SessionCounter from '../../../components/portal/sessions/SessionCounter'
import MySessionRow from '../../../components/portal/client/sessions/MySessionRow'
import { SessionsIcon } from '../../../components/portal/client/ClientPortalIcons'
import { useClientPortal } from '../../../lib/clientPortalContext'
import { useMySessions } from '../../../lib/client/useMySessions'
import { counterView } from '../../../lib/client/mySessions'
import { detectViewerZone } from '../../../lib/workingHours'
import { useNow } from '../../../lib/useNow'
import { SCREENS, MY_SESSIONS } from '../../../data/clientPortalContent'

const SHADOW = 'shadow-[0_18px_50px_-28px_rgba(25,18,43,0.35)]'

/**
 * §7.4 — the Session Hub. VIEW ONLY: the therapist schedules and the client
 * joins. There is no control here that creates, moves or requests anything,
 * and the server refuses all of it regardless. A change is asked for in chat.
 */
export default function Sessions() {
  const { booking, therapist, subscription, access } = useClientPortal()
  const timeZone = useMemo(() => detectViewerZone(), [])
  const now = useNow(30 * 1000)
  const reduce = useReducedMotion()
  const laterId = useId()
  const earlierId = useId()

  const sessions = useMySessions(booking?.id)
  const [next, ...later] = sessions.upcoming
  const name = therapist?.firstName || 'your therapist'
  // The list's own counter is read after the on-read check, so it is the freshest (9.5).
  const live = sessions.counter
  const counter = counterView(
    live ? { sessionsRemaining: live.sessionsRemaining, currentPeriodEnd: live.cycleEndsAt } : subscription,
    live?.access ?? access,
    timeZone,
  )

  return (
    <section className="flex flex-col gap-7 pb-6">
      <ScreenHeader title={SCREENS.sessions.title} lead={SCREENS.sessions.lead} />

      {sessions.status === 'loading' && <PageSkeleton />}

      {sessions.status === 'error' && (
        <div className="flex flex-col items-start gap-3 rounded-2xl bg-paper px-5 py-5">
          <p className="font-body text-ui text-ink">{MY_SESSIONS.loadError}</p>
          <Button variant="ghost" size="sm" onClick={sessions.refresh}>
            {MY_SESSIONS.retry}
          </Button>
        </div>
      )}

      {sessions.status === 'ready' && (
        <>
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="flex flex-col gap-3">
              {next ? (
                <NextSession session={next} therapist={therapist} timeZone={timeZone} now={now} />
              ) : (
                <Empty />
              )}
              {next && (
                <p className="px-1 font-body text-caption text-ink/70">
                  {MY_SESSIONS.change(name)}{' '}
                  <Link
                    to="/portal/chat"
                    className="inline-flex min-h-11 items-center font-medium text-ink underline decoration-ink/50 underline-offset-4 transition-colors duration-200 hover:decoration-ink"
                  >
                    {MY_SESSIONS.openChat}
                  </Link>
                </p>
              )}
            </div>
            {counter && (
              <SessionCounter
                left={counter.left}
                total={counter.total}
                title={MY_SESSIONS.counter.left(counter.left)}
                caption={
                  counter.date
                    ? counter.ending
                      ? MY_SESSIONS.counter.ends(counter.date)
                      : MY_SESSIONS.counter.resets(counter.date)
                    : null
                }
              />
            )}
          </div>

          {later.length > 0 && (
            <section aria-labelledby={laterId} className="flex flex-col gap-3">
              <h2 id={laterId} className="px-1 font-body text-ui font-medium text-ink">
                {MY_SESSIONS.later}
              </h2>
              <div className={`overflow-hidden rounded-2xl bg-paper ${SHADOW}`}>
                <Rows rows={later} tone="upcoming" timeZone={timeZone} reduce={reduce} />
              </div>
            </section>
          )}

          {sessions.history.length > 0 && (
            <section aria-labelledby={earlierId} className="flex flex-col gap-3">
              <h2 id={earlierId} className="px-1 font-body text-ui font-medium text-ink">
                {MY_SESSIONS.earlier}
              </h2>
              <div className="overflow-hidden rounded-2xl bg-paper">
                <Rows rows={sessions.history} tone="history" timeZone={timeZone} reduce={reduce} />
              </div>
              {sessions.historyCursor && (
                <div>
                  <Button variant="ghost" size="sm" onClick={() => sessions.loadMore().catch(() => {})}>
                    {MY_SESSIONS.loadMore}
                  </Button>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </section>
  )
}

function Rows({ rows, tone, timeZone, reduce }) {
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
            <MySessionRow session={session} tone={tone} timeZone={timeZone} />
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  )
}

// The brief's own words: the therapist schedules, so there is nothing to do here yet.
function Empty() {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-paper px-6 py-10 text-center ${SHADOW}`}>
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 size-64 -translate-x-1/2 rounded-full bg-sage/10 blur-[130px]" />
      <span aria-hidden="true" className="relative inline-flex size-14 items-center justify-center rounded-full bg-sage/15 text-sage-deep">
        <SessionsIcon size={26} />
      </span>
      <p className="relative mt-4 font-body text-ui font-medium text-ink">{MY_SESSIONS.empty.title}</p>
      <p className="relative mx-auto mt-1.5 max-w-sm font-body text-caption leading-relaxed text-ink/70">
        {MY_SESSIONS.empty.body}
      </p>
    </div>
  )
}

// The shape the page is about to take. The status sits outside the hidden shapes.
function PageSkeleton() {
  return (
    <>
      <div aria-hidden="true" className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex gap-5 rounded-2xl bg-paper px-6 py-7">
          <div className="h-20 w-16 rounded-xl bg-ink/10 motion-safe:animate-pulse" />
          <div className="flex-1 space-y-3 pt-1">
            <div className="h-5 w-56 rounded bg-ink/10 motion-safe:animate-pulse" />
            <div className="h-4 w-32 rounded bg-ink/10 motion-safe:animate-pulse" />
            <div className="h-11 w-40 rounded-xl bg-ink/10 motion-safe:animate-pulse" />
          </div>
        </div>
        <div className="h-36 rounded-2xl bg-paper motion-safe:animate-pulse" />
      </div>
      <p className="sr-only" role="status">
        Loading your sessions
      </p>
    </>
  )
}
