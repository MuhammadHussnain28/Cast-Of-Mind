import { useState } from 'react'
import { Button } from '../../../ui'
import NoteComposer from './NoteComposer'
import { EditIcon, DeleteIcon } from '../../journal/JournalIcons'
import { entryDateLabel } from '../../../../lib/journalDates'
import { JOURNAL_NOTES } from '../../../../data/therapistPortalContent'

const copy = JOURNAL_NOTES.notes

/** One clinical note — a stack, not a spine, so it never reads as the journal. */
export default function NoteRow({ note, onEdit, onDelete }) {
  const [mode, setMode] = useState('read')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function confirmDelete() {
    setBusy(true)
    setError(null)
    try {
      await onDelete(note.id)
    } catch (failure) {
      setError(failure.message || copy.deleteFailed)
      setBusy(false)
      setMode('read')
    }
  }

  return (
    /* Paper on the panel's mist body — and it keeps the ghost buttons' hover
       visible. No `<li>` here: the list item is the caller's motion wrapper. */
    <div className="rounded-xl bg-paper px-4 py-3.5 shadow-[0_14px_36px_-26px_rgba(25,18,43,0.45)]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="font-body text-caption font-medium text-ink">
          <time dateTime={note.createdAt}>{entryDateLabel(note.createdAt)}</time>
        </p>
        {note.edited && <span className="font-body text-caption text-ink/70">{copy.edited}</span>}
      </div>

      {mode === 'edit' ? (
        <div className="mt-3">
          <NoteComposer
            autoFocus
            initialText={note.text}
            submitLabel={copy.saveChanges}
            onCancel={() => setMode('read')}
            onSubmit={async (values) => {
              await onEdit(note.id, values)
              setMode('read')
            }}
          />
        </div>
      ) : (
        <>
          <p className="mt-2 max-w-measure whitespace-pre-wrap wrap-break-word font-body text-ui leading-relaxed text-ink">
            {note.text}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-1 gap-y-2">
            {mode === 'read' ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => setMode('edit')}>
                  <span aria-hidden="true" className="mr-1.5 inline-flex">
                    <EditIcon size={16} />
                  </span>
                  {copy.edit}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setMode('confirm')}>
                  <span aria-hidden="true" className="mr-1.5 inline-flex">
                    <DeleteIcon size={16} />
                  </span>
                  {copy.delete}
                </Button>
              </>
            ) : (
              /* Asked in place, not in a modal: the question is about this note. */
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <p role="status" className="font-body text-caption text-ink">
                  {copy.confirm}
                </p>
                <Button variant="danger" size="sm" loading={busy} onClick={confirmDelete}>
                  {copy.confirmYes}
                </Button>
                <Button variant="ghost" size="sm" disabled={busy} onClick={() => setMode('read')}>
                  {copy.confirmNo}
                </Button>
              </div>
            )}

            {error && (
              <p role="alert" className="w-full font-body text-caption text-clay">
                {error}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
