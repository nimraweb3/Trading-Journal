import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { profileQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Ironbook" }] }),
  component: Settings,
});

function Settings() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: profile } = useQuery(profileQuery());
  const [displayName, setDisplayName] = useState("");
  const [startingBalance, setStartingBalance] = useState("10000");
  const [currency, setCurrency] = useState("USD");

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setStartingBalance(String(profile.starting_balance ?? 10000));
      setCurrency(profile.currency ?? "USD");
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        display_name: displayName || null,
        starting_balance: Number(startingBalance) || 0,
        currency,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Settings saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-3xl mx-auto space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Settings</p>
        <h1 style={{ fontFamily: "var(--font-display)" }} className="text-4xl md:text-5xl mt-1">Account</h1>
      </div>

      <div className="glass-strong rounded-2xl p-6 space-y-4">
        <h2 style={{ fontFamily: "var(--font-display)" }} className="text-2xl">Profile</h2>
        <Field label="Email">
          <input disabled value={user?.email ?? ""} className="w-full rounded-lg bg-white/[0.02] border border-white/5 px-3 py-2 text-sm text-muted-foreground" />
        </Field>
        <Field label="Display name">
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Starting balance">
            <input value={startingBalance} onChange={(e) => setStartingBalance(e.target.value)} className="w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
          </Field>
          <Field label="Currency">
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm">
              {["USD","EUR","GBP","JPY","AUD","CAD","CHF"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="gradient-maroon maroon-glow rounded-lg px-5 py-2 text-sm"
        >
          {save.isPending ? "Saving…" : "Save changes"}
        </button>
      </div>

      <div className="glass-strong rounded-2xl p-6">
        <h2 style={{ fontFamily: "var(--font-display)" }} className="text-2xl">Theme</h2>
        <p className="text-sm text-muted-foreground mt-1">Premium dark mode with maroon accent. Light mode coming soon.</p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: any }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
