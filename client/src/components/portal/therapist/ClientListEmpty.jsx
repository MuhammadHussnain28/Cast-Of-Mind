import { LeafIcon } from './TherapistPortalIcons'
import { CLIENTS_EMPTY } from '../../../data/therapistPortalContent'

/**
 * No clients yet — master spec §8.1.
 *
 * ONE SENTENCE. DO NOT ADD TO THIS.
 *
 * §8.1 is unusually specific about what must NOT be here: profile completion
 * prompts, "boost your visibility" tips, and specialty tag suggestions were all
 * proposed and explicitly rejected by the client. The reasoning is recorded in
 * §22 — a therapist reaching this screen has already submitted a 33-field
 * application and been approved by the admin, so a prompt to "complete" or
 * "improve" anything creates false uncertainty about a profile that is finished
 * and verified. There is nothing for them to do here, and saying otherwise
 * would be a small lie with a real cost.
 *
 * §24.8 still applies — designed, never blank. So it gets the portal's own
 * ambient wash and a drawn mark, and stops there. Restraint here is the brief,
 * not a shortage of effort.
 */
export default function ClientListEmpty() {
  return (
    <div className="relative px-5 py-10 text-center">
      {/* The house wash, as on the client rail, the chat opening screen and the
          marketing asides — one atmosphere across the whole product. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-2 size-48 -translate-x-1/2 rounded-full bg-sage/10 blur-[130px]"
      />

      <span
        aria-hidden="true"
        className="relative inline-flex size-12 items-center justify-center rounded-full bg-sage/20 text-sage"
      >
        <LeafIcon size={24} />
      </span>

      <p className="relative mt-5 font-body text-ui font-medium text-paper">
        {CLIENTS_EMPTY.title}
      </p>
      <p className="relative mt-1.5 font-body text-caption leading-relaxed text-paper/70">
        {CLIENTS_EMPTY.body}
      </p>
    </div>
  )
}
