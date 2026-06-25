import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Search, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { profileQuery, tradesFullQuery } from "@/lib/queries";
import { GradeBadge } from "@/components/GradeBadge";
import { TradeFormDialog } from "@/components/TradeFormDialog";
import { formatCurrency, shortDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/journal")({
  head: () => ({ meta: [{ title: "Journal — Ironbook" }] }),
  component: Journal,
});

function Journal() {
  const { data: trades = [] } = useQuery(tradesFullQuery());
  const { data: profile } = useQuery(profileQuery());
  const currency = profile?.currency ?? "USD";

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [q, setQ] = useState("");
  const [filterPair, setFilterPair] = useState("");
  const [filterResult, setFilterResult] = useState("");
  const [filterGrade, setFilterGrade] = useState("");

  const pairs = useMemo(() => Array.from(new Set(trades.map((t: any) => t.pair))), [trades]);

  const filtered = useMemo(() => {
    return trades.filter((t: any) => {
      if (filterPair && t.pair !== filterPair) return false;
      if (filterResult && t.result !== filterResult) return false;
      if (filterGrade && t.grade !== filterGrade) return false;
      if (q) {
        const s = q.toLowerCase();
        const blob = `${t.pair} ${t.session ?? ""} ${t.model ?? ""} ${t.notes ?? ""} ${t.killzone ?? ""}`.toLowerCase();
        if (!blob.includes(s)) return false;
      }
      return true;
    });
  }, [trades, q, filterPair, filterResult, filterGrade]);

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-7xl mx-auto space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Journal</p>
          <h1 style={{ fontFamily: "var(--font-display)" }} className="text-4xl md:text-5xl mt-1">All Trades</h1>
        </div>
        <button
          onClick={() => { setEditing(null); setOpen(true); }}
          className="inline-flex items-center gap-2 gradient-maroon maroon-glow rounded-lg px-4 py-2.5 text-sm"
        >
          <Plus className="size-4" /> New trade
        </button>
      </div>

      <div className="glass-strong rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search pair, model, notes…"
            className="w-full bg-white/[0.04] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-accent/60"
          />
        </div>
        <Select value={filterPair} onChange={setFilterPair} options={[["", "All pairs"], ...pairs.map((p) => [p, p] as [string, string])]} />
        <Select value={filterResult} onChange={setFilterResult} options={[["", "All results"], ["win", "Wins"], ["loss", "Losses"], ["breakeven", "Breakeven"]]} />
        <Select value={filterGrade} onChange={setFilterGrade} options={[["", "All grades"], ...["A+","A","B+","B","C","F"].map((g) => [g, g] as [string,string])]} />
      </div>

      <div className="glass-strong rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground text-sm">No trades match these filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground border-b border-white/5">
                  <th className="text-left px-4 py-3 font-normal">Date</th>
                  <th className="text-left px-4 py-3 font-normal">Pair</th>
                  <th className="text-left px-4 py-3 font-normal">Side</th>
                  <th className="text-left px-4 py-3 font-normal">Session</th>
                  <th className="text-left px-4 py-3 font-normal">Model</th>
                  <th className="text-center px-4 py-3 font-normal">Grade</th>
                  <th className="text-right px-4 py-3 font-normal">RR</th>
                  <th className="text-right px-4 py-3 font-normal">P&L</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t: any) => (
                  <tr
                    key={t.id}
                    onClick={() => { setEditing(t); setOpen(true); }}
                    className="border-t border-white/5 hover:bg-white/[0.04] cursor-pointer"
                  >
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">{shortDate(t.trade_date)}</td>
                    <td className="px-4 py-3 font-medium">{t.pair}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs ${t.direction === "buy" ? "text-win" : "text-loss"}`}>
                        {t.direction === "buy" ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                        {t.direction}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{t.session ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.model ?? "—"}</td>
                    <td className="px-4 py-3 text-center"><GradeBadge grade={t.grade} /></td>
                    <td className="px-4 py-3 text-right tabular-nums">{t.rr_achieved != null ? `${Number(t.rr_achieved).toFixed(2)}R` : "—"}</td>
                    <td className={`px-4 py-3 text-right tabular-nums ${t.pnl > 0 ? "text-win" : t.pnl < 0 ? "text-loss" : ""}`}>
                      {formatCurrency(t.pnl, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TradeFormDialog open={open} onClose={() => setOpen(false)} trade={editing} />
    </div>
  );
}

function Select({
  value, onChange, options,
}: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/60"
    >
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}
