import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

const TYPES = ["personal", "prop", "demo", "funded", "challenge"] as const;
const STATUS = ["active", "passed", "failed", "funded", "breached", "archived"] as const;

export function AccountFormDialog({ open, onClose, account }: { open: boolean; onClose: () => void; account?: any | null }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const isEdit = !!account;
  const [form, setForm] = useState<any>({
    name: "",
    broker: "",
    prop_firm: "",
    account_type: "personal",
    account_size: "10000",
    starting_balance: "10000",
    currency: "USD",
    daily_dd_limit: "",
    max_dd_limit: "",
    profit_target: "",
    status: "active",
    notes: "",
  });

  useEffect(() => {
    if (account) {
      setForm({
        ...account,
        broker: account.broker ?? "",
        prop_firm: account.prop_firm ?? "",
        daily_dd_limit: account.daily_dd_limit ?? "",
        max_dd_limit: account.max_dd_limit ?? "",
        profit_target: account.profit_target ?? "",
        notes: account.notes ?? "",
      });
    } else {
      setForm({
        name: "", broker: "", prop_firm: "", account_type: "personal",
        account_size: "10000", starting_balance: "10000", currency: "USD",
        daily_dd_limit: "", max_dd_limit: "", profit_target: "", status: "active", notes: "",
      });
    }
  }, [account, open]);

  const num = (v: any) => (v === "" || v == null ? null : Number(v));

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      if (!form.name.trim()) throw new Error("Name required");
      const payload = {
        user_id: user.id,
        name: form.name.trim(),
        broker: form.broker || null,
        prop_firm: form.prop_firm || null,
        account_type: form.account_type,
        account_size: Number(form.account_size) || 0,
        starting_balance: Number(form.starting_balance) || 0,
        currency: form.currency || "USD",
        daily_dd_limit: num(form.daily_dd_limit),
        max_dd_limit: num(form.max_dd_limit),
        profit_target: num(form.profit_target),
        status: form.status,
        notes: form.notes || null,
      };
      if (isEdit) {
        const { error } = await supabase.from("accounts").update(payload).eq("id", account.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("accounts").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      toast.success(isEdit ? "Account updated" : "Account created");
      onClose();
    },
    onError: (e: any) => toast.error(e.message ?? "Save failed"),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("accounts").delete().eq("id", account.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["trades"] });
      toast.success("Account deleted");
      onClose();
    },
    onError: (e: any) => toast.error(e.message ?? "Delete failed"),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto glass-strong rounded-2xl border border-glass-border" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-glass-border sticky top-0 glass-strong">
          <h2 style={{ fontFamily: "var(--font-display)" }} className="text-2xl">{isEdit ? "Edit Account" : "New Account"}</h2>
          <button onClick={onClose}><X className="size-5 text-muted-foreground" /></button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <F label="Account name" col2><Input value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="FTMO 100K Challenge" /></F>
          <F label="Type">
            <Select value={form.account_type} onChange={(v) => setForm({ ...form, account_type: v })} options={TYPES.map((t) => [t, t])} />
          </F>
          <F label="Status">
            <Select value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={STATUS.map((t) => [t, t])} />
          </F>
          <F label="Broker"><Input value={form.broker} onChange={(v) => setForm({ ...form, broker: v })} /></F>
          <F label="Prop firm"><Input value={form.prop_firm} onChange={(v) => setForm({ ...form, prop_firm: v })} /></F>
          <F label="Account size"><Input value={form.account_size} onChange={(v) => setForm({ ...form, account_size: v })} /></F>
          <F label="Starting balance"><Input value={form.starting_balance} onChange={(v) => setForm({ ...form, starting_balance: v })} /></F>
          <F label="Currency"><Input value={form.currency} onChange={(v) => setForm({ ...form, currency: v.toUpperCase() })} /></F>
          <F label="Daily DD limit ($)"><Input value={form.daily_dd_limit} onChange={(v) => setForm({ ...form, daily_dd_limit: v })} /></F>
          <F label="Max DD limit ($)"><Input value={form.max_dd_limit} onChange={(v) => setForm({ ...form, max_dd_limit: v })} /></F>
          <F label="Profit target ($)"><Input value={form.profit_target} onChange={(v) => setForm({ ...form, profit_target: v })} /></F>
          <F label="Notes" col2>
            <textarea className={inputCls + " min-h-20"} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </F>
        </div>
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-glass-border sticky bottom-0 glass-strong">
          <div>
            {isEdit && !account.is_default && (
              <button onClick={() => { if (confirm("Delete this account and ALL its trades?")) remove.mutate(); }} className="text-xs text-loss hover:underline">
                Delete account
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm border border-white/10">Cancel</button>
            <button onClick={() => save.mutate()} disabled={save.isPending} className="rounded-lg px-5 py-2 text-sm gradient-maroon maroon-glow disabled:opacity-60">
              {save.isPending ? "Saving…" : isEdit ? "Save changes" : "Create account"}
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
function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <select className={inputCls + " capitalize"} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}
function F({ label, children, col2 }: { label: string; children: React.ReactNode; col2?: boolean }) {
  return (
    <label className={`flex flex-col gap-1.5 ${col2 ? "md:col-span-2" : ""}`}>
      <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
