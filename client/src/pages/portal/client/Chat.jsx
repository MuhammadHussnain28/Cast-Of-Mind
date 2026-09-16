import { useCallback, useEffect, useMemo, useState } from 'react'
import { useClientPortal } from '../../../lib/clientPortalContext'
import { useChat } from '../../../lib/chat/useChat'
import { useUnread } from '../../../lib/chat/unreadContext'
import { useOnline } from '../../../lib/useOnline'
import { detectViewerZone } from '../../../lib/workingHours'
import { chat, opening as openingCopy } from '../../../data/chatContent'
import { Button, Spinner, Text } from '../../../components/ui'
import ChatHeader from '../../../components/portal/client/chat/ChatHeader'
import MessageThread from '../../../components/portal/client/chat/MessageThread'
import MessageAnnouncer from '../../../components/portal/client/chat/MessageAnnouncer'
import Composer from '../../../components/portal/client/chat/Composer'
import OpeningMessage from '../../../components/portal/client/chat/OpeningMessage'

/**
 * The client's conversation with their therapist — master spec §7.1.
 *
 * Three fixed regions in a column: the header carrying the therapist and their
 * hours, the thread that scrolls, and the composer pinned at the foot. The page
 * itself never scrolls, so the composer is always reachable and the working
 * hours never disappear when someone scrolls back through history.
 *
 * THE SOCKET IS NOT REQUIRED. Everything here works over REST; the connection
 * only makes delivery instant (§14).
 */
export default function Chat() {
  const { booking, therapist, user } = useClientPortal()
  const timeZone = useMemo(() => detectViewerZone(), [])

  const { setReadingBooking } = useUnread()
  const online = useOnline()

  const {
    messages,
    awaitingOpeningMessage,
    status,
    theyAreTyping,
    lastIncoming,
    hasMore,
    loadingOlder,
    send,
    sendOpening,
    retry,
    loadOlder,
    markRead,
    notifyTyping,
    stopTyping,
  } = useChat({ bookingId: booking?.id, myRole: user.role })

  const therapistName = therapist
    ? [therapist.title, therapist.firstName, therapist.lastName].filter(Boolean).join(' ')
    : null
  // The greeting inside the thread uses the first name; the header uses the
  // full one. Being addressed by a full title in the middle of a conversation
  // reads as a letter rather than a message.
  const shortName = therapist?.firstName ?? null
  const [openingError, setOpeningError] = useState(null)

  /**
   * "Reading this conversation" — clears the nav badge and suppresses further
   * increments for it, so the badge never flashes on and off in front of
   * somebody who is watching the message land.
   *
   * Set when the reader reaches the bottom of the thread, released when they
   * leave the screen. Deliberately NOT set on mount: being on the chat tab is
   * not the same as having read what is on it.
   */
  useEffect(() => () => setReadingBooking(null), [setReadingBooking])

  const handleReachBottom = useCallback(() => {
    if (typeof document !== 'undefined' && document.hidden) return
    setReadingBooking(booking?.id)
    markRead()
  }, [booking?.id, markRead, setReadingBooking])

  /**
   * Retry, then put the cursor back in the composer.
   *
   * On success the Retry button unmounts with the failure row, and focus would
   * otherwise fall to the document body — a keyboard user would be dropped at
   * the top of the page having just fixed something. Addressed by id because
   * the composer's own label already owns it and it is stable.
   */
  const handleRetry = useCallback(
    async (clientMessageId) => {
      await retry(clientMessageId)
      document.getElementById('chat-composer')?.focus()
    },
    [retry],
  )

  if (status === 'loading') {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <Spinner size="md" />
        <span className="sr-only">Loading your conversation</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <Text tone="error" className="max-w-measure">
          {chat.loadError}
        </Text>
        <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
          {chat.retryLoad}
        </Button>
      </div>
    )
  }

  /**
   * §7.1's mandatory first message. It REPLACES the thread rather than sitting
   * over it in a modal — a modal would frame this as an interruption, and it is
   * the opposite: it is the beginning of the conversation.
   *
   * There is no skip. The server refuses a short opening independently, so a
   * client who got past this screen by editing their own JavaScript would still
   * be refused (§7.1, and the chunk's own "Do NOT").
   */
  if (awaitingOpeningMessage) {
    return (
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-mist">
        <h1 className="sr-only">
          {openingCopy.title}
          {therapistName ? ` — ${therapistName}` : ''}
        </h1>
        <OpeningMessage
          therapist={therapist}
          error={openingError}
          onSend={async (text) => {
            setOpeningError(null)
            try {
              await sendOpening(text)
            } catch (err) {
              // The server's own message when it has one — its refusal for a
              // too-short opening explains what this message is for far better
              // than a generic failure would.
              setOpeningError(err?.message || openingCopy.failed)
            }
          }}
        />
      </section>
    )
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-mist">
      <h1 className="sr-only">
        {chat.heading}
        {therapistName ? ` with ${therapistName}` : ''}
      </h1>

      <ChatHeader
        therapist={therapist ? { ...therapist, name: therapistName } : null}
      />

      {/* Off screen, and the only thing in this tree that speaks. */}
      <MessageAnnouncer incoming={lastIncoming} senderName={shortName} />

      <MessageThread
        messages={messages}
        therapistName={shortName}
        timeZone={timeZone}
        hasMore={hasMore}
        loadingOlder={loadingOlder}
        onLoadOlder={loadOlder}
        onRetry={handleRetry}
        onReachBottom={handleReachBottom}
        theyAreTyping={theyAreTyping}
      />

      <Composer
        onSend={send}
        onTyping={notifyTyping}
        onStopTyping={stopTyping}
        online={online}
      />
    </section>
  )
}
