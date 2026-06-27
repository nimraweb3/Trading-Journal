import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, ClipboardCheck } from "lucide-react";
import { checklistsQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/checklists")({
  head: () => ({ meta: [{ title: "Checklists — TradeBook" }] }),
  component: ChecklistsPage,
});

const TYPES = [
  { value: "pretrade", label: "Pre-trade" },
  { value: "daily", label: "Daily" },
  { value: "posttrade", label: "Post-trade" },
  { value: "weekly", label: "Weekly" },
];

function ChecklistsPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: lists = [] } = useQuery(checklistsQuery());
  const [name, setName] = useState("");
  const [type, setType] = useState<"pretrade" | "daily" | "posttrade" | "weekly">("pretrade");

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      if (!name.trim()) throw new Error("Name required");
      const { error } = await supabase.from("checklists").insert({ user_id: user.id, name: name.trim(), checklist_type: type });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["checklists"] }); setName(""); toast.success("Checklist created"); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const delList = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("checklists").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checklists"] }),
  });

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-5xl mx-auto space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Checklists</p>
        <h1 style={{ fontFamily: "var(--font-display)" }} className="text-4xl md:text-5xl mt-1">Trading Checklists</h1>
        <p className="text-sm text-muted-foreground mt-1">Run through them before every trade, every session, every week.</p>
      </div>

      <div className="glass-strong rounded-2xl p-5">
        <div className="flex flex-wrap gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Checklist name"
            className="flex-1 min-w-[200px] rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
          <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm">
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <button onClick={() => create.mutate()} className="gradient-maroon rounded-lg px-4 py-2 text-sm">
            <Plus className="size-4 inline mr-1" /> Create
          </button>
        </div>
      </div>

      {lists.length === 0 ? (
        <div className="glass-strong rounded-2xl py-20 text-center">
          <ClipboardCheck className="size-10 mx-auto text-accent" />
          <p className="mt-4 text-sm text-muted-foreground">No checklists yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {lists.map((l: any) => (
            <ChecklistCard key={l.id} list={l} onDelete={() => delList.mutate(l.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChecklistCard({ list, onDelete }: { list: any; onDelete: () => void }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const addItem = useMutation({
    mutationFn: async () => {
      if (!user || !text.trim()) return;
      const { error } = await supabase.from("checklist_items").insert({
        user_id: user.id, checklist_id: list.id, label: text.trim(), position: list.items?.length ?? 0,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["checklists"] }); setText(""); },
  });

  const delItem = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("checklist_items").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checklists"] }),
  });

  const completed = Object.values(checked).filter(Boolean).length;
  const total = list.items?.length ?? 0;

  return (
    <div className="glass-strong rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider gradient-maroon inline-block px-2 py-0.5 rounded">{list.checklist_type}</div>
          <h3 style={{ fontFamily: "var(--font-display)" }} className="text-2xl mt-1">{list.name}</h3>
          {total > 0 && <p className="text-xs text-muted-foreground tabular-nums">{completed}/{total} done</p>}
        </div>
        <button onClick={() => { if (confirm("Delete this checklist?")) onDelete(); }} className="text-muted-foreground hover:text-loss"><Trash2 className="size-4" /></button>
      </div>

      <ul className="mt-4 space-y-1.5">
        {(list.items ?? []).sort((a: any, b: any) => a.position - b.position).map((it: any) => (
          <li key={it.id} className="group flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!checked[it.id]} onChange={(e) => setChecked((c) => ({ ...c, [it.id]: e.target.checked }))} className="accent-[color:var(--color-accent)]" />
            <span className={checked[it.id] ? "line-through text-muted-foreground" : ""}>{it.label}</span>
            <button onClick={() => delItem.mutate(it.id)} className="ml-auto opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-loss"><Trash2 className="size-3" /></button>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addItem.mutate()}
          placeholder="Add item…" className="flex-1 rounded-lg bg-white/[0.04] border border-white/10 px-3 py-1.5 text-sm" />
        <button onClick={() => addItem.mutate()} className="text-xs px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/[0.04]">Add</button>
      </div>
    </div>
  );
}
