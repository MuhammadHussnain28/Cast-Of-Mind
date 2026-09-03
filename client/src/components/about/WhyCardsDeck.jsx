import { useState, useRef } from 'react'
import { motion, useScroll, useMotionValueEvent, useReducedMotion } from 'framer-motion'
import { Heading, Text } from '../ui'

const REASONS = [
  {
    id: 'wait',
    num: '01',
    category: 'TIME',
    title: 'No Waiting Lists.',
    body: 'Start speaking to your therapist this week—not after 4 months on a clinic waiting list.',
    tag: 'Immediate Care',
    bg: 'bg-paper',
    border: 'border-white/40',
  },
  {
    id: 'journey',
    num: '02',
    category: 'ACCESS',
    title: 'No Commute.',
    body: 'Weekly 1-on-1 Zoom sessions and unlimited private chat from the quiet comfort of your home.',
    tag: 'Home Sanctuary',
    bg: 'bg-mist',
    border: 'border-white/30',
  },
  {
    id: 'mismatch',
    num: '03',
    category: 'FIT',
    title: 'No Guesswork.',
    body: 'Matched strictly by your specific concerns, and you choose the therapist you talk to.',
    tag: 'True Alignment',
    bg: 'bg-paper',
    border: 'border-white/40',
  },
]

