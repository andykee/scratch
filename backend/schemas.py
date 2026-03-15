from pydantic import BaseModel
from typing import Optional

class EntryBase(BaseModel):
    date: str
    content: str

class EntryCreate(BaseModel):
    date: str
    content: Optional[str] = '{"type":"doc","content":[{"type":"paragraph"}]}'

class EntryUpdate(BaseModel):
    content: str

class EntryResponse(BaseModel):
    id: int
    date: str
    content: str
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}

class SearchResult(BaseModel):
    id: int
    date: str
    content: str
    snippet: str
    created_at: str
    updated_at: str
