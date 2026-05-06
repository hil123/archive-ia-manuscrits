export default function App() {
  return (
    <div className="min-h-dvh bg-[#F6F1E7] text-zinc-900">
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-semibold tracking-tight">
          Archive-IA Manuscrits
        </h1>

        <p className="mt-3 max-w-prose text-base leading-relaxed text-zinc-700">
          Importez des pages manuscrites, corrigez une transcription IA simulée, puis
          exportez le texte final.
        </p>

        <div className="mt-8">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-zinc-50 shadow-sm transition hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
          >
            Créer un projet
          </button>
        </div>
      </main>
    </div>
  );
}

