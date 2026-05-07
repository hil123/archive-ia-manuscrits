import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signUp } from "../lib/authApi";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const user = await signUp(email.trim(), password, fullName.trim());
      if (user) {
        navigate("/dashboard", { replace: true });
        return;
      }
      setMessage("Inscription créée. Vérifiez votre email pour confirmer le compte.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inscription impossible.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-zinc-200 bg-white/70 p-6 shadow-sm">
      <h1 className="text-2xl font-semibold tracking-tight text-[#0B1B2B]">Créer un compte</h1>
      <p className="mt-1 text-sm text-zinc-700">Inscription Supabase Auth.</p>

      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            {message}
          </div>
        ) : null}
        <div>
          <label className="block text-sm font-medium text-[#2C1B12]">Nom complet</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0B1B2B]/50 focus:ring-2 focus:ring-[#0B1B2B]/15"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#2C1B12]">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0B1B2B]/50 focus:ring-2 focus:ring-[#0B1B2B]/15"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#2C1B12]">Mot de passe</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0B1B2B]/50 focus:ring-2 focus:ring-[#0B1B2B]/15"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center rounded-xl bg-[#0B1B2B] px-4 py-2 text-sm font-medium text-zinc-50 shadow-sm transition hover:bg-[#0B1B2B]/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Inscription..." : "S'inscrire"}
        </button>
      </form>

      <p className="mt-4 text-sm text-zinc-700">
        Déjà un compte ?{" "}
        <Link to="/login" className="font-medium text-[#0B1B2B] underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
