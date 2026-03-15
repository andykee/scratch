import { useRef, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { TiptapEditor } from './TiptapEditor'
import type { Entry } from '../types'

interface Props {
  entry: Entry
  saveEntry: (date: string, content: string) => Promise<void>
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function EntryBlock({ entry, saveEntry }: Props) {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleUpdate(json: object) {
    if (timerRef.current) clearTimeout(timerRef.current)
    setStatus('saving')
    timerRef.current = setTimeout(async () => {
      try {
        await saveEntry(entry.date, JSON.stringify(json))
        setStatus('saved')
        setTimeout(() => setStatus('idle'), 2000)
      } catch {
        setStatus('error')
      }
    }, 1500)
  }

  const label = format(parseISO(entry.date), 'EEEE, MMMM d, yyyy')

  return (
    <div className="entry-block">
      <div className="entry-header">
        <h2 className="entry-date">{label}</h2>
        {status === 'saving' && <span className="save-status saving">Saving…</span>}
        {status === 'saved' && <span className="save-status saved">Saved</span>}
        {status === 'error' && <span className="save-status error">Error saving</span>}
      </div>
      <TiptapEditor
        key={entry.date}
        content={JSON.parse(entry.content)}
        onUpdate={handleUpdate}
      />
    </div>
  )
}
