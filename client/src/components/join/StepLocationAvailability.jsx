import { useMemo } from 'react'
import { Controller } from 'react-hook-form'
import { Input, Select } from '../ui'
import LanguagePicker from './LanguagePicker'
import WorkingHoursGrid from './WorkingHoursGrid'
import { countryOptions, groupedTimezones } from '../../lib/timezones'

/** Step 2 — the 8 location and availability fields. */
export default function StepLocationAvailability({ register, control, errors }) {
  // Both lists are derived, not typed out, so they cannot go stale. Built once.
  const countries = useMemo(() => countryOptions(), [])
  const timezoneGroups = useMemo(() => groupedTimezones(), [])

  const hoursErrors = errors.workingHours ?? {}

  return (
    <div className="space-y-6">
      <Input
        label="Street address"
        required
        placeholder="14 Rue des Lilas"
        autoComplete="street-address"
        helper="Kept private. Never shown to clients."
        error={errors.streetAddress?.message}
        {...register('streetAddress')}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="City"
          required
          placeholder="Lyon"
          autoComplete="address-level2"
          error={errors.city?.message}
          {...register('city')}
        />
        <Input
          label="State or province"
          required
          placeholder="Auvergne-Rhône-Alpes"
          autoComplete="address-level1"
          error={errors.stateProvince?.message}
          {...register('stateProvince')}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Zip or postal code"
          required
          placeholder="69003"
          autoComplete="postal-code"
          error={errors.zipPostal?.message}
          {...register('zipPostal')}
        />
        <Select
          label="Country"
          required
          placeholder="Select your country"
          options={countries}
          helper="For our records. It never limits who you are matched with."
          error={errors.country?.message}
          {...register('country')}
        />
      </div>

      {/* Grouped by region so a 400-entry native select stays scannable, and
          each option carries its UTC offset so the right one is confirmable. */}
      <Select
        label="Timezone"
        required
        helper="Session times are converted automatically for each client."
        error={errors.timezone?.message}
        {...register('timezone')}
      >
        <option value="" disabled>
          Select your timezone
        </option>
        {timezoneGroups.map((group) => (
          <optgroup key={group.region} label={group.region}>
            {group.zones.map((zone) => (
              <option key={zone.value} value={zone.value}>
                {zone.label}
              </option>
            ))}
          </optgroup>
        ))}
      </Select>

      <Controller
        name="languages"
        control={control}
        render={({ field }) => (
          <LanguagePicker
            value={field.value}
            onChange={field.onChange}
            error={errors.languages?.message ?? errors.languages?.root?.message}
          />
        )}
      />

      <Controller
        name="workingHours"
        control={control}
        render={({ field }) => (
          <WorkingHoursGrid
            value={field.value}
            onChange={field.onChange}
            errors={Object.fromEntries(
              Object.entries(hoursErrors)
                .filter(([key]) => key !== 'root' && key !== 'note')
                .map(([key, err]) => [key, err?.message]),
            )}
            rootError={hoursErrors.root?.message}
          />
        )}
      />
    </div>
  )
}
