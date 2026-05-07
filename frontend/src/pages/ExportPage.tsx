import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { buildProjectTxt, registerTxtExport } from "../lib/exportApi";

function downloadTxt(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ExportPage() {
  const { id } = useParams();
  const projectId = id ?? null;
  const [projectTitle, setProjectTitle] = useState<string>("");
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function getErrorMessage(err: unknown): string {
    return err instanceof Error ? err.message : "Erreur inconnue.";
  }

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!projectId) return;
      setLoading(true);
      setError(null);
      try {
        const payload = await buildProjectTxt(projectId);
        if (cancelled) return;
        setProjectTitle(payload.title);
        setText(payload.text);
      } catch (e) {
        if (cancelled) return;
        setError(getErrorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  async function handleDownloadTxt() {
    if (!projectId) return;
    setDownloading(true);
    setError(null);
    try {
      const payload = await buildProjectTxt(projectId);
      await registerTxtExport(projectId);
      downloadTxt(filename, payload.text);
      setProjectTitle(payload.title);
      setText(payload.text);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setDownloading(false);
    }
  }

  const filename = useMemo(() => {
    const base = (projectTitle ?? "archive-ia-manuscrits")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    return `${base || "export"}.txt`;
  }, [projectTitle]);

  if (!projectId) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white/60 p-5 text-sm text-zinc-700">
        Projet introuvable.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0B1B2B]">
            Export TXT
          </h1>
          <p className="mt-1 text-sm text-zinc-700">
            {projectTitle || (loading ? "Préparation…" : "—")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/projects/${projectId}/editor`}
            className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white/70 px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-white"
          >
            Retour éditeur
          </Link>
          <button
            type="button"
            onClick={handleDownloadTxt}
            disabled={loading || !!error || downloading}
            className="inline-flex items-center justify-center rounded-xl bg-[#0B1B2B] px-4 py-2 text-sm font-medium text-zinc-50 shadow-sm transition hover:bg-[#0B1B2B]/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {downloading ? "Téléchargement…" : "Télécharger TXT"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {error}
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white/60 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-[#2C1B12]">Prévisualisation</div>
          <div className="text-xs text-zinc-600">{filename}</div>
        </div>
        <textarea
          value={loading ? "Chargement…" : text}
          readOnly
          rows={16}
          className="mt-3 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 font-mono text-xs text-zinc-900 outline-none"
        />
      </div>
    </div>
  );
}

