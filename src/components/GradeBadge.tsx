const STYLES: Record<string, string> = {
  "A+": "gradient-maroon text-primary-foreground maroon-glow",
  "A": "bg-accent/30 text-foreground border border-accent/40",
  "B+": "bg-white/10 text-foreground border border-white/15",
  "B": "bg-white/[0.06] text-foreground border border-white/10",
  "C": "bg-white/[0.04] text-muted-foreground border border-white/8",
  "F": "bg-destructive/20 text-destructive-foreground border border-destructive/40",
};

export function GradeBadge({ grade }: { grade: string | null | undefined }) {
  if (!grade) return <span className="text-muted-foreground text-xs">—</span>;
  const cls = STYLES[grade] ?? STYLES["B"];
  return (
    <span className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-medium tabular-nums ${cls}`}>
      {grade}
    </span>
  );
}
