import { useState } from 'react'
import { Button } from '../../../ui'
import { Entry } from '../../journal/EntrySpine'
import { EditIcon, DeleteIcon } from '../../journal/JournalIcons'
import JournalComposer from './JournalComposer'
import { JOURNAL } from '../../../../data/clientPortalContent'
import { entryDateLabel } from '../../../../lib/journalDates'

/** One of the client's own entries: read, rewrite, or remove for good. */
export default function EntryRow({ entry, onEdit, onDelete }) {
  const [mode, setMode] = useState('read')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  if (mode === 'edit') {
    return (
      <Entry entry={entry}>
        <div className="mt-4 border-t border-ink/12 pt-4">
          <JournalComposer
            autoFocus
            initialText={entry.text}
            initialMood={entry.moodTag}
            submitLabel={JOURNAL.entry.saveChanges}
            onCancel={() => setMode('read')}
            onSubmit={async (values) => {
              await onEdit(entry.id, values)
              setMode('read')
            }}
          />
        </div>
      </Entry>
    )
  }

  async function confirmDelete() {
    setBusy(true)
    setError(null)
    try {
      await onDelete(entry.id)
    } catch (failure) {
      setError(failure.message || JOURNAL.entry.deleteFailed)
      setBusy(false)
      setMode('read')
    }
  }

  return (
    <Entry
      entry={entry}
      actions={
        <div className="mt-3.5 flex flex-wrap items-center gap-x-1 gap-y-2">
          {mode === 'read' ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMode('edit')}
                aria-label={`${JOURNAL.entry.edit} — ${entryDateLabel(entry.createdAt)}`}
              >
                <span aria-hidden="true" className="mr-1.5 inline-flex">
                  <EditIcon size={16} />
                </span>
                {JOURNAL.entry.edit}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMode('confirm')}
                aria-label={`${JOURNAL.entry.delete} — ${entryDateLabel(entry.createdAt)}`}
              >
                <span aria-hidden="true" className="mr-1.5 inline-flex">
                  <DeleteIcon size={16} />
                </span>
                {JOURNAL.entry.delete}
              </Button>
            </>
          ) : (
            /* Asked in place, not in a modal: the question is about this entry. */
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <p role="status" className="font-body text-caption text-ink">
                {JOURNAL.entry.confirm}
              </p>
              <Button variant="danger" size="sm" loading={busy} onClick={confirmDelete}>
                {JOURNAL.entry.confirmYes}
              </Button>
              <Button variant="ghost" size="sm" disabled={busy} onClick={() => setMode('read')}>
                {JOURNAL.entry.confirmNo}
              </Button>
            </div>
          )}

          {error && (
            <p role="alert" className="w-full font-body text-caption text-clay">
              {error}
            </p>
          )}
        </div>
      }
    />
  )
}
