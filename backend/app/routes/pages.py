from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.data.mock_db import get_db
from app.models.schemas import LineOut, PageOut

# GET /projects/{project_id}/pages
router_project_pages = APIRouter()


@router_project_pages.get("/{project_id}/pages", response_model=list[PageOut])
def list_project_pages(project_id: str) -> list[PageOut]:
    db = get_db()
    if db.get_project(project_id) is None:
        raise HTTPException(status_code=404, detail="Projet introuvable.")
    return db.list_pages_for_project(project_id)


# GET /pages/{page_id}/lines  et  GET /pages/{page_id}
router_pages = APIRouter()


@router_pages.get("/{page_id}/lines", response_model=list[LineOut])
def list_page_lines(page_id: str) -> list[LineOut]:
    db = get_db()
    if db.get_page(page_id) is None:
        raise HTTPException(status_code=404, detail="Page introuvable.")
    return db.list_lines(page_id)


@router_pages.get("/{page_id}", response_model=PageOut)
def get_page(page_id: str) -> PageOut:
    db = get_db()
    page = db.get_page(page_id)
    if page is None:
        raise HTTPException(status_code=404, detail="Page introuvable.")
    return page
