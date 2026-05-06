import { Link, NavLink, Outlet } from "react-router-dom";

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
          </nav>
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

