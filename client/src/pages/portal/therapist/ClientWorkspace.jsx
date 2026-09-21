import { Link, Navigate, useParams } from 'react-router-dom'
import ClientIdentityStrip from '../../../components/portal/therapist/workspace/ClientIdentityStrip'
import WorkspaceTabs from '../../../components/portal/therapist/workspace/WorkspaceTabs'
import ClientInfo from '../../../components/portal/therapist/workspace/ClientInfo'
import TherapistChat from '../../../components/portal/therapist/workspace/TherapistChat'
import WorksheetsTab from '../../../components/portal/therapist/workspace/WorksheetsTab'
import JournalNotesTab from '../../../components/portal/therapist/workspace/JournalNotesTab'
import SessionsTab from '../../../components/portal/therapist/workspace/sessions/SessionsTab'
import { cx } from '../../../lib/cx'
import { useTherapistClient } from '../../../lib/therapist/useTherapistClient'
import {
  WORKSPACE_TABS,
  DEFAULT_WORKSPACE_TAB,
  CLIENT_INFO,
  CLIENTS_LIST,
} from '../../../data/therapistPortalContent'

/**
 * One client's workspace — master spec §8.2 to §8.6.
 *
 * THE INBOX'S RIGHT-HAND SIDE. The same five tabs always exist and only the
 * data changes — that is §8's architecture, and it is why the tabs are one
 * component reading one list rather than anything built per client.
 *
 * THE TAB IS IN THE URL, so a refresh keeps the therapist exactly where they
 * were, and clicking the next client in the sidebar carries the tab across —
 * reading worksheets for one person and moving to the next stays in worksheets.
 * The DATA never carries across: `useTherapistClient` is keyed on the booking
 * id and clears during render, so no row of one person's record can appear
 * under another's name.
 *
 * All five tabs are built: Chat (8.3), Worksheets (8.4), Sessions (9.2),
 * Journal and Notes (8.6) and Client info (8.2).
 */
export default function ClientWorkspace() {
  const { bookingId, tab } = useParams()
  const { client, loading, error, retry } = useTherapistClient(bookingId)

  const known = WORKSPACE_TABS.some((entry) => entry.slug === tab)

  // A mistyped tab goes somewhere useful rather than to a 404 — the tab set is
  // ours, not something the therapist chose to get wrong.
  if (!known) {
    return <Navigate to={`/portal/clients/${bookingId}/${DEFAULT_WORKSPACE_TAB}`} replace />
  }

  if (loading) return <WorkspaceSkeleton />

  /**
   * TWO DIFFERENT FAILURES, AND THEY ARE NOT THE SAME SCREEN.
   *
   * A 404 is the server's deliberate refusal: a booking that does not exist, a
   * malformed id, and another therapist's client all come back identical, so
   * this screen must not try to tell them apart either — and must not offer a
   * retry, because nothing about it is transient.
   *
   * Anything else — no network, a timeout, a 500 — IS transient, and refusing
   * to offer a retry there would leave a therapist stranded on a page that
   * would have worked a second later.
   */
  if (error) {
    return error.status === 404 ? <NotYourClient /> : <LoadFailed error={error} onRetry={retry} />
  }

  if (!client) return <NotYourClient />

  const ended = client.bookingStatus === 'ended'
  const isChat = tab === 'chat'

  return (
    // The chat is BOUNDED to the pane (`min-h-0`) so its thread scrolls and the
    // page does not. Every other tab grows with its content and lets the pane
    // scroll — bounding those would end the sticky header's containing block at
    // the bottom of the first screenful, and the strip would scroll away.
    <div className={cx('flex flex-1 flex-col', isChat && 'min-h-0')}>
      {/* ONE sticky block, so the strip can never scroll away from the tabs it
          belongs to. Negative margins let it span the full content column while
          its children keep the column's own padding. */}
      <div className="sticky top-0 z-20 -mx-4 -mt-6 border-b border-ink/12 bg-paper sm:-mx-6 sm:-mt-8 lg:-mx-10 lg:-mt-10">
        <ClientIdentityStrip client={client} ended={ended} />
        <WorkspaceTabs bookingId={bookingId} />
      </div>

      {isChat ? (
        /*
          THE CHAT IS THE PANE, NOT A BOX IN IT. Header on paper, thread on
          mist, composer on paper — the negative margins cancel the pane's own
          padding at the sides and the foot so the three meet its edges.

          `key={bookingId}` is the first layer of the leak defence: switching
          clients discards this whole chat instance rather than reusing it.
        */
        <div className="-mx-4 -mb-6 flex min-h-0 flex-1 flex-col sm:-mx-6 sm:-mb-8 lg:-mx-10 lg:-mb-10">
          <TherapistChat key={bookingId} bookingId={bookingId} clientName={client.client.name} />
        </div>
      ) : (
        /* Journal and Notes runs wider: it is two columns side by side on a
           large screen, which `max-w-4xl` would squeeze into one. */
        <div className={cx('w-full pt-6 sm:pt-8', tab === 'journal' ? 'max-w-7xl' : 'max-w-4xl')}>
          {tab === 'info' && <ClientInfo data={client} />}
          {tab === 'worksheets' && (
            <WorksheetsTab key={bookingId} bookingId={bookingId} clientName={client.client.name} ended={ended} />
          )}
          {tab === 'journal' && (
            <JournalNotesTab key={bookingId} bookingId={bookingId} clientName={client.client.name} />
          )}
          {tab === 'sessions' && (
            <SessionsTab key={bookingId} bookingId={bookingId} client={client} ended={ended} />
          )}
        </div>
      )}
    </div>
  )
}

