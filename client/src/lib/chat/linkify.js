/**
 * Turning URLs inside a message into links — master spec §14.
 *
 * WHY THIS IS A PURE FUNCTION RETURNING SEGMENTS, AND NOT A STRING OF HTML.
 * Message text is written by another person and is the most untrusted string in
 * the product. The obvious implementation — a regex replace producing `<a>`
 * tags and `dangerouslySetInnerHTML` — is a cross-site-scripting hole, because
 * everything NOT matched by the regex goes into the DOM as markup too. One
 * message containing a script tag would then execute in the other person's
 * session, on a platform holding their therapy history.
 *
 * So this returns data, the renderer builds real React elements from it, and
 * text is text at every step. There is no path here that produces markup.
 *
 * THE SCHEME IS AN ALLOWLIST. `http`, `https` and `mailto` are the only things
 * that ever become an href. `javascript:`, `data:`, `vbscript:` and `file:` are
 * left as plain text — the pattern does not match them, and the parse below
 * refuses them a second time even if it somehow did.
 */

// Scheme-qualified URLs, bare `www.` hosts, and email addresses. Deliberately
// narrow: anything this does not recognise stays as ordinary text, which is
// always the safe failure.
const PATTERN =
  /(https?:\/\/[^\s<>]+|www\.[^\s<>]+|[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+)/gi

const EMAIL_ONLY = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/

const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:'])

// Punctuation that ends a sentence far more often than it ends a URL.
const TRAILING = `.,;:!?'"\`’”»)]}`

const CLOSERS = { ')': '(', ']': '[', '}': '{' }

const occurrences = (text, character) => text.split(character).length - 1

/**
 * Trim the full stop off the end of "have a look at https://example.com/page."
 * without breaking a URL that genuinely ends in a bracket.
 *
 * A closing bracket is only trimmed when there is no opening one to match it,
 * so a Wikipedia-style `.../Ireland_(island)` survives intact while
 * `(see https://example.com)` does not swallow the sentence's own bracket.
 */
function trimTrailingPunctuation(raw) {
  let end = raw.length

  while (end > 0 && TRAILING.includes(raw[end - 1])) {
    const character = raw[end - 1]

    if (character in CLOSERS) {
      const slice = raw.slice(0, end)
      if (occurrences(slice, CLOSERS[character]) >= occurrences(slice, character)) break
    }

    end -= 1
  }

  return raw.slice(0, end)
}

/**
 * The href, or null if this is not something we are willing to link.
 *
 * Null is not a failure state — it means the text renders as text, which is
 * exactly what should happen to anything unrecognised.
 */
export function safeHref(raw) {
  let candidate = raw

  if (EMAIL_ONLY.test(raw)) candidate = `mailto:${raw}`
  else if (/^www\./i.test(raw)) candidate = `https://${raw}`

  try {
    const url = new URL(candidate)
    return SAFE_PROTOCOLS.has(url.protocol) ? url.href : null
  } catch {
    return null
  }
}

/**
 * Split a message into text and link segments.
 *
 * Whitespace is preserved exactly — the renderer sets `pre-wrap`, and someone
 * who laid their thoughts out over several lines should see them that way.
 *
 * @returns {Array<{ type: 'text' | 'link', text: string, href?: string }>}
 */
export function linkify(text) {
  const source = typeof text === 'string' ? text : ''
  if (!source) return []

  const segments = []
  let lastIndex = 0

  // A fresh regex each call — a module-level /g regex carries `lastIndex`
  // between calls and would silently skip matches on the second message.
  const pattern = new RegExp(PATTERN.source, 'gi')
  let match = pattern.exec(source)

  while (match !== null) {
    const raw = match[0]
    const linked = trimTrailingPunctuation(raw)
    const href = linked ? safeHref(linked) : null

    if (href) {
      if (match.index > lastIndex) {
        segments.push({ type: 'text', text: source.slice(lastIndex, match.index) })
      }
      segments.push({ type: 'link', text: linked, href })
      lastIndex = match.index + linked.length
    }

    // Anything refused simply stays inside the surrounding text run.
    match = pattern.exec(source)
  }

  if (lastIndex < source.length) {
    segments.push({ type: 'text', text: source.slice(lastIndex) })
  }

  return segments
}
