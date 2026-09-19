import { chat } from '../../../data/chatContent'

/**
 * What a screen reader hears when a message arrives — master spec §14.
 *
 * WHY NOT `aria-live` ON THE THREAD ITSELF. Putting a live region on the list
 * would announce the entire first page on load, announce every page of history
 * someone scrolls back through, and read the reader's own sent messages back to
 * them. A dedicated region fed only by arrivals says exactly one thing, exactly
 * when it happens.
 *
 * THE 400-CHARACTER LINE — developer's decision, 2026-09-16. A live
 * announcement cannot be paused, replayed or navigated: a long one interrupted
 * by any other output is simply gone. Under the line the whole message is read
 * out, which is what somebody wants. Over it, the announcement says a message
 * arrived and the text is read from the thread, which carries `role="log"` and
 * is navigable precisely so it can be.
 *
 * `polite`, never `assertive`: a message is not an emergency, and cutting
 * somebody off mid-sentence to read one at them would be the wrong register on
 * this platform as much as anywhere else.
 *
 * TWO REGIONS, ALTERNATING — and this is the part that is not decoration. A
 * live region only speaks when its CONTENT CHANGES, so the same message twice
 * in a row would be announced once and the second would vanish silently. The
 * usual fix is to blank the region and re-fill it a tick later, which means
 * setting state from an effect — the React Compiler objection this project
 * fixes at the root rather than silences (0.6, 4.2, 5.1, 7.4). Alternating
 * between two regions gets the same guarantee by derivation alone: each arrival
 * fills one and empties the other, so BOTH change every time and no effect is
 * needed at all.
 */
const FULL_TEXT_LIMIT = 400

function announcementFor(incoming, senderName) {
  if (!incoming?.text) return ''

  const who = senderName || 'Your therapist'

  return incoming.text.length <= FULL_TEXT_LIMIT
    ? chat.announce.replace('{name}', who).replace('{text}', incoming.text)
    : chat.announceLong.replace('{name}', who)
}

export default function MessageAnnouncer({ incoming, senderName }) {
  const text = announcementFor(incoming, senderName)
  // `seq` counts arrivals, so two identical messages land in different regions.
  const slot = (incoming?.seq ?? 0) % 2

  return (
    <>
      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {slot === 0 ? text : ''}
      </p>
      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {slot === 1 ? text : ''}
      </p>
    </>
  )
}
