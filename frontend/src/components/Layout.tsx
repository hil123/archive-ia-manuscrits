import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { getCurrentUser, signOut } from "../lib/authApi";
import { supabase } from "../lib/supabaseClient";

const colors = {
  ivory: "bg-[#F6F1E7]",
  ink: "text-[#0B1B2B]",
  cocoa: "text-[#2C1B12]",
  gold: "text-[#B08D57]"
};

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "rounded-xl px-3 py-2 text-sm font-medium transition",
          isActive
            ? "bg-white/70 text-[#0B1B2B] ring-1 ring-inset ring-zinc-200"
            : "text-zinc-700 hover:bg-white/60 hover:text-[#0B1B2B]"
        ].join(" ")
      }
    >
      {label}
    </NavLink>
  );
}

export default function Layout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const current = await getCurrentUser();
      if (mounted) setUser(current);
    })();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function onSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      navigate("/login", { replace: true });
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className={`min-h-dvh ${colors.ivory} text-zinc-900`}>
      <header className="sticky top-0 z-10 border-b border-zinc-200/80 bg-[#F6F1E7]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link to="/dashboard" className="min-w-0">
            <div className={`truncate text-base font-semibold ${colors.ink}`}>
              Archive-IA <span className={colors.gold}>Manuscrits</span>
            </div>
            <div className="mt-0.5 truncate text-xs text-zinc-600">
              V1 — projets, éditeur, export (mock)
            </div>
          </Link>

          <nav className="hidden items-center gap-2 sm:flex">
            <NavItem to="/dashboard" label="Dashboard" />
            <NavItem to="/projects/new" label="Nouveau projet" />
            {user ? <NavItem to="/account" label="Mon compte" /> : null}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <button
                type="button"
                onClick={() => void onSignOut()}
                disabled={signingOut}
                className="inline-flex items-center justify-center rounded-xl bg-[#2C1B12] px-3 py-2 text-sm font-medium text-zinc-50 shadow-sm transition hover:bg-[#2C1B12]/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {signingOut ? "Déconnexion..." : "Déconnexion"}
              </button>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-white/60 hover:text-[#0B1B2B]"
                >
                  Connexion
                </NavLink>
                <NavLink
                  to="/register"
                  className="rounded-xl bg-[#0B1B2B] px-3 py-2 text-sm font-medium text-zinc-50 shadow-sm transition hover:bg-[#0B1B2B]/90"
                >
                  Inscription
                </NavLink>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-zinc-200/70 py-8">
        <div className="mx-auto max-w-6xl px-6 text-xs text-zinc-600">
          <span className={colors.cocoa}>Archive-IA Manuscrits</span> —{" "}
          <span className={colors.ink}>React</span> /{" "}
          <span className={colors.ink}>Vite</span> /{" "}
          <span className={colors.ink}>Tailwind</span>
        </div>
      </footer>
    </div>
  );
}

