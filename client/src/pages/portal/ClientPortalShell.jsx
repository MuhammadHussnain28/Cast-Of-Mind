import { useCallback, useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import SkipLink from '../../components/layout/SkipLink'
import SignOutButton from '../../components/auth/SignOutButton'
import ErrorState from '../../components/states/ErrorState'
import ClientRail from '../../components/portal/client/ClientRail'
import ClientTabBar from '../../components/portal/client/ClientTabBar'
import AccessNotice from '../../components/portal/client/AccessNotice'
import SubscriptionEnded from '../../components/portal/client/SubscriptionEnded'
import PortalSkeleton from '../../components/portal/client/PortalSkeleton'
import PortalSocketProvider from '../../components/portal/PortalSocketProvider'
import UnreadProvider from '../../components/portal/UnreadProvider'
import WorksheetsPendingProvider from '../../components/portal/client/WorksheetsPendingProvider'
import TherapistPresence from '../../components/portal/client/TherapistPresence'
import { cx } from '../../lib/cx'
import { ClientPortalContext } from '../../lib/clientPortalContext'
import { useKeyboardViewportHeight } from '../../lib/useVisualViewport'
import { fetchClientMe } from '../../lib/api/clientPortalApi'
import { useSaveBrowserTimezone } from '../../lib/client/useSaveBrowserTimezone'
import logoInk from '../../assets/cast-of-mind-logo-singular-ink.png'

/**
 * The client portal — master spec §7, portal notes §24.8.
 *
 * The frame is the split the site already uses on /contact,
 * /join-as-therapist, /questionnaire and /checkout: a dark ink aside with a
 * soft sage wash, a light work area beside it. Reusing it is what makes the
 * portal read as the fifth surface in one product rather than a new place the
 * client has been moved to.
 *
 * Content sits on `mist` with `paper` panels, which is warmer than the admin
 * portal's flat paper — §24.8 asks for exactly that difference.
 *
 * THIS SHELL IS NOT THE ACCESS CONTROL. It renders what `access` says, and the
 * server refuses every gated request independently (§13). A client who edited
 * their own JavaScript to get past the ended screen would reach a portal whose
 * every request comes back 403.
 */
export default function ClientPortalShell() {
  const [state, setState] = useState(null)
  const [error, setError] = useState(null)
  // Bumped to re-run the fetch. A counter rather than a boolean, so a retry
  // after a retry still triggers.
  const [attempt, setAttempt] = useState(0)

  // Called before the early returns below — hooks cannot sit behind a branch.
  const keyboardHeight = useKeyboardViewportHeight()
  useSaveBrowserTimezone(state?.profile?.timezone ?? null, Boolean(state) && state.access !== 'ended')

  useEffect(() => {
    let cancelled = false

    // No synchronous setState before the first await — the React Compiler rule
    // that `useApi` (0.6) and both admin screens (4.2) were fixed for.
    fetchClientMe()
      .then((data) => {
        if (cancelled) return
        setState(data)
        setError(null)
      })
      .catch((err) => {
        if (!cancelled) setError(err)
      })

    return () => {
      cancelled = true
    }
  }, [attempt])

  const refresh = useCallback(() => setAttempt((n) => n + 1), [])

  if (error && !state) {
    return (
      <div className="min-h-dvh bg-mist px-4 py-12">
        <ErrorState message={error.message} onRetry={refresh} />
      </div>
    )
  }

  if (!state) return <PortalSkeleton />

  // §13: login still works, the portal does not. Everything is preserved, and
  // slice 12 replaces this screen with the re-subscribe flow.
  if (state.access === 'ended') {
    return <SubscriptionEnded therapist={state.therapist} reviewState={state.reviewState} />
  }

  const value = { ...state, refresh }

  return (
    <ClientPortalContext.Provider value={value}>
      {/* One socket for the whole portal, not one per screen. A connection that
          tore down on every tab change would drop messages, and 7.6's unread
          badges need the same one. Null-tolerant: chat falls back to REST. */}
      <PortalSocketProvider>
      <UnreadProvider myRole={state.user?.role}>
      <WorksheetsPendingProvider initial={state.pendingWorksheets ?? 0}>
      {/* `h-dvh` with `overflow-hidden` rather than `min-h-dvh`, so the column
          below has a DEFINITE height. The chat screen fills the remaining space
          and scrolls internally; without a bounded chain its `flex-1` resolves
          to nothing and the thread cannot scroll at all.

          The inline height takes over ONLY while a software keyboard is up, on
          a browser that draws it over the viewport rather than shrinking it —
          otherwise the composer sits underneath it. Null the rest of the time,
          so `dvh` is what governs in the ordinary case. */}
      <div
        className="flex h-dvh flex-col overflow-hidden bg-mist lg:grid lg:grid-cols-[272px_1fr]"
        style={keyboardHeight ? { height: `${keyboardHeight}px` } : undefined}
      >
        <SkipLink />

        {/* Desktop rail. Exactly one of this and the tab bar is ever in the
            DOM, so a screen reader never meets the same navigation twice. */}
        <aside className="hidden lg:sticky lg:top-0 lg:block lg:h-dvh">
          <ClientRail
            therapist={state.therapist}
            subscription={state.subscription}
            bookingId={state.booking?.id}
            footer={<SignOutButton />}
          />
        </aside>

        {/* Phone header. The rail is absent here, so the logo and the way out
            need somewhere to live. */}
        <header className="shrink-0 border-b border-ink/12 bg-paper/90 backdrop-blur-md lg:hidden">
          <div className="flex items-center gap-4 px-4 py-3">
            <img src={logoInk} alt="Cast of Mind" className="h-7 w-auto shrink-0" />
            <div className="ml-auto shrink-0">
              <SignOutButton />
            </div>
          </div>
        </header>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <main
            id="main"
            tabIndex={-1}
            className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-6 focus-visible:outline-none sm:px-6 sm:py-8 lg:px-10 lg:py-10"
          >
            <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col">
              {/* The therapist leads the content on a phone, where there is no
                  rail to carry them. */}
              <div className="mb-6 shrink-0 rounded-2xl bg-paper px-4 py-4 lg:hidden">
                <TherapistPresence therapist={state.therapist} tone="light" />
              </div>

              <AccessNotice access={state.access} subscription={state.subscription} />

              {/* `flex-1 min-h-0` so a screen that wants the viewport — the
                  chat — can take it. Screens that do not simply sit at the top. */}
              <div
                className={cx(
                  'flex min-h-0 flex-1 flex-col',
                  state.access !== 'active' && 'mt-6',
                )}
              >
                <Outlet />
              </div>
            </div>
          </main>

          <ClientTabBar bookingId={state.booking?.id} />
        </div>
      </div>
      </WorksheetsPendingProvider>
      </UnreadProvider>
      </PortalSocketProvider>
    </ClientPortalContext.Provider>
  )
}
