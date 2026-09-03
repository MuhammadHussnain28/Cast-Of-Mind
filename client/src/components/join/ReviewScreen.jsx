import { DAYS, GENDERS } from '../../lib/validation/therapistApplication'
import { steps } from '../../data/joinContent'
import { Check } from './JoinIcons'

/**
 * The final read-through before submitting.
 *
 * Every value grouped by the step it came from, each group with an edit link
 * back to that step. Two things it does deliberately:
 *
 *   1. THE PASSWORD IS NEVER SHOWN, not even masked. There is nothing to check
 *      by looking at dots, and rendering it at all would put a credential on
 *      screen in a shoulder-surfable place.
 *   2. The week is shown as a week, not as fourteen time values, so it stays
 *      checkable at a glance.
 */

const notGiven = <span className="text-ink/60">Not given</span>

function Row({ label, children }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[160px_1fr] sm:gap-4 lg:grid-cols-[180px_1fr]">
      <dt className="font-body text-caption text-ink/70">{label}</dt>
      <dd className="min-w-0 font-body text-ui break-words text-ink">{children}</dd>
    </div>
  )
}

function Group({ step, onEdit, children }) {
  const meta = steps.find((s) => s.number === step)

  return (
    <section className="rounded-2xl border border-ink/12 p-4 sm:p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-body text-subsection font-medium text-ink">{meta?.label}</h3>
        <button
          type="button"
          onClick={() => onEdit(step)}
          className="min-h-11 shrink-0 font-body text-caption text-ink underline decoration-ink/40 underline-offset-4 transition-colors duration-200 hover:decoration-ink"
        >
          Edit
          <span className="sr-only"> {meta?.label}</span>
        </button>
      </div>

      <dl className="mt-2 divide-y divide-ink/8">{children}</dl>
    </section>
  )
}

function Tags({ items }) {
  if (!items?.length) return notGiven
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-full bg-mist px-2.5 py-1 font-body text-caption text-ink"
        >
          {item}
        </li>
      ))}
    </ul>
  )
}

function fileName(url) {
  if (!url) return null
  try {
    return decodeURIComponent(new URL(url).pathname.split('/').pop())
  } catch {
    return 'Uploaded'
  }
}

function Uploaded({ url }) {
  if (!url) return notGiven
  return (
    <span className="inline-flex items-center gap-2 text-sage-deep">
      <Check className="h-4 w-4 shrink-0" />
      <span className="truncate">{fileName(url)}</span>
    </span>
  )
}

export default function ReviewScreen({ values, onEdit }) {
  const v = values
  const genderLabel = GENDERS.find((g) => g.value === v.gender)?.label ?? v.gender
  const enabledDays = DAYS.filter((d) => v.workingHours?.[d.key]?.enabled)

  const dob = v.dateOfBirth
    ? new Date(v.dateOfBirth).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <div className="space-y-5">
      <Group step={1} onEdit={onEdit}>
        <Row label="Name">{`${v.title} ${v.firstName} ${v.lastName}`.trim()}</Row>
        <Row label="Gender">{genderLabel || notGiven}</Row>
        <Row label="Date of birth">{dob || notGiven}</Row>
        <Row label="Email">{v.email || notGiven}</Row>
        {/* Never rendered, not even as dots. */}
        <Row label="Password">
          <span className="inline-flex items-center gap-2 text-sage-deep">
            <Check className="h-4 w-4 shrink-0" />
            Chosen — you will use it to sign in
          </span>
        </Row>
        <Row label="Profile photo">
          {v.photoUrl ? (
            <img
              src={v.photoUrl}
              alt=""
              className="h-16 w-16 rounded-full border border-ink/12 object-cover"
            />
          ) : (
            notGiven
          )}
        </Row>
      </Group>

      <Group step={2} onEdit={onEdit}>
        <Row label="Address">
          {[v.streetAddress, v.city, v.stateProvince, v.zipPostal, v.country]
            .filter(Boolean)
            .join(', ') || notGiven}
        </Row>
        <Row label="Timezone">{v.timezone || notGiven}</Row>
        <Row label="Languages">
          <Tags items={v.languages} />
        </Row>
        <Row label="Working hours">
          {enabledDays.length === 0 ? (
            notGiven
          ) : (
            <ul className="space-y-1">
              {enabledDays.map((day) => (
                <li key={day.key} className="flex gap-3">
                  <span className="w-24 shrink-0 text-ink/70">{day.label}</span>
                  <span className="tabular-nums">
                    {v.workingHours[day.key].start} – {v.workingHours[day.key].end}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Row>
        {v.workingHours?.note && <Row label="Availability note">{v.workingHours.note}</Row>}
      </Group>

      <Group step={3} onEdit={onEdit}>
        <Row label="Therapist type">{v.therapistType || notGiven}</Row>
        <Row label="Credential">
          {[v.credentialType, v.credentialInitials].filter(Boolean).join(' · ') || notGiven}
        </Row>
        <Row label="Years of experience">{v.yearsExperience || notGiven}</Row>
        <Row label="Education">{v.educationSummary || notGiven}</Row>
        <Row label="Current work">{v.currentWorkSituation || notGiven}</Row>
        <Row label="Licence number">{v.licenseNumber || notGiven}</Row>
        <Row label="Taxpayer ID">{v.taxpayerIdNumber || notGiven}</Row>
      </Group>

      <Group step={4} onEdit={onEdit}>
        <Row label="Specialties">
          <Tags items={v.specialtyTags} />
        </Row>
        <Row label="Orientations">
          <Tags items={v.treatmentOrientations} />
        </Row>
        <Row label="Bio">{v.bio || notGiven}</Row>
        <Row label="Licensing status">{v.licensingStatus || notGiven}</Row>
        <Row label="Disciplinary action">
          {v.disciplinaryActions === 'yes' ? 'Yes' : v.disciplinaryActions === 'no' ? 'No' : notGiven}
        </Row>
        {v.disciplinaryActions === 'yes' && (
          <Row label="Details">{v.disciplinaryDetails || notGiven}</Row>
        )}
      </Group>

      <Group step={5} onEdit={onEdit}>
        <Row label="Malpractice insurance">
          {v.malpracticeInsurance === 'yes'
            ? 'Yes'
            : v.malpracticeInsurance === 'no'
              ? 'No'
              : notGiven}
        </Row>
        <Row label="Insurance details">{v.insuranceDetails || notGiven}</Row>
        <Row label="Certificate">
          <Uploaded url={v.certificateUrl1} />
        </Row>
        <Row label="Second certificate">
          <Uploaded url={v.certificateUrl2} />
        </Row>
        <Row label="Licence document">
          <Uploaded url={v.licenseDocUrl} />
        </Row>
      </Group>
    </div>
  )
}
