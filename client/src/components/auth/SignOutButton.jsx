import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { cx } from '../../lib/cx'
import Spinner from '../ui/Spinner'
import { endSession } from '../../lib/authSession'

/**
 * Signs out. The work itself lives in lib/authSession so this and the admin
 * idle timeout cannot drift on what signing out means.
 */
export default function SignOutButton({ className, variant }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)

  async function handleSignOut() {
    setBusy(true)
    await endSession(dispatch)
    navigate('/login', { replace: true })
  }

  // Small screens & headers: compact button with ink background and white text
  if (variant === 'ghost') {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={handleSignOut}
        className={cx(
          'group inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-ink bg-ink px-3.5 py-1.5 font-body text-caption font-medium text-paper shadow-xs transition-all duration-200 ease-out hover:bg-ink-deep hover:shadow-sm active:scale-95 disabled:opacity-50',
          className,
        )}
      >
        {busy ? (
          <Spinner size="sm" />
        ) : (
          <svg
            className="h-3.5 w-3.5 shrink-0 text-paper transition-transform duration-200 ease-out group-hover:translate-x-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        )}
        <span>{busy ? 'Signing out…' : 'Sign out'}</span>
      </button>
    )
  }

  // Large screens (sidebar): dark ink background inverting to white paper on hover
  return (
    <button
      type="button"
      disabled={busy}
      onClick={handleSignOut}
      className={cx(
        'group flex min-h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-paper/20 bg-ink-deep px-4 py-2.5 font-body text-caption font-medium text-paper shadow-xs transition-all duration-200 ease-out hover:border-paper hover:bg-paper hover:text-ink hover:shadow-sm active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
    >
      {busy ? (
        <Spinner size="sm" />
      ) : (
        <svg
          className="h-4 w-4 shrink-0 text-paper transition-all duration-200 ease-out group-hover:text-ink group-hover:translate-x-0.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      )}
      <span>{busy ? 'Signing out…' : 'Sign out'}</span>
    </button>
  )
}

