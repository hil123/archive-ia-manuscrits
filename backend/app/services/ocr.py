"""OCR — V1 mockée."""

from __future__ import annotations

import random
from typing import Any


def mock_extract_lines_for_page(
    page_number: int,
) -> list[dict[str, Any]]:
    """
    Génère des lignes OCR + scores fictifs (déterministe léger via page_number).
    """
    rnd = random.Random(page_number * 7919)
    n_lines = 8 + (page_number % 5)
    out: list[dict[str, Any]] = []
    for i in range(n_lines):
        score = 0.55 + rnd.random() * 0.4
        ocr_raw = f"Ligne {i + 1} - ocr brut simule (page {page_number})."
        ai_suggestion = f"Ligne {i + 1} — texte proposé après nettoyage (mock)."
        out.append(
            {
                "line_number": i + 1,
                "ocr_raw": ocr_raw,
                "ai_suggestion": ai_suggestion,
                "confidence_score": round(score, 3),
                "human_correction": "",
                "status": "pending",
            }
        )
    return out
