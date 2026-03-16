import { useMemo, forwardRef } from 'react'
import { format, parseISO } from 'date-fns'
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

function extractUncheckedTodos(contentJson: string): string[] {
  try {
    const doc = JSON.parse(contentJson)
    const todos: string[] = []
    function walk(node: unknown) {
      if (typeof node !== 'object' || node === null) return
      const n = node as Record<string, unknown>
      if (
        n.type === 'taskItem' &&
        typeof n.attrs === 'object' &&
        n.attrs !== null &&
        (n.attrs as Record<string, unknown>).checked === false
      ) {
        const texts: string[] = []
        function collectText(inner: unknown) {
          if (typeof inner !== 'object' || inner === null) return
          const m = inner as Record<string, unknown>
          if (m.type === 'text' && typeof m.text === 'string') texts.push(m.text)
          if (Array.isArray(m.content)) m.content.forEach(collectText)
        }
        if (Array.isArray(n.content)) n.content.forEach(collectText)
        const text = texts.join('').trim()
        if (text) todos.push(text)
        return
      }
      if (Array.isArray(n.content)) n.content.forEach(walk)
    }
    walk(doc)
    return todos
  } catch {
    return []
  }
}

function TodoView({ entries }: { entries: Entry[] }) {
  const groups = entries
    .map((e) => ({ date: e.date, todos: extractUncheckedTodos(e.content) }))
    .filter((g) => g.todos.length > 0)

  if (groups.length === 0) {
    return <p className="no-results">No incomplete todos.</p>
  }

  return (
    <div className="entry-list">
      {groups.map(({ date, todos }) => (
        <div key={date} className="entry-block">
          <div className="entry-header">
            <span className="entry-date">
              {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
            </span>
          </div>
          <ul className="todo-view-list">
            {todos.map((text, i) => (
              <li key={i}>
                <input type="checkbox" disabled />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

interface Props {
  entries: Entry[]
  query: string
  saveEntry: (date: string, content: string) => Promise<void>
}

export const EntryList = forwardRef<HTMLDivElement, Props>(
  ({ entries, query, saveEntry }, bottomRef) => {
    const isTodoView = query.trim().toLowerCase() === '/todo'

    const filtered = useMemo(() => {
      if (isTodoView || !query) return entries
      const q = query.toLowerCase()
      return entries.filter(
        (e) => extractText(e.content).includes(q) || e.date.includes(q)
      )
    }, [entries, query, isTodoView])

    if (isTodoView) {
      return (
        <div className="entry-list">
          <TodoView entries={entries} />
          <div ref={bottomRef} />
        </div>
      )
    }

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
