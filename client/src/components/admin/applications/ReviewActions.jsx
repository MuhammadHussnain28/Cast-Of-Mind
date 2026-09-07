import { useState } from 'react'
import { Button, Modal, Text, Textarea } from '../../ui'
import { approveApplication, rejectApplication } from '../../../lib/api/adminApplicationsApi'
import { toApiError } from '../../../lib/api/ApiError'

/**
 * Approve and reject, each behind a confirmation.
 *
 * Both are irreversible in different ways and neither is undoable from the UI:
 * approving opens a real account and emails a real person, and a rejection is
 * final — the applicant has to submit the whole 34-field form again. A dialog
 * is the right answer for exactly the reason the craft rules usually argue
 * against one: this genuinely needs interrupting.
 *
 * The dialogs say what will happen rather than asking "are you sure?", which
 * tells the reader nothing they did not already know.
 */
export default function ReviewActions({ application, onReviewed }) {
  const [dialog, setDialog] = useState(null) // 'approve' | 'reject' | null
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const name = `${application.firstName} ${application.lastName}`

  function close() {
    if (busy) return
    setDialog(null)
    setError(null)
  }

  async function run(action) {
    setBusy(true)
    setError(null)

    try {
      const result =
        action === 'approve'
          ? await approveApplication(application._id)
          : await rejectApplication(application._id, reason.trim() || undefined)

      setDialog(null)
      setReason('')
      onReviewed(action, result)
    } catch (err) {
      setError(toApiError(err).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl border border-ink/12 bg-mist px-5 py-5">
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setDialog('approve')}>Approve</Button>
        <Button variant="danger" onClick={() => setDialog('reject')}>
          Reject
        </Button>
      </div>

      <Text size="caption" tone="muted" className="mt-3">
        Approving opens {name}&rsquo;s account and emails them. Rejecting is final — they would
        have to submit a new application.
      </Text>

      <Modal
        open={dialog === 'approve'}
        onClose={close}
        title={`Approve ${name}?`}
        description="This creates their therapist account, builds their profile from this application, and emails them to say they can sign in. They will use the password they chose on the form — nobody generates a new one."
        footer={
          <>
            <Button variant="ghost" onClick={close} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={() => run('approve')} loading={busy}>
              Approve and create the account
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
        open={dialog === 'reject'}
        onClose={close}
        title={`Reject ${name}?`}
        description="No account is created and the application is kept on record. They are not emailed, so nothing reaches them from here."
        footer={
          <>
            <Button variant="ghost" onClick={close} disabled={busy}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => run('reject')} loading={busy}>
              Reject this application
            </Button>
          </>
        }
      >
        <Textarea
          label="Reason (optional)"
          helper="For your own records only. It is never shown or sent to the applicant."
          rows={3}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="e.g. Fewer supervised hours than the eligibility notice requires"
        />

        {error && (
          <Text size="ui" tone="error" role="alert" className="mt-4">
            {error}
          </Text>
        )}
      </Modal>
    </div>
  )
}
