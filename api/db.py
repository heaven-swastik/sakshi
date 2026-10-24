"""
db.py — SQLAlchemy database setup for SAKSHI.

Using SQLite for the demo. In a production deployment this would
point at PostgreSQL with row-level security enabled.

The DB file lives at the project root so the seed script and the
API server both hit the same file without extra config.
"""

import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# Walk up from api/ to the project root, then place the DB there.
_PROJECT_ROOT = Path(__file__).resolve().parent.parent
_DB_PATH = _PROJECT_ROOT / "sakshi.db"

_ENV_DB_URL = os.getenv("DATABASE_URL")
if _ENV_DB_URL:
    db_url = _ENV_DB_URL
else:
    db_url = f"sqlite:///{_DB_PATH}"

connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}

# check_same_thread=False is needed because FastAPI runs handlers
# in a thread pool and SQLite's default is to restrict to one thread.
engine = create_engine(
    db_url,
    connect_args=connect_args,
    echo=False,  # flip to True to debug SQL queries during dev
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Shared declarative base. All models inherit from this."""
    pass


def get_db():
    """
    FastAPI dependency that yields a DB session and ensures it's
    closed even if the route handler raises an exception.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
