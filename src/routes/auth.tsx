import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Sign in — Ironbook" }, { name: "description", content: "Sign in to your trading journal." }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [user, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created — you're signed in.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        toast.success("Check your inbox for a reset link.");
        setMode("signin");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    try {
      const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (res.error) toast.error(res.error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-60" style={{ background: "var(--gradient-radial-maroon)" }} />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl gradient-maroon maroon-glow flex items-center justify-center">
              <span style={{ fontFamily: "var(--font-display)" }} className="text-xl">I</span>
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-display)" }} className="text-2xl">Ironbook</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">ICT / SMC Trading Journal</div>
            </div>
          </div>
        </div>
        <div className="relative space-y-6">
          <h1 style={{ fontFamily: "var(--font-display)" }} className="text-5xl leading-tight max-w-md">
            Discipline is the edge.
            <span className="block italic text-accent">Track yours.</span>
          </h1>
          <p className="text-muted-foreground max-w-md leading-relaxed">
            A focused journal for ICT and SMC traders. Log setups, tag killzones, review charts, and watch your equity curve tell the truth.
          </p>
          <div className="grid grid-cols-3 gap-3 max-w-md">
            {[
              ["Setups", "HTF FVG, Opening Range"],
              ["Grading", "A+ down to F"],
              ["Analytics", "By pair, session, day"],
            ].map(([t, s]) => (
              <div key={t} className="glass rounded-lg p-3">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{t}</div>
                <div className="text-xs mt-1">{s}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-xs text-muted-foreground">© Ironbook</div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md glass-strong rounded-2xl p-8">
          <h2 style={{ fontFamily: "var(--font-display)" }} className="text-3xl">
            {mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your journal" : "Reset password"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "signin"
              ? "Sign in to continue tracking your edge."
              : mode === "signup"
              ? "Start logging trades in under a minute."
              : "We'll send you a link to set a new password."}
          </p>

          <button
            onClick={google}
            disabled={busy}
            className="mt-6 w-full glass rounded-lg py-2.5 text-sm flex items-center justify-center gap-2 hover:bg-white/[0.07] transition"
          >
            <GoogleIcon /> Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-white/10" /> or <div className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2.5 text-sm focus:outline-none focus:border-accent/60"
                placeholder="you@example.com"
              />
            </label>
            {mode !== "forgot" && (
              <label className="block">
                <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Password</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2.5 text-sm focus:outline-none focus:border-accent/60"
                  placeholder="••••••••"
                />
              </label>
            )}
            <button
              type="submit"
              disabled={busy}
              className="w-full mt-2 gradient-maroon maroon-glow rounded-lg py-2.5 text-sm text-primary-foreground disabled:opacity-60"
            >
              {busy ? "…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
            {mode === "signin" ? (
              <>
                <button onClick={() => setMode("forgot")} className="hover:text-foreground">Forgot password?</button>
                <button onClick={() => setMode("signup")} className="hover:text-foreground">Create account</button>
              </>
            ) : (
              <button onClick={() => setMode("signin")} className="hover:text-foreground">Back to sign in</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.5-11.3-8.4l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C40.6 36 44 30.5 44 24c0-1.3-.1-2.4-.4-3.5z"/>
    </svg>
  );
}
