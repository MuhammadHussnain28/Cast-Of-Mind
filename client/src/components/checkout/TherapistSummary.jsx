import { checkout } from '../../data/checkoutContent'

/**
 * Who you are about to start with.
 *
 * The person leads this page. Every other checkout puts the order summary
 * first; here there is no form to fill — Stripe hosts the card entry — so the
 * page's real job is to make the commitment feel human before it feels
 * financial (§24.7: "enough warmth to make a human choice feel possible").
 *
 * NO INK WASH ON THE PHOTOGRAPH. §24.5 makes therapist portraits the explicit
 * exception: real people, shown as real people.
 */
export default function TherapistSummary({ therapist }) {
  const name = [therapist.title, therapist.firstName, therapist.lastName].filter(Boolean).join(' ')

  return (
    <section aria-labelledby="who-heading">
      <h2 id="who-heading" className="font-body text-caption text-paper/70">
        {checkout.whoHeading}
      </h2>

      <div className="mt-4 flex items-center gap-4">
        {therapist.photoUrl ? (
          <img
            src={therapist.photoUrl}
            alt=""
            className="h-16 w-16 shrink-0 rounded-full object-cover ring-1 ring-paper/20 sm:h-20 sm:w-20"
          />
        ) : (
          <span
            aria-hidden="true"
            className="h-16 w-16 shrink-0 rounded-full bg-paper/10 ring-1 ring-paper/20 sm:h-20 sm:w-20"
          />
        )}

        <div className="min-w-0">
          <p className="font-display text-subsection leading-tight text-paper">{name}</p>
          {therapist.therapistType && (
            <p className="mt-1 font-body text-caption text-paper/70">{therapist.therapistType}</p>
          )}
        </div>
      </div>

      <p className="mt-4 max-w-[38ch] font-body text-caption leading-relaxed text-paper/70">
        {checkout.whoNote}
      </p>
    </section>
  )
}
