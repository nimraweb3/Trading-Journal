import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { profileQuery, tradesQuery } from "@/lib/queries";
import { groupBy } from "@/lib/trade-stats";
import { formatCurrency, formatPercent } from "@/lib/format";
import { useAccountContext } from "@/lib/account-context";
import { WeeklyAIReview } from "@/components/WeeklyAIReview";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics — TradeBook" }] }),
  component: Analytics,
});

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function Analytics() {
  const { activeAccountId, activeAccount } = useAccountContext();
  const { data: trades = [] } = useQuery(tradesQuery(activeAccountId));
  const { data: profile } = useQuery(profileQuery());
  const currency = activeAccount?.currency ?? profile?.currency ?? "USD";

  const byPair = useMemo(() => bucket(trades, (t) => t.pair), [trades]);
  const bySession = useMemo(() => bucket(trades, (t) => t.session ?? "—"), [trades]);
  const byDay = useMemo(
    () => bucket(trades, (t) => DOW[new Date(t.trade_date).getDay()]),
    [trades]
  );
  const byModel = useMemo(() => bucket(trades, (t) => t.model ?? "—"), [trades]);
  const byGrade = useMemo(() => bucket(trades, (t) => t.grade ?? "—"), [trades]);

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-7xl mx-auto space-y-8">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Analytics</p>
        <h1 style={{ fontFamily: "var(--font-display)" }} className="text-4xl md:text-5xl mt-1">Performance Breakdown</h1>
      </div>
      <WeeklyAIReview />


      {trades.length === 0 ? (
        <div className="glass-strong rounded-2xl p-12 text-center text-muted-foreground">
          Log some trades to see analytics.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section title="By Pair" rows={byPair} currency={currency} />
          <Section title="By Session" rows={bySession} currency={currency} />
          <Section title="By Day of Week" rows={byDay} currency={currency} />
          <Section title="By Model" rows={byModel} currency={currency} />
          <Section title="By Grade" rows={byGrade} currency={currency} className="lg:col-span-2" />
        </div>
      )}
    </div>
  );
}

function bucket(trades: any[], key: (t: any) => string) {
  const groups = groupBy(trades, key);
  return Object.entries(groups)
    .map(([label, ts]) => {
      const closed = ts.filter((t) => t.result);
      const wins = closed.filter((t) => t.result === "win").length;
      const pnl = ts.reduce((s, t) => s + (t.pnl || 0), 0);
      const winRate = closed.length ? (wins / closed.length) * 100 : 0;
      return { label, trades: ts.length, winRate, pnl };
    })
    .sort((a, b) => b.pnl - a.pnl);
}

function Section({
  title, rows, currency, className = "",
}: { title: string; rows: { label: string; trades: number; winRate: number; pnl: number }[]; currency: string; className?: string }) {
  return (
    <div className={`glass-strong rounded-2xl p-5 md:p-6 ${className}`}>
      <h2 style={{ fontFamily: "var(--font-display)" }} className="text-2xl mb-4">{title}</h2>
      <div className="h-[220px] mb-4">
        <ResponsiveContainer>
          <BarChart data={rows}>
            <CartesianGrid stroke="oklch(1 0 0 / 6%)" vertical={false} />
            <XAxis dataKey="label" stroke="oklch(0.66 0.012 50)" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} tickLine={false} axisLine={false} />
            <YAxis stroke="oklch(0.66 0.012 50)" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} tickLine={false} axisLine={false} width={60} tickFormatter={(v) => formatCurrency(v, currency).replace(/\.00$/, "")} />
            <Tooltip
              contentStyle={{ background: "oklch(0.18 0.014 25)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: 8, fontFamily: "var(--font-mono)", fontSize: 12 }}
              formatter={(v: number) => formatCurrency(v, currency)}
            />
            <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
              {rows.map((r, i) => (
                <Cell key={i} fill={r.pnl >= 0 ? "oklch(0.72 0.16 155)" : "oklch(0.62 0.21 22)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-1.5 text-sm">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between border-t border-white/5 py-2">
            <span className="font-medium">{r.label}</span>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-muted-foreground tabular-nums">{r.trades} trades</span>
              <span className="text-muted-foreground tabular-nums">{formatPercent(r.winRate)} WR</span>
              <span className={`tabular-nums w-24 text-right ${r.pnl >= 0 ? "text-win" : "text-loss"}`}>
                {formatCurrency(r.pnl, currency)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Inline Cell import (recharts)
import { Cell } from "recharts";
