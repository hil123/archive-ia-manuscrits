"""Pipeline de prétraitement — V1 mockée."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class PreparedUpload:
    """Résultat fictif après réception du fichier."""

    original_name: str
    normalized_name: str
    mime_type: str
    bytes_size: int
    checksum_mock: str


def mock_prepare_upload(
    filename: str, content_type: str | None, file_bytes: bytes
) -> PreparedUpload:
    """Simule normalisation + contrôles légers."""
    safe_name = filename.strip() or "upload.bin"
    size = len(file_bytes)
    return PreparedUpload(
        original_name=filename,
        normalized_name=safe_name,
        mime_type=content_type or "application/octet-stream",
        bytes_size=size,
        checksum_mock=f"mock_{size:x}",
    )
