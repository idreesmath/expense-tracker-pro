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

  // A failed chunk/RSC fetch (stale tab after a deploy, poisoned SW
  // cache) can only be recovered by a full navigation — reset() would
  // just re-render into the same missing module.
  const isStaleBundle = /Loading chunk|ChunkLoadError|dynamically imported module|Failed to fetch/i.test(
    `${error.name} ${error.message}`
  );
  const retry = () => {
    if (isStaleBundle) window.location.reload();
    else reset();
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <TriangleAlert className="size-10 text-warning" aria-hidden />
      <h1 className="font-display text-2xl font-semibold">
        {t("genericTitle")}
      </h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        {t("genericBody")}
      </p>
      <Button onClick={retry}>{t("reload")}</Button>
    </div>
  );
}
