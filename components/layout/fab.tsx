"use client";

import { useTranslations } from "next-intl";
import { HandCoins, Plus, ReceiptText } from "lucide-react";
import { useAppData } from "@/components/app-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Floating quick-add: one tap to a new expense or income anywhere. */
export function Fab() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const { openEntry } = useAppData();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon-lg"
          aria-label={tc("add")}
          className="fixed bottom-6 end-6 z-40 size-13 rounded-full shadow-lg shadow-primary/25 transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="size-6" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="mb-1 w-48">
        <DropdownMenuItem onClick={() => openEntry("expense")}>
          <ReceiptText aria-hidden /> {t("quickAddExpense")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openEntry("income")}>
          <HandCoins aria-hidden /> {t("quickAddIncome")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
