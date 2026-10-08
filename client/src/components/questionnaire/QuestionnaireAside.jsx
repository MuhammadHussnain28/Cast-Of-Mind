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

      {/* <div className="relative flex h-full flex-col gap-10 px-6 py-10 sm:px-8 lg:sticky lg:top-[72px] lg:gap-12 lg:px-10 lg:py-14"> */}


      <div className="relative flex h-full flex-col gap-10 px-6 pt-10 pb-6 sm:px-8 lg:sticky lg:top-[72px] lg:gap-12 lg:px-10 lg:pt-14 lg:pb-6">

        <QuestionnaireProgress tone="inverse" current={current} total={total} label={label} />

        <div className="hidden lg:block">
          <AnswerEcho items={echo} />
        </div>

        {/* <p className="mt-auto max-w-[34ch] font-body text-caption text-paper/70">
          {asideCopy.noCharge}
        </p> */}


        <div className="mt-auto flex items-center gap-3.5 rounded-xl border border-paper/10 bg-paper/[0.04] p-3.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <p className="font-body text-caption font-medium leading-snug text-paper/85">
            {asideCopy.noCharge}
          </p>
        </div> 

      </div>
    </aside>
  )
}
