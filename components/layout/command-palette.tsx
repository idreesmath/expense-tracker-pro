"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { HandCoins, Languages, Moon, ReceiptText } from "lucide-react";
import { useAppData } from "@/components/app-context";
import { updateSettings } from "@/actions/settings";
import { Money } from "@/components/money";
import { formatDate } from "@/lib/format";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import type { Locale, Transaction } from "@/types/database";

/**
 * Ctrl/⌘+K palette: page navigation, quick actions and a live global
 * search across descriptions, notes, amounts and dates.
 */
export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const locale = useLocale() as Locale;
  const t = useTranslations("palette");
  const tn = useTranslations("nav");
  const { openEntry } = useAppData();
  const { resolvedTheme, setTheme } = useTheme();
  const [query, setQuery] = useState("");

  const { data: results } = useQuery<Transaction[]>({
    queryKey: ["palette-search", query],
    enabled: open && query.trim().length >= 2,
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const run = (fn: () => void) => {
    onOpenChange(false);
    fn();
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={(next: boolean) => {
        if (!next) setQuery("");
        onOpenChange(next);
      }}
      title={t("placeholder")}
      description={t("hint", { kbd: "Ctrl K" })}
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder={t("placeholder")}
      />
      <CommandList>
        <CommandEmpty>{t("noResults")}</CommandEmpty>

        {results && results.length > 0 && (
          <CommandGroup heading={t("results")}>
            {results.map((tx) => (
              <CommandItem
                key={`${tx.type}-${tx.id}`}
                // Include the live query so cmdk's filter always keeps
                // server-side matches visible.
                value={`${query} ${tx.description} ${tx.id}`}
                onSelect={() =>
                  run(() =>
                    router.push(tx.type === "expense" ? "/expenses" : "/income")
                  )
                }
              >
                {tx.type === "expense" ? (
                  <ReceiptText aria-hidden />
                ) : (
                  <HandCoins aria-hidden />
                )}
                <span className="min-w-0 flex-1 truncate">{tx.description}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(tx.occurred_on, locale)}
                </span>
                <Money
                  amount={tx.amount}
                  currency={tx.currency}
                  flow={tx.type}
                  signed
                  className="text-xs"
                />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading={t("actions")}>
          <CommandItem onSelect={() => run(() => openEntry("expense"))}>
            <ReceiptText aria-hidden /> {t("newExpense")}
          </CommandItem>
          <CommandItem onSelect={() => run(() => openEntry("income"))}>
            <HandCoins aria-hidden /> {t("newIncome")}
          </CommandItem>
          <CommandItem
            onSelect={() =>
              run(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))
            }
          >
            <Moon aria-hidden /> {t("switchTheme")}
          </CommandItem>
          <CommandItem
            onSelect={() =>
              run(() => {
                void updateSettings({ locale: locale === "en" ? "ur" : "en" });
              })
            }
          >
            <Languages aria-hidden /> {t("switchLanguage")}
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={t("pages")}>
          {NAV_ITEMS.map((item) => (
            <CommandItem
              key={item.href}
              onSelect={() => run(() => router.push(item.href))}
            >
              <item.icon aria-hidden /> {tn(item.key)}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
