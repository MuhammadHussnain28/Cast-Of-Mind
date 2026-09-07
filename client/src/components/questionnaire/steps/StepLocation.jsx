import { useMemo } from 'react'
import { Input, Select } from '../../ui'
import { screens } from '../../../data/questionnaireContent'
import { countryOptions } from '../../../lib/timezones'

/**
 * Step 3 — country and city.
 *
 * A native select for country: 197 options is the one question on this flow
 * where the platform picker genuinely beats chips, and it gives type-ahead on
 * desktop and the wheel on phones for free. Same control the therapist form
 * uses, from the same derived ISO list — no second country list exists.
 */
export default function StepLocation({ answers, onChange, errors }) {
  const copy = screens.location
  const countries = useMemo(() => countryOptions(), [])

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Select
        label={copy.countryLabel}
        required
        placeholder="Select a country"
        options={countries}
        value={answers.country}
        onChange={(event) => onChange({ country: event.target.value })}
        error={errors.country}
      />
      <Input
        label={copy.cityLabel}
        required
        placeholder={copy.cityPlaceholder}
        autoComplete="address-level2"
        value={answers.city}
        onChange={(event) => onChange({ city: event.target.value })}
        error={errors.city}
      />
    </div>
  )
}
