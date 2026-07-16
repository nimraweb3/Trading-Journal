import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { profileQuery, tradesQuery } from "@/lib/queries";
import { useAccountContext } from "@/lib/account-context";
import { formatCurrency, formatPercent } from "@/lib/format";

/**
 * Deep risk & edge analytics — R-multiple distribution, expectancy curve,
 * Sharpe / Sortino, profit factor, rolling win rate, streak stats.
 */
export function RiskAnalytics() {
  const { activeAccountId, activeAccount } = useAccountContext();
  const { data: trades = [] } = useQuery(tradesQuery(activeAccountId));
  const { data: profile } = useQuery(profileQuery());
  const currency = activeAccount?.currency ?? profile?.currency ?? "USD";

  const stats = useMemo(() => computeRiskStats(trades), [trades]);

  if (trades.length === 0) return null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Risk & Edge</p>
        <h2 style={{ fontFamily: "var(--font-display)" }} className="text-3xl md:text-4xl mt-1">
          Risk analytics
        </h2>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Kpi label="Expectancy / trade" value={formatCurrency(stats.expectancy, currency)} tone={stats.expectancy >= 0 ? "win" : "loss"} />
        <Kpi label="Avg R multiple" value={`${stats.avgR.toFixed(2)}R`} tone={stats.avgR >= 0 ? "win" : "loss"} />
        <Kpi label="Profit factor" value={Number.isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(2) : "∞"} tone={stats.profitFactor >= 1 ? "win" : "loss"} />
        <Kpi label="Payoff ratio" value={Number.isFinite(stats.payoff) ? stats.payoff.toFixed(2) : "∞"} />
        <Kpi label="Sharpe (per-trade)" value={stats.sharpe.toFixed(2)} tone={stats.sharpe >= 1 ? "win" : undefined} />
        <Kpi label="Sortino (per-trade)" value={Number.isFinite(stats.sortino) ? stats.sortino.toFixed(2) : "∞"} tone={stats.sortino >= 1 ? "win" : undefined} />
        <Kpi label="Best streak" value={`${stats.bestWinStreak}W`} tone="win" />
        <Kpi label="Worst streak" value={`${stats.worstLossStreak}L`} tone="loss" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* R-multiple distribution */}
        <div className="glass-strong rounded-2xl p-5 md:p-6">
          <h3 style={{ fontFamily: "var(--font-display)" }} className="text-2xl mb-1">
            R-multiple distribution
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            How many trades landed in each R bucket. Fat right tail = edge.
          </p>
          <div className="h-[240px]">
            <ResponsiveContainer>
              <BarChart data={stats.rBuckets}>
                <CartesianGrid stroke="oklch(1 0 0 / 6%)" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="oklch(0.66 0.012 50)"
                  tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="oklch(0.66 0.012 50)"
                  tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.18 0.014 25)",
                    border: "1px solid oklch(1 0 0 / 10%)",
                    borderRadius: 8,
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {stats.rBuckets.map((b, i) => (
                    <Cell key={i} fill={b.mid >= 0 ? "oklch(0.72 0.16 155)" : "oklch(0.62 0.21 22)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expectancy curve */}
        <div className="glass-strong rounded-2xl p-5 md:p-6">
          <h3 style={{ fontFamily: "var(--font-display)" }} className="text-2xl mb-1">
            Cumulative R
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Running sum of R multiples across your trade sequence.
          </p>
          <div className="h-[240px]">
            <ResponsiveContainer>
              <LineChart data={stats.cumR}>
                <CartesianGrid stroke="oklch(1 0 0 / 6%)" vertical={false} />
                <XAxis
                  dataKey="i"
                  stroke="oklch(0.66 0.012 50)"
                  tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="oklch(0.66 0.012 50)"
                  tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.18 0.014 25)",
                    border: "1px solid oklch(1 0 0 / 10%)",
                    borderRadius: 8,
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                  }}
                  formatter={(v: number) => `${v.toFixed(2)}R`}
                />
                <Line
                  type="monotone"
                  dataKey="r"
                  stroke="oklch(0.62 0.19 20)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rolling 20-trade win rate */}
        <div className="glass-strong rounded-2xl p-5 md:p-6 lg:col-span-2">
          <h3 style={{ fontFamily: "var(--font-display)" }} className="text-2xl mb-1">
            Rolling 20-trade win rate
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Shows how consistent your edge is. Big swings = variance or regime change.
          </p>
          <div className="h-[220px]">
            <ResponsiveContainer>
              <LineChart data={stats.rollingWR}>
                <CartesianGrid stroke="oklch(1 0 0 / 6%)" vertical={false} />
                <XAxis
                  dataKey="i"
                  stroke="oklch(0.66 0.012 50)"
                  tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="oklch(0.66 0.012 50)"
                  tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.18 0.014 25)",
                    border: "1px solid oklch(1 0 0 / 10%)",
                    borderRadius: 8,
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                  }}
                  formatter={(v: number) => formatPercent(v)}
                />
                <Line
                  type="monotone"
                  dataKey="wr"
                  stroke="oklch(0.72 0.16 155)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "win" | "loss" }) {
  const color = tone === "win" ? "text-win" : tone === "loss" ? "text-loss" : "text-foreground";
  return (
    <div className="glass-strong rounded-xl p-4">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className={`mt-1.5 text-xl md:text-2xl tabular-nums ${color}`} style={{ fontFamily: "var(--font-mono)" }}>
        {value}
      </div>
    </div>
  );
}

