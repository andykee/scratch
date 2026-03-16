import type { Entry } from '../types'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`)
  }
  return res.json()
}

export const api = {
  upsertToday: () =>
    request<Entry>('/api/entries/today', { method: 'POST' }),

  getAllEntries: () =>
    request<Entry[]>('/api/entries'),

  updateEntry: (date: string, content: string) =>
    request<Entry>(`/api/entries/${date}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    }),

  search: (q: string) =>
    request<Entry[]>(`/api/entries/search?q=${encodeURIComponent(q)}`),

  deleteEntry: (date: string) =>
    fetch(`/api/entries/${date}`, { method: 'DELETE' }),
}
