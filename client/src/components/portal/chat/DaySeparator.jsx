/**
 * A hairline with the date inset — not a floating pill, and not a heading.
 *
 * The rule is what makes it read as a boundary in time rather than as another
 * message. `aria-hidden` on the lines; the label itself is the content.
 */
export default function DaySeparator({ label }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span aria-hidden="true" className="h-px flex-1 bg-ink/12" />
      <span className="font-body text-caption text-ink/70">{label}</span>
      <span aria-hidden="true" className="h-px flex-1 bg-ink/12" />
    </div>
  )
}
