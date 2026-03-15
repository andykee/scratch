import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase

_DB_PATH = os.path.join(os.path.dirname(__file__), "journal.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{_DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from backend.models import Entry  # noqa: F401
    Base.metadata.create_all(bind=engine)

    with engine.connect() as conn:
        conn.execute(text("""
            CREATE VIRTUAL TABLE IF NOT EXISTS entries_fts USING fts5(
                date UNINDEXED,
                text_content,
                content='entries',
                content_rowid='id'
            )
        """))
        conn.commit()
