import { useEffect, useMemo, useState } from "react";
import type { Line } from "../lib/types";
import { getLinesByPage, updateLineCorrection, validateLine } from "../lib/linesApi";
import LineCard from "./LineCard";

type Props = {
  pageId: string | null;
};

export default function TranscriptionEditor({ pageId }: Props) {
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function getErrorMessage(err: unknown): string {
    return err instanceof Error ? err.message : "Erreur inconnue.";
  }

  const stats = useMemo(() => {
    const total = lines.length;
    const validated = lines.filter((l) => l.status === "validated").length;
    const corrected = lines.filter((l) => l.status === "corrected").length;
    const pending = lines.filter((l) => l.status === "pending").length;
    return { total, validated, corrected, pending };
  }, [lines]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!pageId) {
        setLines([]);
        setSuccess(null);
        return;
      }
      setError(null);
      setSuccess(null);
      setLoading(true);
      try {
        const data = await getLinesByPage(pageId);
        if (cancelled) return;
        setLines(data.slice().sort((a, b) => a.lineNumber - b.lineNumber));
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
  }, [pageId]);

  async function onSave() {
    if (!pageId || lines.length === 0) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await Promise.all(
        lines.map((l) => updateLineCorrection(l.id, l.humanCorrection)),
      );
      setLines(updated.slice().sort((a, b) => a.lineNumber - b.lineNumber));
      setSuccess("Corrections enregistrées.");
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function onValidateLine(lineId: string) {
    setError(null);
    setSuccess(null);
    try {
      const u = await validateLine(lineId);
      setLines((prev) => prev.map((l) => (l.id === u.id ? u : l)));
      setSuccess(`Ligne ${u.lineNumber} validée.`);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white/60 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[#0B1B2B]">Transcription paléographique</h2>
          <p className="mt-1 text-xs text-zinc-600">
            Données chargées depuis Supabase. Sauvegarde = écriture des corrections en base.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={!pageId || loading || saving || lines.length === 0}
            className="inline-flex items-center justify-center rounded-xl bg-[#0B1B2B] px-4 py-2 text-sm font-medium text-zinc-50 shadow-sm transition hover:bg-[#0B1B2B]/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Sauvegarde…" : "Sauvegarder"}
          </button>
          <div className="text-xs text-zinc-600">
            {stats.total === 0
              ? "—"
              : `${stats.validated}/${stats.total} validées · ${stats.corrected} corrigées · ${stats.pending} en attente`}
          </div>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {success}
        </div>
      ) : null}

      <div className="mt-4 grid gap-3">
        {loading ? (
          <div className="rounded-xl border border-zinc-200 bg-white px-3 py-6 text-center text-sm text-zinc-600">
            Chargement des lignes…
          </div>
        ) : !pageId ? (
          <div className="rounded-xl border border-zinc-200 bg-white px-3 py-6 text-center text-sm text-zinc-600">
            Ouvrez une page pour commencer.
          </div>
        ) : lines.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white px-3 py-6 text-center text-sm text-zinc-600">
            Aucune ligne pour cette page. Importez un document sur le projet.
          </div>
        ) : (
          lines.map((line) => (
            <LineCard
              key={line.id}
              line={line}
              onChange={(text) =>
                setLines((prev) =>
                  prev.map((l) => {
                    if (l.id !== line.id) return l;
                    const nextStatus =
                      l.status === "validated"
                        ? "corrected"
                        : text !== l.aiSuggestion
                          ? "corrected"
                          : "pending";
                    const humanCorrection = text;
                    const finalText = humanCorrection.trim() ? humanCorrection : l.aiSuggestion;
                    return { ...l, humanCorrection, finalText, status: nextStatus };
                  }),
                )
              }
              onValidate={() => onValidateLine(line.id)}
            />
          ))
        )}
      </div>
    </section>
  );
}
