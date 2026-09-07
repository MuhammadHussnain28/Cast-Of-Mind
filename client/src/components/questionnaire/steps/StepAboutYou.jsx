import { Input } from '../../ui'
import ChoiceChips from '../ChoiceChips'
import FieldError from '../FieldError'
import { screens } from '../../../data/questionnaireContent'
import { CLIENT_GENDERS } from '../../../data/questionnaireSteps'
import { MAX_AGE, MIN_AGE } from '../../../lib/validation/questionnaire'

/** Step 2 — name, age and gender. One tight group: who you are. */
export default function StepAboutYou({ answers, onChange, errors }) {
  const copy = screens.about

  return (
    <div className="space-y-8">
      <div className="grid gap-5 sm:grid-cols-[1fr_140px]">
        <Input
          label={copy.nameLabel}
          required
          placeholder={copy.namePlaceholder}
          autoComplete="given-name"
          value={answers.name}
          onChange={(event) => onChange({ name: event.target.value })}
          error={errors.name}
        />
        <Input
          label={copy.ageLabel}
          type="number"
          required
          inputMode="numeric"
          min={MIN_AGE}
          max={MAX_AGE}
          autoComplete="off"
          value={answers.age}
          onChange={(event) => onChange({ age: event.target.value })}
          error={errors.age}
        />
      </div>

      <fieldset>
        <legend
          id="gender-label"
          className="font-body text-ui font-medium text-ink"
        >
          {copy.genderLabel}
        </legend>
        <p className="mt-1 max-w-measure font-body text-caption text-ink/70">
          {copy.genderHelper}
        </p>

        <div className="mt-4">
          <ChoiceChips
            name="gender"
            options={CLIENT_GENDERS}
            value={answers.gender}
            onChange={(value) => onChange({ gender: value })}
            error={errors.gender}
          />
        </div>

        <FieldError id="gender-error" message={errors.gender} />
      </fieldset>
    </div>
  )
}
