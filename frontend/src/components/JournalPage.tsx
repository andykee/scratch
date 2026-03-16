import { useEffect, useRef, useState } from 'react'
import { SearchBar } from './SearchBar'
import { EntryList } from './EntryList'
import { useEntries } from '../hooks/useEntries'

export function JournalPage() {
  const { entries, loading, error, load, saveEntry } = useEntries()
  const [query, setQuery] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const hasScrolled = useRef(false)
  const [dark, setDark] = useState(() =>
    document.documentElement.getAttribute('data-theme') === 'dark'
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!loading && entries.length > 0 && !hasScrolled.current) {
      hasScrolled.current = true
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'instant' })
      })
    }
  }, [loading, entries.length])

  if (error) return <div className="error-state">Error: {error}</div>

  return (
    <div className="journal-page">
      <header className="journal-header">
        <h1>Journal</h1>
        <SearchBar value={query} onChange={setQuery} />
        <button className="dark-toggle" onClick={() => setDark((d) => !d)} title="Toggle dark mode">
          {dark ? '☀' : '☾'}
        </button>
      </header>
      {loading ? (
        <div className="loading">Loading…</div>
      ) : (
        <EntryList
          ref={bottomRef}
          entries={entries}
          query={query}
          saveEntry={saveEntry}
        />
      )}
    </div>
  )
}
