import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bot, Sparkles } from "lucide-react";
import { chatThreadsQuery } from "@/lib/chat-queries";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/assistant/")({
  component: AssistantIndex,
});

function AssistantIndex() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: threads } = useQuery(chatThreadsQuery());

  const createThread = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in required");
      const { data, error } = await supabase
        .from("chat_threads").insert({ user_id: user.id, title: "New chat" }).select("id").single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["chat_threads"] });
      navigate({ to: "/assistant/$threadId", params: { threadId: id } });
    },
  });

  useEffect(() => {
    if (threads && threads.length > 0) {
      navigate({ to: "/assistant/$threadId", params: { threadId: threads[0].id }, replace: true });
    }
  }, [threads, navigate]);

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="glass-strong rounded-2xl p-10 text-center max-w-md">
        <div className="mx-auto size-14 rounded-full gradient-maroon flex items-center justify-center mb-4">
          <Bot className="size-7" />
        </div>
        <h1 style={{ fontFamily: "var(--font-display)" }} className="text-3xl">Log trades by chatting</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Describe a trade — text or voice — and I'll fill out the journal for you. Review, tweak, save.
        </p>
        <button
          onClick={() => createThread.mutate()}
          disabled={createThread.isPending}
          className="mt-6 inline-flex items-center gap-2 gradient-maroon maroon-glow rounded-lg px-5 py-2.5 text-sm"
        >
          <Sparkles className="size-4" /> Start a conversation
        </button>
      </div>
    </div>
  );
}
