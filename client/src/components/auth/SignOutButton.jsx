import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui'
import { endSession } from '../../lib/authSession'

/**
 * Signs out. The work itself lives in lib/authSession so this and the admin
 * idle timeout cannot drift on what signing out means.
 */
export default function SignOutButton() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)

  async function handleSignOut() {
    setBusy(true)
    await endSession(dispatch)
    navigate('/login', { replace: true })
  }

  return (
    <Button variant="ghost" size="sm" loading={busy} onClick={handleSignOut}>
      Sign out
    </Button>
  )
}
