import * as Dialog from "@radix-ui/react-dialog";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const GROUPS: { title: string; items: { keys: string[]; label: string }[] }[] = [
  {
    title: "Global",
    items: [
      { keys: ["⌘", "K"], label: "Open command palette" },
      { keys: ["Ctrl", "K"], label: "Open command palette (Windows)" },
      { keys: ["/"], label: "Focus search" },
      { keys: ["?"], label: "Show this help" },
      { keys: ["Esc"], label: "Close any dialog" },
    ],
  },
  {
    title: "Actions",
    items: [
      { keys: ["N"], label: "New trade" },
      { keys: ["C"], label: "Open calculators" },
      { keys: ["T"], label: "Toggle light / dark theme" },
    ],
  },
  {
    title: "Go to",
    items: [
      { keys: ["G", "D"], label: "Dashboard" },
      { keys: ["G", "J"], label: "Journal" },
      { keys: ["G", "A"], label: "Analytics" },
      { keys: ["G", "C"], label: "Calendar" },
      { keys: ["G", "R"], label: "Reviews" },
      { keys: ["G", "S"], label: "Settings" },
    ],
  },
];

export function ShortcutsHelp({ open, onOpenChange }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed z-[91] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-lg glass-strong rounded-2xl border border-glass-border p-6 outline-none">
          <Dialog.Title style={{ fontFamily: "var(--font-display)" }} className="text-2xl">Keyboard shortcuts</Dialog.Title>
          <Dialog.Description className="text-xs text-muted-foreground mt-1">Move around TradeBook without touching your mouse.</Dialog.Description>
          <div className="mt-5 space-y-5 max-h-[65vh] overflow-y-auto">
            {GROUPS.map((g) => (
              <div key={g.title}>
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">{g.title}</div>
                <div className="space-y-1.5">
                  {g.items.map((it) => (
                    <div key={it.label} className="flex items-center justify-between text-sm rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2">
                      <span className="text-muted-foreground">{it.label}</span>
                      <span className="flex items-center gap-1">
                        {it.keys.map((k, i) => (
                          <kbd key={i} className="rounded border border-white/10 bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-mono">{k}</kbd>
                        ))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-end">
            <button onClick={() => onOpenChange(false)} className="rounded-lg gradient-maroon px-4 py-2 text-sm">Close</button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
