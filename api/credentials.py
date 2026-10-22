"""
credentials.py — Ed25519-signed enrolment credentials + QR codes.

A credential is proof that a student was enrolled in a programme.
The credential payload never includes the student's name, date of birth,
or raw APAAR ID — only the token (a pseudonym) + programme details.

Verification is public and stateless: anyone with the handle can check
whether the credential is still active.
"""

import base64
import io
import json
import os
import secrets
import string
from datetime import datetime, timedelta, timezone
from pathlib import Path

import qrcode
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)
from sqlalchemy.orm import Session

from models import Credential, CredentialStatusEntry, Enrolment, Program, VerificationEvent

# Key file lives in the api/ directory alongside this module
_KEY_PATH = Path(__file__).parent / "credential_key.pem"
_VERIFY_BASE_URL = os.environ.get("SAKSHI_VERIFY_URL", "https://sakshi.demo/verify")

# Cache the loaded key in memory — we only want to read disk once
_private_key_cache: Ed25519PrivateKey | None = None


def get_signing_key() -> Ed25519PrivateKey:
    """
    Load (or generate) the Ed25519 signing key.

    On first run in dev: generates a new key and saves it to credential_key.pem.
    In production: set SAKSHI_CREDENTIAL_KEY env var to the PEM content,
    or mount the key file from a secrets manager.
    """
    global _private_key_cache
    if _private_key_cache is not None:
        return _private_key_cache

    # Check env var first (production path)
    pem_env = os.environ.get("SAKSHI_CREDENTIAL_KEY", "")
    if pem_env:
        _private_key_cache = serialization.load_pem_private_key(pem_env.encode(), password=None)
        return _private_key_cache

    # Fall back to key file
    if _KEY_PATH.exists():
        pem_bytes = _KEY_PATH.read_bytes()
        _private_key_cache = serialization.load_pem_private_key(pem_bytes, password=None)
        return _private_key_cache

    # Generate a fresh key for dev
    key = Ed25519PrivateKey.generate()
    pem = key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    _KEY_PATH.write_bytes(pem)
    _private_key_cache = key
    return key


def _get_public_key_b64() -> str:
    """Export the public key as base64 for inclusion in credential metadata."""
    pub: Ed25519PublicKey = get_signing_key().public_key()
    raw = pub.public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw,
    )
    return base64.b64encode(raw).decode("ascii")


def _generate_handle() -> str:
    """Short random handle for the credential (URL-safe, 12 chars)."""
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(12))


def _sign_payload(payload: dict) -> str:
    """
    Sign a dict payload with Ed25519 and return a compact JWS-like string:
        base64url(header).base64url(payload).base64url(signature)

    We use a simplified format (not full JWS) for demo readability.
    """
    key = get_signing_key()

    header = {"alg": "EdDSA", "kid": "sakshi-v1"}
    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload, sort_keys=True).encode()).decode().rstrip("=")

    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
    sig = key.sign(signing_input)
    sig_b64 = base64.urlsafe_b64encode(sig).decode().rstrip("=")

    return f"{header_b64}.{payload_b64}.{sig_b64}"


def _verify_jws(jws_string: str) -> dict | None:
    """
    Verify the JWS signature and return the payload dict, or None if invalid.
    """
    try:
        parts = jws_string.split(".")
        if len(parts) != 3:
            return None

        header_b64, payload_b64, sig_b64 = parts
        signing_input = f"{header_b64}.{payload_b64}".encode("ascii")

        # Pad base64 if needed (we stripped padding on creation)
        sig = base64.urlsafe_b64decode(sig_b64 + "==")

        pub_key: Ed25519PublicKey = get_signing_key().public_key()
        pub_key.verify(sig, signing_input)  # raises if invalid

        payload_json = base64.urlsafe_b64decode(payload_b64 + "==")
        return json.loads(payload_json)

    except Exception:
        return None


