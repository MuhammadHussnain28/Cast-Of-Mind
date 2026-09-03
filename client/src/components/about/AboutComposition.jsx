import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import room from '../../assets/about-room.jpg'
import hands from '../../assets/about-hands.jpg'
import fern from '../../assets/about-fern.jpg'

/**
 * Three photographs at three depths: a room with light coming in, hands round a
 * cup, fern against a sunlit wall.
 *
 * Layout is percentage-based inside a fixed 4:5 box, so the whole composition
 * scales as one thing rather than needing per-breakpoint positions.
 *
 * Drift is proportional to depth — the front layer travels furthest, the back
 * layer barely moves. That is what makes it read as space rather than as three
 * images sliding.
 */

const LAYERS = [
  {
    key: 'fern',
    src: fern,
    // Furthest back, so it moves least.
    drift: [8, -8],
    className: 'left-[2%] top-[4%] z-0 w-[42%]',
    ratio: 'aspect-square',
    // No edge treatment: it sits behind everything and needs no separation.
    edge: '',
    width: 600,
    height: 600,
  },
  {
    key: 'room',
    src: room,
    drift: [16, -16],
    className: 'right-0 top-0 z-10 w-[72%]',
    ratio: 'aspect-2/3',
    edge: '',
    width: 1000,
    height: 1500,
  },
  {
    key: 'hands',
    src: hands,
    drift: [24, -24],
    // A light ring rather than a shadow: this sits in front of another
    // photograph on a near-black ground, where a shadow would be invisible.
    // One elevation cue per element, never both.
    className: 'bottom-0 left-[14%] z-20 w-[46%]',
    ratio: 'aspect-square',
    edge: 'ring-1 ring-paper/12',
    width: 700,
    height: 700,
  },
]

export default function AboutComposition() {
  const reduceMotion = useReducedMotion()
  const ref = useRef(null)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  // Hooks cannot be called in a loop, so each layer's transform is declared up
  // front and matched to LAYERS by index.
  const driftFern = useTransform(scrollYProgress, [0, 1], LAYERS[0].drift)
  const driftRoom = useTransform(scrollYProgress, [0, 1], LAYERS[1].drift)
  const driftHands = useTransform(scrollYProgress, [0, 1], LAYERS[2].drift)
  const drifts = [driftFern, driftRoom, driftHands]

  const settle = (delay) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.3 },
          transition: { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] },
        }

  return (
    <div ref={ref} className="relative mx-auto aspect-4/5 w-full max-w-[26rem] lg:max-w-none">
      {/* Ambient wash behind the whole group. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[8%] -z-10 rounded-full bg-sage/12 blur-[90px] motion-safe:animate-drift"
      />

      {LAYERS.map((layer, index) => (
        <motion.div
          key={layer.key}
          {...settle(index * 0.1)}
          style={reduceMotion ? undefined : { y: drifts[index] }}
          className={`absolute overflow-hidden rounded-2xl ${layer.className} ${layer.ratio} ${layer.edge}`}
        >
          <img
            src={layer.src}
            alt=""
            aria-hidden="true"
            width={layer.width}
            height={layer.height}
            loading={layer.key === 'room' ? 'eager' : 'lazy'}
            decoding="async"
            className="h-full w-full object-cover"
          />
          {/* §24.9: photographs on this site sit under an ink wash. */}
          <div aria-hidden="true" className="absolute inset-0 bg-ink-deep/12" />
        </motion.div>
      ))}
    </div>
  )
}
