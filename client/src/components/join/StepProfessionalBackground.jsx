import { useWatch } from 'react-hook-form'
import { Input, Select, Textarea } from '../ui'
import CharCounter from './CharCounter'
import { Lock } from './JoinIcons'
import {
  CREDENTIAL_TYPES,
  THERAPIST_TYPE_MAX,
  MIN_YEARS_EXPERIENCE,
} from '../../lib/validation/therapistApplication'

/** Step 3 — 8 fields, 6 mandatory and 2 optional. */
export default function StepProfessionalBackground({ register, control, errors }) {
  const therapistType = useWatch({ control, name: 'therapistType' }) ?? ''

  return (
    <div className="space-y-6">
      <div>
        <Input
          label="Therapist type"
          required
          placeholder="e.g. Clinical Psychologist specialising in trauma"
          helper={`How you describe your role, in your own words. Up to ${THERAPIST_TYPE_MAX} characters.`}
          error={errors.therapistType?.message}
          {...register('therapistType')}
        />
        <CharCounter value={therapistType} max={THERAPIST_TYPE_MAX} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Select
          label="Credential type"
          required
          placeholder="Select"
          options={CREDENTIAL_TYPES.map((c) => ({ value: c, label: c }))}
          error={errors.credentialType?.message}
          {...register('credentialType')}
        />
        <Input
          label="Credential initials"
          required
          placeholder="e.g. MS, M.Phil, PhD"
          error={errors.credentialInitials?.message}
          {...register('credentialInitials')}
        />
      </div>

      <Input
        label="Years of experience"
        type="number"
        inputMode="numeric"
        required
        min={MIN_YEARS_EXPERIENCE}
        step={1}
        placeholder="e.g. 9"
        helper={`Counselling practice. We ask for at least ${MIN_YEARS_EXPERIENCE} years.`}
        error={errors.yearsExperience?.message}
        className="sm:max-w-56"
        {...register('yearsExperience')}
      />

      <Textarea
        label="Summary of education"
        required
        rows={5}
        placeholder="Your degrees, where you studied, and the years you qualified."
        helper="Enough for our team to verify your qualifications."
        error={errors.educationSummary?.message}
        {...register('educationSummary')}
      />

      <Textarea
        label="Current work situation"
        required
        rows={3}
        placeholder="e.g. Private practice, part time, alongside two days in an NHS trust."
        error={errors.currentWorkSituation?.message}
        {...register('currentWorkSituation')}
      />

      {/* Both optional, and grouped so it is obvious they are the pair you can
          skip rather than two more things to fill in. */}
      <div className="rounded-2xl border border-ink/12 bg-mist/50 p-5">
        <p className="font-body text-caption font-medium text-ink">
          Optional — leave blank if they do not apply
        </p>

        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Input
            label="License number"
            placeholder="e.g. FR-99182"
            error={errors.licenseNumber?.message}
            {...register('licenseNumber')}
          />
          <Input
            label="Taxpayer identification number"
            placeholder="Your tax reference"
            error={errors.taxpayerIdNumber?.message}
            {...register('taxpayerIdNumber')}
          />
        </div>

        {/* The spec flags this field as sensitive. Asking a stranger for a tax
            number with no explanation is how a good applicant closes the tab. */}
        <p className="mt-4 flex items-start gap-2.5 font-body text-caption leading-relaxed text-ink/70">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sage-deep" />
          <span>
            Your tax number is used only for paying you, and is never shown to clients or used in
            matching. Leave it blank now and give it later if you would rather.
          </span>
        </p>
      </div>
    </div>
  )
}
