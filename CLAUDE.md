# Journal App

Personal journal/scratchpad/todo web app. Single-user, local-first.

## Stack

- **Backend:** Python + FastAPI + SQLAlchemy + SQLite (FTS5 for search)
- **Frontend:** React 18 + TypeScript + Vite 5 + Tiptap 2

## Running

```bash
./start.sh
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Swagger: http://localhost:8000/docs

`start.sh` creates the Python venv, installs deps, and starts both servers. Kill with Ctrl+C.

## Project Structure

```
backend/
  main.py          # FastAPI app, CORS, startup DB init
  database.py      # SQLAlchemy engine, session factory, FTS5 init
  models.py        # Entry ORM model
  schemas.py       # Pydantic schemas
  routers/
    entries.py     # All /api/entries routes
  journal.db       # SQLite database (gitignored)
  .venv/           # Python virtualenv (gitignored)

frontend/
  vite.config.ts   # Proxies /api → http://127.0.0.1:8000
  src/
    api/client.ts          # fetch wrapper (relative URLs via Vite proxy)
    hooks/useEntries.ts    # data fetching, today-init, saveEntry
    components/
      JournalPage.tsx      # layout, search state, scroll-to-bottom
      SearchBar.tsx        # controlled input + clear button
      EntryList.tsx        # maps entries → EntryBlock, client-side filter
      EntryBlock.tsx       # date heading + debounced save + TiptapEditor
      TiptapEditor.tsx     # Tiptap editor instance
    types/index.ts

start.sh           # single command to start everything
```

## API

All routes under `/api/entries`. Route order matters — `/today` and `/search` are registered before `/{date}`.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/entries` | All entries, date ASC |
| POST | `/api/entries/today` | Idempotent upsert for today |
| GET | `/api/entries/search?q=` | FTS5 search |
| GET | `/api/entries/{date}` | Single entry by date |
| POST | `/api/entries` | Create entry |
| PUT | `/api/entries/{date}` | Update content (auto-save target) |

## Key Decisions

- **Vite proxy uses `127.0.0.1`, not `localhost`** — Node 18 resolves `localhost` to `::1` (IPv6) but uvicorn binds to IPv4, causing ECONNREFUSED.
- **Tiptap content stored as JSON string** in SQLite; pass `JSON.parse(entry.content)` (object, not string) to the `content` prop — Tiptap treats strings as HTML.
- **`key={entry.date}` on EntryBlock** — gives each day its own editor instance.
- **Auto-save debounce:** 1500ms after last keystroke via `useRef` timeout; does not update local state from save response (would fight the editor cursor).
- **Scroll to bottom:** uses `behavior: 'instant'` (not `'smooth'`) on initial load.
- **Search is client-side** (`useMemo` filter over loaded entries). FTS5 backend endpoint exists for future ranked/snippet results.
- **FTS5 index updated explicitly** in the PUT handler — Python extracts plain text from Tiptap JSON before writing. No SQL triggers.
- **DB path is absolute** (`__file__`-relative) so it always lands in `backend/journal.db` regardless of working directory.

## Database Schema

```sql
CREATE TABLE entries (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    date       TEXT NOT NULL UNIQUE,   -- "YYYY-MM-DD"
    content    TEXT NOT NULL DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE VIRTUAL TABLE entries_fts USING fts5(
    date UNINDEXED,
    text_content,
    content='entries',
    content_rowid='id'
);
```
