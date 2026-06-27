import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { mistakesQuery, tradesFullQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/mistakes")({
  head: () => ({ meta: [{ title: "Mistakes — TradeBook" }] }),
  component: MistakesPage,
});

function MistakesPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: mistakes = [] } = useQuery(mistakesQuery());
  const { data: trades = [] } = useQuery(tradesFullQuery());
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("");

  // Aggregate keywords from trade.mistakes free-text field
  const patterns = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of trades as any[]) {
      if (!t.mistakes) continue;
      t.mistakes.split(/[,;\n]/).map((s: string) => s.trim().toLowerCase()).filter(Boolean).forEach((m: string) => {
        counts[m] = (counts[m] ?? 0) + 1;
      });
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 20);
  }, [trades]);

  const emotions = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of trades as any[]) {
      [t.emotions_before, t.emotions_after].forEach((e) => {
        if (!e) return;
        e.split(/[,;\n]/).map((s: string) => s.trim().toLowerCase()).filter(Boolean).forEach((tag: string) => {
          counts[tag] = (counts[tag] ?? 0) + 1;
        });
      });
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 15);
  }, [trades]);

  const add = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      if (!label.trim()) throw new Error("Label required");
      const { error } = await supabase.from("mistakes").insert({
        user_id: user.id, label: label.trim(), category: category.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mistakes"] }); setLabel(""); setCategory(""); toast.success("Mistake catalogued"); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("mistakes").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mistakes"] }),
  });

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-5xl mx-auto space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Mistakes</p>
        <h1 style={{ fontFamily: "var(--font-display)" }} className="text-4xl md:text-5xl mt-1">Mistake Database</h1>
        <p className="text-sm text-muted-foreground mt-1">Track repeated errors, rule violations and emotional patterns.</p>
      </div>

      <div className="glass-strong rounded-2xl p-5">
        <h2 className="text-lg mb-3">Catalogue a mistake</h2>
        <div className="flex flex-wrap gap-2">
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Entered without confirmation"
            className="flex-1 min-w-[200px] rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category (optional)"
            className="w-40 rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
          <button onClick={() => add.mutate()} className="gradient-maroon rounded-lg px-4 py-2 text-sm">
            <Plus className="size-4 inline mr-1" /> Add
          </button>
        </div>
        {mistakes.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {mistakes.map((m: any) => (
              <div key={m.id} className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs">
                <span>{m.label}</span>
                {m.category && <span className="text-[10px] text-accent">· {m.category}</span>}
                <button onClick={() => del.mutate(m.id)} className="text-muted-foreground hover:text-loss"><Trash2 className="size-3" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass-strong rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3"><AlertTriangle className="size-4 text-loss" /><h2 className="text-lg">Repeated patterns in your journal</h2></div>
          {patterns.length === 0 ? (
            <p className="text-sm text-muted-foreground">Patterns appear automatically when you fill the "Mistakes" field on trades.</p>
          ) : (
            <ul className="space-y-1.5">
              {patterns.map(([k, n]) => (
                <li key={k} className="flex items-center justify-between text-sm">
                  <span className="capitalize truncate">{k}</span>
                  <span className="tabular-nums text-loss">×{n}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="glass-strong rounded-2xl p-5">
          <h2 className="text-lg mb-3">Emotional patterns</h2>
          {emotions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Log emotions before & after trades to surface patterns.</p>
          ) : (
            <ul className="space-y-1.5">
              {emotions.map(([k, n]) => (
                <li key={k} className="flex items-center justify-between text-sm">
                  <span className="capitalize truncate">{k}</span>
                  <span className="tabular-nums text-accent">×{n}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
