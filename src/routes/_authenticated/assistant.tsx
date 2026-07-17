import { createFileRoute, Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Bot, MessageSquare } from "lucide-react";
import { chatThreadsQuery } from "@/lib/chat-queries";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({ meta: [{ title: "AI Assistant — TradeBook" }] }),
  component: AssistantLayout,
});

function AssistantLayout() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { data: threads = [] } = useQuery(chatThreadsQuery());

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
    onError: (e: any) => toast.error(e.message),
  });

  const deleteThread = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("chat_threads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat_threads"] }),
  });

  const activeId = pathname.startsWith("/assistant/") ? pathname.split("/")[2] : null;

  return (
    <div className="flex h-[calc(100vh-64px)] max-w-7xl mx-auto">
      <aside className="w-64 shrink-0 border-r border-white/10 flex flex-col">
        <div className="p-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Bot className="size-4 text-accent" />
            <span style={{ fontFamily: "var(--font-display)" }} className="text-lg">AI Coach</span>
          </div>
          <button
            onClick={() => createThread.mutate()}
            className="rounded-lg gradient-maroon maroon-glow p-1.5"
            title="New chat"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {threads.length === 0 ? (
            <p className="text-xs text-muted-foreground p-3">No conversations yet. Start one.</p>
          ) : threads.map((t) => (
            <div key={t.id} className="group flex items-center gap-1">
              <Link
                to="/assistant/$threadId"
                params={{ threadId: t.id }}
                className={`flex-1 flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm truncate ${activeId === t.id ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"}`}
              >
                <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{t.title || "New chat"}</span>
              </Link>
              <button
                onClick={() => { if (confirm("Delete this chat?")) deleteThread.mutate(t.id); }}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-loss"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      </aside>
      <main className="flex-1 min-w-0"><Outlet /></main>
    </div>
  );
}
