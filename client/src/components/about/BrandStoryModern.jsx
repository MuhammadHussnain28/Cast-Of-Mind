import { motion, useReducedMotion } from 'framer-motion'
import { Heading, Text } from '../ui'
import { brand } from '../../data/aboutContent'
import logoWhite from '../../assets/cast-of-mind-logo-white.png'

/* --- BESPOKE ICONS FOR THE 3 COMMITMENTS --- */

function CalmPaceIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

function PlainLanguageIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M9 7h6M9 11h4" />
    </svg>
  )
}

function ZeroFrictionIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

const PRINCIPLE_CONFIG = {
  calm: {
    badge: 'PACE · NO URGENCY',
    tagline: 'Zero pressure traps',
    Icon: CalmPaceIcon,
  },
  plain: {
    badge: 'CLARITY · NO JARGON',
    tagline: 'Radical transparent copy',
    Icon: PlainLanguageIcon,
  },
  effort: {
    badge: 'FLOW · ZERO FRICTION',
    tagline: 'Effortless user journey',
    Icon: ZeroFrictionIcon,
  },
}

/**
 * BrandStoryModern — Museum-grade architectural presentation of the mark
 * and the three foundational brand commitments (§24.7).
 * Strictly styled with brand typography: Fraunces (headings) & Satoshi (body/UI).
 */
