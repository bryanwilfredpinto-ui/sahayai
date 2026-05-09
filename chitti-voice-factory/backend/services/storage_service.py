"""Audio storage service — TeraBox/MEGA integration for voice submissions."""

import hashlib
import io
import uuid
from dataclasses import dataclass

from config import settings


@dataclass
class StorageResult:
    ok: bool
    audio_url: str | None = None
    error_message: str | None = None


async def upload_audio_blob(audio_bytes: bytes, language_code: str) -> StorageResult:
    """Upload audio blob to configured provider (TeraBox or MEGA)."""
    if not audio_bytes:
        return StorageResult(ok=False, error_message="empty_audio")

    audio_sha256 = hashlib.sha256(audio_bytes).hexdigest()
    path = f"voice_submissions/{language_code}/{uuid.uuid4().hex}.wav"

    if settings.STORAGE_PROVIDER == "terabox":
        return await _upload_terabox(audio_bytes, path, audio_sha256)
    elif settings.STORAGE_PROVIDER == "mega":
        return await _upload_mega(audio_bytes, path, audio_sha256)
    else:
        return StorageResult(ok=False, error_message=f"unknown_storage_provider:{settings.STORAGE_PROVIDER}")


async def _upload_terabox(audio_bytes: bytes, path: str, sha256: str) -> StorageResult:
    """Upload to TeraBox via webdav-like API (stub for now)."""
    if not settings.TERABOX_API_KEY:
        return StorageResult(ok=False, error_message="terabox_api_key_not_configured")

    # TODO: Real TeraBox API call
    # For now, return a mock URL that includes the path and hash
    mock_url = f"https://terabox.chitti.internal/{path}#{sha256[:8]}"
    return StorageResult(ok=True, audio_url=mock_url)


async def _upload_mega(audio_bytes: bytes, path: str, sha256: str) -> StorageResult:
    """Upload to MEGA (stub for now)."""
    if not settings.MEGA_EMAIL or not settings.MEGA_PASSWORD:
        return StorageResult(ok=False, error_message="mega_credentials_not_configured")

    # TODO: Real MEGA API call (using mega.py or similar)
    # For now, return a mock URL
    mock_url = f"https://mega.nz/path-to-{sha256[:8]}"
    return StorageResult(ok=True, audio_url=mock_url)


async def download_winner_audio(winner_id: str, audio_storage_url: str) -> bytes | None:
    """Download winner audio from storage for playback."""
    # TODO: Implement based on provider
    return None
