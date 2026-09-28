import { motion, useReducedMotion } from 'framer-motion'
import { Heading, Text } from '../ui'

const COMPARISON_ITEMS = [
  {
    feature: 'Accredited Master & PhD therapists',
    castOfMind: true,
    inPerson: true,
  },
  {
    feature: 'Receive therapy from the comfort of home',
    castOfMind: true,
    inPerson: false,
  },
  {
    feature: 'Message your therapist anytime between sessions',
    castOfMind: true,
    inPerson: false,
  },
  {
    feature: 'Matched across 27+ specialized clinical areas',
    castOfMind: true,
    inPerson: false,
  },
  {
    feature: 'Zero commute or travel time required',
    castOfMind: true,
    inPerson: false,
  },
  {
    feature: 'Integrated private journal & therapist worksheets',
    castOfMind: true,
    inPerson: false,
  },
]

function CheckIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function CrossIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

export default function ComparisonModern() {
  const reduceMotion = useReducedMotion()

  const reveal = (index) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 14 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.3 },
          transition: {
            duration: 0.6,
            delay: Math.min(index, 6) * 0.08,
            ease: [0.22, 1, 0.36, 1],
          },
        }

  return (
    <section
      aria-labelledby="comparison-heading"
      data-surface="light"
      className="bg-paper py-16 sm:py-24"
    >
      <div className="mx-auto w-full max-w-5xl px-5 sm:px-8">
        
        {/* Section Heading */}
        <motion.div {...reveal(0)} className="text-center space-y-3 mb-10 sm:mb-14">
          <span className="text-xs uppercase tracking-widest text-sage font-bold">
            Care Comparison
          </span>
          <Heading level={2} id="comparison-heading" className="max-w-[22ch] mx-auto">
            How this differs from a room with two chairs.
          </Heading>
          <Text tone="muted" className="max-w-xl mx-auto text-sm sm:text-base">
            In-person therapy works. This is a clear overview of how our continuous remote sanctuary compares to physical clinic appointments.
          </Text>
        </motion.div>

        {/* Talkspace-Style Comparison Matrix */}
        <motion.div
          {...reveal(1)}
          className="relative rounded-3xl bg-white border border-ink/10 p-4 sm:p-8 shadow-sm overflow-hidden"
        >
          {/* Table Column Headers */}
          <div className="grid grid-cols-12 gap-2 sm:gap-4 items-end pb-5 border-b border-ink/10 text-sm">
            <div className="col-span-6 sm:col-span-6 pl-2 sm:pl-4 text-ink/40 text-xs font-semibold uppercase tracking-wider">
              Feature & Care Experience
            </div>
            
            {/* Elevated Cast of Mind Column Header */}
            <div className="col-span-3 sm:col-span-3 text-center">
              <div className="bg-ink text-white py-3 px-2 sm:px-4 rounded-2xl shadow-md border border-ink">
                <span className="block text-xs sm:text-sm font-bold text-white tracking-wide">
                  Cast of Mind
                </span>
              </div>
            </div>

            {/* In-Person Column Header */}
            <div className="col-span-3 sm:col-span-3 text-center py-3">
              <span className="text-xs sm:text-sm font-semibold text-ink/65">
                In-Person
              </span>
            </div>
          </div>

          {/* Comparison Rows */}
          <div className="divide-y divide-ink/5 text-xs sm:text-sm">
            {COMPARISON_ITEMS.map((item, idx) => (
              <motion.div
                key={item.feature}
                {...reveal(idx + 2)}
                className="grid grid-cols-12 gap-2 sm:gap-4 items-center py-4 sm:py-5 hover:bg-mist/50 transition-colors rounded-xl px-1 sm:px-2"
              >
                {/* Feature Description */}
                <div className="col-span-6 sm:col-span-6 pl-2 sm:pl-3 font-medium text-ink leading-snug">
                  {item.feature}
                </div>

                {/* Cast of Mind State */}
                <div className="col-span-3 sm:col-span-3 flex justify-center">
                  <div
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-ink text-gold flex items-center justify-center shadow-xs"
                    aria-label="Included with Cast of Mind"
                  >
                    <CheckIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </div>
                </div>

                {/* In-Person State */}
                <div className="col-span-3 sm:col-span-3 flex justify-center">
                  {item.inPerson ? (
                    <div
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-mist text-ink/50 flex items-center justify-center"
                      aria-label="Included In-Person"
                    >
                      <CheckIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    </div>
                  ) : (
                    <div
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-mist text-clay/60 flex items-center justify-center"
                      aria-label="Not available In-Person"
                    >
                      <CrossIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

        </motion.div>

      </div>
    </section>
  )
}
