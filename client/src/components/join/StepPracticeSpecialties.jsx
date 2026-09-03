import { Controller, useWatch } from 'react-hook-form'
import { Input, Textarea } from '../ui'
import TagPicker from './TagPicker'
import CharCounter from './CharCounter'
import { Overlap } from './JoinIcons'
import { cx } from '../../lib/cx'
import { SPECIALTY_TAGS, SPECIALTY_TAGS_MIN, SPECIALTY_TAGS_MAX } from '../../data/specialtyTags'
import {
  TREATMENT_ORIENTATIONS,
  TREATMENT_ORIENTATIONS_MIN,
  TREATMENT_ORIENTATIONS_MAX,
} from '../../data/treatmentOrientations'
import { BIO_MAX } from '../../lib/validation/therapistApplication'

/**
 * Step 4 — 5 fields, all mandatory.
 *
 * Specialty tags and treatment orientations are the same control underneath,
 * configured differently on purpose: one decides who reaches you, the other is
 * profile text. Two identical chip grids would imply they weigh the same.
 */
export default function StepPracticeSpecialties({ register, control, errors }) {
  const bio = useWatch({ control, name: 'bio' }) ?? ''
  const disciplinary = useWatch({ control, name: 'disciplinaryActions' })

  return (
    <div className="space-y-8">
      {/* The consequential choice on the page, marked as such. */}
      <div className="rounded-2xl border border-sage/40 bg-sage/[0.06] p-5 sm:p-6">
        <p className="mb-4 flex items-center gap-2.5 font-body text-caption font-medium text-sage-deep">
          <Overlap className="h-4 w-4 shrink-0" />
          This is the only thing that decides who is matched with you
        </p>

        <Controller
          name="specialtyTags"
          control={control}
          render={({ field }) => (
            <TagPicker
              fieldName="specialtyTags"
              legend="Specialty tags"
              hint="Pick the concerns you actually work with. A client sees you when their concerns overlap yours."
              options={SPECIALTY_TAGS}
              value={field.value}
              onChange={field.onChange}
              min={SPECIALTY_TAGS_MIN}
              max={SPECIALTY_TAGS_MAX}
              prominent
              slots
              error={errors.specialtyTags?.message ?? errors.specialtyTags?.root?.message}
            />
          )}
        />
      </div>

      {/* Deliberately quieter: display only. */}
      <Controller
        name="treatmentOrientations"
        control={control}
        render={({ field }) => (
          <TagPicker
            fieldName="treatmentOrientations"
            legend="Treatment orientations"
            hint="The methods you work in. These appear on your profile so clients understand how you work — they never affect who you are matched with."
            options={TREATMENT_ORIENTATIONS}
            value={field.value}
            onChange={field.onChange}
            min={TREATMENT_ORIENTATIONS_MIN}
            max={TREATMENT_ORIENTATIONS_MAX}
            error={
              errors.treatmentOrientations?.message ?? errors.treatmentOrientations?.root?.message
            }
          />
        )}
      />

      <div>
        <Textarea
          label="Bio"
          required
          rows={4}
          placeholder="Who you work with, how you work, and what a first session with you is like."
          helper={`Clients read this when choosing a therapist. About three or four lines, up to ${BIO_MAX.toLocaleString()} characters.`}
          error={errors.bio?.message}
          {...register('bio')}
        />
        <CharCounter value={bio} max={BIO_MAX} />
      </div>

      <Input
        label="Licensing status"
        required
        placeholder="e.g. Licensed in France; able to accept clients internationally."
        helper="Who you are licensed to accept."
        error={errors.licensingStatus?.message}
        {...register('licensingStatus')}
      />

      <fieldset>
        <legend className="font-body text-caption font-medium text-ink">
          Have you had any disciplinary action in the past 10 years?
          <span className="ml-1 text-clay" aria-hidden="true">*</span>
          <span className="sr-only"> (required)</span>
        </legend>

        <p className="mt-1 max-w-measure font-body text-caption leading-relaxed text-ink/70">
          Answering yes does not end your application. It goes to our team with the rest of it.
        </p>

        <div className="mt-3 flex gap-3">
          {[
            { value: 'no', label: 'No' },
            { value: 'yes', label: 'Yes' },
          ].map((option) => (
            <label
              key={option.value}
              className={cx(
                'inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-xl border px-5 font-body text-ui transition-colors duration-200 sm:flex-none sm:min-w-32',
                'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink',
                disciplinary === option.value
                  ? 'border-ink bg-ink text-paper'
                  : 'border-ink/50 text-ink hover:border-ink hover:bg-mist',
              )}
            >
              <input
                type="radio"
                value={option.value}
                className="sr-only"
                {...register('disciplinaryActions')}
              />
              {option.label}
            </label>
          ))}
        </div>

        {errors.disciplinaryActions && (
          <p role="alert" className="mt-2 font-body text-caption text-clay">
            {errors.disciplinaryActions.message}
          </p>
        )}

        {/* Revealed only on yes, so the form does not carry a field most
            applicants will never use. */}
        {disciplinary === 'yes' && (
          <div className="mt-5">
            <Textarea
              label="What happened?"
              required
              rows={4}
              placeholder="What the action was, when it happened, and how it was resolved."
              helper="Read by our review team only."
              error={errors.disciplinaryDetails?.message}
              {...register('disciplinaryDetails')}
            />
          </div>
        )}
      </fieldset>
    </div>
  )
}
