import { motion, useReducedMotion } from 'framer-motion'
import { Heading, Text } from '../components/ui'
import ContactForm from '../components/contact/ContactForm'
import ContactChannels from '../components/contact/ContactChannels'
import { intro } from '../data/contactContent'
import {useEffect} from 'react'


export default function Contact() {
  const reduceMotion = useReducedMotion()

  const settle = (delay) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
        }

  useEffect(()=>{
    document.title = 'Contact & Support | Cast of Minds'
    } , [])    

  return (
    <div
      data-surface="dark"
      className="relative min-h-[calc(100svh-72px)] bg-ink-deep text-paper overflow-hidden"
    >
      {/* Ambient Bioluminescent Background Glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-20 -z-10 h-[38rem] w-[38rem] rounded-full bg-sage/10 blur-[140px] motion-safe:animate-drift"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 bottom-10 -z-10 h-[30rem] w-[30rem] rounded-full bg-gold/5 blur-[120px]"
      />

      <div className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16 lg:items-start">
          {/* ========================================================
              LEFT COLUMN (5 Cols): Headline, Mission & Contact Cards
             ======================================================== */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              {/* Live Status Pill */}
              <motion.div
                {...settle(0)}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-paper/5 border border-paper/10 mb-6"
              >
                <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />
                <span className="text-[11px] font-mono tracking-wider text-paper/80 uppercase font-medium">
                  Direct Founder Inbox
                </span>
              </motion.div>

              {/* Main Heading */}
              <motion.div {...settle(0.05)}>
                <Heading
                  level={1}
                  size="hero"
                  tone="inverse"
                  id="contact-heading"
                  className="max-w-[14ch]"
                >
                  {intro.heading}
                </Heading>
              </motion.div>

              {/* Lede Text */}
              {/* <motion.div {...settle(0.1)}>
                <p className="mt-6 max-w-[28ch] font-display text-section text-paper opacity-90 ">
                  {intro.lede}
                </p>
              </motion.div> */}

              <motion.div {...settle(0.1)}>
                <p className="mt-6 max-w-[28ch] font-display text-section italic text-paper/90">
                  &ldquo;A real <span className="text-gold">inbox</span> , read by the people who run this.&rdquo;</p>
              </motion.div>

              {/* Body Text */}
              <motion.div {...settle(0.15)}>
                <Text tone="inverse" className="mt-5 max-w-measure opacity-75">
                  {intro.body}
                </Text>
              </motion.div>
            </div>

            {/* 3 Visual Contact Channel Cards */}
            <div className="mt-10">
              <ContactChannels />
            </div>

            {/* Visual Security & Privacy Seal */}
            <motion.div
              {...settle(0.3)}
              className="mt-10 pt-6 border-t border-paper/10 flex items-center gap-3 text-xs text-paper/50"
            >
              <span className="text-sage font-mono">🔒</span>
              <span>
                Every message is received directly and held in strict clinical
                confidentiality.
              </span>
            </motion.div>
          </div>

          {/* ========================================================
              RIGHT COLUMN (7 Cols): Elevated White Form Studio Card
             ======================================================== */}
          <motion.div {...settle(0.15)} className="lg:col-span-7">
            <div
              data-surface="light"
              className="relative rounded-3xl bg-paper p-8 sm:p-12 text-ink shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-paper/20"
            >
              <div className="mb-8">
                <Heading
                  level={2}
                  id="form-heading"
                  size="subsection"
                  className="text-ink"
                >
                  Send us a message
                </Heading>
                <Text
                  tone="muted"
                  className="mt-2 text-sm text-ink/70 max-w-measure"
                >
                  Everything here reaches the same inbox. There is no ticket
                  number and no queue position.
                </Text>
              </div>

              {/* The Interactive Form */}
              <ContactForm />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}


