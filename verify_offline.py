#!/usr/bin/env python3
"""
verify_offline.py — Standalone offline verification for SAKSHI credentials.

Verifies the Ed25519 digital signature of a W3C-VC-style signed credential
using ONLY the public key. No database, server, or internet connection is required.

Usage:
    python verify_offline.py <jws_string> [--public-key <base64_or_pem_key>]
    python verify_offline.py --test
"""

import sys
import os
import json
import base64
import argparse
from pathlib import Path

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from cryptography.hazmat.primitives import serialization


def _load_public_key(public_key_str: str | None = None) -> Ed25519PublicKey:
    """Load an Ed25519 public key from base64, PEM string, or default key file."""
    if public_key_str:
        public_key_str = public_key_str.strip()
        # Check if PEM format
        if "BEGIN PUBLIC KEY" in public_key_str:
            return serialization.load_pem_public_key(public_key_str.encode("utf-8"))
        # Else assume base64 raw 32-byte key
        raw_bytes = base64.b64decode(public_key_str)
        return Ed25519PublicKey.from_public_bytes(raw_bytes)

    # Fallback to local credential_key.pem in api/ if available
    key_path = Path(__file__).resolve().parent / "api" / "credential_key.pem"
    if key_path.exists():
        priv_pem = key_path.read_bytes()
        priv_key = serialization.load_pem_private_key(priv_pem, password=None)
        return priv_key.public_key()

    raise ValueError("No public key provided and api/credential_key.pem not found.")


def verify_offline(
    jws_string: str,
    public_key_b64: str | None = None,
    public_key_pem: str | None = None,
) -> dict:
    """
    Verify a compact JWS credential token offline using only the Ed25519 public key.

    Returns dict with verification results, decoded payload, and audit details.
    """
    pub_key_input = public_key_pem or public_key_b64
    pub_key = _load_public_key(pub_key_input)

    parts = jws_string.strip().split(".")
    if len(parts) != 3:
        return {
            "valid": False,
            "format": "W3C-VC-style signed credential (Ed25519)",
            "error": "Malformed JWS token: expected 3 dot-separated segments.",
        }

    header_b64, payload_b64, sig_b64 = parts
    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")

    # Pad base64 strings if needed
    def pad(s):
        return s + "=" * ((4 - len(s) % 4) % 4)

    try:
        sig_bytes = base64.urlsafe_b64decode(pad(sig_b64))
        pub_key.verify(sig_bytes, signing_input)
    except Exception as exc:
        return {
            "valid": False,
            "format": "W3C-VC-style signed credential (Ed25519)",
            "error": f"Cryptographic signature verification failed: {exc}",
        }

    try:
        header_json = base64.urlsafe_b64decode(pad(header_b64))
        payload_json = base64.urlsafe_b64decode(pad(payload_b64))
        header = json.loads(header_json)
        payload = json.loads(payload_json)
    except Exception as exc:
        return {
            "valid": False,
            "format": "W3C-VC-style signed credential (Ed25519)",
            "error": f"Signature valid but failed to decode JSON: {exc}",
        }

    return {
        "valid": True,
        "format": "W3C-VC-style signed credential (Ed25519)",
        "algorithm": header.get("alg", "EdDSA"),
        "key_id": header.get("kid", "sakshi-v1"),
        "header": header,
        "payload": payload,
        "message": "Signature verified successfully offline. Credential has not been tampered with.",
    }


def main():
    parser = argparse.ArgumentParser(description="Offline Ed25519 credential verification for SAKSHI.")
    parser.add_argument("jws", nargs="?", help="Compact JWS token string from credential QR payload")
    parser.add_argument("--public-key", dest="public_key", help="Public key as Base64 (raw 32-byte) or PEM")
    parser.add_argument("--test", action="store_true", help="Run self-test with a freshly generated key")
    args = parser.parse_args()

    if args.test or not args.jws:
        print("[*] Running offline verification self-test...")
        # Self-test: generate a temporary test key, sign payload, verify offline
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
        test_priv = Ed25519PrivateKey.generate()
        test_pub = test_priv.public_key()
        pub_bytes = test_pub.public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
        pub_b64 = base64.b64encode(pub_bytes).decode("ascii")

        test_payload = {
            "credential_id": "TEST-HANDLE-001",
            "student_token": "STU-OFFLINE-TEST",
            "programme": "B.Tech CSE",
            "cohort_year": 2026,
            "assurance_tier": "verified",
        }
        h_b64 = base64.urlsafe_b64encode(b'{"alg":"EdDSA","kid":"sakshi-v1"}').decode().rstrip("=")
        p_b64 = base64.urlsafe_b64encode(json.dumps(test_payload, sort_keys=True).encode()).decode().rstrip("=")
        sig = test_priv.sign(f"{h_b64}.{p_b64}".encode("ascii"))
        sig_b64 = base64.urlsafe_b64encode(sig).decode().rstrip("=")
        test_jws = f"{h_b64}.{p_b64}.{sig_b64}"

        result = verify_offline(test_jws, public_key_b64=pub_b64)
        print(json.dumps(result, indent=2))
        assert result["valid"] is True, "Self-test verification failed!"
        print("[+] Self-test passed! Offline Ed25519 verification is working perfectly.")
        return

    result = verify_offline(args.jws, public_key_b64=args.public_key)
    print(json.dumps(result, indent=2))
    if not result.get("valid"):
        sys.exit(1)


if __name__ == "__main__":
    main()

