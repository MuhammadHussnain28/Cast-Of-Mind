import { useState } from 'react'
import { Button, Modal, Text } from '../../ui'
import { formatCount } from '../../../lib/dashboardFormat'
import {
  setTherapistActive,
  resetTherapistPassword,
} from '../../../lib/api/adminTherapistsApi'
import { toApiError } from '../../../lib/api/ApiError'

/**
 * The three account actions — §9.3.
 *
 * Each is behind a confirmation because each reaches a real person: two change
 * whether they can work, and the third puts an email in their inbox.
 *
 * THE ADMIN NEVER SEES OR CHOOSES A PASSWORD. The reset button triggers the
 * same link the "Forgot password" flow sends; §11 is explicit that hashes are
 * one-way and recovery is by reset, never retrieval. The dialog says so, so
 * nobody goes looking for a password field that will never exist.
 */
export default function TherapistActions({ therapist, onChanged }) {
  const [dialog, setDialog] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  const active = therapist.status === 'active'
  const name = `${therapist.firstName} ${therapist.lastName}`

  function close() {
    if (busy) return
    setDialog(null)
    setError(null)
  }

  async function run(action) {
    setBusy(true)
    setError(null)

    try {
      if (action === 'reset') {
        const result = await resetTherapistPassword(therapist._id)
        setNotice(result.message)
        setDialog(null)
      } else {
        const result = await setTherapistActive(therapist._id, !active)
        setDialog(null)
        onChanged(result.therapist)
      }
    } catch (err) {
      setError(toApiError(err).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-2xl border border-ink/12 bg-mist px-5 py-5 sm:px-6">
      <h2 className="font-body text-caption font-medium text-ink/70">Account</h2>

      <div className="mt-4 flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => setDialog('reset')}>
          Send a password reset
        </Button>
        <Button
          variant={active ? 'danger' : 'primary'}
          onClick={() => setDialog('status')}
        >
          {active ? 'Deactivate' : 'Reactivate'}
        </Button>
      </div>

      {notice && (
        <Text size="caption" className="mt-4" role="status">
          {notice}
        </Text>
      )}

      <Modal
        open={dialog === 'reset'}
        onClose={close}
        title={`Send ${name} a password reset?`}
        description="They receive the same link as the Forgot password flow and choose a new password themselves. You cannot see or set their password — nobody can, because it is stored only as a one-way hash."
        footer={
          <>
            <Button variant="ghost" onClick={close} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={() => run('reset')} loading={busy}>
              Send the reset link
            </Button>
          </>
        }
      >
        {error && (
          <Text size="ui" tone="error" role="alert">
            {error}
          </Text>
        )}
      </Modal>

      <Modal
        open={dialog === 'status'}
        onClose={close}
        title={active ? `Deactivate ${name}?` : `Reactivate ${name}?`}
        description={
          active
            ? 'They will not be able to sign in, and matching will stop offering them to new clients.'
            : 'They will be able to sign in again, and matching will offer them to new clients.'
        }
        footer={
          <>
            <Button variant="ghost" onClick={close} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant={active ? 'danger' : 'primary'}
              onClick={() => run('status')}
              loading={busy}
            >
              {active ? 'Deactivate' : 'Reactivate'}
            </Button>
          </>
        }
      >
        {active && (
          <div className="rounded-xl bg-mist px-4 py-3">
            <Text size="ui">
              {therapist.activeClients === 0
                ? 'They have no active clients.'
                : `They currently have ${formatCount(therapist.activeClients)} active ${
                    therapist.activeClients === 1 ? 'client' : 'clients'
                  }.`}
            </Text>
            <Text size="caption" tone="muted" className="mt-2">
              Existing bookings and subscriptions are not changed by this. Those have to be
              cancelled separately if the pairing is ending.
            </Text>
          </div>
        )}

        {error && (
          <Text size="ui" tone="error" role="alert" className="mt-4">
            {error}
          </Text>
        )}
      </Modal>
    </section>
  )
}
