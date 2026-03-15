export interface Entry {
  id: number
  date: string
  content: string
  created_at: string
  updated_at: string
}

export interface SearchResult extends Entry {
  snippet: string
}
