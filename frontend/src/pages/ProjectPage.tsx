import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProject } from "../lib/projectsApi";
import { listProjectDocuments, uploadManuscriptFile, validateManuscriptFile } from "../lib/storageApi";
import type { Project } from "../lib/types";
import type { StoredDocument } from "../lib/storageApi";
function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Erreur inconnue.";
}

const FILE_INPUT_ACCEPT = ".jpg,.jpeg,.png,.webp,.pdf,.tiff,image/jpeg,image/png,image/webp,application/pdf,image/tiff";

export default function ProjectPage() {
  const { id } = useParams();
  const projectId = id ?? null;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

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
    let cancelled = false;
    async function run() {
      if (!projectId) return;
      setLoadingDocuments(true);
      try {
        const docs = await listProjectDocuments(projectId);
        if (!cancelled) setDocuments(docs);
      } catch (e) {
        if (!cancelled) setError(getErrorMessage(e));
      } finally {
        if (!cancelled) setLoadingDocuments(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  async function onUploadDocument(e: FormEvent) {
    e.preventDefault();
    if (!projectId || !uploadFile) {
      setUploadMessage("Sélectionnez un fichier à importer.");
      return;
    }
    const localErr = validateManuscriptFile(uploadFile);
    if (localErr) {
      setUploadMessage(localErr);
      return;
    }
    setUploading(true);
    setUploadMessage(null);
    try {
      const created = await uploadManuscriptFile(projectId, uploadFile);
      setDocuments((prev) => [created, ...prev]);
      setUploadFile(null);
      setUploadMessage("Document importé avec succès.");
    } catch (err) {
      setUploadMessage(getErrorMessage(err));
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
          <h2 className="text-sm font-semibold text-[#2C1B12]">Documents</h2>
          <form
            onSubmit={onUploadDocument}
            className="mt-4 rounded-xl border border-dashed border-zinc-300 bg-[#F9F6F0] p-4"
          >
            <div className="text-xs font-medium text-[#0B1B2B]">Ajouter un document</div>
            <p className="mt-1 text-xs text-zinc-600">
              Formats : .jpg, .jpeg, .png, .webp, .pdf, .tiff — max 20 Mo.
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
              <input
                type="file"
                accept={FILE_INPUT_ACCEPT}
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                className="w-full min-w-0 flex-1 text-sm text-zinc-800 file:mr-3 file:rounded-lg file:border-0 file:bg-[#2C1B12] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-50"
              />
              <button
                type="submit"
                disabled={uploading}
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#0B1B2B] px-4 py-2 text-sm font-medium text-zinc-50 shadow-sm transition hover:bg-[#0B1B2B]/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? "Envoi..." : "Uploader"}
              </button>
            </div>
            {uploadMessage ? (
              <div
                className={`mt-3 rounded-lg border px-2 py-1.5 text-xs ${
                  uploadMessage.includes("succès")
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-rose-200 bg-rose-50 text-rose-900"
                }`}
              >
                {uploadMessage}
              </div>
            ) : null}
          </form>

          <div className="mt-6 space-y-3">
            {loadingDocuments ? (
              <div className="text-sm text-zinc-700">Chargement des documents…</div>
            ) : documents.length === 0 ? (
              <div className="text-sm text-zinc-700">Aucun document importé.</div>
            ) : (
              documents.map((d) => (
                <div key={d.id} className="rounded-xl border border-zinc-200 bg-white/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-[#0B1B2B]">
                        {d.fileName}
                      </div>
                      <div className="mt-1 text-xs text-zinc-600">{d.fileType}</div>
                    </div>
                    <span className="rounded-full bg-[#B08D57]/15 px-2 py-1 text-xs font-medium text-[#2C1B12] ring-1 ring-inset ring-[#B08D57]/30">
                      {d.pageCount} page(s)
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <aside className="rounded-2xl border border-zinc-200 bg-white/60 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[#2C1B12]">Raccourci</h2>
          <p className="mt-2 text-sm text-zinc-700">
            Première page : <span className="font-medium">—</span>
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

