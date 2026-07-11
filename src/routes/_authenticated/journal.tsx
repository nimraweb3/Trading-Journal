import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Search, Download, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { profileQuery, tradesFullQuery, modelsQuery, accountsQuery } from "@/lib/queries";
import { GradeBadge } from "@/components/GradeBadge";
import { TradeFormDialog } from "@/components/TradeFormDialog";
import { formatCurrency, shortDate } from "@/lib/format";
import { useAccountContext } from "@/lib/account-context";
import { downloadCsv, toCsv } from "@/lib/csv-export";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/journal")({
  head: () => ({ meta: [{ title: "Journal — TradeBook" }] }),
  component: Journal,
});

function Journal() {
  const { activeAccountId } = useAccountContext();
  const { data: trades = [] } = useQuery(tradesFullQuery(activeAccountId));
  const { data: profile } = useQuery(profileQuery());
  const { data: models = [] } = useQuery(modelsQuery());
  const { data: accounts = [] } = useQuery(accountsQuery());
  const currency = profile?.currency ?? "USD";

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [q, setQ] = useState("");
  const [filterPair, setFilterPair] = useState("");
  const [filterResult, setFilterResult] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterModel, setFilterModel] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const pairs = useMemo(() => Array.from(new Set(trades.map((t: any) => t.pair))), [trades]);

  const filtered = useMemo(() => {
    return trades.filter((t: any) => {
      if (filterPair && t.pair !== filterPair) return false;
      if (filterResult && t.result !== filterResult) return false;
      if (filterGrade && t.grade !== filterGrade) return false;
      if (filterModel && t.model_id !== filterModel) return false;
      if (filterFrom && t.trade_date < filterFrom) return false;
      if (filterTo && t.trade_date > filterTo) return false;
      if (q) {
        const s = q.toLowerCase();
        const blob = `${t.pair} ${t.session ?? ""} ${t.model ?? ""} ${t.notes ?? ""} ${t.killzone ?? ""}`.toLowerCase();
        if (!blob.includes(s)) return false;
      }
      return true;
    });
  }, [trades, q, filterPair, filterResult, filterGrade, filterModel, filterFrom, filterTo]);

  function exportCsv() {
    if (!filtered.length) { toast.error("No trades to export"); return; }
    const accountMap = Object.fromEntries(accounts.map((a: any) => [a.id, a.name]));
    const modelMap = Object.fromEntries(models.map((m: any) => [m.id, m.name]));
    const rows = filtered.map((t: any) => ({
      date: t.trade_date, account: accountMap[t.account_id] ?? "", pair: t.pair, direction: t.direction,
      session: t.session ?? "", killzone: t.killzone ?? "", model: modelMap[t.model_id] ?? t.model ?? "",
      entry: t.entry_price, stop_loss: t.stop_loss, take_profit: t.take_profit,
      lot_size: t.lot_size, risk_pct: t.risk_percent, rr_planned: t.rr_planned, rr_achieved: t.rr_achieved,
      result: t.result ?? "", pnl: t.pnl, grade: t.grade ?? "",
      notes: t.notes ?? "", mistakes: t.mistakes ?? "", lessons: t.lessons ?? "",
    }));
    downloadCsv(`tradebook-trades-${new Date().toISOString().slice(0,10)}.csv`, toCsv(rows));
    toast.success(`Exported ${rows.length} trades`);
  }

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-7xl mx-auto space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Journal</p>
          <h1 style={{ fontFamily: "var(--font-display)" }} className="text-4xl md:text-5xl mt-1">All Trades</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2.5 text-sm hover:bg-white/[0.04]">
            <Download className="size-4" /> CSV
          </button>
          <button onClick={() => { setEditing(null); setOpen(true); }} className="inline-flex items-center gap-2 gradient-maroon maroon-glow rounded-lg px-4 py-2.5 text-sm">
            <Plus className="size-4" /> New trade
          </button>
        </div>
      </div>

      <div className="glass-strong rounded-2xl p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        <div className="relative col-span-2 md:col-span-2 lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…"
            className="w-full bg-white/[0.04] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
        </div>
        <Select value={filterPair} onChange={setFilterPair} options={[["", "All pairs"], ...pairs.map((p) => [p, p] as [string, string])]} />
        <Select value={filterModel} onChange={setFilterModel} options={[["", "All strategies"], ...models.map((m: any) => [m.id, m.name] as [string, string])]} />
        <Select value={filterResult} onChange={setFilterResult} options={[["", "All results"], ["win", "Wins"], ["loss", "Losses"], ["breakeven", "Breakeven"]]} />
        <Select value={filterGrade} onChange={setFilterGrade} options={[["", "All grades"], ...["A+","A","B+","B","C","F"].map((g) => [g, g] as [string,string])]} />
        <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="bg-white/[0.04] border border-white/10 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-accent/60" />
        <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="bg-white/[0.04] border border-white/10 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-accent/60" />
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
                  <th className="text-left px-4 py-3 font-normal">Strategy</th>
                  <th className="text-center px-4 py-3 font-normal">Grade</th>
                  <th className="text-right px-4 py-3 font-normal">RR</th>
                  <th className="text-right px-4 py-3 font-normal">P&L</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t: any) => (
                  <tr key={t.id} onClick={() => { setEditing(t); setOpen(true); }} className="border-t border-white/5 hover:bg-white/[0.05] cursor-pointer transition">
                    <td className="px-4 py-4 text-muted-foreground tabular-nums">{shortDate(t.trade_date)}</td>
                    <td className="px-4 py-4 font-medium">{t.pair}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 text-xs ${t.direction === "buy" ? "text-win" : "text-loss"}`}>
                        {t.direction === "buy" ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                        {t.direction}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{t.session ?? "—"}</td>
                    <td className="px-4 py-4 text-muted-foreground">{models.find((m: any) => m.id === t.model_id)?.name ?? t.model ?? "—"}</td>
                    <td className="px-4 py-4 text-center"><GradeBadge grade={t.grade} /></td>
                    <td className="px-4 py-4 text-right tabular-nums">{t.rr_achieved != null ? `${Number(t.rr_achieved).toFixed(2)}R` : "—"}</td>
                    <td className={`px-4 py-4 text-right tabular-nums ${t.pnl > 0 ? "text-win" : t.pnl < 0 ? "text-loss" : ""}`}>
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

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="bg-white/[0.04] border border-white/10 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-accent/60">
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}
