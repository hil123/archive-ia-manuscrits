import { supabase } from "./supabaseClient";

type ProjectRow = {
  id: string;
  title: string;
};

type DocumentRow = {
  id: string;
  project_id: string;
  file_name: string;
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
  if (err && typeof err === "object" && "message" in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return new Error(msg);
  }
  return new Error("Erreur Supabase.");
}

function lineExportText(line: LineRow): string {
  return (
    line.final_text?.trim() ||
    line.human_correction?.trim() ||
    line.ai_suggestion?.trim() ||
    line.ocr_raw?.trim() ||
    ""
  );
}

export async function buildProjectTxt(projectId: string): Promise<{ title: string; text: string }> {
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id,title")
    .eq("id", projectId)
    .maybeSingle();
  if (projectError) throw normalizeError(projectError);
  if (!project) throw new Error("Projet introuvable.");

  const { data: documents, error: documentsError } = await supabase
    .from("documents")
    .select("id,project_id,file_name")
    .eq("project_id", projectId);
  if (documentsError) throw normalizeError(documentsError);
  const docs = (documents ?? []) as DocumentRow[];
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

  const pageById = new Map<string, PageRow>(pages.map((p) => [p.id, p]));
  const docById = new Map<string, DocumentRow>(docs.map((d) => [d.id, d]));

  const orderedLines = lines.slice().sort((a, b) => {
    const pageA = pageById.get(a.page_id);
    const pageB = pageById.get(b.page_id);
    const docA = pageA ? docById.get(pageA.document_id) : undefined;
    const docB = pageB ? docById.get(pageB.document_id) : undefined;
    const docCmp = (docA?.file_name ?? "").localeCompare(docB?.file_name ?? "");
    if (docCmp !== 0) return docCmp;
    const pageCmp = (pageA?.page_number ?? 0) - (pageB?.page_number ?? 0);
    if (pageCmp !== 0) return pageCmp;
    return a.line_number - b.line_number;
  });

  const now = new Date();
  const header = [project.title, "", `Date d'export : ${now.toISOString()}`, "", "---", ""];
  const body = orderedLines.map((line) => lineExportText(line));
  const text = [...header, ...body].join("\n").trimEnd() + "\n";
  return { title: (project as ProjectRow).title, text };
}

export async function registerTxtExport(projectId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let result = await supabase.from("exports").insert({
    project_id: projectId,
    format: "txt",
    user_id: user?.id ?? null,
  });

  if (
    result.error &&
    typeof (result.error as { code?: unknown }).code === "string" &&
    ["42703", "PGRST204"].includes((result.error as { code: string }).code)
  ) {
    result = await supabase.from("exports").insert({
      project_id: projectId,
      format: "txt",
    });
  }
  if (result.error) throw normalizeError(result.error);
}
