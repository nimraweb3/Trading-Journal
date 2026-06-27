import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, Upload, Trash2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useAccountContext } from "@/lib/account-context";
import { accountsQuery, modelsQuery } from "@/lib/queries";

interface TradeFormProps {
  open: boolean;
  onClose: () => void;
  trade?: any | null;
}

const DEFAULT_PAIRS = ["GBPUSD", "EURUSD", "NAS100", "XAUUSD", "USDJPY", "GBPJPY", "BTCUSD", "ES", "NQ"];
const PAIRS_STORAGE_KEY = "tradebook.customPairs";
const SESSIONS = ["Asia", "London", "New York", "Overlap"];
const KILLZONES = ["London Open", "NY Open", "8-9 AM", "Silver Bullet", "London Close"];
const GRADES = ["A+", "A", "B+", "B", "C", "F"];
const RESULTS = ["win", "loss", "breakeven"] as const;
const MISTAKE_PRESETS = [
  "Overtrading",
  "Random trade",
  "FOMO entry",
  "Revenge trade",
  "No stop loss",
  "Moved stop loss",
  "Early exit",
  "Late entry",
  "No trade plan",
  "Oversized position",
  "Traded against trend",
  "Ignored rules",
  "Chased price",
  "Forced setup",
];

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];


export function TradeFormDialog({ open, onClose, trade }: TradeFormProps) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { activeAccountId, accounts: ctxAccounts } = useAccountContext();
  const { data: accounts = ctxAccounts } = useQuery(accountsQuery());
  const { data: models = [] } = useQuery(modelsQuery());
  const isEdit = !!trade;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [customPairs, setCustomPairs] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(PAIRS_STORAGE_KEY) ?? "[]"); } catch { return []; }
  });
  const allPairs = Array.from(new Set([...DEFAULT_PAIRS, ...customPairs]));
  const addCustomPair = () => {
    const v = window.prompt("Add a new symbol (e.g. SOLUSD, US30):");
    if (!v) return;
    const sym = v.trim().toUpperCase();
    if (!sym) return;
    const next = Array.from(new Set([...customPairs, sym]));
    setCustomPairs(next);
    try { localStorage.setItem(PAIRS_STORAGE_KEY, JSON.stringify(next)); } catch {}
    setForm((f: any) => ({ ...f, pair: sym }));
  };

  const [form, setForm] = useState<any>({});


  useEffect(() => {
    if (trade) {
      setForm({
        ...trade,
        entry_price: trade.entry_price ?? "",
        stop_loss: trade.stop_loss ?? "",
        take_profit: trade.take_profit ?? "",
        risk_percent: trade.risk_percent ?? "",
        rr_planned: trade.rr_planned ?? "",
        rr_achieved: trade.rr_achieved ?? "",
        lot_size: trade.lot_size ?? "",
        position_size: trade.position_size ?? "",
        pnl: trade.pnl ?? "0",
        account_id: trade.account_id ?? activeAccountId ?? accounts[0]?.id ?? "",
        model_id: trade.model_id ?? "",
        tradingview_link: trade.tradingview_link ?? "",
      });
      supabase.from("trade_images").select("*").eq("trade_id", trade.id).order("position")
        .then(({ data }) => setExistingImages(data ?? []));
    } else {
      setForm({
        pair: "GBPUSD",
        direction: "buy",
        trade_date: new Date().toISOString().slice(0, 10),
        session: "London",
        killzone: "",
        entry_price: "",
        stop_loss: "",
        take_profit: "",
        risk_percent: "1",
        rr_planned: "",
        rr_achieved: "",
        lot_size: "",
        position_size: "",
        result: "",
        pnl: "0",
        grade: "",
        model: "",
        model_id: "",
        account_id: activeAccountId ?? accounts[0]?.id ?? "",
        tradingview_link: "",
        notes: "",
        emotions_before: "",
        emotions_after: "",
        mistakes: "",
        lessons: "",
      });
      setExistingImages([]);
      setPendingFiles([]);
    }
  }, [trade, open, activeAccountId, accounts.length]);

  const num = (v: any) => (v === "" || v === null || v === undefined ? null : Number(v));

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      if (!form.account_id) throw new Error("Account is required");

      // validate files first
      for (const file of pendingFiles) {
        if (file.size > MAX_FILE_BYTES) throw new Error(`${file.name} exceeds 5MB`);
        if (!ALLOWED_TYPES.includes(file.type)) throw new Error(`${file.name} is not a supported image`);
      }

      const payload: any = {
        user_id: user.id,
        account_id: form.account_id,
        model_id: form.model_id || null,
        tradingview_link: form.tradingview_link || null,
        pair: form.pair,
        direction: form.direction,
        trade_date: form.trade_date,
        session: form.session || null,
        killzone: form.killzone || null,
        entry_price: num(form.entry_price),
        stop_loss: num(form.stop_loss),
        take_profit: num(form.take_profit),
        risk_percent: num(form.risk_percent),
        rr_planned: num(form.rr_planned),
        rr_achieved: num(form.rr_achieved),
        lot_size: num(form.lot_size),
        position_size: num(form.position_size),
        result: form.result || null,
        pnl: num(form.pnl) ?? 0,
        grade: form.grade || null,
        model: form.model || (form.model_id ? models.find((m: any) => m.id === form.model_id)?.name ?? null : null),
        notes: form.notes || null,
        emotions_before: form.emotions_before || null,
        emotions_after: form.emotions_after || null,
        mistakes: form.mistakes || null,
        lessons: form.lessons || null,
      };

      let tradeId: string;
      if (isEdit) {
        const { error } = await supabase.from("trades").update(payload).eq("id", trade.id);
        if (error) throw error;
        tradeId = trade.id;
      } else {
        const { data, error } = await supabase.from("trades").insert(payload).select("id").single();
        if (error) throw error;
        tradeId = data.id;
      }

      for (const file of pendingFiles) {
        const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
        const path = `${user.id}/${tradeId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("trade-images").upload(path, file, { contentType: file.type });
        if (upErr) throw upErr;
        const { error: insErr } = await supabase.from("trade_images").insert({ trade_id: tradeId, user_id: user.id, storage_path: path });
        if (insErr) throw insErr;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trades"] });
      toast.success(isEdit ? "Trade updated" : "Trade added");
      onClose();
    },
    onError: (e: any) => toast.error(e.message ?? "Save failed"),
  });

  const deleteImage = async (img: any) => {
    await supabase.storage.from("trade-images").remove([img.storage_path]);
    await supabase.from("trade_images").delete().eq("id", img.id);
    setExistingImages((arr) => arr.filter((x) => x.id !== img.id));
  };

  const removeTrade = useMutation({
    mutationFn: async () => {
      if (!trade) return;
      const { error } = await supabase.from("trades").delete().eq("id", trade.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trades"] });
      toast.success("Trade deleted");
      onClose();
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-6 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto glass-strong rounded-2xl border border-glass-border" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-glass-border sticky top-0 glass-strong z-10">
          <div>
            <h2 style={{ fontFamily: "var(--font-display)" }} className="text-2xl">{isEdit ? "Edit Trade" : "New Trade"}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Log the setup, execution, and reflection.</p>
          </div>
          <button onClick={onClose}><X className="size-5 text-muted-foreground" /></button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Account *">
            <select className={inputCls} value={form.account_id ?? ""} onChange={(e) => setForm({ ...form, account_id: e.target.value })}>
              <option value="">Select account…</option>
              {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
          <Field label="Strategy">
            <select className={inputCls} value={form.model_id ?? ""} onChange={(e) => setForm({ ...form, model_id: e.target.value })}>
              <option value="">—</option>
              {models.map((m: any) => <option key={m.id} value={m.id}>{m.name}{m.setup_grade ? ` · ${m.setup_grade}` : ""}</option>)}
            </select>
          </Field>

          <Field label="Pair">
            <div className="flex gap-2">
              <select className={inputCls} value={form.pair ?? ""} onChange={(e) => setForm({ ...form, pair: e.target.value })}>
                {allPairs.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <button type="button" onClick={addCustomPair}
                className="shrink-0 rounded-lg px-3 text-xs border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-accent/40">
                + Add
              </button>
            </div>
          </Field>

          <Field label="Direction">
            <div className="flex gap-2">
              {(["buy", "sell"] as const).map((d) => (
                <button key={d} type="button" onClick={() => setForm({ ...form, direction: d })}
                  className={`flex-1 rounded-lg py-2 text-sm capitalize border transition ${form.direction === d ? (d === "buy" ? "bg-win/20 border-win/40 text-win" : "bg-loss/20 border-loss/40 text-loss") : "border-white/10 text-muted-foreground hover:text-foreground"}`}>
                  {d}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Date"><input type="date" className={inputCls} value={form.trade_date ?? ""} onChange={(e) => setForm({ ...form, trade_date: e.target.value })} /></Field>
          <Field label="Session">
            <select className={inputCls} value={form.session ?? ""} onChange={(e) => setForm({ ...form, session: e.target.value })}>
              <option value="">—</option>{SESSIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Killzone">
            <select className={inputCls} value={form.killzone ?? ""} onChange={(e) => setForm({ ...form, killzone: e.target.value })}>
              <option value="">—</option>{KILLZONES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="TradingView link">
            <input className={inputCls} value={form.tradingview_link ?? ""} onChange={(e) => setForm({ ...form, tradingview_link: e.target.value })} placeholder="https://www.tradingview.com/x/…" />
          </Field>

          <Field label="Entry"><input className={inputCls} value={form.entry_price} onChange={(e) => setForm({ ...form, entry_price: e.target.value })} /></Field>
          <Field label="Stop Loss"><input className={inputCls} value={form.stop_loss} onChange={(e) => setForm({ ...form, stop_loss: e.target.value })} /></Field>
          <Field label="Take Profit"><input className={inputCls} value={form.take_profit} onChange={(e) => setForm({ ...form, take_profit: e.target.value })} /></Field>
          <Field label="Position size / lots"><input className={inputCls} value={form.position_size ?? form.lot_size ?? ""} onChange={(e) => setForm({ ...form, position_size: e.target.value, lot_size: e.target.value })} /></Field>
          <Field label="Risk %"><input className={inputCls} value={form.risk_percent} onChange={(e) => setForm({ ...form, risk_percent: e.target.value })} /></Field>
          <Field label="RR Planned"><input className={inputCls} value={form.rr_planned} onChange={(e) => setForm({ ...form, rr_planned: e.target.value })} /></Field>
          <Field label="RR Achieved"><input className={inputCls} value={form.rr_achieved} onChange={(e) => setForm({ ...form, rr_achieved: e.target.value })} /></Field>
          <Field label="P&L"><input className={inputCls} value={form.pnl} onChange={(e) => setForm({ ...form, pnl: e.target.value })} /></Field>

          <Field label="Result">
            <div className="flex gap-2">
              {RESULTS.map((r) => (
                <button key={r} type="button" onClick={() => setForm({ ...form, result: form.result === r ? "" : r })}
                  className={`flex-1 rounded-lg py-2 text-xs capitalize border transition ${form.result === r ? (r === "win" ? "bg-win/20 border-win/40 text-win" : r === "loss" ? "bg-loss/20 border-loss/40 text-loss" : "bg-white/10 border-white/15") : "border-white/10 text-muted-foreground"}`}>
                  {r}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Grade">
            <div className="flex gap-1.5">
              {GRADES.map((g) => (
                <button key={g} type="button" onClick={() => setForm({ ...form, grade: form.grade === g ? "" : g })}
                  className={`flex-1 rounded-md py-2 text-xs font-medium border transition tabular-nums ${form.grade === g ? "gradient-maroon border-transparent maroon-glow" : "border-white/10 text-muted-foreground hover:text-foreground"}`}>
                  {g}
                </button>
              ))}
            </div>
          </Field>

          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Emotions before"><input className={inputCls} value={form.emotions_before ?? ""} onChange={(e) => setForm({ ...form, emotions_before: e.target.value })} placeholder="patient, focused" /></Field>
            <Field label="Emotions after"><input className={inputCls} value={form.emotions_after ?? ""} onChange={(e) => setForm({ ...form, emotions_after: e.target.value })} placeholder="confident, frustrated" /></Field>
          </div>

          <Field label="Notes" className="md:col-span-2"><textarea className={`${inputCls} min-h-20`} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
          <Field label="Mistakes / Rule violations" className="md:col-span-2">
            <MistakesPicker value={form.mistakes ?? ""} onChange={(v) => setForm({ ...form, mistakes: v })} />
          </Field>

          <Field label="Lessons learned" className="md:col-span-2"><textarea className={`${inputCls} min-h-16`} value={form.lessons ?? ""} onChange={(e) => setForm({ ...form, lessons: e.target.value })} /></Field>

          <Field label="Chart screenshots (max 5MB each)" className="md:col-span-2">
            <div className="flex flex-wrap gap-3">
              {existingImages.map((img) => <ImagePreview key={img.id} path={img.storage_path} onRemove={() => deleteImage(img)} />)}
              {pendingFiles.map((f, i) => (
                <div key={i} className="relative w-28 h-20 rounded-lg overflow-hidden border border-glass-border">
                  <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setPendingFiles((arr) => arr.filter((_, j) => j !== i))} className="absolute top-1 right-1 bg-black/60 rounded p-0.5">
                    <Trash2 className="size-3" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="w-28 h-20 rounded-lg border border-dashed border-white/15 flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:border-accent/40">
                <Upload className="size-4" /> Add
              </button>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple hidden
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  setPendingFiles((arr) => [...arr, ...files]);
                  e.target.value = "";
                }} />
            </div>
            {form.tradingview_link && (
              <a href={form.tradingview_link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-accent hover:underline">
                <ExternalLink className="size-3" /> Open chart link
              </a>
            )}
          </Field>
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-glass-border sticky bottom-0 glass-strong">
          <div>
            {isEdit && (
              <button onClick={() => { if (confirm("Delete this trade?")) removeTrade.mutate(); }} className="text-xs text-loss hover:underline">
                Delete trade
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm border border-white/10 hover:bg-white/[0.04]">Cancel</button>
            <button onClick={() => save.mutate()} disabled={save.isPending}
              className="rounded-lg px-5 py-2 text-sm gradient-maroon maroon-glow text-primary-foreground disabled:opacity-60">
              {save.isPending ? "Saving…" : isEdit ? "Save changes" : "Add trade"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/60 focus:bg-white/[0.06] transition";

function Field({ label, children, className = "" }: { label: string; children: any; className?: string }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function ImagePreview({ path, onRemove }: { path: string; onRemove: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    supabase.storage.from("trade-images").createSignedUrl(path, 3600).then(({ data }) => {
      if (data) setUrl(data.signedUrl);
    });
  }, [path]);
  return (
    <div className="relative w-28 h-20 rounded-lg overflow-hidden border border-glass-border bg-black/30">
      {url && <img src={url} alt="" className="w-full h-full object-cover" />}
      <button type="button" onClick={onRemove} className="absolute top-1 right-1 bg-black/60 rounded p-0.5">
        <Trash2 className="size-3" />
      </button>
    </div>
  );
}

function MistakesPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const selected = value ? value.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const toggle = (m: string) => {
    const has = selected.some((s) => s.toLowerCase() === m.toLowerCase());
    const next = has ? selected.filter((s) => s.toLowerCase() !== m.toLowerCase()) : [...selected, m];
    onChange(next.join(", "));
  };
  const isOn = (m: string) => selected.some((s) => s.toLowerCase() === m.toLowerCase());
  const customs = selected.filter((s) => !MISTAKE_PRESETS.some((p) => p.toLowerCase() === s.toLowerCase()));
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {MISTAKE_PRESETS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => toggle(m)}
            className={`rounded-full px-3 py-1 text-xs border transition ${
              isOn(m)
                ? "bg-loss/20 border-loss/40 text-loss"
                : "border-white/10 bg-white/[0.03] text-muted-foreground hover:text-foreground hover:border-white/20"
            }`}
          >
            {m}
          </button>
        ))}
        {customs.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => toggle(c)}
            className="rounded-full px-3 py-1 text-xs border bg-loss/20 border-loss/40 text-loss"
          >
            {c} ×
          </button>
        ))}
      </div>
      <input
        className={inputCls}
        placeholder="Add custom mistake and press Enter…"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const v = (e.target as HTMLInputElement).value.trim();
            if (v && !isOn(v)) onChange([...selected, v].join(", "));
            (e.target as HTMLInputElement).value = "";
          }
        }}
      />
    </div>
  );
}

}
