"""Réception fichier upload : validation, enregistrement disque, lignes mock V1."""

from __future__ import annotations

import uuid
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
UPLOAD_DIR = BACKEND_ROOT / "uploads"

ALLOWED_EXTENSIONS = frozenset({".jpg", ".jpeg", ".png", ".pdf"})
MAX_UPLOAD_BYTES = 20 * 1024 * 1024


def ensure_upload_dir() -> None:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def validate_extension(filename: str) -> str:
    """Retourne l’extension normalisée (ex. `.pdf`) ou lève ValueError."""
    if not filename or not str(filename).strip():
        raise ValueError("Nom de fichier manquant.")
    ext = Path(filename.strip()).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(
            "Format de fichier non accepté. Formats autorisés : .jpg, .jpeg, .png, .pdf."
        )
    return ext


def guess_mime_type(ext: str) -> str:
    return {
        ".pdf": "application/pdf",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
    }.get(ext, "application/octet-stream")


def save_upload_bytes(content: bytes, original_filename: str) -> tuple[str, str]:
    """
    Enregistre les octets sous un nom unique dans uploads/.
    Retourne (nom_de_fichier_stocké_ex_téléchargement, chemin_disque_absolu).
    """
    ext = validate_extension(original_filename)
    ensure_upload_dir()
    stored_name = f"{uuid.uuid4().hex}{ext}"
    disk_path = UPLOAD_DIR / stored_name
    disk_path.write_bytes(content)
    return stored_name, str(disk_path)


def five_mock_lines_for_document() -> list[dict[str, object]]:
    """Exactement 5 lignes : OCR brut bruité + suggestion IA fictive (V1)."""
    payloads: list[tuple[str, str, float]] = [
        (
            "le manuscrit porte en tete une date incertaine.",
            "Le manuscrit porte en tête une date incertaine.",
            0.72,
        ),
        (
            "Les marges contiennent des ajouts illisibles par endroits.",
            "Les marges contiennent des ajouts illisibles par endroits.",
            0.66,
        ),
        (
            "Une initiale filigranee domine la page ouverte.",
            "Une initiale filigranée domine la page ouverte.",
            0.81,
        ),
        (
            "Remarque au crayon : verifier la suite au registre A.",
            "Remarque au crayon : vérifier la suite au registre A.",
            0.58,
        ),
        (
            "La derniere ligne semble corrompue par l humidi te.",
            "La dernière ligne semble corrompue par l’humidité.",
            0.74,
        ),
    ]
    lines: list[dict[str, object]] = []
    for i, (ocr_raw, ai_suggestion, score) in enumerate(payloads, start=1):
        lines.append(
            {
                "line_number": i,
                "ocr_raw": ocr_raw,
                "ai_suggestion": ai_suggestion,
                "confidence_score": score,
                "human_correction": "",
                "status": "pending",
            }
        )
    return lines
