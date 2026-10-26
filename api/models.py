"""
models.py — SQLAlchemy ORM models for SAKSHI.

Privacy covenant: no column in any table stores a raw student ID,
name, date of birth, Aadhaar, email, or phone number. The only
student identifier allowed here is `student_token` — a one-way
HMAC derived in tokenizer.py.

If you find yourself wanting to add a "name" or "apaar_id" column,
that's a sign the design needs rethinking, not the models.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Institutions & Programmes
# ---------------------------------------------------------------------------

class Institution(Base):
    __tablename__ = "institutions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    aicte_perm_id: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    state: Mapped[str] = mapped_column(String(64), nullable=False)
    institution_type: Mapped[str] = mapped_column(String(64), nullable=False)  # "degree", "diploma", etc.
    region: Mapped[str] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    programs: Mapped[list[Program]] = relationship("Program", back_populates="institution")
    batches: Mapped[list[Batch]] = relationship("Batch", back_populates="institution")
    enrolments: Mapped[list[Enrolment]] = relationship("Enrolment", back_populates="institution")


class Program(Base):
    __tablename__ = "programs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    institution_id: Mapped[int] = mapped_column(ForeignKey("institutions.id"), nullable=False)
    course: Mapped[str] = mapped_column(String(128), nullable=False)   # "B.Tech CSE"
    level: Mapped[str] = mapped_column(String(32), nullable=False)     # "UG", "PG"
    mode: Mapped[str] = mapped_column(String(32), nullable=False)      # "regular", "distance"
    affiliating_body: Mapped[str] = mapped_column(String(128), nullable=True)

    institution: Mapped[Institution] = relationship("Institution", back_populates="programs")
    intake_approvals: Mapped[list[IntakeApproval]] = relationship("IntakeApproval", back_populates="program")
    enrolments: Mapped[list[Enrolment]] = relationship("Enrolment", back_populates="program")
    credentials: Mapped[list[Credential]] = relationship("Credential", back_populates="program")
    daily_counts: Mapped[list[DailySeatCount]] = relationship("DailySeatCount", back_populates="program")


class IntakeApproval(Base):
    """AICTE-approved seat intake for a programme in a given year."""
    __tablename__ = "intake_approvals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    program_id: Mapped[int] = mapped_column(ForeignKey("programs.id"), nullable=False)
    academic_year: Mapped[int] = mapped_column(Integer, nullable=False)
    approved_intake: Mapped[int] = mapped_column(Integer, nullable=False)
    # Track which version of counting rules produced this approval record.
    counting_rule_version: Mapped[str] = mapped_column(String(16), nullable=True)

    program: Mapped[Program] = relationship("Program", back_populates="intake_approvals")


# ---------------------------------------------------------------------------
# Batch Upload
# ---------------------------------------------------------------------------

class Batch(Base):
    """One CSV upload session from an institution."""
    __tablename__ = "batches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    institution_id: Mapped[int] = mapped_column(ForeignKey("institutions.id"), nullable=False)
    uploaded_by_role: Mapped[str] = mapped_column(String(32), nullable=False)
    cohort_year: Mapped[int] = mapped_column(Integer, nullable=False)
    rows_total: Mapped[int] = mapped_column(Integer, default=0)
    rows_accepted: Mapped[int] = mapped_column(Integer, default=0)
    rows_rejected: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(16), default="processing")  # processing/done/failed
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    institution: Mapped[Institution] = relationship("Institution", back_populates="batches")
    findings: Mapped[list[BatchFinding]] = relationship("BatchFinding", back_populates="batch")
    enrolments: Mapped[list[Enrolment]] = relationship("Enrolment", back_populates="batch")


class BatchFinding(Base):
    """
    Row-level finding from ingestion. Stores the row number and an error
    code — never the actual ID value from that row.
    """
    __tablename__ = "batch_findings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    batch_id: Mapped[int] = mapped_column(ForeignKey("batches.id"), nullable=False)
    row_no: Mapped[int] = mapped_column(Integer, nullable=False)
    code: Mapped[str] = mapped_column(String(32), nullable=False)    # "INVALID_ID", "OPTED_OUT", etc.
    message: Mapped[str] = mapped_column(String(256), nullable=False)

    batch: Mapped[Batch] = relationship("Batch", back_populates="findings")


# ---------------------------------------------------------------------------
# Enrolment (core fact table)
# ---------------------------------------------------------------------------

class Enrolment(Base):
    """
    A single student-seat record. The student is identified only by
    their token — no name, no raw ID, no contact details.
    """
    __tablename__ = "enrolments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    institution_id: Mapped[int] = mapped_column(ForeignKey("institutions.id"), nullable=False)
    program_id: Mapped[int] = mapped_column(ForeignKey("programs.id"), nullable=False)
    cohort_year: Mapped[int] = mapped_column(Integer, nullable=False)
    student_token: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    id_type: Mapped[str] = mapped_column(String(16), nullable=False)       # APAAR / INST / OTHER
    assurance_tier: Mapped[str] = mapped_column(String(16), nullable=False)  # verified / attested / pending
    mode: Mapped[str] = mapped_column(String(32), nullable=False)           # regular / distance / part_time
    seat_category: Mapped[str] = mapped_column(String(32), nullable=True)   # GEN / OBC / SC / ST
    status: Mapped[str] = mapped_column(String(16), default="active")       # active / disputed / revoked
    batch_id: Mapped[int | None] = mapped_column(ForeignKey("batches.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    institution: Mapped[Institution] = relationship("Institution", back_populates="enrolments")
    program: Mapped[Program] = relationship("Program", back_populates="enrolments")
    batch: Mapped[Batch | None] = relationship("Batch", back_populates="enrolments")

    __table_args__ = (
        # Speeds up cross-institution duplicate checks (R1)
        Index("ix_enrolment_token_cohort", "student_token", "cohort_year"),
        # Speeds up intake overrun checks (R3)
        Index("ix_enrolment_inst_prog_cohort", "institution_id", "program_id", "cohort_year"),
    )


# ---------------------------------------------------------------------------
# Consent
# ---------------------------------------------------------------------------

class Consent(Base):
    """
    Records a student's consent decision.
    Linked via student_token, not a raw identifier.
    """
    __tablename__ = "consents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_token: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    purpose: Mapped[str] = mapped_column(String(64), nullable=False)   # "enrolment_verification"
    status: Mapped[str] = mapped_column(String(16), default="active")  # active / withdrawn
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    withdrawn_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


# ---------------------------------------------------------------------------
# Rule Engine
# ---------------------------------------------------------------------------

class RuleVersion(Base):
    """
    Stores versioned parameter sets for detection rules.
    Changing thresholds produces a new version so old flags are traceable.
    """
    __tablename__ = "rule_versions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    rule_id: Mapped[str] = mapped_column(String(8), nullable=False)   # "R1", "R2", …
    params_json: Mapped[str] = mapped_column(Text, nullable=False)    # JSON blob of thresholds
    created_by: Mapped[str] = mapped_column(String(64), nullable=True)
    active_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class Flag(Base):
    """
    An anomaly detected by the rule engine. Never stores a name or raw ID.
    institution_ids_json holds a JSON list of integer institution IDs.
    """
    __tablename__ = "flags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    rule_id: Mapped[str] = mapped_column(String(8), nullable=False)
    rule_version: Mapped[str] = mapped_column(String(16), nullable=True)
    severity: Mapped[str] = mapped_column(String(8), nullable=False)    # high / medium / low
    state: Mapped[str] = mapped_column(String(16), default="open")      # open / under_review / resolved / dismissed
    institution_ids_json: Mapped[str] = mapped_column(Text, nullable=False)  # "[1, 2]"
    student_token_ref: Mapped[str | None] = mapped_column(String(32), index=True, nullable=True)
    evidence_json: Mapped[str] = mapped_column(Text, nullable=False)    # supporting stats
    explanation: Mapped[str] = mapped_column(Text, nullable=False)      # plain-English reason
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    cases: Mapped[list[Case]] = relationship("Case", back_populates="flag")


class Case(Base):
    """An investigation case opened from a flag."""
    __tablename__ = "cases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    flag_id: Mapped[int] = mapped_column(ForeignKey("flags.id"), nullable=False)
    assignee: Mapped[str | None] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(String(16), default="open")  # open / pending / closed
    notes_json: Mapped[str] = mapped_column(Text, default="[]")
    due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    outcome: Mapped[str | None] = mapped_column(String(64), nullable=True)

    flag: Mapped[Flag] = relationship("Flag", back_populates="cases")
    reveal_requests: Mapped[list[RevealRequest]] = relationship("RevealRequest", back_populates="case")


class RevealRequest(Base):
    """
    A formal, audited request to reveal a student identity.
    Requires bilateral consent from both institutions involved.
    """
    __tablename__ = "reveal_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), nullable=False)
    requested_by: Mapped[str] = mapped_column(String(64), nullable=False)
    approved_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    reason_code: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(16), default="pending")
    institution_responses_json: Mapped[str] = mapped_column(Text, default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    case: Mapped[Case] = relationship("Case", back_populates="reveal_requests")


# ---------------------------------------------------------------------------
# Integrity Score
# ---------------------------------------------------------------------------

class IntegrityScore(Base):
    """Computed per institution-program-year. Never touches student data directly."""
    __tablename__ = "integrity_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    institution_id: Mapped[int] = mapped_column(ForeignKey("institutions.id"), nullable=False)
    program_id: Mapped[int] = mapped_column(ForeignKey("programs.id"), nullable=False)
    academic_year: Mapped[int] = mapped_column(Integer, nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    components_json: Mapped[str] = mapped_column(Text, nullable=False)  # breakdown dict
    explanation: Mapped[str] = mapped_column(Text, nullable=False)      # plain-English
    rule_version: Mapped[str] = mapped_column(String(16), nullable=True)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


# ---------------------------------------------------------------------------
# Student Dispute
# ---------------------------------------------------------------------------

class StudentDispute(Base):
    """
    A student's "this is not me" claim. We never store the student's
    personal details — only the token and the nature of the dispute.
    """
    __tablename__ = "student_disputes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_token: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    institution_id: Mapped[int] = mapped_column(ForeignKey("institutions.id"), nullable=False)
    dispute_type: Mapped[str] = mapped_column(String(32), nullable=False)  # "ghost_enrolment", "wrong_programme"
    status: Mapped[str] = mapped_column(String(16), default="open")
    signature: Mapped[str | None] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


# ---------------------------------------------------------------------------
# Audit Log (hash-chained)
# ---------------------------------------------------------------------------

class AuditLog(Base):
    """
    Append-only, hash-chained audit trail.
    Each row's entry_hash covers (prev_hash + ts + actor + action + payload_hash).
    Tamper with any row and the chain breaks.
    """
    __tablename__ = "audit_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    actor_id: Mapped[str] = mapped_column(String(64), nullable=False)
    actor_role: Mapped[str] = mapped_column(String(32), nullable=False)
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    object_type: Mapped[str] = mapped_column(String(64), nullable=True)
    object_id: Mapped[str] = mapped_column(String(64), nullable=True)
    payload_hash: Mapped[str] = mapped_column(String(64), nullable=False)  # SHA-256 hex of payload JSON
    prev_hash: Mapped[str] = mapped_column(String(64), nullable=False)     # entry_hash of preceding row
    entry_hash: Mapped[str] = mapped_column(String(64), nullable=False)    # this row's hash


class AuditRoot(Base):
    """Daily Merkle root of all audit entries, signed with Ed25519."""
    __tablename__ = "audit_roots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    date: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)  # "YYYY-MM-DD"
    merkle_root: Mapped[str] = mapped_column(String(64), nullable=False)
    signature: Mapped[str] = mapped_column(Text, nullable=False)  # base64 Ed25519 sig


# ---------------------------------------------------------------------------
# Credentials (verifiable enrolment proof)
# ---------------------------------------------------------------------------

class Credential(Base):
    """
    A signed enrolment credential. The JWS payload proves the enrolment
    without revealing any student PII — only the token, program, and year.
    """
    __tablename__ = "credentials"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_token: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    program_id: Mapped[int] = mapped_column(ForeignKey("programs.id"), nullable=False)
    cohort_year: Mapped[int] = mapped_column(Integer, nullable=False)
    credential_handle: Mapped[str] = mapped_column(String(16), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String(16), default="active")  # active / revoked / expired
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    key_id: Mapped[str] = mapped_column(String(32), nullable=True)
    jws_payload: Mapped[str] = mapped_column(Text, nullable=False)  # signed JWT string

    program: Mapped[Program] = relationship("Program", back_populates="credentials")
    status_entries: Mapped[list[CredentialStatusEntry]] = relationship(
        "CredentialStatusEntry", back_populates="credential"
    )
    verifications: Mapped[list[VerificationEvent]] = relationship(
        "VerificationEvent", back_populates="credential"
    )

    __table_args__ = (
        Index("ix_credential_handle", "credential_handle"),
    )


class CredentialStatusEntry(Base):
    """Revocation record for a credential."""
    __tablename__ = "credential_status_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    credential_id: Mapped[int] = mapped_column(ForeignKey("credentials.id"), nullable=False)
    revoked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    reason: Mapped[str] = mapped_column(String(128), nullable=True)

    credential: Mapped[Credential] = relationship("Credential", back_populates="status_entries")


class VerificationEvent(Base):
    """
    Every time someone verifies a credential, we log who, why, and the result.
    This feeds the student's "who accessed my record" citizen window.
    """
    __tablename__ = "verification_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    credential_id: Mapped[int] = mapped_column(ForeignKey("credentials.id"), nullable=False)
    verifier_role: Mapped[str] = mapped_column(String(32), nullable=False)
    purpose_code: Mapped[str] = mapped_column(String(32), nullable=False)  # "employer_bgv", "transfer", etc.
    result: Mapped[str] = mapped_column(String(16), nullable=False)         # "valid" / "invalid"
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    credential: Mapped[Credential] = relationship("Credential", back_populates="verifications")


# ---------------------------------------------------------------------------
# Daily Seat Count (snapshot for reporting)
# ---------------------------------------------------------------------------

class DailySeatCount(Base):
    """
    A daily snapshot of seat counts per programme — no student-level data,
    just aggregate numbers for trend tracking.
    """
    __tablename__ = "daily_seat_counts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    program_id: Mapped[int] = mapped_column(ForeignKey("programs.id"), nullable=False)
    snapshot_date: Mapped[str] = mapped_column(String(10), nullable=False)  # "YYYY-MM-DD"
    reported: Mapped[int] = mapped_column(Integer, default=0)
    verified: Mapped[int] = mapped_column(Integer, default=0)
    attested: Mapped[int] = mapped_column(Integer, default=0)
    pending: Mapped[int] = mapped_column(Integer, default=0)

    program: Mapped[Program] = relationship("Program", back_populates="daily_counts")
