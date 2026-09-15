import { Heading, Text } from '../../ui'

/**
 * The shared parts of a client portal screen.
 *
 * Consistency is the virtue here rather than variety: §24.8 puts the portals in
 * Operate territory, where the same vocabulary screen to screen is what lets
 * someone stop reading the furniture and get on with the task. The screens
 * differ in the SHAPE of their content — a sequence, a panel, a list — not in
 * how their heading and lead are set.
 */

export function ScreenHeader({ title, lead }) {
  return (
    <header>
      {/* No eyebrow above this heading, ever. The rail and the tab bar already
          name the section; a label here would be a second copy of it. */}
      <Heading level={1} size="subsection">
        {title}
      </Heading>
      {lead && (
        <Text tone="muted" className="mt-3 max-w-measure">
          {lead}
        </Text>
      )}
    </header>
  )
}

/**
 * Facts about how something works, threaded on one hairline.
 *
 * Not four cards — same-size cards of mark plus text as the page structure is
 * the category default, and it would turn three different facts into three
 * identical rectangles. The rail makes them read as one connected explanation.
 */
export function TruthList({ items }) {
  return (
    <ul className="relative mt-7 space-y-5 border-l border-sage/40 pl-6">
      {items.map((item) => (
        <li key={item} className="relative">
          <span
            aria-hidden="true"
            className="absolute -left-[1.6875rem] top-[0.5625rem] size-2 rounded-full bg-sage-deep ring-4 ring-mist"
          />
          <Text size="ui" tone="muted" className="max-w-measure">
            {item}
          </Text>
        </li>
      ))}
    </ul>
  )
}

/**
 * Said plainly on every screen this chunk leaves unbuilt.
 *
 * A screen that describes a feature warmly and does nothing would otherwise
 * read as broken software, and someone paying €200 a month deserves to be told
 * which it is. NO TIMELINE — none has been agreed, and a missed date reads
 * worse than saying nothing, the same call made on the therapist application's
 * confirmation screen (3.5).
 */
export function BuildNote({ children }) {
  return (
    <p className="mt-8 border-t border-ink/12 pt-4 font-body text-caption text-ink/70">
      {children}
    </p>
  )
}
