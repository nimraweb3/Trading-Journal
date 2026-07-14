import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  Wallet,
  Target,
  AlertTriangle,
  ClipboardCheck,
  ScrollText,
  Calculator,
  ChevronDown,
  Search,
  Sun,
  Moon,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useAccountContext } from "@/lib/account-context";
import { useTheme } from "@/lib/theme-context";
import { CalculatorsDialog } from "@/components/CalculatorsDialog";
import { CommandPalette } from "@/components/CommandPalette";
import { ShortcutsHelp } from "@/components/ShortcutsHelp";
import { TradeFormDialog } from "@/components/TradeFormDialog";

const NAV: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/accounts", label: "Accounts", icon: Wallet },
  { to: "/journal", label: "Journal", icon: BookOpen },
  { to: "/models", label: "Strategies", icon: Target },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/reviews", label: "Reviews", icon: ScrollText },
  { to: "/mistakes", label: "Mistakes", icon: AlertTriangle },
  { to: "/checklists", label: "Checklists", icon: ClipboardCheck },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

async function handleSignOut() {
  await supabase.auth.signOut();
  if (typeof window !== "undefined") window.location.href = "/auth";
}

const GO_MAP: Record<string, string> = {
  d: "/dashboard",
  j: "/journal",
  a: "/analytics",
  c: "/calendar",
  r: "/reviews",
  s: "/settings",
  m: "/models",
};

