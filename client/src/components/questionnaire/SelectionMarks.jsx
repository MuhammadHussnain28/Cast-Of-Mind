import { cx } from '../../lib/cx'

/**
 * Four marks that fill as concerns are chosen.
 *
 * DELIBERATELY UNLABELLED. The therapist form's picker labels its slots
 * "Choice 1 / 2 / 3 / Optional" because that side genuinely requires three.
 * Here the floor is one (§6), and labelled slots would tell someone with a
 * single concern that they had answered wrong.
 *
 * `aria-hidden` — the live count beside it carries the same fact in words.
 */
export default function SelectionMarks({ count, max }) {
  return (
    <div aria-hidden="true" className="flex items-center gap-1.5">
      {Array.from({ length: max }, (_, index) => (
        <span
          key={index}
          className={cx(
            'h-2 w-6 rounded-full transition-colors duration-200',
            index < count ? 'bg-sage-deep' : 'bg-ink/12',
          )}
        />
      ))}
    </div>
  )
}
