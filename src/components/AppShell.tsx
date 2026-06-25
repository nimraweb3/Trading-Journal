import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

const NAV: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/journal", label: "Journal", icon: BookOpen },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col gap-2 p-5 glass-strong border-r border-glass-border sticky top-0 h-screen">
        <Link to="/dashboard" className="flex items-center gap-2 px-2 py-2 mb-4">
          <div className="size-9 rounded-lg gradient-maroon maroon-glow flex items-center justify-center">
            <span style={{ fontFamily: "var(--font-display)" }} className="text-lg leading-none">I</span>
          </div>
          <div className="flex flex-col">
            <span style={{ fontFamily: "var(--font-display)" }} className="text-xl leading-tight">Ironbook</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Trading Journal</span>
          </div>
        </Link>

        <nav className="flex flex-col gap-1 mt-2">
          {NAV.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                  active
                    ? "glass-maroon text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
                }`}
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-glass-border">
          <div className="px-3 py-2 text-xs text-muted-foreground truncate">{user?.email}</div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 glass-strong border-b border-glass-border">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="size-8 rounded-lg gradient-maroon flex items-center justify-center">
              <span style={{ fontFamily: "var(--font-display)" }} className="leading-none">I</span>
            </div>
            <span style={{ fontFamily: "var(--font-display)" }} className="text-lg">Ironbook</span>
          </Link>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Sign out"
          >
            <LogOut className="size-5" />
          </button>
        </div>
        <nav className="flex items-center justify-around border-t border-glass-border px-2 py-1">
          {NAV.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-[10px] ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <Icon className={`size-4 ${active ? "text-accent" : ""}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <main className="flex-1 min-w-0 pt-28 md:pt-0">
        {children}
      </main>
    </div>
  );
}
