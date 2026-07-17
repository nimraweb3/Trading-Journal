import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const chatThreadsQuery = () =>
  queryOptions({
    queryKey: ["chat_threads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_threads")
        .select("id,title,created_at,updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export const chatMessagesQuery = (threadId: string | null) =>
  queryOptions({
    queryKey: ["chat_messages", threadId ?? "none"],
    enabled: !!threadId,
    queryFn: async () => {
      if (!threadId) return [];
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id,role,parts,created_at")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
