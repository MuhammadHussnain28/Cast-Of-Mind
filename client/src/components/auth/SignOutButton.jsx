import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui'
import { logout as logoutRequest } from '../../lib/api/authApi'
import { clearAccessToken } from '../../lib/api/accessToken'
import { sessionEnded } from '../../store/authSlice'

/**
 * Signs out.
 *
 * The local state is cleared whether or not the server call succeeds. If the
 * network is down, the person still expects the button to work — leaving them
 * apparently signed in on a shared computer because a request failed would be
 * the wrong way round. The server-side session is already gone or will expire
 * on its own.
 */
export default function SignOutButton() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)

  async function handleSignOut() {
    setBusy(true)
    try {
      await logoutRequest()
    } catch {
      // Deliberately swallowed — see above.
    } finally {
      clearAccessToken()
      dispatch(sessionEnded())
      navigate('/login', { replace: true })
    }
  }

  return (
    <Button variant="ghost" size="sm" loading={busy} onClick={handleSignOut}>
      Sign out
    </Button>
  )
}
