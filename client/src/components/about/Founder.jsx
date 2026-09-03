import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { Heading, Text } from '../ui'
import { founder } from '../../data/aboutPlaceholders'

/**
 * The founder, at depth. §24.7 lists an owner/founder profile on this page.
 *
 * ALL CONTENT HERE IS INVENTED and comes from data/aboutPlaceholders.js, which
 * carries the full warning. Note in particular that this section is written in
 * the THIRD PERSON with no quotation marks anywhere: Asad is a real, named
 * person, so a fabricated first-person quote attributed to him would be
 * misattribution rather than placeholder copy. Approved on that basis
 * 2026-08-31. **If a real quote replaces this later, it must be his words.**
 *
 * §24.9 layering: the portrait sits on an offset mist plate and drifts 14px
 * against the page as the section passes, inside the permitted 10-20px band.
 * Two depths rather than a photograph pasted beside a paragraph.
 *
 * MEASURED — computed, not estimated:
 *   ink        on mist ..... 16.2:1
 *   ink/70     on mist ......  6.4:1
 *   sage-deep  on mist ......  4.9:1  (name and role — text, must pass)
 *   ink/12     plate ......... decorative, exempt
 */
export default function Founder() {
  const reduceMotion = useReducedMotion()
  const sectionRef = useRef(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const portraitDrift = useTransform(scrollYProgress, [0, 1], [14, -14])

  const reveal = (delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.3 },
          transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
        }

  return (
    <section
      ref={sectionRef}
      data-surface="light"
      aria-labelledby="founder-heading"
      className="bg-mist"
    >
      <div className="mx-auto w-full max-w-7xl gap-x-16 px-5 py-20 sm:px-8 lg:grid lg:grid-cols-12 lg:py-28">
        <motion.div {...reveal()} className="relative mx-auto w-full max-w-[24rem] lg:col-span-5 lg:mx-0 lg:max-w-none">
          {/* The plate. Offset behind the portrait so the pair reads as two
              depths rather than one framed rectangle. */}
          <div
            aria-hidden="true"
            className="absolute -bottom-4 -left-4 h-full w-full rounded-3xl border border-ink/12 lg:-bottom-6 lg:-left-6"
          />
          <motion.div
            style={reduceMotion ? undefined : { y: portraitDrift }}
            className="relative overflow-hidden rounded-3xl"
          >
            <img
              src={founder.portrait}
              alt={founder.portraitAlt}
              width={900}
              height={1100}
              loading="lazy"
              decoding="async"
              className="aspect-4/5 w-full object-cover"
            />
          </motion.div>
        </motion.div>

        <div className="mt-14 lg:col-span-6 lg:col-start-7 lg:mt-0">
          <motion.div {...reveal()}>
            <Text size="ui" className="font-medium text-sage-deep">
              {founder.name} · {founder.role}
            </Text>
            <Heading level={2} id="founder-heading" className="mt-4 max-w-[18ch]">
              {founder.lede}
            </Heading>
          </motion.div>

          <motion.div {...reveal(0.1)} className="mt-8 space-y-6">
            {founder.body.map((paragraph) => (
              <Text key={paragraph} tone="muted" className="max-w-measure">
                {paragraph}
              </Text>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
