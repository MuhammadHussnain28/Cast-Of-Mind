import { motion, useReducedMotion } from 'framer-motion'
import { cx } from '../../lib/cx'

/**
 * How far through the questionnaire someone is (§24.7 requires a visible one).
 *
 * A bar, not the join form's node rail. That rail is five fixed labelled steps;
 * this flow is seven or eight depending on the branch, and labelling every node
 * would crowd a 360px screen with words nobody needs yet.
 *
 * THE FILL TOKEN FLIPS WITH THE GROUND, and both were measured:
 *   light shell — `sage` on an ink/12 track is 2.66:1 and FAILS the 3:1 floor
 *                 for a graphic that carries meaning; `sage-deep` is 4.28:1.
 *   dark aside  — `sage-deep` would be dark on dark; plain `sage` is 5.78:1 on
 *                 ink-deep and 4.30:1 against a paper/12 track.
 *
 * The bar is aria-hidden: the same fact is in the text above it and in the
 * flow's live region, and three announcements of one fact is worse than one.
 */
const TONES = {
  default: {
    count: 'text-ink',
    label: 'text-ink/70',
    track: 'bg-ink/12',
    fill: 'bg-sage-deep',
  },
  inverse: {
    count: 'text-paper',
    label: 'text-paper/70',
    track: 'bg-paper/12',
    fill: 'bg-sage',
  },
}

export default function QuestionnaireProgress({ current, total, label, tone = 'default' }) {
  const reduceMotion = useReducedMotion()
  const progress = total > 1 ? current / total : 1
  const styles = TONES[tone]

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <p className={cx('font-body text-caption font-medium', styles.count)}>
          Step {current} of {total}
        </p>
        <p className={cx('font-body text-caption', styles.label)}>{label}</p>
      </div>

      <div
        aria-hidden="true"
        className={cx('mt-3 h-1 w-full overflow-hidden rounded-full', styles.track)}
      >
        <motion.div
          className={cx('h-full w-full origin-left rounded-full', styles.fill)}
          initial={false}
          animate={{ scaleX: progress }}
          transition={
            reduceMotion ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
          }
        />
      </div>
    </div>
  )
}