def issue_credential(
    student_token: str,
    program_id: int,
    cohort_year: int,
    assurance_tier: str,
    db: Session,
    issued_by: str = "system",
    validity_years: int = 5,
) -> dict:
    """
    Issue a signed enrolment credential.

    Returns a dict with: credential_id, handle, qr_b64 (PNG), jws.
    The student token is in the payload but no name or raw ID.
    """
    prog = db.get(Program, program_id)
    if not prog:
        raise ValueError(f"Programme {program_id} not found")

    handle = _generate_handle()
    now = datetime.now(timezone.utc)
    expires = now + timedelta(days=365 * validity_years)

    payload = {
        "credential_id": handle,
        "student_token": student_token,   # pseudonym — not a real ID
        "institution_aicte_id": prog.institution.aicte_perm_id if prog.institution else None,
        "programme": prog.course,
        "level": prog.level,
        "cohort_year": cohort_year,
        "assurance_tier": assurance_tier,
        "status": "active",
        "issued_at": now.isoformat(),
        "expires_at": expires.isoformat(),
        "issuer": "SAKSHI/AICTE",
    }

    jws = _sign_payload(payload)

    cred = Credential(
        student_token=student_token,
        program_id=program_id,
        cohort_year=cohort_year,
        credential_handle=handle,
        status="active",
        issued_at=now,
        expires_at=expires,
        key_id="sakshi-v1",
        jws_payload=jws,
    )
    db.add(cred)
    db.commit()
    db.refresh(cred)

    qr_b64 = _make_qr(handle)

    return {
        "credential_id": cred.id,
        "handle": handle,
        "programme": prog.course,
        "cohort_year": cohort_year,
        "assurance_tier": assurance_tier,
        "issued_at": now.isoformat(),
        "expires_at": expires.isoformat(),
        "verify_url": f"{_VERIFY_BASE_URL}/{handle}",
        "qr_b64": qr_b64,
        "jws": jws,
    }


def verify_credential(handle: str, purpose_code: str, verifier_role: str, db: Session) -> dict:
    """
    Public verification of a credential by handle.

    Logs the verification event for the student's citizen window.
    Returns minimal result: valid, status, programme, cohort_year.
    Never returns the student token or any raw identity.
    """
    cred = (
        db.query(Credential)
        .filter(Credential.credential_handle == handle)
        .first()
    )

    if not cred:
        return {"valid": False, "status": "not_found", "programme": None, "cohort_year": None}

    now = datetime.now(timezone.utc)

    # Check revocation first
    if cred.status == "revoked":
        result = "invalid"
        status_str = "revoked"
    elif cred.expires_at and now > cred.expires_at.replace(tzinfo=timezone.utc):
        result = "invalid"
        status_str = "expired"
    else:
        # Verify the cryptographic signature
        payload = _verify_jws(cred.jws_payload)
        if payload is None:
            result = "invalid"
            status_str = "tampered"
        else:
            result = "valid"
            status_str = "active"

    prog = db.get(Program, cred.program_id)

    # Log every verification event so the student can see who checked their credential
    db.add(VerificationEvent(
        credential_id=cred.id,
        verifier_role=verifier_role,
        purpose_code=purpose_code,
        result=result,
        ts=now,
    ))
    db.commit()

    return {
        "valid": result == "valid",
        "status": status_str,
        "programme": prog.course if prog else None,
        "cohort_year": cred.cohort_year,
        "assurance_tier": cred.jws_payload and json.loads(
            base64.urlsafe_b64decode(cred.jws_payload.split(".")[1] + "==")
        ).get("assurance_tier"),
    }


def revoke_credential(credential_id: int, reason: str, db: Session) -> dict:
    """Mark a credential as revoked and record the reason."""
    cred = db.get(Credential, credential_id)
    if not cred:
        raise ValueError(f"Credential {credential_id} not found")

    if cred.status == "revoked":
        return {"message": "Already revoked", "credential_id": credential_id}

    cred.status = "revoked"
    db.add(CredentialStatusEntry(
        credential_id=credential_id,
        revoked_at=datetime.now(timezone.utc),
        reason=reason,
    ))
    db.commit()
    return {"message": "Credential revoked", "credential_id": credential_id}


def _make_qr(handle: str) -> str:
    """Generate a QR code PNG encoding the verification URL. Returns base64."""
    url = f"{_VERIFY_BASE_URL}/{handle}"
    qr = qrcode.QRCode(version=1, box_size=8, border=2)
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("ascii")


def get_qr_for_credential(credential_id: int, db: Session) -> str:
    """Return QR PNG as base64 for a given credential ID."""
    cred = db.get(Credential, credential_id)
    if not cred:
        raise ValueError(f"Credential {credential_id} not found")
    return _make_qr(cred.credential_handle)
