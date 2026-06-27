import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const generateWeeklyReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    const d = (data ?? {}) as { accountId?: string | null; days?: number };
    return { accountId: d.accountId ?? null, days: d.days ?? 7 };
  })
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI gateway not configured");

    const since = new Date();
    since.setDate(since.getDate() - data.days);
    const sinceStr = since.toISOString().slice(0, 10);

    let q = context.supabase
      .from("trades")
      .select("trade_date,pair,direction,session,killzone,model,grade,result,pnl,rr_planned,rr_achieved,risk_percent,mistakes,notes,emotions_before,emotions_after,lessons")
      .gte("trade_date", sinceStr)
      .order("trade_date", { ascending: false })
      .limit(80);
    if (data.accountId) q = q.eq("account_id", data.accountId);

    const { data: trades, error } = await q;
    if (error) throw new Error(error.message);

    if (!trades || trades.length === 0) {
      return { review: null, count: 0 };
    }

    const wins = trades.filter((t) => t.result === "win").length;
    const losses = trades.filter((t) => t.result === "loss").length;
    const pnl = trades.reduce((s, t) => s + (Number(t.pnl) || 0), 0);

    const summary = {
      period_days: data.days,
      total_trades: trades.length,
      wins, losses,
      win_rate_pct: trades.length ? Math.round((wins / Math.max(1, wins + losses)) * 100) : 0,
      net_pnl: Number(pnl.toFixed(2)),
      trades,
    };

    const prompt = `You are an elite trading coach reviewing a trader's last ${data.days} days. Be brutally honest, specific, and actionable. Use the data below.

Return STRICT JSON with this shape (no markdown, no prose outside JSON):
{
  "headline": "one-sentence verdict",
  "what_went_wrong": ["specific mistake 1 with evidence from the data", "..."],
  "what_went_right": ["..."],
  "patterns": ["recurring behavior, time-of-day, pair bias, etc."],
  "improvements": ["concrete action 1 the trader should do next week", "..."],
  "focus_for_next_week": "single most important thing"
}

DATA:
${JSON.stringify(summary)}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an expert ICT/SMC trading coach. Always reply with valid JSON only." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`AI gateway error: ${res.status} ${txt.slice(0, 200)}`);
    }
    const json = await res.json();
    const content: string = json.choices?.[0]?.message?.content ?? "{}";
    const cleaned = content.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    let parsed: any;
    try { parsed = JSON.parse(cleaned); } catch { parsed = { headline: "Could not parse AI response", raw: cleaned }; }

    return { review: parsed, count: trades.length, stats: { wins, losses, pnl: summary.net_pnl, winRate: summary.win_rate_pct } };
  });
