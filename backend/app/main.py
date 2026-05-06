from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routes import documents, exports, lines, pages, projects
from app.services.upload_handler import UPLOAD_DIR

app = FastAPI(
    title="Archive-IA Manuscrits API",
    version="0.1.0",
    description="V1 — données en mémoire, services OCR/IA mockés.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.include_router(projects.router, prefix="/projects", tags=["projects"])
app.include_router(documents.router, prefix="/projects", tags=["documents"])
app.include_router(pages.router_project_pages, prefix="/projects", tags=["pages"])
app.include_router(pages.router_pages, prefix="/pages", tags=["pages"])
app.include_router(lines.router, tags=["lines"])
app.include_router(exports.router, prefix="/projects", tags=["exports"])
