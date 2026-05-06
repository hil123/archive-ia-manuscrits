from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.data.mock_db import get_db
from app.models.schemas import LineCorrectionPatch, LineOut

router = APIRouter()


@router.patch("/lines/{line_id}/correction", response_model=LineOut)
def patch_line_correction(line_id: str, payload: LineCorrectionPatch) -> LineOut:
    db = get_db()
    if db.get_line(line_id) is None:
        raise HTTPException(status_code=404, detail="Ligne introuvable.")
    out = db.update_line_correction(line_id, payload.human_correction)
    if out is None:
        raise HTTPException(status_code=404, detail="Ligne introuvable.")
    return out


@router.post("/lines/{line_id}/validate", response_model=LineOut)
def validate_line(line_id: str) -> LineOut:
    db = get_db()
    if db.get_line(line_id) is None:
        raise HTTPException(status_code=404, detail="Ligne introuvable.")
    out = db.validate_line(line_id)
    if out is None:
        raise HTTPException(status_code=404, detail="Ligne introuvable.")
    return out
