import ClientListItem from './ClientListItem'
import ClientListEmpty from './ClientListEmpty'
import TherapistGlobalNav from './TherapistGlobalNav'
import NotificationBell from './notifications/NotificationBell'
import { CLIENTS_LIST } from '../../../data/therapistPortalContent'

/**
 * The inbox's left-hand side — master spec §8, §8.1.
 *
 * ONE COMPONENT, TWO PLACEMENTS. On a desktop this is a persistent 320px rail
 * beside the workspace; on a phone it IS the whole of `/portal`, with the
 * workspace on its own route. Building it once is what keeps the two from
 * drifting into different lists of the same people.
 *
 * INK, AND THAT IS AN ACCESSIBILITY DECISION RATHER THAN A STYLISTIC ONE. The
 * unread badge is gold, gold is 1.63:1 on a light surface and banned outright
 * as text or an indicator there, and 11.08:1 on ink. Both portal navigations
 * are dark for exactly this reason (7.1, 7.6). A light client list would have
 * no legible colour for the one signal the list exists to carry.
 *
 * 320px rather than the client rail's 272px: a row here carries a monogram, a
 * name, a time and a badge, and at 272px a long name truncates at precisely the
 * moment a badge appears beside it.
 */
export default function TherapistRail({ state, activeTab, onNavigate, footer }) {
  const { clients, total, loading, error, hasMore, loadingMore, onRetry, onLoadMore } = state

  return (
    <div data-surface="dark" className="relative flex h-full flex-col overflow-hidden bg-ink">
      {/* Ambient only — light falling on a flat ground, never a band gradient.
          The same wash the client rail, the chat opening screen and the
          marketing asides carry, so the whole product shares one atmosphere. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-20 size-72 rounded-full bg-sage/10 blur-[130px]"
      />

      <div className="relative flex items-center justify-between gap-2 px-5 pb-4 pr-3 pt-5">
        <div className="flex items-baseline gap-2">
          <h2 className="font-body text-ui font-medium text-paper">{CLIENTS_LIST.heading}</h2>
          {!loading && !error && total > 0 && (
            <>
              {/* Decorative: the real count is announced on the list below. */}
              <span aria-hidden="true" className="font-body text-caption tabular-nums text-paper/70">
                {total}
              </span>
              <span className="sr-only">{CLIENTS_LIST.countLabel(total)}</span>
            </>
          )}
        </div>

        {/* §8.8: what happened with the clients NOT on screen. It sits beside
            the list's own heading because that is the thing it is about. */}
        <NotificationBell />
      </div>

      <div className="relative min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {loading && <RailSkeleton />}

        {!loading && error && (
          <div className="px-2 py-6">
            <p className="font-body text-ui text-paper">{CLIENTS_LIST.error}</p>
            <p className="mt-1.5 font-body text-caption text-paper/70">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 inline-flex min-h-11 items-center rounded-xl border border-paper/40 px-4 font-body text-ui font-medium text-paper transition-colors duration-200 ease-out hover:bg-paper/10"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && clients.length === 0 && <ClientListEmpty />}

        {!loading && !error && clients.length > 0 && (
          <>
            <nav aria-label={CLIENTS_LIST.navLabel}>
              <ul className="flex flex-col gap-0.5">
                {clients.map((client) => (
                  <ClientListItem key={client.bookingId} client={client} tab={activeTab} />
                ))}
              </ul>
            </nav>

            {/* Only ever rendered past the page size, which a real account will
                not reach. It exists because the endpoint pages, and a list that
                silently stopped at fifty would be worse than a slow one. */}
            {hasMore && (
              <button
                type="button"
                onClick={onLoadMore}
                disabled={loadingMore}
                className="mt-2 flex min-h-11 w-full items-center justify-center rounded-xl border border-paper/40 font-body text-ui font-medium text-paper transition-colors duration-200 ease-out hover:bg-paper/10 disabled:opacity-60"
              >
                {loadingMore ? 'Loading…' : CLIENTS_LIST.loadMore}
              </button>
            )}
          </>
        )}
      </div>

      <div className="relative border-t border-paper/12">
        <TherapistGlobalNav onNavigate={onNavigate} />
        {footer && <div className="px-3 pb-4">{footer}</div>}
      </div>
    </div>
  )
}

/**
 * The shape the list is about to take, not a spinner in an empty rail — the
 * lesson recorded in 4.4 and applied again in 7.1. `motion-safe:` so it holds
 * still for anyone who asked for less motion.
 */
function RailSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-0.5">
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="flex min-h-16 items-center gap-3 px-3 py-2.5">
          <div className="size-10 shrink-0 rounded-full bg-paper/10 motion-safe:animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-28 rounded bg-paper/10 motion-safe:animate-pulse" />
            <div className="h-2.5 w-20 rounded bg-paper/10 motion-safe:animate-pulse" />
          </div>
        </div>
      ))}
      <p className="sr-only" role="status">
        Loading your clients
      </p>
    </div>
  )
}
