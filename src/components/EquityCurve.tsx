import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatCurrency } from "@/lib/format";

interface Point {
  date: string;
  equity: number;
  drawdown: number;
}

export function EquityCurve({ data, currency = "USD" }: { data: Point[]; currency?: string }) {
  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.55 0.18 18)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="oklch(0.55 0.18 18)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="oklch(1 0 0 / 6%)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="oklch(0.66 0.012 50)"
            tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
            tickLine={false}
            axisLine={false}
            minTickGap={28}
          />
          <YAxis
            stroke="oklch(0.66 0.012 50)"
            tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
            tickLine={false}
            axisLine={false}
            width={70}
            tickFormatter={(v) => formatCurrency(v, currency).replace(/\.00$/, "")}
          />
          <Tooltip
            contentStyle={{
              background: "oklch(0.18 0.014 25)",
              border: "1px solid oklch(1 0 0 / 10%)",
              borderRadius: 8,
              fontFamily: "var(--font-mono)",
              fontSize: 12,
            }}
            labelStyle={{ color: "oklch(0.66 0.012 50)" }}
            formatter={(v: number) => formatCurrency(v, currency)}
          />
          <Area
            type="monotone"
            dataKey="equity"
            stroke="oklch(0.62 0.2 18)"
            strokeWidth={2}
            fill="url(#eqFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