export default function WhyCardsDeck({ scrollTargetRef }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isManualOverride, setIsManualOverride] = useState(false)
  const reduceMotion = useReducedMotion()

  // 1. DESKTOP SCROLL-DRIVEN ROTATION
  // Tracks scroll progress through the parent section
  const { scrollYProgress } = useScroll({
    target: scrollTargetRef,
    offset: ['start start', 'end end'],
  })

  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
    // Only update from scroll if the user is scrolling naturally
    if (isManualOverride) return

    if (progress < 0.35) {
      setActiveIndex(0)
    } else if (progress >= 0.35 && progress < 0.7) {
      setActiveIndex(1)
    } else if (progress >= 0.7) {
      setActiveIndex(2)
    }
  })

  // Manual click handler (allows button & card clicks anytime)
  const handleManualSelect = (index) => {
    setIsManualOverride(true)
    setActiveIndex(index)
    // Release manual override after 1.5s so scroll continues working
    setTimeout(() => setIsManualOverride(false), 1500)
  }

  const rotateNext = () => {
    handleManualSelect((activeIndex + 1) % 3)
  }

  // 2. MOBILE TOUCH SWIPE HANDLER (Framer Motion Drag)
  const handleDragEnd = (event, info) => {
    const swipeThreshold = 50
    if (info.offset.x < -swipeThreshold) {
      // Swiped Left -> Next Card
      setActiveIndex((prev) => (prev + 1) % 3)
    } else if (info.offset.x > swipeThreshold) {
      // Swiped Right -> Previous Card
      setActiveIndex((prev) => (prev - 1 + 3) % 3)
    }
  }

  // 3. 3D FANNED DECK STYLES
  const getCardStyle = (index) => {
    const diff = (index - activeIndex + 3) % 3

    if (reduceMotion) {
      return diff === 0
        ? { opacity: 1, zIndex: 30, transform: 'none' }
        : { opacity: 0, zIndex: 10, display: 'none' }
    }

    if (diff === 0) {
      // Active Front Center Card
      return {
        x: '-50%',
        y: '-50%',
        rotate: 0,
        scale: 1,
        zIndex: 30,
        opacity: 1,
        boxShadow:
          '0 25px 50px -12px rgba(13, 9, 22, 0.7), 0 0 0 1px rgba(245, 197, 24, 0.25)',
      }
    }

    if (diff === 1) {
      // Right Card (Fanned behind)
      return {
        x: '-30%',
        y: '-48%',
        rotate: 7,
        scale: 0.94,
        zIndex: 20,
        opacity: 0.85,
        boxShadow: '0 20px 40px -12px rgba(13, 9, 22, 0.5)',
      }
    }

    // Left Card (Fanned behind)
    return {
      x: '-70%',
      y: '-48%',
      rotate: -7,
      scale: 0.94,
      zIndex: 10,
      opacity: 0.85,
      boxShadow: '0 20px 40px -12px rgba(13, 9, 22, 0.5)',
    }
  }

  return (
    <div className="relative w-full max-w-lg mx-auto select-none">
      
      {/* Ambient Sage & Gold Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-8 -right-8 -z-10 h-72 w-72 rounded-full bg-sage/12 blur-[100px]"
      />

      {/* === DESKTOP FANNED VIEW (sm and up) === */}
      <div className="hidden sm:block">
        <div className="relative h-[430px] w-full [perspective:1200px]">
          {REASONS.map((card, index) => {
            const style = getCardStyle(index)
            const isActive = (index - activeIndex + 3) % 3 === 0

            return (
              <motion.div
                key={card.id}
                onClick={() => handleManualSelect(index)}
                animate={style}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className={`
                  absolute top-1/2 left-1/2 w-[285px] h-[375px] cursor-pointer
                  rounded-3xl p-7 flex flex-col justify-between border
                  ${card.bg} ${card.border} text-ink
                `}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-mono tracking-widest font-semibold text-sage-deep bg-sage/10 px-2.5 py-1 rounded-md">
                      {card.num} · {card.category}
                    </span>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isActive ? 'bg-gold animate-pulse' : 'bg-sage/40'
                      }`}
                    />
                  </div>

                  <Heading level={3} size="subsection" className="text-ink leading-tight font-bold">
                    {card.title}
                  </Heading>

                  <Text size="ui" className="mt-3 text-ink/75 leading-relaxed">
                    {card.body}
                  </Text>
                </div>

                <div className="pt-4 border-t border-ink/10 flex items-center justify-between text-xs font-medium text-sage-deep">
                  <span>{card.tag}</span>
                  <span className="text-gold font-bold">→</span>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Desktop Controls (Clicking dots & button still works!) */}
        <div className="flex items-center justify-between px-6 pt-2">
          <div className="flex items-center gap-2">
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                onClick={() => handleManualSelect(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === activeIndex ? 'w-6 bg-gold' : 'w-2 bg-paper/20 hover:bg-paper/40'
                }`}
                aria-label={`View card ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={rotateNext}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-paper/10 hover:bg-paper/20 text-paper text-xs font-medium border border-paper/15 transition-all active:scale-95"
          >
            <span>Next Reason</span>
            <span className="text-gold">→</span>
          </button>
        </div>
      </div>

      {/* === MOBILE TOUCH SWIPE VIEW (under sm) === */}
      <div className="sm:hidden px-2">
        <motion.div
          key={activeIndex}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className={`
            w-full min-h-[320px] rounded-3xl p-6 flex flex-col justify-between
            ${REASONS[activeIndex].bg} border border-white/40 text-ink shadow-2xl
            cursor-grab active:cursor-grabbing touch-pan-y
          `}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono tracking-widest font-semibold text-sage-deep bg-sage/10 px-2.5 py-1 rounded-md">
                {REASONS[activeIndex].num} · {REASONS[activeIndex].category}
              </span>
              <span className="text-[11px] text-ink/70 font-medium">
                Swipe ↔ ({activeIndex + 1}/3)
              </span>
            </div>

            <Heading level={3} size="subsection" className="text-ink">
              {REASONS[activeIndex].title}
            </Heading>

            <Text size="ui" className="mt-3 text-ink/75 leading-relaxed">
              {REASONS[activeIndex].body}
            </Text>
          </div>

          <div className="pt-4 mt-4 border-t border-ink/10 flex items-center justify-between text-xs font-medium text-sage-deep">
            <span>{REASONS[activeIndex].tag}</span>
            <span className="text-xs text-ink/70 font-medium">Swipe for next →</span>
          </div>
        </motion.div>

        {/* Mobile Pagination Dots */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex ? 'w-6 bg-gold' : 'w-2 bg-paper/30'
              }`}
            />
          ))}
        </div>
      </div>

    </div>
  )
}