export default function BrandStoryModern() {
  const reduceMotion = useReducedMotion()

  const reveal = (delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 22 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.25 },
          transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
        }

  return (
    <section data-surface="dark" aria-labelledby="brand-heading" className="relative bg-ink overflow-hidden">
      
      {/* Ambient Radial Lighting Washes */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/4 h-[480px] w-[480px] rounded-full bg-sage/12 blur-[140px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 right-10 h-[440px] w-[440px] rounded-full bg-gold/10 blur-[150px]"
      />

      <div className="relative mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-28 space-y-16">
        
        {/* ================= PART 1: THE DUAL-ANATOMY EXHIBITION HERO ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* LEFT: THE SCULPTURAL LOGO PEDESTAL */}
          <motion.div {...reveal(0)} className="lg:col-span-5 flex flex-col items-center">
            
            <div className="relative w-full max-w-[380px] rounded-3xl border border-white/15 bg-gradient-to-b from-white/[0.06] to-white/[0.01] p-4 sm:p-8 flex flex-col items-center justify-between shadow-2xl backdrop-blur-md group overflow-hidden transition-all duration-500 hover:border-gold/35">
              
              {/* Concentric Subtle Astronomical & Growth Rings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 group-hover:opacity-35 transition-opacity duration-700">
                <div className={`w-72 h-72 rounded-full border border-white/20 border-dashed ${reduceMotion ? '' : 'animate-[spin_70s_linear_infinite]'}`} />
                <div className="absolute w-52 h-52 rounded-full border border-sage/30" />
                <div className="absolute w-36 h-36 rounded-full border border-gold/20" />
              </div>

              {/* Top Anatomy Callout: The Mind */}
              <div className="relative z-10 w-full flex items-center justify-between">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-ink-deep/80 border border-white/15 text-[10px] uppercase tracking-wider font-semibold text-sage-deep backdrop-blur-md ">
                  <span className="w-1.5 h-1.5 rounded-full bg-sage-deep animate-pulse" />
                  <span>01 · UPPER CONTOUR</span>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-paper/60 font-medium">THE CONSCIOUS MIND</span>
              </div>

              {/* Centerpiece: The Authentic White Logo Mark */}
              <div className="relative z-10 my-6 sm:my-8 flex items-center justify-center">
                <div className="absolute w-44 h-44 rounded-full bg-gradient-to-b from-sage/20 to-gold/15 blur-[35px] pointer-events-none group-hover:scale-125 transition-transform duration-700" />
                <img
                  src={logoWhite}
                  alt="The Cast of Minds mark: a brain whose lower contour becomes a trunk and roots"
                  width={1764}
                  height={1446}
                  loading="lazy"
                  decoding="async"
                  className="relative z-10 h-auto w-full max-w-[15rem] sm:max-w-[16.5rem] drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)] transform group-hover:scale-[1.03] transition-transform duration-500"
                />
              </div>

              {/* Bottom Anatomy Callout: The Roots */}
              <div className="relative z-10 w-full flex items-center justify-between border-t border-white/[0.08] pt-4">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/25 text-[10px] uppercase tracking-wider font-semibold text-gold backdrop-blur-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                  <span>02 · LOWER CONTOUR</span>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-paper/60 font-medium">SUBSURFACE GROWTH</span>
              </div>

            </div>

            {/* Pedestal Caption */}
            <p className="mt-4 text-xs text-paper/60 text-center max-w-[300px] leading-relaxed">
              A continuous single stroke uniting conscious insight with root depth.
            </p>
          </motion.div>

          {/* RIGHT: NARRATIVE & MANIFESTO */}
          <div className="lg:col-span-7 space-y-6">
            
            <motion.div {...reveal(0.1)} className="space-y-4">
              <span className="text-xs uppercase tracking-[0.2em] text-gold font-semibold block">
                The Anatomy of The Mark
              </span>
              
              <Heading level={2} id="brand-heading" tone="inverse" className="max-w-[18ch] leading-tight">
                {brand.heading}
              </Heading>
              
              <Text tone="inverse" className="text-base sm:text-lg opacity-85 font-light leading-relaxed max-w-measure">
                {brand.body[0]}
              </Text>
            </motion.div>

            {/* The Philosophical Manifesto Quote Plaque */}
            <motion.div
              {...reveal(0.2)}
              className="relative overflow-hidden rounded-2xl border-l-4 border-gold bg-gradient-to-r from-white/[0.05] to-transparent p-5 sm:p-6 backdrop-blur-sm shadow-xl"
            >
              <div className="text-xs uppercase text-gold font-bold mb-2 tracking-wider flex items-center gap-2">
                <span>✦</span> Why It Is Drawn This Way
              </div>
              <p className="text-sm sm:text-base text-paper italic font-section leading-relaxed opacity-95">
                "{brand.body[1]}"
              </p>
            </motion.div>

          </div>

        </div>

        {/* ================= PART 2: THE 3 TACTILE PHILOSOPHY BENTO SLABS ================= */}
        <div className="space-y-6 pt-6 border-t border-white/[0.08]">
          
          <motion.div {...reveal(0.1)} className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-sage-deep font-semibold">
                Three Structural Rules
              </span>
              <Heading level={3} size="section" tone="inverse" className="mt-1">
                How this space treats your attention.
              </Heading>
            </div>
            <p className="text-xs text-paper/50 font-normal">
              Held as core commitments, not marketing adjectives.
            </p>
          </motion.div>

          {/* 3 BENTO SLABS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
            {brand.principles.map((principle, index) => {
              const cfg = PRINCIPLE_CONFIG[principle.id] || {
                badge: 'PHILOSOPHY',
                tagline: 'Standard commitment',
                Icon: CalmPaceIcon,
              }
              const PrincipleIcon = cfg.Icon

              return (
                <motion.div
                  key={principle.id}
                  {...reveal(0.15 + index * 0.1)}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-7 flex flex-col justify-between shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-gold/40 hover:-translate-y-1"
                >
                  {/* Large Watermark Ghost Numeral in Fraunces display serif */}
                  <span className="absolute -right-1 -bottom-5 text-7xl font-display font-semibold text-white/[0.05] pointer-events-none select-none group-hover:text-gold/[0.1] transition-colors">
                    0{index + 1}
                  </span>

                  <div>
                    {/* Header with Micro Badge & Icon */}
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-sage-deep bg-sage/15 px-2.5 py-1 rounded-md border border-sage/20">
                        {cfg.badge}
                      </span>
                      <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-gold group-hover:scale-110 group-hover:bg-gold/15 transition-all">
                        <PrincipleIcon className="w-4 h-4" />
                      </div>
                    </div>

                    <Heading level={3} size="subsection" tone="inverse" className="group-hover:text-gold transition-colors leading-snug">
                      {principle.title}
                    </Heading>

                    <Text size="ui" tone="inverse" className="mt-3 opacity-75 leading-relaxed font-light">
                      {principle.body}
                    </Text>
                  </div>

                  {/* Bottom Micro Tagline */}
                  <div className="pt-5 mt-5 border-t border-white/[0.08] flex items-center justify-between text-xs text-paper/50 group-hover:text-paper/75 transition-colors">
                    <span>{cfg.tagline}</span>
                    <span className="text-gold font-bold">✓</span>
                  </div>
                </motion.div>
              )
            })}
          </div>

        </div>

      </div>
    </section>
  )
}
