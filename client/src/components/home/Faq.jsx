import { useState, useId } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Heading, Text } from '../ui'
import { faqItems } from '../../data/homeContent'


function FaqItem({ item, index, reduceMotion }) {
  const [open, setOpen] = useState(false)
  const reactId = useId()
  const buttonId = `faq-trigger-${reactId}`
  const panelId = `faq-panel-${reactId}`

  const reveal = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 16 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.6 },
        transition: {
          duration: 0.7,
          delay: Math.min(index, 4) * 0.1, // §24.4: 80-120ms stagger
          ease: [0.22, 1, 0.36, 1],
        },
      }

  return (
    <motion.li {...reveal} className="border-b border-ink/20">
      {/* h3 keeps the document outline in order under the section's h2, and the
          button lives inside it so the heading is what gets announced. */}
      <h3>
        <button
          type="button"
          id={buttonId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full min-h-11 items-start justify-between gap-6 py-6 text-left transition-colors duration-200 ease-out hover:text-ink-deep"
        >
          <span className="font-body text-subsection text-ink">
            {item.question}
          </span>

          {/* Drawn, not a unicode chevron — one stroke weight, matching the
              navbar's icon. 200ms, the same as the panel, so the two read as
              one gesture. */}
          <motion.span
            aria-hidden="true"
            animate={reduceMotion ? undefined : { rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center text-ink/70"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none">
              <path
                d="M5 8l5 5 5-5"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.span>
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="panel"
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduceMotion ? { height: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <Text tone="muted" className="max-w-measure pb-7">
              {item.answer}
            </Text>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  )
}

export default function Faq() {
  const reduceMotion = useReducedMotion()

  const heading = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.5 },
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
      }

  return (
    <section aria-labelledby="faq-heading" data-surface="light" className="bg-mist">
      <div className="mx-auto w-full max-w-7xl gap-x-16 px-5 py-20 sm:px-8 lg:grid lg:grid-cols-12 lg:py-28">
        <motion.div {...heading} className="lg:col-span-4">
          <Heading level={2} id="faq-heading" className="max-w-[14ch]">
            Before you decide.
          </Heading>
          <Text tone="muted" className="mt-7 max-w-measure">
            The questions people actually ask, answered as plainly as we can put
            them.
          </Text>
        </motion.div>

        <ul className="mt-12 border-t border-ink/20 lg:col-span-8 lg:mt-0">
          {faqItems.map((item, index) => (
            <FaqItem
              key={item.id}
              item={item}
              index={index}
              reduceMotion={reduceMotion}
            />
          ))}
        </ul>
      </div>
    </section>
  )
}
