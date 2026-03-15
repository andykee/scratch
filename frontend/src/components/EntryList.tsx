import { useMemo, forwardRef } from 'react'
import { EntryBlock } from './EntryBlock'
import type { Entry } from '../types'

function extractText(contentJson: string): string {
  try {
    const doc = JSON.parse(contentJson)
    const texts: string[] = []
    function walk(node: unknown) {
      if (typeof node !== 'object' || node === null) return
      const n = node as Record<string, unknown>
      if (n.type === 'text' && typeof n.text === 'string') texts.push(n.text)
      if (Array.isArray(n.content)) n.content.forEach(walk)
    }
    walk(doc)
    return texts.join(' ').toLowerCase()
  } catch {
    return ''
  }
}

interface Props {
  entries: Entry[]
  query: string
  saveEntry: (date: string, content: string) => Promise<void>
}

export const EntryList = forwardRef<HTMLDivElement, Props>(
  ({ entries, query, saveEntry }, bottomRef) => {
    const filtered = useMemo(() => {
      if (!query) return entries
      const q = query.toLowerCase()
      return entries.filter(
        (e) => extractText(e.content).includes(q) || e.date.includes(q)
      )
    }, [entries, query])

    return (
      <div className="entry-list">
        {filtered.length === 0 && query && (
          <p className="no-results">No entries match "{query}"</p>
        )}
        {filtered.map((entry) => (
          <EntryBlock key={entry.date} entry={entry} saveEntry={saveEntry} />
        ))}
        <div ref={bottomRef} />
      </div>
    )
  }
)

EntryList.displayName = 'EntryList'
