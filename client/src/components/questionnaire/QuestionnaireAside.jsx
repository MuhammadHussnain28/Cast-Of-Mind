import { Link } from 'react-router-dom'
import logoWhite from '../../assets/cast-of-mind-logo-singular-white.png'
import QuestionnaireProgress from './QuestionnaireProgress'
import AnswerEcho from './AnswerEcho'
import { asideCopy } from '../../data/questionnaireContent'

/**
 * The standing panel: where you are, what you have said, and what it costs.
 *
 * Dark ink-deep with a soft sage wash — the same split-screen frame /contact
 * and /join-as-therapist use, so the three form surfaces read as one product.
 * The wash is a radial glow, never a vertical band gradient.
 *
 * On the dark ground the progress fill flips to plain `sage` (5.78:1 here),
 * where the light shell needs `sage-deep`. Same bar, different ground.
 */
export default function QuestionnaireAside({ current, total, label, echo }) {
  return (
    <aside className="relative overflow-hidden bg-ink-deep lg:min-h-[calc(100dvh-72px)]">
      {/* Ambient wash. Decorative, and it never moves anything under the reader. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-1/4 h-[420px] w-[420px] rounded-full bg-sage/10 blur-[130px] motion-safe:animate-drift"
      />

      <div className="relative flex h-full flex-col gap-10 px-6 py-10 sm:px-8 lg:sticky lg:top-[72px] lg:gap-12 lg:px-10 lg:py-14">
        <Link to="/" className="inline-flex w-fit rounded-sm">
          <img src={logoWhite} alt="Cast of Mind" className="h-10 w-auto" />
        </Link>

        <QuestionnaireProgress tone="inverse" current={current} total={total} label={label} />

        <div className="hidden lg:block">
          <AnswerEcho items={echo} />
        </div>

        <p className="mt-auto max-w-[34ch] font-body text-caption text-paper/70">
          {asideCopy.noCharge}
        </p>
      </div>
    </aside>
  )
}
