import { motion, useReducedMotion } from 'framer-motion'
import { Heading, Text } from '../ui'
import { brand } from '../../data/aboutContent'
import logoWhite from '../../assets/cast-of-mind-logo-singular-white.png'

/**
 * The mark, and what it means. §24.7 lists "brand logo presentation" as part of
 * this page.
 *
 * WHY THE LOGO IS SHOWN AT 260px AND NOT LARGER. It is tempting to run a brand
 * section with the mark at display scale, and this one deliberately does not.
 * The singular-wordmark asset was produced in chunk 0.5 by clipping the S out
 * of a flattened raster, and it carries two known defects recorded in
 * docs/ongoing.md: the wordmark sits roughly 3% left of centre relative to the
 * brain, and the D's bowl has faint stair-stepping along its right edge.
 * Neither is visible at navbar size. Both become visible the larger it is
 * printed, and a brand section is precisely where a viewer looks closely.
 *
 * 260px is the size at which it reads as a considered presentation rather than
 * an inspection. **When Asad supplies the vector source this constraint
 * disappears** and the mark can be set as large as the composition wants — that
 * file is worth asking for anyway, since the favicon needs it too.
 *
 * WHITE ARTWORK, SO THIS SECTION IS DARK. §24.5: the supplied logo is white on
 * transparency and disappears entirely on paper and mist. The ink recolour
 * exists for light grounds, but the white original is the untouched client
 * asset, so the brand section is built around it rather than around a
 * derivative.
 *
 * MEASURED — computed, not estimated:
 *   paper      on ink ....... 18.1:1
 *   paper/80   on ink ....... 11.7:1
 *   paper/75   on ink ....... 10.4:1
 *   sage       on ink ........  5.3:1  (principle markers — non-text icon)
 *   sage/25    ring ..........  1.4:1  decorative, exempt
 */
export default function BrandStory() {
  const reduceMotion = useReducedMotion()

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
    <section data-surface="dark" aria-labelledby="brand-heading" className="bg-ink">
      <div className="mx-auto w-full max-w-7xl gap-x-16 px-5 py-20 sm:px-8 lg:grid lg:grid-cols-12 lg:py-28">
        <motion.div {...reveal()} className="lg:col-span-5">
          {/* Sits on a faint sage ring so the mark has a place to be rather
              than floating on the ground — a plate, not a decoration. */}
          <div className="relative mx-auto flex w-full max-w-[22rem] items-center justify-center rounded-3xl border border-sage/25 bg-ink-deep/40 p-10 lg:mx-0">
            <img
              src={logoWhite}
              alt="The Cast of Mind mark: a brain whose lower contour becomes a trunk and roots"
              width={1764}
              height={1446}
              loading="lazy"
              decoding="async"
              className="h-auto w-full max-w-[16rem]"
            />
          </div>
        </motion.div>

        <div className="mt-14 lg:col-span-6 lg:col-start-7 lg:mt-0">
          <motion.div {...reveal()}>
            <Heading level={2} id="brand-heading" tone="inverse" className="max-w-[18ch]">
              {brand.heading}
            </Heading>
            <div className="mt-8 space-y-6">
              {brand.body.map((paragraph) => (
                <Text key={paragraph} tone="inverse" className="max-w-measure opacity-80">
                  {paragraph}
                </Text>
              ))}
            </div>
          </motion.div>

          <ul className="mt-12 space-y-8">
            {brand.principles.map((principle, index) => (
              <motion.li key={principle.id} {...reveal(0.1 + index * 0.1)}>
                {/* Drawn marker, one stroke weight — never a bullet glyph. */}
                <div className="flex gap-4">
                  <svg
                    viewBox="0 0 20 20"
                    className="mt-1.5 h-4 w-4 shrink-0 text-sage"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M10 3v14M10 9c0-2.5 1.8-4.2 4.5-4.5C14.2 7.2 12.5 9 10 9Zm0 3c0-2.2-1.6-3.7-4-4 .3 2.4 1.8 4 4 4Z"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div>
                    <Heading level={3} size="subsection" tone="inverse">
                      {principle.title}
                    </Heading>
                    <Text size="ui" tone="inverse" className="mt-2 max-w-measure opacity-75">
                      {principle.body}
                    </Text>
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
