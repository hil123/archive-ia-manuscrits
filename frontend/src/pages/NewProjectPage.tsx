import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createProject,
  getErrorMessage,
  isBackendUnreachable,
  uploadDocument,
  validateUploadFile,
} from "../lib/api";

const FILE_INPUT_ACCEPT = ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";

export default function NewProjectPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Choisissez un fichier (.jpg, .jpeg, .png ou .pdf).");
      setNetworkError(false);
      return;
    }
    const localErr = validateUploadFile(file);
    if (localErr) {
      setError(localErr);
      setNetworkError(false);
      return;
    }
    setSubmitting(true);
    setError(null);
    setNetworkError(false);
    try {
      const project = await createProject({
        title: title.trim() || "Nouveau projet",
        description,
      });
      await uploadDocument(project.id, file);
      navigate(`/projects/${project.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
      setNetworkError(isBackendUnreachable(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight text-[#0B1B2B]">
        Créer un projet
      </h1>
      <p className="mt-1 text-sm text-zinc-700">
        Création du projet puis envoi du fichier vers{" "}
        <code className="rounded bg-zinc-100 px-1 text-xs">
          POST /projects/&#123;id&#125;/documents/upload
        </code>
        .
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-6 space-y-4 rounded-2xl border border-zinc-200 bg-white/60 p-5 shadow-sm"
      >
        {error ? (
          <div
            className={`rounded-xl border px-3 py-2 text-sm ${
              networkError
                ? "border-amber-200 bg-amber-50 text-amber-950"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
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

        <div>
          <label className="block text-sm font-medium text-[#2C1B12]">
            Fichier manuscrit
          </label>
          <input
            type="file"
            accept={FILE_INPUT_ACCEPT}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 w-full text-sm text-zinc-800 file:mr-3 file:rounded-lg file:border-0 file:bg-[#0B1B2B] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-50"
          />
          <p className="mt-1 text-xs text-zinc-600">
            Formats : .jpg, .jpeg, .png, .pdf — taille max. 20 Mo (contrôle navigateur + serveur).
          </p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center rounded-xl bg-[#0B1B2B] px-4 py-3 text-sm font-medium text-zinc-50 shadow-sm transition hover:bg-[#0B1B2B]/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Envoi…" : "Créer le projet et uploader"}
          </button>
        </div>
      </form>
    </div>
  );
}
