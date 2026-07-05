"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppContextProvider } from "@/components/app-context";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { CommandPalette } from "@/components/layout/command-palette";
import { EntryDialog } from "@/components/ledger/entry-dialog";
import { Fab } from "@/components/layout/fab";
import type {
  AppNotification,
  Category,
  LedgerEntry,
  PaymentMethod,
  Profile,
  Settings,
  TransactionType,
} from "@/types/database";

const SIDEBAR_KEY = "etp:sidebar-collapsed";

export function AppShell({
  profile,
  settings,
  email,
  categories,
  paymentMethods,
  notifications,
  children,
}: {
  profile: Profile;
  settings: Settings;
  email: string;
  categories: Category[];
  paymentMethods: PaymentMethod[];
  notifications: AppNotification[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [entry, setEntry] = useState<{
    kind: TransactionType;
    record?: LedgerEntry;
  } | null>(null);

  // Restore the persisted sidebar state after hydration; reading
  // localStorage during render would desync server and client HTML.
  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_KEY) === "1";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot hydration of persisted UI state
    if (stored) setCollapsed(true);
  }, []);

  const toggleSidebar = useCallback(() => {
    setCollapsed((c) => {
      localStorage.setItem(SIDEBAR_KEY, c ? "0" : "1");
      return !c;
    });
  }, []);

  const openEntry = useCallback(
    (kind: TransactionType, record?: LedgerEntry) => setEntry({ kind, record }),
    []
  );
  const openPalette = useCallback(() => setPaletteOpen(true), []);

  // Keyboard shortcuts: Ctrl/⌘+K palette; g+<key> navigation; n+e/n+i quick add.
  useEffect(() => {
    let prefix: "g" | "n" | null = null;
    let timer: ReturnType<typeof setTimeout>;

    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
        return;
      }
      const target = e.target as HTMLElement;
      if (
        target.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
      ) {
        return;
      }
      const key = e.key.toLowerCase();
      if (prefix === "g") {
        const routes: Record<string, string> = {
          d: "/dashboard",
          e: "/expenses",
          i: "/income",
          t: "/transactions",
          b: "/budgets",
          a: "/analytics",
          r: "/reports",
          s: "/settings",
        };
        if (routes[key]) router.push(routes[key]);
        prefix = null;
        return;
      }
      if (prefix === "n") {
        if (key === "e") openEntry("expense");
        if (key === "i") openEntry("income");
        prefix = null;
        return;
      }
      if (key === "g" || key === "n") {
        prefix = key;
        clearTimeout(timer);
        timer = setTimeout(() => (prefix = null), 1200);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(timer);
    };
  }, [router, openEntry]);

  const appData = useMemo(
    () => ({
      profile,
      settings,
      email,
      categories,
      paymentMethods,
      openEntry,
      openPalette,
    }),
    [profile, settings, email, categories, paymentMethods, openEntry, openPalette]
  );

  return (
    <AppContextProvider value={appData}>
      <div className="flex min-h-dvh">
        <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header notifications={notifications} />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>

      <Fab />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      {entry ? (
        <EntryDialog
          kind={entry.kind}
          record={entry.record}
          open
          onOpenChange={(open) => !open && setEntry(null)}
        />
      ) : null}
    </AppContextProvider>
  );
}
