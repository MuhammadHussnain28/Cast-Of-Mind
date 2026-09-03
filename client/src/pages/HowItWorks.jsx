import HowItWorksHero from '../components/how-it-works/HowItWorksHero'
import ProcessPhase from '../components/how-it-works/ProcessPhase'
import ClosingCta from '../components/how-it-works/ClosingCta'
import { phases } from '../data/howItWorksContent'

/**
 * The full seven steps, grouped into three phases (§24.7). The home page's
 * condensed four-step version is a separate component and stays that way.
 *
 * Grounds: ink-deep hero → paper → mist → paper → ink close. Tone changes
 * happen in text-free strips so each phase keeps one flat, measured ground.
 */

// Full class strings, never interpolated: Tailwind scans source text, so
// `from-${x}` is invisible to it and the utility is never generated.
const STRIPS = {
  'bg-paper→bg-mist': 'bg-linear-to-b from-paper to-mist',
  'bg-mist→bg-paper': 'bg-linear-to-b from-mist to-paper',
}

// Steps are numbered continuously across phases, so each phase needs to know
// where its own count starts. Derived up front rather than by mutating a
// counter during render.
const START_NUMBERS = phases.reduce(
  (acc, phase) => [...acc, acc[acc.length - 1] + phase.steps.length],
  [1],
)

export default function HowItWorks() {
  return (
    <>
      <HowItWorksHero />

      {/* GRADIENT */}
      {/* <div aria-hidden="true" className="h-12 bg-linear-to-b from-ink-deep to-paper" /> */}

      {phases.map((phase, index) => {
        const next = phases[index + 1]

        return (
          <div key={phase.id}>
            <ProcessPhase phase={phase} startNumber={START_NUMBERS[index]} />
            {next && (
              <div
                aria-hidden="true"
                className={`h-16 lg:h-20 ${STRIPS[`${phase.ground}→${next.ground}`]}`}
              />
            )}
          </div>
        )
      })}

      {/* GRADIENT */}
      {/* <div aria-hidden="true" className="h-20 bg-linear-to-b from-paper to-ink lg:h-28" /> */}
      {/* <div aria-hidden="true" className="h-12 bg-linear-to-b from-paper to-ink" /> */}

      <ClosingCta />
    </>
  )
}
