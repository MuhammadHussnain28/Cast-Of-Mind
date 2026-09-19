import { entryDateLabel, editedLabel } from '../../../lib/journalDates'
import { MoodStroke } from './JournalIcons'
import { cx } from '../../../lib/cx'

/**
 * Entries threaded on one dated spine, not stacked in identical cards.
 *
 * A journal IS a run of days, so the run is drawn: one sage rule down the left
 * with a node per entry. Read by both portals, so the presentation of somebody's
 * writing can never differ between the person who wrote it and the person
 * reading it.
 */
export function EntrySpine({ children, className }) {
  return (
    <ol className={cx('relative space-y-4 border-l border-sage/40 pl-6 sm:pl-7', className)}>
      {children}
    </ol>
  )
}

/**
 * One entry. `actions` is the only difference between the two sides — the
 * client gets Edit and Delete, the therapist gets nothing to press.
 */
/**
 * One entry. Renders NO `<li>` of its own — the list item is the caller's
 * motion wrapper, so an animated `<div>` can never sit between `<ol>` and its
 * children. The wrapper must carry `relative`, because the node is placed
 * against it.
 */
export function Entry({ entry, ground = 'mist', actions, children }) {
  const onPaper = ground === 'paper'

  return (
    <>
      {/* The node sits ON the rule, so the card hangs off the thread. Its ring
          is the GROUND behind the spine, which differs between the two portals. */}
      <span
        aria-hidden="true"
        className={cx(
          'absolute top-5 size-2.5 rounded-full bg-sage-deep',
          '-left-7.25 ring-4 sm:-left-8.25',
          onPaper ? 'ring-paper' : 'ring-mist',
        )}
      />

      <article
        className={cx(
          'relative overflow-hidden rounded-2xl px-4 py-4 sm:px-5',
          onPaper
            ? 'bg-mist ring-1 ring-ink/12'
            : 'bg-paper shadow-[0_18px_50px_-30px_rgba(25,18,43,0.4)]',
        )}
      >
        <header className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h3 className="font-body text-caption font-medium text-ink">
            <time dateTime={entry.createdAt}>{entryDateLabel(entry.createdAt)}</time>
          </h3>

          {entry.moodTag && <MoodTag label={entry.moodTag} />}

          {entry.editedAt && (
            <span className="font-body text-caption text-ink/70">{editedLabel(entry.editedAt)}</span>
          )}
        </header>

        {/* Preserves the paragraphs somebody wrote, and breaks a pasted URL. */}
        <p className="mt-2.5 max-w-measure whitespace-pre-wrap wrap-break-word font-body text-ui leading-relaxed text-ink">
          {entry.text}
        </p>

        {actions}
        {children}
      </article>
    </>
  )
}

/** The mood's own line, with the word as its caption. */
export function MoodTag({ label }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-sage/12 py-0.5 pl-2 pr-2.5 ring-1 ring-sage/40">
      <MoodStroke label={label} width={20} className="text-sage-deep" />
      <span className="font-body text-caption text-ink/70">{label}</span>
    </span>
  )
}

export default EntrySpine
