import { NotificationsIcon } from '../../../components/portal/therapist/TherapistPortalIcons'
import { NOTIFICATIONS_PENDING } from '../../../data/therapistPortalContent'

/**
 * Notifications — master spec §8.8.
 *
 * CHUNK 10.4 BUILDS THE FEED. The nav entry ships now so the inbox has the
 * shape §8 describes, and this screen says plainly that it is not live rather
 * than leaving a therapist waiting for alerts that will never arrive.
 *
 * The three lines below are §8.8's own triggers, stated as facts about the
 * finished feature — not a description of software that does not exist, and
 * with no timeline attached, as everywhere else on this platform.
 *
 * It also points at what IS live: the unread counts beside each client work
 * today, pushed over the socket by 7.6. That is the difference between "this is
 * broken" and "this part is not switched on yet".
 */
export default function Notifications() {
  return (
    <div className="flex w-full max-w-4xl flex-1 flex-col">
      <header>
        <h1 className="font-body text-subsection font-medium text-ink">
          {NOTIFICATIONS_PENDING.title}
        </h1>
        <p className="mt-3 max-w-measure font-body text-ui leading-relaxed text-ink/70">
          {NOTIFICATIONS_PENDING.lead}
        </p>
      </header>

      <section className="relative mt-8 overflow-hidden rounded-2xl bg-paper px-5 py-6 shadow-[0_18px_50px_-28px_rgba(25,18,43,0.35)] sm:px-7 sm:py-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-16 -top-16 size-56 rounded-full bg-sage/10 blur-[130px]"
        />

        <span
          aria-hidden="true"
          className="relative inline-flex size-10 items-center justify-center rounded-full bg-sage/15 text-sage-deep"
        >
          <NotificationsIcon size={20} />
        </span>

        <h2 className="relative mt-4 font-body text-ui font-medium text-ink">
          What will land here
        </h2>

        {/* Threaded on one hairline rather than set as three same-size cards —
            these are three parts of one explanation, and identical rectangles
            would turn them into a menu of unrelated things. */}
        <ul className="relative mt-4 space-y-4 border-l border-sage/40 pl-6">
          {NOTIFICATIONS_PENDING.truths.map((item) => (
            <li key={item} className="relative">
              <span
                aria-hidden="true"
                className="absolute -left-[1.6875rem] top-[0.5625rem] size-2 rounded-full bg-sage-deep ring-4 ring-paper"
              />
              <span className="block max-w-measure font-body text-ui leading-relaxed text-ink/70">
                {item}
              </span>
            </li>
          ))}
        </ul>

        <p className="relative mt-6 border-t border-ink/12 pt-4 font-body text-caption text-ink/70">
          {NOTIFICATIONS_PENDING.note}
        </p>
      </section>
    </div>
  )
}
