import { motion, useReducedMotion } from 'framer-motion'
import { Heading, Text } from '../ui'
import { testimonials } from '../../data/homePlaceholders'

/**
 * Section 3 of the home page (master spec §24.7).
 *
 * ALL CONTENT HERE IS INVENTED. Every quote, name and face comes from
 * data/homePlaceholders.js, which carries the full warning and the pre-launch
 * requirement. This component holds no copy of its own for exactly that reason:
 * one file to empty, not two.
 *
 * WHY THE CARDS ARE OFFSET RATHER THAN A ROW OF THREE.
 * Three equal cards side by side is what this section is on almost every site,
 * and it makes four different people's experiences look like four instances of
 * one template. The quotes here are different lengths because real ones would
 * be, so the layout lets them be: two columns, the right column dropped by a
 * third of a card, and cards that size to their own content.
 *
 * CARDS ARE MIST ON PAPER, NOT PAPER ON MIST.
 * The first build had it the other way round and the cards would have been
 * close to invisible: paper and mist are only 1.11:1 apart, so a white card on
 * a mist ground has almost no edge of its own and a hairline border ends up
 * doing all the work of saying "this is a card". Inverting it means the card is
 * defined by its own ground, needs no border at all, and matches §24.2, which
 * assigns mist to "alternating section backgrounds, cards" in as many words.
 *
 * MEASURED (all pass AA):
 *   ink-deep   on mist (quote) ......... 17.7:1
 *   ink        on mist (name) .......... 16.2:1
 *   ink/70     on mist (caption) ....... 6.4:1
 *   ink        on paper (heading) ...... 18.1:1
 *   ink/70     on paper (intro) ........ 6.7:1
 */

function Testimonial({ item, reduceMotion, index }) {
  const reveal = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.25 },
        transition: {
          duration: 0.7,
          // §24.4 asks for an 80-120ms stagger. Taken modulo the column count
          // so the delay resets per column - otherwise the fourth card waits
          // 300ms after it is already on screen, which reads as lag rather
          // than rhythm.
          delay: (index % 2) * 0.1,
          ease: [0.22, 1, 0.36, 1],
        },
      }

  return (
    <motion.figure
      {...reveal}
      className="rounded-2xl bg-mist p-7 sm:p-8"
    >
      {/* Fraunces would be wrong here. §24.3 keeps it to display sizes, and a
          quote set in the display face reads as a pull-quote the brand is
          making rather than something a person said. */}
      <blockquote>
        <Text className="text-ink-deep">{item.quote}</Text>
      </blockquote>

      <figcaption className="mt-7 flex items-center gap-4">
        <img
          src={item.portrait}
          alt={item.portraitAlt}
          width={56}
          height={56}
          loading="lazy"
          decoding="async"
          className="h-14 w-14 shrink-0 rounded-full object-cover"
        />
        <div className="min-w-0">
          <Text size="ui" className="font-medium text-ink">
            {item.name}
          </Text>
          {/* What they came for and how long they have been here, instead of a
              surname. §24.7 requires real testimonials to be anonymised, so the
              placeholder is already in the shape the real ones must take. */}
          <Text size="caption" tone="muted" className="mt-0.5">
            {item.context} · {item.duration}
          </Text>
        </div>
      </figcaption>
    </motion.figure>
  )
}

export default function Testimonials() {
  const reduceMotion = useReducedMotion()

  const heading = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.4 },
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
      }

  return (
    <section
      aria-labelledby="testimonials-heading"
      data-surface="light"
      className="bg-paper"
    >
      <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
        <motion.div {...heading}>
          <Heading level={2} id="testimonials-heading" className="max-w-[18ch]">
            What people say afterwards.
          </Heading>
          {/* Deliberately makes no claim about consent, verification, or how
              these were collected. An earlier draft opened with "shared with
              permission", which would have been a false statement sitting
              directly above four invented quotes — and a claim someone would
              then have to make true at launch. This says only what the section
              is looking for, which stays true whoever is quoted. */}
          <Text tone="muted" className="mt-7 max-w-measure">
            Change in therapy is usually small and specific — sleeping through a
            night, catching an argument before it starts. Those are the parts
            worth repeating.
          </Text>
        </motion.div>

        {/* Two columns on desktop, one below it. The right column is offset so
            the pair reads as a considered arrangement rather than a table, and
            items-start lets each card end where its own quote ends. */}
        <div className="mt-14 grid items-start gap-6 sm:gap-8 lg:mt-16 lg:grid-cols-2">
          <div className="grid gap-6 sm:gap-8">
            {testimonials
              .filter((_, i) => i % 2 === 0)
              .map((item, i) => (
                <Testimonial
                  key={item.id}
                  item={item}
                  index={i * 2}
                  reduceMotion={reduceMotion}
                />
              ))}
          </div>

          <div className="grid gap-6 sm:gap-8 lg:mt-16">
            {testimonials
              .filter((_, i) => i % 2 === 1)
              .map((item, i) => (
                <Testimonial
                  key={item.id}
                  item={item}
                  index={i * 2 + 1}
                  reduceMotion={reduceMotion}
                />
              ))}
          </div>
        </div>
      </div>
    </section>
  )
}
