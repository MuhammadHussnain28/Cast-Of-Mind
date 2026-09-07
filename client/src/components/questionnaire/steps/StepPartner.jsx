import { Input } from '../../ui'
import ChoiceChips from '../ChoiceChips'
import FieldError from '../FieldError'
import PartnerSlots from '../PartnerSlots'
import { partners as copy } from '../../../data/questionnaireContent'
import { CLIENT_GENDERS } from '../../../data/questionnaireSteps'
import { MAX_AGE, MIN_AGE } from '../../../lib/validation/questionnaire'

/**
 * One partner — name, age and gender. The same tight group and the same chips
 * as the individual path, so the two branches feel like one flow.
 *
 * ONE COMPONENT, USED TWICE. The fields are identical; only which partner it
 * writes to differs. Two near-identical files would drift the moment one of
 * them was edited.
 *
 * Errors arrive keyed by their full path (`partner1.name`), because that is what
 * the step schema produces and what the error summary would need.
 */
export default function StepPartner({ partner, answers, onPartnerChange, errors }) {
  const data = answers[partner] ?? {}
  const error = (field) => errors[`${partner}.${field}`]

  return (
    <div>
      <PartnerSlots
        current={partner}
        partner1={answers.partner1}
        partner2={answers.partner2}
      />

      <div className="space-y-8">
        <div className="grid gap-5 sm:grid-cols-[1fr_140px]">
          <Input
            label={copy.nameLabel}
            required
            placeholder={copy.namePlaceholder}
            autoComplete="off"
            value={data.name ?? ''}
            onChange={(event) => onPartnerChange(partner, { name: event.target.value })}
            error={error('name')}
          />
          <Input
            label={copy.ageLabel}
            type="number"
            required
            inputMode="numeric"
            min={MIN_AGE}
            max={MAX_AGE}
            autoComplete="off"
            value={data.age ?? ''}
            onChange={(event) => onPartnerChange(partner, { age: event.target.value })}
            error={error('age')}
          />
        </div>

        <fieldset>
          <legend id={`${partner}.gender-label`} className="font-body text-ui font-medium text-ink">
            {copy.genderLabel}
          </legend>

          <div className="mt-4">
            <ChoiceChips
              name={`${partner}.gender`}
              options={CLIENT_GENDERS}
              value={data.gender ?? ''}
              onChange={(value) => onPartnerChange(partner, { gender: value })}
              error={error('gender')}
            />
          </div>

          <FieldError id={`${partner}.gender-error`} message={error('gender')} />
        </fieldset>
      </div>
    </div>
  )
}
