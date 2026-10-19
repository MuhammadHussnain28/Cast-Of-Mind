import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button, Heading, Text } from '../ui'
import heroVideo from '../../assets/cast_of_mind Concept 1.mp4'

/**
 * Authentic SVG Line Icons matching the site's design system (§24.5)
 * 24px viewBox, 1.5 stroke, round caps, colour inherited.
 */
function Icon({ children, className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  )
}

function ClockIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.25V12l3.25 2" />
    </Icon>
  )
}

function OverlapIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="12" r="6" />
      <circle cx="15" cy="12" r="6" />
      <path d="M12 7.4a6 6 0 0 0 0 9.2" strokeOpacity="0.45" />
    </Icon>
  )
}

function ShieldLockIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12 2.75 20 5.5v6c0 4.4-3.2 7.9-8 9.75-4.8-1.85-8-5.35-8-9.75v-6l8-2.75Z" />
      <path d="M9 12.25 11.25 14.5 15.25 10" />
    </Icon>
  )
}

const GUARANTEES = [
  {
    icon: ClockIcon,
    iconColor: 'text-sage',
    title: 'Immediate Care',
    desc: 'Start this week — zero clinic queues.',
  },
  {
    icon: OverlapIcon,
    iconColor: 'text-gold',
    title: 'Exact Alignment',
    desc: 'Matched across 27 clinical specialties.',
  },
  {
    icon: ShieldLockIcon,
    iconColor: 'text-sage',
    title: 'Private Sanctuary',
    desc: 'Weekly 1-on-1 Video session + unlimited chat.',
  },
]

export default function Hero1() {
  const reduceMotion = useReducedMotion()

  const settle = (delay) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] },
        }

  const ambientDrift = reduceMotion
    ? {}
    : {
        animate: { y: [0, -6, 0] },
        transition: { duration: 7, repeat: Infinity, ease: 'easeInOut' },
      }

  return (
    <section
      data-surface="dark"
      aria-labelledby="hero-heading"
      className="relative isolate overflow-hidden bg-ink-deep text-paper"
    >
      {/* Ambient Radial Lighting Drift (§24.9) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-1/4 -z-10 h-[38rem] w-[38rem] rounded-full bg-sage/10 blur-[140px] motion-safe:animate-drift"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-1/3 -z-10 h-[42rem] w-[42rem] rounded-full bg-gold/10 blur-[150px]"
      />

      <div className="mx-auto grid w-full max-w-7xl items-center gap-x-12 gap-y-12 px-5 py-10 sm:px-8 lg:min-h-[calc(100svh-72px)] lg:grid-cols-12 lg:py-12">
        
        {/* =========================================================
            LEFT COLUMN (7 Cols): Authoritative Copy & Visual Pillars
           ========================================================= */}
        <div className="lg:col-span-7 space-y-6 z-10">
          
          {/* Main Fraunces Display Headline */}
          <motion.div {...settle(0)}>
            <Heading
              level={1}
              size="hero"
              tone="inverse"
              id="hero-heading"
              className="max-w-[15ch] leading-[1.04] tracking-tight"
            >
              You don’t have to carry your mind alone.
            </Heading>
          </motion.div>

          {/* Lede Thesis */}
          <motion.div {...settle(0.1)}>
            <p className="max-w-[28ch] font-display text-section text-paper/90 leading-snug">
              Tell us what is overwhelming you. We immediately match you with verified specialists who understand.
            </p>
          </motion.div>

          {/* Body Narrative */}
          <motion.div {...settle(0.15)}>
            <Text tone="inverse" className="max-w-measure opacity-80 leading-relaxed">
              No waiting lists and no automated advice. Direct 1-on-1 therapy with master-level clinicians, conducted privately from the quiet comfort of your own home.
            </Text>
          </motion.div>

          {/* Primary Action Button + Secondary Link */}
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

          {/* VISUAL ELEMENT: 3-Card Interactive Guarantee Strip */}
          <motion.div
            {...settle(0.25)}
            className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-paper/10"
          >
            {GUARANTEES.map((item) => {
              const IconComp = item.icon
              return (
                <div
                  key={item.title}
                  className="group p-3.5 rounded-2xl bg-paper/5 border border-paper/10 backdrop-blur-sm transition-all duration-200 hover:bg-paper/10 hover:border-gold/30 hover:scale-[1.02]"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <IconComp className={`h-5 w-5 shrink-0 ${item.iconColor} transition-transform group-hover:scale-110`} />
                    <h4 className="text-xs font-bold text-paper leading-tight">{item.title}</h4>
                  </div>
                  <p className="text-[11px] text-paper/65 leading-tight">{item.desc}</p>
                </div>
              )
            })}
          </motion.div>

        </div>

        {/* =========================================================
            RIGHT COLUMN (5 Cols): Seamless Borderless Video Canvas
           ========================================================= */}
        <motion.div
          {...ambientDrift}
          className="lg:col-span-5 relative w-full max-w-[440px] lg:max-w-[480px] mx-auto select-none"
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
              className="h-full w-full object-cover [mask-image:radial-gradient(ellipse_at_center,black_55%,transparent_100%)] [-webkit-mask-image:radial-gradient(ellipse_at_center,black_55%,transparent_100%)]"
            />
          </div>
        </motion.div>

      </div>
    </section>
  )
}