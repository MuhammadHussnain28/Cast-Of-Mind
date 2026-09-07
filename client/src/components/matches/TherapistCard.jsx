import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import TherapistIdentity from '../therapist/TherapistIdentity'
import { ArrowRight } from '../join/JoinIcons'
import { matches } from '../../data/matchesContent'

/**
 * One therapist, portrait-led.
 *
 * The photograph leads and takes real space, because §24.7 asks for enough
 * warmth that choosing feels like a human decision rather than a database
 * lookup — and a small avatar beside a row of fields is exactly the database
 * lookup. It carries NO ink wash: §24.5 makes therapist portraits the explicit
 * exception to that rule.
 *
 * NOTHING ON THIS CARD SCORES THE PERSON. No match count, no "best fit", no
 * rank. On the silent-fallback path nothing overlaps, so any match-strength
 * display would read zero on every card and the grid would become the "no exact
 * match" message §15 rules out.
 *
 * Elevation is declared once: a hairline at rest, and a genuine lift with a
 * shadow on hover, when the card really is off the page.
 */
export default function TherapistCard({ therapist, index = 0 }) {
  const reduceMotion = useReducedMotion()

  // Capped so the last card in a long list does not sit visibly waiting —
  // an uncapped index delay reads as lag, not rhythm (chunk 2.2).
  const delay = Math.min(index, 5) * 0.09

  return (
    <motion.li
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: reduceMotion ? 0 : 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        to={`/therapist/${therapist.id}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink/12 bg-paper transition duration-200 hover:-translate-y-0.5 hover:border-sage hover:shadow-[0_14px_40px_-24px_rgb(25_18_43_/_0.45)]"
      >
        <div className="aspect-[4/5] w-full overflow-hidden bg-mist">
          <img
            src={therapist.photoUrl}
            alt={`${therapist.firstName} ${therapist.lastName}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        </div>

        <div className="flex flex-1 flex-col p-6">
          <TherapistIdentity therapist={therapist} headingLevel={3} />

          <p className="mt-4 line-clamp-3 font-body text-ui text-ink/70">{therapist.bio}</p>

          {therapist.languages?.length > 0 && (
            <p className="mt-4 font-body text-caption text-ink/70">
              {matches.languagesLabel} {therapist.languages.join(', ')}
            </p>
          )}

          <span className="mt-6 inline-flex items-center gap-2 font-body text-ui font-medium text-ink">
            {matches.viewProfile}
            <ArrowRight
              aria-hidden="true"
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
            />
          </span>
        </div>
      </Link>
    </motion.li>
  )
}
