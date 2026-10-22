"""
tokenizer.py — The single gate where a raw student ID is ever handled.

Design principle: this module is a one-way door. A raw ID enters,
a token exits, and the raw ID is immediately discarded. No other
module in this codebase should ever receive, store, or log a raw ID.

In production, SAKSHI_TOKEN_SECRET would come from a KMS/HSM.
The per-cohort key derivation means a token from 2023 cannot be
reused to cross-reference a 2022 record without the old cohort key.
"""

import hmac
import hashlib
import base64
import os


# This should be injected via environment in prod — never hardcode in a real deploy.
_MASTER_SECRET = os.environ.get("SAKSHI_TOKEN_SECRET", "sakshi-dev-secret-change-in-prod")


def cohort_key(cohort_year: int) -> bytes:
    """
    Derive a stable per-year HMAC key from the master secret.

    Using a cohort-scoped key ensures that even if one year's
    tokens are somehow compromised, other years remain isolated.
    In production: fetch a year-specific key from KMS instead.
    """
    return hmac.new(
        _MASTER_SECRET.encode("utf-8"),
        f"cohort:{cohort_year}".encode("utf-8"),
        hashlib.sha256,
    ).digest()


def tokenize(raw_id: str, id_type: str, cohort_year: int) -> str:
    """
    Produce a deterministic, opaque token for a student identity.

    The token is 16 characters of base32 — short enough to display,
    long enough to be collision-resistant for millions of records.

    Args:
        raw_id:      The raw APAAR / institution ID (never stored after this call).
        id_type:     One of 'APAAR', 'INST', 'OTHER'.
        cohort_year: Academic year (e.g. 2024).

    Returns:
        A base32 string that uniquely represents this identity for this cohort.
    """
    key = cohort_key(cohort_year)
    # Prefix the id_type so APAAR:X and INST:X produce different tokens
    # even if the underlying numeric value happens to be the same.
    msg = f"{id_type.upper()}:{raw_id.strip()}".encode("utf-8")
    digest = hmac.new(key, msg, hashlib.sha256).digest()
    # Take first 10 bytes → 80 bits of entropy → ~1.2e24 possible tokens.
    # Sufficient for any realistic student population.
    return base64.b32encode(digest[:10]).decode("ascii").rstrip("=")


def mask_id(raw_id: str) -> str:
    """
    Return a log-safe placeholder. Call this when you need to write
    *something* to a log that references an ID — never the real value.

    Example: mask_id("123456789012") → "[ID-REDACTED-12chars]"
    """
    return f"[ID-REDACTED-{len(raw_id)}chars]"
