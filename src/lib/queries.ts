import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TradeRow } from "@/lib/trade-stats";

export const tradesQuery = (accountId?: string | null) =>
  queryOptions({
    queryKey: ["trades", { accountId: accountId ?? "all" }],
    queryFn: async (): Promise<TradeRow[]> => {
      let q = supabase
        .from("trades")
        .select(
          "id,pair,direction,trade_date,session,rr_achieved,risk_percent,pnl,result,grade,model,model_id,account_id,created_at",
        )
        .order("trade_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (accountId) q = q.eq("account_id", accountId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as TradeRow[];
    },
  });

export const tradesFullQuery = (accountId?: string | null) =>
  queryOptions({
    queryKey: ["trades", "full", { accountId: accountId ?? "all" }],
    queryFn: async () => {
      let q = supabase
        .from("trades")
        .select("*")
        .order("trade_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (accountId) q = q.eq("account_id", accountId);
      const { data, error } = await q;
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

export const accountsQuery = () =>
  queryOptions({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

export const modelsQuery = () =>
  queryOptions({
    queryKey: ["models"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trading_models")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export const reviewsQuery = () =>
  queryOptions({
    queryKey: ["reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("period_end", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export const mistakesQuery = () =>
  queryOptions({
    queryKey: ["mistakes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mistakes")
        .select("*")
        .order("label", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

export const checklistsQuery = () =>
  queryOptions({
    queryKey: ["checklists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checklists")
        .select("*, items:checklist_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
