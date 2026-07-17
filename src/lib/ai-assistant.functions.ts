import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MODEL = "google/gemini-2.5-flash";

type Msg = { role: "user" | "assistant" | "system"; content: string };

const SYSTEM = `You are TradeBook's AI journal assistant. The trader describes trades in natural language (or voice-transcribed text) and you convert them into structured journal entries.

You MUST reply ONLY with a single JSON object (no markdown, no prose outside JSON) shaped:
{
  "reply": "short conversational reply to the trader",
  "proposed_trade": null | {
    "pair": string,
    "direction": "buy" | "sell",
    "trade_date": "YYYY-MM-DD",
    "entry_price": number | null,
    "stop_loss": number | null,
    "take_profit": number | null,
    "lot_size": number | null,
    "position_size": number | null,
    "risk_percent": number | null,
    "rr_planned": number | null,
    "rr_achieved": number | null,
    "pnl": number | null,
    "result": "win" | "loss" | "breakeven" | null,
    "grade": "A+" | "A" | "B+" | "B" | "C" | "F" | null,
    "session": string | null,
    "killzone": string | null,
    "model_name": string | null,
    "account_name": string | null,
    "notes": string | null,
    "rationale": string | null,
    "mistakes": string | null,
    "lessons": string | null,
    "emotions_before": string | null,
    "emotions_after": string | null,
    "tradingview_link": string | null
  },
  "needs": string[]
}

Rules:
- If the user is describing a trade, extract every field you can. Compute R-multiple / RR from entry, stop, and TP when possible. Compute pnl only if the user gave it — do not invent numbers.
- If direction / pair / entry / stop are missing, ask for them in "reply" and list them in "needs". Only set proposed_trade when you have enough (at minimum: pair + direction).
- If the user is just chatting (not describing a trade), set proposed_trade to null and answer briefly.
- Prefer the account_name and model_name the user mentions; otherwise pick from the provided lists when obvious.
- Use today's date if not specified.`;

export const chatAssist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    const d = data as { threadId: string; userText: string };
    if (!d?.threadId || !d?.userText) throw new Error("threadId and userText required");
    return { threadId: d.threadId, userText: String(d.userText).slice(0, 8000) };
  })
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI gateway not configured");
    const { supabase, userId } = context;

    // Verify thread ownership
    const { data: thread, error: tErr } = await supabase
      .from("chat_threads").select("id,title").eq("id", data.threadId).maybeSingle();
    if (tErr || !thread) throw new Error("Thread not found");

    // Load context
    const [{ data: accounts }, { data: models }, { data: history }] = await Promise.all([
      supabase.from("accounts").select("id,name,account_type,is_default"),
      supabase.from("trading_models").select("id,name"),
      supabase.from("chat_messages").select("role,parts").eq("thread_id", data.threadId).order("created_at").limit(30),
    ]);

    const priorMsgs: Msg[] = (history ?? []).map((m: any) => ({
      role: m.role as any,
      content: Array.isArray(m.parts) ? m.parts.map((p: any) => p.text ?? "").join("") : "",
    }));

    // Persist user message
    await supabase.from("chat_messages").insert({
      thread_id: data.threadId, user_id: userId, role: "user",
      parts: [{ type: "text", text: data.userText }],
    });

    const contextBlock = `Today: ${new Date().toISOString().slice(0, 10)}
Accounts: ${JSON.stringify((accounts ?? []).map((a: any) => a.name))}
Strategies: ${JSON.stringify((models ?? []).map((m: any) => m.name))}`;

    const messages: Msg[] = [
      { role: "system", content: SYSTEM },
      { role: "system", content: contextBlock },
      ...priorMsgs,
      { role: "user", content: data.userText },
    ];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: MODEL, messages, response_format: { type: "json_object" } }),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`AI gateway ${res.status}: ${txt.slice(0, 200)}`);
    }
    const json = await res.json();
    const raw: string = json.choices?.[0]?.message?.content ?? "{}";
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    let parsed: any;
    try { parsed = JSON.parse(cleaned); } catch { parsed = { reply: cleaned, proposed_trade: null, needs: [] }; }

    // Persist assistant message
    await supabase.from("chat_messages").insert({
      thread_id: data.threadId, user_id: userId, role: "assistant",
      parts: [{ type: "text", text: parsed.reply ?? "" }, { type: "data", data: parsed }],
    });

    // Auto-title thread on first assistant reply
    if (priorMsgs.length === 0) {
      const title = data.userText.slice(0, 60).replace(/\s+/g, " ").trim() || "New chat";
      await supabase.from("chat_threads").update({ title }).eq("id", data.threadId);
    } else {
      await supabase.from("chat_threads").update({ updated_at: new Date().toISOString() }).eq("id", data.threadId);
    }

    return { reply: parsed.reply ?? "", proposedTrade: parsed.proposed_trade ?? null, needs: parsed.needs ?? [] };
  });

