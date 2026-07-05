"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Languages } from "lucide-react";
import { updateSettings } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Locale } from "@/types/database";

/**
 * Instant language switch: persists to settings + cookie; the server
 * action revalidates the RSC tree, so no full page reload happens.
 */
export function LanguageToggle() {
  const locale = useLocale() as Locale;
  const t = useTranslations("settings");
  const [pending, startTransition] = useTransition();

  const switchTo = (next: Locale) => {
    if (next === locale) return;
    startTransition(async () => {
      await updateSettings({ locale: next });
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("language")}
          disabled={pending}
        >
          <Languages className="size-4.5" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => switchTo("en")}
          data-active={locale === "en"}
          className="data-[active=true]:font-semibold"
        >
          {t("english")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => switchTo("ur")}
          data-active={locale === "ur"}
          className="data-[active=true]:font-semibold"
        >
          {t("urdu")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
