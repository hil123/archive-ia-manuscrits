import { supabase } from "./supabaseClient";

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "pdf", "tiff"]);
const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "tiff"]);
const MOCK_LINE_SEED: Array<{ ocrRaw: string; aiSuggestion: string; confidenceScore: number }> = [
  { ocrRaw: "בראשית ברא [?]", aiSuggestion: "בראשית ברא אלקים", confidenceScore: 0.72 },
  { ocrRaw: "ויאמר יהי אור", aiSuggestion: "ויאמר יהי אור", confidenceScore: 0.88 },
  { ocrRaw: "ויהי אור על פני", aiSuggestion: "ויהי אור על פני הארץ", confidenceScore: 0.67 },
  { ocrRaw: "וירא כי טוב מאד", aiSuggestion: "וירא כי טוב מאוד", confidenceScore: 0.74 },
  { ocrRaw: "ויבדל בין אור לחשך", aiSuggestion: "ויבדל בין אור לחשך", confidenceScore: 0.81 },
];

export type StoredDocument = {
  id: string;
  projectId: string;
  fileName: string;
  fileType: string;
  storagePathOriginal: string;
  status: string;
  pageCount: number;
};

export type StoredPage = {
  id: string;
  documentId: string;
  pageNumber: number;
  imageOriginalPath: string | null;
  status: string;
};

function normalizeError(err: unknown): Error {
  if (err instanceof Error) return err;
  if (err && typeof err === "object") {
    const maybe = err as {
      message?: unknown;
      code?: unknown;
      details?: unknown;
      hint?: unknown;
    };
    const parts: string[] = [];
    if (typeof maybe.message === "string" && maybe.message.trim()) parts.push(maybe.message.trim());
    if (typeof maybe.code === "string" && maybe.code.trim()) parts.push(`code=${maybe.code.trim()}`);
    if (typeof maybe.details === "string" && maybe.details.trim()) parts.push(maybe.details.trim());
    if (typeof maybe.hint === "string" && maybe.hint.trim()) parts.push(maybe.hint.trim());
    if (parts.length > 0) return new Error(parts.join(" · "));
  }
  return new Error("Erreur Supabase.");
}

function withStep(step: string, err: unknown): Error {
  const e = normalizeError(err);
  return new Error(`${step} : ${e.message}`);
}

function getExtension(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  if (idx < 0) return "";
  return fileName.slice(idx + 1).toLowerCase();
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^\w.\-]+/g, "_");
}

export function validateManuscriptFile(file: File): string | null {
  if (file.size > MAX_FILE_BYTES) {
    return "Fichier trop volumineux. Taille maximale : 20 Mo.";
  }
  const ext = getExtension(file.name);
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return "Format non accepté. Utilisez .jpg, .jpeg, .png, .webp, .pdf ou .tiff.";
  }
  return null;
}

function mapDocumentRow(row: {
  id: string;
  project_id: string;
  file_name: string;
  file_type: string;
  storage_path_original: string;
  status: string;
  page_count: number;
}): StoredDocument {
  return {
    id: row.id,
    projectId: row.project_id,
    fileName: row.file_name,
    fileType: row.file_type,
    storagePathOriginal: row.storage_path_original,
    status: row.status,
    pageCount: row.page_count,
  };
}

function mapPageRow(row: {
  id: string;
  document_id: string;
  page_number: number;
  image_original_path: string | null;
  status: string;
}): StoredPage {
  return {
    id: row.id,
    documentId: row.document_id,
    pageNumber: row.page_number,
    imageOriginalPath: row.image_original_path,
    status: row.status,
  };
}

export async function getSignedImageUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from("manuscripts").createSignedUrl(path, 3600);
  if (error) throw withStep("Signed URL manuscripts", error);
  if (!data?.signedUrl) throw new Error("Signed URL manuscrits indisponible.");
  return data.signedUrl;
}

