import type { Document, Line, Page, Project } from "./types";

/** Base URL du backend FastAPI (lancer : `uvicorn app.main:app --reload --port 8000`). */
export const API_BASE_URL = "http://127.0.0.1:8000";

/** Aligné sur le backend V1 (`MAX_UPLOAD_BYTES`). */
export const MAX_UPLOAD_FILE_BYTES = 20 * 1024 * 1024;

/** Validation UX avant envoi (alignée sur l’API). */
export function validateUploadFile(file: File): string | null {
  if (file.size > MAX_UPLOAD_FILE_BYTES) {
    return "Fichier trop volumineux. Taille maximale : 20 Mo.";
  }
  const name = file.name.toLowerCase();
  if (!/\.(pdf|jpe?g|png)$/.test(name)) {
    return "Format non accepté. Utilisez .pdf, .jpg, .jpeg ou .png.";
  }
  return null;
}

/** URL absolue pour les chemins renvoyés par l’API (ex. `/uploads/...`). */
export function mediaUrl(pathOrUrl?: string | null): string | undefined {
  if (pathOrUrl == null) return undefined;
  const s = String(pathOrUrl).trim();
  if (!s) return undefined;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/")) return `${API_BASE_URL}${s}`;
  return `${API_BASE_URL}/${s}`;
}

export class ApiError extends Error {
  readonly status?: number;
  readonly code: "NETWORK" | "HTTP";

  constructor(message: string, code: ApiError["code"], status?: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

function backendUnreachableMessage(): string {
  return "Impossible de joindre le serveur. Lancez le backend FastAPI (ex. uvicorn sur le port 8000) et réessayez.";
}

async function readErrorDetail(res: Response): Promise<string> {
  try {
    const data: unknown = await res.json();
    if (data && typeof data === "object" && "detail" in data) {
      const d = (data as { detail: unknown }).detail;
      if (typeof d === "string") return d;
      if (Array.isArray(d)) {
        return d
          .map((x) => (x && typeof x === "object" && "msg" in x ? String((x as { msg: unknown }).msg) : String(x)))
          .join(" · ");
      }
    }
  } catch {
    /* ignore */
  }
  return res.statusText || `Erreur HTTP ${res.status}`;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.headers as Record<string, string> | undefined),
      },
    });
    if (res.status === 204) return undefined as T;
    if (!res.ok) {
      const detail = await readErrorDetail(res);
      throw new ApiError(detail, "HTTP", res.status);
    }
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e instanceof TypeError) {
      throw new ApiError(backendUnreachableMessage(), "NETWORK");
    }
    throw e;
  }
}

export function isBackendUnreachable(err: unknown): boolean {
  return err instanceof ApiError && err.code === "NETWORK";
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError || err instanceof Error) return err.message;
  return "Erreur inconnue.";
}

export async function getProjects(): Promise<Project[]> {
  return fetchJson<Project[]>(`${API_BASE_URL}/projects`);
}

export async function createProject(input: {
  title: string;
  description?: string;
}): Promise<Project> {
  return fetchJson<Project>(`${API_BASE_URL}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: input.title,
      description: input.description?.trim() ? input.description.trim() : undefined,
    }),
  });
}

export async function getProject(projectId: string): Promise<Project | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/projects/${encodeURIComponent(projectId)}`, {
      headers: { Accept: "application/json" },
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      const detail = await readErrorDetail(res);
      throw new ApiError(detail, "HTTP", res.status);
    }
    return (await res.json()) as Project;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e instanceof TypeError) {
      throw new ApiError(backendUnreachableMessage(), "NETWORK");
    }
    throw e;
  }
}

export async function uploadDocument(projectId: string, file: File): Promise<Document> {
  const form = new FormData();
  form.append("file", file);
  return fetchJson<Document>(
    `${API_BASE_URL}/projects/${encodeURIComponent(projectId)}/documents/upload`,
    {
      method: "POST",
      body: form,
    },
  );
}

export async function getProjectPages(projectId: string): Promise<Page[]> {
  return fetchJson<Page[]>(
    `${API_BASE_URL}/projects/${encodeURIComponent(projectId)}/pages`,
  );
}

export async function getPageLines(pageId: string): Promise<Line[]> {
  return fetchJson<Line[]>(`${API_BASE_URL}/pages/${encodeURIComponent(pageId)}/lines`);
}

export async function updateLineCorrection(lineId: string, correction: string): Promise<Line> {
  return fetchJson<Line>(`${API_BASE_URL}/lines/${encodeURIComponent(lineId)}/correction`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ humanCorrection: correction }),
  });
}

export async function validateLine(lineId: string): Promise<Line> {
  return fetchJson<Line>(`${API_BASE_URL}/lines/${encodeURIComponent(lineId)}/validate`, {
    method: "POST",
  });
}

export async function exportProjectTxt(projectId: string): Promise<string> {
  const url = `${API_BASE_URL}/projects/${encodeURIComponent(projectId)}/export/txt`;
  try {
    const res = await fetch(url, { headers: { Accept: "text/plain" } });
    if (!res.ok) {
      const detail = await readErrorDetail(res);
      throw new ApiError(detail, "HTTP", res.status);
    }
    return await res.text();
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e instanceof TypeError) {
      throw new ApiError(backendUnreachableMessage(), "NETWORK");
    }
    throw e;
  }
}

/** Compatibilité avec l’ancien module (appels existants). */
export const api = {
  listProjects: getProjects,
  getProject,
  createProject,
  uploadDocument,
  getProjectPages,
  getPageLines,
  updateLineCorrection,
  validateLine,
  exportProjectTxt,
  /** @deprecated utiliser exportProjectTxt */
  exportProjectText: exportProjectTxt,
};
