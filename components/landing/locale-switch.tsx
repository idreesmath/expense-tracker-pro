"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { Languages } from "lucide-react";
import { setLocaleCookie } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/types/database";

/** Language switch for signed-out pages (cookie only, no account). */
export function LocaleSwitch({ className }: { className?: string }) {
  const locale = useLocale() as Locale;
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await setLocaleCookie(locale === "en" ? "ur" : "en");
        })
      }
    >
      <Languages aria-hidden />
      {locale === "en" ? "اردو" : "English"}
    </Button>
  );
}
