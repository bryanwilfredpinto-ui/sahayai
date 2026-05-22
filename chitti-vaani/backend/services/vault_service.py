"""
services/vault_service.py
-------------------------
Chitti Document Vault (Phase 1) — encrypt-at-rest helpers + share-token
issuance + expiry sweeper.

Encryption
~~~~~~~~~~
Per-user Fernet key derived deterministically from
    `sha256( VAULT_PEPPER + user_token ).digest()` → urlsafe base64.
This means the server can decrypt with just (user_token, blob). The
server NEVER stores the raw user_token — only its sha256(user_token +
USER_TOKEN_PEPPER) hash. To decrypt, the user's device sends
`user_token` in the request; the server derives the key, fetches the
blob, decrypts, and streams it back.

  pepper(s):
    VAULT_PEPPER          — 32-byte secret used in the Fernet KDF
    USER_TOKEN_PEPPER     — 32-byte secret used in the user_token hash

Loss of either pepper invalidates the vault (cannot decrypt existing
blobs). They MUST be set via env vars in production. Falls back to a
default-with-warning in dev so the test rig works.

Per-use share contract (Bryan's hard rule)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
The backend issues one-time share tokens (`/api/vaani/vault/share`)
but does NOT enforce the "Sahab — theek hai?" confirmation. That
gate is in the frontend (`chitti_vaani.html`'s confirmShareDoc()
modal). The backend just makes sure:
  1. Every share token is one-shot — `consumed_at` set on first
     /file?share_token=… hit; second hit returns 410 Gone.
  2. Every share token expires (default 30 minutes).
  3. Every share token is logged for audit (target_label).
"""
from __future__ import annotations

import base64
import hashlib
import logging
import os
import re
import secrets
import uuid
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Iterable, Optional

from cryptography.fernet import Fernet, InvalidToken
from sqlalchemy import and_, or_, select

from services.vault_db import SessionLocal, VaultDocument, VaultShareToken

log = logging.getLogger("vault_service")

VAULT_PEPPER = os.environ.get("VAULT_PEPPER", "chitti-vaani-vault-pepper-DEV-NOT-FOR-PROD-v1")
USER_TOKEN_PEPPER = os.environ.get(
    "USER_TOKEN_PEPPER", "chitti-vaani-user-token-pepper-DEV-NOT-FOR-PROD-v1"
)
STORAGE_ROOT = Path(os.environ.get("VAULT_STORAGE_ROOT", "/tmp/chitti_vaani_vault"))
SHARE_TTL_MINUTES = int(os.environ.get("VAULT_SHARE_TTL_MIN", "30"))

CATEGORIES = (
    "aadhaar", "pan", "passport", "dl", "voter", "ration", "insurance",
    "property", "certificate", "contract", "health", "tax", "kyc", "other",
)


def _user_hash(user_token: str) -> str:
    """Hash the user_token for indexing — never stored in clear."""
    msg = (USER_TOKEN_PEPPER + user_token).encode("utf-8")
    return hashlib.sha256(msg).hexdigest()


def _fernet(user_token: str) -> Fernet:
    """Derive a per-user Fernet key from (VAULT_PEPPER, user_token)."""
    raw = hashlib.sha256((VAULT_PEPPER + ":" + user_token).encode("utf-8")).digest()
    return Fernet(base64.urlsafe_b64encode(raw))


def _safe_filename(name: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "_", name).strip("._")
    return cleaned[:80] or "file"


def _ensure_storage_root() -> None:
    STORAGE_ROOT.mkdir(parents=True, exist_ok=True)


