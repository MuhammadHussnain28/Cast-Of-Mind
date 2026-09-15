import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cx } from '../../../../lib/cx'
import { groupMessages } from '../../../../lib/chat/groupMessages'
import { chat } from '../../../../data/chatContent'
import DaySeparator from './DaySeparator'
import MessageCluster from './MessageCluster'
import SystemNotice from './SystemNotice'
import TypingDots from './TypingDots'
import ChatEmptyState from './ChatEmptyState'
import { ArrowDownIcon } from './ChatIcons'

// How close to the bottom still counts as "reading the newest".
const AT_BOTTOM_PX = 80
// How close to the top triggers loading older history.
const NEAR_TOP_PX = 120

/**
 * The conversation, and the scroll behaviour that makes or breaks a chat.
 *
 * Four specific things, each a well-known failure:
 *
 *  1. FIRST PAINT JUMPS TO THE BOTTOM WITHOUT ANIMATING. A smooth scroll on
 *     load makes the whole history flick past, which is disorienting.
 *  2. A NEW MESSAGE NEVER YANKS SOMEONE DOWN while they are reading history.
 *     It increments the jump-to-latest count instead.
 *  3. LOADING OLDER MESSAGES PRESERVES POSITION. Prepending content moves
 *     everything down by the height added, so the scroll offset is corrected by
 *     the scrollHeight delta in a layout effect — before the browser paints,
 *     otherwise the reader visibly leaps mid-sentence.
 *  4. JUMP TO LATEST carries the count of what arrived, so the control says
 *     what it will do rather than only that it exists.
 */
export default function MessageThread({
  messages,
  therapistName,
  timeZone,
  hasMore,
  loadingOlder,
  onLoadOlder,
  onRetry,
  onReachBottom,
  theyAreTyping,
}) {
  const scrollerRef = useRef(null)
  const bottomRef = useRef(null)
  const reduce = useReducedMotion()

  const [atBottom, setAtBottom] = useState(true)
  const [missed, setMissed] = useState(0)

  const firstPaint = useRef(true)
  const pendingAnchor = useRef(null)
  const previousCount = useRef(messages.length)

  /**
   * The unread-while-scrolled-up counter, adjusted DURING RENDER.
   *
   * React's documented pattern for reacting to changed input, and the same one
   * the admin DataTable uses for `resetKey` (4.2). Counting inside the layout
   * effect instead would be a synchronous setState in an effect — the objection
   * fixed at the root in 0.6, 4.2 and 5.1 rather than silenced.
   *
   * `atBottom` starts true, so the first page never counts as missed.
   */
  const [countedUpTo, setCountedUpTo] = useState(messages.length)
  if (messages.length !== countedUpTo) {
    const grew = messages.length > countedUpTo
    setCountedUpTo(messages.length)
    if (grew && !atBottom) setMissed((n) => n + (messages.length - countedUpTo))
  }

  const rows = useMemo(() => groupMessages(messages, timeZone), [messages, timeZone])

  const scrollToBottom = useCallback((behavior = 'auto') => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior })
  }, [])

  // (1) and (2). A layout effect so nothing is painted in the wrong place.
  useLayoutEffect(() => {
    const el = scrollerRef.current
    if (!el) return

    // (3) Older history was prepended — hold the reader exactly where they were.
    if (pendingAnchor.current != null) {
      el.scrollTop += el.scrollHeight - pendingAnchor.current
      pendingAnchor.current = null
      previousCount.current = messages.length
      return
    }

    const grew = messages.length > previousCount.current
    previousCount.current = messages.length

    if (firstPaint.current && messages.length > 0) {
      firstPaint.current = false
      scrollToBottom('auto')
      // Landing at the bottom means they have seen what is there. Folded in
      // here rather than a separate effect so it cannot fire before the scroll.
      onReachBottom?.()
      return
    }

    // Scrolling only. The missed count is adjusted during render, above.
    if (grew && atBottom) scrollToBottom(reduce ? 'auto' : 'smooth')
  }, [messages, atBottom, reduce, scrollToBottom, onReachBottom])

  const handleScroll = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    const nowAtBottom = distanceFromBottom <= AT_BOTTOM_PX

    setAtBottom(nowAtBottom)
    if (nowAtBottom) {
      setMissed(0)
      onReachBottom?.()
    }

    if (el.scrollTop <= NEAR_TOP_PX && hasMore && !loadingOlder) {
      // Remembered BEFORE the new rows arrive, so the correction above has a
      // reference height to compare against.
      pendingAnchor.current = el.scrollHeight
      onLoadOlder?.()
    }
  }, [hasMore, loadingOlder, onLoadOlder, onReachBottom])

  if (messages.length === 0) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ChatEmptyState therapistName={therapistName} />
      </div>
    )
  }

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto overscroll-contain px-4 py-4 sm:px-5"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
          {/* The start of the relationship, stated once. */}
          {!hasMore && (
            <p className="py-2 text-center font-body text-caption text-ink/70">
              {chat.threadStart}
            </p>
          )}

          {loadingOlder && (
            <p className="py-2 text-center font-body text-caption text-ink/70" role="status">
              {chat.loadingOlder}
            </p>
          )}

          {rows.map((row) => {
            if (row.kind === 'day') return <DaySeparator key={row.key} label={row.label} />
            if (row.kind === 'system')
              return <SystemNotice key={row.key} message={row.message} timeZone={timeZone} />
            return (
              <MessageCluster
                key={row.key}
                cluster={row}
                timeZone={timeZone}
                onRetry={onRetry}
              />
            )
          })}

          {theyAreTyping && <TypingDots name={therapistName} />}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* (4) Centring lives on the wrapper so the button's own hover lift
          cannot fight a translate that is holding it in place. */}
      {!atBottom && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
          <motion.button
            type="button"
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={() => {
              scrollToBottom(reduce ? 'auto' : 'smooth')
              setMissed(0)
            }}
            className={cx(
              'pointer-events-auto flex min-h-11 items-center gap-2',
              'rounded-full bg-ink px-4 text-paper',
              'shadow-[0_10px_28px_-12px_rgba(13,9,22,0.55)]',
            )}
            data-surface="dark"
          >
            <ArrowDownIcon />
            <span className="font-body text-caption">
              {missed > 0 ? `${missed} new` : chat.jumpToLatest}
            </span>
          </motion.button>
        </div>
      )}
    </div>
  )
}
