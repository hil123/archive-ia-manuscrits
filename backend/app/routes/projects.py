from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.data.mock_db import get_db
from app.models.schemas import ProjectCreate, ProjectOut

router = APIRouter()


@router.get("", response_model=list[ProjectOut])
def list_projects() -> list[ProjectOut]:
    return get_db().list_projects()


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreate) -> ProjectOut:
    return get_db().create_project(
        title=payload.title.strip(),
        description=payload.description.strip() if payload.description else None,
    )


@router.get(
    "/{project_id}",
    response_model=ProjectOut,
    responses={404: {"description": "Not found"}},
)
def get_project(project_id: str) -> ProjectOut:
    p = get_db().get_project(project_id)
    if p is None:
        raise HTTPException(status_code=404, detail="Projet introuvable.")
    return p


@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={404: {"description": "Not found"}},
)
def delete_project(project_id: str) -> None:
    ok = get_db().delete_project(project_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Projet introuvable.")
