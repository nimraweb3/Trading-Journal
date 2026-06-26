import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { accountsQuery } from "@/lib/queries";

interface AccountCtx {
  accounts: any[];
  activeAccountId: string | null; // null = "All accounts"
  activeAccount: any | null;
  setActiveAccountId: (id: string | null) => void;
  loading: boolean;
}

const Ctx = createContext<AccountCtx>({
  accounts: [],
  activeAccountId: null,
  activeAccount: null,
  setActiveAccountId: () => {},
  loading: true,
});

const STORAGE_KEY = "ironbook.activeAccountId";

export function AccountProvider({ children }: { children: ReactNode }) {
  const { data: accounts = [], isLoading } = useQuery(accountsQuery());
  const [activeAccountId, setActive] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(STORAGE_KEY);
  });

  useEffect(() => {
    if (!accounts.length) return;
    if (activeAccountId && !accounts.find((a) => a.id === activeAccountId)) {
      // selected account no longer exists; default to first
      setActive(accounts[0].id);
    }
  }, [accounts, activeAccountId]);

  const setActiveAccountId = (id: string | null) => {
    setActive(id);
    if (typeof window === "undefined") return;
    if (id) window.localStorage.setItem(STORAGE_KEY, id);
    else window.localStorage.removeItem(STORAGE_KEY);
  };

  const activeAccount = useMemo(
    () => accounts.find((a) => a.id === activeAccountId) ?? null,
    [accounts, activeAccountId],
  );

  return (
    <Ctx.Provider value={{ accounts, activeAccountId, activeAccount, setActiveAccountId, loading: isLoading }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAccountContext() {
  return useContext(Ctx);
}
