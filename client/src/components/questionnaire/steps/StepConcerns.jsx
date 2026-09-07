import ConcernPicker from '../ConcernPicker'

/** Step 5 — the only answer that decides who you are matched with (§15). */
export default function StepConcerns({ answers, onChange, errors }) {
  return (
    <ConcernPicker
      value={answers.concernTags}
      onChange={(tags) => onChange({ concernTags: tags })}
      error={errors.concernTags}
    />
  )
}
