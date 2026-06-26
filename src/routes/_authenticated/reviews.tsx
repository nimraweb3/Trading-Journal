import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, ScrollText } from "lucide-react";
import { reviewsQuery, tradesFullQuery, profileQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { computeStats } from "@/lib/trade-stats";
import { formatCurrency, formatPercent } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/reviews")({
  head: () => ({ meta: [{ title: "Reviews — Ironbook" }] }),
  component: ReviewsPage,
});

function ReviewsPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: reviews = [] } = useQuery(reviewsQuery());
  const { data: trades = [] } = useQuery(tradesFullQuery());
  const { data: profile } = useQuery(profileQuery());
  const currency = profile?.currency ?? "USD";
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    review_type: "weekly",
    period_start: isoStartOfWeek(),
    period_end: new Date().toISOString().slice(0, 10),
    title: "",
    what_worked: "",
    what_didnt: "",
    lessons: "",
    next_focus: "",
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("reviews").insert({ ...form, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews"] });
      toast.success("Review saved");
      setCreating(false);
    },
    onError: (e: any) => toast.error(e.message ?? "Save failed"),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews"] }),
  });

  function statsFor(r: any) {
    const filtered = trades.filter((t: any) => t.trade_date >= r.period_start && t.trade_date <= r.period_end);
    return computeStats(filtered as any, 0);
  }

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-5xl mx-auto space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Reviews</p>
          <h1 style={{ fontFamily: "var(--font-display)" }} className="text-4xl md:text-5xl mt-1">Weekly & Monthly Reviews</h1>
        </div>
        <button onClick={() => setCreating((v) => !v)} className="inline-flex items-center gap-2 gradient-maroon maroon-glow rounded-lg px-4 py-2.5 text-sm">
          <Plus className="size-4" /> {creating ? "Cancel" : "New review"}
        </button>
      </div>

      {creating && (
        <div className="glass-strong rounded-2xl p-5 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <F label="Type">
              <select className={inputCls} value={form.review_type} onChange={(e) => setForm({ ...form, review_type: e.target.value })}>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom</option>
              </select>
            </F>
            <F label="Start"><input type="date" className={inputCls} value={form.period_start} onChange={(e) => setForm({ ...form, period_start: e.target.value })} /></F>
            <F label="End"><input type="date" className={inputCls} value={form.period_end} onChange={(e) => setForm({ ...form, period_end: e.target.value })} /></F>
            <F label="Title"><input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Optional" /></F>
          </div>
          <F label="What worked"><textarea className={inputCls + " min-h-20"} value={form.what_worked} onChange={(e) => setForm({ ...form, what_worked: e.target.value })} /></F>
          <F label="What didn't work"><textarea className={inputCls + " min-h-20"} value={form.what_didnt} onChange={(e) => setForm({ ...form, what_didnt: e.target.value })} /></F>
          <F label="Lessons"><textarea className={inputCls + " min-h-16"} value={form.lessons} onChange={(e) => setForm({ ...form, lessons: e.target.value })} /></F>
          <F label="Focus for next period"><textarea className={inputCls + " min-h-16"} value={form.next_focus} onChange={(e) => setForm({ ...form, next_focus: e.target.value })} /></F>
          <div className="flex justify-end">
            <button onClick={() => save.mutate()} disabled={save.isPending} className="rounded-lg px-5 py-2 text-sm gradient-maroon maroon-glow disabled:opacity-60">
              {save.isPending ? "Saving…" : "Save review"}
            </button>
          </div>
        </div>
      )}

      {reviews.length === 0 && !creating ? (
        <div className="glass-strong rounded-2xl py-20 text-center">
          <ScrollText className="size-10 mx-auto text-accent" />
          <p className="mt-4 text-sm text-muted-foreground">Write your first weekly review to compound discipline.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r: any) => {
            const s = statsFor(r);
            return (
              <div key={r.id} className="glass-strong rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wider gradient-maroon px-2 py-0.5 rounded">{r.review_type}</span>
                      <span className="text-xs text-muted-foreground">{r.period_start} → {r.period_end}</span>
                    </div>
                    {r.title && <h3 style={{ fontFamily: "var(--font-display)" }} className="text-2xl mt-1">{r.title}</h3>}
                  </div>
                  <button onClick={() => { if (confirm("Delete this review?")) del.mutate(r.id); }} className="text-muted-foreground hover:text-loss">
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Mini label="Trades" value={String(s.totalTrades)} />
                  <Mini label="Win %" value={formatPercent(s.winRate)} />
                  <Mini label="P&L" value={formatCurrency(s.netPnL, currency)} tone={s.netPnL >= 0 ? "win" : "loss"} />
                  <Mini label="PF" value={s.profitFactor.toFixed(2)} />
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {r.what_worked && <Block title="What worked" text={r.what_worked} tone="win" />}
                  {r.what_didnt && <Block title="What didn't" text={r.what_didnt} tone="loss" />}
                  {r.lessons && <Block title="Lessons" text={r.lessons} />}
                  {r.next_focus && <Block title="Next focus" text={r.next_focus} />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const inputCls = "w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-accent/60";
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-1.5"><span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</span>{children}</label>;
}
function Mini({ label, value, tone }: { label: string; value: string; tone?: "win" | "loss" }) {
  return <div className="rounded-lg bg-white/[0.03] px-3 py-2"><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div><div className={`text-base tabular-nums ${tone === "win" ? "text-win" : tone === "loss" ? "text-loss" : ""}`}>{value}</div></div>;
}
function Block({ title, text, tone }: { title: string; text: string; tone?: "win" | "loss" }) {
  return (
    <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3">
      <div className={`text-[10px] uppercase tracking-[0.14em] ${tone === "win" ? "text-win" : tone === "loss" ? "text-loss" : "text-accent"}`}>{title}</div>
      <p className="mt-1 whitespace-pre-wrap">{text}</p>
    </div>
  );
}
function isoStartOfWeek() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}
