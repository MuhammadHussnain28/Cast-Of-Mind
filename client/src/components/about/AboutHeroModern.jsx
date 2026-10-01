import { useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Heading, Text } from '../ui'
import { mission } from '../../data/aboutContent'
import WhyCardsDeckModern from './WhyCardsDeckModern'

/**
 * About Hero (Modern Edition): Two-column layout with 3D fanned cards deck
 * on the right featuring bespoke SVG watermark icons.
 *
 * Contrast: paper on ink-deep 19.7:1, paper/80 12.5:1. Both clear AA.
 */
export default function AboutHeroModern() {
  const containerRef = useRef(null)
  const reduceMotion = useReducedMotion()

  const settle = (delay) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
        }

  return (
    <section
      ref={containerRef}
      data-surface="dark"
      aria-labelledby="about-heading"
      className="relative bg-ink-deep sm:h-[180vh]"
    >
      <div className="sticky top-0 mx-auto grid w-full max-w-7xl items-center gap-x-12 gap-y-10 px-5 py-10 sm:px-8 lg:min-h-[calc(100svh-72px)] lg:grid-cols-12 lg:py-12">
        
        {/* Left Column: Heading, Lede, Mission Paragraphs */}
        <div className="lg:col-span-7">
          <motion.div {...settle(0)}>
            <Heading
              level={1}
              size="hero"
              tone="inverse"
              id="about-heading"
              className="max-w-[16ch]"
            >
              {mission.heading}
            </Heading>
          </motion.div>

          {/* The thesis of the page — section scale, not body scale. */}
          <motion.div {...settle(0.1)}>
            <p className="mt-8 max-w-[22ch] font-display text-section text-paper opacity-90">
              {mission.lede}
            </p>
          </motion.div>

          <motion.div {...settle(0.2)} className="mt-8 space-y-6">
            {mission.body.map((paragraph) => (
              <Text
                key={paragraph}
                tone="inverse"
                className="max-w-measure opacity-80"
              >
                {paragraph}
              </Text>
            ))}
          </motion.div>
        </div>

        {/* Right Column: 3-Card Deck with Watermark Icons */}
        <motion.div {...settle(0.15)} className="lg:col-span-5">
          <WhyCardsDeckModern scrollTargetRef={containerRef} />
        </motion.div>

      </div>
    </section>
  )
}
