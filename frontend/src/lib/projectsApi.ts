import type { Project } from "./types";
import { supabase } from "./supabaseClient";

type ProjectRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: "draft" | "active" | "archived";
  created_at: string;
};

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    documents: [],
  };
}

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

export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("id,user_id,title,description,status,created_at")
    .order("created_at", { ascending: false });
  if (error) throw normalizeError(error);
  return (data ?? []).map((row) => toProject(row as ProjectRow));
}

export async function getProject(projectId: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("id,user_id,title,description,status,created_at")
    .eq("id", projectId)
    .maybeSingle();
  if (error) throw normalizeError(error);
  if (!data) return null;
  return toProject(data as ProjectRow);
}

export async function createProject(input: {
  title: string;
  description?: string;
}): Promise<Project> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw normalizeError(userError);
  if (!user) throw new Error("Utilisateur non connecté.");

  const withUser = {
    user_id: user.id,
    title: input.title.trim(),
    description: input.description?.trim() || null,
  };
  const withoutUser = {
    title: input.title.trim(),
    description: input.description?.trim() || null,
  };

  let result = await supabase
    .from("projects")
    .insert(withUser)
    .select("id,user_id,title,description,status,created_at")
    .single();

  if (
    result.error &&
    typeof (result.error as { code?: unknown }).code === "string" &&
    ["42703", "PGRST204"].includes((result.error as { code: string }).code)
  ) {
    result = await supabase
      .from("projects")
      .insert(withoutUser)
      .select("id,user_id,title,description,status,created_at")
      .single();
  }

  const { data, error } = result;
  if (error) throw normalizeError(error);
  return toProject(data as ProjectRow);
}

export async function updateProject(
  projectId: string,
  data: Partial<Pick<Project, "title" | "description" | "status">>,
): Promise<Project> {
  const patch: {
    title?: string;
    description?: string | null;
    status?: "draft" | "active" | "archived";
  } = {};
  if (typeof data.title === "string") patch.title = data.title.trim();
  if (typeof data.description === "string") patch.description = data.description.trim();
  if (data.description === undefined) {
    // no-op
  } else if (data.description === "") {
    patch.description = null;
  }
  if (data.status) patch.status = data.status;

  const { data: updated, error } = await supabase
    .from("projects")
    .update(patch)
    .eq("id", projectId)
    .select("id,user_id,title,description,status,created_at")
    .single();
  if (error) throw normalizeError(error);
  return toProject(updated as ProjectRow);
}

export async function deleteProject(projectId: string): Promise<void> {
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw normalizeError(error);
}
