import type { Line } from "./types";
import { supabase } from "./supabaseClient";

type LineRow = {
  id: string;
  page_id: string;
  line_number: number;
  ocr_raw: string;
  ai_suggestion: string;
  human_correction: string | null;
  final_text: string | null;
  confidence_score: number;
  status: "pending" | "corrected" | "validated";
};

type CorrectionRow = {
  id: string;
  line_id: string;
  old_text: string | null;
  new_text: string | null;
  correction_type: string | null;
  created_at: string;
};

export type LineCorrectionEntry = {
  id: string;
  lineId: string;
  oldText: string;
  newText: string;
  correctionType: string;
  createdAt: string;
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

function scoreToLevel(score: number): Line["confidenceLevel"] {
  if (score >= 0.8) return "high";
  if (score >= 0.65) return "medium";
  return "low";
}

function toLine(row: LineRow): Line {
  const humanCorrection = row.human_correction ?? "";
  const aiSuggestion = row.ai_suggestion ?? "";
  return {
    id: row.id,
    pageId: row.page_id,
    lineNumber: row.line_number,
    ocrRaw: row.ocr_raw,
    aiSuggestion,
    humanCorrection,
    finalText: row.final_text ?? (humanCorrection.trim() ? humanCorrection : aiSuggestion),
    confidenceScore: row.confidence_score,
    confidenceLevel: scoreToLevel(row.confidence_score),
    status: row.status,
  };
}

function toCorrection(row: CorrectionRow): LineCorrectionEntry {
  return {
    id: row.id,
    lineId: row.line_id,
    oldText: row.old_text ?? "",
    newText: row.new_text ?? "",
    correctionType: row.correction_type ?? "human",
    createdAt: row.created_at,
  };
}

async function insertCorrection(input: {
  lineId: string;
  oldText: string;
  newText: string;
  correctionType: "human" | "admin_validation";
}): Promise<void> {
  const payload = {
    line_id: input.lineId,
    old_text: input.oldText,
    new_text: input.newText,
    correction_type: input.correctionType,
  };
  const { error } = await supabase.from("corrections").insert(payload);
  if (error) throw normalizeError(error);
}

export async function getLinesByPage(pageId: string): Promise<Line[]> {
  const { data, error } = await supabase
    .from("lines")
    .select(
      "id,page_id,line_number,ocr_raw,ai_suggestion,human_correction,final_text,confidence_score,status",
    )
    .eq("page_id", pageId)
    .order("line_number", { ascending: true });
  if (error) throw normalizeError(error);
  return (data ?? []).map((row) => toLine(row as LineRow));
}

/**
 * Enregistre une correction humaine : met à jour `lines`, puis ajoute une ligne dans `corrections`.
 * Si le texte est identique à `human_correction` déjà en base, aucune écriture (évite le bruit à la sauvegarde groupée).
 */
export async function updateLineCorrection(lineId: string, newText: string): Promise<Line> {
  const humanCorrection = newText.trim();
  const { data: current, error: currentError } = await supabase
    .from("lines")
    .select(
      "id,page_id,line_number,ocr_raw,ai_suggestion,human_correction,final_text,confidence_score,status",
    )
    .eq("id", lineId)
    .single();
  if (currentError) throw normalizeError(currentError);

  const row = current as LineRow;
  const oldHumanCorrection = row.human_correction ?? "";
  if (humanCorrection === oldHumanCorrection.trim()) {
    return toLine(row);
  }

  const aiSuggestion = row.ai_suggestion ?? "";
  const finalText = humanCorrection ? humanCorrection : aiSuggestion;

  const { data, error } = await supabase
    .from("lines")
    .update({
      human_correction: humanCorrection,
      final_text: finalText,
      status: "corrected",
    })
    .eq("id", lineId)
    .select(
      "id,page_id,line_number,ocr_raw,ai_suggestion,human_correction,final_text,confidence_score,status",
    )
    .single();
  if (error) throw normalizeError(error);

  await insertCorrection({
    lineId,
    oldText: oldHumanCorrection,
    newText: humanCorrection,
    correctionType: "human",
  });

  return toLine(data as LineRow);
}

export async function validateLine(lineId: string): Promise<Line> {
  const { data: current, error: currentError } = await supabase
    .from("lines")
    .select(
      "id,page_id,line_number,ocr_raw,ai_suggestion,human_correction,final_text,confidence_score,status",
    )
    .eq("id", lineId)
    .single();
  if (currentError) throw normalizeError(currentError);

  const row = current as LineRow;
  if (row.status === "validated") {
    return toLine(row);
  }

  const human = row.human_correction ?? "";
  const ai = row.ai_suggestion ?? "";
  const ocr = row.ocr_raw ?? "";
  const previousFinal = (row.final_text ?? "").trim();
  const finalText = human.trim() ? human : ai.trim() ? ai : ocr;

  const { data, error } = await supabase
    .from("lines")
    .update({ status: "validated", final_text: finalText })
    .eq("id", lineId)
    .select(
      "id,page_id,line_number,ocr_raw,ai_suggestion,human_correction,final_text,confidence_score,status",
    )
    .single();
  if (error) throw normalizeError(error);

  const correctionType = human.trim() ? "human" : "admin_validation";
  await insertCorrection({
    lineId,
    oldText: previousFinal,
    newText: finalText,
    correctionType,
  });

  return toLine(data as LineRow);
}

export async function getCorrectionsByLine(lineId: string): Promise<LineCorrectionEntry[]> {
  const { data, error } = await supabase
    .from("corrections")
    .select("id,line_id,old_text,new_text,correction_type,created_at")
    .eq("line_id", lineId)
    .order("created_at", { ascending: false });
  if (error) throw normalizeError(error);
  return (data ?? []).map((row) => toCorrection(row as CorrectionRow));
}

export const getPageLines = getLinesByPage;
