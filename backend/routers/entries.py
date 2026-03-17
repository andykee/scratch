import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.database import get_db
from backend.models import Entry
from backend.schemas import EntryCreate, EntryUpdate, EntryResponse, SearchResult

router = APIRouter(prefix="/api/entries", tags=["entries"])

DEFAULT_CONTENT = '{"type":"doc","content":[{"type":"paragraph"}]}'

def now_utc() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

def now_str() -> str:
    return datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

def extract_text(content_json: str) -> str:
    """Walk Tiptap JSON and collect all text node values."""
    try:
        doc = json.loads(content_json)
    except (json.JSONDecodeError, TypeError):
        return ""

    texts = []

    def walk(node):
        if isinstance(node, dict):
            if node.get("type") == "text":
                texts.append(node.get("text", ""))
            elif node.get("type") == "meetingHeader":
                attrs = node.get("attrs", {})
                if attrs.get("time"):
                    texts.append(attrs["time"])
                if attrs.get("name"):
                    texts.append(attrs["name"])
            for child in node.get("content", []):
                walk(child)
        elif isinstance(node, list):
            for item in node:
                walk(item)

    walk(doc)
    return " ".join(texts)


@router.get("", response_model=list[EntryResponse])
def get_all_entries(db: Session = Depends(get_db)):
    entries = db.query(Entry).order_by(Entry.date.asc()).all()
    return entries


@router.post("/today", response_model=EntryResponse)
def upsert_today(db: Session = Depends(get_db)):
    today = datetime.now().strftime("%Y-%m-%d")
    entry = db.query(Entry).filter(Entry.date == today).first()
    if entry is None:
        try:
            now = now_str()
            entry = Entry(
                date=today,
                content=DEFAULT_CONTENT,
                created_at=now,
                updated_at=now,
            )
            db.add(entry)
            db.commit()
            db.refresh(entry)
        except IntegrityError:
            db.rollback()
            entry = db.query(Entry).filter(Entry.date == today).first()
    return entry


@router.get("/search", response_model=list[SearchResult])
def search_entries(q: str, db: Session = Depends(get_db)):
    if not q:
        return []

    try:
        results = db.execute(
            text("""
                SELECT e.id, e.date, e.content, e.created_at, e.updated_at,
                       snippet(entries_fts, 1, '<mark>', '</mark>', '...', 20) as snippet
                FROM entries_fts
                JOIN entries e ON e.id = entries_fts.rowid
                WHERE entries_fts MATCH :q
                ORDER BY rank
            """),
            {"q": q}
        ).fetchall()

        return [
            SearchResult(
                id=r.id,
                date=r.date,
                content=r.content,
                snippet=r.snippet,
                created_at=r.created_at,
                updated_at=r.updated_at,
            )
            for r in results
        ]
    except Exception:
        # Fallback to LIKE search if FTS fails
        like_q = f"%{q}%"
        entries = db.query(Entry).filter(Entry.content.like(like_q)).all()
        return [
            SearchResult(
                id=e.id,
                date=e.date,
                content=e.content,
                snippet="",
                created_at=e.created_at,
                updated_at=e.updated_at,
            )
            for e in entries
        ]


@router.get("/{date}", response_model=EntryResponse)
def get_entry(date: str, db: Session = Depends(get_db)):
    entry = db.query(Entry).filter(Entry.date == date).first()
    if entry is None:
        raise HTTPException(status_code=404, detail="Entry not found")
    return entry


@router.post("", response_model=EntryResponse)
def create_entry(body: EntryCreate, db: Session = Depends(get_db)):
    existing = db.query(Entry).filter(Entry.date == body.date).first()
    if existing:
        raise HTTPException(status_code=409, detail="Entry for this date already exists")
    now = now_str()
    entry = Entry(
        date=body.date,
        content=body.content or DEFAULT_CONTENT,
        created_at=now,
        updated_at=now,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{date}", status_code=204)
def delete_entry(date: str, db: Session = Depends(get_db)):
    entry = db.query(Entry).filter(Entry.date == date).first()
    if entry is None:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.execute(text("DELETE FROM entries_fts WHERE rowid = :rowid"), {"rowid": entry.id})
    db.delete(entry)
    db.commit()


@router.put("/{date}", response_model=EntryResponse)
def update_entry(date: str, body: EntryUpdate, db: Session = Depends(get_db)):
    entry = db.query(Entry).filter(Entry.date == date).first()
    if entry is None:
        raise HTTPException(status_code=404, detail="Entry not found")

    entry.content = body.content
    entry.updated_at = now_str()
    db.commit()
    db.refresh(entry)

    # Update FTS index
    text_content = extract_text(body.content)
    try:
        db.execute(
            text("DELETE FROM entries_fts WHERE rowid = :rowid"),
            {"rowid": entry.id}
        )
        db.execute(
            text("INSERT INTO entries_fts(rowid, date, text_content) VALUES (:rowid, :date, :text_content)"),
            {"rowid": entry.id, "date": entry.date, "text_content": text_content}
        )
        db.commit()
    except Exception:
        pass  # FTS update failure is non-fatal

    return entry
