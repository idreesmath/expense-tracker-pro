import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("errors");

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <BrandMark className="size-14 text-primary/40" />
      <p className="ledger-num text-6xl font-medium text-muted-foreground/40">
        404
      </p>
      <h1 className="font-display text-2xl font-semibold">
        {t("notFoundTitle")}
      </h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        {t("notFoundBody")}
      </p>
      <Button asChild>
        <Link href="/dashboard">{t("goHome")}</Link>
      </Button>
    </div>
  );
}
