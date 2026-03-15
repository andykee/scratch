from sqlalchemy import Column, Integer, String
from backend.database import Base

DEFAULT_CONTENT = '{"type":"doc","content":[{"type":"paragraph"}]}'

class Entry(Base):
    __tablename__ = "entries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(String, nullable=False, unique=True)
    content = Column(String, nullable=False, default=DEFAULT_CONTENT)
    created_at = Column(String, nullable=False)
    updated_at = Column(String, nullable=False)
