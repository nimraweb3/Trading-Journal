import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { profileQuery, tradesQuery } from "@/lib/queries";
import { buildEquityCurve, computeStats } from "@/lib/trade-stats";
import { StatCard } from "@/components/StatCard";
import { EquityCurve } from "@/components/EquityCurve";
import { GradeBadge } from "@/components/GradeBadge";
import { TradeFormDialog } from "@/components/TradeFormDialog";
import { formatCurrency, formatNumber, formatPercent, shortDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Ironbook" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: trades = [] } = useQuery(tradesQuery());
  const { data: profile } = useQuery(profileQuery());
  const [open, setOpen] = useState(false);

  const startingBalance = Number(profile?.starting_balance ?? 10000);
  const currency = profile?.currency ?? "USD";
  const stats = computeStats(trades, startingBalance);
  const curve = buildEquityCurve(trades, startingBalance);
  const recent = trades.slice(0, 8);

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Dashboard</p>
          <h1 style={{ fontFamily: "var(--font-display)" }} className="text-4xl md:text-5xl mt-1">
            {greeting()}, <span className="italic text-accent">{profile?.display_name?.split(" ")[0] ?? "Trader"}</span>
          </h1>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 gradient-maroon maroon-glow rounded-lg px-4 py-2.5 text-sm text-primary-foreground"
        >
          <Plus className="size-4" /> New trade
        </button>
      </div>

      {/* Headline KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          label="Current Equity"
          value={formatCurrency(stats.currentEquity, currency)}
          hint={`Start ${formatCurrency(startingBalance, currency)}`}
        />
        <StatCard
          label="Net P&L"
          value={formatCurrency(stats.netPnL, currency)}
          tone={stats.netPnL >= 0 ? "win" : "loss"}
          hint={`${stats.totalTrades} trades`}
        />
        <StatCard
          label="Win Rate"
          value={formatPercent(stats.winRate)}
          hint={`${stats.wins}W / ${stats.losses}L`}
        />
        <StatCard
          label="Profit Factor"
          value={formatNumber(stats.profitFactor)}
          hint={`Expectancy ${formatCurrency(stats.expectancy, currency)}`}
        />
      </div>

      {/* Equity curve */}
      <div className="glass-strong rounded-2xl p-5 md:p-7">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 style={{ fontFamily: "var(--font-display)" }} className="text-2xl">Equity Curve</h2>
            <p className="text-xs text-muted-foreground">All-time, every closed trade compounded.</p>
          </div>
          <div className="text-right tabular-nums">
            <div className={`text-xl ${stats.netPnL >= 0 ? "text-win" : "text-loss"}`}>
              {stats.netPnL >= 0 ? "+" : ""}{formatCurrency(stats.netPnL, currency)}
            </div>
          </div>
        </div>
        <EquityCurve data={curve} currency={currency} />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Avg RR" value={`${formatNumber(stats.avgRR)}R`} />
        <StatCard label="Avg Win" value={formatCurrency(stats.avgWin, currency)} tone="win" />
        <StatCard label="Avg Loss" value={formatCurrency(stats.avgLoss, currency)} tone="loss" />
        <StatCard label="Largest Win" value={formatCurrency(stats.largestWin, currency)} tone="win" />
      </div>

      {/* Recent trades */}
      <div className="glass-strong rounded-2xl p-5 md:p-7">
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontFamily: "var(--font-display)" }} className="text-2xl">Recent Trades</h2>
          <Link to="/journal" className="text-xs text-muted-foreground hover:text-foreground">View all →</Link>
        </div>
        {recent.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <p className="text-sm">No trades yet. Log your first setup.</p>
            <button onClick={() => setOpen(true)} className="mt-4 gradient-maroon rounded-lg px-4 py-2 text-sm">
              Add your first trade
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  <th className="text-left px-2 py-2 font-normal">Date</th>
                  <th className="text-left px-2 py-2 font-normal">Pair</th>
                  <th className="text-left px-2 py-2 font-normal">Side</th>
                  <th className="text-left px-2 py-2 font-normal">Session</th>
                  <th className="text-center px-2 py-2 font-normal">Grade</th>
                  <th className="text-right px-2 py-2 font-normal">RR</th>
                  <th className="text-right px-2 py-2 font-normal">P&L</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((t) => (
                  <tr key={t.id} className="border-t border-white/5 hover:bg-white/[0.03]">
                    <td className="px-2 py-3 text-muted-foreground tabular-nums">{shortDate(t.trade_date)}</td>
                    <td className="px-2 py-3 font-medium">{t.pair}</td>
                    <td className="px-2 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs ${t.direction === "buy" ? "text-win" : "text-loss"}`}>
                        {t.direction === "buy" ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                        {t.direction}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-muted-foreground">{t.session ?? "—"}</td>
                    <td className="px-2 py-3 text-center"><GradeBadge grade={t.grade} /></td>
                    <td className="px-2 py-3 text-right tabular-nums">{t.rr_achieved != null ? `${Number(t.rr_achieved).toFixed(2)}R` : "—"}</td>
                    <td className={`px-2 py-3 text-right tabular-nums ${t.pnl > 0 ? "text-win" : t.pnl < 0 ? "text-loss" : ""}`}>
                      {formatCurrency(t.pnl, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TradeFormDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
