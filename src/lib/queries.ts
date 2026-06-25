import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TradeRow } from "@/lib/trade-stats";

export const tradesQuery = () =>
  queryOptions({
    queryKey: ["trades"],
    queryFn: async (): Promise<TradeRow[]> => {
      const { data, error } = await supabase
        .from("trades")
        .select("id,pair,direction,trade_date,session,rr_achieved,risk_percent,pnl,result,grade,model,created_at")
        .order("trade_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TradeRow[];
    },
  });

export const tradesFullQuery = () =>
  queryOptions({
    queryKey: ["trades", "full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .order("trade_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export const profileQuery = () =>
  queryOptions({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const settingsQuery = () =>
  queryOptions({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .eq("user_id", u.user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
