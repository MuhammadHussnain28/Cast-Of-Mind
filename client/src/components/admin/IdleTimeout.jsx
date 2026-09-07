import { Button, Modal, Text } from '../ui'

function formatRemaining(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/**
 * The one place a modal is the right answer here: the session is about to end
 * whatever the admin is doing, and they need the chance to stop it.
 *
 * The ticking number is aria-hidden. A countdown announced every second is
 * unusable with a screen reader, so the dialog's description carries the fact
 * once and the digits are there for people watching them.
 */
export default function IdleTimeout({ msRemaining, onStay, onSignOut }) {
  const open = msRemaining != null

  return (
    <Modal
      open={open}
      onClose={onStay}
      title="Still there?"
      description="You have been inactive for a while, so this session is about to end. Signing out protects the client and therapist records on screen."
      footer={
        <>
          <Button variant="ghost" onClick={onSignOut}>
            Sign out now
          </Button>
          <Button onClick={onStay}>Stay signed in</Button>
        </>
      }
    >
      <div className="rounded-xl bg-mist px-4 py-3">
        <Text size="caption" tone="muted">
          Signing out in
        </Text>
        <p
          aria-hidden="true"
          className="font-body text-subsection tabular-nums text-ink"
        >
          {open ? formatRemaining(msRemaining) : '0:00'}
        </p>
      </div>
    </Modal>
  )
}
