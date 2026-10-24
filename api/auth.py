"""
auth.py — JWT authentication for SAKSHI.

For the hackathon demo, POST /v1/auth/demo-login issues a token for
any role without verifying real credentials. In a production system
this endpoint would be replaced by SSO (SAML/OIDC) integration with
the institution's identity provider.

Student auth uses a mock OTP flow: the "OTP" is always accepted for
any 6-digit code, keeping the demo frictionless.
"""

import os
import hmac
import hashlib
import base64
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from pydantic import BaseModel

# In prod this must be a long random secret from a secrets manager.
_JWT_SECRET = os.environ.get("SAKSHI_JWT_SECRET", "sakshi-jwt-dev-secret-do-not-use-in-prod")
_ALGORITHM = "HS256"
_TOKEN_TTL_HOURS = 8

# Roles that the system recognises
VALID_ROLES = {"institution", "officer", "supervisor", "auditor", "student"}

router = APIRouter(tags=["auth"])

_bearer = HTTPBearer(auto_error=False)

# In-memory OTP store for demo. Not suitable for production.
# {phone_token: otp_code}
_pending_otps: dict[str, str] = {}


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class DemoLoginRequest(BaseModel):
    role: str
    actor_id: str = "demo-user"
    institution_id: int | None = None  # required when role == "institution"


class OtpRequest(BaseModel):
    phone: str   # We never store this — only use it to derive a token


class OtpVerifyRequest(BaseModel):
    phone: str
    otp: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str


# ---------------------------------------------------------------------------
# Token utilities
# ---------------------------------------------------------------------------

def _make_student_token_from_phone(phone: str) -> str:
    """
    Derive a deterministic student token from a phone number using HMAC.

    This means the same phone always maps to the same student token,
    which is what we want for the demo (Asha's phone always returns
    Asha's token). In production the token would come from a consent
    flow tied to the APAAR identity — the phone is just the demo proxy.
    """
    secret = os.environ.get("SAKSHI_TOKEN_SECRET", "sakshi-dev-secret-change-in-prod")
    digest = hmac.new(secret.encode(), f"phone:{phone}".encode(), hashlib.sha256).digest()
    return "STU-" + base64.b32encode(digest[:8]).decode().rstrip("=")


def create_access_token(subject: str, role: str, extra: dict | None = None) -> str:
    payload = {
        "sub": subject,
        "role": role,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=_TOKEN_TTL_HOURS),
        **(extra or {}),
    }
    return jwt.encode(payload, _JWT_SECRET, algorithm=_ALGORITHM)


def decode_token(token: str) -> dict:
    """Raises HTTPException if token is invalid or expired."""
    try:
        return jwt.decode(token, _JWT_SECRET, algorithms=[_ALGORITHM])
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc


# ---------------------------------------------------------------------------
# FastAPI dependencies
# ---------------------------------------------------------------------------

def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> dict:
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    return decode_token(credentials.credentials)


def require_roles(*roles: str):
    """
    Dependency factory. Usage:

        @router.get("/thing")
        def thing(user=Depends(require_roles("officer", "supervisor"))):
            ...
    """
    def _check(user: dict = Depends(get_current_user)) -> dict:
        if user.get("role") not in roles:
            raise HTTPException(
                status_code=403,
                detail=f"This action requires one of: {', '.join(roles)}",
            )
        return user
    return _check


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/v1/auth/demo-login", response_model=TokenResponse)
def demo_login(req: DemoLoginRequest):
    """
    Issue a demo JWT for any valid role. No password required.
    This endpoint exists purely for hackathon convenience and must be
    removed (or gated behind SSO) before any real deployment.
    """
    if req.role not in VALID_ROLES:
        raise HTTPException(400, f"Unknown role '{req.role}'. Valid: {sorted(VALID_ROLES)}")

    extra = {}
    subject = req.actor_id

    if req.role == "institution":
        inst_id = req.institution_id or 1
        extra["institution_id"] = inst_id
        extra["institution_name"] = "MIT Pune" if inst_id == 1 else f"Institution #{inst_id}"
    elif req.role == "student":
        # Map demo student personas to real seeded tokens in the database
        if req.actor_id in ("ravi", "9876543002"):
            subject = _make_student_token_from_phone("9876543002")
            extra["name"] = "Ravi Kumar"
            extra["scenario"] = "dual-seat"
        elif req.actor_id in ("meera", "9876543003"):
            subject = _make_student_token_from_phone("9876543003")
            extra["name"] = "Meera Patel"
            extra["scenario"] = "ghost-seat"
        else:  # Default to Asha Sharma (Asha Sharma - Opt-out persona)
            subject = _make_student_token_from_phone("9876543001")
            extra["name"] = "Asha Sharma"
            extra["scenario"] = "opt-out"

    token = create_access_token(subject=subject, role=req.role, extra=extra)
    return TokenResponse(access_token=token, role=req.role)


@router.post("/v1/student/auth/otp")
def student_otp_request(req: OtpRequest):
    """
    Start a mock OTP flow. In reality this would call an SMS gateway.
    The phone number is used only to derive the student token — it is
    not stored in the DB.
    """
    # In the demo we just acknowledge. The OTP code doesn't matter.
    # Derive the student token from the phone so we can find their records.
    student_token = _make_student_token_from_phone(req.phone)
    # Store a placeholder OTP against the token (not against the phone)
    _pending_otps[student_token] = "000000"  # any 6-digit code accepted in verify step
    return {"message": "OTP sent (mock — any 6-digit code works for demo)", "hint": "Use 000000"}


@router.post("/v1/student/auth/verify", response_model=TokenResponse)
def student_otp_verify(req: OtpVerifyRequest):
    """
    Complete OTP verification. Accept any 6-digit code for the demo.
    Returns a student-scoped JWT whose 'sub' is the student's token —
    never their phone or real identity.
    """
    if len(req.otp) != 6 or not req.otp.isdigit():
        raise HTTPException(400, "OTP must be exactly 6 digits")

    student_token = _make_student_token_from_phone(req.phone)
    # Don't persist the phone number anywhere after this point
    del req.phone  # belt-and-suspenders; Python GC will handle it

    token = create_access_token(subject=student_token, role="student")
    return TokenResponse(access_token=token, role="student")
