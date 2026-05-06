from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.data.mock_db import get_db
from app.models.schemas import DocumentOut
from app.services.upload_handler import (
    MAX_UPLOAD_BYTES,
    five_mock_lines_for_document,
    guess_mime_type,
    save_upload_bytes,
    validate_extension,
)

router = APIRouter()


@router.post(
    "/{project_id}/documents/upload",
    response_model=DocumentOut,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    project_id: str,
    file: UploadFile = File(...),
) -> DocumentOut:
    db = get_db()
    if db.get_project(project_id) is None:
        raise HTTPException(status_code=404, detail="Projet introuvable.")

    raw = await file.read()

    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Fichier trop volumineux. Taille maximale : 20 Mo.",
        )

    original_name = Path(file.filename or "document.pdf").name
    if len(original_name) > 220:
        original_name = original_name[:220]

    try:
        validate_extension(original_name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        stored_name, _disk = save_upload_bytes(raw, original_name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    ext = Path(original_name).suffix.lower()
    mime = (file.content_type or "").strip()
    if not mime or mime == "application/octet-stream":
        mime = guess_mime_type(ext)

    image_url = f"/uploads/{stored_name}"

    pages_data: list[dict] = [
        {
            "page_number": 1,
            "image_url": image_url,
            "lines": five_mock_lines_for_document(),
        }
    ]

    return db.add_document_with_pages(
        project_id=project_id,
        file_name=original_name,
        file_type=mime,
        page_count=1,
        pages_data=pages_data,
    )
