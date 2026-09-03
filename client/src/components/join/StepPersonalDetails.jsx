import { useState } from 'react'
import { Controller } from 'react-hook-form'
import { Input, Select } from '../ui'
import PhotoUpload from './PhotoUpload'
import { TITLES, GENDERS, MIN_PASSWORD_LENGTH } from '../../lib/validation/therapistApplication'

/** Step 1 — the 8 personal detail fields. */
export default function StepPersonalDetails({ register, control, errors }) {
  const [showPassword, setShowPassword] = useState(false)

  // The 18+ floor, expressed as the latest date the picker will accept, so the
  // browser stops an impossible date before validation has to explain it.
  const maxDob = new Date()
  maxDob.setFullYear(maxDob.getFullYear() - 18)

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-[120px_1fr_1fr]">
        <Select
          label="Title"
          required
          placeholder="Select"
          options={TITLES.map((t) => ({ value: t, label: t }))}
          error={errors.title?.message}
          {...register('title')}
        />
        <Input
          label="First name"
          required
          placeholder="Amara"
          autoComplete="given-name"
          error={errors.firstName?.message}
          {...register('firstName')}
        />
        <Input
          label="Last name"
          required
          placeholder="Okafor"
          autoComplete="family-name"
          error={errors.lastName?.message}
          {...register('lastName')}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Select
          label="Gender"
          required
          placeholder="Select"
          options={GENDERS}
          helper="Clients may state a preference. It sorts results — it never hides you."
          error={errors.gender?.message}
          {...register('gender')}
        />
        <Input
          label="Date of birth"
          type="date"
          required
          max={maxDob.toISOString().slice(0, 10)}
          autoComplete="bday"
          error={errors.dateOfBirth?.message}
          {...register('dateOfBirth')}
        />
      </div>

      <Input
        label="Email"
        type="email"
        required
        placeholder="you@practice.com"
        autoComplete="email"
        helper="This becomes your login if your application is approved."
        error={errors.email?.message}
        {...register('email')}
      />

      <div>
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          required
          placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
          autoComplete="new-password"
          helper="You will use this to sign in. It cannot be changed later, only reset."
          error={errors.password?.message}
          {...register('password')}
        />
        {/* A text toggle, not an eye glyph: it states exactly what it will do,
            and typing a password blind is a real cause of failed sign-ins. */}
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="mt-2 min-h-11 font-body text-caption text-ink underline decoration-ink/40 underline-offset-4 transition-colors duration-200 hover:decoration-ink"
        >
          {showPassword ? 'Hide password' : 'Show password'}
        </button>
      </div>

      <Controller
        name="photoUrl"
        control={control}
        render={({ field }) => (
          <PhotoUpload
            value={field.value}
            onChange={field.onChange}
            error={errors.photoUrl?.message}
          />
        )}
      />
    </div>
  )
}
