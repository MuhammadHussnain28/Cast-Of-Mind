import ChoiceChips from '../ChoiceChips'
import FieldError from '../FieldError'
import { THERAPIST_GENDER_PREFERENCES } from '../../../data/questionnaireSteps'

/**
 * Step 6 — therapist gender preference.
 *
 * Three equal options, no icons and no ordering that implies a right answer.
 * The screen's reassurance line carries the fact that matters: it is a soft
 * sort, never a filter (§15), so choosing one hides nobody.
 */
export default function StepPreference({ answers, onChange, errors }) {
  return (
    <>
      <span id="therapistGenderPreference-label" className="sr-only">
        Therapist preference
      </span>

      <ChoiceChips
        name="therapistGenderPreference"
        options={THERAPIST_GENDER_PREFERENCES}
        value={answers.therapistGenderPreference}
        onChange={(value) => onChange({ therapistGenderPreference: value })}
        error={errors.therapistGenderPreference}
        columns
      />

      <FieldError
        id="therapistGenderPreference-error"
        message={errors.therapistGenderPreference}
      />
    </>
  )
}
