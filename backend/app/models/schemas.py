from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal, Optional

from pydantic import BaseModel, Field


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


ConfidenceLevel = Literal["low", "medium", "high"]
LineStatus = Literal["pending", "corrected", "validated"]
ProjectStatus = Literal["draft", "active", "archived"]


class PageOut(BaseModel):
    id: str
    document_id: str = Field(alias="documentId")
    page_number: int = Field(alias="pageNumber", ge=1)
    image_url: Optional[str] = Field(
        default=None,
        alias="imageUrl",
        description=(
            "URL (chemin) du visuel page : images JPG/PNG pointent vers les fichiers statiques "
            "sous /uploads (servis par l’API). PDF : même champ, aperçu pixel côté client différé."
        ),
    )

    model_config = {"populate_by_name": True, "from_attributes": True}


class DocumentOut(BaseModel):
    id: str
    project_id: str = Field(alias="projectId")
    file_name: str = Field(alias="fileName")
    file_type: str = Field(alias="fileType")
    page_count: int = Field(alias="pageCount", ge=0)
    pages: list[PageOut] = Field(default_factory=list)

    model_config = {"populate_by_name": True, "from_attributes": True}


class ProjectOut(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    status: ProjectStatus
    created_at: str = Field(alias="createdAt")
    documents: list[DocumentOut] = Field(default_factory=list)

    model_config = {"populate_by_name": True, "from_attributes": True}


class ProjectCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    description: Optional[str] = Field(default=None, max_length=10_000)


class LineOut(BaseModel):
    id: str
    page_id: str = Field(alias="pageId")
    line_number: int = Field(alias="lineNumber", ge=1)
    ocr_raw: str = Field(alias="ocrRaw")
    ai_suggestion: str = Field(alias="aiSuggestion")
    human_correction: str = Field(alias="humanCorrection")
    final_text: str = Field(alias="finalText")
    confidence_score: float = Field(alias="confidenceScore", ge=0.0, le=1.0)
    confidence_level: ConfidenceLevel = Field(alias="confidenceLevel")
    status: LineStatus

    model_config = {"populate_by_name": True, "from_attributes": True}


class LineCorrectionPatch(BaseModel):
    human_correction: str = Field(alias="humanCorrection")

    model_config = {"populate_by_name": True}


def score_to_level(score: float) -> ConfidenceLevel:
    if score >= 0.8:
        return "high"
    if score >= 0.65:
        return "medium"
    return "low"


def compute_final_text(ai_suggestion: str, human_correction: str) -> str:
    return human_correction.strip() if human_correction.strip() else ai_suggestion
