"""
audit_log.py — Hash-chained, append-only audit trail.

Every write produces a new entry whose hash covers the previous entry's
hash. Any retroactive edit to any row will cause verify_chain() to
detect the break — the chain is only as trustworthy as the DB file,
but for a demo this provides meaningful tamper-evidence.

In production you'd additionally anchor the daily Merkle root to a
public ledger or a timestamping authority (RFC 3161).
"""

import hashlib
import json
import base64
from datetime import datetime, timezone, date

from sqlalchemy.orm import Session

from models import AuditLog, AuditRoot


# Sentinel value for the very first entry (no predecessor)
_GENESIS_HASH = "0" * 64


def _sha256_hex(data: str) -> str:
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


def _ts_str(dt: datetime) -> str:
    """Ensure consistent ISO representation across DB roundtrips."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def _compute_entry_hash(
    prev_hash: str,
    ts: str,
    actor_id: str,
    action: str,
    payload_hash: str,
) -> str:
    """
    Deterministic hash of one audit entry's identifying fields.
    The formula is fixed — changing it would break chain verification
    for historical entries.
    """
    canonical = f"{prev_hash}|{ts}|{actor_id}|{action}|{payload_hash}"
    return _sha256_hex(canonical)


def append_audit(
    db: Session,
    actor_id: str,
    actor_role: str,
    action: str,
    object_type: str,
    object_id: str,
    payload: dict,
) -> AuditLog:
    """
    Write one audit entry and return it.

    The payload dict may contain context about what happened but must
    never include raw student IDs — use tokens or redacted references.
    """
    # Lock-free in SQLite; in Postgres you'd SELECT FOR UPDATE on the last row.
    last = db.query(AuditLog).order_by(AuditLog.id.desc()).first()
    prev_hash = last.entry_hash if last else _GENESIS_HASH

    now = datetime.now(timezone.utc)
    ts_str = _ts_str(now)
    payload_hash = _sha256_hex(json.dumps(payload, sort_keys=True))
    entry_hash = _compute_entry_hash(prev_hash, ts_str, actor_id, action, payload_hash)

    entry = AuditLog(
        ts=now,
        actor_id=actor_id,
        actor_role=actor_role,
        action=action,
        object_type=object_type,
        object_id=str(object_id),
        payload_hash=payload_hash,
        prev_hash=prev_hash,
        entry_hash=entry_hash,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def verify_chain(db: Session) -> dict:
    """
    Walk every audit entry in insertion order and verify the hash chain.

    Returns:
        {valid: bool, entries_checked: int, first_bad_index: int | None}
    """
    entries = db.query(AuditLog).order_by(AuditLog.id.asc()).all()

    if not entries:
        return {"valid": True, "entries_checked": 0, "first_bad_index": None}

    expected_prev = _GENESIS_HASH
    for idx, entry in enumerate(entries):
        if entry.prev_hash != expected_prev:
            return {"valid": False, "entries_checked": idx, "first_bad_index": idx}

        # Recompute and compare this entry's hash
        recomputed = _compute_entry_hash(
            entry.prev_hash,
            _ts_str(entry.ts),
            entry.actor_id,
            entry.action,
            entry.payload_hash,
        )
        if recomputed != entry.entry_hash:
            return {"valid": False, "entries_checked": idx + 1, "first_bad_index": idx}

        expected_prev = entry.entry_hash

    return {"valid": True, "entries_checked": len(entries), "first_bad_index": None}


def _merkle_root(hashes: list[str]) -> str:
    """Standard binary Merkle tree. Returns root hash."""
    if not hashes:
        return _sha256_hex("empty")
    layer = list(hashes)
    while len(layer) > 1:
        next_layer = []
        for i in range(0, len(layer), 2):
            left = layer[i]
            right = layer[i + 1] if i + 1 < len(layer) else left  # duplicate last if odd
            next_layer.append(_sha256_hex(left + right))
        layer = next_layer
    return layer[0]


def daily_root(db: Session) -> dict:
    """
    Compute today's Merkle root over all audit entries created today,
    sign it with the Ed25519 credential key, and persist to AuditRoot.

    Returns the root hash and signature.
    """
    from credentials import get_signing_key  # local import to avoid circular deps

    today_str = date.today().isoformat()
    today_entries = (
        db.query(AuditLog)
        .filter(AuditLog.ts >= f"{today_str}T00:00:00+00:00")
        .order_by(AuditLog.id.asc())
        .all()
    )

    hashes = [e.entry_hash for e in today_entries]
    root = _merkle_root(hashes)

    # Sign the root hash with Ed25519
    private_key = get_signing_key()
    sig_bytes = private_key.sign(root.encode("utf-8"))
    sig_b64 = base64.b64encode(sig_bytes).decode("ascii")

    # Upsert — idempotent if called multiple times in one day
    existing = db.query(AuditRoot).filter(AuditRoot.date == today_str).first()
    if existing:
        existing.merkle_root = root
        existing.signature = sig_b64
    else:
        db.add(AuditRoot(date=today_str, merkle_root=root, signature=sig_b64))

    db.commit()
    return {"date": today_str, "merkle_root": root, "entries": len(hashes)}
