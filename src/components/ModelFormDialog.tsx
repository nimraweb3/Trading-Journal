import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

const GRADES = ["A+", "A", "B+", "B", "C"];
const MARKETS = ["Forex", "Indices", "Crypto", "Commodities", "Stocks", "Futures"];

export function ModelFormDialog({ open, onClose, model }: { open: boolean; onClose: () => void; model?: any | null }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const isEdit = !!model;
  const [form, setForm] = useState<any>(emptyForm());

  useEffect(() => {
    if (model) {
      setForm({
        ...model,
        timeframes: (model.timeframes ?? []).join(", "),
        checklist: Array.isArray(model.checklist) ? model.checklist : [],
      });
    } else setForm(emptyForm());
  }, [model, open]);


  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      if (!form.name.trim()) throw new Error("Name required");
      const payload = {
        user_id: user.id,
        name: form.name.trim(),
        setup_grade: form.setup_grade || null,
        market: form.market || null,
        timeframes: (form.timeframes || "").split(",").map((s: string) => s.trim()).filter(Boolean),
        entry_rules: form.entry_rules || null,
        confirmation_rules: form.confirmation_rules || null,
        invalidation_rules: form.invalidation_rules || null,
        risk_rules: form.risk_rules || null,
        management_rules: form.management_rules || null,
        notes: form.notes || null,
        checklist: (form.checklist ?? []).filter((s: string) => s && s.trim()),
        active: !!form.active,
      };

      if (isEdit) {
        const { error } = await supabase.from("trading_models").update(payload).eq("id", model.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("trading_models").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["models"] });
      toast.success(isEdit ? "Strategy updated" : "Strategy created");
      onClose();
    },
    onError: (e: any) => toast.error(e.message ?? "Save failed"),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("trading_models").delete().eq("id", model.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["models"] });
      toast.success("Strategy deleted");
      onClose();
    },
  });

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto glass-strong rounded-2xl border border-glass-border" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-glass-border sticky top-0 glass-strong">
          <h2 style={{ fontFamily: "var(--font-display)" }} className="text-2xl">{isEdit ? "Edit Strategy" : "New Strategy"}</h2>
          <button onClick={onClose}><X className="size-5 text-muted-foreground" /></button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <F label="Name" col2><Input value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="HTF FVG Continuation" /></F>
          <F label="Setup grade">
            <select className={inputCls} value={form.setup_grade ?? ""} onChange={(e) => setForm({ ...form, setup_grade: e.target.value })}>
              <option value="">—</option>
              {GRADES.map((g) => <option key={g}>{g}</option>)}
            </select>
          </F>
          <F label="Market">
            <select className={inputCls} value={form.market ?? ""} onChange={(e) => setForm({ ...form, market: e.target.value })}>
              <option value="">—</option>
              {MARKETS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </F>
          <F label="Timeframes (comma separated)" col2><Input value={form.timeframes} onChange={(v) => setForm({ ...form, timeframes: v })} placeholder="4H, 15m, 1m" /></F>
          <F label="Entry rules" col2><Area value={form.entry_rules} onChange={(v) => setForm({ ...form, entry_rules: v })} /></F>
          <F label="Confirmation rules" col2><Area value={form.confirmation_rules} onChange={(v) => setForm({ ...form, confirmation_rules: v })} /></F>
          <F label="Invalidation rules" col2><Area value={form.invalidation_rules} onChange={(v) => setForm({ ...form, invalidation_rules: v })} /></F>
          <F label="Risk management rules" col2><Area value={form.risk_rules} onChange={(v) => setForm({ ...form, risk_rules: v })} /></F>
          <F label="Trade management rules" col2><Area value={form.management_rules} onChange={(v) => setForm({ ...form, management_rules: v })} /></F>
          <F label="Notes & lessons" col2><Area value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} /></F>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Pre-trade checklist</span>
              <button
                type="button"
                onClick={() => setForm({ ...form, checklist: [...(form.checklist ?? []), ""] })}
                className="text-xs rounded-md border border-white/10 px-2.5 py-1 hover:bg-white/[0.05]"
              >
                + Add item
              </button>
            </div>
            <div className="space-y-2">
              {(form.checklist ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground italic">
                  Add steps you confirm before taking this setup (e.g. HTF bias aligned, killzone active, FVG mitigated).
                </p>
              )}
              {(form.checklist ?? []).map((item: string, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-5 text-right tabular-nums">{i + 1}.</span>
                  <input
                    className={inputCls}
                    value={item}
                    placeholder="Checklist item"
                    onChange={(e) => {
                      const next = [...form.checklist];
                      next[i] = e.target.value;
                      setForm({ ...form, checklist: next });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, checklist: form.checklist.filter((_: any, j: number) => j !== i) })}
                    className="text-muted-foreground hover:text-loss text-sm px-2"
                    aria-label="Remove item"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 md:col-span-2 text-sm">
            <input type="checkbox" checked={!!form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Active strategy
          </label>
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-glass-border sticky bottom-0 glass-strong">
          <div>
            {isEdit && (
              <button onClick={() => { if (confirm("Delete this strategy?")) remove.mutate(); }} className="text-xs text-loss hover:underline">
                Delete strategy
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm border border-white/10">Cancel</button>
            <button onClick={() => save.mutate()} disabled={save.isPending} className="rounded-lg px-5 py-2 text-sm gradient-maroon maroon-glow disabled:opacity-60">
              {save.isPending ? "Saving…" : isEdit ? "Save changes" : "Create strategy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-accent/60";
function Input({ value, onChange, placeholder }: { value: any; onChange: (v: string) => void; placeholder?: string }) {
  return <input className={inputCls} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />;
}
function Area({ value, onChange }: { value: any; onChange: (v: string) => void }) {
  return <textarea className={inputCls + " min-h-20"} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
}
function F({ label, children, col2 }: { label: string; children: React.ReactNode; col2?: boolean }) {
  return (
    <label className={`flex flex-col gap-1.5 ${col2 ? "md:col-span-2" : ""}`}>
      <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
function emptyForm() {
  return { name: "", setup_grade: "", market: "", timeframes: "", entry_rules: "", confirmation_rules: "", invalidation_rules: "", risk_rules: "", management_rules: "", notes: "", checklist: [], active: true };
}