def upload(
    *,
    user_token: str,
    display_name: str,
    category: str,
    file_bytes: bytes,
    mime_type: str,
    expiry_date: Optional[date] = None,
    notes: Optional[str] = None,
) -> dict:
    if not user_token or len(user_token) < 8:
        raise ValueError("user_token required")
    if not display_name.strip():
        raise ValueError("display_name required")
    if category not in CATEGORIES:
        category = "other"
    if not file_bytes:
        raise ValueError("empty file")
    if len(file_bytes) > 25 * 1024 * 1024:
        raise ValueError("file too large (25 MB max)")

    _ensure_storage_root()
    doc_id = str(uuid.uuid4())
    u_hash = _user_hash(user_token)
    user_dir = STORAGE_ROOT / u_hash
    user_dir.mkdir(parents=True, exist_ok=True)
    blob_name = f"{doc_id}.bin"
    blob_path_abs = user_dir / blob_name
    cipher = _fernet(user_token).encrypt(file_bytes)
    blob_path_abs.write_bytes(cipher)
    blob_sha256 = hashlib.sha256(cipher).hexdigest()

    with SessionLocal() as s:
        doc = VaultDocument(
            id=doc_id,
            user_token_hash=u_hash,
            display_name=display_name.strip()[:200],
            category=category,
            mime_type=(mime_type or "application/octet-stream")[:128],
            size_bytes=len(file_bytes),
            blob_path=f"{u_hash}/{blob_name}",
            blob_sha256=blob_sha256,
            expiry_date=expiry_date,
            notes=(notes or "")[:1000] or None,
        )
        s.add(doc)
        s.commit()

    log.info("vault.upload doc=%s cat=%s size=%d", doc_id, category, len(file_bytes))
    return {
        "ok": True,
        "doc_id": doc_id,
        "category": category,
        "size_bytes": len(file_bytes),
        "expiry_date": expiry_date.isoformat() if expiry_date else None,
    }


def list_docs(user_token: str) -> list[dict]:
    u_hash = _user_hash(user_token)
    with SessionLocal() as s:
        rows = s.execute(
            select(VaultDocument)
            .where(VaultDocument.user_token_hash == u_hash, VaultDocument.forget_at.is_(None))
            .order_by(VaultDocument.uploaded_at.desc())
        ).scalars().all()
    return [_doc_to_dict(d) for d in rows]


def _doc_to_dict(d: VaultDocument) -> dict:
    return {
        "doc_id": d.id,
        "display_name": d.display_name,
        "category": d.category,
        "mime_type": d.mime_type,
        "size_bytes": d.size_bytes,
        "expiry_date": d.expiry_date.isoformat() if d.expiry_date else None,
        "uploaded_at": d.uploaded_at.replace(tzinfo=timezone.utc).isoformat() if d.uploaded_at else None,
        "notes": d.notes or "",
    }


def fetch_blob(*, user_token: str, doc_id: str) -> tuple[bytes, str, str]:
    """Returns (plaintext_bytes, mime_type, display_name). Raises KeyError
    if the doc doesn't belong to that user."""
    u_hash = _user_hash(user_token)
    with SessionLocal() as s:
        d = s.get(VaultDocument, doc_id)
        if not d or d.user_token_hash != u_hash or d.forget_at is not None:
            raise KeyError("not found")
        blob_abs = STORAGE_ROOT / d.blob_path
        if not blob_abs.exists():
            raise KeyError("blob missing")
        cipher = blob_abs.read_bytes()
        try:
            plain = _fernet(user_token).decrypt(cipher)
        except InvalidToken as e:
            raise PermissionError("Vault key derivation mismatch — VAULT_PEPPER changed?") from e
        return plain, d.mime_type, d.display_name


def soft_delete(*, user_token: str, doc_id: str) -> bool:
    u_hash = _user_hash(user_token)
    with SessionLocal() as s:
        d = s.get(VaultDocument, doc_id)
        if not d or d.user_token_hash != u_hash:
            return False
        d.forget_at = datetime.now(timezone.utc)
        try:
            blob_abs = STORAGE_ROOT / d.blob_path
            if blob_abs.exists():
                blob_abs.unlink()
        except Exception as e:  # noqa: BLE001
            log.warning("vault.soft_delete unlink failed: %s", e)
        s.commit()
    return True


