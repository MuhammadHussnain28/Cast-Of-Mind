/**
 * The container both outcome pages share.
 *
 * A GROUNDED CARD, NOT FLOATING TEXT. A single decision has just been made —
 * paid, or stepped away — and a centred column of bare paragraphs on an empty
 * page reads as an error screen rather than a considered end to something.
 *
 * Elevation is declared ONCE: a real shadow with offset and blur, and no border
 * under it. A hairline beneath a soft shadow is the ghost card.
 *
 * One mark, one heading, one or two lines, the actions. Nothing else.
 */
export default function OutcomeCard({ mark, children }) {
  return (
    <div className="relative overflow-hidden bg-mist">
      {/* Ambient warmth behind the card. Decorative, motionless, and it never
          moves anything under the reader. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-sage/12 blur-[130px]"
      />

      <div className="relative mx-auto flex min-h-[calc(100dvh-72px)] max-w-[36rem] items-center px-5 py-12 sm:px-6 sm:py-16">
        <div className="w-full rounded-2xl bg-paper px-6 py-10 shadow-[0_18px_50px_-24px_rgba(25,18,43,0.35)] sm:px-10 sm:py-12">
          {/* The mark sits on its own tinted plate, so it reads as a considered
              element rather than an icon dropped above a heading. */}
          <span className="mb-7 flex h-16 w-16 items-center justify-center rounded-full bg-sage/12 text-sage-deep">
            {mark}
          </span>

          {children}
        </div>
      </div>
    </div>
  )
}
