"""Correction / suggestion IA — V1 mockée."""

from __future__ import annotations


def mock_refine_suggestion(ocr_raw: str) -> str:
    """
    Simule une proposition à partir de l'OCR brut (V1 : règle triviale).
    """
    t = ocr_raw.strip()
    if not t:
        return ""
    # léger « nettoyage » fictif
    return t.replace("  ", " ").replace("simule", "simulé")
