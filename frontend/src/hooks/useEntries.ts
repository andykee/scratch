import { useState, useCallback } from 'react'
import { api } from '../api/client'
import type { Entry } from '../types'

export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      await api.upsertToday()
      const all = await api.getAllEntries()
      setEntries(all)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load entries')
    } finally {
      setLoading(false)
    }
  }, [])

  const saveEntry = useCallback(async (date: string, content: string) => {
    await api.updateEntry(date, content)
  }, [])

  return { entries, loading, error, load, saveEntry }
}
