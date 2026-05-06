"""Export texte — V1."""

from __future__ import annotations

from datetime import datetime, timezone

from app.data.mock_db import MockDB
from app.models.schemas import LineOut, ProjectOut


def _line_to_export_text(ln: LineOut) -> str:
    """
    Priorité :
    - ligne validée → texte final retenu ;
    - sinon correction humaine renseignée → texte final (corrigé) ;
    - sinon proposition IA.
    """
    if ln.status == "validated":
        return (ln.final_text or ln.ai_suggestion or "").strip()
    if (ln.human_correction or "").strip():
        return (ln.final_text or ln.human_correction or ln.ai_suggestion or "").strip()
    return (ln.ai_suggestion or "").strip()


def build_project_txt(db: MockDB, project_id: str) -> str:
    proj: ProjectOut | None = db.get_project(project_id)
    if proj is None:
        raise KeyError(project_id)

    now = datetime.now(timezone.utc)
    date_str = now.strftime("%Y-%m-%d %H:%M:%S UTC")

    lines_out: list[str] = [
        proj.title,
        "",
        f"Date d'export : {date_str}",
        "",
        "---",
        "",
    ]

    for doc in proj.documents:
        lines_out.append(f"## {doc.file_name}")
        for page in doc.pages:
            lines_out.append(f"### Page {page.page_number}")
            page_lines = db.list_lines(page.id)
            for ln in page_lines:
                lines_out.append(_line_to_export_text(ln))
            lines_out.append("")

    return "\n".join(lines_out).rstrip() + "\n"
