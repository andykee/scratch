import { useEffect, useRef, useState } from 'react'
import { SearchBar } from './SearchBar'
import { EntryList } from './EntryList'
import { useEntries } from '../hooks/useEntries'

export function ScratchPage() {
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
    <div className="scratch-page">
      <header className="scratch-header">
        <h1>Scratch</h1>
        <SearchBar value={query} onChange={setQuery} />
        <button className="dark-toggle" onClick={() => setDark((d) => !d)} title="Toggle dark mode">
          {dark ? (
            <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="5" fill="currentColor"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
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
