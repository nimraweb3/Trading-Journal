export interface TradeRow {
  id: string;
  pair: string;
  direction: "buy" | "sell";
  trade_date: string;
  session: string | null;
  rr_achieved: number | null;
  risk_percent: number | null;
  pnl: number;
  result: "win" | "loss" | "breakeven" | null;
  grade: string | null;
  model: string | null;
  created_at: string;
}

export interface AccountStats {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  netPnL: number;
  currentEquity: number;
  avgRR: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  expectancy: number;
  largestWin: number;
  largestLoss: number;
}

export function computeStats(trades: TradeRow[], startingBalance: number): AccountStats {
  const closed = trades.filter((t) => t.result !== null);
  const wins = closed.filter((t) => t.result === "win");
  const losses = closed.filter((t) => t.result === "loss");

  const grossWin = wins.reduce((s, t) => s + (t.pnl || 0), 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + (t.pnl || 0), 0));
  const netPnL = closed.reduce((s, t) => s + (t.pnl || 0), 0);

  const winRate = closed.length ? (wins.length / closed.length) * 100 : 0;
  const avgWin = wins.length ? grossWin / wins.length : 0;
  const avgLoss = losses.length ? grossLoss / losses.length : 0;
  const rrValues = closed.map((t) => t.rr_achieved ?? 0).filter((x) => x !== 0);
  const avgRR = rrValues.length ? rrValues.reduce((s, x) => s + x, 0) / rrValues.length : 0;
  const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0;
  const expectancy = closed.length
    ? (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss
    : 0;
  const largestWin = wins.reduce((m, t) => Math.max(m, t.pnl || 0), 0);
  const largestLoss = losses.reduce((m, t) => Math.min(m, t.pnl || 0), 0);

  return {
    totalTrades: trades.length,
    wins: wins.length,
    losses: losses.length,
    winRate,
    netPnL,
    currentEquity: startingBalance + netPnL,
    avgRR,
    avgWin,
    avgLoss,
    profitFactor: Number.isFinite(profitFactor) ? profitFactor : 0,
    expectancy,
    largestWin,
    largestLoss,
  };
}

export function buildEquityCurve(trades: TradeRow[], startingBalance: number) {
  // Sort by date then created_at
  const sorted = [...trades].sort((a, b) => {
    const ad = a.trade_date.localeCompare(b.trade_date);
    if (ad !== 0) return ad;
    return a.created_at.localeCompare(b.created_at);
  });
  let equity = startingBalance;
  let peak = startingBalance;
  const points = [{ date: "Start", equity, drawdown: 0 }];
  for (const t of sorted) {
    equity += t.pnl || 0;
    peak = Math.max(peak, equity);
    points.push({
      date: t.trade_date,
      equity: Number(equity.toFixed(2)),
      drawdown: Number((equity - peak).toFixed(2)),
    });
  }
  return points;
}

export function groupBy<T>(arr: T[], key: (t: T) => string) {
  const out: Record<string, T[]> = {};
  for (const item of arr) {
    const k = key(item) || "—";
    (out[k] ||= []).push(item);
  }
  return out;
}
