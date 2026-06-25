export function formatCurrency(value: number | null | undefined, currency = "USD") {
  const n = typeof value === "number" && !Number.isNaN(value) ? value : 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatNumber(value: number | null | undefined, digits = 2) {
  const n = typeof value === "number" && !Number.isNaN(value) ? value : 0;
  return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function formatPercent(value: number | null | undefined, digits = 1) {
  const n = typeof value === "number" && !Number.isNaN(value) ? value : 0;
  return `${n.toFixed(digits)}%`;
}

export function formatRR(value: number | null | undefined) {
  const n = typeof value === "number" && !Number.isNaN(value) ? value : 0;
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}R`;
}

export function shortDate(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function isoDay(d: Date) {
  // YYYY-MM-DD in local time
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
