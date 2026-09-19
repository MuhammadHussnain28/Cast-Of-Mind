import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import ClientsIndex from './therapist/ClientsIndex'
import { selectRole } from '../../store/authSlice'

/**
 * The index of `/portal`, which serves two roles (§5).
 *
 * A therapist lands on their inbox with nobody selected — §8 makes the client
 * list the portal's home, and their profile now has its own route at
 * `/portal/profile` rather than standing in as the landing screen.
 *
 * A client is sent to their chat: §7 lists it first and it is where the
 * relationship actually happens, so landing anywhere else would make them
 * navigate before they could do the one thing they came for.
 */
export default function PortalHome() {
  const role = useSelector(selectRole)

  if (role === 'client') return <Navigate to="/portal/chat" replace />

  return <ClientsIndex />
}
