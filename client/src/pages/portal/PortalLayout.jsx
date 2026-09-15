import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import SkipLink from '../../components/layout/SkipLink'
import SignOutButton from '../../components/auth/SignOutButton'
import { Text } from '../../components/ui'
import { selectRole, selectUser } from '../../store/authSlice'
import ClientPortalShell from './ClientPortalShell'
import logoInk from '../../assets/cast-of-mind-logo-singular-ink.png'

/**
 * `/portal` serves two roles (§5), and they need genuinely different chrome —
 * the client portal is organised by feature because they have exactly one
 * therapist, while the therapist portal is an inbox organised by client (§7, §8).
 * So this picks a shell rather than trying to make one serve both.
 *
 * Slice 8 replaces the therapist branch with that inbox. It is left exactly as
 * chunk 4.6 built it, on purpose: a rail built now would be thrown away.
 */
export default function PortalLayout() {
  const role = useSelector(selectRole)
  const location = useLocation()

  if (role === 'client') return <ClientPortalShell />

  // The five child routes belong to the client, and Account reads the client
  // portal context — which a therapist's shell does not provide, so it would
  // throw rather than merely look odd. A therapist who types one of those URLs
  // is sent to their own portal instead of to a blank screen.
  const path = location.pathname.replace(/\/+$/, '')
  if (path !== '/portal') return <Navigate to="/portal" replace />

  return <TherapistShell />
}

/**
 * The therapist's minimal shell — a top bar and a content area.
 *
 * It exists at all because /portal was rendering inside the marketing layout: a
 * navbar and footer wrapped round a signed-in surface, the same mistake the
 * admin portal fixed in chunk 4.1.
 */
function TherapistShell() {
  const user = useSelector(selectUser)

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <SkipLink />

      <header className="sticky top-0 z-30 border-b border-ink/12 bg-paper">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-4 px-4 py-3 sm:px-6">
          <img src={logoInk} alt="Cast of Mind" className="h-8 w-auto shrink-0" />

          <div className="ml-auto flex shrink-0 items-center gap-3">
            {user?.email && (
              <Text size="caption" tone="muted" className="hidden truncate sm:block">
                {user.email}
              </Text>
            )}
            <SignOutButton />
          </div>
        </div>
      </header>

      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 focus-visible:outline-none sm:px-6 sm:py-10"
      >
        <Outlet />
      </main>
    </div>
  )
}
