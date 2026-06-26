import { useMemo, useState } from "react";
import { X } from "lucide-react";

export function CalculatorsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<"risk" | "position" | "rr">("risk");
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg glass-strong rounded-2xl border border-glass-border" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-glass-border">
          <h2 style={{ fontFamily: "var(--font-display)" }} className="text-xl">Calculators</h2>
          <button onClick={onClose}><X className="size-5 text-muted-foreground" /></button>
        </div>
        <div className="flex gap-1 px-5 pt-3">
          {(["risk", "position", "rr"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-xs rounded-md ${tab === t ? "gradient-maroon text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t === "risk" ? "Risk" : t === "position" ? "Position Size" : "RR"}
            </button>
          ))}
        </div>
        <div className="p-5">
          {tab === "risk" && <RiskCalc />}
          {tab === "position" && <PositionCalc />}
          {tab === "rr" && <RRCalc />}
        </div>
      </div>
    </div>
  );
}

function RiskCalc() {
  const [balance, setBalance] = useState("10000");
  const [risk, setRisk] = useState("1");
  const dollars = useMemo(() => (Number(balance || 0) * Number(risk || 0)) / 100, [balance, risk]);
  return (
    <div className="space-y-3">
      <Row label="Account balance"><Input value={balance} onChange={setBalance} /></Row>
      <Row label="Risk %"><Input value={risk} onChange={setRisk} /></Row>
      <Result label="Risk amount" value={`$${dollars.toFixed(2)}`} />
    </div>
  );
}

function PositionCalc() {
  const [balance, setBalance] = useState("10000");
  const [risk, setRisk] = useState("1");
  const [stopPips, setStopPips] = useState("20");
  const [pipValue, setPipValue] = useState("10");
  const lots = useMemo(() => {
    const dollars = (Number(balance) * Number(risk)) / 100;
    const denom = Number(stopPips) * Number(pipValue);
    return denom > 0 ? dollars / denom : 0;
  }, [balance, risk, stopPips, pipValue]);
  return (
    <div className="space-y-3">
      <Row label="Balance"><Input value={balance} onChange={setBalance} /></Row>
      <Row label="Risk %"><Input value={risk} onChange={setRisk} /></Row>
      <Row label="Stop (pips)"><Input value={stopPips} onChange={setStopPips} /></Row>
      <Row label="Pip value per lot"><Input value={pipValue} onChange={setPipValue} /></Row>
      <Result label="Position size (lots)" value={lots.toFixed(2)} />
    </div>
  );
}

function RRCalc() {
  const [entry, setEntry] = useState("");
  const [sl, setSl] = useState("");
  const [tp, setTp] = useState("");
  const rr = useMemo(() => {
    const e = Number(entry), s = Number(sl), t = Number(tp);
    if (!e || !s || !t) return 0;
    const risk = Math.abs(e - s);
    const reward = Math.abs(t - e);
    return risk > 0 ? reward / risk : 0;
  }, [entry, sl, tp]);
  return (
    <div className="space-y-3">
      <Row label="Entry"><Input value={entry} onChange={setEntry} /></Row>
      <Row label="Stop Loss"><Input value={sl} onChange={setSl} /></Row>
      <Row label="Take Profit"><Input value={tp} onChange={setTp} /></Row>
      <Result label="Risk : Reward" value={`${rr.toFixed(2)}R`} />
    </div>
  );
}

const inputCls = "w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-accent/60";
function Input({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <input className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} inputMode="decimal" />;
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
function Result({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl glass-maroon p-4 mt-2">
      <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div style={{ fontFamily: "var(--font-display)" }} className="text-3xl mt-1 tabular-nums">{value}</div>
    </div>
  );
}
