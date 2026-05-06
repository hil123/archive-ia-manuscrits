from __future__ import annotations

import uuid
from threading import Lock
from typing import Any, Optional

from app.models.schemas import (
    DocumentOut,
    LineOut,
    PageOut,
    ProjectOut,
    compute_final_text,
    score_to_level,
    utc_now_iso,
)


def _new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


class MockDB:
    """Stockage en mémoire pour la V1 (aucune persistance disque)."""

    def __init__(self) -> None:
        self._lock = Lock()
        self._projects: dict[str, dict[str, Any]] = {}
        self._documents: dict[str, dict[str, Any]] = {}
        self._pages: dict[str, dict[str, Any]] = {}
        self._lines: dict[str, dict[str, Any]] = {}
        self._page_line_ids: dict[str, list[str]] = {}

    def seed_demo_project(self) -> None:
        with self._lock:
            if self._projects:
                return
        pid = "proj_demo_seed"
        did = "doc_demo_seed"
        pgid = "page_demo_seed"
        created = utc_now_iso()
        project = {
            "id": pid,
            "title": "Manuscrit de démonstration",
            "description": "Données mockées côté API.",
            "status": "active",
            "created_at": created,
            "document_ids": [did],
        }
        doc = {
            "id": did,
            "project_id": pid,
            "file_name": "demo.pdf",
            "file_type": "application/pdf",
            "page_count": 1,
            "page_ids": [pgid],
        }
        page = {
            "id": pgid,
            "document_id": did,
            "page_number": 1,
            "image_url": None,
        }
        line_payloads = [
            {
                "line_number": 1,
                "ocr_raw": "A la lueur d'une lampe, je relis ces pages.",
                "ai_suggestion": "À la lueur d’une lampe, je relis ces pages.",
                "confidence_score": 0.78,
            },
            {
                "line_number": 2,
                "ocr_raw": "Le vent frap pe aux vitres.",
                "ai_suggestion": "Le vent frappe aux vitres du vieux bureau.",
                "confidence_score": 0.66,
            },
        ]
        lines: list[str] = []
        for lp in line_payloads:
            lid = _new_id("line")
            lines.append(lid)
            human = ""
            ai = lp["ai_suggestion"]
            score = lp["confidence_score"]
            self._lines[lid] = {
                "id": lid,
                "page_id": pgid,
                "line_number": lp["line_number"],
                "ocr_raw": lp["ocr_raw"],
                "ai_suggestion": ai,
                "human_correction": human,
                "final_text": compute_final_text(ai, human),
                "confidence_score": score,
                "confidence_level": score_to_level(score),
                "status": "pending",
            }
        with self._lock:
            self._projects[pid] = project
            self._documents[did] = doc
            self._pages[pgid] = page
            self._page_line_ids[pgid] = lines

    # --- Projects ---
    def list_projects(self) -> list[ProjectOut]:
        with self._lock:
            return [self._project_to_out(pid) for pid in self._projects]

    def get_project(self, project_id: str) -> Optional[ProjectOut]:
        with self._lock:
            if project_id not in self._projects:
                return None
            return self._project_to_out(project_id)

    def create_project(
        self,
        title: str,
        description: Optional[str],
        status: str = "draft",
    ) -> ProjectOut:
        pid = _new_id("proj")
        created = utc_now_iso()
        with self._lock:
            self._projects[pid] = {
                "id": pid,
                "title": title,
                "description": description,
                "status": status,
                "created_at": created,
                "document_ids": [],
            }
            return self._project_to_out(pid)

    def delete_project(self, project_id: str) -> bool:
        with self._lock:
            if project_id not in self._projects:
                return False
            doc_ids = list(self._projects[project_id]["document_ids"])
            for did in doc_ids:
                page_ids = list(self._documents[did]["page_ids"])
                for pgid in page_ids:
                    for lid in self._page_line_ids.get(pgid, []):
                        self._lines.pop(lid, None)
                    self._page_line_ids.pop(pgid, None)
                    self._pages.pop(pgid, None)
                self._documents.pop(did, None)
            del self._projects[project_id]
            return True

    def _project_to_out(self, project_id: str) -> ProjectOut:
        p = self._projects[project_id]
        docs = [self._document_to_out(did) for did in p["document_ids"]]
        return ProjectOut(
            id=p["id"],
            title=p["title"],
            description=p.get("description"),
            status=p["status"],
            createdAt=p["created_at"],
            documents=docs,
        )

    def _document_to_out(self, document_id: str) -> DocumentOut:
        d = self._documents[document_id]
        pages = [self._page_to_out(pid) for pid in d["page_ids"]]
        return DocumentOut(
            id=d["id"],
            projectId=d["project_id"],
            fileName=d["file_name"],
            fileType=d["file_type"],
            pageCount=d["page_count"],
            pages=pages,
        )

    def _page_to_out(self, page_id: str) -> PageOut:
        pg = self._pages[page_id]
        return PageOut(
            id=pg["id"],
            documentId=pg["document_id"],
            pageNumber=pg["page_number"],
            imageUrl=pg.get("image_url"),
        )

    def get_page(self, page_id: str) -> Optional[PageOut]:
        with self._lock:
            if page_id not in self._pages:
                return None
            return self._page_to_out(page_id)

    def list_pages_for_project(self, project_id: str) -> list[PageOut]:
        with self._lock:
            if project_id not in self._projects:
                return []
            out: list[PageOut] = []
            for did in self._projects[project_id]["document_ids"]:
                for pid in self._documents[did]["page_ids"]:
                    out.append(self._page_to_out(pid))
            return sorted(out, key=lambda x: (x.document_id, x.page_number))

    def list_lines(self, page_id: str) -> list[LineOut]:
        with self._lock:
            if page_id not in self._pages:
                return []
            lids = self._page_line_ids.get(page_id, [])
            lines = [self._lines[lid] for lid in lids if lid in self._lines]
            lines.sort(key=lambda x: x["line_number"])
            return [self._line_to_out(rec) for rec in lines]

    def get_line(self, line_id: str) -> Optional[dict[str, Any]]:
        with self._lock:
            return self._lines.get(line_id)

    def update_line_correction(self, line_id: str, human_correction: str) -> Optional[LineOut]:
        with self._lock:
            if line_id not in self._lines:
                return None
            rec = self._lines[line_id]
            rec["human_correction"] = human_correction
            rec["final_text"] = compute_final_text(rec["ai_suggestion"], human_correction)
            if rec["status"] == "validated":
                rec["status"] = "corrected"
            elif human_correction.strip() and human_correction != rec["ai_suggestion"]:
                rec["status"] = "corrected"
            elif not human_correction.strip() and rec["status"] != "validated":
                rec["status"] = "pending"
            return self._line_to_out(rec)

    def validate_line(self, line_id: str) -> Optional[LineOut]:
        with self._lock:
            if line_id not in self._lines:
                return None
            rec = self._lines[line_id]
            rec["status"] = "validated"
            return self._line_to_out(rec)

    def _line_to_out(self, rec: dict[str, Any]) -> LineOut:
        return LineOut(
            id=rec["id"],
            pageId=rec["page_id"],
            lineNumber=rec["line_number"],
            ocrRaw=rec["ocr_raw"],
            aiSuggestion=rec["ai_suggestion"],
            humanCorrection=rec["human_correction"],
            finalText=rec["final_text"],
            confidenceScore=rec["confidence_score"],
            confidenceLevel=rec["confidence_level"],
            status=rec["status"],
        )

    def add_document_with_pages(
        self,
        project_id: str,
        file_name: str,
        file_type: str,
        page_count: int,
        pages_data: list[dict[str, Any]],
    ) -> DocumentOut:
        """Ajoute un document et des pages + lignes (appelé après pipeline mock)."""
        with self._lock:
            if project_id not in self._projects:
                raise KeyError("project not found")
            did = _new_id("doc")
            page_ids: list[str] = []
            for i, pdata in enumerate(pages_data):
                pgid = _new_id("page")
                page_ids.append(pgid)
                self._pages[pgid] = {
                    "id": pgid,
                    "document_id": did,
                    "page_number": pdata.get("page_number", i + 1),
                    "image_url": pdata.get("image_url"),
                }
                line_ids: list[str] = []
                for line in pdata.get("lines", []):
                    lid = _new_id("line")
                    line_ids.append(lid)
                    ai = line["ai_suggestion"]
                    human = line.get("human_correction", "")
                    score = float(line["confidence_score"])
                    self._lines[lid] = {
                        "id": lid,
                        "page_id": pgid,
                        "line_number": int(line["line_number"]),
                        "ocr_raw": line["ocr_raw"],
                        "ai_suggestion": ai,
                        "human_correction": human,
                        "final_text": compute_final_text(ai, human),
                        "confidence_score": score,
                        "confidence_level": score_to_level(score),
                        "status": line.get("status", "pending"),
                    }
                self._page_line_ids[pgid] = line_ids

            self._documents[did] = {
                "id": did,
                "project_id": project_id,
                "file_name": file_name,
                "file_type": file_type,
                "page_count": page_count,
                "page_ids": page_ids,
            }
            self._projects[project_id]["document_ids"].append(did)
            if self._projects[project_id]["status"] == "draft":
                self._projects[project_id]["status"] = "active"

            return self._document_to_out(did)


_db: Optional[MockDB] = None


def get_db() -> MockDB:
    global _db
    if _db is None:
        _db = MockDB()
        _db.seed_demo_project()
    return _db
