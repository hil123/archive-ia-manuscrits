import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createProject } from "../lib/projectsApi";

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Erreur inconnue.";
}

export default function NewProjectPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const project = await createProject({
        title: title.trim() || "Nouveau projet",
        description,
      });
      navigate(`/projects/${project.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight text-[#0B1B2B]">
        Créer un projet
      </h1>
      <p className="mt-1 text-sm text-zinc-700">Création d’un projet dans Supabase.</p>

      <form
        onSubmit={onSubmit}
        className="mt-6 space-y-4 rounded-2xl border border-zinc-200 bg-white/60 p-5 shadow-sm"
      >
        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
            {error}
          </div>
        ) : null}

        <div>
          <label className="block text-sm font-medium text-[#2C1B12]">Titre</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0B1B2B]/50 focus:ring-2 focus:ring-[#0B1B2B]/15"
            placeholder="Ex. Carnets 1892"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#2C1B12]">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0B1B2B]/50 focus:ring-2 focus:ring-[#0B1B2B]/15"
            placeholder="Notes, contexte, source… (optionnel)"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center rounded-xl bg-[#0B1B2B] px-4 py-3 text-sm font-medium text-zinc-50 shadow-sm transition hover:bg-[#0B1B2B]/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Création…" : "Créer le projet"}
          </button>
        </div>
      </form>
    </div>
  );
}
