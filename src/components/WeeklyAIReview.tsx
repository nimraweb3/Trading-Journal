import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, AlertTriangle, CheckCircle2, TrendingUp, Target, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { generateWeeklyReview } from "@/lib/ai-review.functions";
import { useAccountContext } from "@/lib/account-context";

export function WeeklyAIReview() {
  const { activeAccountId } = useAccountContext();
  const fn = useServerFn(generateWeeklyReview);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(7);
  const [data, setData] = useState<any>(null);

  const run = async () => {
    setLoading(true);
    try {
      const res = await fn({ data: { accountId: activeAccountId, days } });
      setData(res);
      if (!res?.review) toast.info("No trades in this period");
    } catch (e: any) {
      toast.error(e?.message ?? "AI review failed");
    } finally {
      setLoading(false);
    }
  };

  const r = data?.review;

  return (
    <div className="glass-strong rounded-2xl p-5 md:p-6 border border-accent/20">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl gradient-maroon flex items-center justify-center maroon-glow">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h2 style={{ fontFamily: "var(--font-display)" }} className="text-2xl">AI Performance Review</h2>
            <p className="text-xs text-muted-foreground">Honest weekly feedback — what's broken and how to fix it.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}
            className="bg-white/[0.04] border border-white/10 rounded-lg px-2 py-2 text-xs">
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
          <button onClick={run} disabled={loading}
            className="inline-flex items-center gap-2 gradient-maroon maroon-glow rounded-lg px-4 py-2 text-sm disabled:opacity-60">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {loading ? "Analyzing…" : r ? "Re-run review" : "Run review"}
          </button>
        </div>
      </div>

      {!r && !loading && (
        <p className="mt-6 text-sm text-muted-foreground">Click "Run review" and the AI will analyze your recent trades and tell you exactly what to fix.</p>
      )}

      {r && (
        <div className="mt-6 space-y-5">
          {r.headline && (
            <div className="rounded-xl bg-accent/10 border border-accent/30 px-4 py-3 text-sm leading-relaxed">
              {r.headline}
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-4">
            <ListBlock icon={<AlertTriangle className="size-4 text-loss" />} title="What went wrong" items={r.what_went_wrong} tone="loss" />
            <ListBlock icon={<CheckCircle2 className="size-4 text-win" />} title="What went right" items={r.what_went_right} tone="win" />
            <ListBlock icon={<TrendingUp className="size-4 text-accent" />} title="Patterns" items={r.patterns} />
            <ListBlock icon={<Target className="size-4 text-accent" />} title="Improvements" items={r.improvements} />
          </div>
          {r.focus_for_next_week && (
            <div className="rounded-xl gradient-maroon maroon-glow px-4 py-3">
              <div className="text-[10px] uppercase tracking-[0.18em] opacity-80">Focus next week</div>
              <div className="mt-1 text-sm">{r.focus_for_next_week}</div>
            </div>
          )}
          {data?.stats && (
            <div className="text-xs text-muted-foreground tabular-nums pt-2 border-t border-white/5">
              Based on {data.count} trades · {data.stats.wins}W / {data.stats.losses}L · {data.stats.winRate}% WR · ${data.stats.pnl}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ListBlock({ icon, title, items, tone }: { icon: any; title: string; items?: string[]; tone?: "win" | "loss" }) {
  if (!items?.length) return null;
  return (
    <div className={`rounded-xl border px-4 py-3 ${tone === "loss" ? "border-loss/20 bg-loss/5" : tone === "win" ? "border-win/20 bg-win/5" : "border-white/10 bg-white/[0.03]"}`}>
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
        {icon} {title}
      </div>
      <ul className="space-y-1.5 text-sm leading-relaxed">
        {items.map((it, i) => <li key={i} className="flex gap-2"><span className="text-muted-foreground">›</span><span>{it}</span></li>)}
      </ul>
    </div>
  );
}
