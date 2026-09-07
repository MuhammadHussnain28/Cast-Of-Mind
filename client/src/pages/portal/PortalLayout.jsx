import { Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import SkipLink from '../../components/layout/SkipLink'
import SignOutButton from '../../components/auth/SignOutButton'
import { Text } from '../../components/ui'
import { selectUser } from '../../store/authSlice'
import logoInk from '../../assets/cast-of-mind-logo-singular-ink.png'

/**
 * The portal shell — deliberately minimal.
 *
 * Slice 8 replaces the body with the therapist's inbox (client list on the
 * left, that client's workspace on the right), so building a navigation rail
 * now would be work thrown away. This is a top bar and a content area, nothing
 * more.
 *
 * It exists at all because /portal was rendering inside the marketing layout —
 * a navbar and footer wrapped round a signed-in surface, the same mistake the
 * admin portal fixed in chunk 4.1.
 */
export default function PortalLayout() {
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
