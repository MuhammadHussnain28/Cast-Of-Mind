// import { motion, useReducedMotion } from 'framer-motion'
// import { Link } from 'react-router-dom'
// import { Button, Heading, Text } from '../ui'
// import heroCorner from '../../assets/home-hero-corner.jpg'
// import heroCorner800 from '../../assets/home-hero-corner-800.jpg'
// import img1 from "../../assets/imgForHero.jfif"
// import img2 from "../../assets/img2.jpg"
// import img3 from "../../assets/img3.jpg"
// import img3rbg from "../../assets/img3-bgremoved.png"
// import img4 from "../../assets/peace.jpg"

// /**
//  * The first viewport: words on the left, one photograph on the right.
//  *
//  * Changed from a full-bleed background photograph at the developer's request,
//  * 2026-08-29. The direction contract in pages/Home.jsx was updated to match -
//  * a contract describing a composition the page no longer has is worse than no
//  * contract, because the next reader trusts it.
//  *
//  * WHAT THE PHOTOGRAPH IS DOING. A quiet corner - an armchair by a window, a
//  * plant, afternoon light - rather than the hands-cradling-a-seedling shot that
//  * every therapy and wellness site already uses. It carries human warmth without
//  * a face, which matters twice over here: master spec §24.5 rules out stock
//  * photography of smiling people, and a room the visitor can imagine sitting in
//  * asks less of them than a stranger's expression does.
//  *
//  * It also happens to be built from the palette. The cushion is close to `gold`,
//  * the plant to `sage`, the chair and shelving to `ink`. That is why this frame
//  * was chosen over warmer and greener candidates that would have needed a heavy
//  * wash to belong here.
//  *
//  * CONTRAST IS NO LONGER THE PHOTOGRAPH'S PROBLEM. When the image was the
//  * background, every word sat on top of it and a two-layer scrim was doing real
//  * accessibility work. Now the text sits on flat ink-deep and measures 19.7:1,
//  * so the scrim is gone. The 12% wash that remains on the image is not for
//  * contrast - it is the OWN-WORLD rule that photographs on this page sit under
//  * an ink wash, which keeps a foreign colour cast from landing beside the brand.
//  */
// export default function Hero() {
//   const reduceMotion = useReducedMotion()

//   // Content settles once on load. Not a per-element cascade — three steps,
//   // 100ms apart, inside §24.4's 600-800ms reveal band.
//   const settle = (delay) =>
//     reduceMotion
//       ? {} :
//       // : {
//       //     initial: { opacity: 0, y: 16 },
//       //     animate: { opacity: 1, y: 0 },
//       //     transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
//       //   }

//       {
//         initial: { opacity: 0, y: 24 },
//         animate: { opacity: 1, y: 0 },
//         transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] },
//       }

//   // The page's one ambient motion: the photograph drifts, roughly the pace of a
//   // slow breath. 9s is far past §24.4's 4s floor because at this size a faster
//   // cycle stops reading as drift and starts reading as a bob.
//   //
//   // Framer Motion rather than the CSS keyframe used before, per the request.
//   // useReducedMotion() means the animate prop is never mounted at all when the
//   // visitor has asked for less motion — the image simply sits still, rather
//   // than animating to a halt.
//   const drift = reduceMotion
//     ? {}
//     : {
//         animate: { y: [0, -14, 0] },
//         transition: { duration: 9, repeat: Infinity, ease: 'easeInOut' },
//       }

//   return (
//     <section
//       data-surface="dark"
//       aria-labelledby="hero-heading"
//       className="bg-ink-deep"
//     >
      
//       <div className="mx-auto grid w-full max-w-7xl items-center gap-x-12 gap-y-10 px-5 py-10 sm:px-8 lg:min-h-[calc(100svh-72px)] lg:grid-cols-12 lg:py-12">


//         <div className=" lg:col-span-6">
//           <motion.div {...settle(0)}>
//             <Heading
//               level={1}
//               size="hero"
//               tone="inverse"
//               id="hero-heading"
//               className="max-w-[16ch]"
//             >
//               Somewhere to begin.
//             </Heading>
//           </motion.div>

//           <motion.div {...settle(0.1)}>
//             <Text tone="inverse" className="mt-7 max-w-measure opacity-85">
//               Tell us what you are going through. We will show you therapists who
//               specialise in exactly that, and you choose who you talk to.
//             </Text>
//           </motion.div>

//           <motion.div
//             {...settle(0.2)}
//             className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4"
//           >
//             <Button as={Link} to="/questionnaire" size="lg">
//               Get started
//             </Button>

//             {/* For the visitor who is not ready to act yet. The whole reason
//                 /how-it-works exists is that the blocker here is usually "I don't
//                 know what will happen to me", not "why should I pick you". */}
//             <Link
//               to="/how-it-works"
//               className="inline-flex min-h-11 items-center text-ui text-paper/85 underline decoration-paper/40 underline-offset-4 transition-colors duration-200 ease-out hover:text-paper hover:decoration-paper"
//             >
//               Or read what happens first
//             </Link>
//           </motion.div>
//         </div>

//         {/* Taller than it is wide on desktop, where it stands beside the text;
//             wider than it is tall on smaller screens, where it stacks beneath and
//             a portrait frame would push the whole page down. */}
//         <motion.div
//           {...drift}

//           className="relative aspect-square overflow-hidden rounded-2xl max-w-[460px] mx-auto lg:col-span-6 lg:aspect-square"

//         >
//           {/* Decorative: carries mood, no information. Empty alt per §24.5.
//               srcset so a phone fetches 96 kB rather than 349 kB for a frame it
//               renders at a third of the width. */}
//           <img
//             src={img4}
//             alt=""
//             aria-hidden="true"
//             fetchPriority="high"
//             decoding="async"
//             className="h-full w-full object-cover"
//           />
//           <div aria-hidden="true" className="absolute inset-0 bg-ink-deep/12" />
//         </motion.div>

//       </div>
//     </section>
//   )
// }



// -------------------------------------------



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
