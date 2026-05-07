import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { getCurrentUser, signOut } from "../lib/authApi";

export default function AccountPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const current = await getCurrentUser();
        if (!cancelled) setUser(current);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Impossible de charger le compte.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSignOut() {
    setSubmitting(true);
    setError(null);
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Déconnexion impossible.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-zinc-200 bg-white/70 p-6 shadow-sm">
      <h1 className="text-2xl font-semibold tracking-tight text-[#0B1B2B]">Mon compte</h1>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-4 text-sm text-zinc-700">Chargement du compte...</div>
      ) : (
        <div className="mt-4 space-y-2 text-sm text-zinc-700">
          <div>
            <span className="font-medium text-[#2C1B12]">Email :</span> {user?.email ?? "—"}
          </div>
          <div>
            <span className="font-medium text-[#2C1B12]">Nom :</span>{" "}
            {typeof user?.user_metadata?.full_name === "string"
              ? user.user_metadata.full_name
              : "—"}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleSignOut}
        disabled={submitting}
        className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#2C1B12] px-4 py-2 text-sm font-medium text-zinc-50 shadow-sm transition hover:bg-[#2C1B12]/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Déconnexion..." : "Déconnexion"}
      </button>
    </div>
  );
}