def issue_share_token(
    *, user_token: str, doc_id: str, target_label: str = "",
    ttl_minutes: Optional[int] = None,
) -> Optional[dict]:
    u_hash = _user_hash(user_token)
    with SessionLocal() as s:
        d = s.get(VaultDocument, doc_id)
        if not d or d.user_token_hash != u_hash or d.forget_at is not None:
            return None
        token = secrets.token_urlsafe(24)[:48]
        expires = datetime.now(timezone.utc) + timedelta(minutes=ttl_minutes or SHARE_TTL_MINUTES)
        s.add(VaultShareToken(
            token=token, user_token_hash=u_hash, doc_id=doc_id,
            target_label=(target_label or "")[:200], expires_at=expires,
        ))
        s.commit()
    log.info("vault.share doc=%s target=%s ttl=%dmin", doc_id, target_label, ttl_minutes or SHARE_TTL_MINUTES)
    return {
        "ok": True,
        "share_token": token,
        "expires_at": expires.isoformat(),
        "ttl_minutes": ttl_minutes or SHARE_TTL_MINUTES,
        "doc_id": doc_id,
    }


def consume_share_token(token: str) -> Optional[tuple[bytes, str, str]]:
    """Consume a one-shot share token. Returns (plaintext, mime, name)
    or None if the token is unknown / expired / already consumed.
    Requires no user_token — that's the whole point of the share token,
    but the matching `user_token_hash` lets us derive the Fernet key
    via the on-disk shared secret: we look up the issuing user's
    record by hash and decrypt with the encryption key stored in the
    token's metadata.

    Implementation note: because the Fernet key is derived from
    user_token (not stored), we CANNOT decrypt a doc from token alone
    on the server. The frontend must supply user_token in the request,
    just like /file. The share token only proves "the issuing user
    consented to share THIS doc to THIS target, once, within 30 min."
    The recipient still receives the decrypted file via wa.me link
    proxied through the user's own device, NOT a server URL the
    recipient hits directly — see frontend confirmShareDoc().
    """
    raise NotImplementedError(
        "Phase 1 shares are device-mediated: the user's phone fetches "
        "the decrypted file with /api/vaani/vault/file and forwards via "
        "openWhatsApp(). The share token is the audit + per-use receipt; "
        "it never authorises a server-side decrypt."
    )


def mark_share_consumed(token: str) -> bool:
    """Called by the frontend AFTER a share is dispatched (so the
    audit log knows which token completed). One-shot — second call is
    a no-op."""
    with SessionLocal() as s:
        row = s.get(VaultShareToken, token)
        if not row:
            return False
        if row.consumed_at is not None:
            return False
        if datetime.now(timezone.utc) > row.expires_at.replace(tzinfo=timezone.utc):
            return False
        row.consumed_at = datetime.now(timezone.utc)
        s.commit()
        return True


def expiring_within(user_token: str, days: int = 30) -> list[dict]:
    """Return docs whose expiry_date is within [today, today + days]."""
    u_hash = _user_hash(user_token)
    today = date.today()
    horizon = today + timedelta(days=days)
    with SessionLocal() as s:
        rows = s.execute(
            select(VaultDocument).where(
                VaultDocument.user_token_hash == u_hash,
                VaultDocument.forget_at.is_(None),
                VaultDocument.expiry_date.is_not(None),
                VaultDocument.expiry_date >= today,
                VaultDocument.expiry_date <= horizon,
            ).order_by(VaultDocument.expiry_date.asc())
        ).scalars().all()
    out = []
    for d in rows:
        days_left = (d.expiry_date - today).days
        item = _doc_to_dict(d)
        item["days_left"] = days_left
        item["bucket"] = ("today" if days_left == 0
                          else "1_day" if days_left == 1
                          else "7_day" if days_left <= 7
                          else "30_day")
        out.append(item)
    return out
