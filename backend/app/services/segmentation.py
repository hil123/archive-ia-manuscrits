"""Segmentation des pages — V1 mockée (1 page par document)."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class PageSegment:
    page_number: int
    image_url: str | None


def mock_segment_pages(file_name: str, mime_type: str) -> list[PageSegment]:
    """
    V1 : retourne toujours une seule page « extraite »,
    sans lecture réelle du PDF/image.
    """
    _ = (file_name, mime_type)
    return [
        PageSegment(
            page_number=1,
            image_url=None,
        )
    ]
