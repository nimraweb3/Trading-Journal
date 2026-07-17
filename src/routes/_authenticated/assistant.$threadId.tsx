import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Send, Mic, Loader2, Check, X, Square } from "lucide-react";
import { toast } from "sonner";
import { chatMessagesQuery } from "@/lib/chat-queries";
import { chatAssist, saveProposedTrade, transcribeAudio } from "@/lib/ai-assistant.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/_authenticated/assistant/$threadId")({
  component: ChatThread,
});

type ProposedTrade = Record<string, any>;

function ChatThread() {
  const { threadId } = Route.useParams();
  const qc = useQueryClient();
  const { data: messages = [] } = useQuery(chatMessagesQuery(threadId));
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [preview, setPreview] = useState<ProposedTrade | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const assist = useServerFn(chatAssist);
  const save = useServerFn(saveProposedTrade);
  const transcribe = useServerFn(transcribeAudio);

  useEffect(() => { inputRef.current?.focus(); }, [threadId]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, pending]);

  async function send(text?: string) {
    const userText = (text ?? input).trim();
    if (!userText || pending) return;
    setInput("");
    setPending(true);
    // Optimistic user msg
    qc.setQueryData(chatMessagesQuery(threadId).queryKey, (prev: any[] = []) => [
      ...prev,
      { id: `tmp-${Date.now()}`, role: "user", parts: [{ type: "text", text: userText }], created_at: new Date().toISOString() },
    ]);
    try {
      const res = await assist({ data: { threadId, userText } });
      if (res.proposedTrade) setPreview(res.proposedTrade);
      await qc.invalidateQueries({ queryKey: ["chat_messages", threadId] });
      await qc.invalidateQueries({ queryKey: ["chat_threads"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPending(false);
      inputRef.current?.focus();
    }
  }

  const saveMut = useMutation({
    mutationFn: async (trade: ProposedTrade) => await save({ data: { trade } }),
    onSuccess: () => {
      toast.success("Trade saved to journal");
      setPreview(null);
      qc.invalidateQueries({ queryKey: ["trades"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Voice recording
  const [recording, setRecording] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function toggleRecord() {
    if (recording) {
      recRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const mr = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: mime });
        if (blob.size < 1500) { toast.error("Recording too short"); return; }
        setPending(true);
        try {
          const buf = await blob.arrayBuffer();
          const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
          const { text } = await transcribe({ data: { audioBase64: b64, mime } });
          if (text) await send(text);
          else toast.error("Couldn't transcribe audio");
        } catch (e: any) { toast.error(e.message); } finally { setPending(false); }
      };
      mr.start();
      recRef.current = mr;
      setRecording(true);
    } catch { toast.error("Microphone access denied"); }
  }

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-10">
            <p>Try: <em>"I bought NAS100 at 22,450, SL 22,435, TP 22,480. Risked 1%, made +2R, won. Felt confident."</em></p>
          </div>
        )}
        {messages.map((m: any) => {
          const text = Array.isArray(m.parts) ? m.parts.filter((p: any) => p.type === "text").map((p: any) => p.text).join("") : "";
          const dataPart = Array.isArray(m.parts) ? m.parts.find((p: any) => p.type === "data")?.data : null;
          return (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={m.role === "user"
                ? "max-w-[80%] gradient-maroon rounded-2xl rounded-br-sm px-4 py-2.5 text-sm text-primary-foreground"
                : "max-w-[85%] text-sm"}
              >
                <div className="whitespace-pre-wrap">{text}</div>
                {dataPart?.proposed_trade && (
                  <button
                    onClick={() => setPreview(dataPart.proposed_trade)}
                    className="mt-2 text-xs text-accent hover:underline"
                  >
                    View extracted trade →
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {pending && (
          <div className="flex justify-start">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="size-3.5 animate-spin" /> Thinking…
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/10 p-3 md:p-4">
        <div className="flex items-end gap-2">
          <button
            onClick={toggleRecord}
            disabled={pending && !recording}
            className={`shrink-0 rounded-lg p-2.5 border border-white/10 ${recording ? "bg-loss/20 text-loss animate-pulse" : "hover:bg-white/[0.04]"}`}
            title={recording ? "Stop recording" : "Voice input"}
          >
            {recording ? <Square className="size-4" /> : <Mic className="size-4" />}
          </button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Describe your trade or ask a question…"
            rows={1}
            className="flex-1 resize-none bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent/60 max-h-40"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || pending}
            className="shrink-0 gradient-maroon maroon-glow rounded-lg p-2.5 disabled:opacity-50"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </button>
        </div>
      </div>

      {preview && (
        <TradePreviewDialog
          trade={preview}
          onClose={() => setPreview(null)}
          onSave={(t) => saveMut.mutate(t)}
          saving={saveMut.isPending}
        />
      )}
    </div>
  );
}

function TradePreviewDialog({ trade, onClose, onSave, saving }: {
  trade: ProposedTrade; onClose: () => void; onSave: (t: ProposedTrade) => void; saving: boolean;
}) {
  const [t, setT] = useState<ProposedTrade>(trade);
  const set = (k: string, v: any) => setT((prev) => ({ ...prev, [k]: v }));
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-strong rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        <div className="p-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Preview</p>
            <h2 style={{ fontFamily: "var(--font-display)" }} className="text-2xl mt-0.5">Confirm trade entry</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/[0.06] rounded-lg"><X className="size-4" /></button>
        </div>
        <div className="p-5 grid grid-cols-2 gap-3 text-sm">
          {[
            ["pair", "Pair"], ["direction", "Direction"], ["trade_date", "Date"],
            ["entry_price", "Entry"], ["stop_loss", "Stop Loss"], ["take_profit", "Take Profit"],
            ["risk_percent", "Risk %"], ["lot_size", "Lot"], ["position_size", "Position"],
            ["rr_planned", "RR Planned"], ["rr_achieved", "RR Achieved"], ["pnl", "PnL"],
            ["result", "Result"], ["grade", "Grade"], ["session", "Session"],
            ["killzone", "Killzone"], ["model_name", "Strategy"], ["account_name", "Account"],
          ].map(([k, label]) => (
            <label key={k} className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
              <input
                value={t[k] ?? ""}
                onChange={(e) => set(k, e.target.value === "" ? null : e.target.value)}
                className="bg-white/[0.04] border border-white/10 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-accent/60"
              />
            </label>
          ))}
          {[
            ["rationale", "Rationale"], ["notes", "Notes"], ["mistakes", "Mistakes"],
            ["lessons", "Lessons"], ["emotions_before", "Emotions before"], ["emotions_after", "Emotions after"],
          ].map(([k, label]) => (
            <label key={k} className="flex flex-col gap-1 col-span-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
              <textarea
                value={t[k] ?? ""}
                onChange={(e) => set(k, e.target.value === "" ? null : e.target.value)}
                rows={2}
                className="bg-white/[0.04] border border-white/10 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-accent/60"
              />
            </label>
          ))}
        </div>
        <div className="p-5 border-t border-white/10 flex justify-end gap-2 sticky bottom-0 bg-background/80 backdrop-blur">
          <button onClick={onClose} className="rounded-lg border border-white/10 px-4 py-2 text-sm">Cancel</button>
          <button
            onClick={() => onSave(t)}
            disabled={saving}
            className="inline-flex items-center gap-2 gradient-maroon maroon-glow rounded-lg px-4 py-2 text-sm disabled:opacity-50"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            Save to journal
          </button>
        </div>
      </div>
    </div>
  );
}
