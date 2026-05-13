import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProject } from "../lib/projectsApi";
import {
  listProjectDocuments,
  uploadManuscriptFile,
  validateManuscriptFile,
  type StoredDocument,
} from "../lib/storageApi";
import type { Project } from "../lib/types";

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Erreur inconnue.";
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

export default function ProjectPage() {
  const { id } = useParams();
  const projectId = id ?? null;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const refreshDocuments = useCallback(async () => {
    if (!projectId) return;
    setDocsLoading(true);
    setDocsError(null);
    try {
      const list = await listProjectDocuments(projectId);
      setDocuments(list);
    } catch (e) {
      setDocsError(getErrorMessage(e));
    } finally {
      setDocsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!projectId) return;
      setLoading(true);
      setError(null);
      try {
        const p = await getProject(projectId);
        if (!cancelled) setProject(p);
      } catch (e) {
        if (!cancelled) {
          setError(getErrorMessage(e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    (async () => {
      setDocsLoading(true);
      setDocsError(null);
      try {
        const list = await listProjectDocuments(projectId);
        if (!cancelled) setDocuments(list);
      } catch (e) {
        if (!cancelled) setDocsError(getErrorMessage(e));
      } finally {
        if (!cancelled) setDocsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  async function onPickFile(file: File | null) {
    if (!file || !projectId) return;
    const local = validateManuscriptFile(file);
    if (local) {
      setUploadError(local);
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      await uploadManuscriptFile(projectId, file);
      await refreshDocuments();
    } catch (e) {
      setUploadError(getErrorMessage(e));
    } finally {
      setUploading(false);
    }
  }

  if (!projectId) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white/60 p-5 text-sm text-zinc-700">
        Projet introuvable.
      </div>
    );
  }

  if (!loading && !error && project === null) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white/60 p-5 text-sm text-zinc-700">
        Projet introuvable.
      </div>
    );
  }

  if (!loading && error && project === null) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-900">
        {error}
      </div>
    );
  }

  return (
    <div>
      {error ? (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0B1B2B]">
            {project?.title ?? (loading ? "Chargement…" : "Projet")}
          </h1>
          <p className="mt-1 text-sm text-zinc-700">
            {project?.description ?? "—"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to={`/projects/${projectId}/editor`}
            className="inline-flex items-center justify-center rounded-xl bg-[#0B1B2B] px-4 py-2 text-sm font-medium text-zinc-50 shadow-sm transition hover:bg-[#0B1B2B]/90"
          >
            Ouvrir l’éditeur
          </Link>
          <Link
            to={`/projects/${projectId}/export`}
            className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white/70 px-4 py-2 text-sm font-medium text-[#2C1B12] shadow-sm transition hover:bg-white"
          >
            Export TXT
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-zinc-200 bg-white/60 p-5 shadow-sm lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="text-sm font-semibold text-[#2C1B12]">Documents</h2>
            <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-[#2C1B12] shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf,.tiff"
                className="sr-only"
                disabled={uploading || docsLoading}
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  e.target.value = "";
                  void onPickFile(f);
                }}
              />
              {uploading ? "Envoi…" : "Ajouter un fichier"}
            </label>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Formats : JPG, JPEG, PNG, WebP, PDF, TIFF — max. 20 Mo. Les PDF ne génèrent pas encore de
            pages (pas de conversion).
          </p>

          {uploadError ? (
            <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
              {uploadError}
            </div>
          ) : null}

          {docsError ? (
            <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
              {docsError}
            </div>
          ) : null}

          {docsLoading ? (
            <p className="mt-4 text-sm text-zinc-600">Chargement des documents…</p>
          ) : !docsError && documents.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-700">
              Aucun document pour ce projet. Utilisez « Ajouter un fichier » pour envoyer une image ou
              un PDF vers le stockage sécurisé.
            </p>
          ) : !docsError ? (
            <ul className="mt-4 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white/80">
              {documents.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[#0B1B2B]">{d.fileName}</p>
                    <p className="text-xs text-zinc-500">
                      {d.fileType.toUpperCase()} · {d.pageCount} page{d.pageCount > 1 ? "s" : ""} ·{" "}
                      {d.status}
                      {d.createdAt ? ` · ${formatDate(d.createdAt)}` : null}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <aside className="rounded-2xl border border-zinc-200 bg-white/60 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[#2C1B12]">Raccourci</h2>
          <p className="mt-2 text-sm text-zinc-700">
            Statut :{" "}
            <span className="font-medium">{project?.status ?? (loading ? "…" : "—")}</span>
          </p>
          <div className="mt-4 grid gap-2">
            <Link
              to={`/projects/${projectId}/editor`}
              className="inline-flex items-center justify-center rounded-xl bg-[#2C1B12] px-4 py-2 text-sm font-medium text-zinc-50 shadow-sm transition hover:bg-[#2C1B12]/90"
            >
              Corriger la transcription
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white/70 px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-white"
            >
              Retour dashboard
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
