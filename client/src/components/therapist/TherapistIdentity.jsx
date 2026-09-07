import { cx } from '../../lib/cx'

/**
 * Who this person is: photo, name, credentials, professional title, specialties.
 *
 * SHARED ON PURPOSE. Chunk 4.6 shows a therapist a card captioned "How you
 * appear to someone choosing a therapist". If the client-facing card were built
 * separately, that caption would slowly become false. The part that shows the
 * PERSON is one component; each context keeps its own container, affordances
 * and surroundings.
 *
 * NO INK WASH ON THE PHOTOGRAPH. Every other photo on this site sits under one,
 * but §24.5 makes therapist portraits the explicit exception: these are real
 * people and must be shown as real, warm, professional portraits.
 */
export default function TherapistIdentity({
  therapist,
  size = 'card',
  tone = 'default',
  headingLevel = 3,
}) {
  const Heading = `h${headingLevel}`
  const inverse = tone === 'inverse'

  const credentials = [therapist.credentialInitials, therapist.credentialType]
    .filter(Boolean)
    .join(' · ')

  return (
    <div>
      <Heading
        className={cx(
          'font-body font-medium',
          size === 'detail' ? 'text-section font-display' : 'text-subsection',
          inverse ? 'text-paper' : 'text-ink',
        )}
      >
        {[therapist.title, therapist.firstName, therapist.lastName].filter(Boolean).join(' ')}
      </Heading>

      {credentials && (
        <p
          className={cx(
            'mt-1 font-body text-caption',
            inverse ? 'text-paper/70' : 'text-ink/70',
          )}
        >
          {credentials}
        </p>
      )}

      <p
        className={cx(
          'mt-2 font-body text-ui',
          inverse ? 'text-paper/80' : 'text-ink/70',
        )}
      >
        {therapist.therapistType}
      </p>

      {therapist.specialtyTags?.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {therapist.specialtyTags.map((tag) => (
            <li
              key={tag}
              className={cx(
                'rounded-full px-3 py-1 font-body text-caption',
                inverse ? 'bg-paper/10 text-paper' : 'bg-sage/15 text-ink',
              )}
            >
              {tag}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
