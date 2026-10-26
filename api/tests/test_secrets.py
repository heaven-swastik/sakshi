"""
test_secrets.py — Verifies startup failure when SAKSHI_ENV=prod and default secret is used.
"""

import os
import pytest
from main import lifespan, app


@pytest.mark.anyio
async def test_prod_startup_fails_with_default_secret(monkeypatch):
    monkeypatch.setenv("SAKSHI_ENV", "prod")
    monkeypatch.setenv("SAKSHI_TOKEN_SECRET", "sakshi-dev-secret-change-in-prod")

    with pytest.raises(RuntimeError) as exc_info:
        async with lifespan(app):
            pass
    assert "SAKSHI_ENV=prod but SAKSHI_TOKEN_SECRET is using the insecure default value" in str(exc_info.value)


@pytest.mark.anyio
async def test_prod_startup_succeeds_with_strong_secret(monkeypatch):
    monkeypatch.setenv("SAKSHI_ENV", "prod")
    monkeypatch.setenv("SAKSHI_TOKEN_SECRET", "kms-vault-production-secret-999-strong")

    # Should not raise RuntimeError
    async with lifespan(app):
        pass


@pytest.mark.anyio
async def test_dev_startup_succeeds_with_default_secret(monkeypatch):
    monkeypatch.setenv("SAKSHI_ENV", "dev")
    monkeypatch.setenv("SAKSHI_TOKEN_SECRET", "sakshi-dev-secret-change-in-prod")

    async with lifespan(app):
        pass

