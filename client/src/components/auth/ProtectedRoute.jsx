import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'
import { selectAuthStatus, selectRole } from '../../store/authSlice'
import { homeForRole } from '../../lib/authRedirect'
import { Spinner } from '../ui'

/**
 * Gate for any route that needs a signed-in user.
 *
 *   <ProtectedRoute><Portal /></ProtectedRoute>
 *   <ProtectedRoute roles={['admin']}><Admin /></ProtectedRoute>
 *
 * THIS IS NOT SECURITY. It decides what to render, nothing more. Anyone can
 * edit the JavaScript in their own browser. The real protection is the
 * server-side guards from chunk 1.4, which run on every request regardless of
 * what the frontend chooses to show — master spec §11 and §18.
 */
export default function ProtectedRoute({ roles, children }) {
  const status = useSelector(selectAuthStatus)
  const role = useSelector(selectRole)
  const location = useLocation()

  // Still asking the server whether the cookie is good. Deciding now would
  // throw a signed-in user out on every page reload, because the token is
  // held in memory and is briefly absent after a refresh.
  if (status === 'bootstrapping') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="md" />
        <span className="sr-only">Checking your session</span>
      </div>
    )
  }

  if (status !== 'authenticated') {
    // `state.from` lets the login page send them back where they were headed
    // instead of dumping everyone on the same landing page.
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // Signed in, but this is not their part of the platform. Sent to their own
  // home rather than shown a refusal — there is nothing here they can act on,
  // and a bare "access denied" for a client who mistyped a URL reads as an
  // accusation.
  if (roles && !roles.includes(role)) {
    return <Navigate to={homeForRole(role)} replace />
  }

  return children
}
