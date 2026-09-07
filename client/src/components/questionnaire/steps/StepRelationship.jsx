import ChoiceChips from '../ChoiceChips'
import FieldError from '../FieldError'
import { RELATIONSHIP_STATUSES } from '../../../data/relationshipStatuses'

/**
 * Step 4 — relationship status.
 *
 * Chips rather than a dropdown even at eight options: they are all short, and
 * seeing "Prefer not to say" without opening anything is the point. The list is
 * the mirrored server constant, so a value can never be stored that the model's
 * enum would reject.
 */
export default function StepRelationship({ answers, onChange, errors }) {
  const options = RELATIONSHIP_STATUSES.map((status) => ({ value: status, label: status }))

  return (
    <>
      <span id="relationshipStatus-label" className="sr-only">
        Relationship status
      </span>

      <ChoiceChips
        name="relationshipStatus"
        options={options}
        value={answers.relationshipStatus}
        onChange={(value) => onChange({ relationshipStatus: value })}
        error={errors.relationshipStatus}
        columns
      />

      <FieldError id="relationshipStatus-error" message={errors.relationshipStatus} />
    </>
  )
}
