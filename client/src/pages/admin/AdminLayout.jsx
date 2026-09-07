import { useCallback, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate, matchPath } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useDispatch, useSelector } from 'react-redux'
import SkipLink from '../../components/layout/SkipLink'
import AdminSidebar from '../../components/admin/AdminSidebar'
import AdminTopBar from '../../components/admin/AdminTopBar'
import IdleTimeout from '../../components/admin/IdleTimeout'
import { CloseIcon } from '../../components/admin/AdminIcons'
import { ADMIN_NAV } from '../../data/adminNav'
import { useFocusTrap } from '../../lib/useFocusTrap'
import { useIdleTimer } from '../../lib/useIdleTimer'
import { endSession } from '../../lib/authSession'
import { fetchAdminSession } from '../../lib/api/adminApi'
import { selectUser } from '../../store/authSlice'

// Used until the server answers, so the timer is never off while the first
// request is in flight. The server value (master spec §18) wins once it lands.
const FALLBACK_IDLE = { idleTimeoutMs: 30 * 60 * 1000, idleWarningMs: 2 * 60 * 1000 }

function titleFor(pathname) {
  const match = ADMIN_NAV.find((item) =>
    matchPath({ path: item.to, end: Boolean(item.end) }, pathname),
  )
  return match?.label ?? 'Admin'
}

/** Detail routes sit under a section, and the header should say so. */
const DETAIL_CRUMBS = [
  { path: '/admin/applications/:id', to: '/admin/applications', label: 'Applications', title: 'Review application' },
  { path: '/admin/therapists/:id', to: '/admin/therapists', label: 'Therapists', title: 'Therapist' },
]

function crumbFor(pathname) {
  return (
    DETAIL_CRUMBS.find((crumb) => matchPath({ path: crumb.path, end: true }, pathname)) ?? null
  )
}

export default function AdminLayout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useSelector(selectUser)
  const reduce = useReducedMotion()

  const [navOpen, setNavOpen] = useState(false)
  const [session, setSession] = useState(null)
  const drawerRef = useRef(null)

  const closeNav = useCallback(() => setNavOpen(false), [])
  const { onKeyDown } = useFocusTrap({
    active: navOpen,
    containerRef: drawerRef,
    onClose: closeNav,
  })

  const title = titleFor(location.pathname)
  const parent = crumbFor(location.pathname)

  // Restored on the way out, or a public page keeps the admin's tab title.
  useEffect(() => {
    const previous = document.title
    document.title = `${title} · Cast of Mind admin`
    return () => {
      document.title = previous
    }
  }, [title])

  // The portal works without this — it only supplies the confirmed email and
  // the timeout values. A failure here must not blank the admin, so it is
  // swallowed and the fallback stands. A real 401 is handled by the interceptor.
  useEffect(() => {
    let cancelled = false

    fetchAdminSession()
      .then((data) => {
        if (!cancelled) setSession(data)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

  const signOut = useCallback(
    async (reason) => {
      await endSession(dispatch)
      navigate('/login', { replace: true, state: reason ? { reason } : undefined })
    },
    [dispatch, navigate],
  )

  const handleTimeout = useCallback(() => signOut('inactivity'), [signOut])

  const { msRemaining, stayActive } = useIdleTimer({
    timeoutMs: session?.idleTimeoutMs ?? FALLBACK_IDLE.idleTimeoutMs,
    warningMs: session?.idleWarningMs ?? FALLBACK_IDLE.idleWarningMs,
    onTimeout: handleTimeout,
  })

  return (
    <div className="min-h-dvh bg-paper lg:grid lg:grid-cols-[248px_1fr]">
      <SkipLink />

      <aside className="hidden lg:sticky lg:top-0 lg:block lg:h-dvh">
        <AdminSidebar />
      </aside>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {navOpen && (
              <div className="fixed inset-0 z-50 lg:hidden" onKeyDown={onKeyDown}>
                <motion.div
                  className="absolute inset-0 bg-ink-deep/50"
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduce ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  onClick={closeNav}
                  aria-hidden="true"
                />
                <motion.div
                  ref={drawerRef}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Admin sections"
                  tabIndex={-1}
                  className="absolute inset-y-0 left-0 w-[min(17rem,86vw)] focus-visible:outline-none"
                  initial={reduce ? false : { x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={reduce ? { opacity: 0 } : { x: '-100%' }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div data-surface="dark" className="absolute right-3 top-4 z-10">
                    <button
                      type="button"
                      onClick={closeNav}
                      aria-label="Close admin menu"
                      className="flex size-11 items-center justify-center rounded-xl text-paper hover:bg-paper/10"
                    >
                      <CloseIcon />
                    </button>
                  </div>
                  <AdminSidebar onNavigate={closeNav} />
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}

      <div className="flex min-w-0 flex-col">
        <AdminTopBar
          title={parent ? parent.title : title}
          parent={parent}
          email={session?.email ?? user?.email}
          onOpenNav={() => setNavOpen(true)}
        />

        <main
          id="main"
          tabIndex={-1}
          className="flex-1 px-4 py-6 focus-visible:outline-none sm:px-6 sm:py-8"
        >
          <Outlet />
        </main>
      </div>

      <IdleTimeout
        msRemaining={msRemaining}
        onStay={stayActive}
        onSignOut={() => signOut()}
      />
    </div>
  )
}
