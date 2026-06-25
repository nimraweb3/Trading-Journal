import type { ReactNode } from "react";

interface Props {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "win" | "loss" | "accent";
}

export function StatCard({ label, value, hint, tone = "default" }: Props) {
  const toneCls =
    tone === "win"
      ? "text-win"
      : tone === "loss"
      ? "text-loss"
      : tone === "accent"
      ? "text-accent"
      : "text-foreground";

  return (
    <div className="glass rounded-xl p-5 relative overflow-hidden transition hover:bg-white/[0.05]">
      <div className="absolute inset-0 opacity-50 pointer-events-none" style={{ background: "var(--gradient-radial-maroon)" }} />
      <div className="relative">
        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
        <div className={`mt-2 tabular-nums text-2xl md:text-3xl font-medium ${toneCls}`} style={{ fontFamily: "var(--font-mono)" }}>
          {value}
        </div>
        {hint != null && <div className="mt-1 text-xs text-muted-foreground tabular-nums">{hint}</div>}
      </div>
    </div>
  );
}
