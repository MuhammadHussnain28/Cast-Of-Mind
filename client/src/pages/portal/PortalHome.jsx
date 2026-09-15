import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import TherapistProfile from './TherapistProfile'
import { selectRole } from '../../store/authSlice'

/**
 * The index of `/portal`, which serves two roles (§5).
 *
 * A therapist gets their profile — the only therapist screen that exists until
 * slice 8 builds the inbox. A client is sent to their chat: §7 lists it first
 * and it is where the relationship actually happens, so landing anywhere else
 * would make them navigate before they could do the one thing they came for.
 */
export default function PortalHome() {
  const role = useSelector(selectRole)

  if (role === 'client') return <Navigate to="/portal/chat" replace />

  return <TherapistProfile />
}
