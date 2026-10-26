import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

_API_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_API_DIR))
_ROOT_DIR = _API_DIR.parent
sys.path.insert(0, str(_ROOT_DIR))

from main import app
from credentials import _sign_payload, get_public_key_pem
from verify_offline import verify_offline


def test_public_key_endpoint():
    client = TestClient(app)
    response = client.get("/v1/credentials/public-key")
    assert response.status_code == 200
    data = response.json()
    assert data["alg"] == "Ed25519"
    assert "BEGIN PUBLIC KEY" in data["public_key_pem"]
    assert "END PUBLIC KEY" in data["public_key_pem"]


def test_offline_credential_verification():
    # Construct and sign a payload with Ed25519 key
    payload = {
        "sub": "test_token_ed25519",
        "program_name": "B.Tech CSE",
        "institution_name": "MIT Pune",
        "cohort_year": 2026,
    }
    jws_token = _sign_payload(payload)
    public_key_pem = get_public_key_pem()

    # 1. Valid offline verification
    result = verify_offline(jws_token, public_key_pem=public_key_pem)
    assert result["valid"] is True
    assert result["format"] == "W3C-VC-style signed credential (Ed25519)"
    assert result["payload"]["sub"] == "test_token_ed25519"
    assert result["payload"]["program_name"] == "B.Tech CSE"

    # 2. Tampered verification should fail
    parts = jws_token.split(".")
    tampered_parts = parts.copy()
    tampered_parts[1] = parts[1][:-2] + "AA"
    tampered_jws = ".".join(tampered_parts)

    tampered_result = verify_offline(tampered_jws, public_key_pem=public_key_pem)
    assert tampered_result["valid"] is False
    assert "error" in tampered_result