function isTypingTarget(t: EventTarget | null) {
  if (!(t instanceof HTMLElement)) return false;
  const tag = t.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t.isContentEditable;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const { resolved, toggle } = useTheme();
  const navigate = useNavigate();
  const [calcOpen, setCalcOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [newTradeOpen, setNewTradeOpen] = useState(false);
  const gPrefix = useRef<{ ts: number } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }
      if (isTypingTarget(e.target)) return;
      // Shortcuts help
      if (e.key === "?") { e.preventDefault(); setShortcutsOpen(true); return; }
      // Focus palette also via /
      if (e.key === "/") { e.preventDefault(); setPaletteOpen(true); return; }
      // Toggle theme
      if (e.key.toLowerCase() === "t") { e.preventDefault(); toggle(); return; }
      // New trade
      if (e.key.toLowerCase() === "n") { e.preventDefault(); setNewTradeOpen(true); return; }
      // Calculators
      if (e.key.toLowerCase() === "c" && !gPrefix.current) { e.preventDefault(); setCalcOpen(true); return; }
      // "g x" navigation prefix
      if (e.key.toLowerCase() === "g") {
        gPrefix.current = { ts: Date.now() };
        setTimeout(() => { gPrefix.current = null; }, 900);
        return;
      }
      if (gPrefix.current) {
        const dest = GO_MAP[e.key.toLowerCase()];
        if (dest) {
          e.preventDefault();
          gPrefix.current = null;
          navigate({ to: dest });
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, toggle]);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col gap-2 p-4 glass-strong border-r border-glass-border sticky top-0 h-screen overflow-y-auto">
        <Link to="/dashboard" className="flex items-center gap-2 px-2 py-2 mb-2">
          <div className="size-9 rounded-lg gradient-maroon maroon-glow flex items-center justify-center">
            <span style={{ fontFamily: "var(--font-display)" }} className="text-lg leading-none">T</span>
          </div>
          <div className="flex flex-col">
            <span style={{ fontFamily: "var(--font-display)" }} className="text-xl leading-tight">TradeBook</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Trading Journal</span>
          </div>
        </Link>

        <AccountSwitcher />

        <button
          onClick={() => setPaletteOpen(true)}
          className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition"
        >
          <span className="flex items-center gap-2"><Search className="size-3.5" /> Search…</span>
          <kbd className="rounded border border-white/10 px-1.5 py-0.5 text-[10px]">⌘K</kbd>
        </button>

        <nav className="flex flex-col gap-0.5 mt-3">
          {NAV.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
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

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => setNewTradeOpen(true)}
            className="flex items-center justify-center gap-1.5 rounded-lg gradient-maroon maroon-glow px-2 py-2 text-xs text-primary-foreground"
          >
            <Plus className="size-3.5" /> New
          </button>
          <button
            onClick={() => setCalcOpen(true)}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 px-2 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
          >
            <Calculator className="size-3.5" /> Calc
          </button>
        </div>

        <div className="mt-auto pt-4 border-t border-glass-border">
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="px-2 py-1 text-xs text-muted-foreground truncate flex-1">{user?.email}</div>
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
            >
              {resolved === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          </div>
          <button
            onClick={handleSignOut}
            className="mt-1 w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 glass-strong border-b border-glass-border">
        <div className="flex items-center justify-between px-4 py-3 gap-3">
          <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
            <div className="size-8 rounded-lg gradient-maroon flex items-center justify-center">
              <span style={{ fontFamily: "var(--font-display)" }} className="leading-none">T</span>
            </div>
            <span style={{ fontFamily: "var(--font-display)" }} className="text-lg">TradeBook</span>
          </Link>
          <div className="flex-1 min-w-0"><AccountSwitcher compact /></div>
          <button onClick={() => setPaletteOpen(true)} className="text-muted-foreground hover:text-foreground shrink-0" aria-label="Search">
            <Search className="size-5" />
          </button>
          <button onClick={toggle} className="text-muted-foreground hover:text-foreground shrink-0" aria-label="Toggle theme">
            {resolved === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>
        </div>
        <nav className="flex items-center gap-1 overflow-x-auto px-2 py-1 border-t border-glass-border scrollbar-none">
          {NAV.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`shrink-0 flex flex-col items-center gap-0.5 rounded-md px-2.5 py-1.5 text-[10px] ${
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

      <main className="flex-1 min-w-0 pt-32 md:pt-0">
        {children}
      </main>

      {/* Mobile floating new-trade FAB */}
      <button
        onClick={() => setNewTradeOpen(true)}
        aria-label="New trade"
        className="md:hidden fixed bottom-5 right-5 z-40 size-14 rounded-full gradient-maroon maroon-glow flex items-center justify-center shadow-2xl"
      >
        <Plus className="size-6 text-primary-foreground" />
      </button>

      <CalculatorsDialog open={calcOpen} onClose={() => setCalcOpen(false)} />
      <TradeFormDialog open={newTradeOpen} onClose={() => setNewTradeOpen(false)} trade={null} />
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onOpenCalculators={() => setCalcOpen(true)}
        onNewTrade={() => setNewTradeOpen(true)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />
      <ShortcutsHelp open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  );
}

function AccountSwitcher({ compact = false }: { compact?: boolean }) {
  const { accounts, activeAccountId, setActiveAccountId } = useAccountContext();
  const [open, setOpen] = useState(false);
  const active = accounts.find((a) => a.id === activeAccountId);
  const label = active ? active.name : "All Accounts";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.04] ${compact ? "px-2 py-1.5" : "px-3 py-2"} text-sm hover:bg-white/[0.06]`}
      >
        <span className="flex items-center gap-2 min-w-0">
          <Wallet className="size-3.5 text-accent shrink-0" />
          <span className="truncate">{label}</span>
        </span>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 mt-1 left-0 right-0 glass-strong rounded-lg border border-glass-border overflow-hidden shadow-xl max-h-72 overflow-y-auto">
            <button
              onClick={() => { setActiveAccountId(null); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-white/[0.05] ${!activeAccountId ? "text-accent" : ""}`}
            >
              All Accounts
            </button>
            {accounts.map((a) => (
              <button
                key={a.id}
                onClick={() => { setActiveAccountId(a.id); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-white/[0.05] flex items-center justify-between ${activeAccountId === a.id ? "text-accent" : ""}`}
              >
                <span className="truncate">{a.name}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{a.account_type}</span>
              </button>
            ))}
            <Link
              to="/accounts"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-xs text-muted-foreground hover:text-foreground border-t border-glass-border"
            >
              + Manage accounts
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
