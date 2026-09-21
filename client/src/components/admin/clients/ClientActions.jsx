import { useState } from 'react'
import { Button, Modal, Text } from '../../ui'
import { ACTIONS } from '../../../data/adminClientContent'
import { formatDate } from '../../../lib/dateFormat'
import {
  cancelClientSubscription,
  resetClientPassword,
  setClientActive,
} from '../../../lib/api/adminClientsApi'
import { toApiError } from '../../../lib/api/ApiError'

/**
 * The three account actions — §9.4.
 *
 * Each sits behind a confirmation because each reaches a real person who has
 * paid: one stops their money, one stops their access, and the third puts an
 * email in their inbox. The dialogs are not "are you sure" — they say what will
 * actually happen, with the real date in it, because that is the thing the
 * admin is deciding about.
 *
 * THE ADMIN NEVER SEES OR CHOOSES A PASSWORD. The reset triggers the same link
 * the Forgot password flow sends; §11 is explicit that hashes are one-way and
 * recovery is by reset, never retrieval. The dialog says so, so nobody goes
 * looking for a password field that will never exist.
 */
export default function ClientActions({ client, onChanged }) {
  const [dialog, setDialog] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  const active = client.accountStatus === 'active'
  const name = client.displayName
  const sub = client.subscription
  const cancellable = sub?.status === 'active' || sub?.status === 'past_due'

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
        const result = await resetClientPassword(client._id)
        setNotice(result.message)
        setDialog(null)
      } else if (action === 'cancel') {
        const result = await cancelClientSubscription(client._id)
        setDialog(null)
        setNotice([result.message, result.notice].filter(Boolean).join(' '))
        onChanged(result.client)
      } else {
        const result = await setClientActive(client._id, !active)
        setDialog(null)
        onChanged(result.client)
      }
    } catch (err) {
      setError(toApiError(err).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-2xl border border-ink/12 bg-mist px-5 py-5 sm:px-6">
      <h2 className="font-body text-caption font-medium text-ink/70">{ACTIONS.heading}</h2>

      <div className="mt-4 flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => setDialog('reset')}>
          {ACTIONS.reset}
        </Button>
        <Button variant={active ? 'secondary' : 'primary'} onClick={() => setDialog('status')}>
          {active ? ACTIONS.deactivate : ACTIONS.reactivate}
        </Button>
        {cancellable && (
          <Button variant="danger" onClick={() => setDialog('cancel')}>
            {ACTIONS.cancel}
          </Button>
        )}
      </div>

      {notice && (
        <Text size="caption" className="mt-4 max-w-measure" role="status">
          {notice}
        </Text>
      )}

      <Modal
        open={dialog === 'reset'}
        onClose={close}
        title={ACTIONS.resetTitle(name)}
        description={ACTIONS.resetBody}
        footer={
          <>
            <Button variant="ghost" onClick={close} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={() => run('reset')} loading={busy}>
              {ACTIONS.resetConfirm}
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
        title={active ? ACTIONS.deactivateTitle(name) : ACTIONS.reactivateTitle(name)}
        description={active ? ACTIONS.deactivateBody : ACTIONS.reactivateBody}
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
              {active ? ACTIONS.deactivate : ACTIONS.reactivate}
            </Button>
          </>
        }
      >
        {active && cancellable && (
          <div className="rounded-xl bg-mist px-4 py-3">
            <Text size="ui">{ACTIONS.deactivateWarning}</Text>
          </div>
        )}

        {error && (
          <Text size="ui" tone="error" role="alert" className="mt-4">
            {error}
          </Text>
        )}
      </Modal>

      <Modal
        open={dialog === 'cancel'}
        onClose={close}
        title={ACTIONS.cancelTitle(name)}
        description={ACTIONS.cancelBody}
        footer={
          <>
            <Button variant="ghost" onClick={close} disabled={busy}>
              {ACTIONS.keep}
            </Button>
            <Button variant="danger" onClick={() => run('cancel')} loading={busy}>
              {ACTIONS.cancelConfirm}
            </Button>
          </>
        }
      >
        <div className="rounded-xl bg-mist px-4 py-3">
          <Text size="ui">
            {sub?.currentPeriodEnd
              ? ACTIONS.cancelKeepsAccess(formatDate(sub.currentPeriodEnd))
              : ACTIONS.cancelKeepsAccessUnknown}
          </Text>
          <Text size="caption" tone="muted" className="mt-2">
            {ACTIONS.cancelIrreversible}
          </Text>
        </div>

        {error && (
          <Text size="ui" tone="error" role="alert" className="mt-4">
            {error}
          </Text>
        )}
      </Modal>
    </section>
  )
}
