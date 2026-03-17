import { useState, useCallback } from 'react'
import { api } from '../api/client'
import type { Entry } from '../types'

const DEFAULT_CONTENT = '{"type":"doc","content":[{"type":"paragraph"}]}'

function isEmpty(content: string): boolean {
  try {
    const doc = JSON.parse(content)
    const nodes = doc?.content ?? []
    if (nodes.length === 0) return true
    // Non-empty if any node has content children or meaningful attrs
    return nodes.every((node: any) => {
      if (node.type === 'meetingHeader') return false
      const children = node.content ?? []
      return children.length === 0 || children.every((c: any) => c.type === 'text' && !c.text?.trim())
    })
  } catch {
    return content === DEFAULT_CONTENT
  }
}

export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const d = new Date()
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const load = useCallback(async () => {
    try {
      setLoading(true)
      await api.upsertToday()
      const all = await api.getAllEntries()

      // Delete empty non-today entries that already exist in the DB
      const toDelete = all.filter((e) => e.date !== today && isEmpty(e.content))
      await Promise.all(toDelete.map((e) => api.deleteEntry(e.date)))

      setEntries(all.filter((e) => !toDelete.some((d) => d.date === e.date)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load entries')
    } finally {
      setLoading(false)
    }
  }, [today])

  const saveEntry = useCallback(async (date: string, content: string) => {
    await api.updateEntry(date, content)
    if (date !== today && isEmpty(content)) {
      await api.deleteEntry(date)
      setEntries((prev) => prev.filter((e) => e.date !== date))
    } else {
      setEntries((prev) =>
        prev.map((e) => (e.date === date ? { ...e, content } : e))
      )
    }
  }, [today])

  return { entries, loading, error, load, saveEntry }
}
