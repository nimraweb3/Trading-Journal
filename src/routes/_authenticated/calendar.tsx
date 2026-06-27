import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { profileQuery, tradesQuery } from "@/lib/queries";
import { formatCurrency } from "@/lib/format";
import { GradeBadge } from "@/components/GradeBadge";
import { useAccountContext } from "@/lib/account-context";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({ meta: [{ title: "Calendar — TradeBook" }] }),
  component: CalendarPage,
});

function CalendarPage() {
  const { activeAccountId, activeAccount } = useAccountContext();
  const { data: trades = [] } = useQuery(tradesQuery(activeAccountId));
  const { data: profile } = useQuery(profileQuery());
  const currency = activeAccount?.currency ?? profile?.currency ?? "USD";

  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const out: Record<string, typeof trades> = {};
    for (const t of trades) {
      (out[t.trade_date] ||= []).push(t);
    }
    return out;
  }, [trades]);

  const monthLabel = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const firstDow = new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay();
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();

  const cells: (string | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    cells.push(`${cursor.getFullYear()}-${m}-${String(d).padStart(2, "0")}`);
  }

  const selectedTrades = selectedDay ? byDay[selectedDay] ?? [] : [];

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-7xl mx-auto space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Calendar</p>
        <h1 style={{ fontFamily: "var(--font-display)" }} className="text-4xl md:text-5xl mt-1">Trading Days</h1>
      </div>

      <div className="glass-strong rounded-2xl p-5 md:p-7">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              className="p-2 rounded-md hover:bg-white/[0.05]"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              className="p-2 rounded-md hover:bg-white/[0.05]"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <h2 style={{ fontFamily: "var(--font-display)" }} className="text-2xl">{monthLabel}</h2>
          <button
            onClick={() => setCursor(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Today
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => <div key={d} className="text-center">{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const dayTrades = byDay[day] ?? [];
            const pnl = dayTrades.reduce((s, t) => s + (t.pnl || 0), 0);
            const tone = pnl > 0 ? "border-win/40 bg-win/10" : pnl < 0 ? "border-loss/40 bg-loss/10" : "border-white/8";
            return (
              <button
                key={day}
                onClick={() => dayTrades.length && setSelectedDay(day)}
                className={`aspect-square md:aspect-[5/4] rounded-lg border ${tone} p-1.5 md:p-2 text-left transition hover:scale-[1.02]`}
              >
                <div className="text-xs tabular-nums text-muted-foreground">{Number(day.split("-")[2])}</div>
                {dayTrades.length > 0 && (
                  <>
                    <div className={`mt-1 text-[11px] md:text-sm tabular-nums font-medium ${pnl >= 0 ? "text-win" : "text-loss"}`}>
                      {pnl >= 0 ? "+" : ""}{formatCurrency(pnl, currency).replace(/\.\d+$/, "")}
                    </div>
                    <div className="text-[9px] md:text-[10px] text-muted-foreground mt-0.5">{dayTrades.length} trade{dayTrades.length>1?"s":""}</div>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedDay(null)}>
          <div className="glass-strong rounded-2xl p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontFamily: "var(--font-display)" }} className="text-2xl mb-4">{selectedDay}</h3>
            <div className="space-y-2">
              {selectedTrades.map((t) => (
                <div key={t.id} className="flex items-center justify-between glass rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <GradeBadge grade={t.grade} />
                    <div>
                      <div className="text-sm font-medium">{t.pair}</div>
                      <div className="text-[11px] text-muted-foreground">{t.session ?? ""} · {t.direction}</div>
                    </div>
                  </div>
                  <div className={`tabular-nums ${t.pnl >= 0 ? "text-win" : "text-loss"}`}>{formatCurrency(t.pnl, currency)}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setSelectedDay(null)} className="mt-4 w-full rounded-lg border border-white/10 py-2 text-sm">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