function computeRiskStats(trades: any[]) {
  const closed = trades.filter((t) => t.result === "win" || t.result === "loss");
  // Chronological order (oldest first)
  const chrono = [...closed].sort((a, b) => {
    const d = a.trade_date.localeCompare(b.trade_date);
    return d !== 0 ? d : a.created_at.localeCompare(b.created_at);
  });

  const rs: number[] = chrono.map((t) => {
    if (typeof t.rr_achieved === "number") return t.rr_achieved;
    // Fallback: derive from pnl sign
    if (t.result === "win") return 1;
    if (t.result === "loss") return -1;
    return 0;
  });

  const wins = chrono.filter((t) => t.result === "win");
  const losses = chrono.filter((t) => t.result === "loss");
  const grossWin = wins.reduce((s, t) => s + (t.pnl || 0), 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + (t.pnl || 0), 0));
  const avgWin = wins.length ? grossWin / wins.length : 0;
  const avgLoss = losses.length ? grossLoss / losses.length : 0;
  const winRate = chrono.length ? wins.length / chrono.length : 0;
  const expectancy = chrono.length ? winRate * avgWin - (1 - winRate) * avgLoss : 0;
  const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0;
  const payoff = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0;
  const avgR = rs.length ? rs.reduce((s, r) => s + r, 0) / rs.length : 0;

  // Sharpe & Sortino (per-trade, unannualized)
  const mean = avgR;
  const variance = rs.length ? rs.reduce((s, r) => s + (r - mean) ** 2, 0) / rs.length : 0;
  const stddev = Math.sqrt(variance);
  const sharpe = stddev > 0 ? mean / stddev : 0;
  const downside = rs.filter((r) => r < 0);
  const downVar = downside.length ? downside.reduce((s, r) => s + r * r, 0) / downside.length : 0;
  const downStd = Math.sqrt(downVar);
  const sortino = downStd > 0 ? mean / downStd : mean > 0 ? Infinity : 0;

  // R buckets
  const buckets = [
    { label: "≤ -3R", min: -Infinity, max: -3, mid: -3 },
    { label: "-3 to -2R", min: -3, max: -2, mid: -2.5 },
    { label: "-2 to -1R", min: -2, max: -1, mid: -1.5 },
    { label: "-1 to 0R", min: -1, max: 0, mid: -0.5 },
    { label: "0 to 1R", min: 0, max: 1, mid: 0.5 },
    { label: "1 to 2R", min: 1, max: 2, mid: 1.5 },
    { label: "2 to 3R", min: 2, max: 3, mid: 2.5 },
    { label: "≥ 3R", min: 3, max: Infinity, mid: 3 },
  ];
  const rBuckets = buckets.map((b) => ({
    label: b.label,
    mid: b.mid,
    count: rs.filter((r) => r > b.min && r <= b.max).length,
  }));

  // Cumulative R
  let acc = 0;
  const cumR = rs.map((r, i) => {
    acc += r;
    return { i: i + 1, r: Number(acc.toFixed(2)) };
  });

  // Rolling 20-trade win rate
  const W = 20;
  const rollingWR: { i: number; wr: number }[] = [];
  for (let i = 0; i < chrono.length; i++) {
    const from = Math.max(0, i - W + 1);
    const window = chrono.slice(from, i + 1);
    const w = window.filter((t) => t.result === "win").length;
    rollingWR.push({ i: i + 1, wr: Math.round((w / window.length) * 100) });
  }

  // Streaks
  let curW = 0, curL = 0, bestW = 0, worstL = 0;
  for (const t of chrono) {
    if (t.result === "win") { curW++; curL = 0; bestW = Math.max(bestW, curW); }
    else if (t.result === "loss") { curL++; curW = 0; worstL = Math.max(worstL, curL); }
  }

  return {
    expectancy,
    avgR,
    profitFactor,
    payoff,
    sharpe,
    sortino,
    rBuckets,
    cumR,
    rollingWR,
    bestWinStreak: bestW,
    worstLossStreak: worstL,
  };
}
