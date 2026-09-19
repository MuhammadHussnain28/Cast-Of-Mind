import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cx } from '../../../lib/cx'
import { groupMessages } from '../../../lib/chat/groupMessages'
import { chat } from '../../../data/chatContent'
import DaySeparator from './DaySeparator'
import MessageCluster from './MessageCluster'
import SystemNotice from './SystemNotice'
import TypingDots from './TypingDots'
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
 *
 * SHARED BY BOTH PORTALS (8.3). Everything that differs between a client's
 * conversation and a therapist's is a prop: who the other person is, what an
 * empty thread says, how dense the rows are, and whether the client's opening
 * message is labelled. Nothing in here assumes which side it is on.
 */
export default function MessageThread({
  messages,
  otherName,
  timeZone,
  hasMore,
  loadingOlder,
  onLoadOlder,
  onRetry,
  onReachBottom,
  theyAreTyping,
  emptyState = null,
  density = 'comfortable',
  openingId = null,
  openingLabel = null,
  startLabel = chat.threadStart,
}) {
  const compact = density === 'compact'
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

  const rows = useMemo(
    () => groupMessages(messages, timeZone, undefined, undefined, { openingId }),
    [messages, timeZone, openingId],
  )

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

  /**
   * The same thing, reachable without a mouse wheel.
   *
   * Loading older history was scroll-only until now, which meant a keyboard or
   * screen-reader user simply could not read back through their conversation.
   * The anchor is set here too, so position is preserved identically.
   */
  const loadOlderFromButton = useCallback(() => {
    const el = scrollerRef.current
    if (el) pendingAnchor.current = el.scrollHeight
    onLoadOlder?.()
  }, [onLoadOlder])

  /**
   * Coming back to the tab counts as reading it, if they are at the bottom.
   *
   * `markRead` refuses outright while the tab is hidden, so the first paint's
   * call is correctly ignored when the portal is opened in a background tab.
   * This is what makes it land once they actually look.
   */
  useEffect(() => {
    const onVisibility = () => {
      if (!document.hidden && atBottom) onReachBottom?.()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [atBottom, onReachBottom])

  /**
   * A software keyboard opening shortens the thread without scrolling it, so
   * whatever was at the bottom slides out of sight behind the keyboard. If they
   * were reading the newest message, keep them on it.
   */
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return undefined

    const repin = () => {
      if (atBottom) scrollToBottom('auto')
    }
    viewport.addEventListener('resize', repin)
    return () => viewport.removeEventListener('resize', repin)
  }, [atBottom, scrollToBottom])

  if (messages.length === 0) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto">
        {emptyState}
      </div>
    )
  }

  return (
    <div className="relative min-h-0 flex-1">
      {/*
        `role="log"` makes this a navigable record rather than an anonymous
        scrolling div, and `tabIndex` is what lets a keyboard user scroll it at
        all — without it the arrow keys have nothing focused to act on.

        NO `aria-live` HERE, on purpose: it would read the whole first page on
        load and every page of history on the way back. Arrivals are announced
        by the dedicated region in Chat.jsx instead.
      */}
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        role="log"
        tabIndex={0}
        aria-label={chat.threadLabel.replace('{name}', otherName || 'this person')}
        className={cx(
          'h-full overflow-y-auto overscroll-contain',
          compact ? 'px-3 py-3 sm:px-4' : 'px-4 py-4 sm:px-5',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink',
        )}
      >
        <div
          className={cx(
            'mx-auto flex w-full flex-col',
            compact ? 'max-w-4xl gap-2' : 'max-w-3xl gap-3',
          )}
        >
          {/* The start of the relationship, stated once. */}
          {!hasMore && (
            <p className="py-2 text-center font-body text-caption text-ink/70">
              {startLabel}
            </p>
          )}

          {hasMore && !loadingOlder && (
            <div className="flex justify-center py-1">
              <button
                type="button"
                onClick={loadOlderFromButton}
                className={cx(
                  // `ink/50`, not `ink/25`. The button is paper on the thread's
                  // mist ground — 1.11:1 between the two surfaces — so the
                  // border is the entire boundary, and WCAG 1.4.11 wants 3:1
                  // for that. Measured: ink/25 on mist is 1.55:1 and FAILS;
                  // ink/50 is 3.08:1 and passes. Same token chunk 0.4 settled
                  // on for input borders, for the same reason.
                  'min-h-11 rounded-full border border-ink/50 bg-paper px-4',
                  'font-body text-caption text-ink',
                  'transition-colors duration-200 ease-out hover:border-ink',
                )}
              >
                {chat.loadOlder}
              </button>
            </div>
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
                density={density}
                openingLabel={openingLabel}
              />
            )
          })}

          {theyAreTyping && <TypingDots name={otherName} />}

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
