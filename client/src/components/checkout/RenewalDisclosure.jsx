import BillingRhythm from './BillingRhythm'
import { renewal } from '../../data/checkoutContent'

/**
 * The auto-renewal disclosure — §13's most important transparency point, and
 * the one thing on this page that must be impossible to miss.
 *
 * IT IS DARK ON A LIGHT PAGE, AND THAT IS THE WHOLE MECHANISM. Prominence comes
 * from contrast inversion, not from an alarm colour: clay or amber would signal
 * that something is wrong, and nothing is. Ink also makes gold legible (11.08:1)
 * so the accent can carry the rhythm marks, which it cannot do on paper.
 *
 * The sentence is quoted VERBATIM from §13 and set at body size, never caption.
 * It is a commitment to the person paying — not copy to tighten.
 */
export default function RenewalDisclosure() {
  return (
    <section
      aria-labelledby="renewal-heading"
      className="relative overflow-hidden rounded-2xl bg-ink px-6 py-6 sm:px-7"
    >
      {/* Ambient warmth so the panel reads as a considered surface rather than
          a black box dropped on the page. Decorative and motionless. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold/10 blur-[90px]"
      />

      <div className="relative">
        <h2
          id="renewal-heading"
          className="font-body text-ui font-medium tracking-tight text-paper"
        >
          {renewal.heading}
        </h2>

        <p className="mt-3 max-w-measure font-body text-body leading-relaxed text-paper">
          {renewal.sentence}
        </p>

        <BillingRhythm todayLabel={renewal.todayLabel} caption={renewal.cadenceCaption} />

        <p className="mt-5 border-t border-paper/15 pt-4 font-body text-caption text-paper/80">
          {renewal.cancelNote}
        </p>
      </div>
    </section>
  )
}
