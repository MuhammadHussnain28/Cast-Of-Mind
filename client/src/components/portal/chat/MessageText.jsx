import { linkify } from '../../../lib/chat/linkify'
import { chat } from '../../../data/chatContent'

/**
 * The words in a message.
 *
 * REAL ELEMENTS, NEVER `dangerouslySetInnerHTML`. `linkify` returns data and
 * this builds nodes from it, so a message containing markup renders as the
 * characters somebody typed rather than as markup. That is the whole reason
 * the two are separate.
 *
 * ALWAYS UNDERLINED, in both bubbles. A link distinguished only by colour fails
 * WCAG 1.4.1, and inside the ink bubble there is no second colour available
 * anyway — paper text on ink is already the maximum.
 *
 * Long messages are NOT collapsed behind a "show more" — developer's decision,
 * 2026-09-16. Folding away what somebody wrote about how they are doing, or
 * what their therapist wrote back, puts a control on the one thing on this
 * screen that should never need permission to be read.
 */
export default function MessageText({ text }) {
  const segments = linkify(text)

  if (segments.length === 0) return null

  return segments.map((segment, index) =>
    segment.type === 'link' ? (
      <a
        key={index}
        href={segment.href}
        target="_blank"
        // `noopener` is the one that matters: without it the opened page gets a
        // handle on this one through `window.opener` and can navigate it away
        // to anywhere it likes, from inside a signed-in portal.
        rel="noopener noreferrer"
        // THE UNDERLINE INHERITS THE TEXT COLOUR, at full strength, and that is
        // a correction rather than a preference. A link here sits in the same
        // colour as the words around it — there is no second colour available
        // inside an ink bubble — so the underline is the ONLY thing marking it
        // as a link, which is what WCAG 1.4.1 requires. Measured at `ink/40` on
        // the paper bubble it came to 2.58:1, too faint to do the one job it
        // has. At the text's own colour it is 19.67:1 in their bubble and
        // 18.06:1 in mine. Hover thickens it instead of darkening it.
        className="underline underline-offset-2 transition-[text-decoration-thickness] duration-200 hover:decoration-2"
      >
        {segment.text}
        <span className="sr-only"> {chat.opensInNewTab}</span>
      </a>
    ) : (
      // Keyed by index deliberately: segments are positional, derived fresh
      // from one immutable string, and never reordered.
      <span key={index}>{segment.text}</span>
    ),
  )
}
