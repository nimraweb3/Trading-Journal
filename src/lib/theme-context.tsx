import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "dark" | "light" | "system";
type Resolved = "dark" | "light";

interface Ctx {
  theme: Theme;
  resolved: Resolved;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

const ThemeCtx = createContext<Ctx>({
  theme: "dark",
  resolved: "dark",
  setTheme: () => {},
  toggle: () => {},
});

const KEY = "tradebook.theme";

function resolve(t: Theme): Resolved {
  if (t !== "system") return t;
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function apply(r: Resolved) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  if (r === "light") el.classList.add("light");
  else el.classList.remove("light");
  el.style.colorScheme = r;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    return (window.localStorage.getItem(KEY) as Theme | null) ?? "dark";
  });
  const [resolved, setResolved] = useState<Resolved>(() => resolve(theme));

  useEffect(() => {
    const r = resolve(theme);
    setResolved(r);
    apply(r);
    if (typeof window !== "undefined") window.localStorage.setItem(KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== "system" || typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const handler = () => {
      const r: Resolved = mq.matches ? "light" : "dark";
      setResolved(r);
      apply(r);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = (t: Theme) => setThemeState(t);
  const toggle = () => setThemeState(resolved === "dark" ? "light" : "dark");

  return (
    <ThemeCtx.Provider value={{ theme, resolved, setTheme, toggle }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeCtx);
}
