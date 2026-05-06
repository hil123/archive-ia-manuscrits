import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getErrorMessage,
  getProject,
  isBackendUnreachable,
  uploadDocument,
  validateUploadFile,
} from "../lib/api";
import type { Page, Project } from "../lib/types";

const FILE_INPUT_ACCEPT = ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";

function pickFirstPage(project: Project | null): Page | null {
  if (!project) return null;
  const doc = project.documents[0];
  const page = doc?.pages[0];
  return page ?? null;
}

export default function ProjectPage() {
  const { id } = useParams();
  const projectId = id ?? null;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState(false);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadNetworkError, setUploadNetworkError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!projectId) return;
      setLoading(true);
      setError(null);
      setNetworkError(false);
      try {
        const p = await getProject(projectId);
        if (!cancelled) setProject(p);
      } catch (e) {
        if (!cancelled) {
          setError(getErrorMessage(e));
          setNetworkError(isBackendUnreachable(e));
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

  const firstPage = useMemo(() => pickFirstPage(project), [project]);

  async function onUploadDocument(e: FormEvent) {
    e.preventDefault();
    if (!projectId || !uploadFile) {
      setUploadMessage("Sélectionnez un fichier (.jpg, .jpeg, .png ou .pdf).");
      setUploadNetworkError(false);
      return;
    }
    const localErr = validateUploadFile(uploadFile);
    if (localErr) {
      setUploadMessage(localErr);
      setUploadNetworkError(false);
      return;
    }
    setUploading(true);
    setUploadMessage(null);
    setUploadNetworkError(false);
    try {
      await uploadDocument(projectId, uploadFile);
      const p = await getProject(projectId);
      setProject(p);
      setUploadFile(null);
      setUploadMessage("Document importé avec succès.");
    } catch (err) {
      setUploadMessage(getErrorMessage(err));
      setUploadNetworkError(isBackendUnreachable(err));
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
      <div
        className={`rounded-xl border px-3 py-3 text-sm ${
          networkError
            ? "border-amber-200 bg-amber-50 text-amber-950"
            : "border-rose-200 bg-rose-50 text-rose-900"
        }`}
      >
        {error}
      </div>
    );
  }

  return (
    <div>
      {error ? (
        <div
          className={`mb-4 rounded-xl border px-3 py-2 text-sm ${
            networkError
              ? "border-amber-200 bg-amber-50 text-amber-950"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
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
              .jpg, .jpeg, .png, .pdf — max. 20 Mo. Envoi vers{" "}
              <code className="rounded bg-white px-1">POST .../documents/upload</code>
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
                {uploading ? "Envoi…" : "Uploader"}
              </button>
            </div>
            {uploadMessage ? (
              <div
                className={`mt-3 rounded-lg border px-2 py-1.5 text-xs ${
                  uploadNetworkError
                    ? "border-amber-200 bg-amber-50 text-amber-950"
                    : uploadMessage.includes("succès")
                      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                      : "border-rose-200 bg-rose-50 text-rose-900"
                }`}
              >
                {uploadMessage}
              </div>
            ) : null}
          </form>

          <div className="mt-6 space-y-3">
            {(project?.documents ?? []).length === 0 ? (
              <div className="text-sm text-zinc-700">Aucun document importé.</div>
            ) : (
              project!.documents.map((d) => (
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
            Première page :{" "}
            <span className="font-medium">
              {firstPage ? `Page ${firstPage.pageNumber}` : "—"}
            </span>
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

