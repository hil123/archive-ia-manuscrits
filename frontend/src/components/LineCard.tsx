import ConfidenceBadge from "./ConfidenceBadge";
import type { Line } from "../lib/types";

type Props = {
  line: Line;
  onChange: (nextCorrectedText: string) => void;
  onValidate: () => void | Promise<void>;
  /** Enregistrement Supabase (ligne + historique) à la sortie du champ. */
  onCommitCorrection?: (lineId: string, text: string) => void | Promise<void>;
  isCommitting?: boolean;
};

function StatusPill({ status }: { status: Line["status"] }) {
  const ui =
    status === "validated"
      ? {
          label: "Validated",
          cls: "bg-emerald-50 text-emerald-900 ring-emerald-200"
        }
      : status === "corrected"
        ? {
            label: "Corrected",
            cls: "bg-[#B08D57]/15 text-[#2C1B12] ring-[#B08D57]/30"
          }
        : {
            label: "Pending",
            cls: "bg-zinc-50 text-zinc-800 ring-zinc-200"
          };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${ui.cls}`}
      title="Statut de la ligne"
    >
      {ui.label}
    </span>
  );
}

export default function LineCard({
  line,
  onChange,
  onValidate,
  onCommitCorrection,
  isCommitting,
}: Props) {
  const isEdited = line.humanCorrection !== line.aiSuggestion;
  const isValidated = line.status === "validated";

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/70 p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-xs font-semibold text-[#2C1B12]">Ligne {line.lineNumber}</div>
            <StatusPill status={line.status} />
            {isEdited && line.status !== "validated" ? (
              <span className="rounded-full bg-[#0B1B2B]/10 px-2 py-0.5 text-[11px] font-medium text-[#0B1B2B] ring-1 ring-inset ring-[#0B1B2B]/15">
                En cours
              </span>
            ) : null}
          </div>

          <div className="mt-3 grid gap-2">
            <div className="rounded-xl border border-zinc-200 bg-white/70 px-3 py-2">
              <div className="text-[11px] font-medium text-[#0B1B2B]/80">OCR brut</div>
              <div className="mt-1 text-sm text-zinc-800">{line.ocrRaw}</div>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white/70 px-3 py-2">
              <div className="text-[11px] font-medium text-[#0B1B2B]/80">Proposition IA</div>
              <div className="mt-1 text-sm text-zinc-800">{line.aiSuggestion}</div>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white/70 px-3 py-2">
              <div className="text-[11px] font-medium text-[#0B1B2B]/80">Texte final</div>
              <div className="mt-1 text-sm text-zinc-800">{line.finalText || "—"}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ConfidenceBadge confidenceScore={line.confidenceScore} />
          <button
            type="button"
            onClick={() => void Promise.resolve(onValidate())}
            disabled={isValidated || isCommitting}
            className="inline-flex items-center justify-center rounded-xl bg-[#2C1B12] px-3 py-2 text-sm font-medium text-zinc-50 shadow-sm transition hover:bg-[#2C1B12]/90 disabled:cursor-not-allowed disabled:opacity-60"
            title={isValidated ? "Déjà validée" : "Valider la ligne"}
          >
            Valider
          </button>
        </div>
      </div>

      <div className="mt-3">
        <label className="block text-xs font-medium text-[#0B1B2B]">Correction humaine</label>
        <textarea
          value={line.humanCorrection}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => {
            if (!onCommitCorrection) return;
            void Promise.resolve(onCommitCorrection(line.id, e.target.value));
          }}
          disabled={isCommitting}
          rows={2}
          className="mt-1 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-inner outline-none ring-0 placeholder:text-zinc-400 focus:border-[#0B1B2B]/50 focus:ring-2 focus:ring-[#0B1B2B]/15 disabled:cursor-wait disabled:opacity-70"
        />
        <div className="mt-1 text-[11px] text-zinc-600">
          En quittant ce champ, la correction est enregistrée dans Supabase (tables{" "}
          <span className="font-medium">lines</span> et <span className="font-medium">corrections</span>
          ). Utilisez <span className="font-medium">Valider</span> pour figer la ligne.
        </div>
      </div>
    </div>
  );
}

