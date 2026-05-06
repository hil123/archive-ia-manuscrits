type Props = {
  confidenceScore: number; // 0..1
};

function clamp01(v: number) {
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

export default function ConfidenceBadge({ confidenceScore }: Props) {
  const c = clamp01(confidenceScore);
  const label = `${Math.round(c * 100)}%`;
  const tone =
    c >= 0.8 ? "bg-emerald-50 text-emerald-900 ring-emerald-200" : c >= 0.65 ? "bg-amber-50 text-amber-900 ring-amber-200" : "bg-rose-50 text-rose-900 ring-rose-200";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tone}`}
      title="Confiance IA (mock)"
    >
      {label}
    </span>
  );
}

