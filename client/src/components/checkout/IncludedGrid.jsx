import { Sessions, Chat, Worksheets, Journal } from './CheckoutIcons'
import { included, checkout } from '../../data/checkoutContent'

// Built here rather than exported from the icon file — a non-component export
// there breaks fast refresh for the whole module.
const ICONS = { sessions: Sessions, chat: Chat, worksheets: Worksheets, journal: Journal }

/**
 * What the subscription buys.
 *
 * Drawn marks with a line of plain description each, threaded on one hairline
 * rail — not four identical cards, which is the category default and turns four
 * different things into four rectangles.
 *
 * On the dark aside the rail is `paper/15` and the icons `sage`, which reads at
 * 5.78:1 on ink-deep.
 */
export default function IncludedGrid() {
  return (
    <section aria-labelledby="included-heading">
      <h2 id="included-heading" className="font-body text-caption text-paper/70">
        {checkout.includedHeading}
      </h2>

      <ul className="mt-4 space-y-4 border-l border-paper/15 pl-5">
        {included.map((item) => {
          const Mark = ICONS[item.icon]
          return (
            <li key={item.icon} className="relative">
              {/* The mark sits ON the rail, so the list reads as one thread
                  rather than four detached rows. */}
              <span
                aria-hidden="true"
                className="absolute -left-[30px] top-0 flex h-5 w-5 items-center justify-center rounded-full bg-ink-deep"
              >
                <Mark className="h-[18px] w-[18px] text-sage" />
              </span>

              <p className="font-body text-ui font-medium text-paper">{item.title}</p>
              <p className="mt-1 max-w-[38ch] font-body text-caption leading-relaxed text-paper/70">
                {item.detail}
              </p>
            </li>
          )
        })}
      </ul>

      <p className="mt-5 max-w-[38ch] font-body text-caption leading-relaxed text-paper/70">
        {checkout.noCarryOver}
      </p>
    </section>
  )
}
