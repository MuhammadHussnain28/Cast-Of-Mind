import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button } from '../ui'
import heroVideo from '../../assets/cast_of_mind Concept 1.mp4'
import doc1 from '../../assets/testimonial-portrait-7.jpg'
import doc2 from '../../assets/team-portrait-2.jpg'
import doc3 from '../../assets/testimonial-portrait-3.jpg'

const ROTATING_WORDS = [
  'anxiety',
  'stress',
  'burnout',
  'grief',
  // 'overthinking',
  // 'depression',
]

/**
 * Custom Checkmark Tick Icon (§24.5)
 * Drawn SVG with 1.75 stroke weight matching design tokens.
 */
function CheckTickIcon({ className = 'w-4 h-4' }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <circle cx="10" cy="10" r="9" className="fill-sage/15 stroke-sage/35" strokeWidth="1.2" />
      <path
        d="M6.5 10.25L8.75 12.5L13.5 7.75"
        stroke="#F5C518"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const VALUE_POINTS = [
  {
    title: 'Matched to Your Exact Concern',
    detail: 'Over 27 clinical specialties matched with zero waitlists.',
  },
  {
    title: 'Accredited Master & PhD Specialists',
    detail: 'Every therapist is strictly verified, licensed, and highly experienced.',
  },
  {
    title: 'Your Complete Private Sanctuary',
    detail: 'Direct 1-on-1 video sessions with continuous private chat support.',
  },
]

export default function HeroModern() {
  const [wordIndex, setWordIndex] = useState(0)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (reduceMotion) return
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length)
    }, 2800)
    return () => clearInterval(interval)
  }, [reduceMotion])

  const settle = (delay) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] },
        }

  const ambientDrift = reduceMotion
    ? {}
    : {
        animate: { y: [0, -6, 0] },
        transition: { duration: 8, repeat: Infinity, ease: 'easeInOut' },
      }

  return (
    <section
      data-surface="dark"
      aria-labelledby="hero-heading"
      className="relative isolate overflow-hidden bg-ink-deep text-paper"
    >
      {/* Soft Ambient Radial Glows behind the Hero (§24.9) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-1/4 -z-10 h-[40rem] w-[40rem] rounded-full bg-sage/10 blur-[150px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-1/3 -z-10 h-[44rem] w-[44rem] rounded-full bg-gold/10 blur-[160px]"
      />

      <div className="mx-auto grid w-full max-w-7xl items-center gap-x-12 gap-y-12 px-5 py-10 sm:px-8 lg:min-h-[calc(100svh-72px)] lg:grid-cols-12 lg:py-14">
        
        {/* =========================================================
            LEFT COLUMN (7 Cols): High-Impact & Visual Trust Flow
           ========================================================= */}
        <div className="lg:col-span-7 space-y-6 z-10">
          
          {/* 1. TOP SOCIAL PROOF PILL (Small Therapist Samples + Line) */}
          <motion.div {...settle(0)} className="inline-flex">
            <div className="inline-flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-paper/5 border border-paper/10 backdrop-blur-md shadow-inner">
              <div className="flex -space-x-2 shrink-0">
                <img
                  src={doc1}
                  alt="Therapist"
                  className="w-7 h-7 rounded-full object-cover border-2 border-ink-deep"
                />
                <img
                  src={doc2}
                  alt="Therapist"
                  className="w-7 h-7 rounded-full object-cover border-2 border-ink-deep"
                />
                <img
                  src={doc3}
                  alt="Therapist"
                  className="w-7 h-7 rounded-full object-cover border-2 border-ink-deep"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sage opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sage"></span>
                </span>
                <span className="text-xs text-paper/85 font-medium tracking-wide">
                  Over 100+ certified clinicians worldwide
                </span>
              </div>
            </div>
          </motion.div>

          {/* 2. SHORT, PUNCHY HEADLINE WITH CENTER-STABLE ROTATING WORDS */}
          <motion.div {...settle(0.08)}>
            <h1
              id="hero-heading"
              className="font-fraunces text-3xl sm:text-4xl lg:text-[3.25rem] font-normal leading-[1.14] tracking-tight text-paper max-w-[17ch]"
            >
              You don’t have to carry your{' '}
              <span className="inline-grid grid-cols-1 justify-items-center align-baseline w-[7ch] sm:w-[5.7ch] text-center ">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={ROTATING_WORDS[wordIndex]}
                    initial={{ opacity: 0, y: 10, filter: 'blur(3px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -10, filter: 'blur(3px)' }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="col-start-1 row-start-1 italic text-gold font-fraunces text-center w-full block"
                  >
                    {ROTATING_WORDS[wordIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>{' '}
              alone.
            </h1>
          </motion.div>

          {/* 3. THREE PROFESSIONAL VALUE BULLETS WITH DESIGNED TICKS */}
          <motion.div {...settle(0.16)} className="space-y-3 pt-1 max-w-xl">
            {VALUE_POINTS.map((pt) => (
              <div key={pt.title} className="flex items-start gap-3 group">
                <div className="shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-110">
                  <CheckTickIcon className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[16px] font-semibold text-paper/95 leading-snug">
                    {pt.title}
                  </p>
                  <p className="text-[14px] text-paper/65 leading-relaxed">
                    {pt.detail}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* 4. TWO ACTION CTA BUTTONS */}
          <motion.div
            {...settle(0.24)}
            className="pt-2 flex flex-wrap items-center gap-4"
          >
            {/* Primary Gold CTA Button */}
            <Button
              as={Link}
              to="/questionnaire"
              size="lg"
              className="shadow-xl shadow-gold/20 font-semibold px-8"
            >
              Get started free
            </Button>

            {/* Secondary Styled CTA Button */}
            <Link
              to="/how-it-works"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-paper/25 bg-paper/5 px-6 font-body text-ui font-medium text-paper backdrop-blur-sm transition-all duration-200 hover:border-gold/50 hover:bg-paper/10 hover:text-white"
            >
              See how matching works →
            </Link>
          </motion.div>

        </div>

        {/* =========================================================
            RIGHT COLUMN (5 Cols): Seamless Borderless Video Canvas
           ========================================================= */}
        <motion.div
          {...ambientDrift}
          className="lg:col-span-5 relative w-full max-w-[420px] lg:max-w-[460px] mx-auto select-none flex items-center justify-center"
        >

          {/* Subtle Ambient Sage/Gold Glow behind the human subject */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-6 rounded-full bg-gradient-to-tr from-gold/15 via-sage/15 to-transparent blur-3xl -z-10"
          />

          {/* Borderless Video Container with Elliptical Radial Feathering */}
          <div className="relative aspect-[4/5] w-full overflow-hidden">
            <video  
              src={heroVideo}
              autoPlay={!reduceMotion}
              loop
              muted
              playsInline
              aria-hidden="true"
              className="py-5 h-full w-full object-cover  [mask-image:radial-gradient(ellipse_at_center,black_55%,transparent_100%)] [-webkit-mask-image:radial-gradient(ellipse_at_center,black_55%,transparent_100%)]"
            />
          </div>
        </motion.div>

      </div>
    </section>
  )
}
