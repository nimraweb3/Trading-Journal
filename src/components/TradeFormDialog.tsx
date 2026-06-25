import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, Upload, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

interface TradeFormProps {
  open: boolean;
  onClose: () => void;
  trade?: any | null;
}

const PAIRS = ["GBPUSD", "EURUSD", "NAS100", "XAUUSD", "USDJPY", "GBPJPY", "BTCUSD"];
const SESSIONS = ["Asia", "London", "New York", "Overlap"];
const KILLZONES = ["London Open", "NY Open", "8-9 AM", "Silver Bullet", "London Close"];
const MODELS = ["HTF FVG A+", "HTF FVG B+", "Opening Range A+", "Other"];
const GRADES = ["A+", "A", "B+", "B", "C", "F"];
const RESULTS = ["win", "loss", "breakeven"] as const;

export function TradeFormDialog({ open, onClose, trade }: TradeFormProps) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const isEdit = !!trade;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);

  const [form, setForm] = useState<any>({
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
    result: "",
    pnl: "0",
    grade: "",
    model: "",
    notes: "",
    emotions_before: "",
    emotions_after: "",
    mistakes: "",
    lessons: "",
  });

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
        pnl: trade.pnl ?? "0",
      });
      supabase
        .from("trade_images")
        .select("*")
        .eq("trade_id", trade.id)
        .order("position")
        .then(({ data }) => setExistingImages(data ?? []));
    } else {
      setExistingImages([]);
      setPendingFiles([]);
    }
  }, [trade, open]);

  const num = (v: any) => (v === "" || v === null || v === undefined ? null : Number(v));

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const payload = {
        user_id: user.id,
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
        result: form.result || null,
        pnl: num(form.pnl) ?? 0,
        grade: form.grade || null,
        model: form.model || null,
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

      // Upload pending images
      for (const file of pendingFiles) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${tradeId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("trade-images").upload(path, file);
        if (upErr) throw upErr;
        const { error: insErr } = await supabase.from("trade_images").insert({
          trade_id: tradeId,
          user_id: user.id,
          storage_path: path,
        });
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
      <div
        className="w-full max-w-3xl max-h-[92vh] overflow-y-auto glass-strong rounded-2xl border border-glass-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-glass-border sticky top-0 glass-strong z-10">
          <div>
            <h2 style={{ fontFamily: "var(--font-display)" }} className="text-2xl">
              {isEdit ? "Edit Trade" : "New Trade"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Log the setup, execution, and reflection.</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Pair">
            <select className={inputCls} value={form.pair} onChange={(e) => setForm({ ...form, pair: e.target.value })}>
              {PAIRS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Direction">
            <div className="flex gap-2">
              {(["buy", "sell"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setForm({ ...form, direction: d })}
                  className={`flex-1 rounded-lg py-2 text-sm capitalize border transition ${
                    form.direction === d
                      ? d === "buy"
                        ? "bg-win/20 border-win/40 text-win"
                        : "bg-loss/20 border-loss/40 text-loss"
                      : "border-white/10 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Date">
            <input type="date" className={inputCls} value={form.trade_date} onChange={(e) => setForm({ ...form, trade_date: e.target.value })} />
          </Field>
          <Field label="Session">
            <select className={inputCls} value={form.session} onChange={(e) => setForm({ ...form, session: e.target.value })}>
              <option value="">—</option>
              {SESSIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Killzone">
            <select className={inputCls} value={form.killzone} onChange={(e) => setForm({ ...form, killzone: e.target.value })}>
              <option value="">—</option>
              {KILLZONES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Model">
            <select className={inputCls} value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })}>
              <option value="">—</option>
              {MODELS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>

          <Field label="Entry">
            <input className={inputCls} value={form.entry_price} onChange={(e) => setForm({ ...form, entry_price: e.target.value })} />
          </Field>
          <Field label="Stop Loss">
            <input className={inputCls} value={form.stop_loss} onChange={(e) => setForm({ ...form, stop_loss: e.target.value })} />
          </Field>
          <Field label="Take Profit">
            <input className={inputCls} value={form.take_profit} onChange={(e) => setForm({ ...form, take_profit: e.target.value })} />
          </Field>
          <Field label="Lot Size">
            <input className={inputCls} value={form.lot_size} onChange={(e) => setForm({ ...form, lot_size: e.target.value })} />
          </Field>
          <Field label="Risk %">
            <input className={inputCls} value={form.risk_percent} onChange={(e) => setForm({ ...form, risk_percent: e.target.value })} />
          </Field>
          <Field label="RR Planned">
            <input className={inputCls} value={form.rr_planned} onChange={(e) => setForm({ ...form, rr_planned: e.target.value })} />
          </Field>
          <Field label="RR Achieved">
            <input className={inputCls} value={form.rr_achieved} onChange={(e) => setForm({ ...form, rr_achieved: e.target.value })} />
          </Field>
          <Field label="P&L">
            <input className={inputCls} value={form.pnl} onChange={(e) => setForm({ ...form, pnl: e.target.value })} />
          </Field>
          <Field label="Result">
            <div className="flex gap-2">
              {RESULTS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm({ ...form, result: form.result === r ? "" : r })}
                  className={`flex-1 rounded-lg py-2 text-xs capitalize border transition ${
                    form.result === r
                      ? r === "win"
                        ? "bg-win/20 border-win/40 text-win"
                        : r === "loss"
                        ? "bg-loss/20 border-loss/40 text-loss"
                        : "bg-white/10 border-white/15"
                      : "border-white/10 text-muted-foreground"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Grade">
            <div className="flex gap-1.5">
              {GRADES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setForm({ ...form, grade: form.grade === g ? "" : g })}
                  className={`flex-1 rounded-md py-2 text-xs font-medium border transition tabular-nums ${
                    form.grade === g ? "gradient-maroon border-transparent maroon-glow" : "border-white/10 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </Field>

          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Emotions before">
              <input className={inputCls} value={form.emotions_before} onChange={(e) => setForm({ ...form, emotions_before: e.target.value })} placeholder="e.g. patient, focused" />
            </Field>
            <Field label="Emotions after">
              <input className={inputCls} value={form.emotions_after} onChange={(e) => setForm({ ...form, emotions_after: e.target.value })} placeholder="e.g. confident, frustrated" />
            </Field>
          </div>

          <Field label="Notes" className="md:col-span-2">
            <textarea className={`${inputCls} min-h-20`} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <Field label="Mistakes" className="md:col-span-2">
            <textarea className={`${inputCls} min-h-16`} value={form.mistakes} onChange={(e) => setForm({ ...form, mistakes: e.target.value })} />
          </Field>
          <Field label="Lessons learned" className="md:col-span-2">
            <textarea className={`${inputCls} min-h-16`} value={form.lessons} onChange={(e) => setForm({ ...form, lessons: e.target.value })} />
          </Field>

          {/* Chart uploads */}
          <Field label="Chart screenshots" className="md:col-span-2">
            <div className="flex flex-wrap gap-3">
              {existingImages.map((img) => (
                <ImagePreview key={img.id} path={img.storage_path} onRemove={() => deleteImage(img)} />
              ))}
              {pendingFiles.map((f, i) => (
                <div key={i} className="relative w-28 h-20 rounded-lg overflow-hidden border border-glass-border">
                  <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPendingFiles((arr) => arr.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 bg-black/60 rounded p-0.5"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-28 h-20 rounded-lg border border-dashed border-white/15 flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:border-accent/40 transition"
              >
                <Upload className="size-4" /> Add
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  setPendingFiles((arr) => [...arr, ...files]);
                  e.target.value = "";
                }}
              />
            </div>
          </Field>
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-glass-border sticky bottom-0 glass-strong">
          <div>
            {isEdit && (
              <button
                onClick={() => {
                  if (confirm("Delete this trade?")) removeTrade.mutate();
                }}
                className="text-xs text-loss hover:underline"
              >
                Delete trade
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm border border-white/10 hover:bg-white/[0.04]">
              Cancel
            </button>
            <button
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="rounded-lg px-5 py-2 text-sm gradient-maroon maroon-glow text-primary-foreground disabled:opacity-60"
            >
              {save.isPending ? "Saving…" : isEdit ? "Save changes" : "Add trade"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/60 focus:bg-white/[0.06] transition";

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
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 bg-black/60 rounded p-0.5"
      >
        <Trash2 className="size-3" />
      </button>
    </div>
  );
}
