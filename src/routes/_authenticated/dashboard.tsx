import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, ArrowUpRight, ArrowDownRight, Flame, TrendingUp, TrendingDown } from "lucide-react";
import { profileQuery, tradesQuery } from "@/lib/queries";
import { buildEquityCurve, computeStats } from "@/lib/trade-stats";
import { StatCard } from "@/components/StatCard";
import { EquityCurve } from "@/components/EquityCurve";
import { GradeBadge } from "@/components/GradeBadge";
import { TradeFormDialog } from "@/components/TradeFormDialog";
import { formatCurrency, formatNumber, formatPercent, shortDate } from "@/lib/format";
import { useAccountContext } from "@/lib/account-context";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — TradeBook" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { activeAccountId, activeAccount } = useAccountContext();
  const { data: trades = [] } = useQuery(tradesQuery(activeAccountId));
  const { data: profile } = useQuery(profileQuery());
  const [open, setOpen] = useState(false);

  const startingBalance = activeAccount
    ? Number(activeAccount.starting_balance)
    : Number(profile?.starting_balance ?? 10000);
  const currency = activeAccount?.currency ?? profile?.currency ?? "USD";

  const stats = computeStats(trades, startingBalance);
  const curve = buildEquityCurve(trades, startingBalance);
  const recent = trades.slice(0, 8);

  // streaks
  const streaks = useMemo(() => computeStreaks(trades as any), [trades]);
  // monthly returns
  const monthly = useMemo(() => monthlyReturns(trades as any), [trades]);
  // calendar heatmap (last 90 days)
  const heatmap = useMemo(() => dailyHeatmap(trades as any, 84), [trades]);
  // drawdown curve
  const ddCurve = useMemo(() => curve.map((p) => ({ date: p.date, dd: p.drawdown })), [curve]);

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Dashboard {activeAccount ? `· ${activeAccount.name}` : "· All accounts"}
          </p>
          <h1 style={{ fontFamily: "var(--font-display)" }} className="text-4xl md:text-5xl mt-1">
            {greeting()}, <span className="italic text-accent">{profile?.display_name?.split(" ")[0] ?? "Trader"}</span>
          </h1>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 gradient-maroon maroon-glow rounded-lg px-4 py-2.5 text-sm text-primary-foreground">
          <Plus className="size-4" /> New trade
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Current Equity" value={formatCurrency(stats.currentEquity, currency)} hint={`Start ${formatCurrency(startingBalance, currency)}`} />
        <StatCard label="Net P&L" value={formatCurrency(stats.netPnL, currency)} tone={stats.netPnL >= 0 ? "win" : "loss"} hint={`${stats.totalTrades} trades`} />
        <StatCard label="Win Rate" value={formatPercent(stats.winRate)} hint={`${stats.wins}W / ${stats.losses}L`} />
        <StatCard label="Profit Factor" value={formatNumber(stats.profitFactor)} hint={`Expectancy ${formatCurrency(stats.expectancy, currency)}`} />
      </div>

      {/* Equity + Drawdown */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-strong rounded-2xl p-5 md:p-7">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 style={{ fontFamily: "var(--font-display)" }} className="text-2xl">Equity Curve</h2>
              <p className="text-xs text-muted-foreground">Every closed trade compounded.</p>
            </div>
            <div className={`text-xl tabular-nums ${stats.netPnL >= 0 ? "text-win" : "text-loss"}`}>
              {stats.netPnL >= 0 ? "+" : ""}{formatCurrency(stats.netPnL, currency)}
            </div>
          </div>
          <EquityCurve data={curve} currency={currency} />
        </div>
        <div className="glass-strong rounded-2xl p-5 md:p-7">
          <h2 style={{ fontFamily: "var(--font-display)" }} className="text-2xl mb-2">Drawdown</h2>
          <p className="text-xs text-muted-foreground mb-3">Distance from equity peak.</p>
          <div className="h-48">
            <ResponsiveContainer>
              <AreaChart data={ddCurve} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="ddFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--loss))" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(var(--loss))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Tooltip contentStyle={{ background: "rgba(20,10,12,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="dd" stroke="hsl(var(--loss))" fill="url(#ddFill)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Streaks + monthly returns + heatmap */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="glass-strong rounded-2xl p-5 md:p-7">
          <h2 style={{ fontFamily: "var(--font-display)" }} className="text-2xl mb-4">Streaks</h2>
          <div className="grid grid-cols-2 gap-3">
            <StreakTile icon={<Flame className="size-4 text-accent" />} label="Current" value={streaks.current} tone={streaks.current >= 0 ? "win" : "loss"} />
            <StreakTile icon={<TrendingUp className="size-4 text-win" />} label="Best Win" value={streaks.bestWin} tone="win" />
            <StreakTile icon={<TrendingDown className="size-4 text-loss" />} label="Worst Loss" value={-streaks.worstLoss} tone="loss" />
            <StreakTile icon={<Flame className="size-4 text-muted-foreground" />} label="Consistency" value={Math.round(streaks.consistency)} suffix="%" />
          </div>
        </div>
        <div className="lg:col-span-2 glass-strong rounded-2xl p-5 md:p-7">
          <h2 style={{ fontFamily: "var(--font-display)" }} className="text-2xl mb-4">Monthly Returns</h2>
          {monthly.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer>
                <BarChart data={monthly}>
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                  <Tooltip contentStyle={{ background: "rgba(20,10,12,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {monthly.map((m, i) => (
                      <rect key={i} fill={m.pnl >= 0 ? "hsl(var(--win))" : "hsl(var(--loss))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Heatmap */}
      <div className="glass-strong rounded-2xl p-5 md:p-7">
        <h2 style={{ fontFamily: "var(--font-display)" }} className="text-2xl mb-4">Activity Heatmap</h2>
        <Heatmap days={heatmap} currency={currency} />
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
            <button onClick={() => setOpen(true)} className="mt-4 gradient-maroon rounded-lg px-4 py-2 text-sm">Add your first trade</button>
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

function StreakTile({ icon, label, value, tone, suffix }: { icon: React.ReactNode; label: string; value: number; tone?: "win" | "loss"; suffix?: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">{icon}{label}</div>
      <div className={`text-2xl mt-1 tabular-nums ${tone === "win" ? "text-win" : tone === "loss" ? "text-loss" : ""}`}>
        {Math.abs(value)}{suffix ?? ""}
      </div>
    </div>
  );
}

function Heatmap({ days, currency }: { days: { date: string; pnl: number; count: number }[]; currency: string }) {
  const max = Math.max(1, ...days.map((d) => Math.abs(d.pnl)));
  // 12 columns x 7 rows
  return (
    <div className="grid grid-flow-col grid-rows-7 gap-1.5 overflow-x-auto">
      {days.map((d) => {
        const intensity = Math.min(1, Math.abs(d.pnl) / max);
        const bg = d.count === 0
          ? "bg-white/[0.03]"
          : d.pnl >= 0
            ? "bg-win"
            : "bg-loss";
        return (
          <div key={d.date} title={`${d.date} · ${formatCurrency(d.pnl, currency)}`}
            className={`size-4 md:size-5 rounded ${bg}`}
            style={{ opacity: d.count === 0 ? 1 : 0.25 + intensity * 0.75 }} />
        );
      })}
    </div>
  );
}

function computeStreaks(trades: any[]) {
  const closed = [...trades].filter((t) => t.result).reverse(); // oldest first
  let current = 0, bestWin = 0, worstLoss = 0, winDays = 0;
  const byDay: Record<string, number> = {};
  for (const t of closed) {
    byDay[t.trade_date] = (byDay[t.trade_date] ?? 0) + (t.pnl || 0);
  }
  // streak by trade
  for (let i = closed.length - 1; i >= 0; i--) {
    const r = closed[i].result;
    if (i === closed.length - 1) {
      current = r === "win" ? 1 : r === "loss" ? -1 : 0;
    } else if ((current > 0 && r === "win") || (current < 0 && r === "loss")) {
      current += current > 0 ? 1 : -1;
    } else break;
  }
  let runW = 0, runL = 0;
  for (const t of closed) {
    if (t.result === "win") { runW++; runL = 0; bestWin = Math.max(bestWin, runW); }
    else if (t.result === "loss") { runL++; runW = 0; worstLoss = Math.max(worstLoss, runL); }
  }
  const dayVals = Object.values(byDay);
  if (dayVals.length) winDays = dayVals.filter((v) => v > 0).length;
  const consistency = dayVals.length ? (winDays / dayVals.length) * 100 : 0;
  return { current, bestWin, worstLoss, consistency };
}

function monthlyReturns(trades: any[]) {
  const map: Record<string, number> = {};
  for (const t of trades) {
    const m = t.trade_date?.slice(0, 7);
    if (!m) continue;
    map[m] = (map[m] ?? 0) + (t.pnl || 0);
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, pnl]) => ({ month: month.slice(5), pnl: Number(pnl.toFixed(2)) }));
}

function dailyHeatmap(trades: any[], days: number) {
  const map: Record<string, { pnl: number; count: number }> = {};
  for (const t of trades) {
    if (!t.trade_date) continue;
    map[t.trade_date] = map[t.trade_date] ?? { pnl: 0, count: 0 };
    map[t.trade_date].pnl += t.pnl || 0;
    map[t.trade_date].count += 1;
  }
  const out: { date: string; pnl: number; count: number }[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    out.push({ date: iso, pnl: map[iso]?.pnl ?? 0, count: map[iso]?.count ?? 0 });
  }
  return out;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
