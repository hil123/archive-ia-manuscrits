import { supabase } from "./supabaseClient";

type ProjectRow = {
  id: string;
  title: string;
};

type DocumentRow = {
  id: string;
  project_id: string;
  file_name: string;
  created_at?: string;
};

type PageRow = {
  id: string;
  document_id: string;
  page_number: number;
};

type LineRow = {
  id: string;
  page_id: string;
  line_number: number;
  ocr_raw: string | null;
  ai_suggestion: string | null;
  human_correction: string | null;
  final_text: string | null;
};

function normalizeError(err: unknown): Error {
  if (err instanceof Error) return err;
  if (err && typeof err === "object") {
    const o = err as { message?: unknown; code?: unknown };
    if (typeof o.message === "string" && o.message.trim()) {
      const code = typeof o.code === "string" ? ` · code=${o.code}` : "";
      return new Error(`${o.message.trim()}${code}`);
    }
  }
  return new Error("Erreur Supabase.");
}

/** Texte exporté pour une ligne : final → humain → IA → OCR. */
export function lineExportText(line: LineRow): string {
  const finalT = line.final_text?.trim();
  if (finalT) return finalT;
  const human = line.human_correction?.trim();
  if (human) return human;
  const ai = line.ai_suggestion?.trim();
  if (ai) return ai;
  const ocr = line.ocr_raw?.trim();
  return ocr ?? "";
}

function sortDocuments(a: DocumentRow, b: DocumentRow): number {
  const ta = a.created_at ? Date.parse(a.created_at) : NaN;
  const tb = b.created_at ? Date.parse(b.created_at) : NaN;
  if (!Number.isNaN(ta) && !Number.isNaN(tb) && ta !== tb) return ta - tb;
  return (a.file_name ?? "").localeCompare(b.file_name ?? "", "fr");
}

/**
 * Construit le texte d’export à partir des données Supabase du projet :
 * documents → pages (par page_number) → lignes (par line_number).
 */
export async function buildProjectTxt(projectId: string): Promise<{ title: string; text: string }> {
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id,title")
    .eq("id", projectId)
    .maybeSingle();
  if (projectError) throw normalizeError(projectError);
  if (!project) throw new Error("Projet introuvable.");

  let documents: DocumentRow[] | null = null;
  let documentsError: { message: string; code?: string } | null = null;

  const primaryDocs = await supabase
    .from("documents")
    .select("id,project_id,file_name,created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  documents = (primaryDocs.data ?? []) as DocumentRow[];
  documentsError = primaryDocs.error as { message: string; code?: string } | null;

  if (
    documentsError &&
    typeof documentsError.code === "string" &&
    ["42703", "PGRST204"].includes(documentsError.code)
  ) {
    const fb = await supabase
      .from("documents")
      .select("id,project_id,file_name")
      .eq("project_id", projectId)
      .order("file_name", { ascending: true });
    documents = (fb.data ?? []) as DocumentRow[];
    documentsError = fb.error as { message: string; code?: string } | null;
  }
  if (documentsError) throw normalizeError(documentsError);

  const docs = (documents ?? []).slice().sort(sortDocuments);
  const docIds = docs.map((d) => d.id);

  let pages: PageRow[] = [];
  if (docIds.length > 0) {
    const { data: pagesData, error: pagesError } = await supabase
      .from("pages")
      .select("id,document_id,page_number")
      .in("document_id", docIds);
    if (pagesError) throw normalizeError(pagesError);
    pages = (pagesData ?? []) as PageRow[];
  }

  const pagesByDoc = new Map<string, PageRow[]>();
  for (const p of pages) {
    const list = pagesByDoc.get(p.document_id) ?? [];
    list.push(p);
    pagesByDoc.set(p.document_id, list);
  }
  for (const [, list] of pagesByDoc) {
    list.sort((a, b) => a.page_number - b.page_number);
  }

  const pageIds = pages.map((p) => p.id);

  let lines: LineRow[] = [];
  if (pageIds.length > 0) {
    const { data: linesData, error: linesError } = await supabase
      .from("lines")
      .select("id,page_id,line_number,ocr_raw,ai_suggestion,human_correction,final_text")
      .in("page_id", pageIds);
    if (linesError) throw normalizeError(linesError);
    lines = (linesData ?? []) as LineRow[];
  }

  const linesByPage = new Map<string, LineRow[]>();
  for (const ln of lines) {
    const list = linesByPage.get(ln.page_id) ?? [];
    list.push(ln);
    linesByPage.set(ln.page_id, list);
  }
  for (const [, list] of linesByPage) {
    list.sort((a, b) => a.line_number - b.line_number);
  }

  const body: string[] = [];
  for (const doc of docs) {
    const docPages = pagesByDoc.get(doc.id) ?? [];
    for (const page of docPages) {
      const pageLines = linesByPage.get(page.id) ?? [];
      for (const line of pageLines) {
        body.push(lineExportText(line));
      }
    }
  }

  const now = new Date();
  const header = [
    (project as ProjectRow).title,
    "",
    `Date d'export : ${now.toLocaleString("fr-FR")}`,
    "",
    "---",
    "",
  ];
  const text = [...header, ...body].join("\n").trimEnd() + "\n";
  return { title: (project as ProjectRow).title, text };
}

/**
 * Trace un export TXT côté Supabase (table `exports`, format `txt`).
 * DOCX / PDF : non gérés pour l’instant.
 */
export async function registerTxtExport(projectId: string): Promise<void> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw normalizeError(userError);

  const base = {
    project_id: projectId,
    format: "txt" as const,
  };

  let result = await supabase.from("exports").insert({
    ...base,
    ...(user?.id ? { user_id: user.id } : {}),
  });

  if (
    result.error &&
    typeof (result.error as { code?: unknown }).code === "string" &&
    ["42703", "PGRST204"].includes((result.error as { code: string }).code)
  ) {
    result = await supabase.from("exports").insert(base);
  }
  if (result.error) throw normalizeError(result.error);
}
