import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button, Heading, Text } from '../ui'
import heroVideo from '../../assets/cast_of_mind Concept 1.mp4'

const POPULAR_CONCERNS = [
  { id: 'anxiety', label: 'Anxiety & Panic' },
  { id: 'burnout', label: 'Burnout & Stress' },
  { id: 'sleep', label: 'Sleep & Insomnia' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'trauma', label: 'Trauma & Healing' },
]

const TRUST_PILLARS = [
  {
    icon: '⚡',
    label: 'No Waiting Lists',
    sub: 'Start this week',
  },
  {
    icon: '🎯',
    label: '27 Clinical Tags',
    sub: 'Matched to your need',
  },
  {
    icon: '🔒',
    label: '100% Confidential',
    sub: 'Private weekly video session',
  },
]

export default function Hero() {
  const [selectedConcern, setSelectedConcern] = useState('anxiety')
  const reduceMotion = useReducedMotion()

  const settle = (delay) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
        }

  const drift = reduceMotion
    ? {}
    : {
        animate: { y: [0, -8, 0] },
        transition: { duration: 8, repeat: Infinity, ease: 'easeInOut' },
      }

  return (
    <section
      data-surface="dark"
      aria-labelledby="hero-heading"
      className="relative isolate overflow-hidden bg-ink-deep text-paper"
    >
      {/* Ambient Bioluminescent Washes behind the Hero */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-1/4 -z-10 h-[36rem] w-[36rem] rounded-full bg-sage/10 blur-[140px] motion-safe:animate-drift"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 top-1/3 -z-10 h-[40rem] w-[40rem] rounded-full bg-gold/10 blur-[150px]"
      />

      <div className="mx-auto grid w-full max-w-7xl items-center gap-x-12 gap-y-12 px-5 py-12 sm:px-8 lg:min-h-[calc(100svh-72px)] lg:grid-cols-12 lg:py-16">
        
        {/* =========================================================
            LEFT COLUMN (7 Cols): Bold Copy + Visual Interaction
           ========================================================= */}
        <div className="lg:col-span-7 space-y-6 z-10">
          
          {/* Main Fraunces Headline */}
          <motion.div {...settle(0)}>
            <Heading
              level={1}
              size="hero"
              tone="inverse"
              id="hero-heading"
              className="max-w-[14ch] leading-[1.04] tracking-tight"
            >
              You don’t have to carry your mind alone.
            </Heading>
          </motion.div>

          {/* Emotional & Authoritative Lede */}
          <motion.div {...settle(0.1)}>
            <p className="max-w-[28ch] font-display text-section text-paper/90 leading-snug">
              Stop waiting on clinic queues. Tell us what you are facing, and we immediately match you with verified specialists who understand.
            </p>
          </motion.div>

          {/* VISUAL ELEMENT 1: Interactive Quick Concern Spark */}
          <motion.div {...settle(0.15)} className="pt-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-sage font-semibold">
              Select what you are experiencing:
            </span>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {POPULAR_CONCERNS.map((concern) => {
                const isSelected = selectedConcern === concern.id
                return (
                  <button
                    key={concern.id}
                    type="button"
                    onClick={() => setSelectedConcern(concern.id)}
                    className={`
                      px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer
                      ${
                        isSelected
                          ? 'bg-gold text-ink font-bold shadow-md shadow-gold/20 scale-105 border border-gold'
                          : 'bg-paper/5 text-paper/80 hover:bg-paper/10 border border-paper/10'
                      }
                    `}
                  >
                    {concern.label} {isSelected && '✓'}
                  </button>
                )
              })}
            </div>
          </motion.div>

          {/* Primary Action Button + How It Works Link */}
          <motion.div
            {...settle(0.2)}
            className="pt-2 flex flex-wrap items-center gap-x-8 gap-y-4"
          >
            <Button as={Link} to="/questionnaire" size="lg" className="shadow-xl shadow-gold/20">
              Get started free
            </Button>

            <Link
              to="/how-it-works"
              className="inline-flex min-h-11 items-center text-ui text-paper/85 underline decoration-paper/40 underline-offset-4 transition-colors duration-200 ease-out hover:text-paper hover:decoration-paper"
            >
              See how matching works →
            </Link>
          </motion.div>

          {/* VISUAL ELEMENT 2: 3-Pillar Clinical Trust Badges */}
          <motion.div
            {...settle(0.25)}
            className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-paper/10"
          >
            {TRUST_PILLARS.map((pillar) => (
              <div
                key={pillar.label}
                className="p-3 rounded-2xl bg-paper/5 border border-paper/10 backdrop-blur-sm flex items-center gap-3"
              >
                <span className="text-lg">{pillar.icon}</span>
                <div>
                  <h4 className="text-xs font-bold text-paper leading-tight">{pillar.label}</h4>
                  <p className="text-[11px] text-paper/60 leading-tight mt-0.5">{pillar.sub}</p>
                </div>
              </div>
            ))}
          </motion.div>

        </div>

        {/* =========================================================
            RIGHT COLUMN (5 Cols): Cinematic 4:5 Transformation Video
           ========================================================= */}
        <motion.div
          {...drift}
          className="lg:col-span-5 relative w-full max-w-[440px] lg:max-w-[480px] mx-auto select-none"
        >
          {/* Subtle Ambient Back-Glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-4 rounded-3xl bg-gradient-to-tr from-gold/15 to-sage/20 blur-2xl -z-10"
          />

          {/* The Video Container with 4:5 Aspect Ratio */}
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-white/15 bg-ink shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)]">
            <video
              src={heroVideo}
              autoPlay={!reduceMotion}
              loop
              muted
              playsInline
              aria-hidden="true"
              className="h-full w-full object-cover"
            />
            {/* Soft Ambient Vignette Overlay that melts into #0D0916 */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-deep/60 via-transparent to-ink-deep/30"
            />
          </div>

          {/* Subtle Video Footer Indicator */}
          <div className="mt-3 flex items-center justify-between px-2 text-[11px] text-paper/40 font-mono">
            <span>● 1-on-1 Remote Sanctuary</span>
            <span>€200 / Month Flat</span>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
