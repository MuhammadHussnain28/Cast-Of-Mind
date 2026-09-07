import ChoiceCards from '../ChoiceCards'
import FieldError from '../FieldError'
import { clientTypeOptions } from '../../../data/questionnaireContent'

/** Step 1 — the branch question (§6). */
export default function StepWhoFor({ answers, onChange, errors }) {
  return (
    <>
      {/* The screen heading is the group's label; ChoiceCards points at it. */}
      <span id="type-label" className="sr-only">
        Who is this for?
      </span>

      <ChoiceCards
        name="type"
        options={clientTypeOptions}
        value={answers.type}
        onChange={(value) => onChange({ type: value })}
        error={errors.type}
      />

      <FieldError id="type-error" message={errors.type} />
    </>
  )
}
