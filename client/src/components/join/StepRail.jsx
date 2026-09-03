import { motion, useReducedMotion } from 'framer-motion'
import { steps } from '../../data/joinContent'
import { Check } from './JoinIcons'
import { cx } from '../../lib/cx'

/**
 * Five nodes on a drawn line — the same visual language as the How It Works
 * connector, so the two pages read as one site.
 *
 * The line's filled portion is the progress bar; there is no separate bar.
 * `aria-hidden` on the graphic with a live text status beside it, so a screen
 * reader gets "Step 2 of 5" rather than five ambiguous circles.
 */
export default function StepRail({ current }) {
  const reduceMotion = useReducedMotion()
  const total = steps.length
  const progress = total > 1 ? (current - 1) / (total - 1) : 0
  const active = steps.find((s) => s.number === current)

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-body text-caption font-medium text-ink" role="status">
          Step {current} of {total}
          <span className="sr-only">: {active?.label}</span>
        </p>
        <p className="font-body text-caption text-ink/60">{active?.label}</p>
      </div>

      <div aria-hidden="true" className="relative mt-3">
        {/* Track */}
        <div className="absolute left-0 right-0 top-[11px] h-px bg-ink/15" />

        {/* Filled portion — scaleX so it animates on the compositor. */}
        <motion.div
          className="absolute left-0 top-[11px] h-px origin-left bg-sage"
          style={{ right: 0 }}
          initial={false}
          animate={{ scaleX: progress }}
          transition={
            reduceMotion ? { duration: 0 } : { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
          }
        />

        <ol className="relative flex items-start justify-between">
          {steps.map((step) => {
            const done = step.number < current
            const isCurrent = step.number === current

            return (
              <li key={step.number} className="flex flex-col items-center gap-2">
                <span
                  className={cx(
                    'flex h-[22px] w-[22px] items-center justify-center rounded-full border bg-paper font-body text-[11px] font-medium transition-colors duration-200',
                    done && 'border-sage bg-sage text-paper',
                    isCurrent && 'border-ink bg-ink text-paper',
                    !done && !isCurrent && 'border-ink/25 text-ink/60',
                  )}
                >
                  {done ? <Check className="h-3 w-3" /> : step.number}
                </span>
                <span
                  className={cx(
                    'hidden font-body text-[11px] sm:block',
                    isCurrent ? 'text-ink' : 'text-ink/60',
                  )}
                >
                  {step.short}
                </span>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
