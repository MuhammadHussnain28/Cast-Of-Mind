import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import SkipLink from '../../components/layout/SkipLink'
import SignOutButton from '../../components/auth/SignOutButton'
import PortalSocketProvider from '../../components/portal/PortalSocketProvider'
import UnreadProvider from '../../components/portal/UnreadProvider'
import NotificationProvider from '../../components/portal/NotificationProvider'
import TherapistRail from '../../components/portal/therapist/TherapistRail'
import { BackIcon } from '../../components/portal/therapist/TherapistPortalIcons'
import { useTherapistClients } from '../../lib/therapist/useTherapistClients'
import { DraftContext } from '../../lib/chat/draftContext'
import { createDraftStore } from '../../lib/chat/draftStore'
import { CLIENTS_LIST } from '../../data/therapistPortalContent'
import { cx } from '../../lib/cx'
import logoInk from '../../assets/cast-of-mind-logo-ink.png'
import logoWhite from '../../assets/cast-of-mind-logo-white.png'

/**
 * The therapist portal — master spec §8, portal notes §24.8.
 *
 * THE INBOX PATTERN, WHICH IS THE WHOLE ARCHITECTURE. One persistent list of
 * clients on the left; selecting one loads that client's workspace on the
 * right. The same tabs will always exist (8.2) and only the data changes —
 * features are never duplicated per client. §8 is explicit that this matches
 * how a therapist actually thinks: "who am I working with", not "open the chat
 * feature and pick a person".
 *
 * THE SELECTION LIVES IN THE URL, not in state. A refresh keeps their place,
 * §8.8's notification can link straight to a client, browser back works, and
 * the phone's two-view split falls out for free: `/portal` is the list and
 * `/portal/clients/:bookingId` is the workspace.
 *
 * THIS SHELL IS NOT ACCESS CONTROL. The server enforces the role on every
 * `/api/v1/therapist` request; this only decides what renders.
 */
export default function TherapistPortalShell() {
  /**
   * Unsent replies, one per client, in memory only (8.3).
   *
   * Held HERE, above the per-client chat, because that chat is remounted on
   * every switch on purpose. A lazy initialiser, so one store belongs to one
   * portal session; cleared when the portal unmounts, which is what signing out
   * does, so nobody's half-written words outlive the session that wrote them.
   */
  const [drafts] = useState(() => createDraftStore())
  useEffect(() => () => drafts.clearAll(), [drafts])

  return (
    // One socket for the whole portal, not one per screen — the same call 7.4
    // made for the client. Null-tolerant: everything falls back to REST.
    <PortalSocketProvider>
      {/* Built role-agnostic in 7.6 for exactly this. One count per booking,
          rising live the moment a client writes. */}
      <UnreadProvider myRole="therapist">
        {/* §8.8: cross-client awareness, beside the per-client counts rather
            than instead of them. One fetch for the whole portal (10.4). */}
        <NotificationProvider>
          <DraftContext.Provider value={drafts}>
            <TherapistPortalFrame />
          </DraftContext.Provider>
        </NotificationProvider>
      </UnreadProvider>
    </PortalSocketProvider>
  )
}

function TherapistPortalFrame() {
  const location = useLocation()
  const clients = useTherapistClients()

  // On a phone the list and the workspace are separate screens. On a desktop
  // both are on screen at once and this only decides what the right pane says.
  const atIndex = location.pathname.replace(/\/+$/, '') === '/portal'

  // THE TAB TRAVELS WITH THE THERAPIST. Reading worksheets for one client and
  // clicking the next in the sidebar should stay in worksheets — the way a
  // therapist actually works through a batch. Only the CHOICE travels: the
  // workspace is keyed on the booking id and clears its data during render, so
  // no row of one person's record can appear under another's name.
  // `/portal/clients/:bookingId/:tab` → index 4.
  const activeTab = location.pathname.split('/')[4] || undefined

  return (
    /* `h-dvh` with `overflow-hidden` rather than `min-h-dvh`, so the column
       below has a DEFINITE height. Chunk 8.2's chat fills the remaining space
       and scrolls internally; without a bounded chain its `flex-1` resolves to
       nothing. The client portal is bounded the same way for the same reason. */
    <div className="flex h-dvh flex-col overflow-hidden bg-mist lg:grid lg:grid-cols-[320px_1fr]">
      {/* At the phone's list view the workspace column is not rendered, so the
          usual `#main` target would move focus nowhere — a skip link that looks
          like it worked and did not. It points at the list instead, which is
          the primary content at that width. */}
      <SkipLink target={atIndex ? '#clients' : '#main'} />

      {/* THE LIST. Exactly one instance in the DOM at any width, so a screen
          reader never meets two copies of the same navigation. */}
      <aside
        id="clients"
        tabIndex={-1}
        // On the WHOLE column, not just the rail inside it, so the phone header
        // above the list is covered too. Gold is the only accent legible on ink
        // (11.08:1) and is banned as a focus ring on light surfaces (1.63:1).
        data-surface="dark"
        className={cx(
          'min-h-0 flex-col focus-visible:outline-none lg:flex lg:h-dvh',
          atIndex ? 'flex flex-1' : 'hidden',
        )}
      >
        {/* The rail carries no logo on desktop — the list is the subject there.
            On a phone this is the whole screen, so it needs the mark and a way
            out. White on ink; the ink logo would be invisible here. */}
        <div className="flex shrink-0 items-center gap-4 bg-ink px-4 py-3 lg:hidden">
          <img
            src={logoWhite}
            alt="Cast of Minds"
            className="w-[74px] h-auto scale-x-[1.1] origin-left shrink-0"
          />
        </div>

        <div className="min-h-0 flex-1">
          <TherapistRail state={clients} activeTab={activeTab} footer={<SignOutButton />} />
        </div>
      </aside>

      {/* THE WORKSPACE. */}
      <div className={cx('min-h-0 min-w-0 flex-col', atIndex ? 'hidden lg:flex' : 'flex flex-1')}>
        {/* Phone-only header: the mark, the way back to the list, the way out.
            The back control is a real link rather than history.back(), so it
            behaves the same however the visitor arrived. */}
        <header className="flex shrink-0 items-center gap-3 border-b border-ink/12 bg-paper/90 px-4 py-3 backdrop-blur-md lg:hidden">
          <Link
            to="/portal"
            className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 font-body text-ui font-medium text-ink transition-colors duration-200 ease-out hover:bg-ink/5"
          >
            <BackIcon size={18} />
            {CLIENTS_LIST.backToList}
          </Link>

          <img
            src={logoInk}
            alt="Cast of Minds"
            className="ml-auto w-[74px] h-auto scale-x-[1.1] origin-right shrink-0"
          />
        </header>

        <main
          id="main"
          tabIndex={-1}
          // ONE padding rule for every screen in the pane. The workspace's sticky
          // header and its chat cancel it with matching negative margins, so
          // Profile and Notifications keep their breathing room at the top.
          className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-6 focus-visible:outline-none sm:px-6 sm:py-8 lg:px-10 lg:py-10 
          pb-6 sm:pb-8 lg:pb-10 pt-0 sm:pt-0 lg:pt-0
          "
        >
          {/* FULL WIDTH ON PURPOSE, and each screen caps its own content.
              The workspace's identity strip and tabs are sticky and have to
              span the whole column to read as a header band; capping here would
              leave them floating in the middle of a wide display with mist
              either side. */}
          <Outlet context={clients} />
        </main>
      </div>
    </div>
  )
}
