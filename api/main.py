"""
main.py — SAKSHI FastAPI application entry point.

Wires up all routers, middleware, and the startup hook that initialises
the database. The description in the OpenAPI spec is intentionally
plain English — it's shown to regulators who evaluate the system.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db import engine, SessionLocal
from models import Base

# Routers
from auth import router as auth_router
from mock_registry import router as mock_registry_router
from routes.batches import router as batches_router
from routes.regulator import router as regulator_router
from routes.student import router as student_router
from routes.credentials import router as credentials_router
from routes.admin import router as admin_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger("sakshi")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Create all DB tables on startup (safe — SQLAlchemy skips tables that
    already exist). For a production system you'd use Alembic migrations.
    """
    logger.info("SAKSHI starting — creating database tables if needed")
    Base.metadata.create_all(bind=engine)

    # Warm the signing key cache so the first request doesn't pay the
    # file-read penalty (also generates the key if this is a fresh install)
    from credentials import get_signing_key
    get_signing_key()
    logger.info("Signing key ready")

    yield

    logger.info("SAKSHI shutting down")


app = FastAPI(
    title="SAKSHI",
    version="0.1.0",
    description=(
        "Student Assurance & Knowledge Shield for Higher education Integrity. "
        "A privacy-first enrolment verification platform that detects ghost enrolments, "
        "cross-institution duplicates, and intake overruns — without ever storing "
        "a student's name, date of birth, or raw APAAR ID."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — open for the demo frontend; tighten in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers
app.include_router(auth_router)
app.include_router(mock_registry_router)
app.include_router(batches_router)
app.include_router(regulator_router)
app.include_router(student_router)
app.include_router(credentials_router)
app.include_router(admin_router)


@app.get("/", include_in_schema=False)
def root():
    return {
        "service": "SAKSHI",
        "version": "0.1.0",
        "docs": "/docs",
        "privacy_proof": "/v1/system/privacy-proof",
    }


@app.get("/health", include_in_schema=False)
def health():
    return {"status": "ok"}
