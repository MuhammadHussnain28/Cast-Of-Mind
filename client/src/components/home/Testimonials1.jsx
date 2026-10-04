import { useState, useRef, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Heading, Text } from '../ui'
import portrait1 from '../../assets/testimonial-portrait-1.jpg'
import portrait2 from '../../assets/testimonial-portrait-2.jpg'
import portrait3 from '../../assets/testimonial-portrait-3.jpg'
import portrait4 from '../../assets/testimonial-portrait-4.jpg'
import portrait5 from '../../assets/testimonial-portrait-5.jpg'
import portrait6 from '../../assets/testimonial-portrait-6.jpg'
import portrait7 from '../../assets/testimonial-portrait-7.jpg'
import portrait8 from '../../assets/testimonial-portrait-8.jpg'

/**
 * Testimonials1 — Redesigned Testimonials Section for Cast of Minds.
 *
 * Key Design Features:
 * 1. Talkspace-style card hierarchy: Top portrait photograph with tag chip overlay,
 *    authentic human quote body, and bottom pill badge with member name.
 * 2. Strict Alternating Rhythm: Cards strictly alternate between Dark Ink (#19122B)
 *    and Pure White Paper (#FFFFFF) for clean brand discipline and high contrast.
 * 3. 27 Official Concerns: Every card tag is strictly drawn from the confirmed
 *    27 concerns (Sleep Issues or Insomnia, Grief, Relationship Issues, Anger Management,
 *    Panic Attacks, ADHD & Attention Issues, Social Anxiety, Career Counselling).
 * 4. Human-first copy: Non-uniform review lengths ranging from punchy 2-sentence breakthroughs
 *    to grounded 4-sentence scenarios, without generic AI marketing fluff.
 * 5. Smooth continuous marquee: Infinite auto-scroll with pause-on-hover, pause/play
 *    toggle, and manual Prev/Next buttons. Accessible with reduced-motion support.
 */

const TESTIMONIAL_ITEMS = [
  {
    id: 't1',
    name: 'Sara',
    tag: 'Sleep Issues or Insomnia',
    quote:
      'I used to lie awake rerunning the exact same conversation until three in the morning, then write the whole next day off before it even started. My therapist gave me something concrete to do with that loop instead of just riding it out, and I have slept through most nights since February.',
    portrait: portrait1,
    alt: 'Sara seated indoors in warm evening light',
  },
  {
    id: 't2',
    name: 'Peter',
    tag: 'Grief',
    quote:
      'After my wife passed, having a set space each week where that was the whole point meant I finally stopped carrying it like a secret into every other conversation.',
    portrait: portrait2,
    alt: 'Peter standing near a window looking out in thought',
  },
  {
    id: 't3',
    name: 'Marta & Joris',
    tag: 'Relationship Issues',
    quote:
      'We had the same argument roughly once a fortnight for two years, and afterwards neither of us could explain what it was actually about. Doing this together meant somebody finally named the pattern out loud, and we have managed to catch it mid-sentence three times now before it spiralled.',
    portrait: portrait3,
    alt: 'Marta and Joris in natural indoor light',
  },
  {
    id: 't4',
    name: 'Tom',
    tag: 'Anger Management',
    quote:
      'I was snapping at my kids over cold toast and feeling wretched for hours. The chat between sessions helped me write down what was happening in the moment, instead of trying to reconstruct it days later.',
    portrait: portrait4,
    alt: 'Tom seated looking out a sunlit window',
  },
  {
    id: 't5',
    name: 'David',
    tag: 'Panic Attacks',
    quote:
      'I had to pull over on the motorway twice in October with my chest heaving. We worked through the bodily symptoms step-by-step. Last week I drove through rush hour alone.',
    portrait: portrait5,
    alt: 'David in calm natural daylight',
  },
  {
    id: 't6',
    name: 'Maya',
    tag: 'ADHD & Attention Issues',
    quote:
      'I spent my twenties thinking I was fundamentally lazy because I could not finish a task without six browser tabs open. Having someone break down executive dysfunction without lecturing me or giving me useless generic planners made a massive difference to my workday.',
    portrait: portrait6,
    alt: 'Maya working at a wooden table',
  },
  {
    id: 't7',
    name: 'Liam',
    tag: 'Social Anxiety',
    quote:
      'I nearly closed the tab three times before our first video call because my hands were shaking. My therapist did not rush or act like it was silly. That calm gave me room to breathe.',
    portrait: portrait7,
    alt: 'Liam outdoors in soft overcast light',
  },
  {
    id: 't8',
    name: 'Amina',
    tag: 'Career Counselling',
    quote:
      'I kept working until 9 PM every night because saying "no" to clients felt like admitting defeat. My therapist helped me build simple scripts to push back on unrealistic deadlines. I actually took my first real weekend off in eight months.',
    portrait: portrait8,
    alt: 'Amina smiling warmly in a bright room',
  },
]

