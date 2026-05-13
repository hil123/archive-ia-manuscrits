import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProject } from "../lib/projectsApi";
import type { Project } from "../lib/types";

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Erreur inconnue.";
}

export default function ProjectPage() {
  const { id } = useParams();
  const projectId = id ?? null;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          <p className="mt-3 text-sm text-zinc-700">
            Les documents seront rattachés à ce projet dans une étape ultérieure (upload Supabase
            Storage).
          </p>
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