/**
 * The shape the workspace is about to take, not a spinner — the lesson recorded
 * in 4.4 and applied again in 7.1 and 8.1. `motion-safe:` so it holds still for
 * anyone who asked for less motion.
 */
function WorkspaceSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-1 flex-col">
      <div className="flex items-start gap-4 pt-1">
        <div className="size-14 shrink-0 rounded-full bg-ink/10 motion-safe:animate-pulse" />
        <div className="space-y-2.5 pt-1">
          <div className="h-5 w-44 rounded bg-ink/10 motion-safe:animate-pulse" />
          <div className="h-3 w-36 rounded bg-ink/10 motion-safe:animate-pulse" />
        </div>
      </div>

      <div className="mt-4 flex gap-1.5">
        {[0, 1, 2].map((chip) => (
          <div key={chip} className="h-7 w-24 rounded-full bg-ink/10 motion-safe:animate-pulse" />
        ))}
      </div>

      <div className="mt-6 flex gap-3 border-b border-ink/12 pb-3">
        {[0, 1, 2, 3, 4].map((t) => (
          <div key={t} className="h-4 w-20 rounded bg-ink/10 motion-safe:animate-pulse" />
        ))}
      </div>

      <div className="mt-6 h-40 rounded-2xl bg-ink/10 motion-safe:animate-pulse" />

      <p className="sr-only" role="status">
        Loading this client
      </p>
    </div>
  )
}

/**
 * The one refusal this screen ever shows.
 *
 * It says nothing about WHY, because the server deliberately says nothing
 * either: a booking that does not exist and one belonging to another therapist
 * return byte-identical 404s, so that comparing responses cannot be used to
 * discover which booking ids are real. Wording a different message for each
 * here would undo that on the client side.
 */
/** A transient failure — the network, a timeout, a 500. Worth retrying. */
function LoadFailed({ error, onRetry }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
      <h1 className="font-body text-subsection font-medium text-ink">{CLIENT_INFO.error}</h1>
      <p className="mt-2.5 max-w-sm font-body text-ui leading-relaxed text-ink/70">
        {error.message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex min-h-11 items-center rounded-xl border border-ink/50 px-5 font-body text-ui font-medium text-ink transition-colors duration-200 ease-out hover:bg-ink/5"
      >
        {CLIENT_INFO.retry}
      </button>
    </div>
  )
}

function NotYourClient() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
      <h1 className="font-body text-subsection font-medium text-ink">{CLIENT_INFO.error}</h1>
      <p className="mt-2.5 max-w-sm font-body text-ui leading-relaxed text-ink/70">
        This client is not on your list. They may have been matched with another therapist.
      </p>
      <Link
        to="/portal"
        className="mt-6 inline-flex min-h-11 items-center rounded-xl border border-ink/50 px-5 font-body text-ui font-medium text-ink transition-colors duration-200 ease-out hover:bg-ink/5"
      >
        {CLIENTS_LIST.backToList}
      </Link>
    </div>
  )
}
