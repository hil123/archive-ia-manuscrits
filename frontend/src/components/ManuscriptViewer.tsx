import { useEffect, useMemo, useState } from "react";
import { mediaUrl } from "../lib/api";
import type { Page } from "../lib/types";

type Props = {
  page: Page | null;
};

/** À partir du chemin ou de l’URL stockée côté API (ex. `/uploads/abc.png`). */
function assetKindFromUrl(url: string): "pdf" | "raster" | "unknown" {
  const path = url.split("?")[0]?.toLowerCase() ?? "";
  if (path.endsWith(".pdf")) return "pdf";
  if (
    path.endsWith(".png") ||
    path.endsWith(".jpg") ||
    path.endsWith(".jpeg") ||
    path.endsWith(".webp") ||
    path.endsWith(".tiff") ||
    path.endsWith(".tif")
  ) {
    return "raster";
  }
  return "unknown";
}

function PdfPlaceholder({ downloadHref }: { downloadHref?: string }) {
  return (
    <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="text-sm font-semibold text-[#2C1B12]">
        PDF importé — conversion page image prévue en V1.2
      </div>
      <p className="max-w-md text-xs leading-relaxed text-zinc-600">
        L’aperçu visuel du PDF n’est pas rendu dans l’éditeur en V1. Le fichier est bien stocké sur
        le serveur.
      </p>
      {downloadHref ? (
        <a
          href={downloadHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-[#0B1B2B] underline"
        >
          Ouvrir le fichier PDF
        </a>
      ) : null}
    </div>
  );
}

function GenericPlaceholder() {
  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden">
      <div className="absolute inset-0 origin-top-left p-6" style={{ transform: "scale(1)" }}>
        <div className="h-full w-full rounded-xl border border-[#B08D57]/30 bg-gradient-to-br from-[#F9F4EA] to-[#EFE6D6] shadow-inner">
          <div className="p-5">
            <div className="text-xs font-medium text-[#0B1B2B]/80">Aucun visuel de page</div>
            <div className="mt-4 space-y-3">
              {Array.from({ length: 11 }).map((_, i) => (
                <div
                  key={i}
                  className="h-2 rounded-full bg-[#2C1B12]/10"
                  style={{ width: `${65 + ((i * 13) % 25)}%` }}
                />
              ))}
              <div className="pt-2 text-[11px] text-zinc-600">
                Importez une image (.jpg / .png) pour afficher le manuscrit ici.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ManuscriptViewer({ page }: Props) {
  const [zoom, setZoom] = useState(1);
  const [imageLoadError, setImageLoadError] = useState(false);
  const canZoomOut = zoom > 0.6;
  const canZoomIn = zoom < 2.2;

  const pageLabel = useMemo(
    () => `Page ${page?.pageNumber ?? 1}`,
    [page?.pageNumber],
  );

  const imageUrl = page?.imageUrl;
  const resolvedSrc = useMemo(() => mediaUrl(imageUrl), [imageUrl]);
  const kind = useMemo(
    () => (imageUrl ? assetKindFromUrl(imageUrl) : "unknown"),
    [imageUrl],
  );

  const showRaster =
    Boolean(imageUrl && resolvedSrc && kind === "raster");
  const showPdf = Boolean(imageUrl && kind === "pdf");

  useEffect(() => {
    setImageLoadError(false);
  }, [resolvedSrc]);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white/60 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[#0B1B2B]">Manuscrit</h2>
          <div className="mt-0.5 text-xs text-zinc-600">{pageLabel}</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))}
            disabled={!canZoomOut || !showRaster}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white/70 text-sm font-semibold text-[#2C1B12] shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Zoom -"
            title="Zoom -"
          >
            −
          </button>
          <div className="min-w-[64px] text-center text-xs text-zinc-700">
            {Math.round(zoom * 100)}%
          </div>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.1).toFixed(2)))}
            disabled={!canZoomIn || !showRaster}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white/70 text-sm font-semibold text-[#2C1B12] shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Zoom +"
            title="Zoom +"
          >
            +
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-[#F3EEE5]">
        {!imageUrl ? (
          <GenericPlaceholder />
        ) : showPdf ? (
          <PdfPlaceholder downloadHref={resolvedSrc} />
        ) : showRaster && resolvedSrc && !imageLoadError ? (
          <div className="max-h-[min(85vh,56rem)] w-full overflow-auto bg-[#EDE8DF] p-2">
            <img
              src={resolvedSrc}
              alt={pageLabel}
              onError={() => setImageLoadError(true)}
              onLoad={() => setImageLoadError(false)}
              style={{ width: `${Math.round(zoom * 100)}%`, height: "auto" }}
              className="block min-w-0 select-none shadow-sm"
              draggable={false}
            />
          </div>
        ) : imageLoadError ? (
          <div className="flex aspect-[3/4] w-full flex-col items-center justify-center p-6 text-center">
            <div className="text-sm font-medium text-[#2C1B12]">Image temporaire indisponible</div>
            <p className="mt-2 max-w-sm text-xs text-zinc-600">
              L’URL signée a expiré ou l’accès au bucket privé est refusé. Rechargez la page
              éditeur pour regénérer une URL temporaire.
            </p>
          </div>
        ) : (
          <div className="flex aspect-[3/4] w-full flex-col items-center justify-center p-6 text-center">
            <div className="text-sm font-medium text-[#2C1B12]">Visuel non reconnu</div>
            <p className="mt-2 max-w-sm text-xs text-zinc-600">
              L’URL de la page ne correspond pas à une image .jpg / .png attendue. Vérifiez
              l’import.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
