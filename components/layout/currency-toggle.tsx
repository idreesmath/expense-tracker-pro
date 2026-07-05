"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { updateSettings } from "@/actions/settings";
import { useMoney } from "@/components/money-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CurrencyCode } from "@/types/database";

/** Display-currency switch — every balance recalculates on change. */
export function CurrencyToggle() {
  const { display } = useMoney();
  const t = useTranslations("settings");
  const [pending, startTransition] = useTransition();

  const switchTo = (next: CurrencyCode) => {
    if (next === display) return;
    startTransition(async () => {
      await updateSettings({ currency: next });
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("displayCurrency")}
          disabled={pending}
          className="ledger-num text-sm font-semibold"
        >
          {display === "USD" ? "$" : "₨"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => switchTo("USD")}
          data-active={display === "USD"}
          className="data-[active=true]:font-semibold"
        >
          <span className="ledger-num">$</span> US Dollar
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => switchTo("PKR")}
          data-active={display === "PKR"}
          className="data-[active=true]:font-semibold"
        >
          <span className="ledger-num">₨</span> Pakistani Rupee
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
