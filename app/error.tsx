"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Root error boundary: data is safe, offer a reset. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <TriangleAlert className="size-10 text-warning" aria-hidden />
      <h1 className="font-display text-2xl font-semibold">
        {t("genericTitle")}
      </h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        {t("genericBody")}
      </p>
      <Button onClick={reset}>{t("reload")}</Button>
    </div>
  );
}
