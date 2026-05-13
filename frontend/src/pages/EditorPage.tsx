import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ManuscriptViewer from "../components/ManuscriptViewer";
import TranscriptionEditor from "../components/TranscriptionEditor";
import { getLinesByPage } from "../lib/linesApi";
import { getProject } from "../lib/projectsApi";
import { getFirstProjectPage, getSignedImageUrl } from "../lib/storageApi";
import type { Line, Page, Project } from "../lib/types";

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Erreur inconnue.";
}

export default function EditorPage() {
  const { id } = useParams();
  const projectId = id ?? null;
  const [project, setProject] = useState<Project | null>(null);
  const [page, setPage] = useState<Page | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [linesLoading, setLinesLoading] = useState(false);
  const [linesError, setLinesError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageMessage, setImageMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!projectId) return;
      setLoading(true);
      setError(null);
      setImageMessage(null);
      try {
        const p = await getProject(projectId);
        if (cancelled) return;
        setProject(p);
        if (!p) {
          setPage(null);
          return;
        }

        const first = await getFirstProjectPage(projectId);
        if (cancelled) return;
        if (!first) {
          setPage(null);
          setImageMessage(
            "Aucune page image pour ce projet. Importez une image (JPG, PNG, WebP, TIFF) depuis la fiche projet : les PDF n’ont pas encore de page à afficher.",
          );
          return;
        }

        let imageUrl: string | undefined;
        if (first.imageOriginalPath) {
          try {
            // URL signée temporaire (≈1 h) — bucket `manuscripts` reste privé ; rien n’est stocké en base.
            imageUrl = await getSignedImageUrl(first.imageOriginalPath);
          } catch (signedErr) {
            setImageMessage(
              `Impossible d’afficher l’image du bucket privé Supabase (manuscrits). ${getErrorMessage(signedErr)} Vérifiez les droits Storage (RLS) et rechargez la page pour réessayer.`,
            );
          }
        } else {
          setImageMessage(
            "Cette page n’a pas de champ image_original_path : impossible de demander une URL signée à Supabase Storage.",
          );
        }

        setPage({
          id: first.id,
          documentId: first.documentId,
          pageNumber: first.pageNumber,
          imageUrl,
        });
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
    const pid = page?.id ?? null;
    if (!pid) {
      setLines([]);
      setLinesLoading(false);
      setLinesError(null);
      return;
    }
    setLines([]);
    setLinesLoading(true);
    setLinesError(null);
    (async () => {
      try {
        const data = await getLinesByPage(pid);
        if (!cancelled) {
          setLines(data.slice().sort((a, b) => a.lineNumber - b.lineNumber));
        }
      } catch (e) {
        if (!cancelled) setLinesError(getErrorMessage(e));
      } finally {
        if (!cancelled) setLinesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page?.id]);

  const pageId = useMemo(() => page?.id ?? null, [page]);

  if (!loading && !error && projectId && project === null) {
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
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {error}
        </div>
      ) : null}
      {imageMessage ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {imageMessage}
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
        <TranscriptionEditor
          pageId={pageId}
          lines={lines}
          setLines={setLines}
          linesLoading={linesLoading}
          linesError={linesError}
        />
      </div>
    </div>
  );
}
