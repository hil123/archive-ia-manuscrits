from __future__ import annotations

import re

from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse

from app.data.mock_db import get_db
from app.services.export_service import build_project_txt

router = APIRouter()


def _ascii_filename_from_title(title: str) -> str:
    base = re.sub(r"[^a-zA-Z0-9._-]+", "-", title.strip()).strip("-")[:80]
    return (base or "export") + ".txt"


@router.get("/{project_id}/export/txt")
def export_project_txt(project_id: str) -> PlainTextResponse:
    db = get_db()
    proj = db.get_project(project_id)
    if proj is None:
        raise HTTPException(status_code=404, detail="Projet introuvable.")
    try:
        text = build_project_txt(db, project_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Projet introuvable.")

    fname = _ascii_filename_from_title(proj.title)
    return PlainTextResponse(
        content=text,
        media_type="text/plain; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{fname}"',
        },
    )
