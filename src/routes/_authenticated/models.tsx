import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Target, Pencil } from "lucide-react";
import { modelsQuery, tradesFullQuery, profileQuery } from "@/lib/queries";
import { ModelFormDialog } from "@/components/ModelFormDialog";
import { computeStats } from "@/lib/trade-stats";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/models")({
  head: () => ({ meta: [{ title: "Strategies — Ironbook" }] }),
  component: ModelsPage,
});

function ModelsPage() {
  const { data: models = [] } = useQuery(modelsQuery());
  const { data: trades = [] } = useQuery(tradesFullQuery());
  const { data: profile } = useQuery(profileQuery());
  const currency = profile?.currency ?? "USD";
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const leaderboard = useMemo(() => {
    return models
      .map((m: any) => {
        const ts = trades.filter((t: any) => t.model_id === m.id);
        const s = computeStats(ts as any, 0);
        return { model: m, stats: s, trades: ts.length };
      })
      .sort((a, b) => b.stats.netPnL - a.stats.netPnL);
  }, [models, trades]);

  const best = leaderboard[0];
  const worst = leaderboard[leaderboard.length - 1];

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-7xl mx-auto space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Strategies</p>
          <h1 style={{ fontFamily: "var(--font-display)" }} className="text-4xl md:text-5xl mt-1">Trading Models</h1>
          <p className="text-sm text-muted-foreground mt-1">Document your setups and track each one's edge.</p>
        </div>
        <button onClick={() => { setEditing(null); setOpen(true); }} className="inline-flex items-center gap-2 gradient-maroon maroon-glow rounded-lg px-4 py-2.5 text-sm">
          <Plus className="size-4" /> New strategy
        </button>
      </div>

      {leaderboard.length >= 2 && (
        <div className="grid md:grid-cols-2 gap-4">
          {best && (
            <div className="glass-strong rounded-2xl p-5 border border-win/30">
              <div className="text-[10px] uppercase tracking-[0.18em] text-win">Best performer</div>
              <div style={{ fontFamily: "var(--font-display)" }} className="text-2xl mt-1">{best.model.name}</div>
              <div className="text-sm text-muted-foreground tabular-nums mt-1">
                {formatCurrency(best.stats.netPnL, currency)} · {formatPercent(best.stats.winRate)} WR · {best.trades} trades
              </div>
            </div>
          )}
          {worst && worst !== best && (
            <div className="glass-strong rounded-2xl p-5 border border-loss/30">
              <div className="text-[10px] uppercase tracking-[0.18em] text-loss">Worst performer</div>
              <div style={{ fontFamily: "var(--font-display)" }} className="text-2xl mt-1">{worst.model.name}</div>
              <div className="text-sm text-muted-foreground tabular-nums mt-1">
                {formatCurrency(worst.stats.netPnL, currency)} · {formatPercent(worst.stats.winRate)} WR · {worst.trades} trades
              </div>
            </div>
          )}
        </div>
      )}

      {models.length === 0 ? (
        <div className="glass-strong rounded-2xl py-20 text-center">
          <Target className="size-10 mx-auto text-accent" />
          <p className="mt-4 text-sm text-muted-foreground">No strategies yet. Document your first setup.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {leaderboard.map(({ model: m, stats, trades: tcount }) => (
            <div key={m.id} className="glass-strong rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg truncate">{m.name}</h3>
                    {m.setup_grade && <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded gradient-maroon">{m.setup_grade}</span>}
                    {!m.active && <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-white/10 text-muted-foreground">inactive</span>}
                  </div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground mt-0.5">
                    {m.market ?? "Any market"}{m.timeframes?.length ? ` · ${m.timeframes.join(", ")}` : ""}
                  </p>
                </div>
                <button onClick={() => { setEditing(m); setOpen(true); }} className="text-muted-foreground hover:text-foreground"><Pencil className="size-4" /></button>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2">
                <Stat label="Trades" value={String(tcount)} />
                <Stat label="Win" value={formatPercent(stats.winRate)} />
                <Stat label="Avg RR" value={`${formatNumber(stats.avgRR)}R`} />
                <Stat label="P&L" value={formatCurrency(stats.netPnL, currency)} tone={stats.netPnL >= 0 ? "win" : "loss"} />
              </div>

              {(m.entry_rules || m.invalidation_rules) && (
                <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                  {m.entry_rules && <RuleBlock label="Entry" text={m.entry_rules} />}
                  {m.invalidation_rules && <RuleBlock label="Invalidation" text={m.invalidation_rules} />}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ModelFormDialog open={open} onClose={() => setOpen(false)} model={editing} />
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "win" | "loss" }) {
  return (
    <div className="rounded-lg bg-white/[0.03] border border-white/5 px-2.5 py-2">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-sm tabular-nums ${tone === "win" ? "text-win" : tone === "loss" ? "text-loss" : ""}`}>{value}</div>
    </div>
  );
}

function RuleBlock({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.14em] text-accent">{label}</div>
      <p className="mt-0.5 line-clamp-2">{text}</p>
    </div>
  );
}