export const saveProposedTrade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    const d = data as { trade: any };
    if (!d?.trade) throw new Error("trade required");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const t = data.trade;

    // Resolve account/model by name
    let accountId: string | null = null;
    let modelId: string | null = null;
    if (t.account_name) {
      const { data: a } = await supabase.from("accounts").select("id").ilike("name", t.account_name).limit(1);
      accountId = a?.[0]?.id ?? null;
    }
    if (!accountId) {
      const { data: a } = await supabase.from("accounts").select("id").eq("is_default", true).limit(1);
      accountId = a?.[0]?.id ?? null;
    }
    if (t.model_name) {
      const { data: m } = await supabase.from("trading_models").select("id").ilike("name", t.model_name).limit(1);
      modelId = m?.[0]?.id ?? null;
    }

    const num = (v: any) => (v === null || v === undefined || v === "" ? null : Number(v));
    const payload: any = {
      user_id: userId,
      account_id: accountId,
      model_id: modelId,
      pair: String(t.pair || "").toUpperCase() || "UNKNOWN",
      direction: t.direction === "sell" ? "sell" : "buy",
      trade_date: t.trade_date || new Date().toISOString().slice(0, 10),
      entry_price: num(t.entry_price),
      stop_loss: num(t.stop_loss),
      take_profit: num(t.take_profit),
      lot_size: num(t.lot_size),
      position_size: num(t.position_size),
      risk_percent: num(t.risk_percent),
      rr_planned: num(t.rr_planned),
      rr_achieved: num(t.rr_achieved),
      pnl: num(t.pnl) ?? 0,
      result: t.result || null,
      grade: t.grade || null,
      session: t.session || null,
      killzone: t.killzone || null,
      model: t.model_name || null,
      notes: t.notes || null,
      rationale: t.rationale || null,
      mistakes: t.mistakes || null,
      lessons: t.lessons || null,
      emotions_before: t.emotions_before || null,
      emotions_after: t.emotions_after || null,
      tradingview_link: t.tradingview_link || null,
    };

    const { data: inserted, error } = await supabase.from("trades").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    return { id: inserted.id };
  });

export const transcribeAudio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    const d = data as { audioBase64: string; mime: string };
    if (!d?.audioBase64) throw new Error("audioBase64 required");
    return { audioBase64: d.audioBase64, mime: d.mime || "audio/webm" };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI gateway not configured");
    const bin = Buffer.from(data.audioBase64, "base64");
    const ext = data.mime.includes("mp4") ? "mp4" : data.mime.includes("wav") ? "wav" : data.mime.includes("mpeg") ? "mp3" : "webm";
    const form = new FormData();
    form.append("model", "openai/gpt-4o-transcribe");
    form.append("file", new Blob([bin], { type: data.mime }), `recording.${ext}`);
    const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Transcribe ${res.status}: ${t.slice(0, 200)}`);
    }
    const json = await res.json();
    return { text: (json.text as string) ?? "" };
  });
