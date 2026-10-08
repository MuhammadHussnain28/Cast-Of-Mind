import { useCallback, useEffect, useMemo } from 'react'
import { useChat } from '../../../../lib/chat/useChat'
import { useUnread } from '../../../../lib/chat/unreadContext'
import { useDrafts } from '../../../../lib/chat/draftContext'
import { openingMessageId } from '../../../../lib/chat/openingMessage'
import { useOnline } from '../../../../lib/useOnline'
import { detectViewerZone } from '../../../../lib/workingHours'
import { THERAPIST_CHAT } from '../../../../data/therapistPortalContent'
import MessageThread from '../../chat/MessageThread'
import MessageAnnouncer from '../../chat/MessageAnnouncer'
import Composer from '../../chat/Composer'
import { OpenQuoteIcon } from '../../chat/ChatIcons'

const MY_ROLE = 'therapist'

/**
 * A readable name for an IANA zone — "India Standard Time" rather than
 * "Asia/Kolkata". Falls back to the identifier itself, with its underscores
 * opened out, on a platform whose Intl cannot name it.
 */
function zoneName(timeZone) {
  try {
    const part = new Intl.DateTimeFormat(undefined, { timeZone, timeZoneName: 'long' })
      .formatToParts(new Date())
      .find((p) => p.type === 'timeZoneName')
    if (part?.value) return part.value
  } catch {
    // An unrecognised zone — fall through to the identifier.
  }
  return String(timeZone).replace(/_/g, ' ')
}

/**
 * The therapist's conversation with ONE client — master spec §8.2, §14.
 *
 * MOUNTED WITH `key={bookingId}` BY THE WORKSPACE, and that is the first of the
 * layers that keep one client's words out of another's thread: switching
 * clients throws this whole instance away — state, listeners, timers — rather
 * than trying to tidy it. `useChat` then holds every event and every late
 * response to the booking on screen as well, so the key is a belt with braces.
 *
 * Pinned between the sticky identity strip above and the composer below: the
 * thread scrolls, the page does not, so the reply box is always reachable and
 * the therapist never loses sight of whose record this is.
 */
export default function TherapistChat({ bookingId, clientName }) {
  const { setReadingBooking } = useUnread()
  const drafts = useDrafts()
  const online = useOnline()

  const {
    messages,
    participants,
    awaitingOpeningMessage,
    hasMore,
    loadingOlder,
    status,
    theyAreTyping,
    lastIncoming,
    send,
    retry,
    loadOlder,
    markRead,
    notifyTyping,
    stopTyping,
  } = useChat({ bookingId, myRole: MY_ROLE })

  /**
   * TIMES IN THE THERAPIST'S PROFILE ZONE — §15, and the brief says it in
   * capitals. It arrives with the conversation itself, so there is no second
   * request for it. The browser's zone is only a fallback for the moment
   * before that answer lands.
   */
  const browserZone = useMemo(() => detectViewerZone(), [])
  const timeZone = participants?.therapist?.timezone || browserZone
  const showZone = Boolean(participants?.therapist?.timezone) && timeZone !== browserZone

  /**
   * §7.1's opening message, found on screen rather than asked for. Null until
   * the WHOLE history is held — marking the wrong message as somebody's
   * opening would be worse than marking none.
   */
  const openingId = useMemo(
    () => openingMessageId(messages, { hasMore, awaitingOpeningMessage }),
    [messages, hasMore, awaitingOpeningMessage],
  )

  /**
   * "Reading this conversation" — set when the therapist reaches the bottom of
   * a visible thread, and RELEASED WHEN THEY LEAVE. Without the release, the
   * provider would go on suppressing this client's badge after the therapist
   * had moved to someone else — the badge would stay silent for a client
   * nobody is looking at.
   */
  useEffect(() => () => setReadingBooking(null), [setReadingBooking])

  const handleReachBottom = useCallback(() => {
    if (typeof document !== 'undefined' && document.hidden) return
    setReadingBooking(bookingId)
    markRead()
  }, [bookingId, markRead, setReadingBooking])

  /** Retry, then put the cursor back where the reply was being written. */
  const handleRetry = useCallback(
    async (clientMessageId) => {
      await retry(clientMessageId)
      document.getElementById('chat-composer')?.focus()
    },
    [retry],
  )

  // IN MEMORY ONLY, keyed by this booking — see lib/chat/draftStore.js.
  const initialDraft = drafts?.get(bookingId) ?? ''
  const handleDraftChange = useCallback((text) => drafts?.set(bookingId, text), [drafts, bookingId])

  if (status === 'loading') return <ChatSkeleton />

  if (status === 'error') {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="max-w-measure font-body text-ui text-ink">{THERAPIST_CHAT.loadError}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex min-h-11 items-center rounded-xl border border-ink/50 px-5 font-body text-ui font-medium text-ink transition-colors duration-200 ease-out hover:bg-ink/5"
        >
          {THERAPIST_CHAT.retry}
        </button>
      </div>
    )
  }

  const awaitingPanel = <AwaitingOpening name={clientName} />

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-mist">
      <h2 className="sr-only">
        {THERAPIST_CHAT.heading} — {clientName}
      </h2>

      {/* The one thing in this tree that speaks. It only ever hears THIS
          booking — useChat filters before it is fed. */}
      <MessageAnnouncer incoming={lastIncoming} senderName={clientName} timeZone={timeZone} />

      {/* The client has not written, but the therapist has: the thread shows
          what they wrote, and this says whose turn it really is. */}
      {awaitingOpeningMessage && messages.length > 0 && (
        <div className="shrink-0 border-b border-ink/12 bg-paper px-4 py-3 sm:px-6 lg:px-10">
          <p className="mx-auto flex max-w-4xl items-start gap-2.5 font-body text-caption text-ink/70">
            <OpenQuoteIcon size={16} className="mt-0.5 shrink-0 text-sage-deep" />
            <span>
              <span className="font-medium text-ink">
                {THERAPIST_CHAT.awaiting.title(clientName)}.
              </span>{' '}
              {THERAPIST_CHAT.awaiting.writeFirst}
            </span>
          </p>
        </div>
      )}

      {showZone && (
        <div className="shrink-0 border-b border-ink/8 bg-paper/60 px-4 py-2 text-center">
          <p className="font-body text-caption text-ink/70">
            {THERAPIST_CHAT.zoneNote(zoneName(timeZone))}
          </p>
        </div>
      )}

      <MessageThread
        messages={messages}
        otherName={clientName}
        timeZone={timeZone}
        hasMore={hasMore}
        loadingOlder={loadingOlder}
        onLoadOlder={loadOlder}
        onRetry={handleRetry}
        onReachBottom={handleReachBottom}
        theyAreTyping={theyAreTyping}
        density="compact"
        openingId={openingId}
        openingLabel={THERAPIST_CHAT.openingLabel}
        startLabel={THERAPIST_CHAT.startLabel(clientName)}
        emptyState={awaitingPanel}
      />

      <Composer
        onSend={send}
        onTyping={notifyTyping}
        onStopTyping={stopTyping}
        online={online}
        placeholder={THERAPIST_CHAT.placeholder}
        wide
        initialValue={initialDraft}
        onDraftChange={handleDraftChange}
      />
    </section>
  )
}

