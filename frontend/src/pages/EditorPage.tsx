import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ManuscriptViewer from "../components/ManuscriptViewer";
import TranscriptionEditor from "../components/TranscriptionEditor";
import { getErrorMessage, getProject, isBackendUnreachable } from "../lib/api";
import type { Page, Project } from "../lib/types";

function firstPage(project: Project | null): Page | null {
  const doc = project?.documents[0];
  return doc?.pages[0] ?? null;
}

export default function EditorPage() {
  const { id } = useParams();
  const projectId = id ?? null;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState(false);

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

  const page = useMemo(() => firstPage(project), [project]);
  const pageId = page?.id ?? null;

  if (!loading && !error && projectId && project === null) {
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

  if (!projectId) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white/60 p-5 text-sm text-zinc-700">
        Projet introuvable.
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
            Éditeur
          </h1>
          <p className="mt-1 text-sm text-zinc-700">
            {loading ? "Chargement du projet…" : project?.title ?? "—"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to={`/projects/${projectId}`}
            className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white/70 px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-white"
          >
            Détail projet
          </Link>
          <Link
            to={`/projects/${projectId}/export`}
            className="inline-flex items-center justify-center rounded-xl bg-[#0B1B2B] px-4 py-2 text-sm font-medium text-zinc-50 shadow-sm transition hover:bg-[#0B1B2B]/90"
          >
            Export TXT
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ManuscriptViewer page={page} />
        <TranscriptionEditor pageId={pageId} />
      </div>
    </div>
  );
}