function TestimonialCard({ item, index }) {
  // Strict alternating pattern: even indices are Dark Ink, odd indices are White Paper
  const isDark = index % 2 === 0

  return (
    <figure
      className={`group relative flex w-[300px] shrink-0 flex-col justify-between overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:w-[340px] ${
        isDark
          ? 'border-ink/20 bg-ink text-paper shadow-[0_8px_30px_rgba(25,18,43,0.12)]'
          : 'border-ink/10 bg-paper text-ink shadow-[0_8px_30px_rgba(25,18,43,0.05)]'
      }`}
    >
      {/* Top Portrait Image with Talkspace Tag Overlay */}
      <div className="relative h-44 w-full overflow-hidden sm:h-48">
        <img
          src={item.portrait}
          alt={item.alt}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
        <div
          className={`absolute inset-0 bg-gradient-to-t ${
            isDark
              ? 'from-ink via-ink/20 to-transparent'
              : 'from-black/40 via-transparent to-transparent'
          }`}
          aria-hidden="true"
        />

        {/* Concern Chip (from the 27 official concerns) */}
        <span
          className={`absolute top-3 left-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium backdrop-blur-md shadow-sm ${
            isDark
              ? 'border border-white/20 bg-ink/70 text-white'
              : 'border border-white/40 bg-white/85 text-ink'
          }`}
        >
          {item.tag}
        </span>
      </div>

      {/* Middle Quote Content */}
      <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
        <blockquote className="mb-6">
          <p
            className={`font-body text-ui sm:text-[1.0625rem] leading-relaxed italic ${
              isDark ? 'text-paper/95' : 'text-ink-deep'
            }`}
          >
            "{item.quote}"
          </p>
        </blockquote>

        {/* Bottom Attribution: Name on right, in italic, borderless, without duration */}
        <figcaption className="flex justify-end pt-2">
          <span
            className={`font-body text-sm sm:text-base italic tracking-wide ${
              isDark ? 'text-paper/90' : 'text-ink-deep'
            }`}
          >
            — {item.name}
          </span>
        </figcaption>
      </div>
    </figure>
  )
}

export default function Testimonials1() {
  const reduceMotion = useReducedMotion()
  const scrollRef = useRef(null)
  const [isPaused, setIsPaused] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Duplicated list creates a seamless infinite looping track
  const duplicatedItems = [...TESTIMONIAL_ITEMS, ...TESTIMONIAL_ITEMS]

  // Continuous auto-scroll loop (pauses on hover, manual pause, or user reduced motion)
  useEffect(() => {
    if (reduceMotion || isPaused || isHovered) return

    const container = scrollRef.current
    if (!container) return

    const scrollSpeed = 0.75 // smooth pixels per frame
    let animationFrameId

    const step = () => {
      if (container) {
        // If scrolled halfway through the duplicated content, wrap back seamlessly
        const halfScroll = container.scrollWidth / 2
        if (container.scrollLeft >= halfScroll) {
          container.scrollLeft -= halfScroll
        } else {
          container.scrollLeft += scrollSpeed
        }
      }
      animationFrameId = requestAnimationFrame(step)
    }

    animationFrameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animationFrameId)
  }, [reduceMotion, isPaused, isHovered])

  // Manual arrow navigation
  const handleScroll = (direction) => {
    if (!scrollRef.current) return
    const cardStep = 360
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -cardStep : cardStep,
      behavior: 'smooth',
    })
  }

  const headingMotion = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.4 },
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
      }

  return (
    <section
      aria-labelledby="testimonials-heading"
      data-surface="light"
      className="relative overflow-hidden bg-paper py-20 sm:py-24 lg:py-28"
    >

      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        {/* Header and Controls Header Bar */}
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <motion.div {...headingMotion} className="max-w-2xl">
            <Heading level={2} id="testimonials-heading" className="max-w-[18ch]">
              What people say afterwards.
            </Heading>
            <Text tone="muted" className="mt-7 max-w-measure">
              Change in therapy is usually small and specific , sleeping through a
              night, catching an argument before it starts. Those are the parts
              worth repeating.
            </Text>
          </motion.div>

          {/* Navigation & Playback Controls */}
          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              aria-label="Previous testimonial"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 bg-paper text-ink transition-all hover:bg-mist active:scale-95 shadow-sm"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => handleScroll('right')}
              aria-label="Next testimonial"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 bg-paper text-ink transition-all hover:bg-mist active:scale-95 shadow-sm"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => setIsPaused((prev) => !prev)}
              aria-label={isPaused ? 'Resume auto-scroll' : 'Pause auto-scroll'}
              aria-pressed={isPaused}
              className="flex items-center gap-1.5 rounded-full border border-ink/15 bg-paper px-3.5 py-2.5 text-xs font-medium text-ink transition-all hover:bg-mist active:scale-95 shadow-sm"
            >
              <span aria-hidden="true">{isPaused ? '▶' : '⏸'}</span>
              <span>{isPaused ? 'Play' : 'Pause'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Marquee Track Container */}
      <div
        className="relative mt-12 sm:mt-16 w-full overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          ref={scrollRef}
          className="flex w-full gap-5 overflow-x-auto px-5 sm:px-8 pb-4 pt-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {duplicatedItems.map((item, index) => (
            <TestimonialCard
              key={`${item.id}-${index}`}
              item={item}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