/**
 * Nobody has written yet — §7.1, and 7.5 parked this for 8.3.
 *
 * It says what will arrive and that the therapist may write first, and it
 * stops there. No prompt to "reach out", no suggestion that anything is late:
 * a newly matched client who has not written is not a problem to be solved.
 */
function AwaitingOpening({ name }) {
  return (
    <div className="relative flex h-full items-center justify-center px-6 py-10 text-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 size-72 -translate-x-1/2 rounded-full bg-sage/10 blur-[130px]"
      />

      <div className="relative max-w-md">
        <span
          aria-hidden="true"
          className="inline-flex size-14 items-center justify-center rounded-full bg-sage/15 text-sage-deep"
        >
          <OpenQuoteIcon size={26} />
        </span>

        <h3 className="mt-5 font-body text-subsection font-medium text-ink">
          {THERAPIST_CHAT.awaiting.title(name)}
        </h3>
        <p className="mt-2.5 font-body text-ui leading-relaxed text-ink/70">
          {THERAPIST_CHAT.awaiting.body}
        </p>
        <p className="mt-4 border-t border-ink/12 pt-4 font-body text-caption text-ink/70">
          {THERAPIST_CHAT.awaiting.writeFirst}
        </p>
      </div>
    </div>
  )
}

/**
 * The shape the conversation is about to take — alternating runs rather than a
 * spinner in an empty pane. `motion-safe:` so it holds still for anyone who
 * asked for less motion.
 */
function ChatSkeleton() {
  const rows = [
    ['start', 'w-2/3'],
    ['start', 'w-1/2'],
    ['end', 'w-3/5'],
    ['start', 'w-2/5'],
    ['end', 'w-1/2'],
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-mist">
      <div aria-hidden="true" className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-end gap-2 px-4 py-4">
        {rows.map(([side, width], index) => (
          <div
            key={index}
            className={`h-10 ${width} rounded-2xl motion-safe:animate-pulse ${
              side === 'end' ? 'self-end bg-ink/15' : 'self-start bg-paper'
            }`}
          />
        ))}
      </div>
      <div aria-hidden="true" className="h-17 shrink-0 border-t border-ink/12 bg-paper" />
      <p className="sr-only" role="status">
        Loading this conversation
      </p>
    </div>
  )
}
