import { cx } from '../../lib/cx'
import { Check } from './QuestionnaireIcons'
import { partners as partnerCopy } from '../../data/questionnaireContent'

/**
 * Two seats and a brace: the pair being collected into one account.
 *
 * This is the one-account rule DRAWN rather than stated. On the first screen you
 * see an empty second seat waiting, so it is obvious another person is coming;
 * on the second you see the first already filled, which both confirms nothing
 * was lost and stops the common mistake of entering the same person twice.
 *
 * Same slot language as the therapist form's specialty picker (chunk 3.4), so a
 * "these positions get filled" pattern means the same thing in both places.
 *
 * `aria-hidden`: the fields and the heading already carry all of this, and a
 * screen reader does not need the diagram read out as well.
 */
export default function PartnerSlots({ current, partner1, partner2 }) {
  const seats = [
    { key: 'partner1', label: partnerCopy.firstLabel, data: partner1 },
    { key: 'partner2', label: partnerCopy.secondLabel, data: partner2 },
  ]

  return (
    <div aria-hidden="true" className="mb-8">
      <div className="grid grid-cols-2 gap-3">
        {seats.map((seat) => {
          const isCurrent = seat.key === current
          const filled = Boolean(seat.data?.name)

          return (
            <div
              key={seat.key}
              className={cx(
                'rounded-xl px-4 py-3 transition-colors duration-200',
                isCurrent && 'border border-ink bg-paper',
                // Full sage-deep, not an alpha: sage-deep/40 measured 1.76:1
                // against paper. It also matches the selected choice card.
                !isCurrent && filled && 'border border-sage-deep bg-sage/12',
                !isCurrent && !filled && 'border border-dashed border-ink/40 bg-paper',
              )}
            >
              <p className="font-body text-caption text-ink/60">{seat.label}</p>

              <p
                className={cx(
                  'mt-0.5 flex items-center gap-1.5 font-body text-ui',
                  filled ? 'text-ink' : 'text-ink/60',
                )}
              >
                {!isCurrent && filled && (
                  <Check className="h-4 w-4 shrink-0 text-sage-deep" />
                )}
                {filled
                  ? [seat.data.name, seat.data.age].filter(Boolean).join(' · ')
                  : isCurrent
                    ? partnerCopy.slotFillingNow
                    : partnerCopy.slotWaiting}
              </p>
            </div>
          )
        })}
      </div>

      {/* The brace: a rule spanning both seats with the rule they belong to. */}
      <div className="mt-3 flex items-center gap-3">
        <span className="h-px flex-1 bg-sage/40" />
        <span className="font-body text-caption text-sage-deep">{partnerCopy.oneAccount}</span>
        <span className="h-px flex-1 bg-sage/40" />
      </div>
    </div>
  )
}
