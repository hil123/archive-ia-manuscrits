import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Project } from "../lib/types";
import { getProjects } from "../lib/projectsApi";

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Erreur inconnue.";
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const p = await getProjects();
        if (!cancelled) setProjects(p);
      } catch (e) {
        if (!cancelled) {
          setError(getErrorMessage(e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0B1B2B]">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-700">
            Projets listés depuis Supabase (`public.projects`).
          </p>
        </div>
        <Link
          to="/projects/new"
          className="inline-flex items-center justify-center rounded-xl bg-[#0B1B2B] px-4 py-2 text-sm font-medium text-zinc-50 shadow-sm transition hover:bg-[#0B1B2B]/90"
        >
          Créer un projet
        </Link>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white/60 p-5 text-sm text-zinc-700">
            Chargement des projets…
          </div>
        ) : projects !== null && projects.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white/60 p-5 text-sm text-zinc-700">
            Aucun projet.{" "}
            <Link to="/projects/new" className="font-medium text-[#2C1B12] underline">
              Créez le premier
            </Link>
            .
          </div>
        ) : projects !== null ? (
          projects.map((p) => (
            <Link
              key={p.id}
              to={`/projects/${p.id}`}
              className="group rounded-2xl border border-zinc-200 bg-white/70 p-5 shadow-sm transition hover:bg-white hover:shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold text-[#2C1B12] group-hover:text-[#0B1B2B]">
                    {p.title}
                  </div>
                  <div className="mt-1 line-clamp-2 text-sm text-zinc-700">
                    {p.description ?? "—"}
                  </div>
                </div>
                <span className="rounded-full bg-[#B08D57]/15 px-2 py-1 text-xs font-medium text-[#2C1B12] ring-1 ring-inset ring-[#B08D57]/30">
                  {p.documents.length} doc
                </span>
              </div>
              <div className="mt-4 text-xs text-zinc-600">
                Créé : {new Date(p.createdAt).toLocaleString("fr-FR")}
              </div>
            </Link>
          ))
        ) : null}
      </div>
    </div>
  );
}
