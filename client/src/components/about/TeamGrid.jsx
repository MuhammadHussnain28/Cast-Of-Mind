import { motion, useReducedMotion } from 'framer-motion'
import { Heading, Text } from '../ui'
import { team } from '../../data/aboutPlaceholders'

/**
 * The full team. §24.7 merges the standalone team page into About, and `/team`
 * redirects here — which is why this grid carries `id="team"` and includes the
 * founder even though he has his own section above. Someone arriving from that
 * redirect should land on a complete team, not on four people and a gap.
 *
 * EVERY NAME, FACE, ROLE AND QUALIFICATION IS INVENTED. See the warning at the
 * top of data/aboutPlaceholders.js — the two clinical credentials in particular
 * are an implied claim about governance that must not reach production.
 *
 * ELEVATION IS DECLARED ONCE PER STATE, WHICH IS WHY THE SHADOW ONLY APPEARS ON
 * HOVER. A 1px border sitting under a soft shadow at rest is the "ghost card" —
 * two competing depth cues on a surface that is not actually raised. At rest
 * these are flat mist panels with a hairline edge. On hover the card lifts 3px,
 * the border warms to sage, and a shadow appears underneath: the card is now
 * genuinely off the page, so the shadow is describing something real rather
 * than decorating something flat. That is §24.9's "natural, not decorated"
 * applied to a state change.
 *
 * The lift is 200ms, not 700ms — §24.4 keeps functional and hover feedback
 * fast. Only ambient and reveal motion is slow.
 *
 * MEASURED — computed, not estimated:
 *   ink        on mist ...... 16.2:1     ink      on paper .... 18.1:1
 *   ink/70     on mist .......  6.4:1     ink/70   on paper .....  6.7:1
 *   sage-deep  on mist .......  4.9:1  (role label — text, must pass)
 *   ink/8      rest border ....  1.2:1  decorative, exempt
 *   sage/40    hover border ...  1.5:1  decorative, exempt
 */
export default function TeamGrid() {
  const reduceMotion = useReducedMotion()

  const heading = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.5 },
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
      }

  const card = (index) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.25 },
          transition: {
            duration: 0.7,
            // §24.4: 80-120ms stagger. Capped so the last card in a row does
            // not sit visibly waiting after the ones beside it have arrived.
            delay: Math.min(index, 3) * 0.1,
            ease: [0.22, 1, 0.36, 1],
          },
        }

  return (
    <section data-surface="light" aria-labelledby="team-heading" className="bg-paper">
      <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
        {/* scroll-mt clears the 72px sticky navbar, so arriving from /team
            lands on the heading rather than behind it. */}
        <motion.div {...heading} id="team" className="scroll-mt-28">
          <Heading level={2} id="team-heading" className="max-w-[16ch]">
            The people behind it.
          </Heading>
          <Text tone="muted" className="mt-7 max-w-measure">
            A small team. Clinical judgement sits with the therapists and with
            our clinical lead — everyone else exists so that nothing gets in
            their way.
          </Text>
        </motion.div>

        <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">
          {team.map((person, index) => (
            <motion.li
              key={person.id}
              {...card(index)}
              className="rounded-2xl border border-ink/8 bg-mist p-6 transition duration-200 ease-out hover:-translate-y-1 hover:border-sage/40 hover:shadow-[0_12px_28px_-12px_rgb(25_18_43_/_0.25)]"
            >
              <img
                src={person.portrait}
                alt={person.portraitAlt}
                width={900}
                height={1100}
                loading="lazy"
                decoding="async"
                className="aspect-4/5 w-full rounded-xl object-cover"
              />

              <div className="mt-6">
                <Heading level={3} size="subsection">
                  {person.name}
                </Heading>
                <Text size="ui" className="mt-1 font-medium text-sage-deep">
                  {person.role}
                </Text>
                {person.credential && (
                  <Text size="caption" tone="muted" className="mt-2">
                    {person.credential}
                  </Text>
                )}
                <Text size="ui" tone="muted" className="mt-4 max-w-measure">
                  {person.bio}
                </Text>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
