import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Wallet, Pencil } from "lucide-react";
import { accountsQuery, tradesFullQuery, profileQuery } from "@/lib/queries";
import { AccountFormDialog } from "@/components/AccountFormDialog";
import { computeStats } from "@/lib/trade-stats";
import { formatCurrency, formatPercent } from "@/lib/format";
import { useAccountContext } from "@/lib/account-context";

export const Route = createFileRoute("/_authenticated/accounts")({
  head: () => ({ meta: [{ title: "Accounts — TradeBook" }] }),
  component: AccountsPage,
});

function AccountsPage() {
  const { data: accounts = [] } = useQuery(accountsQuery());
  const { data: trades = [] } = useQuery(tradesFullQuery());
  const { data: profile } = useQuery(profileQuery());
  const currency = profile?.currency ?? "USD";
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const { setActiveAccountId, activeAccountId } = useAccountContext();

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-7xl mx-auto space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Accounts</p>
          <h1 style={{ fontFamily: "var(--font-display)" }} className="text-4xl md:text-5xl mt-1">Trading Accounts</h1>
          <p className="text-sm text-muted-foreground mt-1">Track personal, prop firm, demo, funded and challenge accounts side by side.</p>
        </div>
        <button onClick={() => { setEditing(null); setOpen(true); }} className="inline-flex items-center gap-2 gradient-maroon maroon-glow rounded-lg px-4 py-2.5 text-sm">
          <Plus className="size-4" /> New account
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="glass-strong rounded-2xl py-20 text-center">
          <Wallet className="size-10 mx-auto text-accent" />
          <p className="mt-4 text-sm text-muted-foreground">Create your first account to start journaling.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((a) => {
            const accountTrades = trades.filter((t: any) => t.account_id === a.id);
            const stats = computeStats(accountTrades as any, Number(a.starting_balance));
            const ddDollars = Math.min(0, stats.netPnL);
            const ddPct = Number(a.max_dd_limit)
              ? Math.abs(ddDollars) / Number(a.max_dd_limit) * 100
              : 0;
            const targetPct = Number(a.profit_target) ? (stats.netPnL / Number(a.profit_target)) * 100 : 0;
            const isActive = activeAccountId === a.id;
            return (
              <div key={a.id} className={`glass-strong rounded-2xl p-5 border transition ${isActive ? "border-accent/50 maroon-glow" : "border-glass-border"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg truncate">{a.name}</h3>
                      <StatusPill status={a.status} />
                    </div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground mt-0.5">
                      {a.account_type}{a.broker ? ` · ${a.broker}` : ""}{a.prop_firm ? ` · ${a.prop_firm}` : ""}
                    </p>
                  </div>
                  <button onClick={() => { setEditing(a); setOpen(true); }} className="text-muted-foreground hover:text-foreground">
                    <Pencil className="size-4" />
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <KV label="Equity" value={formatCurrency(stats.currentEquity, a.currency)} />
                  <KV label="P&L" value={formatCurrency(stats.netPnL, a.currency)} tone={stats.netPnL >= 0 ? "win" : "loss"} />
                  <KV label="Win rate" value={formatPercent(stats.winRate)} />
                  <KV label="Trades" value={String(stats.totalTrades)} />
                </div>

                {Number(a.profit_target) > 0 && (
                  <Progress label="Profit target" pct={targetPct} value={`${formatCurrency(stats.netPnL, a.currency)} / ${formatCurrency(a.profit_target, a.currency)}`} tone="win" />
                )}
                {Number(a.max_dd_limit) > 0 && (
                  <Progress label="Drawdown used" pct={ddPct} value={`${formatCurrency(Math.abs(ddDollars), a.currency)} / ${formatCurrency(a.max_dd_limit, a.currency)}`} tone="loss" />
                )}

                <div className="mt-4 flex gap-2">
                  <button onClick={() => setActiveAccountId(a.id)} className={`flex-1 rounded-lg px-3 py-2 text-xs border ${isActive ? "border-accent/40 text-accent" : "border-white/10 text-muted-foreground hover:text-foreground"}`}>
                    {isActive ? "Active" : "Set active"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AccountFormDialog open={open} onClose={() => setOpen(false)} account={editing} />
    </div>
  );
}

function KV({ label, value, tone }: { label: string; value: string; tone?: "win" | "loss" }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className={`text-base tabular-nums ${tone === "win" ? "text-win" : tone === "loss" ? "text-loss" : ""}`}>{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-win/15 text-win border-win/30",
    passed: "bg-win/15 text-win border-win/30",
    funded: "bg-accent/15 text-accent border-accent/30",
    failed: "bg-loss/15 text-loss border-loss/30",
    breached: "bg-loss/15 text-loss border-loss/30",
    archived: "bg-white/5 text-muted-foreground border-white/10",
  };
  return <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${map[status] ?? "bg-white/5 border-white/10"}`}>{status}</span>;
}

function Progress({ label, pct, value, tone }: { label: string; pct: number; value: string; tone: "win" | "loss" }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="mt-3">
      <div className="flex justify-between text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums">{value}</span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
        <div className={`h-full ${tone === "win" ? "bg-win" : "bg-loss"}`} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
