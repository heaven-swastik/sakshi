"""
mock_registry.py — Simulated APAAR / identity registry.

In the real system this would be an authenticated call to the
DigiLocker / APAAR API. For the demo we deterministically decide
validity based on the ID prefix so the behaviour is predictable
during judging.

IMPORTANT: the raw ID is consumed here and never echoed back.
The response only tells us status and assurance tier.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/mock/apaar", tags=["mock-registry"])


def verify_with_registry(raw_id: str, id_type: str) -> dict:
    """
    Simulate a registry lookup.

    Returns a dict with 'status' and 'assurance_tier'.
    The raw_id is used only to determine the response — it is never
    included in the return value or logged.

    Status semantics:
        valid       → ID exists and the student has not opted out
        opted_out   → ID exists but student exercised opt-out right
        invalid     → ID does not exist in the registry
    """
    # We look only at the prefix, never storing or returning the full ID.
    if id_type.upper() == "INST":
        # Institution-issued IDs are always "attested" — the college
        # vouches for the student but APAAR hasn't verified them.
        return {"status": "valid", "assurance_tier": "attested"}

    prefix = raw_id.strip()[:3] if raw_id.strip() else ""

    if prefix == "999":
        # Opted-out students are lawfully excluded from verification.
        # This is not a fraud signal — respect their choice.
        return {"status": "opted_out", "assurance_tier": "pending"}

    if prefix == "000":
        # IDs starting with 000 are flagged as invalid in the registry.
        return {"status": "invalid", "assurance_tier": "pending"}

    # Everything else → successfully verified via APAAR
    return {"status": "valid", "assurance_tier": "verified"}


# ---------------------------------------------------------------------------
# HTTP endpoints (for demo / testing via browser or Postman)
# ---------------------------------------------------------------------------

@router.get("/status")
def registry_status_check(id_prefix: str, id_type: str = "APAAR"):
    """
    Demo endpoint: pass only the first 3 digits of an ID to simulate
    a registry check without submitting a full real ID.

    Example: GET /mock/apaar/status?id_prefix=123&id_type=APAAR
    """
    # Construct a fake full-length ID using only the prefix for the demo.
    # This way no real IDs ever need to be submitted to this endpoint.
    synthetic_id = id_prefix.ljust(12, "0")
    result = verify_with_registry(synthetic_id, id_type)
    # Return result as-is; the synthetic ID is not echoed.
    return result


@router.get("/health")
def registry_health():
    return {"mock_registry": "online", "note": "Simulated APAAR endpoint for demo use only"}
