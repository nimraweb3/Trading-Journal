import { Command } from "cmdk";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  BarChart3,
  Settings as SettingsIcon,
  Wallet,
  Target,
  AlertTriangle,
  ClipboardCheck,
  ScrollText,
  Calculator,
  Sun,
  Moon,
  Monitor,
  LogOut,
  Search,
  TrendingUp,
  Plus,
  Command as CmdIcon,
} from "lucide-react";
import { tradesQuery, accountsQuery, modelsQuery } from "@/lib/queries";
import { useAccountContext } from "@/lib/account-context";
import { useTheme } from "@/lib/theme-context";
import { supabase } from "@/integrations/supabase/client";
import { shortDate, formatCurrency } from "@/lib/format";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onOpenCalculators: () => void;
  onNewTrade: () => void;
  onOpenShortcuts: () => void;
}

const ROUTES: { to: string; label: string; icon: React.ComponentType<{ className?: string }>; hint?: string }[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, hint: "g d" },
  { to: "/journal", label: "Journal", icon: BookOpen, hint: "g j" },
  { to: "/analytics", label: "Analytics", icon: BarChart3, hint: "g a" },
  { to: "/calendar", label: "Calendar", icon: CalendarDays, hint: "g c" },
  { to: "/accounts", label: "Accounts", icon: Wallet },
  { to: "/models", label: "Strategies", icon: Target },
  { to: "/reviews", label: "Reviews", icon: ScrollText },
  { to: "/mistakes", label: "Mistakes", icon: AlertTriangle },
  { to: "/checklists", label: "Checklists", icon: ClipboardCheck },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export function CommandPalette({ open, onOpenChange, onOpenCalculators, onNewTrade, onOpenShortcuts }: Props) {
  const navigate = useNavigate();
  const { activeAccountId, setActiveAccountId } = useAccountContext();
  const { setTheme } = useTheme();
  const [query, setQuery] = useState("");

  const { data: trades = [] } = useQuery({ ...tradesQuery(activeAccountId), enabled: open });
  const { data: accounts = [] } = useQuery({ ...accountsQuery(), enabled: open });
  const { data: models = [] } = useQuery({ ...modelsQuery(), enabled: open });

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const filteredTrades = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = trades.slice(0, 80);
    if (!q) return list.slice(0, 6);
    return list.filter((t: any) => {
      return (
        t.pair?.toLowerCase().includes(q) ||
        t.model?.toLowerCase().includes(q) ||
        t.session?.toLowerCase().includes(q) ||
        t.grade?.toLowerCase().includes(q)
      );
    }).slice(0, 8);
  }, [trades, query]);

  const run = (fn: () => void) => {
    onOpenChange(false);
    // Defer to let dialog close cleanly
    setTimeout(fn, 30);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <Dialog.Content className="fixed z-[81] left-1/2 top-[12vh] -translate-x-1/2 w-[92vw] max-w-2xl outline-none">
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <Dialog.Description className="sr-only">Search trades, jump to any page, or run a quick action.</Dialog.Description>
          <Command
            label="Command menu"
            className="glass-strong rounded-2xl border border-glass-border shadow-2xl overflow-hidden"
            filter={(value, search) => {
              if (!search) return 1;
              return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
            }}
          >
            <div className="flex items-center gap-3 px-4 border-b border-glass-border">
              <Search className="size-4 text-muted-foreground shrink-0" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Search trades, jump to a page, run an action…"
                className="flex-1 bg-transparent py-4 text-sm outline-none placeholder:text-muted-foreground"
              />
              <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-muted-foreground">ESC</kbd>
            </div>
            <Command.List className="max-h-[60vh] overflow-y-auto p-2">
              <Command.Empty className="py-10 text-center text-sm text-muted-foreground">
                No results for "{query}"
              </Command.Empty>

              <Command.Group heading="Quick actions" className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
                <Item icon={Plus} label="New trade" hint="N" onSelect={() => run(onNewTrade)} />
                <Item icon={Calculator} label="Open calculators" hint="C" onSelect={() => run(onOpenCalculators)} />
                <Item icon={CmdIcon} label="Keyboard shortcuts" hint="?" onSelect={() => run(onOpenShortcuts)} />
                <Item icon={LogOut} label="Sign out" onSelect={() => run(async () => { await supabase.auth.signOut(); window.location.href = "/auth"; })} />
              </Command.Group>

              <Command.Group heading="Theme" className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
                <Item icon={Moon} label="Dark theme" onSelect={() => run(() => setTheme("dark"))} />
                <Item icon={Sun} label="Light theme" onSelect={() => run(() => setTheme("light"))} />
                <Item icon={Monitor} label="System theme" onSelect={() => run(() => setTheme("system"))} />
              </Command.Group>

              <Command.Group heading="Navigate" className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
                {ROUTES.map((r) => (
                  <Item key={r.to} icon={r.icon} label={r.label} hint={r.hint} onSelect={() => run(() => navigate({ to: r.to }))} />
                ))}
              </Command.Group>

              {accounts.length > 0 && (
                <Command.Group heading="Switch account" className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
                  <Item icon={Wallet} label="All accounts" onSelect={() => run(() => setActiveAccountId(null))} />
                  {accounts.map((a: any) => (
                    <Item key={a.id} icon={Wallet} label={a.name} sub={a.account_type} onSelect={() => run(() => setActiveAccountId(a.id))} />
                  ))}
                </Command.Group>
              )}

              {filteredTrades.length > 0 && (
                <Command.Group heading="Trades" className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
                  {filteredTrades.map((t: any) => (
                    <Command.Item
                      key={t.id}
                      value={`trade-${t.id}-${t.pair}-${t.model ?? ""}-${t.session ?? ""}-${t.grade ?? ""}`}
                      onSelect={() => run(() => navigate({ to: "/journal", search: { trade: t.id } as any }))}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm cursor-pointer data-[selected=true]:bg-white/[0.06]"
                    >
                      <TrendingUp className={`size-4 ${t.pnl > 0 ? "text-win" : t.pnl < 0 ? "text-loss" : "text-muted-foreground"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="truncate">
                          {t.pair} <span className="text-muted-foreground text-xs">· {t.direction ?? "—"}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {shortDate(t.trade_date)} · {t.model ?? "—"} · {t.session ?? "—"}
                        </div>
                      </div>
                      <div className={`text-xs tabular-nums shrink-0 ${t.pnl > 0 ? "text-win" : t.pnl < 0 ? "text-loss" : "text-muted-foreground"}`}>
                        {formatCurrency(t.pnl ?? 0)}
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {models.length > 0 && !query && (
                <Command.Group heading="Strategies" className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
                  {models.slice(0, 6).map((m: any) => (
                    <Item key={m.id} icon={Target} label={m.name} sub={m.timeframe ?? ""} onSelect={() => run(() => navigate({ to: "/models" }))} />
                  ))}
                </Command.Group>
              )}
            </Command.List>
            <div className="border-t border-glass-border px-4 py-2 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>↑ ↓ to navigate · ↵ to select</span>
              <span>Press <kbd className="mx-1 rounded border border-white/10 px-1">?</kbd> for shortcuts</span>
            </div>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Item({
  icon: Icon,
  label,
  sub,
  hint,
  onSelect,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sub?: string;
  hint?: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      value={label + (sub ? " " + sub : "")}
      onSelect={onSelect}
      className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm cursor-pointer data-[selected=true]:bg-white/[0.06]"
    >
      <Icon className="size-4 text-muted-foreground" />
      <span className="flex-1 truncate">{label}</span>
      {sub && <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{sub}</span>}
      {hint && <kbd className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-muted-foreground">{hint}</kbd>}
    </Command.Item>
  );
}