export async function getFirstProjectPage(projectId: string): Promise<StoredPage | null> {
  const { data: docs, error: docsError } = await supabase
    .from("documents")
    .select("id")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true })
    .limit(1);
  if (docsError) throw withStep("Lecture du premier document", docsError);
  const firstDocId = docs?.[0]?.id as string | undefined;
  if (!firstDocId) return null;

  const { data: page, error: pageError } = await supabase
    .from("pages")
    .select("id,document_id,page_number,image_original_path,status")
    .eq("document_id", firstDocId)
    .order("page_number", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (pageError) throw withStep("Lecture de la première page", pageError);
  if (!page) return null;
  return mapPageRow(
    page as {
      id: string;
      document_id: string;
      page_number: number;
      image_original_path: string | null;
      status: string;
    },
  );
}

export async function listProjectDocuments(projectId: string): Promise<StoredDocument[]> {
  const query = supabase
    .from("documents")
    .select("id,project_id,file_name,file_type,storage_path_original,status,page_count")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  let { data, error } = await query;
  if (error && typeof (error as { code?: unknown }).code === "string" && (error as { code: string }).code === "42703") {
    const fallback = await supabase
      .from("documents")
      .select("id,project_id,file_name,file_type,storage_path_original,status,page_count")
      .eq("project_id", projectId);
    data = fallback.data;
    error = fallback.error;
  }
  if (error) throw withStep("Lecture des documents", error);
  return (data ?? []).map((row) =>
    mapDocumentRow(
      row as {
        id: string;
        project_id: string;
        file_name: string;
        file_type: string;
        storage_path_original: string;
        status: string;
        page_count: number;
      },
    ),
  );
}

export async function uploadManuscriptFile(projectId: string, file: File): Promise<StoredDocument> {
  const localError = validateManuscriptFile(file);
  if (localError) throw new Error(localError);
  const ext = getExtension(file.name);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw normalizeError(userError);
  if (!user) throw new Error("Utilisateur non connecté.");

  const safeName = sanitizeFileName(file.name);
  const timestamp = Date.now();
  const storagePathOriginal = `${user.id}/${projectId}/${timestamp}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("manuscripts")
    .upload(storagePathOriginal, file, {
      contentType: file.type || undefined,
      upsert: false,
    });
  if (uploadError) throw withStep("Upload Storage manuscripts", uploadError);

  const baseDocumentInsert = {
    project_id: projectId,
    file_name: file.name,
    file_type: ext,
    storage_path_original: storagePathOriginal,
    status: "uploaded",
    page_count: 1,
  };

  let insertResult = await supabase
    .from("documents")
    .insert({
      ...baseDocumentInsert,
      user_id: user.id,
    })
    .select("id,project_id,file_name,file_type,storage_path_original,status,page_count")
    .single();

  if (
    insertResult.error &&
    typeof (insertResult.error as { code?: unknown }).code === "string" &&
    ["42703", "PGRST204"].includes((insertResult.error as { code: string }).code)
  ) {
    insertResult = await supabase
      .from("documents")
      .insert(baseDocumentInsert)
      .select("id,project_id,file_name,file_type,storage_path_original,status,page_count")
      .single();
  }

  const { data: insertedDoc, error: insertDocError } = insertResult;
  if (insertDocError) throw withStep("Insertion table documents", insertDocError);

  if (IMAGE_EXTENSIONS.has(ext)) {
    const { data: insertedPage, error: pageError } = await supabase
      .from("pages")
      .insert({
        document_id: insertedDoc.id,
        page_number: 1,
        image_original_path: storagePathOriginal,
        status: "pending",
      })
      .select("id")
      .single();
    if (pageError) throw withStep("Insertion table pages", pageError);

    const linesPayload = MOCK_LINE_SEED.map((row, idx) => ({
      page_id: insertedPage.id,
      line_number: idx + 1,
      ocr_raw: row.ocrRaw,
      ai_suggestion: row.aiSuggestion,
      confidence_score: row.confidenceScore,
      status: "pending",
    }));
    const { error: linesError } = await supabase.from("lines").insert(linesPayload);
    if (linesError) throw withStep("Insertion table lines", linesError);
  }

  return mapDocumentRow(
    insertedDoc as {
      id: string;
      project_id: string;
      file_name: string;
      file_type: string;
      storage_path_original: string;
      status: string;
      page_count: number;
    },
  );
}
