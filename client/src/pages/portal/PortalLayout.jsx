import { Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectRole } from '../../store/authSlice'
import ClientPortalShell from './ClientPortalShell'
import TherapistPortalShell from './TherapistPortalShell'

/**
 * `/portal` serves two roles (§5), and they need genuinely different chrome.
 *
 * The client portal is organised BY FEATURE, because they have exactly one
 * therapist (§7). The therapist portal is an inbox organised BY CLIENT, because
 * they have many (§8). One shell cannot honestly serve both, so this picks.
 *
 * THE CHILD ROUTES BELONG TO ONE ROLE OR THE OTHER, and a signed-in user on the
 * wrong one is REDIRECTED, NOT REFUSED — the call `ProtectedRoute` makes and
 * 7.1 applied to this same file. It matters beyond tidiness: the client screens
 * read the client portal context, which a therapist's shell does not provide,
 * so a therapist on `/portal/account` would hit a thrown error and a blank page
 * rather than something merely odd.
 *
 * THIS IS NOT ACCESS CONTROL. It decides what renders; the server enforces the
 * role on every `/api/v1/client` and `/api/v1/therapist` request.
 */

/** §7 — the client's five features. */
const CLIENT_PATHS = ['chat', 'worksheets', 'journal', 'sessions', 'account']

/** §8 — the therapist's inbox and their two global sections. */
const THERAPIST_PATHS = ['clients', 'profile', 'notifications']

/** The first path segment after `/portal`, or '' at the index. */
function sectionOf(pathname) {
  return pathname.replace(/\/+$/, '').split('/')[2] ?? ''
}

export default function PortalLayout() {
  const role = useSelector(selectRole)
  const section = sectionOf(useLocation().pathname)

  if (role === 'client') {
    if (THERAPIST_PATHS.includes(section)) return <Navigate to="/portal" replace />
    return <ClientPortalShell />
  }

  if (CLIENT_PATHS.includes(section)) return <Navigate to="/portal" replace />
  return <TherapistPortalShell />
}
