import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Upload, KeyRound, User as UserIcon, Loader2 } from "lucide-react";
import { profileQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — TradeBook" }] }),
  component: Settings,
});

function Settings() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: profile } = useQuery(profileQuery());

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [timezone, setTimezone] = useState("");
  const [startingBalance, setStartingBalance] = useState("10000");
  const [currency, setCurrency] = useState("USD");
  const [avatarSignedUrl, setAvatarSignedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setUsername((profile as any).username ?? "");
      setTimezone((profile as any).timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone);
      setStartingBalance(String(profile.starting_balance ?? 10000));
      setCurrency(profile.currency ?? "USD");
    } else if (!timezone) {
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
  }, [profile]);

  // Refresh signed avatar URL
  useEffect(() => {
    (async () => {
      if (!profile?.avatar_url) { setAvatarSignedUrl(null); return; }
      const { data } = await supabase.storage.from("avatars").createSignedUrl(profile.avatar_url, 3600);
      setAvatarSignedUrl(data?.signedUrl ?? null);
    })();
  }, [profile?.avatar_url]);

  const saveProfile = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        display_name: displayName || null,
        username: username || null,
        timezone: timezone || null,
        starting_balance: Number(startingBalance) || 0,
        currency,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["profile"] }); toast.success("Profile saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) return toast.error("Please pick an image");
    if (file.size > 4 * 1024 * 1024) return toast.error("Max 4MB");
    setUploading(true);
    try {
      const path = `${user.id}/avatar-${Date.now()}.${file.name.split(".").pop() ?? "png"}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { error: pErr } = await supabase.from("profiles").upsert({ id: user.id, avatar_url: path } as any);
      if (pErr) throw pErr;
      await qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Photo updated");
    } catch (err: any) { toast.error(err.message); } finally { setUploading(false); }
  }

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-3xl mx-auto space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Settings</p>
        <h1 style={{ fontFamily: "var(--font-display)" }} className="text-4xl md:text-5xl mt-1">Account</h1>
      </div>

      {/* Profile */}
      <section className="glass-strong rounded-2xl p-6 space-y-5">
        <h2 style={{ fontFamily: "var(--font-display)" }} className="text-2xl flex items-center gap-2">
          <UserIcon className="size-5 text-accent" /> Personal details
        </h2>

        <div className="flex items-center gap-4">
          <div className="size-20 rounded-full overflow-hidden bg-white/[0.06] border border-white/10 flex items-center justify-center">
            {avatarSignedUrl ? (
              <img src={avatarSignedUrl} alt="Avatar" className="size-full object-cover" />
            ) : (
              <UserIcon className="size-8 text-muted-foreground" />
            )}
          </div>
          <label className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm cursor-pointer hover:bg-white/[0.04]">
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {uploading ? "Uploading…" : "Change photo"}
            <input type="file" accept="image/*" className="hidden" onChange={onAvatarChange} disabled={uploading} />
          </label>
        </div>

        <Field label="Email">
          <input disabled value={user?.email ?? ""} className="w-full rounded-lg bg-white/[0.02] border border-white/5 px-3 py-2 text-sm text-muted-foreground" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Display name">
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Username">
            <input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))} placeholder="e.g. alex_ict" className={inputCls} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Time zone">
            <input value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="e.g. Asia/Karachi" className={inputCls} />
          </Field>
          <Field label="Currency">
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputCls}>
              {["USD","EUR","GBP","JPY","AUD","CAD","CHF","INR","PKR","AED"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Starting balance">
          <input value={startingBalance} onChange={(e) => setStartingBalance(e.target.value)} className={inputCls} />
        </Field>
        <button
          onClick={() => saveProfile.mutate()}
          disabled={saveProfile.isPending}
          className="gradient-maroon maroon-glow rounded-lg px-5 py-2 text-sm inline-flex items-center gap-2"
        >
          {saveProfile.isPending && <Loader2 className="size-4 animate-spin" />}
          Save changes
        </button>
      </section>

      <PasswordSection email={user?.email ?? ""} />
    </div>
  );
}

const inputCls = "w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-accent/60";

function Field({ label, children }: { label: string; children: any }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const labels = ["Too short", "Weak", "Fair", "Good", "Strong", "Excellent"];
  const colors = ["bg-loss", "bg-loss", "bg-orange-500", "bg-yellow-500", "bg-win", "bg-win"];
  return { score: s, label: labels[s], color: colors[s] };
}

function PasswordSection({ email }: { email: string }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const strength = passwordStrength(next);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 8) return toast.error("Password must be at least 8 characters");
    if (next !== confirm) return toast.error("Passwords do not match");
    if (strength.score < 3) return toast.error("Choose a stronger password");
    setBusy(true);
    try {
      // Re-verify current password
      const { error: signErr } = await supabase.auth.signInWithPassword({ email, password: current });
      if (signErr) throw new Error("Current password is incorrect");
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) throw error;
      toast.success("Password updated");
      setCurrent(""); setNext(""); setConfirm("");
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="glass-strong rounded-2xl p-6 space-y-4">
      <h2 style={{ fontFamily: "var(--font-display)" }} className="text-2xl flex items-center gap-2">
        <KeyRound className="size-5 text-accent" /> Password
      </h2>
      <Field label="Current password">
        <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required className={inputCls} autoComplete="current-password" />
      </Field>
      <Field label="New password">
        <input type="password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={8} className={inputCls} autoComplete="new-password" />
      </Field>
      {next && (
        <div className="space-y-1">
          <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
            <div className={`h-full transition-all ${strength.color}`} style={{ width: `${(strength.score / 5) * 100}%` }} />
          </div>
          <p className="text-[11px] text-muted-foreground">{strength.label}</p>
        </div>
      )}
      <Field label="Confirm new password">
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className={inputCls} autoComplete="new-password" />
      </Field>
      <button
        disabled={busy}
        className="gradient-maroon maroon-glow rounded-lg px-5 py-2 text-sm inline-flex items-center gap-2 disabled:opacity-60"
      >
        {busy && <Loader2 className="size-4 animate-spin" />}
        Update password
      </button>
    </form>
  );
}
