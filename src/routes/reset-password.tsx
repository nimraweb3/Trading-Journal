import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated.");
      navigate({ to: "/dashboard" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm glass-strong rounded-2xl p-8 space-y-4">
        <h1 style={{ fontFamily: "var(--font-display)" }} className="text-3xl">Set a new password</h1>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          className="w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2.5 text-sm focus:outline-none focus:border-accent/60"
        />
        <button disabled={busy} className="w-full gradient-maroon maroon-glow rounded-lg py-2.5 text-sm">
          {busy ? "…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
