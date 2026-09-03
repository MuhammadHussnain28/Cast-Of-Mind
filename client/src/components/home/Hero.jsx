import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button, Heading, Text } from '../ui'
import heroCorner from '../../assets/home-hero-corner.jpg'
import heroCorner800 from '../../assets/home-hero-corner-800.jpg'
import img1 from "../../assets/imgForHero.jfif"
import img2 from "../../assets/img2.jpg"
import img3 from "../../assets/img3.jpg"
import img3rbg from "../../assets/img3-bgremoved.png"
import img4 from "../../assets/peace.jpg"

/**
 * The first viewport: words on the left, one photograph on the right.
 *
 * Changed from a full-bleed background photograph at the developer's request,
 * 2026-08-29. The direction contract in pages/Home.jsx was updated to match -
 * a contract describing a composition the page no longer has is worse than no
 * contract, because the next reader trusts it.
 *
 * WHAT THE PHOTOGRAPH IS DOING. A quiet corner - an armchair by a window, a
 * plant, afternoon light - rather than the hands-cradling-a-seedling shot that
 * every therapy and wellness site already uses. It carries human warmth without
 * a face, which matters twice over here: master spec §24.5 rules out stock
 * photography of smiling people, and a room the visitor can imagine sitting in
 * asks less of them than a stranger's expression does.
 *
 * It also happens to be built from the palette. The cushion is close to `gold`,
 * the plant to `sage`, the chair and shelving to `ink`. That is why this frame
 * was chosen over warmer and greener candidates that would have needed a heavy
 * wash to belong here.
 *
 * CONTRAST IS NO LONGER THE PHOTOGRAPH'S PROBLEM. When the image was the
 * background, every word sat on top of it and a two-layer scrim was doing real
 * accessibility work. Now the text sits on flat ink-deep and measures 19.7:1,
 * so the scrim is gone. The 12% wash that remains on the image is not for
 * contrast - it is the OWN-WORLD rule that photographs on this page sit under
 * an ink wash, which keeps a foreign colour cast from landing beside the brand.
 */
export default function Hero() {
  const reduceMotion = useReducedMotion()

  // Content settles once on load. Not a per-element cascade — three steps,
  // 100ms apart, inside §24.4's 600-800ms reveal band.
  const settle = (delay) =>
    reduceMotion
      ? {} :
      // : {
      //     initial: { opacity: 0, y: 16 },
      //     animate: { opacity: 1, y: 0 },
      //     transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
      //   }

      {
        initial: { opacity: 0, y: 24 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] },
      }

  // The page's one ambient motion: the photograph drifts, roughly the pace of a
  // slow breath. 9s is far past §24.4's 4s floor because at this size a faster
  // cycle stops reading as drift and starts reading as a bob.
  //
  // Framer Motion rather than the CSS keyframe used before, per the request.
  // useReducedMotion() means the animate prop is never mounted at all when the
  // visitor has asked for less motion — the image simply sits still, rather
  // than animating to a halt.
  const drift = reduceMotion
    ? {}
    : {
        animate: { y: [0, -14, 0] },
        transition: { duration: 9, repeat: Infinity, ease: 'easeInOut' },
      }

  return (
    <section
      data-surface="dark"
      aria-labelledby="hero-heading"
      className="bg-ink-deep"
    >
      
      <div className="mx-auto grid w-full max-w-7xl items-center gap-x-12 gap-y-10 px-5 py-10 sm:px-8 lg:min-h-[calc(100svh-72px)] lg:grid-cols-12 lg:py-12">


        <div className=" lg:col-span-6">
          <motion.div {...settle(0)}>
            <Heading
              level={1}
              size="hero"
              tone="inverse"
              id="hero-heading"
              className="max-w-[16ch]"
            >
              Somewhere to begin.
            </Heading>
          </motion.div>

          <motion.div {...settle(0.1)}>
            <Text tone="inverse" className="mt-7 max-w-measure opacity-85">
              Tell us what you are going through. We will show you therapists who
              specialise in exactly that, and you choose who you talk to.
            </Text>
          </motion.div>

          <motion.div
            {...settle(0.2)}
            className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4"
          >
            <Button as={Link} to="/questionnaire" size="lg">
              Get started
            </Button>

            {/* For the visitor who is not ready to act yet. The whole reason
                /how-it-works exists is that the blocker here is usually "I don't
                know what will happen to me", not "why should I pick you". */}
            <Link
              to="/how-it-works"
              className="inline-flex min-h-11 items-center text-ui text-paper/85 underline decoration-paper/40 underline-offset-4 transition-colors duration-200 ease-out hover:text-paper hover:decoration-paper"
            >
              Or read what happens first
            </Link>
          </motion.div>
        </div>

        {/* Taller than it is wide on desktop, where it stands beside the text;
            wider than it is tall on smaller screens, where it stacks beneath and
            a portrait frame would push the whole page down. */}
        <motion.div
          {...drift}

          className="relative aspect-square overflow-hidden rounded-2xl max-w-[460px] mx-auto lg:col-span-6 lg:aspect-square"

        >
          {/* Decorative: carries mood, no information. Empty alt per §24.5.
              srcset so a phone fetches 96 kB rather than 349 kB for a frame it
              renders at a third of the width. */}
          <img
            src={img4}
            alt=""
            aria-hidden="true"
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-ink-deep/12" />
        </motion.div>

      </div>
    </section>
  )
}
